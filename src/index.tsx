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

app.get('/', (c) => c.html(getHTML()))

function getHTML(): string {
return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Flapy™ — Умный помощник по жилью</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
:root{--bg:#F8F6F3;--bg2:#FFFFFF;--bg3:#F0EDE8;--navy:#1E2D5A;--orange:#F47B20;--green:#27AE60;--red:#E74C3C;--t1:#2D3748;--t2:#6B7280;--t3:#9CA3AF;--brd:#E5E7EB;--nav-h:60px;--bot-h:64px}
[data-theme=dark]{--bg:#0F0F1A;--bg2:#161626;--bg3:#1E1E35;--t1:#F0F0FF;--t2:#9090C0;--t3:#5A5A80;--brd:rgba(255,255,255,.1)}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{font-family:'Inter',-apple-system,sans-serif;background:var(--bg);color:var(--t1);overflow-x:hidden}
button,input,textarea,select{font-family:inherit;outline:none;border:none;background:none;color:var(--t1)}
::-webkit-scrollbar{width:0;height:0}
#app{max-width:480px;margin:0 auto;min-height:100vh;background:var(--bg);position:relative;box-shadow:0 0 60px rgba(0,0,0,.05)}
#topbar{position:sticky;top:0;z-index:50;background:var(--bg2);border-bottom:1px solid var(--brd);padding:12px 16px;display:flex;align-items:center;justify-content:space-between}
.logo{font-size:20px;font-weight:900;color:var(--navy)}
.tabs{display:flex;gap:20px;margin:12px 16px 0;border-bottom:2px solid var(--brd)}
.tab{padding:8px 0;font-weight:600;color:var(--t3);cursor:pointer;position:relative;transition:.2s}
.tab.on{color:var(--navy)}
.tab.on::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;background:var(--navy);border-radius:2px}
[data-theme=dark].tab.on{color:var(--orange)}
[data-theme=dark].tab.on::after{background:var(--orange)}
#main{padding:16px;padding-bottom:80px}
.lcard{background:var(--bg2);border-radius:24px;padding:16px;margin-bottom:24px;box-shadow:0 10px 40px rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.03);transition:all .3s cubic-bezier(.25,.8,.25,1);cursor:pointer;position:relative}
.lcard:hover{transform:translateY(-6px) scale(1.015);box-shadow:0 20px 50px rgba(0,0,0,.12)}
[data-theme=dark].lcard:hover{box-shadow:0 0 20px rgba(74,111,165,.2);border-color:rgba(255,255,255,.1)}
.card-img{height:180px;background:#eee;border-radius:16px;margin-bottom:12px;overflow:hidden;position:relative}
.card-img img{width:100%;height:100%;object-fit:cover}
.badge{position:absolute;top:10px;left:10px;background:rgba(0,0,0,.6);color:#fff;padding:4px 10px;border-radius:20px;font-size:11px;backdrop-filter:blur(4px)}
.btn-fav{position:absolute;top:16px;right:16px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.85);backdrop-filter:blur(8px);border:none;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;z-index:10;transition:transform .2s}
.btn-fav.active{color:#e74c3c;transform:scale(1.15)}
.glass-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;border-radius:16px;font-size:14px;font-weight:600;border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:all .2s;cursor:pointer;text-decoration:none}
.btn-call{background:linear-gradient(135deg,rgba(39,174,96,.9),rgba(46,204,113,.8));color:#fff;box-shadow:0 4px 15px rgba(39,174,96,.3)}
.btn-wa{background:linear-gradient(135deg,rgba(37,211,102,.9),rgba(18,140,126,.8));color:#fff;box-shadow:0 4px 15px rgba(37,211,102,.3)}
[data-theme=dark].btn-call{box-shadow:0 0 15px rgba(39,174,96,.4)}
[data-theme=dark].btn-wa{box-shadow:0 0 15px rgba(37,211,102,.4)}
.glass-btn:active,.btn-fav:active{transform:scale(.95)}
#botbar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;height:var(--bot-h);background:var(--bg2);border-top:1px solid var(--brd);display:flex;align-items:center;padding:0 16px;z-index:100}
.nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;color:var(--t3);font-size:11px;font-weight:600;cursor:pointer}
.nav-btn.on{color:var(--navy)}
[data-theme=dark].nav-btn.on{color:var(--orange)}
.nav-plus{width:48px;height:48px;border-radius:16px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;box-shadow:0 4px 16px rgba(30,45,90,.3);cursor:pointer}
[data-theme=dark].nav-plus{background:var(--orange);box-shadow:0 4px 16px rgba(244,123,32,.3)}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);z-index:200;display:none;align-items:flex-end;justify-content:center}
.overlay.on{display:flex}
.sheet{width:100%;max-width:480px;background:var(--bg2);border-radius:24px 24px 0 0;padding:20px;max-height:90vh;overflow-y:auto}
.finput{width:100%;padding:12px;border:1.5px solid var(--brd);border-radius:12px;margin-bottom:12px;background:var(--bg3)}
.btn-primary{width:100%;padding:14px;background:var(--navy);color:#fff;border-radius:12px;font-weight:700;cursor:pointer;margin-top:8px}
[data-theme=dark].btn-primary{background:var(--orange)}
#toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(30,45,90,.95);color:#fff;padding:14px 24px;border-radius:12px;z-index:300;opacity:0;transition:opacity .3s;pointer-events:none}
</style>
</head>
<body>
<div id="app">
  <div id="topbar">
    <div class="logo">Flapy<span style="color:var(--orange)">™</span></div>
    <div style="display:flex;gap:8px">
      <button onclick="toggleTheme()" style="padding:6px 10px;background:var(--bg3);border-radius:8px">🌙</button>
      <button onclick="openM('m-auth')" id="auth-btn" style="padding:6px 12px;background:var(--navy);color:#fff;border-radius:8px;font-weight:600">Войти</button>
    </div>
  </div>
  
  <div class="tabs">
    <div class="tab on" id="tab-all" onclick="switchTab('all')">Объекты</div>
    <div class="tab" id="tab-exchange" onclick="switchTab('exchange')">🔄 Обмен</div>
  </div>
  
  <div id="main"></div>
  
  <div id="botbar">
    <div class="nav-btn on" onclick="switchTab('all')">🏠 Лента</div>
    <div class="nav-plus" onclick="openM('m-add')">+</div>
    <div class="nav-btn" onclick="openM('m-auth')">👤 Профиль</div>
  </div>
</div>

<!-- ADD MODAL -->
<div class="overlay" id="m-add" onclick="if(event.target===this)closeM('m-add')">
  <div class="sheet">
    <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px">Добавить объект ✨</div>
    <input class="finput" id="a-price" type="text" placeholder="Цена (например: 78 500 000)">
    <input class="finput" id="a-desc" type="text" placeholder="Описание объекта...">
    <input class="finput" id="a-phone" type="tel" placeholder="Ваш телефон для связи">
    
    <div style="background:var(--bg3);border-radius:16px;padding:16px;margin-bottom:16px">
      <div style="font-size:12px;font-weight:700;color:var(--t2);text-transform:uppercase;margin-bottom:8px">Тип сделки</div>
      <div style="display:flex;gap:10px">
        <label style="flex:1;display:flex;align-items:center;gap:8px;background:var(--bg2);padding:10px;border-radius:12px;border:1px solid var(--brd);cursor:pointer">
          <input type="radio" name="deal_type" value="sale" checked style="accent-color:var(--navy)"> 💰 Продажа
        </label>
        <label style="flex:1;display:flex;align-items:center;gap:8px;background:var(--bg2);padding:10px;border-radius:12px;border:1px solid var(--brd);cursor:pointer">
          <input type="radio" name="deal_type" value="exchange" style="accent-color:var(--orange)"> 🔄 Обмен
        </label>
      </div>
    </div>

    <button class="btn-primary" onclick="submitListing()">Опубликовать</button>
  </div>
</div>

<!-- AUTH MODAL -->
<div class="overlay" id="m-auth" onclick="if(event.target===this)closeM('m-auth')">
  <div class="sheet">
    <div style="text-align:center;font-size:18px;font-weight:700;margin-bottom:16px">🏡 Вход в Flapy</div>
    <input class="finput" id="l-email" type="email" placeholder="Email">
    <input class="finput" id="l-pass" type="password" placeholder="Пароль">
    <button class="btn-primary" onclick="doLogin()">Войти</button>
    <button style="width:100%;padding:12px;color:var(--t2);font-size:13px;margin-top:8px" onclick="doLogout()">Выйти</button>
  </div>
</div>

<div id="toast"></div>
<script src="/static/app.js"></script>
</body>
</html>`
}

export default app
