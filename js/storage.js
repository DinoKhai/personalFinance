(function () {
  const KEY = "khaifin_app_v1";

  const defaults = {
    schemaVersion: 1,
    settings: {
      fixed_salary: 2378196,
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
      office_days: 13,
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
      theme: "dark",
    },
    entities: {
      expenses: [
        { id: 1, name: "Rent", amount: 21000, category: "Home", recurring: "Monthly" },
        { id: 2, name: "Mutual Fund SIPs", amount: 21000, category: "Investments", recurring: "Monthly" },
        { id: 3, name: "Metro", amount: 1000, category: "Transport", recurring: "Monthly" },
      ],
      loans: [
        { id: 1, name: "SBI", emi: 3905, principal: 0, kind: "Payable" },
        { id: 2, name: "Axis", emi: 14591, principal: 0, kind: "Payable" },
        { id: 3, name: "Nuther", emi: 9300, principal: 310000, kind: "Receivable" },
      ],
      funds: [
        { id: 1, name: "SBI Small Cap", invested: 69000, current: 73891.97, units: 409.081, sip: 3000 },
        { id: 2, name: "SBI Contra", invested: 69000, current: 68905.99, units: 182.724, sip: 3000 },
      ],
      properties: [
        { id: 1, name: "Tollen Land", purchase: 800000, current: 1500000 },
        { id: 2, name: "Leisang Land", purchase: 750000, current: 0 },
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
  const BOOLEAN_SETTING_KEYS = new Set(["include_funds", "include_cashflow", "nav_collapsed", "payroll_inputs_expanded"]);
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
      });
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
