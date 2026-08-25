'use client'

import { Download } from 'lucide-react'

interface Manga {
  name: string
  collectionType: 'MANGA' | 'HQ'
  totalVolumes: number | null
  ownedVolumes: number[]
}

interface ExportCollectionButtonProps {
  mangas: Manga[]
}

function getMissingVolumes(
  totalVolumes: number | null,
  ownedVolumes: number[]
): number[] {
  if (!totalVolumes || totalVolumes < 1) {
    return []
  }

  const missing: number[] = []

  for (let volume = 1; volume <= totalVolumes; volume++) {
    if (!ownedVolumes.includes(volume)) {
      missing.push(volume)
    }
  }

  return missing
}

function formatVolumes(volumes: number[]): string {
  if (volumes.length === 0) {
    return 'Nenhum'
  }

  const sorted = volumes
    .filter(
      (volume, index, array) =>
        array.indexOf(volume) === index
    )
    .sort((a, b) => a - b)

  const ranges: string[] = []

  let start = sorted[0]
  let end = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]

    if (current === end + 1) {
      end = current
    } else {
      ranges.push(
        start === end
          ? `${start}`
          : `${start}-${end}`
      )

      start = current
      end = current
    }
  }

  ranges.push(
    start === end
      ? `${start}`
      : `${start}-${end}`
  )

  return ranges.join(', ')
}

export default function ExportCollectionButton({
  mangas,
}: ExportCollectionButtonProps) {
  function handleExport() {
    const sortedMangas = [...mangas].sort(
      (a, b) =>
        a.collectionType.localeCompare(
          b.collectionType
        ) ||
        a.name.localeCompare(
          b.name,
          'pt-BR'
        )
    )

    const mangaList = sortedMangas.filter(
      (manga) => manga.collectionType === 'MANGA'
    )

    const hqList = sortedMangas.filter(
      (manga) => manga.collectionType === 'HQ'
    )

    let content = ''

    content += 'MINHA COLEÇÃO - PINAKES\n'
    content += '========================================\n\n'

    content += `Data da exportação: ${new Date().toLocaleDateString(
      'pt-BR'
    )}\n`

    content += `Total de obras: ${mangas.length}\n\n`

    function addCollection(
      title: string,
      collection: Manga[]
    ) {
      if (collection.length === 0) {
        return
      }

      content += `${title.toUpperCase()}\n`
      content += '----------------------------------------\n\n'

      collection.forEach((manga, index) => {
        const ownedVolumes =
          manga.ownedVolumes || []

        const missingVolumes =
          getMissingVolumes(
            manga.totalVolumes,
            ownedVolumes
          )

        const total =
          manga.totalVolumes || null

        const progress =
          total && total > 0
            ? Math.round(
                (ownedVolumes.length / total) *
                  100
              )
            : null

        content += `${index + 1}. ${manga.name}\n`

        if (total) {
          content += `   Total de volumes: ${total}\n`
        } else {
          content +=
            '   Total de volumes: Não informado\n'
        }

        content += `   Obtidos (${ownedVolumes.length}): ${formatVolumes(
          ownedVolumes
        )}\n`

        if (total) {
          content += `   Faltantes (${missingVolumes.length}): ${formatVolumes(
            missingVolumes
          )}\n`

          content += `   Progresso: ${ownedVolumes.length}/${total} (${progress}%)\n`
        } else {
          content +=
            '   Faltantes: Não é possível calcular sem o total de volumes\n'
        }

        content += '\n'
      })

      content += '\n'
    }

    addCollection('Mangás', mangaList)
    addCollection('HQs', hqList)

    const blob = new Blob(
      [content],
      {
        type: 'text/plain;charset=utf-8',
      }
    )

    const url =
      URL.createObjectURL(blob)

    const link =
      document.createElement('a')

    link.href = url

    const date =
      new Date()
        .toISOString()
        .split('T')[0]

    link.download =
      `minha-colecao-${date}.txt`

    document.body.appendChild(link)

    link.click()

    document.body.removeChild(link)

    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={mangas.length === 0}
      className="group flex items-center gap-2 rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Download
        size={17}
        className="text-purple-400 transition group-hover:-translate-y-0.5"
      />

      Exportar coleção
    </button>
  )
}