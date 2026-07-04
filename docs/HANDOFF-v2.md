# v2 인수인계 노트 (로컬 Claude Code 후속 작업용)

작성: 2026-07-04 원격 세션 · 브랜치 `claude/harry-potter-voldemort-game-0t3w8y`

## 현재 상태

- **배포됨 (main / GitHub Pages)**: v1 — https://namojo.github.io/ashprince/
  - 단일 `index.html` 웨이브 슈터, 7스테이지, 스킬 3종, QA 수정 9건 반영 (PR #1로 머지)
- **이 브랜치의 HEAD**: v1 + QA 수정 + 본 문서 = main과 동일한 게임 코드
- **진행 중이던 v2 작업**: 원격 세션에서 에이전트 2개가 제작 중이었음 (완성되면 이 브랜치에 추가 커밋됨 — 로컬 작업 시작 전 `git pull` 필수)

## v2 목표 (사용자 요청사항 6개)

1. **디자인 전면 개선** — 캐릭터·악당·배경 퀄리티 (원격에서는 codex-image 사용 불가라 프로시저럴 아트로 진행; 로컬에서는 codex-image 스킬로 실제 생성 이미지 에셋 교체 가능)
2. **스킬 6종으로 확장** — 기존 3종 + 나기니의 습격(주위 선회 뱀), 크루시아투스(전체 기절+도트), 어둠의 표식(장쿨 전체 광역). 진행도에 따라 해금(1/3/5스테이지 클리어)
3. **스킬 버튼 왼쪽 배치 + 텍스트 대신 아이콘** (SVG)
4. **적 다양화** — 기존 3종 + 빗자루 기동대(사인 곡선 급습), 결계술사(주변 적 보호막, 우선 처치 대상), 분열술사(사망 시 2분열), 저격수(상단 고정, 조준선 예고 후 고위력탄). 보스 7인 각각 고유 시그니처 패턴(예고 0.6s+): 무디=추적 레이저, 통스=거울 분신, 시리우스=개 변신 돌진, 맥고나걸=체스말 소환, 스네이프=X자 참격, 해리=무장해제(3초 공격 불능)+패트로누스, 덤블도어=화염 폭풍→2페이즈 불사조 급강하
5. **인트로/스토리 강화** — 타이틀에 어둠의 표식 아트, 스테이지 전환마다 전용 배경 + 타자기 연출 스토리(볼드모트 1인칭 창작 독백)
6. **종스크롤 체감** — 상시 스크롤(G.scrollY ~90px/s), 3~4단 페럴랙스, 중경 소품(묘비/기둥/나무 등)이 아래로 흘러가야 함

## 설계 계약

- `docs/ART_CONTRACT.md` — 파일 구조(index.html + src/art.js + src/game.js)와 `window.ART` API 계약. v2는 이 계약대로 분리 구현.
- 스테이지별 배경 모티프/팔레트, 보스 외형 특징, 성능 규칙(루프 내 그라디언트·shadowBlur 금지, 오프스크린 사전 렌더)이 계약서에 명시됨.

## 유지해야 하는 v1 QA 수정사항 (회귀 금지)

1. `schedule()`은 사망 예약(showGameOver)을 덮어쓰지 않음
2. `hurtPlayer()`는 stageClear 예약 후 무적 처리
3. `killBoss()`/`updateSkills()`는 `player.dead` 가드
4. AudioContext `state !== 'running'` 재개 + visibilitychange 복귀 시 재개 (iOS 'interrupted' 대응)
5. 저장 데이터 로드 시 정수 강제 변환 (NaN 방지)
6. 첫 손가락이 드래그 소유권 유지 (두 번째 터치 무시)
7. `goTitle()`에서 bossBar 숨김
8. `.btn.hidden { display:none }` CSS
9. 스토리 화면 350ms 더블탭 가드
10. 발광 효과는 사전 렌더 스프라이트 (shadowBlur/그라디언트 루프 내 생성 금지)

## 검증 방법 (원격 세션에서 쓰던 방식)

- iPhone 에뮬레이션 Playwright: viewport 390x844, DPR 3, hasTouch, 터치 이벤트로 전체 플로우 주행 + 콘솔 에러 0 확인
- 로컬: `python3 -m http.server` 후 `npx playwright` 또는 실기기 Safari

## 배포 절차

1. 이 브랜치에서 작업 → 커밋/푸시
2. main으로 PR → 머지 → GitHub Pages 자동 배포 (Actions "pages build and deployment" 성공 확인)
