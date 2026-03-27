// ============================================================
// FLAPY — Main Application JavaScript
// ============================================================

let currentUser = null;
let listings = [];
let currentLang = 'ru';
let currentRole = 'buyer';
let calendarEvents = [];
let activeFilter = 'all';

// ============================================================
// INIT
// ============================================================
window.addEventListener('load', async () => {
  await new Promise(r => setTimeout(r, 1200));
  document.getElementById('loader').style.display = 'none';

  const seen = localStorage.getItem('flapy_onboarded');
  if (!seen) {
    document.getElementById('onboarding').style.display = 'flex';
  } else {
    initApp();
  }

  const saved = localStorage.getItem('flapy_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    updateAuthUI();
  }

  const theme = localStorage.getItem('flapy_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
});

async function initApp() {
  try {
    const res = await fetch('/api/listings');
    const data = await res.json();
    listings = data.listings;
  } catch(e) {
    listings = getMockListings();
  }
  renderFeed();
  renderSearch(listings);
  loadCalendar();
  renderProfile();
}

function finishOnboarding() {
  localStorage.setItem('flapy_onboarded', '1');
  document.getElementById('onboarding').style.display = 'none';
  initApp();
}

// ============================================================
// MOCK DATA (fallback)
// ============================================================
function getMockListings() {
  return [
    { id: 1, type: 'apartment', rooms: 3, area: 85, district: 'Есиль', price: 85000000, exchange: false, media: 'photo', realtorName: 'Айгерим К.', realtorRating: 4.9, realtorId: 'r1', liked: false, description: '🏢 Просторная 3-комнатная квартира 85 м² в Есиле!\n\n🌟 Преимущества:\n• Панорамный вид на Байтерек\n• Свежий ремонт, подземный паркинг\n\n💰 Цена: 85 000 000 ₸', tags: ['новострой', 'ипотека'], color: '#6C63FF' },
    { id: 2, type: 'house', rooms: 5, area: 220, district: 'Алматинский', price: 150000000, exchange: true, media: 'video', realtorName: 'Данияр М.', realtorRating: 4.7, realtorId: 'r2', liked: false, description: '🏡 Роскошный дом 220 м² в Алматинском районе!\n🔄 Рассмотрим обмен!\n\n🌟 Особенности:\n• Участок 10 соток\n• Гараж на 2 машины, баня и беседка\n\n💰 Цена: 150 000 000 ₸', tags: ['обмен', 'срочно'], color: '#FF6584' },
    { id: 3, type: 'commercial', rooms: null, area: 120, district: 'Байконыр', price: 65000000, exchange: false, media: 'photo', realtorName: 'Сауле Т.', realtorRating: 5.0, realtorId: 'r3', liked: false, description: '🏪 Коммерческое помещение 120 м² в Байконыре!\n\n🌟 Идеально для ресторана, офиса или магазина\n\n🚶 Высокий трафик, первая линия!\n💰 Цена: 65 000 000 ₸', tags: ['инвестиция', 'аренда'], color: '#43C6AC' },
    { id: 4, type: 'apartment', rooms: 2, area: 65, district: 'Сарыарка', price: 38000000, exchange: true, media: 'photo', realtorName: 'Нурлан А.', realtorRating: 4.6, realtorId: 'r4', liked: false, description: '🏢 Уютная 2-комнатная 65 м² в Сарыарке!\n🔄 Обмен рассмотрим!\n\n🌟 Плюсы:\n• Рядом школа и детсад\n• Тихий двор\n\n💰 Цена: 38 000 000 ₸', tags: ['обмен', 'ипотека'], color: '#F7971E' },
    { id: 5, type: 'apartment', rooms: 1, area: 42, district: 'Есиль', price: 29000000, exchange: false, media: 'video', realtorName: 'Айгерим К.', realtorRating: 4.9, realtorId: 'r1', liked: false, description: '🏢 Стильная 1-комнатная 42 м² в Есиле!\n\n🌟 Особенности:\n• Смарт-дизайн, встроенная кухня\n• Вид на город\n\n💰 Цена: 29 000 000 ₸', tags: ['студия', 'инвестиция'], color: '#6C63FF' },
  ];
}

// ============================================================
// FEED
// ============================================================
function renderFeed(data) {
  const feed = document.getElementById('feed-screen');
  const items = data || listings;
  feed.innerHTML = items.map((l, i) => buildFeedCard(l, i)).join('');
}

function getTypeEmoji(type) {
  const map = { apartment: '🏢', house: '🏡', commercial: '🏪', land: '🌳' };
  return map[type] || '🏠';
}
function getTypeLabel(type) {
  const map = { apartment: 'Квартира', house: 'Дом', commercial: 'Коммерция', land: 'Участок' };
  return map[type] || type;
}

function buildFeedCard(l, i) {
  const typeLabel = getTypeLabel(l.type);
  const typeEmoji = getTypeEmoji(l.type);
  const priceFormatted = l.price ? (l.price / 1000000).toFixed(1) + ' млн ₸' : 'по договору';
  const rooms = l.rooms ? l.rooms + ' комн.' : '';
  const area = l.area ? l.area + ' м²' : '';

  const tagBadges = (l.tags || []).map(function(t) {
    let cls = 'feed-tag';
    if (t === 'обмен' || t === 'exchange') cls += ' exchange';
    if (t === 'срочно') cls += ' urgent';
    return '<span class="' + cls + '">' + t + '</span>';
  }).join('');

  const mediaBadge = l.media === 'video'
    ? '<div class="media-badge"><i class="fas fa-play-circle"></i> Видео</div>'
    : '';
  const exchangeRibbon = l.exchange
    ? '<div class="exchange-ribbon">🔄 Обмен</div>'
    : '';
  const realtorInitial = (l.realtorName || 'R').charAt(0);
  const starsCount = Math.floor(l.realtorRating || 5);
  const stars = '★'.repeat(starsCount);
  const likeClass = l.liked ? 'feed-action-btn liked' : 'feed-action-btn';
  const heartIcon = l.liked ? 'fas fa-heart' : 'far fa-heart';
  const likeCount = l.liked ? 1 : 0;
  const descFormatted = (l.description || '').replace(/\n/g, '<br>');

  return '<div class="feed-card" id="card-' + l.id + '" style="background:' + l.color + '18">' +
    '<div class="feed-bg">' + typeEmoji + '</div>' +
    '<div class="feed-gradient"></div>' +
    mediaBadge +
    exchangeRibbon +
    '<div class="feed-actions">' +
      '<button class="' + likeClass + '" onclick="toggleLike(' + l.id + ', this)" id="like-' + l.id + '">' +
        '<i class="' + heartIcon + '"></i>' +
        '<span class="feed-action-count">' + likeCount + '</span>' +
      '</button>' +
      '<button class="feed-action-btn" onclick="openDetail(' + l.id + ')">' +
        '<i class="fas fa-expand-alt"></i>' +
        '<span class="feed-action-count">Детали</span>' +
      '</button>' +
      '<button class="feed-action-btn" onclick="openChat(' + l.id + ')">' +
        '<i class="fas fa-comment"></i>' +
        '<span class="feed-action-count">Чат</span>' +
      '</button>' +
      '<button class="feed-action-btn" onclick="callRealtor(\'' + l.realtorName + '\')">' +
        '<i class="fas fa-phone"></i>' +
        '<span class="feed-action-count">Звонок</span>' +
      '</button>' +
    '</div>' +
    '<div class="feed-content">' +
      '<div class="feed-tag-row">' + tagBadges + '</div>' +
      '<div class="feed-type-badge">' + typeEmoji + ' ' + typeLabel + ' · ' + rooms + ' ' + area + '</div>' +
      '<div class="feed-title">' + (l.district || 'Астана') + '</div>' +
      '<div class="feed-price">' + priceFormatted + '</div>' +
      '<div class="feed-desc">' + descFormatted + '</div>' +
      '<div class="feed-realtor">' +
        '<div class="realtor-ava">' + realtorInitial + '</div>' +
        '<div class="realtor-info">' +
          '<div class="realtor-name">' + (l.realtorName || 'Риэлтор') + '</div>' +
          '<div class="realtor-stars">' + stars + ' ' + l.realtorRating + '</div>' +
        '</div>' +
        '<button class="btn-outline" style="padding:6px 14px;font-size:12px" onclick="openRatingModal()">Профиль</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function toggleLike(id, btn) {
  const l = listings.find(function(x) { return x.id === id; });
  if (!l) return;
  l.liked = !l.liked;
  const heartIcon = l.liked ? 'fas fa-heart' : 'far fa-heart';
  btn.innerHTML = '<i class="' + heartIcon + '"></i><span class="feed-action-count">' + (l.liked ? 1 : 0) + '</span>';
  if (l.liked) btn.classList.add('liked'); else btn.classList.remove('liked');
  showToast(l.liked ? '❤️ Добавлено в избранное' : '💔 Убрано из избранного');
}

function openDetail(id) {
  const l = listings.find(function(x) { return x.id === id; });
  if (!l) return;
  const typeEmoji = getTypeEmoji(l.type);
  const sheet = document.getElementById('detail-modal-sheet');
  const priceText = l.price ? (l.price / 1000000).toFixed(1) + ' млн ₸' : 'По договору';
  const exchangeHtml = l.exchange ? '<div class="detail-exchange"><i class="fas fa-exchange-alt"></i> Обмен</div>' : '';
  const roomsHtml = l.rooms ? '<div class="detail-info-item"><div class="detail-info-val">' + l.rooms + 'к</div><div class="detail-info-lbl">Комнаты</div></div>' : '';
  const areaHtml = l.area ? '<div class="detail-info-item"><div class="detail-info-val">' + l.area + '</div><div class="detail-info-lbl">Площадь м²</div></div>' : '';
  const descFormatted = (l.description || '').replace(/\n/g, '<br>');

  sheet.innerHTML =
    '<div class="modal-handle"></div>' +
    '<div class="detail-img" style="background:' + l.color + '22">' + typeEmoji + '</div>' +
    '<div class="detail-price-row">' +
      '<div class="detail-price">' + priceText + '</div>' +
      exchangeHtml +
    '</div>' +
    '<div class="detail-info-grid">' +
      roomsHtml + areaHtml +
      '<div class="detail-info-item"><div class="detail-info-val">' + (l.district || 'Астана') + '</div><div class="detail-info-lbl">Район</div></div>' +
      '<div class="detail-info-item"><div class="detail-info-val">⭐ ' + l.realtorRating + '</div><div class="detail-info-lbl">Рейтинг</div></div>' +
    '</div>' +
    '<div class="detail-desc">' + descFormatted + '</div>' +
    '<div class="detail-cta">' +
      '<button class="cta-call" onclick="callRealtor(\'' + l.realtorName + '\')"><i class="fas fa-phone"></i> Позвонить</button>' +
      '<button class="cta-chat" onclick="closeModal(\'detail-modal\');showScreen(\'flai-screen\');setNav(document.getElementById(\'nav-flai\'))"><i class="fas fa-comment"></i> Написать</button>' +
    '</div>';
  openModal('detail-modal');
}

function openChat(id) {
  showScreen('flai-screen');
  setNav(document.getElementById('nav-flai'));
  const l = listings.find(function(x) { return x.id === id; });
  if (l) showToast('💬 Открыт чат по объекту: ' + l.district);
}

function callRealtor(name) {
  showToast('📞 Звонок риэлтору ' + name + '...');
}

// ============================================================
// SEARCH
// ============================================================
function setFilter(el, filter) {
  document.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
  el.classList.add('active');
  activeFilter = filter;
  doSearch();
}

function doSearch() {
  const searchEl = document.getElementById('search-input');
  const q = searchEl ? searchEl.value.toLowerCase() : '';
  let results = listings.slice();

  if (activeFilter && activeFilter !== 'all') {
    if (activeFilter === 'exchange') {
      results = results.filter(function(l) { return l.exchange; });
    } else if (activeFilter === 'video') {
      results = results.filter(function(l) { return l.media === 'video'; });
    } else if (['apartment','house','commercial','land'].indexOf(activeFilter) >= 0) {
      results = results.filter(function(l) { return l.type === activeFilter; });
    } else {
      results = results.filter(function(l) {
        return (l.district || '').toLowerCase().indexOf(activeFilter.toLowerCase()) >= 0;
      });
    }
  }

  if (q) {
    results = results.filter(function(l) {
      return (l.district || '').toLowerCase().indexOf(q) >= 0 ||
        (l.description || '').toLowerCase().indexOf(q) >= 0 ||
        (l.realtorName || '').toLowerCase().indexOf(q) >= 0 ||
        (l.tags || []).some(function(t) { return t.toLowerCase().indexOf(q) >= 0; });
    });
  }
  renderSearch(results);
}

function renderSearch(results) {
  const el = document.getElementById('search-results');
  if (!el) return;
  if (!results.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">Ничего не найдено</div><div class="empty-sub">Попробуйте другой запрос</div></div>';
    return;
  }
  el.innerHTML = results.map(function(l) {
    const typeEmoji = getTypeEmoji(l.type);
    const priceText = l.price ? (l.price / 1000000).toFixed(1) + ' млн ₸' : '—';
    const roomsText = l.rooms ? l.rooms + 'к · ' : '';
    const exchangeIcon = l.exchange ? ' · 🔄' : '';
    return '<div class="rating-card" style="cursor:pointer;margin-bottom:10px" onclick="openDetail(' + l.id + ')">' +
      '<div style="width:54px;height:54px;border-radius:16px;background:' + l.color + '33;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0">' + typeEmoji + '</div>' +
      '<div style="flex:1">' +
        '<div style="font-size:15px;font-weight:700">' + roomsText + l.area + 'м² · ' + l.district + '</div>' +
        '<div style="font-size:13px;color:var(--accent4);font-weight:700;margin:2px 0">' + priceText + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted)">' + l.realtorName + ' · ⭐ ' + l.realtorRating + exchangeIcon + '</div>' +
      '</div>' +
      '<i class="fas fa-chevron-right" style="color:var(--text-muted)"></i>' +
    '</div>';
  }).join('');
}

