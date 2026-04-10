/* ═══════════════════════════════════════════════════════════
   FLAPY  app.js  v5.5  — FINAL FIX
   - Исправлено зависание заставки
   - Удален Flai полностью
   - Кнопка "+" скрыта для гостей
   - Только 2 кнопки для незарегистрированных
═══════════════════════════════════════════════════════════ */
'use strict'; 

var listings = [], calEvents = [], realtors = [], curUser = null;
var curFilter = 'all', curLang = 'ru', listTab = 'obj';

var T = {
  ru: {
    tagline: 'Ваш умный помощник на рынке жилья',
    tab_obj: 'Объекты', tab_exch: 'Обмен',
    filt_all: 'Все', filt_apt: 'Квартиры', filt_house: 'Дома',
    filt_comm: 'Коммерция', filt_video: '🎬 Видео',
    call: 'Позвонить', msg: 'Написать',
    aira_sub: '— Чат риэлторов',
    rel_header: 'Риэлторы', rel_sub: 'Выберите лучшего специалиста',
    notif_title: 'Уведомления', menu_title: 'Меню',
    today: 'Сегодня',
    test_hint: 'Тест: <b>test@realtor.kz</b> / <b>demo123</b>',
    email_lbl: 'Email', pass_lbl: 'Пароль',
    signin_btn: 'Войти', reg_btn: 'Зарегистрироваться',
    no_acc: 'Нет аккаунта? Зарегистрироваться',
    have_acc: 'Уже есть аккаунт',
    reg_hint: 'Только для риэлторов — верифицированный статус сразу',
    add_photo: 'Добавить фото', add_video: 'Добавить видео',
    publish_btn: 'Опубликовать',
    nav_obj: 'Объекты', nav_feed: 'Лента',
    rooms: 'Комнат', area: 'Площадь м²', district: 'Район'
  },
  kz: {
    tagline: 'Жылжымайтын мүлік нарығындағы ақылды көмекшіңіз',
    tab_obj: 'Объектілер', tab_exch: 'Айырбас',
    filt_all: 'Барлығы', filt_apt: 'Пәтерлер', filt_house: 'Үйлер',
    filt_comm: 'Коммерция', filt_video: '🎬 Бейне',
    call: 'Қоңырау', msg: 'Жазу',
    aira_sub: '— Риэлторлар чаты',
    rel_header: 'Риэлторлар', rel_sub: 'Ең жақсы маманды таңдаңыз',
    notif_title: 'Хабарламалар', menu_title: 'Мәзір',
    today: 'Бүгін',
    test_hint: 'Тест: <b>test@realtor.kz</b> / <b>demo123</b>',
    email_lbl: 'Email', pass_lbl: 'Құпия сөз',
    signin_btn: 'Кіру', reg_btn: 'Тіркелу',
    no_acc: 'Аккаунт жоқ па? Тіркелу',
    have_acc: 'Аккаунт бар',
    reg_hint: 'Тек риэлторлар үшін — расталған мәртебе бірден',
    add_photo: 'Фото қосу', add_video: 'Бейне қосу',
    publish_btn: 'Жариялау',
    nav_obj: 'Объект', nav_feed: 'Лента',
    rooms: 'Бөлмелер', area: 'Ауданы м²', district: 'Аудан'
  }
};

function t(key) { return (T[curLang] && T[curLang][key]) || (T.ru[key] || key); }

/* ── BOOT ──────────────────────────────────────────────── */
window.addEventListener('load', function() {
  try {
    var s = localStorage.getItem('fp_user');
    if (s) curUser = JSON.parse(s);
  } catch(e) { console.error('Auth error', e); }
  
  try {
    var th = localStorage.getItem('fp_theme') || 'light';
    applyTheme(th);
    curLang = localStorage.getItem('fp_lang') || 'ru';
    applyLangUI();
    if (curUser) renderAuthSlot();
    updateNavVisibility();
  } catch(e) { console.error('Init error', e); }
  
  // Гарантированно скрываем загрузчик
  setTimeout(function() {
    try {
      var ld = document.getElementById('loader');
      if (ld) {
        ld.style.opacity = '0';
        setTimeout(function() { ld.style.display = 'none'; }, 300);
      }
      fetchListings();
      fetchCalendar();
    } catch(e) {
      console.error('Loader error', e);
      var ld = document.getElementById('loader');
      if (ld) ld.style.display = 'none';
    }
  }, 1000);
});

