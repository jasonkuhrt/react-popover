import E from "react-dom-factories"
import ReactDOM from "react-dom"
import { noop } from "./utils"
import { isClient } from "./platform"



const createElement = (x) =>
  isClient ? document.createElement(x) : noop

const bodyAppendElement = (x) =>
  isClient ? document.body.appendChild(x) : noop

const bodyRemoveElement = (x) =>
  isClient ? document.body.removeChild(x) : noop



const ReactLayerMixin = () => ({
  componentWillMount () {
    this.targetBounds = null
    /* Create a DOM node for mounting the React Layer. */
    this.layerContainerNode = createElement("div")
  },
  componentDidMount () {
    /* Mount the mount. */
    bodyAppendElement(this.layerContainerNode)
    this._layerRender()
  },
  componentDidUpdate () {
    this._layerRender()
  },
  componentWillUnmount () {
    this._layerUnrender()
    /* Unmount the mount. */
    bodyRemoveElement(this.layerContainerNode)
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
