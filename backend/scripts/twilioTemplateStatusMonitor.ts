import fetch from 'node-fetch';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

if (!ACCOUNT_SID || !AUTH_TOKEN) {
  console.error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
  process.exit(1);
}

const auth = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');

async function getTemplates() {
  const res = await fetch('https://content.twilio.com/v1/Content?PageSize=100', {
    headers: {
      Authorization: `Basic ${auth}`
    }
  });

  const data: any = await res.json();
  return data.contents || [];
}

async function getApprovalStatus(sid: string) {
  const res = await fetch(`https://content.twilio.com/v1/Content/${sid}/ApprovalRequests`, {
    headers: {
      Authorization: `Basic ${auth}`
    }
  });

  const data: any = await res.json();

  if (!data.approval_requests || data.approval_requests.length === 0) {
    return 'NOT_SUBMITTED';
  }

  const whatsapp = data.approval_requests.find((r: any) => r.channel === 'whatsapp');

  if (!whatsapp) return 'UNKNOWN';

  return whatsapp.status || 'UNKNOWN';
}

async function run() {
  const templates = await getTemplates();

  console.log('SalonOS WhatsApp Template Status Monitor');
  console.log('---------------------------------------');

  for (const t of templates) {
    const status = await getApprovalStatus(t.sid);

    console.log(`${t.friendly_name} | ${t.sid} | ${status}`);
  }
}

run();
