/* @flow */
import React, { createClass, DOM as e, PropTypes as t } from 'react'
import { calcBounds } from './utils'
import Debug from 'debug'



let log = Debug('react-popover')

let style = {
  border: '1px solid black',
  position: 'absolute',
  display: 'inline-flex',
  flexDirection: 'column',
  top: 0,
  left: 0
}

let mainAxis = { start: 'x', end: 'x2', size: 'w' }
let crossAxis = { start: 'y', end: 'y2', size: 'h' }



export default createClass({
  name: 'popover',
  propTypes: {
    lockPoint: t.string.isRequired,
    children: t.element.isRequired
  },
  checkLayout() {
    this.doSelfMeasure()
    if (this.doCheckLockCoords()) {
      this.doResolve()
    }
  },
  doResolve() {
    // log('doResolve')

    let p = { }

    /* Find the optimal zone to position self. Measure the size of each zone and use the one with
    the greatest area. */

    let zone = resolveZoneChoice(this.p2, this.frameBounds)
    let orientation = (zone.name === 'left' || zone.name === 'right') ? 'horizontal' : 'vertical'
    let axis = orientation === 'horizontal'
      ? { main: mainAxis, cross: crossAxis }
      : { main: crossAxis, cross: mainAxis }

    // log('doResolve: zone:', zone, 'this.size', this.size, 'this.lockCoords', this.p2)

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
    //log('doResolve: layout position:', p)

    this.el.style.transform = `translate(${p.x}px, ${p.y}px)`
    this.p1 = this.p2
  },
  doSelfMeasure() {
    this.size = {
      w: this.el.offsetWidth,
      h: this.el.offsetHeight
    }
  },
  doCheckLockCoords() {
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
    this.el = React.findDOMNode(this)
    this.lockEl = React.findDOMNode(this.props.children).querySelector(this.props.lockPoint)
    this.frameEl = window
    this.lpPosition1 = { x: this.lockEl.offsetLeft, y: this.lockEl.offsetTop }

    this.updateFrameBounds()

    this.checkLayoutInterval = setInterval(this.checkLayout, 50)
    window.addEventListener('resize', this.onFrameBoundsChange)
  },
  onFrameBoundsChange() {
    this.updateFrameBounds()
    this.doResolve()
  },
  updateFrameBounds() {
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
