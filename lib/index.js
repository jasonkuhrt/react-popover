/* @flow */
import React, { createClass, DOM as e, PropTypes as t } from 'react'



let log = console.log.bind(console)

let style = {
  border: '1px solid black',
  position: 'absolute',
  display: 'inline-flex',
  flexDirection: 'column',
  top: 0,
  left: 0
}

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
    log('doResolve')

    /* Find the optimal zone to position self. Measure the size of each zone and use the one with
    the greatest area. */

    let p = {}
    let frameCoords = getFrameCoords(this.frameEl)
    let zone = resolveZoneChoice(this.p2, frameCoords)
    log('doResolve: zone:', zone, 'this.size', this.size, 'this.lockCoords', this.p2)

    switch (zone) {
    case 'above': {
      p.x = this.p2.x - (this.size.w / 2) + (this.p2.w / 2)
      p.y = this.p2.y - this.size.h
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
    log('doResolve: layout position:', p)

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
    let np = getCoords(this.lpEl)
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
    this.lpEl = React.findDOMNode(this.props.children).querySelector(this.props.lockPoint)
    this.frameEl = window
    this.lpPosition1 = { x: this.lpEl.offsetLeft, y: this.lpEl.offsetTop }
    this.checkLayoutInterval = setInterval(this.checkLayout, 50)
  },
  componentWillUnmount() {
    clearInterval(this.checkLayoutInterval)
  },
  render() {
    return (
      e.div({ style },
            e.h1({}, 'Title'),
            e.div({}, 'Popover contents.')
      )
    )
  }
})

function resolveZoneChoice (lock, frame) {
  return [
    { zone: 'above', w: frame.x2, h: lock.y },
    { zone: 'right', w: (frame.x2 - lock.x2), h: frame.y2 },
    { zone: 'below', w: frame.x2, h: (frame.y2 - lock.y2) },
    { zone: 'left', w: lock.x, h: frame.y2 }
  ]
  .reduce((a, b) => area(a) > area(b) ? a : b)
  .zone
}

function area (size) {
  return size.w * size.h
}

function getFrameCoords (el) {
  return { x: 0, y: 0, x2: el.innerWidth, y2: el.innerHeight }
}

function getCoords (el) {
  let c = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }
  c.x2 = c.x + c.w
  c.y2 = c.y + c.h
  return c
}



function equalCoords(c1, c2) {
  for (var key in c1) {
    if (c1[key] !== c2[key]) return false
  }
  return true
}
