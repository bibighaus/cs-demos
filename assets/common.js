"use strict";

/* Shared helpers for the CS-160 demo series — kept tiny and dependency-free
   so any demo can include this one file before its own script. */

const CS160_CONTROL_NAMES = {
  0: "NUL", 1: "SOH", 2: "STX", 3: "ETX", 4: "EOT", 5: "ENQ", 6: "ACK",
  7: "BEL", 8: "BS", 9: "TAB", 10: "LF", 11: "VT", 12: "FF", 13: "CR",
  14: "SO", 15: "SI", 16: "DLE", 17: "DC1", 18: "DC2", 19: "DC3", 20: "DC4",
  21: "NAK", 22: "SYN", 23: "ETB", 24: "CAN", 25: "EM", 26: "SUB", 27: "ESC",
  28: "FS", 29: "GS", 30: "RS", 31: "US", 32: "SPACE", 127: "DEL"
};

const CS160_GLYPH_OVERRIDES = { 9: "⇥", 10: "⏎", 13: "↵", 32: "␣" };

/** Visible stand-in for a character that wouldn't otherwise render or be
 *  clickable (control characters, the space character). Falls back to the
 *  character itself for anything else. */
function cs160Glyph(code, fallback) {
  if (CS160_GLYPH_OVERRIDES[code]) return CS160_GLYPH_OVERRIDES[code];
  if (code < 32 || code === 127) return CS160_CONTROL_NAMES[code] || "?";
  return fallback;
}

function cs160EscapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}
