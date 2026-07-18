// --- LOBBY STATE ---
let lobbyActive = false;
let lobbySelectedClass = null;
// ИЗМЕНЕНО: size изменен с 18 на 14, чтобы точно соответствовать игроку в игре (js/data.js)
// ДОБАВЛЕНО: angle для поворота персонажа и глаза в сторону движения
let lobbyPlayer = { x: 0, y: 0, size: 14, speed: 3.5, angle: Math.PI / 2 };
const LOBBY_W = 800;
const LOBBY_H = 600;
const LOBBY_WALL = 40;

// NPC объекты (замена lobbyZones)
const lobbyNPCs = [
  {
    id: 'edgerunner',
    class: 'edgerunner',
    name: 'ЭДЖРАННЕР',
    description: 'БЛИЖНИЙ БОЙ',
    x: 100, y: 90,  // Сидит ПЕРЕД столом
    width: 30, height: 30,
    color: '#f0f',
    type: 'sitting',
    dialog: [
      "Нужна грубая сила?",
      "Нажми ENTER для выбора класса"
    ]
  },
  {
    id: 'netrunner',
    class: 'netrunner',
    name: 'НЕТРАННЕР',
    description: 'ВЗЛОМ И МАГИЯ',
    x: 580, y: 140,  // Стоит ЗА стойкой (стойка x=500, y=150)
    width: 30, height: 30,
    color: '#a0f',
    type: 'standing',
    behindCounter: true,
    dialog: [
      "Сеть ждет тебя...",
      "Нажми ENTER для выбора класса"
    ]
  },
  {
    id: 'tech',
    class: 'tech',
    name: 'ТЕХНИК',
    description: 'ПИСТОЛЕТ И ГАДЖЕТЫ',
    x: 115, y: 450,  // Стоит ПЕРЕД верстаком (верстак x=80, y=430)
    width: 30, height: 30,
    color: '#ff0',
    type: 'standing',
    dialog: [
      "Нужны гаджеты?",
      "Нажми ENTER для выбора класса"
    ]
  }
];

// Объекты окружения
const lobbyObjects = [
  { type: 'counter', x: 500, y: 150, width: 150, height: 20, color: '#000' },
  { type: 'table', x: 80, y: 110, width: 60, height: 40, color: '#420' },  // Стол за которым сидит эджраннер
  { type: 'workbench', x: 80, y: 430, width: 70, height: 50, color: '#650' }
];

