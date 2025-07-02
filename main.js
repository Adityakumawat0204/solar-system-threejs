import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Initialize Scene 
const world = new THREE.Scene();
world.background = new THREE.Color(0x000000);

const cam = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
cam.position.set(0,0.9, 11);

const view = document.querySelector('canvas');
const draw = new THREE.WebGLRenderer({ canvas: view, antialias: true });
draw.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(draw.domElement);

const nav = new OrbitControls(cam, draw.domElement);
nav.enableDamping = true;

// Textures
const textureLoader = new THREE.TextureLoader();

const pics = {
  Sun: textureLoader.load(new URL('./textures/sun.jpg', import.meta.url)),
  Mercury: textureLoader.load(new URL('./textures/mercury.jpg', import.meta.url)),
  Venus: textureLoader.load(new URL('./textures/venus.jpg', import.meta.url)),
  Earth: textureLoader.load(new URL('./textures/earth.jpg', import.meta.url)),
  Mars: textureLoader.load(new URL('./textures/mars.jpg', import.meta.url)),
  Jupiter: textureLoader.load(new URL('./textures/jupiter.jpg', import.meta.url)),
  Saturn: textureLoader.load(new URL('./textures/saturn.jpg', import.meta.url)),
  Uranus: textureLoader.load(new URL('./textures/uranus.jpg', import.meta.url)),
  Neptune: textureLoader.load(new URL('./textures/neptune.jpg', import.meta.url)),
  SaturnRing: textureLoader.load(new URL('./textures/saturn_ring.jpg', import.meta.url)),
};

// Planet Data
const spaceData = [
  { name: 'Mercury', size: 0.2, orbitRadius: 2, speed: 0.014 },
  { name: 'Venus', size: 0.3, orbitRadius: 3, speed: 0.023 },
  { name: 'Earth', size: 0.35, orbitRadius: 4, speed: 0.07 },
  { name: 'Mars', size: 0.25, orbitRadius: 5, speed: 0.05 },
  { name: 'Jupiter', size: 0.8, orbitRadius: 6.5, speed: 0.025 },
  { name: 'Saturn', size: 0.7, orbitRadius: 9, speed: 0.0112 },
  { name: 'Uranus', size: 0.5, orbitRadius: 11.3, speed: 0.059 },
  { name: 'Neptune', size: 0.5, orbitRadius: 13, speed: 0.07 }
];

// Sun
const star = new THREE.Mesh(
  new THREE.SphereGeometry(1, 100, 100),
  new THREE.MeshBasicMaterial({ map: pics.Sun })
);
star.position.set(-2.5, 0, 0);
world.add(star);

const glow = new THREE.PointLight(0xffffff, 50, 150);
glow.position.copy(star.position);
world.add(glow);

// Stars
function sprinkleStars() {
  const geo = new THREE.BufferGeometry();
  const count = 10000;
  const points = [];
  for (let i = 0; i < count; i++) {
    points.push((Math.random() - 0.7) * 250);
    points.push((Math.random() - 0.7) * 250);
    points.push((Math.random() - 0.7) * 200);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const look = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3 });
  const dots = new THREE.Points(geo, look);
  world.add(dots);
}
sprinkleStars();

// Planets & Orbits
const globes = [];
spaceData.forEach(info => {
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(info.size, 100, 100),
    new THREE.MeshStandardMaterial({ map: pics[info.name] })
  );
  planet.name = info.name;
  world.add(planet);

  // orbit ellipse
  const oval = new THREE.EllipseCurve(-2, 0, info.orbitRadius, info.orbitRadius * 0.7, 0, 2 * Math.PI);
  const path = oval.getPoints(1000).map(p => new THREE.Vector3(p.x, 0, p.y));
  const track = new THREE.BufferGeometry().setFromPoints(path);
  const line = new THREE.LineLoop(track, new THREE.LineBasicMaterial({ color: 0x888888 }));
  world.add(line);

  // Saturn ring
  if (info.name === 'Saturn') {
    const loop = new THREE.Mesh(
      new THREE.RingGeometry(info.size * 1.2, info.size * 2, 64),
      new THREE.MeshBasicMaterial({
        map: pics.SaturnRing,
        side: THREE.DoubleSide,
        transparent: true
      })
    );
    loop.rotation.x = Math.PI / 2;
    planet.add(loop);
  }

  // Add random initial angle so planets start at different orbit positions
  globes.push({ ...info, mesh: planet, initialAngle: Math.random() * 2 * Math.PI });
});

// UI Controls 
const box = document.createElement('div');
Object.assign(box.style, {
  position: 'fixed', top: '10px', left: '10px', padding: '10px', borderRadius: '10px',
  background: 'rgba(0,0,0,0.7)', color: '#fff', fontFamily: 'monospace',
  zIndex: 1, display: 'grid', gap: '6px 10px', gridTemplateColumns: 'auto 1fr', width: '260px'
});

globes.forEach((planet, idx) => {
  const tag = document.createElement('label');
  tag.innerText = planet.name;

  const bar = document.createElement('input');
  bar.type = 'range';
  bar.min = 0.001;
  bar.max = 0.1;
  bar.step = 0.001;
  bar.value = planet.speed;
  bar.oninput = e => globes[idx].speed = parseFloat(e.target.value);
  bar.style.width = '100%';

  box.appendChild(tag);
  box.appendChild(bar);
});

const pauseIt = document.createElement('button');
pauseIt.textContent = 'Pause';
pauseIt.style.gridColumn = 'span 2';
box.appendChild(pauseIt);

const switchMode = document.createElement('button');
switchMode.textContent = 'Toggle Theme';
switchMode.style.gridColumn = 'span 2';
box.appendChild(switchMode);

document.body.appendChild(box);

// Interactions 
let stop = false;
pauseIt.onclick = () => {
  stop = !stop;
  pauseIt.textContent = stop ? 'Resume' : 'Pause';
};

let night = true;
switchMode.onclick = () => {
  night = !night;
  world.background = new THREE.Color(night ? 0x000000 : 0xffffff);
};

// Tooltip 
const hint = document.createElement('div');
Object.assign(hint.style, {
  position: 'absolute', background: '#000', color: '#fff', padding: '4px 8px',
  borderRadius: '4px', pointerEvents: 'none', display: 'none', zIndex: 2
});
document.body.appendChild(hint);

const check = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let posX = 0, posY = 0;

view.addEventListener('mousemove', e => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  posX = e.clientX;
  posY = e.clientY;
});

// Animation Loop 
const ticker = new THREE.Clock();
function loop() {
  requestAnimationFrame(loop);
  if (!stop) {
    const time = ticker.getElapsedTime();
    globes.forEach(planet => {
      const move = time * planet.speed + planet.initialAngle;  // Use initialAngle offset here
      const a = planet.orbitRadius;
      const b = a * 0.7;
      const x = -2 + a * Math.cos(move);
      const z = b * Math.sin(move);
      planet.mesh.position.set(x, 0, z);
      planet.mesh.rotation.y += 0.01;
    });
  }

  check.setFromCamera(pointer, cam);
  const found = check.intersectObjects(globes.map(p => p.mesh));
  if (found.length > 0) {
    hint.style.display = 'block';
    hint.style.left = `${posX + 10}px`;
    hint.style.top = `${posY + 10}px`;
    hint.textContent = found[0].object.name;
  } else {
    hint.style.display = 'none';
  }

  nav.update();
  draw.render(world, cam);
}
loop();

window.addEventListener('resize', () => {
  cam.aspect = window.innerWidth / window.innerHeight;
  cam.updateProjectionMatrix();
  draw.setSize(window.innerWidth, window.innerHeight);
});
