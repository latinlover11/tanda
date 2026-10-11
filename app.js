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
const FREQ_PHRASE = {
  7:  { en: 'every week',    es: 'cada semana' },
  14: { en: 'every 2 weeks', es: 'cada 2 semanas' },
  15: { en: 'twice a month', es: 'dos veces al mes' },
  30: { en: 'every month',   es: 'cada mes' }
};
const FREQ_LABEL = {
  7:  { en: 'Weekly',        es: 'Semanal' },
  14: { en: 'Every 2 weeks', es: 'Cada 2 semanas' },
  15: { en: 'Twice a month', es: 'Dos veces al mes' },
  30: { en: 'Monthly',       es: 'Mensual' }
};

/* ---------------------------------------------------------
   Language — the club reads Spanish; the page ships both.
   --------------------------------------------------------- */
const LANG_KEY = 'tanda.lang.v1';
let LANG = (() => { try { return localStorage.getItem(LANG_KEY) === 'es' ? 'es' : 'en'; } catch (e) { return 'en'; } })();
const lp = (o) => (o && (o[LANG] || o.en)) || '';

const STRINGS = {
  /* — top bar — */
  'nav.export':     { en: '⧉ Copy summary', es: '⧉ Copiar resumen' },
  'nav.export.t':   { en: 'Copy a plain-text summary of the club', es: 'Copia un resumen de texto del club' },
  'nav.backup':     { en: '⤓ Backup', es: '⤓ Respaldo' },
  'nav.backup.t':   { en: 'Download this club as a file you can keep or move', es: 'Descarga el club como archivo para guardar o mover' },
  'nav.restore':    { en: '↥ Restore', es: '↥ Restaurar' },
  'nav.restore.t':  { en: 'Load a club from a backup file', es: 'Carga un club desde un archivo de respaldo' },
  'nav.settings':   { en: '⚙ Settings', es: '⚙ Ajustes' },
  'nav.settings.t': { en: 'Club rules, members and payout order', es: 'Reglas del club, miembros y orden de pago' },
  'nav.new':        { en: '+ New', es: '+ Nueva' },
  'nav.new.t':      { en: 'Start a different club', es: 'Empezar otro club' },
  'nav.lang.t':     { en: 'Cambiar a español', es: 'Switch to English' },
  'doc.title':      { en: 'Tanda — the rotating savings club ledger', es: 'Tanda — el libro de la tanda' },

  /* — headband — */
  'head.eyebrow':   { en: 'Rotating savings &amp; credit association', es: 'Asociación rotativa de ahorro y crédito' },
  'head.members':   { en: (v) => `<b>${v.amt}</b> × <b>${v.n}</b> members`, es: (v) => `<b>${v.amt}</b> × <b>${v.n}</b> miembros` },
  'head.pot':       { en: (v) => `pot <b>${v.amt}</b> a round`, es: (v) => `caja de <b>${v.amt}</b> por ronda` },
  'head.started':   { en: (v) => `started ${v.day}`, es: (v) => `empezó el ${v.day}` },
  'st.complete':    { en: 'Complete', es: 'Completa' },
  'st.closed':      { en: 'Tanda closed', es: 'Tanda cerrada' },
  'st.delivered':   { en: (v) => `${v.n} of ${v.n} pots delivered · ${v.amt} circulated`, es: (v) => `${v.n} de ${v.n} cajas entregadas · ${v.amt} circularon` },
  'st.ready':       { en: 'Ready to pay out', es: 'Lista para pagar' },
  'st.overdue':     { en: 'Overdue', es: 'Vencida' },
  'st.collecting':  { en: 'Collecting', es: 'Cobrando' },
  'st.round':       { en: (v) => `Round ${v.r} of ${v.n} · due ${v.day}`, es: (v) => `Ronda ${v.r} de ${v.n} · vence el ${v.day}` },
  'st.readyfor':    { en: (v) => `${v.got}/${v.n} in — ${v.amt} ready for ${v.name}`, es: (v) => `${v.got}/${v.n} listas — ${v.amt} para ${v.name}` },
  'st.outstanding': { en: (v) => `${v.got}/${v.n} in · ${v.names} outstanding`, es: (v) => `${v.got}/${v.n} · deben ${v.names}` },
  'st.paidin':      { en: (v) => `${v.got}/${v.n} paid · ${v.amt} of ${v.total} in the pot`, es: (v) => `${v.got}/${v.n} pagadas · ${v.amt} de ${v.total} en la caja` },

  /* — the libreta — */
  'sheet.title':    { en: 'La libreta', es: 'La libreta' },
  'sheet.sub':      { en: 'Tap a box when someone pays their share. The stamp marks who takes the pot.', es: 'Toca la casilla cuando alguien pague su aportación. El sello marca quién lleva la caja.' },
  'lg.paid':        { en: 'paid', es: 'pagado' },
  'lg.due':         { en: 'due', es: 'por pagar' },
  'lg.late':        { en: 'late', es: 'tarde' },
  'lg.pot':         { en: 'took the pot', es: 'llevó la caja' },
  'panel.ledger':   { en: 'Ledger', es: 'Libro' },
  'panel.ledger.n': { en: 'net = received − contributed', es: 'neto = recibido − aportado' },
  'panel.notes':    { en: 'Notes', es: 'Notas' },
  'panel.round':    { en: 'This round', es: 'Esta ronda' },
  'panel.order':    { en: 'Payout order', es: 'Orden de pago' },

  /* — matrix — */
  'mx.nummember':   { en: 'Number / member', es: 'Número / miembro' },
  'mx.stamp':       { en: 'paid', es: 'pagado' },
  'mx.reopen':      { en: (v) => `Reopen round ${v}`, es: (v) => `Reabrir ronda ${v}` },
  'mx.inpot':       { en: 'in the pot', es: 'en la caja' },
  'mx.cell':        { en: (v) => `${v.name} · round ${v.n} · due ${v.day}`, es: (v) => `${v.name} · ronda ${v.n} · vence el ${v.day}` },

  /* — round panel — */
  'rp.closedbadge': { en: 'closed', es: 'cerrada' },
  'rp.closedbody':  { en: 'Every member has held the pot. Start a new tanda when the group is ready.', es: 'Cada miembro ya llevó la caja. Empieza una tanda nueva cuando el grupo quiera.' },
  'rp.waiting':     { en: 'waiting', es: 'esperando' },
  'rp.markpaid':    { en: (v) => `Mark ${v} as paid`, es: (v) => `Marcar ${v} como pagado` },
  'rp.delivered':   { en: (v) => `✓ ${v.amt} delivered to <b>${v.name}</b>`, es: (v) => `✓ ${v.amt} entregados a <b>${v.name}</b>` },
  'rp.undo':        { en: 'undo', es: 'deshacer' },
  'rp.handover':    { en: (v) => `Hand over la caja → ${v.name} · ${v.amt}`, es: (v) => `Entrega la caja → ${v.name} · ${v.amt}` },
  'rp.meta':        { en: (v) => `Round <b>${v.r}</b> of <b>${v.n}</b> · due <b>${v.day}</b> · pot <b>${v.amt}</b>${v.cut}`, es: (v) => `Ronda <b>${v.r}</b> de <b>${v.n}</b> · vence el <b>${v.day}</b> · caja <b>${v.amt}</b>${v.cut}` },
  'rp.cut':         { en: (v) => ` · cut ${v}`, es: (v) => ` · comisión ${v}` },
  'rp.rule':        { en: 'The pot can only leave once every share is in — that rule is the whole product.', es: 'La caja solo sale cuando entran todas las aportaciones — esa regla es todo el producto.' },

  /* — order panel — */
  'op.agreement':   { en: 'By agreement', es: 'Por acuerdo' },
  'op.hint.posteo': { en: (v) => `Members bid a discount to be paid sooner. Big bids go first; the last place waits — and collects ${v.hi} instead of ${v.lo}.`, es: (v) => `Los miembros ofertan un descuento para cobrar antes. Las ofertas grandes van primero; el último lugar espera — y cobra ${v.hi} en vez de ${v.lo}.` },
  'op.hint.fixed':  { en: (v) => `Everyone collects the same ${v.amt}. Switch to <b>posteo</b> if the group wants to bid for position.`, es: (v) => `Todos cobran los mismos ${v.amt}. Cambia a <b>posteo</b> si el grupo quiere ofertar por la posición.` },

  /* — ledger panel — */
  'lgd.headk':      { en: 'member · net so far', es: 'miembro · neto hasta hoy' },
  'lgd.headv':      { en: 'in − out', es: 'entra − sale' },
  'lgd.inout':      { en: (v) => `in ${v.in} · out ${v.out}`, es: (v) => `entra ${v.in} · sale ${v.out}` },
  'lgd.collected':  { en: 'Collected', es: 'Recaudado' },
  'lgd.paidout':    { en: 'Paid out', es: 'Pagado' },
  'lgd.rate':       { en: (v) => `collected ${v}%`, es: (v) => `recaudado ${v}%` },
  'lgd.tocome':     { en: 'still to come', es: 'por venir' },

  /* — notes — */
  'notes.nothing':  { en: 'Nothing to flag.', es: 'Nada que señalar.' },
  'n.closed':       { en: (v) => `Tanda closed — all ${v.n} members held the pot. ${v.amt} changed hands on trust alone.`, es: (v) => `Tanda cerrada — los ${v.n} miembros ya llevaron la caja. ${v.amt} circularon solo con confianza.` },
  'n.allin':        { en: (v) => `All ${v.n} shares are in for round ${v.r} — hand <b>la caja</b> to <b>${v.name}</b>.`, es: (v) => `Las ${v.n} aportaciones de la ronda ${v.r} están — entrega <b>la caja</b> a <b>${v.name}</b>.` },
  'n.late':         { en: (v) => `Round ${v.r} was due ${v.day} — <b>${v.names}</b> ${v.one ? "hasn't paid" : "haven't paid"}.`, es: (v) => `La ronda ${v.r} venció el ${v.day} — <b>${v.names}</b> ${v.one ? 'no ha pagado' : 'no han pagado'}.` },
  'n.duein':        { en: (v) => `Round ${v.r} is due in ${v.days} day${v.days === 1 ? '' : 's'} (${v.day}) — ${v.out} share${v.out === 1 ? '' : 's'} still out.`, es: (v) => `La ronda ${v.r} vence en ${v.days} día${v.days === 1 ? '' : 's'} (${v.day}) — falta${v.out === 1 ? '' : 'n'} ${v.out} aportación${v.out === 1 ? '' : 'es'}.` },
  'n.duecollect':   { en: (v) => `Round ${v.r} was due ${v.day} — collecting.`, es: (v) => `La ronda ${v.r} venció el ${v.day} — cobrando.` },
  'n.gap':          { en: (v) => `Round ${v.r} was paid out with ${v.out} share${v.out === 1 ? '' : 's'} missing from the record.`, es: (v) => `La ronda ${v.r} se pagó con ${v.out} aportación${v.out === 1 ? '' : 'es'} sin registrar.` },
  'n.still1':       { en: (v) => `<b>${v.name}</b> already took the pot — and still owes a share every round until the end.`, es: (v) => `<b>${v.name}</b> ya llevó la caja — y aún debe una aportación cada ronda hasta el final.` },
  'n.stillN':       { en: (v) => `<b>${v.name}</b> and ${v.more} others already took the pot — and they still owe a share every round until the end.`, es: (v) => `<b>${v.name}</b> y ${v.more} más ya llevaron la caja — y aún deben una aportación cada ronda hasta el final.` },
  'n.posteo':       { en: (v) => `<b>Posteo</b> on: discounts are taken off the first payouts and piled onto the last place — which is worth ${v.amt} extra.`, es: (v) => `<b>Posteo</b> activo: los descuentos se restan de los primeros pagos y se acumulan en el último lugar — lo que vale ${v.amt} extra.` },
  'n.next':         { en: (v) => `Next pot goes to <b>${v.name}</b> — round ${v.r} of ${v.n}, by agreement.`, es: (v) => `La próxima caja es de <b>${v.name}</b> — ronda ${v.r} de ${v.n}, por acuerdo.` },
  'n.cut':          { en: (v) => `Organizer's cut is ${v.amt} a round — ${v.total} across the whole tanda.`, es: (v) => `La comisión del organizador es de ${v.amt} por ronda — ${v.total} en toda la tanda.` },
  'n.missed':       { en: (v) => `${v.n} member${v.n === 1 ? ' has' : 's have'} missed at least one round in the record.`, es: (v) => `${v.n} miembro${v.n === 1 ? ' ha' : 's han'} perdido al menos una ronda en el registro.` },
  'n.first':        { en: (v) => `First round is due ${v.day} — ${v.days} day${v.days === 1 ? '' : 's'} out.`, es: (v) => `La primera ronda vence el ${v.day} — faltan ${v.days} día${v.days === 1 ? '' : 's'}.` },

  /* — toasts & dialogs — */
  't.roundpaid':    { en: 'Round already paid out — undo it first', es: 'La ronda ya se pagó — deshazla primero' },
  't.reopened':     { en: (v) => `Round ${v} reopened`, es: (v) => `Ronda ${v} reabierta` },
  't.posteoOn':     { en: 'Posteo on — members bid for position', es: 'Posteo activo — los miembros ofertan por posición' },
  't.orderFixed':   { en: 'Order by agreement', es: 'Orden por acuerdo' },
  't.needMembers':  { en: 'A tanda needs at least 2 members', es: 'Una tanda necesita al menos 2 miembros' },
  't.clubUpdated':  { en: 'Club updated', es: 'Club actualizado' },
  't.backupSaved':  { en: (v) => `Backup saved — ${v.n} members · ${v.p} payments on record`, es: (v) => `Respaldo guardado — ${v.n} miembros · ${v.p} pagos registrados` },
  't.badJson':      { en: 'That file isn’t valid JSON', es: 'Ese archivo no es JSON válido' },
  't.notBackup':    { en: 'That file isn’t a Tanda ledger backup', es: 'Ese archivo no es un respaldo de la tanda' },
  't.notLedger':    { en: 'That file doesn’t look like a Tanda ledger backup', es: 'Ese archivo no parece un respaldo de la tanda' },
  't.restored':     { en: (v) => `Restored ${v.name} · ${v.n} members`, es: (v) => `Restaurado ${v.name} · ${v.n} miembros` },
  't.copied':       { en: 'Summary copied to clipboard', es: 'Resumen copiado al portapapeles' },
  't.copyFailed':   { en: 'Copy failed — select the text manually', es: 'La copia falló — selecciona el texto a mano' },

  /* — settings — */
  'set.hint.posteo':{ en: 'Each member sets the discount they’ll accept to take the pot earlier. Highest discount, earliest pot; the last member gets everyone’s leftovers on top.', es: 'Cada miembro fija el descuento que acepta para llevar la caja antes. Mayor descuento, caja más temprano; el último miembro recibe las sobras de todos encima.' },
  'set.hint.fixed': { en: 'The order you set here is the order the pots go out. Change it any time before the next payout.', es: 'El orden que pongas aquí es el orden en que sale la caja. Cámbialo cuando quieras antes del próximo pago.' },
  'set.member':     { en: 'member', es: 'miembro' },
  'set.discount':   { en: 'discount %', es: 'descuento %' },
  'set.order':      { en: 'order', es: 'orden' },
  'set.t.up':       { en: 'Move up', es: 'Subir' },
  'set.t.down':     { en: 'Move down', es: 'Bajar' },
  'set.t.del':      { en: 'Remove', es: 'Quitar' },
  'set.t.bid':      { en: 'Discount accepted to be paid earlier', es: 'Descuento aceptado para cobrar antes' },
  'c.replace':      { en: (v) => `Replace “${v.a}” with “${v.b}” from the backup?\n\nThe club in this browser will be lost — back it up first if you want to keep it.`, es: (v) => `¿Reemplazar “${v.a}” por “${v.b}” del respaldo?\n\nEl club en este navegador se perderá — respáldalo primero si quieres conservarlo.` },
  'c.newClub':      { en: 'Start a new club? The current one will be replaced in this browser.', es: '¿Empezar un club nuevo? El actual se reemplazará en este navegador.' },
  'c.deleteClub':   { en: 'Delete this club and its records from this browser?', es: '¿Eliminar este club y sus registros de este navegador?' },

  /* — summary export — */
  'sum.meta':       { en: (v) => `${v.share} × ${v.n} members · pot ${v.pot} a round · ${v.freq}`, es: (v) => `${v.share} × ${v.n} miembros · caja de ${v.pot} por ronda · ${v.freq}` },
  'sum.order':      { en: (v) => `Starts ${v.day} · order: ${v.order}`, es: (v) => `Empieza el ${v.day} · orden: ${v.order}` },
  'sum.posteo':     { en: 'posteo (bidding)', es: 'posteo (subastas)' },
  'sum.agreement':  { en: 'by agreement', es: 'por acuerdo' },
  'sum.custom':     { en: 'custom rhythm', es: 'ritmo personalizado' },
  'sum.paidout':    { en: (v) => `paid out — ${v.name} got ${v.amt}`, es: (v) => `pagado — ${v.name} recibió ${v.amt}` },
  'sum.ready':      { en: (v) => `ready — all ${v.n} shares in for ${v.name}`, es: (v) => `lista — las ${v.n} aportaciones completas para ${v.name}` },
  'sum.collecting': { en: (v) => `collecting ${v.got}/${v.n}, due ${v.day}`, es: (v) => `cobrando ${v.got}/${v.n}, vence el ${v.day}` },
  'sum.in':         { en: 'in', es: 'entra' },
  'sum.out':        { en: 'out', es: 'sale' },
  'sum.net':        { en: 'net', es: 'neto' },
  'sum.ledger':     { en: 'Ledger (net = received − contributed):', es: 'Libro (neto = recibido − aportado):' },
  'sum.notes':      { en: 'Notes:', es: 'Notas:' },
  'sum.footer':     { en: 'Recorded in Tanda — nothing here moves money.', es: 'Anotado en Tanda — nada aquí mueve dinero.' },

  /* — defaults & misc — */
  'club.new':       { en: 'New tanda', es: 'Tanda nueva' },
  'member.n':       { en: (v) => `Member ${v}`, es: (v) => `Miembro ${v}` },
  'freq.everydays': { en: (v) => `every ${v} days`, es: (v) => `cada ${v} días` },

  /* — field notes (static HTML) — */
  'fn.title':       { en: 'Field notes', es: 'Notas de campo' },
  'fn.what.h':      { en: 'What a tanda is', es: 'Qué es una tanda' },
  'fn.what.p':      { en: 'An informal <b>rotating savings club</b>: a group you trust agrees a fixed share and a rhythm, and each round the whole pot goes to one member — until everyone has held it once. No bank, no interest, no contract. The same practice runs under 200+ names: <i>cundina</i>, <i>susu</i>, <i>junta</i>, <i>sand</i>, <i>polla</i>, <i>sociedad</i>, <i>quiniela</i>… Around <b>31% of Mexicans</b> take part in one.', es: 'Una <b>asociación rotativa de ahorro</b> informal: un grupo de confianza acuerda una aportación fija y un ritmo, y cada ronda la caja completa va a un miembro — hasta que todos la han llevado. Sin banco, sin interés, sin contrato. La misma práctica existe con más de 200 nombres: <i>cundina</i>, <i>susu</i>, <i>junta</i>, <i>sand</i>, <i>polla</i>, <i>sociedad</i>, <i>quiniela</i>… Alrededor del <b>31% de los mexicanos</b> participa en una.' },
  'fn.why.h':       { en: 'Why anyone joins', es: 'Por qué se entra' },
  'fn.why.p':       { en: 'The math is blunt and fair: whoever takes the pot first gets an <b>interest-free loan</b>; whoever takes it last gets <b>enforced savings</b> — every round they hand over money they would have spent. Money in always equals money out; the club creates no return and charges none.', es: 'La cuenta es cruda y justa: quien lleva la caja primero obtiene un <b>préstamo sin intereses</b>; quien la lleva al último tiene <b>ahorro forzado</b> — cada ronda entrega dinero que habría gastado. Lo que entra siempre es igual a lo que sale; la tanda no crea rendimiento ni cobra ninguno.' },
  'fn.order.h':     { en: 'Deciding the order', es: 'Cómo se decide el orden' },
  'fn.order.p':     { en: 'Groups settle it three ways: <b>raffle</b> the positions, assign by <b>who needs it most</b>, or run a <b>posteo</b> — members bid the discount they’re willing to accept. Biggest discount takes the pot first; the last member, who waited, collects their full pot <i>plus</i> every discount left on the table.', es: 'Los grupos lo resuelven de tres formas: <b>sortear</b> los lugares, asignar por <b>quién lo necesita más</b>, o hacer un <b>posteo</b> — los miembros ofertan el descuento que aceptan. El mayor descuento lleva la caja primero; el último miembro, que esperó, cobra su caja completa <i>más</i> cada descuento que quedó en la mesa.' },
  'fn.risk.h':      { en: 'The risk', es: 'El riesgo' },
  'fn.risk.p':      { en: 'It runs on trust alone. Mexico’s CONDUSEF advises against joining: no yield, loses ground to inflation, low liquidity, and the runner risk — the person holding the pot can simply vanish. Keep the records straight: untracked pots can look like tax evasion, and workplace tandas have cost people their jobs.', es: 'Solo corre sobre la confianza. En México la CONDUSEF aconseja no entrar: sin rendimiento, pierde contra la inflación, poca liquidez y el riesgo de la fuga — quien lleva la caja puede simplemente desaparecer. Lleva los registros al corriente: las cajas sin registrar pueden verse como evasión de impuestos, y las tandas de oficina han costado empleos.' },
  'fn.gloss.h':     { en: 'Glossary', es: 'Glosario' },
  'fn.gloss.p':     { en: '<b>Ronda</b> — one round. <b>Aportación</b> — the share each member pays. <b>La caja</b> — the pot. <b>El que lleva la caja</b> — whoever keeps the money (and, too often, the one who disappears). <b>Posteo / postores</b> — bidding for payout position. <b>Número</b> — a member’s place in the order.', es: '<b>Ronda</b> — una vuelta. <b>Aportación</b> — lo que paga cada miembro. <b>La caja</b> — el dinero junto. <b>El que lleva la caja</b> — quien guarda el dinero (y, demasiado seguido, el que desaparece). <b>Posteo / postores</b> — ofertar por el lugar de pago. <b>Número</b> — el lugar de un miembro en el orden.' },
  'fn.sources.h':   { en: 'Where this came from', es: 'De dónde salió esto' },
  'fn.src1':        { en: '<a href="https://en.wikipedia.org/wiki/Tanda_(informal_loan_club)" target="_blank" rel="noopener">Wikipedia — Tanda (informal loan club)</a> — regional names, structure, 31% participation, CONDUSEF / SCJN warnings.', es: '<a href="https://en.wikipedia.org/wiki/Tanda_(informal_loan_club)" target="_blank" rel="noopener">Wikipedia — Tanda (club de ahorro informal)</a> — nombres regionales, estructura, 31% de participación, advertencias de CONDUSEF / SCJN.' },
  'fn.src2':        { en: '<a href="https://www.investopedia.com/terms/r/rotating-credit-and-savings-association.asp" target="_blank" rel="noopener">Investopedia — ROSCA</a> and <a href="https://www.bbva.mx/educacion-financiera/blog/piensa-antes-de-entrar-a-una-tanda.html" target="_blank" rel="noopener">BBVA — Piensa antes de entrar a una tanda</a>.', es: '<a href="https://www.investopedia.com/terms/r/rotating-credit-and-savings-association.asp" target="_blank" rel="noopener">Investopedia — ROSCA</a> y <a href="https://www.bbva.mx/educacion-financiera/blog/piensa-antes-de-entrar-a-una-tanda.html" target="_blank" rel="noopener">BBVA — Piensa antes de entrar a una tanda</a>.' },
  'fn.src3':        { en: '<a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10242226/" target="_blank" rel="noopener">Quiñones et al., 2023 — Tandas among Mexican American communities</a>.', es: '<a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10242226/" target="_blank" rel="noopener">Quiñones et al., 2023 — Tandas entre comunidades mexicoamericanas</a>.' },
  'fn.src4':        { en: 'Nothing here is financial advice, and no money moves through this page — it’s a notebook for a club you already run.', es: 'Nada de esto es asesoría financiera, y ningún dinero se mueve en esta página — es un cuaderno para un club que ya manejas.' },
  'foot.p':         { en: 'Tanda — a ledger for a practice older than any bank in the room. Your club is saved in this browser only; ⤓ Backup keeps a copy in a file.', es: 'Tanda — un libro para una práctica más antigua que cualquier banco del cuarto. Tu club se guarda solo en este navegador; ⤓ Respaldo guarda una copia en un archivo.' },

  /* — settings modal (static HTML) — */
  'modal.eyebrow':  { en: 'Club rules', es: 'Reglas del club' },
  'modal.title':    { en: 'Settings', es: 'Ajustes' },
  'modal.close':    { en: 'Close', es: 'Cerrar' },
  'f.name':         { en: 'Club name', es: 'Nombre del club' },
  'f.currency':     { en: 'Currency symbol', es: 'Símbolo de moneda' },
  'f.share':        { en: 'Share per member, per round', es: 'Aportación por miembro, por ronda' },
  'f.rhythm':       { en: 'Rhythm', es: 'Ritmo' },
  'opt.weekly':     { en: 'Weekly', es: 'Semanal' },
  'opt.biweekly':   { en: 'Every 2 weeks', es: 'Cada 2 semanas' },
  'opt.twice':      { en: 'Twice a month', es: 'Dos veces al mes' },
  'opt.monthly':    { en: 'Monthly', es: 'Mensual' },
  'f.start':        { en: 'First round due', es: 'Vencimiento de la primera ronda' },
  'f.cut':          { en: "Organizer's cut", es: 'Comisión del organizador' },
  'f.cut.opt':      { en: 'optional', es: 'opcional' },
  'opt.none':       { en: 'none', es: 'ninguna' },
  'opt.pct':        { en: '% of pot', es: '% de la caja' },
  'opt.fixed':      { en: 'fixed, per round', es: 'fija, por ronda' },
  'f.order':        { en: 'Payout order', es: 'Orden de pago' },
  'opt.agreement':  { en: 'By agreement — set the order here', es: 'Por acuerdo — fija el orden aquí' },
  'opt.posteo':     { en: 'Posteo — members bid a discount for position', es: 'Posteo — los miembros ofertan descuento por posición' },
  'f.members':      { en: 'Members <small>— the numbers, top takes the pot first</small>', es: 'Miembros <small>— los números; el primero lleva la caja</small>' },
  'btn.add':        { en: '+ Add member', es: '+ Agregar miembro' },
  'btn.delete':     { en: 'Delete club', es: 'Eliminar club' },
  'btn.cancel':     { en: 'Cancel', es: 'Cancelar' },
  'btn.save':       { en: 'Save', es: 'Guardar' },
  'ph.name':        { en: 'Tanda de la Zarza', es: 'Tanda de la Zarza' }
};

