const dot = document.getElementById("cursorDot");
const ring = document.getElementById("cursorRing");
let mx = 0,
  my = 0,
  dx = 0,
  dy = 0;

document.addEventListener("mousemove", (e) => {
  mx = e.clientX;
  my = e.clientY;
  dot.style.left = mx - 4 + "px";
  dot.style.top = my - 4 + "px";
});

function animateCursor() {
  dx += (mx - dx) * 0.15;
  dy += (my - dy) * 0.15;
  ring.style.left = dx - 18 + "px";
  ring.style.top = dy - 18 + "px";
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll("[data-hover]").forEach((el) => {
  el.addEventListener("mouseenter", () => ring.classList.add("hover"));
  el.addEventListener("mouseleave", () => ring.classList.remove("hover"));
});

// Hide custom cursor on touch
if ("ontouchstart" in window) {
  dot.style.display = "none";
  ring.style.display = "none";
}

// ——— NAV SCROLL ———
window.addEventListener("scroll", () => {
  document
    .getElementById("nav")
    .classList.toggle("scrolled", window.scrollY > 60);
});

// ——— SCROLL INDICATOR ———
const scrollIndicator = document.querySelector(".scroll-indicator");
if (scrollIndicator) {
  scrollIndicator.addEventListener("click", () => {
    document.querySelector("#about").scrollIntoView({ behavior: "smooth" });
  });
}

const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
if (navToggle && navMenu) {
  const closeNav = () => {
    navToggle.classList.remove("open");
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    const isOpen = navMenu.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.querySelectorAll("#navMenu a").forEach((link) => {
    link.addEventListener("click", () => {
      closeNav();
    });
  });

  document.addEventListener("click", (event) => {
    if (navMenu.classList.contains("open") && !navMenu.contains(event.target) && event.target !== navToggle) {
      closeNav();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 920) {
      closeNav();
    }
  });
}

// ——— REVEAL ———
const reveals = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add("visible"), i * 80);
        observer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.15 },
);
reveals.forEach((r) => observer.observe(r));

// ——— HELPERS ———
function makeRenderer(canvas, bg = 0xf5f3f0) {
  if (!(canvas instanceof HTMLCanvasElement)) return null;
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  r.setClearColor(bg, 0);
  return r;
}

function makeCamera(fov = 45) {
  return new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
}

function addLights(scene) {
  const amb = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(amb);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(5, 8, 5);
  dir.castShadow = true;
  dir.shadow.mapSize.set(512, 512);
  dir.shadow.radius = 4;
  scene.add(dir);
  const p = new THREE.PointLight(0xc4553a, 0.3, 20);
  p.position.set(-3, 2, 3);
  scene.add(p);
}

function resizeRenderer(renderer, canvas, camera) {
  const w = canvas.clientWidth,
    h = canvas.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

// ——— HERO: Floating Shield / Lock ———
(function () {
  const canvas = document.getElementById("heroCanvas");
  const renderer = makeRenderer(canvas);
  if (!renderer) return;
  const scene = new THREE.Scene();
  const camera = makeCamera(40);
  camera.position.set(0, 0, 5);

  addLights(scene);

  // Shield body
  const shieldShape = new THREE.Shape();
  shieldShape.moveTo(0, 1.2);
  shieldShape.quadraticCurveTo(1.1, 0.9, 1, 0);
  shieldShape.quadraticCurveTo(0.9, -0.9, 0, -1.3);
  shieldShape.quadraticCurveTo(-0.9, -0.9, -1, 0);
  shieldShape.quadraticCurveTo(-1.1, 0.9, 0, 1.2);

  const extrudeSettings = {
    depth: 0.3,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 8,
  };
  const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
  shieldGeo.center();
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0xe8e5e0,
    roughness: 0.3,
    metalness: 0.1,
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.castShadow = true;
  scene.add(shield);

  // Lock icon on shield
  const lockBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.35, 0.15, 4, 4, 4),
    new THREE.MeshStandardMaterial({
      color: 0xc4553a,
      roughness: 0.4,
      metalness: 0.2,
    }),
  );
  lockBody.position.set(0, -0.12, 0.25);
  shield.add(lockBody);

  const lockArc = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.035, 16, 32, Math.PI),
    new THREE.MeshStandardMaterial({
      color: 0xc4553a,
      roughness: 0.4,
      metalness: 0.2,
    }),
  );
  lockArc.position.set(0, 0.06, 0.25);
  shield.add(lockArc);

  // Floating particles
  const particlesGeo = new THREE.BufferGeometry();
  const pCount = 60;
  const pPositions = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 6;
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * 6;
    pPositions[i * 3 + 2] = (Math.random() - 0.5) * 4;
  }
  particlesGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(pPositions, 3),
  );
  const particlesMat = new THREE.PointsMaterial({
    color: 0xc4553a,
    size: 0.03,
    transparent: true,
    opacity: 0.5,
  });
  scene.add(new THREE.Points(particlesGeo, particlesMat));

  let hmx = 0,
    hmy = 0;
  document.addEventListener("mousemove", (e) => {
    hmx = (e.clientX / window.innerWidth - 0.5) * 2;
    hmy = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function animate(t) {
    requestAnimationFrame(animate);
    resizeRenderer(renderer, canvas, camera);
    const s = t * 0.001;
    shield.rotation.y = Math.sin(s * 0.5) * 0.3 + hmx * 0.3;
    shield.rotation.x = Math.sin(s * 0.3) * 0.15 + hmy * 0.2;
    shield.position.y = Math.sin(s * 0.7) * 0.15;
    renderer.render(scene, camera);
  }
  animate(0);
})();

