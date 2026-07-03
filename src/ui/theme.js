// UI 공통 테마 — 아트 바이블 §2 팔레트 + §4 "양피지·봉랍" 재질.
// 이미지 에셋 없이 Phaser Graphics 로 양피지·가죽·코르크판 질감을 코드 렌더링한다.
// 모든 UI 모듈(대사창·저널·추리보드·HUD·토스트)이 이 팔레트/헬퍼를 공유해
// "UI만 다른 게임처럼 보이는" 것을 방지한다.

export const PAL = {
  // 코어 팔레트 (§2-A)
  dustLavender: 0xc9c2d6,
  mutedSage:    0xa8b79b,
  ashCream:     0xd9d2c4,
  mistBlue:     0x8a93a6,
  fadedGold:    0xe8c98f,
  // 보조색 (§2-B)
  shadowPlum:   0x5b5566,
  highlight:    0xf2eee6,
  deadBark:     0x6b5140,
  deepGrey:     0x3a3a44,
  // UI 특화 (§4)
  threadRed:    0xa85a4a,   // 저채도 벽돌빛 실 (원색 빨강 금지)
  parchment:    0xe3dcc9,   // 양피지 종이(잿빛 크림보다 살짝 따뜻)
  parchmentDim: 0xcabfa6,   // 양피지 얼룩·음영
  leather:      0x5a4436,   // 가죽 저널 표지(마른 나무 어둡게)
  cork:         0xb59d6a,   // 코르크판
  corkDim:      0x9c8354,
};

export const CSS = {
  shadowPlum: '#5b5566',
  fadedGold:  '#e8c98f',
  parchment:  '#e3dcc9',
  highlight:  '#f2eee6',
  deadBark:   '#6b5140',
  ink:        '#463f38',   // 양피지 위 잉크(그림자 자주보다 갈색조 — 가독성)
  threadRed:  '#a85a4a',
  mistBlue:   '#8a93a6',
};

// 고딕 문어체 서사 톤: 세리프/명조 계열, 가독성 우선(§4 폰트 지침).
export const FONT = '"Nanum Myeongjo", "Apple SD Gothic Neo", Georgia, "Times New Roman", serif';

// 결정적 의사난수(얼룩 위치가 매 프레임 튀지 않도록 고정 시드).
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ── 양피지 패널: 크림 바탕 + 얼룩 + 가장자리 그을림 + 봉랍 인장 모티프 ──
export function paintParchment(g, w, h, opts = {}) {
  const r = opts.radius ?? 14;
  const seed = opts.seed ?? 7;
  g.clear();
  // 바탕
  g.fillStyle(PAL.parchment, opts.alpha ?? 0.97);
  g.fillRoundedRect(0, 0, w, h, r);
  // 얼룩(저채도 딤톤, 낮은 알파)
  const rnd = seeded(seed);
  g.fillStyle(PAL.parchmentDim, 0.16);
  const stains = opts.stains ?? 7;
  for (let i = 0; i < stains; i++) {
    const sx = 14 + rnd() * (w - 28);
    const sy = 12 + rnd() * (h - 24);
    const rr = 6 + rnd() * 22;
    g.fillEllipse(sx, sy, rr * 2, rr * 1.4);
  }
  // 가장자리 그을림(모서리에 어두운 저알파 원)
  g.fillStyle(PAL.deadBark, 0.10);
  for (const [cx, cy] of [[0, 0], [w, 0], [0, h], [w, h]]) {
    g.fillCircle(cx, cy, 26);
  }
  // 테두리 이중선(그림자 자주 + 빛바랜 금 실선)
  g.lineStyle(3, PAL.shadowPlum, 0.85);
  g.strokeRoundedRect(1.5, 1.5, w - 3, h - 3, r);
  g.lineStyle(1, PAL.fadedGold, 0.5);
  g.strokeRoundedRect(4.5, 4.5, w - 9, h - 9, Math.max(4, r - 4));
}

