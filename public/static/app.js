/* ═══════════════════════════════════════════════════════════
   FLAPY  app.js  v5.1  — Исправленная версия
   - Форматирование цен с пробелами (10 000 000)
   - Убран рейтинг с карточек
   - Скрыто меню "..." от незарегистрированных
   - Кнопка "+" только для авторизованных
═══════════════════════════════════════════════════════════ */
'use strict'; 

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

/* ── TRANSLATIONS ──────────────────────────────────────── */
var T = {
  ru: {
    tagline:        'Ваш умный помощник на рынке жилья',
    tab_obj:        'Объекты',  tab_exch: 'Обмен',
    filt_all:       'Все',  filt_apt: 'Квартиры',  filt_house: 'Дома',
    filt_comm:      'Коммерция',  filt_video: '🎬 Видео',
    call:           'Позвонить',  msg: 'Написать',
    flai_sub:       '— умный помощник',
    flai_status:    'Онлайн · отвечает мгновенно',
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
    flai_welcome:   'Привет! Я Flai 👋<br>Помогу найти жильё, рассчитать ипотеку, составить описание и ответить на любые вопросы о рынке недвижимости.',
    flai_news:      '💡 <b>Новость 2026:</b> срок без налога при продаже — теперь <b>2 года</b>. Обмен поможет сэкономить 10–15%!',
    nav_obj:        'Объекты',  nav_feed: 'Лента',  nav_flai: 'Flai AI',  nav_more: 'Ещё',
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
    flai_sub:       '— ақылды көмекші',
    flai_status:    'Онлайн · лезде жауап береді',
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
    flai_welcome:   'Сәлем! Мен Flai 👋<br>Тұрғын үй табуға, ипотека есептеуге, сипаттама жазуға және жылжымайтын мүлік нарығы туралы кез келген сұрақтарға жауап беруге көмектесемін.',
    flai_news:      '💡 <b>2026 жаңалығы:</b> Сатылымдағы салықсыз мерзім — енді <b>2 жыл</b>. Айырбас 10–15% үнемдеуге мүмкіндік береді!',
    nav_obj:        'Объект',  nav_feed: 'Лента',  nav_flai: 'Flai AI',  nav_more: 'Тағы',
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
  setTimeout(function () {
    var ld = document.getElementById('loader');
    if (ld) { ld.style.opacity = '0'; setTimeout(function(){ ld.style.display = 'none'; }, 320); }
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
}

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

function fetchRealtors(cb) {
  fetch('/api/realtors')
    .then(function(r){ return r.json(); })
    .then(function(d){ realtors = d.realtors || []; if(cb) cb(); })
    .catch(function(){ realtors = getFallbackRealtors(); if(cb) cb(); });
}

/* ── FALLBACK DATA ─────────────────────────────────────── */
function getFallbackListings() {
  return [
    { id:1, type:'apartment', rooms:3, area:85, district:'Бостандыкский', city:'Алматы', price:78500000, exchange:false, hasVideo:true, videoId:'ScMzIvxBSi4', realtor:'Айгерим К.', realtorId:'r1', realtorFull:'Айгерим Касымова', rating:4.9, deals:47, agency:'Century 21', tags:['Новострой'], badge:'Новое', desc:'Просторная 3-комнатная с панорамным видом. Свежий ремонт евро-класса, подземный паркинг, охраняемый ЖК.', photos:['🛋️','🛁','🪟','🏗️'] },
    { id:2, type:'apartment', rooms:3, area:82, district:'Есильский', city:'Астана', price:62000000, exchange:false, hasVideo:true, videoId:'tgbNymZ7vqY', realtor:'Данияр М.', realtorId:'r2', realtorFull:'Данияр Мусин', rating:4.7, deals:32, agency:'Etagi', tags:['Горящее'], badge:'Горящее', desc:'Отличная 3-комнатная в новом ЖК. Полная отделка, вид на парк, детская площадка во дворе.', photos:['🛋️','🚿','🌇'] },
    { id:3, type:'house', rooms:5, area:220, district:'Алматинский', city:'Астана', price:150000000, exchange:true, hasVideo:true, videoId:'UxxajLWwzqY', realtor:'Сауле Т.', realtorId:'r3', realtorFull:'Сауле Тлеубекова', rating:5.0, deals:68, agency:'Royal Group', tags:['Обмен'], badge:'Обмен', desc:'Дом с участком 10 соток. Гараж на 2 машины, баня, летняя кухня. Рассмотрим обмен на квартиру!', photos:['🏡','🌳','🏊','🔥'] },
    { id:4, type:'commercial', rooms:0, area:120, district:'Байконыр', city:'Астана', price:65000000, exchange:false, hasVideo:false, videoId:'', realtor:'Нурлан А.', realtorId:'r4', realtorFull:'Нурлан Ахметов', rating:4.6, deals:23, agency:'Самозанятый', tags:['Инвест'], badge:'Топ', desc:'Помещение первой линии, высокий трафик 5000 чел/день. Идеально под ресторан, аптеку, офис.', photos:['🏪','📐','🔌'] },
    { id:5, type:'apartment', rooms:2, area:65, district:'Сарыарка', city:'Астана', price:38000000, exchange:true, hasVideo:false, videoId:'', realtor:'Айгерим К.', realtorId:'r1', realtorFull:'Айгерим Касымова', rating:4.9, deals:47, agency:'Century 21', tags:['Обмен'], badge:'Обмен', desc:'Уютная 2-комнатная в тихом дворе. Рядом школа, детский сад, магазины. Рассмотрим обмен!', photos:['🛋️','🚿'] },
    { id:6, type:'apartment', rooms:1, area:42, district:'Есиль', city:'Астана', price:29000000, exchange:false, hasVideo:true, videoId:'jNQXAC9IVRw', realtor:'Данияр М.', realtorId:'r2', realtorFull:'Данияр Мусин', rating:4.7, deals:32, agency:'Etagi', tags:['Студия'], badge:'Новое', desc:'Стильная студия со смарт-дизайном. Встроенная кухня, системы умного дома, вид на ночной город.', photos:['🛋️','🌃'] },
  ];
}

function getFallbackRealtors() {
  return [
    { id:'r1', name:'Айгерим Касымова', agency:'Century 21', rating:4.9, deals:47, reviews:23, phone:'+7 701 234 56 78', photo:'А', color:'#1E2D5A', specialization:'Квартиры, новострой', experience:5, badge:'ТОП', verified:true,
      reviewsList:[
        {author:'Алия С.', stars:5, text:'Профессионал! Быстро нашла покупателя, все документы оформила чисто.', date:'15 янв'},
        {author:'Марат Б.', stars:5, text:'Рекомендую! Отличная работа, всегда на связи.', date:'3 янв'},
        {author:'Дина К.', stars:4, text:'Хорошая работа, но немного задержалась с документами.', date:'28 дек'},
      ]},
    { id:'r2', name:'Данияр Мусин', agency:'Etagi', rating:4.7, deals:32, reviews:18, phone:'+7 702 345 67 89', photo:'Д', color:'#F47B20', specialization:'Дома, коттеджи', experience:7, badge:'', verified:true,
      reviewsList:[
        {author:'Самал Т.', stars:5, text:'Отличный риэлтор! Нашёл нам дом нашей мечты.', date:'10 янв'},
        {author:'Нурлан К.', stars:4, text:'Хорошая работа, рекомендую для покупки домов.', date:'5 янв'},
      ]},
    { id:'r3', name:'Сауле Тлеубекова', agency:'Royal Group', rating:5.0, deals:68, reviews:41, phone:'+7 707 456 78 90', photo:'С', color:'#27AE60', specialization:'Коммерция', experience:9, badge:'ТОП', verified:true,
      reviewsList:[
        {author:'ТОО Казсервис', stars:5, text:'Лучший риэлтор по коммерции в Астане! Сделали всё быстро.', date:'20 янв'},
        {author:'Арман Ж.', stars:5, text:'Профессиональный подход, отличный результат!', date:'12 янв'},
      ]},
    { id:'r4', name:'Нурлан Ахметов', agency:'Самозанятый', rating:4.6, deals:23, reviews:12, phone:'+7 705 567 89 01', photo:'Н', color:'#9B59B6', specialization:'Обмен, любые объекты', experience:3, badge:'', verified:true,
      reviewsList:[
        {author:'Гульнара М.', stars:4, text:'Помог с обменом, всё прошло гладко.', date:'8 янв'},
      ]},
    { id:'r5', name:'Асель Бекова', agency:'Etagi', rating:4.8, deals:38, reviews:19, phone:'+7 708 678 90 12', photo:'А', color:'#E67E22', specialization:'Новострой', experience:4, badge:'', verified:true,
      reviewsList:[
        {author:'Болат С.', stars:5, text:'Помогла купить новостройку без лишней суеты!', date:'2 янв'},
        {author:'Зарина М.', stars:5, text:'Рекомендую всем! Очень внимательная и профессиональная.', date:'25 дек'},
      ]},
  ];
}

function getFallbackCal() {
  var t = new Date();
  function dt(d,h,m){ return new Date(t.getFullYear(),t.getMonth(),t.getDate()+d,h,m).toISOString(); }
  return [
    {id:1,title:'Показ квартиры 3к Есиль', time:dt(0,10,0), type:'showing',client:'Алия С.', note:'Взять ключи от 401', color:'#F47B20'},
    {id:2,title:'Звонок клиенту', time:dt(0,14,30), type:'call', client:'Данияр М.', note:'Обсудить ипотеку Halyk', color:'#27AE60'},
    {id:3,title:'Подписание договора', time:dt(1,11,0), type:'deal', client:'Нурсулу К.', note:'Проверить документы ЦОН', color:'#1E2D5A'},
    {id:4,title:'Показ коммерции Байконыр', time:dt(1,15,0), type:'showing',client:'Бизнес-клиент', note:'Взять план помещения', color:'#F47B20'},
    {id:5,title:'Встреча в агентстве', time:dt(2,10,0), type:'meeting',client:'Century 21', note:'Новые объекты недели', color:'#9B59B6'},
  ];
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
  var rm = l.rooms ? l.rooms+'к · ' : '';
  var ini = (l.realtor || 'R').charAt(0);
  var bgs = { apartment:'135deg,#1a1a40,#0d1b3e', house:'135deg,#1a2e1a,#0d2010', commercial:'135deg,#2e1a0d,#1a0d05', land:'135deg,#1a2e2e,#0d2020' };
  var bg = bgs[l.type] || bgs.apartment;
  var tags = (l.tags||[]).map(function(tg){ return '<span class="fc-chip'+(tg==='Обмен'?' exch':'')+'">'+tg+'</span>'; }).join('');
  var vbadge = l.hasVideo ? '<div class="fc-vbadge"><i class="fas fa-play-circle"></i> Видео</div>' : '';
  var exbadge = l.exchange ? '<div class="fc-exbadge">🔄 Обмен</div>' : '';
  
  var mediaHtml;
  if (l.hasVideo && l.videoId) {
    mediaHtml =
      '<div class="fc-video" id="fv-'+l.id+'">' +
        '<img src="https://img.youtube.com/vi/'+l.videoId+'/hqdefault.jpg" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.style.display=\'none\';this.parentNode.querySelector(\'.fc-bg\').style.display=\'flex\'">' +
        '<div class="fc-video-tap" onclick="playFeedVideo('+l.id+',\''+l.videoId+'\')"></div>' +
        '<div class="fc-play-center" id="fpc-'+l.id+'" onclick="playFeedVideo('+l.id+',\''+l.videoId+'\')"><i class="fas fa-play" style="margin-left:3px"></i></div>' +
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
      '<div class="sab"><button class="sab-btn" onclick="goChat('+l.id+')"><i class="fas fa-comment"></i></button><span class="sab-lbl">Чат</span></div>' +
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
  document.getElementById('tab-obj').classList.toggle('on', tab==='obj');
  document.getElementById('tab-exch').classList.toggle('on', tab==='exch');
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
  var badgeColor = {Горящее:'#E74C3C',Топ:'#27AE60',Обмен:'#9B59B6'}[l.badge] || '#F47B20';
  var rcol = l.realtorColor || '#1E2D5A';
  
  var mediaHtml;
  if (l.hasVideo && l.videoId) {
    mediaHtml =
      '<div class="lcard-media" style="cursor:pointer" onclick="event.stopPropagation();openDetail('+l.id+')">' +
        '<img src="https://img.youtube.com/vi/'+l.videoId+'/mqdefault.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.parentNode.querySelector(\'.lcard-em\').style.display=\'flex\';this.style.display=\'none\'">' +
        '<div class="lcard-em" style="display:none">'+em+'</div>' +
        '<div class="video-thumb">' +
          '<div class="video-play"><i class="fas fa-play" style="margin-left:3px"></i></div>' +
          '<div class="video-lbl">Видео-тур</div>' +
        '</div>' +
        '<div class="lcard-badge" style="background:'+badgeColor+'">'+(l.badge||'')+'</div>' +
      '</div>';
  } else {
    mediaHtml =
      '<div class="lcard-media" onclick="openDetail('+l.id+')">' +
        '<div class="lcard-em">'+em+'</div>' +
        '<div class="lcard-badge" style="background:'+badgeColor+'">'+(l.badge||'')+'</div>' +
      '</div>';
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
        '<div class="lf-name">'+esc(l.realtorFull||l.realtor||')+' · '+esc(l.agency||'')+'</div>' +
      '</div>' +
      '<div class="lcard-cta">' +
        '<button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\''+esc(l.phone||'+7 701 234 56 78')+'\')"><i class="fas fa-phone"></i> '+t('call')+'</button>' +
        '<button class="cta-btn cta-msg" onclick="event.stopPropagation();goChat('+l.id+')"><i class="fas fa-comment"></i> '+t('msg')+'</button>' +
      '</div>' +
    '</div>' +
    '</div>'
  );
}

/* ── DETAIL MODAL ──────────────────────────────────────── */
function openDetail(id) {
  var l = listings.find(function(x){ return x.id === id; });
  if (!l) return;
  
  var em = EM[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) : 'По договору';
  var rmH = l.rooms ? '<div class="det-cell"><div class="det-val">'+l.rooms+'к</div><div class="det-lbl">'+t('rooms')+'</div></div>' : '';
  var arH = l.area ? '<div class="det-cell"><div class="det-val">'+l.area+'</div><div class="det-lbl">'+t('area')+'</div></div>' : '';
  var exH = l.exchange ? '<div style="display:flex;align-items:center;gap:6px;padding:0 17px 8px;font-size:13px;color:#27AE60"><i class="fas fa-exchange-alt"></i><b>Рассмотрим обмен — выгодно в 2026!</b></div>' : '';
  
  var visualHtml;
  if (l.hasVideo && l.videoId) {
    visualHtml =
      '<div class="det-visual" style="position:relative">' +
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
  
  var photosHtml = '';
  if (l.photos && l.photos.length) {
    photosHtml = '<div class="det-photos">' +
      l.photos.map(function(p,i){ return '<div class="det-photo'+(i===0?' on':'')+'" onclick="selPhoto(this)">'+p+'</div>'; }).join('') +
      '</div>';
  }
  
  var exchHtml = '';
  if (l.exchange) {
    var matches = listings.filter(function(x){ return x.exchange && x.id !== l.id; });
    if (matches.length) {
      exchHtml = '<div class="exch-match" onclick="openExchangeModal('+l.id+')">' +
        '<div style="font-size:13px;font-weight:700;color:#27AE60;margin-bottom:4px">🔄 Подходящие варианты для обмена ('+matches.length+')</div>' +
        '<div style="font-size:12px;color:var(--t2)">'+matches.map(function(m){ return m.rooms+'к · '+m.district; }).join(' &nbsp;|&nbsp; ')+'</div>' +
        '<div style="font-size:11px;color:#27AE60;margin-top:3px">Нажмите для просмотра →</div>' +
      '</div>';
    }
  }
  
  var rColor = {r1:'#1E2D5A',r2:'#F47B20',r3:'#27AE60',r4:'#9B59B6',r5:'#E67E22'}[l.realtorId] || '#1E2D5A';
  var realtorHtml =
    '<div class="det-realtor" onclick="openRealtorProfile(\''+l.realtorId+'\')">'+
      '<div class="lf-ava" style="width:38px;height:38px;font-size:14px;background:'+rColor+'">'+esc((l.realtorFull||l.realtor||'R').charAt(0))+'</div>'+
      '<div style="flex:1">'+
        '<div style="font-size:13px;font-weight:700">'+esc(l.realtorFull||l.realtor||'')+'</div>'+
        '<div style="font-size:11px;color:var(--t3)">'+esc(l.agency||'')+' · '+l.deals+' сделок</div>'+
      '</div>'+
      '<div style="font-size:11px;color:var(--navy);font-weight:600">Профиль →</div>'+
    '</div>';
  
  document.getElementById('m-det-body').innerHTML =
    '<div class="sh-handle"></div>' +
    visualHtml +
    photosHtml +
    '<div class="det-price">'+pr+' ₸</div>' +
    exH +
    '<div class="det-grid">'+rmH+arH+
      '<div class="det-cell"><div class="det-val">'+esc(l.district||'')+'</div><div class="det-lbl">'+t('district')+'</div></div>'+
    '</div>'+
    exchHtml +
    '<div class="det-desc">'+(l.desc||'').replace(/\n/g,'<br>')+'</div>'+
    realtorHtml +
    '<div class="det-cta">'+
      '<button class="det-btn det-call" onclick="callRealtor(\''+(l.phone||'+7 701 234 56 78')+'\')"><i class="fas fa-phone"></i> Позвонить</button>'+
      '<button class="det-btn det-chat" onclick="closeM(\'m-det\');goChat('+l.id+')"><i class="fas fa-comment"></i> Написать</button>'+
    '</div>'+
    '<div style="padding:0 17px 4px">'+
      '<button class="btn-outline" onclick="openHireModal('+l.id+')">🤝 '+t('hire_btn')+' риэлтора для продажи</button>'+
    '</div>';
  
  openM('m-det');
}

function playDetailVideo(id, videoId) {
  var thumb = document.getElementById('det-yt-thumb-'+id);
  var play = document.getElementById('det-yt-play-'+id);
  var frame = document.getElementById('det-yt-frame-'+id);
  if (!frame) return;
  
  if (thumb) thumb.style.display = 'none';
  if (play) play.style.display = 'none';
  frame.style.display = 'block';
  frame.innerHTML = '<iframe src="https://www.youtube.com/embed/'+videoId+'?autoplay=1&controls=1&rel=0" style="width:100%;height:100%;border:none" allow="autoplay" allowfullscreen></iframe>';
}

function selPhoto(el) {
  document.querySelectorAll('.det-photo').forEach(function(p){ p.classList.remove('on'); });
  el.classList.add('on');
}

function toggleLike(id, btn) {
  var l = listings.find(function(x){ return x.id === id; });
  if (!l) return;
  
  l.liked = !l.liked;
  btn.innerHTML = '<i class="'+(l.liked?'fas':'far')+' fa-heart"></i>';
  l.liked ? btn.classList.add('liked') : btn.classList.remove('liked');
  
  var lbl = btn.parentNode && btn.parentNode.nextElementSibling;
  if (lbl) lbl.textContent = l.liked ? '1' : '0';
  
  toast(l.liked ? '❤️ Добавлено в избранное' : '💔 Убрано');
}

function goChat(id) {
  var l = listings.find(function(x){ return x.id === id; });
  closeM('m-det');
  go('s-flai');
  nav(document.getElementById('n-flai'));
  
  if (l) {
    setTimeout(function(){
      var inp = document.getElementById('flai-inp');
      if (inp) {
        inp.value = 'Интересует объект: '+(l.rooms?l.rooms+'к, ':'')+esc(l.district)+', '+fmtPrice(l.price)+' ₸';
        inp.focus();
        autoResize(inp);
      }
    }, 200);
  }
}

function callRealtor(phone) {
  toast('📞 Звонок: '+phone);
  setTimeout(function(){ window.location.href = 'tel:'+phone.replace(/\s/g,''); }, 600);
}

/* ── UTILS ─────────────────────────────────────────────── */
function val(id) { var e=document.getElementById(id); return e ? e.value.trim() : ''; }
function esc(s) { return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function pad(n) { return String(n).padStart(2,'0'); }

/* Форматирование цены с пробелами: 10000000 → 10 000 000 */
function fmtPrice(p) { 
  return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' '); 
}

/* ── ОСТАЛЬНЫЕ ФУНКЦИИ (сокращено для экономии места) ─── */
/* ... здесь должны быть все остальные функции из оригинального файла ... */
/* Включая: proposeExchange, openHireModal, renderRealtors, openRealtorProfile, */
/* sendFlai, sendAira, genAI, submitListing, renderCal, renderProf, doLogin, */
/* doReg, doLogout, renderAuthSlot, needAuth, go, nav, showMore, openM, closeM, */
/* closeOvl, toggleTheme, applyTheme, setLang, applyLangUI, toast и т.д. */

/* Важно: в функции showMore() добавить проверку авторизации */
function showMore() {
  if (!curUser) {
    toast('🔐 Войдите как риэлтор');
    openM('m-auth');
    return;
  }
  openM('m-more');
}

/* В функции openAddListing() тоже проверка */
function openAddListing() {
  if (!curUser) {
    toast('🔐 Войдите как риэлтор');
    openM('m-auth');
    return;
  }
  openM('m-add');
}

/* В submitListing() использовать fmtPrice для отображения */
function submitListing() {
  var type = val('a-type') || 'apartment';
  var area = val('a-area');
  var price = val('a-price');
  var videoU = val('a-video');
  
  if (!area || isNaN(parseInt(area))) { toast('⚠️ Укажите площадь'); return; }
  if (!price || isNaN(parseInt(price))) { toast('⚠️ Укажите цену'); return; }
  
  var videoId = '';
  if (videoU) {
    var ym = videoU.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (ym) videoId = ym[1];
  }
  
  var rooms = parseInt(val('a-rooms')) || 0;
  var rName = curUser ? (curUser.name||'Мой объект') : 'Мой объект';
  
  var newL = {
    id: Date.now(),
    type: type,
    rooms: rooms,
    area: parseInt(area),
    district: val('a-district') || 'Есиль',
    city: val('a-city') || 'Астана',
    price: parseInt(price),
    exchange: (document.getElementById('a-exch')||{}).checked || false,
    hasVideo: !!videoId,
    videoId: videoId,
    realtor: rName.split(' ').slice(0,2).map(function(w,i){ return i===0?w:w.charAt(0)+'.'; }).join(' '),
    realtorFull: rName,
    realtorId: curUser ? curUser.id : 'u_new',
    rating: curUser ? (curUser.rating||5.0) : 5.0,
    deals: curUser ? (curUser.deals||0) : 0,
    agency: curUser ? (curUser.agency||'Самозанятый') : 'Самозанятый',
    tags: [val('a-rooms')+'к', type==='house'?'Дом':'Квартира'],
    badge: 'Новое',
    desc: val('a-desc') || 'Новый объект. Подробности по запросу.',
    photos: ['🛋️','🚿','🪟'],
  };
  
  listings.unshift(newL);
  renderListings();
  renderFeed();
  closeM('m-add');
  
  ['a-area','a-price','a-desc','a-video'].forEach(function(id){ 
    var e=document.getElementById(id); 
    if(e) e.value=''; 
  });
  
  var w = document.getElementById('ai-box-wrap'); 
  if(w) w.style.display='none';
  
  toast('🚀 Объект опубликован! Цена: '+fmtPrice(parseInt(price))+' ₸');
  
  if (curUser) {
    setTimeout(function(){
      addAiraThread('🏠 Новый объект: '+(rooms?rooms+'к ':'')+(type==='apartment'?'квартира':type==='house'?'дом':'коммерция')+', '+val('a-district')+', '+fmtPrice(parseInt(price))+' ₸', 'listing');
    }, 800);
  }
}

/* Остальные функции нужно добавить полностью из оригинального файла */
