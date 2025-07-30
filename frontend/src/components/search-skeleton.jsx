"use client"

const SearchResultsSkeleton = () => {
  return (
    <div className="space-y-6">
      {[1, 2].map((tableIndex) => (
        <div key={tableIndex} className="mb-6">          
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-5 w-5 bg-gray-200 rounded mr-2 animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="ml-2 h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="h-7 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="overflow-x-auto">
            <div className="w-full border border-gray-200 rounded-lg">              
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="flex">
                  {[1, 2, 3, 4].map((col) => (
                    <div key={col} className="px-4 py-3 flex-1">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>              
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className={`${row % 2 === 0 ? "bg-gray-50" : "bg-white"} border-b border-gray-200 last:border-b-0`}
                >
                  <div className="flex">
                    {[1, 2, 3, 4].map((col) => (
                      <div key={col} className="px-4 py-3 flex-1">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {tableIndex < 2 && <div className="mt-6 border-t-2 border-dashed border-gray-300"></div>}
        </div>
      ))}
    </div>
  )
}

export default SearchResultsSkeleton