window.addEventListener('DOMContentLoaded', function() {
  try {
    var ns = document.getElementById('n-search');
    if (ns) ns.classList.add('on');
    updateAiraBadge();
  } catch(e) {}
});

function fetchListings() {
  fetch('/api/listings')
    .then(function(r) { return r.json(); })
    .then(function(d) { listings = d.listings || []; renderFeed(); renderListings(); })
    .catch(function() { listings = getFallbackListings(); renderFeed(); renderListings(); });
}

function fetchCalendar() {
  fetch('/api/calendar')
    .then(function(r) { return r.json(); })
    .then(function(d) { calEvents = d.events || []; })
    .catch(function() { calEvents = getFallbackCal(); });
}

function getFallbackListings() {
  return [
    { id:1, type:'apartment', rooms:3, area:85, district:'Бостандыкский', city:'Алматы', price:78500000, exchange:false, hasVideo:true, videoUrl:'https://tiktok.com/@example/1', realtor:'Айгерим К.', realtorId:'r1', realtorFull:'Айгерим Касымова', rating:4.9, deals:47, agency:'Century 21', tags:['Новострой'], badge:'Новое', desc:'Просторная 3-комнатная.', photos:['🛋️',''] },
    { id:2, type:'house', rooms:5, area:220, district:'Алматинский', city:'Астана', price:150000000, exchange:true, hasVideo:true, videoUrl:'https://tiktok.com/@example/2', realtor:'Сауле Т.', realtorId:'r3', realtorFull:'Сауле Тлеубекова', rating:5.0, deals:68, agency:'Royal Group', tags:['Обмен'], badge:'Обмен', desc:'Дом с участком.', photos:['🏡',''] }
  ];
}

function getFallbackCal() {
  return [];
}

/* ── FEED ──────────────────────────────────────────────── */
var EM = { apartment:'🏢', house:'🏡', commercial:'🏪', land:'🌳' };

function renderFeed() {
  var el = document.getElementById('s-feed');
  if (!el) return;
  if (!listings.length) {
    el.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#fff;flex-direction:column;gap:8px"><div style="font-size:48px">🏠</div><div>Загрузка...</div></div>';
    return;
  }
  el.innerHTML = listings.map(function(l,i){ return buildFeedCard(l,i); }).join('');
}

