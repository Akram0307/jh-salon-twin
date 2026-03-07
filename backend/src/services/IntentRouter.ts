export type Intent =
  | 'BOOK_APPOINTMENT'
  | 'ADD_SERVICE'
  | 'GROUP_BOOKING'
  | 'RESCHEDULE'
  | 'CANCEL'
  | 'WAITLIST_REPLY'
  | 'GENERAL_QUERY'

export class IntentRouter {

  static parse(message: string): Intent {

    const msg = message.toLowerCase().trim()

    if (/^\d+$/.test(msg)) return 'BOOK_APPOINTMENT'

    if (msg === 'yes' || msg === 'y') return 'WAITLIST_REPLY'
    if (msg === 'no' || msg === 'n') return 'WAITLIST_REPLY'

    if (msg.includes('book')) return 'BOOK_APPOINTMENT'

    if (msg.includes('add') || msg.includes('extra')) return 'ADD_SERVICE'

    if (msg.includes('group') || msg.includes('family')) return 'GROUP_BOOKING'

    if (msg.includes('reschedule') || msg.includes('change time')) return 'RESCHEDULE'

    if (msg.includes('cancel')) return 'CANCEL'

    return 'GENERAL_QUERY'
  }
}
