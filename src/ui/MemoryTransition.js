// 회상 전환 연출 — memory:play 수신 시 레터박스 + 제목 오버레이 + 톤 시프트(세피아 플래시).
// 실제 회상 맵/조작은 코어(flashback.js)가 처리. 여기서는 진입 순간의 연결 연출만.
import { PAL, CSS, FONT } from './theme.js';

export class MemoryTransition {
  constructor(scene) {
    this.scene = scene;
    this._build();
  }

  _build() {
    const c = this.scene.add.container(0, 0).setDepth(800).setVisible(false);
    this.container = c;
    // 상·하 레터박스 바.
    this.top = this.scene.add.rectangle(400, -60, 800, 120, 0x0d0d16, 0.92).setOrigin(0.5);
    this.bottom = this.scene.add.rectangle(400, 660, 800, 120, 0x0d0d16, 0.92).setOrigin(0.5);
    // 세피아 톤 시프트(회상 특유의 바랜 색).
    this.tint = this.scene.add.rectangle(400, 300, 800, 600, PAL.fadedGold, 0).setOrigin(0.5);
    this.title = this.scene.add.text(400, 300, '회상', {
      fontFamily: FONT, fontSize: '34px', color: CSS.highlight, fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);
    this.title.setShadow(2, 2, '#000000', 6);
    c.add([this.tint, this.top, this.bottom, this.title]);
  }

  play() {
    const scene = this.scene;
    this.container.setVisible(true);
    this.top.y = -60; this.bottom.y = 660; this.tint.alpha = 0; this.title.setAlpha(0);

    scene.tweens.add({ targets: this.top, y: 60, duration: 500, ease: 'Sine.out' });
    scene.tweens.add({ targets: this.bottom, y: 540, duration: 500, ease: 'Sine.out' });
    scene.tweens.add({ targets: this.tint, alpha: 0.22, duration: 500, yoyo: true, hold: 500 });
    scene.tweens.add({
      targets: this.title, alpha: 1, duration: 500, delay: 250, yoyo: true, hold: 900,
    });
    // 레터박스 후퇴(회상 맵 진입 후 여백만 은은히 남김 → 완전 후퇴).
    scene.tweens.add({
      targets: this.top, y: -60, duration: 500, delay: 2200, ease: 'Sine.in',
    });
    scene.tweens.add({
      targets: this.bottom, y: 660, duration: 500, delay: 2200, ease: 'Sine.in',
      onComplete: () => this.container.setVisible(false),
    });
  }
}
