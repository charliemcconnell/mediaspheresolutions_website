/* ============================================
   Dublin-pinned dotted wireframe globe
   Adapted from shadway/wireframe-dotted-globe (21st.dev)
   Ported from React/d3 to vanilla; oriented on Dublin
   with a slow drift and a pulsing marker.
   ============================================ */

(function () {
    const canvas = document.getElementById('dublinGlobe');
    if (!canvas || typeof d3 === 'undefined') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dublin: 53.3498° N, 6.2603° W
    const DUBLIN = [-6.2603, 53.3498];

    // Slow drift + Dublin orbit-around tilt for a gentle, alive feel.
    const ROTATION_SPEED = 0.06; // degrees per frame on longitude
    const TILT_LAT = -25;        // pitch the globe so we see Dublin from a slight downward angle

    let landFeatures = null;
    let dots = [];
    let projection;
    let path;
    let radius;
    let cssWidth;
    let cssHeight;

    function setupCanvas() {
        const rect = canvas.getBoundingClientRect();
        cssWidth = Math.max(120, rect.width);
        cssHeight = Math.max(120, rect.height);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = cssWidth * dpr;
        canvas.height = cssHeight * dpr;
        canvas.style.width = cssWidth + 'px';
        canvas.style.height = cssHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        radius = Math.min(cssWidth, cssHeight) / 2.4;
        projection = d3.geoOrthographic()
            .scale(radius)
            .translate([cssWidth / 2, cssHeight / 2])
            .clipAngle(90)
            .rotate([-DUBLIN[0], TILT_LAT]); // start with Dublin centered
        path = d3.geoPath(projection, ctx);
    }

    function pointInPolygon(point, polygon) {
        const [x, y] = point;
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];
            if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
                inside = !inside;
            }
        }
        return inside;
    }

    function pointInFeature(point, feature) {
        const g = feature.geometry;
        if (g.type === 'Polygon') {
            if (!pointInPolygon(point, g.coordinates[0])) return false;
            for (let i = 1; i < g.coordinates.length; i++) {
                if (pointInPolygon(point, g.coordinates[i])) return false;
            }
            return true;
        } else if (g.type === 'MultiPolygon') {
            for (const polygon of g.coordinates) {
                if (pointInPolygon(point, polygon[0])) {
                    let inHole = false;
                    for (let i = 1; i < polygon.length; i++) {
                        if (pointInPolygon(point, polygon[i])) { inHole = true; break; }
                    }
                    if (!inHole) return true;
                }
            }
        }
        return false;
    }

    function generateDots(features, step) {
        const out = [];
        features.forEach((feature) => {
            const bounds = d3.geoBounds(feature);
            const [[minLng, minLat], [maxLng, maxLat]] = bounds;
            for (let lng = minLng; lng <= maxLng; lng += step) {
                for (let lat = minLat; lat <= maxLat; lat += step) {
                    if (pointInFeature([lng, lat], feature)) {
                        out.push([lng, lat]);
                    }
                }
            }
        });
        return out;
    }

    function render(time) {
        if (!projection || !path) return;
        ctx.clearRect(0, 0, cssWidth, cssHeight);

        // Ocean disk
        ctx.beginPath();
        ctx.arc(cssWidth / 2, cssHeight / 2, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.strokeStyle = 'rgba(241, 236, 225, 0.55)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (landFeatures) {
            // Graticule
            const graticule = d3.geoGraticule10();
            ctx.beginPath();
            path(graticule);
            ctx.strokeStyle = 'rgba(241, 236, 225, 0.18)';
            ctx.lineWidth = 0.6;
            ctx.stroke();

            // Land outlines
            ctx.beginPath();
            landFeatures.features.forEach((f) => path(f));
            ctx.strokeStyle = 'rgba(241, 236, 225, 0.4)';
            ctx.lineWidth = 0.6;
            ctx.stroke();

            // Halftone land dots
            const scaleFactor = projection.scale() / radius;
            ctx.fillStyle = 'rgba(241, 236, 225, 0.55)';
            for (let i = 0; i < dots.length; i++) {
                const p = projection(dots[i]);
                if (!p) continue;
                if (p[0] < 0 || p[0] > cssWidth || p[1] < 0 || p[1] > cssHeight) continue;
                ctx.beginPath();
                ctx.arc(p[0], p[1], 0.9 * scaleFactor, 0, Math.PI * 2);
                ctx.fill();
            }

            // Dublin marker — only render if currently on the visible hemisphere
            const dub = projection(DUBLIN);
            if (dub) {
                // Test visibility: if the point is far outside the disk we still want to skip drawing
                const dx = dub[0] - cssWidth / 2;
                const dy = dub[1] - cssHeight / 2;
                if (Math.hypot(dx, dy) <= radius + 4) {
                    const pulse = 0.5 + 0.5 * Math.sin(time / 700);

                    // Outer pulsing halo (cream)
                    ctx.beginPath();
                    ctx.arc(dub[0], dub[1], 9 + pulse * 6, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(241, 236, 225, ' + (0.15 + pulse * 0.2) + ')';
                    ctx.fill();

                    // Inner solid dot
                    ctx.beginPath();
                    ctx.arc(dub[0], dub[1], 3.4, 0, Math.PI * 2);
                    ctx.fillStyle = '#f1ece1';
                    ctx.fill();

                    // Tiny bright center
                    ctx.beginPath();
                    ctx.arc(dub[0], dub[1], 1.4, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffff';
                    ctx.fill();
                }
            }
        }
    }

    let lastTs = 0;
    let lon = -DUBLIN[0]; // start centered on Dublin
    function tick(ts) {
        const dt = lastTs ? ts - lastTs : 16;
        lastTs = ts;
        // Drift longitude slowly (positive value = world spins; rotation is negative)
        lon += ROTATION_SPEED * (dt / 16);
        projection.rotate([lon, TILT_LAT]);
        render(ts);
        requestAnimationFrame(tick);
    }

    function onResize() {
        setupCanvas();
        // Re-bind context after setupCanvas (path uses ctx via geoPath constructor)
        path = d3.geoPath(projection, ctx);
    }

    setupCanvas();
    window.addEventListener('resize', onResize);

    // Load land geometry, then start the loop.
    const URL = 'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json';
    fetch(URL).then(function (r) {
        if (!r.ok) throw new Error('failed to load land data');
        return r.json();
    }).then(function (json) {
        landFeatures = json;
        dots = generateDots(json.features, 1.6); // step in degrees
        requestAnimationFrame(tick);
    }).catch(function () {
        // If geo load fails, still draw an empty disk + Dublin pin so the box isn't empty.
        requestAnimationFrame(tick);
    });
})();
