/* LUMEN & LOOM — storefront logic.
   Hash router (#/, shop.html, product.html?id=:id, cart.html, checkout.html, about.html),
   cart state persisted to localStorage, filters, PDP interactions, checkout simulation. */
(() => {
'use strict';

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$' + (Number.isInteger(n) ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const byId = id => PRODUCTS.find(p => p.id === id);
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};
const stockOf = (p, size) => (p.stock[size] ?? 0);
const totalStock = p => Object.values(p.stock).reduce((a, b) => a + b, 0);
const sizesOf = p => Object.keys(p.stock);
const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

const FAMILIES = {
  Brown: { h: '#4a3326', names: ['Espresso', 'Cocoa', 'Tobacco', 'Tan', 'Sable'] },
  Green: { h: '#4f5232', names: ['Olive', 'Moss', 'Lichen', 'Pine'] },
  Neutral: { h: '#cdbf9f', names: ['Oat', 'Bone', 'Flax', 'Stone', 'Fog', 'Sand', 'Parchment'] },
  Amber: { h: '#b8651b', names: ['Amber', 'Clay', 'Rust', 'Rust check', 'Burnt amber', 'Ember'] },
  Dark: { h: '#26262b', names: ['Ink', 'Charcoal', 'Midnight'] },
};

/* ---------- state ---------- */
const state = {
  cart: store.get('ll.cart', []).filter(i => byId(i.id)),
  promo: store.get('ll.promo', null),
  ship: store.get('ll.ship', { country: 'US', method: 'std', zip: '' }),
  filters: { cats: [], sizes: [], colors: [], max: 500, sort: 'featured' },
  pdp: { id: null, size: null, color: 0, img: 0 },
  ck: { step: 1, data: {}, err: {}, order: null, busy: false },
  promoMsg: null,
};
const save = () => { store.set('ll.cart', state.cart); store.set('ll.promo', state.promo); store.set('ll.ship', state.ship); };

/* ---------- cart maths ---------- */
const keyOf = (id, size, color) => `${id}|${size}|${color}`;
function lines() {
  return state.cart.map(i => {
    const p = byId(i.id);
    return { ...i, p, key: keyOf(i.id, i.size, i.color), total: p.price * i.qty };
  });
}
const cartCount = () => state.cart.reduce((a, i) => a + i.qty, 0);
function totals() {
  const L = lines();
  const subtotal = L.reduce((a, l) => a + l.total, 0);
  const promo = state.promo ? PROMOS[state.promo] : null;
  const discount = promo && promo.type === 'pct' ? Math.round(subtotal * promo.value) / 100 : 0;
  const after = subtotal - discount;
  const zone = SHIPPING[state.ship.country] || SHIPPING.ROW;
  const free = after >= FREE_SHIPPING_OVER || (promo && promo.type === 'ship');
  const cost = m => (subtotal === 0 ? 0 : (m === 'std' && free ? 0 : zone[m]));
  const shipping = cost(state.ship.method);
  return { L, subtotal, discount, after, shipping, free, cost, zone, total: after + shipping, toFree: Math.max(0, FREE_SHIPPING_OVER - after) };
}

function addToCart(id, size, color = 0, qty = 1) {
  const p = byId(id);
  const max = stockOf(p, size);
  if (!max) return toast('That size is sold out.');
  const k = keyOf(id, size, color);
  const ex = state.cart.find(i => keyOf(i.id, i.size, i.color) === k);
  if (ex) {
    if (ex.qty + qty > max) { ex.qty = max; toast(`Only ${max} available in ${size}.`); } else ex.qty += qty;
  } else state.cart.push({ id, size, color, qty: Math.min(qty, max) });
  try { sessionStorage.removeItem('ll.order'); } catch { /* ignore */ }
  save(); cartChanged(true); openDrawer('cartDrawer');
}
function changeQty(key, d) {
  const i = state.cart.find(x => keyOf(x.id, x.size, x.color) === key);
  if (!i) return;
  const max = stockOf(byId(i.id), i.size);
  i.qty = Math.max(0, Math.min(max, i.qty + d));
  if (d > 0 && i.qty === max) toast(`That is the last ${max} in ${i.size}.`);
  if (i.qty === 0) state.cart = state.cart.filter(x => x !== i);
  save(); cartChanged();
}
function removeItem(key) { state.cart = state.cart.filter(x => keyOf(x.id, x.size, x.color) !== key); save(); cartChanged(); }

function cartChanged(bump) {
  const c = $('#cartCount'); c.textContent = cartCount();
  if (bump) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
  drawDrawer();
  if (current.name === 'cart') drawCart();
  if (current.name === 'checkout' && state.ck.step < 4) { drawCheckoutSummary(); }
}

/* ---------- shared fragments ---------- */
const ph = (imgId, tone, mark, { w = 900, cls = '', alt = '', extra = '' } = {}) =>
  `<div class="ph ${cls}" style="--tone:${tone}" data-mark="${esc(mark)}">${imgId ? `<img src="${U(imgId, w)}" alt="${esc(alt)}" loading="lazy" onerror="this.remove()">` : ''}${extra}</div>`;

const badge = b => b ? `<span class="tag badge ${b.startsWith('Limited') ? 'ltd' : ''}">${b}</span>` : '';
const stars = r => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
const dots = p => `<span class="dots">${p.colors.map(c => `<i class="dot" style="--c:${c.h}" title="${c.n}"></i>`).join('')}</span>`;

function card(p) {
  const sold = totalStock(p) === 0;
  const sizes = sizesOf(p);
  const single = sizes.length === 1;
  const qa = sold
    ? `<button class="qa-btn" disabled>Sold out</button>`
    : single
      ? `<button class="qa-btn" data-action="qa-add" data-id="${p.id}" data-size="${sizes[0]}">Quick add</button>`
      : `<button class="qa-btn" data-action="qa-open">Quick add</button>
         <div class="sizes">${sizes.map(s => `<button class="sz" data-action="qa-add" data-id="${p.id}" data-size="${s}" ${stockOf(p, s) ? '' : 'disabled'} aria-label="Add size ${s}">${s}</button>`).join('')}</div>`;
  return `<article class="pcard">
    <div class="media zoom">
      <a href="product.html?id=${p.id}" style="position:absolute;inset:0;display:block" aria-label="${esc(p.name)}">
        ${ph(p.imgs[0], p.tone, p.name, { w: 700, alt: p.name, extra: `<img class="alt" src="${U(p.imgs[1], 700)}" alt="" loading="lazy" onerror="this.remove()">` })}
      </a>
      ${badge(p.badge)}
      <div class="qa" data-qa>${qa}</div>
    </div>
    <div class="info">
      <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
      <span class="pr">${money(p.price)}</span>
      <div class="sub">${dots(p)}<span>${p.cat}</span></div>
    </div>
  </article>`;
}

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 2600);
}

