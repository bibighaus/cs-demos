"use strict";

/* ============================================================
   Text Encoding Explorer — Unicode / UTF-8 tab
   ============================================================ */

(function () {
  const els = {
    input: document.getElementById("unicode-input"),
    charCount: document.getElementById("unicode-char-count"),
    byteCount: document.getElementById("unicode-byte-count"),
    info: document.getElementById("unicode-info-panel"),
    groups: document.getElementById("unicode-groups"),
    lengthTableBody: document.getElementById("unicode-length-table-body"),
    statChars: document.getElementById("u-stat-chars"),
    statBytes: document.getElementById("u-stat-bytes"),
    statAscii: document.getElementById("u-stat-ascii"),
    statRatio: document.getElementById("u-stat-ratio"),
    barUtf8: document.getElementById("u-bar-utf8"),
    barAscii: document.getElementById("u-bar-ascii"),
    barUtf8Value: document.getElementById("u-bar-utf8-value"),
    barAsciiValue: document.getElementById("u-bar-ascii-value"),
    noAsciiNote: document.getElementById("u-no-ascii-note"),
    tab: document.getElementById("tab-unicode")
  };

  if (!els.input) return;

  const encoder = new TextEncoder();

  const LENGTH_RULES = [
    { tier: 1, range: "U+0000 – U+007F", bytes: 1, example: "A" },
    { tier: 2, range: "U+0080 – U+07FF", bytes: 2, example: "é" },
    { tier: 3, range: "U+0800 – U+FFFF", bytes: 3, example: "日" },
    { tier: 4, range: "U+10000 – U+10FFFF", bytes: 4, example: "🔥" }
  ];

  function tierClass(tier) {
    return tier === 1 ? "" : tier === 2 ? "t2" : tier === 3 ? "t3" : "t4";
  }

  function codePointHex(cp) {
    return "U+" + cp.toString(16).toUpperCase().padStart(4, "0");
  }

  function blockLabel(tier) {
    switch (tier) {
      case 1: return "Basic Latin (the ASCII range)";
      case 2: return "Latin/Greek/Cyrillic extensions, and more";
      case 3: return "Most of the BMP — CJK, symbols, and more";
      default: return "Supplementary plane — emoji & rare scripts";
    }
  }

  let charData = [];

  function render() {
    const text = els.input.value;
    const chars = Array.from(text);
    charData = [];

    const frag = document.createDocumentFragment();
    let totalBytes = 0;
    let nonAsciiCount = 0;
    const nonAsciiSamples = [];

    chars.forEach((ch, i) => {
      const cp = ch.codePointAt(0);
      const bytes = Array.from(encoder.encode(ch));
      const tier = bytes.length;
      totalBytes += bytes.length;
      if (cp > 127) {
        nonAsciiCount++;
        if (nonAsciiSamples.length < 6) nonAsciiSamples.push(ch);
      }

      charData.push({ ch, cp, bytes, tier });

      const group = document.createElement("div");
      group.className = "u-group";
      group.dataset.idx = String(i);
      group.dataset.tier = String(tier);

      const tCls = tierClass(tier);
      const glyphSpan = document.createElement("span");
      glyphSpan.className = "unit u-glyph" + (tCls ? " " + tCls : "");
      glyphSpan.textContent = cs160Glyph(cp, ch);

      const cpLabel = document.createElement("span");
      cpLabel.className = "u-cp";
      cpLabel.textContent = codePointHex(cp);

      const byteRow = document.createElement("div");
      byteRow.className = "u-bytes";
      bytes.forEach(b => {
        const bSpan = document.createElement("span");
        bSpan.className = "unit" + (tCls ? " " + tCls : "");
        bSpan.textContent = b.toString(16).toUpperCase().padStart(2, "0");
        byteRow.appendChild(bSpan);
      });

      group.appendChild(glyphSpan);
      group.appendChild(cpLabel);
      group.appendChild(byteRow);
      frag.appendChild(group);
    });

    els.groups.innerHTML = "";
    els.groups.appendChild(frag);

    els.charCount.textContent = String(chars.length);
    els.byteCount.textContent = String(totalBytes);

    const asciiEquivalent = chars.length;
    const ratio = asciiEquivalent > 0 ? totalBytes / asciiEquivalent : 0;
    els.statChars.textContent = String(chars.length);
    els.statBytes.textContent = String(totalBytes);
    els.statAscii.textContent = String(asciiEquivalent);
    els.statRatio.textContent = asciiEquivalent > 0 ? ratio.toFixed(2) + "×" : "—";

    const maxBar = Math.max(totalBytes, asciiEquivalent, 1);
    els.barUtf8.style.width = (totalBytes / maxBar * 100) + "%";
    els.barAscii.style.width = (asciiEquivalent / maxBar * 100) + "%";
    els.barUtf8Value.textContent = totalBytes + " bytes";
    els.barAsciiValue.textContent = asciiEquivalent + " bytes";

    if (nonAsciiCount > 0) {
      els.noAsciiNote.hidden = false;
      els.noAsciiNote.innerHTML =
        `<strong>${nonAsciiCount}</strong> of these characters (e.g. ${cs160EscapeHtml(nonAsciiSamples.join(" "))}) ` +
        `have no ASCII code point at all — there's no 1-byte way to write them.`;
    } else {
      els.noAsciiNote.hidden = true;
    }
  }

  function clearHighlight() {
    els.tab.querySelectorAll(".active").forEach(el => el.classList.remove("active"));
    els.tab.querySelectorAll(".active-row").forEach(el => el.classList.remove("active-row"));
    els.info.classList.add("info-empty");
    els.info.innerHTML = '<span class="info-hint">Hover a character above, or a row in the table below, to inspect it.</span>';
  }

  function showCharInfo(d) {
    els.info.classList.remove("info-empty");
    const bytesHex = d.bytes.map(b => b.toString(16).toUpperCase().padStart(2, "0")).join(" ");
    const glyph = cs160Glyph(d.cp, d.ch);
    els.info.innerHTML = `
      <div class="info-item"><span class="k">Character</span><span class="v glyph">${cs160EscapeHtml(glyph)}</span></div>
      <div class="info-item"><span class="k">Code point</span><span class="v">${codePointHex(d.cp)}</span></div>
      <div class="info-item"><span class="k">UTF-8 bytes</span><span class="v">${bytesHex}</span></div>
      <div class="info-item"><span class="k">Length</span><span class="v">${d.bytes.length} byte${d.bytes.length > 1 ? "s" : ""}</span></div>
      <div class="info-item"><span class="k">Range</span><span class="v">${cs160EscapeHtml(blockLabel(d.tier))}</span></div>
    `;
  }

  function showTierInfo(tier) {
    const rule = LENGTH_RULES[tier - 1];
    els.info.classList.remove("info-empty");
    els.info.innerHTML = `
      <div class="info-item"><span class="k">Range</span><span class="v">${rule.range}</span></div>
      <div class="info-item"><span class="k">UTF-8 length</span><span class="v">${rule.bytes} byte${rule.bytes > 1 ? "s" : ""}</span></div>
      <div class="info-item"><span class="k">Covers</span><span class="v">${cs160EscapeHtml(blockLabel(tier))}</span></div>
      <div class="info-item"><span class="k">Example</span><span class="v glyph">${rule.example}</span></div>
    `;
  }

  function buildLengthTable() {
    els.lengthTableBody.innerHTML = "";
    LENGTH_RULES.forEach(rule => {
      const tr = document.createElement("tr");
      tr.dataset.tier = String(rule.tier);
      const tCls = tierClass(rule.tier);
      tr.innerHTML = `<td>${cs160EscapeHtml(rule.range)}</td><td>${rule.bytes}</td><td class="${tCls}">${cs160EscapeHtml(rule.example)}</td>`;
      els.lengthTableBody.appendChild(tr);
    });
  }

  els.tab.addEventListener("mouseover", e => {
    const group = e.target.closest(".u-group[data-idx]");
    if (group) {
      clearHighlight();
      group.classList.add("active");
      const idx = Number(group.dataset.idx);
      const tier = Number(group.dataset.tier);
      const row = els.lengthTableBody.querySelector(`tr[data-tier="${tier}"]`);
      if (row) row.classList.add("active-row");
      showCharInfo(charData[idx]);
      return;
    }
    const row = e.target.closest("tr[data-tier]");
    if (row) {
      clearHighlight();
      row.classList.add("active-row");
      const tier = Number(row.dataset.tier);
      els.groups.querySelectorAll(`.u-group[data-tier="${tier}"]`).forEach(g => g.classList.add("active"));
      showTierInfo(tier);
    }
  });

  els.tab.addEventListener("mouseout", e => {
    const related = e.relatedTarget;
    if (related && (related.closest(".u-group") || related.closest("tr[data-tier]"))) return;
    clearHighlight();
  });

  els.input.addEventListener("input", () => { clearHighlight(); render(); });

  buildLengthTable();
  render();
})();
