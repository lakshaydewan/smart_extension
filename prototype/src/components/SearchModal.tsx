import { useState } from "react"
import { Loader } from "lucide-react"

const SearchModal = ({ onClose }: { onClose: () => void }) => {

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)

  const handleClose = () => {
    onClose()
  }

  const handleSearch = async () => {
    setSearchResults(null)
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      })
      const data = await res.json()
      setSearchResults(data.products)
    } catch (error) {
      console.error('Error fetching search results:', error)
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lg:w-[40vw] md:w-[60vw] bg-[#f1e9e4] border border-amber-950 md:h-[50vh] w-[85vw] h-[60vh] rounded-xl z-[999] fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] shadow-2xl">
      <div className="w-full h-full flex flex-col relative">
        {/* Search Header */}
        <div className="w-full h-fit p-4 border-b border-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 px-4 py-2 bg-white border border-amber-950/30 rounded-lg focus:outline-none focus:border-amber-950 text-amber-950 placeholder-amber-950/60"
                autoFocus
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 px-1 transform -translate-y-1/2 bg-amber-950 rounded-md text-[#f1e9e4]">
                GO
              </button>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-amber-950/10 rounded-lg transition-colors duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Results */}
        <div className="w-full h-full overflow-y-auto p-3">
          {searchResults !== null && searchResults.length > 0 ? (
            <div className="grid grid-cols-2 grid-rows-2 gap-3">
              {searchResults.map((product, index) => (
                <a href={product.url}>
                  <div
                    key={index}
                    className="bg-white border border-amber-950/20 rounded-lg p-3 hover:shadow-md hover:border-amber-950/40 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="aspect-square w-full mb-3 overflow-hidden rounded-md bg-amber-50">
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <h3 className="text-sm font-medium text-amber-950 text-center leading-tight">{product.product_name}</h3>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-amber-950/60">
              {(searchResults === null && !loading) && <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-center">
                  Start typing to search products
                </p>
              </>}
              {loading && (
                  <div className="h-fit w-fit pl-3">
                    <Loader className="h-6 w-6 animate-spin text-[#201a17]" />
                  </div>
                )}
              {
                (!loading) && <p className="text-center">No products found</p>
              }
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchModal
