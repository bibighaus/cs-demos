# CS Demos

Interactive, browser-based demos for an intro Computer Science & Cybersecurity
course. Each demo is a self-contained static site (HTML/CSS/JS, no build
step, no dependencies), designed to be explored hands-on rather than just
read about, and linked from a syllabus. See it live at
[**the demo index**](https://bibighaus.github.io/cs-demos/) once GitHub
Pages is enabled (see below).

## Demos

- [`encoding/`](encoding/) &mdash; **Text Encoding Explorer**, in three tabs:
  - **ASCII** &mdash; text encoded live as binary and hex, with synchronized
    hover-highlighting across the text, binary, hex, and a full ASCII
    reference table.
  - **Unicode** &mdash; the same text broken into UTF-8 bytes per character,
    showing that non-English text and emoji are representable but cost more
    (often 2&ndash;4&times; ASCII), plus a security note on homoglyph attacks.
  - **Huffman** &mdash; builds a real Huffman tree from the input's letter
    frequencies live (as an SVG diagram), assigns variable-length codes, and
    compares the compressed bit count to plain ASCII.
- [`neural_nets/`](neural_nets/) &mdash; **Neural Network Visualizer**, a 3D,
  real-time view of a small neural network classifying handwritten digits
  (MNIST). Draw a digit and watch activations propagate neuron-by-neuron
  through the network, inspect individual neurons, and scrub a training
  timeline from random weights to a fully trained model. Adapted, with
  credit, from [DFin/Neural-Network-Visualisation](https://github.com/DFin/Neural-Network-Visualisation)
  &mdash; see [`neural_nets/NOTICE.md`](neural_nets/NOTICE.md).
- [`embeddings/`](embeddings/) &mdash; **Word Embeddings Explorer**. Search a
  word and see its real 100-dimensional [GloVe](https://nlp.stanford.edu/projects/glove/)
  vector, then inspect a table of its dimensions ranked by how far each one
  deviates from that dimension's average &mdash; alongside the words that sit
  at that dimension's floor and ceiling, and a 0&ndash;255 spectrum showing
  where this word falls between them. Meant as a concrete warm-up before
  discussing Attention (static, context-free vectors vs. what Attention lets
  a model do instead). See [`embeddings/NOTICE.md`](embeddings/NOTICE.md)
  for data attribution.

- [`cryptography/`](cryptography/) &mdash; **Caesar Cipher Lab**, in two tabs:
  - **Caesar Cipher** &mdash; a draggable cipher wheel (outer ring plaintext,
    inner ring ciphertext). Rotating the inner ring changes the key and every
    letter mapping at once; a live mapping strip and encrypt/decrypt box are
    hover-linked back to the wheel.
  - **Cryptanalysis** &mdash; a guided, five-step frequency-analysis lab. The
    ciphertext's letter frequencies are charted beside standard English
    frequencies; students find the "giveaway" letter (E), slide the English
    profile by a key guess until the peaks line up (with a chi-squared
    mismatch score), verify by reading the live decryption, and finally
    reveal the computer's score for all 26 keys. Comes with randomly keyed
    challenge passages, or students can crack their own message from the
    first tab.

- [`hashing/`](hashing/) &mdash; **Hashing Lab**, in three tabs:
  - **Hash It** &mdash; type text and see its SHA-256 hash live, both as 64 hex
    digits and as all 256 bits (each hex digit hover-linked to its 4 bits),
    plus an avalanche test that marks every bit flipped by a one-character
    change.
  - **Math Hashes** &mdash; three hash recipes built from basic arithmetic
    (sum of character codes, a polynomial/Java-`hashCode` rolling hash, and
    FNV-1a multiply&ndash;XOR), traced step by step, with the result shown in
    binary (`mod 2^k` = keep the last k bits) and a hash-table bucket view
    showing collisions and the pigeonhole principle.
  - **Proof of Work** &mdash; a toy Bitcoin-style miner: pick a difficulty in
    leading zero bits and search nonces until the block's binary hash meets
    the target. SHA-256 is implemented in plain JS
    ([`hashing/sha256.js`](hashing/sha256.js)) so it works offline and
    from `file://`.

- [`public-key/`](public-key/) &mdash; **Public-Key Crypto Lab**, in three tabs:
  - **RSA Math** &mdash; pick primes p and q and build a key pair step by step:
    n and &phi;(n), choosing e (gcd check), finding d with a traced extended
    Euclidean algorithm, then encrypting/decrypting a number with a
    square-and-multiply table driven by the exponent's binary digits.
  - **Send a Secret** &mdash; Alice encrypts to Bob's public key while Eve
    watches the wire. Eve can try the public key (fails) or factor n (works
    on toy keys, with an estimate for real 2048-bit keys). Hovering shows
    that textbook RSA maps identical letters to identical ciphertext, which
    motivates padding.
  - **Digital Signatures** &mdash; SHA-256 the message, sign the hash with
    Alice's private key, and let Bob verify it with her public key. Students
    can tamper with the message or forge a signature in transit and watch
    verification fail. Ends with an encryption-vs-signature comparison and the
    link to cryptocurrency wallets. Reuses
    [`hashing/sha256.js`](hashing/sha256.js); RSA math uses BigInt in
    [`public-key/rsa.js`](public-key/rsa.js).

## Visual identity: "Blueprint"

Every demo shares one look &mdash; a dark, technical-drawing aesthetic
("Blueprint"): deep blue grid-paper background, IBM Plex type (Sans
Condensed for headings/labels, Mono for data), cyan for structure, and a
warm "redline" orange reserved for hover/highlight state, evoking hand
annotations on a blueprint. It's defined once in
[`assets/theme.css`](assets/theme.css) as CSS custom properties and reusable
component classes (`.card`, `.tabs`/`.tab-btn`, `.unit` chips, reference
tables, buttons) so new demos inherit it automatically.

## Hosting with GitHub Pages

Enable Pages for this repository (Settings &rarr; Pages &rarr; Deploy from
branch). The root [`index.html`](index.html) becomes the demo index, and
each demo becomes available at:

```
https://<your-username>.github.io/cs-demos/<demo-folder>/
```
