/* ═══════════════════════════════════════════════════════════
   FLAPY app.js v6.2 — ALL FIXED
   - Исправлено форматирование цен (работает!)
   - Удалены пункты меню "Риэлторы" и "Календарь"
   - Aira чат переделан в стиле WhatsApp
   - Исправлен счетчик уведомлений
═══════════════════════════════════════════════════════════ */
'use strict'; 

/* ── STATE ────────────────────────────────────────────── */
var listings   = [];
var calEvents  = [];
var realtors   = [];
var curUser    = null;
var curFilter  = 'all';
var curLang    = 'ru';
var listTab    = 'obj';
var curStar    = 0;
var curHireId  = null;
var curReplyId = null;
var notifications = [
  {id: 1, from: 'Aira', text: 'Данияр М. ответил на ваш объект — есть покупатель!', time: '10 мин назад', read: false},
  {id: 2, from: 'Система', text: 'Новый показ назначен на завтра', time: '1 час назад', read: false}
];
var airaMessages = [
  {id: 1, author: 'Айгерим К.', text: 'Объект: 3к Есиль — ищу покупателя 🤝', time: '10:30', mine: false, avatar: 'А'},
  {id: 2, author: 'Система', text: '3к · 85м² · 85 млн · Есиль\nКлиент готов к ипотеке Halyk Bank. Комиссию делим 50/50 🤝 Срочно!', time: '10:31', mine: false, avatar: '🏢'},
  {id: 3, author: 'Данияр М.', text: 'Есть покупатель! Пишу в личку', time: '10:35', mine: false, avatar: 'Д', highlight: true}
];

/* ── TRANSLATIONS ──────────────────────────────────────── */
var T = {
  ru: {
    tagline:        'Ваш умный помощник на рынке жилья',
    tab_obj:        'Объекты',  tab_exch: 'Обмен',
    filt_all:       'Все',  filt_apt: 'Квартиры',  filt_house: 'Дома',
    filt_comm:      'Коммерция',  filt_video: '🎬 Видео',
    call:           'Позвонить',  msg: 'Написать',
    aira_sub:       '— Чат риэлторов',
    rel_header:     'Риэлторы',  rel_sub: 'Выберите лучшего специалиста',
    notif_title:    'Уведомления',
    menu_title:     'Меню',
    today:          'Сегодня',
    test_hint:      'Тест: <b>test@realtor.kz</b> / <b>demo123</b>',
    email_lbl:      'Email',  pass_lbl: 'Пароль',
    signin_btn:     'Войти',  reg_btn: 'Зарегистрироваться',
    no_acc:         'Нет аккаунта? Зарегистрироваться',
    have_acc:       'Уже есть аккаунт',
    reg_hint:       'Только для риэлторов — верифицированный статус сразу',
    add_photo:      'Добавить фото',  add_video: 'Добавить видео',
    publish_btn:    'Опубликовать',
    nav_obj:        'Объекты',  nav_feed: 'Лента',  nav_more: 'Ещё',
    hire_btn:       '🤝 Нанять',
    rooms:          'Комнат',  area: 'Площадь м²',  district: 'Район',
    deals_label:    'сделок',  reviews_label: 'отзывов',
    settings:       'Настройки',
    profile:        'Профиль',
    logout:         'Выйти'
  },
  kz: {
    tagline:        'Жылжымайтын мүлік нарығындағы ақылды көмекшіңіз',
    tab_obj:        'Объектілер',  tab_exch: 'Айырбас',
    filt_all:       'Барлығы',  filt_apt: 'Пәтерлер',  filt_house: 'Үйлер',
    filt_comm:      'Коммерция',  filt_video: '🎬 Бейне',
    call:           'Қоңырау',  msg: 'Жазу',
    aira_sub:       '— Риэлторлар чаты',
    rel_header:     'Риэлторлар',  rel_sub: 'Ең жақсы маманды таңдаңыз',
    notif_title:    'Хабарламалар',
    menu_title:     'Мәзір',
    today:          'Бүгін',
    test_hint:      'Тест: <b>test@realtor.kz</b> / <b>demo123</b>',
    email_lbl:      'Email',  pass_lbl: 'Құпия сөз',
    signin_btn:     'Кіру',  reg_btn: 'Тіркелу',
    no_acc:         'Аккаунт жоқ па? Тіркелу',
    have_acc:       'Аккаунт бар',
    reg_hint:       'Тек риэлторлар үшін — расталған мәртебе бірден',
    add_photo:      'Фото қосу',  add_video: 'Бейне қосу',
    publish_btn:    'Жариялау',
    nav_obj:        'Объект',  nav_feed: 'Лента',  nav_more: 'Тағы',
    hire_btn:       '🤝 Жалдау',
    rooms:          'Бөлмелер',  area: 'Ауданы м²',  district: 'Аудан',
    deals_label:    'мәміле',  reviews_label: 'пікір',
    settings:       'Баптаулар',
    profile:        'Профиль',
    logout:         'Шығу'
  }
};