const t = (k, v) => {
  const e = STRINGS[k];
  if (!e) return k;
  const s = e[LANG] != null ? e[LANG] : e.en;
  return typeof s === 'function' ? s(v == null ? {} : v) : s;
};

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

const LOCALE = () => (LANG === 'es' ? 'es-MX' : undefined);
const fmtDay  = (d) => d.toLocaleDateString(LOCALE(), { weekday:'short', day:'numeric', month:'short' });
const fmtDate = (d) => d.toLocaleDateString(LOCALE(), { day:'numeric', month:'short', year:'numeric' });
const fmtShort = (d) => d.toLocaleDateString(LOCALE(), { day:'numeric', month:'short' });

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
    name: t('club.new'),
    currency: '$',
    share: 500,
    freqDays: 7,
    start: iso(TODAY),
    commType: 'none',
    commValue: 0,
    orderMode: 'fixed',
    members: [
      { id: 'm1', name: t('member.n', 1), bid: 0 },
      { id: 'm2', name: t('member.n', 2), bid: 0 }
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
    name: String(c.name || '').trim().slice(0, 48) || t('club.new'),
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
    notes.push({ level: 'ok', text: t('n.closed', { n: N, amt: money(circulated) }) });
    return notes;
  }

  const due = dueDate(r);
  const got = collectedCount(r);
  const missing = S.members.filter((m) => !isPaid(m.id, r));
  const late = missing.filter((m) => dayDiff(due, TODAY) > 0);

  if (got === N) {
    notes.push({ level: 'ok', text: t('n.allin', { n: N, r: r + 1, name: esc(recipientOf(r).name) }) });
  } else if (late.length) {
    notes.push({
      level: 'warn',
      text: t('n.late', { r: r + 1, day: fmtDay(due), names: late.map((m) => esc(m.name)).join(', '), one: late.length === 1 })
    });
  } else {
    const days = dayDiff(TODAY, due);
    notes.push({
      level: 'info',
      text: days > 0
        ? t('n.duein', { r: r + 1, days, day: fmtDay(due), out: N - got })
        : t('n.duecollect', { r: r + 1, day: fmtDay(due) })
    });
  }

  for (let i = 0; i < r; i++) {
    if (collectedCount(i) < N) {
      notes.push({ level: 'err', text: t('n.gap', { r: i + 1, out: N - collectedCount(i) }) });
      break;
    }
  }

  const takenAlready = ordered().slice(0, r);
  const stillOwing = takenAlready.filter((m) => nIn(m.id) < N);
  if (stillOwing.length === 1) {
    notes.push({ level: 'info', text: t('n.still1', { name: esc(stillOwing[0].name) }) });
  } else if (stillOwing.length > 1) {
    notes.push({ level: 'info', text: t('n.stillN', { name: esc(stillOwing[0].name), more: stillOwing.length - 1 }) });
  }

  if (S.orderMode === 'posteo') {
    notes.push({ level: 'info', text: t('n.posteo', { amt: money(surplusForLast()) }) });
  } else {
    const next = recipientOf(r);
    notes.push({ level: 'info', text: t('n.next', { name: esc(next.name), r: r + 1, n: N }) });
  }

  const totalComm = commission() * N;
  if (totalComm > 0) notes.push({ level: 'warn', text: t('n.cut', { amt: money(commission()), total: money(totalComm) }) });

  // Only counts against someone when the round is actually past due.
  let missed = 0;
  S.members.forEach((m) => {
    let isLate = false;
    for (let i = 0; i <= r && !isLate; i++) {
      if (dayDiff(dueDate(i), TODAY) > 0 && !isPaid(m.id, i)) isLate = true;
    }
    if (isLate) missed++;
  });
  if (missed > 0) {
    notes.push({ level: 'warn', text: t('n.missed', { n: missed }) });
  }

  const startDays = dayDiff(TODAY, parseISO(S.start));
  if (startDays > 0) notes.push({ level: 'info', text: t('n.first', { day: fmtDate(parseISO(S.start)), days: startDays }) });

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
    t('head.members', { amt: money(S.share), n: N }),
    t('head.pot', { amt: money(pot()) }),
    lp(FREQ_PHRASE[S.freqDays]) || t('freq.everydays', S.freqDays),
    t('head.started', { day: fmtDate(parseISO(S.start)) })
  ].join(' <span class="sep">·</span> ');

  const pill = $('#statusPill');
  const line = $('#statusLine');
  const sub  = $('#statusSub');
  pill.className = 'status-pill';

  if (r === null) {
    pill.textContent = t('st.complete'); pill.classList.add('done');
    line.textContent = t('st.closed');
    sub.textContent = t('st.delivered', { n: N, amt: money(S.members.reduce((s, m) => s + memberStats(m).out, 0)) });
    $('#progressFill').style.width = '100%';
    $('#statusSub').style.display = '';
    return;
  }

  const due = dueDate(r);
  const got = collectedCount(r);
  const complete = got === N;
  const overdue = dayDiff(due, TODAY) > 0 && !complete;

  pill.textContent = complete ? t('st.ready') : overdue ? t('st.overdue') : t('st.collecting');
  if (complete) pill.classList.add('ready');
  else if (overdue) pill.classList.add('warn');
  line.textContent = t('st.round', { r: r + 1, n: N, day: fmtDay(due) });

  const missing = S.members.filter((m) => !isPaid(m.id, r));
  sub.textContent = complete
    ? t('st.readyfor', { got, n: N, amt: money(pot()), name: recipientOf(r).name })
    : overdue
      ? t('st.outstanding', { got, n: N, names: missing.map((m) => m.name).join(', ') })
      : t('st.paidin', { got, n: N, amt: money(got * S.share), total: money(pot()) });

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

  let head = '<tr><th class="col-name">' + t('mx.nummember') + '</th>';
  for (let i = 0; i < N; i++) {
    const due = dueDate(i);
    const isDone = paidOut(i);
    const isLate = !isDone && dayDiff(due, TODAY) > 0 && collectedCount(i) < N;
    const stamp = isDone
      ? `<button class="th-stamp" data-undo="${i}" title="${esc(t('mx.reopen', i + 1))}">${esc(t('mx.stamp'))}</button>`
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
        title="${esc(t('mx.cell', { name: m.name, n: i + 1, day: fmtShort(due) }))}"
        aria-pressed="${paid}"><span class="cell-box">${paid ? '✓' : ''}</span></button></td>`;
    }
    body += '</tr>';
  });

  let foot = '<tr><th>' + t('mx.inpot') + '</th>';
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
    badge.textContent = t('rp.closedbadge');
    badge.className = 'badge brass';
    $('#roundBody').innerHTML = `<p class="round-meta">${t('rp.closedbody')}</p>`;
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
    const flag = paid ? `<span class="payer-flag ok">${t('lg.paid')}</span>`
      : late ? `<span class="payer-flag">${t('lg.late')}</span>`
      : `<span class="payer-flag wait">${t('rp.waiting')}</span>`;
    return `<li>
      <button class="payer-btn ${paid ? 'on' : ''}" data-toggle="${m.id}:${r}"
        aria-pressed="${paid}" title="${esc(t('rp.markpaid', m.name))}">${paid ? '✓' : ''}</button>
      <span class="payer-name">${esc(m.name)}</span>
      ${flag}
      <span class="payer-amt">${money(S.share)}</span>
    </li>`;
  }).join('');

  const body = paidOut(r)
    ? `<div class="payout-done">
         <span>${t('rp.delivered', { amt: money(recordedPayout(r)), name: esc(rec.name) })}</span>
         <button data-undo="${r}">${t('rp.undo')}</button>
       </div>`
    : `<button class="payout-btn" id="btnPayout" ${complete ? '' : 'disabled'}>
         ${t('rp.handover', { name: esc(rec.name), amt: money(payoutFor(r)) })}
       </button>`;

  $('#roundBody').innerHTML = `
    <p class="round-meta">${t('rp.meta', { r: r + 1, n: N, day: fmtDay(due), amt: money(pot()), cut: commission() ? t('rp.cut', money(commission())) : '' })}</p>
    <ul class="payers">${rows}</ul>
    ${body}
    ${!complete ? `<p class="mode-hint">${t('rp.rule')}</p>` : ''}`;
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
      <button class="mode-btn ${posteo ? '' : 'on'}" data-mode="fixed">${t('op.agreement')}</button>
      <button class="mode-btn ${posteo ? 'on' : ''}" data-mode="posteo">Posteo</button>
    </div>
    <ol class="order-list" start="1">${rows}</ol>
    <p class="mode-hint">${posteo
      ? t('op.hint.posteo', { hi: money(basePot() + surplusForLast()), lo: money(basePot()) })
      : t('op.hint.fixed', { amt: money(basePot()) })}</p>`;
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
    return `<div class="ledger-row" title="${esc(t('lgd.inout', { in: money(s.contributed), out: money(s.out) }))}">
      <span class="ledger-k">${i + 1}. ${esc(m.name)}</span>
      <span class="ledger-v ${s.net > 0 ? 'pos' : s.net < 0 ? 'neg' : ''}">${s.net === 0 ? '±0' : signed(s.net)}</span>
    </div>`;
  }).join('');

  const rate = N > 0 ? Math.round((S.members.reduce((n, m) => n + nIn(m.id), 0) / (N * N)) * 100) : 0;

  $('#ledgerBody').innerHTML = `
    <div class="ledger-head"><span>${t('lgd.headk')}</span><span>${t('lgd.headv')}</span></div>
    ${rows}
    <div class="ledger-row"><span class="ledger-k">${t('lgd.collected')}</span><span class="ledger-v">${money(totalIn)}</span></div>
    <div class="ledger-row"><span class="ledger-k">${t('lgd.paidout')}</span><span class="ledger-v">${money(totalOut)}</span></div>
    <div class="ledger-bar"><i class="in" style="width:${rate}%"></i><i class="out" style="width:${100 - rate}%"></i></div>
    <div class="ledger-legend">
      <span><i style="background:var(--indigo)"></i>${t('lgd.rate', rate)}</span>
      <span><i style="background:var(--paper-3)"></i>${t('lgd.tocome')}</span>
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
    : `<li class="notes-empty">${t('notes.nothing')}</li>`;
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
  if (paidOut(r)) { toast(t('t.roundpaid')); return; }
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
  toast(t('t.reopened', r + 1));
}

function setMode(mode) {
  S.orderMode = mode;
  save();
  renderAll();
  toast(mode === 'posteo' ? t('t.posteoOn') : t('t.orderFixed'));
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
    ${posteo ? `<div class="bid-head"><span class="b1">${t('set.member')}</span><span class="b2">${t('set.discount')}</span><span class="b3">${t('set.order')}</span></div>` : ''}
    ${draft.map((m, i) => `
      <div class="member-row" data-i="${i}">
        <input class="m-name" value="${esc(m.name)}" placeholder="${esc(t('member.n', i + 1))}" maxlength="24">
        ${posteo ? `<input class="m-bid" type="number" min="0" max="40" step="1" value="${m.bid || 0}" title="${esc(t('set.t.bid'))}">` : ''}
        <div class="m-tools">
          <button class="m-btn" data-up title="${esc(t('set.t.up'))}">↑</button>
          <button class="m-btn" data-down title="${esc(t('set.t.down'))}">↓</button>
          <button class="m-btn danger" data-del title="${esc(t('set.t.del'))}">✕</button>
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
    ? t('set.hint.posteo')
    : t('set.hint.fixed');
}

