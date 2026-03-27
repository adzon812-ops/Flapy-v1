/* ══════════════════════════════════════════
   FLAPY  app.js  v3.0
   Kaspi-style Light UI + WhatsApp Chats
══════════════════════════════════════════ */
'use strict';

var listings  = [];
var calEvents = [];
var curUser   = null;
var curRole   = 'buyer';
var curFilter = 'all';
var curLang   = 'ru';
var listTab   = 'obj';

/* ══ BOOT ══════════════════════════════════ */
window.addEventListener('load', function () {
  /* restore session */
  try { var s = localStorage.getItem('fp_user'); if (s) curUser = JSON.parse(s); } catch(e){}
  if (curUser) renderAuthSlot();

  /* theme */
  var th = localStorage.getItem('fp_theme') || 'light';
  applyTheme(th);

  /* lang */
  curLang = localStorage.getItem('fp_lang') || 'ru';
  updateLangUI();

  /* hide loader & load data */
  setTimeout(function () {
    var ld = document.getElementById('loader');
    if (ld) { ld.style.opacity = '0'; setTimeout(function(){ ld.style.display = 'none'; }, 320); }
    fetchListings();
    fetchCalendar();
  }, 1300);
});

/* default screen on DOM ready */
window.addEventListener('DOMContentLoaded', function () {
  var ns = document.getElementById('n-search');
  if (ns) ns.classList.add('on');
  updateAiraBadge();
});

/* ══ DATA ════════════════════════════════ */
function fetchListings() {
  fetch('/api/listings')
    .then(function(r){ return r.json(); })
    .then(function(d){ listings = d.listings || []; renderFeed(); renderListings(); })
    .catch(function(){ listings = fallbackData(); renderFeed(); renderListings(); });
}

function fallbackData() {
  return [
    { id:1, type:'apartment', rooms:3, area:85,  district:'Бостандыкский', city:'Алматы', price:78500000,  exchange:false, hasVideo:true,  realtor:'Айгерим К.', realtorFull:'Айгерим Касымова', rating:4.9, deals:47, agency:'Century 21', tags:['Новострой'], badge:'Новое',   desc:'Просторная 3-комнатная с панорамным видом. Свежий ремонт, подземный паркинг.' },
    { id:2, type:'apartment', rooms:3, area:82,  district:'Есильский',     city:'Астана', price:62000000,  exchange:false, hasVideo:true,  realtor:'Данияр М.',   realtorFull:'Данияр Мусин',      rating:4.7, deals:32, agency:'Etagi',      tags:['Горящее'],  badge:'Горящее', desc:'Отличная 3-комнатная в новом ЖК. Полная отделка, вид на парк.' },
    { id:3, type:'house',     rooms:5, area:220, district:'Алматинский',   city:'Астана', price:150000000, exchange:true,  hasVideo:true,  realtor:'Сауле Т.',    realtorFull:'Сауле Тлеубекова',  rating:5.0, deals:68, agency:'Royal Group',tags:['Обмен'],    badge:'Обмен',   desc:'Дом с участком 10 соток. Гараж на 2 машины, баня. Рассмотрим обмен!' },
    { id:4, type:'commercial',rooms:0, area:120, district:'Байконыр',      city:'Астана', price:65000000,  exchange:false, hasVideo:false, realtor:'Нурлан А.',   realtorFull:'Нурлан Ахметов',    rating:4.6, deals:23, agency:'Самозанятый',tags:['Инвест'],   badge:'Топ',     desc:'Помещение первой линии, высокий трафик. Идеально для ресторана.' },
    { id:5, type:'apartment', rooms:2, area:65,  district:'Сарыарка',      city:'Астана', price:38000000,  exchange:true,  hasVideo:false, realtor:'Айгерим К.',  realtorFull:'Айгерим Касымова',  rating:4.9, deals:47, agency:'Century 21', tags:['Обмен'],    badge:'Обмен',   desc:'Уютная 2-комнатная в тихом дворе. Рядом школа и детский сад.' },
    { id:6, type:'apartment', rooms:1, area:42,  district:'Есиль',         city:'Астана', price:29000000,  exchange:false, hasVideo:true,  realtor:'Данияр М.',   realtorFull:'Данияр Мусин',      rating:4.7, deals:32, agency:'Etagi',      tags:['Студия'],   badge:'Новое',   desc:'Стильная студия со смарт-дизайном. Встроенная кухня, вид на город.' },
  ];
}

