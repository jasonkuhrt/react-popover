import styles from './index.css'
import React, { DOM as e } from 'react'
import Popover from '../../lib'
import Draggable from 'react-draggable'



Draggable = React.createFactory(Draggable)



let tracer = React.createClass({
  name: 'tracer',
  getInitialState: function() {
    return {
      popove: null
    }
  },
  togglePopover() {
    this.setState({
      popover: React.createElement(Popover, {
        lockPoint: '.lockpoint'
      }, this)
    })
  },
  render() {
    let popover = this.state.popover

    let lockPoint = (
      Draggable({
        handle: '.handle',
        onstart: console.log.bind(console)
      },
        e.div({
          className: 'handle lockpoint',
          onClick: this.togglePopover
        },
        'Drag Me'
        )
      )
    )

    return e.div({}, lockPoint, popover)
  }
})



let app = React.createClass({
  name: 'basic-demo',
  render() {
    return React.createElement(tracer)
  }
})



document.onreadystatechange = function () {
  if (document.readyState === 'complete') {
    React.render(React.createElement(app), window.document.body)
  }
}
