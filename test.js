import R from 'react'
import PopoverClass from './lib'



const popoverString = R.renderToString(R.createElement(PopoverClass, {}))
console.log(popoverString)
