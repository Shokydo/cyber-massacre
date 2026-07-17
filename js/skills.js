const abilitiesData = {
  melee: [
    { name:'ВРАЩ. КЛИНОК', color:'#00f3ff', nodes:[
      { cost:2, effect:{a1Dmg:0.15}, desc:'+15% УРОН ВРАЩЕНИЯ' },
      { cost:3, effect:{a1Radius:0.20}, desc:'+20% РАДИУС' },
      { cost:4, effect:{a1Dmg:0.20}, desc:'+20% УРОН ВРАЩЕНИЯ' },
      { cost:5, effect:{a1Duration:30}, desc:'+0.5 СЕК ДЛИТЕЛЬНОСТЬ' },
      { cost:3, effect:{a1Cd:0.10}, desc:'-10% КД' },
      { cost:4, effect:{a1Radius:0.25}, desc:'+25% РАДИУС' },
      { cost:5, effect:{a1Dmg:0.25}, desc:'+25% УРОН ВРАЩЕНИЯ' },
      { cost:6, effect:{a1Dmg:0.30, a1Radius:0.30}, desc:'+30% УРОН И РАДИУС' }
    ]},
    { name:'ЭМИ-ГРАНАТА', color:'#ff00ff', nodes:[
      { cost:2, effect:{a2Dmg:0.15}, desc:'+15% УРОН ВЗРЫВА' },
      { cost:3, effect:{a2Radius:0.20}, desc:'+20% РАДИУС ВЗРЫВА' },
      { cost:4, effect:{a2Dmg:0.20}, desc:'+20% УРОН ВЗРЫВА' },
      { cost:5, effect:{a2Stun:60}, desc:'+1 СЕК ОГЛУШЕНИЕ' },
      { cost:3, effect:{a2Cd:0.10}, desc:'-10% КД' },
      { cost:4, effect:{a2Radius:0.25}, desc:'+25% РАДИУС ВЗРЫВА' },
      { cost:5, effect:{a2Dmg:0.25}, desc:'+25% УРОН ВЗРЫВА' },
      { cost:6, effect:{a2Dmg:0.30, a2Cluster:true}, desc:'+30% УРОН, КАССЕТНАЯ ГРАНАТА' }
    ]},
    { name:'САНДЕВИСТАН', color:'#fcee0a', nodes:[
      { cost:2, effect:{ultDuration:60}, desc:'+1 СЕК ДЛИТЕЛЬНОСТЬ' },
      { cost:3, effect:{ultSlow:0.05}, desc:'+5% ЗАМЕДЛЕНИЕ ВРАГОВ' },
      { cost:4, effect:{ultDmg:0.10}, desc:'+10% УРОН ВО ВРЕМЯ УЛЬТЫ' },
      { cost:5, effect:{ultSpeed:0.10}, desc:'+10% СКОРОСТЬ ИГРОКА' },
      { cost:3, effect:{ultDuration:60}, desc:'+1 СЕК ДЛИТЕЛЬНОСТЬ' },
      { cost:4, effect:{ultCd:0.10}, desc:'-10% КД УЛЬТЫ' },
      { cost:5, effect:{ultDmg:0.15}, desc:'+15% УРОН ВО ВРЕМЯ УЛЬТЫ' },
      { cost:6, effect:{ultDuration:90, ultSlow:0.10}, desc:'+1.5 СЕК, +10% ЗАМЕДЛЕНИЕ' }
    ]}
  ],
  magic: [
    { name:'КИБЕР-ВЗЛОМ', color:'#ff00ff', nodes:[
      { cost:2, effect:{a1Dmg:0.15}, desc:'+15% УРОН ВЗЛОМА' },
      { cost:3, effect:{a1Radius:0.20}, desc:'+20% РАДИУС ВЗЛОМА' },
      { cost:4, effect:{a1Dmg:0.20}, desc:'+20% УРОН ВЗЛОМА' },
      { cost:5, effect:{a1Stun:1}, desc:'+1 СЕК ОГЛУШЕНИЕ' },
      { cost:3, effect:{a1Cd:0.10}, desc:'-10% КД' },
      { cost:4, effect:{a1Radius:0.25}, desc:'+25% РАДИУС ВЗЛОМА' },
      { cost:5, effect:{a1Dmg:0.25}, desc:'+25% УРОН ВЗЛОМА' },
      { cost:6, effect:{a1Dmg:0.30, a1Vuln:0.15}, desc:'+30% УРОН, +15% УЯЗВИМОСТЬ' }
    ]},
    { name:'КИБЕР-ДЕМОН', color:'#00ff9d', nodes:[
      { cost:2, effect:{a2Dmg:0.15}, desc:'+15% УРОН ДЕМОНА' },
      { cost:3, effect:{a2Duration:60}, desc:'+2 СЕК ДЛИТЕЛЬНОСТЬ' },
      { cost:4, effect:{a2Dmg:0.20}, desc:'+20% УРОН ДЕМОНА' },
      { cost:5, effect:{a2Speed:0.15}, desc:'+15% СКОРОСТЬ АТАКИ' },
      { cost:3, effect:{a2Cd:0.10}, desc:'-10% КД' },
      { cost:4, effect:{a2Duration:90}, desc:'+3 СЕК ДЛИТЕЛЬНОСТЬ' },
      { cost:5, effect:{a2Dmg:0.25}, desc:'+25% УРОН ДЕМОНА' },
      { cost:6, effect:{a2Dmg:0.30, a2Count:1}, desc:'+30% УРОН, +1 ДЕМОН' }
    ]},
    { name:'ЧЁРНАЯ СТЕНА', color:'#00f3ff', nodes:[
      { cost:2, effect:{ultDmg:0.15}, desc:'+15% УРОН СТЕНЫ' },
      { cost:3, effect:{ultBounce:2}, desc:'+2 ОТСКОКА' },
      { cost:4, effect:{ultDmg:0.20}, desc:'+20% УРОН СТЕНЫ' },
      { cost:5, effect:{ultStun:60}, desc:'+1 СЕК ОГЛУШЕНИЕ' },
      { cost:3, effect:{ultDuration:60}, desc:'+2 СЕК ДЛИТЕЛЬНОСТЬ' },
      { cost:4, effect:{ultBounce:3}, desc:'+3 ОТСКОКА' },
      { cost:5, effect:{ultDmg:0.25}, desc:'+25% УРОН СТЕНЫ' },
      { cost:6, effect:{ultDmg:0.30, ultBounce:4}, desc:'+30% УРОН, +4 ОТСКОКА' }
    ]}
  ],
  tech: [
    { name:'ТУРЕЛЬ', color:'#fcee0a', nodes:[
      { cost:2, effect:{a1Dmg:0.15}, desc:'+15% УРОН ТУРЕЛИ' },
      { cost:3, effect:{a1Hp:0.20}, desc:'+20% HP ТУРЕЛИ' },
      { cost:4, effect:{a1Dmg:0.20}, desc:'+20% УРОН ТУРЕЛИ' },
      { cost:5, effect:{a1Duration:60}, desc:'+2 СЕК ДЛИТЕЛЬНОСТЬ' },
      { cost:3, effect:{a1Speed:0.10}, desc:'+10% СКОРОСТРЕЛЬНОСТЬ' },
      { cost:4, effect:{a1Hp:0.30}, desc:'+30% HP ТУРЕЛИ' },
      { cost:5, effect:{a1Dmg:0.25}, desc:'+25% УРОН ТУРЕЛИ' },
      { cost:6, effect:{a1Dmg:0.30, a1Speed:0.20}, desc:'+30% УРОН, +20% СКОРОСТРЕЛ' }
    ]},
    { name:'БОЕВОЙ ДРОН', color:'#00f3ff', nodes:[
      { cost:2, effect:{a2Dmg:0.15}, desc:'+15% УРОН ДРОНА' },
      { cost:3, effect:{a2Duration:60}, desc:'+2 СЕК ДЛИТЕЛЬНОСТЬ' },
      { cost:4, effect:{a2Dmg:0.20}, desc:'+20% УРОН ДРОНА' },
      { cost:5, effect:{a2Speed:0.15}, desc:'+15% СКОРОСТЬ АТАКИ' },
      { cost:3, effect:{a2Cd:0.10}, desc:'-10% КД' },
      { cost:4, effect:{a2Duration:90}, desc:'+3 СЕК ДЛИТЕЛЬНОСТЬ' },
      { cost:5, effect:{a2Dmg:0.25}, desc:'+25% УРОН ДРОНА' },
      { cost:6, effect:{a2Dmg:0.30, a2Count:1}, desc:'+30% УРОН, +1 ДРОН' }
    ]},
    { name:'МЕХ-КОСТЮМ', color:'#ff00ff', nodes:[
      { cost:2, effect:{ultDuration:60}, desc:'+2 СЕК ДЛИТЕЛЬНОСТЬ' },
      { cost:3, effect:{ultDmg:0.10}, desc:'+10% УРОН КОСТЮМА' },
      { cost:4, effect:{ultDuration:60}, desc:'+2 СЕК ДЛИТЕЛЬНОСТЬ' },
      { cost:5, effect:{ultSpeed:0.10}, desc:'+10% СКОРОСТЬ КОСТЮМА' },
      { cost:3, effect:{ultDmg:0.15}, desc:'+15% УРОН КОСТЮМА' },
      { cost:4, effect:{ultCd:0.10}, desc:'-10% КД' },
      { cost:5, effect:{ultSpeed:0.15}, desc:'+15% СКОРОСТЬ КОСТЮМА' },
      { cost:6, effect:{ultDmg:0.20, ultDuration:90}, desc:'+20% УРОН, +3 СЕК' }
    ]}
  ]
};

