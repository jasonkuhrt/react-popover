import * as React from "react"
import * as Forto from "forto"
import * as Popmotion from "popmotion"
import * as F from "../lib/utils"
import Tip, { tipRotationForZone } from "./Tip"

/**
 * Helper to move an object around with Pop motion without actually animating it.
 * This is useful when an object needs to animation from a starting position
 * that it isn't already in. Classic use-case is an "enter" animation.
 */
const noAnimUpdate = (
  reaction: Popmotion.ValueReaction,
  props: any, // TODO Popmotion does not export a Value type to use here.
): void => {
  reaction.update(props)
  reaction.velocityCheck({ timestamp: 0, delta: 0 })
}

interface Props {
  target: HTMLElement
  frame: Window | HTMLElement
  body: React.ReactNode
  /**
   * Interval in time between checks for if new relayout is necessary.
   * Setting to `null` will disable polling altogether and rely solely on
   * events like window resize for doing relayout. Defaults to 1000.
   */
  refreshIntervalMs: null | number
  place: Forto.Settings.SettingsUnchecked["elligibleZones"]
  preferPlace: Forto.Settings.SettingsUnchecked["preferredZones"]
  pose: null | "exit"
  onPoseComplete: Function
  tipSize: number
}

class PopoverCore extends React.Component<Props, {}> {
  static defaultProps = {
    onPoseComplete: F.noop,
    pose: null,
  }

  // TODO refactor: Use React State feature instead of raw class state
  popoverReaction: Popmotion.ValueReaction = Popmotion.value({
    x: 0,
    y: 5,
    opacity: 0,
  })
  // Set the origin to center-left. Origin values are percentage based.
  // Movement is relative to center. Learn more about the weirdness here:
  // https://github.com/Popmotion/popmotion/issues/573
  tipReaction: Popmotion.ValueReaction = Popmotion.value({
    x: 0,
    y: 0,
    rotate: 0,
    originX: -50,
    originY: 0.001,
  })
  popoverRef = React.createRef<HTMLDivElement>()
  layout: null | Forto.Calculation = null
  fortoLayoutsSubscription: null | ZenObservable.Subscription = null
  exiting: any
  tipChangingZones: null | Popmotion.ColdSubscription = null

  moveTipIntoPreLayoutPosition(layout: Forto.Calculation) {
    const axes = Forto.createCompositor(layout.zone)

    noAnimUpdate(this.tipReaction, {
      ...(this.tipReaction.get() as any),
      ...axes.translate(layout.tip!, {
        main: axes.awayFromTarget(8),
      }),
      rotate: tipRotationForZone(layout.zone),
    })
  }

  animateTipToLayout(
    layout: Forto.Calculation,
    layoutBefore: null | Forto.Calculation,
  ) {
    if (layoutBefore && layoutBefore.zone.side !== layout.zone.side) {
      // TODO
      // The problem here is that layout measurements will be made in accordance with tip
      // before it is rotated, then once rotated, will overshoot new natural layout. The
      // rotation does trigger change detection however then we need to integrate that
      // detection in this existing running animationn.
      const axesBefore = Forto.createCompositor(layoutBefore.zone)
      const axesAfter = Forto.createCompositor(layout.zone)
      this.tipChangingZones = Popmotion.timeline([
        {
          track: "pos",
          from: layoutBefore.tip!,
          to: {
            ...(this.tipReaction.get() as any),
            ...axesBefore.translate(layoutBefore.tip!, {
              main: axesBefore.awayFromTarget(8),
            }),
          },
          duration: 350,
        },
        {
          track: "pos",
          to: {
            ...(this.tipReaction.get() as any),
            rotate: tipRotationForZone(layout.zone),
            ...axesAfter.translate(layout.tip!, {
              main: axesAfter.awayFromTarget(8),
            }),
          },
          duration: 0,
        },
        {
          track: "pos",
          to: {
            ...(this.tipReaction.get() as any),
            ...layout.tip!,
            rotate: tipRotationForZone(layout.zone),
          },
          duration: 350,
        },
      ]).start({
        update: (tl: any) => {
          this.tipReaction.update(tl.pos)
        },
      })
    } else {
      Popmotion.spring({
        from: this.tipReaction.get(),
        to: {
          ...(this.tipReaction.get() as any),
          ...layout.tip!,
          // TODO Consider doing conditional check for zone change
          rotate: tipRotationForZone(layout.zone),
        },
        velocity: this.tipReaction!.getVelocity(),
        stiffness: 450,
        damping: 35,
        mass: 1.5,
      }).start(this.tipReaction)
    }
  }

