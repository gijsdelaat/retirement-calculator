document.addEventListener('DOMContentLoaded', (event) => {
    berekenPensioensparen();
    updateSliders();
    setupEventListeners();
});

let chartInleg;

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
    const initieleInleg = parseFloat(document.getElementById('startAmount').value) || 0;
    let bijdrage = parseFloat(document.getElementById('annualContribution').value) || 0;
    const jaarlijksRendement = parseFloat(document.getElementById('annualReturn').value) / 100 || 0.07;
    const rendementNaPensioen = parseFloat(document.getElementById('postRetirementReturn').value) / 100 || 0.03;
    const pensioenLeeftijd = parseFloat(document.getElementById('retirementAge').value) || 65;
    const leeftijd = parseFloat(document.getElementById('age').value) || 0;
    const levensverwachting = parseFloat(document.getElementById('lifeExpectancy').value) || 90;

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
                            beginAtZero: true
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
    dataTableBody.innerHTML = ''; // Clear existing rows
    spaargeldData.forEach((data, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${leeftijd + index}</td><td>€${data}</td><td>€${(data * jaarlijksRendement).toFixed(0)}</td>`;
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