function saveSettings() {
  readDraft();
  const members = draft
    .filter((m) => m.name.trim().length)
    .map((m, i) => ({ id: m.id || 'm' + Date.now() + '-' + i, name: m.name.trim().slice(0, 24), bid: Number(m.bid) || 0 }));

  if (members.length < 2) { toast(t('t.needMembers')); return; }

  const share = Math.max(1, Number($('#fShare').value) || 1);
  const start = $('#fStart').value || iso(TODAY);
  const commType = $('#fCommType').value;
  const commValue = commType === 'none' ? 0 : Math.max(0, Number($('#fCommValue').value) || 0);

  S.name = $('#fName').value.trim() || t('club.new');
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
  toast(t('t.clubUpdated'));
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
  toast(t('t.backupSaved', { n: S.members.length, p: Object.keys(S.paid).length }));
}

async function restoreFromFile(file) {
  if (!file) return;
  let parsed;
  try { parsed = JSON.parse(await file.text()); }
  catch (e) { toast(t('t.badJson')); return; }

  if (parsed && parsed.app && parsed.app !== BACKUP_APP) {
    toast(t('t.notBackup'));
    return;
  }
  const club = sanitizeClub(parsed);
  if (!club) { toast(t('t.notLedger')); return; }

  if (!confirm(t('c.replace', { a: S.name, b: club.name }))) return;

  S = club;
  save();
  closeSettings();
  renderAll();
  toast(t('t.restored', { name: club.name, n: club.members.length }));
}

