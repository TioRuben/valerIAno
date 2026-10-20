import { useEffect } from "react"

export function ServiceWorkerRegister(): null {
  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js")
    }
  }, [])
  return null
}