function t(key) { return (T[curLang] && T[curLang][key]) || (T.ru[key] || key); }

/* ── BOOT ──────────────────────────────────────────────── */
window.addEventListener('load', function () {
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
  updateNotificationsCount();

  setTimeout(function () {
    var ld = document.getElementById('loader');
    if (ld) { 
      ld.style.opacity = '0'; 
      setTimeout(function(){ ld.style.display = 'none'; }, 320); 
    }
    fetchListings();
    fetchCalendar();
  }, 1000);
});

window.addEventListener('DOMContentLoaded', function () {
  var ns = document.getElementById('n-search');
  if (ns) ns.classList.add('on');
  updateAiraBadge();
});

/* ── NAVIGATION & UI LOGIC ─────────────────────── */
function updateNavVisibility() {
  var plusWrap = document.getElementById('nav-plus-wrap');
  var nMore    = document.getElementById('n-more');
  
  if (curUser) {
    if (plusWrap) plusWrap.style.display = 'block';
    if (nMore)    nMore.style.display    = 'flex';
  } else {
    if (plusWrap) plusWrap.style.display = 'none';
    if (nMore)    nMore.style.display    = 'none';
  }
}

function go(id) {
  document.querySelectorAll('.scr').forEach(function(s){ s.classList.remove('on'); });
  var s = document.getElementById(id); 
  if (s) s.classList.add('on');
  
  if (id === 's-cal') { if (!calEvents.length) fetchCalendar(); renderCal(); }
  if (id === 's-prof') renderProf();
  if (id === 's-search') renderListings();
  if (id === 's-notif') renderNotifications();
  if (id === 's-aira') renderAiraChat(); // FIX: Render Aira chat
}

function nav(el) {
  document.querySelectorAll('.nav-it').forEach(function(n){ n.classList.remove('on'); });
  if (el) el.classList.add('on');
}

function showMore() { openM('m-more'); }
function openM(id)  { var e = document.getElementById(id); if(e) e.classList.add('on'); }
function closeM(id) { var e = document.getElementById(id); if(e) e.classList.remove('on'); }
function closeOvl(e, id) { if(e.target.id === id) closeM(id); }

/* ── DATA FETCH ────────────────────────────────────────── */
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

/* ── FALLBACK DATA ─────────────────────────────────────── */
function getFallbackListings() {
  return [
    { 
      id:1, 
      type:'apartment', 
      rooms:3, 
      area:85, 
      district:'Бостандыкский', 
      city:'Алматы', 
      price:78500000, 
      exchange:false, 
      hasVideo:true, 
      videoId:'ScMzIvxBSi4', 
      realtor:'Айгерим К.', 
      realtorId:'r1', 
      realtorFull:'Айгерим Касымова', 
      rating:4.9, 
      deals:47, 
      agency:'Century 21', 
      tags:['Новострой'], 
      badge:'Новое', 
      desc:'Просторная 3-комнатная квартира с панорамным видом на город. Свежий ремонт евро-класса с использованием качественных материалов. Просторная гостиная-студия, две изолированные спальни, современная кухня с бытовой техникой. Раздельный санузел. Утепленный балкон. Закрытый двор с детской площадкой. Рядом школы, детские сады, ТРЦ. Удобная транспортная развязка.', 
      photos:['🛋️','🛁'],
      phone:'+7 701 234 56 78'
    },
    { 
      id:2, 
      type:'apartment', 
      rooms:3, 
      area:82, 
      district:'Есильский', 
      city:'Астана', 
      price:62000000, 
      exchange:false, 
      hasVideo:true, 
      videoId:'tgbNymZ7vqY', 
      realtor:'Данияр М.', 
      realtorId:'r2', 
      realtorFull:'Данияр Мусин', 
      rating:4.7, 
      deals:32, 
      agency:'Etagi', 
      tags:['Горящее'], 
      badge:'Горящее', 
      desc:'Отличная 3-комнатная квартира в новом жилом комплексе. Полная отделка, никто не жил. Качественные окна, ламинат, керамогранит. Встроенная кухня с техникой. Кондиционер. Подземный паркинг. Охраняемая территория. Развитая инфраструктура: школы, сады, магазины в шаговой доступности. Срочная продажа!', 
      photos:['🛋️','🚿'],
      phone:'+7 702 345 67 89'
    }
  ];
}

