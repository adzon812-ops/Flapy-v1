'use strict';

/* ════════════════════════════════════════════════════
   FLAPY v1.0 — HOME IS WHERE THE HEART IS
═══════════════════════════════════════════════════ */

// Supabase config
const FLAPY_SUPABASE_URL = 'https://xxxxx.supabase.co';
const FLAPY_SUPABASE_KEY = 'your-anon-key-here';

// Initialize Supabase (only once)
var flapyDB = null;
if (typeof window !== 'undefined' && window.supabase) {
  flapyDB = window.supabase.createClient(FLAPY_SUPABASE_URL, FLAPY_SUPABASE_KEY);
}

// State
var curUser = null;
var listings = [];
var uploadedMedia = {photos: []};

// Warm messages
var WARM_MSG = {
  welcome: 'Добро пожаловать домой 🏡',
  call: 'Позвонить',
  whatsapp: 'Написать',
  empty: 'Здесь пока тихо... 🌿'
};

// Loader
function showLoader() {
  var loader = document.getElementById('loader');
  if (!loader) return;
  
  loader.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;animation:fadeIn 0.5s ease"><div style="font-size:24px;font-weight:800;color:#1E2D5A">Flapy<span style="color:#F47B20">™</span></div><div style="font-size:13px;color:#6B7280">' + WARM_MSG.welcome + '</div><div style="width:60px;height:3px;background:#E5E7EB;border-radius:2px;overflow:hidden"><div style="width:100%;height:100%;background:linear-gradient(90deg,#1E2D5A,#F47B20);animation:loadProgress 1.5s ease forwards"></div></div></div><style>@keyframes loadProgress{0%{width:0}100%{width:100%}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}</style>';
  
  setTimeout(function() {
    loader.style.opacity = '0';
    setTimeout(function() { loader.style.display = 'none'; }, 300);
  }, 2000);
}

// Init
window.addEventListener('load', async function() {
  showLoader();
  
  // Check session
  if (flapyDB) {
    try {
      var sessionData = await flapyDB.auth.getSession();
      if (sessionData.data && sessionData.data.session) {
        curUser = sessionData.data.session.user;
        renderAuthSlot();
      }
    } catch(e) {
      console.log('No session');
    }
  }
  
  // Load listings
  await loadListings();
});

// Load listings
async function loadListings() {
  if (!flapyDB) {
    listings = [];
    renderFeed();
    return;
  }
  
  try {
    var result = await flapyDB.from('listings').select('*, realtors(name, agency, phone, whatsapp)').order('created_at', {ascending: false});
    
    if (result.error) throw result.error;
    
    listings = (result.data || []).map(function(item) {
      return {
        id: item.id,
        type: item.type,
        rooms: item.rooms,
        area: item.area,
        city: item.city,
        district: item.district,
        price: item.price,
        desc: item.desc,
        realtor: (item.realtors && item.realtors.name) ? item.realtors.name : 'Риэлтор',
        agency: (item.realtors && item.realtors.agency) ? item.realtors.agency : '-',
        phone: item.phone,
        whatsapp: (item.realtors && item.realtors.whatsapp) ? item.realtors.whatsapp : item.phone,
        photos: item.photo_urls || [],
        tiktok: item.tiktok_url,
        badge: item.badge
      };
    });
    
    renderFeed();
  } catch(e) {
    console.error('Load error:', e);
    listings = [];
    renderFeed();
  }
}

// Render feed
function renderFeed() {
  var feed = document.getElementById('s-feed');
  if (!feed) return;
  
  if (listings.length === 0) {
    feed.innerHTML = '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#6B7280;text-align:center;padding:40px"><div style="font-size:64px;margin-bottom:16px">🏡</div><div style="font-size:18px;font-weight:600;color:#1E2D5A;margin-bottom:8px">' + WARM_MSG.empty + '</div></div>';
    return;
  }
  
  var html = '';
  for (var i = 0; i < listings.length; i++) {
    var l = listings[i];
    html += createFeedCard(l);
  }
  
  feed.innerHTML = html;
}

