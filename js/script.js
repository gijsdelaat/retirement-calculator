document.addEventListener('DOMContentLoaded', (event) => {
    berekenBox3Sparen();
    updateSliders();
    setupEventListeners();
});

let chart;

function setupEventListeners() {
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => {
            berekenBox3Sparen();
            updateSliders();
        });
    });

    document.querySelectorAll('.toggle-buttons button').forEach(button => {
        button.addEventListener('click', (event) => {
            toggleFrequency(event.target, 'contribution');
        });
    });
}

function berekenBox3Sparen() {
    const initieleInleg = parseFloat(document.getElementById('startAmount').value) || 0;
    const bijdrage = parseFloat(document.getElementById('annualContribution').value) || 0;
    const jaarlijksRendement = parseFloat(document.getElementById('annualReturn').value) / 100 || 0.07;
    const leeftijd = parseFloat(document.getElementById('age').value) || 0;
    const spaarduur = parseFloat(document.getElementById('savingsDuration').value) || 0;
    const heeftFiscaalPartner = document.getElementById('fiscalPartner').checked;

    const jaarlijkseBijdrage = document.getElementById('monthlyToggle').classList.contains('active') ? bijdrage * 12 : bijdrage;

    let spaargeld = initieleInleg;
    let spaargeldData = [];
    let belastingData = [];
    let cumulativeContributions = initieleInleg;
    let contributionsData = [];
    let rendementData = [];
    const taxFreeAllowance = heeftFiscaalPartner ? 114000 : 57000;
    const taxRate = 0.32;

    for (let i = 0; i < spaarduur; i++) {
        spaargeld += jaarlijkseBijdrage;
        cumulativeContributions += jaarlijkseBijdrage;
        spaargeld *= (1 + jaarlijksRendement);
        spaargeldData.push(spaargeld.toFixed(0));
        contributionsData.push(cumulativeContributions.toFixed(0));
        rendementData.push((spaargeld - cumulativeContributions).toFixed(0));

        // Calculate Box 3 Belasting
        const taxableAmount = Math.max(spaargeld - taxFreeAllowance, 0);
        const savingsReturn = taxableAmount * 0.005;
        const investmentsReturn = taxableAmount * 0.0533;
        const netReturn = savingsReturn + investmentsReturn;
        const belasting = netReturn * taxRate;
        belastingData.push(belasting.toFixed(0));
    }

    const labels = Array.from({ length: spaarduur }, (_, i) => leeftijd + i);

    if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = spaargeldData;
        chart.data.datasets[1].data = contributionsData;
        chart.data.datasets[2].data = rendementData;
        chart.update();
    } else {
        const ctx = document.getElementById('savingsChart').getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Spaargeld',
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
                    },
                    {
                        label: 'Eigen Inleg',
                        data: contributionsData,
                        borderColor: 'rgba(75, 192, 75, 1)',
                        backgroundColor: 'rgba(75, 192, 75, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: 'rgba(75, 192, 75, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(75, 192, 75, 1)',
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
                            }
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

    // Update the pension data table
    const pensionDataTableBody = document.getElementById('pensionDataTable').querySelector('tbody');
    pensionDataTableBody.innerHTML = '';
    // Update the table
    const dataTableBody = document.getElementById('dataTable').querySelector('tbody');
    dataTableBody.innerHTML = '';
    spaargeldData.forEach((data, index) => {
        const belasting = belastingData[index];
        const row = document.createElement('tr');
        row.innerHTML = `<td>${leeftijd + index}</td><td>€${data.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</td><td>€${(data * jaarlijksRendement).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</td><td>€${belasting.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</td>`;
        dataTableBody.appendChild(row);
    });
}

function updateSliders() {
    document.getElementById('annualReturnDisplay').textContent = `${parseFloat(document.getElementById('annualReturn').value).toFixed(0)}%`;
    document.getElementById('ageDisplay').textContent = parseFloat(document.getElementById('age').value).toFixed(0);
    document.getElementById('savingsDurationDisplay').textContent = parseFloat(document.getElementById('savingsDuration').value).toFixed(0);
}

function toggleFrequency(button, type) {
    if (type === 'contribution') {
        document.getElementById('annualToggle').classList.remove('active');
        document.getElementById('monthlyToggle').classList.remove('active');
        button.classList.add('active');
    }
    berekenBox3Sparen();
}
