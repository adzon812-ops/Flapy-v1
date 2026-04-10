/* ═══════════════════════════════════════════════════════════
   FLAPY  app.js  v7.0  — Warm Community Edition
   - Soft onboarding (Browse first → choose role)
   - Aira chat only (Flai hidden)
   - Exchange checkbox + matching
   - Dynamic menu (Guest vs Realtor)
   - Watermark + Legal text
   - Zero critical errors
═══════════════════════════════════════════════════════════ */
'use strict';

/* ── STATE & CONFIG ───────────────────────────────────── */
var listings   = [];
var calEvents  = [];
var realtors   = [];
var curUser    = null;
var curFilter  = 'all';
var curLang    = 'ru';
var listTab    = 'obj';
var curStar    = 0;
var curHireId  = null;
var welcomeSeen = false;

/* ── TRANSLATIONS ──────────────────────────────────────── */
var T = {
  ru: {
    tagline: 'Ваш умный помощник на рынке жилья',
    tab_obj: 'Объекты', tab_exch: 'Обмен',
    filt_all: 'Все', filt_apt: 'Квартиры', filt_house: 'Дома',
    filt_comm: 'Коммерция', filt_video: '🎬 Видео',
    call: 'Позвонить', msg: 'Написать',
    notif_title: 'Уведомления', menu_title: 'Меню',
    today: 'Сегодня',
    email_lbl: 'Email', pass_lbl: 'Пароль',
    signin_btn: 'Войти', reg_btn: 'Зарегистрироваться',
    no_acc: 'Нет аккаунта? Зарегистрироваться',
    have_acc: 'Уже есть аккаунт',
    reg_hint: 'Только для риэлторов — верифицированный статус сразу',
    add_photo: 'Добавить фото', add_video: 'Добавить видео',
    publish_btn: 'Опубликовать',
    chip_desc: '✍️ Описание', chip_mortgage: '🏦 Ипотека',
    chip_promo: '📢 Продвижение', chip_tax: '💡 Налоги',
    chip_show: '📅 Показ', chip_val: '💰 Оценка', chip_exch: '🔄 Обмен',
    welcome_title: 'Добро пожаловать домой',
    welcome_sub: 'Найдите жильё, которое почувствуете своим',
    role_buyer: '👤 Я ищу жильё',
    role_realtor: '🏢 Я риэлтор',
    role_guest: '🤔 Пока просто смотрю',
    soft_title: 'Рад, что вам нравится!',
    soft_text: 'Чтобы мы могли помочь вам дальше:',
    calc_title: '💰 Ипотечный калькулятор',
    calc_price: 'Стоимость', calc_down: 'Первый взнос', calc_term: 'Срок',
    calc_result: 'Ежемесячно', calc_disclaimer: 'Ориентировочный расчёт',
    exch_label: '🔄 Рассмотрю обмен',
    exch_wants: 'Что интересует в обмен',
    exch_extra: 'Доплата', exch_comment: 'Комментарий для риэлторов',
    report_title: 'Помочь с объектом',
    report_options: ['Фото не соответствует','Цена кажется недостоверной','Объект уже продан','Другое'],
    empty_feed: '🏠 Здесь пока тихо',
    empty_feed_sub: 'Хотите добавить первый объект?',
    share_btn: '↗️ Поделиться',
    watermark: 'Flapy',
    privacy_link: 'Политика конфиденциальности',
    terms_link: 'Пользовательское соглашение',
    report_btn: 'Помочь с объектом',
    map_btn: '📍 Показать на карте',
    tiktok_hint: '💡 Хотите больше видео? Подключите TikTok-аккаунт → без лимитов!',
    tiktok_connect: 'Подключить TikTok',
    tiktok_connected: '✓ TikTok подключён',
  },
  kz: {
    tagline: 'Жылжымайтын мүлік нарығындағы ақылды көмекшіңіз',
    tab_obj: 'Объектілер', tab_exch: 'Айырбас',
    filt_all: 'Барлығы', filt_apt: 'Пәтерлер', filt_house: 'Үйлер',
    filt_comm: 'Коммерция', filt_video: '🎬 Бейне',
    call: 'Қоңырау', msg: 'Жазу',
    notif_title: 'Хабарламалар', menu_title: 'Мәзір',
    today: 'Бүгін',
    email_lbl: 'Email', pass_lbl: 'Құпия сөз',
    signin_btn: 'Кіру', reg_btn: 'Тіркелу',
    no_acc: 'Аккаунт жоқ па? Тіркелу',
    have_acc: 'Аккаунт бар',
    reg_hint: 'Тек риэлторлар үшін — расталған мәртебе бірден',
    add_photo: 'Фото қосу', add_video: 'Бейне қосу',
    publish_btn: 'Жариялау',
    chip_desc: '✍️ Сипаттама', chip_mortgage: '🏦 Несие',
    chip_promo: '📢 Жылжыту', chip_tax: '💡 Салықтар',
    chip_show: '📅 Көрсету', chip_val: '💰 Баға', chip_exch: '🔄 Айырбас',
    welcome_title: 'Үйіңізге қош келдіңіз',
    welcome_sub: 'Өзіңіздікі сезінетін тұрғын үй табыңыз',
    role_buyer: '👤 Тұрғын үй іздеймін',
    role_realtor: '🏢 Мен риэлтормын',
    role_guest: '🤔 Әзірге жай ғана қараймын',
    soft_title: 'Ұнағанына қуаныштымыз!',
    soft_text: 'Әрі қарай көмектесу үшін:',
    calc_title: '💰 Ипотека калькуляторы',
    calc_price: 'Құны', calc_down: 'Алғашқы жарна', calc_term: 'Мерзім',
    calc_result: 'Ай сайын', calc_disclaimer: 'Шамамен есептеу',
    exch_label: '🔄 Айырбас қарастырамын',
    exch_wants: 'Айырбасқа не қызығасыз',
    exch_extra: 'Қосымша төлем', exch_comment: 'Риэлторларға комментарий',
    report_title: 'Объектіге көмектесу',
    report_options: ['Сурет сипаттамаға сәйкес емес','Баға сенімсіз','Объект сатылды','Басқа'],
    empty_feed: '🏠 Бұл жерде әзірге тыныш',
    empty_feed_sub: 'Бірінші объектіңізді қосқыңыз келе ме?',
    share_btn: '↗️ Бөлісу',
    watermark: 'Flapy',
    privacy_link: 'Құпиялылық саясаты',
    terms_link: 'Пайдаланушы келісімі',
    report_btn: 'Шағымдану',
    map_btn: '📍 Картада көрсету',
    tiktok_hint: '💡 Көбірек бейне керек пе? TikTok аккаунтын қосыңыз → шектеусіз!',
    tiktok_connect: 'TikTok қосу',
    tiktok_connected: '✓ TikTok қосылған',
  }
};
function t(key) { return (T[curLang] && T[curLang][key]) || (T.ru[key] || key); }