function buildFeedCard(l, idx) {
  var em = EM[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) + ' ₸' : 'по договору';
  var rm = l.rooms ? l.rooms+'к · ' : '';
  var ini = (l.realtor || 'R').charAt(0);
  var bgs = { apartment:'135deg,#1a1a40,#0d1b3e', house:'135deg,#1a2e1a,#0d2010', commercial:'135deg,#2e1a0d,#1a0d05', land:'135deg,#1a2e2e,#0d2020' };
  var bg = bgs[l.type] || bgs.apartment;
  var tags = (l.tags||[]).map(function(tg){ return '<span class="fc-chip'+(tg==='Обмен'?' exch':'')+'">'+tg+'</span>'; }).join('');
  var vbadge = l.hasVideo ? '<div class="fc-vbadge"><i class="fas fa-play-circle"></i> Видео</div>' : '';
  var exbadge = l.exchange ? '<div class="fc-exbadge">🔄 Обмен</div>' : '';
  
  var mediaHtml;
  if (l.hasVideo && l.videoUrl) {
    var isTikTok = l.videoUrl.includes('tiktok.com');
    if (isTikTok) {
      mediaHtml = '<div class="fc-video"><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.4);cursor:pointer" onclick="window.open(\''+l.videoUrl+'\',\'_blank\')"><div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:24px;color:#000;margin-bottom:6px"><i class="fab fa-tiktok"></i></div><div style="color:#fff;font-weight:bold">TikTok</div></div><div class="fc-bg">'+em+'</div></div>';
    } else {
      mediaHtml = '<div class="fc-bg">'+em+'</div>';
    }
  } else {
    mediaHtml = '<div class="fc-bg">'+em+'</div>';
  }
  
  return '<div class="fcard" style="background:linear-gradient('+bg+')" id="fc-'+l.id+'">'+mediaHtml+'<div class="fc-overlay"></div>'+vbadge+exbadge+'<div class="fc-side"><div class="sab"><button class="sab-btn" onclick="openDetail('+l.id+')"><i class="fas fa-info-circle"></i></button><span class="sab-lbl">Детали</span></div><div class="sab"><button class="sab-btn" onclick="go(\'s-aira\')"><i class="fas fa-comment"></i></button><span class="sab-lbl">Чат</span></div><div class="sab"><button class="sab-btn" onclick="callRealtor(\''+esc(l.phone||'+7 701 234 56 78')+'\')"><i class="fas fa-phone"></i></button><span class="sab-lbl">Звонок</span></div></div><div class="fc-info"><div class="fc-chips">'+tags+'</div><div class="fc-loc"><i class="fas fa-map-marker-alt"></i>'+esc(l.city)+', '+esc(l.district)+'</div><div class="fc-title">'+rm+(l.area||'')+' м²</div><div class="fc-price">'+pr+'</div><div class="fc-desc">'+esc(l.desc||'')+'</div><div class="fc-realtor"><div class="fc-r-ava" style="background:linear-gradient(135deg,#1E2D5A,#4A6FA5)">'+ini+'</div><div><div class="fc-r-name">'+esc(l.realtor||'')+'</div><div class="fc-r-sub">'+esc(l.agency||'')+'</div></div><button class="fc-r-btn" onclick="openDetail('+l.id+')">Подробнее</button></div></div></div>';
}

/* ── LISTINGS ──────────────────────────────────────────── */
function setListTab(tab) {
  listTab = tab;
  var tabObj = document.getElementById('tab-obj');
  var tabExch = document.getElementById('tab-exch');
  if (tabObj) tabObj.classList.toggle('on', tab==='obj');
  if (tabExch) tabExch.classList.toggle('on', tab==='exch');
  renderListings();
}

function setFilt(el, f) {
  document.querySelectorAll('.fchip').forEach(function(c){ c.classList.remove('on'); });
  el.classList.add('on');
  curFilter = f;
  renderListings();
}

function renderListings() {
  var el = document.getElementById('list-body');
  if (!el) return;
  var res = listings.slice();
  if (listTab === 'exch') res = res.filter(function(l){ return l.exchange; });
  if (curFilter === 'video') res = res.filter(function(l){ return l.hasVideo; });
  else if (curFilter !== 'all') res = res.filter(function(l){ return l.type === curFilter; });
  
  if (!res.length) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">🔍</div><div class="empty-t">Ничего не найдено</div><div class="empty-s">Попробуйте другой фильтр</div></div>';
    return;
  }
  el.innerHTML = res.map(buildListCard).join('');
}

