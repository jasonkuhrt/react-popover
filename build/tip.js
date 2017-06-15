"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _react = require("react");

var _createReactClass = require("create-react-class");

var _createReactClass2 = _interopRequireDefault(_createReactClass);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Tip = (0, _createReactClass2.default)({
  displayName: "tip",
  render: function render() {
    var direction = this.props.direction;

    var size = this.props.size || 24;
    var isPortrait = direction === "up" || direction === "down";
    var mainLength = size;
    var crossLength = size * 2;
    var points = direction === "up" ? "0," + mainLength + " " + mainLength + ",0, " + crossLength + "," + mainLength : direction === "down" ? "0,0 " + mainLength + "," + mainLength + ", " + crossLength + ",0" : direction === "left" ? mainLength + ",0 0," + mainLength + ", " + mainLength + "," + crossLength : "0,0 " + mainLength + "," + mainLength + ", 0," + crossLength;
    var props = {
      className: "Popover-tip",
      width: isPortrait ? crossLength : mainLength,
      height: isPortrait ? mainLength : crossLength
    };
    var triangle = _react.DOM.svg(props, _react.DOM.polygon({
      className: "Popover-tipShape",
      points: points
    }));
    return triangle;
  }
});

exports.default = Tip;