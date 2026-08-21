import { getStore } from '@netlify/blobs';

export default async (req) => {
  const password = req.headers.get('x-admin-password') || '';
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const store = getStore('pledges');
  const { blobs } = await store.list();
  const records = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));
  const pledges = records.filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return new Response(JSON.stringify({ pledges }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
