"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cssVendor = require("css-vendor");

var cssVendor = _interopRequireWildcard(_cssVendor);

var _debug = require("debug");

var _debug2 = _interopRequireDefault(_debug);

var _lodash = require("lodash.throttle");

var _lodash2 = _interopRequireDefault(_lodash);

var _propTypes = require("prop-types");

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _reactDom = require("react-dom");

var _reactDom2 = _interopRequireDefault(_reactDom);

var _layout = require("./layout");

var _layout2 = _interopRequireDefault(_layout);

var _onResize = require("./on-resize");

var _onResize2 = _interopRequireDefault(_onResize);

var _platform = require("./platform");

var _platform2 = _interopRequireDefault(_platform);

var _tip = require("./tip");

var _tip2 = _interopRequireDefault(_tip);

var _utils = require("./utils");

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var log = (0, _debug2.default)("react-popover");

var supportedCSSValue = _utils2.default.clientOnly(cssVendor.supportedValue);

var jsprefix = function jsprefix(x) {
  return "" + cssVendor.prefix.js + x;
};

var cssprefix = function cssprefix(x) {
  return "" + cssVendor.prefix.css + x;
};

var cssvalue = function cssvalue(prop, value) {
  return supportedCSSValue(prop, value) || cssprefix(value);
};

var coreStyle = {
  position: "absolute",
  top: 0,
  left: 0,
  display: cssvalue("display", "flex")
};

var faces = {
  above: "down",
  right: "left",
  below: "up",
  left: "right"

  /* Flow mappings. Each map maps the flow domain to another domain. */

};var flowToTipTranslations = {
  row: "translateY",
  column: "translateX"
};

var flowToPopoverTranslations = {
  row: "translateX",
  column: "translateY"
};

