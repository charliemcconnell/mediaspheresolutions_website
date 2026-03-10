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
    initScrollFlip();
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

/* --- Scroll Flip Animation --- */
function initScrollFlip() {
    const section  = document.getElementById('home');
    const cardWrap = document.getElementById('flipCardWrap');
    const card     = document.getElementById('flipCard');
    const sticky   = document.getElementById('flipSticky');

    if (!section || !cardWrap || !card || !sticky) return;

    const backFace = card.querySelector('.flip-back');

    const BASE_TILT_Y = -14;
    const BASE_TILT_X = 4;

    // Base card dimensions (read from CSS)
    const BASE_W = cardWrap.offsetWidth;
    const BASE_H = cardWrap.offsetHeight;

    let lastProgress = -1;
    let backVisible  = false;

    // Mouse tilt state
    let mouseRotY = BASE_TILT_Y;
    let mouseRotX = BASE_TILT_X;
    let isHovering = false;

    function ease3(t) {
        return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    // Mouse tilt parallax on the flip card
    sticky.addEventListener('mousemove', function(e) {
        if (lastProgress > 0.1) return; // only tilt during approach phase
        isHovering = true;
        var rect = sticky.getBoundingClientRect();
        var dx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        var dy = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        var strength = 5;
        mouseRotY = BASE_TILT_Y + dx * strength;
        mouseRotX = BASE_TILT_X - dy * strength;
    });
    sticky.addEventListener('mouseleave', function() {
        isHovering = false;
        mouseRotY = BASE_TILT_Y;
        mouseRotX = BASE_TILT_X;
    });

    function onScroll() {
        var rect     = section.getBoundingClientRect();
        var sectionH = section.offsetHeight;
        var viewH    = window.innerHeight;
        var viewW    = window.innerWidth;

        var scrolled = -rect.top;
        var travel   = sectionH - viewH;
        var progress = Math.max(0, Math.min(1, scrolled / travel));

        if (Math.abs(progress - lastProgress) < 0.0003) return;
        lastProgress = progress;

        var rotY, rotX, scaleVal, perspective = 2000;

        // ── PHASE 1: HOLD (0 → 0.08) ──
        // Card at rest — holds its tilt while scrolling up to stick position
        if (progress < 0.08) {
            rotY     = isHovering ? mouseRotY : BASE_TILT_Y;
            rotX     = isHovering ? mouseRotX : BASE_TILT_X;
            scaleVal = 1;

        // ── PHASE 2: FLIP (0.08 → 0.50) ──
        // Single smooth ease curve from tilt directly to 180° — no pre-flattening
        } else {
            var flipT     = Math.min(1, (progress - 0.08) / 0.42);
            var flipEased = ease3(flipT);
            rotY     = lerp(BASE_TILT_Y, 180, flipEased);
            rotX     = Math.sin(flipEased * Math.PI) * -5;
            scaleVal = 1 + Math.sin(flipEased * Math.PI) * 0.05;
        }

        // ── EXPAND (starts 0.30, ends 1.0) ──
        // Overlaps with flip — card grows while the back face is coming around
        var expandT     = Math.max(0, Math.min(1, (progress - 0.30) / 0.70));
        var expandEased = ease3(expandT);

        cardWrap.style.width        = lerp(BASE_W, viewW, expandEased) + 'px';
        cardWrap.style.height       = lerp(BASE_H, viewH, expandEased) + 'px';
        card.style.borderRadius     = lerp(14, 0, expandEased) + 'px';
        cardWrap.classList.toggle('fullscreen', expandEased > 0.55);

        // Flatten perspective only in the final stretch of expand
        if (expandEased > 0.6) {
            perspective = lerp(2000, 0, (expandEased - 0.6) / 0.4);
        }
        cardWrap.style.perspective = perspective > 0 ? perspective + 'px' : 'none';

        // Back face shadow fades as card expands
        if (backFace) {
            if (expandEased > 0) {
                var shadowOpacity = 1 - expandEased;
                backFace.style.boxShadow = expandEased > 0.95
                    ? 'none'
                    : (30*(1-expandEased)) + 'px ' + (30*(1-expandEased)) + 'px ' + (80*(1-expandEased)) + 'px rgba(0,0,0,' + (0.7*shadowOpacity) + '), 0 0 ' + (60*(1-expandEased)) + 'px rgba(6,182,212,' + (0.15*shadowOpacity) + ')';
            } else {
                backFace.style.boxShadow = '';
            }
        }

        card.style.transform = 'rotateY(' + rotY + 'deg) rotateX(' + rotX + 'deg) scale(' + scaleVal + ')';

        // ── FACE SWAP ──
        var isBackNow = rotY > 90 && rotY < 270;
        if (isBackNow !== backVisible) {
            backVisible = isBackNow;
            card.classList.toggle('back-visible', backVisible);
            sticky.classList.toggle('flipped', backVisible);
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}
