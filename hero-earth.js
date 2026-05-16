/* ============================================
   Hero Earth — true 3D sphere using Three.js
   Real rotation, no tiling seam, no snap-back.
   Texture: NASA Blue Marble (equirectangular)
   ============================================ */

(function () {
    const canvas = document.getElementById('heroEarthCanvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();

    // Tight FOV so the sphere fills the canvas with a little breathing room
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    camera.position.z = 4.2;

    // Bright directional light — sunlit edge + good overall illumination
    const light = new THREE.DirectionalLight(0xffffff, 2.4);
    light.position.set(-1.2, 0.4, 1);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));

    const geometry = new THREE.SphereGeometry(1, 64, 48);

    // Use a known-good equirectangular Earth texture from the Three.js
    // examples CDN (CORS-enabled, reliable).
    const TEX_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg';

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    let earth;
    loader.load(
        TEX_URL,
        function (texture) {
            if ('colorSpace' in texture && THREE.SRGBColorSpace) {
                texture.colorSpace = THREE.SRGBColorSpace;
            } else if ('encoding' in texture && THREE.sRGBEncoding) {
                texture.encoding = THREE.sRGBEncoding;
            }
            const material = new THREE.MeshStandardMaterial({
                map: texture,
                roughness: 0.85,
                metalness: 0.0,
                emissive: new THREE.Color(0x111419),
                emissiveIntensity: 0.6
            });
            earth = new THREE.Mesh(geometry, material);
            earth.rotation.x = THREE.MathUtils.degToRad(18); // gentle axial tilt
            scene.add(earth);
        },
        undefined,
        function () {
            // Fallback: render a solid neutral sphere if the texture fails
            const fallback = new THREE.MeshStandardMaterial({ color: 0x2a3848 });
            earth = new THREE.Mesh(geometry, fallback);
            scene.add(earth);
        }
    );

    function resize() {
        const rect = canvas.getBoundingClientRect();
        const w = Math.max(1, rect.width);
        const h = Math.max(1, rect.height);
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }

    const ROT_PER_SEC = 0.045; // radians/sec — one full rotation in ~140s

    let lastT = performance.now();
    function tick(now) {
        const dt = (now - lastT) / 1000;
        lastT = now;
        if (earth) {
            earth.rotation.y += ROT_PER_SEC * dt;
        }
        renderer.render(scene, camera);
        requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(tick);
})();