var Popover = function (_React$Component) {
  _inherits(Popover, _React$Component);

  function Popover(props) {
    _classCallCheck(this, Popover);

    var _this = _possibleConstructorReturn(this, (Popover.__proto__ || Object.getPrototypeOf(Popover)).call(this, props));

    _this.checkTargetReposition = function () {
      if (_this.measureTargetBounds()) _this.resolvePopoverLayout();
    };

    _this.checkForOuterAction = function (event) {
      var isOuterAction = !_this.containerEl.contains(event.target) && !_this.targetEl.contains(event.target);
      if (isOuterAction) _this.props.onOuterAction(event);
    };

    _this.onTargetResize = function () {
      log("Recalculating layout because _target_ resized!");
      _this.measureTargetBounds();
      _this.resolvePopoverLayout();
    };

    _this.onPopoverResize = function () {
      log("Recalculating layout because _popover_ resized!");
      _this.measurePopoverSize();
      _this.resolvePopoverLayout();
    };

    _this.onFrameScroll = function () {
      log("Recalculating layout because _frame_ scrolled!");
      _this.measureTargetBounds();
      _this.resolvePopoverLayout();
    };

    _this.onFrameResize = function () {
      log("Recalculating layout because _frame_ resized!");
      _this.measureFrameBounds();
      _this.resolvePopoverLayout();
    };

    _this.getContainerNodeRef = function (containerEl) {
      Object.assign(_this, { containerEl: containerEl });
    };

    _this.state = {
      standing: "above",
      exited: !_this.props.isOpen, // for animation-dependent rendering, should popover close/open?
      exiting: false, // for tracking in-progress animations
      toggle: _this.props.isOpen || false // for business logic tracking, should popover close/open?
    };
    return _this;
  }

  _createClass(Popover, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      /* Our component needs a DOM Node reference to the child so that it can be
      measured so that we can correctly layout the popover. We do not have any
      control over the child so cannot leverage refs. We could wrap our own
      primitive component around the child but that could lead to breaking the
      uses layout (e.g. the child is a flex item). Leveraging findDOMNode seems
      to be the only functional solution, despite all the general warnings not to
      use it. We have a legitimate use-case. */
      // eslint-disable-next-line
      this.targetEl = _reactDom2.default.findDOMNode(this);
      if (this.props.isOpen) this.enter();
    }
  }, {
    key: "componentWillReceiveProps",
    value: function componentWillReceiveProps(propsNext) {
      //log(`Component received props!`, propsNext)
      var willOpen = !this.props.isOpen && propsNext.isOpen;
      var willClose = this.props.isOpen && !propsNext.isOpen;

      if (willOpen) this.open();else if (willClose) this.close();
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(propsPrev, statePrev) {
      //log(`Component did update!`)
      var didOpen = !statePrev.toggle && this.state.toggle;
      var didClose = statePrev.toggle && !this.state.toggle;

      if (didOpen) this.enter();else if (didClose) this.exit();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      /* If the Popover is unmounted while animating,
      clear the animation so no setState occured */
      this.animateExitStop();
      /* If the Popover was never opened then then tracking
      initialization never took place and so calling untrack
      would be an error. Also see issue 55. */
      if (this.hasTracked) this.untrackPopover();
    }
  }, {
    key: "resolvePopoverLayout",
    value: function resolvePopoverLayout() {
      /* Find the optimal zone to position self. Measure the size of each zone and use the one with
      the greatest area. */

      var pickerSettings = {
        preferPlace: this.props.preferPlace,
        place: this.props.place

        /* This is a kludge that solves a general problem very specifically for Popover.
        The problem is subtle. When Popover positioning changes such that it resolves at
        a different orientation, its Size will change because the Tip will toggle between
        extending Height or Width. The general problem of course is that calculating
        zone positioning based on current size is non-trivial if the Size can change once
        resolved to a different zone. Infinite recursion can be triggered as we noted here:
        https://github.com/littlebits/react-popover/issues/18. As an example of how this
        could happen in another way: Imagine the user changes the CSS styling of the popover
        based on whether it was `row` or `column` flow. TODO: Find a solution to generally
        solve this problem so that the user is free to change the Popover styles in any
        way at any time for any arbitrary trigger. There may be value in investigating the
        http://overconstrained.io community for its general layout system via the
        constraint-solver Cassowary. */
      };if (this.zone) this.size[this.zone.flow === "row" ? "h" : "w"] += this.props.tipSize;
      var zone = _layout2.default.pickZone(pickerSettings, this.frameBounds, this.targetBounds, this.size);
      if (this.zone) this.size[this.zone.flow === "row" ? "h" : "w"] -= this.props.tipSize;

      var tb = this.targetBounds;
      this.zone = zone;
      log("zone", zone);

      this.setState({
        standing: zone.standing
      });

      var axis = _layout2.default.axes[zone.flow];
      log("axes", axis);

      var dockingEdgeBufferLength = Math.round(getComputedStyle(this.bodyEl).borderRadius.slice(0, -2)) || 0;
      var scrollSize = _layout2.default.El.calcScrollSize(this.frameEl);
      scrollSize.main = scrollSize[axis.main.size];
      scrollSize.cross = scrollSize[axis.cross.size];

      /* When positioning self on the cross-axis do not exceed frame bounds. The strategy to achieve
      this is thus: First position cross-axis self to the cross-axis-center of the the target. Then,
      offset self by the amount that self is past the boundaries of frame. */
      var pos = _layout2.default.calcRelPos(zone, tb, this.size);

      /* Offset allows users to control the distance betweent the tip and the target. */
      pos[axis.main.start] += this.props.offset * zone.order;

      /* Constrain containerEl Position within frameEl. Try not to penetrate a visually-pleasing buffer from
      frameEl. `frameBuffer` length is based on tipSize and its offset. */

      var frameBuffer = this.props.tipSize + this.props.offset;
      var hangingBufferLength = dockingEdgeBufferLength * 2 + this.props.tipSize * 2 + frameBuffer;
      var frameCrossStart = this.frameBounds[axis.cross.start];
      var frameCrossEnd = this.frameBounds[axis.cross.end];
      var frameCrossLength = this.frameBounds[axis.cross.size];
      var frameCrossInnerLength = frameCrossLength - frameBuffer * 2;
      var frameCrossInnerStart = frameCrossStart + frameBuffer;
      var frameCrossInnerEnd = frameCrossEnd - frameBuffer;
      var popoverCrossStart = pos[axis.cross.start];
      var popoverCrossEnd = pos[axis.cross.end];

      /* If the popover dose not fit into frameCrossLength then just position it to the `frameCrossStart`.
      popoverCrossLength` will now be forced to overflow into the `Frame` */
      if (pos.crossLength > frameCrossLength) {
        log("popoverCrossLength does not fit frame.");
        pos[axis.cross.start] = 0;

        /* If the `popoverCrossStart` is forced beyond some threshold of `targetCrossLength` then bound
        it (`popoverCrossStart`). */
      } else if (tb[axis.cross.end] < hangingBufferLength) {
        log("popoverCrossStart cannot hang any further without losing target.");
        pos[axis.cross.start] = tb[axis.cross.end] - hangingBufferLength;

        /* checking if the cross start of the target area is within the frame and it makes sense
        to try fitting popover into the frame. */
      } else if (tb[axis.cross.start] > frameCrossInnerEnd) {
        log("popoverCrossStart cannot hang any further without losing target.");
        pos[axis.cross.start] = tb[axis.cross.start] - this.size[axis.cross.size];

        /* If the `popoverCrossStart` does not fit within the inner frame (honouring buffers) then
        just center the popover in the remaining `frameCrossLength`. */
      } else if (pos.crossLength > frameCrossInnerLength) {
        log("popoverCrossLength does not fit within buffered frame.");
        pos[axis.cross.start] = (frameCrossLength - pos.crossLength) / 2;
      } else if (popoverCrossStart < frameCrossInnerStart) {
        log("popoverCrossStart cannot reverse without exceeding frame.");
        pos[axis.cross.start] = frameCrossInnerStart;
      } else if (popoverCrossEnd > frameCrossInnerEnd) {
        log("popoverCrossEnd cannot travel without exceeding frame.");
        pos[axis.cross.start] = pos[axis.cross.start] - (pos[axis.cross.end] - frameCrossInnerEnd);
      }

      /* So far the link position has been calculated relative to the target. To calculate the absolute
      position we need to factor the `Frame``s scroll position */

      pos[axis.cross.start] += scrollSize.cross;
      pos[axis.main.start] += scrollSize.main;

      /* Apply `flow` and `order` styles. This can impact subsequent measurements of height and width
      of the container. When tip changes orientation position due to changes from/to `row`/`column`
      width`/`height` will be impacted. Our layout monitoring will catch these cases and automatically
      recalculate layout. */
      if (this.containerEl) {
        this.containerEl.style.flexFlow = zone.flow;
        this.containerEl.style[jsprefix("FlexFlow")] = this.containerEl.style.flexFlow;
      }
      this.bodyEl.style.order = zone.order;
      this.bodyEl.style[jsprefix("Order")] = this.bodyEl.style.order;

      /* Apply Absolute Positioning. */

      log("pos", pos);
      if (this.containerEl) {
        this.containerEl.style.top = pos.y + "px";
        this.containerEl.style.left = pos.x + "px";
      }

      /* Calculate Tip Position */

      var tipCrossPos =
      /* Get the absolute tipCrossCenter. Tip is positioned relative to containerEl
      but it aims at targetCenter which is positioned relative to frameEl... we
      need to cancel the containerEl positioning so as to hit our intended position. */
      _layout2.default.centerOfBoundsFromBounds(zone.flow, "cross", tb, pos) +
      /* centerOfBounds does not account for scroll so we need to manually add that
      here. */
      scrollSize.cross -
      /* Center tip relative to self. We do not have to calcualte half-of-tip-size since tip-size
      specifies the length from base to tip which is half of total length already. */
      this.props.tipSize;

      if (tipCrossPos < dockingEdgeBufferLength) tipCrossPos = dockingEdgeBufferLength;else if (tipCrossPos > pos.crossLength - dockingEdgeBufferLength - this.props.tipSize * 2) {
        tipCrossPos = pos.crossLength - dockingEdgeBufferLength - this.props.tipSize * 2;
      }

      this.tipEl.style.transform = flowToTipTranslations[zone.flow] + "(" + tipCrossPos + "px)";
      this.tipEl.style[jsprefix("Transform")] = this.tipEl.style.transform;
    }
  }, {
    key: "measurePopoverSize",
    value: function measurePopoverSize() {
      this.size = _layout2.default.El.calcSize(this.containerEl);
    }
  }, {
    key: "measureTargetBounds",
    value: function measureTargetBounds() {
      var newTargetBounds = _layout2.default.El.calcBounds(this.targetEl);

      if (this.targetBounds && _layout2.default.equalCoords(this.targetBounds, newTargetBounds)) {
        return false;
      }

      this.targetBounds = newTargetBounds;
      return true;
    }
  }, {
    key: "open",
    value: function open() {
      if (this.state.exiting) this.animateExitStop();
      this.setState({ toggle: true, exited: false });
    }
  }, {
    key: "close",
    value: function close() {
      this.setState({ toggle: false });
    }
  }, {
    key: "enter",
    value: function enter() {
      if (_platform2.default.isServer) return;
      log("enter!");
      this.trackPopover();
      this.animateEnter();
    }
  }, {
    key: "exit",
    value: function exit() {
      log("exit!");
      this.animateExit();
      this.untrackPopover();
    }
  }, {
    key: "animateExitStop",
    value: function animateExitStop() {
      clearTimeout(this.exitingAnimationTimer1);
      clearTimeout(this.exitingAnimationTimer2);
      this.setState({ exiting: false });
    }
  }, {
    key: "animateExit",
    value: function animateExit() {
      var _this2 = this;

      this.setState({ exiting: true });
      this.exitingAnimationTimer2 = setTimeout(function () {
        setTimeout(function () {
          if (_this2.containerEl) {
            _this2.containerEl.style.transform = flowToPopoverTranslations[_this2.zone.flow] + "(" + _this2.zone.order * 50 + "px)";
            _this2.containerEl.style.opacity = "0";
          }
        }, 0);
      }, 0);

      this.exitingAnimationTimer1 = setTimeout(function () {
        _this2.setState({ exited: true, exiting: false });
      }, this.props.enterExitTransitionDurationMs);
    }
  }, {
    key: "animateEnter",
    value: function animateEnter() {
      /* Prepare `entering` style so that we can then animate it toward `entered`. */

      this.containerEl.style.transform = flowToPopoverTranslations[this.zone.flow] + "(" + this.zone.order * 50 + "px)";
      this.containerEl.style[jsprefix("Transform")] = this.containerEl.style.transform;
      this.containerEl.style.opacity = "0";

      /* After initial layout apply transition animations. */
      /* Hack: http://stackoverflow.com/questions/3485365/how-can-i-force-webkit-to-redraw-repaint-to-propagate-style-changes */
      this.containerEl.offsetHeight;

      /* If enterExitTransitionDurationMs is falsy, tip animation should be also disabled */
      if (this.props.enterExitTransitionDurationMs) {
        this.tipEl.style.transition = "transform 150ms ease-in";
        this.tipEl.style[jsprefix("Transition")] = cssprefix("transform") + " 150ms ease-in";
      }
      this.containerEl.style.transitionProperty = "top, left, opacity, transform";
      this.containerEl.style.transitionDuration = this.props.enterExitTransitionDurationMs + "ms";
      this.containerEl.style.transitionTimingFunction = "cubic-bezier(0.230, 1.000, 0.320, 1.000)";
      this.containerEl.style.opacity = "1";
      this.containerEl.style.transform = "translateY(0)";
      this.containerEl.style[jsprefix("Transform")] = this.containerEl.style.transform;
    }
  }, {
    key: "trackPopover",
    value: function trackPopover() {
      var minScrollRefreshIntervalMs = 200;
      var minResizeRefreshIntervalMs = 200;

      /* Get references to DOM elements. */

      this.bodyEl = this.containerEl.querySelector(".Popover-body");
      this.tipEl = this.containerEl.querySelector(".Popover-tip");

      /* Note: frame is hardcoded to window now but we think it will
      be a nice feature in the future to allow other frames to be used
      such as local elements that further constrain the popover`s world. */

      this.frameEl = _platform2.default.window;
      this.hasTracked = true;

      /* Set a general interval for checking if target position changed. There is no way
      to know this information without polling. */
      if (this.props.refreshIntervalMs) {
        this.checkLayoutInterval = setInterval(this.checkTargetReposition, this.props.refreshIntervalMs);
      }

      /* Watch for boundary changes in all deps, and when one of them changes, recalculate layout.
      This layout monitoring must be bound immediately because a layout recalculation can recursively
      cause a change in boundaries. So if we did a one-time force-layout before watching boundaries
      our final position calculations could be wrong. See comments in resolver function for details
      about which parts can trigger recursive recalculation. */

      this.onFrameScroll = (0, _lodash2.default)(this.onFrameScroll, minScrollRefreshIntervalMs);
      this.onFrameResize = (0, _lodash2.default)(this.onFrameResize, minResizeRefreshIntervalMs);
      this.onPopoverResize = (0, _lodash2.default)(this.onPopoverResize, minResizeRefreshIntervalMs);
      this.onTargetResize = (0, _lodash2.default)(this.onTargetResize, minResizeRefreshIntervalMs);

      this.frameEl.addEventListener("scroll", this.onFrameScroll);
      _onResize2.default.on(this.frameEl, this.onFrameResize);
      _onResize2.default.on(this.containerEl, this.onPopoverResize);
      _onResize2.default.on(this.targetEl, this.onTargetResize);

      /* Track user actions on the page. Anything that occurs _outside_ the Popover boundaries
      should close the Popover. */

      _platform2.default.document.addEventListener("mousedown", this.checkForOuterAction);
      _platform2.default.document.addEventListener("touchstart", this.checkForOuterAction);

      /* Kickstart layout at first boot. */

      this.measurePopoverSize();
      this.measureFrameBounds();
      this.measureTargetBounds();
      this.resolvePopoverLayout();
    }
  }, {
    key: "untrackPopover",
    value: function untrackPopover() {
      clearInterval(this.checkLayoutInterval);
      this.frameEl.removeEventListener("scroll", this.onFrameScroll);
      _onResize2.default.off(this.frameEl, this.onFrameResize);
      _onResize2.default.off(this.containerEl, this.onPopoverResize);
      _onResize2.default.off(this.targetEl, this.onTargetResize);
      _platform2.default.document.removeEventListener("mousedown", this.checkForOuterAction);
      _platform2.default.document.removeEventListener("touchstart", this.checkForOuterAction);
      this.hasTracked = false;
    }
  }, {
    key: "measureFrameBounds",
    value: function measureFrameBounds() {
      this.frameBounds = _layout2.default.El.calcBounds(this.frameEl);
    }
  }, {
    key: "render",
    value: function render() {
      var _props = this.props,
          _props$className = _props.className,
          className = _props$className === undefined ? "" : _props$className,
          _props$style = _props.style,
          style = _props$style === undefined ? {} : _props$style,
          tipSize = _props.tipSize;
      var standing = this.state.standing;


      var popoverProps = {
        className: "Popover Popover-" + standing + " " + className,
        style: _extends({}, coreStyle, style)
      };

      var popover = this.state.exited ? null : _react2.default.createElement(
        "div",
        _extends({ ref: this.getContainerNodeRef }, popoverProps),
        _react2.default.createElement("div", { className: "Popover-body", children: this.props.body }),
        _react2.default.createElement(_tip2.default, { direction: faces[standing], size: tipSize })
      );
      return [this.props.children, _platform2.default.isClient && _reactDom2.default.createPortal(popover, this.props.appendTarget)];
    }
  }]);

  return Popover;
}(_react2.default.Component);

Popover.propTypes = {
  body: _propTypes2.default.node.isRequired,
  children: _propTypes2.default.element.isRequired,
  appendTarget: _propTypes2.default.object,
  className: _propTypes2.default.string,
  enterExitTransitionDurationMs: _propTypes2.default.number,
  isOpen: _propTypes2.default.bool,
  offset: _propTypes2.default.number,
  place: _propTypes2.default.oneOf(_layout2.default.validTypeValues),
  preferPlace: _propTypes2.default.oneOf(_layout2.default.validTypeValues),
  refreshIntervalMs: _propTypes2.default.oneOfType([_propTypes2.default.number, _propTypes2.default.bool]),
  style: _propTypes2.default.object,
  tipSize: _propTypes2.default.number,
  onOuterAction: _propTypes2.default.func
};
Popover.defaultProps = {
  tipSize: 7,
  preferPlace: null,
  place: null,
  offset: 4,
  isOpen: false,
  onOuterAction: _utils2.default.noop,
  enterExitTransitionDurationMs: 500,
  children: null,
  refreshIntervalMs: 200,
  appendTarget: _platform2.default.isClient ? _platform2.default.document.body : null
};
exports.default = Popover;