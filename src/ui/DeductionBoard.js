// 추리 보드 — 코르크판 + 붉은 실 + 핀(§4). 단서 카드 배치, 카드 연결 시도(코어 판정 위임),
// 결론 객관식(코어 판정 위임), 힌트 토큰. 오답 페널티 없음 — 아늑한 사색형 톤 유지.
// 판정·상태는 전부 코어. UI 는 board:open 페이로드만으로 렌더링하고 attempt 를 보고한다.
import { bus, EV } from '../systems/eventBus.js';
import { PAL, CSS, FONT, paintParchment, paintCork, makeButton } from './theme.js';

const AREA = { x0: 70, y0: 72, x1: 730, y1: 438 };
const CARD = { w: 172, h: 98 };

export class DeductionBoard {
  constructor(scene) {
    this.scene = scene;
    this.open = false;
    this.chapter = null;
    this.mode = 'link';            // link | deduction
    this.selectedCard = null;
    this.cardPos = new Map();      // id → {x,y}
    this.cardObjs = new Map();     // id → { container, ring, redraw }
    this.confirmedByChapter = {};  // chapter → [{clueA, clueB, reveals}]
    this.confirmedKeys = {};       // chapter → Set("a|b")
    this.removedOptions = {};      // deductionId → Set(optionIndex)  힌트로 소거된 선택지
    this.tokens = 0;               // 최근 힌트 토큰 수(UIScene 가 갱신) — 사용 가능 피드백용
    this.dedIndex = 0;
    this._build();
  }