// ── 가죽 저널 패널: 마른 나무 표지 + 크림 속지 ──
export function paintLeather(g, w, h) {
  g.clear();
  g.fillStyle(PAL.leather, 0.98);
  g.fillRoundedRect(0, 0, w, h, 10);
  // 표지 손때(어두운 얼룩)
  const rnd = seeded(31);
  g.fillStyle(0x000000, 0.08);
  for (let i = 0; i < 10; i++) {
    g.fillEllipse(rnd() * w, rnd() * h, 20 + rnd() * 40, 14 + rnd() * 20);
  }
  // 금박 테두리
  g.lineStyle(2, PAL.fadedGold, 0.55);
  g.strokeRoundedRect(6, 6, w - 12, h - 12, 6);
  g.lineStyle(3, PAL.deepGrey, 0.6);
  g.strokeRoundedRect(1.5, 1.5, w - 3, h - 3, 10);
}

// 속지(크림 종이) 사각형.
export function paintPage(g, x, y, w, h) {
  g.fillStyle(PAL.parchment, 0.96);
  g.fillRoundedRect(x, y, w, h, 6);
  g.lineStyle(1, PAL.deadBark, 0.35);
  g.strokeRoundedRect(x, y, w, h, 6);
}

// ── 코르크판: 결이 있는 갈색 코르크 ──
export function paintCork(g, w, h) {
  g.clear();
  g.fillStyle(PAL.cork, 1);
  g.fillRect(0, 0, w, h);
  const rnd = seeded(101);
  // 코르크 알갱이(딤톤 점묘)
  g.fillStyle(PAL.corkDim, 0.5);
  for (let i = 0; i < 420; i++) {
    g.fillCircle(rnd() * w, rnd() * h, 1 + rnd() * 2);
  }
  g.fillStyle(0x000000, 0.06);
  for (let i = 0; i < 60; i++) {
    g.fillEllipse(rnd() * w, rnd() * h, 8 + rnd() * 30, 6 + rnd() * 18);
  }
  // 나무 프레임
  g.lineStyle(14, PAL.deadBark, 1);
  g.strokeRect(7, 7, w - 14, h - 14);
  g.lineStyle(2, PAL.fadedGold, 0.4);
  g.strokeRect(15, 15, w - 30, h - 30);
}

// ── 봉랍 인장 스타일 버튼 ──
// scene 에 컨테이너를 만들어 반환. { setEnabled, setLabel, container } 인터페이스.
export function makeButton(scene, x, y, w, h, label, onClick, opts = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const txt = scene.add.text(0, 0, label, {
    fontFamily: FONT, fontSize: opts.fontSize || '17px', color: CSS.parchment,
    align: 'center', wordWrap: { width: w - 20 },
  }).setOrigin(0.5);
  c.add([g, txt]);

  let enabled = true;
  let hover = false;

  const redraw = () => {
    g.clear();
    const base = enabled ? PAL.deadBark : PAL.mistBlue;
    const alpha = enabled ? (hover ? 1 : 0.92) : 0.5;
    g.fillStyle(base, alpha);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    g.lineStyle(2, enabled ? PAL.fadedGold : PAL.shadowPlum, enabled ? (hover ? 0.95 : 0.6) : 0.4);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    txt.setColor(enabled ? (hover ? CSS.highlight : CSS.parchment) : '#9a94a2');
  };
  redraw();

  c.setSize(w, h);
  c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  c.on('pointerover', () => { hover = true; redraw(); });
  c.on('pointerout', () => { hover = false; redraw(); });
  c.on('pointerdown', () => { if (enabled) onClick(); });

  return {
    container: c,
    setEnabled(v) { enabled = v; redraw(); },
    setLabel(t) { txt.setText(t); },
    setVisible(v) { c.setVisible(v); },
    destroy() { c.destroy(); },
  };
}

// 완성형 글자 단위 분해(한글 자소가 아닌 완성 글자, 이모지 서로게이트 안전).
export function toChars(str) {
  return Array.from(str || '');
}
