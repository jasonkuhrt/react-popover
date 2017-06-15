"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require("react");

var _reactDom = require("react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _utils = require("./utils");

var _platform = require("./platform");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createElement = function createElement(x) {
  return _platform.isClient ? document.createElement(x) : _utils.noop;
};

var bodyAppendElement = function bodyAppendElement(x) {
  return _platform.isClient ? document.body.appendChild(x) : _utils.noop;
};

var bodyRemoveElement = function bodyRemoveElement(x) {
  return _platform.isClient ? document.body.removeChild(x) : _utils.noop;
};

var ReactLayerMixin = function ReactLayerMixin() {
  return {
    componentWillMount: function componentWillMount() {
      this.targetBounds = null;
      /* Create a DOM node for mounting the React Layer. */
      this.layerContainerNode = createElement("div");
    },
    componentDidMount: function componentDidMount() {
      /* Mount the mount. */
      bodyAppendElement(this.layerContainerNode);
      this._layerRender();
    },
    componentDidUpdate: function componentDidUpdate() {
      this._layerRender();
    },
    componentWillUnmount: function componentWillUnmount() {
      this._layerUnrender();
      /* Unmount the mount. */
      bodyRemoveElement(this.layerContainerNode);
    },
    _layerRender: function _layerRender() {
      var layerReactEl = this.renderLayer();
      if (!layerReactEl) {
        this.layerReactComponent = null;
        _reactDom2.default.unstable_renderSubtreeIntoContainer(this, _react.DOM.noscript(), this.layerContainerNode);
      } else {
        this.layerReactComponent = _reactDom2.default.unstable_renderSubtreeIntoContainer(this, layerReactEl, this.layerContainerNode);
      }
    },
    _layerUnrender: function _layerUnrender() {
      if (this.layerWillUnmount) this.layerWillUnmount(this.layerContainerNode);
      _reactDom2.default.unmountComponentAtNode(this.layerContainerNode);
    }
  };
};

exports.default = ReactLayerMixin;