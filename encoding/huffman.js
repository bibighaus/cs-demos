"use strict";

/* ============================================================
   Text Encoding Explorer — Huffman coding tab
   ============================================================ */

(function () {
  const els = {
    input: document.getElementById("huffman-input"),
    charCount: document.getElementById("huffman-char-count"),
    info: document.getElementById("huffman-info-panel"),
    emptyNote: document.getElementById("huffman-empty-note"),
    content: document.getElementById("huffman-content"),
    treeWrap: document.getElementById("huffman-tree-wrap"),
    tableBody: document.getElementById("huffman-table-body"),
    bitsView: document.getElementById("huffman-bits-view"),
    statSymbols: document.getElementById("h-stat-symbols"),
    statHuffBits: document.getElementById("h-stat-huffman-bits"),
    statAsciiBits: document.getElementById("h-stat-ascii-bits"),
    statSaved: document.getElementById("h-stat-saved"),
    barHuff: document.getElementById("h-bar-huffman"),
    barAscii: document.getElementById("h-bar-ascii"),
    barHuffValue: document.getElementById("h-bar-huffman-value"),
    barAsciiValue: document.getElementById("h-bar-ascii-value"),
    tab: document.getElementById("tab-huffman")
  };

  if (!els.input) return;

  const SVG_NS = "http://www.w3.org/2000/svg";
  let leavesBySymIdx = [];

  function buildTree(text) {
    const freq = new Map();
    for (const ch of text) freq.set(ch, (freq.get(ch) || 0) + 1);
    if (freq.size === 0) return null;

    let order = 0;
    const leaves = Array.from(freq, ([symbol, count]) => (
      { symbol, freq: count, left: null, right: null, order: order++, isLeaf: true }
    ));

    if (leaves.length === 1) {
      leaves[0].code = "0";
      return { root: leaves[0], leaves };
    }

    const queue = leaves.slice();
    while (queue.length > 1) {
      queue.sort((a, b) => (a.freq - b.freq) || (a.order - b.order));
      const a = queue.shift();
      const b = queue.shift();
      queue.push({ freq: a.freq + b.freq, left: a, right: b, order: order++, isLeaf: false });
    }
    const root = queue[0];

    (function assign(node, prefix) {
      if (!node) return;
      if (node.isLeaf) { node.code = prefix || "0"; return; }
      assign(node.left, prefix + "0");
      assign(node.right, prefix + "1");
    })(root, "");

    return { root, leaves };
  }

  function layout(root) {
    let leafIndex = 0;
    let maxDepth = 0;
    (function walk(node, depth) {
      node.depth = depth;
      maxDepth = Math.max(maxDepth, depth);
      if (node.isLeaf) {
        node.x = leafIndex++;
      } else {
        walk(node.left, depth + 1);
        walk(node.right, depth + 1);
        node.x = (node.left.x + node.right.x) / 2;
      }
    })(root, 0);
    return { leafCount: leafIndex, maxDepth };
  }

  function tierClassFor(len, min, max) {
    if (max === min) return "";
    const ratio = (len - min) / (max - min);
    if (ratio <= 0.25) return "";
    if (ratio <= 0.55) return "t2";
    if (ratio <= 0.8) return "t3";
    return "t4";
  }

  function buildSvg(root, dims, minLen, maxLen) {
    const xSpacing = 52, ySpacing = 58, marginX = 30, marginY = 22;
    const width = Math.max(2 * marginX + (dims.leafCount - 1) * xSpacing, 140);
    const height = 2 * marginY + dims.maxDepth * ySpacing + 14;

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.classList.add("huffman-tree-svg");

    function pos(node) {
      return { px: marginX + node.x * xSpacing, py: marginY + node.depth * ySpacing };
    }

    function drawEdge(x1, y1, x2, y2, label) {
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", x1); line.setAttribute("y1", y1);
      line.setAttribute("x2", x2); line.setAttribute("y2", y2);
      line.setAttribute("class", "tree-edge");
      svg.appendChild(line);

      const t = document.createElementNS(SVG_NS, "text");
      t.setAttribute("x", (x1 + x2) / 2 + (x2 > x1 ? 7 : -7));
      t.setAttribute("y", (y1 + y2) / 2 - 2);
      t.setAttribute("text-anchor", x2 > x1 ? "start" : "end");
      t.setAttribute("class", "tree-edge-label");
      t.textContent = label;
      svg.appendChild(t);
    }

    function drawNode(n, px, py) {
      const g = document.createElementNS(SVG_NS, "g");
      g.classList.add("tree-node", n.isLeaf ? "tree-leaf" : "tree-internal");
      if (n.isLeaf) g.dataset.symIdx = String(n.symIdx);

      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("cx", px);
      circle.setAttribute("cy", py);
      circle.setAttribute("r", n.isLeaf ? 15 : 4);
      circle.classList.add("tree-circle");
      if (n.isLeaf) {
        const tCls = tierClassFor(n.code.length, minLen, maxLen);
        if (tCls) circle.classList.add(tCls);
      }
      g.appendChild(circle);

      if (n.isLeaf) {
        const label = document.createElementNS(SVG_NS, "text");
        label.setAttribute("x", px);
        label.setAttribute("y", py + 4);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("class", "tree-symbol");
        label.textContent = cs160Glyph(n.symbol.codePointAt(0), n.symbol) || n.symbol;
        g.appendChild(label);

        const freqLabel = document.createElementNS(SVG_NS, "text");
        freqLabel.setAttribute("x", px);
        freqLabel.setAttribute("y", py + 28);
        freqLabel.setAttribute("text-anchor", "middle");
        freqLabel.setAttribute("class", "tree-freq");
        freqLabel.textContent = String(n.freq);
        g.appendChild(freqLabel);
      } else {
        const freqLabel = document.createElementNS(SVG_NS, "text");
        freqLabel.setAttribute("x", px);
        freqLabel.setAttribute("y", py - 9);
        freqLabel.setAttribute("text-anchor", "middle");
        freqLabel.setAttribute("class", "tree-internal-freq");
        freqLabel.textContent = String(n.freq);
        g.appendChild(freqLabel);
      }
      svg.appendChild(g);
    }

    function draw(n) {
      const { px, py } = pos(n);
      if (n.left) { const c = pos(n.left); drawEdge(px, py, c.px, c.py, "0"); draw(n.left); }
      if (n.right) { const c = pos(n.right); drawEdge(px, py, c.px, c.py, "1"); draw(n.right); }
      drawNode(n, px, py);
    }
    draw(root);
    return svg;
  }

  function clearHighlight() {
    els.tab.querySelectorAll(".active").forEach(el => el.classList.remove("active"));
    els.tab.querySelectorAll(".active-row").forEach(el => el.classList.remove("active-row"));
    els.tab.querySelectorAll(".tree-active").forEach(el => el.classList.remove("tree-active"));
    els.info.classList.add("info-empty");
    els.info.innerHTML = '<span class="info-hint">Hover a leaf in the tree, a row in the table, or a code below to inspect it.</span>';
  }

  function showLeafInfo(leaf, totalChars) {
    els.info.classList.remove("info-empty");
    const glyph = cs160Glyph(leaf.symbol.codePointAt(0), leaf.symbol) || leaf.symbol;
    const pct = (leaf.freq / totalChars * 100).toFixed(1);
    els.info.innerHTML = `
      <div class="info-item"><span class="k">Symbol</span><span class="v glyph">${cs160EscapeHtml(glyph)}</span></div>
      <div class="info-item"><span class="k">Count</span><span class="v">${leaf.freq}</span></div>
      <div class="info-item"><span class="k">Frequency</span><span class="v">${pct}%</span></div>
      <div class="info-item"><span class="k">Code</span><span class="v">${leaf.code}</span></div>
      <div class="info-item"><span class="k">Bits</span><span class="v">${leaf.code.length}</span></div>
    `;
  }

  function highlightSymIdx(symIdx, totalChars) {
    clearHighlight();
    els.tab.querySelectorAll(`[data-sym-idx="${symIdx}"]`).forEach(el => {
      if (el.tagName === "TR") el.classList.add("active-row");
      else if (el.tagName === "g") el.classList.add("tree-active");
      else el.classList.add("active");
    });
    const leaf = leavesBySymIdx[symIdx];
    if (leaf) showLeafInfo(leaf, totalChars);
  }

  function render() {
    const text = els.input.value;
    clearHighlight();
    els.charCount.textContent = String(text.length);

    const built = buildTree(text);
    if (!built) {
      els.emptyNote.hidden = false;
      els.content.hidden = true;
      els.statSymbols.textContent = "0";
      return;
    }
    els.emptyNote.hidden = true;
    els.content.hidden = false;

    const { root, leaves } = built;
    const sorted = leaves.slice().sort((a, b) => (b.freq - a.freq) || (a.order - b.order));
    sorted.forEach((leaf, idx) => { leaf.symIdx = idx; });
    leavesBySymIdx = sorted;

    const dims = layout(root);
    const lens = leaves.map(l => l.code.length);
    const minLen = Math.min(...lens);
    const maxLen = Math.max(...lens);

    els.statSymbols.textContent = String(sorted.length);

    // symbol table
    els.tableBody.innerHTML = "";
    sorted.forEach(leaf => {
      const tr = document.createElement("tr");
      tr.dataset.symIdx = String(leaf.symIdx);
      const glyph = cs160Glyph(leaf.symbol.codePointAt(0), leaf.symbol) || leaf.symbol;
      const pct = (leaf.freq / text.length * 100).toFixed(1);
      const tCls = tierClassFor(leaf.code.length, minLen, maxLen);
      tr.innerHTML =
        `<td>${cs160EscapeHtml(glyph)}</td><td>${leaf.freq}</td><td>${pct}%</td>` +
        `<td class="${tCls}">${leaf.code}</td><td>${leaf.code.length}</td>`;
      els.tableBody.appendChild(tr);
    });

    // tree
    els.treeWrap.innerHTML = "";
    els.treeWrap.appendChild(buildSvg(root, dims, minLen, maxLen));

    // encoded bitstream
    const codeBySymbol = new Map(leaves.map(l => [l.symbol, l.code]));
    const symIdxBySymbol = new Map(sorted.map(l => [l.symbol, l.symIdx]));
    let totalBits = 0;
    const bitsFrag = document.createDocumentFragment();
    for (const ch of text) {
      const code = codeBySymbol.get(ch);
      totalBits += code.length;
      const span = document.createElement("span");
      const tCls = tierClassFor(code.length, minLen, maxLen);
      span.className = "unit" + (tCls ? " " + tCls : "");
      span.dataset.symIdx = String(symIdxBySymbol.get(ch));
      span.textContent = code;
      bitsFrag.appendChild(span);
    }
    els.bitsView.innerHTML = "";
    els.bitsView.appendChild(bitsFrag);

    // savings stats
    const asciiBits = text.length * 8;
    const savedPct = asciiBits > 0 ? (1 - totalBits / asciiBits) * 100 : 0;
    els.statHuffBits.textContent = String(totalBits);
    els.statAsciiBits.textContent = String(asciiBits);
    els.statSaved.textContent = savedPct >= 0
      ? savedPct.toFixed(0) + "% smaller"
      : Math.abs(savedPct).toFixed(0) + "% larger";

    const maxBar = Math.max(totalBits, asciiBits, 1);
    els.barHuff.style.width = (totalBits / maxBar * 100) + "%";
    els.barAscii.style.width = (asciiBits / maxBar * 100) + "%";
    els.barHuffValue.textContent = totalBits + " bits";
    els.barAsciiValue.textContent = asciiBits + " bits";
  }

  els.tab.addEventListener("mouseover", e => {
    const el = e.target.closest("[data-sym-idx]");
    if (!el) return;
    highlightSymIdx(Number(el.dataset.symIdx), els.input.value.length);
  });

  els.tab.addEventListener("mouseout", e => {
    const related = e.relatedTarget;
    if (related && related.closest && related.closest("[data-sym-idx]")) return;
    clearHighlight();
  });

  els.input.addEventListener("input", render);

  render();
})();
