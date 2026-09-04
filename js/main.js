import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from '../lib/CSS2DRenderer.js';
import { SUN, PLANETS, PLUTO, DWARF_PLANETS, BELTS, QUIZ, VOYAGER1, VOYAGER2, MOONS } from './data.js';

/* ============================ DOM ============================ */
const container = document.getElementById('scene-container');
const infoPanel = document.getElementById('info-panel');
const panelContent = document.getElementById('panel-content');
const panelClose = document.getElementById('panel-close');
const chipBar = document.getElementById('chip-bar');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const pauseBtn = document.getElementById('pause-btn');
const orbitsBtn = document.getElementById('orbits-btn');
const labelsBtn = document.getElementById('labels-btn');
const pixelBtn = document.getElementById('pixel-btn');
const resetBtn = document.getElementById('reset-btn');
const loadingEl = document.getElementById('loading');
const tooltip = document.getElementById('tooltip');
const quizBtn = document.getElementById('quiz-btn');
const quizModal = document.getElementById('quiz-modal');
const quizBackdrop = document.getElementById('quiz-backdrop');
const quizClose = document.getElementById('quiz-close');
const quizBody = document.getElementById('quiz-body');
const quizSubmit = document.getElementById('quiz-submit');
const quizScore = document.getElementById('quiz-score');
const langBtn = document.getElementById('lang-btn');
const appTitle = document.getElementById('app-title');
const appSubtitle = document.getElementById('app-subtitle');
const speedLabel = document.getElementById('speed-label');
const hintEl = document.getElementById('hint');
const loadingText = document.getElementById('loading-text');
const quizTitle = document.getElementById('quiz-title');
const quizSub = document.getElementById('quiz-sub');
const spacecraftBar = document.getElementById('spacecraft-bar');

/* ============================ 多语言 ============================ */
let lang = 'zh';

const UI = {
  zh: {
    title: 'Nathan 的宇宙', subtitle: '动态交互 3D 探索',
    speed: '速度', orbits: '轨道', labels: '标签', pixel: '像素', reset: '重置', quiz: '测验', lang: 'EN',
    hint: '🖱 拖动旋转 · 滚轮缩放 · 点击星球查看详情',
    loading: '正在构建 Nathan 的宇宙…',
    loadFail: '加载失败：',
    noWebGL: '当前环境不支持 WebGL。请换用支持硬件加速的浏览器（Chrome / Edge / Firefox / Safari）打开本页面。',
    webglFail: '无法创建 WebGL 渲染器：',
    factAge: '年龄', factDiameter: '直径', factSatellites: '卫星数量', factType: '类型',
    factRotation: '自转周期', factRevolution: '公转周期', factGravity: '重力（地球 = 1）',
    factState: '气态 / 岩石', factComposition: '主要元素成分',
    stateRock: '岩石', stateGas: '气态', statePlasma: '等离子态', stateRockIce: '岩石 + 冰',
    beltTag: '环带', sectionIntro: '介绍', sectionCount: '天体数量', sectionMain: '主要天体',
    spacecraftTag: '探测器', factCountry: '国别', factMass: '重量', factSize: '尺寸',
    factLaunch: '发射时间', factStatus: '当前状态', factPower: '能源',
    missionGoals: '任务目标', missionTimeline: '飞行时间线',
    quizTitle: '🪐 太阳系小测验',
    quizSub: '从题库随机抽取 5 题 · 选项顺序随机 · 答对有鼓励评价',
    quizSubmit: '提交答案', quizRetry: '重新作答',
    score: (n, t) => `得分：${n} / ${t}`,
  },
  en: {
    title: "Nathan's Universe", subtitle: 'Interactive 3D Explorer',
    speed: 'Speed', orbits: 'Orbits', labels: 'Labels', pixel: 'Pixel', reset: 'Reset', quiz: 'Quiz', lang: '中文',
    hint: '🖱 Drag to rotate · Scroll to zoom · Click a planet for details',
    loading: "Building Nathan's Universe…",
    loadFail: 'Load failed: ',
    noWebGL: 'WebGL is not supported here. Please open this page in a browser with hardware acceleration (Chrome / Edge / Firefox / Safari).',
    webglFail: 'Failed to create WebGL renderer: ',
    factAge: 'Age', factDiameter: 'Diameter', factSatellites: 'Moons', factType: 'Type',
    factRotation: 'Rotation period', factRevolution: 'Orbital period', factGravity: 'Gravity (Earth = 1)',
    factState: 'Gas / Rocky', factComposition: 'Main elements',
    stateRock: 'Rocky', stateGas: 'Gas', statePlasma: 'Plasma', stateRockIce: 'Rocky + icy',
    beltTag: 'Belt', sectionIntro: 'Introduction', sectionCount: 'Number of objects', sectionMain: 'Major objects',
    spacecraftTag: 'Spacecraft', factCountry: 'Country', factMass: 'Mass', factSize: 'Size',
    factLaunch: 'Launch date', factStatus: 'Status', factPower: 'Power',
    missionGoals: 'Mission goals', missionTimeline: 'Mission timeline',
    quizTitle: '🪐 Solar System Quiz',
    quizSub: '5 random questions · shuffled options · praise for correct answers',
    quizSubmit: 'Submit', quizRetry: 'Try again',
    score: (n, t) => `Score: ${n} / ${t}`,
  },
};