/* ── BOOT ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
  try {
    var s = localStorage.getItem('fp_user');
    if (s) curUser = JSON.parse(s);
  } catch(e) {}

  var th = localStorage.getItem('fp_theme') || 'light';
  applyTheme(th);
  curLang = localStorage.getItem('fp_lang') || 'ru';
  applyLangUI();
  if (curUser) renderAuthSlot();

  setTimeout(function() {
    var ld = document.getElementById('loader');
    if (ld) { ld.style.opacity = '0'; setTimeout(function(){ ld.style.display = 'none'; }, 320); }
    
    if (!localStorage.getItem('fp_onboard_seen')) {
      showWelcomeScreen();
      localStorage.setItem('fp_onboard_seen', 'true');
    } else {
      fetchListings();
      fetchCalendar();
    }
  }, 1200);
});

/* ── WELCOME & SOFT ONBOARDING ────────────────────────── */
function showWelcomeScreen() {
  var overlay = document.createElement('div');
  overlay.id = 'welcome-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:linear-gradient(135deg,#FFFBF7,#FFF3E6);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px;animation:fadeIn .4s ease';
  overlay.innerHTML = `
    <div style="width:80px;height:80px;background:linear-gradient(135deg,#F97316,#FF9A3C);border-radius:20px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;box-shadow:0 8px 24px rgba(249,115,22,.3);animation:float 3s ease-in-out infinite">
      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="white" stroke-width="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
    </div>
    <div style="font-size:24px;font-weight:800;color:#1E2D5A;margin-bottom:8px;animation:slideUp .5s ease .2s both">${t('welcome_title')}</div>
    <div style="font-size:14px;color:#6B7280;margin-bottom:32px;animation:slideUp .5s ease .3s both">${t('welcome_sub')}</div>
    <div style="display:flex;flex-direction:column;gap:12px;width:100%;max-width:320px;animation:slideUp .5s ease .4s both">
      <button onclick="setRole('buyer')" style="padding:14px;border-radius:14px;background:#1E2D5A;color:#fff;font-size:14px;font-weight:700;cursor:pointer;border:none">${t('role_buyer')}</button>
      <button onclick="setRole('realtor')" style="padding:14px;border-radius:14px;background:#F97316;color:#fff;font-size:14px;font-weight:700;cursor:pointer;border:none">${t('role_realtor')}</button>
      <button onclick="setRole('guest')" style="padding:14px;border-radius:14px;background:rgba(30,45,90,.08);color:#1E2D5A;font-size:14px;font-weight:600;cursor:pointer;border:1.5px solid #1E2D5A">${t('role_guest')}</button>
    </div>
    <style>@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}</style>
  `;
  document.body.appendChild(overlay);
}

function setRole(role) {
  var overlay = document.getElementById('welcome-overlay');
  if (overlay) { overlay.style.opacity = '0'; setTimeout(function(){ overlay.remove(); }, 200); }
  if (role === 'realtor' && !curUser) { openM('m-auth'); authTab('up'); return; }
  if (role === 'buyer') toast('✨ Отлично! Сохраняйте понравившиеся объекты ❤️');
  fetchListings();
  fetchCalendar();
}

function showSoftModalIfNeeded() {
  if (curUser || welcomeSeen) return;
  var count = parseInt(localStorage.getItem('fp_views') || '0') + 1;
  localStorage.setItem('fp_views', count);
  if (count >= 5 && !localStorage.getItem('fp_soft_modal')) {
    welcomeSeen = true;
    localStorage.setItem('fp_soft_modal', 'true');
    var modal = document.createElement('div');
    modal.className = 'overlay on';
    modal.id = 'soft-modal';
    modal.onclick = function(e) { if (e.target === modal) closeModal(); };
    modal.innerHTML = `
      <div class="sheet">
        <div class="sh-handle"></div>
        <div class="sh-title">${t('soft_title')}</div>
        <div class="sh-body" style="text-align:center;padding-bottom:20px">
          <p style="color:var(--t2);margin-bottom:20px">${t('soft_text')}</p>
          <div style="display:flex;flex-direction:column;gap:10px">
            <button onclick="setRole('buyer');closeModal()" style="padding:12px;border-radius:12px;background:#1E2D5A;color:#fff;font-weight:700">${t('role_buyer')}</button>
            <button onclick="setRole('realtor');closeModal()" style="padding:12px;border-radius:12px;background:#F97316;color:#fff;font-weight:700">${t('role_realtor')}</button>
            <button onclick="closeModal()" style="padding:10px;border-radius:10px;background:var(--bg3);color:var(--t1);font-weight:600">${t('role_guest')}</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

function closeModal() {
  var m = document.getElementById('soft-modal');
  if (m) { m.classList.remove('on'); setTimeout(function(){ m.remove(); }, 220); }
}

/* ── DATA FETCH ────────────────────────────────────────── */
function fetchListings() {
  fetch('/api/listings')
    .then(r => r.json())
    .then(d => { listings = d.listings || []; renderFeed(); renderListings(); showSoftModalIfNeeded(); })
    .catch(() => { listings = getFallbackListings(); renderFeed(); renderListings(); showSoftModalIfNeeded(); });
}
function fetchCalendar() {
  fetch('/api/calendar')
    .then(r => r.json())
    .then(d => calEvents = d.events || [])
    .catch(() => calEvents = getFallbackCal());
}
function fetchRealtors(cb) {
  fetch('/api/realtors')
    .then(r => r.json())
    .then(d => { realtors = d.realtors || []; if(cb) cb(); })
    .catch(() => { realtors = getFallbackRealtors(); if(cb) cb(); });
}

/* ── FALLBACK DATA ─────────────────────────────────────── */
function getFallbackListings() {
  return [
    {id:1,type:'apartment',rooms:3,area:85,district:'Есильский',city:'Астана',price:62000000,exchange:false,hasVideo:true,videoId:'tgbNymZ7vqY',realtor:'Данияр М.',realtorId:'r2',realtorFull:'Данияр Мусин',rating:4.7,deals:32,agency:'Etagi',tags:['Горящее'],badge:'Горящее',desc:'Отличная 3-комнатная в новом ЖК. Полная отделка, вид на парк.',photos:['🛋️','🚿','🌇'],tiktok:'@realtor_astana'},
    {id:2,type:'house',rooms:5,area:220,district:'Алматинский',city:'Астана',price:150000000,exchange:true,hasVideo:true,videoId:'UxxajLWwzqY',realtor:'Сауле Т.',realtorId:'r3',realtorFull:'Сауле Тлеубекова',rating:5.0,deals:68,agency:'Royal Group',tags:['Обмен'],badge:'Обмен',desc:'Дом с участком 10 соток. Гараж на 2 машины, баня. Рассмотрим обмен!',photos:['🏡','','🏊'],tiktok:'@saule_realty'},
    {id:3,type:'apartment',rooms:2,area:65,district:'Сарыарка',city:'Астана',price:38000000,exchange:true,hasVideo:false,videoId:'',realtor:'Айгерим К.',realtorId:'r1',realtorFull:'Айгерим Касымова',rating:4.9,deals:47,agency:'Century 21',tags:['Обмен'],badge:'Обмен',desc:'Уютная 2-комнатная в тихом дворе. Рядом школа, детский сад.',photos:['🛋️','🚿'],tiktok:''},
  ];
}
function getFallbackRealtors() {
  return [
    {id:'r1',name:'Айгерим Касымова',agency:'Century 21',rating:4.9,deals:47,phone:'+7 701 234 56 78',photo:'А',color:'#1E2D5A',specialization:'Квартиры, новострой',experience:5,verified:true,tiktok:'@aigerim_kz'},
    {id:'r2',name:'Данияр Мусин',agency:'Etagi',rating:4.7,deals:32,phone:'+7 702 345 67 89',photo:'Д',color:'#F47B20',specialization:'Дома, коттеджи',experience:7,verified:true,tiktok:'@daniyar_homes'},
    {id:'r3',name:'Сауле Тлеубекова',agency:'Royal Group',rating:5.0,deals:68,phone:'+7 707 456 78 90',photo:'С',color:'#27AE60',specialization:'Коммерция',experience:9,verified:true,tiktok:'@saule_commercial'},
  ];
}
function getFallbackCal() {
  var t = new Date();
  function dt(d,h,m){return new Date(t.getFullYear(),t.getMonth(),t.getDate()+d,h,m).toISOString();}
  return [
    {id:1,title:'Показ квартиры 3к Есиль',time:dt(0,10,0),type:'showing',client:'Алия С.',note:'Взять ключи от 401',color:'#F47B20'},
    {id:2,title:'Звонок клиенту',time:dt(0,14,30),type:'call',client:'Данияр М.',note:'Обсудить ипотеку Halyk',color:'#27AE60'},
  ];
}

/* ── FEED (TikTok style) ───────────────────────────────── */
var EM = {apartment:'🏢',house:'🏡',commercial:'🏪',land:'🌳'};
var videoPlaying = {};

function renderFeed() {
  var el = document.getElementById('s-feed');
  if (!el) return;
  if (!listings.length) {
    el.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#fff;flex-direction:column;gap:8px"><div style="font-size:48px">🏠</div><div>${t('empty_feed')}</div></div>`;
    return;
  }
  el.innerHTML = listings.map((l,i) => buildFeedCard(l,i)).join('');
}

