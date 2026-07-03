// 게임 상태의 단일 소스. 통찰·단서·링크·결론·챕터개방·인벤·힌트·플래그를 소유하고,
// 모든 판정(link/deduction 정답, tier 해금, 챕터 개방)을 수행한 뒤 결과를 이벤트로 통보한다.
// UI 는 이 상태를 복제하지 않고 이벤트/state:sync 로만 소비한다. (계약: phase4_core_event-spec.md)
import { bus, EV } from './eventBus.js';

class GameState {
  init(data) {
    this.data = data;                       // { config, progression, clues, connections, npcs, items }
    this.insight = data.progression.insight.start;
    this.gains = data.progression.insight.gains;
    this.discovered = new Set();            // clue id
    this.validatedLinks = new Set();        // link id
    this.completedDeductions = new Set();   // deduction id
    this.inventory = new Set();             // item id
    this.flags = new Set();                 // 트리거 플래그 (met_miriam, flashback_* 등)
    this.hintTokens = data.progression.hintTokens.start;
    this.hintUsedChapters = new Set(); // 힌트를 쓴 챕터 → 결론 첫시도 보너스 미획득(systems §2-C)
    this.currentChapter = 1;
    this.unlockedChapters = new Set([1]);
    this.tier = 0;
    this.unlockedTools = new Set(['tool_observe']);

    // clues / links / deductions 를 id 로 즉시 조회하기 위한 인덱스.
    this.clueById = index(data.clues.clues, 'id');
    this.linkList = data.connections.links;
    this.deductionById = index(data.connections.deductions, 'id');
    // chapterUnlock 조건 문자열에서 선행 결론 id(ded_*) 를 추출 → 데이터 주도 개방 규칙.
    this.unlockReq = buildUnlockRequirements(data.progression.chapterUnlock);
  }

  // ── 단서 ────────────────────────────────────────────────
  discoverClue(clueId) {
    const clue = this.clueById[clueId];
    if (!clue) { console.warn('[gameState] 미정의 단서:', clueId); return false; }
    const isNew = !this.discovered.has(clueId);
    if (isNew) {
      this.discovered.add(clueId);
      this._addInsight(this.gains.clueDiscovered, 'clueDiscovered');
    }
    bus.emit(EV.CLUE_FOUND, { clueId, clue, isNew });
    return isNew;
  }

  // ── 추리 보드: 링크 판정 ─────────────────────────────────
  attemptLink(chapter, clueA, clueB) {
    const link = this.linkList.find(l =>
      String(l.chapter) === String(chapter) && l.valid &&
      ((l.clue_a === clueA && l.clue_b === clueB) || (l.clue_a === clueB && l.clue_b === clueA)));
    const valid = !!link;
    if (valid && !this.validatedLinks.has(link.id)) {
      this.validatedLinks.add(link.id);
      this._addInsight(this.gains.correctLink, 'correctLink');
    }
    const res = { clueA, clueB, valid, linkId: valid ? link.id : null, reveals: valid ? link.reveals : null };
    bus.emit(EV.BOARD_LINK_RESULT, res);
    return res;
  }

  confirmedLinkCount(chapter) {
    return [...this.validatedLinks].filter(id => {
      const l = this.linkList.find(x => x.id === id);
      return l && String(l.chapter) === String(chapter);
    }).length;
  }

  // ── 추리 보드: 결론 판정 ─────────────────────────────────
  attemptDeduction(deductionId, optionIndex) {
    const d = this.deductionById[deductionId];
    if (!d) { console.warn('[gameState] 미정의 결론:', deductionId); return null; }
    const correct = optionIndex === d.answerIndex;
    let insightAwarded = 0, firstTry = false, unlockedChapter = null;
    if (correct && !this.completedDeductions.has(deductionId)) {
      firstTry = true; // 무페널티 설계상 첫 정답 = 첫 시도로 간주(오답은 상태 변경 없음)
      // 힌트 사용 챕터는 첫시도 보너스 미획득(systems §2-C: 감점 아닌 보너스 미획득).
      const bonus = this.hintUsedChapters.has(String(d.chapter)) ? 0 : (d.firstTryBonus || 0);
      insightAwarded = (d.insightReward || this.gains.deductionCorrect) + bonus;
      this.completedDeductions.add(deductionId);
      this._addInsight(insightAwarded, 'deductionCorrect');
      this.hintTokens += this.data.progression.hintTokens.perChapterClear;
      bus.emit(EV.HINT_CHANGED, { tokens: this.hintTokens });
      unlockedChapter = this._evaluateUnlocks();
    }
    const res = { deductionId, correct, firstTry, insightAwarded, unlockedChapter };
    bus.emit(EV.BOARD_CONCL_RESULT, res);
    return res;
  }

  // 완료된 결론 집합으로 개방 가능한 새 챕터를 찾아 개방하고 그 식별자를 반환.
  _evaluateUnlocks() {
    let newly = null;
    for (const [chapter, reqs] of Object.entries(this.unlockReq)) {
      const key = isNaN(Number(chapter)) ? chapter : Number(chapter);
      if (this.unlockedChapters.has(key)) continue;
      if (reqs.every(d => this.completedDeductions.has(d))) {
        this.unlockedChapters.add(key);
        newly = key;
      }
    }
    return newly;
  }

  // ── 인벤토리 / 힌트 / 플래그 ─────────────────────────────
  addItem(itemId) {
    if (this.inventory.has(itemId)) return;
    const item = (this.data.items.items || []).find(i => i.id === itemId) || { id: itemId };
    this.inventory.add(itemId);
    bus.emit(EV.ITEM_ACQUIRED, { itemId, item });
  }
  hasItem(itemId) { return this.inventory.has(itemId); }

