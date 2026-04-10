import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './' }))

// Favicon
app.get('/favicon.ico', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  return c.body(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1E2D5A"/><path d="M6 16L12 10l6 6v8H6z" fill="none" stroke="white" stroke-width="1.5"/><path d="M9 21V12h6v9" fill="white"/></svg>`)
})

// Legal Pages
app.get('/privacy', (c) => c.html(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Политика конфиденциальности — Flapy</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;max-width:680px;margin:0 auto;padding:20px;line-height:1.6;color:#1F2937}h1{color:#1E2D5A}a{color:#F97316}</style></head><body><h1>🔐 Политика конфиденциальности</h1><p><b>Flapy.kz</b> («мы») собирает минимальные данные для работы сервиса:</p><ul><li>Имя и контактные данные (только для риэлторов)</li><li>Фото/видео объектов (с вашего согласия)</li><li>Технические данные (браузер, устройство) для улучшения работы</li></ul><p><b>Мы не:</b></p><ul><li>Не продаём ваши данные третьим лицам</li><li>Не используем данные для рекламы без согласия</li><li>Не храним пароли в открытом виде</li></ul><p><b>Ваши права:</b></p><ul><li>Запросить удаление аккаунта в любой момент</li><li>Отказаться от рассылок</li><li>Получить копию ваших данных</li></ul><p>📧 Вопросы: <a href="mailto:privacy@flapy.kz">privacy@flapy.kz</a></p><p><small>© 2026 Flapy Team. Соответствует Закону РК «О персональных данных».</small></p></body></html>`))

app.get('/terms', (c) => c.html(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Пользовательское соглашение — Flapy</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:system-ui,sans-serif;max-width:680px;margin:0 auto;padding:20px;line-height:1.6;color:#1F2937}h1{color:#1E2D5A}a{color:#F97316}</style></head><body><h1>📜 Пользовательское соглашение</h1><p>Используя Flapy, вы соглашаетесь:</p><ol><li><b>Достоверность:</b> Размещать только правдивую информацию об объектах</li><li><b>Права:</b> Иметь право на публикацию размещаемого контента</li><li><b>Безопасность:</b> Не размещать мошеннические объявления</li><li><b>Уважение:</b> Не допускать дискриминацию, спам, оскорбления</li></ol><p><b>Модерация:</b></p><ul><li>Новые риэлторы: премодерация первых 3 объектов</li><li>Автоматическая проверка фото на личные данные</li><li>Ручная проверка жалоб в течение 24 часов</li></ul><p><b>Ответственность:</b></p><ul><li>За недостоверные данные — блокировка аккаунта</li><li>За мошенничество — передача данных в правоохранительные органы</li></ul><p><b>Flapy не является:</b></p><ul><li>Публичной офертой</li><li>Гарантом сделок между пользователями</li><li>Заменой юридической консультации</li></ul><p>📧 Вопросы: <a href="mailto:legal@flapy.kz">legal@flapy.kz</a></p><p><small>© 2026 Flapy Team. MIT License.</small></p></body></html>`))

// API: Listings
app.get('/api/listings', (c) => c.json({ listings: getMockListings() }))

// API: Realtors
app.get('/api/realtors', (c) => c.json({ realtors: getMockRealtors() }))

// API: AI Describe (mock — free)
app.post('/api/ai/describe', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  return c.json({ description: generateAIDesc(b) })
})

// API: Auth (mock — no DB needed for MVP)
app.post('/api/auth/register', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  return c.json({ 
    success: true, 
    user: { 
      id: 'u_'+Date.now(), 
      name: b.name, 
      email: b.email, 
      phone: b.phone, 
      agency: b.agency, 
      district: b.district,
      verified: true, 
      rating: 5.0, 
      deals: 0, 
      reviews: 0,
      tiktok: '',
      tiktokConnected: false
    } 
  })
})

app.post('/api/auth/login', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  const email = b.email || ''
  const demo = email.includes('test') || email.includes('demo')
  return c.json({ 
    success: true, 
    user: { 
      id: 'u1', 
      name: demo ? 'Айгерим Касымова' : 'Риэлтор', 
      email, 
      phone: '+7 701 234 56 78',
      agency: 'Century 21',
      district: 'Есиль',
      verified: true, 
      deals: 47, 
      rating: 4.9, 
      reviews: 23,
      tiktok: '',
      tiktokConnected: false
    } 
  })
})

// API: Calendar
app.get('/api/calendar', (c) => c.json({ events: getMockCalendar() }))

// API: Chat (mock responses)
app.post('/api/chat/flai', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  return c.json({ reply: getFlaiReply(b.message || '', b.lang || 'ru') })
})

