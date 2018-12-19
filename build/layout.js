"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.equalCoords = exports.doesFitWithin = exports.centerOfBoundsFromBounds = exports.centerOfBounds = exports.centerOfSize = exports.axes = exports.pickZone = exports.place = exports.calcRelPos = exports.validTypeValues = exports.types = exports.El = undefined;

var _platform = require("./platform");

var _utils = require("./utils");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* Axes System

This allows us to at-will work in a different orientation
without having to manually keep track of knowing if we should be using
x or y positions. */

var axes = {
  row: {},
  column: {}
};

axes.row.main = {
  start: "x",
  end: "x2",
  size: "w"
};
axes.row.cross = {
  start: "y",
  end: "y2",
  size: "h"
};
axes.column.main = axes.row.cross;
axes.column.cross = axes.row.main;

var types = [{ name: "side", values: ["start", "end"] }, { name: "standing", values: ["above", "right", "below", "left"] }, { name: "flow", values: ["column", "row"] }];

var validTypeValues = types.reduce(function (xs, _ref) {
  var values = _ref.values;
  return xs.concat(values);
}, []);

var centerOfSize = function centerOfSize(flow, axis, size) {
  return size[axes[flow][axis].size] / 2;
};

var centerOfBounds = function centerOfBounds(flow, axis, bounds) {
  return bounds[axes[flow][axis].start] + bounds[axes[flow][axis].size] / 2;
};

var centerOfBoundsFromBounds = function centerOfBoundsFromBounds(flow, axis, boundsTo, boundsFrom) {
  return centerOfBounds(flow, axis, boundsTo) - boundsFrom[axes[flow][axis].start];
};

var place = function place(flow, axis, align, bounds, size) {
  var axisProps = axes[flow][axis];
  return align === "center" ? centerOfBounds(flow, axis, bounds) - centerOfSize(flow, axis, size) : align === "end" ? bounds[axisProps.end] : align === "start" ? /* DOM rendering unfolds leftward. Therefore if the slave is positioned before
                                                                                                                                                                  the master then the slave`s position must in addition be pulled back
                                                                                                                                                                  by its [the slave`s] own length. */
  bounds[axisProps.start] - size[axisProps.size] : null;
};

/* Element Layout Queries */

var El = {};

El.calcBounds = function (el) {
  if (el === _platform.window) {
    return {
      x: 0,
      y: 0,
      x2: el.innerWidth,
      y2: el.innerHeight,
      w: el.innerWidth,
      h: el.innerHeight
    };
  }

  var b = el.getBoundingClientRect();

  return {
    x: b.left,
    y: b.top,
    x2: b.right,
    y2: b.bottom,
    w: b.right - b.left,
    h: b.bottom - b.top
  };
};

El.calcSize = function (el) {
  return el === _platform.window ? { w: el.innerWidth, h: el.innerHeight } : { w: el.offsetWidth, h: el.offsetHeight };
};

El.calcScrollSize = function (el) {
  return el === _platform.window ? {
    w: el.scrollX || el.pageXOffset,
    h: el.scrollY || el.pageYOffset
  } : { w: el.scrollLeft, h: el.scrollTop

    /* Misc Utilities */

  };
};var getPreferenceType = function getPreferenceType(preference) {
  return types.reduce(function (found, type) {
    return found ? found : type.values.indexOf(preference) !== -1 ? type.name : null;
  }, null);
};

/* Dimension Fit Checks */

var fitWithinChecker = function fitWithinChecker(dimension) {
  return function (domainSize, itemSize) {
    return domainSize[dimension] >= itemSize[dimension];
  };
};

var doesWidthFitWithin = fitWithinChecker("w");
var doesHeightFitWithin = fitWithinChecker("h");

var doesFitWithin = function doesFitWithin(domainSize, itemSize) {
  return doesWidthFitWithin(domainSize, itemSize) && doesHeightFitWithin(domainSize, itemSize);
};

/* Errors */

var createPreferenceError = function createPreferenceError(givenValue) {
  return new Error("The given layout placement of \"" + givenValue + "\" is not a valid choice. Valid choices are: " + validTypeValues.join(" | ") + ".");
};

/* Algorithm for picking the best fitting zone for popover. The current technique will loop through all zones picking the last one that fits.
In the case that none fit we should pick the least-not-fitting zone. */

