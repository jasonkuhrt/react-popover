import { isClient } from "./platform"

const find = (f, xs) => (
  xs.reduce(((b, x) => b ? b : f(x) ? x : null), null)
)

const equalRecords = (o1, o2) => {
  for (const key in o1) if (o1[key] !== o2[key]) return false
  return true
}

const noop = () => (
  undefined
)

const clientOnly = (f) => (
  isClient ? f : noop
)



export default {
  find,
  equalRecords,
  noop,
  clientOnly,
}
export {
  find,
  equalRecords,
  noop,
  clientOnly,
}
