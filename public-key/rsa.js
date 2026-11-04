"use strict";

/* ============================================================
   Public-Key Crypto Lab — shared RSA math (BigInt) + tabs
   ------------------------------------------------------------
   Textbook RSA with deliberately small keys so every number
   fits on screen. Real RSA uses 2048+ bit keys and random
   padding (OAEP / PSS); see the notes on each tab.
   ============================================================ */

const RSA = (() => {
  const B = v => BigInt(v);

  function mod(a, m) { const r = a % m; return r < 0n ? r + m : r; }

  function gcd(a, b) { a = B(a); b = B(b); while (b) [a, b] = [b, a % b]; return a < 0n ? -a : a; }

  /** Square-and-multiply: base^exp mod m. If `trace` is an array, one row is
   *  pushed per bit of exp (read left to right) so the page can show the work. */
  function modPow(base, exp, m, trace) {
    base = mod(B(base), B(m)); exp = B(exp); m = B(m);
    if (m === 1n) return 0n;
    const bits = exp.toString(2);
    let r = 1n;
    for (const bit of bits) {
      const sq = (r * r) % m;
      r = bit === "1" ? (sq * base) % m : sq;
      if (trace) trace.push({ bit, squared: sq, result: r });
    }
    return r;
  }

  /** Extended Euclidean algorithm, returning every step for display. */
  function egcdSteps(a, b) {
    a = B(a); b = B(b);
    const rows = [];
    let [r0, r1] = [a, b], [s0, s1] = [1n, 0n], [t0, t1] = [0n, 1n];
    while (r1 !== 0n) {
      const q = r0 / r1;
      rows.push({ a: r0, b: r1, q, r: r0 - q * r1 });
      [r0, r1] = [r1, r0 - q * r1];
      [s0, s1] = [s1, s0 - q * s1];
      [t0, t1] = [t1, t0 - q * t1];
    }
    return { g: r0, x: s0, y: t0, rows };
  }

  function modInverse(a, m) {
    const { g, x } = egcdSteps(a, m);
    return g === 1n ? mod(x, B(m)) : null;
  }

  /** Deterministic Miller–Rabin for n < 3.3e24 (far more than we need). */
  function isPrime(n) {
    n = B(n);
    if (n < 2n) return false;
    for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n]) {
      if (n === p) return true;
      if (n % p === 0n) return false;
    }
    let d = n - 1n, s = 0;
    while (d % 2n === 0n) { d /= 2n; s++; }
    outer: for (const a of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n, 41n]) {
      let x = modPow(a, d, n);
      if (x === 1n || x === n - 1n) continue;
      for (let i = 1; i < s; i++) {
        x = (x * x) % n;
        if (x === n - 1n) continue outer;
      }
      return false;
    }
    return true;
  }

  /** Random prime with exactly `bits` bits (top bit set). */
  function randomPrime(bits) {
    for (;;) {
      let n = 1n;
      for (let i = 1; i < bits; i++) n = (n << 1n) | (Math.random() < 0.5 ? 1n : 0n);
      n |= 1n;
      if (isPrime(n)) return n;
    }
  }

  function bitLength(n) { return B(n).toString(2).length; }

  /** Generate a toy key pair with primes of `bits` bits each. */
  function generateKeys(bits) {
    for (;;) {
      const p = randomPrime(bits);
      let q = randomPrime(bits);
      if (p === q) continue;
      const n = p * q, phi = (p - 1n) * (q - 1n);
      const e = [65537n, 257n, 17n, 5n, 3n].find(e => e < phi && gcd(e, phi) === 1n);
      if (!e) continue;
      return { p, q, n, phi, e, d: modInverse(e, phi) };
    }
  }

  return { mod, gcd, modPow, egcdSteps, modInverse, isPrime, randomPrime, bitLength, generateKeys };
})();

/** Group a long number's digits in threes for readability. */
function fmtBig(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

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

if (typeof module !== "undefined") module.exports = { RSA };