app.post('/api/chat/aira', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  return c.json({ success: true, threadId: 'th_'+Date.now(), message: 'Опубликовано в Aira' })
})

// API: Exchange
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

// API: Report
app.post('/api/report', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  return c.json({ success: true, message: 'Жалоба принята' })
})

// ─── HELPERS ──────────────────────────────────────────────────
function generateAIDesc(o: any): string {
  const types: Record<string,string> = { apartment:'квартира', house:'дом', commercial:'коммерческое помещение', land:'участок' }
  const t = types[o.type] || 'объект'
  const ex = o.exchange ? '\n🔄 Рассмотрим обмен — отличная возможность для оптимизации налогов!' : ''
  const p = o.price ? (Number(o.price)/1e6).toFixed(1)+' млн ₸' : 'по договору'
  const features = ['Развитая инфраструктура', 'Рядом транспорт', 'Ухоженный двор', 'Консьерж']
  const feat = features.slice(0,2).join(' · ')
  return `✨ ${o.rooms ? o.rooms+'-комнатная ' : ''}${t}${o.area ? ', '+o.area+' м²' : ''} в ${o.district||'Астане'}!

🏆 ${feat}
💰 Цена: ${p}${ex}

📍 ${o.district||'Есиль'}, ${o.city||'Астана'}
📞 Звоните — покажу в любое удобное время!`
}

function getMockRealtors() {
  return [
    { id:'r1', name:'Айгерим Касымова', agency:'Century 21', rating:4.9, deals:47, reviews:23, phone:'+7 701 234 56 78', photo:'А', color:'#1E2D5A', specialization:'Квартиры, новострой', experience:5, verified:true, tiktok:'@aigerim_kz' },
    { id:'r2', name:'Данияр Мусин', agency:'Etagi', rating:4.7, deals:32, reviews:18, phone:'+7 702 345 67 89', photo:'Д', color:'#F47B20', specialization:'Дома, коттеджи', experience:7, verified:true, tiktok:'@daniyar_homes' },
    { id:'r3', name:'Сауле Тлеубекова', agency:'Royal Group', rating:5.0, deals:68, reviews:41, phone:'+7 707 456 78 90', photo:'С', color:'#27AE60', specialization:'Коммерция', experience:9, verified:true, tiktok:'@saule_commercial' },
  ]
}

function getMockListings() {
  return [
    { id:1, type:'apartment', rooms:3, area:85, district:'Есильский', city:'Астана', price:62000000, exchange:false, hasVideo:true, videoId:'tgbNymZ7vqY', realtor:'Данияр М.', realtorId:'r2', realtorFull:'Данияр Мусин', rating:4.7, deals:32, agency:'Etagi', tags:['Горящее'], badge:'Горящее', desc:'Отличная 3-комнатная в новом ЖК. Полная отделка, вид на парк.', photos:['🛋️','','🌇'], tiktok:'@realtor_astana' },
    { id:2, type:'house', rooms:5, area:220, district:'Алматинский', city:'Астана', price:150000000, exchange:true, hasVideo:true, videoId:'UxxajLWwzqY', realtor:'Сауле Т.', realtorId:'r3', realtorFull:'Сауле Тлеубекова', rating:5.0, deals:68, agency:'Royal Group', tags:['Обмен'], badge:'Обмен', desc:'Дом с участком 10 соток. Гараж на 2 машины, баня. Рассмотрим обмен!', photos:['🏡','🌳','🏊'], tiktok:'@saule_realty' },
    { id:3, type:'apartment', rooms:2, area:65, district:'Сарыарка', city:'Астана', price:38000000, exchange:true, hasVideo:false, videoId:'', realtor:'Айгерим К.', realtorId:'r1', realtorFull:'Айгерим Касымова', rating:4.9, deals:47, agency:'Century 21', tags:['Обмен'], badge:'Обмен', desc:'Уютная 2-комнатная в тихом дворе. Рядом школа, детский сад.', photos:['🛋️','🚿'], tiktok:'' },
  ]
}

