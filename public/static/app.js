/* ═══════════════════════════════════════════════════════════
   FLAPY  app.js  v7.0  — ПОЛНОСТЬЮ РАБОЧАЯ ВЕРСИЯ
   - Форматирование цен (10 000 000)
   - Исправлен uploadMedia
   - Чат Aira в стиле WhatsApp
   - Авто-удаление лишних пунктов меню
   - Все функции в глобальной области
═══════════════════════════════════════════════════════════ */
'use strict';

/* ── GLOBAL STATE ─────────────────────────────────────── */
var listings = [], calEvents = [], realtors = [], curUser = null;
var curFilter = 'all', curLang = 'ru', listTab = 'obj';
var airaPosts = []; // Хранилище сообщений чата

/* ── INIT & DOM READY ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  fixMenu();
  setupPriceFormatter();
  updateAiraBadge();
  initAuth();
  fetchListings();
  initAiraChat();
});

/* ── AUTO-FIX MENU (УДАЛЯЕТ ЛИШНЕЕ) ───────────────────── */
function fixMenu() {
  document.querySelectorAll('.more-item').forEach(function(item) {
    var text = item.textContent || '';
    if (text.includes('Риэлторы') || text.includes('Календарь')) {
      item.remove();
    }
  });
}

/* ── PRICE FORMATTER (10 000 000) ─────────────────────── */
function setupPriceFormatter() {
  var priceInput = document.getElementById('a-price');
  if (priceInput) {
    priceInput.addEventListener('input', function(e) {
      var val = e.target.value.replace(/\D/g, '');
      if (val) {
        e.target.value = val.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      }
    });
  }
}

/* ── AUTH & BADGES ────────────────────────────────────── */
function initAuth() {
  try {
    var s = localStorage.getItem('fp_user');
    if (s) curUser = JSON.parse(s);
  } catch(e){}
  
  var th = localStorage.getItem('fp_theme') || 'light';
  applyTheme(th);
  curLang = localStorage.getItem('fp_lang') || 'ru';
  applyLangUI();
  
  if (curUser) renderAuthSlot();
  updateNavVisibility();
  updateAiraBadge();
}

function updateNavVisibility() {
  var plusWrap = document.getElementById('nav-plus-wrap');
  var nMore = document.getElementById('n-more');
  if (curUser) {
    if (plusWrap) plusWrap.style.display = 'block';
    if (nMore) nMore.style.display = 'flex';
  } else {
    if (plusWrap) plusWrap.style.display = 'none';
    if (nMore) nMore.style.display = 'none';
  }
}

function updateAiraBadge() {
  var badge = document.getElementById('aira-status-badge');
  if (!badge) return;
  if (curUser) {
    badge.style.cssText = 'background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:#27AE60;font-weight:600';
    badge.textContent = '✓ ' + curUser.name.split(' ')[0];
  } else {
    badge.style.cssText = 'background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:#F47B20;font-weight:600';
    badge.textContent = '🔒 Войдите';
  }
}

/* ── DATA FETCH ───────────────────────────────────────── */
function fetchListings() {
  fetch('/api/listings')
    .then(r => r.json())
    .then(d => { listings = d.listings || []; renderFeed(); renderListings(); })
    .catch(() => { listings = getFallbackListings(); renderFeed(); renderListings(); });
}

function getFallbackListings() {
  return [
    { id:1, type:'apartment', rooms:3, area:85, district:'Бостандыкский', city:'Алматы', price:78500000, exchange:false, hasVideo:true, videoId:'ScMzIvxBSi4', realtor:'Айгерим К.', realtorId:'r1', realtorFull:'Айгерим Касымова', rating:4.9, deals:47, agency:'Century 21', tags:['Новострой'], badge:'Новое', desc:'Просторная 3-комнатная с панорамным видом. Свежий ремонт евро-класса.', photos:['🛋️',''] },
    { id:2, type:'apartment', rooms:3, area:82, district:'Есильский', city:'Астана', price:62000000, exchange:false, hasVideo:false, videoId:'', realtor:'Данияр М.', realtorId:'r2', realtorFull:'Данияр Мусин', rating:4.7, deals:32, agency:'Etagi', tags:['Горящее'], badge:'Горящее', desc:'Отличная 3-комнатная в новом ЖК.', photos:['🛋️',''] }
  ];
}

