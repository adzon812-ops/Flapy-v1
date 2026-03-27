/* FLAPY — app.js */
'use strict';

var listings = [];
var calEvents = [];
var curUser = null;
var curRole = 'buyer';
var curFilter = 'all';
var curLang = 'ru';

/* ── BOOT ───────────────────────────────────── */
window.addEventListener('load', function () {
  var saved = localStorage.getItem('flapy_user');
  if (saved) { try { curUser = JSON.parse(saved); } catch(e){} renderAuthSlot(); }

  var th = localStorage.getItem('flapy_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', th);
  updateThemeIcon(th);

  setTimeout(function () {
    var ld = document.getElementById('loader');
    ld.style.opacity = '0';
    setTimeout(function () { ld.style.display = 'none'; }, 380);
    fetchListings();
    initCalendar();
  }, 1300);
});

/* ── DATA ───────────────────────────────────── */
function fetchListings() {
  fetch('/api/listings')
    .then(function (r) { return r.json(); })
    .then(function (d) { listings = d.listings || []; renderFeed(); renderSearch(listings); })
    .catch(function () { listings = fallbackListings(); renderFeed(); renderSearch(listings); });
}

function fallbackListings() {
  return [
    { id:1, type:'apartment', rooms:3, area:85,  district:'Есиль',       price:85000000,  exchange:false, hasVideo:false, realtor:'Айгерим К.',  rating:4.9, color:'#7c6ff7', tags:['Новострой','Ипотека'], desc:'Просторная 3-комнатная с панорамным видом на Байтерек. Свежий ремонт, подземный паркинг.' },
    { id:2, type:'house',     rooms:5, area:220, district:'Алматинский', price:150000000, exchange:true,  hasVideo:true,  realtor:'Данияр М.',    rating:4.7, color:'#ff5c7c', tags:['Обмен','Срочно'],      desc:'Просторный дом с участком 10 соток. Гараж на 2 машины, баня. Рассмотрим обмен!' },
    { id:3, type:'commercial',rooms:0, area:120, district:'Байконыр',    price:65000000,  exchange:false, hasVideo:false, realtor:'Сауле Т.',     rating:5.0, color:'#3ecfac', tags:['Инвестиция'],          desc:'Помещение первой линии с высоким трафиком. Идеально для ресторана или офиса.' },
    { id:4, type:'apartment', rooms:2, area:65,  district:'Сарыарка',    price:38000000,  exchange:true,  hasVideo:false, realtor:'Нурлан А.',    rating:4.6, color:'#ffab30', tags:['Обмен','Ипотека'],     desc:'Уютная 2-комнатная в тихом дворе. Рядом школа и детский сад. Рассмотрим обмен!' },
    { id:5, type:'apartment', rooms:1, area:42,  district:'Есиль',       price:29000000,  exchange:false, hasVideo:true,  realtor:'Айгерим К.',   rating:4.9, color:'#7c6ff7', tags:['Студия'],              desc:'Стильная студия со смарт-дизайном. Встроенная кухня, вид на ночной город.' },
  ];
}

/* ── FEED ───────────────────────────────────── */
var EM = { apartment:'🏢', house:'🏡', commercial:'🏪', land:'🌳' };

function renderFeed() {
  var feed = document.getElementById('s-feed');
  if (!feed) return;
  feed.innerHTML = listings.map(buildCard).join('');
}

