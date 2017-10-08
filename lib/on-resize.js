/* eslint no-param-reassign: 0 */

import { window, isServer } from "./platform"
import { noop } from "./utils"


const requestAnimationFrame = isServer
  ? noop
  : window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    ((fn) => { window.setTimeout(fn, 20) })

const cancelAnimationFrame = isServer
  ? noop
  : window.cancelAnimationFrame ||
    window.mozCancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.clearTimeout

const isIE = isServer ? false : navigator.userAgent.match(/Trident/)

const namespace = "__resizeDetector__"



const uninitialize = (el) => {
  el[namespace].destroy()
  el[namespace] = undefined
}



const createElementHack = () => {
  const el = document.createElement("object")
  el.className = "resize-sensor"
  el.setAttribute("style", "display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;")
  el.setAttribute("class", "resize-sensor")
  el.type = "text/html"
  el.data = "about:blank"
  return el
}



const initialize = (el) => {

  const detector = el[namespace] = {}
  detector.listeners = []

  const onResize = (e) => {
    /* Keep in mind e.target could be el OR objEl. In this current implementation we don't seem to need to know this but its important
    to not forget e.g. in some future refactoring scenario. */
    if (detector.resizeRAF) cancelAnimationFrame(detector.resizeRAF)
    detector.resizeRAF = requestAnimationFrame(() => {
      detector.listeners.forEach((fn) => { fn(e) })
    })
  }

  if (isIE) {
    /* We do not support ie8 and below (or ie9 in compat mode).
    Therefore there is no presence of `attachEvent` here. */
    el.addEventListener("onresize", onResize)
    detector.destroy = () => {
      el.removeEventListener("onresize", onResize)
    }
  } else {
    if (getComputedStyle(el).position === "static") {
      detector.elWasStaticPosition = true
      el.style.position = "relative"
    }
    const objEl = createElementHack()
    objEl.onload = function (/* event */) {
      this.contentDocument.defaultView.addEventListener("resize", onResize)
    }
    detector.destroy = () => {
      if (detector.elWasStaticPosition) el.style.position = ""
      // Event handlers will be automatically removed.
      // http://stackoverflow.com/questions/12528049/if-a-dom-element-is-removed-are-its-listeners-also-removed-from-memory
      el.removeChild(objEl)
    }

    el.appendChild(objEl)
  }
}



const on = (el, fn) => {

  /* Window object natively publishes resize events. We handle it as a
  special case here so that users do not have to think about two APIs. */

  if (el === window) {
    window.addEventListener("resize", fn)
    return
  }

  /* Not caching namespace read here beacuse not guaranteed that its available. */

  if (!el[namespace]) initialize(el)
  el[namespace].listeners.push(fn)
}



const off = (el, fn) => {
  if (el === window) {
    window.removeEventListener("resize", fn)
    return
  }
  const detector = el[namespace]
  if (!detector) return
  const i = detector.listeners.indexOf(fn)
  if (i !== -1) detector.listeners.splice(i, 1)
  if (!detector.listeners.length) uninitialize(el)
}



export default {
  on,
  off,
  addEventListener: on,
  removeEventListener: off,
}
export {
  on,
  off,
  on as addEventListener,
  off as removeEventListener,
}