/* ---------- drawers ---------- */
function openDrawer(id) {
  closeAll(true);
  const d = $('#' + id); d.classList.add('on'); d.setAttribute('aria-hidden', 'false');
  $('#scrim').classList.add('on'); document.body.style.overflow = 'hidden';
  if (id === 'cartDrawer') drawDrawer();
  setTimeout(() => (d.querySelector('.x') || d).focus?.(), 60);
}
function closeAll(keep) {
  $$('.drawer').forEach(d => { d.classList.remove('on'); d.setAttribute('aria-hidden', 'true'); });
  if (!keep) { $('#scrim').classList.remove('on'); document.body.style.overflow = ''; }
}

function lineHTML(l, full) {
  const c = l.p.colors[l.color] || l.p.colors[0];
  return `<div class="line">
    <a href="product.html?id=${l.p.id}">${ph(l.p.imgs[0], l.p.tone, l.p.name, { w: 300, alt: l.p.name })}</a>
    <div>
      <h4><a href="product.html?id=${l.p.id}">${l.p.name}</a></h4>
      <div class="meta">${c.n}${l.size === 'OS' ? '' : ' / ' + l.size}</div>
      <div class="qty" role="group" aria-label="Quantity">
        <button data-action="qty" data-key="${l.key}" data-d="-1" aria-label="Decrease quantity">&minus;</button>
        <span>${l.qty}</span>
        <button data-action="qty" data-key="${l.key}" data-d="1" aria-label="Increase quantity">+</button>
      </div><br>
      <button class="rm" data-action="remove" data-key="${l.key}">Remove</button>
    </div>
    <div class="price">${money(l.total)}${l.qty > 1 ? `<div class="small">${money(l.p.price)} each</div>` : ''}</div>
  </div>`;
}
const freebar = t => t.subtotal === 0 ? '' : `<div class="freebar">${t.free ? 'Your order ships free.' : `Add <b>${money(t.toFree)}</b> for free shipping.`}
  <div class="trk"><i style="width:${Math.min(100, (t.after / FREE_SHIPPING_OVER) * 100)}%"></i></div></div>`;

function drawDrawer() {
  const t = totals();
  $('#drawerBody').innerHTML = t.L.length
    ? freebar(t) + t.L.map(l => lineHTML(l)).join('')
    : `<div class="empty"><h3>Your bag is empty</h3><p class="small">Pieces you add will wait here.</p><a class="btn" href="shop.html" data-action="close-all">Browse the shop</a></div>`;
  $('#drawerFoot').innerHTML = t.L.length
    ? `<div class="totals"><div><span>Subtotal</span><span>${money(t.subtotal)}</span></div><div class="small"><span>Shipping and promo codes at the next step</span></div></div>
       <a class="btn amber block" href="checkout.html" data-action="close-all">Checkout</a>
       <a class="btn ghost block" href="cart.html" data-action="close-all">View full bag</a>`
    : '';
  $('#drawerFoot').style.display = t.L.length ? '' : 'none';
}

/* ---------- views: home ---------- */
function viewHome() {
  const best = PRODUCTS.filter(p => p.best).slice(0, 4);
  return `
  <section class="hero load">
    <div class="wrap">
      <div class="hero-copy">
        <h1><span class="l1">Cut slowly.</span><span class="l2">Worn for decades.</span></h1>
        <div class="hero-meta">
          <p>Coats, knitwear and tailoring made in editions of 80 to 400. Wool from Biella, linen from Normandy, every seam finished in Porto.</p>
          <a class="btn amber" href="shop.html">Shop Edition 14</a>
          <a class="link" href="about.html" style="align-self:center;color:var(--bone)">Read our story</a>
        </div>
      </div>
      <div class="hero-art">
        <div class="stamp">Edition<br>of 120</div>
        ${ph(IMG.hero, '#4a3a2e', 'Edition 14', { cls: 'main arch', alt: 'Model in a long coat', w: 1100 })}
        ${ph(IMG.heroSmall, '#6b3d2a', 'Wool, Biella', { cls: 'sm', alt: 'Folded wool garments', w: 500 })}
      </div>
      <div class="ed">Autumn / Winter 2026 &middot; Edition No. 14</div>
    </div>
  </section>

  <section class="statement wrap">
    <p class="big">We make fewer things, in better cloth, for people who intend to keep them. Each piece is numbered, repairable, and sewn by someone we can name.</p>
    <div class="side">
      <div><b>11 mills and ateliers</b>All within 1,800 km of the Porto studio.</div>
      <div><b>Free repairs, for life</b>Send it back. We re-hem, re-line and re-button.</div>
      <div><b>Cut to order, then stop</b>When an edition sells through, that is the end of it.</div>
    </div>
  </section>

  <section class="sec" style="padding-top:0">
    <div class="wrap sec-h">
      <h2 class="h2">Four collections,<br><em>one wardrobe</em></h2>
      <div class="rail-ctl">
        <button data-action="rail" data-d="-1" aria-label="Previous collections">&larr;</button>
        <button data-action="rail" data-d="1" aria-label="Next collections">&rarr;</button>
      </div>
    </div>
    <div class="rail" id="rail" tabindex="0" aria-label="Collections">
      ${COLLECTIONS.map(c => `<a class="col ${c.size} zoom" href="shop.html?cat=${c.cat}">
        ${ph(c.img, c.tone, c.name, { alt: c.name, w: 800 })}
        <div class="cap"><div><h3>${c.name}</h3><p class="note">${c.note}</p></div><span class="go">Shop ${c.cat.toLowerCase()}</span></div>
      </a>`).join('')}
    </div>
  </section>

  <section class="sec best">
    <div class="wrap">
      <div class="sec-h"><h2 class="h2">Most reordered</h2><a class="link" href="shop.html">See all ${PRODUCTS.length} pieces</a></div>
      <div class="best-grid">${best.map(card).join('')}</div>
    </div>
  </section>

  <section class="story">
    <div class="wrap">
      <div class="art">
        ${ph(IMG.story, '#5b5a3a', 'The Porto atelier', { cls: 'a arch', alt: 'Atelier worktable', w: 900 })}
        ${ph(IMG.storyB, '#4a3a2e', 'Hand finishing', { cls: 'b', alt: 'Hand finishing a garment', w: 500 })}
      </div>
      <div class="txt">
        <blockquote>&ldquo;A coat should get quieter the longer you own it.&rdquo;</blockquote>
        <p>Our founder, Inês Valadares, started the atelier with four sewing machines and one rule: if she would not wear it in ten years, it does not get made. Fourteen editions later the rule has not moved.</p>
        <a class="btn ghost" href="about.html">Meet the makers</a>
      </div>
    </div>
  </section>

  <section class="news">
    <div class="wrap in">
      <div>
        <h2 class="h2">New editions are announced <em>once</em>, by letter.</h2>
      </div>
      <form data-form="news" novalidate>
        <p class="small">One short letter when an edition opens. Early access for subscribers, 48 hours before the shop.</p>
        <div class="field" id="nf"><label for="nEmail">Email address</label><input id="nEmail" type="email" autocomplete="email" placeholder="you@example.com"><span class="em" id="nErr"></span></div>
        <button class="btn" type="submit">Join the letter</button>
        <p class="msg" id="nMsg" hidden></p>
      </form>
    </div>
  </section>`;
}