function buildCard(l) {
  var em  = EM[l.type] || '🏠';
  var pr  = l.price ? (l.price / 1e6).toFixed(1) + ' млн ₸' : 'по договору';
  var rm  = l.rooms ? l.rooms + 'к · ' : '';
  var ar  = l.area  ? l.area + ' м²' : '';
  var ini = (l.realtor || 'R').charAt(0);
  var bg  = l.color + '18';

  var tags = (l.tags || []).map(function (t) {
    var cls = t === 'Обмен' ? ' x' : t === 'Срочно' ? ' u' : '';
    return '<span class="fc-tag' + cls + '">' + t + '</span>';
  }).join('');

  var videoBadge = l.hasVideo
    ? '<div class="fc-badge-video"><i class="fas fa-play-circle"></i> Видео</div>' : '';
  var exchBadge = l.exchange
    ? '<div class="fc-badge-exch">🔄 Обмен</div>' : '';

  var hrtCls = l.liked ? 'fc-act-btn liked' : 's-ico';
  var hrtIco = l.liked ? 'fas fa-heart' : 'far fa-heart';

  return (
    '<div class="fcard" style="background:' + bg + '">' +
      '<div class="fc-bg-layer">' + em + '</div>' +
      '<div class="fc-overlay"></div>' +
      videoBadge + exchBadge +

      /* right side buttons */
      '<div class="fc-side">' +
        '<div class="side-btn">' +
          '<button class="s-ico' + (l.liked ? ' liked' : '') + '" id="hrt-' + l.id + '" onclick="toggleLike(' + l.id + ',this)">' +
            '<i class="' + hrtIco + '"></i>' +
          '</button>' +
          '<span class="s-lbl">' + (l.liked ? '1' : '0') + '</span>' +
        '</div>' +
        '<div class="side-btn">' +
          '<button class="s-ico" onclick="openDetail(' + l.id + ')"><i class="fas fa-expand-alt"></i></button>' +
          '<span class="s-lbl">Детали</span>' +
        '</div>' +
        '<div class="side-btn">' +
          '<button class="s-ico" onclick="goChat(' + l.id + ')"><i class="fas fa-comment"></i></button>' +
          '<span class="s-lbl">Чат</span>' +
        '</div>' +
        '<div class="side-btn">' +
          '<button class="s-ico" onclick="toast(\'📞 Звонок: ' + l.realtor + '\')"><i class="fas fa-phone"></i></button>' +
          '<span class="s-lbl">Звонок</span>' +
        '</div>' +
      '</div>' +

      /* bottom info */
      '<div class="fc-info">' +
        '<div class="fc-tags">' + tags + '</div>' +
        '<div class="fc-loc"><i class="fas fa-map-marker-alt"></i>' + l.district + '</div>' +
        '<div class="fc-title">' + rm + ar + '</div>' +
        '<div class="fc-price">' + pr + '</div>' +
        '<div class="fc-desc">' + (l.desc || '') + '</div>' +
        '<div class="fc-realtor">' +
          '<div class="fc-ava" style="background:' + l.color + '">' + ini + '</div>' +
          '<div>' +
            '<div class="fc-rname">' + l.realtor + '</div>' +
            '<div class="fc-rstar">★ ' + l.rating + '</div>' +
          '</div>' +
          '<button class="fc-more" onclick="openDetail(' + l.id + ')">Подробнее</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function toggleLike(id, btn) {
  var l = listings.find(function (x) { return x.id === id; });
  if (!l) return;
  l.liked = !l.liked;
  btn.innerHTML = '<i class="' + (l.liked ? 'fas' : 'far') + ' fa-heart"></i>';
  if (l.liked) btn.classList.add('liked'); else btn.classList.remove('liked');
  var lbl = btn.parentNode.nextElementSibling;
  if (lbl) lbl.textContent = l.liked ? '1' : '0';
  toast(l.liked ? '❤️ В избранное' : '💔 Убрано');
}

function openDetail(id) {
  var l = listings.find(function (x) { return x.id === id; });
  if (!l) return;
  var em  = EM[l.type] || '🏠';
  var pr  = l.price ? (l.price / 1e6).toFixed(1) + ' млн ₸' : 'По договору';
  var rmH = l.rooms ? '<div class="det-cell"><div class="det-val">' + l.rooms + 'к</div><div class="det-lbl">Комнаты</div></div>' : '';
  var arH = l.area  ? '<div class="det-cell"><div class="det-val">' + l.area + '</div><div class="det-lbl">Площадь м²</div></div>' : '';
  var exch = l.exchange ? '<div style="font-size:12px;color:var(--acc2);display:flex;align-items:center;gap:4px;padding:0 18px 8px"><i class="fas fa-exchange-alt"></i> Рассмотрим обмен</div>' : '';

  document.getElementById('m-det-body').innerHTML =
    '<div class="sh-hnd"></div>' +
    '<div class="det-vis" style="background:' + l.color + '14">' + em + '</div>' +
    '<div class="det-price">' + pr + '</div>' +
    exch +
    '<div class="det-grid">' +
      rmH + arH +
      '<div class="det-cell"><div class="det-val">' + l.district + '</div><div class="det-lbl">Район</div></div>' +
      '<div class="det-cell"><div class="det-val">⭐ ' + l.rating + '</div><div class="det-lbl">Рейтинг</div></div>' +
    '</div>' +
    '<div class="det-desc">' + (l.desc || '').replace(/\n/g, '<br>') + '</div>' +
    '<div class="det-cta">' +
      '<button class="cta-c call" onclick="toast(\'📞 Звонок: ' + l.realtor + '\')"><i class="fas fa-phone"></i> Позвонить</button>' +
      '<button class="cta-c chat" onclick="closeM(\'m-det\');go(\'s-flai\');nav(document.getElementById(\'n-flai\'))"><i class="fas fa-comment"></i> Написать</button>' +
    '</div>';
  openM('m-det');
}

function goChat(id) {
  var l = listings.find(function (x) { return x.id === id; });
  go('s-flai');
  nav(document.getElementById('n-flai'));
  if (l) toast('💬 Чат по объекту: ' + l.district);
}

/* ── SEARCH ─────────────────────────────────── */
function setChip(el, filter) {
  document.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('on'); });
  el.classList.add('on');
  curFilter = filter;
  doSearch();
}

