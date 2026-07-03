// 상호작용 대상(조사 오브젝트 / NPC / 에코 지점 / 아이템 / 문).
// 근접 시 프롬프트 대상이 되고, 상호작용 키 입력 시 onInteract 콜백이 실행된다.
// 실제 게임플레이 결과(단서 부여·대사 발화·회상 진입)는 WorldScene 가 콜백으로 주입한다.

export const VERB = {
  object: '조사', npc: '대화', echo: '회상', item: '줍기', door: '열기',
};

export class Interactable extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, def) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body(오브젝트는 고정)
    this.def = def;                 // { id, type, data, onInteract, solid?, verb? }
    this.id = def.id;
    this.type = def.type;
    this.verb = def.verb || VERB[def.type] || '조사';
    this.setOrigin(0.5, 0.85);
    this.setDepth(y);
    this._baseScale = 1;
    this._consumed = false;
    // 마커류(NPC 제외)는 은은히 상시 부유.
    if (def.type !== 'npc') {
      scene.tweens.add({ targets: this, y: y - 4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  // 근접 하이라이트: 상호작용 범위에 들면 확대+맥동으로 강조(조사 대상임을 시각화).
  setHighlight(on) {
    if (this._consumed) return;
    if (on && !this._hl) {
      this._hl = this.scene.tweens.add({
        targets: this, scale: { from: this._baseScale * 1.15, to: this._baseScale * 1.28 },
        duration: 520, yoyo: true, repeat: -1, ease: 'Sine.inOut',
      });
      this.setTint(0xfff2c9); // 은은한 온기 글로우
    } else if (!on && this._hl) {
      this._hl.stop(); this._hl = null;
      this.setScale(this._baseScale);
      this.clearTint();
    }
  }

  interact(scene) {
    if (this._consumed) return;
    this.def.onInteract && this.def.onInteract(this, scene);
  }

  // 획득/소비형(아이템·완료된 조사 오브젝트) 제거.
  consume() {
    this._consumed = true;
    this.scene.tweens.add({
      targets: this, alpha: 0, y: this.y - 10, duration: 250,
      onComplete: () => this.destroy(),
    });
  }
}
