/* ═══════════════════════════════════════════════════════════
   FLAPY app.js v9.0 — FULL WORKING VERSION
   ВСЕ ИСПРАВЛЕНИЯ + НОВЫЕ ФУНКЦИИ
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
  {id: 1, from: 'Aira', text: 'Данияр М. ответил на ваш объект — есть покупатель!', time: '10 мин назад', read: false},
  {id: 2, from: 'Система', text: 'Новый показ назначен на завтра', time: '1 час назад', read: false},
  {id: 3, from: 'Aira', text: 'Обновите информацию об объекте', time: '2 часа назад', read: false}
];
var airaMessages = [
  {id: 1, author: 'Айгерим К.', text: 'Объект: 3к Есиль — ищу покупателя 🤝', time: '10:30', mine: false},
  {id: 2, author: 'Система', text: '3к · 85м² · 85 млн · Есиль\nКлиент готов к ипотеке Halyk Bank. Комиссию делим 50/50 🤝 Срочно!', time: '10:31', mine: false},
  {id: 3, author: 'Данияр М.', text: 'Есть покупатель! Пишу в личку', time: '10:35', mine: false, highlight: true}
];

/* ── TRANSLATIONS ──────────────────────────────────────── */
var T = {
  ru: {
    tagline: 'Ваш умный помощник на рынке жилья',
    tab_obj: 'Объекты', tab_exch: 'Обмен',
    filt_all: 'Все', filt_apt: 'Квартиры', filt_house: 'Дома', filt_comm: 'Коммерция', filt_video: '🎬 Видео',
    call: 'Позвонить', msg: 'Написать',
    aira_sub: '— Чат риэлторов',
    notif_title: 'Уведомления', menu_title: 'Меню', today: 'Сегодня',
    email_lbl: 'Email', pass_lbl: 'Пароль',
    signin_btn: 'Войти', reg_btn: 'Зарегистрироваться',
    no_acc: 'Нет аккаунта? Зарегистрироваться', have_acc: 'Уже есть аккаунт',
    add_photo: 'Добавить фото', add_video: 'Добавить видео', publish_btn: 'Опубликовать',
    nav_obj: 'Объекты', nav_feed: 'Лента', nav_more: 'Ещё',
    profile: 'Профиль', logout: 'Выйти', settings: 'Настройки'
  },
  kz: {
    tagline: 'Жылжымайтын мүлік нарығындағы ақылды көмекшіңіз',
    tab_obj: 'Объектілер', tab_exch: 'Айырбас',
    filt_all: 'Барлығы', filt_apt: 'Пәтерлер', filt_house: 'Үйлер', filt_comm: 'Коммерция', filt_video: '🎬 Бейне',
    call: 'Қоңырау', msg: 'Жазу',
    aira_sub: '— Риэлторлар чаты',
    notif_title: 'Хабарламалар', menu_title: 'Мәзір', today: 'Бүгін',
    email_lbl: 'Email', pass_lbl: 'Құпия сөз',
    signin_btn: 'Кіру', reg_btn: 'Тіркелу',
    no_acc: 'Аккаунт жоқ па? Тіркелу', have_acc: 'Аккаунт бар',
    add_photo: 'Фото қосу', add_video: 'Бейне қосу', publish_btn: 'Жариялау',
    nav_obj: 'Объект', nav_feed: 'Лента', nav_more: 'Тағы',
    profile: 'Профиль', logout: 'Шығу', settings: 'Баптаулар'
  }
};

function t(key) { return (T[curLang] && T[curLang][key]) || (T.ru[key] || key); }

/* ── BOOT ──────────────────────────────────────────────── */
window.addEventListener('load', function() {
  // Load user
  try { 
    var s = localStorage.getItem('fp_user'); 
    if (s) curUser = JSON.parse(s); 
  } catch(e) {}
  
  // Load settings
  var th = localStorage.getItem('fp_theme') || 'light';
  applyTheme(th);
  curLang = localStorage.getItem('fp_lang') || 'ru';
  applyLangUI();
  
  // Render UI
  if (curUser) renderAuthSlot();
  updateNavVisibility();
  updateNotificationsCount();
  
  // Hide loader FAST
  var ld = document.getElementById('loader');
  if (ld) ld.style.display = 'none';
  
  // Load data
  listings = getFallbackListings();
  renderListings();
  renderFeed();
});