function doSearch() {
  var q = ((document.getElementById('srch-in') || {}).value || '').toLowerCase().trim();
  var res = listings.slice();
  if (curFilter === 'exchange') res = res.filter(function (l) { return l.exchange; });
  else if (curFilter === 'video') res = res.filter(function (l) { return l.hasVideo; });
  else if (curFilter !== 'all') res = res.filter(function (l) { return l.type === curFilter; });
  if (q) res = res.filter(function (l) {
    return (l.district || '').toLowerCase().indexOf(q) >= 0 ||
           (l.realtor  || '').toLowerCase().indexOf(q) >= 0 ||
           (l.tags || []).some(function (t) { return t.toLowerCase().indexOf(q) >= 0; });
  });
  renderSearch(res);
}

function renderSearch(res) {
  var el = document.getElementById('srch-res');
  if (!el) return;
  if (!res.length) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">🔍</div><div class="empty-t">Ничего не найдено</div><div class="empty-s">Попробуйте другой запрос</div></div>';
    return;
  }
  el.innerHTML = res.map(function (l) {
    var em = EM[l.type] || '🏠';
    var pr = l.price ? (l.price / 1e6).toFixed(1) + ' млн ₸' : '—';
    var rm = l.rooms ? l.rooms + 'к · ' : '';
    var ex = l.exchange ? ' · 🔄' : '';
    return (
      '<div class="s-card su" onclick="openDetail(' + l.id + ')">' +
        '<div class="s-ico-b" style="background:' + l.color + '20">' + em + '</div>' +
        '<div class="s-inf">' +
          '<div class="s-name">' + rm + l.area + ' м² · ' + l.district + '</div>' +
          '<div class="s-price">' + pr + '</div>' +
          '<div class="s-sub">' + l.realtor + ' · ⭐ ' + l.rating + ex + '</div>' +
        '</div>' +
        '<i class="fas fa-chevron-right" style="color:var(--t3);font-size:12px"></i>' +
      '</div>'
    );
  }).join('');
}

/* ── AI ─────────────────────────────────────── */
function genAI() {
  var type  = (document.getElementById('a-type')     || {}).value || 'apartment';
  var rooms = (document.getElementById('a-rooms')    || {}).value || '3';
  var area  = (document.getElementById('a-area')     || {}).value || '';
  var dist  = (document.getElementById('a-district') || {}).value || 'Есиль';
  var price = (document.getElementById('a-price')    || {}).value || '';
  var exch  = (document.getElementById('a-exch')     || {}).checked || false;
  toast('🤖 Генерирую описание...');
  fetch('/api/ai/describe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: type, rooms: rooms, area: area, district: dist, price: price, exchange: exch })
  }).then(function (r) { return r.json(); }).then(function (d) {
    var t = document.getElementById('ai-txt');
    var w = document.getElementById('ai-box-wrap');
    if (t) t.textContent = d.description;
    if (w) w.style.display = 'block';
  }).catch(function () { toast('⚠️ Ошибка генерации'); });
}

function useAI() {
  var txt = (document.getElementById('ai-txt') || {}).textContent || '';
  var desc = document.getElementById('a-desc');
  if (desc) desc.value = txt;
  var w = document.getElementById('ai-box-wrap');
  if (w) w.style.display = 'none';
  toast('✅ Описание применено');
}

function submitListing() {
  toast('🚀 Объект опубликован!');
  closeM('m-add');
}

