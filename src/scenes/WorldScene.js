// 월드 씬: 맵·플레이어·카메라·오브젝트·시스템을 조립하고, UI 경계 이벤트를 중계한다.
// 챕터 전환, 회상 진입/복귀, 추리 보드 열기, 상호작용 라우팅, 트리거 대사 디스패치를 담당한다.
// (계약: phase4_core_event-spec.md)
import { bus, EV } from '../systems/eventBus.js';
import { gameState } from '../systems/gameState.js';
import { createInput } from '../systems/movement.js';
import { setupCamera, fadeTransition } from '../systems/camera.js';
import { generateMapData, buildTilemap, computeReachable } from '../systems/tilemap.js';
import { InteractionManager } from '../systems/interaction.js';
import { spawnChapter } from '../systems/worldObjects.js';
import { enterFlashback, populateFlashback } from '../systems/flashback.js';
import { getPanelSet, panelImageKey } from '../systems/storyPanels.js';
import { DialogueDispatcher } from '../systems/dialogueDispatcher.js';
import { EvadeEvent } from '../systems/evade.js';
import { Player } from '../entities/Player.js';
import { Interactable } from '../entities/Interactable.js';
import { installDevTools } from '../systems/devTools.js';

const mapShort = (k) => (k || '').replace('map_', '');
const npcShort = (id) => (id || '').replace('char_', '');
const CLEARED_CHAPTER = { 2: 1, 3: 2, final: 3 }; // 개방된 챕터 → 방금 해결된 챕터 번호

export class WorldScene extends Phaser.Scene {
  constructor() { super('World'); }

  create() {
    this.config = this.registry.get('config');
    this.tileSize = this.config.tileSize || 48;
    this.animSpecs = this.registry.get('animSpecs') || {};
    this.tilesets = this.registry.get('tilesets') || {};
    this.input.keyboard.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE']);
    this.inputCtl = createInput(this);
    this.interaction = new InteractionManager(this, this.config.interactRange || 40);
    this.objectGroup = this.add.group();
    this.colliders = [];
    this._locks = new Set();   // 명명 잠금 홀드(dialogue/board/modal/transition) — 하나라도 있으면 이동 잠금
    this._locked = false;
    this._uiPresent = false;
    this._pendingChapter = null;
    this.evade = null;
    this.flashbackReturn = null;

    // 트리거 구동 대사 디스패처(코어 소유). dialogues.json trigger 평가 → 대사/패널 재생.
    this.dispatcher = new DialogueDispatcher(this, gameState);
    // 대상 최초 근접 → approach_* 트리거 대사.
    this.interaction.onApproach = (it) => { if (it.type === 'npc') this.dispatcher.fireFlag('approach_' + npcShort(it.id)); };

    this.scene.launch('UI');            // UI 오버레이(ui-coder 영역).
    this._wireEvents();
    this.boardKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
    this.input.keyboard.on('keydown-F', () => this.scale.toggleFullscreen()); // 전체화면 토글(피드백 ⑥)

    const start = gameState.data.npcs.npcs.find(n => n.playable);
    this.loadMap('map_orphanage', 1, start.spawn);
    installDevTools(this);              // ?dev=1 일 때만 활성.
  }

  // ── 이벤트 배선 ─────────────────────────────────────────
  _wireEvents() {
    bus.on(EV.UI_READY, () => { this._uiPresent = true; gameState.syncToUI(); this._beginIntro(); });
    bus.on(EV.UI_MODAL, ({ open }) => (open ? this._hold('modal') : this._release('modal')));
    bus.on(EV.CLUE_REVEAL_REQUEST, ({ clueId }) => gameState.discoverClue(clueId));
    bus.on(EV.BOARD_LINK_ATTEMPT, ({ chapter, clueA, clueB }) => gameState.attemptLink(chapter, clueA, clueB));
    bus.on(EV.BOARD_CONCL_ATTEMPT, ({ deductionId, optionIndex }) => gameState.attemptDeduction(deductionId, optionIndex));
    bus.on(EV.BOARD_CLOSED, () => { this._release('board'); this._flushPendingChapter(); });
    bus.on(EV.HINT_REQUEST, ({ context, chapter }) => gameState.requestHint(context, chapter ?? gameState.currentChapter));
    // 트리거 대사 배선: 단서 획득 → 반응 독백, 링크 확정 → 해설.
    // 반응 대사 플래그: got_clue_<clue_ 접두 제거된 id> (예: clue_torn_diary → got_clue_torn_diary).
    bus.on(EV.CLUE_FOUND, ({ clueId, isNew }) => { if (isNew) this.dispatcher.fireFlag('got_clue_' + clueId.replace(/^clue_/, '')); });
    bus.on(EV.BOARD_LINK_RESULT, ({ valid, linkId }) => { if (valid && linkId) this.dispatcher.fireFlag(linkId); });
    // 결론 정답 → 개방 챕터 기록(보드 종료 후 결말 재생·전환).
    bus.on(EV.BOARD_CONCL_RESULT, (r) => { if (r.correct && r.unlockedChapter != null) this._pendingChapter = r.unlockedChapter; });
    // 참고: DIALOGUE_CLOSED / STORY_PANELS_CLOSED 는 디스패처가 소유(재생 진행). 여기서 다루지 않는다.
  }

