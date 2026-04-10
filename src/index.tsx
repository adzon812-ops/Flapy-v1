import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()
app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './' }))

app.get('/favicon.ico', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  return c.body('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#C97B5A"/><path d="M6 16L16 8l10 8v9H6z" fill="none" stroke="white" stroke-width="1.5"/><path d="M12 25v-7h8v7" fill="white"/></svg>')
})

// ─── API ROUTES (оставлены без изменений для стабильности) ───────────────────────
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
    { id:'r1', name:'Айгерим К.',  agency:'Century 21', rating:4.9, deals:47, reviews:23, phone:'+7 701 234 56 78', photo:'А', color:'#C97B5A', specialization:'Квартиры, новострой', experience:5, badge:'ТОП',  verified:true  },
    { id:'r2', name:'Данияр М.',   agency:'Etagi',      rating:4.7, deals:32, reviews:18, phone:'+7 702 345 67 89', photo:'Д', color:'#8A9A8B', specialization:'Дома, коттеджи',    experience:7, badge:'',     verified:true  },
    { id:'r3', name:'Сауле Т.',    agency:'Royal Group', rating:5.0, deals:68, reviews:41, phone:'+7 707 456 78 90', photo:'С',  color:'#6B8E23', specialization:'Коммерция',         experience:9, badge:'ТОП',  verified:true  },
    { id:'r4', name:'Нурлан А.',   agency:'Самозанятый',rating:4.6, deals:23, reviews:12, phone:'+7 705 567 89 01', photo:'Н', color:'#9B59B6', specialization:'Обмен, любые',      experience:3, badge:'',     verified:true  },
    { id:'r5', name:'Асель Б.',    agency:'Etagi',      rating:4.8, deals:38, reviews:19, phone:'+7 708 678 90 12', photo:'А', color:'#D4A76A', specialization:'Новострой',         experience:4, badge:'',     verified:true  },
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
    { id:1, title:'Показ квартиры 3к Есиль',   time:dt(0,10,0),   type:'showing', client:'Алия С.',       note:'Взять ключи от 401', color:'#D4A76A' },
    { id:2, title:'Звонок клиенту',             time:dt(0,14,30),  type:'call',    client:'Данияр М.',      note:'Обсудить ипотеку Halyk', color:'#6B8E23' },
    { id:3, title:'Подписание договора',        time:dt(1,11,0),   type:'deal',    client:'Нурсулу К.',     note:'Проверить документы ЦОН', color:'#8A9A8B' },
    { id:4, title:'Показ коммерции Байконыр',   time:dt(1,15,0),   type:'showing', client:'Бизнес-клиент',  note:'Взять план помещения', color:'#D4A76A' },
    { id:5, title:'Встреча в агентстве',        time:dt(2,10,0),   type:'meeting',  client:'Century 21',     note:'Новые объекты недели', color:'#9B59B6' },
  ]
}

// ─── MAIN HTML ────────────────────────────────────────────────
app.get('/', (c) => c.html(getHTML()))

