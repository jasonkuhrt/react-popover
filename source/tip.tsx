import * as React from "react"

const Component = ({ size }: { size: number }) => (
  <svg
    className="Popover-tip"
    style={{ position: "absolute", display: "block", left: 0, top: 0 }}
    width={size}
    height={size * 2}
  >
    <polygon
      className="Popover-tipShape"
      points={`0,0 ${size},${size}, 0,${size * 2}`}
    />
  </svg>
)

export { Component }