  _build() {
    const c = this.scene.add.container(0, 0).setDepth(650).setVisible(false);
    this.container = c;

    this.cork = this.scene.add.graphics();
    paintCork(this.cork, 800, 600);

    this.hintGlow = this.scene.add.graphics();   // 힌트 카드 은은한 글로우(카드 아래)
    this.threadG = this.scene.add.graphics();   // 확정 실
    this.tempG = this.scene.add.graphics();      // 임시/오답 실

    this.titleTxt = this.scene.add.text(400, 34, '추리 보드', {
      fontFamily: FONT, fontSize: '22px', color: CSS.fadedGold, fontStyle: 'bold',
    }).setOrigin(0.5);
    this.titleTxt.setShadow(1, 1, '#2a2018', 3);

    // 하단 reveals 양피지 띠.
    this.revealG = this.scene.add.graphics();
    paintParchment(this.revealG, 640, 46, { seed: 5, stains: 4 });
    this.revealG.setPosition(80, 486);
    this.revealTxt = this.scene.add.text(400, 509, '', {
      fontFamily: FONT, fontSize: '15px', color: CSS.ink, fontStyle: 'italic',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5);
    this.revealG.setVisible(false); this.revealTxt.setVisible(false);

    c.add([this.cork, this.hintGlow, this.threadG, this.tempG, this.titleTxt, this.revealG, this.revealTxt]);

    // 하단 버튼 바.
    this.btnConclude = makeButton(this.scene, 200, 560, 200, 40, '결론 내리기', () => this._toggleDeduction());
    this.btnHint = makeButton(this.scene, 420, 560, 150, 40, '힌트 🕯 (H)', () => this.requestHint());
    this.btnClose = makeButton(this.scene, 600, 560, 130, 40, '닫기 (Esc)', () => this.close());
    c.add([this.btnConclude.container, this.btnHint.container, this.btnClose.container]);

    // 결론 패널(딜레이 생성 컨테이너).
    this.dedContainer = this.scene.add.container(0, 0).setVisible(false);
    c.add(this.dedContainer);
  }

  // ── 열기(코어 board:open) ──
  show(chapter, payload) {
    this.open = true;
    this.chapter = chapter;
    this.payload = payload || {};
    this.mode = 'link';
    this.selectedCard = null;
    this.dedIndex = 0;
    if (!this.confirmedByChapter[chapter]) { this.confirmedByChapter[chapter] = []; this.confirmedKeys[chapter] = new Set(); }
    this.completed = new Set(payload.completedDeductionIds || []);

    this.container.setVisible(true);
    this.dedContainer.setVisible(false);
    this.revealG.setVisible(false); this.revealTxt.setVisible(false);
    this._clearHintGlow();
    this._layoutCards();
    this._redrawThreads();
  }

  close() {
    if (!this.open) return;
    if (this.mode === 'deduction') { this._closeDeduction(); return; }
    this.open = false;
    this.container.setVisible(false);
    bus.emit(EV.BOARD_CLOSED, {});
  }

  _confirmedCount() {
    const local = this.confirmedByChapter[this.chapter]?.length || 0;
    return Math.max(this.payload.confirmedLinkCount || 0, local);
  }

  // ── 카드 배치 ──
  _layoutCards() {
    this.cardObjs.forEach(o => o.container.destroy());
    this.cardObjs.clear();
    this.cardPos.clear();

    const clues = this.payload.clues || [];
    const n = clues.length;
    if (!n) return;
    const cols = n <= 3 ? n : (n <= 6 ? 3 : 4);
    const rows = Math.ceil(n / cols);
    const cellW = (AREA.x1 - AREA.x0) / cols;
    const cellH = (AREA.y1 - AREA.y0) / rows;

    clues.forEach((clue, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = AREA.x0 + cellW * col + cellW / 2;
      const y = AREA.y0 + cellH * row + cellH / 2;
      this.cardPos.set(clue.id, { x, y });
      this._makeCard(clue, x, y);
    });
  }

  _makeCard(clue, x, y) {
    const scene = this.scene;
    const cc = scene.add.container(x, y);
    const g = scene.add.graphics();
    paintParchment(g, CARD.w, CARD.h, { seed: this._hash(clue.id), stains: 3, radius: 6 });
    g.setPosition(-CARD.w / 2, -CARD.h / 2);
    // 선택 링(초기 숨김).
    const ring = scene.add.graphics();
    // 핀.
    const pin = scene.add.graphics();
    pin.fillStyle(PAL.threadRed, 1); pin.fillCircle(0, -CARD.h / 2 + 8, 5);
    pin.lineStyle(1, PAL.fadedGold, 0.8); pin.strokeCircle(0, -CARD.h / 2 + 8, 5);

    const name = scene.add.text(0, -8, clue.name || clue.id, {
      fontFamily: FONT, fontSize: '14px', color: CSS.ink, fontStyle: 'bold',
      align: 'center', wordWrap: { width: CARD.w - 22 },
    }).setOrigin(0.5);
    const type = scene.add.text(0, CARD.h / 2 - 16, this._typeLabel(clue.type), {
      fontFamily: FONT, fontSize: '11px', color: CSS.mistBlue, fontStyle: 'italic',
    }).setOrigin(0.5);

    cc.add([g, ring, pin, name, type]);
    // 넉넉한 히트 영역(카드 전체 + 여백) — 클릭 용이성.
    cc.setSize(CARD.w, CARD.h);
    cc.setInteractive(new Phaser.Geom.Rectangle(-CARD.w / 2 - 6, -CARD.h / 2 - 6, CARD.w + 12, CARD.h + 12),
      Phaser.Geom.Rectangle.Contains);
    const obj = { container: cc, hover: false };
    cc.on('pointerover', () => { obj.hover = true; obj.redraw(); this.scene.input.manager.canvas.style.cursor = 'pointer'; });
    cc.on('pointerout', () => { obj.hover = false; obj.redraw(); this.scene.input.manager.canvas.style.cursor = 'default'; });
    cc.on('pointerdown', () => this._onCardClick(clue.id));

    obj.redraw = () => {
      ring.clear();
      const selected = this.selectedCard === clue.id;
      if (selected) {
        ring.lineStyle(3, PAL.fadedGold, 0.95);
        ring.strokeRoundedRect(-CARD.w / 2 - 3, -CARD.h / 2 - 3, CARD.w + 6, CARD.h + 6, 8);
      } else if (obj.hover) {
        // 호버: 은은한 금빛 테두리 + 살짝 떠오름.
        ring.lineStyle(2, PAL.fadedGold, 0.55);
        ring.strokeRoundedRect(-CARD.w / 2 - 2, -CARD.h / 2 - 2, CARD.w + 4, CARD.h + 4, 7);
      }
      cc.setScale(selected || obj.hover ? 1.03 : 1);
    };
    this.container.add(cc);
    this.cardObjs.set(clue.id, obj);
  }

  _onCardClick(id) {
    if (this.mode !== 'link') return;
    if (this.selectedCard === id) { this.selectedCard = null; this._refreshRings(); return; }
    if (!this.selectedCard) { this.selectedCard = id; this._refreshRings(); return; }
    const a = this.selectedCard, b = id;
    this.selectedCard = null;
    this._refreshRings();
    this._clearHintGlow();   // 시도하면 힌트 글로우 해제
    this._lastAttempt = { a, b };
    bus.emit(EV.BOARD_LINK_ATTEMPT, { chapter: this.chapter, clueA: a, clueB: b });
  }

  _refreshRings() { this.cardObjs.forEach(o => o.redraw()); }

  // ── 코어 결과: 링크 판정 ──
  onLinkResult({ clueA, clueB, valid, reveals, linkId }) {
    if (!this.open) return;
    const a = clueA ?? this._lastAttempt?.a, b = clueB ?? this._lastAttempt?.b;
    if (valid) {
      const key = [a, b].sort().join('|');
      if (!this.confirmedKeys[this.chapter].has(key)) {
        this.confirmedKeys[this.chapter].add(key);
        this.confirmedByChapter[this.chapter].push({ clueA: a, clueB: b, reveals });
      }
      this._redrawThreads();
      // 링크 해설 표시는 코어 대사 디스패처 소유(트리거 평가 코어 단일 소유). UI 는 reveals 만 표시.
      this._showReveal(reveals || '두 조각이 이어졌다.');
    } else {
      this._flashInvalid(a, b);
      this._showReveal('이 둘은 아직 이어지지 않는다.', true);
    }
  }

  _redrawThreads() {
    this.threadG.clear();
    const list = this.confirmedByChapter[this.chapter] || [];
    for (const l of list) {
      const pa = this.cardPos.get(l.clueA), pb = this.cardPos.get(l.clueB);
      if (!pa || !pb) continue;
      this._drawThread(this.threadG, pa, pb, true);
    }
  }

  _drawThread(g, pa, pb, confirmed) {
    const midX = (pa.x + pb.x) / 2;
    const midY = (pa.y + pb.y) / 2 + 14;  // 살짝 처진 실.
    if (confirmed) {
      // 금빛 글로우 언더스트로크.
      g.lineStyle(6, PAL.fadedGold, 0.28);
      this._curve(g, pa, { x: midX, y: midY }, pb);
    }
    g.lineStyle(confirmed ? 3 : 2, PAL.threadRed, confirmed ? 0.95 : 0.5);
    this._curve(g, pa, { x: midX, y: midY }, pb);
    // 핀.
    g.fillStyle(PAL.deepGrey, 1);
    g.fillCircle(pa.x, pa.y, 4); g.fillCircle(pb.x, pb.y, 4);
    g.lineStyle(1, PAL.fadedGold, 0.7);
    g.strokeCircle(pa.x, pa.y, 4); g.strokeCircle(pb.x, pb.y, 4);
  }

  _curve(g, p0, p1, p2) {
    g.beginPath();
    g.moveTo(p0.x, p0.y);
    const steps = 18;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
      const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
      g.lineTo(x, y);
    }
    g.strokePath();
  }

