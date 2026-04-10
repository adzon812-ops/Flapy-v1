/* ═══════════════════════════════════════════════════════════
   FLAPY  app.js  v5.2  — Исправления:
   - TikTok вместо YouTube
   - Удален Flai чат
   - Исправлена загрузка
═══════════════════════════════════════════════════════════ */

/* ── STATE ─────────────────────────────────────────────── */
var listings   = [];
var calEvents   = [];
var realtors   = [];
var curUser     = null;
var curFilter   = 'all';
var curLang     = 'ru';
var listTab     = 'obj';
var curStar     = 0;
var curHireId   = null;
var curReplyId  = null;

/* УДАЛЕНО: var flaiBadge = 2; */

/* ── TRANSLATIONS ──────────────────────────────────────── */
var T = {
  ru: {
    tagline:        'Ваш умный помощник на рынке жилья',
    tab_obj:        'Объекты',  tab_exch: 'Обмен',
    filt_all:       'Все',  filt_apt: 'Квартиры',  filt_house: 'Дома',
    filt_comm:      'Коммерция',  filt_video: '🎬 Видео',
    call:           'Позвонить',  msg: 'Написать',
    /* УДАЛЕНО: flai_sub, flai_status */
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
    chip_desc:      '✍️ Описание',  chip_mortgage: '🏦 Ипотека',
    chip_promo:     '📢 Продвижение',  chip_tax: '💡 Налоги',
    chip_show:      '📅 Показ',  chip_val: '💰 Оценка',  chip_exch: '🔄 Обмен',
    /* УДАЛЕНО: flai_welcome, flai_news */
    nav_obj:        'Объекты',  nav_feed: 'Лента',  nav_more: 'Ещё',
    hire_btn:       '🤝 Нанять',
    hire_title:     'Нанять риэлтора',
    choose_realtor: 'Выберите риэлтора для вашего объекта',
    rate_title:     'Оставить отзыв',
    exch_title:     '🔄 Предложить обмен',
    rooms:          'Комнат',  area: 'Площадь м²',  district: 'Район',
    deals_label:    'сделок',  reviews_label: 'отзывов',
  },
  kz: {
    tagline:        'Жылжымайтын мүлік нарығындағы ақылды көмекшіңіз',
    tab_obj:        'Объектілер',  tab_exch: 'Айырбас',
    filt_all:       'Барлығы',  filt_apt: 'Пәтерлер',  filt_house: 'Үйлер',
    filt_comm:      'Коммерция',  filt_video: '🎬 Бейне',
    call:           'Қоңырау',  msg: 'Жазу',
    /* УДАЛЕНО: flai_sub, flai_status */
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
    chip_desc:      '✍️ Сипаттама',  chip_mortgage: '🏦 Несие',
    chip_promo:     '📢 Жылжыту',  chip_tax: '💡 Салықтар',
    chip_show:      '📅 Көрсету',  chip_val: '💰 Баға',  chip_exch: '🔄 Айырбас',
    /* УДАЛЕНО: flai_welcome, flai_news */
    nav_obj:        'Объект',  nav_feed: 'Лента',  nav_more: 'Тағы',
    hire_btn:       '🤝 Жалдау',
    hire_title:     'Риэлторды жалдау',
    choose_realtor: 'Объектіңіз үшін риэлтор таңдаңыз',
    rate_title:     'Пікір қалдыру',
    exch_title:     '🔄 Айырбас ұсыну',
    rooms:          'Бөлмелер',  area: 'Ауданы м²',  district: 'Аудан',
    deals_label:    'мәміле',  reviews_label: 'пікір',
  }
};

function t(key) { return (T[curLang] && T[curLang][key]) || (T.ru[key] || key); }

