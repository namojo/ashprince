// 회피 이벤트(전투 대체물). HP·데미지·게임오버 없음. 실패 시 체크포인트 즉시 재시작.
// systems §6, balance §4(evade_time_ch3 45초). 순찰하는 "기억의 잔영"을 피해 목표 지점 도달.
import { bus, EV } from './eventBus.js';

export class EvadeEvent {
  // opts: { eventId, patrollers:[{x,y,axis,range,speed}], goal:{x,y,r}, timeLimit, checkpoint:{x,y}, onSuccess }
  constructor(scene, player, opts) {
    this.scene = scene;
    this.player = player;
    this.opts = opts;
    this.remaining = opts.timeLimit ?? 45;
    this.active = true;
    this.sprites = [];

    // 순찰자(잔영) 생성.
    this.patrollers = (opts.patrollers || []).map(p => {
      const s = scene.add.circle(p.x, p.y, 16, 0x7a3b3b, 0.85).setStrokeStyle(2, 0xff8888);
      s.setDepth(9999);
      this.sprites.push(s);
      return { s, base: { x: p.x, y: p.y }, axis: p.axis || 'x', range: p.range || 120, speed: p.speed || 90, t: Math.random() * 1000 };
    });
    // 목표 지점.
    this.goal = scene.add.circle(opts.goal.x, opts.goal.y, opts.goal.r || 24, 0x3b6b4d, 0.6)
      .setStrokeStyle(3, 0x88ffaa).setDepth(9998);
    this.sprites.push(this.goal);

    bus.emit(EV.EVADE_START, { eventId: opts.eventId, timeLimit: this.remaining });
    this._lastTick = Math.ceil(this.remaining);
  }

  update(dtSec) {
    if (!this.active) return;
    // 순찰 이동(왕복).
    for (const p of this.patrollers) {
      p.t += dtSec;
      const off = Math.sin(p.t * (p.speed / p.range)) * p.range;
      if (p.axis === 'x') p.s.x = p.base.x + off; else p.s.y = p.base.y + off;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, p.s.x, p.s.y) < 24) {
        return this._fail();
      }
    }
    // 목표 도달.
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.goal.x, this.goal.y) < (this.opts.goal.r || 24)) {
      return this._succeed();
    }
    // 타이머.
    if (this.opts.timeLimit) {
      this.remaining -= dtSec;
      const t = Math.ceil(this.remaining);
      if (t !== this._lastTick) { this._lastTick = t; bus.emit(EV.EVADE_TICK, { remaining: Math.max(0, t) }); }
      if (this.remaining <= 0) return this._fail();
    }
  }

  _fail() {
    // 체크포인트 재시작: 플레이어만 되돌리고 타이머 리셋(사망 없음).
    this.player.setPosition(this.opts.checkpoint.x, this.opts.checkpoint.y);
    this.player.body.setVelocity(0, 0);
    this.remaining = this.opts.timeLimit ?? 45;
    bus.emit(EV.EVADE_TICK, { remaining: Math.ceil(this.remaining) });
    bus.emit(EV.TOAST, { text: '기억의 잔영에 닿았다. 다시.', kind: 'warn' });
  }

  _succeed() {
    if (!this.active) return;
    this.active = false;
    bus.emit(EV.EVADE_END, { eventId: this.opts.eventId, success: true });
    this.destroy();
    this.opts.onSuccess && this.opts.onSuccess();
  }

  destroy() {
    this.active = false;
    this.sprites.forEach(s => s.destroy());
    this.sprites = [];
  }
}
