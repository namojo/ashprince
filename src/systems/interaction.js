// 근접 상호작용 매니저. 매 프레임 플레이어와 가장 가까운(범위 내) 대상을 찾아
// interact:prompt 를 발신하고, 상호작용 키가 눌리면 그 대상의 handler 를 실행한다.
// 경계 준수: 코어는 프롬프트 표시 여부를 UI 에 이벤트로만 넘기고, 실제 프롬프트 UI 는 UI 코더 영역.
import { bus, EV } from './eventBus.js';

export class InteractionManager {
  constructor(scene, range) {
    this.scene = scene;
    this.range = range;
    this.targets = [];
    this.current = null;
    this.onApproach = null;       // (interactable) => void — 대상 최초 근접 시 1회(트리거 대사용)
    this._approached = new Set();  // 근접 발화 중복 방지(대상 id)
  }

  register(interactable) { this.targets.push(interactable); }
  clear() { this.targets = []; this.current = null; this._emitPrompt(null); }

  // 소비/파괴된 대상 정리.
  prune() { this.targets = this.targets.filter(t => t.active && !t._consumed); }

  update(player, input) {
    this.prune();
    let nearest = null, best = this.range;
    for (const t of this.targets) {
      const d = Phaser.Math.Distance.Between(player.x, player.y, t.x, t.y);
      if (d <= best) { best = d; nearest = t; }
    }
    if (nearest !== this.current) {
      if (this.current && this.current.setHighlight) this.current.setHighlight(false);
      if (nearest && nearest.setHighlight) nearest.setHighlight(true);
      this.current = nearest;
      this._emitPrompt(nearest);
      // 대상 최초 근접 → 트리거 대사(approach_*) 발화용 콜백(1회).
      if (nearest && this.onApproach && !this._approached.has(nearest.id)) {
        this._approached.add(nearest.id);
        this.onApproach(nearest);
      }
    }
    if (nearest && (Phaser.Input.Keyboard.JustDown(input.interact) ||
                    Phaser.Input.Keyboard.JustDown(input.interactAlt))) {
      nearest.interact(this.scene);
    }
  }

  _emitPrompt(target) {
    if (!target) { bus.emit(EV.INTERACT_PROMPT, { visible: false }); return; }
    bus.emit(EV.INTERACT_PROMPT, {
      visible: true, verb: target.verb, targetId: target.id, targetType: target.type,
    });
  }
}
