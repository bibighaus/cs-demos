"use strict";

/* ============================================================
   Hashing Lab — Math Hashes tab
   Three simple, non-cryptographic hash recipes built from
   arithmetic, a step-by-step trace, and a hash-table bucket view.
   ============================================================ */

const MATH_RECIPES = {
  sum: {
    formula: "h = (code₁ + code₂ + … + codeₙ)<br>bucket = h mod m",
    desc: "Add up every character code. Simple — but addition doesn't care about order, so anagrams always collide.",
    start: 0,
    step: (h, c) => h + c,
    stepText: (h, c) => `${h} + ${c}`,
    bits: null
  },
  poly: {
    formula: "h = 0;  for each character:  h = (h × 31 + code) mod 2³²<br>bucket = h mod m",
    desc: "Multiply the running total by 31 before adding each character, so a letter's position changes its contribution. This is exactly Java's String.hashCode().",
    start: 0,
    step: (h, c) => (Math.imul(h, 31) + c) >>> 0,
    stepText: (h, c) => `${h} × 31 + ${c}`,
    bits: 32
  },
  fnv: {
    formula: "h = 2166136261;  for each character:  h = (h XOR code) × 16777619 mod 2³²<br>bucket = h mod m",
    desc: "FNV-1a, a real hash used in compilers, databases, and DNS servers. XOR mixes the character's bits in, and multiplying by a large prime smears them across all 32 bits.",
    start: 2166136261,
    step: (h, c) => Math.imul((h ^ c) >>> 0, 16777619) >>> 0,
    stepText: (h, c) => `(${h} XOR ${c}) × 16777619`,
    bits: 32
  }
};

const WORD_LISTS = {
  anagrams: "listen silent enlist tinsel inlets stop pots tops spot post cat act",
  animals: "cat dog cow pig hen owl bat fox ant bee elk yak emu ram eel gnu ape"
};

function mathHash(recipe, word) {
  const r = MATH_RECIPES[recipe];
  let h = r.start;
  const steps = [];
  for (const ch of word) {
    const c = ch.codePointAt(0);
    const before = h;
    h = r.step(h, c);
    steps.push({ ch, c, before, after: h });
  }
  return { h, steps };
}