function getMockCalendar() {
  const t = new Date()
  const dt = (d:number,h:number,m:number) => new Date(t.getFullYear(),t.getMonth(),t.getDate()+d,h,m).toISOString()
  return [
    { id:1, title:'Показ квартиры 3к Есиль', time:dt(0,10,0), type:'showing', client:'Алия С.', note:'Взять ключи от 401', color:'#F47B20' },
    { id:2, title:'Звонок клиенту', time:dt(0,14,30), type:'call', client:'Данияр М.', note:'Обсудить ипотеку Halyk', color:'#27AE60' },
  ]
}

function getFlaiReply(msg: string, lang: string): string {
  const m = msg.toLowerCase()
  const kz = lang === 'kz'
  if (m.includes('обмен') || m.includes('айырбас'))
    return kz ? '🔄 Айырбас 2026 жылы тиімді! Салықтан босату мерзімі — 2 жыл. Риэлторды байланыстырайын!' : '🔄 Обмен актуален в 2026! Новые правила: освобождение от налога — 2 года. Хотите подобрать вариант обмена?'
  if (m.includes('ипотека') || m.includes('несие') || m.includes('кредит'))
    return kz ? '🏦 Отбасы Банк, Halyk Bank, Jusan Bank-пен жұмыс істейміз. Ставка жылдық 5%-дан. Нақты объект бойынша есептеп берейін?' : '🏦 Работаем с Отбасы Банк, Halyk Bank, Jusan Bank. Ставки от 5% годовых. Рассчитать ипотеку по конкретному объекту?'
  if (m.includes('цена') || m.includes('баға') || m.includes('сколько') || m.includes('стоимость'))
    return kz ? '💰 Баға ауданға, ауданына және жай-күйіне байланысты. Есіл районда 1к — 28 млн-нан. Нақты баға беруді қалайсыз ба?' : '💰 Цена зависит от района, площади и состояния. В Есиле 1к от 28 млн ₸. Хотите оценку конкретного объекта?'
  if (m.includes('налог') || m.includes('салық'))
    return kz ? '💡 2026 жылдан: салықсыз мерзім — 2 жыл. Мерзімінен бұрын сатқанда 10–15%. Айырбас — үнемдеудің тиімді жолы!' : '💡 С 2026 года: срок без налога — 2 года. При продаже раньше — 10–15%. Обмен — выгодная альтернатива!'
  if (m.includes('привет') || m.includes('сәлем') || m.includes('здравствуй'))
    return kz ? '👋 Сәлем! Мен — көмекшіңіз. Пәтер табуға, ипотека есептеуге көмектесемін!' : '👋 Привет! Чем могу помочь? Спросите про ипотеку, цены или обмен.'
  return kz ? '😊 Жақсы сұрақ! Риэлтор жақын арада жауап береді.' : '😊 Хороший вопрос! Чем ещё могу помочь? Спросите про ипотеку, цены или организуйте показ.'
}

// Main HTML
app.get('/', (c) => c.html(getHTML()))

