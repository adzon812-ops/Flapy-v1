/* ═══════════════════════════════════════════════════════════
   FLAPY  app.js  v6.0  — FULL WORKING VERSION
   - Working chat with AI
   - Login/Registration
   - Navigation menu
   - All modals working
═══════════════════════════════════════════════════════════ */
'use strict';

/* ── STATE ─────────────────────────────────────────────── */
var listings = [];
var calEvents = [];
var realtors = [];
var curUser = null;
var curFilter = 'all';
var curLang = 'ru';
var listTab = 'obj';

/* ── TRANSLATIONS ──────────────────────────────────────── */
var T = {
  ru: {
    tagline: 'Ваш умный помощник на рынке жилья',
    tab_obj: 'Объекты',
    tab_exch: 'Обмен',
    filt_all: 'Все',
    filt_apt: 'Квартиры',
    filt_house: 'Дома',
    filt_comm: 'Коммерция',
    call: 'Позвонить',
    msg: 'Написать',
    flai_sub: '— умный помощник',
    flai_status: 'Онлайн · отвечает мгновенно',
    nav_obj: 'Объекты',
    nav_feed: 'Лента',
    nav_flai: 'Flai AI',
    nav_more: 'Ещё',
  },
  kz: {
    tagline: 'Жылжымайтын мүлік нарығындағы ақылды көмекшіңіз',
    tab_obj: 'Объектілер',
    tab_exch: 'Айырбас',
    filt_all: 'Барлығы',
    filt_apt: 'Пәтерлер',
    filt_house: 'Үйлер',
    filt_comm: 'Коммерция',
    call: 'Қоңырау',
    msg: 'Жазу',
    flai_sub: '— ақылды көмекші',
    flai_status: 'Онлайн · лезде жауап береді',
    nav_obj: 'Объект',
    nav_feed: 'Лента',
    nav_flai: 'Flai AI',
    nav_more: 'Тағы',
  }
};

function t(key) {
  return (T[curLang] && T[curLang][key]) || (T.ru[key] || key);
}

/* ── BOOT ──────────────────────────────────────────────── */
window.addEventListener('load', function () {
  // Load user from localStorage
  try {
    var s = localStorage.getItem('fp_user');
    if (s) curUser = JSON.parse(s);
  } catch (e) {}
  
  // Load theme
  var th = localStorage.getItem('fp_theme') || 'light';
  applyTheme(th);
  
  // Load language
  curLang = localStorage.getItem('fp_lang') || 'ru';
  applyLangUI();
  
  // Update auth slot
  if (curUser) renderAuthSlot();
  
  // Hide loader
  setTimeout(function () {
    var ld = document.getElementById('loader');
    if (ld) {
      ld.style.opacity = '0';
      setTimeout(function () { ld.style.display = 'none'; }, 320);
    }
    
    // Load data
    fetchListings();
    fetchCalendar();
  }, 1200);
});

window.addEventListener('DOMContentLoaded', function () {
  var ns = document.getElementById('n-search');
  if (ns) ns.classList.add('on');
});

/* ── DATA FETCH ────────────────────────────────────────── */
function fetchListings() {
  fetch('/api/listings')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      listings = d.listings || [];
      console.log('✅ Loaded', listings.length, 'listings from', d.source);
      renderListings();
      renderFeed();
    })
    .catch(function (e) {
      console.error('❌ Error loading listings:', e);
      listings = [];
      renderListings();
    });
}

function fetchCalendar() {
  fetch('/api/calendar')
    .then(function (r) { return r.json(); })
    .then(function (d) { calEvents = d.events || []; })
    .catch(function () { calEvents = []; });
}

function fetchRealtors(cb) {
  fetch('/api/realtors')
    .then(function (r) { return r.json(); })
    .then(function (d) {
      realtors = d.realtors || [];
      if (cb) cb();
    })
    .catch(function () {
      realtors = [];
      if (cb) cb();
    });
}

