/* FLAPY app.js v17.0 — Real AI · Supabase Realtime · Admin Mode · Warm UX */
'use strict';

/* ════════════════════════════════════════════════════
   🔐 SUPABASE CONFIG
═══════════════════════════════════════════════════ */
var SUPABASE_URL = 'https://qjmfudpqfyanigizwvze.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbWZ1ZHBxZnlhbmlnaXp3dnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzUxODEsImV4cCI6MjA5MDYxMTE4MX0.XWBc3DAjOVMZ80VIlf4zZ1TgqtaxLDczdrPWwdpkkII';

// Admin email — только ты знаешь этот адрес
var ADMIN_EMAIL = 'admin@flapy.internal';

var db = null;
var realtimeChannel = null;

/* ════════════════════════════════════════════════════
   📊 STATE
═══════════════════════════════════════════════════ */
var listings = [];
var curUser = null;
var curFilter = 'all';
var curLang = 'ru';
var listTab = 'obj';
var notifications = [];
var airaMessages = [];
var uploadedMedia = { photos: [], videos: [] };
var adminPanelOpen = false;

/* ════════════════════════════════════════════════════
   🚀 INIT
═══════════════════════════════════════════════════ */
window.addEventListener('load', function () {

  // Init Supabase client
  if (window.supabase) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase подключён');
  } else {
    console.warn('⚠️ Supabase JS не загружен');
  }

  // Restore session
  try { var s = localStorage.getItem('fp_user'); if (s) curUser = JSON.parse(s); } catch (e) {}
  try { var n = localStorage.getItem('fp_notifications'); if (n) notifications = JSON.parse(n); } catch (e) {}

  curLang = localStorage.getItem('fp_lang') || 'ru';
  applyLangUI();

  var savedTheme = localStorage.getItem('fp_theme') || 'light';
  applyTheme(savedTheme);

  if (curUser) {
    renderAuthSlot();
    updateAiraBadge();
    if (curUser.isAdmin) showAdminDot();
  }

  updateNavVisibility();
  updateNotificationsCount();

  // Hide loader
  setTimeout(function () {
    var ld = document.getElementById('loader');
    if (ld) ld.style.opacity = '0';
    setTimeout(function () { if (ld) ld.style.display = 'none'; }, 300);
  }, 1200);

  // Load data
  if (db) {
    loadFromSupabase();
  } else {
    listings = [];
    renderListings();
  }

  // If user logged in, init realtime chat
  if (db && curUser) {
    initAiraRealtime();
    loadAiraMessages();
  }

  console.log('✅ Flapy v17.0 loaded');
});

/* ════════════════════════════════════════════════════
   📥 SUPABASE — LOAD LISTINGS
═══════════════════════════════════════════════════ */
function loadFromSupabase() {
  if (!db) return;
  db.from('listings')
    .select('*')
    .order('created_at', { ascending: false })
    .then(function (result) {
      if (result.error) {
        console.warn('⚠️ Supabase listings error:', result.error.message);
        renderListings();
        return;
      }
      listings = (result.data || []).map(mapListing);
      console.log('✅ Загружено из Supabase:', listings.length, 'объектов');
      saveListingsLocal();
      renderListings();
    })
    .catch(function () {
      renderListings();
    });
}

function mapListing(item) {
  return {
    id: item.id,
    type: item.type || 'apartment',
    rooms: item.rooms,
    area: item.area,
    floor: item.floor,
    totalFloors: item.total_floors,
    ceilingHeight: item.ceiling_height,
    complex: item.complex_name || '',
    city: item.city || 'Астана',
    district: item.district || 'Есиль',
    price: item.price,
    desc: item.description || '',
    realtor: item.realtor_name || 'Риэлтор',
    realtorFull: item.realtor_name || 'Риэлтор',
    realtorId: item.realtor_id,
    agency: item.agency || '',
    phone: item.phone || '',
    badge: item.badge || 'Новое',
    tags: item.tags || [],
    hasVideo: item.has_video || false,
    exchange: item.exchange || false,
    liked: false,
    photos: item.photo_urls || [],
    videos: [],
    createdAt: item.created_at
  };
}

function saveListingsLocal() {
  try { localStorage.setItem('fp_listings', JSON.stringify(listings)); } catch (e) {}
}

/* ════════════════════════════════════════════════════
   💾 SAVE LISTING TO SUPABASE
═══════════════════════════════════════════════════ */
function saveToSupabase(listing) {
  if (!db || !curUser) return Promise.resolve();
  return db.from('listings').insert([{
    realtor_id: curUser.id || curUser.sbId,
    realtor_name: curUser.name,
    agency: curUser.agency || '',
    phone: curUser.phone || '',
    type: listing.type,
    rooms: listing.rooms,
    area: listing.area,
    floor: listing.floor || null,
    total_floors: listing.totalFloors || null,
    ceiling_height: listing.ceilingHeight || null,
    complex_name: listing.complex || '',
    city: 'Астана',
    district: listing.district,
    price: listing.price,
    description: listing.desc,
    exchange: listing.exchange || false,
    badge: 'Новое',
    photo_urls: listing.photos || [],
    has_video: (listing.videos || []).length > 0,
    tags: listing.tags || []
  }]).select().then(function (res) {
    if (res.error) throw res.error;
    // Update local listing id with Supabase uuid
    if (res.data && res.data[0]) {
      listing.id = res.data[0].id;
      saveListingsLocal();
    }
    console.log('✅ Объект сохранён в Supabase');
  });
}

