'use client'

import { useState } from 'react'
import { X, Copy, Check, Download, FileJson, FileText, Table2 } from 'lucide-react'

type ExportFormat = 'txt' | 'csv' | 'json'

interface ExportTextModalProps {
  content: string
  onClose: () => void
  onDownload: (format: ExportFormat) => Promise<void> | void
}

export default function ExportTextModal({
  content,
  onClose,
  onDownload,
}: ExportTextModalProps) {
  const [copied, setCopied] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('txt')
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar texto:', err)
    }
  }

  async function handleConfirmedDownload() {
    setIsDownloading(true)
    setDownloadError(null)
    try {
      await onDownload(selectedFormat)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Não foi possível baixar o arquivo')
    } finally {
      setIsDownloading(false)
    }
  }

  const formats = [
    { value: 'txt' as const, label: 'Texto', extension: '.txt', icon: FileText },
    { value: 'csv' as const, label: 'Planilha', extension: '.csv', icon: Table2 },
    { value: 'json' as const, label: 'Dados', extension: '.json', icon: FileJson },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="export-title" className="text-lg font-bold text-white">
            Exportar coleção
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar diálogo de exportação"
            className="text-gray-400 transition hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-400">
          Escolha o formato e confirme o download. JSON e CSV incluem toda a sua coleção, não apenas a página atual.
        </p>

        <textarea
          readOnly
          value={content}
          aria-label="Prévia da exportação em texto"
          className="h-64 w-full resize-none rounded-xl border border-gray-800 bg-gray-950 p-4 font-mono text-xs text-gray-300 outline-none focus:border-purple-500"
        />

        <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Formato de exportação">
          {formats.map(({ value, label, extension, icon: Icon }) => {
            const selected = selectedFormat === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setSelectedFormat(value)}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  selected
                    ? 'border-purple-500 bg-purple-600/20 text-purple-200'
                    : 'border-gray-800 bg-gray-950 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
                <span className="text-xs opacity-70">{extension}</span>
              </button>
            )
          })}
        </div>

        {downloadError && (
          <p role="alert" className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {downloadError}
          </p>
        )}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
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
            type="button"
            onClick={handleConfirmedDownload}
            disabled={isDownloading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-wait disabled:opacity-60"
          >
            <Download size={16} />
            {isDownloading ? 'Preparando...' : `Confirmar download ${selectedFormat.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  )
}
