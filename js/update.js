function update() {
  if (!gameRunning || gamePaused) return;
  gameTimeCounter++;
  if (gameTimeCounter >= 60) { gameTimeCounter = 0; survivalTime++; }
  
  let dx = 0, dy = 0;
  if (keys['w'] || keys['ц']) dy -= 1;
  if (keys['s'] || keys['ы']) dy += 1;
  if (keys['a'] || keys['ф']) dx -= 1;
  if (keys['d'] || keys['в']) dx += 1;
  
  if (player.dashDur > 0) {
    player.x += Math.cos(player.dashAngle) * 12;
    player.y += Math.sin(player.dashAngle) * 12;
    player.dashDur--;
    particles.push({ x: player.x, y: player.y, vx: 0, vy: 0, life: 10, color: '#0ff', size: player.size });
  } else if (dx || dy) {
    const l = Math.hypot(dx,dy);
    player.x += (dx/l) * player.speed;
    player.y += (dy/l) * player.speed;
  }
  
  player.x = Math.max(player.size, Math.min(WORLD_W - player.size, player.x));
  player.y = Math.max(player.size, Math.min(WORLD_H - player.size, player.y));
  camera.x = Math.max(0, Math.min(WORLD_W - W, player.x - W/2));
  camera.y = Math.max(0, Math.min(WORLD_H - H, player.y - H/2));
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  
if (player.attackCd > 0) player.attackCd--;
  if (player.dashCd > 0) player.dashCd--;
  if (player.abilityCd1 > 0) player.abilityCd1--;
  if (player.abilityCd2 > 0) player.abilityCd2--;
  if (player.ultCd > 0) player.ultCd--;
  if (player.invuln > 0) player.invuln--;
  if (player.tornadoActive > 0) player.tornadoActive--;
  if (player.ultActive > 0) player.ultActive--;
  if (scatterShotActive > 0) scatterShotActive--;
  railgunBeams.forEach(b => b.life--);
  railgunBeams = railgunBeams.filter(b => b.life > 0);

  // ЭДЖРАННЕР: Ножи (ПКМ) - перезарядка
  if (edgerunnerKnifeRecharge > 0) {
    edgerunnerKnifeRecharge--;
    if (edgerunnerKnifeRecharge === 0) {
      edgerunnerKnifeCharges = 3;
    }
  }

  // ЭДЖРАННЕР: Анимация разрез
  if (edgerunnerSlashAnim > 0) edgerunnerSlashAnim--;

  // ЭДЖРАННЕР: Ножи (ПКМ) - обновление позиции и проверка попаданий
  edgerunnerKnives.forEach(knife => {
    knife.x += knife.vx;
    knife.y += knife.vy;
    knife.life--;
    knife.rotation += 0.3; // вращение ножа
  });
  
// Проверка попаданий ножей
  const hasKnifePierce = getSkillLevel('m_a2_pierce') > 0;
  edgerunnerKnives.forEach(knife => {
    enemies.forEach(e => {
      if (e.dead) return;
      if (dist(e.x, e.y, knife.x, knife.y) < e.size + 6) {
        const isCrit = Math.random() < getAttackBonus('atkCrit');
        const finalDmg = isCrit ? knife.dmg * (1 + getAttackBonus('atkCritDmg')) : knife.dmg;
        damageEnemy(e, finalDmg, isCrit);
        if (!hasKnifePierce) knife.life = 0;
        
        // партиклы при попадании
        for (let i = 0; i < 8; i++) {
          particles.push({ x: e.x, y: e.y, vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4, life: 15, color: '#0ff', size: 3 });
        }
      }
    });
  });
  edgerunnerKnives = edgerunnerKnives.filter(k => k.life > 0);

  // НЕТРАННЕР: Моноструна (хлыст/змейка)
  if (netrunnerMonowire) {
    netrunnerMonowire.life--;
    
    // Фазы анимации: 0-8 кадр = вылет, 8-12 = удержание, 12-15 = затухание
    const totalLife = 15;
    const extendFrames = 8;
    const holdFrames = 4;
    const progress = 1 - netrunnerMonowire.life / totalLife; // 0 to 1
    
    if (progress < extendFrames / totalLife) {
      // Фаза вылета
      const phaseProgress = progress / (extendFrames / totalLife);
      netrunnerMonowire.length = netrunnerMonowire.maxLength * phaseProgress;
      netrunnerMonowire.waveOffset = (netrunnerMonowire.waveOffset || 0) + 0.25;
    } else if (progress < (extendFrames + holdFrames) / totalLife) {
      // Фаза удержания - волна идет
      netrunnerMonowire.length = netrunnerMonowire.maxLength;
      netrunnerMonowire.waveOffset = (netrunnerMonowire.waveOffset || 0) + 0.3;
    } else {
      // Фаза затухания - хвост исчезает первым
      netrunnerMonowire.waveOffset = (netrunnerMonowire.waveOffset || 0) + 0.2;
    }
    
    // Проверка попаданий по сегментам хлыста
    const segments = netrunnerMonowire.segments || 16;
    for (let i = 0; i <= segments; i++) {
      const segProgress = i / segments;
      // Основной угол + волна по длине
      const waveAmp = 0.35 * (1 - segProgress * 0.5); // волна больше у основания
      const waveAngle = Math.sin(segProgress * Math.PI * 3 + (netrunnerMonowire.waveOffset || 0)) * waveAmp;
      const segAngle = netrunnerMonowire.angle + waveAngle;
      const segLen = netrunnerMonowire.length * segProgress;
      const segX = netrunnerMonowire.x + Math.cos(segAngle) * segLen;
      const segY = netrunnerMonowire.y + Math.sin(segAngle) * segLen;
      
      enemies.forEach(e => {
        if (e.dead) return;
        if (dist(e.x, e.y, segX, segY) < 14) {
          if (!netrunnerMonowire.targetsHit.has(e)) {
            netrunnerMonowire.targetsHit.add(e);
            damageEnemy(e, Math.floor(netrunnerMonowire.damage));
            
            if (getSkillLevel('ma_atk_slow') > 0) {
              e.slowTimer = 60;
            }
            if (getSkillLevel('ma_atk_burn') > 0) {
              e.burning = true;
              e.burnTimer = 180;
              e.burnDmg = Math.floor(netrunnerMonowire.damage * 0.15);
            }
          }
        }
      });
    }
    
    if (netrunnerMonowire.life <= 0) {
      netrunnerMonowire = null;
    }
  }

  // НЕТРАННЕР: КИБЕР-ДЕМОН (способность 2)
  if (netrunnerCyberDemon) {
    netrunnerCyberDemon.life--;
    netrunnerCyberDemon.angle += netrunnerCyberDemon.orbitSpeed;
    
    // Движение по орбите вокруг игрока
    netrunnerCyberDemon.x = player.x + Math.cos(netrunnerCyberDemon.angle) * netrunnerCyberDemon.orbitRadius;
    netrunnerCyberDemon.y = player.y + Math.sin(netrunnerCyberDemon.angle) * netrunnerCyberDemon.orbitRadius - 50;
    
    // Поиск цели
    if (!netrunnerCyberDemon.target || netrunnerCyberDemon.target.dead) {
      let closest = null;
      let closestDist = 250;
      enemies.forEach(e => {
        if (!e.dead && dist(netrunnerCyberDemon.x, netrunnerCyberDemon.y, e.x, e.y) < closestDist) {
          closest = e;
          closestDist = dist(netrunnerCyberDemon.x, netrunnerCyberDemon.y, e.x, e.y);
        }
      });
      netrunnerCyberDemon.target = closest;
    }
    
    // Атака
    const a2DmgBonus = 1 + getSkillBonus('a2Dmg');
    const a2SpeedBonus = 1 + getSkillBonus('a2Speed');
    netrunnerCyberDemon.attackCd--;
    if (netrunnerCyberDemon.attackCd <= 0 && netrunnerCyberDemon.target) {
      damageEnemy(netrunnerCyberDemon.target, Math.floor(netrunnerCyberDemon.dmg * a2DmgBonus));
      netrunnerCyberDemon.attackCd = Math.floor(24 / a2SpeedBonus);
      
      // Particles атаки
      const angle = Math.atan2(netrunnerCyberDemon.target.y - netrunnerCyberDemon.y, 
                               netrunnerCyberDemon.target.x - netrunnerCyberDemon.x);
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: netrunnerCyberDemon.x,
          y: netrunnerCyberDemon.y,
          vx: Math.cos(angle) * 3 + (Math.random()-0.5)*2,
          vy: Math.sin(angle) * 3 + (Math.random()-0.5)*2,
          life: 30,
          color: '#a0f',
          size: 3
        });
      }
    }
    
    if (netrunnerCyberDemon.life <= 0) {
      netrunnerCyberDemon = null;
    }
  }

  // НЕТРАННЕР: ЧЁРНАЯ СТЕНА (УЛЬТА)
  if (netrunnerBlackwallActive) {
    netrunnerBlackwallTimer--;
    
    // Наносим урон всем взломанным врагам
    enemies.forEach(e => {
      if (e.blackwallHacked && !e.dead) {
        if (netrunnerBlackwallTimer % 20 === 0) { // Урон каждые 0.33 сек
          damageEnemy(e, e.blackwallDmg);
          
          // Цепная молния
          enemies.forEach(e2 => {
            if (e !== e2 && !e2.dead && dist(e.x, e.y, e2.x, e2.y) < 250) {
              lightningChains.push({
                x1: e.x, y1: e.y,
                x2: e2.x, y2: e2.y,
                life: 30,
                color: '#f00'
              });
            }
          });
        }
      }
    });
    
    if (netrunnerBlackwallTimer <= 0) {
      netrunnerBlackwallActive = false;
      enemies.forEach(e => { e.blackwallHacked = false; });
    }
  }

  // ЭДЖРАННЕР: ВРАЩАЮЩИЙСЯ КЛИНОК (1)
  if (edgerunnerWhirlwind && edgerunnerWhirlwind.active) {
    edgerunnerWhirlwind.life--;
    edgerunnerWhirlwind.angle += 0.3;
    edgerunnerWhirlwind.attackCd--;

    // Урон по ближайшим врагам каждые 8 кадров
    if (edgerunnerWhirlwind.attackCd <= 0) {
      edgerunnerWhirlwind.attackCd = 8;
      enemies.forEach(e => {
        if (!e.dead && dist(e.x, e.y, player.x, player.y) < edgerunnerWhirlwind.radius) {
          damageEnemy(e, edgerunnerWhirlwind.dmg);
          for (let j = 0; j < 4; j++) {
            particles.push({
              x: e.x + (Math.random()-0.5)*10,
              y: e.y + (Math.random()-0.5)*10,
              vx: (Math.random()-0.5)*3,
              vy: (Math.random()-0.5)*3,
              life: 15,
              color: '#f0f',
              size: 2
            });
          }
        }
      });
    }

    // Частицы вращения
    if (edgerunnerWhirlwind.life % 3 === 0) {
      for (let i = 0; i < 2; i++) {
        const a = Math.random() * Math.PI * 2;
        particles.push({
          x: player.x + Math.cos(a) * edgerunnerWhirlwind.radius,
          y: player.y + Math.sin(a) * edgerunnerWhirlwind.radius,
          vx: Math.cos(a) * 2,
          vy: Math.sin(a) * 2,
          life: 10,
          color: '#f0f',
          size: 3
        });
      }
    }

    if (edgerunnerWhirlwind.life <= 0) {
      edgerunnerWhirlwind.active = false;
    }
  }

  // ЭДЖРАННЕР: ЭМИ-ГРАНАТЫ (2)
  edgerunnerEmpGrenades.forEach(grenade => {
    grenade.x += grenade.vx;
    grenade.y += grenade.vy;
    grenade.vx *= 0.95;
    grenade.vy *= 0.95;
    grenade.fuse--;

    // Частицы полёта
    if (grenade.fuse % 4 === 0) {
      particles.push({
        x: grenade.x,
        y: grenade.y,
        vx: (Math.random()-0.5)*2,
        vy: (Math.random()-0.5)*2,
        life: 10,
        color: '#ff0',
        size: 2
      });
    }

    if (grenade.fuse <= 0) {
      // Взрыв
      const hasCluster = getSkillLevel('e_a2_cluster') > 0;

      if (hasCluster && !grenade.isCluster) {
        // Кассетная граната - делится на 3
        for (let i = 0; i < 3; i++) {
          const angle = (Math.PI * 2 / 3) * i;
          edgerunnerEmpGrenades.push({
            x: grenade.x,
            y: grenade.y,
            vx: Math.cos(angle) * 4,
            vy: Math.sin(angle) * 4,
            fuse: 30,
            maxFuse: 30,
            dmg: Math.floor(grenade.dmg * 0.5),
            radius: grenade.radius * 0.7,
            stunDuration: grenade.stunDuration,
            isCluster: true
          });
        }
      } else {
        // Обычный взрыв
        enemies.forEach(e => {
          if (!e.dead && dist(e.x, e.y, grenade.x, grenade.y) < grenade.radius) {
            damageEnemy(e, grenade.dmg);
            e.stunTimer = Math.max(e.stunTimer || 0, grenade.stunDuration);
            // Частицы взрыва
            for (let i = 0; i < 15; i++) {
              const a = Math.random() * Math.PI * 2;
              particles.push({
                x: grenade.x + Math.cos(a) * 20,
                y: grenade.y + Math.sin(a) * 20,
                vx: Math.cos(a) * 4,
                vy: Math.sin(a) * 4,
                life: 25,
                color: '#ff0',
                size: 3
              });
            }
          }
        });
        shake = 5;
      }
    }
  });
  edgerunnerEmpGrenades = edgerunnerEmpGrenades.filter(g => g.fuse > 0);

  // ЭДЖРАННЕР: САНДЕВИСТАН (УЛЬТА)
  if (sandevistanActive) {
    sandevistanTimer--;
    
    // Увеличиваем скорость игрока
    const originalSpeed = player.speed;
    player.speed = 6; // +100%
    
    if (sandevistanTimer <= 0) {
      sandevistanActive = false;
      player.speed = 3;
      // Восстанавливаем скорость врагов
      enemies.forEach(e => {
        if (e.sandevistanSlowed && e.originalSpeed) {
          e.type.speed = e.originalSpeed;
          e.sandevistanSlowed = false;
        }
      });
      // Восстанавливаем скорость снарядов
      projectiles.forEach(p => {
        if (p.owner === 'enemy') {
          p.vx /= 0.15;
          p.vy /= 0.15;
        }
      });
    }
  }

  // Очистка статусов
  if (playerClass === 'tech') {
    // ТЕХНИК: ТУРЕЛЬ (1)
    if (techieTurret) {
      techieTurret.life--;
      techieTurret.shootCd--;

      // Поиск цели
      let closest = null;
      let closestDist = techieTurret.range;
      enemies.forEach(e => {
        if (!e.dead) {
          const d = dist(techieTurret.x, techieTurret.y, e.x, e.y);
          if (d < closestDist) {
            closest = e;
            closestDist = d;
          }
        }
      });

      // Поворот к цели
      if (closest) {
        techieTurret.angle = Math.atan2(closest.y - techieTurret.y, closest.x - techieTurret.x);

        // Стрельба
        if (techieTurret.shootCd <= 0) {
          projectiles.push({
            x: techieTurret.x,
            y: techieTurret.y,
            vx: Math.cos(techieTurret.angle) * 10,
            vy: Math.sin(techieTurret.angle) * 10,
            dmg: techieTurret.dmg,
            color: '#ff0',
            type: 'bullet',
            life: 60,
            size: 4,
            owner: 'player'
          });
          techieTurret.shootCd = techieTurret.shootInterval;
          playSound('turret');

          // Частицы выстрела
          for (let i = 0; i < 5; i++) {
            particles.push({
              x: techieTurret.x + Math.cos(techieTurret.angle) * 15,
              y: techieTurret.y + Math.sin(techieTurret.angle) * 15,
              vx: Math.cos(techieTurret.angle) * 3 + (Math.random()-0.5)*2,
              vy: Math.sin(techieTurret.angle) * 3 + (Math.random()-0.5)*2,
              life: 10,
              color: '#ff0',
              size: 2
            });
          }
        }
      }

      // Враги атакуют турель
      enemies.forEach(e => {
        if (!e.dead && dist(e.x, e.y, techieTurret.x, techieTurret.y) < 40 && e.attackCd <= 0) {
          techieTurret.hp -= e.type.dmg;
          e.attackCd = 40;
          // Частицы попадания
          for (let i = 0; i < 6; i++) {
            particles.push({
              x: techieTurret.x + (Math.random()-0.5)*20,
              y: techieTurret.y + (Math.random()-0.5)*20,
              vx: (Math.random()-0.5)*3,
              vy: (Math.random()-0.5)*3,
              life: 15,
              color: '#f80',
              size: 2
            });
          }
        }
      });

      if (techieTurret.life <= 0 || techieTurret.hp <= 0) {
        // Взрыв при уничтожении
        if (techieTurret.hp <= 0) {
          explode(techieTurret.x, techieTurret.y, 80, techieTurret.dmg * 2, '#ff0');
        }
        techieTurret = null;
      }
    }

    // ТЕХНИК: БОЕВОЙ ДРОН (2)
    if (techieCombatDrone) {
      techieCombatDrone.life--;
      techieCombatDrone.angle += 0.05;

      // Обновляем позиции дронов
      techieCombatDrone.drones.forEach((drone, idx) => {
        const droneAngle = techieCombatDrone.angle + drone.angleOffset;
        drone.x = player.x + Math.cos(droneAngle) * techieCombatDrone.orbitRadius;
        drone.y = player.y + Math.sin(droneAngle) * techieCombatDrone.orbitRadius - 50;

        // Поиск цели для каждого дрона
        let closest = null;
        let closestDist = techieCombatDrone.range;
        enemies.forEach(e => {
          if (!e.dead) {
            const d = dist(drone.x, drone.y, e.x, e.y);
            if (d < closestDist) {
              closest = e;
              closestDist = d;
            }
          }
        });

        // Стрельба
        techieCombatDrone.shootCd--;
        if (techieCombatDrone.shootCd <= 0 && closest) {
          const angle = Math.atan2(closest.y - drone.y, closest.x - drone.x);
          projectiles.push({
            x: drone.x,
            y: drone.y,
            vx: Math.cos(angle) * 12,
            vy: Math.sin(angle) * 12,
            dmg: techieCombatDrone.dmg,
            color: '#0ff',
            type: 'bullet',
            life: 50,
            size: 3,
            owner: 'player'
          });
          techieCombatDrone.shootCd = techieCombatDrone.shootInterval;

          // Частицы выстрела
          for (let i = 0; i < 4; i++) {
            particles.push({
              x: drone.x + Math.cos(angle) * 10,
              y: drone.y + Math.sin(angle) * 10,
              vx: Math.cos(angle) * 2 + (Math.random()-0.5)*2,
              vy: Math.sin(angle) * 2 + (Math.random()-0.5)*2,
              life: 8,
              color: '#0ff',
              size: 2
            });
          }
        }
      });

      if (techieCombatDrone.life <= 0) {
        techieCombatDrone = null;
      }
    }

    // ТЕХНИК: МЕХ-КОСТЮМ (УЛЬТА)
    if (techieExosuitActive) {
      techieExosuitTimer--;

      // Трейлы движения
      if (gameTimeCounter % 3 === 0) {
        techieExosuitTrail.push({ x: player.x, y: player.y, life: 20 });
      }
      techieExosuitTrail.forEach(t => t.life--);
      techieExosuitTrail = techieExosuitTrail.filter(t => t.life > 0);

      // Регенерация HP (если прокачано)
      if (getSkillLevel('t_u_regen') > 0) {
        if (gameTimeCounter % 60 === 0) {
          const heal = Math.floor(player.maxHp * 0.02);
          player.hp = Math.min(player.maxHp, player.hp + heal);
          if (heal > 0) {
            damageTexts.push({ x: player.x, y: player.y - 20, text: '+' + heal, life: 30, vy: -1, color: '#0f0' });
          }
        }
      }

      // Регенерация щита
      if (techieShield.hp < techieShield.maxHp && !techieShield.broken) {
        techieShield.hp = Math.min(techieShield.maxHp, techieShield.hp + 1);
      }

      // Увеличенный урон (применяется в tryAttack через модификатор)
      player.exosuitDmgMult = 1 + getSkillBonus('ultDmg');

      if (techieExosuitTimer <= 0) {
        techieExosuitActive = false;
        player.speed = player._baseSpeed || 3;
        classes.tech.attackCd = player._baseAttackCd || 32;
        player.exosuitImmune = false;
        player.exosuitDmgMult = 1;
        techieExosuitTrail = [];
      }
    }
    // Щит
    if (techieShield.cooldown > 0) {
      techieShield.cooldown--;
      if (techieShield.cooldown === 0) {
        techieShield.broken = false;
        techieShield.hp = techieShield.maxHp;
      }
    }
    
    if (techieShield.broken) {
      techieShield.regenTimer++;
      if (techieShield.regenTimer >= 180) { // 3 сек без урона
        techieShield.regenTimer = 0;
        techieShield.hp = Math.min(techieShield.maxHp, techieShield.hp + 1);
        if (techieShield.hp >= techieShield.maxHp) {
          techieShield.broken = false;
        }
      }
    }
    
    // Регенерация щита вне боя
    if (techieShield.hp < techieShield.maxHp && !techieShield.active && techieShield.cooldown === 0 && !techieShield.broken) {
      techieShield.regenTimer++;
      if (techieShield.regenTimer >= 60) {
        techieShield.hp = Math.min(techieShield.maxHp, techieShield.hp + 1);
      }
    } else {
      techieShield.regenTimer = 0;
    }
    
    // Пистолетные выстрелы
    techiePistolShots.forEach(shot => {
      shot.life--;
      shot.traveled += shot.speed;
      const sx = shot.x + Math.cos(shot.angle) * shot.traveled;
      const sy = shot.y + Math.sin(shot.angle) * shot.traveled;
      
      enemies.forEach(e => {
        if (e.dead) return;
        if (dist(e.x, e.y, sx, sy) < e.size + 6) {
          damageEnemy(e, shot.dmg, shot.isCrit);
          shot.life = 0;
        }
      });
    });
    techiePistolShots = techiePistolShots.filter(s => s.life > 0 && s.traveled < 600);
  }

