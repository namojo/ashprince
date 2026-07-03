// 대사창 — 빛바랜 양피지 패널(§4). 타이핑 효과·화자·초상·분기 선택지.
// 데이터 주도: dialogues.json 트리를 직접 소비. 판정 아님(단서 부여는 코어에 위임).
import { bus, EV } from '../systems/eventBus.js';
import { PAL, CSS, FONT, paintParchment, toChars } from './theme.js';

const PANEL = { x: 18, y: 392, w: 764, h: 192 };
const PORTRAIT_SIZE = 150;

export class DialogueBox {
  // deps: { dialoguesById, getDiscovered:()=>Set, cps:number, hasPortrait:(key)=>bool }
  constructor(scene, deps) {
    this.scene = scene;
    this.dialoguesById = deps.dialoguesById;
    this.getDiscovered = deps.getDiscovered;
    this.cps = deps.cps || 30;
    this.hasPortrait = deps.hasPortrait;

    this.active = false;
    this.rootId = null;         // 최상위 트리 id(닫을 때 dialogue:closed 페이로드)
    this.node = null;
    this.state = 'idle';        // idle | typing | full | choosing
    this.fullChars = [];
    this.shown = 0;
    this.acc = 0;
    this.selIndex = 0;
    this.visibleChoices = [];
    this._revealedFor = null;   // reveals_clue 중복 방지

    this._build();
  }

  _build() {
    const c = this.scene.add.container(0, 0).setDepth(500).setVisible(false);
    this.container = c;

    this.bg = this.scene.add.graphics();
    this.bg.setPosition(PANEL.x, PANEL.y);
    paintParchment(this.bg, PANEL.w, PANEL.h, { seed: 13, stains: 8 });

    // 초상 액자(양피지 위 봉랍 느낌 프레임).
    this.portraitFrame = this.scene.add.graphics();
    this.portrait = this.scene.add.image(0, 0, '__none').setVisible(false);

    const textLeft = PANEL.x + 30;
    this.speakerTxt = this.scene.add.text(textLeft, PANEL.y + 18, '', {
      fontFamily: FONT, fontSize: '18px', color: CSS.fadedGold, fontStyle: 'bold',
    });
    this.bodyTxt = this.scene.add.text(textLeft, PANEL.y + 50, '', {
      fontFamily: FONT, fontSize: '19px', color: CSS.ink, lineSpacing: 7,
      wordWrap: { width: PANEL.w - 70 },
    });
    // 계속 표시 삼각형(▼) — 완료 후 점멸.
    this.advanceHint = this.scene.add.text(PANEL.x + PANEL.w - 34, PANEL.y + PANEL.h - 34, '▼', {
      fontFamily: FONT, fontSize: '20px', color: CSS.threadRed,
    }).setVisible(false);

    this.choiceTexts = [];
    c.add([this.bg, this.portraitFrame, this.portrait, this.speakerTxt, this.bodyTxt, this.advanceHint]);
  }

  isOpen() { return this.active; }

  open(dialogueId) {
    const node = this.dialoguesById[dialogueId];
    if (!node) {
      console.warn(`[UI/Dialogue] 존재하지 않는 대사 id 참조: "${dialogueId}"`);
      // 트리가 여기서 끊기므로 안전하게 닫는다.
      if (this.active) this._close();
      return;
    }
    // CG 패널 노드는 story:panels(코어 소유) 경로로만 표시한다 — 대사창에서 렌더하지 않아
    // 에필로그 CG 중복 발동을 막는다(계약 §7). 대사 트리가 패널 노드로 이어지면 여기서 종료.
    if (node.panel) {
      if (this.active) this._close();
      return;
    }
    if (!this.active) {
      this.active = true;
      this.rootId = dialogueId;
      this.container.setVisible(true);
    }
    this._showNode(node);
  }

  _showNode(node) {
    this.node = node;
    this._revealedFor = null;
    this._clearChoices();
    this.advanceHint.setVisible(false);

    // 화자.
    const speaker = node.speaker || '';
    this.speakerTxt.setText(this._speakerLabel(speaker));

    // 초상(감정 변주 에셋이 없어 캐릭터 단일 초상으로 매핑).
    this._setPortrait(speaker);

    // 본문 타이핑 준비.
    this.fullChars = toChars(node.text || '');
    this.shown = 0;
    this.acc = 0;
    this.bodyTxt.setText('');
    this.state = 'typing';
  }

  _speakerLabel(speaker) {
    if (!speaker || speaker === 'narration') return '';
    const map = {
      char_lyren: '리엔 (기록관)', char_miriam: '미리엄 코울', char_anika: '애니카',
      char_ornelia: '오르넬리아 세이지', char_silas: '실라스 본', char_isolde: '이졸데 베일',
      char_kael: '카엘 도른', char_corvinox: '코르비녹스',
    };
    return map[speaker] || speaker;
  }

