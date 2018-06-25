// import * as cssVendor from "css-vendor"
// import Debug from "debug"
// import throttle from "lodash.throttle"
// import T from "prop-types"
// import Layout from "./layout"
// import resizeEvent from "./on-resize"
// import Tip from "./tip"
// import Utils from "./utils"
import * as Forto from "forto"
import React from "react"
import ReactDOM from "react-dom"
import Platform from "./platform"

class Popover extends React.Component {
  static defaultProps = {
    appendTarget: Platform.isClient ? Platform.document.body : null,
  }

  constructor(props) {
    super(props)
    this.popoverRef = React.createRef()
  }
  componentDidMount() {
    if (this.props.isOpen) {
      this.toggleForto()
    }
  }
  toggleForto(isEnabled) {
    if (isEnabled) {
      const arrangement = {
        target: ReactDOM.findDOMNode(this),
        frame: window,
        // tip: null,
        popover: this.popoverRef.current,
      }
      const layouts = Forto.Dom.observeWithPolling({}, arrangement)
      this.layoutsSubscription = layouts.subscribe(newLayout => {
        arrangement.popover.style.top = `${newLayout.popover.y}px`
        arrangement.popover.style.left = `${newLayout.popover.x}px`
      })
    } else {
      this.layoutsSubscription.unsubscribe()
    }
  }
  componentDidUpdate(previousProps) {
    if (this.props.isOpen !== previousProps.isOpen) {
      this.toggleForto(this.props.isOpen)
    }
  }
  render() {
    const popover = !this.props.isOpen ? null : (
      <div
        style={{ position: "absolute", background: "black" }}
        ref={this.popoverRef}
      >
        foobar
      </div>
    )
    return [
      this.props.children,
      ReactDOM.createPortal(popover, this.props.appendTarget),
    ]
  }
}

export default Popover
