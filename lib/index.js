/* @flow */
import React, { createFactory, createClass, DOM as e, PropTypes as t } from 'react'
import { calcBounds } from './utils'
import Debug from 'debug'
import addResizeListener from 'element-resize-event'
import SVG from 'svg.js'



let log = Debug('react-popover')

let bodyStyle = {
  border: '2px solid red',
  display: 'inline-flex',
  flexDirection: 'column',
  padding: '4rem'
}

let containerStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  display: 'flex',
  'WebkitTransitionProperty': 'top, left',
  'WebkitTransitionDuration': '200ms',
  'WebkitTransitionEasingFunction': 'ease-in'
}

let mainAxis = { start: 'x', end: 'x2', size: 'w' }
let crossAxis = { start: 'y', end: 'y2', size: 'h' }



export default createClass({
  name: 'popover',
  propTypes: {
    lockPoint: t.string.isRequired,
    children: t.element.isRequired,
    tipSize: t.number.isOptional
  },
  getInitialState() {
    return {
      orientation: 'portrait',
      order: 'before'
    }
  },
  getDefaultProps() {
    return {
      tipSize: 10,
      offset: 4
    }
  },
  checkForLockPositionChange() {
    if (this.measureLockBounds()) this.resolvePopoverLayout()
  },
  resolvePopoverLayout() {
    // log('resolvePopoverLayout')

    let p = { }
    let tipStyle = {}//this.tipEl.style

    /* Find the optimal zone to position self. Measure the size of each zone and use the one with
    the greatest area. */

    let zone = resolveZoneChoice(this.p2, this.frameBounds)
    this.setState({
      orientation: zone.orientation,
      order: zone.order
    })
    this.zone = zone
    let axis = zone.orientation === 'landscape'
      ? { main: mainAxis, cross: crossAxis }
      : { main: crossAxis, cross: mainAxis }
    let flexFlow = zone.orientation === 'landscape' ? 'row' : 'column'
    // The body order is relative to tip and happens to mirror popover order which is relative to lock.
    let order = zone.order === 'before' ? 0 : 1

    this.bodyEl.style.order = order
    this.popoverEl.style.flexFlow = flexFlow

    // log('resolvePopoverLayout: zone:', zone, 'this.size', this.size, 'this.lockCoords', this.p2)

    /* When positioning self on the cross-axis do not exceed frame bounds. The strategy to achieve
    this is thus: First position cross-axis self to the cross-axis-center of the the lock. Then,
    offset self by the amount that self is past the boundaries of frame. */

    /* The body position should account for tip. Tip is on docking edge. The docking edge is the
    (cross-axis) edge facing lock. */


    switch (zone.name) {
    case 'above': {
      p.x = this.p2.x - (this.size.w / 2) + (this.p2.w / 2)
      p.y = (this.p2.y - this.size.h)
      //tipLayout.push('rotate(90deg)', `translateY(${this.props.tipSize}px)`)
      tipStyle.transformOrigin = '0% 100%'
      tipStyle.transform = 'rotate(90deg)'
      tipStyle.bottom = 0
      tipStyle.top = ''
      tipStyle.left = 0; tipStyle.right = ''
      tipStyle.top = ''; tipStyle.bottom = 0
      break;
    }
    case 'right': {
      p.x = this.p2.x2
      p.y = this.p2.y - (this.size.h / 2) + (this.p2.h / 2)
      tipStyle.transformOrigin = '0% 50%'
      tipStyle.transform = 'rotate(180deg)'
      tipStyle.left = 0; tipStyle.right = ''
      tipStyle.top = 0; tipStyle.bottom = ''
      break;
    }
    case 'below': {
      p.x = this.p2.x - (this.size.w / 2) + (this.p2.w / 2)
      p.y = this.p2.y2
      tipStyle.transformOrigin = '0% 0%'
      tipStyle.transform = 'rotate(-90deg)'
      tipStyle.left = 0; tipStyle.right = ''
      tipStyle.top = 0; tipStyle.bottom = ''
      break;
    }
    case 'left': {
      p.x = this.p2.x - this.size.w
      p.y = this.p2.y - (this.size.h / 2) + (this.p2.h / 2)
      tipStyle.transformOrigin = '0% 50%'
      tipStyle.transform = 'rotate(0deg)'
      tipStyle.left = ''; tipStyle.right = 0
      tipStyle.top = 0; tipStyle.bottom = ''
      break;
    }
    }

    p[axis.main.start] += this.props.offset * zone.dir
    p.x2 = p.x + this.size.w
    p.y2 = p.y + this.size.h

    if (p[axis.cross.start] < this.frameBounds[axis.cross.start]) {
      p[axis.cross.start] = this.frameBounds[axis.cross.start]
    } else if (p[axis.cross.end] > this.frameBounds[axis.cross.end]) {
      p[axis.cross.start] = p[axis.cross.start] - (p[axis.cross.end] - this.frameBounds[axis.cross.end])
    }

    log('zone', zone)
    log('axes', axis)
    log('popover cross-start/end is %d-%d', p[axis.cross.start], p[axis.cross.end])
    log('frame cross-start/end is %d-%d', this.frameBounds[axis.cross.start], this.frameBounds[axis.cross.end])
    //log('resolvePopoverLayout: layout position:', p)

    //log('tipLayout', tipLayout, tipLayout.join(' '))
    this.popoverEl.style.top = p.y
    this.popoverEl.style.left = p.x

    // Center the tip with lock along cross-axis
    let s = this.p2[axis.cross.end] - (this.p2[axis.cross.size] / 2)
    s -= this.props.tipSize
    s -= p[axis.cross.start]
    let translateAxis = zone.orientation === 'landscape' ? 'Y' : 'X'
    this.tipEl.style.transform = `translate${translateAxis}(${s}px)`

    //this.tipEl.style.transformOrigin = '0% 0%'
    //this.tipEl.style.transform = tipLayout.join(' ')
    this.p1 = this.p2
  },
  measurePopoverSize() {
    this.size = {
      w: this.popoverEl.offsetWidth,
      h: this.popoverEl.offsetHeight
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
    this.popoverEl = React.findDOMNode(this)
    this.bodyEl = this.popoverEl.querySelector('.Popover-body')
    this.tipEl = this.popoverEl.querySelector('.Popover-tip')
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
    log('React render.')
    let { orientation, order } = this.state
    let tipDirection = orientation === 'landscape' && order === 'before' ? 'right'
          : orientation === 'landscape' && order === 'after' ? 'left'
          : orientation === 'portrait' && order === 'before' ? 'down'
          : 'up'

    return (
      e.div({
        className: 'Popover',
        style: containerStyle
        },
          e.div({
            className: 'Popover-body',
            style: bodyStyle
            },
            e.h1({}, 'Popover Title'),
            e.div({}, 'Popover contents.')
          ),
          PopoverTip({
            size: this.props.tipSize,
            direction: tipDirection
          })
      )
    )
  }
})



let PopoverTip = createFactory(createClass({
  name: 'tip',
  render() {

    let { direction } = this.props
    let size = this.props.size || 24
    let style = this.props.style || {}
    let fill = style.fill || 'red'
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
      xmlns: 'http://www.w3.org/2000/svg',
      className: 'Popover-tip',
      width: isPortrait ? crossLength : mainLength,
      height: isPortrait ? mainLength : crossLength,
      style: {
        transition: 'transform 150ms ease-in'
      }
    },
      e.polygon({
        points,
        style: {
          fill
        }
      })
    )

    return (
      triangle
    )
  }
}))





function resolveZoneChoice (lockBounds, frameBounds) {
  let l = lockBounds, f = frameBounds
  return [
    { name: 'above', orientation: 'portrait', order: 'before', dir: -1, w: f.x2, h: l.y },
    { name: 'right', orientation: 'landscape', order: 'after', dir: 1, w: (f.x2 - l.x2), h: f.y2 },
    { name: 'below', orientation: 'portrait', order: 'after', dir: 1, w: f.x2, h: (f.y2 - l.y2) },
    { name: 'left', orientation: 'landscape', order: 'before', dir: -1, w: l.x, h: f.y2 }
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
