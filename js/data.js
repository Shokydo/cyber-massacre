const W = 800;
const H = 600;
let gameRunning = false;
let gamePaused = false;
let keys = {};
let isRebinding = false;
let mouse = { x: W / 2, y: H / 2, down: false };
let playerClass = 'melee';
let camera = { x: 0, y: 0 };

// === ДАЛЕЕ ИДЕТ ТВОЙ ОРИГИНАЛЬНЫЙ КОД (классы, враги и т.д.) ===
// NOTE: эти значения используются глобально в нескольких файлах.
// Если data.js случайно подгружается повторно, var/глобальные присваивания предотвращают SyntaxError.
// Avoid redeclaration crashes if this script is evaluated twice.
// Use global-safe assignments.
if (typeof window !== 'undefined') { window.W = W; window.H = H; }

// If evaluated twice, keep the same keys object.
if (typeof window !== 'undefined') window.keys = keys;
const WORLD_W = 4000;
const WORLD_H = 4000;

const player = {
  x: WORLD_W/2, y: WORLD_H/2,
  size: 14, speed: 3,
  hp: 100, maxHp: 100,
  xp: 0, xpNext: 50,
  level: 1, floor: 1, kills: 0,
  attackCd: 0, invuln: 0, angle: 0,
  dashCd: 0, dashDur: 0, dashAngle: 0,
  abilityCd1: 0, abilityCd2: 0, ultCd: 0,
  ultActive: 0, ultAngle: 0, ultCharge: 0, ultMaxCharge: 100,
  tornadoActive: 0, tornadoAngle: 0, tornadoWasActive: false,
  charging: false, chargeTime: 0, chargeStart: {x:0,y:0},
  implants: {},
  stats: { dmgPct: 0, maxHpPct: 0, defensePct: 0, atkSpeedPct: 0, rangePct: 0, hpRegenPct: 0, abilityCdPct: 0, qCdPct: 0, luckPct: 0 },
  hpRegenTimer: 0
};

const classes = {
  edgerunner: { name:'EDGERUNNER', type:'CYBORG', color:'#f0f', attackCd:12, dmg:30, range:55, qName:'DASH', eName:'WHIRLPOOL', qCd:90, eCd:360, a1Name:'VORTEX RIFLE', a2Name:'EMP GRENADE', ultName:'SANDDEVISTAN', ultCd:360 },
  netrunner: { name:'NETRUNNER', type:'HACKER', color:'#a0f', attackCd:55, dmg:45, range:220, qName:'DASH', eName:'METEOR', qCd:90, eCd:360, a1Name:'SYSTEM BREAK', a2Name:'CYBER DEMON', ultName:'BLACK WALL', ultCd:360 },
  tech: { name:'TECHNIC', type:'PILOT/DRONE', color:'#ff0', attackCd:32, dmg:30, range:500, qName:'DASH', eName:'SHIELD', qCd:90, eCd:180, a1Name:'TURRET', a2Name:'COMBAT DRONE', ultName:'EXOSUIT', ultCd:1500 }
};

let enemies = [], projectiles = [], particles = [], pickups = [], damageTexts = [];
let grenades = [], lasers = [], lightningChains = [];
let turrets = [], turretProjectiles = [], burnZones = [], damageZones = [];
let worldObjects = [], shake = 0, swordSwings = [], ability1Trails = [], ability1Impact = [];

let techSmartMarks = []; 
let techSmartShots = []; 
let nanoSwarm = []; 
let overloadedEnemies = []; 

let breachMarks = [];   
let cyberDemons = [];   
let hackedEnemies = []; 
let scatterShotActive = 0, railgunBeams = [], meleeSwingDir = 1, isFloorTransition = false;

// New variables for reworked abilities
let edgerunnerKnives = []; // { x, y, vx, vy, dmg, life, angle, target }
let edgerunnerKnifeCharges = 3;
let edgerunnerKnifeRecharge = 0;
let edgerunnerSlashAnim = 0;
let edgerunnerSlashDir = 1;

// Edgerunner new abilities
let edgerunnerWhirlwind = null; // { active, life, maxLife, angle, radius, dmg, attackCd, pullStrength }
let edgerunnerEmpGrenades = []; // { x, y, vx, vy, fuse, maxFuse, dmg, radius, stunDuration, isCluster }

let sandevistanActive = false;
let sandevistanTimer = 0;
let sandevistanDuration = 300; // 5 seconds
let sandevistanCooldown = 0;

let netrunnerMonowire = null; // { x, y, angle, length, life, targetsHit, maxLength, waveOffset }
let netrunnerCyberDemon = null; // { x, y, angle, radius, life, maxLife, shootCd, dmg }
let netrunnerBlackwallActive = false;
let netrunnerBlackwallTimer = 0;

