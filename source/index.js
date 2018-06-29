import * as cssVendor from "css-vendor"
import Debug from "debug"
import throttle from "lodash.throttle"
import T from "prop-types"
import React from "react"
import ReactDOM from "react-dom"
import Layout from "./layout"
import resizeEvent from "./on-resize"
import Platform from "./platform"
import Tip from "./tip"
import Utils from "./utils"

const log = Debug("react-popover")

const supportedCSSValue = Utils.clientOnly(cssVendor.supportedValue)

const jsprefix = x => `${cssVendor.prefix.js}${x}`

const cssprefix = x => `${cssVendor.prefix.css}${x}`

const cssvalue = (prop, value) =>
  supportedCSSValue(prop, value) || cssprefix(value)

const coreStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  display: cssvalue("display", "flex"),
}

const faces = {
  above: "down",
  right: "left",
  below: "up",
  left: "right",
}

/* Flow mappings. Each map maps the flow domain to another domain. */

const flowToTipTranslations = {
  row: "translateY",
  column: "translateX",
}

const flowToPopoverTranslations = {
  row: "translateX",
  column: "translateY",
}

class Popover extends React.Component {
  static propTypes = {
    body: T.node.isRequired,
    children: T.element.isRequired,
    appendTarget: T.object,
    className: T.string,
    enterExitTransitionDurationMs: T.number,
    isOpen: T.bool,
    offset: T.number,
    place: T.oneOf(Layout.validTypeValues),
    preferPlace: T.oneOf(Layout.validTypeValues),
    refreshIntervalMs: T.oneOfType([T.number, T.bool]),
    style: T.object,
    tipSize: T.number,
    onOuterAction: T.func,
  }
  static defaultProps = {
    tipSize: 7,
    preferPlace: null,
    place: null,
    offset: 4,
    isOpen: false,
    onOuterAction: Utils.noop,
    enterExitTransitionDurationMs: 500,
    children: null,
    refreshIntervalMs: 200,
    appendTarget: Platform.isClient ? Platform.document.body : null,
  }
  constructor(props) {
    super(props)
    this.state = {
      standing: "above",
      exited: !this.props.isOpen, // for animation-dependent rendering, should popover close/open?
      exiting: false, // for tracking in-progress animations
      toggle: this.props.isOpen || false, // for business logic tracking, should popover close/open?
    }
  }
  componentDidMount() {
    /* Our component needs a DOM Node reference to the child so that it can be
    measured so that we can correctly layout the popover. We do not have any
    control over the child so cannot leverage refs. We could wrap our own
    primitive component around the child but that could lead to breaking the
    uses layout (e.g. the child is a flex item). Leveraging findDOMNode seems
    to be the only functional solution, despite all the general warnings not to
    use it. We have a legitimate use-case. */
    // eslint-disable-next-line
    this.targetEl = ReactDOM.findDOMNode(this)
    if (this.props.isOpen) this.enter()
  }
  componentWillReceiveProps(propsNext) {
    //log(`Component received props!`, propsNext)
    const willOpen = !this.props.isOpen && propsNext.isOpen
    const willClose = this.props.isOpen && !propsNext.isOpen

    if (willOpen) this.open()
    else if (willClose) this.close()
  }
  componentDidUpdate(propsPrev, statePrev) {
    //log(`Component did update!`)
    const didOpen = !statePrev.toggle && this.state.toggle
    const didClose = statePrev.toggle && !this.state.toggle

    if (didOpen) this.enter()
    else if (didClose) this.exit()
  }
  componentWillUnmount() {
    /* If the Popover is unmounted while animating,
    clear the animation so no setState occured */
    this.animateExitStop()
    /* If the Popover was never opened then then tracking
    initialization never took place and so calling untrack
    would be an error. Also see issue 55. */
    if (this.hasTracked) this.untrackPopover()
  }
  resolvePopoverLayout() {
    /* Find the optimal zone to position self. Measure the size of each zone and use the one with
    the greatest area. */

    const pickerSettings = {
      preferPlace: this.props.preferPlace,
      place: this.props.place,
    }

    /* This is a kludge that solves a general problem very specifically for Popover.
    The problem is subtle. When Popover positioning changes such that it resolves at
    a different orientation, its Size will change because the Tip will toggle between
    extending Height or Width. The general problem of course is that calculating
    zone positioning based on current size is non-trivial if the Size can change once
    resolved to a different zone. Infinite recursion can be triggered as we noted here:
    https://github.com/littlebits/react-popover/issues/18. As an example of how this
    could happen in another way: Imagine the user changes the CSS styling of the popover
    based on whether it was `row` or `column` flow. TODO: Find a solution to generally
    solve this problem so that the user is free to change the Popover styles in any
    way at any time for any arbitrary trigger. There may be value in investigating the
    http://overconstrained.io community for its general layout system via the
    constraint-solver Cassowary. */
    if (this.zone)
      this.size[this.zone.flow === "row" ? "h" : "w"] += this.props.tipSize
    const zone = Layout.pickZone(
      pickerSettings,
      this.frameBounds,
      this.targetBounds,
      this.size,
    )
    if (this.zone)
      this.size[this.zone.flow === "row" ? "h" : "w"] -= this.props.tipSize

    const tb = this.targetBounds
    this.zone = zone
    log("zone", zone)

    this.setState({
      standing: zone.standing,
    })

    const axis = Layout.axes[zone.flow]
    log("axes", axis)

    const dockingEdgeBufferLength =
      Math.round(getComputedStyle(this.bodyEl).borderRadius.slice(0, -2)) || 0
    const scrollSize = Layout.El.calcScrollSize(this.frameEl)
    scrollSize.main = scrollSize[axis.main.size]
    scrollSize.cross = scrollSize[axis.cross.size]

    /* When positioning self on the cross-axis do not exceed frame bounds. The strategy to achieve
    this is thus: First position cross-axis self to the cross-axis-center of the the target. Then,
    offset self by the amount that self is past the boundaries of frame. */
    const pos = Layout.calcRelPos(zone, tb, this.size)

    /* Offset allows users to control the distance betweent the tip and the target. */
    pos[axis.main.start] += this.props.offset * zone.order

    /* Constrain containerEl Position within frameEl. Try not to penetrate a visually-pleasing buffer from
    frameEl. `frameBuffer` length is based on tipSize and its offset. */

    const frameBuffer = this.props.tipSize + this.props.offset
    const hangingBufferLength =
      dockingEdgeBufferLength * 2 + this.props.tipSize * 2 + frameBuffer
    const frameCrossStart = this.frameBounds[axis.cross.start]
    const frameCrossEnd = this.frameBounds[axis.cross.end]
    const frameCrossLength = this.frameBounds[axis.cross.size]
    const frameCrossInnerLength = frameCrossLength - frameBuffer * 2
    const frameCrossInnerStart = frameCrossStart + frameBuffer
    const frameCrossInnerEnd = frameCrossEnd - frameBuffer
    const popoverCrossStart = pos[axis.cross.start]
    const popoverCrossEnd = pos[axis.cross.end]

    /* If the popover dose not fit into frameCrossLength then just position it to the `frameCrossStart`.
    popoverCrossLength` will now be forced to overflow into the `Frame` */
    if (pos.crossLength > frameCrossLength) {
      log("popoverCrossLength does not fit frame.")
      pos[axis.cross.start] = 0

      /* If the `popoverCrossStart` is forced beyond some threshold of `targetCrossLength` then bound
    it (`popoverCrossStart`). */
    } else if (tb[axis.cross.end] < hangingBufferLength) {
      log("popoverCrossStart cannot hang any further without losing target.")
      pos[axis.cross.start] = tb[axis.cross.end] - hangingBufferLength

      /* checking if the cross start of the target area is within the frame and it makes sense
    to try fitting popover into the frame. */
    } else if (tb[axis.cross.start] > frameCrossInnerEnd) {
      log("popoverCrossStart cannot hang any further without losing target.")
      pos[axis.cross.start] = tb[axis.cross.start] - this.size[axis.cross.size]

      /* If the `popoverCrossStart` does not fit within the inner frame (honouring buffers) then
    just center the popover in the remaining `frameCrossLength`. */
    } else if (pos.crossLength > frameCrossInnerLength) {
      log("popoverCrossLength does not fit within buffered frame.")
      pos[axis.cross.start] = (frameCrossLength - pos.crossLength) / 2
    } else if (popoverCrossStart < frameCrossInnerStart) {
      log("popoverCrossStart cannot reverse without exceeding frame.")
      pos[axis.cross.start] = frameCrossInnerStart
    } else if (popoverCrossEnd > frameCrossInnerEnd) {
      log("popoverCrossEnd cannot travel without exceeding frame.")
      pos[axis.cross.start] =
        pos[axis.cross.start] - (pos[axis.cross.end] - frameCrossInnerEnd)
    }

    /* So far the link position has been calculated relative to the target. To calculate the absolute
    position we need to factor the `Frame``s scroll position */

    pos[axis.cross.start] += scrollSize.cross
    pos[axis.main.start] += scrollSize.main

    /* Apply `flow` and `order` styles. This can impact subsequent measurements of height and width
    of the container. When tip changes orientation position due to changes from/to `row`/`column`
    width`/`height` will be impacted. Our layout monitoring will catch these cases and automatically
    recalculate layout. */
    if (this.containerEl) {
      this.containerEl.style.flexFlow = zone.flow
      this.containerEl.style[
        jsprefix("FlexFlow")
      ] = this.containerEl.style.flexFlow
    }
    this.bodyEl.style.order = zone.order
    this.bodyEl.style[jsprefix("Order")] = this.bodyEl.style.order

    /* Apply Absolute Positioning. */

    log("pos", pos)
    if (this.containerEl) {
      this.containerEl.style.top = `${pos.y}px`
      this.containerEl.style.left = `${pos.x}px`
    }

    /* Calculate Tip Position */

    let tipCrossPos =
      /* Get the absolute tipCrossCenter. Tip is positioned relative to containerEl
      but it aims at targetCenter which is positioned relative to frameEl... we
      need to cancel the containerEl positioning so as to hit our intended position. */
      Layout.centerOfBoundsFromBounds(zone.flow, "cross", tb, pos) +
      /* centerOfBounds does not account for scroll so we need to manually add that
      here. */
      scrollSize.cross -
      /* Center tip relative to self. We do not have to calcualte half-of-tip-size since tip-size
      specifies the length from base to tip which is half of total length already. */
      this.props.tipSize

    if (tipCrossPos < dockingEdgeBufferLength)
      tipCrossPos = dockingEdgeBufferLength
    else if (
      tipCrossPos >
      pos.crossLength - dockingEdgeBufferLength - this.props.tipSize * 2
    ) {
      tipCrossPos =
        pos.crossLength - dockingEdgeBufferLength - this.props.tipSize * 2
    }

    this.tipEl.style.transform = `${
      flowToTipTranslations[zone.flow]
    }(${tipCrossPos}px)`
    this.tipEl.style[jsprefix("Transform")] = this.tipEl.style.transform
  }
  checkTargetReposition = () => {
    if (this.measureTargetBounds()) this.resolvePopoverLayout()
  }
  measurePopoverSize() {
    this.size = Layout.El.calcSize(this.containerEl)
  }
  measureTargetBounds() {
    const newTargetBounds = Layout.El.calcBounds(this.targetEl)

    if (
      this.targetBounds &&
      Layout.equalCoords(this.targetBounds, newTargetBounds)
    ) {
      return false
    }

    this.targetBounds = newTargetBounds
    return true
  }
  open() {
    if (this.state.exiting) this.animateExitStop()
    this.setState({ toggle: true, exited: false })
  }
  close() {
    this.setState({ toggle: false })
  }
  enter() {
    if (Platform.isServer) return
    log("enter!")
    this.trackPopover()
    this.animateEnter()
  }
  exit() {
    log("exit!")
    this.animateExit()
    this.untrackPopover()
  }
  animateExitStop() {
    clearTimeout(this.exitingAnimationTimer1)
    clearTimeout(this.exitingAnimationTimer2)
    this.setState({ exiting: false })
  }
  animateExit() {
    this.setState({ exiting: true })
    this.exitingAnimationTimer2 = setTimeout(() => {
      setTimeout(() => {
        if (this.containerEl) {
          this.containerEl.style.transform = `${
            flowToPopoverTranslations[this.zone.flow]
          }(${this.zone.order * 50}px)`
          this.containerEl.style.opacity = "0"
        }
      }, 0)
    }, 0)

    this.exitingAnimationTimer1 = setTimeout(() => {
      this.setState({ exited: true, exiting: false })
    }, this.props.enterExitTransitionDurationMs)
  }
  animateEnter() {
    /* Prepare `entering` style so that we can then animate it toward `entered`. */

    this.containerEl.style.transform = `${
      flowToPopoverTranslations[this.zone.flow]
    }(${this.zone.order * 50}px)`
    this.containerEl.style[
      jsprefix("Transform")
    ] = this.containerEl.style.transform
    this.containerEl.style.opacity = "0"

    /* After initial layout apply transition animations. */
    /* Hack: http://stackoverflow.com/questions/3485365/how-can-i-force-webkit-to-redraw-repaint-to-propagate-style-changes */
    this.containerEl.offsetHeight

    /* If enterExitTransitionDurationMs is falsy, tip animation should be also disabled */
    if (this.props.enterExitTransitionDurationMs) {
      this.tipEl.style.transition = "transform 150ms ease-in"
      this.tipEl.style[jsprefix("Transition")] = `${cssprefix(
        "transform",
      )} 150ms ease-in`
    }
    this.containerEl.style.transitionProperty = "top, left, opacity, transform"
    this.containerEl.style.transitionDuration = `${
      this.props.enterExitTransitionDurationMs
    }ms`
    this.containerEl.style.transitionTimingFunction =
      "cubic-bezier(0.230, 1.000, 0.320, 1.000)"
    this.containerEl.style.opacity = "1"
    this.containerEl.style.transform = "translateY(0)"
    this.containerEl.style[
      jsprefix("Transform")
    ] = this.containerEl.style.transform
  }
  trackPopover() {
    const minScrollRefreshIntervalMs = 200
    const minResizeRefreshIntervalMs = 200

    /* Get references to DOM elements. */

    this.bodyEl = this.containerEl.querySelector(".Popover-body")
    this.tipEl = this.containerEl.querySelector(".Popover-tip")

    /* Note: frame is hardcoded to window now but we think it will
    be a nice feature in the future to allow other frames to be used
    such as local elements that further constrain the popover`s world. */

    this.frameEl = Platform.window
    this.hasTracked = true

    /* Set a general interval for checking if target position changed. There is no way
    to know this information without polling. */
    if (this.props.refreshIntervalMs) {
      this.checkLayoutInterval = setInterval(
        this.checkTargetReposition,
        this.props.refreshIntervalMs,
      )
    }

    /* Watch for boundary changes in all deps, and when one of them changes, recalculate layout.
    This layout monitoring must be bound immediately because a layout recalculation can recursively
    cause a change in boundaries. So if we did a one-time force-layout before watching boundaries
    our final position calculations could be wrong. See comments in resolver function for details
    about which parts can trigger recursive recalculation. */

    this.onFrameScroll = throttle(
      this.onFrameScroll,
      minScrollRefreshIntervalMs,
    )
    this.onFrameResize = throttle(
      this.onFrameResize,
      minResizeRefreshIntervalMs,
    )
    this.onPopoverResize = throttle(
      this.onPopoverResize,
      minResizeRefreshIntervalMs,
    )
    this.onTargetResize = throttle(
      this.onTargetResize,
      minResizeRefreshIntervalMs,
    )

    this.frameEl.addEventListener("scroll", this.onFrameScroll)
    resizeEvent.on(this.frameEl, this.onFrameResize)
    resizeEvent.on(this.containerEl, this.onPopoverResize)
    resizeEvent.on(this.targetEl, this.onTargetResize)

    /* Track user actions on the page. Anything that occurs _outside_ the Popover boundaries
    should close the Popover. */

    Platform.document.addEventListener("mousedown", this.checkForOuterAction)
    Platform.document.addEventListener("touchstart", this.checkForOuterAction)

    /* Kickstart layout at first boot. */

    this.measurePopoverSize()
    this.measureFrameBounds()
    this.measureTargetBounds()
    this.resolvePopoverLayout()
  }
  checkForOuterAction = event => {
    const isOuterAction =
      !this.containerEl.contains(event.target) &&
      !this.targetEl.contains(event.target)
    if (isOuterAction) this.props.onOuterAction(event)
  }
  untrackPopover() {
    clearInterval(this.checkLayoutInterval)
    this.frameEl.removeEventListener("scroll", this.onFrameScroll)
    resizeEvent.off(this.frameEl, this.onFrameResize)
    resizeEvent.off(this.containerEl, this.onPopoverResize)
    resizeEvent.off(this.targetEl, this.onTargetResize)
    Platform.document.removeEventListener("mousedown", this.checkForOuterAction)
    Platform.document.removeEventListener(
      "touchstart",
      this.checkForOuterAction,
    )
    this.hasTracked = false
  }
  onTargetResize = () => {
    log("Recalculating layout because _target_ resized!")
    this.measureTargetBounds()
    this.resolvePopoverLayout()
  }
  onPopoverResize = () => {
    log("Recalculating layout because _popover_ resized!")
    this.measurePopoverSize()
    this.resolvePopoverLayout()
  }
  onFrameScroll = () => {
    log("Recalculating layout because _frame_ scrolled!")
    this.measureTargetBounds()
    this.resolvePopoverLayout()
  }
  onFrameResize = () => {
    log("Recalculating layout because _frame_ resized!")
    this.measureFrameBounds()
    this.resolvePopoverLayout()
  }
  measureFrameBounds() {
    this.frameBounds = Layout.El.calcBounds(this.frameEl)
  }
  getContainerNodeRef = containerEl => {
    Object.assign(this, { containerEl })
  }
  render() {
    const { className = "", style = {}, tipSize } = this.props
    const { standing } = this.state

    const popoverProps = {
      className: `Popover Popover-${standing} ${className}`,
      style: { ...coreStyle, ...style },
    }

    const popover = this.state.exited ? null : (
      <div ref={this.getContainerNodeRef} {...popoverProps}>
        <div className="Popover-body" children={this.props.body} />
        <Tip direction={faces[standing]} size={tipSize} />
      </div>
    )
    return [
      this.props.children,
      Platform.isClient &&
        ReactDOM.createPortal(popover, this.props.appendTarget),
    ]
  }
}

export default Popover