let lobbyParticles = [];
let lobbyNeonTimer = 0;
window.currentDialogNPC = null; // Текущий NPC в диалоге (нужно для input.js)
window.lobbyNearestNPC = null; // Ближайший NPC для взаимодействия

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
    lobbyPlayer.angle = Math.PI / 2; // Сброс угла при входе
    window.currentDialogNPC = null; // Сброс текущего NPC в диалоге
    window.lobbyNearestNPC = null; // Сброс ближайшего NPC
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

    window.__lobbyLoopStarted = window.__lobbyLoopStarted ?? false;
    if (!window.__lobbyLoopStarted) {
      window.__lobbyLoopStarted = true;
      lobbyLoop();
    }
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
  
  // Блокировать движение если открыт диалог
  if (window.currentDialogNPC) {
    return;
  }
  
  let dx = 0, dy = 0;
  if (keys['w'] || keys['ц']) dy -= 1;
  if (keys['s'] || keys['ы']) dy += 1;
  if (keys['a'] || keys['ф']) dx -= 1;
  if (keys['d'] || keys['в']) dx += 1;
  
  // ДОБАВЛЕНО: Расчет угла поворота для отрисовки (как в render.js)
  if (dx !== 0 || dy !== 0) {
    p.angle = Math.atan2(dy, dx);
    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }
  }

  const nx = p.x + dx * p.speed;
  const ny = p.y + dy * p.speed;

  if (nx - p.size/2 >= LOBBY_WALL && nx + p.size/2 <= LOBBY_W - LOBBY_WALL) p.x = nx;
  if (ny - p.size/2 >= LOBBY_WALL && ny + p.size/2 <= LOBBY_H - LOBBY_WALL) p.y = ny;

  // Проверка близости к NPC для взаимодействия
  let nearestNPC = null;
  let minDistance = 60; // радиус взаимодействия

  for (const npc of lobbyNPCs) {
    const npcDx = p.x - npc.x;
    const npcDy = p.y - npc.y;
    const distance = Math.sqrt(npcDx*npcDx + npcDy*npcDy);

    if (distance < minDistance) {
      nearestNPC = npc;
    }
  }

  // Сохраняем nearestNPC для использования в lobbyDraw
  window.lobbyNearestNPC = nearestNPC;

  // Обработка клавиши E теперь в input.js

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

  for (const pt of lobbyParticles) {
    ctx.globalAlpha = pt.alpha * (0.5 + 0.5 * Math.sin(lobbyNeonTimer * 3 + pt.x));
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x - pt.size/2, pt.y - pt.size/2, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;

  // --- ОТРИСОВКА ОБЪЕКТОВ ОКРУЖЕНИЯ ---
  for (const obj of lobbyObjects) {
    ctx.fillStyle = obj.color;
    if (obj.type === 'counter') {
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
    }
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    ctx.shadowBlur = 0;
  }

  // --- ОТРИСОВКА NPC ---
  const nearestNPC = window.lobbyNearestNPC || null;

  for (const npc of lobbyNPCs) {
    // Подсветка при приближении
    if (npc === nearestNPC) {
      ctx.shadowColor = npc.color;
      ctx.shadowBlur = 20;
    }

    // Отрисовка персонажа NPC
    ctx.fillStyle = npc.color;
    if (npc.type === 'sitting') {
      ctx.fillRect(npc.x - 15, npc.y - 20, 30, 20);
    } else {
      ctx.fillRect(npc.x - 15, npc.y - 30, 30, 30);
    }

    // Имя над NPC
    ctx.fillStyle = '#fff';
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, npc.x, npc.y - 40);
    ctx.textAlign = 'left';

    ctx.shadowBlur = 0;
  }

  // --- ПОДСКАЗКА ВЗАИМОДЕЙСТВИЯ ---
  if (nearestNPC) {
    ctx.fillStyle = nearestNPC.color;
    ctx.font = 'bold 14px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('[E] ВЗАИМОДЕЙСТВОВАТЬ', lobbyPlayer.x, lobbyPlayer.y - 50);
    ctx.textAlign = 'left';
  }

  // --- ОТРИСОВКА ИГРОКА (синхронизировано с playerRender.js) ---
  const p = lobbyPlayer;
  const isMoving = (keys['w'] || keys['a'] || keys['s'] || keys['d'] || keys['ц'] || keys['ф'] || keys['в'] || keys['ы']);
  const p3DTime = Date.now() * 0.006;
  const pBob = isMoving ? Math.sin(p3DTime * 2.5) * 3 : Math.sin(p3DTime * 1.2) * 1.5;
  
  const renderY = p.y + pBob;
  
  // Используем drawChar2D из playerRender.js для синхронизации с игрой
  // bodySize = 14 (как в data.js), headSize = 12 (пропорция 20/24 от 14 = ~11.67, округляем до 12)
  const bodySize = p.size;
  const headSize = Math.round(bodySize * (20 / 24));
  
  if (typeof drawChar2D === 'function') {
    ctx.save();
    drawChar2D(p.x, renderY, bodySize, headSize, '#ffffff', p.angle, 0, false);
    
    // Дополнительное неоновое свечение для лобби
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(p.x - bodySize/2 - 2, renderY - bodySize - 2, bodySize + 4, bodySize + headSize + 4);
    ctx.globalAlpha = 1;
    ctx.restore();
  } else {
    // Фоллбек, если drawChar2D не загружен
    ctx.save();
    ctx.translate(p.x, renderY);
    ctx.rotate(p.angle);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 15;
    ctx.fillRect(-bodySize/2, -bodySize, bodySize, bodySize);
    
    // Голова
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-headSize/2, -bodySize - headSize, headSize, headSize);
    
    // Глаз для видимости поворота
    ctx.fillStyle = '#000';
    ctx.shadowBlur = 0;
    ctx.fillRect(2, -bodySize - headSize/2 - 1, 6, 3);
    ctx.restore();
  }

  // Подпись "ТЫ" (с учетом покачивания)
  ctx.fillStyle = '#00f3ff';
  ctx.font = '10px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ТЫ', p.x, renderY - bodySize - headSize - 5);
  ctx.textAlign = 'left';
  // ---------------------------------------------------------------------------

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
  // Если есть ближайший NPC, открываем диалог с ним
  if (window.lobbyNearestNPC) {
    openDialog(window.lobbyNearestNPC);
  }
}