function buildFeedCard(l, idx) {
  var em = EM[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) + ' ₸' : 'по договору';
  var rm = l.rooms ? l.rooms + 'к · ' : '';
  var ini = (l.realtor || 'R').charAt(0);
  var bgs = {apartment:'135deg,#1a1a40,#0d1b3e',house:'135deg,#1a2e1a,#0d2010',commercial:'135deg,#2e1a0d,#1a0d05',land:'135deg,#1a2e2e,#0d2020'};
  var bg = bgs[l.type] || bgs.apartment;
  var tags = (l.tags||[]).map(tg => `<span class="fc-chip${tg==='Обмен'?' exch':''}">${tg}</span>`).join('');
  var vbadge = l.hasVideo ? `<div class="fc-vbadge"><i class="fas fa-play-circle"></i> Видео</div>` : '';
  var exbadge = l.exchange ? `<div class="fc-exbadge">🔄 Обмен</div>` : '';
  
  var mediaHtml;
  if (l.hasVideo && l.videoId) {
    mediaHtml = `<div class="fc-video" id="fv-${l.id}">
      <img src="https://img.youtube.com/vi/${l.videoId}/hqdefault.jpg" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.style.display='none'">
      <div class="fc-video-tap" onclick="playFeedVideo(${l.id},'${l.videoId}')"></div>
      <div class="fc-play-center" id="fpc-${l.id}" onclick="playFeedVideo(${l.id},'${l.videoId}')"><i class="fas fa-play" style="margin-left:3px"></i></div>
    </div>`;
  } else if (l.tiktok) {
    mediaHtml = `<div class="fc-video" id="fv-${l.id}">
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.3);color:#fff;font-size:12px">🎥 TikTok-видео</div>
      <div class="fc-video-tap" onclick="openTikTok('${l.tiktok}')"></div>
    </div>`;
  } else {
    mediaHtml = `<div class="fc-bg" style="background:linear-gradient(${bg})">${em}</div>`;
  }
  
  var watermark = `<div style="position:absolute;bottom:8px;right:8px;font-size:10px;color:rgba(255,255,255,.6);font-weight:700;pointer-events:none">${t('watermark')} #${l.id}</div>`;
  
  return `<div class="fcard" style="background:linear-gradient(${bg})" id="fc-${l.id}">
    ${mediaHtml}${watermark}
    <div class="fc-overlay"></div>
    ${vbadge}${exbadge}
    <div class="fc-side">
      <div class="sab"><button class="sab-btn" id="hrt-${l.id}" onclick="toggleLike(${l.id},this)"><i class="far fa-heart"></i></button><span class="sab-lbl">0</span></div>
      <div class="sab"><button class="sab-btn" onclick="openDetail(${l.id})"><i class="fas fa-info-circle"></i></button><span class="sab-lbl">Детали</span></div>
      <div class="sab"><button class="sab-btn" onclick="goChat(${l.id})"><i class="fas fa-comment"></i></button><span class="sab-lbl">Чат</span></div>
      <div class="sab"><button class="sab-btn" onclick="shareListing(${l.id})"><i class="fas fa-share-alt"></i></button><span class="sab-lbl">${t('share_btn')}</span></div>
    </div>
    <div class="fc-info">
      <div class="fc-chips">${tags}</div>
      <div class="fc-loc"><i class="fas fa-map-marker-alt"></i>${esc(l.city)}, ${esc(l.district)}</div>
      <div class="fc-title">${rm}${l.area||''} м²</div>
      <div class="fc-price">${pr}</div>
      <div class="fc-desc">${esc(l.desc||'')}</div>
      <div class="fc-realtor">
        <div class="fc-r-ava" style="background:linear-gradient(135deg,#1E2D5A,#4A6FA5)">${ini}</div>
        <div><div class="fc-r-name">${esc(l.realtor||'')}</div><div class="fc-r-sub">★ ${l.rating} · ${esc(l.agency||'')}</div></div>
        <button class="fc-r-btn" onclick="openDetail(${l.id})">Подробнее</button>
      </div>
    </div>
  </div>`;
}