function L(zh, en) {
  return (lang === 'en' && en !== undefined && en !== null && en !== '') ? en : zh;
}
function T(key) { return UI[lang][key]; }

/* ===== 错误提示：任何加载/运行错误都会显示在遮罩上，避免卡死无反馈 ===== */
let fatal = false;
function showFatal(msg) {
  fatal = true;
  loadingEl.classList.remove('hidden');
  const spin = loadingEl.querySelector('.loading-spinner');
  const text = loadingEl.querySelector('.loading-text');
  if (spin) spin.style.display = 'none';
  if (text) { text.textContent = T('loadFail') + msg; text.style.color = '#ff8a8a'; }
}
window.addEventListener('error', (e) => showFatal(e.message || String(e.error || '未知错误')));
window.addEventListener('unhandledrejection', (e) => showFatal(String((e.reason && e.reason.message) || e.reason || '未知错误')));

const bodies = [SUN, ...PLANETS, PLUTO, ...DWARF_PLANETS];
const spacecraftList = [VOYAGER1, VOYAGER2];

/* ============================ Scene ============================ */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070f);

const camera = new THREE.PerspectiveCamera(
  50, window.innerWidth / window.innerHeight, 0.1, 4000
);
const HOME_POS = new THREE.Vector3(0, 92, 160);
camera.position.copy(HOME_POS);

function webglSupported() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch (e) { return false; }
}
if (!webglSupported()) {
  showFatal(T('noWebGL'));
  throw new Error('WebGL is not supported in this environment');
}
const renderer = (() => {
  try { return new THREE.WebGLRenderer({ antialias: true }); }
  catch (err) {
    showFatal(T('webglFail') + (err && err.message ? err.message : err));
    throw err;
  }
})();
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
container.appendChild(labelRenderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.2;
controls.maxDistance = 600;
controls.target.set(0, 0, 0);
controls.update();

/* ============================ Lights ============================ */
const sunLight = new THREE.PointLight(0xfff2d6, 3.0, 0, 0);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x26364d, 1.6));

/* ============================ Helpers ============================ */
const textureLoader = new THREE.TextureLoader();
function loadTexture(url) {
  const t = textureLoader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// 通用程序化纹理（用于无贴图的矮行星，按主题色生成斑驳质感）
function makeProceduralTexture(hex) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  const base = new THREE.Color(hex);
  const light = base.clone().lerp(new THREE.Color(0xffffff), 0.25);
  const dark = base.clone().lerp(new THREE.Color(0x000000), 0.25);
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, '#' + light.getHexString());
  grad.addColorStop(0.5, '#' + base.getHexString());
  grad.addColorStop(1, '#' + dark.getHexString());
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 128;
    const r = Math.random() * 8 + 1;
    const a = Math.random() * 0.2;
    ctx.fillStyle = Math.random() < 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// 太阳光晕纹理
function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,240,190,1)');
  g.addColorStop(0.2, 'rgba(255,195,90,0.85)');
  g.addColorStop(0.5, 'rgba(255,140,40,0.32)');
  g.addColorStop(1, 'rgba(255,120,30,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

// 选中高亮圆环纹理
function makeRingTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.strokeStyle = 'rgba(120,200,255,0.95)';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(64, 64, 50, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,200,255,0.35)';
  ctx.lineWidth = 14;
  ctx.beginPath(); ctx.arc(64, 64, 58, 0, Math.PI * 2); ctx.stroke();
  return new THREE.CanvasTexture(c);
}

/* ============================ 星空背景 ============================ */
function createStars() {
  const count = 4000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const col = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const r = 600 + Math.random() * 900;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    if (Math.random() < 0.12) col.setHSL(0.1, 0.65, 0.82);
    else col.setHSL(0.58 + Math.random() * 0.14, 0.35, 0.62 + Math.random() * 0.38);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.5, sizeAttenuation: true, vertexColors: true,
    transparent: true, opacity: 0.9, depthWrite: false,
  });
  scene.add(new THREE.Points(geo, mat));
}

/* ============================ 轨道线 ============================ */
const orbitsGroup = new THREE.Group();
scene.add(orbitsGroup);

function createOrbitLine(radius, color = 0x7f93a8, opacity = 0.2) {
  const pts = [];
  for (let i = 0; i <= 180; i++) {
    const a = (i / 180) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  const line = new THREE.Line(geo, mat);
  orbitsGroup.add(line);
  return line;
}

/* ============================ 标签 ============================ */
const labelEls = [];
function createLabel(data, isBelt = false) {
  const el = document.createElement('div');
  el.className = 'planet-label';
  el.textContent = L(data.name, data.en);
  el.__data = data;
  if (data.kind === 'star') el.classList.add('is-major');
  if (isBelt) el.style.opacity = '0.75';
  const obj = new CSS2DObject(el);
  labelEls.push(el);
  return obj;
}

/* ============================ 太阳 ============================ */
const sunGroup = new THREE.Object3D();
scene.add(sunGroup);
const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(SUN.radius, 64, 64),
  new THREE.MeshBasicMaterial({ map: loadTexture(SUN.texture) })
);
sunGroup.add(sunMesh);
const glow = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: makeGlowTexture(),
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  })
);
glow.scale.set(SUN.radius * 5.2, SUN.radius * 5.2, 1);
sunGroup.add(glow);