/* ══ FEED ════════════════════════════════ */
var EM = { apartment:'🏢', house:'🏡', commercial:'🏪', land:'🌳' };

function renderFeed() {
  var el = document.getElementById('s-feed');
  if (!el) return;
  if (!listings.length) { el.innerHTML = '<div class="empty" style="color:#fff;padding-top:40%"><div class="empty-ico">🏠</div><div class="empty-t">Загрузка...</div></div>'; return; }
  el.innerHTML = listings.map(buildFeedCard).join('');
}

function buildFeedCard(l) {
  var em   = EM[l.type] || '🏠';
  var pr   = l.price ? fmtPrice(l.price) + ' ₸' : 'по договору';
  var rm   = l.rooms ? l.rooms + 'к · ' : '';
  var ini  = (l.realtor || 'R').charAt(0);
  /* gradient backgrounds by type */
  var bgs  = { apartment:'135deg,#1a1a40,#0d1b3e', house:'135deg,#1a2e1a,#0d2010', commercial:'135deg,#2e1a0d,#1a0d05', land:'135deg,#1a2e2e,#0d2020' };
  var bg   = bgs[l.type] || bgs.apartment;

  var tags = (l.tags || []).map(function(t) {
    var cls = t === 'Обмен' ? ' exch' : '';
    return '<span class="fc-chip'+cls+'">'+t+'</span>';
  }).join('');

  var vbadge = l.hasVideo ? '<div class="fc-vbadge"><i class="fas fa-play-circle"></i> Видео</div>' : '';
  var exbadge = l.exchange ? '<div class="fc-exbadge">🔄 Обмен</div>' : '';
  var liked = l.liked || false;

  return (
    '<div class="fcard" style="background:linear-gradient('+bg+')">' +
      '<div class="fc-bg">'+em+'</div>' +
      '<div class="fc-overlay"></div>' +
      vbadge + exbadge +
      '<div class="fc-side">' +
        '<div class="sab"><button class="sab-btn'+(liked?' liked':'')+'" id="hrt-'+l.id+'" onclick="toggleLike('+l.id+',this)"><i class="'+(liked?'fas':'far')+' fa-heart"></i></button><span class="sab-lbl">'+(liked?1:0)+'</span></div>' +
        '<div class="sab"><button class="sab-btn" onclick="openDetail('+l.id+')"><i class="fas fa-expand-alt"></i></button><span class="sab-lbl">Детали</span></div>' +
        '<div class="sab"><button class="sab-btn" onclick="goChat('+l.id+')"><i class="fas fa-comment"></i></button><span class="sab-lbl">Чат</span></div>' +
        '<div class="sab"><button class="sab-btn" onclick="toast(\'📞 '+l.realtor+'\')"><i class="fas fa-phone"></i></button><span class="sab-lbl">Звонок</span></div>' +
      '</div>' +
      '<div class="fc-info">' +
        '<div class="fc-chips">'+tags+'</div>' +
        '<div class="fc-loc"><i class="fas fa-map-marker-alt"></i>'+l.city+', '+l.district+'</div>' +
        '<div class="fc-title">'+rm+(l.area||'')+' м²</div>' +
        '<div class="fc-price">'+pr+'</div>' +
        '<div class="fc-desc">'+(l.desc||'')+'</div>' +
        '<div class="fc-realtor">' +
          '<div class="fc-r-ava">'+ini+'</div>' +
          '<div><div class="fc-r-name">'+l.realtor+'</div><div class="fc-r-sub">★ '+l.rating+' · '+l.agency+'</div></div>' +
          '<button class="fc-r-btn" onclick="openDetail('+l.id+')">Подробнее</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

/* ══ LISTINGS  (Kaspi style) ═══════════════ */
function setListTab(tab) {
  listTab = tab;
  document.getElementById('tab-obj').classList.toggle('on', tab === 'obj');
  document.getElementById('tab-exch').classList.toggle('on', tab === 'exch');
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
  if (curFilter === 'video')           res = res.filter(function(l){ return l.hasVideo; });
  else if (curFilter !== 'all') res = res.filter(function(l){ return l.type === curFilter; });

  if (!res.length) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">🔍</div><div class="empty-t">Ничего не найдено</div><div class="empty-s">Попробуйте другой фильтр</div></div>';
    return;
  }
  el.innerHTML = res.map(buildListCard).join('');
}

function buildListCard(l) {
  var em   = EM[l.type] || '🏠';
  var pr   = l.price ? fmtPrice(l.price) : '—';
  var rm   = l.rooms ? l.rooms+'-комнатная, ' : '';
  var ini  = (l.realtor||'R').charAt(0);
  var badgeColor = { Горящее:'#E74C3C', Топ:'#27AE60', Обмен:'#9B59B6' }[l.badge] || '#F47B20';

  return (
    '<div class="lcard su" onclick="openDetail('+l.id+')">' +
      '<div class="lcard-media">' +
        '<div class="lcard-em">'+em+'</div>' +
        (l.hasVideo ? '<div class="play-overlay"><i class="fas fa-play"></i></div>' : '') +
        '<div class="lcard-badge" style="background:'+badgeColor+'">'+(l.badge||'')+'</div>' +
      '</div>' +
      '<div class="lcard-body">' +
        '<div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>'+l.city+', '+l.district+'</div>' +
        '<div class="lcard-price">'+pr+' ₸</div>' +
        '<div class="lcard-sub">'+rm+l.area+' м²'+(l.exchange?' · 🔄 Обмен':'')+'</div>' +
        '<div class="lcard-footer">' +
          '<div class="lf-ava">'+ini+'</div>' +
          '<div class="lf-name">'+l.realtorFull+' · '+l.agency+'</div>' +
          '<div class="lf-rating">★ '+l.rating+'</div>' +
        '</div>' +
        '<div class="lcard-cta">' +
          '<button class="cta-btn cta-call" onclick="event.stopPropagation();toast(\'📞 Звонок: '+l.realtor+'\')"><i class="fas fa-phone"></i> Позвонить</button>' +
          '<button class="cta-btn cta-msg"  onclick="event.stopPropagation();goChat('+l.id+')"><i class="fas fa-comment"></i> Написать</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function toggleLike(id, btn) {
  var l = listings.find(function(x){ return x.id === id; });
  if (!l) return;
  l.liked = !l.liked;
  btn.innerHTML = '<i class="'+(l.liked?'fas':'far')+' fa-heart"></i>';
  if (l.liked) btn.classList.add('liked'); else btn.classList.remove('liked');
  var lbl = btn.parentNode && btn.parentNode.nextElementSibling;
  if (lbl) lbl.textContent = l.liked ? '1' : '0';
  toast(l.liked ? '❤️ Добавлено в избранное' : '💔 Убрано');
}

function openDetail(id) {
  var l = listings.find(function(x){ return x.id === id; });
  if (!l) return;
  var em  = EM[l.type] || '🏠';
  var pr  = l.price ? fmtPrice(l.price) : 'По договору';
  var rmH = l.rooms ? '<div class="det-cell"><div class="det-val">'+l.rooms+'к</div><div class="det-lbl">Комнаты</div></div>' : '';
  var arH = l.area  ? '<div class="det-cell"><div class="det-val">'+l.area+'</div><div class="det-lbl">Площадь м²</div></div>' : '';
  var exH = l.exchange ? '<div style="display:flex;align-items:center;gap:5px;font-size:12px;color:#27AE60;padding:0 17px 7px"><i class="fas fa-exchange-alt"></i>Рассмотрим обмен</div>' : '';

  document.getElementById('m-det-body').innerHTML =
    '<div class="sh-handle"></div>' +
    '<div class="det-visual">'+em+'</div>' +
    '<div class="det-price">'+pr+' ₸</div>'+exH+
    '<div class="det-grid">'+
      rmH+arH+
      '<div class="det-cell"><div class="det-val">'+l.district+'</div><div class="det-lbl">Район</div></div>'+
      '<div class="det-cell"><div class="det-val">⭐ '+l.rating+'</div><div class="det-lbl">Рейтинг</div></div>'+
    '</div>'+
    '<div class="det-desc">'+(l.desc||'').replace(/\n/g,'<br>')+'</div>'+
    '<div class="det-cta">'+
      '<button class="det-btn det-call" onclick="toast(\'📞 Звонок: '+l.realtor+'\')"><i class="fas fa-phone"></i> Позвонить</button>'+
      '<button class="det-btn det-chat" onclick="closeM(\'m-det\');go(\'s-flai\');nav(document.getElementById(\'n-flai\'))"><i class="fas fa-comment"></i> Написать</button>'+
    '</div>';
  openM('m-det');
}

function goChat(id) {
  var l = listings.find(function(x){ return x.id === id; });
  go('s-flai'); nav(document.getElementById('n-flai'));
  if (l) {
    closeM('m-det');
    setTimeout(function(){
      var inp = document.getElementById('flai-inp');
      if (inp) { inp.value = 'Интересует объект: '+l.rooms+'к, '+l.district+', '+fmtPrice(l.price)+' ₸'; inp.focus(); }
    }, 200);
  }
}

function fmtPrice(p) {
  return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/* ══ AI ══════════════════════════════════ */
function genAI() {
  var type  = val('a-type')     || 'apartment';
  var rooms = val('a-rooms')    || '3';
  var area  = val('a-area')     || '';
  var dist  = val('a-district') || 'Есиль';
  var price = val('a-price')    || '';
  var exch  = (document.getElementById('a-exch')||{}).checked || false;
  toast('🤖 Генерирую описание...');
  fetch('/api/ai/describe', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({type:type, rooms:rooms, area:area, district:dist, price:price, exchange:exch})
  }).then(function(r){ return r.json(); }).then(function(d) {
    var t = document.getElementById('ai-txt');
    var w = document.getElementById('ai-box-wrap');
    if (t) t.textContent = d.description;
    if (w) w.style.display = 'block';
  }).catch(function(){ toast('⚠️ Ошибка генерации'); });
}

function useAI() {
  var txt  = (document.getElementById('ai-txt')||{}).textContent || '';
  var desc = document.getElementById('a-desc');
  if (desc) desc.value = txt;
  var w = document.getElementById('ai-box-wrap');
  if (w) w.style.display = 'none';
  toast('✅ Описание применено');
}

function submitListing() {
  var type = val('a-type'); var area = val('a-area'); var price = val('a-price');
  if (!area || !price) { toast('⚠️ Укажите площадь и цену'); return; }
  /* add to local list */
  var rooms = parseInt(val('a-rooms')) || 0;
  var newL = {
    id: Date.now(), type: type, rooms: rooms, area: parseInt(area),
    district: val('a-district'), city: 'Астана',
    price: parseInt(price), exchange: (document.getElementById('a-exch')||{}).checked || false,
    hasVideo: false, realtor: curUser ? (curUser.name||'Я').split(' ')[0]+' Р.' : 'Мой объект',
    realtorFull: curUser ? curUser.name : 'Мой объект',
    rating: 5.0, deals: 0, agency: curUser ? (curUser.agency||'Самозанятый') : 'Самозанятый',
    tags: ['Новое'], badge: 'Новое',
    desc: val('a-desc') || 'Новый объект. Подробности по запросу.'
  };
  listings.unshift(newL);
  renderListings(); renderFeed();
  closeM('m-add');
  toast('🚀 Объект опубликован!');
  /* reset form */
  ['a-area','a-price','a-desc'].forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
  var w = document.getElementById('ai-box-wrap'); if(w) w.style.display='none';
}

/* ══ FLAI CHAT ═══════════════════════════ */
function setRole(role, btn) {
  curRole = role;
}

function quickMsg(txt) { sendFlaiMsg(txt); }

function sendFlai() {
  var inp = document.getElementById('flai-inp');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) return;
  inp.value = ''; autoResize(inp);
  sendFlaiMsg(txt);
}

function sendFlaiMsg(txt) {
  addMsg('flai-msgs', txt, true);
  var typing = addTyping('flai-msgs');
  fetch('/api/chat/flai', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({message:txt, role:curRole})
  }).then(function(r){ return r.json(); }).then(function(d) {
    typing.remove(); addMsg('flai-msgs', d.reply, false, 'F');
  }).catch(function() {
    typing.remove();
    addMsg('flai-msgs', '😊 Понял! Чем ещё могу помочь?', false, 'F');
  });
}

