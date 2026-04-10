// src/index.tsx
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()
app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './' }))

// Favicon
app.get('/favicon.ico', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  return c.body(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="8" fill="#C97B5A"/>
    <path d="M6 16L16 8l10 8v9H6z" fill="none" stroke="white" stroke-width="1.5"/>
    <path d="M9 21v-5h6v5" fill="white"/>
  </svg>`)
})

// ─── API ROUTES (mock data for demo) ───────────────────────────────────────
app.get('/api/listings', (c) => c.json({ listings: getMockListings() }))
app.get('/api/realtors', (c) => c.json({ realtors: getMockRealtors() }))
app.get('/api/calendar', (c) => c.json({ events: getMockCalendar() }))

app.post('/api/ai/describe', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  return c.json({ description: generateAIDesc(b) })
})

app.post('/api/auth/login', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  const demo = (b.email || '').includes('test') || (b.email || '').includes('demo')
  return c.json({ 
    success: true, 
    user: { 
      id: 'u1', 
      name: demo ? 'Айгерим К.' : 'Риэлтор', 
      email: b.email, 
      verified: true, 
      deals: 47, 
      rating: 4.9, 
      agency: 'Century 21', 
      reviews: 23 
    } 
  })
})

// ─── HELPERS ──────────────────────────────────────────────────
function generateAIDesc(o: any): string {
  const types: Record<string,string> = { apartment:'квартира', house:'дом', commercial:'помещение', land:'участок' }
  const t = types[o.type] || 'объект'
  const ex = o.exchange ? '\n🔄 Обмен — экономия 10–15% на налогах!' : ''
  const p = o.price ? (Number(o.price)/1e6).toFixed(1)+' млн ₸' : 'по договору'
  return `✨ ${o.rooms ? o.rooms+'-комнатная ' : ''}${t}${o.area ? ', '+o.area+' м²' : ''} в ${o.district||'Астане'}!\n\n🏆 Развитая инфраструктура · Рядом транспорт\n💰 Цена: ${p}${ex}\n\n📍 ${o.district||'Есиль'}, ${o.city||'Астана'}\n📞 Звоните — покажу в удобное время!`
}

function getMockRealtors() {
  return [
    { id:'r1', name:'Айгерим К.', agency:'Century 21', rating:4.9, deals:47, reviews:23, phone:'+7 701 234 56 78', photo:'А', color:'#C97B5A', specialization:'Квартиры', experience:5, badge:'ТОП', verified:true },
    { id:'r2', name:'Данияр М.', agency:'Etagi', rating:4.7, deals:32, reviews:18, phone:'+7 702 345 67 89', photo:'Д', color:'#8A9A8B', specialization:'Дома', experience:7, verified:true },
  ]
}

function getMockListings() {
  return [
    { id:1, type:'apartment', rooms:3, area:85, district:'Есиль', city:'Астана', price:62000000, exchange:false, hasVideo:true, videoId:'tgbNymZ7vqY', realtor:'Айгерим К.', realtorId:'r1', realtorFull:'Айгерим К.', rating:4.9, deals:47, agency:'Century 21', tags:['Новое'], badge:'Новое', desc:'Просторная 3-комнатная с панорамным видом. Свежий ремонт, подземный паркинг.', photos:['🛋️','🚿','🌇'] },
    { id:2, type:'apartment', rooms:2, area:65, district:'Сарыарка', city:'Астана', price:38000000, exchange:true, hasVideo:false, videoId:'', realtor:'Данияр М.', realtorId:'r2', realtorFull:'Данияр М.', rating:4.7, deals:32, agency:'Etagi', tags:['Обмен'], badge:'Обмен', desc:'Уютная 2-комнатная в тихом дворе. Рядом школа, сад, магазины. Рассмотрим обмен!', photos:['🛋️','🚿'] },
  ]
}

function getMockCalendar() {
  const t = new Date()
  const dt = (d:number,h:number,m:number) => new Date(t.getFullYear(),t.getMonth(),t.getDate()+d,h,m).toISOString()
  return [
    { id:1, title:'Показ 3к Есиль', time:dt(0,10,0), type:'showing', client:'Алия С.', note:'Взять ключи', color:'#C97B5A' },
  ]
}

// ─── MAIN HTML (тёплый, с анимацией звезды-дуги) ───────────────────────────
app.get('/', (c) => c.html(getHTML()))

function getHTML(): string {
return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#FFF9F5">
<title>Flapy — Уютный поиск жилья</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet">
<style>
:root{
  --bg:#FFF9F5; --bg2:#FFFFFF; --bg3:#F7F1EA;
  --accent:#C97B5A; --accent-soft:#D4A76A; --trust:#6B8E23;
  --text:#3A3226; --text-muted:#7A6B5D;
  --glass:rgba(255,255,255,0.72); --glass-b:rgba(255,255,255,0.6);
  --shadow:0 8px 32px rgba(138,154,139,0.12);
  --r:16px; --nav-h:64px; --bot-h:72px;
}
*,*::before,*::after{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;margin:0;background:linear-gradient(135deg,#FFF9F5,#F7F1EA,#FFF3E6);font-family:'Inter',system-ui,sans-serif;color:var(--text);overflow:hidden}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(circle at 20% 30%,rgba(201,123,90,0.08),transparent 40%),radial-gradient(circle at 80% 70%,rgba(212,167,106,0.08),transparent 40%);animation:breathe 15s ease-in-out infinite alternate;pointer-events:none;z-index:-1}
@keyframes breathe{0%{transform:scale(1)}100%{transform:scale(1.05)}}

/* ✨ Disney-style star arch animation */
#welcome{position:fixed;inset:0;z-index:9999;background:linear-gradient(160deg,#2A231F,#1A1614);display:flex;flex-direction:column;align-items:center;justify-content:center;transition:opacity 0.6s cubic-bezier(0.4,0,0.2,1)}
#welcome.fade{opacity:0;pointer-events:none}
.star-arch{position:relative;width:200px;height:120px;margin-bottom:12px}
.star-path{position:absolute;inset:0}
.star{position:absolute;top:0;left:50%;transform:translateX(-50%);width:28px;height:28px;fill:var(--accent-soft);opacity:0;animation:archStar 2.8s cubic-bezier(0.2,0.8,0.2,1) forwards}
@keyframes archStar{
  0%{opacity:0;top:0;left:50%;transform:translateX(-50%) scale(0.6)}
  25%{opacity:1;top:20px;left:30%;transform:translateX(-50%) scale(1)}
  50%{opacity:1;top:0;left:50%;transform:translateX(-50%) scale(1.1)}
  75%{opacity:1;top:20px;left:70%;transform:translateX(-50%) scale(1)}
  100%{opacity:0;top:40px;left:50%;transform:translateX(-50%) scale(0.8)}
}
.w-text{font-size:clamp(18px,5vw,24px);font-weight:700;color:var(--accent-soft);opacity:0;animation:fadeUp 2.8s 0.4s cubic-bezier(0.2,0.8,0.2,1) forwards}
@keyframes fadeUp{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}

/* App layout */
#app{position:fixed;inset:0;display:flex;flex-direction:column;max-width:100%}
@media(min-width:768px){#app{max-width:680px;margin:0 auto;border-left:1px solid var(--glass-b);border-right:1px solid var(--glass-b);background:rgba(255,255,255,0.4);backdrop-filter:blur(8px)}}

/* Header */
header{position:sticky;top:0;z-index:50;background:var(--glass);backdrop-filter:blur(14px);border-bottom:1px solid var(--glass-b);padding:12px 16px;display:flex;align-items:center;justify-content:space-between}
.logo{display:flex;align-items:center;gap:10px}
.logo i{width:34px;height:34px;background:var(--accent);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px}
.logo h1{font-size:18px;font-weight:800;letter-spacing:-0.5px;margin:0}
.auth-btn{padding:8px 14px;background:var(--glass);border:1px solid var(--glass-b);border-radius:10px;font-size:12px;font-weight:700;color:var(--accent);cursor:pointer}
.auth-btn:active{transform:scale(0.96);background:var(--accent-soft);color:#fff}

/* Main content */
main{flex:1;overflow-y:auto;padding:12px 16px 24px}
.grid{display:grid;gap:16px}
@media(min-width:640px){.grid{grid-template-columns:repeat(2,1fr)}}

/* Cards */
.card{background:var(--bg2);border-radius:var(--r);box-shadow:0 4px 16px rgba(138,154,139,0.08);border:1px solid var(--glass-b);overflow:hidden;cursor:pointer;transition:transform 0.2s,box-shadow 0.2s}
.card:active{transform:scale(0.985)}
.card-media{height:160px;position:relative;background:var(--bg3);display:flex;align-items:center;justify-content:center}
.card-media img{width:100%;height:100%;object-fit:cover}
.badge{position:absolute;top:10px;right:10px;padding:4px 9px;border-radius:8px;font-size:11px;font-weight:700;color:#fff;background:var(--accent)}
.badge.exchange{background:var(--trust)}
.card-body{padding:12px 14px}
.price{font-size:18px;font-weight:800;color:var(--text);margin-bottom:4px}
.meta{font-size:13px;color:var(--text-muted);margin-bottom:10px}
.agent{display:flex;align-items:center;gap:8px;padding-top:10px;border-top:1px solid var(--bg3)}
.agent-ava{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--accent-soft),var(--accent));display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff}
.agent-name{font-size:12px;font-weight:600;color:var(--text-muted);flex:1}
.actions{display:flex;gap:8px;margin-top:10px}
.btn{flex:1;padding:10px;border-radius:10px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;border:none}
.btn:active{transform:scale(0.96)}
.btn-primary{background:var(--accent);color:#fff}
.btn-glass{background:var(--bg3);color:var(--text);border:1px solid var(--glass-b)}

/* Bottom nav */
nav{position:sticky;bottom:0;z-index:50;background:var(--glass);backdrop-filter:blur(16px);border-top:1px solid var(--glass-b);display:flex;align-items:center;justify-content:space-around;padding:8px 12px calc(8px + env(safe-area-inset-bottom,0))}
.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px 4px;color:var(--text-muted);cursor:pointer}
.nav-item i{font-size:20px}
.nav-item span{font-size:10px;font-weight:700}
.nav-item.active{color:var(--accent)}
.nav-add{padding:12px 18px;border-radius:14px;background:var(--glass);backdrop-filter:blur(8px);border:1px solid var(--glass-b);display:flex;align-items:center;gap:6px;color:var(--accent);font-weight:700;font-size:13px;cursor:pointer}
.nav-add:active{transform:scale(0.96);background:var(--accent-soft);color:#fff}

/* Toast */
#toast{position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(8px);background:rgba(58,50,38,0.9);color:#fff;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;opacity:0;transition:all 0.25s;z-index:1000}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
</style>
</head>
<body>

<!-- ✨ Disney-style welcome animation -->
<div id="welcome">
  <div class="star-arch">
    <svg class="star-path" viewBox="0 0 200 120" style="opacity:0.3">
      <path d="M20,60 Q60,10 100,20 Q140,30 180,60" fill="none" stroke="rgba(212,167,106,0.4)" stroke-width="2" stroke-dasharray="4 4"/>
    </svg>
    <svg class="star" viewBox="0 0 24 24"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.8 5.6 21.2 8 14 2 9.2h7.6z"/></svg>
  </div>
  <div class="w-text">Добро пожаловать домой</div>
</div>

<div id="app">
  <header>
    <div class="logo"><i class="fas fa-home"></i><h1>Flapy</h1></div>
    <button class="auth-btn" onclick="showToast('🔐 Авторизация скоро')"><i class="fas fa-user-circle"></i> Войти</button>
  </header>

  <main>
    <div class="grid" id="listingsGrid"></div>
    <div style="background:var(--glass);border:1px solid var(--glass-b);border-radius:var(--r);padding:16px;margin-top:16px;text-align:center">
      <p style="font-size:13px;color:var(--text-muted);margin:0;line-height:1.6">
        🤲 <b>Безопасность и забота</b><br>
        Каждый объект проверен. Ваши данные защищены. Мы рядом на каждом шаге.
      </p>
    </div>
  </main>

  <nav>
    <div class="nav-item active"><i class="fas fa-search"></i><span>Поиск</span></div>
    <div class="nav-item"><i class="fas fa-comments"></i><span>Aira</span></div>
    <div class="nav-add" onclick="showToast('📝 Добавление доступно после входа')"><i class="fas fa-pen-to-square"></i> Добавить</div>
    <div class="nav-item"><i class="fas fa-user"></i><span>Профиль</span></div>
    <div class="nav-item"><i class="fas fa-ellipsis-h"></i><span>Ещё</span></div>
  </nav>
</div>

<div id="toast"></div>

<script>
// Format prices with spaces: 62 000 000 ₸
const fmt = n => new Intl.NumberFormat('ru-RU').format(n) + ' ₸';

// Mock listings
const listings = [
  { id:1, price:62000000, rooms:3, area:85, district:'Есиль', badge:'Новое', hasVideo:true, videoId:'tgbNymZ7vqY', agent:'Айгерим К.', agency:'Century 21' },
  { id:2, price:38500000, rooms:2, area:65, district:'Сарыарка', badge:'Обмен', exchange:true, agent:'Данияр М.', agency:'Etagi' },
];

// Render cards
function render() {
  const grid = document.getElementById('listingsGrid');
  grid.innerHTML = listings.map(l => \`
    <article class="card" onclick="showToast('📞 Звоним риэлтору...')">
      <div class="card-media">
        \${l.hasVideo ? '<img src="https://img.youtube.com/vi/'+l.videoId+'/mqdefault.jpg">' : '<div style="font-size:48px;opacity:0.2">🏠</div>'}
        \${l.badge ? '<div class="badge \${l.exchange?'exchange':''}">'+l.badge+'</div>' : ''}
      </div>
      <div class="card-body">
        <div class="price">\${fmt(l.price)}</div>
        <div class="meta">\${l.rooms}к · \${l.area} м² · \${l.district}\${l.exchange?' · 🔄 Обмен':''}</div>
        <div class="agent">
          <div class="agent-ava">\${l.agent.charAt(0)}</div>
          <div class="agent-name">\${l.agent} · \${l.agency}</div>
        </div>
        <div class="actions">
          <button class="btn btn-primary"><i class="fas fa-phone"></i> Позвонить</button>
          <button class="btn btn-glass"><i class="fas fa-comment"></i> Написать</button>
        </div>
      </div>
    </article>
  \`).join('');
}

// Toast notifications
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => { t.classList.remove('show'); }, 2500);
}

// Welcome animation cleanup
window.addEventListener('load', () => {
  if (!localStorage.getItem('flapy_welcomed')) {
    setTimeout(() => document.getElementById('welcome').classList.add('fade'), 3000);
    localStorage.setItem('flapy_welcomed', '1');
  } else {
    document.getElementById('welcome').style.display = 'none';
  }
  render();
});
</script>
</body>
</html>\``
}

export default app
