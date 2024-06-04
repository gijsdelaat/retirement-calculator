let chart; // Declare a global variable to hold the chart instance
let contributionFrequency = 'annual';
let salaryFrequency = 'annual';
let incomeType = 'gross';
let lifeExpectancy = 95; // Added variable for life expectancy with default value 95

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
    document.getElementById('lifeExpectancyDisplay').textContent = parseFloat(document.getElementById('lifeExpectancy').value).toFixed(0);
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
    const jaarlijksRendement = parseFloat(document.getElementById('annualReturn').value) / 100 || 0.07;
    const rendementNaPensioen = parseFloat(document.getElementById('postRetirementReturn').value) / 100 || 0.03;
    const pensioenLeeftijd = parseFloat(document.getElementById('retirementAge').value) || 65;
    const leeftijd = parseFloat(document.getElementById('age').value) || 0;
    const levensverwachting = parseFloat(document.getElementById('lifeExpectancy').value) || lifeExpectancy;
    const inkomen = parseFloat(document.getElementById('annualSalaryAfterRetirement').value) || 0;

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
        spaargeldData.push({ leeftijd: leeftijd + i, spaargeld: Math.max(spaargeldTotPensioen, 0).toFixed(0) });
    }

    // Bereken spaargeld tijdens pensioen
    for (let i = 0; i < pensioenJaren; i++) {
        const jaarInkomenNaPensioen = pensioenLeeftijd + i >= 67 ? jaarlijksInkomen - 1047 * 12 : jaarlijksInkomen;
        spaargeldTotPensioen -= jaarInkomenNaPensioen;
        spaargeldTotPensioen *= (1 + rendementNaPensioen);
        spaargeldTotPensioen = Math.max(spaargeldTotPensioen, 0); // Ensure it doesn't go below 0
        spaargeldTotPensioen = Math.max(spaargeldTotPensioen, 0); // Ensure it doesn't go below 0
        spaargeldTotPensioen = Math.max(spaargeldTotPensioen, 0); // Ensure it doesn't go below 0
        spaargeldData.push({ leeftijd: pensioenLeeftijd + i, spaargeld: spaargeldTotPensioen.toFixed(0) });
    }

    // Bereken het benodigde spaargeld bij pensioenleeftijd
    let benodigdSpaargeld = 0;
    for (let i = 0; i < pensioenJaren; i++) {
        const jaarInkomenNaPensioen = pensioenLeeftijd + i >= 67 ? jaarlijksInkomen - 1047 * 12 : jaarlijksInkomen;
        benodigdSpaargeld += jaarInkomenNaPensioen / Math.pow(1 + rendementNaPensioen, i + 1);
    }

    // Toon het overzicht
    document.getElementById('requiredAmount').innerHTML = formatCurrency(benodigdSpaargeld);
    document.getElementById('savedAmount').innerHTML = formatCurrency(parseFloat(spaargeldData[jarenTotPensioen - 1].spaargeld));

    // Update de tabel
    const dataTableBody = document.getElementById('dataTable').querySelector('tbody');
    dataTableBody.innerHTML = '';
    spaargeldData.forEach(data => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${data.leeftijd}</td><td>${formatCurrency(parseFloat(data.spaargeld))}</td>`;
        dataTableBody.appendChild(row);
    });

    // Update de grafiek
    const labels = spaargeldData.map(data => data.leeftijd);
    const dataValues = spaargeldData.map(data => data.spaargeld);

    if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = dataValues;
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
                        data: dataValues,
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
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                    }
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
                        callbacks: {
                            label: function (context) {
                                return `Value: ${formatNumber(context.raw)}`;
                            }
                        },
                        backgroundColor: '#333', // Background color
                        titleFontFamily: 'Poppins', // Font family for the title
                        titleFontSize: 18, // Font size for the title
                        titleFontColor: '#fff', // Font color for the title
                        bodyFontFamily: 'Poppins', // Font family for the body
                        bodyFontSize: 16, // Font size for the body
                        bodyFontColor: '#fff', // Font color for the body
                        displayColors: false, // Disable the color box
                        xPadding: 15, // Padding on the x-axis
                        yPadding: 15, // Padding on the y-axis
                        borderColor: '#007bff', // Border color
                        borderWidth: 1, // Border width
                        cornerRadius: 4 // Border radius
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Leeftijd',
                            color: '#333',
                            font: {
                                size: 14,
                                family: 'Poppins',
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            color: '#333',
                            font: {
                                size: 12,
                                family: 'Poppins'
                            }
                        },
                        grid: {
                            display: false // Disable vertical grid lines
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Spaargeld (€)',
                            color: '#333',
                            font: {
                                size: 14,
                                family: 'Poppins',
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            color: '#333',
                            font: {
                                size: 12,
                                family: 'Poppins'
                            },
                            callback: function (value) {
                                return formatCurrency(value);
                            }
                        },
                        grid: {
                            display: true // Enable horizontal grid lines
                        },
                        min: 0 // Ensure the y-axis starts at 0
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

    const annualSalaryAfterRetirementInput = document.getElementById('annualSalaryAfterRetirement');
    const annualSalaryToggle = document.getElementById('annualSalaryToggle');
    const monthlySalaryToggle = document.getElementById('monthlySalaryToggle');

    annualSalaryAfterRetirementInput.addEventListener('input', updateSalaryAfterRetirement);
    annualSalaryToggle.addEventListener('click', () => toggleFrequency(annualSalaryToggle, 'salary'));
    monthlySalaryToggle.addEventListener('click', () => toggleFrequency(monthlySalaryToggle, 'salary'));

    function updateSalaryAfterRetirement() {
        const salary = annualSalaryAfterRetirementInput.value;
        console.log(`Updated salary after retirement: €${salary}`);
        berekenPensioensparen();
    }

    function toggleFrequency(button, type) {
        if (type === 'salary') {
            annualSalaryToggle.classList.remove('active');
            monthlySalaryToggle.classList.remove('active');
            button.classList.add('active');
            salaryFrequency = button.id === 'annualSalaryToggle' ? 'annual' : 'monthly';
            berekenPensioensparen();
        }
    }
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

document.getElementById('annualReturn').addEventListener('input', () => {
    updateSliders();
    berekenPensioensparen();
});

document.getElementById('postRetirementReturn').addEventListener('input', () => {
    updateSliders();
    berekenPensioensparen();
});

document.getElementById('lifeExpectancy').addEventListener('input', () => {
    updateSliders();
    berekenPensioensparen();
});

// Add similar event listeners for other input elements if needed
