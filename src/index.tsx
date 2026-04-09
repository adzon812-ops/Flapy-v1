<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Flapy — твой дом с заботой</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none; /* легкая защита от выделения, только для эстетики */
        }

        body {
            font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
            background: #FFFBF7;
            overflow: hidden;
            height: 100vh;
            width: 100vw;
        }

        /* ---------- SPLASH (анимированное приветствие) ---------- */
        .splash {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #FFFBF7;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            transition: opacity 0.8s cubic-bezier(0.2, 0.9, 0.4, 1.1);
            opacity: 1;
        }

        .splash.hide {
            opacity: 0;
            pointer-events: none;
        }

        .splash-content {
            text-align: center;
            max-width: 90%;
            padding: 1rem;
            animation: contentFadeIn 0.8s ease-out;
        }

        /* логотип */
        .logo {
            font-size: clamp(2.5rem, 10vw, 5rem);
            font-weight: 800;
            letter-spacing: -0.02em;
            background: linear-gradient(135deg, #F97316 0%, #FFB347 100%);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            text-shadow: 0 4px 15px rgba(249, 115, 22, 0.15);
            margin-bottom: 1rem;
            animation: gentleScale 0.7s cubic-bezier(0.2, 0.9, 0.4, 1.2) forwards;
            transform-origin: center;
        }

        .logo small {
            font-size: 0.35em;
            vertical-align: super;
            background: none;
            background-clip: unset;
            -webkit-background-clip: unset;
            color: #F97316;
        }

        /* анимированный домик + солнце */
        .home-animation {
            margin: 2rem auto;
            width: min(280px, 70vw);
            aspect-ratio: 1 / 0.9;
            position: relative;
        }

        svg {
            width: 100%;
            height: 100%;
            display: block;
            filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.05));
        }

        /* солнце (встаёт из-за горизонта) */
        .sun {
            transform-origin: 50% 80%;
            animation: sunRise 1.8s cubic-bezier(0.2, 0.9, 0.3, 1.2) forwards;
        }

        @keyframes sunRise {
            0% { transform: translateY(60px) scale(0.6); opacity: 0; }
            40% { transform: translateY(-5px) scale(1); opacity: 0.9; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
        }

        /* лучи солнца */
        .sun-rays {
            transform-origin: 50% 50%;
            animation: softRotate 20s infinite linear;
        }

        @keyframes softRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* дым из трубы — три круга */
        .smoke-1, .smoke-2, .smoke-3 {
            animation-duration: 2.2s;
            animation-iteration-count: infinite;
            animation-timing-function: ease-out;
            transform-origin: center;
        }

        .smoke-1 {
            animation-name: smokeFloat1;
        }
        .smoke-2 {
            animation-name: smokeFloat2;
            animation-delay: 0.4s;
        }
        .smoke-3 {
            animation-name: smokeFloat3;
            animation-delay: 0.8s;
        }

        @keyframes smokeFloat1 {
            0% { transform: translate(0, 0) scale(0.6); opacity: 0.5; }
            50% { transform: translate(-8px, -18px) scale(1.2); opacity: 0.7; }
            100% { transform: translate(-14px, -38px) scale(1.8); opacity: 0; }
        }
        @keyframes smokeFloat2 {
            0% { transform: translate(0, 0) scale(0.5); opacity: 0.4; }
            50% { transform: translate(5px, -20px) scale(1.1); opacity: 0.6; }
            100% { transform: translate(12px, -45px) scale(1.7); opacity: 0; }
        }
        @keyframes smokeFloat3 {
            0% { transform: translate(0, 0) scale(0.7); opacity: 0.6; }
            50% { transform: translate(-4px, -22px) scale(1.3); opacity: 0.8; }
            100% { transform: translate(-8px, -50px) scale(2); opacity: 0; }
        }

        /* текстовые блоки */
        .tagline {
            font-size: clamp(1rem, 4vw, 1.4rem);
            color: #F97316;
            font-weight: 500;
            letter-spacing: 0.3px;
            margin-top: 0.5rem;
            opacity: 0;
            animation: fadeSlideUp 0.7s 0.5s forwards;
        }

        .welcome-message {
            font-size: clamp(1.4rem, 6vw, 2.2rem);
            font-weight: 700;
            color: #1F2937;
            margin-top: 0.5rem;
            background: linear-gradient(120deg, #1F2937, #3B4A5C);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            opacity: 0;
            animation: fadeSlideUp 0.7s 0.9s forwards;
        }

        @keyframes contentFadeIn {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
        }

        @keyframes gentleScale {
            0% { opacity: 0; transform: scale(0.85); }
            100% { opacity: 1; transform: scale(1); }
        }

        @keyframes fadeSlideUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }

        /* основной контент (появляется после сплеша) */
        .main-app {
            opacity: 0;
            transition: opacity 0.8s ease;
            height: 100vh;
            width: 100vw;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #FFFBF7;
            flex-direction: column;
            gap: 2rem;
            padding: 2rem;
            text-align: center;
        }

        .main-app.visible {
            opacity: 1;
        }

        .main-card {
            background: white;
            border-radius: 32px;
            padding: 2rem 2rem 2.5rem;
            box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.08);
            max-width: 480px;
            width: 100%;
        }

        .main-card h2 {
            font-size: 2rem;
            background: linear-gradient(135deg, #F97316, #FFB347);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            margin-bottom: 0.75rem;
        }

        .main-card p {
            color: #4B5563;
            line-height: 1.5;
            margin-bottom: 1.8rem;
        }

        .btn-primary {
            background: #F97316;
            border: none;
            padding: 0.9rem 1.8rem;
            border-radius: 60px;
            font-weight: 600;
            font-size: 1rem;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 8px rgba(249, 115, 22, 0.2);
        }

        .btn-primary:hover {
            background: #E8620D;
            transform: scale(0.98);
            box-shadow: 0 2px 5px rgba(249, 115, 22, 0.3);
        }

        /* чтобы избежать скролла */
        ::-webkit-scrollbar {
            display: none;
        }
    </style>
</head>
<body>

<!-- АНИМИРОВАННЫЙ СПЛЕШ -->
<div class="splash" id="splashScreen">
    <div class="splash-content">
        <div class="logo">Flapy<small>™</small></div>

        <div class="home-animation">
            <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- земля/основание -->
                <rect x="0" y="130" width="200" height="50" fill="#FDE9D5" rx="6" />
                <!-- трава/лужайка -->
                <rect x="0" y="130" width="200" height="12" fill="#D4F0D0" rx="4" />
                
                <!-- ДОМИК -->
                <!-- стены -->
                <rect x="45" y="70" width="100" height="65" fill="#FFE3CC" stroke="#F97316" stroke-width="1.5" rx="4" />
                <!-- крыша -->
                <polygon points="95,35 150,70 40,70" fill="#E8630A" stroke="#C94F00" stroke-width="1.5" />
                <!-- труба -->
                <rect x="120" y="45" width="16" height="30" fill="#D9C2A7" stroke="#B89A7A" stroke-width="1" rx="2" />
                <!-- дверь -->
                <rect x="80" y="98" width="30" height="37" fill="#D9A066" stroke="#B87B3A" rx="14" />
                <circle cx="103" cy="117" r="2" fill="#F3B27A" />
                <!-- окно -->
                <rect x="130" y="92" width="20" height="20" fill="#FFF2E0" stroke="#F97316" stroke-width="1.2" rx="3" />
                <line x1="140" y1="92" x2="140" y2="112" stroke="#F97316" stroke-width="1" />
                <line x1="130" y1="102" x2="150" y2="102" stroke="#F97316" stroke-width="1" />
                
                <!-- СОЛНЦЕ (анимированное вставание) -->
                <g class="sun">
                    <circle cx="160" cy="45" r="18" fill="#FFD966" stroke="#F4B942" stroke-width="1" />
                    <!-- лучи -->
                    <g class="sun-rays">
                        <line x1="160" y1="20" x2="160" y2="12" stroke="#F4B942" stroke-width="2" stroke-linecap="round" />
                        <line x1="160" y1="70" x2="160" y2="78" stroke="#F4B942" stroke-width="2" stroke-linecap="round" />
                        <line x1="135" y1="45" x2="127" y2="45" stroke="#F4B942" stroke-width="2" stroke-linecap="round" />
                        <line x1="185" y1="45" x2="193" y2="45" stroke="#F4B942" stroke-width="2" stroke-linecap="round" />
                        <line x1="142" y1="27" x2="136" y2="21" stroke="#F4B942" stroke-width="2" stroke-linecap="round" />
                        <line x1="178" y1="27" x2="184" y2="21" stroke="#F4B942" stroke-width="2" stroke-linecap="round" />
                        <line x1="142" y1="63" x2="136" y2="69" stroke="#F4B942" stroke-width="2" stroke-linecap="round" />
                        <line x1="178" y1="63" x2="184" y2="69" stroke="#F4B942" stroke-width="2" stroke-linecap="round" />
                    </g>
                </g>
                
                <!-- ДЫМ из трубы -->
                <circle class="smoke-1" cx="128" cy="42" r="5" fill="#EAD7C3" opacity="0.6" />
                <circle class="smoke-2" cx="132" cy="40" r="4.5" fill="#EAD7C3" opacity="0.5" />
                <circle class="smoke-3" cx="126" cy="38" r="6" fill="#EAD7C3" opacity="0.55" />
            </svg>
        </div>

        <div class="tagline">С любовью и заботой.</div>
        <div class="welcome-message">Добро пожаловать домой</div>
    </div>
</div>

<!-- ОСНОВНОЙ ИНТЕРФЕЙС (появляется после анимации) -->
<div class="main-app" id="mainApp">
    <div class="main-card">
        <h2>✨ Flapy готов</h2>
        <p>Твоя новая платформа, где недвижимость продаётся с душой.<br>Уют, честность и поддержка — внутри.</p>
        <button class="btn-primary" id="enterBtn">Перейти к объектам</button>
    </div>
    <div style="font-size: 0.85rem; color: #B7A88C;">Сообщество риэлторов и покупателей</div>
</div>

<script>
    (function() {
        const splash = document.getElementById('splashScreen');
        const mainApp = document.getElementById('mainApp');

        // Функция перехода от сплеша к приложению
        function transitionToApp() {
            if (!splash || splash.classList.contains('hide')) return;
            splash.classList.add('hide');
            // Ждём окончания анимации исчезновения сплеша, затем показываем main
            setTimeout(() => {
                splash.style.display = 'none';
                mainApp.classList.add('visible');
                // небольшой триггер для перерисовки
                document.body.style.overflow = 'auto';
            }, 800);
        }

        // Автоматический переход через 3.5 секунды (после того как все анимации завершены)
        const autoTimer = setTimeout(transitionToApp, 3600);

        // По клику на сплеш тоже можно перейти быстрее (удобно для тестов)
        splash.addEventListener('click', (e) => {
            // не даём клику прерваться, если кликнули на кнопку внутри сплеша (но у нас нет кнопок)
            clearTimeout(autoTimer);
            transitionToApp();
        });

        // Кнопка внутри основного экрана (можно просто редирект на главную ленту или удалить splash)
        const enterBtn = document.getElementById('enterBtn');
        if (enterBtn) {
            enterBtn.addEventListener('click', () => {
                // здесь в будущем можно перекинуть на реальную ленту объектов
                alert('🌿 Добро пожаловать в Flapy! Лента объектов скоро будет здесь.');
                // для демо можно просто показать сообщение, но по желанию:
                // window.location.href = '/feed';
            });
        }

        // Если что-то пошло не так с анимацией (гарантия, что сплеш скроется)
        window.addEventListener('load', () => {
            // дополнительная страховка: если через 5 секунд сплеш всё ещё виден — убираем
            setTimeout(() => {
                if (splash && !splash.classList.contains('hide')) {
                    clearTimeout(autoTimer);
                    transitionToApp();
                }
            }, 5000);
        });
    })();
</script>
</body>
</html>
