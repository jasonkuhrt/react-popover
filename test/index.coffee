require './_globals.coffee'

Tracer = React.createFactory React.createClass
  name: 'tracer'

  getInitialState: ->
    popove: null

  getInitialProps: ->
    style: this.props.style || {}

  togglePopover: ->
    this.setState
      popover: if false then null else React.createElement(Popover, {
        lockPoint: '.Lock'
      }, this)

  render: ->
    popover = this.state.popover

    defaultStyle =
      position: 'absolute'
      background: 'red'
      top: 0
      left: 0
      width: 50
      height: 50

    style = Object.assign defaultStyle, this.props.style

    lockPoint = (
      e.div
        className: 'handle Lock'
        style: style
        onClick: this.togglePopover
    )

    e.div {}, lockPoint, popover



renderTracer = (props = {})->
  new Promise (resolve)->
    renderApp Tracer(props), ->
      lockEl = $ '.Lock'
      sim.click lockEl, this
      resolve [lockEl, $ '.Popover']
  .tap -> Promise.delay 500



describe 'react-popover', ->

  it 'is a rendered element', ->
    renderTracer (lock, popover)->
      a popover, 'Popover is rendered'



describe 'react-popover rendering', ->

  it 'should layout in the zone with the largest area', ->
    renderTracer style: left: '90%', transform: 'translateX(-50%)'
    .spread (l, p)->
      pb = calcBounds p
      lb = calcBounds l
      if isLandscape()
        console.log pb.y, lb.y
        a pb.x2 < lb.x, 'Popover is left of lock'
        a pb.y is lb.y, 'Popover is equal y of lock'
      else
        console.log pb.y, lb.y2
        a pb.y > lb.y2, 'Popover is bottom of lock'
        a (pb.x < lb.x2 and pb.x2 > lb.x2), 'Popover is cross-axes-centered of lock'

  it 'body should autosize to dimensions of content'
  it 'body should not autosize beyond frame bounds'







calcOrientation = ->
  if window.innerWidth > window.innerHeight then 'landscape' else 'portrait'

isLandscape = ->
  calcOrientation() is 'landscape'




