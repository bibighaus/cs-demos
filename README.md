# CS Demos

Interactive, browser-based demos for an intro Computer Science & Cybersecurity
course. Each demo lives in its own folder and is a static site (HTML/CSS/JS,
no build step, no dependencies) so it can be hosted directly with GitHub
Pages and linked from a syllabus.

## Demos

- [`encoding/`](encoding/) &mdash; **Text Encoding Explorer**. Type text and
  see it encoded live as ASCII binary and hexadecimal, with synchronized
  hover-highlighting across the text, binary, hex, and a full ASCII
  reference table. Includes placeholder tabs for future Unicode and Huffman
  compression demos.

## Adding a new demo

1. Create a new top-level folder (e.g. `unicode/`, `huffman/`).
2. Give it its own `index.html`, `style.css`, and `script.js` &mdash; keep
   each demo self-contained and dependency-free so it stays easy to host and
   to read as a teaching example.
3. Link to `your-folder/index.html` from the syllabus or from this README.

## Hosting with GitHub Pages

Enable Pages for this repository (Settings &rarr; Pages &rarr; Deploy from
branch), and each demo becomes available at:

```
https://<your-username>.github.io/cs-demos/<demo-folder>/
```