const sunLabel = createLabel(SUN);
sunLabel.position.set(0, SUN.radius + 1.6, 0);
sunGroup.add(sunLabel);

/* ============================ 行星 ============================ */
const runtimeMap = new Map();
const planetRuntimes = [];
const clickable = [];

sunMesh.userData.rt = { data: SUN, anchor: sunGroup, mesh: sunMesh };
runtimeMap.set('sun', sunMesh.userData.rt);
clickable.push(sunMesh);

function createSaturnRing(planetRadius) {
  const inner = planetRadius * 1.35;
  const outer = planetRadius * 2.6;
  const geo = new THREE.RingGeometry(inner, outer, 160, 1);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const d = (v.length() - inner) / (outer - inner);
    uv.setXY(i, d, 0.5);
  }
  const mat = new THREE.MeshBasicMaterial({
    map: loadTexture('assets/textures/saturn_ring_alpha.png'),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.96,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = -Math.PI / 2 + 0.16;
  return ring;
}

function createPlanet(data) {
  const pivot = new THREE.Object3D();
  const anchor = new THREE.Object3D();
  pivot.add(anchor);
  anchor.position.x = data.orbitRadius;
  scene.add(pivot);

  const material = data.texture
    ? new THREE.MeshStandardMaterial({ map: loadTexture(data.texture), roughness: 0.85, metalness: 0.04 })
    : new THREE.MeshStandardMaterial({ map: makeProceduralTexture(data.color), roughness: 0.9, metalness: 0 });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.radius, 48, 48), material);
  if (data.tilt) mesh.rotation.z = data.tilt;
  anchor.add(mesh);

  const rt = {
    data,
    pivot,
    anchor,
    mesh,
    orbitAngularSpeed: (Math.PI * 2) / data.orbitPeriod,
  };

  if (data.ring) {
    const ring = createSaturnRing(data.radius);
    mesh.add(ring);
  }

  createOrbitLine(data.orbitRadius, data.id === 'pluto' ? 0x9fb8d0 : 0x8899aa, data.id === 'pluto' ? 0.16 : 0.2);

  const label = createLabel(data);
  label.position.set(0, data.radius + 0.9, 0);
  anchor.add(label);

  mesh.userData.rt = rt;
  runtimeMap.set(data.id, rt);
  planetRuntimes.push(rt);
  clickable.push(mesh);
  return rt;
}

PLANETS.forEach(createPlanet);
createPlanet(PLUTO);
DWARF_PLANETS.forEach(createPlanet);

/* ============================ 星带 ============================ */
const beltRuntimes = [];

function createBelt(belt) {
  const count = belt.particleCount;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = belt.innerRadius + (belt.outerRadius - belt.innerRadius) * Math.sqrt(Math.random());
    const y = (Math.random() - 0.5) * belt.thickness;
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(angle) * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: new THREE.Color(belt.color),
    size: 0.16,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  points.rotation.x = belt.id === 'kuiperBelt' ? 0.05 : 0.02;
  scene.add(points);

  createOrbitLine(belt.innerRadius, belt.color, 0.14);
  createOrbitLine(belt.outerRadius, belt.color, 0.14);

  const label = createLabel(belt, true);
  label.position.set(belt.outerRadius + 2.5, 0, 0);
  scene.add(label);

  const rt = { data: belt, points, rotationSpeed: belt.rotationSpeed };
  beltRuntimes.push(rt);
  runtimeMap.set(belt.id, rt);
  return rt;
}

BELTS.forEach(createBelt);

/* ============================ 飞行器 ============================ */
const LOOP_SECONDS = 36;
const spacecraftRuntimes = [];

function yearAt(sc, t) {
  const tl = sc.data.timeline;
  const segCount = tl.length - 1;
  const f = Math.max(0, Math.min(t, 1)) * segCount;
  const i = Math.min(Math.floor(f), segCount - 1);
  const frac = f - i;
  return tl[i].year + (tl[i + 1].year - tl[i].year) * frac;
}

function createVoyagerModel() {
  const g = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.3 });
  const gray = new THREE.MeshStandardMaterial({ color: 0x9aa4ad, metalness: 0.5, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x3a3f44, metalness: 0.3, roughness: 0.7 });

  const dish = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.32, 40, 1, true), gold);
  dish.rotation.x = Math.PI / 2;
  g.add(dish);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 12, 40), gold);
  rim.rotation.x = Math.PI / 2;
  g.add(rim);

  const feed = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), dark);
  feed.position.set(0, 0, -0.36);
  g.add(feed);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.42, 6), gray);
    leg.position.set(Math.cos(a) * 0.35, Math.sin(a) * 0.35, -0.18);
    leg.rotation.x = Math.PI / 2 - 0.5;
    g.add(leg);
  }

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 10), gray);
  body.position.set(0, 0, 0.1);
  g.add(body);

  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 6), gray);
  boom.rotation.z = Math.PI / 2;
  boom.position.x = 1.1;
  g.add(boom);
  const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), dark);
  sensor.position.x = 2.2;
  g.add(sensor);

  const rtgArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.3, 6), gray);
  rtgArm.rotation.z = Math.PI / 2;
  rtgArm.position.x = -0.65;
  g.add(rtgArm);
  for (let i = -1; i <= 1; i++) {
    const rtg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8), dark);
    rtg.position.set(-1.3, i * 0.16, 0);
    g.add(rtg);
  }

  g.scale.setScalar(0.55);
  return g;
}