function buildListCard(l) {
  var em = EM[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) : '—';
  var rm = l.rooms ? l.rooms+'-комнатная, ' : '';
  var ini = (l.realtor || 'R').charAt(0);
  var badgeColor = { 'Горящее': '#E74C3C', 'Топ': '#27AE60', 'Обмен': '#9B59B6' }[l.badge] || '#F47B20';
  var rcol = l.realtorColor || '#1E2D5A';
  
  var mediaHtml = '<div class="lcard-media" onclick="openDetail('+l.id+')"><div class="lcard-em">'+em+'</div><div class="lcard-badge" style="background:'+badgeColor+'">'+(l.badge||'')+'</div></div>';
  
  if (l.hasVideo && l.videoUrl) {
    var isTikTok = l.videoUrl.includes('tiktok.com');
    if (isTikTok) {
      mediaHtml = '<div class="lcard-media" style="cursor:pointer" onclick="event.stopPropagation();window.open(\''+l.videoUrl+'\',\'_blank\')"><div class="lcard-em">'+em+'</div><div class="video-thumb"><div class="video-play"><i class="fab fa-tiktok" style="font-size:24px;color:#000"></i></div><div class="video-lbl">TikTok</div></div><div class="lcard-badge" style="background:'+badgeColor+'">'+(l.badge||'')+'</div></div>';
    }
  }
  
  return '<div class="lcard su" onclick="openDetail('+l.id+')">'+mediaHtml+'<div class="lcard-body"><div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>'+esc(l.city)+', '+esc(l.district)+'</div><div class="lcard-price">'+pr+' ₸</div><div class="lcard-sub">'+rm+l.area+' м²'+(l.exchange?' · 🔄 Обмен':'')+'</div><div class="lcard-tags">'+(l.tags||[]).map(function(tg){ return '<span class="ltag'+(tg==='Обмен'?' exch':'')+'">'+tg+'</span>'; }).join('')+'</div><div class="lcard-footer"><div class="lf-ava" style="background:'+rcol+'">'+ini+'</div><div class="lf-name">'+esc(l.realtorFull||l.realtor||')+' · '+esc(l.agency||'')+'</div></div><div class="lcard-cta"><button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\''+esc(l.phone||'+7 701 234 56 78')+'\')"><i class="fas fa-phone"></i> '+t('call')+'</button><button class="cta-btn cta-msg" onclick="event.stopPropagation();go(\'s-aira\')"><i class="fas fa-comment"></i> '+t('msg')+'</button></div></div></div>';
}

/* ── UTILS ─────────────────────────────────────────────── */
function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }
function esc(s) { return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtPrice(p) { return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

/* ── NAVIGATION ────────────────────────────────────────── */
function updateNavVisibility() {
  try {
    var plusWrap = document.getElementById('nav-plus-wrap');
    var moreBtn = document.getElementById('n-more');
    
    if (curUser) {
      if (plusWrap) plusWrap.style.display = 'block';
      if (moreBtn) moreBtn.style.display = 'flex';
    } else {
      if (plusWrap) plusWrap.style.display = 'none';
      if (moreBtn) moreBtn.style.display = 'none';
    }
  } catch(e) { console.error('Nav visibility error', e); }
}

function go(id) {
  document.querySelectorAll('.scr').forEach(function(s){ s.classList.remove('on'); });
  var s = document.getElementById(id);
  if (s) s.classList.add('on');
  if (id === 's-cal') { if (!calEvents.length) fetchCalendar(); renderCal(); }
  if (id === 's-prof') renderProf();
  if (id === 's-search') renderListings();
}

function nav(el) {
  document.querySelectorAll('.nav-it').forEach(function(n){ n.classList.remove('on'); });
  if (el) el.classList.add('on');
}

function openM(id) { var e = document.getElementById(id); if (e) e.classList.add('on'); }
function closeM(id) { var e = document.getElementById(id); if (e) e.classList.remove('on'); }
function closeOvl(e, id) { if (e.target.id === id) closeM(id); }

/* ── THEME & LANG ──────────────────────────────────────── */
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

function setLang(lang) {
  curLang = lang;
  localStorage.setItem('fp_lang', lang);
  applyLangUI();
  toast(lang === 'kz' ? '🇰🇿 Қазақ тілі' : '🇷🇺 Русский');
}

function applyLangUI() {
  try {
    var ru = document.getElementById('lo-ru'), kz = document.getElementById('lo-kz');
    if (ru) ru.classList.toggle('on', curLang === 'ru');
    if (kz) kz.classList.toggle('on', curLang === 'kz');
    
    document.querySelectorAll('[data-ru]').forEach(function(el) {
      var val = el.getAttribute('data-' + curLang);
      if (val) el.textContent = val;
    });
    renderListings();
  } catch(e) {}
}

/* ── TOAST ─────────────────────────────────────────────── */
function toast(msg, ms) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function(){ el.classList.remove('show'); }, ms || 2400);
}