// ——— PROJECT 1: Rotating wireframe sphere (threat detection) ———
(function () {
  const canvas = document.getElementById("proj1Canvas");
  const renderer = makeRenderer(canvas, 0xeae8e4);
  if (!renderer) return;
  const scene = new THREE.Scene();
  const camera = makeCamera(40);
  camera.position.set(0, 0, 4);

  addLights(scene);

  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.1, 1),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    }),
  );
  scene.add(wire);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xc4553a,
      roughness: 0.2,
      metalness: 0.3,
    }),
  );
  core.castShadow = true;
  scene.add(core);

  // Orbit dots
  for (let i = 0; i < 8; i++) {
    const d = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a }),
    );
    const angle = (i / 8) * Math.PI * 2;
    d.position.set(Math.cos(angle) * 1.1, Math.sin(angle) * 1.1, 0);
    wire.add(d);
  }

  function animate(t) {
    requestAnimationFrame(animate);
    resizeRenderer(renderer, canvas, camera);
    const s = t * 0.001;
    wire.rotation.x = s * 0.3;
    wire.rotation.y = s * 0.5;
    core.rotation.y = s * 0.2;
    renderer.render(scene, camera);
  }
  animate(0);
})();

function initSentinelShield(canvas, variant = 1, bg = 0xeae8e4) {
  const renderer = makeRenderer(canvas, bg);
  if (!renderer) return;
  const scene = new THREE.Scene();
  const camera = makeCamera(40);
  camera.position.set(0, 0, 4);

  addLights(scene);

  // Variant-specific colors
  const variantConfigs = {
    1: { wireColor: 0x2a2a2a, coreColor: 0xc4553a, dotColor: 0x2a2a2a, wireOpacity: 0.3, speedMult: 1 },
    2: { wireColor: 0xc4553a, coreColor: 0x2a2a2a, dotColor: 0xc4553a, wireOpacity: 0.25, speedMult: 0.8 },
    3: { wireColor: 0xe8e5e0, coreColor: 0xc4553a, dotColor: 0xbab5af, wireOpacity: 0.4, speedMult: 1.2 },
    4: { wireColor: 0x2a2a2a, coreColor: 0xbab5af, dotColor: 0xc4553a, wireOpacity: 0.35, speedMult: 0.9 },
  };

  const config = variantConfigs[variant] || variantConfigs[1];

  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.1, 1),
    new THREE.MeshStandardMaterial({
      color: config.wireColor,
      wireframe: true,
      transparent: true,
      opacity: config.wireOpacity,
    }),
  );
  scene.add(wire);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 32, 32),
    new THREE.MeshStandardMaterial({
      color: config.coreColor,
      roughness: 0.2,
      metalness: 0.3,
    }),
  );
  core.castShadow = true;
  scene.add(core);

  for (let i = 0; i < 8; i++) {
    const d = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 12, 12),
      new THREE.MeshStandardMaterial({ color: config.dotColor }),
    );
    const angle = (i / 8) * Math.PI * 2;
    d.position.set(Math.cos(angle) * 1.1, Math.sin(angle) * 1.1, 0);
    wire.add(d);
  }

  function animate(t) {
    requestAnimationFrame(animate);
    resizeRenderer(renderer, canvas, camera);
    const s = t * 0.001;
    wire.rotation.x = s * 0.3 * config.speedMult;
    wire.rotation.y = s * 0.5 * config.speedMult;
    core.rotation.y = s * 0.2 * config.speedMult;
    renderer.render(scene, camera);
  }
  animate(0);
}