  movePopoverIntoPreLayoutPosition(layout: Forto.Calculation) {
    const axes = Forto.createCompositor(layout.zone)

    noAnimUpdate(this.popoverReaction, {
      ...(this.popoverReaction.get() as any),
      ...axes.translate(layout.popover, {
        main: axes.awayFromTarget(15),
      }),
    })
  }

  animatePopoverToLayout(layout: Forto.Calculation) {
    Popmotion.spring({
      from: this.popoverReaction.get(),
      to: { ...layout.popover, opacity: 1 },
      velocity: this.popoverReaction.getVelocity(),
      stiffness: 450,
      damping: 35,
      mass: 1.5,
    }).start(this.popoverReaction)
  }

  componentDidMount() {
    const arrangement = {
      target: this.props.target,
      frame: this.props.frame,
      tip: this.popoverRef.current!.querySelector(".Popover-tip")!,
      popover: this.popoverRef.current!.querySelector(".Popover-body")!,
    }

    const popoverStyle = Popmotion.styler(this.popoverRef.current!, {})
    const tipStyle = Popmotion.styler(arrangement.tip, {})

    this.popoverReaction.subscribe(popoverStyle.set)
    this.tipReaction.subscribe(tipStyle.set)

    const layoutChanges = Forto.DOM.observe(
      {
        elligibleZones: this.props.place,
        preferredZones: this.props.preferPlace,
        pollIntervalMs: this.props.refreshIntervalMs || 1000,
        boundingMode: "always",
        tipSize: this.props.tipSize,
      },
      arrangement,
    )

    let initialLayout = true

    this.fortoLayoutsSubscription = layoutChanges.subscribe(
      (newLayout: Forto.Calculation) => {
        // TODO As exiting continue animating everything else...?
        if (this.props.pose !== "exit") {
          if (initialLayout) {
            this.movePopoverIntoPreLayoutPosition(newLayout)
            this.moveTipIntoPreLayoutPosition(newLayout)
            initialLayout = false
          }
          this.animateTipToLayout(newLayout, this.layout)
          this.animatePopoverToLayout(newLayout)
        }
        this.layout = newLayout
      },
    )
  }

  componentDidUpdate(prevProps: Props) {
    // console.log("componentDidUpdate")
    if (
      this.layout &&
      this.popoverReaction &&
      prevProps.pose !== this.props.pose &&
      this.props.pose === null
    ) {
      // console.log("interrupt")
      // TODO https://github.com/Popmotion/popmotion/issues/543
      this.exiting.stop()
      this.animatePopoverToLayout(this.layout)
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
      const axes = Forto.createCompositor(this.layout.zone)
      const newXY = axes.translate(this.layout.popover, {
        // TODO this should be same as enter size
        main: axes.awayFromTarget(20),
      })
      this.exiting = Popmotion.tween({
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
    if (this.fortoLayoutsSubscription) {
      this.fortoLayoutsSubscription.unsubscribe()
    }
    if (this.popoverReaction) {
      this.popoverReaction.stop()
    }
  }

  render() {
    return (
      <div ref={this.popoverRef} style={{ position: "absolute" }}>
        <div className="Popover-body">{this.props.body}</div>
        <Tip size={this.props.tipSize} />
      </div>
    )
  }
}

export default PopoverCore
export { PopoverCore as Component, Props }
