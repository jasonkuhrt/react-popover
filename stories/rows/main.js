import F from "ramda"
import React from "react"
import Popover from "../../source"
import "../base.css"
import "./main.css"

class Row extends React.Component {
  state = {
    isOpen: false,
  }
  toggle(toState = null) {
    this.setState({ isOpen: toState === null ? !this.state.isOpen : toState })
  }
  closePopoverWhenEscaping = event => {
    if (event.key === "Escape") {
      this.toggle(false)
    }
  }
  render() {
    const { isOpen } = this.state
    return (
      <Popover
        isOpen={isOpen}
        body="This is where you would explain stuff"
        children={
          <div
            tabIndex="0"
            className="Row"
            onMouseOver={() => this.toggle(true)}
            onMouseOut={() => this.toggle(false)}
            onFocus={() => this.toggle(true)}
            onBlur={() => this.toggle(false)}
            onKeyDown={this.closePopoverWhenEscaping}
            children={this.props.children}
          />
        }
      />
    )
  }
}

const Main = () => (
  <div
    id="app"
    children={F.range(0, 51).map(i => <Row key={i} children={i} />)}
  />
)

export default Main
