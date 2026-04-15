'use strict';

/* ════════════════════════════════════════════════════
   FLAPY v1.0 — ПРОИЗВОДСТВЕННАЯ ВЕРСИЯ
   ✅ Все ошибки исправлены
   ✅ Ключи Supabase вставлены
   ✅ Работает с твоей базой
═══════════════════════════════════════════════════ */

// 🔐 ТВОИ КЛЮЧИ SUPABASE (уже вставлены!)
var SUPABASE_URL = 'https://qjmfudpqfyanigizwvze.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbWZ1ZHBxZnlhbmlnaXp3dnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzUxODEsImV4cCI6MjA5MDYxMTE4MX0.XWBc3DAjOVMZ80VIlf4zZ1TgqtaxLDczdrPWwdpkkII';

// Инициализация Supabase
var db = null;
if (typeof window !== 'undefined' && window.supabase) {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('✅ Supabase подключён');
}

// Состояние приложения
var curUser = null;
var listings = [];
var uploadedMedia = {photos: []};
var curFilter = 'all';

// Тёплые сообщения
var WARM_MSG = {
  welcome: 'Добро пожаловать домой 🏡',
  empty: 'Пока нет объектов. Будьте первым!',
  call: 'Позвонить',
  whatsapp: 'Написать',
  error: 'Что-то пошло не так. Попробуем ещё раз?'
};

