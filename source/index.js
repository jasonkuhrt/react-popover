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
  const isPortrait = direction === "up" || direction === "down"
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
    direction === "up"
      ? `0,${mainLength} ${mainLength},0, ${crossLength},${mainLength}`
      : direction === "down"
        ? `0,0 ${mainLength},${mainLength}, ${crossLength},0`
        : direction === "left"
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
  }

  toggleForto(isEnabled) {
    if (isEnabled) {
      console.log(
        this.popoverRef.current && this.popoverRef.current.querySelector("svg"),
      )
      const arrangement = {
        target: ReactDOM.findDOMNode(this),
        frame: window,
        tip:
          this.popoverRef.current &&
          this.popoverRef.current.querySelector("svg"),
        popover: this.popoverRef.current,
      }

      const layoutChangesStream = Forto.DOM.observeWithPolling({}, arrangement)
      this.layoutChangesSubscription = layoutChangesStream.subscribe(
        newLayout => {
          arrangement.popover.style.top = `${newLayout.popover.y}px`
          arrangement.popover.style.left = `${newLayout.popover.x}px`
          // Tip is a separate react component and expects its change to come through props
          this.setState({ layout: newLayout })
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
    console.log(this.state && this.state.layout)
    const popover = !this.props.isOpen ? null : (
      <div style={{ position: "absolute" }} ref={this.popoverRef}>
        <div className="Popover-body" children={this.props.body} />
        <svg
          className="Popover-tip"
          {...calcTipWidthHeight(this.props.tipSize, "up")}
        >
          <polygon
            className="Popover-tipShape"
            points={calcTipPoints(this.props.tipSize, "up")}
          />
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