function playFeedVideo(id, videoId) {
  var container = document.getElementById('fv-'+id);
  var playBtn = document.getElementById('fpc-'+id);
  if (!container) return;
  if (videoPlaying[id]) {
    container.querySelector('iframe')?.remove();
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
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&rel=0`;
  iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none';
  iframe.allow = 'autoplay';
  container.appendChild(iframe);
  videoPlaying[id] = true;
}

function openTikTok(username) {
  window.open(`https://www.tiktok.com/@${username.replace('@','')}`, '_blank');
  toast('🎥 Переход в TikTok...');
}

/* ── LISTINGS (Kaspi style) ────────────────────────────── */
function setListTab(tab) {
  listTab = tab;
  document.getElementById('tab-obj').classList.toggle('on', tab==='obj');
  document.getElementById('tab-exch').classList.toggle('on', tab==='exch');
  renderListings();
}
function setFilt(el, f) {
  document.querySelectorAll('.fchip').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  curFilter = f;
  renderListings();
}
function renderListings() {
  var el = document.getElementById('list-body');
  if (!el) return;
  var res = listings.slice();
  if (listTab === 'exch') res = res.filter(l => l.exchange);
  if (curFilter === 'video') res = res.filter(l => l.hasVideo || l.tiktok);
  else if (curFilter !== 'all') res = res.filter(l => l.type === curFilter);
  if (!res.length) {
    el.innerHTML = `<div class="empty"><div class="empty-ico">🔍</div><div class="empty-t">${t('empty_feed')}</div><div class="empty-s">${t('empty_feed_sub')}</div><button class="btn-primary" style="max-width:220px;margin:16px auto 0" onclick="curUser?openAddListing():openM('m-auth')">Добавить объект</button></div>`;
    return;
  }
  el.innerHTML = res.map(buildListCard).join('');
}
function buildListCard(l) {
  var em = EM[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) : '—';
  var rm = l.rooms ? l.rooms+'-комнатная, ' : '';
  var ini = (l.realtor||'R').charAt(0);
  var badgeColor = {Горящее:'#E74C3C',Топ:'#27AE60',Обмен:'#9B59B6'}[l.badge] || '#F47B20';
  var rcol = l.realtorColor || '#1E2D5A';
  
  var mediaHtml;
  if (l.hasVideo && l.videoId) {
    mediaHtml = `<div class="lcard-media" style="cursor:pointer" onclick="event.stopPropagation();openDetail(${l.id})">
      <img src="https://img.youtube.com/vi/${l.videoId}/mqdefault.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.parentNode.querySelector('.lcard-em').style.display='flex';this.style.display='none'">
      <div class="lcard-em" style="display:none">${em}</div>
      <div class="video-thumb"><div class="video-play"><i class="fas fa-play" style="margin-left:3px"></i></div><div class="video-lbl">Видео-тур</div></div>
      <div class="lcard-badge" style="background:${badgeColor}">${l.badge||''}</div>
    </div>`;
  } else if (l.tiktok) {
    mediaHtml = `<div class="lcard-media" style="cursor:pointer;background:linear-gradient(135deg,#000,#222)" onclick="event.stopPropagation();openTikTok('${l.tiktok}')">
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff">
        <i class="fab fa-tiktok" style="font-size:32px;margin-bottom:6px"></i>
        <div style="font-size:11px">TikTok-тур</div>
      </div>
      <div class="lcard-badge" style="background:${badgeColor}">${l.badge||''}</div>
    </div>`;
  } else {
    mediaHtml = `<div class="lcard-media" onclick="openDetail(${l.id})">
      <div class="lcard-em">${em}</div>
      <div class="lcard-badge" style="background:${badgeColor}">${l.badge||''}</div>
    </div>`;
  }
  
  return `<div class="lcard su" onclick="openDetail(${l.id})">
    ${mediaHtml}
    <div class="lcard-body">
      <div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>${esc(l.city)}, ${esc(l.district)}</div>
      <div class="lcard-price">${pr} ₸</div>
      <div class="lcard-sub">${rm}${l.area} м²${l.exchange?' · 🔄 Обмен':''}</div>
      <div class="lcard-tags">${(l.tags||[]).map(tg=>`<span class="ltag${tg==='Обмен'?' exch':''}">${tg}</span>`).join('')}</div>
      <div class="lcard-footer">
        <div class="lf-ava" style="background:${rcol}">${ini}</div>
        <div class="lf-name">${esc(l.realtorFull||l.realtor||'')} · ${esc(l.agency||'')}</div>
        <div class="lf-rating">★ ${l.rating}</div>
      </div>
      <div class="lcard-cta">
        <button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor('${esc(l.phone||'+7 701 234 56 78')}')"><i class="fas fa-phone"></i> ${t('call')}</button>
        <button class="cta-btn cta-msg" onclick="event.stopPropagation();goChat(${l.id})"><i class="fas fa-comment"></i> ${t('msg')}</button>
      </div>
    </div>
  </div>`;
}

/* ── DETAIL MODAL ──────────────────────────────────────── */
function openDetail(id) {
  var l = listings.find(x => x.id === id);
  if (!l) return;
  var em = EM[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) : 'По договору';
  var rmH = l.rooms ? `<div class="det-cell"><div class="det-val">${l.rooms}к</div><div class="det-lbl">Комнат</div></div>` : '';
  var arH = l.area ? `<div class="det-cell"><div class="det-val">${l.area}</div><div class="det-lbl">Площадь м²</div></div>` : '';
  var exH = l.exchange ? `<div style="display:flex;align-items:center;gap:6px;padding:0 17px 8px;font-size:13px;color:#27AE60"><i class="fas fa-exchange-alt"></i><b>Рассмотрю обмен — выгодно в 2026!</b></div>` : '';
  
  var visualHtml;
  if (l.hasVideo && l.videoId) {
    visualHtml = `<div class="det-visual" style="position:relative">
      <img id="det-yt-thumb-${l.id}" src="https://img.youtube.com/vi/${l.videoId}/hqdefault.jpg" style="width:100%;height:100%;object-fit:cover">
      <div id="det-yt-play-${l.id}" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.4);cursor:pointer" onclick="playDetailVideo(${l.id},'${l.videoId}')">
        <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:22px;color:#1E2D5A;margin-bottom:6px"><i class="fas fa-play" style="margin-left:3px"></i></div>
        <div style="color:#fff;font-size:12px;font-weight:600">Смотреть видео-тур</div>
      </div>
      <div id="det-yt-frame-${l.id}" style="display:none;position:absolute;inset:0"></div>
    </div>`;
  } else if (l.tiktok) {
    visualHtml = `<div class="det-visual" style="background:linear-gradient(135deg,#000,#222);cursor:pointer" onclick="openTikTok('${l.tiktok}')">
      <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff">
        <i class="fab fa-tiktok" style="font-size:48px;margin-bottom:8px"></i>
        <div style="font-size:14px;font-weight:600">Смотреть в TikTok</div>
        <div style="font-size:11px;opacity:.8">@${l.tiktok.replace('@','')}</div>
      </div>
    </div>`;
  } else {
    visualHtml = `<div class="det-visual"><div class="det-em-bg">${em}</div></div>`;
  }
  
  var photosHtml = '';
  if (l.photos && l.photos.length) {
    photosHtml = `<div class="det-photos">${l.photos.map((p,i)=>`<div class="det-photo${i===0?' on':''}" onclick="selPhoto(this)">${p}</div>`).join('')}</div>`;
  }
  
  var exchHtml = '';
  if (l.exchange) {
    var matches = listings.filter(x => x.exchange && x.id !== l.id);
    if (matches.length) {
      exchHtml = `<div class="exch-match" onclick="openExchangeModal(${l.id})">
        <div style="font-size:13px;font-weight:700;color:#27AE60;margin-bottom:4px">🔄 Подходящие варианты для обмена (${matches.length})</div>
        <div style="font-size:12px;color:var(--t2)">${matches.map(m=>m.rooms+'к · '+m.district).join(' &nbsp;|&nbsp; ')}</div>
        <div style="font-size:11px;color:#27AE60;margin-top:3px">Нажмите для просмотра →</div>
      </div>`;
    }
  }
  
  var rColor = {r1:'#1E2D5A',r2:'#F47B20',r3:'#27AE60',r4:'#9B59B6',r5:'#E67E22'}[l.realtorId] || '#1E2D5A';
  var realtorHtml = `<div class="det-realtor" onclick="openRealtorProfile('${l.realtorId}')">
    <div class="lf-ava" style="width:38px;height:38px;font-size:14px;background:${rColor}">${esc((l.realtorFull||l.realtor||'R').charAt(0))}</div>
    <div style="flex:1">
      <div style="font-size:13px;font-weight:700">${esc(l.realtorFull||l.realtor||'')}</div>
      <div style="font-size:11px;color:var(--t3)">${esc(l.agency||'')} · ★ ${l.rating} · ${l.deals} сделок</div>
    </div>
    <div style="font-size:11px;color:var(--navy);font-weight:600">Профиль →</div>
  </div>`;
  
  var reportBtn = `<button class="btn-outline" style="margin-top:8px" onclick="openReportModal(${l.id})">⚠️ ${t('report_btn')}</button>`;
  
  document.getElementById('m-det-body').innerHTML = `
    <div class="sh-handle"></div>
    ${visualHtml}
    ${photosHtml}
    <div class="det-price">${pr} ₸</div>
    ${exH}
    <div class="det-grid">${rmH}${arH}
      <div class="det-cell"><div class="det-val">${esc(l.district||'')}</div><div class="det-lbl">Район</div></div>
      <div class="det-cell"><div class="det-val">⭐ ${l.rating}</div><div class="det-lbl">Рейтинг</div></div>
    </div>
    ${exchHtml}
    <div class="det-desc">${(l.desc||'').replace(/\n/g,'<br>')}</div>
    ${realtorHtml}
    <div class="det-cta">
      <button class="det-btn det-call" onclick="callRealtor('${l.phone||'+7 701 234 56 78'}')"><i class="fas fa-phone"></i> Позвонить</button>
      <button class="det-btn det-chat" onclick="closeM('m-det');goChat(${l.id})"><i class="fas fa-comment"></i> Написать</button>
    </div>
    ${curUser ? `<div style="padding:0 17px 4px"><button class="btn-outline" onclick="openHireModal(${l.id})">🤝 Нанять риэлтора</button></div>` : ''}
    ${reportBtn}
    <div style="padding:0 17px 12px;font-size:10px;color:var(--t3);text-align:center">
      <a href="/privacy" style="color:var(--t3)">${t('privacy_link')}</a> · 
      <a href="/terms" style="color:var(--t3)">${t('terms_link')}</a>
    </div>
  `;
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
  frame.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0" style="width:100%;height:100%;border:none" allow="autoplay" allowfullscreen></iframe>`;
}

function selPhoto(el) {
  document.querySelectorAll('.det-photo').forEach(p => p.classList.remove('on'));
  el.classList.add('on');
}

function toggleLike(id, btn) {
  var l = listings.find(x => x.id === id);
  if (!l) return;
  l.liked = !l.liked;
  btn.innerHTML = `<i class="${l.liked?'fas':'far'} fa-heart"></i>`;
  l.liked ? btn.classList.add('liked') : btn.classList.remove('liked');
  var lbl = btn.parentNode?.nextElementSibling;
  if (lbl) lbl.textContent = l.liked ? '1' : '0';
  toast(l.liked ? '❤️ Добавлено в избранное' : '💔 Убрано');
}

function goChat(id) {
  var l = listings.find(x => x.id === id);
  closeM('m-det');
  go('s-aira'); nav(document.getElementById('n-aira'));
  if (l && curUser) {
    setTimeout(function(){
      var inp = document.getElementById('aira-inp');
      if (inp) {
        inp.value = `Интересует объект: ${l.rooms?l.rooms+'к, ':''}${esc(l.district)}, ${fmtPrice(l.price)} ₸`;
        inp.focus(); autoResize(inp);
      }
    }, 200);
  }
}

function callRealtor(phone) {
  toast('📞 Звонок: '+phone);
  setTimeout(function(){ window.location.href = 'tel:'+phone.replace(/\s/g,''); }, 600);
}

function shareListing(id) {
  var l = listings.find(x => x.id === id);
  if (!l) return;
  var url = window.location.href.split('#')[0] + '?obj=' + id;
  if (navigator.share) {
    navigator.share({title: l.desc, text: `${l.rooms}к · ${l.area}м² · ${fmtPrice(l.price)} ₸`, url}).catch(()=>{});
  } else {
    navigator.clipboard.writeText(url);
    toast('🔗 Ссылка скопирована!');
  }
}

/* ── EXCHANGE MODAL ────────────────────────────────────── */
function openExchangeModal(listingId) {
  closeM('m-det');
  var l = listings.find(x => x.id === listingId);
  if (!l) return;
  var matches = listings.filter(x => x.exchange && x.id !== listingId);
  var body = document.getElementById('m-exchange-body');
  if (!body) return;
  body.innerHTML = `
    <div style="padding:0 0 6px"><div style="font-size:13px;color:var(--t2);margin-bottom:12px">Ваш объект: <b>${esc(l.rooms?l.rooms+'к ':'')}</b> · ${esc(l.district)} · ${fmtPrice(l.price)} ₸</div></div>
    <div style="font-size:12px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Подходящие объекты:</div>
    ${matches.map(m => {
      var diff = m.price - l.price;
      var diffTxt = diff > 0 ? ' (+'+fmtPrice(diff)+' ₸ доплата)' : diff < 0 ? ' ('+fmtPrice(-diff)+' ₸ экономия)' : ' (равноценный обмен)';
      return `<div class="lcard" style="margin-bottom:10px;cursor:pointer" onclick="proposeExchangeDeal(${l.id},${m.id})">
        <div class="lcard-body">
          <div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>${esc(m.city)}, ${esc(m.district)}</div>
          <div class="lcard-price">${fmtPrice(m.price)} ₸</div>
          <div class="lcard-sub">${m.rooms?m.rooms+'-комнатная, ':''}${m.area} м²</div>
          <div style="font-size:12px;color:#27AE60;font-weight:600;margin-top:4px">🔄 ${diffTxt}</div>
          <div class="lcard-footer">
            <div class="lf-ava" style="background:#27AE60">${esc((m.realtorFull||m.realtor||'R').charAt(0))}</div>
            <div class="lf-name">${esc(m.realtorFull||'')} · ${esc(m.agency||'')}</div>
            <div class="lf-rating">★ ${m.rating}</div>
          </div>
          <button class="btn-primary" style="margin-top:8px" onclick="event.stopPropagation();proposeExchangeDeal(${l.id},${m.id})">🔄 Предложить обмен</button>
        </div>
      </div>`;
    }).join('')}
    <div class="info-box" style="margin-top:4px"><span>💡</span><span>В 2026 году обмен освобождает от налога с продажи до <b>10–15%</b> от стоимости!</span></div>
  `;
  openM('m-exchange');
}

function proposeExchange(listingId) { openExchangeModal(listingId); }

function proposeExchangeDeal(fromId, toId) {
  var from = listings.find(x => x.id === fromId);
  var to = listings.find(x => x.id === toId);
  if (!from || !to) return;
  closeM('m-exchange');
  if (curUser) {
    setTimeout(function(){
      addAiraThread(`🔄 Обмен: ${esc(from.rooms?from.rooms+'к ':'')}·${esc(from.district)} ↔ ${esc(to.rooms?to.rooms+'к ':'')}·${esc(to.district)}`, 'exchange');
      go('s-aira'); nav(null);
    }, 400);
    toast('🔄 Обмен предложен! Уведомили риэлтора в Aira');
  } else {
    toast('✅ Запрос на обмен отправлен риэлтору!');
  }
}

/* ── AIRA CHAT (WhatsApp-like) ─────────────────────────── */
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

var airaComposeType = 'listing';
function setComposeTab(tab) {
  airaComposeType = tab;
  document.querySelectorAll('.compose-tab').forEach(b => b.classList.remove('on'));
  var el = document.getElementById('ct-'+tab);
  if (el) el.classList.add('on');
  var inp = document.getElementById('aira-inp');
  if (!inp) return;
  var hints = {
    listing: 'Поделитесь объектом с коллегами: 3к, 85м², Есиль, 62 млн...',
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
  var name = curUser ? (curUser.name || 'Риэлтор') : 'Риэлтор';
  var ini = name.charAt(0).toUpperCase();
  var colors = ['linear-gradient(135deg,#1E2D5A,#4A6FA5)','linear-gradient(135deg,#F47B20,#FF9A3C)','linear-gradient(135deg,#27AE60,#2ECC71)'];
  var rndC = colors[Math.floor(Math.random()*colors.length)];
  var typeTag = '';
  if (type === 'exchange') typeTag = `<span style="background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.2);border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;color:#27AE60;margin-left:5px">Обмен</span>`;
  if (type === 'question') typeTag = `<span style="background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.2);border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;color:#F47B20;margin-left:5px">Вопрос</span>`;
  if (type === 'listing') typeTag = `<span style="background:rgba(30,45,90,.1);border:1px solid rgba(30,45,90,.2);border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;color:var(--navy);margin-left:5px">Объект</span>`;
  
  var replies = {
    listing: ['🤝 Есть покупатель! Пишу в личку', '👍 Интересный объект! Комиссию делим?', '📞 Клиент готов к ипотеке, свяжемся?'],
    exchange: ['🔄 Есть похожий вариант! Обсудим', '💡 Хороший обмен! Клиент экономит налог', '✅ Подходящий объект для обмена нашёл!'],
    question: ['💬 Делился опытом: нужен паспорт и СНТ', '📋 КПП — паспорт, справка с работы, СНТ', '🙋 Помогу! Писал по ипотеке в личку'],
  };
  var reply = (replies[type] || replies.listing)[Math.floor(Math.random()*3)];
  var replyNames = ['Данияр М.','Сауле Т.','Айгерим К.','Асель Б.','Нурлан А.'];
  var replyName = replyNames[Math.floor(Math.random()*replyNames.length)];
  
  var list = document.getElementById('aira-list');
  if (!list) return;
  var div = document.createElement('div');
  div.className = 'thread su';
  div.innerHTML = `
    <div class="th-head" onclick="toggleThread(this)">
      <div class="th-ava" style="background:${rndC}">${ini}</div>
      <div style="flex:1">
        <div class="th-name">${esc(name.split(' ')[0])}${typeTag} <span class="th-time">только что</span></div>
        <div class="th-prev">${esc(txt.substring(0,50))}${txt.length>50?'...':''}</div>
      </div>
      <i class="fas fa-chevron-down" style="color:var(--t3);font-size:11px;transition:transform .2s"></i>
    </div>
    <div class="th-body">
      ${type==='listing' ? `<div class="prop-tag"><i class="fas fa-home"></i> ${esc(txt.substring(0,60))}</div>` : ''}
      <p style="font-size:12px;color:var(--t2);margin-bottom:8px">${esc(txt)}</p>
      <div id="aira-replies-${Date.now()}" style="font-size:12px;margin-bottom:8px"></div>
      <div style="display:flex;gap:6px">
        <button onclick="replyAira(this)" style="padding:5px 10px;border-radius:7px;background:var(--navy);color:#fff;font-size:11px;font-weight:600;cursor:pointer">💬 Ответить</button>
        <button onclick="callRealtor('${esc(curUser?curUser.phone||'+7 701 000 00 00':'+7 701 000 00 00')}')" style="padding:5px 10px;border-radius:7px;background:var(--bg3);color:var(--t1);font-size:11px;font-weight:600;cursor:pointer;border:1px solid var(--brd2)">📞 Позвонить</button>
      </div>
    </div>
  `;
  list.insertBefore(div, list.firstChild);
  
  var repliesContainer = div.querySelector('[id^="aira-replies-"]');
  setTimeout(function(){
    if (repliesContainer) {
      repliesContainer.innerHTML = `<div style="color:var(--green);margin-bottom:4px">✓ ${esc(replyName)}: ${esc(reply)}</div>`;
      repliesContainer.classList.add('su');
    }
  }, 1800 + Math.random()*1200);
  
  toast('✅ Отправлено в Aira — 47 риэлторов видят');
}

function replyAira(btn) {
  var body = btn.closest('.th-body');
  if (!body) return;
  var existing = body.querySelector('.aira-reply-form');
  if (existing) { existing.remove(); return; }
  var form = document.createElement('div');
  form.className = 'aira-reply-form';
  form.style.cssText = 'margin-top:8px;display:flex;gap:6px';
  form.innerHTML = `
    <textarea style="flex:1;padding:7px 10px;border-radius:8px;border:1.5px solid var(--brd);background:var(--bg);font-size:12px;resize:none;min-height:36px;font-family:inherit;color:var(--t1)" placeholder="Ваш ответ..."></textarea>
    <button onclick="submitAiraReply(this)" style="width:36px;height:36px;border-radius:8px;background:var(--orange);color:#fff;font-size:14px;cursor:pointer;flex-shrink:0;align-self:flex-end;display:flex;align-items:center;justify-content:center"><i class="fas fa-paper-plane"></i></button>
  `;
  btn.parentNode.insertBefore(form, btn);
}

function submitAiraReply(btn) {
  if (!curUser) { toast('🔐 Войдите для ответа'); openM('m-auth'); return; }
  var form = btn.closest('.aira-reply-form');
  var ta = form?.querySelector('textarea');
  var txt = ta ? ta.value.trim() : '';
  if (!txt) return;
  var body = form.closest('.th-body');
  var repliesEl = body?.querySelector('[id^="aira-replies-"]');
  var name = curUser ? curUser.name.split(' ')[0] : 'Я';
  var newDiv = document.createElement('div');
  newDiv.style.cssText = 'color:var(--navy);margin-bottom:4px;font-size:12px';
  newDiv.className = 'su';
  newDiv.textContent = '💬 '+name+': '+txt;
  if (repliesEl) repliesEl.appendChild(newDiv);
  form.remove();
  toast('✅ Ответ отправлен!');
}

function toggleThread(hd) {
  var body = hd.nextElementSibling;
  var ico = hd.querySelector('.fa-chevron-down');
  if (!body) return;
  var open = body.style.display === 'block';
  body.style.display = open ? 'none' : 'block';
  if (ico) ico.style.transform = open ? '' : 'rotate(180deg)';
}

/* ── CHAT HELPERS ──────────────────────────────────────── */
function addMsg(cid, txt, mine, ini) {
  var c = document.getElementById(cid);
  if (!c) return {remove: function(){}};
  var div = document.createElement('div');
  div.className = 'msg su ' + (mine ? 'me' : 'bot');
  var now = new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'});
  var fmt = esc(txt).replace(/\n/g,'<br>');
  if (mine) {
    div.innerHTML = `<div class="bwrap"><div class="bubble">${fmt}</div><div class="m-ts">${now} ✓</div></div>`;
  } else {
    div.innerHTML = `<div class="m-ava">${ini||'AI'}</div><div class="bwrap"><div class="bubble">${fmt}</div><div class="m-ts">${now}</div></div>`;
  }
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
  return div;
}

function addTyping(cid, ini) {
  var c = document.getElementById(cid);
  if (!c) return {remove: function(){}};
  var div = document.createElement('div');
  div.className = 'msg bot';
  div.innerHTML = `<div class="m-ava">${ini||'F'}</div><div class="bwrap"><div class="bubble" style="padding:8px 12px"><div class="typing"><div class="td"></div><div class="td"></div><div class="td"></div></div></div></div>`;
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
      var localVideos = parseInt(localStorage.getItem('fp_local_videos') || '0');
      if (localVideos >= 3 && !curUser?.tiktokConnected) {
        toast('⚠️ Лимит: 3 видео. Подключите TikTok для безлимита!');
        return;
      }
      localStorage.setItem('fp_local_videos', localVideos + 1);
      toast('🎬 Видео добавлено ('+input.files[0].name+')');
      var videoUrl = document.getElementById('a-video');
      if (videoUrl) videoUrl.value = 'local:'+input.files[0].name;
    }
  };
  input.click();
}

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
    exchange: document.getElementById('a-exch')?.checked || false,
    exchangeDetails: document.getElementById('a-exch-details')?.value || '',
    hasVideo: !!videoId,
    videoId: videoId,
    tiktok: curUser?.tiktok || '',
    realtor: rName.split(' ').slice(0,2).map((w,i)=>i===0?w:w.charAt(0)+'.').join(' '),
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
  renderListings(); renderFeed();
  closeM('m-add');
  
  ['a-area','a-price','a-desc','a-video'].forEach(id=>{var e=document.getElementById(id);if(e)e.value='';});
  var w = document.getElementById('ai-box-wrap'); if(w) w.style.display='none';
  
  toast('🚀 Объект опубликован! Виден в ленте.');
  
  if (curUser) {
    setTimeout(function(){
      addAiraThread(`🏠 Новый объект: ${(rooms?rooms+'к ':'')}${type==='apartment'?'квартира':type==='house'?'дом':'коммерция'}, ${val('a-district')}, ${fmtPrice(parseInt(price))} ₸`, 'listing');
    }, 800);
  }
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
  if (!pass) { toast('⚠️ Введите пароль'); return; }
  
  curUser = {
    id: 'u1',
    name: email.includes('test') ? 'Айгерим Касымова' : 'Риэлтор',
    email: email,
    phone: '+7 701 234 56 78',
    agency: 'Century 21',
    verified: true,
    rating: 4.9,
    deals: 47,
    reviews: 23,
    district: 'Есиль',
    tiktok: '',
    tiktokConnected: false
  };
  
  localStorage.setItem('fp_user', JSON.stringify(curUser));
  renderAuthSlot(); closeM('m-auth'); renderProf(); updateAiraBadge();
  toast('👋 Добро пожаловать, '+(curUser.name.split(' ')[0]||'риэлтор')+'!');
}

