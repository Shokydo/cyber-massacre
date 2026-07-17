// --- LOBBY STATE ---
let lobbyActive = false;
let lobbySelectedClass = null;
let lobbyPlayer = { x: 0, y: 0, size: 18, speed: 3.5 };
const LOBBY_W = 800;
const LOBBY_H = 600;
const LOBBY_WALL = 40;

const lobbyZones = [
  { cls:'melee', label:'ЭДЖРАННЕР', color:'#f0f', desc:'БЛИЖНИЙ БОЙ',
    x:100, y:80, w:180, h:130 },
  { cls:'magic', label:'НЕТРАННЕР', color:'#a0f', desc:'ВЗЛОМ И МАГИЯ',
    x:520, y:80, w:180, h:130 },
  { cls:'tech',  label:'ТЕХНИК',    color:'#ff0', desc:'ПИСТОЛЕТ И ГАДЖЕТЫ',
    x:310, y:400, w:180, h:130 }
];

let lobbyParticles = [];
let lobbyNeonTimer = 0;

function enterLobby() {
  initAudio();
  playSound('ui_click');
  const fade = document.getElementById('fade-overlay');
  const startScreen = document.getElementById('start');
  fade.style.opacity = '1';
  setTimeout(() => {
    startScreen.style.display = 'none';
    lobbyActive = true;
    lobbySelectedClass = null;
    lobbyPlayer.x = LOBBY_W / 2;
    lobbyPlayer.y = LOBBY_H / 2;
    lobbyParticles = [];
    for (let i = 0; i < 30; i++) {
      lobbyParticles.push({
        x: Math.random() * LOBBY_W, y: Math.random() * LOBBY_H,
        vx: (Math.random() - 0.5) * 0.5, vy: -0.3 - Math.random() * 0.5,
        size: 1 + Math.random() * 2, alpha: 0.2 + Math.random() * 0.4,
        color: ['#00f3ff','#ff00ff','#fcee0a'][Math.floor(Math.random()*3)]
      });
    }
    fade.style.opacity = '0';
    lobbyLoop();
  }, 1500);
}

function lobbyLoop() {
  if (!lobbyActive) return;
  lobbyUpdate();
  lobbyDraw();
  requestAnimationFrame(lobbyLoop);
}

function lobbyUpdate() {
  const p = lobbyPlayer;
  let dx = 0, dy = 0;
  if (keys['w'] || keys['ц']) dy -= 1;
  if (keys['s'] || keys['ы']) dy += 1;
  if (keys['a'] || keys['ф']) dx -= 1;
  if (keys['d'] || keys['в']) dx += 1;
  if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

  const nx = p.x + dx * p.speed;
  const ny = p.y + dy * p.speed;

  if (nx - p.size/2 >= LOBBY_WALL && nx + p.size/2 <= LOBBY_W - LOBBY_WALL) p.x = nx;
  if (ny - p.size/2 >= LOBBY_WALL && ny + p.size/2 <= LOBBY_H - LOBBY_WALL) p.y = ny;

  lobbySelectedClass = null;
  const hudLabel = document.getElementById('lobby-class-label');
  for (const z of lobbyZones) {
    if (p.x > z.x && p.x < z.x + z.w && p.y > z.y && p.y < z.y + z.h) {
      lobbySelectedClass = z.cls;
      hudLabel.textContent = z.label + ' — ' + z.desc + '  |  НАЖМИ E';
      hudLabel.style.color = z.color;
      hudLabel.style.borderColor = z.color;
      hudLabel.style.opacity = '1';
      break;
    }
  }
  if (!lobbySelectedClass) {
    hudLabel.style.opacity = '0';
  }

  lobbyNeonTimer += 0.02;
  for (const pt of lobbyParticles) {
    pt.x += pt.vx;
    pt.y += pt.vy;
    if (pt.y < -10) { pt.y = LOBBY_H + 10; pt.x = Math.random() * LOBBY_W; }
    if (pt.x < -10) pt.x = LOBBY_W + 10;
    if (pt.x > LOBBY_W + 10) pt.x = -10;
  }
}