/* ── UPLOAD MEDIA (ГЛОБАЛЬНАЯ) ────────────────────────── */
window.uploadMedia = function(type) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = type === 'photo' ? 'image/*' : 'video/*';
  input.multiple = type === 'photo';
  input.onchange = function() {
    if (!input.files.length) return;
    toast(type === 'photo' ? '📷 ' + input.files.length + ' фото добавлено' : '🎬 Видео добавлено');
  };
  input.click();
};

/* ── AIRA CHAT (WHATSAPP STYLE) ───────────────────────── */
function initAiraChat() {
  // Демо-посты если чат пуст
  if (airaPosts.length === 0) {
    airaPosts = [
      {
        id: Date.now() - 10000,
        author: 'Айгерим К.',
        avatar: 'А',
        color: '#1E2D5A',
        time: '10 мин назад',
        text: '🏠 Объект: 3к Есиль — ищу покупателя 🤝 Клиент готов к ипотеке Halyk Bank. Комиссию делим 50/50 🤝 Срочно!',
        replies: [
          { author: 'Данияр М.', text: 'Есть покупатель! Пишу в личку', time: '8 мин назад' }
        ]
      },
      {
        id: Date.now() - 5000,
        author: 'Нурлан А.',
        avatar: 'Н',
        color: '#9B59B6',
        time: '5 мин назад',
        text: '🔄 Обмен: 2к на 3к с доплатой до 20 млн. Клиент готов доплатить. Ищу вариант в Есиле.',
        replies: []
      }
    ];
  }
  renderAiraFeed();
}

function renderAiraFeed() {
  var list = document.getElementById('aira-list');
  if (!list) return;
  
  list.innerHTML = airaPosts.map(function(post) {
    var repliesHtml = post.replies.map(function(r) {
      return '<div style="background:var(--bg3);padding:8px 12px;border-radius:12px 12px 12px 4px;margin:6px 0 6px 40px;font-size:13px;line-height:1.4;border-left:3px solid #27AE60">' +
        '<div style="font-weight:600;color:#27AE60;margin-bottom:2px">' + esc(r.author) + '</div>' +
        esc(r.text) +
        '</div>';
    }).join('');
    
    return '<div class="aira-msg" style="margin-bottom:16px;animation:suIn .25s ease">' +
      '<div style="display:flex;gap:10px;margin-bottom:6px">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:' + post.color + ';display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;flex-shrink:0">' + post.avatar + '</div>' +
        '<div>' +
          '<div style="font-weight:600">' + esc(post.author) + ' <span style="color:var(--t3);font-weight:400;font-size:12px">' + post.time + '</span></div>' +
          '<div style="font-size:14px;line-height:1.5;color:var(--t1);margin-top:2px">' + esc(post.text) + '</div>' +
        '</div>' +
      '</div>' +
      '<div id="replies-' + post.id + '">' + repliesHtml + '</div>' +
      '<div style="margin-left:46px;display:flex;gap:8px;margin-top:4px">' +
        '<button onclick="toggleReplyForm(' + post.id + ')" style="background:none;border:1px solid var(--brd2);padding:4px 10px;border-radius:6px;font-size:12px;cursor:pointer;color:var(--t2)">💬 Ответить</button>' +
      '</div>' +
      '<div id="reply-form-' + post.id + '" style="display:none;margin:8px 0 0 46px">' +
        '<div style="display:flex;gap:6px">' +
          '<input type="text" id="reply-input-' + post.id + '" placeholder="Ваш ответ..." style="flex:1;padding:8px 12px;border-radius:20px;border:1px solid var(--brd2);font-size:13px;outline:none">' +
          '<button onclick="submitReply(' + post.id + ')" style="background:var(--orange);color:#fff;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer">➤</button>' +
        '</div>' +
      '</div>' +
      '<hr style="border:none;border-top:1px solid var(--brd);margin:16px 0">' +
    '</div>';
  }).join('');
}

window.toggleReplyForm = function(postId) {
  var form = document.getElementById('reply-form-' + postId);
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
};

