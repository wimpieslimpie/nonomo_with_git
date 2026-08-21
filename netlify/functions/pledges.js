import { getStore } from '@netlify/blobs';

function maskName(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Someone';
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return `${first} ${lastInitial}.`;
}

function maskEmail(email) {
  const at = String(email).indexOf('@');
  if (at < 1) return '•••';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const visible = local.slice(0, 2);
  const dots = '•'.repeat(Math.max(3, local.length - visible.length));
  return `${visible}${dots}@${domain}`;
}

export default async () => {
  const store = getStore('pledges');
  const { blobs } = await store.list();
  const records = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));

  const pledges = records
    .filter(Boolean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((r) => ({
      name: maskName(r.name),
      location: r.location,
      notes: r.notes,
      email: maskEmail(r.email),
      createdAt: r.createdAt,
    }));

  return new Response(JSON.stringify({ pledges, count: pledges.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
  });
};
