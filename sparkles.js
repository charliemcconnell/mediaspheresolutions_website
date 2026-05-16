/* ============================================
   Sparkles — vanilla canvas particle field
   Inspired by aceternity/sparkles (21st.dev), but
   without the tsparticles dependency.

   Usage:
     <canvas data-sparkles
             data-color="#ffffff"
             data-density="120"
             data-min-size="0.6"
             data-max-size="1.6"
             data-speed="4"></canvas>

   Any canvas with `data-sparkles` is auto-initialised.
   ============================================ */

(function () {
    function initSparkles(canvas) {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const opts = {
            color:    canvas.dataset.color   || '#ffffff',
            density:  parseInt(canvas.dataset.density  || '120', 10),
            minSize:  parseFloat(canvas.dataset.minSize || '0.4'),
            maxSize:  parseFloat(canvas.dataset.maxSize || '1.4'),
            speed:    parseFloat(canvas.dataset.speed   || '4'),
            // Drift speed range in px/sec
            drift:    parseFloat(canvas.dataset.drift   || '12')
        };

        // Parse #rrggbb into r,g,b for use in rgba()
        const hex = opts.color.replace('#', '');
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const rgb = r + ',' + g + ',' + b;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let W = 0, H = 0;
        const particles = [];

        function rebuild() {
            const rect = canvas.getBoundingClientRect();
            W = Math.max(1, rect.width);
            H = Math.max(1, rect.height);
            canvas.width  = W * dpr;
            canvas.height = H * dpr;
            canvas.style.width  = W + 'px';
            canvas.style.height = H + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // Density is per ~400×400 area, matching tsparticles' convention
            const count = Math.max(8, Math.round(opts.density * (W * H) / (400 * 400)));
            particles.length = 0;
            for (let i = 0; i < count; i++) {
                particles.push(makeParticle());
            }
        }

        function makeParticle() {
            const angle = Math.random() * Math.PI * 2;
            const speedPx = opts.drift * (0.4 + Math.random() * 0.6);
            return {
                x: Math.random() * W,
                y: Math.random() * H,
                size: opts.minSize + Math.random() * (opts.maxSize - opts.minSize),
                vx: Math.cos(angle) * speedPx / 1000,   // px per ms
                vy: Math.sin(angle) * speedPx / 1000,
                // Independent twinkle phase + speed per particle
                opacityBase:  0.10 + Math.random() * 0.90,
                opacityPhase: Math.random() * Math.PI * 2,
                opacitySpeed: 0.0005 * opts.speed * (0.5 + Math.random())
            };
        }

        let lastT = performance.now();
        function frame(now) {
            const dt = now - lastT;
            lastT = now;

            ctx.clearRect(0, 0, W, H);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;

                // Wrap around edges so the field stays uniformly populated
                if (p.x < -2)     p.x = W + 2;
                if (p.x > W + 2)  p.x = -2;
                if (p.y < -2)     p.y = H + 2;
                if (p.y > H + 2)  p.y = -2;

                const tw = 0.5 + 0.5 * Math.sin(now * p.opacitySpeed + p.opacityPhase);
                const a = (p.opacityBase * tw).toFixed(3);

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(' + rgb + ',' + a + ')';
                ctx.fill();
            }

            requestAnimationFrame(frame);
        }

        rebuild();
        const ro = new ResizeObserver(rebuild);
        ro.observe(canvas);
        window.addEventListener('resize', rebuild);

        requestAnimationFrame(frame);
    }

    function init() {
        document.querySelectorAll('canvas[data-sparkles]').forEach(initSparkles);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
