document.addEventListener('DOMContentLoaded', (event) => {
    berekenPensioensparen();
    updateSliders();
    setupEventListeners();
});

let chartInleg;
let chartBrutoInkomen;

function setupEventListeners() {
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            berekenPensioensparen();
            updateSliders();
        });
    });

    document.querySelectorAll('.toggle-buttons button').forEach(button => {
        button.addEventListener('click', (event) => {
            toggleFrequency(event.target, event.target.closest('.input-toggle-container').querySelector('input').id === 'annualContribution' ? 'contribution' : 'salary');
        });
    });
}

function berekenPensioensparen() {
    // Fetch values from input fields
    const initieleInleg = parseFloat(document.getElementById('startAmount').value) || 0;
    let bijdrage = parseFloat(document.getElementById('annualContribution').value) || 0;
    const jaarlijksRendement = parseFloat(document.getElementById('annualReturn').value) / 100 || 0.07;
    const rendementNaPensioen = parseFloat(document.getElementById('postRetirementReturn').value) / 100 || 0.03;
    const pensioenLeeftijd = parseFloat(document.getElementById('retirementAge').value) || 65;
    const leeftijd = parseFloat(document.getElementById('age').value) || 0;
    const levensverwachting = parseFloat(document.getElementById('lifeExpectancy').value) || 90;

    // Check the contribution frequency toggle state
    const isMonthly = document.getElementById('monthlyToggle').classList.contains('active');
    if (isMonthly) {
        bijdrage *= 12;
    }

    const jarenTotPensioen = pensioenLeeftijd - leeftijd;
    const jarenNaPensioen = levensverwachting - pensioenLeeftijd;

    // Step 1: Calculate future value with contributions
    const FV1 = initieleInleg * Math.pow(1 + jaarlijksRendement, jarenTotPensioen) + bijdrage * (Math.pow(1 + jaarlijksRendement, jarenTotPensioen) - 1) / jaarlijksRendement;

    // Function to simulate withdrawals
    function simulateWithdrawals(FV1, withdrawal, interestRate, years) {
        let balance = FV1;
        for (let year = 0; year < years; year++) {
            balance -= withdrawal;  // Withdraw at the start of the year
            balance *= (1 + interestRate);  // Apply interest
        }
        return balance;
    }

    // Iteratively find the withdrawal amount
    let targetBalance = 0.5;
    let low = 0;
    let high = 100000000;
    let withdrawalEstimate = (high + low) / 2;

    while (high - low > (rendementNaPensioen > 0.05 ? 0.01 : 1)) {  // Adjust precision based on interest rate
        let currentBalance = simulateWithdrawals(FV1, withdrawalEstimate, rendementNaPensioen, jarenNaPensioen);
        
        if (currentBalance > targetBalance) {
            low = withdrawalEstimate;
        } else {
            high = withdrawalEstimate;
        }
        withdrawalEstimate = (high + low) / 2;
    }

    // Update the display for estimated monthly withdrawal
    let monthlyWithdrawal = withdrawalEstimate / 12;  // Convert to monthly withdrawal
    document.getElementById('estimatedWithdrawalDisplay').textContent = `€${monthlyWithdrawal.toFixed(2)} per maand`;

    // Calculate savings and income data for charts and table
    let spaargeldTotPensioen = initieleInleg;
    let spaargeldData = [];
    let brutoInkomenData = [];
    let nettoInkomenData = [];
    let totalYears = jarenTotPensioen + jarenNaPensioen; // Total years for calculation

    // Generate data for the calculated period
    for (let i = 0; i < totalYears; i++) {
        if (i < jarenTotPensioen) {
            spaargeldTotPensioen += bijdrage;
            spaargeldTotPensioen *= (1 + jaarlijksRendement);
        } else {
            spaargeldTotPensioen -= withdrawalEstimate;
            spaargeldTotPensioen *= (1 + rendementNaPensioen);
        }
        spaargeldData.push(spaargeldTotPensioen.toFixed(0));
        brutoInkomenData.push(i < jarenTotPensioen ? (bijdrage * 12).toFixed(0) : withdrawalEstimate.toFixed(0));
        nettoInkomenData.push(calculateNetSalary(i < jarenTotPensioen ? bijdrage * 12 : withdrawalEstimate).monthlyNetSalary.toFixed(0));
    }

    // Extend chart data by 5 years beyond life expectancy
    for (let i = 0; i < 5; i++) {
        spaargeldTotPensioen -= withdrawalEstimate;
        spaargeldTotPensioen *= (1 + rendementNaPensioen);
        spaargeldData.push(spaargeldTotPensioen.toFixed(0));
        brutoInkomenData.push(withdrawalEstimate.toFixed(0));
        nettoInkomenData.push(calculateNetSalary(withdrawalEstimate).monthlyNetSalary.toFixed(0));
    }

    const labels = Array.from({ length: totalYears + 5 }, (_, i) => leeftijd + i);

    // Adjust spaargeldData to replace negative values with 0
    spaargeldData = spaargeldData.map(value => Math.max(0, value));

    if (chartInleg) {
        chartInleg.data.labels = labels;
        chartInleg.data.datasets[0].data = spaargeldData;
        chartInleg.update();
    } else {
        const ctxInleg = document.getElementById('pensionChartInleg').getContext('2d');
        chartInleg = new Chart(ctxInleg, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Gespaard Pensioen',
                        data: spaargeldData,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
                        fill: true,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 0,
                        pointHoverRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        ticks: {
                            callback: function(value) {
                                return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                            },
                            beginAtZero: true // Ensures the y-axis starts at zero
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: €${context.raw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
                        }
                    }
                }
            }
        });
    }

    if (chartBrutoInkomen) {
        chartBrutoInkomen.data.labels = labels;
        chartBrutoInkomen.data.datasets[0].data = brutoInkomenData;
        chartBrutoInkomen.data.datasets[1].data = nettoInkomenData;
        chartBrutoInkomen.update();
    } else {
        const ctxBrutoInkomen = document.getElementById('pensionChartBrutoInkomen').getContext('2d');
        chartBrutoInkomen = new Chart(ctxBrutoInkomen, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Bruto Inkomen',
                        data: brutoInkomenData,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
                        fill: true,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 0,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'Netto Inkomen',
                        data: nettoInkomenData,
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
                        fill: true,
                        tension: 0.4,
                        spanGaps: true,
                        pointRadius: 0,
                        pointHoverRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        ticks: {
                            callback: function(value) {
                                return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                            },
                            beginAtZero: true // Ensures the y-axis starts at zero
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: €${context.raw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
                        }
                    }
                }
            }
        });
    }

    // Update the table
    const dataTableBody = document.getElementById('pensionDataTable').querySelector('tbody');
    dataTableBody.innerHTML = '';
    spaargeldData.forEach((data, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${leeftijd + index}</td><td>€${data}</td><td>€${index < jarenTotPensioen ? (bijdrage * jaarlijksRendement).toFixed(0) : (withdrawalEstimate * rendementNaPensioen).toFixed(0)}</td>`;
        dataTableBody.appendChild(row);
    });
}

function updateSliders() {
    document.getElementById('annualReturnDisplay').textContent = `${parseFloat(document.getElementById('annualReturn').value).toFixed(0)}%`;
    document.getElementById('postRetirementReturnDisplay').textContent = `${parseFloat(document.getElementById('postRetirementReturn').value).toFixed(0)}%`;
    document.getElementById('retirementAgeDisplay').textContent = parseFloat(document.getElementById('retirementAge').value).toFixed(0);
    document.getElementById('ageDisplay').textContent = parseFloat(document.getElementById('age').value).toFixed(0);
    document.getElementById('lifeExpectancyDisplay').textContent = parseFloat(document.getElementById('lifeExpectancy').value).toFixed(0);
}

function calculateNetSalary(grossMonthlySalary, applyTaxCredit = true) {
    const grossAnnualSalary = grossMonthlySalary * 12;

    // Exclude vacation money and thirteenth month
    const vacationMoney = 0;
    const thirteenthMonth = 0;

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

function calculateArbeidskorting(totalGrossAnnualIncome) {
    // Placeholder function for calculating arbeidskorting
    // Implement the actual calculation based on your requirements
    return 0;
}

function toggleFrequency(button, type) {
    if (type === 'contribution') {
        document.getElementById('annualToggle').classList.remove('active');
        document.getElementById('monthlyToggle').classList.remove('active');
        button.classList.add('active');
    } else if (type === 'income') {
        document.getElementById('annualIncomeToggle').classList.remove('active');
        document.getElementById('monthlyIncomeToggle').classList.remove('active');
        button.classList.add('active');
    } else if (type === 'salary') {
        document.getElementById('annualSalaryToggle').classList.remove('active');
        document.getElementById('monthlySalaryToggle').classList.remove('active');
        button.classList.add('active');
    } else if (type === 'lijfrente') {
        document.getElementById('annualLijfrenteToggle').classList.remove('active');
        document.getElementById('monthlyLijfrenteToggle').classList.remove('active');
        button.classList.add('active');
    }
    berekenPensioensparen();
}

function calculateAnnualWithdrawal(totalSavings, retirementAge, lifeExpectancy, annualReturn) {
    const years = lifeExpectancy - retirementAge;
    const r = 1 + annualReturn;
    return totalSavings * (r - 1) / (1 - Math.pow(r, -years));
}
