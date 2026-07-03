// 회상 시퀀스 명세와 진입 오케스트레이션. 회상 = 과거의 작은 코드 맵으로 진입해
// 부여 단서(grantsClues)를 수집하고 출구로 나오면 현재 맵으로 복귀하는 반(半)플레이 모드.
// systems §4. 챕터3 정상(summit) 회상에는 회피 이벤트가 클라이맥스로 배치된다.
import { bus, EV } from './eventBus.js';
import { EvadeEvent } from './evade.js';

// 회상 맵 명세(코드 맵). 실물 타일셋/레벨 디자인 전까지의 작은 과거 공간.
export const FLASHBACK_SPECS = {
  flashback_ch1_dorm:    { chapter: 1, w: 16, h: 12, title: '회상 · 잿골 고아원의 밤' },
  flashback_ch2_library: { chapter: 2, w: 18, h: 14, title: '회상 · 금서 구역' },
  flashback_ch2_hall:    { chapter: 2, w: 16, h: 12, title: '회상 · 자습실 구석' },
  flashback_ch3_summit:  { chapter: 3, w: 18, h: 16, title: '회상 · 잿빛 첨탑 꼭대기',
    evade: {
      // timeLimit 은 config.evade.timeLimitCh3Sec 에서 주입(WorldScene). 데이터만으로 45↔60↔30 교체 가능.
      eventId: 'evade_ch3_summit',
      patrollers: [{ axis: 'x', range: 140, speed: 110 }, { axis: 'y', range: 100, speed: 90 }],
    } },
};

// 회상 진입: 현재 상태를 저장하고 회상 맵을 로드한다. 실제 맵 빌드/복귀는 scene(WorldScene)가 수행.
export function enterFlashback(scene, fbDef) {
  const spec = FLASHBACK_SPECS[fbDef.id];
  if (!spec) { console.warn('[flashback] 미정의 회상:', fbDef.id); return; }
  bus.emit(EV.MEMORY_PLAY, { flashbackId: fbDef.id, isMandatory: fbDef.isMandatory });
  scene.enterFlashback(fbDef, spec);
}

// 회상 맵에 부여 단서 오브젝트 + 출구를 배치한다. WorldScene 가 loadMap 직후 호출.
// makeObject(px,py,def), makeExit(px,py,onExit) 는 WorldScene 가 주입하는 팩토리.
export function populateFlashback(fbDef, spec, tileSize, api, gameState) {
  const cx = Math.floor(spec.w / 2), ts = tileSize;
  // 부여 단서: 미획득분만 방 안쪽에 배치.
  const pending = fbDef.grantsClues.filter(id => !gameState.discovered.has(id));
  pending.forEach((clueId, i) => {
    const col = 3 + i * 3, row = 3;
    const clue = gameState.clueById[clueId];
    const markerKey = clue && clue.type === 'document' ? 'marker_clue_document' : 'marker_clue_object';
    api.makeObject((col + 0.5) * ts, (row + 0.5) * ts, {
      id: `fbobj_${clueId}`, type: 'object', verb: '조사', markerKey,
      onInteract: (obj) => {
        gameState.discoverClue(clueId);
        obj.consume();
        api.checkFlashbackExit();
      },
    });
  });
  // 출구(방 하단 중앙).
  api.makeExit((cx + 0.5) * ts, (spec.h - 2 + 0.5) * ts);
}
