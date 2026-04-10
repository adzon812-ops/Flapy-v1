import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()
app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './' }))

app.get('/favicon.ico', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  return c.body('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1E2D5A"/><path d="M6 16L16 8l10 8v9H6z" fill="none" stroke="white" stroke-width="1.5"/><path d="M12 25v-7h8v7" fill="white"/></svg>')
})

// ─── API ROUTES ───────────────────────────────────────────────
app.get('/api/listings', (c) => c.json({ listings: getMockListings() }))
app.get('/api/realtors', (c) => c.json({ realtors: getMockRealtors() }))
app.post('/api/ai/describe', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  return c.json({ description: generateAIDesc(b) })
})
app.post('/api/auth/register', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  return c.json({ success: true, user: { id: 'u_'+Date.now(), name: b.name, email: b.email, phone: b.phone, agency: b.agency, verified: true, rating: 5.0, deals: 0, reviews: 0 } })
})
app.post('/api/auth/login', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  const email = b.email || ''
  const demo = email.includes('test') || email.includes('demo')
  return c.json({ success: true, user: { id: 'u1', name: demo ? 'Айгерим К.' : 'Риэлтор', email, verified: true, deals: 47, rating: 4.9, agency: 'Century 21', reviews: 23 } })
})
app.get('/api/calendar', (c) => c.json({ events: getMockCalendar() }))
app.post('/api/chat/flai', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  return c.json({ reply: getFlaiReply(b.message || '', b.lang || 'ru') })
})
app.post('/api/listing/rate-realtor', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  return c.json({ success: true, message: 'Риэлтор назначен', realtorId: b.realtorId })
})
app.post('/api/chat/aira', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  return c.json({ success: true, threadId: 'th_'+Date.now(), message: 'Опубликовано в Aira' })
})
app.post('/api/exchange/propose', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  return c.json({ success: true, message: 'Обмен предложен', fromId: b.fromId, toId: b.toId })
})
app.get('/api/exchange/matches/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const all = getMockListings()
  const matches = all.filter((l:any) => l.exchange && l.id !== id)
  return c.json({ matches })
})

// ─── HELPERS ──────────────────────────────────────────────────
function generateAIDesc(o: any): string {
  const types: Record<string,string> = { apartment:'квартира', house:'дом', commercial:'коммерческое помещение', land:'участок' }
  const t = types[o.type] || 'объект'
  const ex = o.exchange ? '\n🔄 Рассмотрим обмен — отличная возможность для оптимизации налогов!' : ''
  const p = o.price ? (Number(o.price)/1e6).toFixed(1)+' млн ₸' : 'по договору'
  const features = ['Развитая инфраструктура', 'Рядом транспорт', 'Ухоженный двор', 'Консьерж']
  const feat = features.slice(0,2).join(' · ')
  return `✨ ${o.rooms ? o.rooms+'-комнатная ' : ''}${t}${o.area ? ', '+o.area+' м²' : ''} в ${o.district||'Астане'}!\n\n🏆 ${feat}\n💰 Цена: ${p}${ex}\n\n📍 ${o.district||'Есиль'}, ${o.city||'Астана'}\n📞 Звоните — покажу в любое удобное время!`
}

function getMockRealtors() {
  return [
    { id:'r1', name:'Айгерим К.',  agency:'Century 21', rating:4.9, deals:47, reviews:23, phone:'+7 701 234 56 78', photo:'А', color:'#1E2D5A', specialization:'Квартиры, новострой', experience:5, badge:'ТОП',  verified:true  },
    { id:'r2', name:'Данияр М.',   agency:'Etagi',      rating:4.7, deals:32, reviews:18, phone:'+7 702 345 67 89', photo:'Д', color:'#F47B20', specialization:'Дома, коттеджи',    experience:7, badge:'',     verified:true  },
    { id:'r3', name:'Сауле Т.',    agency:'Royal Group', rating:5.0, deals:68, reviews:41, phone:'+7 707 456 78 90', photo:'С',  color:'#27AE60', specialization:'Коммерция',         experience:9, badge:'ТОП',  verified:true  },
    { id:'r4', name:'Нурлан А.',   agency:'Самозанятый',rating:4.6, deals:23, reviews:12, phone:'+7 705 567 89 01', photo:'Н', color:'#9B59B6', specialization:'Обмен, любые',      experience:3, badge:'',     verified:true  },
    { id:'r5', name:'Асель Б.',    agency:'Etagi',      rating:4.8, deals:38, reviews:19, phone:'+7 708 678 90 12', photo:'А', color:'#E67E22', specialization:'Новострой',         experience:4, badge:'',     verified:true  },
  ]
}

function getMockListings() {
  return [
    { id:1,  type:'apartment', rooms:3, area:85,  district:'Бостандыкский', city:'Алматы', price:78500000,   exchange:false,  hasVideo:true,  videoId:'ScMzIvxBSi4',  videoTitle:'Обзор 3к квартиры', realtor:'Айгерим К.',  realtorId:'r1',  realtorFull:'Айгерим Касымова', rating:4.9, deals:47,  agency:'Century 21',  tags:['Новострой'], badge:'Новое',   desc:'Просторная 3-комнатная с панорамным видом. Свежий ремонт евро-класса, подземный паркинг, охраняемый ЖК.', photos:['🛋️','🛁','🪟','🏗️'] },
    { id:2,  type:'apartment', rooms:3, area:82,  district:'Есильский',     city:'Астана', price:62000000,   exchange:false,  hasVideo:true,  videoId:'tgbNymZ7vqY',  videoTitle:'Видео-тур 3к',      realtor:'Данияр М.',   realtorId:'r2',  realtorFull:'Данияр Мусин',      rating:4.7, deals:32, agency:'Etagi',       tags:['Горящее'],  badge:'Горящее', desc:'Отличная 3-комнатная в новом ЖК. Полная отделка, вид на парк, детская площадка во дворе.',             photos:['🛋️','🚿','🌇'] },
    { id:3,  type:'house',     rooms:5, area:220,  district:'Алматинский',    city:'Астана', price:150000000,  exchange:true,   hasVideo:true,   videoId:'UxxajLWwzqY',  videoTitle:'Видео-тур дома',     realtor:'Сауле Т.',    realtorId:'r3',  realtorFull:'Сауле Тлеубекова',  rating:5.0, deals:68,  agency:'Royal Group',  tags:['Обмен'],     badge:'Обмен',    desc:'Дом с участком 10 соток. Гараж на 2 машины, баня, летняя кухня. Рассмотрим обмен на квартиру!',         photos:['🏡','🌳','🏊','🔥'] },
    { id:4,  type:'commercial',rooms:0, area:120,  district:'Байконыр',       city:'Астана', price:65000000,   exchange:false,  hasVideo:false,  videoId:'',              videoTitle:'',                   realtor:'Нурлан А.',   realtorId:'r4',  realtorFull:'Нурлан Ахметов',    rating:4.6, deals:23,  agency:'Самозанятый',  tags:['Инвест'],    badge:'Топ',      desc:'Помещение первой линии, высокий трафик 5000 чел/день. Идеально под ресторан, аптеку, офис.',            photos:['🏪','📐','🔌'] },
    { id:5,  type:'apartment', rooms:2, area:65,   district:'Сарыарка',       city:'Астана', price:38000000,   exchange:true,   hasVideo:false,  videoId:'',              videoTitle:'',                   realtor:'Айгерим К.',  realtorId:'r1',  realtorFull:'Айгерим Касымова',  rating:4.9, deals:47,  agency:'Century 21',   tags:['Обмен'],     badge:'Обмен',    desc:'Уютная 2-комнатная в тихом дворе. Рядом школа, детский сад, магазины. Рассмотрим обмен!',               photos:['🛋️','🚿'] },
    { id:6,  type:'apartment', rooms:1, area:42,   district:'Есиль',          city:'Астана', price:29000000,   exchange:false,  hasVideo:true,   videoId:'jNQXAC9IVRw',   videoTitle:'Студия видео-тур',   realtor:'Данияр М.',   realtorId:'r2',  realtorFull:'Данияр Мусин',      rating:4.7, deals:32,  agency:'Etagi',        tags:['Студия'],    badge:'Новое',    desc:'Стильная студия со смарт-дизайном. Встроенная кухня, системы умного дома, вид на ночной город.',         photos:['🛋️','🌃'] },
  ]
}

function getMockCalendar() {
  const t = new Date()
  const dt = (d:number,h:number,m:number) => new Date(t.getFullYear(),t.getMonth(),t.getDate()+d,h,m).toISOString()
  return [
    { id:1, title:'Показ квартиры 3к Есиль',   time:dt(0,10,0),   type:'showing', client:'Алия С.',       note:'Взять ключи от 401', color:'#F47B20' },
    { id:2, title:'Звонок клиенту',             time:dt(0,14,30),  type:'call',    client:'Данияр М.',      note:'Обсудить ипотеку Halyk', color:'#27AE60' },
    { id:3, title:'Подписание договора',        time:dt(1,11,0),   type:'deal',    client:'Нурсулу К.',     note:'Проверить документы ЦОН', color:'#1E2D5A' },
    { id:4, title:'Показ коммерции Байконыр',   time:dt(1,15,0),   type:'showing', client:'Бизнес-клиент',  note:'Взять план помещения', color:'#F47B20' },
    { id:5, title:'Встреча в агентстве',        time:dt(2,10,0),   type:'meeting',  client:'Century 21',     note:'Новые объекты недели', color:'#9B59B6' },
  ]
}

