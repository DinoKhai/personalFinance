(function () {
  function fmtINR(value) {
    const v = Math.round(Number(value) || 0);
    const sign = v < 0 ? "-" : "";
    const s = String(Math.abs(v));
    if (s.length <= 3) return `${sign}₹${s}`;
    const last3 = s.slice(-3);
    let rest = s.slice(0, -3);
    const parts = [];
    while (rest.length > 2) {
      parts.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest) parts.unshift(rest);
    return `${sign}₹${parts.join(",")},${last3}`;
  }

  function esc(v) {
    return String(v ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  function statCard(k, v, klass = "") {
    return `<div class="stat ${klass}"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`;
  }

  function shallowCopyRows(rows) {
    return rows.map((r) => ({ ...r }));
  }

  window.KhaiFinUI = { fmtINR, esc, statCard, shallowCopyRows };
})();
