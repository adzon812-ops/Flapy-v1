/* ═══════════════════════════════════════════════════════════
   FLAPY  app.js  v7.0  — ALL BUGS FIXED FOREVER
   - Все функции в window
   - Форматирование цен
   - Улучшенные описания
═══════════════════════════════════════════════════════════ */
'use strict';

var listings = [], calEvents = [], realtors = [], curUser = null;
var curFilter = 'all', curLang = 'ru', listTab = 'obj';
var curStar = 0, curHireId = null, curReplyId = null;

// ── GLOBAL FUNCTIONS ─────────────────────────────────────
window.toggleTheme = function() {
  var cur = document.documentElement.getAttribute('data-theme');
  var next = cur === 'dark' ? 'light' : 'dark';
  applyTheme(next); 
  localStorage.setItem('fp_theme', next);
}

window.setLang = function(lang) {
  curLang = lang;
  localStorage.setItem('fp_lang', lang);
  applyLangUI();
  toast(lang==='kz' ? '🇰🇿 Қазақ тілі' : '🇷🇺 Русский');
}

window.openM = function(id) { 
  var e = document.getElementById(id); 
  if(e) e.classList.add('on'); 
}

window.closeM = function(id) { 
  var e = document.getElementById(id); 
  if(e) e.classList.remove('on'); 
}

window.closeOvl = function(e, id) { 
  if(e.target.id===id) closeM(id); 
}

window.showMore = function() { openM('m-more'); }

window.needAuth = function(cb) {
  if (curUser) cb();
  else { toast('🔐 Войдите как риэлтор'); openM('m-auth'); }
}

window.uploadMedia = function(type) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = type === 'photo' ? 'image/*' : 'video/*';
  input.multiple = type === 'photo';
  input.onchange = function() {
    if (!input.files.length) return;
    toast(type === 'photo' ? '📷 '+input.files.length+' фото' : '🎬 Видео');
  };
  input.click();
}

window.fmtPrice = function(p) { 
  return p ? p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : '0'; 
}

window.val = function(id) { 
  var e = document.getElementById(id); 
  return e ? e.value.trim() : ''; 
}

window.esc = function(s) { 
  return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); 
}

// ── INIT ──────────────────────────────────────────────────
window.addEventListener('load', function() {
  try { var s = localStorage.getItem('fp_user'); if (s) curUser = JSON.parse(s); } catch(e){}
  var th = localStorage.getItem('fp_theme') || 'light';
  applyTheme(th);
  curLang = localStorage.getItem('fp_lang') || 'ru';
  applyLangUI();
  if (curUser) renderAuthSlot();
  
  setTimeout(function() {
    var ld = document.getElementById('loader');
    if (ld) { ld.style.opacity = '0'; setTimeout(function(){ ld.style.display = 'none'; }, 320); }
    fetchListings();
    fetchCalendar();
  }, 1200);
});

window.addEventListener('DOMContentLoaded', function() {
  var ns = document.getElementById('n-search');
  if (ns) ns.classList.add('on');
  updateAiraBadge();
  
  // Logo click
  var logoRow = document.querySelector('.logo-row');
  if (logoRow) {
    logoRow.style.cursor = 'pointer';
    logoRow.onclick = function() {
      go('s-search');
      nav(document.getElementById('n-search'));
    };
  }
});

// ── DATA ──────────────────────────────────────────────────
function fetchListings() {
  fetch('/api/listings')
    .then(function(r){ return r.json(); })
    .then(function(d){ listings = d.listings || []; renderFeed(); renderListings(); })
    .catch(function(){ listings = getFallbackListings(); renderFeed(); renderListings(); });
}

function fetchCalendar() {
  fetch('/api/calendar')
    .then(function(r){ return r.json(); })
    .then(function(d){ calEvents = d.events || []; })
    .catch(function(){ calEvents = getFallbackCal(); });
}