const abilityLevels = {};
let currentAbility = 0;

function resetAbilityLevels() {
  for (const cls of ['melee','magic','tech']) {
    abilityLevels[cls] = [];
    for (let a = 0; a < 3; a++) {
      abilityLevels[cls][a] = [0,0,0,0,0,0,0,0];
    }
  }
}
resetAbilityLevels();

function getTotalAbilityLevel(cls, abilityIdx) {
  return abilityLevels[cls][abilityIdx].reduce((s,v)=>s+v, 0);
}

function getAbilityBonuses(cls) {
  const bonuses = {};
  const data = abilitiesData[cls];
  for (let a = 0; a < 3; a++) {
    const levels = abilityLevels[cls][a];
    for (let n = 0; n < 8; n++) {
      if (levels[n] <= 0) continue;
      const node = data[a].nodes[n];
      for (const [k,v] of Object.entries(node.effect)) {
        if (typeof v === 'boolean') {
          bonuses[k] = v;
        } else {
          bonuses[k] = (bonuses[k] || 0) + v * levels[n];
        }
      }
    }
  }
  return bonuses;
}

function toggleSkillMenu() {
  if (!gameRunning || settingsOpen) return;
  skillMenuOpen = !skillMenuOpen;
  const menu = document.getElementById('skillMenu');
  if (skillMenuOpen) {
    playSound('ui_menu_open');
    gamePaused = true;
    menu.classList.add('show');
    updateSkillMenuUI();
  } else {
    playSound('ui_menu_close');
    gamePaused = false;
    menu.classList.remove('show');
  }
}