/* ── AUTH ─────────────────────────────────────────────── */
function authTab(t) {
  var atIn = document.getElementById('at-in'), atUp = document.getElementById('at-up');
  var afIn = document.getElementById('af-in'), afUp = document.getElementById('af-up');
  if (atIn) atIn.classList.toggle('on', t === 'in');
  if (atUp) atUp.classList.toggle('on', t === 'up');
  if (afIn) afIn.style.display = t === 'in' ? 'block' : 'none';
  if (afUp) afUp.style.display = t === 'up' ? 'block' : 'none';
}

function doLogin() {
  var email = val('l-email');
  if (!email) { toast('⚠️ Введите email'); return; }
  
  fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:email}) })
    .then(function(r){ return r.json(); })
    .then(function(d) {
      if (d.success) {
        curUser = d.user;
        localStorage.setItem('fp_user', JSON.stringify(curUser));
        renderAuthSlot();
        closeM('m-auth');
        renderProf();
        updateAiraBadge();
        updateNavVisibility();
        toast('👋 Добро пожаловать!');
      }
    }).catch(function(){ toast('⚠️ Ошибка входа'); });
}

function doReg() {
  var name = val('r-name'), email = val('r-email'), pass = val('r-pass');
  var phone = val('r-phone'), agency = val('r-agency');
  if (!name || !email || pass.length < 6) { toast('⚠️ Заполните все поля'); return; }
  
  fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:name,email:email,phone:phone,agency:agency}) })
    .then(function(r){ return r.json(); })
    .then(function(d) {
      if (d.success) {
        curUser = Object.assign({}, d.user, {name:name, phone:phone, agency:agency||'Самозанятый'});
        localStorage.setItem('fp_user', JSON.stringify(curUser));
        renderAuthSlot();
        closeM('m-auth');
        renderProf();
        updateAiraBadge();
        updateNavVisibility();
        toast('🎉 Добро пожаловать!');
      }
    }).catch(function(){ toast('⚠️ Ошибка регистрации'); });
}

function doLogout() {
  curUser = null;
  localStorage.removeItem('fp_user');
  renderAuthSlot();
  renderProf();
  updateAiraBadge();
  updateNavVisibility();
  toast('👋 До встречи!');
}

function renderAuthSlot() {
  var slot = document.getElementById('auth-slot');
  if (!slot) return;
  if (curUser) {
    var ini = (curUser.name||'R').charAt(0).toUpperCase();
    var fn = (curUser.name||'Профиль').split(' ')[0];
    slot.innerHTML = '<div class="u-chip" onclick="go(\'s-prof\');nav(null)"><div class="u-ava">'+ini+'</div><span class="u-nm">'+esc(fn)+'</span></div>';
  } else {
    slot.innerHTML = '<button class="login-btn" onclick="openM(\'m-auth\')">Войти</button>';
  }
}

/* ── AIRA CHAT ─────────────────────────────────────────── */
function updateAiraBadge() {
  var badge = document.getElementById('aira-status-badge');
  if (!badge) return;
  if (curUser) {
    badge.style.cssText = 'background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:#27AE60;font-weight:600';
    badge.textContent = '✓ '+curUser.name.split(' ')[0];
  } else {
    badge.style.cssText = 'background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:#F47B20;font-weight:600';
    badge.textContent = '🔒 Войдите';
  }
}

function sendAira() {
  var inp = document.getElementById('aira-inp');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) return;
  if (!curUser) { toast('🔐 Войдите'); openM('m-auth'); return; }
  inp.value = '';
  toast('✅ Отправлено в Aira');
}

/* ── DETAIL ────────────────────────────────────────────── */
function openDetail(id) {
  var l = listings.find(function(x){ return x.id === id; });
  if (!l) return;
  
  var em = EM[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) : 'По договору';
  var detBody = document.getElementById('m-det-body');
  if (!detBody) return;
  
  detBody.innerHTML = '<div class="sh-handle"></div><div class="det-visual"><div class="det-em-bg">'+em+'</div></div><div class="det-price">'+pr+' ₸</div><div class="det-desc">'+esc(l.desc||'')+'</div><div class="det-cta"><button class="det-btn det-call" onclick="callRealtor(\''+(l.phone||'+7 701 234 56 78')+'\')"><i class="fas fa-phone"></i> Позвонить</button><button class="det-btn det-chat" onclick="closeM(\'m-det\');go(\'s-aira\')"><i class="fas fa-comment"></i> Написать</button></div>';
  openM('m-det');
}