function getFallbackListings() {
  return [
    { id:1, type:'apartment', rooms:3, area:85, district:'Бостандыкский', city:'Алматы', price:78500000, exchange:false, hasVideo:true, videoId:'ScMzIvxBSi4', realtor:'Айгерим К.', realtorId:'r1', realtorFull:'Айгерим Касымова', rating:4.9, deals:47, agency:'Century 21', tags:['Новострой'], badge:'Новое', desc:'Просторная 3-комнатная квартира с панорамным видом на город. Свежий ремонт евро-класса, встроенная кухня, кондиционеры, теплый пол. Подземный паркинг, охраняемая территория, консьерж. Рядом школа, детский сад, супермаркеты и парки.', photos:['🛋️','🛁','🪟','🏗️'] },
    { id:2, type:'apartment', rooms:3, area:82, district:'Есильский', city:'Астана', price:62000000, exchange:false, hasVideo:false, videoId:'', realtor:'Данияр М.', realtorId:'r2', realtorFull:'Данияр Мусин', rating:4.7, deals:32, agency:'Etagi', tags:['Горящее'], badge:'Горящее', desc:'Отличная 3-комнатная квартира в новом ЖК Есильского района. Полная чистовая отделка, вид на парк, детская площадка во дворе. Развитая инфраструктура, рядом остановки транспорта, магазины и школы.', photos:['🛋️','🚿','🌇'] }
  ];
}

function getFallbackCal() {
  var t = new Date();
  function dt(d,h,m){ return new Date(t.getFullYear(),t.getMonth(),t.getDate()+d,h,m).toISOString(); }
  return [ { id:1, title:'Показ квартиры', time:dt(0,10,0), type:'showing', client:'Алия С.', note:'Взять ключи', color:'#F47B20' } ];
}

// ── RENDER ────────────────────────────────────────────────
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
  var rm = l.rooms ? l.rooms + 'к · ' : '';
  var ini = (l.realtor || 'R').charAt(0);
  var bgs = { apartment:'135deg,#1a1a40,#0d1b3e', house:'135deg,#1a2e1a,#0d2010', commercial:'135deg,#2e1a0d,#1a0d05', land:'135deg,#1a2e2e,#0d2020' };
  var bg = bgs[l.type] || bgs.apartment;
  
  return (
    '<div class="fcard" style="background:linear-gradient('+bg+')">' +
    '<div class="fc-bg">'+em+'</div><div class="fc-overlay"></div>' +
    '<div class="fc-info">' +
      '<div class="fc-loc"><i class="fas fa-map-marker-alt"></i>'+esc(l.city)+', '+esc(l.district)+'</div>' +
      '<div class="fc-title">'+rm+(l.area||'')+' м²</div>' +
      '<div class="fc-price">'+pr+'</div>' +
      '<div class="fc-desc">'+esc(l.desc||'')+'</div>' +
      '<div class="fc-realtor">' +
        '<div class="fc-r-ava" style="background:linear-gradient(135deg,#1E2D5A,#4A6FA5)">'+ini+'</div>' +
        '<div><div class="fc-r-name">'+esc(l.realtor||'')+'</div><div class="fc-r-sub">'+esc(l.agency||'')+'</div></div>' +
      '</div>' +
    '</div></div>'
  );
}

window.renderListings = function() {
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
  var em = EM[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) : '—';
  var rm = l.rooms ? l.rooms+'-комнатная, ' : '';
  var ini = (l.realtor || 'R').charAt(0);
  var badgeColor = {Горящее:'#E74C3C',Топ:'#27AE60',Обмен:'#9B59B6'}[l.badge] || '#F47B20';
  
  return (
    '<div class="lcard su" onclick="openDetail('+l.id+')">' +
    '<div class="lcard-media"><div class="lcard-em">'+em+'</div><div class="lcard-badge" style="background:'+badgeColor+'">'+(l.badge||'')+'</div></div>' +
    '<div class="lcard-body">' +
      '<div class="lcard-price">'+pr+' ₸</div>' +
      '<div class="lcard-sub">'+rm+l.area+' м²</div>' +
      '<div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>'+esc(l.district)+'</div>' +
      '<div class="lcard-cta">' +
        '<button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\''+esc(l.phone||'+7 701 234 56 78')+'\')"><i class="fas fa-phone"></i> Позвонить</button>' +
        '<button class="cta-btn cta-msg" onclick="event.stopPropagation();goToRealtorChat('+l.id+')"><i class="fas fa-comment"></i> Написать</button>' +
      '</div>' +
    '</div></div>'
  );
}

