function tryAttack() {
  if (!gameRunning || gamePaused || player.attackCd > 0) return;

  const stats = getPlayerStats();
  const c = classes[playerClass];

  const atkDmgBonus = 1 + getAttackBonus('atkDmg');
  const atkSpeedBonus = 1 + getAttackBonus('atkSpeed');
  const atkRangeBonus = 1 + getAttackBonus('atkRange');
  const atkCritChance = getAttackBonus('atkCrit');
  const atkCritDmg = 1 + getAttackBonus('atkCritDmg');

  const hasPierce = getSkillLevel(playerClass === 'edgerunner' ? 'm_atk_pierce' : (playerClass === 'netrunner' ? 'ma_atk_chain' : 't_atk_pierce')) > 0;
  const hasLifesteal = getSkillLevel(playerClass === 'edgerunner' ? 'm_atk_lifesteal' : null) > 0;
  const atkLifesteal = getAttackBonus('atkLifesteal');
  const hasDouble = getSkillLevel(playerClass === 'edgerunner' ? 'm_atk_double' : (playerClass === 'netrunner' ? 'ma_atk_double' : 't_atk_overheat')) > 0;

  player.attackCd = Math.floor(stats.attackCd / Math.max(0.6, atkSpeedBonus));
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  const doHit = (e, baseDmg) => {
    const isCrit = Math.random() < atkCritChance;
    const finalDmg = isCrit ? baseDmg * atkCritDmg : baseDmg;
    damageEnemy(e, finalDmg, isCrit);
    if (hasLifesteal && atkLifesteal > 0) {
      const heal = Math.max(1, Math.floor(finalDmg * atkLifesteal));
      player.hp = Math.min(player.maxHp, player.hp + heal);
    }
    return isCrit;
  };

  const maybeSecond = () => {
    if (hasDouble && Math.random() < 0.2) return true;
    return false;
  };

  if (playerClass === 'edgerunner') {
    // ЭДЖРАННЕР - ЛКМ: Анимированный разрез мечом
    edgerunnerSlashAnim = 20; // длительность анимации в кадрах
    edgerunnerSlashDir *= -1;
    shake = 4;
    
    // Проверка попаданий по дуге (каждый враг получает не более 1 попадания за взмах)
    const slashRadius = stats.range * atkRangeBonus;
    const arcAngle = Math.PI * 0.6; // ~108 градусов
    const startAngle = player.angle - arcAngle/2 + (edgerunnerSlashDir > 0 ? 0 : arcAngle);
    const hitEnemies = [];
    
    for (let i = 0; i <= 12; i++) {
      const progress = i / 12;
      const a = startAngle + arcAngle * progress * edgerunnerSlashDir;
      const ex = player.x + Math.cos(a) * slashRadius;
      const ey = player.y + Math.sin(a) * slashRadius;
      
      enemies.forEach(e => {
        if (e.dead || hitEnemies.includes(e)) return;
        if (dist(e.x, e.y, ex, ey) < 40 + e.size * 0.5) {
          hitEnemies.push(e);
          doHit(e, stats.dmg * atkDmgBonus);
          // ОТБРАСЫВАНИЕ (навык из дерева атаки)
          if (getSkillLevel('m_atk_knockback') > 0) {
            e.x += Math.cos(player.angle) * 40;
            e.y += Math.sin(player.angle) * 40;
          }
        }
      });
    }
    
    // ДВОЙНОЙ УДАР: 20% шанс повторить урон по задетым врагам
    if (hasDouble && Math.random() < 0.2) {
      hitEnemies.forEach(e => { if (!e.dead) doHit(e, stats.dmg * atkDmgBonus); });
    }
    
    // Частицы разреза
    for (let i = 0; i < 15; i++) {
      const progress = i / 15;
      const a = startAngle + arcAngle * progress * edgerunnerSlashDir;
      particles.push({ 
        x: player.x + Math.cos(a) * slashRadius * 0.6, 
        y: player.y + Math.sin(a) * slashRadius * 0.6, 
        vx: Math.cos(a) * 2 + (Math.random()-0.5)*3, 
        vy: Math.sin(a) * 2 + (Math.random()-0.5)*3, 
        life: 20, color: c.color, size: 4 
      });
    }
    
    // Trail анимация
    const trailAngles = [];
    for (let i = 0; i <= 12; i++) {
      const progress = i / 12;
      const a = startAngle + arcAngle * progress * edgerunnerSlashDir;
      trailAngles.push(a);
    }
    swordSwings.push({ 
      range: slashRadius, 
      life: 20, 
      maxLife: 20, 
      angles: trailAngles, 
      dir: edgerunnerSlashDir,
      isSlash: true
    });
    
    playSound('edgerunner');
    
  } else if (playerClass === 'netrunner') {
    // НЕТРАННЕР - ЛКМ: Моноструна (хлыст/змейка)
    const baseDmg = stats.dmg * atkDmgBonus;
    const startDist = 20;
    
    netrunnerMonowire = {
      x: player.x + Math.cos(player.angle) * startDist,
      y: player.y + Math.sin(player.angle) * startDist,
      angle: player.angle,
      length: 0,
      maxLength: stats.range * (1 + getAttackBonus('atkRadius') || 0),
      life: 15,
      maxLife: 15,
      targetsHit: new Set(),
      waveOffset: 0,
      segments: 24,
      damage: baseDmg
    };
    
    shake = 3;
    playSound('ability1');
    
    // Частицы при запуске
    for (let i = 0; i < 12; i++) {
      const a = player.angle + (Math.random() - 0.5) * 0.5;
      particles.push({
        x: player.x + Math.cos(a) * startDist,
        y: player.y + Math.sin(a) * startDist,
        vx: Math.cos(a) * (Math.random() * 3 + 1),
        vy: Math.sin(a) * (Math.random() * 3 + 1),
        life: 12,
        color: '#a0f',
        size: 4
      });
    }
    
  } else if (playerClass === 'tech') {
    // ТЕХНИК - ЛКМ: Пистолет
    const exosuitMult = player.exosuitDmgMult || 1;
    const baseDmg = Math.floor(stats.dmg * atkDmgBonus * exosuitMult);
    const shotSpeed = 14;
    const spread = 0.05;
    const shotAngle = player.angle + (Math.random() - 0.5) * spread;
    
    const isCrit = Math.random() < atkCritChance;
    const finalDmg = isCrit ? Math.floor(baseDmg * atkCritDmg) : baseDmg;
    
    techiePistolShots.push({
      x: player.x,
      y: player.y,
      angle: shotAngle,
      dmg: finalDmg,
      life: 50,
      speed: shotSpeed,
      isCrit: isCrit,
      traveled: 0
    });
    
    // Muzzle flash
    for (let i = 0; i < 8; i++) {
      particles.push({ 
        x: player.x + Math.cos(player.angle) * 20, 
        y: player.y + Math.sin(player.angle) * 20, 
        vx: Math.cos(shotAngle) * (Math.random() * 3 + 2) + (Math.random()-0.5)*2, 
        vy: Math.sin(shotAngle) * (Math.random() * 3 + 2) + (Math.random()-0.5)*2, 
        life: 10, color: '#ff0', size: 3 
      });
    }
    
    shake = 2;
    playSound('shoot');
  }
}

