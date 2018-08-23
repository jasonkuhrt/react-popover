// import * as cssVendor from "css-vendor"
// import Debug from "debug"
// import throttle from "lodash.throttle"
// import T from "prop-types"
// import Tip from "./tip"
// import Utils from "./utils"
import * as Forto from "forto"
import React from "react"
import ReactDOM from "react-dom"
import Platform from "./platform"

const startLayoutEngine = arrangement => {
  const applyNewLayout = arrangement => newLayout => {
    arrangement.popover.style.top = `${newLayout.popover.y}px`
    arrangement.popover.style.left = `${newLayout.popover.x}px`
  }
  const layoutChangesStream = Forto.DOM.observeWithPolling({}, arrangement)
  return layoutChangesStream.subscribe(applyNewLayout(arrangement))
}

class Popover extends React.Component {
  static defaultProps = {
    // TODO This will not work out well, body gets wiped
    appendTarget: Platform.isClient ? Platform.document.body : null,
  }

  constructor(props) {
    super(props)
    this.popoverRef = React.createRef()
  }

  toggleForto(isEnabled) {
    if (isEnabled) {
      const arrangement = {
        target: ReactDOM.findDOMNode(this),
        frame: window,
        // tip: null,
        popover: this.popoverRef.current,
      }
      this.layoutChangesSubscription = startLayoutEngine(arrangement)
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
