/* ═══════════════════════════════════════════════════════════
   FLAPY  app.js  v5.0  — Fully Working Product
   - Video apartments (YouTube embed)
   - Full Flai + Aira chat logic
   - Rating system with reviews
   - Property exchange mechanics
   - Full language switch (RU/KZ)
   - Seller chooses realtor 
   - Add listing with video/photo
═══════════════════════════════════════════════════════════ */
'use strict'; 

/* ── STATE ─────────────────────────────────────────────── */
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

/* ── TRANSLATIONS ──────────────────────────────────────── */
var T = {
  ru: {
    tagline:        'Ваш умный помощник на рынке жилья',
    tab_obj:        'Объекты', tab_exch: 'Обмен',
    filt_all:       'Все', filt_apt: 'Квартиры', filt_house: 'Дома',
    filt_comm:      'Коммерция', filt_video: '🎬 Видео',
    call:           'Позвонить', msg: 'Написать',
    flai_sub:       '— умный помощник',
    flai_status:    'Онлайн · отвечает мгновенно',
    aira_sub:       '— Чат риэлторов',
    rel_header:     'Риэлторы', rel_sub: 'Выберите лучшего специалиста',
    notif_title:    'Уведомления',
    menu_title:     'Меню',
    today:          'Сегодня',
    test_hint:      'Тест: <b>test@realtor.kz</b> / <b>demo123</b>',
    email_lbl:      'Email', pass_lbl: 'Пароль',
    signin_btn:     'Войти', reg_btn: 'Зарегистрироваться',
    no_acc:         'Нет аккаунта? Зарегистрироваться',
    have_acc:       'Уже есть аккаунт',
    reg_hint:       'Только для риэлторов — верифицированный статус сразу',
    add_photo:      'Добавить фото', add_video: 'Добавить видео',
    publish_btn:    'Опубликовать',
    chip_desc:      '✍️ Описание', chip_mortgage: '🏦 Ипотека',
    chip_promo:     '📢 Продвижение', chip_tax: '💡 Налоги',
    chip_show:      '📅 Показ', chip_val: '💰 Оценка', chip_exch: '🔄 Обмен',
    flai_welcome:   'Привет! Я Flai 👋<br>Помогу найти жильё, рассчитать ипотеку, составить описание и ответить на любые вопросы о рынке недвижимости.',
    flai_news:      '💡 <b>Новость 2026:</b> срок без налога при продаже — теперь <b>2 года</b>. Обмен поможет сэкономить 10–15%!',
    nav_obj:        'Объекты', nav_feed: 'Лента', nav_flai: 'Flai AI', nav_more: 'Ещё',
    hire_btn:       '🤝 Нанять',
    hire_title:     'Нанять риэлтора',
    choose_realtor: 'Выберите риэлтора для вашего объекта',
    rate_title:     'Оставить отзыв',
    exch_title:     '🔄 Предложить обмен',
    rooms:          'Комнат', area: 'Площадь м²', district: 'Район',
    deals_label:    'сделок', reviews_label: 'отзывов',
  },
  kz: {
    tagline:        'Жылжымайтын мүлік нарығындағы ақылды көмекшіңіз',
    tab_obj:        'Объектілер', tab_exch: 'Айырбас',
    filt_all:       'Барлығы', filt_apt: 'Пәтерлер', filt_house: 'Үйлер',
    filt_comm:      'Коммерция', filt_video: '🎬 Бейне',
    call:           'Қоңырау', msg: 'Жазу',
    flai_sub:       '— ақылды көмекші',
    flai_status:    'Онлайн · лезде жауап береді',
    aira_sub:       '— Риэлторлар чаты',
    rel_header:     'Риэлторлар', rel_sub: 'Ең жақсы маманды таңдаңыз',
    notif_title:    'Хабарламалар',
    menu_title:     'Мәзір',
    today:          'Бүгін',
    test_hint:      'Тест: <b>test@realtor.kz</b> / <b>demo123</b>',
    email_lbl:      'Email', pass_lbl: 'Құпия сөз',
    signin_btn:     'Кіру', reg_btn: 'Тіркелу',
    no_acc:         'Аккаунт жоқ па? Тіркелу',
    have_acc:       'Аккаунт бар',
    reg_hint:       'Тек риэлторлар үшін — расталған мәртебе бірден',
    add_photo:      'Фото қосу', add_video: 'Бейне қосу',
    publish_btn:    'Жариялау',
    chip_desc:      '✍️ Сипаттама', chip_mortgage: '🏦 Несие',
    chip_promo:     '📢 Жылжыту', chip_tax: '💡 Салықтар',
    chip_show:      '📅 Көрсету', chip_val: '💰 Баға', chip_exch: '🔄 Айырбас',
    flai_welcome:   'Сәлем! Мен Flai 👋<br>Тұрғын үй табуға, ипотека есептеуге, сипаттама жазуға және жылжымайтын мүлік нарығы туралы кез келген сұрақтарға жауап беруге көмектесемін.',
    flai_news:      '💡 <b>2026 жаңалығы:</b> Сатылымдағы салықсыз мерзім — енді <b>2 жыл</b>. Айырбас 10–15% үнемдеуге мүмкіндік береді!',
    nav_obj:        'Объект', nav_feed: 'Лента', nav_flai: 'Flai AI', nav_more: 'Тағы',
    hire_btn:       '🤝 Жалдау',
    hire_title:     'Риэлторды жалдау',
    choose_realtor: 'Объектіңіз үшін риэлтор таңдаңыз',
    rate_title:     'Пікір қалдыру',
    exch_title:     '🔄 Айырбас ұсыну',
    rooms:          'Бөлмелер', area: 'Ауданы м²', district: 'Аудан',
    deals_label:    'мәміле', reviews_label: 'пікір',
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
    { id:1, type:'apartment', rooms:3, area:85,  district:'Бостандыкский', city:'Алматы',  price:78500000,  exchange:false, hasVideo:true,  videoId:'ScMzIvxBSi4', realtor:'Айгерим К.', realtorId:'r1', realtorFull:'Айгерим Касымова', rating:4.9, deals:47, agency:'Century 21',  tags:['Новострой'], badge:'Новое',   desc:'Просторная 3-комнатная с панорамным видом. Свежий ремонт евро-класса, подземный паркинг, охраняемый ЖК.', photos:['🛋️','🛁','🪟','🏗️'] },
    { id:2, type:'apartment', rooms:3, area:82,  district:'Есильский',     city:'Астана',  price:62000000,  exchange:false, hasVideo:true,  videoId:'tgbNymZ7vqY', realtor:'Данияр М.',  realtorId:'r2', realtorFull:'Данияр Мусин',     rating:4.7, deals:32, agency:'Etagi',      tags:['Горящее'],  badge:'Горящее', desc:'Отличная 3-комнатная в новом ЖК. Полная отделка, вид на парк, детская площадка во дворе.',            photos:['🛋️','🚿','🌇'] },
    { id:3, type:'house',     rooms:5, area:220, district:'Алматинский',   city:'Астана',  price:150000000, exchange:true,  hasVideo:true,  videoId:'UxxajLWwzqY', realtor:'Сауле Т.',   realtorId:'r3', realtorFull:'Сауле Тлеубекова', rating:5.0, deals:68, agency:'Royal Group', tags:['Обмен'],    badge:'Обмен',   desc:'Дом с участком 10 соток. Гараж на 2 машины, баня, летняя кухня. Рассмотрим обмен на квартиру!',        photos:['🏡','🌳','🏊','🔥'] },
    { id:4, type:'commercial',rooms:0, area:120, district:'Байконыр',      city:'Астана',  price:65000000,  exchange:false, hasVideo:false, videoId:'',            realtor:'Нурлан А.',  realtorId:'r4', realtorFull:'Нурлан Ахметов',   rating:4.6, deals:23, agency:'Само-занятый',tags:['Инвест'],   badge:'Топ',     desc:'Помещение первой линии, высокий трафик 5000 чел/день. Идеально под ресторан, аптеку, офис.',           photos:['🏪','📐','🔌'] },
    { id:5, type:'apartment', rooms:2, area:65,  district:'Сарыарка',      city:'Астана',  price:38000000,  exchange:true,  hasVideo:false, videoId:'',            realtor:'Айгерим К.', realtorId:'r1', realtorFull:'Айгерим Касымова', rating:4.9, deals:47, agency:'Century 21',  tags:['Обмен'],    badge:'Обмен',   desc:'Уютная 2-комнатная в тихом дворе. Рядом школа, детский сад, магазины. Рассмотрим обмен!',              photos:['🛋️','🚿'] },
    { id:6, type:'apartment', rooms:1, area:42,  district:'Есиль',         city:'Астана',  price:29000000,  exchange:false, hasVideo:true,  videoId:'jNQXAC9IVRw', realtor:'Данияр М.',  realtorId:'r2', realtorFull:'Данияр Мусин',     rating:4.7, deals:32, agency:'Etagi',      tags:['Студия'],   badge:'Новое',   desc:'Стильная студия со смарт-дизайном. Встроенная кухня, системы умного дома, вид на ночной город.',        photos:['🛋️','🌃'] },
  ];
}

