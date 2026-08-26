'use client'

import { useMemo, useState } from 'react'
import { Download, ImageDown, Loader2, Share2 } from 'lucide-react'

interface RatingShareCardProps {
  name: string
  author: string | null
  coverUrl: string | null
  ratings: Array<{ volume: number; note: number }>
  generalNote: number | null
  expectedVolumes: number[]
}

type RatingBand = {
  label: string
  color: string
  textColor: string
}

function getRatingBand(note: number): RatingBand {
  if (note >= 8.5) return { label: 'Excelente', color: '#117a4b', textColor: '#ffffff' }
  if (note >= 7) return { label: 'Ótimo', color: '#20b968', textColor: '#07150e' }
  if (note >= 5.5) return { label: 'Bom', color: '#f7d43b', textColor: '#15120a' }
  if (note >= 4) return { label: 'Regular', color: '#f59e0b', textColor: '#171006' }
  if (note >= 2) return { label: 'Ruim', color: '#ef5145', textColor: '#ffffff' }
  return { label: 'Fraco', color: '#65347b', textColor: '#ffffff' }
}

const LEGEND: RatingBand[] = [
  { label: 'Excelente', color: '#117a4b', textColor: '#ffffff' },
  { label: 'Ótimo', color: '#20b968', textColor: '#07150e' },
  { label: 'Bom', color: '#f7d43b', textColor: '#15120a' },
  { label: 'Regular', color: '#f59e0b', textColor: '#171006' },
  { label: 'Ruim', color: '#ef5145', textColor: '#ffffff' },
  { label: 'Fraco', color: '#65347b', textColor: '#ffffff' },
]

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
  context.fill()
}

function drawCoverPlaceholder(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, name: string) {
  const gradient = context.createLinearGradient(x, y, x + width, y + height)
  gradient.addColorStop(0, '#6d28d9')
  gradient.addColorStop(1, '#181024')
  context.fillStyle = gradient
  roundedRect(context, x, y, width, height, 24)
  context.fillStyle = '#ffffff'
  context.font = '700 34px Arial'
  context.textAlign = 'center'
  context.fillText(name.slice(0, 22), x + width / 2, y + height / 2, width - 48)
}

function loadCover(url: string | null) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    if (!url) {
      resolve(null)
      return
    }

    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = url
  })
}

async function createRatingImage({ name, author, coverUrl, ratings, generalNote }: RatingShareCardProps) {
  const canvas = document.createElement('canvas')
  canvas.width = 1600
  canvas.height = 900
  const context = canvas.getContext('2d')

  if (!context) throw new Error('Seu navegador não suporta a criação da imagem')

  context.fillStyle = '#101012'
  context.fillRect(0, 0, canvas.width, canvas.height)

  const glow = context.createRadialGradient(1190, 360, 40, 1190, 360, 720)
  glow.addColorStop(0, 'rgba(116, 64, 180, 0.25)')
  glow.addColorStop(1, 'rgba(16, 16, 18, 0)')
  context.fillStyle = glow
  context.fillRect(0, 0, canvas.width, canvas.height)

  const coverX = 48
  const coverY = 48
  const coverWidth = 330
  const coverHeight = 520
  const cover = await loadCover(coverUrl)

  if (cover) {
    context.save()
    context.beginPath()
    context.roundRect(coverX, coverY, coverWidth, coverHeight, 24)
    context.clip()
    const ratio = Math.max(coverWidth / cover.width, coverHeight / cover.height)
    const width = cover.width * ratio
    const height = cover.height * ratio
    context.drawImage(cover, coverX + (coverWidth - width) / 2, coverY + (coverHeight - height) / 2, width, height)
    context.restore()
  } else {
    drawCoverPlaceholder(context, coverX, coverY, coverWidth, coverHeight, name)
  }

  context.fillStyle = '#f4f1f7'
  context.textAlign = 'left'
  context.font = '700 48px Arial'
  context.fillText(name.slice(0, 26), coverX, 650, coverWidth + 50)
  if (author) {
    context.fillStyle = '#aaa3b1'
    context.font = '400 23px Arial'
    context.fillText(author.slice(0, 34), coverX, 688, coverWidth + 50)
  }

  context.fillStyle = '#f5a623'
  context.font = '700 38px Arial'
  context.fillText('★', coverX, 765)
  context.fillStyle = '#f4f1f7'
  context.font = '700 34px Arial'
  context.fillText(generalNote !== null ? generalNote.toFixed(1) : '—', coverX + 43, 765)
  context.fillStyle = '#8d8792'
  context.font = '400 23px Arial'
  context.fillText('nota geral', coverX + 132, 765)

  const chartX = 455
  const chartY = 72
  const cellWidth = 92
  const cellHeight = 62
  const cellGap = 12
  const columns = Math.min(10, Math.max(1, ratings.length))
  const rows = Math.ceil(ratings.length / columns)

  context.font = '600 22px Arial'
  let legendX = chartX
  LEGEND.forEach((band) => {
    context.fillStyle = band.color
    context.beginPath()
    context.arc(legendX + 12, chartY + 9, 12, 0, Math.PI * 2)
    context.fill()
    context.fillStyle = '#ddd8e1'
    context.fillText(band.label, legendX + 32, chartY + 17)
    legendX += 172
  })

  context.fillStyle = '#8d8792'
  context.font = '600 17px Arial'
  context.fillText('NOTAS POR VOLUME', chartX, chartY + 88)

  ratings.forEach((rating, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const x = chartX + column * (cellWidth + cellGap)
    const y = chartY + 120 + row * (cellHeight + 35)
    const band = getRatingBand(rating.note)

    context.fillStyle = '#8d8792'
    context.font = '600 16px Arial'
    context.textAlign = 'center'
    context.fillText(`V${rating.volume}`, x + cellWidth / 2, y - 10)
    context.fillStyle = band.color
    roundedRect(context, x, y, cellWidth, cellHeight, 12)
    context.fillStyle = band.textColor
    context.font = '700 27px Arial'
    context.fillText(rating.note.toFixed(1), x + cellWidth / 2, y + 39)
  })

  context.textAlign = 'left'
  context.fillStyle = '#6f6876'
  context.font = '400 16px Arial'
  context.fillText('Pinakes Manga · minha coleção', chartX, 850)

  return canvas.toDataURL('image/png')
}

