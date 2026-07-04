# ART ↔ GAME 계약 (v2 리뉴얼)

파일 구조 (모두 /home/user/ashprince/):
- `index.html` — 셸 + CSS + `<script src="src/art.js">` + `<script src="src/game.js">` (이 순서). GAME 에이전트 소유.
- `src/art.js` — 전역 `window.ART` 객체만 정의. 게임 상태를 소유하지 않는 순수 렌더링 모듈. ART 에이전트 소유.
- `src/game.js` — 게임 로직 전체. GAME 에이전트 소유.

좌표계: ctx는 이미 DPR 변환 적용됨. W,H는 CSS 픽셀 화면 크기. 원점 좌상단.

## window.ART API (art.js가 반드시 정의)

```js
ART.drawBackground(ctx, { stage, scrollY, time, W, H })
// stage: 0..6. scrollY: 누적 스크롤 픽셀(계속 증가, 아래로 흐르는 종스크롤 느낌 필수).
// 다층 페럴랙스: 하늘/별(고정~0.1x), 원경 실루엣(0.25x), 중경 소품(0.6x), 근경 안개(1.2x).
// 중경 소품은 화면 밖 위에서 아래로 흘러가야 함 (묘비/기둥/나무 등 스테이지 모티프).
// 스테이지 팔레트/모티프:
//  0 리들 저택: 보라·회색, 폐가 창문, 부서진 가구 실루엣
//  1 곤트 오두막 숲: 진초록·갈색, 뒤틀린 나무
//  2 바다 동굴: 청록·흑색, 종유석, 물결 광택
//  3 그린고츠 금고: 금빛·암갈색, 석주, 금화 반짝임
//  4 호그와트 회랑: 남색·보라, 아치 기둥, 촛불
//  5 뱀의 소굴: 독록색, 뱀 문양 부조, 안개
//  6 호그와트 대전: 핏빛 하늘, 성벽, 떨어지는 불씨·재

ART.drawPlayer(ctx, player, time)
// player: { x, y, r(~18), hitFlash, shieldT, dead }
// 볼드모트: 창백한 대머리, 움푹한 붉은 눈, 코 없는 얼굴 음영, 흘러내리는 검은 로브(펄럭임 애니메이션),
// 오른손 지팡이+초록 마력광. 부유하는 느낌(sin 흔들림). hitFlash>0이면 흰 점멸.

ART.drawEnemy(ctx, e, time)
// e: { x, y, r, type, hitT, t, hp, maxhp, shielded? }
// type: 'auror'(적갈 로브 추격자) | 'order'(파란 로브, 지팡이 사격 자세) | 'guardian'(은빛 패트로누스 사슴)
//     | 'broom'(빗자루 기동대: 빗자루 탄 실루엣, 기울어짐) | 'shielder'(결계술사: 주위 육각 보호막 링)
//     | 'splitter'(쌍둥이 마법사: 좌우 대칭 이중 실루엣) | 'sniper'(저격 마법사: 긴 지팡이 조준선)
// 각 타입 실루엣/색이 한눈에 구분되어야 함. hitT>0 흰 점멸. hp<maxhp면 미니 체력바.
// e.shielded가 truthy면 육각 보호막 오버레이.

ART.drawBoss(ctx, boss, time)
// boss: { x, y, r(28~40), key, hitT, phase(1|2), entering, telegraph? }
// key: 'moody'|'tonks'|'sirius'|'mcgonagall'|'snape'|'harry'|'dumbledore'
// 각 보스 고유 특징 필수: moody=한쪽 큰 마법 눈+흉터+지팡이 의족, tonks=분홍 머리, sirius=흐트러진 장발+수염(2페이즈: 검은 개),
// mcgonagall=뾰족 모자+안경+에메랄드 로브, snape=검은 장발+검은 로브, harry=둥근 안경+이마 번개 흉터+빨강 목도리,
// dumbledore=긴 백발 수염+반달 안경+화려한 로브(2페이즈: 불사조 오라).
// phase 2에서 오라 색 변화. telegraph(0..1)가 있으면 시전 예고 발광.

ART.drawStoryBg(ctx, { stage, W, H, time })  // 스토리 화면 배경(해당 스테이지 모티프의 정적+미세 애니메이션 일러스트 느낌)
ART.drawTitleBg(ctx, { W, H, time })         // 타이틀: 어둠의 표식(해골+뱀) 대형 문양 + 안개 + 부유 입자

ART.ICONS = { avada, fiendfyre, shield, nagini, crucio, darkmark }
// 각각 완결된 <svg>...</svg> 문자열(viewBox="0 0 48 48", currentColor 또는 자체 색). 텍스트 없이 심볼만:
// avada=번개형 초록 광선, fiendfyre=불꽃 뱀, shield=육각 결계+해골, nagini=또아리 뱀, crucio=뒤틀린 붉은 번개 삼지창, darkmark=해골+뱀 문양
```

## 성능 규칙 (모바일 사파리)
- 루프 내 createLinearGradient/createRadialGradient/shadowBlur 금지 → 모듈 로드 시 또는 크기 변경 시 오프스크린 캔버스에 사전 렌더링.
- ART.resize(W, H)를 정의하면 game.js가 리사이즈 때 호출해 줌 (캐시 재생성용).
- 문자/보스는 path 드로잉 허용(개체수 적음). 배경 별/소품은 사전 렌더 스프라이트 drawImage 권장.
- 60fps 목표. 페럴랙스 각 레이어는 오프스크린 타일(세로 루프는 미러 타일링으로 이음새 제거) 권장.

## 금지
- art.js는 DOM 접근 금지(오프스크린 canvas 생성 제외), 게임 상태 변경 금지, 이벤트 리스너 금지.
- 외부 리소스/네트워크 요청 금지. 이미지는 전부 코드로 그린다.
- 저작물 텍스트 인용 금지(창작 문구만).
