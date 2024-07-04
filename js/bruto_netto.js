document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    initializeChart(); // Move this line here
    updateSalaryInputLabel();
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



function calculateNetSalary(grossMonthlySalary, applyTaxCredit = true) {
    const grossAnnualSalary = grossMonthlySalary * 12;
    const vacationMoneyCheckbox = document.getElementById('vacationMoney');
    const thirteenthMonthCheckbox = document.getElementById('thirteenthMonth');
    const ageInput = document.getElementById('age');
    
    const vacationMoneyEnabled = vacationMoneyCheckbox ? vacationMoneyCheckbox.checked : false;
    const thirteenthMonthEnabled = thirteenthMonthCheckbox ? thirteenthMonthCheckbox.checked : false;
    const age = ageInput ? parseInt(ageInput.value) || 0 : 0;
    const isAOWAge = age >= 67;

    // Calculate vacation money and thirteenth month correctly
    const vacationMoney = vacationMoneyEnabled ? grossAnnualSalary * 0.08 : 0;
    const thirteenthMonth = thirteenthMonthEnabled ? grossMonthlySalary : 0;

    // Correctly calculate the total gross annual income
    const totalGrossAnnualIncome = grossAnnualSalary + vacationMoney + thirteenthMonth;

    // Calculate tax based on the total gross annual income
    const taxAmount = calculateTax(totalGrossAnnualIncome, isAOWAge);

    // Calculate tax credits
    const algemeneHeffingskorting = calculateAlgemeneHeffingskorting(totalGrossAnnualIncome, isAOWAge);
    const arbeidskorting = calculateArbeidskorting(totalGrossAnnualIncome, isAOWAge);
    const ouderenkorting = isAOWAge ? calculateOuderenkorting(totalGrossAnnualIncome) : 0;
    const heffingskortingen = applyTaxCredit ? (algemeneHeffingskorting + arbeidskorting + ouderenkorting) : 0;

    // Ensure that the applied tax credits don't exceed the tax amount
    const effectiveTaxAmount = Math.max(0, taxAmount - heffingskortingen);

    const netAnnualSalary = totalGrossAnnualIncome - effectiveTaxAmount;
    const netMonthlySalary = netAnnualSalary / 12;

    return {
        monthlyNetSalary: netMonthlySalary,
        annualNetSalary: netAnnualSalary,
        grossMonthlySalary: grossMonthlySalary,
        grossAnnualSalary: totalGrossAnnualIncome,
        taxAmount: taxAmount,
        effectiveTaxAmount: effectiveTaxAmount,
        vacationMoney: vacationMoney,
        thirteenthMonth: thirteenthMonth,
        algemeneHeffingskorting: algemeneHeffingskorting,
        arbeidskorting: arbeidskorting,
        ouderenkorting: ouderenkorting
    };
}

