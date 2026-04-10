/* ═══════════════════════════════════════════════════════════
   FLAPY  app.js  v5.2  — Исправленная версия
   - Исправлен баг с зависанием заставки
   - Удален Flai чат
   - Поддержка TikTok ссылок
   - Форматирование цен (10 000 000)
═══════════════════════════════════════════════════════════ */
'use strict'; 

/* ── STATE ─────────────────────────────────────────────── */
var listings = [];
var calEvents = [];
var realtors = [];
var curUser = null;
var curFilter = 'all';
var curLang = 'ru';
var listTab = 'obj';

/* ── TRANSLATIONS ──────────────────────────────────────── */
var T = {
  ru: {
    tagline: 'Ваш умный помощник на рынке жилья',
    tab_obj: 'Объекты',
    tab_exch: 'Обмен',
    filt_all: 'Все',
    filt_apt: 'Квартиры',
    filt_house: 'Дома',
    filt_comm: 'Коммерция',
    filt_video: '🎬 Видео',
    call: 'Позвонить',
    msg: 'Написать',
    aira_sub: '— Чат риэлторов',
    rel_header: 'Риэлторы',
    rel_sub: 'Выберите лучшего специалиста',
    notif_title: 'Уведомления',
    menu_title: 'Меню',
    today: 'Сегодня',
    test_hint: 'Тест: <b>test@realtor.kz</b> / <b>demo123</b>',
    email_lbl: 'Email',
    pass_lbl: 'Пароль',
    signin_btn: 'Войти',
    reg_btn: 'Зарегистрироваться',
    no_acc: 'Нет аккаунта? Зарегистрироваться',
    have_acc: 'Уже есть аккаунт',
    reg_hint: 'Только для риэлторов — верифицированный статус сразу',
    add_photo: 'Добавить фото',
    add_video: 'Добавить видео',
    publish_btn: 'Опубликовать',
    nav_obj: 'Объекты',
    nav_feed: 'Лента',
    nav_more: 'Ещё',
    hire_btn: '🤝 Нанять',
    rooms: 'Комнат',
    area: 'Площадь м²',
    district: 'Район'
  },
  kz: {
    tagline: 'Жылжымайтын мүлік нарығындағы ақылды көмекшіңіз',
    tab_obj: 'Объектілер',
    tab_exch: 'Айырбас',
    filt_all: 'Барлығы',
    filt_apt: 'Пәтерлер',
    filt_house: 'Үйлер',
    filt_comm: 'Коммерция',
    filt_video: '🎬 Бейне',
    call: 'Қоңырау',
    msg: 'Жазу',
    aira_sub: '— Риэлторлар чаты',
    rel_header: 'Риэлторлар',
    rel_sub: 'Ең жақсы маманды таңдаңыз',
    notif_title: 'Хабарламалар',
    menu_title: 'Мәзір',
    today: 'Бүгін',
    test_hint: 'Тест: <b>test@realtor.kz</b> / <b>demo123</b>',
    email_lbl: 'Email',
    pass_lbl: 'Құпия сөз',
    signin_btn: 'Кіру',
    reg_btn: 'Тіркелу',
    no_acc: 'Аккаунт жоқ па? Тіркелу',
    have_acc: 'Аккаунт бар',
    reg_hint: 'Тек риэлторлар үшін — расталған мәртебе бірден',
    add_photo: 'Фото қосу',
    add_video: 'Бейне қосу',
    publish_btn: 'Жариялау',
    nav_obj: 'Объект',
    nav_feed: 'Лента',
    nav_more: 'Тағы',
    hire_btn: '🤝 Жалдау',
    rooms: 'Бөлмелер',
    area: 'Ауданы м²',
    district: 'Аудан'
  }
};

function t(key) {
  return (T[curLang] && T[curLang][key]) || (T.ru[key] || key);
}

/* ── BOOT ──────────────────────────────────────────────── */
window.addEventListener('load', function() {
  try {
    var s = localStorage.getItem('fp_user');
    if (s) curUser = JSON.parse(s);
  } catch(e) {
    console.error('Auth load error', e);
  }
  
  var th = localStorage.getItem('fp_theme') || 'light';
  applyTheme(th);
  curLang = localStorage.getItem('fp_lang') || 'ru';
  applyLangUI();
  
  if (curUser) renderAuthSlot();
  updateNavVisibility();
  
  // Принудительно скрываем загрузчик через 2 секунды
  setTimeout(function() {
    var ld = document.getElementById('loader');
    if (ld) {
      ld.style.opacity = '0';
      setTimeout(function() {
        ld.style.display = 'none';
      }, 300);
    }
    fetchListings();
    fetchCalendar();
  }, 1500);
});

window.addEventListener('DOMContentLoaded', function() {
  var ns = document.getElementById('n-search');
  if (ns) ns.classList.add('on');
  updateAiraBadge();
});

