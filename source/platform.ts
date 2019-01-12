const isServer = typeof window === "undefined"
const isClient = !isServer
const WINDOW = isClient ? window : null
const DOCUMENT = isClient ? document : null

export { WINDOW as window, DOCUMENT as document }
