// 단서 저널 — 낡은 가죽 장정(§4). J 키 토글. 좌측 인덱스 목록 + 우측 상세 페이지.
// 단서 상세는 코어가 clue:found / board:open 페이로드로 공급 → UIScene 가 addClue 로 주입.
import { bus, EV } from '../systems/eventBus.js';
import { PAL, CSS, FONT, paintLeather, paintPage } from './theme.js';

const BOX = { x: 130, y: 62, w: 540, h: 476 };

export class Journal {
  constructor(scene) {
    this.scene = scene;
    this.open = false;
    this.clues = new Map();   // id → clue 객체
    this.order = [];          // 획득/등록 순서
    this.sel = 0;
    this._build();
  }

  _build() {
    const c = this.scene.add.container(0, 0).setDepth(600).setVisible(false);
    this.container = c;

    // 화면 어둡게(모달 배경).
    this.scrim = this.scene.add.rectangle(400, 300, 800, 600, 0x0d0d16, 0.55).setOrigin(0.5);

    const cover = this.scene.add.graphics().setPosition(BOX.x, BOX.y);
    paintLeather(cover, BOX.w, BOX.h);

    // 제목.
    this.titleTxt = this.scene.add.text(BOX.x + BOX.w / 2, BOX.y + 24, '조사자의 단서 저널', {
      fontFamily: FONT, fontSize: '20px', color: CSS.fadedGold, fontStyle: 'bold',
    }).setOrigin(0.5);

    // 좌측 인덱스 페이지.
    this.listX = BOX.x + 26; this.listY = BOX.y + 58;
    this.listW = 210; this.listH = BOX.h - 90;
    const pageL = this.scene.add.graphics();
    paintPage(pageL, this.listX - 8, this.listY - 8, this.listW + 16, this.listH + 16);

    // 우측 상세 페이지.
    this.detX = BOX.x + 262; this.detY = BOX.y + 58;
    this.detW = BOX.w - 262 - 26; this.detH = BOX.h - 90;
    const pageR = this.scene.add.graphics();
    paintPage(pageR, this.detX - 8, this.detY - 8, this.detW + 16, this.detH + 16);

    this.listTexts = [];
    this.detailName = this.scene.add.text(this.detX, this.detY, '', {
      fontFamily: FONT, fontSize: '18px', color: CSS.threadRed, fontStyle: 'bold',
      wordWrap: { width: this.detW },
    });
    this.detailMeta = this.scene.add.text(this.detX, this.detY + 30, '', {
      fontFamily: FONT, fontSize: '13px', color: CSS.mistBlue, fontStyle: 'italic',
      wordWrap: { width: this.detW },
    });
    this.detailBody = this.scene.add.text(this.detX, this.detY + 66, '', {
      fontFamily: FONT, fontSize: '17px', color: CSS.ink, lineSpacing: 8,
      wordWrap: { width: this.detW },
    });
    this.emptyTxt = this.scene.add.text(BOX.x + BOX.w / 2, BOX.y + BOX.h / 2,
      '아직 기록된 단서가 없다.\n주변을 조사하라.', {
        fontFamily: FONT, fontSize: '16px', color: CSS.ink, align: 'center', lineSpacing: 6,
      }).setOrigin(0.5);
    this.hintTxt = this.scene.add.text(BOX.x + BOX.w / 2, BOX.y + BOX.h - 20,
      '↑↓ 단서 선택 · J/Esc 닫기', {
        fontFamily: FONT, fontSize: '13px', color: CSS.parchment,
      }).setOrigin(0.5);

    c.add([this.scrim, cover, this.titleTxt, pageL, pageR,
      this.detailName, this.detailMeta, this.detailBody, this.emptyTxt, this.hintTxt]);
  }

  addClue(clue) {
    if (!clue || !clue.id) return;
    if (!this.clues.has(clue.id)) this.order.push(clue.id);
    this.clues.set(clue.id, clue);
    if (this.open) this._refresh();
  }

  toggle() { this.open ? this.close() : this.show(); }

  show() {
    this.open = true;
    this.sel = Math.min(this.sel, Math.max(0, this.order.length - 1));
    this.container.setVisible(true);
    this._refresh();
    bus.emit(EV.UI_MODAL, { open: true });
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.container.setVisible(false);
    bus.emit(EV.UI_MODAL, { open: false });
  }

  move(dir) {
    if (!this.open || !this.order.length) return;
    const n = this.order.length;
    this.sel = (this.sel + dir + n) % n;
    this._refresh();
  }

  _refresh() {
    this.listTexts.forEach(t => t.destroy());
    this.listTexts = [];
    const empty = this.order.length === 0;
    this.emptyTxt.setVisible(empty);
    this.detailName.setVisible(!empty);
    this.detailMeta.setVisible(!empty);
    this.detailBody.setVisible(!empty);
    if (empty) return;

    let y = this.listY;
    this.order.forEach((id, i) => {
      const clue = this.clues.get(id);
      const sel = i === this.sel;
      const t = this.scene.add.text(this.listX, y, `${sel ? '❧ ' : '· '}${clue.name || id}`, {
        fontFamily: FONT, fontSize: '16px',
        color: sel ? CSS.threadRed : CSS.ink,
        fontStyle: sel ? 'bold' : 'normal',
        wordWrap: { width: this.listW },
      });
      // 클릭 선택(넉넉한 히트 영역 — "선택이 어렵다" 피드백 대응).
      t.setInteractive(new Phaser.Geom.Rectangle(-6, -4, this.listW + 12, t.height + 8), Phaser.Geom.Rectangle.Contains);
      t.on('pointerover', () => { if (i !== this.sel) t.setColor(CSS.deadBark); });
      t.on('pointerout', () => { if (i !== this.sel) t.setColor(CSS.ink); });
      t.on('pointerdown', () => { this.sel = i; this._refresh(); });
      this.container.add(t);
      this.listTexts.push(t);
      y += Math.max(t.height, 20) + 8;
    });

    const cur = this.clues.get(this.order[this.sel]);
    this.detailName.setText(cur.name || cur.id);
    this.detailMeta.setText(`${cur.location || ''}${cur.type ? '  ·  ' + this._typeLabel(cur.type) : ''}`);
    this.detailBody.setText(cur.detail || cur.summary || '');
  }

  _typeLabel(type) {
    return { object: '물증', document: '문서', testimony: '증언' }[type] || type;
  }
}