  // 인트로: 프롤로그 이미지+텍스트 패널 → 종료 후 목표 안내 + 도착 트리거.
  _beginIntro() {
    if (gameState.hasFlag('game_start')) return;
    gameState.setFlag('game_start');
    const onDone = () => {
      bus.emit(EV.OBJECTIVE, { text: '잿골 고아원을 조사하라. 단서를 모아 추리 보드(B)에서 연결하라.' });
      this._fireArrival('map_orphanage');
    };
    const set = getPanelSet(gameState.data, 'intro');
    if (!set || !set.panels || !set.panels.length || (!this._uiPresent && !window.__dev)) { onDone(); return; }
    const panels = set.panels.map(p => ({ image: panelImageKey(p.image), text: p.text, caption: p.caption ?? p.title ?? null }));
    this.dispatcher.playPanels(panels, onDone);
  }

  // 챕터 도착 트리거: enter_<지역> + <지역>_hint (도착 내레이션·안내).
  _fireArrival(mapKey) {
    const s = mapShort(mapKey);
    this.dispatcher.fireFlag('enter_' + s);
    this.dispatcher.fireFlag(s + '_hint');
  }

  // ── 맵 로드(챕터/회상 공용) ──────────────────────────────
  loadMap(mapKey, chapter, spawnTile, flashbackSpec = null) {
    if (!flashbackSpec) { this._mapKey = mapKey; this._chapter = chapter; }
    this.colliders.forEach(c => c.destroy()); this.colliders = [];
    this.interaction.clear();
    this.objectGroup.clear(true, true);
    if (this.layer) this.layer.destroy();
    if (this.map) this.map.destroy();

    const dims = flashbackSpec
      ? { w: flashbackSpec.w, h: flashbackSpec.h, ch: 0 }
      : mapDims(this.config, mapKey, chapter);
    const tsKey = flashbackSpec ? mapForChapter(flashbackSpec.chapter, this.config) : mapKey;
    const descriptor = this.tilesets[tsKey] || this.tilesets._default;
    this.collisionSet = descriptor.collisionSet;
    this.mapData = generateMapData(descriptor, dims.w, dims.h, dims.ch, spawnTile);
    this.reachable = computeReachable(this.mapData, this.collisionSet, spawnTile.x, spawnTile.y);
    const built = buildTilemap(this, this.mapData, this.tileSize, descriptor);
    this.layer = built.layer; this.map = built.map;
    this.layer.setDepth(-10);

    const px = spawnTile.x * this.tileSize + this.tileSize / 2;
    const py = spawnTile.y * this.tileSize + this.tileSize / 2;
    if (!this.player) {
      const key = gameState.data.npcs.npcs.find(n => n.playable).spriteId;
      const spec = this.animSpecs[key] || { directions: ['down', 'left', 'right', 'up'] };
      this.player = new Player(this, px, py, key, spec,
        { speed: this.config.moveSpeed, rampTime: this.config.moveAccelRamp });
    } else {
      this.player.setPosition(px, py); this.player.body.setVelocity(0, 0);
    }
    this.colliders.push(this.physics.add.collider(this.player, this.layer));
    setupCamera(this, this.player, this.config, built.worldWidth, built.worldHeight);

    if (flashbackSpec) this._populateFlashbackMap(flashbackSpec);
    else spawnChapter(mapKey, chapter, this.mapData, this.tileSize, gameState.data, gameState,
      this._factory(), this._handlers(), this.collisionSet, this.reachable);
  }