/* ── CHAT FLAI ──────────────────────────────── */
function setRole(role, btn) {
  curRole = role;
  document.querySelectorAll('#rt-buyer,#rt-realtor').forEach(function (b) { b.classList.remove('on'); });
  btn.classList.add('on');
}

function sendFlai() {
  var inp = document.getElementById('flai-inp');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) return;
  if (inp) inp.value = '';
  addMsg('flai-msgs', txt, true);
  var typing = addTyping('flai-msgs');
  fetch('/api/chat/flai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: txt, role: curRole })
  }).then(function (r) { return r.json(); }).then(function (d) {
    typing.remove();
    addMsg('flai-msgs', d.reply, false, 'F');
  }).catch(function () {
    typing.remove();
    addMsg('flai-msgs', 'Попробуйте снова 🙏', false, 'F');
  });
}

/* ── CHAT AIRA ──────────────────────────────── */
function sendAira() {
  if (!curUser) { toast('🔐 Только для риэлторов'); openM('m-auth'); return; }
  var inp = document.getElementById('aira-inp');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) return;
  if (inp) inp.value = '';
  addMsg('aira-msgs', txt, true);
  toast('✅ Отправлено в Aira');
}

function needAuthAira() {
  if (!curUser) { toast('🔐 Только для риэлторов'); openM('m-auth'); }
}

function toggleThread(hd) {
  var body = hd.nextElementSibling;
  var ico  = hd.querySelector('.fa-chevron-down');
  if (!body) return;
  var open = body.style.display === 'block';
  body.style.display = open ? 'none' : 'block';
  if (ico) ico.style.transform = open ? '' : 'rotate(180deg)';
}

/* ── MSG HELPERS ─────────────────────────────── */
function addMsg(cid, txt, mine, ini) {
  var c = document.getElementById(cid);
  if (!c) return;
  var div = document.createElement('div');
  div.className = 'msg su' + (mine ? ' me' : '');
  var now = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  var fmt = txt.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br>');
  if (mine) {
    div.innerHTML = '<div><div class="bubble">' + fmt + '</div><div class="m-time">' + now + '</div></div>';
  } else {
    div.innerHTML =
      '<div class="m-ava">' + (ini || 'AI') + '</div>' +
      '<div><div class="bubble">' + fmt + '</div><div class="m-time">' + now + '</div></div>';
  }
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
  return div;
}

function addTyping(cid) {
  var c = document.getElementById(cid);
  if (!c) return { remove: function(){} };
  var div = document.createElement('div');
  div.className = 'msg';
  div.innerHTML = '<div class="m-ava">F</div><div><div class="bubble" style="padding:7px 11px"><div class="typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div></div>';
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
  return div;
}

/* ── CALENDAR ───────────────────────────────── */
function initCalendar() {
  fetch('/api/calendar')
    .then(function (r) { return r.json(); })
    .then(function (d) { calEvents = d.events || []; renderCal(); })
    .catch(function () { calEvents = fallbackCal(); renderCal(); });
}

function fallbackCal() {
  var t = new Date();
  function dt(d, h, m) { return new Date(t.getFullYear(), t.getMonth(), t.getDate() + d, h, m).toISOString(); }
  return [
    { id:1, title:'🏠 Показ квартиры', time:dt(0,10,0),  type:'showing', client:'Алия С.',       note:'Взять ключи' },
    { id:2, title:'📞 Звонок клиенту', time:dt(0,14,30), type:'call',    client:'Данияр М.',      note:'Обсудить условия' },
    { id:3, title:'✍️ Подписание',     time:dt(1,11,0),  type:'deal',    client:'Нурсулу К.',     note:'Проверить документы' },
    { id:4, title:'🏢 Показ коммерции',time:dt(1,15,0),  type:'showing', client:'Бизнес-клиент',  note:'Взять план' },
  ];
}

