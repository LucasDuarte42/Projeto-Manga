# Teste periódico de restauração PostgreSQL

Este procedimento executa um teste de recuperação em um banco PostgreSQL separado. Ele baixa o último artefato bem-sucedido do workflow `PostgreSQL backup`, descriptografa o dump, restaura o conteúdo no banco de teste e valida a existência de tabelas públicas e da tabela `_prisma_migrations`.

> **Regra de segurança:** nunca use `DATABASE_URL`, `BACKUP_DATABASE_URL` ou a URL de produção como `RESTORE_DATABASE_URL`. O script interrompe a execução quando consegue identificar que o destino é igual a uma dessas URLs.

## Pré-requisitos

A máquina que executa o teste precisa ter o GitHub CLI autenticado, OpenSSL e o cliente PostgreSQL 17 ou superior. O GitHub CLI deve ter permissão para ler o repositório e baixar artefatos.

```powershell
gh auth status
& "C:\Program Files\Git\usr\bin\openssl.exe" version
pg_restore --version
psql --version
```

Na primeira execução, defina a URL de um banco Neon de restauração e a chave usada pelo workflow. Não coloque esses valores no script, no repositório ou em uma tarefa agendada visível.

```powershell
$env:RESTORE_DATABASE_URL = "postgresql://...banco-de-teste...?sslmode=require"
$env:BACKUP_ENCRYPTION_KEY = "chave-hex-guardada-no-gerenciador-de-senhas"
```

## Execução manual

A partir da raiz do projeto:

```powershell
.\scripts\Test-PostgresRestore.ps1
```

O script escolhe automaticamente a execução bem-sucedida mais recente do workflow. Para testar uma execução específica:

```powershell
.\scripts\Test-PostgresRestore.ps1 -RunId 32909511465
```

Por padrão, o artefato e o dump são apagados depois do teste. O relatório JSON e o log ficam em `restore-drill-results\<timestamp>`. Para preservar os arquivos temporários durante uma investigação:

```powershell
.\scripts\Test-PostgresRestore.ps1 -KeepFiles
```

Um resultado aprovado deve conter `status: success`, uma contagem de tabelas públicas maior que zero e `prismaMigrationTableFound: true`.

## Agendamento no Windows Task Scheduler

O agendamento deve executar com uma conta dedicada, sem privilégios administrativos desnecessários, e com acesso somente ao banco de teste. Como o Agendador de Tarefas não é um gerenciador adequado para secrets, recomenda-se armazenar as variáveis em um arquivo protegido por ACL ou usar um usuário de serviço com ambiente configurado. Nunca coloque a senha diretamente na ação do Task Scheduler ou em argumentos de linha de comando.

Uma forma simples para uma máquina de uso pessoal é criar um arquivo local fora do Git, por exemplo `C:\Secure\pinakes-restore-env.ps1`, com permissões restritas:

```powershell
$env:RESTORE_DATABASE_URL = "postgresql://...banco-de-teste...?sslmode=require"
$env:BACKUP_ENCRYPTION_KEY = "chave-hex-guardada-com-seguranca"
& "D:\projetos\Projeto-Manga\scripts\Test-PostgresRestore.ps1"
Remove-Item Env:RESTORE_DATABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:BACKUP_ENCRYPTION_KEY -ErrorAction SilentlyContinue
```

Proteja o arquivo para que somente seu usuário possa lê-lo:

```powershell
icacls C:\Secure\pinakes-restore-env.ps1 /inheritance:r
icacls C:\Secure\pinakes-restore-env.ps1 /grant:r "$env:USERNAME:(R)"
```

Crie a tarefa semanalmente, por exemplo aos domingos às 05:00:

```powershell
$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument '-NoProfile -NonInteractive -ExecutionPolicy Bypass -File "C:\Secure\pinakes-restore-env.ps1"'

$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 05:00

Register-ScheduledTask `
  -TaskName "Pinakes - Teste de Restauracao PostgreSQL" `
  -Action $action `
  -Trigger $trigger `
  -Description "Testa semanalmente a restauração do backup PostgreSQL em banco isolado." `
  -User $env:USERNAME
```

Para testar a tarefa sem esperar o próximo horário:

```powershell
Start-ScheduledTask -TaskName "Pinakes - Teste de Restauracao PostgreSQL"
Get-ScheduledTaskInfo -TaskName "Pinakes - Teste de Restauracao PostgreSQL"
```

## Retenção e limpeza

O script mantém somente relatórios e logs locais. O dump descriptografado é excluído ao final por padrão. Os artefatos criptografados permanecem sujeitos à retenção configurada no GitHub Actions. Depois de validar um novo backup, remova artefatos antigos que não sejam mais necessários.

Em ambiente de equipe, é preferível executar este teste em um runner dedicado ou em uma rotina de CI manual, usando secrets do GitHub e um banco Neon de restauração efêmero. O banco de teste deve ser descartado ou recriado após o teste, conforme a política de retenção da equipe.