initSentinelShield(document.getElementById("proj1Canvas"), 1);
initSentinelShield(document.getElementById("proj2Canvas"), 2);
initSentinelShield(document.getElementById("proj3Canvas"), 3);
initSentinelShield(document.getElementById("proj4Canvas"), 4);

// ——— SKILLS: Orbiting Spheres ———
(function () {
  const canvas = document.getElementById("skillsCanvas");
  const renderer = makeRenderer(canvas);
  if (!renderer) return;
  const scene = new THREE.Scene();
  const camera = makeCamera(45);
  camera.position.set(0, 0, 5.5);

  addLights(scene);

  const center = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.6, 0),
    new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.3,
      metalness: 0.2,
    }),
  );
  center.castShadow = true;
  scene.add(center);

  const orbs = [];
  const orbitColors = [
    0xc4553a, 0xe8e5e0, 0xbab5af, 0xc4553a, 0xd4d0cb, 0xe8e5e0, 0xc4553a,
    0xbab5af,
  ];
  for (let i = 0; i < 8; i++) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 16, 16),
      new THREE.MeshStandardMaterial({
        color: orbitColors[i],
        roughness: 0.3,
        metalness: 0.15,
      }),
    );
    orb.castShadow = true;
    orb.userData = {
      radius: 1.5 + (i % 3) * 0.5,
      speed: 0.4 + i * 0.08,
      offset: (i / 8) * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 1.2,
    };
    scene.add(orb);
    orbs.push(orb);
  }

  // Orbit rings
  for (let r = 0; r < 3; r++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.5 + r * 0.5, 0.008, 8, 80),
      new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        transparent: true,
        opacity: 0.08,
      }),
    );
    ring.rotation.x = Math.PI / 2 + (r - 1) * 0.3;
    scene.add(ring);
  }

  function animate(t) {
    requestAnimationFrame(animate);
    resizeRenderer(renderer, canvas, camera);
    const s = t * 0.001;
    center.rotation.y = s * 0.3;
    center.rotation.x = Math.sin(s * 0.2) * 0.2;

    orbs.forEach((o) => {
      const a = s * o.userData.speed + o.userData.offset;
      o.position.x = Math.cos(a) * o.userData.radius;
      o.position.z = Math.sin(a) * o.userData.radius * 0.5;
      o.position.y = Math.sin(a + o.userData.tilt) * o.userData.radius * 0.4;
    });

    renderer.render(scene, camera);
  }
  animate(0);
})();

// ——— ABOUT: DNA / Helix ———
(function () {
  const canvas = document.getElementById("aboutCanvas");
  const renderer = makeRenderer(canvas);
  if (!renderer) return;
  const scene = new THREE.Scene();
  const camera = makeCamera(40);
  camera.position.set(0, 0, 6);

  addLights(scene);

  const helix = new THREE.Group();
  scene.add(helix);

  const sphereMat1 = new THREE.MeshStandardMaterial({
    color: 0xc4553a,
    roughness: 0.3,
    metalness: 0.2,
  });
  const sphereMat2 = new THREE.MeshStandardMaterial({
    color: 0xe8e5e0,
    roughness: 0.3,
    metalness: 0.1,
  });
  const lineMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    transparent: true,
    opacity: 0.15,
  });

  for (let i = 0; i < 24; i++) {
    const t = (i / 24) * Math.PI * 4;
    const y = (i - 12) * 0.2;

    const s1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      sphereMat1,
    );
    s1.position.set(Math.cos(t) * 0.8, y, Math.sin(t) * 0.8);
    s1.castShadow = true;
    helix.add(s1);

    const s2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      sphereMat2,
    );
    s2.position.set(
      Math.cos(t + Math.PI) * 0.8,
      y,
      Math.sin(t + Math.PI) * 0.8,
    );
    s2.castShadow = true;
    helix.add(s2);

    // Connecting bar
    if (i % 2 === 0) {
      const bar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 1.6, 8),
        lineMat,
      );
      bar.position.set(0, y, 0);
      bar.rotation.z = Math.PI / 2;
      bar.rotation.y = t;
      helix.add(bar);
    }
  }

  function animate(t) {
    requestAnimationFrame(animate);
    resizeRenderer(renderer, canvas, camera);
    helix.rotation.y = t * 0.0003;
    helix.position.y = Math.sin(t * 0.0005) * 0.2;
    renderer.render(scene, camera);
  }
  animate(0);
})();

// ——— SMOOTH SCROLL ———
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute("href"));
    if (target) target.scrollIntoView({ behavior: "smooth" });
  });
});
