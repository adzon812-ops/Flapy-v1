'use strict';

var SUPABASE_URL = 'https://qjmfudpqfyanigizwvze.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbWZ1ZHBxZnlhbmlnaXp3dnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzUxODEsImV4cCI6MjA5MDYxMTE4MX0.XWBc3DAjOVMZ80VIlf4zZ1TgqtaxLDczdrPWwdpkkII';

var db = null;
if (typeof window !== 'undefined' && window.supabase) {
  try { db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch(e) { console.warn('Supabase init failed'); }
}

var listings = [], curUser = null, curFilter = 'all', curLang = 'ru', listTab = 'obj',
    notifications = [], airaMessages = [], uploadedMedia = {photos:[], videos:[]};

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
  
  if(db) loadFromSupabase();
  else if(listings.length===0) renderListings();
});

function loadFromSupabase() {
  if(!db) return;
  db.from('listings').select('*').order('created_at', {ascending: false}).then(function(res) {
    if(res.error || !res.data || res.data.length===0) {
      console.log('ℹ️ DB empty or error, using local');
      renderListings(); return;
    }
    listings = res.data.map(function(i){
      return {
        id:i.id, type:i.type, rooms:i.rooms, area:i.area, city:i.city, district:i.district,
        price:i.price, desc:i.description, exchange:i.exchange||false,
        realtor:i.realtor_name||'Риэлтор', realtorFull:i.realtor_name||'Риэлтор',
        agency:i.agency||'-', phone:i.phone||'+7 701 234 56 78',
        badge:i.badge||'Новое', tags:i.tags||[], hasVideo:i.has_video||false,
        liked:false, photos:i.photo_urls||[], videos:[], createdAt:i.created_at
      };
    });
    saveToLocalSafe();
    renderListings();
  }).catch(function(){ renderListings(); });
}

function saveToLocalSafe() {
  try {
    var clean = listings.map(function(l){
      return {id:l.id,type:l.type,rooms:l.rooms,area:l.area,city:l.city,district:l.district,
              price:l.price,desc:l.desc,exchange:l.exchange,realtor:l.realtor,realtorFull:l.realtorFull,
              agency:l.agency,phone:l.phone,badge:l.badge,tags:l.tags,hasVideo:false,liked:false,
              photos:[],videos:[],createdAt:l.createdAt};
    });
    localStorage.setItem('fp_listings', JSON.stringify(clean));
  } catch(e) { console.warn('LocalStorage full/crash'); }
}

function saveToSupabase(listing) {
  if(!db || !curUser) return Promise.resolve();
  return db.from('listings').insert([{
    realtor_id: curUser.id, type:listing.type, rooms:listing.rooms, area:listing.area,
    city:listing.city, district:listing.district, price:listing.price,
    description:listing.desc, exchange:listing.exchange||false,
    phone:listing.phone, badge:listing.badge, photo_urls:listing.photos,
    has_video:listing.hasVideo, tags:listing.tags
  }]);
}

function submitListing(){
  var priceEl=document.getElementById('a-price'), descEl=document.getElementById('a-desc');
  var typeEl=document.getElementById('a-type'), roomsEl=document.getElementById('a-rooms');
  var areaEl=document.getElementById('a-area'), cityEl=document.getElementById('a-city');
  var districtEl=document.getElementById('a-district'), exchangeEl=document.getElementById('a-exchange');
  
  if(!priceEl||!descEl){alert('Ошибка формы');return;}
  
  var price=parseInt(priceEl.value.replace(/\s/g,''))||0;
  var desc=descEl.value.trim();
  var type=typeEl?typeEl.value:'apartment';
  var rooms=roomsEl?parseInt(roomsEl.value):3;
  var area=areaEl?parseInt(areaEl.value):85;
  var city=cityEl?cityEl.value:'Астана';
  var district=districtEl?districtEl.value:'Есиль';
  var exchange=exchangeEl?exchangeEl.checked:false;
  
  if(!desc){alert('Введите описание');return;}
  if(price<=0){alert('Введите цену');return;}
  
  var newListing={
    id:Date.now(), type:type, rooms:rooms, area:area, city:city, district:district,
    price:price, desc:desc, exchange:exchange,
    realtor:curUser?curUser.name:'Гость', realtorFull:curUser?curUser.name:'Гость',
    agency:curUser?(curUser.agency||'Моё агентство'):'-', phone:'+7 701 234 56 78',
    badge:'Новое', tags:exchange?['Обмен']:['Новое'],
    hasVideo:(uploadedMedia.videos||[]).length>0, liked:false,
    photos:(uploadedMedia.photos||[]), videos:(uploadedMedia.videos||[]),
    createdAt:new Date().toISOString()
  };
  
  listings.unshift(newListing);
  
  if(curUser && db) {
    saveToSupabase(newListing).then(function(){
      saveToLocalSafe(); renderListings(); toast('✅ Сохранено в облаке');
    }).catch(function(){
      saveToLocalSafe(); renderListings(); toast('⚠️ Ошибка облака, сохранено локально');
    });
  } else {
    saveToLocalSafe(); renderListings();
    toast(curUser ? '✅ Опубликовано' : '⚠️ Сохранено локально. Войдите для облака');
  }
  
  closeM('m-add');
  priceEl.value=''; descEl.value=''; uploadedMedia={photos:[],videos:[]};
  go('s-search');
}