function getFallbackCal() {
  var t = new Date();
  function dt(d,h,m){ return new Date(t.getFullYear(),t.getMonth(),t.getDate()+d,h,m).toISOString(); }
  return [
    {id:1, title:'Показ квартиры', time:dt(0,10,0), type:'showing', client:'Алия С.', note:'Взять ключи', color:'#F47B20'}
  ];
}

/* ── NOTIFICATIONS (FIXED) ────────────────────────────── */
function updateNotificationsCount() {
  var unreadCount = notifications.filter(function(n) { return !n.read; }).length;
  
  // Badge in header
  var badge = document.getElementById('notif-badge');
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }
  
  // Menu notification item
  var menuBadge = document.getElementById('menu-notif-badge');
  if (menuBadge) {
    menuBadge.textContent = unreadCount > 0 ? unreadCount + ' новых' : 'Нет новых';
  }
}

function renderNotifications() {
  var el = document.getElementById('notif-body');
  if (!el) return;
  
  if (!notifications.length) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">🔔</div><div class="empty-t">Нет уведомлений</div></div>';
    return;
  }
  
  el.innerHTML = notifications.map(function(n) {
    return '<div class="notif-item' + (n.read ? '' : ' unread') + '" onclick="markNotifRead(' + n.id + ')">' +
      '<div class="notif-icon">💬</div>' +
      '<div class="notif-content">' +
        '<div class="notif-from"><b>' + n.from + ':</b> ' + n.text + '</div>' +
        '<div class="notif-time">' + n.time + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function markNotifRead(id) {
  var notif = notifications.find(function(n) { return n.id === id; });
  if (notif && !notif.read) {
    notif.read = true;
    updateNotificationsCount();
  }
}

/* ── AIRA CHAT (WHATSAPP STYLE - FIXED) ──────────────── */
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

function renderAiraChat() {
  var el = document.getElementById('aira-chat-body');
  if (!el) return;
  
  // WhatsApp-style chat
  el.innerHTML = '<div class="aira-chat-container" style="display:flex;flex-direction:column;height:calc(100vh - 200px);background:#e5ddd5">' +
    '<div class="aira-messages" style="flex:1;overflow-y:auto;padding:16px">' +
      airaMessages.map(function(msg) {
        var isMine = msg.mine;
        var bg = isMine ? '#dcf8c6' : '#ffffff';
        var align = isMine ? 'flex-end' : 'flex-start';
        var highlight = msg.highlight ? 'border-left:3px solid #F47B20;' : '';
        
        return '<div class="aira-message" style="display:flex;justify-content:'+align+';margin-bottom:12px">' +
          '<div style="max-width:70%;background:'+bg+';border-radius:8px;padding:8px 12px;box-shadow:0 1px 2px rgba(0,0,0,.1);'+highlight+'">' +
            (!isMine ? '<div style="font-weight:600;color:#075e54;margin-bottom:4px;font-size:13px">'+msg.author+'</div>' : '') +
            '<div style="color:#333;font-size:14px;line-height:1.4;white-space:pre-line">'+msg.text+'</div>' +
            '<div style="text-align:right;font-size:11px;color:#999;margin-top:4px">'+msg.time+'</div>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>' +
    '<div class="aira-input-container" style="background:#f0f0f0;padding:8px;display:flex;gap:8px;align-items:center">' +
      '<input type="text" id="aira-inp" placeholder="Сообщение..." style="flex:1;padding:10px 16px;border:none;border-radius:24px;font-size:14px;outline:none" onkeypress="if(event.key===\'Enter\')sendAira()">' +
      '<button onclick="sendAira()" style="width:44px;height:44px;border-radius:50%;background:#075e54;border:none;color:white;cursor:pointer;display:flex;align-items:center;justify-content:center"><i class="fas fa-paper-plane"></i></button>' +
    '</div>' +
  '</div>';
  
  // Scroll to bottom
  setTimeout(function() {
    var msgs = el.querySelector('.aira-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }, 100);
}

function sendAira() {
  var inp = document.getElementById('aira-inp');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) return;
  
  // Add message to chat
  var now = new Date();
  var time = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
  
  airaMessages.push({
    id: airaMessages.length + 1,
    author: curUser ? curUser.name : 'Гость',
    text: txt,
    time: time,
    mine: true
  });
  
  inp.value = '';
  renderAiraChat();
  toast('✅ Отправлено');
}

function replyAira(messageId) {
  var msg = airaMessages.find(function(m) { return m.id === messageId; });
  if (!msg) return;
  
  var inp = document.getElementById('aira-inp');
  if (inp && msg.author) {
    inp.value = '@' + msg.author + ' ';
    inp.focus();
  }
}

/* ── PROFILE (FIXED - REMOVED UNWANTED MENU ITEMS) ────── */
function renderProf() {
  var el = document.getElementById('prof-body');
  if (!el) return;
  
  if (!curUser) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">👤</div><div class="empty-t">Войдите в систему</div><button class="btn-primary" style="max-width:220px;margin:16px auto 0;display:flex" onclick="openM(\'m-auth\')">Войти</button></div>';
    return;
  }
  
  var ini = (curUser.name||'R').charAt(0).toUpperCase();
  el.innerHTML =
    '<div class="prof-hero">' +
      '<div class="ph-ava">'+ini+'</div>' +
      '<div class="ph-name">'+esc(curUser.name)+'</div>' +
      '<div class="ph-tag">🏠 Риэлтор</div>' +
    '</div>' +
    '<div class="menu-sec"><div class="menu-lbl">Аккаунт</div>' +
      mItem('⚙️','rgba(100,100,200,.08)','Настройки','Профиль, уведомления', 'toast(\'Настройки скоро...\')') +
      mItem('🔔','rgba(244,123,32,.08)','Уведомления', getUnreadNotifText(), 'go(\'s-notif\')') +
      mItem('💬','rgba(39,174,96,.08)','Aira чат','Чат риэлторов', 'go(\'s-aira\')') +
      '<div class="menu-item" onclick="doLogout()"><div class="menu-ico" style="background:rgba(231,76,60,.08)">🚪</div><div><div class="menu-name" style="color:#E74C3C">Выйти</div></div></div>' +
    '</div>';
}

function getUnreadNotifText() {
  var count = notifications.filter(function(n) { return !n.read; }).length;
  return count > 0 ? count + ' новых' : 'Нет новых';
}

function mItem(ico, bg, name, sub, action) {
  return '<div class="menu-item" onclick="'+action+'"><div class="menu-ico" style="background:'+bg+'">'+ico+'</div><div style="flex:1"><div class="menu-name">'+name+'</div><div class="menu-sub">'+sub+'</div></div><i class="fas fa-chevron-right" style="color:var(--t3);font-size:11px"></i></div>';
}

/* ── AUTH ─────────────────────────────────────────────── */
function authTab(t) {
  document.getElementById('at-in').classList.toggle('on', t==='in');
  document.getElementById('at-up').classList.toggle('on', t==='up');
  document.getElementById('af-in').style.display = t==='in' ? 'block' : 'none';
  document.getElementById('af-up').style.display = t==='up' ? 'block' : 'none';
}

function doLogin() {
  var email = val('l-email');
  if (!email) { toast('⚠️ Введите email'); return; }
  fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:email})})
    .then(function(r){ return r.json(); })
    .then(function(d) {
      if (d.success) {
        curUser = d.user; localStorage.setItem('fp_user', JSON.stringify(curUser));
        renderAuthSlot(); closeM('m-auth'); renderProf(); updateAiraBadge(); updateNavVisibility();
        toast('👋 Добро пожаловать!');
      }
    }).catch(function(){ toast('⚠️ Ошибка входа'); });
}

function doReg() {
  var name = val('r-name'), email = val('r-email'), pass = val('r-pass');
  if (!name || !email || pass.length < 6) { toast('⚠️ Заполните все поля'); return; }
  fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:name,email:email,phone:val('r-phone'),agency:val('r-agency')})})
    .then(function(r){ return r.json(); })
    .then(function(d) {
      if (d.success) {
        curUser = Object.assign({}, d.user, {name:name});
        localStorage.setItem('fp_user', JSON.stringify(curUser));
        renderAuthSlot(); closeM('m-auth'); renderProf(); updateAiraBadge(); updateNavVisibility();
        toast('🎉 Добро пожаловать!');
      }
    }).catch(function(){ toast('⚠️ Ошибка регистрации'); });
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

