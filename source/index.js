// import * as cssVendor from "css-vendor"
// import Debug from "debug"
// import throttle from "lodash.throttle"
// import T from "prop-types"
// import Utils from "./utils"
import * as Forto from "forto"
import React from "react"
import ReactDOM from "react-dom"
import Platform from "./platform"

const calcTipWidthHeight = (size, direction) => {
  const isPortrait = direction === "Top" || direction === "Bottom"
  const mainLength = size
  const crossLength = size * 2
  return {
    width: isPortrait ? crossLength : mainLength,
    height: isPortrait ? mainLength : crossLength,
  }
}

const calcTipPoints = (size, direction) => {
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

class Popover extends React.Component {
  static defaultProps = {
    // TODO This will not work out well, body gets wiped
    appendTarget: Platform.isClient ? Platform.document.body : null,
    tipSize: 7,
  }

  constructor(props) {
    super(props)
    this.popoverRef = React.createRef()
    this.tipRef = React.createRef()
    this.state = {}
  }

  toggleForto(isEnabled) {
    if (isEnabled) {
      // TODO Remove
      const arrangement = {
        target: ReactDOM.findDOMNode(this),
        frame: window,
        tip: this.popoverRef.current.querySelector("svg"),
        popover: this.popoverRef.current.querySelector(".Popover-body"),
      }

      const layoutChangesStream = Forto.DOM.observeWithPolling({}, arrangement)
      this.layoutChangesSubscription = layoutChangesStream.subscribe(
        newLayout => {
          const px = n => `${n}px`

          // TODO Add forto setting to return absolute instead of relative tip positioning.
          // Or just always provide both. Also adjust popover layout to fit in tip, hmm
          // not already done?
          arrangement.popover.style.top = px(newLayout.popover.y)
          arrangement.popover.style.left = px(newLayout.popover.x)
          arrangement.tip.style.top = px(newLayout.tip.y)
          arrangement.tip.style.left = px(newLayout.tip.x)
          console.log("newLayout.popover.y", newLayout.popover.y)
          console.log("newLayout.tip.y", newLayout.tip.y)

          // TODO Refactor. Maybe one function instead of two to make calculations
          const tipDim = calcTipWidthHeight(
            this.props.tipSize,
            newLayout.zone.side,
          )
          arrangement.tip.setAttribute("width", tipDim.width)
          arrangement.tip.setAttribute("height", tipDim.height)
          arrangement.tip
            .querySelector(".Popover-tipShape")
            .setAttribute(
              "points",
              calcTipPoints(this.props.tipSize, newLayout.zone.side),
            )
        },
      )
    } else {
      this.layoutChangesSubscription.unsubscribe()
    }
  }

  componentDidMount() {
    if (this.props.isOpen) {
      this.toggleForto()
    }
  }

  componentDidUpdate(previousProps) {
    if (this.props.isOpen !== previousProps.isOpen) {
      this.toggleForto(this.props.isOpen)
    }
  }

  render() {
    if (this.props.isOpen) {
    }
    const popover = !this.props.isOpen ? null : (
      <div ref={this.popoverRef}>
        <div
          className="Popover-body"
          children={this.props.body}
          style={{ position: "absolute" }}
        />
        <svg className="Popover-tip" style={{ position: "absolute" }}>
          <polygon className="Popover-tipShape" />
        </svg>
      </div>
    )
    return [
      this.props.children,
      ReactDOM.createPortal(popover, this.props.appendTarget),
    ]
  }
}

export default Popover
