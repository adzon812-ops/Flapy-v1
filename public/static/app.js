/* ═══════════════════════════════════════════════════════════
   FLAPY app.js v6.1 — FIXED ALL ERRORS
   - Добавлены missing функции: uploadMedia, needAuth, replyAira
   - Исправлено форматирование цен (разделители тысяч)
   - Улучшены описания объектов
   - Исправлен счетчик уведомлений
   - Удалены лишние пункты меню
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
  {id: 1, from: 'Aira', text: 'Данияр М. ответил на ваш объект — есть покупатель!', time: '10 мин назад', read: false}
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
  updateNotificationsCount(); // FIX: Update notification count

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

/* ── NAVIGATION & UI LOGIC (FIXED) ─────────────────────── */
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
  if (id === 's-notif') renderNotifications(); // FIX: Render notifications
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

/* ── FALLBACK DATA (IMPROVED DESCRIPTIONS) ─────────────── */
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
      photos:['🛋️',''],
      phone:'+7 702 345 67 89'
    },
    {
      id:3,
      type:'house',
      rooms:5,
      area:220,
      district:'Алматинский',
      city:'Астана',
      price:150000000,
      exchange:true,
      hasVideo:false,
      realtor:'Сауле Т.',
      realtorId:'r3',
      realtorFull:'Сауле Тлеубекова',
      rating:4.8,
      deals:56,
      agency:'Royal Group',
      tags:['Обмен'],
      badge:'Обмен',
      desc:'Дом с участком 10 соток. Гараж на 2 машины, баня. 5 комнат, 2 санузла. Все коммуникации центральные. Ремонт 2023 года. Участок landscaped, плодовые деревья. Тихий район.',
      photos:['🏡'],
      phone:'+7 705 456 78 90'
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
  var badge = document.getElementById('notif-badge');
  var menuBadge = document.getElementById('menu-notif-badge');
  
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }
  
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
    return '<div class="notif-item' + (n.read ? '' : ' unread') + '">' +
      '<div class="notif-icon">💬</div>' +
      '<div class="notif-content">' +
        '<div class="notif-from"><b>' + n.from + ':</b> ' + n.text + '</div>' +
        '<div class="notif-time">' + n.time + '</div>' +
      '</div>' +
      '<button class="notif-reply" onclick="replyToNotification(' + n.id + ')">Ответить</button>' +
    '</div>';
  }).join('');
}

function replyToNotification(id) {
  var notif = notifications.find(function(n) { return n.id === id; });
  if (!notif) return;
  
  // Mark as read
  notif.read = true;
  updateNotificationsCount();
  
  // Go to Aira chat
  go('s-aira');
  toast('✍️ Открыт чат для ответа');
}

/* ── FEED (TikTok style) ───────────────────────────────── */
var EM = { apartment:'🏢', house:'🏡', commercial:'🏪', land:'🌳' };
var videoPlaying = {};

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
  var tags = (l.tags||[]).map(function(tg){ return '<span class="fc-chip'+(tg==='Обмен'?' exch':'')+'">'+tg+'</span>'; }).join('');
  var vbadge = l.hasVideo ? '<div class="fc-vbadge"><i class="fas fa-play-circle"></i> Видео</div>' : '';
  var exbadge = l.exchange ? '<div class="fc-exbadge">🔄 Обмен</div>' : '';
  
  var mediaHtml;
  if (l.hasVideo && l.videoId) {
    mediaHtml = '<div class="fc-video" id="fv-'+l.id+'">' +
      '<img src="https://img.youtube.com/vi/'+l.videoId+'/hqdefault.jpg" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.style.display=\'none\'">' +
      '<div class="fc-video-tap" onclick="playFeedVideo('+l.id+',\''+l.videoId+'\')"></div>' +
      '<div class="fc-play-center" id="fpc-'+l.id+'" onclick="playFeedVideo('+l.id+',\''+l.videoId+'\')"><i class="fas fa-play" style="margin-left:3px"></i></div>' +
    '</div>';
  } else {
    mediaHtml = '<div class="fc-bg">'+em+'</div>';
  }
  
  return (
    '<div class="fcard" style="background:linear-gradient('+bg+')" id="fc-'+l.id+'">' +
    mediaHtml + '<div class="fc-overlay"></div>' + vbadge + exbadge +
    '<div class="fc-side">' +
      '<div class="sab"><button class="sab-btn '+(l.liked?'liked':'')+'" onclick="toggleLike('+l.id+',this)"><i class="'+(l.liked?'fas':'far')+' fa-heart"></i></button><span class="sab-lbl">'+(l.liked?1:0)+'</span></div>' +
      '<div class="sab"><button class="sab-btn" onclick="openDetail('+l.id+')"><i class="fas fa-info-circle"></i></button><span class="sab-lbl">Детали</span></div>' +
      '<div class="sab"><button class="sab-btn" onclick="go(\'s-aira\')"><i class="fas fa-comment"></i></button><span class="sab-lbl">Чат</span></div>' +
      '<div class="sab"><button class="sab-btn" onclick="callRealtor(\''+esc(l.phone||'+7 701 234 56 78')+'\')"><i class="fas fa-phone"></i></button><span class="sab-lbl">Звонок</span></div>' +
    '</div>' +
    '<div class="fc-info">' +
      '<div class="fc-chips">'+tags+'</div>' +
      '<div class="fc-loc"><i class="fas fa-map-marker-alt"></i>'+esc(l.city)+', '+esc(l.district)+'</div>' +
      '<div class="fc-title">'+rm+(l.area||'')+' м²</div>' +
      '<div class="fc-price">'+pr+'</div>' +
      '<div class="fc-desc">'+esc(l.desc||'')+'</div>' +
      '<div class="fc-realtor">' +
        '<div class="fc-r-ava" style="background:linear-gradient(135deg,#1E2D5A,#4A6FA5)">'+ini+'</div>' +
        '<div><div class="fc-r-name">'+esc(l.realtor||'')+'</div><div class="fc-r-sub">★ '+l.rating+' · '+esc(l.agency||'')+'</div></div>' +
        '<button class="fc-r-btn" onclick="openDetail('+l.id+')">Подробнее</button>' +
      '</div>' +
    '</div>' +
    '</div>'
  );
}