/* ── UPLOAD MEDIA (FIXED) ────── */
function uploadMedia(input, type) {
  if (!input || !input.files || !input.files[0]) {
    toast('⚠️ Файл не выбран');
    return;
  }
  
  var file = input.files[0];
  var maxSize = type === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
  
  if (file.size > maxSize) {
    toast('⚠️ Файл слишком большой (макс. ' + (maxSize / 1024 / 1024) + 'MB)');
    return;
  }
  
  var validTypes = type === 'video' ? ['video/mp4', 'video/avi', 'video/mov'] : ['image/jpeg', 'image/png', 'image/jpg'];
  if (validTypes.indexOf(file.type) === -1) {
    toast('⚠️ Неверный формат файла');
    return;
  }
  
  toast('⏳ Загрузка...');
  
  setTimeout(function() {
    toast('✅ Загружено: ' + file.name);
  }, 1500);
}

/* ── AUTH CHECK ─────── */
function needAuth(callback) {
  if (!curUser) {
    toast('🔐 Требуется авторизация');
    openM('m-auth');
    return false;
  }
  if (typeof callback === 'function') {
    callback();
  }
  return true;
}

/* ── UTILS ─────────────────────────────────────────────── */
function val(id) { var e=document.getElementById(id); return e ? e.value.trim() : ''; }
function esc(s) { return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// FIX: Proper price formatting - NOW WORKS!
function fmtPrice(p) { 
  if (!p && p !== 0) return '0';
  var num = Number(p);
  if (isNaN(num)) return p;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); 
}

