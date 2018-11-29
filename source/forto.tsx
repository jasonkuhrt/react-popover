import * as React from "react"
import * as Forto from "forto"
import * as Pop from "popmotion"
import * as F from "./utils"

interface Subscription {
  closed: boolean
  unsubscribe(): void
}

interface TipProps {
  size: number
}

/**
 * TODO
 */
const Tip: React.SFC<TipProps> = ({ size }) => (
  <svg
    className="Popover-tip"
    style={{ position: "absolute", display: "block", left: 0, top: 0 }}
    width={size}
    height={size * 2}
  >
    <polygon
      className="Popover-tipShape"
      points={`0,0 ${size},${size}, 0,${size * 2}`}
    />
  </svg>
)

// TODO: Create issue with Forto, we need a better DSL :)

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
      posAxis: (pos: any) => pos[ca],
    },
    main: {
      prop: ma,
      posAxis: (pos: any) => pos[ma],
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
  hasEntered: boolean = false

  render() {
    return (
      <div ref={this.popoverRef} style={{ position: "absolute" }}>
        <div className="Popover-body" children={this.props.body} />
        <Tip size={8} />
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
    const tipReaction = Pop.value(
      { x: 0, y: 0, rotate: 0, originX: -50, originY: 0.001 },
      tipStyle.set,
    )

    const layoutChanges = Forto.DOM.observe(
      {
        elligibleZones: this.props.place,
        preferredZones: this.props.preferPlace,
        tipSize: 8,
        pollIntervalMs: this.props.refreshIntervalMs || 1000,
      },
      arrangement,
    )

    this.popoverReaction = popoverReaction
    this.layoutsSubscription = layoutChanges.subscribe(
      (newLayout: Forto.Calculation) => {
        // console.log("newLayout", newLayout)

        // TODO As exiting continue animating everything else...?
        if (this.props.pose !== "exit") {
          if (!this.hasEntered) {
            this.movePopoverIntoPreLayoutPosition(popoverReaction, newLayout)
            this.moveTipIntoPreLayoutPosition(tipReaction, newLayout)
          }
          this.animateTipToLayout(tipReaction, newLayout, this.layout)
          this.animatePopoverToLayout(popoverReaction, newLayout)
          this.hasEntered = true
        }
        this.layout = newLayout
      },
    )
  }

  moveTipIntoPreLayoutPosition(
    tipReaction: Pop.ValueReaction,
    layout: Forto.Calculation,
  ) {
    const axes = createAxes(layout.zone)
    tipReaction.update({
      ...(tipReaction.get() as any),
      [axes.cross.prop]: axes.cross.posAxis(layout.tip),
      [axes.main.prop]:
        axes.main.posAxis(layout.tip) + awayFromTarget(layout.zone, 8),
      rotate: tipRotationForZone(layout.zone),
    })
    tipReaction.velocityCheck({ timestamp: 0, delta: 0 })
  }

  animateTipToLayout(
    tipReaction: Pop.ValueReaction,
    layout: Forto.Calculation,
    layoutBefore: null | Forto.Calculation,
  ) {
    if (layoutBefore && layoutBefore.zone.side !== layout.zone.side) {
      // TODO
      // The problem here is that layout measurements will be made in accordance with tip
      // before it is rotated, then once rotated, will overshoot new natural layout. The
      // rotation does trigger change detection however then we need to integrate that
      // detection in this existing running animationn.
      console.log("do tip zone-change animation")
      const axesBefore = createAxes(layoutBefore.zone)
      const axesAfter = createAxes(layout.zone)
      this.tipChangingZones = Pop.timeline([
        {
          track: "pos",
          from: layoutBefore.tip!,
          to: {
            ...(tipReaction.get() as any),
            [axesBefore.cross.prop]: axesBefore.cross.posAxis(layoutBefore.tip),
            [axesBefore.main.prop]:
              axesBefore.main.posAxis(layoutBefore.tip) +
              awayFromTarget(layoutBefore.zone, 8),
          },
          duration: 350,
        },
        {
          track: "pos",
          to: {
            ...(tipReaction.get() as any),
            rotate: tipRotationForZone(layout.zone),
            [axesAfter.cross.prop]: axesAfter.cross.posAxis(layout.tip),
            [axesAfter.main.prop]:
              axesAfter.main.posAxis(layout.tip) +
              awayFromTarget(layout.zone, 8),
          },
          duration: 0,
        },
        {
          track: "pos",
          to: {
            ...(tipReaction.get() as any),
            ...layout.tip!,
            rotate: tipRotationForZone(layout.zone),
          },
          duration: 350,
        },
      ]).start({
        update: (tl: any) => {
          tipReaction.update(tl.pos)
        },
      })
    } else {
      Pop.spring({
        from: tipReaction.get(),
        to: {
          ...(tipReaction.get() as any),
          ...layout.tip!,
          // TODO Consider doing conditional check for zone change
          rotate: tipRotationForZone(layout.zone),
        },
        velocity: tipReaction!.getVelocity(),
        stiffness: 450,
        damping: 35,
        mass: 1.5,
      }).start(tipReaction)
    }
  }

  movePopoverIntoPreLayoutPosition(
    popoverReaction: Pop.ValueReaction,
    layout: Forto.Calculation,
  ) {
    const axes = createAxes(layout.zone)
    popoverReaction.update({
      ...(popoverReaction.get() as any),
      [axes.cross.prop]: axes.cross.posAxis(layout.popover),
      [axes.main.prop]:
        axes.main.posAxis(layout.popover) + awayFromTarget(layout.zone, 15),
    })
    popoverReaction.velocityCheck({ timestamp: 0, delta: 0 })
  }

  animatePopoverToLayout(
    popoverReaction: Pop.ValueReaction,
    layout: Forto.Calculation,
  ) {
    Pop.spring({
      from: popoverReaction.get(),
      to: { ...layout.popover, opacity: 1 },
      velocity: popoverReaction.getVelocity(),
      stiffness: 450,
      damping: 35,
      mass: 1.5,
    }).start(popoverReaction)
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
      this.animatePopoverToLayout(this.popoverReaction, this.layout)
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
        [axes.cross.prop]: axes.cross.posAxis(this.layout.popover),
        [axes.main.prop]:
          axes.main.posAxis(this.layout.popover) +
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