document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split("/").pop();
    
    const header = `
    <div class="logo" style="display: flex; align-items: center;">
    <a href="index.html" style="display: flex; align-items: center; text-decoration: none; color: inherit;">
        <img src="src/mobile-logo.svg" alt="Logo" style="height: 80px; margin-right: 10px;margin: 15px; ">
        <h1>SpaarSlim</h1>
    </a>
</div>
<nav>
<ul>
    <li><a href="box3sparen.html" class="${currentPage === 'box3sparen.html' ? 'active' : ''}"><i class="fas fa-piggy-bank"></i> Box 3 Sparen</a></li>
    <li><a href="pensioensparen.html" class="${currentPage === 'pensioensparen.html' ? 'active' : ''}"><i class="fas fa-chart-line"></i> Pensioensparen</a></li>
    <li><a href="bruto_netto.html" class="${currentPage === 'bruto_netto.html' ? 'active' : ''}"><i class="fas fa-exchange-alt"></i> Netto/Bruto Salaris Omrekenen</a></li>
</ul>
</nav>
    `;
    
    document.getElementById('header-placeholder').innerHTML = header;
});