function getFallbackRealtors() {
  return [
    { id:'r1', name:'Айгерим Касымова', agency:'Century 21',  rating:4.9, deals:47, reviews:23, phone:'+7 701 234 56 78', photo:'А', color:'#1E2D5A', specialization:'Квартиры, новострой', experience:5, badge:'ТОП', verified:true,
      reviewsList:[
        {author:'Алия С.',   stars:5, text:'Профессионал! Быстро нашла покупателя, все документы оформила чисто.',     date:'15 янв'},
        {author:'Марат Б.',  stars:5, text:'Рекомендую! Отличная работа, всегда на связи.',                             date:'3 янв'},
        {author:'Дина К.',   stars:4, text:'Хорошая работа, но немного задержалась с документами.',                     date:'28 дек'},
      ]},
    { id:'r2', name:'Данияр Мусин',     agency:'Etagi',       rating:4.7, deals:32, reviews:18, phone:'+7 702 345 67 89', photo:'Д', color:'#F47B20', specialization:'Дома, коттеджи',    experience:7, badge:'',    verified:true,
      reviewsList:[
        {author:'Самал Т.',  stars:5, text:'Отличный риэлтор! Нашёл нам дом нашей мечты.',                              date:'10 янв'},
        {author:'Нурлан К.', stars:4, text:'Хорошая работа, рекомендую для покупки домов.',                             date:'5 янв'},
      ]},
    { id:'r3', name:'Сауле Тлеубекова', agency:'Royal Group', rating:5.0, deals:68, reviews:41, phone:'+7 707 456 78 90', photo:'С', color:'#27AE60', specialization:'Коммерция',         experience:9, badge:'ТОП', verified:true,
      reviewsList:[
        {author:'ТОО Казсервис', stars:5, text:'Лучший риэлтор по коммерции в Астане! Сделали всё быстро.',           date:'20 янв'},
        {author:'Арман Ж.',      stars:5, text:'Профессиональный подход, отличный результат!',                        date:'12 янв'},
      ]},
    { id:'r4', name:'Нурлан Ахметов',   agency:'Самозанятый', rating:4.6, deals:23, reviews:12, phone:'+7 705 567 89 01', photo:'Н', color:'#9B59B6', specialization:'Обмен, любые объекты', experience:3, badge:'',  verified:true,
      reviewsList:[
        {author:'Гульнара М.', stars:4, text:'Помог с обменом, всё прошло гладко.',                                   date:'8 янв'},
      ]},
    { id:'r5', name:'Асель Бекова',     agency:'Etagi',       rating:4.8, deals:38, reviews:19, phone:'+7 708 678 90 12', photo:'А', color:'#E67E22', specialization:'Новострой',         experience:4, badge:'',    verified:true,
      reviewsList:[
        {author:'Болат С.',  stars:5, text:'Помогла купить новостройку без лишней суеты!',                            date:'2 янв'},
        {author:'Зарина М.', stars:5, text:'Рекомендую всем! Очень внимательная и профессиональная.',                 date:'25 дек'},
      ]},
  ];
}

