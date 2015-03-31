import React, { DOM as e } from 'react'
import Popover from '../../lib'




let app = React.createClass({
  name: 'basic-demo',
  render() {
    let lockPoint = e.div({ style: lockPointStyle }, '!')
    //let element = Popover({ lockPoint })
    return e.div({}, lockPoint)
  }
})

let lockPointStyle = {
  width: 50,
  height: 50,
  background: 'red'
}



document.onreadystatechange = function () {
  if (document.readyState === 'complete') {
    React.render(React.createElement(app), window.document.body)
  }
}
