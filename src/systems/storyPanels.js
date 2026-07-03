// 스토리 패널(이미지+텍스트) 시퀀스 데이터. 인트로·챕터 결말·엔딩에 표시.
// 데이터 주도: panels.json(inject 주입 예정)이 있으면 그걸 쓰고, 없으면 아래 임시 텍스트로 흐름만 완성.
// 이미지는 story 일러스트(sprite-engineer 생산 예정) 도착 전까지 null → UI가 텍스트만 렌더.
// 스키마(제안, team-lead→inject): { sets: { <setId>: { panels: [ { image:string|null, text:string, title?:string } ] } } }

// image 는 CG 텍스처 키(cg_id). Boot 가 manifest.panels 로 로드. text 는 임시(inject 대본 도착 시 대체).
const TEMP_SETS = {
  intro: { panels: [
    { image: 'cg_prologue_01', title: '재의 군주 — 기원담', text: '세상은 그를 재의 군주라 부른다. 하늘마저 잿빛으로 물들인 공포의 이름으로.' },
    { image: 'cg_prologue_02', text: '허나 모든 괴물에게도 시작이 있다. 진실기록원의 봉인된 문서들 사이, 그 시작이 잠들어 있다.' },
    { image: 'cg_prologue_03', text: '나는 리엔 벤. 기록관으로서, 소문이 아닌 남겨진 것들로 그의 기원을 좇는다.' },
    { image: 'cg_prologue_04', text: '잿골, 미스트미어, 잿빛 첨탑. 세 폐허가 하나의 진실로 이어진다. 이제, 첫 걸음.' },
  ] },
  ch1_conclusion: { panels: [
    { image: 'cg_ep1_01', title: '제1장 · 잿골 고아원', text: '유일하게 다정했던 애니카가 떠난 자리. 온기는 빈 침대만 남기고 사라졌다.' },
    { image: 'cg_ep1_02', text: '상실은 두려움이 되고, 두려움은 처음으로 힘이 되어 터져 나왔다.' },
    { image: 'cg_ep1_03', text: '원장은 그 아이를 저주라 적었다. 그렇게 아이는 홀로 낙인찍혔다.' },
  ] },
  ch2_conclusion: { panels: [
    { image: 'cg_ep2_01', title: '제2장 · 미스트미어 마법원', text: '언제나 맨 위의 이름. 그러나 그 곁엔 축하도, 벗도 없었다.' },
    { image: 'cg_ep2_02', text: '멸시와 고립 속에서, 그는 소멸을 거스르는 금지된 지식으로 침잠했다.' },
    { image: 'cg_ep2_03', text: '"다시는 약해지지 않겠다." 맹세는 불이 되어 서약서를 재로 삼켰다.' },
  ] },
  ch3_conclusion: { panels: [
    { image: 'cg_ep3_01', title: '제3장 · 잿빛 첨탑', text: '마지막 인간적 끈, 이졸데. 그녀가 뻗은 손을 그는 끝내 잡지 않았다.' },
    { image: 'cg_ep3_02', text: '버림받을 두려움에, 그는 관계를 먼저 끊었다 — 자기 이름부터.' },
    { image: 'cg_ep3_03', text: '카엘 도른은 재가 되고, 그 자리에 코르비녹스가 섰다.' },
  ] },
  ending: { panels: [
    { image: 'cg_end_01', title: '진실', text: '흩어진 세 진실이 하나의 실로 수렴한다.' },
    { image: 'cg_end_02', text: '괴물의 그림자 안에, 여전히 버림받을까 떨던 아이가 있었다.' },
    { image: 'cg_end_03', text: '그는 악해지기로 한 적이 없다. 사랑할 능력을 스스로 도려냈을 뿐 — 마지막에 도려낸 것이 제 이름이었다.' },
    { image: 'cg_end_04', text: '기록은 끝났다. 잿빛 여명이 폐허 위로 천천히 밝아온다.' },
  ] },
};

// 주입 데이터 우선, 없으면 임시. setId 없으면 null(흐름 건너뜀).
export function getPanelSet(data, setId) {
  const injected = data && data.panels && data.panels.sets && data.panels.sets[setId];
  return injected || TEMP_SETS[setId] || null;
}

// 클리어된(개방 트리거) 챕터 → 결말 패널 setId. unlockedChapter 값 기준.
export function conclusionSetIdFor(unlockedChapter) {
  return { 2: 'ch1_conclusion', 3: 'ch2_conclusion', final: 'ch3_conclusion', ending: 'ending' }[unlockedChapter] || null;
}

// panels.json 의 image 는 경로(assets/panels/{cg_id}.png). 텍스처 키 = 확장자 없는 basename(cg_id).
// Boot 가 manifest.panels 를 이 키로 preload 하므로 UI 의 textures.exists(key) 와 일치. null 은 그대로(폴백).
export function panelImageKey(image) {
  if (!image) return null;
  const base = String(image).split('/').pop();
  return base.replace(/\.[^.]+$/, '');
}