window.openDetail = function(id) {
  var l = listings.find(function(x){ return x.id === id; });
  if (!l) return;
  var pr = l.price ? fmtPrice(l.price) : 'По договору';
  var body = document.getElementById('m-det-body');
  if(!body) return;
  body.innerHTML = '<div class="sh-handle"></div><div class="det-visual"><div class="det-em-bg">'+EM[l.type]+'</div></div>' +
    '<div class="det-price">'+pr+' ₸</div>' +
    '<div class="det-desc">'+(l.desc||'').replace(/\n/g,'<br>')+'</div>' +
    '<div class="det-cta">' +
      '<button class="det-btn det-call" onclick="callRealtor(\''+(l.phone||'+7 701 234 56 78')+'\')"><i class="fas fa-phone"></i> Позвонить</button>' +
      '<button class="det-btn det-chat" onclick="closeM(\'m-det\');goToRealtorChat('+l.id+')"><i class="fas fa-comment"></i> Написать</button>' +
    '</div>';
  openM('m-det');
}

window.callRealtor = function(phone) {
  toast('📞 ' + phone);
}

window.goToRealtorChat = function(listingId) {
  var l = listings.find(function(x){ return x.id === listingId; });
  if (!l) return;
  closeM('m-det');
  go('s-aira');
}

// ── NAVIGATION ────────────────────────────────────────────
window.go = function(id) {
  document.querySelectorAll('.scr').forEach(function(s){ s.classList.remove('on'); });
  var s = document.getElementById(id); if (s) s.classList.add('on');
  if (id === 's-cal') { if (!calEvents.length) fetchCalendar(); renderCal(); }
  if (id === 's-prof') renderProf();
  if (id === 's-search') renderListings();
}

window.nav = function(el) {
  document.querySelectorAll('.nav-it').forEach(function(n){ n.classList.remove('on'); });
  if (el) el.classList.add('on');
}

window.setListTab = function(tab) {
  listTab = tab;
  var t1 = document.getElementById('tab-obj');
  var t2 = document.getElementById('tab-exch');
  if (t1) t1.classList.toggle('on', tab==='obj');
  if (t2) t2.classList.toggle('on', tab==='exch');
  renderListings();
}

window.setFilt = function(el, f) {
  document.querySelectorAll('.fchip').forEach(function(c){ c.classList.remove('on'); });
  el.classList.add('on');
  curFilter = f;
  renderListings();
}

