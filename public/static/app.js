/* FLAPY app.js v11.0 — COMPATIBLE WITH index.ts HTML */
'use strict';

/* STATE */
var listings = [], calEvents = [], curUser = null, curFilter = 'all', curLang = 'ru', listTab = 'obj',
notifications = [{id:1,from:'Aira',text:'Данияр М. ответил на объект',time:'10 мин',read:false},{id:2,from:'Система',text:'Новый показ',time:'1 час',read:false}],
airaMessages = [{id:1,author:'Айгерим К.',text:'3к Есиль — ищу покупателя 🤝',time:'10:30',mine:false},{id:2,author:'Данияр М.',text:'Есть покупатель!',time:'10:35',mine:false,highlight:true}];

var T = {ru:{call:'Позвонить',msg:'Написать',profile:'Профиль',logout:'Выйти'},kz:{call:'Қоңырау',msg:'Жазу',profile:'Профиль',logout:'Шығу'}};
function t(k){return (T[curLang]&&T[curLang][k])||(T.ru[k]||k);}

/* INIT */
window.addEventListener('load',function(){
  try{var s=localStorage.getItem('fp_user');if(s)curUser=JSON.parse(s);}catch(e){}
  curLang=localStorage.getItem('fp_lang')||'ru';applyLangUI();
  if(curUser)renderAuthSlot();updateNavVisibility();updateNotificationsCount();
  var ld=document.getElementById('loader');if(ld)ld.style.display='none';
  listings=getFallbackListings();renderListings();
});

/* NAV */
function updateNavVisibility(){
  var p=document.getElementById('nav-plus-wrap'),m=document.getElementById('n-more');
  if(curUser){if(p)p.style.display='block';if(m)m.style.display='flex';}
  else{if(p)p.style.display='none';if(m)m.style.display='none';}
}
function go(id){
  document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'));
  var el=document.getElementById(id);if(el)el.classList.add('on');
  if(id==='s-prof')renderProf();
  if(id==='s-notif')renderNotifications();
  if(id==='s-aira')renderAiraChat(); // FIXED: uses correct container
  if(id==='s-add')renderAddListing();
  if(id==='s-search')renderListings();
}
function nav(el){document.querySelectorAll('.nav-it').forEach(n=>n.classList.remove('on'));if(el)el.classList.add('on');}
function showMore(){openM('m-more');}
function openM(id){var e=document.getElementById(id);if(e)e.classList.add('on');}
function closeM(id){var e=document.getElementById(id);if(e)e.classList.remove('on');}
function closeOvl(e,id){if(e.target.id===id)closeM(id);}

/* DATA */
function getFallbackListings(){
  return [
    {id:1,type:'apartment',rooms:3,area:85,district:'Есильский',city:'Астана',price:78500000,hasVideo:false,realtor:'Айгерим К.',realtorFull:'Айгерим Касымова',rating:4.9,agency:'Century 21',badge:'Новое',desc:'Просторная 3-комнатная с панорамным видом.',phone:'+7 701 234 56 78',liked:false},
    {id:2,type:'apartment',rooms:3,area:82,district:'Алматинский',city:'Астана',price:62000000,hasVideo:false,realtor:'Данияр М.',realtorFull:'Данияр Мусин',rating:4.7,agency:'Etagi',badge:'Горящее',desc:'Новый ЖК, полная отделка.',phone:'+7 702 345 67 89',liked:false}
  ];
}

/* NOTIFICATIONS - FIXED CONTAINER */
function updateNotificationsCount(){
  var unread=notifications.filter(n=>!n.read).length;
  var badge=document.getElementById('notif-badge');
  if(badge){badge.textContent=unread>0?(unread>9?'9+':unread):'';badge.style.display=unread>0?'inline-block':'none';}
}
function renderNotifications(){
  // FIXED: Render directly into #s-notif, not #notif-body
  var el=document.getElementById('s-notif');
  if(!el)return;
  var body=el.querySelector('.notif-wrap');
  if(!body)return;
  
  if(notifications.length===0){
    body.innerHTML='<div style="padding:40px;text-align:center;color:#999">Нет уведомлений</div>';
    return;
  }
  body.innerHTML='<div class="notif-title">Уведомления</div>'+notifications.map(n=>
    '<div class="notif-item su" onclick="markNotifRead('+n.id+')"><span class="notif-ico">💬</span><div><div class="notif-txt"><b>'+n.from+':</b> '+n.text+'</div>'+(n.read?'':'<div><span class="n-new-dot" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--orange);margin-right:4px"></span></div>')+'<div class="notif-time">'+n.time+'</div></div></div>'
  ).join('');
}
function markNotifRead(id){var n=notifications.find(x=>x.id===id);if(n&&!n.read){n.read=true;updateNotificationsCount();renderNotifications();}}