function createSpacecraft(data) {
  const anchor = new THREE.Group();
  anchor.visible = false; // 默认隐藏，选中后才显示
  scene.add(anchor);

  const model = createVoyagerModel();
  anchor.add(model);

  const points = data.timeline.map((p) => new THREE.Vector3(p.x, p.y, p.z));
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(curve.getPoints(256)),
    new THREE.LineBasicMaterial({ color: new THREE.Color(data.color), transparent: true, opacity: 0.45, depthWrite: false })
  );
  line.visible = false;
  scene.add(line);

  const markers = [];
  data.timeline.forEach((tp) => {
    const el = document.createElement('div');
    el.className = 'trajectory-marker';
    el.textContent = L(tp.date, tp.date_en);
    const marker = new CSS2DObject(el);
    marker.position.set(tp.x, tp.y + 1.2, tp.z);
    marker.visible = false;
    scene.add(marker);
    markers.push({ el, tp, obj: marker });
  });

  const nameEl = document.createElement('div');
  nameEl.className = 'planet-label spacecraft-name';
  nameEl.textContent = L(data.name, data.en);
  nameEl.__data = data;
  const nameLabel = new CSS2DObject(nameEl);
  nameLabel.position.set(0, 1.6, 0);
  nameLabel.visible = false;
  anchor.add(nameLabel);

  const dateEl = document.createElement('div');
  dateEl.className = 'spacecraft-date';
  const dateLabel = new CSS2DObject(dateEl);
  dateLabel.position.set(0, -1.5, 0);
  dateLabel.visible = false;
  anchor.add(dateLabel);

  const rt = {
    data, anchor, model, curve, line, markers,
    nameEl, dateEl, nameLabel, dateLabel,
    visible: false, t: 0,
  };
  model.traverse((o) => { if (o.isMesh) { o.userData.rt = rt; clickable.push(o); } });

  runtimeMap.set(data.id, rt);
  spacecraftRuntimes.push(rt);
  return rt;
}

function setSpacecraftVisible(rt, show) {
  rt.visible = show;
  rt.anchor.visible = show;
  rt.line.visible = show;
  rt.nameLabel.visible = show;
  rt.dateLabel.visible = show;
  rt.markers.forEach((m) => { m.obj.visible = show; });
}

spacecraftList.forEach(createSpacecraft);

/* ============================ 卫星（选中行星时显示其重要卫星） ============================ */
let moonsGroup = null;
let moonPivots = [];
let moonLabelEls = [];

function clearMoons() {
  if (moonsGroup) {
    moonsGroup.parent.remove(moonsGroup);
    moonsGroup.traverse((o) => {
      if (o.isMesh) {
        o.geometry.dispose();
        if (o.material) o.material.dispose();
      }
    });
    moonsGroup = null;
  }
  // 卫星标签是 DOM 元素，需手动从页面移除，避免残留“幽灵标签”
  moonLabelEls.forEach((el) => { if (el.parentNode) el.parentNode.removeChild(el); });
  moonPivots = [];
  moonLabelEls = [];
}

function showMoons(moons, anchor) {
  clearMoons();
  if (!moons || !moons.length) return;
  moonsGroup = new THREE.Group();
  anchor.add(moonsGroup);

  moons.forEach((m) => {
    const pivot = new THREE.Object3D();
    moonsGroup.add(pivot);

    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(m.radius, 16, 16),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(m.color), roughness: 0.9, metalness: 0 })
    );
    mesh.position.x = m.distance;
    pivot.add(mesh);

    const pts = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * m.distance, 0, Math.sin(a) * m.distance));
    }
    const orbitLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.14, depthWrite: false })
    );
    pivot.add(orbitLine);

    const el = document.createElement('div');
    el.className = 'moon-label';
    el.textContent = L(m.name, m.en);
    el.__data = m;
    const label = new CSS2DObject(el);
    label.position.set(m.distance, m.radius + 0.3, 0);
    pivot.add(label);

    pivot.userData.speed = m.speed;
    moonPivots.push(pivot);
    moonLabelEls.push(el);
  });
}

function showMoonsFor(data) {
  const rt = runtimeMap.get(data.id);
  const moons = MOONS[data.id];
  if (moons && moons.length && rt && rt.anchor) {
    showMoons(moons, rt.anchor);
  } else {
    clearMoons();
  }
}

/* ============================ 选中高亮 ============================ */
const selectionSprite = new THREE.Sprite(
  new THREE.SpriteMaterial({ map: makeRingTexture(), transparent: true, depthWrite: false })
);
selectionSprite.visible = false;
scene.add(selectionSprite);

/* ============================ 交互（射线检测） ============================ */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let downX = 0, downY = 0, downOn = null;

function setPointer(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function firstVisibleHit(hits) {
  for (const h of hits) {
    const rt = h.object.userData.rt;
    if (!rt || rt.visible !== false) return h;
  }
  return null;
}

renderer.domElement.addEventListener('pointermove', (e) => {
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickable, false);
  const hit = firstVisibleHit(hits);
  if (hit) {
    document.body.style.cursor = 'pointer';
    const rt = hit.object.userData.rt;
    if (rt) {
      tooltip.textContent = `${rt.data.name} · ${rt.data.en}`;
      tooltip.style.display = 'block';
      tooltip.style.left = (e.clientX + 14) + 'px';
      tooltip.style.top = (e.clientY + 16) + 'px';
    }
  } else {
    document.body.style.cursor = 'default';
    tooltip.style.display = 'none';
  }
});

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  downX = e.clientX; downY = e.clientY;
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickable, false);
  const hit = firstVisibleHit(hits);
  downOn = hit ? hit.object : null;
});

