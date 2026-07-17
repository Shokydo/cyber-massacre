function startGame(cls) {
  initAudio();
  playSound('ui_click');
  playerClass = cls;
  document.getElementById('start').style.display = 'none';
  document.getElementById('game').style.pointerEvents = 'auto';
  gameRunning = true;
  initWorld();
  updateClassUI();
  loop();
}

function initWorld() {
  player.x = WORLD_W/2; player.y = WORLD_H/2;
  camera.x = player.x - W/2; camera.y = player.y - H/2;
  enemies = []; projectiles = []; particles = []; pickups = []; damageTexts = [];
  grenades = []; lasers = []; lightningChains = [];
  turrets = []; turretProjectiles = []; burnZones = []; damageZones = [];
  worldObjects = [];
  breachMarks = [];
  cyberDemons = [];
  hackedEnemies = [];
  techSmartMarks = [];
  techSmartShots = [];
  nanoSwarm = [];
  edgerunnerKnives = [];
  edgerunnerKnifeCharges = 3;
  edgerunnerKnifeRecharge = 0;
  edgerunnerSlashAnim = 0;
  edgerunnerSlashDir = 1;
  edgerunnerWhirlwind = null;
  edgerunnerEmpGrenades = [];
  sandevistanActive = false;
  sandevistanTimer = 0;
  sandevistanDuration = 300;
  sandevistanCooldown = 0;
  netrunnerMonowire = null;
  netrunnerCyberDemon = null;
  netrunnerBlackwallActive = false;
  netrunnerBlackwallTimer = 0;
  techieShield = { hp: 120, maxHp: 120, active: false, cooldown: 0, broken: false, regenTimer: 0 };
  techiePistolShots = [];
  techieTurret = null;
  techieCombatDrone = null;
  techieExosuitActive = false;
  techieExosuitTimer = 0;
  techieExosuitTrail = [];
  player.implants = {};
  player.stats = { dmgPct:0, maxHpPct:0, defensePct:0, atkSpeedPct:0, rangePct:0, hpRegenPct:0, abilityCdPct:0, qCdPct:0, luckPct:0 };
  player.skillPoints = 0; player.skills = {};
  resetAbilityLevels(); currentAbility = 0;
  player.hp = player.maxHp = 100; player.level = 1; player.xp = 0; player.xpNext = 50;
  player.floor = 1; player.kills = 0;
  player.abilityCd1 = 0; player.abilityCd2 = 0; player.ultCd = 0;
  player.ultActive = 0; player.ultCharge = 0; player.tornadoActive = 0;
  isFloorTransition = false;
  survivalTime = 0; nextBossTime = 180; gameTimeCounter = 0;
  generateWorldObjects();
  for (let i = 0; i < 5; i++) spawnEnemy();
}

function generateWorldObjects() {
  const types = [
    { type:'rock', color:'#444', walkable:false }, { type:'crystal', color:'#0ff', walkable:true, glow:true },
    { type:'ruins', color:'#333', walkable:false }, { type:'neon_plant', color:'#f0f', walkable:true, glow:true },
    { type:'debris', color:'#555', walkable:true }, { type:'energy', color:'#ff0', walkable:true, glow:true, pulse:true }
  ];
  for (let i = 0; i < 2000; i++) {
    const t = types[Math.floor(Math.random() * types.length)];
    worldObjects.push({
      x: Math.random() * WORLD_W, y: Math.random() * WORLD_H, type: t.type, color: t.color,
      walkable: t.walkable, glow: t.glow || false, pulse: t.pulse || false,
      size: 4 + Math.random() * 8, rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.01
    });
  }
}

function updateClassUI() {
  const c = classes[playerClass];
  document.getElementById('wName').textContent = c.name; document.getElementById('wName').style.color = c.color;
  document.getElementById('wType').textContent = c.type; document.getElementById('wType').style.color = c.color;
  document.getElementById('ab1Name').textContent = c.a1Name;
  document.getElementById('ab2Name').textContent = c.a2Name;
  document.getElementById('abRName').textContent = c.ultName;
}

function spawnEnemy() {
  const availableTypes = enemyTypes.slice(0, Math.min(enemyTypes.length, 1 + Math.floor(survivalTime / 120)));
  const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
  const angle = Math.random() * Math.PI * 2;
  const dist = 300 + Math.random() * 400;
  const totalImplants = Object.values(player.implants).reduce((a, b) => a + b, 0);
  const hpMult = 1 + (survivalTime / 180) * 0.5 + totalImplants * 0.12;
  const dmgMult = 1 + totalImplants * 0.10;
  const xpMult = 1 + totalImplants * 0.04;
  enemies.push({
    x: player.x + Math.cos(angle) * dist, y: player.y + Math.sin(angle) * dist,
    type: { ...type, dmg: Math.floor(type.dmg * dmgMult), xp: Math.floor(type.xp * xpMult) },
    hp: type.hp * hpMult, maxHp: type.hp * hpMult, size: type.size, attackCd: 0, hitFlash: 0
  });
}

