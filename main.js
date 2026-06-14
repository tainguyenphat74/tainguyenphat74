document.addEventListener('DOMContentLoaded', () => {
    console.log("%c Portfolio V4: Industrial Precision Initialized ", "background: #000; color: #fff; padding: 5px 10px; border-radius: 5px; font-weight: bold; border: 1px solid #333;");
    
    // 1. Reveal on Scroll (Intersection Observer)
    const revealElements = document.querySelectorAll('.reveal');
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    };

    const revealObserver = new IntersectionObserver(revealCallback, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // 2. Smooth Link Handling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 70;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. Header Visibility Logic
    let lastScrollY = window.scrollY;
    const nav = document.querySelector('.nav-minimal');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
            // Scroll down - hide nav
            nav.style.transform = 'translateY(-100%)';
        } else {
            // Scroll up - show nav
            nav.style.transform = 'translateY(0)';
        }
        lastScrollY = window.scrollY;
    });

    // 4. Subtle Mouse Grid Interaction
    const grid = document.querySelector('.grid-overlay');
    window.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        grid.style.backgroundImage = `
            radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.05) 0%, transparent 40%),
            linear-gradient(to right, #111 1px, transparent 1px),
            linear-gradient(to bottom, #111 1px, transparent 1px)
        `;
    });
});