/* ── DATA FETCH ────────────────────────────────────────── */
function fetchListings() {
  fetch('/api/listings')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      listings = d.listings || [];
      renderFeed();
      renderListings();
    })
    .catch(function(e) {
      console.error(e);
      listings = getFallbackListings();
      renderFeed();
      renderListings();
    });
}

function fetchCalendar() {
  fetch('/api/calendar')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      calEvents = d.events || [];
    })
    .catch(function() {
      calEvents = getFallbackCal();
    });
}

function fetchRealtors(cb) {
  fetch('/api/realtors')
    .then(function(r) { return r.json(); })
    .then(function(d) {
      realtors = d.realtors || [];
      if (cb) cb();
    })
    .catch(function() {
      realtors = getFallbackRealtors();
      if (cb) cb();
    });
}

/* ── FALLBACK DATA ─────────────────────────────────────── */
function getFallbackListings() {
  return [
    {
      id: 1,
      type: 'apartment',
      rooms: 3,
      area: 85,
      district: 'Бостандыкский',
      city: 'Алматы',
      price: 10000000,
      exchange: false,
      hasVideo: true,
      videoUrl: 'https://tiktok.com/@example/video/123',
      realtor: 'Айгерим К.',
      realtorId: 'r1',
      realtorFull: 'Айгерим Касымова',
      rating: 4.9,
      deals: 47,
      agency: 'Century 21',
      tags: ['Новострой'],
      badge: 'Новое',
      desc: 'Просторная 3-комнатная.',
      photos: ['🛋️', '']
    },
    {
      id: 2,
      type: 'apartment',
      rooms: 3,
      area: 82,
      district: 'Есильский',
      city: 'Астана',
      price: 62000000,
      exchange: false,
      hasVideo: false,
      videoUrl: '',
      realtor: 'Данияр М.',
      realtorId: 'r2',
      realtorFull: 'Данияр Мусин',
      rating: 4.7,
      deals: 32,
      agency: 'Etagi',
      tags: ['Горящее'],
      badge: 'Горящее',
      desc: 'Отличная 3-комнатная.',
      photos: ['🛋️', '']
    }
  ];
}

function getFallbackRealtors() {
  return [
    {
      id: 'r1',
      name: 'Айгерим Касымова',
      agency: 'Century 21',
      rating: 4.9,
      deals: 47,
      reviews: 23,
      phone: '+7 701 234 56 78',
      photo: 'А',
      color: '#1E2D5A',
      specialization: 'Квартиры',
      experience: 5,
      badge: 'ТОП',
      verified: true
    },
    {
      id: 'r2',
      name: 'Данияр Мусин',
      agency: 'Etagi',
      rating: 4.7,
      deals: 32,
      reviews: 18,
      phone: '+7 702 345 67 89',
      photo: 'Д',
      color: '#F47B20',
      specialization: 'Дома',
      experience: 7,
      badge: '',
      verified: true
    }
  ];
}

function getFallbackCal() {
  var t = new Date();
  function dt(d, h, m) {
    return new Date(t.getFullYear(), t.getMonth(), t.getDate() + d, h, m).toISOString();
  }
  return [
    {
      id: 1,
      title: 'Показ квартиры',
      time: dt(0, 10, 0),
      type: 'showing',
      client: 'Алия С.',
      note: 'Взять ключи',
      color: '#F47B20'
    }
  ];
}

/* ── FEED (TikTok style) ───────────────────────────────── */
var EM = {
  apartment: '🏢',
  house: '🏡',
  commercial: '🏪',
  land: '🌳'
};

function renderFeed() {
  var el = document.getElementById('s-feed');
  if (!el) return;
  
  if (!listings.length) {
    el.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#fff;flex-direction:column;gap:8px"><div style="font-size:48px">🏠</div><div>Загрузка...</div></div>';
    return;
  }
  
  el.innerHTML = listings.map(function(l, i) {
    return buildFeedCard(l, i);
  }).join('');
}