function spawnBoss() {
  const angle = Math.random() * Math.PI * 2;
  const totalImplants = Object.values(player.implants).reduce((a, b) => a + b, 0);
  const hpMult = 1 + (survivalTime / 180) * 0.5 + totalImplants * 0.12;
  const dmgMult = 1 + totalImplants * 0.10;
  enemies.push({
    x: player.x + Math.cos(angle) * 400, y: player.y + Math.sin(angle) * 400,
    type: { name:'НЕКРО-БОСС', color:'#f0f', hp:400*hpMult, speed:1.0, size:35, dmg:Math.floor(25*dmgMult), xp:Math.floor(200*(1+totalImplants*0.04)), attack:'both', boss:true },
    hp: 400*hpMult, maxHp: 400*hpMult, size: 35, attackCd: 0, hitFlash: 0
  });
}

function spawnTower() {
  const totalImplants = Object.values(player.implants).reduce((a, b) => a + b, 0);
  enemies.push({
    x: 200 + Math.random() * (WORLD_W - 400), y: 200 + Math.random() * (WORLD_H - 400),
    type: { ...TOWER_TYPE, dmg: 0 },
    hp: TOWER_TYPE.hp * (1 + totalImplants * 0.12), maxHp: TOWER_TYPE.hp * (1 + totalImplants * 0.12),
    size: TOWER_TYPE.size, attackCd: 0, hitFlash: 0, towerSpawnTimer: 0
  });
  showMsg('БАШНЯ!', '#f80');
}

function spawnTowerMinion(tower) {
  const angle = Math.random() * Math.PI * 2;
  const totalImplants = Object.values(player.implants).reduce((a, b) => a + b, 0);
  const baseType = enemyTypes[Math.floor(Math.random() * 3)];
  enemies.push({
    x: tower.x + Math.cos(angle) * 30, y: tower.y + Math.sin(angle) * 30,
    type: { ...baseType, dmg: Math.floor(baseType.dmg * (1 + totalImplants * 0.10) * 0.6), towerMob: true },
    hp: baseType.hp * 0.5, maxHp: baseType.hp * 0.5, size: baseType.size, attackCd: 0, hitFlash: 0
  });
}

function getPlayerStats() {
  const c = classes[playerClass];
  return {
    attackCd: Math.max(1, Math.floor(c.attackCd / (1 + player.stats.atkSpeedPct / 100))),
    dmg: Math.floor((c.dmg + player.level * 3) * (1 + player.stats.dmgPct / 100)),
    range: c.range * (1 + player.stats.rangePct / 100),
    qCd: Math.floor(c.qCd * (1 - player.stats.qCdPct / 100)),
    eCd: Math.floor(c.eCd * (1 - player.stats.abilityCdPct / 100)),
    ultCd: Math.floor(c.ultCd * (1 - player.stats.abilityCdPct / 100)),
    atkSpeedMult: 1 + player.stats.atkSpeedPct / 100
  };
}

function applyImplantStats() {
  player.stats = { dmgPct:0, maxHpPct:0, defensePct:0, atkSpeedPct:0, rangePct:0, hpRegenPct:0, abilitiesCdPct:0, ultCdPct:0, qCdPct:0, luckPct:0 };
  for (const [id, count] of Object.entries(player.implants)) {
    const impl = IMPLANT_TYPES.find(i => i.id === id);
    if (impl) player.stats[impl.stat] += impl.base * Math.min(count, impl.maxStacks);
  }
  player.stats.defensePct = Math.min(50, player.stats.defensePct);
  player.maxHp = Math.floor((100 + (player.level - 1) * 15) * (1 + player.stats.maxHpPct / 100));
  player.hp = Math.min(player.hp, player.maxHp);
  updateImplantUI();
}

function addImplant(id) {
  const impl = IMPLANT_TYPES.find(i => i.id === id);
  if (!impl) return false;
  const currentCount = player.implants[id] || 0;
  const uniqueTypes = Object.keys(player.implants).length;
  if (currentCount === 0 && uniqueTypes >= 3 && !player.implants[id]) {
    showMsg('МАКС 3 ТИПА ИМПЛАНТОВ!', '#f00'); return false;
  }
  player.implants[id] = currentCount + 1;
  applyImplantStats();
  showMsg('ПОЛУЧЕН: ' + impl.name + ' x' + player.implants[id], impl.color);
  return true;
}