/* FLAPY app.js v19.0 — Gemini AI · Email Auth · No Aira for Guests */
'use strict';

var SUPABASE_URL = 'https://qjmfudpqfyanigizwvze.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbWZ1ZHBxZnlhbmlnaXp3dnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzUxODEsImV4cCI6MjA5MDYxMTE4MX0.XWBc3DAjOVMZ80VIlf4zZ1TgqtaxLDczdrPWwdpkkII';

var db = null;
var listings = [], curUser = null, curFilter = 'all', curLang = 'ru', listTab = 'obj';
var notifications = [], airaMessages = [], uploadedMedia = {photos:[], videos:[]};

window.addEventListener('load', function(){
  if(window.supabase) {
    db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase подключён');
  }
  
  try{var s=localStorage.getItem('fp_user');if(s)curUser=JSON.parse(s);}catch(e){}
  try{var n=localStorage.getItem('fp_notifications');if(n)notifications=JSON.parse(n);}catch(e){}
  
  curLang=localStorage.getItem('fp_lang')||'ru';
  if(curUser){renderAuthSlot();updateNavVisibility();}
  else{updateNavVisibility();}
  
  var ld=document.getElementById('loader');
  if(ld) setTimeout(function(){ld.style.display='none';},1200);
  
  if(db) loadFromSupabase();
  else renderListings();
  
  console.log('✅ Flapy v19.0 loaded');
});

function loadFromSupabase(){
  if(!db) return;
  db.from('listings').select('*').order('created_at',{ascending:false}).then(function(res){
    if(res.error || !res.data){renderListings();return;}
    listings = res.data.map(function(i){
      return {
        id:i.id, type:i.type||'apartment', rooms:i.rooms, area:i.area,
        floor:i.floor, totalFloors:i.total_floors, ceilingHeight:i.ceiling_height,
        complex:i.complex_name||'', city:i.city||'Астана', district:i.district||'Есиль',
        price:i.price, desc:i.description||'', realtor:i.realtor_name||'Риэлтор',
        realtorFull:i.realtor_name||'Риэлтор', agency:i.agency||'', phone:i.phone||'',
        badge:i.badge||'Новое', hasVideo:i.has_video||false, exchange:i.exchange||false,
        liked:false, photos:i.photo_urls||[], videos:[], createdAt:i.created_at
      };
    });
    saveListingsLocal();
    renderListings();
  });
}

function saveListingsLocal(){
  try{localStorage.setItem('fp_listings',JSON.stringify(listings));}catch(e){}
}

function saveToSupabase(listing){
  if(!db||!curUser) return Promise.resolve();
  return db.from('listings').insert([{
    realtor_id:curUser.id, realtor_name:curUser.name, agency:curUser.agency||'',
    phone:curUser.phone||'', type:listing.type, rooms:listing.rooms, area:listing.area,
    floor:listing.floor||null, total_floors:listing.totalFloors||null,
    ceiling_height:listing.ceilingHeight||null, complex_name:listing.complex||'',
    city:'Астана', district:listing.district, price:listing.price,
    description:listing.desc, exchange:listing.exchange||false, badge:'Новое',
    photo_urls:listing.photos||[], has_video:(listing.videos||[]).length>0
  }]);
}

