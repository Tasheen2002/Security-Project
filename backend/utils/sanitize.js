// utils/sanitize.js
// Basic input sanitization to prevent XSS and injection

export function sanitize(str) {
  if (typeof str !== "string") return "";
  return str.replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}
