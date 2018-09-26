import * as Forto from "forto"
import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Platform from "./platform"
import * as Tip from "./tip"
import * as Pop from "popmotion"
import { noop } from "./utils"

interface Subscription {
  closed: boolean
  unsubscribe(): void
}

type State = {
  arrangement: null | Forto.DOM.Arrangement
  layout: null | Forto.Calculation
}

type Props = {
  body: React.ReactNode
  children: React.ReactElement<unknown> // TODO infer?
  appendTarget: Element
  isOpen: boolean
  place: Forto.Settings.Order | Forto.Settings.Ori.Side | Forto.Settings.Ori.Ori
  preferPlace:
    | Forto.Settings.Order
    | Forto.Settings.Ori.Side
    | Forto.Settings.Ori.Ori
  refreshIntervalMs: null | number
  tipSize: number
  onOuterAction(event: MouseEvent | TouchEvent): void
}

class Popover extends React.Component<Props, State> {
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
    appendTarget: Platform.isClient ? Platform.document!.body : null,
  }

  popoverElement: null | Element = null
  layoutChangesSubscription: null | Subscription = null

  constructor(props: Props) {
    super(props)
    this.state = {
      layout: null,
      arrangement: null,
    }
  }

  toggleForto(isEnabled: boolean) {
    if (isEnabled) {
      this.enableForto()
    } else {
      this.disableForto()
    }
  }

  enableForto() {
    const updateArrangement = (newLayout: Forto.Calculation) => {
      Tip.updateElementShape(
        arrangement.tip!,
        Tip.calcShape(this.props.tipSize, newLayout.zone.side),
      )
      const popoverStyle = Pop.styler(this.popoverElement!, {})
      const tipStyle = Pop.styler(arrangement.tip, {})
      popoverStyle.set(newLayout.popover)
      tipStyle.set(newLayout.tip!)

      this.setState({
        layout: newLayout,
      })
    }

    const arrangement = {
      target: ReactDOM.findDOMNode(this) as Element,
      frame: window,
      tip: this.popoverElement!.querySelector(".Popover-tip")!,
      popover: this.popoverElement!.querySelector(".Popover-body")!,
    }

    // TODO Refactor once Forto has better entrypoint API
    // TODO Suggest to Forto to accept singular in addition to list
    const settings: Forto.Settings.SettingsUnchecked = {
      elligibleZones: this.props.place ? [this.props.place] : undefined,
      preferredZones: this.props.preferPlace
        ? [this.props.preferPlace]
        : undefined,
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

    Platform.document!.addEventListener("mousedown", this.checkForOuterAction)
    Platform.document!.addEventListener("touchstart", this.checkForOuterAction)

    // Expose arrangement on state so that check outer function can handle it.
    this.setState({ arrangement })
  }

  disableForto() {
    // disable may occur without there having been a subscription; For example,
    // it may occur on component mount.
    if (this.layoutChangesSubscription) {
      this.layoutChangesSubscription.unsubscribe()
      this.layoutChangesSubscription = null
    }
    Platform.document!.removeEventListener(
      "mousedown",
      this.checkForOuterAction,
    )
    Platform.document!.removeEventListener(
      "touchstart",
      this.checkForOuterAction,
    )
    this.setState({
      layout: null,
      arrangement: null,
    })
    this.popoverElement = null
  }

  componentDidMount() {
    if (Platform.isClient) {
      this.toggleForto(this.props.isOpen)
    }
  }

  componentDidUpdate(previousProps: Props) {
    if (this.props.isOpen !== previousProps.isOpen) {
      this.toggleForto(this.props.isOpen)
    }
  }

  componentWillUnmount() {
    this.toggleForto(false)
  }

  checkForOuterAction = (event: MouseEvent | TouchEvent) => {
    const isOuterAction =
      event.target &&
      event.target instanceof Element &&
      !(
        this.state.arrangement!.popover.contains(event.target) ||
        this.state.arrangement!.target.contains(event.target) ||
        this.state.arrangement!.tip.contains(event.target)
      )
    if (isOuterAction) this.props.onOuterAction(event)
  }

  render() {
    const { isOpen, body, appendTarget } = this.props
    // const { layout } = this.state
    const popover = !isOpen ? null : (
      <div
        ref={currentRef => (this.popoverElement = currentRef)}
        style={{ position: "absolute" }}
      >
        <div className="Popover-body" children={body} />
        <Tip.Component />
      </div>
    )
    return [this.props.children, ReactDOM.createPortal(popover, appendTarget)]
  }
}

export default Popover
