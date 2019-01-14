import * as Forto from "forto"
import * as React from "react"

interface Props {
  size: number
}

/**
 * A component for rendering a visual "tip" intended as the graphic
 * between a popover and what its target is.
 */
const Tip: React.SFC<Props> = ({ size }) => (
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

/**
 * Get the rotation of the tip such that for a given zone
 * it would be pointing toward the target. This calculation
 * is tightly coupled to the intrinsic direction the tip is
 * in at rest (0 deg). That is determined by the Tip component.
 *
 * The reason this is not a prop of the tip component is that
 * this calculation is made for Popmotion which directly
 * animates the underlying dom elements.
 */
const tipRotationForZone = (zone: Forto.Zone): number => {
  return zone.side === "Bottom"
    ? 270
    : zone.side === "Top"
    ? 90
    : zone.side === "Right"
    ? 180
    : 0
}

export default Tip

export { tipRotationForZone }
