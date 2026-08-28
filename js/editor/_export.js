/* RankMe editor · PNG export */

async function exportPNGBlob(){
  // Reuse export pipeline into blob without download
  return new Promise(async (resolve, reject) => {
    try{
      await exportPNG(true, resolve);
    }catch(e){ reject(e); }
  });
}

async function exportPNG(returnBlobOnly, blobCb, forceSize){
  sanitizeState();
  if(!returnBlobOnly) showToast(forceSize ? 'Exporting…' : 'Exporting…');
  const scale = 2; // pixel density / quality
  // Layout follows Size slider (or forced max for premium export)
  const sliderEl = document.getElementById('sizeSlider');
  const sliderMax = parseInt(sliderEl?.max || '100', 10);
  const uiSize = forceSize != null
    ? Math.min(sliderMax, Math.max(40, forceSize))
    : parseInt(sliderEl?.value || '64', 10);
  let cardW;
  if(CARD_SHAPE === 'landscape'){
    const minS = SIZE_MIN, maxS = SIZE_MAX, minPx = 72, maxPx = 260;
    let t = (uiSize - minS) / (maxS - minS);
    if(t < 0) t = 0; if(t > 1) t = 1;
    cardW = Math.round(minPx + t * (maxPx - minPx));
  } else {
    cardW = Math.round(Math.min(140, Math.max(48, uiSize * 1.15)));
  }
  const isSquareCard = CARD_SHAPE === 'square' || document.body.classList.contains('card-square');
  const cardH = Math.round(cardW * (isSquareCard ? 1 : (CARD_ASPECT || 1.35)));
  const cardGap = 8;
  const padX = 14;
  const padY = 12;
  const labelW = 150;
  const padRight = 20;
  const MAX_W = 1600;

  // Content-aware width: only as wide as needed for cards (no empty right void)
  const maxCards = Math.max(1, ...state.tiers.map(t => (state.assignment[t.id]||[]).length));
  const maxFit = Math.max(1, Math.floor((MAX_W - labelW - padX - padRight + cardGap) / (cardW + cardGap)));
  const cardsPerLine = Math.min(maxCards, maxFit);
  const width = Math.max(640, labelW + padX + cardsPerLine * (cardW + cardGap) - cardGap + padRight);

  const allIds = new Set();
  state.tiers.forEach(tier => (state.assignment[tier.id]||[]).forEach(id => allIds.add(id)));
  const imgCache = {};
  await Promise.all([...allIds].map(async cid => {
    try {
      const custom = state.customCards && state.customCards[cid];
      const src = custom ? custom.src : cardSrc(cid);
      const img = await loadImage(src);
      if(img && (img.naturalWidth || img.width)) imgCache[Number(cid)] = img;
    } catch(e) { console.warn('export img', cid, e); }
  }));

  const rowHeights = state.tiers.map(tier => {
    const n = (state.assignment[tier.id]||[]).length;
    const lines = Math.max(1, Math.ceil(n / cardsPerLine) || 1);
    return Math.max(padY*2 + cardH, padY*2 + lines * cardH + Math.max(0, lines-1)*cardGap);
  });
  const padTop = 20;
  const footH = 72;
  const height = padTop + rowHeights.reduce((a,b)=>a+b, 0) + footH;

  const canvas = document.getElementById('exportCanvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  // Clean dark background
  ctx.fillStyle = '#0e0c14';
  ctx.fillRect(0, 0, width, height);
  const g1 = ctx.createRadialGradient(width*0.5, 0, 0, width*0.5, 0, height*0.45);
  g1.addColorStop(0, 'rgba(160,120,220,0.07)');
  g1.addColorStop(1, 'rgba(160,120,220,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, width, height);

  let y = padTop;
  for(let i = 0; i < state.tiers.length; i++){
    const tier = state.tiers[i];
    const rh = rowHeights[i];

    // Premium label: rich color, muted neon (lower sat, deeper stops)
    const baseSat = Number(tier.sat);
    const baseLight = Number(tier.light);
    const sat = Math.min(52, Math.max(32, Math.round((Number.isFinite(baseSat) ? baseSat : 50) * 0.72)));
    const lightTop = Math.min(52, Math.max(42, Math.round((Number.isFinite(baseLight) ? baseLight : 55) * 0.55 + 18)));
    const lightMid = Math.max(36, lightTop - 6);
    const lightBot = Math.max(28, lightTop - 14);
    const satMid = Math.max(28, sat - 4);
    const satBot = Math.max(26, sat - 6);
    const grad = ctx.createLinearGradient(0, y, 0, y + rh);
    grad.addColorStop(0, `hsl(${tier.hue}, ${sat}%, ${lightTop}%)`);
    grad.addColorStop(0.55, `hsl(${tier.hue}, ${satMid}%, ${lightMid}%)`);
    grad.addColorStop(1, `hsl(${tier.hue}, ${satBot}%, ${lightBot}%)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, labelW, rh);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    fitAndWrap(ctx, tier.name, labelW/2, y + rh/2, labelW - 16, 11, Math.min(22, Math.round(cardW*0.28)));

    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.fillRect(labelW, y, width - labelW, rh);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + rh - 0.5);
    ctx.lineTo(width, y + rh - 0.5);
    ctx.stroke();

    const ids = state.assignment[tier.id] || [];
    const lines = Math.max(1, Math.ceil(ids.length / cardsPerLine));
    let x = labelW + padX;
    let cy = y + (lines > 1 ? padY : Math.max(padY, (rh - cardH) / 2));
    let col = 0;
    for(const cid of ids){
      const img = imgCache[Number(cid)] || imgCache[cid];
      if(img){
        try {
          const r = CARD_SHAPE === 'landscape'
            ? Math.max(2, Math.min(4, Math.round(cardW * 0.015)))
            : Math.max(6, Math.round(cardW * (CARD_SHAPE === 'square' ? 0.14 : 0.12)));
          ctx.save();
          ctx.beginPath();
          if(ctx.roundRect) ctx.roundRect(x, cy, cardW, cardH, r);
          else ctx.rect(x, cy, cardW, cardH);
          if(CARD_SHAPE === 'square' || THEME_GOLD){
            ctx.fillStyle = 'rgba(24,18,36,0.95)';
            ctx.fill();
          } else {
            ctx.fillStyle = 'rgba(255,255,255,0.04)';
            ctx.fill();
          }
          ctx.clip();
          // contain: keep image aspect, center in card (no stretch)
          (function(){
            const iw = img.naturalWidth || img.width || 1;
            const ih = img.naturalHeight || img.height || 1;
            const ir = iw / ih;
            const br = cardW / cardH;
            let dw, dh, dx, dy;
            if(ir > br){
              dw = cardW; dh = cardW / ir;
              dx = x; dy = cy + (cardH - dh) / 2;
            } else {
              dh = cardH; dw = cardH * ir;
              dx = x + (cardW - dw) / 2; dy = cy;
            }
            ctx.drawImage(img, dx, dy, dw, dh);
          })();
          ctx.restore();
          if(CARD_SHAPE === 'square' || THEME_GOLD){
            ctx.save();
            ctx.beginPath();
            if(ctx.roundRect) ctx.roundRect(x + 0.5, cy + 0.5, cardW - 1, cardH - 1, CARD_SHAPE === 'landscape' ? r : Math.max(5, r - 1));
            else ctx.rect(x + 0.5, cy + 0.5, cardW - 1, cardH - 1);
            ctx.strokeStyle = THEME_GOLD ? 'rgba(201,168,240,0.55)' : 'rgba(220,180,120,0.4)';
            ctx.lineWidth = Math.max(1, Math.min(1.5, cardW * 0.012));
            ctx.stroke();
            ctx.restore();
          }
        } catch(e){}
      }
      col++;
      if(col >= cardsPerLine){
        col = 0;
        x = labelW + padX;
        cy += cardH + cardGap;
      } else {
        x += cardW + cardGap;
      }
    }
    y += rh;
  }

  // Footer - epic minimal bar
  const footY = y;
  const midY = footY + footH / 2;
  // deep base
  ctx.fillStyle = '#161222';
  ctx.fillRect(0, footY, width, footH);
  // soft horizontal brand wash
  const wash = ctx.createLinearGradient(0, footY, width, footY);
  wash.addColorStop(0, 'rgba(150,110,230,0.16)');
  wash.addColorStop(0.5, 'rgba(200,160,240,0.06)');
  wash.addColorStop(1, 'rgba(130,150,230,0.14)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, footY, width, footH);
  // gentle center bloom
  const bloom = ctx.createRadialGradient(width/2, midY, 8, width/2, midY, Math.max(120, width*0.22));
  bloom.addColorStop(0, 'rgba(220,190,255,0.14)');
  bloom.addColorStop(1, 'rgba(220,190,255,0)');
  ctx.fillStyle = bloom;
  ctx.fillRect(0, footY, width, footH);
  // thin top edge glow
  const edge = ctx.createLinearGradient(0, footY, width, footY);
  edge.addColorStop(0, 'rgba(183,155,240,0)');
  edge.addColorStop(0.5, 'rgba(220,190,255,0.45)');
  edge.addColorStop(1, 'rgba(183,155,240,0)');
  ctx.fillStyle = edge;
  ctx.fillRect(0, footY, width, 1.5);

  // Left: RANKME.LOL
  const titleGrad = ctx.createLinearGradient(28, midY, 240, midY);
  titleGrad.addColorStop(0, '#f0e6ff');
  titleGrad.addColorStop(1, '#c4b5e8');
  ctx.fillStyle = titleGrad;
  ctx.font = '900 22px Montserrat, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('RANKME.LOL', 36, midY);

  // Center logo
  let logoW = 88;
  try {
    const flogo = await loadImage('assets/brand/Footer_logo.webp');
    const lh = 36;
    const lw = lh * (flogo.naturalWidth || flogo.width) / (flogo.naturalHeight || flogo.height || 1);
    logoW = lw;
    ctx.drawImage(flogo, (width - lw) / 2, midY - lh / 2, lw, lh);
  } catch(e) {
    try {
      const flogo = await loadImage('assets/brand/Footer_logo.svg');
      const lh = 36;
      const lw = lh * (flogo.naturalWidth || flogo.width || 2) / (flogo.naturalHeight || flogo.height || 1);
      logoW = lw;
      ctx.drawImage(flogo, (width - lw) / 2, midY - lh / 2, lw, lh);
    } catch(e2) {}
  }

  // Right: title stays in its column — never crosses the logo
  const listTitleEl = document.getElementById('heroTitle');
  const customTitle = (listTitleEl && listTitleEl.textContent || '').trim();
  const rightLabel = BLANK_MODE
    ? (customTitle || 'Custom Tier List')
    : (TEMPLATE_FOOTER || TEMPLATE_TITLE || 'RankMe');
  const rightX = width - 36;
  const logoRight = (width + logoW) / 2;
  const titleMaxW = Math.min(280, Math.max(96, rightX - logoRight - 16));
  ctx.fillStyle = '#f0eafc';
  drawRightFitted(ctx, rightLabel, rightX, midY - (BLANK_MODE ? 0 : 11), titleMaxW, 11, 14, BLANK_MODE ? 2 : 1);

  if(!BLANK_MODE){
    const badge = 'EXCLUSIVE';
    ctx.font = '800 10px Montserrat, system-ui, sans-serif';
    const bw = ctx.measureText(badge).width + 26;
    const bh = 20;
    const bx = width - 36 - bw;
    const by = midY + 5;
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 10);
    else ctx.rect(bx, by, bw, bh);
    const badgeStroke = ctx.createLinearGradient(bx, by, bx+bw, by);
    badgeStroke.addColorStop(0, 'rgba(183,155,240,0.85)');
    badgeStroke.addColorStop(1, 'rgba(230,169,232,0.85)');
    ctx.strokeStyle = badgeStroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(180,150,230,0.12)';
    ctx.fill();
    ctx.fillStyle = '#e0d4f8';
    ctx.textAlign = 'center';
    ctx.fillText(badge, bx + bw/2, by + bh/2 + 1);
  }

  canvas.toBlob(blob => {
    if(!blob){
      if(blobCb) blobCb(null);
      else showToast('Export failed');
      return;
    }
    if(returnBlobOnly && blobCb){ blobCb(blob); return; }
    const a = document.createElement('a');
    a.download = BLANK_MODE ? 'rankme-tierlist.png' : (TEMPLATE_EXPORT || 'rankme-sf-duel-tierlist.png');
    a.href = URL.createObjectURL(blob);
    a.click();
    showToast('PNG downloaded');
  }, 'image/png', 0.95);
}

function drawRightFitted(ctx, text, x, y, maxW, minSize, maxSize, maxLines){
  const raw = String(text || '').replace(/\s+/g, ' ').trim() || 'RankMe';
  let size = maxSize;
  let lines = [raw];
  while(size >= minSize){
    ctx.font = '800 ' + size + 'px Montserrat, system-ui, sans-serif';
    lines = wrapFooterLines(ctx, raw, maxW, maxLines);
    const ok = lines.length <= maxLines && lines.every(function (l) {
      return ctx.measureText(l).width <= maxW + 0.5;
    });
    if(ok) break;
    size--;
  }
  ctx.font = '800 ' + size + 'px Montserrat, system-ui, sans-serif';
  lines = wrapFooterLines(ctx, raw, maxW, maxLines);
  const lh = size * 1.18;
  const startY = y - ((lines.length - 1) * lh) / 2;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  lines.forEach(function (l, i) { ctx.fillText(l, x, startY + i * lh); });
}

function wrapFooterLines(ctx, text, maxW, maxLines){
  function fits(s){ return ctx.measureText(s).width <= maxW; }
  function ellipsize(s){
    if(fits(s)) return s;
    var t = s;
    while(t.length > 1 && !fits(t + '…')) t = t.slice(0, -1);
    return (t || s.slice(0, 1)) + '…';
  }
  var words = String(text).split(/\s+/).filter(Boolean);
  var lines = [];
  var cur = '';
  function push(s){
    if(!s) return;
    if(lines.length >= maxLines) return;
    if(lines.length === maxLines - 1 && !fits(s)) lines.push(ellipsize(s));
    else lines.push(s);
  }
  for(var w = 0; w < words.length; w++){
    if(lines.length >= maxLines) break;
    var word = words[w];
    var trial = cur ? cur + ' ' + word : word;
    if(fits(trial)){ cur = trial; continue; }
    if(cur){
      push(cur);
      cur = '';
      if(lines.length >= maxLines) break;
    }
    if(fits(word)){ cur = word; continue; }
    var rest = word;
    while(rest && lines.length < maxLines){
      var i = rest.length;
      while(i > 1 && !fits(rest.slice(0, i))) i--;
      if(lines.length === maxLines - 1){
        push(rest);
        rest = '';
        break;
      }
      lines.push(rest.slice(0, i));
      rest = rest.slice(i);
    }
  }
  if(cur && lines.length < maxLines) push(cur);
  if(!lines.length) lines.push(ellipsize(text));
  return lines.map(ellipsize);
}

function fitAndWrap(ctx, text, x, y, maxWidth, minSize, maxSize){
  const raw = String(text || '').replace(/\r/g, '').trim() || 'ROW';
  // Explicit newlines from editor → one canvas line each, own size
  if(raw.includes('\n')){
    const parts = raw.split('\n');
    const sized = parts.map(function(line){
      let size = labelLineFontSize(line);
      size = Math.max(minSize, Math.min(maxSize, size));
      ctx.font = '800 ' + size + 'px Montserrat, system-ui, sans-serif';
      // Shrink if a single line is wider than label
      while(size > minSize && ctx.measureText(line).width > maxWidth){
        size -= 1;
        ctx.font = '800 ' + size + 'px Montserrat, system-ui, sans-serif';
      }
      return { line: line.length ? line : ' ', size };
    });
    const totalH = sized.reduce(function(a, s){ return a + s.size * 1.15; }, 0);
    let cy = y - totalH / 2;
    sized.forEach(function(s){
      ctx.font = '800 ' + s.size + 'px Montserrat, system-ui, sans-serif';
      cy += s.size * 1.15 / 2;
      ctx.fillText(s.line, x, cy);
      cy += s.size * 1.15 / 2;
    });
    return;
  }
  let size = maxSize;
  let lines = [raw];
  while(size >= minSize){
    ctx.font = `800 ${size}px Montserrat, system-ui, sans-serif`;
    lines = wrapLines(ctx, raw, maxWidth);
    if(lines.length <= 3) break;
    size--;
  }
  ctx.font = `800 ${size}px Montserrat, system-ui, sans-serif`;
  lines = wrapLines(ctx, raw, maxWidth);
  const lh = size * 1.12;
  const startY = y - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, startY + i * lh));
}
function wrapLines(ctx, text, maxWidth){
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  const pushChunk = (chunk)=>{
    if(!chunk) return;
    if(ctx.measureText(chunk).width <= maxWidth){
      if(line && ctx.measureText(line + ' ' + chunk).width <= maxWidth){
        line = line + ' ' + chunk;
      } else {
        if(line) lines.push(line);
        line = chunk;
      }
      return;
    }
    // Long unbroken string - split by characters
    if(line){ lines.push(line); line = ''; }
    let buf = '';
    for(const ch of chunk){
      const t = buf + ch;
      if(ctx.measureText(t).width > maxWidth && buf){
        lines.push(buf);
        buf = ch;
      } else buf = t;
    }
    if(buf) line = buf;
  };
  for(const w of words) pushChunk(w);
  if(line) lines.push(line);
  return lines.length ? lines : [''];
}

function loadImage(src){
  return new Promise((res, rej)=>{
    const img = new Image();
    img.onload = ()=>res(img);
    img.onerror = ()=>rej(new Error('fail '+src));
    img.src = src;
  });
}

// Strict match only - never substring match on id (was causing wrong/dupe cards in PNG)
function getCardImage(cid){
  const meta = CARD_META[cid];
  const custom = state.customCards && state.customCards[cid];
  if(custom && custom.src){
    const els = document.querySelectorAll('img');
    for(const el of els){
      if(el.complete && el.naturalWidth > 0 && el.getAttribute('src') === custom.src) return el;
    }
    return null;
  }
  if(!meta) return null;
  const file = meta.file; // e.g. card_046.webp
  const els = document.querySelectorAll('img');
  for(const el of els){
    if(!el.complete || el.naturalWidth <= 0) continue;
    const attr = el.getAttribute('src') || '';
    if(attr === cardSrc(cid) || attr.endsWith('/'+file) || attr.endsWith(file)) return el;
    try{
      const u = new URL(el.src, location.href);
      if(u.pathname.endsWith('/'+file) || u.pathname.endsWith(file)) return el;
    }catch(e){}
  }
  return null;
}