// ============================================================
// AI DESCRIPTION
// ============================================================
async function generateAIDesc() {
  const type = document.getElementById('add-type').value;
  const rooms = document.getElementById('add-rooms').value;
  const area = document.getElementById('add-area').value;
  const district = document.getElementById('add-district').value;
  const price = document.getElementById('add-price').value;
  const exchange = document.getElementById('add-exchange').checked;

  showToast('🤖 AI генерирует описание...');

  try {
    const res = await fetch('/api/ai/describe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, rooms, area, district, price, exchange })
    });
    const data = await res.json();
    document.getElementById('ai-text').textContent = data.description;
    document.getElementById('ai-preview').style.display = 'block';
  } catch(e) {
    showToast('⚠️ Ошибка генерации');
  }
}

function updateAIPreview(force) {
  if (document.getElementById('ai-preview').style.display === 'block' || force) {
    generateAIDesc();
  }
}

function useAIText() {
  const text = document.getElementById('ai-text').textContent;
  document.getElementById('add-desc').value = text;
  document.getElementById('ai-preview').style.display = 'none';
  showToast('✅ Описание применено');
}

async function submitListing() {
  showToast('🚀 Объект опубликован!');
  closeModal('add-listing-modal');
  try {
    const res = await fetch('/api/listings');
    const data = await res.json();
    listings = data.listings;
  } catch(e) {}
  renderFeed();
  renderSearch(listings);
}