function getFlaiReply(msg: string, lang: string): string {
  const m = msg.toLowerCase()
  const kz = lang === 'kz'
  if (m.includes('обмен') || m.includes('айырбас'))
    return kz ? '🔄 Айырбас 2026 жылы тиімді! Салықтан босату мерзімі — 2 жыл. Айырбас 10–15% үнемдеуге мүмкіндік береді. Риэлторды байланыстырайын!' : '🔄 Обмен актуален в 2026! Новые правила: освобождение от налога — 2 года. Обмен экономит 10–15%. Хотите подобрать вариант обмена?'
  if (m.includes('ипотека') || m.includes('несие') || m.includes('кредит'))
    return kz ? '🏦 Отбасы Банк, Halyk Bank, Jusan Bank-пен жұмыс істейміз. Ставка жылдық 5%-дан. Нақты объект бойынша есептеп берейін?' : '🏦 Работаем с Отбасы Банк, Halyk Bank, Jusan Bank. Ставки от 5% годовых. Рассчитать ипотеку по конкретному объекту?'
  if (m.includes('цена') || m.includes('баға') || m.includes('сколько') || m.includes('стоимость'))
    return kz ? '💰 Баға ауданға, ауданына және жай-күйіне байланысты. Есіл районда 1к — 28 млн-нан. Нақты баға беруді қалайсыз ба?' : '💰 Цена зависит от района, площади и состояния. В Есиле 1к от 28 млн ₸. Хотите оценку конкретного объекта?'
  if (m.includes('налог') || m.includes('салық'))
    return kz ? '💡 2026 жылдан: салықсыз мерзім — 2 жыл. Мерзімінен бұрын сатқанда 10–15%. Айырбас — үнемдеудің тиімді жолы!' : '💡 С 2026 года: срок без налога — 2 года. При продаже раньше — 10–15%. Обмен — выгодная альтернатива!'
  if (m.includes('показ') || m.includes('көрсет') || m.includes('посмотреть'))
    return kz ? '📅 Ыңғайлы уақытта көрсетуді ұйымдастырамыз. Риэлтор демалыссыз жұмыс істейді. Бүгін немесе ертең ыңғайлы ма?' : '📅 Организуем показ в удобное время. Риэлтор работает без выходных. Когда удобно — сегодня или завтра?'
  if (m.includes('описание') || m.includes('сипаттама') || m.includes('составить'))
    return kz ? '✍️ Объект сипаттамасын дайындауға көмектесемін! Тип, ауданы, ауданы мен бағасын айтыңыз — мен мәтін жасаймын.' : '✍️ Помогу составить привлекательное описание! Укажите тип, площадь, район и цену — сгенерирую текст для публикации.'
  if (m.includes('продвижение') || m.includes('жылжыту') || m.includes('реклама'))
    return kz ? '📢 Объектті жылжыту үшін: сапалы фото, видео-тур, AI сипаттамасы. Aira арқылы әріптестерге жіберіңіз.' : '📢 Для продвижения: качественные фото, видео-тур, AI-описание, публикация в Aira для коллег-риэлторов.'
  if (m.includes('оценк') || m.includes('баға') || m.includes('рынок'))
    return kz ? '📊 Нарықтық бағалау үшін ауданды, ауданын, қабатын және жай-күйін айтыңыз. 15 минутта бағалайын!' : '📊 Для рыночной оценки укажите район, площадь, этаж и состояние. Оценю в течение 15 минут!'
  if (m.includes('привет') || m.includes('сәлем') || m.includes('здравствуй') || m.includes('салем'))
    return kz ? '👋 Сәлем! Мен Flai — жылжымайтын мүлік бойынша AI-көмекшіңізмін. Пәтер табуға, ипотека есептеуге, баға беруге көмектесемін!' : '👋 Привет! Я Flai — ваш AI-помощник по недвижимости. Помогу найти жильё, рассчитать ипотеку, оценить объект!'
  if (m.includes('риэлтор') || m.includes('риэлт') || m.includes('выбрать'))
    return kz ? '🏆 Риэлторды рейтинг, сделок саны және мамандану бойынша таңдаңыз. ТОП риэлторлар бет бар!' : '🏆 Выберите риэлтора по рейтингу, количеству сделок и специализации. У нас есть страница ТОП-риэлторов!'
  return kz ? '😊 Жақсы сұрақ! Риэлтор жақын арада жауап береді. Тағы не сұрайын?' : '😊 Хороший вопрос! Чем ещё могу помочь? Спросите про ипотеку, цены, налоги или организуйте показ.'
}

// ─── MAIN HTML ────────────────────────────────────────────────
app.get('/', (c) => c.html(getHTML()))

