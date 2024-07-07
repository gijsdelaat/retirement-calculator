document.addEventListener('DOMContentLoaded', function() {
    const footer = `
        <footer>
            <div class="footer-content">
                <p>&copy; 2023 SpaarSlim. Alle rechten voorbehouden.</p>
                <a href="mailto:gijsdelaat1993@gmail.com" class="contact-link">
                    <i class="fas fa-envelope"></i> Contact
                </a>
            </div>
        </footer>
    `;
    
    document.getElementById('footer-placeholder').innerHTML = footer;
});