// Атака по зажатой ЛКМ
  if (mouse.down) {
    if (playerClass === 'melee' || playerClass === 'magic') {
      tryAttack();
    } else if (playerClass === 'tech') {
      tryAttack();
    }
  }
  
  // Старый код зарядки - удален (Techie теперь стреляет по ЛКМ)

  if (scatterShotActive > 0 && scatterShotActive % 6 === 0) {
    const stats = getPlayerStats();
    const c = classes[playerClass];
    const a2DmgBonus = 1 + getSkillBonus('a2Dmg');
    const a2CountBonus = Math.floor(getSkillBonus('a2Count'));
    const totalBullets = 16 + a2CountBonus * 2;
    for (let i = 0; i < totalBullets; i++) {
      const a = (Math.PI * 2 / totalBullets) * i;
      projectiles.push({ x: player.x, y: player.y, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8, dmg: stats.dmg * 0.5 * a2DmgBonus, color: c.color, type: 'bullet', life: 40, size: 3, owner: 'player' });
    }
  }

  railgunBeams.forEach(b => {
    if (b.life <= 0) return;
    const heatMult = getSkillLevel('r_u_heat') > 0 ? 1 + Math.min(0.5, (b.maxLife - b.life) / 60 * 0.1) : 1;
    enemies.forEach(e => {
      if (!e.dead && pointLineDist(e.x, e.y, b.x1, b.y1, b.x2, b.y2) < e.size + b.width / 2 + 2) {
        if (getSkillLevel('r_u_pierce') <= 0) {
          if (!e._railHit || e._railHit < b.maxLife - b.life) { damageEnemy(e, b.dmg * heatMult); e._railHit = b.maxLife - b.life; }
        } else {
          damageEnemy(e, b.dmg * heatMult * 0.1);
        }
      }
    });
  });

  if (player.stats.hpRegenPct > 0) {
    player.hpRegenTimer++;
    if (player.hpRegenTimer >= 60) {
      player.hpRegenTimer = 0;
      const heal = Math.max(1, Math.floor(player.maxHp * 0.01 * (player.stats.hpRegenPct / 2)));
      player.hp = Math.min(player.maxHp, player.hp + heal);
      if (heal > 0) damageTexts.push({ x:player.x, y:player.y-15, text:'+' + heal, life:30, vy:-1, color:'#0f0' });
    }
  }
  
  enemies.forEach(e => {
    if (e.dead) return;
    if (e.stunTimer > 0) { if (e.attackCd > 0) e.attackCd--; if (e.hitFlash > 0) e.hitFlash--; return; }
    const spdMult = e.slowTimer > 0 ? 0.6 : 1;
    let targetX = player.x, targetY = player.y;
    if (turrets.length > 0 && !e.type.tower) {
      let nearestTurret = null, nearestDist = Infinity;
      turrets.forEach(t => {
        if (t.hp <= 0) return;
        const td = dist(e.x, e.y, t.x, t.y);
        if (td < nearestDist) { nearestTurret = t; nearestDist = td; }
      });
      if (nearestTurret) { targetX = nearestTurret.x; targetY = nearestTurret.y; }
    }
    const a = Math.atan2(targetY - e.y, targetX - e.x);
    const d = dist(targetX, targetY, e.x, e.y);
    const dToPlayer = dist(player.x, player.y, e.x, e.y);
    
    if (e.type.attack === 'melee' || e.type.attack === 'both') {
      if (d > 40) { e.x += Math.cos(a) * e.type.speed * spdMult; e.y += Math.sin(a) * e.type.speed * spdMult; }
      else if (e.attackCd <= 0) {
        const isTargetingTurret = (targetX !== player.x || targetY !== player.y);
        if (isTargetingTurret) {
          turrets.forEach(t => {
            if (t.hp > 0 && dist(e.x, e.y, t.x, t.y) < 45) {
              t.hp -= e.type.dmg;
              damageTexts.push({ x:t.x, y:t.y-10, text:Math.round(e.type.dmg), life:30, vy:-1, color:'#ff0' });
              for (let i = 0; i < 5; i++) particles.push({ x:t.x, y:t.y, vx:(Math.random()-0.5)*4, vy:(Math.random()-0.5)*4, life:20, color:'#ff0', size:3 });
            }
          });
        } else if (player.invuln <= 0) {
          const finalDmg = e.type.dmg + Math.floor((Math.random() - 0.5) * (e.type.dmgVar||0) * 2);
          let dmg = Math.max(1, finalDmg * (1 - player.stats.defensePct / 100));
          
          // Техник: Щит поглощает урон
          if (playerClass === 'tech' && techieShield.active && techieShield.hp > 0) {
            const absorbed = Math.min(techieShield.hp, dmg);
            techieShield.hp -= absorbed;
            dmg -= absorbed;
            
            // Эффект блока
            for (let i = 0; i < 8; i++) {
              particles.push({ x: player.x, y: player.y, vx: (Math.random()-0.5)*6, vy: (Math.random()-0.5)*6, life: 15, color: '#0ff', size: 3 });
            }
            damageTexts.push({ x: player.x, y: player.y - 15, text: 'БЛОК', life: 30, vy: -1, color: '#0ff' });
            shake = 2;
            
            if (techieShield.hp <= 0) {
              techieShield.active = false;
              techieShield.broken = true;
              techieShield.cooldown = 180;
              playSound('ui_error');
            }
          }
          
          if (dmg > 0) {
            player.hp -= dmg; player.invuln = 30; shake = 6;
            damageTexts.push({ x:player.x, y:player.y-10, text:Math.round(dmg), life:30, vy:-1, color:'#f00' });
            playSound('hurt');
          }
        }
        e.attackCd = 40;
      }
    }
    if (e.type.attack === 'ranged' || e.type.attack === 'both') {
      const idealDist = 250;
      if (d < idealDist - 50) { e.x -= Math.cos(a) * e.type.speed * 0.8 * spdMult; e.y -= Math.sin(a) * e.type.speed * 0.8 * spdMult; }
      else if (d > idealDist + 80) { e.x += Math.cos(a) * e.type.speed * 0.6 * spdMult; e.y += Math.sin(a) * e.type.speed * 0.6 * spdMult; }
      else {
        const strafe = Math.sin(Date.now() * 0.003 + e.x * 0.1) * e.type.speed * 0.4 * spdMult;
        e.x += Math.cos(a + Math.PI / 2) * strafe; e.y += Math.sin(a + Math.PI / 2) * strafe;
      }
      if (e.attackCd <= 0 && d < 500) {
        const projDmg = e.type.dmg + Math.floor((Math.random() - 0.5) * (e.type.dmgVar||0) * 2);
        projectiles.push({ x:e.x, y:e.y, vx:Math.cos(a)*6, vy:Math.sin(a)*6, dmg:projDmg, color:e.type.color, type:'enemy', life:100, size:4, owner:'enemy' });
        e.attackCd = e.type.boss ? 25 : 50;
      }
    }
    if (e.attackCd > 0) e.attackCd--;
    if (e.hitFlash > 0) e.hitFlash--;
    if (e.slowTimer > 0) e.slowTimer--;
    
    if (e.type.tower) {
      e.towerSpawnTimer = (e.towerSpawnTimer || 0) + 1;
      if (e.towerSpawnTimer >= 180 && enemies.filter(x => !x.dead).length < 25) { e.towerSpawnTimer = 0; spawnTowerMinion(e); }
      if (e.attackCd <= 0 && dToPlayer < 600) {
        const aToPlayer = Math.atan2(player.y - e.y, player.x - e.x);
        projectiles.push({ x:e.x, y:e.y, vx:Math.cos(aToPlayer)*5, vy:Math.sin(aToPlayer)*5, dmg:10, color:'#f80', type:'enemy', life:80, size:5, owner:'enemy' });
        e.attackCd = 40;
      }
    }
  });
  
  if (player.tornadoActive > 0) {
    const stats = getPlayerStats();
    player.tornadoAngle += 0.3;
    const tornadoRadius = stats.range * 0.8 * (1 + getSkillBonus('a2Range')) * (1 + player.stats.rangePct / 100 * 0.25);
    for (let i = 0; i < 8; i++) {
      const a = player.tornadoAngle + (Math.PI * 2 / 8) * i;
      const tx = player.x + Math.cos(a) * tornadoRadius;
      const ty = player.y + Math.sin(a) * tornadoRadius;
      enemies.forEach(e => {
        if (!e.dead && dist(tx, ty, e.x, e.y) < 30) {
          damageEnemy(e, stats.dmg * 0.4 * (1 + getSkillBonus('a2Dmg')));
          if (getSkillLevel('m_a2_lifesteal') > 0) player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * 0.02));
        }
      });
      particles.push({ x: tx, y: ty, vx: Math.cos(a + 1.5) * 2, vy: Math.sin(a + 1.5) * 2, life: 10, color: '#f0f', size: 3 });
    }
    particles.push({ x: player.x, y: player.y, vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2, life: 8, color: '#f0f', size: 2 });
  }
  if (player.tornadoActive <= 0 && player.tornadoWasActive && getSkillLevel('m_a2_gravity') > 0) {
    const stats = getPlayerStats();
    const tornadoRadius = stats.range * 0.8 * (1 + getSkillBonus('a2Range')) * (1 + player.stats.rangePct / 100 * 0.25);
    enemies.forEach(e => {
      if (!e.dead && dist(player.x, player.y, e.x, e.y) < tornadoRadius * 1.5) {
        const a = Math.atan2(player.y - e.y, player.x - e.x);
        e.x += Math.cos(a) * 60; e.y += Math.sin(a) * 60;
        damageEnemy(e, stats.dmg * 1.5);
      }
    });
    shake = 8;
    for (let i = 0; i < 20; i++) particles.push({ x:player.x, y:player.y, vx:Math.cos(Math.random()*Math.PI*2)*5, vy:Math.sin(Math.random()*Math.PI*2)*5, life:25, color:'#f0f', size:4 });
  }
  player.tornadoWasActive = player.tornadoActive > 0;

  if (player.ultActive > 0) {
    const stats = getPlayerStats();
    player.ultAngle += 0.1 * stats.atkSpeedMult;
    const swordRadius = stats.range * 1.2;
    const swordCount = 8 + Math.floor(getSkillBonus('ultCount'));
    for (let i = 0; i < swordCount; i++) {
      const a = player.ultAngle + (Math.PI * 2 / swordCount) * i;
      const sx = player.x + Math.cos(a) * swordRadius;
      const sy = player.y + Math.sin(a) * swordRadius;
      enemies.forEach(e => { if (!e.dead && dist(sx, sy, e.x, e.y) < e.size + 14) damageEnemy(e, stats.dmg * 0.6 * (1 + getSkillBonus('ultDmg'))); });
      particles.push({ x: sx, y: sy, vx: (Math.random()-0.5)*2, vy: (Math.random()-0.5)*2, life: 8, color: '#f0f', size: 3 });
    }
  }
  
  projectiles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.owner === 'player') {
      if (p.type === 'magic') {
        p.traveled += Math.hypot(p.vx, p.vy);
        if (p.traveled >= p.maxRange || p.life <= 1) { explode(p.x, p.y, 80, p.dmg, p.color); p.life = 0; return; }
      }
      enemies.forEach(e => {
        if (e.dead) return;
        if (dist(p.x,p.y,e.x,e.y) < e.size + p.size) {
          if (p.type === 'magic') explode(p.x, p.y, 80, p.dmg, p.color); else damageEnemy(e, p.dmg);
          p.life = 0;
        }
      });
    } else {
      if (dist(p.x,p.y,player.x,player.y) < player.size + p.size) {
        if (player.invuln <= 0) {
          // Техник: щит поглощает урон
          if (playerClass === 'tech' && techieShield.active && techieShield.hp > 0) {
            techieShield.hp -= p.dmg;
            if (techieShield.hp <= 0) {
              techieShield.hp = 0;
              techieShield.broken = true;
              techieShield.cooldown = 180;
            }
            // Эффект блокирования
            damageTexts.push({ x:player.x, y:player.y-10, text:'БЛОК!', life:30, vy:-1, color:'#0ff' });
            for (let i = 0; i < 10; i++) {
              particles.push({ x:player.x, y:player.y, vx:(Math.random()-0.5)*6, vy:(Math.random()-0.5)*6, life:20, color:'#0ff', size:3 });
            }
            playSound('hit');
          } else {
            player.hp -= p.dmg; player.invuln = 20; shake = 4;
            damageTexts.push({ x:player.x, y:player.y-10, text:p.dmg, life:30, vy:-1, color:'#f00' });
            playSound('hurt');
          }
        }
        p.life = 0;
      }
    }
  });
  projectiles = projectiles.filter(p => p.life > 0 && p.x > -50 && p.x < WORLD_W+50 && p.y > -50 && p.y < WORLD_H+50);
  
  let nextGrenades = [];
  techSmartMarks.forEach(m => {
    if (!m.enemy || m.enemy.dead) { m.life = 0; return; }
    m.life--;
    m.x = m.enemy.x;
    m.y = m.enemy.y;
  });
  techSmartMarks = techSmartMarks.filter(m => m.life > 0);

  techSmartShots.forEach(s => {
    if (!s.enemy || s.enemy.dead) { s.life = 0; return; }
    const turnLimit = 15 * Math.PI / 180;
    const targetAngle = Math.atan2(s.enemy.y - s.y, s.enemy.x - s.x);
    let diff = targetAngle - s.angle;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    diff = Math.max(-turnLimit, Math.min(turnLimit, diff));
    s.angle += diff;
    const spd = s.speed;
    s.x += Math.cos(s.angle) * spd;
    s.y += Math.sin(s.angle) * spd;
    s.traveled += spd;
    if (dist(s.x, s.y, s.enemy.x, s.enemy.y) < s.enemy.size + 6) {
      damageEnemy(s.enemy, s.dmg);
      s.life = 0;
      for (let i = 0; i < 10; i++) {
        particles.push({ x: s.x + (Math.random() - 0.5) * 18, y: s.y + (Math.random() - 0.5) * 18, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 22, color: '#ff0', size: 2 });
      }
      shake = Math.max(shake, 4);
    } else {
      if (s.life % 2 === 0) {
        particles.push({ x: s.x, y: s.y, vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 1.2, life: 10, color: '#ff0', size: 1.5 });
      }
    }
    s.life--;
    if (s.life <= 0 || s.traveled >= s.maxTravel) s.life = 0;
  });
  techSmartShots = techSmartShots.filter(s => s.life > 0);

  if (nanoSwarm.length > 0) {
    const stats = getPlayerStats();
    const baseDmg = stats.dmg;
    const maxSearchRadius = 80;
    nanoSwarm.forEach(b => {
      if (!b || b.life <= 0) return;
      b.life--;
      b.orbitAngle += b.orbitSpeed;
      b.x = player.x + Math.cos(b.orbitAngle) * b.orbitRadius;
      b.y = player.y + Math.sin(b.orbitAngle) * b.orbitRadius;
      b.attackCd--;
      if (b.attackCd <= 0) {
        b.attackCd = 20;
        let target = null;
        let best = Infinity;
        for (let i = 0; i < enemies.length; i++) {
          const e = enemies[i];
          if (!e || e.dead) continue;
          const dd = dist(b.x, b.y, e.x, e.y);
          if (dd <= maxSearchRadius && dd < best) { best = dd; target = e; }
        }
        if (target) {
          const dmg = Math.floor(baseDmg * 0.6);
          damageEnemy(target, dmg);
          for (let i = 0; i < 6; i++) {
            particles.push({ x: target.x + (Math.random() - 0.5) * 12, y: target.y + (Math.random() - 0.5) * 12, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 18, color: '#ff0', size: 2 });
          }
          particles.push({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2, life: 12, color: '#ff0', size: 2 });
          shake = Math.max(shake, 4);
        }
      }
    });
    nanoSwarm = nanoSwarm.filter(b => b && b.life > 0);
  }
  
  for (let i = 0; i < grenades.length; i++) {
    let g = grenades[i];
    g.x += g.vx; g.y += g.vy; g.vx *= 0.95; g.vy *= 0.95; g.fuse--;
    if (g.fuse <= 0) {
      explode(g.x, g.y, 100 * (1 + getSkillBonus('a1Radius')), g.dmg, g.color);
      if (getSkillLevel('r_a1_slow') > 0) {
        enemies.forEach(e => { if (!e.dead && dist(g.x, g.y, e.x, e.y) < 100 * (1 + getSkillBonus('a1Radius'))) e.slowTimer = (e.slowTimer || 0) + 150; });
      }
      if (getSkillLevel('r_a1_cluster') > 0 && !g.isCluster) {
        for (let j = 0; j < 3; j++) {
          const a = (Math.PI * 2 / 3) * j;
          nextGrenades.push({ x:g.x, y:g.y, vx:Math.cos(a)*5, vy:Math.sin(a)*5, fuse:15, dmg:Math.floor(g.dmg * 0.5), color:'#0ff', isCluster: true });
        }
      }
    } else {
      nextGrenades.push(g);
    }
  }
