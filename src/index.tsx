import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()
app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './' }))

app.get('/favicon.ico', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  return c.body('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1E2D5A"/><text y="22" x="5" font-size="18">🏠</text></svg>')
})

/* ─── API ──────────────────────────────────── */
app.get('/api/listings', (c) => c.json({ listings: getMockListings() }))
app.post('/api/ai/describe', async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  return c.json({ description: generateAIDesc(body) })
})
app.post('/api/auth/register', async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  return c.json({ success: true, user: { id: 'u_' + Date.now(), ...body, verified: true, rating: 5.0, deals: 0 } })
})
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  return c.json({ success: true, user: { id: 'u1', name: 'Айгерим Касымова', email: (body as any).email, verified: true, deals: 47, rating: 4.9, agency: 'Century 21' } })
})
app.get('/api/calendar', (c) => c.json({ events: getMockCalendar() }))
app.post('/api/chat/flai', async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  return c.json({ reply: getFlaiReply((body as any).message || '') })
})

/* ─── Helpers ──────────────────────────────── */
function generateAIDesc(o: any): string {
  const em: Record<string,string> = { apartment:'🏢', house:'🏡', commercial:'🏪', land:'🌳' }
  const e = em[o.type] || '🏠'
  const t = o.type === 'apartment' ? 'квартира' : o.type === 'house' ? 'дом' : o.type === 'commercial' ? 'коммерческое помещение' : 'участок'
  const ex = o.exchange ? '\n🔄 Рассмотрим обмен!' : ''
  const p = o.price ? (Number(o.price)/1e6).toFixed(1) + ' млн ₸' : 'по договору'
  return e + ' ' + (o.rooms ? o.rooms+'-комнатная ' : '') + t + (o.area ? ', '+o.area+' м²' : '') + ' в ' + (o.district||'Астане') + '!\n\n✨ Отличное состояние, развитая инфраструктура рядом.\n💰 Цена: ' + p + ex + '\n\n📞 Звоните — покажу в любое время!'
}

function getMockListings() {
  return [
    { id:1, type:'apartment', rooms:3, area:85,  district:'Бостандыкский', city:'Алматы', price:78500000,  exchange:false, hasVideo:true,  realtor:'Айгерим К.', realtorFull:'Айгерим Касымова', rating:4.9, deals:47, agency:'Century 21', tags:['Новострой'], badge:'Новое',   desc:'Просторная 3-комнатная с панорамным видом. Свежий ремонт, подземный паркинг.' },
    { id:2, type:'apartment', rooms:3, area:82,  district:'Есильский',     city:'Астана', price:62000000,  exchange:false, hasVideo:true,  realtor:'Данияр М.',   realtorFull:'Данияр Мусин',      rating:4.7, deals:32, agency:'Etagi',      tags:['Горящее'],  badge:'Горящее', desc:'Отличная 3-комнатная в новом ЖК. Полная отделка, вид на парк.' },
    { id:3, type:'house',     rooms:5, area:220, district:'Алматинский',   city:'Астана', price:150000000, exchange:true,  hasVideo:true,  realtor:'Сауле Т.',    realtorFull:'Сауле Тлеубекова',  rating:5.0, deals:68, agency:'Royal Group',tags:['Обмен'],    badge:'Обмен',   desc:'Дом с участком 10 соток. Гараж на 2 машины, баня. Рассмотрим обмен!' },
    { id:4, type:'commercial',rooms:0, area:120, district:'Байконыр',      city:'Астана', price:65000000,  exchange:false, hasVideo:false, realtor:'Нурлан А.',   realtorFull:'Нурлан Ахметов',    rating:4.6, deals:23, agency:'Самозанятый',tags:['Инвест'],   badge:'Топ',     desc:'Помещение первой линии, высокий трафик. Идеально для ресторана.' },
    { id:5, type:'apartment', rooms:2, area:65,  district:'Сарыарка',      city:'Астана', price:38000000,  exchange:true,  hasVideo:false, realtor:'Айгерим К.',  realtorFull:'Айгерим Касымова',  rating:4.9, deals:47, agency:'Century 21', tags:['Обмен'],    badge:'Обмен',   desc:'Уютная 2-комнатная в тихом дворе. Рядом школа и детский сад.' },
    { id:6, type:'apartment', rooms:1, area:42,  district:'Есиль',         city:'Астана', price:29000000,  exchange:false, hasVideo:true,  realtor:'Данияр М.',   realtorFull:'Данияр Мусин',      rating:4.7, deals:32, agency:'Etagi',      tags:['Студия'],   badge:'Новое',   desc:'Стильная студия со смарт-дизайном. Встроенная кухня, вид на город.' },
  ]
}

function getMockCalendar() {
  const t = new Date()
  const dt = (d:number,h:number,m:number) => new Date(t.getFullYear(),t.getMonth(),t.getDate()+d,h,m).toISOString()
  return [
    { id:1, title:'Показ квартиры',     time:dt(0,10,0),  type:'showing', client:'Алия С.',       note:'Взять ключи' },
    { id:2, title:'Звонок клиенту',     time:dt(0,14,30), type:'call',    client:'Данияр М.',      note:'Обсудить условия' },
    { id:3, title:'Подписание договора',time:dt(1,11,0),  type:'deal',    client:'Нурсулу К.',     note:'Проверить документы' },
    { id:4, title:'Показ коммерции',    time:dt(1,15,0),  type:'showing', client:'Бизнес-клиент',  note:'Взять план помещения' },
  ]
}

function getFlaiReply(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('обмен')) return '🔄 Обмен актуален в 2026! Новые правила: срок освобождения от налога — 2 года (было 1 год). Обмен помогает избежать налога 10–15%. Могу связать вас с риэлтором!'
  if (m.includes('ипотека') || m.includes('кредит')) return '🏦 Работаем с Отбасы Банк, Халык Банк, Jusan Bank. Ставки от 5% годовых. Хотите расчёт ипотеки по конкретному объекту?'
  if (m.includes('цена') || m.includes('стоимость') || m.includes('сколько')) return '💰 Цена зависит от района, площади и состояния. В Есиле от 28 млн ₸ за 1к, в Алматинском от 35 млн ₸. Хотите оценку конкретного объекта?'
  if (m.includes('налог')) return '💡 С 2026 года: срок без налога — 2 года. Ставка 10–15% при продаже раньше. Обмен — выгодная альтернатива для экономии!'
  if (m.includes('показ') || m.includes('посмотреть')) return '📅 Организуем показ в удобное время. Риэлтор работает без выходных. Когда вам удобно — сегодня или завтра?'
  if (m.includes('привет') || m.includes('здравствуй') || m.includes('салем')) return '👋 Привет! Я Flai — ваш AI-помощник по недвижимости. Помогу найти квартиру, узнать цены, оформить ипотеку. Спрашивайте!'
  if (m.includes('описани') || m.includes('описание')) return '✍️ Помогу составить привлекательное описание объекта! Укажите тип, площадь, район и цену — я сгенерирую текст для публикации.'
  if (m.includes('продвижение') || m.includes('реклама')) return '📢 Для продвижения объекта: качественные фото, видео-тур, точное описание с AI, публикация в Aira для коллег. Хотите советы по маркетингу?'
  return '😊 Понял вас! Чем ещё могу помочь? Задайте вопрос про ипотеку, цены, налоги или попросите организовать показ.'
}

/* ─── HTML ─────────────────────────────────── */
app.get('/', (c) => c.html(getHTML()))

