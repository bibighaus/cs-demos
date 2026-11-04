"use strict";

/* ============================================================
   Hashing Lab — Proof of Work tab
   A toy Bitcoin-style miner: find a nonce whose SHA-256 block
   hash starts with at least N zero bits.
   ============================================================ */

(function () {
  const $ = id => document.getElementById(id);
  const els = {
    data: $("pow-data"), nonce: $("pow-nonce"), up: $("nonce-up"), down: $("nonce-down"),
    preimage: $("pow-preimage"), slider: $("diff-slider"), diffValue: $("diff-value"),
    odds: $("diff-odds"), target: $("target-line"), hex: $("pow-hex"), grid: $("pow-grid"),
    status: $("pow-status"), zeros: $("pow-zeros"), mine: $("mine-btn"),
    attempts: $("mine-attempts"), rate: $("mine-rate"), expected: $("mine-expected")
  };
  if (!els.data) return;

  let difficulty = 8;
  let mining = false;
  const fmt = n => n.toLocaleString("en-US");

  const preimage = nonce => `${els.data.value}|${nonce}`;
  const getNonce = () => Math.max(0, Math.floor(+els.nonce.value) || 0);

  function renderTarget() {
    const shown = 32;
    let html = "";
    for (let i = 0; i < shown; i++) {
      html += i < difficulty ? '<span class="tz">0</span>' : '<span class="tq">?</span>';
      if (i % 4 === 3) html += " ";
    }
    els.target.innerHTML = `<span class="tl-k">Target:</span> ${html}<span class="tq">&hellip; (256 bits)</span>`;
    els.diffValue.textContent = difficulty;
    const tries = 2 ** difficulty;
    els.odds.textContent = `≈ 1 in ${fmt(tries)} hashes qualifies`;
    els.expected.textContent = `~${fmt(tries)}`;
  }

  function render() {
    const nonce = getNonce();
    const text = preimage(nonce);
    els.preimage.textContent = text.replace(/\n/g, "⏎");
    const bytes = sha256Bytes(text);
    const hex = bytesToHex(bytes);
    const lz = leadingZeroBits(bytes);
    renderHexLine(els.hex, hex, null, Math.floor(lz / 4));
    renderNibGrid(els.grid, bytes, { zeros: lz, target: difficulty });
    els.zeros.textContent = lz;
    const ok = lz >= difficulty;
    els.status.className = "pow-status " + (ok ? "ok" : "bad");
    els.status.textContent = ok
      ? `✓ Valid block — ${lz} ≥ ${difficulty} zero bits`
      : `✗ Not valid — needs ${difficulty} zero bits, has ${lz}`;
  }

  function stopMining() {
    mining = false;
    els.mine.textContent = "⛏ Mine (try nonces until it works)";
    els.mine.classList.remove("running");
  }

  function startMining() {
    mining = true;
    els.mine.textContent = "■ Stop mining";
    els.mine.classList.add("running");
    const prefix = els.data.value + "|";
    let nonce = getNonce();
    // If the current nonce already works, look for the next one.
    if (leadingZeroBits(sha256Bytes(prefix + nonce)) >= difficulty) nonce++;
    let attempts = 0;
    const t0 = performance.now();

    function chunk() {
      if (!mining) return;
      const end = performance.now() + 30; // ~30 ms of hashing per frame keeps the page responsive
      while (performance.now() < end) {
        for (let k = 0; k < 500; k++) {
          attempts++;
          if (leadingZeroBits(sha256Bytes(prefix + nonce)) >= difficulty) {
            els.nonce.value = nonce;
            finish();
            return;
          }
          nonce++;
        }
      }
      els.nonce.value = nonce;
      report();
      render();
      requestAnimationFrame(chunk);
    }
    function report() {
      els.attempts.textContent = fmt(attempts);
      const secs = (performance.now() - t0) / 1000;
      if (secs > 0.05) els.rate.textContent = `${fmt(Math.round(attempts / secs / 1000))}k/s`;
    }
    function finish() {
      report();
      stopMining();
      render();
    }
    requestAnimationFrame(chunk);
  }

  els.data.addEventListener("input", () => { if (mining) stopMining(); render(); });
  els.nonce.addEventListener("input", render);
  els.up.addEventListener("click", () => { els.nonce.value = getNonce() + 1; render(); });
  els.down.addEventListener("click", () => { els.nonce.value = Math.max(0, getNonce() - 1); render(); });
  els.slider.addEventListener("input", () => { difficulty = +els.slider.value; renderTarget(); render(); });
  els.mine.addEventListener("click", () => {
    if (mining) { stopMining(); return; }
    els.attempts.textContent = "0";
    els.rate.textContent = "—";
    startMining();
  });

  renderTarget();
  render();
})();
