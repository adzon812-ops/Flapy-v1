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

// 🤖 GEMINI AI ENDPOINT
app.post('/api/ai/describe', async (c) => {
  const b = await c.req.json().catch(() => ({})) as any
  const env = c.env as any
  const apiKey = env?.GEMINI_API_KEY

  if (!apiKey) return c.json({ error: 'GEMINI_API_KEY not set', descriptions: [] }, 500)

  const prompt = `Ты — копирайтер Flapy™. Напиши 2 варианта описания объекта недвижимости.
ДАННЫЕ: ${JSON.stringify(b)}
ПРАВИЛА: 
1. Вариант 1: 🤍 Тёплый, душевный, про атмосферу.
2. Вариант 2: 🔥 Продающий, чёткий, про выгоду и локацию.
3. Язык: Русский. Эмодзи: 3-5 шт. Без штампов ("элитный", "премиум").
4. Длина: 80-100 слов каждый.
ФОРМАТ ОТВЕТА СТРОГО:
ВАРИАНТ 1:
[текст]

ВАРИАНТ 2:
[текст]`

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
      })
    })

    if (!res.ok) throw new Error(`API ${res.status}`)
    const data = await res.json() as any
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Парсим ответ
    const v1 = raw.split('ВАРИАНТ 2:')[0]?.replace('ВАРИАНТ 1:', '')?.trim() || ''
    const v2 = raw.split('ВАРИАНТ 2:')[1]?.trim() || ''
    
    return c.json({ descriptions: [v1, v2] })
  } catch (e) {
    console.error('Gemini Error:', e)
    return c.json({ error: String(e), descriptions: [] }, 500)
  }
})

// Эхо-роуты для совместимости фронтенда
app.post('/api/auth/login', async (c) => c.json({ success: true }))
app.post('/api/auth/register', async (c) => c.json({ success: true }))
app.get('/api/listings', (c) => c.json({ listings: [] }))
app.get('/api/realtors', (c) => c.json({ realtors: [] }))
app.get('/api/calendar', (c) => c.json({ events: [] }))
app.post('/api/chat/aira', async (c) => c.json({ success: true }))

app.get('/', (c) => c.html(getHTML()))

