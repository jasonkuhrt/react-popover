
const isServer = typeof window === `undefined`
const isBrowser = !isServer
const WINDOW = isBrowser ? window : null



export {
  isServer,
  isBrowser,
  WINDOW as window,
}
