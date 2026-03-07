import { IntentRouter } from './src/services/IntentRouter'

console.log(IntentRouter.parse('book haircut'))
console.log(IntentRouter.parse('cancel appointment'))
console.log(IntentRouter.parse('group booking for 3'))
console.log(IntentRouter.parse('yes'))
