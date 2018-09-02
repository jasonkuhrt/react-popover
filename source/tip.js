import * as React from "react"

const calcPoints = (size, direction) => {
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

const calcShape = (size, side) => {
  const isPortrait = side === "Top" || side === "Bottom"
  const mainLength = size
  const crossLength = size * 2
  return {
    width: isPortrait ? crossLength : mainLength,
    height: isPortrait ? mainLength : crossLength,
    points: calcPoints(size, side),
  }
}

const updateElementShape = (tip, tipShape) => {
  tip.setAttribute("width", tipShape.width)
  tip.setAttribute("height", tipShape.height)
  tip.querySelector(".Popover-tipShape").setAttribute("points", tipShape.points)
}

const Component = () => (
  <svg className="Popover-tip" style={{ position: "absolute" }}>
    <polygon className="Popover-tipShape" />
  </svg>
)

export { calcShape, updateElementShape, Component }