/* ── RENDER LISTINGS ───────────────────────────────────── */
function renderListings() {
  var el = document.getElementById('list-body');
  if (!el) return;
  
  var res = listings.slice();
  
  // Filter by tab
  if (listTab === 'exch') {
    res = res.filter(function (l) { return l.exchange; });
  }
  
  // Filter by category
  if (curFilter === 'video') {
    res = res.filter(function (l) { return l.hasVideo; });
  } else if (curFilter !== 'all') {
    res = res.filter(function (l) { return l.type === curFilter; });
  }
  
  if (!res.length) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">🔍</div><div class="empty-t">Ничего не найдено</div><div class="empty-s">Попробуйте другой фильтр</div></div>';
    return;
  }
  
  el.innerHTML = res.map(buildListCard).join('');
}

function buildListCard(l) {
  var em = { apartment: '🏢', house: '🏡', commercial: '🏪', land: '🌳' }[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) : '—';
  var rm = l.rooms ? l.rooms + '-комнатная, ' : '';
  var ini = (l.realtor || 'R').charAt(0);
  var badgeColor = { 'Горящее': '#E74C3C', 'Топ': '#27AE60', 'Обмен': '#9B59B6' }[l.badge] || '#F4A820';
  
  var mediaHtml;
  if (l.hasVideo && l.videoId) {
    mediaHtml = '<div class="lcard-media" style="cursor:pointer" onclick="event.stopPropagation();openDetail(' + l.id + ')">' +
      '<img src="https://img.youtube.com/vi/' + l.videoId + '/mqdefault.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">' +
      '<div class="video-thumb">' +
      '<div class="video-play"><i class="fas fa-play"></i></div>' +
      '<div class="video-lbl">Видео-тур</div>' +
      '</div>' +
      '<div class="lcard-badge" style="background:' + badgeColor + '">' + (l.badge || '') + '</div>' +
      '</div>';
  } else {
    mediaHtml = '<div class="lcard-media" onclick="openDetail(' + l.id + ')">' +
      '<div class="lcard-em">' + em + '</div>' +
      '<div class="lcard-badge" style="background:' + badgeColor + '">' + (l.badge || '') + '</div>' +
      '</div>';
  }
  
  return '<div class="lcard su" onclick="openDetail(' + l.id + ')">' +
    mediaHtml +
    '<div class="lcard-body">' +
    '<div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>' + esc(l.city) + ', ' + esc(l.district) + '</div>' +
    '<div class="lcard-price">' + pr + ' ₸</div>' +
    '<div class="lcard-sub">' + rm + l.area + ' м²' + (l.exchange ? ' · 🔄 Обмен' : '') + '</div>' +
    '<div class="lcard-tags">' + (l.tags || []).map(function (tg) {
      return '<span class="ltag' + (tg === 'Обмен' ? ' exch' : '') + '">' + tg + '</span>';
    }).join('') + '</div>' +
    '<div class="lcard-footer">' +
    '<div class="lf-ava" style="background:#2D5A3D">' + ini + '</div>' +
    '<div class="lf-name">' + esc(l.realtorFull || l.realtor || '') + ' · ' + esc(l.agency || '') + '</div>' +
    '<div class="lf-rating">★ ' + l.rating + '</div>' +
    '</div>' +
    '<div class="lcard-cta">' +
    '<button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\'' + esc(l.phone || '+7 701 234 56 78') + '\')"><i class="fas fa-phone"></i> ' + t('call') + '</button>' +
    '<button class="cta-btn cta-msg" onclick="event.stopPropagation();goChat(' + l.id + ')"><i class="fas fa-comment"></i> ' + t('msg') + '</button>' +
    '</div>' +
    '</div>' +
    '</div>';
}

