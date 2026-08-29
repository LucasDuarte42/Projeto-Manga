'use client'

import { useRef, useState } from 'react'
import { Camera, Trash2 } from 'lucide-react'

export default function ProfileAvatarUploader({ initialAvatarUrl }: { initialAvatarUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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
      setMessage(nextAvatarUrl ? 'Foto atualizada.' : 'Foto removida.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Erro ao salvar a foto.')
    } finally {
      setBusy(false)
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('Use uma imagem JPG, PNG ou WebP.')
      return
    }
    if (file.size > 512 * 1024) {
      setMessage('A imagem deve ter no máximo 512 KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') void saveAvatar(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl bg-purple-500/20 text-3xl font-bold text-purple-200 ring-1 ring-purple-400/30">{avatarUrl ? <img src={avatarUrl} alt="Foto do perfil" className="h-full w-full object-cover" /> : <span>?</span>}</div>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-900 bg-purple-600 text-white shadow-lg transition hover:bg-purple-500 disabled:opacity-50" aria-label="Escolher foto de perfil"><Camera size={16} /></button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => handleFile(event.target.files?.[0])} />
      </div>
      <div className="flex items-center gap-3"><button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="text-xs font-medium text-purple-300 hover:text-purple-200">{busy ? 'Salvando...' : 'Alterar foto'}</button>{avatarUrl && <button type="button" onClick={() => void saveAvatar(null)} disabled={busy} className="inline-flex items-center gap-1 text-xs text-red-300 hover:text-red-200"><Trash2 size={13} />Remover</button>}</div>
      {message && <p role="status" className="text-center text-xs text-gray-400">{message}</p>}
    </div>
  )
}
