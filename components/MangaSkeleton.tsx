export default function MangaSkeleton() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-pulse">
      {/* Capa Skeleton */}
      <div className="w-full h-72 bg-gray-800" />
      
      {/* Conteúdo Skeleton */}
      <div className="p-4 flex flex-col gap-3">
        <div className="h-6 bg-gray-800 rounded w-3/4" />
        <div className="h-4 bg-gray-800 rounded w-1/2" />
        <div className="h-6 bg-gray-800 rounded-full w-20" />
        <div className="h-4 bg-gray-800 rounded w-1/3 mt-2" />
      </div>
    </div>
  )
}
