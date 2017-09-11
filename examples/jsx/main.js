import "./main.css"
import F from "ramda"
import React from "react"
import ReactDOM from "react-dom"
import createReactClass from "create-react-class"
import Popover from "../../lib"
import classNames from "classnames"



const randomIntegerBetween = (from, to) => (
  Math.round((Math.random() * (to - from)) + from)
)



const Main = createReactClass({
  getInitialState () {
    return {
      isOpen: false,
    }
  },
  toggle () {
    this.setState({ isOpen: !this.state.isOpen })
  },
  renderPopover () {
    const {
      isOpen,
    } = this.state
    return (
      <Popover appendTarget="#app" isOpen={isOpen} body="Boo!">
        <div
          className={ classNames("target", { isOpen }) }
          onClick={this.toggle}>
          { this.renderPerson(isOpen) }
        </div>
      </Popover>
    )
  },
  renderPerson (isScared) {
    return (
      isScared
        ? ";o"
        : [ <span key="taps" className="Taps">{ this.renderTaps() }</span>,
          <span key="person">{ "Who's there?" }</span> ]
    )
  },
  renderTaps () {
    return (
      F.range(0, randomIntegerBetween(1, 6)).map((i) => {
        const style = {
          transform: `rotate(${randomIntegerBetween(-90, 90)}deg)`
        }
        return <em key={i} className="Tap" style={style}>Tap</em>
      })
    )
  },
  render () {
    return (
      <div id="app">{ this.renderPopover() }</div>
    )
  },
})





window.React = React
window.ReactDOM = ReactDOM
window.Main = Main