renderer.domElement.addEventListener('pointerup', (e) => {
  if (e.button !== 0) return;
  const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
  if (moved < 5 && downOn) {
    const rt = downOn.userData.rt;
    if (rt) selectBody(rt.data);
  }
  downOn = null;
});

/* ============================ 选中与跟随 ============================ */
let selected = null;
let selectedRuntime = null;
let followMode = null; // 'body' | 'home' | null
const homeVec = new THREE.Vector3(0, 0, 0);
const _tmpVec = new THREE.Vector3();

function selectBody(data) {
  selected = data;
  selectedRuntime = runtimeMap.get(data.id) || null;
  followMode = 'body';
  spacecraftRuntimes.forEach((sc) => setSpacecraftVisible(sc, sc.data.id === data.id));
  showMoonsFor(data);
  renderInfoPanel(data);
  infoPanel.classList.add('open');
  infoPanel.setAttribute('aria-hidden', 'false');
  selectionSprite.visible = !!(selectedRuntime && selectedRuntime.anchor);
  updateChipHighlight(data.id);
}

function deselect() {
  selected = null;
  selectedRuntime = null;
  followMode = 'home';
  spacecraftRuntimes.forEach((sc) => setSpacecraftVisible(sc, false));
  clearMoons();
  selectionSprite.visible = false;
  infoPanel.classList.remove('open');
  infoPanel.setAttribute('aria-hidden', 'true');
  updateChipHighlight(null);
}

panelClose.addEventListener('click', deselect);

/* ============================ 信息面板渲染 ============================ */
function renderInfoPanel(data) {
  panelContent.innerHTML = data.kind === 'belt' ? renderBeltPanel(data)
    : data.kind === 'spacecraft' ? renderSpacecraftPanel(data)
    : renderBodyPanel(data);
  panelContent.scrollTop = 0;
}

function stateText(kind) {
  if (kind === 'rock') return T('stateRock');
  if (kind === 'gas' || kind === 'ice') return T('stateGas');
  if (kind === 'star') return T('statePlasma');
  return T('stateRockIce');
}

function renderBodyPanel(d) {
  const U = UI[lang];
  const name = L(d.name, d.en);
  const subName = lang === 'en' ? d.name : d.en;
  const type = L(d.type, d.type_en);
  const note = L(d.satellitesNote, d.satellitesNote_en);
  const satText = note ? `${d.satellites} ${note}` : String(d.satellites);
  const comps = L(d.composition, d.composition_en).map((c) => `<span class="chip">${c}</span>`).join('');
  const gravity = lang === 'en' ? `${d.gravity}×` : `${d.gravity} 倍`;
  return `
    <div class="panel-header kind-${d.kind}">
      <div class="panel-title">
        <h2>${name}</h2>
        <span class="panel-en">${subName}</span>
      </div>
      <span class="type-badge">${type}</span>
    </div>
    <p class="panel-desc">${L(d.desc, d.desc_en)}</p>
    <div class="facts">
      <div class="fact"><div class="fact-label">${U.factAge}</div><div class="fact-value">${L(d.age, d.age_en)}</div></div>
      <div class="fact"><div class="fact-label">${U.factDiameter}</div><div class="fact-value">${d.diameter}</div></div>
      <div class="fact"><div class="fact-label">${U.factSatellites}</div><div class="fact-value">${satText}</div></div>
      <div class="fact"><div class="fact-label">${U.factType}</div><div class="fact-value">${type}</div></div>
      <div class="fact"><div class="fact-label">${U.factRotation}</div><div class="fact-value">${L(d.rotationPeriod, d.rotationPeriod_en)}</div></div>
      <div class="fact"><div class="fact-label">${U.factRevolution}</div><div class="fact-value">${L(d.revolutionPeriod, d.revolutionPeriod_en)}</div></div>
      <div class="fact"><div class="fact-label">${U.factGravity}</div><div class="fact-value">${gravity}</div></div>
      <div class="fact"><div class="fact-label">${U.factState}</div><div class="fact-value">${stateText(d.kind)}</div></div>
      <div class="fact fact-wide"><div class="fact-label">${U.factComposition}</div><div class="fact-value comps">${comps}</div></div>
    </div>
  `;
}

function renderBeltPanel(b) {
  const U = UI[lang];
  const name = L(b.name, b.en);
  const subName = lang === 'en' ? b.name : b.en;
  const items = L(b.introItems, b.introItems_en)
    .map((it) => `<div class="intro-item"><div class="intro-title">${it.title}</div><div class="intro-text">${it.text}</div></div>`)
    .join('');
  const bodiesHtml = L(b.mainBodies, b.mainBodies_en)
    .map((m) => `<div class="belt-body"><div class="belt-body-name">${m.name}</div><div class="belt-body-meta">${lang === 'en' ? 'Diameter' : '直径'} ${m.diameter} · ${m.type}</div><div class="belt-body-desc">${m.desc}</div></div>`)
    .join('');
  return `
    <div class="panel-header kind-belt">
      <div class="panel-title">
        <h2>${name}</h2>
        <span class="panel-en">${subName}</span>
      </div>
      <span class="type-badge">${U.beltTag}</span>
    </div>
    <p class="panel-desc">${L(b.intro, b.intro_en)}</p>
    <div class="belt-location">📍 ${L(b.location, b.location_en)}</div>
    <h3 class="section-title">${U.sectionIntro}</h3>
    <div class="intro-list">${items}</div>
    <h3 class="section-title">${U.sectionCount}</h3>
    <div class="count-box">${L(b.count, b.count_en)}</div>
    <h3 class="section-title">${U.sectionMain}</h3>
    <div class="belt-bodies">${bodiesHtml}</div>
  `;
}