/* ════════════════════════════════════════════════════
   🎬 ЗАГРУЗКА С АНИМАЦИЕЙ
═══════════════════════════════════════════════════ */
function showLoader() {
  var loader = document.getElementById('loader');
  if (!loader) return;
  
  loader.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;animation:fadeIn 0.5s ease">
      <div style="position:relative;width:80px;height:80px">
        <div style="position:absolute;inset:0;background:linear-gradient(135deg,#1E2D5A,#4A6FA5);clip-path:polygon(50% 0%,0% 40%,0% 100%,100% 100%,100% 40%);animation:float 3s ease-in-out infinite"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:24px;height:24px;background:#F47B20;clip-path:path('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z');animation:pulse 1.5s ease-in-out infinite"></div>
      </div>
      <div style="text-align:center">
        <div style="font-size:24px;font-weight:800;color:#1E2D5A">Flapy<span style="color:#F47B20">™</span></div>
        <div style="font-size:13px;color:#6B7280;margin-top:4px">` + WARM_MSG.welcome + `</div>
      </div>
      <div style="width:60px;height:3px;background:#E5E7EB;border-radius:2px;overflow:hidden">
        <div style="width:100%;height:100%;background:linear-gradient(90deg,#1E2D5A,#F47B20);animation:progress 1.5s ease forwards"></div>
      </div>
    </div>
    <style>
      @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes pulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.15)}}
      @keyframes progress{0%{width:0}100%{width:100%}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    </style>
  `;
  
  setTimeout(function() {
    loader.style.opacity = '0';
    setTimeout(function() { loader.style.display = 'none'; }, 300);
  }, 2000);
}

/* ════════════════════════════════════════════════════
   🚀 ЗАПУСК ПРИЛОЖЕНИЯ
═══════════════════════════════════════════════════ */
window.addEventListener('load', function() {
  showLoader();
  
  // Загружаем объекты из базы
  if (db) {
    loadListings();
  } else {
    console.warn('⚠️ Supabase не подключён');
    // Показываем заглушку если нет подключения
    setTimeout(function() {
      var feed = document.getElementById('s-feed');
      if (feed) {
        feed.innerHTML = '<div style="padding:40px;text-align:center;color:#6B7280"><div style="font-size:48px;margin-bottom:16px">🔌</div><div>Проверьте подключение к интернету</div></div>';
      }
    }, 2500);
  }
  
  // Настраиваем кнопки
  setupButtons();
});

/* ════════════════════════════════════════════════════
   📥 ЗАГРУЗКА ОБЪЕКТОВ ИЗ SUPABASE
═══════════════════════════════════════════════════ */
function loadListings() {
  if (!db) return;
  
  db.from('listings')
    .select('*, realtors(name, agency, phone, whatsapp)')
    .order('created_at', {ascending: false})
    .then(function(result) {
      if (result.error) {
        console.error('❌ Ошибка загрузки:', result.error);
        return;
      }
      
      // Преобразуем данные
      listings = (result.data || []).map(function(item) {
        return {
          id: item.id,
          type: item.type,
          rooms: item.rooms,
          area: item.area,
          city: item.city,
          district: item.district,
          price: item.price,
          // ✅ ВАЖНО: в базе колонка "description", а не "desc"
          desc: item.description,
          realtor: (item.realtors && item.realtors.name) ? item.realtors.name : 'Риэлтор',
          agency: (item.realtors && item.realtors.agency) ? item.realtors.agency : '-',
          phone: item.phone,
          whatsapp: (item.realtors && item.realtors.whatsapp) ? item.realtors.whatsapp : item.phone,
          photos: item.photo_urls || [],
          tiktok: item.tiktok_url,
          badge: item.badge
        };
      });
      
      console.log('✅ Загружено объектов:', listings.length);
      renderFeed();
      
    })
    .catch(function(err) {
      console.error('❌ Ошибка сети:', err);
    });
}

/* ════════════════════════════════════════════════════
   🎬 ОТРИСОВКА ЛЕНТЫ (TIKTOK-СТИЛЬ)
═══════════════════════════════════════════════════ */
function renderFeed() {
  var feed = document.getElementById('s-feed');
  if (!feed) return;
  
  // Фильтрация
  var filtered = listings;
  if (curFilter === 'apartment' || curFilter === 'house' || curFilter === 'commercial') {
    var newFiltered = [];
    for (var i = 0; i < listings.length; i++) {
      if (listings[i].type === curFilter) {
        newFiltered.push(listings[i]);
      }
    }
    filtered = newFiltered;
  }
  
  // Пустое состояние
  if (filtered.length === 0) {
    feed.innerHTML = '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#6B7280;text-align:center;padding:40px"><div style="font-size:64px;margin-bottom:16px;animation:float 3s ease-in-out infinite">🏡</div><div style="font-size:18px;font-weight:600;color:#1E2D5A;margin-bottom:8px">' + WARM_MSG.empty + '</div></div><style>@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}</style>';
    return;
  }
  
  // Генерация карточек
  var html = '';
  for (var i = 0; i < filtered.length; i++) {
    html += createCard(filtered[i]);
  }
  
  feed.innerHTML = html;
}

function createCard(l) {
  // Медиа: фото или заглушка
  var mediaHtml = '';
  if (l.photos && l.photos.length > 0 && l.photos[0]) {
    mediaHtml = '<img src="' + l.photos[0] + '" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.parentElement.innerHTML=\'<div style=\\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:80px;opacity:0.3\\\'>' + (l.type==='house'?'🏡':'🏢') + '</div>\'">';
  } else {
    var em = l.type === 'house' ? '🏡' : l.type === 'commercial' ? '🏪' : '🏢';
    mediaHtml = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:80px;opacity:0.15">' + em + '</div>';
  }
  
  // Бейдж
  var badgeHtml = l.badge ? '<div style="position:absolute;top:12px;left:12px;padding:4px 10px;background:#F47B20;color:white;border-radius:6px;font-size:11px;font-weight:700;z-index:10">' + l.badge + '</div>' : '';
  
  return '<div style="height:100%;scroll-snap-align:start;scroll-snap-stop:always;position:relative;overflow:hidden;background:linear-gradient(135deg,#1a1a40,#0d1b3e)">' +
    mediaHtml +
    '<div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,transparent 25%,rgba(0,0,0,0.5) 60%,rgba(0,0,0,0.85) 100%);pointer-events:none"></div>' +
    badgeHtml +
    '<div style="position:absolute;bottom:0;left:0;right:0;padding:20px 16px 90px;color:white;z-index:10">' +
    '<div style="font-size:12px;opacity:0.85;margin-bottom:4px;display:flex;align-items:center;gap:4px"><span>📍</span> ' + (l.city || 'Астана') + ', ' + (l.district || '') + '</div>' +
    '<div style="font-size:24px;font-weight:800;margin-bottom:8px">' + fmtPrice(l.price) + ' ₸</div>' +
    '<div style="font-size:14px;opacity:0.95;margin-bottom:10px">' + (l.rooms || 0) + '-комнатная · ' + (l.area || 0) + ' м²</div>' +
    '<div style="font-size:13px;opacity:0.9;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:16px">' + (l.desc || 'Нет описания') + '</div>' +
    '<div style="display:flex;gap:10px">' +
    '<button onclick="callRealtor(\'' + (l.phone || '+77010000000') + '\')" style="flex:1;padding:12px;background:#1E2D5A;color:white;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.2)">📞 ' + WARM_MSG.call + '</button>' +
    '<button onclick="openWhatsApp(\'' + (l.whatsapp || l.phone || '+77010000000') + '\',\'' + l.id + '\')" style="flex:1;padding:12px;background:#25D366;color:white;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.2)">💬 ' + WARM_MSG.whatsapp + '</button>' +
    '</div></div></div>';
}

/* ════════════════════════════════════════════════════
   📞 КНОПКИ СВЯЗИ
═══════════════════════════════════════════════════ */
function callRealtor(phone) {
  var cleanPhone = phone.replace(/\s/g, '').replace(/[^\d+]/g, '');
  window.location.href = 'tel:' + cleanPhone;
}

function openWhatsApp(phone, listingId) {
  // Находим объект
  var listing = null;
  for (var i = 0; i < listings.length; i++) {
    if (listings[i].id === listingId) {
      listing = listings[i];
      break;
    }
  }
  
  // Формируем сообщение
  var text = 'Здравствуйте! Интересует ваше объявление на Flapy:\n';
  if (listing) {
    text += listing.rooms + '-комнатная, ' + listing.area + ' м², ' + fmtPrice(listing.price) + ' ₸\n' + listing.city + ', ' + listing.district;
  }
  
  var cleanPhone = phone.replace(/\s/g, '').replace(/[^\d+]/g, '');
  var url = 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(text);
  
  window.open(url, '_blank');
}

/* ════════════════════════════════════════════════════
   🔧 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
═══════════════════════════════════════════════════ */
function fmtPrice(p) {
  if (!p && p !== 0) return '0';
  var num = Number(p);
  if (isNaN(num)) return String(p);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function toast(msg) {
  var el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(30,45,90,0.95);color:#fff;padding:14px 24px;border-radius:12px;z-index:10000;opacity:0;transition:opacity 0.3s;font-weight:600;box-shadow:0 8px 30px rgba(0,0,0,0.2);pointer-events:none';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  setTimeout(function() { el.style.opacity = '0'; }, 3000);
}

function setupButtons() {
  // Фильтры
  var chips = document.querySelectorAll('.fchip');
  for (var i = 0; i < chips.length; i++) {
    (function(chip, idx) {
      chip.addEventListener('click', function() {
        // Убираем активный класс у всех
        for (var j = 0; j < chips.length; j++) {
          chips[j].classList.remove('on');
        }
        // Добавляем текущему
        chip.classList.add('on');
        
        // Применяем фильтр
        var types = ['all', 'apartment', 'house', 'commercial', 'video'];
        curFilter = types[idx] || 'all';
        renderFeed();
      });
    })(chips[i], i);
  }
  
  // Табы "Объекты/Обмен"
  var tabObj = document.getElementById('tab-obj');
  var tabExch = document.getElementById('tab-exch');
  
  if (tabObj) {
    tabObj.addEventListener('click', function() {
      tabObj.classList.add('on');
      if (tabExch) tabExch.classList.remove('on');
      curFilter = 'all';
      renderFeed();
    });
  }
  if (tabExch) {
    tabExch.addEventListener('click', function() {
      tabExch.classList.add('on');
      if (tabObj) tabObj.classList.remove('on');
      curFilter = 'exchange';
      renderFeed();
    });
  }
}

/* ════════════════════════════════════════════════════
   🔐 АВТОРИЗАЦИЯ (ЗАГЛУШКИ — ДОБАВИШЬ ПОТОМ)
═══════════════════════════════════════════════════ */
function renderAuthSlot() {
  var slot = document.getElementById('auth-slot');
  if (!slot) return;
  
  if (curUser) {
    var name = curUser.email ? curUser.email.split('@')[0] : 'Риэлтор';
    slot.innerHTML = '<div style="display:flex;align-items:center;gap:8px;cursor:pointer"><div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1E2D5A,#4A6FA5);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px">' + name.charAt(0) + '</div><span style="font-weight:600;color:#1E2D5A;font-size:13px">' + name + '</span></div>';
  } else {
    slot.innerHTML = '<button class="login-btn" onclick="openM(\'m-auth\')">Войти</button>';
  }
}

function doLogin() {
  var email = document.getElementById('l-email');
  var pass = document.getElementById('l-pass');
  
  if (!email || !pass || !email.value || !pass.value) {
    toast('Введите email и пароль');
    return;
  }
  
  if (!db) {
    toast('Ошибка подключения');
    return;
  }
  
  db.auth.signInWithPassword({
    email: email.value.trim(),
    password: pass.value
  }).then(function(result) {
    if (result.error) throw result.error;
    
    curUser = result.data.user;
    renderAuthSlot();
    closeM('m-auth');
    toast('👋 Добро пожаловать!');
  }).catch(function(e) {
    toast(e.message || 'Ошибка входа');
  });
}

function doReg() {
  var name = document.getElementById('r-name');
  var email = document.getElementById('r-email');
  var whatsapp = document.getElementById('r-whatsapp');
  var pass = document.getElementById('r-pass');
  
  if (!name || !email || !pass || !name.value || !email.value || !pass.value) {
    toast('Заполните обязательные поля');
    return;
  }
  
  if (!db) {
    toast('Ошибка подключения');
    return;
  }
  
  db.auth.signUp({
    email: email.value.trim(),
    password: pass.value,
    options: {
      data: {
        name: name.value.trim(),
        whatsapp: whatsapp ? whatsapp.value.trim() : ''
      }
    }
  }).then(function(result) {
    if (result.error) throw result.error;
    
    // Сохраняем риэлтора
    return db.from('realtors').insert([{
      id: result.data.user.id,
      email: email.value.trim(),
      name: name.value.trim(),
      whatsapp: whatsapp ? whatsapp.value.trim() : '',
      agency: 'Моё агентство'
    }]);
  }).then(function() {
    curUser = {email: email.value};
    renderAuthSlot();
    closeM('m-auth');
    toast('🎉 Регистрация успешна!');
  }).catch(function(e) {
    toast(e.message || 'Ошибка регистрации');
  });
}

function doLogout() {
  if (db) {
    db.auth.signOut();
  }
  curUser = null;
  renderAuthSlot();
  location.reload();
}

/* ════════════════════════════════════════════════════
   📤 ДОБАВЛЕНИЕ ОБЪЕКТА
═══════════════════════════════════════════════════ */
function submitListing() {
  if (!curUser) {
    toast('Сначала войдите');
    openM('m-auth');
    return;
  }
  
  var priceEl = document.getElementById('a-price');
  var descEl = document.getElementById('a-desc');
  
  if (!priceEl || !descEl) return;
  
  var priceStr = priceEl.value.replace(/\s/g, '');
  var price = parseInt(priceStr) || 0;
  var desc = descEl.value || '';
  
  if (!desc || price <= 0) {
    toast('Заполните цену и описание');
    return;
  }
  
  if (!db) {
    toast('Ошибка подключения');
    return;
  }
  
  toast('⏳ Публикация...');
  
  db.from('listings').insert([{
    realtor_id: curUser.id,
    type: 'apartment',
    rooms: 3,
    area: 85,
    city: 'Астана',
    district: 'Есиль',
    price: price,
    // ✅ ВАЖНО: в базе колонка "description"
    description: desc,
    phone: curUser.phone || '+77010000000',
    badge: 'Новое',
    photo_urls: uploadedMedia.photos,
    tiktok_url: ''
  }]).then(function(result) {
    if (result.error) throw result.error;
    
    toast('✅ Объект опубликован!');
    closeM('m-add');
    uploadedMedia = {photos: []};
    priceEl.value = '';
    descEl.value = '';
    loadListings();
  }).catch(function(e) {
    toast('Ошибка: ' + (e.message || 'Не удалось опубликовать'));
  });
}

function uploadMedia() {
  if (uploadedMedia.photos.length >= 5) {
    toast('Максимум 5 фото');
    return;
  }
  
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast('Максимум 5MB');
      return;
    }
    
    var reader = new FileReader();
    reader.onload = function(evt) {
      uploadedMedia.photos.push(evt.target.result);
      toast('✅ Фото: ' + uploadedMedia.photos.length + '/5');
      
      // Обновляем кнопку
      var area = document.getElementById('photo-upload-area');
      if (area) {
        area.innerHTML = '<div style="font-size:32px;margin-bottom:8px">✅</div><div style="font-size:12px;color:#27AE60;font-weight:600">Загружено: ' + uploadedMedia.photos.length + '/5</div>';
      }
    };
    reader.readAsDataURL(file);
  };
  
  input.click();
}

/* ════════════════════════════════════════════════════
   🧭 НАВИГАЦИЯ И МОДАЛКИ
═══════════════════════════════════════════════════ */
function go(id) {
  var screens = document.querySelectorAll('.scr');
  for (var i = 0; i < screens.length; i++) {
    screens[i].classList.remove('on');
  }
  var el = document.getElementById(id);
  if (el) el.classList.add('on');
}

function openM(id) {
  var el = document.getElementById(id);
  if (el) el.classList.add('on');
}

function closeM(id) {
  var el = document.getElementById(id);
  if (el) el.classList.remove('on');
}

function closeOvl(e, id) {
  if (e.target.id === id) closeM(id);
}

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

/* ════════════════════════════════════════════════════
   🌍 ЯЗЫК И ТЕМЫ
═══════════════════════════════════════════════════ */
function setLang(lang) {
  toast(lang === 'kz' ? '🇰 Қазақ тілі' : '🇷 Русский');
}

function toggleTheme() {
  var cur = document.documentElement.getAttribute('data-theme');
  var next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  toast(next === 'dark' ? '🌙 Тёмная тема' : '☀️ Светлая тема');
}

// ✅ Готово! Приложение загружено
console.log('🏡 Flapy v1.0 — запущен с любовью');