function fireCharged() {
  if (!gameRunning || gamePaused) return;
  player.charging = false;
  document.getElementById('chargeBar').style.display = 'none';
  if (player.attackCd > 0) { player.chargeTime = 0; return; }
  const stats = getPlayerStats();
  const c = classes[playerClass];
  const charge = Math.min(player.chargeTime / 90, 1);
  player.chargeTime = 0;
  if (charge < 0.1) return;
  player.attackCd = stats.attackCd;
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const dmg = stats.dmg * (0.3 + charge * 0.7);
  const endX = player.x + Math.cos(player.angle) * stats.range;
  const endY = player.y + Math.sin(player.angle) * stats.range;
  lasers.push({ x1: player.x, y1: player.y, x2: endX, y2: endY, color: c.color, life: 15, width: 4 + charge * 8 });
  enemies.forEach(e => { if (pointLineDist(e.x, e.y, player.x, player.y, endX, endY) < e.size + 10) damageEnemy(e, dmg); });
  shake = 3 + charge * 8;
  for (let i = 0; i < 20; i++) particles.push({ x: endX, y: endY, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 25, color: c.color, size: 3 });
  playSound('laser');
}

function tryDash() {
  if (!gameRunning || gamePaused || player.dashCd > 0 || player.dashDur > 0) return;
  const stats = getPlayerStats();
  player.dashCd = stats.qCd; player.dashDur = 15;
  let dx = 0, dy = 0;
  if (keys['w'] || keys['ц']) dy -= 1;
  if (keys['s'] || keys['ы']) dy += 1;
  if (keys['a'] || keys['ф']) dx -= 1;
  if (keys['d'] || keys['в']) dx += 1;
  if (dx === 0 && dy === 0) { dx = Math.cos(player.angle); dy = Math.sin(player.angle); }
  else { const l = Math.hypot(dx,dy); dx /= l; dy /= l; }
  player.dashAngle = Math.atan2(dy, dx);
  player.invuln = 20; shake = 3; playSound('charge');
  for (let i = 0; i < 15; i++) particles.push({ x: player.x, y: player.y, vx: -dx*2 + (Math.random()-0.5), vy: -dy*2 + (Math.random()-0.5), life: 20, color: '#0ff', size: 3 });
}