let techieShield = { hp: 120, maxHp: 120, active: false, cooldown: 0, broken: false, regenTimer: 0 };
let techiePistolShots = []; // { x, y, angle, life, dmg }
let techieTurret = null; // { x, y, life, maxLife, shootCd, hp, maxHp, dmg, range }
let techieCombatDrone = null; // { x, y, angle, orbitRadius, life, maxLife, shootCd, dmg, range, target }
let techieExosuitActive = false;
let techieExosuitTimer = 0;
let techieExosuitTrail = []; // для трейлов движения

let survivalTime = 0, nextBossTime = 180, gameTimeCounter = 0;

const floorImg = new Image();
floorImg.src = 'https://i.ibb.co/zWKvGBRQ/screenshot-1784154231557.png';
let floorImgLoaded = false;
floorImg.onload = () => { floorImgLoaded = true; };

const enemyTypes = [
  { name:'GRUNT', color:'#f00', hp:30, speed:1.2, size:12, dmg:18, xp:10, attack:'melee', dmgVar:5 },
  { name:'ARCHER', color:'#0f0', hp:25, speed:1.5, size:11, dmg:20, xp:15, attack:'ranged', dmgVar:8 },
  { name:'BERSERKER', color:'#f80', hp:80, speed:0.7, size:18, dmg:35, xp:25, attack:'melee', dmgVar:10 },
  { name:'JUMPER', color:'#a0f', hp:40, speed:1.8, size:10, dmg:15, xp:20, attack:'melee', dmgVar:6 },
  { name:'SPEEDSTER', color:'#ff0', hp:15, speed:2.8, size:8, dmg:12, xp:8, attack:'melee', dmgVar:4 }
];

const TOWER_TYPE = { name:'БАШНЯ', color:'#f80', hp:120, speed:0, size:22, dmg:0, xp:20, attack:'ranged', dmgVar:0, tower:true };

const IMPLANT_TYPES = [
  { id:'dmg', name:'ИМПЛАНТ УРОНА', color:'#f00', stat:'dmgPct', base:5, maxStacks:10, desc:'+5% УРОНА за стек' },
  { id:'hp', name:'ИМПЛАНТ ЖИЗНИ', color:'#0f0', stat:'maxHpPct', base:5, maxStacks:10, desc:'+5% МАКС. HP за стек' },
  { id:'def', name:'ИМПЛАНТ БРОНИ', color:'#0ff', stat:'defensePct', base:1, maxStacks:50, desc:'+1% ЗАЩИТЫ за стек (50% макс)' },
  { id:'atkSpd', name:'ИМПЛАНТ СКОРОСТИ', color:'#ff0', stat:'atkSpeedPct', base:4, maxStacks:10, desc:'+4% СКОР. АТАКИ за стек' },
  { id:'range', name:'ИМПЛАНТ ДАЛЬНОСТИ', color:'#a0f', stat:'rangePct', base:5, maxStacks:8, desc:'+5% ДАЛЬНОСТИ за стек' },
  { id:'regen', name:'ИМПЛАНТ РЕГЕНА', color:'#f0f', stat:'hpRegenPct', base:2, maxStacks:20, desc:'+2% РЕГЕН/с (1 стек = пассивный реген)' },
  { id:'abCd', name:'ИМПЛАНТ КД УЛЬТЫ', color:'#ff8', stat:'ultCdPct', base:3, maxStacks:15, desc:'-3% КД УЛЬТЫ за стек' },
  { id:'abCds', name:'ИМПЛАНТ КД СПОСОБНОСТЕЙ', color:'#8ff', stat:'abilitiesCdPct', base:3, maxStacks:15, desc:'-3% КД СПОСОБНОСТЕЙ (1/2) за стек' },
  { id:'qCd', name:'ИМПЛАНТ КД РЫВКА', color:'#8ff', stat:'qCdPct', base:3, maxStacks:15, desc:'-3% КД РЫВКА за стек' },
  { id:'luck', name:'ИМПЛАНТ УДАЧИ', color:'#f8f', stat:'luckPct', base:5, maxStacks:10, desc:'+5% ШАНС ВЫПАДЕНИЯ за стек' }
];

let pendingPickup = null;
let skillMenuOpen = false;
let settingsOpen = false;

