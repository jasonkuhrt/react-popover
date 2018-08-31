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
      // console.log(
      //   this.popoverRef.current && this.popoverRef.current.querySelector("svg"),
      // )
      // console.log(
      //   this.popoverRef.current &&
      //     this.popoverRef.current.querySelector(".Popover-body"),
      // )
      const arrangement = {
        target: ReactDOM.findDOMNode(this),
        frame: window,
        tip: this.popoverRef.current.querySelector("svg"),
        popover: this.popoverRef.current.querySelector(".Popover-body"),
      }

      const layoutChangesStream = Forto.DOM.observeWithPolling({}, arrangement)
      this.layoutChangesSubscription = layoutChangesStream.subscribe(
        newLayout => {
          // TODO remove
          console.log("arrangement", arrangement)

          // TODO Add forto setting to return absolute instead of relative tip positioning.
          // Or just always provide both. Also adjust popover layout to fit in tip, hmm
          // not already done?
          arrangement.popover.style.top = `${newLayout.popover.y +
            this.props.tipSize *
              (newLayout.zone.side === "Bottom"
                ? 1
                : newLayout.zone.side === "Top"
                  ? -1
                  : 0)}px`
          arrangement.popover.style.left = `${newLayout.popover.x +
            this.props.tipSize *
              (newLayout.zone.side === "Right"
                ? 1
                : newLayout.zone.side === "Left"
                  ? -1
                  : 0)}px`
          arrangement.tip.style.top = `${newLayout.tip.y +
            +(newLayout.zone.side === "Bottom"
              ? newLayout.popover.y
              : newLayout.zone.side === "Top"
                ? newLayout.popover.y +
                  arrangement.popover.getBoundingClientRect().height -
                  arrangement.tip.getBoundingClientRect().height
                : 0)}px`
          arrangement.tip.style.left = `${newLayout.tip.x +
            (newLayout.zone.side === "Right"
              ? newLayout.popover.x
              : newLayout.zone.side === "Left"
                ? newLayout.popover.x +
                  arrangement.popover.getBoundingClientRect().width -
                  arrangement.tip.getBoundingClientRect().width
                : 0)}px`

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
      console.log("layout", this.state.layout)
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
