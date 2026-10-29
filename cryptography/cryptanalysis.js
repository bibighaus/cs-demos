"use strict";

/* ============================================================
   Caesar Cipher Lab — Cryptanalysis tab (frequency analysis)
   Uses caesarShift / mod26 / letterIndex / ALPHABET from caesar.js.
   ============================================================ */

(function () {
  // Relative frequency (%) of each letter in typical English text.
  const ENGLISH = [
    8.167, 1.492, 2.782, 4.253, 12.702, 2.228, 2.015, 6.094, 6.966, 0.153,
    0.772, 4.025, 2.406, 6.749, 7.507, 1.929, 0.095, 5.987, 6.327, 9.056,
    2.758, 0.978, 2.360, 0.150, 1.974, 0.074
  ];

  // Plaintexts for generated challenges. Long enough (300+ letters) that
  // frequency analysis works reliably on every one of them.
  const PASSAGES = [
    "The Roman historian Suetonius wrote that Julius Caesar protected his private letters by " +
    "replacing each letter with the one three places further down the alphabet. Anyone who " +
    "intercepted a message would see only nonsense. For a world where most people could not " +
    "read at all, that was good enough. Today a phone can break the same cipher faster than you " +
    "can blink, because the order of the alphabet never changes and there are only twenty five keys to try.",

    "Every time you visit a website that starts with https, your browser and the server agree on " +
    "a secret key and use it to scramble everything they send each other. Even if someone on the " +
    "same coffee shop network records every packet, all they see is meaningless noise. The ideas " +
    "behind that protection go back thousands of years, to people who simply wanted to send a " +
    "letter that only the right person could read.",

    "During the Second World War, the German military trusted a machine called Enigma to protect " +
    "its radio messages. A team of mathematicians at Bletchley Park, including Alan Turing, found " +
    "patterns in those messages and used them to recover the daily settings. Their work is often " +
    "credited with shortening the war by years. The lesson for security engineers is simple: a " +
    "cipher is only as strong as the patterns it fails to hide.",

    "Imagine you are the network administrator for a small company and you notice a strange file " +
    "on a shared drive. It is full of capital letters that look random at first. But when you count " +
    "them, the letter that appears most often shows up far more than any other, and a few letters " +
    "almost never appear. Random data would not look like that. Whoever wrote this file used a weak " +
    "cipher, and the statistics of the English language are about to give their secret away.",

    "Al-Kindi was a ninth century scholar in Baghdad who wrote one of the earliest known books on " +
    "breaking codes. He noticed that in any long text, some letters are used far more often than " +
    "others. If you count the letters in a secret message and compare them with the letters in an " +
    "ordinary book, you can match the most common symbols to the most common letters. That single " +
    "observation defeated simple substitution ciphers for the next thousand years."
  ];

  const els = {
    input: document.getElementById("analysis-input"),
    newChallenge: document.getElementById("new-challenge"),
    clear: document.getElementById("clear-analysis"),
    letterCount: document.getElementById("letter-count"),
    shortWarning: document.getElementById("short-warning"),
    yAxis: document.getElementById("fc-y"),
    plot: document.getElementById("fc-plot"),
    axisCipher: document.getElementById("fc-axis-cipher"),
    axisPlain: document.getElementById("fc-axis-plain"),
    chart: document.getElementById("freq-chart"),
    tip: document.getElementById("chart-tip"),
    toggleTable: document.getElementById("toggle-freq-table"),
    tableWrap: document.getElementById("freq-table-wrap"),
    topLetter: document.getElementById("top-letter"),
    topFreq: document.getElementById("top-freq"),
    runnersUp: document.getElementById("runners-up"),
    eHint: document.getElementById("e-hint"),
    assumeE: document.getElementById("assume-e"),
    slider: document.getElementById("guess-slider"),
    guessUp: document.getElementById("guess-up"),
    guessDown: document.getElementById("guess-down"),
    guessValue: document.getElementById("guess-value"),
    guessScore: document.getElementById("guess-score"),
    fitFill: document.getElementById("fit-fill"),
    preview: document.getElementById("analysis-preview"),
    crackStatus: document.getElementById("crack-status"),
    revealAll: document.getElementById("reveal-all"),
    allKeys: document.getElementById("all-keys"),
    keyBars: document.getElementById("key-bars"),
    stepper: document.getElementById("stepper"),
    stepBack: document.getElementById("step-back"),
    stepNext: document.getElementById("step-next")
  };
  if (!els.input) return;

  let guess = 0;
  let knownKey = null;   // set when we generated the challenge (or it came from the wheel tab)
  let assumedE = false;  // whether the student has pressed "Assume it's E" for this text
  let step = 0;
  let lastPassage = -1;
  let stats = null;      // { counts, total, pct, scores, best }

  const cipherCols = [], englishBars = [], cipherBars = [], plainAxis = [];
  const keyBarEls = [];

  /* ---------- Statistics ---------- */

  function analyze(text) {
    const counts = new Array(26).fill(0);
    let total = 0;
    for (const ch of text) {
      const i = letterIndex(ch);
      if (i >= 0) { counts[i]++; total++; }
    }
    const pct = counts.map(c => total ? (c / total) * 100 : 0);
    // Chi-squared for each key k: if k is right, cipher letter (p + k)
    // should show up about as often as plaintext letter p does in English.
    const scores = [];
    for (let k = 0; k < 26; k++) {
      let chi = 0;
      for (let p = 0; p < 26; p++) {
        const expected = total * ENGLISH[p] / 100;
        const observed = counts[mod26(p + k)];
        chi += (observed - expected) ** 2 / expected;
      }
      scores.push(chi);
    }
    let best = 0;
    for (let k = 1; k < 26; k++) if (scores[k] < scores[best]) best = k;
    return { counts, total, pct, scores, best };
  }

  /* ---------- Chart scaffolding (built once) ---------- */

  function buildChart() {
    for (let j = 0; j < 26; j++) {
      const col = document.createElement("div");
      col.className = "fc-col";
      col.dataset.j = j;
      const cb = document.createElement("div");
      cb.className = "fc-bar cipher";
      const eb = document.createElement("div");
      eb.className = "fc-bar english";
      col.append(cb, eb);
      els.plot.appendChild(col);
      cipherCols[j] = col; cipherBars[j] = cb; englishBars[j] = eb;

      const a = document.createElement("span");
      a.textContent = ALPHABET[j];
      a.dataset.j = j;
      els.axisCipher.appendChild(a);
      const b = document.createElement("span");
      b.dataset.j = j;
      els.axisPlain.appendChild(b);
      plainAxis[j] = b;
    }

    for (let k = 0; k < 26; k++) {
      const wrap = document.createElement("button");
      wrap.type = "button";
      wrap.className = "kb";
      wrap.dataset.k = k;
      wrap.innerHTML = '<span class="kb-track"><span class="kb-fill"></span></span><span class="kb-label">' + k + "</span>";
      wrap.addEventListener("click", () => setGuess(k));
      els.keyBars.appendChild(wrap);
      keyBarEls[k] = wrap;
    }
  }

  /* ---------- Rendering ---------- */

  function render() {
    const text = els.input.value;
    stats = analyze(text);
    const { pct, total, scores, best } = stats;

    els.letterCount.textContent = String(total);
    els.shortWarning.hidden = total === 0 || total >= 100;

    // Shared y-scale so both series are directly comparable.
    const maxPct = Math.max(12.702, ...pct);
    const top = Math.ceil(maxPct / 5) * 5;
    els.yAxis.innerHTML = "";
    els.plot.style.setProperty("--grid-step", (5 / top * 100) + "%");
    for (let v = top; v >= 0; v -= 5) {
      const s = document.createElement("span");
      s.style.bottom = (v / top * 100) + "%";
      s.textContent = v + "%";
      els.yAxis.appendChild(s);
    }

    for (let j = 0; j < 26; j++) {
      const p = mod26(j - guess);
      cipherBars[j].style.height = (pct[j] / top * 100) + "%";
      englishBars[j].style.height = (ENGLISH[p] / top * 100) + "%";
      plainAxis[j].textContent = ALPHABET[p].toLowerCase();
      plainAxis[j].classList.toggle("is-e", p === 4);
    }

    // Step 2: most common letters.
    const order = [...Array(26).keys()].sort((a, b) => stats.counts[b] - stats.counts[a]);
    const topJ = order[0];
    if (total) {
      els.topLetter.textContent = ALPHABET[topJ];
      els.topFreq.textContent = pct[topJ].toFixed(1) + "%";
      els.runnersUp.textContent = order.slice(1, 4).map(j => ALPHABET[j]).join(" ");
      els.eHint.innerHTML = assumedE
        ? `${ALPHABET[topJ]} is letter #${topJ} and E is letter #4, so the guess is ` +
          `(${topJ} &minus; 4) mod 26 = <strong>${mod26(topJ - 4)}</strong>. ` +
          "Now check the chart: do the <em>other</em> peaks line up too?"
        : `If ${ALPHABET[topJ]} really is an encrypted E, how many places is it from E to ` +
          `${ALPHABET[topJ]} (counting forward, wrapping Z&rarr;A)? That distance is your key guess. ` +
          "Set it with the slider, or let the button do the arithmetic.";
    } else {
      els.topLetter.textContent = els.topFreq.textContent = els.runnersUp.textContent = "—";
      els.eHint.textContent = "Paste or generate some ciphertext first.";
    }
    els.assumeE.disabled = !total;

    // Guess readouts.
    els.slider.value = String(guess);
    els.guessValue.textContent = String(guess);
    const maxS = Math.max(...scores), minS = scores[best];
    if (total) {
      els.guessScore.textContent = Math.round(scores[guess]).toLocaleString();
      const fit = maxS > minS ? (maxS - scores[guess]) / (maxS - minS) : 0;
      els.fitFill.style.width = (fit * 100) + "%";
    } else {
      els.guessScore.textContent = "—";
      els.fitFill.style.width = "0%";
    }

    // Live decryption.
    els.preview.textContent = total ? caesarShift(text, -guess) : "";
    els.preview.classList.toggle("empty", !total);
    if (!total) els.preview.textContent = "Decrypted text will appear here.";

    // Step 4 status.
    renderStatus();

    // Step 5: every key's score.
    for (let k = 0; k < 26; k++) {
      const fill = keyBarEls[k].querySelector(".kb-fill");
      fill.style.height = total ? (scores[k] / maxS * 100) + "%" : "0%";
      keyBarEls[k].classList.toggle("best", total > 0 && k === best);
      keyBarEls[k].classList.toggle("current", k === guess);
      keyBarEls[k].title = `Key ${k}: mismatch ${scores[k].toFixed(0)}`;
    }

    if (!els.tableWrap.hidden) renderTable();
  }

  function renderStatus() {
    const s = els.crackStatus;
    s.className = "crack-status";
    if (!stats.total) { s.textContent = "No ciphertext yet."; return; }
    if (knownKey !== null) {
      if (guess === knownKey) {
        s.classList.add("ok");
        s.innerHTML = `<strong>Cracked!</strong> The key is ${knownKey}. You read a secret message without ever being told the key.`;
      } else {
        s.textContent = "Not yet — the live decryption under the chart should read as plain English when you find it.";
      }
    } else {
      s.innerHTML = "This is your own ciphertext, so there's no answer key &mdash; <strong>you</strong> are the judge. " +
        "If the live decryption reads as English, you've found it.";
    }
  }

  function renderTable() {
    const { counts, pct } = stats;
    let html = '<table class="ascii-col freq-table"><thead><tr><th>Cipher letter</th><th>Count</th>' +
      "<th>Cipher %</th><th>Reads as</th><th>English %</th></tr></thead><tbody>";
    for (let j = 0; j < 26; j++) {
      const p = mod26(j - guess);
      html += `<tr><td>${ALPHABET[j]}</td><td>${counts[j]}</td><td>${pct[j].toFixed(1)}</td>` +
        `<td>${ALPHABET[p].toLowerCase()}</td><td>${ENGLISH[p].toFixed(1)}</td></tr>`;
    }
    els.tableWrap.innerHTML = html + "</tbody></table>";
  }

  /* ---------- Tooltip ---------- */

  function showTip(j) {
    const { counts, pct, total } = stats;
    const p = mod26(j - guess);
    els.tip.innerHTML =
      `<div class="tt-title">Cipher ${ALPHABET[j]} &rarr; reads as ${ALPHABET[p].toLowerCase()}</div>` +
      `<div class="tt-row"><span class="lg-swatch cipher"></span>Ciphertext <strong>${pct[j].toFixed(1)}%</strong>` +
      ` <span class="tt-muted">(${counts[j]} of ${total})</span></div>` +
      `<div class="tt-row"><span class="lg-swatch english"></span>English &ldquo;${ALPHABET[p].toLowerCase()}&rdquo; <strong>${ENGLISH[p].toFixed(1)}%</strong></div>`;
    els.tip.hidden = false;
    const chartBox = els.chart.getBoundingClientRect();
    const colBox = cipherCols[j].getBoundingClientRect();
    const tipW = els.tip.offsetWidth;
    let left = colBox.left - chartBox.left + colBox.width / 2 - tipW / 2;
    left = Math.max(0, Math.min(left, chartBox.width - tipW));
    els.tip.style.left = left + "px";
    cipherCols.forEach((c, i) => c.classList.toggle("hover", i === j));
    els.axisCipher.children[j].classList.add("hover");
  }

  function hideTip() {
    els.tip.hidden = true;
    cipherCols.forEach(c => c.classList.remove("hover"));
    [...els.axisCipher.children].forEach(c => c.classList.remove("hover"));
  }

  els.chart.addEventListener("pointermove", e => {
    const t = e.target.closest("[data-j]");
    if (!t || !stats || !stats.total) { hideTip(); return; }
    [...els.axisCipher.children].forEach(c => c.classList.remove("hover"));
    showTip(Number(t.dataset.j));
  });
  els.chart.addEventListener("pointerleave", hideTip);

  /* ---------- Controls ---------- */

  function setGuess(k) {
    guess = mod26(k);
    render();
  }

  function loadText(text, key) {
    els.input.value = text;
    knownKey = key;
    assumedE = false;
    guess = 0;
    els.allKeys.hidden = true;
    els.revealAll.setAttribute("aria-expanded", "false");
    els.revealAll.textContent = "Reveal all 26 scores";
    goToStep(0);
    render();
  }

  function newChallenge() {
    let i;
    do { i = Math.floor(Math.random() * PASSAGES.length); } while (PASSAGES.length > 1 && i === lastPassage);
    lastPassage = i;
    const key = 1 + Math.floor(Math.random() * 25);
    loadText(caesarShift(PASSAGES[i].toUpperCase(), key), key);
  }

  els.newChallenge.addEventListener("click", newChallenge);
  els.clear.addEventListener("click", () => { loadText("", null); els.input.focus(); });
  els.input.addEventListener("input", () => { knownKey = null; assumedE = false; render(); });

  els.slider.addEventListener("input", () => setGuess(Number(els.slider.value)));
  els.guessUp.addEventListener("click", () => setGuess(guess + 1));
  els.guessDown.addEventListener("click", () => setGuess(guess - 1));

  els.assumeE.addEventListener("click", () => {
    let topJ = 0;
    for (let j = 1; j < 26; j++) if (stats.counts[j] > stats.counts[topJ]) topJ = j;
    assumedE = true;
    setGuess(topJ - 4);
  });

  els.revealAll.addEventListener("click", () => {
    const open = els.allKeys.hidden;
    els.allKeys.hidden = !open;
    els.revealAll.setAttribute("aria-expanded", String(open));
    els.revealAll.textContent = open ? "Hide scores" : "Reveal all 26 scores";
  });

  els.toggleTable.addEventListener("click", () => {
    const open = els.tableWrap.hidden;
    els.tableWrap.hidden = !open;
    els.toggleTable.setAttribute("aria-expanded", String(open));
    els.toggleTable.textContent = open ? "Hide table" : "Show table";
    if (open) renderTable();
  });

  /* ---------- Guided steps ---------- */

  const panels = document.querySelectorAll(".step-panel");
  const stepBtns = els.stepper.querySelectorAll("button");

  function goToStep(n) {
    step = Math.max(0, Math.min(panels.length - 1, n));
    panels.forEach((p, i) => { p.hidden = i !== step; });
    stepBtns.forEach((b, i) => {
      b.classList.toggle("active", i === step);
      b.classList.toggle("done", i < step);
      b.setAttribute("aria-current", i === step ? "step" : "false");
    });
    els.stepBack.disabled = step === 0;
    els.stepNext.disabled = step === panels.length - 1;
  }

  stepBtns.forEach(b => b.addEventListener("click", () => goToStep(Number(b.dataset.step))));
  els.stepBack.addEventListener("click", () => goToStep(step - 1));
  els.stepNext.addEventListener("click", () => goToStep(step + 1));

  // Handoff from the Caesar tab's "Try to crack it" button.
  document.addEventListener("cs160:analyze", e => loadText(e.detail.text, e.detail.key));

  /* ---------- Init ---------- */

  buildChart();
  goToStep(0);
  newChallenge();
})();
