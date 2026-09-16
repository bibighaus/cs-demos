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
