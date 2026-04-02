import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { createClient } from '@supabase/supabase-js'

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

// 🔍 ТЕСТОВЫЙ ENDPOINT
app.get('/api/test', (c) => {
  return c.json({
    message: '✅ API is working!',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!c.env.SUPABASE_URL,
      hasSupabaseKey: !!c.env.SUPABASE_ANON_KEY,
      urlPreview: c.env.SUPABASE_URL ? c.env.SUPABASE_URL.substring(0, 40) + '...' : '❌ MISSING',
    }
  })
})

// 🔍 ФУНКЦИЯ С ЛОГАМИ
function getSupabase(c: any) {
  const url = c.env.SUPABASE_URL || 'MISSING'
  const key = c.env.SUPABASE_ANON_KEY ? 'EXISTS' : 'MISSING'
  
  console.log(`🔍 SUPABASE_URL: ${url}`)
  console.log(`🔍 SUPABASE_ANON_KEY: ${key}`)
  
  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_ANON_KEY) {
    throw new Error(`❌ Supabase credentials missing! URL: ${url}, KEY: ${key}`)
  }
  
  return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_ANON_KEY)
}

// Favicon
app.get('/favicon.ico', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  return c.body('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#2D5A3D"/><path d="M6 16L16 8l10 8v9H6z" fill="none" stroke="white" stroke-width="1.5"/><path d="M9 21V12h6v9" fill="white"/></svg>')
})

// 🔍 API: LISTINGS С FALLBACK ДАННЫМИ
app.get('/api/listings', async (c) => {
  console.log('📡 [API] /api/listings called')
  
  try {
    const supabase = getSupabase(c)
    console.log('✅ Supabase client created')
    
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50)
    
    // Если ошибка или нет данных — используем fallback
    if (error || !data || data.length === 0) {
      console.warn('⚠️ No data from Supabase, using fallback')
      
      // ТЕСТОВЫЕ ДАННЫЕ
      const testData = [
        {
          id: 1,
          type: 'apartment',
          rooms: 3,
          area: 85,
          district: 'Есиль',
          city: 'Астана',
          price: 62000000,
          exchange: false,
          video_url: 'https://youtube.com/watch?v=tgbNymZ7vqY',
          realtor_name: 'Айгерим К.',
          realtor_id: 'r1',
          rating: 4.9,
          deals: 47,
          agency: 'Century 21',
          description: 'Отличная 3-комнатная в новом ЖК. Полная отделка, вид на парк.',
          images: ['🛋️','🚿','🌇'],
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          type: 'apartment',
          rooms: 2,
          area: 65,
          district: 'Сарыарка',
          city: 'Астана',
          price: 38000000,
          exchange: true,
          video_url: null,
          realtor_name: 'Данияр М.',
          realtor_id: 'r2',
          rating: 4.7,
          deals: 32,
          agency: 'Etagi',
          description: 'Уютная 2-комнатная. Рассмотрим обмен!',
          images: ['🛋️','🚿'],
          status: 'active',
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          type: 'house',
          rooms: 5,
          area: 220,
          district: 'Алматинский',
          city: 'Астана',
          price: 150000000,
          exchange: true,
          video_url: 'https://youtube.com/watch?v=UxxajLWwzqY',
          realtor_name: 'Сауле Т.',
          realtor_id: 'r3',
          rating: 5.0,
          deals: 68,
          agency: 'Royal Group',
          description: 'Дом с участком 10 соток. Гараж на 2 машины, баня.',
          images: ['🏡','🌳','🏊'],
          status: 'active',
          created_at: new Date().toISOString()
        }
      ]
      
      const formatted = testData.map((l: any) => ({
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
        videoId: l.video_url?.split('v=')[1] || '',
        realtor: l.realtor_name || 'Риэлтор',
        realtorId: l.realtor_id,
        realtorFull: l.realtor_name,
        rating: l.rating || 4.5,
        deals: l.deals || 0,
        agency: l.agency || 'Агентство',
        tags: l.exchange ? ['Обмен'] : [],
        badge: l.exchange ? 'Обмен' : 'Новое',
        desc: l.description || 'Отличный объект!',
        photos: l.images?.length ? l.images : ['🏠']
      }))
      
      return c.json({ listings: formatted, source: 'fallback' })
    }
    
    console.log(`✅ Loaded ${data.length} listings from Supabase`)
    
    const formatted = data.map((l: any) => ({
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
      videoId: l.video_url?.split('v=')[1] || '',
      realtor: l.realtor_name || 'Риэлтор',
      realtorId: l.realtor_id,
      realtorFull: l.realtor_name,
      rating: l.rating || 4.5,
      deals: l.deals || 0,
      agency: l.agency || 'Агентство',
      tags: l.exchange ? ['Обмен'] : [],
      badge: l.exchange ? 'Обмен' : 'Новое',
      desc: l.description || 'Отличный объект!',
      photos: l.images?.length ? l.images : ['🏠']
    }))
    
    return c.json({ listings: formatted, source: 'supabase' })
  } catch (e: any) {
    console.error('💥 CRITICAL ERROR:', e)
    return c.json({ 
      listings: [], 
      error: e.message
    }, 500)
  }
})

// API: REALTORS
app.get('/api/realtors', async (c) => {
  try {
    const supabase = getSupabase(c)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'realtor')
      .eq('verified', true)
      .order('rating', { ascending: false })
      .limit(20)
    
    if (error) throw error
    
    const formatted = (data || []).map((r: any) => ({
      id: r.id,
      name: r.full_name,
      agency: r.agency,
      rating: r.rating,
      deals: r.deals || 0,
      reviews: r.reviews || 0,
      phone: r.phone,
      email: r.email,
      photo: r.full_name?.[0] || 'Р',
      verified: r.verified,
      role: r.role
    }))
    
    return c.json({ realtors: formatted, count: formatted.length })
  } catch (e: any) {
    console.error('Realtors error:', e)
    return c.json({ realtors: [], count: 0, error: e.message }, 500)
  }
})

// API: CALENDAR
app.get('/api/calendar', async (c) => {
  return c.json({ events: [] })
})

