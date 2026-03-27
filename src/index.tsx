import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './' }))

// Favicon — simple SVG emoji
app.get('/favicon.ico', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  c.header('Cache-Control', 'public, max-age=86400')
  return c.body('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><text y="26" font-size="28">🏢</text></svg>')
})

app.get('/api/listings', (c) => c.json({ listings: getMockListings() }))

app.post('/api/ai/describe', async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  return c.json({ description: generateAIDesc(body) })
})

app.post('/api/auth/register', async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  return c.json({ success: true, user: { id: 'u_' + Date.now(), ...body, verified: true } })
})

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  return c.json({ success: true, user: { id: 'u1', name: 'Айгерим К.', email: (body as any).email, verified: true, deals: 47, rating: 4.9 } })
})

app.get('/api/calendar', (c) => c.json({ events: getMockCalendar() }))

app.post('/api/chat/flai', async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  return c.json({ reply: getFlaiReply((body as any).message || '') })
})

// ─── helpers ────────────────────────────────────────────────
function generateAIDesc(o: any): string {
  const em: Record<string,string> = { apartment:'🏢', house:'🏡', commercial:'🏪', land:'🌳' }
  const e = em[o.type] || '🏠'
  const t = o.type === 'apartment' ? 'квартира' : o.type === 'house' ? 'дом' : o.type === 'commercial' ? 'коммерция' : 'объект'
  const ex = o.exchange ? '\n🔄 Рассмотрим обмен!' : ''
  const p = o.price ? (Number(o.price)/1e6).toFixed(1) + ' млн ₸' : 'по договору'
  return e + ' ' + (o.rooms ? o.rooms+'-комнатная ' : '') + t + (o.area ? ', '+o.area+' м²' : '') + ' в ' + (o.district||'Астане') + '!\n\n✨ Отличное состояние, развитая инфраструктура рядом.\n\n💰 Цена: ' + p + ex + '\n\n📞 Звоните — покажу без выходных!'
}

function getMockListings() {
  return [
    { id:1, type:'apartment', rooms:3, area:85, district:'Есиль', price:85000000, exchange:false, hasVideo:false, realtor:'Айгерим К.', rating:4.9, color:'#7c6ff7', tags:['Новострой','Ипотека'], desc:'Просторная 3-комнатная квартира с панорамным видом на Байтерек. Свежий ремонт, подземный паркинг.' },
    { id:2, type:'house', rooms:5, area:220, district:'Алматинский', price:150000000, exchange:true, hasVideo:true, realtor:'Данияр М.', rating:4.7, color:'#ff5c7c', tags:['Обмен','Срочно'], desc:'Просторный дом с участком 10 соток. Гараж на 2 машины, баня. Рассмотрим обмен!' },
    { id:3, type:'commercial', rooms:0, area:120, district:'Байконыр', price:65000000, exchange:false, hasVideo:false, realtor:'Сауле Т.', rating:5.0, color:'#3ecfac', tags:['Инвестиция'], desc:'Помещение первой линии с высоким трафиком. Идеально для ресторана, магазина или офиса.' },
    { id:4, type:'apartment', rooms:2, area:65, district:'Сарыарка', price:38000000, exchange:true, hasVideo:false, realtor:'Нурлан А.', rating:4.6, color:'#ffab30', tags:['Обмен','Ипотека'], desc:'Уютная 2-комнатная в тихом дворе. Рядом школа и детский сад. Рассмотрим обмен!' },
    { id:5, type:'apartment', rooms:1, area:42, district:'Есиль', price:29000000, exchange:false, hasVideo:true, realtor:'Айгерим К.', rating:4.9, color:'#7c6ff7', tags:['Студия'], desc:'Стильная студия со смарт-дизайном. Встроенная кухня, вид на ночной город.' },
  ]
}

function getMockCalendar() {
  const t = new Date()
  const dt = (d:number,h:number,m:number) => new Date(t.getFullYear(),t.getMonth(),t.getDate()+d,h,m).toISOString()
  return [
    { id:1, title:'🏠 Показ квартиры', time:dt(0,10,0), type:'showing', client:'Алия С.', note:'Взять ключи' },
    { id:2, title:'📞 Звонок клиенту', time:dt(0,14,30), type:'call', client:'Данияр М.', note:'Обсудить условия' },
    { id:3, title:'✍️ Подписание', time:dt(1,11,0), type:'deal', client:'Нурсулу К.', note:'Проверить документы' },
    { id:4, title:'🏢 Показ коммерции', time:dt(1,15,0), type:'showing', client:'Бизнес-клиент', note:'Взять план' },
  ]
}

function getFlaiReply(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('обмен')) return '🔄 Обмен очень актуален в 2026! Новые налоговые правила: срок освобождения — 2 года. Обмен помогает избежать налога 10–15%. Риэлтор поможет оформить!'
  if (m.includes('ипотека') || m.includes('кредит')) return '🏦 Работаем с Отбасы Банк, Халык и другими. Хотите расчёт ипотеки по конкретному объекту?'
  if (m.includes('цена') || m.includes('стоимость')) return '💰 Цена зависит от района, площади и состояния. Хотите, я попрошу риэлтора сделать оценку?'
  if (m.includes('налог')) return '💡 С 2026 года: срок без налога — 2 года. Ставка 10–15% при продаже раньше. Обмен — выгодная альтернатива!'
  return '😊 Понял вас! Риэлтор ответит в ближайшее время. Чем ещё могу помочь?'
}

// ─── main html ───────────────────────────────────────────────
app.get('/', (c) => c.html(getHTML()))

