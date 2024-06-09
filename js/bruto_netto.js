document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    calculate();
    attachEventListeners();
});

let salaryFrequency = 'monthly';
let calculationType = 'brutoToNetto';

function attachEventListeners() {
    console.log('Attaching event listeners');
    document.getElementById('salary').addEventListener('input', calculate);
    document.getElementById('vacationMoney').addEventListener('change', calculate);
    document.getElementById('thirteenthMonth').addEventListener('change', calculate);
    document.getElementById('age').addEventListener('input', calculate);
}

function toggleFrequency(button, type) {
    salaryFrequency = type;
    document.getElementById('monthlyToggle').classList.remove('active');
    document.getElementById('annualToggle').classList.remove('active');
    button.classList.add('active');
    calculate();
}

function toggleCalculation(button, type) {
    calculationType = type;
    document.getElementById('brutoToNetto').classList.remove('active');
    document.getElementById('nettoToBruto').classList.remove('active');
    button.classList.add('active');
    calculate();
}

function swapCalculation() {
    const nettoHeader = document.getElementById('nettoHeader');
    const brutoHeader = document.getElementById('brutoHeader');

    // Add animation classes
    nettoHeader.classList.add('swap-out-left');
    brutoHeader.classList.add('swap-out-right');

    // Wait for the animation to complete
    setTimeout(() => {
        // Swap the text content
        const temp = nettoHeader.textContent;
        nettoHeader.textContent = brutoHeader.textContent;
        brutoHeader.textContent = temp;

        // Remove animation classes and add swap-in classes
        nettoHeader.classList.remove('swap-out-left');
        brutoHeader.classList.remove('swap-out-right');
        nettoHeader.classList.add('swap-in-right');
        brutoHeader.classList.add('swap-in-left');

        // Remove swap-in classes after animation
        setTimeout(() => {
            nettoHeader.classList.remove('swap-in-right');
            brutoHeader.classList.remove('swap-in-left');
        }, 500); // Match the duration of the CSS transition
    }, 500); // Match the duration of the CSS transition
}

function calculateNetSalary(grossMonthlySalary, applyTaxCredit = true) {
    const grossAnnualSalary = grossMonthlySalary * 12;
    const vacationMoneyEnabled = document.getElementById('vacationMoney').checked;
    const thirteenthMonthEnabled = document.getElementById('thirteenthMonth').checked;

    const vacationMoney = vacationMoneyEnabled ? grossAnnualSalary * 0.08 : 0;
    const thirteenthMonth = thirteenthMonthEnabled ? grossMonthlySalary : 0;
    const totalGrossAnnualIncome = grossAnnualSalary + vacationMoney + thirteenthMonth;

    const taxAmount = calculateTax(totalGrossAnnualIncome);

    const algemeneHeffingskorting = calculateAlgemeneHeffingskorting(totalGrossAnnualIncome);
    const arbeidskorting = calculateArbeidskorting(totalGrossAnnualIncome);
    const heffingskortingen = applyTaxCredit ? (algemeneHeffingskorting + arbeidskorting) : 0;

    const netAnnualSalary = totalGrossAnnualIncome - taxAmount + heffingskortingen;
    const netMonthlySalary = netAnnualSalary / 12;

    return {
        monthlyNetSalary: netMonthlySalary,
        annualNetSalary: netAnnualSalary,
        grossMonthlySalary: grossMonthlySalary,
        grossAnnualSalary: totalGrossAnnualIncome,
        taxAmount: taxAmount,
        vacationMoney: vacationMoney,
        thirteenthMonth: thirteenthMonth
    };
}

function calculateTax(grossAnnualSalary) {
    const taxRate1 = 0.3697; // Tarief voor schijf 1
    const taxRate2 = 0.4950; // Tarief voor schijf 2
    const threshold = 73031; // Drempel voor schijf 2

    let taxAmount;

    if (grossAnnualSalary <= threshold) {
        taxAmount = grossAnnualSalary * taxRate1;
    } else {
        taxAmount = (threshold * taxRate1) + ((grossAnnualSalary - threshold) * taxRate2);
    }

    return taxAmount;
}

function calculateAlgemeneHeffingskorting(totalGrossAnnualIncome) {
    if (totalGrossAnnualIncome <= 21317) {
        return 3070;
    } else if (totalGrossAnnualIncome <= 73031) {
        return 3070 - ((totalGrossAnnualIncome - 21317) * 0.06095);
    } else {
        return 0;
    }
}

