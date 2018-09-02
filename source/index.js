// import * as cssVendor from "css-vendor"
// import Debug from "debug"
// import throttle from "lodash.throttle"
// import T from "prop-types"
import * as Forto from "forto"
import React from "react"
import ReactDOM from "react-dom"
import Platform from "./platform"
import * as Tip from "./tip"
import { px } from "./utils"

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
      const arrangement = {
        target: ReactDOM.findDOMNode(this),
        frame: window,
        tip: this.popoverRef.current.querySelector("svg"),
        popover: this.popoverRef.current.querySelector(".Popover-body"),
      }

      const updateArrangement = newLayout => {
        arrangement.popover.style.top = px(newLayout.popover.y)
        arrangement.popover.style.left = px(newLayout.popover.x)
        arrangement.tip.style.top = px(newLayout.tip.y)
        arrangement.tip.style.left = px(newLayout.tip.x)
        Tip.updateElementShape(
          arrangement.tip,
          Tip.calcShape(this.props.tipSize, newLayout.zone.side),
        )
      }

      const layoutChangesStream = Forto.DOM.observeWithPolling({}, arrangement)
      this.layoutChangesSubscription = layoutChangesStream.subscribe(
        updateArrangement,
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
        <Tip.Component />
      </div>
    )
    return [
      this.props.children,
      ReactDOM.createPortal(popover, this.props.appendTarget),
    ]
  }
}

export default Popover
