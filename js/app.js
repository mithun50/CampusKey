/* CampusKey app: filters, search, rendering and the detail sheet. No dependencies. */
(function () {
  "use strict";

  var DATA = window.CAMPUSKEY_DATA || { checked: "", offers: [] };
  var offers = DATA.offers.map(function (o, i) {
    o.id = o.id || slug(o.name);
    o._order = i;
    return o;
  });

  var state = { q: "", cat: "All", proof: "all", sort: "featured" };

  var $ = function (id) { return document.getElementById(id); };
  var grid = $("grid"), chips = $("chips"), count = $("result-count"), empty = $("empty");
  var dialog = $("detail"), lastFocus = null;

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Only allow http(s) links from the data file.
  function safeUrl(u) {
    return /^https?:\/\//i.test(u || "") ? u : "#";
  }

  function acceptsEmail(o) {
    return o.verification.some(function (v) { return /email/i.test(v); });
  }
  function acceptsId(o) {
    return o.verification.some(function (v) { return /id card|enrollment|bonafide|document|proof|sheerid|unidays|isic/i.test(v); });
  }
  function isFree(o) { return /^free/i.test(o.value); }

  function categories() {
    var seen = {};
    offers.forEach(function (o) { seen[o.category] = (seen[o.category] || 0) + 1; });
    return Object.keys(seen).sort().map(function (k) { return { name: k, n: seen[k] }; });
  }

  function matches(o) {
    if (state.cat !== "All" && o.category !== state.cat) return false;
    if (state.proof === "email" && !acceptsEmail(o)) return false;
    if (state.proof === "id" && !acceptsId(o)) return false;
    if (state.q) {
      var hay = [o.name, o.provider, o.category, o.offer, o.value, o.eligibility, o.notes].join(" ").toLowerCase();
      var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) === -1) return false;
    }
    return true;
  }

  function sorted(list) {
    var confRank = { high: 0, medium: 1, low: 2 };
    return list.slice().sort(function (a, b) {
      if (state.sort === "name") return a.name.localeCompare(b.name);
      if (state.sort === "free") {
        var d = (isFree(a) ? 0 : 1) - (isFree(b) ? 0 : 1);
        if (d) return d;
      }
      var c = (confRank[a.confidence] || 1) - (confRank[b.confidence] || 1);
      return c || a._order - b._order;
    });
  }

  function renderStats() {
    var free = offers.filter(isFree).length;
    var cats = categories().length;
    $("stats").innerHTML =
      '<div class="stat"><strong>' + offers.length + '</strong><span>offers</span></div>' +
      '<div class="stat"><strong>' + free + '</strong><span>fully free</span></div>' +
      '<div class="stat"><strong>' + cats + '</strong><span>' + (cats === 1 ? "category" : "categories") + '</span></div>';
    $("checked-date").textContent = DATA.checked;
  }

  function renderChips() {
    var list = [{ name: "All", n: offers.length }].concat(categories());
    chips.innerHTML = list.map(function (c) {
      return '<button type="button" class="chip" data-cat="' + esc(c.name) + '" aria-pressed="' +
        (state.cat === c.name) + '">' + esc(c.name) + '<span class="count">' + c.n + "</span></button>";
    }).join("");
  }

  function proofLabel(o) {
    var e = acceptsEmail(o), i = acceptsId(o);
    if (e && i) return "College email or ID";
    if (e) return "College email";
    if (i) return "ID card or document";
    return o.verification[0] || "See details";
  }

  function card(o) {
    return '<article class="card" data-id="' + esc(o.id) + '">' +
      '<div class="card-top"><div><h3>' + esc(o.name) + '</h3><p class="provider">' + esc(o.provider) + "</p></div>" +
      '<span class="value">' + esc(o.value) + "</span></div>" +
      '<p class="offer">' + esc(o.offer) + "</p>" +
      '<div class="tags"><span class="tag">' + esc(o.category) + '</span><span class="tag">' + esc(proofLabel(o)) +
      '</span><span class="tag conf-' + esc(o.confidence) + '">' + esc(o.confidence) + " confidence</span></div>" +
      '<div class="card-actions">' +
      '<button type="button" class="btn secondary" data-open="' + esc(o.id) + '" aria-label="How to claim ' + esc(o.name) + '">How to claim</button>' +
      '<a class="btn" href="' + esc(safeUrl(o.url)) + '" target="_blank" rel="noopener noreferrer" aria-label="Open official page for ' + esc(o.name) + '">Official page</a>' +
      "</div></article>";
  }

  function render() {
    var list = sorted(offers.filter(matches));
    grid.innerHTML = list.map(card).join("");
    count.textContent = list.length === 1 ? "1 offer" : list.length + " offers";
    empty.hidden = list.length > 0;
    Array.prototype.forEach.call(chips.children, function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-cat") === state.cat));
    });
  }

  function list(items, ordered) {
    var tag = ordered ? "ol" : "ul";
    return "<" + tag + ">" + items.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</" + tag + ">";
  }

  function section(title, html) {
    return '<div class="detail-section"><h3>' + title + "</h3>" + html + "</div>";
  }

  function openDetail(id, push) {
    var o = offers.filter(function (x) { return x.id === id; })[0];
    if (!o) return;
    lastFocus = document.activeElement;
    $("detail-title").textContent = o.name;
    $("detail-provider").textContent = o.provider + " . " + o.category;
    var sources = (o.sources || []).map(function (u) {
      return '<li><a href="' + esc(safeUrl(u)) + '" target="_blank" rel="noopener noreferrer">' + esc(u.replace(/^https?:\/\//, "")) + "</a></li>";
    }).join("");
    $("detail-body").innerHTML =
      section("What you get", "<p>" + esc(o.offer) + "</p>") +
      section("Value", "<p>" + esc(o.value) + "</p>") +
      section("Who can claim", "<p>" + esc(o.eligibility) + "</p>") +
      section("Proof you need", list(o.verification, false)) +
      section("Steps to claim", list(o.steps, true)) +
      (o.notes ? section("Good to know", "<p>" + esc(o.notes) + "</p>") : "") +
      section("Availability in India", "<p>" + esc(o.india === "confirmed" ? "Confirmed on the official page" : o.india === "likely" ? "Likely available, confirm on the official page" : "Unclear, confirm before applying") +
        ". Confidence: " + esc(o.confidence) + ".</p>") +
      (sources ? section("Sources checked", "<ul>" + sources + "</ul>") : "") +
      '<div class="detail-actions"><a class="btn" href="' + esc(safeUrl(o.url)) + '" target="_blank" rel="noopener noreferrer">Go to official page</a>' +
      '<button type="button" class="btn secondary" id="copy-link">Copy link to this offer</button></div>';
    $("copy-link").addEventListener("click", function (e) {
      var url = location.href.split("#")[0] + "#" + o.id;
      var btn = e.currentTarget;
      var done = function () { btn.textContent = "Link copied"; };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done); else done();
    });
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("dialog-open");
    dialog.querySelector(".dialog-inner").scrollTop = 0;
    if (push !== false && location.hash !== "#" + o.id) history.pushState(null, "", "#" + o.id);
  }

  function closeDetail() {
    if (dialog.open) dialog.close();
  }

  dialog.addEventListener("close", function () {
    document.body.classList.remove("dialog-open");
    if (offers.some(function (o) { return "#" + o.id === location.hash; })) {
      history.pushState(null, "", location.pathname + location.search);
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  });
  // Tap on the backdrop closes the sheet.
  dialog.addEventListener("click", function (e) { if (e.target === dialog) closeDetail(); });
  $("detail-close").addEventListener("click", closeDetail);

  // Android back button closes the sheet instead of leaving the page.
  window.addEventListener("popstate", function () {
    var id = location.hash.slice(1);
    if (id && offers.some(function (o) { return o.id === id; })) openDetail(id, false);
    else closeDetail();
  });

  grid.addEventListener("click", function (e) {
    var b = e.target.closest("[data-open]");
    if (b) openDetail(b.getAttribute("data-open"));
  });

  chips.addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]");
    if (!b) return;
    state.cat = b.getAttribute("data-cat");
    render();
  });

  var t;
  $("search").addEventListener("input", function (e) {
    clearTimeout(t);
    t = setTimeout(function () { state.q = e.target.value.trim(); render(); }, 120);
  });
  $("proof").addEventListener("change", function (e) { state.proof = e.target.value; render(); });
  $("sort").addEventListener("change", function (e) { state.sort = e.target.value; render(); });
  $("reset").addEventListener("click", function () {
    state = { q: "", cat: "All", proof: "all", sort: state.sort };
    $("search").value = ""; $("proof").value = "all";
    render();
  });

  renderStats();
  renderChips();
  render();

  var initial = location.hash.slice(1);
  if (initial && offers.some(function (o) { return o.id === initial; })) openDetail(initial, false);
})();