// ============================================================
// CALENDAR
// ============================================================
async function loadCalendar() {
  try {
    const res = await fetch('/api/calendar');
    const data = await res.json();
    calendarEvents = data.events;
  } catch(e) {
    calendarEvents = getMockCalendar();
  }
  renderCalendar();
}

function getMockCalendar() {
  const today = new Date();
  return [
    { id: 1, title: '🏠 Показ квартиры — Есиль', time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(), type: 'showing', client: 'Алия С.', note: 'Взять ключи заранее' },
    { id: 2, title: '📞 Звонок клиенту', time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 30).toISOString(), type: 'call', client: 'Данияр М.', note: 'Обсудить условия' },
    { id: 3, title: '✍️ Подписание договора', time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0).toISOString(), type: 'deal', client: 'Нурсулу К.', note: 'Проверить документы заранее' },
    { id: 4, title: '🏢 Показ коммерции — Байконыр', time: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 15, 0).toISOString(), type: 'showing', client: 'Бизнес-клиент', note: 'Взять план помещения' },
  ];
}

function renderCalendar() {
  const el = document.getElementById('calendar-content');
  if (!el) return;
  const today = new Date();
  const todayStr = today.toLocaleDateString('ru', { weekday: 'long', day: 'numeric', month: 'long' });
  const typeColors = { showing: '#6C63FF', call: '#43C6AC', deal: '#FF6584', meeting: '#F7971E' };

  function sameDay(d1, d2) {
    return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  }

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayEvents = calendarEvents.filter(function(e) { return sameDay(new Date(e.time), today); });
  const tomorrowEvents = calendarEvents.filter(function(e) { return sameDay(new Date(e.time), tomorrow); });

  function renderEvent(e) {
    const d = new Date(e.time);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const color = typeColors[e.type] || '#6C63FF';
    return '<div class="event-card" onclick="showToast(\'📅 ' + (e.client || '') + '\')">' +
      '<div class="event-time-block"><div class="event-time">' + h + ':' + m + '</div></div>' +
      '<div style="width:3px;border-radius:2px;background:' + color + ';align-self:stretch;flex-shrink:0"></div>' +
      '<div class="event-info">' +
        '<div class="event-title">' + e.title + '</div>' +
        (e.client ? '<div class="event-client">👤 ' + e.client + '</div>' : '') +
        (e.note ? '<div class="event-note">💭 ' + e.note + '</div>' : '') +
      '</div>' +
    '</div>';
  }

  let html = '<div class="calendar-header">' +
    '<div class="calendar-title">📅 Расписание</div>' +
    '<div class="calendar-subtitle">' + todayStr + '</div>' +
  '</div>' +
  '<div class="notification-banner" style="border-color:rgba(108,99,255,0.3)">' +
    '<span class="notif-icon">🤖</span>' +
    '<span><b>Flai:</b> У вас показ сегодня в 10:00. Удачи! 🏠✨</span>' +
  '</div>' +
  '<button class="add-event-btn" onclick="openAddEvent()"><i class="fas fa-plus"></i> Добавить событие</button>';

  if (todayEvents.length) {
    html += '<div style="font-size:13px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Сегодня</div>';
    html += todayEvents.map(renderEvent).join('');
  }
  if (tomorrowEvents.length) {
    html += '<div style="font-size:13px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin:16px 0 10px">Завтра</div>';
    html += tomorrowEvents.map(renderEvent).join('');
  }

  html += '<div style="margin-top:24px"><div style="font-size:15px;font-weight:700;margin-bottom:12px">🏆 Рейтинг риэлторов</div>' + renderRating() + '</div>';

  el.innerHTML = html;

  const evDateInput = document.getElementById('ev-date');
  if (evDateInput) evDateInput.value = today.toISOString().split('T')[0];
}