window.submitReply = function(postId) {
  var input = document.getElementById('reply-input-' + postId);
  if (!input || !input.value.trim()) return;
  
  var post = airaPosts.find(p => p.id === postId);
  if (post) {
    post.replies.push({
      author: curUser ? curUser.name.split(' ')[0] : 'Вы',
      text: input.value.trim(),
      time: 'только что'
    });
    input.value = '';
    renderAiraFeed();
    toast('✅ Ответ отправлен');
  }
};

window.sendAira = function() {
  var inp = document.getElementById('aira-inp');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) return;
  if (!curUser) { toast('🔐 Войдите, чтобы писать в Aira'); openM('m-auth'); return; }
  
  airaPosts.unshift({
    id: Date.now(),
    author: curUser.name.split(' ')[0],
    avatar: curUser.name.charAt(0),
    color: '#F47B20',
    time: 'только что',
    text: txt,
    replies: []
  });
  
  inp.value = '';
  renderAiraFeed();
  toast('✅ Опубликовано в Aira');
};

/* ── UI HELPERS ───────────────────────────────────────── */
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
  var em = {apartment:'🏢', house:'🏡', commercial:'🏪', land:'🌳'}[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) + ' ₸' : 'по договору';
  return (
    '<div class="fcard" style="background:linear-gradient(135deg,#1a1a40,#0d1b3e);height:100%;scroll-snap-align:start">' +
    '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:120px;opacity:.15">'+em+'</div>' +
    '<div class="fc-overlay"></div>' +
    '<div class="fc-info" style="position:absolute;bottom:0;left:0;right:0;padding:16px;background:linear-gradient(to top,rgba(0,0,0,.8),transparent)">' +
      '<div style="font-size:20px;font-weight:800;color:#fff;margin-bottom:4px">'+pr+'</div>' +
      '<div style="font-size:14px;color:rgba(255,255,255,.8)">'+esc(l.district)+', '+l.area+' м²</div>' +
      '<div style="margin-top:8px;display:flex;gap:8px">' +
        '<button onclick="openDetail('+l.id+')" style="background:var(--orange);color:#fff;border:none;padding:8px 14px;border-radius:8px;font-weight:600;cursor:pointer">Подробнее</button>' +
        '<button onclick="goToRealtorChat('+l.id+')" style="background:rgba(255,255,255,.2);color:#fff;border:none;padding:8px 14px;border-radius:8px;font-weight:600;cursor:pointer">Написать</button>' +
      '</div>' +
    '</div></div>'
  );
}

function renderListings() {
  var el = document.getElementById('list-body');
  if (!el) return;
  var res = listings.slice();
  if (listTab === 'exch') res = res.filter(function(l){ return l.exchange; });
  if (curFilter !== 'all') res = res.filter(function(l){ return l.type === curFilter; });
  
  if (!res.length) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">🔍</div><div class="empty-t">Ничего не найдено</div></div>';
    return;
  }
  el.innerHTML = res.map(buildListCard).join('');
}

function buildListCard(l) {
  var em = {apartment:'🏢', house:'🏡', commercial:'🏪', land:'🌳'}[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) : '—';
  var rm = l.rooms ? l.rooms+'-комнатная, ' : '';
  var ini = (l.realtor || 'R').charAt(0);
  var badgeColor = {Горящее:'#E74C3C',Топ:'#27AE60',Обмен:'#9B59B6'}[l.badge] || '#F47B20';
  
  return (
    '<div class="lcard su" onclick="openDetail('+l.id+')">' +
    '<div class="lcard-media"><div class="lcard-em">'+em+'</div><div class="lcard-badge" style="background:'+badgeColor+'">'+(l.badge||'')+'</div></div>' +
    '<div class="lcard-body">' +
      '<div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>'+esc(l.city)+', '+esc(l.district)+'</div>' +
      '<div class="lcard-price">'+pr+' ₸</div>' +
      '<div class="lcard-sub">'+rm+l.area+' м²'+(l.exchange?' · 🔄 Обмен':'')+'</div>' +
      '<div class="lcard-footer">' +
        '<div class="lf-ava" style="background:#1E2D5A">'+ini+'</div>' +
        '<div class="lf-name">'+esc(l.realtorFull||l.realtor||'')+' · '+esc(l.agency||'')+'</div>' +
      '</div>' +
      '<div class="lcard-cta">' +
        '<button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\''+esc(l.phone||'+7 701 000 00 00')+'\')"><i class="fas fa-phone"></i> '+t('call')+'</button>' +
        '<button class="cta-btn cta-msg" onclick="event.stopPropagation();goToRealtorChat('+l.id+')"><i class="fas fa-comment"></i> '+t('msg')+'</button>' +
      '</div>' +
    '</div></div>'
  );
}

