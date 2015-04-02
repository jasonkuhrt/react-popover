require './_globals.coffee'

Tracer = React.createClass
  name: 'tracer'

  getInitialState: ->
    popove: null

  togglePopover: ->
    this.setState
      popover: if false then null else React.createElement(Popover, {
        lockPoint: '.lockpoint'
      }, this)

  render: ->
    popover = this.state.popover

    lockPoint = (
      e.div({
        className: 'handle lockpoint'
        style:
          width: 50
          height: 50
          background: 'red'
        onClick: this.togglePopover
      }
      )
    )

    e.div { id: 'test' }, lockPoint, popover






describe 'react-popover', ->
  beforeEach ->
    el = document.createElement 'div'
    el.id = 'app'
    document.body.appendChild el

  it 'renders a popover', ->
    # Open the popover
    tracer = React.createElement Tracer
    React.render tracer, $('#app'), ->
      sim.click $ '.lockpoint', this
      # Check the popover exists
      a $ '.Popover'







