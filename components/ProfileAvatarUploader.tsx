'use client'

import { ChangeEvent, DragEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react'
import { Camera, Check, ImagePlus, Loader2, Trash2, Upload, X } from 'lucide-react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_INPUT_SIZE = 5 * 1024 * 1024
const MAX_OUTPUT_SIZE = 700_000

type ImageSource = {
  dataUrl: string
  width: number
  height: number
}

export default function ProfileAvatarUploader({ initialAvatarUrl }: { initialAvatarUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cropAreaRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [selectedImage, setSelectedImage] = useState<ImageSource | null>(null)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'status' | 'error'>('status')

  useEffect(() => {
    return () => {
      if (inputRef.current) inputRef.current.value = ''
    }
  }, [])

  function showMessage(text: string, type: 'status' | 'error' = 'status') {
    setMessage(text)
    setMessageType(type)
  }

  function openFilePicker() {
    if (!busy) inputRef.current?.click()
  }

  function validateFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      showMessage('Escolha uma imagem JPG, PNG ou WebP.', 'error')
      return false
    }
    if (file.size > MAX_INPUT_SIZE) {
      showMessage('A imagem original deve ter no máximo 5 MB.', 'error')
      return false
    }
    return true
  }

  function handleFile(file: File | undefined) {
    if (!file || !validateFile(file)) return
    setMessage(null)
    const reader = new FileReader()
    reader.onerror = () => showMessage('Não foi possível ler essa imagem.', 'error')
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      const image = new Image()
      image.onerror = () => showMessage('Essa imagem parece estar corrompida.', 'error')
      image.onload = () => {
        setSelectedImage({ dataUrl: reader.result as string, width: image.naturalWidth, height: image.naturalHeight })
        setZoom(1)
        setPosition({ x: 0, y: 0 })
      }
      image.src = reader.result as string
    }
    reader.readAsDataURL(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setDragging(false)
    handleFile(event.dataTransfer.files?.[0])
  }

  function closeEditor() {
    if (!busy) setSelectedImage(null)
  }

  function getDragLimits(nextZoom = zoom) {
    if (!selectedImage || !cropAreaRef.current) return { x: 0, y: 0 }
    const size = cropAreaRef.current.clientWidth
    const baseScale = Math.max(size / selectedImage.width, size / selectedImage.height)
    return {
      x: Math.max(0, (selectedImage.width * baseScale * nextZoom - size) / 2),
      y: Math.max(0, (selectedImage.height * baseScale * nextZoom - size) / 2),
    }
  }

  function updateZoom(nextZoom: number) {
    const limits = getDragLimits(nextZoom)
    setZoom(nextZoom)
    setPosition((current) => ({ x: Math.max(-limits.x, Math.min(limits.x, current.x)), y: Math.max(-limits.y, Math.min(limits.y, current.y)) }))
  }

  function startDragging(event: ReactPointerEvent<HTMLDivElement>) {
    if (busy) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: position.x, originY: position.y }
  }

  function dragImage(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const limits = getDragLimits()
    setPosition({
      x: Math.max(-limits.x, Math.min(limits.x, drag.originX + event.clientX - drag.startX)),
      y: Math.max(-limits.y, Math.min(limits.y, drag.originY + event.clientY - drag.startY)),
    })
  }

  function stopDragging(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
  }

  async function createCroppedAvatar() {
    if (!selectedImage) return null
    const image = new Image()
    image.src = selectedImage.dataUrl
    await image.decode()

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const context = canvas.getContext('2d')
    if (!context) return null

    const shortestSide = Math.min(selectedImage.width, selectedImage.height)
    const cropSize = shortestSide / zoom
    const previewSize = cropAreaRef.current?.clientWidth || 320
    const sourceX = (selectedImage.width - cropSize) / 2 - (position.x / previewSize) * cropSize
    const sourceY = (selectedImage.height - cropSize) / 2 - (position.y / previewSize) * cropSize
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, 512, 512)

    let quality = 0.86
    let result = canvas.toDataURL('image/jpeg', quality)
    while (result.length > MAX_OUTPUT_SIZE && quality > 0.5) {
      quality -= 0.08
      result = canvas.toDataURL('image/jpeg', quality)
    }
    return result
  }

  async function saveAvatar(nextAvatarUrl: string | null) {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ avatarUrl: nextAvatarUrl }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Não foi possível salvar a foto.')
      setAvatarUrl(nextAvatarUrl)
      setSelectedImage(null)
      showMessage(nextAvatarUrl ? 'Foto atualizada com sucesso.' : 'Foto removida.')
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Erro ao salvar a foto.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function confirmCrop() {
    const croppedAvatar = await createCroppedAvatar()
    if (!croppedAvatar) {
      showMessage('Não foi possível preparar a imagem.', 'error')
      return
    }
    if (croppedAvatar.length > MAX_OUTPUT_SIZE) {
      showMessage('Não foi possível comprimir a imagem para o tamanho permitido.', 'error')
      return
    }
    await saveAvatar(croppedAvatar)
  }

  const initials = ' '
  const previewStyle = selectedImage
    ? { transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`, transformOrigin: 'center center' }
    : undefined

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-purple-500/20 text-3xl font-bold text-purple-200 ring-1 ring-purple-400/30">
          {avatarUrl ? <img src={avatarUrl} alt="Foto do perfil" className="h-full w-full object-cover" /> : <span aria-hidden="true">{initials}</span>}
        </div>
        <button type="button" onClick={openFilePicker} disabled={busy} className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-900 bg-purple-600 text-white shadow-lg transition hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Escolher foto de perfil">
          <Camera size={16} />
        </button>
        <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(',')} className="hidden" onChange={(event: ChangeEvent<HTMLInputElement>) => handleFile(event.target.files?.[0])} />
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={openFilePicker} disabled={busy} className="text-xs font-medium text-purple-300 transition hover:text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50">
          {busy ? 'Salvando...' : 'Alterar foto'}
        </button>
        {avatarUrl && <button type="button" onClick={() => { if (window.confirm('Remover sua foto de perfil?')) void saveAvatar(null) }} disabled={busy} className="inline-flex items-center gap-1 text-xs text-red-300 transition hover:text-red-200 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"><Trash2 size={13} />Remover</button>}
      </div>

      <p className="text-center text-[11px] text-gray-500">JPG, PNG ou WebP · até 5 MB · recorte quadrado</p>
      {message && <p role={messageType === 'error' ? 'alert' : 'status'} className={`text-center text-xs ${messageType === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>{message}</p>}

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="avatar-editor-title">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-gray-950 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 id="avatar-editor-title" className="text-base font-semibold text-white">Ajuste sua foto</h2><p className="mt-1 text-xs text-gray-400">Centralize o rosto e escolha o zoom ideal.</p></div>
              <button type="button" onClick={closeEditor} disabled={busy} className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50" aria-label="Fechar editor"><X size={18} /></button>
            </div>

            <div ref={cropAreaRef} className="relative mx-auto aspect-square w-full max-w-[320px] cursor-grab touch-none overflow-hidden rounded-3xl bg-gray-900 ring-1 ring-white/10 active:cursor-grabbing" onPointerDown={startDragging} onPointerMove={dragImage} onPointerUp={stopDragging} onPointerCancel={stopDragging}>
              <div className="pointer-events-none absolute inset-0 z-10 rounded-3xl ring-2 ring-white/80 ring-offset-2 ring-offset-gray-900" />
              <img src={selectedImage.dataUrl} alt="Prévia da foto selecionada" className="pointer-events-none h-full w-full select-none object-cover transition-transform duration-150" style={previewStyle} draggable={false} />
              <span className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[10px] text-white/80">Arraste para enquadrar</span>
            </div>

            <label className="mt-5 block text-xs font-medium text-gray-300" htmlFor="avatar-zoom">Zoom</label>
            <input id="avatar-zoom" type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => updateZoom(Number(event.target.value))} className="mt-2 w-full accent-purple-500" aria-valuetext={`${zoom.toFixed(1)}x`} />
            <div className="mt-1 flex justify-between text-[11px] text-gray-500"><span>Enquadramento completo</span><span>{zoom.toFixed(1)}x</span></div>

            <button type="button" onClick={(event) => void (async () => { const button = event.currentTarget; button.blur(); await confirmCrop() })()} disabled={busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}{busy ? 'Salvando foto...' : 'Usar esta foto'}
            </button>
            <button type="button" onClick={openFilePicker} disabled={busy} onDragEnter={() => setDragging(true)} onDragLeave={() => setDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} className={`mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs text-gray-300 transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-50 ${dragging ? 'border-purple-400 bg-purple-500/10' : 'border-white/10'}`}>
              <Upload size={15} /> {dragging ? 'Solte a imagem aqui' : 'Escolher outra imagem'}
            </button>
            <button type="button" onClick={closeEditor} disabled={busy} className="mt-3 inline-flex w-full items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-300 disabled:opacity-50"><ImagePlus size={14} />Cancelar</button>
          </div>
        </div>
      )}

    </div>
  )
}
