/* RankMe - Battle Mode engine
   Quick: Bradley-Terry + active pair selection (budget of comparisons)
   Full:  merge-sort pairwise comparisons → complete order
*/
(function () {
  'use strict';

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function resolveTemplateId() {
    try {
      var p = new URLSearchParams(location.search);
      var q = (p.get('t') || '').trim();
      if (q) return q;
    } catch (e) {}
    try {
      var s = sessionStorage.getItem('rankme_t');
      if (s) return s.trim();
    } catch (e) {}
    return '';
  }

  /* ---- budget helpers ---- */
  function quickTargetCount(n) {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    // ~2n capped, feels like a short session
    var b = Math.round(Math.min(Math.max(n * 1.6, 20), Math.min(60, (n * (n - 1)) / 2)));
    return Math.max(4, b);
  }
  function fullTargetCount(n) {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    // n log2 n (merge-sort comparisons upper bound ~)
    return Math.max(n - 1, Math.round(n * Math.log2(n)));
  }
  function estimateMinutes(comparisons) {
    // ~2.5s thinking + animation per pick average
    return Math.max(1, Math.round((comparisons * 2.5) / 60));
  }

  /* ---- tiers from ranked ids ---- */
  var TIER_DEFS = [
    { id: 't1', name: 'S', hue: 0, sat: 70, light: 62 },
    { id: 't2', name: 'A', hue: 28, sat: 65, light: 58 },
    { id: 't3', name: 'B', hue: 48, sat: 55, light: 55 },
    { id: 't4', name: 'C', hue: 140, sat: 40, light: 50 },
    { id: 't5', name: 'D', hue: 220, sat: 35, light: 48 },
  ];
  function generateTiers(rankedIds) {
    var n = rankedIds.length;
    var out = {};
    TIER_DEFS.forEach(function (t) { out[t.id] = []; });
    if (!n) return out;
    if (n < 5) {
      rankedIds.forEach(function (id, i) { out[TIER_DEFS[i % TIER_DEFS.length].id].push(id); });
      return out;
    }
    var pct = [0.10, 0.20, 0.25, 0.25, 0.20];
    var raw = pct.map(function (p) { return p * n; });
    var floors = raw.map(Math.floor);
    var used = floors.reduce(function (a, b) { return a + b; }, 0);
    var remainder = n - used;
    var fracIdx = raw.map(function (r, i) { return { i: i, frac: r - floors[i] }; })
      .sort(function (a, b) { return b.frac - a.frac || a.i - b.i; });
    var counts = floors.slice();
    for (var k = 0; k < remainder; k++) counts[fracIdx[k % 5].i]++;
    var idx = 0;
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < counts[i] && idx < n; j++) out[TIER_DEFS[i].id].push(rankedIds[idx++]);
    }
    while (idx < n) out[TIER_DEFS[4].id].push(rankedIds[idx++]);
    return out;
  }

  function encodeShareHashSync(payload) {
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) { return ''; }
  }

  function pairKey(a, b) {
    return a < b ? a + '|' + b : b + '|' + a;
  }

  /* ============================================================
     QUICK ENGINE — Bradley–Terry scores + active pair picking
     ============================================================ */
  function createQuickEngine(itemIds, priors) {
    var scores = {};
    var usedPairs = {};
    var seenCount = {};
    itemIds.forEach(function (id) {
      scores[id] = 0;
      seenCount[id] = 0;
      if (priors && typeof priors[id] === 'number') scores[id] = priors[id] * 0.15;
    });

    function pickNextPair() {
      var ranked = itemIds.slice().sort(function (a, b) { return scores[b] - scores[a]; });
      var best = null, bestScore = -1e9;
      // Prefer close scores, under-seen items, unused pairs
      for (var i = 0; i < ranked.length; i++) {
        for (var j = i + 1; j < Math.min(i + 12, ranked.length); j++) {
          var a = ranked[i], b = ranked[j];
          if (usedPairs[pairKey(a, b)]) continue;
          var gap = Math.abs(scores[a] - scores[b]);
          var under = 3 - Math.min(seenCount[a] || 0, 3) + (3 - Math.min(seenCount[b] || 0, 3));
          var s = under * 2 - gap * 0.8 + Math.random() * 0.3;
          if (s > bestScore) { bestScore = s; best = [a, b]; }
        }
      }
      if (!best) {
        for (var i2 = 0; i2 < ranked.length; i2++) {
          for (var j2 = i2 + 1; j2 < ranked.length; j2++) {
            if (!usedPairs[pairKey(ranked[i2], ranked[j2])]) {
              best = [ranked[i2], ranked[j2]];
              break;
            }
          }
          if (best) break;
        }
      }
      if (!best) best = [ranked[0], ranked[Math.min(1, ranked.length - 1)]];
      seenCount[best[0]] = (seenCount[best[0]] || 0) + 1;
      seenCount[best[1]] = (seenCount[best[1]] || 0) + 1;
      return best;
    }

    function recordChoice(winner, loser, skipped, draw) {
      if (winner != null && loser != null) usedPairs[pairKey(winner, loser)] = true;
      if (skipped || winner == null || loser == null) return;
      if (draw) {
        var sa0 = scores[winner], sb0 = scores[loser];
        var mid = (sa0 + sb0) / 2;
        var boost = 0.12;
        scores[winner] = sa0 + (mid - sa0) * 0.2 + boost;
        scores[loser] = sb0 + (mid - sb0) * 0.2 + boost;
        return;
      }
      // Bradley-Terry style gradient step
      var sa = scores[winner], sb = scores[loser];
      var pWin = 1 / (1 + Math.exp(sb - sa));
      var lr = 0.35;
      scores[winner] = sa + lr * (1 - pWin);
      scores[loser] = sb - lr * (1 - pWin);
    }

    function finalRanking() {
      return itemIds.slice().sort(function (a, b) { return scores[b] - scores[a]; });
    }

    return {
      mode: 'quick',
      scores: scores,
      usedPairs: usedPairs,
      seenCount: seenCount,
      pickNextPair: pickNextPair,
      recordChoice: recordChoice,
      finalRanking: finalRanking,
      exportState: function () {
        return { mode: 'quick', scores: scores, usedPairs: usedPairs, seenCount: seenCount };
      },
      importState: function (st) {
        if (!st) return;
        if (st.scores) scores = st.scores;
        if (st.usedPairs) usedPairs = st.usedPairs;
        if (st.seenCount) seenCount = st.seenCount;
      },
    };
  }

  /* ============================================================
     FULL ENGINE — interactive merge-sort comparisons
     ============================================================ */
  function createFullEngine(itemIds) {
    // Bottom-up merge sort driven by user comparisons
    var runs = itemIds.slice();
    for (var i = runs.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = runs[i]; runs[i] = runs[j]; runs[j] = tmp;
    }
    // runs is array of singleton arrays
    runs = runs.map(function (id) { return [id]; });

    var merge = null; // { left, right, i, j, out }
    var comparisons = 0;

    function startNextMerge() {
      if (runs.length <= 1) {
        merge = null;
        return;
      }
      // Always merge first two runs
      var left = runs.shift();
      var right = runs.shift();
      merge = { left: left, right: right, i: 0, j: 0, out: [] };
    }

    startNextMerge();

    function pickNextPair() {
      if (!merge) {
        if (runs.length <= 1) return null;
        startNextMerge();
      }
      if (!merge) return null;
      if (merge.i >= merge.left.length || merge.j >= merge.right.length) {
        // finish this merge without more compares
        while (merge.i < merge.left.length) merge.out.push(merge.left[merge.i++]);
        while (merge.j < merge.right.length) merge.out.push(merge.right[merge.j++]);
        runs.push(merge.out);
        merge = null;
        return pickNextPair();
      }
      return [merge.left[merge.i], merge.right[merge.j]];
    }

    function recordChoice(winner, loser, skipped, draw) {
      if (!merge) return;
      var L = merge.left, R = merge.right;
      if (merge.i >= L.length || merge.j >= R.length) return;
      if (draw) {
        // Equal: take both in current relative order (left then right)
        merge.out.push(L[merge.i++]);
        if (merge.j < R.length) merge.out.push(R[merge.j++]);
      } else if (skipped || String(winner) === String(L[merge.i])) {
        merge.out.push(L[merge.i++]);
      } else {
        merge.out.push(R[merge.j++]);
      }
      comparisons++;
      // drain if one side empty
      if (merge.i >= L.length || merge.j >= R.length) {
        while (merge.i < L.length) merge.out.push(L[merge.i++]);
        while (merge.j < R.length) merge.out.push(R[merge.j++]);
        runs.push(merge.out);
        merge = null;
      }
    }

    function finalRanking() {
      if (runs.length === 1 && !merge) return runs[0].slice();
      // incomplete: concatenate remaining
      var all = [];
      if (merge) {
        all = all.concat(merge.out);
        all = all.concat(merge.left.slice(merge.i));
        all = all.concat(merge.right.slice(merge.j));
      }
      runs.forEach(function (r) { all = all.concat(r); });
      return all;
    }

    function isDone() {
      return !merge && runs.length <= 1;
    }

    return {
      mode: 'full',
      pickNextPair: pickNextPair,
      recordChoice: recordChoice,
      finalRanking: finalRanking,
      isDone: isDone,
      exportState: function () {
        return {
          mode: 'full',
          runs: runs,
          merge: merge,
          comparisons: comparisons,
        };
      },
      importState: function (st) {
        if (!st || st.mode !== 'full') return;
        if (st.runs) runs = st.runs;
        if (st.merge !== undefined) merge = st.merge;
        if (typeof st.comparisons === 'number') comparisons = st.comparisons;
      },
    };
  }

