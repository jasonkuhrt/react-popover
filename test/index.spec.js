import React, { PropTypes as T } from "react"
// import { renderToString } from "react-dom/server"
import Popover from "../lib"
import renderer from "react-test-renderer"


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
      this.props.children
    )
  }
}



class FooComponent extends React.Component {
  static contextTypes = {
    foo: T.string,
  }
  render () {
    return (
      <div>{this.context.foo}</div>
    )
  }
}

class BarComponent extends React.Component {
  static contextTypes = {
    foo: T.string,
  }
  render () {
    return (
      <Popover
      isOpen={true}
      body={<FooComponent />}
      >
        <div>{this.context.foo}</div>
      </Popover>
    )
  }
}



it("Pass context through to layer", () => {
  const tree = renderer.create(
    <ContextProvider>
      <BarComponent />
    </ContextProvider>
  ).toJSON()
  // Create A, a context provider
  // Create B, a Popover instance, inside A
  // B should be able to access context provided by A
  expect(tree)
  .toMatchSnapshot()
})
