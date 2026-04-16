'use strict';

/* ════════════════════════════════════════════════════
   🔐 SUPABASE CONFIG — ТВОИ КЛЮЧИ
═══════════════════════════════════════════════════ */
const SUPABASE_URL = 'https://qjmfudpqfyanigizwvze.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbWZ1ZHBxZnlhbmlnaXp3dnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzUxODEsImV4cCI6MjA5MDYxMTE4MX0.XWBc3DAjOVMZ80VIlf4zZ1TgqtaxLDczdrPWwdpkkII';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ════════════════════════════════════════════════════
   📊 STATE
═══════════════════════════════════════════════════ */
let listings = [];
let curUser = null;
let curTab = 'all';
let favorites = JSON.parse(localStorage.getItem('fp_favs') || '[]');

/* ════════════════════════════════════════════════════
   🚀 INIT
═══════════════════════════════════════════════════ */
window.addEventListener('load', async () => {
  // Check session
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    curUser = session.user;
    const name = session.user.email?.split('@')[0] || 'Риэлтор';
    document.getElementById('auth-btn').textContent = '👤 ' + name;
  }
  
  await loadListings();
});

/* ════════════════════════════════════════════════════
   📥 LOAD LISTINGS FROM SUPABASE
═══════════════════════════════════════════════════ */
async function loadListings() {
  const { data, error } = await db
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) { console.error('Load error:', error); return; }
  
  listings = (data || []).map(item => ({
    id: item.id,
    price: item.price,
    desc: item.description,
    city: item.city,
    rooms: item.rooms,
    area: item.area,
    phone: item.phone,
    photos: item.photo_urls || [],
    is_exchange: item.is_exchange || false,
    views: item.views || 0,
    created_at: item.created_at
  }));
  
  renderFeed();
}

