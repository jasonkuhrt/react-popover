import { DOM as E } from "react"
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
    /* Create a DOM node for mounting the React Layer. */
    this.layerContainerNode = createElement("div")
  },
  componentDidMount () {
    this.target = this.props.appendTarget && document.querySelector(this.props.appendTarget)
      ? document.querySelector(this.props.appendTarget)
      : document.body
    /* Mount the mount. */
    appendElement(this.layerContainerNode, this.target)
    this._layerRender()
  },
  componentDidUpdate () {
    this._layerRender()
  },
  componentWillUnmount () {
    this._layerUnrender()
    /* Unmount the mount. */
    removeElement(this.layerContainerNode, this.target)
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
