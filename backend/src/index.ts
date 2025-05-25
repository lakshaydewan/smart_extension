import { GoogleGenerativeAI } from "@google/generative-ai"
import express, { Request, Response } from "express"
import cors from "cors"
import dotenv from "dotenv"


dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash"
})

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get("/", (_req: Request, res: Response) => {
  res.send("")
})

app.post("/prompt", async (req: Request, res: Response) => {
  const { prompt } = req.body

  if (!prompt) {
    res.json({ error: "No prompt provided" })
    return
  }

  const result = await model.generateContent(prompt)

  const response = result.response
  const text = response.text()

  res.json({ text })
})

app.post('/search', async (req: Request, res: Response) => {
  // query is a natural language search query that user types in
  const { query } = req.body

  if (!query) {
    res.json({ error: "No query provided" })
  }

  try {
    const prompt = `
You are an assistant that converts natural language food queries into structured JSON filters for the Open Food Facts Search-a-licious API.

Instructions:
Extract relevant fields and values from the user query and return a valid JSON filter object using Open Food Facts field names and formats. Follow these guidelines:

✅ Field Name Mapping and Formatting
Query Concept	Field Name	Format
Product category	categories_tags	kebab-case
Brand	brands_tags	lowercase
Store	stores_tags	lowercase
Labels/Claims	labels_tags	kebab-case
NutriScore	nutriscore_grade	lowercase (a–e)
Countries	countries_tags	kebab-case
Ingredients	ingredients_tags	kebab-case
Packaging	packaging_tags	kebab-case
Ecoscore	ecoscore_grade	lowercase (a–e)
Nova group	nova_group	Integer (1–4)
Additives	additives_tags	kebab-case
Origins	origins_tags	kebab-case
Allergens	allergens_tags	kebab-case

🧠 Behavior Notes
You may extract and normalize multiple filters from the query.

Convert user-friendly terms to corresponding tag values when necessary (e.g., "vegan" → labels_tags: "vegan").

Use plural tags if needed, e.g., "labels_tags": ["organic", "gluten-free"].

🧾 Example
Given the query:

"Find vegan snacks with NutriScore B sold in Germany with eco-friendly packaging"

Return:

json
Copy
Edit
{
  "filters": {
    "search_terms": "vegan+snacks",
    "categories_tags": "snacks",
    "nutriscore_grade": "b",
    "countries_tags": "germany",
    "packaging_tags": "eco-friendly"
  }
}
Query: "${query}"
Respond with JSON only.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    console.log("Prompt:", prompt)
    console.log("Response:", text)

    // Sanitize Markdown code block if present
    const jsonText = text.replace(/```json|```/g, "").trim()

    let filters: { filters?: Record<string, string | string[]> } = {}

    try {
      filters = JSON.parse(jsonText)
    } catch (error) {
      console.error("Failed to parse filters JSON:", error)
      throw new Error("Invalid JSON returned from prompt")
    }

    // Build OFF API URL with dynamic filters
    const params = new URLSearchParams({
      json: "1",
      page_size: "50",
      action: 'process'
    })

    // Convert camelCase to snake_case for OFF API
    const toSnakeCase = (str: string): string =>
      str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

    if (filters?.filters) {
      for (const [key, value] of Object.entries(filters.filters)) {
        if (value) {
          const apiKey = toSnakeCase(key)
          if (Array.isArray(value)) {
            // Add multiple entries for array values
            for (const item of value) {
              params.append(apiKey, item)
            }
          } else {
            params.set(apiKey, value)
          }
        }
      }
    }

    const apiUrl = `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`
    console.log("Final OFF API URL:", apiUrl)

    const apiRes = await fetch(apiUrl)
    const data: any = await apiRes.json()

    if (!data) {
      throw new Error("No products found")
    }

    res.json({
      filters,
      products: data?.products || []
    })
  } catch (err: any) {
    console.error("Gemini search error:", err)
    res.json({ error: err.message || "Internal Server Error" })
  }

})

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
