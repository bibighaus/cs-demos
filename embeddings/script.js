"use strict";

/* Word Embeddings Explorer — loads a trimmed GloVe vocabulary (see
   data/ and NOTICE.md) and lets a student inspect one word's raw vector
   plus, for each dimension, where that word falls relative to the whole
   vocabulary's floor and ceiling on that dimension. */

const DATA_BASE = "data/";
const EXAMPLE_WORDS = ["king", "queen", "bank", "apple", "computer", "happy", "sad", "doctor", "nurse", "paris"];

const state = {
  words: null,        // string[]  index -> word
  wordIndex: null,     // Map<string, number>
  vecs: null,          // Float32Array, row-major [vocabSize x dims]
  dims: 0,
  vocabSize: 0,
  dimStats: null,      // { dims, vocabSize, dimensions: [{min,max,mean,std,lowest,highest}] }
  showAllDims: false,
  current: null,       // { word, vec } for the last successful lookup
};

const TABLE_PREVIEW_ROWS = 20;

const els = {};

function byId(id) { return document.getElementById(id); }

async function loadData() {
  const [words, dimStats, vecsBuf] = await Promise.all([
    fetch(`${DATA_BASE}words.json`).then(r => r.json()),
    fetch(`${DATA_BASE}dim_stats.json`).then(r => r.json()),
    fetch(`${DATA_BASE}vecs-f32.bin`).then(r => r.arrayBuffer()),
  ]);

  state.words = words;
  state.dimStats = dimStats;
  state.dims = dimStats.dims;
  state.vocabSize = words.length;
  state.vecs = new Float32Array(vecsBuf);

  state.wordIndex = new Map();
  words.forEach((w, i) => state.wordIndex.set(w, i));
}

function getVector(rowIndex) {
  const { dims, vecs } = state;
  return vecs.subarray(rowIndex * dims, rowIndex * dims + dims);
}

/** Position a value between [min, max] onto an integer 0–255 scale. */
function toByte(value, min, max) {
  if (max === min) return 128;
  const t = (value - min) / (max - min);
  return Math.max(0, Math.min(255, Math.round(t * 255)));
}

function renderExampleChips() {
  els.exampleChips.innerHTML = "";
  for (const w of EXAMPLE_WORDS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "word-chip";
    btn.textContent = w;
    btn.addEventListener("click", () => {
      els.wordInput.value = w;
      hideSuggestions();
      lookup(w);
    });
    els.exampleChips.appendChild(btn);
  }
}

/* ---------- Suggestions dropdown ---------- */

let suggestionIndex = -1;

function hideSuggestions() {
  els.suggestions.hidden = true;
  els.suggestions.innerHTML = "";
  suggestionIndex = -1;
}

function showSuggestions(query) {
  const q = query.trim().toLowerCase();
  if (!q || !state.words) { hideSuggestions(); return; }

  const prefixMatches = [];
  for (const w of state.words) {
    if (w.startsWith(q)) {
      prefixMatches.push(w);
      if (prefixMatches.length >= 8) break;
    }
  }

  if (prefixMatches.length === 0) { hideSuggestions(); return; }

  els.suggestions.innerHTML = "";
  prefixMatches.forEach((w) => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.textContent = w;
    item.addEventListener("mousedown", (e) => {
      // mousedown (not click) so it fires before the input's blur.
      e.preventDefault();
      els.wordInput.value = w;
      hideSuggestions();
      lookup(w);
    });
    els.suggestions.appendChild(item);
  });
  els.suggestions.hidden = false;
  suggestionIndex = -1;
}

function moveSuggestion(delta) {
  const items = Array.from(els.suggestions.querySelectorAll(".suggestion-item"));
  if (items.length === 0) return;
  items[suggestionIndex]?.classList.remove("active");
  suggestionIndex = (suggestionIndex + delta + items.length) % items.length;
  items[suggestionIndex].classList.add("active");
  els.wordInput.value = items[suggestionIndex].textContent;
}

/* ---------- Rendering ---------- */

function renderVectorGrid(vec) {
  els.vectorGrid.innerHTML = "";
  for (let d = 0; d < state.dims; d++) {
    const cell = document.createElement("div");
    cell.className = "vector-cell";
    cell.dataset.dim = String(d);

    const dimLabel = document.createElement("span");
    dimLabel.className = "vc-dim";
    dimLabel.textContent = d;

    const valLabel = document.createElement("span");
    valLabel.className = "vc-val";
    const v = vec[d];
    valLabel.textContent = v.toFixed(2);

    // Color by sign/magnitude: cyan for positive, redline-orange for
    // negative, opacity scaled by how large the value is (most GloVe
    // components fall within roughly ±2).
    const intensity = Math.min(1, Math.abs(v) / 2);
    const hue = v >= 0 ? "127, 212, 255" : "255, 122, 82";
    cell.style.background = `rgba(${hue}, ${(0.08 + intensity * 0.35).toFixed(2)})`;
    cell.style.borderColor = `rgba(${hue}, ${(0.3 + intensity * 0.6).toFixed(2)})`;

    cell.appendChild(dimLabel);
    cell.appendChild(valLabel);
    els.vectorGrid.appendChild(cell);
  }
}

function extremeListHtml(list, thisWord) {
  return list.map(({ w, v }) => {
    const cls = w === thisWord ? "extreme-word this-word" : "extreme-word";
    return `<span class="${cls}"><span class="ew-w">${cs160EscapeHtml(w)}</span> <span class="ew-v">${v.toFixed(2)}</span></span>`;
  }).join("");
}