export default function RatingShareCard(props: RatingShareCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [shareMessage, setShareMessage] = useState<string | null>(null)

  const sortedRatings = useMemo(
    () => [...props.ratings].sort((a, b) => a.volume - b.volume),
    [props.ratings]
  )
  const unratedVolumes = useMemo(
    () => props.expectedVolumes.filter((volume) => !sortedRatings.some((rating) => rating.volume === volume)),
    [props.expectedVolumes, sortedRatings]
  )
  const allVolumesRated = props.expectedVolumes.length > 0 && unratedVolumes.length === 0

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const image = await createRatingImage({ ...props, ratings: sortedRatings })
      setPreviewUrl(image)
      setShowPreview(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar a imagem')
    } finally {
      setGenerating(false)
    }
  }

  function handleDownload() {
    if (!previewUrl) return
    const anchor = document.createElement('a')
    anchor.href = previewUrl
    anchor.download = `${props.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'obra'}-notas.png`
    anchor.click()
  }

  async function handleShare() {
    if (!previewUrl) return
    setShareMessage(null)
    try {
      const response = await fetch(previewUrl)
      const blob = await response.blob()
      const file = new File([blob], 'pinakes-notas.png', { type: 'image/png' })
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: props.name, text: `Minhas notas de ${props.name}`, files: [file] })
        return
      }
      await navigator.clipboard?.writeText(`Minhas notas de ${props.name}`)
      setShareMessage('Seu navegador não permite compartilhar a imagem diretamente. O texto foi copiado; você também pode baixar o PNG.')
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setShareMessage('Não foi possível compartilhar automaticamente. Use o botão de baixar PNG.')
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-purple-400">
            <Share2 size={14} /> Resumo visual
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white [font-family:var(--font-display)]">Compartilhe suas notas</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Avalie todos os volumes para gerar uma imagem com a capa, a média geral e a grade colorida das notas.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
          <p className="font-mono text-xl font-bold text-white">{sortedRatings.length}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">volumes avaliados</p>
        </div>
      </div>

      {!allVolumesRated && (
        <p className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-200">
          Faltam {unratedVolumes.length} {unratedVolumes.length === 1 ? 'avaliação' : 'avaliações'} para habilitar a imagem. Avalie cada volume listado acima.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!allVolumesRated || generating}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-950/30 transition hover:from-purple-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {generating ? <Loader2 size={17} className="animate-spin" /> : <ImageDown size={17} />}
          {generating ? 'Gerando imagem...' : 'Gerar imagem das notas'}
        </button>
        {previewUrl && (
          <>
            <button type="button" onClick={() => setShowPreview(true)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/[0.08]">
              <ImageDown size={17} /> Visualizar imagem
            </button>
            <button type="button" onClick={handleDownload} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-gray-200 transition hover:bg-white/[0.08]">
              <Download size={17} /> Baixar PNG
            </button>
            <button type="button" onClick={handleShare} className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 text-sm font-semibold text-purple-200 transition hover:bg-purple-500/20">
              <Share2 size={17} /> Compartilhar
            </button>
          </>
        )}
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}
      {shareMessage && <p className="mt-4 text-sm text-gray-400">{shareMessage}</p>}
      {previewUrl && showPreview && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">Pré-visualização</p>
            <button type="button" onClick={() => setShowPreview(false)} className="text-xs text-gray-400 hover:text-white">Fechar</button>
          </div>
          <img src={previewUrl} alt={`Resumo visual das notas de ${props.name}`} className="h-auto w-full" />
        </div>
      )}
    </section>
  )
}
