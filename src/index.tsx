import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()
app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './' }))

app.get('/favicon.ico', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  return c.body('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1E2D5A"/><path d="M6 16L16 8l10 8v9H6z" fill="none" stroke="white" stroke-width="1.5"/><path d="M9 21V12h6v9" fill="white"/></svg>')
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
  return c.json({ success: true, user: { id: 'u1', name: demo ? 'Айгерим Касымова' : 'Риэлтор', email, verified: true, deals: 47, rating: 4.9, agency: 'Century 21', reviews: 23 } })
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
  const p = o.price ? (Number(o.price)/1e6).toFixed(1)+' млн ₸' : ' по договору'
  const features = ['Развитая инфраструктура', 'Рядом транспорт', 'Ухоженный двор', 'Консьерж']
  const feat = features.slice(0,2).join(' · ')
  return `✨ ${o.rooms ? o.rooms+'-комнатная ' : ''}${t}${o.area ? ', '+o.area+' м²' : ''} в ${o.district ||'Астане'}!\n\n🏆 ${feat}\n💰 Цена: ${p}${ex}\n\n📍 ${o.district ||'Есиль'}, ${o.city ||'Астана'}\n📞 Звоните — покажу в любое удобное время!`
}

function getMockRealtors() {
  return [
    { id:'r1', name:'Айгерим Касымова', agency:'Century 21', rating:4.9, deals:47, reviews:23, phone:'+7 701 234 56 78', photo:'А', color:'#1E2D5A', specialization:'Квартиры, новострой', experience:5, badge:'ТОП', verified:true },
    { id:'r2', name:'Данияр Мусин', agency:'Etagi', rating:4.7, deals:32, reviews:18, phone:'+7 702 345 67 89', photo:'Д', color:'#F47B20', specialization:'Дома, коттеджи', experience:7, badge:'', verified:true },
    { id:'r3', name:'Сауле Тлеубекова', agency:'Royal Group', rating:5.0, deals:68, reviews:41, phone:'+7 707 456 78 90', photo:'С', color:'#27AE60', specialization:'Коммерция', experience:9, badge:'ТОП', verified:true },
    { id:'r4', name:'Нурлан Ахметов', agency:'Самозанятый', rating:4.6, deals:23, reviews:12, phone:'+7 705 567 89 01', photo:'Н', color:'#9B59B6', specialization:'Обмен, любые', experience:3, badge:'', verified:true },
    { id:'r5', name:'Асель Бекова', agency:'Etagi', rating:4.8, deals:38, reviews:19, phone:'+7 708 678 90 12', photo:'А', color:'#E67E22', specialization:'Новострой', experience:4, badge:'', verified:true },
  ]
}