function lobbyDraw() {
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, W, H);

  const ox = (W - LOBBY_W) / 2;
  const oy = (H - LOBBY_H) / 2;

  ctx.save();
  ctx.translate(ox, oy);

  ctx.fillStyle = '#0a0a18';
  ctx.fillRect(0, 0, LOBBY_W, LOBBY_H);

  ctx.strokeStyle = 'rgba(0,243,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x < LOBBY_W; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, LOBBY_H); }
  for (let y = 0; y < LOBBY_H; y += 40) { ctx.moveTo(0, y); ctx.lineTo(LOBBY_W, y); }
  ctx.stroke();

  ctx.strokeStyle = '#1a1a3a';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, LOBBY_W - 4, LOBBY_H - 4);

  ctx.strokeStyle = '#00f3ff';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00f3ff';
  ctx.shadowBlur = 10;
  ctx.strokeRect(LOBBY_WALL/2, LOBBY_WALL/2, LOBBY_W - LOBBY_WALL, LOBBY_H - LOBBY_WALL);
  ctx.shadowBlur = 0;

  for (const z of lobbyZones) {
    const hover = lobbySelectedClass === z.cls;
    ctx.fillStyle = hover ? z.color + '22' : z.color + '0a';
    ctx.fillRect(z.x, z.y, z.w, z.h);

    ctx.strokeStyle = z.color;
    ctx.lineWidth = hover ? 3 : 1.5;
    ctx.shadowColor = z.color;
    ctx.shadowBlur = hover ? 20 : 8;
    ctx.strokeRect(z.x, z.y, z.w, z.h);
    ctx.shadowBlur = 0;

    ctx.fillStyle = z.color;
    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = z.color;
    ctx.shadowBlur = 10;
    ctx.fillText(z.label, z.x + z.w/2, z.y + z.h/2 - 8);
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.fillStyle = '#aaa';
    ctx.shadowBlur = 0;
    ctx.fillText(z.desc, z.x + z.w/2, z.y + z.h/2 + 12);
    ctx.textAlign = 'left';
  }

  for (const pt of lobbyParticles) {
    ctx.globalAlpha = pt.alpha * (0.5 + 0.5 * Math.sin(lobbyNeonTimer * 3 + pt.x));
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - pt.size/2, pt.y - pt.size/2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;

  const p = lobbyPlayer;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#00f3ff';
  ctx.shadowBlur = 15;
  ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#00f3ff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);

  ctx.fillStyle = '#00f3ff';
  ctx.font = '10px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ТЫ', p.x, p.y - p.size/2 - 8);
  ctx.textAlign = 'left';

  const signPulse = 0.7 + 0.3 * Math.sin(lobbyNeonTimer * 2);
  ctx.globalAlpha = signPulse;
  ctx.fillStyle = '#00f3ff';
  ctx.font = 'bold 20px Orbitron, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#00f3ff';
  ctx.shadowBlur = 20;
  ctx.fillText('Л O Б Б И', LOBBY_W/2, LOBBY_H/2 - 60);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';

  ctx.restore();
}

function lobbySelectClass() {
  if (!lobbyActive || !lobbySelectedClass) return;
  playSound('ui_click');
  lobbyActive = false;
  const fade = document.getElementById('fade-overlay');
  const hud = document.getElementById('lobby-hud');
  hud.style.opacity = '0';
  fade.style.opacity = '1';
  setTimeout(() => {
    startMetro(lobbySelectedClass);
  }, 1500);
}

function startMetro(cls) {
  const fade = document.getElementById('fade-overlay');
  const metro = document.getElementById('metro-sequence');
  metro.style.display = 'flex';
  fade.style.opacity = '0';

  setTimeout(() => {
    fade.style.opacity = '1';
    setTimeout(() => {
      metro.style.display = 'none';
      startTrain(cls);
    }, 1500);
  }, 4000);
}

function startTrain(cls) {
  const fade = document.getElementById('fade-overlay');
  const train = document.getElementById('train-sequence');
  train.style.display = 'flex';
  fade.style.opacity = '0';

  setTimeout(() => {
    fade.style.opacity = '1';
    setTimeout(() => {
      train.style.display = 'none';
      fade.style.opacity = '0';
      startGame(cls);
      changeMusic(MUSIC_GAME);
    }, 1500);
  }, 4500);
}

window.enterLobby = enterLobby;
window.lobbySelectClass = lobbySelectClass;