grenades = nextGrenades;
  
  if (breachMarks.length > 0) {
    breachMarks.forEach(mark => {
      if (!mark.enemy || mark.enemy.dead) { mark.life = 0; return; }
      mark.life--;
      mark.x = mark.enemy.x;
      mark.y = mark.enemy.y - 30;
      if (mark.life <= 0 && !mark.hasBurned && !mark.enemy.dead) {
        damageEnemy(mark.enemy, mark.dmg);
        mark.enemy.burning = true;
        mark.enemy.burnTimer = 180;
        mark.enemy.burnDmg = Math.floor(mark.dmg * 0.3);
        mark.hasBurned = true;
        for (let i = 0; i < 20; i++) {
          particles.push({ x: mark.enemy.x + (Math.random() - 0.5) * 30, y: mark.enemy.y + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 - 2, life: 40, color: '#f80', size: 4 });
        }
      }
    });
    breachMarks = breachMarks.filter(m => m.life > 0 && m.enemy && !m.enemy.dead);
  }

  if (cyberDemons.length > 0) {
    cyberDemons.forEach(demon => {
      demon.life--;
      demon.angle += 0.08;
      demon.shootCd--;
      if (demon.shootCd <= 0) {
        const demonX = player.x + Math.cos(demon.angle) * demon.radius;
        const demonY = player.y + Math.sin(demon.angle) * demon.radius;
        let closest = null, closestDist = 400;
        enemies.forEach(e => {
          if (!e.dead) {
            const d = dist(demonX, demonY, e.x, e.y);
            if (d < closestDist) { closest = e; closestDist = d; }
          }
        });
        if (closest) {
          const a = Math.atan2(closest.y - demonY, closest.x - demonX);
          projectiles.push({ x: demonX, y: demonY, vx: Math.cos(a) * 10, vy: Math.sin(a) * 10, dmg: demon.dmg, color: '#a0f', type: 'bullet', life: 60, size: 5, owner: 'player' });
          demon.shootCd = demon.shootCdMax || 40;
        }
      }
    });
    cyberDemons = cyberDemons.filter(d => d.life > 0);
  }

  if (hackedEnemies.length > 0) {
    hackedEnemies.forEach(e => {
      if (e.hacked && e.hackedTimer > 0 && !e.dead) {
        e.hackedTimer--;
        if (Math.random() < 0.02) {
          let target = null;
          let minDist = 200;
          enemies.forEach(other => {
            if (other !== e && !other.dead && dist(e.x, e.y, other.x, other.y) < minDist) {
              target = other;
              minDist = dist(e.x, e.y, other.x, other.y);
            }
          });
          if (target) {
            damageEnemy(target, e.hackedDmg);
            lightningChains.push({ x1: e.x, y1: e.y, x2: target.x, y2: target.y, life: 20, color: '#f0f' });
          }
        }
        e.slowTimer = Math.max(e.slowTimer || 0, 10);
      }
    });
    hackedEnemies.forEach(e => { if (e && (!e.hackedTimer || e.hackedTimer <= 0)) { e.hacked = false; e.vulnerable = false; e.vulnPct = 0; } });
    hackedEnemies = hackedEnemies.filter(e => e && e.hacked && e.hackedTimer > 0 && !e.dead);
  }

  enemies.forEach(e => {
    if (e.burning && e.burnTimer > 0 && !e.dead) {
      e.burnTimer--;
      if (e.burnTimer % 30 === 0) {
        damageEnemy(e, e.burnDmg);
        for (let i = 0; i < 5; i++) {
          particles.push({ x: e.x + (Math.random() - 0.5) * 20, y: e.y + (Math.random() - 0.5) * 20, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 3 - 1, life: 30, color: '#f80', size: 3 });
        }
      }
    }
  });

  lightningChains.forEach(c => c.life--);
  lightningChains = lightningChains.filter(c => c.life > 0);
  
  turrets.forEach(t => {
    if (t.hp <= 0 && !t.exploded) {
      t.exploded = true;
      if (getSkillLevel('t_u_explode') > 0) {
        explode(t.x, t.y, 120, getPlayerStats().dmg * 3, '#ff0');
        enemies.forEach(e => { if (!e.dead && dist(t.x, t.y, e.x, e.y) < 120) e.stunTimer = (e.stunTimer || 0) + 60; });
        shake = 10;
      }
    }
    if (t.hp <= 0) return;
    t.shootCd--;
    if (t.shootCd <= 0) {
      let closest = null, closestDist = 500;
      enemies.forEach(e => { if (!e.dead && dist(t.x, t.y, e.x, e.y) < closestDist) { closest = e; closestDist = dist(t.x, t.y, e.x, e.y); } });
      if (closest) {
        const a = Math.atan2(closest.y - t.y, closest.x - t.x);
        turretProjectiles.push({ x: t.x, y: t.y, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8, dmg: t.turretDmg || Math.floor(classes[playerClass].dmg * 0.5), life: 60 });
        t.shootCd = Math.floor(30 * Math.max(0.3, 1 - getSkillBonus('ultCd')));
        playSound('turret');
      }
    }
    if (getSkillLevel('t_u_repair') > 0 && t.hp < t.maxHp) t.hp = Math.min(t.maxHp, t.hp + Math.floor(t.maxHp * 0.03));
  });
  turrets = turrets.filter(t => t.hp > 0);
  
  turretProjectiles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.life--;
    enemies.forEach(e => { if (!e.dead && dist(p.x, p.y, e.x, e.y) < e.size + 4) { damageEnemy(e, p.dmg); p.life = 0; } });
    if (p.owner === 'enemy' || true) {
      turrets.forEach(t => {
        if (t.hp > 0 && dist(p.x, p.y, t.x, t.y) < t.size + p.size) {
          t.hp -= p.dmg; p.life = 0;
          damageTexts.push({ x:t.x, y:t.y-10, text:Math.round(p.dmg), life:30, vy:-1, color:'#ff0' });
        }
      });
    }
  });
  turretProjectiles = turretProjectiles.filter(p => p.life > 0);
  
  burnZones.forEach(z => {
    z.life--;
    if (z.life % 30 === 0 && z.life > 0) enemies.forEach(e => { if (!e.dead && dist(z.x, z.y, e.x, e.y) < z.radius) damageEnemy(e, z.dmg); });
  });
  burnZones = burnZones.filter(z => z.life > 0);
  
  damageZones.forEach(z => {
    z.life--;
    if (z.life <= 0 && !z.exploded) {
      z.exploded = true;
      enemies.forEach(e => { if (!e.dead && dist(z.x, z.y, e.x, e.y) < z.radius) damageEnemy(e, z.dmg); });
      shake = 3;
      for (let i = 0; i < 8; i++) particles.push({ x:z.x, y:z.y, vx:Math.cos(Math.random()*Math.PI*2)*3, vy:Math.sin(Math.random()*Math.PI*2)*3, life:15, color:'#0ff', size:4 });
    }
  });
