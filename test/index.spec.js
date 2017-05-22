import React from "react"
import { PropTypes as T } from "prop-types"
import Renderer from "react-test-renderer"



class ContextProvider extends React.Component {
  static propTypes = {
    children: T.node,
  }
  static defaultProps = {
    children: null,
  }
  static childContextTypes = {
    x: T.string,
  }
  getChildContext () {
    return ({
      x: "value-from-context",
    })
  }
  render () {
    return (
      this.props.children
    )
  }
}



class ContextDependent extends React.Component {
  static contextTypes = {
    x: T.string,
  }
  render () {
    return (
      <span>{this.context.x}</span>
    )
  }
}

class Portal extends React.Component {
  static propTypes = {
    children: T.node,
  }
  renderLayer () {
    return (
      this.props.children
    )
  }
  render () {
    return null
  }
}



beforeEach(() => {
  document.body.innerHTML = ""
})

it("Pass context through to layer", () => {
  Renderer.create(
    <ContextProvider>
      <Portal>
        <ContextDependent />
      </Portal>
    </ContextProvider>
  )
  expect(document.body.innerHTML).toMatchSnapshot()
})