function createFeedCard(l) {
  var mediaHtml = '';
  if (l.photos && l.photos.length > 0) {
    mediaHtml = '<img src="' + l.photos[0] + '" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">';
  } else if (l.tiktok) {
    mediaHtml = '<div style="width:100%;height:100%;position:absolute;inset:0;background:#000;display:flex;align-items:center;justify-content:center;color:white"><div style="font-size:48px">🎵</div></div>';
  } else {
    mediaHtml = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:120px;opacity:0.1">🏢</div>';
  }
  
  return '<div class="feed-card" style="height:100%;scroll-snap-align:start;scroll-snap-stop:always;position:relative;overflow:hidden;background:linear-gradient(135deg,#1a1a40,#0d1b3e)">' +
    mediaHtml +
    '<div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,transparent 25%,rgba(0,0,0,0.6) 70%,rgba(0,0,0,0.9) 100%)"></div>' +
    '<div style="position:absolute;bottom:0;left:0;right:0;padding:20px 16px 100px;color:white">' +
    '<div style="font-size:12px;opacity:0.8;margin-bottom:4px">📍 ' + l.city + ', ' + l.district + '</div>' +
    '<div style="font-size:24px;font-weight:800;margin-bottom:8px">' + fmtPrice(l.price) + ' ₸</div>' +
    '<div style="font-size:14px;opacity:0.9;margin-bottom:8px">' + l.rooms + '-комнатная · ' + l.area + ' м²</div>' +
    '<div style="font-size:13px;opacity:0.8;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:16px">' + l.desc + '</div>' +
    '<div style="display:flex;gap:10px">' +
    '<button onclick="callRealtor(\'' + l.phone + '\')" style="flex:1;padding:12px;background:#1E2D5A;color:white;border:none;border-radius:10px;font-weight:600">📞 ' + WARM_MSG.call + '</button>' +
    '<button onclick="openWhatsApp(\'' + l.whatsapp + '\',\'' + l.id + '\')" style="flex:1;padding:12px;background:#25D366;color:white;border:none;border-radius:10px;font-weight:600">💬 ' + WARM_MSG.whatsapp + '</button>' +
    '</div></div></div>';
}

// Actions
function callRealtor(phone) {
  window.location.href = 'tel:' + phone.replace(/\s/g, '');
}

function openWhatsApp(phone, listingId) {
  var listing = null;
  for (var i = 0; i < listings.length; i++) {
    if (listings[i].id === listingId) {
      listing = listings[i];
      break;
    }
  }
  
  if (!listing) return;
  
  var text = encodeURIComponent('Здравствуйте! Интересует ваше объявление на Flapy:\n' + listing.rooms + '-комнатная, ' + listing.area + ' м², ' + fmtPrice(listing.price) + ' ₸');
  window.open('https://wa.me/' + phone.replace(/\s/g, '') + '?text=' + text, '_blank');
}

// Auth
function renderAuthSlot() {
  var slot = document.getElementById('auth-slot');
  if (!slot) return;
  
  if (curUser) {
    var name = (curUser.user_metadata && curUser.user_metadata.name) ? curUser.user_metadata.name : curUser.email.split('@')[0];
    slot.innerHTML = '<div style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 12px;background:rgba(30,45,90,0.1);border-radius:20px" onclick="go(\'s-prof\')"><div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1E2D5A,#4A6FA5);display:flex;align-items:center;justify-content:center;color:white;font-weight:700">' + name.charAt(0) + '</div><span style="font-weight:600;color:#1E2D5A;font-size:13px">' + name.split(' ')[0] + '</span></div>';
  } else {
    slot.innerHTML = '<button class="login-btn" onclick="openM(\'m-auth\')">Войти</button>';
  }
}

async function doLogin() {
  var emailEl = document.getElementById('l-email');
  var passEl = document.getElementById('l-pass');
  
  if (!emailEl || !passEl) return;
  
  var email = emailEl.value.trim();
  var pass = passEl.value;
  
  if (!email || !pass) {
    toast('Введите email и пароль');
    return;
  }
  
  if (!flapyDB) {
    toast('Ошибка подключения');
    return;
  }
  
  try {
    var result = await flapyDB.auth.signInWithPassword({email: email, password: pass});
    
    if (result.error) throw result.error;
    
    curUser = result.data.user;
    renderAuthSlot();
    closeM('m-auth');
    toast('👋 Добро пожаловать домой!');
  } catch(e) {
    toast(e.message);
  }
}

async function doReg() {
  var nameEl = document.getElementById('r-name');
  var emailEl = document.getElementById('r-email');
  var phoneEl = document.getElementById('r-phone');
  var whatsappEl = document.getElementById('r-whatsapp');
  var agencyEl = document.getElementById('r-agency');
  var passEl = document.getElementById('r-pass');
  
  if (!nameEl || !emailEl || !passEl) return;
  
  var name = nameEl.value.trim();
  var email = emailEl.value.trim();
  var phone = phoneEl ? phoneEl.value.trim() : '';
  var whatsapp = whatsappEl ? whatsappEl.value.trim() : '';
  var agency = agencyEl ? agencyEl.value.trim() : 'Моё агентство';
  var pass = passEl.value;
  
  if (!name || !email || !pass) {
    toast('Заполните обязательные поля');
    return;
  }
  
  if (!flapyDB) {
    toast('Ошибка подключения');
    return;
  }
  
  try {
    var result = await flapyDB.auth.signUp({
      email: email,
      password: pass,
      options: {data: {name: name, phone: phone, whatsapp: whatsapp}}
    });
    
    if (result.error) throw result.error;
    
    // Save realtor
    await flapyDB.from('realtors').insert([{
      id: result.data.user.id,
      email: email,
      name: name,
      phone: phone,
      whatsapp: whatsapp,
      agency: agency
    }]);
    
    curUser = result.data.user;
    renderAuthSlot();
    closeM('m-auth');
    toast('🎉 Добро пожаловать домой!');
  } catch(e) {
    toast(e.message);
  }
}