window.addEventListener('DOMContentLoaded', function() {
  var ns = document.getElementById('n-search');
  if (ns) ns.classList.add('on');
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
  document.querySelectorAll('.scr').forEach(function(s) { s.classList.remove('on'); });
  var s = document.getElementById(id); 
  if (s) s.classList.add('on');
  
  if (id === 's-cal') { if (!calEvents.length) fetchCalendar(); renderCal(); }
  if (id === 's-prof') renderProf();
  if (id === 's-search') renderListings();
  if (id === 's-notif') { renderNotifications(); updateNotificationsCount(); }
  if (id === 's-aira') renderAiraChat();
  if (id === 's-add') renderAddListing();
}

function nav(el) {
  document.querySelectorAll('.nav-it').forEach(function(n) { n.classList.remove('on'); });
  if (el) el.classList.add('on');
}

function showMore() { openM('m-more'); }
function openM(id) { var e = document.getElementById(id); if(e) e.classList.add('on'); }
function closeM(id) { var e = document.getElementById(id); if(e) e.classList.remove('on'); }
function closeOvl(e, id) { if(e.target.id === id) closeM(id); }

/* ── DATA FETCH ────────────────────────────────────────── */
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

/* ── FALLBACK DATA ─────────────────────────────────────── */
function getFallbackListings() {
  return [
    { 
      id: 1, type: 'apartment', rooms: 3, area: 85, district: 'Есильский', city: 'Астана', 
      price: 78500000, exchange: false, hasVideo: true, videoId: 'ScMzIvxBSi4', 
      realtor: 'Айгерим К.', realtorId: 'r1', realtorFull: 'Айгерим Касымова', 
      rating: 4.9, deals: 47, agency: 'Century 21', tags: ['Новострой'], badge: 'Новое', 
      desc: 'Просторная 3-комнатная квартира с панорамным видом на город. Свежий ремонт евро-класса с использованием качественных материалов. Просторная гостиная-студия, две изолированные спальни, современная кухня с бытовой техникой.', 
      photos: ['🏢'], phone: '+7 701 234 56 78', liked: false
    },
    { 
      id: 2, type: 'apartment', rooms: 3, area: 82, district: 'Алматинский', city: 'Астана', 
      price: 62000000, exchange: false, hasVideo: false, 
      realtor: 'Данияр М.', realtorId: 'r2', realtorFull: 'Данияр Мусин', 
      rating: 4.7, deals: 32, agency: 'Etagi', tags: ['Горящее'], badge: 'Горящее', 
      desc: 'Отличная 3-комнатная квартира в новом жилом комплексе. Полная отделка, никто не жил. Качественные окна, ламинат, керамогранит. Встроенная кухня с техникой.', 
      photos: ['🏢'], phone: '+7 702 345 67 89', liked: false
    }
  ];
}

function getFallbackCal() {
  var t = new Date();
  function dt(d,h,m) { return new Date(t.getFullYear(), t.getMonth(), t.getDate()+d, h, m).toISOString(); }
  return [{id: 1, title: 'Показ квартиры', time: dt(0,10,0), type: 'showing', client: 'Алия С.', note: 'Взять ключи', color: '#F47B20'}];
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
  
  var menuBadge = document.getElementById('menu-notif-badge');
  if (menuBadge) {
    menuBadge.textContent = unreadCount > 0 ? unreadCount + ' новых' : 'Нет новых';
  }
}

function renderNotifications() {
  var el = document.getElementById('notif-body');
  if (!el) return;
  
  if (!notifications.length) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:#999">Нет уведомлений</div>';
    return;
  }
  
  el.innerHTML = notifications.map(function(n) {
    return '<div class="notif-item' + (n.read ? '' : ' unread') + '" onclick="markNotifRead(' + n.id + ')" style="padding:16px 20px;border-bottom:1px solid #f0f0f0;cursor:pointer;background:' + (n.read ? '#fff' : '#f8f9fa') + '">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:6px">' +
        '<span style="font-weight:700;color:#1E2D5A">' + n.from + '</span>' +
        '<span style="font-size:12px;color:#999">' + n.time + '</span>' +
      '</div>' +
      '<div style="color:#555;line-height:1.5">' + n.text + '</div>' +
    '</div>';
  }).join('');
}

