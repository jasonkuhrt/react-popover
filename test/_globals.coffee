g = window
g.Promise = require 'bluebird'
g.React = require 'react/addons'
g.a = require('chai').assert
g.testUtils = React.addons.TestUtils
g.sim = testUtils.Simulate
g.Popover = require '../lib'
g.e = React.DOM