function openDetail(id) {
  var l = listings.find(function(x){ return x.id === id; });
  if (!l) return;
  var pr = l.price ? fmtPrice(l.price) : 'По договору';
  var body = document.getElementById('m-det-body');
  if(!body) return;
  body.innerHTML = '<div class="sh-handle"></div><div class="det-visual"><div class="det-em-bg">'+{apartment:'🏢', house:'🏡', commercial:'🏪', land:'🌳'}[l.type]+'</div></div>' +
    '<div class="det-price">'+pr+' ₸</div>' +
    '<div class="det-desc">'+(l.desc||'').replace(/\n/g,'<br>')+'</div>' +
    '<div class="det-cta">' +
      '<button class="det-btn det-call" onclick="callRealtor(\''+(l.phone||'+7 701 000 00 00')+'\')"><i class="fas fa-phone"></i> Позвонить</button>' +
      '<button class="det-btn det-chat" onclick="closeM(\'m-det\');goToRealtorChat('+l.id+')"><i class="fas fa-comment"></i> Написать</button>' +
    '</div>';
  openM('m-det');
}

function callRealtor(phone) {
  toast('📞 ' + phone);
  window.location.href = 'tel:' + phone.replace(/\s/g,'');
}

function goToRealtorChat(listingId) {
  var l = listings.find(function(x){ return x.id === listingId; });
  if (!l) return;
  closeM('m-det');
  go('s-aira');
  setTimeout(function(){
    var inp = document.getElementById('aira-inp');
    if (inp) {
      inp.value = 'Здравствуйте! Интересует объект: ' + (l.rooms?l.rooms+'к, ':'') + esc(l.district) + ', ' + fmtPrice(l.price) + ' ₸';
      inp.focus();
    }
  }, 200);
}

/* ── AUTH FUNCTIONS ───────────────────────────────────── */
function doLogin() {
  var email = val('l-email');
  if (!email) { toast('⚠️ Введите email'); return; }
  // Имитация входа
  curUser = { id:'u1', name:'Айгерим Касымова', email:email, agency:'Century 21', rating:4.9, deals:47 };
  localStorage.setItem('fp_user', JSON.stringify(curUser));
  renderAuthSlot(); closeM('m-auth'); renderProf(); updateAiraBadge(); updateNavVisibility();
  toast('👋 Добро пожаловать, ' + curUser.name.split(' ')[0] + '!');
}

function doReg() {
  var name = val('r-name'), email = val('r-email');
  if (!name || !email) { toast('⚠️ Заполните все поля'); return; }
  curUser = { id:'u_'+Date.now(), name:name, email:email, agency:'Самозанятый', rating:5.0, deals:0 };
  localStorage.setItem('fp_user', JSON.stringify(curUser));
  renderAuthSlot(); closeM('m-auth'); renderProf(); updateAiraBadge(); updateNavVisibility();
  toast('🎉 Регистрация успешна!');
}

function doLogout() {
  curUser = null; localStorage.removeItem('fp_user');
  renderAuthSlot(); renderProf(); updateAiraBadge(); updateNavVisibility();
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

function renderProf() {
  var el = document.getElementById('prof-body');
  if (!el) return;
  if (!curUser) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">👤</div><div class="empty-t">Войдите</div></div>';
    return;
  }
  var ini = (curUser.name||'R').charAt(0).toUpperCase();
  el.innerHTML = '<div class="prof-hero">' +
    '<div class="ph-ava">'+ini+'</div>' +
    '<div class="ph-name">'+esc(curUser.name)+'</div>' +
    '<div class="ph-tag">🏠 Риэлтор</div>' +
  '</div>' +
  '<div class="menu-sec"><div class="menu-lbl">Аккаунт</div>' +
    '<div class="menu-item" onclick="doLogout()"><div class="menu-ico" style="background:rgba(231,76,60,.08)">🚪</div><div><div class="menu-name" style="color:#E74C3C">Выйти</div></div></div>' +
  '</div>';
}