function throwKnife() {
  if (!gameRunning || gamePaused) return;
  if (edgerunnerKnifeCharges <= 0 || edgerunnerKnifeRecharge > 0) return;
  
  const stats = getPlayerStats();
  const c = classes[playerClass];
  
  const a2DmgBonus = 1 + getSkillBonus('a2Dmg');
  const a2SpeedBonus = 1 + getSkillBonus('a2Speed');
  
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  const speed = 14 * a2SpeedBonus;
  const dmg = Math.floor(stats.dmg * 0.6 * a2DmgBonus);
  
  edgerunnerKnives.push({
    x: player.x,
    y: player.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle: angle,
    dmg: dmg,
    life: 60,
    maxLife: 60,
    size: 6,
    rotation: 0
  });
  
  edgerunnerKnifeCharges--;
  
  if (edgerunnerKnifeCharges <= 0) {
    edgerunnerKnifeRecharge = 90; // 1.5 секунды
  }
  
  shake = 4;
  playSound('shoot');
  
  // Visual effect
  for (let i = 0; i < 5; i++) {
    particles.push({ 
      x: player.x + Math.cos(angle) * 15, 
      y: player.y + Math.sin(angle) * 15, 
      vx: Math.cos(angle) * (speed * 0.3) + (Math.random()-0.5)*2, 
      vy: Math.sin(angle) * (speed * 0.3) + (Math.random()-0.5)*2, 
      life: 10, 
      color: '#0ff', 
      size: 3 
    });
  }
}

