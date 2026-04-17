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
  return c.json({ success: true, user: { id: 'u1', name: demo ? 'Айгерим Касымова' : 'Риэлтор', email, verified: true, deals: 47, rating: 4.9, agency: 'Century 21', reviews: 23 } })
})
app.get('/api/calendar', (c) => c.json({ events: getMockCalendar() }))
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
  return `✨ ${o.rooms ? o.rooms+'-комнатная ' : ''}${t}${o.area ? ', '+o.area+' м²' : ''} в ${o.district || 'Астане'}!\n\n🏆 ${feat}\n💰 Цена: ${p}${ex}\n\n📍 ${o.district || 'Есиль'}, ${o.city || 'Астана'}\n📞 Звоните — покажу в любое удобное время!`
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
    { id:1, type:'apartment', rooms:3, area:85, district:'Есильский', city:'Астана', price:78500000, exchange:false, hasVideo:false, realtor:'Айгерим К.', realtorId:'r1', realtorFull:'Айгерим Касымова', rating:4.9, deals:47, agency:'Century 21', tags:['Новострой'], badge:'Новое', desc:'Просторная 3-комнатная с панорамным видом. Ремонт евро-класса.', phone:'+7 701 234 56 78' },
    { id:2, type:'apartment', rooms:3, area:82, district:'Алматинский', city:'Астана', price:62000000, exchange:false, hasVideo:false, realtor:'Данияр М.', realtorId:'r2', realtorFull:'Данияр Мусин', rating:4.7, deals:32, agency:'Etagi', tags:['Горящее'], badge:'Горящее', desc:'Новый ЖК, полная отделка, никто не жил.', phone:'+7 702 345 67 89' }
  ]
}

function getMockCalendar() {
  const t = new Date()
  const dt = (d:number,h:number,m:number) => new Date(t.getFullYear(),t.getMonth(),t.getDate()+d,h,m).toISOString()
  return [
    { id:1, title:'Показ квартиры 3к Есиль', time:dt(0,10,0), type:'showing', client:'Алия С.', note:'Взять ключи от 401', color:'#F47B20' },
    { id:2, title:'Звонок клиенту', time:dt(0,14,30), type:'call', client:'Данияр М.', note:'Обсудить ипотеку Halyk', color:'#27AE60' }
  ]
}

// ─── MAIN HTML (FIXED) ────────────────────────────────────────
app.get('/', (c) => c.html(getHTML()))

