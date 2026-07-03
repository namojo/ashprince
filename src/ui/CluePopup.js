// 단서 획득 상세 팝업 — 단서를 얻는 순간 이름+상세문을 크게 보여주어
// "왜 단서인지 알 수 없다"는 피드백을 해소한다. 비모달(코어 잠금 규약과 충돌 방지):
// 상단-중앙에 떠서 클릭/Enter 또는 자동(약 8초)으로 닫힌다. 연속 획득은 큐로 순차 표시.
import { bus, EV } from '../systems/eventBus.js';
import { PAL, CSS, FONT, paintParchment } from './theme.js';

const W = 540, TOP = 90;

export class CluePopup {
  constructor(scene) {
    this.scene = scene;
    this.queue = [];
    this.showing = false;
    this._build();
  }

  _build() {
    const c = this.scene.add.container(400, TOP).setDepth(680).setVisible(false);
    this.container = c;
    this.bg = this.scene.add.graphics();
    this.header = this.scene.add.text(0, 0, '✦ 단서 획득', {
      fontFamily: FONT, fontSize: '15px', color: CSS.fadedGold, fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this.nameTxt = this.scene.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '21px', color: CSS.threadRed, fontStyle: 'bold',
      align: 'center', wordWrap: { width: W - 60 },
    }).setOrigin(0.5, 0);
    this.metaTxt = this.scene.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '13px', color: CSS.mistBlue, fontStyle: 'italic',
      align: 'center', wordWrap: { width: W - 60 },
    }).setOrigin(0.5, 0);
    this.bodyTxt = this.scene.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '17px', color: CSS.ink, lineSpacing: 7,
      align: 'left', wordWrap: { width: W - 60 },
    }).setOrigin(0.5, 0);
    this.footTxt = this.scene.add.text(0, 0, '저널(J)에 기록되었다 · 클릭하여 계속', {
      fontFamily: FONT, fontSize: '13px', color: CSS.deadBark, fontStyle: 'italic',
    }).setOrigin(0.5, 0);
    c.add([this.bg, this.header, this.nameTxt, this.metaTxt, this.bodyTxt, this.footTxt]);
    c.setInteractive(new Phaser.Geom.Rectangle(-W / 2, 0, W, 400), Phaser.Geom.Rectangle.Contains);
    c.on('pointerdown', () => this._dismiss());
  }

  show(clue) {
    if (!clue) return;
    this.queue.push(clue);
    if (!this.showing) this._next();
  }

  _next() {
    const clue = this.queue.shift();
    if (!clue) {
      this.showing = false;
      this.container.setVisible(false);
      if (this.onEmpty) this.onEmpty();   // 모든 단서 팝업 종료 → 반응 독백 발화 신호.
      return;
    }
    this.showing = true;

    this.nameTxt.setText(clue.name || clue.id);
    this.metaTxt.setText(`${clue.location || ''}${clue.type ? '  ·  ' + this._typeLabel(clue.type) : ''}`);
    this.bodyTxt.setText(clue.detail || clue.summary || '');

    // 세로 레이아웃 계산.
    const padX = 30;
    let y = 18;
    this.header.setPosition(0, y); y += this.header.height + 8;
    this.nameTxt.setPosition(0, y); y += this.nameTxt.height + 4;
    this.metaTxt.setPosition(0, y); y += this.metaTxt.height + 12;
    this.bodyTxt.setPosition(-(W / 2) + padX, y); this.bodyTxt.setOrigin(0, 0);
    y += this.bodyTxt.height + 14;
    this.footTxt.setPosition(0, y); y += this.footTxt.height + 18;
    const h = y;

    paintParchment(this.bg, W, h, { seed: 17, stains: 6 });
    this.bg.setPosition(-W / 2, 0);
    // 봉랍 인장 장식(양 상단 모서리 — 헤더와 겹치지 않게).
    for (const cx of [22, W - 22]) {
      this.bg.fillStyle(PAL.threadRed, 0.85); this.bg.fillCircle(cx, 22, 9);
      this.bg.lineStyle(1.5, PAL.fadedGold, 0.7); this.bg.strokeCircle(cx, 22, 9);
    }

    this.container.setSize(W, h);
    this.container.input.hitArea.setTo(-W / 2, 0, W, h);
    this.container.setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this.container, alpha: 1, y: TOP, duration: 220, ease: 'Sine.out' });
    this.container.y = TOP - 10;

    if (this._timer) this._timer.remove();
    this._timer = this.scene.time.delayedCall(8000, () => this._dismiss());
  }

  _dismiss() {
    if (!this.showing) return;
    if (this._timer) { this._timer.remove(); this._timer = null; }
    this.scene.tweens.add({
      targets: this.container, alpha: 0, duration: 200,
      onComplete: () => this._next(),
    });
  }

  // Enter 로도 닫기(월드 이동 키와 겹치지 않는 키).
  handleKey() { if (this.showing) this._dismiss(); }

  _typeLabel(type) {
    return { object: '물증', document: '문서', testimony: '증언' }[type] || (type || '');
  }
}
