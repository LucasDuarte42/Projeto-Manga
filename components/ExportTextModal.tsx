'use client'

import { useState } from 'react'
import { X, Copy, Check, Download } from 'lucide-react'
import { downloadText } from '../utils/exportCollection'

interface ExportTextModalProps {
  content: string
  onClose: () => void
}

export default function ExportTextModal({
  content,
  onClose,
}: ExportTextModalProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar texto:', err)
    }
  }

  function handleDownload() {
    downloadText(content)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            Exportar coleção
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 transition hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <textarea
          readOnly
          value={content}
          className="h-80 w-full resize-none rounded-xl border border-gray-800 bg-gray-950 p-4 font-mono text-xs text-gray-300 outline-none focus:border-purple-500"
        />

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
          >
            {copied ? (
              <>
                <Check size={16} />
                Copiado!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copiar texto
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            <Download size={16} />
            Baixar .txt
          </button>
        </div>
      </div>
    </div>
  )
}