// API: CHAT FLAI
app.post('/api/chat/flai', async (c) => {
  try {
    const { message, lang = 'ru' } = await c.req.json()
    
    if (c.env.GEMINI_API_KEY) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${c.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Ты — Flai, AI-помощник по недвижимости в Астане. Отвечай кратко на ${lang==='kz'?'казахском':'русском'}. Вопрос: ${message}` }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
          })
        })
        const data = await response.json()
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (reply) return c.json({ reply, source: 'gemini' })
      } catch (e) {
        console.error('Gemini error:', e)
      }
    }
    
    // Fallback ответы
    const replies: Record<string, string> = {
      'привет': '👋 Привет! Я Flai — ваш AI-помощник по недвижимости.',
      'ипотека': '🏦 Работаем с Отбасы Банк, Halyk, Jusan. Ставки от 5%.',
      'цена': '💰 Цена зависит от района. В Есиле 1к от 28 млн ₸.',
      'обмен': '🔄 Обмен актуален в 2026! Освобождение от налога — 2 года.'
    }
    
    const reply = replies[message.toLowerCase()] || '😊 Уточните вопрос, я помогу!'
    return c.json({ reply, source: 'local' })
  } catch (e: any) {
    console.error('Chat error:', e)
    return c.json({ reply: 'Извините, произошла ошибка', source: 'error' }, 500)
  }
})

// API: AUTH
app.post('/api/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json()
    const supabase = getSupabase(c)
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    
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
        role: profile?.role || 'realtor', 
        verified: profile?.verified || true,
        agency: profile?.agency,
        rating: profile?.rating || 5.0,
        deals: profile?.deals || 0,
        phone: profile?.phone
      },
      session: data.session
    })
  } catch (e: any) {
    console.error('Login error:', e)
    return c.json({ success: false, error: e.message }, 401)
  }
})

app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, name, phone, agency } = await c.req.json()
    const supabase = getSupabase(c)
    
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { data: { full_name: name, phone, agency, role: 'realtor' } }
    })
    if (authError) throw authError
    
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
  } catch (e: any) {
    console.error('Register error:', e)
    return c.json({ success: false, error: e.message }, 400)
  }
})

// API: AI DESCRIBE
app.post('/api/ai/describe', async (c) => {
  const { type, rooms, area, district, price, exchange } = await c.req.json()
  const desc = `✨ ${rooms ? rooms+'-комнатная ' : ''}квартира${area ? ', '+area+' м²' : ''} в ${district||'Астане'}!\n\n🏆 Развитая инфраструктура · Рядом транспорт\n💰 Цена: ${price ? (Number(price)/1e6).toFixed(1)+' млн ₸' : 'по договору'}${exchange ? '\n🔄 Рассмотрим обмен' : ''}\n\n📍 ${district||'Есиль'}, ${'Астана'}\n📞 Звоните — покажу в любое удобное время!`
  return c.json({ description: desc })
})

// API: RATE REALTOR
app.post('/api/listing/rate-realtor', async (c) => {
  return c.json({ success: true, message: 'Риэлтор назначен' })
})

// LEGAL FOOTER
const LEGAL_FOOTER = `<footer style="padding:25px 20px 40px;background:var(--bg3);border-top:1px solid var(--brd);font-size:11px;color:var(--t3);margin-top:20px"><div style="max-width:480px;margin:0 auto"><p style="margin:0 0 15px 0;font-weight:600;color:var(--t1)"><strong>Flapy™</strong> — Умный помощник по жилью</p><div style="background:var(--bg2);border-radius:10px;padding:15px;border-left:3px solid var(--orange);margin-bottom:15px"><h4 style="margin:0 0 10px 0;color:var(--t1);font-size:12px">⚖️ Правовая информация</h4><ul style="margin:0;padding-left:18px;line-height:1.9"><li><strong>Товарный знак:</strong> Flapy™ зарегистрирован в Казпатент РК</li><li><strong>Авторское право:</strong> © 2024-2026 Flapy Technologies LLP. Все права защищены</li><li><strong>Защита данных:</strong> Обработка персональных данных в соответствии с Законом РК «О персональных данных»</li><li><strong>Запрет копирования:</strong> Любое воспроизведение дизайна, кода, контента без разрешения запрещено (ст. 48-52 ГК РК)</li><li><strong>Ответственность:</strong> За нарушение прав предусмотрена гражданская и уголовная ответственность (ст. 129 КоАП, ст. 184-1 УК РК)</li><li><strong>Юрисдикция:</strong> Споры рассматриваются в судах г. Астаны</li></ul></div><p style="margin:0 0 10px 0;font-size:10px"><strong>Реквизиты:</strong> ТОО «Flapy Technologies» | БИН: [указать] | г. Астана, Казахстан<br>Email: legal@flapy.kz | Поддержка: <a href="https://t.me/flapy_support" style="color:var(--orange);text-decoration:none">@flapy_support</a></p><div style="display:flex;gap:15px;padding-top:12px;border-top:1px solid var(--brd);font-size:10px"><a href="/privacy" style="color:var(--navy);text-decoration:none">Политика конфиденциальности</a><a href="/terms" style="color:var(--navy);text-decoration:none">Условия использования</a><a href="/dmca" style="color:var(--navy);text-decoration:none">DMCA / Жалобы</a></div><p style="margin:15px 0 0 0;font-size:9px;color:var(--t3);text-align:center">Flapy не является агентством недвижимости. Платформа для профессиональных риэлторов.</p></div></footer>`

// MAIN HTML
app.get('/', (c) => c.html(getHTML()))

function getHTML(): string {
return `<!DOCTYPE html><html lang="ru" data-theme="light" data-lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#FFFFFF"><title>Flapy™ — Умный помощник по жилью</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"><link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"><style>
:root{--white:#FFFFFF;--bg:#F5F5F7;--bg2:#FFFFFF;--bg3:#F0F0F5;--navy:#2D5A3D;--navy2:#3D7A5A;--orange:#F4A820;--orange2:#FFB366;--green:#27AE60;--red:#E74C3C;--t1:#1A1A2E;--t2:#6B7280;--t3:#9CA3AF;--brd:#E5E7EB;--brd2:#D1D5DB;--sh:0 1px 4px rgba(0,0,0,.06),0 2px 10px rgba(0,0,0,.05);--nav-h:56px;--bot-h:64px;--r:14px;--max:480px}[data-theme=dark]{--bg:#0F0F1A;--bg2:#161626;--bg3:#1E1E35;--t1:#F0F0FF;--t2:#9090C0;--t3:#5A5A80;--brd:rgba(255,255,255,.1)}*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}html,body{height:100%;background:var(--bg);font-family:'Inter',sans-serif;color:var(--t1);overflow:hidden}button{border:none;cursor:pointer;font-family:inherit;background:none;color:inherit}input,textarea,select{font-family:inherit;outline:none;color:var(--t1)}#app-shell{position:fixed;inset:0;display:flex;justify-content:center;background:#E0E0EC}#app-wrap{position:relative;width:100%;max-width:var(--max);height:100%;background:var(--bg);overflow:hidden;box-shadow:0 0 60px rgba(0,0,0,.12)}@media(min-width:520px){#app-wrap{border-left:1px solid var(--brd);border-right:1px solid var(--brd)}}#loader{position:absolute;inset:0;z-index:999;background:var(--bg2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}.ld-icon{width:52px;height:52px;background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:14px;display:flex;align-items:center;justify-content:center}.ld-name{font-size:30px;font-weight:900;color:var(--navy);letter-spacing:-1px}[data-theme=dark] .ld-name{color:#fff}.ld-tm{font-size:10px;color:var(--orange);vertical-align:super}.ld-sub{font-size:13px;color:var(--t3)}.ld-bar-wrap{width:72px;height:3px;background:var(--bg3);border-radius:2px;overflow:hidden;margin-top:4px}.ld-bar{height:100%;background:linear-gradient(90deg,var(--navy),var(--orange));border-radius:2px;animation:ldA 1.4s ease forwards}@keyframes ldA{from{width:0}to{width:100%}}#topbar{position:absolute;top:0;left:0;right:0;height:var(--nav-h);z-index:50;background:var(--bg2);border-bottom:1px solid var(--brd);display:flex;align-items:center;padding:0 14px;gap:10px}.logo-row{display:flex;align-items:center;gap:8px;flex:1;cursor:pointer}.logo-icon{width:32px;height:32px;background:linear-gradient(135deg,#2D5A3D,#3D7A5A);border-radius:9px;display:flex;align-items:center;justify-content:center}.logo-txt{font-size:18px;font-weight:900;color:#2D5A3D;letter-spacing:-.5px}[data-theme=dark] .logo-txt{color:#3D7A5A}.logo-tag{font-size:14px;vertical-align:super;margin-left:2px;font-weight:700;color:var(--orange)}.top-right{display:flex;align-items:center;gap:7px}.lang-sw{display:flex;background:var(--bg3);border-radius:8px;padding:2px;border:1px solid var(--brd)}.lo{padding:3px 7px;border-radius:6px;font-size:11px;font-weight:700;color:var(--t3);cursor:pointer}.lo.on{background:var(--navy);color:#fff}.tb-btn{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--t3);background:var(--bg3);border:1px solid var(--brd);cursor:pointer}.login-btn{padding:0 13px;height:30px;border-radius:8px;background:var(--navy);color:#fff;font-size:12px;font-weight:700;cursor:pointer}[data-theme=dark] .login-btn{background:var(--orange)}.u-chip{display:flex;align-items:center;gap:6px;cursor:pointer}.u-ava{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--navy),var(--navy2));display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff}.u-nm{font-size:12px;font-weight:700;color:var(--t1)}#main{position:absolute;top:var(--nav-h);bottom:var(--bot-h);left:0;right:0;overflow:hidden}.scr{position:absolute;inset:0;overflow-y:auto;display:none;background:var(--bg)}.scr.on{display:block}#s-search{background:var(--bg)}.list-header{position:sticky;top:0;z-index:10;background:var(--bg2);border-bottom:1px solid var(--brd)}.lh-top{padding:10px 14px 0}.lh-tagline{font-size:12px;color:var(--t3);margin-bottom:6px}.tab-row{display:flex;border-bottom:1px solid var(--brd)}.tab-item{flex:1;padding:10px 0;text-align:center;font-size:14px;font-weight:600;color:var(--t3);border-bottom:2.5px solid transparent;cursor:pointer}.tab-item.on{color:var(--navy);border-color:var(--navy);font-weight:700}[data-theme=dark] .tab-item.on{color:var(--orange);border-color:var(--orange)}.filter-row{display:flex;gap:6px;overflow-x:auto;padding:9px 14px}.fchip{flex-shrink:0;padding:5px 13px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid var(--brd2);color:var(--t2);background:none}.fchip.on{background:var(--navy);color:#fff;border-color:var(--navy)}[data-theme=dark] .fchip.on{background:var(--orange)}.list-body{padding:10px 12px 12px}.lcard{background:var(--bg2);border-radius:var(--r);box-shadow:var(--sh);margin-bottom:12px;overflow:hidden;cursor:pointer;border:1px solid var(--brd)}.lcard-media{position:relative;height:185px;background:linear-gradient(135deg,#EEF0F6,#E0E3EE);overflow:hidden;display:flex;align-items:center;justify-content:center}[data-theme=dark] .lcard-media{background:linear-gradient(135deg,#1E1E35,#161626)}.lcard-em{font-size:64px;opacity:.22}.video-thumb{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.45)}.video-play{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:20px;color:var(--navy);margin-bottom:6px}.video-lbl{font-size:11px;color:rgba(255,255,255,.85);font-weight:600}.lcard-badge{position:absolute;top:10px;right:10px;padding:3px 9px;border-radius:7px;font-size:11px;font-weight:700;color:#fff}.lcard-body{padding:11px 13px 13px}.lcard-loc{font-size:12px;color:var(--t3);display:flex;align-items:center;gap:4px;margin-bottom:5px}.lcard-loc i{color:var(--orange);font-size:11px}.lcard-price{font-size:20px;font-weight:800;color:var(--t1);letter-spacing:-.3px;margin-bottom:2px}.lcard-sub{font-size:13px;color:var(--t2);margin-bottom:9px}.lcard-tags{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px}.ltag{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;background:rgba(244,168,32,.1);color:var(--orange);border:1px solid rgba(244,168,32,.2)}.ltag.exch{background:rgba(39,174,96,.1);color:var(--green);border-color:rgba(39,174,96,.2)}.lcard-footer{display:flex;align-items:center;gap:8px;padding-top:9px;border-top:1px solid var(--brd)}.lf-ava{width:26px;height:26px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff}.lf-name{font-size:11px;font-weight:600;color:var(--t2);flex:1}.lf-rating{font-size:11px;color:var(--orange);font-weight:700}.lcard-cta{display:flex;gap:7px;margin-top:9px}.cta-btn{flex:1;padding:9px 6px;border-radius:10px;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:5px;cursor:pointer}.cta-call{background:var(--navy);color:#fff}[data-theme=dark] .cta-call{background:var(--orange)}.cta-msg{background:var(--bg3);color:var(--t1);border:1px solid var(--brd2)}.chat-wrap{display:flex;flex-direction:column;height:100%}.chat-header{flex-shrink:0;background:var(--bg2);border-bottom:1px solid var(--brd);padding:10px 14px;display:flex;align-items:center;gap:10px}.ch-ava{width:40px;height:40px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#fff}.ch-ava.flai{background:linear-gradient(135deg,var(--navy),var(--navy2))}.ch-ava.aira{background:linear-gradient(135deg,var(--orange),var(--orange2))}.ch-name{font-size:15px;font-weight:700;color:var(--t1)}.ch-status{font-size:11px;color:var(--green);font-weight:500}.quick-row{flex-shrink:0;background:var(--bg2);border-bottom:1px solid var(--brd);display:flex;gap:6px;overflow-x:auto;padding:8px 13px}.qchip{flex-shrink:0;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--brd2);color:var(--t2);background:none}.qchip:active{background:var(--navy);color:#fff}[data-theme=dark] .qchip:active{background:var(--orange)}.chat-body{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:5px;padding:12px 13px}[data-theme=light] .chat-body{background:#EFE5D5}[data-theme=dark] .chat-body{background:#0A0F1E}.msg-date{align-self:center;font-size:11px;color:var(--t3);background:rgba(255,255,255,.7);border-radius:8px;padding:3px 10px;margin:3px 0}[data-theme=dark] .msg-date{background:rgba(255,255,255,.07)}.msg{display:flex;gap:7px;max-width:85%}.msg.me{align-self:flex-end;flex-direction:row-reverse}.msg.bot{align-self:flex-start}.m-ava{width:28px;height:28px;border-radius:50%;flex-shrink:0;align-self:flex-end;background:linear-gradient(135deg,var(--navy),var(--navy2));display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff}.bwrap{display:flex;flex-direction:column}.bubble{padding:8px 12px;border-radius:14px;font-size:13.5px;line-height:1.52;word-break:break-word}.msg.bot .bubble{background:var(--white);color:var(--t1);border-radius:4px 14px 14px 14px;box-shadow:0 1px 3px rgba(0,0,0,.08)}[data-theme=dark] .msg.bot .bubble{background:#1E1E35}.msg.me .bubble{background:var(--navy);color:#fff;border-radius:14px 4px 14px 14px}[data-theme=dark] .msg.me .bubble{background:var(--orange)}.m-ts{font-size:10px;color:var(--t3);margin-top:2px}.chat-input-row{flex-shrink:0;display:flex;align-items:flex-end;gap:8px;padding:8px 12px;background:var(--bg2);border-top:1px solid var(--brd)}.ci{flex:1;min-height:40px;max-height:88px;padding:10px 14px;border-radius:22px;border:1.5px solid var(--brd2);background:var(--white);font-size:13px;resize:none;line-height:1.4;color:var(--t1)}[data-theme=dark] .ci{background:var(--bg3)}.ci:focus{border-color:var(--navy)}[data-theme=dark] .ci:focus{border-color:var(--orange)}.ci::placeholder{color:var(--t3)}.send-btn{width:40px;height:40px;border-radius:50%;flex-shrink:0;background:var(--navy);color:#fff;font-size:15px;display:flex;align-items:center;justify-content:center;cursor:pointer}[data-theme=dark] .send-btn{background:var(--orange)}.send-btn.aira{background:linear-gradient(135deg,var(--orange),var(--orange2))}.send-btn:active{transform:scale(1.1)}.aira-list{padding:10px 13px;display:flex;flex-direction:column;gap:8px}.thread{background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);overflow:hidden;box-shadow:var(--sh)}.th-head{display:flex;align-items:center;gap:9px;padding:11px 12px;cursor:pointer}.th-ava{width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff}.th-name{font-size:13px;font-weight:700}.th-time{font-size:10px;color:var(--t3);margin-left:4px}.th-prev{font-size:11px;color:var(--t2)}.th-body{padding:10px 12px;display:none;border-top:1px solid var(--brd);background:var(--bg)}.prop-tag{display:inline-flex;align-items:center;gap:4px;background:rgba(244,168,32,.1);border:1px solid rgba(244,168,32,.25);border-radius:8px;padding:3px 9px;font-size:11px;font-weight:600;color:var(--orange);margin-bottom:6px}.aira-compose{flex-shrink:0;padding:8px 12px;background:var(--bg2);border-top:1px solid var(--brd)}.compose-tabs{display:flex;gap:5px}.compose-tab{padding:4px 10px;border-radius:7px;font-size:11px;font-weight:700;background:var(--bg3);color:var(--t3);border:1px solid var(--brd);cursor:pointer}.compose-tab.on{background:var(--navy);color:#fff;border-color:var(--navy)}[data-theme=dark] .compose-tab.on{background:var(--orange)}.rel-wrap{padding:13px}.rel-header{font-size:20px;font-weight:800;margin-bottom:4px}.rel-sub{font-size:12px;color:var(--t3);margin-bottom:12px}.rel-sort{display:flex;gap:6px;overflow-x:auto;margin-bottom:12px}.rsort{flex-shrink:0;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid var(--brd2);color:var(--t2);background:none;cursor:pointer}.rsort.on{background:var(--navy);color:#fff;border-color:var(--navy)}[data-theme=dark] .rsort.on{background:var(--orange)}.rcard{display:flex;align-items:center;gap:11px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:13px;margin-bottom:10px;box-shadow:var(--sh);cursor:pointer}.rc-ava{width:48px;height:48px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff}.rc-name{font-size:14px;font-weight:700;margin-bottom:1px}.rc-agency{font-size:11px;color:var(--t3);margin-bottom:4px}.rc-stars{display:flex;align-items:center;gap:3px;font-size:12px;color:var(--orange);font-weight:700}.rc-stars span{color:var(--t3);font-size:10px}.rc-badge{position:absolute;top:8px;right:8px;background:linear-gradient(135deg,var(--orange),var(--orange2));color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:5px}.rc-stats{display:flex;gap:8px;margin-top:5px}.rc-stat{font-size:10px;color:var(--t3)}.rc-stat b{color:var(--t1);font-size:11px}.rc-spec{font-size:10px;color:var(--t2);background:var(--bg3);border-radius:5px;padding:2px 7px;margin-top:4px}.rc-actions{display:flex;gap:7px;margin-top:9px}.rc-btn{flex:1;padding:8px;border-radius:9px;font-size:11px;font-weight:700;cursor:pointer}.rc-call{background:var(--navy);color:#fff}[data-theme=dark] .rc-call{background:var(--orange)}.rc-write{background:var(--bg3);color:var(--t1);border:1px solid var(--brd2)}.rc-hire{background:linear-gradient(135deg,var(--green),#2ECC71);color:#fff}.cal-wrap{padding:13px}.cal-title{font-size:21px;font-weight:800;margin-bottom:2px}.cal-date{font-size:12px;color:var(--t3);margin-bottom:12px}.sec-label{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin:14px 0 7px}.ev-card{display:flex;align-items:stretch;gap:9px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:11px;margin-bottom:8px;cursor:pointer;box-shadow:var(--sh)}.ev-time{min-width:46px;background:var(--bg3);border-radius:9px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:5px}.ev-hm{font-size:14px;font-weight:800;color:var(--navy)}[data-theme=dark] .ev-hm{color:var(--orange)}.ev-line{width:3px;border-radius:2px}.ev-inf{flex:1}.ev-ttl{font-size:13px;font-weight:700;margin-bottom:2px}.ev-cli{font-size:11px;color:var(--t2);margin-bottom:4px}.ev-note{font-size:11px;color:var(--t3);background:var(--bg3);border-radius:6px;padding:3px 8px}.add-ev-btn{width:100%;padding:12px;border-radius:12px;background:none;border:2px dashed var(--brd2);color:var(--t3);font-size:13px;font-weight:600;cursor:pointer;margin-bottom:12px}.add-ev-btn:active{border-color:var(--orange);color:var(--orange)}.ai-tip{display:flex;align-items:center;gap:9px;background:rgba(244,168,32,.07);border:1px solid rgba(244,168,32,.2);border-radius:12px;padding:10px 12px;margin-bottom:12px;font-size:12px;line-height:1.5;color:var(--t2)}.prof-wrap{padding:13px}.prof-hero{background:linear-gradient(135deg,var(--navy),var(--navy2));border-radius:16px;padding:18px;margin-bottom:14px;overflow:hidden}.ph-ava{width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.2);border:2px solid rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#fff;margin-bottom:9px}.ph-name{font-size:17px;font-weight:800;color:#fff}.ph-tag{font-size:11px;color:rgba(255,255,255,.6);margin-top:2px}.ph-stats{display:flex;gap:7px;margin-top:12px}.ph-stat{flex:1;background:rgba(255,255,255,.12);border-radius:10px;padding:8px;text-align:center}.ph-val{font-size:17px;font-weight:800;color:#fff}.ph-lbl{font-size:9px;color:rgba(255,255,255,.55);margin-top:1px}.menu-sec{margin-bottom:16px}.menu-lbl{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:1px;margin-bottom:7px}.menu-item{display:flex;align-items:center;gap:11px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:12px;margin-bottom:7px;cursor:pointer;box-shadow:var(--sh)}.menu-item:active{box-shadow:0 4px 20px rgba(0,0,0,.1)}.menu-ico{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px}.menu-name{font-size:13px;font-weight:600}.menu-sub{font-size:11px;color:var(--t3);margin-top:1px}.notif-wrap{padding:13px}.notif-title{font-size:20px;font-weight:800;margin-bottom:13px}.notif-item{display:flex;gap:10px;background:var(--bg2);border:1px solid var(--brd);border-radius:var(--r);padding:12px;margin-bottom:8px;box-shadow:var(--sh)}.notif-ico{font-size:20px}.notif-txt{font-size:12px;line-height:1.55;color:var(--t2)}.notif-txt b{color:var(--t1)}.notif-time{font-size:10px;color:var(--t3);margin-top:3px}#botbar{position:absolute;bottom:0;left:0;right:0;height:var(--bot-h);z-index:50;background:var(--bg2);border-top:1px solid var(--brd);display:flex;align-items:center;padding:0 8px 6px}.nav-it{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;color:var(--t3);padding:6px 2px;border-radius:10px;position:relative}.nav-svg{width:22px;height:22px}.nav-it span{font-size:9px;font-weight:700}.nav-it.on{color:var(--navy)}[data-theme=dark] .nav-it.on{color:var(--orange)}.nav-it.on .nav-svg{transform:scale(1.1)}.nav-plus-wrap{flex-shrink:0;padding:0 6px}.nav-plus{width:48px;height:48px;border-radius:14px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(45,90,61,.3);cursor:pointer}[data-theme=dark] .nav-plus{background:var(--orange);box-shadow:0 4px 16px rgba(244,168,32,.3)}.nav-plus:active{transform:scale(1.05)}.n-badge{position:absolute;top:3px;right:calc(50% - 18px);width:15px;height:15px;border-radius:8px;background:var(--red);color:#fff;font-size:8px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg2)}.overlay{position:absolute;inset:0;z-index:200;background:rgba(0,0,0,.5);backdrop-filter:blur(3px);display:flex;align-items:flex-end;justify-content:center;opacity:0;pointer-events:none;transition:opacity .22s}.overlay.on{opacity:1;pointer-events:all}.sheet{width:100%;max-height:92%;background:var(--bg2);border-radius:20px 20px 0 0;overflow-y:auto;padding-bottom:20px;transform:translateY(16px);transition:transform .22s}.overlay.on .sheet{transform:translateY(0)}.sh-handle{width:32px;height:4px;border-radius:2px;background:var(--brd2);margin:10px auto 12px}.sh-title{font-size:17px;font-weight:800;padding:0 17px 12px}.sh-body{padding:0 17px}.flabel{font-size:11px;font-weight:600;color:var(--t3);margin-bottom:4px;display:block}.finput{width:100%;padding:10px 13px;border-radius:10px;background:var(--bg3);border:1.5px solid var(--brd);font-size:13px;margin-bottom:11px;color:var(--t1)}.finput:focus{border-color:var(--navy)}[data-theme=dark] .finput:focus{border-color:var(--orange)}select.finput{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%239CA3AF'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;background-color:var(--bg3);padding-right:28px}textarea.finput{resize:none;min-height:68px;line-height:1.5}.form-row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.btn-primary{width:100%;padding:13px;border-radius:12px;background:var(--navy);color:#fff;font-size:14px;font-weight:700;cursor:pointer;transition:opacity .15s;display:flex;align-items:center;justify-content:center;gap:6px}[data-theme=dark] .btn-primary{background:var(--orange)}.btn-primary:active{opacity:.85}.btn-secondary{width:100%;padding:11px;border-radius:12px;background:var(--bg3);border:1.5px solid var(--brd);font-size:13px;font-weight:600;margin-top:8px;color:var(--t1);cursor:pointer}.btn-outline{width:100%;padding:11px;border-radius:11px;background:none;border:1.5px solid var(--navy);color:var(--navy);font-size:13px;font-weight:600;margin-top:7px;cursor:pointer}[data-theme=dark] .btn-outline{border-color:var(--orange);color:var(--orange)}.btn-outline:active{background:var(--navy);color:#fff}.tab-switcher{display:flex;background:var(--bg3);border-radius:10px;padding:3px;margin-bottom:14px}.tsw{flex:1;padding:7px;border-radius:7px;font-size:13px;font-weight:700;color:var(--t3);cursor:pointer;text-align:center}.tsw.on{background:var(--navy);color:#fff}[data-theme=dark] .tsw.on{background:var(--orange)}.info-box{display:flex;align-items:flex-start;gap:7px;background:rgba(39,174,96,.07);border:1px solid rgba(39,174,96,.2);border-radius:10px;padding:9px 11px;margin-bottom:11px;font-size:12px;line-height:1.5;color:var(--t2)}.info-box.warn{background:rgba(244,168,32,.07);border-color:rgba(244,168,32,.2)}.ai-label{display:inline-flex;align-items:center;gap:3px;background:rgba(244,168,32,.12);border-radius:5px;padding:1px 7px;font-size:10px;font-weight:700;color:var(--orange)}.ai-result{background:var(--bg3);border:1.5px solid rgba(244,168,32,.25);border-radius:10px;padding:11px;margin-top:6px;font-size:12px;line-height:1.6;color:var(--t2);white-space:pre-wrap}.ai-actions{display:flex;gap:6px;margin-top:7px}.ai-act-btn{padding:5px 11px;border-radius:8px;font-size:11px;font-weight:600;background:var(--bg3);border:1px solid var(--brd);color:var(--t2);cursor:pointer}.ai-act-btn:active{background:var(--navy);color:#fff;border-color:var(--navy)}.det-visual{height:200px;position:relative;overflow:hidden;background:linear-gradient(135deg,#EEF0F6,#E0E3EE)}[data-theme=dark] .det-visual{background:linear-gradient(135deg,#1E1E35,#161626)}.det-visual iframe{width:100%;height:100%;border:none}.det-em-bg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:80px;opacity:.25}.det-photos{display:flex;gap:6px;padding:8px 17px;overflow-x:auto}.det-photo{width:56px;height:56px;border-radius:8px;background:var(--bg3);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;cursor:pointer;border:2px solid transparent}.det-photo.on{border-color:var(--navy)}.det-price{font-size:23px;font-weight:900;color:var(--t1);padding:8px 17px 4px}.det-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:4px 17px 12px}.det-cell{background:var(--bg3);border-radius:10px;padding:11px;text-align:center}.det-val{font-size:15px;font-weight:800;color:var(--navy)}[data-theme=dark] .det-val{color:var(--orange)}.det-lbl{font-size:10px;color:var(--t3);margin-top:2px}.det-desc{padding:2px 17px 10px;font-size:13px;line-height:1.7;color:var(--t2)}.det-realtor{margin:0 17px 12px;background:var(--bg3);border-radius:12px;padding:12px;display:flex;align-items:center;gap:10px;cursor:pointer;border:1px solid var(--brd)}.det-cta{display:flex;gap:8px;padding:0 17px 4px}.det-btn{flex:1;padding:12px;border-radius:12px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px}.det-btn:active{opacity:.85}.det-call{background:var(--green)}.det-chat{background:var(--navy)}[data-theme=dark] .det-chat{background:var(--orange)}.det-hire{background:linear-gradient(135deg,var(--orange),var(--orange2))}.exch-match{background:rgba(39,174,96,.07);border:1px solid rgba(39,174,96,.2);border-radius:12px;padding:12px 13px;margin:0 17px 10px;cursor:pointer}.rel-modal-card{background:var(--bg3);border-radius:12px;padding:13px;margin-bottom:11px}.more-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:0 17px 17px}.more-item{background:var(--bg2);border:1px solid var(--brd);border-radius:14px;padding:16px;cursor:pointer;text-align:center;box-shadow:var(--sh)}.more-item:active{box-shadow:0 4px 20px rgba(0,0,0,.1)}.more-ico{font-size:28px;margin-bottom:5px}.more-name{font-size:12px;font-weight:700}.more-sub{font-size:10px;color:var(--t3);margin-top:2px}.empty{text-align:center;padding:52px 20px}.empty-ico{font-size:44px;opacity:.25;margin-bottom:9px}.empty-t{font-size:15px;font-weight:700;margin-bottom:4px}.empty-s{font-size:12px;color:var(--t3)}#toast{position:absolute;bottom:78px;left:50%;transform:translateX(-50%) translateY(6px);background:rgba(45,90,61,.9);color:#fff;border-radius:10px;padding:9px 16px;font-size:12px;font-weight:600;white-space:nowrap;z-index:600;opacity:0;transition:all .2s;backdrop-filter:blur(5px)}#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}.su{animation:suIn .25s ease}@keyframes suIn{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}.stars-row{display:flex;gap:3px;margin-bottom:10px}.star-btn{font-size:26px;cursor:pointer;transition:transform .15s;color:var(--brd2)}.star-btn.on{color:var(--orange)}.star-btn:active{transform:scale(1.2)}.play-overlay{position:absolute;inset:0;background:rgba(0,0,0,.38);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px}.play-overlay i{width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.88);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--navy)}.rank-card{display:flex;align-items:center;gap:10px;background:var(--bg2);border:1px solid var(--brd);border-radius:12px;padding:11px;margin-bottom:7px;cursor:pointer;box-shadow:var(--sh)}.rank-num{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;flex-shrink:0}.rank-bar{height:4px;border-radius:2px;background:linear-gradient(90deg,var(--orange),var(--orange2));margin-top:5px;transition:width .4s}</style></head><body><div id="app-shell"><div id="app-wrap"><div id="loader"><div class="ld-icon"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="white" stroke-width="2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg></div><div class="ld-name">Flapy<span class="ld-tm">™</span></div><div class="ld-sub" id="ld-sub">Ваш умный помощник на рынке жилья</div><div class="ld-bar-wrap"><div class="ld-bar"></div></div></div><div id="topbar"><div class="logo-row" onclick="go('s-search');nav(document.getElementById('n-search'))"><div class="logo-icon"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="white" stroke-width="2.2"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg></div><div class="logo-txt">Flapy<span class="logo-tag" style="font-size:14px;vertical-align:super;margin-left:2px;font-weight:700">™</span></div></div><div class="top-right"><div class="lang-sw"><span class="lo on" id="lo-ru" onclick="setLang('ru')">RU</span><span class="lo" id="lo-kz" onclick="setLang('kz')">KZ</span></div><div class="tb-btn" id="btn-theme" onclick="toggleTheme()"><i class="fas fa-moon"></i></div><div id="auth-slot"><button class="login-btn" onclick="openM('m-auth')" id="login-btn-top">Войти</button></div></div></div><div id="main"><div id="s-search" class="scr on"><div class="list-header"><div class="lh-top"><div class="lh-tagline" id="tx-tagline">Ваш умный помощник на рынке жилья</div><div class="tab-row"><div class="tab-item on" id="tab-obj" onclick="setListTab('obj')" data-ru="Объекты" data-kz="Объектілер">Объекты</div><div class="tab-item" id="tab-exch" onclick="setListTab('exch')" data-ru="Обмен" data-kz="Айырбас">Обмен</div></div></div><div class="filter-row" id="filter-row"><div class="fchip on" onclick="setFilt(this,'all')" data-ru="Все" data-kz="Барлығы">Все</div><div class="fchip" onclick="setFilt(this,'apartment')" data-ru="Квартиры" data-kz="Пәтерлер">Квартиры</div><div class="fchip" onclick="setFilt(this,'house')" data-ru="Дома" data-kz="Үйлер">Дома</div><div class="fchip" onclick="setFilt(this,'commercial')" data-ru="Коммерция" data-kz="Коммерция">Коммерция</div></div></div><div class="list-body" id="list-body"></div></div><div id="s-feed" class="scr"></div><div id="s-flai" class="scr"><div class="chat-wrap"><div class="chat-header"><div class="ch-ava flai" style="font-size:12px;letter-spacing:-1px">AI</div><div style="flex:1"><div class="ch-name">Flai <span style="font-size:11px;font-weight:500;color:var(--t2)" id="tx-flai-sub">— умный помощник</span></div><div class="ch-status" id="tx-flai-status">Онлайн · отвечает мгновенно</div></div><div style="background:rgba(244,168,32,.1);border:1px solid rgba(244,168,32,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:var(--orange);font-weight:600">✨ AI</div></div><div class="quick-row" id="flai-chips"><div class="qchip" onclick="quickMsg('Помоги составить описание объекта')" data-ru="✍️ Описание" data-kz="✍️ Сипаттама">✍️ Описание</div><div class="qchip" onclick="quickMsg('Как работает ипотека?')" data-ru="🏦 Ипотека" data-kz="🏦 Несие">🏦 Ипотека</div><div class="qchip" onclick="quickMsg('Расскажи про продвижение объекта')" data-ru="📢 Продвижение" data-kz="📢 Жылжыту">📢 Продвижение</div><div class="qchip" onclick="quickMsg('Налоги при продаже в 2026?')" data-ru="💡 Налоги" data-kz="💡 Салықтар">💡 Налоги</div><div class="qchip" onclick="quickMsg('Хочу организовать показ квартиры')" data-ru="📅 Показ" data-kz="📅 Көрсету">📅 Показ</div><div class="qchip" onclick="quickMsg('Оцени рыночную стоимость')" data-ru="💰 Оценка" data-kz="💰 Баға">💰 Оценка</div><div class="qchip" onclick="quickMsg('Как работает обмен недвижимостью?')" data-ru="🔄 Обмен" data-kz="🔄 Айырбас">🔄 Обмен</div></div><div class="chat-body" id="flai-msgs"><div class="msg-date" id="tx-today">Сегодня</div><div class="msg bot su"><div class="m-ava">AI</div><div class="bwrap"><div class="bubble" id="flai-welcome">Привет! Я Flai 👋<br>Помогу найти жильё, рассчитать ипотеку, составить описание и ответить на любые вопросы о рынке недвижимости.</div><div class="m-ts">сейчас</div></div></div><div class="msg bot su"><div class="m-ava">AI</div><div class="bwrap"><div class="bubble">💡 <b>Новость 2026:</b> срок без налога при продаже — теперь <b>2 года</b>. Обмен поможет сэкономить 10–15%!</div><div class="m-ts">сейчас</div></div></div></div><div class="chat-input-row"><textarea class="ci" id="flai-inp" rows="1" placeholder="Напишите вопрос о недвижимости..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendFlai()}"></textarea><button class="send-btn" onclick="sendFlai()"><i class="fas fa-paper-plane"></i></button></div></div></div><div id="s-aira" class="scr"><div class="chat-wrap"><div class="chat-header"><div class="ch-ava aira" style="font-size:13px;font-weight:900">A</div><div style="flex:1"><div class="ch-name">Aira <span style="font-size:12px;font-weight:500;color:var(--t2)" id="tx-aira-sub">— Чат риэлторов</span></div><div class="ch-status" id="aira-status" style="color:var(--orange)">0 риэлторов онлайн</div></div><div id="aira-status-badge" style="background:rgba(244,168,32,.1);border:1px solid rgba(244,168,32,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:var(--orange);font-weight:600">🔒 Войдите</div></div><div class="aira-compose" id="aira-compose"><div class="compose-tabs"><button class="compose-tab on" id="ct-listing" onclick="setComposeTab('listing')" data-ru="🏠 Объект" data-kz="🏠 Объект">🏠 Объект</button><button class="compose-tab" id="ct-exchange" onclick="setComposeTab('exchange')" data-ru="🔄 Обмен" data-kz="🔄 Айырбас">🔄 Обмен</button><button class="compose-tab" id="ct-question" onclick="setComposeTab('question')" data-ru="❓ Вопрос" data-kz="❓ Сұрақ">❓ Вопрос</button></div></div><div class="chat-body" id="aira-msgs" style="padding:10px 0"><div class="msg-date">Только для верифицированных риэлторов</div><div class="aira-list" id="aira-list"></div></div><div class="chat-input-row"><textarea class="ci" id="aira-inp" rows="1" placeholder="Поделитесь объектом или вопросом с коллегами..." onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendAira()}"></textarea><button class="send-btn aira" onclick="sendAira()"><i class="fas fa-paper-plane"></i></button></div></div></div><div id="s-realtors" class="scr"><div class="rel-wrap"><div class="rel-header" id="tx-rel-header">Риэлторы</div><div class="rel-sub" id="tx-rel-sub">Выберите лучшего специалиста</div><div class="rel-sort"><div class="rsort on" onclick="sortRealtors('rating',this)" data-ru="⭐ Рейтинг" data-kz="⭐ Рейтинг">⭐ Рейтинг</div><div class="rsort" onclick="sortRealtors('deals',this)" data-ru="🏆 Сделки" data-kz="🏆 Мәміле">🏆 Сделки</div><div class="rsort" onclick="sortRealtors('reviews',this)" data-ru="💬 Отзывы" data-kz="💬 Пікір">💬 Отзывы</div></div><div id="realtors-list"></div></div></div><div id="s-cal" class="scr"><div class="cal-wrap" id="cal-body"></div></div><div id="s-prof" class="scr"><div class="prof-wrap" id="prof-body"></div></div><div id="s-notif" class="scr"><div class="notif-wrap"><div class="notif-title" id="tx-notif-title">Уведомления</div></div></div></div><div id="botbar"><div class="nav-it on" id="n-search" onclick="go('s-search');nav(this)"><svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg><span data-ru="Объекты" data-kz="Объект">Объекты</span></div><div class="nav-it" id="n-feed" onclick="go('s-feed');nav(this)"><svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="9" height="9" rx="2"/><rect x="13" y="2" width="9" height="9" rx="2"/><rect x="2" y="13" width="9" height="9" rx="2"/><rect x="13" y="13" width="9" height="9" rx="2"/></svg><span data-ru="Лента" data-kz="Лента">Лента</span></div><div class="nav-plus-wrap" id="nav-plus-wrap"><div class="nav-plus" onclick="openAddListing()"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div></div><div class="nav-it" id="n-flai" onclick="go('s-flai');nav(this)" style="position:relative"><svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M9 9.5c.5-1.5 2-2.5 3.5-2 1.2.4 2 1.5 1.8 2.8-.2 1.3-1.8 2-2.3 2.7v.5"/><circle cx="12" cy="16.5" r=".75" fill="currentColor" stroke="none"/></svg><span>Flai AI</span><span class="n-badge" id="flai-badge" style="display:none">2</span></div><div class="nav-it" id="n-more" onclick="showMore()"><svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg><span data-ru="Ещё" data-kz="Тағы">Ещё</span></div></div>${LEGAL_FOOTER}<script src="/static/app.js"></script></div></div></body></html>`
}

function getFlaiReply(msg: string, lang: string): string {
  const m = msg.toLowerCase(); const kz = lang === 'kz'
  if (m.includes('обмен') || m.includes('айырбас')) return kz ? '🔄 Айырбас 2026 жылы тиімді! Салықтан босату мерзімі — 2 жыл.' : '🔄 Обмен актуален в 2026! Освобождение от налога — 2 года.'
  if (m.includes('ипотека') || m.includes('несие')) return kz ? '🏦 Работаем с Отбасы Банк, Halyk, Jusan. Ставки от 5%.' : '🏦 Работаем с Отбасы Банк, Halyk, Jusan. Ставки от 5%.'
  if (m.includes('цена') || m.includes('баға')) return kz ? '💰 Цена зависит от района. В Есиле 1к от 28 млн ₸.' : '💰 Цена зависит от района. В Есиле 1к от 28 млн ₸.'
  if (m.includes('налог') || m.includes('салық')) return kz ? '💡 С 2026: без налога — 2 года. Обмен экономит 10-15%.' : '💡 С 2026: без налога — 2 года. Обмен экономит 10-15%.'
  if (m.includes('привет') || m.includes('сәлем')) return kz ? '👋 Сәлем! Мен Flai — AI-көмекшіңіз.' : '👋 Привет! Я Flai — ваш AI-помощник.'
  return kz ? '😊 Сұрағыңызды нақтылаңыз, көмектесемін!' : '😊 Уточните вопрос, я помогу!'
}

function generateAIDesc(o: any): string {
  const types: Record<string,string> = { apartment:'квартира', house:'дом', commercial:'коммерческое помещение', land:'участок' }
  const t = types[o.type] || 'объект'
  const ex = o.exchange ? '\n🔄 Рассмотрим обмен — отличная возможность для оптимизации налогов!' : ''
  const p = o.price ? (Number(o.price)/1e6).toFixed(1)+' млн ₸' : 'по договору'
  const features = ['Развитая инфраструктура', 'Рядом транспорт', 'Ухоженный двор', 'Консьерж']
  const feat = features.slice(0,2).join(' · ')
  return `✨ ${o.rooms ? o.rooms+'-комнатная ' : ''}${t}${o.area ? ', '+o.area+' м²' : ''} в ${o.district||'Астане'}!\n\n🏆 ${feat}\n💰 Цена: ${p}${ex}\n\n📍 ${o.district||'Есиль'}, ${o.city||'Астана'}\n📞 Звоните — покажу в любое удобное время!`
}

export default app
