import './main.css'
import Debug from 'debug'
import R from 'ramda'
import React, { DOM as E } from 'react'
import ReactDOM from 'react-dom'
import DraggableClass from 'react-draggable'
import PopoverClass from '../../lib'
import TappableClass from 'react-tappable'
import * as Layout from '../../lib/layout'



const debug = Debug('demo')
const Popover = React.createFactory(PopoverClass)
const Tappable = React.createFactory(TappableClass)
const Draggable = React.createFactory(DraggableClass)

Debug.enable('react-popover,demo')

const createOption = (type) => (
  E.option({
    key: type,
    value: type,
    children: type
  })
)

const createPreferPlaceOptions = R.compose(
  R.prepend([E.option({ key: 'null', value: null }, 'null')]),
  R.map(createOption),
  R.flatten,
  R.map(R.path(['values'])),
  R.path(['types'])
)

const Demo = React.createClass({
  name: 'demo',
  getInitialState () {
    return {
      popoverIsOpen: false,
      preferPlace: null,
      place: null
    }
  },
  togglePopover (toState) {
    debug('togglePopover')
    const popoverIsOpen = typeof toState === 'boolean'
      ? toState
      : !this.state.popoverIsOpen
    this.setState({
      popoverIsOpen
    })
  },
  changePreferPlace (event) {
    const preferPlace = event.target.value === 'null' ? null : event.target.value
    this.setState({ preferPlace })
  },
  changePlace (event) {
    const place = event.target.value === 'null' ? null : event.target.value
    this.setState({ place })
  },
  render () {
    debug('render')

    const targetProps = {
      className: [
        'Target',
        `is-${[ 'closed', 'open' ][Number(this.state.popoverIsOpen)]}`
      ].join(' ')
    }

    const targetToggleProps = {
      className: 'Target-Toggle',
      onTap: this.togglePopover
    }

    const targetMoveProps = {
      className: 'Target-Move'
    }

    const draggableProps = {
      handle: '.Target-Move'
    }

    const target = (
      Draggable(draggableProps,
        E.div(targetProps,
          E.div(targetMoveProps, 'Move'),
          Tappable(targetToggleProps, 'Toggle')
        )
      )
    )

    const popoverProps = {
      isOpen: this.state.popoverIsOpen,
      preferPlace: this.state.preferPlace,
      place: this.state.place,
      onOuterAction: this.togglePopover.bind(null, false),
      body: [
        E.h1({}, 'Popover Title'),
        E.div({}, 'Popover contents.')
      ]
    }

    const controls = (
      E.form({},
        E.label({ htmlFor: 'preferPlace' }, 'preferPlace '),
        E.select({ id: 'preferPlace', onChange: this.changePreferPlace },
          createPreferPlaceOptions(Layout)
        ),
        E.label({ htmlFor: 'place' }, 'place '),
        E.select({ id: 'place', onChange: this.changePlace },
          createPreferPlaceOptions(Layout)
        )

      )
    )

    const popover = Popover(popoverProps, target)

    const app = E.div({ id: 'app' }, controls, popover)

    return app
  }
})



window.React = React
window.ReactDOM = ReactDOM
window.Main = Demo