/* ── BOOT ──────────────────────────────────────────────── */
window.addEventListener('load', function () {
  try { var s = localStorage.getItem('fp_user'); if (s) curUser = JSON.parse(s); } catch(e){}
  var th = localStorage.getItem('fp_theme') || 'light';
  applyTheme(th);
  curLang = localStorage.getItem('fp_lang') || 'ru';
  applyLangUI();
  if (curUser) renderAuthSlot();
  updateNavVisibility();
  
  /* ИСПРАВЛЕНО: Добавлена проверка существования элементов */
  setTimeout(function () {
    var ld = document.getElementById('loader');
    if (ld) { 
      ld.style.opacity = '0'; 
      setTimeout(function(){ ld.style.display = 'none'; }, 320); 
    }
    fetchListings();
    fetchCalendar();
  }, 1200);
});

window.addEventListener('DOMContentLoaded', function () {
  var ns = document.getElementById('n-search');
  if (ns) ns.classList.add('on');
  updateAiraBadge();
});

/* ── НАВИГАЦИЯ ────────────────────────────────────────── */
function updateNavVisibility() {
  var moreBtn = document.getElementById('n-more');
  if (moreBtn) {
    if (curUser) {
      moreBtn.style.display = 'flex';
    } else {
      moreBtn.style.display = 'none';
    }
  }
  
  /* УДАЛЕНО: Скрыта кнопка Flai AI
  var flaiBtn = document.getElementById('n-flai');
  if (flaiBtn) flaiBtn.style.display = 'none';
  */
}

/* ... остальные функции ... */

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
  var rm = l.rooms ? l.rooms+'к · ' : '';
  var ini = (l.realtor || 'R').charAt(0);
  var bgs = { apartment:'135deg,#1a1a40,#0d1b3e', house:'135deg,#1a2e1a,#0d2010', commercial:'135deg,#2e1a0d,#1a0d05', land:'135deg,#1a2e2e,#0d2020' };
  var bg = bgs[l.type] || bgs.apartment;
  var tags = (l.tags||[]).map(function(tg){ return '<span class="fc-chip'+(tg==='Обмен'?' exch':'')+'">'+tg+'</span>'; }).join('');
  var vbadge = l.hasVideo ? '<div class="fc-vbadge"><i class="fas fa-play-circle"></i> Видео</div>' : '';
  var exbadge = l.exchange ? '<div class="fc-exbadge">🔄 Обмен</div>' : '';
  
  var mediaHtml;
  if (l.hasVideo && l.videoId) {
    /* ИСПРАВЛЕНО: TikTok вместо YouTube */
    var videoUrl = '';
    if (l.videoId.startsWith('http')) {
      videoUrl = l.videoId;
    } else {
      videoUrl = 'https://tiktok.com/@user/video/' + l.videoId;
    }
    
    mediaHtml =
      '<div class="fc-video" id="fv-'+l.id+'">' +
        '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.4);cursor:pointer" onclick="window.open(\''+videoUrl+'\',\'_blank\')">' +
          '<div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:24px;color:#000;margin-bottom:6px"><i class="fab fa-tiktok"></i></div>' +
        '</div>' +
        '<div class="fc-bg">'+em+'</div>' +
      '</div>';
  } else {
    mediaHtml = '<div class="fc-bg">'+em+'</div>';
  }
  
  return (
    '<div class="fcard" style="background:linear-gradient('+bg+')" id="fc-'+l.id+'">' +
    mediaHtml +
    '<div class="fc-overlay"></div>' +
    vbadge + exbadge +
    '<div class="fc-side">' +
      '<div class="sab"><button class="sab-btn '+(l.liked?'liked':'')+'" id="hrt-'+l.id+'" onclick="toggleLike('+l.id+',this)"><i class="'+(l.liked?'fas':'far')+' fa-heart"></i></button><span class="sab-lbl">'+(l.liked?1:0)+'</span></div>' +
      '<div class="sab"><button class="sab-btn" onclick="openDetail('+l.id+')"><i class="fas fa-info-circle"></i></button><span class="sab-lbl">Детали</span></div>' +
      '<div class="sab"><button class="sab-btn" onclick="go(\'s-aira\');nav(document.getElementById(\'n-aira\'))"><i class="fas fa-comment"></i></button><span class="sab-lbl">Чат</span></div>' +
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
        '<div><div class="fc-r-name">'+esc(l.realtor||'')+'</div><div class="fc-r-sub">'+esc(l.agency||'')+'</div></div>' +
        '<button class="fc-r-btn" onclick="openDetail('+l.id+')">Подробнее</button>' +
      '</div>' +
    '</div>' +
    '</div>'
  );
}