/* ════════════════════════════════════════════════════
   💬 AIRA CHAT — Supabase Realtime
═══════════════════════════════════════════════════ */
function loadAiraMessages() {
  if (!db) return;
  db.from('messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(60)
    .then(function (res) {
      if (res.error) { console.warn('Messages load error:', res.error.message); return; }
      var msgs = res.data || [];
      airaMessages = msgs.map(function (m) {
        return {
          id: m.id,
          author: m.user_name || 'Риэлтор',
          text: m.content || '',
          time: formatMsgTime(m.created_at),
          mine: curUser && (m.user_id === (curUser.id || curUser.sbId)),
          userId: m.user_id,
          type: m.type || 'text',
          listingId: m.listing_id
        };
      });
      renderAiraChat();
    });
}

function initAiraRealtime() {
  if (!db) return;
  if (realtimeChannel) db.removeChannel(realtimeChannel);

  realtimeChannel = db.channel('public:messages')
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'messages'
    }, function (payload) {
      var m = payload.new;
      var isMe = curUser && (m.user_id === (curUser.id || curUser.sbId));
      if (!isMe) {
        airaMessages.push({
          id: m.id,
          author: m.user_name || 'Риэлтор',
          text: m.content,
          time: formatMsgTime(m.created_at),
          mine: false,
          userId: m.user_id,
          type: m.type || 'text'
        });
        var airaScreen = document.getElementById('s-aira');
        if (airaScreen && airaScreen.classList.contains('on')) {
          renderAiraChat();
        } else {
          // Notification if not on chat screen
          addNotification({ from: m.user_name || 'Риэлтор', text: m.content.substring(0, 60) });
        }
      }
    })
    .subscribe(function (status) {
      if (status === 'SUBSCRIBED') {
        var el = document.getElementById('aira-online-txt');
        if (el) el.textContent = 'онлайн';
      }
    });
}

function sendAira() {
  if (!curUser) { toast('🔐 Войдите, чтобы написать коллегам'); openM('m-auth'); return; }
  var inp = document.getElementById('aira-inp');
  var txt = inp ? inp.value.trim() : '';
  if (!txt) return;

  var now = new Date();
  var tm = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  var tempMsg = {
    id: 'tmp_' + Date.now(),
    author: curUser.name,
    text: txt,
    time: tm,
    mine: true,
    userId: curUser.id || curUser.sbId,
    type: 'text'
  };
  airaMessages.push(tempMsg);
  inp.value = '';
  inp.style.height = 'auto';
  renderAiraChat();

  if (db) {
    db.from('messages').insert([{
      user_id: curUser.id || curUser.sbId || 'anon',
      user_name: curUser.name,
      content: txt,
      type: 'text'
    }]).then(function (res) {
      if (res.error) console.warn('⚠️ Message save error:', res.error.message);
    });
  }
}

function renderAiraChat() {
  var el = document.getElementById('aira-msgs');
  if (!el) return;

  if (airaMessages.length === 0) {
    el.innerHTML = '<div class="chat-date-sep">Сообщений пока нет — напишите первым! 👋</div>';
    return;
  }

  var html = '<div class="chat-date-sep">Сегодня</div>';
  airaMessages.forEach(function (m) {
    var side = m.mine ? 'me' : 'other';
    var author = !m.mine ? '<div class="msg-author">' + esc(m.author) + '</div>' : '';
    html += '<div class="msg-wrap ' + side + '">' + author +
      '<div class="bubble">' + esc(m.text) + '</div>' +
      '<div class="m-ts">' + (m.time || '') + (m.mine ? ' ✓✓' : '') + '</div>' +
      '</div>';
  });

  el.innerHTML = html;
  requestAnimationFrame(function () { el.scrollTop = el.scrollHeight; });
}

function updateAiraBadge() {
  var badge = document.getElementById('aira-badge');
  if (!badge) return;
  if (curUser) {
    badge.textContent = '✓ ' + curUser.name.split(' ')[0];
    badge.style.cssText = 'background:rgba(255,255,255,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:#fff;font-weight:600';
  } else {
    badge.textContent = '🔒 Гость';
    badge.style.cssText = 'background:rgba(255,255,255,.1);border-radius:8px;padding:4px 10px;font-size:11px;color:rgba(255,255,255,.7);font-weight:600';
  }
}

