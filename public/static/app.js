/* FLAPY app.js v16.0 — SUPABASE SYNC + ALL FEATURES v14.0 */
'use strict';

/* ════════════════════════════════════════════════════
   🔐 SUPABASE CONFIG (ТВОИ КЛЮЧИ)
═══════════════════════════════════════════════════ */
var SUPABASE_URL = 'https://qjmfudpqfyanigizwvze.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbWZ1ZHBxZnlhbmlnaXp3dnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzUxODEsImV4cCI6MjA5MDYxMTE4MX0.XWBc3DAjOVMZ80VIlf4zZ1TgqtaxLDczdrPWwdpkkII';

var db = null;
if (typeof window !== 'undefined' && window.supabase) {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('✅ Supabase подключён');
}

/* ════════════════════════════════════════════════════
   📊 STATE (как в v14.0)
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
  // Восстанавливаем пользователя из localStorage
  try{var s=localStorage.getItem('fp_user');if(s)curUser=JSON.parse(s);}catch(e){}
  
  // Загружаем данные из localStorage (fallback)
  try{var l=localStorage.getItem('fp_listings');if(l)listings=JSON.parse(l);}catch(e){}
  try{var n=localStorage.getItem('fp_notifications');if(n)notifications=JSON.parse(n);}catch(e){}
  
  curLang=localStorage.getItem('fp_lang')||'ru';applyLangUI();
  if(curUser){renderAuthSlot();updateAiraBadge();}
  updateNavVisibility();updateNotificationsCount();
  
  var ld=document.getElementById('loader');if(ld)ld.style.display='none';
  
  // Загружаем из Supabase (если есть подключение)
  if (db) {
    loadFromSupabase();
  } else if (listings.length === 0) {
    listings = getFallbackListings();
    renderListings();
  }
  
  console.log('✅ Flapy app.js v16.0 loaded');
});

/* ════════════════════════════════════════════════════
   📥 LOAD FROM SUPABASE
═══════════════════════════════════════════════════ */
function loadFromSupabase() {
  if (!db) return;
  
  db.from('listings').select('*').order('created_at', {ascending: false}).then(function(result) {
    if (result.error) {
      console.warn('⚠️ Supabase error, using localStorage:', result.error);
      if (listings.length === 0) listings = getFallbackListings();
      renderListings();
      return;
    }
    
    // Преобразуем: в базе "description", в коде "desc"
    listings = (result.data || []).map(function(item) {
      return {
        id: item.id,
        type: item.type,
        rooms: item.rooms,
        area: item.area,
        city: item.city,
        district: item.district,
        price: item.price,
        desc: item.description, // ✅ ВАЖНО: база → код
        realtor: item.realtor_name || 'Риэлтор',
        realtorFull: item.realtor_name || 'Риэлтор',
        agency: item.agency || '-',
        phone: item.phone || '+7 701 234 56 78',
        badge: item.badge || 'Новое',
        tags: item.tags || [],
        hasVideo: item.has_video || false,
        liked: false,
        photos: item.photo_urls || [],
        videos: [],
        createdAt: item.created_at
      };
    });
    
    console.log('✅ Загружено из Supabase:', listings.length);
    saveToListingsLocal(); // Сохраняем в localStorage для оффлайна
    renderListings();
    
  }).catch(function(e) {
    console.warn('⚠️ Supabase fetch failed, using localStorage');
    if (listings.length === 0) listings = getFallbackListings();
    renderListings();
  });
}

/* ════════════════════════════════════════════════════
   💾 SAVE TO SUPABASE + LOCALSTORAGE
═══════════════════════════════════════════════════ */
function saveToListingsLocal() {
  try {
    // Сохраняем в localStorage (для быстрого доступа и оффлайна)
    localStorage.setItem('fp_listings', JSON.stringify(listings));
  } catch(e) {
    console.warn('⚠️ localStorage save failed');
  }
}

function saveToSupabase(listing) {
  if (!db || !curUser) return Promise.resolve();
  
  return db.from('listings').insert([{
    realtor_id: curUser.id,
    type: listing.type,
    rooms: listing.rooms,
    area: listing.area,
    city: listing.city,
    district: listing.district,
    price: listing.price,
    description: listing.desc, // ✅ ВАЖНО: код → база
    phone: listing.phone,
    badge: listing.badge,
    photo_urls: listing.photos,
    tiktok_url: listing.tiktok || '',
    has_video: listing.hasVideo,
    tags: listing.tags
  }]).then(function(result) {
    if (result.error) throw result.error;
    console.log('✅ Saved to Supabase');
  });
}