function renderCal() {
  var el = document.getElementById('cal-body');
  if (!el) return;
  var today  = new Date();
  var tom    = new Date(today); tom.setDate(tom.getDate() + 1);
  var dateStr = today.toLocaleDateString('ru', { weekday:'long', day:'numeric', month:'long' });

  function sameDay(a, b) {
    return a.getDate()===b.getDate() && a.getMonth()===b.getMonth() && a.getFullYear()===b.getFullYear();
  }
  var todayEv = calEvents.filter(function (e) { return sameDay(new Date(e.time), today); });
  var tomEv   = calEvents.filter(function (e) { return sameDay(new Date(e.time), tom);   });
  var colors  = { showing:'#7c6ff7', call:'#3ecfac', deal:'#ff5c7c', meeting:'#ffab30' };

  function evHtml(e) {
    var d  = new Date(e.time);
    var hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    var cl = colors[e.type] || '#7c6ff7';
    return (
      '<div class="ev-card">' +
        '<div class="ev-time"><div class="ev-hm">' + hm + '</div></div>' +
        '<div class="ev-line" style="background:' + cl + '"></div>' +
        '<div class="ev-inf">' +
          '<div class="ev-ttl">' + e.title + '</div>' +
          (e.client ? '<div class="ev-cli">👤 ' + e.client + '</div>' : '') +
          (e.note   ? '<div class="ev-note">💭 ' + e.note + '</div>' : '') +
        '</div>' +
      '</div>'
    );
  }

  var html =
    '<div class="cal-title">📅 Расписание</div>' +
    '<div class="cal-date">' + dateStr + '</div>' +
    '<div class="info-banner" style="margin-bottom:12px"><span class="ib-ico">🤖</span><span><b>Flai:</b> Показ сегодня в 10:00. Удачи! ✨</span></div>' +
    '<button class="add-btn" onclick="needAuth(function(){openM(\'m-ev\')})"><i class="fas fa-plus"></i> Добавить событие</button>';

  if (todayEv.length) html += '<div class="sec-lbl">Сегодня</div>' + todayEv.map(evHtml).join('');
  if (tomEv.length)   html += '<div class="sec-lbl">Завтра</div>'   + tomEv.map(evHtml).join('');
  html += '<div style="margin-top:20px"><div class="sec-lbl">🏆 Топ риэлторов</div>' + renderRating() + '</div>';

  el.innerHTML = html;
  var evd = document.getElementById('ev-date');
  if (evd) evd.value = today.toISOString().split('T')[0];
}

