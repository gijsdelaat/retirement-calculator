let incomeChart;

function updateIncomeChart(labels, grossIncomeData, netIncomeData, aowData) {
    const ctxIncome = document.getElementById('incomeChart').getContext('2d');
    
    const maxIncome = Math.max(...grossIncomeData, ...netIncomeData);
    const yAxisMax = Math.ceil(maxIncome * 1.2 / 10000) * 10000;

    // Log the data being passed to the chart
    console.log('Updating Income Chart with data:', {
        labels,
        grossIncomeData,
        netIncomeData,
        aowData,
        yAxisMax
    });

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
                tension: 0.4
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
            },
            {
                label: 'AOW',
                data: aowData,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
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
                    external: customGrossIncomeTooltip,
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
        incomeChart.data.datasets[1].data = netIncomeData;
        incomeChart.data.datasets[2].data = aowData;
        incomeChart.options.scales.y.max = yAxisMax;
        incomeChart.update();
    } else {
        incomeChart = new Chart(ctxIncome, chartConfig);
    }
}

function customGrossIncomeTooltip(context) {
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

        let grossIncome = 0;
        let netIncome = 0;
        let aow = 0;

        if (dataPoints[0]) {
            grossIncome = dataPoints[0].raw;
        }
        if (dataPoints[1]) {
            netIncome = dataPoints[1].raw;
        }
        if (dataPoints[2]) {
            aow = dataPoints[2].raw;
        }

        const dataIndex = tooltip.dataPoints[0].dataIndex;

        // Log the values to the console
        console.log('Tooltip Data:', {
            titleLines,
            grossIncome,
            netIncome,
            aow,
            dataIndex,
            dataPoints,
            tooltipDataPoints: tooltip.dataPoints
        });

        const tooltipContent = `
            <div class="tooltip-header">Leeftijd: ${titleLines[0]}</div>
            <div class="tooltip-body">
                <div class="tooltip-row">
                    <span class="label">Bruto Inkomen (Incl. AOW):</span>
                    <span class="value">${formatNumber(grossIncome)}</span>
                </div>
                <div class="tooltip-row">
                    <span class="label">Netto Inkomen:</span>
                    <span class="value">${formatNumber(netIncome)}</span>
                </div>
                <div class="tooltip-row">
                    <span class="label">AOW:</span>
                    <span class="value">${formatNumber(aow)}</span>
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