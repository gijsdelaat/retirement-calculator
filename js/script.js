document.addEventListener('DOMContentLoaded', (event) => {
    berekenBox3Sparen();
    updateSliders();
    setupEventListeners();
    initializeCollapsibles();
    initializeTableCollapsibles();
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
    const taxRate = 0.36;

    for (let i = 0; i < spaarduur; i++) {
        spaargeld += jaarlijkseBijdrage;
        cumulativeContributions += jaarlijkseBijdrage;
        
        // Calculate Box 3 Belasting
        const taxableAmount = Math.max(spaargeld - taxFreeAllowance, 0);
        const savingsReturn = taxableAmount * 0.005;
        const investmentsReturn = taxableAmount * 0.0533;
        const netReturn = savingsReturn + investmentsReturn;
        const belasting = netReturn * taxRate;
        
        // Apply the tax before calculating the return
        spaargeld -= belasting;
        
        // Calculate return after tax
        spaargeld *= (1 + jaarlijksRendement);
        
        spaargeldData.push(spaargeld.toFixed(0));
        contributionsData.push(cumulativeContributions.toFixed(0));
        rendementData.push((spaargeld - cumulativeContributions).toFixed(0));
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
                maintainAspectRatio: true,
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
                            family: "'Poppins', sans-serif"
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
                                
                                const formatNumber = (num) => '€' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                                const padRight = (str, length) => str.padStart(length, ' ');
                                
                                const labelWidth = 15;
                                const valueWidth = 15;
                                const formatLabel = (label) => label.padEnd(labelWidth);
                                const formatValue = (value) => formatNumber(value).padStart(valueWidth);
                                return [
                                    `${formatLabel('Spaargeld:')}${formatValue(spaargeld)}`,
                                    `${formatLabel('Eigen inleg:')}${formatValue(eigenInleg)}`,
                                    `${formatLabel('Rendement:')}${formatValue(rendement)}`
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
        document.body.appendChild(newTooltip);
    }

    const tooltipModel = chart.tooltip;
    if (tooltipModel.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
    }

    // Get the data for the tooltip
    const dataPoint = tooltipModel.dataPoints[0];
    const spaargeld = parseFloat(dataPoint.raw);
    const eigenInleg = parseFloat(chart.data.datasets[1].data[dataPoint.dataIndex]);
    const rendement = spaargeld - eigenInleg;

    // Create the tooltip content
    let tooltipContent = `
        <div class="tooltip-header">Jaar: ${dataPoint.label}</div>
        <div class="tooltip-body">
            <div class="tooltip-row">
                <span class="label">Spaargeld:</span>
                <span class="value">${formatNumber(spaargeld)}</span>
            </div>
            <div class="tooltip-row">
                <span class="label">Eigen inleg:</span>
                <span class="value">${formatNumber(eigenInleg)}</span>
            </div>
            <div class="tooltip-row">
                <span class="label">Rendement:</span>
                <span class="value">${formatNumber(rendement)}</span>
            </div>
        </div>
    `;

    // Set the tooltip content
    tooltipEl.innerHTML = tooltipContent;

    // Position the tooltip
    const position = chart.canvas.getBoundingClientRect();
    tooltipEl.style.opacity = 1;
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
    tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
}

// Helper function to format numbers
function formatNumber(num) {
    return '€' + num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// After creating the chart:
chart.options.plugins.tooltip.enabled = false;
chart.options.plugins.tooltip.external = customTooltip;

document.addEventListener('DOMContentLoaded', function() {
    const calculatorOptions = document.querySelectorAll('.calculator-option');
    
    calculatorOptions.forEach(option => {
        const video = option.querySelector('video');
        
        option.addEventListener('mouseenter', () => {
            video.play();
        });
        
        option.addEventListener('mouseleave', () => {
            video.pause();
            video.currentTime = 0;
        });
    });
});

function initializeCollapsibles() {
    var coll = document.getElementsByClassName("collapsible");
    for (var i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }
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

