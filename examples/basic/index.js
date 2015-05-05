import styles from './index.css'
import React, { DOM as e } from 'react'
import Popover from '../../lib'
import Draggable from 'react-draggable'



Popover = React.createFactory(Popover)
Draggable = React.createFactory(Draggable)



let Demo = React.createClass({
  name: 'demo',
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
    let targetProps = {
      className: ['Target', `is-${['open', 'closed'][Number(this.state.popoverIsOpen)]}`].join(' '),
      onDoubleClick: this.togglePopover
    }

    let draggableProps = {
      handle: '.Target'
    }

    let target = (
      Draggable(draggableProps,
        e.div(targetProps,
          'Drag \nOR\nDouble\nClick'
        )
      )
    )

    let popoverProps = {
      isOpen: this.state.popoverIsOpen,
      body: [
        e.h1({}, 'Popover Title'),
        e.div({}, 'Popover contents.')
      ]
    }

    let popover = Popover(popoverProps, target)

    return popover
  }
})



window.React = React
window.Main = Demo