/* ---------- views: shop ---------- */
const CATS = [...new Set(PRODUCTS.map(p => p.cat))];
const ALLSIZES = [...SIZES, 'OS'];

function filtered() {
  const f = state.filters;
  let list = PRODUCTS.filter(p =>
    (!f.cats.length || f.cats.includes(p.cat)) &&
    p.price <= f.max &&
    (!f.sizes.length || f.sizes.some(s => stockOf(p, s) > 0)) &&
    (!f.colors.length || f.colors.some(fam => p.colors.some(c => FAMILIES[fam].names.includes(c.n)))));
  const s = f.sort;
  if (s === 'low') list.sort((a, b) => a.price - b.price);
  else if (s === 'high') list.sort((a, b) => b.price - a.price);
  else if (s === 'rated') list.sort((a, b) => b.rating - a.rating);
  else if (s === 'new') list.sort((a, b) => (b.badge === 'New Arrival') - (a.badge === 'New Arrival'));
  return list;
}

function viewShop() {
  return `
  <div class="wrap">
    <div class="phead">
      <div><div class="crumbs"><a href="index.html">Home</a><span>/</span><span>Shop</span></div>
      <h1 class="display" id="shopTitle">The shop</h1></div>
      <p class="lead" style="max-width:34ch">Every piece is cut in a numbered edition. When a size is gone, it stays gone.</p>
    </div>
    <div class="shop">
      <aside class="filters" id="filters" aria-label="Filters">
        <div class="fgroup"><h4>Category</h4><div class="chips" id="fCats"></div></div>
        <div class="fgroup"><h4>Size</h4><div class="chips" id="fSizes"></div></div>
        <div class="fgroup"><h4>Colour</h4><div class="chips" id="fColors" style="gap:.8rem"></div></div>
        <div class="fgroup"><h4>Price up to</h4>
          <input class="range" id="fMax" type="range" min="100" max="500" step="5" value="${state.filters.max}" aria-label="Maximum price">
          <div class="range-v"><span>$100</span><span id="fMaxV"></span></div></div>
        <button class="link" data-action="clear-filters" style="justify-self:start">Clear all filters</button>
      </aside>
      <div>
        <div class="tools">
          <div style="display:flex;gap:1rem;align-items:center"><button class="btn ghost f-toggle" data-action="filter-toggle" style="padding:.7em 1.2em">Filters</button><span class="small" id="resCount" aria-live="polite"></span></div>
          <label class="small">Sort <select id="fSort">
            <option value="featured">Featured</option><option value="new">New arrivals</option><option value="low">Price, low to high</option><option value="high">Price, high to low</option><option value="rated">Best rated</option>
          </select></label>
        </div>
        <div class="grid" id="shopGrid"></div>
      </div>
    </div>
  </div>`;
}
function drawFilters() {
  const f = state.filters;
  $('#fCats').innerHTML = CATS.map(c => `<button class="chip ${f.cats.includes(c) ? 'on' : ''}" data-action="f-toggle" data-k="cats" data-v="${c}" aria-pressed="${f.cats.includes(c)}">${c}</button>`).join('');
  $('#fSizes').innerHTML = ALLSIZES.map(s => `<button class="chip ${f.sizes.includes(s) ? 'on' : ''}" data-action="f-toggle" data-k="sizes" data-v="${s}" aria-pressed="${f.sizes.includes(s)}">${s === 'OS' ? 'One size' : s}</button>`).join('');
  $('#fColors').innerHTML = Object.entries(FAMILIES).map(([n, v]) => `<button class="sw ${f.colors.includes(n) ? 'on' : ''}" style="--c:${v.h}" data-action="f-toggle" data-k="colors" data-v="${n}" aria-label="${n}" aria-pressed="${f.colors.includes(n)}" title="${n}"></button>`).join('');
  $('#fMaxV').textContent = money(f.max);
  $('#fSort').value = f.sort;
}
function drawGrid() {
  const list = filtered();
  $('#shopGrid').innerHTML = list.length ? list.map(card).join('')
    : `<div class="none"><h3 class="h3">Nothing matches those filters</h3><p class="small">Try a higher price or fewer sizes.</p><button class="btn" data-action="clear-filters">Clear filters</button></div>`;
  $('#resCount').textContent = `${list.length} ${list.length === 1 ? 'piece' : 'pieces'}`;
  const only = state.filters.cats.length === 1 ? state.filters.cats[0] : null;
  $('#shopTitle').textContent = only || 'The shop';
}