function genAI(){
  var wrap=document.getElementById('ai-variants-wrap');
  if(!wrap) return;
  
  var data={
    type:document.getElementById('a-type')?.value||'apartment',
    rooms:document.getElementById('a-rooms')?.value||'3',
    area:document.getElementById('a-area')?.value||'85',
    district:document.getElementById('a-district')?.value||'Есиль',
    price:document.getElementById('a-price')?.value||'',
    floor:document.getElementById('a-floor')?.value,
    totalFloors:document.getElementById('a-totalfloors')?.value,
    ceilingHeight:document.getElementById('a-ceiling')?.value,
    complex:document.getElementById('a-complex')?.value||'',
    exchange:document.getElementById('a-exchange')?.checked||false
  };
  
  wrap.style.display='block';
  wrap.innerHTML='<div class="ai-loading">✨ AI пишет описание... подождите немного</div>';
  
  var btn=document.getElementById('ai-gen-btn');
  if(btn){btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Генерирую...';}
  
  fetch('/api/ai/describe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
  .then(function(r){return r.json();})
  .then(function(res){
    var descs=res.descriptions||[];
    if(descs.length===0) throw new Error('empty');
    renderAIVariants(descs);
  })
  .catch(function(e){
    console.warn('AI error:',e);
    wrap.innerHTML='<div style="padding:10px;background:var(--bg3);border-radius:8px;font-size:12px;color:var(--t2)">⚠️ AI временно недоступен. Напишите описание вручную — это тоже отлично!</div>';
  })
  .finally(function(){
    if(btn){btn.disabled=false;btn.innerHTML='<i class="fas fa-robot"></i> Сгенерировать 2 варианта описания AI';}
  });
}

function renderAIVariants(descs){
  var wrap=document.getElementById('ai-variants-wrap');
  var html='<div style="font-size:11px;font-weight:700;color:var(--orange);margin-bottom:8px">✨ ИИ предложил варианты — выберите любимый:</div>';
  descs.forEach(function(text,i){
    if(!text) return;
    html+='<div class="ai-variant" onclick="useAIVariant(\''+text.replace(/'/g,"\\'")+'\')"><div class="ai-variant-label">Вариант '+(i+1)+'</div><div style="font-size:12px;line-height:1.6;color:var(--t2);white-space:pre-wrap">'+esc(text)+'</div><button class="ai-choose-btn" onclick="event.stopPropagation()">✅ Использовать этот</button></div>';
  });
  html+='<div class="ai-actions"><button class="ai-act-btn" onclick="genAI()">🔄 Попробовать ещё</button><button class="ai-act-btn" onclick="document.getElementById(\'ai-variants-wrap\').style.display=\'none\'">✕ Скрыть</button></div>';
  wrap.innerHTML=html;
}

function useAIVariant(text){
  var desc=document.getElementById('a-desc');
  if(desc) desc.value=text;
  document.getElementById('ai-variants-wrap').style.display='none';
  toast('✅ Текст применён — можете дополнить его!');
}

function submitListing(){
  if(!curUser){toast('🔐 Войдите, чтобы публиковать объекты');openM('m-auth');return;}
  
  var priceRaw=(document.getElementById('a-price')?.value||'').replace(/\s/g,'');
  var price=parseInt(priceRaw)||0;
  var desc=(document.getElementById('a-desc')?.value||'').trim();
  var district=document.getElementById('a-district')?.value||'Есиль';
  var rooms=parseInt(document.getElementById('a-rooms')?.value)||3;
  var area=parseFloat(document.getElementById('a-area')?.value)||0;
  var complex=(document.getElementById('a-complex')?.value||'').trim();
  var floor=parseInt(document.getElementById('a-floor')?.value)||null;
  var totalFloors=parseInt(document.getElementById('a-totalfloors')?.value)||null;
  var ceilingHeight=document.getElementById('a-ceiling')?.value;
  var exchange=document.getElementById('a-exchange')?.checked||false;
  var type=document.getElementById('a-type')?.value||'apartment';
  
  if(!desc){toast('✏️ Добавьте описание — расскажите об объекте с душой 🤍');return;}
  if(price<=0){toast('💰 Укажите цену — чтобы найти именно вашего покупателя ✨');return;}
  
  var newListing={
    id:'tmp_'+Date.now(), type:type, rooms:rooms, area:area, floor:floor,
    totalFloors:totalFloors, ceilingHeight:ceilingHeight, complex:complex,
    city:'Астана', district:district, price:price, desc:desc, exchange:exchange,
    realtor:curUser.name, realtorFull:curUser.name, agency:curUser.agency||'',
    phone:curUser.phone||'', badge:'Новое', tags:exchange?['Обмен']:[],
    hasVideo:(uploadedMedia.videos||[]).length>0, liked:false,
    photos:uploadedMedia.photos?uploadedMedia.photos.slice():[],
    videos:uploadedMedia.videos?uploadedMedia.videos.slice():[],
    createdAt:new Date().toISOString()
  };
  
  listings.unshift(newListing);
  saveListingsLocal();
  renderListings();
  
  if(db&&curUser){
    saveToSupabase(newListing).then(function(){
      console.log('✅ Saved to Supabase');
    }).catch(function(e){
      console.warn('⚠️ Supabase save failed:',e);
    });
  }
  
  closeM('m-add');
  uploadedMedia={photos:[],videos:[]};
  updateMediaCounters();
  toast('🎉 Объект опубликован! Коллеги уже видят его.');
  go('s-search');
}

function uploadMedia(type){
  var input=document.createElement('input');
  input.type='file';
  input.accept=type==='photo'?'image/*':'video/*';
  input.multiple=true;
  input.onchange=function(e){
    var files=e.target.files;
    if(!files||files.length===0) return;
    toast('⏳ Загрузка '+files.length+' '+ (type==='photo'?'фото':'видео') +'...');
    Array.from(files).forEach(function(file){
      if(type==='video' && file.size > 20*1024*1024){
        toast('⚠️ Видео слишком большое, максимум 20MB'); return;
      }
      var reader=new FileReader();
      reader.onload=function(evt){
        if(type==='photo') uploadedMedia.photos.push(evt.target.result);
        else uploadedMedia.videos.push(evt.target.result);
        updateMediaCounters();
        toast('✅ '+ (type==='photo'?'Фото':'Видео') +' загружено!');
      };
      reader.readAsDataURL(file);
    });
  };
  input.click();
}

function updateMediaCounters(){
  var pc=document.getElementById('photo-count');
  var vc=document.getElementById('video-count');
  if(pc) pc.textContent=(uploadedMedia.photos||[]).length>0 ? (uploadedMedia.photos.length+' фото') : '';
  if(vc) vc.textContent=(uploadedMedia.videos||[]).length>0 ? (uploadedMedia.videos.length+' видео') : '';
}

function renderListings(){
  var el=document.getElementById('list-body');
  if(!el) return;
  
  var filtered=listTab==='exch'?listings.filter(function(l){return l.exchange;}):listings;
  if(curFilter!=='all') filtered=filtered.filter(function(l){return l.type===curFilter;});
  
  if(filtered.length===0){
    el.innerHTML='<div class="empty"><div class="empty-ico">🏠</div><div class="empty-t">Пока здесь тихо...</div><div class="empty-s">Но это значит, что скоро появится что-то особенное 🌱</div></div>';
    return;
  }
  
  el.innerHTML=filtered.map(function(l){
    var ini=(l.realtor||'R').charAt(0);
    var em=l.type==='apartment'?'🏢':l.type==='house'?'🏡':'';
    var photo=l.photos&&l.photos.length>0?l.photos[0]:null;
    var media=photo?
      '<div class="lcard-media" style="background:none;padding:0;position:relative"><img src="'+photo+'" style="width:100%;height:185px;object-fit:cover">'+(l.badge?'<div class="lcard-badge" style="background:var(--orange);position:absolute;top:10px;right:10px">'+l.badge+'</div>':'')+'</div>':
      '<div class="lcard-media"><div class="lcard-em">'+em+'</div>'+(l.badge?'<div class="lcard-badge" style="background:var(--orange)">'+l.badge+'</div>':'')+'</div>';
    
    return '<div class="lcard" onclick="openDetail(\''+l.id+'\')">'+media+'<div class="lcard-body"><div class="lcard-loc">📍 '+(l.complex||l.district)+', Астана</div><div class="lcard-price">'+fmtPrice(l.price)+' ₸</div><div class="lcard-sub">'+l.rooms+'-комн. · '+l.area+' м²</div>'+(l.desc?'<div style="font-size:12px;color:var(--t2);line-height:1.5;margin:6px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+esc(l.desc)+'</div>':'')+(l.exchange?'<div style="font-size:11px;color:var(--green);font-weight:600;margin-bottom:6px">🔄 Готов к обмену</div>':'')+'<div class="lcard-footer"><div class="lf-ava">'+ini+'</div><div class="lf-name">'+esc(l.realtorFull)+(l.agency?' · '+esc(l.agency):'')+'</div></div><div class="lcard-cta"><button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\''+esc(l.phone)+'\')">📞 Позвонить</button><button class="cta-btn cta-msg" onclick="event.stopPropagation();curUser?go(\'s-aira\'):openM(\'m-auth\')">💬 Написать</button></div></div></div>';
  }).join('');
}

function openDetail(id){
  var l=listings.find(function(x){return String(x.id)===String(id);});
  if(!l) return;
  var b=document.getElementById('m-det-body');
  if(!b) return;
  
  var em=l.type==='apartment'?'🏢':l.type==='house'?'🏡':'';
  var specs='';
  if(l.rooms) specs+='<div>'+l.rooms+'-комнатная</div>';
  if(l.area) specs+='<div>'+l.area+' м²</div>';
  if(l.floor&&l.totalFloors) specs+='<div>'+l.floor+'/'+l.totalFloors+' эт.</div>';
  if(l.ceilingHeight) specs+='<div>Потолки: '+l.ceilingHeight+' м</div>';
  
  b.innerHTML='<div class="sh-handle"></div><div class="det-visual"><div class="det-em-bg">'+em+'</div></div><div class="det-price">'+fmtPrice(l.price)+' ₸</div><div style="padding:0 17px 12px"><div style="font-size:13px;color:var(--t3)">'+specs+'</div></div><div style="padding:0 17px 16px;font-size:14px;line-height:1.7;color:var(--t2);white-space:pre-line">'+esc(l.desc)+'</div><div style="margin:0 17px 12px;padding:12px;background:var(--bg3);border-radius:12px"><div style="font-size:11px;color:var(--t3)">Риэлтор</div><div style="font-weight:700;font-size:13px;margin-top:3px">'+esc(l.realtorFull)+'</div>'+(l.agency?'<div style="font-size:12px;color:var(--t3)">'+esc(l.agency)+'</div>':'')+'</div><div class="det-cta"><button class="det-btn det-call" onclick="callRealtor(\''+esc(l.phone)+'\')">📞 Позвонить</button><button class="det-btn det-chat" onclick="closeM(\'m-det\');curUser?go(\'s-aira\'):openM(\'m-auth\')">💬 Написать</button></div>';
  openM('m-det');
}

function renderProf(){
  var el=document.getElementById('prof-body');
  if(!el) return;
  if(!curUser){
    el.innerHTML='<div style="text-align:center;padding:52px 20px"><div style="font-size:64px;margin-bottom:16px">🏠</div><div style="font-size:17px;font-weight:700;margin-bottom:8px">Войдите в Flapy</div><div style="font-size:13px;color:var(--t3);margin-bottom:24px">Добавляйте объекты, общайтесь с коллегами и закрывайте больше сделок</div><button onclick="openM(\'m-auth\')" class="btn-primary"><i class="fas fa-sign-in-alt"></i> Войти / Регистрация</button></div>';
    return;
  }
  var ini=(curUser.name||'R').charAt(0).toUpperCase();
  var myListings=listings.filter(function(l){return l.realtor===curUser.name;}).length;
  el.innerHTML='<div class="prof-hero"><div class="ph-ava">'+ini+'</div><div class="ph-name">'+esc(curUser.name)+'</div><div class="ph-tag">🏠 Риэлтор · '+(curUser.agency||'Самозанятый')+'</div><div class="ph-stats"><div class="ph-stat"><div class="ph-val">'+myListings+'</div><div class="ph-lbl">объектов</div></div></div></div><div class="menu-sec"><div class="menu-lbl">Мои разделы</div><div class="menu-item" onclick="needAuth(() => openM(\'m-add\'))"><div class="menu-ico" style="background:rgba(30,45,90,.1)">➕</div><div><div class="menu-name">Добавить объект</div><div class="menu-sub">Опубликовать новый</div></div></div><div class="menu-item" onclick="go(\'s-aira\');nav(document.getElementById(\'n-aira\'))"><div class="menu-ico" style="background:rgba(244,123,32,.1)">💬</div><div><div class="menu-name">Aira — чат</div><div class="menu-sub">Коллеги онлайн</div></div></div><div class="menu-item" onclick="go(\'s-notif\')"><div class="menu-ico" style="background:rgba(39,174,96,.1)">🔔</div><div style="flex:1"><div class="menu-name">Уведомления</div><div class="menu-sub" id="menu-notif-count">нет новых</div></div></div></div><div class="menu-sec"><div class="menu-lbl">Аккаунт</div><div class="menu-item" onclick="doLogout()"><div class="menu-ico" style="background:rgba(231,76,60,.1)">🚪</div><div><div class="menu-name" style="color:var(--red)">Выйти</div><div class="menu-sub">До встречи!</div></div></div></div>';
  updateNotificationsCount();
}

function doLogin(){
  var email=(document.getElementById('l-email')?.value||'').trim().toLowerCase();
  var pass=(document.getElementById('l-pass')?.value||'').trim();
  if(!email){toast('📧 Введите email');return;}
  if(!pass){toast('🔑 Введите пароль');return;}
  
  if(db){
    db.auth.signInWithPassword({email:email,password:pass}).then(function(res){
      if(res.error){toast('❌ '+res.error.message);return;}
      var user=res.data.user;
      return db.from('profiles').select('*').eq('id',user.id).single().then(function(pr){
        var profile=pr.data||{};
        curUser={
          id:user.id,
          name:profile.full_name||email.split('@')[0],
          email:email,
          phone:profile.phone||'',
          agency:profile.agency||''
        };
        onLoggedIn();
      });
    }).catch(function(e){
      toast('❌ Ошибка входа: '+e.message);
    });
  }else{
    curUser={id:'local_'+Date.now(),name:email.split('@')[0],email:email};
    onLoggedIn();
  }
}

function doReg(){
  var name=(document.getElementById('r-name')?.value||'').trim();
  var email=(document.getElementById('r-email')?.value||'').trim().toLowerCase();
  var phone=(document.getElementById('r-phone')?.value||'').trim();
  var agency=(document.getElementById('r-agency')?.value||'').trim();
  var pass=(document.getElementById('r-pass')?.value||'').trim();
  
  if(!name){toast('📝 Введите ваше имя');return;}
  if(!email){toast('📧 Введите email');return;}
  if(!pass || pass.length<6){toast('🔑 Пароль минимум 6 символов');return;}
  
  if(db){
    db.auth.signUp({email:email,password:pass,options:{data:{full_name:name}}}).then(function(res){
      if(res.error){toast('❌ '+res.error.message);return;}
      var user=res.data.user;
      return db.from('profiles').upsert({
        id:user.id,
        email:email,
        full_name:name,
        phone:phone,
        agency:agency
      }).then(function(){
        curUser={id:user.id,name:name,email:email,phone:phone,agency:agency};
        onLoggedIn();
        toast('🎉 Добро пожаловать в Flapy, '+name+'!');
      });
    }).catch(function(e){
      toast('❌ '+e.message);
    });
  }else{
    curUser={id:'local_'+Date.now(),name:name,email:email,phone:phone,agency:agency};
    onLoggedIn();
    toast('🎉 Добро пожаловать, '+name+'!');
  }
}

function onLoggedIn(){
  localStorage.setItem('fp_user',JSON.stringify(curUser));
  renderAuthSlot();
  closeM('m-auth');
  renderProf();
  updateNavVisibility();
  updateAiraBadge();
  toast('👋 С возвращением, '+curUser.name.split(' ')[0]+'!');
}

function doLogout(){
  if(db) db.auth.signOut();
  curUser=null;
  localStorage.removeItem('fp_user');
  renderAuthSlot();
  renderProf();
  updateNavVisibility();
  updateAiraBadge();
  toast('👋 До встречи!');
}

function renderAuthSlot(){
  var s=document.getElementById('auth-slot');
  if(!s) return;
  if(curUser){
    var ini=(curUser.name||'R').charAt(0).toUpperCase();
    s.innerHTML='<div class="u-chip" onclick="go(\'s-prof\');nav(document.getElementById(\'n-prof\'))"><div class="u-ava">'+ini+'</div><span class="u-nm">'+curUser.name.split(' ')[0]+'</span></div>';
  }else{
    s.innerHTML='<button class="login-btn" onclick="openM(\'m-auth\')">Войти</button>';
  }
}

function authTab(tab){
  var i=document.getElementById('at-in'),u=document.getElementById('at-up');
  var fi=document.getElementById('af-in'),fu=document.getElementById('af-up');
  if(i) i.classList.toggle('on',tab==='in');
  if(u) u.classList.toggle('on',tab==='up');
  if(fi) fi.style.display=tab==='in'?'block':'none';
  if(fu) fu.style.display=tab==='up'?'block':'none';
  var w=document.getElementById('auth-welcome');
  if(w) w.textContent=tab==='in'?'Рады вас видеть! 🏠':'Добро пожаловать в Flapy! ✨';
}

function updateAiraBadge(){
  var b=document.getElementById('aira-badge');
  if(!b) return;
  if(curUser){
    b.textContent='✓ '+curUser.name.split(' ')[0];
    b.style.cssText='background:rgba(255,255,255,.2);border-radius:8px;padding:4px 10px;font-size:11px;color:#fff;font-weight:600';
  }else{
    b.textContent='🔒 Гость';
    b.style.cssText='background:rgba(255,255,255,.1);border-radius:8px;padding:4px 10px;font-size:11px;color:rgba(255,255,255,.7);font-weight:600';
  }
}

function renderAiraChat(){
  var el=document.getElementById('aira-msgs');
  if(!el) return;
  if(airaMessages.length===0){
    el.innerHTML='<div class="msg-wrap other"><div class="msg-author">Flapy™</div><div class="bubble">Привет! Здесь риэлторы Астаны делятся объектами, договариваются о совместных сделках и помогают друг другу 🤝</div><div class="m-ts">сейчас</div></div>';
    return;
  }
  el.innerHTML=airaMessages.map(function(m){
    return '<div class="msg-wrap '+(m.mine?'me':'other')+'">'+(!m.mine?'<div class="msg-author">'+esc(m.author)+'</div>':'')+'<div class="bubble">'+esc(m.text)+'</div><div class="m-ts">'+(m.time||'')+'</div></div>';
  }).join('');
  setTimeout(function(){el.scrollTop=el.scrollHeight;},50);
}

function sendAira(){
  if(!curUser){toast('🔐 Войдите, чтобы писать коллегам');openM('m-auth');return;}
  var inp=document.getElementById('aira-inp');
  var txt=inp?inp.value.trim():'';
  if(!txt) return;
  
  var now=new Date();
  var tm=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  
  airaMessages.push({id:Date.now(),author:curUser.name,text:txt,time:tm,mine:true});
  inp.value='';
  inp.style.height='auto';
  renderAiraChat();
  
  if(db){
    db.from('messages').insert([{
      user_id:curUser.id,
      user_name:curUser.name,
      content:txt,
      type:'text'
    }]).then(function(res){
      if(res.error) console.warn('⚠️ Message save error:',res.error);
    });
  }
}

function updateNavVisibility(){
  var airaNav=document.getElementById('n-aira');
  var notifNav=document.getElementById('n-notif');
  var addWrap=document.getElementById('nav-plus-wrap');
  
  if(airaNav) airaNav.style.display=curUser?'flex':'none';
  if(notifNav) notifNav.style.display=curUser?'flex':'none';
  if(addWrap) addWrap.style.display=curUser?'block':'none';
}

function setListTab(tab){
  listTab=tab;
  var t1=document.getElementById('tab-obj'),t2=document.getElementById('tab-exch');
  if(t1) t1.classList.toggle('on',tab==='obj');
  if(t2) t2.classList.toggle('on',tab==='exch');
  renderListings();
}

function setFilt(el,f){
  document.querySelectorAll('.fchip').forEach(function(c){c.classList.remove('on');});
  if(el) el.classList.add('on');
  curFilter=f;
  renderListings();
}

function needAuth(cb){
  if(!curUser){toast('🔐 Войдите в аккаунт');openM('m-auth');return false;}
  if(typeof cb==='function') cb();
  return true;
}

function go(id){
  if(id==='s-aira' && !curUser){
    toast('🔐 Войдите, чтобы общаться с коллегами');
    openM('m-auth');
    return;
  }
  if(id==='s-notif' && !curUser){
    toast('🔐 Войдите, чтобы видеть уведомления');
    openM('m-auth');
    return;
  }
  
  document.querySelectorAll('.scr').forEach(function(s){s.classList.remove('on');});
  var el=document.getElementById(id);
  if(el) el.classList.add('on');
  if(id==='s-prof') renderProf();
  if(id==='s-notif') renderNotifications();
  if(id==='s-aira'){renderAiraChat();}
  if(id==='s-search') renderListings();
}

function nav(el){
  document.querySelectorAll('.nav-it').forEach(function(n){n.classList.remove('on');});
  if(el) el.classList.add('on');
}

function openM(id){var e=document.getElementById(id);if(e)e.classList.add('on');}
function closeM(id){var e=document.getElementById(id);if(e)e.classList.remove('on');}
function closeOvl(e,id){if(e.target.id===id)closeM(id);}

function formatPriceInput(inp){
  if(!inp) return;
  var v=inp.value.replace(/\D/g,'');
  if(v) inp.value=parseInt(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  else inp.value='';
}

function esc(s){
  return(s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtPrice(p){
  if(!p) return '0';
  return Number(p).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');
}

function callRealtor(phone){
  if(phone && phone!=='') window.location.href='tel:'+phone.replace(/\s/g,'');
  else toast('📞 Телефон не указан');
}

var toastTimer=null;
function toast(msg,ms){
  var el=document.getElementById('toast');
  if(!el) return;
  if(toastTimer) clearTimeout(toastTimer);
  el.textContent=msg;
  el.classList.add('show');
  toastTimer=setTimeout(function(){el.classList.remove('show');},ms||2800);
}

function toggleTheme(){
  var cur=document.documentElement.getAttribute('data-theme');
  var next=cur==='dark'?'light':'dark';
  applyTheme(next);
  localStorage.setItem('fp_theme',next);
}

function applyTheme(th){
  document.documentElement.setAttribute('data-theme',th);
  var btn=document.getElementById('btn-theme');
  if(btn) btn.innerHTML=th==='dark'?'<i class="fas fa-sun"></i>':'<i class="fas fa-moon"></i>';
}

function setLang(lang){
  curLang=lang;
  localStorage.setItem('fp_lang',lang);
  applyLangUI();
}

function applyLangUI(){
  var ru=document.getElementById('lo-ru'),kz=document.getElementById('lo-kz');
  if(ru) ru.classList.toggle('on',curLang==='ru');
  if(kz) kz.classList.toggle('on',curLang==='kz');
}

function addNotification(data){
  var now=new Date();
  var tm=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  notifications.unshift({id:Date.now(),from:data.from,text:data.text,time:tm,read:false});
  if(notifications.length>30) notifications=notifications.slice(0,30);
  updateNotificationsCount();
  saveNotifications();
}

function saveNotifications(){
  try{localStorage.setItem('fp_notifications',JSON.stringify(notifications));}catch(e){}
}

function updateNotificationsCount(){
  var unread=notifications.filter(function(n){return !n.read;}).length;
  var badge=document.getElementById('notif-badge');
  if(badge){
    badge.textContent=unread>9?'9+':(unread||'');
    badge.style.display=unread>0?'inline-block':'none';
  }
  var mc=document.getElementById('menu-notif-count');
  if(mc) mc.textContent=unread>0?(unread+' новых'):'нет новых';
}

function renderNotifications(){
  var el=document.getElementById('notif-body');
  if(!el) return;
  if(notifications.length===0){
    el.innerHTML='<div class="empty"><div class="empty-ico">🔔</div><div class="empty-t">Всё спокойно</div><div class="empty-s">Уведомления появятся здесь</div></div>';
    return;
  }
  el.innerHTML='<div style="font-size:18px;font-weight:800;padding:14px 0 10px">Уведомления</div>'+
    notifications.map(function(n){
      return '<div class="notif-item" style="'+(n.read?'':'border-left:3px solid var(--orange)')+'" onclick="markRead('+n.id+')"><span class="notif-ico">💬</span><div><div class="notif-txt"><b>'+esc(n.from)+'</b> '+esc(n.text)+'</div><div class="notif-time">'+n.time+'</div></div></div>';
    }).join('');
}

function markRead(id){
  var n=notifications.find(function(x){return x.id===id;});
  if(n){n.read=true;updateNotificationsCount();renderNotifications();saveNotifications();}
}
