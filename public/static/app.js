/* FLAPY app.js v17.0 — TIKTOK WIN-WIN-WIN + EXCHANGE */
'use strict';

/* ════════════════════════════════════════════════════
   🔐 SUPABASE CONFIG
═══════════════════════════════════════════════════ */
const SUPABASE_URL = 'https://qjmfudpqfyanigizwvze.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbWZ1ZHBxZnlhbmlnaXp3dnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzUxODEsImV4cCI6MjA5MDYxMTE4MX0.XWBc3DAjOVMZ80VIlf4zZ1TgqtaxLDczdrPWwdpkkII';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ════════════════════════════════════════════════════
   📊 STATE
═══════════════════════════════════════════════════ */
var listings = [], calEvents = [], curUser = null, curFilter = 'all', curLang = 'ru', listTab = 'obj',
notifications = [],
airaMessages = [],
uploadedMedia = {photos:[], videos:[]};

var T = {ru:{call:'Позвонить',msg:'Написать',profile:'Профиль',logout:'Выйти'},kz:{call:'Қоңырау',msg:'Жазу',profile:'Профиль',logout:'Шығу'}};
function t(k){return (T[curLang]&&T[curLang][k])||(T.ru[k]||k);}

/* ════════════════════════════════════════════════════
   🚀 INIT
═══════════════════════════════════════════════════ */
window.addEventListener('load',function(){
  // Восстанавливаем пользователя
  try{var s=localStorage.getItem('fp_user');if(s)curUser=JSON.parse(s);}catch(e){}
  
  // ✅ ЗАГРУЗКА ИЗ LOCALSTORAGE (чтобы не пропадало)
  try{
    var localListings = localStorage.getItem('fp_listings');
    if(localListings){
      listings = JSON.parse(localListings);
      renderListings();
    }
  }catch(e){}
  
  curLang=localStorage.getItem('fp_lang')||'ru';applyLangUI();
  if(curUser){renderAuthSlot();updateAiraBadge();}
  updateNavVisibility();updateNotificationsCount();
  
  var ld=document.getElementById('loader');if(ld)ld.style.display='none';
  
  // Загружаем из Supabase + сохраняем в localStorage
  if(db){
    db.from('listings').select('*').order('created_at',{ascending:false}).then(function(result){
      if(!result.error && result.data){
        listings = result.data.map(function(i){return {...i, desc: i.description};});
        localStorage.setItem('fp_listings', JSON.stringify(listings)); // ✅ Сохраняем
        renderListings();
      }
    });
  }
  
  console.log('✅ Flapy v17.0 loaded');
});

/* ════════════════════════════════════════════════════
   💾 SAVE/LOAD HELPERS
═══════════════════════════════════════════════════ */
function saveNotifications(){try{localStorage.setItem('fp_notifications',JSON.stringify(notifications));}catch(e){}}

function updateNotificationsCount(){
  var unread=notifications.filter(function(n){return !n.read;}).length;
  var badge=document.getElementById('notif-badge');
  if(badge){badge.textContent=unread>0?(unread>9?'9+':unread):'';badge.style.display=unread>0?'inline-block':'none';}
  var menuBadge=document.getElementById('menu-notif-badge');
  if(menuBadge)menuBadge.textContent=unread>0?unread+' новых':'Нет новых';
}

function renderNotifications(){
  var el=document.getElementById('notif-body');if(!el)return;
  if(notifications.length===0){el.innerHTML='<div style="padding:40px;text-align:center;color:#999"><div style="font-size:48px;margin-bottom:12px">🔔</div><div>Нет уведомлений</div></div>';return;}
  el.innerHTML=notifications.map(function(n){return '<div class="notif-item'+(n.read?'':' unread')+'" onclick="markNotifRead('+n.id+')"><span class="notif-ico">💬</span><div><div class="notif-txt"><b>'+n.from+':</b> '+n.text+'</div>'+(n.read?'':'<div><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--orange);margin-right:4px"></span></div>')+'<div class="notif-time">'+n.time+'</div></div></div>';}).join('');
}

function markNotifRead(id){var n=notifications.find(function(x){return x.id===id;});if(n&&!n.read){n.read=true;updateNotificationsCount();renderNotifications();saveNotifications();}}

function updateAiraBadge(){
  var badge=document.getElementById('aira-status-badge');if(!badge)return;
  if(curUser){badge.textContent='✓ '+curUser.name.split(' ')[0];badge.style.cssText='background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:#27AE60;font-weight:600';}
  else{badge.textContent='🔒 Гость';badge.style.cssText='background:rgba(244,123,32,.1);border:1px solid rgba(244,123,32,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:#F47B20;font-weight:600';}
}

