'use strict';

/* ============================================================
   TANDA — rotating savings club ledger.

   One round (ronda) per member: everyone pays the share, one
   person takes the pot, repeat until everyone has held it.
   Payout order is either fixed by agreement, or set by posteo
   (members bid the discount they'll accept; biggest discount
   goes first, the last member collects the leftovers).
   ============================================================ */

const STORE_KEY = 'tanda.club.v1';
const BACKUP_APP = 'tanda-ledger';
const FREQ_PHRASE = { 7:'every week', 14:'every 2 weeks', 15:'twice a month', 30:'every month' };
const FREQ_LABEL  = { 7:'Weekly', 14:'Every 2 weeks', 15:'Twice a month', 30:'Monthly' };

let S = null;

/* ---------------------------------------------------------
   Helpers
   --------------------------------------------------------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
));

const TODAY = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseISO = (s) => new Date(`${s}T00:00:00`);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dayDiff = (a, b) => Math.round((b - a) / 86400000);

const fmtDay  = (d) => d.toLocaleDateString(undefined, { weekday:'short', day:'numeric', month:'short' });
const fmtDate = (d) => d.toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' });
const fmtShort = (d) => d.toLocaleDateString(undefined, { day:'numeric', month:'short' });

const money = (n) => `${S.currency || '$'}${Math.round(Math.abs(n)).toLocaleString()}`;
const signed = (n) => `${n < 0 ? '−' : '+'}${money(n)}`;

let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

/* ---------------------------------------------------------
   Model
   --------------------------------------------------------- */
function blankClub() {
  return {
    name: 'New tanda',
    currency: '$',
    share: 500,
    freqDays: 7,
    start: iso(TODAY),
    commType: 'none',
    commValue: 0,
    orderMode: 'fixed',
    members: [
      { id: 'm1', name: 'Member 1', bid: 0 },
      { id: 'm2', name: 'Member 2', bid: 0 }
    ],
    paid: {},
    payouts: {}
  };
}

function demoClub() {
  const names = ['Lupita', 'Don Beto', 'Maricruz', 'Chuy', 'Verónica', 'Rodolfo', 'Cuca', 'Tío Nacho'];
  const members = names.map((n, i) => ({ id: 'm' + (i + 1), name: n, bid: 0 }));
  const paid = {};
  members.forEach((m) => { [0,1,2].forEach((r) => { paid[`${m.id}:${r}`] = true; }); });
  ['m1','m2','m3','m4','m5'].forEach((id) => { paid[`${id}:3`] = true; });
  return Object.assign(blankClub(), {
    name: 'Tanda de la Zarza',
    share: 1200,
    start: iso(addDays(TODAY, -22)),
    members,
    paid,
    payouts: { 0: true, 1: true, 2: true }
  });
}

/* Bring anything — a saved club, a backup file, a half-edited
   JSON blob — into a shape the rest of the app can trust.
   Returns null when it isn't recognisably a ledger club. */
function sanitizeClub(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (raw.app && raw.app !== BACKUP_APP) return null;
  const c = raw.club && typeof raw.club === 'object' ? raw.club : raw;

  const seen = new Set();
  const members = [];
  (Array.isArray(c.members) ? c.members : []).forEach((m, i) => {
    if (!m || typeof m !== 'object') return;
    const name = String(m.name == null ? '' : m.name).trim().slice(0, 24);
    if (!name) return;
    let id = typeof m.id === 'string' && m.id ? m.id : `m${i}-${Date.now().toString(36)}`;
    while (seen.has(id)) id = `${id}-${i}`;
    seen.add(id);
    members.push({ id, name, bid: Math.max(0, Math.min(40, Number(m.bid) || 0)) });
  });
  if (members.length < 2) return null;

  const startRaw = typeof c.start === 'string' ? c.start : '';
  const startDate = parseISO(startRaw);
  const start = startRaw && !isNaN(startDate.getTime()) ? startRaw : iso(TODAY);
  const commType = ['none', 'pct', 'fixed'].includes(c.commType) ? c.commType : 'none';

  const paid = {};
  if (c.paid && typeof c.paid === 'object') {
    Object.keys(c.paid).forEach((k) => {
      const [id, rStr] = k.split(':');
      const r = Number(rStr);
      if (c.paid[k] && seen.has(id) && Number.isInteger(r) && r >= 0 && r < members.length) paid[k] = true;
    });
  }
  const payouts = {};
  if (c.payouts && typeof c.payouts === 'object') {
    Object.keys(c.payouts).forEach((k) => {
      const r = Number(k);
      if (!Number.isInteger(r) || r < 0 || r >= members.length || !c.payouts[k]) return;
      const raw = c.payouts[k];
      if (raw === true) { payouts[r] = true; return; }
      const v = Number(raw);
      // A number is the amount that left the room; anything
      // unparseable still counts as delivered, at the going rate.
      payouts[r] = Number.isFinite(v) && v > 0 ? v : true;
    });
  }

  return {
    name: String(c.name || '').trim().slice(0, 48) || 'New tanda',
    currency: String(c.currency == null ? '' : c.currency).trim().slice(0, 6) || '$',
    share: Math.max(1, Number(c.share) || 1),
    freqDays: Math.max(1, Number(c.freqDays) || 7),
    start,
    commType,
    commValue: commType === 'none' ? 0 : Math.max(0, Number(c.commValue) || 0),
    orderMode: c.orderMode === 'posteo' ? 'posteo' : 'fixed',
    members, paid, payouts
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const club = sanitizeClub(JSON.parse(raw));
      if (club) return club;
    }
  } catch (e) { /* corrupted store — fall through to the demo */ }
  return demoClub();
}
function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* private mode */ }
}

