// Pixel Treta - logica e desenho do jogo (roda na tela principal).
(function (root) {
  'use strict';
  const W = 384, H = 216;
  const L = 1, R = 2, U = 4, D = 8, A = 16, C = 32;
  const COLORS = ['#ff4d4d', '#4da6ff', '#5fe36a', '#ffd23f', '#c77dff', '#ff9f43', '#3fe0d0', '#ff7ab8'];
  const WEAPONS = {
    fist:    { name: 'SOCO',     cd: 16 },
    pistol:  { name: 'PISTOLA',  cd: 14, ammo: 12, dmg: 14, spd: 6,   n: 1, spread: 0.02, kick: 0.4, col: '#b8c0d0' },
    uzi:     { name: 'METRALHA', cd: 4,  ammo: 40, dmg: 5,  spd: 6,   n: 1, spread: 0.08, kick: 0.2, col: '#7f8fa6' },
    shotgun: { name: 'ESCOPETA', cd: 42, ammo: 6,  dmg: 8,  spd: 6,   n: 5, spread: 0.2,  kick: 1.6, col: '#c98a4b' },
    bazooka: { name: 'BAZUCA',   cd: 55, ammo: 2,  dmg: 0,  spd: 3.5, n: 1, spread: 0,    kick: 2,   col: '#5fa35f', rocket: true },
    rifle:   { name: 'RIFLE',    cd: 50, ammo: 4,  dmg: 55, spd: 10,  n: 1, spread: 0,    kick: 2.5, col: '#e8e8f0' },
    bat:     { name: 'BASTAO',   cd: 22, ammo: 10, dmg: 22, col: '#d9a066', melee: true },
    grenade: { name: 'GRANADA',  cd: 35, ammo: 3,  col: '#3f7d3f', thrown: true }
  };
  const DROPS = ['pistol', 'pistol', 'pistol', 'uzi', 'uzi', 'shotgun', 'shotgun', 'bazooka', 'rifle', 'bat', 'bat', 'grenade', 'grenade', 'medkit', 'medkit'];
  const WALLS = [{ x: 0, y: -8, w: W, h: 8 }, { x: -8, y: -40, w: 8, h: H + 80 }, { x: W, y: -40, w: 8, h: H + 80 }];
  const SUDDEN = 4200; // frames ate a morte subita (70 s)
  const MAPS = [
    { name: 'TELHADO', bg: 0, tile: ['#3a3f5c', '#2c3048', '#6b74a8'],
      solids: [[0, 200, W, 16], [176, 168, 32, 32]],
      oneways: [[32, 160, 80], [272, 160, 80], [136, 136, 112], [48, 120, 72], [264, 120, 72], [152, 80, 80]],
      boxes: [['c', 60, 190], ['c', 72, 190], ['b', 92, 190], ['c', 314, 190], ['c', 302, 190], ['b', 284, 190], ['c', 187, 158], ['b', 150, 126], ['b', 226, 126], ['c', 62, 110], ['c', 312, 110], ['b', 204, 70]],
      spawns: [[20, 188], [358, 188], [100, 148], [280, 148], [100, 108], [275, 108], [160, 68], [185, 124]] },
    { name: 'GALPAO', bg: 1, tile: ['#5a4a3a', '#44372b', '#8a735a'],
      solids: [[0, 200, W, 16], [0, 156, 56, 8], [328, 156, 56, 8], [152, 96, 80, 8]],
      oneways: [[72, 172, 64], [248, 172, 64], [120, 140, 144], [40, 108, 72], [272, 108, 72], [160, 60, 64]],
      boxes: [['c', 62, 190], ['c', 312, 190], ['c', 150, 190], ['c', 224, 190], ['b', 188, 190], ['b', 130, 130], ['b', 246, 130], ['c', 160, 86], ['c', 214, 86], ['b', 188, 86], ['c', 6, 146], ['c', 368, 146], ['b', 188, 50]],
      spawns: [[30, 188], [346, 188], [100, 188], [280, 188], [90, 160], [290, 160], [60, 96], [310, 96]] },
    { name: 'CAIS', bg: 2, tile: ['#4a5560', '#39424b', '#7d8c99'], water: [150, 84],
      solids: [[0, 200, 150, 16], [234, 200, 150, 16], [60, 180, 32, 20], [292, 180, 32, 20]],
      oneways: [[166, 176, 52], [24, 164, 72], [288, 164, 72], [100, 132, 64], [220, 132, 64], [150, 100, 84], [30, 96, 56], [298, 96, 56]],
      boxes: [['c', 110, 190], ['c', 264, 190], ['c', 66, 170], ['c', 308, 170], ['b', 130, 190], ['b', 246, 190], ['b', 188, 166], ['b', 120, 122], ['b', 256, 122], ['b', 188, 90], ['c', 40, 86], ['c', 334, 86]],
      spawns: [[16, 188], [362, 188], [40, 152], [330, 152], [140, 120], [236, 120], [66, 84], [312, 84]] }
  ];
  const WIN_SCORE = 5;

  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const inside = (px, py, b) => px >= b.x && px < b.x + b.w && py >= b.y && py < b.y + b.h;
  const rnd = (a, b) => a + Math.random() * (b - a);

  class Game {
    constructor() {
      this.players = new Map();
      this.frame = 0;
      this.onEvent = null; // (id, tipo) -> feedback pro controle
      this.onSfx = null;   // (tipo) -> som
      this.mapIndex = -1; this.map = null;
      // cenario de fundo (gerado uma vez)
      let s = 7; const r = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
      this.bg = { stars: [], blds: [] };
      for (let i = 0; i < 40; i++) this.bg.stars.push([Math.floor(r() * W), Math.floor(r() * 110)]);
      for (let x = 0; x < W;) {
        const w = 18 + Math.floor(r() * 26), h = 40 + Math.floor(r() * 90), wins = [];
        for (let wy = 6; wy < h - 6; wy += 8) for (let wx = 4; wx < w - 5; wx += 7) if (r() < 0.35) wins.push([wx, wy]);
        this.bg.blds.push({ x, w, h, wins }); x += w + 2;
      }
      this.resetRound();
    }

    sfx(k) { if (this.onSfx) this.onSfx(k); }
    emit(id, k) { if (this.onEvent) this.onEvent(id, k); }

    resetRound(next) {
      if (next || !this.map) this.mapIndex = (this.mapIndex + 1) % MAPS.length;
      const m = this.map = MAPS[this.mapIndex];
      const box = (type, x, y) => ({ type, x, y, w: type === 'crate' ? 10 : 8, h: 10, hp: type === 'crate' ? 30 : 12, fuse: -1 });
      this.solids = WALLS.concat(m.solids.map(q => ({ x: q[0], y: q[1], w: q[2], h: q[3] })));
      this.oneways = m.oneways.map(q => ({ x: q[0], y: q[1], w: q[2] }));
      this.boxes = m.boxes.map(q => box(q[0] === 'c' ? 'crate' : 'barrel', q[1], q[2]));
      this.nades = []; this.rt = 0; this.intro = 120;
      this.bullets = []; this.pickups = []; this.parts = []; this.booms = [];
      this.roundOver = 0; this.winner = null; this.champion = null;
      this.shake = 0; this.dropTimer = 120;
      const order = m.spawns.map((_, i) => i).sort(() => Math.random() - 0.5);
      let i = 0;
      for (const p of this.players.values()) this.spawn(p, order[i++ % order.length]);
    }

    addPlayer(id, name) {
      const used = new Set([...this.players.values()].map(p => p.ci));
      let ci = 0; while (used.has(ci) && ci < COLORS.length - 1) ci++;
      const p = { id, name, ci, color: COLORS[ci], score: 0, input: 0, prev: 0, w: 6, h: 12 };
      this.players.set(id, p);
      this.spawn(p, Math.floor(Math.random() * this.map.spawns.length));
      return p;
    }
    removePlayer(id) { this.players.delete(id); }
    setInput(id, b) { const p = this.players.get(id); if (p) p.input = b; }

    spawn(p, si) {
      const s = this.map.spawns[si % this.map.spawns.length];
      Object.assign(p, { x: s[0], y: s[1], vx: 0, vy: 0, hp: 100, dead: false, face: s[0] < W / 2 ? 1 : -1,
        weapon: 'fist', ammo: 0, cd: 20, flash: 0, stun: 0, punch: 0, drop: 0, onGround: false, respawn: 0, walk: 0, roll: 0, rollCd: 0 });
    }

    move(b, oneway) {
      const cols = this.solids.concat(this.boxes);
      b.x += b.vx;
      for (const s of cols) if (s !== b && overlap(b, s)) {
        if (b.vx > 0) b.x = s.x - b.w; else if (b.vx < 0) b.x = s.x + s.w;
        b.vx = 0;
      }
      const prevBottom = b.y + b.h;
      b.y += b.vy; b.onGround = false;
      for (const s of cols) if (s !== b && overlap(b, s)) {
        if (b.vy > 0) { b.y = s.y - b.h; b.onGround = true; } else if (b.vy < 0) b.y = s.y + s.h;
        b.vy = 0;
      }
      if (oneway && b.vy >= 0) for (const o of this.oneways) {
        if (b.x + b.w > o.x && b.x < o.x + o.w && prevBottom <= o.y + 0.01 && b.y + b.h >= o.y) {
          b.y = o.y - b.h; b.vy = 0; b.onGround = true;
        }
      }
    }

    burst(x, y, n, col, sp) {
      for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: rnd(-sp, sp), vy: rnd(-sp * 1.4, sp * 0.4), life: rnd(15, 40), col });
    }

    hurt(p, dmg, kx, ky, by) {
      if (p.dead) return;
      p.hp -= dmg; p.flash = 6; p.vx += kx; p.vy += ky; p.stun = Math.max(p.stun, 8);
      this.burst(p.x + 3, p.y + 5, 4, '#d6303a', 1.5);
      this.emit(p.id, 'hit');
      if (p.hp <= 0) {
        p.hp = 0; p.dead = true; p.respawn = 90;
        this.burst(p.x + 3, p.y + 5, 14, p.color, 2.5);
        this.sfx('dead'); this.emit(p.id, 'dead');
        if (p.weapon !== 'fist') this.pickups.push({ x: p.x, y: p.y, w: 7, h: 5, vx: 0, vy: -2, type: p.weapon, ammo: p.ammo, life: 900 });
        p.weapon = 'fist';
      }
    }

    hitBox(b, dmg) {
      if (b.hp <= 0) return;
      b.hp -= dmg;
      if (b.hp > 0) return;
      if (b.type === 'barrel') { b.fuse = 8; return; }
      this.boxes.splice(this.boxes.indexOf(b), 1);
      this.burst(b.x + 5, b.y + 5, 10, '#a8743a', 2); this.sfx('crate');
      if (Math.random() < 0.4) this.pickups.push({ x: b.x + 1, y: b.y, w: 7, h: 5, vx: 0, vy: -1.5, type: DROPS[Math.floor(Math.random() * DROPS.length)], life: 1200 });
    }

    explode(x, y, by) {
      const r = 32;
      this.booms.push({ x, y, r, life: 12 }); this.shake = 10; this.sfx('boom');
      this.burst(x, y, 20, '#ff9f43', 3); this.burst(x, y, 10, '#555', 2);
      for (const p of this.players.values()) {
        const dx = p.x + 3 - x, dy = p.y + 6 - y, d = Math.hypot(dx, dy);
        if (d < r) { const k = 1 - d / r, n = d || 1; this.hurt(p, 20 + 50 * k, dx / n * 4 * (k + 0.3), dy / n * 3 * (k + 0.3) - 2, by); p.stun = 20; }
      }
      for (const b of this.boxes.slice()) if (Math.hypot(b.x + b.w / 2 - x, b.y + b.h / 2 - y) < r) this.hitBox(b, 40);
    }

    attack(p) {
      const wp = WEAPONS[p.weapon]; p.cd = wp.cd;
      if (p.weapon === 'fist' || wp.melee) {
        const rg = wp.melee ? 14 : 10, dmg = wp.melee ? wp.dmg : 10, kb = wp.melee ? 5 : 3;
        p.punch = 8; this.sfx('punch'); let hit = false;
        const hb = { x: p.face > 0 ? p.x + p.w : p.x - rg, y: p.y, w: rg, h: p.h };
        for (const o of this.players.values()) if (o !== p && !o.dead && o.roll <= 0 && overlap(hb, o)) { this.hurt(o, dmg, p.face * kb, -2, p.id); this.sfx('hit'); hit = true; }
        for (const b of this.boxes.slice()) if (overlap(hb, b)) { this.hitBox(b, dmg + 2); hit = true; }
        if (wp.melee && hit && --p.ammo <= 0) p.weapon = 'fist';
        return;
      }
      if (wp.thrown) {
        this.sfx('jump');
        this.nades.push({ x: p.x + 1, y: p.y + 1, w: 4, h: 4, vx: p.face * 3 + p.vx * 0.5, vy: -3.2, fuse: 100, by: p.id });
        if (--p.ammo <= 0) p.weapon = 'fist';
        return;
      }
      this.sfx(wp.rocket ? 'rocket' : 'shot');
      for (let i = 0; i < wp.n; i++) {
        const a = rnd(-wp.spread, wp.spread);
        this.bullets.push({ x: p.face > 0 ? p.x + p.w + 1 : p.x - 2, y: p.y + 5, vx: p.face * wp.spd * Math.cos(a), vy: wp.spd * Math.sin(a),
          by: p.id, dmg: wp.dmg, life: 90, rocket: !!wp.rocket });
      }
      p.vx -= p.face * wp.kick;
      if (--p.ammo <= 0) p.weapon = 'fist';
    }

    updatePlayer(p) {
      const inp = p.dead ? 0 : p.input;
      if (p.cd > 0) p.cd--; if (p.flash > 0) p.flash--; if (p.punch > 0) p.punch--; if (p.drop > 0) p.drop--; if (p.rollCd > 0) p.rollCd--;
      if (p.roll > 0) { p.roll--; p.vx = p.face * 2.8; }
      else if (p.stun > 0) { p.stun--; p.vx *= 0.93; }
      else {
        const ax = (inp & R ? 1 : 0) - (inp & L ? 1 : 0);
        if (ax) { p.vx += ax * 0.4; p.face = ax; p.walk++; } else { p.vx *= 0.7; p.walk = 0; }
        p.vx = Math.max(-1.7, Math.min(1.7, p.vx));
        if ((inp & U) && !(p.prev & U) && p.onGround) { p.vy = -5.2; this.sfx('jump'); }
        if (!(inp & U) && p.vy < -2) p.vy = -2;
        if ((inp & D) && p.onGround) p.drop = 8;
        if ((inp & C) && !(p.prev & C) && p.onGround && p.rollCd <= 0) { p.roll = 14; p.rollCd = 55; this.sfx('jump'); }
      }
      if (p.dead) p.vx *= 0.9;
      p.vy = Math.min(p.vy + 0.25, 6);
      this.move(p, p.drop <= 0);
      if (p.y > H + 10) { if (!p.dead) { this.hurt(p, 999, 0, 0, 0); this.sfx('splash'); } p.y = H + 10; p.vy = 0; p.vx = 0; }
      if (!p.dead && p.stun <= 0 && p.roll <= 0 && (inp & A) && p.cd <= 0) this.attack(p);
      p.prev = inp;
    }

    updateBullets() {
      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i]; let gone = --b.life <= 0;
        if (b.rocket && this.frame % 2 === 0) this.parts.push({ x: b.x, y: b.y, vx: 0, vy: -0.2, life: 14, col: '#999' });
        for (let s = 0; s < 3 && !gone; s++) {
          b.x += b.vx / 3; b.y += b.vy / 3;
          if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) { gone = true; break; }
          for (const o of this.solids) if (inside(b.x, b.y, o)) { gone = true; this.burst(b.x, b.y, 2, '#ccc', 1); break; }
          if (gone) break;
          for (const o of this.boxes) if (inside(b.x, b.y, o)) { gone = true; if (!b.rocket) this.hitBox(o, b.dmg); break; }
          if (gone) break;
          for (const p of this.players.values()) if (p.id !== b.by && !p.dead && p.roll <= 0 && inside(b.x, b.y, p)) {
            gone = true; if (!b.rocket) { this.hurt(p, b.dmg, Math.sign(b.vx) * 1.2, -0.6, b.by); this.sfx('hit'); } break;
          }
        }
        if (gone) { if (b.rocket) this.explode(b.x, b.y, b.by); this.bullets.splice(i, 1); }
      }
    }

    step() {
      this.frame++;
      for (const p of this.players.values()) this.updatePlayer(p);
      this.updateBullets();
      for (const b of this.boxes.slice()) if (b.fuse >= 0 && --b.fuse < 0) {
        this.boxes.splice(this.boxes.indexOf(b), 1); this.explode(b.x + 4, b.y + 5, 0);
      }
      for (let i = this.nades.length - 1; i >= 0; i--) {
        const n = this.nades[i], ovx = n.vx, ovy = n.vy + 0.2;
        n.vy = Math.min(ovy, 6); this.move(n, true);
        const landed = n.vy === 0 && ovy > 0;
        if (n.vx === 0 && ovx !== 0) n.vx = -ovx * 0.5;
        if (landed) { n.vy = ovy > 1.5 ? -ovy * 0.4 : 0; n.vx *= 0.8; }
        if (--n.fuse <= 0 || (n.impact && landed) || n.y > H) { this.nades.splice(i, 1); if (n.y <= H) this.explode(n.x + 2, n.y + 2, n.by); }
      }
      if (this.intro > 0) this.intro--;
      // itens
      if (--this.dropTimer <= 0) {
        this.dropTimer = 260;
        if (this.pickups.length < 4 && this.players.size)
          this.pickups.push({ x: rnd(20, W - 30), y: 0, w: 7, h: 5, vx: 0, vy: 0, type: DROPS[Math.floor(Math.random() * DROPS.length)], life: 1200 });
      }
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const k = this.pickups[i];
        k.vy = Math.min(k.vy + 0.2, 5); this.move(k, true);
        let taken = --k.life <= 0 || k.y > H;
        for (const p of this.players.values()) if (!taken && !p.dead && overlap(p, k)) {
          if (k.type === 'medkit') { if (p.hp < 100) { p.hp = Math.min(100, p.hp + 40); taken = true; this.sfx('pick'); } }
          else if (p.weapon === 'fist') { p.weapon = k.type; p.ammo = k.ammo || WEAPONS[k.type].ammo; p.cd = 10; taken = true; this.sfx('pick'); }
        }
        if (taken) this.pickups.splice(i, 1);
      }
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const q = this.parts[i]; q.x += q.vx; q.y += q.vy; q.vy += 0.12;
        if (--q.life <= 0) this.parts.splice(i, 1);
      }
      for (let i = this.booms.length - 1; i >= 0; i--) if (--this.booms[i].life <= 0) this.booms.splice(i, 1);
      if (this.shake > 0) this.shake--;
      // rodada
      const all = [...this.players.values()], alive = all.filter(p => !p.dead);
      if (all.length >= 2) {
        if (this.roundOver > 0) { if (--this.roundOver === 0) { if (this.champion) for (const p of all) p.score = 0; this.resetRound(true); } }
        else if (alive.length > 1) {
          if (++this.rt > SUDDEN && this.rt % 70 === 0) this.nades.push({ x: rnd(16, W - 22), y: 0, w: 6, h: 6, vx: 0, vy: 1, fuse: 600, by: 0, impact: true });
        } else {
          this.winner = alive[0] || null; this.roundOver = 180;
          if (this.winner) {
            this.winner.score++; this.emit(this.winner.id, 'win'); this.sfx('win');
            if (this.winner.score >= WIN_SCORE) { this.champion = this.winner; this.roundOver = 360; }
          }
        }
      } else {
        this.roundOver = 0; this.winner = null; this.champion = null;
        for (const p of all) if (p.dead && --p.respawn <= 0) this.spawn(p, Math.floor(Math.random() * this.map.spawns.length));
      }
    }

    drawBg(c, f) {
      const k = this.map.bg;
      if (k === 0) {
        c.fillStyle = '#12122a'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#fff'; for (const s of this.bg.stars) if ((s[0] + f / 30 | 0) % 7) c.fillRect(s[0], s[1], 1, 1);
        c.fillStyle = '#f5f0c8'; c.fillRect(300, 22, 14, 14); c.fillStyle = '#12122a'; c.fillRect(306, 20, 10, 10);
        for (const b of this.bg.blds) {
          c.fillStyle = '#1c1c3c'; c.fillRect(b.x, 200 - b.h, b.w, b.h);
          c.fillStyle = '#3a3460'; for (const w of b.wins) c.fillRect(b.x + w[0], 200 - b.h + w[1], 3, 4);
        }
      } else if (k === 1) {
        c.fillStyle = '#1d1712'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#2a211a'; for (let x = 0; x < W; x += 32) c.fillRect(x, 0, 2, H); c.fillRect(0, 44, W, 3);
        for (let x = 20; x < W; x += 64) { c.fillStyle = '#33415a'; c.fillRect(x, 16, 24, 16); c.fillStyle = '#1d1712'; c.fillRect(x + 11, 16, 2, 16); c.fillRect(x, 23, 24, 2); }
        for (const x of [64, 192, 320]) {
          c.fillStyle = '#111'; c.fillRect(x, 0, 1, 12); c.fillRect(x - 3, 12, 7, 2);
          c.fillStyle = (f + x) % 240 < 6 ? '#665' : '#ffe9a0'; c.fillRect(x - 2, 14, 5, 2);
          c.fillStyle = 'rgba(255,233,160,.05)'; for (let i = 0; i < 6; i++) c.fillRect(x - 6 - i * 5, 16 + i * 30, 13 + i * 10, 30);
        }
        c.fillStyle = '#2a211a'; for (let x = 8; x < W; x += 48) c.fillRect(x, 176, 30, 24);
      } else {
        const bands = [['#2a1a3a', 0], ['#4a2247', 40], ['#8a3048', 80], ['#c4553a', 112], ['#f0a04a', 136]];
        for (const [col, y] of bands) { c.fillStyle = col; c.fillRect(0, y, W, H); }
        c.fillStyle = '#ffe08a'; for (let dy = 0; dy < 16; dy += 2) { const dx = Math.round(Math.sqrt(256 - dy * dy)); c.fillRect(250 - dx, 152 - dy, dx * 2, 2); }
        c.fillStyle = '#1b2a4a'; c.fillRect(0, 154, W, H);
        c.fillStyle = '#f0a04a'; for (let i = 0; i < 6; i++) c.fillRect(236 + (i * 13 + (f >> 4)) % 28, 158 + i * 5, 8 - i, 1);
        c.fillStyle = '#20182c';
        for (const x of [36, 330]) { c.fillRect(x, 70, 4, 90); c.fillRect(x - 22, 70, 60, 3); c.fillRect(x + 30, 73, 1, 22); c.fillRect(x + 27, 95, 7, 5); }
        c.fillRect(120, 140, 50, 14); c.fillRect(132, 132, 14, 8);
      }
    }

    // ---------- desenho ----------
    render(c) {
      const f = this.frame;
      c.save();
      this.drawBg(c, f);
      const T = this.map.tile;
      if (this.shake > 0) c.translate(Math.round(rnd(-2, 2)), Math.round(rnd(-2, 2)));
      for (const s of this.solids) {
        c.fillStyle = T[0]; c.fillRect(s.x, s.y, s.w, s.h);
        c.fillStyle = T[1];
        for (let y = s.y + 4; y < s.y + s.h; y += 4) c.fillRect(s.x, y, s.w, 1);
        for (let y = s.y, r = 0; y < s.y + s.h; y += 4, r++) for (let x = s.x + (r % 2 ? 4 : 0); x < s.x + s.w; x += 8) c.fillRect(x, y, 1, 4);
        c.fillStyle = T[2]; c.fillRect(s.x, s.y, s.w, 1);
      }
      if (this.map.water) {
        const [wx, ww] = this.map.water;
        c.fillStyle = '#1b3a6a'; c.fillRect(wx, 206, ww, 10);
        c.fillStyle = '#6fa8dc'; for (let x = wx; x < wx + ww; x += 6) c.fillRect(x + ((f >> 3) + x) % 4, 206, 3, 1);
      }
      for (const o of this.oneways) {
        c.fillStyle = '#8a5a3c'; c.fillRect(o.x, o.y, o.w, 3);
        c.fillStyle = '#c08a58'; c.fillRect(o.x, o.y, o.w, 1);
        c.fillStyle = '#5a3a26'; for (let x = o.x + 7; x < o.x + o.w; x += 8) c.fillRect(x, o.y, 1, 3);
      }
      for (const b of this.boxes) {
        if (b.type === 'crate') {
          c.fillStyle = '#6e4a22'; c.fillRect(b.x, b.y, 10, 10);
          c.fillStyle = '#b07c3e'; c.fillRect(b.x + 1, b.y + 1, 8, 8);
          c.fillStyle = '#6e4a22'; for (let i = 2; i < 8; i++) { c.fillRect(b.x + i, b.y + i, 1, 1); c.fillRect(b.x + 9 - i, b.y + i, 1, 1); }
        } else {
          c.fillStyle = b.fuse >= 0 && f % 4 < 2 ? '#fff' : '#c0392b'; c.fillRect(b.x, b.y, 8, 10);
          c.fillStyle = '#f1c40f'; c.fillRect(b.x, b.y + 4, 8, 2);
          c.fillStyle = '#7d1f16'; c.fillRect(b.x, b.y, 8, 1); c.fillRect(b.x, b.y + 9, 8, 1);
        }
      }
      for (const k of this.pickups) {
        if (k.life < 120 && f % 8 < 4) continue;
        const y = Math.round(k.y) - (f % 40 < 20 ? 1 : 0), x = Math.round(k.x);
        if (k.type === 'medkit') { c.fillStyle = '#fff'; c.fillRect(x, y, 7, 5); c.fillStyle = '#e03131'; c.fillRect(x + 3, y + 1, 1, 3); c.fillRect(x + 2, y + 2, 3, 1); }
        else { c.fillStyle = WEAPONS[k.type].col; c.fillRect(x, y + 1, 7, 2); c.fillRect(x + 1, y + 3, 2, 2); c.fillStyle = '#fff'; c.fillRect(x, y + 1, 7, 1); }
      }
      c.font = 'bold 7px monospace'; c.textAlign = 'center';
      for (const p of this.players.values()) {
        const x = Math.round(p.x), y = Math.round(p.y);
        if (p.dead) { c.fillStyle = p.color; c.fillRect(x - 3, y + 9, 8, 3); c.fillStyle = '#f2c79a'; c.fillRect(x + 5, y + 9, 3, 3); continue; }
        if (p.roll > 0) {
          c.fillStyle = p.color; c.fillRect(x, y + 6, 6, 6);
          c.fillStyle = '#f2c79a'; c.fillRect(x + ((p.roll >> 1) % 2 ? 3 : 1), y + ((p.roll >> 2) % 2 ? 7 : 9), 2, 2);
          continue;
        }
        const white = p.flash > 0;
        c.fillStyle = white ? '#fff' : '#f2c79a'; c.fillRect(x + 1, y, 4, 4);
        c.fillStyle = white ? '#fff' : p.color; c.fillRect(x + 1, y, 4, 1); c.fillRect(x, y + 4, 6, 5);
        c.fillStyle = '#111'; c.fillRect(p.face > 0 ? x + 4 : x + 1, y + 2, 1, 1);
        c.fillStyle = white ? '#fff' : '#2b2b44';
        const st = p.onGround && p.walk ? (p.walk >> 2) % 2 : 0;
        if (!p.onGround) { c.fillRect(x, y + 9, 2, 2); c.fillRect(x + 4, y + 9, 2, 3); }
        else { c.fillRect(x + (st ? 0 : 1), y + 9, 2, 3); c.fillRect(x + (st ? 4 : 3), y + 9, 2, 3); }
        if (p.weapon === 'bat') {
          c.fillStyle = WEAPONS.bat.col;
          if (p.punch > 0) c.fillRect(p.face > 0 ? x + 6 : x - 9, y + 5, 9, 2); else c.fillRect(p.face > 0 ? x + 6 : x - 2, y - 2, 2, 8);
        } else if (p.weapon === 'grenade') {
          c.fillStyle = WEAPONS.grenade.col; c.fillRect(p.face > 0 ? x + 6 : x - 3, y + 5, 3, 3);
        } else if (p.weapon !== 'fist') {
          const len = { pistol: 4, uzi: 5, shotgun: 7, bazooka: 8, rifle: 10 }[p.weapon];
          c.fillStyle = WEAPONS[p.weapon].col; c.fillRect(p.face > 0 ? x + 4 : x + 2 - len, y + 5, len, 2);
          if (p.weapon === 'bazooka') c.fillRect(p.face > 0 ? x + 4 : x - 6, y + 4, 8, 1);
        } else if (p.punch > 0) { c.fillStyle = '#f2c79a'; c.fillRect(p.face > 0 ? x + 6 : x - 5, y + 5, 5, 2); }
        c.fillStyle = p.color; c.fillText(p.name, x + 3, y - 3);
      }
      for (const b of this.bullets) {
        if (b.rocket) { c.fillStyle = '#ff9f43'; c.fillRect(Math.round(b.x) - 2, Math.round(b.y) - 1, 4, 2); }
        else { c.fillStyle = '#ffe66d'; c.fillRect(Math.round(b.x) - 1, Math.round(b.y), 2, 1); }
      }
      for (const n of this.nades) {
        const x = Math.round(n.x), y = Math.round(n.y);
        if (n.impact) { c.fillStyle = f % 6 < 3 ? '#fff' : '#c0392b'; c.fillRect(x, y, 6, 6); c.fillStyle = '#f1c40f'; c.fillRect(x, y + 2, 6, 2); }
        else { c.fillStyle = n.fuse < 40 && f % 6 < 3 ? '#fff' : '#3f7d3f'; c.fillRect(x, y, 4, 4); c.fillStyle = '#ccc'; c.fillRect(x + 1, y - 1, 2, 1); }
      }
      for (const q of this.parts) { c.fillStyle = q.col; c.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); }
      for (const e of this.booms) {
        const r = Math.round(e.r * (1 - e.life / 14));
        c.fillStyle = e.life > 8 ? '#fff' : e.life > 4 ? '#ffd23f' : '#ff7b29';
        for (let dy = -r; dy <= r; dy += 2) { const dx = Math.round(Math.sqrt(r * r - dy * dy)); c.fillRect(Math.round(e.x) - dx, Math.round(e.y) + dy, dx * 2, 2); }
      }
      c.restore();
      // HUD
      const all = [...this.players.values()];
      c.font = 'bold 7px monospace'; c.textAlign = 'left';
      all.forEach((p, i) => {
        const x = 3 + i * 47;
        c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(x, 2, 45, 15);
        c.fillStyle = p.color; c.fillRect(x + 1, 3, 2, 13); c.fillText(p.name.slice(0, 6), x + 5, 9);
        c.fillStyle = '#fff'; c.textAlign = 'right'; c.fillText(String(p.score), x + 43, 9); c.textAlign = 'left';
        c.fillStyle = '#40222a'; c.fillRect(x + 5, 11, 38, 3);
        c.fillStyle = p.hp > 35 ? '#5fe36a' : '#ff4d4d'; c.fillRect(x + 5, 11, Math.round(38 * p.hp / 100), 3);
        if (p.weapon !== 'fist') { c.fillStyle = '#ffe66d'; c.fillRect(x + 5, 15, Math.min(38, Math.ceil(38 * p.ammo / WEAPONS[p.weapon].ammo)), 1); }
      });
      const banner = (t, col, sub) => {
        c.textAlign = 'center'; c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 88, W, sub ? 36 : 24);
        c.font = 'bold 14px monospace'; c.fillStyle = col; c.fillText(t, W / 2, 105);
        if (sub) { c.font = 'bold 7px monospace'; c.fillStyle = '#fff'; c.fillText(sub, W / 2, 117); }
      };
      if (!all.length) banner('PIXEL TRETA', '#ffd23f', 'ENTRE PELO CELULAR PARA JOGAR');
      else if (this.champion) banner(this.champion.name + ' E O CAMPEAO!', this.champion.color, 'NOVA PARTIDA EM INSTANTES');
      else if (this.roundOver > 0) banner(this.winner ? this.winner.name + ' VENCEU!' : 'EMPATE!', this.winner ? this.winner.color : '#fff');
      else {
        c.textAlign = 'center'; c.font = 'bold 7px monospace';
        if (all.length === 1) { c.fillStyle = '#fff'; c.fillText('TREINO - ESPERANDO MAIS JOGADORES', W / 2, 28); }
        else if (this.rt > SUDDEN && f % 30 < 20) { c.fillStyle = '#ff4d4d'; c.fillText('MORTE SUBITA!', W / 2, 28); }
        if (this.intro > 0) { c.fillStyle = '#ffd23f'; c.font = 'bold 10px monospace'; c.fillText('FASE: ' + this.map.name, W / 2, 44); }
      }
    }
  }

  root.PixelTreta = { Game, W, H, COLORS, WEAPONS, BTN: { L, R, U, D, A, C }, MAPS };
})(typeof window !== 'undefined' ? window : module.exports);
