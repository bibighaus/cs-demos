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

## Visual identity: "Blueprint"

Every demo shares one look &mdash; a dark, technical-drawing aesthetic
("Blueprint"): deep blue grid-paper background, IBM Plex type (Sans
Condensed for headings/labels, Mono for data), cyan for structure, and a
warm "redline" orange reserved for hover/highlight state, evoking hand
annotations on a blueprint. It's defined once in
[`assets/theme.css`](assets/theme.css) as CSS custom properties and reusable
component classes (`.card`, `.tabs`/`.tab-btn`, `.unit` chips, reference
tables, buttons) so new demos inherit it automatically.

## Adding a new demo

1. Create a new top-level folder (e.g. `unicode/`, `huffman/`).
2. In its `index.html`, link the shared stylesheet **before** the page's own:
   ```html
   <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap">
   <link rel="stylesheet" href="../assets/theme.css">
   <link rel="stylesheet" href="style.css">
   ```
3. Give it its own `style.css` and `script.js` for whatever is unique to
   that page &mdash; reuse `assets/theme.css`'s classes (`.title-block`,
   `.card`, `.tabs`, `.unit`, etc.) rather than redefining colors or fonts,
   so the series keeps reading as one system.
4. Link to `your-folder/index.html` from the syllabus or from this README.

## Hosting with GitHub Pages

Enable Pages for this repository (Settings &rarr; Pages &rarr; Deploy from
branch), and each demo becomes available at:

```
https://<your-username>.github.io/cs-demos/<demo-folder>/
```
