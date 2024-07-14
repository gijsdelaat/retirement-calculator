function calculateTax(taxableIncome, age) {
    const isAOWAge = age >= 67;
    const taxBrackets = [
        { limit: 37149, rate: isAOWAge ? 0.1943 : 0.3693 },
        { limit: 73031, rate: 0.3697 },
        { limit: Infinity, rate: 0.4950 }
    ];

    let tax = 0;
    let remainingIncome = taxableIncome;

    for (let i = 0; i < taxBrackets.length; i++) {
        const bracket = taxBrackets[i];
        const taxableAmountInBracket = Math.min(remainingIncome, bracket.limit - (i > 0 ? taxBrackets[i-1].limit : 0));
        tax += taxableAmountInBracket * bracket.rate;
        remainingIncome -= taxableAmountInBracket;
        if (remainingIncome <= 0) break;
    }

    return tax;
}

function calculateAlgemeneHeffingskorting(taxableIncome, age) {
    const isAOWAge = age >= 67;
    const baseAmount = isAOWAge ? 1498 : 3070;
    const reductionRate = isAOWAge ? 0.0292 : 0.06;
    const reductionThreshold = 22660;
    const maxReduction = isAOWAge ? 1498 : 3070;

    if (taxableIncome <= reductionThreshold) {
        return baseAmount;
    } else {
        const reduction = Math.min((taxableIncome - reductionThreshold) * reductionRate, maxReduction);
        return Math.max(baseAmount - reduction, 0);
    }
}

function calculateArbeidskorting(taxableIncome, age) {
    const isAOWAge = age >= 67;
    const baseAmount = isAOWAge ? 0 : 884;
    const maxAmount = isAOWAge ? 2726 : 5052;
    const buildupRate = isAOWAge ? 0.0835 : 0.2954;
    const reductionRate = isAOWAge ? 0.0211 : 0.0605;
    const buildupThreshold = 10741;
    const reductionThreshold = 23201;

    let arbeidskorting = baseAmount;

    if (taxableIncome > buildupThreshold) {
        arbeidskorting += Math.min((taxableIncome - buildupThreshold) * buildupRate, maxAmount - baseAmount);
    }

    if (taxableIncome > reductionThreshold) {
        const reduction = (taxableIncome - reductionThreshold) * reductionRate;
        arbeidskorting = Math.max(arbeidskorting - reduction, 0);
    }

    return arbeidskorting;
}

function calculateOuderenkorting(taxableIncome) {
    const maxOuderenkorting = 1835;
    const reductionRate = 0.15;
    const incomeThreshold = 40888;

    if (taxableIncome <= incomeThreshold) {
        return maxOuderenkorting;
    } else {
        const reduction = (taxableIncome - incomeThreshold) * reductionRate;
        return Math.max(maxOuderenkorting - reduction, 0);
    }
}

function calculateNetSalaryShared(monthlySalary, monthlyPensionContribution, age) {
    const annualSalary = monthlySalary * 12;
    const annualPensionContribution = monthlyPensionContribution * 12;

    const vacationMoney = annualSalary * 0.08;
    const thirteenthMonth = annualSalary / 12;

    const totalGrossAnnualIncome = annualSalary + vacationMoney + thirteenthMonth;
    const taxableIncome = totalGrossAnnualIncome - annualPensionContribution;

    const taxAmount = calculateTax(taxableIncome, age);

    const algemeneHeffingskorting = calculateAlgemeneHeffingskorting(taxableIncome, age);
    const arbeidskorting = calculateArbeidskorting(taxableIncome, age);
    const ouderenkorting = age >= 67 ? calculateOuderenkorting(taxableIncome) : 0;
    const heffingskortingen = (algemeneHeffingskorting + arbeidskorting + ouderenkorting);

    const effectiveTaxAmount = Math.max(0, taxAmount - heffingskortingen);

    const netAnnualSalary = taxableIncome - effectiveTaxAmount;
    const netMonthlySalary = netAnnualSalary / 12;

    return {
        monthlyNetSalary: netMonthlySalary,
        annualNetSalary: netAnnualSalary,
        grossMonthlySalary: monthlySalary,
        grossAnnualSalary: totalGrossAnnualIncome,
        taxableIncome: taxableIncome,
        taxAmount: taxAmount,
        effectiveTaxAmount: effectiveTaxAmount,
        vacationMoney: vacationMoney,
        thirteenthMonth: thirteenthMonth,
        algemeneHeffingskorting: algemeneHeffingskorting,
        arbeidskorting: arbeidskorting,
        ouderenkorting: ouderenkorting,
        annualPensionContribution: annualPensionContribution
    };
}
