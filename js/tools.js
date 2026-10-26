(function () {
  var shelf = document.getElementById('toolShelf');
  var calc = document.getElementById('toolCalc');
  var gameRow = document.getElementById('gameRow');
  var duel = document.getElementById('duelBlock');
  var panel = document.querySelector('.calc-grid .tools-panel');
  var tickets = document.getElementById('tickets');
  var rateIn = document.getElementById('rateIn');
  var copiesIn = document.getElementById('copiesIn');
  var pityIn = document.getElementById('pityIn');
  var pityNote = document.getElementById('pityNote');
  var result = document.getElementById('calcResult');
  var dist = document.getElementById('dist');
  var lootBlock = document.getElementById('lootBlock');
  var poolFold = document.getElementById('poolFold');
  var list = document.getElementById('lootList');
  var pullRow = document.getElementById('pullRow');
  var pullTally = document.getElementById('pullTally');
  var mode = 'duel';
  var banner = 'summon';

  function frag(id, name) {
    return [
      ['frag-' + id + '-1', name + ' ×1', 2.031],
      ['frag-' + id + '-5', name + ' ×5', 0.41],
      ['frag-' + id + '-15', name + ' ×15', 0.136]
    ];
  }

  var banners = {
    summon: {
      name: 'Popstar Poison',
      file: 'poison',
      line: 'Special Summon · Wish List · 2% a pull',
      rate: 0.02,
      pool: [
        ['poison', 'Popstar Poison', 2],
        ['a-wind', 'A-Grade Wind Invitation', 1],
        ['a-thunder', 'A-Grade Thunder Invitation', 1],
        ['a-flame', 'A-Grade Flame Invitation', 1],
        ['b-wind', 'B-Grade Wind Invitation', 4],
        ['b-thunder', 'B-Grade Thunder Invitation', 4],
        ['b-flame', 'B-Grade Flame Invitation', 4],
        ['rare-acc', 'Rare Accessory', 5],
        ['sup-100', 'Superior Accessory ×100', 9],
        ['sup-50', 'Superior Accessory ×50', 12],
        ['boost', 'Boost Stone Kit', 4],
        ['token', 'Strengthening Token', 6],
        ['original', 'Original Token', 8],
        ['mound-break', 'Mound of Breakstones', 4],
        ['abundant-exp', 'Abundant Fighter EXP', 4],
        ['mound-cash', 'Mound of Cash', 4],
        ['pile-break', 'Pile of Breakstones', 9],
        ['decent-exp', 'Decent Fighter EXP', 9],
        ['pile-cash', 'Pile of Cash', 9]
      ]
    },
    divination: {
      name: 'Athlete Chun-Li',
      file: 'chun',
      line: 'Divination · Wish List · 2% a pull',
      rate: 0.02,
      pool: [
        ['chun', 'Athlete Chun-Li', 2],
        ['gems', 'Gems ×30000', 0.01],
        ['boots', 'Fusion Boots', 0.073],
        ['vest', 'Fusion Vest', 0.073],
        ['vambraces', 'Fusion Vambraces', 0.073],
        ['rhand', 'Righteous Fusion Hand', 0.073],
        ['rjourney', 'Ruthless Journey', 0.073],
        ['rarmor', 'Ruthless Armor', 0.073],
        ['rglory', 'Ruthless Glory', 0.073],
        ['rshadow', 'Ruthless Shadow', 0.073],
        ['exguide', 'EX-Move Guide', 0.073],
        ['exdef', 'EX-Move Defense', 0.073],
        ['exwave', 'EX-Move Wave', 0.073],
        ['exstrike', 'EX-Move Strike', 0.073]
      ].concat(
        frag('martial', 'Martial Fragment'),
        frag('reckless', 'Reckless Fragment'),
        frag('chant', 'Fast Chant Fragment'),
        frag('shelter', 'Shelter Fragment'),
        frag('assault', 'Assault Fragment'),
        frag('echo', 'Echo Fragment'),
        frag('dance', 'War Dance Fragment'),
        frag('broken', 'Broken Formation Fragment'),
        [
          ['a-flame', 'A-Grade Flame Invitation', 1.126],
          ['a-thunder', 'A-Grade Thunder Invitation', 1.126],
          ['a-wind', 'A-Grade Wind Invitation', 1.126],
          ['b-flame', 'B-Grade Flame Invitation', 3.157],
          ['b-thunder', 'B-Grade Thunder Invitation', 3.157],
          ['b-wind', 'B-Grade Wind Invitation', 3.157],
          ['ticket', 'Challenge Ticket', 5.263],
          ['rare-2', 'Rare Accessory ×2', 1.578],
          ['rare-1', 'Rare Accessory ×1', 3.157],
          ['sup-150', 'Superior Accessory ×150', 2.957],
          ['sup-100', 'Superior Accessory ×100', 2.957],
          ['sup-50', 'Superior Accessory ×50', 3.936],
          ['mound-cash', 'Mound of Cash', 4.736],
          ['abundant-exp', 'Abundant Fighter EXP', 4.736],
          ['heap', 'Heap of Breakstones', 4.736],
          ['pile-cash', 'Pile of Cash', 9.852],
          ['decent-exp', 'Decent Fighter EXP', 9.852],
          ['sparse', 'Sparse Breakstones', 9.852]
        ]
      )
    }
  };

  function current() { return banners[banner]; }

  document.getElementById('openGacha').addEventListener('click', function () {
    shelf.hidden = true;
    calc.hidden = false;
    paint(false);
  });
  document.getElementById('backTools').addEventListener('click', function () {
    calc.hidden = true;
    shelf.hidden = false;
  });

  gameRow.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-game]');
    if (!btn) return;
    mode = btn.getAttribute('data-game');
    gameRow.querySelectorAll('.tools-chip').forEach(function (el) {
      el.classList.toggle('on', el === btn);
    });
    panel.classList.toggle('is-custom', mode === 'custom');
    lootBlock.hidden = mode !== 'duel';
    poolFold.hidden = mode !== 'duel';
    resultCard.hidden = true;
    paint(false);
  });

  document.getElementById('bannerRow').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-banner]');
    if (!btn) return;
    banner = btn.getAttribute('data-banner');
    document.querySelectorAll('#bannerRow .tools-chip').forEach(function (el) {
      el.classList.toggle('on', el === btn);
    });
    var b = current();
    document.getElementById('fighterImg').src = 'assets/tools/' + b.file + '.webp?v=7';
    document.getElementById('fighterName').textContent = b.name;
    document.getElementById('fighterLine').textContent = b.line;
    resetStage();
    resultCard.hidden = true;
    paint(false);
  });

  [tickets, rateIn, copiesIn, pityIn].forEach(function (el) {
    el.addEventListener('input', function () {
      resultCard.hidden = true;
      paint(false);
    });
  });

  function num(el) {
    var v = String(el.value).trim();
    if (v === '') return null;
    var n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function logChoose(n, k) {
    if (k < 0 || k > n) return -Infinity;
    k = Math.min(k, n - k);
    var s = 0;
    var i;
    for (i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
    return s;
  }

  function pmf(n, i, p) {
    if (i < 0 || i > n) return 0;
    var q = 1 - p;
    var log = logChoose(n, i);
    if (i) log += i * Math.log(p);
    if (n - i) log += (n - i) * Math.log(q);
    var v = Math.exp(log);
    return v > 0 && isFinite(v) ? v : 0;
  }

  function chanceAtLeast(n, k, p) {
    if (k <= 0) return 1;
    if (!(p > 0)) return 0;
    if (p >= 1) return n >= k ? 1 : 0;
    n = Math.floor(n);
    k = Math.floor(k);
    if (n < k) return 0;
    var sum = 0;
    var i;
    for (i = 0; i < k; i++) {
      sum += pmf(n, i, p);
      if (sum >= 1) return 0;
    }
    return Math.max(0, Math.min(1, 1 - sum));
  }

  function pullsFor(k, p, target) {
    if (k <= 0) return 0;
    if (!(p > 0)) return null;
    if (p >= 1) return k;
    var lo = k;
    var hi = Math.max(k + 1, Math.ceil(k / p));
    var guard = 0;
    while (chanceAtLeast(hi, k, p) < target && guard < 40) {
      hi = Math.ceil(hi * 1.6);
      guard++;
    }
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (chanceAtLeast(mid, k, p) >= target) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }

  function pityNow() {
    var n = num(pityIn);
    if (n == null) return 0;
    n = Math.round(n);
    if (n < 1) return 0;
    return Math.min(500, n);
  }

  function cycleMoments(p, pity) {
    if (!(pity > 0) || p >= 1) {
      if (!(p > 0)) return { mean: Infinity, variance: Infinity };
      if (p >= 1) return { mean: 1, variance: 0 };
      return { mean: 1 / p, variance: (1 - p) / (p * p) };
    }
    if (!(p > 0)) return { mean: pity, variance: 0 };
    var q = 1 - p;
    var surv = 1;
    var ex = 0;
    var ex2 = 0;
    var i;
    for (i = 1; i < pity; i++) {
      var hit = surv * p;
      ex += i * hit;
      ex2 += i * i * hit;
      surv *= q;
    }
    ex += pity * surv;
    ex2 += pity * pity * surv;
    return { mean: ex, variance: Math.max(0, ex2 - ex * ex) };
  }

  function normCdf(z) {
    var t = 1 / (1 + 0.2316419 * Math.abs(z));
    var d = 0.3989422804 * Math.exp(-0.5 * z * z);
    var tail = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return z >= 0 ? 1 - tail : tail;
  }

  function exactPity(k, pity) {
    return pity > 0 && k > 0 && k <= 80 && pity <= 300 && k * pity <= 8000;
  }

  function buildPullCdf(k, p, pity) {
    var f = new Float64Array(pity + 1);
    var i;
    if (!(p > 0)) f[pity] = 1;
    else if (p >= 1) f[1] = 1;
    else {
      var surv = 1;
      var q = 1 - p;
      for (i = 1; i < pity; i++) {
        f[i] = surv * p;
        surv *= q;
      }
      f[pity] = surv;
    }
    var dp = new Float64Array([1]);
    var c;
    var s;
    for (c = 0; c < k; c++) {
      var next = new Float64Array(dp.length + pity);
      for (s = 0; s < dp.length; s++) {
        var w = dp[s];
        if (w < 1e-18) continue;
        for (i = 1; i <= pity; i++) next[s + i] += w * f[i];
      }
      dp = next;
    }
    var cum = new Float64Array(dp.length);
    var acc = 0;
    for (s = 0; s < dp.length; s++) {
      acc += dp[s];
      cum[s] = acc > 1 ? 1 : acc;
    }
    return function (n) {
      n = Math.floor(n);
      if (n < 0) return 0;
      if (n >= cum.length) return cum[cum.length - 1] || 0;
      return cum[n];
    };
  }

  function reachChance(n, k, p, pity, cdf) {
    if (k <= 0) return 1;
    if (p >= 1) return n >= k ? 1 : 0;
    if (!(pity > 0)) return chanceAtLeast(n, k, p);
    if (cdf) return cdf(n);
    var mom = cycleMoments(p, pity);
    var mean = k * mom.mean;
    var sd = Math.sqrt(Math.max(0, k * mom.variance));
    if (!(sd > 0)) return n + 1e-9 >= mean ? 1 : 0;
    return normCdf((n + 0.5 - mean) / sd);
  }

  function pullsUntil(k, p, pity, target, cdf) {
    if (k <= 0) return 0;
    if (p >= 1) return k;
    if (!(pity > 0)) return pullsFor(k, p, target);
    var mom = cycleMoments(p, pity);
    var cap = k * pity;
    var lo = k;
    var hi = Math.max(k, Math.min(cap, Math.ceil(k * mom.mean)));
    var guard = 0;
    while (reachChance(hi, k, p, pity, cdf) < target && hi < cap && guard < 40) {
      hi = Math.min(cap, Math.ceil(hi * 1.5 + 1));
      guard++;
    }
    if (reachChance(hi, k, p, pity, cdf) < target) return cap;
    while (lo < hi) {
      var mid = (lo + hi) >> 1;
      if (reachChance(mid, k, p, pity, cdf) >= target) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }

  var TIER_STOPS = [
    [220, 35, 48],
    [140, 40, 50],
    [48, 55, 55],
    [28, 65, 58],
    [0, 70, 62]
  ];

  function tierColor(t) {
    t = Math.max(0, Math.min(1, t));
    var x = t * (TIER_STOPS.length - 1);
    var i = Math.min(TIER_STOPS.length - 2, Math.floor(x));
    var f = x - i;
    var a = TIER_STOPS[i];
    var b = TIER_STOPS[i + 1];
    function mix(u, v) { return Math.round(u + (v - u) * f); }
    return 'hsl(' + mix(a[0], b[0]) + ',' + mix(a[1], b[1]) + '%,' + mix(a[2], b[2]) + '%)';
  }

  function luckColor(i, k) {
    var t = k <= 0 ? 0.5 : (i >= k ? 1 : i / k * 0.8);
    return tierColor(t);
  }

  function copyWindow(n, k, p, pity) {
    var mean;
    var sd;
    if (!(pity > 0)) {
      mean = n * p;
      sd = Math.sqrt(n * p * (1 - p));
    } else {
      var mom = cycleMoments(p, pity);
      mean = n / mom.mean;
      sd = Math.sqrt(n * mom.variance / Math.pow(mom.mean, 3));
    }
    var lo = Math.max(0, Math.floor(mean - 3.2 * sd));
    var hi = Math.min(n, Math.ceil(mean + 3.2 * sd));
    if (hi < lo) hi = lo;
    if (hi - lo > 16) {
      var mid = Math.round(mean);
      lo = Math.max(0, mid - 8);
      hi = Math.min(n, mid + 8);
    }
    return { lo: lo, hi: hi };
  }

  function barProbs(n, lo, hi, p, pity) {
    var rows = [];
    var i;
    if (!(pity > 0)) {
      for (i = lo; i <= hi; i++) rows.push([i, pmf(n, i, p)]);
      return rows;
    }
    if (hi <= 40 && pity <= 200) {
      var f = new Float64Array(pity + 1);
      var surv = 1;
      var q = 1 - p;
      if (!(p > 0)) f[pity] = 1;
      else if (p >= 1) f[1] = 1;
      else {
        for (i = 1; i < pity; i++) {
          f[i] = surv * p;
          surv *= q;
        }
        f[pity] = surv;
      }
      var dp = new Float64Array([1]);
      var reach = [1];
      var m;
      var s;
      for (m = 1; m <= hi + 1; m++) {
        var next = new Float64Array(dp.length + pity);
        for (s = 0; s < dp.length; s++) {
          var w = dp[s];
          if (w < 1e-18) continue;
          for (i = 1; i <= pity; i++) next[s + i] += w * f[i];
        }
        dp = next;
        var acc = 0;
        var lim = Math.min(n, dp.length - 1);
        for (s = 0; s <= lim; s++) acc += dp[s];
        reach[m] = acc > 1 ? 1 : acc;
      }
      for (i = lo; i <= hi; i++) rows.push([i, Math.max(0, reach[i] - reach[i + 1])]);
      return rows;
    }
    var mom = cycleMoments(p, pity);
    var mean = n / mom.mean;
    var sd = Math.sqrt(n * mom.variance / Math.pow(mom.mean, 3));
    for (i = lo; i <= hi; i++) {
      var pr = sd > 0.05
        ? Math.max(0, normCdf((i + 0.5 - mean) / sd) - normCdf((i - 0.5 - mean) / sd))
        : (i === Math.round(mean) ? 1 : 0);
      rows.push([i, pr]);
    }
    return rows;
  }

  function fmt(n) {
    return Math.round(n).toLocaleString('en-US');
  }

  function fmtPct(x) {
    var p = x * 100;
    if (p >= 99.95) return '99.9%';
    if (p > 0 && p < 0.01) return '<0.01%';
    if (p < 1) return p.toFixed(2).replace(/0+$/, '').replace(/\.$/, '') + '%';
    if (p < 10) return (Math.round(p * 10) / 10).toString().replace(/\.0$/, '') + '%';
    return Math.round(p) + '%';
  }

  function rateLabel(p) {
    var n = Math.round(p * 1000) / 10;
    return (n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)) + '%';
  }

  function haul(n) {
    if (n >= 10) return String(Math.round(n));
    if (n >= 1) return (Math.round(n * 10) / 10).toFixed(1).replace(/\.0$/, '');
    if (n >= 0.05) return n.toFixed(1);
    return '<0.1';
  }

  function showPct(n) {
    return n.toFixed(3).replace(/\.?0+$/, '') + '%';
  }

  function paintLoot(n) {
    var rows = current().pool;
    document.getElementById('poolSummary').textContent = 'All prizes · ' + rows.length;
    list.innerHTML = rows.map(function (row) {
      var extra = '';
      if (n != null) extra = '<i>~' + haul(n * row[2] / 100) + '</i>';
      var cls = row[2] === 2 ? 'loot target' : 'loot';
      return '<div class="' + cls + '"><img src="assets/tools/' + row[0] + '.webp?v=7" alt="">' +
        '<span>' + row[1] + '</span><em>' + showPct(row[2]) + '</em>' + extra + '</div>';
    }).join('');
  }

  function paintDist(n, k, p, pity) {
    if (n == null || n < 1 || p >= 1 || (!(p > 0) && !(pity > 0))) {
      dist.hidden = true;
      dist.innerHTML = '';
      return;
    }
    var win = copyWindow(n, k, p, pity);
    var rows = barProbs(n, win.lo, win.hi, p, pity);
    var max = 0;
    var i;
    for (i = 0; i < rows.length; i++) if (rows[i][1] > max) max = rows[i][1];
    var html = '<p class="dist-label">How many copies ' + fmt(n) + ' pulls usually give</p>';
    rows.forEach(function (row) {
      var w = max > 0 ? Math.max(2, Math.round(row[1] / max * 100)) : 0;
      var mark = row[0] === k ? ' mark' : '';
      var color = luckColor(row[0], k);
      html += '<div class="dist-row' + mark + '" style="--bar:' + color + ';--glow:' + color + '">' +
        '<span>' + row[0] + '</span><b style="width:' + w + '%"></b><em>' + fmtPct(row[1]) + '</em></div>';
    });
    if (k > win.hi) {
      var cdf = exactPity(k, pity) ? buildPullCdf(k, p, pity) : null;
      html += '<p class="dist-label">' + k + ' copies is outside this spread. Chance of ' + k + ' or more: ' +
        fmtPct(reachChance(n, k, p, pity, cdf)) + '.</p>';
    }
    dist.hidden = false;
    dist.innerHTML = html;
  }

  var tenOdds = document.getElementById('tenOdds');

  function oneIn(prob) {
    if (!(prob > 0)) return 0;
    return Math.max(1, Math.round(1 / prob));
  }

  function paintTen(p, pity) {
    var twoP = pity ? barProbs(10, 2, 2, p, pity)[0][1] : pmf(10, 2, p);
    var threeP = pity ? barProbs(10, 3, 3, p, pity)[0][1] : pmf(10, 3, p);
    var two = oneIn(twoP);
    var three = oneIn(threeP);
    if (!two || !three || p >= 1) {
      tenOdds.hidden = true;
      tenOdds.innerHTML = '';
      return;
    }
    tenOdds.hidden = false;
    tenOdds.innerHTML = 'Two in one 10-pull: about <b>1 in ' + fmt(two) +
      '</b>. Three: about <b>1 in ' + fmt(three) + '</b>.';
  }

  var resultCard = document.getElementById('resultCard');

  function paint(reveal) {
    var pity = pityNow();
    var p = (num(rateIn) == null ? 2 : num(rateIn)) / 100;
    var copies = num(copiesIn);
    var k = copies == null ? 16 : Math.max(0, Math.round(copies));
    var have = num(tickets);
    if (mode === 'duel') {
      var kind = banner === 'divination' ? 'Divination' : 'Special Summon';
      document.getElementById('fighterLine').textContent = kind + ' · Wish List · ' + rateLabel(p) + ' a pull';
    }
    if ((!(p > 0) && !pity) || p > 1 || k > 500) {
      tenOdds.hidden = true;
      if (reveal) {
        resultCard.hidden = false;
        result.innerHTML = '<b>-</b><p>Rate needs to be above 0 and at most 100.</p>';
        dist.hidden = true;
      }
      return;
    }
    paintTen(p, pity);
    if (mode === 'duel') paintLoot(have != null && have >= 0 ? Math.floor(have) : null);
    if (!reveal) return;
    resultCard.hidden = false;
    pityNote.textContent = pity
      ? 'Guaranteed by pull ' + fmt(pity) + ' if it has not dropped. The count starts over when it does.'
      : 'No pity. Every pull is its own roll. The average is not a promise.';
    var mom = cycleMoments(p, pity);
    var avg = p >= 1 ? k : k * (pity ? mom.mean : (1 / p));
    var cdf = exactPity(k, pity) ? buildPullCdf(k, p, pity) : null;
    var p05 = pullsUntil(k, p, pity, 0.05, cdf);
    var p20 = pullsUntil(k, p, pity, 0.2, cdf);
    var p50 = pullsUntil(k, p, pity, 0.5, cdf);
    var p80 = pullsUntil(k, p, pity, 0.8, cdf);
    var p95 = pullsUntil(k, p, pity, 0.95, cdf);
    var head, unit, line;
    function hi(s) { return '<strong>' + s + '</strong>'; }
    if (k === 0) {
      head = 'Done';
      unit = 'nothing left to pull';
      line = 'You do not need another copy.';
      dist.hidden = true;
    } else if (have == null || have < 0) {
      head = fmt(p50);
      unit = 'pulls for a 50% chance';
      line = 'Luckiest 5% finish by ' + hi(fmt(p05)) + '. 20% by ' + hi(fmt(p20)) +
        '. Average is ' + hi(fmt(avg)) + ', and that still leaves almost half short. ' +
        '80% need ' + hi(fmt(p80)) + '. 95% need ' + hi(fmt(p95)) + '.';
      dist.hidden = true;
      dist.innerHTML = '';
    } else {
      var n = Math.min(1000000, Math.floor(have));
      var expected = pity ? n / mom.mean : n * p;
      var chance = reachChance(n, k, p, pity, cdf);
      head = haul(expected);
      unit = 'copies from ' + fmt(n) + ' pulls';
      if (chance >= 0.5) {
        line = k + ' or more happens ' + hi(fmtPct(chance)) + ' of the time. ' +
          'The slow 20% still need ' + hi(fmt(p80)) + '. 95% need ' + hi(fmt(p95)) + '.';
      } else if (chance >= 0.005) {
        line = k + ' or more from ' + fmt(n) + ' pulls happens ' + hi(fmtPct(chance)) +
          ' of the time. About 1 in ' + hi(fmt(oneIn(chance))) + '.';
      } else {
        line = k + ' copies from ' + fmt(n) + ' pulls almost never happens.';
      }
      paintDist(n, k, p, pity);
    }
    result.innerHTML = '<b>' + head + '</b><span class="tools-unit">' + unit + '</span><p>' + line + '</p>';
  }

  var roseVid = document.getElementById('roseVid');
  var ticketTray = document.getElementById('ticketTray');
  var pullBtn = document.getElementById('pullBtn');
  var hadPull = false;
  var flyToken = 0;

  function ticketSrc() {
    return banner === 'divination' ? 'assets/tools/ticket-divine.webp' : 'assets/tools/ticket-summon.webp';
  }

  function showTickets() {
    hadPull = false;
    flyToken++;
    ticketTray.hidden = false;
    ticketTray.className = 'ticket-tray';
    var src = ticketSrc();
    var html = '';
    var i;
    for (i = 0; i < 10; i++) html += '<img src="' + src + '" alt="">';
    ticketTray.innerHTML = html;
    pullRow.hidden = true;
    pullRow.innerHTML = '';
    pullRow.className = 'pull-row';
    pullTally.hidden = true;
    pullBtn.textContent = banner === 'divination' ? 'Divine x10' : 'Summon x10';
  }

  function resetStage() {
    try { roseVid.pause(); } catch (e) {}
    showTickets();
  }

  function playRose() {
    if (!roseVid.paused && !roseVid.ended && roseVid.currentTime > 0) return;
    try {
      roseVid.currentTime = 0;
      var play = roseVid.play();
      if (play && play.catch) play.catch(function () {});
    } catch (e) {}
  }

  function revealDrops(got, tally) {
    pullRow.className = 'pull-row';
    pullRow.innerHTML = got.map(function (row) {
      var hit = row[0] === current().file ? ' class="hit"' : '';
      return '<img' + hit + ' src="assets/tools/' + row[0] + '.webp?v=7" alt="' + row[1] + '">';
    }).join('');
    pullRow.hidden = false;
    ticketTray.hidden = true;
    void pullRow.offsetWidth;
    pullRow.className = 'pull-row in';
    pullTally.hidden = false;
    pullTally.textContent = Object.keys(tally).map(function (name) {
      return tally[name] + ' ' + name;
    }).join(' · ');
  }

  function testPulls() {
    if (mode !== 'duel') return;
    playRose();
    var rows = current().pool;
    var weight = 0;
    var i;
    for (i = 0; i < rows.length; i++) weight += rows[i][2];
    var got = [];
    var tally = {};
    for (i = 0; i < 10; i++) {
      var r = Math.random() * weight;
      var acc = 0;
      var pick = rows[rows.length - 1];
      var j;
      for (j = 0; j < rows.length; j++) {
        acc += rows[j][2];
        if (r < acc) { pick = rows[j]; break; }
      }
      got.push(pick);
      tally[pick[1]] = (tally[pick[1]] || 0) + 1;
    }
    if (!hadPull) {
      hadPull = true;
      ticketTray.classList.add('fly');
      var token = ++flyToken;
      setTimeout(function () {
        if (token !== flyToken) return;
        revealDrops(got, tally);
      }, 320);
    } else {
      flyToken++;
      revealDrops(got, tally);
    }
  }

  document.getElementById('pullBtn').addEventListener('click', testPulls);
  document.getElementById('calcBtn').addEventListener('click', function () {
    paint(true);
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  showTickets();
  paintLoot(null);
})();
