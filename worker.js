/* ============================================================
   Tanda Worker — the shared ledger.

   Static assets answer from env.ASSETS; everything under /api/
   talks to D1. No accounts: a club id is a capability — holding
   the invite link IS membership, which is how a tanda already
   works. Writes are idempotent per cell so two phones tapping
   the libreta never overwrite each other.
   ============================================================ */

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status,
  headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
});

/* One schema, created lazily per isolate. db.exec runs the whole
   batch; CREATE IF NOT EXISTS keeps it safe to race. */
let schemaReady = null;
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS clubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT '$',
    share INTEGER NOT NULL DEFAULT 1,
    freq_days INTEGER NOT NULL DEFAULT 7,
    start TEXT NOT NULL,
    comm_type TEXT NOT NULL DEFAULT 'none',
    comm_value INTEGER NOT NULL DEFAULT 0,
    order_mode TEXT NOT NULL DEFAULT 'fixed',
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS members (
    club_id TEXT NOT NULL,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    bid INTEGER NOT NULL DEFAULT 0,
    pos INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (club_id, id)
  )`,
  `CREATE TABLE IF NOT EXISTS paid (
    club_id TEXT NOT NULL,
    member_id TEXT NOT NULL,
    round INTEGER NOT NULL,
    PRIMARY KEY (club_id, member_id, round)
  )`,
  `CREATE TABLE IF NOT EXISTS payouts (
    club_id TEXT NOT NULL,
    round INTEGER NOT NULL,
    amount INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (club_id, round)
  )`
];
function ensureSchema(db) {
  if (!schemaReady) {
    schemaReady = db.batch(SCHEMA.map((sql) => db.prepare(sql)))
      .catch((e) => { schemaReady = null; throw e; });
  }
  return schemaReady;
}

/* ---------------------------------------------------------
   Validation — everything crossing the wire gets trimmed here.
   --------------------------------------------------------- */
const CLUB_ID = /^[A-Za-z0-9-]{10,64}$/;
const MEMBER_ID = /^[A-Za-z0-9_-]{1,32}$/;

const cleanName = (s, max) => String(s == null ? '' : s).trim().slice(0, max);
const cleanInt = (v, min, max, dflt) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : dflt;
};

async function readBody(request) {
  const cl = Number(request.headers.get('content-length') || 0);
  if (cl > 65536) return null;
  try {
    const b = await request.json();
    return b && typeof b === 'object' && !Array.isArray(b) ? b : null;
  } catch (e) { return null; }
}

/* ---------------------------------------------------------
   Read a club back in the exact shape app.js speaks.
   --------------------------------------------------------- */
async function clubState(env, id) {
  const club = await env.DB.prepare(
    'SELECT id, name, currency, share, freq_days AS freqDays, start, comm_type AS commType, comm_value AS commValue, order_mode AS orderMode FROM clubs WHERE id = ?'
  ).bind(id).first();
  if (!club) return null;

  const mem = await env.DB.prepare('SELECT id, name, bid FROM members WHERE club_id = ? ORDER BY pos').bind(id).all();
  const pay = await env.DB.prepare('SELECT member_id, round FROM paid WHERE club_id = ?').bind(id).all();
  const out = await env.DB.prepare('SELECT round, amount FROM payouts WHERE club_id = ?').bind(id).all();

  const paid = {};
  pay.results.forEach((r) => { paid[`${r.member_id}:${r.round}`] = true; });
  const payouts = {};
  out.results.forEach((r) => { payouts[r.round] = r.amount; });

  return {
    id,
    name: club.name,
    currency: club.currency,
    share: club.share,
    freqDays: club.freqDays,
    start: club.start,
    commType: club.commType,
    commValue: club.commValue,
    orderMode: club.orderMode,
    members: mem.results.map((m) => ({ id: m.id, name: m.name, bid: m.bid })),
    paid,
    payouts
  };
}

/* Resolve the member list once so ids stay consistent across the
   INSERT statements, the keep-set for pruning, and paid seeding. */
function normalizeMembers(raw) {
  const out = [];
  (Array.isArray(raw) ? raw : []).slice(0, 60).forEach((m, i) => {
    if (!m || typeof m !== 'object') return;
    const name = cleanName(m.name, 24);
    if (!name) return;
    const id = typeof m.id === 'string' && MEMBER_ID.test(m.id) ? m.id : `u${i}-${Date.now().toString(36)}`;
    out.push({ id, name, bid: cleanInt(m.bid, 0, 40, 0) });
  });
  return out;
}

/* Settings as rows — shared by create and the settings push. */
function settingsStatements(db, id, s, members) {
  const stmts = [
    db.prepare('UPDATE clubs SET name=?, currency=?, share=?, freq_days=?, start=?, comm_type=?, comm_value=?, order_mode=? WHERE id=?')
      .bind(cleanName(s.name, 48) || 'Tanda', cleanName(s.currency, 6) || '$',
            cleanInt(s.share, 1, 1e9, 1), cleanInt(s.freqDays, 1, 365, 7),
            cleanName(s.start, 10), ['none', 'pct', 'fixed'].includes(s.commType) ? s.commType : 'none',
            cleanInt(s.commValue, 0, 1e9, 0), s.orderMode === 'posteo' ? 'posteo' : 'fixed', id)
  ];
  members.forEach((m, i) => {
    stmts.push(db.prepare('INSERT INTO members (club_id, id, name, bid, pos) VALUES (?, ?, ?, ?, ?) ON CONFLICT(club_id, id) DO UPDATE SET name=excluded.name, bid=excluded.bid, pos=excluded.pos')
      .bind(id, m.id, m.name, m.bid, i));
  });
  return stmts;
}

/* ---------------------------------------------------------
   Router
   --------------------------------------------------------- */
async function handleApi(request, env, url) {
  await ensureSchema(env.DB);
  const parts = url.pathname.split('/').filter(Boolean);   // ['api','clubs',id,…]
  const id = parts[2] || '';
  const action = parts[3] || '';
  const clubOk = CLUB_ID.test(id);

  // POST /api/clubs — create, seeded with the organizer's current club
  if (parts[1] === 'clubs' && !action && request.method === 'POST') {
    const b = await readBody(request);
    const s = b && (b.club || b);
    const members = s ? normalizeMembers(s.members) : [];
    if (!s || members.length < 2) return json({ error: 'need 2-60 members' }, 400);

    const newId = crypto.randomUUID();
    const stmts = [
      env.DB.prepare('INSERT INTO clubs (id, name, currency, share, freq_days, start, comm_type, comm_value, order_mode, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(newId, cleanName(s.name, 48) || 'Tanda', cleanName(s.currency, 6) || '$',
              cleanInt(s.share, 1, 1e9, 1), cleanInt(s.freqDays, 1, 365, 7),
              cleanName(s.start, 10) || new Date().toISOString().slice(0, 10),
              ['none', 'pct', 'fixed'].includes(s.commType) ? s.commType : 'none',
              cleanInt(s.commValue, 0, 1e9, 0), s.orderMode === 'posteo' ? 'posteo' : 'fixed',
              Date.now())
    ];
    stmts.push(...settingsStatements(env.DB, newId, { ...s, start: cleanName(s.start, 10) || new Date().toISOString().slice(0, 10) }, members));

    // Seed the record: rounds already played travel with the club.
    // The paid/payouts maps ride inside the club object (or top-level
    // for direct API callers) — s covers both.
    const ids = new Set(members.map((m) => m.id));
    const seedPaid = s.paid || (b && b.paid);
    const seedPayouts = s.payouts || (b && b.payouts);
    if (seedPaid && typeof seedPaid === 'object') {
      Object.keys(seedPaid).slice(0, 5000).forEach((k) => {
        if (!seedPaid[k]) return;
        const [mid, rStr] = k.split(':');
        const r = cleanInt(rStr, -1, 999, -1);
        if (ids.has(mid) && r >= 0) stmts.push(env.DB.prepare('INSERT OR IGNORE INTO paid (club_id, member_id, round) VALUES (?, ?, ?)').bind(newId, mid, r));
      });
    }
    if (seedPayouts && typeof seedPayouts === 'object') {
      Object.keys(seedPayouts).slice(0, 999).forEach((k) => {
        const r = cleanInt(k, -1, 998, -1);
        if (r >= 0 && seedPayouts[k]) stmts.push(env.DB.prepare('INSERT OR IGNORE INTO payouts (club_id, round, amount) VALUES (?, ?, ?)').bind(newId, r, cleanInt(seedPayouts[k], 0, 1e12, 0)));
      });
    }
    await env.DB.batch(stmts);
    return json({ id: newId, club: await clubState(env, newId) }, 201);
  }

  if (!clubOk) return json({ error: 'bad club id' }, 404);
  const exists = await env.DB.prepare('SELECT 1 FROM clubs WHERE id = ?').bind(id).first();
  if (!exists) return json({ error: 'no such club' }, 404);

  // GET /api/clubs/:id — the whole ledger
  if (!action && request.method === 'GET') return json({ club: await clubState(env, id) });

  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  const b = await readBody(request);
  if (!b) return json({ error: 'bad body' }, 400);

  // POST /api/clubs/:id/members — a member joins with their name
  if (action === 'members') {
    const name = cleanName(b.name, 24);
    if (!name) return json({ error: 'name required' }, 400);
    const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM members WHERE club_id = ?').bind(id).first();
    if (count.n >= 60) return json({ error: 'club full' }, 400);
    const mid = `u${crypto.randomUUID().slice(0, 8)}`;
    await env.DB.prepare('INSERT INTO members (club_id, id, name, bid, pos) VALUES (?, ?, ?, 0, (SELECT COALESCE(MAX(pos), -1) + 1 FROM members WHERE club_id = ?))')
      .bind(id, mid, name, id).run();
    return json({ memberId: mid, club: await clubState(env, id) }, 201);
  }

  // POST /api/clubs/:id/paid — one cell, toggle. INSERT OR IGNORE /
  // DELETE make a repeated tap harmless and two phones safe.
  if (action === 'paid') {
    const mid = String(b.memberId || '');
    const r = cleanInt(b.round, -1, 999, -1);
    if (!MEMBER_ID.test(mid) || r < 0) return json({ error: 'bad cell' }, 400);
    const member = await env.DB.prepare('SELECT 1 FROM members WHERE club_id = ? AND id = ?').bind(id, mid).first();
    if (!member) return json({ error: 'no such member' }, 404);
    if (b.paid) await env.DB.prepare('INSERT OR IGNORE INTO paid (club_id, member_id, round) VALUES (?, ?, ?)').bind(id, mid, r).run();
    else await env.DB.prepare('DELETE FROM paid WHERE club_id = ? AND member_id = ? AND round = ?').bind(id, mid, r).run();
    return json({ ok: true });
  }

  // POST /api/clubs/:id/payout — la caja leaves (or comes back)
  if (action === 'payout') {
    const r = cleanInt(b.round, -1, 999, -1);
    if (r < 0) return json({ error: 'bad round' }, 400);
    if (b.paid) await env.DB.prepare('INSERT OR REPLACE INTO payouts (club_id, round, amount) VALUES (?, ?, ?)').bind(id, r, cleanInt(b.amount, 0, 1e12, 0)).run();
    else await env.DB.prepare('DELETE FROM payouts WHERE club_id = ? AND round = ?').bind(id, r).run();
    return json({ ok: true });
  }

  // POST /api/clubs/:id/settings — rules and members, last writer wins
  if (action === 'settings') {
    const members = normalizeMembers(b.members);
    if (members.length < 2) return json({ error: 'need 2-60 members' }, 400);
    const stmts = settingsStatements(env.DB, id, b, members);
    stmts.push(env.DB.prepare(`DELETE FROM paid WHERE club_id = ? AND member_id NOT IN (${members.map(() => '?').join(',')})`)
      .bind(id, ...members.map((m) => m.id)));
    await env.DB.batch(stmts);
    return json({ ok: true });
  }

  return json({ error: 'unknown route' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env, url);
      } catch (e) {
        console.log('api error', url.pathname, e && e.message, e && e.stack);
        return json({ error: 'server error' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
