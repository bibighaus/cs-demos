"use strict";

/* ============================================================
   Text Encoding Explorer — ASCII tab
   ============================================================ */

const CONTROL_NAMES = {
  0: "NUL (null)", 1: "SOH", 2: "STX", 3: "ETX", 4: "EOT", 5: "ENQ", 6: "ACK",
  7: "BEL (bell)", 8: "BS (backspace)", 9: "TAB", 10: "LF (newline)",
  11: "VT", 12: "FF", 13: "CR (carriage return)", 14: "SO", 15: "SI",
  16: "DLE", 17: "DC1", 18: "DC2", 19: "DC3", 20: "DC4", 21: "NAK",
  22: "SYN", 23: "ETB", 24: "CAN", 25: "EM", 26: "SUB", 27: "ESC (escape)",
  28: "FS", 29: "GS", 30: "RS", 31: "US", 32: "SPACE", 127: "DEL"
};

const GLYPH_OVERRIDES = {
  9: "⇥",   // tab
  10: "⏎",  // newline
  13: "↵",  // carriage return
  32: "␣"   // visible space
};

function categoryFor(code) {
  if (code === 127 || code < 32) return "control";
  if (code <= 127) return "printable";
  if (code <= 255) return "extended";
  return "outside";
}

function categoryLabel(cat) {
  switch (cat) {
    case "control": return "Control character (non-printable)";
    case "printable": return "Printable ASCII (0–127)";
    case "extended": return "Extended, not standard 7-bit ASCII (128–255)";
    default: return "Outside ASCII range — needs Unicode";
  }
}

function toBinary(code) {
  const bits = Math.max(8, Math.ceil((code.toString(2).length) / 8) * 8);
  return code.toString(2).padStart(bits, "0");
}

function toHex(code) {
  const digits = Math.max(2, Math.ceil((code.toString(16).length) / 2) * 2);
  return code.toString(16).toUpperCase().padStart(digits, "0");
}

function displayGlyph(code, ch) {
  if (GLYPH_OVERRIDES[code]) return GLYPH_OVERRIDES[code];
  if (code < 32 || code === 127) return (CONTROL_NAMES[code] || "?").split(" ")[0];
  return ch;
}

const els = {
  input: document.getElementById("input-text"),
  charCount: document.getElementById("char-count"),
  byteCount: document.getElementById("byte-count"),
  info: document.getElementById("info-panel"),
  charView: document.getElementById("char-view"),
  binaryView: document.getElementById("binary-view"),
  hexView: document.getElementById("hex-view"),
  tableWrap: document.getElementById("ascii-table-wrap"),
  toggleTable: document.getElementById("toggle-table")
};

function render() {
  const text = els.input.value;
  const chars = Array.from(text); // respects surrogate pairs for a nicer count

  els.charCount.textContent = String(chars.length);

  els.charView.innerHTML = "";
  els.binaryView.innerHTML = "";
  els.hexView.innerHTML = "";

  const charFrag = document.createDocumentFragment();
  const binFrag = document.createDocumentFragment();
  const hexFrag = document.createDocumentFragment();
  let byteTotal = 0;

  chars.forEach((ch, i) => {
    const code = ch.codePointAt(0);
    const cat = categoryFor(code);
    byteTotal += code <= 255 ? 1 : Math.ceil(Math.log2(code + 1) / 8);

    const charSpan = document.createElement("span");
    charSpan.className = "unit " + cat;
    charSpan.dataset.code = String(code);
    charSpan.dataset.idx = String(i);
    charSpan.textContent = displayGlyph(code, ch);
    charSpan.title = ch === displayGlyph(code, ch) ? "" : (CONTROL_NAMES[code] || "");
    charFrag.appendChild(charSpan);

    const binSpan = document.createElement("span");
    binSpan.className = "unit " + cat;
    binSpan.dataset.code = String(code);
    binSpan.dataset.idx = String(i);
    binSpan.textContent = toBinary(code);
    binFrag.appendChild(binSpan);

    const hexSpan = document.createElement("span");
    hexSpan.className = "unit " + cat;
    hexSpan.dataset.code = String(code);
    hexSpan.dataset.idx = String(i);
    hexSpan.textContent = "0x" + toHex(code);
    hexFrag.appendChild(hexSpan);
  });

  els.charView.appendChild(charFrag);
  els.binaryView.appendChild(binFrag);
  els.hexView.appendChild(hexFrag);
  els.byteCount.textContent = String(byteTotal);
}

/* ---------- Hover highlighting (shared across views + table) ---------- */

