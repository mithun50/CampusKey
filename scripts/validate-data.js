// Validates data/offers.js: required fields, safe URLs, unique ids, and the
// project rule of no emojis and no en or em dashes anywhere in the text.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "data/offers.js"), "utf8"), sandbox);
const data = sandbox.window.CAMPUSKEY_DATA;

const errors = [];
const required = ["name", "provider", "category", "offer", "value", "eligibility", "verification", "steps", "url", "sources", "india", "confidence"];
const banned = /[–—‒―]|[\u{1F000}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|️/u;
const ids = new Set();

if (!data || !Array.isArray(data.offers) || !data.offers.length) errors.push("No offers found");

(data.offers || []).forEach((o, i) => {
  const where = `offer ${i} (${o.name || "unnamed"})`;
  required.forEach((k) => {
    if (o[k] == null || (Array.isArray(o[k]) ? !o[k].length : String(o[k]).trim() === "")) errors.push(`${where}: missing ${k}`);
  });
  if (!/^https:\/\//.test(o.url || "")) errors.push(`${where}: url must be https`);
  (o.sources || []).forEach((s) => { if (!/^https?:\/\//.test(s)) errors.push(`${where}: bad source ${s}`); });
  if (!["high", "medium", "low"].includes(o.confidence)) errors.push(`${where}: bad confidence`);
  if (!["confirmed", "likely", "unclear"].includes(o.india)) errors.push(`${where}: bad india value`);
  const id = String(o.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (ids.has(id)) errors.push(`${where}: duplicate id ${id}`);
  ids.add(id);
});

// Scan every text file shipped with the site for banned characters.
["index.html", "css/styles.css", "js/app.js", "data/offers.js", "README.md"].forEach((f) => {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) return;
  fs.readFileSync(p, "utf8").split("\n").forEach((line, n) => {
    if (banned.test(line)) errors.push(`${f}:${n + 1}: contains an emoji or en/em dash`);
  });
});

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK: ${data.offers.length} offers valid, checked ${data.checked}`);