  _flashInvalid(a, b) {
    const pa = this.cardPos.get(a), pb = this.cardPos.get(b);
    if (!pa || !pb) return;
    this.tempG.clear();
    this._drawThread(this.tempG, pa, pb, false);
    this.scene.tweens.add({
      targets: this.tempG, alpha: 0, duration: 900, ease: 'Sine.in',
      onComplete: () => { this.tempG.clear(); this.tempG.setAlpha(1); },
    });
  }

  _showReveal(text, warn = false) {
    this.revealG.setVisible(true);
    this.revealTxt.setVisible(true).setText(text).setColor(warn ? CSS.mistBlue : CSS.ink);
  }

  // ── 힌트 ──
  setTokens(n) { this.tokens = n; }

  requestHint() {
    bus.emit(EV.HINT_REQUEST, { context: this.mode === 'deduction' ? 'deduction' : 'link', chapter: this.chapter });
  }

  // 코어 hint:result 소비 (계약 §6). 판정·토큰은 코어 소유 — UI 는 결과만 가시화.
  // 필드명 편차도 방어적으로 흡수.
  onHintResult(payload = {}) {
    if (!this.open) return;
    const p = payload || {};
    // 실패(토큰 부족 등).
    if (p.ok === false || p.available === false || p.success === false) {
      const msg = p.reason === 'no_tokens' || p.reason === 'noTokens'
        ? '힌트 토큰이 없다. 조금 더 스스로 헤아려 보자.'
        : (p.message || '지금 더 짚어줄 실마리가 없다.');
      bus.emit(EV.TOAST, { text: msg, kind: 'info' });
      return;
    }
    const ctx = p.context || (p.deductionId != null ? 'deduction' : 'link');
    // 결론 힌트: 오답 1개 소거.
    if (ctx === 'deduction') {
      const dedId = p.deductionId || this._currentDeductionId();
      const idx = [p.eliminateOptionIndex, p.removeOptionIndex, p.optionIndex, p.eliminateIndex]
        .find(v => typeof v === 'number');
      if (dedId != null && typeof idx === 'number') {
        if (!this.removedOptions[dedId]) this.removedOptions[dedId] = new Set();
        this.removedOptions[dedId].add(idx);
        if (this.mode === 'deduction') this._renderDeduction();
        bus.emit(EV.TOAST, { text: '한 갈래가 흐려졌다 — 그 답은 아니다.', kind: 'info' });
      } else {
        bus.emit(EV.TOAST, { text: p.message || '지금은 소거할 선택지가 없다.', kind: 'info' });
      }
      return;
    }
    // 링크 힌트: 유효 링크 카드 쌍 은은히 하이라이트(pair 우선, 편차 흡수).
    let a, b;
    if (Array.isArray(p.pair) && p.pair.length >= 2) { a = p.pair[0]; b = p.pair[1]; }
    else if (p.clueA && p.clueB) { a = p.clueA; b = p.clueB; }
    else if (p.link) { a = p.link.clueA; b = p.link.clueB; }
    if (a && b) {
      this._highlightHintCards(a, b);
      this._showReveal(p.reveals || '이 근처에 이어질 실마리가 어렴풋이 보인다…');
    } else {
      // pair:null — 더 이을 조합이 없음.
      bus.emit(EV.TOAST, { text: p.message || '아직 이을 새 조합이 보이지 않는다. 단서를 더 모으라.', kind: 'info' });
    }
  }

