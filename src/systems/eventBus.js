// 코어 ↔ UI 경계 이벤트 버스 (단일 소스).
// 계약 문서: _workspace/phase4_core_event-spec.md
// 코어(scenes/systems/entities)와 UI 레이어(ui-coder)가 이 싱글턴을 공유한다.
// Phaser Scene 이벤트 대신 전역 EventEmitter 를 쓰는 이유: 씬 간(월드↔UI 오버레이↔보드)
// 결합을 끊고, 씬 생성·파괴 순서와 무관하게 계약을 유지하기 위함.

export const bus = new Phaser.Events.EventEmitter();

// 이벤트 이름 상수. 문자열 오타로 인한 계약 파손을 막기 위해 양측이 이 상수를 import 한다.
export const EV = {
  // ── 코어 → UI ────────────────────────────────────────────────
  DIALOGUE_START:      'dialogue:start',       // { dialogueId }
  CLUE_FOUND:          'clue:found',           // { clueId, clue, isNew }
  INSIGHT_CHANGED:     'insight:changed',      // { total, delta, reason }
  TIER_UNLOCKED:       'tier:unlocked',        // { tier, toolId, feel }
  HINT_CHANGED:        'hint:changed',         // { tokens }
  HINT_RESULT:         'hint:result',          // { ok, context, chapter, pair?/reveals?/eliminateOptionIndex?/message? }
  ITEM_ACQUIRED:       'item:acquired',        // { itemId, item }
  BOARD_OPEN:          'board:open',           // { chapter, payload }
  BOARD_LINK_RESULT:   'board:link:result',    // { clueA, clueB, valid, linkId, reveals }
  BOARD_CONCL_RESULT:  'board:conclusion:result', // { deductionId, correct, firstTry, insightAwarded, unlockedChapter }
  MEMORY_PLAY:         'memory:play',          // { flashbackId, isMandatory }
  STORY_PANELS:        'story:panels',         // { setId, panels:[{ image, text }] }  이미지+텍스트 패널 시퀀스 표시
  TITLE_START:         'title:start',          // {}  타이틀 "시작" → World 진입(코어 내부 신호)
  CHAPTER_CHANGED:     'chapter:changed',      // { chapter, map }
  EVADE_START:         'evade:start',          // { eventId, timeLimit }
  EVADE_TICK:          'evade:tick',           // { remaining }
  EVADE_END:           'evade:end',            // { eventId, success }
  INTERACT_PROMPT:     'interact:prompt',      // { visible, verb, targetId, targetType }
  OBJECTIVE:           'game:objective',       // { text }
  TOAST:               'toast',                // { text, kind }
  STATE_SYNC:          'state:sync',           // { insight, tokens, discoveredClues, unlockedChapters, currentChapter, inventory }

  // ── UI → 코어 ────────────────────────────────────────────────
  UI_READY:            'ui:ready',             // {}
  UI_MODAL:            'ui:modal',             // { open }  모달 열림/닫힘 → 코어가 플레이어 입력 잠금
  DIALOGUE_CLOSED:     'dialogue:closed',      // { dialogueId }
  CLUE_REVEAL_REQUEST: 'clue:reveal-request',  // { clueId }  대사 노드 reveals_clue 처리 요청
  BOARD_LINK_ATTEMPT:  'board:link:attempt',   // { chapter, clueA, clueB }
  BOARD_CONCL_ATTEMPT: 'board:conclusion:attempt', // { deductionId, optionIndex }
  BOARD_CLOSED:        'board:closed',         // {}
  STORY_PANELS_CLOSED: 'story:panels:closed',  // { setId }  패널 시퀀스 종료 → 코어가 흐름 재개
  HINT_REQUEST:        'hint:request',         // { context, chapter }
};

// 디버그: window.__bus 로 콘솔에서 이벤트 감청 가능 (?dev=1 일 때만 노출).
if (typeof window !== 'undefined' && window.location.search.includes('dev=1')) {
  window.__bus = bus;
}