/* Derived ------------------------------------------------- */
const rounds    = () => S.members.length;
const pot       = () => S.share * S.members.length;
const ordered   = () => {
  const arr = S.members.slice();
  if (S.orderMode === 'posteo') arr.sort((a, b) => (b.bid || 0) - (a.bid || 0));
  return arr;
};
function commission() {
  const p = pot();
  if (S.commType === 'pct')   return Math.round(p * (Number(S.commValue) || 0) / 100);
  if (S.commType === 'fixed') return Number(S.commValue) || 0;
  return 0;
}
const basePot = () => Math.max(0, pot() - commission());
const dueDate = (r) => addDays(parseISO(S.start), r * (Number(S.freqDays) || 7));
const isPaid  = (id, r) => !!S.paid[`${id}:${r}`];
const paidOut = (r) => !!S.payouts[r];
const recipientOf = (r) => ordered()[r];
const collectedCount = (r) => S.members.filter((m) => isPaid(m.id, r)).length;
const currentRound = () => { for (let r = 0; r < rounds(); r++) if (!paidOut(r)) return r; return null; };

/* What the recipient of round r actually collects. In a posteo
   the first N−1 accept their bid discount; the last member —
   who waited — collects the full pot plus every discount left. */
function payoutFor(r) {
  const ord = ordered();
  const base = basePot();
  if (S.orderMode !== 'posteo') return base;
  if (r < ord.length - 1) return Math.round(base * (1 - (ord[r].bid || 0) / 100));
  // Last place: everything that's still on the table, so the club balances to the cent.
  let others = 0;
  for (let k = 0; k < ord.length - 1; k++) {
    others += Math.round(base * (1 - (ord[k].bid || 0) / 100));
  }
  return base * ord.length - others;
}
function surplusForLast() {
  if (S.orderMode !== 'posteo') return 0;
  const ord = ordered();
  let s = 0;
  for (let k = 0; k < ord.length - 1; k++) s += basePot() * ((ord[k].bid || 0) / 100);
  return Math.round(s);
}

/* A pot that has left the room is recorded at the amount it left at —
   later edits to bids or the cut never rewrite the history. */
function recordedPayout(r) {
  const v = S.payouts[r];
  if (v === true || v === null || v === undefined) return payoutFor(r);
  return Number(v) || payoutFor(r);
}

function memberStats(m) {
  const paid = nIn(m.id);
  const myRound = ordered().findIndex((x) => x.id === m.id);
  const out = paidOut(myRound) ? recordedPayout(myRound) : 0;
  const contributed = paid * S.share;
  return { paid, contributed, out, net: out - contributed };
}
function nIn(id) {
  let n = 0;
  for (let r = 0; r < rounds(); r++) if (isPaid(id, r)) n++;
  return n;
}

/* ---------------------------------------------------------
   Notes — the standing advice for this club
   --------------------------------------------------------- */
