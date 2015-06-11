import Debug from 'debug'
import R from 'ramda'
import Draggable from 'react-draggable'
import styles from './index.css'
import React, { DOM as E } from 'react'
import Popover from '../../lib'
import * as Layout from '../../lib/layout'



let debug = Debug('demo')
Popover = React.createFactory(Popover)
Draggable = React.createFactory(Draggable)



let Demo = React.createClass({
  name: 'demo',
  getInitialState: function() {
    return {
      popoverIsOpen: false,
      preferPlace: null
    }
  },
  togglePopover(toState) {
    toState = typeof toState === 'boolean' ? toState : !this.state.popoverIsOpen
    this.setState({
      popoverIsOpen: toState
    })
  },
  changePreferPlace(event) {
    let preferPlace = event.target.value === 'null' ? null : event.target.value
    this.setState({ preferPlace })
  },
  render() {
    debug('render')

    let targetProps = {
      className: ['Target', `is-${['open', 'closed'][Number(this.state.popoverIsOpen)]}`].join(' '),
      onDoubleClick: this.togglePopover
    }

    let draggableProps = {
      handle: '.Target'
    }

    let target = (
      Draggable(draggableProps,
        E.div(targetProps,
          'Drag \nOR\nDouble\nClick'
        )
      )
    )

    let popoverProps = {
      isOpen: this.state.popoverIsOpen,
      preferPlace: this.state.preferPlace,
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
        )
      )
    )

    let popover = Popover(popoverProps, target)

    let app = E.div({}, controls, E.br(), popover)

    return app
  }
})


let createOption = (type) => {
  return E.option({ key: type, value: type }, type)
}

let createPreferPlaceOptions = R.compose(
  R.prepend([E.option({ key: 'null', value: null }, 'null')]),
  R.map(createOption),
  R.flatten,
  R.map(R.path(['values'])),
  R.path(['types'])
)



window.React = React
window.Main = Demo
