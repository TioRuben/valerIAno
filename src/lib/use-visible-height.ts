import { useEffect, useState } from "react"

// Height of the area actually visible (excludes the on-screen keyboard).
export function useVisibleHeight(): number | undefined {
  const [height, setHeight] = useState<number | undefined>(undefined)

  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    function update(): void {
      setHeight(viewport?.height)
      window.scrollTo(0, 0)
    }
    update()
    viewport.addEventListener("resize", update)
    return (): void => viewport.removeEventListener("resize", update)
  }, [])

  return height
}