  _setPortrait(speaker) {
    const textLeft = PANEL.x + 30;
    const key = speaker && speaker.startsWith('char_') ? `${speaker}_portrait` : null;
    if (key && this.hasPortrait(key)) {
      const px = PANEL.x + 100, py = PANEL.y + PANEL.h / 2;
      this.portrait.setTexture(key).setVisible(true);
      const scale = PORTRAIT_SIZE / Math.max(this.portrait.width, this.portrait.height);
      this.portrait.setScale(scale).setPosition(px, py);
      // 액자.
      const half = PORTRAIT_SIZE / 2 + 6;
      this.portraitFrame.clear();
      this.portraitFrame.fillStyle(PAL.deadBark, 0.9);
      this.portraitFrame.fillRoundedRect(px - half, py - half, half * 2, half * 2, 8);
      this.portraitFrame.lineStyle(2, PAL.fadedGold, 0.6);
      this.portraitFrame.strokeRoundedRect(px - half, py - half, half * 2, half * 2, 8);
      // 텍스트를 초상 오른쪽으로 밀기.
      this.speakerTxt.setX(px + half + 18);
      this.bodyTxt.setX(px + half + 18);
      this.bodyTxt.setStyle({ wordWrap: { width: PANEL.x + PANEL.w - (px + half + 18) - 30 } });
      this._bodyLeft = px + half + 18;
    } else {
      this.portrait.setVisible(false);
      this.portraitFrame.clear();
      this.speakerTxt.setX(textLeft);
      this.bodyTxt.setX(textLeft);
      this.bodyTxt.setStyle({ wordWrap: { width: PANEL.w - 70 } });
      this._bodyLeft = textLeft;
    }
  }

  // ── 타이핑 루프 (UIScene.update 에서 delta 전달) ──
  update(delta) {
    if (!this.active || this.state !== 'typing') {
      if (this.active && (this.state === 'full' || this.state === 'choosing')) {
        // ▼ 점멸(선택지 없을 때만).
        if (this.state === 'full') {
          this._blink = (this._blink || 0) + delta;
          this.advanceHint.setVisible(Math.floor(this._blink / 450) % 2 === 0);
        }
      }
      return;
    }
    this.acc += delta;
    const perChar = 1000 / this.cps;
    while (this.acc >= perChar && this.shown < this.fullChars.length) {
      this.acc -= perChar;
      this.shown++;
    }
    this.bodyTxt.setText(this.fullChars.slice(0, this.shown).join(''));
    if (this.shown >= this.fullChars.length) this._onTypingDone();
  }

  _onTypingDone() {
    this.state = 'pending';           // 잠깐 중립 상태(중복 처리 방지)
    // reveals_clue(노드 단위): 표시 완료 시점에 1회 요청.
    if (this.node.reveals_clue && this._revealedFor !== this.node.id) {
      this._revealedFor = this.node.id;
      bus.emit(EV.CLUE_REVEAL_REQUEST, { clueId: this.node.reveals_clue });
    }
    if (Array.isArray(this.node.choices) && this.node.choices.length) {
      this._renderChoices();
      this.state = 'choosing';
    } else {
      this.state = 'full';
      this._blink = 0;
      this.advanceHint.setVisible(true);
    }
  }

  _renderChoices() {
    this._clearChoices();
    const discovered = this.getDiscovered();
    this.visibleChoices = this.node.choices.filter(
      ch => !ch.require_clue || discovered.has(ch.require_clue)
    );
    this.selIndex = 0;
    let y = PANEL.y + 50 + this.bodyTxt.height + 14;
    const left = this._bodyLeft;
    this.visibleChoices.forEach((ch, i) => {
      const t = this.scene.add.text(left, y, '', {
        fontFamily: FONT, fontSize: '18px', color: CSS.ink,
        wordWrap: { width: PANEL.x + PANEL.w - left - 30 },
      });
      this.container.add(t);
      this.choiceTexts.push(t);
      y += 30;
    });
    this._drawChoiceLabels();
  }

  _drawChoiceLabels() {
    this.choiceTexts.forEach((t, i) => {
      const sel = i === this.selIndex;
      t.setText(`${sel ? '❧ ' : '   '}${this.visibleChoices[i].text}`);
      t.setColor(sel ? CSS.threadRed : CSS.ink);
      t.setFontStyle(sel ? 'bold' : 'normal');
    });
  }

  _clearChoices() {
    this.choiceTexts.forEach(t => t.destroy());
    this.choiceTexts = [];
    this.visibleChoices = [];
  }

  // ── 입력 (UIScene 가 라우팅) ──
  // 2단계: 출력 중 → 전체 표시(스킵) / 완료 후 → 다음(또는 선택 확정).
  advance() {
    if (!this.active) return;
    if (this.state === 'typing') {           // 스킵: 즉시 전체 표시
      this.shown = this.fullChars.length;
      this.bodyTxt.setText(this.fullChars.join(''));
      this._onTypingDone();
      return;
    }
    if (this.state === 'choosing') { this._confirmChoice(); return; }
    if (this.state === 'full') { this._goNext(this.node.next); }
  }

  moveSelection(dir) {
    if (this.state !== 'choosing' || !this.visibleChoices.length) return;
    const n = this.visibleChoices.length;
    this.selIndex = (this.selIndex + dir + n) % n;
    this._drawChoiceLabels();
  }

  _confirmChoice() {
    const ch = this.visibleChoices[this.selIndex];
    if (!ch) return;
    if (ch.reveals_clue) bus.emit(EV.CLUE_REVEAL_REQUEST, { clueId: ch.reveals_clue });
    this._goNext(ch.next);
  }

  _goNext(nextId) {
    if (nextId) this.open(nextId);
    else this._close();
  }

  _close() {
    const id = this.rootId;
    this.active = false;
    this.state = 'idle';
    this.node = null;
    this._clearChoices();
    this.container.setVisible(false);
    bus.emit(EV.DIALOGUE_CLOSED, { dialogueId: id });
  }
}