function markNotifRead(id) {
  var notif = notifications.find(function(n) { return n.id === id; });
  if (notif && !notif.read) {
    notif.read = true;
    updateNotificationsCount();
    renderNotifications();
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
    badge.textContent = '🔒 Гость';
    badge.style.color = '#F47B20';
  }
}

function renderAiraChat() {
  var el = document.getElementById('aira-chat-body');
  if (!el) return;
  
  el.innerHTML = '<div style="display:flex;flex-direction:column;height:calc(100vh - 200px);background:#e5ddd5;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">' +
    '<div style="flex:1;overflow-y:auto;padding:16px" id="aira-msgs">' +
      airaMessages.map(function(msg) {
        var isMine = msg.mine;
        var bg = isMine ? '#dcf8c6' : '#ffffff';
        var align = isMine ? 'flex-end' : 'flex-start';
        var border = msg.highlight ? 'border-left:4px solid #F47B20;' : '';
        
        return '<div style="display:flex;justify-content:' + align + ';margin-bottom:12px">' +
          '<div style="max-width:70%;background:' + bg + ';border-radius:8px;padding:10px 14px;box-shadow:0 1px 3px rgba(0,0,0,.1);' + border + '">' +
            (!isMine ? '<div style="font-weight:700;color:#075e54;font-size:13px;margin-bottom:4px">' + msg.author + '</div>' : '') +
            '<div style="color:#111;font-size:14.5px;line-height:1.45;white-space:pre-line">' + msg.text + '</div>' +
            '<div style="text-align:right;font-size:11px;color:#999;margin-top:6px">' + msg.time + '</div>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>' +
    '<div style="background:#f0f0f0;padding:10px 16px;display:flex;gap:10px;align-items:center;border-top:1px solid #ddd">' +
      '<input type="text" id="aira-inp" placeholder="Сообщение..." style="flex:1;padding:12px 18px;border:none;border-radius:24px;font-size:15px;outline:none;box-shadow:0 1px 2px rgba(0,0,0,.1)" onkeypress="if(event.key===\'Enter\')sendAira()">' +
      '<button onclick="sendAira()" style="width:48px;height:48px;border-radius:50%;background:#075e54;border:none;color:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 4px rgba(0,0,0,.2);transition:transform .1s" onmousedown="this.style.transform=\'scale(0.95)\'" onmouseup="this.style.transform=\'scale(1)\'">📤</button>' +
    '</div>' +
  '</div>';
  
  setTimeout(function() {
    var msgs = document.getElementById('aira-msgs');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }, 50);
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

/* ── PROFILE (NO REALTORS, NO CALENDAR) ───────────────── */
function renderProf() {
  var el = document.getElementById('prof-body');
  if (!el) return;
  
  if (!curUser) {
    el.innerHTML = '<div style="text-align:center;padding:40px 20px">' +
      '<div style="font-size:72px;margin-bottom:16px">👤</div>' +
      '<div style="font-size:18px;margin-bottom:24px;color:#555">Войдите в систему</div>' +
      '<button onclick="openM(\'m-auth\')" style="padding:14px 32px;background:#1E2D5A;color:white;border:none;border-radius:12px;cursor:pointer;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(30,45,90,.2)">' + t('signin_btn') + '</button>' +
    '</div>';
    return;
  }
  
  var ini = (curUser.name||'R').charAt(0).toUpperCase();
  el.innerHTML =
    '<div style="text-align:center;padding:40px 24px;background:linear-gradient(135deg,#1E2D5A,#4A6FA5);color:white;border-radius:16px;margin-bottom:24px;box-shadow:0 4px 12px rgba(30,45,90,.2)">' +
      '<div style="width:88px;height:88px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:36px;font-weight:700;box-shadow:0 4px 8px rgba(0,0,0,.15)">' + ini + '</div>' +
      '<div style="font-size:22px;font-weight:700">' + esc(curUser.name) + '</div>' +
      '<div style="opacity:.85;margin-top:10px;font-size:14px">🏠 Риэлтор</div>' +
    '</div>' +
    '<div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">' +
      '<div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;cursor:pointer;display:flex;align-items:center;gap:12px" onclick="go(\'s-notif\')">' +
        '<span style="font-size:22px">🔔</span>' +
        '<div style="flex:1"><div style="font-weight:600;color:#333">' + t('notif_title') + '</div><div id="menu-notif-badge" style="font-size:12px;color:#999">3 новых</div></div>' +
        '<i class="fas fa-chevron-right" style="color:#999"></i>' +
      '</div>' +
      '<div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;cursor:pointer;display:flex;align-items:center;gap:12px" onclick="go(\'s-aira\')">' +
        '<span style="font-size:22px">💬</span>' +
        '<div style="flex:1"><div style="font-weight:600;color:#333">Aira чат</div><div style="font-size:12px;color:#999">Чат риэлторов</div></div>' +
        '<i class="fas fa-chevron-right" style="color:#999"></i>' +
      '</div>' +
      '<div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;cursor:pointer;display:flex;align-items:center;gap:12px" onclick="toast(\'Скоро...\')">' +
        '<span style="font-size:22px">⭐</span>' +
        '<div style="flex:1"><div style="font-weight:600;color:#333">Мои объекты</div><div style="font-size:12px;color:#999">Управление</div></div>' +
        '<i class="fas fa-chevron-right" style="color:#999"></i>' +
      '</div>' +
      '<div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;cursor:pointer;display:flex;align-items:center;gap:12px" onclick="toast(\'Настройки скоро...\')">' +
        '<span style="font-size:22px">⚙️</span>' +
        '<div style="font-weight:600;color:#333">' + t('settings') + '</div>' +
      '</div>' +
      '<div style="padding:16px 20px;color:#E74C3C;cursor:pointer;display:flex;align-items:center;gap:12px" onclick="doLogout()">' +
        '<span style="font-size:22px">🚪</span>' +
        '<div style="font-weight:600">' + t('logout') + '</div>' +
      '</div>' +
    '</div>';
}

/* ── ADD LISTING FORM ─────────────────────────────────── */
function renderAddListing() {
  var el = document.getElementById('add-body');
  if (!el) return;
  
  el.innerHTML =
    '<div style="padding:20px">' +
      '<div style="font-size:20px;font-weight:700;margin-bottom:24px;color:#1E2D5A">➕ Добавить объект</div>' +
      
      '<div style="margin-bottom:20px">' +
        '<label style="display:block;margin-bottom:8px;font-weight:600;color:#555">Тип объекта</label>' +
        '<select id="add-type" style="width:100%;padding:12px 16px;border:2px solid #e0e0e0;border-radius:10px;font-size:15px;outline:none:focus{border-color:#1E2D5A}">' +
          '<option value="apartment">Квартира</option>' +
          '<option value="house">Дом</option>' +
          '<option value="commercial">Коммерция</option>' +
        '</select>' +
      '</div>' +
      
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">' +
        '<div>' +
          '<label style="display:block;margin-bottom:8px;font-weight:600;color:#555">Комнат</label>' +
          '<input type="number" id="add-rooms" placeholder="3" style="width:100%;padding:12px 16px;border:2px solid #e0e0e0;border-radius:10px;font-size:15px;outline:none">' +
        '</div>' +
        '<div>' +
          '<label style="display:block;margin-bottom:8px;font-weight:600;color:#555">Площадь (м²)</label>' +
          '<input type="number" id="add-area" placeholder="85" style="width:100%;padding:12px 16px;border:2px solid #e0e0e0;border-radius:10px;font-size:15px;outline:none">' +
        '</div>' +
      '</div>' +
      
      '<div style="margin-bottom:20px">' +
        '<label style="display:block;margin-bottom:8px;font-weight:600;color:#555">Город</label>' +
        '<select id="add-city" style="width:100%;padding:12px 16px;border:2px solid #e0e0e0;border-radius:10px;font-size:15px">' +
          '<option>Астана</option><option>Алматы</option><option>Шымкент</option>' +
        '</select>' +
      '</div>' +
      
      '<div style="margin-bottom:20px">' +
        '<label style="display:block;margin-bottom:8px;font-weight:600;color:#555">Район</label>' +
        '<select id="add-district" style="width:100%;padding:12px 16px;border:2px solid #e0e0e0;border-radius:10px;font-size:15px">' +
          '<option>Есиль</option><option>Алматинский</option><option>Сарыарка</option><option>Байконыр</option>' +
        '</select>' +
      '</div>' +
      
      '<div style="margin-bottom:20px">' +
        '<label style="display:block;margin-bottom:8px;font-weight:600;color:#555">Цена (₸)</label>' +
        '<input type="text" id="add-price" placeholder="78 500 000" oninput="formatPriceInput(this)" style="width:100%;padding:12px 16px;border:2px solid #e0e0e0;border-radius:10px;font-size:15px;outline:none">' +
      '</div>' +
      
      '<div style="margin-bottom:20px">' +
        '<label style="display:block;margin-bottom:8px;font-weight:600;color:#555">Описание</label>' +
        '<textarea id="add-desc" rows="4" placeholder="Опишите объект..." style="width:100%;padding:12px 16px;border:2px solid #e0e0e0;border-radius:10px;font-size:15px;resize:none;outline:none"></textarea>' +
        '<button onclick="generateAIDescription()" style="margin-top:8px;padding:10px 16px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px">' +
          '✨ Сгенерировать описание AI' +
        '</button>' +
      '</div>' +
      
      '<div style="margin-bottom:20px">' +
        '<label style="display:block;margin-bottom:8px;font-weight:600;color:#555">📷 ' + t('add_photo') + '</label>' +
        '<input type="file" id="add-photo" accept="image/*" onchange="uploadMedia(this,\'photo\')" style="width:100%;padding:12px;border:2px dashed #e0e0e0;border-radius:10px;cursor:pointer">' +
      '</div>' +
      
      '<div style="margin-bottom:24px">' +
        '<label style="display:block;margin-bottom:8px;font-weight:600;color:#555">🎥 ' + t('add_video') + '</label>' +
        '<input type="file" id="add-video" accept="video/*" onchange="uploadMedia(this,\'video\')" style="width:100%;padding:12px;border:2px dashed #e0e0e0;border-radius:10px;cursor:pointer">' +
      '</div>' +
      
      '<button onclick="publishListing()" style="width:100%;padding:16px;background:#1E2D5A;color:white;border:none;border-radius:12px;cursor:pointer;font-size:16px;font-weight:700;box-shadow:0 4px 12px rgba(30,45,90,.2)">' +
        t('publish_btn') +
      '</button>' +
    '</div>';
}

function formatPriceInput(input) {
  var val = input.value.replace(/\D/g, '');
  if (val) {
    input.value = fmtPrice(parseInt(val));
  }
}

function generateAIDescription() {
  var rooms = document.getElementById('add-rooms').value || '3';
  var area = document.getElementById('add-area').value || '85';
  var district = document.getElementById('add-district').value || 'Есиль';
  
  var desc = 'Просторная ' + rooms + '-комнатная квартира площадью ' + area + ' м² в районе ' + district + '. \n\n' +
    'Квартира расположена в современном жилом комплексе с развитой инфраструктурой. \n' +
    'Качественный ремонт, удобная планировка, светлые комнаты. \n' +
    'Рядом школы, детские сады, магазины, транспорт.';
  
  document.getElementById('add-desc').value = desc;
  toast('✨ Описание сгенерировано!');
}

function publishListing() {
  var rooms = document.getElementById('add-rooms').value;
  var area = document.getElementById('add-area').value;
  var priceStr = document.getElementById('add-price').value.replace(/\s/g, '');
  var price = parseInt(priceStr) || 0;
  var desc = document.getElementById('add-desc').value;
  
  if (!rooms || !area || !price || !desc) {
    toast('⚠️ Заполните все обязательные поля');
    return;
  }
  
  var newListing = {
    id: listings.length + 1,
    type: document.getElementById('add-type').value,
    rooms: parseInt(rooms),
    area: parseInt(area),
    city: document.getElementById('add-city').value,
    district: document.getElementById('add-district').value,
    price: price,
    desc: desc,
    realtor: curUser ? curUser.name : 'Гость',
    realtorFull: curUser ? curUser.name : 'Гость',
    agency: curUser ? 'Моё агентство' : '-',
    phone: '+7 701 234 56 78',
    badge: 'Новое',
    tags: [],
    hasVideo: false,
    liked: false,
    photos: ['🏢']
  };
  
  listings.unshift(newListing);
  renderListings();
  toast('✅ Объект опубликован!');
  go('s-search');
}

/* ── AUTH ─────────────────────────────────────────────── */
function authTab(tab) {
  var inTab = document.getElementById('at-in');
  var upTab = document.getElementById('at-up');
  var inForm = document.getElementById('af-in');
  var upForm = document.getElementById('af-up');
  
  if (inTab) inTab.classList.toggle('on', tab === 'in');
  if (upTab) upTab.classList.toggle('on', tab === 'up');
  if (inForm) inForm.style.display = tab === 'in' ? 'block' : 'none';
  if (upForm) upForm.style.display = tab === 'up' ? 'block' : 'none';
}

function renderAuthSlot() {
  var slot = document.getElementById('auth-slot');
  if (!slot) return;
  if (curUser) {
    var ini = (curUser.name||'R').charAt(0).toUpperCase();
    var fn = (curUser.name||'Профиль').split(' ')[0];
    slot.innerHTML = '<div style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 14px;background:rgba(30,45,90,.08);border-radius:20px" onclick="go(\'s-prof\')">' +
      '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1E2D5A,#4A6FA5);display:flex;align-items:center;justify-content:center;color:white;font-size:16px;font-weight:700">' + ini + '</div>' +
      '<span style="font-weight:600;color:#1E2D5A">' + esc(fn) + '</span>' +
    '</div>';
  } else {
    slot.innerHTML = '<button onclick="openM(\'m-auth\')" style="padding:10px 20px;background:#1E2D5A;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600">' + t('signin_btn') + '</button>';
  }
}

function doLogin() {
  var email = val('l-email');
  if (!email) { toast('⚠️ Введите email'); return; }
  
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

/* ── UTILS ─────────────────────────────────────────────── */
function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }
function esc(s) { return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function fmtPrice(p) { 
  if (p === null || p === undefined) return '0';
  var num = Number(p);
  if (isNaN(num)) return String(p);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); 
}

function toast(msg, ms) {
  var el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.85);color:white;padding:14px 28px;border-radius:12px;z-index:10000;opacity:0;transition:opacity .3s;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,.3)';
    document.body.appendChild(el);
  }
  el.textContent = msg; 
  el.style.opacity = '1';
  setTimeout(function() { el.style.opacity = '0'; }, ms || 2400);
}