function playFeedVideo(id, videoId) {
  var container = document.getElementById('fv-'+id);
  var playBtn = document.getElementById('fpc-'+id);
  if (!container) return;
  if (videoPlaying[id]) {
    container.querySelector('iframe') && container.querySelector('iframe').remove();
    var img = container.querySelector('img');
    if (img) img.style.display = '';
    if (playBtn) playBtn.style.display = '';
    videoPlaying[id] = false;
    return;
  }
  var img = container.querySelector('img');
  if (img) img.style.display = 'none';
  if (playBtn) playBtn.style.display = 'none';
  var iframe = document.createElement('iframe');
  iframe.src = 'https://www.youtube.com/embed/'+videoId+'?autoplay=1&mute=1&controls=1&rel=0';
  iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none';
  iframe.allow = 'autoplay';
  container.appendChild(iframe);
  videoPlaying[id] = true;
}

/* ── LISTINGS (Kaspi style) ────────────────────────────── */
function setListTab(tab) {
  listTab = tab;
  var t1 = document.getElementById('tab-obj');
  var t2 = document.getElementById('tab-exch');
  if (t1) t1.classList.toggle('on', tab==='obj');
  if (t2) t2.classList.toggle('on', tab==='exch');
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
  var badgeColor = { Горящее:'#E74C3C',Топ:'#27AE60',Обмен:'#9B59B6'}[l.badge] || '#F47B20';
  var rcol = l.realtorColor || '#1E2D5A';
  
  var mediaHtml;
  if (l.hasVideo && l.videoId) {
    mediaHtml = '<div class="lcard-media" style="cursor:pointer" onclick="event.stopPropagation();openDetail('+l.id+')">' +
      '<img src="https://img.youtube.com/vi/'+l.videoId+'/mqdefault.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.parentNode.querySelector(\'.lcard-em\').style.display=\'flex\';this.style.display=\'none\'">' +
      '<div class="lcard-em" style="display:none">'+em+'</div>' +
      '<div class="video-thumb"><div class="video-play"><i class="fas fa-play" style="margin-left:3px"></i></div><div class="video-lbl">Видео-тур</div></div>' +
      '<div class="lcard-badge" style="background:'+badgeColor+'">'+(l.badge||'')+'</div>' +
    '</div>';
  } else {
    mediaHtml = '<div class="lcard-media" onclick="openDetail('+l.id+')"><div class="lcard-em">'+em+'</div><div class="lcard-badge" style="background:'+badgeColor+'">'+(l.badge||'')+'</div></div>';
  }
  
  return (
    '<div class="lcard su" onclick="openDetail('+l.id+')">' +
    mediaHtml +
    '<div class="lcard-body">' +
      '<div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>'+esc(l.city)+', '+esc(l.district)+'</div>' +
      '<div class="lcard-price">'+pr+' ₸</div>' +
      '<div class="lcard-sub">'+rm+l.area+' м²'+(l.exchange?' · 🔄 Обмен':'')+'</div>' +
      '<div class="lcard-tags">'+(l.tags||[]).map(function(tg){ return '<span class="ltag'+(tg==='Обмен'?' exch':'')+'">'+tg+'</span>'; }).join('')+'</div>' +
      '<div class="lcard-footer">' +
        '<div class="lf-ava" style="background:'+rcol+'">'+ini+'</div>' +
        '<div class="lf-name">'+esc(l.realtorFull||l.realtor||'')+' · '+esc(l.agency||'')+'</div>' +
      '</div>' +
      '<div class="lcard-cta">' +
        '<button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\''+esc(l.phone||'+7 701 234 56 78')+'\')"><i class="fas fa-phone"></i> '+t('call')+'</button>' +
        '<button class="cta-btn cta-msg" onclick="event.stopPropagation();go(\'s-aira\')"><i class="fas fa-comment"></i> '+t('msg')+'</button>' +
      '</div>' +
    '</div></div>'
  );
}

