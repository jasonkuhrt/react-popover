g = window
g.React = require 'react/addons'
g.a = require('chai').assert
g.testUtils = React.addons.TestUtils
g.sim = testUtils.Simulate
g.Popover = require '../lib'
g.e = React.DOM
Object.assign = require 'object.assign'



g.$ = (query, el)->
  if el
    React.findDOMNode(el).querySelector query
  else
    document.querySelector query

g.renderApp = (reactElementFactory, cb)->
  React.render reactElementFactory, $('#app'), cb

a.popoverExists = ->
  a $ '.Popover'



before ->
  el = document.createElement 'div'
  el.id = 'app'
  document.body.appendChild el

afterEach ->
  $ '#app'
  .innerHTML = ''

