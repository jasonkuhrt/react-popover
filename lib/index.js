/* @flow */
import React, { createClass, DOM as e, PropTypes as t } from 'react'
import { calcBounds } from './utils'
import Debug from 'debug'
import addResizeListener from 'element-resize-event'



let log = Debug('react-popover')

let style = {
  border: '3px solid cyan',
  position: 'absolute',
  display: 'inline-flex',
  flexDirection: 'column',
  top: 0,
  left: 0,
  '-webkit-transition-property': 'top, left',
  '-webkit-transition-duration': '200ms',
  '-webkit-transition-easing-function': 'ease-in'
}

let mainAxis = { start: 'x', end: 'x2', size: 'w' }
let crossAxis = { start: 'y', end: 'y2', size: 'h' }



export default createClass({
  name: 'popover',
  propTypes: {
    lockPoint: t.string.isRequired,
    children: t.element.isRequired
  },
  checkForLockPositionChange() {
    if (this.measureLockBounds()) this.resolvePopoverLayout()
  },
  resolvePopoverLayout() {
    // log('resolvePopoverLayout')

    let p = { }

    /* Find the optimal zone to position self. Measure the size of each zone and use the one with
    the greatest area. */

    let zone = resolveZoneChoice(this.p2, this.frameBounds)
    let orientation = (zone.name === 'left' || zone.name === 'right') ? 'horizontal' : 'vertical'
    let axis = orientation === 'horizontal'
      ? { main: mainAxis, cross: crossAxis }
      : { main: crossAxis, cross: mainAxis }

    // log('resolvePopoverLayout: zone:', zone, 'this.size', this.size, 'this.lockCoords', this.p2)

    /* When positioning self on the cross-axis do not exceed frame bounds. The strategy to achieve
    this is thus: First position cross-axis self to the cross-axis-center of the the lock. Then,
    offset self by the amount that self is past the boundaries of frame. */

    switch (zone.name) {
    case 'above': {
      p.x = this.p2.x - (this.size.w / 2) + (this.p2.w / 2)
      p.y = (this.p2.y) - this.size.h
      break;
    }
    case 'right': {
      p.x = this.p2.x2
      p.y = this.p2.y - (this.size.h / 2) + (this.p2.h / 2)
      break;
    }
    case 'below': {
      p.x = this.p2.x - (this.size.w / 2) + (this.p2.w / 2)
      p.y = this.p2.y2
      break;
    }
    case 'left': {
      p.x = this.p2.x - this.size.w
      p.y = this.p2.y - (this.size.h / 2) + (this.p2.h / 2)
      break;
    }
    }

    p.x2 = p.x + this.size.w
    p.y2 = p.y + this.size.h

    if (p[axis.cross.start] < this.frameBounds[axis.cross.start]) {
      p[axis.cross.start] = this.frameBounds[axis.cross.start]
    } else if (p[axis.cross.end] > this.frameBounds[axis.cross.end]) {
      p[axis.cross.start] = p[axis.cross.start] - (p[axis.cross.end] - this.frameBounds[axis.cross.end])
    }

    log('layoutOrientation is %s', orientation)
    log('popover cross-start/end is %d-%d', p[axis.cross.start], p[axis.cross.end])
    log('frame cross-start/end is %d-%d', this.frameBounds[axis.cross.start], this.frameBounds[axis.cross.end])
    //log('resolvePopoverLayout: layout position:', p)

    this.popoverEl.style.top = p.y
    this.popoverEl.style.left = p.x
    this.p1 = this.p2
  },
  measurePopoverSize() {
    this.size = {
      w: this.popoverEl.offsetWidth,
      h: this.popoverEl.offsetHeight
    }
    console.log(this.size)
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
    this.popoverEl = React.findDOMNode(this)
    this.lockEl = React.findDOMNode(this.props.children).querySelector(this.props.lockPoint)
    this.frameEl = window

    this.measurePopoverSize()
    this.measureFrameBounds()
    this.measureLockBounds()
    this.resolvePopoverLayout()

    this.checkLayoutInterval = setInterval(this.checkForLockPositionChange, 200)
    addResizeListener(this.popoverEl, this.onPopoverSizeChange)
    addResizeListener(this.lockEl, this.onLockSizeChange)
    // TODO: When frame is not window use element-resize function instead.
    window.addEventListener('resize', this.onFrameBoundsChange)
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
  render() {
    let className = 'Popover'
    return (
      e.div({ className, style },
            e.h1({}, 'Title'),
            e.div({}, 'Popover contents.')
      )
    )
  }
  })






function resolveZoneChoice (lockBounds, frameBounds) {
  let l = lockBounds, f = frameBounds
  return [
    { name: 'above', dir: -1, w: f.x2, h: l.y },
    { name: 'right', dir: 1, w: (f.x2 - l.x2), h: f.y2 },
    { name: 'below', dir: 1, w: f.x2, h: (f.y2 - l.y2) },
    { name: 'left', dir: -1, w: l.x, h: f.y2 }
  ]
  .reduce((b1, b2) => area(b1) > area(b2) ? b1 : b2)
}

function area (bounds) {
  return bounds.w * bounds.h
}

function equalCoords(c1, c2) {
  for (var key in c1) {
    if (c1[key] !== c2[key]) return false
  }
  return true
}
