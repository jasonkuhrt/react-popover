import React from "react"
import { PropTypes as T } from "prop-types"
import createReactClass from "create-react-class"
import Renderer from "react-test-renderer"
import portalMixin from "../lib/react-layer-mixin"



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

const Portal = createReactClass({
  propTypes: {
    children: T.node
  },
  mixins: [portalMixin()],
  renderLayer () {
    return (
      this.props.children
    )
  },
  render () {
    return null
  }
})



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
