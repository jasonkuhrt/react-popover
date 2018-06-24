import Debug from "debug"
import R from "ramda"
import React from "react"
import Draggable from "react-draggable"
import Popover from "../../source"
import * as Layout from "../../source/layout"
import "../base.css"
import "./main.css"

const debug = Debug("demo")

Debug.enable("react-popover,demo")

const Option = type => <option key={type} value={type} children={type} />

const createPreferPlaceOptions = R.compose(
  R.prepend([<option key="null" value={null} children="null" />]),
  R.map(Option),
  R.flatten,
  R.map(R.path(["values"])),
  R.path(["types"]),
)

class Main extends React.Component {
  state = {
    popoverIsOpen: false,
    preferPlace: null,
    place: null,
  }
  togglePopover(toState) {
    debug("togglePopover")
    const popoverIsOpen =
      typeof toState === "boolean" ? toState : !this.state.popoverIsOpen
    this.setState({
      popoverIsOpen,
    })
  }
  changePreferPlace(event) {
    const preferPlace =
      event.target.value === "null" ? null : event.target.value
    this.setState({ preferPlace })
  }
  changePlace(event) {
    const place = event.target.value === "null" ? null : event.target.value
    this.setState({ place })
  }
  render() {
    debug("render")

    const targetProps = {
      className: [
        "Target",
        `is-${["closed", "open"][Number(this.state.popoverIsOpen)]}`,
      ].join(" "),
    }

    const targetToggleProps = {
      className: "Target-Toggle",
      onClick: e => this.togglePopover(e),
    }

    const targetMoveProps = {
      className: "Target-Move",
    }

    const draggableProps = {
      handle: ".Target-Move",
    }

    const target = (
      <Draggable {...draggableProps}>
        <div {...targetProps}>
          <div {...targetMoveProps}>Move</div>
          <div {...targetToggleProps}>Toggle</div>
        </div>
      </Draggable>
    )

    const popoverProps = {
      isOpen: this.state.popoverIsOpen,
      preferPlace: this.state.preferPlace,
      place: this.state.place,
      onOuterAction: () => this.togglePopover(false),
      body: [
        <h1 key="a">Popover Title</h1>,
        <div key="b">Popover contents</div>,
      ],
    }

    const controls = (
      <form>
        <label htmlFor="preferPlace">preferPlace </label>
        <select id="preferPlace" onChange={e => this.changePreferPlace(e)}>
          {createPreferPlaceOptions(Layout)}
        </select>
        <label htmlFor="place">place </label>
        <select id="place" onChange={e => this.changePlace(e)}>
          {createPreferPlaceOptions(Layout)}
        </select>
      </form>
    )

    return (
      <div id="app">
        {controls}
        <Popover {...popoverProps}>{target}</Popover>
      </div>
    )
  }
}

export default Main