function calculateArbeidskorting(totalGrossAnnualIncome, aowLeeftijd = false) {
    if (aowLeeftijd) {
        // Berekeningen voor mensen die in 2024 de AOW-leeftijd bereiken
        if (totalGrossAnnualIncome < 11491) {
            return totalGrossAnnualIncome * 0.04346;
        } else if (totalGrossAnnualIncome < 24821) {
            return 501 + (totalGrossAnnualIncome - 11490) * 0.16214;
        } else if (totalGrossAnnualIncome < 39958) {
            return 2662 + (totalGrossAnnualIncome - 24820) * 0.01275;
        } else if (totalGrossAnnualIncome < 124935) {
            return 2854 - (totalGrossAnnualIncome - 39957) * 0.03358;
        } else {
            return 0;
        }
    } else {
        // Berekeningen voor mensen die in 2024 nog niet de AOW-leeftijd bereiken
        if (totalGrossAnnualIncome < 11491) {
            return totalGrossAnnualIncome * 0.08425;
        } else if (totalGrossAnnualIncome < 24821) {
            return 968 + (totalGrossAnnualIncome - 11490) * 0.31433;
        } else if (totalGrossAnnualIncome < 39958) {
            return 5158 + (totalGrossAnnualIncome - 24820) * 0.02471;
        } else if (totalGrossAnnualIncome < 124935) {
            return 5532 - (totalGrossAnnualIncome - 39957) * 0.06510;
        } else {
            return 0;
        }
    }
}

function displayResults(salaries, frequency) {
    console.log('Displaying results');
    const isMonthly = frequency === 'monthly';
    const grossIncome = isMonthly ? salaries.grossMonthlySalary : salaries.grossAnnualSalary;
    const netIncome = isMonthly ? salaries.monthlyNetSalary : salaries.annualNetSalary;
    const taxAmount = isMonthly ? salaries.taxAmount / 12 : salaries.taxAmount;
    const arbeidskorting = isMonthly ? calculateArbeidskorting(salaries.grossAnnualSalary) / 12 : calculateArbeidskorting(salaries.grossAnnualSalary);
    const algemeneHeffingskorting = isMonthly ? calculateAlgemeneHeffingskorting(salaries.grossAnnualSalary) / 12 : calculateAlgemeneHeffingskorting(salaries.grossAnnualSalary);
    const inkomstenbelasting = taxAmount - arbeidskorting - algemeneHeffingskorting;

    const resultsTable = `
        <table class="results-table">
            <tr>
                <td>Looninkomsten</td>
                <td>€${grossIncome.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Bruto Loon</td>
                <td>€${grossIncome.toFixed(2)}</td>
                <td>€${grossIncome.toFixed(2)}</td>
            </tr>
            <tr><td colspan="3" class="sum-line">&nbsp;</td></tr>
            <tr>
                <td>Belasting box 1</td>
                <td>€${taxAmount.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Arbeidskorting</td>
                <td>€${arbeidskorting.toFixed(2)} –</td>
            </tr>
            <tr>
                <td>Algemene heffingskorting</td>
                <td>€${algemeneHeffingskorting.toFixed(2)} –</td>
            </tr>

            <tr>
                <td>Inkomstenbelasting</td>
                <td></td>
                <td>€${(inkomstenbelasting).toFixed(2)}-</td>
            </tr>
            <tr><td colspan="3" class="sum-line">&nbsp;</td></tr>
            <tr>
                <td>Netto Loon</td>
                <td></td>
                <td>€${netIncome.toFixed(2)}</td>
            </tr>
        </table>
    `;

    document.getElementById('resultsTable').innerHTML = resultsTable;
}

function calculate() {
    console.log('Calculating salaries');
    const grossMonthlySalary = parseFloat(document.getElementById('salary').value) || 0;
    const frequency = document.querySelector('.toggle-buttons .active').id === 'monthlyToggle' ? 'monthly' : 'annual';
    const salaries = calculateNetSalary(grossMonthlySalary);
    displayResults(salaries, frequency);
}

function toggleFrequency(button, type) {
    document.querySelectorAll('.toggle-buttons button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    calculate();
}