function getFallbackCal() {
  var t = new Date();
  function dt(d,h,m){ return new Date(t.getFullYear(),t.getMonth(),t.getDate()+d,h,m).toISOString(); }
  return [
    {id:1,title:'Показ квартиры 3к Есиль', time:dt(0,10,0),  type:'showing',client:'Алия С.',      note:'Взять ключи от 401', color:'#F47B20'},
    {id:2,title:'Звонок клиенту',          time:dt(0,14,30), type:'call',   client:'Данияр М.',     note:'Обсудить ипотеку Halyk', color:'#27AE60'},
    {id:3,title:'Подписание договора',     time:dt(1,11,0),  type:'deal',   client:'Нурсулу К.',    note:'Проверить документы ЦОН', color:'#1E2D5A'},
    {id:4,title:'Показ коммерции Байконыр',time:dt(1,15,0),  type:'showing',client:'Бизнес-клиент', note:'Взять план помещения', color:'#F47B20'},
    {id:5,title:'Встреча в агентстве',     time:dt(2,10,0),  type:'meeting',client:'Century 21',    note:'Новые объекты недели', color:'#9B59B6'},
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
  var em  = EM[l.type] || '🏠';
  var pr  = l.price ? fmtPrice(l.price) + ' ₸' : 'по договору';
  var rm  = l.rooms ? l.rooms + 'к · ' : '';
  var ini = (l.realtor || 'R').charAt(0);
  var bgs = { apartment:'135deg,#1a1a40,#0d1b3e', house:'135deg,#1a2e1a,#0d2010', commercial:'135deg,#2e1a0d,#1a0d05', land:'135deg,#1a2e2e,#0d2020' };
  var bg  = bgs[l.type] || bgs.apartment;
  var tags = (l.tags||[]).map(function(tg){ return '<span class="fc-chip'+(tg==='Обмен'?' exch':'')+'">'+tg+'</span>'; }).join('');
  var vbadge  = l.hasVideo ? '<div class="fc-vbadge"><i class="fas fa-play-circle"></i> Видео</div>' : '';
  var exbadge = l.exchange  ? '<div class="fc-exbadge">🔄 Обмен</div>' : '';

  var mediaHtml;
  if (l.hasVideo && l.videoId) {
    mediaHtml =
      '<div class="fc-video" id="fv-'+l.id+'">' +
        '<img src="https://img.youtube.com/vi/'+l.videoId+'/hqdefault.jpg" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.style.display=\'none\'">' +
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
        '<div class="sab"><button class="sab-btn'+(l.liked?' liked':'')+'" id="hrt-'+l.id+'" onclick="toggleLike('+l.id+',this)"><i class="'+(l.liked?'fas':'far')+' fa-heart"></i></button><span class="sab-lbl">'+(l.liked?1:0)+'</span></div>' +
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
          '<div><div class="fc-r-name">'+esc(l.realtor||'')+'</div><div class="fc-r-sub">★ '+l.rating+' · '+esc(l.agency||'')+'</div></div>' +
          '<button class="fc-r-btn" onclick="openDetail('+l.id+')">Подробнее</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function playFeedVideo(id, videoId) {
  var container = document.getElementById('fv-'+id);
  var playBtn   = document.getElementById('fpc-'+id);
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
  if (curFilter === 'video')      res = res.filter(function(l){ return l.hasVideo; });
  else if (curFilter !== 'all')   res = res.filter(function(l){ return l.type === curFilter; });
  if (!res.length) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">🔍</div><div class="empty-t">Ничего не найдено</div><div class="empty-s">Попробуйте другой фильтр</div></div>';
    return;
  }
  el.innerHTML = res.map(buildListCard).join('');
}

function buildListCard(l) {
  var em  = EM[l.type] || '🏠';
  var pr  = l.price ? fmtPrice(l.price) : '—';
  var rm  = l.rooms ? l.rooms+'-комнатная, ' : '';
  var ini = (l.realtor||'R').charAt(0);
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
          '<div class="lf-name">'+esc(l.realtorFull||l.realtor||'')+' · '+esc(l.agency||'')+'</div>' +
          '<div class="lf-rating">★ '+l.rating+'</div>' +
        '</div>' +
        '<div class="lcard-cta">' +
          '<button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\''+esc(l.phone||'+7 701 234 56 78')+'\')"><i class="fas fa-phone"></i> '+t('call')+'</button>' +
          '<button class="cta-btn cta-msg"  onclick="event.stopPropagation();goChat('+l.id+')"><i class="fas fa-comment"></i> '+t('msg')+'</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

/* ── DETAIL MODAL ──────────────────────────────────────── */
function openDetail(id) {
  var l = listings.find(function(x){ return x.id === id; });
  if (!l) return;
  var em  = EM[l.type] || '🏠';
  var pr  = l.price ? fmtPrice(l.price) : 'По договору';
  var rmH = l.rooms ? '<div class="det-cell"><div class="det-val">'+l.rooms+'к</div><div class="det-lbl">'+t('rooms')+'</div></div>' : '';
  var arH = l.area  ? '<div class="det-cell"><div class="det-val">'+l.area+'</div><div class="det-lbl">'+t('area')+'</div></div>' : '';
  var exH = l.exchange ? '<div style="display:flex;align-items:center;gap:6px;padding:0 17px 8px;font-size:13px;color:#27AE60"><i class="fas fa-exchange-alt"></i><b>Рассмотрим обмен — выгодно в 2026!</b></div>' : '';

  /* Video or photo */
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

  /* Photos */
  var photosHtml = '';
  if (l.photos && l.photos.length) {
    photosHtml = '<div class="det-photos">' +
      l.photos.map(function(p,i){ return '<div class="det-photo'+(i===0?' on':'')+'" onclick="selPhoto(this)">'+p+'</div>'; }).join('') +
    '</div>';
  }

  /* Exchange match */
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

  /* Realtor card */
  var rColor = { r1:'#1E2D5A', r2:'#F47B20', r3:'#27AE60', r4:'#9B59B6', r5:'#E67E22' }[l.realtorId] || '#1E2D5A';
  var realtorHtml =
    '<div class="det-realtor" onclick="openRealtorProfile(\''+l.realtorId+'\')">'+
      '<div class="lf-ava" style="width:38px;height:38px;font-size:14px;background:'+rColor+'">'+esc((l.realtorFull||l.realtor||'R').charAt(0))+'</div>'+
      '<div style="flex:1">'+
        '<div style="font-size:13px;font-weight:700">'+esc(l.realtorFull||l.realtor||'')+'</div>'+
        '<div style="font-size:11px;color:var(--t3)">'+esc(l.agency||'')+' · ★ '+l.rating+' · '+l.deals+' сделок</div>'+
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
      '<div class="det-cell"><div class="det-val">⭐ '+l.rating+'</div><div class="det-lbl">Рейтинг</div></div>'+
    '</div>'+
    exchHtml +
    '<div class="det-desc">'+(l.desc||'').replace(/\n/g,'<br>')+'</div>'+
    realtorHtml +
    '<div class="det-cta">'+
      '<button class="det-btn det-call" onclick="callRealtor(\'+'+(l.phone||'+7 701 234 56 78')+'\')"><i class="fas fa-phone"></i> Позвонить</button>'+
      '<button class="det-btn det-chat" onclick="closeM(\'m-det\');goChat('+l.id+')"><i class="fas fa-comment"></i> Написать</button>'+
    '</div>'+
    '<div style="padding:0 17px 4px">'+
      '<button class="btn-outline" onclick="openHireModal(\''+l.id+'\')">🤝 '+t('hire_btn')+' риэлтора для продажи</button>'+
    '</div>';
  openM('m-det');
}

function playDetailVideo(id, videoId) {
  var thumb = document.getElementById('det-yt-thumb-'+id);
  var play  = document.getElementById('det-yt-play-'+id);
  var frame = document.getElementById('det-yt-frame-'+id);
  if (!frame) return;
  if (thumb) thumb.style.display = 'none';
  if (play)  play.style.display  = 'none';
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
  go('s-flai'); nav(document.getElementById('n-flai'));
  if (l) {
    setTimeout(function(){
      var inp = document.getElementById('flai-inp');
      if (inp) {
        inp.value = 'Интересует объект: '+(l.rooms?l.rooms+'к, ':'')+esc(l.district)+', '+fmtPrice(l.price)+' ₸';
        inp.focus(); autoResize(inp);
      }
    }, 200);
  }
}

function callRealtor(phone) {
  toast('📞 Звонок: '+phone);
  setTimeout(function(){ window.location.href = 'tel:'+phone.replace(/\s/g,''); }, 600);
}

/* ── EXCHANGE MODAL ────────────────────────────────────── */
function openExchangeModal(listingId) {
  closeM('m-det');
  var l = listings.find(function(x){ return x.id === listingId; });
  if (!l) return;
  var matches = listings.filter(function(x){ return x.exchange && x.id !== listingId; });
  var body = document.getElementById('m-exchange-body');
  if (!body) return;
  body.innerHTML =
    '<div style="padding:0 0 6px"><div style="font-size:13px;color:var(--t2);margin-bottom:12px">Ваш объект: <b>'+esc(l.rooms?l.rooms+'к':'')+'</b> · '+esc(l.district)+' · '+fmtPrice(l.price)+' ₸</div></div>' +
    '<div style="font-size:12px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Подходящие объекты:</div>' +
    matches.map(function(m) {
      var diff = m.price - l.price;
      var diffTxt = diff > 0 ? ' (+'+fmtPrice(diff)+' ₸ доплата)' : diff < 0 ? ' ('+fmtPrice(diff)+' ₸ экономия)' : ' (равноценный обмен)';
      return '<div class="lcard" style="margin-bottom:10px;cursor:pointer" onclick="proposeExchangeDeal('+l.id+','+m.id+')">' +
        '<div class="lcard-body">' +
          '<div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>'+esc(m.city)+', '+esc(m.district)+'</div>' +
          '<div class="lcard-price">'+fmtPrice(m.price)+' ₸</div>' +
          '<div class="lcard-sub">'+(m.rooms?m.rooms+'-комнатная, ':'')+m.area+' м²</div>' +
          '<div style="font-size:12px;color:#27AE60;font-weight:600;margin-top:4px">🔄'+diffTxt+'</div>' +
          '<div class="lcard-footer">' +
            '<div class="lf-ava" style="background:#27AE60">'+esc((m.realtorFull||m.realtor||'R').charAt(0))+'</div>' +
            '<div class="lf-name">'+esc(m.realtorFull||'')+' · '+esc(m.agency||'')+'</div>' +
            '<div class="lf-rating">★ '+m.rating+'</div>' +
          '</div>' +
          '<button class="btn-primary" style="margin-top:8px" onclick="event.stopPropagation();proposeExchangeDeal('+l.id+','+m.id+')">🔄 Предложить обмен</button>' +
        '</div>' +
      '</div>';
    }).join('') +
    '<div class="info-box" style="margin-top:4px"><span>💡</span><span>В 2026 году обмен освобождает от налога с продажи до <b>10–15%</b> от стоимости!</span></div>';
  openM('m-exchange');
}

function proposeExchange(listingId) {
  openExchangeModal(listingId);
}

function proposeExchangeDeal(fromId, toId) {
  var from = listings.find(function(x){ return x.id === fromId; });
  var to   = listings.find(function(x){ return x.id === toId; });
  if (!from || !to) return;
  closeM('m-exchange');
  /* Send message to Aira about exchange */
  if (curUser) {
    setTimeout(function(){
      addAiraThread('🔄 Обмен: '+esc(from.rooms?from.rooms+'к':'')+'·'+esc(from.district)+' ↔ '+esc(to.rooms?to.rooms+'к':'')+'·'+esc(to.district), 'exchange');
      go('s-aira'); nav(null);
    }, 400);
    toast('🔄 Обмен предложен! Уведомили риэлтора в Aira');
  } else {
    toast('✅ Запрос на обмен отправлен риэлтору!');
  }
}

/* ── HIRE REALTOR MODAL ────────────────────────────────── */
function openHireModal(listingId) {
  closeM('m-det');
  curHireId = listingId;
  if (!realtors.length) {
    fetchRealtors(function(){ renderHireModal(listingId); });
  } else {
    renderHireModal(listingId);
  }
}

function renderHireModal(listingId) {
  var l = listingId ? listings.find(function(x){ return x.id === listingId; }) : null;
  var body = document.getElementById('m-hire-body');
  if (!body) return;
  body.innerHTML =
    '<div style="font-size:12px;color:var(--t2);margin-bottom:14px">'+t('choose_realtor')+'</div>' +
    realtors.map(function(r) {
      var isSelected = l && l.realtorId === r.id;
      return '<div class="rcard" style="margin-bottom:10px;'+(isSelected?'border:2px solid var(--green)':'')+'" onclick="hireRealtor(\''+r.id+'\',\''+esc(r.name)+'\')">' +
        (r.badge ? '<div class="rc-badge">'+r.badge+'</div>' : '') +
        '<div class="rc-ava" style="background:'+r.color+'">'+r.photo+'</div>' +
        '<div style="flex:1">' +
          '<div class="rc-name">'+esc(r.name)+(isSelected?' <span style="color:#27AE60;font-size:11px">✓ Текущий</span>':'')+'</div>' +
          '<div class="rc-agency">'+esc(r.agency)+'</div>' +
          '<div class="rc-stars">★ '+r.rating+'<span>'+r.reviews+' '+t('reviews_label')+'</span></div>' +
          '<div class="rc-stats">' +
            '<div class="rc-stat"><b>'+r.deals+'</b> '+t('deals_label')+'</div>' +
            '<div class="rc-stat"><b>'+r.experience+' лет</b> опыта</div>' +
          '</div>' +
          '<div class="rc-spec">'+esc(r.specialization)+'</div>' +
        '</div>' +
      '</div>';
    }).join('') +
    '<div class="info-box warn" style="margin-top:6px"><span>🏆</span><span>Риэлтор получает комиссию только после успешной сделки. Вы можете сменить риэлтора в любой момент.</span></div>';
  openM('m-hire');
}

function hireRealtor(realtorId, realtorName) {
  var l = curHireId ? listings.find(function(x){ return x.id === curHireId; }) : null;
  if (l) {
    var r = realtors.find(function(x){ return x.id === realtorId; });
    if (r) {
      l.realtorId   = r.id;
      l.realtor     = r.name.split(' ')[0]+' '+r.name.split(' ')[1]?.charAt(0)+'.';
      l.realtorFull = r.name;
      l.agency      = r.agency;
      l.rating      = r.rating;
      l.deals       = r.deals;
      l.realtorColor= r.color;
    }
  }
  closeM('m-hire');
  /* Notify Aira */
  if (curUser) {
    addAiraThread('🤝 Назначен риэлтор: '+esc(realtorName)+' для моего объекта', 'listing');
  }
  fetch('/api/listing/rate-realtor', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({realtorId: realtorId, listingId: curHireId})
  }).catch(function(){});
  toast('✅ Риэлтор '+realtorName.split(' ')[0]+' назначен!');
  renderListings(); renderFeed();
}

/* ── REALTORS SCREEN ───────────────────────────────────── */
var realtorSort = 'rating';
function sortRealtors(key, el) {
  document.querySelectorAll('.rsort').forEach(function(r){ r.classList.remove('on'); });
  if (el) el.classList.add('on');
  realtorSort = key;
  renderRealtors();
}

function renderRealtors() {
  if (!realtors.length) { fetchRealtors(function(){ renderRealtors(); }); return; }
  var el = document.getElementById('realtors-list');
  if (!el) return;
  var sorted = realtors.slice().sort(function(a,b){ return (b[realtorSort]||0)-(a[realtorSort]||0); });
  el.innerHTML = sorted.map(function(r, i){ return buildRealtorCard(r, i); }).join('');
}

function buildRealtorCard(r, i) {
  var medal = ['🥇','🥈','🥉'][i] || '#'+(i+1);
  var barW  = Math.round(r.deals / 68 * 100);
  return (
    '<div class="rcard" onclick="openRealtorProfile(\''+r.id+'\')">' +
      (r.badge ? '<div class="rc-badge">'+r.badge+'</div>' : '') +
      '<div class="rc-ava" style="background:'+r.color+'">'+r.photo+'</div>' +
      '<div style="flex:1">' +
        '<div class="rc-name">'+esc(r.name)+'</div>' +
        '<div class="rc-agency">'+esc(r.agency)+'</div>' +
        '<div class="rc-stars">'+medal+' ★ '+r.rating+' <span>'+r.reviews+' отзывов</span></div>' +
        '<div class="rc-stats">' +
          '<div class="rc-stat"><b>'+r.deals+'</b> сделок</div>' +
          '<div class="rc-stat"><b>'+r.experience+' лет</b> опыта</div>' +
        '</div>' +
        '<div class="rc-spec">'+esc(r.specialization)+'</div>' +
        '<div class="rating-bar-wrap"><div class="rating-row"><div class="rating-prog"><div class="rating-fill" style="width:'+barW+'%"></div></div></div></div>' +
        '<div class="rc-actions">' +
          '<button class="rc-btn rc-call" onclick="event.stopPropagation();callRealtor(\''+esc(r.phone)+'\')"><i class="fas fa-phone"></i> Позвонить</button>' +
          '<button class="rc-btn rc-write" onclick="event.stopPropagation();chatWithRealtor(\''+r.id+'\',\''+esc(r.name)+'\')"><i class="fas fa-comment"></i> Написать</button>' +
          '<button class="rc-btn rc-hire" onclick="event.stopPropagation();hireRealtor(\''+r.id+'\',\''+esc(r.name)+'\')"><i class="fas fa-handshake"></i> Нанять</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function openRealtorProfile(id) {
  var r = realtors.find(function(x){ return x.id === id; });
  if (!r) { fetchRealtors(function(){ openRealtorProfile(id); }); return; }
  var stars = '★★★★★'.slice(0, Math.round(r.rating)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(r.rating));
  var reviewsHtml = (r.reviewsList||[]).map(function(rv) {
    return '<div class="review-item">' +
      '<div class="rev-head"><div class="rev-ava">'+rv.author.charAt(0)+'</div><div class="rev-name">'+esc(rv.author)+'</div><div class="rev-stars">'+rv.stars+'★</div></div>' +
      '<div class="rev-text">'+esc(rv.text)+'</div>' +
      '<div style="font-size:10px;color:var(--t3);margin-top:4px">'+esc(rv.date)+'</div>' +
    '</div>';
  }).join('');
  var body = document.getElementById('m-realtor-body');
  if (!body) return;
  body.innerHTML =
    '<div class="sh-handle"></div>' +
    '<div style="background:linear-gradient(135deg,'+r.color+','+r.color+'cc);padding:20px 17px 16px;text-align:center">' +
      '<div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#fff;margin:0 auto 10px">'+r.photo+'</div>' +
      '<div style="font-size:18px;font-weight:800;color:#fff">'+esc(r.name)+'</div>' +
      '<div style="font-size:12px;color:rgba(255,255,255,.7);margin-top:2px">'+esc(r.agency)+(r.verified?' · ✓ Верифицирован':'')+'</div>' +
      '<div style="font-size:22px;color:#FFD700;margin-top:8px">'+stars+'</div>' +
      '<div style="font-size:18px;font-weight:800;color:#fff">'+r.rating+' / 5.0</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:13px 17px">' +
      '<div style="background:var(--bg3);border-radius:10px;padding:11px;text-align:center"><div style="font-size:17px;font-weight:800;color:var(--navy)">'+r.deals+'</div><div style="font-size:10px;color:var(--t3)">Сделок</div></div>' +
      '<div style="background:var(--bg3);border-radius:10px;padding:11px;text-align:center"><div style="font-size:17px;font-weight:800;color:var(--navy)">'+r.reviews+'</div><div style="font-size:10px;color:var(--t3)">Отзывов</div></div>' +
      '<div style="background:var(--bg3);border-radius:10px;padding:11px;text-align:center"><div style="font-size:17px;font-weight:800;color:var(--navy)">'+r.experience+' л</div><div style="font-size:10px;color:var(--t3)">Опыт</div></div>' +
    '</div>' +
    '<div style="padding:0 17px">' +
      '<div style="font-size:12px;font-weight:600;color:var(--t3);margin-bottom:5px">Специализация</div>' +
      '<div style="font-size:13px;color:var(--t1)">'+esc(r.specialization)+'</div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;padding:13px 17px">' +
      '<button class="det-btn det-call" onclick="callRealtor(\''+esc(r.phone)+'\')"><i class="fas fa-phone"></i> Позвонить</button>' +
      '<button class="det-btn det-chat" onclick="closeM(\'m-realtor\');chatWithRealtor(\''+r.id+'\',\''+esc(r.name)+'\')"><i class="fas fa-comment"></i> Написать</button>' +
    '</div>' +
    '<button class="btn-primary" style="margin:0 17px 8px;width:calc(100% - 34px)" onclick="closeM(\'m-realtor\');hireRealtor(\''+r.id+'\',\''+esc(r.name)+'\')">🤝 Нанять для продажи</button>' +
    '<button class="btn-outline" style="margin:0 17px 8px;width:calc(100% - 34px)" onclick="openRateModal(\''+r.id+'\',\''+esc(r.name)+'\')">⭐ Оставить отзыв</button>' +
    '<div style="padding:0 17px 17px">' +
      '<div style="font-size:12px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Отзывы клиентов</div>' +
      reviewsHtml +
    '</div>';
  openM('m-realtor');
}

function chatWithRealtor(realtorId, realtorName) {
  go('s-flai'); nav(document.getElementById('n-flai'));
  setTimeout(function(){
    var inp = document.getElementById('flai-inp');
    if (inp) {
      inp.value = 'Хочу связаться с риэлтором '+realtorName;
      inp.focus(); autoResize(inp);
    }
  }, 200);
  toast('💬 Написать риэлтору '+realtorName.split(' ')[0]);
}

/* ── RATE REALTOR MODAL ────────────────────────────────── */
function openRateModal(realtorId, realtorName) {
  closeM('m-realtor');
  curHireId = realtorId;
  curStar   = 0;
  document.querySelectorAll('.star-btn').forEach(function(s){ s.classList.remove('on'); });
  var title = document.querySelector('#m-rate .sh-title');
  if (title) title.textContent = '⭐ Отзыв: '+realtorName;
  var txt = document.getElementById('rate-text');
  if (txt) txt.value = '';
  openM('m-rate');
}

function setStar(n) {
  curStar = n;
  document.querySelectorAll('.star-btn').forEach(function(s,i){ s.classList.toggle('on', i<n); });
}

function submitRate() {
  if (!curStar) { toast('⚠️ Выберите оценку'); return; }
  var txt  = val('rate-text');
  var r    = realtors.find(function(x){ return x.id === curHireId; });
  if (r && txt) {
    var author = curUser ? curUser.name : 'Клиент';
    r.reviewsList = r.reviewsList || [];
    r.reviewsList.unshift({author:author, stars:curStar, text:txt, date:'только что'});
    r.reviews++;
    /* Recalculate rating */
    var total = r.reviewsList.reduce(function(s,rv){ return s+rv.stars; }, 0);
    r.rating  = Math.round(total / r.reviewsList.length * 10) / 10;
  }
  closeM('m-rate');
  toast('⭐ Отзыв отправлен! Спасибо');
}

/* ── FLAI CHAT ─────────────────────────────────────────── */
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
  var typing = addTyping('flai-msgs', 'F');
  /* clear badge */
  var badge = document.getElementById('flai-badge');
  if (badge) badge.style.display = 'none';
  fetch('/api/chat/flai', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({message:txt, lang:curLang, role: curUser ? 'realtor' : 'buyer'})
  }).then(function(r){ return r.json(); }).then(function(d) {
    typing.remove(); addMsg('flai-msgs', d.reply, false, 'F');
  }).catch(function() {
    typing.remove();
    addMsg('flai-msgs', getFlaiLocalReply(txt), false, 'F');
  });
}

