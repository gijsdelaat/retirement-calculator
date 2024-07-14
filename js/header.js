document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split("/").pop();
    
    const header = `
    <div class="logo">
        <a href="index.html">
            <img src="src/mobile-logo.svg" alt="Logo">
            <h1>SpaarSlim</h1>
        </a>
    </div>
    <nav>
        <ul class="nav-list">
            <li><a href="box3sparen.html" class="${currentPage === 'box3sparen.html' ? 'active' : ''}">Box 3 Beleggen</a></li>
            <li><a href="pensioensparen.html" class="${currentPage === 'pensioensparen.html' ? 'active' : ''}"> Pensioensparen</a></li>
            <li><a href="bruto_netto.html" class="${currentPage === 'bruto_netto.html' ? 'active' : ''}"> Netto/Bruto</a></li>
        </ul>
    </nav>
    <div class="contact">
        <a href="mailto:gijsdelaat1993@gmail.com" class="contact-button">Contact</a>
    </div>
    <div class="mobile-menu-toggle">
        <i class="fas fa-bars"></i>
    </div>
    `;
    
    document.getElementById('header-placeholder').innerHTML = header;

    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navList = document.querySelector('.nav-list');

    mobileMenuToggle.addEventListener('click', () => {
        navList.classList.toggle('active');
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            mobileMenuToggle.style.display = 'block';
            navList.style.display = 'none';
        } else {
            mobileMenuToggle.style.display = 'none';
            navList.style.display = 'flex';
        }
    });

    window.dispatchEvent(new Event('resize'));
});