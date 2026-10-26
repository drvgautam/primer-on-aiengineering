"use client"

import { createContext, useContext, useEffect } from "react"

// Print mode for the /book route: interactive pieces render in a form that survives paper.
// Stepped figures show every step; accordions open.
const PrintContext = createContext(false)

export function usePrint() {
  return useContext(PrintContext)
}

export function PrintProvider({ children }) {
  useEffect(() => {
    document.querySelectorAll("details").forEach((d) => {
      d.open = true
    })
    document.documentElement.dataset.printReady = "true"
  }, [])
  return <PrintContext.Provider value={true}>{children}</PrintContext.Provider>
}