function openAddEvent() {
  requireAuth(function() { openModal('event-modal'); });
}

function saveEvent() {
  const title = document.getElementById('ev-title').value || 'Событие';
  const client = document.getElementById('ev-client').value;
  const date = document.getElementById('ev-date').value;
  const time = document.getElementById('ev-time').value;
  const note = document.getElementById('ev-note').value;
  const type = document.getElementById('ev-type').value;
  const typeEmoji = { showing: '🏠', call: '📞', deal: '✍️', meeting: '🤝' }[type] || '📅';
  calendarEvents.push({
    id: Date.now(),
    title: typeEmoji + ' ' + title,
    time: new Date(date + 'T' + (time || '10:00')).toISOString(),
    type: type, client: client, note: note
  });
  renderCalendar();
  closeModal('event-modal');
  showToast('✅ Событие добавлено! Flai напомнит вам 🤖');
}

// ============================================================
// PROFILE
// ============================================================
function renderProfile() {
  const el = document.getElementById('profile-screen');
  if (!el) return;

  if (!currentUser) {
    el.innerHTML = '<div class="empty-state" style="padding-top:60px">' +
      '<div class="empty-icon">👤</div>' +
      '<div class="empty-title">Войдите в систему</div>' +
      '<div class="empty-sub">Зарегистрируйтесь как риэлтор чтобы видеть свой профиль</div>' +
      '<button class="btn-primary" style="max-width:240px;margin:20px auto 0" onclick="openModal(\'auth-modal\')">Войти / Регистрация</button>' +
    '</div>';
    return;
  }

  const initial = (currentUser.name || 'R').charAt(0).toUpperCase();
  el.innerHTML =
    '<div class="profile-hero">' +
      '<div class="profile-ava">' + initial + '</div>' +
      '<div class="profile-name">' + (currentUser.name || 'Риэлтор') + '</div>' +
      '<div class="profile-status">🏠 Верифицированный риэлтор · Астана</div>' +
      '<div class="profile-stats">' +
        '<div class="profile-stat"><div class="profile-stat-val">12</div><div class="profile-stat-lbl">Объектов</div></div>' +
        '<div class="profile-stat"><div class="profile-stat-val">4.8</div><div class="profile-stat-lbl"><div class="rating-stars">★★★★★</div></div></div>' +
        '<div class="profile-stat"><div class="profile-stat-val">47</div><div class="profile-stat-lbl">Сделок</div></div>' +
      '</div>' +
    '</div>' +
    '<div class="menu-section">' +
      '<div class="menu-section-title">Мои объекты</div>' +
      '<div class="menu-item" onclick="showToast(\'📋 Мои объекты\')">' +
        '<div class="menu-icon" style="background:rgba(108,99,255,0.15)">🏠</div>' +
        '<div class="menu-item-info"><div class="menu-item-title">Активные объекты</div><div class="menu-item-sub">12 опубликованы</div></div>' +
        '<i class="fas fa-chevron-right menu-arrow"></i>' +
      '</div>' +
      '<div class="menu-item" onclick="showToast(\'❤️ Избранное\')">' +
        '<div class="menu-icon" style="background:rgba(255,101,132,0.15)">❤️</div>' +
        '<div class="menu-item-info"><div class="menu-item-title">Избранные объекты</div><div class="menu-item-sub">8 в избранном</div></div>' +
        '<i class="fas fa-chevron-right menu-arrow"></i>' +
      '</div>' +
    '</div>' +
    '<div class="menu-section">' +
      '<div class="menu-section-title">Инструменты</div>' +
      '<div class="menu-item" onclick="showScreen(\'calendar-screen\');setNav(null)">' +
        '<div class="menu-icon" style="background:rgba(67,198,172,0.15)">📅</div>' +
        '<div class="menu-item-info"><div class="menu-item-title">Мой планировщик</div><div class="menu-item-sub">4 события на неделе</div></div>' +
        '<i class="fas fa-chevron-right menu-arrow"></i>' +
      '</div>' +
      '<div class="menu-item" onclick="openRatingModal()">' +
        '<div class="menu-icon" style="background:rgba(247,151,30,0.15)">🏆</div>' +
        '<div class="menu-item-info"><div class="menu-item-title">Рейтинг риэлторов</div><div class="menu-item-sub">Вы на 3-м месте</div></div>' +
        '<i class="fas fa-chevron-right menu-arrow"></i>' +
      '</div>' +
      '<div class="menu-item" onclick="showToast(\'💡 Налоговый советник\')">' +
        '<div class="menu-icon" style="background:rgba(247,151,30,0.12)">💡</div>' +
        '<div class="menu-item-info"><div class="menu-item-title">Налоговый советник 2026</div><div class="menu-item-sub">Рассчитать выгоду обмена</div></div>' +
        '<span class="tag-tax">Новое</span>' +
      '</div>' +
    '</div>' +
    '<div class="menu-section">' +
      '<div class="menu-section-title">Аккаунт</div>' +
      '<div class="menu-item" onclick="showToast(\'⚙️ Настройки\')">' +
        '<div class="menu-icon" style="background:rgba(108,99,255,0.1)">⚙️</div>' +
        '<div class="menu-item-info"><div class="menu-item-title">Настройки</div><div class="menu-item-sub">Профиль, уведомления</div></div>' +
        '<i class="fas fa-chevron-right menu-arrow"></i>' +
      '</div>' +
      '<div class="menu-item" onclick="doLogout()">' +
        '<div class="menu-icon" style="background:rgba(255,101,132,0.12)">🚪</div>' +
        '<div class="menu-item-info"><div class="menu-item-title" style="color:var(--accent3)">Выйти</div></div>' +
        '<i class="fas fa-chevron-right menu-arrow"></i>' +
      '</div>' +
    '</div>';
}

