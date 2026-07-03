// 스토리 패널 — 이미지+텍스트 컷 시퀀스(타이틀 도입·챕터 에필로그 등).
// 코어 story:panels 수신 → 패널을 순차 표시, 클릭/키로 넘기고 마지막에서 닫으며
// story:panels:closed 발신. 패널 이미지 미도착 시 팔레트 배경+텍스트로 폴백.
import { bus, EV } from '../systems/eventBus.js';
import { PAL, CSS, FONT, paintParchment } from './theme.js';

export class StoryPanel {
  constructor(scene) {
    this.scene = scene;
    this.open = false;
    this.panels = [];
    this.index = 0;
    this.sequenceId = null;
    this._build();
  }

  _build() {
    const c = this.scene.add.container(0, 0).setDepth(760).setVisible(false);
    this.container = c;
    // 전체 어둠 배경.
    this.scrim = this.scene.add.rectangle(400, 300, 800, 600, 0x14121a, 1).setOrigin(0.5);
    // 이미지 영역(또는 팔레트 폴백).
    this.imgFallback = this.scene.add.graphics();
    this.img = this.scene.add.image(400, 232, '__none').setVisible(false);
    // 자막 스크림 — 밀도 높은 CG 에서 하단 자막 가독을 위한 은은한 어둠 밴드(정적).
    // WebGL 전용 fillGradientStyle 대신 반투명 밴드를 쌓아 Canvas/WebGL 모두에서 동일한 그라데이션.
    this.textScrim = this.scene.add.graphics();
    const bands = 7, top = 396, h = 204;
    for (let i = 0; i < bands; i++) {
      const a = 0.06 + (0.5 - 0.06) * (i / (bands - 1));   // 위 0.06 → 아래 0.5
      this.textScrim.fillStyle(0x14121a, a);
      this.textScrim.fillRect(0, top + (h / bands) * i, 800, h / bands + 1);
    }
    // 하단 텍스트 양피지 패널.
    this.textG = this.scene.add.graphics();
    this.textTxt = this.scene.add.text(400, 470, '', {
      fontFamily: FONT, fontSize: '19px', color: CSS.ink, align: 'center', lineSpacing: 8,
      wordWrap: { width: 660 },
    }).setOrigin(0.5, 0);
    this.captionTxt = this.scene.add.text(400, 78, '', {
      fontFamily: FONT, fontSize: '15px', color: CSS.fadedGold, fontStyle: 'italic', align: 'center',
      wordWrap: { width: 620 },
    }).setOrigin(0.5, 0);
    // 진행 표시 + 계속 안내.
    this.dots = this.scene.add.text(400, 560, '', {
      fontFamily: FONT, fontSize: '16px', color: CSS.mistBlue,
    }).setOrigin(0.5);
    this.advanceHint = this.scene.add.text(752, 560, '▼', {
      fontFamily: FONT, fontSize: '18px', color: CSS.threadRed,
    }).setOrigin(1, 0.5);

    c.add([this.scrim, this.imgFallback, this.img, this.captionTxt, this.textScrim, this.textG, this.textTxt, this.dots, this.advanceHint]);
    c.setInteractive(new Phaser.Geom.Rectangle(0, 0, 800, 600), Phaser.Geom.Rectangle.Contains);
    c.on('pointerdown', () => this.advance());
  }

  isOpen() { return this.open; }

  show(sequenceId, panels) {
    if (!Array.isArray(panels) || !panels.length) {
      // 빈 시퀀스면 즉시 닫힘 통지(코어 흐름 유지).
      bus.emit(EV.STORY_PANELS_CLOSED || 'story:panels:closed', { sequenceId });
      return;
    }
    this.open = true;
    this.sequenceId = sequenceId;
    this.panels = panels;
    this.index = 0;
    this.container.setVisible(true);
    // 잠금은 코어 소유(계약 §7): 코어가 story:panels 발신 시 잠그고 story:panels:closed 수신 시 해제.
    // UI 는 ui:modal 을 발신하지 않는다.
    this._render();
  }

  advance() {
    if (!this.open) return;
    if (this.index >= this.panels.length - 1) { this._close(); return; }
    this.index++;
    this._render();
  }

  _render() {
    const p = this.panels[this.index] || {};
    const key = p.image;
    const hasImg = key && this.scene.textures.exists(key);
    this.imgFallback.clear();
    if (hasImg) {
      this.img.setTexture(key).setVisible(true);
      const maxW = 720, maxH = 300;
      const s = Math.min(maxW / this.img.width, maxH / this.img.height);
      this.img.setScale(s).setPosition(400, 220);
    } else {
      // 팔레트 폴백 패널(이미지 도착 전).
      this.img.setVisible(false);
      this.imgFallback.fillStyle(PAL.shadowPlum, 0.5);
      this.imgFallback.fillRoundedRect(120, 90, 560, 300, 12);
      this.imgFallback.lineStyle(2, PAL.fadedGold, 0.4);
      this.imgFallback.strokeRoundedRect(120, 90, 560, 300, 12);
    }
    this.captionTxt.setText(p.title || p.caption || '');   // 계약 필드 title(캡션 별칭 흡수)

    // 텍스트 패널.
    this.textTxt.setText(p.text || '');
    const pad = 22;
    const th = this.textTxt.height + pad * 2;
    const py = 500 - Math.min(th, 130) / 2;
    this.textG.clear();
    paintParchment(this.textG, 700, Math.max(80, th), { seed: 9, stains: 5 });
    this.textG.setPosition(50, py);
    this.textTxt.setY(py + pad);

    this.dots.setText(this.panels.map((_, i) => (i === this.index ? '●' : '○')).join(' '));
  }

  _close() {
    const seq = this.sequenceId;
    this.open = false;
    this.container.setVisible(false);
    // 코어가 story:panels:closed 수신 시 잠금 해제(§7). UI 는 이 종료 통지만 발신.
    bus.emit(EV.STORY_PANELS_CLOSED || 'story:panels:closed', { sequenceId: seq });
  }
}
