let incomeChart;

function updateIncomeChart(labels, grossIncomeData, netIncomeData, aowData) {
    const ctxIncome = document.getElementById('incomeChart').getContext('2d');
    
    const maxIncome = Math.max(...grossIncomeData, ...netIncomeData);
    const yAxisMax = Math.ceil(maxIncome * 1.2 / 10000) * 10000;

    const chartConfig = {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Bruto Inkomen',
                data: grossIncomeData,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 5,
                fill: true,
                tension: 0.4,
                aowData: aowData
            },
            {
                label: 'Netto Inkomen',
                data: netIncomeData,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 5,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: { grid: { display: false } },
                y: {
                    beginAtZero: true,
                    max: yAxisMax,
                    ticks: {
                        callback: function(value) {
                            return '€' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                        }
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
                    external: customTooltip,
                },
                legend: { display: true }
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
    };

    if (incomeChart) {
        incomeChart.data.labels = labels;
        incomeChart.data.datasets[0].data = grossIncomeData;
        incomeChart.data.datasets[0].aowData = aowData;
        incomeChart.data.datasets[1].data = netIncomeData;
        incomeChart.options.scales.y.max = yAxisMax;
        incomeChart.update();
    } else {
        incomeChart = new Chart(ctxIncome, chartConfig);
    }
}

function customTooltip(context) {
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

        let grossIncome = 0;
        let netIncome = 0;
        let aow = 0;

        if (bodyLines[0] && bodyLines[0][0]) {
            grossIncome = parseFloat(bodyLines[0][0].split(': ')[1].replace(/[^0-9.-]+/g,"")) || 0;
        }
        if (bodyLines[1] && bodyLines[1][0]) {
            netIncome = parseFloat(bodyLines[1][0].split(': ')[1].replace(/[^0-9.-]+/g,"")) || 0;
        }

        // Safely access aowData
        const dataIndex = tooltip.dataPoints[0].dataIndex;
        if (chart.data.datasets[0].aowData && Array.isArray(chart.data.datasets[0].aowData)) {
            aow = chart.data.datasets[0].aowData[dataIndex] || 0;
        }

        console.log(`Tooltip - Age: ${titleLines[0]}, Gross Income: €${grossIncome.toFixed(2)}, Net Income: €${netIncome.toFixed(2)}, AOW: €${aow.toFixed(2)}`);

        const tooltipContent = `
            <div class="tooltip-header">${titleLines[0]}</div>
            <div class="tooltip-body">
                <div class="tooltip-row">
                    <span class="label">Bruto Inkomen:</span>
                    <span class="value">€${grossIncome.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
                </div>
                ${aow > 0 ? `
                <div class="tooltip-row">
                    <span class="label">waarvan AOW:</span>
                    <span class="value">€${aow.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
                </div>
                ` : ''}
                <div class="tooltip-row">
                    <span class="label">Netto Inkomen:</span>
                    <span class="value">€${netIncome.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</span>
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