function createEngine(itemIds, mode, priors) {
    mode = mode === 'full' ? 'full' : 'quick';
    if (mode === 'full') return createFullEngine(itemIds);
    return createQuickEngine(itemIds, priors);
  }

  /* ---- persistence (keyed by template + mode) ---- */
  function storageKey(templateId, mode) {
    return 'battle_progress_' + templateId + '_' + (mode || 'quick');
  }
  function saveProgress(templateId, payload) {
    try {
      payload.timestamp = Date.now();
      localStorage.setItem(storageKey(templateId, payload.mode), JSON.stringify(payload));
    } catch (e) {}
  }
  function loadProgress(templateId, mode) {
    try {
      var raw = localStorage.getItem(storageKey(templateId, mode));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function clearProgress(templateId, mode) {
    try { localStorage.removeItem(storageKey(templateId, mode)); } catch (e) {}
  }

  // legacy API compat
  function targetBattleCount(n) { return quickTargetCount(n); }

  window.RankMeBattle = {
    escapeHtml: escapeHtml,
    resolveTemplateId: resolveTemplateId,
    targetBattleCount: targetBattleCount,
    quickTargetCount: quickTargetCount,
    fullTargetCount: fullTargetCount,
    estimateMinutes: estimateMinutes,
    generateTiers: generateTiers,
    TIER_DEFS: TIER_DEFS,
    encodeShareHashSync: encodeShareHashSync,
    createEngine: createEngine,
    createQuickEngine: createQuickEngine,
    createFullEngine: createFullEngine,
    saveProgress: saveProgress,
    loadProgress: loadProgress,
    clearProgress: clearProgress,
  };
})();