function buildFeedCard(l, idx) {
  var em = EM[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) + ' ₸' : 'по договору';
  var rm = l.rooms ? l.rooms + 'к · ' : '';
  var ini = (l.realtor || 'R').charAt(0);
  var bgs = {
    apartment: '135deg,#1a1a40,#0d1b3e',
    house: '135deg,#1a2e1a,#0d2010',
    commercial: '135deg,#2e1a0d,#1a0d05',
    land: '135deg,#1a2e2e,#0d2020'
  };
  var bg = bgs[l.type] || bgs.apartment;
  var tags = (l.tags || []).map(function(tg) {
    return '<span class="fc-chip' + (tg === 'Обмен' ? ' exch' : '') + '">' + tg + '</span>';
  }).join('');
  var vbadge = l.hasVideo ? '<div class="fc-vbadge"><i class="fas fa-play-circle"></i> Видео</div>' : '';
  var exbadge = l.exchange ? '<div class="fc-exbadge">🔄 Обмен</div>' : '';
  
  var mediaHtml;
  if (l.hasVideo && l.videoUrl) {
    var isTikTok = l.videoUrl.includes('tiktok.com');
    
    if (isTikTok) {
      mediaHtml =
        '<div class="fc-video" id="fv-' + l.id + '">' +
          '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.4);cursor:pointer" onclick="window.open(\'' + l.videoUrl + '\',\'_blank\')">' +
            '<div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:24px;color:#000;margin-bottom:6px"><i class="fab fa-tiktok"></i></div>' +
            '<div style="color:#fff;font-weight:bold">Смотреть в TikTok</div>' +
          '</div>' +
          '<div class="fc-bg">' + em + '</div>' +
        '</div>';
    } else {
      var videoId = '';
      var ym = l.videoUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      if (ym) videoId = ym[1];
      
      if (videoId) {
        mediaHtml =
          '<div class="fc-video" id="fv-' + l.id + '">' +
            '<img src="https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.style.display=\'none\'">' +
            '<div class="fc-video-tap" onclick="playFeedVideo(' + l.id + ',\'' + videoId + '\')"></div>' +
            '<div class="fc-play-center" id="fpc-' + l.id + '" onclick="playFeedVideo(' + l.id + ',\'' + videoId + '\')"><i class="fas fa-play" style="margin-left:3px"></i></div>' +
          '</div>';
      } else {
        mediaHtml = '<div class="fc-bg">' + em + '</div>';
      }
    }
  } else {
    mediaHtml = '<div class="fc-bg">' + em + '</div>';
  }
  
  return (
    '<div class="fcard" style="background:linear-gradient(' + bg + ')" id="fc-' + l.id + '">' +
    mediaHtml +
    '<div class="fc-overlay"></div>' +
    vbadge + exbadge +
    '<div class="fc-side">' +
      '<div class="sab"><button class="sab-btn" onclick="openDetail(' + l.id + ')"><i class="fas fa-info-circle"></i></button><span class="sab-lbl">Детали</span></div>' +
      '<div class="sab"><button class="sab-btn" onclick="go(\'s-aira\');nav(document.getElementById(\'n-aira\'))"><i class="fas fa-comment"></i></button><span class="sab-lbl">Чат</span></div>' +
      '<div class="sab"><button class="sab-btn" onclick="callRealtor(\'' + esc(l.phone || '+7 701 234 56 78') + '\')"><i class="fas fa-phone"></i></button><span class="sab-lbl">Звонок</span></div>' +
    '</div>' +
    '<div class="fc-info">' +
      '<div class="fc-chips">' + tags + '</div>' +
      '<div class="fc-loc"><i class="fas fa-map-marker-alt"></i>' + esc(l.city) + ', ' + esc(l.district) + '</div>' +
      '<div class="fc-title">' + rm + (l.area || '') + ' м²</div>' +
      '<div class="fc-price">' + pr + '</div>' +
      '<div class="fc-desc">' + esc(l.desc || '') + '</div>' +
      '<div class="fc-realtor">' +
        '<div class="fc-r-ava" style="background:linear-gradient(135deg,#1E2D5A,#4A6FA5)">' + ini + '</div>' +
        '<div><div class="fc-r-name">' + esc(l.realtor || '') + '</div><div class="fc-r-sub">' + esc(l.agency || '') + '</div></div>' +
        '<button class="fc-r-btn" onclick="openDetail(' + l.id + ')">Подробнее</button>' +
      '</div>' +
    '</div>' +
    '</div>'
  );
}

function playFeedVideo(id, videoId) {
  var container = document.getElementById('fv-' + id);
  var playBtn = document.getElementById('fpc-' + id);
  if (!container) return;
  
  var img = container.querySelector('img');
  if (img) img.style.display = 'none';
  if (playBtn) playBtn.style.display = 'none';
  
  var iframe = document.createElement('iframe');
  iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&mute=1&controls=1&rel=0';
  iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none';
  iframe.allow = 'autoplay';
  container.appendChild(iframe);
}

/* ── LISTINGS (Kaspi style) ────────────────────────────── */
function setListTab(tab) {
  listTab = tab;
  var tabObj = document.getElementById('tab-obj');
  var tabExch = document.getElementById('tab-exch');
  if (tabObj) tabObj.classList.toggle('on', tab === 'obj');
  if (tabExch) tabExch.classList.toggle('on', tab === 'exch');
  renderListings();
}

function setFilt(el, f) {
  document.querySelectorAll('.fchip').forEach(function(c) {
    c.classList.remove('on');
  });
  el.classList.add('on');
  curFilter = f;
  renderListings();
}

function renderListings() {
  var el = document.getElementById('list-body');
  if (!el) return;
  
  var res = listings.slice();
  if (listTab === 'exch') res = res.filter(function(l) { return l.exchange; });
  if (curFilter === 'video') res = res.filter(function(l) { return l.hasVideo; });
  else if (curFilter !== 'all') res = res.filter(function(l) { return l.type === curFilter; });
  
  if (!res.length) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">🔍</div><div class="empty-t">Ничего не найдено</div><div class="empty-s">Попробуйте другой фильтр</div></div>';
    return;
  }
  
  el.innerHTML = res.map(buildListCard).join('');
}