function getHTML(): string {
return `<!DOCTYPE html>
<html lang="ru" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#FFFFFF">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<title>Flapy™ — Умный помощник по жилью</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<style>
/* ══════════════════════════════════════════════════════
   FLAPY — KASPI-STYLE LIGHT UI  v3.0
   Palette: White / Light Gray / Navy #1E2D5A / Orange #F47B20
══════════════════════════════════════════════════════ */
:root {
  /* ─ Colors ─ */
  --white:    #FFFFFF;
  --bg:       #F5F5F7;       /* Page background — very light gray */
  --bg2:      #FFFFFF;       /* Card / panel background */
  --bg3:      #F0F0F5;       /* Input / secondary bg */
  --card:     #FFFFFF;
  --navy:     #1E2D5A;       /* Primary brand — navy */
  --navy2:    #2E4A85;
  --orange:   #F47B20;       /* Accent — orange */
  --orange2:  #FF9A3C;
  --green:    #27AE60;
  --red:      #E74C3C;
  --t1:       #1A1A2E;       /* Main text */
  --t2:       #6B7280;       /* Secondary text */
  --t3:       #9CA3AF;       /* Placeholder / hint */
  --brd:      #E5E7EB;       /* Border */
  --brd2:     #D1D5DB;
  --sh:       0 1px 4px rgba(0,0,0,.06), 0 2px 10px rgba(0,0,0,.05);
  --sh2:      0 4px 20px rgba(0,0,0,.1);
  /* ─ Layout ─ */
  --nav-h:    56px;
  --bot-h:    64px;
  --r:        14px;
  --max:      480px;
}

/* Dark theme */
[data-theme=dark] {
  --bg:    #0F0F1A;
  --bg2:   #161626;
  --bg3:   #1E1E35;
  --card:  #1A1A30;
  --t1:    #F0F0FF;
  --t2:    #9090C0;
  --t3:    #5A5A80;
  --brd:   rgba(255,255,255,.1);
  --brd2:  rgba(255,255,255,.15);
  --sh:    0 1px 4px rgba(0,0,0,.25), 0 2px 10px rgba(0,0,0,.2);
}

/* ─ Reset ─ */
*, *::before, *::after { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
html, body {
  height: 100%;
  background: var(--bg);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--t1);
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}
button { border:none; cursor:pointer; font-family:inherit; background:none; color:inherit; }
input, textarea, select { font-family:inherit; outline:none; color:var(--t1); background:none; }
img { display:block; width:100%; }
::-webkit-scrollbar { width:0; height:0; }

/* ─ App shell — centers on desktop ─ */
#app-shell {
  position: fixed; inset: 0;
  display: flex; justify-content: center; align-items: flex-start;
  background: #E8E8F0;
}
[data-theme=dark] #app-shell { background: #08080F; }

#app-wrap {
  position: relative;
  width: 100%;
  max-width: var(--max);
  height: 100%;
  background: var(--bg);
  overflow: hidden;
  box-shadow: 0 0 60px rgba(0,0,0,.12);
}
@media (min-width: 520px) {
  #app-wrap { border-left: 1px solid var(--brd); border-right: 1px solid var(--brd); }
}

/* ─ Loader ─ */
#loader {
  position: absolute; inset: 0; z-index: 999;
  background: var(--bg2);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  transition: opacity .3s;
}
.ld-logo { display:flex; align-items:center; gap:9px; }
.ld-icon {
  width: 48px; height: 48px;
  background: linear-gradient(135deg, var(--navy), var(--navy2));
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; color: #fff;
  box-shadow: 0 4px 16px rgba(30,45,90,.25);
}
.ld-name { font-size: 30px; font-weight: 900; color: var(--navy); letter-spacing: -1px; }
[data-theme=dark] .ld-name { color: #fff; }
.ld-tm { font-size: 10px; color: var(--orange); vertical-align: super; font-weight: 700; }
.ld-tagline { font-size: 13px; color: var(--t3); font-weight: 500; }
.ld-bar-wrap { width: 72px; height: 3px; background: var(--bg3); border-radius: 2px; overflow: hidden; margin-top: 4px; }
.ld-bar { height: 100%; background: linear-gradient(90deg, var(--navy), var(--orange)); border-radius: 2px; animation: ldAnim 1.4s ease forwards; }
@keyframes ldAnim { from{width:0} to{width:100%} }

/* ─ Top bar ─ */
#topbar {
  position: absolute; top: 0; left: 0; right: 0; height: var(--nav-h); z-index: 50;
  background: var(--bg2); border-bottom: 1px solid var(--brd);
  display: flex; align-items: center; padding: 0 14px; gap: 10px;
}
.logo-row { display:flex; align-items:center; gap:8px; flex:1; }
.logo-icon {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, var(--navy), var(--navy2));
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: #fff; flex-shrink: 0;
}
.logo-txt { font-size: 18px; font-weight: 900; color: var(--navy); letter-spacing: -.5px; }
[data-theme=dark] .logo-txt { color: #fff; }
.logo-tag { font-size: 10px; color: var(--orange); vertical-align: super; font-weight: 700; }
.top-right { display:flex; align-items:center; gap:7px; }
.lang-sw { display:flex; align-items:center; gap:0; background:var(--bg3); border-radius:8px; padding:2px; border:1px solid var(--brd); }
.lo { padding:3px 7px; border-radius:6px; font-size:11px; font-weight:700; color:var(--t3); cursor:pointer; transition:all .15s; }
.lo.on { background:var(--navy); color:#fff; }
[data-theme=dark] .lo.on { background:var(--orange); }
.lo-sep { font-size:10px; color:var(--brd2); align-self:center; }
.tb-btn {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: var(--t3);
  background: var(--bg3); border: 1px solid var(--brd);
  cursor: pointer; transition: all .15s;
}
.tb-btn:active { background: var(--navy); color: #fff; border-color: var(--navy); }
[data-theme=dark] .tb-btn:active { background: var(--orange); border-color: var(--orange); }
.login-btn {
  padding: 0 13px; height: 30px; border-radius: 8px;
  background: var(--navy); color: #fff;
  font-size: 12px; font-weight: 700; cursor: pointer;
  transition: opacity .15s; white-space: nowrap;
}
[data-theme=dark] .login-btn { background: var(--orange); }
.login-btn:active { opacity: .8; }
.u-chip { display:flex; align-items:center; gap:6px; cursor:pointer; }
.u-ava {
  width: 28px; height: 28px; border-radius: 50%;
  background: linear-gradient(135deg, var(--navy), var(--navy2));
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; color: #fff;
}
.u-nm { font-size: 12px; font-weight: 700; color: var(--t1); }

/* ─ Main ─ */
#main { position:absolute; top:var(--nav-h); bottom:var(--bot-h); left:0; right:0; overflow:hidden; }
.scr { position:absolute; inset:0; overflow-y:auto; display:none; -webkit-overflow-scrolling:touch; background:var(--bg); }
.scr.on { display:block; }

/* ══════════════════════════════════════════
   OBJECTS SCREEN  (like Kaspi screenshots)
══════════════════════════════════════════ */
#s-search { background: var(--bg); }

.list-header {
  position: sticky; top: 0; z-index: 10;
  background: var(--bg2); border-bottom: 1px solid var(--brd);
}
.lh-top { padding: 10px 14px 0; }
.lh-tagline { font-size: 12px; color: var(--t3); font-weight: 500; margin-bottom: 6px; }
.tab-row {
  display: flex; border-bottom: 1px solid var(--brd);
}
.tab-item {
  flex: 1; padding: 10px 0; text-align: center;
  font-size: 14px; font-weight: 600; color: var(--t3);
  border-bottom: 2.5px solid transparent; cursor: pointer;
  transition: all .15s; margin-bottom: -1px;
}
.tab-item.on { color: var(--navy); border-color: var(--navy); font-weight: 700; }
[data-theme=dark] .tab-item.on { color: var(--orange); border-color: var(--orange); }
.filter-row {
  display: flex; gap: 6px; overflow-x: auto;
  padding: 9px 14px;
}
.filter-row::-webkit-scrollbar { height: 0; }
.fchip {
  flex-shrink: 0; padding: 5px 13px; border-radius: 20px;
  font-size: 12px; font-weight: 600; cursor: pointer;
  border: 1.5px solid var(--brd2); color: var(--t2); background: none;
  transition: all .15s; white-space: nowrap;
}
.fchip.on { background: var(--navy); color: #fff; border-color: var(--navy); }
[data-theme=dark] .fchip.on { background: var(--orange); border-color: var(--orange); }
.list-body { padding: 10px 12px 12px; }

/* Listing card — Kaspi style */
.lcard {
  background: var(--card); border-radius: var(--r);
  box-shadow: var(--sh); margin-bottom: 12px;
  overflow: hidden; cursor: pointer;
  border: 1px solid var(--brd); transition: box-shadow .15s;
}
.lcard:active { box-shadow: var(--sh2); }
.lcard-media {
  position: relative; height: 185px;
  background: linear-gradient(135deg, #EEF0F6, #E0E3EE);
  overflow: hidden; display: flex; align-items: center; justify-content: center;
}
[data-theme=dark] .lcard-media { background: linear-gradient(135deg, #1E1E35, #161626); }
.lcard-em { font-size: 72px; opacity: .25; }
.play-overlay {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 46px; height: 46px; border-radius: 50%;
  background: rgba(255,255,255,.9); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; color: var(--navy);
  box-shadow: 0 2px 10px rgba(0,0,0,.15);
}
.lcard-badge {
  position: absolute; top: 10px; right: 10px;
  padding: 3px 9px; border-radius: 7px;
  font-size: 11px; font-weight: 700; color: #fff;
}
.lcard-body { padding: 11px 13px 13px; }
.lcard-loc {
  font-size: 12px; color: var(--t3);
  display: flex; align-items: center; gap: 4px; margin-bottom: 6px;
}
.lcard-loc i { color: var(--orange); font-size: 11px; }
.lcard-price { font-size: 20px; font-weight: 800; color: var(--t1); letter-spacing: -.3px; margin-bottom: 2px; }
.lcard-sub { font-size: 13px; color: var(--t2); margin-bottom: 9px; }
.lcard-footer { display:flex; align-items:center; gap:8px; padding-top:9px; border-top:1px solid var(--brd); }
.lf-ava {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--navy), var(--navy2));
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; color: #fff;
}
.lf-name { font-size: 11px; font-weight: 600; color: var(--t2); flex: 1; }
.lf-rating { font-size: 11px; color: var(--orange); font-weight: 700; }
.lcard-cta { display:flex; gap:7px; margin-top:9px; }
.cta-btn {
  flex: 1; padding: 9px 6px; border-radius: 10px;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; gap: 5px;
  transition: opacity .15s; cursor: pointer;
}
.cta-btn:active { opacity: .8; }
.cta-call { background: var(--navy); color: #fff; }
[data-theme=dark] .cta-call { background: var(--orange); }
.cta-msg  { background: var(--bg3); color: var(--t1); border: 1px solid var(--brd2); }

/* ══════════════════════════════════════════
   FEED SCREEN  (TikTok style)
══════════════════════════════════════════ */
#s-feed { scroll-snap-type: y mandatory; overflow-y: scroll; background: #111; }
.fcard {
  height: 100%; scroll-snap-align: start; scroll-snap-stop: always;
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
}
.fc-bg {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 280px; opacity: .04; filter: blur(8px); pointer-events: none;
}
.fc-overlay {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(to bottom,
    rgba(0,0,0,.15) 0%,
    transparent 25%,
    rgba(0,0,0,.3) 55%,
    rgba(0,0,0,.82) 100%);
}
/* Side action buttons */
.fc-side {
  position: absolute; right: 10px; bottom: 110px; z-index: 5;
  display: flex; flex-direction: column; align-items: center; gap: 18px;
}
.sab { display:flex; flex-direction:column; align-items:center; gap:2px; }
.sab-btn {
  width: 46px; height: 46px; border-radius: 50%;
  background: rgba(255,255,255,.14);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,.22);
  display: flex; align-items: center; justify-content: center;
  font-size: 19px; color: #fff;
  cursor: pointer; transition: all .15s;
}
.sab-btn:active { transform: scale(1.12); background: var(--orange); border-color: var(--orange); }
.sab-btn.liked { background: var(--red); border-color: var(--red); }
.sab-lbl { font-size: 10px; color: rgba(255,255,255,.8); font-weight: 600; }
/* Video / Exchange badges */
.fc-vbadge {
  position: absolute; top: 64px; right: 8px; z-index: 4;
  background: rgba(0,0,0,.55); backdrop-filter: blur(4px);
  border-radius: 7px; padding: 3px 9px;
  font-size: 10px; font-weight: 700; color: #fff;
  display: flex; align-items: center; gap: 4px;
}
.fc-exbadge {
  position: absolute; top: 64px; left: 0; z-index: 4;
  background: linear-gradient(90deg, var(--green), #2ECC71);
  color: #fff; font-size: 10px; font-weight: 700;
  padding: 4px 12px; border-radius: 0 8px 8px 0;
}
/* Bottom info */
.fc-info {
  position: absolute; bottom: 0; left: 0; right: 62px; z-index: 4;
  padding: 12px 13px 20px;
}
.fc-chips { display:flex; gap:4px; margin-bottom:6px; flex-wrap:wrap; }
.fc-chip {
  padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700;
  background: rgba(255,255,255,.15); color: #fff; border: 1px solid rgba(255,255,255,.25);
}
.fc-chip.exch { background: rgba(39,174,96,.25); color: #6EEC9A; border-color: rgba(39,174,96,.4); }
.fc-loc { font-size: 11px; color: rgba(255,255,255,.65); display:flex; align-items:center; gap:4px; margin-bottom:3px; }
.fc-title { font-size: 20px; font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: 2px; }
.fc-price { font-size: 17px; font-weight: 800; color: var(--orange); margin-bottom: 7px; text-shadow: 0 1px 4px rgba(0,0,0,.3); }
.fc-desc { font-size: 12px; color: rgba(255,255,255,.6); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:9px; }
.fc-realtor {
  display: flex; align-items: center; gap: 8px;
  background: rgba(255,255,255,.1); backdrop-filter: blur(6px);
  border-radius: 10px; padding: 7px 10px;
  border: 1px solid rgba(255,255,255,.15);
}
.fc-r-ava {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--orange), var(--orange2));
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; color: #fff;
}
.fc-r-name { font-size: 11px; font-weight: 700; color: #fff; }
.fc-r-sub  { font-size: 10px; color: rgba(255,255,255,.65); margin-top: 1px; }
.fc-r-btn {
  margin-left: auto; background: rgba(255,255,255,.2); border-radius: 7px;
  padding: 4px 10px; font-size: 11px; font-weight: 700; color: #fff;
  border: 1px solid rgba(255,255,255,.3); cursor: pointer; transition: all .15s;
}
.fc-r-btn:active { background: var(--orange); border-color: var(--orange); }

/* ══════════════════════════════════════════
   CHAT — WhatsApp style
══════════════════════════════════════════ */
.chat-wrap { display:flex; flex-direction:column; height:100%; }
.chat-header {
  flex-shrink: 0;
  background: var(--bg2); border-bottom: 1px solid var(--brd);
  padding: 10px 14px; display: flex; align-items: center; gap: 10px;
}
.ch-ava {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 900; color: #fff;
}
.ch-ava.flai { background: linear-gradient(135deg, var(--navy), var(--navy2)); }
.ch-ava.aira { background: linear-gradient(135deg, var(--orange), var(--orange2)); }
.ch-name { font-size: 15px; font-weight: 700; color: var(--t1); }
.ch-status {
  font-size: 11px; color: var(--green); font-weight: 500;
  display: flex; align-items: center; gap: 4px; margin-top: 1px;
}
.ch-status::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--green); }
/* Quick chips */
.quick-row {
  flex-shrink: 0;
  background: var(--bg2); border-bottom: 1px solid var(--brd);
  display: flex; gap: 6px; overflow-x: auto; padding: 8px 13px;
}
.quick-row::-webkit-scrollbar { height: 0; }
.qchip {
  flex-shrink: 0; padding: 5px 12px; border-radius: 20px;
  font-size: 12px; font-weight: 500; cursor: pointer;
  border: 1px solid var(--brd2); color: var(--t2); background: none;
  transition: all .15s; white-space: nowrap;
}
.qchip:active { background: var(--navy); color: #fff; border-color: var(--navy); }
[data-theme=dark] .qchip:active { background: var(--orange); border-color: var(--orange); }
/* Messages */
.chat-body {
  flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 5px;
  padding: 12px 13px;
}
[data-theme=light] .chat-body { background: #EFE5D5; }
[data-theme=dark]  .chat-body { background: #0A0F1E; }
.msg-date {
  align-self: center; font-size: 11px; color: var(--t3);
  background: rgba(255,255,255,.7); border-radius: 8px;
  padding: 3px 10px; margin: 3px 0;
}
[data-theme=dark] .msg-date { background: rgba(255,255,255,.07); color: var(--t3); }
.msg { display:flex; gap:7px; max-width:85%; }
.msg.me  { align-self:flex-end;   flex-direction:row-reverse; }
.msg.bot { align-self:flex-start; }
.m-ava {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  align-self: flex-end;
  background: linear-gradient(135deg, var(--navy), var(--navy2));
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; color: #fff;
}
.bwrap { display:flex; flex-direction:column; }
.bubble { padding: 8px 12px; border-radius: 14px; font-size: 13.5px; line-height: 1.5; word-break: break-word; }
.msg.bot .bubble {
  background: var(--white); color: var(--t1);
  border-radius: 4px 14px 14px 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
}
[data-theme=dark] .msg.bot .bubble { background: var(--card); }
.msg.me .bubble {
  background: var(--navy); color: #fff;
  border-radius: 14px 4px 14px 14px;
}
[data-theme=dark] .msg.me .bubble { background: var(--orange); }
.m-ts { font-size: 10px; color: var(--t3); margin-top: 2px; padding: 0 2px; }
.msg.me .m-ts { text-align: right; }
/* Typing */
.typing { display:flex; gap:4px; padding:4px 8px; }
.td { width:7px; height:7px; border-radius:50%; background:var(--t3); animation:typA .9s infinite; }
.td:nth-child(2){animation-delay:.2s} .td:nth-child(3){animation-delay:.4s}
@keyframes typA{0%,60%,100%{opacity:.3;transform:scale(.8)}30%{opacity:1;transform:scale(1.1)}}
/* Chat input */
.chat-input-row {
  flex-shrink: 0; display:flex; align-items:flex-end; gap:8px;
  padding: 8px 12px; background: var(--bg2); border-top: 1px solid var(--brd);
}
.ci {
  flex: 1; min-height: 40px; max-height: 88px;
  padding: 10px 14px; border-radius: 22px;
  border: 1.5px solid var(--brd2); background: var(--white);
  font-size: 13px; resize: none; line-height: 1.4;
  transition: border-color .15s; color: var(--t1);
}
[data-theme=dark] .ci { background: var(--bg3); border-color: var(--brd); }
.ci:focus { border-color: var(--navy); }
[data-theme=dark] .ci:focus { border-color: var(--orange); }
.ci::placeholder { color: var(--t3); }
.send-btn {
  width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
  background: var(--navy); color: #fff; font-size: 15px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: transform .15s;
}
[data-theme=dark] .send-btn { background: var(--orange); }
.send-btn.aira { background: linear-gradient(135deg, var(--orange), var(--orange2)); }
.send-btn:active { transform: scale(1.1); }

/* Aira threads */
.aira-list { padding: 10px 13px; display:flex; flex-direction:column; gap:8px; }
.thread {
  background: var(--card); border: 1px solid var(--brd);
  border-radius: var(--r); overflow: hidden; box-shadow: var(--sh);
}
.th-head {
  display: flex; align-items: center; gap: 9px;
  padding: 11px 12px; cursor: pointer;
}
.th-ava {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; color: #fff;
}
.th-name  { font-size: 13px; font-weight: 700; }
.th-time  { font-size: 10px; color: var(--t3); font-weight: 400; margin-left: 4px; }
.th-prev  { font-size: 11px; color: var(--t2); margin-top: 1px; }
.th-body  { padding: 10px 12px; display: none; border-top: 1px solid var(--brd); background: var(--bg); }
.prop-tag {
  display: inline-flex; align-items: center; gap: 4px;
  background: rgba(244,123,32,.1); border: 1px solid rgba(244,123,32,.25);
  border-radius: 8px; padding: 3px 9px;
  font-size: 11px; font-weight: 600; color: var(--orange); margin-bottom: 6px;
}
.role-btns { display:flex; gap:4px; margin-left:auto; }
.rbtn {
  padding: 4px 9px; border-radius: 7px; font-size: 11px; font-weight: 700;
  background: var(--bg3); color: var(--t3);
  border: 1.5px solid var(--brd); cursor: pointer; transition: all .15s;
}
.rbtn.on { background: var(--navy); color: #fff; border-color: var(--navy); }
[data-theme=dark] .rbtn.on { background: var(--orange); border-color: var(--orange); }

/* ══════════════════════════════════════════
   CALENDAR / TIME-MANAGER
══════════════════════════════════════════ */
.cal-wrap  { padding: 13px; }
.cal-title { font-size: 21px; font-weight: 800; margin-bottom: 2px; }
.cal-date  { font-size: 12px; color: var(--t3); margin-bottom: 12px; }
.sec-label {
  font-size: 10px; font-weight: 700; color: var(--t3);
  text-transform: uppercase; letter-spacing: 1px; margin: 14px 0 7px;
}
.ev-card {
  display: flex; align-items: stretch; gap: 9px;
  background: var(--card); border: 1px solid var(--brd);
  border-radius: var(--r); padding: 11px; margin-bottom: 8px;
  cursor: pointer; box-shadow: var(--sh); transition: box-shadow .15s;
}
.ev-card:active { box-shadow: var(--sh2); }
.ev-time {
  min-width: 46px; background: var(--bg3); border-radius: 9px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 5px;
}
.ev-hm { font-size: 14px; font-weight: 800; color: var(--navy); }
[data-theme=dark] .ev-hm { color: var(--orange); }
.ev-line { width: 3px; border-radius: 2px; flex-shrink: 0; }
.ev-inf { flex: 1; }
.ev-ttl  { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.ev-cli  { font-size: 11px; color: var(--t2); margin-bottom: 4px; }
.ev-note { font-size: 11px; color: var(--t3); background: var(--bg3); border-radius: 6px; padding: 3px 8px; display: inline-block; }
.add-ev-btn {
  width: 100%; padding: 12px; border-radius: 12px;
  background: none; border: 2px dashed var(--brd2);
  color: var(--t3); font-size: 13px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  cursor: pointer; margin-bottom: 12px; transition: all .15s;
}
.add-ev-btn:active { border-color: var(--orange); color: var(--orange); }
.ai-tip {
  display: flex; align-items: center; gap: 9px;
  background: rgba(244,123,32,.07); border: 1px solid rgba(244,123,32,.2);
  border-radius: 12px; padding: 10px 12px; margin-bottom: 12px;
  font-size: 12px; line-height: 1.5; color: var(--t2);
}
/* Ranking */
.rank-card {
  display: flex; align-items: center; gap: 10px;
  background: var(--card); border: 1px solid var(--brd);
  border-radius: 12px; padding: 11px; margin-bottom: 7px; box-shadow: var(--sh);
}
.rank-num {
  width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 900;
}
.rank-bar { height: 3px; border-radius: 2px; background: linear-gradient(90deg, var(--orange), var(--orange2)); margin-top: 3px; }

/* ══════════════════════════════════════════
   PROFILE
══════════════════════════════════════════ */
.prof-wrap { padding: 13px; }
.prof-hero {
  background: linear-gradient(135deg, var(--navy), var(--navy2));
  border-radius: 16px; padding: 18px; margin-bottom: 14px; overflow: hidden;
}
.ph-ava {
  width: 52px; height: 52px; border-radius: 50%;
  background: rgba(255,255,255,.2); border: 2px solid rgba(255,255,255,.35);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 900; color: #fff; margin-bottom: 9px;
}
.ph-name { font-size: 17px; font-weight: 800; color: #fff; }
.ph-tag  { font-size: 11px; color: rgba(255,255,255,.6); margin-top: 2px; }
.ph-stats { display:flex; gap:7px; margin-top:12px; }
.ph-stat {
  flex: 1; background: rgba(255,255,255,.12); border-radius: 10px;
  padding: 8px; text-align: center;
}
.ph-val { font-size: 17px; font-weight: 800; color: #fff; }
.ph-lbl { font-size: 9px; color: rgba(255,255,255,.55); margin-top: 1px; }
.menu-sec { margin-bottom: 16px; }
.menu-lbl { font-size: 10px; font-weight: 700; color: var(--t3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 7px; }
.menu-item {
  display: flex; align-items: center; gap: 11px;
  background: var(--card); border: 1px solid var(--brd);
  border-radius: var(--r); padding: 12px; margin-bottom: 7px;
  cursor: pointer; box-shadow: var(--sh); transition: box-shadow .15s;
}
.menu-item:active { box-shadow: var(--sh2); }
.menu-ico { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
.menu-name { font-size: 13px; font-weight: 600; }
.menu-sub  { font-size: 11px; color: var(--t3); margin-top: 1px; }

/* ══════════════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════════════ */
.notif-wrap  { padding: 13px; }
.notif-title { font-size: 20px; font-weight: 800; margin-bottom: 13px; }
.notif-item {
  display: flex; gap: 10px;
  background: var(--card); border: 1px solid var(--brd);
  border-radius: var(--r); padding: 12px; margin-bottom: 8px; box-shadow: var(--sh);
}
.notif-ico   { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
.notif-txt   { font-size: 12px; line-height: 1.55; color: var(--t2); }
.notif-txt b { color: var(--t1); }
.notif-time  { font-size: 10px; color: var(--t3); margin-top: 3px; }
.n-new-dot   { width:7px; height:7px; border-radius:50%; background:var(--orange); display:inline-block; margin-right:4px; }

/* ══════════════════════════════════════════
   BOTTOM NAV  (4 items + center plus)
══════════════════════════════════════════ */
#botbar {
  position: absolute; bottom: 0; left: 0; right: 0; height: var(--bot-h); z-index: 50;
  background: var(--bg2); border-top: 1px solid var(--brd);
  display: flex; align-items: center; padding: 0 8px 6px;
}
.nav-it {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px; cursor: pointer; color: var(--t3); padding: 6px 2px;
  border-radius: 10px; position: relative; transition: color .15s;
}
.nav-it i    { font-size: 20px; transition: transform .15s; }
.nav-svg     { width: 22px; height: 22px; transition: transform .15s; flex-shrink: 0; }
.nav-it span { font-size: 9px; font-weight: 700; }
.nav-it.on { color: var(--navy); }
[data-theme=dark] .nav-it.on { color: var(--orange); }
.nav-it.on i    { transform: scale(1.1); }
.nav-it.on .nav-svg { transform: scale(1.1); }
.nav-plus-wrap { flex-shrink: 0; padding: 0 6px; }
.nav-plus {
  width: 48px; height: 48px; border-radius: 14px;
  background: var(--navy); color: #fff; font-size: 22px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(30,45,90,.3);
  cursor: pointer; transition: transform .15s, box-shadow .15s;
}
[data-theme=dark] .nav-plus { background: var(--orange); box-shadow: 0 4px 16px rgba(244,123,32,.3); }
.nav-plus:active { transform: scale(1.05); }
.n-badge {
  position: absolute; top: 3px; right: calc(50% - 18px);
  width: 15px; height: 15px; border-radius: 8px;
  background: var(--red); color: #fff;
  font-size: 8px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid var(--bg2);
}

/* ══════════════════════════════════════════
   MODALS / BOTTOM SHEETS
══════════════════════════════════════════ */
.overlay {
  position: absolute; inset: 0; z-index: 200;
  background: rgba(0,0,0,.5); backdrop-filter: blur(3px);
  display: flex; align-items: flex-end; justify-content: center;
  opacity: 0; pointer-events: none; transition: opacity .22s;
}
.overlay.on { opacity: 1; pointer-events: all; }
.sheet {
  width: 100%; max-height: 92%; background: var(--bg2);
  border-radius: 20px 20px 0 0; overflow-y: auto;
  padding-bottom: 20px; transform: translateY(16px); transition: transform .22s;
}
.overlay.on .sheet { transform: translateY(0); }
.sh-handle { width: 32px; height: 4px; border-radius: 2px; background: var(--brd2); margin: 10px auto 12px; }
.sh-title { font-size: 17px; font-weight: 800; padding: 0 17px 12px; }
.sh-body  { padding: 0 17px; }
.flabel  { font-size: 11px; font-weight: 600; color: var(--t3); margin-bottom: 4px; display: block; }
.finput  {
  width: 100%; padding: 10px 13px; border-radius: 10px;
  background: var(--bg3); border: 1.5px solid var(--brd);
  font-size: 13px; margin-bottom: 11px; color: var(--t1); transition: border-color .15s;
}
.finput:focus { border-color: var(--navy); }
[data-theme=dark] .finput:focus { border-color: var(--orange); }
select.finput { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239CA3AF'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; background-color: var(--bg3); padding-right: 28px; }
textarea.finput { resize: none; min-height: 68px; line-height: 1.5; }
.form-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.btn-primary {
  width: 100%; padding: 13px; border-radius: 12px;
  background: var(--navy); color: #fff; font-size: 14px; font-weight: 700;
  cursor: pointer; transition: opacity .15s;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
[data-theme=dark] .btn-primary { background: var(--orange); }
.btn-primary:active { opacity: .85; }
.btn-secondary {
  width: 100%; padding: 11px; border-radius: 12px;
  background: var(--bg3); border: 1.5px solid var(--brd);
  font-size: 13px; font-weight: 600; margin-top: 8px; color: var(--t1);
  cursor: pointer;
}
.btn-outline {
  width: 100%; padding: 11px; border-radius: 11px;
  background: none; border: 1.5px solid var(--navy);
  color: var(--navy); font-size: 13px; font-weight: 600; margin-top: 7px;
  cursor: pointer; transition: all .15s;
}
[data-theme=dark] .btn-outline { border-color: var(--orange); color: var(--orange); }
.btn-outline:active { background: var(--navy); color: #fff; }
.tab-switcher { display:flex; background:var(--bg3); border-radius:10px; padding:3px; margin-bottom:14px; }
.tsw { flex:1; padding:7px; border-radius:7px; font-size:13px; font-weight:700; color:var(--t3); cursor:pointer; text-align:center; transition:all .15s; }
.tsw.on { background:var(--navy); color:#fff; }
[data-theme=dark] .tsw.on { background:var(--orange); }
.info-box {
  display: flex; align-items: flex-start; gap: 7px;
  background: rgba(39,174,96,.07); border: 1px solid rgba(39,174,96,.2);
  border-radius: 10px; padding: 9px 11px; margin-bottom: 11px;
  font-size: 12px; line-height: 1.5; color: var(--t2);
}
.info-box.warn { background: rgba(244,123,32,.07); border-color: rgba(244,123,32,.2); }
.ai-label {
  display: inline-flex; align-items: center; gap: 3px;
  background: rgba(244,123,32,.12); border-radius: 5px;
  padding: 1px 7px; font-size: 10px; font-weight: 700; color: var(--orange);
}
.ai-result {
  background: var(--bg3); border: 1.5px solid rgba(244,123,32,.25);
  border-radius: 10px; padding: 11px; margin-top: 6px;
  font-size: 12px; line-height: 1.6; color: var(--t2); white-space: pre-wrap;
}
.ai-actions { display:flex; gap:6px; margin-top:7px; }
.ai-act-btn {
  padding: 5px 11px; border-radius: 8px; font-size: 11px; font-weight: 600;
  background: var(--bg3); border: 1px solid var(--brd); color: var(--t2);
  cursor: pointer; transition: all .15s;
}
.ai-act-btn:active { background: var(--navy); color: #fff; border-color: var(--navy); }
.exch-row {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg3); border-radius: 10px; padding: 10px 12px;
  border: 1.5px solid var(--brd); margin-bottom: 11px; cursor: pointer;
}
/* Detail sheet */
.det-visual {
  height: 160px; display: flex; align-items: center; justify-content: center;
  font-size: 80px; background: linear-gradient(135deg, #EEF0F6, #E0E3EE);
}
[data-theme=dark] .det-visual { background: linear-gradient(135deg, #1E1E35, #161626); }
.det-price { font-size: 23px; font-weight: 900; color: var(--t1); padding: 11px 17px 4px; }
.det-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; padding:4px 17px 12px; }
.det-cell { background: var(--bg3); border-radius: 10px; padding: 11px; text-align: center; }
.det-val  { font-size: 15px; font-weight: 800; color: var(--navy); }
[data-theme=dark] .det-val { color: var(--orange); }
.det-lbl  { font-size: 10px; color: var(--t3); margin-top: 2px; }
.det-desc { padding: 2px 17px 14px; font-size: 13px; line-height: 1.7; color: var(--t2); }
.det-cta  { display:flex; gap:8px; padding:0 17px; }
.det-btn {
  flex: 1; padding: 12px; border-radius: 12px; color: #fff;
  font-size: 13px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: opacity .15s;
}
.det-btn:active { opacity: .85; }
.det-call { background: var(--green); }
.det-chat { background: var(--navy); }
[data-theme=dark] .det-chat { background: var(--orange); }
/* More grid */
.more-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px; padding:0 17px 17px; }
.more-item {
  background: var(--card); border: 1px solid var(--brd);
  border-radius: 14px; padding: 16px; cursor: pointer;
  text-align: center; box-shadow: var(--sh); transition: box-shadow .15s;
}
.more-item:active { box-shadow: var(--sh2); }
.more-ico  { font-size: 28px; margin-bottom: 5px; }
.more-name { font-size: 12px; font-weight: 700; }
.more-sub  { font-size: 10px; color: var(--t3); margin-top: 2px; }
/* Empty state */
.empty { text-align:center; padding:52px 20px; }
.empty-ico { font-size:44px; opacity:.25; margin-bottom:9px; }
.empty-t   { font-size:15px; font-weight:700; margin-bottom:4px; }
.empty-s   { font-size:12px; color:var(--t3); }
/* Toast */
#toast {
  position: absolute; bottom: 78px; left: 50%;
  transform: translateX(-50%) translateY(6px);
  background: rgba(26,26,46,.88); color: #fff;
  border-radius: 10px; padding: 9px 16px;
  font-size: 12px; font-weight: 600; white-space: nowrap;
  z-index: 600; opacity: 0; transition: all .2s; backdrop-filter: blur(5px);
}
[data-theme=light] #toast { background: rgba(30,45,90,.9); }
#toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
/* Animations */
.su { animation: suIn .25s ease; }
@keyframes suIn { from{opacity:0;transform:translateY(7px)} to{opacity:1;transform:translateY(0)} }
</style>
</head>
<body>
<div id="app-shell">
<div id="app-wrap">

<!-- ════ LOADER ════════════════════════════ -->
<div id="loader">
  <div class="ld-logo">
    <div class="ld-icon"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg></div>
    <div class="ld-name">Flapy<span class="ld-tm">™</span></div>
  </div>
  <div class="ld-tagline">Ваш умный помощник на рынке жилья</div>
  <div class="ld-bar-wrap"><div class="ld-bar"></div></div>
</div>

<!-- ════ TOPBAR ════════════════════════════ -->
<div id="topbar">
  <div class="logo-row">
    <div class="logo-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg></div>
    <div class="logo-txt">Flapy<span class="logo-tag">™</span></div>
  </div>
  <div class="top-right">
    <div class="lang-sw">
      <span class="lo on" id="lo-ru" onclick="setLang('ru')">RU</span>
      <span class="lo" id="lo-kz" onclick="setLang('kz')">KZ</span>
    </div>
    <div class="tb-btn" id="btn-theme" onclick="toggleTheme()"><i class="fas fa-moon"></i></div>
    <div id="auth-slot"><button class="login-btn" onclick="openM('m-auth')">Войти</button></div>
  </div>
</div>

<!-- ════ MAIN AREA ═════════════════════════ -->
<div id="main">

  <!-- ── OBJECTS (default screen) ── -->
  <div id="s-search" class="scr on">
    <div class="list-header">
      <div class="lh-top">
        <div class="lh-tagline">Ваш умный помощник на рынке жилья</div>
        <div class="tab-row">
          <div class="tab-item on" id="tab-obj"  onclick="setListTab('obj')">Объекты</div>
          <div class="tab-item"    id="tab-exch" onclick="setListTab('exch')">Обмен</div>
        </div>
      </div>
      <div class="filter-row" id="filter-row">
        <div class="fchip on" onclick="setFilt(this,'all')">Все</div>
        <div class="fchip"    onclick="setFilt(this,'apartment')">Квартиры</div>
        <div class="fchip"    onclick="setFilt(this,'house')">Дома</div>
        <div class="fchip"    onclick="setFilt(this,'commercial')">Коммерция</div>
        <div class="fchip"    onclick="setFilt(this,'video')">🎬 Видео</div>
      </div>
    </div>
    <div class="list-body" id="list-body"></div>
  </div>

  <!-- ── FEED (TikTok) ── -->
  <div id="s-feed" class="scr"></div>

  <!-- ── FLAI CHAT ── -->
  <div id="s-flai" class="scr">
    <div class="chat-wrap">
      <div class="chat-header">
        <div class="ch-ava flai" style="font-size:12px;letter-spacing:-1px">AI</div>
        <div style="flex:1">
          <div class="ch-name">Flai, <span style="font-size:13px;font-weight:600;color:var(--t2)">умный помощник по жилью</span></div>
          <div class="ch-status">Онлайн</div>
        </div>
        <div style="background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:var(--orange);font-weight:600">✨ AI</div>
      </div>
      <div class="quick-row">
        <div class="qchip" onclick="quickMsg('Помоги составить описание объекта')">✍️ Описание</div>
        <div class="qchip" onclick="quickMsg('Как работает ипотека?')">🏦 Ипотека</div>
        <div class="qchip" onclick="quickMsg('Расскажи про продвижение объекта')">📢 Продвижение</div>
        <div class="qchip" onclick="quickMsg('Налоги при продаже в 2026?')">💡 Налоги</div>
        <div class="qchip" onclick="quickMsg('Хочу организовать показ квартиры')">📅 Показ</div>
        <div class="qchip" onclick="quickMsg('Оцени рыночную стоимость')">💰 Оценка</div>
      </div>
      <div class="chat-body" id="flai-msgs">
        <div class="msg-date">Сегодня</div>
        <div class="msg bot su">
          <div class="m-ava">F</div>
          <div class="bwrap">
            <div class="bubble">Привет! Я Flai 👋<br>Помогу найти жильё, рассчитать ипотеку и ответить на вопросы о рынке Астаны.</div>
            <div class="m-ts">сейчас</div>
          </div>
        </div>
        <div class="msg bot su">
          <div class="m-ava">F</div>
          <div class="bwrap">
            <div class="bubble">💡 <b>Новость 2026:</b> срок без налога при продаже — теперь <b>2 года</b>. Обмен поможет сэкономить 10–15%!</div>
            <div class="m-ts">сейчас</div>
          </div>
        </div>
      </div>
      <div class="chat-input-row">
        <textarea class="ci" id="flai-inp" rows="1" placeholder="Напишите вопрос о недвижимости..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendFlai()}"></textarea>
        <button class="send-btn" onclick="sendFlai()"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  </div>

  <!-- ── AIRA CHAT ── -->
  <div id="s-aira" class="scr">
    <div class="chat-wrap">
      <div class="chat-header">
        <div class="ch-ava aira" style="font-size:13px;font-weight:900">A</div>
        <div style="flex:1">
          <div class="ch-name">Aira <span style="font-size:12px;font-weight:500;color:var(--t2)">— Чат риэлторов</span></div>
          <div class="ch-status" style="color:var(--orange)">47 риэлторов онлайн</div>
        </div>
        <div id="aira-status-badge" style="background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:#27AE60;font-weight:600">✓ Вы вошли</div>
      </div>
      <div class="chat-body" id="aira-msgs" style="padding:10px 0">
        <div class="msg-date" style="margin-bottom:8px">Только для верифицированных риэлторов</div>
        <div class="aira-list">
          <div class="thread su">
            <div class="th-head" onclick="toggleThread(this)">
              <div class="th-ava" style="background:linear-gradient(135deg,var(--navy),#4A6FA5)">А</div>
              <div style="flex:1">
                <div class="th-name">Айгерим К. <span class="th-time">10 мин</span></div>
                <div class="th-prev">3к Есиль — ищу покупателя 🤝</div>
              </div>
              <i class="fas fa-chevron-down" style="color:var(--t3);font-size:11px;transition:transform .2s"></i>
            </div>
            <div class="th-body">
              <div class="prop-tag"><i class="fas fa-home"></i> 3к · 85м² · 85 млн · Есиль</div>
              <p style="font-size:12px;color:var(--t2);margin-bottom:8px">Клиент готов к ипотеке. Комиссию делим 50/50 🤝</p>
              <div style="font-size:12px;color:var(--green)">✓ Данияр М.: Есть покупатель!</div>
            </div>
          </div>
          <div class="thread su">
            <div class="th-head" onclick="toggleThread(this)">
              <div class="th-ava" style="background:linear-gradient(135deg,var(--orange),var(--orange2))">Н</div>
              <div style="flex:1">
                <div class="th-name">Нурлан А. <span class="th-time">25 мин</span></div>
                <div class="th-prev">🔄 Обмен 2к на 3к с доплатой</div>
              </div>
              <span style="background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.25);border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;color:var(--orange)">Обмен</span>
            </div>
            <div class="th-body">
              <div class="prop-tag"><i class="fas fa-home"></i> 2к · 65м² · 38 млн · Сарыарка</div>
              <p style="font-size:12px;color:var(--t2)">Клиент готов доплатить до 20 млн. Без налога!</p>
            </div>
          </div>
          <div class="thread su">
            <div class="th-head" onclick="toggleThread(this)">
              <div class="th-ava" style="background:linear-gradient(135deg,var(--green),#2ECC71)">С</div>
              <div style="flex:1">
                <div class="th-name">Сауле Т. <span class="th-time">1 час</span></div>
                <div class="th-prev">🏪 Коммерция — 3 звонка за день!</div>
              </div>
              <i class="fas fa-chevron-down" style="color:var(--t3);font-size:11px;transition:transform .2s"></i>
            </div>
            <div class="th-body">
              <div class="prop-tag"><i class="fas fa-store"></i> 120м² · 65 млн · Байконыр</div>
              <p style="font-size:12px;color:var(--t2)">Видео-тур работает! Выкладываю полный обзор 🎬</p>
            </div>
          </div>
        </div>
      </div>
      <div class="chat-input-row">
        <textarea class="ci" id="aira-inp" rows="1" placeholder="Поделитесь объектом с коллегами..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendAira()}"></textarea>
        <button class="send-btn aira" onclick="sendAira()"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  </div>

  <!-- ── CALENDAR ── -->
  <div id="s-cal" class="scr"><div class="cal-wrap" id="cal-body"></div></div>

  <!-- ── PROFILE ── -->
  <div id="s-prof" class="scr"><div class="prof-wrap" id="prof-body"></div></div>

  <!-- ── NOTIFICATIONS ── -->
  <div id="s-notif" class="scr">
    <div class="notif-wrap">
      <div class="notif-title">Уведомления</div>
      <div class="notif-item su"><span class="notif-ico">🤖</span><div><div class="notif-txt"><b>Flai:</b> Показ через 30 мин! Не забудьте ключи 🔑</div><div style="display:flex;align-items:center;gap:4px;margin:3px 0"><span class="n-new-dot"></span></div><div class="notif-time">только что</div></div></div>
      <div class="notif-item su"><span class="notif-ico">💬</span><div><div class="notif-txt"><b>Aira:</b> Данияр М. ответил — есть покупатель!</div><div style="display:flex;align-items:center;gap:4px;margin:3px 0"><span class="n-new-dot"></span></div><div class="notif-time">10 мин назад</div></div></div>
      <div class="notif-item su"><span class="notif-ico">❤️</span><div><div class="notif-txt">3 человека добавили объект в избранное</div><div class="notif-time">сегодня</div></div></div>
      <div class="notif-item su"><span class="notif-ico">✍️</span><div><div class="notif-txt"><b>Flai:</b> Завтра подписание с Нурсулу К. в 11:00</div><div class="notif-time">вчера</div></div></div>
      <div class="notif-item su" style="border-color:rgba(244,123,32,.25)"><span class="notif-ico">💡</span><div><div class="notif-txt" style="color:var(--orange)">Клиент держит квартиру менее 2 лет — предложите обмен для экономии налога!</div><div class="notif-time">совет дня</div></div></div>
    </div>
  </div>

</div><!-- /main -->

<!-- ════ BOTTOM NAV ═════════════════════════ -->
<div id="botbar">
  <div class="nav-it on" id="n-search" onclick="go('s-search');nav(this)">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
    <span>Объекты</span>
  </div>
  <div class="nav-it" id="n-feed" onclick="go('s-feed');nav(this)">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="9" height="9" rx="2"/><rect x="13" y="2" width="9" height="9" rx="2"/><rect x="2" y="13" width="9" height="9" rx="2"/><rect x="13" y="13" width="9" height="9" rx="2"/></svg>
    <span>Лента</span>
  </div>
  <div class="nav-plus-wrap">
    <div class="nav-plus" onclick="openAddListing()">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </div>
  </div>
  <div class="nav-it" id="n-flai" onclick="go('s-flai');nav(this)" style="position:relative">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M9 9.5c.5-1.5 2-2.5 3.5-2 1.2.4 2 1.5 1.8 2.8-.2 1.3-1.8 2-2.3 2.7v.5"/><circle cx="12" cy="16.5" r=".75" fill="currentColor" stroke="none"/></svg>
    <span>Flai AI</span>
    <span class="n-badge">2</span>
  </div>
  <div class="nav-it" id="n-more" onclick="showMore()">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>
    <span>Ещё</span>
  </div>
</div>

<!-- ════ MODALS ═════════════════════════════ -->

<!-- AUTH -->
<div class="overlay" id="m-auth" onclick="closeOvl(event,'m-auth')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div style="padding:0 17px 17px">
      <div class="tab-switcher">
        <div class="tsw on" id="at-in" onclick="authTab('in')">Войти</div>
        <div class="tsw"    id="at-up" onclick="authTab('up')">Регистрация</div>
      </div>
      <div id="af-in">
        <div class="info-box warn"><span>💡</span><span>Тест: <b>test@realtor.kz</b> / <b>demo123</b></span></div>
        <label class="flabel">Email</label>
        <input class="finput" type="email" id="l-email" placeholder="you@mail.com" autocomplete="email">
        <label class="flabel">Пароль</label>
        <input class="finput" type="password" id="l-pass" placeholder="••••••••" autocomplete="current-password">
        <button class="btn-primary" onclick="doLogin()"><i class="fas fa-sign-in-alt"></i> Войти</button>
        <button class="btn-secondary" onclick="authTab('up')">Нет аккаунта? Зарегистрироваться</button>
      </div>
      <div id="af-up" style="display:none">
        <div class="info-box"><span>🏠</span><span>Только для риэлторов — статус специалиста присваивается сразу</span></div>
        <label class="flabel">Имя и фамилия</label>
        <input class="finput" type="text" id="r-name" placeholder="Айгерим Касымова">
        <label class="flabel">Email</label>
        <input class="finput" type="email" id="r-email" placeholder="you@mail.com">
        <label class="flabel">Телефон</label>
        <input class="finput" type="tel" id="r-phone" placeholder="+7 777 000 00 00">
        <label class="flabel">Агентство</label>
        <select class="finput" id="r-agency">
          <option value="">Выбрать агентство...</option>
          <option>Самозанятый риэлтор</option><option>Century 21</option>
          <option>Etagi</option><option>Royal Group</option><option>Другое</option>
        </select>
        <label class="flabel">Пароль</label>
        <input class="finput" type="password" id="r-pass" placeholder="Минимум 8 символов" autocomplete="new-password">
        <button class="btn-primary" onclick="doReg()"><i class="fas fa-user-plus"></i> Зарегистрироваться</button>
        <button class="btn-secondary" onclick="authTab('in')">Уже есть аккаунт</button>
      </div>
    </div>
  </div>
</div>

<!-- ADD LISTING -->
<div class="overlay" id="m-add" onclick="closeOvl(event,'m-add')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div class="sh-title">Добавить объект <span class="ai-label"><i class="fas fa-robot"></i> AI</span></div>
    <div class="sh-body">
      <label class="flabel">Тип объекта</label>
      <select class="finput" id="a-type">
        <option value="apartment">🏢 Квартира</option>
        <option value="house">🏡 Дом / Коттедж</option>
        <option value="commercial">🏪 Коммерция</option>
        <option value="land">🌳 Участок</option>
      </select>
      <div class="form-row2">
        <div><label class="flabel">Комнаты</label><select class="finput" id="a-rooms"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5+</option></select></div>
        <div><label class="flabel">Площадь м²</label><input class="finput" type="number" id="a-area" placeholder="85"></div>
      </div>
      <label class="flabel">Район</label>
      <select class="finput" id="a-district">
        <option>Есиль</option><option>Алматинский</option><option>Сарыарка</option><option>Байконыр</option><option>Нура</option>
      </select>
      <label class="flabel">Цена ₸</label>
      <input class="finput" type="number" id="a-price" placeholder="85000000">
      <div class="exch-row" onclick="document.getElementById('a-exch').click()">
        <input type="checkbox" id="a-exch" style="width:17px;height:17px;accent-color:var(--orange)">
        <label for="a-exch" style="font-size:13px;font-weight:600;cursor:pointer;color:var(--t1);flex:1">🔄 Рассмотрим обмен <span style="font-size:10px;background:rgba(244,123,32,.12);border-radius:4px;padding:1px 6px;color:var(--orange);font-weight:700">2026</span></label>
      </div>
      <label class="flabel">Описание <span class="ai-label"><i class="fas fa-magic"></i> AI</span></label>
      <textarea class="finput" id="a-desc" placeholder="Опишите объект или нажмите AI..."></textarea>
      <div id="ai-box-wrap" style="display:none">
        <div class="ai-result" id="ai-txt"></div>
        <div class="ai-actions">
          <button class="ai-act-btn" onclick="useAI()">✅ Применить</button>
          <button class="ai-act-btn" onclick="genAI()">🔄 Ещё раз</button>
          <button class="ai-act-btn" onclick="document.getElementById('ai-box-wrap').style.display='none'">✕</button>
        </div>
      </div>
      <button class="btn-outline" onclick="genAI()"><i class="fas fa-robot"></i> Сгенерировать описание AI</button>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:12px 0">
        <div style="border:2px dashed var(--brd2);border-radius:10px;padding:15px;text-align:center;cursor:pointer;background:var(--bg3)" onclick="toast('📷 Загрузка фото')">
          <div style="font-size:22px;margin-bottom:3px">📷</div><div style="font-size:11px;color:var(--t3)">Добавить фото</div>
        </div>
        <div style="border:2px dashed var(--brd2);border-radius:10px;padding:15px;text-align:center;cursor:pointer;background:var(--bg3)" onclick="toast('🎬 Загрузка видео')">
          <div style="font-size:22px;margin-bottom:3px">🎬</div><div style="font-size:11px;color:var(--t3)">Добавить видео</div>
        </div>
      </div>
      <button class="btn-primary" onclick="submitListing()"><i class="fas fa-rocket"></i> Опубликовать</button>
    </div>
  </div>
</div>

<!-- DETAIL -->
<div class="overlay" id="m-det" onclick="closeOvl(event,'m-det')">
  <div class="sheet" id="m-det-body"></div>
</div>

<!-- MORE MENU -->
<div class="overlay" id="m-more" onclick="closeOvl(event,'m-more')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div class="sh-title">Меню</div>
    <div class="more-grid">
      <div class="more-item" onclick="closeM('m-more');go('s-aira');nav(null)">
        <div class="more-ico">💬</div><div class="more-name">Aira</div><div class="more-sub">Чат риэлторов</div>
      </div>
      <div class="more-item" onclick="closeM('m-more');go('s-cal');nav(null)">
        <div class="more-ico">📅</div><div class="more-name">Календарь</div><div class="more-sub">Расписание</div>
      </div>
      <div class="more-item" onclick="closeM('m-more');go('s-prof');nav(null)">
        <div class="more-ico">👤</div><div class="more-name">Профиль</div><div class="more-sub">Мой аккаунт</div>
      </div>
      <div class="more-item" onclick="closeM('m-more');go('s-notif');nav(null)" style="position:relative">
        <div class="more-ico">🔔</div><div class="more-name">Уведомления</div><div class="more-sub">3 новых</div>
      </div>
    </div>
  </div>
</div>

<!-- EVENT -->
<div class="overlay" id="m-ev" onclick="closeOvl(event,'m-ev')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div class="sh-title">Новое событие</div>
    <div class="sh-body">
      <label class="flabel">Тип</label>
      <select class="finput" id="ev-type">
        <option value="showing">🏠 Показ</option><option value="call">📞 Звонок</option>
        <option value="deal">✍️ Подписание</option><option value="meeting">🤝 Встреча</option>
      </select>
      <label class="flabel">Заголовок</label>
      <input class="finput" type="text" id="ev-title" placeholder="Показ 3к в Есиле">
      <label class="flabel">Клиент</label>
      <input class="finput" type="text" id="ev-client" placeholder="Имя клиента">
      <div class="form-row2">
        <div><label class="flabel">Дата</label><input class="finput" type="date" id="ev-date"></div>
        <div><label class="flabel">Время</label><input class="finput" type="time" id="ev-time"></div>
      </div>
      <label class="flabel">Заметка</label>
      <textarea class="finput" id="ev-note" placeholder="Взять ключи..."></textarea>
      <div class="info-box warn"><span>🤖</span><span>Flai напомнит вам за 30 минут!</span></div>
      <button class="btn-primary" onclick="saveEv()">✅ Добавить событие</button>
    </div>
  </div>
</div>

<!-- TOAST -->
<div id="toast"></div>

<script src="/static/app.js"></script>
</div>
</div>
</body>
</html>`
}

export default app