function getFlaiLocalReply(msg) {
  var m = msg.toLowerCase();
  var kz = curLang === 'kz';
  if (m.includes('обмен') || m.includes('айырбас'))
    return kz ? '🔄 Айырбас 2026 жылы өте тиімді! Салықсыз мерзім — 2 жыл. Бірнеше айырбас нұсқалары бар, қызығасыз ба?' : '🔄 Обмен в 2026 очень выгоден! Срок без налога — 2 года. Есть несколько подходящих вариантов для обмена, хотите посмотреть?';
  if (m.includes('ипотека') || m.includes('несие') || m.includes('кредит'))
    return kz ? '🏦 Отбасы Банк, Halyk Bank, Jusan Bank-пен жұмыс істейміз. Ставка жылдық 5%-дан. Нақты объект бойынша есептеп берейін?' : '🏦 Работаем с Отбасы Банк, Halyk Bank, Jusan Bank. Ставки от 5% годовых. Рассчитать ипотеку по конкретному объекту?';
  if (m.includes('цена') || m.includes('баға') || m.includes('сколько') || m.includes('стоимость'))
    return kz ? '💰 Баға ауданға, ауданға және жай-күйіне байланысты. Есіл — 1к от 28 млн. Нақты баға беруді қалайсыз ба?' : '💰 Цена зависит от района, площади и состояния. В Есиле 1к от 28 млн ₸. Хотите оценку конкретного объекта?';
  if (m.includes('налог') || m.includes('салық'))
    return kz ? '💡 2026 жылдан: салықсыз мерзім — 2 жыл. Мерзімінен бұрын сатқанда 10–15%. Айырбас — үнемдеудің тиімді жолы!' : '💡 С 2026 года: срок без налога — 2 года. При продаже раньше — 10–15%. Обмен — выгодная альтернатива!';
  if (m.includes('показ') || m.includes('көрсет') || m.includes('посмотреть'))
    return kz ? '📅 Ыңғайлы уақытта көрсетуді ұйымдастырамыз. Бүгін немесе ертең ыңғайлы ма?' : '📅 Организуем показ в удобное время. Когда удобно — сегодня или завтра?';
  if (m.includes('описание') || m.includes('сипаттама') || m.includes('составить'))
    return kz ? '✍️ Объект сипаттамасын дайындауға көмектесемін! Тип, ауданы мен бағасын айтыңыз.' : '✍️ Помогу составить привлекательное описание! Укажите тип, площадь, район и цену.';
  if (m.includes('продвижение') || m.includes('жылжыту') || m.includes('реклама'))
    return kz ? '📢 Объектті жылжыту үшін: сапалы фото, видео-тур, AI сипаттамасы.' : '📢 Для продвижения: качественные фото, видео-тур, AI-описание, публикация в Aira для коллег-риэлторов.';
  if (m.includes('риэлтор') || m.includes('выбрать') || m.includes('нанять'))
    return kz ? '🏆 Риэлторды рейтинг, сделок саны және мамандану бойынша таңдаңыз. ТОП риэлторлар бет бар!' : '🏆 Выберите риэлтора по рейтингу, количеству сделок и специализации. Перейдите в раздел «Риэлторы»!';
  if (m.includes('привет') || m.includes('сәлем') || m.includes('здравствуй'))
    return kz ? '👋 Сәлем! Мен Flai — AI-көмекшіңізмін. Пәтер табуға, ипотека есептеуге, баға беруге көмектесемін!' : '👋 Привет! Я Flai — ваш AI-помощник по недвижимости. Помогу найти жильё, рассчитать ипотеку, оценить объект!';
  if (m.includes('интересует') || m.includes('объект'))
    return kz ? '🏠 Жақсы! Бұл объект туралы толық ақпарат алу үшін риэлтормен байланысуды ұсынамын. Хабарласайын ба?' : '🏠 Отличный выбор! Рекомендую связаться с риэлтором для получения полной информации. Организовать звонок?';
  return kz ? '😊 Жақсы сұрақ! Тағы не сұрайын? Ипотека, баға, налог немесе риэлтор туралы сұра.' : '😊 Хороший вопрос! Чем ещё могу помочь? Спросите про ипотеку, цены, налоги или риэлтора.';
}