damageZones = damageZones.filter(z => !z.exploded || z.life > -10);
   
  lasers.forEach(l => {
    l.life--;
    if (playerClass === 'tech' && l.active) {
      enemies.forEach(e => { if (!e.dead && pointLineDist(e.x, e.y, l.x1, l.y1, l.x2, l.y2) < e.size + l.width/2 + 2) damageEnemy(e, classes[playerClass].dmg * 0.3); });
    }
  });
  lasers = lasers.filter(l => l.life > 0);
  
  particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vx *= 0.95; p.vy *= 0.95; p.life--; });
  particles = particles.filter(p => p.life > 0);
  swordSwings.forEach(s => s.life--); swordSwings = swordSwings.filter(s => s.life > 0);
  ability1Trails.forEach(t => t.life--); ability1Trails = ability1Trails.filter(t => t.life > 0);
  ability1Impact.forEach(t => t.life--); ability1Impact = ability1Impact.filter(t => t.life > 0);
  
  pickups.forEach(p => {
    p.life--;
    if (dist(p.x,p.y,player.x,player.y) < 50 && !pendingPickup) {
      if (p.type === 'hp') {
        player.hp = Math.min(player.maxHp, player.hp + 25);
        damageTexts.push({ x:player.x, y:player.y-10, text:'+25', life:30, vy:-1, color:'#0f0' });
        playSound('pickup');
        p.life = 0;
      } else if (p.type === 'implant') {
        const impl = IMPLANT_TYPES.find(i => i.id === p.implantId);
        const hasImplant = player.implants[impl.id] > 0;
        const uniqueTypes = Object.keys(player.implants).length;
        if (hasImplant) { addImplant(impl.id); playSound('pickup'); p.life = 0; }
        else if (uniqueTypes >= 3) {
          player.xp += 10;
          damageTexts.push({ x:player.x, y:player.y-10, text:'+10 XP', life:30, vy:-1, color:'#ff0' });
          showMsg('ИМПЛАНТ В ОПЫТ: +10', '#ff0');
          p.life = 0;
        } else {
          showPickupMenu(p);
        }
      }
    }
  });
  pickups = pickups.filter(p => p.life > 0);
  
  damageTexts.forEach(t => { t.y += t.vy; t.life--; });
  damageTexts = damageTexts.filter(t => t.life > 0);
  worldObjects.forEach(o => { if (o.rotSpeed) o.rot += o.rotSpeed; });
  enemies = enemies.filter(e => !e.dead);
  
  const towerCount = enemies.filter(e => e.type.tower && !e.dead).length;
  const spawnRate = towerCount >= 1 ? 2 : 1;
  const maxEnemies = (10 + Math.floor(survivalTime / 60) * 2) * spawnRate;
  if (enemies.length < maxEnemies) spawnEnemy();
  if (towerCount < 10 && survivalTime > 60 && Math.random() < 0.002) spawnTower();
  
  if (survivalTime >= nextBossTime && !isFloorTransition) {
    isFloorTransition = true;
    spawnBoss();
    nextBossTime += 180;
    swordSwings = []; ability1Trails = []; ability1Impact = []; scatterShotActive = 0; railgunBeams = [];
    isFloorTransition = false;
  }
  
  if (player.hp <= 0) {
    gameRunning = false;
    playSound('death');
    showMsg('ПОРАЖЕНИЕ', '#f00');
    document.getElementById('deathKills').textContent = 'УБИЙСТВ: ' + player.kills + ' | УРОВЕНЬ: ' + player.level;
    setTimeout(() => { document.getElementById('deathScreen').style.display = 'flex'; }, 500);
  }
  if (shake > 0) shake *= 0.85;
  updateUI();
  updateDebug();
}

