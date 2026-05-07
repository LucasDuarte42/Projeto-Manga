'use client'

import { useState } from 'react'

interface Manga {
  id:           string
  name:         string
  author?:      string | null
  volume:       number
  totalVolumes?: number | null
  status:       'READ' | 'READING' | 'WANT_TO_READ'
  note?:        number | null
}

interface Props {
  manga:   Manga
  onClose: () => void
  onSave:  (updated: Partial<Manga>) => Promise<void>
}

export default function QuickEditModal({ manga, onClose, onSave }: Props) {
  const [volume, setVolume] = useState(manga.volume.toString())
  const [note,   setNote]   = useState(manga.note?.toString() || '')
  const [status, setStatus] = useState(manga.status)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      // Se tiver nota, força o status para READ
      const finalStatus = (note !== '' && note !== null) ? 'READ' : status
      
      await onSave({
        volume: parseInt(volume),
        note:   note !== '' ? parseFloat(note) : null,
        status: finalStatus
      })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold truncate">Editar: {manga.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Volume Atual</label>
            <input
              type="number"
              value={volume}
              onChange={e => setVolume(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-purple-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nota (0-10)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="10"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ex: 8.5"
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as any)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-purple-500 outline-none"
            >
              <option value="READING">Lendo</option>
              <option value="READ">Lido</option>
              <option value="WANT_TO_READ">Quero Ler</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 mt-2"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}
