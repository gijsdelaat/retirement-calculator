let chart; // Declare a global variable to hold the chart instance
let contributionFrequency = 'annual';
let salaryFrequency = 'annual';
let incomeType = 'gross';

// Define the tax brackets and rates for pensioners
const taxBracketsPensioners = [
    { threshold: 20714, rate: 0.1945 },
    { threshold: 68967, rate: 0.3707 },
    { threshold: Infinity, rate: 0.495 }
];

function calculateNetIncomePensioners(grossIncome) {
    let netIncome = grossIncome;
    let taxableIncome = grossIncome;
    let totalTaxes = 0;

    for (let bracket of taxBracketsPensioners) {
        if (taxableIncome > bracket.threshold) {
            let incomeInBracket = Math.min(taxableIncome - bracket.threshold, bracket.threshold);
            totalTaxes += incomeInBracket * bracket.rate;
            taxableIncome -= incomeInBracket;
        } else {
            totalTaxes += taxableIncome * bracket.rate;
            break;
        }
    }

    netIncome -= totalTaxes;
    return netIncome;
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'; // Rounded to one decimal
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K'; // Rounded to integer
    }
    return num.toFixed(0);
}

function formatCurrency(value) {
    return `€${value.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function updateSliders() {
    document.getElementById('annualReturnDisplay').textContent = `${parseFloat(document.getElementById('annualReturn').value).toFixed(0)}%`;
    document.getElementById('postRetirementReturnDisplay').textContent = `${parseFloat(document.getElementById('postRetirementReturn').value).toFixed(0)}%`;
    document.getElementById('retirementAgeDisplay').textContent = parseFloat(document.getElementById('retirementAge').value).toFixed(0);
    document.getElementById('ageDisplay').textContent = parseFloat(document.getElementById('age').value).toFixed(0);
}

function toggleFrequency(button, type) {
    if (type === 'contribution') {
        contributionFrequency = button.id === 'annualToggle' ? 'annual' : 'monthly';
        document.getElementById('annualToggle').classList.toggle('active', contributionFrequency === 'annual');
        document.getElementById('monthlyToggle').classList.toggle('active', contributionFrequency === 'monthly');
    } else if (type === 'salary') {
        salaryFrequency = button.id === 'annualSalaryToggle' ? 'annual' : 'monthly';
        document.getElementById('annualSalaryToggle').classList.toggle('active', salaryFrequency === 'annual');
        document.getElementById('monthlySalaryToggle').classList.toggle('active', salaryFrequency === 'monthly');
    }
    berekenPensioensparen();
}

function toggleIncomeType(button) {
    incomeType = button.id === 'grossToggle' ? 'gross' : 'net';
    document.getElementById('grossToggle').classList.toggle('active', incomeType === 'gross');
    document.getElementById('netToggle').classList.toggle('active', incomeType === 'net');
    berekenPensioensparen();
}

function berekenPensioensparen() {
    // Haal invoerwaarden op
    const initieleInleg = parseFloat(document.getElementById('startAmount').value) || 0;
    const bijdrage = parseFloat(document.getElementById('annualContribution').value) || 0;
    const jaarlijksRendement = Math.round(parseFloat(document.getElementById('annualReturn').value) / 100) || 0.07;
    const rendementNaPensioen = Math.round(parseFloat(document.getElementById('postRetirementReturn').value) / 100) || 0.03;
    const pensioenLeeftijd = parseFloat(document.getElementById('retirementAge').value) || 65;
    const leeftijd = parseFloat(document.getElementById('age').value) || 0;
    const inkomen = parseFloat(document.getElementById('annualSalaryAfterRetirement').value) || 0;
    const levensverwachting = 95;

    // Convert to yearly if monthly
    const jaarlijkseBijdrage = contributionFrequency === 'monthly' ? bijdrage * 12 : bijdrage;
    const brutoJaarlijksInkomen = salaryFrequency === 'monthly' ? inkomen * 12 : inkomen;
    const nettoJaarlijksInkomen = calculateNetIncomePensioners(brutoJaarlijksInkomen);
    const jaarlijksInkomen = incomeType === 'gross' ? brutoJaarlijksInkomen : nettoJaarlijksInkomen;

    const jarenTotPensioen = pensioenLeeftijd - leeftijd;
    const pensioenJaren = levensverwachting - pensioenLeeftijd;

    // Bereken spaargeld tot pensioen
    let spaargeldTotPensioen = initieleInleg;
    let spaargeldData = [];
    for (let i = 0; i < jarenTotPensioen; i++) {
        spaargeldTotPensioen += jaarlijkseBijdrage;
        spaargeldTotPensioen *= (1 + jaarlijksRendement);
        spaargeldData.push(spaargeldTotPensioen.toFixed(0));
    }

    // Bereken spaargeld tijdens pensioen
    for (let i = 0; i < pensioenJaren; i++) {
        const jaarInkomenNaPensioen = pensioenLeeftijd + i >= 67 ? jaarlijksInkomen - 1047 * 12 : jaarlijksInkomen;
        spaargeldTotPensioen -= jaarInkomenNaPensioen;
        spaargeldTotPensioen *= (1 + rendementNaPensioen);
        spaargeldData.push(spaargeldTotPensioen.toFixed(0));
    }

    // Bereken het benodigde spaargeld bij pensioenleeftijd
    let benodigdSpaargeld = 0;
    for (let i = 0; i < pensioenJaren; i++) {
        const jaarInkomenNaPensioen = pensioenLeeftijd + i >= 67 ? jaarlijksInkomen - 1047 * 12 : jaarlijksInkomen;
        benodigdSpaargeld += jaarInkomenNaPensioen / Math.pow(1 + rendementNaPensioen, i + 1);
    }

    // Toon het overzicht
    document.getElementById('requiredAmount').innerHTML = formatCurrency(benodigdSpaargeld);
    document.getElementById('savedAmount').innerHTML = formatCurrency(parseFloat(spaargeldData[jarenTotPensioen - 1]));

    // Toon het resultaat
    document.getElementById('result').innerHTML = `
        <h2>Resultaat</h2>
        <div class="result-item"><strong>Totaal gespaard bedrag tot pensioen:</strong> ${formatCurrency(parseFloat(spaargeldData[jarenTotPensioen - 1]))}</div>
        <div class="result-item"><strong>Spaargeld bij pensioenleeftijd:</strong> ${formatCurrency(parseFloat(spaargeldTotPensioen))}</div>
        <div class="result-item"><strong>Jaarlijks ${incomeType === 'gross' ? 'bruto' : 'netto'} inkomen na pensioen:</strong> ${formatCurrency(jaarlijksInkomen)}</div>
    `;

    // Update de grafiek
    const labels = Array.from({ length: jarenTotPensioen + pensioenJaren }, (_, i) => leeftijd + i);

    if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = spaargeldData;
        chart.update();
    } else {
        // Maak de grafiek als deze nog niet bestaat
        const ctx = document.getElementById('savingsChart').getContext('2d');
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Pensioensparen',
                        data: spaargeldData,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
                        fill: true,
                        tension: 0.4, // Maak de lijn gladder
                        spanGaps: true, // Zorg ervoor dat de lijn doorlopend is
                        pointRadius: 0, // Verberg punten
                        pointHoverRadius: 5 // Toon punten bij hover
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true, // Zorg ervoor dat de aspect ratio behouden blijft
                interaction: {
                    mode: 'nearest',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        align: 'end',
                        labels: {
                            color: '#333',
                            font: {
                                size: 14,
                                family: 'Poppins', 
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'nearest',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 16,
                            family: 'Poppins', 
                            weight: 'bold',
                            color: '#fff'
                        },
                        bodyFont: {
                            size: 14,
                            family: 'Poppins', 
                            weight: 'normal',
                            color: '#fff'
                        },
                        footerFont: {
                            size: 12,
                            family: 'Poppins', 
                            weight: 'normal',
                            color: '#fff'
                        },
                        padding: 10,
                        cornerRadius: 6,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Leeftijd',
                            color: '#333',
                            font: {
                                size: 16,
                                family: 'Poppins', 
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#333',
                            font: {
                                size: 14,
                                family: 'Poppins', 
                            },
                            stepSize: 5
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Spaargeld (EUR)',
                            color: '#333',
                            font: {
                                size: 16,
                                family: 'Poppins', 
                                weight: 'bold'
                            }
                        },
                        grid: {
                            color: 'rgba(200, 200, 200, 0.3)'
                        },
                        ticks: {
                            color: '#333',
                            font: {
                                size: 14,
                                family: 'Poppins', 
                            },
                            callback: function(value) {
                                return formatNumber(value);
                            },
                            beginAtZero: true,
                            min: 0 // Begin at zero to avoid negative axis
                        }
                    }
                }
            }
        });
    }
}

// Initialiseer de grafiek met standaardwaarden bij het laden van de pagina
document.addEventListener('DOMContentLoaded', (event) => {
    berekenPensioensparen();
    updateSliders();
});

// Voeg event listeners toe aan invoervelden om de grafiek automatisch bij te werken
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