function renderRating() {
  const realtors = [
    { name: 'Сауле Т.', deals: 68, rating: 5.0, rank: 1 },
    { name: 'Айгерим К.', deals: 61, rating: 4.9, rank: 2 },
    { name: 'Данияр М.', deals: 54, rating: 4.7, rank: 3 },
    { name: 'Нурлан А.', deals: 43, rating: 4.6, rank: 4 },
    { name: 'Асель Б.', deals: 38, rating: 4.8, rank: 5 },
  ];
  return realtors.map(function(r) {
    const rankClass = r.rank <= 3 ? 'rank-' + r.rank : 'rank-other';
    const rankIcon = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank;
    const barWidth = Math.round(r.deals / 68 * 100);
    return '<div class="rating-card">' +
      '<div class="rank-badge ' + rankClass + '">' + rankIcon + '</div>' +
      '<div style="flex:1">' +
        '<div style="font-size:14px;font-weight:700">' + r.name + '</div>' +
        '<div class="rating-bar-wrap"><div class="rating-bar" style="width:' + barWidth + '%"></div></div>' +
        '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">' + r.deals + ' сделок · ⭐ ' + r.rating + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function openRatingModal() {
  showToast('🏆 Рейтинг обновляется ежемесячно');
}

// ============================================================
// CHAT FLAI
// ============================================================
function setRole(btn, role) {
  currentRole = role;
  document.querySelectorAll('.role-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
}

function flaiEnter(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFlaiMessage(); }
}

async function sendFlaiMessage() {
  const input = document.getElementById('flai-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  appendMsg('flai-messages', text, 'own');
  const typing = appendTyping('flai-messages');

  try {
    const res = await fetch('/api/chat/flai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, role: currentRole })
    });
    const data = await res.json();
    typing.remove();
    appendMsg('flai-messages', data.reply, 'ai', 'F');
  } catch(e) {
    typing.remove();
    appendMsg('flai-messages', 'Связь прервана. Попробуйте снова.', 'ai', 'F');
  }
}

// ============================================================
// CHAT AIRA
// ============================================================
function airaEnter(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiraMessage(); }
}

async function sendAiraMessage() {
  if (!currentUser) { showToast('🔐 Только для риэлторов!'); openModal('auth-modal'); return; }
  const input = document.getElementById('aira-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  appendMsg('aira-messages', text, 'own');
  showToast('✅ Отправлено в Aira');
}

function toggleThread(header) {
  const body = header.nextElementSibling;
  const icon = header.querySelector('.fa-chevron-down');
  if (body) {
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    if (icon) icon.style.transform = isOpen ? '' : 'rotate(180deg)';
  }
}

// ============================================================
// CHAT HELPERS
// ============================================================
function appendMsg(containerId, text, type, initial) {
  const c = document.getElementById(containerId);
  const div = document.createElement('div');
  div.className = 'msg slide-up' + (type === 'own' ? ' own' : '');
  const now = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  if (type === 'own') {
    div.innerHTML = '<div><div class="msg-bubble">' + text + '</div><div class="msg-time">' + now + '</div></div>';
  } else {
    const textFormatted = text.replace(/\n/g, '<br>');
    div.innerHTML = '<div class="msg-ava ai">' + (initial || 'AI') + '</div><div><div class="msg-bubble">' + textFormatted + '</div><div class="msg-time">' + now + '</div></div>';
  }
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
  return div;
}

function appendTyping(containerId) {
  const c = document.getElementById(containerId);
  const div = document.createElement('div');
  div.className = 'msg';
  div.innerHTML = '<div class="msg-ava ai">F</div><div class="msg-bubble" style="padding:10px 14px"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>';
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
  return div;
}

// ============================================================
// AUTH
// ============================================================
function switchAuthTab(tab) {
  document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}

async function doLogin() {
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-pass').value;
  if (!email) { showToast('⚠️ Введите email'); return; }
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: pass })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('flapy_user', JSON.stringify(currentUser));
      updateAuthUI();
      closeModal('auth-modal');
      renderProfile();
      showToast('👋 Добро пожаловать, ' + (currentUser.name || 'риэлтор') + '!');
    }
  } catch(e) {
    showToast('⚠️ Ошибка входа');
  }
}

