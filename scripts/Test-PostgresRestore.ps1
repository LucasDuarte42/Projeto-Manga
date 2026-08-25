[CmdletBinding()]
param(
    [string]$Repository = "LucasDuarte42/Projeto-Manga",
    [string]$Workflow = "postgres-backup.yml",
    [long]$RunId = 0,
    [string]$RestoreDatabaseUrl = $env:RESTORE_DATABASE_URL,
    [string]$EncryptionKey = $env:BACKUP_ENCRYPTION_KEY,
    [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\restore-drill-results"),
    [switch]$KeepFiles
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$startedAt = Get-Date
$timestamp = $startedAt.ToUniversalTime().ToString("yyyyMMdd-HHmmss")
$runDirectory = Join-Path $OutputDirectory $timestamp
$artifactDirectory = Join-Path $runDirectory "artifact"
$dumpPath = Join-Path $runDirectory "restore.dump"
$reportPath = Join-Path $runDirectory "restore-report.json"
$logPath = Join-Path $runDirectory "restore.log"

New-Item -ItemType Directory -Force -Path $runDirectory, $artifactDirectory | Out-Null
Start-Transcript -Path $logPath -Force | Out-Null

function Fail([string]$Message) {
    Write-Error $Message
    throw $Message
}

function Require-Command([string]$Name, [string[]]$FallbackPaths = @()) {
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }

    foreach ($path in $FallbackPaths) {
        if (Test-Path $path) { return $path }
    }

    Fail "Comando não encontrado: $Name. Instale o cliente correspondente ou configure o PATH."
}

function Invoke-Native([string]$FilePath, [string[]]$Arguments) {
    $safeArguments = $Arguments | ForEach-Object {
        if ($_ -like "--dbname=*") { "--dbname=<redacted>" } else { $_ }
    }
    Write-Host "> $FilePath $($safeArguments -join ' ')"
    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        Fail "O comando falhou com código ${LASTEXITCODE}: $FilePath"
    }
}

function Invoke-Psql([string]$PsqlPath, [string]$Sql) {
    $output = & $PsqlPath $RestoreDatabaseUrl --no-psqlrc --tuples-only --no-align --command $Sql 2>&1
    if ($LASTEXITCODE -ne 0) {
        Fail "A validação SQL falhou: $($output -join [Environment]::NewLine)"
    }
    return ($output -join "`n").Trim()
}

