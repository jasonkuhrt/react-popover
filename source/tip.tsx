import * as React from "react"

type Direction = "Bottom" | "Top" | "Right" | "Left"

type Shape = {
  points: string
  width: number
  height: number
}

// TODO refactor comments
const calcPoints = (size: number, direction: Direction): string => {
  const mainLength = size
  const crossLength = size * 2
  const points =
    direction === "Bottom" // direction top
      ? `0,${mainLength} ${mainLength},0, ${crossLength},${mainLength}`
      : direction === "Top" // Direction bottom
        ? `0,0 ${mainLength},${mainLength}, ${crossLength},0`
        : direction === "Right"
          ? `${mainLength},0 0,${mainLength}, ${mainLength},${crossLength}`
          : `0,0 ${mainLength},${mainLength}, 0,${crossLength}`

  return points
}

const calcShape = (size: number, side: Direction) => {
  const isPortrait = side === "Top" || side === "Bottom"
  const mainLength = size
  const crossLength = size * 2
  return {
    width: isPortrait ? crossLength : mainLength,
    height: isPortrait ? mainLength : crossLength,
    points: calcPoints(size, side),
  }
}

const updateElementShape = (tip: Element, tipShape: Shape) => {
  tip.setAttribute("width", String(tipShape.width))
  tip.setAttribute("height", String(tipShape.height))
  const tipShapeEl = tip.querySelector(".Popover-tipShape") as Element
  tipShapeEl.setAttribute("points", tipShape.points)
}

const Component = ({}) => (
  <svg
    className="Popover-tip"
    style={{ position: "absolute", display: "block", left: 0, top: 0 }}
  >
    <polygon className="Popover-tipShape" />
  </svg>
)

export { calcShape, updateElementShape, Component }
