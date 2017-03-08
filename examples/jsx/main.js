import "./main.css"
import F from "ramda"
import React, { PropTypes as T } from "react"
import ReactDOM from "react-dom"
import Popover from "../../lib"
import classNames from "classnames"



const randomIntegerBetween = (from, to) => (
  Math.round((Math.random() * (to - from)) + from)
)

class ContextProvider extends React.Component {
  static propTypes = {
    children: T.any,
  }
  static childContextTypes = {
    foo: T.string,
  }
  getChildContext () {
    return ({
      foo: "bar",
    })
  }
  render () {
    return (
      <span>
        {this.props.children}
      </span>
    )
  }
}

class ContextProviderB extends React.Component {
  static propTypes = {
    children: T.any,
  }
  static childContextTypes = {
    bar: T.string,
  }
  getChildContext () {
    return ({
      bar: "qux",
    })
  }
  render () {
    return (
      <span>
        {this.props.children}
      </span>
    )
  }
}

class Boo extends React.Component {
  static contextTypes = {
    foo: T.string,
    bar: T.string,
  }
  render () {
    console.log(this.context)
    return (
      <span>Foo is: {this.context.foo}. Bar is: {this.context.bar}.</span>
    )
  }
}

// class Works extends React.Component {
//   static contextTypes = {
//     foo: T.string,
//     bar: T.string,
//   }
//   render () {
//     return (
//       <span>Foo is: {this.context.foo}. Bar is: {this.context.bar}.</span>
//     )
//   }
// }

const Main = React.createClass({
  getInitialState () {
    return {
      isOpen: false,
    }
  },
  toggle () {
    this.setState({
      isOpen: !this.state.isOpen
    })
  },
  renderPopover () {
    const {
      isOpen,
    } = this.state
    return (
      <ContextProviderB>
        <Popover isOpen={isOpen} body={<ContextProvider><Boo /></ContextProvider>}>
          <div
            className={ classNames("target", { isOpen }) }
            onClick={this.toggle}>
            { this.renderPerson(isOpen) }
          </div>
        </Popover>
      </ContextProviderB>
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
