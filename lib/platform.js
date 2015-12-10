
const isServer = typeof window === `undefined`
const isClient = !isServer
const WINDOW = isClient ? window : null



export default {
  isServer,
  isClient,
  window: WINDOW,
}
export {
  isServer,
  isClient,
  WINDOW as window,
}
