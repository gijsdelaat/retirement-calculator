document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    
    // Check if we're on the pension calculator page
    if (document.getElementById('pensionChartInleg')) {
        console.log('Initializing pension calculator');
        berekenPensioensparen();
        updateSliders();
        setupEventListeners();
        initializeCollapsibles();
    } else {
        console.log('Not on pension calculator page, skipping initialization');
    }
});

let chartInleg;

function setupEventListeners() {
    console.log('Setting up event listeners for pension calculator');
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

function initializeCollapsibles() {
    var coll = document.getElementsByClassName("collapsible");
    for (var i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.classList.contains('show')) {
                content.classList.remove('show');
            } else {
                content.classList.add('show');
            }
        });
    }
}

function berekenPensioensparen() {
    const initieleInleg = parseFloat(document.getElementById('startAmount').value) || 0;
    let bijdrage = parseFloat(document.getElementById('annualContribution').value) || 0;
    const jaarlijksRendement = parseFloat(document.getElementById('annualReturn').value) / 100 || 0.07;
    const rendementNaPensioen = parseFloat(document.getElementById('postRetirementReturn').value) / 100 || 0.03;
    const pensioenLeeftijd = parseFloat(document.getElementById('retirementAge').value) || 65;
    const leeftijd = parseFloat(document.getElementById('age').value) || 0;
    const levensverwachting = parseFloat(document.getElementById('lifeExpectancy').value) || 90;
    const brutoInkomen = parseFloat(document.getElementById('grossIncome').value) || 0;

    const isMonthly = document.getElementById('monthlyToggle').classList.contains('active');
    if (isMonthly) {
        bijdrage *= 12;
    }

    const jarenTotPensioen = pensioenLeeftijd - leeftijd;
    const jarenNaPensioen = levensverwachting - pensioenLeeftijd;

    const FV1 = initieleInleg * Math.pow(1 + jaarlijksRendement, jarenTotPensioen) + bijdrage * (Math.pow(1 + jaarlijksRendement, jarenTotPensioen) - 1) / jaarlijksRendement;

    function simulateWithdrawals(FV1, withdrawal, interestRate, years) {
        let balance = FV1;
        for (let year = 0; year < years; year++) {
            balance -= withdrawal;
            balance *= (1 + interestRate);
        }
        return balance;
    }

    let targetBalance = 0.5;
    let low = 0;
    let high = 100000000;
    let withdrawalEstimate = (high + low) / 2;

    while (high - low > (rendementNaPensioen > 0.05 ? 0.01 : 1)) {
        let currentBalance = simulateWithdrawals(FV1, withdrawalEstimate, rendementNaPensioen, jarenNaPensioen);
        
        if (currentBalance > targetBalance) {
            low = withdrawalEstimate;
        } else {
            high = withdrawalEstimate;
        }
        withdrawalEstimate = (high + low) / 2;
    }

    let monthlyWithdrawal = withdrawalEstimate / 12;
    document.getElementById('estimatedWithdrawalDisplay').textContent = `€${monthlyWithdrawal.toFixed(2)} per maand`;

    let spaargeldTotPensioen = initieleInleg;
    let spaargeldData = [];
    let totalYears = jarenTotPensioen + jarenNaPensioen + 5; // Extend 5 years beyond life expectancy

    for (let i = 0; i < totalYears; i++) {
        if (i < jarenTotPensioen) {
            spaargeldTotPensioen += bijdrage;
            spaargeldTotPensioen *= (1 + jaarlijksRendement);
        } else {
            spaargeldTotPensioen -= withdrawalEstimate;
            spaargeldTotPensioen *= (1 + rendementNaPensioen);
        }
        spaargeldData.push(spaargeldTotPensioen.toFixed(0));
    }

    const labels = Array.from({ length: totalYears }, (_, i) => leeftijd + i);

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
                datasets: [{
                    label: 'Pensioen',
                    data: spaargeldData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: 'rgba(75, 192, 192, 1)',
                    pointHoverBackgroundColor: 'rgba(75, 192, 192, 1)',
                    pointHoverBorderColor: '#fff',
                    fill: true,
                    tension: 0.4,
                    spanGaps: true,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
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
                                return '€' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                            },
                            beginAtZero: true
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    tooltip: {
                        enabled: false,
                        position: 'nearest',
                        external: customPensioensparenTooltip
                    },
                    legend: {
                        display: false
                    }
                },
                hover: {
                    mode: 'nearest',
                    intersect: false
                },
                animation: {
                    duration: 1000,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    // Update the table
    const dataTableBody = document.getElementById('pensionDataTable').querySelector('tbody');
    dataTableBody.innerHTML = ''; // Clear existing rows
    spaargeldData.forEach((data, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${leeftijd + index}</td><td>€${data}</td><td>€${(data * jaarlijksRendement).toFixed(0)}</td>`;
        dataTableBody.appendChild(row);
    });

    // Call the new function to update the income chart
    calculateAndUpdateIncomeChart();
}

function updateSliders() {
    document.getElementById('annualReturnDisplay').textContent = `${parseFloat(document.getElementById('annualReturn').value).toFixed(0)}%`;
    document.getElementById('postRetirementReturnDisplay').textContent = `${parseFloat(document.getElementById('postRetirementReturn').value).toFixed(0)}%`;
    document.getElementById('retirementAgeDisplay').textContent = parseFloat(document.getElementById('retirementAge').value).toFixed(0);
    document.getElementById('ageDisplay').textContent = parseFloat(document.getElementById('age').value).toFixed(0);
    document.getElementById('lifeExpectancyDisplay').textContent = parseFloat(document.getElementById('lifeExpectancy').value).toFixed(0);
}

function toggleFrequency(button, type) {
    if (type === 'contribution') {
        document.getElementById('annualToggle').classList.remove('active');
        document.getElementById('monthlyToggle').classList.remove('active');
        button.classList.add('active');
    } else if (type === 'salary') {
        document.getElementById('annualSalaryToggle').classList.remove('active');
        document.getElementById('monthlySalaryToggle').classList.remove('active');
        button.classList.add('active');
    }
    berekenPensioensparen();
}

function customPensioensparenTooltip(context) {
    if (!context || !context.chart || !context.tooltip) return;

    const chart = context.chart;
    const tooltip = context.tooltip;
    const tooltipEl = getOrCreateTooltip(chart);

    if (tooltip.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
    }

    if (tooltip.body) {
        const titleLines = tooltip.title || [];
        const bodyLines = tooltip.body.map(b => b.lines);

        // Example of extracting data, adjust according to actual data structure
        const pensionData = parseFloat(bodyLines[0][0].split(': ')[1].replace(/[^0-9.-]+/g,"")) || 0;

        const tooltipContent = `
            <div class="tooltip-header">Leeftijd: ${titleLines[0]}</div>
            <div class="tooltip-body">
                <div class="tooltip-row">
                    <span class="label">Pensioen:</span>
                    <span class="value">€${pensionData.toFixed(2)}</span>
                </div>
            </div>
        `;

        tooltipEl.innerHTML = tooltipContent;
    }

    const position = chart.canvas.getBoundingClientRect();
    tooltipEl.style.opacity = 1;
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.left = position.left + window.pageXOffset + tooltip.caretX + 'px';
    tooltipEl.style.top = position.top + window.pageYOffset + tooltip.caretY + 'px';
}

function getOrCreateTooltip(chart) {
    let tooltipEl = chart.canvas.parentNode.querySelector('div.chartjs-tooltip');

    if (!tooltipEl) {
        tooltipEl = document.createElement('div');
        tooltipEl.classList.add('chartjs-tooltip');
        chart.canvas.parentNode.appendChild(tooltipEl);
    }

    return tooltipEl;
}

// Helper function to format numbers
function formatNumber(num) {
    return '€' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function calculateAndUpdateIncomeChart() {
    const brutoInkomen = parseFloat(document.getElementById('grossIncome').value) || 0;
    const pensioenLeeftijd = parseFloat(document.getElementById('retirementAge').value) || 65;
    const leeftijd = parseFloat(document.getElementById('age').value) || 0;
    const levensverwachting = parseFloat(document.getElementById('lifeExpectancy').value) || 90;
    const withdrawalEstimate = parseFloat(document.getElementById('estimatedWithdrawalDisplay').textContent.replace(/[^0-9.-]+/g,"")) || 0;
    const incomeGrowth = parseFloat(document.getElementById('incomeGrowth').value) / 100 || 0.02;

    const AOWLeeftijd = 67; // Fixed AOW age
    const AOWStartAmount = 13200; // Starting AOW amount
    const AOWGrowthRate = 0.02; // 2% annual growth for AOW

    const jarenTotPensioen = pensioenLeeftijd - leeftijd;
    const jarenNaPensioen = levensverwachting - pensioenLeeftijd;
    const totalYears = jarenTotPensioen + jarenNaPensioen;

    let grossIncomeData = [];
    let netIncomeData = [];
    let aowData = [];
    let currentIncome = brutoInkomen;
    let currentAOW = AOWStartAmount;

    for (let i = 0; i < totalYears; i++) {
        const currentAge = leeftijd + i;
        const isAOWAge = currentAge >= AOWLeeftijd;
        
        if (i < jarenTotPensioen) {
            // Before retirement
            grossIncomeData.push(currentIncome);
            const netSalary = calculateNetSalary(currentIncome / 12, true, currentAge, isAOWAge).annualNetSalary;
            netIncomeData.push(netSalary);
            aowData.push(0);
        } else {
            // After retirement
            const aowAmount = isAOWAge ? currentAOW : 0;
            const grossIncomeWithAOW = withdrawalEstimate * 12 + aowAmount;
            grossIncomeData.push(grossIncomeWithAOW);
            const netSalary = calculateNetSalary(grossIncomeWithAOW / 12, true, currentAge, isAOWAge).annualNetSalary;
            netIncomeData.push(netSalary);
            aowData.push(aowAmount);
        }
        
        console.log(`Age: ${currentAge}, Gross Income: €${grossIncomeData[i].toFixed(2)}, Net Income: €${netIncomeData[i].toFixed(2)}, AOW: €${aowData[i].toFixed(2)}`);
        console.log(`Tax details: `, calculateNetSalary(grossIncomeData[i] / 12, true, currentAge, isAOWAge));
        
        // Apply income growth
        currentIncome *= (1 + incomeGrowth);
        
        // Only start growing AOW from AOW age
        if (isAOWAge) {
            currentAOW *= (1 + AOWGrowthRate);
        }
    }

    const labels = Array.from({ length: totalYears }, (_, i) => leeftijd + i);

    // Call the function from incomeChart.js and pass aowData
    updateIncomeChart(labels, grossIncomeData, netIncomeData, aowData);
}

function calculate() {
    console.log('Calculating pension data');
    berekenPensioensparen();
}