function tryAbility1() {
  if (!gameRunning || gamePaused || player.abilityCd1 > 0) return;
  playSound('ability1');
  const stats = getPlayerStats();
  const c = classes[playerClass];

  if (playerClass === 'edgerunner') {
    // ЭДЖРАННЕР: ВРАЩАЮЩИЙСЯ КЛИНОК (1)
    const a1DmgBonus = 1 + getSkillBonus('a1Dmg');
    const a1DurationBonus = 1 + getSkillBonus('a1Duration') / 90;
    const a1RadiusBonus = 1 + getSkillBonus('a1Radius');
    const a1CdBonus = 1 - getSkillBonus('a1Cd');

    player.abilityCd1 = Math.floor(540 * Math.max(0.3, a1CdBonus)); // 9 секунд база

    edgerunnerWhirlwind = {
      active: true,
      life: Math.floor(180 * a1DurationBonus), // 3 сек база
      maxLife: Math.floor(180 * a1DurationBonus),
      angle: 0,
      radius: 80 * a1RadiusBonus,
      dmg: Math.floor(stats.dmg * 1.5 * a1DmgBonus),
      attackCd: 0
    };

    shake = 3;
    showMsg('ВРАЩАЮЩИЙСЯ КЛИНОК!', '#f0f');
  } else if (playerClass === 'netrunner') {
    // === НЕТРАННЕР: КИБЕР-ВЗЛОМ (1) ===
    const a1DmgBonus = 1 + getSkillBonus('a1Dmg');
    const a1RadiusBonus = 1 + getSkillBonus('a1Radius');
    const a1CdBonus = 1 - getSkillBonus('a1Cd');
    player.abilityCd1 = Math.floor(420 * Math.max(0.3, a1CdBonus));
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    
    const hackRadius = 350 * a1RadiusBonus;
    let markedCount = 0;
    
    // Помечаем всех врагов в радиусе красными иконками-взломами
    enemies.forEach(e => {
      if (!e.dead && dist(e.x, e.y, player.x, player.y) < hackRadius) {
        breachMarks.push({
          enemy: e,
          x: e.x,
          y: e.y - 30,
          life: 120, // 2 секунды жизни
          dmg: Math.floor(stats.dmg * 2.5 * a1DmgBonus),
          hasBurned: false
        });
        markedCount++;
        
        // Визуальный эффект над врагом (маленькое красное пятно)
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 / 8) * i;
          particles.push({
            x: e.x + Math.cos(a) * 15,
            y: e.y - 30 + Math.sin(a) * 15,
            vx: Math.cos(a) * 2,
            vy: Math.sin(a) * 2,
            life: 40,
            color: '#f00',
            size: 3
          });
        }
      }
    });
    
    if (markedCount > 0) {
      shake = 5;
      showMsg('ВЗЛОМ: ' + markedCount, '#f00');
    }
  } else if (playerClass === 'tech') {
    // ТЕХНИК: ТУРЕЛЬ (1)
    const a1DmgBonus = 1 + getSkillBonus('a1Dmg');
    const a1HpBonus = 1 + getSkillBonus('a1Hp');
    const a1DurBonus = 1 + getSkillBonus('a1Duration') / 480;
    const a1SpeedBonus = 1 + getSkillBonus('a1Speed');
    const a1CdBonus = 1 - getSkillBonus('a1Cd');

    player.abilityCd1 = Math.floor(720 * Math.max(0.3, a1CdBonus)); // 12 сек база

    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    const placeDist = 100;
    const tx = player.x + Math.cos(angle) * placeDist;
    const ty = player.y + Math.sin(angle) * placeDist;

    techieTurret = {
      x: tx,
      y: ty,
      life: Math.floor(480 * a1DurBonus), // 8 сек база
      maxLife: Math.floor(480 * a1DurBonus),
      shootCd: 0,
      hp: Math.floor(80 * a1HpBonus),
      maxHp: Math.floor(80 * a1HpBonus),
      dmg: Math.floor(stats.dmg * 0.8 * a1DmgBonus),
      range: 350,
      shootInterval: Math.floor(24 / a1SpeedBonus), // 0.4 сек база
      angle: 0
    };

    shake = 4;
    showMsg('ТУРЕЛЬ УСТАНОВЛЕНА', '#ff0');
    playSound('turret');

    // Частицы установки
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2;
      particles.push({
        x: tx + Math.cos(a) * 20,
        y: ty + Math.sin(a) * 20,
        vx: Math.cos(a) * 3,
        vy: Math.sin(a) * 3,
        life: 30,
        color: '#ff0',
        size: 3
      });
    }
  }
}

