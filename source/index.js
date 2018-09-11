import * as Forto from "forto"
import * as T from "prop-types"
import * as React from "react"
import * as ReactDOM from "react-dom"
import posed from "react-pose"
import * as Platform from "./platform"
import * as Tip from "./tip"
import { noop, px } from "./utils"

// TODO Animation

const PopoverContainer = posed.div({
  open: {
    opacity: 1,
    x: props => props.x,
    y: props => props.y,
  },
  closed: {
    opacity: 0,
    x: props => props.x,
    y: props => props.y,
  },
})

const TipComponent = posed.div({
  open: {
    left: props => props.x2,
    top: props => props.y2,
  },
  closed: {
    left: props => props.x2,
    top: props => props.y2,
  },
})

class _Popover extends React.Component {
  state = {
    layout: {
      popover: { x: 0, y: 0 },
      tip: { x: 0, y: 0 },
    },
  }

  constructor(props) {
    super(props)
    this.popoverRef = React.createRef()
  }

  toggleForto(isEnabled) {
    if (isEnabled) {
      this.enableForto()
    } else {
      this.disableForto()
    }
  }

  enableForto() {
    // TODO isClient check?
    const updateArrangement = newLayout => {
      Tip.updateElementShape(
        arrangement.tip,
        Tip.calcShape(this.props.tipSize, newLayout.zone.side),
      )
      this.setState({
        layout: newLayout,
      })
    }

    const arrangement = {
      target: this.props.target,
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
    this.toggleForto(true)
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
    const { body } = this.props
    const { layout } = this.state
    return (
      <PopoverContainer
        innerRef={currentRef => (this.popoverRef.current = currentRef)}
        pose={"open"}
        poseKey={Math.random()}
        x={px(layout.popover.x)}
        y={px(layout.popover.y)}
        style={{ position: "absolute" }}
      >
        <div className="Popover-body" children={body} />
        <TipComponent
          className="Popover-tip"
          pose={"open"}
          poseKey={Math.random()}
          style={{
            position: "absolute",
          }}
          // TODO Report bug that occurs if these are called x / y
          x2={px(layout.tip.x)}
          y2={px(layout.tip.y)}
        >
          <Tip.Component />
        </TipComponent>
      </PopoverContainer>
    )
  }
}

class Popover extends React.Component {
  state = {}
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
    // offset: T.number, TODO
  }
  static defaultProps = {
    tipSize: 7,
    preferPlace: null,
    place: null,
    // offset: 4,
    isOpen: false,
    onOuterAction: noop,
    // enterExitTransitionDurationMs: 500,
    children: null,
    refreshIntervalMs: 200,
    appendTarget: Platform.isClient ? Platform.document.body : null,
  }

  constructor(props) {
    super(props)
  }
  componentDidMount() {
    this.setState({ target: ReactDOM.findDOMNode(this) })
  }

  render() {
    const { isOpen, appendTarget, ...popoverProps } = this.props
    const { target } = this.state
    const popover =
      isOpen && target ? <_Popover target={target} {...popoverProps} /> : null
    return [this.props.children, ReactDOM.createPortal(popover, appendTarget)]
  }
}

export default Popover
