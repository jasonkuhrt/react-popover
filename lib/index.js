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
    if (this.doCheckLockCoords()) {
      this.doResolve()
      log('doResolve')
    }
  },
  doResolve() {
    this.el.style.transform = `translate(${this.p2.x}px, ${this.p2.y2}px)`
    this.p1 = this.p2
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



function getCoords(el) {
  let c = { x: el.offsetLeft, y: el.offsetTop }
  c.x2 = c.x + el.offsetWidth
  c.y2 = c.y + el.offsetHeight
  return c
}



function equalCoords(c1, c2) {
  for (var key in c1) {
    if (c1[key] !== c2[key]) return false
  }
  return true
}
