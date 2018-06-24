
const isServer = typeof window === "undefined"
const isClient = !isServer
const WINDOW = isClient ? window : null
const DOCUMENT = isClient ? document : null



export default {
  isServer,
  isClient,
  window: WINDOW,
  document: DOCUMENT,
}
export {
  isServer,
  isClient,
  WINDOW as window,
  DOCUMENT as document,
}