function showPickupMenu(pickup) {
  pendingPickup = pickup; gamePaused = true;
  const impl = IMPLANT_TYPES.find(i => i.id === pickup.implantId);
  const count = player.implants[impl.id] || 0;
  const uniqueTypes = Object.keys(player.implants).length;
  const isNewType = count === 0;
  const hasThreeTypes = uniqueTypes >= 3;
  const willGiveXP = isNewType && hasThreeTypes;
  
  document.getElementById('pickupName').textContent = impl.name;
  document.getElementById('pickupName').style.color = impl.color;
  let statsText = impl.desc + '<br>СТЕК: ' + count + '<br>ТИПОВ: ' + uniqueTypes + '/3'; 
  if (willGiveXP) statsText += '<br><span style="color:#ff0">МАКС ТИПОВ — ДАСТ 10 ОПЫТА</span>';
  else if (hasThreeTypes && isNewType) statsText += '<br><span style="color:#ff0">НЕТ МЕСТА ДЛЯ НОВОГО ТИПА</span>';
  
  document.getElementById('pickupStats').innerHTML = statsText;
  document.getElementById('btnTake').textContent = willGiveXP ? 'ПРЕВРАТИТЬ В ОПЫТ (10)' : 'ВЗЯТЬ (F)';
  document.getElementById('pickupMenu').style.border = '2px solid ' + impl.color;
  document.getElementById('pickupMenu').style.boxShadow = '0 0 30px ' + impl.color;
  document.getElementById('pickupMenu').classList.add('show');
}

