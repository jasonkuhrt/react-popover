import "./main.css"
import F from "ramda"
import React, { DOM as E } from "react"
import { PropTypes as T } from "prop-types"
import ReactDOM from "react-dom"
import Popover from "../../lib"



class Row {
  static propTypes = {
    children: T.number,
  }
  constructor (props) {
    super(props)
    this.state = {
      isOpen: false,
    }
  }
  toggle (toState = null) {
    this.setState({ isOpen: toState === null ? !this.state.isOpen : toState })
  }
  render () {
    const { isOpen } = this.state
    return (
      <Popover {...{isOpen}} body="!">
          <div className="Row"
            onMouseOver={() => this.toggle(true)}
            onMouseOut={() => this.toggle(false)}
          >{this.props.children}</div>
      </Popover>
    )
  }
}




const Main = () => {
    return (
      <div id="app">{F.range(0,51).map((i) => Row({}, i))}</div>
    )
  }
}




window.React = React
window.ReactDOM = ReactDOM
window.Main = Main