/* ══ AIRA CHAT ═══════════════════════════ */
function updateAiraBadge() {
  var badge = document.getElementById('aira-status-badge');
  if (!badge) return;
  if (curUser) {
    badge.style.cssText = 'background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:#27AE60;font-weight:600';
    badge.textContent = '✓ Вы вошли';
  } else {
    badge.style.cssText = 'background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:#F47B20;font-weight:600';
    badge.textContent = '🔒 Войдите';
  }
}

function openAddListing() {
  openM('m-add');
}

function sendAira() {
  var inp = document.getElementById('aira-inp');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) return;
  if (!curUser) {
    toast('🔐 Войдите, чтобы отправить сообщение');
    openM('m-auth');
    return;
  }
  inp.value = ''; autoResize(inp);
  /* add new thread */
  var name = curUser.name || 'Риэлтор';
  var list = document.querySelector('.aira-list');
  if (list) {
    var ini = name.charAt(0).toUpperCase();
    var colors = ['linear-gradient(135deg,#1E2D5A,#4A6FA5)','linear-gradient(135deg,#F47B20,#FF9A3C)','linear-gradient(135deg,#27AE60,#2ECC71)'];
    var rndC = colors[Math.floor(Math.random()*colors.length)];
    var div = document.createElement('div');
    div.className = 'thread su';
    div.innerHTML =
      '<div class="th-head" onclick="toggleThread(this)">' +
        '<div class="th-ava" style="background:'+rndC+'">'+ini+'</div>' +
        '<div style="flex:1">' +
          '<div class="th-name">'+esc(name.split(' ')[0])+' <span class="th-time">только что</span></div>' +
          '<div class="th-prev">'+esc(txt.substring(0,40))+'</div>' +
        '</div>' +
        '<i class="fas fa-chevron-down" style="color:var(--t3);font-size:11px;transition:transform .2s"></i>' +
      '</div>' +
      '<div class="th-body">' +
        '<p style="font-size:12px;color:var(--t2)">'+esc(txt)+'</p>' +
      '</div>';
    list.insertBefore(div, list.firstChild);
  }
  toast('✅ Отправлено в Aira');
}