function takePickup() {
  if (!pendingPickup) return;
  playSound('ui_click');
  const impl = IMPLANT_TYPES.find(i => i.id === pendingPickup.implantId);
  addImplant(impl.id);
  pickups = pickups.filter(p => p !== pendingPickup);
  closePickupMenu();
}

function skipPickup() {
  playSound('ui_click');
  pickups = pickups.filter(p => p !== pendingPickup);
  closePickupMenu();
}

function closePickupMenu() {
  pendingPickup = null; gamePaused = false;
  document.getElementById('pickupMenu').classList.remove('show');
}

function updateUI() {
  document.getElementById('hpBar').firstElementChild.style.width = Math.max(0, player.hp/player.maxHp*100) + '%';
  document.getElementById('xpBar').firstElementChild.style.width = (player.xp/player.xpNext*100) + '%';
  document.getElementById('hpText').textContent = Math.max(0, player.hp) + ' / ' + player.maxHp;
  document.getElementById('xpText').textContent = player.xp + ' / ' + player.xpNext;
  document.getElementById('lvl').textContent = player.level;
  document.getElementById('kills').textContent = player.kills;
  document.getElementById('skillPts').textContent = player.skillPoints;
  document.getElementById('skillPts').style.color = player.skillPoints > 0 ? (Date.now() % 1000 < 500 ? '#ff0' : '#0f0') : '#0f0';
  
  const mins = Math.floor(survivalTime / 60);
  const secs = survivalTime % 60;
  document.getElementById('timer').textContent = mins.toString().padStart(2, '0') + ':' + secs.toString().padStart(2, '0');
  
  const nextBossIn = nextBossTime - survivalTime;
  if (nextBossIn <= 30 && nextBossIn > 0) {
    document.getElementById('waveInfo').textContent = 'БОСС ЧЕРЕЗ ' + nextBossIn + 'С';
    document.getElementById('waveInfo').style.color = '#f00';
  } else if (survivalTime >= nextBossTime) {
    document.getElementById('waveInfo').textContent = 'БОСС!';
    document.getElementById('waveInfo').style.color = '#f00';
  } else {
    document.getElementById('waveInfo').textContent = 'ВОЛНА ' + (Math.floor(survivalTime / 30) + 1);
    document.getElementById('waveInfo').style.color = '#0ff';
  }
  
  const stats = getPlayerStats();
  const abShiftPct = Math.max(0, 1 - player.dashCd / stats.qCd);
  const ultMaxCd = playerClass === 'melee' ? 1500 : (playerClass === 'tech' ? 1500 : 600);
  const abRPct = Math.max(0, 1 - player.ultCd / ultMaxCd);

  document.getElementById('abShiftCd').style.display = abShiftPct < 1 ? 'block' : 'none';
  document.getElementById('abShiftCdTxt').textContent = abShiftPct < 1 ? Math.ceil(player.dashCd / 60) + 'с' : '';
  document.getElementById('abShiftCd').style.height = ((1 - abShiftPct) * 100) + '%';

  if (playerClass === 'melee') {
    // ЭДЖРАННЕР: 1 - ВРАЩАЮЩИЙСЯ КЛИНОК, 2 - ЭМИ-ГРАНАТА
    const stats = getPlayerStats();
    const ab1CdBase = 540 * (1 - getSkillBonus('a1Cd'));
    const ab1Pct = Math.max(0, 1 - player.abilityCd1 / Math.max(1, Math.floor(ab1CdBase)));
    const ab2CdBase = 480 * (1 - getSkillBonus('a2Cd'));
    const ab2Pct = Math.max(0, 1 - player.abilityCd2 / Math.max(1, Math.floor(ab2CdBase)));

    document.getElementById('ab1Cd').style.display = ab1Pct < 1 ? 'block' : 'none';
    document.getElementById('ab1CdTxt').textContent = ab1Pct < 1 ? Math.ceil(player.abilityCd1 / 60) + 'с' : '';
    document.getElementById('ab1Cd').style.height = ((1 - ab1Pct) * 100) + '%';

    document.getElementById('ab2Cd').style.display = ab2Pct < 1 ? 'block' : 'none';
    document.getElementById('ab2CdTxt').textContent = ab2Pct < 1 ? Math.ceil(player.abilityCd2 / 60) + 'с' : '';
    document.getElementById('ab2Cd').style.height = ((1 - ab2Pct) * 100) + '%';
  } else if (playerClass === 'magic') {
    // НЕТРАННЕР: 1 - КИБЕР-ВЗЛОМ, 2 - КИБЕР-ДЕМОНЫ
    const ab1CdBase = 420;
    const ab1Pct = Math.max(0, 1 - player.abilityCd1 / ab1CdBase);
    const ab2CdBase = 480;
    const ab2Pct = Math.max(0, 1 - player.abilityCd2 / ab2CdBase);
    
    document.getElementById('ab1Cd').style.display = ab1Pct < 1 ? 'block' : 'none';
    document.getElementById('ab1CdTxt').textContent = ab1Pct < 1 ? Math.ceil(player.abilityCd1 / 60) + 'с' : '';
    document.getElementById('ab1Cd').style.height = ((1 - ab1Pct) * 100) + '%';
    
    document.getElementById('ab2Cd').style.display = ab2Pct < 1 ? 'block' : 'none';
    document.getElementById('ab2CdTxt').textContent = ab2Pct < 1 ? Math.ceil(player.abilityCd2 / 60) + 'с' : '';
    document.getElementById('ab2Cd').style.height = ((1 - ab2Pct) * 100) + '%';
  } else if (playerClass === 'tech') {
    // ТЕХНИК: 1 - ТУРЕЛЬ, 2 - ДРОН
    const stats = getPlayerStats();
    const ab1CdBase = 720 * (1 - getSkillBonus('a1Cd'));
    const ab1Pct = Math.max(0, 1 - player.abilityCd1 / Math.max(1, Math.floor(ab1CdBase)));
    const ab2CdBase = 900 * (1 - getSkillBonus('a2Cd'));
    const ab2Pct = Math.max(0, 1 - player.abilityCd2 / Math.max(1, Math.floor(ab2CdBase)));

    document.getElementById('ab1Cd').style.display = ab1Pct < 1 ? 'block' : 'none';
    document.getElementById('ab1CdTxt').textContent = ab1Pct < 1 ? Math.ceil(player.abilityCd1 / 60) + 'с' : '';
    document.getElementById('ab1Cd').style.height = ((1 - ab1Pct) * 100) + '%';

    document.getElementById('ab2Cd').style.display = ab2Pct < 1 ? 'block' : 'none';
    document.getElementById('ab2CdTxt').textContent = ab2Pct < 1 ? Math.ceil(player.abilityCd2 / 60) + 'с' : '';
    document.getElementById('ab2Cd').style.height = ((1 - ab2Pct) * 100) + '%';
  }

  document.getElementById('abRCd').style.display = abRPct < 1 ? 'block' : 'none';
  document.getElementById('abRCdTxt').textContent = abRPct < 1 ? Math.ceil(player.ultCd / 60) + 'с' : (player.ultCharge > 0 ? Math.floor(player.ultCharge) + '%' : '');
  document.getElementById('abRCd').style.height = ((1 - abRPct) * 100) + '%';

  document.getElementById('abShift').style.borderColor = abShiftPct >= 1 ? '#0ff' : '#333';
  document.getElementById('ab1').style.borderColor = playerClass === 'tech' ? '#ff0' : (playerClass === 'magic' ? (player.abilityCd1 <= 0 ? '#a0f' : '#333') : (player.attackCd <= 0 ? '#f0f' : '#333'));
  document.getElementById('ab2').style.borderColor = playerClass === 'melee' ? (edgerunnerKnifeCharges > 0 ? '#0ff' : '#f00') : (playerClass === 'magic' ? (player.abilityCd2 <= 0 ? '#a0f' : '#333') : '#333');
  document.getElementById('abR').style.borderColor = player.ultCharge >= player.ultMaxCharge ? '#ff0' : (abRPct >= 1 ? '#f0f' : '#333');
}

function updateImplantUI() {
  const container = document.getElementById('implantList');
  container.innerHTML = '';
  for (const [id, count] of Object.entries(player.implants)) {
    const impl = IMPLANT_TYPES.find(i => i.id === id);
    if (!impl) continue;
    const pct = count * impl.base;
    const mult = (1 + pct / 100).toFixed(2);
    const div = document.createElement('div');
    div.className = 'implant-slot';
    div.innerHTML = `
      <div>
        <div class="implant-name" style="color:${impl.color}">${impl.name} x${count}</div>
        <div class="implant-desc">${impl.desc}</div>
      </div>
      <div class="implant-mult" style="color:${impl.color}">x${mult}</div>`;
    container.appendChild(div);
  }
  if (Object.keys(player.implants).length === 0) container.innerHTML = '<div style="color:#555; text-align:center; font-size:11px;">ПУСТО</div>';
}

function updateDebug() {
  document.getElementById('debug').textContent = 'POS: ' + Math.round(player.x) + ', ' + Math.round(player.y) + ' | CAM: ' + Math.round(camera.x) + ', ' + Math.round(camera.y) + ' | ENEMIES: ' + enemies.length + ' | IMPLANT TYPES: ' + Object.keys(player.implants).length + '/3';
}