  _currentDeductionId() {
    const avail = this._availableDeductions();
    return avail.length ? avail[Math.min(this.dedIndex, avail.length - 1)].id : null;
  }

  _highlightHintCards(a, b) {
    this._clearHintGlow();
    const pts = [this.cardPos.get(a), this.cardPos.get(b)].filter(Boolean);
    if (!pts.length) return;
    const draw = (alpha) => {
      this.hintGlow.clear();
      this.hintGlow.fillStyle(PAL.fadedGold, alpha);
      for (const pt of pts) {
        this.hintGlow.fillRoundedRect(pt.x - CARD.w / 2 - 8, pt.y - CARD.h / 2 - 8, CARD.w + 16, CARD.h + 16, 12);
      }
    };
    draw(0.28);
    // 은은한 맥동(아늑한 톤 — 강하지 않게), 약 6초 후 자동 소멸.
    this._hintTween = this.scene.tweens.addCounter({
      from: 0.10, to: 0.34, duration: 900, yoyo: true, repeat: 6,
      onUpdate: (tw) => draw(tw.getValue()),
      onComplete: () => this._clearHintGlow(),
    });
  }

  _clearHintGlow() {
    if (this._hintTween) { this._hintTween.remove(); this._hintTween = null; }
    if (this.hintGlow) this.hintGlow.clear();
  }

  // ── 결론(객관식) ──
  _availableDeductions() {
    return (this.payload.deductions || []).filter(d => !this.completed.has(d.id));
  }

  _toggleDeduction() {
    if (this.mode === 'deduction') { this._closeDeduction(); return; }
    this.mode = 'deduction';
    this.selectedCard = null; this._refreshRings();
    this.dedIndex = 0;
    this._renderDeduction();
    this.dedContainer.setVisible(true);
    // 카드는 show() 에서 컨테이너 끝에 추가되므로 결론 패널을 최상단으로 끌어올린다.
    this.container.bringToTop(this.dedContainer);
    [this.btnConclude, this.btnHint, this.btnClose].forEach(b => this.container.bringToTop(b.container));
    this.btnConclude.setLabel('보드로');
  }

  _closeDeduction() {
    this.mode = 'link';
    this.dedContainer.setVisible(false);
    this.btnConclude.setLabel('결론 내리기');
  }