/* ---------------------------------------------------------
   Export
   --------------------------------------------------------- */
function summaryText() {
  const N = rounds();
  const lines = [];
  lines.push(`TANDA — ${S.name}`);
  lines.push(t('sum.meta', { share: money(S.share), n: N, pot: money(pot()), freq: lp(FREQ_PHRASE[S.freqDays]) || t('sum.custom') }));
  lines.push(t('sum.order', { day: fmtDate(parseISO(S.start)), order: S.orderMode === 'posteo' ? t('sum.posteo') : t('sum.agreement') }));
  lines.push('');
  for (let r = 0; r < N; r++) {
    const got = collectedCount(r);
    const rec = recipientOf(r);
    const state = paidOut(r)
      ? t('sum.paidout', { name: rec.name, amt: money(recordedPayout(r)) })
      : got === N
        ? t('sum.ready', { n: N, name: rec.name })
        : t('sum.collecting', { got, n: N, day: fmtDate(dueDate(r)) });
    lines.push(`R${r + 1} · ${fmtDate(dueDate(r))} · ${state}`);
  }
  lines.push('');
  lines.push(t('sum.ledger'));
  ordered().forEach((m, i) => {
    const s = memberStats(m);
    lines.push(`  ${String(i + 1).padStart(2)}. ${m.name.padEnd(14)} ${t('sum.in')} ${money(s.contributed).padStart(9)}   ${t('sum.out')} ${money(s.out).padStart(9)}   ${t('sum.net')} ${s.net === 0 ? '±' + money(0) : signed(s.net)}`);
  });
  lines.push('');
  lines.push(t('sum.notes'));
  buildNotes().forEach((n) => lines.push(`  · ${n.text.replace(/<[^>]+>/g, '')}`));
  lines.push('');
  lines.push(t('sum.footer'));
  return lines.join('\n');
}