const attackTrees = {
  melee: [
    { title:'РАЗРЕЗ МЕЧОМ (ЛКМ)', skills:[
      { id:'m_atk_dmg', name:'ОСТРОТА', desc:'Урон базовой атаки +20%', cost:1, max:5, bonus:{ atkDmg:0.2 } },
      { id:'m_atk_speed', name:'БЫСТРОТА', desc:'Скорость атаки +15%', cost:1, max:5, bonus:{ atkSpeed:0.15 } },
      { id:'m_atk_range', name:'ДЛИНА КЛИНКА', desc:'Радиус атаки +25%', cost:1, max:3, bonus:{ atkRange:0.25 } },
      { id:'m_atk_crit', name:'ТОЧНОСТЬ', desc:'Шанс крита +10%', cost:2, max:3, bonus:{ atkCrit:0.1 } },
      { id:'m_atk_critdmg', name:'МОЩЬ КРИТА', desc:'Критический урон +50%', cost:2, max:3, bonus:{ atkCritDmg:0.5 } },
      { id:'m_atk_pierce', name:'ПРОБИВАНИЕ', desc:'Атака проходит сквозь врагов', cost:3, max:1, flag:true },
      { id:'m_atk_lifesteal', name:'ВАМПИРИЗМ', desc:'Восстанавливает 3% HP при попадании', cost:2, max:3, bonus:{ atkLifesteal:0.03 } },
      { id:'m_atk_double', name:'ДВОЙНОЙ УДАР', desc:'20% шанс ударить дважды', cost:3, max:1, flag:true },
      { id:'m_atk_knockback', name:'ОТБРАСЫВАНИЕ', desc:'Враги отлетают назад при попадании', cost:2, max:1, flag:true },
    ]},
  ],
  magic: [
    { title:'МОНОСТРУНА (ЛКМ)', skills:[
      { id:'ma_atk_dmg', name:'СИЛА МОНОСТРУНЫ', desc:'Урон моноструны +20%', cost:1, max:5, bonus:{ atkDmg:0.2 } },
      { id:'ma_atk_speed', name:'БЫСТРАЯ СТРУНА', desc:'Скорость атаки +15%', cost:1, max:5, bonus:{ atkSpeed:0.15 } },
      { id:'ma_atk_radius', name:'ДЛИНА СТРУНЫ', desc:'Дальность +25%', cost:1, max:3, bonus:{ atkRadius:0.25 } },
      { id:'ma_atk_crit', name:'ТОЧНЫЙ РАЗРЕЗ', desc:'Шанс крита +10%', cost:2, max:3, bonus:{ atkCrit:0.1 } },
      { id:'ma_atk_critdmg', name:'КРИТИЧЕСКИЙ РАЗРЕЗ', desc:'Критический урон +50%', cost:2, max:3, bonus:{ atkCritDmg:0.5 } },
      { id:'ma_atk_chain', name:'ЦЕПНЫЙ РАЗРЕЗ', desc:'Струна перескакивает на следующего врага', cost:3, max:1, flag:true },
      { id:'ma_atk_slow', name:'ЗАМОРАЖИВАНИЕ', desc:'Враги замедляются на 40% при попадании', cost:2, max:3, bonus:{ atkSlow:0.4 } },
      { id:'ma_atk_burn', name:'ПОДЖОГ', desc:'Враги горят 3 сек (DOT урон)', cost:2, max:3, bonus:{ atkBurn:0.15 } },
      { id:'ma_atk_double', name:'ДВОЙНОЙ РАЗРЕЗ', desc:'20% шанс двойной атаки', cost:3, max:1, flag:true },
    ]}
  ],
  tech: [
    { title:'ПИСТОЛЕТ (ЛКМ)', skills:[
      { id:'t_atk_dmg', name:'НАПОР ПИСТОЛЕТА', desc:'Урон пистолета +20%', cost:1, max:5, bonus:{ atkDmg:0.2 } },
      { id:'t_atk_speed', name:'БЫСТРАЯ ОЧЕРЕДЬ', desc:'Скорострельность +30%', cost:1, max:5, bonus:{ atkSpeed:0.3 } },
      { id:'t_atk_range', name:'ДАЛЬНОБОЙНОСТЬ', desc:'Дальность +25%', cost:1, max:3, bonus:{ atkRange:0.25 } },
      { id:'t_atk_crit', name:'КРИТИЧЕСКИЙ ВЫСТРЕЛ', desc:'Шанс крита +10%', cost:2, max:3, bonus:{ atkCrit:0.1 } },
      { id:'t_atk_critdmg', name:'РАЗЪЕМНЫЙ КАЛИБР', desc:'Критический урон +50%', cost:2, max:3, bonus:{ atkCritDmg:0.5 } },
      { id:'t_atk_pierce', name:'ПРОБИВАЮЩИЕ ПУЛИ', desc:'Пули проходят сквозь врагов', cost:3, max:1, flag:true },
      { id:'t_atk_ricochet', name:'РИКОШЕТ', desc:'Пули отскакивают к ближайшим врагам', cost:3, max:1, flag:true },
      { id:'t_atk_blind', name:'ОСЛЕПЛЕНИЕ ВСПЫШКОЙ', desc:'Враги промахиваются 3 сек при попадании', cost:2, max:3, bonus:{ atkBlind:3 } },
    ]}
  ]
};

