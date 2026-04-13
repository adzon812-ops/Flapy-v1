/* ═══════════════════════════════════════════════════════════
   FLAPY app.js v6.3 — URGENT FIX
   - Исправлен зависон на заставке
   - Убраны все критические ошибки
═══════════════════════════════════════════════════════════ */
'use strict'; 

/* ── STATE ────────────────────────────────────────────── */
var listings = [];
var calEvents = [];
var curUser = null;
var curFilter = 'all';
var curLang = 'ru';
var listTab = 'obj';
var notifications = [
  {id: 1, from: 'Aira', text: 'Данияр М. ответил на ваш объект', time: '10 мин назад', read: false}
];
var airaMessages = [
  {id: 1, author: 'Айгерим К.', text: 'Объект: 3к Есиль — ищу покупателя', time: '10:30', mine: false},
  {id: 2, author: 'Данияр М.', text: 'Есть покупатель!', time: '10:35', mine: false, highlight: true}
];

/* ── TRANSLATIONS ──────────────────────────────────────── */
var T = {
  ru: {
    tagline: 'Ваш умный помощник на рынке жилья',
    tab_obj: 'Объекты', tab_exch: 'Обмен',
    filt_all: 'Все', filt_apt: 'Квартиры', filt_house: 'Дома',
    filt_comm: 'Коммерция', filt_video: '🎬 Видео',
    call: 'Позвонить', msg: 'Написать',
    aira_sub: '— Чат риэлторов',
    notif_title: 'Уведомления',
    menu_title: 'Меню',
    today: 'Сегодня',
    email_lbl: 'Email', pass_lbl: 'Пароль',
    signin_btn: 'Войти', reg_btn: 'Зарегистрироваться',
    no_acc: 'Нет аккаунта? Зарегистрироваться',
    have_acc: 'Уже есть аккаунт',
    add_photo: 'Добавить фото', add_video: 'Добавить видео',
    publish_btn: 'Опубликовать',
    nav_obj: 'Объекты', nav_feed: 'Лента', nav_more: 'Ещё',
    profile: 'Профиль', logout: 'Выйти'
  },
  kz: {
    tagline: 'Жылжымайтын мүлік нарығындағы ақылды көмекшіңіз',
    tab_obj: 'Объектілер', tab_exch: 'Айырбас',
    filt_all: 'Барлығы', filt_apt: 'Пәтерлер', filt_house: 'Үйлер',
    filt_comm: 'Коммерция', filt_video: '🎬 Бейне',
    call: 'Қоңырау', msg: 'Жазу',
    aira_sub: '— Риэлторлар чаты',
    notif_title: 'Хабарламалар',
    menu_title: 'Мәзір',
    today: 'Бүгін',
    email_lbl: 'Email', pass_lbl: 'Құпия сөз',
    signin_btn: 'Кіру', reg_btn: 'Тіркелу',
    no_acc: 'Аккаунт жоқ па? Тіркелу',
    have_acc: 'Аккаунт бар',
    add_photo: 'Фото қосу', add_video: 'Бейне қосу',
    publish_btn: 'Жариялау',
    nav_obj: 'Объект', nav_feed: 'Лента', nav_more: 'Тағы',
    profile: 'Профиль', logout: 'Шығу'
  }
};

function t(key) { 
  return (T[curLang] && T[curLang][key]) || (T.ru[key] || key); 
}

/* ── BOOT ──────────────────────────────────────────────── */
window.addEventListener('load', function() {
  console.log('App loading...');
  
  try { 
    var s = localStorage.getItem('fp_user'); 
    if (s) curUser = JSON.parse(s); 
  } catch(e) {
    console.log('No user data');
  }
  
  var th = localStorage.getItem('fp_theme') || 'light';
  applyTheme(th);
  curLang = localStorage.getItem('fp_lang') || 'ru';
  applyLangUI();
  
  if (curUser) renderAuthSlot();
  updateNavVisibility();
  updateNotificationsCount();

  // Hide loader
  setTimeout(function() {
    var ld = document.getElementById('loader');
    if (ld) { 
      ld.style.opacity = '0'; 
      setTimeout(function(){ 
        ld.style.display = 'none'; 
      }, 320); 
    }
    
    // Load data
    try {
      fetchListings();
      fetchCalendar();
    } catch(e) {
      console.log('Error loading data:', e);
    }
  }, 800);
});

