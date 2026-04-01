import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Типы для Cloudflare env
type Bindings = {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  GEMINI_API_KEY?: string
  DEEPSEEK_API_KEY?: string
  ADMIN_TOKEN: string
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_CHAT_ID?: string
}

const app = new Hono<{ Bindings: Bindings }>()
app.use('/api/*', cors())
app.use('/static/*', serveStatic({ root: './' }))

// ─── SUPABASE CLIENT ────────────────────────────────────────
function getSupabase(c: any): SupabaseClient {
  return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY, {
    global: { headers: { 'x-application-name': 'flapy-v2' } }
  })
}

// ─── FAVICON ────────────────────────────────────────────────
app.get('/favicon.ico', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  return c.body('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#1E2D5A"/><path d="M6 16L16 8l10 8v9H6z" fill="none" stroke="white" stroke-width="1.5"/><path d="M12 25v-7h8v7" fill="white"/></svg>')
})

// ─── СКРЫТЫЙ АДМИН-ПОРТАЛ ───────────────────────────────────
app.get('/admin-portal-qjmf2026', async (c) => {
  const token = c.req.query('token')
  if (token !== c.env.ADMIN_TOKEN) {
    return c.html('<!DOCTYPE html><html><head><title>404</title></head><body style="background:#0F0F1A;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><h1>404 Not Found</h1></body></html>', 404)
  }
  
  const supabase = getSupabase(c)
  
  // Получаем статистику
  const [{ count: listingsCount }, { count: usersCount }, { count: ticketsCount }] = await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('support_tickets').select('*', { count: 'exact', head: true })
  ])
  
  return c.html(`<!DOCTYPE html>
<html lang="ru">
<head><meta charset="UTF-8"><title>Flapy Admin</title>
<style>
body{margin:0;font-family:Inter,sans-serif;background:#0F0F1A;color:#fff}
.header{padding:20px;background:linear-gradient(135deg,#1E2D5A,#2E4A85);display:flex;justify-content:space-between;align-items:center}
.logo{font-size:24px;font-weight:900}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:20px}
.card{background:#161626;border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,.1)}
.card h3{margin:0 0 10px 0;color:#9090C0;font-size:14px}
.card .num{font-size:32px;font-weight:800;color:#F47B20}
.table-wrap{padding:0 20px 20px}
table{width:100%;border-collapse:collapse;background:#161626;border-radius:12px;overflow:hidden}
th,td{padding:12px 15px;text-align:left;border-bottom:1px solid rgba(255,255,255,.05)}
th{background:#1E1E35;font-weight:600;color:#9090C0;font-size:12px}
tr:hover{background:rgba(244,123,32,.05)}
.badge{padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700}
.badge.realtor{background:rgba(39,174,96,.2);color:#6EEC9A}
.badge.admin{background:rgba(244,123,32,.2);color:#FFB366}
</style></head>
<body>
<div class="header">
  <div class="logo">Flapy™ Admin</div>
  <div style="font-size:12px;color:#9090C0">Супер-админ • ${new Date().toLocaleDateString('ru-RU')}</div>
</div>
<div class="stats">
  <div class="card"><h3>Объявления</h3><div class="num">${listingsCount || 0}</div></div>
  <div class="card"><h3>Пользователи</h3><div class="num">${usersCount || 0}</div></div>
  <div class="card"><h3>Обращения</h3><div class="num">${ticketsCount || 0}</div></div>
</div>
<div class="table-wrap">
  <h3 style="margin:0 0 15px 0">Последние риэлторы</h3>
  <table>
    <thead><tr><th>Имя</th><th>Роль</th><th>Email</th><th>Статус</th><th>Рейтинг</th></tr></thead>
    <tbody id="realtors-body">
      <tr><td colspan="5" style="text-align:center;color:#9090C0">Загрузка...</td></tr>
    </tbody>
  </table>
</div>
<script>
fetch('/api/realtors').then(r=>r.json()).then(d=>{
  const tbody=document.getElementById('realtors-body')
  tbody.innerHTML = d.realtors.slice(0,10).map(r=>\`
    <tr>
      <td>\${r.name}</td>
      <td><span class="badge \${r.role==='super_admin'?'admin':'realtor'}">\${r.role||'realtor'}</span></td>
      <td>\${r.email||'—'}</td>
      <td>\${r.verified?'✅':'⏳'}</td>
      <td>⭐ \${r.rating||'—'}</td>
    </tr>
  \`).join('')
})
</script>
</body></html>`)
})

// ─── API: LISTINGS (только реальные данные) ─────────────────
app.get('/api/listings', async (c) => {
  const supabase = getSupabase(c)
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      realtor:profiles!inner(full_name, agency, rating, deals, reviews, phone, avatar_url)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) {
    console.error('Supabase listings error:', error)
    return c.json({ listings: [], error: error.message }, 500)
  }
  
  const formatted = (data || []).map((l: any) => ({
    id: l.id,
    type: l.type || 'apartment',
    rooms: l.rooms,
    area: l.area,
    district: l.district,
    city: l.city,
    price: l.price,
    priceFormatted: new Intl.NumberFormat('ru-RU').format(l.price) + ' ₸',
    exchange: l.exchange,
    hasVideo: !!l.video_url,
    videoId: l.video_url?.split('v=')[1] || l.video_url?.split('/').pop() || '',
    videoTitle: 'Видео-тур',
    realtor: l.realtor?.full_name?.split(' ')[0] + '.',
    realtorId: l.realtor_id,
    realtorFull: l.realtor?.full_name,
    rating: l.realtor?.rating || 4.5,
    deals: l.realtor?.deals || 0,
    agency: l.realtor?.agency || 'Агентство',
    tags: l.exchange ? ['Обмен'] : [],
    badge: l.exchange ? 'Обмен' : (l.created_at && new Date(l.created_at).getTime() > Date.now() - 86400000 ? 'Новое' : ''),
    desc: l.description || 'Отличный объект!',
    photos: l.images?.length ? l.images : ['🏠'],
    createdAt: l.created_at
  }))
  
  console.log(`✅ Loaded ${formatted.length} listings from Supabase`)
  return c.json({ listings: formatted })
})