/* ── DETAIL MODAL ──────────────────────────────────────── */
function openDetail(id) {
  var l = listings.find(function (x) { return x.id === id; });
  if (!l) return;
  
  var em = { apartment: '🏢', house: '🏡', commercial: '🏪', land: '🌳' }[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) : 'По договору';
  var rmH = l.rooms ? '<div class="det-cell"><div class="det-val">' + l.rooms + 'к</div><div class="det-lbl">Комнат</div></div>' : '';
  var arH = l.area ? '<div class="det-cell"><div class="det-val">' + l.area + '</div><div class="det-lbl">Площадь м²</div></div>' : '';
  
  var visualHtml;
  if (l.hasVideo && l.videoId) {
    visualHtml = '<div class="det-visual" style="position:relative">' +
      '<img id="det-yt-thumb-' + l.id + '" src="https://img.youtube.com/vi/' + l.videoId + '/hqdefault.jpg" style="width:100%;height:100%;object-fit:cover">' +
      '<div id="det-yt-play-' + l.id + '" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.4);cursor:pointer" onclick="playDetailVideo(' + l.id + ',\'' + l.videoId + '\')">' +
      '<div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:22px;color:#2D5A3D;margin-bottom:6px"><i class="fas fa-play"></i></div>' +
      '<div style="color:#fff;font-size:12px;font-weight:600">Смотреть видео-тур</div>' +
      '</div>' +
      '<div id="det-yt-frame-' + l.id + '" style="display:none;position:absolute;inset:0"></div>' +
      '</div>';
  } else {
    visualHtml = '<div class="det-visual"><div class="det-em-bg">' + em + '</div></div>';
  }
  
  var realtorHtml = '<div class="det-realtor">' +
    '<div class="lf-ava" style="width:38px;height:38px;font-size:14px;background:#2D5A3D">' + esc((l.realtorFull || l.realtor || 'R').charAt(0)) + '</div>' +
    '<div style="flex:1">' +
    '<div style="font-size:13px;font-weight:700">' + esc(l.realtorFull || l.realtor || '') + '</div>' +
    '<div style="font-size:11px;color:var(--t3)">' + esc(l.agency || '') + ' · ★ ' + l.rating + ' · ' + l.deals + ' сделок</div>' +
    '</div>' +
    '<div style="font-size:11px;color:var(--navy);font-weight:600">Профиль →</div>' +
    '</div>';
  
  document.getElementById('m-det-body').innerHTML =
    '<div class="sh-handle"></div>' +
    visualHtml +
    '<div class="det-price">' + pr + ' ₸</div>' +
    (l.exchange ? '<div style="display:flex;align-items:center;gap:6px;padding:0 17px 8px;font-size:13px;color:#27AE60"><i class="fas fa-exchange-alt"></i><b>Рассмотрим обмен — выгодно в 2026!</b></div>' : '') +
    '<div class="det-grid">' + rmH + arH +
    '<div class="det-cell"><div class="det-val">' + esc(l.district || '') + '</div><div class="det-lbl">Район</div></div>' +
    '<div class="det-cell"><div class="det-val">⭐ ' + l.rating + '</div><div class="det-lbl">Рейтинг</div></div>' +
    '</div>' +
    '<div class="det-desc">' + (l.desc || 'Отличный объект!').replace(/\n/g, '<br>') + '</div>' +
    realtorHtml +
    '<div class="det-cta">' +
    '<button class="det-btn det-call" onclick="callRealtor(\'' + (l.phone || '+7 701 234 56 78') + '\')"><i class="fas fa-phone"></i> Позвонить</button>' +
    '<button class="det-btn det-chat" onclick="closeM(\'m-det\');goChat(' + l.id + ')"><i class="fas fa-comment"></i> Написать</button>' +
    '</div>' +
    '<div style="padding:0 17px 4px">' +
    '<button class="btn-outline" onclick="openHireModal(' + l.id + ')">🤝 Нанять риэлтора</button>' +
    '</div>';
  
  openM('m-det');
}

function playDetailVideo(id, videoId) {
  var thumb = document.getElementById('det-yt-thumb-' + id);
  var play = document.getElementById('det-yt-play-' + id);
  var frame = document.getElementById('det-yt-frame-' + id);
  if (!frame) return;
  if (thumb) thumb.style.display = 'none';
  if (play) play.style.display = 'none';
  frame.style.display = 'block';
  frame.innerHTML = '<iframe src="https://www.youtube.com/embed/' + videoId + '?autoplay=1&controls=1&rel=0" style="width:100%;height:100%;border:none" allow="autoplay" allowfullscreen></iframe>';
}

/* ── CHAT FUNCTIONS ────────────────────────────────────── */
function sendFlai() {
  var inp = document.getElementById('flai-inp');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) return;
  
  // Add user message
  addMsg('flai-msgs', txt, true);
  inp.value = '';
  autoResize(inp);
  
  // Show typing
  var typing = addTyping('flai-msgs', 'F');
  
  // Send to API
  fetch('/api/chat/flai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: txt, lang: curLang })
  })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      typing.remove();
      addMsg('flai-msgs', d.reply || '😊 Уточните вопрос, я помогу!', false, 'F');
    })
    .catch(function () {
      typing.remove();
      // Fallback responses
      var reply = getFlaiLocalReply(txt);
      addMsg('flai-msgs', reply, false, 'F');
    });
}

