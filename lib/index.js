/* @flow */
import React, { render, unmountComponentAtNode, createElement, createClass, DOM as e, PropTypes as t } from 'react'
import { calcBounds, calcScrollSize } from './utils'
import Debug from 'debug'
import merge from 'object.assign'
import * as resizeEvent from './on-resize'



let log = Debug('react-popover')

let coreStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  display: 'flex'
}

let faces = { above: 'down', right: 'left', below: 'up', left: 'right' }

let tipTranslateFuncDict = { row: 'translateY', column: 'translateX' }
let popoverTranslateFuncDict = { row: 'translateX', column: 'translateY' }

/* Axes system. This allows us to at-will work in a different orientation
without having to manually keep track of knowing if we should be using
x or y positions. */

let axes = {}

axes.row = {
  main: { start: 'x', end: 'x2', size: 'w' },
  cross: { start: 'y', end: 'y2', size: 'h' }
}

axes.column = {
  main: axes.row.cross,
  cross: axes.row.main
}




export default createClass({
  name: 'popover',
  mixins: [ReactLayerMixin()],
  propTypes: {
    body: t.node.isRequired,
    children: t.element.isRequired,
    tipSize: t.number,
    isOpen: t.bool,
    enterExitTransitionDurationMs: t.number
  },
  getInitialState() {
    return {
      standing: 'above',
      exited: true,
      exiting: false
    }
  },
  getDefaultProps() {
    return {
      tipSize: 7,
      offset: 4,
      isOpen: false,
      enterExitTransitionDurationMs: 500
    }
  },
  checkTargetReposition() {
    if (this.measureTargetBounds()) this.resolvePopoverLayout()
  },
  resolvePopoverLayout() {

    let pos = { }

    /* Find the optimal zone to position self. Measure the size of each zone and use the one with
    the greatest area. */

    let zone = pickZone(this.p2, this.size, this.frameBounds)
    this.zone = zone
    log('zone', zone)

    this.setState({
      standing: zone.standing
    })

    let axis = axes[zone.flow]
    log('axes', axis)

    let mainLength = this.size[axis.main.size]
    let targetMainStart = this.p2[axis.main.start]
    let targetMainEnd = this.p2[axis.main.end]
    let scrollSize = calcScrollSize(this.frameEl)

    /* When positioning self on the cross-axis do not exceed frame bounds. The strategy to achieve
    this is thus: First position cross-axis self to the cross-axis-center of the the target. Then,
    offset self by the amount that self is past the boundaries of frame. */

    pos[axis.main.start] = (

      scrollSize[axis.main.size]

      /* Unfortunately we cannot seem to get around the base fact that layout expands in a direction
      which happens to be leftward, and thus in the before-case requires an extra step of offsetting
      all the leftware-expansion (AKA the length of the element). TODO: We could potentially have
      helper functions like positionBefore / after etc. to abstract this complexity away. */
      + (zone.order === -1 ? targetMainStart - mainLength : targetMainEnd)

      // offset allows users to control the distance betweent the tip and the target.
      + (this.props.offset * zone.order)
    )
    pos[axis.cross.start] = (
      center('cross', zone.flow, this.p2)
      + scrollSize[axis.cross.size]
      - (this.size[axis.cross.size] / 2)
    )
    pos.x2 = pos.x + this.size.w
    pos.y2 = pos.y + this.size.h
    pos.mainLength = this.size[axis.main.size]
    pos.crossLength = this.size[axis.cross.size]

    /* Constrain containerEl Position within frameEl. Try not to penetrate a visually-pleasing buffer from
    frameEl. `buffer` length is based on tipSize and its offset. */

    let buffer = this.props.tipSize + this.props.offset
    let frameCrossStart = this.frameBounds[axis.cross.start] + scrollSize[axis.cross.size]
    let frameCrossEnd = this.frameBounds[axis.cross.end] + scrollSize[axis.cross.size]
    let frameCrossLength = this.frameBounds[axis.cross.size] + scrollSize[axis.cross.size]
    let containerCrossStart = pos[axis.cross.start]
    let containerCrossEnd = pos[axis.cross.end]

    if (pos.crossLength > frameCrossLength) {
      pos[axis.cross.start] = frameCrossStart
    } else if (pos.crossLength > frameCrossLength - buffer * 2) {
      let overflowLength = pos.crossLength - frameCrossLength
      pos[axis.cross.start] = frameCrossStart - overflowLength / 2
    } else if (containerCrossStart < frameCrossStart + buffer) {
      pos[axis.cross.start] = frameCrossStart + buffer
    } else if (containerCrossEnd > frameCrossEnd - buffer) {
      pos[axis.cross.start] = pos[axis.cross.start] - (pos[axis.cross.end] - (frameCrossEnd - buffer))
    }

    /* Apply `flow` and `order` styles. This can impact subsequent measurements of height and width
    of the container. When tip changes orientation position due to changes from/to `row`/`column`
    width`/`height` will be impacted. Our layout monitoring will catch these cases and automatically
    recalculate layout. */

    this.containerEl.style.flexFlow = zone.flow
    this.bodyEl.style.order = zone.order

    /* Apply Absolute Positioning. */

    log('pos', pos)
    this.containerEl.style.top = `${pos.y}px`
    this.containerEl.style.left = `${pos.x}px`

    /* Calculate Tip Center */

    let tipCrossPos = (
      center('cross', zone.flow, this.p2)

      /* We do not have to calcualte half-of-tip-size since tip-size specifies
      the length from base to tip which is half of total length already. */

      - this.props.tipSize

      /* Because tip is positioned by the browser relative containerEl but
      targeting absolute center of target we need to cancel the containerEl
      positioning so as to hit our intended position. */

      - pos[axis.cross.start]
    )

    let cornerRadiusSize = Math.round(getComputedStyle(this.bodyEl).borderRadius.slice(0, -2)) || 0
    if (tipCrossPos < cornerRadiusSize) tipCrossPos = cornerRadiusSize
    else if (tipCrossPos > (pos.crossLength - cornerRadiusSize) - this.props.tipSize * 2) tipCrossPos = (pos.crossLength - cornerRadiusSize) - this.props.tipSize * 2

    this.tipEl.style.transform = `${tipTranslateFuncDict[zone.flow]}(${tipCrossPos}px)`

    /* Record fact that repaint is synced. */

    this.p1 = this.p2
  },
  measurePopoverSize() {
    this.size = {
      w: this.containerEl.offsetWidth,
      h: this.containerEl.offsetHeight
    }
  },
  measureTargetBounds() {
    let targetBounds = calcBounds(this.targetEl)
    //log('measured target:', targetBounds)
    if (!this.p1) {
      this.p2 = targetBounds
    } else if (!equalCoords(targetBounds, this.p2)) {
      this.p1 = this.p2
      this.p2 = targetBounds
    }
    return this.p1 !== this.p2
  },
  componentDidMount() {
    this.targetEl = findDOMNode(this)
    this.trackPopover()
  },
  componentDidUpdate() {
    log('Component did update!')
    this.trackPopover()

    if (this.props.isOpen && this.state.exiting) {
      clearTimeout(this.exitingAnimationTimer1)
      clearTimeout(this.exitingAnimationTimer2)
      return
    } else if (this.props.isOpen || this.state.exiting || this.state.exited) return

    this.setState({ exiting: true })

    this.exitingAnimationTimer2 = setTimeout(() => {
      setTimeout(() => {
        this.containerEl.style.transform = `${popoverTranslateFuncDict[this.zone.flow]}(${this.zone.order * 50}px)`
        this.containerEl.style.opacity = '0'
      }, 0)
    }, 0)

    this.exitingAnimationTimer1 = setTimeout(() => {
      this.setState({ exited: true, exiting: false })
    }, this.props.enterExitTransitionDurationMs)
  },
  trackPopover() {
    let refreshIntervalMs = 200

    if (!this.layerReactComponent) {
      if (this.tracking) this.untrackPopover()
      return
    }
    if (this.tracking) return
    this.tracking = true
    this.setState({ exited: false })

    /* Get references to DOM elements. */

    this.containerEl = findDOMNode(this.layerReactComponent)
    this.bodyEl = this.containerEl.querySelector('.Popover-body')
    this.tipEl = this.containerEl.querySelector('.Popover-tip')

    /* Note: frame is hardcoded to window now but we think it will
    be a nice feature in the future to allow other frames to be used
    such as local elements that further constrain the popover's world. */

    this.frameEl = window

    /* Watch for boundary changes in all deps, and when one of them changes, recalculate layout.
    This layout monitoring must be bound immediately because a layout recalculation can recusively
    cause a change in boundaries. So if we did a one-time force-layout before watching boundaries
    our final position calculations could be wrong. See comments in resolver function for details
    about which parts can trigger recursive recalculation. */

    this.checkLayoutInterval = setInterval(this.checkTargetReposition, refreshIntervalMs)
    this.frameEl.addEventListener('scroll', this.onFrameScroll)
    resizeEvent.on(this.frameEl, this.onFrameBoundsChange)
    resizeEvent.on(this.containerEl, this.onPopoverSizeChange)
    resizeEvent.on(this.targetEl, this.onTargetResize)

    /* Force Update layout initially. */

    this.measurePopoverSize()
    this.measureFrameBounds()
    this.measureTargetBounds()
    this.resolvePopoverLayout()

    /* Prepare `entering` style so that we can then animate it toward `entered`. */

    this.containerEl.style.transform = `${popoverTranslateFuncDict[this.zone.flow]}(${this.zone.order * 50}px)`
    this.containerEl.style.opacity = '0'

    /* After initial layout apply transition animations. */

    setTimeout(() => {
      this.tipEl.style.transition = 'transform 150ms ease-in'
      this.containerEl.style.transitionProperty = 'top, left, opacity, transform'
      this.containerEl.style.transitionDuration = '500ms'
      this.containerEl.style.transitionTimingFunction = 'cubic-bezier(0.230, 1.000, 0.320, 1.000)'
      setTimeout(() => {
        this.containerEl.style.opacity = '1'
        this.containerEl.style.transform = 'translateY(0)'
      }, 0)
    }, 0)
 },
  untrackPopover() {
    if (!this.tracking) return
    this.tracking = false
    clearInterval(this.checkLayoutInterval)
    this.frameEl.removeEventListener('scroll', this.onFrameScroll)
    resizeEvent.off(this.frameEl, this.onFrameBoundsChange)
    resizeEvent.off(this.containerEl, this.onPopoverSizeChange)
    resizeEvent.off(this.targetEl, this.onTargetResize)
  },
  onTargetResize() {
    log('Recalculating layout because _target_ resized!')
    this.measureTargetBounds()
    this.resolvePopoverLayout()
  },
  onPopoverSizeChange() {
    log('Recalculating layout because _popover_ resized!')
    this.measurePopoverSize()
    this.resolvePopoverLayout()
  },
  onFrameScroll () {
    log('Recalculating layout because _frame_ scrolled!')
    this.measureTargetBounds()
    this.resolvePopoverLayout()
  },
  onFrameBoundsChange() {
    log('Recalculating layout because _frame_ resized!')
    this.measureFrameBounds()
    this.resolvePopoverLayout()
  },
  measureFrameBounds() {
    this.frameBounds = calcBounds(this.frameEl)
  },
  componentWillUnmount() {
    clearInterval(this.checkLayoutInterval)
  },
  renderLayer() {
    if (!this.props.isOpen && this.state.exited) return null

    let { className = '', style = {} } = this.props

    let popoverProps = {
      className: `Popover ${className}`,
      style: merge({}, coreStyle, style)
    }

    let tipProps = {
      direction: faces[this.state.standing],
      size: this.props.tipSize
    }

    /* If we pass array of nodes to component children React will complain that each
    item should have a key prop. This is not a valid requirement in our case. Users
    should be able to give an array of elements applied as if they were just normal
    children of the body component. */

    let popoverBody = Array.isArray(this.props.body) ? this.props.body : [this.props.body]

    return (
      e.div(popoverProps,
        e.div({ className: 'Popover-body' }, ...popoverBody),
        createElement(PopoverTip, tipProps)
      )
    )
  },
  render() {
    return this.props.children
  }
})