function toggleThread(hd) {
  var body = hd.nextElementSibling;
  var ico  = hd.querySelector('.fa-chevron-down');
  if (!body) return;
  var open = body.style.display === 'block';
  body.style.display = open ? 'none' : 'block';
  if (ico) ico.style.transform = open ? '' : 'rotate(180deg)';
}

/* ══ CHAT HELPERS ════════════════════════ */
function addMsg(cid, txt, mine, ini) {
  var c = document.getElementById(cid);
  if (!c) return;
  var div = document.createElement('div');
  div.className = 'msg su ' + (mine ? 'me' : 'bot');
  var now = new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
  var fmt = esc(txt).replace(/\n/g,'<br>');
  if (mine) {
    div.innerHTML = '<div class="bwrap"><div class="bubble">'+fmt+'</div><div class="m-ts">'+now+'</div></div>';
  } else {
    div.innerHTML = '<div class="m-ava">'+(ini||'AI')+'</div><div class="bwrap"><div class="bubble">'+fmt+'</div><div class="m-ts">'+now+'</div></div>';
  }
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
  return div;
}

function addTyping(cid) {
  var c = document.getElementById(cid);
  if (!c) return {remove:function(){}};
  var div = document.createElement('div');
  div.className = 'msg bot';
  div.innerHTML = '<div class="m-ava">F</div><div class="bwrap"><div class="bubble" style="padding:8px 12px"><div class="typing"><div class="td"></div><div class="td"></div><div class="td"></div></div></div></div>';
  c.appendChild(div); c.scrollTop = c.scrollHeight;
  return div;
}