function buildListCard(l) {
  var em = EM[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) : '—';
  var rm = l.rooms ? l.rooms + '-комнатная, ' : '';
  var ini = (l.realtor || 'R').charAt(0);
  var badgeColor = { 'Горящее': '#E74C3C', 'Топ': '#27AE60', 'Обмен': '#9B59B6' }[l.badge] || '#F47B20';
  var rcol = l.realtorColor || '#1E2D5A';
  
  var mediaHtml;
  if (l.hasVideo && l.videoUrl) {
    var isTikTok = l.videoUrl.includes('tiktok.com');
    var videoId = '';
    if (!isTikTok) {
      var ym = l.videoUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      if (ym) videoId = ym[1];
    }

    if (videoId) {
      mediaHtml =
        '<div class="lcard-media" style="cursor:pointer" onclick="event.stopPropagation();openDetail(' + l.id + ')">' +
          '<img src="https://img.youtube.com/vi/' + videoId + '/mqdefault.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.parentNode.querySelector(\'.lcard-em\').style.display=\'flex\';this.style.display=\'none\'">' +
          '<div class="lcard-em" style="display:none">' + em + '</div>' +
          '<div class="video-thumb">' +
            '<div class="video-play"><i class="fas fa-play" style="margin-left:3px"></i></div>' +
            '<div class="video-lbl">Видео-тур</div>' +
          '</div>' +
          '<div class="lcard-badge" style="background:' + badgeColor + '">' + (l.badge || '') + '</div>' +
        '</div>';
    } else {
      mediaHtml =
        '<div class="lcard-media" onclick="openDetail(' + l.id + ')">' +
          '<div class="lcard-em">' + em + '</div>' +
          '<div class="lcard-badge" style="background:' + badgeColor + '">' + (l.badge || '') + '</div>' +
        '</div>';
    }
  } else {
    mediaHtml =
      '<div class="lcard-media" onclick="openDetail(' + l.id + ')">' +
        '<div class="lcard-em">' + em + '</div>' +
        '<div class="lcard-badge" style="background:' + badgeColor + '">' + (l.badge || '') + '</div>' +
      '</div>';
  }
  
  return (
    '<div class="lcard su" onclick="openDetail(' + l.id + ')">' +
    mediaHtml +
    '<div class="lcard-body">' +
      '<div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>' + esc(l.city) + ', ' + esc(l.district) + '</div>' +
      '<div class="lcard-price">' + pr + ' ₸</div>' +
      '<div class="lcard-sub">' + rm + l.area + ' м²' + (l.exchange ? ' · 🔄 Обмен' : '') + '</div>' +
      '<div class="lcard-tags">' + (l.tags || []).map(function(tg) {
        return '<span class="ltag' + (tg === 'Обмен' ? ' exch' : '') + '">' + tg + '</span>';
      }).join('') + '</div>' +
      '<div class="lcard-footer">' +
        '<div class="lf-ava" style="background:' + rcol + '">' + ini + '</div>' +
        '<div class="lf-name">' + esc(l.realtorFull || l.realtor || '') + ' · ' + esc(l.agency || '') + '</div>' +
      '</div>' +
      '<div class="lcard-cta">' +
        '<button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\'' + esc(l.phone || '+7 701 234 56 78') + '\')"><i class="fas fa-phone"></i> ' + t('call') + '</button>' +
        '<button class="cta-btn cta-msg" onclick="event.stopPropagation();go(\'s-aira\');nav(null)"><i class="fas fa-comment"></i> ' + t('msg') + '</button>' +
      '</div>' +
    '</div>' +
    '</div>'
  );
}

/* ── UTILS ─────────────────────────────────────────────── */
function val(id) {
  var e = document.getElementById(id);
  return e ? e.value.trim() : '';
}

