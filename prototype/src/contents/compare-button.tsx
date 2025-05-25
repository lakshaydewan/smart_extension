// contents/compare-button-injector.tsx
import { WindIcon } from "lucide-react"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect } from "react"

export const config: PlasmoCSConfig = {
    matches: ["https://world.openfoodfacts.org/*"]
}

const CompareButtonInjector = () => {
    useEffect(() => {
        const injectButtons = () => {
            const containerAnchor = document.querySelectorAll(".list_product_a")
            // or adjust selector

            containerAnchor.forEach((anchor) => {
                const card = anchor.querySelector(".list_product_sc") as HTMLElement
                if (!card || card.querySelector(".plasmo-compare-btn")) return

                // adjust card style
                card.style.display = "flex"
                card.style.justifyContent = "center"
                card.style.alignItems = "center"

                const button = document.createElement("button")
                button.textContent = "Compare"
                button.className = "plasmo-compare-btn"
                button.style.cssText = `
          background: #007bff;
          color: white;
          border: none;
          padding: 6px 6px;
          cursor: pointer;
          z-index: 100;
          font-size: 12px;
          border-radius: 4px;
        `

                const link = anchor as HTMLAnchorElement

                button.addEventListener("click", (event) => {
                    event.preventDefault()
                    event.stopPropagation()

                    const href = link.href
                    const code = href?.split("/product/")[1]?.split("/")[0]
                    console.log("code", code)
                    if (!code) return

                    window.postMessage(
                        {
                            type: "add-to-compare",
                            payload: { code }
                        },
                        "*"
                    )
                    button.textContent = "Added !"
                    button.disabled = true
                    button.style.opacity = "0.6"
                    button.style.background = "#28a745"
                })

                card.appendChild(button)
            })
        }

        const observer = new MutationObserver(injectButtons)
        observer.observe(document.body, { childList: true, subtree: true })

        injectButtons() // initial injection

        return () => observer.disconnect()
    }, [])

    return null
}

export default CompareButtonInjector
