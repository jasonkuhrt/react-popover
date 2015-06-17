import Debug from 'debug'
import R from 'ramda'
import React, { DOM as E } from 'react'
import Draggable from 'react-draggable'
import Popover from '../../lib'
import styles from './index.css'
import Tappable from 'react-tappable'
import * as Layout from '../../lib/layout'



let debug = Debug('demo')
React.initializeTouchEvents(true)
Popover = React.createFactory(Popover)
Tappable = React.createFactory(Tappable)
Draggable = React.createFactory(Draggable)



let Demo = React.createClass({
  name: 'demo',
  getInitialState: function() {
    return {
      popoverIsOpen: false,
      preferPlace: null,
      place: null
    }
  },
  togglePopover(toState) {
    debug('togglePopover')
    toState = typeof toState === 'boolean' ? toState : !this.state.popoverIsOpen
    this.setState({
      popoverIsOpen: toState
    })
  },
  changePreferPlace(event) {
    let preferPlace = event.target.value === 'null' ? null : event.target.value
    this.setState({ preferPlace })
  },
  changePlace(event) {
    let place = event.target.value === 'null' ? null : event.target.value
    this.setState({ place })
  },
  render() {
    debug('render')

    let targetProps = {
      className: ['Target', `is-${['closed', 'open'][Number(this.state.popoverIsOpen)]}`].join(' ')
    }

    let targetToggleProps = {
      className: 'Target-Toggle',
      onTap: this.togglePopover
    }

    let targetMoveProps = {
      className: 'Target-Move'
    }

    let draggableProps = {
      handle: '.Target-Move'
    }

    let target = (
        Draggable(draggableProps,
          E.div(targetProps,
            E.div(targetMoveProps, 'Move'),
            Tappable(targetToggleProps, 'Toggle')
          )
        )
    )

    let popoverProps = {
      isOpen: this.state.popoverIsOpen,
      preferPlace: this.state.preferPlace,
      place: this.state.place,
      onOuterAction: this.togglePopover.bind(null, false),
      body: [
        E.h1({}, 'Popover Title'),
        E.div({}, 'Popover contents.')
      ]
    }

    let controls = (
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

    let popover = Popover(popoverProps, target)

    let app = E.div({}, controls, E.br(), popover)

    return app
  }
})


let createOption = (type) => (
  E.option({
      key: type,
      value: type,
      children: type
    }
  )
)

let createPreferPlaceOptions = R.compose(
  R.prepend([E.option({ key: 'null', value: null }, 'null')]),
  R.map(createOption),
  R.flatten,
  R.map(R.path(['values'])),
  R.path(['types'])
)



window.React = React
window.Main = Demo