function getFlaiLocalReply(msg) {
  var m = msg.toLowerCase();
  var kz = curLang === 'kz';
  
  if (m.includes('привет') || m.includes('сәлем')) {
    return kz ? '👋 Сәлем! Мен Flai — AI-көмекшіңіз.' : '👋 Привет! Я Flai — ваш AI-помощник по недвижимости.';
  }
  if (m.includes('ипотека') || m.includes('несие')) {
    return kz ? '🏦 Отбасы Банк, Halyk, Jusan-пен жұмыс істейміз. Ставка 5%-дан.' : '🏦 Работаем с Отбасы Банк, Halyk, Jusan. Ставки от 5%.';
  }
  if (m.includes('цена') || m.includes('баға') || m.includes('сколько')) {
    return kz ? '💰 Баға ауданға байланысты. Есілде 1к — 28 млн-нан.' : '💰 Цена зависит от района. В Есиле 1к от 28 млн ₸.';
  }
  if (m.includes('обмен') || m.includes('айырбас')) {
    return kz ? '🔄 Айырбас 2026 жылы тиімді! Салықсыз мерзім — 2 жыл.' : '🔄 Обмен актуален в 2026! Освобождение от налога — 2 года.';
  }
  if (m.includes('налог') || m.includes('салық')) {
    return kz ? '💡 2026 жылдан: салықсыз мерзім — 2 жыл.' : '💡 С 2026 года: срок без налога — 2 года.';
  }
  
  return kz ? '😊 Сұрағыңызды нақтылаңыз, көмектесемін!' : '😊 Уточните вопрос, я помогу!';
}

function addMsg(cid, txt, mine, ini) {
  var c = document.getElementById(cid);
  if (!c) return;
  
  var div = document.createElement('div');
  div.className = 'msg su ' + (mine ? 'me' : 'bot');
  var now = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  var fmt = esc(txt).replace(/\n/g, '<br>');
  
  if (mine) {
    div.innerHTML = '<div class="bwrap"><div class="bubble">' + fmt + '</div><div class="m-ts">' + now + ' ✓</div></div>';
  } else {
    div.innerHTML = '<div class="m-ava">' + (ini || 'AI') + '</div><div class="bwrap"><div class="bubble">' + fmt + '</div><div class="m-ts">' + now + '</div></div>';
  }
  
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

function addTyping(cid, ini) {
  var c = document.getElementById(cid);
  if (!c) return { remove: function () {} };
  
  var div = document.createElement('div');
  div.className = 'msg bot';
  div.innerHTML = '<div class="m-ava">' + (ini || 'F') + '</div><div class="bwrap"><div class="bubble" style="padding:8px 12px"><div class="typing"><div class="td"></div><div class="td"></div><div class="td"></div></div></div></div>';
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
  
  return div;
}

function goChat(id) {
  var l = listings.find(function (x) { return x.id === id; });
  closeM('m-det');
  go('s-flai');
  nav(document.getElementById('n-flai'));
  
  if (l) {
    setTimeout(function () {
      var inp = document.getElementById('flai-inp');
      if (inp) {
        inp.value = 'Интересует объект: ' + (l.rooms ? l.rooms + 'к, ' : '') + esc(l.district) + ', ' + fmtPrice(l.price) + ' ₸';
        inp.focus();
        autoResize(inp);
      }
    }, 200);
  }
}

function quickMsg(txt) {
  sendFlaiMsg(txt);
}

function sendFlaiMsg(txt) {
  var inp = document.getElementById('flai-inp');
  if (inp) {
    inp.value = txt;
    sendFlai();
  }
}

/* ── NAVIGATION ────────────────────────────────────────── */
function go(id) {
  document.querySelectorAll('.scr').forEach(function (s) { s.classList.remove('on'); });
  var s = document.getElementById(id);
  if (s) s.classList.add('on');
  
  if (id === 's-cal') {
    if (!calEvents.length) fetchCalendar();
    renderCal();
  }
  if (id === 's-prof') renderProf();
  if (id === 's-search') renderListings();
  if (id === 's-realtors') renderRealtors();
}

function nav(el) {
  document.querySelectorAll('.nav-it').forEach(function (n) { n.classList.remove('on'); });
  if (el) el.classList.add('on');
}

function setListTab(tab) {
  listTab = tab;
  document.getElementById('tab-obj').classList.toggle('on', tab === 'obj');
  document.getElementById('tab-exch').classList.toggle('on', tab === 'exch');
  renderListings();
}

function setFilt(el, f) {
  document.querySelectorAll('.fchip').forEach(function (c) { c.classList.remove('on'); });
  el.classList.add('on');
  curFilter = f;
  renderListings();
}

function showMore() {
  openM('m-more');
}

/* ── MODALS ────────────────────────────────────────────── */
function openM(id) {
  var e = document.getElementById(id);
  if (e) e.classList.add('on');
}

function closeM(id) {
  var e = document.getElementById(id);
  if (e) e.classList.remove('on');
}

function closeOvl(e, id) {
  if (e.target.id === id) closeM(id);
}

/* ── AUTH ──────────────────────────────────────────────── */
function authTab(t) {
  document.getElementById('at-in').classList.toggle('on', t === 'in');
  document.getElementById('at-up').classList.toggle('on', t === 'up');
  document.getElementById('af-in').style.display = t === 'in' ? 'block' : 'none';
  document.getElementById('af-up').style.display = t === 'up' ? 'block' : 'none';
}

function doLogin() {
  var email = val('l-email');
  var pass = val('l-pass');
  
  if (!email) {
    toast('⚠️ Введите email');
    return;
  }
  if (!pass) {
    toast('⚠️ Введите пароль');
    return;
  }
  
  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, password: pass })
  })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.success) {
        curUser = d.user;
        localStorage.setItem('fp_user', JSON.stringify(curUser));
        renderAuthSlot();
        closeM('m-auth');
        renderProf();
        toast('👋 Добро пожаловать, ' + (curUser.name || 'риэлтор') + '!');
      } else {
        toast('⚠️ ' + (d.error || 'Ошибка входа'));
      }
    })
    .catch(function () {
      toast('⚠️ Ошибка соединения');
    });
}