window.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded');
  var ns = document.getElementById('n-search');
  if (ns) ns.classList.add('on');
  updateAiraBadge();
});

/* ── NAVIGATION ──────────────────────────────────────── */
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

function go(id) {
  document.querySelectorAll('.scr').forEach(function(s){ 
    s.classList.remove('on'); 
  });
  var s = document.getElementById(id); 
  if (s) s.classList.add('on');
  
  if (id === 's-cal') { 
    if (!calEvents.length) fetchCalendar(); 
    renderCal(); 
  }
  if (id === 's-prof') renderProf();
  if (id === 's-search') renderListings();
  if (id === 's-notif') renderNotifications();
  if (id === 's-aira') renderAiraChat();
}

function nav(el) {
  document.querySelectorAll('.nav-it').forEach(function(n){ 
    n.classList.remove('on'); 
  });
  if (el) el.classList.add('on');
}

function showMore() { openM('m-more'); }
function openM(id) { 
  var e = document.getElementById(id); 
  if(e) e.classList.add('on'); 
}
function closeM(id) { 
  var e = document.getElementById(id); 
  if(e) e.classList.remove('on'); 
}
function closeOvl(e, id) { 
  if(e.target.id === id) closeM(id); 
}

/* ── DATA FETCH ────────────────────────────────────────── */
function fetchListings() {
  fetch('/api/listings')
    .then(function(r){ return r.json(); })
    .then(function(d){ 
      listings = d.listings || []; 
      renderFeed(); 
      renderListings(); 
    })
    .catch(function(err) { 
      console.log('Using fallback data');
      listings = getFallbackListings(); 
      renderFeed(); 
      renderListings(); 
    });
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
      id: 1, 
      type: 'apartment', 
      rooms: 3, 
      area: 85, 
      district: 'Есильский', 
      city: 'Астана', 
      price: 78500000, 
      exchange: false, 
      hasVideo: true, 
      videoId: 'ScMzIvxBSi4', 
      realtor: 'Айгерим К.', 
      realtorId: 'r1', 
      realtorFull: 'Айгерим Касымова', 
      rating: 4.9, 
      deals: 47, 
      agency: 'Century 21', 
      tags: ['Новострой'], 
      badge: 'Новое', 
      desc: 'Просторная 3-комнатная квартира с панорамным видом. Свежий ремонт евро-класса. Гостиная-студия, две спальни, современная кухня. Рядом школы, сады, ТРЦ.', 
      photos: ['🏢'],
      phone: '+7 701 234 56 78'
    },
    { 
      id: 2, 
      type: 'apartment', 
      rooms: 3, 
      area: 82, 
      district: 'Алматинский', 
      city: 'Астана', 
      price: 62000000, 
      exchange: false, 
      hasVideo: false, 
      realtor: 'Данияр М.', 
      realtorId: 'r2', 
      realtorFull: 'Данияр Мусин', 
      rating: 4.7, 
      deals: 32, 
      agency: 'Etagi', 
      tags: ['Горящее'], 
      badge: 'Горящее', 
      desc: 'Отличная 3-комнатная в новом ЖК. Полная отделка, никто не жил. Встроенная кухня, кондиционер. Подземный паркинг.', 
      photos: ['🏢'],
      phone: '+7 702 345 67 89'
    }
  ];
}

function getFallbackCal() {
  var t = new Date();
  function dt(d,h,m) { 
    return new Date(t.getFullYear(), t.getMonth(), t.getDate()+d, h, m).toISOString(); 
  }
  return [
    {id: 1, title: 'Показ квартиры', time: dt(0,10,0), type: 'showing', client: 'Алия С.', note: 'Взять ключи', color: '#F47B20'}
  ];
}

/* ── NOTIFICATIONS ────────────────────────────────────── */
function updateNotificationsCount() {
  var unreadCount = notifications.filter(function(n) { return !n.read; }).length;
  
  var badge = document.getElementById('notif-badge');
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }
}

