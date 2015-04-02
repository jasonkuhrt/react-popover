g = window
g.Promise = require 'bluebird'
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

g.getPopoverPosition = ->
  measure $ '.Popover'

Object.assign window, require '../lib/utils'

before ->
  el = document.createElement 'div'
  el.id = 'app'
  document.body.appendChild el

afterEach ->
  #$ '#app'
  #.innerHTML = ''