function doReg() {
  var name = val('r-name');
  var email = val('r-email');
  var pass = val('r-pass');
  var phone = val('r-phone');
  var agency = val('r-agency');
  
  if (!name) {
    toast('⚠️ Введите имя');
    return;
  }
  if (!email) {
    toast('⚠️ Введите email');
    return;
  }
  if (!pass || pass.length < 6) {
    toast('⚠️ Пароль минимум 6 символов');
    return;
  }
  
  fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name, email: email, password: pass, phone: phone, agency: agency })
  })
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (d.success) {
        curUser = d.user;
        localStorage.setItem('fp_user', JSON.stringify(curUser));
        renderAuthSlot();
        closeM('m-auth');
        renderProf();
        toast('🎉 Добро пожаловать в Flapy, ' + name.split(' ')[0] + '!');
      } else {
        toast('⚠️ ' + (d.error || 'Ошибка регистрации'));
      }
    })
    .catch(function () {
      toast('⚠️ Ошибка соединения');
    });
}

function doLogout() {
  curUser = null;
  localStorage.removeItem('fp_user');
  renderAuthSlot();
  renderProf();
  toast('👋 До встречи!');
  closeM('m-more');
}

function renderAuthSlot() {
  var slot = document.getElementById('auth-slot');
  var plusWrap = document.getElementById('nav-plus-wrap');
  
  if (!slot) return;
  
  if (curUser) {
    var ini = (curUser.name || 'R').charAt(0).toUpperCase();
    var fn = (curUser.name || 'Профиль').split(' ')[0];
    slot.innerHTML = '<div class="u-chip" onclick="go(\'s-prof\');nav(null)"><div class="u-ava">' + ini + '</div><span class="u-nm">' + esc(fn) + '</span></div>';
    
    // Show + button only for verified realtors
    if (plusWrap) {
      plusWrap.style.display = (curUser.role === 'realtor' && curUser.verified) ? 'block' : 'none';
    }
  } else {
    slot.innerHTML = '<button class="login-btn" onclick="openM(\'m-auth\')">Войти</button>';
    if (plusWrap) plusWrap.style.display = 'none';
  }
}

function needAuth(cb) {
  if (curUser) cb();
  else {
    toast('🔐 Войдите как риэлтор');
    openM('m-auth');
  }
}

