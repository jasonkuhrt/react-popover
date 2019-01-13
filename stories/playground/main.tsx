import * as Forto from "forto"
import * as R from "ramda"
import React from "react"
import Draggable from "react-draggable"
import Popover from "../../source/components/Popover"
import "../base.css"
import "./main.css"

const Option = (type: string) => (
  <option key={type} value={type} children={type} />
)

const createPreferPlaceOptions = () => {
  return [<option key="null" value={undefined} children="null" />].concat(
    [
      ...R.values(Forto.Settings.Order),
      ...R.values(Forto.Settings.Ori.Side),
      ...R.values(Forto.Settings.Ori.Ori),
    ].map(Option),
  )
}

class Main extends React.Component {
  state = {
    popoverIsOpen: false,
    preferPlace: undefined,
    place: undefined,
    frameRef: React.createRef<HTMLDivElement>(),
  }

  togglePopover = (toState?: boolean) => {
    const popoverIsOpen =
      typeof toState === "boolean" ? toState : !this.state.popoverIsOpen
    this.setState({
      popoverIsOpen,
    })
  }

  closePopover = () => {
    this.togglePopover(false)
  }

  changePreferPlace = (event: any) => {
    const preferPlace =
      event.target.value === "null" ? null : event.target.value
    this.setState({ preferPlace })
  }

  changePlace = (event: any) => {
    const place = event.target.value === "null" ? null : event.target.value
    this.setState({ place })
  }

  render() {
    const targetProps = {
      className: [
        "Target",
        `is-${["closed", "open"][Number(this.state.popoverIsOpen)]}`,
      ].join(" "),
    }

    const targetToggleProps = {
      className: "Target-Toggle",
      onClick: () => this.togglePopover(),
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

    const frame = <div id="frame" ref={this.state.frameRef} />

    const targetWithPopover = (
      <Popover
        isOpen={this.state.popoverIsOpen}
        preferPlace={this.state.preferPlace}
        place={this.state.place}
        onOuterAction={this.closePopover}
        body={[
          <h1 key="a">Popover Title</h1>,
          <div key="b">Popover contents</div>,
        ]}
        appendTarget={document.querySelector("#root")!}
        frame={this.state.frameRef}
      >
        {target}
      </Popover>
    )

    const controls = (
      <form>
        <label htmlFor="preferPlace">preferPlace </label>
        <select id="preferPlace" onChange={e => this.changePreferPlace(e)}>
          {createPreferPlaceOptions()}
        </select>
        <label htmlFor="place">place </label>
        <select id="place" onChange={e => this.changePlace(e)}>
          {createPreferPlaceOptions()}
        </select>
      </form>
    )

    return (
      <div id="app">
        {frame}
        {controls}
        {targetWithPopover}
      </div>
    )
  }
}

export default Main
