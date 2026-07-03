// 플레이어 엔티티. 물리 바디 + 8방향 가감속 이동 + 방향별 애니메이션 전환.
import { readAxis, applyMovement } from '../systems/movement.js';
import { dirFromVector } from '../systems/animation.js';

export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, animSpec, moveOpts) {
    super(scene, x, y, textureKey, animSpec.directions.length ? 0 : undefined);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.animKey = textureKey;
    this.dirs = animSpec.directions;
    this.moveOpts = moveOpts;              // { speed, rampTime }
    this.facing = 'down';
    this.setOrigin(0.5, 0.85);             // 발밑 기준 → 자연스러운 깊이감
    // 충돌 바디는 발밑 좁은 영역만 사용(머리/몸통이 벽에 안 걸리게).
    const bw = this.width * 0.5, bh = this.height * 0.35;
    this.body.setSize(bw, bh);
    this.body.setOffset((this.width - bw) / 2, this.height - bh);
    this.setDepth(y);
    this.play(`${this.animKey}-idle-${this.facing}`);
  }

  update(input, dtSec, locked) {
    if (locked) {
      this.body.setVelocity(0, 0);
      this._playIdle();
      return { moving: false };
    }
    const axis = readAxis(input);
    const res = applyMovement(this.body, axis, this.moveOpts, dtSec);
    if (res.moving) {
      this.facing = dirFromVector(res.vx, res.vy, this.dirs, this.facing);
      this._playWalk();
    } else {
      this._playIdle();
    }
    this.setDepth(this.y);                 // Y-정렬 깊이(오브젝트 앞뒤 가림)
    return res;
  }

  _playWalk() {
    const key = `${this.animKey}-walk-${this.facing}`;
    if (this.anims.currentAnim?.key !== key) this.play(key, true);
  }
  _playIdle() {
    const key = `${this.animKey}-idle-${this.facing}`;
    if (this.anims.currentAnim?.key !== key) this.play(key, true);
  }
}