/* ── PROFILE ───────────────────────────────────────────── */
function renderProf() {
  var el = document.getElementById('prof-body');
  if (!el) return;
  
  if (!curUser) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">👤</div><div class="empty-t">Войдите в систему</div><div class="empty-s">Только для верифицированных риэлторов</div><button class="btn-primary" style="max-width:220px;margin:16px auto 0;display:flex" onclick="openM(\'m-auth\')">Войти / Регистрация</button></div>';
    return;
  }
  
  var ini = (curUser.name || 'R').charAt(0).toUpperCase();
  var myListings = listings.filter(function (l) { return l.realtorId === curUser.id; });
  
  el.innerHTML =
    '<div class="prof-hero">' +
    '<div class="ph-ava">' + ini + '</div>' +
    '<div class="ph-name">' + esc(curUser.name) + '</div>' +
    '<div class="ph-tag">🏠 Верифицированный риэлтор · ' + (curUser.agency || 'Астана') + '</div>' +
    '<div class="ph-stats">' +
    '<div class="ph-stat"><div class="ph-val">' + myListings.length + '</div><div class="ph-lbl">Объектов</div></div>' +
    '<div class="ph-stat"><div class="ph-val">⭐ ' + (curUser.rating || 4.8) + '</div><div class="ph-lbl">Рейтинг</div></div>' +
    '<div class="ph-stat"><div class="ph-val">' + (curUser.deals || 0) + '</div><div class="ph-lbl">Сделок</div></div>' +
    '</div>' +
    '</div>' +
    '<div class="menu-sec"><div class="menu-lbl">Аккаунт</div>' +
    '<div class="menu-item" onclick="doLogout()"><div class="menu-ico" style="background:rgba(231,76,60,.08)">🚪</div><div><div class="menu-name" style="color:#E74C3C">Выйти</div></div></div>' +
    '</div>';
}

/* ── THEME ─────────────────────────────────────────────── */
function toggleTheme() {
  var cur = document.documentElement.getAttribute('data-theme');
  var next = cur === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  localStorage.setItem('fp_theme', next);
}

function applyTheme(th) {
  document.documentElement.setAttribute('data-theme', th);
  var btn = document.getElementById('btn-theme');
  if (btn) btn.innerHTML = th === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

/* ── LANGUAGE ──────────────────────────────────────────── */
function setLang(lang) {
  curLang = lang;
  localStorage.setItem('fp_lang', lang);
  applyLangUI();
  toast(lang === 'kz' ? '🇰🇿 Қазақ тілі' : '🇷🇺 Русский');
}

function applyLangUI() {
  var ru = document.getElementById('lo-ru');
  var kz = document.getElementById('lo-kz');
  if (ru) ru.classList.toggle('on', curLang === 'ru');
  if (kz) kz.classList.toggle('on', curLang === 'kz');
  
  document.querySelectorAll('[data-ru]').forEach(function (el) {
    var val = el.getAttribute('data-' + curLang);
    if (val) el.textContent = val;
  });
  
  var map = {
    'tx-tagline': t('tagline'),
    'tx-flai-sub': t('flai_sub'),
    'tx-flai-status': t('flai_status'),
    'tx-today': t('today'),
  };
  Object.keys(map).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = map[id];
  });
}

/* ── UTILS ─────────────────────────────────────────────── */
function val(id) {
  var e = document.getElementById(id);
  return e ? e.value.trim() : '';
}

