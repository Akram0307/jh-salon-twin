import fetch from 'node-fetch'
import { whatsappTemplates } from '../src/config/whatsappTemplates'

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN

if (!ACCOUNT_SID || !AUTH_TOKEN) {
  console.error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN')
  process.exit(1)
}

const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64')

function buildExample(template:any) {
  const matches = template.body.match(/{{\d+}}/g) || []

  if (matches.length === 0) return undefined

  const vars = matches.map((_:any, i:number) => `example${i+1}`)

  return {
    body_text: [vars]
  }
}

async function createTemplate(template:any) {

  const example = buildExample(template)

  const payload:any = {
    friendly_name: template.name,
    language: 'en',
    types: {
      "twilio/text": {
        body: template.body
      },
      "whatsapp/text": {
        body: template.body,
        example: example
      }
    }
  }

  const res = await fetch('https://content.twilio.com/v1/Content', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const data:any = await res.json()

  if (!data.sid) {
    console.error('FAILED:', template.name)
    console.error(JSON.stringify(data, null, 2))
    return null
  }

  console.log('Created:', template.name, 'SID:', data.sid)
  return data.sid
}

async function submitForApproval(contentSid:string, category:string) {

  const payload = {
    name: 'whatsapp',
    category: category,
    submit_to_meta: true
  }

  const res = await fetch(`https://content.twilio.com/v1/Content/${contentSid}/ApprovalRequests/whatsapp`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  const data:any = await res.json()

  console.log('Submitted for approval:', contentSid)
  console.log(JSON.stringify(data, null, 2))
}

async function run() {
  for (const template of whatsappTemplates) {

    const sid = await createTemplate(template)

    if (sid) {
      const category = template.category === 'marketing' ? 'MARKETING' : 'UTILITY'
      await submitForApproval(sid, category)
    }

  }
}

run()