async function doRegister() {
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const phone = document.getElementById('reg-phone').value;
  if (!name || !email) { showToast('⚠️ Заполните обязательные поля'); return; }
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, phone: phone })
    });
    const data = await res.json();
    if (data.success) {
      currentUser = Object.assign({}, data.user, { name: name });
      localStorage.setItem('flapy_user', JSON.stringify(currentUser));
      updateAuthUI();
      closeModal('auth-modal');
      renderProfile();
      showToast('🎉 Добро пожаловать в Flapy, ' + name + '!');
    }
  } catch(e) {
    showToast('⚠️ Ошибка регистрации');
  }
}

function doLogout() {
  currentUser = null;
  localStorage.removeItem('flapy_user');
  updateAuthUI();
  renderProfile();
  showToast('👋 Вы вышли из системы');
}

function updateAuthUI() {
  const area = document.getElementById('auth-area');
  if (currentUser) {
    const initial = (currentUser.name || 'R').charAt(0).toUpperCase();
    const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'Профиль';
    area.innerHTML = '<div class="avatar-pill" onclick="showScreen(\'profile-screen\');setNav(null)" style="cursor:pointer">' +
      '<div class="avatar-circle">' + initial + '</div>' +
      '<span>' + firstName + '</span>' +
    '</div>';
  } else {
    area.innerHTML = '<button class="btn-primary" id="login-btn" onclick="openModal(\'auth-modal\')">Войти</button>';
  }
}

function requireAuth(cb) {
  if (currentUser) cb();
  else { showToast('🔐 Войдите как риэлтор'); openModal('auth-modal'); }
}

// ============================================================
// UI HELPERS
// ============================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  const screen = document.getElementById(id);
  if (screen) screen.classList.add('active');

  if (id === 'calendar-screen') loadCalendar();
  if (id === 'profile-screen') renderProfile();
  if (id === 'search-screen') { setTimeout(function() { doSearch(); }, 100); }
}

function setNav(el) {
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  if (el) el.classList.add('active');
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
function closeModalOut(e, id) {
  if (e.target.id === id) closeModal(id);
}

function showToast(msg, duration) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, duration || 2800);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('flapy_theme', next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-btn');
  if (btn) btn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function toggleLang() {
  currentLang = currentLang === 'ru' ? 'kz' : 'ru';
  document.getElementById('lang-toggle').textContent = currentLang === 'ru' ? '🇰🇿 Қаз' : '🇷🇺 Рус';
  showToast(currentLang === 'kz' ? '🇰🇿 Қазақ тілі қосылды' : '🇷🇺 Русский язык включён');
}