/* ── AIRA CHAT (риэлторы) ──────────────────────────────── */
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

var airaComposeType = 'listing';
function setComposeTab(tab) {
  airaComposeType = tab;
  document.querySelectorAll('.compose-tab').forEach(function(b){ b.classList.remove('on'); });
  var el = document.getElementById('ct-'+tab);
  if (el) el.classList.add('on');
  var inp = document.getElementById('aira-inp');
  if (!inp) return;
  var hints = {
    listing:  'Поделитесь объектом с коллегами: 3к, 85м², Есиль, 62 млн...',
    exchange: 'Предложите обмен: ищу 3к на 2к + доплата...',
    question: 'Задайте вопрос коллегам: как оформить ипотечную сделку?'
  };
  inp.placeholder = hints[tab] || inp.placeholder;
}

function sendAira() {
  var inp = document.getElementById('aira-inp');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) return;
  if (!curUser) {
    toast('🔐 Войдите, чтобы писать в Aira');
    openM('m-auth');
    return;
  }
  inp.value = ''; autoResize(inp);
  addAiraThread(txt, airaComposeType);
}

function addAiraThread(txt, type) {
  var name   = curUser ? (curUser.name || 'Риэлтор') : 'Риэлтор';
  var ini    = name.charAt(0).toUpperCase();
  var colors = ['linear-gradient(135deg,#1E2D5A,#4A6FA5)','linear-gradient(135deg,#F47B20,#FF9A3C)','linear-gradient(135deg,#27AE60,#2ECC71)'];
  var rndC   = colors[Math.floor(Math.random()*colors.length)];
  var typeTag = '';
  if (type === 'exchange') typeTag = '<span style="background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.2);border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;color:#27AE60;margin-left:5px">Обмен</span>';
  if (type === 'question') typeTag = '<span style="background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.2);border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;color:#F47B20;margin-left:5px">Вопрос</span>';
  if (type === 'listing')  typeTag = '<span style="background:rgba(30,45,90,.1);border:1px solid rgba(30,45,90,.2);border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;color:var(--navy);margin-left:5px">Объект</span>';

  /* Simulate reply after 2s */
  var replyReplies = {
    listing:  ['🤝 Есть покупатель! Пишу в личку', '👍 Интересный объект! Комиссию делим?', '📞 Клиент готов к ипотеке, свяжемся?'],
    exchange: ['🔄 Есть похожий вариант! Обсудим', '💡 Хороший обмен! Клиент экономит налог', '✅ Подходящий объект для обмена нашёл!'],
    question: ['💬 Делился опытом: нужен паспорт и СНТ', '📋 КПП — паспорт, справка с работы, СНТ', '🙋 Помогу! Писал по ипотеке в личку'],
  };
  var replies = replyReplies[type] || replyReplies.listing;
  var reply   = replies[Math.floor(Math.random()*replies.length)];
  var replyNames = ['Данияр М.','Сауле Т.','Айгерим К.','Асель Б.','Нурлан А.'];
  var replyName  = replyNames[Math.floor(Math.random()*replyNames.length)];

  var list = document.getElementById('aira-list');
  if (!list) return;
  var div = document.createElement('div');
  div.className = 'thread su';
  div.innerHTML =
    '<div class="th-head" onclick="toggleThread(this)">' +
      '<div class="th-ava" style="background:'+rndC+'">'+ini+'</div>' +
      '<div style="flex:1">' +
        '<div class="th-name">'+esc(name.split(' ')[0])+typeTag+' <span class="th-time">только что</span></div>' +
        '<div class="th-prev">'+esc(txt.substring(0,50))+(txt.length>50?'...':'')+'</div>' +
      '</div>' +
      '<i class="fas fa-chevron-down" style="color:var(--t3);font-size:11px;transition:transform .2s"></i>' +
    '</div>' +
    '<div class="th-body">' +
      (type==='listing' ? '<div class="prop-tag"><i class="fas fa-home"></i> '+esc(txt.substring(0,60))+'</div>' : '') +
      '<p style="font-size:12px;color:var(--t2);margin-bottom:8px">'+esc(txt)+'</p>' +
      '<div id="aira-replies-'+Date.now()+'" style="font-size:12px;margin-bottom:8px"></div>' +
      '<div style="display:flex;gap:6px">' +
        '<button onclick="replyAira(this)" style="padding:5px 10px;border-radius:7px;background:var(--navy);color:#fff;font-size:11px;font-weight:600;cursor:pointer">💬 Ответить</button>' +
        '<button onclick="callRealtor(\''+esc(curUser?curUser.phone||'+7 701 000 00 00':'+7 701 000 00 00')+'\')" style="padding:5px 10px;border-radius:7px;background:var(--bg3);color:var(--t1);font-size:11px;font-weight:600;cursor:pointer;border:1px solid var(--brd2)">📞 Позвонить</button>' +
      '</div>' +
    '</div>';
  list.insertBefore(div, list.firstChild);

  /* Simulate incoming reply */
  var repliesContainer = div.querySelector('[id^="aira-replies-"]');
  setTimeout(function(){
    if (repliesContainer) {
      repliesContainer.innerHTML = '<div style="color:var(--green);margin-bottom:4px">✓ '+esc(replyName)+': '+esc(reply)+'</div>';
      repliesContainer.classList.add('su');
    }
  }, 1800 + Math.random()*1200);

  toast('✅ Отправлено в Aira — 47 риэлторов видят');
}