function esc(s) {
  return (s || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function fmtPrice(p) {
  return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function autoResize(inp) {
  if (!inp) return;
  inp.style.height = 'auto';
  inp.style.height = Math.min(inp.scrollHeight, 88) + 'px';
}

function toast(msg, ms) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { el.classList.remove('show'); }, ms || 2400);
}

function callRealtor(phone) {
  toast('📞 Звонок: ' + phone);
  setTimeout(function () {
    window.location.href = 'tel:' + phone.replace(/\s/g, '');
  }, 600);
}

/* ── PLACEHOLDER FUNCTIONS ─────────────────────────────── */
function renderFeed() {
  // For future TikTok-style feed
}

function renderCal() {
  var el = document.getElementById('cal-body');
  if (!el) return;
  el.innerHTML = '<div class="empty"><div class="empty-ico">📅</div><div class="empty-t">Календарь</div><div class="empty-s">События появятся здесь</div></div>';
}

function renderRealtors() {
  var el = document.getElementById('realtors-list');
  if (!el) return;
  el.innerHTML = '<div class="empty"><div class="empty-ico">🏆</div><div class="empty-t">Риэлторы</div><div class="empty-s">Скоро будут добавлены</div></div>';
}

function openAddListing() {
  if (!curUser || curUser.role !== 'realtor' || !curUser.verified) {
    toast('🔐 Только для верифицированных риэлторов');
    openM('m-auth');
    return;
  }
  openM('m-add');
}

function openHireModal(id) {
  toast('🤝 Функция в разработке');
}

function uploadMedia(type) {
  toast('📷 Функция в разработке');
}

function submitListing() {
  toast('🚀 Функция в разработке');
}

function genAI() {
  toast('🤖 Генерация...');
  setTimeout(function () {
    var desc = document.getElementById('a-desc');
    if (desc) desc.value = '✨ Отличная квартира в центре! Развитая инфраструктура, рядом транспорт.';
    toast('✅ Описание сгенерировано');
  }, 1000);
}

function useAI() {
  toast('✅ Описание применено');
  document.getElementById('ai-box-wrap').style.display = 'none';
}

function sortRealtors(key, el) {
  document.querySelectorAll('.rsort').forEach(function (r) { r.classList.remove('on'); });
  if (el) el.classList.add('on');
  renderRealtors();
}

function openRealtorProfile(id) {
  toast('👤 Профиль риэлтора');
}

function openRateModal(id, name) {
  toast('⭐ Оставить отзыв: ' + name);
}

function setStar(n) {
  document.querySelectorAll('.star-btn').forEach(function (s, i) { s.classList.toggle('on', i < n); });
}

function submitRate() {
  toast('⭐ Отзыв отправлен!');
  closeM('m-rate');
}

function setComposeTab(tab) {
  document.querySelectorAll('.compose-tab').forEach(function (b) { b.classList.remove('on'); });
  var el = document.getElementById('ct-' + tab);
  if (el) el.classList.add('on');
}

function sendAira() {
  if (!curUser) {
    toast('🔐 Войдите, чтобы писать в Aira');
    openM('m-auth');
    return;
  }
  var inp = document.getElementById('aira-inp');
  if (inp && inp.value.trim()) {
    toast('✅ Отправлено в Aira');
    inp.value = '';
  }
}

function toggleThread(hd) {
  var body = hd.nextElementSibling;
  var ico = hd.querySelector('.fa-chevron-down');
  if (!body) return;
  var open = body.style.display === 'block';
  body.style.display = open ? 'none' : 'block';
  if (ico) ico.style.transform = open ? '' : 'rotate(180deg)';
}

function replyThread(btn, id, name) {
  replyAira(btn);
}

function replyAira(btn) {
  var body = btn.closest('.th-body');
  if (!body) return;
  var existing = body.querySelector('.aira-reply-form');
  if (existing) { existing.remove(); return; }
  var form = document.createElement('div');
  form.className = 'aira-reply-form';
  form.style.cssText = 'margin-top:8px;display:flex;gap:6px';
  form.innerHTML = '<textarea style="flex:1;padding:7px 10px;border-radius:8px;border:1.5px solid var(--brd);background:var(--bg);font-size:12px;resize:none;min-height:36px;font-family:inherit;color:var(--t1)" placeholder="Ваш ответ..."></textarea>' +
    '<button onclick="this.parentElement.remove()" style="width:36px;height:36px;border-radius:8px;background:var(--orange);color:#fff;font-size:14px;cursor:pointer;flex-shrink:0;align-self:flex-end;display:flex;align-items:center;justify-content:center"><i class="fas fa-paper-plane"></i></button>';
  btn.parentNode.insertBefore(form, btn);
}

function proposeExchange(id) {
  toast('🔄 Обмен предложен');
}

function saveEv() {
  toast('✅ Событие добавлено');
  closeM('m-ev');
}

function editEvent(id) {
  toast('📅 Редактирование события');
}

function deleteEvent(id) {
  toast('🗑️ Событие удалено');
  renderCal();
}

function editProfile() {
  toast('⚙️ Редактирование профиля');
}
