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

    // Update the estimated total display
    const estimatedTotal = spaargeld;
    document.getElementById('estimatedTotalDisplay').textContent = `€${estimatedTotal.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} spaargeld`;

    const labels = Array.from({ length: spaarduur }, (_, i) => i + 1);

    const ctx = document.getElementById('savingsChart');
    if (!ctx) {
        console.error('Canvas element not found');
        return;
    }

    if (chart) {
        // Update existing chart
        chart.data.labels = labels;
        chart.data.datasets[0].data = spaargeldData;
        chart.data.datasets[1].data = contributionsData;
        chart.update();
    } else {
        // Create new chart
        chart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Spaargeld',
                        data: spaargeldData,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: 'rgba(75, 192, 192, 1)',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                    },
                    {
                        label: 'Eigen Inleg',
                        data: contributionsData,
                        borderColor: 'rgba(75, 192, 75, 1)',
                        backgroundColor: 'rgba(75, 192, 75, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: 'rgba(75, 192, 75, 1)',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: false, // This will remove the legend entirely
                    },
                    tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#333',
                        titleFont: {
                            size: 16,
                            weight: 'bold',
                            family: "'Poppins', sans-serif" // Assuming you're using Poppins font
                        },
                        bodyColor: '#666',
                        bodyFont: {
                            size: 14,
                            family: "'Poppins', sans-serif"
                        },
                        borderColor: '#ddd',
                        borderWidth: 1,
                        padding: 16,
                        callbacks: {
                            title: function(tooltipItems) {
                                return 'Jaar: ' + tooltipItems[0].label;
                            },
                            label: function(context) {
                                return '';  // We'll use afterBody for all labels
                            },
                            afterBody: function(tooltipItems) {
                                const spaargeld = tooltipItems[0].parsed.y;
                                const eigenInleg = tooltipItems[1].parsed.y;
                                const rendement = spaargeld - eigenInleg;
                                
                                return [
                                    'Spaargeld:      €' + spaargeld.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, "."),
                                    'Eigen inleg:    €' + eigenInleg.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, "."),
                                    'Totaal rendement: €' + rendement.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                                ];
                            },
                            labelTextColor: function(context) {
                                return '#666';  // Consistent color for all text
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12,
                                family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
                            }
                        }
                    },
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '€' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                            },
                            font: {
                                size: 12,
                                family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                }
            }
        });
    }


    // Update the pension data table
    const pensionDataTableBody = document.getElementById('pensionDataTable');
    if (pensionDataTableBody) {
        const tbody = pensionDataTableBody.querySelector('tbody');
        if (tbody) {
            tbody.innerHTML = '';
        }
    }

    // Update the table
    const dataTable = document.getElementById('dataTable');
    if (dataTable) {
        const dataTableBody = dataTable.querySelector('tbody');
        if (dataTableBody) {
            dataTableBody.innerHTML = '';
            spaargeldData.forEach((data, index) => {
                const belasting = belastingData[index];
                const row = document.createElement('tr');
                row.innerHTML = `<td>${index + 1}</td><td>€${data.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</td><td>€${(data * jaarlijksRendement).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</td><td>€${belasting.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</td>`;
                dataTableBody.appendChild(row);
            });
        }
    }
}

function updateSliders() {
    document.getElementById('annualReturnDisplay').textContent = `${parseFloat(document.getElementById('annualReturn').value).toFixed(0)}%`;
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

function customTooltip(chart) {
    const tooltipEl = document.getElementById('chartjs-tooltip');
    
    if (!tooltipEl) {
        const newTooltip = document.createElement('div');
        newTooltip.id = 'chartjs-tooltip';
        newTooltip.innerHTML = '<div class="tooltip-header"></div><div class="tooltip-body"></div>';
        document.body.appendChild(newTooltip);
    }

    const tooltipModel = chart.tooltip;
    if (tooltipModel.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
    }

    const headerEl = tooltipEl.querySelector('.tooltip-header');
    const bodyEl = tooltipEl.querySelector('.tooltip-body');

    headerEl.textContent = tooltipModel.title[0];
    
    const bodyLines = tooltipModel.body.map(b => b.lines).flat();
    bodyEl.innerHTML = bodyLines.map((line, i) => {
        if (i === 0) {
            return `<span class="total">${line}</span>`;
        }
        return line;
    }).join('\n');

    const position = chart.canvas.getBoundingClientRect();
    tooltipEl.style.opacity = 1;
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
    tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
}

// After creating the chart:
chart.options.plugins.tooltip.enabled = false;
chart.options.plugins.tooltip.external = customTooltip;
