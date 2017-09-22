import E from "react-dom-factories"
import ReactDOM from "react-dom"
import { noop } from "./utils"
import { isClient } from "./platform"



const createElement = (x) =>
  isClient ? document.createElement(x) : noop

const appendElement = (x, target) =>
  isClient ? target.appendChild(x) : noop

const removeElement = (x, target) =>
  isClient ? target.removeChild(x) : noop



const ReactLayerMixin = () => ({
  componentWillMount () {
    this.targetBounds = null
    this.appendTarget = document.body
    /* Create a DOM node for mounting the React Layer. */
    this.layerContainerNode = createElement("div")
  },
  componentDidMount () {
    if (this.props.appendTarget && document.querySelector(this.props.appendTarget)) {
      this.appendTarget = document.querySelector(this.props.appendTarget)
    }

    /* Mount the mount. */
    appendElement(this.layerContainerNode, this.appendTarget)
    this._layerRender()
  },
  componentDidUpdate () {
    this._layerRender()
  },
  componentWillUnmount () {
    this._layerUnrender()
    /* Unmount the mount. */
    removeElement(this.layerContainerNode, this.appendTarget)
  },
  _layerRender () {
    const layerReactEl = this.renderLayer()
    if (!layerReactEl) {
      this.layerReactComponent = null
      ReactDOM.unstable_renderSubtreeIntoContainer(this, E.noscript(), this.layerContainerNode)
    } else {
      this.layerReactComponent = ReactDOM.unstable_renderSubtreeIntoContainer(this, layerReactEl, this.layerContainerNode)
    }
  },
  _layerUnrender () {
    if (this.layerWillUnmount) this.layerWillUnmount(this.layerContainerNode)
    ReactDOM.unmountComponentAtNode(this.layerContainerNode)
  },
  // renderLayer() {
  //   Must be implemented by consumer.
  // }
})



export default ReactLayerMixin