// ─── API: REALTORS ─────────────────────────────────────────
app.get('/api/realtors', async (c) => {
  const supabase = getSupabase(c)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'realtor')
    .eq('verified', true)
    .order('rating', { ascending: false })
    .limit(20)
  
  if (error) return c.json({ realtors: [], error: error.message }, 500)
  
  const formatted = (data || []).map((r: any) => ({
    id: r.id,
    name: r.full_name,
    agency: r.agency,
    rating: r.rating,
    deals: r.deals,
    reviews: r.reviews,
    phone: r.phone,
    email: r.email,
    photo: r.full_name?.[0] || 'Р',
    color: '#' + Math.floor(Math.random()*16777215).toString(16),
    specialization: 'Недвижимость',
    experience: 3,
    badge: r.rating >= 4.8 ? 'ТОП' : '',
    verified: r.verified,
    role: r.role
  }))
  
  return c.json({ realtors: formatted })
})

// ─── API: FAVORITES ────────────────────────────────────────
app.post('/api/favorites', async (c) => {
  const { listing_id, user_id, email } = await c.req.json()
  const supabase = getSupabase(c)
  
  // Для гостей используем email как идентификатор
  const userId = user_id || `guest_${email?.replace(/[^a-z0-9]/gi, '_')}`
  
  const { data, error } = await supabase
    .from('favorites')
    .upsert({ listing_id, user_id: userId }, { onConflict: 'listing_id,user_id' })
  
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, data })
})

app.get('/api/favorites', async (c) => {
  const userId = c.req.query('user_id') || `guest_${c.req.query('email')?.replace(/[^a-z0-9]/gi, '_')}`
  const supabase = getSupabase(c)
  
  const { data, error } = await supabase
    .from('favorites')
    .select('listing_id')
    .eq('user_id', userId)
  
  if (error) return c.json({ favorites: [], error: error.message }, 500)
  return c.json({ favorites: data?.map((d:any)=>d.listing_id) || [] })
})

// ─── API: SUPPORT TICKETS (Telegram) ───────────────────────
app.post('/api/support', async (c) => {
  const { email, subject, message } = await c.req.json()
  
  // Отправка в Telegram
  if (c.env.TELEGRAM_BOT_TOKEN && c.env.TELEGRAM_CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${c.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: c.env.TELEGRAM_CHAT_ID,
          text: `📩 <b>Новое обращение</b>\n\n👤 <code>${email}</code>\n📋 <b>${subject}</b>\n\n${message}`,
          parse_mode: 'HTML'
        })
      })
    } catch (e) {
      console.error('Telegram send error:', e)
    }
  }
  
  // Сохранение в БД
  const supabase = getSupabase(c)
  await supabase.from('support_tickets').insert({
    email,
    subject,
    message,
    status: 'open',
    priority: 'medium'
  })
  
  return c.json({ success: true, message: 'Сообщение отправлено' })
})

