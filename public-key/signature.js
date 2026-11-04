"use strict";

/* ============================================================
   Public-Key Crypto Lab — Digital Signatures tab
   SHA-256 the message, sign the (truncated) hash with Alice's
   private key, and let Bob verify with her public key — while
   "Mallory" can tamper with either piece in transit.
   ============================================================ */

(function () {
  const $ = id => document.getElementById(id);
  const els = {
    newKeys: $("alice-new-keys"), pub: $("alice-pub"), priv: $("alice-priv"),
    input: $("sign-input"), hashHex: $("sign-hash-hex"), truncNote: $("trunc-note"),
    hashBits: $("sign-hash-bits"), h: $("sign-h"), s: $("sign-s"),
    rxMsg: $("rx-msg"), rxSig: $("rx-sig"), flag: $("tamper-flag"),
    tamperMsg: $("tamper-msg"), tamperSig: $("tamper-sig"), resend: $("resend"),
    rxHashHex: $("rx-hash-hex"), rxH: $("rx-h"), rxV: $("rx-v"), verdict: $("verdict")
  };
  if (!els.input) return;

  const BITS = 26;          // prime size → n is ~51–52 bits
  const PUB = '<span class="ink-pub">', PRIV = '<span class="ink-priv">', END = "</span>";
  let key = RSA.generateKeys(BITS);
  let sent = { msg: "", sig: 0n };

  const eq = (k, v, cls = "") => `<div class="eq ${cls}"><span class="eq-k">${k}</span><span class="eq-v">${v}</span></div>`;

  /** Number of hash bits that fit safely under n. */
  const takeBits = () => RSA.bitLength(key.n) - 1;

  /** SHA-256 → keep the first k bits → a number smaller than n. */
  function hashToNumber(msg) {
    const hex = sha256Hex(msg);
    const h = BigInt("0x" + hex) >> BigInt(256 - takeBits());
    return { hex, h };
  }

  function renderKeys() {
    els.pub.innerHTML = `<span><b>n</b> = ${fmtBig(key.n)}</span><span><b>e</b> = ${fmtBig(key.e)}</span>`;
    els.priv.innerHTML = `<span><b>d</b> = ${fmtBig(key.d)}</span><span class="dim">n is ${RSA.bitLength(key.n)} bits</span>`;
  }

  function sign() {
    const msg = els.input.value;
    const { hex, h } = hashToNumber(msg);
    const s = RSA.modPow(h, key.d, key.n);
    const k = takeBits();

    els.hashHex.textContent = hex;
    els.truncNote.innerHTML = `Our toy n is only ${RSA.bitLength(key.n)} bits, and RSA needs a number smaller than n, so we
      keep just the <strong>first ${k} bits</strong> of the 256-bit hash (highlighted). Real 2048-bit keys sign the whole hash.`;
    const bits = bytesToBits(sha256Bytes(msg));
    const shown = 72;
    let strip = "";
    for (let i = 0; i < shown; i++) {
      strip += `<span class="${i < k ? "kept" : "dropped"}">${bits[i]}</span>`;
      if (i % 8 === 7) strip += " ";
    }
    els.hashBits.innerHTML = strip + '<span class="dropped">… (256 bits)</span>';
    els.h.innerHTML = eq("as a number", `h = <strong>${fmtBig(h)}</strong>`);
    els.s.innerHTML =
      eq("s = h<sup>d</sup> mod n", `${fmtBig(h)}<sup>${PRIV}${fmtBig(key.d)}${END}</sup> mod ${fmtBig(key.n)}`) +
      eq("signature", `${PRIV}<strong>s = ${fmtBig(s)}</strong>${END}`);

    sent = { msg, sig: s };
    els.rxMsg.value = msg;
    els.rxSig.value = s.toString();
    verify();
  }

  function verify() {
    const msg = els.rxMsg.value;
    const sigRaw = els.rxSig.value.replace(/[,\s]/g, "");
    const { hex, h } = hashToNumber(msg);
    els.rxHashHex.textContent = hex;
    els.rxH.innerHTML = eq("first bits as a number", `h′ = <strong>${fmtBig(h)}</strong>`);

    const msgChanged = msg !== sent.msg;
    const sigOk = /^\d+$/.test(sigRaw);
    const s = sigOk ? BigInt(sigRaw) : null;
    const sigChanged = !sigOk || s !== sent.sig;

    const notes = [];
    if (msgChanged) notes.push("message changed");
    if (sigChanged) notes.push("signature changed");
    els.flag.hidden = !notes.length;
    els.flag.textContent = notes.length ? "⚠ Tampered in transit: " + notes.join(" and ") : "";

    if (!sigOk) {
      els.rxV.innerHTML = eq("error", "The signature must be a whole number.");
      els.verdict.className = "verdict bad";
      els.verdict.innerHTML = "<strong>✗ Invalid</strong> — that isn't even a number.";
      return;
    }
    const v = RSA.modPow(s, key.e, key.n);
    els.rxV.innerHTML =
      eq("v = s<sup>e</sup> mod n", `${fmtBig(s)}<sup>${PUB}${fmtBig(key.e)}${END}</sup> mod ${fmtBig(key.n)}`) +
      eq("result", `v = <strong>${fmtBig(v)}</strong>`);

    const ok = v === h;
    els.verdict.className = "verdict " + (ok ? "ok" : "bad");
    if (ok) {
      els.verdict.innerHTML = `<strong>✓ Valid signature.</strong> h′ = v = ${fmtBig(h)}. Only Alice's private key could have
        produced this s, and the message hasn't changed by a single bit.`;
    } else {
      let why;
      if (msgChanged && !sigChanged) why = "The message was altered, so its hash no longer matches what Alice signed — and Mallory can't make a new signature without Alice's private key.";
      else if (sigChanged && !msgChanged) why = "The signature wasn't made with Alice's private key. Without d, a guessed s unlocks to a random number.";
      else why = "Neither the hash nor the signature matches what Alice sent.";
      els.verdict.innerHTML = `<strong>✗ Invalid — reject it.</strong> h′ = ${fmtBig(h)} but v = ${fmtBig(v)}. ${why}`;
    }
  }

  els.input.addEventListener("input", sign);
  els.rxMsg.addEventListener("input", verify);
  els.rxSig.addEventListener("input", verify);
  els.tamperMsg.addEventListener("click", () => {
    const m = sent.msg;
    els.rxMsg.value = /\d/.test(m) ? m.replace(/\d+/, d => d + "00") : m + " Also, I owe Mallory $500.";
    verify();
  });
  els.tamperSig.addEventListener("click", () => {
    let s;
    do s = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)) % key.n; while (s === sent.sig);
    els.rxSig.value = s.toString();
    verify();
  });
  els.resend.addEventListener("click", () => {
    els.rxMsg.value = sent.msg;
    els.rxSig.value = sent.sig.toString();
    verify();
  });
  els.newKeys.addEventListener("click", () => { key = RSA.generateKeys(BITS); renderKeys(); sign(); });

  renderKeys();
  sign();
})();
