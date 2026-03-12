/**
 * MediaSphere Solutions — World Map Animation
 *
 * How it works:
 *  1. Fetches world-atlas TopoJSON (countries at 110m resolution)
 *  2. Draws country polygons onto an offscreen <canvas> using equirectangular projection
 *  3. Samples pixels: dots are only placed where land exists
 *  4. Overlays animated SVG arcs from Dublin to global cities
 */
(function () {
  'use strict';

  /* ── constants ───────────────────────────────────────────────── */
  var W           = 800;
  var H           = 400;
  var NS          = 'http://www.w3.org/2000/svg';
  var ARC_COLOR   = '#8b5cf6';   // purple accent-2
  var ORIG_COLOR  = '#06b6d4';   // cyan accent-3 — Dublin
  var DOT_SPACING = 3;           // px between dots — tighter grid, matches reference
  var DOT_R       = 0.6;
  var STAGGER     = 480;         // ms between arc starts
  var ARC_DUR     = 1900;        // ms to draw one arc
  var LOOP_PAUSE  = 2800;        // ms pause before looping

  /* ── locations ───────────────────────────────────────────────── */
  var ORIGIN = { lat: 53.35, lng: -6.26, label: 'Dublin' };
  var DESTS  = [
    { lat:  40.71, lng:  -74.00, label: 'New York'  },
    { lat:  43.65, lng:  -79.38, label: 'Toronto'   },
    { lat: -23.55, lng:  -46.63, label: 'São Paulo'  },
    { lat:  25.20, lng:   55.27, label: 'Dubai'     },
    { lat:  -1.29, lng:   36.82, label: 'Nairobi'   },
    { lat:   1.35, lng:  103.82, label: 'Singapore' },
    { lat: -33.87, lng:  151.21, label: 'Sydney'    },
    { lat:  35.69, lng:  139.69, label: 'Tokyo'     },
  ];

  /* ── projection (equirectangular) ────────────────────────────── */
  function project(lat, lng) {
    return {
      x: (lng + 180) * (W / 360),
      y: (90 - lat)  * (H / 180),
    };
  }

  /* ── SVG helpers ─────────────────────────────────────────────── */
  function svgEl(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    return e;
  }
  function f(n) { return n.toFixed(1); }
  function arcPath(a, b) {
    var mx = (a.x + b.x) / 2;
    var my = Math.min(a.y, b.y) - 62;
    return 'M ' + f(a.x) + ' ' + f(a.y) + ' Q ' + f(mx) + ' ' + f(my) + ' ' + f(b.x) + ' ' + f(b.y);
  }

  /* ── SVG <defs> (gradient, glow filter, vignette mask) ───────── */
  function buildDefs(svg) {
    var defs = svgEl('defs');

    // Arc gradient: fades to transparent at both ends
    var grad = svgEl('linearGradient', { id: 'ms-arc-grad', x1: '0%', y1: '0%', x2: '100%', y2: '0%' });
    [
      { offset: '0%',   color: 'white',    op: '0' },
      { offset: '5%',   color: ARC_COLOR,  op: '1' },
      { offset: '95%',  color: ARC_COLOR,  op: '1' },
      { offset: '100%', color: 'white',    op: '0' },
    ].forEach(function (s) {
      grad.appendChild(svgEl('stop', { offset: s.offset, 'stop-color': s.color, 'stop-opacity': s.op }));
    });
    defs.appendChild(grad);

    // Glow filter for dots and traveling orb
    var filter = svgEl('filter', { id: 'ms-glow', x: '-120%', y: '-120%', width: '340%', height: '340%' });
    filter.appendChild(svgEl('feGaussianBlur', { stdDeviation: '2.2', result: 'blur' }));
    var merge = svgEl('feMerge');
    merge.appendChild(svgEl('feMergeNode', { in: 'blur' }));
    merge.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
    filter.appendChild(merge);
    defs.appendChild(filter);

    // Radial fade mask so dots & arcs soften toward the edges
    var fadeGrad = svgEl('radialGradient', { id: 'ms-fade', cx: '50%', cy: '50%', r: '54%' });
    fadeGrad.appendChild(svgEl('stop', { offset: '52%',  'stop-color': 'white', 'stop-opacity': '1' }));
    fadeGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': 'white', 'stop-opacity': '0' }));
    defs.appendChild(fadeGrad);

    var mask = svgEl('mask', { id: 'ms-vignette' });
    mask.appendChild(svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#ms-fade)' }));
    defs.appendChild(mask);

    svg.appendChild(defs);
  }

  /* ── draw countries on offscreen canvas, sample for dots ─────── */
  function buildCountryDots(svg, worldData) {
    // 3× oversample so small countries like Ireland & UK register properly.
    // Ireland spans only ~11×9 SVG units — at 1× that's ~11×9 canvas pixels
    // and sparse sampling misses it entirely. At 3× (2400×1200) Ireland is
    // ~33×27 canvas pixels so every 5-unit SVG step reliably hits land.
    var SCALE  = 3;
    var CW     = W * SCALE;
    var CH     = H * SCALE;
    var canvas = document.createElement('canvas');
    canvas.width  = CW;
    canvas.height = CH;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';

    // topojson is loaded via <script> tag before this file
    var countries = topojson.feature(worldData, worldData.objects.countries);

    countries.features.forEach(function (feat) {
      var geom = feat.geometry;
      if (!geom) return;

      function drawRings(rings) {
        ctx.beginPath();
        rings.forEach(function (ring) {
          var prevX = null;
          ring.forEach(function (coord, i) {
            // coord = [longitude, latitude] — scale up to canvas resolution
            var x = (coord[0] + 180) * (CW / 360);
            var y = (90 - coord[1]) * (CH / 180);

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              // Skip antimeridian crossings (Russia, Fiji, etc.)
              if (prevX !== null && Math.abs(x - prevX) > 300 * SCALE) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            prevX = x;
          });
          ctx.closePath();
        });
        ctx.fill();
      }

      if (geom.type === 'Polygon') {
        drawRings(geom.coordinates);
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach(function (poly) { drawRings(poly); });
      }
    });

    // Sample at SVG dot-grid positions, converting to scaled canvas coordinates
    // Cap at y=333 to match the viewBox which clips Antarctica (below lat −60°)
    var imgData = ctx.getImageData(0, 0, CW, CH).data;
    var g = svgEl('g', { mask: 'url(#ms-vignette)' });

    for (var x = 0; x <= W; x += DOT_SPACING) {
      for (var y = 0; y <= 333; y += DOT_SPACING) {
        var cpx = Math.min(Math.round(x * SCALE), CW - 1);
        var cpy = Math.min(Math.round(y * SCALE), CH - 1);
        var idx = (cpy * CW + cpx) * 4;
        // r channel > 50 → pixel lies within a filled land polygon
        if (imgData[idx] > 50) {
          g.appendChild(svgEl('circle', {
            cx: x, cy: y, r: DOT_R, fill: 'rgba(255,255,255,0.45)',
          }));
        }
      }
    }

    // Insert dot layer immediately after <defs>
    var defs = svg.querySelector('defs');
    svg.insertBefore(g, defs ? defs.nextSibling : svg.firstChild);
  }

  // Used when the network fetch fails
  function fallbackDotGrid(svg) {
    var g = svgEl('g', { mask: 'url(#ms-vignette)' });
    for (var x = 0; x <= W; x += DOT_SPACING) {
      for (var y = 0; y <= H; y += DOT_SPACING) {
        g.appendChild(svgEl('circle', { cx: x, cy: y, r: DOT_R, fill: 'rgba(255,255,255,0.1)' }));
      }
    }
    var defs = svg.querySelector('defs');
    svg.insertBefore(g, defs ? defs.nextSibling : svg.firstChild);
  }

  /* ── city markers (pulsing dot + label) ──────────────────────── */
  function addDot(parent, pt, isOrigin) {
    var color = isOrigin ? ORIG_COLOR : ARC_COLOR;
    var r     = isOrigin ? 3 : 2.5;
    var dur   = isOrigin ? '1.4s' : '2.3s';
    var begin = isOrigin ? '0s' : (Math.random() * 0.9).toFixed(2) + 's';
    var g     = svgEl('g');

    // Pulsing ring
    var pulse = svgEl('circle', { cx: pt.x, cy: pt.y, r: r, fill: color, opacity: '0' });
    function anim(attr, vals) {
      var a = document.createElementNS(NS, 'animate');
      a.setAttribute('attributeName', attr);
      a.setAttribute('values', vals);
      a.setAttribute('dur', dur);
      a.setAttribute('begin', begin);
      a.setAttribute('repeatCount', 'indefinite');
      pulse.appendChild(a);
    }
    anim('r',       r + ';' + (r * 3.8));
    anim('opacity', '0.5;0');
    g.appendChild(pulse);

    // Core dot + inner highlight
    g.appendChild(svgEl('circle', { cx: pt.x, cy: pt.y, r: r,            fill: color,                  filter: 'url(#ms-glow)' }));
    g.appendChild(svgEl('circle', { cx: pt.x, cy: pt.y, r: Math.max(r - 1.8, 1), fill: 'rgba(255,255,255,0.45)' }));
    parent.appendChild(g);
  }

  function addLabel(parent, pt, text, isOrigin) {
    var color = isOrigin ? ORIG_COLOR : '#ffffff';
    var yOff  = pt.y < 28 ? 20 : -14; // flip below dot when near top edge

    // Draw text twice: once as dark outline, once as coloured fill
    [
      { fill: 'none', stroke: 'rgba(0,0,0,0.9)', 'stroke-width': '3.5', 'stroke-linejoin': 'round' },
      { fill: color, stroke: 'none', 'stroke-width': '0' },
    ].forEach(function (extra) {
      var attrs = Object.assign({
        x: pt.x, y: pt.y + yOff,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        'font-family': 'Inter, sans-serif',
        'font-size': '9.5',
        'font-weight': '700',
        'pointer-events': 'none',
      }, extra);
      var t = svgEl('text', attrs);
      t.textContent = text;
      parent.appendChild(t);
    });
  }

  /* ── looping arc animation ───────────────────────────────────── */
  function runCycle(arcLayer, originPt) {
    while (arcLayer.firstChild) arcLayer.removeChild(arcLayer.firstChild);

    DESTS.forEach(function (dest, i) {
      var destPt = project(dest.lat, dest.lng);
      var d      = arcPath(originPt, destPt);

      setTimeout(function () {
        // Arc path — drawn via strokeDashoffset transition
        var path = svgEl('path', {
          d: d, fill: 'none',
          stroke: 'url(#ms-arc-grad)',
          'stroke-width': '1.5',
          opacity: '0.85',
        });
        arcLayer.appendChild(path);

        var len = path.getTotalLength();
        path.style.strokeDasharray  = len;
        path.style.strokeDashoffset = len;

        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            path.style.transition = 'stroke-dashoffset ' + ARC_DUR + 'ms cubic-bezier(0.25,0.1,0.25,1)';
            path.style.strokeDashoffset = '0';
          });
        });

      }, i * STAGGER);
    });

    var cycleDur = DESTS.length * STAGGER + ARC_DUR + LOOP_PAUSE;
    setTimeout(function () { runCycle(arcLayer, originPt); }, cycleDur);
  }

  /* ── entry point ─────────────────────────────────────────────── */
  function init() {
    var svg = document.getElementById('world-map-svg');
    if (!svg) return;

    buildDefs(svg);

    var arcLayer   = svgEl('g', { class: 'ms-arcs'   });
    var pointLayer = svgEl('g', { class: 'ms-points' });
    svg.appendChild(arcLayer);
    svg.appendChild(pointLayer);

    var originPt = project(ORIGIN.lat, ORIGIN.lng);

    function addMarkers() {
      DESTS.forEach(function (d) {
        var pt = project(d.lat, d.lng);
        addDot(pointLayer, pt, false);
        // No labels on destination cities — keeps the map clean
      });
      addDot(pointLayer, originPt, true);
      addLabel(pointLayer, originPt, ORIGIN.label, true);
      // Keep point layer on top
      svg.appendChild(pointLayer);
    }

    // Fetch world atlas TopoJSON, draw land dots, then start animation
    // 50m resolution gives more polygon vertices for small countries (Ireland, UK)
    fetch('https://unpkg.com/world-atlas@2/countries-50m.json')
      .then(function (r) { return r.json(); })
      .then(function (worldData) {
        buildCountryDots(svg, worldData);
        addMarkers();
        runCycle(arcLayer, originPt);
      })
      .catch(function () {
        // Network unavailable — fall back to uniform dot grid
        fallbackDotGrid(svg);
        addMarkers();
        runCycle(arcLayer, originPt);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }
}());
