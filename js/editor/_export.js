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
  const cardGap = 6;
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
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

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
    ctx.fillStyle = '#1a1728';
    ctx.fillRect(0, y, width, rh);
    fillTierCube(ctx, 0, y, labelW, rh, tier);
    drawTierName(ctx, tier.name, labelW / 2, y + rh / 2, labelW - 20, rh - 12);

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
        try { drawExportCard(ctx, x, cy, cardW, cardH, img, isSquareCard); }
        catch(e){ console.warn('export card', cid, e); }
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

function cssAngleGradient(ctx, x, y, w, h, deg){
  const r = deg * Math.PI / 180;
  const vx = Math.sin(r);
  const vy = -Math.cos(r);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const half = 0.5 * (Math.abs(w * vx) + Math.abs(h * vy));
  return ctx.createLinearGradient(cx - vx * half, cy - vy * half, cx + vx * half, cy + vy * half);
}

function fillTierCube(ctx, x, y, w, h, tier){
  const hue = Number(tier.hue) || 0;
  const sat = Number.isFinite(Number(tier.sat)) ? Number(tier.sat) : 50;
  const light = Number.isFinite(Number(tier.light)) ? Number(tier.light) : 55;
  const color = function(a){
    return 'hsla(' + hue + ', ' + sat + '%, ' + light + '%, ' + a + ')';
  };
  const g = cssAngleGradient(ctx, x, y, w, h, 105);
  g.addColorStop(0, color(0.95));
  g.addColorStop(0.48, color(0.72));
  g.addColorStop(1, color(0.42));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.fillRect(x, y, w, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(x, y + h - 1, w, 1);
}

function drawTierName(ctx, name, cx, cy, maxW, maxH){
  const raw = String(name || '').replace(/\r/g, '').trim() || 'ROW';
  const parts = raw.split('\n');
  const sized = parts.map(function(line){
    let size = labelLineFontSize(line, true);
    const text = (line || ' ').toUpperCase();
    ctx.font = '800 ' + size + 'px Montserrat, system-ui, sans-serif';
    while(size > 8 && ctx.measureText(text).width > maxW){
      size -= 1;
      ctx.font = '800 ' + size + 'px Montserrat, system-ui, sans-serif';
    }
    return { text: line.length ? text : ' ', size: size };
  });
  const lead = 1.15;
  let totalH = sized.reduce(function(a, s){ return a + s.size * lead; }, 0);
  if(totalH > maxH){
    const k = maxH / totalH;
    sized.forEach(function(s){ s.size = Math.max(8, Math.round(s.size * k)); });
    totalH = sized.reduce(function(a, s){ return a + s.size * lead; }, 0);
  }
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  let ty = cy - totalH / 2;
  sized.forEach(function(s){
    ctx.font = '800 ' + s.size + 'px Montserrat, system-ui, sans-serif';
    ty += s.size * lead / 2;
    ctx.fillText(s.text, cx, ty);
    ty += s.size * lead / 2;
  });
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
}

function exportRound(ctx, x, y, w, h, r){
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if(ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function drawContained(ctx, img, x, y, w, h){
  const iw = img.naturalWidth || img.width || 1;
  const ih = img.naturalHeight || img.height || 1;
  const ir = iw / ih;
  const br = w / h;
  let dw, dh, dx, dy;
  if(ir > br){
    dw = w; dh = w / ir;
    dx = x; dy = y + (h - dh) / 2;
  } else {
    dh = h; dw = h * ir;
    dx = x + (w - dw) / 2; dy = y;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawExportCard(ctx, x, y, w, h, img, isSquare){
  const landscape = CARD_SHAPE === 'landscape';
  const inset = landscape ? Math.max(2, Math.round(w * 0.02)) : 3;
  const r = landscape
    ? Math.max(3, Math.round(w * 0.04))
    : Math.max(6, Math.round(w * (isSquare ? 0.14 : 0.12)));
  const ir = Math.max(2, r - inset);
  const plate = ctx.createLinearGradient(x, y, x + w * 0.2, y + h);
  if(THEME_GOLD){
    plate.addColorStop(0, '#1e1a2c');
    plate.addColorStop(1, '#100e18');
  } else if(isSquare){
    plate.addColorStop(0, '#2e2640');
    plate.addColorStop(1, '#16121f');
  } else {
    plate.addColorStop(0, '#322a52');
    plate.addColorStop(0.55, '#1a1528');
    plate.addColorStop(1, '#12101a');
  }
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.beginPath();
  exportRound(ctx, x, y, w, h, r);
  ctx.fillStyle = plate;
  ctx.fill();
  ctx.restore();

  const ix = x + inset, iy = y + inset, iw = Math.max(1, w - inset * 2), ih = Math.max(1, h - inset * 2);
  ctx.save();
  ctx.beginPath();
  exportRound(ctx, ix, iy, iw, ih, ir);
  ctx.clip();
  drawContained(ctx, img, ix, iy, iw, ih);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  exportRound(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
  ctx.strokeStyle = THEME_GOLD
    ? 'rgba(201,168,240,0.55)'
    : isSquare
      ? 'rgba(220,180,120,0.5)'
      : 'rgba(180,140,240,0.38)';
  ctx.lineWidth = THEME_GOLD ? 1.5 : 1;
  ctx.stroke();
  ctx.restore();
}

function loadImage(src){
  return new Promise((res, rej)=>{
    const img = new Image();
    img.onload = ()=>res(img);
    img.onerror = ()=>rej(new Error('fail '+src));
    img.src = src;
  });
}