function renderAiraChat(){
  var el=document.getElementById('aira-msgs');if(!el)return;
  if(airaMessages.length===0){el.innerHTML='<div style="padding:40px;text-align:center;color:#999"><div style="font-size:48px;margin-bottom:12px">💬</div><div>Нет сообщений</div></div>';return;}
  el.innerHTML=airaMessages.map(function(m){var bg=m.mine?'var(--navy)':'#fff',color=m.mine?'#fff':'var(--t1)',align=m.mine?'me':'bot';return '<div class="msg '+align+'"><div class="bwrap"><div class="bubble" style="background:'+bg+';color:'+color+'">'+m.text+'</div><div class="m-ts">'+m.time+'</div></div></div>';}).join('');
  setTimeout(function(){el.scrollTop=el.scrollHeight;},50);
}

function sendAira(){var inp=document.getElementById('aira-inp'),txt=inp?inp.value.trim():'';if(!txt)return;var now=new Date(),tm=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');airaMessages.push({id:airaMessages.length+1,author:curUser?curUser.name:'Гость',text:txt,time:tm,mine:true});inp.value='';renderAiraChat();}

function renderProf(){
  var el=document.getElementById('prof-body');if(!el)return;
  if(!curUser){el.innerHTML='<div style="text-align:center;padding:40px 20px"><div style="font-size:72px;margin-bottom:16px">👤</div><button onclick="openM(\'m-auth\')" class="btn-primary">Войти</button></div>';return;}
  var ini=(curUser.name||'R').charAt(0).toUpperCase();
  var userObjs=listings.filter(function(l){return l.realtor===curUser.name;}).length;
  el.innerHTML='<div class="prof-hero"><div class="ph-ava">'+ini+'</div><div class="ph-name">'+curUser.name+'</div><div class="ph-tag">🏠 Риэлтор</div><div class="ph-stats"><div class="ph-stat"><div class="ph-val">'+userObjs+'</div><div class="ph-lbl">объектов</div></div></div></div><div class="menu-sec"><div class="menu-lbl">Аккаунт</div><div class="menu-item" onclick="go(\'s-notif\')"><div class="menu-ico" style="background:rgba(244,123,32,.1)">🔔</div><div style="flex:1"><div class="menu-name">Уведомления</div><div class="menu-sub" id="menu-notif-badge">0 новых</div></div></div><div class="menu-item" onclick="go(\'s-aira\')"><div class="menu-ico" style="background:rgba(39,174,96,.1)">💬</div><div style="flex:1"><div class="menu-name">Aira чат</div><div class="menu-sub">Чат риэлторов</div></div></div><div class="menu-item" onclick="doLogout()"><div class="menu-ico" style="background:rgba(231,76,60,.1)">🚪</div><div><div class="menu-name" style="color:var(--red)">Выйти</div></div></div></div>';
  updateNotificationsCount();
}

function renderAddListing(){openM('m-add');setTimeout(function(){var p=document.getElementById('a-price'),d=document.getElementById('a-desc');if(p)p.value='';if(d)d.value='';document.getElementById('ai-box-wrap').style.display='none';},100);}

function formatPriceInput(inp){if(!inp||!inp.value)return;var v=inp.value.replace(/\D/g,'');if(v){var num=parseInt(v);if(!isNaN(num))inp.value=num.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');}}

function genAI(){var rooms=document.getElementById('a-rooms')?document.getElementById('a-rooms').value:'3';var area=document.getElementById('a-area')?document.getElementById('a-area').value:'85';var dist=document.getElementById('a-district')?document.getElementById('a-district').value:'Есиль';var desc='✨ '+rooms+'-комнатная квартира, '+area+' м² в районе '+dist+'!\n\n🏆 Развитая инфраструктура\n💰 Цена по договорённости\n📍 '+dist+', Астана\n\n📞 Звоните!';var aiBox=document.getElementById('ai-txt');var aiWrap=document.getElementById('ai-box-wrap');if(aiBox)aiBox.textContent=desc;if(aiWrap)aiWrap.style.display='block';}

function useAI(){var ai=document.getElementById('ai-txt')?document.getElementById('ai-txt').textContent:'';var desc=document.getElementById('a-desc');var wrap=document.getElementById('ai-box-wrap');if(desc)desc.value=ai;if(wrap)wrap.style.display='none';}

/* ════════════════════════════════════════════════════
   📤 SUBMIT LISTING — TIKTOK + EXCHANGE
═══════════════════════════════════════════════════ */
function submitListing(){
  var priceEl=document.getElementById('a-price');
  var descEl=document.getElementById('a-desc');
  var typeEl=document.getElementById('a-type');
  var roomsEl=document.getElementById('a-rooms');
  var areaEl=document.getElementById('a-area');
  var cityEl=document.getElementById('a-city');
  var districtEl=document.getElementById('a-district');
  var tiktokEl=document.getElementById('a-tiktok');
  
  if(!priceEl){alert('Ошибка: поле цены');return;}
  if(!descEl){alert('Ошибка: поле описания');return;}
  
  var priceStr=priceEl.value.replace(/\s/g,'');
  var price=parseInt(priceStr)||0;
  var desc=descEl.value||'';
  var type=typeEl?typeEl.value:'apartment';
  var rooms=roomsEl?parseInt(roomsEl.value):3;
  var area=areaEl?parseInt(areaEl.value):85;
  var city=cityEl?cityEl.value:'Астана';
  var district=districtEl?districtEl.value:'Есиль';
  var tiktok=tiktokEl?tiktokEl.value.trim():'';
  
  // ✅ "Рассмотрим обмен"
  var considerExchange = document.getElementById('a-exchange')?.checked || false;
  
  if(!desc||desc.trim()===''){alert('Введите описание');return;}
  if(price<=0){alert('Введите цену');return;}
  
  var photosCopy = uploadedMedia && uploadedMedia.photos ? uploadedMedia.photos.slice() : [];
  var videosCopy = uploadedMedia && uploadedMedia.videos ? uploadedMedia.videos.slice() : [];
  
  var newListing={
    id:Date.now(),
    type:type,
    rooms:rooms,
    area:area,
    city:city,
    district:district,
    price:price,
    desc:desc,
    tiktok:tiktok, // ✅ TikTok ссылка
    consider_exchange: considerExchange, // ✅ "Рассмотрим обмен"
    realtor:curUser?curUser.name:'Гость',
    realtorFull:curUser?curUser.name:'Гость',
    agency:curUser?'Моё агентство':'-',
    phone:'+7 701 234 56 78',
    badge:'Новое',
    tags:[],
    hasVideo:videosCopy.length>0 || (tiktok && tiktok.length>0),
    liked:false,
    photos:photosCopy,
    videos:videosCopy,
    createdAt:new Date().toISOString()
  };
  
  // Локально + localStorage
  listings.unshift(newListing);
  localStorage.setItem('fp_listings', JSON.stringify(listings)); // ✅ Сохраняем
  renderListings();
  
  // В Supabase
  if(db && curUser){
    db.from('listings').insert([{
      price:price,
      description:desc,
      phone:newListing.phone,
      consider_exchange:considerExchange,
      tiktok_url:tiktok, // ✅ TikTok в базу
      city:city,
      district:district,
      rooms:rooms,
      area:area,
      photo_urls:photosCopy,
      realtor_id:curUser.id
    }]);
  }
  
  closeM('m-add');
  priceEl.value='';descEl.value='';if(tiktokEl)tiktokEl.value='';uploadedMedia={photos:[],videos:[]};
  toast('✅ Объект опубликован!');
  go('s-search');
}

function uploadMedia(type){
  var input=document.createElement('input');
  input.type='file';
  input.accept=type==='photo'?'image/*':'video/*';
  input.multiple=true;
  
  input.onchange=function(e){
    var files=e.target.files;
    if(!files||files.length===0)return;
    
    if(type==='video'){
      for(var i=0;i<files.length;i++){
        if(files[i].size>10*1024*1024){alert('⚠️ Видео слишком большое. Максимум 10MB');return;}
      }
    }
    
    toast('⏳ Загрузка...');
    
    var loaded=0;
    Array.from(files).forEach(function(file){
      var reader=new FileReader();
      reader.onload=function(evt){
        if(type==='photo'){
          if(!uploadedMedia.photos)uploadedMedia.photos=[];
          uploadedMedia.photos.push(evt.target.result);
        }else{
          if(!uploadedMedia.videos)uploadedMedia.videos=[];
          uploadedMedia.videos.push(evt.target.result);
        }
        loaded++;
        if(loaded===files.length){
          setTimeout(function(){toast('✅ Загружено');},500);
        }
      };
      reader.readAsDataURL(file);
    });
  };
  
  input.click();
}

function authTab(tab){var i=document.getElementById('at-in'),u=document.getElementById('at-up'),fi=document.getElementById('af-in'),fu=document.getElementById('af-up');if(i)i.classList.toggle('on',tab==='in');if(u)u.classList.toggle('on',tab==='up');if(fi)fi.style.display=tab==='in'?'block':'none';if(fu)fu.style.display=tab==='up'?'block':'none';}

function renderAuthSlot(){var slot=document.getElementById('auth-slot');if(!slot)return;if(curUser){var ini=(curUser.name||'R').charAt(0).toUpperCase();slot.innerHTML='<div class="u-chip" onclick="go(\'s-prof\')"><div class="u-ava">'+ini+'</div><span class="u-nm">'+curUser.name.split(' ')[0]+'</span></div>';}else{slot.innerHTML='<button class="login-btn" onclick="openM(\'m-auth\')">Войти</button>';}}

function doLogin(){var email=document.getElementById('l-email')?document.getElementById('l-email').value.trim():'';if(!email){alert('Введите email');return;}curUser={name:email.split('@')[0],email:email};localStorage.setItem('fp_user',JSON.stringify(curUser));renderAuthSlot();closeM('m-auth');renderProf();updateAiraBadge();updateNavVisibility();toast('👋 Добро пожаловать!');}

function doReg(){var name=document.getElementById('r-name')?document.getElementById('r-name').value.trim():'';var email=document.getElementById('r-email')?document.getElementById('r-email').value.trim():'';if(!name||!email){alert('Заполните поля');return;}curUser={name:name,email:email};localStorage.setItem('fp_user',JSON.stringify(curUser));renderAuthSlot();closeM('m-auth');renderProf();updateAiraBadge();updateNavVisibility();toast('🎉 Добро пожаловать!');}

function doLogout(){curUser=null;localStorage.removeItem('fp_user');renderAuthSlot();renderProf();updateAiraBadge();updateNavVisibility();toast('👋 До встречи!');}

function esc(s){return(s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function fmtPrice(p){if(p==null||p==='')return'0';var n=Number(p);if(isNaN(n))return String(p);return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');}

function toast(msg,ms){var el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';el.style.cssText='position:absolute;bottom:78px;left:50%;transform:translateX(-50%);background:rgba(30,45,90,.9);color:#fff;border-radius:10px;padding:9px 16px;font-size:12px;font-weight:600;z-index:600;opacity:0;transition:opacity .2s';document.body.appendChild(el);}el.textContent=msg;el.style.opacity='1';setTimeout(function(){el.style.opacity='0';},ms||2400);}

function callRealtor(phone){toast('📞 '+phone);}

function viewPhoto(src){var win=window.open('','_blank');if(win){win.document.write('<!DOCTYPE html><html><head><title>Фото</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#000"><img src="'+src+'" style="max-width:100%;max-height:100vh" onclick="window.close()"></body></html>');}else{alert('Разрешите открытие новых окон');}}

function openTikTok(url){
  if(!url){alert('Видео не добавлено');return;}
  window.open(url, '_blank');
}

function openDetail(id){
  var l=listings.find(function(x){return x.id===id;});
  if(!l){alert('Не найдено');return;}
  
  var modalBody=document.getElementById('m-det-body');
  if(!modalBody)return;
  
  var em=l.type==='apartment'?'🏢':l.type==='house'?'🏡':l.type==='commercial'?'🏪':'';
  var photosArray = Array.isArray(l.photos) ? l.photos : [];
  var videosArray = Array.isArray(l.videos) ? l.videos : [];
  
  var photosHtml = '';
  if(photosArray.length > 0){
    photosHtml = '<div style="padding:0 17px 12px"><div style="font-size:12px;color:var(--t3);margin-bottom:8px;font-weight:600">Фото ('+photosArray.length+')</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">';
    photosArray.forEach(function(p){photosHtml += '<div style="aspect-ratio:1;background:var(--bg3);border-radius:8px;overflow:hidden;cursor:pointer" onclick="viewPhoto(\''+p+'\')"><img src="'+p+'" style="width:100%;height:100%;object-fit:cover"></div>';});
    photosHtml += '</div></div>';
  }
  
  // TikTok карточка
  var tiktokHtml = '';
  if(l.tiktok){
    tiktokHtml = '<div style="padding:0 17px 12px"><div style="background:linear-gradient(135deg,#000,#1a1a2e);border-radius:12px;padding:16px;text-align:center;cursor:pointer" onclick="openTikTok(\''+l.tiktok+'\')"><div style="font-size:32px;margin-bottom:8px">🎵</div><div style="color:#fff;font-weight:600;margin-bottom:4px">Видео-обзор на TikTok</div><div style="color:rgba(255,255,255,0.6);font-size:12px;margin-bottom:12px">Переход в приложение</div><div style="display:inline-block;padding:8px 20px;background:#fe2c55;color:#fff;border-radius:8px;font-size:12px;font-weight:700">Открыть ↗</div></div></div>';
  }
  
  var videosHtml = '';
  if(videosArray.length > 0){
    videosHtml = '<div style="padding:0 17px 12px"><div style="font-size:12px;color:var(--t3);margin-bottom:8px;font-weight:600">Видео ('+videosArray.length+')</div>';
    videosArray.forEach(function(v){videosHtml += '<video controls style="width:100%;border-radius:8px;margin-bottom:8px"><source src="'+v+'"></video>';});
    videosHtml += '</div>';
  }
  
  var exchangeBadge = l.consider_exchange ? '<div style="display:inline-block;padding:4px 10px;background:rgba(39,174,96,0.1);color:var(--green);border-radius:6px;font-size:11px;font-weight:600;margin-left:8px">🔄 Рассмотрим обмен</div>' : '';
  
  modalBody.innerHTML='<div class="sh-handle"></div><div class="det-visual"><div class="det-em-bg">'+em+'</div></div><div class="det-price">'+fmtPrice(l.price)+' ₸'+exchangeBadge+'</div><div style="padding:0 17px 12px"><div style="font-size:13px;color:var(--t3)">📍 '+l.city+', '+l.district+'</div><div style="font-size:16px;font-weight:700;margin:8px 0">'+l.rooms+'-комнатная · '+l.area+' м²</div></div><div style="padding:0 17px 16px;font-size:14px;line-height:1.7;color:var(--t2);white-space:pre-line">'+l.desc+'</div>'+photosHtml+tiktokHtml+videosHtml+'<div style="margin:0 17px 12px;padding:12px;background:var(--bg3);border-radius:12px"><div style="font-size:12px;color:var(--t3)">Риэлтор</div><div style="font-weight:600">'+l.realtorFull+'</div><div style="font-size:12px;color:var(--t3)">'+l.agency+'</div></div><div class="det-cta"><button class="det-btn det-call" onclick="callRealtor(\''+esc(l.phone)+'\')"><i class="fas fa-phone"></i> '+t('call')+'</button><button class="det-btn det-chat" onclick="closeM(\'m-det\');go(\'s-aira\')"><i class="fas fa-comment"></i> '+t('msg')+'</button></div>';
  openM('m-det');
}

/* ════════════════════════════════════════════════════
   🎨 RENDER LISTINGS
═══════════════════════════════════════════════════ */
function renderListings(){
  var el=document.getElementById('list-body');if(!el)return;
  
  var filtered = listTab === 'exch' 
    ? listings.filter(function(l){return l.consider_exchange;}) 
    : listings;
  
  if(filtered.length===0){el.innerHTML='<div class="empty"><div class="empty-ico">🏠</div><div class="empty-t">Нет объектов</div></div>';return;}
  
  el.innerHTML=filtered.map(function(l){
    var ini=(l.realtor||'R').charAt(0);
    var em=l.type==='apartment'?'🏢':l.type==='house'?'🏡':l.type==='commercial'?'🏪':'';
    var photosArray = Array.isArray(l.photos) ? l.photos : [];
    var firstPhoto = photosArray.length > 0 ? photosArray[0] : null;
    
    var exchangeBadge = l.consider_exchange ? '<div style="position:absolute;top:10px;left:10px;padding:4px 10px;background:rgba(39,174,96,0.9);color:#fff;border-radius:6px;font-size:10px;font-weight:700;backdrop-filter:blur(4px)">🔄 Обмен</div>' : '';
    
    var mediaHtml = '';
    if(firstPhoto){
      mediaHtml = '<div class="lcard-media" style="background:none;padding:0;position:relative"><img src="'+firstPhoto+'" style="width:100%;height:185px;object-fit:cover;border-radius:12px 12px 0 0">'+exchangeBadge+(l.badge?'<div class="lcard-badge" style="background:var(--orange);position:absolute;top:10px;right:10px">'+l.badge+'</div>':'')+'</div>';
    }else{
      mediaHtml = '<div class="lcard-media"><div class="lcard-em">'+em+'</div>'+exchangeBadge+(l.badge?'<div class="lcard-badge" style="background:var(--orange)">'+l.badge+'</div>':'')+'</div>';
    }
    
    var tiktokIcon = l.tiktok ? '<span style="margin-left:6px;color:#fe2c55">🎵</span>' : '';
    
    return '<div class="lcard su" onclick="openDetail('+l.id+')">'+mediaHtml+'<div class="lcard-body"><div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>'+l.city+', '+l.district+''+tiktokIcon+'</div><div class="lcard-price">'+fmtPrice(l.price)+' ₸</div><div class="lcard-sub">'+l.rooms+'-комнатная · '+l.area+' м²</div>'+(l.desc?'<div style="font-size:13px;color:var(--t2);line-height:1.5;margin:8px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+l.desc+'</div>':'')+'<div class="lcard-footer"><div class="lf-ava" style="background:var(--navy)">'+ini+'</div><div class="lf-name">'+esc(l.realtorFull)+' · '+esc(l.agency)+'</div></div><div class="lcard-cta"><button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\''+esc(l.phone)+'\')"><i class="fas fa-phone"></i> '+t('call')+'</button><button class="cta-btn cta-msg" onclick="event.stopPropagation();go(\'s-aira\')"><i class="fas fa-comment"></i> '+t('msg')+'</button></div></div></div>';
  }).join('');
}

function setListTab(tab){listTab=tab;var t1=document.getElementById('tab-obj'),t2=document.getElementById('tab-exch');if(t1)t1.classList.toggle('on',tab==='obj');if(t2)t2.classList.toggle('on',tab==='exch');renderListings();}

function setFilt(el,f){document.querySelectorAll('.fchip').forEach(function(c){c.classList.remove('on');});if(el)el.classList.add('on');curFilter=f;renderListings();}

function renderFeed(){}
function renderCal(){}
function fetchListings(){}
function fetchCalendar(){}
function renderRealtors(){toast('Раздел недоступен');}
function openAddListing(){if(needAuth(function(){openM('m-add');})){}}
function needAuth(cb){if(!curUser){toast('🔐 Войдите');openM('m-auth');return false;}if(typeof cb==='function')cb();return true;}

function toggleTheme(){var cur=document.documentElement.getAttribute('data-theme'),next=cur==='dark'?'light':'dark';applyTheme(next);localStorage.setItem('fp_theme',next);}
function applyTheme(th){document.documentElement.setAttribute('data-theme',th);var btn=document.getElementById('btn-theme');if(btn)btn.innerHTML=th==='dark'?'<i class="fas fa-sun"></i>':'<i class="fas fa-moon"></i>';}
function setLang(lang){curLang=lang;localStorage.setItem('fp_lang',lang);applyLangUI();}
function applyLangUI(){var ru=document.getElementById('lo-ru'),kz=document.getElementById('lo-kz');if(ru)ru.classList.toggle('on',curLang==='ru');if(kz)kz.classList.toggle('on',curLang==='kz');document.querySelectorAll('[data-ru]').forEach(function(el){var v=el.getAttribute('data-'+curLang);if(v)el.textContent=v;});renderListings();}

function updateNavVisibility(){var p=document.getElementById('nav-plus-wrap'),m=document.getElementById('n-more');if(curUser){if(p)p.style.display='block';if(m)m.style.display='flex';}else{if(p)p.style.display='none';if(m)m.style.display='none';}}

function go(id){document.querySelectorAll('.scr').forEach(function(s){s.classList.remove('on');});var el=document.getElementById(id);if(el)el.classList.add('on');if(id==='s-prof')renderProf();if(id==='s-notif')renderNotifications();if(id==='s-aira')renderAiraChat();if(id==='s-add'){uploadedMedia={photos:[],videos:[]};renderAddListing();}if(id==='s-search')renderListings();}

function nav(el){document.querySelectorAll('.nav-it').forEach(function(n){n.classList.remove('on');});if(el)el.classList.add('on');}
function showMore(){openM('m-more');}
function openM(id){var e=document.getElementById(id);if(e)e.classList.add('on');}
function closeM(id){var e=document.getElementById(id);if(e)e.classList.remove('on');}
function closeOvl(e,id){if(e.target.id===id)closeM(id);}