const skillTrees = {
  melee: [
    { title:'ВРАЩАЮЩИЙСЯ КЛИНОК (1)', skills:[
      { id:'e_a1_dmg', name:'ОСТРОТА КЛИНКОВ', desc:'Урон вращения +20%', cost:1, max:5, bonus:{ a1Dmg:0.2 } },
      { id:'e_a1_duration', name:'ДОЛГОЕ ВРАЩЕНИЕ', desc:'Длительность +0.5 сек', cost:1, max:3, bonus:{ a1Duration:30 } },
      { id:'e_a1_radius', name:'ШИРОКИЙ РАДИУС', desc:'Радиус атаки +25%', cost:1, max:3, bonus:{ a1Radius:0.25 } },
      { id:'e_a1_cd', name:'БЫСТРЫЙ ОТКАТ', desc:'КД -15%', cost:2, max:3, bonus:{ a1Cd:0.15 } },
    ]},
    { title:'ЭМИ-ГРАНАТА (2)', skills:[
      { id:'e_a2_dmg', name:'МОЩНЫЙ ВЗРЫВ', desc:'Урон гранаты +25%', cost:1, max:5, bonus:{ a2Dmg:0.25 } },
      { id:'e_a2_radius', name:'ШИРОКИЙ РАДИУС', desc:'Радиус взрыва +20%', cost:1, max:3, bonus:{ a2Radius:0.2 } },
      { id:'e_a2_stun', name:'ДОЛГОЕ ОТКЛЮЧЕНИЕ', desc:'Оглушение +1 сек', cost:2, max:3, bonus:{ a2Stun:60 } },
      { id:'e_a2_cluster', name:'КАССЕТНАЯ ГРАНАТА', desc:'Граната делится на 3 при взрыве', cost:3, max:1, flag:true },
      { id:'e_a2_cd', name:'БЫСТРАЯ ПЕРЕЗАРЯДКА', desc:'КД -20%', cost:2, max:3, bonus:{ a2Cd:0.2 } },
    ]},
    { title:'САНДЕВИСТАН (УЛЬТА)', skills:[
      { id:'e_ult_duration', name:'РАСШИРЕННОЕ ВРЕМЯ', desc:'Длительность +1.5 сек', cost:1, max:3, bonus:{ ultDuration:90 } },
      { id:'e_ult_slow', name:'ГИПЕР-ЗАМЕДЛЕНИЕ', desc:'Замедление врагов +5%', cost:1, max:3, bonus:{ ultSlow:0.05 } },
      { id:'e_ult_dmg', name:'ХРОНО-УСИЛЕНИЕ', desc:'Урон во время ульты +15%', cost:2, max:3, bonus:{ ultDmg:0.15 } },
      { id:'e_ult_speed', name:'СУПЕР-СКОРОСТЬ', desc:'Скорость игрока +20%', cost:2, max:3, bonus:{ ultSpeed:0.2 } },
      { id:'e_ult_cd', name:'БЫСТРЫЙ ПЕРЕЗАПУСК', desc:'КД ульты -20%', cost:2, max:3, bonus:{ ultCd:0.2 } },
      { id:'e_ult_freeze', name:'ВРЕМЕННАЯ ЛОВУШКА', desc:'Враги замирают на 0.5 сек', cost:3, max:1, flag:true },
    ]}
  ],
  magic: [
    { title:'КИБЕР-ВЗЛОМ (1)', skills:[
      { id:'ma_a1_dmg', name:'СИЛА ВЗЛОМА', desc:'Урон +20%', cost:1, max:5, bonus:{ a1Dmg:0.2 } },
      { id:'ma_a1_radius', name:'РАДИУС ВЗЛОМА', desc:'Радиус +25%', cost:1, max:3, bonus:{ a1Radius:0.25 } },
      { id:'ma_a1_stun', name:'ГЛУБ. ВЗЛОМ', desc:'Оглушение +1 сек', cost:2, max:3, bonus:{ a1Stun:1 } },
      { id:'ma_a1_vuln', name:'УЯЗВИМОСТЬ', desc:'Враги получают +10% урона', cost:2, max:3, bonus:{ a1Vuln:0.1 } },
    ]},
    { title:'КИБЕР-ДЕМОН (2)', skills:[
      { id:'ma_a2_dmg', name:'СИЛА ДЕМОНА', desc:'Урон +20%', cost:1, max:5, bonus:{ a2Dmg:0.2 } },
      { id:'ma_a2_duration', name:'ВРЕМЯ ЖИЗНИ', desc:'Длительность +2 сек', cost:1, max:3, bonus:{ a2Duration:60 } },
      { id:'ma_a2_speed', name:'БЫСТРЫЙ АТАКИ', desc:'Скорость атаки +25%', cost:2, max:3, bonus:{ a2Speed:0.25 } },
      { id:'ma_a2_count', name:'ВТОРОЙ ДЕМОН', desc:'+1 демон', cost:3, max:1, flag:true },
    ]},
    { title:'ЧЁРНАЯ СТЕНА (УЛЬТА)', skills:[
      { id:'ma_u_dmg', name:'МОЩЬ ВЗЛОМА', desc:'Урон +25%', cost:1, max:5, bonus:{ ultDmg:0.25 } },
      { id:'ma_u_bounce', name:'ЦЕПНАЯ РЕАКЦИЯ', desc:'+3 отскока', cost:1, max:3, bonus:{ ultBounce:3 } },
      { id:'ma_u_stun', name:'ПАРАЛИЧ', desc:'Оглушение +1 сек', cost:2, max:3, bonus:{ ultStun:60 } },
      { id:'ma_u_duration', name:'ДОЛГ. ШТОРМ', desc:'Длительность +1 сек', cost:2, max:3, bonus:{ ultDuration:60 } },
    ]}
  ],
  tech: [
    { title:'ТУРЕЛЬ (1)', skills:[
      { id:'t_a1_dmg', name:'УСИЛ. ВООРУЖ.', desc:'Урон турели +25%', cost:1, max:5, bonus:{ a1Dmg:0.25 } },
      { id:'t_a1_hp', name:'БРОНИРОВАНИЕ', desc:'HP турели +30%', cost:1, max:3, bonus:{ a1Hp:0.3 } },
      { id:'t_a1_duration', name:'ДОЛГ. СЛУЖБА', desc:'Длительность +2 сек', cost:1, max:3, bonus:{ a1Duration:120 } },
      { id:'t_a1_speed', name:'СКОРОСТРЕЛ', desc:'Скорострельность +20%', cost:2, max:3, bonus:{ a1Speed:0.2 } },
      { id:'t_a1_cd', name:'БЫСТРЫЙ МОНТАЖ', desc:'КД турели -15%', cost:2, max:3, bonus:{ a1Cd:0.15 } },
    ]},
    { title:'БОЕВОЙ ДРОН (2)', skills:[
      { id:'t_a2_dmg', name:'ЛАЗЕРНЫЙ МОДУЛЬ', desc:'Урон дрона +20%', cost:1, max:5, bonus:{ a2Dmg:0.2 } },
      { id:'t_a2_duration', name:'БАТАРЕЯ', desc:'Длительность +2 сек', cost:1, max:3, bonus:{ a2Duration:120 } },
      { id:'t_a2_speed', name:'БЫСТРЫЙ ПРИЦЕЛ', desc:'Скорость атаки +25%', cost:2, max:3, bonus:{ a2Speed:0.25 } },
      { id:'t_a2_count', name:'ВТОРОЙ ДРОН', desc:'+1 дрон', cost:3, max:1, flag:true },
      { id:'t_a2_cd', name:'БЫСТРЫЙ ЗАПУСК', desc:'КД дрона -20%', cost:2, max:3, bonus:{ a2Cd:0.2 } },
    ]},
    { title:'МЕХ-КОСТЮМ (УЛЬТА)', skills:[
      { id:'t_u_duration', name:'УСИЛ. АККУМ.', desc:'Длительность +2 сек', cost:1, max:3, bonus:{ ultDuration:120 } },
      { id:'t_u_dmg', name:'БОЕВ. МОДУЛЬ', desc:'Урон +20%', cost:1, max:3, bonus:{ ultDmg:0.2 } },
      { id:'t_u_speed', name:'СЕРВОПРИВОДЫ', desc:'Скорость +15%', cost:2, max:3, bonus:{ ultSpeed:0.15 } },
      { id:'t_u_regen', name:'НАНОРЕГЕН', desc:'Реген HP 2%/сек', cost:2, max:3, flag:true },
      { id:'t_u_cd', name:'БЫСТРЫЙ ОТКАТ', desc:'КД -20%', cost:2, max:3, bonus:{ ultCd:0.2 } },
    ]}
  ]
};