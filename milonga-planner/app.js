/* ============================================================
   Tanda — local milonga running-order planner
   No accounts, services, or dependencies. The running order stays
   in this browser; track durations and energy are planning estimates.
   ============================================================ */
(() => {
  "use strict";

  const STORE_KEY = "tanda-milonga-planner-v1";
  const CORTINA_SECONDS = 40;
  const $ = (selector, root = document) => root.querySelector(selector);
  const els = {
    timeline: $("#timeline"), empty: $("#emptyState"), chart: $("#chart"),
    legend: $("#chartLegend"), notes: $("#notes"), noteCount: $("#noteCount"),
    stats: $("#stats"), modal: $("#modal"), modalTitle: $("#modalTitle"), printDate: $("#printDate"),
    modalKicker: $("#modalKicker"), search: $("#pickerSearch"), sort: $("#pickerSort"),
    picker: $("#pickerList"), toast: $("#toast"), restoreFile: $("#restoreFile")
  };
  const catalogById = new Map(CATALOG.map((track) => [track.id, track]));
  let toastTimer;
  let dragIndex = null;
  let pickerTarget = null;
  let previousFocus = null;
  let nextId = 1;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const makeId = () => `t${Date.now().toString(36)}-${(nextId++).toString(36)}`;
  const label = (style) => STYLE_META[style]?.label || "Tango";
  const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };
  const normalizeTanda = (item) => {
    const style = STYLE_META[item?.style] ? item.style : "tango";
    const songs = Array.isArray(item?.songs)
      ? item.songs.filter((id) => catalogById.has(id) && catalogById.get(id).k === style).slice(0, STYLE_META[style].max)
      : [];
    const cortina = Number.isInteger(item?.cortina) ? ((item.cortina % CORTINAS.length) + CORTINAS.length) % CORTINAS.length : 0;
    return {
      id: typeof item?.id === "string" ? item.id : makeId(),
      style, songs, cortina, printBreak: item?.printBreak === true
    };
  };
  const BACKUP_APP = "tanda-milonga";
  const sanitizeNight = (raw) => {
    if (!raw || typeof raw !== "object") return null;
    if (raw.app && raw.app !== BACKUP_APP) return null;
    const list = Array.isArray(raw.tandas) ? raw.tandas : Array.isArray(raw) ? raw : null;
    if (!list) return null;
    if (list.some((item) => !item || typeof item !== "object")) return null;
    return list.map(normalizeTanda);
  };
  const load = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (parsed) {
        const clean = sanitizeNight(parsed);
        if (clean) return clean;
      }
    } catch (error) {
      console.warn("Could not read the saved milonga plan.", error);
    }
    return [];
  };
  let tandas = load();

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ version: 1, tandas }));
    } catch (error) {
      console.warn("Could not save the milonga plan.", error);
      showToast("Could not save — browser storage may be full");
    }
  }

  function trackSeconds(track) {
    const base = track.k === "tango" ? 180 : 150;
    let hash = 0;
    for (const char of track.id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
    return base + (Math.abs(hash) % 31) - 15;
  }

  function tandaTracks(tanda) {
    return tanda.songs.map((id) => catalogById.get(id)).filter(Boolean);
  }

  function tandaSeconds(tanda) {
    return tandaTracks(tanda).reduce((sum, track) => sum + trackSeconds(track), 0);
  }

  function tandaEnergy(tanda) {
    const tracks = tandaTracks(tanda);
    return tracks.length ? tracks.reduce((sum, track) => sum + track.e, 0) / tracks.length : 0;
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2300);
  }

  function songMarkup(track, index, tanda) {
    const singer = track.s ? `<span class="voc"> · ${escapeHtml(track.s)}</span>` : "";
    const caveat = track.c ? `<span class="song-caveat" title="${escapeHtml(track.c)}">note</span>` : "";
    return `<li class="song" data-song-index="${index}">
      <span class="song-i">${index + 1}</span>
      <span class="song-energy" aria-label="Energy ${track.e} out of 5">${[1,2,3,4,5].map((n) => `<i class="e-dot${n <= track.e ? " on" : ""}"></i>`).join("")}</span>
      <span class="song-main"><span class="song-title">${escapeHtml(track.t)}${singer}${caveat}</span><span class="song-sub">${escapeHtml(track.o)}<span class="sep">·</span>${track.y}</span></span>
      <span class="song-tools">
        <button class="icon-btn" data-action="song-up" aria-label="Move ${escapeHtml(track.t)} up" ${index === 0 ? "disabled" : ""}>↑</button>
        <button class="icon-btn" data-action="song-down" aria-label="Move ${escapeHtml(track.t)} down" ${index === tanda.songs.length - 1 ? "disabled" : ""}>↓</button>
        <button class="song-swap" data-action="replace-song" aria-label="Replace ${escapeHtml(track.t)}" title="Replace recording">↻</button>
        <button class="icon-btn danger" data-action="remove-song" aria-label="Remove ${escapeHtml(track.t)}">×</button>
      </span>
    </li>`;
  }

  function renderTimeline() {
    els.timeline.innerHTML = tandas.map((tanda, index) => {
      const meta = STYLE_META[tanda.style];
      const tracks = tandaTracks(tanda);
      const orchestraNames = [...new Set(tracks.map((track) => track.o))];
      const orchestraText = orchestraNames.length === 1 ? orchestraNames[0] : orchestraNames.length ? "Mixed orchestras" : "Choose recordings";
      const missing = Math.max(0, meta.need - tracks.length);
      const over = tracks.length > meta.max;
      const energy = tandaEnergy(tanda);
      const bars = [1,2,3,4,5].map((n) => `<i class="${n <= Math.round(energy) ? "on" : ""}" style="height:${4 + n * 2}px"></i>`).join("");
      const songList = tracks.map((track, songIndex) => songMarkup(track, songIndex, tanda)).join("");
      const list = songList || `<li class="song-empty">No recordings yet — choose from the crate below.</li>`;
      const countClass = missing || over ? "warn" : "";
      const pageBreakBefore = tanda.printBreak && index > 0;
      const curtain = CORTINAS[tanda.cortina];
      return `<article class="tanda${pageBreakBefore ? " print-break" : ""}" data-style="${tanda.style}" data-tanda-id="${escapeHtml(tanda.id)}" draggable="true">
        <header class="tanda-head" data-drag-handle="true">
          <span class="tanda-no">${String(index + 1).padStart(2, "0")}</span>
          <div class="tanda-meta"><span class="chip" data-style="${tanda.style}">${label(tanda.style)}</span><span class="tanda-orch">${escapeHtml(orchestraText)}</span></div>
          <div class="tanda-right"><span class="tanda-dur">${formatTime(tandaSeconds(tanda))}</span>
            <div class="tanda-tools">
              <button class="icon-btn" data-action="move-up" aria-label="Move tanda ${index + 1} up" ${index === 0 ? "disabled" : ""}>↑</button>
              <button class="icon-btn" data-action="move-down" aria-label="Move tanda ${index + 1} down" ${index === tandas.length - 1 ? "disabled" : ""}>↓</button>
              <button class="icon-btn page-break${pageBreakBefore ? " is-set" : ""}" data-action="toggle-print-break" aria-label="${index === 0 ? "Page break not needed before the first tanda" : `${pageBreakBefore ? "Remove" : "Add"} printed page break before tanda ${index + 1}`}" aria-pressed="${pageBreakBefore ? "true" : "false"}" title="${index === 0 ? "The first tanda already starts the running order" : pageBreakBefore ? "This tanda starts a new printed page" : "Start a new printed page before this tanda"}" ${index === 0 ? "disabled" : ""}>↥</button>
              <button class="icon-btn" data-action="change-style" aria-label="Change tanda ${index + 1} style" title="Change style">⇄</button>
              <button class="icon-btn danger" data-action="delete-tanda" aria-label="Delete tanda ${index + 1}" title="Delete tanda">×</button>
            </div>
          </div>
        </header>
        <ol class="songs">${list}</ol>
        <footer class="tanda-foot"><span class="${countClass}">${tracks.length}/${meta.need} recordings${over ? " · over limit" : missing ? ` · ${plural(missing, "more needed")}` : tanda.style === "vals" && tracks.length === 4 ? " · extended vals" : " · complete"}</span><span class="energy-bars" aria-label="Average energy ${energy.toFixed(1)} out of 5">${bars}</span>
          <button class="note-fix" data-action="add-song">${tracks.length < meta.max ? "+ Choose recording" : "Replace a recording"}</button>
        </footer>
      </article>
      <div class="cortina" data-tanda-id="${escapeHtml(tanda.id)}"><span class="cortina-tag">Cortina</span><span class="cortina-song">${escapeHtml(curtain.t)} <i>· ${escapeHtml(curtain.by)}</i></span><span class="cortina-note">Non-tango · floor clears</span><span class="cortina-dur">0:40</span><button class="icon-btn" data-action="next-cortina" aria-label="Choose another cortina" title="Cycle cortina">↻</button></div>`;
    }).join("");
    els.empty.hidden = tandas.length > 0;
  }

  function collectNotes() {
    const notes = [];
    const occurrences = new Map();
    tandas.forEach((tanda, index) => {
      const meta = STYLE_META[tanda.style];
      const tracks = tandaTracks(tanda);
      if (tracks.length < meta.min) {
        notes.push({ level: "err", text: `<b>Tanda ${index + 1} needs music.</b> Add at least ${meta.min - tracks.length} more ${tracks.length ? "recording" : "recordings"}.`, fix: index });
      } else if (tracks.length < meta.need) {
        notes.push({ level: "warn", text: `<b>Tanda ${index + 1} is short.</b> The usual ${meta.need}-song shape has ${tracks.length}.`, fix: index });
      }
      if (tracks.length > meta.max) notes.push({ level: "err", text: `<b>Tanda ${index + 1} is too long.</b> ${label(tanda.style)} tandas top out at ${meta.max} recordings.`, fix: index });
      const orchestras = [...new Set(tracks.map((track) => track.o))];
      if (orchestras.length > 1) notes.push({ level: "err", text: `<b>Tanda ${index + 1} changes orchestra.</b> Homogeneous tandas keep one orchestra together.`, fix: index });
      if (tracks.length > 1) {
        const years = tracks.map((track) => track.y);
        if (Math.max(...years) - Math.min(...years) > 8) notes.push({ level: "warn", text: `<b>Tanda ${index + 1} spans ${Math.max(...years) - Math.min(...years)} years.</b> A tighter recording period may feel more cohesive.`, fix: index });
        const singers = [...new Set(tracks.map((track) => track.s).filter(Boolean))];
        if (singers.length > 1) notes.push({ level: "warn", text: `<b>Tanda ${index + 1} changes singer.</b> Check that the vocal character still belongs together.`, fix: index });
      }
      tracks.forEach((track) => {
        occurrences.set(track.id, (occurrences.get(track.id) || 0) + 1);
        if (track.c) notes.push({ level: "warn", text: `<b>${escapeHtml(track.t)}:</b> ${escapeHtml(track.c)}.`, fix: index });
      });
    });
    for (const [id, count] of occurrences) {
      if (count > 1) notes.push({ level: "warn", text: `<b>${escapeHtml(catalogById.get(id).t)} is programmed ${count} times.</b> Reusing a recording is allowed, but variety usually helps.`, fix: null });
    }
    if (tandas.length) {
      const last = tandas[tandas.length - 1];
      if (last.style !== "tango") notes.push({ level: "warn", text: "<b>The cierre is not a tango.</b> Many DJs close with a strong, familiar tango tanda.", fix: tandas.length - 1 });
      else if (last.songs.length && tandaEnergy(last) < 4) notes.push({ level: "warn", text: "<b>The closing tanda is gentle.</b> Consider a higher-energy tango for the cierre.", fix: tandas.length - 1 });
      if (notes.length === 0) notes.push({ level: "ok", text: "<b>Looking good.</b> The night has a clear tanda structure and a strong cierre.", fix: null });
    } else {
      notes.push({ level: "info", text: "Add tandas or compose a full night to see DJ notes.", fix: null });
    }
    return notes;
  }

  function renderNotes() {
    const notes = collectNotes();
    els.noteCount.textContent = String(notes.filter((note) => note.level !== "ok" && note.level !== "info").length);
    els.notes.innerHTML = notes.map((note) => `<li class="${note.level}"><i class="dot"></i><span>${note.text}${note.fix !== null ? ` <button class="note-fix" data-action="fix-note" data-index="${note.fix}">Review</button>` : ""}</span></li>`).join("");
  }

  function targetEnergy(index) {
    if (index < NIGHT_ENERGY.length) return NIGHT_ENERGY[index];
    return Math.max(3.4, 4.7 - Math.abs(index - NIGHT_ENERGY.length) * 0.16);
  }

  function renderChart() {
    const width = 340, height = 142, left = 28, right = 12, top = 12, bottom = 28;
    const x = (index) => tandas.length <= 1 ? (left + width - right) / 2 : left + index * (width - left - right) / (tandas.length - 1);
    const y = (energy) => top + (5 - energy) * (height - top - bottom) / 4;
    const targets = tandas.map((_, index) => `${x(index)},${y(targetEnergy(index))}`).join(" ");
    const actuals = tandas.map((tanda, index) => `${x(index)},${y(tandaEnergy(tanda))}`).join(" ");
    const grid = [1,2,3,4,5].map((energy) => `<line x1="${left}" y1="${y(energy)}" x2="${width - right}" y2="${y(energy)}" stroke="rgba(200,164,92,.12)"/><text x="2" y="${y(energy) + 4}" fill="#6f6459" font-size="10">${energy}</text>`).join("");
    const actualPoints = tandas.map((tanda, index) => `<circle cx="${x(index)}" cy="${y(tandaEnergy(tanda))}" r="4" fill="#e8ca84"><title>Tanda ${index + 1}: energy ${tandaEnergy(tanda).toFixed(1)}</title></circle>`).join("");
    els.chart.innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Energy chart showing the planned arc across ${tandas.length} tandas">${grid}${targets ? `<polyline points="${targets}" fill="none" stroke="#3f7d78" stroke-width="2" stroke-dasharray="5 5"/>` : ""}${actuals ? `<polyline points="${actuals}" fill="none" stroke="#c8a45c" stroke-width="2.5"/>${actualPoints}` : ""}${tandas.map((_, i) => `<text x="${x(i)}" y="${height - 7}" text-anchor="middle" fill="#9c8d7e" font-size="10">${i + 1}</text>`).join("")}</svg>`;
    els.legend.innerHTML = `<span><i style="background:#c8a45c"></i>Your plan</span><span><i style="background:#3f7d78"></i>Classic arc</span>`;
  }

  function renderStats() {
    const styles = { tango: 0, vals: 0, milonga: 0 };
    let songs = 0;
    let seconds = 0;
    tandas.forEach((tanda) => {
      styles[tanda.style]++;
      songs += tanda.songs.length;
      seconds += tandaSeconds(tanda) + CORTINA_SECONDS;
    });
    const totalMinutes = Math.round(seconds / 60);
    const mix = Object.entries(styles).map(([style, count]) => ({ style, count, color: style === "tango" ? "#a8323a" : style === "vals" ? "#3f7d78" : "#c8a45c" }));
    const mixbar = mix.map((part) => `<i style="width:${tandas.length ? part.count / tandas.length * 100 : 0}%;background:${part.color}" title="${label(part.style)}: ${part.count}"></i>`).join("");
    const legend = mix.map((part) => `<span><i style="background:${part.color}"></i>${label(part.style)} ${part.count}</span>`).join("");
    els.stats.innerHTML = `<div class="stat-row"><span class="stat-k">Tandas</span><span class="stat-v">${tandas.length}</span></div>
      <div class="stat-row"><span class="stat-k">Recordings</span><span class="stat-v">${songs}</span></div>
      <div class="stat-row"><span class="stat-k">Estimated run time</span><span class="stat-v">${totalMinutes}<small>min</small></span></div>
      <div class="stat-row"><span class="stat-k">Including ~40 sec cortinas</span><span class="stat-v">${formatTime(seconds)}<small>approx.</small></span></div>
      <div class="mixbar" aria-label="Tanda mix">${mixbar}</div><div class="mix-legend">${legend}</div>`;
  }

  function render() {
    renderTimeline();
    renderNotes();
    renderChart();
    renderStats();
    save();
  }

  function openPicker(tandaId, songIndex = null) {
    const tanda = tandas.find((item) => item.id === tandaId);
    if (!tanda) return;
    const meta = STYLE_META[tanda.style];
    if (songIndex === null) {
      songIndex = tanda.songs.length < meta.max ? tanda.songs.length : 0;
    }
    pickerTarget = { tandaId, songIndex };
    previousFocus = document.activeElement;
    els.modalTitle.textContent = `Tanda ${String(tandas.indexOf(tanda) + 1).padStart(2, "0")} · ${meta.label.toLowerCase()}`;
    els.modalKicker.textContent = songIndex < tanda.songs.length ? "Replace this recording" : `Pick recording ${songIndex + 1} of ${meta.need}`;
    els.search.value = "";
    renderPicker();
    els.modal.hidden = false;
    document.body.style.overflow = "hidden";
    els.search.focus();
  }

  function closePicker() {
    els.modal.hidden = true;
    document.body.style.overflow = "";
    pickerTarget = null;
    if (previousFocus?.isConnected) previousFocus.focus();
  }

  function renderPicker() {
    if (!pickerTarget) return;
    const tanda = tandas.find((item) => item.id === pickerTarget.tandaId);
    if (!tanda) return closePicker();
    const query = els.search.value.trim().toLocaleLowerCase();
    const currentId = tanda.songs[pickerTarget.songIndex];
    const used = new Set(tandas.flatMap((item) => item.songs).filter((id) => id !== currentId));
    const matches = CATALOG.filter((track) => track.k === tanda.style && `${track.t} ${track.o} ${track.s || ""} ${track.y}`.toLocaleLowerCase().includes(query));
    const sort = els.sort.value;
    matches.sort((a, b) => sort === "year" ? a.y - b.y || a.t.localeCompare(b.t)
      : sort === "orchestra" ? a.o.localeCompare(b.o) || a.y - b.y
      : sort === "title" ? a.t.localeCompare(b.t)
      : b.e - a.e || a.o.localeCompare(b.o) || a.t.localeCompare(b.t));
    els.picker.innerHTML = matches.length ? matches.map((track) => `<button class="pick${used.has(track.id) ? " used" : ""}" data-track-id="${escapeHtml(track.id)}">
      <span class="pick-main"><span class="pick-title">${escapeHtml(track.t)}${track.s ? ` <i>· ${escapeHtml(track.s)}</i>` : ""}</span><span class="pick-sub">${escapeHtml(track.o)} · ${formatTime(trackSeconds(track))} approx.</span></span>
      ${track.c ? `<span class="pick-tag" title="${escapeHtml(track.c)}">note</span>` : ""}<span class="pick-year">${track.y}</span>
      <span class="pick-energy" aria-label="Energy ${track.e} of 5">${[1,2,3,4,5].map((n) => `<i class="e-dot${n <= track.e ? " on" : ""}"></i>`).join("")}</span>
    </button>`).join("") : `<div class="picker-none">No recordings match. Try another search.</div>`;
  }

  function selectTrack(id) {
    const tanda = tandas.find((item) => item.id === pickerTarget?.tandaId);
    const track = catalogById.get(id);
    if (!tanda || !track || track.k !== tanda.style) return;
    const index = pickerTarget.songIndex;
    const wasAppend = index >= tanda.songs.length;
    if (index < tanda.songs.length) tanda.songs[index] = id;
    else if (tanda.songs.length < STYLE_META[tanda.style].max) tanda.songs.splice(index, 0, id);
    else tanda.songs[0] = id;
    const meta = STYLE_META[tanda.style];
    const nextEmpty = wasAppend && tanda.songs.length < meta.need ? tanda.songs.length : -1;
    render();
    if (nextEmpty >= 0) {
      pickerTarget.songIndex = nextEmpty;
      els.modalKicker.textContent = `Pick recording ${nextEmpty + 1} of ${meta.need}`;
      renderPicker();
      showToast("Added — choose the next recording or close the picker");
    } else {
      closePicker();
      showToast("Standard tanda length reached");
    }
  }

  function moveItem(list, from, to) {
    if (to < 0 || to >= list.length || from < 0 || from >= list.length || from === to) return false;
    const [item] = list.splice(from, 1);
    list.splice(to, 0, item);
    return true;
  }

  function bestSubset(tracks, count, targets) {
    let best = null;
    const chosen = [];
    const targetOrder = targets.map((_, index) => index).sort((a, b) => targets[a] - targets[b]);
    function visit(start) {
      if (chosen.length === count) {
        const sortedByEnergy = [...chosen].sort((a, b) => a.e - b.e || a.y - b.y || a.t.localeCompare(b.t));
        const selected = Array(count);
        targetOrder.forEach((position, index) => { selected[position] = sortedByEnergy[index]; });
        const years = chosen.map((track) => track.y);
        const span = Math.max(...years) - Math.min(...years);
        const singers = new Set(chosen.map((track) => track.s || "(instrumental)"));
        const caveats = chosen.filter((track) => track.c).length;
        const energy = selected.reduce((sum, track, index) => sum + Math.abs(track.e - targets[index]), 0) / count;
        const score = energy * 1.5 + span * 0.16 + Math.max(0, singers.size - 1) * 0.65 + caveats * 1.8;
        if (!best || score < best.score) best = { tracks: selected, score };
        return;
      }
      const needed = count - chosen.length;
      for (let index = start; index <= tracks.length - needed; index++) {
        chosen.push(tracks[index]);
        visit(index + 1);
        chosen.pop();
      }
    }
    visit(0);
    return best;
  }

  function composeNight() {
    if (tandas.length && !window.confirm("Replace the current running order with a freshly composed 10-tanda night?")) return;
    const used = new Set();
    const artistCounts = Object.create(null);
    const planned = NIGHT_PATTERN.map((style, index) => {
      const need = STYLE_META[style].need;
      const desired = targetEnergy(index);
      const arc = style === "tango" ? [desired - 0.5, desired - 0.8, desired - 0.7, desired + 0.5] : [desired - 0.3, desired, desired + 0.2];
      const candidates = (ORCH_ORDER[style] || []).map((orchestra, rank) => {
        const available = CATALOG.filter((track) => track.k === style && track.o === orchestra && !used.has(track.id));
        if (available.length < need) return null;
        const subset = bestSubset(available, need, arc);
        if (!subset) return null;
        const repetitionPenalty = (artistCounts[orchestra] || 0) * 0.38;
        return { orchestra, selected: subset.tracks, score: subset.score + rank * 0.12 + repetitionPenalty };
      }).filter(Boolean).sort((a, b) => a.score - b.score);
      const choice = candidates[0];
      if (!choice) return { id: makeId(), style, songs: [], cortina: index % CORTINAS.length, printBreak: false };
      choice.selected.forEach((track) => used.add(track.id));
      artistCounts[choice.orchestra] = (artistCounts[choice.orchestra] || 0) + 1;
      return { id: makeId(), style, songs: choice.selected.map((track) => track.id), cortina: index % CORTINAS.length, printBreak: false };
    });
    tandas = planned;
    render();
    window.scrollTo({ top: $(".layout").offsetTop, behavior: "smooth" });
    showToast("A 10-tanda night is ready — review the DJ notes");
  }

  function printRunningOrder() {
    if (!tandas.length) return showToast("Add a tanda before printing the running order");
    if (tandas.some((tanda) => tanda.songs.length < STYLE_META[tanda.style].min)) {
      if (!window.confirm("Some tandas are missing recordings. Print the draft running order anyway?")) return;
    }
    els.printDate.textContent = `Prepared ${new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date())} · ${tandas.length} tandas`;
    window.print();
  }

  function exportText() {
    const lines = ["TANDA · MILONGA RUNNING ORDER", "=".repeat(31), ""];
    let seconds = 0;
    tandas.forEach((tanda, index) => {
      const tracks = tandaTracks(tanda);
      lines.push(`${String(index + 1).padStart(2, "0")} · ${label(tanda.style).toUpperCase()} (${tracks.length}/${STYLE_META[tanda.style].need}) · approx. ${formatTime(tandaSeconds(tanda))}`);
      tracks.forEach((track, songIndex) => lines.push(`   ${songIndex + 1}. ${track.t}${track.s ? ` — ${track.s}` : ""} · ${track.o} (${track.y})`));
      if (!tracks.length) lines.push("   [no recordings selected]");
      const curtain = CORTINAS[tanda.cortina];
      lines.push(`   CORTINA · ${curtain.t} — ${curtain.by} (0:40)`, "");
      seconds += tandaSeconds(tanda) + CORTINA_SECONDS;
    });
    lines.push(`Estimated runtime incl. cortinas: ${formatTime(seconds)} (approx.)`);
    lines.push("Track durations and energy ratings are planning estimates.");
    return lines.join("\n");
  }

  async function copyOrder() {
    if (!tandas.length) return showToast("Add a tanda before copying the running order");
    const text = exportText();
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.append(textarea);
        textarea.select();
        const copied = document.execCommand("copy");
        textarea.remove();
        if (!copied) throw new Error("Clipboard permission unavailable");
      }
      showToast("Running order copied to clipboard");
    } catch (error) {
      console.error("Could not copy the running order.", error);
      showToast("Copy blocked — check browser clipboard permissions");
    }
  }

  /* ---------- Backup & restore: the night, as a file ---------- */
  function downloadJson(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  const backupPayload = () => ({ app: BACKUP_APP, version: 1, exportedAt: new Date().toISOString(), tandas });

  function backupNight() {
    if (!tandas.length) return showToast("Add a tanda before saving a backup");
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJson(`tanda-milonga-${stamp}.json`, backupPayload());
    showToast(`Backup saved — ${plural(tandas.length, "tanda")}`);
  }

  async function restoreNight(file) {
    if (!file) return;
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch (error) {
      return showToast("That file is not valid JSON");
    }
    if (parsed && parsed.app && parsed.app !== BACKUP_APP) {
      return showToast(parsed.app === "tanda-ledger"
        ? "That is a savings-ledger backup — restore it from the ledger"
        : "That file is not a Tanda backup");
    }
    const clean = sanitizeNight(parsed);
    if (!clean) return showToast("That file does not look like a Tanda backup");
    if (tandas.length && !window.confirm(`Replace the current running order (${plural(tandas.length, "tanda")}) with the one in this file (${plural(clean.length, "tanda")})?`)) return;
    tandas = clean;
    closePicker();
    render();
    showToast(`Restored ${plural(clean.length, "tanda")}`);
  }

  function addTanda(style) {
    const tanda = { id: makeId(), style, songs: [], cortina: tandas.length % CORTINAS.length, printBreak: false };
    tandas.push(tanda);
    render();
    openPicker(tanda.id, 0);
  }

  function clearNight() {
    if (!tandas.length) return;
    if (!window.confirm("Clear every tanda in this running order?")) return;
    tandas = [];
    closePicker();
    render();
    showToast("Night cleared");
  }

  function performAction(button) {
    const card = button.closest(".tanda");
    const tanda = card ? tandas.find((item) => item.id === card.dataset.tandaId) : null;
    const index = tanda ? tandas.indexOf(tanda) : -1;
    const songRow = button.closest(".song");
    const songIndex = songRow ? Number(songRow.dataset.songIndex) : -1;
    switch (button.dataset.action) {
      case "add-song": openPicker(tanda?.id); break;
      case "replace-song": openPicker(tanda?.id, songIndex); break;
      case "remove-song": tanda.songs.splice(songIndex, 1); render(); break;
      case "song-up": if (moveItem(tanda.songs, songIndex, songIndex - 1)) render(); break;
      case "song-down": if (moveItem(tanda.songs, songIndex, songIndex + 1)) render(); break;
      case "move-up": if (moveItem(tandas, index, index - 1)) render(); break;
      case "move-down": if (moveItem(tandas, index, index + 1)) render(); break;
      case "toggle-print-break":
        if (tanda) {
          tanda.printBreak = !tanda.printBreak;
          render();
          showToast(tanda.printBreak ? "Tanda will start a new printed page" : "Printed page break removed");
        }
        break;
      case "delete-tanda": tandas.splice(index, 1); render(); showToast("Tanda removed"); break;
      case "change-style": {
        if (!tanda) break;
        const styles = Object.keys(STYLE_META);
        const nextStyle = styles[(styles.indexOf(tanda.style) + 1) % styles.length];
        if (tanda.songs.length && !window.confirm(`Change to ${label(nextStyle)}? Current recordings will be removed because they are a different dance style.`)) break;
        tanda.style = nextStyle;
        tanda.songs = [];
        render();
        openPicker(tanda.id, 0);
        break;
      }
      case "next-cortina": {
        const curtain = button.closest(".cortina");
        const item = tandas.find((part) => part.id === curtain?.dataset.tandaId);
        if (item) { item.cortina = (item.cortina + 1) % CORTINAS.length; render(); }
        break;
      }
      case "fix-note": {
        const target = tandas[Number(button.dataset.index)];
        if (target) { targetCardScroll(target.id); openPicker(target.id); }
        break;
      }
    }
  }

  function targetCardScroll(id) {
    const card = $(`[data-tanda-id="${CSS.escape(id)}"].tanda`);
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  document.addEventListener("click", (event) => {
    const close = event.target.closest("[data-close]");
    if (close) { closePicker(); return; }
    const add = event.target.closest("[data-add]");
    if (add) { addTanda(add.dataset.add); return; }
    if (event.target.closest("#btnCompose") || event.target.closest("[data-compose]")) { composeNight(); return; }
    if (event.target.closest("#btnExport")) { copyOrder(); return; }
    if (event.target.closest("#btnBackup")) { backupNight(); return; }
    if (event.target.closest("#btnRestore")) { els.restoreFile.click(); return; }
    if (event.target.closest("#btnPrint")) { printRunningOrder(); return; }
    if (event.target.closest("#btnReset")) { clearNight(); return; }
    if (event.target.closest("#btnClear")) { clearNight(); return; }
    const pick = event.target.closest("[data-track-id]");
    if (pick) { selectTrack(pick.dataset.trackId); return; }
    const action = event.target.closest("[data-action]");
    if (action && !action.disabled) performAction(action);
  });

  els.search.addEventListener("input", renderPicker);
  els.sort.addEventListener("change", renderPicker);
  els.restoreFile.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    restoreNight(file);
  });
  document.addEventListener("keydown", (event) => {
    if (!els.modal.hidden && event.key === "Escape") closePicker();
    if (!els.modal.hidden && event.key === "Tab") {
      const focusable = [...els.modal.querySelectorAll("button:not([disabled]), input, select")].filter((node) => node.offsetParent !== null);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });

  els.timeline.addEventListener("dragstart", (event) => {
    const card = event.target.closest(".tanda");
    if (!card || !event.target.closest("[data-drag-handle]")) { event.preventDefault(); return; }
    dragIndex = tandas.findIndex((item) => item.id === card.dataset.tandaId);
    card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(dragIndex));
  });
  els.timeline.addEventListener("dragover", (event) => {
    const card = event.target.closest(".tanda");
    if (!card || dragIndex === null) return;
    event.preventDefault();
    card.classList.add("drag-over");
  });
  els.timeline.addEventListener("dragleave", (event) => event.target.closest(".tanda")?.classList.remove("drag-over"));
  els.timeline.addEventListener("drop", (event) => {
    const card = event.target.closest(".tanda");
    if (!card || dragIndex === null) return;
    event.preventDefault();
    const target = tandas.findIndex((item) => item.id === card.dataset.tandaId);
    if (moveItem(tandas, dragIndex, target)) render();
    dragIndex = null;
  });
  els.timeline.addEventListener("dragend", () => {
    dragIndex = null;
    els.timeline.querySelectorAll(".is-dragging,.drag-over").forEach((node) => node.classList.remove("is-dragging", "drag-over"));
  });

  render();
})();