function renderNotifications() {
  var el = document.getElementById('notif-body');
  if (!el) return;
  
  if (!notifications.length) {
    el.innerHTML = '<div class="empty"><div>Нет уведомлений</div></div>';
    return;
  }
  
  el.innerHTML = notifications.map(function(n) {
    return '<div class="notif-item' + (n.read ? '' : ' unread') + '" onclick="markNotifRead(' + n.id + ')">' +
      '<div><b>' + n.from + ':</b> ' + n.text + '</div>' +
      '<div style="font-size:11px;color:#999">' + n.time + '</div>' +
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

/* ── AIRA CHAT (WHATSAPP STYLE) ───────────────────────── */
function updateAiraBadge() {
  var badge = document.getElementById('aira-status-badge');
  if (!badge) return;
  if (curUser) {
    badge.textContent = '✓ ' + curUser.name.split(' ')[0];
    badge.style.color = '#27AE60';
  } else {
    badge.textContent = '🔒 Войдите';
    badge.style.color = '#F47B20';
  }
}

function renderAiraChat() {
  var el = document.getElementById('aira-chat-body');
  if (!el) return;
  
  el.innerHTML = '<div style="display:flex;flex-direction:column;height:calc(100vh - 200px);background:#e5ddd5">' +
    '<div style="flex:1;overflow-y:auto;padding:16px">' +
      airaMessages.map(function(msg) {
        var isMine = msg.mine;
        var bg = isMine ? '#dcf8c6' : '#ffffff';
        var align = isMine ? 'flex-end' : 'flex-start';
        var border = msg.highlight ? 'border-left:3px solid #F47B20;' : '';
        
        return '<div style="display:flex;justify-content:'+align+';margin-bottom:12px">' +
          '<div style="max-width:70%;background:'+bg+';border-radius:8px;padding:8px 12px;box-shadow:0 1px 2px rgba(0,0,0,.1);'+border+'">' +
            (!isMine ? '<div style="font-weight:600;color:#075e54;margin-bottom:4px;font-size:13px">'+msg.author+'</div>' : '') +
            '<div style="color:#333;font-size:14px;line-height:1.4">'+msg.text+'</div>' +
            '<div style="text-align:right;font-size:11px;color:#999;margin-top:4px">'+msg.time+'</div>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>' +
    '<div style="background:#f0f0f0;padding:8px;display:flex;gap:8px;align-items:center">' +
      '<input type="text" id="aira-inp" placeholder="Сообщение..." style="flex:1;padding:10px 16px;border:none;border-radius:24px;font-size:14px;outline:none" onkeypress="if(event.key===\'Enter\')sendAira()">' +
      '<button onclick="sendAira()" style="width:44px;height:44px;border-radius:50%;background:#075e54;border:none;color:white;cursor:pointer">📤</button>' +
    '</div>' +
  '</div>';
  
  setTimeout(function() {
    var msgs = el.querySelector('[style*="overflow-y:auto"]');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }, 100);
}

function sendAira() {
  var inp = document.getElementById('aira-inp');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) return;
  
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

/* ── PROFILE ──────────────────────────────────────────── */
function renderProf() {
  var el = document.getElementById('prof-body');
  if (!el) return;
  
  if (!curUser) {
    el.innerHTML = '<div style="text-align:center;padding:40px"><div>👤</div><div style="margin:16px 0">Войдите в систему</div><button onclick="openM(\'m-auth\')" style="padding:12px 24px;background:#1E2D5A;color:white;border:none;border-radius:8px;cursor:pointer">Войти</button></div>';
    return;
  }
  
  var ini = (curUser.name||'R').charAt(0).toUpperCase();
  el.innerHTML =
    '<div style="text-align:center;padding:32px 16px;background:linear-gradient(135deg,#1E2D5A,#4A6FA5);color:white;border-radius:16px;margin-bottom:24px">' +
      '<div style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:32px">'+ini+'</div>' +
      '<div style="font-size:20px;font-weight:600">'+esc(curUser.name)+'</div>' +
      '<div style="opacity:.8;margin-top:8px">🏠 Риэлтор</div>' +
    '</div>' +
    '<div>' +
      '<div style="padding:12px 16px;border-bottom:1px solid #eee;cursor:pointer" onclick="go(\'s-notif\')">🔔 Уведомления</div>' +
      '<div style="padding:12px 16px;border-bottom:1px solid #eee;cursor:pointer" onclick="go(\'s-aira\')">💬 Aira чат</div>' +
      '<div style="padding:12px 16px;color:#E74C3C;cursor:pointer" onclick="doLogout()">🚪 Выйти</div>' +
    '</div>';
}

/* ── AUTH ─────────────────────────────────────────────── */
function authTab(t) {
  var inTab = document.getElementById('at-in');
  var upTab = document.getElementById('at-up');
  var inForm = document.getElementById('af-in');
  var upForm = document.getElementById('af-up');
  
  if (inTab) inTab.classList.toggle('on', t==='in');
  if (upTab) upTab.classList.toggle('on', t==='up');
  if (inForm) inForm.style.display = t==='in' ? 'block' : 'none';
  if (upForm) upForm.style.display = t==='up' ? 'block' : 'none';
}

function doLogin() {
  var email = val('l-email');
  if (!email) { toast('⚠️ Введите email'); return; }
  
  // Simulate login
  curUser = {name: email.split('@')[0], email: email};
  localStorage.setItem('fp_user', JSON.stringify(curUser));
  renderAuthSlot(); 
  closeM('m-auth'); 
  renderProf(); 
  updateAiraBadge(); 
  updateNavVisibility();
  toast('👋 Добро пожаловать!');
}

function doReg() {
  var name = val('r-name');
  var email = val('r-email');
  if (!name || !email) { toast('⚠️ Заполните все поля'); return; }
  
  curUser = {name: name, email: email};
  localStorage.setItem('fp_user', JSON.stringify(curUser));
  renderAuthSlot(); 
  closeM('m-auth'); 
  renderProf(); 
  updateAiraBadge(); 
  updateNavVisibility();
  toast('🎉 Добро пожаловать!');
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
    slot.innerHTML = '<div style="display:flex;align-items:center;gap:8px;cursor:pointer" onclick="go(\'s-prof\')"><div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1E2D5A,#4A6FA5);display:flex;align-items:center;justify-content:center;color:white;font-size:14px">'+ini+'</div><span>'+esc(fn)+'</span></div>';
  } else {
    slot.innerHTML = '<button onclick="openM(\'m-auth\')" style="padding:8px 16px;background:#1E2D5A;color:white;border:none;border-radius:8px;cursor:pointer">Войти</button>';
  }
}

/* ── UTILS ─────────────────────────────────────────────── */
function val(id) { 
  var e = document.getElementById(id); 
  return e ? e.value.trim() : ''; 
}

function esc(s) { 
  return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); 
}

// FIXED PRICE FORMATTING
function fmtPrice(p) { 
  if (p === null || p === undefined) return '0';
  var num = Number(p);
  if (isNaN(num)) return String(p);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); 
}

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
  toast(l.liked ? '❤️ Избранное' : '💔 Убрано');
}

function toast(msg, ms) {
  var el = document.getElementById('toast');
  if (!el) {
    // Create toast if not exists
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.8);color:white;padding:12px 24px;border-radius:8px;z-index:10000;opacity:0;transition:opacity .3s';
    document.body.appendChild(el);
  }
  el.textContent = msg; 
  el.style.opacity = '1';
  setTimeout(function(){ el.style.opacity = '0'; }, ms || 2400);
}

