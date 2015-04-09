/* @flow */
import React, { render, unmountComponentAtNode, findDOMNode, createFactory, createClass, DOM as e, PropTypes as t } from 'react'
import { calcBounds } from './utils'
import Debug from 'debug'
import addResizeListener from 'element-resize-event'
import merge from 'object.assign'



let log = Debug('react-popover')

let coreStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  display: 'flex',
  WebkitTransitionProperty: 'top, left',
  WebkitTransitionDuration: '200ms',
  WebkitTransitionEasingFunction: 'ease-in'
}

let faces = { above: 'down', right: 'left', below: 'up', left: 'right' }

let tipTranslateFuncDict = { row: 'translateY', column: 'translateX' }

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
    tipSize: t.number.isOptional
  },
  getInitialState() {
    return {
      standing: 'above'
    }
  },
  getDefaultProps() {
    return {
      tipSize: 7,
      offset: 4,
      isOpen: false
    }
  },
  checkForLockPositionChange() {
    if (this.measureLockBounds()) this.resolvePopoverLayout()
  },
  resolvePopoverLayout() {

    let pos = { }

    /* Find the optimal zone to position self. Measure the size of each zone and use the one with
    the greatest area. */

    let zone = resolveZoneChoice(this.p2, this.frameBounds)

    this.setState({
      standing: zone.standing
    })

    let flexFlow = zone.orientation === 'landscape' ? 'row' : 'column'
    let isBefore = zone.order === 'before'
    let dir = isBefore ? -1 : 1
    let axis = axes[flexFlow]

    log('zone', zone)
    log('axes', axis)

    let mainLength = this.size[axis.main.size]
    let lockMainStart = this.p2[axis.main.start]
    let lockMainEnd = this.p2[axis.main.end]
    // 338 actual vs 345 measured... 8px diff?
    log('lockMainStart/mainLength', lockMainStart, mainLength)

    /* When positioning self on the cross-axis do not exceed frame bounds. The strategy to achieve
    this is thus: First position cross-axis self to the cross-axis-center of the the lock. Then,
    offset self by the amount that self is past the boundaries of frame. */

    pos[axis.main.start] = (

      /* Unfortunately we cannot seem to get around the base fact that layout expands in a direction
      which happens to be leftward, and thus in the before-case requires an extra step of offsetting
      all the leftware-expansion (AKA the length of the element). TODO: We could potentially have
      helper functions like positionBefore / after etc. to abstract this complexity away. */
      (isBefore ? lockMainStart - mainLength : lockMainEnd)

      // offset allows users to control the distance betweent the tip and the lock.
      + (this.props.offset * dir)
    )
    log('Applicable Offset:', this.props.offset * dir)
    pos[axis.cross.start] = center('cross', flexFlow, this.p2) - (this.size[axis.cross.size] / 2)
    pos.x2 = pos.x + this.size.w
    pos.y2 = pos.y + this.size.h

    /* Constrain containerEl Position */

    if (pos[axis.cross.start] < this.frameBounds[axis.cross.start]) {
      pos[axis.cross.start] = this.frameBounds[axis.cross.start]
    } else if (pos[axis.cross.end] > this.frameBounds[axis.cross.end]) {
      pos[axis.cross.start] = pos[axis.cross.start] - (pos[axis.cross.end] - this.frameBounds[axis.cross.end])
    }

    /* Apply Layout */

    log('pos', pos)
    this.containerEl.style.top = `${pos.y}px`
    this.containerEl.style.left = `${pos.x}px`
    this.bodyEl.style.order = isBefore ? 0 : 1
    this.containerEl.style.flexFlow = flexFlow

    /* Calculate Tip Center */

    let tipCrossPos = (
      center('cross', flexFlow, this.p2)

      /* We do not have to calcualte half-of-tip-size since tip-size specifies
      the length from base to tip which is half of total length already. */

      - this.props.tipSize

      /* Because tip is positioned by the browser relative containerEl but
      targeting absolute center of lock we need to cancel the containerEl
      positioning so as to hit our intended position. */

      - pos[axis.cross.start]
    )

    this.tipEl.style.transform = `${tipTranslateFuncDict[flexFlow]}(${tipCrossPos}px)`

    /* Record fact that repaint is synced. */

    this.p1 = this.p2
  },
  measurePopoverSize() {
    this.size = {
      w: this.containerEl.offsetWidth,
      h: this.containerEl.offsetHeight
    }
  },
  measureLockBounds() {
    let np = calcBounds(this.lockEl)
    // log('doCheck: Current position:', p, this.p1, this.p2)
    if (!this.p1) {
      this.p2 = np
    } else if (!equalCoords(np, this.p2)) {
      this.p1 = this.p2
      this.p2 = np
    }
    return this.p1 !== this.p2
  },
  componentDidMount() {
    this.lockEl = React.findDOMNode(this)
    this.trackPopover()
  },
  componentDidUpdate() {
    console.log('Component did update!')
    this.trackPopover()
  },
  trackPopover() {
    let refreshIntervalMs = 200

    if (!this.layerReactComponent) {
      if (this.tracking) this.untrackPopover()
      return
    }
    if (this.tracking) return
    this.tracking = true

    /* Get references to DOM elements. */
    this.containerEl = React.findDOMNode(this.layerReactComponent)
    this.bodyEl = this.containerEl.querySelector('.Popover-body')
    this.tipEl = this.containerEl.querySelector('.Popover-tip')
    this.frameEl = window

    /* Update layout. */
    this.measurePopoverSize()
    this.measureFrameBounds()
    this.measureLockBounds()
    this.resolvePopoverLayout()

    /* Continue to update layout if boundary deps change. */
    this.checkLayoutInterval = setInterval(this.checkForLockPositionChange, refreshIntervalMs)
    // TODO: When frame is not window use element-resize function instead.
    window.addEventListener('resize', this.onFrameBoundsChange)
    addResizeListener(this.containerEl, this.onPopoverSizeChange)
    addResizeListener(this.lockEl, this.onLockSizeChange)
  },
  untrackPopover() {
    if (!this.tracking) return
    this.tracking = false
    window.removeEventListener('resize', this.onFrameBoundsChange)
    clearInterval(this.checkLayoutInterval)
  },
  onLockSizeChange() {
    log('Recalculating layout because _lock_ size changed!')
    this.measureLockBounds()
    this.resolvePopoverLayout()
  },
  onPopoverSizeChange() {
    log('Recalculating layout because _popover_ size changed!')
    this.measurePopoverSize()
    this.resolvePopoverLayout()
  },
  onFrameBoundsChange() {
    log('Recalculating layout because _frame_ bounds changed!')
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
    if (!this.props.isOpen) return null

    let { className = '', style = {} } = this.props

    let popoverProps = {
      className: `Popover ${className}`,
      style: merge({}, coreStyle, style)
    }

    let tipProps = {
      direction: faces[this.state.standing],
      size: this.props.tipSize
    }

    return (
      e.div(
        popoverProps,
        e.div({ className: 'Popover-body' }, this.props.body),
        PopoverTip(tipProps)
      )
    )
  },
  render() {
    return this.props.children
  }
})






let PopoverTip = createFactory(createClass({
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
      height: isPortrait ? mainLength : crossLength,
      style: {
        transition: 'transform 150ms ease-in'
      }
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
}))



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



function resolveZoneChoice (lockBounds, frameBounds) {
  let l = lockBounds, f = frameBounds
  return [
    { standing: 'above', orientation: 'portrait', order: 'before', w: f.x2, h: l.y },
    { standing: 'right', orientation: 'landscape', order: 'after', w: (f.x2 - l.x2), h: f.y2 },
    { standing: 'below', orientation: 'portrait', order: 'after', w: f.x2, h: (f.y2 - l.y2) },
    { standing: 'left', orientation: 'landscape', order: 'before', w: l.x, h: f.y2 }
  ]
  .reduce((b1, b2) => area(b1) > area(b2) ? b1 : b2)
}

function area (bounds) {
  return bounds.w * bounds.h
}

function equalCoords(c1, c2) {
  for (var key in c1) if (c1[key] !== c2[key]) return false
  return true
}

function center(axis, flowDirection, bounds) {
  return bounds[axes[flowDirection][axis].start] + (bounds[axes[flowDirection][axis].size] / 2)
}