try {
    if ([string]::IsNullOrWhiteSpace($RestoreDatabaseUrl)) {
        Fail "Defina RESTORE_DATABASE_URL com a URL do banco de teste."
    }
    if ([string]::IsNullOrWhiteSpace($EncryptionKey)) {
        Fail "Defina BACKUP_ENCRYPTION_KEY no ambiente. A chave não deve ser passada no histórico do terminal."
    }

    $ghPath = Require-Command "gh"
    $opensslPath = Require-Command "openssl.exe" @(
        "C:\Program Files\Git\usr\bin\openssl.exe",
        "C:\Program Files\OpenSSL-Win64\bin\openssl.exe"
    )
    $pgRestorePath = Require-Command "pg_restore.exe" @(
        "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe"
    )
    $psqlPath = Require-Command "psql.exe" @(
        "C:\Program Files\PostgreSQL\17\bin\psql.exe"
    )

    $productionCandidates = @(
        $env:DATABASE_URL,
        $env:BACKUP_DATABASE_URL,
        $env:PRODUCTION_DATABASE_URL
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

    foreach ($productionUrl in $productionCandidates) {
        if ($RestoreDatabaseUrl -eq $productionUrl) {
            Fail "ABORTADO: a URL de restauração coincide com uma URL de produção ou backup."
        }
    }

    if ($RestoreDatabaseUrl -notmatch "sslmode=require|sslmode=verify-full|channel_binding=require") {
        Write-Warning "A URL do destino não indica conexão TLS. Confirme que o banco de teste usa SSL antes de continuar."
    }

    $authStatus = & $ghPath auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Fail "O GitHub CLI não está autenticado. Execute 'gh auth login' uma vez antes de agendar o script."
    }

    if ($RunId -eq 0) {
        $runIdText = & $ghPath run list --repo $Repository --workflow $Workflow --status success --limit 1 --json databaseId --jq '.[0].databaseId'
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace(($runIdText -join "").Trim())) {
            Fail "Não foi possível localizar uma execução bem-sucedida do workflow $Workflow."
        }
        $RunId = [long](($runIdText -join "").Trim())
    }

    Write-Host "Usando execução bem-sucedida: $RunId"
    $artifactName = "postgres-backup-$RunId"
    Invoke-Native $ghPath @(
        "run", "download", "$RunId",
        "--repo", $Repository,
        "--name", $artifactName,
        "--dir", $artifactDirectory
    )

    $encryptedDump = Get-ChildItem -Path $artifactDirectory -Filter "*.dump.enc" -File -Recurse | Select-Object -First 1
    if (-not $encryptedDump) {
        Fail "O artefato não contém um arquivo .dump.enc."
    }

    Invoke-Native $opensslPath @(
        "enc", "-d", "-aes-256-cbc", "-pbkdf2",
        "-in", $encryptedDump.FullName,
        "-out", $dumpPath,
        "-pass", "env:BACKUP_ENCRYPTION_KEY"
    )

    if (-not (Test-Path $dumpPath) -or (Get-Item $dumpPath).Length -eq 0) {
        Fail "O dump descriptografado não foi criado ou está vazio."
    }

    $restoreArguments = @(
        "--dbname=$RestoreDatabaseUrl",
        "--clean",
        "--if-exists",
        "--no-owner",
        "--no-acl",
        $dumpPath
    )
    Invoke-Native $pgRestorePath $restoreArguments

    $databaseName = Invoke-Psql $psqlPath "SELECT current_database();"
    $tableCount = [int](Invoke-Psql $psqlPath "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';")
    $migrationTableCount = [int](Invoke-Psql $psqlPath "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = '_prisma_migrations';")
    $nonEmptyTables = [int](Invoke-Psql $psqlPath "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';")

    if ($tableCount -lt 1) {
        Fail "A restauração terminou, mas nenhuma tabela pública foi encontrada."
    }

    $finishedAt = Get-Date
    $report = [ordered]@{
        status = "success"
        repository = $Repository
        workflow = $Workflow
        runId = $RunId
        database = $databaseName
        publicTableCount = $tableCount
        prismaMigrationTableFound = ($migrationTableCount -eq 1)
        validation = "pg_restore concluído e tabelas públicas encontradas"
        startedAtUtc = $startedAt.ToUniversalTime().ToString("o")
        finishedAtUtc = $finishedAt.ToUniversalTime().ToString("o")
        durationSeconds = [math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)
    }
    $report | ConvertTo-Json -Depth 4 | Set-Content -Path $reportPath -Encoding UTF8
    Write-Host "Restauração validada com sucesso. Relatório: $reportPath"
}
catch {
    $finishedAt = Get-Date
    $failureReport = [ordered]@{
        status = "failure"
        repository = $Repository
        workflow = $Workflow
        runId = $RunId
        error = $_.Exception.Message
        startedAtUtc = $startedAt.ToUniversalTime().ToString("o")
        finishedAtUtc = $finishedAt.ToUniversalTime().ToString("o")
        durationSeconds = [math]::Round(($finishedAt - $startedAt).TotalSeconds, 2)
    }
    $failureReport | ConvertTo-Json -Depth 4 | Set-Content -Path $reportPath -Encoding UTF8
    Write-Error "Teste de restauração falhou. Relatório: $reportPath"
    exit 1
}
finally {
    try { Stop-Transcript | Out-Null } catch { }
    if (-not $KeepFiles) {
        Remove-Item -Path $artifactDirectory -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path $dumpPath -Force -ErrorAction SilentlyContinue
    }
}
