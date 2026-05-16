/* ============================================
   Cosmos backdrop — fixed-position canvas behind
   the whole page. Quiet starfield + occasional
   shooting stars + faint nebula glows.

   Tuned so it's the kind of layer you almost
   don't notice; "wait, am I seeing that?"
   ============================================ */

(function () {
    const canvas = document.getElementById('cosmosCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // World state ---------------------------------------------------
    let W = 0, H = 0;             // CSS pixel size of the canvas
    const stars = [];             // static twinkling stars
    const nebulae = [];           // soft cloudy glows
    const shootingStars = [];     // transient streaks

    // Settings ------------------------------------------------------
    const STAR_COUNT_BASE = 110;  // density baseline (per ~1.4M px²)
    const NEBULA_COUNT    = 6;
    const SHOOTING_MIN_DELAY = 6500;   // ms
    const SHOOTING_MAX_DELAY = 14000;

    // Helpers -------------------------------------------------------
    function rand(min, max) { return Math.random() * (max - min) + min; }

    function rebuildWorld() {
        stars.length = 0;
        nebulae.length = 0;

        const area = W * H;
        const starCount = Math.round(STAR_COUNT_BASE * (area / (1440 * 900)));
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                r: rand(0.3, 1.4),
                base: rand(0.18, 0.65),
                twinkleSpeed: rand(0.0006, 0.0022),
                twinklePhase: Math.random() * Math.PI * 2
            });
        }

        // Nebulae disabled — keeping just black with stars throughout
    }

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width  = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        rebuildWorld();
    }

    function spawnShootingStar() {
        // Diagonal streak across the upper third of the viewport
        const startX = rand(W * 0.05, W * 0.95);
        const startY = rand(0, H * 0.55);
        const speed  = rand(0.55, 0.95);   // px per ms
        const angle  = rand(Math.PI * 0.18, Math.PI * 0.32); // gentle downward
        shootingStars.push({
            x: startX,
            y: startY,
            vx:  Math.cos(angle) * speed,
            vy:  Math.sin(angle) * speed,
            life: 0,
            maxLife: rand(900, 1500),
            tail: rand(120, 200),
            opacity: rand(0.35, 0.7)
        });
        scheduleNextShootingStar();
    }

    function scheduleNextShootingStar() {
        setTimeout(spawnShootingStar, rand(SHOOTING_MIN_DELAY, SHOOTING_MAX_DELAY));
    }

    // Render --------------------------------------------------------
    let lastT = performance.now();

    function frame(now) {
        const dt = now - lastT;
        lastT = now;

        ctx.clearRect(0, 0, W, H);

        // Nebulae — drawn once per frame, very faint
        for (let i = 0; i < nebulae.length; i++) {
            const n = nebulae[i];
            const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
            grad.addColorStop(0,   n.color + n.alpha + ')');
            grad.addColorStop(0.6, n.color + (n.alpha * 0.35).toFixed(4) + ')');
            grad.addColorStop(1,   n.color + '0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);
        }

        // Stars
        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            const tw = 0.55 + 0.45 * Math.sin(now * s.twinkleSpeed + s.twinklePhase);
            const a  = (s.base * tw).toFixed(3);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
            ctx.fill();
        }

        // Shooting stars
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const ss = shootingStars[i];
            ss.life += dt;
            ss.x += ss.vx * dt;
            ss.y += ss.vy * dt;

            const lifeT = ss.life / ss.maxLife; // 0 → 1
            // Fade in fast, fade out slow
            const aEnv = lifeT < 0.15 ? lifeT / 0.15 : 1 - (lifeT - 0.15) / 0.85;
            const a = Math.max(0, ss.opacity * aEnv);

            // Tail behind direction of travel
            const tailX = ss.x - ss.vx * ss.tail;
            const tailY = ss.y - ss.vy * ss.tail;
            const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(1, 'rgba(255,250,235,' + a.toFixed(3) + ')');

            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(ss.x, ss.y);
            ctx.stroke();

            // Bright head
            ctx.beginPath();
            ctx.arc(ss.x, ss.y, 1.4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,250,235,' + a.toFixed(3) + ')';
            ctx.fill();

            if (ss.life >= ss.maxLife || ss.x < -50 || ss.x > W + 50 || ss.y > H + 50) {
                shootingStars.splice(i, 1);
            }
        }

        requestAnimationFrame(frame);
    }

    // Boot ----------------------------------------------------------
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
    scheduleNextShootingStar();
})();