function changeAbility(dir) {
  currentAbility = (currentAbility + 3 + dir) % 3;
  playSound('ui_click');
  updateSkillMenuUI();
}

function canUpgradeNode(nodeIdx) {
  const levels = abilityLevels[playerClass][currentAbility];
  if (levels[nodeIdx] >= 2) return false;
  if (nodeIdx > 0 && levels[nodeIdx - 1] <= 0) return false;
  const cost = abilitiesData[playerClass][currentAbility].nodes[nodeIdx].cost;
  return player.skillPoints >= cost;
}

function upgradeNode(nodeIdx) {
  const levels = abilityLevels[playerClass][currentAbility];
  if (!canUpgradeNode(nodeIdx)) {
    playSound('ui_error');
    return;
  }
  const node = abilitiesData[playerClass][currentAbility].nodes[nodeIdx];
  player.skillPoints -= node.cost;
  levels[nodeIdx]++;
  playSound('ui_skill_buy');
  updateSkillMenuUI();
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function updateSkillMenuUI() {
  const data = abilitiesData[playerClass][currentAbility];
  const levels = abilityLevels[playerClass][currentAbility];
  const col = data.color;

  document.getElementById('abilityName').textContent = data.name;
  document.getElementById('abilityName').style.color = col;
  document.getElementById('abilityName').style.textShadow = `0 0 20px ${col}`;
  document.getElementById('totalAbilityLevel').textContent = getTotalAbilityLevel(playerClass, currentAbility);

  document.getElementById('currentXP').textContent = player.xp;
  document.getElementById('nextLevelXP').textContent = player.xpNext;
  document.getElementById('modalSkillPoints').textContent = player.skillPoints;

  const stops = document.querySelectorAll('#lineGradient stop');
  stops[0].style.stopColor = col;
  stops[1].style.stopColor = hexToRgba(col, 0.3);
  stops[2].style.stopColor = col;

  const nodes = document.querySelectorAll('.skill-node');
  nodes.forEach((el, i) => {
    const lvl = levels[i];
    const maxed = lvl >= 2;
    const prevOk = i === 0 || levels[i - 1] > 0;
    const unlocked = lvl > 0;

    el.classList.remove('unlocked', 'maxed', 'locked');
    if (maxed) el.classList.add('maxed');
    else if (unlocked) el.classList.add('unlocked');
    else if (!prevOk) el.classList.add('locked');

    el.style.borderColor = maxed ? 'var(--neon-green)' : unlocked ? col : prevOk ? col : '#333';
    el.style.boxShadow = maxed ? '0 0 25px rgba(0,255,157,0.5)' :
                         unlocked ? `0 0 20px ${hexToRgba(col,0.4)}` : 'none';
    el.style.background = maxed ? 'rgba(0,255,157,0.15)' :
                          unlocked ? hexToRgba(col, 0.15) : 'rgba(10,15,30,0.9)';

    el.querySelector('.node-cost').textContent = maxed ? 'МАКС' : data.nodes[i].cost;
    el.querySelector('.node-cost').style.color = maxed ? 'var(--neon-green)' : 'var(--neon-yellow)';
    el.querySelector('.node-level').textContent = `${lvl}/2`;

    el.onclick = (!maxed && prevOk) ? ((idx => () => upgradeNode(idx))(i)) : null;

    el.onmouseenter = (e) => showTooltip(e, data.nodes[i].desc, maxed, prevOk, data.nodes[i].cost, lvl, col);
    el.onmouseleave = hideTooltip;
    el.onmousemove = moveTooltip;
  });
}

let tooltipEl = null;

function showTooltip(e, desc, maxed, prevOk, cost, lvl, col) {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'skill-tooltip';
    document.body.appendChild(tooltipEl);
  }
  let status = '';
  if (maxed) status = '<div class="tooltip-stats" style="color:var(--neon-green)">МАКСИМАЛЬНЫЙ УРОВЕНЬ</div>';
  else if (!prevOk) status = '<div class="tooltip-stats" style="color:var(--neon-red)">ТРЕБУЕТСЯ ПРЕДЫДУЩИЙ УРОВЕНЬ</div>';
  else status = `<div class="tooltip-stats">СТОИМОСТЬ: <span style="color:var(--neon-yellow)">${cost} ОЧ.</span></div>`;

  tooltipEl.style.borderColor = col;
  tooltipEl.style.boxShadow = `0 0 30px ${hexToRgba(col, 0.4)}`;
  tooltipEl.innerHTML = `<div class="tooltip-name" style="color:${col};text-shadow:0 0 8px ${col}">${desc}</div>${status}`;
  tooltipEl.style.display = 'block';
  moveTooltip(e);
}