function tryAbility2() {
  if (!gameRunning || gamePaused || player.abilityCd2 > 0) return;
  playSound('ability2');
  const stats = getPlayerStats();
  const c = classes[playerClass];

  if (playerClass === 'edgerunner') {
    // ЭДЖРАННЕР: ЭМИ-ГРАНАТА (2)
    const a2DmgBonus = 1 + getSkillBonus('a2Dmg');
    const a2RadiusBonus = 1 + getSkillBonus('a2Radius');
    const a2StunBonus = 1 + getSkillBonus('a2Stun') / 120;
    const a2CdBonus = 1 - getSkillBonus('a2Cd');

    player.abilityCd2 = Math.floor(480 * Math.max(0.3, a2CdBonus)); // 8 секунд база

    const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
    const speed = 8;

    edgerunnerEmpGrenades.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      fuse: 48, // 0.8 сек
      maxFuse: 48,
      dmg: Math.floor(stats.dmg * 1.5 * a2DmgBonus),
      radius: 120 * a2RadiusBonus,
      stunDuration: Math.floor(120 * a2StunBonus), // 2 сек база
      isCluster: false
    });

    shake = 2;
    showMsg('ЭМИ-ГРАНАТА!', '#ff0');
  } else if (playerClass === 'netrunner') {
    // === НЕТРАННЕР: КИБЕР-ДЕМОНЫ (2) ===
    const a2DmgBonus = 1 + getSkillBonus('a2Dmg');
    const a2CountBonus = Math.floor(getSkillBonus('a2Count'));
    const a2DurBonus = 1 + getSkillBonus('a2Dur');
    player.abilityCd2 = 480;
    
    const demonCount = 3 + a2CountBonus;
    for (let i = 0; i < demonCount; i++) {
      const angle = (Math.PI * 2 / demonCount) * i;
      cyberDemons.push({
        angle: angle,
        radius: 60 + Math.random() * 20,
        life: Math.floor(300 * a2DurBonus), // 5 секунд
        shootCd: 0,
        dmg: Math.floor(stats.dmg * 0.8 * a2DmgBonus),
        targetEnemy: null
      });
    }
    showMsg('ДЕМОНЫ: ' + demonCount, '#a0f');
    
    for (let i = 0; i < 20; i++) {
      const a = (Math.PI * 2 / 20) * i;
      particles.push({
        x: player.x + Math.cos(a) * 40,
        y: player.y + Math.sin(a) * 40,
        vx: Math.cos(a) * 5,
        vy: Math.sin(a) * 5,
        life: 40,
        color: '#a0f',
        size: 4
      });
    }
  } else if (playerClass === 'tech') {
    // ТЕХНИК: БОЕВОЙ ДРОН (2)
    const a2DmgBonus = 1 + getSkillBonus('a2Dmg');
    const a2DurBonus = 1 + getSkillBonus('a2Duration') / 600;
    const a2SpeedBonus = 1 + getSkillBonus('a2Speed');
    const a2CountBonus = Math.floor(getSkillBonus('a2Count'));
    const a2CdBonus = 1 - getSkillBonus('a2Cd');

    player.abilityCd2 = Math.floor(900 * Math.max(0.3, a2CdBonus)); // 15 сек база

    const droneCount = 1 + a2CountBonus;
    techieCombatDrone = {
      x: player.x,
      y: player.y - 60,
      angle: 0,
      orbitRadius: 70,
      life: Math.floor(600 * a2DurBonus), // 10 сек база
      maxLife: Math.floor(600 * a2DurBonus),
      shootCd: 0,
      dmg: Math.floor(stats.dmg * 0.5 * a2DmgBonus),
      range: 250,
      shootInterval: Math.floor(30 / a2SpeedBonus), // 0.5 сек база
      target: null,
      count: droneCount,
      drones: []
    };

    // Создаем дронов
    for (let i = 0; i < droneCount; i++) {
      techieCombatDrone.drones.push({
        angleOffset: (Math.PI * 2 / droneCount) * i,
        x: player.x,
        y: player.y - 60
      });
    }

    shake = 3;
    showMsg('ДРОН ЗАПУЩЕН', '#0ff');
    playSound('ability2');

    // Частицы при запуске
    for (let i = 0; i < 15; i++) {
      const a = Math.random() * Math.PI * 2;
      particles.push({
        x: player.x + Math.cos(a) * 30,
        y: player.y + Math.sin(a) * 30,
        vx: Math.cos(a) * 4,
        vy: Math.sin(a) * 4,
        life: 25,
        color: '#0ff',
        size: 3
      });
    }
  }
}

