import './main.css'
import F from 'ramda'
import React, { DOM as E } from 'react'
import ReactDOM from 'react-dom'
import PopoverClass from '../../lib'



const Popover = React.createFactory(PopoverClass)



const Main = React.createClass({
  getInitialState () {
    return {
      isOpen: false,
    }
  },
  render () {
    return (
      E.div({
        id: 'app',
        children: [
          this.renderControls(),
          this.renderPopover(),
        ]
      })
    )
  },
  toggle () {
    this.setState({ isOpen: !this.state.isOpen })
  },
  renderControls () {
    return (
      E.div({
        className: 'controls',
        children: F.map((n) => (
          E.div({
            key: n,
            className: 'control',
            onMouseOver: () => this.toggle(),
            children: this.state.isOpen ? 'Close' : 'Open',
          })
        ), F.range(1,5)),
      })
    )
  },
  renderPopover () {
    return (
      E.div({
        className: 'body',
        children: Popover({
          isOpen: this.state.isOpen,
          body: 'Body',
          children: E.span({
            children: 'Hello World',
          }),
        })
      })
    )
  }
})



window.React = React
window.ReactDOM = ReactDOM
window.Main = Main