/* ---------- views: product ---------- */
function reviewsFor(p) {
  const h = hash(p.id), n = 3;
  return Array.from({ length: n }, (_, i) => ({ ...REVIEW_POOL[(h + i * 2) % REVIEW_POOL.length], stars: i === 2 && p.rating < 4.6 ? 4 : 5, when: ['3 weeks ago', '2 months ago', '5 months ago'][i] }));
}
function dist(p) {
  const p5 = Math.min(.8, Math.max(.3, (p.rating - 3.5) * .5 + .25)), r = 1 - p5;
  const parts = [p5, r * .55, r * .25, r * .12, r * .08];
  const total = 24 + (hash(p.id) % 70);
  return { total, rows: parts.map((x, i) => ({ s: 5 - i, pct: Math.round(x * 100) })) };
}
function viewProduct(p) {
  state.pdp = { id: p.id, size: sizesOf(p).length === 1 ? sizesOf(p)[0] : null, color: 0, img: 0 };
  const d = dist(p), rv = reviewsFor(p);
  const rel = [...PRODUCTS.filter(x => x.id !== p.id && x.cat === p.cat), ...PRODUCTS.filter(x => x.id !== p.id && x.cat !== p.cat)].slice(0, 4);
  const sizes = sizesOf(p);
  const acc = [
    ['Details', `<ul>${p.details.map(x => `<li>${x}</li>`).join('')}</ul>`, true],
    ['Fabric', `<p>${p.fabric}</p>`],
    ['Care', `<p>${p.care}</p>`],
    ['Origin and shipping', `<p>${p.origin} Ships from Porto within 2 working days, in recycled paper. Returns accepted within 30 days if unworn. Repairs are free for life.</p>`],
  ];
  return `
  <div class="wrap">
    <div class="phead" style="padding-bottom:1.4rem"><div class="crumbs"><a href="index.html">Home</a><span>/</span><a href="shop.html">Shop</a><span>/</span><a href="shop.html?cat=${p.cat}">${p.cat}</a><span>/</span><span>${p.name}</span></div></div>
    <div class="pdp">
      <div class="gallery">
        <div class="thumbs" role="tablist" aria-label="Product images">
          ${p.imgs.map((im, i) => `<button class="thumb ${i === 0 ? 'on' : ''}" role="tab" data-action="thumb" data-i="${i}" aria-label="View image ${i + 1}">${ph(im, p.tone, '', { w: 200 })}</button>`).join('')}
        </div>
        <div class="stage" id="stage">${badge(p.badge)}<div id="stageImg">${ph(p.imgs[0], p.tone, p.name, { w: 1200, alt: p.name })}</div></div>
      </div>
      <div class="buy">
        <div>
          <h1>${p.name}</h1>
          <div style="display:flex;align-items:center;gap:.8rem;margin-top:.9rem"><span class="stars" aria-label="${p.rating} out of 5">${stars(p.rating)}</span><a class="small link" href="#reviews" data-action="scroll-reviews">${d.total} reviews</a></div>
        </div>
        <div class="price"><span>${money(p.price)}</span></div>
        <p class="lead" style="font-size:1rem">${p.blurb}</p>
        <div class="opt"><h4>Colour <span id="colName">${p.colors[0].n}</span></h4>
          <div class="swatches">${p.colors.map((c, i) => `<button class="sw ${i === 0 ? 'on' : ''}" style="--c:${c.h}" data-action="pdp-color" data-i="${i}" aria-label="${c.n}" title="${c.n}"></button>`).join('')}</div></div>
        <div class="opt" id="sizeBox"><h4>${sizes.length === 1 ? 'Size' : 'Size'} <span>${sizes.length === 1 ? 'One size' : 'Relaxed fit, true to size'}</span></h4>
          <div class="sizes-row">${sizes.map(s => {
            const n = stockOf(p, s);
            return `<button class="sz ${sizes.length === 1 ? 'on' : ''}" data-action="pdp-size" data-s="${s}" ${n ? '' : 'disabled'} aria-label="Size ${s}${n ? '' : ', sold out'}">${s === 'OS' ? 'One size' : s}${n && n <= 3 ? `<small>${n} left</small>` : ''}${n ? '' : '<small>sold out</small>'}</button>`;
          }).join('')}</div>
          <div class="stockline" id="stockline" style="margin-top:.8rem"></div></div>
        <button class="btn amber block" id="atcMain" data-action="add-pdp"></button>
        <div class="perks"><span>Free carbon-neutral shipping over $250</span><span>30-day returns, and free repairs for life</span></div>
        <div>${acc.map(([t, body, open], i) => `<div class="acc"><button class="acc-h" data-action="acc" aria-expanded="${!!open}" aria-controls="acc${i}">${t}<i></i></button><div class="acc-p ${open ? 'open' : ''}" id="acc${i}"><div>${body}</div></div></div>`).join('')}</div>
      </div>
    </div>
  </div>

  <section class="reviews sec" id="reviews">
    <div class="wrap rv-grid">
      <div class="rv-sum"><div class="big">${p.rating.toFixed(1)}</div><div class="stars" style="margin-top:.6rem">${stars(p.rating)}</div><p class="small" style="margin-top:.4rem">${d.total} verified reviews</p>
        <div class="bars">${d.rows.map(r => `<div><span>${r.s}</span><span class="t"><i style="width:${r.pct}%"></i></span><span class="tnum">${r.pct}%</span></div>`).join('')}</div></div>
      <div>${rv.map(r => `<div class="rv"><span class="stars">${stars(r.stars)}</span><p>&ldquo;${r.text}&rdquo;</p><div class="who"><b style="font-weight:500;color:var(--ink)">${r.by}</b><span>${r.loc}</span><span>${r.fit}</span><span>${r.when}</span></div></div>`).join('')}</div>
    </div>
  </section>

  <section class="related"><div class="wrap">
    <div class="sec-h"><h2 class="h2">Wear it with</h2><a class="link" href="shop.html">Back to the shop</a></div>
    <div class="best-grid">${rel.map(card).join('')}</div>
  </div></section>

  <div class="sticky-atc" id="stickyAtc" aria-hidden="true"><div class="wrap in">
    <div class="nm">${ph(p.imgs[0], p.tone, '', { w: 120 })}<div style="min-width:0"><h4>${p.name}</h4><div class="sel" id="stickySel"></div></div></div>
    <button class="btn" data-action="add-pdp" id="stickyBtn"></button>
  </div></div>`;
}
function refreshBuy() {
  const p = byId(state.pdp.id); if (!p) return;
  const { size, color } = state.pdp;
  $$('[data-action="pdp-size"]').forEach(b => b.classList.toggle('on', b.dataset.s === size));
  $$('[data-action="pdp-color"]').forEach(b => b.classList.toggle('on', +b.dataset.i === color));
  $('#colName').textContent = p.colors[color].n;
  const sl = $('#stockline');
  sl.className = 'stockline';
  if (!size) sl.innerHTML = 'Select a size to see availability';
  else {
    const n = stockOf(p, size);
    if (n <= 3) { sl.classList.add('low'); sl.innerHTML = `<i></i>Only ${n} left in ${size === 'OS' ? 'this piece' : size}`; }
    else sl.innerHTML = `<i></i>In stock, ships in 2 working days`;
  }
  const label = size ? `Add to bag — ${money(p.price)}` : 'Select a size';
  $('#atcMain').textContent = label; $('#stickyBtn').textContent = label;
  $('#stickySel').textContent = `${p.colors[color].n}${size && size !== 'OS' ? ' / ' + size : ''} · ${money(p.price)}`;
}
function drawStage() {
  const p = byId(state.pdp.id);
  $('#stageImg').innerHTML = ph(p.imgs[state.pdp.img], p.tone, p.name, { w: 1200, alt: p.name });
  $$('.thumb').forEach((t, i) => t.classList.toggle('on', i === state.pdp.img));
}
let io = null;
function bindPdp() {
  const stage = $('#stage');
  if (stage && matchMedia('(hover:hover) and (min-width:861px)').matches) {
    stage.addEventListener('mouseenter', () => stage.classList.add('zm'));
    stage.addEventListener('mouseleave', () => stage.classList.remove('zm'));
    stage.addEventListener('mousemove', e => {
      const r = stage.getBoundingClientRect(), img = $('img', stage); if (!img) return;
      img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
    });
  }
  const main = $('#atcMain'), bar = $('#stickyAtc');
  io?.disconnect();
  io = new IntersectionObserver(([e]) => {
    const show = !e.isIntersecting && e.boundingClientRect.top < 0;
    bar.classList.toggle('on', show); bar.setAttribute('aria-hidden', String(!show));
  });
  io.observe(main);
  refreshBuy();
}

