'use client'

import { useMemo, useState } from 'react'
import { Download, Share2, X } from 'lucide-react'

type ShareMode = 'READING' | 'VOLUMES'

interface ShareItem {
  name: string
  coverUrl?: string | null
  totalVolumes?: number | null
  ownedVolumes?: number[]
  readThisWeek?: number
  readThisMonth?: number
}

interface ShareCollectionModalProps {
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

function buildSvg(items: ShareItem[], mode: ShareMode): string {
  const cards = items.slice(0, 6).map((item, index) => {
    const column = index % 3
    const row = Math.floor(index / 3)
    const x = 70 + column * 360
    const y = 185 + row * 285
    const cover = item.coverUrl
      ? `<image href="${escapeXml(item.coverUrl)}" x="${x}" y="${y}" width="118" height="158" preserveAspectRatio="xMidYMid slice"/><rect x="${x}" y="${y}" width="118" height="158" rx="14" fill="none" stroke="#ffffff" stroke-opacity="0.12"/>`
      : `<rect x="${x}" y="${y}" width="118" height="158" rx="14" fill="#24163d"/><text x="${x + 59}" y="${y + 86}" text-anchor="middle" fill="#c084fc" font-size="18" font-family="Arial, sans-serif">PINAKES</text>`
    const title = escapeXml(item.name.slice(0, 28))
    const stats = mode === 'READING'
      ? `<text x="${x + 140}" y="${y + 78}" fill="#ffffff" font-size="22" font-weight="700" font-family="Arial, sans-serif">${item.readThisWeek ?? 0}</text><text x="${x + 140}" y="${y + 104}" fill="#a1a1aa" font-size="15" font-family="Arial, sans-serif">lidos na semana</text><text x="${x + 140}" y="${y + 143}" fill="#ffffff" font-size="22" font-weight="700" font-family="Arial, sans-serif">${item.readThisMonth ?? 0}</text><text x="${x + 140}" y="${y + 169}" fill="#a1a1aa" font-size="15" font-family="Arial, sans-serif">lidos no mês</text>`
      : `<text x="${x + 140}" y="${y + 78}" fill="#ffffff" font-size="22" font-weight="700" font-family="Arial, sans-serif">${item.ownedVolumes?.length ?? 0}</text><text x="${x + 140}" y="${y + 104}" fill="#a1a1aa" font-size="15" font-family="Arial, sans-serif">volumes adquiridos</text><text x="${x + 140}" y="${y + 143}" fill="#ffffff" font-size="22" font-weight="700" font-family="Arial, sans-serif">${Math.max(0, (item.totalVolumes ?? 0) - (item.ownedVolumes?.length ?? 0))}</text><text x="${x + 140}" y="${y + 169}" fill="#a1a1aa" font-size="15" font-family="Arial, sans-serif">volumes faltantes</text>`
    return `${cover}<text x="${x}" y="${y + 194}" fill="#ffffff" font-size="22" font-weight="700" font-family="Arial, sans-serif">${title}</text>${stats}`
  }).join('')
  const heading = mode === 'READING' ? 'Minhas leituras' : 'Minha coleção'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#160f2b"/><stop offset="100%" stop-color="#09090b"/></linearGradient><linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#a855f7"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient></defs><rect width="1200" height="800" rx="42" fill="url(#bg)"/><circle cx="1080" cy="40" r="230" fill="#7c3aed" opacity="0.16"/><text x="70" y="78" fill="#c084fc" font-size="20" font-weight="700" letter-spacing="5" font-family="Arial, sans-serif">PINAKES</text><text x="70" y="132" fill="#ffffff" font-size="42" font-weight="700" font-family="Arial, sans-serif">${heading}</text><rect x="70" y="153" width="1060" height="4" rx="2" fill="url(#accent)"/>${cards || '<text x="70" y="260" fill="#a1a1aa" font-size="22" font-family="Arial, sans-serif">Nenhuma obra para exibir</text>'}<text x="70" y="755" fill="#71717a" font-size="16" font-family="Arial, sans-serif">pinakes · resumo gerado localmente</text></svg>`
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
    canvas.height = 800
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas indisponível')
    context.drawImage(image, 0, 0)
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Não foi possível exportar a imagem')), 'image/png'))
  } finally {
    URL.revokeObjectURL(url)
  }
}

export default function ShareCollectionModal({ items, onClose }: ShareCollectionModalProps) {
  const [mode, setMode] = useState<ShareMode>('READING')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const svg = useMemo(() => buildSvg(items, mode), [items, mode])

  async function handleShare() {
    setBusy(true)
    setError(null)
    try {
      const blob = await svgToPng(svg)
      const filename = mode === 'READING' ? 'pinakes-leituras.png' : 'pinakes-volumes.png'
      const file = new File([blob], filename, { type: 'image/png' })
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: mode === 'READING' ? 'Minhas leituras no Pinakes' : 'Minha coleção no Pinakes', files: [file] })
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="share-title" className="w-full max-w-4xl rounded-2xl border border-gray-800 bg-gray-900 p-6" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 id="share-title" className="text-lg font-bold text-white">Compartilhar</h2>
          <button type="button" onClick={onClose} aria-label="Fechar compartilhamento" className="text-gray-400 transition hover:text-white"><X size={20} /></button>
        </div>
        <p className="mb-4 text-sm text-gray-400">Escolha o resumo visual. Nada será publicado automaticamente.</p>
        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Modelo da imagem">
          <button type="button" role="tab" aria-selected={mode === 'READING'} onClick={() => setMode('READING')} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${mode === 'READING' ? 'border-purple-400/50 bg-purple-500/15 text-purple-200' : 'border-gray-800 text-gray-400 hover:text-white'}`}>Leituras semanais/mensais</button>
          <button type="button" role="tab" aria-selected={mode === 'VOLUMES'} onClick={() => setMode('VOLUMES')} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${mode === 'VOLUMES' ? 'border-purple-400/50 bg-purple-500/15 text-purple-200' : 'border-gray-800 text-gray-400 hover:text-white'}`}>Volumes adquiridos/faltantes</button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-purple-500/20 bg-gray-950" dangerouslySetInnerHTML={{ __html: svg }} />
        {error && <p role="alert" className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-gray-700">Cancelar</button>
          <button type="button" onClick={handleShare} disabled={busy || items.length === 0} className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-wait disabled:opacity-60">
            {busy ? <Download size={16} /> : <Share2 size={16} />}
            {busy ? 'Preparando imagem...' : 'Compartilhar ou baixar'}
          </button>
        </div>
      </div>
    </div>
  )
}
