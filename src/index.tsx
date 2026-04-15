import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()
app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './' }))

app.get('/favicon.ico', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  return c.body('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1E2D5A"/><path d="M6 16L16 8l10 8v9H6z" fill="none" stroke="white" stroke-width="1.5"/><path d="M9 21v-5h6v5" fill="white"/></svg>')
})

// API Routes
app.get('/api/listings', (c) => c.json({ listings: [] }))
app.post('/api/auth/register', async (c) => c.json({ success: true }))
app.post('/api/auth/login', async (c) => c.json({ success: true }))

app.get('/', (c) => c.html(getHTML()))

function getHTML(): string {
return `<!DOCTYPE html>
<html lang="ru" data-theme="light" data-lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<meta name="theme-color" content="#1E2D5A">
<title>Flapy™ — Добро пожаловать домой</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
:root{--white:#FFFFFF;--bg:#F8F6F3;--bg2:#FFFFFF;--bg3:#F0EDE8;--navy:#1E2D5A;--navy2:#2E4A85;--orange:#F47B20;--orange2:#FF9A3C;--green:#27AE60;--red:#E74C3C;--t1:#2D3748;--t2:#6B7280;--t3:#9CA3AF;--brd:#E5E7EB;--nav-h:60px;--bot-h:64px}
[data-theme=dark]{--bg:#0F0F1A;--bg2:#161626;--bg3:#1E1E35;--t1:#F0F0FF;--t2:#9090C0;--t3:#5A5A80;--brd:rgba(255,255,255,.1)}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;background:var(--bg);font-family:'Inter',-apple-system,sans-serif;color:var(--t1);overflow:hidden}
button{border:none;cursor:pointer;font-family:inherit;background:none;color:inherit}
input,textarea,select{font-family:inherit;outline:none;color:var(--t1);background:none}
::-webkit-scrollbar{width:0;height:0}
#app-shell{position:fixed;inset:0;display:flex;justify-content:center;align-items:flex-start;background:var(--bg)}
#app-wrap{position:relative;width:100%;max-width:480px;height:100%;background:var(--bg);overflow:hidden}
@media(min-width:520px){#app-wrap{border-left:1px solid var(--brd);border-right:1px solid var(--brd)}}
#loader{position:absolute;inset:0;z-index:9999;background:white;display:flex;align-items:center;justify-content:center}
#topbar{position:absolute;top:0;left:0;right:0;height:var(--nav-h);z-index:50;background:var(--bg2);border-bottom:1px solid var(--brd);display:flex;align-items:center;padding:0 16px;gap:12px}
.logo-row{display:flex;align-items:center;gap:8px;flex:1}
.logo-icon{width:32px;height:32px;background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:9px;display:flex;align-items:center;justify-content:center}
.logo-txt{font-size:18px;font-weight:900;color:var(--navy);letter-spacing:-.5px}
[data-theme=dark].logo-txt{color:#fff}
.top-right{display:flex;align-items:center;gap:8px}
.lang-sw{display:flex;background:var(--bg3);border-radius:8px;padding:2px;border:1px solid var(--brd)}
.lo{padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;color:var(--t3);cursor:pointer}
.lo.on{background:var(--navy);color:#fff}
.tb-btn{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--t3);background:var(--bg3);border:1px solid var(--brd);cursor:pointer}
.login-btn{padding:8px 16px;height:36px;border-radius:10px;background:var(--navy);color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .15s}
.login-btn:active{opacity:.8}
#main{position:absolute;top:var(--nav-h);bottom:var(--bot-h);left:0;right:0;overflow:hidden}
.scr{position:absolute;inset:0;overflow-y:auto;display:none;background:var(--bg)}
.scr.on{display:block}
#s-feed{scroll-snap-type:y mandatory;overflow-y:scroll;height:100%}
.feed-card{height:100%;scroll-snap-align:start;scroll-snap-stop:always;position:relative;overflow:hidden;background:linear-gradient(135deg,#1a1a40,#0d1b3e)}
#botbar{position:absolute;bottom:0;left:0;right:0;height:var(--bot-h);z-index:50;background:var(--bg2);border-top:1px solid var(--brd);display:flex;align-items:center;padding:0 8px 6px}
.nav-it{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;cursor:pointer;color:var(--t3);padding:6px 2px;border-radius:10px;transition:color .15s}
.nav-svg{width:22px;height:22px}
.nav-it span{font-size:9px;font-weight:700}
.nav-it.on{color:var(--navy)}
.nav-center{flex-shrink:0;padding:0 12px}
.nav-plus{width:52px;height:52px;border-radius:16px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(30,45,90,.3);cursor:pointer;transition:transform .15s}
.nav-plus:active{transform:scale(.95)}
.overlay{position:absolute;inset:0;z-index:200;background:rgba(0,0,0,.5);backdrop-filter:blur(3px);display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .22s}
.overlay.on{opacity:1;pointer-events:all}
.sheet{width:100%;max-height:92%;background:var(--bg2);border-radius:20px 20px 0 0;overflow-y:auto;padding-bottom:20px;transform:translateY(16px);transition:transform .22s}
.overlay.on .sheet{transform:translateY(0)}
.sh-handle{width:32px;height:4px;border-radius:2px;background:var(--brd2);margin:10px auto 12px}
.sh-title{font-size:18px;font-weight:800;padding:0 17px 16px;text-align:center}
.flabel{font-size:11px;font-weight:700;color:var(--t3);margin-bottom:6px;display:block;text-transform:uppercase;letter-spacing:.5px}
.finput{width:100%;padding:12px 14px;border-radius:12px;background:var(--bg3);border:1.5px solid var(--brd);font-size:14px;margin-bottom:14px;color:var(--t1);transition:border-color .15s}
.finput:focus{border-color:var(--navy);outline:none}
.tab-switcher{display:flex;background:var(--bg3);border-radius:10px;padding:3px;margin-bottom:20px}
.tsw{flex:1;padding:8px;border-radius:7px;font-size:13px;font-weight:700;color:var(--t3);cursor:pointer;text-align:center;transition:all .15s}
.tsw.on{background:var(--navy);color:#fff}
.btn-primary{width:100%;padding:14px;border-radius:12px;background:var(--navy);color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:opacity .15s;margin-top:8px}
.btn-primary:active{opacity:.85}
#toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(30,45,90,.95);color:#fff;padding:14px 24px;border-radius:12px;z-index:10000;opacity:0;transition:opacity .3s;font-weight:600;box-shadow:0 8px 30px rgba(0,0,0,.2);pointer-events:none}
#toast.show{opacity:1}
</style>
</head>
<body>
<div id="app-shell"><div id="app-wrap">

<!-- LOADER -->
<div id="loader"></div>

<!-- TOPBAR -->
<div id="topbar">
  <div class="logo-row">
    <div class="logo-icon">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    </div>
    <div class="logo-txt">Flapy<span style="font-size:10px;color:var(--orange);vertical-align:super">™</span></div>
  </div>
  <div class="top-right">
    <div class="lang-sw">
      <span class="lo on" onclick="setLang('ru')">RU</span>
      <span class="lo" onclick="setLang('kz')">KZ</span>
    </div>
    <div class="tb-btn" onclick="toggleTheme()">
      <i class="fas fa-moon" style="font-size:14px">🌙</i>
    </div>
    <div id="auth-slot">
      <button class="login-btn" onclick="openM('m-auth')">Войти</button>
    </div>
  </div>
</div>

<!-- MAIN -->
<div id="main">
  <!-- TikTok Feed -->
  <div id="s-feed" class="scr on"></div>
  
  <!-- Profile -->
  <div id="s-prof" class="scr">
    <div style="padding:80px 20px;text-align:center">
      <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--navy2));display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:white;font-size:32px;font-weight:800" id="prof-avatar">👤</div>
      <div style="font-size:20px;font-weight:700;margin-bottom:8px" id="prof-name">Риэлтор</div>
      <div style="font-size:13px;color:var(--t2);margin-bottom:32px">🏠 Моё агентство</div>
      <button onclick="doLogout()" style="padding:14px 32px;background:var(--red);color:white;border:none;border-radius:12px;cursor:pointer;font-weight:700;font-size:14px">Выйти</button>
    </div>
  </div>
</div>

<!-- BOTTOM NAV -->
<div id="botbar">
  <div class="nav-it on" onclick="go('s-feed');nav(this)">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
    <span>Лента</span>
  </div>
  <div class="nav-center">
    <div class="nav-plus" onclick="curUser ? openM('m-add') : (openM('m-auth'), toast('Сначала войдите'))">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </div>
  </div>
  <div class="nav-it" onclick="go('s-prof');nav(this)">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
    <span>Профиль</span>
  </div>
</div>

<!-- AUTH MODAL -->
<div class="overlay" id="m-auth" onclick="closeOvl(event,'m-auth')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div style="padding:0 17px 17px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:24px;font-weight:800;color:var(--navy);margin-bottom:8px">🏡 Добро пожаловать домой</div>
        <div style="font-size:13px;color:var(--t2)">Здесь вы найдёте место, где будет звучать ваш смех</div>
      </div>
      
      <div class="tab-switcher">
        <div class="tsw on" id="tab-in" onclick="authTab('in')">Войти</div>
        <div class="tsw" id="tab-up" onclick="authTab('up')">Регистрация</div>
      </div>
      
      <!-- Login Form -->
      <div id="af-in">
        <label class="flabel">Email</label>
        <input class="finput" type="email" id="l-email" placeholder="you@mail.com">
        <label class="flabel">Пароль</label>
        <input class="finput" type="password" id="l-pass" placeholder="••••••••">
        <button class="btn-primary" onclick="doLogin()">Войти</button>
      </div>
      
      <!-- Register Form -->
      <div id="af-up" style="display:none">
        <label class="flabel">Имя *</label>
        <input class="finput" type="text" id="r-name" placeholder="Айгерим">
        <label class="flabel">Email *</label>
        <input class="finput" type="email" id="r-email" placeholder="you@mail.com">
        <label class="flabel">Телефон</label>
        <input class="finput" type="tel" id="r-phone" placeholder="+7 701 234 56 78">
        <label class="flabel">WhatsApp для связи *</label>
        <input class="finput" type="tel" id="r-whatsapp" placeholder="+7 701 234 56 78">
        <label class="flabel">Агентство</label>
        <input class="finput" type="text" id="r-agency" placeholder="Моё агентство">
        <label class="flabel">Пароль *</label>
        <input class="finput" type="password" id="r-pass" placeholder="Минимум 6 символов">
        <button class="btn-primary" onclick="doReg()">Зарегистрироваться</button>
      </div>
    </div>
  </div>
</div>

<!-- ADD LISTING MODAL -->
<div class="overlay" id="m-add" onclick="closeOvl(event,'m-add')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div class="sh-title">Рассказать о своём доме ✨</div>
    <div style="padding:0 17px">
      <label class="flabel">Тип объекта</label>
      <select class="finput" id="a-type">
        <option value="apartment">🏢 Квартира</option>
        <option value="house">🏡 Дом</option>
        <option value="commercial">🏪 Коммерция</option>
      </select>
      
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label class="flabel">Комнат</label>
          <input class="finput" type="number" id="a-rooms" value="3" min="1">
        </div>
        <div>
          <label class="flabel">Площадь м²</label>
          <input class="finput" type="number" id="a-area" placeholder="85">
        </div>
      </div>
      
      <label class="flabel">Город</label>
      <select class="finput" id="a-city">
        <option>Астана</option>
        <option>Алматы</option>
        <option>Шымкент</option>
        <option>Другой</option>
      </select>
      
      <label class="flabel">Район</label>
      <select class="finput" id="a-district">
        <option>Есиль</option>
        <option>Алматинский</option>
        <option>Сарыарка</option>
        <option>Байконыр</option>
        <option>Другой</option>
      </select>
      
      <label class="flabel">Цена ₸</label>
      <input class="finput" type="text" id="a-price" placeholder="78 500 000">
      
      <label class="flabel">Описание *</label>
      <textarea class="finput" id="a-desc" rows="4" placeholder="Расскажите о доме с любовью..."></textarea>
      
      <label class="flabel">Фотографии (макс. 5)</label>
      <div id="photo-upload-area" onclick="uploadMedia('photo')" style="border:2px dashed var(--brd);border-radius:12px;padding:20px;text-align:center;cursor:pointer;background:var(--bg3);margin-bottom:14px">
        <div style="font-size:32px;margin-bottom:8px">📷</div>
        <div style="font-size:12px;color:var(--t2)">Нажмите чтобы добавить фото</div>
      </div>
      
      <label class="flabel">TikTok видео (необязательно)</label>
      <input class="finput" type="text" id="a-tiktok" placeholder="https://tiktok.com/@user/video/...">
      <div style="font-size:11px;color:var(--t2);margin-bottom:16px">💡 Видео поможет привлечь больше внимания</div>
      
      <button class="btn-primary" onclick="submitListing()">Опубликовать с любовью 💙</button>
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
