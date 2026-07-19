(function () {
  const { load, save, export: exportJson, importFile, nextId } = window.KhaiFinStorage;
  const M = window.KhaiFinMath;
  const U = window.KhaiFinUI;

  const tabs = [
    { id: "overview", label: "Overview", icon: "home", group: "workspace" },
    { id: "payroll", label: "Payroll", icon: "receipt", group: "workspace" },
    { id: "expenses", label: "Cash flow", icon: "arrow-right-left", group: "workspace" },
    { id: "funds", label: "Investments", icon: "chart", group: "workspace" },
    { id: "loans", label: "Loans", icon: "wallet", group: "workspace" },
    { id: "properties", label: "Real estate", icon: "building", group: "workspace" },
    { id: "networth", label: "Net worth", icon: "scale", group: "analysis" },
    { id: "projection", label: "Projection", icon: "spark", group: "analysis" },
    { id: "compare", label: "Compare", icon: "compare", group: "analysis" },
  ];
  const navGroups = [
    { id: "workspace", label: "Workspace" },
    { id: "analysis", label: "Analytics" },
  ];
  const NAV_ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13V10.5"/></svg>',
    receipt: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21 8 19.5 6 21z"/><path d="M9 8h6M9 12h6"/></svg>',
    "arrow-right-left": '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M17 4l3 3-3 3"/><path d="M20 7H8"/><path d="M7 20l-3-3 3-3"/><path d="M4 17h12"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 20h16"/><path d="M7 16v-5"/><path d="M12 16V8"/><path d="M17 16v-3"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 7h18v12H3z"/><path d="M3 10h18"/><path d="M16.5 14.5h2"/></svg>',
    building: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 21V5h16v16"/><path d="M9 9h2M13 9h2M9 13h2M13 13h2M11 21v-4h2"/></svg>',
    scale: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v16"/><path d="M5 8h14"/><path d="M7 8l-3 5h6z"/><path d="M17 8l-3 5h6z"/><path d="M9 20h6"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v5"/><path d="m7.5 6.5 2.8 2.8"/><path d="M3 12h5"/><path d="m7.5 17.5 2.8-2.8"/><path d="M12 16v5"/><path d="m16.5 14.7-2.8 2.8"/><path d="M16 12h5"/><path d="m16.5 9.3-2.8-2.8"/></svg>',
    compare: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"/><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M12 7v10"/><path d="m9 10-3 3 3 3"/><path d="m15 10 3 3-3 3"/></svg>',
  };

  let state = load();
  let currentTab = "overview";
  const page = document.getElementById("page-content");
  const title = document.getElementById("page-title");
  const kicker = document.getElementById("page-kicker");
  const appRoot = document.querySelector(".app");
  const navToggle = document.getElementById("btn-nav-toggle");
  const sidebar = document.querySelector(".sidebar");
  const brand = document.querySelector(".brand");
  const isMobileView = () => window.matchMedia("(max-width:1080px)").matches;

  function setTheme() {
    document.body.classList.toggle("light", state.settings.theme === "light");
  }

  function persist() {
    save(state);
  }

  function setTab(tab) {
    currentTab = tab;
    if (isMobileView()) {
      state.settings.nav_collapsed = true;
      persist();
      applyNavState();
    }
    render();
  }

  function updateSetting(key, value) {
    state.settings[key] = value;
  }

  function n(v) {
    return M.n(v);
  }

  function navShortLabel(label) {
    return label
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function applyNavState() {
    const collapsed = !!state.settings.nav_collapsed;
    appRoot.classList.toggle("nav-collapsed", collapsed);
    navToggle.title = collapsed ? "Expand sidebar" : "Collapse sidebar";
    navToggle.setAttribute("aria-label", navToggle.title);
  }

  function collapseNav() {
    if (state.settings.nav_collapsed) return;
    state.settings.nav_collapsed = true;
    persist();
    applyNavState();
  }

  function renderNav() {
    const nav = document.getElementById("nav");
    nav.innerHTML = navGroups.map((group) => {
      const items = tabs.filter((tab) => tab.group === group.id).map((tab) => `
        <button data-tab="${tab.id}" data-short="${navShortLabel(tab.label)}" title="${tab.label}" class="nav-item ${tab.id === currentTab ? "active" : ""}">
          <span class="nav-icon">${NAV_ICONS[tab.icon] || NAV_ICONS.home}</span>
          <span class="nav-label">${tab.label}</span>
        </button>
      `).join("");
      return `<section class="nav-group"><div class="nav-group-title">${group.label}</div>${items}</section>`;
    }).join("");
    nav.querySelectorAll(".nav-item").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
  }

  function renderOverview() {
    const d = M.dashboard(state);
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const snapshotDate = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const emi = state.entities.loans.filter((x) => x.kind === "Payable").reduce((s, l) => s + n(l.emi), 0);
    const sip = state.entities.funds.reduce((s, f) => s + n(f.sip), 0);
    const receivable = state.entities.loans.filter((x) => x.kind === "Receivable").reduce((s, l) => s + n(l.principal), 0);
    const maxFlow = Math.max(d.income, d.expenses, Math.abs(d.cashflow), 1);
    const flowWidth = (v) => `${Math.max(8, Math.min(100, (Math.abs(v) / maxFlow) * 100))}%`;

    page.innerHTML = `
      <section class="overview-hero">
        <h3>${greeting}</h3>
        <p>Your financial snapshot • ${snapshotDate}</p>
      </section>

      <div class="overview-kpis">
        <article class="stat stat-income"><div class="k">MONTHLY INCOME</div><div class="v">${U.fmtINR(d.income)}</div><div class="overview-kpi-sub">Live estimate</div></article>
        <article class="stat stat-outgo"><div class="k">MONTHLY OUTGO</div><div class="v">${U.fmtINR(d.expenses)}</div><div class="overview-kpi-sub">Live estimate</div></article>
        <article class="stat stat-cash"><div class="k">CASH REMAINING</div><div class="v">${U.fmtINR(d.cashflow)}</div><div class="overview-kpi-sub">Live estimate</div></article>
        <article class="stat stat-savings"><div class="k">SAVINGS RATE</div><div class="v">${d.savings.toFixed(1)}%</div><div class="overview-kpi-sub">Live estimate</div></article>
      </div>

      <div class="overview-grid">
        <div class="panel overview-glance">
          <h4>This month at a glance</h4>
          <div class="overview-row"><span>Salary bank credit</span><strong>${U.fmtINR(d.salary_bank_credit)}</strong></div>
          <div class="overview-row"><span>Est. cab allowance (${n(state.settings.office_days)} days × ₹${n(state.settings.cab_rate)})</span><strong>${U.fmtINR(d.cab)}</strong></div>
          <div class="overview-row"><span>Total amount received (incl. cab)</span><strong>${U.fmtINR(d.total_received)}</strong></div>
          <div class="overview-row"><span>Recurring side income</span><strong>${U.fmtINR(n(state.settings.side_income))}</strong></div>
          <div class="overview-row"><span>EMIs</span><strong>${U.fmtINR(emi)}</strong></div>
          <div class="overview-row"><span>Investment SIPs</span><strong>${U.fmtINR(sip)}</strong></div>
          <div class="overview-row"><span>Tax / month</span><strong>${U.fmtINR(d.tds)}</strong></div>
          <div class="overview-row"><span>Loans receivable</span><strong>${U.fmtINR(receivable)}</strong></div>
        </div>
        <div class="panel overview-flow">
          <div class="k">CASH FLOW</div>
          <h4>Income vs outgoing</h4>
          <div class="flow-item">
            <div class="flow-head"><span>Income</span><strong>${U.fmtINR(d.income)}</strong></div>
            <div class="flow-track"><div class="flow-bar flow-income" style="width:${flowWidth(d.income)}"></div></div>
          </div>
          <div class="flow-item">
            <div class="flow-head"><span>Outgo</span><strong>${U.fmtINR(d.expenses)}</strong></div>
            <div class="flow-track"><div class="flow-bar flow-outgo" style="width:${flowWidth(d.expenses)}"></div></div>
          </div>
          <div class="flow-item">
            <div class="flow-head"><span>Free cash</span><strong>${U.fmtINR(d.cashflow)}</strong></div>
            <div class="flow-track"><div class="flow-bar flow-cash" style="width:${flowWidth(d.cashflow)}"></div></div>
          </div>
          <p class="overview-flow-note">Updated from your saved entries</p>
        </div>
      </div>
    `;
  }

  function renderPayroll() {
    const p = M.payroll(state.settings);
    const view = state.settings.payroll_view || "monthly";
    const inputsExpanded = state.settings.payroll_inputs_expanded !== false;
    page.innerHTML = `
      <div class="toolbar payroll-controls">
        <button class="payroll-toggle ${inputsExpanded ? "is-open" : ""}" id="btn-pay-toggle" aria-expanded="${inputsExpanded ? "true" : "false"}">
          <span class="payroll-toggle-caret" aria-hidden="true"></span><span>Summary</span>
        </button>
        <div class="view-switch">
          <label class="view-chip"><input type="radio" name="pay-view" value="monthly" ${view === "monthly" ? "checked" : ""}><span>Monthly view</span></label>
          <label class="view-chip"><input type="radio" name="pay-view" value="yearly" ${view === "yearly" ? "checked" : ""}><span>Yearly view</span></label>
        </div>
      </div>
      <div id="payroll-edit-block" class="${inputsExpanded ? "" : "hidden"}">
        <div class="panel payroll-top">
          <div class="grid cols-5" id="payroll-inputs"></div>
        </div>
        <div class="payroll-save-row"><button class="btn" id="btn-pay-save">Save & recalculate</button></div>
      </div>
      <div class="stats" id="payroll-stats"></div>
      <div class="panel">
        <div class="table-shell"><table><thead><tr><th>Component</th><th class="num">Value</th></tr></thead><tbody id="payroll-body"></tbody></table></div>
      </div>
    `;
    const fields = [
      ["Fixed annual salary (excl. phone & cab)", "fixed_salary"], ["Appraisal (%)", "appraisal"], ["Office days / month", "office_days"],
      ["Cab rate / day", "cab_rate"], ["Part B annual", "part_b"], ["PF / month", "pf"],
    ];
    page.querySelector("#btn-pay-toggle").addEventListener("click", () => {
      updateSetting("payroll_inputs_expanded", !inputsExpanded);
      persist();
      renderPayroll();
    });
    const box = page.querySelector("#payroll-inputs");
    if (box) {
      const syncPayrollInputs = () => {
        page.querySelectorAll("#payroll-inputs [data-key]").forEach((el) => {
          updateSetting(el.dataset.key, el.tagName === "SELECT" ? el.value : n(el.value));
        });
      };
      const savePayroll = () => {
        syncPayrollInputs();
        persist();
        renderPayroll();
      };
      box.innerHTML = fields.map(([label, key]) => `<div><label>${label}</label><input data-key="${key}" value="${U.esc(state.settings[key])}"></div>`).join("")
        + `<div><label>Tax regime</label><select data-key="tax_regime"><option ${state.settings.tax_regime === "New" ? "selected" : ""}>New</option><option ${state.settings.tax_regime === "Old" ? "selected" : ""}>Old</option></select></div>`;
      page.querySelectorAll("#payroll-inputs [data-key]").forEach((el) => {
        el.addEventListener("change", () => updateSetting(el.dataset.key, el.tagName === "SELECT" ? el.value : n(el.value)));
      });
      page.querySelector("#btn-pay-save").addEventListener("click", savePayroll);
      box.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        savePayroll();
      });
    }
    page.querySelectorAll('input[name="pay-view"]').forEach((r) => r.addEventListener("change", () => {
      updateSetting("payroll_view", r.value); persist(); renderPayroll();
    }));

    const stats = page.querySelector("#payroll-stats");
    if (view === "monthly") {
      stats.innerHTML = U.statCard("Gross Salary", U.fmtINR(p.gross))
        + U.statCard("Salary Bank Credit", U.fmtINR(p.salary_bank_credit))
        + U.statCard("Monthly Tax Deducted (TDS)", U.fmtINR(p.tds));
      page.querySelector("#payroll-body").innerHTML = Object.entries({ ...p.earnings, ...p.deductions, ...p.reimbursements }).map(([k, v]) => `<tr><td>${U.esc(k)}</td><td class="num">${U.fmtINR(v)}</td></tr>`).join("");
    } else {
      stats.innerHTML = U.statCard("Part A", U.fmtINR(p.annual_part_a))
        + U.statCard("Part B", U.fmtINR(p.annual_part_b))
        + U.statCard("Gross CTC", U.fmtINR(p.annual_gross_ctc))
        + U.statCard("Gross TDS / Tax", U.fmtINR(p.annual_tax));
      page.querySelector("#payroll-body").innerHTML = Object.entries(p.yearly_summary).map(([k, v]) => `<tr><td>${U.esc(k)}</td><td class="num">${U.fmtINR(v)}</td></tr>`).join("");
    }
  }

  function impactSummary(entityKey, before, after) {
    const msg = [];
    const add = (label, key) => {
      const d = after[key] - before[key];
      if (Math.abs(d) > 0.5) msg.push(`${label}: ${(d > 0 ? "+" : "") + U.fmtINR(d)}`);
    };
    if (entityKey === "properties") {
      add("Net worth", "networth");
      add("Assets", "assets");
      if (!msg.length) msg.push("No net worth change. Only Current Value impacts net worth.");
    } else if (entityKey === "funds") {
      add("Investments total", "funds");
      add("Assets", "assets");
      add("Net worth", "networth");
    } else if (entityKey === "loans") {
      add("Monthly expenses", "expenses");
      add("Liabilities", "liabilities");
      add("Net worth", "networth");
    } else if (entityKey === "expenses") {
      add("Monthly expenses", "expenses");
      add("Cash remaining", "cashflow");
    }
    if (msg.length) alert(msg.join("\n"));
  }

  function renderEntityGrid(entityKey, titleText, columns, numericKeys, defaultRow) {
    const rowsOriginal = state.entities[entityKey];
    let draft = U.shallowCopyRows(rowsOriginal);
    let editMode = false;
    const checked = new Set();
    const before = M.dashboard(state);

    function fundsAbs(row) {
      const inv = n(row.invested);
      const cur = n(row.current);
      const val = cur - inv;
      const pct = inv ? (val / inv) * 100 : 0;
      return `${U.fmtINR(val)} (${pct.toFixed(2)}%)`;
    }

    function draw() {
      const summaryHtml = entityKey === "funds" ? (() => {
        const invested = draft.reduce((s, r) => s + n(r.invested), 0);
        const current = draft.reduce((s, r) => s + n(r.current), 0);
        const abs = current - invested;
        const absPct = invested ? (abs / invested) * 100 : 0;
        return `
          <div class="stats">
            ${U.statCard("Current Portfolio Value", U.fmtINR(current))}
            ${U.statCard("Absolute Return Value", U.fmtINR(abs))}
            ${U.statCard("Absolute Return %", `${absPct.toFixed(2)}%`)}
            ${U.statCard("CAGR (Projection Input)", `${n(state.settings.projection_cagr).toFixed(2)}%`)}
          </div>`;
      })() : "";
      const rows = draft.map((row, i) => {
        const selectCell = editMode ? `<td class="center"><input type="checkbox" data-check="${i}" ${checked.has(i) ? "checked" : ""}></td>` : "";
        const cells = columns.map((c) => {
          if (c.key === "_absolute_return") return `<td class="num">${fundsAbs(row)}</td>`;
          if (editMode && c.key !== "id") {
            if (c.options) {
              return `<td><select data-edit="${i}:${c.key}">${c.options.map((o) => `<option ${String(row[c.key]) === o ? "selected" : ""}>${o}</option>`).join("")}</select></td>`;
            }
            return `<td><input data-edit="${i}:${c.key}" value="${U.esc(row[c.key] ?? "")}"></td>`;
          }
          const cls = c.numeric ? "num" : (c.center ? "center" : "");
          return `<td class="${cls}">${U.esc(row[c.key] ?? "")}</td>`;
        }).join("");
        return `<tr>${selectCell}${cells}</tr>`;
      }).join("");

      page.innerHTML = `
        ${summaryHtml}
        <div class="panel">
          <div class="toolbar">
            <button class="btn ghost" id="btn-edit">${editMode ? "Done editing" : "Edit grid"}</button>
            <button class="btn ghost" id="btn-add" ${editMode ? "" : "disabled"}>+ Add row</button>
            <button class="btn ghost" id="btn-remove" ${editMode ? "" : "disabled"}>Remove checked</button>
            <button class="btn" id="btn-save" ${editMode ? "" : "disabled"}>Save changes</button>
            <button class="btn ghost" id="btn-discard" ${editMode ? "" : "disabled"}>Discard changes</button>
            <span class="tag">${editMode ? "EDIT MODE ON" : "View mode"}</span>
          </div>
          <div class="table-shell">
            <table>
              <thead><tr>${editMode ? "<th class='center'>✓</th>" : ""}${columns.map((c) => `<th class="${c.numeric ? "num" : (c.center ? "center" : "")}">${U.esc(c.label)}</th>`).join("")}</tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      `;

      page.querySelector("#btn-edit").addEventListener("click", () => { editMode = !editMode; checked.clear(); draw(); });
      page.querySelector("#btn-discard").addEventListener("click", () => { draft = U.shallowCopyRows(rowsOriginal); checked.clear(); editMode = false; draw(); });
      page.querySelector("#btn-add").addEventListener("click", () => { if (!editMode) return; draft.push({ ...defaultRow }); draw(); });
      page.querySelector("#btn-remove").addEventListener("click", () => {
        if (!editMode) return;
        if (!checked.size) return;
        draft = draft.filter((_r, i) => !checked.has(i));
        checked.clear();
        draw();
      });
      page.querySelector("#btn-save").addEventListener("click", () => {
        if (!editMode) return;
        for (const r of draft) {
          for (const c of columns) {
            if (c.key === "id" || c.key === "_absolute_return") continue;
            if (String(r[c.key] ?? "").trim() === "") return alert(`${c.label} cannot be blank`);
          }
        }
        const committed = draft.map((r) => {
          const out = { ...r };
          if (!out.id) out.id = nextId(rowsOriginal.concat(draft));
          for (const k of numericKeys) out[k] = n(out[k]);
          return out;
        });
        state.entities[entityKey] = committed;
        persist();
        const after = M.dashboard(state);
        impactSummary(entityKey, before, after);
        render();
      });
      page.querySelectorAll("[data-check]").forEach((c) => c.addEventListener("change", () => {
        const idx = Number(c.dataset.check);
        if (c.checked) checked.add(idx); else checked.delete(idx);
      }));
      page.querySelectorAll("[data-edit]").forEach((e) => e.addEventListener("input", () => {
        const [iStr, key] = e.dataset.edit.split(":");
        const i = Number(iStr);
        draft[i][key] = e.value;
      }));
    }

    title.textContent = titleText;
    kicker.textContent = "Data Grid";
    draw();
  }

  function renderNetWorth() {
    const d = M.dashboard(state);
    page.innerHTML = `
      <div class="stats">
        ${U.statCard("ASSETS", U.fmtINR(d.assets))}
        ${U.statCard("LIABILITIES", U.fmtINR(d.liabilities))}
        ${U.statCard("NET WORTH", U.fmtINR(d.networth))}
      </div>
      <div class="panel grid cols-3">
        <div>
          <label>Cash balance</label>
          <input id="cash-val" value="${U.esc(state.settings.cash)}">
        </div>
        <div style="align-self:end">
          <button id="btn-cash" class="btn">Save cash</button>
        </div>
      </div>
    `;
    page.querySelector("#btn-cash").addEventListener("click", () => {
      updateSetting("cash", n(page.querySelector("#cash-val").value));
      persist();
      renderNetWorth();
    });
  }

  function renderProjection() {
    const s = state.settings;
    const r = M.projection(state);
    page.innerHTML = `
      <div class="panel">
        <div class="grid cols-5">
          <div><label>Projection years</label><input id="proj-years" value="${U.esc(s.projection_years)}"></div>
          <div><label>Investment CAGR (%)</label><input id="proj-cagr" value="${U.esc(s.projection_cagr)}" ${s.include_funds ? "" : "disabled"}></div>
          <div><label>Portfolio Absolute Return (%)</label><input id="proj-abs" value="${U.esc(s.projection_abs_return)}" ${s.include_funds ? "" : "disabled"}></div>
          <div><label>Monthly deviation (+/-)</label><input id="proj-mdev" value="${U.esc(s.projection_monthly_dev)}"></div>
          <div><label>Yearly deviation (+/-)</label><input id="proj-ydev" value="${U.esc(s.projection_yearly_dev)}"></div>
        </div>
        <div class="toolbar">
          <label class="check"><input id="proj-funds" type="checkbox" ${s.include_funds ? "checked" : ""}> Mutual funds</label>
          <label class="check"><input id="proj-cash" type="checkbox" ${s.include_cashflow ? "checked" : ""}> Monthly Cash flow</label>
          <button class="btn" id="btn-proj">Build projection</button>
        </div>
      </div>
      <div class="stats">
        ${U.statCard("MUTUAL FUNDS", U.fmtINR(r.fundValue))}
        ${U.statCard("CASH FLOW PORTION", U.fmtINR(r.cashValue))}
        ${U.statCard("TOTAL PROJECTED", U.fmtINR(r.total))}
      </div>
      <div class="panel">
        <div class="toolbar">
          <label class="check"><input type="radio" name="proj-view" value="yearly" checked> Yearly</label>
          <label class="check"><input type="radio" name="proj-view" value="monthly"> Monthly</label>
        </div>
        <div id="proj-table"></div>
      </div>
    `;

    function drawProjTable(mode) {
      const rows = mode === "yearly" ? r.yearlyRows : r.monthlyRows;
      const head = mode === "yearly"
        ? "<th class='center'>Year</th><th class='num'>Investments</th><th class='num'>Cash flow</th><th class='num'>Total</th>"
        : "<th class='center'>Year</th><th class='center'>Month</th><th class='num'>Investments</th><th class='num'>Cash flow</th><th class='num'>Total</th>";
      const body = rows.map((row) => {
        if (mode === "yearly") return `<tr><td class='center'>${row[0]}</td><td class='num'>${U.fmtINR(row[1])}</td><td class='num'>${U.fmtINR(row[2])}</td><td class='num'>${U.fmtINR(row[3])}</td></tr>`;
        return `<tr><td class='center'>${row[0]}</td><td class='center'>${String(row[1]).padStart(2, "0")}</td><td class='num'>${U.fmtINR(row[2])}</td><td class='num'>${U.fmtINR(row[3])}</td><td class='num'>${U.fmtINR(row[4])}</td></tr>`;
      }).join("");
      page.querySelector("#proj-table").innerHTML = `<div class="table-shell"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
    }

    drawProjTable("yearly");
    page.querySelectorAll('input[name="proj-view"]').forEach((rdo) => rdo.addEventListener("change", () => drawProjTable(rdo.value)));

    page.querySelector("#proj-funds").addEventListener("change", (e) => { updateSetting("include_funds", e.target.checked); persist(); renderProjection(); });
    page.querySelector("#proj-cash").addEventListener("change", (e) => { updateSetting("include_cashflow", e.target.checked); persist(); renderProjection(); });
    page.querySelector("#btn-proj").addEventListener("click", () => {
      updateSetting("projection_years", n(page.querySelector("#proj-years").value));
      updateSetting("projection_cagr", n(page.querySelector("#proj-cagr").value));
      updateSetting("projection_abs_return", n(page.querySelector("#proj-abs").value));
      updateSetting("projection_monthly_dev", n(page.querySelector("#proj-mdev").value));
      updateSetting("projection_yearly_dev", n(page.querySelector("#proj-ydev").value));
      persist();
      renderProjection();
    });
  }

  function renderCompare() {
    const s = state.settings;
    const cmp = state.settings._compare || {};
    const aFixedSalary = cmp.a_fixed_salary != null ? cmp.a_fixed_salary : n(s.fixed_salary);
    const aAppraisal  = cmp.a_appraisal  != null ? cmp.a_appraisal  : n(s.appraisal);
    const bFixedSalary = cmp.b_fixed_salary != null ? cmp.b_fixed_salary : n(s.fixed_salary);
    const bAppraisal  = cmp.b_appraisal  != null ? cmp.b_appraisal  : n(s.appraisal);

    function calc(fixedSalary, appraisal) {
      return M.payroll({ ...s, fixed_salary: fixedSalary, appraisal });
    }

    function buildResults() {
      const aVal = n(page.querySelector("#cmp-a-salary").value);
      const aApr = n(page.querySelector("#cmp-a-appraisal").value);
      const bVal = n(page.querySelector("#cmp-b-salary").value);
      const bApr = n(page.querySelector("#cmp-b-appraisal").value);
      state.settings._compare = { a_fixed_salary: aVal, a_appraisal: aApr, b_fixed_salary: bVal, b_appraisal: bApr };
      persist();
      const pa = calc(aVal, aApr);
      const pb = calc(bVal, bApr);

      const rows = [
        ["Gross Monthly", pa.gross, pb.gross],
        ["Basic", pa.earnings["Basic"], pb.earnings["Basic"]],
        ["HRA", pa.earnings["HRA"], pb.earnings["HRA"]],
        ["Competency Allowance", pa.earnings["Competency Allowance"], pb.earnings["Competency Allowance"]],
        ["Conveyance", pa.earnings["Conveyance"], pb.earnings["Conveyance"]],
        ["Food Coupon", pa.earnings["Food Coupon"], pb.earnings["Food Coupon"]],
        ["Education Allowance", pa.earnings["Education Allowance"], pb.earnings["Education Allowance"]],
        ["Books & Periodicals", pa.earnings["Books & Periodicals"], pb.earnings["Books & Periodicals"]],
        ["Phone Reimbursement", pa.reimbursements["Phone Reimbursement"], pb.reimbursements["Phone Reimbursement"]],
        ["PF Deduction", pa.deductions["PF"], pb.deductions["PF"]],
        ["Food Coupon Deduction", pa.deductions["Food Coupon Deduction"], pb.deductions["Food Coupon Deduction"]],
        ["Monthly TDS", pa.tds, pb.tds],
        ["Net Salary", pa.net, pb.net],
        ["Salary Bank Credit", pa.salary_bank_credit, pb.salary_bank_credit],
        ["Part B (Annual)", pa.annual_part_b, pb.annual_part_b],
        ["Annual Gross CTC", pa.annual_gross_ctc, pb.annual_gross_ctc],
        ["Annual Tax", pa.annual_tax, pb.annual_tax],
      ];

      const statsDiff = pb.salary_bank_credit - pa.salary_bank_credit;
      const statsSign = statsDiff >= 0 ? "+" : "";
      page.querySelector("#cmp-stats").innerHTML =
        U.statCard("Scenario A – Bank Credit", U.fmtINR(pa.salary_bank_credit))
        + U.statCard("Scenario B – Bank Credit", U.fmtINR(pb.salary_bank_credit))
        + U.statCard("Difference (B − A)", `${statsSign}${U.fmtINR(statsDiff)}`, statsDiff >= 0 ? "stat-income" : "stat-outgo");

      page.querySelector("#cmp-body").innerHTML = rows.map(([label, a, b]) => {
        const diff = b - a;
        const sign = diff > 0 ? "+" : "";
        const diffClass = diff > 0.5 ? "cmp-up" : diff < -0.5 ? "cmp-down" : "";
        return `<tr>
          <td>${U.esc(label)}</td>
          <td class="num">${U.fmtINR(a)}</td>
          <td class="num">${U.fmtINR(b)}</td>
          <td class="num ${diffClass}">${diff !== 0 ? sign + U.fmtINR(diff) : "—"}</td>
        </tr>`;
      }).join("");
    }

    page.innerHTML = `
      <div class="panel cmp-inputs">
        <div class="cmp-scenarios">
          <div class="cmp-scenario">
            <div class="cmp-scenario-label">Scenario A</div>
            <div class="grid cols-2">
              <div><label>Fixed Annual Salary</label><input id="cmp-a-salary" type="number" value="${aFixedSalary}"></div>
              <div><label>Appraisal (%)</label><input id="cmp-a-appraisal" type="number" step="0.1" value="${aAppraisal}"></div>
            </div>
          </div>
          <div class="cmp-vs" aria-hidden="true">VS</div>
          <div class="cmp-scenario">
            <div class="cmp-scenario-label">Scenario B</div>
            <div class="grid cols-2">
              <div><label>Fixed Annual Salary</label><input id="cmp-b-salary" type="number" value="${bFixedSalary}"></div>
              <div><label>Appraisal (%)</label><input id="cmp-b-appraisal" type="number" step="0.1" value="${bAppraisal}"></div>
            </div>
          </div>
        </div>
        <div class="payroll-save-row"><button class="btn" id="btn-cmp-run">Compare</button></div>
      </div>
      <div class="stats" id="cmp-stats"></div>
      <div class="panel">
        <div class="table-shell">
          <table>
            <thead><tr><th>Component</th><th class="num">Scenario A</th><th class="num">Scenario B</th><th class="num">Difference</th></tr></thead>
            <tbody id="cmp-body"></tbody>
          </table>
        </div>
      </div>
    `;

    page.querySelector("#btn-cmp-run").addEventListener("click", buildResults);
    page.querySelectorAll("#cmp-a-salary, #cmp-a-appraisal, #cmp-b-salary, #cmp-b-appraisal").forEach((el) => {
      el.addEventListener("keydown", (e) => { if (e.key === "Enter") buildResults(); });
    });
    buildResults();
  }

  function render() {
    renderNav();
    switch (currentTab) {
      case "overview":
        title.textContent = "Overview";
        kicker.textContent = "Dashboard";
        renderOverview();
        break;
      case "payroll":
        title.textContent = "Payroll";
        kicker.textContent = "Simulator";
        renderPayroll();
        break;
      case "expenses":
        renderEntityGrid(
          "expenses",
          "Cash flow",
          [{ key: "id", label: "ID", center: true }, { key: "name", label: "Name" }, { key: "amount", label: "Amount", numeric: true }, { key: "category", label: "Category" }, { key: "recurring", label: "Frequency", options: ["Monthly", "Annual", "One-off"] }],
          ["amount"],
          { id: "", name: "New expense", amount: 0, category: "Other", recurring: "Monthly" },
        );
        break;
      case "funds":
        renderEntityGrid(
          "funds",
          "Investments",
          [{ key: "id", label: "ID", center: true }, { key: "name", label: "Name" }, { key: "invested", label: "Invested", numeric: true }, { key: "current", label: "Current", numeric: true }, { key: "units", label: "Units", numeric: true }, { key: "sip", label: "SIP", numeric: true }, { key: "_absolute_return", label: "Absolute Return", numeric: true }],
          ["invested", "current", "units", "sip"],
          { id: "", name: "New fund", invested: 0, current: 0, units: 0, sip: 0 },
        );
        break;
      case "loans":
        renderEntityGrid(
          "loans",
          "Loans",
          [{ key: "id", label: "ID", center: true }, { key: "name", label: "Name" }, { key: "emi", label: "EMI / month", numeric: true }, { key: "principal", label: "Principal", numeric: true }, { key: "kind", label: "Loan Type", options: ["Payable", "Receivable"] }],
          ["emi", "principal"],
          { id: "", name: "New loan", emi: 0, principal: 0, kind: "Payable" },
        );
        break;
      case "properties":
        renderEntityGrid(
          "properties",
          "Real estate",
          [{ key: "id", label: "ID", center: true }, { key: "name", label: "Name" }, { key: "purchase", label: "Purchase Price", numeric: true }, { key: "current", label: "Current Value", numeric: true }],
          ["purchase", "current"],
          { id: "", name: "New property", purchase: 0, current: 0 },
        );
        break;
      case "networth":
        title.textContent = "Net worth";
        kicker.textContent = "Assets vs liabilities";
        renderNetWorth();
        break;
      case "projection":
        title.textContent = "Future projection";
        kicker.textContent = "Yearly + monthly";
        renderProjection();
        break;
      case "compare":
        title.textContent = "Compare scenarios";
        kicker.textContent = "Appraisal & salary";
        renderCompare();
        break;
      default:
        renderOverview();
    }
  }

  document.getElementById("btn-export").addEventListener("click", () => exportJson(state));
  document.getElementById("file-import").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    importFile(file, (imported) => {
      state = imported;
      persist();
      render();
      alert("Import completed.");
    });
    e.target.value = "";
  });
  document.getElementById("btn-theme").addEventListener("click", () => {
    state.settings.theme = state.settings.theme === "light" ? "dark" : "light";
    persist();
    setTheme();
    render();
  });
  navToggle.addEventListener("click", () => {
    state.settings.nav_collapsed = !state.settings.nav_collapsed;
    persist();
    applyNavState();
    renderNav();
  });
  document.addEventListener("click", (e) => {
    if (!isMobileView()) return;
    if (state.settings.nav_collapsed) return;
    const target = e.target;
    if (sidebar.contains(target) || navToggle.contains(target)) return;
    collapseNav();
  });
  brand.addEventListener("click", () => setTab("overview"));

  if (!isMobileView() && state.settings.nav_collapsed) {
    state.settings.nav_collapsed = false;
    persist();
  }

  setTheme();
  applyNavState();
  render();
})();
