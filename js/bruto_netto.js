document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    if (document.getElementById('salary')) {
        // We're on the bruto_netto page
        initializeChart();
        updateSalaryInputLabel();
        calculate();
        attachEventListeners();
    }
});

let salaryFrequency = 'monthly';
let calculationType = 'brutoToNetto';

function attachEventListeners() {
    console.log('Attaching event listeners');
    const salaryInput = document.getElementById('salary');
    const vacationMoneyInput = document.getElementById('vacationMoney');
    const thirteenthMonthInput = document.getElementById('thirteenthMonth');
    const ageInput = document.getElementById('age');

    if (salaryInput) salaryInput.addEventListener('input', calculate);
    if (vacationMoneyInput) vacationMoneyInput.addEventListener('change', calculate);
    if (thirteenthMonthInput) thirteenthMonthInput.addEventListener('change', calculate);
    if (ageInput) ageInput.addEventListener('input', calculate);
}

function toggleFrequency(button, type) {
    if (type === 'contribution') {
        document.getElementById('annualContributionToggle').classList.remove('active');
        document.getElementById('monthlyContributionToggle').classList.remove('active');
        button.classList.add('active');
        updateContributionInput();
    } else if (type === 'salary') {
        document.getElementById('monthlyToggle').classList.remove('active');
        document.getElementById('annualToggle').classList.remove('active');
        button.classList.add('active');
    }
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
    const salaryLabel = document.getElementById('salaryLabel');
    const vacationMoneyContainer = document.getElementById('vacationMoney').closest('.input-group');
    const thirteenthMonthContainer = document.getElementById('thirteenthMonth').closest('.input-group');

    // Add animation classes
    nettoHeader.classList.add('swap-out-left');
    brutoHeader.classList.add('swap-out-right');

    // Wait for the animation to complete
    setTimeout(() => {
        // Swap the text content
        const temp = nettoHeader.textContent;
        nettoHeader.textContent = brutoHeader.textContent;
        brutoHeader.textContent = temp;

        // Update calculation type based on current header text
        calculationType = (nettoHeader.textContent.trim() === 'Netto') ? 'brutoToNetto' : 'nettoToBruto';

        // Update the salary input label based on the new header text
        if (calculationType === 'brutoToNetto') {
            salaryLabel.innerHTML = 'Bruto Maandsalaris: <span class="tooltip" title="Voer hier je bruto maandsalaris in.">ℹ️</span>';
            vacationMoneyContainer.style.display = 'flex';
            thirteenthMonthContainer.style.display = 'flex';
        } else {
            salaryLabel.innerHTML = 'Netto Maandsalaris: <span class="tooltip" title="Voer hier je netto maandsalaris in.">ℹ️</span>';
            vacationMoneyContainer.style.display = 'none';
            thirteenthMonthContainer.style.display = 'none';
        }

        // Delay the calculation to ensure all DOM updates have completed
        setTimeout(() => {
            calculate(); // Recalculate based on new type
        }, 1); // Adjust delay as necessary

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

function calculateNetSalary(monthlySalary, monthlyPensionContribution, age) {
    // Adjust this function to work with monthly values
    const annualSalary = monthlySalary * 12;
    const annualPensionContribution = monthlyPensionContribution * 12;

    const vacationMoneyCheckbox = document.getElementById('vacationMoney');
    const thirteenthMonthCheckbox = document.getElementById('thirteenthMonth');
    
    const vacationMoneyEnabled = vacationMoneyCheckbox ? vacationMoneyCheckbox.checked : false;
    const thirteenthMonthEnabled = thirteenthMonthCheckbox ? thirteenthMonthCheckbox.checked : false;

    const vacationMoney = vacationMoneyEnabled ? annualSalary * 0.08 : 0;
    const thirteenthMonth = thirteenthMonthEnabled ? annualSalary / 12 : 0;

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

function calculateTax(grossAnnualSalary, age) {
    let taxAmount = 0;

    if (age >= 67) {
        // Belastingschijven voor AOW-gerechtigden
        if (grossAnnualSalary <= 38098) {
            taxAmount = grossAnnualSalary * 0.1907;
        } else if (grossAnnualSalary <= 75518) {
            taxAmount = 38098 * 0.1907 + (grossAnnualSalary - 38098) * 0.3697;
        } else {
            taxAmount = 38098 * 0.1907 + (75518 - 38098) * 0.3697 + (grossAnnualSalary - 75518) * 0.4950;
        }
    } else {
        // Belastingschijven voor niet-AOW-gerechtigden
        if (grossAnnualSalary <= 75518) {
            taxAmount = grossAnnualSalary * 0.3697;
        } else {
            taxAmount = 75518 * 0.3697 + (grossAnnualSalary - 75518) * 0.4950;
        }
    }

    return taxAmount;
}

function calculateAlgemeneHeffingskorting(totalGrossAnnualIncome, age) {
    if (age >= 67) {
        // Berekening voor AOW-gerechtigden
        if (totalGrossAnnualIncome <= 24813) {
            return 1735;
        } else if (totalGrossAnnualIncome <= 75518) {
            return Math.max(0, 1735 - 0.03421 * (totalGrossAnnualIncome - 24812));
        } else {
            return 0;
        }
    } else {
        // Bestaande berekening voor niet-AOW-gerechtigden
        const maxKorting = 3362;
        const startAfbouw = 24814;
        const afbouwPercentage = 0.0663;

        if (totalGrossAnnualIncome <= startAfbouw) {
            return maxKorting;
        } else {
            const korting = maxKorting - ((totalGrossAnnualIncome - startAfbouw) * afbouwPercentage);
            return Math.max(0, korting);
        }
    }
}

function calculateArbeidskorting(totalGrossAnnualIncome, age) {
    if (age >= 67) {
        // Berekening voor AOW-gerechtigden
        if (totalGrossAnnualIncome < 11491) {
            return totalGrossAnnualIncome * 0.04346;
        } else if (totalGrossAnnualIncome < 24821) {
            return 501 + (totalGrossAnnualIncome - 11490) * 0.16214;
        } else if (totalGrossAnnualIncome < 39958) {
            return 2662 + (totalGrossAnnualIncome - 24820) * 0.01275;
        } else if (totalGrossAnnualIncome < 124935) {
            return Math.max(0, 2854 - (totalGrossAnnualIncome - 39957) * 0.03358);
        } else {
            return 0;
        }
    } else {
        // Bestaande berekening voor niet-AOW-gerechtigden
        if (totalGrossAnnualIncome < 11491) {
            return totalGrossAnnualIncome * 0.08425;
        } else if (totalGrossAnnualIncome < 24821) {
            return 968 + (totalGrossAnnualIncome - 11490) * 0.31433;
        } else if (totalGrossAnnualIncome < 39958) {
            return 5158 + (totalGrossAnnualIncome - 24820) * 0.02471;
        } else if (totalGrossAnnualIncome < 124935) {
            return Math.max(0, 5532 - (totalGrossAnnualIncome - 39957) * 0.06510);
        } else {
            return 0;
        }
    }
}

function calculateOuderenkorting(totalGrossAnnualIncome) {
    const maxOuderenkorting = 1835; // 2023 value
    const reductionThreshold = 38520;
    const reductionRate = 0.15;

    if (totalGrossAnnualIncome <= reductionThreshold) {
        return maxOuderenkorting;
    } else {
        const reduction = Math.min((totalGrossAnnualIncome - reductionThreshold) * reductionRate, maxOuderenkorting);
        return Math.max(maxOuderenkorting - reduction, 0);
    }
}

function displayResults(salaries, displayFrequency) {
    const table = document.getElementById('resultsTable');
    table.innerHTML = ''; // Clear existing content

    const isAOWAge = parseInt(document.getElementById('age').value) >= 67;

    const factor = displayFrequency === 'monthly' ? 1 : 12;

    const rows = [
        { label: 'Bruto salaris', value: salaries.grossAnnualSalary / 12 * factor },
        { label: 'Pensioenbijdrage', value: -salaries.annualPensionContribution / 12 * factor, isNegative: true },
        { label: 'Belastbaar inkomen', value: salaries.taxableIncome / 12 * factor },
        { label: 'Loonheffing', value: -salaries.taxAmount / 12 * factor, isNegative: true },
        { label: 'Totaal heffingskortingen:', value: 0, isSubheader: true },
        { label: '- Algemene heffingskorting', value: salaries.algemeneHeffingskorting / 12 * factor, indent: true },
        { label: '- Arbeidskorting', value: salaries.arbeidskorting / 12 * factor, indent: true }
    ];

    if (isAOWAge) {
        rows.push({ label: '- Ouderenkorting', value: salaries.ouderenkorting / 12 * factor, indent: true });
    }

    const totalHeffingskortingen = (salaries.algemeneHeffingskorting + salaries.arbeidskorting + salaries.ouderenkorting) / 12 * factor;
    rows.push({ label: 'Totaal heffingskortingen', value: totalHeffingskortingen, isSubtotal: true });

    rows.push({ label: 'Effectieve loonheffing', value: -salaries.effectiveTaxAmount / 12 * factor, isNegative: true });
    rows.push({ label: 'Netto besteedbaar inkomen', value: salaries.annualNetSalary / 12 * factor, isTotal: true });

    rows.forEach(row => {
        const tr = document.createElement('tr');
        const labelCell = document.createElement('td');
        const valueCell = document.createElement('td');

        labelCell.textContent = row.label;
        valueCell.textContent = row.value ? formatCurrency(row.value) : '';

        if (row.isSubheader) {
            tr.classList.add('subheader-row');
            valueCell.textContent = '';
        }
        if (row.isSubtotal) tr.classList.add('subtotal-row');
        if (row.isTotal) tr.classList.add('total-row');
        if (row.indent) labelCell.style.paddingLeft = '20px';
        if (row.isNegative) valueCell.classList.add('negative-value');

        tr.appendChild(labelCell);
        tr.appendChild(valueCell);
        table.appendChild(tr);
    });

    updateChart(salaries, displayFrequency);
    updateSummary(); // Call this after updating the chart
}

function formatCurrency(value) {
    return '€' + value.toFixed(2);
}

function updateChart(salaries, displayFrequency) {
    const factor = displayFrequency === 'monthly' ? 1 : 12;
    const netIncome = salaries.annualNetSalary / 12 * factor;
    const effectiveTaxAmount = salaries.effectiveTaxAmount / 12 * factor;

    if (!taxPieChartInstance) {
        initializeChart();
    }

    // Update existing chart data
    taxPieChartInstance.data.datasets[0].data = [netIncome, effectiveTaxAmount];
    taxPieChartInstance.update();
}

let grossIncome, netIncome, inkomstenbelasting, arbeidskorting, algemeneHeffingskorting, isMonthly;

function updateResultsSummary() {
    console.log(`Updating summary: Monthly=${isMonthly}, Gross Income=${grossIncome}, Net Income=${netIncome}`);
    document.getElementById('results-summary').innerHTML = `
        <div class="summary-header">
            <h3>Samenvatting</h3>
        </div>
        <div class="summary-body">
            <p><strong>${isMonthly ? 'Maandelijks' : 'Jaarlijks'} Bruto Inkomen:</strong> €${grossIncome.toFixed(2)}</p>
            <p><strong>${isMonthly ? 'Maandelijks' : 'Jaarlijks'} Netto Inkomen:</strong> €${netIncome.toFixed(2)}</p>
            <p><strong>Inkomstenbelasting:</strong> €${inkomstenbelasting.toFixed(2)}</p>
            <p><strong>Arbeidskorting:</strong> €${arbeidskorting.toFixed(2)}</p>
            <p><strong>Algemene Heffingskorting:</strong> €${algemeneHeffingskorting.toFixed(2)}</p>
        </div>
    `;
}

function calculate() {
    const monthlySalary = parseFloat(document.getElementById('salary').value);
    const displayFrequency = document.querySelector('.toggle-buttons .active').id === 'monthlyToggle' ? 'monthly' : 'annual';
    const age = parseInt(document.getElementById('age').value);
    const monthlyPensionContribution = parseFloat(document.getElementById('pensionContribution').value) || 0;

    let salaries;
    if (calculationType === 'brutoToNetto') {
        salaries = calculateNetSalary(monthlySalary, monthlyPensionContribution, age);
    } else {
        const bruttoMonthlySalary = calculateBrutoFromNetto(monthlySalary);
        salaries = calculateNetSalary(bruttoMonthlySalary, monthlyPensionContribution, age);
    }

    displayResults(salaries, displayFrequency);
    updateSummary();
}

function toggleFrequency(button, type) {
    if (type === 'contribution') {
        document.getElementById('annualContributionToggle').classList.remove('active');
        document.getElementById('monthlyContributionToggle').classList.remove('active');
        button.classList.add('active');
        updateContributionInput();
    } else if (type === 'salary') {
        document.getElementById('monthlyToggle').classList.remove('active');
        document.getElementById('annualToggle').classList.remove('active');
        button.classList.add('active');
    }
    calculate();
}

function updateContributionInput() {
    const input = document.getElementById('pensionContribution');
    const isMonthly = document.getElementById('monthlyContributionToggle').classList.contains('active');
    const currentValue = parseFloat(input.value);

    if (isMonthly) {
        input.value = (currentValue / 12).toFixed(2);
        input.step = "10";
    } else {
        input.value = (currentValue * 12).toFixed(2);
        input.step = "100";
    }
}

let taxPieChartInstance; // Global variable to store the chart instance

function initializeChart() {
    const ctx = document.getElementById('taxPieChart');
    if (!ctx) {
        console.error('Canvas element not found');
        return;
    }

    taxPieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Netto Inkomen', 'Belasting'],
            datasets: [{
                data: [], // Initialize with empty data
                backgroundColor: ['#36A2EB', '#FF6384'],
                hoverBackgroundColor: ['#36A2EB', '#FF6384']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(tooltipItem) {
                            let label = tooltipItem.label;
                            let value = tooltipItem.parsed;
                            let total = tooltipItem.dataset.data.reduce((a, b) => a + b, 0);
                            let percentage = ((value / total) * 100).toFixed(2);
                            return `${label}: €${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function calculateBrutoFromNetto(netSalary) {
    // Convert annual salary to monthly if necessary
    const netMonthlySalary = netSalary;

    // Begin met een schatting van het bruto salaris
    let estimatedGrossMonthly = netMonthlySalary * 1.3; // Verhoog met 30% als startpunt

    let calculatedNetSalary = 0;
    let iterationCount = 0;
    const maxIterations = 20; // Verhoog het aantal iteraties voor meer nauwkeurigheid
    const tolerance = 0.1; // Verlaag de tolerantie voor meer nauwkeurigheid

    // Gebruik een iteratieve benadering om het bruto salaris te vinden
    while (Math.abs(calculatedNetSalary - netMonthlySalary) > tolerance && iterationCount < maxIterations) {
        const salaries = calculateNetSalary(estimatedGrossMonthly, 0, parseInt(document.getElementById('age').value));
        calculatedNetSalary = salaries.monthlyNetSalary;

        // Pas de schatting aan op basis van het verschil
        estimatedGrossMonthly += (netMonthlySalary - calculatedNetSalary) * 1.1;

        iterationCount++;
    }

    return estimatedGrossMonthly;
}

function updateSummary() {
    if (!taxPieChartInstance) return;

    const data = taxPieChartInstance.data.datasets[0].data;
    if (data.length < 2) return; // Ensure there's enough data

    const netIncome = data[0]; // Net income is the first slice of the pie
    const taxes = data[1]; // Taxes (effective loonheffing) is the second slice
    const grossIncome = netIncome + taxes; // Gross income is the sum of net income and taxes

    // Calculate tax burden as a percentage of gross income
    const taxBurden = (taxes / grossIncome) * 100;

    const incomeType = (calculationType === 'brutoToNetto') ? 'Bruto' : 'Netto';
    const incomeValue = (calculationType === 'brutoToNetto') ? grossIncome : netIncome;
    const incomeSummaryElement = document.getElementById('incomeSummary');
    const taxSummaryElement = document.getElementById('taxSummary');

    incomeSummaryElement.innerHTML = `
    <div class="summary-item"><strong>Bruto inkomen:</strong> €${grossIncome.toFixed(2)}</div>
    <div class="summary-item"><strong>Netto besteedbaar inkomen:</strong> €${netIncome.toFixed(2)}</div>
    <div class="summary-item"><strong>Belasting:</strong> €${taxes.toFixed(2)}</div>
    <div class="summary-item"><strong>Belastingdruk:</strong> ${taxBurden.toFixed(2)}% van uw inkomen</div>
    `;

    // Apply consistent styling
    incomeSummaryElement.style.fontSize = '18px';
    taxSummaryElement.style.fontSize = '18px';
    incomeSummaryElement.style.fontWeight = '600';
    taxSummaryElement.style.fontWeight = '600';
}

function updateSalaryInputLabel() {
    const salaryLabel = document.querySelector('label[for="salary"]');
    if (!salaryLabel) {
        console.error('Salary label not found');
        return;
    }

    if (calculationType === 'brutoToNetto') {
        salaryLabel.innerHTML = 'Bruto Maandsalaris: <span class="tooltip" title="Voer hier je bruto maandsalaris in.">ℹ️</span>';
    } else {
        salaryLabel.innerHTML = 'Netto Maandsalaris: <span class="tooltip" title="Voer hier je netto maandsalaris in.">ℹ️</span>';
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    updateSalaryInputLabel(); // Update bij het laden van de pagina
    calculate(); // Voer een initiële berekening uit
});

function calculateBrutoNetto() {
    const salary = parseFloat(document.getElementById('salary').value);
    const frequency = document.querySelector('.toggle-buttons .active').id === 'monthlyToggle' ? 'monthly' : 'annual';
    
    let salaries;
    if (calculationType === 'brutoToNetto') {
        salaries = calculateNetSalary(salary);
    } else {
        const brutoSalary = calculateBrutoFromNetto(salary);
        salaries = calculateNetSalary(brutoSalary);
    }

    displayResults(salaries, frequency);
}
window.calculateBrutoNetto = calculateBrutoNetto;
