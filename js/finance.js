(function () {
  function n(v) {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }

  function taxBase(income, regime) {
    const slabs = regime === "New"
      ? [[400000, 0], [800000, 0.05], [1200000, 0.10], [1600000, 0.15], [2000000, 0.20], [2400000, 0.25], [Infinity, 0.30]]
      : [[250000, 0], [500000, 0.05], [1000000, 0.20], [Infinity, 0.30]];
    let tax = 0;
    let prev = 0;
    for (const [cap, rate] of slabs) {
      tax += Math.max(0, Math.min(income, cap) - prev) * rate;
      prev = cap;
      if (income <= cap) break;
    }
    if (income <= (regime === "New" ? 1200000 : 500000)) tax = 0;
    return tax;
  }

  function payroll(settings) {
    const appraisal = n(settings.appraisal) / 100;
    const baseGrossMonthly = n(settings.fixed_salary) / 12;

    // Proportional weights for each salary component
    const weights = {
      Basic: n(settings.basic),
      HRA: n(settings.hra),
      Conveyance: n(settings.conveyance),
      "Competency Allowance": n(settings.competency),
      "Food Coupon": n(settings.food),
      "Education Allowance": n(settings.education),
      "Books & Periodicals": n(settings.books),
    };
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;

    // Only Basic, HRA, and Competency Allowance scale with appraisal
    const appraised = new Set(["Basic", "HRA", "Competency Allowance"]);
    const earnings = {};
    for (const k of Object.keys(weights)) {
      const baseAmt = baseGrossMonthly * (weights[k] / totalWeight);
      earnings[k] = appraised.has(k) ? baseAmt * (1 + appraisal) : baseAmt;
    }

    const grossMonthly = Object.values(earnings).reduce((a, b) => a + b, 0);
    const annualFixedGross = grossMonthly * 12;

    // Cab is taxable Other Earnings paid via payroll each month
    const monthlyCab = n(settings.office_days) * n(settings.cab_rate);
    const annualCab = monthlyCab * 12;

    // Total payslip gross = fixed components + cab
    const grossMonthlyTotal = grossMonthly + monthlyCab;

    // CTC Part A = fixed salary + phone reimbursement + employer PF (all annualised)
    const annualPartA = annualFixedGross + n(settings.phone) * 12 + n(settings.pf) * 12;

    // Tax basis (Form 16 gross) = fixed + cab  (phone and employer PF are excluded)
    const annualTaxGross = annualFixedGross + annualCab;

    const reimbursements = {
      "Phone Reimbursement": n(settings.phone),
    };
    const standardDeduction = settings.tax_regime === "New" ? 75000 : 50000;
    const taxable = Math.max(0, annualTaxGross - standardDeduction);
    const incomeTax = taxBase(taxable, settings.tax_regime);
    const cess = incomeTax * 0.04;
    const annualTax = incomeTax + cess;
    const tds = annualTax / 12;
    const foodDed = earnings["Food Coupon"];
    const totalDeductions = tds + n(settings.pf) + foodDed;
    const netSalary = grossMonthlyTotal - totalDeductions;
    const salaryBankCredit = netSalary + reimbursements["Phone Reimbursement"];
    const partB = n(settings.part_b);
    const annualCtc = annualPartA + partB;

    return {
      annual_part_a: annualPartA,
      annual_part_b: partB,
      annual_gross_ctc: annualCtc,
      gross: grossMonthlyTotal,
      taxable,
      income_tax: incomeTax,
      cess,
      annual_tax: annualTax,
      tds,
      net: netSalary,
      salary_bank_credit: salaryBankCredit,
      cab: monthlyCab,
      total_received: salaryBankCredit,
      earnings: { ...earnings, "Cab Allowance": monthlyCab },
      deductions: {
        "Income Tax": tds,
        PF: n(settings.pf),
        "Food Coupon Deduction": foodDed,
      },
      reimbursements,
      totals: {
        "Gross Salary": grossMonthlyTotal,
        "Total Deductions": totalDeductions,
        "Net Salary": netSalary,
        "Salary Bank Credit": salaryBankCredit,
      },
      tax_breakdown: {
        "Annual Fixed Salary (excl. Phone & Cab)": annualFixedGross,
        "Annual Cab Allowance": annualCab,
        "Annual Gross (Tax Basis / Form 16)": annualTaxGross,
        "Standard Deduction": standardDeduction,
        "Final Taxable Income": taxable,
        "Income Tax": incomeTax,
        "Health & Education Cess": cess,
        "Total Tax": annualTax,
        "Monthly TDS": tds,
      },
      yearly_summary: {
        "Part A (Fixed + Phone + Employer PF)": annualPartA,
        "Part B (Employer Benefits)": partB,
        "Gross CTC (Part A + Part B)": annualCtc,
        "Annual Gross Tax Basis (Form 16)": annualTaxGross,
        "Gross TDS / Tax (Annual)": annualTax,
        "Monthly TDS": tds,
      },
    };
  }

  function dashboard(state) {
    const p = payroll(state.settings);
    const expenses = state.entities.expenses.reduce((s, e) => s + n(e.amount), 0);
    const emi = state.entities.loans.filter((x) => x.kind === "Payable").reduce((s, l) => s + n(l.emi), 0);
    const funds = state.entities.funds.reduce((s, f) => s + n(f.current), 0);
    const prop = state.entities.properties.reduce((s, r) => s + n(r.current), 0);
    const receivable = state.entities.loans.filter((x) => x.kind === "Receivable").reduce((s, l) => s + n(l.principal), 0);
    const liabilities = state.entities.loans.filter((x) => x.kind === "Payable").reduce((s, l) => s + n(l.principal), 0);
    const income = p.salary_bank_credit + n(state.settings.side_income);
    const out = expenses + emi;
    const assets = funds + prop + receivable + n(state.settings.cash);
    return {
      ...p,
      income,
      expenses: out,
      cashflow: income - out,
      savings: income ? ((income - out) / income) * 100 : 0,
      funds,
      assets,
      liabilities,
      networth: assets - liabilities,
    };
  }

  function projection(state) {
    const years = Math.max(0, n(state.settings.projection_years));
    const includeFunds = !!state.settings.include_funds;
    const includeCashflow = !!state.settings.include_cashflow;
    const monthlyRate = includeFunds ? n(state.settings.projection_cagr) / 1200 : 0;
    const absReturn = includeFunds ? n(state.settings.projection_abs_return) / 100 : 0;
    let fundValue = includeFunds ? dashboard(state).funds * (1 + absReturn) : 0;
    let cashValue = 0;
    const contribution = (includeCashflow ? dashboard(state).cashflow : 0) + n(state.settings.projection_monthly_dev) + n(state.settings.projection_yearly_dev) / 12;
    const months = years * 12;
    const monthlyRows = [];
    const yearlyRows = [];
    if (months === 0) {
      monthlyRows.push([0, 0, fundValue, cashValue, fundValue + cashValue]);
      yearlyRows.push([0, fundValue, cashValue, fundValue + cashValue]);
    } else {
      for (let m = 1; m <= months; m += 1) {
        fundValue *= 1 + monthlyRate;
        cashValue = cashValue * (1 + monthlyRate) + contribution;
        const year = Math.floor((m - 1) / 12) + 1;
        const month = ((m - 1) % 12) + 1;
        monthlyRows.push([year, month, fundValue, cashValue, fundValue + cashValue]);
        if (month === 12) yearlyRows.push([year, fundValue, cashValue, fundValue + cashValue]);
      }
    }
    return { monthlyRows, yearlyRows, fundValue, cashValue, total: fundValue + cashValue };
  }

  window.KhaiFinMath = { n, payroll, dashboard, projection };
})();