  spendHintToken() {
    if (this.hintTokens <= 0) return false;
    this.hintTokens -= 1;
    bus.emit(EV.HINT_CHANGED, { tokens: this.hintTokens });
    return true;
  }

  // 힌트 요청 처리(systems §2-C GDD 정의 그대로):
  //  - context 'link'  → tool_cross_ref: 아직 안 이은 유효 링크(양 단서 발견됨) 1쌍을 흐릿하게 암시.
  //  - context 'deduction' → 결론 오답 선택지 1개 소거.
  //  비용: 토큰 1개. 단, 통찰 티어 ≥ freeLowIntensityAfterTier 이면 무료(저강도). 사용 시 해당 챕터 첫시도 보너스 미획득.
  //  줄 힌트가 없으면 토큰을 쓰지 않는다(공정성). 페이로드는 ui-coder 계약 필드 + 별칭 동시 제공.
  requestHint(context, chapter) {
    const emit = (r) => { bus.emit(EV.HINT_RESULT, r); return r; };
    // 1) 후보 산정(토큰 차감 전).
    let candidate;
    if (context === 'deduction') {
      const d = this.data.connections.deductions.find(x => String(x.chapter) === String(chapter) && !this.completedDeductions.has(x.id))
             || this.data.connections.deductions.find(x => String(x.chapter) === String(chapter));
      if (d) { let i = 0; while (i < d.options.length && i === d.answerIndex) i++;
        candidate = { context: 'deduction', chapter, deductionId: d.id, removeOptionIndex: i, eliminateOptionIndex: i }; }
    } else {
      const link = this.linkList.find(l => String(l.chapter) === String(chapter) && l.valid &&
        !this.validatedLinks.has(l.id) && this.discovered.has(l.clue_a) && this.discovered.has(l.clue_b));
      if (link) candidate = { context: 'link', chapter, clueA: link.clue_a, clueB: link.clue_b, pair: [link.clue_a, link.clue_b], reveals: link.reveals };
    }
    if (!candidate) return emit({ ok: false, available: false, context, chapter, reason: 'nothingLeft',
      message: '아직 줄 수 있는 힌트가 없다. 단서를 더 모으라.' });
    // 2) 비용(티어2 이상 무료). 토큰 부족 시 차감 없이 실패.
    const free = this.tier >= (this.data.progression.hintTokens.freeLowIntensityAfterTier ?? Infinity);
    if (!free && !this.spendHintToken()) return emit({ ok: false, available: false, context, chapter, reason: 'noTokens' });
    // 3) 성공 — 힌트 사용 챕터 기록(첫시도 보너스 미획득).
    this.hintUsedChapters.add(String(chapter));
    return emit({ ok: true, available: true, ...candidate });
  }

  setFlag(f) { this.flags.add(f); }
  hasFlag(f) { return this.flags.has(f); }

  // ── 통찰 & 티어 ──────────────────────────────────────────
  _addInsight(delta, reason) {
    if (!delta) return;
    this.insight += delta;
    bus.emit(EV.INSIGHT_CHANGED, { total: this.insight, delta, reason });
    this._checkTier();
  }
  _checkTier() {
    for (const t of this.data.progression.tiers) {
      if (this.insight >= t.insightRequired && t.tier > this.tier) {
        this.tier = t.tier;
        if (t.unlocks && t.unlocks.startsWith('tool_')) this.unlockedTools.add(t.unlocks);
        bus.emit(EV.TIER_UNLOCKED, { tier: t.tier, toolId: t.unlocks, feel: t.feel });
      }
    }
  }

  // ── 보드 페이로드 (UI 공급) ──────────────────────────────
  boardPayload(chapter) {
    const links = this.linkList.filter(l => String(l.chapter) === String(chapter) && l.valid);
    // 보드에 올릴 단서 = 이 챕터의 유효 링크에 참여하는, 발견된 단서.
    // (최종장 링크는 챕터 1~3 핵심 단서를 참조하므로 clue.chapter 필드로 필터하면 안 됨.)
    const clueIds = new Set();
    links.forEach(l => { clueIds.add(l.clue_a); clueIds.add(l.clue_b); });
    const clues = this.data.clues.clues.filter(c => clueIds.has(c.id) && this.discovered.has(c.id));
    const deductions = this.data.connections.deductions
      .filter(d => String(d.chapter) === String(chapter))
      .map(({ id, chapter, prompt, options, requiredLinks }) => ({ id, chapter, prompt, options, requiredLinks }));
    return {
      chapter, clues, links,
      deductions,
      validatedLinkIds: [...this.validatedLinks],
      completedDeductionIds: [...this.completedDeductions],
      confirmedLinkCount: this.confirmedLinkCount(chapter),
    };
  }

  syncToUI() {
    bus.emit(EV.STATE_SYNC, {
      insight: this.insight,
      tokens: this.hintTokens,
      discoveredClues: [...this.discovered],
      unlockedChapters: [...this.unlockedChapters],
      currentChapter: this.currentChapter,
      inventory: [...this.inventory],
    });
  }
}

function index(arr, key) {
  const m = {};
  for (const o of arr) m[o[key]] = o;
  return m;
}

// chapterUnlock[*].condition 문자열에서 ded_* 토큰을 추출해 챕터별 선행 결론 목록을 만든다.
function buildUnlockRequirements(chapterUnlock) {
  const req = {};
  for (const cu of chapterUnlock) {
    const deds = (cu.condition.match(/ded_[a-z0-9_]+/g) || []);
    if (deds.length) req[cu.chapter] = [...new Set(deds)];
  }
  return req;
}

export const gameState = new GameState();