function callRealtor(phone) {
  toast('📞 Звонок: '+phone);
  setTimeout(function(){ window.location.href = 'tel:'+phone.replace(/\s/g,''); }, 600);
}

/* ── PROFILE ───────────────────────────────────────────── */
function renderProf() {
  var el = document.getElementById('prof-body');
  if (!el) return;
  
  if (!curUser) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">👤</div><div class="empty-t">Войдите в систему</div><button class="btn-primary" style="max-width:220px;margin:16px auto 0;display:flex" onclick="openM(\'m-auth\')">Войти</button></div>';
    return;
  }
  
  var ini = (curUser.name||'R').charAt(0).toUpperCase();
  el.innerHTML = '<div class="prof-hero"><div class="ph-ava">'+ini+'</div><div class="ph-name">'+esc(curUser.name)+'</div><div class="ph-tag">🏠 Риэлтор</div></div><div class="menu-sec"><div class="menu-item" onclick="doLogout()"><div class="menu-name" style="color:#E74C3C">🚪 Выйти</div></div></div>';
}

/* ── CALENDAR ──────────────────────────────────────────── */
function renderCal() {
  var el = document.getElementById('cal-body');
  if (!el) return;
  el.innerHTML = '<div class="cal-title">📅 Календарь</div><div style="text-align:center;padding:20px;color:var(--t3)">Загрузка...</div>';
}

/* ── ADD LISTING ───────────────────────────────────────── */
function openAddListing() {
  if (!curUser) { toast('🔐 Войдите'); openM('m-auth'); return; }
  openM('m-add');
}

function uploadMedia(type) {
  toast(type === 'photo' ? '📷 Фото добавлено' : '🎬 Видео добавлено');
}

function submitListing() {
  var type = val('a-type') || 'apartment';
  var area = val('a-area');
  var price = val('a-price');
  var videoU = val('a-video');
  
  if (!area || isNaN(parseInt(area))) { toast('⚠️ Укажите площадь'); return; }
  if (!price || isNaN(parseInt(price))) { toast('⚠️ Укажите цену'); return; }
  
  var rooms = parseInt(val('a-rooms')) || 0;
  var newL = {
    id: Date.now(), type: type, rooms: rooms, area: parseInt(area),
    district: val('a-district') || 'Есиль', city: val('a-city') || 'Астана',
    price: parseInt(price), exchange: false, hasVideo: !!videoU, videoUrl: videoU,
    realtor: curUser ? curUser.name : 'Я', realtorFull: curUser ? curUser.name : 'Я',
    realtorId: curUser ? curUser.id : 'u_new', rating: 5.0, deals: 0,
    agency: curUser ? curUser.agency : 'Самозанятый',
    tags: [rooms+'к'], badge: 'Новое', desc: val('a-desc') || 'Новый объект',
    photos: ['🛋️']
  };
  
  listings.unshift(newL);
  renderListings();
  renderFeed();
  closeM('m-add');
  toast('🚀 Опубликовано! Цена: '+fmtPrice(parseInt(price))+' ₸');
}

function genAI() {
  toast('🤖 Генерация...');
  setTimeout(function() {
    var txtEl = document.getElementById('ai-txt');
    var wrap = document.getElementById('ai-box-wrap');
    if (txtEl) txtEl.textContent = '✨ Отличная квартира!';
    if (wrap) wrap.style.display = 'block';
  }, 1000);
}

function useAI() {
  var txt = (document.getElementById('ai-txt')||{}).textContent || '';
  var desc = document.getElementById('a-desc');
  if (desc) desc.value = txt;
  var w = document.getElementById('ai-box-wrap');
  if (w) w.style.display = 'none';
}
