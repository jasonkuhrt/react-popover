import React, { DOM as e } from 'react'
import Popover from '../../lib'




let tracer = React.createClass({
  name: 'tracer',
  getInitialState: function() {
    return { popove: null }
  },
  openPopover() {
    this.setState({
      popover: Popover({
        lockPoint: React.findDOMNode(this).firstElementChild
      })
    })
  },
  render() {
    let popover = this.state.popover

    let lockPoint = e.div({
      style: lockPointStyle,
      onClick: this.openPopover
    }, '!')

    return e.div({}, lockPoint, popover)
  }
})



let app = React.createClass({
  name: 'basic-demo',
  render() {
    return React.createElement(tracer)
  }
})



let lockPointStyle = {
  width: 50,
  height: 50,
  background: 'red'
}



document.onreadystatechange = function () {
  if (document.readyState === 'complete') {
    React.render(React.createElement(app), window.document.body)
  }
}
