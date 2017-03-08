import "./main.css"
import F from "ramda"
import React, { DOM as E, PropTypes as T } from "react"
import ReactDOM from "react-dom"
import PopoverClass from "../../lib"



const Popover = React.createFactory(PopoverClass)



const Row = React.createFactory(React.createClass({
  displayName: "row",
  propTypes: {
    children: T.number,
  },
  getInitialState () {
    return {
      isOpen: false,
    }
  },
  toggle (toState = null) {
    this.setState({ isOpen: toState === null ? !this.state.isOpen : toState })
  },
  render () {
    const { isOpen } = this.state
    return (
      Popover({
        isOpen,
        body: "!",
        children: (
          E.div({
            className: "Row",
            onMouseOver: () => this.toggle(true),
            onMouseOut: () => this.toggle(false),
            children: this.props.children,
          })
        )
      })
    )
  }
}))



const Main = React.createClass({
  render () {
    return (
      E.div({
        id: "app",
        children: (
          F.range(0,51).map((i) => Row({}, i))
        )
      })
    )
  },
})




window.React = React
window.ReactDOM = ReactDOM
window.Main = Main
