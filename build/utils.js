"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clientOnly = exports.noop = exports.equalRecords = exports.find = undefined;

var _platform = require("./platform");

var find = function find(f, xs) {
  return xs.reduce(function (b, x) {
    return b ? b : f(x) ? x : null;
  }, null);
};

var equalRecords = function equalRecords(o1, o2) {
  for (var key in o1) {
    if (o1[key] !== o2[key]) return false;
  }return true;
};

var noop = function noop() {
  return undefined;
};

var clientOnly = function clientOnly(f) {
  return _platform.isClient ? f : noop;
};

exports.default = {
  find: find,
  equalRecords: equalRecords,
  noop: noop,
  clientOnly: clientOnly
};
exports.find = find;
exports.equalRecords = equalRecords;
exports.noop = noop;
exports.clientOnly = clientOnly;