# Attribution

This demo (`demo.html`, `demo.js`, `demo.css`, the trained-weight snapshots
under `weights/`, and the MNIST sample data under `data/`) is adapted from
[**Neural-Network-Visualisation**](https://github.com/DFin/Neural-Network-Visualisation)
by **[DFin](https://github.com/DFin)**, licensed under the
[Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0)
(see [`LICENSE`](LICENSE) in this folder).

Changes made for this fork:

- Restyled the UI to match this repository's shared
  ["Blueprint" design system](../assets/theme.css) (cyan/orange on dark
  blueprint-paper, IBM Plex type) instead of the original's rounded glass
  panels and blue gradients.
- Translated the interface text from German to English.
- Reorganized asset paths (`exports/` → `weights/`, `assets/data/` →
  `data/`) to fit this repository's per-demo folder convention, and added
  an explanatory landing page (`index.html`).
- Removed the third-party analytics script and the deployment tooling
  (`deploy.sh`, `releases/`) that isn't relevant to a static GitHub Pages
  demo.
- Vendored [three.js](https://github.com/mrdoob/three.js) r128 and its
  `OrbitControls` addon locally under `vendor/three/` (see
  `vendor/three/LICENSE`, MIT) instead of loading them from a CDN at
  runtime, so the demo has no external script dependency.

The original project's own notice:

> This educational tool is free to use and share. If you were asked to pay
> for the software itself, that was unauthorized. Original project:
> https://github.com/DFin/Neural-Network-Visualisation
