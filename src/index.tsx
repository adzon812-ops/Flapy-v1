import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './' }))

// ============================================================
// API: listings
// ============================================================
app.get('/api/listings', (c) => {
  return c.json({ listings: getMockListings() })
})

// ============================================================
// AI description generator
// ============================================================
app.post('/api/ai/describe', async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  const desc = generateAIDescription(body)
  const descShort = generateAIDescription({ ...body, style: 'short' })
  return c.json({ description: desc, variants: [desc, descShort] })
})

// ============================================================
// Auth
// ============================================================
app.post('/api/auth/register', async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  return c.json({
    success: true,
    user: { id: 'u_' + Date.now(), ...body, status: 'realtor', rating: 0 }
  })
})

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  return c.json({
    success: true,
    user: { id: 'u_demo', email: body.email, name: 'Риэлтор Demo', status: 'realtor', rating: 4.8 }
  })
})

// ============================================================
// Calendar
// ============================================================
app.get('/api/calendar', (c) => {
  return c.json({ events: getMockCalendar() })
})

// ============================================================
// Chat Flai
// ============================================================
app.post('/api/chat/flai', async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  return c.json({ reply: getFlaiReply(body.message || '', body.role || 'buyer') })
})

// ============================================================
// Chat Aira
// ============================================================
app.post('/api/chat/aira', async (c) => {
  return c.json({ reply: 'Ваше сообщение доставлено коллегам в Aira 📨' })
})

// ============================================================
// MAIN PAGE
// ============================================================
app.get('/', (c) => {
  return c.html(getMainHTML())
})

// ============================================================
// Helpers
// ============================================================
function generateAIDescription(opts: {
  type?: string; rooms?: string; area?: string;
  district?: string; price?: string; exchange?: boolean; style?: string
}): string {
  const { type, rooms, area, district, price, exchange, style } = opts
  const emojis: Record<string, string> = {
    apartment: '🏢', house: '🏡', commercial: '🏪', land: '🌳'
  }
  const emoji = emojis[type || ''] || '🏠'
  const roomsText = rooms && rooms !== '' ? rooms + '-комнатная ' : ''
  const typeText =
    type === 'apartment' ? 'квартира' :
    type === 'house' ? 'дом' :
    type === 'commercial' ? 'коммерческая недвижимость' : 'объект'
  const exchangeNote = exchange ? ' 🔄 Рассмотрим обмен!' : ''

  if (style === 'short') {
    return emoji + ' ' + roomsText + typeText + (area ? ' ' + area + 'м²' : '') +
      ' в ' + (district || 'Астане') + ' — ' + (price ? formatPrice(price) : 'цена по запросу') + exchangeNote
  }

  const benefits: Record<string, string[]> = {
    apartment: ['Удобное расположение', 'Развитая инфраструктура рядом', 'Отличное состояние объекта'],
    house: ['Просторный участок', 'Тишина и уют', 'Гараж и парковка'],
    commercial: ['Высокий трафик', 'Первая линия', 'Идеально для бизнеса'],
    land: ['Разрешение на строительство', 'Все коммуникации', 'Удобный подъезд'],
  }
  const bens = (benefits[type || ''] || benefits.apartment)
    .map((b: string) => '• ' + b).join('\n')

  return emoji + ' Отличная ' + roomsText + typeText +
    (area ? ' площадью ' + area + ' м²' : '') +
    ' в ' + (district || 'Астане') + '! ✨\n\n' +
    '🌟 Преимущества объекта:\n' + bens + '\n\n' +
    '💰 Цена: ' + (price ? formatPrice(price) : 'по договорённости') + exchangeNote + '\n\n' +
    '📞 Звоните — покажу без выходных!'
}

function formatPrice(price: string | number): string {
  const n = Number(price)
  if (isNaN(n)) return price + ' ₸'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + ' млн ₸'
  return n.toLocaleString('ru') + ' ₸'
}

function getMockListings() {
  return [
    {
      id: 1, type: 'apartment', rooms: 3, area: 85, district: 'Есиль',
      price: 85000000, exchange: false, media: 'photo',
      realtorName: 'Айгерим К.', realtorRating: 4.9, realtorId: 'r1', liked: false,
      description: '🏢 Просторная 3-комнатная квартира 85 м² в Есиле!\n\n🌟 Преимущества:\n• Панорамный вид на Байтерек\n• Свежий ремонт\n• Подземный паркинг\n\n💰 Цена: 85 000 000 ₸',
      tags: ['новострой', 'ипотека'], color: '#6C63FF'
    },
    {
      id: 2, type: 'house', rooms: 5, area: 220, district: 'Алматинский',
      price: 150000000, exchange: true, media: 'video',
      realtorName: 'Данияр М.', realtorRating: 4.7, realtorId: 'r2', liked: false,
      description: '🏡 Роскошный дом 220 м² в Алматинском районе!\n🔄 Рассмотрим обмен!\n\n🌟 Особенности:\n• Участок 10 соток\n• Гараж на 2 машины\n• Баня и беседка\n\n💰 Цена: 150 000 000 ₸',
      tags: ['обмен', 'срочно'], color: '#FF6584'
    },
    {
      id: 3, type: 'commercial', rooms: null, area: 120, district: 'Байконыр',
      price: 65000000, exchange: false, media: 'photo',
      realtorName: 'Сауле Т.', realtorRating: 5.0, realtorId: 'r3', liked: false,
      description: '🏪 Коммерческое помещение 120 м² в Байконыре!\n\n🌟 Идеально для:\n• Ресторана/кафе\n• Офиса\n• Магазина\n\n🚶 Высокий трафик, первая линия!\n💰 Цена: 65 000 000 ₸',
      tags: ['инвестиция', 'аренда'], color: '#43C6AC'
    },
    {
      id: 4, type: 'apartment', rooms: 2, area: 65, district: 'Сарыарка',
      price: 38000000, exchange: true, media: 'photo',
      realtorName: 'Нурлан А.', realtorRating: 4.6, realtorId: 'r4', liked: false,
      description: '🏢 Уютная 2-комнатная 65 м² в Сарыарке!\n🔄 Обмен рассмотрим!\n\n🌟 Плюсы:\n• Рядом школа и детсад\n• Тихий двор\n\n💰 Цена: 38 000 000 ₸',
      tags: ['обмен', 'ипотека'], color: '#F7971E'
    },
    {
      id: 5, type: 'apartment', rooms: 1, area: 42, district: 'Есиль',
      price: 29000000, exchange: false, media: 'video',
      realtorName: 'Айгерим К.', realtorRating: 4.9, realtorId: 'r1', liked: false,
      description: '🏢 Стильная 1-комнатная 42 м² в Есиле!\n\n🌟 Особенности:\n• Смарт-дизайн\n• Встроенная кухня\n• Вид на город\n\n💰 Цена: 29 000 000 ₸',
      tags: ['студия', 'инвестиция'], color: '#6C63FF'
    },
  ]
}

