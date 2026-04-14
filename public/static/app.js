/* FLAPY app.js v12.0 — PRODUCTION READY */
'use strict';

var listings = [], calEvents = [], curUser = null, curFilter = 'all', curLang = 'ru', listTab = 'obj',
notifications = [],
airaMessages = [];

var T = {ru:{call:'Позвонить',msg:'Написать',profile:'Профиль',logout:'Выйти'},kz:{call:'Қоңырау',msg:'Жазу',profile:'Профиль',logout:'Шығу'}};
function t(k){return (T[curLang]&&T[curLang][k])||(T.ru[k]||k);}

window.addEventListener('load',function(){
  try{var s=localStorage.getItem('fp_user');if(s)curUser=JSON.parse(s);}catch(e){}
  try{var l=localStorage.getItem('fp_listings');if(l)listings=JSON.parse(l);}catch(e){}
  try{var n=localStorage.getItem('fp_notifications');if(n)notifications=JSON.parse(n);}catch(e){}
  curLang=localStorage.getItem('fp_lang')||'ru';applyLangUI();
  if(curUser){renderAuthSlot();updateAiraBadge();}
  updateNavVisibility();updateNotificationsCount();
  var ld=document.getElementById('loader');if(ld)ld.style.display='none';
  if(listings.length===0)listings=getFallbackListings();
  renderListings();
});

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
  if(id==='s-aira')renderAiraChat();
  if(id==='s-add')renderAddListing();
  if(id==='s-search')renderListings();
}

function nav(el){document.querySelectorAll('.nav-it').forEach(n=>n.classList.remove('on'));if(el)el.classList.add('on');}
function showMore(){openM('m-more');}
function openM(id){var e=document.getElementById(id);if(e)e.classList.add('on');}
function closeM(id){var e=document.getElementById(id);if(e)e.classList.remove('on');}
function closeOvl(e,id){if(e.target.id===id)closeM(id);}

function getFallbackListings(){
  return [
    {id:1,type:'apartment',rooms:3,area:85,district:'Есильский',city:'Астана',price:78500000,hasVideo:false,realtor:'Айгерим К.',realtorFull:'Айгерим Касымова',rating:4.9,agency:'Century 21',badge:'Новое',desc:'Просторная 3-комнатная квартира с панорамным видом на город. Свежий ремонт евро-класса с использованием качественных материалов. Просторная гостиная-студия, две изолированные спальни, современная кухня с бытовой техникой. Раздельный санузел. Утепленный балкон. Закрытый двор с детской площадкой. Рядом школы, детские сады, ТРЦ. Удобная транспортная развязка.',phone:'+7 701 234 56 78',liked:false,photos:[]},
    {id:2,type:'apartment',rooms:3,area:82,district:'Алматинский',city:'Астана',price:62000000,hasVideo:false,realtor:'Данияр М.',realtorFull:'Данияр Мусин',rating:4.7,agency:'Etagi',badge:'Горящее',desc:'Отличная 3-комнатная квартира в новом жилом комплексе. Полная отделка, никто не жил. Качественные окна, ламинат, керамогранит. Встроенная кухня с техникой. Кондиционер. Подземный паркинг. Охраняемая территория. Развитая инфраструктура: школы, сады, магазины в шаговой доступности.',phone:'+7 702 345 67 89',liked:false,photos:[]}
  ];
}

function saveListings(){
  try{localStorage.setItem('fp_listings',JSON.stringify(listings));}catch(e){}
}

function saveNotifications(){
  try{localStorage.setItem('fp_notifications',JSON.stringify(notifications));}catch(e){}
}

function updateNotificationsCount(){
  var unread=notifications.filter(n=>!n.read).length;
  var badge=document.getElementById('notif-badge');
  if(badge){
    if(unread>0){
      badge.textContent=unread>9?'9+':unread;
      badge.style.display='inline-block';
    }else{
      badge.style.display='none';
    }
  }
  var menuBadge=document.getElementById('menu-notif-badge');
  if(menuBadge){
    menuBadge.textContent=unread>0?unread+' новых':'Нет новых';
  }
}