function getMockListings() {
  return [
    { id:1, type:'apartment', rooms:3, area:85, district:'Бостандыкский', city:'Алматы', price:78500000, exchange:false, hasVideo:true, videoId:'ScMzIvxBSi4', videoTitle:'Обзор 3к квартиры', realtor:'Айгерим К.', realtorId:'r1', realtorFull:'Айгерим Касымова', rating:4.9, deals:47, agency:'Century 21', tags:['Новострой'], badge:'Новое', desc:'Просторная 3-комнатная с панорамным видом. Свежий ремонт евро-класса, подземный паркинг, охраняемый ЖК.', photos:['🛋️','🛁','🪟','🏗️'] },
    { id:2, type:'apartment', rooms:3, area:82, district:'Есильский', city:'Астана', price:62000000, exchange:false, hasVideo:true, videoId:'tgbNymZ7vqY', videoTitle:'Видео-тур 3к', realtor:'Данияр М.', realtorId:'r2', realtorFull:'Данияр Мусин', rating:4.7, deals:32, agency:'Etagi', tags:['Горящее'], badge:'Горящее', desc:'Отличная 3-комнатная в новом ЖК. Полная отделка, вид на парк, детская площадка во дворе.', photos:['🛋️','🚿','🌇'] },
    { id:3, type:'house', rooms:5, area:220, district:'Алматинский', city:'Астана', price:150000000, exchange:true, hasVideo:true, videoId:'UxxajLWwzqY', videoTitle:'Видео-тур дома', realtor:'Сауле Т.', realtorId:'r3', realtorFull:'Сауле Тлеубекова', rating:5.0, deals:68, agency:'Royal Group', tags:['Обмен'], badge:'Обмен', desc:'Дом с участком 10 соток. Гараж на 2 машины, баня, летняя кухня. Рассмотрим обмен на квартиру!', photos:['🏡','🌳','🏊','🔥'] },
    { id:4, type:'commercial', rooms:0, area:120, district:'Байконыр', city:'Астана', price:65000000, exchange:false, hasVideo:false, videoId:'', videoTitle:'', realtor:'Нурлан А.', realtorId:'r4', realtorFull:'Нурлан Ахметов', rating:4.6, deals:23, agency:'Самозанятый', tags:['Инвест'], badge:'Топ', desc:'Помещение первой линии, высокий трафик 5000 чел/день. Идеально под ресторан, аптеку, офис.', photos:['🏪','📐','🔌'] },
    { id:5, type:'apartment', rooms:2, area:65, district:'Сарыарка', city:'Астана', price:38000000, exchange:true, hasVideo:false, videoId:'', videoTitle:'', realtor:'Айгерим К.', realtorId:'r1', realtorFull:'Айгерим Касымова', rating:4.9, deals:47, agency:'Century 21', tags:['Обмен'], badge:'Обмен', desc:'Уютная 2-комнатная в тихом дворе. Рядом школа, детский сад, магазины. Рассмотрим обмен!', photos:['🛋️','🚿'] },
    { id:6, type:'apartment', rooms:1, area:42, district:'Есиль', city:'Астана', price:29000000, exchange:false, hasVideo:true, videoId:'jNQXAC9IVRw', videoTitle:'Студия видео-тур', realtor:'Данияр М.', realtorId:'r2', realtorFull:'Данияр Мусин', rating:4.7, deals:32, agency:'Etagi', tags:['Студия'], badge:'Новое', desc:'Стильная студия со смарт-дизайном. Встроенная кухня, системы умного дома, вид на ночной город.', photos:['🛋️','🌃'] },
  ]
}

