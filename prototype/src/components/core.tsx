import type React from "react"
import { useState, useRef, useEffect } from "react"
import { X, Send, Sparkles, Loader } from "lucide-react"
import { Button } from "./ui/Button"
import { Input } from "./ui/Input"
import { ScrollArea } from "./ui/ScrollArea"
import { cn } from "lib/utils"
import Markdown from 'markdown-to-jsx'
import SearchModal from "./SearchModal"

type Action = {
  name: string
  description: string
}

type Message = {
  content: string
  isUser: boolean
}

const Actions: Action[] = [
  {
    name: "Summarize",
    description: "Summarize the product",
  },
  {
    name: "Reformat",
    description: "Reformat or reformulate a product",
  },
  {
    name: "Explain",
    description: "Explain the product",
  },
  {
    name: "Analyse",
    description: "Analyse the product",
  },
  {
    name: "Predict",
    description: "Predict missing scores and labels",
  },
  {
    name: "Suggest",
    description: "Alternative or complementary products (e.g. local choices)",
  },
]

const ActionsForHomePage: Action[] = [
  {
    name: "Smart Search",
    description: "Search for products based on your preferences",
  }
]

const AIAssistant = () => {
  const [open, setOpen] = useState(false)
  const [openSearch, setOpenSearch] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const modalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [barcode, setBarcode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [compareCodes, setCompareCodes] = useState<string[]>([])

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.source !== window || !event.data?.type) return

      if (event.data.type === "add-to-compare") {
        // check if code is already in compareCodes array
        if (compareCodes.includes(event.data.payload.code)) return
        const { code } = event.data.payload
        // Add code to compareCodes array
        setCompareCodes((prev) => [...prev, code])
      }
    }

    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  useEffect(() => {
    const url = window.location.href;
    const match = url?.match(/openfoodfacts\.org\/product\/(\d+)/)
    const barcode = match?.[1]
    setBarcode(barcode)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  // Scroll to bottom of messages always
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleActionClick = (action: Action) => {
    if (!barcode) {
      console.log("no barcode")
      return
    }

    if (barcode) {
      console.log("barcode", barcode)
    }

    setInput(`${action.name}: ${action.description}`)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const handleCompareClick = async () => {
    if (compareCodes.length === 0) return
    // Fetch data from API for both products and create a preFix
    setLoading(true)
    console.log("Fetching data for both products")
    const productData1 = await fetch(`https://world.openfoodfacts.org/api/v0/product/${compareCodes[0]}.json`)
    const productData2 = await fetch(`https://world.openfoodfacts.org/api/v0/product/${compareCodes[1]}.json`)
    const productRes = await productData1.json()
    const productRes2 = await productData2.json()
    console.log("productRes", productRes)
    console.log("productRes2", productRes2)
    const product1 = productRes.product
    const product2 = productRes2.product

    const preFix = `You are a helpful assistant that helps people find the best products. Here is the product info:
Product No 1
Product Name: ${product1.product_name}
Brand: ${product1.brands}
Categories: ${product1.categories_tags?.join(", ")}
Labels: ${product1.labels_tags?.join(", ")}
NutriScore: ${product1.nutriscore_grade}
Nova Group: ${product1.nova_group}
Allergens: ${product1.allergens_tags?.join(", ")}
Ingredient Analysis: ${product1.ingredients_analysis_tags?.join(", ")}
Ingredients: ${product1.ingredients_text_with_allergens}
Nutrition Facts per 100g:
- Energy: ${product1.nutriments.energy_100g} kJ
- Fat: ${product1.nutriments.fat_100g} g
- Saturated Fat: ${product1.nutriments['saturated-fat_100g']} g
- Sugars: ${product1.nutriments.sugars_100g} g
- Salt: ${product1.nutriments.salt_100g} g
- Proteins: ${product1.nutriments.proteins_100g} g   
Product No ${compareCodes[1]} 
Product Name: ${product2.product_name}
Brand: ${product2.brands}
Categories: ${product2.categories_tags?.join(", ")}
Labels: ${product2.labels_tags?.join(", ")}
NutriScore: ${product2.nutriscore_grade}
Nova Group: ${product2.nova_group}
Allergens: ${product2.allergens_tags?.join(", ")}
Ingredient Analysis: ${product2.ingredients_analysis_tags?.join(", ")}
Ingredients: ${product2.ingredients_text_with_allergens}
Nutrition Facts per 100g:
- Energy: ${product2.nutriments.energy_100g} kJ
- Fat: ${product2.nutriments.fat_100g} g
- Saturated Fat: ${product2.nutriments['saturated-fat_100g']} g
- Sugars: ${product2.nutriments.sugars_100g} g
- Salt: ${product2.nutriments.salt_100g} g
- Proteins: ${product2.nutriments.proteins_100g} g

Compare both the products and tell some insights about them.
`
    console.log("preFix", preFix)
    console.log("Calling backend API")
    const res = await fetch("http://localhost:3000/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: preFix }),
    })
    console.log("Response from backend API", res)

    const data = await res.json()
    console.log("data", data)
    setLoading(false)
    setMessages((prev) => [
      ...prev,
      {
        content: data.text,
        isUser: false,
      },
    ])
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return

    // Add user message
    setMessages((prev) => [...prev, { content: input, isUser: true }])
    setLoading(true)

    try {
      let prefix = ""

      if (barcode) {
        const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
        const productData = await res.json()

        if (productData.status !== 1) {
          setLoading(false)
          return
        }

        prefix = `You are a helpful assistant that helps people find the best products. Here is the product info:
Product Name: ${productData.product.product_name}
Brand: ${productData.product.brands}
Categories: ${productData.product.categories_tags?.join(", ")}
Labels: ${productData.product.labels_tags?.join(", ")}
NutriScore: ${productData.product.nutriscore_grade}
Nova Group: ${productData.product.nova_group}
Allergens: ${productData.product.allergens_tags?.join(", ")}
Ingredient Analysis: ${productData.product.ingredients_analysis_tags?.join(", ")}
Ingredients: ${productData.product.ingredients_text_with_allergens}
Nutrition Facts per 100g:
- Energy: ${productData.product.nutriments.energy_100g} kJ
- Fat: ${productData.product.nutriments.fat_100g} g
- Saturated Fat: ${productData.product.nutriments['saturated-fat_100g']} g
- Sugars: ${productData.product.nutriments.sugars_100g} g
- Salt: ${productData.product.nutriments.salt_100g} g
- Proteins: ${productData.product.nutriments.proteins_100g} g
- Fiber: ${productData.product.nutriments.fiber_100g} g
Please answer the following question as best you can.`
      }

      const res = await fetch("http://localhost:3000/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prefix + input }),
      })

      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          content: data.text,
          isUser: false,
        },
      ])
    } catch (error) {
      console.error("Error sending prompt:", error)
    }

    setLoading(false)
    setInput("")
  }



  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed bottom-2 right-2 md:bottom-8 md:right-8 z-50 font-sans">
      {open && (
        <div
          ref={modalRef}
          className="absolute pointer-events-auto bottom-10 right-0 w-[90vw] sm:w-[400px] md:w-[550px] h-[600px] bg-[#f5f3ef] rounded-2xl shadow-xl border border-[#201a17] overflow-hidden flex flex-col"
        // onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-[#201a17]">
            <h3 className="text-[#201a17] font-semibold flex items-center">
              <Sparkles className="h-4 w-4 mr-2 text-indigo-600" />
              AI Assistant
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-[#201a17] hover:bg-[#eddfdb]"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <div
            onMouseOver={() => {

            }}
            className="p-3 border-b border-[#201a17]">
            {barcode ? <div className="flex w-full h-fit flex-wrap gap-1.5">
              {Actions.map((action, index) => (
                <button
                  key={index}
                  className="flex bg-[#eddfdb] justify-center py-1.5 px-3 rounded-full items-center hover:bg-[#e5d0c9] transition-colors"
                  onClick={() => handleActionClick(action)}
                  title={action.description}
                >
                  <p className="text-xs sm:text-sm text-[#201a17] font-medium">{action.name}</p>
                </button>
              ))}
            </div> : <div className="flex w-full h-fit flex-wrap gap-1.5">
              {ActionsForHomePage.map((action, index) => (
                <button
                  key={index}
                  className="flex bg-[#eddfdb] justify-center py-1.5 px-3 rounded-full items-center hover:bg-[#e5d0c9] transition-colors"
                  onClick={() => {
                    setOpenSearch(true)
                  }}
                  title={action.description}
                >
                  <p className="text-xs sm:text-sm text-[#201a17] font-medium">{action.name}</p>
                </button>
              ))}
            </div>}
          </div>

          {/* Chat area */}
          <ScrollArea className="flex-1 p-4 bg-white/50">
            {messages.length === 0 ? (
              <>
                
                {compareCodes.length > 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 p-4 bg-white/80">
                    {
                      loading ? <button
                        title="Click to compare products"
                        disabled
                        className="text-[#201a17] px-2 gap-0.5 font-semibold flex justify-center items-center">
                          <Loader className="h-6 w-6 animate-spin text-[#201a17]" />
                          Comparing
                          </button> : <button
                          title="Click to compare products"
                          onClick={handleCompareClick}
                          className="text-[#201a17] cursor-pointer font-semibold">Click To Compare</button>
                    }
                    <div className="flex gap-2 items-center">
                      {compareCodes.map((code, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white"></div>
                          <p className="text-xs sm:text-sm text-[#201a17] font-medium">
                            {code}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="h-full flex items-center justify-center text-center p-4">
                  <div className="text-[#201a17] opacity-70">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
                    <p>Ask me anything or select an action above to get started!</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {/* Comparing Products Display */}
                {compareCodes.length > 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 p-4 bg-white/80">
                    <div className="text-[#201a17] font-semibold">Click To Compare</div>
                    <div className="flex gap-2 items-center">
                      {compareCodes.map((code, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <div className="w-4 h-4 rounded-full bg-indigo-600 text-white"></div>
                          <p className="text-xs sm:text-sm text-[#201a17] font-medium">
                            {code}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.isUser ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] p-3 rounded-lg break-words overflow-wrap-anywhere",
                        msg.isUser
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-[#eddfdb] text-[#201a17] rounded-bl-none",
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">
                        <Markdown>{msg.content}</Markdown>
                      </p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="h-fit w-fit pl-3">
                    <Loader className="h-6 w-6 animate-spin text-[#201a17]" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input area */}
          <div className="p-3 border-t border-[#201a17] bg-white/80">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="flex-1 bg-white border-[#201a17] focus-visible:ring-indigo-600"
              />
              <Button onClick={handleSendMessage} size="icon" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <Button
        onClick={() => setOpen(!open)}
        className="px-5 py-3 rounded-full bg-indigo-600 font-sans hover:bg-indigo-700 text-white font-semibold shadow-lg"
      >
        <Sparkles className="h-4 w-4" />
        Ask AI
      </Button>

      {openSearch && (
        <SearchModal
          onClose={() => setOpenSearch(false)}
        />
      )}
    </div>
  )
}

export default AIAssistant