window.enterLobby = enterLobby;
window.lobbySelectClass = lobbySelectClass;

// --- ФУНКЦИИ ДИАЛОГОВОЙ СИСТЕМЫ ---

// Показать подсказку взаимодействия при приближении к NPC
function showInteractionPrompt(npc) {
  const hint = document.getElementById('lobby-hint');
  hint.textContent = `ВЗАИМОДЕЙСТВОВАТЬ С ${npc.name} [E]`;
  hint.style.color = npc.color;
  hint.style.borderColor = npc.color;
  hint.style.opacity = '1';
}

// Открыть диалог с NPC
function openDialog(npc) {
  window.currentDialogNPC = npc;
  const dialogBox = document.getElementById('lobby-dialog');
  const npcName = document.getElementById('dialog-npc-name');
  const dialogText = document.getElementById('dialog-text');
  const dialogHint = document.getElementById('dialog-hint');

  dialogBox.style.display = 'block';
  dialogBox.style.borderColor = npc.color;
  dialogBox.style.boxShadow = `0 0 30px ${npc.color}4d`;
  npcName.textContent = npc.name;
  npcName.style.color = npc.color;
  npcName.style.textShadow = `0 0 10px ${npc.color}`;
  dialogText.innerHTML = npc.dialog.join('<br>');
  dialogHint.style.color = '#aaa';
}

// Закрыть диалог
function closeDialog() {
  window.currentDialogNPC = null;
  const dialogBox = document.getElementById('lobby-dialog');
  const hint = document.getElementById('lobby-hint');

  dialogBox.style.display = 'none';
  dialogBox.style.boxShadow = '0 0 30px rgba(0, 243, 255, 0.3)';
  hint.style.opacity = '0';
  
  // Обновляем lobbyNearestNPC после закрытия диалога
  // (на случай если игрок отошел от NPC во время диалога)
  const p = lobbyPlayer;
  let nearestNPC = null;
  let minDistance = 60;
  for (const npc of lobbyNPCs) {
    const dx = p.x - npc.x;
    const dy = p.y - npc.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    if (distance < minDistance) {
      nearestNPC = npc;
    }
  }
  window.lobbyNearestNPC = nearestNPC;
}

// Обработчик выбора класса из диалога
function selectClassFromDialog() {
  if (window.currentDialogNPC) {
    playSound('ui_click');
    const selectedClass = window.currentDialogNPC.class; // Сохраняем класс ПЕРЕД закрытием диалога
    closeDialog();
    setTimeout(() => {
      startGame(selectedClass);
      changeMusic(MUSIC_GAME);
    }, 100);
  }
}

// Обработчик закрытия диалога
function closeDialogFromMenu() {
  closeDialog();
}

// Функция для запуска выбора класса (вызывается из меню или диалога)
function openLobbyDialog() {
  closeDialog();
  const fade = document.getElementById('fade-overlay');
  const hud = document.getElementById('lobby-hud');
  const train = document.getElementById('train-sequence');
  hud.style.opacity = '0';
  fade.style.opacity = '1';

  setTimeout(() => {
    train.style.display = 'flex';
    fade.style.opacity = '0';

    setTimeout(() => {
      fade.style.opacity = '1';
      setTimeout(() => {
        train.style.display = 'none';
        fade.style.opacity = '0';
        //[startGame с lobbySelectedClass удален - теперь выбор через NPC]
      }, 4500);
    }, 1500);
  }, 1500);
}

// Экспорт функций для input.js
window.openDialog = openDialog;
window.closeDialog = closeDialog;
window.selectClassFromDialog = selectClassFromDialog;
window.closeDialogFromMenu = closeDialogFromMenu;