function buildNotes() {
  const notes = [];
  const N = rounds();
  const r = currentRound();

  if (r === null) {
    const circulated = S.members.reduce((sum, m) => sum + memberStats(m).out, 0);
    notes.push({ level: 'ok', text: `Tanda closed — all ${N} members held the pot. ${money(circulated)} changed hands on trust alone.` });
    return notes;
  }

  const due = dueDate(r);
  const got = collectedCount(r);
  const missing = S.members.filter((m) => !isPaid(m.id, r));
  const late = missing.filter((m) => dayDiff(due, TODAY) > 0);

  if (got === N) {
    notes.push({ level: 'ok', text: `All ${N} shares are in for round ${r + 1} — hand <b>la caja</b> to <b>${esc(recipientOf(r).name)}</b>.` });
  } else if (late.length) {
    notes.push({
      level: 'warn',
      text: `Round ${r + 1} was due ${fmtDay(due)} — <b>${late.map((m) => esc(m.name)).join(', ')}</b> ${late.length === 1 ? 'has' : 'have'}n't paid.`
    });
  } else {
    const days = dayDiff(TODAY, due);
    notes.push({
      level: 'info',
      text: days > 0
        ? `Round ${r + 1} is due in ${days} day${days === 1 ? '' : 's'} (${fmtDay(due)}) — ${N - got} share${N - got === 1 ? '' : 's'} still out.`
        : `Round ${r + 1} was due ${fmtDay(due)} — collecting.`
    });
  }

  for (let i = 0; i < r; i++) {
    if (collectedCount(i) < N) {
      notes.push({ level: 'err', text: `Round ${i + 1} was paid out with ${N - collectedCount(i)} share${N - collectedCount(i) === 1 ? '' : 's'} missing from the record.` });
      break;
    }
  }

  const takenAlready = ordered().slice(0, r);
  const stillOwing = takenAlready.filter((m) => nIn(m.id) < N);
  if (stillOwing.length === 1) {
    notes.push({ level: 'info', text: `<b>${esc(stillOwing[0].name)}</b> already took the pot — and still owes a share every round until the end.` });
  } else if (stillOwing.length > 1) {
    notes.push({ level: 'info', text: `<b>${esc(stillOwing[0].name)}</b> and ${stillOwing.length - 1} others already took the pot — and they still owe a share every round until the end.` });
  }

  if (S.orderMode === 'posteo') {
    notes.push({ level: 'info', text: `<b>Posteo</b> on: discounts are taken off the first payouts and piled onto the last place — which is worth ${money(surplusForLast())} extra.` });
  } else {
    const next = recipientOf(r);
    notes.push({ level: 'info', text: `Next pot goes to <b>${esc(next.name)}</b> — round ${r + 1} of ${N}, by agreement.` });
  }

  const totalComm = commission() * N;
  if (totalComm > 0) notes.push({ level: 'warn', text: `Organizer's cut is ${money(commission())} a round — ${money(totalComm)} across the whole tanda.` });

  // Only counts against someone when the round is actually past due.
  let missed = 0;
  S.members.forEach((m) => {
    let late = false;
    for (let i = 0; i <= r && !late; i++) {
      if (dayDiff(dueDate(i), TODAY) > 0 && !isPaid(m.id, i)) late = true;
    }
    if (late) missed++;
  });
  if (missed > 0) {
    notes.push({ level: 'warn', text: `${missed} member${missed === 1 ? ' has' : 's have'} missed at least one round in the record.` });
  }

  const startDays = dayDiff(TODAY, parseISO(S.start));
  if (startDays > 0) notes.push({ level: 'info', text: `First round is due ${fmtDate(parseISO(S.start))} — ${startDays} day${startDays === 1 ? '' : 's'} out.` });

  return notes;
}

/* ---------------------------------------------------------
   Render — header
   --------------------------------------------------------- */
