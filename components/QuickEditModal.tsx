'use client'

import { useState } from 'react'

interface Manga {
  id:           string
  name:         string
  author?:      string | null
  volume:       number
  totalVolumes?: number | null
  ownedVolumes:  number[]
  status:       'READ' | 'READING' | 'WANT_TO_READ'
  note?:        number | null
}

interface Props {
  manga:   Manga
  onClose: () => void
  onSave:  (updated: Partial<Manga>) => Promise<void>
}

export default function QuickEditModal({ manga, onClose, onSave }: Props) {
  const [name,   setName]   = useState(manga.name)
  const [author, setAuthor] = useState(manga.author || '')
  const [volume, setVolume] = useState(manga.volume.toString())
  const [note,   setNote]   = useState(manga.note?.toString() || '')
  const [status, setStatus] = useState(manga.status)
  const [newVol, setNewVol] = useState('')
  const [owned,  setOwned]  = useState<number[]>(manga.ownedVolumes || [])
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const finalStatus = (note !== '' && note !== null) ? 'READ' : status
      
      await onSave({
        name,
        author: author || null,
        volume: parseInt(volume),
        note:   note !== '' ? parseFloat(note) : null,
        status: finalStatus,
        ownedVolumes: owned
      })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  function addVolume() {
    const volNum = parseInt(newVol)
    if (!isNaN(volNum) && !owned.includes(volNum)) {
      setOwned(prev => [...prev, volNum].sort((a, b) => a - b))
      setNewVol('')
      // Se comprou um volume maior que o atual, atualiza o volume atual também
      if (volNum > parseInt(volume)) {
        setVolume(volNum.toString())
      }
    }
  }

  function getMissingVolumes() {
    if (!manga.totalVolumes) return []
    const missing = []
    for (let i = 1; i <= manga.totalVolumes; i++) {
      if (!owned.includes(i)) {
        missing.push(i)
      }
    }
    return missing
  }

  const missing = getMissingVolumes()

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-white font-bold">Edição Rápida</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Título</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-purple-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Autor</label>
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-purple-500 outline-none"
              placeholder="Nome do autor"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-purple-500 outline-none"
              />
            </div>
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

          <div className="border-t border-gray-800 pt-4">
            <label className="text-xs text-gray-400 mb-1 block">Comprei novo volume:</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={newVol}
                onChange={e => setNewVol(e.target.value)}
                placeholder="Nº"
                className="w-20 bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-purple-500 outline-none"
              />
              <button
                type="button"
                onClick={addVolume}
                className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                + Adicionar
              </button>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-[10px] text-gray-500">
                Volumes na coleção: <span className="text-gray-300">{owned.join(', ') || 'Nenhum'}</span>
              </p>
              {missing.length > 0 && (
                <p className="text-[10px] text-red-400 font-bold">
                  Faltam para completar: <span className="text-red-300">{missing.join(', ')}</span>
                </p>
              )}
            </div>
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