async function copySummary() {
  const text = summaryText();
  try {
    await navigator.clipboard.writeText(text);
    toast(t('t.copied'));
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast(t('t.copied')); }
    catch (e2) { toast(t('t.copyFailed')); }
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
  if (!confirm(t('c.newClub'))) return;
  S = blankClub();
  save();
  renderAll();
  openSettings();
});

$('#btnSave').addEventListener('click', saveSettings);
$('#btnCancel').addEventListener('click', closeSettings);
$('#btnDeleteClub').addEventListener('click', () => {
  if (!confirm(t('c.deleteClub'))) return;
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
   Language — flip every static label, then re-render
   --------------------------------------------------------- */
function applyStaticLang() {
  document.documentElement.lang = LANG;
  document.title = t('doc.title');
  $$('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
  $$('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  $('#btnLang').textContent = LANG === 'en' ? 'ES' : 'EN';
  $('#btnLang').title = t('nav.lang.t');
  const open = !$('#modal').hidden;
  if (open) { updateOrderHint(); if ($('#fOrderMode').value === 'posteo') renderDraft(); }
}

function setLang(l) {
  LANG = l === 'es' ? 'es' : 'en';
  try { localStorage.setItem(LANG_KEY, LANG); } catch (e) { /* private mode */ }
  applyStaticLang();
  renderAll();
}

$('#btnLang').addEventListener('click', () => setLang(LANG === 'en' ? 'es' : 'en'));

/* ---------------------------------------------------------
   Boot
   --------------------------------------------------------- */
applyStaticLang();
S = load();
renderAll();
