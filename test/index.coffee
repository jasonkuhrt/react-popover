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



renderTracer = (props, cb)->
  if arguments.length is 1
    cb = props
    props = {}

  renderApp Tracer(props), ->
    lockEl = $ '.Lock'
    sim.click lockEl, this
    cb lockEl, $ '.Popover'



describe 'react-popover', ->

  it 'is a rendered element', ->
    renderTracer (lock, popover)->
      a popover, 'Popover is rendered'



describe 'react-popover rendering', ->

  it 'should layout in the zone with the largest area', ->
    renderTracer { style: left: '80%' }, (l, p)->
      p = measure p
      l = measure l
      a p.x2 < l.x, 'Popover is left of lock'
      a p.y is l.y, 'Popover is equal y of lock'

  it 'body should autosize to dimensions of content'
  it 'body should not autosize beyond frame bounds'