/* ════════════════════════════════════════════════════
   📋 FALLBACK DATA (как в v14.0)
═══════════════════════════════════════════════════ */
function getFallbackListings(){
  return [
    {id:1,type:'apartment',rooms:3,area:85,district:'Есильский',city:'Астана',price:78500000,hasVideo:false,realtor:'Айгерим К.',realtorFull:'Айгерим Касымова',rating:4.9,agency:'Century 21',badge:'Новое',desc:'Просторная 3-комнатная квартира с панорамным видом.',phone:'+7 701 234 56 78',liked:false,photos:[],videos:[]},
    {id:2,type:'apartment',rooms:3,area:82,district:'Алматинский',city:'Астана',price:62000000,hasVideo:false,realtor:'Данияр М.',realtorFull:'Данияр Мусин',rating:4.7,agency:'Etagi',badge:'Горящее',desc:'Отличная 3-комнатная в новом ЖК.',phone:'+7 702 345 67 89',liked:false,photos:[],videos:[]}
  ];
}

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
   📤 SUBMIT LISTING (SUPABASE + LOCAL)
═══════════════════════════════════════════════════ */
function submitListing(){
  console.log('📝 Submit started');
  
  var priceEl=document.getElementById('a-price');
  var descEl=document.getElementById('a-desc');
  var typeEl=document.getElementById('a-type');
  var roomsEl=document.getElementById('a-rooms');
  var areaEl=document.getElementById('a-area');
  var cityEl=document.getElementById('a-city');
  var districtEl=document.getElementById('a-district');
  
  if(!priceEl){console.error('❌ Price not found');alert('Ошибка: поле цены');return;}
  if(!descEl){console.error('❌ Desc not found');alert('Ошибка: поле описания');return;}
  
  var priceStr=priceEl.value.replace(/\s/g,'');
  var price=parseInt(priceStr)||0;
  var desc=descEl.value||'';
  var type=typeEl?typeEl.value:'apartment';
  var rooms=roomsEl?parseInt(roomsEl.value):3;
  var area=areaEl?parseInt(areaEl.value):85;
  var city=cityEl?cityEl.value:'Астана';
  var district=districtEl?districtEl.value:'Есиль';
  
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
    realtor:curUser?curUser.name:'Гость',
    realtorFull:curUser?curUser.name:'Гость',
    agency:curUser?'Моё агентство':'-',
    phone:'+7 701 234 56 78',
    badge:'Новое',
    tags:[],
    hasVideo:videosCopy.length>0,
    liked:false,
    photos:photosCopy,
    videos:videosCopy,
    createdAt:new Date().toISOString()
  };
  
  // 1. Добавляем в локальный массив (мгновенно)
  listings.unshift(newListing);
  saveToListingsLocal();
  renderListings();
  
  // 2. Сохраняем в Supabase (фоном)
  if (db && curUser) {
    saveToSupabase(newListing).catch(function(e) {
      console.warn('⚠️ Supabase save failed, but local save OK');
    });
  }
  
  closeM('m-add');
  priceEl.value='';descEl.value='';uploadedMedia={photos:[],videos:[]};
  toast('✅ Объект опубликован!');
  go('s-search');
}

function uploadMedia(type){
  console.log('📁 Upload clicked, type:',type);
  
  var input=document.createElement('input');
  input.type='file';
  input.accept=type==='photo'?'image/*':'video/*';
  input.multiple=true;
  
  input.onchange=function(e){
    var files=e.target.files;
    if(!files||files.length===0)return;
    
    if(type==='video'){
      for(var i=0;i<files.length;i++){
        if(files[i].size>10*1024*1024){
          alert('⚠️ Видео слишком большое. Максимум 10MB');
          return;
        }
      }
    }
    
    toast('⏳ Загрузка '+files.length+' '+ (type==='photo'?'фото':'видео') +'...');
    
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
          setTimeout(function(){
            toast('✅ Загружено: '+(uploadedMedia.photos?uploadedMedia.photos.length:0)+' фото, '+(uploadedMedia.videos?uploadedMedia.videos.length:0)+' видео');
          },500);
        }
      };
      reader.onerror=function(err){
        console.error('❌ Error loading file:',err);
        toast('❌ Ошибка: '+file.name);
      };
      reader.readAsDataURL(file);
    });
  };
  
  input.click();
}

function authTab(tab){var i=document.getElementById('at-in'),u=document.getElementById('at-up'),fi=document.getElementById('af-in'),fu=document.getElementById('af-up');if(i)i.classList.toggle('on',tab==='in');if(u)u.classList.toggle('on',tab==='up');if(fi)fi.style.display=tab==='in'?'block':'none';if(fu)fu.style.display=tab==='up'?'block':'none';}

function renderAuthSlot(){var slot=document.getElementById('auth-slot');if(!slot)return;if(curUser){var ini=(curUser.name||'R').charAt(0).toUpperCase();slot.innerHTML='<div class="u-chip" onclick="go(\'s-prof\')"><div class="u-ava">'+ini+'</div><span class="u-nm">'+curUser.name.split(' ')[0]+'</span></div>';}else{slot.innerHTML='<button class="login-btn" onclick="openM(\'m-auth\')">Войти</button>';}}

