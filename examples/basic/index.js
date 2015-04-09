import styles from './index.css'
import React, { DOM as e } from 'react'
import Popover from '../../lib'
import Draggable from 'react-draggable'



Popover = React.createFactory(Popover)
Draggable = React.createFactory(Draggable)



let tracer = React.createClass({
  name: 'tracer',
  getInitialState: function() {
    return {
      popoverIsOpen: false
    }
  },
  togglePopover() {
    this.setState({
      popoverIsOpen: !this.state.popoverIsOpen
    })
  },
  render() {
    let lockPoint = (
      Draggable({
        handle: '.lockpoint'
      },
        e.div({
          className: 'lockpoint',
          onDoubleClick: this.togglePopover
        },
        'Drag Me'
        )
      )
    )

    return (
      Popover({
          isOpen: this.state.popoverIsOpen,
          body: [
            e.h1({}, 'Popover Title'),
            e.div({}, 'Popover contents.')
          ]
        },
        lockPoint
      )
    )
  }
})



window.React = React
window.Main = tracer