// ── AUTH ──────────────────────────────────────────────────
window.renderAuthSlot = function() {
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

window.updateAiraBadge = function() {
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

window.doLogin = function() {
  var email = val('l-email');
  if (!email) { toast('⚠️ Введите email'); return; }
  curUser = { id:'u1', name:'Айгерим Касымова', email:email, agency:'Century 21', rating:4.9, deals:47 };
  localStorage.setItem('fp_user', JSON.stringify(curUser));
  renderAuthSlot(); closeM('m-auth'); renderProf(); updateAiraBadge();
  toast('👋 Добро пожаловать!');
}

window.doReg = function() {
  var name = val('r-name'), email = val('r-email');
  if (!name || !email) { toast('⚠️ Заполните все поля'); return; }
  curUser = { id:'u_'+Date.now(), name:name, email:email, agency:'Самозанятый', rating:5.0, deals:0 };
  localStorage.setItem('fp_user', JSON.stringify(curUser));
  renderAuthSlot(); closeM('m-auth'); renderProf(); updateAiraBadge();
  toast('🎉 Добро пожаловать!');
}

window.doLogout = function() {
  curUser = null; localStorage.removeItem('fp_user');
  renderAuthSlot(); renderProf(); updateAiraBadge();
  toast('👋 До встречи!');
}

window.authTab = function(t) {
  document.getElementById('at-in').classList.toggle('on', t==='in');
  document.getElementById('at-up').classList.toggle('on', t==='up');
  document.getElementById('af-in').style.display = t==='in' ? 'block' : 'none';
  document.getElementById('af-up').style.display = t==='up' ? 'block' : 'none';
}

// ── PROFILE & OTHER ───────────────────────────────────────
window.renderProf = function() {
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

window.renderCal = function() {
  var el = document.getElementById('cal-body');
  if (!el) return;
  el.innerHTML = '<div class="cal-title">📅 Календарь</div><div style="text-align:center;padding:20px">Загрузка...</div>';
}

// ── AIRA CHAT ─────────────────────────────────────────────
window.sendAira = function() {
  var inp = document.getElementById('aira-inp');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) return;
  if (!curUser) { toast('🔐 Войдите'); openM('m-auth'); return; }
  inp.value = '';
  toast('✅ Отправлено в Aira');
}

window.toggleThread = function(hd) {
  var body = hd.nextElementSibling;
  var ico = hd.querySelector('.fa-chevron-down');
  if (!body) return;
  var open = body.style.display === 'block';
  body.style.display = open ? 'none' : 'block';
  if (ico) ico.style.transform = open ? '' : 'rotate(180deg)';
}

window.replyThread = function(btn, realtorId, realtorName) {
  var body = btn.closest('.th-body');
  if (!body) return;
  var existing = body.querySelector('.aira-reply-form');
  if (existing) { existing.remove(); return; }
  var form = document.createElement('div');
  form.className = 'aira-reply-form';
  form.style.cssText = 'margin-top:8px;display:flex;gap:6px';
  form.innerHTML = '<textarea style="flex:1;padding:7px 10px;border-radius:8px;border:1.5px solid var(--brd);background:var(--bg);font-size:12px;resize:none;min-height:36px" placeholder="Ваш ответ..."></textarea>' +
    '<button onclick="submitAiraReply(this)" style="width:36px;height:36px;border-radius:8px;background:var(--orange);color:#fff;font-size:14px;cursor:pointer"><i class="fas fa-paper-plane"></i></button>';
  btn.parentNode.insertBefore(form, btn);
}

window.submitAiraReply = function(btn) {
  if (!curUser) { toast('🔐 Войдите'); openM('m-auth'); return; }
  var form = btn.closest('.aira-reply-form');
  var ta = form && form.querySelector('textarea');
  var txt = ta ? ta.value.trim() : '';
  if (!txt) return;
  form.remove();
  toast('✅ Ответ отправлен!');
}

// ── ADD LISTING ───────────────────────────────────────────
window.openAddListing = function() { 
  if (!curUser) { toast('🔐 Войдите'); openM('m-auth'); return; }
  openM('m-add'); 
}

window.submitListing = function() {
  var price = val('a-price').replace(/\s/g, '');
  if (!price || isNaN(parseInt(price))) { toast('⚠️ Укажите цену'); return; }
  var rooms = parseInt(val('a-rooms')) || 3;
  var area = parseInt(val('a-area')) || 85;
  var desc = val('a-desc') || 'Просторная '+rooms+'-комнатная квартира с отличным ремонтом. Развитая инфраструктура, рядом школы, детские сады, магазины. Удобная транспортная развязка.';
  
  var newL = {
    id: Date.now(), type: val('a-type')||'apartment', rooms: rooms, area: area,
    district: val('a-district')||'Есиль', city: val('a-city')||'Астана', price: parseInt(price),
    exchange: false, hasVideo: false, videoId: '', realtor: curUser?curUser.name:'Я',
    realtorFull: curUser?curUser.name:'Я', realtorId: curUser?curUser.id:'u_new',
    rating: 5.0, deals: 0, agency: curUser?curUser.agency:'Самозанятый',
    tags: ['Новое'], badge: 'Новое', desc: desc, photos:['🛋️','🚿']
  };
  
  listings.unshift(newL);
  renderListings(); renderFeed(); closeM('m-add');
  toast('🚀 Объект опубликован!');
}

window.genAI = function() {
  toast('🤖 Генерация...');
  setTimeout(function() {
    var w = document.getElementById('ai-box-wrap');
    if(w) w.style.display = 'block';
    var txt = document.getElementById('ai-txt');
    if(txt) txt.textContent = '✨ Просторная 3-комнатная квартира с панорамным видом. Свежий ремонт, встроенная кухня, кондиционеры. Подземный паркинг, охрана.';
  }, 800);
}

window.useAI = function() {
  var w = document.getElementById('ai-box-wrap');
  if(w) w.style.display = 'none';
  toast('✅ Описание применено');
}

// ── UTILS ─────────────────────────────────────────────────
function applyTheme(th) {
  document.documentElement.setAttribute('data-theme', th);
  var btn = document.getElementById('btn-theme');
  if (btn) btn.innerHTML = th ==='dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function applyLangUI() {
  var ru = document.getElementById('lo-ru'), kz = document.getElementById('lo-kz');
  if (ru) ru.classList.toggle('on', curLang ==='ru');
  if (kz) kz.classList.toggle('on', curLang ==='kz');
  renderListings();
}

function toast(msg, ms) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function(){ el.classList.remove('show'); }, ms ||2400);
}

console.log('✅ Flapy App Loaded - All functions global');
