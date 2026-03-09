/* ============================================
   MediaSphere Solutions — Main Script
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initMobileMenu();
    initScrollReveal();
    initStepsLine();
    initCountUp();
    initSmoothScroll();
});

/* --- Navbar scroll effect --- */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    function handleScroll() {
        const currentScroll = window.scrollY;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
}

/* --- Mobile menu toggle --- */
function initMobileMenu() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        menu.classList.toggle('open');
        document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu on link click
    menu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('active');
            menu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

/* --- Scroll Reveal with Intersection Observer --- */
function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const delay = entry.target.dataset.delay || 0;
                setTimeout(() => {
                    entry.target.classList.add('revealed');
                }, delay * 120);
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

/* --- Steps progress line fill on scroll --- */
function initStepsLine() {
    const lineFill = document.getElementById('steps-line-fill');
    const container = document.querySelector('.steps-container');

    if (!lineFill || !container) return;

    function updateLine() {
        const rect = container.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const containerTop = rect.top;
        const containerHeight = rect.height;

        // Calculate how far through the container we've scrolled
        const start = containerTop - windowHeight * 0.7;
        const end = containerTop + containerHeight - windowHeight * 0.3;
        const current = -start;
        const total = end - containerTop + windowHeight * 0.7;

        let progress = current / total;
        progress = Math.max(0, Math.min(1, progress));

        lineFill.style.height = (progress * 100) + '%';
    }

    window.addEventListener('scroll', updateLine, { passive: true });
    updateLine();
}

/* --- Count-up animation for stat numbers --- */
function initCountUp() {
    const statNumbers = document.querySelectorAll('.stat-number[data-count]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count, 10);
                animateCount(el, 0, target, 1200);
                observer.unobserve(el);
            }
        });
    }, {
        threshold: 0.5
    });

    statNumbers.forEach(el => observer.observe(el));
}

function animateCount(el, start, end, duration) {
    const startTime = performance.now();

    function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * eased);

        el.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(tick);
        }
    }

    requestAnimationFrame(tick);
}

/* --- Smooth scroll for anchor links --- */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (!target) return;

            e.preventDefault();

            const navHeight = document.getElementById('navbar').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
}