function renderSpacecraftPanel(d) {
  const U = UI[lang];
  const name = L(d.name, d.en);
  const subName = lang === 'en' ? d.name : d.en;
  const goals = L(d.missionGoals, d.missionGoals_en)
    .map((g) => `<div class="intro-item"><div class="intro-text">• ${g}</div></div>`)
    .join('');
  const timeline = d.timeline
    .map((tp) => `<div class="timeline-item"><div class="timeline-date">${L(tp.date, tp.date_en)}</div><div class="timeline-event">${L(tp.event, tp.event_en)}</div></div>`)
    .join('');
  return `
    <div class="panel-header kind-spacecraft">
      <div class="panel-title">
        <h2>${name}</h2>
        <span class="panel-en">${subName}</span>
      </div>
      <span class="type-badge">${U.spacecraftTag}</span>
    </div>
    <p class="panel-desc">${L(d.desc, d.desc_en)}</p>
    <div class="facts">
      <div class="fact"><div class="fact-label">${U.factCountry}</div><div class="fact-value">${L(d.country, d.country_en)}</div></div>
      <div class="fact"><div class="fact-label">${U.factMass}</div><div class="fact-value">${d.mass}</div></div>
      <div class="fact"><div class="fact-label">${U.factSize}</div><div class="fact-value">${L(d.size, d.size_en)}</div></div>
      <div class="fact"><div class="fact-label">${U.factLaunch}</div><div class="fact-value">${L(d.launchDate, d.launchDate_en)}</div></div>
      <div class="fact"><div class="fact-label">${U.factStatus}</div><div class="fact-value">${L(d.status, d.status_en)}</div></div>
      <div class="fact"><div class="fact-label">${U.factPower}</div><div class="fact-value">${L(d.power, d.power_en)}</div></div>
    </div>
    <h3 class="section-title">${U.missionGoals}</h3>
    <div class="intro-list">${goals}</div>
    <h3 class="section-title">${U.missionTimeline}</h3>
    <div class="timeline">${timeline}</div>
  `;
}

/* ============================ 底部导航条 ============================ */
function addChip(container, d) {
  const btn = document.createElement('button');
  btn.className = 'chip';
  btn.dataset.id = d.id;
  const dot = document.createElement('span');
  dot.className = 'chip-dot';
  dot.style.background = d.color || '#888';
  btn.appendChild(dot);
  btn.appendChild(document.createTextNode(L(d.name, d.en)));
  btn.addEventListener('click', () => selectBody(d));
  container.appendChild(btn);
}

function buildChips() {
  chipBar.innerHTML = '';
  spacecraftBar.innerHTML = '';
  [...bodies, ...BELTS].forEach((d) => addChip(chipBar, d));
  spacecraftList.forEach((d) => addChip(spacecraftBar, d));
  updateChipHighlight(selected ? selected.id : null);
}
buildChips();

function updateChipHighlight(id) {
  [chipBar, spacecraftBar].forEach((bar) => {
    bar.querySelectorAll('.chip').forEach((c) => {
      c.classList.toggle('active', c.dataset.id === id);
    });
  });
}

/* ============================ 工具栏 ============================ */
let speed = 1;
let paused = false;

speedSlider.addEventListener('input', () => {
  speed = parseFloat(speedSlider.value);
  speedValue.textContent = speed.toFixed(1) + '×';
  if (speed > 0) {
    paused = false;
    pauseBtn.textContent = '⏸';
  }
});

pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? '▶' : '⏸';
});

orbitsBtn.addEventListener('click', () => {
  orbitsGroup.visible = !orbitsGroup.visible;
  orbitsBtn.classList.toggle('active', orbitsGroup.visible);
});

labelsBtn.addEventListener('click', () => {
  const show = labelsBtn.classList.toggle('active');
  labelEls.forEach((el) => { el.style.display = show ? '' : 'none'; });
});

let pixelMode = false;

function toggleMeshStyle(mesh, data, on) {
  if (on) {
    if (!mesh.userData._origGeometry) {
      mesh.userData._origGeometry = mesh.geometry;
      mesh.userData._origMaterial = mesh.material;
    }
    const s = data.radius * 1.8;
    mesh.geometry = new THREE.BoxGeometry(s, s, s);
    mesh.material = data.kind === 'star'
      ? new THREE.MeshBasicMaterial({ color: new THREE.Color(data.color) })
      : new THREE.MeshStandardMaterial({ color: new THREE.Color(data.color), roughness: 0.5, metalness: 0.1 });
  } else if (mesh.userData._origGeometry) {
    mesh.geometry = mesh.userData._origGeometry;
    mesh.material = mesh.userData._origMaterial;
  }
}

