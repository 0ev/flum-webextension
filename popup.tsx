import { useState } from "react"

function IndexPopup() {
  const [data, setData] = useState("")

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}>
      <button onClick={() => setData("Hello")}>Click me</button>
    </div>
  )
}

export default IndexPopup
