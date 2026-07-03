// 챕터 맵에 상호작용 대상을 배치한다. 데이터가 좌표를 가진 것(NPC spawn)은 그대로 쓰고,
// 좌표가 없는 것(조사 오브젝트·에코·아이템)은 걷기 가능 타일에 결정적으로 자동 배치한다.
// ※ 최종 배치는 레벨 디자인 과제 — 현재는 데이터 주도 + 결정적 스캐터의 임시 배치.
import { scatterWalkable, nearestWalkable } from './tilemap.js';

// 현재 챕터/맵에 속한 상호작용 대상을 만들어 factory 로 스폰한다.
// 좌표가 있는 것(NPC spawn)은 그대로(도달 가능 셀로 스냅), 없는 것은 도달 가능 셀에 분산 배치.
// factory: { makeNpc, makeObject }, collisionSet/reachable: 도달성 보장용.
export function spawnChapter(mapKey, chapter, mapData, tileSize, data, gameState, factory, handlers, collisionSet, reachable) {
  const avoid = [];
  const snap = (tx, ty) => reachableNearest(mapData, collisionSet, reachable, tx, ty);

  // 1) NPC — npcs.json 의 spawn(타일 좌표) 사용. 제외: 플레이어블(주인공 중복 방지),
  //    회상 전용 인물, 그리고 spawnChapters 로 현재 챕터에 등장하지 않는 인물(스포일러 방지).
  //    map_academy 를 챕터2·final 이 공유하므로 corvinox(spawnChapters=['final'])는 챕터2에서 제외된다.
  const worldNpcs = data.npcs.npcs.filter(n =>
    n.spawn && n.spawn.map === mapKey && !n.playable && !isFlashbackOnly(n) && chapterAllowed(n, chapter));
  for (const npc of worldNpcs) {
    const t = snap(npc.spawn.x, npc.spawn.y);
    avoid.push(t);
    factory.makeNpc(npc, center(t.x, tileSize), center(t.y, tileSize), handlers.npc);
  }

  // 2) 조사 오브젝트 — source 가 "map_X / obj_Y" 인 이 챕터 단서. 이미 획득한 단서는 재스폰하지 않음.
  const objClues = data.clues.clues.filter(c =>
    String(c.chapter) === String(chapter) && /^map_\w+ \/ obj_/.test(c.source) &&
    c.source.startsWith(mapKey) && !gameState.discovered.has(c.id));
  const objPos = scatterWalkable(mapData, tileSize, objClues.length, collisionSet, reachable, avoid, chapter * 101 + 7);
  objClues.forEach((clue, i) => {
    const p = objPos[i]; if (!p) return;
    avoid.push({ x: p.tx, y: p.ty });
    factory.makeObject(p.px, p.py, {
      id: clue.source.split('/')[1].trim(), type: 'object',
      markerKey: clue.type === 'document' ? 'marker_clue_document' : 'marker_clue_object',
      onInteract: (obj) => handlers.object(clue, obj),
    });
  });

  // 3) 에코 지점 — 이 챕터의 회상 진입점.
  const echoes = data.progression.flashbacks.filter(f => f.chapter === chapter);
  const echoPos = scatterWalkable(mapData, tileSize, echoes.length, collisionSet, reachable, avoid, chapter * 211 + 13);
  echoes.forEach((fb, i) => {
    const p = echoPos[i]; if (!p) return;
    avoid.push({ x: p.tx, y: p.ty });
    factory.makeObject(p.px, p.py, {
      id: fb.echoPoint, type: 'echo', markerKey: 'marker_echo',
      onInteract: (obj) => handlers.echo(fb, obj),
    });
  });

  // 4) 아이템(열쇠·메멘토) — 이 챕터.
  const items = (data.items.items || []).filter(it => it.chapter === chapter && !gameState.hasItem(it.id));
  const itemPos = scatterWalkable(mapData, tileSize, items.length, collisionSet, reachable, avoid, chapter * 331 + 17);
  items.forEach((it, i) => {
    const p = itemPos[i]; if (!p) return;
    avoid.push({ x: p.tx, y: p.ty });
    factory.makeObject(p.px, p.py, {
      id: it.id, type: 'item', markerKey: 'marker_item',
      onInteract: (obj) => handlers.item(it, obj),
    });
  });
}

function isFlashbackOnly(npc) {
  // 회상 속 인물(애니카·카엘)은 회상 시퀀스에서만 등장. role 에 "회상" 표기.
  return /회상 속 인물/.test(npc.role || '');
}
// npcs.json 의 spawnChapters(문자열 배열)로 현재 챕터 등장 여부 게이팅. 필드 없으면 등장 허용(하위호환).
function chapterAllowed(npc, chapter) {
  if (!Array.isArray(npc.spawnChapters)) return true;
  return npc.spawnChapters.map(String).includes(String(chapter));
}
function center(tile, ts) { return tile * ts + ts / 2; }

// 도달 가능한 가장 가까운 셀. reachable 안이면 그대로, 아니면 확장 탐색.
function reachableNearest(grid, collisionSet, reachable, tx, ty) {
  if (reachable.has(tx + ',' + ty)) return { x: tx, y: ty };
  const h = grid.length, w = grid[0].length;
  for (let r = 1; r < Math.max(w, h); r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const x = tx + dx, y = ty + dy;
        if (reachable.has(x + ',' + y)) return { x, y };
      }
  return nearestWalkable(grid, collisionSet, tx, ty);
}
