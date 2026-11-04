"use strict";

/* ============================================================
   Hashing Lab — shared rendering helpers, tabs, and the
   "Hash It" tab (live SHA-256 in hex + binary, avalanche test)
   ============================================================ */

/** Render bytes as a grid of hex digits, each with its 4 bits underneath.
 *  opts.compare: other bytes — bits that differ get class "flip".
 *  opts.zeros:   mark this many leading bits as "lz" (proof-of-work run).
 *  opts.target:  required leading zero bits — those bit slots get "tgt". */
function renderNibGrid(container, bytes, opts = {}) {
  const bits = bytesToBits(bytes);
  const cmp = opts.compare ? bytesToBits(opts.compare) : null;
  const hex = bytesToHex(bytes);
  let html = "";
  for (let i = 0; i < hex.length; i++) {
    let nibFlip = false, bitHtml = "";
    for (let j = 0; j < 4; j++) {
      const k = i * 4 + j;
      const cls = ["bit", bits[k] === "1" ? "one" : "zero"];
      if (cmp && cmp[k] !== bits[k]) { cls.push("flip"); nibFlip = true; }
      if (opts.zeros != null && k < opts.zeros) cls.push("lz");
      if (opts.target != null && k < opts.target) cls.push("tgt");
      bitHtml += `<span class="${cls.join(" ")}">${bits[k]}</span>`;
    }
    html += `<div class="nib${nibFlip ? " changed" : ""}" data-i="${i}">` +
      `<span class="nh">${hex[i]}</span><span class="nb">${bitHtml}</span></div>`;
  }
  container.innerHTML = html;
}

/** Render a hex string as hover-linkable digits. `diffAgainst` marks digits
 *  that differ from another hex string. */
function renderHexLine(container, hex, diffAgainst, zeroHexDigits) {
  let html = "";
  for (let i = 0; i < hex.length; i++) {
    const cls = ["hx"];
    if (diffAgainst && diffAgainst[i] !== hex[i]) cls.push("flip");
    if (zeroHexDigits != null && i < zeroHexDigits) cls.push("lz");
    html += `<span class="${cls.join(" ")}" data-i="${i}">${hex[i]}</span>`;
    if (i % 8 === 7 && i < hex.length - 1) html += `<span class="hx-gap"> </span>`;
  }
  container.innerHTML = html;
}

/** Hover-link a hex line and a nibble grid: hovering either highlights the
 *  matching digit in both. `onHover(i)` is called with the index or null. */
function linkHexAndGrid(scope, onHover) {
  const clear = () => {
    scope.querySelectorAll(".nib.active, .hx.active").forEach(n => n.classList.remove("active"));
  };
  scope.addEventListener("mouseover", e => {
    const t = e.target.closest(".nib, .hx");
    if (!t || !scope.contains(t)) return;
    clear();
    const i = t.dataset.i;
    scope.querySelectorAll(`.nib[data-i="${i}"], .hx[data-i="${i}"]`).forEach(n => n.classList.add("active"));
    if (onHover) onHover(+i);
  });
  scope.addEventListener("mouseleave", () => { clear(); if (onHover) onHover(null); });
}

function flashCopied(btn) {
  btn.classList.add("copied");
  const old = btn.textContent;
  btn.textContent = "Copied";
  setTimeout(() => { btn.classList.remove("copied"); btn.textContent = old; }, 1100);
}

/* ---------- Tabs ---------- */

(function () {
  const show = name => {
    document.querySelectorAll(".tab-btn").forEach(b => {
      const on = b.dataset.tab === name;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".tab-panel").forEach(p => {
      if (p.id === "tab-" + name) p.removeAttribute("hidden");
      else p.setAttribute("hidden", "");
    });
  };
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      show(btn.dataset.tab);
      try { history.replaceState(null, "", "#" + btn.dataset.tab); } catch (e) { /* file:// */ }
    });
  });
  const initial = location.hash.slice(1);
  if (document.querySelector(`.tab-btn[data-tab="${initial}"]`)) show(initial);
})();