let PopoverTip = createClass({
  name: 'tip',
  render() {
    let { direction } = this.props
    let size = this.props.size || 24
    let isPortrait = direction === 'up' || direction === 'down'
    let mainLength = size
    let crossLength = size * 2
    let points = (
      direction === 'up' ? `0,${mainLength} ${mainLength},0, ${crossLength},${mainLength}`
      : direction === 'down' ? `0,0 ${mainLength},${mainLength}, ${crossLength},0`
      : direction === 'left' ? `${mainLength},0 0,${mainLength}, ${mainLength},${crossLength}`
      : `0,0 ${mainLength},${mainLength}, 0,${crossLength}`
     )

    let triangle = e.svg({
      className: 'Popover-tip',
      width: isPortrait ? crossLength : mainLength,
      height: isPortrait ? mainLength : crossLength
    },
      e.polygon({
        className: 'Popover-tipShape',
        points
      })
    )

    return (
      triangle
    )
  }
})






function ReactLayerMixin() {
  return {
    componentWillMount() {
      /* Create a DOM node for mounting the React Layer. */
      this.layerContainerNode = document.createElement('div')
    },
    componentDidMount() {
      /* Mount the mount. */
      document.body.appendChild(this.layerContainerNode)
      this._layerRender()
    },
    componentDidUpdate() {
      this._layerRender()
    },
    componentWillUnmount() {
      this._layerUnrender()
      /* Unmount the mount. */
      document.body.removeChild(this.layerContainerNode)
    },
    _layerRender() {
      let layerReactEl = this.renderLayer()
      if (!layerReactEl) {
        this.layerReactComponent = null
        render(e.noscript(), this.layerContainerNode)
      } else {
        this.layerReactComponent = render(layerReactEl, this.layerContainerNode)
      }
    },
    _layerUnrender() {
      if (this.layerWillUnmount) this.layerWillUnmount(this.layerContainerNode)
      unmountComponentAtNode(this.layerContainerNode)
    }
    // Must be implemented by consuming component:
    // renderLayer() {}
  }
}