function getMockCalendar() {
  const today = new Date()
  const d = (offset: number, h: number, m: number) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset, h, m).toISOString()
  return [
    { id: 1, title: '🏠 Показ квартиры — Есиль', time: d(0, 10, 0), type: 'showing', client: 'Алия С.', note: 'Взять ключи заранее' },
    { id: 2, title: '📞 Звонок клиенту', time: d(0, 14, 30), type: 'call', client: 'Данияр М.', note: 'Обсудить условия' },
    { id: 3, title: '✍️ Подписание договора', time: d(1, 11, 0), type: 'deal', client: 'Нурсулу К.', note: 'Проверить документы заранее' },
    { id: 4, title: '🏢 Показ коммерции — Байконыр', time: d(1, 15, 0), type: 'showing', client: 'Бизнес-клиент', note: 'Взять план помещения' },
  ]
}

function getFlaiReply(message: string, role: string): string {
  const m = message.toLowerCase()
  if (m.includes('цена') || m.includes('стоимость') || m.includes('сколько'))
    return 'Отличный вопрос! 💰 Стоимость зависит от района и состояния. Хотите, я свяжу вас с риэлтором для точной оценки?'
  if (m.includes('показ') || m.includes('посмотреть') || m.includes('смотреть'))
    return '👁️ Отлично! Когда вам удобно посмотреть объект? Риэлтор готов организовать показ в удобное время.'
  if (m.includes('ипотека') || m.includes('кредит'))
    return '🏦 Объект подходит под ипотеку! Работаем с Отбасы Банк, Халык и другими банками. Помочь с расчётом?'
  if (m.includes('обмен') || m.includes('обменять'))
    return '🔄 Обмен — очень актуально в 2026 году! С января новые налоговые правила: срок освобождения вырос до 2 лет, ставка 10–15%. Обмен помогает избежать налога. Риэлтор расскажет подробнее!'
  if (m.includes('налог'))
    return '💡 С 2026 года в Казахстане: срок освобождения от налога при продаже — 2 года (было 1 год). Прогрессивная ставка 10–15%. Обмен недвижимостью — выгодная альтернатива!'
  if (m.includes('привет') || m.includes('hello') || m.includes('сәлем'))
    return '👋 Привет! Я Flai — AI-помощник платформы Flapy. Задайте любой вопрос по недвижимости!'
  if (role === 'buyer')
    return '😊 Понял вас! Риэлтор получит ваш вопрос и ответит в ближайшее время. Что-то ещё уточнить?'
  return '✨ Ваш вопрос получен! Риэлтор свяжется с вами. Чем ещё могу помочь?'
}

