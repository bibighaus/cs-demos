"use strict";

/* ============================================================
   Public-Key Crypto Lab — RSA Math tab
   Build a key pair from p and q, then encrypt/decrypt a number
   with a visible square-and-multiply trace.
   ============================================================ */

(function () {
  const $ = id => document.getElementById(id);
  const els = {
    p: $("p-input"), q: $("q-input"), pqErr: $("pq-error"), steps: $("math-steps"),
    nPhi: $("n-phi"), eChips: $("e-chips"), eCheck: $("e-check"),
    euclid: $("euclid-table"), dCheck: $("d-check"),
    pub: $("pub-key-vals"), priv: $("priv-key-vals"),
    m: $("m-input"), mChar: $("m-char"), mErr: $("m-error"),
    roundtrip: $("roundtrip"), traceSeg: $("trace-seg"), traceIntro: $("trace-intro"), trace: $("trace-table")
  };
  if (!els.p) return;

  const MAX_PRIME = 1000000;
  const PUB = '<span class="ink-pub">', PRIV = '<span class="ink-priv">', END = "</span>";
  let key = null;           // { p, q, n, phi, e, d }
  let chosenE = 17n;
  let traceMode = "enc";

  const eq = (k, v, cls = "") => `<div class="eq ${cls}"><span class="eq-k">${k}</span><span class="eq-v">${v}</span></div>`;

  function validE(phi) {
    const list = [];
    for (let e = 3n; e < phi && list.length < 12; e += 2n) if (RSA.gcd(e, phi) === 1n) list.push(e);
    if (65537n < phi && RSA.gcd(65537n, phi) === 1n && !list.includes(65537n)) list.push(65537n);
    return list;
  }

  function buildKey() {
    const p = BigInt(Math.floor(+els.p.value || 0));
    const q = BigInt(Math.floor(+els.q.value || 0));
    let err = "";
    if (p < 2n || q < 2n) err = "p and q must be at least 2.";
    else if (p > MAX_PRIME || q > MAX_PRIME) err = `Keep p and q under ${fmtBig(MAX_PRIME)} so the numbers stay readable.`;
    else if (!RSA.isPrime(p)) err = `${p} isn't prime — ${smallFactor(p)} divides it.`;
    else if (!RSA.isPrime(q)) err = `${q} isn't prime — ${smallFactor(q)} divides it.`;
    else if (p === q) err = "p and q must be different primes (otherwise n is a perfect square and trivial to factor).";
    const phi = (p - 1n) * (q - 1n);
    if (!err && validE(phi).length === 0) err = "These primes are too small to leave any valid e. Try bigger ones.";
    els.pqErr.hidden = !err;
    els.pqErr.textContent = err;
    els.steps.classList.toggle("disabled", !!err);
    if (err) return null;

    const options = validE(phi);
    if (!options.includes(chosenE)) chosenE = options.includes(17n) ? 17n : options[0];
    const n = p * q, e = chosenE;
    return { p, q, n, phi, e, d: RSA.modInverse(e, phi), options };
  }

  function smallFactor(n) {
    for (let f = 2n; f * f <= n; f++) if (n % f === 0n) return f;
    return n;
  }

  function renderKey() {
    const { p, q, n, phi, e, d, options } = key;
    els.nPhi.innerHTML =
      eq("n = p × q", `${p} × ${q} = ${PUB}<strong>${fmtBig(n)}</strong>${END}`) +
      eq("φ(n) = (p − 1) × (q − 1)", `${p - 1n} × ${q - 1n} = ${PRIV}<strong>${fmtBig(phi)}</strong>${END}`);

    els.eChips.innerHTML = options.map(v =>
      `<button type="button" class="e-chip${v === e ? " active" : ""}" data-e="${v}">${fmtBig(v)}</button>`).join("");
    els.eCheck.innerHTML = eq("check", `gcd(${fmtBig(e)}, ${fmtBig(phi)}) = 1 ✓ &nbsp;so ${PUB}e = ${fmtBig(e)}${END}`);

    const { rows } = RSA.egcdSteps(phi, e);
    els.euclid.innerHTML = "<thead><tr><th>Step</th><th>Divide</th><th>= quotient × divisor + remainder</th></tr></thead><tbody>" +
      rows.map((r, i) => `<tr><td>${i + 1}</td><td>${fmtBig(r.a)} ÷ ${fmtBig(r.b)}</td>` +
        `<td>${fmtBig(r.a)} = ${fmtBig(r.q)} × ${fmtBig(r.b)} + <strong>${fmtBig(r.r)}</strong></td></tr>`).join("") +
      "</tbody>";
    const prod = e * d;
    els.dCheck.innerHTML =
      eq("result", `Working back up through these steps gives ${PRIV}<strong>d = ${fmtBig(d)}</strong>${END}`) +
      eq("check", `${fmtBig(e)} × ${fmtBig(d)} = ${fmtBig(prod)} = ${fmtBig(prod / phi)} × ${fmtBig(phi)} + <strong>1</strong> ✓`);

    els.pub.innerHTML = `<span><b>n</b> = ${fmtBig(n)}</span><span><b>e</b> = ${fmtBig(e)}</span>`;
    els.priv.innerHTML = `<span><b>d</b> = ${fmtBig(d)}</span><span class="dim">(and keep p, q, φ(n) secret)</span>`;
  }

  function renderMessage() {
    const { n, e, d } = key;
    const raw = els.m.value.trim();
    let m = /^\d+$/.test(raw) ? BigInt(raw) : null;
    let err = "";
    if (m === null) err = "m must be a whole number.";
    else if (m >= n) err = `m must be smaller than n = ${fmtBig(n)}. Pick bigger primes or a smaller message.`;
    els.mErr.hidden = !err;
    els.mErr.textContent = err;
    if (err) { els.roundtrip.innerHTML = ""; els.trace.innerHTML = ""; els.traceIntro.textContent = ""; return; }

    const encTrace = [], decTrace = [];
    const c = RSA.modPow(m, e, n, encTrace);
    const back = RSA.modPow(c, d, n, decTrace);
    const glyph = v => (v >= 32n && v < 0x110000n && !(v >= 0xd800n && v <= 0xdfffn)) ? ` <span class="dim">'${cs160EscapeHtml(cs160Glyph(Number(v), String.fromCodePoint(Number(v))))}'</span>` : "";

    els.roundtrip.innerHTML =
      `<div class="rt-box"><span class="k">plaintext m</span><span class="v">${fmtBig(m)}${glyph(m)}</span></div>` +
      `<div class="rt-arrow pub"><span>m<sup>${fmtBig(e)}</sup> mod ${fmtBig(n)}</span><span class="rt-key">public key</span></div>` +
      `<div class="rt-box cipher"><span class="k">ciphertext c</span><span class="v">${fmtBig(c)}</span></div>` +
      `<div class="rt-arrow priv"><span>c<sup>${fmtBig(d)}</sup> mod ${fmtBig(n)}</span><span class="rt-key">private key</span></div>` +
      `<div class="rt-box"><span class="k">decrypted</span><span class="v">${fmtBig(back)}${glyph(back)} ${back === m ? "✓" : "✗"}</span></div>`;

    const enc = traceMode === "enc";
    const base = enc ? m : c, exp = enc ? e : d, rows = enc ? encTrace : decTrace;
    const bin = exp.toString(2);
    els.traceIntro.innerHTML =
      `Computing ${enc ? "m" : "c"}<sup>${enc ? "e" : "d"}</sup> = ${fmtBig(base)}<sup>${fmtBig(exp)}</sup> by multiplying ${fmtBig(exp)} times ` +
      `would be slow, and the number would have thousands of digits. Instead, write the exponent in <strong>binary</strong>, ` +
      `<code>${bin}</code>, and read it left to right: for every bit, <em>square</em>; if the bit is 1, also <em>multiply by ${fmtBig(base)}</em>; ` +
      `then take <code>mod ${fmtBig(n)}</code>. Just <strong>${bin.length} steps</strong>.`;

    let html = "<thead><tr><th>Bit</th><th>Exponent so far</th><th>Square</th><th>× base?</th><th>Result mod n</th></tr></thead><tbody>";
    let prev = 1n;
    rows.forEach((r, i) => {
      const soFar = bin.slice(0, i + 1);
      html += `<tr class="${r.bit === "1" ? "bit1" : ""}"><td class="bitcell">${r.bit}</td>` +
        `<td><code>${soFar}</code> = ${fmtBig(BigInt("0b" + soFar))}</td>` +
        `<td>${fmtBig(prev)}² mod n = ${fmtBig(r.squared)}</td>` +
        `<td>${r.bit === "1" ? `× ${fmtBig(base)} → ${fmtBig(r.squared * base % n)}` : '<span class="dim">—</span>'}</td>` +
        `<td><strong>${fmtBig(r.result)}</strong></td></tr>`;
      prev = r.result;
    });
    els.trace.innerHTML = html + "</tbody>";
  }

  function update() {
    key = buildKey();
    if (!key) return;
    renderKey();
    renderMessage();
  }

  els.p.addEventListener("input", update);
  els.q.addEventListener("input", update);
  document.querySelectorAll("[data-pq]").forEach(b => b.addEventListener("click", () => {
    [els.p.value, els.q.value] = b.dataset.pq.split(",");
    update();
  }));
  $("pq-random").addEventListener("click", () => {
    const pick = () => { for (;;) { const v = 11 + Math.floor(Math.random() * 290); if (RSA.isPrime(v)) return v; } };
    const p = pick(); let q; do q = pick(); while (q === p);
    els.p.value = p; els.q.value = q;
    update();
  });
  els.eChips.addEventListener("click", ev => {
    const b = ev.target.closest("[data-e]");
    if (!b) return;
    chosenE = BigInt(b.dataset.e);
    update();
  });
  els.m.addEventListener("input", () => {
    const v = Number(els.m.value);
    els.mChar.value = Number.isInteger(v) && v >= 32 && v < 0x110000 && !(v >= 0xd800 && v <= 0xdfff) ? String.fromCodePoint(v) : "";
    if (key) renderMessage();
  });
  els.mChar.addEventListener("input", () => {
    const ch = [...els.mChar.value].pop();
    if (ch === undefined) return;
    els.mChar.value = ch;
    els.m.value = ch.codePointAt(0);
    if (key) renderMessage();
  });
  els.traceSeg.querySelectorAll(".seg-btn").forEach(btn => btn.addEventListener("click", () => {
    traceMode = btn.dataset.trace;
    els.traceSeg.querySelectorAll(".seg-btn").forEach(b => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", b === btn ? "true" : "false");
    });
    if (key) renderMessage();
  }));

  update();
})();
