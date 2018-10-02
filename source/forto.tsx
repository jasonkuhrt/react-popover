import * as React from "react"
import * as Forto from "forto"
import * as Pop from "popmotion"
import * as Tip from "./tip"

interface Subscription {
  closed: boolean
  unsubscribe(): void
}

// TODO Support ref, outerAction will need it
interface Props {
  target: Element
  body: React.ReactNode
  refreshIntervalMs: null | number
  place: Forto.Settings.Order | Forto.Settings.Ori.Side | Forto.Settings.Ori.Ori
  preferPlace:
    | Forto.Settings.Order
    | Forto.Settings.Ori.Side
    | Forto.Settings.Ori.Ori
}

class FortoPop extends React.Component<Props, {}> {
  layout: null | Forto.Calculation = null
  popoverRef = React.createRef<HTMLDivElement>()
  layoutsSubscription: null | Subscription = null
  popoverReaction: null | Pop.ValueReaction = null

  render() {
    return (
      <div ref={this.popoverRef} style={{ position: "absolute" }}>
        <div className="Popover-body" children={this.props.body} />
        {/* <Tip.Component width={tipShape.width} height={tipShape.height} /> */}
        <Tip.Component width={8} height={8} />
      </div>
    )
  }

  componentDidMount() {
    const arrangement = {
      // TODO is this .current safe?
      target: this.props.target!,
      frame: window,
      tip: this.popoverRef.current!.querySelector(".Popover-tip")!,
      popover: this.popoverRef.current!.querySelector(".Popover-body")!,
    }

    const popoverStyle = Pop.styler(this.popoverRef.current!, {})
    const tipStyle = Pop.styler(arrangement.tip, {})

    // TODO Rename identifier since its not just position, but rather includes opacity too.
    const popoverReaction = Pop.value({ x: 0, y: 5, opacity: 0 })
    popoverReaction.subscribe(popoverStyle.set)

    // TODO Refactor once Forto has better entrypoint API
    // TODO Suggest to Forto to accept singular in addition to list
    const settings: Forto.Settings.SettingsUnchecked = {
      elligibleZones: this.props.place ? [this.props.place] : undefined,
      preferredZones: this.props.preferPlace
        ? [this.props.preferPlace]
        : undefined,
    }

    const layouts = this.props.refreshIntervalMs
      ? Forto.DOM.observeWithPolling(
          settings,
          arrangement,
          this.props.refreshIntervalMs,
        )
      : Forto.DOM.observe(settings, arrangement)

    this.popoverReaction = popoverReaction
    this.layoutsSubscription = layouts.subscribe(
      (newLayout: Forto.Calculation) => {
        Tip.updateElementShape(
          arrangement.tip!,
          // Tip.calcShape(this.props.tipSize, newLayout.zone.side),
          Tip.calcShape(8, newLayout.zone.side),
        )

        if (!this.layout) {
          this.layout = newLayout
          // TODO: Create issue with Forto, we need a better DSL :)
          popoverReaction.update({
            ...(popoverReaction.get() as any),
            [Forto.Ori.crossAxis(Forto.Ori.fromSide(newLayout.zone))]: newLayout
              .popover[Forto.Ori.crossAxis(Forto.Ori.fromSide(newLayout.zone))],
            [Forto.Ori.mainAxis(Forto.Ori.fromSide(newLayout.zone))]:
              newLayout.popover[
                Forto.Ori.mainAxis(Forto.Ori.fromSide(newLayout.zone))
              ] +
              15 *
                (newLayout.zone.side === Forto.Ori.Side.Top ||
                newLayout.zone.side === Forto.Ori.Side.Left
                  ? -1
                  : 1),
          })
          popoverReaction.velocityCheck({ timestamp: 0, delta: 0 })
        }

        Pop.spring({
          from: popoverReaction.get(),
          to: { ...newLayout.popover, opacity: 1 },
          velocity: this.layout ? popoverReaction.getVelocity() : 0,
          stiffness: 450,
          damping: 35,
          mass: 1.5,
        }).start(popoverReaction)

        tipStyle.set(newLayout.tip!)
      },
    )
  }

  componentWillUnmount() {
    if (this.layoutsSubscription) {
      this.layoutsSubscription.unsubscribe()
    }
    if (this.popoverReaction) {
      this.popoverReaction.stop()
    }
  }
}

export default FortoPop
