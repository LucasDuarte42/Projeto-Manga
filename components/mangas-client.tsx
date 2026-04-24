'use client'

import { useState } from 'react'
import MangaSearch from './manga-search'
import { type JikanManga } from '@/lib/jikan'

export default function MangasClient({ initialMangas }: { initialMangas: any[] }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    volume: '',
    totalVolumes: '',
    status: 'WANT_TO_READ',
    note: '',
    coverUrl: '',
  })

  const handleSelectManga = (jikanManga: JikanManga) => {
    setForm(prev => ({
      ...prev,
      // nome preenchido automaticamente pela busca
      name: jikanManga.title,
      // total de volumes automático
      totalVolumes: jikanManga.volumes ? String(jikanManga.volumes) : '',
      // imagem automática da API
      coverUrl: jikanManga.image_url || '',
    }))
  }

  return (
    <div>
      {/* Lista da coleção antes do botão */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialMangas.map((manga) => (
          <div
            key={manga.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4"
          >
            {manga.coverUrl && (
              <img
                src={manga.coverUrl}
                alt={manga.name}
                className="w-full h-48 object-cover rounded mb-4"
              />
            )}

            <h3 className="text-lg font-bold">{manga.name}</h3>

            <p className="text-gray-400">
              Volume: {manga.volume}
              {manga.totalVolumes && ` / ${manga.totalVolumes}`}
            </p>

            {manga.note && (
              <p className="text-yellow-400">⭐ {manga.note}</p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-purple-600 px-6 py-2 rounded-lg text-white"
      >
        {showForm ? 'Cancelar' : '+ Adicionar Mangá'}
      </button>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4 mt-6">
          <h3 className="text-xl font-bold mb-4">Adicionar Novo Mangá</h3>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Busca principal - agora substitui o campo Nome */}
            <div className="md:col-span-2">
              <MangaSearch
                onSelectManga={handleSelectManga}
                disabled={false}
              />
            </div>

            {/* Volume */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Volume *</label>
              <input
                type="number"
                min="1"
                value={form.volume}
                onChange={e => setForm({ ...form, volume: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700"
                placeholder="1"
              />
            </div>

            {/* Total automático */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Total de Volumes</label>
              <input
                type="number"
                value={form.totalVolumes}
                readOnly
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700 opacity-70"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700"
              >
                <option value="WANT_TO_READ">Quero Ler</option>
                <option value="READING">Lendo</option>
                <option value="READ">Lido</option>
              </select>
            </div>

            {/* Nota */}
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Nota (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 border border-gray-700"
                placeholder="8.5"
              />
            </div>

            {/* Sem campo Nome manual */}
            {/* Sem campo Gênero */}
            {/* Sem campo URL da Capa */}

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg"
              >
                Adicionar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
