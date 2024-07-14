document.addEventListener('DOMContentLoaded', function() {
    const footer = `
        <footer>
            <div class="footer-content">
                <p>&copy; 2023 SpaarSlim. Alle rechten voorbehouden.</p>
                <a href="mailto:gijsdelaat1993@gmail.com" class="contact-link">
                    <i class="fas fa-envelope"></i> Contact
                </a>
                <a href="privacy-policy.html" class="contact-link">
                    <i class="fas fa-shield-alt"></i> Privacybeleid
                </a>
                <a href="terms-of-service.html" class="contact-link">
                    <i class="fas fa-file-contract"></i> Algemene Voorwaarden
                </a>
            </div>
            <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2645932518176941"
     crossorigin="anonymous"></script>
        </footer>
    `;
    
    document.getElementById('footer-placeholder').innerHTML = footer;
});