function calculateTax(grossAnnualSalary, isAOWAge) {
    let taxAmount = 0;

    if (isAOWAge) {
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

function calculateAlgemeneHeffingskorting(totalGrossAnnualIncome, isAOWAge) {
    if (isAOWAge) {
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

function calculateArbeidskorting(totalGrossAnnualIncome, isAOWAge) {
    if (isAOWAge) {
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
    const maxKorting = 2010;
    const inkomensgrens = 44770;

    if (totalGrossAnnualIncome <= inkomensgrens) {
        return maxKorting;
    } else {
        return 0;
    }
}

function displayResults(salaries, frequency) {
    const table = document.getElementById('resultsTable');
    table.innerHTML = ''; // Clear existing content

    const isAOWAge = parseInt(document.getElementById('age').value) >= 67;

    const factor = frequency === 'monthly' ? 12 : 1;

    const rows = [
        { label: 'Bruto salaris', value: salaries.grossAnnualSalary / factor },
        { label: 'Loonheffing', value: -salaries.taxAmount / factor, isNegative: true },
        { label: 'Totaal heffingskortingen:', value: 0, isSubheader: true },
        { label: '- Algemene heffingskorting', value: salaries.algemeneHeffingskorting / factor, indent: true },
        { label: '- Arbeidskorting', value: salaries.arbeidskorting / factor, indent: true }
    ];

    if (isAOWAge) {
        rows.push({ label: '- Ouderenkorting', value: salaries.ouderenkorting / factor, indent: true });
    }

    const totalHeffingskortingen = (salaries.algemeneHeffingskorting + salaries.arbeidskorting + salaries.ouderenkorting) / factor;
    rows.push({ label: 'Totaal heffingskortingen', value: totalHeffingskortingen, isSubtotal: true });

    rows.push({ label: 'Effectieve loonheffing', value: -salaries.effectiveTaxAmount / factor, isNegative: true });
    rows.push({ label: 'Netto salaris', value: salaries.annualNetSalary / factor, isTotal: true });

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

    updateChart(salaries, frequency);
    updateSummary(); // Call this after updating the chart
}

function formatCurrency(value) {
    return '€' + value.toFixed(2);
}

function updateChart(salaries, frequency) {
    const factor = frequency === 'monthly' ? 12 : 1;
    const grossIncome = salaries.grossAnnualSalary / factor;
    const effectiveTaxAmount = salaries.effectiveTaxAmount / factor;
    const netIncome = salaries.annualNetSalary / factor;

    const ctx = document.getElementById('taxPieChart').getContext('2d');
    
    if (taxPieChartInstance) {
        taxPieChartInstance.destroy();
    }

    taxPieChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Netto inkomen', 'Effectieve loonheffing'],
            datasets: [{
                data: [netIncome, effectiveTaxAmount],
                backgroundColor: ['#36a2eb', '#ff6384']
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
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += formatCurrency(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
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
    const salaryInput = document.getElementById('salary');
    const salaryValue = salaryInput ? parseFloat(salaryInput.value) || 0 : 0;
    const frequencyButton = document.querySelector('.toggle-buttons .active');
    const frequency = frequencyButton ? (frequencyButton.id === 'monthlyToggle' ? 'monthly' : 'annual') : 'monthly';
    const ageInput = document.getElementById('age');
    const age = ageInput ? parseInt(ageInput.value) || 0 : 0;

    let salaries;
    if (calculationType === 'brutoToNetto') {
        salaries = calculateNetSalary(salaryValue);
    } else {
        const brutoSalary = calculateBrutoFromNetto(salaryValue);
        salaries = calculateNetSalary(brutoSalary);
    }

    displayResults(salaries, frequency);
    updateSummary();
}

function toggleFrequency(button, type) {
    document.querySelectorAll('.toggle-buttons button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    calculate();
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
            labels: ['Belasting', 'Netto Inkomen'],
            datasets: [{
                data: [], // Initialize with empty data
                backgroundColor: ['#FF6384', '#36A2EB'],
                hoverBackgroundColor: ['#FF6384', '#36A2EB']
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
                            let value = tooltipItem.raw;
                            let percentage = (value / grossIncome * 100).toFixed(2);
                            return `${label}: €${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function calculateBrutoFromNetto(netMonthlySalary, applyTaxCredit = true) {
    // Begin met een schatting van het bruto salaris
    let estimatedGrossMonthly = netMonthlySalary * 1.3; // Verhoog met 30% als startpunt

    let calculatedNetSalary = 0;
    let iterationCount = 0;
    const maxIterations = 10; // Voorkom oneindige loops
    const tolerance = 1; // Acceptabele foutmarge in euro's

    // Gebruik een iteratieve benadering om het bruto salaris te vinden
    while (Math.abs(calculatedNetSalary - netMonthlySalary) > tolerance && iterationCount < maxIterations) {
        const salaries = calculateNetSalary(estimatedGrossMonthly, applyTaxCredit);
        calculatedNetSalary = salaries.monthlyNetSalary;

        // Pas de schatting aan op basis van het verschil
        if (calculatedNetSalary < netMonthlySalary) {
            estimatedGrossMonthly += (netMonthlySalary - calculatedNetSalary) * 1.1; // Verhoog bruto als netto te laag is
        } else {
            estimatedGrossMonthly -= (calculatedNetSalary - netMonthlySalary) * 1.1; // Verlaag bruto als netto te hoog is
        }

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
    <div class="summary-item"><strong>Netto inkomen:</strong> €${netIncome.toFixed(2)}</div>
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
