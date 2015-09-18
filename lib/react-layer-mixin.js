import { DOM as E, render, unmountComponentAtNode } from 'react'



const ReactLayerMixin = () => (
  {
    componentWillMount () {
      this.targetBounds = null
      /* Create a DOM node for mounting the React Layer. */
      this.layerContainerNode = document.createElement(`div`)
    },
    componentDidMount () {
      /* Mount the mount. */
      document.body.appendChild(this.layerContainerNode)
      this._layerRender()
    },
    componentDidUpdate () {
      this._layerRender()
    },
    componentWillUnmount () {
      this._layerUnrender()
      /* Unmount the mount. */
      document.body.removeChild(this.layerContainerNode)
    },
    _layerRender () {
      const layerReactEl = this.renderLayer()
      if (!layerReactEl) {
        this.layerReactComponent = null
        render(E.noscript(), this.layerContainerNode)
      } else {
        this.layerReactComponent = render(layerReactEl, this.layerContainerNode)
      }
    },
    _layerUnrender () {
      if (this.layerWillUnmount) this.layerWillUnmount(this.layerContainerNode)
      unmountComponentAtNode(this.layerContainerNode)
    },
    // renderLayer() {}
    //   Must be implemented by consuming component.
  }
)



export {
  ReactLayerMixin as default
}