function tryUlt() {
  playSound('ult');
  const stats = getPlayerStats();

  if (playerClass === 'edgerunner') {
    if (player.ultCharge < player.ultMaxCharge) return;
    player.ultCd = 1500; // 25 секунд
    player.ultCharge = 0;
    sandevistanActive = true;
    sandevistanTimer = 300 + Math.floor(getSkillBonus('ultDuration')); // 5 сек + бонус из прокачки
    
    // Применяем эффекты Sandevistan
    enemies.forEach(e => {
      if (!e.dead) {
        e.sandevistanSlowed = true;
        e.originalSpeed = e.type.speed;
        e.type.speed = e.type.speed * 0.15; // -85%
      }
    });
    
    // Замедление снарядов врагов
    projectiles.forEach(p => {
      if (p.owner === 'enemy') {
        p.vx *= 0.15;
        p.vy *= 0.15;
      }
    });
    
    shake = 10;
    showMsg('САНДЕВИСТАН!', '#ff0');
    playSound('ult');
    
    // Частицы
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: player.x + (Math.random()-0.5)*100,
        y: player.y + (Math.random()-0.5)*100,
        vx: (Math.random()-0.5)*8,
        vy: (Math.random()-0.5)*8,
        life: 60,
        color: '#ff0',
        size: 4
      });
    }
  } else if (playerClass === 'netrunner') {
    if (player.ultCharge < player.ultMaxCharge) return;
    const ultDmgBonus = 1 + getSkillBonus('ultDmg');
    player.ultCd = 600; player.ultCharge = 0;
    const hackedTime = 300 + Math.floor(getSkillBonus('ultDuration'));
    let hackedCount = 0;
    enemies.forEach(e => {
      if (e.dead) return;
      e.hacked = true;
      e.hackedTimer = hackedTime;
      e.hackedDmg = Math.floor(stats.dmg * 0.5 * ultDmgBonus);
      hackedEnemies.push(e);
      hackedCount++;
      for (let i = 0; i < 15; i++) {
        particles.push({ x: e.x + (Math.random() - 0.5) * 40, y: e.y + (Math.random() - 0.5) * 40, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, life: 60, color: '#f0f', size: 4 });
      }
    });
    if (hackedCount > 0) { shake = 10; showMsg('ВЗЛОМ ВСЕХ: ' + hackedCount, '#f0f'); }
  } else if (playerClass === 'tech') {
    // ТЕХНИК: МЕХ-КОСТЮМ (УЛЬТА)
    if (player.ultCharge < player.ultMaxCharge) return;

    const ultDurBonus = 1 + getSkillBonus('ultDuration') / 480;
    const ultDmgBonus = 1 + getSkillBonus('ultDmg');
    const ultSpeedBonus = 1 + getSkillBonus('ultSpeed');

    player.ultCd = 1500; // 25 сек
    player.ultCharge = 0;
    techieExosuitActive = true;
    techieExosuitTimer = Math.floor(480 * ultDurBonus); // 8 сек база

    // Сохраняем базовые статы для восстановления
    player._baseSpeed = player.speed;
    player._baseAttackCd = classes.tech.attackCd;

    // Применяем эффекты
    player.speed = 3 * (1 + ultSpeedBonus); // +50% скорости
    classes.tech.attackCd = Math.floor(32 * 0.7); // +30% скорости атаки

    // Иммунитет к стану
    player.exosuitImmune = true;

    shake = 8;
    showMsg('МЕХ-КОСТЮМ АКТИВИРОВАН', '#ff0');
    playSound('ult');

    // Частицы
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      particles.push({
        x: player.x + Math.cos(a) * 40,
        y: player.y + Math.sin(a) * 40,
        vx: Math.cos(a) * 5,
        vy: Math.sin(a) * 5,
        life: 50,
        color: '#ff0',
        size: 4
      });
    }
  }
}