/* AIRA CHAT - FIXED ID: aira-msgs */
function renderAiraChat(){
  var el=document.getElementById('aira-msgs'); // FIXED: was 'aira-chat-body'
  if(!el){console.error('❌ aira-msgs not found');return;}
  
  // Keep header, replace only messages area
  el.innerHTML=airaMessages.map(m=>{
    var bg=m.mine?'var(--navy)':'var(--white)',color=m.mine?'#fff':'var(--t1)',align=m.mine?'me':'bot',border=m.highlight?'border-left:3px solid var(--orange)':'';
    return '<div class="msg '+align+'"><div class="bwrap"><div class="bubble" style="background:'+bg+';color:'+color+';'+border+'">'+m.text+'</div><div class="m-ts">'+m.time+'</div></div></div>';
  }).join('');
  
  // Add input area back (it was outside aira-msgs in HTML)
  setTimeout(()=>{el.scrollTop=el.scrollHeight;},50);
}
function sendAira(){
  var inp=document.getElementById('aira-inp'),txt=inp?inp.value.trim():'';
  if(!txt)return;
  var now=new Date(),tm=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  airaMessages.push({id:airaMessages.length+1,author:curUser?curUser.name:'Гость',text:txt,time:tm,mine:true});
  inp.value='';renderAiraChat();toast('✅ Отправлено');
}
function replyAira(btn){
  var inp=document.getElementById('aira-inp');
  if(inp){inp.value='@';inp.focus();toast('✍️ Введите ответ');}
}

/* PROFILE */
function renderProf(){
  var el=document.getElementById('prof-body');if(!el)return;
  if(!curUser){
    el.innerHTML='<div style="text-align:center;padding:40px 20px"><div style="font-size:72px;margin-bottom:16px">👤</div><button onclick="openM(\'m-auth\')" class="btn-primary">Войти</button></div>';
    return;
  }
  var ini=(curUser.name||'R').charAt(0).toUpperCase();
  el.innerHTML='<div class="prof-hero"><div class="ph-ava">'+ini+'</div><div class="ph-name">'+curUser.name+'</div><div class="ph-tag">🏠 Риэлтор</div><div class="ph-stats"><div class="ph-stat"><div class="ph-val">47</div><div class="ph-lbl">сделок</div></div><div class="ph-stat"><div class="ph-val">4.9★</div><div class="ph-lbl">рейтинг</div></div></div></div><div class="menu-sec"><div class="menu-lbl">Аккаунт</div><div class="menu-item" onclick="go(\'s-notif\')"><div class="menu-ico" style="background:rgba(244,123,32,.1)">🔔</div><div style="flex:1"><div class="menu-name">Уведомления</div><div class="menu-sub" id="menu-notif-badge">2 новых</div></div><i class="fas fa-chevron-right" style="color:var(--t3);font-size:11px"></i></div><div class="menu-item" onclick="go(\'s-aira\')"><div class="menu-ico" style="background:rgba(39,174,96,.1)">💬</div><div style="flex:1"><div class="menu-name">Aira чат</div><div class="menu-sub">Чат риэлторов</div></div><i class="fas fa-chevron-right" style="color:var(--t3);font-size:11px"></i></div><div class="menu-item" onclick="doLogout()"><div class="menu-ico" style="background:rgba(231,76,60,.1)">🚪</div><div><div class="menu-name" style="color:var(--red)">Выйти</div></div></div></div>';
  updateNotificationsCount();
}