function setPixelMode(on) {
  pixelMode = on;
  pixelBtn.classList.toggle('active', on);
  toggleMeshStyle(sunMesh, SUN, on);
  planetRuntimes.forEach((rt) => toggleMeshStyle(rt.mesh, rt.data, on));
}

pixelBtn.addEventListener('click', () => setPixelMode(!pixelMode));

resetBtn.addEventListener('click', () => {
  deselect();
  followMode = null;
  camera.position.copy(HOME_POS);
  controls.target.set(0, 0, 0);
  controls.update();
});

/* ============================ 小测验 ============================ */
const QUIZ_SIZE = 5;

const PRAISE = [
  { icon: '🎉', zh: '太棒了！', en: 'Awesome!' },
  { icon: '🌟', zh: '真厉害！', en: 'Amazing!' },
  { icon: '🚀', zh: '完全正确，飞向星辰！', en: 'Correct! To the stars!' },
  { icon: '🏆', zh: '学霸就是你！', en: "You're a superstar!" },
  { icon: '💫', zh: '答对啦，闪耀如星！', en: 'Nailed it!' },
  { icon: '✨', zh: '好样的！', en: 'Well done!' },
  { icon: '👏', zh: '漂亮！', en: 'Great job!' },
  { icon: '🧠', zh: '天文小达人！', en: 'Astronomy whiz!' },
];

const WRONG_FEEDBACK = [
  { icon: '🤔', zh: '差一点，再接再厉！', en: 'So close, keep it up!' },
  { icon: '💪', zh: '别灰心，多看一遍就记住啦！', en: "Don't give up, you'll remember it!" },
  { icon: '🌱', zh: '没关系，知识就是这样积累的！', en: 'No worries, knowledge grows step by step!' },
  { icon: '🔭', zh: '再观察一下，答案就在上方～', en: 'Look again, the answer is above!' },
  { icon: '📚', zh: '记住这个知识点，下次一定对！', en: 'Remember this one for next time!' },
  { icon: '🌠', zh: '星辰大海，慢慢探索！', en: 'Explore the starry sea, one step at a time!' },
];

const SCORE_FEEDBACK = [
  { min: 5, icon: '🏆', zh: '满分！你是太阳系知识大师！', en: 'Perfect score! A Solar System master!' },
  { min: 4, icon: '🌟', zh: '非常棒，几乎全对！', en: 'Excellent, almost perfect!' },
  { min: 3, icon: '👏', zh: '不错哦，继续加油！', en: 'Not bad, keep going!' },
  { min: 2, icon: '💪', zh: '再接再厉，多看看星球介绍吧！', en: 'Keep practicing — check the planet panels!' },
  { min: 0, icon: '🌱', zh: '别灰心，从头再来一次！', en: "Don't worry, give it another try!" },
];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 打乱某道题的选项顺序，并重新计算正确答案下标
function prepareQuestion(q) {
  const optionsArr = L(q.options, q.options_en);
  const order = shuffle(optionsArr.map((_, i) => i));
  return {
    question: L(q.question, q.question_en),
    options: order.map((i) => optionsArr[i]),
    answer: order.indexOf(q.answer),
    explain: L(q.explain, q.explain_en),
  };
}

let currentQuiz = [];
let praisePool = [];
let wrongPool = [];
let praiseIdx = 0;
let wrongIdx = 0;
let quizSubmitted = false;

function buildQuiz() {
  currentQuiz = shuffle(QUIZ).slice(0, QUIZ_SIZE).map(prepareQuestion);
  praisePool = shuffle(PRAISE);
  wrongPool = shuffle(WRONG_FEEDBACK);
  praiseIdx = 0;
  wrongIdx = 0;
  quizSubmitted = false;
  quizBody.innerHTML = currentQuiz.map((q, qi) => `
    <div class="quiz-question" data-q="${qi}">
      <div class="q-text"><span class="q-num">${qi + 1}.</span>${q.question}</div>
      <div class="q-options">
        ${q.options.map((opt, oi) => `
          <label class="q-option">
            <input type="radio" name="q${qi}" value="${oi}" />
            <span class="q-opt-label">${String.fromCharCode(65 + oi)}. ${opt}</span>
          </label>`).join('')}
      </div>
      <div class="q-explain" hidden></div>
    </div>`).join('');
  quizScore.textContent = '';
  quizSubmit.textContent = T('quizSubmit');
}

function openQuiz() {
  buildQuiz();
  quizModal.classList.add('open');
  quizModal.setAttribute('aria-hidden', 'false');
}

function closeQuiz() {
  quizModal.classList.remove('open');
  quizModal.setAttribute('aria-hidden', 'true');
}