/* ── UTILS & GLOBALS ──────────────────────────────────── */
function go(id) {
  document.querySelectorAll('.scr').forEach(function(s){ s.classList.remove('on'); });
  var s = document.getElementById(id); if (s) s.classList.add('on');
}
function nav(el) {
  document.querySelectorAll('.nav-it').forEach(function(n){ n.classList.remove('on'); });
  if (el) el.classList.add('on');
}
function showMore() { openM('m-more'); }
function openM(id) { var e = document.getElementById(id); if(e) e.classList.add('on'); }
function closeM(id) { var e = document.getElementById(id); if(e) e.classList.remove('on'); }
function closeOvl(e, id) { if(e.target.id===id) closeM(id); }

function toggleTheme() {
  var cur = document.documentElement.getAttribute('data-theme');
  var next = cur === 'dark' ? 'light' : 'dark';
  applyTheme(next); localStorage.setItem('fp_theme', next);
}
function applyTheme(th) {
  document.documentElement.setAttribute('data-theme', th);
  var btn = document.getElementById('btn-theme');
  if (btn) btn.innerHTML = th ==='dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}
function setLang(lang) {
  curLang = lang; localStorage.setItem('fp_lang', lang); applyLangUI();
  toast(lang==='kz' ? '🇰🇿 Қазақ тілі' : '🇷🇺 Русский');
}
function applyLangUI() {
  var ru = document.getElementById('lo-ru'), kz = document.getElementById('lo-kz');
  if (ru) ru.classList.toggle('on', curLang ==='ru');
  if (kz) kz.classList.toggle('on', curLang ==='kz');
  document.querySelectorAll('[data-ru]').forEach(function(el) {
    var val = el.getAttribute('data-'+curLang);
    if (val) el.textContent = val;
  });
}
function toast(msg, ms) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function(){ el.classList.remove('show'); }, ms ||2400);
}
function val(id) { var e=document.getElementById(id); return e ? e.value.trim() : ''; }
function esc(s) { return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtPrice(p) { return p ? p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '0'; }
function authTab(t) {
  document.getElementById('at-in').classList.toggle('on', t==='in');
  document.getElementById('at-up').classList.toggle('on', t==='up');
  document.getElementById('af-in').style.display = t==='in' ? 'block' : 'none';
  document.getElementById('af-up').style.display = t==='up' ? 'block' : 'none';
}
function submitListing() {
  var price = val('a-price').replace(/\s/g, '');
  if (!price || isNaN(parseInt(price))) { toast('⚠️ Укажите цену'); return; }
  var newL = {
    id: Date.now(), type: val('a-type')||'apartment', rooms: parseInt(val('a-rooms'))||3, area: parseInt(val('a-area'))||85,
    district: val('a-district')||'Есиль', city: val('a-city')||'Астана', price: parseInt(price),
    exchange: false, hasVideo: false, videoId: '', realtor: curUser?curUser.name:'Я',
    realtorFull: curUser?curUser.name:'Я', realtorId: curUser?curUser.id:'u_new',
    rating: 5.0, deals: 0, agency: curUser?curUser.agency:'Самозанятый',
    tags: ['Новое'], badge: 'Новое', desc: val('a-desc')||'Новый объект', photos:['🛋️']
  };
  listings.unshift(newL); renderListings(); renderFeed(); closeM('m-add');
  toast('🚀 Объект опубликован!');
}
function genAI() { toast('🤖 Генерация...'); setTimeout(()=>{ var w=document.getElementById('ai-box-wrap'); if(w)w.style.display='block'; }, 800); }
function useAI() { var txt=document.getElementById('ai-txt')?.textContent||''; var d=document.getElementById('a-desc'); if(d)d.value=txt; var w=document.getElementById('ai-box-wrap'); if(w)w.style.display='none'; }
function t(key) { return key; } // Заглушка для переводов, чтобы не ломать код