function getHTML(): string {
return `<!DOCTYPE html>
<html lang="ru" data-theme="light" data-lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#FFFFFF">
<title>Flapy™ — Умный помощник по жилью</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<style>
:root{--white:#FFFFFF;--bg:#F5F5F7;--bg2:#FFFFFF;--bg3:#F0F0F5;--navy:#1E2D5A;--navy2:#2E4A85;--orange:#F47B20;--orange2:#FF9A3C;--green:#27AE60;--red:#E74C3C;--purple:#9B59B6;--t1:#1A1A2E;--t2:#6B7280;--t3:#9CA3AF;--brd:#E5E7EB;--brd2:#D1D5DB;--sh:0 1px 4px rgba(0,0,0,.06),0 2px 10px rgba(0,0,0,.05);--sh2:0 4px 20px rgba(0,0,0,.1);--nav-h:56px;--bot-h:64px;--r:14px;--max:480px}
[data-theme=dark]{--bg:#0F0F1A;--bg2:#161626;--bg3:#1E1E35;--t1:#F0F0FF;--t2:#9090C0;--t3:#5A5A80;--brd:rgba(255,255,255,.1);--brd2:rgba(255,255,255,.15)}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;background:var(--bg);font-family:'Inter',-apple-system,sans-serif;color:var(--t1);overflow:hidden;-webkit-font-smoothing:antialiased}
button{border:none;cursor:pointer;font-family:inherit;background:none;color:inherit}
input,textarea,select{font-family:inherit;outline:none;color:var(--t1);background:none}
::-webkit-scrollbar{width:0;height:0}
#app-shell{position:fixed;inset:0;display:flex;justify-content:center;align-items:flex-start;background:#E0E0EC}
[data-theme=dark]#app-shell{background:#08080F}
#app-wrap{position:relative;width:100%;max-width:var(--max);height:100%;background:var(--bg);overflow:hidden;box-shadow:0 0 60px rgba(0,0,0,.12)}
@media(min-width:520px){#app-wrap{border-left:1px solid var(--brd);border-right:1px solid var(--brd)}}
#loader{position:absolute;inset:0;z-index:999;background:var(--bg2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;transition:opacity .3s}
.ld-icon{width:52px;height:52px;background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(30,45,90,.25)}
.ld-name{font-size:30px;font-weight:900;color:var(--navy);letter-spacing:-1px}
[data-theme=dark].ld-name{color:#fff}
.ld-tm{font-size:10px;color:var(--orange);vertical-align:super;font-weight:700}
.ld-sub{font-size:13px;color:var(--t3)}
.ld-bar-wrap{width:72px;height:3px;background:var(--bg3);border-radius:2px;overflow:hidden;margin-top:4px}
.ld-bar{height:100%;background:linear-gradient(90deg,var(--navy),var(--orange));border-radius:2px;animation:ldA 1.4s ease forwards}
@keyframes ldA{from{width:0}to{width:100%}}
#topbar{position:absolute;top:0;left:0;right:0;height:var(--nav-h);z-index:50;background:var(--bg2);border-bottom:1px solid var(--brd);display:flex;align-items:center;padding:0 14px;gap:10px}
.logo-row{display:flex;align-items:center;gap:8px;flex:1}
.logo-icon{width:32px;height:32px;background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.logo-txt{font-size:18px;font-weight:900;color:var(--navy);letter-spacing:-.5px}
[data-theme=dark].logo-txt{color:#fff}
.logo-tag{font-size:10px;color:var(--orange);vertical-align:super;font-weight:700}
.top-right{display:flex;align-items:center;gap:7px;position:relative}
.lang-sw{display:flex;align-items:center;background:var(--bg3);border-radius:8px;padding:2px;border:1px solid var(--brd)}
.lo{padding:3px 7px;border-radius:6px;font-size:11px;font-weight:700;color:var(--t3);cursor:pointer;transition:all .15s}
.lo.on{background:var(--navy);color:#fff}
[data-theme=dark].lo.on{background:var(--orange)}
.tb-btn{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--t3);background:var(--bg3);border:1px solid var(--brd);cursor:pointer;transition:all .15s}
.tb-btn:active{background:var(--navy);color:#fff;border-color:var(--navy)}
.login-btn{padding:0 13px;height:30px;border-radius:8px;background:var(--navy);color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:opacity .15s;white-space:nowrap}
[data-theme=dark].login-btn{background:var(--orange)}
.login-btn:active{opacity:.8}
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
[data-theme=dark].tab-item.on{color:var(--orange);border-color:var(--orange)}
.filter-row{display:flex;gap:6px;overflow-x:auto;padding:9px 14px}
.fchip{flex-shrink:0;padding:5px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid var(--brd2);color:var(--t2);background:none;transition:all .15s;white-space:nowrap}
.fchip.on{background:var(--navy);color:#fff;border-color:var(--navy)}
[data-theme=dark].fchip.on{background:var(--orange);border-color:var(--orange)}
.list-body{padding:10px 12px 12px}
.lcard{background:var(--bg2);border-radius:var(--r);box-shadow:var(--sh);margin-bottom:12px;overflow:hidden;cursor:pointer;border:1px solid var(--brd);transition:box-shadow .15s}
.lcard:active{box-shadow:var(--sh2)}
.lcard-media{position:relative;height:185px;background:linear-gradient(135deg,#EEF0F6,#E0E3EE);overflow:hidden;display:flex;align-items:center;justify-content:center}
[data-theme=dark].lcard-media{background:linear-gradient(135deg,#1E1E35,#161626)}
.lcard-em{font-size:64px;opacity:.22}
.lcard-badge{position:absolute;top:10px;right:10px;padding:3px 9px;border-radius:7px;font-size:11px;font-weight:700;color:#fff}
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
.lcard-cta{display:flex;gap:7px;margin-top:9px}
.cta-btn{flex:1;padding:9px 6px;border-radius:10px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:5px;transition:opacity .15s;cursor:pointer}
.cta-btn:active{opacity:.8}
.cta-call{background:var(--navy);color:#fff}
[data-theme=dark].cta-call{background:var(--orange)}
.cta-msg{background:var(--bg3);color:var(--t1);border:1px solid var(--brd2)}
#s-feed{scroll-snap-type:y mandatory;overflow-y:scroll;background:#111}
.fcard{height:100%;scroll-snap-align:start;scroll-snap-stop:always;position:relative;overflow:hidden;background:linear-gradient(135deg,#1a1a40,#0d1b3e)}
.fc-bg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:280px;opacity:.04;filter:blur(8px);pointer-events:none}
.fc-overlay{position:absolute;inset:0;pointer-events:none;background:linear-gradient(to bottom,rgba(0,0,0,.15) 0%,transparent 25%,rgba(0,0,0,.35) 55%,rgba(0,0,0,.85) 100%)}
.fc-video{position:absolute;inset:0;z-index:1}
.fc-video iframe{width:100%;height:100%;border:none;pointer-events:none}
.fc-video-tap{position:absolute;inset:0;z-index:2;cursor:pointer}
.fc-play-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:3;width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.18);backdrop-filter:blur(8px);border:2px solid rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;transition:opacity .3s}
.fc-side{position:absolute;right:10px;bottom:115px;z-index:5;display:flex;flex-direction:column;align-items:center;gap:18px}
.sab{display:flex;flex-direction:column;align-items:center;gap:2px}
.sab-btn{width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.14);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:19px;color:#fff;cursor:pointer;transition:all .15s}
.sab-btn:active{transform:scale(1.12);background:var(--orange);border-color:var(--orange)}
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
.chat-wrap{display:flex;flex-direction:column;height:100%}
.chat-header{flex-shrink:0;background:var(--bg2);border-bottom:1px solid var(--brd);padding:10px 14px;display:flex;align-items:center;gap:10px}
.ch-ava{width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff}
.ch-ava.aira{background:linear-gradient(135deg,var(--orange),var(--orange2))}
.ch-name{font-size:15px;font-weight:700;color:var(--t1)}
.ch-status{font-size:11px;color:var(--orange);font-weight:500;display:flex;align-items:center;gap:4px;margin-top:1px}
.chat-body{flex:1;overflow-y:auto;padding:16px;background:#e5ddd5}
[data-theme=dark].chat-body{background:#0A0F1E}
.msg{display:flex;gap:7px;max-width:85%;margin-bottom:12px}
.msg.me{align-self:flex-end;flex-direction:row-reverse}
.msg.bot{align-self:flex-start}
.bwrap{display:flex;flex-direction:column}
.bubble{padding:10px 14px;border-radius:14px;font-size:14.5px;line-height:1.45;word-break:break-word;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.msg.bot .bubble{background:#fff;color:var(--t1);border-radius:4px 14px 14px 14px}
[data-theme=dark].msg.bot .bubble{background:#1E1E35}
.msg.me .bubble{background:var(--navy);color:#fff;border-radius:14px 4px 14px 14px}
[data-theme=dark].msg.me .bubble{background:var(--orange)}
.m-ts{font-size:11px;color:var(--t3);margin-top:6px;text-align:right}
.msg.me .m-ts{text-align:right}
.chat-input-row{flex-shrink:0;display:flex;align-items:flex-end;gap:10px;padding:10px 16px;background:var(--bg2);border-top:1px solid var(--brd)}
.ci{flex:1;min-height:40px;max-height:88px;padding:12px 18px;border-radius:24px;border:1.5px solid var(--brd2);background:var(--white);font-size:14px;resize:none;line-height:1.4;transition:border-color .15s;color:var(--t1);outline:none}
[data-theme=dark].ci{background:var(--bg3);border-color:var(--brd)}
.ci:focus{border-color:var(--navy)}
[data-theme=dark].ci:focus{border-color:var(--orange)}
.ci::placeholder{color:var(--t3)}
.send-btn{width:48px;height:48px;border-radius:50%;flex-shrink:0;background:var(--orange);color:#fff;font-size:18px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s;box-shadow:0 2px 4px rgba(0,0,0,.2)}
.send-btn:active{transform:scale(0.95)}
.prof-wrap{padding:13px}
.prof-hero{background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:16px;padding:18px;margin-bottom:14px;overflow:hidden}
.ph-ava{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:9px}
.ph-name{font-size:17px;font-weight:800;color:#fff}
.ph-tag{font-size:11px;color:rgba(255,255,255,.6);margin-top:2px}
.menu-sec{margin-bottom:16px}
.menu-lbl{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:7px}
.menu-item{display:flex;align-items:center;gap:11px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:12px;margin-bottom:7px;cursor:pointer;box-shadow:var(--sh);transition:box-shadow .15s}
.menu-item:active{box-shadow:var(--sh2)}
.menu-ico{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.menu-name{font-size:13px;font-weight:600}
.menu-sub{font-size:11px;color:var(--t3);margin-top:1px}
.notif-wrap{padding:13px}
.notif-title{font-size:20px;font-weight:800;margin-bottom:13px}
.notif-item{display:flex;gap:10px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:12px;margin-bottom:8px;box-shadow:var(--sh);cursor:pointer}
.notif-item.unread{background:#f8f9fa}
.notif-ico{font-size:20px;flex-shrink:0;margin-top:1px}
.notif-txt{font-size:12px;line-height:1.55;color:var(--t2)}
.notif-txt b{color:var(--t1)}
.notif-time{font-size:10px;color:var(--t3);margin-top:3px}
#botbar{position:absolute;bottom:0;left:0;right:0;height:var(--bot-h);z-index:50;background:var(--bg2);border-top:1px solid var(--brd);display:flex;align-items:center;padding:0 8px 6px}
.nav-it{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:var(--t3);padding:6px 2px;border-radius:10px;position:relative;transition:color .15s}
.nav-svg{width:22px;height:22px;transition:transform .15s;flex-shrink:0}
.nav-it span{font-size:9px;font-weight:700}
.nav-it.on{color:var(--navy)}
[data-theme=dark].nav-it.on{color:var(--orange)}
.nav-it.on .nav-svg{transform:scale(1.1)}
.nav-plus-wrap{flex-shrink:0;padding:0 6px}
.nav-plus{width:48px;height:48px;border-radius:14px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(30,45,90,.3);cursor:pointer;transition:transform .15s}
[data-theme=dark].nav-plus{background:var(--orange);box-shadow:0 4px 16px rgba(244,123,32,.3)}
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
[data-theme=dark].finput:focus{border-color:var(--orange)}
select.finput{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239CA3AF'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;background-color:var(--bg3);padding-right:28px}
textarea.finput{resize:none;min-height:68px;line-height:1.5}
.form-row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.btn-primary{width:100%;padding:13px;border-radius:12px;background:var(--navy);color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:opacity .15s;display:flex;align-items:center;justify-content:center;gap:6px}
[data-theme=dark].btn-primary{background:var(--orange)}
.btn-primary:active{opacity:.85}
.btn-secondary{width:100%;padding:11px;border-radius:12px;background:var(--bg3);border:1.5px solid var(--brd);font-size:13px;font-weight:600;margin-top:8px;color:var(--t1);cursor:pointer}
.btn-outline{width:100%;padding:11px;border-radius:11px;background:none;border:1.5px solid var(--navy);color:var(--navy);font-size:13px;font-weight:600;margin-top:7px;cursor:pointer;transition:all .15s}
[data-theme=dark].btn-outline{border-color:var(--orange);color:var(--orange)}
.btn-outline:active{background:var(--navy);color:#fff}
.tab-switcher{display:flex;background:var(--bg3);border-radius:10px;padding:3px;margin-bottom:14px}
.tsw{flex:1;padding:7px;border-radius:7px;font-size:13px;font-weight:700;color:var(--t3);cursor:pointer;text-align:center;transition:all .15s}
.tsw.on{background:var(--navy);color:#fff}
[data-theme=dark].tsw.on{background:var(--orange)}
.info-box{display:flex;align-items:flex-start;gap:7px;background:rgba(39,174,96,.07);border:1px solid rgba(39,174,96,.2);border-radius:10px;padding:9px 11px;margin-bottom:11px;font-size:12px;line-height:1.5;color:var(--t2)}
.info-box.warn{background:rgba(244,123,32,.07);border-color:rgba(244,123,32,.2)}
.ai-label{display:inline-flex;align-items:center;gap:3px;background:rgba(244,123,32,.12);border-radius:5px;padding:1px 7px;font-size:10px;font-weight:700;color:var(--orange)}
.ai-result{background:var(--bg3);border:1.5px solid rgba(244,123,32,.25);border-radius:10px;padding:11px;margin-top:6px;font-size:12px;line-height:1.6;color:var(--t2);white-space:pre-wrap}
.ai-actions{display:flex;gap:6px;margin-top:7px}
.ai-act-btn{padding:5px 11px;border-radius:8px;font-size:11px;font-weight:600;background:var(--bg3);border:1px solid var(--brd);color:var(--t2);cursor:pointer;transition:all .15s}
.ai-act-btn:active{background:var(--navy);color:#fff;border-color:var(--navy)}
.det-visual{height:200px;position:relative;overflow:hidden;background:linear-gradient(135deg,#EEF0F6,#E0E3EE)}
[data-theme=dark].det-visual{background:linear-gradient(135deg,#1E1E35,#161626)}
.det-visual iframe{width:100%;height:100%;border:none}
.det-em-bg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:80px;opacity:.25}
.det-price{font-size:23px;font-weight:900;color:var(--t1);padding:8px 17px 4px}
.det-desc{padding:2px 17px 10px;font-size:13px;line-height:1.7;color:var(--t2)}
.det-cta{display:flex;gap:8px;padding:0 17px 4px}
.det-btn{flex:1;padding:12px;border-radius:12px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity .15s}
.det-btn:active{opacity:.85}
.det-call{background:var(--green)}
.det-chat{background:var(--navy)}
[data-theme=dark].det-chat{background:var(--orange)}
.more-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:0 17px 17px}
.more-item{background:var(--bg2);border:1px solid var(--brd);border-radius:14px;padding:16px;cursor:pointer;text-align:center;box-shadow:var(--sh);transition:box-shadow .15s}
.more-item:active{box-shadow:var(--sh2)}
.more-ico{font-size:28px;margin-bottom:5px}
.more-name{font-size:12px;font-weight:700}
.more-sub{font-size:10px;color:var(--t3);margin-top:2px}
.empty{text-align:center;padding:52px 20px}
.empty-ico{font-size:44px;opacity:.25;margin-bottom:9px}
.empty-t{font-size:15px;font-weight:700;margin-bottom:4px}
.empty-s{font-size:12px;color:var(--t3)}
#toast{position:absolute;bottom:78px;left:50%;transform:translateX(-50%) translateY(6px);background:rgba(30,45,90,.9);color:#fff;border-radius:10px;padding:9px 16px;font-size:12px;font-weight:600;white-space:nowrap;z-index:600;opacity:0;transition:all .2s;backdrop-filter:blur(5px)}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.su{animation:suIn .25s ease}
@keyframes suIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
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
    <div style="position:relative">
      <div id="auth-slot"><button class="login-btn" onclick="openM('m-auth')" id="login-btn-top">Войти</button></div>
      <span id="notif-badge"></span>
    </div>
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
      <div class="fchip" onclick="setFilt(this,'video')" data-ru="🎬 Видео" data-kz="🎬 Видео">🎬 Видео</div>
    </div>
  </div>
  <div class="list-body" id="list-body"></div>
</div>

<!-- FEED -->
<div id="s-feed" class="scr"></div>

<!-- AIRA CHAT (FIXED STRUCTURE) -->
<div id="s-aira" class="scr">
  <div class="chat-wrap">
    <div class="chat-header">
      <div class="ch-ava aira" style="font-size:13px;font-weight:900">A</div>
      <div style="flex:1">
        <div class="ch-name">Aira <span style="font-size:12px;font-weight:500;color:var(--t2)" id="tx-aira-sub">— Чат риэлторов</span></div>
       <div class="ch-status" style="color:var(--green)" id="aira-online-count">Онлайн</div>
      </div>
      <div id="aira-status-badge" style="background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:var(--orange);font-weight:600">🔒 Гость</div>
    </div>
    <div class="chat-body" id="aira-msgs"></div>
    <div class="chat-input-row">
      <textarea class="ci" id="aira-inp" rows="1" placeholder="Сообщение..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendAira()}"></textarea>
      <button class="send-btn" onclick="sendAira()"><i class="fas fa-paper-plane"></i></button>
    </div>
  </div>
</div>

<!-- PROFILE -->
<div id="s-prof" class="scr"><div class="prof-wrap" id="prof-body"></div></div>

<!-- NOTIFICATIONS -->
<div id="s-notif" class="scr">
  <div class="notif-wrap" id="notif-body"></div>
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
  <div class="nav-plus-wrap" id="nav-plus-wrap" style="display:none">
    <div class="nav-plus" onclick="needAuth(() => openAddListing())">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </div>
  </div>
  <div class="nav-it" id="n-more" onclick="needAuth(() => showMore())" style="display:none">
    <svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>
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
      <input class="finput" type="text" id="a-price" placeholder="10 000 000" oninput="formatPriceInput(this)">
      
      <div style="display:flex;align-items:center;gap:8px;margin:12px 0">
        <input type="checkbox" id="a-exchange" style="width:18px;height:18px;accent-color:var(--green)">
        <label for="a-exchange" style="font-size:13px;font-weight:600;cursor:pointer">🔄 Рассмотрю обмен</label>
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
    <div style="font-size:22px;margin-bottom:3px">📷</div><div style="font-size:11px;color:var(--t3)">Добавить фото</div>
  </div>
  <div style="border:2px dashed var(--brd2);border-radius:10px;padding:15px;text-align:center;cursor:pointer;background:var(--bg3)" onclick="uploadMedia('video')">
    <div style="font-size:22px;margin-bottom:3px">🎬</div><div style="font-size:11px;color:var(--t3)">Добавить видео</div>
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

<!-- MORE MENU (REMOVED REALTORS & CALENDAR) -->
<div class="overlay" id="m-more" onclick="closeOvl(event,'m-more')">
  <div class="sheet">
    <div class="sh-handle"></div>
    <div class="sh-title" id="tx-menu-title">Меню</div>
    <div class="more-grid">
      <div class="more-item" onclick="closeM('m-more');go('s-aira');nav(null)">
        <div class="more-ico">💬</div><div class="more-name" data-ru="Aira" data-kz="Aira">Aira</div><div class="more-sub" data-ru="Чат риэлторов" data-kz="Риэлтор чаты">Чат риэлторов</div>
      </div>
      <div class="more-item" onclick="closeM('m-more');go('s-prof');nav(null)">
        <div class="more-ico">👤</div><div class="more-name" data-ru="Профиль" data-kz="Профиль">Профиль</div><div class="more-sub" data-ru="Мой аккаунт" data-kz="Аккаунтым">Мой аккаунт</div>
      </div>
      <div class="more-item" onclick="closeM('m-more');go('s-notif');nav(null)">
        <div class="more-ico">🔔</div><div class="more-name" data-ru="Уведомления" data-kz="Хабарламалар">Уведомления</div><div class="more-sub" id="menu-notif-badge" data-ru="3 новых" data-kz="3 жаңа">3 новых</div>
      </div>
      <div class="more-item" onclick="closeM('m-more');openM('m-add')">
        <div class="more-ico">🏠</div><div class="more-name" data-ru="Добавить" data-kz="Қосу">Добавить</div><div class="more-sub" data-ru="Новый объект" data-kz="Жаңа объект">Новый объект</div>
      </div>
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