function autoResize(inp) {
  if (!inp) return;
  inp.style.height = 'auto';
  inp.style.height = Math.min(inp.scrollHeight, 88) + 'px';
}

document.addEventListener('input', function(e) {
  if (e.target && (e.target.id === 'flai-inp' || e.target.id === 'aira-inp')) {
    autoResize(e.target);
  }
});

/* ══ CALENDAR ════════════════════════════ */
function fetchCalendar() {
  fetch('/api/calendar')
    .then(function(r){ return r.json(); })
    .then(function(d){ calEvents = d.events || []; renderCal(); })
    .catch(function(){ calEvents = fallbackCal(); renderCal(); });
}

function fallbackCal() {
  var t = new Date();
  function dt(d,h,m){ return new Date(t.getFullYear(),t.getMonth(),t.getDate()+d,h,m).toISOString(); }
  return [
    {id:1,title:'Показ квартиры',     time:dt(0,10,0),  type:'showing',client:'Алия С.',       note:'Взять ключи'},
    {id:2,title:'Звонок клиенту',     time:dt(0,14,30), type:'call',   client:'Данияр М.',      note:'Обсудить условия'},
    {id:3,title:'Подписание',         time:dt(1,11,0),  type:'deal',   client:'Нурсулу К.',     note:'Проверить документы'},
    {id:4,title:'Показ коммерции',    time:dt(1,15,0),  type:'showing',client:'Бизнес-клиент',  note:'Взять план помещения'},
  ];
}

