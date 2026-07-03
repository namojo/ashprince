// 트리거 구동 대사 디스패처 (블로커 B-1). dialogues.json 의 trigger.flag 를 게임 이벤트에 매칭해
// 해당 대사/패널 시퀀스를 재생한다. once·chapter 조건을 존중하고, 여러 트리거가 겹치면 큐로 직렬화한다.
//
// 재생 규약(핵심):
//  - UI(DialogueBox)는 DIALOGUE_START 로 받은 노드부터 next 체인을 스스로 따라 재생하고, panel 필드 노드를
//    만나면 렌더 없이 가드(종료)하며 DIALOGUE_CLOSED 를 발신한다(계약 §7).
//  - 따라서 대사+패널 혼합 체인(에필로그·엔딩)은 코어가 "패널 경계"에서 노드별로 구동:
//    대사 세그먼트 → DIALOGUE_START(UI가 다음 패널 직전까지 재생) → 닫힘 → 코어가 그 패널 노드부터 재개.
//    연속 패널 노드는 STORY_PANELS 로 배치 표시(코어 소유). 패널 image 는 cg_id 텍스처 키로 파생.
import { bus, EV } from './eventBus.js';
import { panelImageKey } from './storyPanels.js';

export class DialogueDispatcher {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gs = gameState;
    this.byId = {};
    this.flagIndex = {};       // flag -> [nodeId] (데이터 순서)
    this.fired = new Set();    // once 트리거 발화 기록
    this.queue = [];
    this.busy = false;
    this._resume = null;       // 다음 close 이벤트 시 실행할 연속 함수

    const dlg = gameState.data.dialogues;
    for (const n of (dlg && dlg.dialogues) || []) {
      this.byId[n.id] = n;
      const f = n.trigger && n.trigger.flag;
      if (f) (this.flagIndex[f] = this.flagIndex[f] || []).push(n.id);
    }
    bus.on(EV.DIALOGUE_CLOSED, () => this._advance());
    bus.on(EV.STORY_PANELS_CLOSED, () => this._advance());
  }

  // 게임 이벤트 플래그 발생 → 매칭 노드(once/chapter 존중) 큐잉. 반환: 큐잉된 개수.
  fireFlag(flag) {
    let n = 0;
    for (const id of this.flagIndex[flag] || []) {
      const t = this.byId[id].trigger;
      if (t.once && this.fired.has(id)) continue;
      if (t.chapter != null && String(t.chapter) !== String(this.gs.currentChapter)) continue;
      if (t.once) this.fired.add(id);
      this.queue.push({ kind: 'chain', head: id });
      n++;
    }
    this.gs.setFlag(flag);
    if (n) this._pump();
    return n;
  }

  // 대사 체인 직접 재생(결론·엔딩). onDone 은 체인 종료 시 1회.
  playChain(head, onDone) { this.queue.push({ kind: 'chain', head, onDone }); this._pump(); }
  // 패널 시퀀스 직접 재생(인트로 등). panels: [{image(키|null), text, caption?}]
  playPanels(panels, onDone) { this.queue.push({ kind: 'panels', panels, onDone }); this._pump(); }

  _pump() {
    if (this.busy) return;
    const item = this.queue.shift();
    if (!item) { this.scene._release('dialogue'); return; }
    this.busy = true;
    this._current = item;
    this.scene._hold('dialogue');
    if (item.kind === 'panels') {
      this._resume = () => this._finishItem();
      this._emitPanels(item.panels);
    } else {
      this._walk(item.head);
    }
  }

  _walk(nodeId) {
    const node = nodeId && this.byId[nodeId];
    if (!node) return this._finishItem();
    if (node.panel) {
      // 연속 패널 노드 배치 → 한 번의 STORY_PANELS.
      const panels = []; let cur = node;
      while (cur && cur.panel) {
        panels.push({ image: panelImageKey(cur.panel), text: cur.text || '', caption: cur.title || null });
        cur = cur.next ? this.byId[cur.next] : null;
      }
      const after = cur ? cur.id : null;
      this._resume = () => this._walk(after);
      this._emitPanels(panels);
    } else {
      // 대사 세그먼트: UI가 nodeId부터 next 따라 재생하다 다음 패널 노드에서 가드 → 그 패널부터 재개.
      const resumeId = this._scanToPanel(nodeId);
      this._resume = () => this._walk(resumeId);
      bus.emit(EV.DIALOGUE_START, { dialogueId: nodeId });
    }
  }

  // nodeId 부터 next 를 따라가며 UI가 멈출 지점(첫 패널 노드 id)을 예측. 없으면 null(체인 끝).
  _scanToPanel(nodeId) {
    let cur = this.byId[nodeId];
    while (cur) {
      const nx = cur.next ? this.byId[cur.next] : null;
      if (!nx) return null;
      if (nx.panel) return nx.id;
      cur = nx;
    }
    return null;
  }

  _emitPanels(panels) {
    bus.emit(EV.STORY_PANELS, { setId: 'seq', sequenceId: 'seq', id: 'seq', panels });
  }

  _advance() {
    if (!this.busy) return;
    const r = this._resume; this._resume = null;
    if (r) r();
  }

  _finishItem() {
    const it = this._current; this._current = null; this.busy = false;
    if (it && it.onDone) it.onDone();
    this._pump();
  }
}