function replyAira(btn) {
  var body = btn.closest('.th-body');
  if (!body) return;
  /* Toggle reply form */
  var existing = body.querySelector('.aira-reply-form');
  if (existing) { existing.remove(); return; }
  var form = document.createElement('div');
  form.className = 'aira-reply-form';
  form.style.cssText = 'margin-top:8px;display:flex;gap:6px';
  form.innerHTML =
    '<textarea style="flex:1;padding:7px 10px;border-radius:8px;border:1.5px solid var(--brd);background:var(--bg);font-size:12px;resize:none;min-height:36px;font-family:inherit;color:var(--t1)" placeholder="Ваш ответ..."></textarea>' +
    '<button onclick="submitAiraReply(this)" style="width:36px;height:36px;border-radius:8px;background:var(--orange);color:#fff;font-size:14px;cursor:pointer;flex-shrink:0;align-self:flex-end;display:flex;align-items:center;justify-content:center"><i class="fas fa-paper-plane"></i></button>';
  btn.parentNode.insertBefore(form, btn);
}

function submitAiraReply(btn) {
  if (!curUser) { toast('🔐 Войдите для ответа'); openM('m-auth'); return; }
  var form  = btn.closest('.aira-reply-form');
  var ta    = form && form.querySelector('textarea');
  var txt   = ta ? ta.value.trim() : '';
  if (!txt) return;
  var body  = form.closest('.th-body');
  var repliesEl = body && body.querySelector('[id^="aira-replies-"]');
  var name  = curUser ? curUser.name.split(' ')[0] : 'Я';
  var newDiv = document.createElement('div');
  newDiv.style.cssText = 'color:var(--navy);margin-bottom:4px;font-size:12px';
  newDiv.className = 'su';
  newDiv.textContent = '💬 '+name+': '+txt;
  if (repliesEl) repliesEl.appendChild(newDiv);
  form.remove();
  toast('✅ Ответ отправлен!');
}

function replyThread(btn, realtorId, realtorName) {
  replyAira(btn);
}

function toggleThread(hd) {
  var body = hd.nextElementSibling;
  var ico  = hd.querySelector('.fa-chevron-down');
  if (!body) return;
  var open = body.style.display === 'block';
  body.style.display = open ? 'none' : 'block';
  if (ico) ico.style.transform = open ? '' : 'rotate(180deg)';
}

/* ── CHAT HELPERS ──────────────────────────────────────── */
function addMsg(cid, txt, mine, ini) {
  var c = document.getElementById(cid);
  if (!c) return { remove: function(){} };
  var div = document.createElement('div');
  div.className = 'msg su ' + (mine ? 'me' : 'bot');
  var now = new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
  var fmt = esc(txt).replace(/\n/g,'<br>');
  if (mine) {
    div.innerHTML = '<div class="bwrap"><div class="bubble">'+fmt+'</div><div class="m-ts">'+now+' ✓</div></div>';
  } else {
    div.innerHTML = '<div class="m-ava">'+(ini||'AI')+'</div><div class="bwrap"><div class="bubble">'+fmt+'</div><div class="m-ts">'+now+'</div></div>';
  }
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
  return div;
}

function addTyping(cid, ini) {
  var c = document.getElementById(cid);
  if (!c) return { remove: function(){} };
  var div = document.createElement('div');
  div.className = 'msg bot';
  div.innerHTML = '<div class="m-ava">'+(ini||'F')+'</div><div class="bwrap"><div class="bubble" style="padding:8px 12px"><div class="typing"><div class="td"></div><div class="td"></div><div class="td"></div></div></div></div>';
  c.appendChild(div); c.scrollTop = c.scrollHeight;
  return div;
}

function autoResize(inp) {
  if (!inp) return;
  inp.style.height = 'auto';
  inp.style.height = Math.min(inp.scrollHeight, 88) + 'px';
}

document.addEventListener('input', function(e) {
  if (e.target && (e.target.id === 'flai-inp' || e.target.id === 'aira-inp')) autoResize(e.target);
});

/* ── AI DESCRIBE ───────────────────────────────────────── */
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
    var txtEl = document.getElementById('ai-txt');
    var wrap  = document.getElementById('ai-box-wrap');
    if (txtEl) txtEl.textContent = d.description;
    if (wrap)  wrap.style.display = 'block';
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

/* ── ADD LISTING ───────────────────────────────────────── */
function openAddListing() { openM('m-add'); }

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
  if (!area  || isNaN(parseInt(area)))  { toast('⚠️ Укажите площадь'); return; }
  if (!price || isNaN(parseInt(price))) { toast('⚠️ Укажите цену'); return; }

  /* Extract YouTube ID if URL provided */
  var videoId = '';
  if (videoU) {
    var ym = videoU.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (ym) videoId = ym[1];
  }

  var rooms = parseInt(val('a-rooms')) || 0;
  var rName = curUser ? (curUser.name||'Мой объект') : 'Мой объект';
  var newL = {
    id:          Date.now(),
    type:        type,
    rooms:       rooms,
    area:        parseInt(area),
    district:    val('a-district') || 'Есиль',
    city:        val('a-city')     || 'Астана',
    price:       parseInt(price),
    exchange:    (document.getElementById('a-exch')||{}).checked || false,
    hasVideo:    !!videoId,
    videoId:     videoId,
    realtor:     rName.split(' ').slice(0,2).map(function(w,i){ return i===0?w:w.charAt(0)+'.'; }).join(' '),
    realtorFull: rName,
    realtorId:   curUser ? curUser.id : 'u_new',
    rating:      curUser ? (curUser.rating||5.0) : 5.0,
    deals:       curUser ? (curUser.deals||0) : 0,
    agency:      curUser ? (curUser.agency||'Самозанятый') : 'Самозанятый',
    tags:        [val('a-rooms')+'к', type==='house'?'Дом':'Квартира'],
    badge:       'Новое',
    desc:        val('a-desc') || 'Новый объект. Подробности по запросу.',
    photos:      ['🛋️','🚿','🪟'],
  };
  listings.unshift(newL);
  renderListings(); renderFeed();
  closeM('m-add');
  /* Reset form */
  ['a-area','a-price','a-desc','a-video'].forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
  var w = document.getElementById('ai-box-wrap'); if(w) w.style.display='none';
  toast('🚀 Объект опубликован! Виден в ленте.');
  /* Post to Aira */
  if (curUser) {
    setTimeout(function(){
      addAiraThread('🏠 Новый объект: '+(rooms?rooms+'к ':'')+(type==='apartment'?'квартира':type==='house'?'дом':'коммерция')+', '+val('a-district')+', '+fmtPrice(parseInt(price))+' ₸', 'listing');
    }, 800);
  }
}

/* ── CALENDAR ──────────────────────────────────────────── */
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
    var d   = new Date(e.time);
    var hm  = pad(d.getHours())+':'+pad(d.getMinutes());
    var cl  = colors[e.type] || '#F47B20';
    var ic  = icons[e.type]  || '📅';
    return '<div class="ev-card" onclick="editEvent('+e.id+')">'+
      '<div class="ev-time"><div class="ev-hm">'+hm+'</div></div>'+
      '<div class="ev-line" style="background:'+cl+'"></div>'+
      '<div class="ev-inf">'+
        '<div class="ev-ttl">'+ic+' '+esc(e.title)+'</div>'+
        (e.client?'<div class="ev-cli">👤 '+esc(e.client)+'</div>':'')+
        (e.note  ?'<div class="ev-note">'+esc(e.note)+'</div>':'')+
      '</div>'+
      '<button onclick="event.stopPropagation();deleteEvent('+e.id+')" style="flex-shrink:0;background:none;font-size:14px;color:var(--t3);cursor:pointer;padding:4px">✕</button>'+
    '</div>';
  }

  var html =
    '<div class="cal-title">📅 '+t('nav_obj')+' / Расписание</div>'+
    '<div class="cal-date">'+dStr+'</div>'+
    '<div class="ai-tip"><span style="font-size:18px">🤖</span><span><b>Flai:</b> '+
      (todayEv.length ? 'У вас '+todayEv.length+' событий сегодня. Не забудьте подготовиться!' : 'Сегодня событий нет. Хотите запланировать показ?')+
    '</span></div>'+
    '<button class="add-ev-btn" onclick="openM(\'m-ev\')"><i class="fas fa-plus"></i> Добавить событие</button>';

  if (todayEv.length) html += '<div class="sec-label">Сегодня</div>' + todayEv.map(evHtml).join('');
  else html += '<div style="text-align:center;padding:12px;color:var(--t3);font-size:12px">Сегодня событий нет</div>';
  if (tomEv.length) html += '<div class="sec-label">Завтра</div>' + tomEv.map(evHtml).join('');

  html += '<div style="margin-top:20px"><div class="sec-label">🏆 ТОП РИЭЛТОРОВ</div>' + renderRatingBlock() + '</div>';
  el.innerHTML = html;

  var evd = document.getElementById('ev-date');
  if (evd) evd.value = today.toISOString().split('T')[0];
}