function renderCal() {
  var el = document.getElementById('cal-body');
  if (!el) return;
  var today  = new Date();
  var tom    = new Date(today); tom.setDate(tom.getDate()+1);
  var dStr   = today.toLocaleDateString('ru',{weekday:'long',day:'numeric',month:'long'});
  var colors = {showing:'#F47B20', call:'#27AE60', deal:'#1E2D5A', meeting:'#9B59B6'};
  var icons  = {showing:'🏠', call:'📞', deal:'✍️', meeting:'🤝'};

  function sameDay(a,b){ return a.getDate()===b.getDate()&&a.getMonth()===b.getMonth()&&a.getFullYear()===b.getFullYear(); }
  var todayEv = calEvents.filter(function(e){ return sameDay(new Date(e.time),today); });
  var tomEv   = calEvents.filter(function(e){ return sameDay(new Date(e.time),tom); });

  function evHtml(e) {
    var d  = new Date(e.time);
    var hm = pad(d.getHours())+':'+pad(d.getMinutes());
    var cl = colors[e.type] || '#F47B20';
    var ic = icons[e.type]  || '📅';
    return '<div class="ev-card" onclick="toast(\''+ic+' '+esc(e.title)+'\')">'+
      '<div class="ev-time"><div class="ev-hm">'+hm+'</div></div>'+
      '<div class="ev-line" style="background:'+cl+'"></div>'+
      '<div class="ev-inf">'+
        '<div class="ev-ttl">'+ic+' '+esc(e.title)+'</div>'+
        (e.client?'<div class="ev-cli">👤 '+esc(e.client)+'</div>':'')+
        (e.note  ?'<div class="ev-note">'+esc(e.note)+'</div>':'')+
      '</div></div>';
  }

  var html =
    '<div class="cal-title">📅 Расписание</div>' +
    '<div class="cal-date">'+dStr+'</div>' +
    '<div class="ai-tip"><span style="font-size:18px">🤖</span><span><b>Flai:</b> Показ сегодня в 10:00. Не забудьте ключи! ✨</span></div>' +
    '<button class="add-ev-btn" onclick="needAuth(function(){openM(\'m-ev\')})"><i class="fas fa-plus"></i> Добавить событие</button>';

  if (todayEv.length) html += '<div class="sec-label">Сегодня</div>' + todayEv.map(evHtml).join('');
  if (tomEv.length)   html += '<div class="sec-label">Завтра</div>'   + tomEv.map(evHtml).join('');
  html += '<div style="margin-top:20px"><div class="sec-label">🏆 Топ риэлторов</div>' + renderRating() + '</div>';

  el.innerHTML = html;
  var evd = document.getElementById('ev-date');
  if (evd) evd.value = today.toISOString().split('T')[0];
}

function renderRating() {
  var list = [
    {n:'Сауле Т.',   d:68, r:5.0, k:1},
    {n:'Айгерим К.', d:61, r:4.9, k:2},
    {n:'Данияр М.',  d:54, r:4.7, k:3},
    {n:'Нурлан А.',  d:43, r:4.6, k:4},
    {n:'Асель Б.',   d:38, r:4.8, k:5},
  ];
  var medals = {1:'🥇', 2:'🥈', 3:'🥉'};
  return list.map(function(r) {
    var ico = medals[r.k] || '#'+r.k;
    var bg  = r.k===1?'#F47B20':r.k===2?'#95A5A6':r.k===3?'#E67E22':'var(--bg3)';
    var w   = Math.round(r.d/68*100);
    return '<div class="rank-card"><div class="rank-num" style="background:'+bg+';color:'+(r.k<=3?'#fff':'var(--t3)')+'">'+ico+'</div><div style="flex:1"><div style="font-size:13px;font-weight:700">'+r.n+'</div><div class="rank-bar" style="width:'+w+'%"></div><div style="font-size:11px;color:var(--t3);margin-top:3px">'+r.d+' сделок · ⭐ '+r.r+'</div></div></div>';
  }).join('');
}

