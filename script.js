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
    initOrbitAnimation();
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
    var section  = document.getElementById('home');
    var cardWrap = document.getElementById('flipCardWrap');
    var card     = document.getElementById('flipCard');
    var sticky   = document.getElementById('flipSticky');
    var backInner = document.getElementById('backInner');
    var backFace  = card ? card.querySelector('.flip-back') : null;
    var backVisualCol = card ? card.querySelector('.back-visual-col') : null;
    var orbitSidebar = document.getElementById('orbitSidebar');
    var sysBlocksWrap = backInner ? backInner.querySelector('.back-system-blocks') : null;

    if (!section || !cardWrap || !card || !sticky) return;

    var BASE_TILT_Y = -14;
    var BASE_TILT_X = 4;
    var BASE_W = cardWrap.offsetWidth;
    var BASE_H = cardWrap.offsetHeight;

    var lastProgress = -1;
    var backVisible  = false;
    var mouseRotY = BASE_TILT_Y;
    var mouseRotX = BASE_TILT_X;
    var backCenterPad = -1; // computed once when first needed

    var stickyLockOffset = sticky.getBoundingClientRect().top - section.getBoundingClientRect().top;

    // REVEAL_END: fraction of total progress used for the initial scale-in reveal
    var REVEAL_END = 0.03;
    // ANIM_END: fraction of total progress used for the flip+expand animation
    // The remaining (1 - ANIM_END) is used to scroll system content through the card
    var ANIM_END = 0.40;
    var REVEAL_END_LOCAL = REVEAL_END / ANIM_END;

    var TOTAL_SYSTEM_HEIGHT = 0;
    var sysHeightComputed = false;
    var sysBlocksEl = null;

    function ease3(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
    function easeOut3(t) { return 1 - Math.pow(1 - t, 3); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    sticky.addEventListener('mousemove', function(e) {
        if (lastProgress > REVEAL_END + 0.05) return;
        var r  = sticky.getBoundingClientRect();
        var dx = ((e.clientX - r.left) / r.width  - 0.5) * 2;
        var dy = ((e.clientY - r.top)  / r.height - 0.5) * 2;
        mouseRotY = BASE_TILT_Y + dx * 5;
        mouseRotX = BASE_TILT_X - dy * 5;
    });
    sticky.addEventListener('mouseleave', function() {
        mouseRotY = BASE_TILT_Y;
        mouseRotX = BASE_TILT_X;
    });

    function onScroll() {
        var rect     = section.getBoundingClientRect();
        var sectionH = section.offsetHeight;
        var viewH    = window.innerHeight;
        var viewW    = window.innerWidth;

        var scrolled     = -rect.top;
        var travel       = sectionH - viewH;
        var animScrolled = Math.max(0, scrolled - stickyLockOffset);
        var animTravel   = Math.max(1, travel - stickyLockOffset);
        var progress     = Math.max(0, Math.min(1, animScrolled / animTravel));

        if (Math.abs(progress - lastProgress) < 0.0003) return;
        lastProgress = progress;

        // Phase 1 (0 → ANIM_END): flip card animates and expands
        var animProgress = Math.min(1, progress / ANIM_END);
        // Phase 2 (ANIM_END → 1): system content scrolls upward through the card
        var contentProgress = Math.max(0, (progress - ANIM_END) / (1 - ANIM_END));

        var revealT     = Math.min(1, animProgress / REVEAL_END_LOCAL);
        var revealEased = ease3(revealT);

        var flipProgress = animProgress < REVEAL_END_LOCAL
            ? 0
            : Math.min(1, (animProgress - REVEAL_END_LOCAL) / (1 - REVEAL_END_LOCAL));

        var rotY, rotX, scaleVal, perspective;

        if (flipProgress === 0) {
            rotY        = lerp(0, BASE_TILT_Y, revealEased);
            rotX        = lerp(0, BASE_TILT_X, revealEased);
            scaleVal    = lerp(0.96, 1, revealEased);
            perspective = lerp(20000, 2000, revealEased);
        } else {
            var flipT     = Math.min(1, flipProgress / 0.55);
            var flipEased = easeOut3(flipT);
            rotY        = lerp(BASE_TILT_Y, -180, flipEased);
            rotX        = lerp(BASE_TILT_X, 0, flipEased) + Math.sin(flipEased * Math.PI) * -5;
            scaleVal    = 1 + Math.sin(flipEased * Math.PI) * 0.05;
            perspective = 2000;
        }

        var expandT     = Math.max(0, Math.min(1, (flipProgress - 0.30) / 0.70));
        var expandEased = ease3(expandT);

        var currentCardH = lerp(BASE_H, viewH - 130, expandEased);
        cardWrap.style.width    = lerp(BASE_W, viewW, expandEased) + 'px';
        cardWrap.style.height   = currentCardH + 'px';
        card.style.borderRadius = lerp(14, 0, expandEased) + 'px';
        cardWrap.classList.toggle('fullscreen', expandEased > 0.55);

        if (expandEased > 0.6) {
            perspective = lerp(2000, 0, (expandEased - 0.6) / 0.4);
        }
        cardWrap.style.perspective = perspective > 0 ? perspective + 'px' : 'none';
        card.style.transform = 'rotateY(' + rotY + 'deg) rotateX(' + rotX + 'deg) scale(' + scaleVal + ')';

        // Smoothly drive back face padding-top (avoids justify-content snap)
        if (backFace && backInner) {
            if (backCenterPad < 0) {
                var innerH = backInner.offsetHeight || 380;
                backCenterPad = Math.max(40, (BASE_H - innerH) / 2);
            }
            var sidePad = lerp(50, 80, expandEased);
            backFace.style.paddingTop    = lerp(backCenterPad, 0, expandEased).toFixed(1) + 'px';
            backFace.style.paddingLeft   = sidePad.toFixed(1) + 'px';
            backFace.style.paddingRight  = sidePad.toFixed(1) + 'px';
        }


        var isBackNow = rotY < -90;
        if (isBackNow !== backVisible) {
            backVisible = isBackNow;
            card.classList.toggle('back-visible', backVisible);
            sticky.classList.toggle('flipped', backVisible);
        }

        // Fade in system blocks as flip nears completion
        if (sysBlocksWrap) {
            sysBlocksWrap.style.opacity = expandEased > 0.75 ? '1' : '0';
        }

        // Phase 2: scroll system content upward through the fullscreen back face
        if (backInner) {
            if (!sysHeightComputed && expandEased > 0.98) {
                TOTAL_SYSTEM_HEIGHT = Math.max(0, backInner.scrollHeight - (viewH - 130));
                sysHeightComputed = true;
                if (!sysBlocksEl) sysBlocksEl = backInner.querySelector('.back-system-blocks');
            }
            if (TOTAL_SYSTEM_HEIGHT > 0) {
                var contentOffset = contentProgress * TOTAL_SYSTEM_HEIGHT;
                backInner.style.transform = contentOffset > 0
                    ? 'translateY(-' + contentOffset.toFixed(1) + 'px)'
                    : '';

                // Sticky orbit: counter-translate so it stays fixed in the
                // card viewport while blocks scroll past.
                if (orbitSidebar && sysBlocksEl) {
                    var sysTop   = sysBlocksEl.offsetTop;
                    var targetY  = 150; // stick 150px from top of card
                    var counter  = Math.max(0, contentOffset - (sysTop - targetY));
                    var MAX_ORBIT_TRAVEL = 1850; // hard cap in px — tune this value
                    counter = Math.min(counter, MAX_ORBIT_TRAVEL);

                    orbitSidebar.style.transform = counter > 0
                        ? 'translateY(' + counter.toFixed(1) + 'px)'
                        : '';
                }
            }
        }

    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/* --- Orbiting Skills Animation --- */
function initOrbitAnimation() {
    var scene = document.getElementById('orbitScene');
    if (!scene) return;

    var nodes = Array.from(scene.querySelectorAll('.orbit-node'));
    var timeOffset = 0;
    var pauseStart = null;

    scene.addEventListener('mouseenter', function() {
        pauseStart = performance.now();
    });
    scene.addEventListener('mouseleave', function() {
        if (pauseStart !== null) {
            timeOffset += performance.now() - pauseStart;
            pauseStart = null;
        }
    });

    function tick(ts) {
        var elapsed = pauseStart !== null
            ? (pauseStart - timeOffset) / 1000
            : (ts - timeOffset) / 1000;

        nodes.forEach(function(node) {
            var radius = parseFloat(node.dataset.radius);
            var phase  = parseFloat(node.dataset.phase);
            var speed  = parseFloat(node.dataset.speed);
            var angle  = elapsed * speed + phase;
            var x = Math.cos(angle) * radius;
            var y = Math.sin(angle) * radius;
            node.style.transform = 'translate(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px)';
        });

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}
