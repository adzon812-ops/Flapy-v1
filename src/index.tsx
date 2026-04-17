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

// API Routes
app.get('/api/listings', (c) => c.json({ listings: [] }))
app.post('/api/ai/describe', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  return c.json({ description: 'AI описание' })
})
app.post('/api/auth/login', async (c) => c.json({ success: true }))
app.post('/api/chat/aira', async (c) => c.json({ success: true }))

app.get('/', (c) => c.html(getHTML()))

function getHTML(): string {
return `<!DOCTYPE html>
<html lang="ru" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Flapy™ — Умный помощник по жилью</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<style>
:root{--white:#FFFFFF;--bg:#F5F5F7;--bg2:#FFFFFF;--bg3:#F0F0F5;--navy:#1E2D5A;--navy2:#2E4A85;--orange:#F47B20;--orange2:#FF9A3C;--green:#27AE60;--red:#E74C3C;--t1:#1A1A2E;--t2:#6B7280;--t3:#9CA3AF;--brd:#E5E7EB;--brd2:#D1D5DB;--sh:0 1px 4px rgba(0,0,0,.06),0 2px 10px rgba(0,0,0,.05);--nav-h:56px;--bot-h:64px;--r:14px;--max:480px}
[data-theme=dark]{--bg:#0F0F1A;--bg2:#161626;--bg3:#1E1E35;--t1:#F0F0FF;--t2:#9090C0;--t3:#5A5A80;--brd:rgba(255,255,255,.1)}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;background:var(--bg);font-family:'Inter',-apple-system,sans-serif;color:var(--t1);overflow:hidden}
button{border:none;cursor:pointer;font-family:inherit;background:none;color:inherit}
input,textarea,select{font-family:inherit;outline:none;color:var(--t1);background:none}
#app-shell{position:fixed;inset:0;display:flex;justify-content:center;background:#E0E0EC}
#app-wrap{position:relative;width:100%;max-width:var(--max);height:100%;background:var(--bg);overflow:hidden}
#loader{position:absolute;inset:0;z-index:999;background:var(--bg2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
.ld-icon{width:52px;height:52px;background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:14px;display:flex;align-items:center;justify-content:center}
.ld-name{font-size:30px;font-weight:900;color:var(--navy)}
.ld-sub{font-size:13px;color:var(--t3)}
.ld-bar-wrap{width:72px;height:3px;background:var(--bg3);border-radius:2px;overflow:hidden}
.ld-bar{height:100%;background:linear-gradient(90deg,var(--navy),var(--orange));animation:ldA 1.4s ease forwards}
@keyframes ldA{from{width:0}to{width:100%}}
#topbar{position:absolute;top:0;left:0;right:0;height:var(--nav-h);z-index:50;background:var(--bg2);border-bottom:1px solid var(--brd);display:flex;align-items:center;padding:0 14px;gap:10px}
.logo-row{display:flex;align-items:center;gap:8px;flex:1}
.logo-icon{width:32px;height:32px;background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:9px;display:flex;align-items:center;justify-content:center}
.logo-txt{font-size:18px;font-weight:900;color:var(--navy)}
.login-btn{padding:0 13px;height:30px;border-radius:8px;background:var(--navy);color:#fff;font-size:12px;font-weight:700}
.u-chip{display:flex;align-items:center;gap:6px;cursor:pointer}
.u-ava{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--navy2));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff}
.u-nm{font-size:12px;font-weight:700}
#main{position:absolute;top:var(--nav-h);bottom:var(--bot-h);left:0;right:0;overflow:hidden}
.scr{position:absolute;inset:0;overflow-y:auto;display:none}
.scr.on{display:block}
.list-header{position:sticky;top:0;z-index:10;background:var(--bg2);border-bottom:1px solid var(--brd)}
.lh-top{padding:10px 14px 0}
.lh-tagline{font-size:12px;color:var(--t3);margin-bottom:6px}
.tab-row{display:flex;border-bottom:1px solid var(--brd)}
.tab-item{flex:1;padding:10px 0;text-align:center;font-size:14px;font-weight:600;color:var(--t3);border-bottom:2.5px solid transparent;cursor:pointer}
.tab-item.on{color:var(--navy);border-color:var(--navy);font-weight:700}
.filter-row{display:flex;gap:6px;overflow-x:auto;padding:9px 14px}
.fchip{flex-shrink:0;padding:5px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid var(--brd2);color:var(--t2)}
.fchip.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.list-body{padding:10px 12px 12px}
.lcard{background:var(--bg2);border-radius:var(--r);box-shadow:var(--sh);margin-bottom:12px;overflow:hidden;cursor:pointer;border:1px solid var(--brd)}
.lcard-media{position:relative;height:185px;background:linear-gradient(135deg,#EEF0F6,#E0E3EE);display:flex;align-items:center;justify-content:center}
.lcard-em{font-size:64px;opacity:.22}
.lcard-badge{position:absolute;top:10px;right:10px;padding:3px 9px;border-radius:7px;font-size:11px;font-weight:700;color:#fff;background:var(--orange)}
.lcard-body{padding:11px 13px 13px}
.lcard-loc{font-size:12px;color:var(--t3);display:flex;align-items:center;gap:4px;margin-bottom:5px}
.lcard-price{font-size:20px;font-weight:800;margin-bottom:2px}
.lcard-sub{font-size:13px;color:var(--t2);margin-bottom:9px}
.lcard-footer{display:flex;align-items:center;gap:8px;padding-top:9px;border-top:1px solid var(--brd)}
.lf-ava{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;background:var(--navy)}
.lf-name{font-size:11px;font-weight:600;color:var(--t2);flex:1}
.lcard-cta{display:flex;gap:7px;margin-top:9px}
.cta-btn{flex:1;padding:9px 6px;border-radius:10px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:5px;cursor:pointer}
.cta-call{background:var(--navy);color:#fff}
.cta-msg{background:var(--bg3);color:var(--t1);border:1px solid var(--brd2)}
.chat-wrap{display:flex;flex-direction:column;height:100%}
.chat-header{flex-shrink:0;background:var(--bg2);border-bottom:1px solid var(--brd);padding:10px 14px;display:flex;align-items:center;gap:10px}
.ch-ava{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff;background:linear-gradient(135deg,var(--orange),var(--orange2))}
.ch-name{font-size:15px;font-weight:700}
.chat-body{flex:1;overflow-y:auto;padding:16px;background:#e5ddd5}
.msg{display:flex;gap:7px;max-width:85%;margin-bottom:12px}
.msg.me{align-self:flex-end;flex-direction:row-reverse}
.bubble{padding:10px 14px;border-radius:14px;font-size:14.5px;line-height:1.45}
.msg.me .bubble{background:var(--navy);color:#fff;border-radius:14px 4px 14px 14px}
.msg:not(.me) .bubble{background:#fff;color:var(--t1);border-radius:4px 14px 14px 14px}
.m-ts{font-size:11px;color:var(--t3);margin-top:6px;text-align:right}
.chat-input-row{flex-shrink:0;display:flex;align-items:flex-end;gap:10px;padding:10px 16px;background:var(--bg2);border-top:1px solid var(--brd)}
.ci{flex:1;min-height:40px;max-height:88px;padding:12px 18px;border-radius:24px;border:1.5px solid var(--brd2);background:#fff;font-size:14px;resize:none}
.send-btn{width:48px;height:48px;border-radius:50%;background:var(--orange);color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer}
.prof-wrap{padding:13px}
.prof-hero{background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:16px;padding:18px;margin-bottom:14px}
.ph-ava{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:9px}
.ph-name{font-size:17px;font-weight:800;color:#fff}
.menu-item{display:flex;align-items:center;gap:11px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:12px;margin-bottom:7px;cursor:pointer}
.menu-ico{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px}
.menu-name{font-size:13px;font-weight:600}
#botbar{position:absolute;bottom:0;left:0;right:0;height:var(--bot-h);z-index:50;background:var(--bg2);border-top:1px solid var(--brd);display:flex;align-items:center;padding:0 8px 6px}
.nav-it{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:var(--t3);padding:6px 2px;border-radius:10px}
.nav-it span{font-size:9px;font-weight:700}
.nav-it.on{color:var(--navy)}
.nav-plus-wrap{flex-shrink:0;padding:0 6px}
.nav-plus{width:48px;height:48px;border-radius:14px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer}
.overlay{position:absolute;inset:0;z-index:200;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .22s}
.overlay.on{opacity:1;pointer-events:all}
.sheet{width:100%;max-height:92%;background:var(--bg2);border-radius:20px 20px 0 0;overflow-y:auto;padding-bottom:20px}
.sh-handle{width:32px;height:4px;border-radius:2px;background:var(--brd2);margin:10px auto 12px}
.sh-title{font-size:17px;font-weight:800;padding:0 17px 12px}
.sh-body{padding:0 17px}
.flabel{font-size:11px;font-weight:600;color:var(--t3);margin-bottom:4px;display:block}
.finput{width:100%;padding:10px 13px;border-radius:10px;background:var(--bg3);border:1.5px solid var(--brd);font-size:13px;margin-bottom:11px;color:var(--t1)}
.form-row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.btn-primary{width:100%;padding:13px;border-radius:12px;background:var(--navy);color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
.btn-secondary{width:100%;padding:11px;border-radius:12px;background:var(--bg3);border:1.5px solid var(--brd);font-size:13px;font-weight:600;margin-top:8px;cursor:pointer}
.btn-outline{width:100%;padding:11px;border-radius:11px;background:none;border:1.5px solid var(--navy);color:var(--navy);font-size:13px;font-weight:600;margin-top:7px;cursor:pointer}
.tab-switcher{display:flex;background:var(--bg3);border-radius:10px;padding:3px;margin-bottom:14px}
.tsw{flex:1;padding:7px;border-radius:7px;font-size:13px;font-weight:700;color:var(--t3);cursor:pointer;text-align:center}
.tsw.on{background:var(--navy);color:#fff}
.info-box{display:flex;align-items:flex-start;gap:7px;background:rgba(39,174,96,.07);border:1px solid rgba(39,174,96,.2);border-radius:10px;padding:9px 11px;margin-bottom:11px;font-size:12px}
.ai-label{display:inline-flex;align-items:center;gap:3px;background:rgba(244,123,32,.12);border-radius:5px;padding:1px 7px;font-size:10px;font-weight:700;color:var(--orange)}
.ai-variants{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.ai-variant{padding:10px;border:1.5px solid var(--brd);border-radius:10px;cursor:pointer;background:var(--bg3);transition:all .15s}
.ai-variant:hover{border-color:var(--orange)}
.ai-variant.selected{border-color:var(--green);background:rgba(39,174,96,.05)}
.det-visual{height:200px;position:relative;background:linear-gradient(135deg,#EEF0F6,#E0E3EE);display:flex;align-items:center;justify-content:center}
.det-em-bg{font-size:80px;opacity:.25}
.det-price{font-size:23px;font-weight:900;padding:8px 17px 4px}
.det-cta{display:flex;gap:8px;padding:0 17px 17px}
.det-btn{flex:1;padding:12px;border-radius:12px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
.det-call{background:var(--green)}
.det-chat{background:var(--navy)}
.more-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:0 17px 17px}
.more-item{background:var(--bg2);border:1px solid var(--brd);border-radius:14px;padding:16px;cursor:pointer;text-align:center}
.more-ico{font-size:28px;margin-bottom:5px}
.more-name{font-size:12px;font-weight:700}
.more-sub{font-size:10px;color:var(--t3);margin-top:2px}
.empty{text-align:center;padding:52px 20px}
.empty-ico{font-size:44px;opacity:.25;margin-bottom:9px}
.empty-t{font-size:15px;font-weight:700;margin-bottom:4px}
.empty-s{font-size:12px;color:var(--t3)}
#toast{position:absolute;bottom:78px;left:50%;transform:translateX(-50%);background:rgba(30,45,90,.9);color:#fff;border-radius:10px;padding:9px 16px;font-size:12px;font-weight:600;z-index:600;opacity:0;transition:opacity .2s}
#toast.show{opacity:1}
.admin-only{display:none}
[data-admin="true"] .admin-only{display:block}
</style>
</head>
<body>
<div id="app-shell"><div id="app-wrap">

<div id="loader">
  <div class="ld-icon">🏠</div>
  <div class="ld-name">Flapy™</div>
  <div class="ld-sub">Место, где недвижимость находит людей с душой 🤍</div>
  <div class="ld-bar-wrap"><div class="ld-bar"></div></div>
</div>

<div id="topbar">
  <div class="logo-row">
    <div class="logo-icon">🏠</div>
    <div class="logo-txt">Flapy™</div>
  </div>
  <div id="auth-slot"><button class="login-btn" onclick="openM('m-auth')">Войти</button></div>
</div>

<div id="main">
<div id="s-search" class="scr on">
  <div class="list-header">
    <div class="lh-top">
      <div class="lh-tagline">Место, где каждый найдёт свой дом с заботой 🤍</div>
      <div class="tab-row">
        <div class="tab-item on" onclick="setListTab('obj')">Объекты</div>
        <div class="tab-item" onclick="setListTab('exch')">Обмен</div>
      </div>
    </div>
    <div class="filter-row">
      <div class="fchip on" onclick="setFilt(this,'all')">Все</div>
      <div class="fchip" onclick="setFilt(this,'apartment')">Квартиры</div>
      <div class="fchip" onclick="setFilt(this,'house')">Дома</div>
      <div class="fchip" onclick="setFilt(this,'commercial')">Коммерция</div>
    </div>
  </div>
  <div class="list-body" id="list-body"></div>
</div>

<div id="s-aira" class="scr">
  <div class="chat-wrap">
    <div class="chat-header">
      <div class="ch-ava">A</div>
      <div style="flex:1">
        <div class="ch-name">Aira</div>
        <div style="font-size:11px;color:var(--t3)">Чат риэлторов — место поддержки и идей 💬</div>
      </div>
    </div>
    <div class="chat-body" id="aira-msgs"></div>
    <div class="chat-input-row">
      <textarea class="ci" id="aira-inp" rows="1" placeholder="Напишите сообщение с душой..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendAira()}"></textarea>
      <button class="send-btn" onclick="sendAira()">📨</button>
    </div>
  </div>
</div>

<div id="s-prof" class="scr"><div class="prof-wrap" id="prof-body"></div></div>
</div>

<div id="botbar">
  <div class="nav-it on" onclick="go('s-search');nav(this)">
    <div style="font-size:20px">🏠</div>
    <span>Объекты</span>
  </div>
  <div class="nav-it" onclick="go('s-aira');nav(this)">
    <div style="font-size:20px">💬</div>
    <span>Aira</span>
  </div>
  <div class="nav-plus-wrap">
    <div class="nav-plus" onclick="needAuth(() => openAddListing())">+</div>
  </div>
  <div class="nav-it" onclick="needAuth(() => showMore());nav(this)">
    <div style="font-size:20px">⋯</div>
    <span>Ещё</span>
  </div>
</div>

<!-- AUTH MODAL -->
<div class="overlay" id="m-auth" onclick="closeOvl(event,'m-auth')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div style="padding:0 17px 17px">
      <div class="tab-switcher">
        <div class="tsw on" onclick="authTab('in')">Войти</div>
        <div class="tsw" onclick="authTab('up')">Регистрация</div>
      </div>
      <div id="af-in">
        <div class="info-box">💡 <span>Вход нужен, чтобы сохранять объекты в облаке и общаться в Aira</span></div>
        <label class="flabel">Email</label>
        <input class="finput" type="email" id="l-email" placeholder="you@mail.com">
        <label class="flabel">Пароль</label>
        <input class="finput" type="password" id="l-pass" placeholder="••••••••">
        <button class="btn-primary" onclick="doLogin()">🤍 Войти</button>
        <button class="btn-secondary" onclick="authTab('up')">Нет аккаунта? Создать с любовью</button>
      </div>
      <div id="af-up" style="display:none">
        <div class="info-box">🏠 <span>Добро пожаловать в семью Flapy — здесь ценят каждого</span></div>
        <label class="flabel">ФИО</label>
        <input class="finput" type="text" id="r-name" placeholder="Имя Фамилия">
        <label class="flabel">Email</label>
        <input class="finput" type="email" id="r-email" placeholder="you@mail.com">
        <label class="flabel">Телефон</label>
        <input class="finput" type="tel" id="r-phone" placeholder="+7 777 000 00 00">
        <label class="flabel">Агентство</label>
        <select class="finput" id="r-agency">
          <option>Самозанятый риэлтор</option>
          <option>Century 21</option>
          <option>Etagi</option>
          <option>Другое</option>
        </select>
        <label class="flabel">Пароль</label>
        <input class="finput" type="password" id="r-pass" placeholder="Минимум 6 символов">
        <button class="btn-primary" onclick="doReg()">✨ Присоединиться к семье</button>
        <button class="btn-secondary" onclick="authTab('in')">Уже есть аккаунт</button>
      </div>
    </div>
  </div>
</div>

<!-- ADD LISTING MODAL -->
<div class="overlay" id="m-add" onclick="closeOvl(event,'m-add')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div class="sh-title">Добавить объект <span class="ai-label">✨ AI</span></div>
    <div class="sh-body">
      <label class="flabel">Тип объекта</label>
      <select class="finput" id="a-type">
        <option value="apartment">🏢 Квартира</option>
        <option value="house">🏡 Дом</option>
        <option value="commercial">🏪 Коммерция</option>
      </select>
      
      <div class="form-row2">
        <div><label class="flabel">Комнаты</label><select class="finput" id="a-rooms"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5+</option></select></div>
        <div><label class="flabel">Площадь м²</label><input class="finput" type="number" id="a-area" placeholder="85"></div>
      </div>
      
      <div class="form-row2">
        <div><label class="flabel">Этаж</label><input class="finput" type="number" id="a-floor" placeholder="5"></div>
        <div><label class="flabel">Этажность</label><input class="finput" type="number" id="a-total-floors" placeholder="9"></div>
      </div>
      
      <label class="flabel">Название ЖК</label>
      <input class="finput" type="text" id="a-building" placeholder="Например: Нурлы Тау">
      
      <label class="flabel">Высота потолков (м)</label>
      <input class="finput" type="number" step="0.1" id="a-ceiling" placeholder="2.7">
      
      <label class="flabel">Город</label>
      <select class="finput" id="a-city" disabled>
        <option value="Астана" selected>Астана</option>
      </select>
      
      <label class="flabel">Район Астаны</label>
      <select class="finput" id="a-district">
        <option value="">Выбрать район...</option>
        <option>Есиль</option>
        <option>Алматинский</option>
        <option>Сарыарка</option>
        <option>Байконыр</option>
        <option>Нура</option>
      </select>
      
      <label class="flabel">Цена ₸</label>
      <input class="finput" type="text" id="a-price" placeholder="10 000 000" oninput="formatPriceInput(this)">
      
      <div style="display:flex;align-items:center;gap:8px;margin:12px 0;padding:10px;background:rgba(39,174,96,.08);border:1.5px solid rgba(39,174,96,.25);border-radius:10px">
        <input type="checkbox" id="a-exchange" style="width:18px;height:18px;accent-color:var(--green)">
        <label for="a-exchange" style="font-size:13px;font-weight:600;cursor:pointer">🔄 Рассмотрю обмен</label>
      </div>
      
      <label class="flabel">Описание <span class="ai-label">✨ AI</span></label>
      <textarea class="finput" id="a-desc" placeholder="Расскажите об объекте так, как рассказали бы другу 🤍" rows="3"></textarea>
      
      <button class="btn-outline" onclick="genAI()">✨ Сгенерировать описание с ИИ (3 варианта)</button>
      
      <div id="ai-variants-wrap" style="display:none"></div>
      
      <button class="btn-primary" onclick="submitListing()"> Опубликовать с любовью</button>
    </div>
  </div>
</div>

<!-- DETAIL MODAL -->
<div class="overlay" id="m-det" onclick="closeOvl(event,'m-det')">
  <div class="sheet" id="m-det-body"></div>
</div>

<!-- MORE MENU -->
<div class="overlay" id="m-more" onclick="closeOvl(event,'m-more')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div class="sh-title">Меню</div>
    <div class="more-grid">
      <div class="more-item" onclick="closeM('m-more');go('s-aira')">
        <div class="more-ico">💬</div>
        <div class="more-name">Aira</div>
        <div class="more-sub">Чат риэлторов</div>
      </div>
      <div class="more-item" onclick="closeM('m-more');go('s-prof')">
        <div class="more-ico">👤</div>
        <div class="more-name">Профиль</div>
        <div class="more-sub">Мой аккаунт</div>
      </div>
      <div class="more-item admin-only" onclick="closeM('m-more');toast('🔐 Админ-панель')">
        <div class="more-ico">⚙️</div>
        <div class="more-name">Админ</div>
        <div class="more-sub">Управление</div>
      </div>
    </div>
  </div>
</div>

<div id="toast"></div>
<script src="/static/app.js"></script>
</div></div>
</body>
</html>`
}

export default app