/* ADD LISTING - FIXED */
function renderAddListing(){openM('m-add');}
function formatPriceInput(inp){var v=inp.value.replace(/\D/g,'');if(v)inp.value=fmtPrice(parseInt(v));}
function genAI(){
  var rooms=document.getElementById('a-rooms')?.value||'3',area=document.getElementById('a-area')?.value||'85',dist=document.getElementById('a-district')?.value||'Есиль';
  var desc='✨ '+rooms+'-комнатная квартира, '+area+' м² в '+dist+'!\n\n🏆 Развитая инфраструктура · Рядом транспорт\n💰 Цена по договорённости\n📍 '+dist+', Астана\n📞 Звоните — покажу в любое время!';
  document.getElementById('ai-txt').textContent=desc;
  document.getElementById('ai-box-wrap').style.display='block';
  toast('✨ Описание сгенерировано!');
}
function useAI(){var ai=document.getElementById('ai-txt').textContent;document.getElementById('a-desc').value=ai;document.getElementById('ai-box-wrap').style.display='none';toast('✅ Применено');}
function submitListing(){
  var price=document.getElementById('a-price')?.value,desc=document.getElementById('a-desc')?.value;
  if(!price||!desc){toast('⚠️ Заполните цену и описание');return;}
  listings.unshift({id:listings.length+1,type:'apartment',rooms:3,area:85,city:'Астана',district:'Есильский',price:parseInt(price.replace(/\s/g,'')),desc:desc,realtor:curUser?curUser.name:'Гость',realtorFull:curUser?curUser.name:'Гость',agency:curUser?'Моё агентство':'-',phone:'+7 701 234 56 78',badge:'Новое',tags:[],hasVideo:false,liked:false,photos:['🏢']});
  renderListings();closeM('m-add');toast('✅ Объект опубликован!');go('s-search');
}
function uploadMedia(type){toast('⏳ Загрузка '+ (type==='photo'?'фото':'видео') +'...');setTimeout(()=>toast('✅ Загружено'),1500);}

/* AUTH */
function authTab(tab){var i=document.getElementById('at-in'),u=document.getElementById('at-up'),fi=document.getElementById('af-in'),fu=document.getElementById('af-up');if(i)i.classList.toggle('on',tab==='in');if(u)u.classList.toggle('on',tab==='up');if(fi)fi.style.display=tab==='in'?'block':'none';if(fu)fu.style.display=tab==='up'?'block':'none';}
function renderAuthSlot(){
  var slot=document.getElementById('auth-slot');if(!slot)return;
  if(curUser){var ini=(curUser.name||'R').charAt(0).toUpperCase();slot.innerHTML='<div class="u-chip" onclick="go(\'s-prof\')"><div class="u-ava">'+ini+'</div><span class="u-nm">'+curUser.name.split(' ')[0]+'</span></div>';}
  else{slot.innerHTML='<button class="login-btn" onclick="openM(\'m-auth\')">Войти</button>';}
}
function doLogin(){var email=document.getElementById('l-email')?.value.trim();if(!email){toast('⚠️ Введите email');return;}curUser={name:email.split('@')[0],email:email};localStorage.setItem('fp_user',JSON.stringify(curUser));renderAuthSlot();closeM('m-auth');renderProf();updateNavVisibility();toast('👋 Добро пожаловать!');}
function doReg(){var name=document.getElementById('r-name')?.value.trim(),email=document.getElementById('r-email')?.value.trim();if(!name||!email){toast('⚠️ Заполните все поля');return;}curUser={name:name,email:email};localStorage.setItem('fp_user',JSON.stringify(curUser));renderAuthSlot();closeM('m-auth');renderProf();updateNavVisibility();toast('🎉 Добро пожаловать!');}
function doLogout(){curUser=null;localStorage.removeItem('fp_user');renderAuthSlot();renderProf();updateNavVisibility();toast('👋 До встречи!');}