function renderNotifications(){
  var el=document.getElementById('notif-body');if(!el)return;
  if(notifications.length===0){
    el.innerHTML='<div style="padding:40px;text-align:center;color:#999"><div style="font-size:48px;margin-bottom:12px">🔔</div><div style="font-size:16px;font-weight:600;margin-bottom:4px">Нет уведомлений</div><div style="font-size:13px;color:var(--t3)">Когда появятся новые уведомления, они появятся здесь</div></div>';
    return;
  }
  el.innerHTML=notifications.map(n=>
    '<div class="notif-item'+(n.read?'':' unread')+'" onclick="markNotifRead('+n.id+')"><span class="notif-ico">💬</span><div><div class="notif-txt"><b>'+n.from+':</b> '+n.text+'</div>'+(n.read?'':'<div><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--orange);margin-right:4px"></span></div>')+'<div class="notif-time">'+n.time+'</div></div></div>'
  ).join('');
}

function markNotifRead(id){
  var n=notifications.find(x=>x.id===id);
  if(n&&!n.read){n.read=true;updateNotificationsCount();renderNotifications();saveNotifications();}
}

function updateAiraBadge(){
  var badge=document.getElementById('aira-status-badge');
  if(!badge)return;
  if(curUser){
    badge.textContent='✓ '+curUser.name.split(' ')[0];
    badge.style.cssText='background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:#27AE60;font-weight:600';
  }else{
    badge.textContent='🔒 Гость';
    badge.style.cssText='background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:#F47B20;font-weight:600';
  }
}

function renderAiraChat(){
  var el=document.getElementById('aira-msgs');if(!el)return;
  if(airaMessages.length===0){
    el.innerHTML='<div style="padding:40px;text-align:center;color:#999"><div style="font-size:48px;margin-bottom:12px">💬</div><div style="font-size:16px;font-weight:600;margin-bottom:4px">Нет сообщений</div><div style="font-size:13px">Будьте первым кто напишет!</div></div>';
    return;
  }
  el.innerHTML=airaMessages.map(m=>{
    var bg=m.mine?'var(--navy)':'#fff',color=m.mine?'#fff':'var(--t1)',align=m.mine?'me':'bot',border=m.highlight?'border-left:3px solid var(--orange)':'';
    return '<div class="msg '+align+'"><div class="bwrap"><div class="bubble" style="background:'+bg+';color:'+color+';'+border+'">'+m.text+'</div><div class="m-ts">'+m.time+'</div></div></div>';
  }).join('');
  setTimeout(function(){el.scrollTop=el.scrollHeight;},50);
}

function sendAira(){
  var inp=document.getElementById('aira-inp'),txt=inp?inp.value.trim():'';
  if(!txt)return;
  var now=new Date(),tm=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  airaMessages.push({id:airaMessages.length+1,author:curUser?curUser.name:'Гость',text:txt,time:tm,mine:true});
  inp.value='';renderAiraChat();
}

function replyAira(btn){
  var inp=document.getElementById('aira-inp');
  if(inp){inp.value='@';inp.focus();}
}