function renderRatingBlock() {
  var list = realtors.length ? realtors.slice().sort(function(a,b){ return b.rating-a.rating; }) : [
    {name:'Сауле Т.',   deals:68, rating:5.0, k:1, color:'#27AE60'},
    {name:'Айгерим К.', deals:47, rating:4.9, k:2, color:'#1E2D5A'},
    {name:'Данияр М.',  deals:32, rating:4.7, k:3, color:'#F47B20'},
    {name:'Асель Б.',   deals:38, rating:4.8, k:4, color:'#E67E22'},
    {name:'Нурлан А.',  deals:23, rating:4.6, k:5, color:'#9B59B6'},
  ];
  var medals = {0:'🥇', 1:'🥈', 2:'🥉'};
  var maxDeals = Math.max.apply(null, list.map(function(r){ return r.deals||1; }));
  return list.slice(0,5).map(function(r, i) {
    var ico = medals[i] || '#'+(i+1);
    var bg  = i===0?'#F47B20':i===1?'#95A5A6':i===2?'#E67E22':'var(--bg3)';
    var tc  = i<=2 ? '#fff' : 'var(--t3)';
    var w   = Math.round((r.deals||1)/maxDeals*100);
    return '<div class="rank-card" onclick="'+(realtors.length?'openRealtorProfile(\''+r.id+'\')':'renderRealtors()')+'">' +
      '<div class="rank-num" style="background:'+bg+';color:'+tc+'">'+ico+'</div>' +
      '<div style="flex:1">' +
        '<div style="font-size:13px;font-weight:700">'+esc(r.name||r.realtorFull||'')+'</div>' +
        '<div class="rank-bar" style="width:'+w+'%"></div>' +
        '<div style="font-size:11px;color:var(--t3);margin-top:3px">'+r.deals+' сделок · ⭐ '+r.rating+'</div>' +
      '</div>' +
    '</div>';
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
  calEvents.push({
    id: Date.now(), title:title,
    time: new Date(date+'T'+time).toISOString(),
    type:type, client:client, note:note
  });
  renderCal(); closeM('m-ev');
  ['ev-title','ev-client','ev-note'].forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
  toast('✅ Добавлено! Flai напомнит за 30 мин 🤖');
}

function editEvent(id) {
  var ev = calEvents.find(function(e){ return e.id===id; });
  if (!ev) return;
  toast('📅 '+ev.title+' · '+new Date(ev.time).toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'}));
}

function deleteEvent(id) {
  calEvents = calEvents.filter(function(e){ return e.id!==id; });
  renderCal();
  toast('🗑️ Событие удалено');
}

/* ── PROFILE ───────────────────────────────────────────── */
function renderProf() {
  var el = document.getElementById('prof-body');
  if (!el) return;
  if (!curUser) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">👤</div><div class="empty-t">Войдите в систему</div><div class="empty-s">Только для верифицированных риэлторов</div><button class="btn-primary" style="max-width:220px;margin:16px auto 0;display:flex" onclick="openM(\'m-auth\')">Войти / Регистрация</button></div>';
    return;
  }
  var ini = (curUser.name||'R').charAt(0).toUpperCase();
  var myListings = listings.filter(function(l){ return l.realtorId === curUser.id; });
  el.innerHTML =
    '<div class="prof-hero">'+
      '<div class="ph-ava">'+ini+'</div>'+
      '<div class="ph-name">'+esc(curUser.name)+'</div>'+
      '<div class="ph-tag">🏠 Верифицированный риэлтор · '+(curUser.agency||'Астана')+'</div>'+
      '<div class="ph-stats">'+
        '<div class="ph-stat"><div class="ph-val">'+myListings.length+'</div><div class="ph-lbl">Объектов</div></div>'+
        '<div class="ph-stat"><div class="ph-val">⭐ '+(curUser.rating||4.8)+'</div><div class="ph-lbl">Рейтинг</div></div>'+
        '<div class="ph-stat"><div class="ph-val">'+(curUser.deals||0)+'</div><div class="ph-lbl">Сделок</div></div>'+
      '</div>'+
    '</div>'+
    '<div class="menu-sec"><div class="menu-lbl">Мои объекты</div>'+
      mItem('🏠','rgba(244,123,32,.1)','Активные объекты',myListings.length+' опубликованы',"toast('📋 '+"+myListings.length+"+'  объектов активно')")+
      mItem('❤️','rgba(231,76,60,.1)', 'Избранное','Сохранённые объекты',"toast('❤️ Избранное — в разработке')")+
    '</div>'+
    '<div class="menu-sec"><div class="menu-lbl">Инструменты</div>'+
      mItem('📅','rgba(39,174,96,.1)', 'Планировщик','Показы и звонки',"go('s-cal');nav(null)")+
      mItem('🏆','rgba(244,123,32,.1)','Рейтинг риэлторов','Моя позиция',"closeM('m-more');go('s-realtors');nav(null);renderRealtors()")+
      mItem('🔄','rgba(39,174,96,.08)','Обмен недвижимостью','Актуальные запросы',"go('s-search');nav(document.getElementById('n-search'));setListTab('exch')")+
      mItem('💡','rgba(244,123,32,.08)','Налоговый советник 2026','Обмен vs продажа',"toast('💡 С 2026 года срок без налога — 2 года!')")+
    '</div>'+
    '<div class="menu-sec"><div class="menu-lbl">Aira — коллеги</div>'+
      mItem('💬','rgba(244,123,32,.1)','Чат риэлторов','47 коллег онлайн',"go('s-aira');nav(null)")+
    '</div>'+
    '<div class="menu-sec"><div class="menu-lbl">Аккаунт</div>'+
      mItem('⚙️','rgba(100,100,200,.08)','Настройки','Профиль, уведомления',"editProfile()")+
      '<div class="menu-item" onclick="doLogout()"><div class="menu-ico" style="background:rgba(231,76,60,.08)">🚪</div><div><div class="menu-name" style="color:#E74C3C">Выйти</div></div></div>'+
    '</div>';
}

function editProfile() {
  if (!curUser) return;
  toast('⚙️ Редактирование профиля — скоро будет!');
}

function mItem(ico, bg, name, sub, action) {
  return '<div class="menu-item" onclick="'+action+'"><div class="menu-ico" style="background:'+bg+'">'+ico+'</div><div style="flex:1"><div class="menu-name">'+name+'</div><div class="menu-sub">'+sub+'</div></div><i class="fas fa-chevron-right" style="color:var(--t3);font-size:11px"></i></div>';
}

/* ── AUTH ──────────────────────────────────────────────── */
function authTab(t) {
  document.getElementById('at-in').classList.toggle('on', t==='in');
  document.getElementById('at-up').classList.toggle('on', t==='up');
  document.getElementById('af-in').style.display = t==='in' ? 'block' : 'none';
  document.getElementById('af-up').style.display = t==='up' ? 'block' : 'none';
}

function doLogin() {
  var email = val('l-email'), pass = val('l-pass');
  if (!email) { toast('⚠️ Введите email'); return; }
  if (!pass)  { toast('⚠️ Введите пароль'); return; }
  fetch('/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:email})})
    .then(function(r){ return r.json(); })
    .then(function(d) {
      if (d.success) {
        curUser = d.user;
        localStorage.setItem('fp_user', JSON.stringify(curUser));
        renderAuthSlot(); closeM('m-auth'); renderProf(); updateAiraBadge();
        toast('👋 Добро пожаловать, '+((curUser.name||'').split(' ')[0]||'риэлтор')+'!');
      }
    }).catch(function(){ toast('⚠️ Ошибка входа'); });
}

function doReg() {
  var name  = val('r-name'), email = val('r-email'), pass = val('r-pass');
  var phone = val('r-phone'), agency = val('r-agency');
  if (!name)  { toast('⚠️ Введите имя'); return; }
  if (!email) { toast('⚠️ Введите email'); return; }
  if (!pass || pass.length < 6) { toast('⚠️ Пароль минимум 6 символов'); return; }
  fetch('/api/auth/register', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:name,email:email,phone:phone,agency:agency})})
    .then(function(r){ return r.json(); })
    .then(function(d) {
      if (d.success) {
        curUser = Object.assign({}, d.user, {name:name, phone:phone, agency:agency||'Самозанятый'});
        localStorage.setItem('fp_user', JSON.stringify(curUser));
        renderAuthSlot(); closeM('m-auth'); renderProf(); updateAiraBadge();
        toast('🎉 Добро пожаловать в Flapy, '+name.split(' ')[0]+'!');
      }
    }).catch(function(){ toast('⚠️ Ошибка регистрации'); });
}

function doLogout() {
  curUser = null; localStorage.removeItem('fp_user');
  renderAuthSlot(); renderProf(); updateAiraBadge();
  toast('👋 До встречи!');
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

/* ── NAVIGATION ────────────────────────────────────────── */
function go(id) {
  document.querySelectorAll('.scr').forEach(function(s){ s.classList.remove('on'); });
  var s = document.getElementById(id); if (s) s.classList.add('on');
  if (id === 's-cal')      { if (!calEvents.length) fetchCalendar(); renderCal(); }
  if (id === 's-prof')     renderProf();
  if (id === 's-search')   renderListings();
  if (id === 's-realtors') renderRealtors();
}

function nav(el) {
  document.querySelectorAll('.nav-it').forEach(function(n){ n.classList.remove('on'); });
  if (el) el.classList.add('on');
}

function showMore() { openM('m-more'); }

/* ── MODALS ────────────────────────────────────────────── */
function openM(id)  { var e=document.getElementById(id); if(e) e.classList.add('on'); }
function closeM(id) { var e=document.getElementById(id); if(e) e.classList.remove('on'); }
function closeOvl(e, id) { if(e.target.id===id) closeM(id); }

/* ── THEME ─────────────────────────────────────────────── */
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

/* ── LANGUAGE ──────────────────────────────────────────── */
function setLang(lang) {
  curLang = lang;
  localStorage.setItem('fp_lang', lang);
  applyLangUI();
  toast(lang==='kz' ? '🇰🇿 Қазақ тілі' : '🇷🇺 Русский');
}

function applyLangUI() {
  var ru = document.getElementById('lo-ru'), kz = document.getElementById('lo-kz');
  if (ru) ru.classList.toggle('on', curLang==='ru');
  if (kz) kz.classList.toggle('on', curLang==='kz');

  /* Update all data-ru/data-kz elements */
  document.querySelectorAll('[data-ru]').forEach(function(el) {
    var val = el.getAttribute('data-'+curLang);
    if (val) el.textContent = val;
  });

  /* Update specific IDs */
  var map = {
    'tx-tagline':     t('tagline'),
    'tx-flai-sub':    t('flai_sub'),
    'tx-flai-status': t('flai_status'),
    'tx-aira-sub':    t('aira_sub'),
    'tx-rel-header':  t('rel_header'),
    'tx-rel-sub':     t('rel_sub'),
    'tx-notif-title': t('notif_title'),
    'tx-menu-title':  t('menu_title'),
    'tx-today':       t('today'),
    'tx-email-lbl':   t('email_lbl'),
    'tx-pass-lbl':    t('pass_lbl'),
    'tx-add-photo':   t('add_photo'),
    'tx-add-video':   t('add_video'),
    'ld-sub':         t('tagline'),
  };
  Object.keys(map).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = map[id];
  });

  /* Buttons with id */
  var btns = {
    'tx-signin-btn':  t('signin_btn'),
    'tx-reg-btn':     t('reg_btn'),
    'tx-publish-btn': t('publish_btn'),
  };
  Object.keys(btns).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = btns[id];
  });

  /* innerHTML for hints */
  var hint = document.getElementById('tx-test-hint');
  if (hint) hint.innerHTML = t('test_hint');
  var reg = document.getElementById('tx-reg-hint');
  if (reg) reg.textContent = t('reg_hint');
  var noAcc = document.getElementById('tx-no-acc');
  if (noAcc) noAcc.textContent = t('no_acc');
  var haveAcc = document.getElementById('tx-have-acc');
  if (haveAcc) haveAcc.textContent = t('have_acc');

  /* Flai welcome messages */
  var fw = document.getElementById('flai-welcome');
  if (fw) fw.innerHTML = t('flai_welcome');
  var fn = fw && fw.parentNode && fw.parentNode.parentNode && fw.parentNode.parentNode.nextElementSibling;
  /* Re-render lists with new language */
  renderListings();
}

