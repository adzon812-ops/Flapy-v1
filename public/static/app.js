'use strict';

/* ── STATE ─────────────────────────────────────────────── */
var listings = [];
var curFilter = 'all';
var curUser = null;

/* ── BOOT ──────────────────────────────────────────────── */
window.addEventListener('load', function() {
  try { var s = localStorage.getItem('fp_user'); if(s) curUser = JSON.parse(s); } catch(e){}
  if(localStorage.getItem('fp_welcomed')) {
    var w = document.getElementById('welcome-overlay');
    if(w) { w.style.opacity = '0'; w.style.pointerEvents = 'none'; }
  } else {
    localStorage.setItem('fp_welcomed','1');
    setTimeout(function(){
      var w = document.getElementById('welcome-overlay');
      if(w) w.classList.add('fade');
    }, 3000);
  }
  setTimeout(function(){
    var ld = document.getElementById('loader');
    if(ld) { ld.style.opacity = '0'; setTimeout(function(){ld.style.display='none'},400); }
    fetchListings();
  }, 800);
  updateAuth();
});

/* ── DATA ──────────────────────────────────────────────── */
function fetchListings() {
  fetch('/api/listings').then(r=>r.json()).then(d=>{
    listings = d.listings || [];
    renderListings();
  }).catch(()=>{ listings = []; renderListings(); });
}

function renderListings() {
  var el = document.getElementById('list-body');
  if(!el) return;
  var res = listings.slice();
  if(curFilter === 'video') res = res.filter(l => l.hasVideo);
  else if(curFilter !== 'all') res = res.filter(l => l.type === curFilter);
  
  if(!res.length) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--t3)"><i class="fas fa-home" style="font-size:32px;opacity:0.3;margin-bottom:10px;display:block"></i>Ничего не найдено. Попробуйте другой фильтр.</div>';
    return;
  }
  el.innerHTML = res.map(buildCard).join('');
}

function buildCard(l) {
  var price = Number(l.price).toLocaleString('ru-RU', {minimumFractionDigits:0}) + ' ₸';
  var badge = l.badge || (l.hasVideo ? '🎬 Видео' : '');
  var badgeStyle = badge.includes('Обмен') ? 'background:var(--trust)' : (badge.includes('Горящее') ? 'background:#E74C3C' : '');
  
  return `
    <div class="l-card" onclick="window.location='tel:${l.phone || '+77011234567'}'">
      <div class="l-media">
        ${l.hasVideo ? `<img src="https://img.youtube.com/vi/${l.videoId}/hqdefault.jpg">` : '<div style="font-size:64px;opacity:0.2">🏠</div>'}
        ${badge ? `<div class="l-badge" style="${badgeStyle}">${badge}</div>` : ''}
      </div>
      <div class="l-body">
        <div class="l-price">${price}</div>
        <div class="l-sub">${l.rooms?l.rooms+'к · ':''} ${l.area} м² · ${l.district}</div>
        <div class="l-realtor">
          <div class="r-ava">${(l.realtor||'R').charAt(0)}</div>
          <div class="r-name">${l.realtor} · ${l.agency}</div>
        </div>
        <div class="l-cta">
          <button class="btn-cta btn-call" onclick="event.stopPropagation();window.location='tel:${l.phone}'"><i class="fas fa-phone"></i> Позвонить</button>
          <button class="btn-cta btn-msg" onclick="event.stopPropagation();toast('💬 Чат с риэлтором скоро')"><i class="fas fa-comment"></i> Написать</button>
        </div>
      </div>
    </div>`;
}

/* ── UI CONTROLS ───────────────────────────────────────── */
function setTab(el, tab) {
  document.querySelectorAll('.l-tab').forEach(t=>t.classList.remove('on'));
  el.classList.add('on');
  // В реальной версии здесь фильтрация по типу
}

function setFilt(el, f) {
  document.querySelectorAll('.f-chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  curFilter = f;
  renderListings();
}

function go(id, el) {
  document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'));
  var s = document.getElementById(id);
  if(s) s.classList.add('on');
  if(el) {
    document.querySelectorAll('.nav-it').forEach(n=>n.classList.remove('on'));
    el.classList.add('on');
  }
}

function openAdd() { 
  if(!curUser) { openAuth(); toast('🔐 Войдите, чтобы добавить объект'); return; }
  document.getElementById('m-add').classList.add('on'); 
}

function openAuth() { document.getElementById('m-auth').classList.add('on'); }
function closeIfBg(e, id) { if(e.target.id===id) document.getElementById(id).classList.remove('on'); }

function toast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2800);
}

function updateAuth() {
  var slot = document.getElementById('auth-slot');
  if(curUser) {
    slot.innerHTML = '<i class="fas fa-check-circle"></i> ' + curUser.name.split(' ')[0];
  } else {
    slot.innerHTML = '<i class="fas fa-sign-in-alt"></i> Войти';
  }
}

/* ── AUTH & LISTING ────────────────────────────────────── */
function doLogin() {
  var email = document.getElementById('l-email').value;
  if(!email) { toast('Введите email'); return; }
  fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email}) })
  .then(r=>r.json()).then(d=>{
    if(d.success) {
      curUser = d.user;
      localStorage.setItem('fp_user', JSON.stringify(curUser));
      updateAuth();
      document.getElementById('m-auth').classList.remove('on');
      toast('👋 Добро пожаловать домой, '+curUser.name.split(' ')[0]+'!');
    }
  });
}

function submitListing() {
  var area = document.getElementById('a-area').value;
  var price = document.getElementById('a-price').value;
  if(!area || !price) { toast('Заполните площадь и цену'); return; }
  
  var newL = {
    id: Date.now(), type:'apartment', rooms:2, area: parseInt(area),
    district: document.getElementById('a-dist').value || 'Есиль', city:'Астана', price: parseInt(price),
    exchange:false, hasVideo:true, videoId:'ScMzIvxBSi4',
    realtor: curUser.name, realtorFull: curUser.name, realtorId: curUser.id,
    rating:5.0, deals:0, agency: curUser.agency, tags:['Новое'], badge:'Новое',
    desc:'Новый уютный объект', photos:['🛋️']
  };
  listings.unshift(newL);
  renderListings();
  document.getElementById('m-add').classList.remove('on');
  toast('✨ Объект опубликован! Первые риэлторы уже видят его');
}

function setTheme() {
  var html = document.documentElement;
  var current = html.getAttribute('data-theme');
  var next = current === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  localStorage.setItem('fp_theme', next);
}