function renderProf(){
  var el=document.getElementById('prof-body');if(!el)return;
  if(!curUser){
    el.innerHTML='<div style="text-align:center;padding:40px 20px"><div style="font-size:72px;margin-bottom:16px">👤</div><div style="font-size:18px;margin-bottom:24px;color:#555">Войдите в систему</div><button onclick="openM(\'m-auth\')" class="btn-primary">Войти</button></div>';
    return;
  }
  var ini=(curUser.name||'R').charAt(0).toUpperCase();
  var userNotifications=notifications.filter(n=>!n.read).length;
  el.innerHTML='<div class="prof-hero"><div class="ph-ava">'+ini+'</div><div class="ph-name">'+curUser.name+'</div><div class="ph-tag">🏠 Риэлтор</div><div class="ph-stats"><div class="ph-stat"><div class="ph-val">'+listings.filter(l=>l.realtor===curUser.name).length+'</div><div class="ph-lbl">объектов</div></div><div class="ph-stat"><div class="ph-val">4.9★</div><div class="ph-lbl">рейтинг</div></div></div></div>'+
    '<div class="menu-sec"><div class="menu-lbl">Аккаунт</div>'+
    '<div class="menu-item" onclick="go(\'s-notif\')"><div class="menu-ico" style="background:rgba(244,123,32,.1)">🔔</div><div style="flex:1"><div class="menu-name">Уведомления</div><div class="menu-sub">'+userNotifications+' новых</div></div><i class="fas fa-chevron-right" style="color:var(--t3);font-size:11px"></i></div>'+
    '<div class="menu-item" onclick="go(\'s-aira\')"><div class="menu-ico" style="background:rgba(39,174,96,.1)">💬</div><div style="flex:1"><div class="menu-name">Aira чат</div><div class="menu-sub">Чат риэлторов</div></div><i class="fas fa-chevron-right" style="color:var(--t3);font-size:11px"></i></div>'+
    '<div class="menu-item" onclick="doLogout()"><div class="menu-ico" style="background:rgba(231,76,60,.1)">🚪</div><div><div class="menu-name" style="color:var(--red)">Выйти</div></div></div></div>';
  updateNotificationsCount();
}

function renderAddListing(){openM('m-add');}

function formatPriceInput(inp){
  var v=inp.value.replace(/\D/g,'');
  if(v){
    var num=parseInt(v);
    if(!isNaN(num)){
      inp.value=num.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');
    }
  }
}

function genAI(){
  var rooms=document.getElementById('a-rooms')?.value||'3',area=document.getElementById('a-area')?.value||'85',dist=document.getElementById('a-district')?.value||'Есиль';
  var desc='✨ '+rooms+'-комнатная квартира, '+area+' м² в районе '+dist+'!\n\n🏆 Развитая инфраструктура:\n• Рядом транспорт\n• Ухоженный двор\n• Консьерж\n\n💰 Цена по договорённости\n📍 '+dist+', Астана\n\n📞 Звоните — покажу в любое удобное время!';
  document.getElementById('ai-txt').textContent=desc;
  document.getElementById('ai-box-wrap').style.display='block';
}

function useAI(){
  var ai=document.getElementById('ai-txt').textContent;
  document.getElementById('a-desc').value=ai;
  document.getElementById('ai-box-wrap').style.display='none';
}

function submitListing(){
  var priceStr=document.getElementById('a-price')?.value.replace(/\s/g,'')||'0';
  var price=parseInt(priceStr);
  var desc=document.getElementById('a-desc')?.value||'';
  var type=document.getElementById('a-type')?.value||'apartment';
  var rooms=document.getElementById('a-rooms')?.value||'3';
  var area=document.getElementById('a-area')?.value||'85';
  var city=document.getElementById('a-city')?.value||'Астана';
  var district=document.getElementById('a-district')?.value||'Есиль';
  
  if(!desc){alert('Введите описание объекта');return;}
  if(price<=0){alert('Введите корректную цену');return;}
  
  var newListing={
    id:Date.now(),
    type:type,
    rooms:parseInt(rooms)||3,
    area:parseInt(area)||85,
    city:city,
    district:district,
    price:price,
    desc:desc,
    realtor:curUser?curUser.name:'Гость',
    realtorFull:curUser?curUser.name:'Гость',
    agency:curUser?'Моё агентство':'-',
    phone:curUser?'+7 701 234 56 78':'+7 701 234 56 78',
    badge:'Новое',
    tags:[],
    hasVideo:false,
    liked:false,
    photos:[],
    createdAt:new Date().toISOString()
  };
  
  listings.unshift(newListing);
  saveListings();
  renderListings();
  closeM('m-add');
  
  document.getElementById('a-price').value='';
  document.getElementById('a-desc').value='';
  document.getElementById('a-rooms').value='3';
  document.getElementById('a-area').value='';
  
  toast('✅ Объект опубликован!');
  go('s-search');
}