function doReg() {
  var name = val('r-name'), email = val('r-email'), pass = val('r-pass');
  var phone = val('r-phone'), agency = val('r-agency'), district = val('r-district');
  if (!name) { toast('⚠️ Введите имя'); return; }
  if (!email) { toast('⚠️ Введите email'); return; }
  if (!pass || pass.length < 6) { toast('⚠️ Пароль минимум 6 символов'); return; }
  
  curUser = {
    id: 'u_'+Date.now(),
    name: name,
    email: email,
    phone: phone,
    agency: agency || 'Самозанятый',
    district: district || 'Есиль',
    verified: true,
    rating: 5.0,
    deals: 0,
    reviews: 0,
    tiktok: '',
    tiktokConnected: false
  };
  
  localStorage.setItem('fp_user', JSON.stringify(curUser));
  renderAuthSlot(); closeM('m-auth'); renderProf(); updateAiraBadge();
  toast('🎉 Добро пожаловать в Flapy, '+name.split(' ')[0]+'!');
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
    var fn = (curUser.name||'Профиль').split(' ')[0];
    slot.innerHTML = `<div class="u-chip" onclick="go('s-prof');nav(null)"><div class="u-ava">${ini}</div><span class="u-nm">${esc(fn)}</span></div>`;
  } else {
    slot.innerHTML = `<button class="login-btn" onclick="openM('m-auth')">Войти</button>`;
  }
}

