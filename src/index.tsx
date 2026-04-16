import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()
app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './' }))

app.get('/favicon.ico', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  return c.body('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1E2D5A"/><path d="M6 16L12 10l6 6v12H6z" fill="none" stroke="white" stroke-width="2"/><path d="M13 28V18h6v10" fill="white"/></svg>')
})

app.get('/', (c) => c.html(getHTML()))

function getHTML(): string {
return `<!DOCTYPE html>
<html lang="ru" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Flapy™ — Умный помощник по жилью</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
:root{--white:#FFFFFF;--bg:#F5F5F7;--bg2:#FFFFFF;--bg3:#F0F0F5;--navy:#667eea;--navy2:#764ba2;--orange:#f093fb;--green:#27AE60;--red:#E74C3C;--t1:#1A1A2E;--t2:#6B7280;--t3:#9CA3AF;--brd:#E5E7EB;--brd2:#D1D5DB;--nav-h:56px;--bot-h:64px;--r:14px;--max:480px}
[data-theme=dark]{--bg:#1a1a2e;--bg2:#252540;--bg3:#2d2d4a;--t1:#e8e8f0;--t2:#b8b8d0;--t3:#8888a0;--brd:rgba(255,255,255,0.08);--navy:#667eea;--orange:#f093fb}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;background:var(--bg);font-family:'Inter',-apple-system,sans-serif;color:var(--t1);overflow:hidden}
button{border:none;cursor:pointer;font-family:inherit;background:none;color:inherit}
input,textarea,select{font-family:inherit;outline:none;color:var(--t1);background:none}
::-webkit-scrollbar{width:0;height:0}
#app-shell{position:fixed;inset:0;display:flex;justify-content:center;align-items:flex-start;background:#E0E0EC}
[data-theme=dark]#app-shell{background:#08080F}
#app-wrap{position:relative;width:100%;max-width:var(--max);height:100%;background:var(--bg);overflow:hidden;box-shadow:0 0 60px rgba(0,0,0,.12)}
@media(min-width:520px){#app-wrap{border-left:1px solid var(--brd);border-right:1px solid var(--brd)}}
#loader{position:absolute;inset:0;z-index:999;background:var(--bg2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;transition:opacity .3s}
.ld-icon{width:52px;height:52px;background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(102,126,234,.25)}
.ld-name{font-size:30px;font-weight:900;color:var(--navy);letter-spacing:-1px}
[data-theme=dark].ld-name{color:#fff}
.ld-tm{font-size:10px;color:var(--orange);vertical-align:super;font-weight:700}
.ld-sub{font-size:13px;color:var(--t3)}
.ld-bar-wrap{width:72px;height:3px;background:var(--bg3);border-radius:2px;overflow:hidden;margin-top:4px}
.ld-bar{height:100%;background:linear-gradient(90deg,var(--navy),var(--orange));border-radius:2px;animation:ldA 1.4s ease forwards}
@keyframes ldA{from{width:0}to{width:100%}}
#topbar{position:absolute;top:0;left:0;right:0;height:var(--nav-h);z-index:50;background:var(--bg2);border-bottom:1px solid var(--brd);display:flex;align-items:center;justify-content:space-between;padding:0 16px}
.logo{display:flex;align-items:center;gap:8px;font-size:20px;font-weight:900;color:var(--navy)}
.logo i{font-size:22px}
.theme-btn{width:36px;height:36px;border-radius:10px;background:var(--bg3);border:1px solid var(--brd);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s}
.theme-btn:hover{background:var(--navy);color:#fff}
.login-btn{padding:8px 20px;border-radius:10px;background:var(--navy);color:#fff;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
.login-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(102,126,234,0.4)}
#main{position:absolute;top:var(--nav-h);bottom:var(--bot-h);left:0;right:0;overflow:hidden}
.scr{position:absolute;inset:0;overflow-y:auto;display:none;-webkit-overflow-scrolling:touch;background:var(--bg)}
.scr.on{display:block}
.list-header{position:sticky;top:0;z-index:10;background:var(--bg2);border-bottom:1px solid var(--brd);padding:16px}
.tagline{font-size:13px;color:var(--t3);margin-bottom:12px;font-style:italic}
.tab-row{display:flex;gap:12px;margin-bottom:12px;border-bottom:2px solid var(--brd);padding-bottom:2px}
.tab-item{flex:1;padding:10px 0;text-align:center;font-size:14px;font-weight:600;color:var(--t3);border-bottom:2.5px solid transparent;cursor:pointer;transition:all .15s;margin-bottom:-2px}
.tab-item.on{color:var(--navy);border-color:var(--navy);font-weight:700}
.filter-row{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}
.fchip{flex-shrink:0;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid var(--brd2);color:var(--t2);background:none;transition:all .15s;white-space:nowrap}
.fchip.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.list-body{padding:16px}
.lcard{background:var(--bg2);border-radius:16px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.08);margin-bottom:20px;transition:all .3s;cursor:pointer}
.lcard:hover{transform:translateY(-4px);box-shadow:0 8px 25px rgba(0,0,0,0.12)}
.lcard-media{position:relative;height:200px;background:linear-gradient(135deg,#f0f0f5,#e0e0e8);overflow:hidden}
[data-theme=dark].lcard-media{background:linear-gradient(135deg,#2d2d4a,#252540)}
.lcard-body{padding:16px}
.lcard-price{font-size:22px;font-weight:800;margin-bottom:6px;color:var(--t1)}
.lcard-sub{font-size:14px;color:var(--t2);margin-bottom:10px}
.lcard-desc{font-size:13px;line-height:1.6;color:var(--t1);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:14px;opacity:0.9}
.lcard-cta{display:flex;gap:10px}
.cta-btn{flex:1;padding:11px;border-radius:10px;font-weight:600;cursor:pointer;font-size:13px;border:none;box-shadow:0 3px 10px rgba(0,0,0,0.15)}
.cta-call{background:linear-gradient(135deg,#27AE60,#2ECC71);color:#fff}
.cta-msg{background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff}
#botbar{position:absolute;bottom:0;left:0;right:0;height:var(--bot-h);z-index:50;background:var(--bg2);border-top:1px solid var(--brd);display:flex;align-items:center;justify-content:space-around;padding:0 8px}
.nav-it{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;color:var(--t3);padding:8px 2px;border-radius:10px;transition:color .15s;font-size:11px}
.nav-it i{font-size:20px}
.nav-it.on{color:var(--navy);font-weight:600}
.nav-plus{width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 4px 16px rgba(102,126,234,.3);cursor:pointer;transition:transform .15s}
.nav-plus:active{transform:scale(0.95)}
.overlay{position:absolute;inset:0;z-index:200;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .22s}
.overlay.on{opacity:1;pointer-events:all}
.sheet{width:100%;max-width:var(--max);max-height:92%;background:var(--bg2);border-radius:24px 24px 0 0;overflow-y:auto;padding:20px;transform:translateY(16px);transition:transform .22s}
.overlay.on .sheet{transform:translateY(0)}
.sh-handle{width:40px;height:4px;border-radius:2px;background:var(--brd2);margin:0 auto 20px}
.sh-title{text-align:center;font-size:20px;font-weight:800;margin-bottom:8px}
.sh-subtitle{text-align:center;font-size:13px;color:var(--t2);margin-bottom:24px;font-style:italic}
.tab-switcher{display:flex;background:var(--bg3);border-radius:12px;padding:4px;margin-bottom:20px}
.tsw{flex:1;padding:10px;border-radius:8px;font-size:13px;font-weight:700;color:var(--t3);cursor:pointer;text-align:center;transition:all .15s}
.tsw.on{background:var(--navy);color:#fff}
.flabel{font-size:11px;font-weight:600;color:var(--t3);margin-bottom:6px;display:block;text-transform:uppercase;letter-spacing:0.5px}
.finput{width:100%;padding:12px 14px;border-radius:12px;background:var(--bg3);border:1.5px solid var(--brd);font-size:14px;margin-bottom:16px;color:var(--t1);transition:border-color .15s}
.finput:focus{border-color:var(--navy);outline:none}
.btn-primary{width:100%;padding:14px;border-radius:12px;background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;border:none;margin-top:8px}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(102,126,234,0.4)}
.btn-secondary{width:100%;padding:12px;border-radius:12px;background:var(--bg3);border:1.5px solid var(--brd);font-size:13px;font-weight:600;margin-top:12px;color:var(--t1);cursor:pointer;transition:all .15s}
.btn-secondary:hover{background:var(--navy);color:#fff}
#toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,var(--navy),var(--navy2));color:#fff;padding:14px 28px;border-radius:14px;z-index:10000;opacity:0;transition:all 0.3s;font-weight:600;box-shadow:0 8px 30px rgba(102,126,234,0.4);font-size:14px;pointer-events:none}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.empty{text-align:center;padding:80px 20px;color:var(--t3)}
.empty-ico{font-size:56px;margin-bottom:16px;animation:pulse 3s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
</style>
</head>
<body>
<div id="app-shell"><div id="app-wrap">

<!-- LOADER -->
<div id="loader">
  <div class="ld-icon"><i class="fas fa-home" style="color:white;font-size:24px"></i></div>
  <div class="ld-name">Flapy<span class="ld-tm">™</span></div>
  <div class="ld-sub">Ваш умный помощник на рынке жилья</div>
  <div class="ld-bar-wrap"><div class="ld-bar"></div></div>
</div>

<!-- TOPBAR -->
<div id="topbar">
  <div class="logo"><i class="fas fa-home"></i> Flapy<span style="font-size:10px;color:var(--orange);vertical-align:super">™</span></div>
  <div style="display:flex;gap:10px;align-items:center">
    <div class="theme-btn" onclick="toggleTheme()"><i class="fas fa-moon"></i></div>
    <button class="login-btn" id="auth-btn" onclick="openM('m-auth')">Войти</button>
  </div>
</div>

<!-- MAIN -->
<div id="main">
  <!-- OBJECTS -->
  <div id="s-search" class="scr on">
    <div class="list-header">
      <div class="tagline" id="tagline">Ваш умный помощник на рынке жилья</div>
      <div class="tab-row">
        <div class="tab-item on" id="tab-obj" onclick="setListTab('obj')">Объекты</div>
        <div class="tab-item" id="tab-exch" onclick="setListTab('exch')">🔄 Обмен</div>
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
  
  <!-- AIRA CHAT -->
  <div id="s-aira" class="scr">
    <div style="padding:20px;text-align:center;color:var(--t3)">
      <div style="font-size:56px;margin-bottom:16px">💬</div>
      <div style="font-size:18px;font-weight:700;margin-bottom:8px">Чат друзей</div>
      <div style="font-size:13px">Здесь общаются риэлторы с душой</div>
    </div>
  </div>
</div>

<!-- BOTTOM NAV -->
<div id="botbar">
  <div class="nav-it on" id="n-objects" onclick="go('s-search');nav(this)">
    <i class="fas fa-home"></i>
    <span>Объекты</span>
  </div>
  <div class="nav-plus" onclick="openM('m-add')">
    <i class="fas fa-plus"></i>
  </div>
  <div class="nav-it" id="n-aira" onclick="go('s-aira');nav(this)">
    <i class="fas fa-comments"></i>
    <span>Aira</span>
  </div>
</div>

<!-- AUTH MODAL -->
<div class="overlay" id="m-auth" onclick="closeOvl(event,'m-auth')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div class="sh-title">🏡 Добро пожаловать домой</div>
    <div class="sh-subtitle">Здесь вас ждут с любовью 💙</div>
    
    <div class="tab-switcher">
      <div class="tsw on" id="at-in" onclick="authTab('in')">🔐 Войти</div>
      <div class="tsw" id="at-up" onclick="authTab('up')">💝 Присоединиться</div>
    </div>
    
    <!-- LOGIN -->
    <div id="af-in">
      <label class="flabel">Email</label>
      <input class="finput" type="email" id="l-email" placeholder="your@email.com">
      <label class="flabel">Пароль</label>
      <input class="finput" type="password" id="l-pass" placeholder="••••••••">
      <button class="btn-primary" onclick="doLogin()">🏠 Вернуться домой</button>
      <button class="btn-secondary" onclick="authTab('up')">Нет аккаунта? Присоединиться</button>
      <div style="margin-top:16px;font-size:12px;color:var(--t2);text-align:center">С возвращением, друг 💙</div>
    </div>
    
    <!-- REGISTER -->
    <div id="af-up" style="display:none">
      <label class="flabel">Ваше имя 💙</label>
      <input class="finput" type="text" id="r-name" placeholder="Как к вам обращаться?">
      <label class="flabel">Email</label>
      <input class="finput" type="email" id="r-email" placeholder="your@email.com">
      <label class="flabel">Телефон (необязательно)</label>
      <input class="finput" type="tel" id="r-phone" placeholder="+7 777 123 45 67">
      <label class="flabel">Пароль</label>
      <input class="finput" type="password" id="r-pass" placeholder="Придумайте надёжный">
      <button class="btn-primary" onclick="doRegister()" style="background:linear-gradient(135deg,#27AE60,#2ECC71)">💝 Стать частью семьи</button>
      <button class="btn-secondary" onclick="authTab('in')">Уже есть аккаунт? Войти</button>
      <div style="margin-top:16px;font-size:12px;color:var(--t2);text-align:center">Мы рады вам! Регистрация займёт секунду 🌿</div>
    </div>
  </div>
</div>

<!-- ADD LISTING MODAL -->
<div class="overlay" id="m-add" onclick="closeOvl(event,'m-add')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div class="sh-title">✨ Добавить объект</div>
    <div class="sh-subtitle">Расскажите о доме с любовью 💙</div>
    
    <label class="flabel">Тип объекта</label>
    <select class="finput" id="a-type">
      <option value="apartment">🏢 Квартира</option>
      <option value="house">🏡 Дом</option>
      <option value="commercial">🏪 Коммерция</option>
    </select>
    
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div>
        <label class="flabel">Комнаты</label>
        <select class="finput" id="a-rooms">
          <option>1</option><option>2</option><option selected>3</option><option>4</option><option>5+</option>
        </select>
      </div>
      <div>
        <label class="flabel">Площадь м²</label>
        <input class="finput" type="number" id="a-area" placeholder="85">
      </div>
    </div>
    
    <label class="flabel">Город</label>
    <select class="finput" id="a-city">
      <option>Астана</option><option>Алматы</option><option>Шымкент</option><option>Другой</option>
    </select>
    
    <label class="flabel">Район</label>
    <select class="finput" id="a-district">
      <option>Есиль</option><option>Алматинский</option><option>Сарыарка</option><option>Байконыр</option><option>Другой</option>
    </select>
    
    <label class="flabel">Цена ₸</label>
    <input class="finput" type="text" id="a-price" placeholder="78 500 000">
    
    <label class="flabel">Описание *</label>
    <textarea class="finput" id="a-desc" rows="4" placeholder="Расскажите о доме с любовью..."></textarea>
    
    <div style="background:var(--bg3);border-radius:12px;padding:14px;margin:16px 0">
      <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
        <input type="checkbox" id="a-exchange" style="width:18px;height:18px;accent-color:var(--green)">
        <div style="flex:1">
          <div style="font-weight:600;font-size:13px;color:var(--t1)">🔄 Рассмотрим обмен</div>
          <div style="font-size:11px;color:var(--t2)">Показывать во вкладке "Обмен"</div>
        </div>
      </label>
    </div>
    
    <div style="border:2px dashed var(--brd2);border-radius:12px;padding:20px;text-align:center;cursor:pointer;background:var(--bg3);margin-bottom:16px" onclick="uploadMedia()">
      <div style="font-size:32px;margin-bottom:8px">📷</div>
      <div style="font-size:12px;color:var(--t2)">Нажмите чтобы добавить фото</div>
    </div>
    
    <button class="btn-primary" onclick="submitListing()">✨ Опубликовать с любовью</button>
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