function esc(s) {
  return (s || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function pad(n) {
  return String(n).padStart(2, '0');
}

/* Форматирование цены с пробелами: 10000000 → 10 000 000 */
function fmtPrice(p) {
  return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/* ── NAVIGATION & UI ───────────────────────────────────── */
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

function go(id) {
  document.querySelectorAll('.scr').forEach(function(s) {
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
  if (id === 's-realtors') renderRealtors();
}

function nav(el) {
  document.querySelectorAll('.nav-it').forEach(function(n) {
    n.classList.remove('on');
  });
  if (el) el.classList.add('on');
}

function showMore() {
  if (!curUser) {
    toast('🔐 Войдите как риэлтор');
    openM('m-auth');
    return;
  }
  openM('m-more');
}

function openM(id) {
  var e = document.getElementById(id);
  if (e) e.classList.add('on');
}

function closeM(id) {
  var e = document.getElementById(id);
  if (e) e.classList.remove('on');
}

function closeOvl(e, id) {
  if (e.target.id === id) closeM(id);
}

/* ── THEME & LANG ──────────────────────────────────────── */
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
  toast(lang === 'kz' ? '🇰🇿 Қазақ тілі' : '🇷🇺 Русский');
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

/* ── TOAST ─────────────────────────────────────────────── */
function toast(msg, ms) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(function() {
    el.classList.remove('show');
  }, ms || 2400);
}

/* ── AUTH ──────────────────────────────────────────────── */
function authTab(t) {
  var atIn = document.getElementById('at-in');
  var atUp = document.getElementById('at-up');
  var afIn = document.getElementById('af-in');
  var afUp = document.getElementById('af-up');
  
  if (atIn) atIn.classList.toggle('on', t === 'in');
  if (atUp) atUp.classList.toggle('on', t === 'up');
  if (afIn) afIn.style.display = t === 'in' ? 'block' : 'none';
  if (afUp) afUp.style.display = t === 'up' ? 'block' : 'none';
}

function doLogin() {
  var email = val('l-email');
  var pass = val('l-pass');
  
  if (!email) {
    toast('⚠️ Введите email');
    return;
  }
  
  fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email })
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if (d.success) {
      curUser = d.user;
      localStorage.setItem('fp_user', JSON.stringify(curUser));
      renderAuthSlot();
      closeM('m-auth');
      renderProf();
      updateAiraBadge();
      updateNavVisibility();
      toast('👋 Добро пожаловать, ' + ((curUser.name || '').split(' ')[0] || 'риэлтор') + '!');
    }
  })
  .catch(function() {
    toast('⚠️ Ошибка входа');
  });
}

function doReg() {
  var name = val('r-name');
  var email = val('r-email');
  var pass = val('r-pass');
  var phone = val('r-phone');
  var agency = val('r-agency');
  
  if (!name || !email || pass.length < 6) {
    toast('⚠️ Заполните все поля');
    return;
  }
  
  fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name, email: email, phone: phone, agency: agency })
  })
  .then(function(r) { return r.json(); })
  .then(function(d) {
    if (d.success) {
      curUser = Object.assign({}, d.user, { name: name, phone: phone, agency: agency || 'Самозанятый' });
      localStorage.setItem('fp_user', JSON.stringify(curUser));
      renderAuthSlot();
      closeM('m-auth');
      renderProf();
      updateAiraBadge();
      updateNavVisibility();
      toast('🎉 Добро пожаловать в Flapy, ' + name.split(' ')[0] + '!');
    }
  })
  .catch(function() {
    toast('⚠️ Ошибка регистрации');
  });
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
    var ini = (curUser.name || 'R').charAt(0).toUpperCase();
    var fn = (curUser.name || 'Профиль').split(' ')[0];
    slot.innerHTML = '<div class="u-chip" onclick="go(\'s-prof\');nav(null)"><div class="u-ava">' + ini + '</div><span class="u-nm">' + esc(fn) + '</span></div>';
  } else {
    slot.innerHTML = '<button class="login-btn" onclick="openM(\'m-auth\')">Войти</button>';
  }
}

function needAuth(cb) {
  if (curUser) cb();
  else {
    toast('🔐 Войдите как риэлтор');
    openM('m-auth');
  }
}

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
      toast('📷 ' + input.files.length + ' фото добавлено');
    } else {
      toast('🎬 Видео добавлено (' + input.files[0].name + ')');
      var videoUrl = document.getElementById('a-video');
      if (videoUrl) videoUrl.value = 'local:' + input.files[0].name;
    }
  };
  input.click();
}

function submitListing() {
  var type = val('a-type') || 'apartment';
  var area = val('a-area');
  var price = val('a-price');
  var videoU = val('a-video');
  
  if (!area || isNaN(parseInt(area))) {
    toast('⚠️ Укажите площадь');
    return;
  }
  if (!price || isNaN(parseInt(price))) {
    toast('⚠️ Укажите цену');
    return;
  }
  
  var rooms = parseInt(val('a-rooms')) || 0;
  var rName = curUser ? (curUser.name || 'Мой объект') : 'Мой объект';
  
  var newL = {
    id: Date.now(),
    type: type,
    rooms: rooms,
    area: parseInt(area),
    district: val('a-district') || 'Есиль',
    city: val('a-city') || 'Астана',
    price: parseInt(price),
    exchange: (document.getElementById('a-exch') || {}).checked || false,
    hasVideo: !!videoU,
    videoUrl: videoU,
    realtor: rName.split(' ').slice(0, 2).map(function(w, i) {
      return i === 0 ? w : w.charAt(0) + '.';
    }).join(' '),
    realtorFull: rName,
    realtorId: curUser ? curUser.id : 'u_new',
    rating: curUser ? (curUser.rating || 5.0) : 5.0,
    deals: curUser ? (curUser.deals || 0) : 0,
    agency: curUser ? (curUser.agency || 'Самозанятый') : 'Самозанятый',
    tags: [val('a-rooms') + 'к', type === 'house' ? 'Дом' : 'Квартира'],
    badge: 'Новое',
    desc: val('a-desc') || 'Новый объект. Подробности по запросу.',
    photos: ['🛋️', '🚿', '🪟']
  };
  
  listings.unshift(newL);
  renderListings();
  renderFeed();
  closeM('m-add');
  
  ['a-area', 'a-price', 'a-desc', 'a-video'].forEach(function(id) {
    var e = document.getElementById(id);
    if (e) e.value = '';
  });
  
  toast('🚀 Объект опубликован! Цена: ' + fmtPrice(parseInt(price)) + ' ₸');
  
  if (curUser) {
    setTimeout(function() {
      addAiraThread('🏠 Новый объект: ' + (rooms ? rooms + 'к ' : '') + (type === 'apartment' ? 'квартира' : type === 'house' ? 'дом' : 'коммерция') + ', ' + val('a-district') + ', ' + fmtPrice(parseInt(price)) + ' ₸', 'listing');
    }, 800);
  }
}

