'use strict';
/* ================================================================
 * ART 모듈 — 순수 렌더링 (게임 상태 소유 금지, DOM 접근 금지)
 * 계약: docs/ART_CONTRACT.md
 * - 생성 이미지 에셋(assets/)을 로드하고, 로드 전에는 프로시저럴 폴백으로 그린다.
 * - 루프 내 그라디언트/shadowBlur 금지: 전부 오프스크린 사전 렌더.
 * ================================================================ */
window.ART = (function () {

  /* ==================== 에셋 로더 ==================== */
  const BASE = 'assets/';
  const FILES = {
    player: 'player.png',
    auror: 'enemy-auror.png', order: 'enemy-order.png', guardian: 'enemy-guardian.png',
    broom: 'enemy-broom.png', shielder: 'enemy-shielder.png', splitter: 'enemy-splitter.png', sniper: 'enemy-sniper.png',
    moody: 'boss-moody.png', tonks: 'boss-tonks.png', sirius: 'boss-sirius.png',
    mcgonagall: 'boss-mcgonagall.png', snape: 'boss-snape.png', harry: 'boss-harry.png', dumbledore: 'boss-dumbledore.png',
    title: 'title.jpg',
    story0: 'story-0.jpg', story1: 'story-1.jpg', story2: 'story-2.jpg', story3: 'story-3.jpg',
    story4: 'story-4.jpg', story5: 'story-5.jpg', story6: 'story-6.jpg',
  };
  const IMG = {}, TINT = {}, OK = {};
  let loadDone = 0, loadTotal = 0;

  function makeTint(img) {
    // 피격 점멸용 흰 실루엣 (알파 유지)
    const c = document.createElement('canvas');
    const s = Math.min(256, img.naturalWidth || 256);
    c.width = c.height = s;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, s, s);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, s, s);
    return c;
  }

  function load() {
    const keys = Object.keys(FILES);
    loadTotal = keys.length;
    for (const k of keys) {
      const im = new Image();
      im.onload = () => {
        OK[k] = true; loadDone++;
        if (!/\.jpg$/.test(FILES[k])) { try { TINT[k] = makeTint(im); } catch (e) { /* tainted 등 — 점멸 생략 */ } }
      };
      im.onerror = () => { loadDone++; };
      im.src = BASE + FILES[k];
      IMG[k] = im;
    }
  }
  function progress() { return loadTotal ? loadDone / loadTotal : 1; }

  /* ==================== 공용 프리렌더 ==================== */
  function glowSprite(size, stops) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [o, col] of stops) gr.addColorStop(o, col);
    g.fillStyle = gr;
    g.fillRect(0, 0, size, size);
    return c;
  }
  const guardGlow = glowSprite(64, [[0, 'rgba(220,245,255,0.9)'], [0.5, 'rgba(140,200,230,0.35)'], [1, 'rgba(120,190,220,0)']]);
  const auraGlow = glowSprite(64, [[0, 'rgba(200,110,255,0.28)'], [1, 'rgba(200,110,255,0)']]);
  const redGlow = glowSprite(64, [[0, 'rgba(255,90,90,0.4)'], [1, 'rgba(255,60,60,0)']]);
  const fireGlow = glowSprite(64, [[0, 'rgba(255,170,80,0.45)'], [1, 'rgba(255,120,40,0)']]);
  const wandGlow = glowSprite(48, [[0, 'rgba(150,255,140,0.95)'], [1, 'rgba(60,220,80,0)']]);
  const fogBlob = glowSprite(160, [[0, 'rgba(255,255,255,0.16)'], [0.6, 'rgba(255,255,255,0.07)'], [1, 'rgba(255,255,255,0)']]);
  const eyeCache = {};
  function eyeSprite(color) {
    let c = eyeCache[color];
    if (!c) {
      c = eyeCache[color] = document.createElement('canvas');
      c.width = c.height = 20;
      const g = c.getContext('2d');
      g.fillStyle = color; g.shadowColor = color; g.shadowBlur = 5;
      g.beginPath(); g.arc(10, 10, 2.3, 0, 6.283); g.fill();
    }
    return c;
  }
  function h1(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }

  /* ==================== 스테이지 팔레트 / 배경 ==================== */
  // 0 리들 저택 / 1 곤트 숲 / 2 바다 동굴 / 3 그린고츠 / 4 회랑 / 5 뱀 소굴 / 6 대전
  const PAL = [
    { top: '#171126', mid: '#1c1533', bot: '#120e20', far: '#0c0918', moon: '#c9b7e6', mote: '#8a6fd0', fog: 'rgba(90,70,140,0.5)' },
    { top: '#0c1810', mid: '#10230e', bot: '#091206', far: '#071005', moon: '#b9d6a8', mote: '#6fce7a', fog: 'rgba(50,110,60,0.5)' },
    { top: '#06181d', mid: '#0a2530', bot: '#04141a', far: '#031017', moon: '#9adfe0', mote: '#4fd6c8', fog: 'rgba(40,130,140,0.45)' },
    { top: '#1c1408', mid: '#26190b', bot: '#150e06', far: '#100a05', moon: '#ffd98a', mote: '#e6b95a', fog: 'rgba(170,130,50,0.4)' },
    { top: '#0e1026', mid: '#151336', bot: '#0a0b1e', far: '#090a1c', moon: '#cfd3ff', mote: '#8f9bff', fog: 'rgba(100,100,190,0.45)' },
    { top: '#0c1a0e', mid: '#123016', bot: '#08140a', far: '#071106', moon: '#b6e8a0', mote: '#7CFF6B', fog: 'rgba(70,160,60,0.5)' },
    { top: '#200a0e', mid: '#301013', bot: '#150608', far: '#170608', moon: '#ff9a7a', mote: '#ff7a4a', fog: 'rgba(200,80,40,0.4)' },
  ];

  let W = 0, H = 0;
  const BG = { stage: -1, sky: null, stars: null, farTile: null, farH: 0, props: [], beam: null };

  function resize(w, h) {
    W = w; H = h;
    BG.stage = -1; // 전체 캐시 재생성
  }

  /* ---- 중경 소품 페인터 (오프스크린 소형 스프라이트) ---- */
  function propCanvas(w, h, fn) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    fn(g, w, h);
    return c;
  }
  const P = {
    tomb: (a) => propCanvas(44, 56, (g) => {
      g.fillStyle = a; g.beginPath();
      g.moveTo(6, 56); g.lineTo(6, 18); g.quadraticCurveTo(22, -4, 38, 18); g.lineTo(38, 56); g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(12, 20, 20, 3); g.fillRect(15, 28, 14, 3);
    }),
    column: (a) => propCanvas(30, 84, (g) => {
      g.fillStyle = a; g.fillRect(8, 8, 14, 70); g.fillRect(3, 0, 24, 9); g.fillRect(3, 76, 24, 8);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(12, 10, 3, 64);
    }),
    tree: (a) => propCanvas(64, 96, (g) => {
      g.strokeStyle = a; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.moveTo(32, 96); g.quadraticCurveTo(26, 56, 34, 34); g.stroke();
      g.lineWidth = 4;
      g.beginPath(); g.moveTo(33, 48); g.quadraticCurveTo(14, 36, 8, 18); g.stroke();
      g.beginPath(); g.moveTo(34, 38); g.quadraticCurveTo(50, 28, 58, 10); g.stroke();
      g.lineWidth = 2.5;
      g.beginPath(); g.moveTo(12, 24); g.lineTo(4, 12); g.stroke();
      g.beginPath(); g.moveTo(54, 16); g.lineTo(62, 4); g.stroke();
    }),
    stalag: (a) => propCanvas(48, 70, (g) => {
      g.fillStyle = a;
      g.beginPath(); g.moveTo(4, 70); g.lineTo(14, 8); g.lineTo(22, 70); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(22, 70); g.lineTo(34, 0); g.lineTo(46, 70); g.closePath(); g.fill();
    }),
    coins: (a, glint) => propCanvas(56, 34, (g) => {
      g.fillStyle = a;
      g.beginPath(); g.ellipse(28, 26, 26, 8, 0, 0, 6.283); g.fill();
      g.beginPath(); g.ellipse(18, 18, 14, 6, 0, 0, 6.283); g.fill();
      g.beginPath(); g.ellipse(36, 14, 10, 5, 0, 0, 6.283); g.fill();
      g.fillStyle = glint;
      g.fillRect(14, 15, 3, 2); g.fillRect(33, 11, 3, 2); g.fillRect(24, 23, 3, 2);
    }),
    arch: (a) => propCanvas(58, 92, (g) => {
      g.fillStyle = a;
      g.fillRect(4, 20, 12, 72); g.fillRect(42, 20, 12, 72);
      g.beginPath(); g.moveTo(4, 26); g.quadraticCurveTo(29, -10, 54, 26); g.lineTo(42, 30); g.quadraticCurveTo(29, 6, 16, 30); g.closePath(); g.fill();
    }),
    candle: (a, flame) => propCanvas(22, 46, (g) => {
      g.fillStyle = a; g.fillRect(8, 14, 6, 28); g.fillRect(4, 40, 14, 5);
      g.fillStyle = flame; g.beginPath(); g.ellipse(11, 8, 3.4, 6, 0, 0, 6.283); g.fill();
    }),
    snakeRelief: (a) => propCanvas(60, 60, (g) => {
      g.strokeStyle = a; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(10, 52); g.bezierCurveTo(50, 44, 8, 28, 42, 18); g.quadraticCurveTo(54, 14, 50, 8);
      g.stroke();
      g.fillStyle = a; g.beginPath(); g.arc(50, 8, 4.5, 0, 6.283); g.fill();
    }),
    rubble: (a) => propCanvas(60, 36, (g) => {
      g.fillStyle = a;
      g.beginPath(); g.moveTo(0, 36); g.lineTo(10, 16); g.lineTo(24, 30); g.lineTo(34, 10); g.lineTo(48, 26); g.lineTo(60, 18); g.lineTo(60, 36); g.closePath(); g.fill();
    }),
    bush: (a) => propCanvas(40, 30, (g) => {
      g.strokeStyle = a; g.lineWidth = 2.5; g.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        g.beginPath(); g.moveTo(20, 30);
        g.quadraticCurveTo(20 + (i - 3) * 5, 16, 20 + (i - 3) * 6.5, 4 + (i % 2) * 6);
        g.stroke();
      }
    }),
  };

  function stageProps(s) {
    switch (s) {
      case 0: return [P.tomb('#221a38'), P.column('#241c3a'), P.bush('#1d1630')];
      case 1: return [P.tree('#152a12'), P.tree('#112408'), P.bush('#173012')];
      case 2: return [P.stalag('#0e3340'), P.stalag('#0a2833'), P.coins('#10404d', '#3fd6c8')];
      case 3: return [P.column('#3a2a12'), P.coins('#4a3510', '#ffd98a'), P.coins('#403010', '#e6b95a')];
      case 4: return [P.arch('#1c1a40'), P.candle('#242250', '#ffd98a'), P.column('#201e48')];
      case 5: return [P.snakeRelief('#1c4020'), P.tree('#12300f'), P.bush('#1a3a16')];
      case 6: return [P.rubble('#3a1418'), P.column('#38161a'), P.rubble('#301014')];
      default: return [P.tomb('#221a38')];
    }
  }

  /* ---- 원경 실루엣 타일 (세로 이음새 없는 랩 드로잉) ---- */
  function buildFarTile(stage) {
    const th = Math.max(480, Math.round(H * 0.9));
    const c = document.createElement('canvas');
    c.width = W; c.height = th;
    const g = c.getContext('2d');
    const col = PAL[stage].far;
    g.fillStyle = col;
    const wrap = (fn) => { fn(0); fn(-th); fn(th); }; // 랩 드로잉으로 이음새 제거
    // 좌우 벽면 실루엣 (스테이지별 들쭉날쭉 정도만 다르게)
    const jag = [18, 30, 24, 14, 16, 26, 20][stage];
    for (const side of [0, 1]) {
      wrap((oy) => {
        g.beginPath();
        const bx = side ? W : 0, dir = side ? -1 : 1;
        g.moveTo(bx, oy);
        for (let y = 0; y <= th; y += 40) {
          const wdt = (10 + h1(stage * 91 + side * 37 + Math.round((y) / 40)) * jag);
          g.lineTo(bx + dir * wdt, oy + y);
        }
        g.lineTo(bx, oy + th);
        g.closePath(); g.fill();
      });
    }
    // 산발적 큰 실루엣 덩어리 (창/기둥/종유석 느낌의 사각·삼각)
    g.globalAlpha = 0.55;
    for (let i = 0; i < 7; i++) {
      const x = h1(stage * 51 + i * 7) * (W - 60) + 30;
      const y0 = h1(stage * 13 + i * 3) * th;
      const wdt = 14 + h1(i * 29) * 26, hgt = 30 + h1(i * 17) * 60;
      wrap((oy) => {
        if (stage === 2 || stage === 1) { // 삼각(종유석/나무)
          g.beginPath(); g.moveTo(x - wdt / 2, y0 + oy + hgt); g.lineTo(x, y0 + oy); g.lineTo(x + wdt / 2, y0 + oy + hgt); g.closePath(); g.fill();
        } else {
          g.fillRect(x - wdt / 2, y0 + oy, wdt, hgt);
        }
      });
    }
    g.globalAlpha = 1;
    BG.farTile = c; BG.farH = th;
  }

  /* ---- 별/입자 타일 ---- */
  function buildStars(stage) {
    const th = 512;
    const c = document.createElement('canvas');
    c.width = W; c.height = th;
    const g = c.getContext('2d');
    for (let i = 0; i < 46; i++) {
      const x = h1(i * 3 + 1) * W, y = h1(i * 7 + 2) * th, r = 0.5 + h1(i * 11) * 1.3;
      g.globalAlpha = 0.25 + h1(i * 5) * 0.5;
      g.fillStyle = i % 4 === 0 ? PAL[stage].mote : '#cfc8e2';
      for (const oy of [0, -th, th]) { g.beginPath(); g.arc(x, y + oy, r, 0, 6.283); g.fill(); }
    }
    g.globalAlpha = 1;
    BG.stars = c;
  }

  function buildSky(stage) {
    const c = document.createElement('canvas');
    c.width = Math.max(2, W); c.height = Math.max(2, H);
    const g = c.getContext('2d');
    const p = PAL[stage];
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, p.top); gr.addColorStop(0.5, p.mid); gr.addColorStop(1, p.bot);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // 병든 달 (사전 렌더)
    const mx = W * 0.78, my = H * 0.12;
    const mg = g.createRadialGradient(mx, my, 4, mx, my, 95);
    mg.addColorStop(0, p.moon + 'cc'); mg.addColorStop(0.3, p.moon + '2a'); mg.addColorStop(1, p.moon + '00');
    g.fillStyle = mg; g.beginPath(); g.arc(mx, my, 95, 0, 6.283); g.fill();
    g.fillStyle = p.moon; g.beginPath(); g.arc(mx, my, 24, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath(); g.arc(mx - 7, my - 5, 5, 0, 6.283); g.arc(mx + 8, my + 7, 3.4, 0, 6.283); g.fill();
    BG.sky = c;
  }

  function ensureStage(stage) {
    if (BG.stage === stage && BG.sky) return;
    BG.stage = stage;
    buildSky(stage);
    buildStars(stage);
    buildFarTile(stage);
    BG.props = stageProps(stage);
  }

  /* ---- 배경: 4단 페럴랙스 종스크롤 ---- */
  function drawBackground(ctx, o) {
    const { stage, scrollY, time } = o;
    if (o.W !== W || o.H !== H) resize(o.W, o.H);
    ensureStage(stage);
    const p = PAL[stage];

    // L0 하늘 (고정)
    ctx.drawImage(BG.sky, 0, 0);

    // L1 별/입자 (0.1x)
    let off = (scrollY * 0.1) % 512;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(BG.stars, 0, off - 512);
    ctx.drawImage(BG.stars, 0, off);
    if (off + 512 < H) ctx.drawImage(BG.stars, 0, off + 512);

    // L2 원경 실루엣 (0.25x)
    const fh = BG.farH;
    off = (scrollY * 0.25) % fh;
    ctx.globalAlpha = 0.85;
    ctx.drawImage(BG.farTile, 0, off - fh);
    ctx.drawImage(BG.farTile, 0, off);
    if (off + fh < H) ctx.drawImage(BG.farTile, 0, off + fh);
    ctx.globalAlpha = 1;

    // L3 중경 소품 (0.6x) — 스크롤 위치에서 결정론적으로 유도 (상태 없음)
    const SPACING = 170, span = H + 260;
    const base = Math.floor((scrollY * 0.6 - 200) / SPACING);
    for (let k = base; k < base + Math.ceil(span / SPACING) + 2; k++) {
      const spr = BG.props[Math.floor(h1(k * 3.7) * BG.props.length)];
      const sy = k * SPACING - scrollY * 0.6 + 130;
      const yy = -sy + H; // 아래로 흐르게 방향 반전
      const py = ((yy % span) + span) % span - 130;
      const side = h1(k * 1.3) < 0.5;
      const px = side ? 10 + h1(k * 2.1) * (W * 0.24) : W - 10 - h1(k * 2.1) * (W * 0.24) - spr.width;
      const sc = 0.7 + h1(k * 5.3) * 0.65;
      ctx.globalAlpha = 0.6;
      ctx.drawImage(spr, px, py, spr.width * sc, spr.height * sc);
    }
    ctx.globalAlpha = 1;

    // L4 근경 안개 (1.2x) + 부유 입자
    for (let i = 0; i < 4; i++) {
      const fy = ((i * 260 + scrollY * 1.2) % (H + 320)) - 160;
      const fx = (h1(i * 9.1) * 0.8 + 0.1) * W + Math.sin(time * 0.3 + i * 2.1) * 30;
      ctx.globalAlpha = 0.5;
      ctx.drawImage(fogBlob, fx - 130, fy - 80, 260, 160);
    }
    for (let i = 0; i < 18; i++) {
      const py = ((h1(i * 4.7) * (H + 40) + scrollY * (0.35 + h1(i * 2.3) * 0.3)) % (H + 40)) - 20;
      const px = h1(i * 8.9) * W + Math.sin(time * 0.8 + i * 1.7) * 14;
      ctx.globalAlpha = 0.25 + 0.25 * Math.sin(time * 2 + i * 2.4);
      ctx.fillStyle = p.mote;
      ctx.beginPath(); ctx.arc(px, py, 0.8 + h1(i) * 1.6, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // 바닥 안개 띠 (사전 렌더 블롭 확대)
    ctx.globalAlpha = 0.45;
    ctx.drawImage(fogBlob, -W * 0.2, H - 90, W * 0.8, 130);
    ctx.drawImage(fogBlob, W * 0.4, H - 70, W * 0.8, 120);
    ctx.globalAlpha = 1;
  }

  /* ==================== 캐릭터 공통 ==================== */
  function drawSprite(ctx, key, x, y, size, opt) {
    // opt: { rot, alpha, flash, bobT }
    if (!OK[key]) return false;
    const im = IMG[key];
    ctx.save();
    ctx.translate(x, y);
    if (opt && opt.rot) ctx.rotate(opt.rot);
    if (opt && opt.alpha != null) ctx.globalAlpha = opt.alpha;
    ctx.drawImage(im, -size / 2, -size / 2, size, size);
    if (opt && opt.flash > 0 && TINT[key]) {
      ctx.globalAlpha = Math.min(0.85, opt.flash * 8);
      ctx.drawImage(TINT[key], -size / 2, -size / 2, size, size);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    return true;
  }

  /* 폴백: 망토 인영 (이미지 로드 전) */
  function drawCloaked(ctx, x, y, s, cloak, face, eye, hoodUp) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = cloak;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.bezierCurveTo(11, -15, 15, -4, 17, 14);
    ctx.lineTo(11, 10); ctx.lineTo(8, 17); ctx.lineTo(3, 11); ctx.lineTo(-2, 18); ctx.lineTo(-7, 11); ctx.lineTo(-12, 16); ctx.lineTo(-17, 14);
    ctx.bezierCurveTo(-15, -4, -11, -15, 0, -18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = face;
    ctx.beginPath(); ctx.arc(0, -13, 6.2, 0, 6.283); ctx.fill();
    if (hoodUp) {
      ctx.fillStyle = cloak;
      ctx.beginPath(); ctx.arc(0, -14.5, 7.6, Math.PI * 0.92, Math.PI * 2.08); ctx.lineTo(0, -9); ctx.closePath(); ctx.fill();
    }
    const es = eyeSprite(eye);
    ctx.drawImage(es, -2.2 - 5, -13 - 5, 10, 10);
    ctx.drawImage(es, 2.2 - 5, -13 - 5, 10, 10);
    ctx.restore();
  }

  /* ==================== 플레이어 ==================== */
  function drawPlayer(ctx, player, time) {
    if (player.dead) return;
    const bob = Math.sin(time * 2.2) * 3;
    const x = player.x, y = player.y + bob;
    if (player.shieldT > 0) {
      const a = Math.min(1, player.shieldT);
      ctx.globalAlpha = 0.26 * a + 0.08 * Math.sin(time * 6);
      ctx.fillStyle = '#4fd66a';
      ctx.beginPath(); ctx.arc(x, y - 6, 40, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 0.85 * a;
      ctx.strokeStyle = '#8effb0'; ctx.lineWidth = 2;
      // 육각 결계
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a2 = time * 0.8 + (i / 6) * 6.283;
        const px = x + Math.cos(a2) * 40, py = y - 6 + Math.sin(a2) * 40;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const flash = player.hitFlash > 0 && Math.floor(player.hitFlash * 20) % 2 === 0;
    const useSprite = drawSprite(ctx, 'player', x, y - 4, player.r * 4.4, { flash: flash ? 0.1 : 0, alpha: flash ? 0.75 : 1 });
    if (!useSprite) {
      if (flash) ctx.globalAlpha = 0.45;
      drawCloaked(ctx, x, y, 1.5, '#181028', '#d9dfd2', '#ff3b46', true);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#5a4632'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 10, y - 4); ctx.lineTo(x + 20, y - 20); ctx.stroke();
    }
    // 지팡이 초록 마력광 (스프라이트는 지팡이가 왼쪽 위로 들려 있음 — 위치를 맞춘다)
    const wg = 4 + (player.wandT > 0 ? 6 : 1.5 * Math.sin(time * 5) + 1.5);
    const wr = wg * 2.2;
    const wx = useSprite ? x - player.r * 0.82 : x + player.r * 1.0;
    const wy = useSprite ? y - player.r * 1.85 : y - player.r * 1.05;
    ctx.drawImage(wandGlow, wx - wr, wy - wr, wr * 2, wr * 2);
  }

  /* ==================== 적 ==================== */
  const EFALL = {
    auror: { cloak: '#8a4a2a', eye: '#ffd28a', hood: false },
    order: { cloak: '#33518f', eye: '#a8ccff', hood: true },
    broom: { cloak: '#5a4470', eye: '#e8c8ff', hood: true },
    shielder: { cloak: '#6a7080', eye: '#9adfff', hood: true },
    splitter: { cloak: '#5c2a80', eye: '#e0a8ff', hood: false },
    sniper: { cloak: '#705c20', eye: '#ffe88a', hood: true },
  };

  function drawEnemy(ctx, e, time) {
    const t = e.t || 0;
    let rot = 0;
    if (e.type === 'broom') rot = (e.vx > 0 ? 1 : -1) * 0.35 + Math.sin(t * 5) * 0.08;
    const flash = e.hitT > 0;

    if (e.type === 'guardian') {
      const rr = e.r;
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(guardGlow, e.x - rr * 1.7, e.y - rr * 1.7, rr * 3.4, rr * 3.4);
      ctx.globalCompositeOperation = 'source-over';
      if (!drawSprite(ctx, 'guardian', e.x, e.y, rr * 3.6, { flash: flash ? 0.1 : 0, alpha: 0.92 })) {
        ctx.strokeStyle = 'rgba(230,250,255,0.85)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(e.x, e.y, rr * 0.72 + Math.sin(t * 3) * 2, 0, 6.283); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.x - 7, e.y - rr * 0.6); ctx.lineTo(e.x - 13, e.y - rr * 1.25); ctx.lineTo(e.x - 18, e.y - rr * 1.1);
        ctx.moveTo(e.x + 7, e.y - rr * 0.6); ctx.lineTo(e.x + 13, e.y - rr * 1.25); ctx.lineTo(e.x + 18, e.y - rr * 1.1);
        ctx.stroke();
      }
    } else if (e.type === 'chess') {
      // 맥고나걸 소환 체스말 — 프로시저럴 룩(성탑)
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.fillStyle = flash ? '#e8e8f4' : '#2e2b45';
      ctx.strokeStyle = '#8f88b8'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-13, 18); ctx.lineTo(-9, -2); ctx.lineTo(-11, -6); ctx.lineTo(-11, -16);
      ctx.lineTo(-6, -16); ctx.lineTo(-6, -11); ctx.lineTo(-2, -11); ctx.lineTo(-2, -16);
      ctx.lineTo(2, -16); ctx.lineTo(2, -11); ctx.lineTo(6, -11); ctx.lineTo(6, -16);
      ctx.lineTo(11, -16); ctx.lineTo(11, -6); ctx.lineTo(9, -2); ctx.lineTo(13, 18);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    } else {
      const size = e.r * 3.6;
      if (!drawSprite(ctx, e.type, e.x, e.y, size, { rot, flash: flash ? 0.1 : 0 })) {
        const f = EFALL[e.type] || EFALL.auror;
        ctx.save();
        if (rot) { ctx.translate(e.x, e.y); ctx.rotate(rot); ctx.translate(-e.x, -e.y); }
        drawCloaked(ctx, e.x, e.y, e.r / 12, f.cloak, '#cbb89a', f.eye, f.hood);
        if (e.type === 'broom') {
          ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(e.x - e.r * 1.4, e.y + 8); ctx.lineTo(e.x + e.r * 1.2, e.y + 4); ctx.stroke();
        }
        if (e.type === 'sniper') {
          ctx.strokeStyle = '#c8b060'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(e.x + 4, e.y - 2); ctx.lineTo(e.x + e.r * 1.6, e.y + e.r * 0.8); ctx.stroke();
        }
        if (e.type === 'splitter') {
          ctx.globalAlpha = 0.4;
          drawCloaked(ctx, e.x - 6, e.y, e.r / 13, f.cloak, '#cbb89a', f.eye, false);
          drawCloaked(ctx, e.x + 6, e.y, e.r / 13, f.cloak, '#cbb89a', f.eye, false);
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      }
      if (flash) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(e.x, e.y - 4, e.r * 0.75, 0, 6.283); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // 결계술사 본인의 방출 링 + 보호받는 적의 육각 실드
    if (e.type === 'shielder') {
      ctx.globalAlpha = 0.5 + 0.2 * Math.sin(time * 3);
      ctx.strokeStyle = '#7fd9ff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.shieldR || 120, 0, 6.283); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (e.shielded) {
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = '#8fe0ff'; ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a2 = time * 1.2 + (i / 6) * 6.283;
        const px = e.x + Math.cos(a2) * (e.r + 8), py = e.y + Math.sin(a2) * (e.r + 8);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // 기절 표시
    if (e.stunT > 0) {
      ctx.fillStyle = '#ffe88a';
      for (let i = 0; i < 3; i++) {
        const a2 = time * 5 + i * 2.09;
        ctx.beginPath(); ctx.arc(e.x + Math.cos(a2) * (e.r + 6), e.y - e.r - 8 + Math.sin(a2) * 4, 1.8, 0, 6.283); ctx.fill();
      }
    }
    // 체력바
    if (e.hp < e.maxhp) {
      const w = e.r * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w, 3.5);
      ctx.fillStyle = '#e0524f';
      ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w * Math.max(0, e.hp / e.maxhp), 3.5);
    }
  }

  /* ==================== 보스 ==================== */
  const BFALL = {
    moody: { cloak: '#b06a3a', eye: '#7fd4ff' }, tonks: { cloak: '#c94f8c', eye: '#ffd4f0' },
    sirius: { cloak: '#4a4a5e', eye: '#e8e8ff' }, mcgonagall: { cloak: '#2e6b52', eye: '#c8ffe8' },
    snape: { cloak: '#1d1d2c', eye: '#d8d8d8' }, harry: { cloak: '#7a1f1f', eye: '#9dff9d' },
    dumbledore: { cloak: '#3b3470', eye: '#ffe9a8' },
  };

  function drawDog(ctx, x, y, r, t) {
    // 시리우스 2페이즈/돌진: 검은 개
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#101018';
    ctx.beginPath(); ctx.ellipse(0, 2, r * 0.95, r * 0.55, 0, 0, 6.283); ctx.fill(); // 몸통
    ctx.beginPath(); ctx.arc(-r * 0.8, -r * 0.28, r * 0.4, 0, 6.283); ctx.fill(); // 머리
    ctx.beginPath(); // 귀
    ctx.moveTo(-r * 0.95, -r * 0.6); ctx.lineTo(-r * 0.82, -r * 0.95); ctx.lineTo(-r * 0.68, -r * 0.6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); // 꼬리
    ctx.moveTo(r * 0.85, 0); ctx.quadraticCurveTo(r * 1.35, -r * 0.3 + Math.sin(t * 9) * 4, r * 1.5, -r * 0.55); ctx.quadraticCurveTo(r * 1.25, -r * 0.15, r * 0.85, r * 0.15); ctx.closePath(); ctx.fill();
    const es = eyeSprite('#ffcf6a');
    ctx.drawImage(es, -r * 0.92 - 5, -r * 0.35 - 5, 10, 10);
    ctx.restore();
  }

  function drawBoss(ctx, boss, time) {
    const b = boss;
    const alpha = b.ghost ? 0.55 : (b.entering ? 0.9 : 1);
    // 오라 (2페이즈 색 변화)
    ctx.globalCompositeOperation = 'lighter';
    const aura = b.phase === 2 ? (b.key === 'dumbledore' ? fireGlow : redGlow) : auraGlow;
    ctx.drawImage(aura, b.x - b.r * 2.3, b.y - b.r * 2.3, b.r * 4.6, b.r * 4.6);
    ctx.globalCompositeOperation = 'source-over';

    // 시전 예고 링
    if (b.telegraph > 0) {
      const tg = Math.min(1, b.telegraph);
      ctx.globalAlpha = 0.35 + 0.45 * Math.sin(time * 14);
      ctx.strokeStyle = b.phase === 2 ? '#ff8a5a' : '#e07bff';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 12 + (1 - tg) * 26, 0, 6.283); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const flash = b.hitT > 0;
    if (b.dogMode) {
      drawDog(ctx, b.x, b.y, b.r * 1.1, time);
    } else if (!drawSprite(ctx, b.key, b.x, b.y, b.r * 3.3, { flash: flash ? 0.1 : 0, alpha })) {
      const f = BFALL[b.key] || BFALL.moody;
      ctx.globalAlpha = alpha;
      drawCloaked(ctx, b.x, b.y + 8, b.r / 11, f.cloak, '#d8c8ae', f.eye, true);
      ctx.globalAlpha = 1;
    }
    if (flash && (b.dogMode || !TINT[b.key])) {
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.9, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // 덤블도어 2페이즈: 불사조 날개 오라
    if (b.key === 'dumbledore' && b.phase === 2 && !b.entering) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,160,70,0.6)';
      ctx.lineWidth = 4; ctx.lineCap = 'round';
      const sp = Math.sin(time * 3.2) * 0.2;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(b.x + s * b.r * 0.5, b.y - b.r * 0.2);
        ctx.quadraticCurveTo(b.x + s * b.r * 1.9, b.y - b.r * (1.3 + sp), b.x + s * b.r * 2.5, b.y - b.r * 0.1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(b.x + s * b.r * 0.55, b.y);
        ctx.quadraticCurveTo(b.x + s * b.r * 1.6, b.y - b.r * (0.8 + sp), b.x + s * b.r * 2.0, b.y + b.r * 0.25);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  /* ==================== 타이틀 / 스토리 배경 ==================== */
  function coverDraw(ctx, im, alpha) {
    const iw = im.naturalWidth, ih = im.naturalHeight;
    const sc = Math.max(W / iw, H / ih);
    const dw = iw * sc, dh = ih * sc;
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.drawImage(im, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.globalAlpha = 1;
  }

  let vign = null, vignW = 0, vignH = 0;
  function vignette(ctx) {
    if (!vign || vignW !== W || vignH !== H) {
      vign = document.createElement('canvas');
      vign.width = Math.max(2, W); vign.height = Math.max(2, H);
      const g = vign.getContext('2d');
      const gr = g.createRadialGradient(W / 2, H * 0.42, H * 0.22, W / 2, H * 0.42, H * 0.75);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      vignW = W; vignH = H;
    }
    ctx.drawImage(vign, 0, 0);
  }

  function drawTitleBg(ctx, o) {
    if (o.W !== W || o.H !== H) resize(o.W, o.H);
    const time = o.time;
    if (OK.title) {
      coverDraw(ctx, IMG.title);
    } else {
      ensureStage(6);
      ctx.drawImage(BG.sky, 0, 0);
      // 폴백: 해골+뱀 문양 스트로크
      ctx.save();
      ctx.translate(W / 2, H * 0.34);
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = '#6fce7a'; ctx.fillStyle = '#0f2a14'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, 46, 0, 6.283); ctx.fill(); ctx.stroke(); // 두개골
      ctx.fillStyle = '#03140a';
      ctx.beginPath(); ctx.ellipse(-16, -6, 10, 13, 0, 0, 6.283); ctx.ellipse(16, -6, 10, 13, 0, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(-6, 20); ctx.lineTo(6, 20); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#7CFF6B'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 34);
      ctx.bezierCurveTo(40, 70, -40, 110, 20, 150);
      ctx.quadraticCurveTo(38, 165, 30, 180);
      ctx.stroke();
      ctx.restore();
    }
    // 부유 입자 + 안개
    for (let i = 0; i < 22; i++) {
      const py = ((h1(i * 4.7) * (H + 40) - time * (12 + h1(i * 2.3) * 20)) % (H + 40) + (H + 40)) % (H + 40) - 20;
      const px = h1(i * 8.9) * W + Math.sin(time * 0.7 + i * 1.7) * 16;
      ctx.globalAlpha = 0.3 + 0.3 * Math.sin(time * 2 + i * 2.4);
      ctx.fillStyle = i % 3 ? '#7CFF6B' : '#b39aff';
      ctx.beginPath(); ctx.arc(px, py, 0.8 + h1(i) * 1.8, 0, 6.283); ctx.fill();
    }
    ctx.globalAlpha = 0.5;
    ctx.drawImage(fogBlob, W * 0.05, H - 180 + Math.sin(time * 0.4) * 14, W * 0.9, 200);
    ctx.globalAlpha = 1;
    vignette(ctx);
  }

  function drawStoryBg(ctx, o) {
    if (o.W !== W || o.H !== H) resize(o.W, o.H);
    const key = 'story' + o.stage;
    if (OK[key]) {
      coverDraw(ctx, IMG[key]);
      // 미세 애니메이션: 부유 입자
      const p = PAL[o.stage];
      for (let i = 0; i < 14; i++) {
        const py = ((h1(i * 6.1) * (H + 30) - o.time * (10 + h1(i * 3.3) * 16)) % (H + 30) + (H + 30)) % (H + 30) - 15;
        const px = h1(i * 9.7) * W + Math.sin(o.time * 0.6 + i * 2.2) * 12;
        ctx.globalAlpha = 0.25 + 0.25 * Math.sin(o.time * 2 + i);
        ctx.fillStyle = p.mote;
        ctx.beginPath(); ctx.arc(px, py, 1 + h1(i) * 1.6, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      drawBackground(ctx, { stage: o.stage, scrollY: o.time * 14, time: o.time, W: o.W, H: o.H });
    }
    vignette(ctx);
  }

  /* ==================== 스킬 아이콘 (SVG) ==================== */
  const ICONS = {
    avada: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M27 4 L14 26 L22 26 L18 44 L34 20 L25 20 L31 4 Z" fill="#7CFF6B" stroke="#c6ffb8" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    fiendfyre: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M24 44 C13 40 9 30 13 22 C15 26 18 27 19 26 C15 17 20 8 28 4 C25 11 28 14 32 18 C36 22 40 28 36 36 C34 40 30 43 24 44 Z" fill="#ff8a3c" stroke="#ffd2a0" stroke-width="1.4" stroke-linejoin="round"/><path d="M24 40 C20 37 19 32 22 28 C23 31 26 31 25 27 C24 23 27 20 30 19 C28 23 32 25 33 29 C34 33 31 38 24 40 Z" fill="#ffe27a"/><circle cx="30" cy="14" r="1.8" fill="#ffe27a"/></svg>',
    shield: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M24 3 L41 12 L41 26 C41 36 33 43 24 45 C15 43 7 36 7 26 L7 12 Z" fill="#123f22" stroke="#8effb0" stroke-width="2.2" stroke-linejoin="round"/><path d="M24 12 L33 17 L33 26 C33 31 29 35 24 37 C19 35 15 31 15 26 L15 17 Z" fill="none" stroke="#5fdc84" stroke-width="1.6"/><circle cx="24" cy="24" r="4.2" fill="#8effb0"/></svg>',
    nagini: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M24 42 C12 42 7 34 9 27 C11 20 18 18 24 20 C29 22 33 20 33 16 C33 12 28 10 24 12" stroke="#5fdc84" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M24 42 C33 42 39 37 39 31" stroke="#5fdc84" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="23" cy="10.6" r="3.4" fill="#8effb0"/><circle cx="22" cy="9.8" r="1" fill="#0a1f10"/><path d="M20 8.4 L16 5.4" stroke="#ff5d6b" stroke-width="1.6" stroke-linecap="round"/></svg>',
    crucio: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><path d="M24 4 L20 16 L13 20 L19 24 L14 36 L23 28 L24 44 L26 28 L34 37 L29 23 L36 19 L28 16 Z" fill="#ff4d5e" stroke="#ffb0b8" stroke-width="1.4" stroke-linejoin="round"/><path d="M9 9 L14 14 M39 9 L34 14 M8 30 L12 27 M40 31 L36 28" stroke="#ff8a95" stroke-width="2" stroke-linecap="round"/></svg>',
    darkmark: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><circle cx="24" cy="15" r="9.5" fill="#d6ffca" stroke="#7CFF6B" stroke-width="1.4"/><ellipse cx="20.5" cy="13.5" rx="2.6" ry="3.4" fill="#0a1f10"/><ellipse cx="27.5" cy="13.5" rx="2.6" ry="3.4" fill="#0a1f10"/><path d="M24 18 L22 22 L26 22 Z" fill="#0a1f10"/><path d="M24 24 C31 28 17 32 24 36 C30 39 20 43 25 46" stroke="#7CFF6B" stroke-width="3.4" stroke-linecap="round" fill="none"/></svg>',
    lock: '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="none"><rect x="11" y="21" width="26" height="20" rx="4" fill="#3a3452" stroke="#8b82ad" stroke-width="1.6"/><path d="M16 21 V15 a8 8 0 0 1 16 0 V21" stroke="#8b82ad" stroke-width="3.4" fill="none"/><circle cx="24" cy="30" r="3" fill="#8b82ad"/><rect x="22.6" y="31" width="2.8" height="6" rx="1.2" fill="#8b82ad"/></svg>',
  };

  return {
    load, progress, resize,
    drawBackground, drawPlayer, drawEnemy, drawBoss, drawStoryBg, drawTitleBg,
    ICONS,
  };
})();