function damageEnemy(e, dmg, isCrit = false) {
  // Защита игрока НЕ должна снижать урон, который игрок наносит врагам
  const vulnMult = (e.vulnerable && e.vulnPct) ? (1 + e.vulnPct) : 1;
  const reduced = Math.max(1, dmg * vulnMult);
  e.hp -= reduced;
  e.hitFlash = isCrit ? 15 : 8;
  playSound(isCrit ? 'crit' : 'hit');
  damageTexts.push({ x:e.x, y:e.y-10, text:Math.round(reduced), life:30, vy:-1, color:'#ff0' });
  for (let i = 0; i < (isCrit ? 10 : 5); i++) {
    particles.push({ x:e.x, y:e.y, vx:(Math.random()-0.5)*4*(isCrit ? 1.6 : 1), vy:(Math.random()-0.5)*4*(isCrit ? 1.6 : 1), life:20, color: isCrit ? '#ff0' : e.type.color, size: isCrit ? 3 : 2 });
  }
  if (isCrit) shake = Math.max(shake, 7);
  if (e.hp <= 0) killEnemy(e);
}

function killEnemy(e) {
  e.dead = true; player.kills++;
  playSound('death');
  if (!e.type.towerMob) {
    player.xp += e.type.xp;
    if (player.ultCd <= 0) player.ultCharge = Math.min(player.ultMaxCharge, player.ultCharge + (e.type.boss ? 30 : 5));
  }
  shake = e.type.boss ? 15 : 5;
  for (let i = 0; i < 20; i++) particles.push({ x:e.x, y:e.y, vx:(Math.random()-0.5)*6, vy:(Math.random()-0.5)*6, life:40, color:e.type.color, size:3 });
  if (!e.type.towerMob) {
    const luckMult = 1 + player.stats.luckPct / 100;
    const dropOffset = () => (Math.random() - 0.5) * 50;
    if (Math.random() < 0.25 * luckMult) dropImplant(e.x + dropOffset(), e.y + dropOffset());
    if (Math.random() < 0.3) pickups.push({ x:e.x + dropOffset(), y:e.y + dropOffset(), type:'hp', life:600 });
  }
  checkLevelUp();
}

function dropImplant(x, y) {
  const ownedTypes = Object.keys(player.implants);
  let impl = null;
  if (ownedTypes.length > 0 && Math.random() < 0.6) {
    impl = IMPLANT_TYPES.find(i => i.id === ownedTypes[Math.floor(Math.random() * ownedTypes.length)]);
  }
  if (!impl) impl = IMPLANT_TYPES[Math.floor(Math.random() * IMPLANT_TYPES.length)];
  if (!impl) return;
  pickups.push({ x, y, type: 'implant', implantId: impl.id, life: 600 });
}

function checkLevelUp() {
  let safetyCounter = 0;
  while (player.xp >= player.xpNext && safetyCounter < 100) {
    player.xp -= player.xpNext; player.level++;
    player.skillPoints++;
    player.xpNext = Math.max(50, Math.floor(player.xpNext * 1.4));
    applyImplantStats();
    player.hp = player.maxHp;
    showMsg('УРОВЕНЬ ' + player.level + '! +1 ОЧКО', '#ff0');
    playSound('levelup');
    shake = 8; safetyCounter++;
  }
}

function explode(x, y, radius, dmg, color) {
  enemies.forEach(e => {
    if (!e.dead && dist(x, y, e.x, e.y) < radius) {
      damageEnemy(e, dmg * (1 - dist(x, y, e.x, e.y) / radius));
    }
  });
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2;
    particles.push({ x: x, y: y, vx: Math.cos(a) * (Math.random() * 6 + 2), vy: Math.sin(a) * (Math.random() * 6 + 2), life: 30, color: color, size: 3 + Math.random()*2 });
  }
  shake = Math.max(shake, 8);
  playSound('explosion');
}