function submitQuiz() {
  if (!quizSubmitted) {
    let correct = 0;
    currentQuiz.forEach((q, qi) => {
      const qEl = quizBody.querySelector(`.quiz-question[data-q="${qi}"]`);
      const options = qEl.querySelectorAll('.q-option');
      const explain = qEl.querySelector('.q-explain');
      const checked = qEl.querySelector(`input[name="q${qi}"]:checked`);
      options.forEach((o) => o.classList.remove('correct', 'wrong'));
      const val = checked ? parseInt(checked.value, 10) : -1;
      let feedback;
      if (val === q.answer) {
        correct += 1;
        options[val].classList.add('correct');
        const p = praisePool[praiseIdx % praisePool.length];
        praiseIdx += 1;
        feedback = `${p.icon} ${L(p.zh, p.en)}　${q.explain}`;
      } else {
        if (val >= 0) options[val].classList.add('wrong');
        options[q.answer].classList.add('correct');
        const w = wrongPool[wrongIdx % wrongPool.length];
        wrongIdx += 1;
        const ans = lang === 'en' ? `The correct answer is "${q.options[q.answer]}".` : `正确答案是「${q.options[q.answer]}」。`;
        feedback = `${w.icon} ${L(w.zh, w.en)}　${ans} ${q.explain}`;
      }
      qEl.querySelectorAll('input').forEach((i) => { i.disabled = true; });
      explain.textContent = feedback;
      explain.hidden = false;
    });
    const sf = SCORE_FEEDBACK.find((f) => correct >= f.min) || SCORE_FEEDBACK[SCORE_FEEDBACK.length - 1];
    quizScore.textContent = `${T('score')(correct, QUIZ_SIZE)}　${sf.icon} ${L(sf.zh, sf.en)}`;
    quizSubmit.textContent = T('quizRetry');
    quizSubmitted = true;
  } else {
    buildQuiz();
  }
}

quizBtn.addEventListener('click', openQuiz);
quizClose.addEventListener('click', closeQuiz);
quizBackdrop.addEventListener('click', closeQuiz);
quizSubmit.addEventListener('click', submitQuiz);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeQuiz();
});

/* ============================ 语言切换 ============================ */
function applyLanguage() {
  const U = UI[lang];
  appTitle.textContent = U.title;
  appSubtitle.textContent = U.subtitle;
  speedLabel.textContent = U.speed;
  orbitsBtn.textContent = U.orbits;
  labelsBtn.textContent = U.labels;
  pixelBtn.textContent = U.pixel;
  resetBtn.textContent = U.reset;
  quizBtn.textContent = U.quiz;
  langBtn.textContent = U.lang;
  hintEl.textContent = U.hint;
  loadingText.textContent = U.loading;
  quizTitle.textContent = U.quizTitle;
  quizSub.textContent = U.quizSub;
  labelEls.forEach((el) => { if (el.__data) el.textContent = L(el.__data.name, el.__data.en); });
  moonLabelEls.forEach((el) => { if (el.__data) el.textContent = L(el.__data.name, el.__data.en); });
  spacecraftRuntimes.forEach((sc) => {
    sc.nameEl.textContent = L(sc.data.name, sc.data.en);
    sc.markers.forEach((m) => { m.el.textContent = L(m.tp.date, m.tp.date_en); });
  });
  buildChips();
  if (selected) renderInfoPanel(selected);
  buildQuiz();
}

langBtn.addEventListener('click', () => {
  lang = lang === 'zh' ? 'en' : 'zh';
  applyLanguage();
});

/* ============================ 动画循环 ============================ */
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  const s = paused ? 0 : speed;

  sunMesh.rotation.y += SUN.rotationSpeed * s * dt;

  for (const rt of planetRuntimes) {
    rt.pivot.rotation.y += rt.orbitAngularSpeed * s * dt;
    rt.mesh.rotation.y += rt.data.rotationSpeed * s * dt;
  }

  for (const p of moonPivots) {
    p.rotation.y += p.userData.speed * s * dt;
  }

  for (const b of beltRuntimes) {
    b.points.rotation.y += b.rotationSpeed * s * dt;
  }

  for (const sc of spacecraftRuntimes) {
    sc.t += (s * dt) / LOOP_SECONDS;
    if (sc.t > 1) sc.t -= 1;
    const p = sc.curve.getPointAt(sc.t);
    const tan = sc.curve.getTangentAt(sc.t);
    sc.anchor.position.copy(p);
    if (tan.lengthSq() > 1e-6) sc.model.lookAt(p.clone().add(tan));
    const yr = Math.floor(yearAt(sc, sc.t));
    sc.dateEl.textContent = lang === 'en' ? String(yr) : `${yr} 年`;
  }

  // 选中高亮跟随
  if (selectedRuntime && selectedRuntime.anchor) {
    selectedRuntime.anchor.getWorldPosition(_tmpVec);
    selectionSprite.position.copy(_tmpVec);
    const sc = selectedRuntime.data.radius * 4 + 1;
    selectionSprite.scale.set(sc, sc, 1);
  }

  // 相机跟随
  if (followMode === 'body' && selectedRuntime) {
    if (selectedRuntime.anchor) {
      selectedRuntime.anchor.getWorldPosition(_tmpVec);
      controls.target.lerp(_tmpVec, 0.08);
    } else {
      // 星带无独立锚点：视角回到太阳系中心以观察整条星带
      controls.target.lerp(homeVec, 0.08);
    }
  } else if (followMode === 'home') {
    controls.target.lerp(homeVec, 0.08);
    if (controls.target.distanceTo(homeVec) < 0.3) {
      controls.target.copy(homeVec);
      followMode = null;
    }
  }

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

/* ============================ 自适应 ============================ */
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

/* ============================ 启动 ============================ */
createStars();
animate();
applyLanguage();

window.addEventListener('load', () => {
  setTimeout(() => { if (!fatal) loadingEl.classList.add('hidden'); }, 400);
});
setTimeout(() => { if (!fatal) loadingEl.classList.add('hidden'); }, 2000);