function clearHighlights() {
  document.querySelectorAll(".unit.active").forEach(el => el.classList.remove("active"));
  document.querySelectorAll("tr.active-row").forEach(el => el.classList.remove("active-row"));
  els.info.classList.add("info-empty");
  els.info.innerHTML = '<span class="info-hint">Hover over any character below to inspect it.</span>';
}

function showInfo(code, ch) {
  const cat = categoryFor(code);
  const bin = toBinary(code);
  const hex = "0x" + toHex(code);
  const glyph = ch !== undefined ? displayGlyph(code, ch) : (CONTROL_NAMES[code] ? CONTROL_NAMES[code].split(" ")[0] : String.fromCodePoint(code));
  const name = CONTROL_NAMES[code] || "";

  els.info.classList.remove("info-empty");
  els.info.innerHTML = `
    <div class="info-item"><span class="k">Character</span><span class="v glyph">${escapeHtml(glyph)}</span></div>
    <div class="info-item"><span class="k">Decimal</span><span class="v">${code}</span></div>
    <div class="info-item"><span class="k">Hexadecimal</span><span class="v">${hex}</span></div>
    <div class="info-item"><span class="k">Binary</span><span class="v">${bin}</span></div>
    <div class="info-item"><span class="k">Category</span><span class="v">${categoryLabel(cat)}${name ? " &mdash; " + name : ""}</span></div>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function highlightCode(code, ch) {
  document.querySelectorAll(`.unit[data-code="${code}"]`).forEach(el => el.classList.add("active"));
  const row = document.querySelector(`tr[data-code="${code}"]`);
  if (row) row.classList.add("active-row");
  showInfo(code, ch);
}

function attachHoverDelegation(root) {
  root.addEventListener("mouseover", e => {
    const unit = e.target.closest(".unit[data-code]");
    if (unit) {
      clearHighlights();
      highlightCode(Number(unit.dataset.code), unit.textContent.length === 1 ? unit.textContent : undefined);
      return;
    }
    const row = e.target.closest("tr[data-code]");
    if (row) {
      clearHighlights();
      highlightCode(Number(row.dataset.code));
    }
  });
  root.addEventListener("mouseout", e => {
    const related = e.relatedTarget;
    if (related && (related.closest(".unit[data-code]") || related.closest("tr[data-code]"))) return;
    clearHighlights();
  });
}

/* ---------- ASCII reference table (0-127), split into 4 columns ---------- */

function buildAsciiTable() {
  els.tableWrap.innerHTML = "";
  const columns = 4;
  const rowsPerCol = 32;

  for (let col = 0; col < columns; col++) {
    const table = document.createElement("table");
    table.className = "ascii-col";
    table.innerHTML = "<thead><tr><th>Dec</th><th>Hex</th><th>Char</th></tr></thead>";
    const tbody = document.createElement("tbody");

    for (let r = 0; r < rowsPerCol; r++) {
      const code = col * rowsPerCol + r;
      const tr = document.createElement("tr");
      tr.dataset.code = String(code);
      const cat = categoryFor(code);
      if (cat === "control") tr.classList.add("control-row");

      const label = code < 32 || code === 127
        ? (CONTROL_NAMES[code] || "")
        : (code === 32 ? "SPACE" : String.fromCharCode(code));

      tr.innerHTML = `<td>${code}</td><td>0x${toHex(code)}</td><td>${escapeHtml(label)}</td>`;
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    els.tableWrap.appendChild(table);
  }
}

/* ---------- Copy buttons ---------- */

document.querySelectorAll(".copy-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const target = document.getElementById(btn.dataset.copy);
    const text = Array.from(target.querySelectorAll(".unit")).map(u => u.textContent).join(" ");
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = "Copied!";
      btn.classList.add("copied");
      setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 1200);
    } catch (err) {
      btn.textContent = "Copy failed";
      setTimeout(() => { btn.textContent = "Copy"; }, 1200);
    }
  });
});

/* ---------- Table collapse toggle ---------- */

els.toggleTable.addEventListener("click", () => {
  const expanded = els.toggleTable.getAttribute("aria-expanded") === "true";
  els.toggleTable.setAttribute("aria-expanded", String(!expanded));
  els.tableWrap.style.display = expanded ? "none" : "grid";
  els.toggleTable.textContent = expanded ? "Show table" : "Hide table";
});

/* ---------- Tabs ---------- */

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".tab-panel").forEach(p => p.setAttribute("hidden", ""));

    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    const panel = document.getElementById("tab-" + btn.dataset.tab);
    if (panel) panel.removeAttribute("hidden");
  });
});

/* ---------- Init ---------- */

els.input.addEventListener("input", () => { clearHighlights(); render(); });
attachHoverDelegation(document.querySelector("main"));
buildAsciiTable();
render();
