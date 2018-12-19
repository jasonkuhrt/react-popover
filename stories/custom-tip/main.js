import React, { Component } from "react"
import Popover from "../../source"
import "../base.css"
import "./main.css"

function Tip () {
  return (
    <div className="Popover-tip size-20">
      <div className="pos-rel t-6 l-10 size-20 rotate-45 bg" />
    </div>
  )
}

class CustomTip extends Component {
  state = {
    isOpen: false,
  }

  toggle(toState = null) {
    this.setState({ isOpen: toState === null ? !this.state.isOpen : toState })
  }

  render() {
    const { isOpen } = this.state
    return (
      <div id="app">
        <Popover
          Tip={Tip}
          isOpen={isOpen}
          slide
          body="!"
          children={
            <div
              className="Row"
              onMouseOver={() => this.toggle(true)}
              onMouseOut={() => this.toggle(false)}
              children={1}
            />
          }
        />
      </div>
    )
  }
}

export default CustomTip