// ============================================================
// MAIN HTML
// ============================================================
function getMainHTML(): string {
  return `<!DOCTYPE html>
<html lang="ru" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <title>Flapy — Риэлторы Астаны</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    :root {
      --bg-primary:#0F0F1A; --bg-secondary:#1A1A2E; --bg-card:#16213E; --bg-input:#0D1117;
      --text-primary:#F0F0FF; --text-secondary:#A0A0C0; --text-muted:#6060A0;
      --accent:#6C63FF; --accent2:#43C6AC; --accent3:#FF6584; --accent4:#F7971E;
      --border:rgba(108,99,255,0.2); --card-shadow:0 8px 32px rgba(0,0,0,0.4);
      --nav-h:64px; --bottom-h:72px; --gold:#FFD700; --silver:#C0C0C0; --bronze:#CD7F32;
    }
    [data-theme="light"] {
      --bg-primary:#F5F5FF; --bg-secondary:#EEEEFF; --bg-card:#FFFFFF; --bg-input:#F0F0FA;
      --text-primary:#1A1A3E; --text-secondary:#4040A0; --text-muted:#8080C0;
      --border:rgba(108,99,255,0.15); --card-shadow:0 4px 24px rgba(108,99,255,0.1);
    }
    *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
    html,body{height:100%;overflow:hidden;font-family:'Inter',sans-serif;background:var(--bg-primary);color:var(--text-primary);transition:background .3s,color .3s}
    button{border:none;cursor:pointer;font-family:inherit}
    input,textarea,select{font-family:inherit}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:var(--accent);border-radius:2px}

    /* TOPBAR */
    #topbar{position:fixed;top:0;left:0;right:0;height:var(--nav-h);background:var(--bg-secondary);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 16px;z-index:100;backdrop-filter:blur(12px)}
    .logo{font-size:26px;font-weight:800;letter-spacing:-1px;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .topbar-right{display:flex;align-items:center;gap:10px}
    .icon-btn{width:38px;height:38px;border-radius:12px;background:var(--bg-input);color:var(--text-secondary);display:flex;align-items:center;justify-content:center;font-size:15px;transition:all .2s;border:1px solid var(--border)}
    .icon-btn:hover{background:var(--accent);color:#fff;transform:scale(1.05)}
    .lang-btn{padding:0 12px;height:38px;border-radius:12px;font-size:13px;font-weight:600;background:var(--bg-input);color:var(--text-secondary);border:1px solid var(--border);transition:all .2s}
    .lang-btn:hover{background:var(--accent);color:#fff}
    #login-btn{padding:0 16px;height:38px;border-radius:12px;font-size:13px;font-weight:600;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;transition:all .2s}
    #login-btn:hover{opacity:.9;transform:scale(1.03)}
    .avatar-pill{display:flex;align-items:center;gap:8px;background:var(--bg-input);border:1px solid var(--border);border-radius:20px;padding:4px 12px 4px 4px}
    .avatar-circle{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff}
    .avatar-pill span{font-size:13px;font-weight:600}
    .badge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;background:var(--accent3);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center}

    /* LAYOUT */
    #app{position:fixed;top:var(--nav-h);bottom:var(--bottom-h);left:0;right:0;overflow:hidden}
    .screen{position:absolute;inset:0;overflow-y:auto;display:none}
    .screen.active{display:block}

    /* FEED */
    #feed-screen{scroll-snap-type:y mandatory;-webkit-overflow-scrolling:touch}
    .feed-card{height:100%;width:100%;scroll-snap-align:start;scroll-snap-stop:always;position:relative;overflow:hidden;background:var(--bg-secondary)}
    .feed-bg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:140px;opacity:.06}
    .feed-gradient{position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,rgba(0,0,0,.85) 100%)}
    [data-theme="light"] .feed-gradient{background:linear-gradient(180deg,transparent 30%,rgba(200,200,240,.9) 100%)}
    .feed-content{position:absolute;bottom:0;left:0;right:60px;padding:20px 16px 24px}
    .feed-tag-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
    .feed-tag{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(108,99,255,.25);color:var(--accent);border:1px solid rgba(108,99,255,.3)}
    .feed-tag.exchange{background:rgba(67,198,172,.2);color:var(--accent2);border-color:rgba(67,198,172,.3)}
    .feed-tag.urgent{background:rgba(255,101,132,.2);color:var(--accent3);border-color:rgba(255,101,132,.3)}
    .feed-type-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:rgba(255,255,255,.12);color:var(--text-primary);margin-bottom:8px}
    .feed-title{font-size:22px;font-weight:800;line-height:1.2;margin-bottom:6px}
    .feed-price{font-size:20px;font-weight:700;color:var(--accent4);margin-bottom:10px}
    .feed-desc{font-size:13px;line-height:1.5;color:var(--text-secondary);max-height:80px;overflow:hidden}
    .feed-realtor{display:flex;align-items:center;gap:10px;margin-top:12px;background:rgba(255,255,255,.07);border-radius:16px;padding:8px 12px;backdrop-filter:blur(8px)}
    .realtor-ava{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0}
    .realtor-name{font-size:13px;font-weight:700}
    .realtor-stars{font-size:11px;color:var(--gold)}
    .feed-actions{position:absolute;right:12px;bottom:120px;display:flex;flex-direction:column;gap:16px;align-items:center}
    .feed-action-btn{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.1);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:20px;color:#fff;backdrop-filter:blur(8px);transition:all .2s;border:1px solid rgba(255,255,255,.15)}
    .feed-action-btn:hover{transform:scale(1.12);background:var(--accent)}
    .feed-action-btn.liked{color:var(--accent3)}
    .feed-action-count{font-size:11px;font-weight:600;margin-top:2px}
    .media-badge{position:absolute;top:80px;right:16px;background:rgba(0,0,0,.6);border-radius:8px;padding:4px 10px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:5px;color:#fff}
    .exchange-ribbon{position:absolute;top:80px;left:0;background:linear-gradient(90deg,var(--accent2),#2BC0E4);color:#fff;padding:6px 16px;font-size:12px;font-weight:700;border-radius:0 12px 12px 0}

    /* SEARCH */
    #filters-bar{position:sticky;top:0;z-index:10;background:var(--bg-secondary);padding:10px 12px;display:flex;gap:8px;overflow-x:auto;border-bottom:1px solid var(--border)}
    #filters-bar::-webkit-scrollbar{height:0}
    .filter-chip{flex-shrink:0;padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;border:1.5px solid var(--border);background:var(--bg-input);color:var(--text-secondary);cursor:pointer;transition:all .2s;white-space:nowrap}
    .filter-chip.active,.filter-chip:hover{background:var(--accent);color:#fff;border-color:var(--accent)}
    .search-wrap{padding:12px;background:var(--bg-secondary);border-bottom:1px solid var(--border)}
    .search-box{display:flex;align-items:center;gap:10px;background:var(--bg-input);border:1.5px solid var(--border);border-radius:16px;padding:10px 16px}
    .search-box input{flex:1;background:none;border:none;outline:none;font-size:14px;color:var(--text-primary)}
    .search-box input::placeholder{color:var(--text-muted)}

    /* BOTTOM NAV */
    #bottombar{position:fixed;bottom:0;left:0;right:0;height:var(--bottom-h);background:var(--bg-secondary);border-top:1px solid var(--border);display:flex;align-items:center;justify-content:space-around;padding:0 8px 8px;z-index:100;backdrop-filter:blur(12px)}
    .nav-item{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;padding:8px 4px;border-radius:16px;cursor:pointer;transition:all .2s;color:var(--text-muted);position:relative}
    .nav-item i{font-size:20px;transition:all .2s}
    .nav-item span{font-size:10px;font-weight:600;transition:all .2s}
    .nav-item.active{color:var(--accent)}
    .nav-item.active i{transform:scale(1.15)}
    .nav-add-btn{width:52px;height:52px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;box-shadow:0 4px 20px rgba(108,99,255,.5);transition:all .2s}
    .nav-add-btn:hover{transform:scale(1.1);box-shadow:0 6px 24px rgba(108,99,255,.7)}

    /* MODAL */
    .modal-overlay{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.75);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .3s}
    .modal-overlay.open{opacity:1;pointer-events:all}
    .modal-sheet{width:100%;max-width:500px;max-height:92vh;background:var(--bg-secondary);border-radius:24px 24px 0 0;overflow-y:auto;padding:0 0 20px;transform:translateY(40px);transition:transform .3s}
    .modal-overlay.open .modal-sheet{transform:translateY(0)}
    .modal-handle{width:40px;height:4px;border-radius:2px;background:var(--border);margin:12px auto 16px}
    .modal-title{font-size:20px;font-weight:800;padding:0 20px 16px}
    .modal-body{padding:0 20px}

    /* FORMS */
    .form-group{margin-bottom:16px}
    .form-label{font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;display:block}
    .form-input{width:100%;padding:12px 16px;border-radius:14px;background:var(--bg-input);border:1.5px solid var(--border);color:var(--text-primary);font-size:14px;outline:none;transition:border-color .2s}
    .form-input:focus{border-color:var(--accent)}
    .form-select{appearance:none;cursor:pointer}
    .form-textarea{resize:none;min-height:90px;line-height:1.5}
    .btn-primary{width:100%;padding:14px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:15px;font-weight:700;transition:all .2s}
    .btn-primary:hover{opacity:.92;transform:translateY(-1px)}
    .btn-secondary{width:100%;padding:14px;border-radius:14px;background:var(--bg-input);border:1.5px solid var(--border);color:var(--text-primary);font-size:15px;font-weight:600;transition:all .2s;margin-top:10px}
    .btn-outline{padding:10px 20px;border-radius:12px;background:transparent;border:1.5px solid var(--accent);color:var(--accent);font-size:14px;font-weight:600;transition:all .2s}
    .btn-outline:hover{background:var(--accent);color:#fff}

    /* CHAT */
    #flai-screen,#aira-screen{display:flex;flex-direction:column}
    .chat-header{padding:12px 16px;background:var(--bg-secondary);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-shrink:0}
    .chat-avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;flex-shrink:0}
    .chat-avatar.flai{background:linear-gradient(135deg,var(--accent),var(--accent2))}
    .chat-avatar.aira{background:linear-gradient(135deg,var(--accent3),var(--accent4))}
    .chat-header-info h3{font-size:16px;font-weight:700}
    .chat-online{font-size:11px;color:var(--accent2);display:flex;align-items:center;gap:4px}
    .chat-online::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--accent2);display:inline-block}
    .chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
    .chat-role-selector{padding:12px 16px;background:var(--bg-secondary);border-bottom:1px solid var(--border);display:flex;gap:8px;flex-shrink:0}
    .role-btn{flex:1;padding:8px;border-radius:12px;font-size:13px;font-weight:600;background:var(--bg-input);border:1.5px solid var(--border);color:var(--text-secondary);cursor:pointer;transition:all .2s}
    .role-btn.active{background:var(--accent);color:#fff;border-color:var(--accent)}
    .chat-input-area{padding:12px 16px;background:var(--bg-secondary);border-top:1px solid var(--border);display:flex;gap:10px;align-items:flex-end;flex-shrink:0}
    .chat-input{flex:1;min-height:42px;max-height:120px;padding:10px 14px;border-radius:20px;background:var(--bg-input);border:1.5px solid var(--border);color:var(--text-primary);font-size:14px;outline:none;resize:none;line-height:1.4;transition:border-color .2s}
    .chat-input:focus{border-color:var(--accent)}
    .chat-send-btn{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
    .chat-send-btn:hover{transform:scale(1.1)}
    .msg{display:flex;gap:8px;max-width:85%}
    .msg.own{flex-direction:row-reverse;align-self:flex-end}
    .msg-ava{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0}
    .msg-bubble{padding:10px 14px;border-radius:18px;font-size:14px;line-height:1.5}
    .msg.own .msg-bubble{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border-bottom-right-radius:4px}
    .msg:not(.own) .msg-bubble{background:var(--bg-card);border:1px solid var(--border);border-bottom-left-radius:4px}
    .msg-time{font-size:11px;color:var(--text-muted);margin-top:4px;text-align:right}
    .typing-indicator{display:flex;gap:4px;padding:10px 14px}
    .typing-dot{width:8px;height:8px;border-radius:50%;background:var(--text-muted);animation:typing 1.2s infinite}
    .typing-dot:nth-child(2){animation-delay:.2s}
    .typing-dot:nth-child(3){animation-delay:.4s}
    @keyframes typing{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-8px)}}
    .aira-thread{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;margin-bottom:12px;overflow:hidden}
    .aira-thread-header{padding:12px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--border);cursor:pointer}
    .aira-property-link{display:inline-flex;align-items:center;gap:6px;background:rgba(108,99,255,.15);border:1px solid rgba(108,99,255,.3);border-radius:10px;padding:4px 10px;font-size:12px;font-weight:600;color:var(--accent);margin-bottom:8px}

    /* PROFILE */
    #profile-screen{padding:16px}
    .profile-hero{background:linear-gradient(135deg,var(--accent),var(--accent2));border-radius:24px;padding:24px;margin-bottom:16px;position:relative;overflow:hidden}
    .profile-hero::before{content:'';position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:rgba(255,255,255,.08)}
    .profile-ava{width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:#fff;border:3px solid rgba(255,255,255,.4);margin-bottom:12px}
    .profile-name{font-size:20px;font-weight:800;color:#fff}
    .profile-status{font-size:13px;color:rgba(255,255,255,.8);margin-top:2px}
    .profile-stats{display:flex;gap:12px;margin-top:16px}
    .profile-stat{flex:1;background:rgba(255,255,255,.12);border-radius:12px;padding:10px;text-align:center}
    .profile-stat-val{font-size:20px;font-weight:800;color:#fff}
    .profile-stat-lbl{font-size:11px;color:rgba(255,255,255,.7);margin-top:2px}
    .rating-stars{color:var(--gold);font-size:18px;margin-top:4px}
    .menu-section{margin-bottom:20px}
    .menu-section-title{font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}
    .menu-item{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:16px;background:var(--bg-card);border:1px solid var(--border);margin-bottom:8px;cursor:pointer;transition:all .2s}
    .menu-item:hover{border-color:var(--accent);transform:translateX(2px)}
    .menu-icon{width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:16px}
    .menu-item-info{flex:1}
    .menu-item-title{font-size:14px;font-weight:600}
    .menu-item-sub{font-size:12px;color:var(--text-muted);margin-top:1px}
    .menu-arrow{color:var(--text-muted);font-size:12px}

    /* CALENDAR */
    #calendar-screen{padding:16px}
    .calendar-title{font-size:22px;font-weight:800}
    .calendar-subtitle{font-size:14px;color:var(--text-secondary);margin-top:4px}
    .event-card{background:var(--bg-card);border:1px solid var(--border);border-radius:18px;padding:16px;margin-bottom:12px;display:flex;gap:14px;align-items:flex-start;transition:all .2s;cursor:pointer}
    .event-card:hover{border-color:var(--accent);transform:translateX(2px)}
    .event-time-block{min-width:56px;text-align:center;background:var(--bg-input);border-radius:12px;padding:8px 4px}
    .event-time{font-size:16px;font-weight:800;color:var(--accent)}
    .event-info{flex:1}
    .event-title{font-size:15px;font-weight:700;margin-bottom:4px}
    .event-client{font-size:13px;color:var(--text-secondary);margin-bottom:4px}
    .event-note{font-size:12px;color:var(--text-muted);background:var(--bg-input);padding:6px 10px;border-radius:8px}
    .add-event-btn{width:100%;padding:14px;border-radius:16px;background:var(--bg-input);border:2px dashed var(--border);color:var(--text-secondary);font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;transition:all .2s;margin-bottom:16px}
    .add-event-btn:hover{border-color:var(--accent);color:var(--accent)}

    /* ADD LISTING */
    .ai-badge{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--accent);background:rgba(108,99,255,.1);padding:3px 8px;border-radius:8px}
    .ai-suggestion{background:var(--bg-input);border:1px solid rgba(108,99,255,.3);border-radius:12px;padding:12px;margin-top:10px;font-size:13px;line-height:1.5;color:var(--text-secondary)}
    .ai-actions{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
    .ai-action-btn{padding:6px 12px;border-radius:10px;font-size:12px;font-weight:600;background:var(--bg-secondary);border:1px solid var(--border);color:var(--text-secondary);cursor:pointer;transition:all .2s}
    .ai-action-btn:hover{background:var(--accent);color:#fff;border-color:var(--accent)}

    /* RATING */
    .rating-card{background:var(--bg-card);border:1px solid var(--border);border-radius:18px;padding:16px;margin-bottom:10px;display:flex;align-items:center;gap:14px}
    .rank-badge{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff;flex-shrink:0}
    .rank-1{background:var(--gold)}
    .rank-2{background:var(--silver)}
    .rank-3{background:var(--bronze)}
    .rank-other{background:var(--bg-input);color:var(--text-muted);font-size:14px}
    .rating-bar-wrap{flex:1;margin-top:4px}
    .rating-bar{height:6px;border-radius:3px;background:linear-gradient(90deg,var(--accent),var(--accent2));transition:width .5s ease}

    /* DETAIL */
    .detail-img{height:220px;background:var(--bg-input);display:flex;align-items:center;justify-content:center;font-size:80px;opacity:.3}
    .detail-price-row{display:flex;align-items:center;justify-content:space-between;padding:16px 20px 8px}
    .detail-price{font-size:26px;font-weight:800;color:var(--accent4)}
    .detail-exchange{font-size:13px;font-weight:600;color:var(--accent2);display:flex;align-items:center;gap:4px}
    .detail-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 20px 16px}
    .detail-info-item{background:var(--bg-input);border-radius:12px;padding:12px;text-align:center}
    .detail-info-val{font-size:18px;font-weight:800;color:var(--accent)}
    .detail-info-lbl{font-size:11px;color:var(--text-muted);margin-top:2px}
    .detail-desc{padding:0 20px 16px;font-size:14px;line-height:1.7;color:var(--text-secondary)}
    .detail-cta{display:flex;gap:10px;padding:0 20px}
    .cta-call{flex:1;padding:14px;border-radius:14px;background:linear-gradient(135deg,var(--accent2),#2BC0E4);color:#fff;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px}
    .cta-chat{flex:1;padding:14px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;font-size:15px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px}

    /* MISC */
    #toast{position:fixed;bottom:100px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:12px 20px;font-size:14px;font-weight:600;box-shadow:var(--card-shadow);z-index:999;opacity:0;transition:all .3s;white-space:nowrap}
    #toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
    #loader{position:fixed;inset:0;z-index:500;background:var(--bg-primary);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:16px}
    .loader-logo{font-size:48px;font-weight:900;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .spinner{width:40px;height:40px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    #onboarding{position:fixed;inset:0;z-index:300;background:var(--bg-primary);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center}
    .onboard-logo{font-size:60px;margin-bottom:12px}
    .onboard-title{font-size:36px;font-weight:900;letter-spacing:-2px;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px}
    .onboard-sub{font-size:16px;color:var(--text-secondary);margin-bottom:32px;line-height:1.5}
    .onboard-features{width:100%;max-width:340px;text-align:left;margin-bottom:32px}
    .onboard-feature{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)}
    .onboard-feature-icon{font-size:22px;width:32px;text-align:center}
    .onboard-feature-text{font-size:14px;color:var(--text-secondary)}
    .notification-banner{background:linear-gradient(90deg,rgba(108,99,255,.15),rgba(67,198,172,.15));border:1px solid rgba(108,99,255,.2);border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:13px}
    .notif-icon{font-size:20px}
    .empty-state{text-align:center;padding:48px 24px}
    .empty-icon{font-size:64px;margin-bottom:16px;opacity:.5}
    .empty-title{font-size:18px;font-weight:700;margin-bottom:8px}
    .empty-sub{font-size:14px;color:var(--text-muted)}
    .slide-up{animation:slideUp .4s ease}
    @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
    .pulse{animation:pulse 2s infinite}
    @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(108,99,255,.4)}50%{box-shadow:0 0 0 12px rgba(108,99,255,0)}}
    .tag-tax{background:rgba(247,151,30,.15);color:var(--accent4);border:1px solid rgba(247,151,30,.3);border-radius:8px;padding:2px 8px;font-size:11px;font-weight:600}
    .realtor-info{flex:1}
    .divider{height:1px;background:var(--border);margin:16px 0}
  </style>
</head>
<body>

<!-- LOADER -->
<div id="loader">
  <div class="loader-logo">Flapy</div>
  <div class="spinner"></div>
</div>

<!-- ONBOARDING -->
<div id="onboarding" style="display:none">
  <div class="onboard-logo">🏠</div>
  <div class="onboard-title">Flapy</div>
  <div class="onboard-sub">Платформа для риэлторов Астаны.<br>Закрывай сделки быстрее!</div>
  <div class="onboard-features">
    <div class="onboard-feature"><span class="onboard-feature-icon">🎬</span><span class="onboard-feature-text">TikTok-лента объектов с видео и фото</span></div>
    <div class="onboard-feature"><span class="onboard-feature-icon">🤖</span><span class="onboard-feature-text">AI-помощник Flai для чата с клиентами</span></div>
    <div class="onboard-feature"><span class="onboard-feature-icon">💬</span><span class="onboard-feature-text">Aira — чат только для риэлторов</span></div>
    <div class="onboard-feature"><span class="onboard-feature-icon">📅</span><span class="onboard-feature-text">Умный планировщик с AI-напоминаниями</span></div>
    <div class="onboard-feature"><span class="onboard-feature-icon">🔄</span><span class="onboard-feature-text">Обмен недвижимостью — актуально в 2026!</span></div>
  </div>
  <button class="btn-primary" style="max-width:340px" onclick="finishOnboarding()">Начать работу 🚀</button>
</div>

<!-- TOP NAVBAR -->
<div id="topbar">
  <div class="logo">Flapy</div>
  <div class="topbar-right">
    <button class="lang-btn" onclick="toggleLang()" id="lang-toggle">🇰🇿 Қаз</button>
    <button class="icon-btn" onclick="toggleTheme()" id="theme-btn"><i class="fas fa-moon"></i></button>
    <button class="icon-btn" onclick="showScreen('notif-screen')" style="position:relative">
      <i class="fas fa-bell"></i>
      <span class="badge" style="top:-4px;right:-4px">3</span>
    </button>
    <div id="auth-area">
      <button class="btn-primary" id="login-btn" onclick="openModal('auth-modal')">Войти</button>
    </div>
  </div>
</div>

<!-- MAIN APP -->
<div id="app">

  <!-- FEED -->
  <div id="feed-screen" class="screen active"></div>

  <!-- SEARCH -->
  <div id="search-screen" class="screen">
    <div class="search-wrap">
      <div class="search-box">
        <i class="fas fa-search" style="color:var(--text-muted)"></i>
        <input type="text" id="search-input" placeholder="Район, тип, цена..." oninput="doSearch()">
      </div>
    </div>
    <div id="filters-bar">
      <div class="filter-chip active" onclick="setFilter(this,'all')">Все</div>
      <div class="filter-chip" onclick="setFilter(this,'apartment')">🏢 Квартиры</div>
      <div class="filter-chip" onclick="setFilter(this,'house')">🏡 Дома</div>
      <div class="filter-chip" onclick="setFilter(this,'commercial')">🏪 Коммерция</div>
      <div class="filter-chip" onclick="setFilter(this,'exchange')">🔄 Обмен</div>
      <div class="filter-chip" onclick="setFilter(this,'video')">🎬 Видео</div>
      <div class="filter-chip" onclick="setFilter(this,'Есиль')">📍 Есиль</div>
      <div class="filter-chip" onclick="setFilter(this,'Алматинский')">📍 Алматинский</div>
    </div>
    <div id="search-results" style="padding:12px"></div>
  </div>

  <!-- FLAI CHAT -->
  <div id="flai-screen" class="screen">
    <div class="chat-header">
      <div class="chat-avatar flai">F</div>
      <div class="chat-header-info">
        <h3>Flai <span style="font-size:13px;color:var(--accent2)">🤖 AI-помощник</span></h3>
        <div class="chat-online">Онлайн</div>
      </div>
    </div>
    <div class="chat-role-selector">
      <button class="role-btn active" onclick="setRole(this,'buyer')">👤 Покупатель/Продавец</button>
      <button class="role-btn" onclick="setRole(this,'realtor')">🏠 Риэлтор</button>
    </div>
    <div class="chat-messages" id="flai-messages">
      <div class="notification-banner">
        <span class="notif-icon">🔒</span>
        <span>Продавец и покупатель видят только своё — риэлтор видит всех</span>
      </div>
      <div class="msg">
        <div class="msg-ava">F</div>
        <div>
          <div class="msg-bubble">Привет! Я Flai — AI-помощник платформы Flapy 👋<br><br>Помогу с вопросами по недвижимости и свяжу с риэлтором. Спросите что угодно!</div>
          <div class="msg-time">сейчас</div>
        </div>
      </div>
      <div class="msg">
        <div class="msg-ava">F</div>
        <div>
          <div class="msg-bubble">💡 <b>Актуально в 2026!</b> С января новые налоговые правила:<br>• Срок освобождения — <b>2 года</b> (было 1)<br>• Прогрессивная ставка <b>10–15%</b><br><br>🔄 Поэтому <b>обмен</b> недвижимостью сейчас очень выгоден!</div>
          <div class="msg-time">сейчас</div>
        </div>
      </div>
    </div>
    <div class="chat-input-area">
      <textarea class="chat-input" id="flai-input" placeholder="Написать сообщение..." rows="1" onkeydown="flaiEnter(event)"></textarea>
      <button class="chat-send-btn" onclick="sendFlaiMessage()"><i class="fas fa-paper-plane"></i></button>
    </div>
  </div>

  <!-- AIRA CHAT -->
  <div id="aira-screen" class="screen">
    <div class="chat-header">
      <div class="chat-avatar aira">A</div>
      <div class="chat-header-info">
        <h3>Aira <span style="font-size:13px;color:var(--accent3)">💬 Чат риэлторов</span></h3>
        <div class="chat-online" style="color:var(--accent3)">47 риэлторов онлайн</div>
      </div>
    </div>
    <div class="chat-messages" id="aira-messages">
      <div class="notification-banner" style="background:linear-gradient(90deg,rgba(255,101,132,.1),rgba(247,151,30,.1));border-color:rgba(255,101,132,.2)">
        <span class="notif-icon">🔒</span>
        <span>Только для риэлторов. Покупатели/продавцы не попадают сюда.</span>
      </div>
      <div class="aira-thread">
        <div class="aira-thread-header" onclick="toggleThread(this)">
          <div class="realtor-ava">А</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700">Айгерим К. <span style="color:var(--text-muted);font-weight:400;font-size:12px">10 мин назад</span></div>
            <div style="font-size:12px;color:var(--text-secondary)">Есть квартира 3к в Есиле, ищу покупателя 🤝</div>
          </div>
          <i class="fas fa-chevron-down" style="color:var(--text-muted)"></i>
        </div>
        <div style="padding:12px 16px;display:none">
          <div class="aira-property-link"><i class="fas fa-link"></i> flapy.kz/listing/1 · 3к · 85м² · 85 млн ₸</div>
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">Клиент готов к ипотеке через Халык. Делим комиссию 50/50 🤝</p>
          <div class="msg">
            <div class="msg-ava" style="background:linear-gradient(135deg,#6C63FF,#43C6AC)">Д</div>
            <div><div class="msg-bubble" style="background:var(--bg-input);border:1px solid var(--border);font-size:13px;padding:8px 12px;border-radius:18px 18px 18px 4px">У меня есть покупатель! Напишу в личку 👍</div></div>
          </div>
        </div>
      </div>
      <div class="aira-thread">
        <div class="aira-thread-header" onclick="toggleThread(this)">
          <div class="realtor-ava" style="background:linear-gradient(135deg,var(--accent3),var(--accent4))">Н</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700">Нурлан А. <span style="color:var(--text-muted);font-weight:400;font-size:12px">25 мин назад</span></div>
            <div style="font-size:12px;color:var(--text-secondary)">🔄 Обмен: ищем 2к на 3к с доплатой</div>
          </div>
          <span class="tag-tax">🔄 Обмен</span>
        </div>
        <div style="padding:12px 16px;display:none">
          <div class="aira-property-link"><i class="fas fa-link"></i> flapy.kz/listing/4 · 2к · 65м² · Сарыарка</div>
          <p style="font-size:13px;color:var(--text-secondary)">Клиент хочет расширить площадь, готов доплатить до 20 млн. Обмен выгоден — налог не надо платить! Кто поможет найти вариант?</p>
        </div>
      </div>
      <div class="aira-thread">
        <div class="aira-thread-header" onclick="toggleThread(this)">
          <div class="realtor-ava" style="background:linear-gradient(135deg,var(--accent2),#2BC0E4)">С</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700">Сауле Т. <span style="color:var(--text-muted);font-weight:400;font-size:12px">1 час назад</span></div>
            <div style="font-size:12px;color:var(--text-secondary)">🏪 Коммерция в Байконыре — соцсети дали результат!</div>
          </div>
          <i class="fas fa-chevron-down" style="color:var(--text-muted)"></i>
        </div>
        <div style="padding:12px 16px;display:none">
          <div class="aira-property-link"><i class="fas fa-link"></i> flapy.kz/listing/3 · 120м² · 65 млн</div>
          <p style="font-size:13px;color:var(--text-secondary)">3 звонка за день с Reels! В Flapy планирую выложить полное видео-тур 🎬</p>
        </div>
      </div>
    </div>
    <div class="chat-input-area">
      <textarea class="chat-input" id="aira-input" placeholder="Поделитесь объектом с коллегами..." rows="1" onkeydown="airaEnter(event)"></textarea>
      <button class="chat-send-btn" style="background:linear-gradient(135deg,var(--accent3),var(--accent4))" onclick="sendAiraMessage()"><i class="fas fa-paper-plane"></i></button>
    </div>
  </div>

  <!-- CALENDAR -->
  <div id="calendar-screen" class="screen">
    <div id="calendar-content" style="padding:16px"></div>
  </div>

  <!-- PROFILE -->
  <div id="profile-screen" class="screen"></div>

  <!-- NOTIFICATIONS -->
  <div id="notif-screen" class="screen" style="padding:16px">
    <h2 style="font-size:22px;font-weight:800;margin-bottom:16px">Уведомления 🔔</h2>
    <div class="notification-banner" style="border-color:rgba(67,198,172,.3)">
      <span class="notif-icon">🤖</span>
      <span><b>Flai:</b> У вас показ через 30 минут! Не забудьте ключи 🔑</span>
    </div>
    <div class="notification-banner" style="border-color:rgba(255,101,132,.3)">
      <span class="notif-icon">💬</span>
      <span><b>Aira:</b> Данияр М. ответил на ваш объект — есть покупатель!</span>
    </div>
    <div class="notification-banner">
      <span class="notif-icon">❤️</span>
      <span>3 человека добавили ваш объект в избранное сегодня</span>
    </div>
    <div class="notification-banner" style="border-color:rgba(247,151,30,.3)">
      <span class="notif-icon">📋</span>
      <span><b>Flai:</b> Завтра подписание договора с Нурсулу К. в 11:00 ✍️</span>
    </div>
    <div class="notification-banner" style="border-color:rgba(247,151,30,.3)">
      <span class="notif-icon">💡</span>
      <span><b>Совет:</b> Клиент держит квартиру &lt; 2 лет — предложите обмен для экономии на налогах!</span>
    </div>
  </div>

</div>

<!-- BOTTOM NAVBAR -->
<div id="bottombar">
  <div class="nav-item active" id="nav-feed" onclick="showScreen('feed-screen');setNav(this)">
    <i class="fas fa-film"></i><span>Лента</span>
  </div>
  <div class="nav-item" id="nav-search" onclick="showScreen('search-screen');setNav(this)">
    <i class="fas fa-search"></i><span>Поиск</span>
  </div>
  <button class="nav-add-btn pulse" onclick="requireAuth(function(){openModal('add-listing-modal')})">
    <i class="fas fa-plus"></i>
  </button>
  <div class="nav-item" id="nav-flai" onclick="showScreen('flai-screen');setNav(this)" style="position:relative">
    <i class="fas fa-robot"></i><span>Flai</span>
    <span class="badge">2</span>
  </div>
  <div class="nav-item" id="nav-aira" onclick="requireAuth(function(){showScreen('aira-screen');setNav(document.getElementById('nav-aira'))})">
    <i class="fas fa-comments"></i><span>Aira</span>
    <span class="badge">5</span>
  </div>
</div>

<!-- ===== MODALS ===== -->

<!-- AUTH -->
<div class="modal-overlay" id="auth-modal" onclick="closeModalOut(event,'auth-modal')">
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div style="padding:0 20px 20px">
      <div style="display:flex;background:var(--bg-input);border-radius:14px;padding:4px;margin-bottom:20px">
        <button class="role-btn active" style="border-radius:10px" id="tab-login" onclick="switchAuthTab('login')">Войти</button>
        <button class="role-btn" style="border-radius:10px" id="tab-register" onclick="switchAuthTab('register')">Регистрация</button>
      </div>
      <div id="login-form">
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" id="login-email" placeholder="you@mail.com"></div>
        <div class="form-group"><label class="form-label">Пароль</label><input class="form-input" type="password" id="login-pass" placeholder="••••••••"></div>
        <button class="btn-primary" onclick="doLogin()">Войти 🚀</button>
        <button class="btn-secondary" onclick="switchAuthTab('register')">Нет аккаунта? Зарегистрироваться</button>
      </div>
      <div id="register-form" style="display:none">
        <div class="notification-banner" style="margin-bottom:16px"><span class="notif-icon">🏠</span><span>Только для риэлторов. Статус присваивается автоматически.</span></div>
        <div class="form-group"><label class="form-label">Имя и фамилия</label><input class="form-input" type="text" id="reg-name" placeholder="Айгерим Касымова"></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" id="reg-email" placeholder="you@mail.com"></div>
        <div class="form-group"><label class="form-label">Телефон</label><input class="form-input" type="tel" id="reg-phone" placeholder="+7 777 000 00 00"></div>
        <div class="form-group"><label class="form-label">Агентство</label>
          <select class="form-input form-select" id="reg-agency">
            <option value="">Выбрать...</option>
            <option>Самозанятый риэлтор</option><option>Century 21</option><option>Etagi</option><option>Royal Group</option><option>Другое агентство</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Опыт</label>
          <select class="form-input form-select" id="reg-exp">
            <option>До 1 года</option><option>1–3 года</option><option>3–5 лет</option><option>5+ лет</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Пароль</label><input class="form-input" type="password" id="reg-pass" placeholder="Минимум 8 символов"></div>
        <button class="btn-primary" onclick="doRegister()">Зарегистрироваться 🎉</button>
        <button class="btn-secondary" onclick="switchAuthTab('login')">Уже есть аккаунт? Войти</button>
      </div>
    </div>
  </div>
</div>

<!-- ADD LISTING -->
<div class="modal-overlay" id="add-listing-modal" onclick="closeModalOut(event,'add-listing-modal')">
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-title">Добавить объект <span class="ai-badge"><i class="fas fa-robot"></i> AI</span></div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">Тип объекта</label>
        <select class="form-input form-select" id="add-type" onchange="updateAIPreview()">
          <option value="apartment">🏢 Квартира</option>
          <option value="house">🏡 Дом / Дача</option>
          <option value="commercial">🏪 Коммерческая</option>
          <option value="land">🌳 Участок</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label class="form-label">Комнаты</label>
          <select class="form-input form-select" id="add-rooms" onchange="updateAIPreview()">
            <option>1</option><option>2</option><option selected>3</option><option>4</option><option>5+</option><option value="">—</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Площадь м²</label><input class="form-input" type="number" id="add-area" placeholder="85" oninput="updateAIPreview()"></div>
      </div>
      <div class="form-group"><label class="form-label">Район</label>
        <select class="form-input form-select" id="add-district" onchange="updateAIPreview()">
          <option>Есиль</option><option>Алматинский</option><option>Сарыарка</option><option>Байконыр</option><option>Нура</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Цена (₸)</label><input class="form-input" type="number" id="add-price" placeholder="85000000" oninput="updateAIPreview()"></div>
      <div class="form-group" style="display:flex;align-items:center;gap:10px;background:var(--bg-input);border-radius:14px;padding:12px 16px;border:1.5px solid var(--border)">
        <input type="checkbox" id="add-exchange" style="width:18px;height:18px;accent-color:var(--accent2)" onchange="updateAIPreview()">
        <label for="add-exchange" style="font-size:14px;font-weight:600;cursor:pointer">🔄 Рассмотрим обмен <span class="tag-tax">Актуально 2026!</span></label>
      </div>
      <div class="form-group" style="margin-top:8px">
        <label class="form-label">Описание <span class="ai-badge"><i class="fas fa-magic"></i> AI</span></label>
        <textarea class="form-input form-textarea" id="add-desc" placeholder="Опишите объект..."></textarea>
        <div id="ai-preview" style="display:none">
          <div class="ai-suggestion" id="ai-text"></div>
          <div class="ai-actions">
            <button class="ai-action-btn" onclick="useAIText()">✅ Использовать</button>
            <button class="ai-action-btn" onclick="updateAIPreview(true)">🔄 Другой вариант</button>
            <button class="ai-action-btn" onclick="document.getElementById('ai-preview').style.display='none'">✕</button>
          </div>
        </div>
        <button class="btn-outline" style="width:100%;margin-top:8px" onclick="generateAIDesc()">
          <i class="fas fa-robot"></i> Сгенерировать AI-описание
        </button>
      </div>
      <div class="form-group">
        <label class="form-label">Медиа</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div style="border:2px dashed var(--border);border-radius:14px;padding:20px;text-align:center;cursor:pointer" onclick="showToast('📷 Загрузка фото')"><div style="font-size:28px;margin-bottom:6px">📷</div><div style="font-size:13px;color:var(--text-muted)">Фото</div></div>
          <div style="border:2px dashed var(--border);border-radius:14px;padding:20px;text-align:center;cursor:pointer" onclick="showToast('🎬 Загрузка видео')"><div style="font-size:28px;margin-bottom:6px">🎬</div><div style="font-size:13px;color:var(--text-muted)">Видео</div></div>
        </div>
      </div>
      <button class="btn-primary" onclick="submitListing()"><i class="fas fa-rocket"></i> Опубликовать объект</button>
    </div>
  </div>
</div>

<!-- DETAIL -->
<div class="modal-overlay" id="detail-modal" onclick="closeModalOut(event,'detail-modal')">
  <div class="modal-sheet" id="detail-modal-sheet"></div>
</div>

<!-- CALENDAR EVENT -->
<div class="modal-overlay" id="event-modal" onclick="closeModalOut(event,'event-modal')">
  <div class="modal-sheet">
    <div class="modal-handle"></div>
    <div class="modal-title">Новое событие 📅</div>
    <div class="modal-body">
      <div class="form-group"><label class="form-label">Тип</label>
        <select class="form-input form-select" id="ev-type">
          <option value="showing">🏠 Показ объекта</option>
          <option value="call">📞 Звонок клиенту</option>
          <option value="deal">✍️ Подписание договора</option>
          <option value="meeting">🤝 Встреча</option>
        </select>
      </div>
      <div class="form-group"><label class="form-label">Заголовок</label><input class="form-input" type="text" id="ev-title" placeholder="Показ 3к в Есиле"></div>
      <div class="form-group"><label class="form-label">Клиент</label><input class="form-input" type="text" id="ev-client" placeholder="Имя клиента"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="form-group"><label class="form-label">Дата</label><input class="form-input" type="date" id="ev-date"></div>
        <div class="form-group"><label class="form-label">Время</label><input class="form-input" type="time" id="ev-time"></div>
      </div>
      <div class="form-group"><label class="form-label">Заметка</label><textarea class="form-input form-textarea" id="ev-note" placeholder="Взять ключи..."></textarea></div>
      <div class="notification-banner" style="border-color:rgba(108,99,255,.3)">
        <span class="notif-icon">🤖</span>
        <span><b>Flai</b> напомнит за 30 минут с мотивирующим сообщением!</span>
      </div>
      <button class="btn-primary" onclick="saveEvent()">Добавить в календарь ✅</button>
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
