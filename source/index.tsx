import * as Forto from "forto"
import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Platform from "./platform"
import FortoPop from "./forto"
import Transition from "./transition"
import { noop } from "./utils"

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

class Popover extends React.Component<Props, { el: null | Element }> {
  static defaultProps = {
    tipSize: 7,
    preferPlace: null,
    place: null,
    // offset: 4,
    isOpen: false,
    onOuterAction: noop,
    children: null,
    refreshIntervalMs: 200,
    appendTarget: Platform.isClient ? Platform.document!.body : null,
  }

  targetRef = React.createRef<HTMLDivElement>()

  // checkForOuterAction = (event: MouseEvent | TouchEvent) => {
  //   const isOuterAction =
  //     event.target &&
  //     event.target instanceof Element &&
  //     !(
  //       this.state.arrangement!.popover.contains(event.target) ||
  //       this.state.arrangement!.target.contains(event.target) ||
  //       this.state.arrangement!.tip.contains(event.target)
  //     )
  //   if (isOuterAction) this.props.onOuterAction(event)
  // }

  render() {
    // TODO Refactor initial tip sizing logic
    const { isOpen, children, appendTarget, ...fortoPopProps } = this.props
    const popover = (
      <Transition>
        {isOpen ? (
          <FortoPop {...fortoPopProps} target={this.state.el!} />
        ) : null}
      </Transition>
    )

    return [children, ReactDOM.createPortal(popover, appendTarget)]
  }

  componentDidMount() {
    this.setState({
      el: ReactDOM.findDOMNode(this) as Element,
    })
  }
}

export default Popover
