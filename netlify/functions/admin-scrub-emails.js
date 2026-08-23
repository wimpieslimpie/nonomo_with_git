import { getStore } from '@netlify/blobs';

function maskEmail(email) {
  const at = email.indexOf('@');
  if (at < 1) return '•••';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const visible = local.slice(0, 2);
  const dots = '•'.repeat(Math.max(3, local.length - visible.length));
  return `${visible}${dots}@${domain}`;
}

// One-time cleanup: masks the full plaintext email on any pledge saved before
// submit.js started masking at write time. Safe to call repeatedly — already
// masked records (containing a bullet) are left untouched.
export default async (req) => {
  const password = req.headers.get('x-admin-password') || '';
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const store = getStore('pledges');
  const { blobs } = await store.list();
  const records = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));

  let scrubbed = 0;
  for (const record of records) {
    if (!record || !record.email || record.email.includes('•')) continue;
    await store.setJSON(record.id, { ...record, email: maskEmail(record.email) });
    scrubbed++;
  }

  return new Response(JSON.stringify({ ok: true, scrubbed, total: records.filter(Boolean).length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