/* ── TOAST ─────────────────────────────────────────────── */
function toast(msg, ms) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function(){ el.classList.remove('show'); }, ms||2400);
}

/* ── UTILS ─────────────────────────────────────────────── */
/* ── НОВЫЕ ФУНКЦИИ ДЛЯ FLAPY v6.0 ─────────────────────────── */

// Форматирование цены: 10000000 → 10 000 000
function fmtPrice(p) {
  return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Мягкая проверка авторизации
function needAuth(cb) {
  if (curUser) {
    cb();
  } else {
    toast('🔐 Войдите, чтобы продолжить');
    setTimeout(function() {
      openM('m-auth');
    }, 800);
  }
}

// Pre-filled WhatsApp сообщение
function goChat(listingId) {
  var l = listings.find(function(x) { return x.id === listingId; });
  if (!l) return;
  
  var msg = 'Здравствуйте! Интересует объект на Flapy:\n' +
    (l.rooms ? l.rooms + '-комн., ' : '') +
    l.district + ', ' +
    fmtPrice(l.price) + ' ₸\n' +
    'Когда можно посмотреть?';
  
  var phone = l.phone || '+77012345678';
  var waUrl = 'https://wa.me/' + phone.replace(/\D/g, '') + '?text=' + encodeURIComponent(msg);
  window.open(waUrl, '_blank');
  
  toast('💬 Открыт чат с риэлтором');
}

// Обновленная submitListing с проверкой на риэлтора
function submitListing() {
  // Проверяем, что пользователь — риэлтор
  if (!curUser || !curUser.verified) {
    toast('⚠️ Публикация объектов доступна только верифицированным риэлторам');
    openM('m-auth');
    return;
  }
  
  var type   = val('a-type')     || 'apartment';
  var area   = val('a-area');
  var price  = val('a-price');
  var videoU = val('a-video');
  
  if (!area || isNaN(parseInt(area))) { 
    toast('⚠️ Укажите площадь'); 
    return; 
  }
  if (!price || isNaN(parseInt(price))) { 
    toast('⚠️ Укажите цену'); 
    return; 
  }
  
  // Extract YouTube ID
  var videoId = '';
  if (videoU) {
    var ym = videoU.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (ym) videoId = ym[1];
  }
  
  var rooms = parseInt(val('a-rooms')) || 0;
  var rName = curUser ? (curUser.name || 'Мой объект') : 'Мой объект';
  
  var newL = {
    id:           Date.now(),
    type:         type,
    rooms:        rooms,
    area:         parseInt(area),
    district:     val('a-district') || 'Есиль',
    city:         val('a-city')     || 'Астана',
    price:        parseInt(price),
    exchange:     (document.getElementById('a-exch')||{}).checked || false,
    hasVideo:     !!videoId,
    videoId:      videoId,
    realtor:      rName.split(' ').slice(0,2).map(function(w,i) { return i===0?w:w.charAt(0)+'.'; }).join(' '),
    realtorFull:  rName,
    realtorId:    curUser ? curUser.id : 'u_new',
    rating:       curUser ? (curUser.rating || 5.0) : 5.0,
    deals:        curUser ? (curUser.deals || 0) : 0,
    agency:       curUser ? (curUser.agency || 'Самозанятый') : 'Самозанятый',
    tags:         [val('a-rooms')+'к', type==='house'?'Дом':'Квартира'],
    badge:        'Новое',
    desc:         val('a-desc') || 'Новый объект. Подробности по запросу.',
    photos:       ['🛋️','🚿','🪟'],
  };
  
  listings.unshift(newL);
  renderListings();
  renderFeed();
  closeM('m-add');
  
  // Reset form
  ['a-area','a-price','a-desc','a-video'].forEach(function(id) { 
    var e = document.getElementById(id); 
    if (e) e.value = ''; 
  });
  
  var w = document.getElementById('ai-box-wrap'); 
  if (w) w.style.display = 'none';
  
  toast('🚀 Объект опубликован! Виден в ленте.');
  
  // Post to Aira
  if (curUser) {
    setTimeout(function() {
      addAiraThread('🏠 Новый объект: '+(rooms?rooms+'к ':'')+(type==='apartment'?'квартира':type==='house'?'дом':'коммерция')+', '+val('a-district')+', '+fmtPrice(parseInt(price))+' ₸', 'listing');
    }, 800);
  }
}
function val(id) { var e=document.getElementById(id); return e ? e.value.trim() : ''; }
function esc(s)  { return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function pad(n)  { return String(n).padStart(2,'0'); }
function fmtPrice(p) { return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' '); }