function saveEv() {
  var title  = val('ev-title')  || 'Событие';
  var client = val('ev-client') || '';
  var date   = val('ev-date')   || '';
  var time   = val('ev-time')   || '10:00';
  var note   = val('ev-note')   || '';
  var type   = val('ev-type')   || 'showing';
  if (!date) { toast('⚠️ Укажите дату'); return; }
  calEvents.push({id:Date.now(), title:title, time:new Date(date+'T'+time).toISOString(), type:type, client:client, note:note});
  renderCal(); closeM('m-ev'); toast('✅ Добавлено! Flai напомнит 🤖');
}

/* ══ PROFILE ═════════════════════════════ */
function renderProf() {
  var el = document.getElementById('prof-body');
  if (!el) return;
  if (!curUser) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">👤</div><div class="empty-t">Войдите в систему</div><div class="empty-s">Только для верифицированных риэлторов</div><button class="btn-primary" style="max-width:220px;margin:16px auto 0;display:flex" onclick="openM(\'m-auth\')">Войти / Регистрация</button></div>';
    return;
  }
  var ini = (curUser.name||'R').charAt(0).toUpperCase();
  el.innerHTML =
    '<div class="prof-hero">'+
      '<div class="ph-ava">'+ini+'</div>'+
      '<div class="ph-name">'+esc(curUser.name)+'</div>'+
      '<div class="ph-tag">🏠 Верифицированный риэлтор · Астана</div>'+
      '<div class="ph-stats">'+
        '<div class="ph-stat"><div class="ph-val">12</div><div class="ph-lbl">Объектов</div></div>'+
        '<div class="ph-stat"><div class="ph-val">⭐ 4.8</div><div class="ph-lbl">Рейтинг</div></div>'+
        '<div class="ph-stat"><div class="ph-val">47</div><div class="ph-lbl">Сделок</div></div>'+
      '</div>'+
    '</div>'+
    '<div class="menu-sec"><div class="menu-lbl">Мои объекты</div>'+
      mItem('🏠','rgba(244,123,32,.1)','Активные объекты','12 опубликованы',"toast('📋 Мои объекты')")+
      mItem('❤️','rgba(231,76,60,.1)', 'Избранное',        '8 объектов',     "toast('❤️ Избранное')")+
    '</div>'+
    '<div class="menu-sec"><div class="menu-lbl">Инструменты</div>'+
      mItem('📅','rgba(39,174,96,.1)', 'Планировщик',       '4 события',       "go('s-cal');nav(null)")+
      mItem('🏆','rgba(244,123,32,.1)','Рейтинг',          'Вы на 3-м месте', "toast('🏆 Рейтинг')")+
      mItem('💡','rgba(244,123,32,.08)','Налоговый советник 2026','Обмен vs продажа',"toast('💡 Советник')")+
    '</div>'+
    '<div class="menu-sec"><div class="menu-lbl">Аккаунт</div>'+
      mItem('⚙️','rgba(100,100,200,.08)','Настройки','Профиль, уведомления',"toast('⚙️ Настройки')")+
      '<div class="menu-item" onclick="doLogout()"><div class="menu-ico" style="background:rgba(231,76,60,.08)">🚪</div><div><div class="menu-name" style="color:#E74C3C">Выйти</div></div></div>'+
    '</div>';
}

function mItem(ico, bg, name, sub, action) {
  return '<div class="menu-item" onclick="'+action+'"><div class="menu-ico" style="background:'+bg+'">'+ico+'</div><div style="flex:1"><div class="menu-name">'+name+'</div><div class="menu-sub">'+sub+'</div></div><i class="fas fa-chevron-right" style="color:var(--t3);font-size:11px"></i></div>';
}

/* ══ AUTH ════════════════════════════════ */
function authTab(t) {
  document.getElementById('at-in').classList.toggle('on', t==='in');
  document.getElementById('at-up').classList.toggle('on', t==='up');
  document.getElementById('af-in').style.display = t==='in' ? 'block' : 'none';
  document.getElementById('af-up').style.display = t==='up' ? 'block' : 'none';
}