  // ── 스폰 팩토리 ──────────────────────────────────────────
  _factory() {
    return {
      makeNpc: (npc, x, y, handler) => {
        const it = new Interactable(this, x, y, npc.spriteId, {
          id: npc.id, type: 'npc', data: npc, onInteract: (o) => handler(npc, o),
        });
        it.play(`${npc.spriteId}-idle-down`, true);
        this._addInteractable(it);
      },
      makeObject: (x, y, def) => {
        const it = new Interactable(this, x, y, def.markerKey || 'marker_clue_object', def);
        this._addInteractable(it);
        return it;
      },
    };
  }
  _addInteractable(it) { this.objectGroup.add(it); this.interaction.register(it); }

  // ── 상호작용 핸들러 ──────────────────────────────────────
  _handlers() {
    return {
      npc: (npc) => {
        const short = npcShort(npc.id);
        gameState.setFlag('met_' + short);
        const n = this.dispatcher.fireFlag('met_' + short);
        if (n === 0 && npc.dialogueId) this.dispatcher.playChain(npc.dialogueId); // met_ 노드 없는 인물 폴백
      },
      object: (clue, obj) => {
        const objShort = (obj.id || '').replace('obj_', '');
        if (objShort) this.dispatcher.fireFlag('inspect_' + objShort);  // 조사 내레이션
        const isNew = gameState.discoverClue(clue.id);                  // 단서 획득 → got_clue 반응(CLUE_FOUND 배선)
        if (isNew) obj.consume();
      },
      echo: (fb) => {
        const ready = fb.requiredClues.every(id => gameState.discovered.has(id));
        if (!ready) { bus.emit(EV.TOAST, { text: '아직 떠오르지 않는다. 더 많은 단서가 필요하다.', kind: 'info' }); return; }
        enterFlashback(this, fb);
      },
      item: (item, obj) => { gameState.addItem(item.id); obj.consume(); },
    };
  }

  // ── 회상 진입/복귀 ───────────────────────────────────────
  enterFlashback(fbDef, spec) {
    this.flashbackReturn = { mapKey: this._mapKey, chapter: this._chapter, x: this.player.x, y: this.player.y, fbDef };
    this._activeFb = fbDef; this._activeFbSpec = spec;
    this._hold('transition');
    fadeTransition(this, () => {
      this.loadMap('flashback', spec.chapter, { x: Math.floor(spec.w / 2), y: spec.h - 2 }, spec);
      this._release('transition');
      // 회상 진입 트리거: 감응 내레이션 + 회상 인물/오브젝트 대사.
      this.dispatcher.fireFlag('echo_ready_ch' + spec.chapter);
      this.dispatcher.fireFlag(fbDef.id);
    });
  }

  _populateFlashbackMap(spec) {
    const fbDef = this._activeFb;
    const api = {
      makeObject: (x, y, def) => this._factory().makeObject(x, y, def),
      makeExit: (x, y) => {
        this._fbExit = this._factory().makeObject(x, y, {
          id: 'fb_exit', type: 'door', markerKey: 'marker_exit', verb: '나가기',
          onInteract: () => this._tryExitFlashback(),
        });
      },
      checkFlashbackExit: () => {},
    };
    populateFlashback(fbDef, spec, this.tileSize, api, gameState);
    if (spec.evade) {
      const cx = spec.w / 2 * this.tileSize, ts = this.tileSize;
      const evadeTime = this.config.evade?.timeLimitCh3Sec ?? spec.evade.timeLimit ?? 45; // 데이터 주도
      this.evade = new EvadeEvent(this, this.player, {
        eventId: spec.evade.eventId, timeLimit: evadeTime,
        checkpoint: { x: this.player.x, y: this.player.y },
        goal: { x: cx, y: 2.5 * ts, r: 28 },
        patrollers: spec.evade.patrollers.map((p, i) => ({ ...p, x: cx + (i ? 80 : -80), y: 6 * ts })),
        onSuccess: () => bus.emit(EV.TOAST, { text: '잔영을 벗어났다.', kind: 'success' }),
      });
    }
  }

