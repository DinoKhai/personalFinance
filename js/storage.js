(function () {
  const KEY = "khaifin_app_v1";

  const defaults = {
    schemaVersion: 1,
    settings: {
      fixed_salary: 2435796,
      basic: 91342,
      hra: 68507,
      conveyance: 8000,
      competency: 22134,
      food: 2200,
      education: 3000,
      books: 3000,
      phone: 3000,
      pf: 1800,
      part_b: 57888,
      cab_rate: 500,
      office_days: 12,
      appraisal: 0,
      tax_regime: "New",
      cash: 0,
      side_income: 16550,
      projection_years: 0,
      projection_cagr: 0,
      projection_abs_return: 0,
      projection_monthly_dev: 0,
      projection_yearly_dev: 0,
      include_funds: true,
      include_cashflow: true,
      nav_collapsed: false,
      payroll_view: "monthly",
      payroll_inputs_expanded: true,
      compare_inputs_expanded: true,
      compare_summary_expanded: true,
      theme: "dark",
    },
    entities: {
      expenses: [
        { id: 1, name: "Rent", amount: 21000, category: "Home", recurring: "Monthly" },
        { id: 2, name: "Metro", amount: 1000, category: "Transport", recurring: "Monthly" },
        { id: 3, name: "Mutual Fund SIPs", amount: 21000, category: "Investments", recurring: "Monthly" },
        { id: 4, name: "Wi-Fi", amount: 1008, category: "Utilities", recurring: "Monthly" },
        { id: 5, name: "Spotify", amount: 149, category: "Subscriptions", recurring: "Monthly" },
        { id: 6, name: "Netflix", amount: 199, category: "Subscriptions", recurring: "Monthly" },
        { id: 7, name: "Personal + Food", amount: 12500, category: "Lifestyle", recurring: "Monthly" },
        { id: 8, name: "Amazon Prime (Monthly Avg)", amount: 125, category: "Subscriptions", recurring: "Monthly" },
        { id: 9, name: "Disney+ Hotstar (Monthly Avg)", amount: 75, category: "Subscriptions", recurring: "Monthly" },
        { id: 10, name: "iCloud (Monthly Avg)", amount: 208, category: "Subscriptions", recurring: "Monthly" },
      ],
      loans: [
        { id: 1, name: "Kotak Loan", emi: 23811, principal: 0, kind: "Payable" },
        { id: 2, name: "Axis Loan", emi: 14591, principal: 0, kind: "Payable" },
        { id: 3, name: "SBI Loan", emi: 3905, principal: 0, kind: "Payable" },
        { id: 4, name: "Nuther Loan 1", emi: 9300, principal: 310000, kind: "Receivable" },
        { id: 5, name: "Nuther Loan 2", emi: 4250, principal: 170000, kind: "Receivable" },
        { id: 6, name: "Rodha", emi: 3000, principal: 100000, kind: "Receivable" },
      ],
      funds: [
        { id: 1, name: "SBI Small Cap Fund Regular Growth", invested: 69000, current: 73891.97, units: 409.081, sip: 3000 },
        { id: 2, name: "SBI Contra Fund Regular Growth", invested: 69000, current: 68905.99, units: 182.724, sip: 3000 },
        { id: 3, name: "SBI Focused Fund Regular Growth", invested: 46000, current: 51403.87, units: 0, sip: 2000 },
        { id: 4, name: "SBI PSU Fund Regular Growth", invested: 46000, current: 49177.23, units: 0, sip: 2000 },
        { id: 5, name: "SBI ELSS Tax Saver Fund", invested: 46000, current: 47033, units: 0, sip: 2000 },
        { id: 6, name: "SBI Multi Asset Allocation Fund", invested: 39000, current: 40900.9, units: 0, sip: 3000 },
        { id: 7, name: "SBI Equity Hybrid Fund", invested: 39000, current: 40178.25, units: 0, sip: 3000 },
        { id: 8, name: "SBI Automotive Opportunities Fund", invested: 23000, current: 27353.63, units: 0, sip: 1000 },
        { id: 9, name: "SBI Innovative Opportunities Fund", invested: 23000, current: 24461.01, units: 0, sip: 1000 },
        { id: 10, name: "SBI Energy Opportunities Fund", invested: 23000, current: 24425.78, units: 0, sip: 1000 },
      ],
      properties: [
        { id: 1, name: "Tollen Land", purchase: 800000, current: 1500000 },
        { id: 2, name: "Leisang Land", purchase: 750000, current: 0 },
        { id: 3, name: "Store Building (GF 14x14, FF 56x14)", purchase: 0, current: 0 },
        { id: 4, name: "Khongsai Veng Land (70x40)", purchase: 0, current: 0 },
      ],
    },
    meta: {
      lastExportAt: null,
    },
  };

  function deepClone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  const NUMERIC_SETTING_KEYS = new Set([
    "fixed_salary", "basic", "hra", "conveyance", "competency", "food", "education", "books", "phone", "pf", "part_b",
    "cab_rate", "office_days", "appraisal", "cash", "side_income",
    "projection_years", "projection_cagr", "projection_abs_return", "projection_monthly_dev", "projection_yearly_dev",
  ]);
  const BOOLEAN_SETTING_KEYS = new Set(["include_funds", "include_cashflow", "nav_collapsed", "payroll_inputs_expanded", "compare_inputs_expanded", "compare_summary_expanded"]);
  const NUMERIC_ENTITY_KEYS = new Set(["id", "amount", "emi", "principal", "invested", "current", "units", "sip", "purchase"]);

  function parseScalar(value) {
    if (value === true || value === false) return value;
    if (value === null || value === undefined) return "";
    const str = String(value).trim();
    if (str === "") return "";
    if (/^(true|false)$/i.test(str)) return str.toLowerCase() === "true";
    const num = Number(str);
    if (!Number.isNaN(num) && Number.isFinite(num)) return num;
    return str;
  }

  function castSettings(settings) {
    const out = { ...settings };
    for (const key of Object.keys(out)) {
      if (NUMERIC_SETTING_KEYS.has(key)) {
        const n = Number(out[key]);
        out[key] = Number.isFinite(n) ? n : defaults.settings[key] ?? 0;
      } else if (BOOLEAN_SETTING_KEYS.has(key)) {
        out[key] = out[key] === true || String(out[key]).toLowerCase() === "true";
      }
    }
    return out;
  }

  function castEntities(entities) {
    const out = deepClone(entities);
    for (const collection of Object.keys(out)) {
      out[collection] = out[collection].map((row) => {
        const copy = { ...row };
        for (const key of Object.keys(copy)) {
          if (NUMERIC_ENTITY_KEYS.has(key)) {
            const n = Number(copy[key]);
            copy[key] = Number.isFinite(n) ? n : 0;
          }
        }
        return copy;
      }).map((row, index) => ({ ...row, id: index + 1 }));
    }
    return out;
  }

  function mergeNamedRows(existingRows, defaultRows, keyFn) {
    const merged = Array.isArray(existingRows) ? existingRows.map((row) => ({ ...row })) : [];
    const rowKey = keyFn || ((row) => String(row.name || "").trim().toLowerCase());
    const byName = new Set(merged.map((row) => rowKey(row)).filter(Boolean));
    let next = merged.reduce((m, row) => Math.max(m, Number(row.id) || 0), 0) + 1;
    for (const seed of defaultRows) {
      const key = rowKey(seed);
      if (!key || byName.has(key)) continue;
      merged.push({ ...seed, id: next });
      byName.add(key);
      next += 1;
    }
    return merged;
  }

  function canonicalFundName(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\b(regular|growth|fund)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function canonicalLoanName(name, kind) {
    return `${String(kind || "").toLowerCase()}::${String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\bloan\b/g, " ")
      .replace(/\s+/g, " ")
      .trim()}`;
  }

  function dedupeRowsByKey(rows, keyFn) {
    const out = [];
    const seen = new Set();
    for (const row of rows) {
      const key = keyFn(row);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(row);
    }
    return out;
  }

  function migrate(state) {
    const safe = state && typeof state === "object" ? state : deepClone(defaults);
    if (!safe.schemaVersion) safe.schemaVersion = 1;
    if (!safe.settings) safe.settings = {};
    if (!safe.entities) safe.entities = {};
    safe.settings = { ...defaults.settings, ...safe.settings };
    safe.entities = {
      expenses: Array.isArray(safe.entities.expenses) ? safe.entities.expenses : deepClone(defaults.entities.expenses),
      loans: Array.isArray(safe.entities.loans) ? safe.entities.loans : deepClone(defaults.entities.loans),
      funds: Array.isArray(safe.entities.funds) ? safe.entities.funds : deepClone(defaults.entities.funds),
      properties: Array.isArray(safe.entities.properties) ? safe.entities.properties : deepClone(defaults.entities.properties),
    };
    safe.entities.expenses = mergeNamedRows(safe.entities.expenses, defaults.entities.expenses);
    safe.entities.loans = mergeNamedRows(safe.entities.loans, defaults.entities.loans, (row) => canonicalLoanName(row.name, row.kind));
    safe.entities.loans = dedupeRowsByKey(safe.entities.loans, (row) => canonicalLoanName(row.name, row.kind));
    safe.entities.funds = mergeNamedRows(safe.entities.funds, defaults.entities.funds, (row) => canonicalFundName(row.name));
    safe.entities.funds = dedupeRowsByKey(safe.entities.funds, (row) => canonicalFundName(row.name));
    safe.entities.properties = mergeNamedRows(safe.entities.properties, defaults.entities.properties);
    safe.settings = castSettings(safe.settings);
    safe.entities = castEntities(safe.entities);
    if (!safe.meta) safe.meta = {};
    safe.meta = { ...defaults.meta, ...safe.meta };
    return safe;
  }

  const Storage = {
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return deepClone(defaults);
        return migrate(JSON.parse(raw));
      } catch (_e) {
        return deepClone(defaults);
      }
    },
    save(state) {
      localStorage.setItem(KEY, JSON.stringify(state));
    },
    export(state) {
      if (typeof XLSX === "undefined") {
        alert("Excel engine not loaded.");
        return;
      }
      const payload = deepClone(state);
      payload.meta.lastExportAt = new Date().toISOString();
      const wb = XLSX.utils.book_new();

      const settingsRows = Object.entries(payload.settings).map(([key, value]) => ({ key, value }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(settingsRows), "Settings");

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payload.entities.expenses), "Expenses");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payload.entities.loans), "Loans");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payload.entities.funds), "Funds");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payload.entities.properties), "Properties");

      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet([{ schemaVersion: payload.schemaVersion, lastExportAt: payload.meta.lastExportAt }]),
        "Meta",
      );

      const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `khaifin-backup-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
    importFile(file, onDone) {
      if (typeof XLSX === "undefined") {
        alert("Excel engine not loaded.");
        return;
      }
      const fr = new FileReader();
      fr.onload = () => {
        try {
          const wb = XLSX.read(fr.result, { type: "array" });
          const readSheet = (name) => {
            const sheet = wb.Sheets[name];
            if (!sheet) return [];
            return XLSX.utils.sheet_to_json(sheet, { defval: "" });
          };

          const settingsRows = readSheet("Settings");
          const settings = {};
          for (const row of settingsRows) {
            const key = String(row.key || "").trim();
            if (!key) continue;
            settings[key] = parseScalar(row.value);
          }

          const imported = {
            schemaVersion: 1,
            settings,
            entities: {
              expenses: readSheet("Expenses"),
              loans: readSheet("Loans"),
              funds: readSheet("Funds"),
              properties: readSheet("Properties"),
            },
            meta: {},
          };
          onDone(migrate(imported));
        } catch (_e) {
          alert("Invalid Excel backup file.");
        }
      };
      fr.readAsArrayBuffer(file);
    },
    nextId(items) {
      return items.reduce((m, it) => Math.max(m, Number(it.id) || 0), 0) + 1;
    },
  };

  window.KhaiFinStorage = Storage;
})();
