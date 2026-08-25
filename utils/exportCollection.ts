interface MangaForExport {
  name: string
  totalVolumes?: number | null
  ownedVolumes: number[]
  collectionType: 'MANGA' | 'HQ'
}

/** Comprime uma lista de números em faixas, ex: [1,2,3,5,8,9] -> "1-3, 5, 8-9" */
function formatRanges(sortedNums: number[]): string {
  if (!sortedNums.length) return 'Nenhum'

  const ranges: string[] = []
  let start = sortedNums[0]
  let end = sortedNums[0]

  for (let i = 1; i < sortedNums.length; i++) {
    if (sortedNums[i] === end + 1) {
      end = sortedNums[i]
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`)
      start = sortedNums[i]
      end = sortedNums[i]
    }
  }

  ranges.push(start === end ? `${start}` : `${start}-${end}`)

  return ranges.join(', ')
}

function buildSection(title: string, items: MangaForExport[]): string[] {
  const lines: string[] = []

  lines.push(title)
  lines.push('-'.repeat(40))

  items.forEach((manga, idx) => {
    const total = manga.totalVolumes ?? 0
    const owned = [...(manga.ownedVolumes ?? [])].sort((a, b) => a - b)
    const ownedSet = new Set(owned)

    const missing: number[] = []
    if (total > 0) {
      for (let v = 1; v <= total; v++) {
        if (!ownedSet.has(v)) missing.push(v)
      }
    }

    const progressPct = total > 0 ? Math.round((owned.length / total) * 100) : 0

    lines.push(`${idx + 1}. ${manga.name}`)
    lines.push(`   Total de volumes: ${total || 'Desconhecido'}`)
    lines.push(`   Obtidos (${owned.length}): ${formatRanges(owned)}`)
    lines.push(`   Faltantes (${missing.length}): ${total > 0 ? formatRanges(missing) : '—'}`)
    lines.push(`   Progresso: ${owned.length}/${total} (${progressPct}%)`)
    lines.push('')
  })

  return lines
}

export function generateCollectionText(mangas: MangaForExport[]): string {
  const date = new Date().toLocaleDateString('pt-BR')

  const lines: string[] = []
  lines.push('MINHA COLEÇÃO - PINAKES')
  lines.push('='.repeat(40))
  lines.push(`Data da exportação: ${date}`)
  lines.push(`Total de obras: ${mangas.length}`)
  lines.push('')

  const mangaItems = mangas.filter((m) => m.collectionType === 'MANGA')
  const hqItems = mangas.filter((m) => m.collectionType === 'HQ')

  if (mangaItems.length) {
    lines.push(...buildSection('MANGÁS', mangaItems))
  }

  if (hqItems.length) {
    lines.push(...buildSection('HQS', hqItems))
  }

  return lines.join('\n').trimEnd() + '\n'
}

export function downloadText(content: string, filename = 'colecao-mangas.txt') {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}