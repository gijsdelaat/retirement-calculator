document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM fully loaded and parsed');
    
    // Check if we're on the pension calculator page
    if (document.getElementById('pensionChartInleg')) {
        console.log('Initializing pension calculator');
        berekenPensioensparen();
        updateSliders();
        setupEventListeners();
        initializeCollapsibles();
        initializeTableCollapsibles();
    } else {
        console.log('Not on pension calculator page, skipping initialization');
    }
});

let chartInleg;
let spaargeldData = [];

function setupEventListeners() {
    console.log('Setting up event listeners for pension calculator');
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            berekenPensioensparen();
            updateSliders();
            calculateAndUpdateIncomeChart();
        });
    });

    document.querySelectorAll('.toggle-buttons button').forEach(button => {
        button.addEventListener('click', (event) => {
            toggleFrequency(event.target, event.target.closest('.input-toggle-container').querySelector('input').id === 'annualContribution' ? 'contribution' : 'salary');
            calculateAndUpdateIncomeChart();
        });
    });

    document.getElementById('annualContribution').addEventListener('input', calculateAndUpdateIncomeChart);
    document.getElementById('monthlyToggle').addEventListener('click', calculateAndUpdateIncomeChart);
    document.getElementById('annualToggle').addEventListener('click', calculateAndUpdateIncomeChart);
    document.getElementById('incomeGrowth').addEventListener('input', updateSliders);
    document.getElementById('aowGrowth').addEventListener('input', function() {
        updateSliders();
        calculate();
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
    const AOWGrowthRate = parseFloat(document.getElementById('aowGrowth').value) / 100 || 0.01;

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
    document.getElementById('estimatedWithdrawalDisplay').textContent = `€${monthlyWithdrawal.toFixed(2)} bruto per maand`;

    let spaargeldTotPensioen = initieleInleg;
    spaargeldData = [];
    let totalYears = jarenTotPensioen + jarenNaPensioen + 5; // Extend 5 years beyond life expectancy

    for (let i = 0; i < totalYears; i++) {
        if (i < jarenTotPensioen) {
            spaargeldTotPensioen += bijdrage;
            spaargeldTotPensioen *= (1 + jaarlijksRendement);
        } else {
            if (spaargeldTotPensioen > 0) {
                spaargeldTotPensioen -= withdrawalEstimate;
                if (spaargeldTotPensioen > 0) {
                    spaargeldTotPensioen *= (1 + rendementNaPensioen);
                } else {
                    spaargeldTotPensioen = 0;
                }
            } else {
                withdrawalEstimate = 0; // No more pension payments
            }
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
        
        // Create gradient
        const gradientFill = ctxInleg.createLinearGradient(0, 0, 0, ctxInleg.canvas.height);
        gradientFill.addColorStop(0, 'rgba(75, 192, 192, 0.6)');
        gradientFill.addColorStop(1, 'rgba(75, 192, 192, 0.1)');

        chartInleg = new Chart(ctxInleg, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pensioen',
                    data: spaargeldData,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: gradientFill,
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
                                return '€' + formatNumber(value);
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
        row.innerHTML = `
            <td>${leeftijd + index}</td>
            <td>€${formatNumber(parseFloat(data))}</td>
            <td>€${formatNumber((parseFloat(data) * jaarlijksRendement).toFixed(0))}</td>
        `;
        dataTableBody.appendChild(row);
    });

    // Add explanation
    const explanation = `
        <p><strong>Berekening van je Pensioenkapitaal:</strong></p>
        <p>We gebruiken de volgende formule om het pensioenkapitaal te berekenen:</p>
        <p>FV = P * (1 + r)^n + PMT * ((1 + r)^n - 1) / r</p>
        <p>Waar:</p>
        <ul>
            <li>FV = Toekomstige waarde (pensioenkapitaal)</li>
            <li>P = Initiële inleg (€${initieleInleg.toFixed(2)})</li>
            <li>r = Jaarlijks rendement (${(jaarlijksRendement * 100).toFixed(2)}%)</li>
            <li>n = Aantal jaren tot pensioen (${jarenTotPensioen})</li>
            <li>PMT = Jaarlijkse bijdrage (€${bijdrage.toFixed(2)})</li>
        </ul>
        <p>Met deze gegevens komt het geschatte pensioenkapitaal op €${FV1.toFixed(2)}.</p>
        <p><strong>Berekening van de Maandelijkse Uitkering:</strong></p>
        <p>We gebruiken een iteratieve methode om de maandelijkse uitkering te berekenen, zodat het pensioenkapitaal ongeveer op is aan het einde van de verwachte levensduur. Hierbij houden we rekening met een rendement na pensioen van ${(rendementNaPensioen * 100).toFixed(2)}%.</p>
        <p><strong>AOW Berekening:</strong></p>
        <p>We starten met een basis AOW-bedrag van €13.200 per jaar. Dit bedrag groeit jaarlijks met ${(AOWGrowthRate * 100).toFixed(1)}% vanaf het huidige jaar tot aan en tijdens de pensioenperiode.</p>
    `;

    document.getElementById('calculation-details').innerHTML = explanation;

    // Call the new function to update the income chart
    calculateAndUpdateIncomeChart();
}

function updateSliders() {
    document.getElementById('annualReturnDisplay').textContent = `${parseFloat(document.getElementById('annualReturn').value).toFixed(0)}%`;
    document.getElementById('postRetirementReturnDisplay').textContent = `${parseFloat(document.getElementById('postRetirementReturn').value).toFixed(0)}%`;
    document.getElementById('retirementAgeDisplay').textContent = parseFloat(document.getElementById('retirementAge').value).toFixed(0);
    document.getElementById('ageDisplay').textContent = parseFloat(document.getElementById('age').value).toFixed(0);
    document.getElementById('lifeExpectancyDisplay').textContent = parseFloat(document.getElementById('lifeExpectancy').value).toFixed(0);
    document.getElementById('incomeGrowthDisplay').textContent = `${parseFloat(document.getElementById('incomeGrowth').value).toFixed(0)}%`;
    document.getElementById('aowGrowthDisplay').textContent = `${parseFloat(document.getElementById('aowGrowth').value).toFixed(1)}%`;
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
        const dataPoints = tooltip.dataPoints;

        // Extract pension data
        const pensionData = dataPoints[0].raw;

        const tooltipContent = `
            <div class="tooltip-header">Leeftijd: ${titleLines[0]}</div>
            <div class="tooltip-body">
                <div class="tooltip-row">
                    <span class="label">Pensioen:</span>
                    <span class="value">€${formatNumber(pensionData)}</span>
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
function formatNumber(number) {
    return new Intl.NumberFormat('nl-NL', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.round(number));
}

function calculateAndUpdateIncomeChart() {
    const brutoInkomen = parseFloat(document.getElementById('grossIncome').value) || 0;
    const pensioenLeeftijd = parseFloat(document.getElementById('retirementAge').value) || 65;
    const leeftijd = parseFloat(document.getElementById('age').value) || 0;
    const levensverwachting = parseFloat(document.getElementById('lifeExpectancy').value) || 90;
    const withdrawalEstimate = parseFloat(document.getElementById('estimatedWithdrawalDisplay').textContent.replace(/[^0-9.-]+/g,"")) || 0;
    const incomeGrowth = parseFloat(document.getElementById('incomeGrowth').value) / 100 || 0.02;
    const AOWGrowthRate = parseFloat(document.getElementById('aowGrowth').value) / 100 || 0.01;

    // Get pension contribution from pensioensparen page
    const pensionContribution = parseFloat(document.getElementById('annualContribution').value) || 0;
    const pensionFrequency = document.getElementById('monthlyToggle').classList.contains('active') ? 'monthly' : 'annual';

    const AOWLeeftijd = 67; // Fixed AOW age
    const AOWStartAmount = 13200; // Starting AOW amount for the current year

    const totalYears = levensverwachting - leeftijd + 5; // Extend 5 years beyond life expectancy

    let grossIncomeData = [];
    let netIncomeData = [];
    let aowData = [];
    let currentIncome = brutoInkomen;
    let currentAOW = AOWStartAmount;

    // Calculate the future AOW amount at AOW age
    for (let i = 0; i < AOWLeeftijd - leeftijd; i++) {
        currentAOW *= (1 + AOWGrowthRate);
    }

    const incomeDataTableBody = document.getElementById('incomeDataTable').querySelector('tbody');
    incomeDataTableBody.innerHTML = ''; // Clear existing rows

    for (let i = 0; i < totalYears; i++) {
        const currentAge = leeftijd + i;
        const isAOWAge = currentAge >= AOWLeeftijd;
        const isRetired = currentAge >= pensioenLeeftijd;
        const isBeyondLifeExpectancy = currentAge > levensverwachting;
        
        if (!isRetired) {
            // Before retirement
            grossIncomeData.push(currentIncome);
            const annualPensionContribution = pensionFrequency === 'monthly' ? pensionContribution * 12 : pensionContribution;
            const netSalary = calculateNetSalaryShared(currentIncome / 12, annualPensionContribution / 12, currentAge).annualNetSalary;
            netIncomeData.push(netSalary);
            aowData.push(0);

            // Add row to the table
            addRowToIncomeTable(incomeDataTableBody, currentAge, currentIncome, netSalary, 0, isBeyondLifeExpectancy);

            // Apply income growth
            currentIncome *= (1 + incomeGrowth);
        } else {
            // After retirement
            const aowAmount = isAOWAge ? currentAOW : 0;
            const currentPension = i < spaargeldData.length && parseFloat(spaargeldData[i]) > 0 ? withdrawalEstimate * 12 : 0;
            const grossIncomeWithAOW = currentPension + aowAmount;
            grossIncomeData.push(grossIncomeWithAOW);
            const netSalary = calculateNetSalaryShared(grossIncomeWithAOW / 12, 0, currentAge).annualNetSalary;
            netIncomeData.push(netSalary);
            aowData.push(aowAmount);

            // Add row to the table
            addRowToIncomeTable(incomeDataTableBody, currentAge, grossIncomeWithAOW, netSalary, aowAmount, isBeyondLifeExpectancy);
        }

        // Apply AOW growth every year, regardless of whether it's being received yet
        currentAOW *= (1 + AOWGrowthRate);
    }

    const labels = Array.from({ length: totalYears }, (_, i) => leeftijd + i);

    // Round the numbers before passing them to updateIncomeChart
    grossIncomeData = grossIncomeData.map(value => Math.round(value));
    netIncomeData = netIncomeData.map(value => Math.round(value));
    aowData = aowData.map(value => Math.round(value));

    // Log the data before calling updateIncomeChart
    console.log('Calculated Data for Income Chart:', {
        labels,
        grossIncomeData,
        netIncomeData,
        aowData
    });

    updateIncomeChart(labels, grossIncomeData, netIncomeData, aowData);

    // Add explanation
    const explanation = `
        <p><strong>Berekening van het Inkomen:</strong></p>
        <p>We berekenen het inkomen voor elk jaar vanaf de huidige leeftijd (${leeftijd}) tot 5 jaar na de verwachte levensduur (${levensverwachting + 5}).</p>
        <ul>
            <li><strong>Voor Pensioen (tot ${pensioenLeeftijd} jaar):</strong></li>
            <ul>
                <li>Bruto inkomen start op €${brutoInkomen.toFixed(2)} en groeit jaarlijks met ${(incomeGrowth * 100).toFixed(1)}%</li>
                <li>Netto inkomen wordt berekend op basis van de huidige belastingregels</li>
                <li>Pensioenbijdrage: €${pensionContribution.toFixed(2)} per ${pensionFrequency === 'monthly' ? 'maand' : 'jaar'}</li>
            </ul>
            <li><strong>Na Pensioen (vanaf ${pensioenLeeftijd} jaar):</strong></li>
            <ul>
                <li>Bruto inkomen bestaat uit pensioenuitkering (€${(withdrawalEstimate * 12).toFixed(2)} per jaar) plus AOW (indien van toepassing)</li>
                <li>AOW start op €${AOWStartAmount.toFixed(2)} per jaar vanaf ${AOWLeeftijd} jaar en groeit jaarlijks met ${(AOWGrowthRate * 100).toFixed(1)}%</li>
                <li>Netto inkomen wordt berekend op basis van de huidige belastingregels voor gepensioneerden</li>
            </ul>
        </ul>
        <p><strong>Netto Inkomen Berekening:</strong></p>
        <p>Het netto inkomen wordt berekend door de bruto-netto calculator te gebruiken, rekening houdend met de huidige belastingschijven, heffingskortingen, en sociale premies. Voor gepensioneerden worden aangepaste regels toegepast.</p>
        <p><strong>Opmerking:</strong> Deze berekeningen zijn gebaseerd op de huidige belastingregels en kunnen in de toekomst veranderen.</p>
    `;

    document.getElementById('income-calculation-details').innerHTML = explanation;
}

function addRowToIncomeTable(tableBody, age, grossIncome, netIncome, aowAmount, isBeyondLifeExpectancy) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${age}</td>
        <td>€${formatNumber(grossIncome)}</td>
        <td>€${formatNumber(netIncome)}</td>
        <td>€${formatNumber(aowAmount)}</td>
    `;
    if (isBeyondLifeExpectancy) {
        row.style.opacity = 0.5;
    }
    tableBody.appendChild(row);
}

function calculate() {
    console.log('Calculating pension data');
    berekenPensioensparen();
}
function initializeTableCollapsibles() {
    var coll = document.getElementsByClassName("table-collapsible");
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
