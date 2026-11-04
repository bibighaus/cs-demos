"use strict";

/* ============================================================
   Public-Key Crypto Lab — Send a Secret tab
   Alice encrypts to Bob's public key; Eve watches the wire.
   ============================================================ */

(function () {
  const $ = id => document.getElementById(id);
  const els = {
    size: $("secret-size"), newKeys: $("bob-new-keys"), pub: $("bob-pub"), priv: $("bob-priv"),
    input: $("secret-input"), aliceBytes: $("alice-bytes"), chips: $("cipher-chips"),
    bobBytes: $("bob-bytes"), bobText: $("bob-text"),
    evePublic: $("eve-public"), eveFactor: $("eve-factor"), eveOut: $("eve-out")
  };
  if (!els.input) return;

  const enc = new TextEncoder();
  const dec = new TextDecoder();
  const esc = cs160EscapeHtml;
  let bits = 16;
  let key = RSA.generateKeys(bits);
  let bytes = [], cipher = [];

  const byteGlyph = b => (b >= 32 && b < 127) ? esc(cs160Glyph(b, String.fromCharCode(b))) : (b < 32 || b === 127 ? cs160Glyph(b) : "·");

  function renderKeys() {
    els.pub.innerHTML = `<span><b>n</b> = ${fmtBig(key.n)}</span><span><b>e</b> = ${fmtBig(key.e)}</span>` +
      `<span class="dim">n is ${RSA.bitLength(key.n)} bits</span>`;
    els.priv.innerHTML = `<span><b>d</b> = ${fmtBig(key.d)}</span>` +
      `<span class="dim">p = ${fmtBig(key.p)}, q = ${fmtBig(key.q)}</span>`;
  }

  function update() {
    bytes = [...enc.encode(els.input.value)];
    cipher = bytes.map(b => RSA.modPow(b, key.e, key.n));
    const plain = cipher.map(c => Number(RSA.modPow(c, key.d, key.n)));

    // Count repeats so identical ciphertexts can be pointed out.
    const counts = new Map();
    cipher.forEach(c => counts.set(c, (counts.get(c) || 0) + 1));

    els.aliceBytes.innerHTML = bytes.map((b, i) =>
      `<span class="bchip" data-i="${i}"><span class="bc-g">${byteGlyph(b)}</span><span class="bc-n">${b}</span></span>`).join("") ||
      '<span class="dim">Type a message.</span>';
    els.chips.innerHTML = cipher.map((c, i) =>
      `<span class="cchip${counts.get(c) > 1 ? " repeat" : ""}" data-i="${i}" data-c="${c}">${fmtBig(c)}</span>`).join("") ||
      '<span class="dim">(nothing sent)</span>';
    els.bobBytes.innerHTML = plain.map((b, i) =>
      `<span class="bchip" data-i="${i}"><span class="bc-g">${byteGlyph(b)}</span><span class="bc-n">${b}</span></span>`).join("");
    els.bobText.textContent = plain.length ? dec.decode(new Uint8Array(plain)) : "";
    els.eveOut.innerHTML = "";
  }

  /* ---------- Hover linking across the three columns ---------- */
  const flow = document.querySelector("#tab-secret .flow");
  const clear = () => flow.querySelectorAll(".active, .same").forEach(n => n.classList.remove("active", "same"));
  flow.addEventListener("mouseover", e => {
    const t = e.target.closest("[data-i]");
    if (!t) return;
    clear();
    const i = t.dataset.i;
    const c = cipher[+i];
    flow.querySelectorAll(`[data-i="${i}"]`).forEach(n => n.classList.add("active"));
    flow.querySelectorAll(`.cchip[data-c="${c}"]:not([data-i="${i}"])`).forEach(n => n.classList.add("same"));
  });
  flow.addEventListener("mouseleave", clear);

  /* ---------- Eve's attempts ---------- */
  els.evePublic.addEventListener("click", () => {
    if (!cipher.length) return;
    const tried = cipher.map(c => RSA.modPow(c, key.e, key.n));
    const shown = tried.slice(0, 8).map(fmtBig).join(", ") + (tried.length > 8 ? ", …" : "");
    els.eveOut.innerHTML =
      `<p><strong>Eve computes c<sup>e</sup> mod n</strong> with the public key and gets: <code>${shown}</code></p>` +
      `<p class="fail">✗ Nonsense. Applying the public key again just scrambles it further. Only <span class="ink-priv">d</span> undoes <span class="ink-pub">e</span>, and d isn't public.</p>`;
  });

  els.eveFactor.addEventListener("click", () => {
    els.eveOut.innerHTML = "<p>Eve is trying divisors 3, 5, 7, 9, … to split n into p × q …</p>";
    setTimeout(() => {
      const n = Number(key.n);
      const t0 = performance.now();
      let f = 0, tries = 0;
      if (n % 2 === 0) f = 2;
      else for (let k = 3; k * k <= n; k += 2) { tries++; if (n % k === 0) { f = k; break; } }
      const ms = performance.now() - t0;
      const p = BigInt(f), q = key.n / p;
      const phi = (p - 1n) * (q - 1n), d = RSA.modInverse(key.e, phi);
      const stolen = dec.decode(new Uint8Array(cipher.map(c => Number(RSA.modPow(c, d, key.n)))));
      els.eveOut.innerHTML =
        `<p><strong>Found it</strong> after ${fmtBig(tries)} divisions (${ms < 1 ? "<1" : Math.round(ms)} ms): ` +
        `n = ${fmtBig(p)} × ${fmtBig(q)}.</p>` +
        `<p>Now she computes φ(n) = ${fmtBig(phi)} and d = ${fmtBig(d)}, exactly like Bob did&hellip;</p>` +
        `<p class="fail">✗ Eve reads: <q>${esc(stolen)}</q></p>` +
        `<p class="dim">Each extra bit in the primes roughly doubles Eve's work. For a real 2048-bit key, ` +
        `this method would need around 2<sup>1024</sup> divisions (a 309-digit number). Even the best known ` +
        `factoring algorithms are hopeless at that size.</p>`;
    }, 30);
  });

  /* ---------- Controls ---------- */
  els.size.querySelectorAll(".seg-btn").forEach(btn => btn.addEventListener("click", () => {
    bits = +btn.dataset.bits;
    els.size.querySelectorAll(".seg-btn").forEach(b => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", b === btn ? "true" : "false");
    });
    key = RSA.generateKeys(bits);
    renderKeys(); update();
  }));
  els.newKeys.addEventListener("click", () => { key = RSA.generateKeys(bits); renderKeys(); update(); });
  els.input.addEventListener("input", update);

  renderKeys();
  update();
})();