async function doLogout() {
  if (flapyDB) {
    await flapyDB.auth.signOut();
  }
  curUser = null;
  renderAuthSlot();
  location.reload();
}

// Add listing
async function submitListing() {
  if (!curUser) {
    toast('Сначала войдите');
    openM('m-auth');
    return;
  }
  
  var priceEl = document.getElementById('a-price');
  var descEl = document.getElementById('a-desc');
  var typeEl = document.getElementById('a-type');
  var roomsEl = document.getElementById('a-rooms');
  var areaEl = document.getElementById('a-area');
  var cityEl = document.getElementById('a-city');
  var districtEl = document.getElementById('a-district');
  var tiktokEl = document.getElementById('a-tiktok');
  
  if (!priceEl || !descEl) return;
  
  var priceStr = priceEl.value.replace(/\s/g, '');
  var price = parseInt(priceStr) || 0;
  var desc = descEl.value || '';
  
  if (!desc || price <= 0) {
    toast('Заполните все поля');
    return;
  }
  
  if (!flapyDB) {
    toast('Ошибка подключения');
    return;
  }
  
  try {
    var error = null;
    var result = await flapyDB.from('listings').insert([{
      realtor_id: curUser.id,
      type: typeEl ? typeEl.value : 'apartment',
      rooms: roomsEl ? parseInt(roomsEl.value) : 3,
      area: areaEl ? parseInt(areaEl.value) : 85,
      city: cityEl ? cityEl.value : 'Астана',
      district: districtEl ? districtEl.value : 'Есиль',
      price: price,
      desc: desc,
      phone: (curUser.user_metadata && curUser.user_metadata.phone) ? curUser.user_metadata.phone : '+7 701 234 56 78',
      badge: 'Новое',
      photo_urls: uploadedMedia.photos,
      tiktok_url: tiktokEl ? tiktokEl.value.trim() : ''
    }]);
    
    if (result.error) throw result.error;
    
    toast('✅ Объект опубликован с любовью!');
    closeM('m-add');
    uploadedMedia = {photos: []};
    
    // Reset form
    if (priceEl) priceEl.value = '';
    if (descEl) descEl.value = '';
    
    loadListings();
    go('s-feed');
  } catch(e) {
    toast('Ошибка: ' + e.message);
  }
}

function uploadMedia(type) {
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
      
      var area = document.getElementById('photo-upload-area');
      if (area) {
        area.innerHTML = '<div style="font-size:32px;margin-bottom:8px">✅</div><div style="font-size:12px;color:var(--green);font-weight:600">Загружено: ' + uploadedMedia.photos.length + '/5</div>';
      }
      
      toast('✅ Фото добавлено');
    };
    
    reader.readAsDataURL(file);
  };
  
  input.click();
}

// Utils
function fmtPrice(p) {
  if (!p) return '0';
  return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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
  el.classList.add('show');
  
  setTimeout(function() {
    el.classList.remove('show');
  }, 3000);
}

function go(id) {
  var screens = document.querySelectorAll('.scr');
  for (var i = 0; i < screens.length; i++) {
    screens[i].classList.remove('on');
  }
  
  var el = document.getElementById(id);
  if (el) el.classList.add('on');
}

function nav(el) {
  var items = document.querySelectorAll('.nav-it');
  for (var i = 0; i < items.length; i++) {
    items[i].classList.remove('on');
  }
  
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
  var inTab = document.getElementById('tab-in');
  var upTab = document.getElementById('tab-up');
  var inForm = document.getElementById('af-in');
  var upForm = document.getElementById('af-up');
  
  if (inTab) inTab.classList.toggle('on', tab === 'in');
  if (upTab) upTab.classList.toggle('on', tab === 'up');
  if (inForm) inForm.style.display = tab === 'in' ? 'block' : 'none';
  if (upForm) upForm.style.display = tab === 'up' ? 'block' : 'none';
}

function setLang(lang) {
  curLang = lang;
  localStorage.setItem('fp_lang', lang);
  toast(lang === 'kz' ? '🇰 Қазақ тілі' : '🇷 Русский');
}

function toggleTheme() {
  var cur = document.documentElement.getAttribute('data-theme');
  var next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('fp_theme', next);
}