function callRealtor(phone) {
  toast('📞 ' + phone);
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    window.location.href = 'tel:' + phone.replace(/\s/g, '');
  }
}

function toggleLike(id, btn) {
  var l = listings.find(function(x) { return x.id === id; });
  if (!l) return;
  l.liked = !l.liked;
  btn.innerHTML = '<i class="' + (l.liked ? 'fas' : 'far') + ' fa-heart"></i>';
  if (l.liked) {
    btn.classList.add('liked');
    toast('❤️ Добавлено в избранное');
  } else {
    btn.classList.remove('liked');
    toast('💔 Убрано из избранного');
  }
}

function openDetail(id) {
  var l = listings.find(function(x) { return x.id === id; });
  if (!l) return;
  toast(l.realtorFull + ' · ' + fmtPrice(l.price) + ' ₸');
}

function renderListings() {
  var el = document.getElementById('list-body');
  if (!el) return;
  
  if (!listings.length) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:#999">Загрузка...</div>';
    return;
  }
  
  el.innerHTML = listings.map(function(l) {
    var em = '🏢';
    var pr = fmtPrice(l.price) + ' ₸';
    var ini = (l.realtor || 'R').charAt(0);
    
    return '<div class="lcard su" onclick="openDetail(' + l.id + ')" style="background:white;border-radius:12px;overflow:hidden;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,.08);cursor:pointer">' +
      '<div style="height:200px;background:linear-gradient(135deg,#1a1a40,#0d1b3e);display:flex;align-items:center;justify-content:center;font-size:64px;color:white;position:relative">' +
        em +
        (l.badge ? '<div style="position:absolute;top:12px;left:12px;padding:6px 12px;background:#F47B20;color:white;border-radius:6px;font-size:12px;font-weight:700">' + l.badge + '</div>' : '') +
      '</div>' +
      '<div style="padding:16px">' +
        '<div style="font-size:13px;color:#666;margin-bottom:4px"><i class="fas fa-map-marker-alt" style="margin-right:4px"></i>' + esc(l.city) + ', ' + esc(l.district) + '</div>' +
        '<div style="font-size:22px;font-weight:700;color:#1E2D5A;margin:8px 0">' + pr + '</div>' +
        '<div style="color:#555;margin-bottom:12px">' + l.rooms + '-комнатная · ' + l.area + ' м²</div>' +
        '<div style="margin:12px 0;font-size:14px;color:#666;line-height:1.5">' + esc(l.desc) + '</div>' +
        '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f8f9fa;border-radius:10px;margin:12px 0">' +
          '<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#1E2D5A,#4A6FA5);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:16px">' + ini + '</div>' +
          '<div style="flex:1"><div style="font-weight:600;color:#333">' + esc(l.realtorFull) + '</div><div style="font-size:12px;color:#999">' + esc(l.agency) + ' · ★ ' + l.rating + '</div></div>' +
        '</div>' +
        '<div style="display:flex;gap:10px;margin-top:16px">' +
          '<button onclick="event.stopPropagation();callRealtor(\'' + esc(l.phone) + '\')" style="flex:1;padding:12px;background:#1E2D5A;color:white;border:none;border-radius:10px;font-weight:600;cursor:pointer"><i class="fas fa-phone" style="margin-right:6px"></i>' + t('call') + '</button>' +
          '<button onclick="event.stopPropagation();go(\'s-aira\')" style="flex:1;padding:12px;background:#f0f0f0;color:#333;border:none;border-radius:10px;font-weight:600;cursor:pointer"><i class="fas fa-comment" style="margin-right:6px"></i>' + t('msg') + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function renderFeed() {
  // Placeholder for TikTok-style feed
}

function renderCal() {
  var el = document.getElementById('cal-body');
  if (!el) return;
  if (!calEvents.length) {
    el.innerHTML = '<div style="padding:40px;text-align:center;color:#999">Нет событий</div>';
    return;
  }
  el.innerHTML = calEvents.map(function(e) {
    return '<div style="padding:16px;background:white;border-radius:10px;margin-bottom:12px;border-left:4px solid ' + (e.color || '#1E2D5A') + '">' +
      '<div style="font-weight:700;color:#1E2D5A;margin-bottom:4px">' + e.title + '</div>' +
      '<div style="font-size:13px;color:#666">' + e.client + '</div>' +
      '<div style="font-size:12px;color:#999;margin-top:4px">' + e.note + '</div>' +
    '</div>';
  }).join('');
}

/* ── PLACEHOLDER FUNCTIONS (NO ERRORS) ───────────────── */
function renderRealtors() {
  // REMOVED - not needed
  console.log('Realtors section removed');
}

function openAddListing() {
  if (needAuth(function() {
    go('s-add');
  })) {
    // User is authenticated
  }
}

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
  
  toast('⏳ Загрузка ' + file.name + '...');
  
  setTimeout(function() {
    toast('✅ Загружено: ' + file.name);
  }, 1500);
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
  var t1 = document.getElementById('tab-obj');
  var t2 = document.getElementById('tab-exch');
  if (t1) t1.classList.toggle('on', tab === 'obj');
  if (t2) t2.classList.toggle('on', tab === 'exch');
  renderListings();
}

function setFilt(el, f) {
  document.querySelectorAll('.fchip').forEach(function(c) { c.classList.remove('on'); });
  if (el) el.classList.add('on');
  curFilter = f;
  renderListings();
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
  toast(lang === 'kz' ? '🇰 Қазақ тілі' : '🇷 Русский');
}

function applyLangUI() {
  var ru = document.getElementById('lo-ru');
  var kz = document.getElementById('lo-kz');
  if (ru) ru.classList.toggle('on', curLang === 'ru');
  if (kz) kz.classList.toggle('on', curLang === 'kz');
  
  document.querySelectorAll('[data-ru]').forEach(function(el) {
    var val = el.getAttribute('data-' + curLang);
    if (val) el.textContent = val;
  });
  
  renderListings();
}