  _renderDeduction() {
    this.dedContainer.removeAll(true);
    const avail = this._availableDeductions();
    const scrim = this.scene.add.rectangle(400, 300, 800, 600, 0x0d0d16, 0.5).setOrigin(0.5);
    this.dedContainer.add(scrim);

    const px = 120, py = 96, pw = 560, ph = 380;
    const panel = this.scene.add.graphics();
    paintParchment(panel, pw, ph, { seed: 21, stains: 6 });
    panel.setPosition(px, py);
    this.dedContainer.add(panel);

    if (!avail.length) {
      const done = this.scene.add.text(400, 286, '이 장의 결론을 모두 내렸다.\n남은 단서를 더 잇거나 보드를 닫으라.', {
        fontFamily: FONT, fontSize: '17px', color: CSS.ink, align: 'center', lineSpacing: 8,
      }).setOrigin(0.5);
      this.dedContainer.add(done);
      return;
    }

    this.dedIndex = Math.min(this.dedIndex, avail.length - 1);
    const d = avail[this.dedIndex];
    const confirmed = this._confirmedCount();
    const unlocked = confirmed >= d.requiredLinks;

    // 여러 결론일 때 인덱스 표시 + 전환.
    if (avail.length > 1) {
      const nav = this.scene.add.text(400, py + 20, `결론 ${this.dedIndex + 1} / ${avail.length}`, {
        fontFamily: FONT, fontSize: '13px', color: CSS.mistBlue,
      }).setOrigin(0.5);
      this.dedContainer.add(nav);
      const prev = makeButton(this.scene, px + 40, py + 20, 60, 28, '‹', () => { this.dedIndex = (this.dedIndex - 1 + avail.length) % avail.length; this._renderDeduction(); }, { fontSize: '16px' });
      const next = makeButton(this.scene, px + pw - 40, py + 20, 60, 28, '›', () => { this.dedIndex = (this.dedIndex + 1) % avail.length; this._renderDeduction(); }, { fontSize: '16px' });
      this.dedContainer.add([prev.container, next.container]);
    }

    const prompt = this.scene.add.text(400, py + 54, d.prompt, {
      fontFamily: FONT, fontSize: '18px', color: CSS.threadRed, fontStyle: 'bold',
      align: 'center', wordWrap: { width: pw - 60 },
    }).setOrigin(0.5, 0);
    this.dedContainer.add(prompt);

    if (!unlocked) {
      const lock = this.scene.add.text(400, py + 200,
        `🔒 단서 연결이 더 필요하다.\n확정된 연결 ${confirmed} / ${d.requiredLinks}`, {
          fontFamily: FONT, fontSize: '16px', color: CSS.mistBlue, align: 'center', lineSpacing: 8,
        }).setOrigin(0.5);
      this.dedContainer.add(lock);
      return;
    }

    // 선택지 버튼.
    let oy = py + 54 + prompt.height + 24;
    this.dedOptionBtns = [];
    const removed = this.removedOptions[d.id];
    d.options.forEach((opt, idx) => {
      const isRemoved = removed && removed.has(idx);
      const label = isRemoved ? `✗ ${opt}` : opt;
      const btn = makeButton(this.scene, 400, oy + 22, pw - 90, 40, label,
        () => { if (!isRemoved) this._answer(d, idx); }, { fontSize: '15px' });
      if (isRemoved) btn.setEnabled(false);   // 힌트로 소거된 오답 — 비활성/흐림.
      this.dedContainer.add(btn.container);
      this.dedOptionBtns.push(btn);
      oy += 48;
    });

    this.dedFeedback = this.scene.add.text(400, py + ph - 26, '', {
      fontFamily: FONT, fontSize: '15px', color: CSS.ink, align: 'center', fontStyle: 'italic',
      wordWrap: { width: pw - 60 },
    }).setOrigin(0.5);
    this.dedContainer.add(this.dedFeedback);
  }

  _answer(deduction, optionIndex) {
    this._pendingDeduction = deduction.id;
    bus.emit(EV.BOARD_CONCL_ATTEMPT, { deductionId: deduction.id, optionIndex });
  }

  onConclusionResult({ deductionId, correct }) {
    if (!this.open) return;
    if (correct) {
      this.completed.add(deductionId);
      if (this.dedFeedback) this.dedFeedback.setText('진실이 하나 밝혀졌다.').setColor(CSS.fadedGold);
      // 잠시 후 다음 결론/완료 상태로 갱신.
      this.scene.time.delayedCall(1100, () => { if (this.open && this.mode === 'deduction') this._renderDeduction(); });
    } else {
      if (this.dedFeedback) this.dedFeedback.setText('아직 아귀가 맞지 않는다. 다른 각도에서 다시 생각해보자.').setColor(CSS.mistBlue);
    }
  }

  // ── 유틸 ──
  _typeLabel(type) {
    return { object: '물증', document: '문서', testimony: '증언' }[type] || (type || '');
  }
  _hash(s) { let h = 0; for (let i = 0; i < (s || '').length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
}