function renderHeader() {
  const N = rounds();
  const r = currentRound();
  $('#clubName').textContent = S.name;
  $('#clubMeta').innerHTML = [
    `<b>${money(S.share)}</b> × <b>${N}</b> members`,
    `pot <b>${money(pot())}</b> a round`,
    FREQ_PHRASE[S.freqDays] || `every ${S.freqDays} days`,
    `started ${fmtDate(parseISO(S.start))}`
  ].join(' <span class="sep">·</span> ');

  const pill = $('#statusPill');
  const line = $('#statusLine');
  const sub  = $('#statusSub');
  pill.className = 'status-pill';

  if (r === null) {
    pill.textContent = 'Complete'; pill.classList.add('done');
    line.textContent = 'Tanda closed';
    sub.textContent = `${N} of ${N} pots delivered · ${money(S.members.reduce((s, m) => s + memberStats(m).out, 0))} circulated`;
    $('#progressFill').style.width = '100%';
    $('#statusSub').style.display = '';
    return;
  }

  const due = dueDate(r);
  const got = collectedCount(r);
  const complete = got === N;
  const overdue = dayDiff(due, TODAY) > 0 && !complete;

  pill.textContent = complete ? 'Ready to pay out' : overdue ? 'Overdue' : 'Collecting';
  if (complete) pill.classList.add('ready');
  else if (overdue) pill.classList.add('warn');
  line.textContent = `Round ${r + 1} of ${N} · due ${fmtDay(due)}`;

  const missing = S.members.filter((m) => !isPaid(m.id, r));
  sub.textContent = complete
    ? `${got}/${N} in — ${money(pot())} ready for ${recipientOf(r).name}`
    : overdue
      ? `${got}/${N} in · ${missing.map((m) => m.name).join(', ')} outstanding`
      : `${got}/${N} paid · ${money(got * S.share)} of ${money(pot())} in the pot`;

  const paidDone = Object.keys(S.payouts).filter((k) => S.payouts[k]).length;
  $('#progressFill').style.width = `${Math.min(100, ((paidDone + got / N) / N) * 100)}%`;
}

/* ---------------------------------------------------------
   Render — the libreta (round matrix)
   --------------------------------------------------------- */
function renderMatrix() {
  const N = rounds();
  const ord = ordered();
  const r = currentRound();

  let head = '<tr><th class="col-name">Number / member</th>';
  for (let i = 0; i < N; i++) {
    const due = dueDate(i);
    const isDone = paidOut(i);
    const isLate = !isDone && dayDiff(due, TODAY) > 0 && collectedCount(i) < N;
    const stamp = isDone
      ? `<button class="th-stamp" data-undo="${i}" title="Reopen round ${i + 1}">pagado</button>`
      : '';
    head += `<th class="${isDone ? 'is-done ' : ''}${i === r ? 'is-current ' : ''}${isLate ? 'is-late' : ''}">
      <div class="th-round"><b>R${i + 1}</b><span>${fmtShort(due)}</span>${stamp}</div>
    </th>`;
  }
  head += '</tr>';

  let body = '';
  ord.forEach((m, ri) => {
    const bidChip = S.orderMode === 'posteo' && m.bid > 0 ? `<span class="name-bid">−${m.bid}%</span>` : '';
    body += `<tr>
      <th title="${esc(m.name)}"><span class="name-order">${ri + 1}</span>${esc(m.name)}${bidChip}</th>`;
    for (let i = 0; i < N; i++) {
      const due = dueDate(i);
      const paid = isPaid(m.id, i);
      const late = !paid && dayDiff(due, TODAY) > 0;
      const future = !paid && dayDiff(TODAY, due) > 0;
      const isMine = ri === i;
      const cls = ['cell', paid ? 'is-paid' : '', late ? 'is-late' : '', future ? 'is-future' : '', isMine ? 'is-recipient' : ''].filter(Boolean).join(' ');
      body += `<td><button class="${cls}" data-toggle="${m.id}:${i}"
        title="${esc(m.name)} · round ${i + 1} · due ${fmtShort(due)}"
        aria-pressed="${paid}"><span class="cell-box">${paid ? '✓' : ''}</span></button></td>`;
    }
    body += '</tr>';
  });

  let foot = '<tr><th>in the pot</th>';
  for (let i = 0; i < N; i++) {
    const got = collectedCount(i);
    const full = got === N;
    const pastDue = dayDiff(dueDate(i), TODAY) > 0;
    foot += `<td class="${full ? 'full' : pastDue ? 'partial' : ''}">${money(got * S.share)}</td>`;
  }
  foot += '</tr>';

  $('#matrix').innerHTML = `
    <thead>${head}</thead>
    <tbody>${body}</tbody>
    <tfoot>${foot}</tfoot>`;
}

/* ---------------------------------------------------------
   Render — this round
   --------------------------------------------------------- */