/* ── NAVIGATION ────────────────────────────────────────── */
function go(id) {
  document.querySelectorAll('.scr').forEach(s => s.classList.remove('on'));
  var s = document.getElementById(id); if (s) s.classList.add('on');
  if (id === 's-cal') { if (!calEvents.length) fetchCalendar(); renderCal(); }
  if (id === 's-prof') renderProf();
  if (id === 's-search') renderListings();
  if (id === 's-realtors') renderRealtors();
  if (id === 's-notif') renderNotif();
  if (id === 's-settings') renderSettings();
}

function nav(el) {
  document.querySelectorAll('.nav-it').forEach(n => n.classList.remove('on'));
  if (el) el.classList.add('on');
}

function showMore() { 
  if (!curUser) { openCalc(); return; } 
  openM('m-more'); 
  renderMoreMenu();
}

function renderMoreMenu() {
  var body = document.getElementById('m-more-body');
  if (!body) return;
  
  if (curUser) {
    body.innerHTML = `
      <div class="more-grid">
        <div class="more-item" onclick="closeM('m-more');go('s-aira');nav(null)">
          <div class="more-ico">💬</div><div class="more-name">Aira</div><div class="more-sub">Чат коллег</div>
        </div>
        <div class="more-item" onclick="closeM('m-more');go('s-prof');nav(null)">
          <div class="more-ico">👤</div><div class="more-name">Профиль</div><div class="more-sub">Мой аккаунт</div>
        </div>
        <div class="more-item" onclick="closeM('m-more');go('s-notif');nav(null)">
          <div class="more-ico">🔔</div><div class="more-name">Уведомления</div><div class="more-sub">3 новых</div>
        </div>
        <div class="more-item" onclick="closeM('m-more');go('s-settings');nav(null)">
          <div class="more-ico">⚙️</div><div class="more-name">Настройки</div><div class="more-sub">Аккаунт, уведомления</div>
        </div>
        <div class="more-item" onclick="closeM('m-more');openCalc()">
          <div class="more-ico">💰</div><div class="more-name">Калькулятор</div><div class="more-sub">Ипотечный расчёт</div>
        </div>
        <div class="more-item" onclick="doLogout();closeM('m-more')">
          <div class="more-ico" style="background:rgba(231,76,60,.08)">🚪</div>
          <div class="more-name" style="color:#E74C3C">Выйти</div>
        </div>
      </div>
    `;
  } else {
    body.innerHTML = `
      <div class="more-grid">
        <div class="more-item" onclick="closeM('m-more');openCalc()">
          <div class="more-ico">💰</div><div class="more-name">Калькулятор</div><div class="more-sub">Ипотечный расчёт</div>
        </div>
        <div class="more-item" onclick="closeM('m-more');window.open('https://wa.me/77012345678','_blank')">
          <div class="more-ico">💬</div><div class="more-name">Помощь</div><div class="more-sub">Написать в WhatsApp</div>
        </div>
        <div class="more-item" onclick="closeM('m-more');window.open('/privacy','_blank')">
          <div class="more-ico">🔐</div><div class="more-name">Политика</div><div class="more-sub">Конфиденциальность</div>
        </div>
        <div class="more-item" onclick="closeM('m-more');openM('m-auth')">
          <div class="more-ico">🔑</div><div class="more-name">Войти</div><div class="more-sub">Для риэлторов</div>
        </div>
      </div>
    `;
  }
}

