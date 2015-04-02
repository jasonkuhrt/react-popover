g = window
g.React = require 'react/addons'
g.a = require('chai').assert
g.testUtils = React.addons.TestUtils
g.sim = testUtils.Simulate
g.Popover = require '../lib'
g.e = React.DOM



g.$ = (query, el)->
  if el
    React.findDOMNode(el).querySelector query
  else
    document.querySelector query
