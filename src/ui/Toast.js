// 토스트 — 범용 알림·단서 획득·도구 해금·아이템 획득. 상단 중앙에서 떠올라 사라진다.
import { PAL, CSS, FONT } from './theme.js';

const KIND_ACCENT = {
  info: PAL.mistBlue,
  success: PAL.fadedGold,
  warn: PAL.threadRed,
};

export class Toast {
  constructor(scene) {
    this.scene = scene;
    this.queue = [];
    this.activeCount = 0;
    this.baseY = 58;
  }

  show(text, kind = 'info') {
    const scene = this.scene;
    const accent = KIND_ACCENT[kind] || PAL.mistBlue;

    const c = scene.add.container(400, this.baseY + this.activeCount * 44).setDepth(700);
    const pad = 16;
    const label = scene.add.text(0, 0, text, {
      fontFamily: FONT, fontSize: '16px', color: CSS.highlight, align: 'center',
      wordWrap: { width: 560 },
    }).setOrigin(0.5);
    const w = Math.min(600, label.width + pad * 2);
    const h = label.height + pad;
    const g = scene.add.graphics();
    g.fillStyle(PAL.deepGrey, 0.9);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    g.lineStyle(2, accent, 0.9);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    c.add([g, label]);
    c.setAlpha(0);

    this.activeCount++;
    scene.tweens.add({ targets: c, alpha: 1, y: c.y + 6, duration: 220, ease: 'Sine.out' });
    scene.tweens.add({
      targets: c, alpha: 0, delay: 2200, duration: 500, ease: 'Sine.in',
      onComplete: () => { c.destroy(); this.activeCount = Math.max(0, this.activeCount - 1); },
    });
  }
}