function renderRoundPanel() {
  const N = rounds();
  const r = currentRound();
  const badge = $('#roundBadge');

  if (r === null) {
    badge.textContent = 'closed';
    badge.className = 'badge brass';
    $('#roundBody').innerHTML = `<p class="round-meta">Every member has held the pot. Start a new tanda when the group is ready.</p>`;
    return;
  }

  const due = dueDate(r);
  const got = collectedCount(r);
  const complete = got === N;
  const rec = recipientOf(r);
  badge.textContent = `${got}/${N}`;
  badge.className = `badge${complete ? ' brass' : got < N && dayDiff(due, TODAY) > 0 ? ' warn' : ''}`;

  const rows = ordered().map((m) => {
    const paid = isPaid(m.id, r);
    const late = !paid && dayDiff(due, TODAY) > 0;
    const flag = paid ? '<span class="payer-flag ok">paid</span>'
      : late ? '<span class="payer-flag">late</span>'
      : '<span class="payer-flag wait">waiting</span>';
    return `<li>
      <button class="payer-btn ${paid ? 'on' : ''}" data-toggle="${m.id}:${r}"
        aria-pressed="${paid}" title="Mark ${esc(m.name)} as paid">${paid ? '✓' : ''}</button>
      <span class="payer-name">${esc(m.name)}</span>
      ${flag}
      <span class="payer-amt">${money(S.share)}</span>
    </li>`;
  }).join('');

  const body = paidOut(r)
    ? `<div class="payout-done">
         <span>✓ ${money(recordedPayout(r))} delivered to <b>${esc(rec.name)}</b></span>
         <button data-undo="${r}">undo</button>
       </div>`
    : `<button class="payout-btn" id="btnPayout" ${complete ? '' : 'disabled'}>
         Hand over la caja → ${esc(rec.name)} · ${money(payoutFor(r))}
       </button>`;

  $('#roundBody').innerHTML = `
    <p class="round-meta">Round <b>${r + 1}</b> of <b>${N}</b> · due <b>${fmtDay(due)}</b> · pot <b>${money(pot())}</b>${commission() ? ` · cut ${money(commission())}` : ''}</p>
    <ul class="payers">${rows}</ul>
    ${body}
    ${!complete ? '<p class="mode-hint">The pot can only leave once every share is in — that rule is the whole product.</p>' : ''}`;
}

/* ---------------------------------------------------------
   Render — payout order
   --------------------------------------------------------- */
function renderOrderPanel() {
  const N = rounds();
  const ord = ordered();
  const posteo = S.orderMode === 'posteo';

  const rows = ord.map((m, i) => {
    const amt = payoutFor(i);
    const bid = posteo && m.bid > 0 ? `<span class="order-bid">−${m.bid}%</span>` : '';
    return `<li>
      <span class="order-no">${i + 1}</span>
      <span class="order-name">${esc(m.name)}</span>
      ${bid}
      <span class="order-amt">${money(amt)}</span>
    </li>`;
  }).join('');

  $('#orderBody').innerHTML = `
    <div class="order-mode">
      <button class="mode-btn ${posteo ? '' : 'on'}" data-mode="fixed">By agreement</button>
      <button class="mode-btn ${posteo ? 'on' : ''}" data-mode="posteo">Posteo</button>
    </div>
    <ol class="order-list" start="1">${rows}</ol>
    <p class="mode-hint">${posteo
      ? `Members bid a discount to be paid sooner. Big bids go first; the last place waits — and collects ${money(basePot() + surplusForLast())} instead of ${money(basePot())}.`
      : `Everyone collects the same ${money(basePot())}. Switch to <b>posteo</b> if the group wants to bid for position.`}</p>`;
}

/* ---------------------------------------------------------
   Render — ledger
   --------------------------------------------------------- */