/* ---------- Hash It tab ---------- */

(function () {
  const $ = id => document.getElementById(id);
  const els = {
    input: $("hash-input"), chars: $("hash-in-chars"), bytes: $("hash-in-bytes"),
    hex: $("hash-hex"), grid: $("hash-grid"), info: $("hash-info"), copy: $("copy-hash"),
    compare: $("hash-compare"), compareHex: $("compare-hex"), compareGrid: $("compare-grid"),
    reset: $("copy-from-above"), flipFill: $("flip-fill"), flipValue: $("flip-value"),
    flipNote: $("flip-note")
  };
  if (!els.input) return;

  const encoder = new TextEncoder();
  let digest = sha256Bytes("");
  let hexStr = "";

  function updateMain() {
    const text = els.input.value;
    els.chars.textContent = [...text].length;
    els.bytes.textContent = encoder.encode(text).length;
    digest = sha256Bytes(text);
    hexStr = bytesToHex(digest);
    renderHexLine(els.hex, hexStr);
    renderNibGrid(els.grid, digest);
    updateCompare();
  }

  function updateCompare() {
    const other = sha256Bytes(els.compare.value);
    const otherHex = bytesToHex(other);
    renderHexLine(els.compareHex, otherHex, hexStr);
    renderNibGrid(els.compareGrid, other, { compare: digest });

    const a = bytesToBits(digest), b = bytesToBits(other);
    let flips = 0;
    for (let i = 0; i < 256; i++) if (a[i] !== b[i]) flips++;
    const pct = (flips / 256) * 100;
    els.flipFill.style.width = pct + "%";
    els.flipValue.textContent = `${flips} / 256`;

    if (els.compare.value === els.input.value) {
      els.flipNote.textContent = "Identical input → identical hash. Now change just one character.";
    } else {
      els.flipNote.innerHTML = `<strong>${pct.toFixed(1)}%</strong> of the bits flipped. ` +
        "For a good hash, any change — however tiny — flips about 50% (≈128 bits), " +
        "with no visible connection between the two inputs and the two outputs.";
    }
  }

  function showInfo(i) {
    if (i == null) {
      els.info.className = "info-panel info-empty";
      els.info.innerHTML = '<span class="info-hint">Hover a hex digit to decode it into bits.</span>';
      return;
    }
    const h = hexStr[i];
    const v = parseInt(h, 16);
    const bits = v.toString(2).padStart(4, "0");
    const parts = [8, 4, 2, 1].filter((p, j) => bits[j] === "1");
    els.info.className = "info-panel";
    els.info.innerHTML =
      `<div class="info-item"><span class="k">Hex digit</span><span class="v glyph">${h}</span></div>` +
      `<div class="info-item"><span class="k">Position</span><span class="v">${i + 1} of 64</span></div>` +
      `<div class="info-item"><span class="k">Binary</span><span class="v">${bits}</span></div>` +
      `<div class="info-item"><span class="k">Decimal</span><span class="v">${parts.length ? parts.join(" + ") + " = " : ""}${v}</span></div>` +
      `<div class="info-item"><span class="k">Bits</span><span class="v">${i * 4 + 1}–${i * 4 + 4} of 256</span></div>`;
  }

  linkHexAndGrid(els.hex.closest(".card"), showInfo);
  linkHexAndGrid(els.compareHex.closest(".card"));

  els.input.addEventListener("input", updateMain);
  els.compare.addEventListener("input", updateCompare);
  els.reset.addEventListener("click", () => { els.compare.value = els.input.value; updateCompare(); els.compare.focus(); });
  els.copy.addEventListener("click", () => {
    navigator.clipboard?.writeText(hexStr).then(() => flashCopied(els.copy), () => {});
  });

  updateMain();
})();