/* ── AIRA CHAT ─────────────────────────────────────────── */
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

function sendAira() {
  var inp = document.getElementById('aira-inp');
  var txt = inp ? inp.value.trim() : '';
  
  if (!txt) return;
  if (!curUser) {
    toast('🔐 Войдите, чтобы писать в Aira');
    openM('m-auth');
    return;
  }
  
  inp.value = '';
  addAiraThread(txt, 'listing');
}

function addAiraThread(txt, type) {
  var name = curUser ? (curUser.name || 'Риэлтор') : 'Риэлтор';
  var ini = name.charAt(0).toUpperCase();
  var colors = [
    'linear-gradient(135deg,#1E2D5A,#4A6FA5)',
    'linear-gradient(135deg,#F47B20,#FF9A3C)',
    'linear-gradient(135deg,#27AE60,#2ECC71)'
  ];
  var rndC = colors[Math.floor(Math.random() * colors.length)];
  
  var list = document.getElementById('aira-list');
  if (!list) return;
  
  var div = document.createElement('div');
  div.className = 'thread su';
  div.innerHTML =
    '<div class="th-head" onclick="toggleThread(this)">' +
      '<div class="th-ava" style="background:' + rndC + '">' + ini + '</div>' +
      '<div style="flex:1">' +
        '<div class="th-name">' + esc(name.split(' ')[0]) + ' <span class="th-time">только что</span></div>' +
        '<div class="th-prev">' + esc(txt.substring(0, 50)) + (txt.length > 50 ? '...' : '') + '</div>' +
      '</div>' +
      '<i class="fas fa-chevron-down" style="color:var(--t3);font-size:11px;transition:transform .2s"></i>' +
    '</div>' +
    '<div class="th-body">' +
      '<p style="font-size:12px;color:var(--t2);margin-bottom:8px">' + esc(txt) + '</p>' +
      '<div style="display:flex;gap:6px">' +
        '<button onclick="replyAira(this)" style="padding:5px 10px;border-radius:7px;background:var(--navy);color:#fff;font-size:11px;font-weight:600;cursor:pointer">💬 Ответить</button>' +
      '</div>' +
    '</div>';
  
  list.insertBefore(div, list.firstChild);
  toast('✅ Отправлено в Aira');
}

function replyAira(btn) {
  var body = btn.closest('.th-body');
  if (!body) return;
  
  var existing = body.querySelector('.aira-reply-form');
  if (existing) {
    existing.remove();
    return;
  }
  
  var form = document.createElement('div');
  form.className = 'aira-reply-form';
  form.style.cssText = 'margin-top:8px;display:flex;gap:6px';
  form.innerHTML =
    '<textarea style="flex:1;padding:7px 10px;border-radius:8px;border:1.5px solid var(--brd);background:var(--bg);font-size:12px;resize:none;min-height:36px;font-family:inherit;color:var(--t1)" placeholder="Ваш ответ..."></textarea>' +
    '<button onclick="submitAiraReply(this)" style="width:36px;height:36px;border-radius:8px;background:var(--orange);color:#fff;font-size:14px;cursor:pointer;flex-shrink:0;align-self:flex-end;display:flex;align-items:center;justify-content:center"><i class="fas fa-paper-plane"></i></button>';
  
  btn.parentNode.insertBefore(form, btn);
}