function getHTML(): string {
return `<!DOCTYPE html>
<html lang="ru" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Flapy</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<style>
/* ── VARS ───────────────── */
:root{
  --bg:#0a0a12;--bg2:#111120;--bg3:#1a1a2e;
  --card:#13131f;--inp:#0e0e1c;
  --t1:#fff;--t2:#a0a0c0;--t3:#4a4a70;
  --acc:#7c6ff7;--acc2:#3ecfac;--acc3:#ff5c7c;--acc4:#ffab30;
  --brd:rgba(124,111,247,.15);
  --nav:60px;--bot:76px;
}
[data-theme=light]{
  --bg:#f4f4fc;--bg2:#eaeaf6;--bg3:#ddddf0;
  --card:#fff;--inp:#ebebf8;
  --t1:#0d0d22;--t2:#44448a;--t3:#9898b8;
  --brd:rgba(100,90,220,.13);
}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;overflow:hidden;font-family:'Inter',sans-serif;background:var(--bg);color:var(--t1)}
button{border:none;cursor:pointer;font-family:inherit;background:none;color:inherit}
input,textarea,select{font-family:inherit;outline:none;color:var(--t1)}
::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:var(--acc);border-radius:2px}

/* ── LOADER ─────────────── */
#loader{position:fixed;inset:0;z-index:999;background:var(--bg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;transition:opacity .4s}
.ld-logo{font-size:56px;font-weight:900;letter-spacing:-3px;background:linear-gradient(135deg,var(--acc),var(--acc2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.ld-sub{font-size:14px;color:var(--t3);letter-spacing:.5px}
.ld-bar{width:100px;height:3px;background:var(--brd);border-radius:2px;overflow:hidden;margin-top:8px}
.ld-fill{height:100%;background:linear-gradient(90deg,var(--acc),var(--acc2));border-radius:2px;animation:ldA 1.4s ease forwards}
@keyframes ldA{from{width:0}to{width:100%}}

/* ── TOPBAR ─────────────── */
#topbar{position:fixed;top:0;left:0;right:0;height:var(--nav);z-index:100;display:flex;align-items:center;justify-content:space-between;padding:0 14px;background:var(--bg);border-bottom:1px solid var(--brd)}
[data-theme=light] #topbar{background:var(--bg)}
.logo{font-size:24px;font-weight:900;letter-spacing:-1.5px;background:linear-gradient(135deg,var(--acc),var(--acc2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.top-r{display:flex;align-items:center;gap:6px}
.ico-btn{width:34px;height:34px;border-radius:10px;background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--t2);position:relative;transition:background .15s}
.ico-btn:active{background:var(--acc);color:#fff}
.dot-badge{position:absolute;top:-1px;right:-1px;width:8px;height:8px;border-radius:50%;background:var(--acc3);border:2px solid var(--bg)}
.lang-btn{padding:0 10px;height:34px;border-radius:10px;background:var(--bg3);font-size:11px;font-weight:700;color:var(--t2);transition:background .15s}
.lang-btn:active{background:var(--acc);color:#fff}
.login-btn{padding:0 14px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;font-size:13px;font-weight:700}
.user-chip{display:flex;align-items:center;gap:6px;background:var(--bg3);border-radius:20px;padding:3px 10px 3px 3px;cursor:pointer}
.u-ava{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--acc),var(--acc2));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff}
.user-chip span{font-size:12px;font-weight:600}

/* ── MAIN AREA ──────────── */
#main{position:fixed;top:var(--nav);bottom:var(--bot);left:0;right:0;overflow:hidden}
.scr{position:absolute;inset:0;overflow-y:auto;display:none}
.scr.on{display:block}

/* ── FEED (TikTok) ──────── */
#s-feed{scroll-snap-type:y mandatory;overflow-y:scroll;-webkit-overflow-scrolling:touch}
.fcard{height:100%;scroll-snap-align:start;scroll-snap-stop:always;position:relative;overflow:hidden;display:flex;align-items:flex-end}

/* card background — colored gradient */
.fc-bg-layer{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:220px;opacity:.06;filter:blur(4px);pointer-events:none;z-index:0}
.fc-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.04) 0%,transparent 35%,rgba(0,0,0,.55) 65%,rgba(0,0,0,.92) 100%);z-index:1;pointer-events:none}
[data-theme=light] .fc-overlay{background:linear-gradient(to bottom,rgba(0,0,0,.02) 0%,transparent 30%,rgba(0,0,0,.45) 65%,rgba(0,0,0,.88) 100%)}

/* right action column — TikTok style */
.fc-side{position:absolute;right:10px;bottom:130px;z-index:3;display:flex;flex-direction:column;align-items:center;gap:22px}
.side-btn{display:flex;flex-direction:column;align-items:center;gap:4px}
.s-ico{width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.14);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:19px;color:#fff;transition:transform .15s,background .15s}
.s-ico:active,.s-ico.act{transform:scale(1.15)}
.s-ico.liked{background:var(--acc3);border-color:var(--acc3)}
.s-lbl{font-size:10px;font-weight:700;color:rgba(255,255,255,.8)}

/* badges */
.fc-badge-video{position:absolute;top:70px;right:10px;z-index:3;background:rgba(0,0,0,.5);backdrop-filter:blur(4px);border-radius:8px;padding:4px 9px;font-size:10px;font-weight:700;color:#fff;display:flex;align-items:center;gap:4px}
.fc-badge-exch{position:absolute;top:70px;left:0;z-index:3;background:linear-gradient(90deg,var(--acc2),#2bc0e4);color:#fff;font-size:10px;font-weight:700;padding:5px 12px;border-radius:0 8px 8px 0}

/* bottom info */
.fc-info{position:absolute;bottom:0;left:0;right:60px;z-index:3;padding:14px 14px 18px}
.fc-tags{display:flex;gap:5px;margin-bottom:8px;flex-wrap:wrap}
.fc-tag{padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(255,255,255,.13);color:#fff;border:1px solid rgba(255,255,255,.18)}
.fc-tag.x{background:rgba(62,207,172,.22);color:#3ecfac;border-color:rgba(62,207,172,.4)}
.fc-tag.u{background:rgba(255,92,124,.22);color:#ff8fa8;border-color:rgba(255,92,124,.4)}
.fc-loc{font-size:12px;color:rgba(255,255,255,.6);display:flex;align-items:center;gap:4px;margin-bottom:3px}
.fc-title{font-size:20px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:4px}
.fc-price{font-size:17px;font-weight:700;color:var(--acc4);margin-bottom:8px}
.fc-desc{font-size:12px;color:rgba(255,255,255,.6);line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:10px}

/* realtor pill */
.fc-realtor{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.1);backdrop-filter:blur(6px);border-radius:12px;padding:7px 10px}
.fc-ava{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:#fff;flex-shrink:0}
.fc-rname{font-size:12px;font-weight:700;color:#fff}
.fc-rstar{font-size:10px;color:#ffd700}
.fc-more{margin-left:auto;background:rgba(255,255,255,.2);border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;color:#fff;transition:background .15s}
.fc-more:active{background:var(--acc)}

/* ── SEARCH ─────────────── */
.srch-hd{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--brd);padding:10px 12px 0}
.srch-box{display:flex;align-items:center;gap:8px;background:var(--bg3);border-radius:12px;padding:9px 13px;margin-bottom:10px}
.srch-box input{flex:1;background:none;font-size:14px;color:var(--t1)}
.srch-box input::placeholder{color:var(--t3)}
.srch-box i{color:var(--t3);font-size:14px}
.chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:10px}
.chips::-webkit-scrollbar{height:0}
.chip{flex-shrink:0;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;background:var(--bg3);border:1.5px solid var(--brd);color:var(--t3);cursor:pointer;white-space:nowrap;transition:all .15s}
.chip.on,.chip:active{background:var(--acc);color:#fff;border-color:var(--acc)}
#srch-res{padding:10px 12px}
.s-card{display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--brd);border-radius:16px;padding:12px;margin-bottom:8px;cursor:pointer;transition:border-color .15s}
.s-card:active{border-color:var(--acc)}
.s-ico-b{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
.s-inf{flex:1;min-width:0}
.s-name{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.s-price{font-size:13px;font-weight:700;color:var(--acc4);margin:2px 0}
.s-sub{font-size:11px;color:var(--t3)}

/* ── CHAT ───────────────── */
.chat-wrap{display:flex;flex-direction:column;height:100%}
.chat-hd{flex-shrink:0;display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg);border-bottom:1px solid var(--brd)}
.ch-ava{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff;flex-shrink:0}
.ch-ava.flai{background:linear-gradient(135deg,var(--acc),var(--acc2))}
.ch-ava.aira{background:linear-gradient(135deg,var(--acc3),var(--acc4))}
.ch-name{font-size:15px;font-weight:800}
.ch-sub{font-size:11px;color:var(--acc2);display:flex;align-items:center;gap:4px}
.ch-sub::before{content:'';width:5px;height:5px;border-radius:50%;background:var(--acc2)}
.chat-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px}
.msg{display:flex;gap:7px;max-width:86%}
.msg.me{align-self:flex-end;flex-direction:row-reverse}
.m-ava{width:26px;height:26px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--acc),var(--acc2));display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff}
.bubble{padding:9px 13px;border-radius:16px;font-size:13px;line-height:1.5}
.msg:not(.me) .bubble{background:var(--bg3);border:1px solid var(--brd);border-bottom-left-radius:4px}
.msg.me .bubble{background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;border-bottom-right-radius:4px}
.m-time{font-size:10px;color:var(--t3);margin-top:3px;text-align:right}
.typing{display:flex;gap:4px;padding:6px 10px}
.dot{width:6px;height:6px;border-radius:50%;background:var(--t3);animation:ty 1.2s infinite}
.dot:nth-child(2){animation-delay:.2s}.dot:nth-child(3){animation-delay:.4s}
@keyframes ty{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
.chat-inp-row{flex-shrink:0;display:flex;gap:8px;align-items:flex-end;padding:8px 12px;background:var(--bg);border-top:1px solid var(--brd)}
.c-inp{flex:1;min-height:38px;max-height:90px;padding:9px 13px;border-radius:18px;background:var(--bg3);border:1.5px solid var(--brd);font-size:13px;resize:none;line-height:1.4;transition:border-color .15s}
.c-inp:focus{border-color:var(--acc)}
.c-send{width:38px;height:38px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;font-size:14px;display:flex;align-items:center;justify-content:center;transition:transform .15s}
.c-send:active{transform:scale(1.1)}
.c-send.aira{background:linear-gradient(135deg,var(--acc3),var(--acc4))}

/* Aira threads */
.thread{background:var(--card);border:1px solid var(--brd);border-radius:14px;overflow:hidden;margin-bottom:10px}
.th-hd{display:flex;align-items:center;gap:9px;padding:11px 12px;cursor:pointer}
.th-ava{width:32px;height:32px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff}
.th-body{padding:10px 12px;display:none;border-top:1px solid var(--brd)}
.prop-pill{display:inline-flex;align-items:center;gap:4px;background:rgba(124,111,247,.12);border:1px solid rgba(124,111,247,.25);border-radius:8px;padding:3px 9px;font-size:11px;font-weight:600;color:var(--acc);margin-bottom:7px}

/* Flai banner */
.info-banner{display:flex;align-items:flex-start;gap:8px;background:rgba(124,111,247,.08);border:1px solid rgba(124,111,247,.18);border-radius:12px;padding:10px 12px;margin-bottom:10px;font-size:12px;line-height:1.5;color:var(--t2)}
.ib-ico{font-size:16px;flex-shrink:0}
.role-row{margin-left:auto;display:flex;gap:4px}
.role-btn{padding:5px 10px;border-radius:8px;font-size:11px;font-weight:700;background:var(--bg3);color:var(--t3);cursor:pointer;transition:all .15s}
.role-btn.on{background:var(--acc);color:#fff}

/* ── CALENDAR ───────────── */
.cal-wrap{padding:14px}
.cal-title{font-size:22px;font-weight:900;margin-bottom:4px}
.cal-date{font-size:12px;color:var(--t3);margin-bottom:14px}
.sec-lbl{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;margin-top:16px}
.ev-card{display:flex;align-items:stretch;gap:10px;background:var(--card);border:1px solid var(--brd);border-radius:14px;padding:12px;margin-bottom:8px;cursor:pointer;transition:border-color .15s}
.ev-card:active{border-color:var(--acc)}
.ev-time{min-width:46px;background:var(--bg3);border-radius:10px;display:flex;align-items:center;justify-content:center;padding:6px}
.ev-hm{font-size:14px;font-weight:800;color:var(--acc)}
.ev-line{width:3px;border-radius:2px;flex-shrink:0}
.ev-inf{flex:1}
.ev-ttl{font-size:13px;font-weight:700;margin-bottom:2px}
.ev-cli{font-size:11px;color:var(--t2);margin-bottom:4px}
.ev-note{font-size:11px;color:var(--t3);background:var(--bg3);border-radius:6px;padding:4px 8px;display:inline-block}
.add-btn{width:100%;padding:12px;border-radius:12px;background:var(--bg3);border:2px dashed var(--brd);color:var(--t3);font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;margin-bottom:14px;transition:all .15s}
.add-btn:active{border-color:var(--acc);color:var(--acc)}

/* rank */
.rank-card{display:flex;align-items:center;gap:10px;background:var(--card);border:1px solid var(--brd);border-radius:12px;padding:12px;margin-bottom:7px}
.rank-num{width:34px;height:34px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900}
.rank-bar{height:3px;border-radius:2px;background:linear-gradient(90deg,var(--acc),var(--acc2));margin-top:3px}

/* ── PROFILE ─────────────── */
.prof-wrap{padding:14px}
.prof-hero{background:linear-gradient(135deg,var(--acc),var(--acc2));border-radius:20px;padding:20px;margin-bottom:14px;position:relative;overflow:hidden}
.ph-ava{width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:8px}
.ph-name{font-size:18px;font-weight:800;color:#fff}
.ph-tag{font-size:11px;color:rgba(255,255,255,.7);margin-top:2px}
.ph-stats{display:flex;gap:8px;margin-top:12px}
.ph-stat{flex:1;background:rgba(255,255,255,.12);border-radius:10px;padding:8px;text-align:center}
.ph-val{font-size:18px;font-weight:800;color:#fff}
.ph-lbl{font-size:10px;color:rgba(255,255,255,.6);margin-top:1px}
.mnu-sec{margin-bottom:18px}
.mnu-lbl{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
.mnu-item{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--brd);border-radius:14px;padding:12px;margin-bottom:7px;cursor:pointer;transition:border-color .15s}
.mnu-item:active{border-color:var(--acc)}
.mnu-ico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.mnu-name{font-size:13px;font-weight:600}
.mnu-sub{font-size:11px;color:var(--t3);margin-top:1px}

/* ── NOTIFS ─────────────── */
.notif-wrap{padding:14px}
.notif-title{font-size:22px;font-weight:900;margin-bottom:14px}
.notif-item{display:flex;gap:10px;background:var(--card);border:1px solid var(--brd);border-radius:14px;padding:12px;margin-bottom:8px}
.notif-ico{font-size:20px;flex-shrink:0;margin-top:1px}
.notif-txt{font-size:13px;line-height:1.5;color:var(--t2)}
.notif-txt b{color:var(--t1)}
.notif-time{font-size:10px;color:var(--t3);margin-top:3px}

/* ── BOTTOM NAV ─────────── */
#botbar{
  position:fixed;bottom:0;left:0;right:0;height:var(--bot);z-index:100;
  background:var(--bg);border-top:1px solid var(--brd);
  display:flex;align-items:center;padding:0 4px 8px;
}
[data-theme=light] #botbar{background:var(--bg)}
.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:var(--t3);transition:color .15s;padding:6px 2px;border-radius:12px;position:relative}
.nav-item i{font-size:20px;transition:transform .15s}
.nav-item span{font-size:9px;font-weight:700;letter-spacing:.2px}
.nav-item.on{color:var(--acc)}
.nav-item.on i{transform:scale(1.12)}
.nav-plus-btn{flex-shrink:0;width:50px;height:50px;border-radius:16px;background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;font-size:22px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(124,111,247,.45);transition:transform .15s,box-shadow .15s}
.nav-plus-btn:active{transform:scale(1.08);box-shadow:0 6px 28px rgba(124,111,247,.65)}
.n-badge{position:absolute;top:3px;right:calc(50% - 18px);min-width:15px;height:15px;border-radius:8px;background:var(--acc3);color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 3px}

/* ── MODALS ─────────────── */
.ovl{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .25s}
.ovl.on{opacity:1;pointer-events:all}
.sheet{width:100%;max-width:480px;max-height:92vh;background:var(--bg2);border-radius:22px 22px 0 0;overflow-y:auto;padding-bottom:20px;transform:translateY(24px);transition:transform .25s}
.ovl.on .sheet{transform:translateY(0)}
.sh-hnd{width:32px;height:4px;border-radius:2px;background:var(--brd);margin:10px auto 12px}
.sh-title{font-size:18px;font-weight:800;padding:0 18px 12px}
.sh-body{padding:0 18px}
.flabel{font-size:12px;font-weight:600;color:var(--t3);margin-bottom:4px;display:block}
.finput{width:100%;padding:11px 13px;border-radius:11px;background:var(--inp);border:1.5px solid var(--brd);font-size:13px;transition:border-color .15s;margin-bottom:12px;color:var(--t1)}
.finput:focus{border-color:var(--acc)}
select.finput{appearance:none;cursor:pointer}
textarea.finput{resize:none;min-height:70px;line-height:1.5}
.fg2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.btn-main{width:100%;padding:13px;border-radius:13px;background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;font-size:14px;font-weight:700;transition:opacity .15s}
.btn-main:active{opacity:.85}
.btn-sec{width:100%;padding:12px;border-radius:12px;background:var(--inp);border:1.5px solid var(--brd);font-size:13px;font-weight:600;margin-top:8px}
.btn-out{width:100%;padding:11px;border-radius:12px;background:none;border:1.5px solid var(--acc);color:var(--acc);font-size:13px;font-weight:600;margin-top:6px;transition:all .15s}
.btn-out:active{background:var(--acc);color:#fff}
.tab-row{display:flex;background:var(--inp);border-radius:11px;padding:3px;margin-bottom:16px}
.tab{flex:1;padding:8px;border-radius:8px;font-size:13px;font-weight:700;color:var(--t3);cursor:pointer;text-align:center;transition:all .15s}
.tab.on{background:var(--acc);color:#fff}
.banner{display:flex;align-items:flex-start;gap:8px;background:rgba(62,207,172,.08);border:1px solid rgba(62,207,172,.2);border-radius:11px;padding:10px 12px;margin-bottom:12px;font-size:12px;line-height:1.5;color:var(--t2)}
.b-ico{font-size:16px;flex-shrink:0}
.ai-badge{display:inline-flex;align-items:center;gap:3px;background:rgba(124,111,247,.15);border-radius:5px;padding:1px 7px;font-size:10px;font-weight:700;color:var(--acc)}
.ai-box{background:var(--inp);border:1.5px solid rgba(124,111,247,.25);border-radius:11px;padding:10px;margin-top:6px;font-size:12px;line-height:1.6;color:var(--t2);white-space:pre-wrap}
.ai-btns{display:flex;gap:6px;margin-top:6px}
.ai-btn{padding:5px 10px;border-radius:8px;font-size:11px;font-weight:600;background:var(--bg3);border:1px solid var(--brd);color:var(--t2);cursor:pointer;transition:all .15s}
.ai-btn:active{background:var(--acc);color:#fff;border-color:var(--acc)}
.ttax{display:inline-flex;align-items:center;background:rgba(255,171,48,.12);border:1px solid rgba(255,171,48,.25);border-radius:5px;padding:1px 7px;font-size:10px;font-weight:600;color:var(--acc4)}

/* detail modal */
.det-vis{height:180px;display:flex;align-items:center;justify-content:center;font-size:80px;opacity:.2}
.det-price{font-size:24px;font-weight:900;color:var(--acc4);padding:10px 18px 4px}
.det-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:0 18px 12px}
.det-cell{background:var(--inp);border-radius:11px;padding:11px;text-align:center}
.det-val{font-size:16px;font-weight:800;color:var(--acc)}
.det-lbl{font-size:10px;color:var(--t3);margin-top:2px}
.det-desc{padding:0 18px 14px;font-size:13px;line-height:1.7;color:var(--t2)}
.det-cta{display:flex;gap:8px;padding:0 18px}
.cta-c{flex:1;padding:13px;border-radius:13px;color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px}
.cta-c.call{background:linear-gradient(135deg,var(--acc2),#2bc0e4)}
.cta-c.chat{background:linear-gradient(135deg,var(--acc),var(--acc2))}

/* empty */
.empty{text-align:center;padding:50px 20px}
.empty-ico{font-size:48px;opacity:.3;margin-bottom:10px}
.empty-t{font-size:16px;font-weight:700;margin-bottom:4px}
.empty-s{font-size:13px;color:var(--t3)}

/* toast */
#toast{position:fixed;bottom:88px;left:50%;transform:translateX(-50%) translateY(8px);background:var(--bg3);border:1px solid var(--brd);border-radius:12px;padding:9px 16px;font-size:13px;font-weight:600;white-space:nowrap;z-index:500;opacity:0;transition:all .22s;box-shadow:0 6px 24px rgba(0,0,0,.3)}
#toast.on{opacity:1;transform:translateX(-50%) translateY(0)}

/* anim */
.su{animation:su .28s ease}
@keyframes su{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
</style>
</head>
<body>

<!-- LOADER -->
<div id="loader">
  <div class="ld-logo">Flapy</div>
  <div class="ld-sub">Платформа риэлторов Астаны</div>
  <div class="ld-bar"><div class="ld-fill"></div></div>
</div>

<!-- TOPBAR -->
<div id="topbar">
  <div class="logo">Flapy</div>
  <div class="top-r">
    <button class="lang-btn" id="btn-lang" onclick="toggleLang()">🇰🇿 Қаз</button>
    <button class="ico-btn" id="btn-theme" onclick="toggleTheme()"><i class="fas fa-moon"></i></button>
    <button class="ico-btn" onclick="go('s-notif');nav(null)"><i class="fas fa-bell"></i><span class="dot-badge"></span></button>
    <div id="auth-slot"><button class="login-btn" onclick="openM('m-auth')">Войти</button></div>
  </div>
</div>

<!-- MAIN -->
<div id="main">

  <!-- FEED -->
  <div id="s-feed" class="scr on"></div>

  <!-- SEARCH -->
  <div id="s-search" class="scr">
    <div class="srch-hd">
      <div class="srch-box">
        <i class="fas fa-search"></i>
        <input id="srch-in" type="text" placeholder="Район, тип, цена..." oninput="doSearch()">
      </div>
      <div class="chips" id="chips-row">
        <div class="chip on" onclick="setChip(this,'all')">Все</div>
        <div class="chip" onclick="setChip(this,'apartment')">🏢 Квартиры</div>
        <div class="chip" onclick="setChip(this,'house')">🏡 Дома</div>
        <div class="chip" onclick="setChip(this,'commercial')">🏪 Коммерция</div>
        <div class="chip" onclick="setChip(this,'exchange')">🔄 Обмен</div>
        <div class="chip" onclick="setChip(this,'video')">🎬 Видео</div>
      </div>
    </div>
    <div id="srch-res"></div>
  </div>

  <!-- FLAI -->
  <div id="s-flai" class="scr">
    <div class="chat-wrap">
      <div class="chat-hd">
        <div class="ch-ava flai">F</div>
        <div style="flex:1">
          <div class="ch-name">Flai <span style="font-size:11px;color:var(--acc2);font-weight:500">AI-помощник</span></div>
          <div class="ch-sub">Онлайн</div>
        </div>
        <div class="role-row">
          <button class="role-btn on" id="rt-buyer" onclick="setRole('buyer',this)">👤 Клиент</button>
          <button class="role-btn" id="rt-realtor" onclick="setRole('realtor',this)">🏠 Риэлтор</button>
        </div>
      </div>
      <div class="chat-msgs" id="flai-msgs">
        <div class="info-banner"><span class="ib-ico">🔒</span><span>Продавец и покупатель не видят друг друга — только риэлтор видит всё</span></div>
        <div class="msg su">
          <div class="m-ava">F</div>
          <div><div class="bubble">Привет! Я Flai 👋 Помогу с вопросами по недвижимости и свяжу с риэлтором.</div><div class="m-time">сейчас</div></div>
        </div>
        <div class="msg su">
          <div class="m-ava">F</div>
          <div><div class="bubble">💡 <b>Новость 2026:</b> срок без налога при продаже — <b>2 года</b>. 🔄 Обмен поможет сэкономить 10–15%!</div><div class="m-time">сейчас</div></div>
        </div>
      </div>
      <div class="chat-inp-row">
        <textarea class="c-inp" id="flai-inp" rows="1" placeholder="Напишите сообщение..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendFlai()}"></textarea>
        <button class="c-send" onclick="sendFlai()"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  </div>

  <!-- AIRA -->
  <div id="s-aira" class="scr">
    <div class="chat-wrap">
      <div class="chat-hd">
        <div class="ch-ava aira">A</div>
        <div>
          <div class="ch-name">Aira <span style="font-size:11px;color:var(--acc3);font-weight:500">Чат риэлторов</span></div>
          <div class="ch-sub" style="color:var(--acc3)">47 онлайн</div>
        </div>
      </div>
      <div class="chat-msgs" id="aira-msgs">
        <div class="info-banner" style="background:rgba(255,92,124,.07);border-color:rgba(255,92,124,.18)">
          <span class="ib-ico">🔒</span><span>Только для верифицированных риэлторов Flapy</span>
        </div>
        <div class="thread su">
          <div class="th-hd" onclick="toggleThread(this)">
            <div class="th-ava" style="background:linear-gradient(135deg,var(--acc),var(--acc2))">А</div>
            <div style="flex:1"><div style="font-size:13px;font-weight:700">Айгерим К. <span style="font-size:11px;color:var(--t3);font-weight:400">10 мин</span></div><div style="font-size:11px;color:var(--t2)">3к Есиль — ищу покупателя 🤝</div></div>
            <i class="fas fa-chevron-down" style="color:var(--t3);font-size:11px"></i>
          </div>
          <div class="th-body">
            <div class="prop-pill"><i class="fas fa-link"></i> 3к · 85м² · 85 млн · Есиль</div>
            <p style="font-size:12px;color:var(--t2);margin-bottom:8px">Клиент готов к ипотеке. Комиссию делим 50/50 🤝</p>
          </div>
        </div>
        <div class="thread su">
          <div class="th-hd" onclick="toggleThread(this)">
            <div class="th-ava" style="background:linear-gradient(135deg,var(--acc3),var(--acc4))">Н</div>
            <div style="flex:1"><div style="font-size:13px;font-weight:700">Нурлан А. <span style="font-size:11px;color:var(--t3);font-weight:400">25 мин</span></div><div style="font-size:11px;color:var(--t2)">🔄 Обмен 2к на 3к с доплатой</div></div>
            <span class="ttax">🔄</span>
          </div>
          <div class="th-body">
            <div class="prop-pill"><i class="fas fa-link"></i> 2к · 65м² · 38 млн · Сарыарка</div>
            <p style="font-size:12px;color:var(--t2)">Клиент готов доплатить до 20 млн. Без налога! Кто поможет?</p>
          </div>
        </div>
        <div class="thread su">
          <div class="th-hd" onclick="toggleThread(this)">
            <div class="th-ava" style="background:linear-gradient(135deg,var(--acc2),#2bc0e4)">С</div>
            <div style="flex:1"><div style="font-size:13px;font-weight:700">Сауле Т. <span style="font-size:11px;color:var(--t3);font-weight:400">1 час</span></div><div style="font-size:11px;color:var(--t2)">🏪 Коммерция Байконыр — 3 звонка!</div></div>
            <i class="fas fa-chevron-down" style="color:var(--t3);font-size:11px"></i>
          </div>
          <div class="th-body">
            <div class="prop-pill"><i class="fas fa-link"></i> 120м² · 65 млн · Байконыр</div>
            <p style="font-size:12px;color:var(--t2)">Видео-тур работает! Выкладываю полный обзор 🎬</p>
          </div>
        </div>
      </div>
      <div class="chat-inp-row">
        <textarea class="c-inp" id="aira-inp" rows="1" placeholder="Поделитесь объектом с коллегами..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendAira()}"></textarea>
        <button class="c-send aira" onclick="sendAira()"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  </div>

  <!-- CALENDAR -->
  <div id="s-cal" class="scr"><div class="cal-wrap" id="cal-body"></div></div>

  <!-- PROFILE -->
  <div id="s-prof" class="scr"><div class="prof-wrap" id="prof-body"></div></div>

  <!-- NOTIFS -->
  <div id="s-notif" class="scr">
    <div class="notif-wrap">
      <div class="notif-title">Уведомления</div>
      <div class="notif-item su"><span class="notif-ico">🤖</span><div><div class="notif-txt"><b>Flai:</b> Показ через 30 мин! Не забудьте ключи 🔑</div><div class="notif-time">только что</div></div></div>
      <div class="notif-item su"><span class="notif-ico">💬</span><div><div class="notif-txt"><b>Aira:</b> Данияр М. ответил — есть покупатель!</div><div class="notif-time">10 мин назад</div></div></div>
      <div class="notif-item su"><span class="notif-ico">❤️</span><div><div class="notif-txt">3 человека добавили объект в избранное</div><div class="notif-time">сегодня</div></div></div>
      <div class="notif-item su"><span class="notif-ico">✍️</span><div><div class="notif-txt"><b>Flai:</b> Завтра подписание с Нурсулу К. в 11:00</div><div class="notif-time">вчера</div></div></div>
      <div class="notif-item su" style="border-color:rgba(255,171,48,.25)"><span class="notif-ico">💡</span><div><div class="notif-txt" style="color:var(--acc4)">Клиент держит квартиру менее 2 лет — предложите обмен!</div><div class="notif-time">совет дня</div></div></div>
    </div>
  </div>

</div>

<!-- BOTTOM NAV -->
<div id="botbar">
  <div class="nav-item on" id="n-feed" onclick="go('s-feed');nav(this)">
    <i class="fas fa-film"></i><span>Лента</span>
  </div>
  <div class="nav-item" id="n-search" onclick="go('s-search');nav(this)">
    <i class="fas fa-search"></i><span>Поиск</span>
  </div>
  <button class="nav-plus-btn" onclick="needAuth(function(){openM('m-add')})">
    <i class="fas fa-plus"></i>
  </button>
  <div class="nav-item" id="n-flai" onclick="go('s-flai');nav(this)" style="position:relative">
    <i class="fas fa-robot"></i><span>Flai</span>
    <span class="n-badge">2</span>
  </div>
  <div class="nav-item" id="n-more" onclick="showMore()" style="position:relative">
    <i class="fas fa-grip-horizontal"></i><span>Ещё</span>
  </div>
</div>

<!-- MODALS ──────────────────────────────────────── -->

<!-- AUTH -->
<div class="ovl" id="m-auth" onclick="closeOvl(event,'m-auth')">
  <div class="sheet">
    <div class="sh-hnd"></div>
    <div style="padding:0 18px 18px">
      <div class="tab-row">
        <div class="tab on" id="at-in" onclick="authTab('in')">Войти</div>
        <div class="tab" id="at-up" onclick="authTab('up')">Регистрация</div>
      </div>
      <div id="af-in">
        <label class="flabel">Email</label>
        <input class="finput" type="email" id="l-email" placeholder="you@mail.com">
        <label class="flabel">Пароль</label>
        <input class="finput" type="password" id="l-pass" placeholder="••••••••">
        <button class="btn-main" onclick="doLogin()">Войти 🚀</button>
        <button class="btn-sec" onclick="authTab('up')">Нет аккаунта? Зарегистрироваться</button>
      </div>
      <div id="af-up" style="display:none">
        <div class="banner"><span class="b-ico">🏠</span><span>Только для риэлторов — статус присваивается сразу</span></div>
        <label class="flabel">Имя и фамилия</label>
        <input class="finput" type="text" id="r-name" placeholder="Айгерим Касымова">
        <label class="flabel">Email</label>
        <input class="finput" type="email" id="r-email" placeholder="you@mail.com">
        <label class="flabel">Телефон</label>
        <input class="finput" type="tel" id="r-phone" placeholder="+7 777 000 00 00">
        <label class="flabel">Агентство</label>
        <select class="finput" id="r-agency">
          <option value="">Выбрать...</option>
          <option>Самозанятый</option><option>Century 21</option><option>Etagi</option><option>Royal Group</option><option>Другое</option>
        </select>
        <label class="flabel">Пароль</label>
        <input class="finput" type="password" id="r-pass" placeholder="Минимум 8 символов">
        <button class="btn-main" onclick="doReg()">Зарегистрироваться 🎉</button>
        <button class="btn-sec" onclick="authTab('in')">Уже есть аккаунт</button>
      </div>
    </div>
  </div>
</div>

<!-- ADD LISTING -->
<div class="ovl" id="m-add" onclick="closeOvl(event,'m-add')">
  <div class="sheet">
    <div class="sh-hnd"></div>
    <div class="sh-title">Добавить объект <span class="ai-badge"><i class="fas fa-robot"></i> AI</span></div>
    <div class="sh-body">
      <label class="flabel">Тип объекта</label>
      <select class="finput" id="a-type">
        <option value="apartment">🏢 Квартира</option>
        <option value="house">🏡 Дом</option>
        <option value="commercial">🏪 Коммерция</option>
        <option value="land">🌳 Участок</option>
      </select>
      <div class="fg2">
        <div><label class="flabel">Комнаты</label><select class="finput" id="a-rooms"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5+</option></select></div>
        <div><label class="flabel">Площадь м²</label><input class="finput" type="number" id="a-area" placeholder="85"></div>
      </div>
      <label class="flabel">Район</label>
      <select class="finput" id="a-district">
        <option>Есиль</option><option>Алматинский</option><option>Сарыарка</option><option>Байконыр</option><option>Нура</option>
      </select>
      <label class="flabel">Цена ₸</label>
      <input class="finput" type="number" id="a-price" placeholder="85000000">
      <div style="display:flex;align-items:center;gap:8px;background:var(--inp);border-radius:11px;padding:11px 13px;border:1.5px solid var(--brd);margin-bottom:12px">
        <input type="checkbox" id="a-exch" style="width:17px;height:17px;accent-color:var(--acc2)">
        <label for="a-exch" style="font-size:13px;font-weight:600;cursor:pointer">🔄 Рассмотрим обмен <span class="ttax">2026</span></label>
      </div>
      <label class="flabel">Описание <span class="ai-badge"><i class="fas fa-magic"></i> AI</span></label>
      <textarea class="finput" id="a-desc" placeholder="Опишите объект или сгенерируйте с AI..."></textarea>
      <div id="ai-box-wrap" style="display:none">
        <div class="ai-box" id="ai-txt"></div>
        <div class="ai-btns">
          <button class="ai-btn" onclick="useAI()">✅ Применить</button>
          <button class="ai-btn" onclick="genAI()">🔄 Ещё раз</button>
          <button class="ai-btn" onclick="document.getElementById('ai-box-wrap').style.display='none'">✕</button>
        </div>
      </div>
      <button class="btn-out" onclick="genAI()"><i class="fas fa-robot"></i> Сгенерировать описание AI</button>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;margin-bottom:12px">
        <div style="border:2px dashed var(--brd);border-radius:11px;padding:16px;text-align:center;cursor:pointer" onclick="toast('📷 Загрузка фото')"><div style="font-size:24px;margin-bottom:3px">📷</div><div style="font-size:11px;color:var(--t3)">Добавить фото</div></div>
        <div style="border:2px dashed var(--brd);border-radius:11px;padding:16px;text-align:center;cursor:pointer" onclick="toast('🎬 Загрузка видео')"><div style="font-size:24px;margin-bottom:3px">🎬</div><div style="font-size:11px;color:var(--t3)">Добавить видео</div></div>
      </div>
      <button class="btn-main" onclick="submitListing()"><i class="fas fa-rocket"></i> Опубликовать</button>
    </div>
  </div>
</div>

<!-- DETAIL -->
<div class="ovl" id="m-det" onclick="closeOvl(event,'m-det')">
  <div class="sheet" id="m-det-body"></div>
</div>

<!-- MORE MENU -->
<div class="ovl" id="m-more" onclick="closeOvl(event,'m-more')">
  <div class="sheet">
    <div class="sh-hnd"></div>
    <div class="sh-title">Меню</div>
    <div style="padding:0 18px 18px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div onclick="closeM('m-more');go('s-aira');nav(null);needAuthAira()" style="background:var(--card);border:1px solid var(--brd);border-radius:16px;padding:18px;cursor:pointer;text-align:center">
        <div style="font-size:28px;margin-bottom:6px">💬</div>
        <div style="font-size:13px;font-weight:700">Aira</div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px">Чат риэлторов</div>
      </div>
      <div onclick="closeM('m-more');go('s-cal');nav(null)" style="background:var(--card);border:1px solid var(--brd);border-radius:16px;padding:18px;cursor:pointer;text-align:center">
        <div style="font-size:28px;margin-bottom:6px">📅</div>
        <div style="font-size:13px;font-weight:700">Календарь</div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px">Расписание</div>
      </div>
      <div onclick="closeM('m-more');go('s-prof');nav(null)" style="background:var(--card);border:1px solid var(--brd);border-radius:16px;padding:18px;cursor:pointer;text-align:center">
        <div style="font-size:28px;margin-bottom:6px">👤</div>
        <div style="font-size:13px;font-weight:700">Профиль</div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px">Мой аккаунт</div>
      </div>
      <div onclick="closeM('m-more');go('s-notif');nav(null)" style="background:var(--card);border:1px solid var(--brd);border-radius:16px;padding:18px;cursor:pointer;text-align:center;position:relative">
        <div style="font-size:28px;margin-bottom:6px">🔔</div>
        <div style="font-size:13px;font-weight:700">Уведомления</div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px">3 новых</div>
      </div>
    </div>
  </div>
</div>

<!-- EVENT -->
<div class="ovl" id="m-ev" onclick="closeOvl(event,'m-ev')">
  <div class="sheet">
    <div class="sh-hnd"></div>
    <div class="sh-title">Новое событие 📅</div>
    <div class="sh-body">
      <label class="flabel">Тип</label>
      <select class="finput" id="ev-type">
        <option value="showing">🏠 Показ</option>
        <option value="call">📞 Звонок</option>
        <option value="deal">✍️ Подписание</option>
        <option value="meeting">🤝 Встреча</option>
      </select>
      <label class="flabel">Заголовок</label>
      <input class="finput" type="text" id="ev-title" placeholder="Показ 3к в Есиле">
      <label class="flabel">Клиент</label>
      <input class="finput" type="text" id="ev-client" placeholder="Имя клиента">
      <div class="fg2">
        <div><label class="flabel">Дата</label><input class="finput" type="date" id="ev-date"></div>
        <div><label class="flabel">Время</label><input class="finput" type="time" id="ev-time"></div>
      </div>
      <label class="flabel">Заметка</label>
      <textarea class="finput" id="ev-note" placeholder="Взять ключи..."></textarea>
      <div class="banner"><span class="b-ico">🤖</span><span>Flai напомнит за 30 минут!</span></div>
      <button class="btn-main" onclick="saveEv()">Добавить ✅</button>
    </div>
  </div>
</div>

<!-- TOAST -->
<div id="toast"></div>

<script src="/static/app.js"></script>
</body>
</html>`
}

export default app