function renderRating() {
  var list = [
    { n:'Сауле Т.',   deals:68, r:5.0, rank:1 },
    { n:'Айгерим К.', deals:61, r:4.9, rank:2 },
    { n:'Данияр М.',  deals:54, r:4.7, rank:3 },
    { n:'Нурлан А.',  deals:43, r:4.6, rank:4 },
    { n:'Асель Б.',   deals:38, r:4.8, rank:5 },
  ];
  var medals = { 1:'🥇', 2:'🥈', 3:'🥉' };
  return list.map(function (r) {
    var ico = medals[r.rank] || r.rank;
    var bg  = r.rank===1 ? 'var(--acc4)' : r.rank===2 ? '#c0c0c0' : r.rank===3 ? '#cd7f32' : 'var(--inp)';
    var w   = Math.round(r.deals / 68 * 100);
    return (
      '<div class="rank-card">' +
        '<div class="rank-num" style="background:' + bg + ';color:' + (r.rank <= 3 ? '#fff' : 'var(--t3)') + '">' + ico + '</div>' +
        '<div style="flex:1">' +
          '<div style="font-size:13px;font-weight:700">' + r.n + '</div>' +
          '<div class="rank-bar" style="width:' + w + '%"></div>' +
          '<div style="font-size:11px;color:var(--t3);margin-top:3px">' + r.deals + ' сделок · ⭐ ' + r.r + '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

function saveEv() {
  var title  = (document.getElementById('ev-title')  || {}).value || 'Событие';
  var client = (document.getElementById('ev-client') || {}).value || '';
  var date   = (document.getElementById('ev-date')   || {}).value || '';
  var time   = (document.getElementById('ev-time')   || {}).value || '10:00';
  var note   = (document.getElementById('ev-note')   || {}).value || '';
  var type   = (document.getElementById('ev-type')   || {}).value || 'showing';
  var emMap  = { showing:'🏠', call:'📞', deal:'✍️', meeting:'🤝' };
  var em     = emMap[type] || '📅';
  calEvents.push({ id:Date.now(), title:em+' '+title, time:new Date(date+'T'+time).toISOString(), type:type, client:client, note:note });
  renderCal();
  closeM('m-ev');
  toast('✅ Добавлено! Flai напомнит 🤖');
}

/* ── PROFILE ────────────────────────────────── */
function renderProf() {
  var el = document.getElementById('prof-body');
  if (!el) return;
  if (!curUser) {
    el.innerHTML =
      '<div class="empty">' +
        '<div class="empty-ico">👤</div>' +
        '<div class="empty-t">Войдите в систему</div>' +
        '<div class="empty-s">Только для верифицированных риэлторов</div>' +
        '<button class="btn-main" style="max-width:220px;margin:18px auto 0" onclick="openM(\'m-auth\')">Войти / Регистрация</button>' +
      '</div>';
    return;
  }
  var ini = (curUser.name || 'R').charAt(0).toUpperCase();
  el.innerHTML =
    '<div class="prof-hero">' +
      '<div class="ph-ava">' + ini + '</div>' +
      '<div class="ph-name">' + curUser.name + '</div>' +
      '<div class="ph-tag">🏠 Верифицированный риэлтор · Астана</div>' +
      '<div class="ph-stats">' +
        '<div class="ph-stat"><div class="ph-val">12</div><div class="ph-lbl">Объектов</div></div>' +
        '<div class="ph-stat"><div class="ph-val">⭐ 4.8</div><div class="ph-lbl">Рейтинг</div></div>' +
        '<div class="ph-stat"><div class="ph-val">47</div><div class="ph-lbl">Сделок</div></div>' +
      '</div>' +
    '</div>' +

    '<div class="mnu-sec">' +
      '<div class="mnu-lbl">Мои объекты</div>' +
      '<div class="mnu-item" onclick="toast(\'📋 Мои объекты\')"><div class="mnu-ico" style="background:rgba(124,111,247,.14)">🏠</div><div style="flex:1"><div class="mnu-name">Активные объекты</div><div class="mnu-sub">12 опубликованы</div></div><i class="fas fa-chevron-right" style="color:var(--t3);font-size:12px"></i></div>' +
      '<div class="mnu-item" onclick="toast(\'❤️ Избранное\')"><div class="mnu-ico" style="background:rgba(255,92,124,.12)">❤️</div><div style="flex:1"><div class="mnu-name">Избранное</div><div class="mnu-sub">8 объектов</div></div><i class="fas fa-chevron-right" style="color:var(--t3);font-size:12px"></i></div>' +
    '</div>' +

    '<div class="mnu-sec">' +
      '<div class="mnu-lbl">Инструменты</div>' +
      '<div class="mnu-item" onclick="go(\'s-cal\');nav(null)"><div class="mnu-ico" style="background:rgba(62,207,172,.12)">📅</div><div style="flex:1"><div class="mnu-name">Планировщик</div><div class="mnu-sub">4 события</div></div><i class="fas fa-chevron-right" style="color:var(--t3);font-size:12px"></i></div>' +
      '<div class="mnu-item" onclick="toast(\'🏆 Рейтинг\')"><div class="mnu-ico" style="background:rgba(255,171,48,.12)">🏆</div><div style="flex:1"><div class="mnu-name">Рейтинг риэлторов</div><div class="mnu-sub">Вы на 3-м месте</div></div><i class="fas fa-chevron-right" style="color:var(--t3);font-size:12px"></i></div>' +
      '<div class="mnu-item" onclick="toast(\'💡 Налоговый советник\')"><div class="mnu-ico" style="background:rgba(255,171,48,.08)">💡</div><div style="flex:1"><div class="mnu-name">Налоговый советник 2026</div><div class="mnu-sub">Обмен vs продажа</div></div><span class="ttax">Новое</span></div>' +
    '</div>' +

    '<div class="mnu-sec">' +
      '<div class="mnu-lbl">Аккаунт</div>' +
      '<div class="mnu-item" onclick="toast(\'⚙️ Настройки\')"><div class="mnu-ico" style="background:rgba(124,111,247,.08)">⚙️</div><div style="flex:1"><div class="mnu-name">Настройки</div><div class="mnu-sub">Профиль, уведомления</div></div><i class="fas fa-chevron-right" style="color:var(--t3);font-size:12px"></i></div>' +
      '<div class="mnu-item" onclick="doLogout()"><div class="mnu-ico" style="background:rgba(255,92,124,.08)">🚪</div><div style="flex:1"><div class="mnu-name" style="color:var(--acc3)">Выйти</div></div></div>' +
    '</div>';
}

/* ── AUTH ───────────────────────────────────── */
function authTab(t) {
  document.getElementById('at-in').classList.toggle('on', t === 'in');
  document.getElementById('at-up').classList.toggle('on', t === 'up');
  document.getElementById('af-in').style.display = t === 'in' ? 'block' : 'none';
  document.getElementById('af-up').style.display = t === 'up' ? 'block' : 'none';
}

function doLogin() {
  var email = (document.getElementById('l-email') || {}).value || '';
  if (!email) { toast('⚠️ Введите email'); return; }
  fetch('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email })
  }).then(function (r) { return r.json(); }).then(function (d) {
    if (d.success) {
      curUser = d.user;
      localStorage.setItem('flapy_user', JSON.stringify(curUser));
      renderAuthSlot(); closeM('m-auth'); renderProf();
      toast('👋 Добро пожаловать, ' + (curUser.name || 'риэлтор') + '!');
    }
  }).catch(function () { toast('⚠️ Ошибка входа'); });
}

function doReg() {
  var name  = (document.getElementById('r-name')  || {}).value || '';
  var email = (document.getElementById('r-email') || {}).value || '';
  if (!name || !email) { toast('⚠️ Заполните обязательные поля'); return; }
  fetch('/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name, email: email })
  }).then(function (r) { return r.json(); }).then(function (d) {
    if (d.success) {
      curUser = Object.assign({}, d.user, { name: name });
      localStorage.setItem('flapy_user', JSON.stringify(curUser));
      renderAuthSlot(); closeM('m-auth'); renderProf();
      toast('🎉 Добро пожаловать в Flapy, ' + name + '!');
    }
  }).catch(function () { toast('⚠️ Ошибка регистрации'); });
}

function doLogout() {
  curUser = null;
  localStorage.removeItem('flapy_user');
  renderAuthSlot(); renderProf();
  toast('👋 Вы вышли');
}

function renderAuthSlot() {
  var slot = document.getElementById('auth-slot');
  if (!slot) return;
  if (curUser) {
    var ini = (curUser.name || 'R').charAt(0).toUpperCase();
    var fn  = (curUser.name || 'Профиль').split(' ')[0];
    slot.innerHTML =
      '<div class="user-chip" onclick="go(\'s-prof\');nav(null)">' +
        '<div class="u-ava">' + ini + '</div>' +
        '<span>' + fn + '</span>' +
      '</div>';
  } else {
    slot.innerHTML = '<button class="login-btn" onclick="openM(\'m-auth\')">Войти</button>';
  }
}

function needAuth(cb) {
  if (curUser) cb();
  else { toast('🔐 Войдите как риэлтор'); openM('m-auth'); }
}

/* ── NAV / SCREENS ──────────────────────────── */
function go(id) {
  document.querySelectorAll('.scr').forEach(function (s) { s.classList.remove('on'); });
  var s = document.getElementById(id);
  if (s) s.classList.add('on');
  if (id === 's-cal')    renderCal();
  if (id === 's-prof')   renderProf();
  if (id === 's-search') setTimeout(doSearch, 40);
}

function nav(el) {
  document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('on'); });
  if (el) el.classList.add('on');
}

function showMore() { openM('m-more'); }

/* ── MODALS ─────────────────────────────────── */
function openM(id) { var el = document.getElementById(id); if (el) el.classList.add('on'); }
function closeM(id) { var el = document.getElementById(id); if (el) el.classList.remove('on'); }
function closeOvl(e, id) { if (e.target.id === id) closeM(id); }

/* ── THEME / LANG ───────────────────────────── */
function toggleTheme() {
  var cur  = document.documentElement.getAttribute('data-theme');
  var next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('flapy_theme', next);
  updateThemeIcon(next);
}
function updateThemeIcon(th) {
  var btn = document.getElementById('btn-theme');
  if (btn) btn.innerHTML = th === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}
function toggleLang() {
  curLang = curLang === 'ru' ? 'kz' : 'ru';
  var btn = document.getElementById('btn-lang');
  if (btn) btn.textContent = curLang === 'ru' ? '🇰🇿 Қаз' : '🇷🇺 Рус';
  toast(curLang === 'kz' ? '🇰🇿 Қазақ тілі қосылды' : '🇷🇺 Русский язык');
}

/* ── TOAST ──────────────────────────────────── */
function toast(msg, ms) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { el.classList.remove('on'); }, ms || 2400);
}