function getMockCalendar() {
  const t = new Date()
  const dt = (d:number,h:number,m:number) => new Date(t.getFullYear(),t.getMonth(),t.getDate()+d,h,m).toISOString()
  return [
    { id:1, title:'Показ квартиры 3к Есиль', time:dt(0,10,0), type:'showing', client:'Алия С.', note:'Взять ключи от 401', color:'#F47B20' },
    { id:2, title:'Звонок клиенту', time:dt(0,14,30), type:'call', client:'Данияр М.', note:'Обсудить ипотеку Halyk', color:'#27AE60' },
    { id:3, title:'Подписание договора', time:dt(1,11,0), type:'deal', client:'Нурсулу К.', note:'Проверить документы ЦОН', color:'#1E2D5A' },
    { id:4, title:'Показ коммерции Байконыр', time:dt(1,15,0), type:'showing', client:'Бизнес-клиент', note:'Взять план помещения', color:'#F47B20' },
    { id:5, title:'Встреча в агентстве', time:dt(2,10,0), type:'meeting', client:'Century 21', note:'Новые объекты недели', color:'#9B59B6' },
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
<link href="/static/style.css" rel="stylesheet">
</head>
<body>
<!-- SPLASH SCREEN -->
<div id="splash-screen">
  <div class="splash-content">
    <div class="splash-logo">
      <svg class="splash-house" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path class="house-roof" d="M10 40 L50 10 L90 40"/>
        <rect class="house-body" x="20" y="40" width="60" height="50" rx="4"/>
        <rect class="window window-1" x="30" y="50" width="12" height="12" rx="2"/>
        <rect class="window window-2" x="58" y="50" width="12" height="12" rx="2"/>
        <rect class="window window-3" x="44" y="70" width="12" height="12" rx="2"/>
        <rect class="door" x="42" y="75" width="16" height="15" rx="2"/>
      </svg>
    </div>
    <h1 class="splash-title">Flapy</h1>
    <p class="splash-subtitle">Добро пожаловать домой</p>
    <div class="loading-dots">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  </div>
</div>
<!-- SPLASH SCREEN -->
<div id="splash-screen">
  <div class="splash-content">
    <div class="splash-logo">
      <svg class="splash-house" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path class="house-roof" d="M10 40 L50 10 L90 40"/>
        <rect class="house-body" x="20" y="40" width="60" height="50" rx="4"/>
        <rect class="window window-1" x="30" y="50" width="12" height="12" rx="2"/>
        <rect class="window window-2" x="58" y="50" width="12" height="12" rx="2"/>
        <rect class="window window-3" x="44" y="70" width="12" height="12" rx="2"/>
        <rect class="door" x="42" y="75" width="16" height="15" rx="2"/>
        <circle class="chimney-smoke" cx="70" cy="30" r="3"/>
      </svg>
    </div>
    <h1 class="splash-title">Flapy</h1>
    <p class="splash-subtitle">Добро пожаловать домой</p>
    <div class="loading-dots">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  </div>
</div>

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
        <div class="tab-item on" id="tab-obj" onclick="setListTab('obj')" data-ru="Объекты" data-kz="Объектілер">Объекты</div>
        <div class="tab-item" id="tab-exch" onclick="setListTab('exch')" data-ru="Обмен" data-kz="Айырбас">Обмен</div>
      </div>
    </div>
    <div class="filter-row" id="filter-row">
      <div class="fchip on" onclick="setFilt(this,'all')" data-ru="Все" data-kz="Барлығы">Все</div>
      <div class="fchip" onclick="setFilt(this,'apartment')" data-ru="Квартиры" data-kz="Пәтерлер">Квартиры</div>
      <div class="fchip" onclick="setFilt(this,'house')" data-ru="Дома" data-kz="Үйлер">Дома</div>
      <div class="fchip" onclick="setFilt(this,'commercial')" data-ru="Коммерция" data-kz="Коммерция">Коммерция</div>
      <div class="fchip" onclick="setFilt(this,'video')" data-ru="🎬 Видео" data-kz="🎬 Бейне">🎬 Видео</div>
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
        <div class="ch-name">Flai<span style="font-size:11px;font-weight:500;color:var(--t2)" id="tx-flai-sub">— умный помощник</span></div>
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
        <div class="ch-name">Aira<span style="font-size:12px;font-weight:500;color:var(--t2)" id="tx-aira-sub">— Чат риэлторов</span></div>
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
            <div class="prop-tag"><i class="fas fa-home"></i> 3к · 85м² · 85 млн · Есиль</div>
            <p style="font-size:12px;color:var(--t2);margin-bottom:8px">Клиент готов к ипотеке Halyk Bank. Комиссию делим 50/50 🤝 Срочно!</p>
            <div style="font-size:12px;color:var(--green);margin-bottom:8px">✓ Данияр М.: Есть покупатель! Пишу в личку</div>
            <div style="display:flex;gap:6px">
              <button onclick="replyThread(this,'r1','Айгерим К.')" style="padding:5px 10px;border-radius:7px;background:var(--navy);color:#fff;font-size:11px;font-weight:600;cursor:pointer">💬 Ответить</button>
              <button onclick="callRealtor('+7 701 234 56 78')" style="padding:5px 10px;border-radius:7px;background:var(--bg3);color:var(--t1);font-size:11px;font-weight:600;cursor:pointer;border:1px solid var(--brd2)">📞 Позвонить</button>
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