/* ════════════════════════════════════════════════════
   🤖 REAL AI DESCRIPTION (2 variants)
═══════════════════════════════════════════════════ */
function genAI() {
  var btn = document.getElementById('ai-gen-btn');
  var wrap = document.getElementById('ai-variants-wrap');
  if (!wrap) return;

  // Collect all form data
  var data = {
    type: val('a-type'),
    rooms: val('a-rooms'),
    area: val('a-area'),
    floor: val('a-floor'),
    totalFloors: val('a-totalfloors'),
    ceilingHeight: val('a-ceiling'),
    complex: val('a-complex'),
    district: val('a-district'),
    price: (val('a-price') || '').replace(/\s/g, ''),
    exchange: document.getElementById('a-exchange') && document.getElementById('a-exchange').checked
  };

  // Show loading
  wrap.style.display = 'block';
  wrap.innerHTML = '<div class="ai-loading">✨ AI пишет описание... подождите немного</div>';
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Генерирую...'; }

  fetch('/api/ai/describe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(function (r) { return r.json(); })
    .then(function (res) {
      var descriptions = res.descriptions || [];
      if (!descriptions.length) throw new Error('empty');
      renderAIVariants(descriptions);
    })
    .catch(function (e) {
      console.warn('AI error:', e);
      // Show friendly fallback
      renderAIVariants([
        '✨ Описание не удалось сгенерировать — возможно, нет подключения. Попробуйте снова или напишите сами.',
        ''
      ]);
    })
    .finally(function () {
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-robot"></i> Сгенерировать ещё раз'; }
    });
}

function renderAIVariants(descriptions) {
  var wrap = document.getElementById('ai-variants-wrap');
  if (!wrap) return;

  var html = '<div style="font-size:11px;font-weight:700;color:var(--orange);margin-bottom:8px">✨ Выберите вариант который вам ближе:</div>';

  descriptions.forEach(function (text, i) {
    if (!text || text.trim() === '') return;
    html += '<div class="ai-variant">' +
      '<div class="ai-variant-label">Вариант ' + (i + 1) + '</div>' +
      '<div style="font-size:12px;line-height:1.65;color:var(--t2);white-space:pre-wrap">' + esc(text) + '</div>' +
      '<button class="ai-choose-btn" onclick="useAIVariant(' + JSON.stringify(text.replace(/'/g, "\\'")) + ')">✅ Использовать этот</button>' +
      '</div>';
  });

  html += '<div class="ai-actions">' +
    '<button class="ai-act-btn" onclick="genAI()">🔄 Попробовать ещё</button>' +
    '<button class="ai-act-btn" onclick="document.getElementById(\'ai-variants-wrap\').style.display=\'none\'">✕ Скрыть</button>' +
    '</div>';

  wrap.innerHTML = html;
}

function useAIVariant(text) {
  var desc = document.getElementById('a-desc');
  if (desc) desc.value = text;
  var wrap = document.getElementById('ai-variants-wrap');
  if (wrap) wrap.style.display = 'none';
  toast('✅ Текст применён — можете дополнить его!');
}

function val(id) {
  var el = document.getElementById(id);
  if (!el) return '';
  return el.value || '';
}

/* ════════════════════════════════════════════════════
   📤 SUBMIT LISTING
═══════════════════════════════════════════════════ */
function submitListing() {
  var priceRaw = (val('a-price')).replace(/\s/g, '');
  var price = parseInt(priceRaw) || 0;
  var desc = val('a-desc').trim();
  var district = val('a-district');
  var rooms = parseInt(val('a-rooms')) || 3;
  var area = parseFloat(val('a-area')) || 0;
  var complex = val('a-complex').trim();
  var floor = parseInt(val('a-floor')) || null;
  var totalFloors = parseInt(val('a-totalfloors')) || null;
  var ceilingHeight = val('a-ceiling');
  var exchange = document.getElementById('a-exchange') && document.getElementById('a-exchange').checked;
  var type = val('a-type') || 'apartment';

  if (!desc) { toast('✏️ Добавьте описание объекта'); return; }
  if (price <= 0) { toast('💰 Укажите цену'); return; }

  var newListing = {
    id: 'tmp_' + Date.now(),
    type: type,
    rooms: rooms,
    area: area,
    floor: floor,
    totalFloors: totalFloors,
    ceilingHeight: ceilingHeight,
    complex: complex,
    city: 'Астана',
    district: district,
    price: price,
    desc: desc,
    exchange: exchange,
    realtor: curUser ? curUser.name : '',
    realtorFull: curUser ? curUser.name : '',
    agency: curUser ? (curUser.agency || '') : '',
    phone: curUser ? (curUser.phone || '') : '',
    badge: 'Новое',
    tags: exchange ? ['Обмен'] : [],
    hasVideo: (uploadedMedia.videos || []).length > 0,
    liked: false,
    photos: uploadedMedia.photos ? uploadedMedia.photos.slice() : [],
    videos: uploadedMedia.videos ? uploadedMedia.videos.slice() : [],
    createdAt: new Date().toISOString()
  };

  listings.unshift(newListing);
  saveListingsLocal();
  renderListings();

  if (db && curUser) {
    saveToSupabase(newListing).catch(function (e) {
      console.warn('⚠️ Supabase save failed:', e.message);
    });
  }

  closeM('m-add');
  uploadedMedia = { photos: [], videos: [] };
  updateMediaCounters();
  toast('🎉 Объект опубликован! Коллеги уже видят его.');
  go('s-search');
}

function uploadMedia(type) {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = type === 'photo' ? 'image/*' : 'video/*';
  input.multiple = true;
  input.onchange = function (e) {
    var files = e.target.files;
    if (!files || files.length === 0) return;
    toast('⏳ Загружаю ' + files.length + ' ' + (type === 'photo' ? 'фото' : 'видео') + '...');
    Array.from(files).forEach(function (file) {
      if (type === 'video' && file.size > 20 * 1024 * 1024) {
        toast('⚠️ Видео слишком большое, максимум 20MB'); return;
      }
      var reader = new FileReader();
      reader.onload = function (evt) {
        if (type === 'photo') uploadedMedia.photos.push(evt.target.result);
        else uploadedMedia.videos.push(evt.target.result);
        updateMediaCounters();
        toast('✅ ' + (type === 'photo' ? 'Фото' : 'Видео') + ' загружено!');
      };
      reader.readAsDataURL(file);
    });
  };
  input.click();
}

function updateMediaCounters() {
  var pc = document.getElementById('photo-count');
  var vc = document.getElementById('video-count');
  if (pc) pc.textContent = (uploadedMedia.photos || []).length > 0 ? (uploadedMedia.photos.length + ' фото') : '';
  if (vc) vc.textContent = (uploadedMedia.videos || []).length > 0 ? (uploadedMedia.videos.length + ' видео') : '';
}

function formatPriceInput(inp) {
  if (!inp) return;
  var v = inp.value.replace(/\D/g, '');
  if (v) inp.value = parseInt(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  else inp.value = '';
}

/* ════════════════════════════════════════════════════
   🔐 AUTH — Supabase based
═══════════════════════════════════════════════════ */
function doLogin() {
  var email = (document.getElementById('l-email') ? document.getElementById('l-email').value : '').trim().toLowerCase();
  var pass = (document.getElementById('l-pass') ? document.getElementById('l-pass').value : '').trim();
  if (!email) { toast('📧 Введите email'); return; }
  if (!pass) { toast('🔑 Введите пароль'); return; }

  if (db) {
    db.auth.signInWithPassword({ email: email, password: pass })
      .then(function (res) {
        if (res.error) { toast('❌ ' + res.error.message); return; }
        var user = res.data.user;
        // Fetch profile
        return db.from('profiles').select('*').eq('id', user.id).single()
          .then(function (pr) {
            var profile = pr.data || {};
            curUser = {
              id: user.id,
              sbId: user.id,
              name: profile.full_name || email.split('@')[0],
              email: email,
              phone: profile.phone || '',
              agency: profile.agency || '',
              isAdmin: email === ADMIN_EMAIL
            };
            onLoggedIn();
          });
      })
      .catch(function (e) {
        toast('❌ Ошибка входа: ' + e.message);
      });
  } else {
    // Offline mode (no Supabase JS)
    curUser = {
      id: 'local_' + Date.now(),
      name: email.split('@')[0],
      email: email,
      isAdmin: email === ADMIN_EMAIL
    };
    onLoggedIn();
  }
}

function doReg() {
  var name = (document.getElementById('r-name') ? document.getElementById('r-name').value : '').trim();
  var email = (document.getElementById('r-email') ? document.getElementById('r-email').value : '').trim().toLowerCase();
  var phone = (document.getElementById('r-phone') ? document.getElementById('r-phone').value : '').trim();
  var agency = (document.getElementById('r-agency') ? document.getElementById('r-agency').value : '').trim();
  var pass = (document.getElementById('r-pass') ? document.getElementById('r-pass').value : '').trim();

  if (!name) { toast('📝 Введите ваше имя'); return; }
  if (!email) { toast('📧 Введите email'); return; }
  if (!pass || pass.length < 6) { toast('🔑 Пароль минимум 6 символов'); return; }

  if (db) {
    db.auth.signUp({ email: email, password: pass, options: { data: { full_name: name } } })
      .then(function (res) {
        if (res.error) { toast('❌ ' + res.error.message); return; }
        var user = res.data.user;
        // Save profile
        return db.from('profiles').upsert({
          id: user.id,
          email: email,
          full_name: name,
          phone: phone,
          agency: agency
        }).then(function () {
          curUser = { id: user.id, sbId: user.id, name: name, email: email, phone: phone, agency: agency, isAdmin: false };
          onLoggedIn();
          toast('🎉 Добро пожаловать в Flapy, ' + name + '!');
        });
      })
      .catch(function (e) { toast('❌ ' + e.message); });
  } else {
    curUser = { id: 'local_' + Date.now(), name: name, email: email, phone: phone, agency: agency, isAdmin: false };
    onLoggedIn();
    toast('🎉 Добро пожаловать, ' + name + '!');
  }
}

function onLoggedIn() {
  localStorage.setItem('fp_user', JSON.stringify(curUser));
  renderAuthSlot();
  closeM('m-auth');
  renderProf();
  updateAiraBadge();
  updateNavVisibility();
  if (curUser.isAdmin) showAdminDot();
  if (db) { initAiraRealtime(); loadAiraMessages(); }
  if (!curUser.isAdmin) toast('👋 С возвращением, ' + curUser.name.split(' ')[0] + '!');
}

function doLogout() {
  if (db) db.auth.signOut();
  curUser = null;
  localStorage.removeItem('fp_user');
  if (realtimeChannel) { db.removeChannel(realtimeChannel); realtimeChannel = null; }
  airaMessages = [];
  renderAuthSlot();
  renderProf();
  updateAiraBadge();
  updateNavVisibility();
  hideAdminDot();
  toast('👋 До встречи!');
}

function renderAuthSlot() {
  var slot = document.getElementById('auth-slot');
  if (!slot) return;
  if (curUser) {
    var ini = (curUser.name || 'R').charAt(0).toUpperCase();
    slot.innerHTML = '<div class="u-chip" onclick="go(\'s-prof\');nav(document.getElementById(\'n-prof\'))"><div class="u-ava">' + ini + '</div><span class="u-nm">' + curUser.name.split(' ')[0] + '</span></div>';
  } else {
    slot.innerHTML = '<button class="login-btn" onclick="openM(\'m-auth\')">Войти</button>';
  }
}

function authTab(tab) {
  var i = document.getElementById('at-in'), u = document.getElementById('at-up');
  var fi = document.getElementById('af-in'), fu = document.getElementById('af-up');
  if (i) i.classList.toggle('on', tab === 'in');
  if (u) u.classList.toggle('on', tab === 'up');
  if (fi) fi.style.display = tab === 'in' ? 'block' : 'none';
  if (fu) fu.style.display = tab === 'up' ? 'block' : 'none';
  var w = document.getElementById('auth-welcome');
  if (w) w.textContent = tab === 'in' ? 'Рады вас видеть! 🏠' : 'Добро пожаловать в Flapy! ✨';
}

/* ════════════════════════════════════════════════════
   👑 ADMIN MODE
═══════════════════════════════════════════════════ */
function showAdminDot() {
  var dot = document.getElementById('admin-dot');
  if (dot) dot.style.display = 'block';
}

function hideAdminDot() {
  var dot = document.getElementById('admin-dot');
  if (dot) dot.style.display = 'none';
}

function toggleAdminPanel() {
  if (!curUser || !curUser.isAdmin) return;
  var panel = document.getElementById('admin-overlay');
  if (!panel) return;
  adminPanelOpen = !adminPanelOpen;
  panel.classList.toggle('on', adminPanelOpen);
  if (adminPanelOpen) loadAdminData();
}

function admTab(el, sectionId) {
  document.querySelectorAll('.adm-tab').forEach(function (t) { t.classList.remove('on'); });
  document.querySelectorAll('.adm-section').forEach(function (s) { s.style.display = 'none'; });
  if (el) el.classList.add('on');
  var sec = document.getElementById(sectionId);
  if (sec) sec.style.display = 'block';
}

function loadAdminData() {
  if (!db) return;

  // Load users
  db.from('profiles').select('*').order('created_at', { ascending: false })
    .then(function (res) {
      var users = res.data || [];
      var sec = document.getElementById('adm-users');
      if (!sec) return;
      sec.innerHTML = '<div style="font-size:13px;font-weight:700;margin-bottom:10px">Пользователи (' + users.length + ')</div>' +
        users.map(function (u) {
          return '<div class="adm-row"><b>' + (u.full_name || 'Без имени') + '</b><br><small>' + u.email + ' · ' + (u.agency || 'нет агентства') + '</small></div>';
        }).join('');
    });

  // Load all listings
  db.from('listings').select('*').order('created_at', { ascending: false })
    .then(function (res) {
      var items = res.data || [];
      var sec = document.getElementById('adm-listings');
      if (!sec) return;
      sec.innerHTML = '<div style="font-size:13px;font-weight:700;margin-bottom:10px">Объекты (' + items.length + ')</div>' +
        items.map(function (l) {
          return '<div class="adm-row"><b>' + (l.rooms || '?') + '-комн. · ' + (l.area || '?') + ' м² · ' + fmtPrice(l.price) + ' ₸</b><br>' +
            '<small>' + (l.district || '') + ' · ' + (l.realtor_name || 'неизвестно') + '</small>' +
            '<div style="margin-top:6px"><button style="font-size:10px;padding:3px 8px;border-radius:6px;background:var(--red);color:#fff;border:none;cursor:pointer" onclick="adminDeleteListing(\'' + l.id + '\')">Удалить</button></div>' +
            '</div>';
        }).join('');
    });

  // Load messages
  db.from('messages').select('*').order('created_at', { ascending: false }).limit(30)
    .then(function (res) {
      var msgs = res.data || [];
      var sec = document.getElementById('adm-msgs');
      if (!sec) return;
      sec.innerHTML = '<div style="font-size:13px;font-weight:700;margin-bottom:10px">Сообщения (' + msgs.length + ')</div>' +
        msgs.map(function (m) {
          return '<div class="adm-row"><b>' + (m.user_name || 'Аноним') + '</b> <small>· ' + formatMsgTime(m.created_at) + '</small><br><span style="color:var(--t2)">' + esc(m.content || '') + '</span></div>';
        }).join('');
    });
}

function adminDeleteListing(id) {
  if (!db || !curUser || !curUser.isAdmin) return;
  if (!confirm('Удалить объект?')) return;
  db.from('listings').delete().eq('id', id)
    .then(function (res) {
      if (res.error) { toast('❌ Ошибка: ' + res.error.message); return; }
      listings = listings.filter(function (l) { return String(l.id) !== String(id); });
      saveListingsLocal();
      renderListings();
      loadAdminData();
      toast('🗑️ Объект удалён');
    });
}

/* ════════════════════════════════════════════════════
   📋 RENDER LISTINGS
═══════════════════════════════════════════════════ */
function renderListings() {
  var el = document.getElementById('list-body');
  if (!el) return;

  var filtered = listings.slice();
  if (listTab === 'exch') filtered = filtered.filter(function (l) { return l.exchange; });
  else if (curFilter === 'video') filtered = filtered.filter(function (l) { return l.hasVideo; });
  else if (curFilter !== 'all') filtered = filtered.filter(function (l) { return l.type === curFilter; });

  if (filtered.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">🏠</div><div class="empty-t">Объектов пока нет</div><div class="empty-s">Станьте первым — добавьте объект!</div></div>';
    return;
  }

  el.innerHTML = filtered.map(function (l) {
    var ini = (l.realtor || 'R').charAt(0);
    var em = l.type === 'apartment' ? '🏢' : l.type === 'house' ? '🏡' : l.type === 'commercial' ? '🏪' : '🌳';
    var photos = Array.isArray(l.photos) ? l.photos : [];
    var mediaHtml = photos.length > 0
      ? '<div class="lcard-media" style="padding:0"><img src="' + photos[0] + '" style="width:100%;height:185px;object-fit:cover" loading="lazy">' +
        (l.badge ? '<div class="lcard-badge" style="background:var(--orange)">' + l.badge + '</div>' : '') + '</div>'
      : '<div class="lcard-media"><div class="lcard-em">' + em + '</div>' +
        (l.badge ? '<div class="lcard-badge" style="background:var(--orange)">' + l.badge + '</div>' : '') + '</div>';

    var subInfo = [l.rooms + '-комн.', l.area + ' м²'];
    if (l.floor && l.totalFloors) subInfo.push(l.floor + '/' + l.totalFloors + ' эт.');
    if (l.ceilingHeight) subInfo.push('⬆ ' + l.ceilingHeight + ' м');

    return '<div class="lcard su" onclick="openDetail(\'' + l.id + '\')">' + mediaHtml +
      '<div class="lcard-body">' +
      '<div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>' + (l.complex || (l.district + ', Астана')) + '</div>' +
      '<div class="lcard-price">' + fmtPrice(l.price) + ' ₸</div>' +
      '<div class="lcard-sub">' + subInfo.join(' · ') + '</div>' +
      (l.desc ? '<div style="font-size:12px;color:var(--t2);line-height:1.5;margin:6px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(l.desc) + '</div>' : '') +
      (l.exchange ? '<div style="font-size:11px;color:var(--green);font-weight:600;margin-bottom:6px">🔄 Готов к обмену</div>' : '') +
      '<div class="lcard-footer"><div class="lf-ava" style="background:var(--navy)">' + ini + '</div>' +
      '<div class="lf-name">' + esc(l.realtorFull || l.realtor) + (l.agency ? ' · ' + esc(l.agency) : '') + '</div></div>' +
      '<div class="lcard-cta">' +
      '<button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\'' + esc(l.phone) + '\')"><i class="fas fa-phone"></i> Позвонить</button>' +
      '<button class="cta-btn cta-msg" onclick="event.stopPropagation();openAiraWithMsg(\'' + esc(l.id) + '\')"><i class="fas fa-comment"></i> Написать</button>' +
      '</div></div></div>';
  }).join('');
}

function openAiraWithMsg(listingId) {
  var l = listings.find(function (x) { return String(x.id) === String(listingId); });
  go('s-aira');
  nav(document.getElementById('n-aira'));
  if (l) {
    var inp = document.getElementById('aira-inp');
    if (inp) inp.value = 'Интересует ваш объект: ' + l.rooms + '-комн. ' + l.area + ' м², ' + fmtPrice(l.price) + ' ₸';
  }
}

/* ════════════════════════════════════════════════════
   🔍 DETAIL VIEW
═══════════════════════════════════════════════════ */
function openDetail(id) {
  var l = listings.find(function (x) { return String(x.id) === String(id); });
  if (!l) return;
  var body = document.getElementById('m-det-body');
  if (!body) return;

  var em = l.type === 'apartment' ? '🏢' : l.type === 'house' ? '🏡' : l.type === 'commercial' ? '🏪' : '🌳';
  var photos = Array.isArray(l.photos) ? l.photos : [];

  var mediaHtml = photos.length > 0
    ? '<div style="display:flex;gap:6px;overflow-x:auto;padding:0 17px 12px">' +
      photos.map(function (p) { return '<img src="' + p + '" style="height:160px;border-radius:10px;flex-shrink:0;cursor:pointer" onclick="viewPhoto(\'' + p + '\')" loading="lazy">'; }).join('') + '</div>'
    : '<div style="height:160px;display:flex;align-items:center;justify-content:center;font-size:80px;opacity:.2;background:var(--bg3)">' + em + '</div>';

  var specs = [];
  if (l.rooms) specs.push({ k: 'Комнаты', v: l.rooms });
  if (l.area) specs.push({ k: 'Площадь', v: l.area + ' м²' });
  if (l.floor && l.totalFloors) specs.push({ k: 'Этаж', v: l.floor + ' из ' + l.totalFloors });
  if (l.ceilingHeight) specs.push({ k: 'Высота потолков', v: l.ceilingHeight + ' м' });
  if (l.complex) specs.push({ k: 'ЖК', v: l.complex });
  if (l.district) specs.push({ k: 'Район', v: l.district + ', Астана' });

  var specsHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:0 17px 14px">' +
    specs.map(function (s) {
      return '<div style="background:var(--bg3);border-radius:8px;padding:8px 10px"><div style="font-size:10px;color:var(--t3)">' + s.k + '</div><div style="font-size:13px;font-weight:600;margin-top:2px">' + esc(String(s.v)) + '</div></div>';
    }).join('') + '</div>';

  body.innerHTML = '<div class="sh-handle"></div>' + mediaHtml +
    '<div style="padding:10px 17px 4px"><div style="font-size:24px;font-weight:900">' + fmtPrice(l.price) + ' ₸</div>' +
    (l.area && l.price ? '<div style="font-size:12px;color:var(--t3);margin-top:2px">≈ ' + Math.round(l.price / l.area).toLocaleString('ru') + ' ₸/м²</div>' : '') +
    (l.exchange ? '<div style="font-size:12px;color:var(--green);font-weight:600;margin-top:4px">🔄 Готов к обмену</div>' : '') + '</div>' +
    specsHtml +
    (l.desc ? '<div style="padding:0 17px 14px;font-size:13px;line-height:1.75;color:var(--t2)">' + esc(l.desc).replace(/\n/g, '<br>') + '</div>' : '') +
    '<div style="margin:0 17px 14px;background:var(--bg3);border-radius:12px;padding:12px"><div style="font-size:11px;color:var(--t3)">Риэлтор</div><div style="font-weight:700;font-size:13px;margin-top:3px">' + esc(l.realtorFull || l.realtor) + '</div>' +
    (l.agency ? '<div style="font-size:12px;color:var(--t3)">' + esc(l.agency) + '</div>' : '') + '</div>' +
    '<div style="display:flex;gap:8px;padding:0 17px 8px">' +
    (l.phone ? '<button style="flex:1;padding:12px;border-radius:12px;background:var(--green);color:#fff;font-size:13px;font-weight:700;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px" onclick="callRealtor(\'' + esc(l.phone) + '\')" ><i class="fas fa-phone"></i> Позвонить</button>' : '') +
    '<button style="flex:1;padding:12px;border-radius:12px;background:var(--navy);color:#fff;font-size:13px;font-weight:700;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px" onclick="closeM(\'m-det\');openAiraWithMsg(\'' + l.id + '\')"><i class="fas fa-comment"></i> Написать</button></div>';

  openM('m-det');
}

function viewPhoto(src) {
  var win = window.open('', '_blank');
  if (win) win.document.write('<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="' + src + '" style="max-width:100%;max-height:100vh" onclick="window.close()"></body></html>');
}

/* ════════════════════════════════════════════════════
   👤 PROFILE
═══════════════════════════════════════════════════ */
function renderProf() {
  var el = document.getElementById('prof-body');
  if (!el) return;

  if (!curUser) {
    el.innerHTML = '<div style="text-align:center;padding:52px 20px"><div style="font-size:64px;margin-bottom:16px">🏠</div><div style="font-size:17px;font-weight:700;margin-bottom:8px">Войдите в Flapy</div><div style="font-size:13px;color:var(--t3);margin-bottom:24px">Добавляйте объекты, общайтесь с коллегами и закрывайте больше сделок</div><button onclick="openM(\'m-auth\')" class="btn-primary"><i class="fas fa-sign-in-alt"></i> Войти</button></div>';
    return;
  }

  var ini = (curUser.name || 'R').charAt(0).toUpperCase();
  var myListings = listings.filter(function (l) { return l.realtorId === curUser.id || l.realtor === curUser.name; });

  el.innerHTML = '<div class="prof-hero">' +
    '<div class="ph-ava">' + ini + '</div>' +
    '<div class="ph-name">' + esc(curUser.name) + (curUser.isAdmin ? ' ⚙️' : '') + '</div>' +
    '<div class="ph-tag">🏠 Риэлтор · ' + (curUser.agency || 'Самозанятый') + '</div>' +
    '<div class="ph-stats"><div class="ph-stat"><div class="ph-val">' + myListings.length + '</div><div class="ph-lbl">объектов</div></div></div>' +
    '</div>' +
    '<div class="menu-sec"><div class="menu-lbl">Мои разделы</div>' +
    '<div class="menu-item" onclick="needAuth(() => openM(\'m-add\'))"><div class="menu-ico" style="background:rgba(30,45,90,.1)">➕</div><div><div class="menu-name">Добавить объект</div><div class="menu-sub">Опубликовать новый</div></div></div>' +
    '<div class="menu-item" onclick="go(\'s-aira\');nav(document.getElementById(\'n-aira\'))"><div class="menu-ico" style="background:rgba(244,123,32,.1)">💬</div><div><div class="menu-name">Aira — чат</div><div class="menu-sub">Коллеги онлайн</div></div></div>' +
    '<div class="menu-item" onclick="go(\'s-notif\')"><div class="menu-ico" style="background:rgba(39,174,96,.1)">🔔</div><div style="flex:1"><div class="menu-name">Уведомления</div><div class="menu-sub" id="menu-notif-count">загрузка...</div></div></div>' +
    '</div>' +
    '<div class="menu-sec"><div class="menu-lbl">Аккаунт</div>' +
    '<div class="menu-item" onclick="doLogout()"><div class="menu-ico" style="background:rgba(231,76,60,.1)">🚪</div><div><div class="menu-name" style="color:var(--red)">Выйти</div><div class="menu-sub">До встречи!</div></div></div>' +
    '</div>';

  updateNotificationsCount();
}

/* ════════════════════════════════════════════════════
   🔔 NOTIFICATIONS
═══════════════════════════════════════════════════ */
function addNotification(data) {
  var now = new Date();
  var tm = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  notifications.unshift({ id: Date.now(), from: data.from, text: data.text, time: tm, read: false });
  if (notifications.length > 30) notifications = notifications.slice(0, 30);
  updateNotificationsCount();
  saveNotifications();
}

function saveNotifications() {
  try { localStorage.setItem('fp_notifications', JSON.stringify(notifications)); } catch (e) {}
}

function updateNotificationsCount() {
  var unread = notifications.filter(function (n) { return !n.read; }).length;
  var badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = unread > 9 ? '9+' : unread || '';
    badge.style.display = unread > 0 ? 'inline-block' : 'none';
  }
  var mc = document.getElementById('menu-notif-count');
  if (mc) mc.textContent = unread > 0 ? (unread + ' новых') : 'нет новых';
}

function renderNotifications() {
  var el = document.getElementById('notif-body');
  if (!el) return;
  if (notifications.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-ico">🔔</div><div class="empty-t">Всё спокойно</div><div class="empty-s">Уведомления появятся здесь</div></div>';
    return;
  }
  el.innerHTML = '<div style="font-size:18px;font-weight:800;padding:14px 0 10px">Уведомления</div>' +
    notifications.map(function (n) {
      return '<div class="notif-item" style="' + (n.read ? '' : 'border-left:3px solid var(--orange)') + '" onclick="markRead(' + n.id + ')">' +
        '<span class="notif-ico">💬</span><div><div class="notif-txt"><b>' + esc(n.from) + ':</b> ' + esc(n.text) + '</div>' +
        '<div class="notif-time">' + n.time + '</div></div></div>';
    }).join('');
}

function markRead(id) {
  var n = notifications.find(function (x) { return x.id === id; });
  if (n) { n.read = true; updateNotificationsCount(); renderNotifications(); saveNotifications(); }
}

/* ════════════════════════════════════════════════════
   🛠️ UTILITIES
═══════════════════════════════════════════════════ */
function esc(s) {
  return (s || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtPrice(p) {
  if (!p) return '0';
  return Number(p).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function formatMsgTime(ts) {
  if (!ts) return '';
  try {
    var d = new Date(ts);
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  } catch (e) { return ''; }
}

function callRealtor(phone) {
  if (phone && phone !== '') window.location.href = 'tel:' + phone.replace(/\s/g, '');
  else toast('📞 Телефон не указан');
}

var toastTimer = null;
function toast(msg, ms) {
  var el = document.getElementById('toast');
  if (!el) return;
  if (toastTimer) clearTimeout(toastTimer);
  el.textContent = msg;
  el.classList.add('show');
  toastTimer = setTimeout(function () { el.classList.remove('show'); }, ms || 2800);
}

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
}

function applyLangUI() {
  var ru = document.getElementById('lo-ru'), kz = document.getElementById('lo-kz');
  if (ru) ru.classList.toggle('on', curLang === 'ru');
  if (kz) kz.classList.toggle('on', curLang === 'kz');
}

function updateNavVisibility() {
  var pw = document.getElementById('nav-plus-wrap');
  if (pw) pw.style.display = curUser ? 'block' : 'none';
}

function setListTab(tab) {
  listTab = tab;
  var t1 = document.getElementById('tab-obj'), t2 = document.getElementById('tab-exch');
  if (t1) t1.classList.toggle('on', tab === 'obj');
  if (t2) t2.classList.toggle('on', tab === 'exch');
  renderListings();
}

function setFilt(el, f) {
  document.querySelectorAll('.fchip').forEach(function (c) { c.classList.remove('on'); });
  if (el) el.classList.add('on');
  curFilter = f;
  renderListings();
}

function needAuth(cb) {
  if (!curUser) { toast('🔐 Войдите в аккаунт'); openM('m-auth'); return false; }
  if (typeof cb === 'function') cb();
  return true;
}

function go(id) {
  document.querySelectorAll('.scr').forEach(function (s) { s.classList.remove('on'); });
  var el = document.getElementById(id);
  if (el) el.classList.add('on');
  if (id === 's-prof') renderProf();
  if (id === 's-notif') renderNotifications();
  if (id === 's-aira') { renderAiraChat(); if (db && curUser && airaMessages.length === 0) loadAiraMessages(); }
  if (id === 's-search') renderListings();
}

function nav(el) {
  document.querySelectorAll('.nav-it').forEach(function (n) { n.classList.remove('on'); });
  if (el) el.classList.add('on');
}

function openM(id) { var e = document.getElementById(id); if (e) e.classList.add('on'); }
function closeM(id) { var e = document.getElementById(id); if (e) e.classList.remove('on'); }
function closeOvl(e, id) { if (e.target.id === id) closeM(id); }
