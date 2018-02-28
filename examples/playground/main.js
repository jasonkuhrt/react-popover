import "./main.css"
import Debug from "debug"
import R from "ramda"
import React, { DOM as E } from "react"
import createReactClass from "create-react-class"
import ReactDOM from "react-dom"
import DraggableClass from "react-draggable"
import PopoverClass from "../../lib"
import TappableClass from "react-tappable"
import * as Layout from "../../lib/layout"



const debug = Debug("demo")
const Popover = React.createFactory(PopoverClass)
const Tappable = React.createFactory(TappableClass)
const Draggable = React.createFactory(DraggableClass)

Debug.enable("react-popover,demo")

const createOption = (type) => (
  E.option({
    key: type,
    value: type,
    children: type
  })
)

const createPreferPlaceOptions = R.compose(
  R.prepend([E.option({ key: "null", value: null }, "null")]),
  R.map(createOption),
  R.flatten,
  R.map(R.path(["values"])),
  R.path(["types"])
)

const CustomTip = createReactClass({
  displayName: "tip",
  render () {
    const { direction } = this.props
    const size = this.props.size || 24
    const isPortrait = direction === "up" || direction === "down"
    const mainLength = size
    const crossLength = size * 2
    const points = (
      direction === "up" ? `0,${mainLength} ${mainLength},0, ${crossLength},${mainLength}`
      : direction === "down" ? `0,0 ${mainLength},${mainLength}, ${crossLength},0`
      : direction === "left" ? `${mainLength},0 0,${mainLength}, ${mainLength},${crossLength}`
      : `0,0 ${mainLength},${mainLength}, 0,${crossLength}`
    )
    const props = {
      className: "Popover-tip",
      width: isPortrait ? crossLength : mainLength,
      height: isPortrait ? mainLength : crossLength,
    }
    const triangle = (
      E.svg(props,
        E.polygon({
          className: "customTip",
          fill: "red",
          points,
        })
      )
    )
    return (
      triangle
    )
  },
})

const Demo = createReactClass({
  displayName: "demo",
  getInitialState () {
    return {
      popoverIsOpen: false,
      preferPlace: null,
      place: null
    }
  },
  togglePopover (toState) {
    debug("togglePopover")
    const popoverIsOpen = typeof toState === "boolean"
      ? toState
      : !this.state.popoverIsOpen
    this.setState({
      popoverIsOpen
    })
  },
  changePreferPlace (event) {
    const preferPlace = event.target.value === "null" ? null : event.target.value
    this.setState({ preferPlace })
  },
  changePlace (event) {
    const place = event.target.value === "null" ? null : event.target.value
    this.setState({ place })
  },
  changeTip (event) {
    const TipCls = event.target.value === "null" ? undefined : CustomTip
    this.setState({ TipCls })
  },
  render () {
    debug("render")

    const targetProps = {
      className: [
        "Target",
        `is-${[ "closed", "open" ][Number(this.state.popoverIsOpen)]}`
      ].join(" ")
    }

    const targetToggleProps = {
      className: "Target-Toggle",
      onTap: this.togglePopover
    }

    const targetMoveProps = {
      className: "Target-Move"
    }

    const draggableProps = {
      handle: ".Target-Move"
    }

    const target = (
      Draggable(draggableProps,
        E.div(targetProps,
          E.div(targetMoveProps, "Move"),
          Tappable(targetToggleProps, "Toggle")
        )
      )
    )

    const popoverProps = {
      Tip: this.state.TipCls,
      isOpen: this.state.popoverIsOpen,
      preferPlace: this.state.preferPlace,
      place: this.state.place,
      onOuterAction: this.togglePopover.bind(null, false),
      body: [
        E.h1({}, "Popover Title"),
        E.div({}, "Popover contents.")
      ]
    }

    const controls = (
      E.form({},
        E.label({ htmlFor: "preferPlace" }, "preferPlace "),
        E.select({ id: "preferPlace", onChange: this.changePreferPlace },
          createPreferPlaceOptions(Layout)
        ),
        E.label({ htmlFor: "place" }, "place "),
        E.select({ id: "place", onChange: this.changePlace },
          createPreferPlaceOptions(Layout)
        ),
        E.label({ htmlFor: "tip" }, "tip "),
        E.select({ id: "tip", onChange: this.changeTip },
          [
            E.option({ key: "null", value: null }, "null"),
            E.option({ key: "custom", value: "custom" }, "custom")
          ]
        )

      )
    )

    const popover = Popover(popoverProps, target)

    const app = E.div({ id: "app" }, controls, popover)

    return app
  }
})



window.React = React
window.ReactDOM = ReactDOM
window.Main = Demo