function moveTooltip(e) {
  if (!tooltipEl) return;
  const pad = 15;
  let x = e.clientX + pad;
  let y = e.clientY + pad;
  if (x + 300 > window.innerWidth) x = e.clientX - 300 - pad;
  if (y + 120 > window.innerHeight) y = e.clientY - 120 - pad;
  tooltipEl.style.left = x + 'px';
  tooltipEl.style.top = y + 'px';
}

function hideTooltip() {
  if (tooltipEl) tooltipEl.style.display = 'none';
}

function getSkillLevel(id) { return player.skills[id] || 0; }

function getSkillBonus(key) {
  let total = 0;
  const tree = skillTrees[playerClass];
  if (tree) {
    tree.forEach(branch => {
      branch.skills.forEach(skill => {
        if (skill.bonus && skill.bonus[key]) {
          total += skill.bonus[key] * getSkillLevel(skill.id);
        }
      });
    });
  }
  const ab = getAbilityBonuses(playerClass);
  if (ab[key]) total += ab[key];
  return total;
}

function getAttackBonus(key) {
  let total = 0;
  const tree = attackTrees[playerClass];
  if (!tree) return 0;
  tree.forEach(branch => {
    branch.skills.forEach(skill => {
      if (skill.bonus && skill.bonus[key]) {
        total += skill.bonus[key] * getSkillLevel(skill.id);
      }
    });
  });
  return total;
}

function getAbilityBonus(key) {
  const ab = getAbilityBonuses(playerClass);
  return ab[key] || 0;
}
