document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    calculate(); // This will trigger the calculation and display, including the pie chart
    attachEventListeners();

    const brutoHeader = document.getElementById('brutoHeader');
    const nettoHeader = document.getElementById('nettoHeader');

    // Stel standaard de tekst in
    brutoHeader.textContent = 'Bruto';
    nettoHeader.textContent = 'Netto';

    // Stel de standaard berekeningsmodus in
    calculationType = 'brutoToNetto';
    calculate(); // Voer een initiële berekening uit
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
    const vacationMoneyEnabled = document.getElementById('vacationMoney').checked;
    const thirteenthMonthEnabled = document.getElementById('thirteenthMonth').checked;

    // Calculate vacation money and thirteenth month correctly
    const vacationMoney = vacationMoneyEnabled ? grossAnnualSalary * 0.08 : 0; // 8% of the annual salary
    const thirteenthMonth = thirteenthMonthEnabled ? grossMonthlySalary : 0; // One extra month salary

    // Correctly calculate the total gross annual income
    const totalGrossAnnualIncome = grossAnnualSalary + vacationMoney + thirteenthMonth;

    // Calculate tax based on the total gross annual income
    const taxAmount = calculateTax(totalGrossAnnualIncome);

    // Calculate tax credits
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

function calculateAlgemeneHeffingskorting(totalGrossAnnualIncome, aowLeeftijd = false) {
    if (aowLeeftijd) {
        // Berekeningen voor mensen die in 2024 de AOW-leeftijd bereiken of hebben
        if (totalGrossAnnualIncome <= 24813) {
            return 1735;
        } else if (totalGrossAnnualIncome <= 75518) {
            return 1735 - ((totalGrossAnnualIncome - 24812) * 0.03421);
        } else {
            return 0;
        }
    } else {
        // Berekeningen voor mensen die in 2024 nog niet de AOW-leeftijd bereiken
        if (totalGrossAnnualIncome <= 24813) {
            return 3362;
        } else if (totalGrossAnnualIncome <= 75518) {
            return 3362 - ((totalGrossAnnualIncome - 24812) * 0.06630);
        } else {
            return 0;
        }
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
    grossIncome = isMonthly ? salaries.grossMonthlySalary : salaries.grossAnnualSalary;
    netIncome = isMonthly ? salaries.monthlyNetSalary : salaries.annualNetSalary;
    const taxAmount = isMonthly ? salaries.taxAmount / 12 : salaries.taxAmount;
    arbeidskorting = isMonthly ? calculateArbeidskorting(salaries.grossAnnualSalary) / 12 : calculateArbeidskorting(salaries.grossAnnualSalary);
    algemeneHeffingskorting = isMonthly ? calculateAlgemeneHeffingskorting(salaries.grossAnnualSalary) / 12 : calculateAlgemeneHeffingskorting(salaries.grossAnnualSalary);
    inkomstenbelasting = taxAmount - arbeidskorting - algemeneHeffingskorting;

    const resultsTable = `
        <table class="results-table">
            <tr>
                <td>${isMonthly ? 'Maandelijks' : 'Jaarlijks'} Bruto Loon</td>
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
                <td>${isMonthly ? 'Maandelijks' : 'Jaarlijks'} Netto Loon</td>
                <td></td>
                <td>€${netIncome.toFixed(2)}</td>
            </tr>
        </table>
    `;

    document.getElementById('resultsTable').innerHTML = resultsTable;

    // Calculate tax percentage
    const taxPercentage = (salaries.taxAmount / salaries.grossAnnualSalary) * 100;

    // Update chart data
    updateChartData([inkomstenbelasting, netIncome]);
}

function updateChartData(newData) {
    if (taxPieChartInstance) {
        taxPieChartInstance.data.datasets[0].data = newData;
        taxPieChartInstance.update();
    }
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
    const salaryInput = parseFloat(document.getElementById('salary').value) || 0;
    const frequency = document.querySelector('.toggle-buttons .active').id === 'monthlyToggle' ? 'monthly' : 'annual';

    let salaries;
    if (calculationType === 'brutoToNetto') {
        salaries = calculateNetSalary(salaryInput);
    } else {
        const brutoSalary = calculateBrutoFromNetto(salaryInput);
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
    const ctx = document.getElementById('taxPieChart').getContext('2d');
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

initializeChart(); // Initialize the chart once

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
    if (data.length < 2) return; // Zorg ervoor dat er genoeg data is

    const netIncome = data[1];
    const taxes = data[0];
    const grossIncome = netIncome + taxes; // Aanname dat bruto inkomen gelijk is aan netto plus belastingen
    const taxRate = (taxes / grossIncome) * 100;

    const incomeType = (calculationType === 'brutoToNetto') ? 'Netto' : 'Bruto';
    const incomeSummaryElement = document.getElementById('incomeSummary');
    const taxSummaryElement = document.getElementById('taxSummary');

    incomeSummaryElement.innerHTML = `
    <div class="summary-item"><strong>${incomeType} inkomen:</strong> €${netIncome.toFixed(2)}</div>
    <div class="summary-item"><strong>Belasting:</strong> €${taxes.toFixed(2)}</div>
    <div class="summary-item"><strong>Belastingdruk:</strong> ${taxRate.toFixed(2)}% van uw inkomen</div>
`;

    // Apply consistent styling
    incomeSummaryElement.style.fontSize = '18px';
    taxSummaryElement.style.fontSize = '18px';
    incomeSummaryElement.style.fontWeight = '600';
    taxSummaryElement.style.fontWeight = '600';
}

function updateSalaryInputLabel() {
    const salaryLabel = document.getElementById('salaryLabel');
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