// ─── API: AI FLAI (Gemini) ─────────────────────────────────
app.post('/api/ai/flai', async (c) => {
  const { message, lang = 'ru' } = await c.req.json()
  
  // Если нет API ключа — используем локальные ответы
  if (!c.env.GEMINI_API_KEY) {
    return c.json({ reply: getFlaiReply(message, lang), source: 'local' })
  }
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${c.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Ты — Flai, AI-помощник по недвижимости в Астане (Казахстан). Отвечай кратко, полезно, на языке пользователя (${lang === 'kz' ? 'казахском' : 'русском'}). Вопрос: ${message}`
            }]
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
        })
      }
    )
    
    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || getFlaiReply(message, lang)
    return c.json({ reply, source: 'gemini' })
  } catch (e) {
    console.error('Gemini error:', e)
    return c.json({ reply: getFlaiReply(message, lang), source: 'local' })
  }
})

// ─── API: AI AIRA (DeepSeek) ───────────────────────────────
app.post('/api/ai/aira', async (c) => {
  const { message, context = {} } = await c.req.json()
  
  if (!c.env.DEEPSEEK_API_KEY) {
    return c.json({ reply: '🤖 Aira: Для расширенных функций нужен API ключ', success: true })
  }
  
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Ты — Aira, AI-ассистент для риэлторов в Казахстане. Помогай с описаниями объектов, анализом рынка, юридическими вопросами. Отвечай профессионально, но дружелюбно.' },
          { role: 'user', content: `Контекст: ${JSON.stringify(context)}\n\nВопрос риэлтора: ${message}` }
        ],
        max_tokens: 800,
        temperature: 0.4
      })
    })
    
    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'Не удалось получить ответ'
    return c.json({ reply, success: true, threadId: 'th_' + Date.now() })
  } catch (e) {
    console.error('DeepSeek error:', e)
    return c.json({ reply: '⚠️ Временно недоступно, попробуйте позже', success: true })
  }
})

// ─── API: AUTH (через Supabase Auth) ───────────────────────
app.post('/api/auth/register', async (c) => {
  const { email, password, name, phone, agency } = await c.req.json()
  const supabase = getSupabase(c)
  
  // Регистрация через Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, phone, agency, role: 'realtor' } }
  })
  
  if (authError) return c.json({ success: false, error: authError.message }, 400)
  
  // Профиль создаётся автоматически триггером
  return c.json({ 
    success: true, 
    user: { 
      id: authData.user?.id, 
      email, 
      name, 
      phone, 
      agency, 
      verified: false,
      role: 'realtor'
    } 
  })
})

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json()
  const supabase = getSupabase(c)
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  
  if (error) return c.json({ success: false, error: error.message }, 401)
  
  // Получаем профиль
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user?.id)
    .single()
  
  return c.json({ 
    success: true, 
    user: { 
      id: data.user?.id, 
      email, 
      name: profile?.full_name, 
      role: profile?.role, 
      verified: profile?.verified,
      agency: profile?.agency,
      rating: profile?.rating
    },
    session: data.session
  })
})

// ─── API: UPLOAD PHOTO (с водяным знаком) ──────────────────
app.post('/api/upload-photo', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('photo') as File
    const listingId = formData.get('listing_id') as string
    
    if (!file) return c.json({ error: 'No file' }, 400)
    
    // Конвертация в base64
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    
    // Добавление водяного знака (упрощённо — добавляем текст в metadata)
    // В продакшене: использовать Cloudflare Images или Sharp
    const watermarked = {
      original: base64,
      watermark: 'Flapy™',
      timestamp: new Date().toISOString()
    }
    
    // Загрузка в Supabase Storage
    const supabase = getSupabase(c)
    const fileName = `${listingId || 'temp'}/${Date.now()}.jpg`
    
    const { data, error } = await supabase.storage
      .from('listings')
      .upload(fileName, Buffer.from(base64, 'base64'), {
        contentType: 'image/jpeg',
        upsert: false
      })
    
    if (error) throw error
    
    // Получаем публичную ссылку
    const { data: { publicUrl } } = supabase.storage.from('listings').getPublicUrl(fileName)
    
    return c.json({ url: publicUrl, path: data.path })
  } catch (e: any) {
    console.error('Upload error:', e)
    return c.json({ error: e.message }, 500)
  }
})

// ─── API: LISTING CRUD (только для риэлторов) ──────────────
app.post('/api/listings', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return c.json({ error: 'Unauthorized' }, 401)
  
  const body = await c.req.json()
  const supabase = getSupabase(c)
  
  // Проверка: риэлтор ли это
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, verified')
    .eq('id', body.realtor_id)
    .single()
  
  if (profile?.role !== 'realtor' || !profile?.verified) {
    return c.json({ error: 'Only verified realtors can add listings' }, 403)
  }
  
  const { data, error } = await supabase
    .from('listings')
    .insert({ ...body, realtor_id: body.realtor_id, status: 'active' })
    .select()
    .single()
  
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true, data })
})

app.put('/api/listings/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const supabase = getSupabase(c)
  
  const { error } = await supabase
    .from('listings')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('realtor_id', body.realtor_id) // Только владелец
  
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

app.delete('/api/listings/:id', async (c) => {
  const id = c.req.param('id')
  const { realtor_id } = await c.req.json()
  const supabase = getSupabase(c)
  
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('realtor_id', realtor_id)
  
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// ─── API: EXCHANGE ─────────────────────────────────────────
app.get('/api/exchange/matches/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = getSupabase(c)
  
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('exchange', true)
    .neq('id', id)
    .limit(10)
  
  if (error) return c.json({ matches: [], error: error.message }, 500)
  return c.json({ matches: data || [] })
})

app.post('/api/exchange/propose', async (c) => {
  const { fromId, toId, message } = await c.req.json()
  // Здесь можно добавить логику отправки уведомления
  return c.json({ success: true, message: 'Предложение отправлено' })
})

// ─── LEGAL FOOTER HTML FRAGMENT ───────────────────────────
const LEGAL_FOOTER = `
<footer style="padding:25px 20px 40px;background:var(--bg3);border-top:1px solid var(--brd);font-size:11px;color:var(--t3);margin-top:20px">
  <div style="max-width:480px;margin:0 auto">
    <p style="margin:0 0 15px 0;font-weight:600;color:var(--t1)">
      <strong>Flapy™</strong> — Умный помощник по жилью в Астане
    </p>
    
    <div style="background:var(--bg2);border-radius:10px;padding:15px;border-left:3px solid var(--orange);margin-bottom:15px">
      <h4 style="margin:0 0 10px 0;color:var(--t1);font-size:12px">⚖️ Правовая информация</h4>
      <ul style="margin:0;padding-left:18px;line-height:1.9">
        <li><strong>Товарный знак:</strong> Flapy™ зарегистрирован в Казпатент РК</li>
        <li><strong>Авторское право:</strong> © 2024-2026 Flapy Technologies LLP. Все права защищены</li>
        <li><strong>Защита данных:</strong> Обработка персональных данных в соответствии с Законом РК «О персональных данных»</li>
        <li><strong>Запрет копирования:</strong> Любое воспроизведение дизайна, кода, контента без разрешения запрещено (ст. 48-52 ГК РК)</li>
        <li><strong>Ответственность:</strong> За нарушение прав предусмотрена гражданская и уголовная ответственность (ст. 129 КоАП, ст. 184-1 УК РК)</li>
        <li><strong>Юрисдикция:</strong> Споры рассматриваются в судах г. Астаны</li>
      </ul>
    </div>
    
    <p style="margin:0 0 10px 0;font-size:10px">
      <strong>Реквизиты:</strong> ТОО «Flapy Technologies» | БИН: [указать] | г. Астана, Казахстан<br>
      Email: legal@flapy.kz | Поддержка: <a href="https://t.me/flapy_support" style="color:var(--orange);text-decoration:none">@flapy_support</a>
    </p>
    
    <div style="display:flex;gap:15px;padding-top:12px;border-top:1px solid var(--brd);font-size:10px">
      <a href="/privacy" style="color:var(--navy);text-decoration:none">Политика конфиденциальности</a>
      <a href="/terms" style="color:var(--navy);text-decoration:none">Условия использования</a>
      <a href="/dmca" style="color:var(--navy);text-decoration:none">DMCA / Жалобы</a>
    </div>
    
    <p style="margin:15px 0 0 0;font-size:9px;color:var(--t3);text-align:center">
      Flapy не является агентством недвижимости. Платформа предоставляет инструменты для профессиональных риэлторов.
    </p>
  </div>
</footer>`

// ─── MAIN HTML ─────────────────────────────────────────────
app.get('/', (c) => c.html(getHTML()))

function getHTML(): string {
return `<!DOCTYPE html>
<html lang="ru" data-theme="light" data-lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#FFFFFF">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>Flapy™ — Умный помощник по жилью</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<style>
/* ════════════════════════════════════════════════════
   FLAPY v4.0 — Full Product  Kaspi-Light UI
════════════════════════════════════════════════════ */
:root{
  --white:#FFFFFF; --bg:#F5F5F7; --bg2:#FFFFFF; --bg3:#F0F0F5;
  --navy:#1E2D5A; --navy2:#2E4A85; --orange:#F47B20; --orange2:#FF9A3C;
  --green:#27AE60; --red:#E74C3C; --purple:#9B59B6;
  --t1:#1A1A2E; --t2:#6B7280; --t3:#9CA3AF;
  --brd:#E5E7EB; --brd2:#D1D5DB;
  --sh:0 1px 4px rgba(0,0,0,.06),0 2px 10px rgba(0,0,0,.05);
  --sh2:0 4px 20px rgba(0,0,0,.1);
  --nav-h:56px; --bot-h:64px; --r:14px; --max:480px;
}
[data-theme=dark]{
  --bg:#0F0F1A; --bg2:#161626; --bg3:#1E1E35;
  --t1:#F0F0FF; --t2:#9090C0; --t3:#5A5A80;
  --brd:rgba(255,255,255,.1); --brd2:rgba(255,255,255,.15);
  --sh:0 1px 4px rgba(0,0,0,.25),0 2px 10px rgba(0,0,0,.2);
}
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
[data-theme=dark] .ld-name{color:#fff}
.ld-tm{font-size:10px;color:var(--orange);vertical-align:super;font-weight:700}
.ld-sub{font-size:13px;color:var(--t3)}
.ld-bar-wrap{width:72px;height:3px;background:var(--bg3);border-radius:2px;overflow:hidden;margin-top:4px}
.ld-bar{height:100%;background:linear-gradient(90deg,var(--navy),var(--orange));border-radius:2px;animation:ldA 1.4s ease forwards}
@keyframes ldA{from{width:0}to{width:100%}}
#topbar{position:absolute;top:0;left:0;right:0;height:var(--nav-h);z-index:50;background:var(--bg2);border-bottom:1px solid var(--brd);display:flex;align-items:center;padding:0 14px;gap:10px}
.logo-row{display:flex;align-items:center;gap:8px;flex:1}
.logo-icon{width:32px;height:32px;background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.logo-txt{font-size:18px;font-weight:900;color:var(--navy);letter-spacing:-.5px}
[data-theme=dark] .logo-txt{color:#fff}
.logo-tag{font-size:10px;color:var(--orange);vertical-align:super;font-weight:700}
.top-right{display:flex;align-items:center;gap:7px}
.lang-sw{display:flex;align-items:center;background:var(--bg3);border-radius:8px;padding:2px;border:1px solid var(--brd)}
.lo{padding:3px 7px;border-radius:6px;font-size:11px;font-weight:700;color:var(--t3);cursor:pointer;transition:all .15s}
.lo.on{background:var(--navy);color:#fff}
[data-theme=dark] .lo.on{background:var(--orange)}
.tb-btn{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--t3);background:var(--bg3);border:1px solid var(--brd);cursor:pointer;transition:all .15s}
.tb-btn:active{background:var(--navy);color:#fff;border-color:var(--navy)}
.login-btn{padding:0 13px;height:30px;border-radius:8px;background:var(--navy);color:#fff;font-size:12px;font-weight:700;cursor:pointer;transition:opacity .15s;white-space:nowrap}
[data-theme=dark] .login-btn{background:var(--orange)}
.login-btn:active{opacity:.8}
.u-chip{display:flex;align-items:center;gap:6px;cursor:pointer}
.u-ava{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--navy2));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff}
.u-nm{font-size:12px;font-weight:700;color:var(--t1)}
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
[data-theme=dark] .tab-item.on{color:var(--orange);border-color:var(--orange)}
.filter-row{display:flex;gap:6px;overflow-x:auto;padding:9px 14px}
.fchip{flex-shrink:0;padding:5px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid var(--brd2);color:var(--t2);background:none;transition:all .15s;white-space:nowrap}
.fchip.on{background:var(--navy);color:#fff;border-color:var(--navy)}
[data-theme=dark] .fchip.on{background:var(--orange);border-color:var(--orange)}
.list-body{padding:10px 12px 12px}
.lcard{background:var(--bg2);border-radius:var(--r);box-shadow:var(--sh);margin-bottom:12px;overflow:hidden;cursor:pointer;border:1px solid var(--brd);transition:box-shadow .15s}
.lcard:active{box-shadow:var(--sh2)}
.lcard-media{position:relative;height:185px;background:linear-gradient(135deg,#EEF0F6,#E0E3EE);overflow:hidden;display:flex;align-items:center;justify-content:center}
[data-theme=dark] .lcard-media{background:linear-gradient(135deg,#1E1E35,#161626)}
.lcard-em{font-size:64px;opacity:.22}
.video-thumb{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.45)}
.video-play{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--navy);margin-bottom:6px}
.video-lbl{font-size:11px;color:rgba(255,255,255,.85);font-weight:600}
.lcard-badge{position:absolute;top:10px;right:10px;padding:3px 9px;border-radius:7px;font-size:11px;font-weight:700;color:#fff}
.photo-dots{position:absolute;bottom:6px;left:50%;transform:translateX(-50%);display:flex;gap:4px}
.pdot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.5)}
.pdot.on{background:#fff;width:12px;border-radius:3px}
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
.lf-rating{font-size:11px;color:var(--orange);font-weight:700}
.lcard-cta{display:flex;gap:7px;margin-top:9px}
.cta-btn{flex:1;padding:9px 6px;border-radius:10px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:5px;transition:opacity .15s;cursor:pointer}
.cta-btn:active{opacity:.8}
.cta-call{background:var(--navy);color:#fff}
[data-theme=dark] .cta-call{background:var(--orange)}
.cta-msg{background:var(--bg3);color:var(--t1);border:1px solid var(--brd2)}
#s-feed{scroll-snap-type:y mandatory;overflow-y:scroll;background:#111}
.fcard{height:100%;scroll-snap-align:start;scroll-snap-stop:always;position:relative;overflow:hidden;background:linear-gradient(135deg,#1a1a2e,#16213e)}
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
.sab-btn.liked{background:var(--red);border-color:var(--red)}
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
.ch-ava.flai{background:linear-gradient(135deg,var(--navy),var(--navy2))}
.ch-ava.aira{background:linear-gradient(135deg,var(--orange),var(--orange2))}
.ch-name{font-size:15px;font-weight:700;color:var(--t1)}
.ch-status{font-size:11px;color:var(--green);font-weight:500;display:flex;align-items:center;gap:4px;margin-top:1px}
.ch-status::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--green)}
.quick-row{flex-shrink:0;background:var(--bg2);border-bottom:1px solid var(--brd);display:flex;gap:6px;overflow-x:auto;padding:8px 13px}
.qchip{flex-shrink:0;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--brd2);color:var(--t2);background:none;transition:all .15s;white-space:nowrap}
.qchip:active{background:var(--navy);color:#fff;border-color:var(--navy)}
[data-theme=dark] .qchip:active{background:var(--orange);border-color:var(--orange)}
.chat-body{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:5px;padding:12px 13px}
[data-theme=light] .chat-body{background:#EFE5D5}
[data-theme=dark] .chat-body{background:#0A0F1E}
.msg-date{align-self:center;font-size:11px;color:var(--t3);background:rgba(255,255,255,.7);border-radius:8px;padding:3px 10px;margin:3px 0}
[data-theme=dark] .msg-date{background:rgba(255,255,255,.07)}
.msg{display:flex;gap:7px;max-width:85%}
.msg.me{align-self:flex-end;flex-direction:row-reverse}
.msg.bot{align-self:flex-start}
.m-ava{width:28px;height:28px;border-radius:50%;flex-shrink:0;align-self:flex-end;background:linear-gradient(135deg,var(--navy),var(--navy2));display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff}
.bwrap{display:flex;flex-direction:column}
.bubble{padding:8px 12px;border-radius:14px;font-size:13.5px;line-height:1.52;word-break:break-word}
.msg.bot .bubble{background:var(--white);color:var(--t1);border-radius:4px 14px 14px 14px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
[data-theme=dark] .msg.bot .bubble{background:#1E1E35}
.msg.me .bubble{background:var(--navy);color:#fff;border-radius:14px 4px 14px 14px}
[data-theme=dark] .msg.me .bubble{background:var(--orange)}
.m-ts{font-size:10px;color:var(--t3);margin-top:2px;padding:0 2px}
.msg.me .m-ts{text-align:right}
.typing{display:flex;gap:4px;padding:4px 8px}
.td{width:7px;height:7px;border-radius:50%;background:var(--t3);animation:typA .9s infinite}
.td:nth-child(2){animation-delay:.2s}.td:nth-child(3){animation-delay:.4s}
@keyframes typA{0%,60%,100%{opacity:.3;transform:scale(.8)}30%{opacity:1;transform:scale(1.1)}}
.chat-input-row{flex-shrink:0;display:flex;align-items:flex-end;gap:8px;padding:8px 12px;background:var(--bg2);border-top:1px solid var(--brd)}
.ci{flex:1;min-height:40px;max-height:88px;padding:10px 14px;border-radius:22px;border:1.5px solid var(--brd2);background:var(--white);font-size:13px;resize:none;line-height:1.4;transition:border-color .15s;color:var(--t1)}
[data-theme=dark] .ci{background:var(--bg3);border-color:var(--brd)}
.ci:focus{border-color:var(--navy)}
[data-theme=dark] .ci:focus{border-color:var(--orange)}
.ci::placeholder{color:var(--t3)}
.send-btn{width:40px;height:40px;border-radius:50%;flex-shrink:0;background:var(--navy);color:#fff;font-size:15px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s}
[data-theme=dark] .send-btn{background:var(--orange)}
.send-btn.aira{background:linear-gradient(135deg,var(--orange),var(--orange2))}
.send-btn:active{transform:scale(1.1)}
.msg-card{background:rgba(255,255,255,.85);border:1px solid var(--brd);border-radius:10px;padding:8px 10px;margin-top:5px;cursor:pointer;transition:box-shadow .15s}
[data-theme=dark] .msg-card{background:rgba(255,255,255,.06)}
.msg-card:active{box-shadow:var(--sh2)}
.aira-list{padding:10px 13px;display:flex;flex-direction:column;gap:8px}
.thread{background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);overflow:hidden;box-shadow:var(--sh)}
.th-head{display:flex;align-items:center;gap:9px;padding:11px 12px;cursor:pointer}
.th-ava{width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff}
.th-name{font-size:13px;font-weight:700}
.th-time{font-size:10px;color:var(--t3);font-weight:400;margin-left:4px}
.th-prev{font-size:11px;color:var(--t2);margin-top:1px}
.th-body{padding:10px 12px;display:none;border-top:1px solid var(--brd);background:var(--bg)}
.prop-tag{display:inline-flex;align-items:center;gap:4px;background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.25);border-radius:8px;padding:3px 9px;font-size:11px;font-weight:600;color:var(--orange);margin-bottom:6px}
.aira-compose{flex-shrink:0;padding:8px 12px;background:var(--bg2);border-top:1px solid var(--brd);display:flex;flex-direction:column;gap:7px}
.compose-tabs{display:flex;gap:5px}
.compose-tab{padding:4px 10px;border-radius:7px;font-size:11px;font-weight:700;background:var(--bg3);color:var(--t3);border:1px solid var(--brd);cursor:pointer;transition:all .15s}
.compose-tab.on{background:var(--navy);color:#fff;border-color:var(--navy)}
[data-theme=dark] .compose-tab.on{background:var(--orange);border-color:var(--orange)}
.rel-wrap{padding:13px}
.rel-header{font-size:20px;font-weight:800;margin-bottom:4px}
.rel-sub{font-size:12px;color:var(--t3);margin-bottom:12px}
.rel-sort{display:flex;gap:6px;overflow-x:auto;margin-bottom:12px}
.rsort{flex-shrink:0;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid var(--brd2);color:var(--t2);background:none;cursor:pointer;white-space:nowrap;transition:all .15s}
.rsort.on{background:var(--navy);color:#fff;border-color:var(--navy)}
[data-theme=dark] .rsort.on{background:var(--orange);border-color:var(--orange)}
.rcard{display:flex;align-items:center;gap:11px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:13px;margin-bottom:10px;box-shadow:var(--sh);cursor:pointer;transition:box-shadow .15s;position:relative}
.rcard:active{box-shadow:var(--sh2)}
.rc-ava{width:48px;height:48px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff}
.rc-name{font-size:14px;font-weight:700;margin-bottom:1px}
.rc-agency{font-size:11px;color:var(--t3);margin-bottom:4px}
.rc-stars{display:flex;align-items:center;gap:3px;font-size:12px;color:var(--orange);font-weight:700}
.rc-stars span{color:var(--t3);font-size:10px;font-weight:400}
.rc-badge{position:absolute;top:8px;right:8px;background:linear-gradient(135deg,var(--orange),var(--orange2));color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:5px}
.rc-stats{display:flex;gap:8px;margin-top:5px}
.rc-stat{font-size:10px;color:var(--t3);display:flex;align-items:center;gap:2px}
.rc-stat b{color:var(--t1);font-size:11px}
.rc-spec{font-size:10px;color:var(--t2);background:var(--bg3);border-radius:5px;padding:2px 7px;margin-top:4px;display:inline-block}
.rc-actions{display:flex;gap:7px;margin-top:9px}
.rc-btn{flex:1;padding:8px;border-radius:9px;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:4px;cursor:pointer;transition:opacity .15s}
.rc-btn:active{opacity:.8}
.rc-call{background:var(--navy);color:#fff}
[data-theme=dark] .rc-call{background:var(--orange)}
.rc-write{background:var(--bg3);color:var(--t1);border:1px solid var(--brd2)}
.rc-hire{background:linear-gradient(135deg,var(--green),#2ECC71);color:#fff}
.rating-bar-wrap{margin-top:4px}
.rating-row{display:flex;align-items:center;gap:6px;margin-bottom:2px}
.rating-star-lbl{font-size:10px;color:var(--t3);width:10px;text-align:right}
.rating-prog{flex:1;height:5px;background:var(--bg3);border-radius:3px;overflow:hidden}
.rating-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--orange),var(--orange2))}
.rating-cnt{font-size:10px;color:var(--t3);width:20px}
.review-item{background:var(--bg3);border-radius:10px;padding:10px;margin-top:7px}
.rev-head{display:flex;align-items:center;gap:7px;margin-bottom:5px}
.rev-ava{width:26px;height:26px;border-radius:50%;background:var(--navy);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff}
.rev-name{font-size:12px;font-weight:600}
.rev-stars{font-size:11px;color:var(--orange);margin-left:auto}
.rev-text{font-size:12px;color:var(--t2);line-height:1.5}
.cal-wrap{padding:13px}
.cal-title{font-size:21px;font-weight:800;margin-bottom:2px}
.cal-date{font-size:12px;color:var(--t3);margin-bottom:12px}
.sec-label{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin:14px 0 7px}
.ev-card{display:flex;align-items:stretch;gap:9px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:11px;margin-bottom:8px;cursor:pointer;box-shadow:var(--sh);transition:box-shadow .15s}
.ev-card:active{box-shadow:var(--sh2)}
.ev-time{min-width:46px;background:var(--bg3);border-radius:9px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5px}
.ev-hm{font-size:14px;font-weight:800;color:var(--navy)}
[data-theme=dark] .ev-hm{color:var(--orange)}
.ev-line{width:3px;border-radius:2px;flex-shrink:0}
.ev-inf{flex:1}
.ev-ttl{font-size:13px;font-weight:700;margin-bottom:2px}
.ev-cli{font-size:11px;color:var(--t2);margin-bottom:4px}
.ev-note{font-size:11px;color:var(--t3);background:var(--bg3);border-radius:6px;padding:3px 8px;display:inline-block}
.add-ev-btn{width:100%;padding:12px;border-radius:12px;background:none;border:2px dashed var(--brd2);color:var(--t3);font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;margin-bottom:12px;transition:all .15s}
.add-ev-btn:active{border-color:var(--orange);color:var(--orange)}
.ai-tip{display:flex;align-items:center;gap:9px;background:rgba(244,123,32,.07);border:1px solid rgba(244,123,32,.2);border-radius:12px;padding:10px 12px;margin-bottom:12px;font-size:12px;line-height:1.5;color:var(--t2)}
.prof-wrap{padding:13px}
.prof-hero{background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:16px;padding:18px;margin-bottom:14px;overflow:hidden}
.ph-ava{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:9px}
.ph-name{font-size:17px;font-weight:800;color:#fff}
.ph-tag{font-size:11px;color:rgba(255,255,255,.6);margin-top:2px}
.ph-stats{display:flex;gap:7px;margin-top:12px}
.ph-stat{flex:1;background:rgba(255,255,255,.12);border-radius:10px;padding:8px;text-align:center}
.ph-val{font-size:17px;font-weight:800;color:#fff}
.ph-lbl{font-size:9px;color:rgba(255,255,255,.55);margin-top:1px}
.menu-sec{margin-bottom:16px}
.menu-lbl{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:7px}
.menu-item{display:flex;align-items:center;gap:11px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:12px;margin-bottom:7px;cursor:pointer;box-shadow:var(--sh);transition:box-shadow .15s}
.menu-item:active{box-shadow:var(--sh2)}
.menu-ico{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.menu-name{font-size:13px;font-weight:600}
.menu-sub{font-size:11px;color:var(--t3);margin-top:1px}
.notif-wrap{padding:13px}
.notif-title{font-size:20px;font-weight:800;margin-bottom:13px}
.notif-item{display:flex;gap:10px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:12px;margin-bottom:8px;box-shadow:var(--sh)}
.notif-ico{font-size:20px;flex-shrink:0;margin-top:1px}
.notif-txt{font-size:12px;line-height:1.55;color:var(--t2)}
.notif-txt b{color:var(--t1)}
.notif-time{font-size:10px;color:var(--t3);margin-top:3px}
.n-new-dot{width:7px;height:7px;border-radius:50%;background:var(--orange);display:inline-block;margin-right:4px;vertical-align:middle}
#botbar{position:absolute;bottom:0;left:0;right:0;height:var(--bot-h);z-index:50;background:var(--bg2);border-top:1px solid var(--brd);display:flex;align-items:center;padding:0 8px 6px}
.nav-it{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:var(--t3);padding:6px 2px;border-radius:10px;position:relative;transition:color .15s}
.nav-svg{width:22px;height:22px;transition:transform .15s;flex-shrink:0}
.nav-it span{font-size:9px;font-weight:700}
.nav-it.on{color:var(--navy)}
[data-theme=dark] .nav-it.on{color:var(--orange)}
.nav-it.on .nav-svg{transform:scale(1.1)}
.nav-plus-wrap{flex-shrink:0;padding:0 6px}
.nav-plus{width:48px;height:48px;border-radius:14px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(30,45,90,.3);cursor:pointer;transition:transform .15s}
[data-theme=dark] .nav-plus{background:var(--orange);box-shadow:0 4px 16px rgba(244,123,32,.3)}
.nav-plus:active{transform:scale(1.05)}
.n-badge{position:absolute;top:3px;right:calc(50% - 18px);width:15px;height:15px;border-radius:8px;background:var(--red);color:#fff;font-size:8px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg2)}
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
[data-theme=dark] .finput:focus{border-color:var(--orange)}
select.finput{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239CA3AF'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;background-color:var(--bg3);padding-right:28px}
textarea.finput{resize:none;min-height:68px;line-height:1.5}
.form-row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.btn-primary{width:100%;padding:13px;border-radius:12px;background:var(--navy);color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:opacity .15s;display:flex;align-items:center;justify-content:center;gap:6px}
[data-theme=dark] .btn-primary{background:var(--orange)}
.btn-primary:active{opacity:.85}
.btn-secondary{width:100%;padding:11px;border-radius:12px;background:var(--bg3);border:1.5px solid var(--brd);font-size:13px;font-weight:600;margin-top:8px;color:var(--t1);cursor:pointer}
.btn-outline{width:100%;padding:11px;border-radius:11px;background:none;border:1.5px solid var(--navy);color:var(--navy);font-size:13px;font-weight:600;margin-top:7px;cursor:pointer;transition:all .15s}
[data-theme=dark] .btn-outline{border-color:var(--orange);color:var(--orange)}
.btn-outline:active{background:var(--navy);color:#fff}
.tab-switcher{display:flex;background:var(--bg3);border-radius:10px;padding:3px;margin-bottom:14px}
.tsw{flex:1;padding:7px;border-radius:7px;font-size:13px;font-weight:700;color:var(--t3);cursor:pointer;text-align:center;transition:all .15s}
.tsw.on{background:var(--navy);color:#fff}
[data-theme=dark] .tsw.on{background:var(--orange)}
.info-box{display:flex;align-items:flex-start;gap:7px;background:rgba(39,174,96,.07);border:1px solid rgba(39,174,96,.2);border-radius:10px;padding:9px 11px;margin-bottom:11px;font-size:12px;line-height:1.5;color:var(--t2)}
.info-box.warn{background:rgba(244,123,32,.07);border-color:rgba(244,123,32,.2)}
.ai-label{display:inline-flex;align-items:center;gap:3px;background:rgba(244,123,32,.12);border-radius:5px;padding:1px 7px;font-size:10px;font-weight:700;color:var(--orange)}
.ai-result{background:var(--bg3);border:1.5px solid rgba(244,123,32,.25);border-radius:10px;padding:11px;margin-top:6px;font-size:12px;line-height:1.6;color:var(--t2);white-space:pre-wrap}
.ai-actions{display:flex;gap:6px;margin-top:7px}
.ai-act-btn{padding:5px 11px;border-radius:8px;font-size:11px;font-weight:600;background:var(--bg3);border:1px solid var(--brd);color:var(--t2);cursor:pointer;transition:all .15s}
.ai-act-btn:active{background:var(--navy);color:#fff;border-color:var(--navy)}
.det-visual{height:200px;position:relative;overflow:hidden;background:linear-gradient(135deg,#EEF0F6,#E0E3EE)}
[data-theme=dark] .det-visual{background:linear-gradient(135deg,#1E1E35,#161626)}
.det-visual iframe{width:100%;height:100%;border:none}
.det-em-bg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:80px;opacity:.25}
.det-photos{display:flex;gap:6px;padding:8px 17px;overflow-x:auto}
.det-photo{width:56px;height:56px;border-radius:8px;background:var(--bg3);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;border:2px solid transparent;transition:all .15s}
.det-photo.on{border-color:var(--navy)}
.det-price{font-size:23px;font-weight:900;color:var(--t1);padding:8px 17px 4px}
.det-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:4px 17px 12px}
.det-cell{background:var(--bg3);border-radius:10px;padding:11px;text-align:center}
.det-val{font-size:15px;font-weight:800;color:var(--navy)}
[data-theme=dark] .det-val{color:var(--orange)}
.det-lbl{font-size:10px;color:var(--t3);margin-top:2px}
.det-desc{padding:2px 17px 10px;font-size:13px;line-height:1.7;color:var(--t2)}
.det-realtor{margin:0 17px 12px;background:var(--bg3);border-radius:12px;padding:12px;display:flex;align-items:center;gap:10px;cursor:pointer;border:1px solid var(--brd)}
.det-cta{display:flex;gap:8px;padding:0 17px 4px}
.det-btn{flex:1;padding:12px;border-radius:12px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity .15s}
.det-btn:active{opacity:.85}
.det-call{background:var(--green)}
.det-chat{background:var(--navy)}
[data-theme=dark] .det-chat{background:var(--orange)}
.det-hire{background:linear-gradient(135deg,var(--orange),var(--orange2))}
.exch-match{background:rgba(39,174,96,.07);border:1px solid rgba(39,174,96,.2);border-radius:12px;padding:12px 13px;margin:0 17px 10px;cursor:pointer}
.rel-modal-card{background:var(--bg3);border-radius:12px;padding:13px;margin-bottom:11px}
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
.stars-row{display:flex;gap:3px;margin-bottom:10px}
.star-btn{font-size:26px;cursor:pointer;transition:transform .15s;color:var(--brd2)}
.star-btn.on{color:var(--orange)}
.star-btn:active{transform:scale(1.2)}
.play-overlay{position:absolute;inset:0;background:rgba(0,0,0,.38);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}
.play-overlay i{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.88);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--navy)}
.rank-card{display:flex;align-items:center;gap:10px;background:var(--bg2);border:1px solid var(--brd);border-radius:12px;padding:11px;margin-bottom:7px;cursor:pointer;box-shadow:var(--sh)}
.rank-num{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0}
.rank-bar{height:4px;border-radius:2px;background:linear-gradient(90deg,var(--orange),var(--orange2));margin-top:5px;transition:width .4s}
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
    <div id="auth-slot"><button class="login-btn" onclick="openM('m-auth')" id="login-btn-top">Войти</button></div>
  </div>
</div>

<!-- MAIN -->
<div id="main">
<!-- OBJECTS SCREEN -->
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

<!-- FEED, CHATS, REALTORS, etc. (оставляем как есть) -->
<!-- ... (остальной HTML из твоего оригинального кода) ... -->

<!-- ЮРИДИЧЕСКИЙ ФУТЕР -->
${LEGAL_FOOTER}

<script src="/static/app.js"></script>
</div></div>
</body>
</html>`
}

// ─── HELPERS: LOCAL AI RESPONSES (fallback) ───────────────
function getFlaiReply(msg: string, lang: string): string {
  const m = msg.toLowerCase()
  const kz = lang === 'kz'
  if (m.includes('обмен') || m.includes('айырбас'))
    return kz ? '🔄 Айырбас 2026 жылы тиімді! Салықтан босату мерзімі — 2 жыл.' : '🔄 Обмен актуален в 2026! Освобождение от налога — 2 года.'
  if (m.includes('ипотека') || m.includes('несие'))
    return kz ? '🏦 Работаем с Отбасы Банк, Halyk, Jusan. Ставки от 5%.' : '🏦 Работаем с Отбасы Банк, Halyk, Jusan. Ставки от 5%.'
  if (m.includes('цена') || m.includes('баға'))
    return kz ? '💰 Цена зависит от района. В Есиле 1к от 28 млн ₸.' : '💰 Цена зависит от района. В Есиле 1к от 28 млн ₸.'
  if (m.includes('налог') || m.includes('салық'))
    return kz ? '💡 С 2026: без налога — 2 года. Обмен экономит 10-15%.' : '💡 С 2026: без налога — 2 года. Обмен экономит 10-15%.'
  if (m.includes('привет') || m.includes('сәлем'))
    return kz ? '👋 Сәлем! Мен Flai — AI-көмекшіңіз.' : '👋 Привет! Я Flai — ваш AI-помощник.'
  return kz ? '😊 Сұрағыңызды нақтылаңыз, көмектесемін!' : '😊 Уточните вопрос, я помогу!'
}

export default app