/* ── MODALS ────────────────────────────────────────────── */
function openM(id) { var e = document.getElementById(id); if (e) e.classList.add('on'); }
function closeM(id) { var e = document.getElementById(id); if (e) e.classList.remove('on'); }
function closeOvl(e, id) { if (e.target.id === id) closeM(id); }

/* ── THEME ─────────────────────────────────────────────── */
function toggleTheme() {
  var cur = document.documentElement.getAttribute('data-theme');
  var next = cur === 'dark' ? 'light' : 'dark';
  applyTheme(next); localStorage.setItem('fp_theme', next);
}

function applyTheme(th) {
  document.documentElement.setAttribute('data-theme', th);
  var btn = document.getElementById('btn-theme');
  if (btn) btn.innerHTML = th === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

/* ── LANGUAGE ──────────────────────────────────────────── */
function setLang(lang) {
  curLang = lang;
  localStorage.setItem('fp_lang', lang);
  applyLangUI();
  toast(lang === 'kz' ? '🇰🇿 Қазақ тілі' : '🇷 Русский');
}

function applyLangUI() {
  var ru = document.getElementById('lo-ru'), kz = document.getElementById('lo-kz');
  if (ru) ru.classList.toggle('on', curLang === 'ru');
  if (kz) kz.classList.toggle('on', curLang === 'kz');
  
  document.querySelectorAll('[data-ru]').forEach(el => {
    var val = el.getAttribute('data-'+curLang);
    if (val) el.textContent = val;
  });
  
  var map = { 'tx-tagline': t('tagline') };
  Object.keys(map).forEach(id => {
    var el = document.getElementById(id);
    if (el) el.textContent = map[id];
  });
  
  var btns = { 'tx-signin-btn': t('signin_btn'), 'tx-reg-btn': t('reg_btn'), 'tx-publish-btn': t('publish_btn') };
  Object.keys(btns).forEach(id => {
    var el = document.getElementById(id);
    if (el) el.textContent = btns[id];
  });
  
  renderListings();
}

/* ── TOAST ─────────────────────────────────────────────── */
function toast(msg, ms) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function(){ el.classList.remove('show'); }, ms || 2400);
}

/* ── UTILS ─────────────────────────────────────────────── */
function val(id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; }
function esc(s) { return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtPrice(p) { return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' '); }

