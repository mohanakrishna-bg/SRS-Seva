// Loconet Intranet Main Logic

document.addEventListener('DOMContentLoaded', () => {
    console.log('Loconet Intranet Initialized');
    
    // Initialize Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // Handle Sidebar Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Log navigation for demonstration
            console.log(`Navigating to: ${link.textContent.trim()}`);
            
            // Re-initialize icons just in case content changes
            if (window.lucide) {
                window.lucide.createIcons();
            }
        });
    });

    // Simulate Dynamic Data Updates
    const stats = document.querySelectorAll('.stat-value');
    setInterval(() => {
        stats.forEach(stat => {
            if (stat.textContent.includes(',')) {
                // Randomly toggle some numbers for visual liveliness
                let val = parseInt(stat.textContent.replace(',', ''));
                if (Math.random() > 0.8) {
                    val += Math.floor(Math.random() * 5);
                    stat.textContent = val.toLocaleString();
                }
            }
        });
    }, 5000);
});

// Utility for transitions
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});