/* UTILS */
function val(id){var e=document.getElementById(id);return e?e.value.trim():'';}
function esc(s){return(s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmtPrice(p){if(p==null)return'0';var n=Number(p);return isNaN(n)?String(p):n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
function toast(msg,ms){var el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';el.style.cssText='position:absolute;bottom:78px;left:50%;transform:translateX(-50%) translateY(6px);background:rgba(30,45,90,.9);color:#fff;border-radius:10px;padding:9px 16px;font-size:12px;font-weight:600;white-space:nowrap;z-index:600;opacity:0;transition:all .2s';document.body.appendChild(el);}el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),ms||2400);}
function callRealtor(phone){toast('📞 '+phone);}
function toggleLike(id,btn){var l=listings.find(x=>x.id===id);if(!l)return;l.liked=!l.liked;btn.innerHTML='<i class="'+(l.liked?'fas':'far')+' fa-heart"></i>';toast(l.liked?'❤️ Избранное':'💔 Убрано');}
function openDetail(id){var l=listings.find(x=>x.id===id);if(!l)return;toast(l.realtorFull+' · '+fmtPrice(l.price)+' ₸');}

/* LISTINGS */
function renderListings(){
  var el=document.getElementById('list-body');if(!el)return;
  if(!listings.length){el.innerHTML='<div class="empty"><div class="empty-ico">🔍</div><div class="empty-t">Загрузка...</div></div>';return;}
  el.innerHTML=listings.map(l=>{var ini=(l.realtor||'R').charAt(0);return '<div class="lcard su" onclick="openDetail('+l.id+')"><div class="lcard-media"><div class="lcard-em">🏢</div>'+(l.badge?'<div class="lcard-badge" style="background:var(--orange)">'+l.badge+'</div>':'')+'</div><div class="lcard-body"><div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>'+l.city+', '+l.district+'</div><div class="lcard-price">'+fmtPrice(l.price)+' ₸</div><div class="lcard-sub">'+l.rooms+'-комнатная · '+l.area+' м²</div><div class="lcard-tags">'+(l.tags||[]).map(tg=>'<span class="ltag'+(tg==='Обмен'?' exch':'')+'">'+tg+'</span>').join('')+'</div><div class="lcard-footer"><div class="lf-ava" style="background:var(--navy)">'+ini+'</div><div class="lf-name">'+esc(l.realtorFull)+' · '+esc(l.agency)+'</div></div><div class="lcard-cta"><button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\''+esc(l.phone)+'\')"><i class="fas fa-phone"></i> '+t('call')+'</button><button class="cta-btn cta-msg" onclick="event.stopPropagation();go(\'s-aira\')"><i class="fas fa-comment"></i> '+t('msg')+'</button></div></div></div>';}).join('');
}
function setListTab(tab){listTab=tab;var t1=document.getElementById('tab-obj'),t2=document.getElementById('tab-exch');if(t1)t1.classList.toggle('on',tab==='obj');if(t2)t2.classList.toggle('on',tab==='exch');renderListings();}
function setFilt(el,f){document.querySelectorAll('.fchip').forEach(c=>c.classList.remove('on'));if(el)el.classList.add('on');curFilter=f;renderListings();}

/* PLACEHOLDER FUNCTIONS (NO ERRORS) */
function renderFeed(){}
function renderCal(){var el=document.getElementById('cal-body');if(!el)return;if(!calEvents.length){el.innerHTML='<div style="padding:40px;text-align:center;color:#999">Нет событий</div>';return;}el.innerHTML=calEvents.map(e=>'<div class="ev-card"><div class="ev-time"><div class="ev-hm">'+e.time.slice(11,16)+'</div></div><div class="ev-line" style="background:'+ (e.color||'var(--navy)') +'"></div><div class="ev-inf"><div class="ev-ttl">'+e.title+'</div><div class="ev-cli">'+ (e.client||'') +'</div>'+(e.note?'<div class="ev-note">'+e.note+'</div>':'')+'</div></div>').join('');}
function fetchListings(){}
function fetchCalendar(){}
function renderRealtors(){toast('ℹ️ Раздел "Риэлторы" временно недоступен');}
function openAddListing(){if(needAuth(()=>openM('m-add'))){}}
function sortRealtors(by,el){document.querySelectorAll('.rsort').forEach(r=>r.classList.remove('on'));if(el)el.classList.add('on');toast('Сортировка: '+by);}
function toggleThread(el){var body=el.nextElementSibling;if(body){body.style.display=body.style.display==='none'?'block':'none';el.querySelector('i').style.transform=body.style.display==='none'?'rotate(0)':'rotate(180deg)';}}
function needAuth(cb){if(!curUser){toast('🔐 Требуется авторизация');openM('m-auth');return false;}if(typeof cb==='function')cb();return true;}

/* THEME & LANG */
function toggleTheme(){var cur=document.documentElement.getAttribute('data-theme'),next=cur==='dark'?'light':'dark';applyTheme(next);localStorage.setItem('fp_theme',next);}
function applyTheme(th){document.documentElement.setAttribute('data-theme',th);var btn=document.getElementById('btn-theme');if(btn)btn.innerHTML=th==='dark'?'<i class="fas fa-sun"></i>':'<i class="fas fa-moon"></i>';}
function setLang(lang){curLang=lang;localStorage.setItem('fp_lang',lang);applyLangUI();toast(lang==='kz'?'🇰 Қазақ тілі':'🇷 Русский');}
function applyLangUI(){var ru=document.getElementById('lo-ru'),kz=document.getElementById('lo-kz');if(ru)ru.classList.toggle('on',curLang==='ru');if(kz)kz.classList.toggle('on',curLang==='kz');document.querySelectorAll('[data-ru]').forEach(el=>{var v=el.getAttribute('data-'+curLang);if(v)el.textContent=v;});renderListings();}

console.log('✅ Flapy app.js v11.0 loaded — compatible with index.ts');