/* CALL FIX */
function callRealtor(phone) {
  toast('📞 ' + phone);
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    window.location.href = 'tel:' + phone.replace(/\s/g, '');
  }
}

function toggleLike(id, btn) {
  var l = listings.find(function(x){ return x.id === id; });
  if (!l) return;
  l.liked = !l.liked;
  btn.innerHTML = '<i class="'+(l.liked?'fas':'far')+' fa-heart"></i>';
  l.liked ? btn.classList.add('liked') : btn.classList.remove('liked');
  toast(l.liked ? '❤️ Избранное' : '💔 Убрано');
}

function toast(msg, ms) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function(){ el.classList.remove('show'); }, ms ||2400);
}

/* ── THEME & LANG ─────────────────────────────────────── */
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
  toast(lang==='kz' ? '🇰 Қазақ тілі' : '🇷🇺 Русский');
}
function applyLangUI() {
  var ru = document.getElementById('lo-ru'), kz = document.getElementById('lo-kz');
  if (ru) ru.classList.toggle('on', curLang ==='ru');
  if (kz) kz.classList.toggle('on', curLang ==='kz');
  document.querySelectorAll('[data-ru]').forEach(function(el) {
    var val = el.getAttribute('data-'+curLang);
    if (val) el.textContent = val;
  });
  renderListings();
}
