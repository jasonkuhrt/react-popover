import R from 'react'
import RD from 'react-dom'
import AssignPolyFill from 'object.assign/polyfill'
import { isClient } from './platform'



const assign = AssignPolyFill()

const arrayify = (x) => (
  Array.isArray(x) ? x : [x]
)

const find = (f, xs) => (
  xs.reduce(((b, x) => b ? b : f(x) ? x : null), null)
)

const equalRecords = (o1, o2) => {
  for (const key in o1) if (o1[key] !== o2[key]) return false
  return true
}

/* React 12<= / >=13 compatible findDOMNode function. */
const supportsFindDOMNode = (
  Number(R.version.split(`.`)[1]) >= 13
)

const findDOMNode = (component) => (
  supportsFindDOMNode ?
    RD.findDOMNode(component) :
    component.getDOMNode()
)

const noop = () => (
  undefined
)

const clientOnly = (f) => (
  isClient ? f : noop
)



export {
  assign,
  arrayify,
  find,
  equalRecords,
  findDOMNode,
  noop,
  clientOnly,
}