  _tryExitFlashback() {
    const fbDef = this._activeFb;
    const done = fbDef.grantsClues.every(id => gameState.discovered.has(id));
    if (!done) { bus.emit(EV.TOAST, { text: '이곳에서 더 떠올릴 것이 남았다.', kind: 'info' }); return; }
    if (this.evade && this.evade.active) { bus.emit(EV.TOAST, { text: '먼저 잔영을 벗어나야 한다.', kind: 'warn' }); return; }
    const ret = this.flashbackReturn;
    this._hold('transition');
    fadeTransition(this, () => {
      if (this.evade) { this.evade.destroy(); this.evade = null; }
      this._activeFb = null; this._activeFbSpec = null;
      this.loadMap(ret.mapKey, ret.chapter, { x: 0, y: 0 });
      this.player.setPosition(ret.x, ret.y);
      this._release('transition');
      this.dispatcher.fireFlag('exit_flashback_ch' + ret.chapter); // 복귀 내레이션(ch1/ch3)
    });
  }

  // ── 추리 보드 ────────────────────────────────────────────
  // 결론(deduction)은 보드(ui-coder)가 소유한다. 보드 개방 대사(*_board→deduce_prompt 선택지)는
  // 보드 결론 UI와 이중이 되므로 발화하지 않는다. 결론 정답 시 결말 체인(deduce_correct→에필로그)만 재생.
  openBoard(chapter) {
    bus.emit(EV.BOARD_OPEN, { chapter, payload: gameState.boardPayload(chapter) });
    this._hold('board');
  }

  // ── 챕터 전환 / 결말 ─────────────────────────────────────
  _flushPendingChapter() {
    if (this._pendingChapter == null) return;
    const ch = this._pendingChapter; this._pendingChapter = null;
    if (ch === 'ending') { this.dispatcher.playChain('dlg_ending_01', () => this._finishEnding()); return; }
    const n = CLEARED_CHAPTER[ch];
    if (n) this.dispatcher.fireFlag('ch' + n + '_deduced');          // 해결 후 NPC 반응(있으면)
    if (n && gameState.data && this.dispatcher.byId['dlg_ch' + n + '_deduce_correct']) {
      this.dispatcher.playChain('dlg_ch' + n + '_deduce_correct', () => this._transitionTo(ch)); // 깨달음 독백 + 에필로그 CG
    } else {
      this._transitionTo(ch);
    }
  }

  _transitionTo(ch) {
    const map = mapForChapter(ch, this.config);
    fadeTransition(this, () => {
      this.loadMap(map, ch, defaultSpawn(this.config, map));
      gameState.currentChapter = ch;
      bus.emit(EV.CHAPTER_CHANGED, { chapter: ch, map });
      if (ch === 'final') bus.emit(EV.OBJECTIVE, { text: '흩어진 세 진실을 하나의 보드(B)에서 연결하라.' });
      else this._fireArrival(map);
    });
  }

  _finishEnding() {
    bus.emit(EV.OBJECTIVE, { text: '엔딩 — 진실이 밝혀졌다.' });
    this.cameras.main.fadeOut(2000, 10, 10, 20);
  }

  // ── 루프 ─────────────────────────────────────────────────
  update(time, delta) {
    const dt = delta / 1000;
    if (this.player) this.player.update(this.inputCtl, dt, this._locked);
    if (!this._locked) this.interaction.update(this.player, this.inputCtl);
    if (this.evade && this.evade.active) this.evade.update(dt);
    if (Phaser.Input.Keyboard.JustDown(this.boardKey) && !this._locked && !this._activeFb) {
      this.openBoard(gameState.currentChapter);
    }
  }

  // 명명 잠금 홀드: 하나라도 있으면 이동 잠금. (dialogue/board/modal/transition 이 독립적으로 소유)
  _hold(name) { this._locks.add(name); this._applyLock(); }
  _release(name) { this._locks.delete(name); this._applyLock(); }
  _applyLock() { this._locked = this._locks.size > 0; if (this._locked && this.player) this.player.body.setVelocity(0, 0); }
}

function mapDims(config, mapKey, chapter) {
  const m = config.maps?.[mapKey];
  return { w: m?.widthTiles || 30, h: m?.heightTiles || 24, ch: chapter };
}
function mapForChapter(chapter, config) {
  const cm = config?.chapterMaps;
  if (cm && typeof cm[String(chapter)] === 'string') return cm[String(chapter)];
  for (const [key, m] of Object.entries(config?.maps || {})) if (m.chapter === chapter) return key;
  return 'map_academy';
}
function defaultSpawn(config, mapKey) {
  const m = config.maps?.[mapKey];
  return { x: Math.floor((m?.widthTiles || 30) / 2), y: Math.floor((m?.heightTiles || 24) / 2) };
}