function doLogin(){var email=document.getElementById('l-email')?document.getElementById('l-email').value.trim():'';if(!email){alert('Введите email');return;}curUser={name:email.split('@')[0],email:email};localStorage.setItem('fp_user',JSON.stringify(curUser));renderAuthSlot();closeM('m-auth');renderProf();updateAiraBadge();updateNavVisibility();toast('👋 Добро пожаловать, '+curUser.name+'!');}

function doReg(){var name=document.getElementById('r-name')?document.getElementById('r-name').value.trim():'';var email=document.getElementById('r-email')?document.getElementById('r-email').value.trim():'';if(!name||!email){alert('Заполните поля');return;}curUser={name:name,email:email};localStorage.setItem('fp_user',JSON.stringify(curUser));renderAuthSlot();closeM('m-auth');renderProf();updateAiraBadge();updateNavVisibility();toast('🎉 Добро пожаловать, '+name+'!');}

function doLogout(){curUser=null;localStorage.removeItem('fp_user');renderAuthSlot();renderProf();updateAiraBadge();updateNavVisibility();toast('👋 До встречи!');}

function esc(s){return(s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function fmtPrice(p){if(p==null||p==='')return'0';var n=Number(p);if(isNaN(n))return String(p);return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');}

function toast(msg,ms){var el=document.getElementById('toast');if(!el){el=document.createElement('div');el.id='toast';el.style.cssText='position:absolute;bottom:78px;left:50%;transform:translateX(-50%);background:rgba(30,45,90,.9);color:#fff;border-radius:10px;padding:9px 16px;font-size:12px;font-weight:600;z-index:600;opacity:0;transition:opacity .2s';document.body.appendChild(el);}el.textContent=msg;el.style.opacity='1';setTimeout(function(){el.style.opacity='0';},ms||2400);}

function callRealtor(phone){toast('📞 '+phone);}

function viewPhoto(src){
  console.log('🖼️ View photo');
  var win=window.open('','_blank');
  if(win){
    win.document.write('<!DOCTYPE html><html><head><title>Фото</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#000"><img src="'+src+'" style="max-width:100%;max-height:100vh;cursor:pointer" onclick="window.close()"></body></html>');
  }else{
    alert('Разрешите открытие новых окон');
  }
}

function openDetail(id){
  var l=listings.find(function(x){return x.id===id;});
  if(!l){alert('Не найдено');return;}
  
  var modalBody=document.getElementById('m-det-body');
  if(!modalBody)return;
  
  var em=l.type==='apartment'?'🏢':l.type==='house'?'🏡':l.type==='commercial'?'🏪':'';
  
  var photosArray = Array.isArray(l.photos) ? l.photos : [];
  var videosArray = Array.isArray(l.videos) ? l.videos : [];
  
  console.log('📸 Opening detail - Photos:',photosArray.length,'Videos:',videosArray.length);
  
  var photosHtml = '';
  if(photosArray.length > 0){
    photosHtml = '<div style="padding:0 17px 12px"><div style="font-size:12px;color:var(--t3);margin-bottom:8px;font-weight:600">Фото ('+photosArray.length+')</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">';
    photosArray.forEach(function(p,idx){
      photosHtml += '<div style="aspect-ratio:1;background:var(--bg3);border-radius:8px;overflow:hidden;cursor:pointer" onclick="viewPhoto(\''+p+'\')">';
      photosHtml += '<img src="'+p+'" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.style.display=\'none\'">';
      photosHtml += '</div>';
    });
    photosHtml += '</div></div>';
  }
  
  var videosHtml = '';
  if(videosArray.length > 0){
    videosHtml = '<div style="padding:0 17px 12px"><div style="font-size:12px;color:var(--t3);margin-bottom:8px;font-weight:600">Видео ('+videosArray.length+')</div>';
    videosArray.forEach(function(v){
      videosHtml += '<video controls style="width:100%;border-radius:8px;margin-bottom:8px"><source src="'+v+'"></video>';
    });
    videosHtml += '</div>';
  }
  
  modalBody.innerHTML='<div class="sh-handle"></div>'+
    '<div class="det-visual"><div class="det-em-bg">'+em+'</div></div>'+
    '<div class="det-price">'+fmtPrice(l.price)+' ₸</div>'+
    '<div style="padding:0 17px 12px"><div style="font-size:13px;color:var(--t3)">📍 '+l.city+', '+l.district+'</div><div style="font-size:16px;font-weight:700;margin:8px 0">'+l.rooms+'-комнатная · '+l.area+' м²</div></div>'+
    '<div style="padding:0 17px 16px;font-size:14px;line-height:1.7;color:var(--t2);white-space:pre-line">'+l.desc+'</div>'+
    photosHtml +
    videosHtml +
    '<div style="margin:0 17px 12px;padding:12px;background:var(--bg3);border-radius:12px"><div style="font-size:12px;color:var(--t3)">Риэлтор</div><div style="font-weight:600">'+l.realtorFull+'</div><div style="font-size:12px;color:var(--t3)">'+l.agency+'</div></div>'+
    '<div class="det-cta"><button class="det-btn det-call" onclick="callRealtor(\''+esc(l.phone)+'\')"><i class="fas fa-phone"></i> '+t('call')+'</button><button class="det-btn det-chat" onclick="closeM(\'m-det\');go(\'s-aira\')"><i class="fas fa-comment"></i> '+t('msg')+'</button></div>';
    
  openM('m-det');
}

function renderListings(){
  var el=document.getElementById('list-body');if(!el)return;
  if(listings.length===0){el.innerHTML='<div class="empty"><div class="empty-ico">🏠</div><div class="empty-t">Нет объектов</div></div>';return;}
  
  var filtered=listings;
  if(listTab==='exch')filtered=listings.filter(function(l){return l.exchange;});
  if(curFilter==='video')filtered=listings.filter(function(l){return l.hasVideo;});
  else if(curFilter!=='all')filtered=listings.filter(function(l){return l.type===curFilter;});
  
  if(filtered.length===0){el.innerHTML='<div class="empty"><div class="empty-ico">🔍</div><div class="empty-t">Не найдено</div></div>';return;}
  
  el.innerHTML=filtered.map(function(l){
    var ini=(l.realtor||'R').charAt(0);
    var em=l.type==='apartment'?'🏢':l.type==='house'?'🏡':l.type==='commercial'?'🏪':'';
    
    var photosArray = Array.isArray(l.photos) ? l.photos : [];
    var firstPhoto = photosArray.length > 0 ? photosArray[0] : null;
    
    var mediaHtml = '';
    if(firstPhoto){
      mediaHtml = '<div class="lcard-media" style="background:none;padding:0;position:relative"><img src="'+firstPhoto+'" style="width:100%;height:185px;object-fit:cover;border-radius:12px 12px 0 0">'+(l.badge?'<div class="lcard-badge" style="background:var(--orange);position:absolute;top:10px;right:10px">'+l.badge+'</div>':'')+'</div>';
    }else{
      mediaHtml = '<div class="lcard-media"><div class="lcard-em">'+em+'</div>'+(l.badge?'<div class="lcard-badge" style="background:var(--orange)">'+l.badge+'</div>':'')+'</div>';
    }
    
    return '<div class="lcard su" onclick="openDetail('+l.id+')">'+mediaHtml+'<div class="lcard-body"><div class="lcard-loc"><i class="fas fa-map-marker-alt"></i>'+l.city+', '+l.district+'</div><div class="lcard-price">'+fmtPrice(l.price)+' ₸</div><div class="lcard-sub">'+l.rooms+'-комнатная · '+l.area+' м²</div>'+(l.desc?'<div style="font-size:13px;color:var(--t2);line-height:1.5;margin:8px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+l.desc+'</div>':'')+'<div class="lcard-footer"><div class="lf-ava" style="background:var(--navy)">'+ini+'</div><div class="lf-name">'+esc(l.realtorFull)+' · '+esc(l.agency)+'</div></div><div class="lcard-cta"><button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\''+esc(l.phone)+'\')"><i class="fas fa-phone"></i> '+t('call')+'</button><button class="cta-btn cta-msg" onclick="event.stopPropagation();go(\'s-aira\')"><i class="fas fa-comment"></i> '+t('msg')+'</button></div></div></div>';
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

function updateNavVisibility(){
  var p=document.getElementById('nav-plus-wrap'),m=document.getElementById('n-more');
  if(curUser){if(p)p.style.display='block';if(m)m.style.display='flex';}
  else{if(p)p.style.display='none';if(m)m.style.display='none';}
}

function go(id){
  document.querySelectorAll('.scr').forEach(function(s){s.classList.remove('on');});
  var el=document.getElementById(id);if(el)el.classList.add('on');
  if(id==='s-prof')renderProf();
  if(id==='s-notif')renderNotifications();
  if(id==='s-aira')renderAiraChat();
  if(id==='s-add'){uploadedMedia={photos:[],videos:[]};renderAddListing();}
  if(id==='s-search')renderListings();
}

function nav(el){document.querySelectorAll('.nav-it').forEach(function(n){n.classList.remove('on');});if(el)el.classList.add('on');}
function showMore(){openM('m-more');}
function openM(id){var e=document.getElementById(id);if(e)e.classList.add('on');}
function closeM(id){var e=document.getElementById(id);if(e)e.classList.remove('on');}
function closeOvl(e,id){if(e.target.id===id)closeM(id);}