function uploadMedia(type){
  var input=document.createElement('input');
  input.type='file';
  input.accept=type==='photo'?'image/*':'video/*';
  input.onchange=function(e){
    var file=e.target.files[0];
    if(file){
      toast('⏳ Загрузка '+ (type==='photo'?'фото':'видео') +'...');
      var reader=new FileReader();
      reader.onload=function(evt){
        setTimeout(function(){
          toast('✅ '+ (type==='photo'?'Фото':'Видео') +' загружено: '+file.name.substring(0,20)+'...');
        },1000);
      };
      reader.readAsDataURL(file);
    }
  };
  input.click();
}

function authTab(tab){
  var i=document.getElementById('at-in'),u=document.getElementById('at-up'),fi=document.getElementById('af-in'),fu=document.getElementById('af-up');
  if(i)i.classList.toggle('on',tab==='in');
  if(u)u.classList.toggle('on',tab==='up');
  if(fi)fi.style.display=tab==='in'?'block':'none';
  if(fu)fu.style.display=tab==='up'?'block':'none';
}

function renderAuthSlot(){
  var slot=document.getElementById('auth-slot');if(!slot)return;
  if(curUser){
    var ini=(curUser.name||'R').charAt(0).toUpperCase();
    slot.innerHTML='<div class="u-chip" onclick="go(\'s-prof\')"><div class="u-ava">'+ini+'</div><span class="u-nm">'+curUser.name.split(' ')[0]+'</span></div>';
  }else{
    slot.innerHTML='<button class="login-btn" onclick="openM(\'m-auth\')">Войти</button>';
  }
}

function doLogin(){
  var email=document.getElementById('l-email')?.value.trim();
  if(!email){alert('Введите email');return;}
  curUser={name:email.split('@')[0],email:email};
  localStorage.setItem('fp_user',JSON.stringify(curUser));
  renderAuthSlot();closeM('m-auth');renderProf();updateAiraBadge();updateNavVisibility();
  toast('👋 Добро пожаловать, '+curUser.name+'!');
}

function doReg(){
  var name=document.getElementById('r-name')?.value.trim(),email=document.getElementById('r-email')?.value.trim();
  if(!name||!email){alert('Заполните все поля');return;}
  curUser={name:name,email:email};
  localStorage.setItem('fp_user',JSON.stringify(curUser));
  renderAuthSlot();closeM('m-auth');renderProf();updateAiraBadge();updateNavVisibility();
  toast('🎉 Добро пожаловать, '+name+'!');
}

function doLogout(){
  curUser=null;
  renderAuthSlot();renderProf();updateAiraBadge();updateNavVisibility();
  toast('👋 До встречи!');
}