(function () {
  const $ = id => document.getElementById(id);
  const els = {
    seg: $("recipe-seg"), formula: $("recipe-formula"), desc: $("recipe-desc"),
    input: $("math-input"), slider: $("m-slider"), mValue: $("m-value"),
    table: $("step-table"), result: $("math-result"), modNote: $("mod-note"),
    words: $("bucket-words"), stats: $("bucket-stats"), buckets: $("buckets")
  };
  if (!els.seg) return;

  let recipe = "sum";
  let m = 16;
  const esc = cs160EscapeHtml;

  const isPow2 = n => (n & (n - 1)) === 0;
  const log2 = n => Math.round(Math.log2(n));

  /** Binary string, optionally with the last `lowBits` bits highlighted. */
  function binHtml(n, width, lowBits) {
    const s = n.toString(2).padStart(width, "0");
    const grouped = s => s.replace(/(.{4})(?=.)/g, "$1 ").trim();
    if (!lowBits) return grouped(s);
    const split = s.length - lowBits;
    // Group the full string by 4 from the left, then wrap the tail in a span.
    let out = "", count = 0;
    for (let i = 0; i < s.length; i++) {
      if (i === split) out += '<span class="lowbits">';
      out += s[i];
      count++;
      if (count % 4 === 0 && i < s.length - 1) out += " ";
    }
    return out + (split < s.length ? "</span>" : "");
  }

  function renderRecipe() {
    const r = MATH_RECIPES[recipe];
    els.formula.innerHTML = r.formula;
    els.desc.textContent = r.desc;
  }

  function renderSingle() {
    const word = els.input.value;
    const { h, steps } = mathHash(recipe, word);
    const r = MATH_RECIPES[recipe];

    let html = "<thead><tr><th>#</th><th>Char</th><th>Code</th><th>Computation</th><th>h</th></tr></thead><tbody>";
    html += `<tr class="start-row"><td></td><td colspan="3">start</td><td>${r.start}</td></tr>`;
    steps.forEach((s, i) => {
      html += `<tr><td>${i + 1}</td><td class="ch">${esc(cs160Glyph(s.c, s.ch))}</td><td>${s.c}</td>` +
        `<td class="calc">${r.stepText(s.before, s.c)}</td><td>${s.after}</td></tr>`;
    });
    if (!steps.length) html += '<tr><td colspan="5" class="empty-row">Type a word above.</td></tr>';
    els.table.innerHTML = html + "</tbody>";

    const bucket = h % m;
    const width = r.bits || Math.max(8, Math.ceil(Math.log2(h + 1) / 4) * 4);
    const low = isPow2(m) ? log2(m) : 0;
    const bWidth = Math.max(1, Math.ceil(Math.log2(m)));
    els.result.innerHTML =
      `<div class="rr"><span class="k">h (decimal)</span><span class="v">${h}</span></div>` +
      `<div class="rr"><span class="k">h (binary)</span><span class="v bin">${binHtml(h, width, low)}</span></div>` +
      `<div class="rr"><span class="k">h mod ${m}</span><span class="v">${h} mod ${m} = <strong class="hl-num">${bucket}</strong></span></div>` +
      `<div class="rr"><span class="k">bucket (binary)</span><span class="v bin">${binHtml(bucket, bWidth, low)}</span></div>`;

    els.modNote.innerHTML = low
      ? `<strong>Binary shortcut:</strong> m = ${m} = 2<sup>${low}</sup>, so <code>mod ${m}</code> simply keeps the
         last ${low} bits (highlighted) and throws the rest away. Fast &mdash; but it means only those
         low bits matter, so a weak recipe whose low bits don't vary much will pile words into the same buckets.`
      : `<strong>m = ${m} isn't a power of 2,</strong> so <code>mod ${m}</code> depends on <em>all</em> the bits of h,
         not just the last few. That's why hash tables often use a prime number of buckets.`;
    return bucket;
  }

  function parseWords() {
    const seen = new Set();
    return els.words.value.split(/[\s,]+/).filter(w => w && !seen.has(w) && seen.add(w));
  }

  function renderBuckets(currentBucket) {
    const words = parseWords();
    const table = Array.from({ length: m }, () => []);
    words.forEach(w => table[mathHash(recipe, w).h % m].push(w));
    const used = table.filter(b => b.length).length;
    const collisions = words.length - used;
    const longest = Math.max(0, ...table.map(b => b.length));

    els.stats.innerHTML =
      `<div class="info-item"><span class="k">Words</span><span class="v">${words.length}</span></div>` +
      `<div class="info-item"><span class="k">Buckets used</span><span class="v">${used} / ${m}</span></div>` +
      `<div class="info-item"><span class="k">Collisions</span><span class="v">${collisions}</span></div>` +
      `<div class="info-item"><span class="k">Most in one bucket</span><span class="v">${longest}</span></div>` +
      (words.length > m ? `<div class="info-item"><span class="k">Pigeonhole</span><span class="v">${words.length} words &gt; ${m} buckets</span></div>` : "");

    els.buckets.innerHTML = table.map((b, i) => {
      const cls = ["bucket"];
      if (b.length > 1) cls.push("collide");
      if (!b.length) cls.push("empty");
      if (i === currentBucket) cls.push("current");
      return `<div class="${cls.join(" ")}" title="bucket ${i}"><span class="bk-i">${i}</span>` +
        `<span class="bk-words">${b.map(w => `<span class="bk-w">${esc(w)}</span>`).join("")}</span></div>`;
    }).join("");
  }

  function update() {
    els.mValue.textContent = m;
    renderBuckets(renderSingle());
  }

  els.seg.querySelectorAll(".seg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      recipe = btn.dataset.recipe;
      els.seg.querySelectorAll(".seg-btn").forEach(b => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      renderRecipe();
      update();
    });
  });
  els.slider.addEventListener("input", () => { m = +els.slider.value; update(); });
  document.querySelectorAll("[data-m]").forEach(btn => btn.addEventListener("click", () => {
    m = +btn.dataset.m; els.slider.value = m; update();
  }));
  els.input.addEventListener("input", update);
  els.words.addEventListener("input", update);
  $("words-anagrams").addEventListener("click", () => { els.words.value = WORD_LISTS.anagrams; update(); });
  $("words-animals").addEventListener("click", () => { els.words.value = WORD_LISTS.animals; update(); });

  els.words.value = WORD_LISTS.animals;
  renderRecipe();
  update();
})();