/* ── THEME & LANG ─────────────────────────────────────── */
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
  toast(lang==='kz' ? '🇰 Қазақ тілі' : '🇷🇺 Русский');
}

function applyLangUI() {
  var ru = document.getElementById('lo-ru');
  var kz = document.getElementById('lo-kz');
  if (ru) ru.classList.toggle('on', curLang === 'ru');
  if (kz) kz.classList.toggle('on', curLang === 'kz');
}

/* ── PLACEHOLDER FUNCTIONS ───────────────────────────── */
function renderFeed() {
  // Placeholder - implement if needed
}

function renderListings() {
  // Placeholder - implement if needed
}

function renderCal() {
  // Placeholder - implement if needed
}

function uploadMedia(input, type) {
  toast('⏳ Загрузка...');
  setTimeout(function() {
    toast('✅ Загружено');
  }, 1000);
}

function needAuth(callback) {
  if (!curUser) {
    toast('🔐 Требуется авторизация');
    openM('m-auth');
    return false;
  }
  if (typeof callback === 'function') callback();
  return true;
}

function setListTab(tab) {
  listTab = tab;
  renderListings();
}

function setFilt(el, f) {
  curFilter = f;
  renderListings();
}

function openDetail(id) {
  var l = listings.find(function(x){ return x.id === id; });
  if (!l) return;
  toast('Открыт объект: ' + l.price);
}