/* ════════════════════════════════════════════════════
   🎨 RENDER FEED
═══════════════════════════════════════════════════ */
function renderFeed() {
  const main = document.getElementById('main');
  if (!main) return;
  
  // Фильтр по вкладке
  const filtered = curTab === 'exchange' 
    ? listings.filter(l => l.is_exchange) 
    : listings.filter(l => !l.is_exchange);
    
  if (filtered.length === 0) {
    main.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--t3)">
        <div style="font-size:48px;margin-bottom:12px">${curTab === 'exchange' ? '🤝' : '🏡'}</div>
        <div style="font-weight:600;margin-bottom:4px">Пока пусто</div>
        <div style="font-size:13px">Нажмите + чтобы добавить первый объект</div>
      </div>`;
    return;
  }
  
  main.innerHTML = filtered.map(l => {
    const isFav = favorites.includes(l.id);
    const img = l.photos[0] || 'https://via.placeholder.com/400x200/e5e7eb/9ca3af?text=No+Photo';
    const badgeText = l.is_exchange ? '🔄 Обмен' : '💰 Продажа';
    const phoneClean = l.phone?.replace(/\D/g, '') || '';
    
    return `
    <div class="lcard" onclick="viewListing('${l.id}')">
      <button class="btn-fav ${isFav ? 'active' : ''}" onclick="toggleFav(event,'${l.id}')">${isFav ? '❤️' : '🤍'}</button>
      <div class="card-img">
        <img src="${img}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x200?text=Photo'">
        <div class="badge">${badgeText}</div>
      </div>
      <div style="font-size:22px;font-weight:800;margin-bottom:4px">${fmtPrice(l.price)} ₸</div>
      <div style="font-size:14px;color:var(--t2);margin-bottom:12px">${l.city || 'Астана'} · ${l.rooms || 3}-комн. · ${l.area || 85} м²</div>
      <div style="font-size:13px;line-height:1.5;color:var(--t1);margin-bottom:16px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${l.desc || 'Нет описания'}</div>
      <div style="display:flex;gap:10px">
        <a href="tel:${phoneClean}" class="glass-btn btn-call" onclick="event.stopPropagation()">📞 Позвонить</a>
        <a href="https://wa.me/${phoneClean}" target="_blank" class="glass-btn btn-wa" onclick="event.stopPropagation()">💬 Написать</a>
      </div>
      <div style="margin-top:12px;font-size:11px;color:var(--t3);display:flex;justify-content:space-between">
        <span>👁️ ${l.views} просмотров</span>
        <span>${timeAgo(l.created_at)}</span>
      </div>
    </div>`;
  }).join('');
}

/* ════════════════════════════════════════════════════
   📝 SUBMIT LISTING — С ГАЛОЧКОЙ ОБМЕНА
═══════════════════════════════════════════════════ */
async function submitListing() {
  const priceStr = document.getElementById('a-price').value.replace(/\s/g, '');
  const desc = document.getElementById('a-desc').value.trim();
  const phone = document.getElementById('a-phone').value.trim();
  const dealType = document.querySelector('input[name="deal_type"]:checked')?.value || 'sale';
  
  // Модерация: простые правила
  const spamWords = ['казино','спам','бесплатно','выигрыш'];
  if (spamWords.some(w => desc.toLowerCase().includes(w))) {
    alert('🚫 Обнаружен спам. Измените описание.'); return;
  }
  if (!desc || desc.length < 10) { alert('📝 Описание должно быть не менее 10 символов.'); return; }
  
  const price = parseInt(priceStr);
  if (!price || price < 100000) { alert('💰 Минимальная цена 100 000 ₸'); return; }
  if (!phone) { alert('📞 Укажите телефон для связи.'); return; }
  
  const isExchange = dealType === 'exchange';
  
  // Отправка в Supabase — только нужные поля
  const { error } = await db.from('listings').insert([{
    price,
    description: desc,
    phone,
    is_exchange: isExchange,  // ✅ Галочка "Обмен" сохраняется
    city: 'Астана',
    district: 'Есиль',
    rooms: 3,
    area: 85,
    photo_urls: [],
    views: 0,
    realtor_id: curUser?.id || null
  }]);
  
  if (error) { alert('❌ Ошибка: ' + error.message); return; }
  
  alert('✅ Объект опубликован!');
  closeM('m-add');
  
  // Очистка формы
  document.getElementById('a-price').value = '';
  document.getElementById('a-desc').value = '';
  document.getElementById('a-phone').value = '';
  document.querySelector('input[name="deal_type"][value="sale"]').checked = true;
  
  // Перезагрузка списка
  await loadListings();
}

/* ════════════════════════════════════════════════════
   ❤️ FAVORITES & VIEWS
═══════════════════════════════════════════════════ */
function toggleFav(e, id) {
  e.stopPropagation();
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }
  localStorage.setItem('fp_favs', JSON.stringify(favorites));
  renderFeed();
}

async function viewListing(id) {
  const listing = listings.find(l => l.id === id);
  if (!listing) return;
  
  // Increment views
  listing.views = (listing.views || 0) + 1;
  await db.from('listings').update({ views: listing.views }).eq('id', id);
  
  alert(`📄 ${listing.rooms}-комнатная, ${listing.area} м²
💰 ${fmtPrice(listing.price)} ₸
📍 ${listing.city}

👁️ Просмотров: ${listing.views}`);
}

/* ════════════════════════════════════════════════════
   🔧 UTILS & UI
═══════════════════════════════════════════════════ */
function switchTab(tab) {
  curTab = tab;
  document.getElementById('tab-all').classList.toggle('on', tab === 'all');
  document.getElementById('tab-exchange').classList.toggle('on', tab === 'exchange');
  renderFeed();
}

function openM(id) { document.getElementById(id).classList.add('on'); }
function closeM(id) { document.getElementById(id).classList.remove('on'); }

function fmtPrice(p) { 
  if (!p) return '0'; 
  return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' '); 
}

function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'только что';
  if (seconds < 3600) return Math.floor(seconds / 60) + ' мин. назад';
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' ч. назад';
  return Math.floor(seconds / 86400) + ' дн. назад';
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

/* ════════════════════════════════════════════════════
   🔐 AUTH
═══════════════════════════════════════════════════ */
async function doLogin() {
  const email = document.getElementById('l-email').value;
  const pass = document.getElementById('l-pass').value;
  if (!email || !pass) { alert('Заполните email и пароль'); return; }
  
  const { error } = await db.auth.signInWithPassword({ email, password: pass });
  if (error) { alert(error.message); return; }
  
  location.reload();
}

async function doLogout() {
  await db.auth.signOut();
  location.reload();
}

// Init theme
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
}