function renderDimTable(word, vec) {
  const { dimensions } = state.dimStats;

  const ranked = [];
  for (let d = 0; d < state.dims; d++) {
    const stat = dimensions[d];
    const value = vec[d];
    const z = stat.std > 0 ? (value - stat.mean) / stat.std : 0;
    ranked.push({ d, value, z, stat });
  }
  ranked.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));

  const visible = state.showAllDims ? ranked : ranked.slice(0, TABLE_PREVIEW_ROWS);

  els.dimTableBody.innerHTML = "";
  for (const { d, value, z, stat } of visible) {
    const tr = document.createElement("tr");
    tr.dataset.dim = String(d);

    const byte = toByte(value, stat.min, stat.max);
    const pct = (byte / 255) * 100;

    tr.innerHTML = `
      <td>${d}</td>
      <td title="z = ${z.toFixed(2)} standard deviations from the mean">${value.toFixed(3)}</td>
      <td>${extremeListHtml(stat.lowest, word)}</td>
      <td>
        <div class="spectrum-cell">
          <div class="spectrum">
            <div class="spectrum-marker" style="left:${pct}%"></div>
          </div>
          <span class="spectrum-byte">${byte}</span>
        </div>
      </td>
      <td>${extremeListHtml(stat.highest, word)}</td>
    `;
    els.dimTableBody.appendChild(tr);
  }

  return ranked[0];
}

function setupHoverSync() {
  els.vectorGrid.addEventListener("mouseover", (e) => {
    const cell = e.target.closest(".vector-cell");
    if (!cell) return;
    highlightDim(cell.dataset.dim);
  });
  els.vectorGrid.addEventListener("mouseleave", () => highlightDim(null));

  els.dimTableBody.addEventListener("mouseover", (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    highlightDim(row.dataset.dim);
  });
  els.dimTableBody.addEventListener("mouseleave", () => highlightDim(null));
}

function highlightDim(dim) {
  els.vectorGrid.querySelectorAll(".vector-cell.hover-active").forEach(c => c.classList.remove("hover-active"));
  els.dimTableBody.querySelectorAll("tr.hover-active").forEach(r => r.classList.remove("hover-active"));
  if (dim === null) return;
  els.vectorGrid.querySelector(`.vector-cell[data-dim="${dim}"]`)?.classList.add("hover-active");
  els.dimTableBody.querySelector(`tr[data-dim="${dim}"]`)?.classList.add("hover-active");
}

/* ---------- Lookup ---------- */

function lookup(rawWord) {
  const word = rawWord.trim().toLowerCase();
  if (!word) return;

  const idx = state.wordIndex.get(word);
  if (idx === undefined) {
    els.resultContent.hidden = true;
    els.oovWord.textContent = `"${word}"`;
    els.oovNote.hidden = false;
    return;
  }
  els.oovNote.hidden = true;

  const vec = getVector(idx);

  els.statWord.textContent = word;
  els.statDims.textContent = state.dims;
  els.statRank.textContent = `${idx + 1} / ${state.vocabSize}`;

  state.current = { word, vec };

  renderVectorGrid(vec);
  const topDim = renderDimTable(word, vec);
  els.statTopDim.textContent = `#${topDim.d} (z = ${topDim.z >= 0 ? "+" : ""}${topDim.z.toFixed(2)})`;

  els.resultContent.hidden = false;
}

function toggleDimTable() {
  state.showAllDims = !state.showAllDims;
  els.toggleDimTable.textContent = state.showAllDims ? "Show top 20" : "Show all 100";
  els.toggleDimTable.setAttribute("aria-expanded", String(state.showAllDims));
  if (state.current) {
    const topDim = renderDimTable(state.current.word, state.current.vec);
    els.statTopDim.textContent = `#${topDim.d} (z = ${topDim.z >= 0 ? "+" : ""}${topDim.z.toFixed(2)})`;
  }
}

/* ---------- Wiring ---------- */

function init() {
  els.wordInput = byId("word-input");
  els.searchBtn = byId("search-btn");
  els.suggestions = byId("suggestions");
  els.exampleChips = byId("example-chips");
  els.vocabMeta = byId("vocab-meta");
  els.oovNote = byId("oov-note");
  els.oovWord = byId("oov-word");
  els.resultContent = byId("result-content");
  els.statWord = byId("stat-word");
  els.statDims = byId("stat-dims");
  els.statRank = byId("stat-rank");
  els.statTopDim = byId("stat-top-dim");
  els.vectorGrid = byId("vector-grid");
  els.dimTableBody = byId("dim-table-body");
  els.dimsInline = byId("dims-inline");
  els.toggleDimTable = byId("toggle-dim-table");

  renderExampleChips();
  setupHoverSync();
  els.toggleDimTable.addEventListener("click", toggleDimTable);

  els.wordInput.addEventListener("input", () => showSuggestions(els.wordInput.value));
  els.wordInput.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" && !els.suggestions.hidden) { e.preventDefault(); moveSuggestion(1); }
    else if (e.key === "ArrowUp" && !els.suggestions.hidden) { e.preventDefault(); moveSuggestion(-1); }
    else if (e.key === "Enter") { hideSuggestions(); lookup(els.wordInput.value); }
    else if (e.key === "Escape") { hideSuggestions(); }
  });
  els.wordInput.addEventListener("blur", () => setTimeout(hideSuggestions, 100));
  els.searchBtn.addEventListener("click", () => { hideSuggestions(); lookup(els.wordInput.value); });

  loadData().then(() => {
    els.dimsInline.textContent = state.dims;
    els.vocabMeta.textContent = `${state.vocabSize.toLocaleString()} words loaded · ${state.dims} dimensions each`;
    lookup(els.wordInput.value);
  }).catch((err) => {
    els.vocabMeta.textContent = "Couldn't load the embedding data. Try reloading the page.";
    console.error(err);
  });
}

init();
