import * as React from "react"
import * as Forto from "forto"
import * as Pop from "popmotion"
import * as Tip from "./tip"
import * as F from "./utils"

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
  pose?: "exit"
  onPoseComplete: Function
}

class FortoPop extends React.Component<Props, {}> {
  static defaultProps = {
    onPoseComplete: F.noop,
  }
  layout: null | Forto.Calculation = null
  popoverRef = React.createRef<HTMLDivElement>()
  layoutsSubscription: null | Subscription = null
  popoverReaction: null | Pop.ValueReaction = null
  exiting: any

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

    const popoverReaction = Pop.value(
      { x: 0, y: 5, opacity: 0 },
      popoverStyle.set,
    )

    const layouts = Forto.DOM.observeWithPolling(
      // const layouts = Forto.DOM.observe(
      {
        elligibleZones: this.props.place,
        preferredZones: this.props.preferPlace,
      },
      arrangement,
      this.props.refreshIntervalMs || 1000,
    )

    this.popoverReaction = popoverReaction
    this.layoutsSubscription = layouts.subscribe(
      (newLayout: Forto.Calculation) => {
        // console.log("newLayout", newLayout)

        if (!this.layout) {
          // console.log("enter for first time")
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

        this.layout = newLayout
        if (this.props.pose === "exit") return

        Tip.updateElementShape(
          arrangement.tip!,
          // Tip.calcShape(this.props.tipSize, newLayout.zone.side),
          Tip.calcShape(8, newLayout.zone.side),
        )
        tipStyle.set(newLayout.tip!)
        this.springToLayout()
      },
    )
  }

  springToLayout() {
    // console.log("springToLayout")
    Pop.spring({
      from: this.popoverReaction!.get(),
      to: { ...this.layout!.popover, opacity: 1 },
      velocity: this.popoverReaction!.getVelocity(),
      stiffness: 450,
      damping: 35,
      mass: 1.5,
    }).start(this.popoverReaction!)
  }

  componentDidUpdate(prevProps: Props) {
    // console.log("componentDidUpdate")
    if (
      this.layout &&
      this.popoverReaction &&
      prevProps.pose !== this.props.pose &&
      this.props.pose === undefined
    ) {
      // console.log("interrupt")
      // TODO https://github.com/Popmotion/popmotion/issues/543
      this.exiting.stop()
      this.springToLayout()
    } else if (
      this.layout &&
      this.popoverReaction &&
      prevProps.pose !== this.props.pose &&
      this.props.pose === "exit"
    ) {
      // console.log("exit")
      // TODO We need a way to manually schedule a new layout
      // measurement. Imaginne we are polling, imagine that
      // exit starts between polls. It will animate to a
      // stale (aka. incorrect) layout position.

      // We are using pose exit short circuit now
      // this.layoutsSubscription!.unsubscribe()

      // TODO When exiting after a recent animation it animates to a
      // weird XY as if current XY is a lag
      // TODO better DSL from forto
      const newXY = {
        [Forto.Ori.crossAxis(Forto.Ori.fromSide(this.layout.zone))]: this.layout
          .popover[Forto.Ori.crossAxis(Forto.Ori.fromSide(this.layout.zone))],
        [Forto.Ori.mainAxis(Forto.Ori.fromSide(this.layout.zone))]:
          this.layout.popover[
            Forto.Ori.mainAxis(Forto.Ori.fromSide(this.layout.zone))
          ] +
          // TODO this should be same as enter size
          -20 *
            // TODO orientation check instead of side check
            (this.layout.zone.side === Forto.Ori.Side.Top ||
            this.layout.zone.side === Forto.Ori.Side.Left
              ? 1
              : -1),
      }
      this.exiting = Pop.tween({
        from: this.popoverReaction.get(),
        to: { ...newXY, opacity: 0 },
        duration: 150,
      }).start({
        update: (value: { opacity: number }) => {
          // console.log("exit update")
          this.popoverReaction!.update(value)
        },
        complete: () => {
          // console.log("exit complete")
          this.props.onPoseComplete()
        },
      })
    }
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
export { FortoPop as Component, Props }
