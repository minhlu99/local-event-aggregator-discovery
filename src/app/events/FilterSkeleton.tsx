export default function FilterSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div className="h-6 bg-gray-300 rounded w-1/3"></div>
      </div>

      <div className="space-y-6">
        {/* Category Filter Skeleton */}
        <div>
          <div className="flex items-center mb-4">
            <div className="h-4 bg-gray-300 rounded-full w-4 mr-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center">
                <div className="h-4 w-4 bg-gray-300 rounded-full mr-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Date Filter Skeleton */}
        <div>
          <div className="flex items-center mb-4">
            <div className="h-4 bg-gray-300 rounded-full w-4 mr-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center">
                <div className="h-4 w-4 bg-gray-300 rounded-full mr-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Filter Skeleton */}
        <div>
          <div className="flex items-center mb-4">
            <div className="h-4 bg-gray-300 rounded-full w-4 mr-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center">
                <div className="h-4 w-4 bg-gray-300 rounded-full mr-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