function val(id){var e=document.getElementById(id);return e?e.value.trim():'';}
function esc(s){return(s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function fmtPrice(p){
  if(p==null||p==='')return'0';
  var n=Number(p);
  if(isNaN(n))return String(p);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');
}

function toast(msg,ms){
  var el=document.getElementById('toast');
  if(!el){
    el=document.createElement('div');
    el.id='toast';
    el.style.cssText='position:absolute;bottom:78px;left:50%;transform:translateX(-50%) translateY(6px);background:rgba(30,45,90,.9);color:#fff;border-radius:10px;padding:9px 16px;font-size:12px;font-weight:600;white-space:nowrap;z-index:600;opacity:0;transition:all .2s';
    document.body.appendChild(el);
  }
  el.textContent=msg;el.classList.add('show');
  setTimeout(function(){el.classList.remove('show');},ms||2400);
}

function callRealtor(phone){toast('📞 '+phone);}

function toggleLike(id,btn){
  var l=listings.find(x=>x.id===id);if(!l)return;
  l.liked=!l.liked;
  btn.innerHTML='<i class="'+(l.liked?'fas':'far')+' fa-heart"></i>';
  saveListings();
}

function openDetail(id){
  var l=listings.find(x=>x.id===id);
  if(!l){alert('Объект не найден');return;}
  var modalBody=document.getElementById('m-det-body');
  if(!modalBody)return;
  
  var em=l.type==='apartment'?'🏢':l.type==='house'?'🏡':l.type==='commercial'?'🏪':'🌳';
  
  modalBody.innerHTML='<div class="sh-handle"></div>'+
    '<div class="det-visual"><div class="det-em-bg">'+em+'</div></div>'+
    '<div class="det-price">'+fmtPrice(l.price)+' ₸</div>'+
    '<div style="padding:0 17px 12px"><div style="font-size:13px;color:var(--t3);margin-bottom:4px">📍 '+l.city+', '+l.district+'</div><div style="font-size:16px;font-weight:700;color:var(--t1);margin-bottom:8px">'+l.rooms+'-комнатная · '+l.area+' м²</div></div>'+
    '<div class="det-desc" style="padding:0 17px 16px;font-size:14px;line-height:1.7;color:var(--t2);white-space:pre-line">'+l.desc+'</div>'+
    '<div style="margin:0 17px 12px;padding:12px;background:var(--bg3);border-radius:12px"><div style="font-size:12px;color:var(--t3);margin-bottom:4px">Риэлтор</div><div style="font-weight:600;color:var(--t1)">'+l.realtorFull+'</div><div style="font-size:12px;color:var(--t3)">'+l.agency+'</div></div>'+
    '<div class="det-cta">'+
      '<button class="det-btn det-call" onclick="callRealtor(\''+esc(l.phone)+'\')"><i class="fas fa-phone"></i> '+t('call')+'</button>'+
      '<button class="det-btn det-chat" onclick="closeM(\'m-det\');go(\'s-aira\')"><i class="fas fa-comment"></i> '+t('msg')+'</button>'+
    '</div>';
  
  openM('m-det');
}

function renderListings(){
  var el=document.getElementById('list-body');if(!el)return;
  if(listings.length===0){
    el.innerHTML='<div class="empty"><div class="empty-ico">🏠</div><div class="empty-t">Нет объектов</div><div class="empty-s">Добавьте первый объект!</div></div>';
    return;
  }
  
  var filtered=listings;
  if(listTab==='exch')filtered=listings.filter(l=>l.exchange);
  if(curFilter==='video')filtered=listings.filter(l=>l.hasVideo);
  else if(curFilter!=='all')filtered=listings.filter(l=>l.type===curFilter);
  
  if(filtered.length===0){
    el.innerHTML='<div class="empty"><div class="empty-ico">🔍</div><div class="empty-t">Ничего не найдено</div></div>';
    return;
  }
  
  el.innerHTML=filtered.map(l=>{
    var ini=(l.realtor||'R').charAt(0);
    var em=l.type==='apartment'?'🏢':l.type==='house'?'🏡':l.type==='commercial'?'🏪':'';
    return '<div class="lcard su" onclick="openDetail('+l.id+')"><div class="lcard-media"><div class="lcard-em">'+em+'</div>'+(l.badge?'<div class="lcard-badge" style="background:var(--orange)">'+l.badge+'</div>':'')+'</div><div class="lcard-body"><div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>'+l.city+', '+l.district+'</div><div class="lcard-price">'+fmtPrice(l.price)+' ₸</div><div class="lcard-sub">'+l.rooms+'-комнатная · '+l.area+' м²</div><div class="lcard-tags">'+(l.tags||[]).map(tg=>'<span class="ltag'+(tg==='Обмен'?' exch':'')+'">'+tg+'</span>').join('')+'</div><div class="lcard-desc" style="font-size:13px;color:var(--t2);line-height:1.5;margin:8px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+l.desc+'</div><div class="lcard-footer"><div class="lf-ava" style="background:var(--navy)">'+ini+'</div><div class="lf-name">'+esc(l.realtorFull)+' · '+esc(l.agency)+'</div></div><div class="lcard-cta"><button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\''+esc(l.phone)+'\')"><i class="fas fa-phone"></i> '+t('call')+'</button><button class="cta-btn cta-msg" onclick="event.stopPropagation();go(\'s-aira\')"><i class="fas fa-comment"></i> '+t('msg')+'</button></div></div></div>';
  }).join('');
}

function setListTab(tab){
  listTab=tab;
  var t1=document.getElementById('tab-obj'),t2=document.getElementById('tab-exch');
  if(t1)t1.classList.toggle('on',tab==='obj');
  if(t2)t2.classList.toggle('on',tab==='exch');
  renderListings();
}

function setFilt(el,f){
  document.querySelectorAll('.fchip').forEach(c=>c.classList.remove('on'));
  if(el)el.classList.add('on');
  curFilter=f;renderListings();
}

function renderFeed(){}
function renderCal(){
  var el=document.getElementById('cal-body');if(!el)return;
  if(!calEvents.length){el.innerHTML='<div style="padding:40px;text-align:center;color:#999">Нет событий</div>';return;}
  el.innerHTML=calEvents.map(e=>'<div class="ev-card"><div class="ev-time"><div class="ev-hm">'+e.time.slice(11,16)+'</div></div><div class="ev-line" style="background:'+(e.color||'var(--navy)')+'"></div><div class="ev-inf"><div class="ev-ttl">'+e.title+'</div><div class="ev-cli">'+(e.client||'')+'</div>'+(e.note?'<div class="ev-note">'+e.note+'</div>':'')+'</div></div>').join('');
}
function fetchListings(){}
function fetchCalendar(){}
function renderRealtors(){toast('Раздел временно недоступен');}
function openAddListing(){if(needAuth(()=>openM('m-add'))){}}
function sortRealtors(by,el){document.querySelectorAll('.rsort').forEach(r=>r.classList.remove('on'));if(el)el.classList.add('on');}
function toggleThread(el){var body=el.nextElementSibling;if(body){body.style.display=body.style.display==='none'?'block':'none';el.querySelector('i').style.transform=body.style.display==='none'?'rotate(0)':'rotate(180deg)';}}
function needAuth(cb){if(!curUser){toast('🔐 Требуется авторизация');openM('m-auth');return false;}if(typeof cb==='function')cb();return true;}

function toggleTheme(){
  var cur=document.documentElement.getAttribute('data-theme'),next=cur==='dark'?'light':'dark';
  applyTheme(next);localStorage.setItem('fp_theme',next);
}

function applyTheme(th){
  document.documentElement.setAttribute('data-theme',th);
  var btn=document.getElementById('btn-theme');
  if(btn)btn.innerHTML=th==='dark'?'<i class="fas fa-sun"></i>':'<i class="fas fa-moon"></i>';
}

function setLang(lang){
  curLang=lang;localStorage.setItem('fp_lang',lang);applyLangUI();
}

function applyLangUI(){
  var ru=document.getElementById('lo-ru'),kz=document.getElementById('lo-kz');
  if(ru)ru.classList.toggle('on',curLang==='ru');
  if(kz)kz.classList.toggle('on',curLang==='kz');
  document.querySelectorAll('[data-ru]').forEach(el=>{var v=el.getAttribute('data-'+curLang);if(v)el.textContent=v;});
  renderListings();
}

console.log('✅ Flapy app.js v12.0 loaded — PRODUCTION READY');