function getHTML(): string {
return `<!DOCTYPE html>
<html lang="ru" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#FFF9F5">
<title>Flapy — Умный помощник по жилью</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<style>
:root {
  --bg: #FFF9F5; --bg2: #FFFFFF; --bg3: #F7F3ED;
  --accent: #C97B5A; --accent-soft: #D4A76A; --trust: #6B8E23;
  --t1: #3A3226; --t2: #7A6B5D; --t3: #9C8D7F;
  --brd: #E8D9C5; --brd2: #D8C8B8;
  --sh: 0 4px 20px rgba(138, 154, 139, 0.08);
  --sh2: 0 8px 32px rgba(138, 154, 139, 0.14);
  --glass: rgba(255,255,255,0.65); --glass-b: rgba(255,255,255,0.8);
  --nav-h: 56px; --bot-h: 72px; --r: 16px; --max: 480px;
}
[data-theme=dark] {
  --bg: #1A1614; --bg2: #221D1A; --bg3: #2A231F;
  --accent: #D4A76A; --t1: #F0EBE6; --t2: #B0A396; --t3: #7A6B5D;
  --brd: #3A3226; --glass: rgba(30,25,20,0.75); --glass-b: rgba(255,255,255,0.1);
  --sh: 0 4px 20px rgba(0,0,0,0.2);
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;background:var(--bg);font-family:'Inter',system-ui,sans-serif;color:var(--t1);overflow:hidden;-webkit-font-smoothing:antialiased}
body{background:linear-gradient(-45deg,#FFF9F5,#FFF3E6,#FFF9F5,#FFEFD9);background-size:400% 400%;animation:breathe 20s ease infinite}
@keyframes breathe{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
button{border:none;cursor:pointer;font-family:inherit;background:none;color:inherit}
input,textarea,select{font-family:inherit;outline:none;color:var(--t1);background:none}
::-webkit-scrollbar{width:0;height:0}

/* Welcome Animation */
#welcome-overlay{position:fixed;inset:0;z-index:9999;background:linear-gradient(180deg,#1A1614,#2A231F);display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;opacity:1;transition:opacity 0.6s}
#welcome-overlay.fade{opacity:0;pointer-events:none}
.w-star{width:48px;height:48px;fill:var(--accent);animation:wStar 2.5s cubic-bezier(0.2,0.8,0.2,1) forwards}
.w-text{font-size:18px;font-weight:700;color:var(--accent);opacity:0;margin-top:16px;animation:wText 2.5s 0.4s cubic-bezier(0.2,0.8,0.2,1) forwards}
@keyframes wStar{0%{transform:translateY(-100px) scale(0.7);opacity:0}100%{transform:translateY(10px) scale(1);opacity:1}}
@keyframes wText{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}

/* Layout */
#app-shell{position:fixed;inset:0;display:flex;justify-content:center;align-items:flex-start;background:#E0E0EC}
#app-wrap{position:relative;width:100%;max-width:var(--max);height:100%;background:var(--bg);overflow:hidden;box-shadow:0 0 60px rgba(0,0,0,0.12)}
@media(min-width:520px){#app-wrap{border-left:1px solid var(--brd);border-right:1px solid var(--brd)}}
#loader{position:absolute;inset:0;z-index:998;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;transition:opacity 0.4s}
.ld-bar{width:64px;height:3px;background:var(--brd);border-radius:2px;overflow:hidden;margin-top:8px}
.ld-fill{height:100%;background:var(--accent);width:0;animation:ldAnim 1.2s ease forwards}
@keyframes ldAnim{to{width:100%}}

/* Topbar */
#topbar{position:absolute;top:0;left:0;right:0;height:var(--nav-h);z-index:50;background:var(--glass);backdrop-filter:blur(12px);border-bottom:1px solid var(--glass-b);display:flex;align-items:center;padding:0 14px;gap:10px}
.logo{display:flex;align-items:center;gap:8px;flex:1}
.logo i{width:32px;height:32px;background:var(--accent);border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px}
.logo h1{font-size:18px;font-weight:800;color:var(--t1);letter-spacing:-0.5px}
.top-actions{display:flex;gap:8px;align-items:center}
.btn-glass{padding:8px 14px;border-radius:10px;background:var(--glass);backdrop-filter:blur(8px);border:1px solid var(--glass-b);font-size:12px;font-weight:700;color:var(--accent);cursor:pointer}

/* Main Area */
#main{position:absolute;top:var(--nav-h);bottom:var(--bot-h);left:0;right:0;overflow:hidden}
.scr{position:absolute;inset:0;overflow-y:auto;display:none;background:var(--bg)}
.scr.on{display:block;animation:fadeUp 0.25s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

/* Listings (Kaspi-style) */
.list-head{position:sticky;top:0;z-index:10;background:var(--glass);backdrop-filter:blur(10px);border-bottom:1px solid var(--brd);padding:12px 14px 8px}
.l-tabs{display:flex;border-bottom:1px solid var(--brd)}
.l-tab{flex:1;padding:10px 0;text-align:center;font-size:13px;font-weight:700;color:var(--t3);border-bottom:2.5px solid transparent}
.l-tab.on{color:var(--accent);border-color:var(--accent)}
.f-row{display:flex;gap:8px;overflow-x:auto;padding:10px 14px 4px}
.f-chip{padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid var(--brd2);color:var(--t2);background:none;white-space:nowrap}
.f-chip.on{background:var(--accent);color:#fff;border-color:var(--accent)}
.list-body{padding:12px 14px 20px}

.l-card{background:var(--bg2);border-radius:var(--r);box-shadow:var(--sh);margin-bottom:16px;overflow:hidden;border:1px solid var(--brd)}
.l-media{height:185px;position:relative;background:var(--bg3);display:flex;align-items:center;justify-content:center}
.l-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.l-badge{position:absolute;top:10px;right:10px;padding:4px 9px;border-radius:8px;font-size:11px;font-weight:700;color:#fff;background:var(--accent)}
.l-body{padding:12px 14px 14px}
.l-price{font-size:19px;font-weight:800;color:var(--t1);letter-spacing:-0.3px}
.l-sub{font-size:13px;color:var(--t2);margin-top:2px}
.l-realtor{display:flex;align-items:center;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--brd)}
.r-ava{width:24px;height:24px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff}
.r-name{font-size:12px;font-weight:600;color:var(--t2);flex:1}
.l-cta{display:flex;gap:8px;margin-top:10px}
.btn-cta{flex:1;padding:10px;border-radius:10px;font-size:12px;font-weight:700;text-align:center}
.btn-call{background:var(--accent);color:#fff}
.btn-msg{background:var(--bg3);color:var(--t1);border:1px solid var(--brd2)}

/* Bottom Nav */
#botbar{position:absolute;bottom:0;left:0;right:0;height:var(--bot-h);z-index:50;background:var(--glass);backdrop-filter:blur(16px);border-top:1px solid var(--glass-b);display:flex;align-items:center;justify-content:space-around;padding:0 6px 6px}
.nav-it{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;color:var(--t3);padding:6px 2px;border-radius:12px;transition:all 0.2s}
.nav-it i{font-size:20px;transition:transform 0.2s}
.nav-it span{font-size:9px;font-weight:700}
.nav-it.on{color:var(--accent)}
.nav-it.on i{transform:scale(1.15)}
.nav-plus{padding:12px 18px;border-radius:16px;background:var(--glass);backdrop-filter:blur(8px);border:1px solid var(--glass-b);display:flex;align-items:center;gap:6px;color:var(--accent);font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 4px 16px rgba(201,123,90,0.15)}
.nav-plus i{font-size:16px}

/* Modals */
.overlay{position:fixed;inset:0;z-index:200;background:rgba(30,20,15,0.4);backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity 0.2s;display:flex;align-items:flex-end;justify-content:center}
.overlay.on{opacity:1;pointer-events:auto}
.sheet{width:100%;max-height:88%;background:var(--bg2);border-radius:20px 20px 0 0;padding:16px;transform:translateY(20px);transition:transform 0.25s cubic-bezier(0.2,0.8,0.2,1)}
.overlay.on .sheet{transform:translateY(0)}
.sh-title{font-size:16px;font-weight:800;margin-bottom:12px;text-align:center}
.f-input{width:100%;padding:12px;border-radius:10px;background:var(--bg3);border:1px solid var(--brd);font-size:13px;margin-bottom:10px}
.btn-main{width:100%;padding:14px;border-radius:12px;background:var(--accent);color:#fff;font-weight:700;font-size:14px;margin-top:6px}

/* Utilities */
.toast{position:fixed;bottom:84px;left:50%;transform:translateX(-50%) translateY(8px);background:rgba(30,20,15,0.9);color:#fff;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;opacity:0;transition:all 0.25s;z-index:600}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
</style>
</head>
<body>
<!-- Welcome Overlay -->
<div id="welcome-overlay">
  <svg class="w-star" viewBox="0 0 24 24"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.8 5.6 21.2 8 14 2 9.2h7.6z"/></svg>
  <div class="w-text">Добро пожаловать домой</div>
</div>

<div id="app-shell">
  <div id="app-wrap">
    <div id="loader"><i class="fas fa-home" style="font-size:28px;color:var(--accent);margin-bottom:10px"></i><div class="ld-bar"><div class="ld-fill"></div></div></div>
    
    <div id="topbar">
      <div class="logo"><i class="fas fa-home"></i><h1>Flapy</h1></div>
      <div class="top-actions">
        <div class="btn-glass" onclick="setTheme()"><i class="fas fa-moon"></i></div>
        <div id="auth-slot" class="btn-glass" onclick="openAuth()">Войти</div>
      </div>
    </div>

    <div id="main">
      <!-- 🏠 Объекты -->
      <div id="s-search" class="scr on">
        <div class="list-head">
          <div class="l-tabs">
            <div class="l-tab on" onclick="setTab(this,'obj')">Поиск</div>
            <div class="l-tab" onclick="setTab(this,'exch')">Обмен</div>
          </div>
          <div class="f-row">
            <button class="f-chip on" onclick="setFilt(this,'all')">Все</button>
            <button class="f-chip" onclick="setFilt(this,'apartment')">Квартиры</button>
            <button class="f-chip" onclick="setFilt(this,'house')">Дома</button>
            <button class="f-chip" onclick="setFilt(this,'video')">🎬 Видео</button>
          </div>
        </div>
        <div class="list-body" id="list-body"></div>
      </div>
      
      <!-- 💬 Aira (скрыт до авторизации) -->
      <div id="s-aira" class="scr">
        <div style="padding:24px 16px;text-align:center;color:var(--t3)">
          <i class="fas fa-lock" style="font-size:32px;margin-bottom:10px;opacity:0.3"></i>
          <p>Чат Aira доступен для верифицированных риэлторов.<br><br><span class="btn-glass" onclick="openAuth()">Войти как риэлтор</span></p>
        </div>
      </div>
    </div>

    <div id="botbar">
      <div class="nav-it on" onclick="go('s-search',this)"><i class="fas fa-search"></i><span>Поиск</span></div>
      <div class="nav-it" onclick="go('s-aira',this)"><i class="fas fa-comments"></i><span>Aira</span></div>
      <div class="nav-plus" onclick="openAdd()">
        <i class="fas fa-pen"></i> Добавить
      </div>
      <div class="nav-it" onclick="go('s-profile',this)"><i class="fas fa-user"></i><span>Профиль</span></div>
      <div class="nav-it" onclick="go('s-more',this)"><i class="fas fa-ellipsis-h"></i><span>Ещё</span></div>
    </div>

    <!-- Модальные окна -->
    <div class="overlay" id="m-auth" onclick="closeIfBg(event,'m-auth')">
      <div class="sheet">
        <div class="sh-title">Вход в Flapy</div>
        <input class="f-input" placeholder="Email" id="l-email">
        <input class="f-input" type="password" placeholder="Пароль" id="l-pass">
        <button class="btn-main" onclick="doLogin()">Войти</button>
      </div>
    </div>
    
    <div class="overlay" id="m-add" onclick="closeIfBg(event,'m-add')">
      <div class="sheet">
        <div class="sh-title">Добавить объект</div>
        <select class="f-input" id="a-type"><option>Квартира</option><option>Дом</option><option>Коммерция</option></select>
        <div style="display:flex;gap:8px"><input class="f-input" placeholder="Площадь м²" id="a-area" type="number"><input class="f-input" placeholder="Цена ₸" id="a-price" type="number"></div>
        <input class="f-input" placeholder="Район" id="a-dist">
        <button class="btn-main" onclick="submitListing()">✨ Опубликовать</button>
      </div>
    </div>

    <div class="toast" id="toast"></div>
  </div>
</div>
<script src="/static/app.js"></script>
</body>
</html>`
}
export default app
