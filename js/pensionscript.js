document.addEventListener('DOMContentLoaded', (event) => {
    berekenPensioensparen();
    updateSliders();
    setupEventListeners();
});

let chartInleg;
let chartBrutoInkomen;

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
    const bijdrage = parseFloat(document.getElementById('annualContribution').value) || 0;
    const jaarlijksRendement = parseFloat(document.getElementById('annualReturn').value) / 100 || 0.07;
    const rendementNaPensioen = parseFloat(document.getElementById('postRetirementReturn').value) / 100 || 0.03;
    const pensioenLeeftijd = parseFloat(document.getElementById('retirementAge').value) || 65;
    const leeftijd = parseFloat(document.getElementById('age').value) || 0;
    const levensverwachting = parseFloat(document.getElementById('lifeExpectancy').value) || 90;
    const inkomen = parseFloat(document.getElementById('annualSalaryAfterRetirement').value) || 0;
    const brutoInkomen = parseFloat(document.getElementById('grossIncome').value) || 0;
    const lijfrenteUitkering = parseFloat(document.getElementById('lijfrenteUitkering').value) || 0;
    const heeftFiscaalPartner = document.getElementById('fiscalPartner').checked;

    const jaarlijkseBijdrage = document.getElementById('monthlyToggle').classList.contains('active') ? bijdrage * 12 : bijdrage;
    const brutoJaarlijksInkomen = document.getElementById('monthlyIncomeToggle').classList.contains('active') ? brutoInkomen * 12 : brutoInkomen;
    const nettoJaarlijksInkomen = calculateNetIncomePensioners(brutoJaarlijksInkomen);
    const jaarlijksInkomen = document.getElementById('annualSalaryToggle').classList.contains('active') ? brutoJaarlijksInkomen : nettoJaarlijksInkomen;
    const jaarlijkseLijfrenteUitkering = document.getElementById('monthlyLijfrenteToggle').classList.contains('active') ? lijfrenteUitkering * 12 : lijfrenteUitkering;

    // Bereken jaarruimte
    const jaarruimte = calculateJaarruimte(brutoJaarlijksInkomen);

    // Bereken belastingvoordeel
    const belastingVoordeel = jaarlijkseBijdrage * 0.3697; // 36.97% belastingteruggave

    let spaargeldTotPensioen = initieleInleg;
    let spaargeldData = [];
    let brutoInkomenData = [];
    for (let i = 0; i < pensioenLeeftijd - leeftijd; i++) {
        spaargeldTotPensioen += jaarlijkseBijdrage;
        spaargeldTotPensioen *= (1 + jaarlijksRendement);
        spaargeldData.push(spaargeldTotPensioen.toFixed(0));
        brutoInkomenData.push(brutoJaarlijksInkomen.toFixed(0));
    }

    for (let i = 0; i < levensverwachting - pensioenLeeftijd; i++) {
        const jaarInkomenNaPensioen = pensioenLeeftijd + i >= 67 ? jaarlijksInkomen - 1047 * 12 : jaarlijksInkomen;
        spaargeldTotPensioen -= jaarInkomenNaPensioen;
        spaargeldTotPensioen += jaarlijkseLijfrenteUitkering; // Voeg lijfrente-uitkering toe
        spaargeldTotPensioen *= (1 + rendementNaPensioen);
        spaargeldData.push(spaargeldTotPensioen.toFixed(0));
        brutoInkomenData.push(jaarInkomenNaPensioen.toFixed(0));
    }

    const labels = Array.from({ length: pensioenLeeftijd - leeftijd + levensverwachting - pensioenLeeftijd }, (_, i) => leeftijd + i);
    const dataValuesInleg = spaargeldData;
    const dataValuesBrutoInkomen = brutoInkomenData;

    if (chartInleg) {
        chartInleg.data.labels = labels;
        chartInleg.data.datasets[0].data = dataValuesInleg;
        chartInleg.update();
    } else {
        const ctxInleg = document.getElementById('pensionChartInleg').getContext('2d');
        chartInleg = new Chart(ctxInleg, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Inleg',
                        data: dataValuesInleg,
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
                interaction: {
                    mode: 'nearest',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: €${context.raw}`;
                        }
                    }
                }
            }
        });
    }

    if (chartBrutoInkomen) {
        chartBrutoInkomen.data.labels = labels;
        chartBrutoInkomen.data.datasets[0].data = dataValuesBrutoInkomen;
        chartBrutoInkomen.update();
    } else {
        const ctxBrutoInkomen = document.getElementById('pensionChartBrutoInkomen').getContext('2d');
        chartBrutoInkomen = new Chart(ctxBrutoInkomen, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Bruto Inkomen',
                        data: dataValuesBrutoInkomen,
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
                interaction: {
                    mode: 'nearest',
                    intersect: false,
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: €${context.raw}`;
                        }
                    }
                }
            }
        });
    }

    // Update the table
    const dataTableBody = document.getElementById('pensionDataTable').querySelector('tbody');
    dataTableBody.innerHTML = '';
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

function calculateNetIncomePensioners(grossIncome) {
    const taxRate = 0.3697; // Example tax rate
    return grossIncome * (1 - taxRate);
}

function calculateJaarruimte(brutoInkomen) {
    const factor = 0.13; // Voorbeeldfactor voor jaarruimte
    return brutoInkomen * factor;
}

function toggleFrequency(button, type) {
    if (type === 'income') {
        document.getElementById('annualIncomeToggle').classList.remove('active');
        document.getElementById('monthlyIncomeToggle').classList.remove('active');
        button.classList.add('active');
    } else if (type === 'contribution') {
        document.getElementById('annualToggle').classList.remove('active');
        document.getElementById('monthlyToggle').classList.remove('active');
        button.classList.add('active');
    } else if (type === 'salary') {
        document.getElementById('annualSalaryToggle').classList.remove('active');
        document.getElementById('monthlySalaryToggle').classList.remove('active');
        button.classList.add('active');
    } else if (type === 'lijfrente') {
        document.getElementById('annualLijfrenteToggle').classList.remove('active');
        document.getElementById('monthlyLijfrenteToggle').classList.remove('active');
        button.classList.add('active');
    }
    berekenPensioensparen();
}