function getHTML(): string {
return `<!DOCTYPE html>
<html lang="ru" data-theme="light" data-lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#F97316">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>Flapy™ — Умный помощник по жилью</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<link href="/static/style.css" rel="stylesheet">
</head>
<body>
<div id="app-shell"><div id="app-wrap">
<!-- LOADER -->
<div id="loader">
  <div class="ld-icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg></div>
  <div class="ld-name">Flapy<span class="ld-tm">™</span></div>
  <div class="ld-sub" id="ld-sub">Ваш умный помощник на рынке жилья</div>
  <div class="ld-bar-wrap"><div class="ld-bar"></div></div>
</div>

<!-- TOPBAR -->
<div id="topbar">
  <div class="logo-row" onclick="go('s-search');nav(document.getElementById('n-search'))">
    <div class="logo-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2.2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg></div>
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
<!-- OBJECTS -->
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

<!-- FEED (TikTok) -->
<div id="s-feed" class="scr"></div>

<!-- AIRA CHAT -->
<div id="s-aira" class="scr">
  <div class="chat-wrap">
    <div class="chat-header">
      <div class="ch-ava aira" style="font-size:13px;font-weight:900">A</div>
      <div style="flex:1">
        <div class="ch-name">Aira <span style="font-size:12px;font-weight:500;color:var(--t2)">— Чат коллег</span></div>
        <div class="ch-status" style="color:var(--orange)">47 риэлторов онлайн</div>
      </div>
      <div id="aira-status-badge" style="background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:var(--orange);font-weight:600">🔒 Войдите</div>
    </div>
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
              <div class="th-name">Айгерим К. <span class="th-time">10 мин</span></div>
              <div class="th-prev">🏠 Объект: 3к Есиль — ищу покупателя 🤝</div>
            </div>
            <i class="fas fa-chevron-down" style="color:var(--t3);font-size:11px;transition:transform .2s"></i>
          </div>
          <div class="th-body">
            <div class="prop-tag"><i class="fas fa-home"></i> 3к · 85м² · 62 млн · Есиль</div>
            <p style="font-size:12px;color:var(--t2);margin-bottom:8px">Клиент готов к ипотеке Halyk Bank. Комиссию делим 50/50 🤝 Срочно!</p>
            <div style="font-size:12px;color:var(--green);margin-bottom:8px">✓ Данияр М.: Есть покупатель! Пишу в личку</div>
            <div style="display:flex;gap:6px">
              <button onclick="replyAira(this)" style="padding:5px 10px;border-radius:7px;background:var(--navy);color:#fff;font-size:11px;font-weight:600;cursor:pointer">💬 Ответить</button>
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

<!-- CALENDAR -->
<div id="s-cal" class="scr"><div class="cal-wrap" id="cal-body"></div></div>

<!-- PROFILE -->
<div id="s-prof" class="scr"><div class="prof-wrap" id="prof-body"></div></div>

<!-- NOTIFICATIONS -->
<div id="s-notif" class="scr"><div class="notif-wrap" id="notif-body"></div></div>

<!-- SETTINGS -->
<div id="s-settings" class="scr"><div class="settings-wrap" id="settings-body"></div></div>
</div>

<!-- BOTTOM NAV -->
<div id="botbar">
  <div class="nav-it on" id="n-search" onclick="go('s-search');nav(this)">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
    <span data-ru="Объекты" data-kz="Объект">Объекты</span>
  </div>
  <div class="nav-it" id="n-feed" onclick="go('s-feed');nav(this)">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="9" height="9" rx="2"/><rect x="13" y="2" width="9" height="9" rx="2"/><rect x="2" y="13" width="9" height="9" rx="2"/><rect x="13" y="13" width="9" height="9" rx="2"/></svg>
    <span data-ru="Лента" data-kz="Лента">Лента</span>
  </div>
  <div class="nav-plus-wrap">
    <div class="nav-plus" onclick="curUser?openAddListing():openM('m-auth')">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </div>
  </div>
  <div class="nav-it" id="n-aira" onclick="go('s-aira');nav(this)">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
    <span>Aira</span>
  </div>
  <div class="nav-it" id="n-more" onclick="showMore()">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>
    <span data-ru="Ещё" data-kz="Тағы">Ещё</span>
  </div>
</div>

<!-- MODALS -->
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
        <label class="flabel">Район работы</label>
        <select class="finput" id="r-district">
          <option>Есиль</option><option>Алматинский</option><option>Сарыарка</option><option>Байконыр</option><option>Другой</option>
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
        <option>Есиль</option><option>Алматинский</option><option>Сарыарка</option><option>Байконыр</option><option>Нура</option>
      </select>
      <label class="flabel">Цена ₸</label>
      <input class="finput" type="number" id="a-price" placeholder="85000000">
      <label class="flabel">Ссылка на видео (YouTube или TikTok)</label>
      <input class="finput" type="text" id="a-video" placeholder="https://youtube.com/watch?v=... или @username">
      <div style="display:flex;align-items:center;gap:8px;background:var(--bg3);border-radius:10px;padding:10px 12px;border:1.5px solid var(--brd);margin-bottom:11px">
        <input type="checkbox" id="a-exch" style="width:17px;height:17px;accent-color:var(--orange)">
        <label for="a-exch" style="font-size:13px;font-weight:600;cursor:pointer;color:var(--t1)" onclick="document.getElementById('a-exch-details').style.display=this.checked?'block':'none'">🔄 Рассмотрю обмен <span class="ai-label">2026</span></label>
      </div>
      <div id="a-exch-details" style="display:none;background:var(--bg3);border-radius:10px;padding:12px;margin-bottom:11px">
        <label class="flabel">Что интересует в обмен</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
          <label style="font-size:12px"><input type="checkbox" value="apartment"> Квартира</label>
          <label style="font-size:12px"><input type="checkbox" value="house"> Дом</label>
          <label style="font-size:12px"><input type="checkbox" value="commercial"> Коммерция</label>
        </div>
        <label class="flabel">Доплата</label>
        <select class="finput" style="margin-bottom:8px">
          <option>Готов доплатить</option><option>Рассмотрю доплату</option><option>Только равноценный</option>
        </select>
        <label class="flabel">Комментарий для риэлторов</label>
        <textarea class="finput" placeholder="Пример: 'Рассмотрю обмен на 2-комн. в Есильском с доплатой'"></textarea>
      </div>
      <label class="flabel">Описание <span class="ai-label"><i class="fas fa-magic"></i> AI</span></label>
      <textarea class="finput" id="a-desc" placeholder="Опишите объект или нажмите AI..."></textarea>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:12px 0">
        <div style="border:2px dashed var(--brd2);border-radius:10px;padding:15px;text-align:center;cursor:pointer;background:var(--bg3)" onclick="uploadMedia('photo')">
          <div style="font-size:22px;margin-bottom:3px">📷</div><div style="font-size:11px;color:var(--t3)" id="tx-add-photo">Добавить фото</div>
        </div>
        <div style="border:2px dashed var(--brd2);border-radius:10px;padding:15px;text-align:center;cursor:pointer;background:var(--bg3)" onclick="uploadMedia('video')">
          <div style="font-size:22px;margin-bottom:3px">🎬</div><div style="font-size:11px;color:var(--t3)" id="tx-add-video">Добавить видео</div>
        </div>
      </div>
      <p style="font-size:11px;color:var(--t3);text-align:center;margin:8px 0">💡 Эта информация видна только риэлторам. Покупатели видят только бейдж «🔄 Обмен».</p>
      <button class="btn-primary" onclick="submitListing()"><i class="fas fa-rocket"></i> <span id="tx-publish-btn">Опубликовать</span></button>
      <p style="font-size:10px;color:var(--t3);text-align:center;margin-top:12px">💙 Публикуя объект, вы подтверждаете: вы имеете право на размещение, информация достоверна, мы вместе создаём безопасное пространство</p>
    </div>
  </div>
</div>

<!-- DETAIL -->
<div class="overlay" id="m-det" onclick="closeOvl(event,'m-det')">
  <div class="sheet" id="m-det-body"></div>
</div>

<!-- EXCHANGE -->
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
    <div id="m-more-body"></div>
  </div>
</div>

<!-- SETTINGS MODAL -->
<div class="overlay" id="m-settings" onclick="closeOvl(event,'m-settings')">
  <div class="sheet" id="settings-body"></div>
</div>

<!-- TOAST -->
<div id="toast"></div>

<script src="/static/app.js"></script>
</div></div>
</body>
</html>`
}

export default app