function getHTML(): string {
return `<!DOCTYPE html>
<html lang="ru" data-theme="light" data-lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#FFFFFF">
<title>Flapy™ — Ваш умный помощник на рынке жилья</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
:root{--white:#FFFFFF;--bg:#F5F5F7;--bg2:#FFFFFF;--bg3:#F0F0F5;--navy:#1E2D5A;--navy2:#2E4A85;--orange:#F47B20;--orange2:#FF9A3C;--green:#27AE60;--red:#E74C3C;--purple:#9B59B6;--t1:#1A1A2E;--t2:#6B7280;--t3:#9CA3AF;--brd:#E5E7EB;--brd2:#D1D5DB;--sh:0 1px 4px rgba(0,0,0,.06),0 2px 10px rgba(0,0,0,.05);--sh2:0 4px 20px rgba(0,0,0,.1);--nav-h:56px;--bot-h:64px;--r:14px;--max:480px}
[data-theme=dark]{--bg:#0F0F1A;--bg2:#161626;--bg3:#1E1E35;--t1:#F0F0FF;--t2:#9090C0;--t3:#5A5A80;--brd:rgba(255,255,255,.1);--brd2:rgba(255,255,255,.15)}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;background:var(--bg);font-family:'Inter',-apple-system,sans-serif;color:var(--t1);overflow:hidden;-webkit-font-smoothing:antialiased}
button{border:none;cursor:pointer;font-family:inherit;background:none;color:inherit}
input,textarea,select{font-family:inherit;outline:none;color:var(--t1);background:none}
::-webkit-scrollbar{width:0;height:0}
#app-shell{position:fixed;inset:0;display:flex;justify-content:center;align-items:flex-start;background:#E0E0EC}
[data-theme=dark] #app-shell{background:#08080F}
#app-wrap{position:relative;width:100%;max-width:var(--max);height:100%;background:var(--bg);overflow:hidden;box-shadow:0 0 60px rgba(0,0,0,.12)}
@media(min-width:520px){#app-wrap{border-left:1px solid var(--brd);border-right:1px solid var(--brd)}}
#loader{position:absolute;inset:0;z-index:999;background:var(--bg2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;transition:opacity .3s}
.ld-icon{width:52px;height:52px;background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(30,45,90,.25)}
.ld-name{font-size:30px;font-weight:900;color:var(--navy);letter-spacing:-1px}
.ld-sub{font-size:13px;color:var(--t3)}
.ld-bar-wrap{width:72px;height:3px;background:var(--bg3);border-radius:2px;overflow:hidden;margin-top:4px}
.ld-bar{height:100%;background:linear-gradient(90deg,var(--navy),var(--orange));border-radius:2px;animation:ldA 1.4s ease forwards}
@keyframes ldA{from{width:0}to{width:100%}}
#topbar{position:absolute;top:0;left:0;right:0;height:var(--nav-h);z-index:50;background:var(--bg2);border-bottom:1px solid var(--brd);display:flex;align-items:center;padding:0 14px;gap:10px}
.logo-row{display:flex;align-items:center;gap:8px;flex:1}
.logo-icon{width:32px;height:32px;background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.logo-txt{font-size:18px;font-weight:900;color:var(--navy);letter-spacing:-.5px}
.logo-tag{font-size:10px;color:var(--orange);vertical-align:super;font-weight:700}
.top-right{display:flex;align-items:center;gap:7px;position:relative}
.lang-sw{display:flex;align-items:center;background:var(--bg3);border-radius:8px;padding:2px;border:1px solid var(--brd)}
.lo{padding:3px 7px;border-radius:6px;font-size:11px;font-weight:700;color:var(--t3);cursor:pointer;transition:all .15s}
.lo.on{background:var(--navy);color:#fff}
.tb-btn{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--t3);background:var(--bg3);border:1px solid var(--brd);cursor:pointer;transition:all .15s}
.login-btn{padding:0 13px;height:30px;border-radius:8px;background:var(--navy);color:#fff;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}
.u-chip{display:flex;align-items:center;gap:6px;cursor:pointer}
.u-ava{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--navy2));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff}
.u-nm{font-size:12px;font-weight:700;color:var(--t1)}
#notif-badge{position:absolute;top:-4px;right:-4px;background:var(--orange);color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:10px;min-width:18px;text-align:center;display:none}
#main{position:absolute;top:var(--nav-h);bottom:var(--bot-h);left:0;right:0;overflow:hidden}
.scr{position:absolute;inset:0;overflow-y:auto;display:none;-webkit-overflow-scrolling:touch;background:var(--bg)}
.scr.on{display:block}
#s-search{background:var(--bg)}
.list-header{position:sticky;top:0;z-index:10;background:var(--bg2);border-bottom:1px solid var(--brd)}
.lh-top{padding:10px 14px 0}
.lh-tagline{font-size:12px;color:var(--t3);font-weight:500;margin-bottom:6px}
.tab-row{display:flex;border-bottom:1px solid var(--brd)}
.tab-item{flex:1;padding:10px 0;text-align:center;font-size:14px;font-weight:600;color:var(--t3);border-bottom:2.5px solid transparent;cursor:pointer;transition:all .15s;margin-bottom:-1px}
.tab-item.on{color:var(--navy);border-color:var(--navy);font-weight:700}
.filter-row{display:flex;gap:6px;overflow-x:auto;padding:9px 14px}
.fchip{flex-shrink:0;padding:5px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid var(--brd2);color:var(--t2);background:none;transition:all .15s;white-space:nowrap}
.fchip.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.list-body{padding:10px 12px 12px}
.lcard{background:var(--bg2);border-radius:var(--r);box-shadow:var(--sh);margin-bottom:12px;overflow:hidden;cursor:pointer;border:1px solid var(--brd);transition:box-shadow .15s}
.lcard:active{box-shadow:var(--sh2)}
.lcard-media{position:relative;height:185px;background:linear-gradient(135deg,#EEF0F6,#E0E3EE);overflow:hidden;display:flex;align-items:center;justify-content:center}
.lcard-em{font-size:64px;opacity:.22}
.lcard-badge{position:absolute;top:10px;right:10px;padding:3px 9px;border-radius:7px;font-size:11px;font-weight:700;color:#fff}
.lcard-body{padding:11px 13px 13px}
.lcard-loc{font-size:12px;color:var(--t3);display:flex;align-items:center;gap:4px;margin-bottom:5px}
.lcard-loc i{color:var(--orange);font-size:11px}
.lcard-price{font-size:20px;font-weight:800;color:var(--t1);letter-spacing:-.3px;margin-bottom:2px}
.lcard-sub{font-size:12px;color:var(--t2);margin-bottom:7px}
.lcard-tags{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px}
.ltag{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(244,123,32,.1);color:var(--orange);border:1px solid rgba(244,123,32,.2)}
.lcard-footer{display:flex;align-items:center;gap:8px;padding-top:9px;border-top:1px solid var(--brd)}
.lf-ava{width:26px;height:26px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff}
.lf-name{font-size:11px;font-weight:600;color:var(--t2);flex:1}
.lcard-cta{display:flex;gap:7px;margin-top:9px}
.cta-btn{flex:1;padding:9px 6px;border-radius:10px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:5px;cursor:pointer;text-decoration:none}
.cta-call{background:var(--green);color:#fff}
.cta-msg{background:var(--navy);color:#fff}
#s-aira{display:none;background:#e5ddd5}
[data-theme=dark] #s-aira{background:#0A0F1E}
.chat-wrap{display:flex;flex-direction:column;height:100%}
.chat-header{flex-shrink:0;background:var(--navy);padding:10px 14px;display:flex;align-items:center;gap:10px;color:#fff}
[data-theme=dark] .chat-header{background:#1E1E35}
.ch-ava{width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff;background:linear-gradient(135deg,var(--orange),var(--orange2))}
.ch-name{font-size:15px;font-weight:700;color:#fff}
.ch-status{font-size:11px;color:rgba(255,255,255,.7);display:flex;align-items:center;gap:4px;margin-top:1px}
.ch-online-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;display:inline-block}
.chat-body{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:4px}
.msg-wrap{display:flex;flex-direction:column;margin-bottom:6px}
.msg-wrap.me{align-items:flex-end}
.msg-wrap.other{align-items:flex-start}
.msg-author{font-size:11px;font-weight:600;color:var(--orange);margin-bottom:2px;padding-left:4px}
.bubble{max-width:82%;padding:9px 12px 7px;border-radius:12px;font-size:14px;line-height:1.45;word-break:break-word;position:relative;box-shadow:0 1px 2px rgba(0,0,0,.13)}
.msg-wrap.other .bubble{background:#fff;color:#1a1a1a;border-radius:3px 12px 12px 12px}
[data-theme=dark] .msg-wrap.other .bubble{background:#1E2D5A;color:#fff}
.msg-wrap.me .bubble{background:#dcf8c6;color:#1a1a1a;border-radius:12px 3px 12px 12px}
[data-theme=dark] .msg-wrap.me .bubble{background:var(--navy);color:#fff}
.m-ts{font-size:10px;color:var(--t3);margin-top:3px;padding-right:2px}
.chat-input-row{flex-shrink:0;display:flex;align-items:flex-end;gap:8px;padding:8px 12px;background:var(--bg2);border-top:1px solid var(--brd)}
.ci{flex:1;min-height:40px;max-height:88px;padding:10px 16px;border-radius:22px;border:1.5px solid var(--brd2);background:var(--white);font-size:14px;resize:none;line-height:1.4;color:var(--t1)}
.ci::placeholder{color:var(--t3)}
.send-btn{width:44px;height:44px;border-radius:50%;flex-shrink:0;background:var(--navy);color:#fff;font-size:17px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,.2)}
.prof-wrap{padding:13px}
.prof-hero{background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:16px;padding:18px;margin-bottom:14px}
.ph-ava{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:9px}
.ph-name{font-size:17px;font-weight:800;color:#fff}
.ph-tag{font-size:11px;color:rgba(255,255,255,.6);margin-top:2px}
.menu-sec{margin-bottom:16px}
.menu-lbl{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:7px}
.menu-item{display:flex;align-items:center;gap:11px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:12px;margin-bottom:7px;cursor:pointer;box-shadow:var(--sh)}
.menu-ico{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.menu-name{font-size:13px;font-weight:600}
.menu-sub{font-size:11px;color:var(--t3);margin-top:1px}
.notif-wrap{padding:13px}
.notif-item{display:flex;gap:10px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:12px;margin-bottom:8px;box-shadow:var(--sh);cursor:pointer}
.notif-ico{font-size:20px;flex-shrink:0;margin-top:1px}
.notif-txt{font-size:12px;line-height:1.55;color:var(--t2)}
.notif-txt b{color:var(--t1)}
.notif-time{font-size:10px;color:var(--t3);margin-top:3px}
#botbar{position:absolute;bottom:0;left:0;right:0;height:var(--bot-h);z-index:50;background:var(--bg2);border-top:1px solid var(--brd);display:flex;align-items:center;padding:0 8px 6px}
.nav-it{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:var(--t3);padding:6px 2px;border-radius:10px;position:relative;transition:color .15s}
.nav-svg{width:22px;height:22px;transition:transform .15s;flex-shrink:0}
.nav-it span{font-size:9px;font-weight:700}
.nav-it.on{color:var(--navy)}
.nav-it.on .nav-svg{transform:scale(1.1)}
.nav-plus-wrap{flex-shrink:0;padding:0 6px;display:none}
.nav-plus{width:48px;height:48px;border-radius:14px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(30,45,90,.3);cursor:pointer;transition:transform .15s}
[data-theme=dark] .nav-plus{background:var(--orange)}
.nav-plus:active{transform:scale(1.05)}
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
select.finput{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239CA3AF'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;background-color:var(--bg3);padding-right:28px}
textarea.finput{resize:none;min-height:68px;line-height:1.5}
.form-row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.form-row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.btn-primary{width:100%;padding:13px;border-radius:12px;background:var(--navy);color:#fff;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
[data-theme=dark] .btn-primary{background:var(--orange)}
.btn-secondary{width:100%;padding:11px;border-radius:12px;background:var(--bg3);border:1.5px solid var(--brd);font-size:13px;font-weight:600;margin-top:8px;color:var(--t1);cursor:pointer}
.btn-outline{width:100%;padding:11px;border-radius:11px;background:none;border:1.5px solid var(--navy);color:var(--navy);font-size:13px;font-weight:600;margin-top:7px;cursor:pointer}
.tab-switcher{display:flex;background:var(--bg3);border-radius:10px;padding:3px;margin-bottom:14px}
.tsw{flex:1;padding:7px;border-radius:7px;font-size:13px;font-weight:700;color:var(--t3);cursor:pointer;text-align:center;transition:all .15s}
.tsw.on{background:var(--navy);color:#fff}
.info-box{display:flex;align-items:flex-start;gap:7px;background:rgba(39,174,96,.07);border:1px solid rgba(39,174,96,.2);border-radius:10px;padding:9px 11px;margin-bottom:11px;font-size:12px;line-height:1.5;color:var(--t2)}
.ai-label{display:inline-flex;align-items:center;gap:3px;background:rgba(244,123,32,.12);border-radius:5px;padding:1px 7px;font-size:10px;font-weight:700;color:var(--orange)}
.ai-variants{margin-top:8px;display:flex;flex-direction:column;gap:8px}
.ai-variant{background:var(--bg3);border:1.5px solid rgba(244,123,32,.2);border-radius:10px;padding:11px;font-size:12px;line-height:1.6;color:var(--t2);white-space:pre-wrap}
.ai-variant-label{font-size:10px;font-weight:700;color:var(--orange);margin-bottom:5px}
.ai-choose-btn{margin-top:7px;padding:6px 14px;border-radius:8px;font-size:11px;font-weight:700;background:var(--navy);color:#fff;cursor:pointer;border:none}
.ai-actions{display:flex;gap:6px;margin-top:7px}
.ai-act-btn{padding:5px 11px;border-radius:8px;font-size:11px;font-weight:600;background:var(--bg3);border:1px solid var(--brd);color:var(--t2);cursor:pointer}
.ai-loading{text-align:center;padding:20px;color:var(--t3);font-size:13px}
.more-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:0 17px 17px}
.more-item{background:var(--bg2);border:1px solid var(--brd);border-radius:14px;padding:16px;cursor:pointer;text-align:center;box-shadow:var(--sh)}
.more-ico{font-size:28px;margin-bottom:5px}
.more-name{font-size:12px;font-weight:700}
.more-sub{font-size:10px;color:var(--t3);margin-top:2px}
.empty{text-align:center;padding:52px 20px}
.empty-ico{font-size:44px;opacity:.25;margin-bottom:9px}
.empty-t{font-size:15px;font-weight:700;margin-bottom:4px}
.empty-s{font-size:12px;color:var(--t3)}
#toast{position:absolute;bottom:78px;left:50%;transform:translateX(-50%) translateY(6px);background:rgba(30,45,90,.92);color:#fff;border-radius:10px;padding:9px 16px;font-size:12px;font-weight:600;white-space:nowrap;z-index:600;opacity:0;transition:all .2s;pointer-events:none}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.det-visual{height:200px;position:relative;background:linear-gradient(135deg,#EEF0F6,#E0E3EE);display:flex;align-items:center;justify-content:center}
.det-em-bg{font-size:80px;opacity:.25}
.det-price{font-size:23px;font-weight:900;padding:8px 17px 4px}
.det-cta{display:flex;gap:8px;padding:0 17px 17px}
.det-btn{flex:1;padding:12px;border-radius:12px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}
.det-call{background:var(--green)}
.det-chat{background:var(--navy)}
[data-theme=dark] .det-chat{background:var(--orange)}
.su{animation:suIn .25s ease}
@keyframes suIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
</style>
</head>
<body>
<div id="app-shell"><div id="app-wrap">

<div id="loader">
  <div class="ld-icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg></div>
  <div class="ld-name">Flapy<span style="font-size:10px;color:var(--orange);vertical-align:super;font-weight:700">™</span></div>
  <div class="ld-sub">Ваш умный помощник на рынке жилья</div>
  <div class="ld-bar-wrap"><div class="ld-bar"></div></div>
</div>

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
    <div style="position:relative">
      <div id="auth-slot"><button class="login-btn" onclick="openM('m-auth')">Войти</button></div>
      <span id="notif-badge"></span>
    </div>
  </div>
</div>

<div id="main">
<div id="s-search" class="scr on">
  <div class="list-header">
    <div class="lh-top">
      <div class="lh-tagline">Ваш умный помощник на рынке жилья</div>
      <div class="tab-row">
        <div class="tab-item on" id="tab-obj" onclick="setListTab('obj')">Объекты</div>
        <div class="tab-item" id="tab-exch" onclick="setListTab('exch')">Обмен</div>
      </div>
    </div>
    <div class="filter-row">
      <div class="fchip on" onclick="setFilt(this,'all')">Все</div>
      <div class="fchip" onclick="setFilt(this,'apartment')">Квартиры</div>
      <div class="fchip" onclick="setFilt(this,'house')">Дома</div>
      <div class="fchip" onclick="setFilt(this,'commercial')">Коммерция</div>
      <div class="fchip" onclick="setFilt(this,'video')">🎬 Видео</div>
    </div>
  </div>
  <div class="list-body" id="list-body"></div>
</div>

<div id="s-aira" class="scr">
  <div class="chat-wrap">
    <div class="chat-header">
      <div class="ch-ava">A</div>
      <div style="flex:1">
        <div class="ch-name">Aira — Чат риэлторов</div>
        <div class="ch-status"><span class="ch-online-dot"></span> <span id="aira-online-txt">онлайн</span></div>
      </div>
      <div id="aira-badge" style="background:rgba(255,255,255,.15);border-radius:8px;padding:4px 10px;font-size:11px;color:rgba(255,255,255,.85);font-weight:600">🔒 Гость</div>
    </div>
    <div class="chat-body" id="aira-msgs">
      <div class="msg-wrap other">
        <div class="msg-author">Flapy™</div>
        <div class="bubble">Привет! Здесь риэлторы Астаны делятся объектами, договариваются о совместных сделках и помогают друг другу 🤝</div>
        <div class="m-ts">сейчас</div>
      </div>
    </div>
    <div class="chat-input-row">
      <textarea class="ci" id="aira-inp" rows="1" placeholder="Напишите коллегам..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendAira()}"></textarea>
      <button class="send-btn" onclick="sendAira()"><i class="fas fa-paper-plane"></i></button>
    </div>
  </div>
</div>

<div id="s-prof" class="scr"><div class="prof-wrap" id="prof-body"></div></div>

<div id="s-notif" class="scr">
  <div class="notif-wrap" id="notif-body"></div>
</div>
</div>

<div id="botbar">
  <div class="nav-it on" id="n-search" onclick="go('s-search');nav(this)">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>
    <span>Объекты</span>
  </div>
  <div class="nav-it" id="n-aira" onclick="go('s-aira');nav(this)" style="display:none">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
    <span>Aira</span>
  </div>
  <div class="nav-plus-wrap" id="nav-plus-wrap">
    <div class="nav-plus" onclick="needAuth(() => openM('m-add'))">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </div>
  </div>
  <div class="nav-it" id="n-notif" onclick="go('s-notif');nav(this)" style="display:none">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
    <span>Уведомления</span>
  </div>
  <div class="nav-it" id="n-prof" onclick="go('s-prof');nav(this)">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    <span>Профиль</span>
  </div>
</div>

<div class="overlay" id="m-auth" onclick="closeOvl(event,'m-auth')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div style="padding:0 17px 17px">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:24px">🏠</div>
        <div style="font-size:17px;font-weight:800;margin-top:6px" id="auth-welcome">Рады вас видеть!</div>
        <div style="font-size:12px;color:var(--t3);margin-top:3px">Flapy — сообщество риэлторов Астаны</div>
      </div>
      <div class="tab-switcher">
        <div class="tsw on" id="at-in" onclick="authTab('in')">Войти</div>
        <div class="tsw" id="at-up" onclick="authTab('up')">Зарегистрироваться</div>
      </div>
      <div id="af-in">
        <label class="flabel">Email (только латиница)</label>
        <input class="finput" type="email" id="l-email" placeholder="yourname@email.com" autocomplete="email">
        <label class="flabel">Пароль</label>
        <input class="finput" type="password" id="l-pass" placeholder="••••••••" autocomplete="current-password">
        <button class="btn-primary" onclick="doLogin()"><i class="fas fa-sign-in-alt"></i> Войти</button>
        <button class="btn-secondary" onclick="authTab('up')">Ещё нет аккаунта? Создать за минуту →</button>
      </div>
      <div id="af-up" style="display:none">
        <div class="info-box"><span>✨</span><span>Добро пожаловать в семью риэлторов Flapy! После регистрации вы сможете добавлять объекты и общаться с коллегами.</span></div>
        <label class="flabel">Ваше имя</label>
        <input class="finput" type="text" id="r-name" placeholder="Айгерим Касымова">
        <label class="flabel">Email (только латиница и цифры)</label>
        <input class="finput" type="email" id="r-email" placeholder="yourname@email.com">
        <label class="flabel">Телефон (WhatsApp)</label>
        <input class="finput" type="tel" id="r-phone" placeholder="+7 777 000 00 00">
        <label class="flabel">Агентство</label>
        <select class="finput" id="r-agency">
          <option value="">Выбрать...</option>
          <option>Самозанятый риэлтор</option><option>Century 21</option><option>Etagi</option><option>Royal Group</option><option>Другое</option>
        </select>
        <label class="flabel">Пароль</label>
        <input class="finput" type="password" id="r-pass" placeholder="Минимум 6 символов" autocomplete="new-password">
        <button class="btn-primary" onclick="doReg()"><i class="fas fa-user-plus"></i> Зарегистрироваться</button>
        <button class="btn-secondary" onclick="authTab('in')">Уже есть аккаунт — войти</button>
      </div>
    </div>
  </div>
</div>

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

      <label class="flabel">Название ЖК / Дома</label>
      <input class="finput" type="text" id="a-complex" placeholder="Например: ЖК Нурсая, ЖК Expo City...">

      <div class="form-row2">
        <div><label class="flabel">Комнаты</label>
          <select class="finput" id="a-rooms">
            <option>1</option><option>2</option><option selected>3</option><option>4</option><option>5+</option>
          </select>
        </div>
        <div><label class="flabel">Площадь м²</label>
          <input class="finput" type="number" id="a-area" placeholder="85">
        </div>
      </div>

      <div class="form-row3">
        <div><label class="flabel">Этаж</label>
          <input class="finput" type="number" id="a-floor" placeholder="5">
        </div>
        <div><label class="flabel">Этажность</label>
          <input class="finput" type="number" id="a-totalfloors" placeholder="12">
        </div>
        <div><label class="flabel">Потолки, м</label>
          <select class="finput" id="a-ceiling">
            <option value="2.5">2.5 м</option>
            <option value="2.7" selected>2.7 м</option>
            <option value="2.9">2.9 м</option>
            <option value="3.0">3.0 м</option>
            <option value="3.2">3.2 м+</option>
          </select>
        </div>
      </div>

      <label class="flabel">Район (Астана)</label>
      <select class="finput" id="a-district">
        <option value="Есиль">Есиль</option>
        <option value="Алматинский">Алматинский</option>
        <option value="Сарыарка">Сарыарка</option>
        <option value="Байконыр">Байконыр</option>
        <option value="Нура">Нура</option>
      </select>

      <label class="flabel">Цена ₸</label>
      <input class="finput" type="text" id="a-price" placeholder="10 000 000" oninput="formatPriceInput(this)">

      <div style="margin-bottom:8px">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;font-weight:500;color:var(--t1)">
          <input type="checkbox" id="a-exchange" style="width:16px;height:16px;accent-color:var(--green)">
          🔄 Готов рассмотреть обмен
        </label>
      </div>

      <label class="flabel">Описание <span class="ai-label"><i class="fas fa-magic"></i> AI помогает</span></label>
      <textarea class="finput" id="a-desc" rows="3" placeholder="Опишите объект или нажмите кнопку AI — она напишет за вас ✨"></textarea>

      <div id="ai-variants-wrap" style="display:none"></div>

      <button class="btn-outline" id="ai-gen-btn" onclick="genAI()">
        <i class="fas fa-robot"></i> Сгенерировать 2 варианта описания AI
      </button>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:12px 0">
        <div style="border:2px dashed var(--brd2);border-radius:10px;padding:15px;text-align:center;cursor:pointer;background:var(--bg3)" onclick="uploadMedia('photo')">
          <div style="font-size:22px;margin-bottom:3px">📷</div>
          <div style="font-size:11px;color:var(--t3)">Добавить фото</div>
          <div id="photo-count" style="font-size:10px;color:var(--orange);margin-top:2px"></div>
        </div>
        <div style="border:2px dashed var(--brd2);border-radius:10px;padding:15px;text-align:center;cursor:pointer;background:var(--bg3)" onclick="uploadMedia('video')">
          <div style="font-size:22px;margin-bottom:3px">🎬</div>
          <div style="font-size:11px;color:var(--t3)">Добавить видео</div>
          <div id="video-count" style="font-size:10px;color:var(--orange);margin-top:2px"></div>
        </div>
      </div>

      <button class="btn-primary" onclick="submitListing()">
        <i class="fas fa-rocket"></i> Опубликовать объект
      </button>
    </div>
  </div>
</div>

<div class="overlay" id="m-det" onclick="closeOvl(event,'m-det')">
  <div class="sheet" id="m-det-body"></div>
</div>

<div class="overlay" id="m-more" onclick="closeOvl(event,'m-more')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div class="sh-title">Меню</div>
    <div class="more-grid">
      <div class="more-item" onclick="closeM('m-more');go('s-aira');nav(document.getElementById('n-aira'))">
        <div class="more-ico">💬</div>
        <div class="more-name">Aira</div>
        <div class="more-sub">Чат риэлторов</div>
      </div>
      <div class="more-item" onclick="closeM('m-more');openM('m-add')">
        <div class="more-ico">🏠</div>
        <div class="more-name">Добавить</div>
        <div class="more-sub">Новый объект</div>
      </div>
      <div class="more-item" onclick="closeM('m-more');go('s-notif');nav(document.getElementById('n-notif'))">
        <div class="more-ico">🔔</div>
        <div class="more-name">Уведомления</div>
        <div class="more-sub" id="menu-notif-count">нет новых</div>
      </div>
      <div class="more-item" onclick="closeM('m-more');go('s-prof');nav(document.getElementById('n-prof'))">
        <div class="more-ico">👤</div>
        <div class="more-name">Профиль</div>
        <div class="more-sub">Мой аккаунт</div>
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
