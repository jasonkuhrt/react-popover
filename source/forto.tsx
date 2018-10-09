import * as React from "react"
import * as Forto from "forto"
import * as Pop from "popmotion"
import * as Tip from "./tip"
import * as F from "./utils"

interface Subscription {
  closed: boolean
  unsubscribe(): void
}

const crossAxis = (zone: Forto.Zone) =>
  Forto.Ori.crossAxis(Forto.Ori.fromSide(zone))

const mainAxis = (zone: Forto.Zone) =>
  Forto.Ori.mainAxis(Forto.Ori.fromSide(zone))

const createAxes = (zone: Forto.Zone) => {
  const ca = crossAxis(zone)
  const ma = mainAxis(zone)
  return {
    cross: {
      prop: ca,
      pos: (pos: any) => pos[ca],
    },
    main: {
      prop: ma,
      pos: (pos: any) => pos[ma],
    },
  }
}

const layoutOrderNum = (zone: Forto.Zone): -1 | 1 => {
  return zone.side === Forto.Ori.Side.Top || zone.side === Forto.Ori.Side.Left
    ? -1
    : 1
}

const awayFromTarget = (zone: Forto.Zone, n: number) => {
  return n * layoutOrderNum(zone)
}

const tipRotationForZone = (zone: Forto.Zone) => {
  return zone.side === "Bottom"
    ? 270
    : zone.side === "Top"
      ? 90
      : zone.side === "Right"
        ? 180
        : 0
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
  tipChangingZones: null | Pop.ColdSubscription = null

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
    const tipReaction = Pop.value({ x: 0, y: 5 }, tipStyle.set)

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
        console.log("newLayout", newLayout)

        if (!this.layout) {
          // console.log("enter for first time")
          // TODO: Create issue with Forto, we need a better DSL :)
          // }
          const axes = createAxes(newLayout.zone)
          popoverReaction.update({
            ...(popoverReaction.get() as any),
            [axes.cross.prop]: axes.cross.pos(newLayout.popover),
            [axes.main.prop]:
              axes.main.pos(newLayout.popover) +
              awayFromTarget(newLayout.zone, 15),
          })
          popoverReaction.velocityCheck({ timestamp: 0, delta: 0 })
        }

        // Handle Tip
        if (!this.layout) {
          Tip.updateElementShape(
            arrangement.tip!,
            // Tip.calcShape(this.props.tipSize, newLayout.zone.side),
            Tip.calcShape(8, newLayout.zone.side),
          )
          Pop.spring({
            from: tipReaction!.get(),
            to: newLayout!.tip!,
            velocity: tipReaction!.getVelocity(),
            stiffness: 450,
            damping: 35,
            mass: 1.5,
          }).start(tipReaction)
        } else {
          // TODO
          // The problem here is that layout measurements will be made in accordance with tip
          // before it is rotated, then once rotated, will overshoot new natural layout. The
          // rotation does trigger change detection however then we need to integrate that
          // detection in this existing running animationn.
          const zoneChange = this.layout.zone.side !== newLayout.zone.side
          if (zoneChange) {
            console.log("do tip zone-change animation")
            const axesBefore = createAxes(this.layout.zone)
            const axesAfter = createAxes(newLayout.zone)
            this.tipChangingZones = Pop.timeline([
              {
                track: "pos",
                from: this.layout.tip!,
                to: {
                  [axesBefore.cross.prop]: axesBefore.cross.pos(
                    this.layout.tip,
                  ),
                  [axesBefore.main.prop]:
                    axesBefore.main.pos(this.layout.tip) +
                    awayFromTarget(this.layout.zone, 8),
                },
                duration: 350,
              },
              {
                track: "pos",
                to: {
                  rotate: tipRotationForZone(newLayout.zone),
                  [axesAfter.cross.prop]: axesAfter.cross.pos(newLayout.tip),
                  [axesAfter.main.prop]:
                    axesAfter.main.pos(newLayout.tip) +
                    awayFromTarget(newLayout.zone, 8),
                },
                duration: 0,
              },
              {
                track: "pos",
                to: {
                  ...newLayout.tip!,
                  rotate: tipRotationForZone(newLayout.zone),
                },
                duration: 350,
              },
            ]).start({
              update: (tl: any) => {
                tipReaction.update(tl.pos)
              },
            })
          } else if (
            this.tipChangingZones &&
            this.tipChangingZones.getProgress!() === 1
          ) {
            // tipStyle.set(newLayout.tip!)
            Pop.spring({
              from: tipReaction!.get(),
              to: this.layout!.tip!,
              velocity: tipReaction!.getVelocity(),
              stiffness: 450,
              damping: 35,
              mass: 1.5,
            }).start(tipReaction)
          }
        }

        this.layout = newLayout
        if (this.props.pose === "exit") return

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
      const axes = createAxes(this.layout.zone)
      const newXY = {
        [axes.cross.prop]: axes.cross.pos(this.layout.popover),
        [axes.main.prop]:
          axes.main.pos(this.layout.popover) +
          // TODO this should be same as enter size
          awayFromTarget(this.layout.zone, 20),
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