/* Algorithm for picking the best fitting zone for popover. The current technique will
loop through all zones picking the last one that fits. If none fit the last one is selected.
TODO: In the case that none fit we should pick the least-not-fitting zone. */

function pickZone (targetBounds, popoverBounds, frameBounds) {
  let l = targetBounds, f = frameBounds, p = popoverBounds
  return [
    { standing: 'above', flow: 'column', order: -1, w: f.x2, h: l.y },
    { standing: 'right', flow: 'row', order: 1, w: (f.x2 - l.x2), h: f.y2 },
    { standing: 'below', flow: 'column', order: 1, w: f.x2, h: (f.y2 - l.y2) },
    { standing: 'left', flow: 'row', order: -1, w: l.x, h: f.y2 }
  ]
  .reduce((z1, z2) => canFit(z1, p) ? z1 : z2 )
}

/* Utilities for working with bounds. */

function canFit(b1, b2) {
  return b1.w > b2.w && b1.h > b2.h
}

function equalCoords(c1, c2) {
  for (var key in c1) if (c1[key] !== c2[key]) return false
  return true
}

function center(axis, flowDirection, bounds) {
  return bounds[axes[flowDirection][axis].start] + (bounds[axes[flowDirection][axis].size] / 2)
}



/* React 12<= / >=13 compatible findDOMNode function. */

let supportsFindDOMNode = Number(React.version.split('.')[1]) >= 13 ? true : false

function findDOMNode(component) {
  return supportsFindDOMNode ? React.findDOMNode(component) : component.getDOMNode()
}

