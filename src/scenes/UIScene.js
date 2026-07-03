// UI 오버레이 씬 — 월드 씬 위에 launch 되어 대사창·단서 저널·추리 보드·HUD·연출을 담당.
// 판정·상태는 코어(gameState). UI 는 표시·입력만. 계약: _workspace/phase4_core_event-spec.md
import { bus, EV } from '../systems/eventBus.js';
import { PAL, CSS, FONT } from '../ui/theme.js';
import { DialogueBox } from '../ui/DialogueBox.js';
import { Journal } from '../ui/Journal.js';
import { DeductionBoard } from '../ui/DeductionBoard.js';
import { Hud } from '../ui/Hud.js';
import { Toast } from '../ui/Toast.js';
import { MemoryTransition } from '../ui/MemoryTransition.js';
import { CluePopup } from '../ui/CluePopup.js';
import { StoryPanel } from '../ui/StoryPanel.js';

const PORTRAIT_CHARS = ['anika', 'corvinox', 'isolde', 'kael', 'lyren', 'miriam', 'ornelia', 'silas'];

export class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  preload() {
    // dialogues.json 은 UI 가 직접 소비하는 유일한 데이터(§5).
    this.load.json('dialogues', 'data/dialogues.json');
    // 초상(감정 변주 에셋 부재 → 캐릭터 단일 초상). UI 도메인이므로 여기서 로드.
    for (const c of PORTRAIT_CHARS) {
      this.load.image(`char_${c}_portrait`, `assets/portraits/char_${c}_portrait.png`);
    }
    this.load.on('loaderror', (file) => {
      console.warn(`[UI] 에셋 로드 실패(플레이스홀더로 진행): ${file.key}`);
    });
  }

  create() {
    const config = this.registry.get('config') || {};
    const raw = this.cache.json.get('dialogues') || { dialogues: [] };
    this.dialoguesById = {};
    for (const node of raw.dialogues || []) this.dialoguesById[node.id] = node;

    this.discovered = new Set();
    // 반응 대사 트리거 평가는 코어 단일 디스패처 소유. UI 는 코어가 보낸 dialogue:start 를
    // 렌더만 하되, 단서 팝업 표시 중 도착한 대사는 팝업 종료 후 열도록 순차 처리한다.
    this._pendingDialogues = [];

    // ── UI 모듈 ──
    this.hud = new Hud(this);
    this.toast = new Toast(this);
    this.memory = new MemoryTransition(this);
    this.journal = new Journal(this);
    this.board = new DeductionBoard(this);
    this.cluePopup = new CluePopup(this);
    this.storyPanel = new StoryPanel(this);

    // 단서 팝업이 모두 닫히면 대기 중이던(팝업 중 도착한) 대사를 순차로 연다.
    this.cluePopup.onEmpty = () => this._drainPendingDialogues();
    this.dialogue = new DialogueBox(this, {
      dialoguesById: this.dialoguesById,
      getDiscovered: () => this.discovered,
      cps: config.typewriterCps || 30,
      hasPortrait: (key) => this.textures.exists(key),
    });

    this._buildInteractPrompt();
    this._buildEvadeTimer();
    this._wireBus();
    this._wireInput();

    // 씬 종료 시 전역 버스 리스너 정리(재시작 대비).
    this.events.once('shutdown', () => this._teardown());

    // 디버그: ?dev=1 일 때 게임 인스턴스 노출(QA 검증용).
    if (typeof window !== 'undefined' && window.location.search.includes('dev=1')) {
      window.__game = this.sys.game;
      window.__ui = this;
    }

    // 준비 완료 통지 → 코어가 state:sync 후 인트로 시작.
    bus.emit(EV.UI_READY, {});
  }

  // ── 코어 → UI ──
  _wireBus() {
    this._handlers = {
      [EV.STATE_SYNC]: (s) => {
        this.hud.setInsight(s.insight || 0);
        this.hud.setTokens(s.tokens || 0);
        this.board.setTokens(s.tokens || 0);
        if (s.currentChapter != null) this.hud.setChapter(s.currentChapter);
        this.discovered = new Set(s.discoveredClues || []);
      },
      [EV.DIALOGUE_START]: ({ dialogueId }) => {
        // 단서 팝업 표시 중이면 팝업 종료 후 열도록 대기(동시 표출 방지). 아니면 즉시.
        if (this.cluePopup.showing) { this._pendingDialogues.push(dialogueId); return; }
        this.hud.hideObjective(true);
        this.dialogue.open(dialogueId);
      },
      [EV.DIALOGUE_CLOSED]: () => {
        this.hud.hideObjective(false);
        this._drainPendingDialogues();
      },
      [EV.CLUE_FOUND]: ({ clue, isNew }) => {
        if (clue) { this.discovered.add(clue.id); this.journal.addClue(clue); }
        if (isNew && clue) this.cluePopup.show(clue);   // 획득 순간 이름+상세 팝업.
      },
      [EV.INSIGHT_CHANGED]: ({ total }) => this.hud.setInsight(total),
      [EV.TIER_UNLOCKED]: ({ feel, toolId }) => this.toast.show(`관찰 도구 해금 — ${feel || toolId}`, 'success'),
      [EV.HINT_CHANGED]: ({ tokens }) => { this.hud.setTokens(tokens); this.board.setTokens(tokens); },
      [EV.ITEM_ACQUIRED]: ({ item }) => { if (item) this.toast.show(`입수 — ${item.name}`, 'info'); },
      [EV.BOARD_OPEN]: ({ chapter, payload }) => {
        (payload?.clues || []).forEach(c => this.journal.addClue(c));
        this.toast.baseY = 30;   // 보드 위(코르크판 여백)로 토스트 이동 — 카드 겹침 완화.
        this.board.show(chapter, payload);
      },
      [EV.BOARD_CLOSED]: () => { this.toast.baseY = 58; },
      [EV.BOARD_LINK_RESULT]: (r) => this.board.onLinkResult(r),
      [EV.BOARD_CONCL_RESULT]: (r) => this.board.onConclusionResult(r),
      // 힌트 결과(코어가 EV.HINT_RESULT 상수 추가 전이어도 문자열로 구독).
      [EV.HINT_RESULT || 'hint:result']: (r) => this.board.onHintResult(r),
      [EV.MEMORY_PLAY]: () => this.memory.play(),
      [EV.STORY_PANELS || 'story:panels']: (p) => this.storyPanel.show(p?.sequenceId ?? p?.id ?? p?.setId ?? null, p?.panels || p?.pages || []),
      [EV.CHAPTER_CHANGED]: ({ chapter }) => {
        this.hud.setChapter(chapter);
        this.toast.show(this._chapterTitle(chapter), 'info');
      },
      [EV.EVADE_START]: ({ timeLimit }) => this._evadeStart(timeLimit),
      [EV.EVADE_TICK]: ({ remaining }) => this._evadeTick(remaining),
      [EV.EVADE_END]: ({ success }) => this._evadeEnd(success),
      [EV.INTERACT_PROMPT]: (p) => this._setPrompt(p),
      [EV.OBJECTIVE]: ({ text }) => this.hud.setObjective(text),
      [EV.TOAST]: ({ text, kind }) => this.toast.show(text, kind),
    };
    for (const [ev, fn] of Object.entries(this._handlers)) bus.on(ev, fn);
  }

  _teardown() {
    if (!this._handlers) return;
    for (const [ev, fn] of Object.entries(this._handlers)) bus.off(ev, fn);
  }

  // 팝업 중 도착해 대기시킨 코어 대사를 순차로 연다(팝업/대사 닫힘 시점에 호출).
  _drainPendingDialogues() {
    if (!this._pendingDialogues.length) return;
    if (this.cluePopup.showing || this.dialogue.isOpen()) return;
    const id = this._pendingDialogues.shift();
    this.hud.hideObjective(true);
    this.dialogue.open(id);
  }

  // ── 입력 라우팅 ──
  _wireInput() {
    const kb = this.input.keyboard;
    const advance = () => {
      if (this.storyPanel.isOpen()) return this.storyPanel.advance();
      if (this.dialogue.isOpen()) return this.dialogue.advance();
    };
    kb.on('keydown-SPACE', advance);
    kb.on('keydown-E', advance);
    kb.on('keydown-ENTER', () => {
      if (this.storyPanel.isOpen()) return this.storyPanel.advance();
      if (this.dialogue.isOpen()) return this.dialogue.advance();
      this.cluePopup.handleKey();   // 단서 팝업은 Enter/클릭으로 닫기(월드 이동 키와 비충돌).
    });

    kb.on('keydown-UP', () => {
      if (this.dialogue.isOpen()) this.dialogue.moveSelection(-1);
      else if (this.journal.open) this.journal.move(-1);
    });
    kb.on('keydown-DOWN', () => {
      if (this.dialogue.isOpen()) this.dialogue.moveSelection(1);
      else if (this.journal.open) this.journal.move(1);
    });

    kb.on('keydown-J', () => {
      // 대사·보드 중에는 저널 토글 금지.
      if (this.dialogue.isOpen() || this.board.open) return;
      this.journal.toggle();
    });
    kb.on('keydown-ESC', () => {
      if (this.board.open) this.board.close();
      else if (this.journal.open) this.journal.close();
    });
    kb.on('keydown-H', () => { if (this.board.open) this.board.requestHint(); });
  }

  // ── 상호작용 프롬프트 ──
  _buildInteractPrompt() {
    const c = this.add.container(400, 470).setDepth(280).setVisible(false);
    const g = this.add.graphics();
    g.fillStyle(PAL.deepGrey, 0.82); g.fillRoundedRect(-90, -18, 180, 36, 8);
    g.lineStyle(1, PAL.fadedGold, 0.6); g.strokeRoundedRect(-90, -18, 180, 36, 8);
    this.promptTxt = this.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '16px', color: CSS.highlight,
    }).setOrigin(0.5);
    c.add([g, this.promptTxt]);
    this.promptC = c;
  }

  _setPrompt({ visible, verb }) {
    if (!visible) { this.promptC.setVisible(false); return; }
    this.promptTxt.setText(`[E] ${verb || '조사'}`);
    this.promptC.setVisible(true);
  }

  // ── 회피 타이머 ──
  _buildEvadeTimer() {
    const c = this.add.container(400, 56).setDepth(320).setVisible(false);
    this.evadeBarBg = this.add.graphics();
    this.evadeBarFill = this.add.graphics();
    this.evadeTxt = this.add.text(0, -22, '', {
      fontFamily: FONT, fontSize: '15px', color: CSS.threadRed, fontStyle: 'bold',
    }).setOrigin(0.5);
    c.add([this.evadeBarBg, this.evadeBarFill, this.evadeTxt]);
    this.evadeC = c;
  }

  _evadeStart(timeLimit) {
    this._evadeLimit = timeLimit || 0;
    this.evadeC.setVisible(true);
    this.evadeTxt.setText(timeLimit ? '추적을 벗어나라' : '탈출하라');
    this.evadeBarBg.clear();
    if (timeLimit) {
      this.evadeBarBg.fillStyle(PAL.deepGrey, 0.7); this.evadeBarBg.fillRoundedRect(-150, -8, 300, 16, 6);
    }
    this._evadeTick = this._evadeLimit;
    this._drawEvadeBar(1);
  }

  _evadeTick(remaining) {
    if (!this._evadeLimit) return;
    this._drawEvadeBar(Math.max(0, remaining / this._evadeLimit));
    this.evadeTxt.setText(`추적을 벗어나라 — ${Math.ceil(remaining)}`);
  }

  _drawEvadeBar(frac) {
    this.evadeBarFill.clear();
    if (!this._evadeLimit) return;
    const w = 300 * frac;
    this.evadeBarFill.fillStyle(PAL.threadRed, 0.9);
    this.evadeBarFill.fillRoundedRect(-150, -8, w, 16, 6);
  }

  _evadeEnd(success) {
    this.evadeC.setVisible(false);
    this.toast.show(success ? '추적을 벗어났다.' : '들켰다 — 다시.', success ? 'success' : 'warn');
  }

  _chapterTitle(ch) {
    return { 1: '제1장 · 잿골 고아원', 2: '제2장 · 미스트미어 마법원',
      3: '제3장 · 잿빛 첨탑', final: '종장 · 흩어진 진실', ending: '엔딩' }[ch] || `제${ch}장`;
  }

  update(time, delta) {
    this.dialogue.update(delta);
  }
}