/* ... остальные функции ... */

/* ── ADD LISTING ───────────────────────────────────────── */
function openAddListing() { 
  if (!curUser) {
    toast('🔐 Войдите как риэлтор');
    openM('m-auth');
    return;
  }
  openM('m-add'); 
}

function uploadMedia(type) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = type === 'photo' ? 'image/*' : 'video/*';
  input.multiple = type === 'photo';
  input.onchange = function() {
    if (!input.files.length) return;
    if (type === 'photo') {
      toast('📷 '+input.files.length+' фото добавлено');
    } else {
      toast('🎬 Видео добавлено ('+input.files[0].name+')');
      var videoUrl = document.getElementById('a-video');
      if (videoUrl) videoUrl.value = 'local:'+input.files[0].name;
    }
  };
  input.click();
}

function submitListing() {
  var type   = val('a-type')     || 'apartment';
  var area   = val('a-area');
  var price  = val('a-price');
  var videoU = val('a-video');
  
  if (!area || isNaN(parseInt(area))) { toast('⚠️ Укажите площадь'); return; }
  if (!price || isNaN(parseInt(price))) { toast('⚠️ Укажите цену'); return; }
  
  /* ИСПРАВЛЕНО: TikTok URL вместо YouTube ID */
  var videoId = '';
  if (videoU) {
    if (videoU.includes('tiktok.com')) {
      videoId = videoU;
    } else if (videoU.startsWith('local:')) {
      videoId = videoU;
    } else {
      videoId = 'https://tiktok.com/@user/video/' + videoU;
    }
  }
  
  var rooms = parseInt(val('a-rooms')) || 0;
  var rName = curUser ? (curUser.name||'Мой объект') : 'Мой объект';
  var newL = {
    id:           Date.now(),
    type:        type,
    rooms:       rooms,
    area:         parseInt(area),
    district:     val('a-district') || 'Есиль',
    city:         val('a-city')     || 'Астана',
    price:        parseInt(price),
    exchange:    (document.getElementById('a-exch')||{}).checked || false,
    hasVideo:    !!videoId,
    videoId:     videoId,
    realtor:      rName.split(' ').slice(0,2).map(function(w,i){ return i===0?w:w.charAt(0)+'.'; }).join(' '),
    realtorFull:  rName,
    realtorId:    curUser ? curUser.id : 'u_new',
    rating:       curUser ? (curUser.rating||5.0) : 5.0,
    deals:        curUser ? (curUser.deals||0) : 0,
    agency:       curUser ? (curUser.agency||'Самозанятый') : 'Самозанятый',
    tags:        [val('a-rooms')+'к', type==='house'?'Дом':'Квартира'],
    badge:       'Новое',
    desc:         val('a-desc') || 'Новый объект. Подробности по запросу.',
    photos:      ['🛋️','🚿','🪟'],
  };
  
  listings.unshift(newL);
  renderListings(); 
  renderFeed();
  closeM('m-add');
  
  /* Reset form */
  ['a-area','a-price','a-desc','a-video'].forEach(function(id){ 
    var e = document.getElementById(id); 
    if(e) e.value = ''; 
  });
  
  var w = document.getElementById('ai-box-wrap'); 
  if(w) w.style.display = 'none';
  
  toast('🚀 Объект опубликован! Цена: '+fmtPrice(parseInt(price))+' ₸');
  
  /* Post to Aira */
  if (curUser) {
    setTimeout(function(){
      addAiraThread('🏠 Новый объект: '+(rooms?rooms+'к ':'')+(type==='apartment'?'квартира':type==='house'?'дом':'коммерция')+', '+val('a-district')+', '+fmtPrice(parseInt(price))+' ₸', 'listing');
    }, 800);
  }
}

/* ... остальные функции без изменений ... */