function renderLedger() {
  const N = rounds();
  const ord = ordered();
  let totalIn = 0, totalOut = 0;
  S.members.forEach((m) => { const s = memberStats(m); totalIn += s.contributed; totalOut += s.out; });

  const rows = ord.map((m, i) => {
    const s = memberStats(m);
    return `<div class="ledger-row" title="in ${money(s.contributed)} · out ${money(s.out)}">
      <span class="ledger-k">${i + 1}. ${esc(m.name)}</span>
      <span class="ledger-v ${s.net > 0 ? 'pos' : s.net < 0 ? 'neg' : ''}">${s.net === 0 ? '±0' : signed(s.net)}</span>
    </div>`;
  }).join('');

  const rate = N > 0 ? Math.round((S.members.reduce((n, m) => n + nIn(m.id), 0) / (N * N)) * 100) : 0;

  $('#ledgerBody').innerHTML = `
    <div class="ledger-head"><span>member · net so far</span><span>in − out</span></div>
    ${rows}
    <div class="ledger-row"><span class="ledger-k">Collected</span><span class="ledger-v">${money(totalIn)}</span></div>
    <div class="ledger-row"><span class="ledger-k">Paid out</span><span class="ledger-v">${money(totalOut)}</span></div>
    <div class="ledger-bar"><i class="in" style="width:${rate}%"></i><i class="out" style="width:${100 - rate}%"></i></div>
    <div class="ledger-legend">
      <span><i style="background:var(--indigo)"></i>collected ${rate}%</span>
      <span><i style="background:var(--paper-3)"></i>still to come</span>
    </div>`;
}
function roundsRemaining() {
  const r = currentRound();
  return r === null ? 0 : rounds() - r;
}

/* ---------------------------------------------------------
   Render — notes
   --------------------------------------------------------- */
function renderNotes() {
  const notes = buildNotes();
  $('#noteBadge').textContent = notes.filter((n) => n.level === 'warn' || n.level === 'err').length || '0';
  $('#noteBadge').className = `badge${notes.some((n) => n.level === 'warn' || n.level === 'err') ? ' warn' : ''}`;
  $('#notesBody').innerHTML = notes.length
    ? notes.map((n) => `<li class="${n.level}"><span class="dot"></span><span>${n.text}</span></li>`).join('')
    : '<li class="notes-empty">Nothing to flag.</li>';
}

function renderAll() {
  renderHeader();
  renderMatrix();
  renderRoundPanel();
  renderOrderPanel();
  renderLedger();
  renderNotes();
}

/* ---------------------------------------------------------
   Mutations
   --------------------------------------------------------- */
function togglePaid(key) {
  const [id, rStr] = key.split(':');
  const r = Number(rStr);
  if (paidOut(r)) { toast('Round already paid out — undo it first'); return; }
  if (S.paid[key]) delete S.paid[key]; else S.paid[key] = true;
  save();
  renderAll();
}

function payOut(r) {
  if (collectedCount(r) !== rounds()) return;
  S.payouts[r] = payoutFor(r);
  save();
  renderAll();
  toast(`${money(payoutFor(r))} → ${recipientOf(r).name}`);
}

function undoPayout(r) {
  delete S.payouts[r];
  save();
  renderAll();
  toast(`Round ${r + 1} reopened`);
}

function setMode(mode) {
  S.orderMode = mode;
  save();
  renderAll();
  toast(mode === 'posteo' ? 'Posteo on — members bid for position' : 'Order by agreement');
}

/* ---------------------------------------------------------
   Settings
   --------------------------------------------------------- */
let draft = [];

function openSettings() {
  $('#fName').value = S.name;
  $('#fCurrency').value = S.currency;
  $('#fShare').value = S.share;
  $('#fFreq').value = String(S.freqDays);
  $('#fStart').value = S.start;
  $('#fCommType').value = S.commType;
  $('#fCommValue').value = S.commValue;
  $('#fCommValue').disabled = S.commType === 'none';
  $('#fOrderMode').value = S.orderMode;
  draft = S.members.map((m) => Object.assign({}, m));
  renderDraft();
  updateOrderHint();
  $('#modal').hidden = false;
  setTimeout(() => $('#fName').focus(), 30);
}

function closeSettings() { $('#modal').hidden = true; }

function renderDraft() {
  const posteo = $('#fOrderMode').value === 'posteo';
  $('#membersList').innerHTML = `
    ${posteo ? '<div class="bid-head"><span class="b1">member</span><span class="b2">discount %</span><span class="b3">order</span></div>' : ''}
    ${draft.map((m, i) => `
      <div class="member-row" data-i="${i}">
        <input class="m-name" value="${esc(m.name)}" placeholder="Member ${i + 1}" maxlength="24">
        ${posteo ? `<input class="m-bid" type="number" min="0" max="40" step="1" value="${m.bid || 0}" title="Discount accepted to be paid earlier">` : ''}
        <div class="m-tools">
          <button class="m-btn" data-up title="Move up">↑</button>
          <button class="m-btn" data-down title="Move down">↓</button>
          <button class="m-btn danger" data-del title="Remove">✕</button>
        </div>
      </div>`).join('')}`;
}

