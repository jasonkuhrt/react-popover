
const isServer = typeof window === `undefined`
const isClient = !isServer
const WINDOW = isClient ? window : null



export {
  isServer,
  isClient,
  WINDOW as window,
}