/* ── REPORT MODAL ──────────────────────────────────────── */
function openReportModal(listingId) {
  closeM('m-det');
  var modal = document.createElement('div');
  modal.className = 'overlay on';
  modal.id = 'report-modal';
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div class="sheet">
      <div class="sh-handle"></div>
      <div class="sh-title">${t('report_title')}</div>
      <div class="sh-body">
        <p style="color:var(--t2);margin-bottom:16px">Что беспокоит?</p>
        ${t('report_options').map(opt => `
          <label style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--brd);cursor:pointer">
            <input type="radio" name="report-reason" value="${opt}" style="width:18px;height:18px">
            <span style="font-size:13px">${opt}</span>
          </label>
        `).join('')}
        <textarea class="finput" style="margin-top:12px" placeholder="Дополнительно (необязательно)"></textarea>
        <button class="btn-primary" style="margin-top:16px" onclick="submitReport(${listingId});this.closest('.overlay').remove()">Отправить</button>
        <p style="font-size:11px;color:var(--t3);margin-top:12px;text-align:center">Спасибо, что помогаете делать Flapy лучше. Мы проверим и, если нужно, свяжемся с автором.</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function submitReport(listingId) {
  toast('✅ Спасибо! Мы проверим объект #' + listingId);
}

/* ── PROFILE & CALENDAR & NOTIFICATIONS & SETTINGS ─────── */
function renderProf() {
  var el = document.getElementById('prof-body');
  if (!el) return;
  if (!curUser) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">👤</div><div class="empty-t">Войдите в систему</div><div class="empty-s">Только для верифицированных риэлторов</div><button class="btn-primary" style="max-width:220px;margin:16px auto 0;display:flex" onclick="openM(\'m-auth\')">Войти / Регистрация</button></div>';
    return;
  }
  var ini = (curUser.name||'R').charAt(0).toUpperCase();
  el.innerHTML = `
    <div class="prof-hero">
      <div class="ph-ava">${ini}</div>
      <div class="ph-name">${esc(curUser.name)}</div>
      <div class="ph-tag">🏠 Верифицированный риэлтор · ${curUser.agency || 'Астана'}</div>
      <div class="ph-stats">
        <div class="ph-stat"><div class="ph-val">⭐ ${curUser.rating||4.8}</div><div class="ph-lbl">Рейтинг</div></div>
        <div class="ph-stat"><div class="ph-val">${curUser.deals||0}</div><div class="ph-lbl">Сделок</div></div>
      </div>
    </div>
    <div class="menu-sec"><div class="menu-lbl">Инструменты</div>
      <div class="menu-item" onclick="go('s-cal');nav(null)"><div class="menu-ico" style="background:rgba(39,174,96,.1)">📅</div><div style="flex:1"><div class="menu-name">Планировщик</div><div class="menu-sub">Показы и звонки</div></div><i class="fas fa-chevron-right" style="color:var(--t3);font-size:11px"></i></div>
      <div class="menu-item" onclick="go('s-settings');nav(null)"><div class="menu-ico" style="background:rgba(100,100,200,.08)">⚙️</div><div style="flex:1"><div class="menu-name">Настройки</div><div class="menu-sub">Профиль, уведомления</div></div><i class="fas fa-chevron-right" style="color:var(--t3);font-size:11px"></i></div>
    </div>
    <div class="menu-sec"><div class="menu-lbl">Аккаунт</div>
      <div class="menu-item" onclick="doLogout()"><div class="menu-ico" style="background:rgba(231,76,60,.08)">🚪</div><div><div class="menu-name" style="color:#E74C3C">Выйти</div></div></div>
    </div>
  `;
}

function renderCal() {
  var el = document.getElementById('cal-body');
  if (!el) return;
  var today = new Date();
  var dStr = today.toLocaleDateString('ru',{weekday:'long',day:'numeric',month:'long'});
  var colors = {showing:'#F47B20', call:'#27AE60', deal:'#1E2D5A', meeting:'#9B59B6'};
  var todayEv = calEvents.filter(function(e){ return new Date(e.time).toDateString() === today.toDateString(); });
  
  function evHtml(e) {
    var d = new Date(e.time);
    var hm = String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
    return `<div class="ev-card">
      <div class="ev-time"><div class="ev-hm">${hm}</div></div>
      <div class="ev-line" style="background:${colors[e.type]||'#F47B20'}"></div>
      <div class="ev-inf">
        <div class="ev-ttl">${esc(e.title)}</div>
        ${e.client ?'<div class="ev-cli">👤 '+esc(e.client)+'</div>':''}
      </div>
    </div>`;
  }
  el.innerHTML = `<div class="cal-title">📅 Расписание</div><div class="cal-date">${dStr}</div>` + (todayEv.length ? todayEv.map(evHtml).join('') : '<div style="text-align:center;padding:12px;color:var(--t3);font-size:12px">Сегодня событий нет</div>');
}

function renderNotif() {
  var el = document.getElementById('notif-body');
  if (!el) return;
  el.innerHTML = `
    <div class="notif-wrap">
      <div class="notif-title" id="tx-notif-title">${t('notif_title')}</div>
      <div class="notif-item su"><span class="notif-ico">💬</span><div><div class="notif-txt"><b>Aira:</b> Данияр М. ответил на ваш объект — есть покупатель!</div><div><span class="n-new-dot"></span></div><div class="notif-time">10 мин назад</div></div></div>
      <div class="notif-item su"><span class="notif-ico">❤️</span><div><div class="notif-txt">3 человека добавили ваш объект в избранное</div><div class="notif-time">сегодня</div></div></div>
      <div class="notif-item su" style="border-color:rgba(249,115,22,.25)"><span class="notif-ico">💡</span><div><div class="notif-txt" style="color:var(--orange)">Клиент держит квартиру менее 2 лет — предложите обмен для экономии налога!</div><div class="notif-time">совет дня</div></div></div>
    </div>
  `;
}

function renderSettings() {
  var el = document.getElementById('settings-body');
  if (!el) return;
  if (!curUser) { toast('🔐 Войдите для настроек'); openM('m-auth'); return; }
  el.innerHTML = `
    <div class="sh-handle"></div>
    <div class="sh-title">⚙️ Настройки аккаунта</div>
    <div class="sh-body">
      <div class="menu-sec"><div class="menu-lbl">Профиль</div>
        <div class="menu-item" style="cursor:default"><div class="menu-ico">👤</div><div style="flex:1"><div class="menu-name">${esc(curUser.name)}</div><div class="menu-sub">${curUser.phone||'+7 777 000 00 00'}</div></div></div>
      </div>
      <div class="menu-sec"><div class="menu-lbl">Подключённые сервисы</div>
        <div class="menu-item" style="cursor:default"><div class="menu-ico">🎵</div><div style="flex:1"><div class="menu-name">TikTok</div><div class="menu-sub">${curUser.tiktokConnected ? 'Подключён: '+curUser.tiktok : 'Не подключён'}</div></div>
          <button class="btn-outline" style="width:auto;padding:6px 12px;margin:0" onclick="toast('${curUser.tiktokConnected?'Отключено':'Подключение в разработке'}')">${curUser.tiktokConnected?'Отключить':'Подключить'}</button>
        </div>
      </div>
      <div class="menu-sec"><div class="menu-lbl">Уведомления</div>
        <label style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--brd)"><input type="checkbox" checked style="width:18px;height:18px"><span style="font-size:13px">Новые сообщения (Aira)</span></label>
        <label style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--brd)"><input type="checkbox" checked style="width:18px;height:18px"><span style="font-size:13px">Просмотры моих объектов</span></label>
        <label style="display:flex;align-items:center;gap:10px;padding:10px 0"><input type="checkbox" style="width:18px;height:18px"><span style="font-size:13px">Рекламные рассылки Flapy</span></label>
      </div>
      <div class="menu-sec"><div class="menu-lbl">Безопасность</div>
        <button class="btn-outline" onclick="toast('Пароль изменён')">Сменить пароль</button>
        <button class="btn-outline" style="margin-top:8px;color:#E74C3C;border-color:#E74C3C" onclick="doLogout()">Выйти из аккаунта</button>
      </div>
      <p style="font-size:11px;color:var(--t3);text-align:center;margin-top:16px">💙 Публикуя объект, вы подтверждаете: вы имеете право на размещение, информация достоверна, мы вместе создаём безопасное пространство</p>
    </div>
  `;
  openM('m-settings');
}

/* ── MORTGAGE CALCULATOR ───────────────────────────────── */
function openCalc() {
  var modal = document.createElement('div');
  modal.className = 'overlay on';
  modal.id = 'calc-modal';
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div class="sheet">
      <div class="sh-handle"></div>
      <div class="sh-title">${t('calc_title')}</div>
      <div class="sh-body">
        <label class="flabel">${t('calc_price')}</label>
        <input class="finput" type="number" id="calc-price" placeholder="85000000" value="85000000">
        <label class="flabel">${t('calc_down')}</label>
        <select class="finput" id="calc-down">
          <option value="0.1">10%</option><option value="0.2" selected>20%</option>
          <option value="0.3">30%</option><option value="0.5">50%</option>
        </select>
        <label class="flabel">${t('calc_term')}</label>
        <select class="finput" id="calc-term">
          <option value="10">10 лет</option><option value="15">15 лет</option>
          <option value="20" selected>20 лет</option><option value="25">25 лет</option>
        </select>
        <div id="calc-result" style="background:var(--bg3);border-radius:10px;padding:14px;margin:16px 0;text-align:center">
          <div style="font-size:12px;color:var(--t3)">${t('calc_result')}</div>
          <div style="font-size:24px;font-weight:800;color:var(--navy)" id="calc-monthly">~425 000 ₸</div>
        </div>
        <p style="font-size:11px;color:var(--t3);text-align:center">${t('calc_disclaimer')}</p>
        <button class="btn-primary" style="margin-top:12px" onclick="calcMortgage();this.closest('.overlay').remove()">Рассчитать</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  calcMortgage();
}

function calcMortgage() {
  var price = parseInt(document.getElementById('calc-price')?.value || '85000000');
  var down = parseFloat(document.getElementById('calc-down')?.value || '0.2');
  var years = parseInt(document.getElementById('calc-term')?.value || '20');
  var rate = 0.05;
  var loan = price * (1 - down);
  var months = years * 12;
  var monthly = loan * (rate/12) / (1 - Math.pow(1 + rate/12, -months));
  document.getElementById('calc-monthly').textContent = '~' + fmtPrice(Math.round(monthly)) + ' ₸';
}