var pickZone = function pickZone(opts, frameBounds, targetBounds, size) {
  var t = targetBounds;
  var f = frameBounds;
  var zones = [{
    side: "start",
    standing: "above",
    flow: "column",
    order: -1,
    w: f.x2,
    h: t.y
  }, {
    side: "end",
    standing: "right",
    flow: "row",
    order: 1,
    w: f.x2 - t.x2,
    h: f.y2
  }, {
    side: "end",
    standing: "below",
    flow: "column",
    order: 1,
    w: f.x2,
    h: f.y2 - t.y2
  }, {
    side: "start",
    standing: "left",
    flow: "row",
    order: -1,
    w: t.x,
    h: f.y2
  }];

  /* Order the zones by the amount of popup that would be cut out if that zone is used.
     The first one in the array is the one that cuts the least amount.
      const area = size.w * size.h  // Popup area is constant and it does not change the order
  */
  zones.forEach(function (z) {
    // TODO Update to satisfy linter
    // eslint-disable-next-line no-param-reassign
    z.cutOff =
    /* area */-Math.max(0, Math.min(z.w, size.w)) * Math.max(0, Math.min(z.h, size.h));
  });
  zones.sort(function (a, b) {
    return a.cutOff - b.cutOff;
  });

  var availZones = zones.filter(function (zone) {
    return doesFitWithin(zone, size);
  });

  /* If a place is required pick it from the available zones if possible. */

  if (opts.place) {
    var type = getPreferenceType(opts.place);
    if (!type) throw createPreferenceError(opts.place);
    var finder = function finder(z) {
      return z[type] === opts.place;
    };
    return (0, _utils.find)(finder, availZones) || (0, _utils.find)(finder, zones);
  }

  /* If the preferred side is part of the available zones, use that otherwise
  pick the largest available zone. If there are no available zones, pick the
  largest zone. */

  if (opts.preferPlace) {
    var preferenceType = getPreferenceType(opts.preferPlace);
    if (!preferenceType) throw createPreferenceError(opts.preferPlace);

    // Try to fit first in zone where the pop up fit completely
    var preferredAvailZones = availZones.filter(function (zone) {
      return zone[preferenceType] === opts.preferPlace;
    });
    if (preferredAvailZones.length) return preferredAvailZones[0];

    // If there are not areas where the pop up fit completely, it uses the preferred ones
    // in order from the one the fit better
    var preferredZones = zones.filter(function (zone) {
      return zone[preferenceType] === opts.preferPlace;
    });
    if (!availZones.length && preferredZones.length) return preferredZones[0];
  }

  // Return a zone that fit completely or the one that fit the best
  return availZones.length ? availZones[0] : zones[0];
};

/* TODO Document this. */

var calcRelPos = function calcRelPos(zone, masterBounds, slaveSize) {
  var _ref2;

  var _axes$zone$flow = axes[zone.flow],
      main = _axes$zone$flow.main,
      cross = _axes$zone$flow.cross;
  /* TODO: The slave is hard-coded to align cross-center with master. */

  var crossAlign = "center";
  var mainStart = place(zone.flow, "main", zone.side, masterBounds, slaveSize);
  var mainSize = slaveSize[main.size];
  var crossStart = place(zone.flow, "cross", crossAlign, masterBounds, slaveSize);
  var crossSize = slaveSize[cross.size];

  return _ref2 = {}, _defineProperty(_ref2, main.start, mainStart), _defineProperty(_ref2, "mainLength", mainSize), _defineProperty(_ref2, main.end, mainStart + mainSize), _defineProperty(_ref2, cross.start, crossStart), _defineProperty(_ref2, "crossLength", crossSize), _defineProperty(_ref2, cross.end, crossStart + crossSize), _ref2;
};

exports.default = {
  El: El,
  types: types,
  validTypeValues: validTypeValues,
  calcRelPos: calcRelPos,
  place: place,
  pickZone: pickZone,
  axes: axes,
  centerOfSize: centerOfSize,
  centerOfBounds: centerOfBounds,
  centerOfBoundsFromBounds: centerOfBoundsFromBounds,
  doesFitWithin: doesFitWithin,
  equalCoords: _utils.equalRecords
};
exports.El = El;
exports.types = types;
exports.validTypeValues = validTypeValues;
exports.calcRelPos = calcRelPos;
exports.place = place;
exports.pickZone = pickZone;
exports.axes = axes;
exports.centerOfSize = centerOfSize;
exports.centerOfBounds = centerOfBounds;
exports.centerOfBoundsFromBounds = centerOfBoundsFromBounds;
exports.doesFitWithin = doesFitWithin;
exports.equalCoords = _utils.equalRecords;