function readDraft() {
  $$('.member-row').forEach((row, i) => {
    const name = $('.m-name', row).value.trim();
    const bidEl = $('.m-bid', row);
    if (draft[i]) {
      draft[i].name = name;
      if (bidEl) draft[i].bid = Math.max(0, Math.min(40, Number(bidEl.value) || 0));
    }
  });
}

function updateOrderHint() {
  $('#orderHint').textContent = $('#fOrderMode').value === 'posteo'
    ? 'Each member sets the discount they’ll accept to take the pot earlier. Highest discount, earliest pot; the last member gets everyone’s leftovers on top.'
    : 'The order you set here is the order the pots go out. Change it any time before the next payout.';
}

function saveSettings() {
  readDraft();
  const members = draft
    .filter((m) => m.name.trim().length)
    .map((m, i) => ({ id: m.id || 'm' + Date.now() + '-' + i, name: m.name.trim().slice(0, 24), bid: Number(m.bid) || 0 }));

  if (members.length < 2) { toast('A tanda needs at least 2 members'); return; }

  const share = Math.max(1, Number($('#fShare').value) || 1);
  const start = $('#fStart').value || iso(TODAY);
  const commType = $('#fCommType').value;
  const commValue = commType === 'none' ? 0 : Math.max(0, Number($('#fCommValue').value) || 0);

  S.name = $('#fName').value.trim() || 'New tanda';
  S.currency = $('#fCurrency').value.trim() || '$';
  S.share = share;
  S.freqDays = Number($('#fFreq').value) || 7;
  S.start = start;
  S.commType = commType;
  S.commValue = commValue;
  S.orderMode = $('#fOrderMode').value;
  S.members = members;

  // Prune anything that no longer fits the club.
  const ids = new Set(members.map((m) => m.id));
  Object.keys(S.paid).forEach((k) => {
    const [id, r] = k.split(':');
    if (!ids.has(id) || Number(r) >= members.length) delete S.paid[k];
  });
  Object.keys(S.payouts).forEach((k) => { if (Number(k) >= members.length) delete S.payouts[k]; });

  save();
  closeSettings();
  renderAll();
  toast('Club updated');
}

/* ---------------------------------------------------------
   Backup & restore — the club, as a file
   --------------------------------------------------------- */
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'club';

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const backupPayload = () => ({ app: BACKUP_APP, version: 1, exportedAt: new Date().toISOString(), club: S });

function backupClub() {
  downloadJson(`tanda-${slugify(S.name)}-${iso(TODAY)}.json`, backupPayload());
  toast(`Backup saved — ${S.members.length} members · ${Object.keys(S.paid).length} payments on record`);
}

async function restoreFromFile(file) {
  if (!file) return;
  let parsed;
  try { parsed = JSON.parse(await file.text()); }
  catch (e) { toast('That file isn’t valid JSON'); return; }

  if (parsed && parsed.app && parsed.app !== BACKUP_APP) {
    toast(parsed.app === 'tanda-milonga'
      ? 'That’s a milonga backup — restore it from the planner'
      : 'That file isn’t a Tanda ledger backup');
    return;
  }
  const club = sanitizeClub(parsed);
  if (!club) { toast('That file doesn’t look like a Tanda ledger backup'); return; }

  if (!confirm(`Replace “${S.name}” with “${club.name}” from the backup?\n\nThe club in this browser will be lost — back it up first if you want to keep it.`)) return;

  S = club;
  save();
  closeSettings();
  renderAll();
  toast(`Restored ${club.name} · ${club.members.length} members`);
}

/* ---------------------------------------------------------
   Export
   --------------------------------------------------------- */
