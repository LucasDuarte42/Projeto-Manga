'use client'

import { useMemo, useState } from 'react'
import { Download, Share2, X } from 'lucide-react'

interface ShareItem {
  name: string
  author?: string | null
  status: string
}

interface ShareCollectionModalProps {
  username?: string | null
  totalItems: number
  page: number
  totalPages: number
  items: ShareItem[]
  onClose: () => void
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'\"]/g, (character) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    "'": '&apos;',
    '"': '&quot;',
  })[character] ?? character)
}

function statusLabel(status: string): string {
  return ({
    READ: 'Lidos',
    READING: 'Lendo',
    WANT_TO_READ: 'Quero ler',
  } as Record<string, string>)[status] ?? status
}

function buildSvg({ username, totalItems, page, totalPages, items }: ShareCollectionModalProps): string {
  const list = items.slice(0, 5).map((item, index) => {
    const y = 410 + index * 52
    return `<text x="96" y="${y}" fill="#f5f3ff" font-size="24" font-family="Arial, sans-serif">${index + 1}. ${escapeXml(item.name.slice(0, 35))}</text><text x="96" y="${y + 27}" fill="#a78bfa" font-size="16" font-family="Arial, sans-serif">${escapeXml(statusLabel(item.status))}${item.author ? ` · ${escapeXml(item.author.slice(0, 28))}` : ''}</text>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#160f2b"/><stop offset="100%" stop-color="#09090b"/></linearGradient><linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient></defs><rect width="1200" height="900" rx="42" fill="url(#bg)"/><circle cx="1040" cy="80" r="250" fill="#7c3aed" opacity="0.16"/><circle cx="140" cy="850" r="220" fill="#a855f7" opacity="0.1"/><text x="96" y="112" fill="#c084fc" font-size="24" font-weight="700" letter-spacing="5" font-family="Arial, sans-serif">PINAKES</text><text x="96" y="190" fill="#ffffff" font-size="58" font-weight="700" font-family="Arial, sans-serif">Minha coleção</text><text x="96" y="232" fill="#a1a1aa" font-size="24" font-family="Arial, sans-serif">${escapeXml(username ? `Coleção de ${username}` : 'Minha coleção de mangás')}</text><rect x="96" y="286" width="1008" height="4" rx="2" fill="url(#accent)"/><text x="96" y="354" fill="#ffffff" font-size="44" font-weight="700" font-family="Arial, sans-serif">${totalItems}</text><text x="96" y="386" fill="#a1a1aa" font-size="19" font-family="Arial, sans-serif">itens nesta visualização</text><text x="410" y="354" fill="#ffffff" font-size="44" font-weight="700" font-family="Arial, sans-serif">${page}</text><text x="410" y="386" fill="#a1a1aa" font-size="19" font-family="Arial, sans-serif">de ${totalPages} páginas</text><text x="760" y="354" fill="#ffffff" font-size="44" font-weight="700" font-family="Arial, sans-serif">${items.length}</text><text x="760" y="386" fill="#a1a1aa" font-size="19" font-family="Arial, sans-serif">nesta página</text>${list || '<text x="96" y="450" fill="#a1a1aa" font-size="24" font-family="Arial, sans-serif">Nenhum item nesta página</text>'}<text x="96" y="830" fill="#71717a" font-size="18" font-family="Arial, sans-serif">pinakes · resumo gerado localmente</text></svg>`
}

async function svgToPng(svg: string): Promise<Blob> {
  const image = new Image()
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Não foi possível gerar a imagem'))
      image.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = 1200
    canvas.height = 900
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas indisponível')
    context.drawImage(image, 0, 0)
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Não foi possível exportar a imagem')), 'image/png')
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function ShareCollectionModal(props: ShareCollectionModalProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const svg = useMemo(() => buildSvg(props), [props])

  async function handleShare() {
    setBusy(true)
    setError(null)
    try {
      const blob = await svgToPng(svg)
      const file = new File([blob], 'pinakes-colecao.png', { type: 'image/png' })
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: 'Minha coleção no Pinakes', text: 'Resumo da minha coleção de mangás', files: [file] })
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'pinakes-colecao.png'
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setError(err instanceof Error ? err.message : 'Não foi possível compartilhar a imagem')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={props.onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="share-title" className="w-full max-w-3xl rounded-2xl border border-gray-800 bg-gray-900 p-6" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 id="share-title" className="text-lg font-bold text-white">Compartilhar coleção</h2>
          <button type="button" onClick={props.onClose} aria-label="Fechar compartilhamento" className="text-gray-400 transition hover:text-white"><X size={20} /></button>
        </div>
        <p className="mb-4 text-sm text-gray-400">Gere uma imagem com o resumo da visualização atual. Nada será publicado automaticamente.</p>
        <div className="overflow-hidden rounded-2xl border border-purple-500/20 bg-gray-950" dangerouslySetInnerHTML={{ __html: svg }} />
        {error && <p role="alert" className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={props.onClose} className="rounded-xl border border-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-gray-700">Cancelar</button>
          <button type="button" onClick={handleShare} disabled={busy} className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-wait disabled:opacity-60">
            {busy ? <Download size={16} /> : <Share2 size={16} />}
            {busy ? 'Preparando imagem...' : 'Compartilhar ou baixar'}
          </button>
        </div>
      </div>
    </div>
  )
}
