import { useState } from "react"

function IndexOptions() {
  const [data, setData] = useState("")

  return (
    <div>
      <h1 className="text-neutral-700">
        Welcome <a href="https://www.plasmo.com">Plasmo</a> Extension!
      </h1>
      <input onChange={(e) => setData(e.target.value)} value={data} />
      <footer>Crafted by @PlasmoHQ</footer>{" "}
    </div>
  )
}

export default IndexOptions
