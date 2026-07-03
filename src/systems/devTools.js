// 개발/QA 보조. URL 에 ?dev=1 일 때만 활성. UI 코더의 대사창·보드가 아직 없어도
// 코어의 전체 진행 루프(단서→링크→결론→챕터개방→회상→회피)를 키보드로 검증할 수 있게 한다.
// 실제 게임 UI 가 아니며, 상태 판정은 전부 gameState(코어) 를 그대로 호출한다.
import { bus, EV } from './eventBus.js';
import { gameState } from './gameState.js';

export function installDevTools(scene) {
  if (!window.location.search.includes('dev=1')) return;
  window.__dev = true;
  window.__world = scene;      // QA/스모크 테스트용 핸들(dev 전용)
  window.__gs = gameState;
  console.log('%c[DEV] core dev tools on — C:단서, L:링크, K:결론, N:챕터자동완료, 화살표/WASD 이동, B:보드', 'color:#8bd0ff');

  // 버스 이벤트 로깅(QA 가 경계 이벤트 흐름을 콘솔에서 관찰).
  Object.values(EV).forEach(name => bus.on(name, (p) => console.log(`[bus] ${name}`, p ?? '')));
  // 대사/스토리패널은 실제 UI(DialogueBox/StoryPanel)가 렌더·진행하고 디스패처가 흐름을 소유하므로
  // dev 에서 자동 close 하지 않는다(실제 동작대로 클릭/키로 진행).

  const k = scene.input.keyboard;
  const chapterClues = () => gameState.data.clues.clues.filter(c => String(c.chapter) === String(gameState.currentChapter));
  const chapterLinks = () => gameState.linkList.filter(l => String(l.chapter) === String(gameState.currentChapter) && l.valid);
  const chapterDeds = () => gameState.data.connections.deductions.filter(d => String(d.chapter) === String(gameState.currentChapter));

  k.on('keydown-C', () => {
    const next = chapterClues().find(c => !gameState.discovered.has(c.id));
    if (next) gameState.discoverClue(next.id); else console.log('[DEV] 이 챕터 단서 모두 발견됨');
  });
  k.on('keydown-L', () => {
    chapterClues().forEach(c => gameState.discovered.add(c.id));
    chapterLinks().forEach(l => gameState.attemptLink(gameState.currentChapter, l.clue_a, l.clue_b));
  });
  k.on('keydown-K', () => {
    chapterDeds().forEach(d => gameState.attemptDeduction(d.id, d.answerIndex));
  });
  k.on('keydown-N', () => {
    chapterClues().forEach(c => gameState.discoverClue(c.id));
    chapterLinks().forEach(l => gameState.attemptLink(gameState.currentChapter, l.clue_a, l.clue_b));
    chapterDeds().forEach(d => gameState.attemptDeduction(d.id, d.answerIndex));
    bus.emit(EV.BOARD_CLOSED, {});   // 보류 중인 챕터 전환 플러시
  });
}
