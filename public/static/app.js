/* FLAPY v1.0 — HOME IS WHERE THE HEART IS */
'use strict';

/* ════════════════════════════════════════════════════
   🔐 SUPABASE CONFIG (ЗАМЕНИ НА СВОИ КЛЮЧИ!)
═══════════════════════════════════════════════════ */
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_KEY = 'your-anon-key-here';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ════════════════════════════════════════════════════
   📊 STATE
═══════════════════════════════════════════════════ */
var curUser = null, curFilter = 'all', curLang = 'ru',
listings = [], uploadedMedia = {photos:[]}, currentSlide = 0;

/* ════════════════════════════════════════════════════
   💙 WARM MESSAGES
═══════════════════════════════════════════════════ */
const WARM_MSG = {
  welcome: 'Добро пожаловать домой 🏡',
  subtitle: 'Здесь вы найдёте место, где будет звучать ваш смех',
  explore: 'Исследуйте',
  login: 'Войти',
  call: 'Позвонить',
  whatsapp: 'Написать',
  empty: 'Здесь пока тихо... Но мы уже ищем для вас 🌿',
  error: 'Ой, что-то пошло не так 💙 Давайте попробуем ещё раз?'
};

/* ════════════════════════════════════════════════════
   🎬 LOADER ANIMATION (HOME + HEART)
═══════════════════════════════════════════════════ */
function showLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  
  loader.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;animation:fadeIn 0.5s ease">
      <!-- House Animation -->
      <div style="position:relative;width:80px;height:80px">
        <div style="
          position:absolute;inset:0;
          background:linear-gradient(135deg,#1E2D5A,#4A6FA5);
          clip-path:polygon(50% 0%,0% 40%,0% 100%,100% 100%,100% 40%);
          animation:gentleFloat 3s ease-in-out infinite;
        "></div>
        <!-- Heart inside house -->
        <div style="
          position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:24px;height:24px;
          background:#F47B20;
          clip-path:path('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z');
          animation:pulse 1.5s ease-in-out infinite;
        "></div>
      </div>
      <div style="text-align:center">
        <div style="font-size:24px;font-weight:800;color:#1E2D5A;letter-spacing:-1px">Flapy<span style="color:#F47B20">™</span></div>
        <div style="font-size:13px;color:#6B7280;margin-top:4px">${WARM_MSG.welcome}</div>
      </div>
      <div style="width:60px;height:3px;background:#E5E7EB;border-radius:2px;overflow:hidden">
        <div style="width:100%;height:100%;background:linear-gradient(90deg,#1E2D5A,#F47B20);animation:loadProgress 1.5s ease forwards"></div>
      </div>
    </div>
    <style>
      @keyframes gentleFloat {0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      @keyframes pulse {0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.15)}}
      @keyframes loadProgress {0%{width:0}100%{width:100%}}
      @keyframes fadeIn {from{opacity:0}to{opacity:1}}
    </style>
  `;
  
  setTimeout(() => {
    loader.style.opacity = '0';
    setTimeout(() => { loader.style.display = 'none'; }, 300);
  }, 2000);
}

/* ════════════════════════════════════════════════════
   🚀 INIT
═══════════════════════════════════════════════════ */
window.addEventListener('load', async function() {
  showLoader();
  
  // Check session
  const {data:{session}} = await supabase.auth.getSession();
  if (session) {
    curUser = session.user;
    renderAuthSlot();
  }
  
  // Load listings
  await loadListings();
  
  // Init TikTok-style feed
  initFeed();
});

/* ════════════════════════════════════════════════════
   📥 LOAD LISTINGS (SUPABASE)
═══════════════════════════════════════════════════ */
async function loadListings() {
  const {data, error} = await supabase
    .from('listings')
    .select('*, realtors(name, agency, phone, whatsapp)')
    .order('created_at', {ascending: false});
  
  if (error) { console.error('Load error:', error); return; }
  
  listings = (data || []).map(item => ({
    id: item.id,
    type: item.type,
    rooms: item.rooms,
    area: item.area,
    city: item.city,
    district: item.district,
    price: item.price,
    desc: item.desc,
    realtor: item.realtors?.name || 'Риэлтор',
    agency: item.realtors?.agency || '-',
    phone: item.phone,
    whatsapp: item.realtors?.whatsapp || item.phone,
    photos: item.photo_urls || [],
    tiktok: item.tiktok_url,
    badge: item.badge,
    createdAt: item.created_at
  }));
  
  renderFeed();
}

/* ════════════════════════════════════════════════════
   🎬 TIKTOK-STYLE FEED
═══════════════════════════════════════════════════ */
function initFeed() {
  const feed = document.getElementById('s-feed');
  if (!feed) return;
  
  // Enable snap scrolling
  feed.style.cssText = 'scroll-snap-type:y mandatory;overflow-y:scroll;height:100%';
}

function renderFeed() {
  const feed = document.getElementById('s-feed');
  if (!feed) return;
  
  if (listings.length === 0) {
    feed.innerHTML = `
      <div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#6B7280;text-align:center;padding:40px">
        <div style="font-size:64px;margin-bottom:16px;animation:gentleFloat 3s ease-in-out infinite">🏡</div>
        <div style="font-size:18px;font-weight:600;color:#1E2D5A;margin-bottom:8px">${WARM_MSG.empty}</div>
        <div style="font-size:14px">Будьте первым, кто добавит объект!</div>
      </div>
    `;
    return;
  }
  
  feed.innerHTML = listings.map((l, idx) => {
    const em = l.type === 'apartment' ? '🏢' : l.type === 'house' ? '🏡' : '🏪';
    const hasMedia = l.photos.length > 0 || l.tiktok;
    
    return `
      <div class="feed-card" style="
        height:100%;scroll-snap-align:start;scroll-snap-stop:always;
        position:relative;overflow:hidden;
        background:linear-gradient(135deg,#1a1a40,#0d1b3e);
      ">
        <!-- Media Layer -->
        ${hasMedia ? renderMediaLayer(l) : renderPlaceholder(em)}
        
        <!-- Overlay Gradient -->
        <div style="
          position:absolute;inset:0;
          background:linear-gradient(to bottom,rgba(0,0,0,0.1) 0%,transparent 25%,rgba(0,0,0,0.6) 70%,rgba(0,0,0,0.9) 100%);
          pointer-events:none;
        "></div>
        
        <!-- Content -->
        <div style="position:absolute;bottom:0;left:0;right:0;padding:20px 16px 100px;color:white;z-index:10">
          <div style="font-size:12px;opacity:0.8;margin-bottom:4px">📍 ${l.city}, ${l.district}</div>
          <div style="font-size:24px;font-weight:800;margin-bottom:8px">${fmtPrice(l.price)} ₸</div>
          <div style="font-size:14px;opacity:0.9;margin-bottom:8px">${l.rooms}-комнатная · ${l.area} м²</div>
          <div style="font-size:13px;opacity:0.8;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${l.desc}</div>
          
          <!-- Realtor Info -->
          <div style="display:flex;align-items:center;gap:10px;margin-top:16px;padding:10px;background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);border-radius:12px;border:1px solid rgba(255,255,255,0.15)">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#F47B20,#FF9A3C);display:flex;align-items:center;justify-content:center;font-weight:800">${l.realtor.charAt(0)}</div>
            <div style="flex:1">
              <div style="font-weight:600;font-size:13px">${l.realtor}</div>
              <div style="font-size:11px;opacity:0.7">${l.agency}</div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div style="display:flex;gap:10px;margin-top:12px">
            <button onclick="callRealtor('${l.phone}')" style="
              flex:1;padding:12px;background:#1E2D5A;color:white;border:none;
              border-radius:10px;font-weight:600;cursor:pointer;
              display:flex;align-items:center;justify-content:center;gap:6px;
              transition:transform 0.15s;
            " onmousedown="this.style.transform='scale(0.98)'">
              📞 ${WARM_MSG.call}
            </button>
            <button onclick="openWhatsApp('${l.whatsapp}', '${l.id}')" style="
              flex:1;padding:12px;background:#25D366;color:white;border:none;
              border-radius:10px;font-weight:600;cursor:pointer;
              display:flex;align-items:center;justify-content:center;gap:6px;
              transition:transform 0.15s;
            " onmousedown="this.style.transform='scale(0.98)'">
              💬 ${WARM_MSG.whatsapp}
            </button>
          </div>
        </div>
        
        <!-- Slide Indicator -->
        <div style="position:absolute;top:100px;right:16px;z-index:20">
          ${l.photos.length > 1 ? `<div style="background:rgba(0,0,0,0.5);padding:4px 8px;border-radius:8px;font-size:11px;font-weight:600">${l.photos.length} фото</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderMediaLayer(l) {
  if (l.photos.length > 0) {
    return `<img src="${l.photos[0]}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.style.display='none'">`;
  }
  if (l.tiktok) {
    return `
      <div style="width:100%;height:100%;position:absolute;inset:0;background:#000;display:flex;align-items:center;justify-content:center">
        <div style="text-align:center;color:white;padding:20px">
          <div style="font-size:48px;margin-bottom:12px">🎵</div>
          <div style="font-weight:600">Видео-обзор</div>
          <div style="font-size:13px;opacity:0.7;margin-top:8px">TikTok</div>
        </div>
        <!-- TikTok Watermark Overlay -->
        <div style="position:absolute;bottom:20px;right:20px;opacity:0.3;font-weight:800;font-size:14px">FLAPY</div>
      </div>
    `;
  }
  return '';
}

function renderPlaceholder(em) {
  return `
    <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:120px;opacity:0.1">
      ${em}
    </div>
  `;
}

/* ════════════════════════════════════════════════════
   📞 ACTIONS
═══════════════════════════════════════════════════ */
function callRealtor(phone) {
  window.location.href = `tel:${phone.replace(/\s/g, '')}`;
}

function openWhatsApp(phone, listingId) {
  const listing = listings.find(l => l.id === listingId);
  const text = encodeURIComponent(`Здравствуйте! Интересует ваше объявление на Flapy:\n${listing.rooms}-комнатная, ${listing.area} м², ${fmtPrice(listing.price)} ₸`);
  window.open(`https://wa.me/${phone.replace(/\s/g, '')}?text=${text}`, '_blank');
}

/* ════════════════════════════════════════════════════
   🔐 AUTH
═══════════════════════════════════════════════════ */
function renderAuthSlot() {
  const slot = document.getElementById('auth-slot');
  if (!slot) return;
  
  if (curUser) {
    const name = curUser.user_metadata?.name || curUser.email.split('@')[0];
    slot.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px 12px;background:rgba(30,45,90,0.1);border-radius:20px" onclick="go('s-prof')">
        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1E2D5A,#4A6FA5);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:14px">${name.charAt(0)}</div>
        <span style="font-weight:600;color:#1E2D5A;font-size:13px">${name.split(' ')[0]}</span>
      </div>
    `;
  } else {
    slot.innerHTML = `<button class="login-btn" onclick="openM('m-auth')" style="padding:10px 20px;background:#1E2D5A;color:white;border:none;border-radius:10px;cursor:pointer;font-weight:600">${WARM_MSG.login}</button>`;
  }
}

async function doLogin() {
  const email = document.getElementById('l-email')?.value.trim();
  const pass = document.getElementById('l-pass')?.value;
  
  if (!email || !pass) { toast('Введите email и пароль'); return; }
  
  const {data, error} = await supabase.auth.signInWithPassword({email, password: pass});
  if (error) { toast(error.message); return; }
  
  curUser = data.user;
  renderAuthSlot();
  closeM('m-auth');
  toast('👋 Добро пожаловать домой!');
}

async function doReg() {
  const name = document.getElementById('r-name')?.value.trim();
  const email = document.getElementById('r-email')?.value.trim();
  const phone = document.getElementById('r-phone')?.value.trim();
  const whatsapp = document.getElementById('r-whatsapp')?.value.trim();
  const pass = document.getElementById('r-pass')?.value;
  
  if (!name || !email || !pass) { toast('Заполните обязательные поля'); return; }
  
  const {data, error} = await supabase.auth.signUp({
    email, password: pass,
    options: { data: { name, phone, whatsapp } }
  });
  
  if (error) { toast(error.message); return; }
  
  // Save realtor profile
  await supabase.from('realtors').insert([{
    id: data.user.id,
    email, name, phone, whatsapp,
    agency: document.getElementById('r-agency')?.value || 'Моё агентство'
  }]);
  
  curUser = data.user;
  renderAuthSlot();
  closeM('m-auth');
  toast('🎉 Добро пожаловать домой!');
}

async function doLogout() {
  await supabase.auth.signOut();
  curUser = null;
  renderAuthSlot();
  toast('👋 До встречи!');
}

/* ════════════════════════════════════════════════════
   📤 ADD LISTING (WITH WATERMARK)
═══════════════════════════════════════════════════ */
async function submitListing() {
  if (!curUser) { toast('Сначала войдите'); openM('m-auth'); return; }
  
  const priceEl = document.getElementById('a-price');
  const descEl = document.getElementById('a-desc');
  
  if (!priceEl || !descEl) return;
  
  const price = parseInt(priceEl.value.replace(/\s/g, '')) || 0;
  const desc = descEl.value || '';
  
  if (!desc || price <= 0) { toast('Заполните все поля'); return; }
  
  // Apply watermark to photos
  const watermarkedPhotos = await Promise.all(uploadedMedia.photos.map(applyWatermark));
  
  // Save to Supabase
  const {error} = await supabase.from('listings').insert([{
    realtor_id: curUser.id,
    type: document.getElementById('a-type')?.value || 'apartment',
    rooms: parseInt(document.getElementById('a-rooms')?.value) || 3,
    area: parseInt(document.getElementById('a-area')?.value) || 85,
    city: document.getElementById('a-city')?.value || 'Астана',
    district: document.getElementById('a-district')?.value || 'Есиль',
    price, desc,
    phone: curUser.user_metadata?.phone || '+7 701 234 56 78',
    badge: 'Новое',
    photo_urls: watermarkedPhotos,
    tiktok_url: document.getElementById('a-tiktok')?.value || '',
    created_at: new Date().toISOString()
  }]);
  
  if (error) { toast('Ошибка сохранения'); console.error(error); return; }
  
  toast('✅ Объект опубликован с любовью!');
  closeM('m-add');
  loadListings();
  go('s-feed');
}

/* ════════════════════════════════════════════════════
   🖼️ WATERMARK (CANVAS)
═══════════════════════════════════════════════════ */
async function applyWatermark(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      // Draw watermark
      ctx.globalAlpha = 0.15;
      ctx.font = 'bold 40px Inter';
      ctx.fillStyle = '#1E2D5A';
      ctx.textAlign = 'center';
      ctx.fillText('FLAPY', canvas.width/2, canvas.height/2);
      
      // Return base64
      resolve(canvas.toDataURL('image/webp', 0.8));
    };
    img.src = imageUrl;
  });
}

function uploadMedia(type) {
  if (uploadedMedia.photos.length >= 5) { toast('Максимум 5 фото'); return; }
  
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) { toast('Максимум 5MB'); return; }
    
    const reader = new FileReader();
    reader.onload = function(evt) {
      uploadedMedia.photos.push(evt.target.result);
      toast(`✅ Фото добавлено (${uploadedMedia.photos.length}/5)`);
    };
    reader.readAsDataURL(file);
  };
  
  input.click();
}

/* ════════════════════════════════════════════════════
   ️ UTILS
═══════════════════════════════════════════════════ */
function fmtPrice(p) {
  if (!p) return '0';
  return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function toast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(30,45,90,0.95);color:white;padding:14px 24px;border-radius:12px;z-index:10000;opacity:0;transition:opacity 0.3s;font-weight:600;box-shadow:0 8px 30px rgba(0,0,0,0.2)';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 3000);
}

function go(id) {
  document.querySelectorAll('.scr').forEach(s => s.classList.remove('on'));
  const el = document.getElementById(id);
  if (el) el.classList.add('on');
}

function openM(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('on');
}

function closeM(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('on');
}

function closeOvl(e, id) {
  if (e.target.id === id) closeM(id);
}

/* ════════════════════════════════════════════════════
   🌍 LANG & THEME
═══════════════════════════════════════════════════ */
function setLang(lang) {
  curLang = lang;
  localStorage.setItem('fp_lang', lang);
  toast(lang === 'kz' ? '🇰 Қазақ тілі' : '🇷 Русский');
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('fp_theme', next);
}
