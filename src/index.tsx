<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#FFF9F5">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>Flapy — Уютный поиск жилья</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet">
  <style>
    /* ═══════════════════════════════════════════════
       🎨 FLAPY WARM UI — Адаптивный, Тёплый, Стеклянный
       ═══════════════════════════════════════════════ */
    :root {
      /* Тёплая палитра */
      --bg: #FFF9F5;
      --bg-alt: #F7F1EA;
      --card: #FFFFFF;
      --text: #3A3226;
      --text-muted: #7A6B5D;
      --accent: #C97B5A;
      --accent-soft: #D4A76A;
      --trust: #6B8E23;
      --danger: #E57373;
      
      /* Стекло и тени */
      --glass: rgba(255, 255, 255, 0.72);
      --glass-border: rgba(255, 255, 255, 0.6);
      --shadow: 0 8px 32px rgba(138, 154, 139, 0.12);
      --shadow-sm: 0 4px 16px rgba(138, 154, 139, 0.08);
      
      /* Размеры и отступы */
      --radius: 16px;
      --radius-sm: 12px;
      --nav-h: 64px;
      --bot-h: 72px;
      --safe-top: env(safe-area-inset-top, 0px);
      --safe-bottom: env(safe-area-inset-bottom, 0px);
    }

    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body {
      height: 100%;
      margin: 0;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #FFF9F5 0%, #F7F1EA 50%, #FFF3E6 100%);
      color: var(--text);
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }

    /* 🌊 Фоновая анимация "дыхание" */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at 20% 30%, rgba(201,123,90,0.08), transparent 40%),
                  radial-gradient(circle at 80% 70%, rgba(212,167,106,0.08), transparent 40%);
      animation: breathe 15s ease-in-out infinite alternate;
      pointer-events: none;
      z-index: -1;
    }
    @keyframes breathe { 0% { transform: scale(1) rotate(0deg); } 100% { transform: scale(1.05) rotate(2deg); } }

    /* 📱 Адаптивный контейнер */
    #app {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      max-width: 100%;
      padding: var(--safe-top) 0 var(--safe-bottom);
    }
    @media (min-width: 768px) { #app { max-width: 680px; margin: 0 auto; border-left: 1px solid var(--glass-border); border-right: 1px solid var(--glass-border); background: rgba(255,255,255,0.4); backdrop-filter: blur(8px); } }
    @media (min-width: 1024px) { #app { max-width: 820px; } }

    /* 🌟 Приветственная анимация */
    #welcome {
      position: fixed; inset: 0; z-index: 9999;
      background: linear-gradient(160deg, #2A231F 0%, #1A1614 100%);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #welcome.fade { opacity: 0; pointer-events: none; }
    .w-star { width: 56px; height: 56px; fill: var(--accent-soft); animation: dropStar 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
    .w-text { font-size: clamp(18px, 5vw, 24px); font-weight: 700; color: var(--accent-soft); margin-top: 16px; opacity: 0; animation: fadeUp 1.8s 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; }
    @keyframes dropStar { 0% { transform: translateY(-80px) scale(0.6); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
    @keyframes fadeUp { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }

    /* 🔝 Хедер */
    header {
      position: sticky; top: 0; z-index: 50;
      background: var(--glass);
      backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--glass-border);
      padding: 12px 16px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .logo { display: flex; align-items: center; gap: 10px; }
    .logo i { width: 34px; height: 34px; background: var(--accent); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; box-shadow: 0 4px 12px rgba(201,123,90,0.3); }
    .logo h1 { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .logo span { font-size: 11px; font-weight: 600; color: var(--text-muted); background: var(--bg-alt); padding: 2px 6px; border-radius: 6px; }
    .auth-btn {
      padding: 8px 14px; background: var(--glass); border: 1px solid var(--glass-border);
      border-radius: 10px; font-size: 12px; font-weight: 700; color: var(--accent);
      cursor: pointer; transition: all 0.2s;
    }
    .auth-btn:active { transform: scale(0.96); background: var(--accent-soft); color: #fff; }

    /* 📄 Основной контент */
    main {
      flex: 1; overflow-y: auto; padding: 12px 16px 24px;
      scroll-behavior: smooth;
    }
    .section-title { font-size: 14px; font-weight: 700; color: var(--text-muted); margin: 16px 0 10px; text-transform: uppercase; letter-spacing: 0.5px; }

    /* 🃏 Карточки объектов (Kaspi + Glass) */
    .grid { display: grid; gap: 16px; }
    @media (min-width: 640px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    
    .card {
      background: var(--card);
      border-radius: var(--radius);
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--glass-border);
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
      position: relative;
    }
    .card:active { transform: scale(0.985); box-shadow: var(--shadow); }
    .card-media {
      height: 180px; position: relative; background: var(--bg-alt);
      display: flex; align-items: center; justify-content: center; overflow: hidden;
    }
    .card-media img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
    .card:hover .card-media img { transform: scale(1.04); }
    .badge {
      position: absolute; top: 10px; right: 10px; padding: 4px 9px;
      border-radius: 8px; font-size: 11px; font-weight: 700; color: #fff;
      background: var(--accent); box-shadow: 0 2px 8px rgba(201,123,90,0.4);
    }
    .badge.exchange { background: var(--trust); }
    .card-body { padding: 12px 14px 14px; }
    .price { font-size: 18px; font-weight: 800; color: var(--text); letter-spacing: -0.3px; margin-bottom: 4px; }
    .meta { font-size: 13px; color: var(--text-muted); margin-bottom: 10px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .agent {
      display: flex; align-items: center; gap: 8px; padding-top: 10px; border-top: 1px solid var(--bg-alt);
    }
    .agent-ava {
      width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, var(--accent-soft), var(--accent));
      display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: #fff;
    }
    .agent-name { font-size: 12px; font-weight: 600; color: var(--text-muted); flex: 1; }
    .actions { display: flex; gap: 8px; margin-top: 10px; }
    .btn {
      flex: 1; padding: 10px; border-radius: 10px; font-size: 12px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      transition: all 0.2s; border: none; cursor: pointer;
    }
    .btn:active { transform: scale(0.96); }
    .btn-primary { background: var(--accent); color: #fff; box-shadow: 0 4px 12px rgba(201,123,90,0.25); }
    .btn-glass { background: var(--bg-alt); color: var(--text); border: 1px solid var(--glass-border); }

    /* 🎥 TikTok-стиль видео (скрыт по умолчанию, открывается по клику) */
    .video-overlay {
      position: fixed; inset: 0; z-index: 100; background: #000;
      display: none; align-items: center; justify-content: center;
    }
    .video-overlay.active { display: flex; }
    .video-overlay iframe { width: 100%; height: 100%; border: none; }
    .close-video {
      position: absolute; top: 16px; right: 16px; z-index: 101;
      width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.2);
      backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.3);
      color: #fff; font-size: 18px; display: flex; align-items: center; justify-content: center; cursor: pointer;
    }

    /* 💬 Чаты (Aira) */
    .chat-placeholder {
      text-align: center; padding: 40px 20px; background: var(--glass);
      border-radius: var(--radius); border: 1px dashed var(--glass-border);
      margin: 16px 0;
    }
    .chat-placeholder i { font-size: 32px; color: var(--text-muted); margin-bottom: 10px; opacity: 0.5; }
    .chat-placeholder p { font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0; }
    .chat-placeholder .btn { margin-top: 12px; max-width: 180px; margin-left: auto; margin-right: auto; }

    /* 📱 Нижняя навигация */
    nav {
      position: sticky; bottom: 0; z-index: 50;
      background: var(--glass); backdrop-filter: blur(16px);
      border-top: 1px solid var(--glass-border);
      display: flex; align-items: center; justify-content: space-around;
      padding: 8px 12px calc(8px + var(--safe-bottom));
    }
    .nav-item {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 4px; padding: 8px 4px; color: var(--text-muted); cursor: pointer; transition: color 0.2s;
    }
    .nav-item i { font-size: 20px; transition: transform 0.2s; }
    .nav-item span { font-size: 10px; font-weight: 700; }
    .nav-item.active { color: var(--accent); }
    .nav-item.active i { transform: translateY(-2px) scale(1.1); }
    
    .nav-add {
      padding: 12px 18px; border-radius: 14px; background: var(--glass);
      backdrop-filter: blur(8px); border: 1px solid var(--glass-border);
      display: flex; align-items: center; gap: 6px; color: var(--accent);
      font-weight: 700; font-size: 13px; cursor: pointer; box-shadow: 0 4px 16px rgba(201,123,90,0.15);
      transition: all 0.2s;
    }
    .nav-add:active { transform: scale(0.96); background: var(--accent-soft); color: #fff; }

    /* 🪄 Утилиты */
    .glass-card {
      background: var(--glass); backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border); border-radius: var(--radius);
      box-shadow: var(--shadow-sm); padding: 16px; margin-bottom: 12px;
    }
    .hidden { display: none !important; }
    .fade-in { animation: fadeIn 0.3s ease forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    /* 📱 Адаптация под маленькие экраны */
    @media (max-width: 480px) {
      .grid { grid-template-columns: 1fr; }
      .card-media { height: 160px; }
      .price { font-size: 17px; }
      .btn { padding: 9px; font-size: 11px; }
    }
  </style>
</head>
<body>

  <!-- 🌟 Приветствие -->
  <div id="welcome">
    <svg class="w-star" viewBox="0 0 24 24"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.8 5.6 21.2 8 14 2 9.2h7.6z"/></svg>
    <div class="w-text">Добро пожаловать домой</div>
  </div>

  <div id="app">
    <header>
      <div class="logo">
        <i class="fas fa-home"></i>
        <h1>Flapy</h1>
        <span>AI</span>
      </div>
      <button class="auth-btn" id="authBtn" onclick="showToast('🔐 Авторизация пока в разработке')">
        <i class="fas fa-user-circle"></i> Войти
      </button>
    </header>

    <main id="mainContent">
      <div class="section-title">🏠 Актуальные предложения</div>
      <div class="grid" id="listingsGrid">
        <!-- Карточки генерируются JS -->
      </div>

      <div id="airaSection" class="hidden">
        <div class="section-title">💬 Aira — Чат риэлторов</div>
        <div class="chat-placeholder">
          <i class="fas fa-lock"></i>
          <p>Это закрытое пространство для профессионалов.<br>Здесь делятся объектами, делят комиссию и решают вопросы без лишнего шума.</p>
          <button class="btn btn-glass" onclick="showToast('🔑 Функция скоро откроется для верифицированных риэлторов')">Войти как риэлтор</button>
        </div>
      </div>

      <div class="glass-card" style="margin-top: 16px; text-align: center;">
        <p style="font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.6;">
          🤲 <b>Безопасность и забота</b><br>
          Каждый объект проходит ручную проверку. Ваши данные защищены. Мы рядом на каждом шаге.
        </p>
      </div>
    </main>

    <nav>
      <div class="nav-item active" onclick="switchTab('search', this)">
        <i class="fas fa-search"></i><span>Поиск</span>
      </div>
      <div class="nav-item" onclick="switchTab('aira', this)">
        <i class="fas fa-comments"></i><span>Aira</span>
      </div>
      <div class="nav-add" onclick="showToast('📝 Добавление объекта доступно после входа')">
        <i class="fas fa-pen-to-square"></i> Добавить
      </div>
      <div class="nav-item" onclick="switchTab('profile', this)">
        <i class="fas fa-user"></i><span>Профиль</span>
      </div>
      <div class="nav-item" onclick="switchTab('more', this)">
        <i class="fas fa-ellipsis-h"></i><span>Ещё</span>
      </div>
    </nav>
  </div>

  <!-- 🎥 Видео оверлей -->
  <div class="video-overlay" id="videoOverlay">
    <button class="close-video" onclick="closeVideo()"><i class="fas fa-times"></i></button>
    <iframe id="videoFrame" allow="autoplay; encrypted-media" allowfullscreen></iframe>
  </div>

  <script>
    // 🧠 Состояние и данные
    const state = { activeTab: 'search', user: null };
    const listings = [
      { id: 1, price: 62000000, rooms: 3, area: 85, district: 'Есиль', badge: 'Горящее', hasVideo: true, videoUrl: 'https://www.tiktok.com/@user/video/123456789', agent: 'Айгерим К.', agency: 'Century 21' },
      { id: 2, price: 38500000, rooms: 2, area: 65, district: 'Сарыарка', badge: 'Обмен', exchange: true, agent: 'Данияр М.', agency: 'Etagi' },
      { id: 3, price: 125000000, rooms: 5, area: 220, district: 'Алматинский', badge: 'Дом', hasVideo: true, videoUrl: 'https://www.tiktok.com/@user/video/987654321', agent: 'Сауле Т.', agency: 'Royal Group' },
      { id: 4, price: 29000000, rooms: 1, area: 42, district: 'Нура', agent: 'Нурлан А.', agency: 'Самозанятый' }
    ];

    // 🌟 Приветствие
    window.addEventListener('load', () => {
      if (!localStorage.getItem('flapy_welcomed')) {
        setTimeout(() => document.getElementById('welcome').classList.add('fade'), 3000);
        localStorage.setItem('flapy_welcomed', '1');
      } else {
        document.getElementById('welcome').style.display = 'none';
      }
      renderListings();
    });

    // 💰 Форматирование цен
    const formatPrice = (num) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(num) + ' ₸';

    // 🃏 Рендер карточек
    function renderListings() {
      const grid = document.getElementById('listingsGrid');
      grid.innerHTML = listings.map(l => `
        <article class="card fade-in" onclick="openDetail(${l.id})">
          <div class="card-media" ${l.hasVideo ? `style="cursor:pointer"` : ''}>
            <img src="https://source.unsplash.com/800x600/?apartment,modern,${l.district}" alt="Объект" loading="lazy" onerror="this.style.display='none';this.parentElement.innerHTML='<i class=\\'fas fa-image\\' style=\\'font-size:48px;color:var(--text-muted)\\'></i>'">
            ${l.badge ? `<div class="badge ${l.exchange ? 'exchange' : ''}">${l.badge}</div>` : ''}
            ${l.hasVideo ? `<div style="position:absolute;bottom:10px;left:10px;background:rgba(0,0,0,0.6);color:#fff;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:600;backdrop-filter:blur(4px)"><i class="fab fa-tiktok"></i> Видео-тур</div>` : ''}
          </div>
          <div class="card-body">
            <div class="price">${formatPrice(l.price)}</div>
            <div class="meta">
              <span>${l.rooms}к · ${l.area} м²</span>
              <span style="opacity:0.6">•</span>
              <span>${l.district}</span>
              ${l.exchange ? '<span style="color:var(--trust);font-weight:600"><i class="fas fa-exchange-alt"></i> Обмен</span>' : ''}
            </div>
            <div class="agent">
              <div class="agent-ava">${l.agent.charAt(0)}</div>
              <div class="agent-name">${l.agent} · ${l.agency}</div>
            </div>
            <div class="actions">
              <button class="btn btn-primary" onclick="event.stopPropagation();showToast('📞 Вызов риэлтора...')"><i class="fas fa-phone"></i> Позвонить</button>
              <button class="btn btn-glass" onclick="event.stopPropagation();showToast('💬 Чат скоро откроется')"><i class="fas fa-comment"></i> Написать</button>
            </div>
          </div>
        </article>
      `).join('');
    }

    // 📱 Переключение вкладок
    function switchTab(tab, el) {
      state.activeTab = tab;
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      el.classList.add('active');
      
      const main = document.getElementById('mainContent');
      const aira = document.getElementById('airaSection');
      
      if (tab === 'aira') {
        main.querySelector('.section-title').style.display = 'none';
        document.getElementById('listingsGrid').style.display = 'none';
        main.querySelector('.glass-card').style.display = 'none';
        aira.classList.remove('hidden');
      } else {
        main.querySelector('.section-title').style.display = 'block';
        document.getElementById('listingsGrid').style.display = 'grid';
        main.querySelector('.glass-card').style.display = 'block';
        aira.classList.add('hidden');
      }
    }

    // 🎥 Видео (TikTok)
    function openVideo(url) {
      const overlay = document.getElementById('videoOverlay');
      const frame = document.getElementById('videoFrame');
      // Превращаем ссылку TikTok в embed
      const embedUrl = url.includes('tiktok.com') 
        ? url.replace(/\/video\/(\d+)/, '/embed/v2/$1') 
        : url;
      frame.src = embedUrl + '?autoplay=1';
      overlay.classList.add('active');
    }
    function closeVideo() {
      document.getElementById('videoOverlay').classList.remove('active');
      document.getElementById('videoFrame').src = '';
    }

    // 🔔 Уведомления (мягкие)
    function showToast(msg) {
      const t = document.createElement('div');
      t.style.cssText = `position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(58,50,38,0.9);color:#fff;padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;z-index:1000;backdrop-filter:blur(6px);animation:fadeIn 0.3s ease;`;
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.4s'; setTimeout(() => t.remove(), 400); }, 2500);
    }

    // 🖱️ Глобальные клики
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.card-media');
      if (card && card.onclick) return;
    });

    // 💡 Подсказка при первом заходе
    setTimeout(() => {
      if (!sessionStorage.getItem('flapy_hint')) {
        showToast('👆 Нажмите на объект, чтобы узнать подробности. Регистрация не нужна.');
        sessionStorage.setItem('flapy_hint', '1');
      }
    }, 4000);
  </script>
</body>
</html>
