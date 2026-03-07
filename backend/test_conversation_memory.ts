import { ConversationContextStore } from './src/services/ConversationContextStore'

async function run(){

 await ConversationContextStore.updateContext('11111111-1111-1111-1111-111111111111',{
  salon_id:'22222222-2222-2222-2222-222222222222',
  last_intent:'BOOK_APPOINTMENT',
  pending_action:'BOOK_APPOINTMENT',
  conversation_state:'RETURNING_CLIENT'
 })

 const ctx = await ConversationContextStore.getContext('11111111-1111-1111-1111-111111111111')

 console.log(ctx)

}

run()