function uploadMedia(type){
  var inp=document.createElement('input');
  inp.type='file'; inp.accept=type==='photo'?'image/*':'video/*'; inp.multiple=true;
  inp.onchange=function(e){
    var files=e.target.files; if(!files||!files.length)return;
    toast('⏳ Загрузка...');
    var loaded=0;
    Array.from(files).forEach(function(f){
      var r=new FileReader();
      r.onload=function(ev){
        if(type==='photo'){if(!uploadedMedia.photos)uploadedMedia.photos=[];uploadedMedia.photos.push(ev.target.result);}
        else{if(!uploadedMedia.videos)uploadedMedia.videos=[];uploadedMedia.videos.push(ev.target.result);}
        loaded++; if(loaded===files.length) toast('✅ Медиа добавлено');
      };
      r.readAsDataURL(f);
    });
  };
  inp.click();
}

function renderListings(){
  var el=document.getElementById('list-body');if(!el)return;
  var filtered=listTab==='exch'?listings.filter(function(l){return l.exchange;}):listings;
  if(curFilter==='video')filtered=filtered.filter(function(l){return l.hasVideo;});
  else if(curFilter!=='all')filtered=filtered.filter(function(l){return l.type===curFilter;});
  
  if(filtered.length===0){el.innerHTML='<div class="empty"><div class="empty-ico">🏠</div><div class="empty-t">Нет объектов</div></div>';return;}
  
  el.innerHTML=filtered.map(function(l){
    var ini=(l.realtor||'R').charAt(0);
    var em=l.type==='apartment'?'🏢':l.type==='house'?'🏡':l.type==='commercial'?'🏪':'';
    var photo=l.photos&&l.photos.length>0?l.photos[0]:null;
    var media=photo?
      '<div class="lcard-media" style="background:none;padding:0"><img src="'+photo+'" style="width:100%;height:185px;object-fit:cover">'+(l.badge?'<div class="lcard-badge" style="position:absolute;top:10px;right:10px;background:var(--orange)">'+l.badge+'</div>':'')+'</div>':
      '<div class="lcard-media"><div class="lcard-em">'+em+'</div>'+(l.badge?'<div class="lcard-badge" style="background:var(--orange)">'+l.badge+'</div>':'')+'</div>';
      
    return '<div class="lcard su" onclick="openDetail('+l.id+')">'+media+'<div class="lcard-body"><div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>'+l.city+', '+l.district+'</div><div class="lcard-price">'+fmtPrice(l.price)+' ₸</div><div class="lcard-sub">'+l.rooms+'-комнатная · '+l.area+' м²</div>'+(l.desc?'<div style="font-size:13px;color:var(--t2);line-height:1.5;margin:8px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+l.desc+'</div>':'')+'<div class="lcard-footer"><div class="lf-ava" style="background:var(--navy)">'+ini+'</div><div class="lf-name">'+esc(l.realtorFull)+' · '+esc(l.agency)+'</div></div><div class="lcard-cta"><button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\''+esc(l.phone)+'\')"><i class="fas fa-phone"></i> '+t('call')+'</button><button class="cta-btn cta-msg" onclick="event.stopPropagation();go(\'s-aira\')"><i class="fas fa-comment"></i> '+t('msg')+'</button></div></div></div>';
  }).join('');
}

function openDetail(id){
  var l=listings.find(function(x){return x.id===id;});if(!l)return;
  var b=document.getElementById('m-det-body');if(!b)return;
  var em=l.type==='apartment'?'🏢':l.type==='house'?'🏡':l.type==='commercial'?'🏪':'';
  b.innerHTML='<div class="sh-handle"></div><div class="det-visual"><div class="det-em-bg">'+em+'</div></div><div class="det-price">'+fmtPrice(l.price)+' ₸</div><div style="padding:0 17px 12px"><div style="font-size:13px;color:var(--t3)">📍 '+l.city+', '+l.district+'</div><div style="font-size:16px;font-weight:700;margin:8px 0">'+l.rooms+'-комнатная · '+l.area+' м²</div></div><div style="padding:0 17px 16px;font-size:14px;line-height:1.7;color:var(--t2);white-space:pre-line">'+l.desc+'</div><div style="margin:0 17px 12px;padding:12px;background:var(--bg3);border-radius:12px"><div style="font-size:12px;color:var(--t3)">Риэлтор</div><div style="font-weight:600">'+l.realtorFull+'</div><div style="font-size:12px;color:var(--t3)">'+l.agency+'</div></div><div class="det-cta"><button class="det-btn det-call" onclick="callRealtor(\''+esc(l.phone)+'\')"><i class="fas fa-phone"></i> '+t('call')+'</button><button class="det-btn det-chat" onclick="closeM(\'m-det\');go(\'s-aira\')"><i class="fas fa-comment"></i> '+t('msg')+'</button></div>';
  openM('m-det');
}

function renderProf(){
  var el=document.getElementById('prof-body');if(!el)return;
  if(!curUser){el.innerHTML='<div style="text-align:center;padding:40px 20px"><div style="font-size:72px;margin-bottom:16px">👤</div><button onclick="openM(\'m-auth\')" class="btn-primary">Войти</button></div>';return;}
  var ini=(curUser.name||'R').charAt(0).toUpperCase();
  var cnt=listings.filter(function(l){return l.realtor===curUser.name;}).length;
  el.innerHTML='<div class="prof-hero"><div class="ph-ava">'+ini+'</div><div class="ph-name">'+curUser.name+'</div><div class="ph-tag">🏠 Риэлтор</div><div class="ph-stats"><div class="ph-stat"><div class="ph-val">'+cnt+'</div><div class="ph-lbl">объектов</div></div></div></div><div class="menu-sec"><div class="menu-lbl">Аккаунт</div><div class="menu-item" onclick="go(\'s-notif\')"><div class="menu-ico" style="background:rgba(244,123,32,.1)">🔔</div><div style="flex:1"><div class="menu-name">Уведомления</div><div class="menu-sub" id="menu-notif-badge">0 новых</div></div></div><div class="menu-item" onclick="go(\'s-aira\')"><div class="menu-ico" style="background:rgba(39,174,96,.1)">💬</div><div style="flex:1"><div class="menu-name">Aira чат</div><div class="menu-sub">Чат риэлторов</div></div></div><div class="menu-item" onclick="doLogout()"><div class="menu-ico" style="background:rgba(231,76,60,.1)">🚪</div><div><div class="menu-name" style="color:var(--red)">Выйти</div></div></div></div>';
}

function doLogin(){var e=document.getElementById('l-email')?document.getElementById('l-email').value.trim():'';if(!e){alert('Введите email');return;}curUser={name:e.split('@')[0],email:e,agency:'Моё агентство'};localStorage.setItem('fp_user',JSON.stringify(curUser));renderAuthSlot();closeM('m-auth');renderProf();updateAiraBadge();updateNavVisibility();toast('👋 Добро пожаловать!');}
function doReg(){var n=document.getElementById('r-name')?document.getElementById('r-name').value.trim():'';var e=document.getElementById('r-email')?document.getElementById('r-email').value.trim():'';if(!n||!e){alert('Заполните поля');return;}curUser={name:n,email:e,agency:document.getElementById('r-agency')?document.getElementById('r-agency').value:'Самозанятый'};localStorage.setItem('fp_user',JSON.stringify(curUser));renderAuthSlot();closeM('m-auth');renderProf();updateAiraBadge();updateNavVisibility();toast('🎉 Аккаунт создан!');}
function doLogout(){curUser=null;localStorage.removeItem('fp_user');renderAuthSlot();renderProf();updateAiraBadge();updateNavVisibility();toast('👋 До встречи!');}
function authTab(t){var i=document.getElementById('at-in'),u=document.getElementById('at-up');if(i)i.classList.toggle('on',t==='in');if(u)u.classList.toggle('on',t==='up');document.getElementById('af-in').style.display=t==='in'?'block':'none';document.getElementById('af-up').style.display=t==='up'?'block':'none';}
function renderAuthSlot(){var s=document.getElementById('auth-slot');if(!s)return;s.innerHTML=curUser?'<div class="u-chip" onclick="go(\'s-prof\')"><div class="u-ava">'+(curUser.name||'U').charAt(0)+'</div><span class="u-nm">'+curUser.name.split(' ')[0]+'</span></div>':'<button class="login-btn" onclick="openM(\'m-auth\')">Войти</button>';}
function updateAiraBadge(){var b=document.getElementById('aira-status-badge');if(!b)return;b.textContent=curUser?'✓ '+curUser.name.split(' ')[0]:'🔒 Гость';b.style.cssText=curUser?'background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.2);color:#27AE60':'background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.2);color:#F47B20';}
function renderAiraChat(){var el=document.getElementById('aira-msgs');if(!el)return;el.innerHTML=airaMessages.map(function(m){return '<div class="msg '+(m.mine?'me':'bot')+'"><div class="bwrap"><div class="bubble" style="background:'+(m.mine?'var(--navy)':'#fff')+';color:'+(m.mine?'#fff':'var(--t1)')+'">'+m.text+'</div><div class="m-ts">'+m.time+'</div></div></div>';}).join('');setTimeout(function(){el.scrollTop=el.scrollHeight;},50);}
function sendAira(){var i=document.getElementById('aira-inp'),t=i?i.value.trim():'';if(!t)return;var d=new Date();airaMessages.push({id:Date.now(),text:t,time:d.getHours()+':'+d.getMinutes(),mine:true});i.value='';renderAiraChat();}
function updateNavVisibility(){var p=document.getElementById('nav-plus-wrap'),m=document.getElementById('n-more');if(p)p.style.display=curUser?'block':'none';if(m)m.style.display=curUser?'flex':'none';}
function go(id){document.querySelectorAll('.scr').forEach(function(s){s.classList.remove('on');});var e=document.getElementById(id);if(e)e.classList.add('on');if(id==='s-prof')renderProf();if(id==='s-notif')renderNotifications();if(id==='s-aira')renderAiraChat();if(id==='s-search')renderListings();}
function nav(el){document.querySelectorAll('.nav-it').forEach(function(n){n.classList.remove('on');});if(el)el.classList.add('on');}
function setListTab(t){listTab=t;var a=document.getElementById('tab-obj'),b=document.getElementById('tab-exch');if(a)a.classList.toggle('on',t==='obj');if(b)b.classList.toggle('on',t==='exch');renderListings();}
function setFilt(el,f){document.querySelectorAll('.fchip').forEach(function(c){c.classList.remove('on');});if(el)el.classList.add('on');curFilter=f;renderListings();}
function openAddListing(){if(needAuth(function(){openM('m-add');setTimeout(function(){document.getElementById('a-price').value='';document.getElementById('a-desc').value='';document.getElementById('ai-box-wrap').style.display='none';},100);}))};
function needAuth(cb){if(!curUser){toast('🔐 Войдите сначала');openM('m-auth');return false;}if(typeof cb==='function')cb();return true;}
function showMore(){openM('m-more');}
function openM(id){var e=document.getElementById(id);if(e)e.classList.add('on');}
function closeM(id){var e=document.getElementById(id);if(e)e.classList.remove('on');}
function closeOvl(e,id){if(e.target.id===id)closeM(id);}
function toggleTheme(){var c=document.documentElement.getAttribute('data-theme'),n=c==='dark'?'light':'dark';applyTheme(n);localStorage.setItem('fp_theme',n);}
function applyTheme(th){document.documentElement.setAttribute('data-theme',th);var b=document.getElementById('btn-theme');if(b)b.innerHTML=th==='dark'?'<i class="fas fa-sun"></i>':'<i class="fas fa-moon"></i>';}
function setLang(l){curLang=l;localStorage.setItem('fp_lang',l);applyLangUI();}
function applyLangUI(){var r=document.getElementById('lo-ru'),k=document.getElementById('lo-kz');if(r)r.classList.toggle('on',curLang==='ru');if(k)k.classList.toggle('on',curLang==='kz');document.querySelectorAll('[data-ru]').forEach(function(e){var v=e.getAttribute('data-'+curLang);if(v)e.textContent=v;});renderListings();}
function formatPriceInput(i){if(!i||!i.value)return;var v=i.value.replace(/\D/g,'');if(v){var n=parseInt(v);if(!isNaN(n))i.value=n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');}}
function genAI(){var r=document.getElementById('a-rooms')?document.getElementById('a-rooms').value:'3';var a=document.getElementById('a-area')?document.getElementById('a-area').value:'85';var d=document.getElementById('a-district')?document.getElementById('a-district').value:'Есиль';var t='✨ '+r+'-комнатная квартира, '+a+' м² в районе '+d+'!\n\n🏆 Развитая инфраструктура\n💰 Цена по договорённости\n📍 '+d+', Астана\n\n📞 Звоните!';var b=document.getElementById('ai-txt'),w=document.getElementById('ai-box-wrap');if(b)b.textContent=t;if(w)w.style.display='block';}
function useAI(){var a=document.getElementById('ai-txt')?document.getElementById('ai-txt').textContent:'';var d=document.getElementById('a-desc');var w=document.getElementById('ai-box-wrap');if(d)d.value=a;if(w)w.style.display='none';}
function esc(s){return(s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmtPrice(p){if(p==null||p==='')return'0';var n=Number(p);if(isNaN(n))return String(p);return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
function toast(m,ms){var e=document.getElementById('toast');if(!e){e=document.createElement('div');e.id='toast';e.style.cssText='position:absolute;bottom:78px;left:50%;transform:translateX(-50%);background:rgba(30,45,90,.9);color:#fff;border-radius:10px;padding:9px 16px;font-size:12px;font-weight:600;z-index:600;opacity:0;transition:opacity .2s';document.body.appendChild(e);}e.textContent=m;e.style.opacity='1';setTimeout(function(){e.style.opacity='0';},ms||2400);}
function callRealtor(p){toast('📞 '+p);}
function saveNotifications(){try{localStorage.setItem('fp_notifications',JSON.stringify(notifications));}catch(e){}}
function updateNotificationsCount(){var u=notifications.filter(function(n){return !n.read;}).length;var b=document.getElementById('notif-badge');if(b){b.textContent=u>0?(u>9?'9+':u):'';b.style.display=u>0?'inline-block':'none';}var m=document.getElementById('menu-notif-badge');if(m)m.textContent=u>0?u+' новых':'Нет новых';}
function renderNotifications(){var e=document.getElementById('notif-body');if(!e)return;e.innerHTML=notifications.length===0?'<div style="padding:40px;text-align:center;color:#999"><div style="font-size:48px;margin-bottom:12px">🔔</div><div>Нет уведомлений</div></div>':notifications.map(function(n){return '<div class="notif-item'+(n.read?'':' unread')+'" onclick="markNotifRead('+n.id+')"><span class="notif-ico">💬</span><div><div class="notif-txt"><b>'+n.from+':</b> '+n.text+'</div>'+(n.read?'':'<div><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--orange);margin-right:4px"></span></div>')+'<div class="notif-time">'+n.time+'</div></div></div>';}).join('');}
function markNotifRead(id){var n=notifications.find(function(x){return x.id===id;});if(n&&!n.read){n.read=true;updateNotificationsCount();renderNotifications();saveNotifications();}}
