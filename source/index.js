import * as Forto from "forto"
import * as T from "prop-types"
import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Platform from "./platform"
import * as Tip from "./tip"
import { noop, px } from "./utils"

// TODO Animation

class Popover extends React.Component {
  static propTypes = {
    body: T.node.isRequired,
    children: T.element.isRequired,
    appendTarget: T.object,
    isOpen: T.bool,
    place: T.oneOf([
      ...Object.values(Forto.Settings.Order),
      ...Object.values(Forto.Settings.Ori.Side),
      ...Object.values(Forto.Settings.Ori.Ori),
    ]),
    preferPlace: T.oneOf([
      ...Object.values(Forto.Settings.Order),
      ...Object.values(Forto.Settings.Ori.Side),
      ...Object.values(Forto.Settings.Ori.Ori),
    ]),
    refreshIntervalMs: T.oneOfType([T.number, T.bool]),
    tipSize: T.number,
    onOuterAction: T.func,
    // enterExitTransitionDurationMs: T.number, TODO
    // offset: T.number, TODO
    // className: T.string,
    // style: T.object,
  }
  static defaultProps = {
    tipSize: 7,
    preferPlace: null,
    place: null,
    // offset: 4,
    isOpen: false,
    onOuterAction: noop,
    enterExitTransitionDurationMs: 500,
    children: null,
    refreshIntervalMs: 200,
    appendTarget: Platform.isClient ? Platform.document.body : null,
  }

  constructor(props) {
    super(props)
    this.popoverRef = React.createRef()
    this.state = {}
  }

  toggleForto(isEnabled) {
    if (isEnabled) {
      this.enableForto()
    } else {
      this.disableForto()
    }
  }

  enableForto() {
    // TODO do and isClient check?

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

    const arrangement = {
      target: ReactDOM.findDOMNode(this),
      frame: window,
      tip: this.popoverRef.current.querySelector("svg"),
      popover: this.popoverRef.current.querySelector(".Popover-body"),
    }

    // TODO Refactor once Forto has better entrypoint API
    const settings = {
      elligibleZones: this.props.place ? [this.props.place] : null,
      preferredZones: this.props.preferPlace ? [this.props.preferPlace] : null,
    }
    const layoutChangesStream = this.props.refreshIntervalMs
      ? Forto.DOM.observeWithPolling(
          settings,
          arrangement,
          this.props.refreshIntervalMs,
        )
      : Forto.DOM.observe(settings, arrangement)
    this.layoutChangesSubscription = layoutChangesStream.subscribe(
      updateArrangement,
    )

    /* Track user actions on the page. Anything that occurs _outside_ the Popover boundaries
    should close the Popover. */

    Platform.document.addEventListener("mousedown", this.checkForOuterAction)
    Platform.document.addEventListener("touchstart", this.checkForOuterAction)

    // Expose arrangement on state so that check outer function can handle it.
    this.setState({ arrangement })
  }

  disableForto() {
    // disable may occur without there having been a subscription; For example,
    // it may occur on component mount.
    if (this.layoutChangesSubscription) {
      this.layoutChangesSubscription.unsubscribe()
    }
    Platform.document.removeEventListener("mousedown", this.checkForOuterAction)
    Platform.document.removeEventListener(
      "touchstart",
      this.checkForOuterAction,
    )
  }

  componentDidMount() {
    this.toggleForto(this.props.isOpen)
  }

  componentDidUpdate(previousProps) {
    if (this.props.isOpen !== previousProps.isOpen) {
      this.toggleForto(this.props.isOpen)
    }
  }

  componentWillUnmount() {
    this.toggleForto(false)
  }

  checkForOuterAction = event => {
    const isOuterAction = !(
      this.state.arrangement.popover.contains(event.target) ||
      this.state.arrangement.target.contains(event.target) ||
      this.state.arrangement.tip.contains(event.target)
    )
    if (isOuterAction) this.props.onOuterAction(event)
  }

  render() {
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