function getHTML(): string {
return `<!DOCTYPE html>
<html lang="ru" data-theme="light" data-lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#FFFFFF">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>Flapy™ — Умный помощник по жилью</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<style>
/* ════════════════════════════════════════════════════
   FLAPY v4.0 — Full Product  Kaspi-Light UI
════════════════════════════════════════════════════ */
:root{
  --white:#FFFFFF; --bg:#F5F5F7; --bg2:#FFFFFF; --bg3:#F0F0F5;
  --navy:#1E2D5A; --navy2:#2E4A85; --orange:#F47B20; --orange2:#FF9A3C;
  --green:#27AE60; --red:#E74C3C; --purple:#9B59B6;
  --t1:#1A1A2E; --t2:#6B7280; --t3:#9CA3AF;
  --brd:#E5E7EB; --brd2:#D1D5DB;
  --sh:0 1px 4px rgba(0,0,0,.06),0 2px 10px rgba(0,0,0,.05);
  --sh2:0 4px 20px rgba(0,0,0,.1);
  --nav-h:56px; --bot-h:64px; --r:14px; --max:480px;
}
[data-theme=dark]{
  --bg:#0F0F1A; --bg2:#161626; --bg3:#1E1E35;
  --t1:#F0F0FF; --t2:#9090C0; --t3:#5A5A80;
  --brd:rgba(255,255,255,.1); --brd2:rgba(255,255,255,.15);
  --sh:0 1px 4px rgba(0,0,0,.25),0 2px 10px rgba(0,0,0,.2);
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;background:var(--bg);font-family:'Inter',-apple-system,sans-serif;color:var(--t1);overflow:hidden;-webkit-font-smoothing:antialiased}
button{border:none;cursor:pointer;font-family:inherit;background:none;color:inherit}
input,textarea,select{font-family:inherit;outline:none;color:var(--t1);background:none}
::-webkit-scrollbar{width:0;height:0}
/* App shell */
#app-shell{position:fixed;inset:0;display:flex;justify-content:center;align-items:flex-start;background:#E0E0EC}
[data-theme=dark] #app-shell{background:#08080F}
#app-wrap{position:relative;width:100%;max-width:var(--max);height:100%;background:var(--bg);overflow:hidden;box-shadow:0 0 60px rgba(0,0,0,.12)}
@media(min-width:520px){#app-wrap{border-left:1px solid var(--brd);border-right:1px solid var(--brd)}}
/* Loader */
#loader{position:absolute;inset:0;z-index:999;background:var(--bg2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;transition:opacity .3s}
.ld-icon{width:52px;height:52px;background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(30,45,90,.25)}
.ld-name{font-size:30px;font-weight:900;color:var(--navy);letter-spacing:-1px}
[data-theme=dark] .ld-name{color:#fff}
.ld-tm{font-size:10px;color:var(--orange);vertical-align:super;font-weight:700}
.ld-sub{font-size:13px;color:var(--t3)}
.ld-bar-wrap{width:72px;height:3px;background:var(--bg3);border-radius:2px;overflow:hidden;margin-top:4px}
.ld-bar{height:100%;background:linear-gradient(90deg,var(--navy),var(--orange));border-radius:2px;animation:ldA 1.4s ease forwards}
@keyframes ldA{from{width:0}to{width:100%}}
/* Topbar */
#topbar{position:absolute;top:0;left:0;right:0;height:var(--nav-h);z-index:50;background:var(--bg2);border-bottom:1px solid var(--brd);display:flex;align-items:center;padding:0 14px;gap:10px}
.logo-row{display:flex;align-items:center;gap:8px;flex:1}
.logo-icon{width:32px;height:32px;background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.logo-txt{font-size:18px;font-weight:900;color:var(--navy);letter-spacing:-.5px}
[data-theme=dark] .logo-txt{color:#fff}
.logo-tag{font-size:10px;color:var(--orange);vertical-align:super;font-weight:700}
.top-right{display:flex;align-items:center;gap:7px}
.lang-sw{display:flex;align-items:center;background:var(--bg3);border-radius:8px;padding:2px;border:1px solid var(--brd)}
.lo{padding:3px 7px;border-radius:6px;font-size:11px;font-weight:700;color:var(--t3);cursor:pointer;transition:all .15s}
.lo.on{background:var(--navy);color:#fff}
[data-theme=dark] .lo.on{background:var(--orange)}
.tb-btn{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--t3);background:var(--bg3);border:1px solid var(--brd);cursor:pointer;transition:all .15s}
.tb-btn:active{background:var(--navy);color:#fff;border-color:var(--navy)}
.login-btn{padding:0 13px;height:30px;border-radius:8px;background:var(--navy);color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:opacity .15s;white-space:nowrap}
[data-theme=dark] .login-btn{background:var(--orange)}
.login-btn:active{opacity:.8}
.u-chip{display:flex;align-items:center;gap:6px;cursor:pointer}
.u-ava{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--navy2));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff}
.u-nm{font-size:12px;font-weight:700;color:var(--t1)}
/* Main */
#main{position:absolute;top:var(--nav-h);bottom:var(--bot-h);left:0;right:0;overflow:hidden}
.scr{position:absolute;inset:0;overflow-y:auto;display:none;-webkit-overflow-scrolling:touch;background:var(--bg)}
.scr.on{display:block}
/* ══ OBJECTS SCREEN ══ */
#s-search{background:var(--bg)}
.list-header{position:sticky;top:0;z-index:10;background:var(--bg2);border-bottom:1px solid var(--brd)}
.lh-top{padding:10px 14px 0}
.lh-tagline{font-size:12px;color:var(--t3);font-weight:500;margin-bottom:6px}
.tab-row{display:flex;border-bottom:1px solid var(--brd)}
.tab-item{flex:1;padding:10px 0;text-align:center;font-size:14px;font-weight:600;color:var(--t3);border-bottom:2.5px solid transparent;cursor:pointer;transition:all .15s;margin-bottom:-1px}
.tab-item.on{color:var(--navy);border-color:var(--navy);font-weight:700}
[data-theme=dark] .tab-item.on{color:var(--orange);border-color:var(--orange)}
.filter-row{display:flex;gap:6px;overflow-x:auto;padding:9px 14px}
.fchip{flex-shrink:0;padding:5px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid var(--brd2);color:var(--t2);background:none;transition:all .15s;white-space:nowrap}
.fchip.on{background:var(--navy);color:#fff;border-color:var(--navy)}
[data-theme=dark] .fchip.on{background:var(--orange);border-color:var(--orange)}
.list-body{padding:10px 12px 12px}
/* Listing card */
.lcard{background:var(--bg2);border-radius:var(--r);box-shadow:var(--sh);margin-bottom:12px;overflow:hidden;cursor:pointer;border:1px solid var(--brd);transition:box-shadow .15s}
.lcard:active{box-shadow:var(--sh2)}
.lcard-media{position:relative;height:185px;background:linear-gradient(135deg,#EEF0F6,#E0E3EE);overflow:hidden;display:flex;align-items:center;justify-content:center}
[data-theme=dark] .lcard-media{background:linear-gradient(135deg,#1E1E35,#161626)}
.lcard-em{font-size:64px;opacity:.22}
.video-thumb{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.45)}
.video-play{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--navy);margin-bottom:6px}
.video-lbl{font-size:11px;color:rgba(255,255,255,.85);font-weight:600}
.lcard-badge{position:absolute;top:10px;right:10px;padding:3px 9px;border-radius:7px;font-size:11px;font-weight:700;color:#fff}
.photo-dots{position:absolute;bottom:6px;left:50%;transform:translateX(-50%);display:flex;gap:4px}
.pdot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.5)}
.pdot.on{background:#fff;width:12px;border-radius:3px}
.lcard-body{padding:11px 13px 13px}
.lcard-loc{font-size:12px;color:var(--t3);display:flex;align-items:center;gap:4px;margin-bottom:5px}
.lcard-loc i{color:var(--orange);font-size:11px}
.lcard-price{font-size:20px;font-weight:800;color:var(--t1);letter-spacing:-.3px;margin-bottom:2px}
.lcard-sub{font-size:13px;color:var(--t2);margin-bottom:9px}
.lcard-tags{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px}
.ltag{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(244,123,32,.1);color:var(--orange);border:1px solid rgba(244,123,32,.2)}
.ltag.exch{background:rgba(39,174,96,.1);color:var(--green);border-color:rgba(39,174,96,.2)}
.lcard-footer{display:flex;align-items:center;gap:8px;padding-top:9px;border-top:1px solid var(--brd)}
.lf-ava{width:26px;height:26px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff}
.lf-name{font-size:11px;font-weight:600;color:var(--t2);flex:1}
.lf-rating{font-size:11px;color:var(--orange);font-weight:700}
.lcard-cta{display:flex;gap:7px;margin-top:9px}
.cta-btn{flex:1;padding:9px 6px;border-radius:10px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:5px;transition:opacity .15s;cursor:pointer}
.cta-btn:active{opacity:.8}
.cta-call{background:var(--navy);color:#fff}
[data-theme=dark] .cta-call{background:var(--orange)}
.cta-msg{background:var(--bg3);color:var(--t1);border:1px solid var(--brd2)}
/* ══ FEED (TikTok) ══ */
#s-feed{scroll-snap-type:y mandatory;overflow-y:scroll;background:#111}
.fcard{height:100%;scroll-snap-align:start;scroll-snap-stop:always;position:relative;overflow:hidden;background:linear-gradient(135deg,#1a1a2e,#16213e)}
.fc-bg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:280px;opacity:.04;filter:blur(8px);pointer-events:none}
.fc-overlay{position:absolute;inset:0;pointer-events:none;background:linear-gradient(to bottom,rgba(0,0,0,.15) 0%,transparent 25%,rgba(0,0,0,.35) 55%,rgba(0,0,0,.85) 100%)}
/* Video in feed */
.fc-video{position:absolute;inset:0;z-index:1}
.fc-video iframe{width:100%;height:100%;border:none;pointer-events:none}
.fc-video-tap{position:absolute;inset:0;z-index:2;cursor:pointer}
.fc-play-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:3;width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);border:2px solid rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;transition:opacity .3s}
/* Side buttons */
.fc-side{position:absolute;right:10px;bottom:115px;z-index:5;display:flex;flex-direction:column;align-items:center;gap:18px}
.sab{display:flex;flex-direction:column;align-items:center;gap:2px}
.sab-btn{width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.14);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:19px;color:#fff;cursor:pointer;transition:all .15s}
.sab-btn:active{transform:scale(1.12);background:var(--orange);border-color:var(--orange)}
.sab-btn.liked{background:var(--red);border-color:var(--red)}
.sab-lbl{font-size:10px;color:rgba(255,255,255,.8);font-weight:600}
.fc-vbadge{position:absolute;top:64px;right:8px;z-index:4;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);border-radius:7px;padding:3px 9px;font-size:10px;font-weight:700;color:#fff;display:flex;align-items:center;gap:4px}
.fc-exbadge{position:absolute;top:64px;left:0;z-index:4;background:linear-gradient(90deg,var(--green),#2ECC71);color:#fff;font-size:10px;font-weight:700;padding:4px 12px;border-radius:0 8px 8px 0}
.fc-info{position:absolute;bottom:0;left:0;right:62px;z-index:5;padding:12px 13px 20px}
.fc-chips{display:flex;gap:4px;margin-bottom:6px;flex-wrap:wrap}
.fc-chip{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25)}
.fc-chip.exch{background:rgba(39,174,96,.25);color:#6EEC9A;border-color:rgba(39,174,96,.4)}
.fc-loc{font-size:11px;color:rgba(255,255,255,.65);display:flex;align-items:center;gap:4px;margin-bottom:3px}
.fc-title{font-size:20px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:2px}
.fc-price{font-size:17px;font-weight:800;color:var(--orange);margin-bottom:7px;text-shadow:0 1px 4px rgba(0,0,0,.3)}
.fc-desc{font-size:12px;color:rgba(255,255,255,.62);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:9px}
.fc-realtor{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.1);backdrop-filter:blur(6px);border-radius:10px;padding:7px 10px;border:1px solid rgba(255,255,255,.15)}
.fc-r-ava{width:28px;height:28px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff}
.fc-r-name{font-size:11px;font-weight:700;color:#fff}
.fc-r-sub{font-size:10px;color:rgba(255,255,255,.65);margin-top:1px}
.fc-r-btn{margin-left:auto;background:rgba(255,255,255,.2);border-radius:7px;padding:4px 10px;font-size:11px;font-weight:700;color:#fff;border:1px solid rgba(255,255,255,.3);cursor:pointer;transition:all .15s}
.fc-r-btn:active{background:var(--orange);border-color:var(--orange)}
/* ══ CHAT — WhatsApp ══ */
.chat-wrap{display:flex;flex-direction:column;height:100%}
.chat-header{flex-shrink:0;background:var(--bg2);border-bottom:1px solid var(--brd);padding:10px 14px;display:flex;align-items:center;gap:10px}
.ch-ava{width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff}
.ch-ava.flai{background:linear-gradient(135deg,var(--navy),var(--navy2))}
.ch-ava.aira{background:linear-gradient(135deg,var(--orange),var(--orange2))}
.ch-name{font-size:15px;font-weight:700;color:var(--t1)}
.ch-status{font-size:11px;color:var(--green);font-weight:500;display:flex;align-items:center;gap:4px;margin-top:1px}
.ch-status::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--green)}
.quick-row{flex-shrink:0;background:var(--bg2);border-bottom:1px solid var(--brd);display:flex;gap:6px;overflow-x:auto;padding:8px 13px}
.qchip{flex-shrink:0;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--brd2);color:var(--t2);background:none;transition:all .15s;white-space:nowrap}
.qchip:active{background:var(--navy);color:#fff;border-color:var(--navy)}
[data-theme=dark] .qchip:active{background:var(--orange);border-color:var(--orange)}
.chat-body{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:5px;padding:12px 13px}
[data-theme=light] .chat-body{background:#EFE5D5}
[data-theme=dark] .chat-body{background:#0A0F1E}
.msg-date{align-self:center;font-size:11px;color:var(--t3);background:rgba(255,255,255,.7);border-radius:8px;padding:3px 10px;margin:3px 0}
[data-theme=dark] .msg-date{background:rgba(255,255,255,.07)}
.msg{display:flex;gap:7px;max-width:85%}
.msg.me{align-self:flex-end;flex-direction:row-reverse}
.msg.bot{align-self:flex-start}
.m-ava{width:28px;height:28px;border-radius:50%;flex-shrink:0;align-self:flex-end;background:linear-gradient(135deg,var(--navy),var(--navy2));display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff}
.bwrap{display:flex;flex-direction:column}
.bubble{padding:8px 12px;border-radius:14px;font-size:13.5px;line-height:1.52;word-break:break-word}
.msg.bot .bubble{background:var(--white);color:var(--t1);border-radius:4px 14px 14px 14px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
[data-theme=dark] .msg.bot .bubble{background:#1E1E35}
.msg.me .bubble{background:var(--navy);color:#fff;border-radius:14px 4px 14px 14px}
[data-theme=dark] .msg.me .bubble{background:var(--orange)}
.m-ts{font-size:10px;color:var(--t3);margin-top:2px;padding:0 2px}
.msg.me .m-ts{text-align:right}
.typing{display:flex;gap:4px;padding:4px 8px}
.td{width:7px;height:7px;border-radius:50%;background:var(--t3);animation:typA .9s infinite}
.td:nth-child(2){animation-delay:.2s}.td:nth-child(3){animation-delay:.4s}
@keyframes typA{0%,60%,100%{opacity:.3;transform:scale(.8)}30%{opacity:1;transform:scale(1.1)}}
.chat-input-row{flex-shrink:0;display:flex;align-items:flex-end;gap:8px;padding:8px 12px;background:var(--bg2);border-top:1px solid var(--brd)}
.ci{flex:1;min-height:40px;max-height:88px;padding:10px 14px;border-radius:22px;border:1.5px solid var(--brd2);background:var(--white);font-size:13px;resize:none;line-height:1.4;transition:border-color .15s;color:var(--t1)}
[data-theme=dark] .ci{background:var(--bg3);border-color:var(--brd)}
.ci:focus{border-color:var(--navy)}
[data-theme=dark] .ci:focus{border-color:var(--orange)}
.ci::placeholder{color:var(--t3)}
.send-btn{width:40px;height:40px;border-radius:50%;flex-shrink:0;background:var(--navy);color:#fff;font-size:15px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s}
[data-theme=dark] .send-btn{background:var(--orange)}
.send-btn.aira{background:linear-gradient(135deg,var(--orange),var(--orange2))}
.send-btn:active{transform:scale(1.1)}
/* Msg card in chat */
.msg-card{background:rgba(255,255,255,.85);border:1px solid var(--brd);border-radius:10px;padding:8px 10px;margin-top:5px;cursor:pointer;transition:box-shadow .15s}
[data-theme=dark] .msg-card{background:rgba(255,255,255,.06)}
.msg-card:active{box-shadow:var(--sh2)}
/* Aira threads */
.aira-list{padding:10px 13px;display:flex;flex-direction:column;gap:8px}
.thread{background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);overflow:hidden;box-shadow:var(--sh)}
.th-head{display:flex;align-items:center;gap:9px;padding:11px 12px;cursor:pointer}
.th-ava{width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff}
.th-name{font-size:13px;font-weight:700}
.th-time{font-size:10px;color:var(--t3);font-weight:400;margin-left:4px}
.th-prev{font-size:11px;color:var(--t2);margin-top:1px}
.th-body{padding:10px 12px;display:none;border-top:1px solid var(--brd);background:var(--bg)}
.prop-tag{display:inline-flex;align-items:center;gap:4px;background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.25);border-radius:8px;padding:3px 9px;font-size:11px;font-weight:600;color:var(--orange);margin-bottom:6px}
/* Aira write form */
.aira-compose{flex-shrink:0;padding:8px 12px;background:var(--bg2);border-top:1px solid var(--brd);display:flex;flex-direction:column;gap:7px}
.compose-tabs{display:flex;gap:5px}
.compose-tab{padding:4px 10px;border-radius:7px;font-size:11px;font-weight:700;background:var(--bg3);color:var(--t3);border:1px solid var(--brd);cursor:pointer;transition:all .15s}
.compose-tab.on{background:var(--navy);color:#fff;border-color:var(--navy)}
[data-theme=dark] .compose-tab.on{background:var(--orange);border-color:var(--orange)}
/* ══ REALTORS screen ══ */
.rel-wrap{padding:13px}
.rel-header{font-size:20px;font-weight:800;margin-bottom:4px}
.rel-sub{font-size:12px;color:var(--t3);margin-bottom:12px}
.rel-sort{display:flex;gap:6px;overflow-x:auto;margin-bottom:12px}
.rsort{flex-shrink:0;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid var(--brd2);color:var(--t2);background:none;cursor:pointer;white-space:nowrap;transition:all .15s}
.rsort.on{background:var(--navy);color:#fff;border-color:var(--navy)}
[data-theme=dark] .rsort.on{background:var(--orange);border-color:var(--orange)}
/* Realtor card */
.rcard{display:flex;align-items:center;gap:11px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:13px;margin-bottom:10px;box-shadow:var(--sh);cursor:pointer;transition:box-shadow .15s;position:relative}
.rcard:active{box-shadow:var(--sh2)}
.rc-ava{width:48px;height:48px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff}
.rc-name{font-size:14px;font-weight:700;margin-bottom:1px}
.rc-agency{font-size:11px;color:var(--t3);margin-bottom:4px}
.rc-stars{display:flex;align-items:center;gap:3px;font-size:12px;color:var(--orange);font-weight:700}
.rc-stars span{color:var(--t3);font-size:10px;font-weight:400}
.rc-badge{position:absolute;top:8px;right:8px;background:linear-gradient(135deg,var(--orange),var(--orange2));color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:5px}
.rc-stats{display:flex;gap:8px;margin-top:5px}
.rc-stat{font-size:10px;color:var(--t3);display:flex;align-items:center;gap:2px}
.rc-stat b{color:var(--t1);font-size:11px}
.rc-spec{font-size:10px;color:var(--t2);background:var(--bg3);border-radius:5px;padding:2px 7px;margin-top:4px;display:inline-block}
.rc-actions{display:flex;gap:7px;margin-top:9px}
.rc-btn{flex:1;padding:8px;border-radius:9px;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:4px;cursor:pointer;transition:opacity .15s}
.rc-btn:active{opacity:.8}
.rc-call{background:var(--navy);color:#fff}
[data-theme=dark] .rc-call{background:var(--orange)}
.rc-write{background:var(--bg3);color:var(--t1);border:1px solid var(--brd2)}
.rc-hire{background:linear-gradient(135deg,var(--green),#2ECC71);color:#fff}
/* Rating progress */
.rating-bar-wrap{margin-top:4px}
.rating-row{display:flex;align-items:center;gap:6px;margin-bottom:2px}
.rating-star-lbl{font-size:10px;color:var(--t3);width:10px;text-align:right}
.rating-prog{flex:1;height:5px;background:var(--bg3);border-radius:3px;overflow:hidden}
.rating-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--orange),var(--orange2))}
.rating-cnt{font-size:10px;color:var(--t3);width:20px}
/* Review */
.review-item{background:var(--bg3);border-radius:10px;padding:10px;margin-top:7px}
.rev-head{display:flex;align-items:center;gap:7px;margin-bottom:5px}
.rev-ava{width:26px;height:26px;border-radius:50%;background:var(--navy);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff}
.rev-name{font-size:12px;font-weight:600}
.rev-stars{font-size:11px;color:var(--orange);margin-left:auto}
.rev-text{font-size:12px;color:var(--t2);line-height:1.5}
/* ══ CALENDAR ══ */
.cal-wrap{padding:13px}
.cal-title{font-size:21px;font-weight:800;margin-bottom:2px}
.cal-date{font-size:12px;color:var(--t3);margin-bottom:12px}
.sec-label{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin:14px 0 7px}
.ev-card{display:flex;align-items:stretch;gap:9px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:11px;margin-bottom:8px;cursor:pointer;box-shadow:var(--sh);transition:box-shadow .15s}
.ev-card:active{box-shadow:var(--sh2)}
.ev-time{min-width:46px;background:var(--bg3);border-radius:9px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5px}
.ev-hm{font-size:14px;font-weight:800;color:var(--navy)}
[data-theme=dark] .ev-hm{color:var(--orange)}
.ev-line{width:3px;border-radius:2px;flex-shrink:0}
.ev-inf{flex:1}
.ev-ttl{font-size:13px;font-weight:700;margin-bottom:2px}
.ev-cli{font-size:11px;color:var(--t2);margin-bottom:4px}
.ev-note{font-size:11px;color:var(--t3);background:var(--bg3);border-radius:6px;padding:3px 8px;display:inline-block}
.add-ev-btn{width:100%;padding:12px;border-radius:12px;background:none;border:2px dashed var(--brd2);color:var(--t3);font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;margin-bottom:12px;transition:all .15s}
.add-ev-btn:active{border-color:var(--orange);color:var(--orange)}
.ai-tip{display:flex;align-items:center;gap:9px;background:rgba(244,123,32,.07);border:1px solid rgba(244,123,32,.2);border-radius:12px;padding:10px 12px;margin-bottom:12px;font-size:12px;line-height:1.5;color:var(--t2)}
/* ══ PROFILE ══ */
.prof-wrap{padding:13px}
.prof-hero{background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:16px;padding:18px;margin-bottom:14px;overflow:hidden}
.ph-ava{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:9px}
.ph-name{font-size:17px;font-weight:800;color:#fff}
.ph-tag{font-size:11px;color:rgba(255,255,255,.6);margin-top:2px}
.ph-stats{display:flex;gap:7px;margin-top:12px}
.ph-stat{flex:1;background:rgba(255,255,255,.12);border-radius:10px;padding:8px;text-align:center}
.ph-val{font-size:17px;font-weight:800;color:#fff}
.ph-lbl{font-size:9px;color:rgba(255,255,255,.55);margin-top:1px}
.menu-sec{margin-bottom:16px}
.menu-lbl{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:7px}
.menu-item{display:flex;align-items:center;gap:11px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:12px;margin-bottom:7px;cursor:pointer;box-shadow:var(--sh);transition:box-shadow .15s}
.menu-item:active{box-shadow:var(--sh2)}
.menu-ico{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.menu-name{font-size:13px;font-weight:600}
.menu-sub{font-size:11px;color:var(--t3);margin-top:1px}
/* ══ NOTIFICATIONS ══ */
.notif-wrap{padding:13px}
.notif-title{font-size:20px;font-weight:800;margin-bottom:13px}
.notif-item{display:flex;gap:10px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:12px;margin-bottom:8px;box-shadow:var(--sh)}
.notif-ico{font-size:20px;flex-shrink:0;margin-top:1px}
.notif-txt{font-size:12px;line-height:1.55;color:var(--t2)}
.notif-txt b{color:var(--t1)}
.notif-time{font-size:10px;color:var(--t3);margin-top:3px}
.n-new-dot{width:7px;height:7px;border-radius:50%;background:var(--orange);display:inline-block;margin-right:4px;vertical-align:middle}
/* ══ BOTTOM NAV ══ */
#botbar{position:absolute;bottom:0;left:0;right:0;height:var(--bot-h);z-index:50;background:var(--bg2);border-top:1px solid var(--brd);display:flex;align-items:center;padding:0 8px 6px}
.nav-it{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:var(--t3);padding:6px 2px;border-radius:10px;position:relative;transition:color .15s}
.nav-svg{width:22px;height:22px;transition:transform .15s;flex-shrink:0}
.nav-it span{font-size:9px;font-weight:700}
.nav-it.on{color:var(--navy)}
[data-theme=dark] .nav-it.on{color:var(--orange)}
.nav-it.on .nav-svg{transform:scale(1.1)}
.nav-plus-wrap{flex-shrink:0;padding:0 6px}
.nav-plus{width:48px;height:48px;border-radius:14px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(30,45,90,.3);cursor:pointer;transition:transform .15s}
[data-theme=dark] .nav-plus{background:var(--orange);box-shadow:0 4px 16px rgba(244,123,32,.3)}
.nav-plus:active{transform:scale(1.05)}
.n-badge{position:absolute;top:3px;right:calc(50% - 18px);width:15px;height:15px;border-radius:8px;background:var(--red);color:#fff;font-size:8px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg2)}
/* ══ MODALS ══ */
.overlay{position:absolute;inset:0;z-index:200;background:rgba(0,0,0,.5);backdrop-filter:blur(3px);display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .22s}
.overlay.on{opacity:1;pointer-events:all}
.sheet{width:100%;max-height:92%;background:var(--bg2);border-radius:20px 20px 0 0;overflow-y:auto;padding-bottom:20px;transform:translateY(16px);transition:transform .22s}
.overlay.on .sheet{transform:translateY(0)}
.sh-handle{width:32px;height:4px;border-radius:2px;background:var(--brd2);margin:10px auto 12px}
.sh-title{font-size:17px;font-weight:800;padding:0 17px 12px}
.sh-body{padding:0 17px}
.flabel{font-size:11px;font-weight:600;color:var(--t3);margin-bottom:4px;display:block}
.finput{width:100%;padding:10px 13px;border-radius:10px;background:var(--bg3);border:1.5px solid var(--brd);font-size:13px;margin-bottom:11px;color:var(--t1);transition:border-color .15s}
.finput:focus{border-color:var(--navy)}
[data-theme=dark] .finput:focus{border-color:var(--orange)}
select.finput{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239CA3AF'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;background-color:var(--bg3);padding-right:28px}
textarea.finput{resize:none;min-height:68px;line-height:1.5}
.form-row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.btn-primary{width:100%;padding:13px;border-radius:12px;background:var(--navy);color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:opacity .15s;display:flex;align-items:center;justify-content:center;gap:6px}
[data-theme=dark] .btn-primary{background:var(--orange)}
.btn-primary:active{opacity:.85}
.btn-secondary{width:100%;padding:11px;border-radius:12px;background:var(--bg3);border:1.5px solid var(--brd);font-size:13px;font-weight:600;margin-top:8px;color:var(--t1);cursor:pointer}
.btn-outline{width:100%;padding:11px;border-radius:11px;background:none;border:1.5px solid var(--navy);color:var(--navy);font-size:13px;font-weight:600;margin-top:7px;cursor:pointer;transition:all .15s}
[data-theme=dark] .btn-outline{border-color:var(--orange);color:var(--orange)}
.btn-outline:active{background:var(--navy);color:#fff}
.tab-switcher{display:flex;background:var(--bg3);border-radius:10px;padding:3px;margin-bottom:14px}
.tsw{flex:1;padding:7px;border-radius:7px;font-size:13px;font-weight:700;color:var(--t3);cursor:pointer;text-align:center;transition:all .15s}
.tsw.on{background:var(--navy);color:#fff}
[data-theme=dark] .tsw.on{background:var(--orange)}
.info-box{display:flex;align-items:flex-start;gap:7px;background:rgba(39,174,96,.07);border:1px solid rgba(39,174,96,.2);border-radius:10px;padding:9px 11px;margin-bottom:11px;font-size:12px;line-height:1.5;color:var(--t2)}
.info-box.warn{background:rgba(244,123,32,.07);border-color:rgba(244,123,32,.2)}
.ai-label{display:inline-flex;align-items:center;gap:3px;background:rgba(244,123,32,.12);border-radius:5px;padding:1px 7px;font-size:10px;font-weight:700;color:var(--orange)}
.ai-result{background:var(--bg3);border:1.5px solid rgba(244,123,32,.25);border-radius:10px;padding:11px;margin-top:6px;font-size:12px;line-height:1.6;color:var(--t2);white-space:pre-wrap}
.ai-actions{display:flex;gap:6px;margin-top:7px}
.ai-act-btn{padding:5px 11px;border-radius:8px;font-size:11px;font-weight:600;background:var(--bg3);border:1px solid var(--brd);color:var(--t2);cursor:pointer;transition:all .15s}
.ai-act-btn:active{background:var(--navy);color:#fff;border-color:var(--navy)}
/* Detail */
.det-visual{height:200px;position:relative;overflow:hidden;background:linear-gradient(135deg,#EEF0F6,#E0E3EE)}
[data-theme=dark] .det-visual{background:linear-gradient(135deg,#1E1E35,#161626)}
.det-visual iframe{width:100%;height:100%;border:none}
.det-em-bg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:80px;opacity:.25}
.det-photos{display:flex;gap:6px;padding:8px 17px;overflow-x:auto}
.det-photo{width:56px;height:56px;border-radius:8px;background:var(--bg3);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;border:2px solid transparent;transition:all .15s}
.det-photo.on{border-color:var(--navy)}
.det-price{font-size:23px;font-weight:900;color:var(--t1);padding:8px 17px 4px}
.det-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:4px 17px 12px}
.det-cell{background:var(--bg3);border-radius:10px;padding:11px;text-align:center}
.det-val{font-size:15px;font-weight:800;color:var(--navy)}
[data-theme=dark] .det-val{color:var(--orange)}
.det-lbl{font-size:10px;color:var(--t3);margin-top:2px}
.det-desc{padding:2px 17px 10px;font-size:13px;line-height:1.7;color:var(--t2)}
.det-realtor{margin:0 17px 12px;background:var(--bg3);border-radius:12px;padding:12px;display:flex;align-items:center;gap:10px;cursor:pointer;border:1px solid var(--brd)}
.det-cta{display:flex;gap:8px;padding:0 17px 4px}
.det-btn{flex:1;padding:12px;border-radius:12px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity .15s}
.det-btn:active{opacity:.85}
.det-call{background:var(--green)}
.det-chat{background:var(--navy)}
[data-theme=dark] .det-chat{background:var(--orange)}
.det-hire{background:linear-gradient(135deg,var(--orange),var(--orange2))}
/* Exchange */
.exch-match{background:rgba(39,174,96,.07);border:1px solid rgba(39,174,96,.2);border-radius:12px;padding:12px 13px;margin:0 17px 10px;cursor:pointer}
/* Realtor modal */
.rel-modal-card{background:var(--bg3);border-radius:12px;padding:13px;margin-bottom:11px}
/* More grid */
.more-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:0 17px 17px}
.more-item{background:var(--bg2);border:1px solid var(--brd);border-radius:14px;padding:16px;cursor:pointer;text-align:center;box-shadow:var(--sh);transition:box-shadow .15s}
.more-item:active{box-shadow:var(--sh2)}
.more-ico{font-size:28px;margin-bottom:5px}
.more-name{font-size:12px;font-weight:700}
.more-sub{font-size:10px;color:var(--t3);margin-top:2px}
/* Empty */
.empty{text-align:center;padding:52px 20px}
.empty-ico{font-size:44px;opacity:.25;margin-bottom:9px}
.empty-t{font-size:15px;font-weight:700;margin-bottom:4px}
.empty-s{font-size:12px;color:var(--t3)}
/* Toast */
#toast{position:absolute;bottom:78px;left:50%;transform:translateX(-50%) translateY(6px);background:rgba(30,45,90,.9);color:#fff;border-radius:10px;padding:9px 16px;font-size:12px;font-weight:600;white-space:nowrap;z-index:600;opacity:0;transition:all .2s;backdrop-filter:blur(5px)}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
/* Anim */
.su{animation:suIn .25s ease}
@keyframes suIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
/* Stars */
.stars-row{display:flex;gap:3px;margin-bottom:10px}
.star-btn{font-size:26px;cursor:pointer;transition:transform .15s;color:var(--brd2)}
.star-btn.on{color:var(--orange)}
.star-btn:active{transform:scale(1.2)}
/* Play overlay on list card */
.play-overlay{position:absolute;inset:0;background:rgba(0,0,0,.38);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}
.play-overlay i{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.88);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--navy)}
/* Rank card */
.rank-card{display:flex;align-items:center;gap:10px;background:var(--bg2);border:1px solid var(--brd);border-radius:12px;padding:11px;margin-bottom:7px;cursor:pointer;box-shadow:var(--sh)}
.rank-num{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0}
.rank-bar{height:4px;border-radius:2px;background:linear-gradient(90deg,var(--orange),var(--orange2));margin-top:5px;transition:width .4s}
</style>
</head>
<body>
<div id="app-shell"><div id="app-wrap">
<!-- LOADER -->
<div id="loader">
  <div class="ld-icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg></div>
  <div class="ld-name">Flapy<span class="ld-tm">™</span></div>
  <div class="ld-sub" id="ld-sub">Ваш умный помощник на рынке жилья</div>
  <div class="ld-bar-wrap"><div class="ld-bar"></div></div>
</div>
<!-- TOPBAR -->
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
    <div id="auth-slot"><button class="login-btn" onclick="openM('m-auth')" id="login-btn-top">Войти</button></div>
  </div>
</div>
<!-- MAIN -->
<div id="main">
<!-- ── OBJECTS ── -->
<div id="s-search" class="scr on">
  <div class="list-header">
    <div class="lh-top">
      <div class="lh-tagline" id="tx-tagline">Ваш умный помощник на рынке жилья</div>
      <div class="tab-row">
        <div class="tab-item on" id="tab-obj" onclick="setListTab('obj')" id="tx-tab-obj" data-ru="Объекты" data-kz="Объектілер">Объекты</div>
        <div class="tab-item" id="tab-exch" onclick="setListTab('exch')" id="tx-tab-exch" data-ru="Обмен" data-kz="Айырбас">Обмен</div>
      </div>
    </div>
    <div class="filter-row" id="filter-row">
      <div class="fchip on" onclick="setFilt(this,'all')" data-ru="Все" data-kz="Барлығы">Все</div>
      <div class="fchip" onclick="setFilt(this,'apartment')" data-ru="Квартиры" data-kz="Пәтерлер">Квартиры</div>
      <div class="fchip" onclick="setFilt(this,'house')" data-ru="Дома" data-kz="Үйлер">Дома</div>
      <div class="fchip" onclick="setFilt(this,'commercial')" data-ru="Коммерция" data-kz="Коммерция">Коммерция</div>
      <div class="fchip" onclick="setFilt(this,'video')" data-ru="🎬 Видео" data-kz="🎬 Видео">🎬 Видео</div>
    </div>
  </div>
  <div class="list-body" id="list-body"></div>
</div>
<!-- ── FEED ── -->
<div id="s-feed" class="scr"></div>
<!-- ── FLAI CHAT ── -->
<div id="s-flai" class="scr">
  <div class="chat-wrap">
    <div class="chat-header">
      <div class="ch-ava flai" style="font-size:12px;letter-spacing:-1px">AI</div>
      <div style="flex:1">
        <div class="ch-name">Flai <span style="font-size:11px;font-weight:500;color:var(--t2)" id="tx-flai-sub">— умный помощник</span></div>
        <div class="ch-status" id="tx-flai-status">Онлайн · отвечает мгновенно</div>
      </div>
      <div style="background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:var(--orange);font-weight:600">✨ AI</div>
    </div>
    <div class="quick-row" id="flai-chips">
      <div class="qchip" onclick="quickMsg('Помоги составить описание объекта')" data-ru="✍️ Описание" data-kz="✍️ Сипаттама">✍️ Описание</div>
      <div class="qchip" onclick="quickMsg('Как работает ипотека?')" data-ru="🏦 Ипотека" data-kz="🏦 Несие">🏦 Ипотека</div>
      <div class="qchip" onclick="quickMsg('Расскажи про продвижение объекта')" data-ru="📢 Продвижение" data-kz="📢 Жылжыту">📢 Продвижение</div>
      <div class="qchip" onclick="quickMsg('Налоги при продаже в 2026?')" data-ru="💡 Налоги" data-kz="💡 Салықтар">💡 Налоги</div>
      <div class="qchip" onclick="quickMsg('Хочу организовать показ квартиры')" data-ru="📅 Показ" data-kz="📅 Көрсету">📅 Показ</div>
      <div class="qchip" onclick="quickMsg('Оцени рыночную стоимость')" data-ru="💰 Оценка" data-kz="💰 Баға">💰 Оценка</div>
      <div class="qchip" onclick="quickMsg('Как работает обмен недвижимостью?')" data-ru="🔄 Обмен" data-kz="🔄 Айырбас">🔄 Обмен</div>
    </div>
    <div class="chat-body" id="flai-msgs">
      <div class="msg-date" id="tx-today">Сегодня</div>
      <div class="msg bot su">
        <div class="m-ava">AI</div>
        <div class="bwrap">
          <div class="bubble" id="flai-welcome">Привет! Я Flai 👋<br>Помогу найти жильё, рассчитать ипотеку, составить описание и ответить на любые вопросы о рынке недвижимости.</div>
          <div class="m-ts">сейчас</div>
        </div>
      </div>
      <div class="msg bot su">
        <div class="m-ava">AI</div>
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
<!-- ── AIRA CHAT (риэлторы) ── -->
<div id="s-aira" class="scr">
  <div class="chat-wrap">
    <div class="chat-header">
      <div class="ch-ava aira" style="font-size:13px;font-weight:900">A</div>
      <div style="flex:1">
        <div class="ch-name">Aira <span style="font-size:12px;font-weight:500;color:var(--t2)" id="tx-aira-sub">— Чат риэлторов</span></div>
        <div class="ch-status" style="color:var(--orange)">47 риэлторов онлайн</div>
      </div>
      <div id="aira-status-badge" style="background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:var(--orange);font-weight:600">🔒 Войдите</div>
    </div>
    <!-- Compose tabs -->
    <div class="aira-compose" id="aira-compose">
      <div class="compose-tabs">
        <button class="compose-tab on" id="ct-listing" onclick="setComposeTab('listing')" data-ru="🏠 Объект" data-kz="🏠 Объект">🏠 Объект</button>
        <button class="compose-tab" id="ct-exchange" onclick="setComposeTab('exchange')" data-ru="🔄 Обмен" data-kz="🔄 Айырбас">🔄 Обмен</button>
        <button class="compose-tab" id="ct-question" onclick="setComposeTab('question')" data-ru="❓ Вопрос" data-kz="❓ Сұрақ">❓ Вопрос</button>
      </div>
    </div>
    <div class="chat-body" id="aira-msgs" style="padding:10px 0">
      <div class="msg-date">Только для верифицированных риэлторов</div>
      <div class="aira-list" id="aira-list">
        <div class="thread su">
          <div class="th-head" onclick="toggleThread(this)">
            <div class="th-ava" style="background:linear-gradient(135deg,#1E2D5A,#4A6FA5)">А</div>
            <div style="flex:1">
              <div class="th-name">Айгерим К.<span class="th-time">10 мин</span></div>
              <div class="th-prev">🏠 Объект: 3к Есиль — ищу покупателя 🤝</div>
            </div>
            <i class="fas fa-chevron-down" style="color:var(--t3);font-size:11px;transition:transform .2s"></i>
          </div>
          <div class="th-body">
            <div class="prop-tag"><i class="fas fa-home"></i> 3к · 85 м² · 85 млн · Есиль</div>
            <p style="font-size:12px;color:var(--t2);margin-bottom:8px">Клиент готов к ипотеке Halyk Bank. Комиссию делим 50/50 🤝 Срочно!</p>
            <div style="font-size:12px;color:var(--green);margin-bottom:8px">✓ Данияр М.: Есть покупатель! Пишу в личку</div>
            <div style="display:flex;gap:6px">
              <button onclick="replyThread(this,'r1','Айгерим К.')" style="padding:5px 10px;border-radius:7px;background:var(--navy);color:#fff;font-size:11px;font-weight:600;cursor:pointer">💬 Ответить</button>
              <button onclick="callRealtor('+7 701 234 56 78')" style="padding:5px 10px;border-radius:7px;background:var(--bg3);color:var(--t1);font-size:11px;font-weight:600;cursor:pointer;border:1px solid var(--brd2)">📞 Позвонить</button>
            </div>
          </div>
        </div>
        <div class="thread su">
          <div class="th-head" onclick="toggleThread(this)">
            <div class="th-ava" style="background:linear-gradient(135deg,#F47B20,#FF9A3C)">Н</div>
            <div style="flex:1">
              <div class="th-name">Нурлан А.<span class="th-time">25 мин</span></div>
              <div class="th-prev">🔄 Обмен: 2к на 3к с доплатой до 20 млн</div>
            </div>
            <span style="background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.2);border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;color:var(--green)">Обмен</span>
          </div>
          <div class="th-body">
            <div class="prop-tag"><i class="fas fa-home"></i> 2к · 65 м² · 38 млн · Сарыарка</div>
            <p style="font-size:12px;color:var(--t2);margin-bottom:8px">Клиент готов доплатить до 20 млн. Без налога — 2 года! Ищу 3к в Есиле или Алматинском.</p>
            <div style="display:flex;gap:6px">
              <button onclick="replyThread(this,'r4','Нурлан А.')" style="padding:5px 10px;border-radius:7px;background:var(--orange);color:#fff;font-size:11px;font-weight:600;cursor:pointer">💬 Ответить</button>
              <button onclick="proposeExchange(4)" style="padding:5px 10px;border-radius:7px;background:var(--bg3);color:var(--t1);font-size:11px;font-weight:600;cursor:pointer;border:1px solid var(--brd2)">🔄 Предложить обмен</button>
            </div>
          </div>
        </div>
        <div class="thread su">
          <div class="th-head" onclick="toggleThread(this)">
            <div class="th-ava" style="background:linear-gradient(135deg,#27AE60,#2ECC71)">С</div>
            <div style="flex:1">
              <div class="th-name">Сауле Т.<span class="th-time">1 час</span></div>
              <div class="th-prev">❓ Вопрос: как оформить ипотечную сделку?</div>
            </div>
            <i class="fas fa-chevron-down" style="color:var(--t3);font-size:11px;transition:transform .2s"></i>
          </div>
          <div class="th-body">
            <p style="font-size:12px;color:var(--t2);margin-bottom:8px">Клиент хочет взять ипотеку Otbasy Bank. Какие документы нужны для КПП? Кто сталкивался?</p>
            <div style="font-size:12px;color:var(--navy);margin-bottom:8px">💬 Айгерим К.: КПП — паспорт, СНТ, справка с работы. Помогу!</div>
            <div style="display:flex;gap:6px">
              <button onclick="replyThread(this,'r3','Сауле Т.')" style="padding:5px 10px;border-radius:7px;background:var(--green);color:#fff;font-size:11px;font-weight:600;cursor:pointer">💬 Ответить</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="chat-input-row">
      <textarea class="ci" id="aira-inp" rows="1" placeholder="Поделитесь объектом или вопросом с коллегами..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendAira()}"></textarea>
      <button class="send-btn aira" onclick="sendAira()"><i class="fas fa-paper-plane"></i></button>
    </div>
  </div>
</div>
<!-- ── REALTORS ── -->
<div id="s-realtors" class="scr">
  <div class="rel-wrap">
    <div class="rel-header" id="tx-rel-header">Риэлторы</div>
    <div class="rel-sub" id="tx-rel-sub">Выберите лучшего специалиста</div>
    <div class="rel-sort">
      <div class="rsort on" onclick="sortRealtors('rating',this)" data-ru="⭐ Рейтинг" data-kz="⭐ Рейтинг">⭐ Рейтинг</div>
      <div class="rsort" onclick="sortRealtors('deals',this)" data-ru="🏆 Сделки" data-kz="🏆 Мәміле">🏆 Сделки</div>
      <div class="rsort" onclick="sortRealtors('reviews',this)" data-ru="💬 Отзывы" data-kz="💬 Пікір">💬 Отзывы</div>
    </div>
    <div id="realtors-list"></div>
  </div>
</div>
<!-- ── CALENDAR ── -->
<div id="s-cal" class="scr"><div class="cal-wrap" id="cal-body"></div></div>
<!-- ── PROFILE ── -->
<div id="s-prof" class="scr"><div class="prof-wrap" id="prof-body"></div></div>
<!-- ── NOTIFICATIONS ── -->
<div id="s-notif" class="scr">
  <div class="notif-wrap">
    <div class="notif-title" id="tx-notif-title">Уведомления</div>
    <div class="notif-item su"><span class="notif-ico">🤖</span><div><div class="notif-txt"><b>Flai:</b> Показ через 30 мин! Не забудьте ключи 🔑</div><div><span class="n-new-dot"></span></div><div class="notif-time">только что</div></div></div>
    <div class="notif-item su"><span class="notif-ico">💬</span><div><div class="notif-txt"><b>Aira:</b> Данияр М. ответил на ваш объект — есть покупатель!</div><div><span class="n-new-dot"></span></div><div class="notif-time">10 мин назад</div></div></div>
    <div class="notif-item su"><span class="notif-ico">⭐</span><div><div class="notif-txt">Клиент Алия С. оставил отзыв <b>★★★★★</b> после сделки</div><div><span class="n-new-dot"></span></div><div class="notif-time">1 час назад</div></div></div>
    <div class="notif-item su"><span class="notif-ico">❤️</span><div><div class="notif-txt">3 человека добавили ваш объект в избранное</div><div class="notif-time">сегодня</div></div></div>
    <div class="notif-item su"><span class="notif-ico">✍️</span><div><div class="notif-txt"><b>Flai:</b> Завтра подписание с Нурсулу К. в 11:00 — напоминание</div><div class="notif-time">вчера</div></div></div>
    <div class="notif-item su" style="border-color:rgba(244,123,32,.25)"><span class="notif-ico">💡</span><div><div class="notif-txt" style="color:var(--orange)">Клиент держит квартиру менее 2 лет — предложите обмен для экономии налога!</div><div class="notif-time">совет дня</div></div></div>
    <div class="notif-item su"><span class="notif-ico">🏆</span><div><div class="notif-txt">Ваш рейтинг вырос до <b>4.9</b> — вы в ТОП-3 риэлторов!</div><div class="notif-time">2 дня назад</div></div></div>
  </div>
</div>
</div><!-- /main -->
<!-- BOTTOM NAV -->
<div id="botbar">
  <div class="nav-it on" id="n-search" onclick="go('s-search');nav(this)">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
    <span data-ru="Объекты" data-kz="Объект">Объекты</span>
  </div>
  <div class="nav-it" id="n-feed" onclick="go('s-feed');nav(this)">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="9" height="9" rx="2"/><rect x="13" y="2" width="9" height="9" rx="2"/><rect x="2" y="13" width="9" height="9" rx="2"/><rect x="13" y="13" width="9" height="9" rx="2"/></svg>
    <span data-ru="Лента" data-kz="Лента">Лента</span>
  </div>
  <div class="nav-plus-wrap">
    <div class="nav-plus" onclick="openAddListing()">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </div>
  </div>
  <div class="nav-it" id="n-flai" onclick="go('s-flai');nav(this)" style="position:relative">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 9.5c.5-1.5 2-2.5 3.5-2 1.2.4 2 1.5 1.8 2.8-.2 1.3-1.8 2-2.3 2.7v.5"/><circle cx="12" cy="16.5" r=".75" fill="currentColor" stroke="none"/></svg>
    <span>Flai AI</span>
    <span class="n-badge" id="flai-badge">2</span>
  </div>
  <div class="nav-it" id="n-more" onclick="showMore()">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>
    <span data-ru="Ещё" data-kz="Тағы">Ещё</span>
  </div>
</div>
<!-- ════════════ MODALS ════════════════════ -->
<!-- AUTH -->
<div class="overlay" id="m-auth" onclick="closeOvl(event,'m-auth')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div style="padding:0 17px 17px">
      <div class="tab-switcher">
        <div class="tsw on" id="at-in" onclick="authTab('in')" data-ru="Войти" data-kz="Кіру">Войти</div>
        <div class="tsw" id="at-up" onclick="authTab('up')" data-ru="Регистрация" data-kz="Тіркелу">Регистрация</div>
      </div>
      <div id="af-in">
        <div class="info-box warn"><span>💡</span><span id="tx-test-hint">Тест: <b>test@realtor.kz</b> / <b>demo123</b></span></div>
        <label class="flabel" id="tx-email-lbl">Email</label>
        <input class="finput" type="email" id="l-email" placeholder="you@mail.com" autocomplete="email">
        <label class="flabel" id="tx-pass-lbl">Пароль</label>
        <input class="finput" type="password" id="l-pass" placeholder="••••••••" autocomplete="current-password">
        <button class="btn-primary" onclick="doLogin()"><i class="fas fa-sign-in-alt"></i> <span id="tx-signin-btn">Войти</span></button>
        <button class="btn-secondary" onclick="authTab('up')" id="tx-no-acc">Нет аккаунта? Зарегистрироваться</button>
      </div>
      <div id="af-up" style="display:none">
        <div class="info-box"><span>🏠</span><span id="tx-reg-hint">Только для риэлторов — верифицированный статус сразу</span></div>
        <label class="flabel">ФИО</label>
        <input class="finput" type="text" id="r-name" placeholder="Айгерим Касымова">
        <label class="flabel">Email</label>
        <input class="finput" type="email" id="r-email" placeholder="you@mail.com">
        <label class="flabel">Телефон</label>
        <input class="finput" type="tel" id="r-phone" placeholder="+7 777 000 00 00">
        <label class="flabel">Агентство</label>
        <select class="finput" id="r-agency">
          <option value="">Выбрать...</option>
          <option>Самозанятый риэлтор</option><option>Century 21</option><option>Etagi</option><option>Royal Group</option><option>Другое</option>
        </select>
        <label class="flabel">Пароль</label>
        <input class="finput" type="password" id="r-pass" placeholder="Минимум 6 символов" autocomplete="new-password">
        <button class="btn-primary" onclick="doReg()"><i class="fas fa-user-plus"></i> <span id="tx-reg-btn">Зарегистрироваться</span></button>
        <button class="btn-secondary" onclick="authTab('in')" id="tx-have-acc">Уже есть аккаунт</button>
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
      <label class="flabel">Город</label>
      <select class="finput" id="a-city">
        <option>Астана</option><option>Алматы</option><option>Шымкент</option><option>Другой</option>
      </select>
      <label class="flabel">Район</label>
      <select class="finput" id="a-district">
        <option>Есиль</option><option>Алматинский</option><option>Сарыарка</option><option>Байконыр</option><option>Нура</option><option>Бостандыкский</option>
      </select>
      <label class="flabel">Цена ₸</label>
      <input class="finput" type="number" id="a-price" placeholder="85000000">
      <label class="flabel">Ссылка на YouTube-видео (необязательно)</label>
      <input class="finput" type="text" id="a-video" placeholder="https://youtube.com/watch?v=...">
      <div style="display:flex;align-items:center;gap:8px;background:var(--bg3);border-radius:10px;padding:10px 12px;border:1.5px solid var(--brd);margin-bottom:11px">
        <input type="checkbox" id="a-exch" style="width:17px;height:17px;accent-color:var(--orange)">
        <label for="a-exch" style="font-size:13px;font-weight:600;cursor:pointer;color:var(--t1)">🔄 Рассмотрим обмен <span class="ai-label">2026</span></label>
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
        <div style="border:2px dashed var(--brd2);border-radius:10px;padding:15px;text-align:center;cursor:pointer;background:var(--bg3)" onclick="uploadMedia('photo')">
          <div style="font-size:22px;margin-bottom:3px">📷</div><div style="font-size:11px;color:var(--t3)" id="tx-add-photo">Добавить фото</div>
        </div>
        <div style="border:2px dashed var(--brd2);border-radius:10px;padding:15px;text-align:center;cursor:pointer;background:var(--bg3)" onclick="uploadMedia('video')">
          <div style="font-size:22px;margin-bottom:3px">🎬</div><div style="font-size:11px;color:var(--t3)" id="tx-add-video">Добавить видео</div>
        </div>
      </div>
      <button class="btn-primary" onclick="submitListing()"><i class="fas fa-rocket"></i> <span id="tx-publish-btn">Опубликовать</span></button>
    </div>
  </div>
</div>
<!-- DETAIL -->
<div class="overlay" id="m-det" onclick="closeOvl(event,'m-det')">
  <div class="sheet" id="m-det-body"></div>
</div>
<!-- REALTOR PROFILE MODAL -->
<div class="overlay" id="m-realtor" onclick="closeOvl(event,'m-realtor')">
  <div class="sheet" id="m-realtor-body"></div>
</div>
<!-- HIRE REALTOR MODAL -->
<div class="overlay" id="m-hire" onclick="closeOvl(event,'m-hire')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div class="sh-title">Нанять риэлтора</div>
    <div class="sh-body" id="m-hire-body"></div>
  </div>
</div>
<!-- RATE REALTOR MODAL -->
<div class="overlay" id="m-rate" onclick="closeOvl(event,'m-rate')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div class="sh-title">Оставить отзыв</div>
    <div class="sh-body">
      <div class="stars-row" id="rate-stars">
        <span class="star-btn" onclick="setStar(1)">★</span>
        <span class="star-btn" onclick="setStar(2)">★</span>
        <span class="star-btn" onclick="setStar(3)">★</span>
        <span class="star-btn" onclick="setStar(4)">★</span>
        <span class="star-btn" onclick="setStar(5)">★</span>
      </div>
      <label class="flabel">Ваш отзыв</label>
      <textarea class="finput" id="rate-text" placeholder="Расскажите о работе риэлтора..."></textarea>
      <button class="btn-primary" onclick="submitRate()"><i class="fas fa-star"></i> Отправить отзыв</button>
    </div>
  </div>
</div>
<!-- EXCHANGE MODAL -->
<div class="overlay" id="m-exchange" onclick="closeOvl(event,'m-exchange')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div class="sh-title">🔄 Предложить обмен</div>
    <div class="sh-body" id="m-exchange-body"></div>
  </div>
</div>
<!-- MORE MENU -->
<div class="overlay" id="m-more" onclick="closeOvl(event,'m-more')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div class="sh-title" id="tx-menu-title">Меню</div>
    <div class="more-grid">
      <div class="more-item" onclick="closeM('m-more');go('s-aira');nav(null)">
        <div class="more-ico">💬</div><div class="more-name" data-ru="Aira" data-kz="Aira">Aira</div><div class="more-sub" data-ru="Чат риэлторов" data-kz="Риэлтор чаты">Чат риэлторов</div>
      </div>
      <div class="more-item" onclick="closeM('m-more');go('s-realtors');nav(null);renderRealtors()">
        <div class="more-ico">🏆</div><div class="more-name" data-ru="Риэлторы" data-kz="Риэлторлар">Риэлторы</div><div class="more-sub" data-ru="Рейтинг" data-kz="Рейтинг">Рейтинг</div>
      </div>
      <div class="more-item" onclick="closeM('m-more');go('s-cal');nav(null)">
        <div class="more-ico">📅</div><div class="more-name" data-ru="Календарь" data-kz="Күнтізбе">Календарь</div><div class="more-sub" data-ru="Расписание" data-kz="Кесте">Расписание</div>
      </div>
      <div class="more-item" onclick="closeM('m-more');go('s-prof');nav(null)">
        <div class="more-ico">👤</div><div class="more-name" data-ru="Профиль" data-kz="Профиль">Профиль</div><div class="more-sub" data-ru="Мой аккаунт" data-kz="Аккаунтым">Мой аккаунт</div>
      </div>
      <div class="more-item" onclick="closeM('m-more');go('s-notif');nav(null)">
        <div class="more-ico">🔔</div><div class="more-name" data-ru="Уведомления" data-kz="Хабарламалар">Уведомления</div><div class="more-sub" data-ru="3 новых" data-kz="3 жаңа">3 новых</div>
      </div>
      <div class="more-item" onclick="closeM('m-more');openM('m-add')">
        <div class="more-ico">🏠</div><div class="more-name" data-ru="Добавить" data-kz="Қосу">Добавить</div><div class="more-sub" data-ru="Новый объект" data-kz="Жаңа объект">Новый объект</div>
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
      <label class="flabel">Клиент / Контакт</label>
      <input class="finput" type="text" id="ev-client" placeholder="Имя клиента">
      <div class="form-row2">
        <div><label class="flabel">Дата</label><input class="finput" type="date" id="ev-date"></div>
        <div><label class="flabel">Время</label><input class="finput" type="time" id="ev-time"></div>
      </div>
      <label class="flabel">Заметка</label>
      <textarea class="finput" id="ev-note" placeholder="Взять ключи, документы..."></textarea>
      <div class="info-box warn"><span>🤖</span><span>Flai напомнит за 30 минут!</span></div>
      <button class="btn-primary" onclick="saveEv()">✅ Добавить событие</button>
    </div>
  </div>
</div>
<!-- TOAST -->
<div id="toast"></div>
<script src="/static/app.js"></script>
</div></div>
</body>
</html>`
}
export default app
