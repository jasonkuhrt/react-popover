import * as React from "react"

const noop = () => {
  return undefined
}

type HTMLRef = React.RefObject<HTMLElement>

const createHTMLRef = (): HTMLRef => {
  return React.createRef<HTMLElement>()
}

export { noop, createHTMLRef, HTMLRef }