/* ── DETAIL MODAL ──────────────────────────────────────── */
function openDetail(id) {
  var l = listings.find(function(x){ return x.id === id; });
  if (!l) return;
  
  var em = EM[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) : 'По договору';
  
  var visualHtml;
  if (l.hasVideo && l.videoId) {
    visualHtml = '<div class="det-visual" style="position:relative">' +
      '<img id="det-yt-thumb-'+l.id+'" src="https://img.youtube.com/vi/'+l.videoId+'/hqdefault.jpg" style="width:100%;height:100%;object-fit:cover">' +
      '<div id="det-yt-play-'+l.id+'" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.4);cursor:pointer" onclick="playDetailVideo('+l.id+',\''+l.videoId+'\')">' +
        '<div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:22px;color:#1E2D5A;margin-bottom:6px"><i class="fas fa-play" style="margin-left:3px"></i></div>' +
        '<div style="color:#fff;font-size:12px;font-weight:600">Смотреть видео-тур</div>' +
      '</div>' +
      '<div id="det-yt-frame-'+l.id+'" style="display:none;position:absolute;inset:0"></div>' +
    '</div>';
  } else {
    visualHtml = '<div class="det-visual"><div class="det-em-bg">'+em+'</div></div>';
  }

  var body = document.getElementById('m-det-body');
  if(!body) return;
  
  body.innerHTML = '<div class="sh-handle"></div>' + visualHtml +
    '<div class="det-price">'+pr+' ₸</div>' +
    '<div class="det-desc">'+(l.desc||'').replace(/\n/g,'<br>')+'</div>' +
    '<div class="det-cta">' +
      '<button class="det-btn det-call" onclick="callRealtor(\''+(l.phone||'+7 701 234 56 78')+'\')"><i class="fas fa-phone"></i> Позвонить</button>' +
      '<button class="det-btn det-chat" onclick="closeM(\'m-det\');go(\'s-aira\')"><i class="fas fa-comment"></i> Написать</button>' +
    '</div>';
  openM('m-det');
}

function playDetailVideo(id, videoId) {
  var frame = document.getElementById('det-yt-frame-'+id);
  if (!frame) return;
  document.getElementById('det-yt-thumb-'+id).style.display = 'none';
  document.getElementById('det-yt-play-'+id).style.display = 'none';
  frame.style.display = 'block';
  frame.innerHTML = '<iframe src="https://www.youtube.com/embed/'+videoId+'?autoplay=1&controls=1&rel=0" style="width:100%;height:100%;border:none" allow="autoplay" allowfullscreen></iframe>';
}

/* ── AIRA CHAT (FIXED - ADDED replyAira) ───────────────── */
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
  toast('✅ Отправлено');
}

// FIX: Added missing replyAira function
function replyAira(messageId) {
  if (!curUser) {
    toast('🔐 Сначала войдите');
    openM('m-auth');
    return;
  }
  
  var msg = document.getElementById('msg-'+messageId);
  if (msg) {
    var author = msg.getAttribute('data-author');
    var inp = document.getElementById('aira-inp');
    if (inp && author) {
      inp.value = '@'+author+' ';
      inp.focus();
    }
  }
  toast('✍️ Введите ответ');
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

/* ── UPLOAD MEDIA (FIXED - ADDED MISSING FUNCTION) ────── */
function uploadMedia(input, type) {
  if (!input || !input.files || !input.files[0]) {
    toast('⚠️ Файл не выбран');
    return;
  }
  
  var file = input.files[0];
  var maxSize = type === 'video' ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for video, 10MB for photo
  
  if (file.size > maxSize) {
    toast('⚠️ Файл слишком большой (макс. ' + (maxSize / 1024 / 1024) + 'MB)');
    return;
  }
  
  // Check file type
  var validTypes = type === 'video' ? ['video/mp4', 'video/avi', 'video/mov'] : ['image/jpeg', 'image/png', 'image/jpg'];
  if (validTypes.indexOf(file.type) === -1) {
    toast('⚠️ Неверный формат файла');
    return;
  }
  
  toast('⏳ Загрузка...');
  
  // Simulate upload (in real app, send to server)
  setTimeout(function() {
    toast('✅ Загружено: ' + file.name);
  }, 1500);
}

/* ── AUTH CHECK (FIXED - ADDED MISSING FUNCTION) ──────── */
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

// FIX: Proper price formatting with thousand separators
function fmtPrice(p) { 
  return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); 
}

/* CALL FIX: Prevent crash on Desktop */
function callRealtor(phone) {
  toast('📞 ' + phone);
  // For mobile devices
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
