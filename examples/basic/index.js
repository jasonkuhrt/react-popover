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



window.React = React
window.Main = tracer