/* ---------- views: cart ---------- */
function shipOptions(t) {
  const z = t.zone, m = state.ship.method;
  return ['std', 'exp'].map(k => `<label class="opt-row ${m === k ? 'on' : ''}"><span style="display:flex;align-items:center"><input type="radio" name="shipm" value="${k}" ${m === k ? 'checked' : ''} data-action="ship-method" data-m="${k}"><span>${k === 'std' ? 'Standard' : 'Express'}<small>${z.days[k === 'std' ? 0 : 1]} working days</small></span></span><b style="font-weight:500">${t.cost(k) === 0 ? 'Free' : money(t.cost(k))}</b></label>`).join('');
}
function totalsHTML(t) {
  return `<div class="totals">
    <div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
    ${t.discount ? `<div class="disc"><span>Promo ${state.promo}</span><span>&minus;${money(t.discount)}</span></div>` : ''}
    <div><span>Shipping (${t.zone.label})</span><span>${t.shipping === 0 ? 'Free' : money(t.shipping)}</span></div>
    <div class="grand"><span>Total</span><span>${money(t.total)}</span></div></div>`;
}
function viewCart() { return `<div class="wrap"><div class="phead"><div><div class="crumbs"><a href="index.html">Home</a><span>/</span><span>Bag</span></div><h1 class="display">Your bag</h1></div></div><div id="cartPage"></div></div>`; }
function drawCart() {
  const t = totals(), el = $('#cartPage'); if (!el) return;
  if (!t.L.length) { el.innerHTML = `<div class="empty" style="padding-bottom:8rem"><h3>Nothing here yet</h3><p class="small">Start with the Marlow Overcoat. There are 120 of them.</p><a class="btn" href="shop.html">Browse the shop</a></div>`; return; }
  const pm = state.promo ? PROMOS[state.promo] : null;
  el.innerHTML = `<div class="two">
    <div>${freebar(t)}${t.L.map(l => lineHTML(l, true)).join('')}<p style="margin-top:1.5rem"><a class="link" href="shop.html">Continue shopping</a></p></div>
    <aside class="panel">
      <h3>Summary</h3>
      <div class="field" style="gap:.5rem"><label for="promoIn">Promo code</label>
        <div class="inline-form"><input id="promoIn" placeholder="Try LOOM10" value="" autocomplete="off" aria-describedby="promoNote"><button class="btn" data-action="promo-apply">Apply</button></div>
        <span class="note ${pm ? 'ok' : state.promoMsg ? 'bad' : ''}" id="promoNote">${pm ? `${state.promo} applied: ${pm.label}. <button class="rm" style="margin:0" data-action="promo-clear">Remove</button>` : state.promoMsg || ''}</span></div>
      <div class="field" style="gap:.5rem"><label for="shipCountry">Estimate shipping</label>
        <div class="inline-form"><select id="shipCountry">${Object.entries(SHIPPING).map(([k, v]) => `<option value="${k}" ${state.ship.country === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select>
        <input id="shipZip" placeholder="Postcode" value="${esc(state.ship.zip)}" autocomplete="postal-code" style="max-width:130px"></div></div>
      <div class="ship-opts">${shipOptions(t)}</div>
      ${totalsHTML(t)}
      <a class="btn amber block" href="checkout.html">Begin checkout</a>
      <p class="note">Taxes are included. Duties for non-EU destinations are paid on delivery.</p>
    </aside></div>`;
}

/* ---------- views: checkout ---------- */
const field = (id, label, type = 'text', opt = {}) => {
  if (opt.def && state.ck.data[id] === undefined) state.ck.data[id] = opt.def;
  const e = state.ck.err[id], v = state.ck.data[id] ?? '';
  return `<div class="field ${e ? 'err' : ''} ${opt.cls || ''}"><label for="ck-${id}">${label}</label>
    <input id="ck-${id}" name="${id}" data-ck type="${type}" value="${esc(v)}" ${opt.ac ? `autocomplete="${opt.ac}"` : ''} ${opt.ph ? `placeholder="${opt.ph}"` : ''} ${opt.inm ? `inputmode="${opt.inm}"` : ''} ${e ? 'aria-invalid="true"' : ''}><span class="em">${e || ''}</span></div>`;
};
function viewCheckout() {
  return `<div class="wrap"><div class="phead"><div><div class="crumbs"><a href="index.html">Home</a><span>/</span><a href="cart.html">Bag</a><span>/</span><span>Checkout</span></div><h1 class="display" id="ckTitle">Checkout</h1></div></div><div id="ckBody"></div></div>`;
}
function drawCheckout() {
  const s = state.ck.step, el = $('#ckBody'); if (!el) return;
  if (s === 4) { drawConfirmation(el); return; }
  const names = ['Details', 'Delivery', 'Payment'];
  const steps = `<div class="steps">${names.map((n, i) => `<div class="${i + 1 === s ? 'on' : i + 1 < s ? 'done' : ''}"><b>${i + 1 < s ? '✓' : i + 1}</b><span>${n}</span></div>`).join('')}</div>`;
  let body = '';
  if (s === 1) body = `<form data-form="ck1" novalidate><div class="form-grid">
      ${field('email', 'Email', 'email', { ac: 'email', cls: 'full' })}
      ${field('first', 'First name', 'text', { ac: 'given-name' })}${field('last', 'Last name', 'text', { ac: 'family-name' })}
      ${field('addr', 'Address', 'text', { ac: 'street-address', cls: 'full' })}
      ${field('city', 'City', 'text', { ac: 'address-level2' })}${field('zip', 'Postcode', 'text', { ac: 'postal-code', def: state.ship.zip })}
      <div class="field full"><label for="ck-country">Country</label><select id="ck-country" data-action="ck-country">${Object.entries(SHIPPING).map(([k, v]) => `<option value="${k}" ${state.ship.country === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></div>
    </div><div class="actions"><a class="link" href="cart.html">Back to bag</a><button class="btn amber" type="submit">Continue to delivery</button></div></form>`;
  if (s === 2) { const t = totals(); body = `<div><h3 class="h3" style="margin-bottom:1rem">Delivery to ${esc(state.ck.data.city || '')}, ${t.zone.label}</h3><div class="ship-opts">${shipOptions(t)}</div>
    <p class="note" style="margin-top:1rem">Each order is pressed and wrapped in recycled paper with a card from the person who sewed it.</p>
    <div class="actions"><button class="link" data-action="ck-back">Back to details</button><button class="btn amber" data-action="ck-next">Continue to payment</button></div></div>`; }
  if (s === 3) { const d = state.ck.data; body = `<form data-form="ck3" novalidate>
    <div class="cardvis" aria-hidden="true"><div class="r"><span>Lumen &amp; Loom</span><span>Demo card</span></div><div class="n" id="cvNum">${esc(d.card || '•••• •••• •••• ••••')}</div><div class="r"><span id="cvName">${esc(d.cname || 'Name on card')}</span><span id="cvExp">${esc(d.exp || 'MM/YY')}</span></div></div>
    <p class="note" style="margin:1rem 0 1.4rem">This is a simulation. No payment is taken. Use any 16 digits, for example 4242 4242 4242 4242.</p>
    <div class="form-grid">${field('cname', 'Name on card', 'text', { ac: 'cc-name', cls: 'full' })}${field('card', 'Card number', 'text', { ac: 'cc-number', inm: 'numeric', ph: '4242 4242 4242 4242', cls: 'full' })}${field('exp', 'Expiry', 'text', { ac: 'cc-exp', inm: 'numeric', ph: 'MM/YY' })}${field('cvc', 'CVC', 'text', { ac: 'cc-csc', inm: 'numeric', ph: '123' })}</div>
    <div class="actions"><button type="button" class="link" data-action="ck-back">Back to delivery</button><button class="btn amber" type="submit" ${state.ck.busy ? 'disabled' : ''}>${state.ck.busy ? 'Processing…' : 'Pay ' + money(totals().total)}</button></div></form>`; }
  el.innerHTML = `<div class="two"><div>${steps}${body}</div><aside class="panel" id="ckSum"></aside></div>`;
  drawCheckoutSummary();
  const f = $('.field.err input'); if (f) f.focus();
}
function drawCheckoutSummary() {
  const el = $('#ckSum'); if (!el) return;
  const t = totals();
  el.innerHTML = `<h3>Your order</h3>${t.L.map(l => `<div class="sum-line"><div class="pw"><span class="q">${l.qty}</span>${ph(l.p.imgs[0], l.p.tone, '', { w: 160 })}</div><div><b>${l.p.name}</b><span class="small">${l.p.colors[l.color].n}${l.size === 'OS' ? '' : ' / ' + l.size}</span></div><span class="tnum">${money(l.total)}</span></div>`).join('')}${totalsHTML(t)}`;
}
function drawConfirmation(el) {
  const o = state.ck.order; $('#ckTitle').textContent = 'Thank you';
  el.innerHTML = `<div class="done-box"><p class="no">Order ${o.no}</p>
    <p class="lead">${esc(o.first)}, your order is with the atelier. A confirmation is on its way to ${esc(o.email)}.</p>
    <div class="panel" style="position:static">${o.lines.map(l => `<div class="sum-line"><div class="pw"><span class="q">${l.qty}</span>${ph(l.p.imgs[0], l.p.tone, '', { w: 160 })}</div><div><b>${l.p.name}</b><span class="small">${l.p.colors[l.color].n}${l.size === 'OS' ? '' : ' / ' + l.size}</span></div><span class="tnum">${money(l.total)}</span></div>`).join('')}
    <div class="totals"><div><span>Paid</span><span>${money(o.total)}</span></div><div><span>Delivery</span><span>${o.eta} working days to ${esc(o.city)}</span></div></div></div>
    <div style="display:flex;gap:1rem;flex-wrap:wrap"><a class="btn" href="shop.html">Keep browsing</a><a class="btn ghost" href="index.html">Back to home</a></div></div>`;
}
function validate(step) {
  const d = state.ck.data, e = {};
  if (step === 1) {
    if (!/^\S+@\S+\.\S+$/.test(d.email || '')) e.email = 'Enter an email like name@example.com.';
    ['first', 'last', 'addr', 'city', 'zip'].forEach(k => { if (!(d[k] || '').trim()) e[k] = 'This field is required.'; });
  }
  if (step === 3) {
    if (!(d.cname || '').trim()) e.cname = 'Enter the name on the card.';
    if ((d.card || '').replace(/\D/g, '').length < 15) e.card = 'Enter the full card number.';
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(d.exp || '')) e.exp = 'Use MM/YY.';
    if (!/^\d{3,4}$/.test(d.cvc || '')) e.cvc = '3 or 4 digits.';
  }
  state.ck.err = e; return !Object.keys(e).length;
}
function placeOrder() {
  state.ck.busy = true; drawCheckout();
  setTimeout(() => {
    const t = totals(), d = state.ck.data;
    state.ck.order = { no: 'LL-' + (100000 + Math.floor(Math.random() * 899999)), first: d.first || 'Friend', email: d.email, city: d.city, lines: t.L, total: t.total, eta: t.zone.days[state.ship.method === 'std' ? 0 : 1] };
    state.cart = []; state.promo = null; save(); state.ck.busy = false; state.ck.step = 4;
    try { sessionStorage.setItem('ll.order', JSON.stringify(state.ck.order)); } catch { /* ignore */ }
    $('#cartCount').textContent = 0; drawDrawer(); drawCheckout(); window.scrollTo({ top: 0 });
  }, 1400);
}

/* ---------- views: about ---------- */
function viewAbout() {
  return `
  <section class="a-hero"><div class="wrap grid2">
    <h1>Made slowly,<span>on purpose.</span></h1>
    ${ph(IMG.aboutHero, '#4a3a2e', 'Inês, at the cutting table', { cls: 'pic arch', alt: 'Portrait at the studio', w: 900 })}
  </div></section>

  <section class="wrap a-intro">
    <div class="l"><b>2016</b>Four machines, one rented room above a button shop in Porto.</div>
    <div class="r">
      <p>Lumen &amp; Loom began with a small stubbornness. Inês Valadares wanted a coat that would still be good in 2046, and nobody was making it.</p>
      <p>So she found the mill in Biella that weaves the wool, the family in Normandy who still ret their own flax, and six sewers in Porto who would rather make forty things well than four hundred things fast. We have been working with the same people ever since.</p>
    </div>
  </section>

  <section class="wrap chap c1">
    <div class="pic">${ph(IMG.aboutA, '#5b5a3a', 'Wool, Biella', { alt: 'Cloth on a loom', w: 900 })}${ph(IMG.aboutB, '#6b3d2a', 'Dye lot', { cls: 'inset', alt: 'Dyed yarn', w: 500 })}</div>
    <div class="txt"><h2 class="h2">Cloth we can <em>trace</em></h2>
      <p>Every roll of fabric arrives with a paper trail back to the farm. Our wool is scoured with recycled water and dyed in batches small enough to be re-run if the colour is off by even a shade.</p>
      <p class="fact">92% of our cloth is natural or recycled fibre.</p></div>
  </section>

  <section class="wrap chap c2">
    <div class="pic">${ph(IMG.aboutC, '#4a3a2e', 'Hand finishing', { alt: 'Hands finishing a seam', w: 900 })}${ph(IMG.aboutD, '#353723', 'Horn buttons', { cls: 'inset', alt: 'Buttons', w: 500 })}</div>
    <div class="txt"><h2 class="h2">Hands that <em>sign</em> their work</h2>
      <p>Each garment passes through three people and is signed on the inside seam. Collars are felled by hand. Buttonholes are worked, not punched. A coat takes eleven hours from cutting to pressing.</p>
      <p class="fact">11 hours per coat. 6 makers in the studio.</p></div>
  </section>

  <section class="wrap chap c3">
    <div class="pic">${ph(IMG.story, '#353723', 'Edition numbers', { alt: 'Garments on a rail', w: 900 })}</div>
    <div class="txt"><h2 class="h2">Fewer pieces, <em>no markdowns</em></h2>
      <p>We cut each edition once, in numbers we expect to sell. We do not discount, and we do not burn what is left. Remainders go to our repair programme, or to makers who need cloth.</p>
      <a class="btn" href="shop.html" style="justify-self:start">Shop Edition 14</a></div>
  </section>

  <section class="values"><div class="wrap">
    <h2 class="h2" style="max-width:16ch">What we <em>promise</em></h2>
    <div class="row">
      <div><span class="stat">Life</span><h3>Free repairs</h3><p>Re-hem, re-line, re-button. Post it to Porto and we send it back, pressed, at our cost.</p></div>
      <div><span class="stat">0%</span><h3>Discounted stock</h3><p>An edition is priced once. Early buyers never watch the price fall after they paid.</p></div>
      <div><span class="stat">1,800 km</span><h3>Furthest supplier</h3><p>Every mill, tannery and atelier is a day's drive from the studio. We visit each every year.</p></div>
    </div>
  </div></section>

  <section class="wrap cta-band"><h2 class="h2" style="max-width:14ch">Come and see how it's made.</h2><a class="btn amber" href="shop.html">Enter the shop</a></section>`;
}

/* ---------- page init (each HTML file sets <body data-page="...">) ---------- */
const PAGE = document.body.dataset.page;
let current = { name: PAGE };
const main = $('#main');
const Q = new URLSearchParams(location.search);
const SUFFIX = ' \u2014 LUMEN & LOOM';
function init() {
  let html = '', title = 'LUMEN & LOOM \u2014 Slow clothing, cut in small runs', after = null;
  if (PAGE === 'home') html = viewHome();
  else if (PAGE === 'shop') {
    const c = Q.get('cat');
    state.filters.cats = c && CATS.includes(c) ? [c] : [];
    html = viewShop(); title = (state.filters.cats[0] || 'Shop') + SUFFIX;
    after = () => { drawFilters(); drawGrid(); };
  } else if (PAGE === 'product') {
    const p = byId(Q.get('id'));
    if (!p) { location.replace('shop.html'); return; }
    html = viewProduct(p); title = p.name + SUFFIX; after = bindPdp;
  } else if (PAGE === 'cart') { html = viewCart(); title = 'Your bag' + SUFFIX; after = drawCart; }
  else if (PAGE === 'checkout') {
    if (!state.cart.length) {
      let o = null; try { o = JSON.parse(sessionStorage.getItem('ll.order')); } catch { /* none */ }
      if (!o) { location.replace('cart.html'); return; }
      state.ck.order = o; state.ck.step = 4;
    }
    html = viewCheckout(); title = 'Checkout' + SUFFIX; after = drawCheckout;
  } else if (PAGE === 'about') { html = viewAbout(); title = 'Our story' + SUFFIX; }
  main.innerHTML = `<div class="pg">${html}</div>`;
  document.title = title;
  after?.();
  const cat = state.filters.cats[0];
  $$('header.site nav a').forEach(a => {
    const n = a.dataset.nav;
    a.classList.toggle('on', (n === 'shop' && (PAGE === 'shop' || PAGE === 'product') && !(PAGE === 'shop' && cat === 'Knitwear')) || (n === 'knit' && PAGE === 'shop' && cat === 'Knitwear') || (n === 'about' && PAGE === 'about'));
  });
}

/* ---------- events ---------- */
const actions = {
  'open-nav': () => openDrawer('navDrawer'),
  'open-cart': () => openDrawer('cartDrawer'),
  'close-all': () => closeAll(),
  rail: t => { const r = $('#rail'); r.scrollBy({ left: +t.dataset.d * r.clientWidth * .7, behavior: 'smooth' }); },
  'qa-open': t => { const qa = t.closest('.qa'); const was = qa.classList.contains('open'); $$('.qa.open').forEach(q => q.classList.remove('open')); qa.classList.toggle('open', !was); },
  'qa-add': t => { $$('.qa.open').forEach(q => q.classList.remove('open')); addToCart(t.dataset.id, t.dataset.size, 0); },
  qty: t => changeQty(t.dataset.key, +t.dataset.d),
  remove: t => removeItem(t.dataset.key),
  'f-toggle': t => { const a = state.filters[t.dataset.k], v = t.dataset.v; const i = a.indexOf(v); i < 0 ? a.push(v) : a.splice(i, 1); drawFilters(); drawGrid(); },
  'clear-filters': () => { state.filters = { cats: [], sizes: [], colors: [], max: 500, sort: 'featured' }; $('#fMax').value = 500; drawFilters(); drawGrid(); },
  'filter-toggle': () => $('#filters').classList.toggle('open'),
  thumb: t => { state.pdp.img = +t.dataset.i; drawStage(); },
  'pdp-size': t => { state.pdp.size = t.dataset.s; refreshBuy(); },
  'pdp-color': t => { state.pdp.color = +t.dataset.i; refreshBuy(); },
  'add-pdp': () => {
    const { id, size, color } = state.pdp;
    if (!size) { $('#sizeBox').scrollIntoView({ behavior: 'smooth', block: 'center' }); const sl = $('#stockline'); sl.className = 'stockline warn'; sl.textContent = 'Choose a size first.'; return; }
    addToCart(id, size, color);
  },
  acc: t => { const open = t.getAttribute('aria-expanded') === 'true'; t.setAttribute('aria-expanded', !open); $('#' + t.getAttribute('aria-controls')).classList.toggle('open', !open); },
  'scroll-reviews': (t, e) => { e.preventDefault(); $('#reviews').scrollIntoView({ behavior: 'smooth' }); },
  'promo-apply': () => {
    const code = $('#promoIn').value.trim().toUpperCase();
    if (!code) { state.promoMsg = 'Enter a code first.'; }
    else if (PROMOS[code]) { state.promo = code; state.promoMsg = null; save(); }
    else state.promoMsg = `${code} is not a valid code.`;
    drawCart(); cartChanged();
  },
  'promo-clear': () => { state.promo = null; state.promoMsg = null; save(); cartChanged(); },
  'ship-method': t => { state.ship.method = t.dataset.m; save(); current.name === 'cart' ? drawCart() : (drawCheckoutSummary(), $$('.opt-row').forEach(r => r.classList.toggle('on', $('input', r).checked))); },
  'ck-next': () => { state.ck.step++; drawCheckout(); window.scrollTo({ top: 0 }); },
  'ck-back': () => { state.ck.step--; state.ck.err = {}; drawCheckout(); window.scrollTo({ top: 0 }); },
};
document.addEventListener('click', e => {
  const t = e.target.closest('[data-action]');
  if (!t) { if (!e.target.closest('.qa')) $$('.qa.open').forEach(q => q.classList.remove('open')); return; }
  if (t.tagName === 'INPUT' || t.tagName === 'SELECT') return;
  actions[t.dataset.action]?.(t, e);
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'fSort') { state.filters.sort = t.value; drawGrid(); }
  if (t.id === 'shipCountry' || t.id === 'ck-country') { state.ship.country = t.value; save(); current.name === 'cart' ? drawCart() : drawCheckoutSummary(); }
  if (t.dataset.action === 'ship-method') actions['ship-method'](t);
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'fMax') { state.filters.max = +t.value; $('#fMaxV').textContent = money(+t.value); drawGrid(); }
  if (t.id === 'shipZip') { state.ship.zip = t.value; save(); }
  if (t.dataset.ck !== undefined) {
    if (t.name === 'card') { t.value = t.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(); }
    if (t.name === 'exp') { let v = t.value.replace(/\D/g, '').slice(0, 4); if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2); t.value = v; }
    if (t.name === 'cvc') t.value = t.value.replace(/\D/g, '').slice(0, 4);
    state.ck.data[t.name] = t.value;
    const map = { card: '#cvNum', cname: '#cvName', exp: '#cvExp' };
    if (map[t.name] && $(map[t.name])) $(map[t.name]).textContent = t.value || { card: '•••• •••• •••• ••••', cname: 'Name on card', exp: 'MM/YY' }[t.name];
    if (t.name === 'zip') { state.ship.zip = t.value; save(); }
  }
});
document.addEventListener('submit', e => {
  const f = e.target.dataset.form; if (!f) return;
  e.preventDefault();
  if (f === 'news') {
    const v = $('#nEmail').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(v)) { $('#nf').classList.add('err'); $('#nErr').textContent = 'Enter an email like name@example.com.'; return; }
    $('#nf').classList.remove('err'); $('#nErr').textContent = '';
    e.target.querySelectorAll('.field, button, p.small').forEach(n => n.hidden = true);
    const m = $('#nMsg'); m.hidden = false; m.textContent = `Thank you. The next letter goes to ${v}.`;
  }
  if (f === 'ck1') { if (validate(1)) { state.ck.step = 2; drawCheckout(); window.scrollTo({ top: 0 }); } else drawCheckout(); }
  if (f === 'ck3') { if (validate(3)) placeOrder(); else drawCheckout(); }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });

/* ---------- boot ---------- */
$('#mCount').textContent = `${PRODUCTS.length} pieces`;
$('#cartCount').textContent = cartCount();
drawDrawer();
init();
})();
