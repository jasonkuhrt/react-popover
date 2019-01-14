import * as React from "react"
import * as Popmotion from "popmotion"

const noop = () => {
  return undefined
}

type HTMLRef = React.RefObject<HTMLElement>

const createHTMLRef = (): HTMLRef => {
  return React.createRef<HTMLElement>()
}

/**
 * Helper to move an object around with Pop motion without actually animating it.
 * This is useful when an object needs to animation from a starting position
 * that it isn't already in. Classic use-case is an "enter" animation.
 */
const noAnimUpdate = (
  reaction: Popmotion.ValueReaction,
  props: any, // TODO Popmotion does not export a Value type to use here.
): void => {
  reaction.update(props)
  reaction.velocityCheck({ timestamp: 0, delta: 0 })
}

export { noop, createHTMLRef, HTMLRef, noAnimUpdate }