function doLogin() {
  var email = val('l-email');
  var pass  = val('l-pass');
  if (!email) { toast('⚠️ Введите email'); return; }
  if (!pass)  { toast('⚠️ Введите пароль'); return; }
  fetch('/api/auth/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})})
    .then(function(r){ return r.json(); })
    .then(function(d) {
      if (d.success) {
        curUser = d.user;
        localStorage.setItem('fp_user', JSON.stringify(curUser));
        renderAuthSlot(); closeM('m-auth'); renderProf(); updateAiraBadge();
        toast('👋 Добро пожаловать, ' + ((curUser.name||'').split(' ')[0]||'риэлтор') + '!');
      }
    }).catch(function(){ toast('⚠️ Ошибка входа'); });
}

function doReg() {
  var name = val('r-name'), email = val('r-email'), pass = val('r-pass');
  if (!name)  { toast('⚠️ Введите имя'); return; }
  if (!email) { toast('⚠️ Введите email'); return; }
  if (!pass || pass.length < 6) { toast('⚠️ Пароль минимум 6 символов'); return; }
  fetch('/api/auth/register', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name,email:email})})
    .then(function(r){ return r.json(); })
    .then(function(d) {
      if (d.success) {
        curUser = Object.assign({}, d.user, {name:name});
        localStorage.setItem('fp_user', JSON.stringify(curUser));
        renderAuthSlot(); closeM('m-auth'); renderProf(); updateAiraBadge();
        toast('🎉 Добро пожаловать в Flapy, '+name.split(' ')[0]+'!');
      }
    }).catch(function(){ toast('⚠️ Ошибка регистрации'); });
}

function doLogout() {
  curUser = null; localStorage.removeItem('fp_user');
  renderAuthSlot(); renderProf(); updateAiraBadge(); toast('👋 До встречи!');
}

function renderAuthSlot() {
  var slot = document.getElementById('auth-slot');
  if (!slot) return;
  if (curUser) {
    var ini = (curUser.name||'R').charAt(0).toUpperCase();
    var fn  = (curUser.name||'Профиль').split(' ')[0];
    slot.innerHTML = '<div class="u-chip" onclick="go(\'s-prof\');nav(null)"><div class="u-ava">'+ini+'</div><span class="u-nm">'+esc(fn)+'</span></div>';
  } else {
    slot.innerHTML = '<button class="login-btn" onclick="openM(\'m-auth\')">Войти</button>';
  }
}

function needAuth(cb) {
  if (curUser) cb();
  else { toast('🔐 Войдите как риэлтор'); openM('m-auth'); }
}

/* ══ NAVIGATION ═══════════════════════════ */
function go(id) {
  document.querySelectorAll('.scr').forEach(function(s){ s.classList.remove('on'); });
  var s = document.getElementById(id); if (s) s.classList.add('on');
  if (id === 's-cal')    renderCal();
  if (id === 's-prof')   renderProf();
  if (id === 's-search') renderListings();
}

function nav(el) {
  document.querySelectorAll('.nav-it').forEach(function(n){ n.classList.remove('on'); });
  if (el) el.classList.add('on');
}

function showMore() { openM('m-more'); }

/* ══ MODALS ══════════════════════════════ */
function openM(id)  { var e=document.getElementById(id); if(e) e.classList.add('on'); }
function closeM(id) { var e=document.getElementById(id); if(e) e.classList.remove('on'); }
function closeOvl(e, id) { if(e.target.id===id) closeM(id); }

/* ══ THEME ═══════════════════════════════ */
function toggleTheme() {
  var cur  = document.documentElement.getAttribute('data-theme');
  var next = cur === 'dark' ? 'light' : 'dark';
  applyTheme(next); localStorage.setItem('fp_theme', next);
}
function applyTheme(th) {
  document.documentElement.setAttribute('data-theme', th);
  var btn = document.getElementById('btn-theme');
  if (btn) btn.innerHTML = th==='dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

/* ══ LANGUAGE ════════════════════════════ */
function setLang(lang) {
  curLang = lang; localStorage.setItem('fp_lang', lang);
  updateLangUI();
  toast(lang==='kz' ? '🇰🇿 Қазақ тілі' : '🇷🇺 Русский');
}
function updateLangUI() {
  var ru = document.getElementById('lo-ru'), kz = document.getElementById('lo-kz');
  if (ru) ru.classList.toggle('on', curLang==='ru');
  if (kz) kz.classList.toggle('on', curLang==='kz');
}

/* ══ TOAST ═══════════════════════════════ */
function toast(msg, ms) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function(){ el.classList.remove('show'); }, ms||2400);
}

/* ══ UTILS ═══════════════════════════════ */
function val(id) { var e=document.getElementById(id); return e ? e.value.trim() : ''; }
function esc(s)  { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function pad(n)  { return String(n).padStart(2,'0'); }
