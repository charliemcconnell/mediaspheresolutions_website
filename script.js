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
    initAppPreview();
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

/* --- 3D App Preview Animations --- */
function initAppPreview() {
    const tiltFrame = document.getElementById('tiltFrame');
    if (!tiltFrame) return;

    // Ticker animation
    (function() {
        const track = document.querySelector('.ticker-track');
        if (!track) return;
        const items = Array.from(track.children);
        items.forEach(item => track.appendChild(item.cloneNode(true)));

        let x = 0;
        const speed = 0.6;
        const halfWidth = () => track.scrollWidth / 2;
        function animateTicker() {
            x -= speed;
            if (Math.abs(x) >= halfWidth()) x = 0;
            track.style.transform = 'translateX(' + x + 'px)';
            requestAnimationFrame(animateTicker);
        }
        animateTicker();
    })();

    // Mouse tilt parallax — only when hovering the preview
    (function() {
        const frame = document.getElementById('tiltFrame');
        const preview = document.querySelector('.hero-app-preview');
        if (!frame || !preview) return;
        const baseY = -14, baseX = 4;
        const strength = 5;

        preview.addEventListener('mousemove', (e) => {
            const rect = preview.getBoundingClientRect();
            const dx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const dy = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            const rotY = baseY + dx * strength;
            const rotX = baseX - dy * strength;
            frame.style.transform = 'rotateY(' + rotY + 'deg) rotateX(' + rotX + 'deg) scale(1)';
        });
        preview.addEventListener('mouseleave', () => {
            frame.style.transition = 'transform 0.5s ease';
            frame.style.transform = 'rotateY(' + baseY + 'deg) rotateX(' + baseX + 'deg) scale(1)';
            setTimeout(() => { frame.style.transition = ''; }, 500);
        });
    })();

    // Revenue counter pulse
    (function() {
        const el = document.getElementById('revenueVal');
        if (!el) return;
        const target = 104800;
        let current = 98000;
        let counting = false;

        function startCount() {
            if (counting) return;
            counting = true;
            const step = (target - current) / 60;
            function tick() {
                current += step;
                if (current >= target) {
                    current = target;
                    el.textContent = '\u20AC' + (current / 1000).toFixed(1) + 'k';
                    el.classList.remove('counting');
                    counting = false;
                    current = 98000;
                    setTimeout(startCount, 8000);
                    return;
                }
                el.textContent = '\u20AC' + (current / 1000).toFixed(1) + 'k';
                el.classList.add('counting');
                requestAnimationFrame(tick);
            }
            tick();
        }
        setTimeout(startCount, 2500);
    })();

    // Pipeline card animation
    (function() {
        const stages = [0,1,2,3,4].map(i => document.getElementById('stage'+i));
        if (!stages[0]) return;
        const counts = [8,11,9,14,26];
        const snEls = [0,1,2,3,4].map(i => document.getElementById('sn'+i));
        const notif = document.getElementById('floatNotif');
        const bubble = document.getElementById('leadBubble');

        const labelTags = ['tag-g','tag-m','tag-b','tag-r','tag-w'];
        const labelTexts = ['Google Ads','Follow-up','Booked','5 stars','Won'];

        let currentStage = 0;

        function showNotif() {
            if (notif) { notif.classList.add('show'); setTimeout(() => notif.classList.remove('show'), 2800); }
        }

        function popBubble() {
            if (!bubble) return;
            const revenueKpi = document.getElementById('revenueKpi');
            if (!revenueKpi) return;
            const rect = revenueKpi.getBoundingClientRect();
            bubble.style.left = (rect.left + rect.width / 2 - 20) + 'px';
            bubble.style.top = (rect.top - 10) + 'px';
            bubble.classList.add('pop');
            setTimeout(() => bubble.classList.remove('pop'), 1800);
        }

        function advanceCard() {
            const movingCard = document.getElementById('movingCard');
            if (!movingCard) return;
            const nextStage = (currentStage + 1) % 5;

            movingCard.classList.add('moving');

            setTimeout(() => {
                movingCard.classList.remove('moving');
                counts[currentStage]--;
                if (snEls[currentStage]) snEls[currentStage].textContent = counts[currentStage];

                const tag = movingCard.querySelector('.lcard-tag');
                if (tag) {
                    tag.className = 'lcard-tag ' + labelTags[nextStage];
                    tag.textContent = labelTexts[nextStage];
                }

                const stageEl = stages[nextStage];
                const header = stageEl.querySelector('.stage-hd');
                if (header && header.nextSibling) {
                    stageEl.insertBefore(movingCard, header.nextSibling);
                } else {
                    stageEl.appendChild(movingCard);
                }

                counts[nextStage]++;
                if (snEls[nextStage]) snEls[nextStage].textContent = counts[nextStage];

                currentStage = nextStage;

                if (currentStage === 0) { showNotif(); popBubble(); }
            }, 1200);
        }

        setInterval(advanceCard, 4500);
        setTimeout(() => { showNotif(); popBubble(); }, 2000);
    })();
}
