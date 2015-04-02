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
        lockPoint: '.lockpoint'
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
        className: 'handle lockpoint'
        style: style
        onClick: this.togglePopover
    )

    e.div {}, lockPoint, popover




describe 'react-popover', ->

  it 'is a rendered element', ->
    renderApp Tracer(), ->
      sim.click $ '.lockpoint', this
      a.popoverExists()

  it 'should layout in the zone with the largest area'
  it 'body should autosize to dimensions of content'
  it 'body should not autosize beyond frame bounds'







