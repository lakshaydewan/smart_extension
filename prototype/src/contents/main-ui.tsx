import Core from "~components/core"
import type { PlasmoCSConfig } from "plasmo"
import React from "react"
import cssText from "data-text:~/style.css"

export const config: PlasmoCSConfig = {
  matches: ["https://world.openfoodfacts.org/*"]
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

const AIAssistantButton = () => {
  return (
    <Core />
  )
}

export default AIAssistantButton;