function submitAiraReply(btn) {
  if (!curUser) {
    toast('🔐 Войдите для ответа');
    openM('m-auth');
    return;
  }
  
  var form = btn.closest('.aira-reply-form');
  var ta = form && form.querySelector('textarea');
  var txt = ta ? ta.value.trim() : '';
  
  if (!txt) return;
  
  var body = form.closest('.th-body');
  var repliesEl = body && body.querySelector('[id^="aira-replies-"]');
  var name = curUser ? curUser.name.split(' ')[0] : 'Я';
  
  var newDiv = document.createElement('div');
  newDiv.style.cssText = 'color:var(--navy);margin-bottom:4px;font-size:12px';
  newDiv.className = 'su';
  newDiv.textContent = '💬 ' + name + ': ' + txt;
  
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

/* ── DETAIL MODAL ──────────────────────────────────────── */
function openDetail(id) {
  var l = listings.find(function(x) { return x.id === id; });
  if (!l) return;
  
  var em = EM[l.type] || '🏠';
  var pr = l.price ? fmtPrice(l.price) : 'По договору';
  var rmH = l.rooms ? '<div class="det-cell"><div class="det-val">' + l.rooms + 'к</div><div class="det-lbl">' + t('rooms') + '</div></div>' : '';
  var arH = l.area ? '<div class="det-cell"><div class="det-val">' + l.area + '</div><div class="det-lbl">' + t('area') + '</div></div>' : '';
  var exH = l.exchange ? '<div style="display:flex;align-items:center;gap:6px;padding:0 17px 8px;font-size:13px;color:#27AE60"><i class="fas fa-exchange-alt"></i><b>Рассмотрим обмен — выгодно в 2026!</b></div>' : '';
  
  var visualHtml;
  if (l.hasVideo && l.videoUrl) {
    var isTikTok = l.videoUrl.includes('tiktok.com');
    
    if (isTikTok) {
      visualHtml =
        '<div class="det-visual" style="position:relative">' +
          '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.4);cursor:pointer" onclick="window.open(\'' + l.videoUrl + '\',\'_blank\')">' +
            '<div style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:24px;color:#000;margin-bottom:6px"><i class="fab fa-tiktok"></i></div>' +
            '<div style="color:#fff;font-weight:bold">Смотреть в TikTok</div>' +
          '</div>' +
          '<div class="det-em-bg">' + em + '</div>' +
        '</div>';
    } else {
      var videoId = '';
      var ym = l.videoUrl.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
      if (ym) videoId = ym[1];
      
      if (videoId) {
        visualHtml =
          '<div class="det-visual" style="position:relative">' +
            '<img id="det-yt-thumb-' + l.id + '" src="https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg" style="width:100%;height:100%;object-fit:cover">' +
            '<div id="det-yt-play-' + l.id + '" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.4);cursor:pointer" onclick="playDetailVideo(' + l.id + ',\'' + videoId + '\')">' +
              '<div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:22px;color:#1E2D5A;margin-bottom:6px"><i class="fas fa-play" style="margin-left:3px"></i></div>' +
              '<div style="color:#fff;font-size:12px;font-weight:600">Смотреть видео-тур</div>' +
            '</div>' +
            '<div id="det-yt-frame-' + l.id + '" style="display:none;position:absolute;inset:0"></div>' +
          '</div>';
      } else {
        visualHtml = '<div class="det-visual"><div class="det-em-bg">' + em + '</div></div>';
      }
    }
  } else {
    visualHtml = '<div class="det-visual"><div class="det-em-bg">' + em + '</div></div>';
  }
  
  var photosHtml = '';
  if (l.photos && l.photos.length) {
    photosHtml = '<div class="det-photos">' +
      l.photos.map(function(p, i) {
        return '<div class="det-photo' + (i === 0 ? ' on' : '') + '" onclick="selPhoto(this)">' + p + '</div>';
      }).join('') +
      '</div>';
  }
  
  var rColor = { r1: '#1E2D5A', r2: '#F47B20', r3: '#27AE60', r4: '#9B59B6', r5: '#E67E22' }[l.realtorId] || '#1E2D5A';
  var realtorHtml =
    '<div class="det-realtor" onclick="openRealtorProfile(\'' + l.realtorId + '\')">' +
      '<div class="lf-ava" style="width:38px;height:38px;font-size:14px;background:' + rColor + '">' + esc((l.realtorFull || l.realtor || 'R').charAt(0)) + '</div>' +
      '<div style="flex:1">' +
        '<div style="font-size:13px;font-weight:700">' + esc(l.realtorFull || l.realtor || '') + '</div>' +
        '<div style="font-size:11px;color:var(--t3)">' + esc(l.agency || '') + ' · ' + l.deals + ' сделок</div>' +
      '</div>' +
      '<div style="font-size:11px;color:var(--navy);font-weight:600">Профиль →</div>' +
    '</div>';
  
  var detBody = document.getElementById('m-det-body');
  if (!detBody) return;
  
  detBody.innerHTML =
    '<div class="sh-handle"></div>' +
    visualHtml +
    photosHtml +
    '<div class="det-price">' + pr + ' ₸</div>' +
    exH +
    '<div class="det-grid">' + rmH + arH +
      '<div class="det-cell"><div class="det-val">' + esc(l.district || '') + '</div><div class="det-lbl">' + t('district') + '</div></div>' +
    '</div>' +
    '<div class="det-desc">' + (l.desc || '').replace(/\n/g, '<br>') + '</div>' +
    realtorHtml +
    '<div class="det-cta">' +
      '<button class="det-btn det-call" onclick="callRealtor(\'' + (l.phone || '+7 701 234 56 78') + '\')"><i class="fas fa-phone"></i> Позвонить</button>' +
      '<button class="det-btn det-chat" onclick="closeM(\'m-det\');go(\'s-aira\');nav(null)"><i class="fas fa-comment"></i> Написать</button>' +
    '</div>';
  
  openM('m-det');
}

function playDetailVideo(id, videoId) {
  var thumb = document.getElementById('det-yt-thumb-' + id);
  var play = document.getElementById('det-yt-play-' + id);
  var frame = document.getElementById('det-yt-frame-' + id);
  
  if (!frame) return;
  
  if (thumb) thumb.style.display = 'none';
  if (play) play.style.display = 'none';
  frame.style.display = 'block';
  frame.innerHTML = '<iframe src="https://www.youtube.com/embed/' + videoId + '?autoplay=1&controls=1&rel=0" style="width:100%;height:100%;border:none" allow="autoplay" allowfullscreen></iframe>';
}

function selPhoto(el) {
  document.querySelectorAll('.det-photo').forEach(function(p) {
    p.classList.remove('on');
  });
  el.classList.add('on');
}

/* ── CALENDAR & PROFILE & REALTORS ────────────────────── */
function renderCal() {
  var el = document.getElementById('cal-body');
  if (!el) return;
  
  var today = new Date();
  var dStr = today.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' });
  
  el.innerHTML =
    '<div class="cal-title">📅 ' + t('nav_obj') + ' / Расписание</div>' +
    '<div class="cal-date">' + dStr + '</div>' +
    '<div style="text-align:center;padding:20px;color:var(--t3)">Загрузка событий...</div>';
}

function renderProf() {
  var el = document.getElementById('prof-body');
  if (!el) return;
  
  if (!curUser) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">👤</div><div class="empty-t">Войдите в систему</div><button class="btn-primary" style="max-width:220px;margin:16px auto 0;display:flex" onclick="openM(\'m-auth\')">Войти / Регистрация</button></div>';
    return;
  }
  
  var ini = (curUser.name || 'R').charAt(0).toUpperCase();
  var myListings = listings.filter(function(l) { return l.realtorId === curUser.id; });
  
  el.innerHTML =
    '<div class="prof-hero">' +
      '<div class="ph-ava">' + ini + '</div>' +
      '<div class="ph-name">' + esc(curUser.name) + '</div>' +
      '<div class="ph-tag">🏠 Верифицированный риэлтор · ' + (curUser.agency || 'Астана') + '</div>' +
      '<div class="ph-stats">' +
        '<div class="ph-stat"><div class="ph-val">' + myListings.length + '</div><div class="ph-lbl">Объектов</div></div>' +
        '<div class="ph-stat"><div class="ph-val">⭐ ' + (curUser.rating || 4.8) + '</div><div class="ph-lbl">Рейтинг</div></div>' +
        '<div class="ph-stat"><div class="ph-val">' + (curUser.deals || 0) + '</div><div class="ph-lbl">Сделок</div></div>' +
      '</div>' +
    '</div>' +
    '<div class="menu-sec"><div class="menu-lbl">Аккаунт</div>' +
      '<div class="menu-item" onclick="doLogout()"><div class="menu-ico" style="background:rgba(231,76,60,.08)">🚪</div><div><div class="menu-name" style="color:#E74C3C">Выйти</div></div></div>' +
    '</div>';
}

function renderRealtors() {
  if (!realtors.length) {
    fetchRealtors(function() { renderRealtors(); });
    return;
  }
  
  var el = document.getElementById('realtors-list');
  if (!el) return;
  
  el.innerHTML = realtors.map(function(r) {
    return '<div class="rcard" onclick="openRealtorProfile(\'' + r.id + '\')">' +
      (r.badge ? '<div class="rc-badge">' + r.badge + '</div>' : '') +
      '<div class="rc-ava" style="background:' + r.color + '">' + r.photo + '</div>' +
      '<div style="flex:1">' +
        '<div class="rc-name">' + esc(r.name) + '</div>' +
        '<div class="rc-agency">' + esc(r.agency) + '</div>' +
        '<div class="rc-stars">★ ' + r.rating + ' <span>' + r.reviews + ' отзывов</span></div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function openRealtorProfile(id) {
  toast('Профиль риэлтора ' + id);
}

function callRealtor(phone) {
  toast('📞 Звонок: ' + phone);
  setTimeout(function() {
    window.location.href = 'tel:' + phone.replace(/\s/g, '');
  }, 600);
}

function genAI() {
  toast('🤖 Генерирую описание...');
  setTimeout(function() {
    var txtEl = document.getElementById('ai-txt');
    var wrap = document.getElementById('ai-box-wrap');
    if (txtEl) txtEl.textContent = '✨ Просторная квартира с отличным ремонтом. Развитая инфраструктура, рядом транспорт. Звоните!';
    if (wrap) wrap.style.display = 'block';
    toast('✅ Описание сгенерировано');
  }, 1000);
}

function useAI() {
  var txt = (document.getElementById('ai-txt') || {}).textContent || '';
  var desc = document.getElementById('a-desc');
  if (desc) desc.value = txt;
  var w = document.getElementById('ai-box-wrap');
  if (w) w.style.display = 'none';
  toast('✅ Описание применено');
}