function summaryText() {
  const N = rounds();
  const lines = [];
  lines.push(`TANDA — ${S.name}`);
  lines.push(`${money(S.share)} × ${N} members · pot ${money(pot())} a round · ${FREQ_PHRASE[S.freqDays] || 'custom rhythm'}`);
  lines.push(`Starts ${fmtDate(parseISO(S.start))} · order: ${S.orderMode === 'posteo' ? 'posteo (bidding)' : 'by agreement'}`);
  lines.push('');
  for (let r = 0; r < N; r++) {
    const got = collectedCount(r);
    const rec = recipientOf(r);
    const state = paidOut(r)
      ? `paid out — ${rec.name} got ${money(recordedPayout(r))}`
      : got === N
        ? `ready — all ${N} shares in for ${rec.name}`
        : `collecting ${got}/${N}, due ${fmtDate(dueDate(r))}`;
    lines.push(`R${r + 1} · ${fmtDate(dueDate(r))} · ${state}`);
  }
  lines.push('');
  lines.push('Ledger (net = received − contributed):');
  ordered().forEach((m, i) => {
    const s = memberStats(m);
    lines.push(`  ${String(i + 1).padStart(2)}. ${m.name.padEnd(14)} in ${money(s.contributed).padStart(9)}   out ${money(s.out).padStart(9)}   net ${s.net === 0 ? '±' + money(0) : signed(s.net)}`);
  });
  lines.push('');
  lines.push('Notes:');
  buildNotes().forEach((n) => lines.push(`  · ${n.text.replace(/<[^>]+>/g, '')}`));
  lines.push('');
  lines.push('Recorded in Tanda — nothing here moves money.');
  return lines.join('\n');
}

async function copySummary() {
  const text = summaryText();
  try {
    await navigator.clipboard.writeText(text);
    toast('Summary copied to clipboard');
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('Summary copied'); }
    catch (e2) { toast('Copy failed — select the text manually'); }
    ta.remove();
  }
}

/* ---------------------------------------------------------
   Events
   --------------------------------------------------------- */
document.addEventListener('click', (e) => {
  const t = e.target;

  const cell = t.closest('[data-toggle]');
  if (cell) { togglePaid(cell.dataset.toggle); return; }

  const payout = t.closest('#btnPayout');
  if (payout) { const r = currentRound(); if (r !== null) payOut(r); return; }

  const undo = t.closest('[data-undo]');
  if (undo) { undoPayout(Number(undo.dataset.undo)); return; }

  const mode = t.closest('[data-mode]');
  if (mode) { setMode(mode.dataset.mode); return; }

  if (t.closest('[data-close]')) { closeSettings(); return; }
});

$('#btnSettings').addEventListener('click', openSettings);
$('#btnExport').addEventListener('click', copySummary);
$('#btnBackup').addEventListener('click', backupClub);
$('#btnRestore').addEventListener('click', () => $('#restoreFile').click());
$('#restoreFile').addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  e.target.value = '';
  restoreFromFile(file);
});
$('#btnNew').addEventListener('click', () => {
  if (!confirm('Start a new club? The current one will be replaced in this browser.')) return;
  S = blankClub();
  save();
  renderAll();
  openSettings();
});

$('#btnSave').addEventListener('click', saveSettings);
$('#btnCancel').addEventListener('click', closeSettings);
$('#btnDeleteClub').addEventListener('click', () => {
  if (!confirm('Delete this club and its records from this browser?')) return;
  S = blankClub();
  save();
  closeSettings();
  renderAll();
  openSettings();
});
$('#btnAddMember').addEventListener('click', () => {
  readDraft();
  draft.push({ id: 'm' + Date.now(), name: '', bid: 0 });
  renderDraft();
  const rows = $$('.member-row');
  const last = rows[rows.length - 1];
  if (last) $('.m-name', last).focus();
});
$('#fOrderMode').addEventListener('change', () => { readDraft(); renderDraft(); updateOrderHint(); });
$('#fCommType').addEventListener('change', () => {
  $('#fCommValue').disabled = $('#fCommType').value === 'none';
  if ($('#fCommValue').disabled) $('#fCommValue').value = 0;
});

$('#membersList').addEventListener('click', (e) => {
  const row = e.target.closest('.member-row');
  if (!row) return;
  const i = Number(row.dataset.i);
  if (e.target.closest('[data-del]')) {
    readDraft();
    draft.splice(i, 1);
    renderDraft();
  } else if (e.target.closest('[data-up]') && i > 0) {
    readDraft();
    draft.splice(i - 1, 0, draft.splice(i, 1)[0]);
    renderDraft();
  } else if (e.target.closest('[data-down]') && i < draft.length - 1) {
    readDraft();
    draft.splice(i + 1, 0, draft.splice(i, 1)[0]);
    renderDraft();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#modal').hidden) closeSettings();
});

/* ---------------------------------------------------------
   Boot
   --------------------------------------------------------- */
S = load();
renderAll();
