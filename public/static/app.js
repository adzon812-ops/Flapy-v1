'use strict';

var SUPABASE_URL = 'https://qjmfudpqfyanigizwvze.supabase.co';
var SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbWZ1ZHBxZnlhbmlnaXp3dnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzUxODEsImV4cCI6MjA5MDYxMTE4MX0.XWBc3DAjOVMZ80VIlf4zZ1TgqtaxLDczdrPWwdpkkII';

var db = null;
if (typeof window !== 'undefined' && window.supabase) {
  try { db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); } catch(e) { console.warn('Supabase init failed'); }
}

var listings = [], curUser = null, curFilter = 'all', curLang = 'ru', listTab = 'obj',
    airaMessages = [], uploadedMedia = {photos:[], videos:[]};

window.addEventListener('load',function(){
  try{var s=localStorage.getItem('fp_user');if(s)curUser=JSON.parse(s);}catch(e){}
  try{var l=localStorage.getItem('fp_listings');if(l)listings=JSON.parse(l);}catch(e){}
  
  if(curUser){renderAuthSlot();updateAiraBadge();}
  updateNavVisibility();
  
  var ld=document.getElementById('loader');if(ld)ld.style.display='none';
  
  if(db) loadFromSupabase();
  else renderListings();
  
  // Приветственное сообщение в Aira
  if(airaMessages.length===0){
    addSystemMessage('Добро пожаловать в Aira — место, где риэлторы поддерживают друг друга 🤍');
    addSystemMessage('Здесь можно делиться объектами, идеями и просто говорить по душам');
  }
});

function loadFromSupabase() {
  if(!db) return;
  db.from('listings').select('*').order('created_at', {ascending: false}).then(function(res) {
    if(res.error || !res.data || res.data.length===0) {
      renderListings(); return;
    }
    listings = res.data.map(function(i){
      return {
        id:i.id, type:i.type, rooms:i.rooms, area:i.area, city:i.city, district:i.district,
        price:i.price, desc:i.description, exchange:i.exchange||false,
        floor_number:i.floor_number, total_floors:i.total_floors,
        building_name:i.building_name, ceiling_height:i.ceiling_height,
        realtor:i.realtor_name||'Риэлтор', realtorFull:i.realtor_name||'Риэлтор',
        agency:i.agency||'-', phone:i.phone||'+7 701 234 56 78',
        badge:i.badge||'Новое', hasVideo:i.has_video||false,
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
              price:l.price,desc:l.desc,exchange:l.exchange,floor_number:l.floor_number,
              total_floors:l.total_floors,building_name:l.building_name,ceiling_height:l.ceiling_height,
              realtor:l.realtor,realtorFull:l.realtorFull,agency:l.agency,phone:l.phone,
              badge:l.badge,hasVideo:false,liked:false,photos:[],videos:[],createdAt:l.createdAt};
    });
    localStorage.setItem('fp_listings', JSON.stringify(clean));
  } catch(e) { console.warn('LocalStorage error'); }
}

function saveToSupabase(listing) {
  if(!db || !curUser) return Promise.resolve();
  return db.from('listings').insert([{
    realtor_id: curUser.id, type:listing.type, rooms:listing.rooms, area:listing.area,
    city:listing.city, district:listing.district, price:listing.price,
    description:listing.desc, exchange:listing.exchange||false,
    floor_number:listing.floor_number, total_floors:listing.total_floors,
    building_name:listing.building_name, ceiling_height:listing.ceiling_height,
    phone:listing.phone, badge:listing.badge, photo_urls:listing.photos,
    has_video:listing.hasVideo
  }]);
}

function generateAIVariants(listing) {
  var data = {
    rooms: listing.rooms || '',
    area: listing.area || '',
    district: listing.district || '',
    price: listing.price ? (listing.price/1e6).toFixed(1) + ' млн ₸' : 'по договорённости',
    floor: listing.floor_number ? `${listing.floor_number}/${listing.total_floors || '?'} эт.` : '',
    building: listing.building_name || '',
    ceiling: listing.ceiling_height ? `потолки ${listing.ceiling_height} м` : '',
    exchange: listing.exchange ? '🔄 Возможен обмен' : ''
  };

  return [
    `✨ Уютная ${data.rooms}-комнатная квартира в сердце ${data.district}!\n\n🏠 ${data.building ? `ЖК «${data.building}», ` : ''}${data.area} м² чистой гармонии.${data.floor ? ` ${data.floor}.` : ''}${data.ceiling ? ` ${data.ceiling}.` : ''}\n\n🌿 Здесь хорошо жить: тихий двор, развитая инфраструктура, всё рядом.\n💰 ${data.price} ${data.exchange ? `\n${data.exchange}` : ''}\n\n💌 Приходите, покажем с душой.`,

    `🔥 ${data.rooms}-к. квартира, ${data.area} м² — ваш новый старт в Астане!\n\n📍 ${data.district} ${data.building ? `· ЖК «${data.building}»` : ''}\n🏗 ${data.floor || 'Этаж уточняется'} ${data.ceiling ? `· ${data.ceiling}` : ''}\n\n✅ Почему это выгодно:\n• Локация с потенциалом роста\n• Планировка без лишних метров\n\n💰 ${data.price} ${data.exchange ? `\n🔄 ${data.exchange}` : ''}\n\n📞 Звоните — обсудим детали!`,

    `Дом, где хочется жить 🤍\n\n${data.rooms} комнаты · ${data.area} м² · ${data.district}\n${data.building ? `ЖК «${data.building}»\n` : ''}${data.floor ? `${data.floor} · ` : ''}${data.ceiling || ''}\n\nЗдесь тихо, светло и по-домашнему уютно. Рядом всё, что важно.\n\n💰 ${data.price}\n${data.exchange ? `\n🔄 ${data.exchange}` : ''}\n\nПриходите на просмотр — почувствуете атмосферу.`
  ];
}

function submitListing(){
  var priceEl=document.getElementById('a-price'), descEl=document.getElementById('a-desc');
  var typeEl=document.getElementById('a-type'), roomsEl=document.getElementById('a-rooms');
  var areaEl=document.getElementById('a-area'), cityEl=document.getElementById('a-city');
  var districtEl=document.getElementById('a-district'), exchangeEl=document.getElementById('a-exchange');
  var floorEl=document.getElementById('a-floor'), totalFloorsEl=document.getElementById('a-total-floors');
  var buildingEl=document.getElementById('a-building'), ceilingEl=document.getElementById('a-ceiling');
  
  if(!priceEl||!descEl){alert('Ошибка формы');return;}
  
  var price=parseInt(priceEl.value.replace(/\s/g,''))||0;
  var desc=descEl.value.trim();
  var type=typeEl?typeEl.value:'apartment';
  var rooms=roomsEl?parseInt(roomsEl.value):3;
  var area=areaEl?parseInt(areaEl.value):85;
  var city=cityEl?cityEl.value:'Астана';
  var district=districtEl?districtEl.value:'Есиль';
  var exchange=exchangeEl?exchangeEl.checked:false;
  var floor_number=floorEl?parseInt(floorEl.value):null;
  var total_floors=totalFloorsEl?parseInt(totalFloorsEl.value):null;
  var building_name=buildingEl?buildingEl.value:'';
  var ceiling_height=ceilingEl?parseFloat(ceilingEl.value):null;
  
  if(!desc){alert('Расскажите об объекте с душой 🤍');return;}
  if(price<=0){alert('Укажите цену — чтобы найти именно вашего покупателя ✨');return;}
  
  var newListing={
    id:Date.now(), type:type, rooms:rooms, area:area, city:city, district:district,
    price:price, desc:desc, exchange:exchange,
    floor_number:floor_number, total_floors:total_floors,
    building_name:building_name, ceiling_height:ceiling_height,
    realtor:curUser?curUser.name:'Гость', realtorFull:curUser?curUser.name:'Гость',
    agency:curUser?(curUser.agency||'Моё агентство'):'-', phone:'+7 701 234 56 78',
    badge:'Новое', hasVideo:(uploadedMedia.videos||[]).length>0, liked:false,
    photos:(uploadedMedia.photos||[]), videos:(uploadedMedia.videos||[]),
    createdAt:new Date().toISOString()
  };
  
  listings.unshift(newListing);
  
  if(curUser && db) {
    saveToSupabase(newListing).then(function(){
      saveToLocalSafe(); renderListings(); toast('✅ Сохранено в облаке с любовью');
    }).catch(function(){
      saveToLocalSafe(); renderListings(); toast('⚠️ Сохранено локально');
    });
  } else {
    saveToLocalSafe(); renderListings();
    toast(curUser ? '✅ Опубликовано' : '⚠️ Войдите для сохранения в облако');
  }
  
  closeM('m-add');
  priceEl.value=''; descEl.value=''; uploadedMedia={photos:[],videos:[]};
  document.getElementById('ai-variants-wrap').style.display='none';
  go('s-search');
}

function genAI(){
  var listing = {
    rooms: document.getElementById('a-rooms')?.value,
    area: document.getElementById('a-area')?.value,
    district: document.getElementById('a-district')?.value,
    price: parseInt(document.getElementById('a-price')?.value?.replace(/\s/g,'')),
    floor_number: document.getElementById('a-floor')?.value,
    total_floors: document.getElementById('a-total-floors')?.value,
    building_name: document.getElementById('a-building')?.value,
    ceiling_height: document.getElementById('a-ceiling')?.value,
    exchange: document.getElementById('a-exchange')?.checked
  };
  
  var variants = generateAIVariants(listing);
  var wrap = document.getElementById('ai-variants-wrap');
  
  wrap.innerHTML = '<div style="font-size:12px;font-weight:600;color:var(--t3);margin-bottom:8px">✨ ИИ предложил варианты — выберите любимый:</div>' +
    '<div class="ai-variants">' +
    variants.map((v, i) => `
      <div class="ai-variant" onclick="selectAIVariant(${i}, this)">
        <div style="font-size:11px;font-weight:700;color:var(--orange);margin-bottom:4px">Вариант ${i+1}</div>
        <div style="font-size:12px;line-height:1.5;color:var(--t2);white-space:pre-line">${v}</div>
      </div>
    `).join('') +
    '</div>' +
    '<button class="btn-secondary" onclick="genAI()" style="margin-top:8px">🔄 Ещё варианты</button>';
  
  wrap.style.display = 'block';
  toast('✨ ИИ подготовил варианты с заботой');
}

function selectAIVariant(i, el){
  var variants = generateAIVariants({
    rooms: document.getElementById('a-rooms')?.value,
    area: document.getElementById('a-area')?.value,
    district: document.getElementById('a-district')?.value,
    price: parseInt(document.getElementById('a-price')?.value?.replace(/\s/g,'')),
    floor_number: document.getElementById('a-floor')?.value,
    total_floors: document.getElementById('a-total-floors')?.value,
    building_name: document.getElementById('a-building')?.value,
    ceiling_height: document.getElementById('a-ceiling')?.value,
    exchange: document.getElementById('a-exchange')?.checked
  });
  
  document.querySelectorAll('.ai-variant').forEach(function(v){v.classList.remove('selected');});
  el.classList.add('selected');
  
  var desc = document.getElementById('a-desc');
  if(desc && variants[i]) {
    desc.value = variants[i];
    setTimeout(function(){ toast('✅ Выбрано с любовью 🤍'); }, 300);
  }
}

function addSystemMessage(text) {
  var el = document.getElementById('aira-msgs');
  if(!el) return;
  var msg = document.createElement('div');
  msg.style.cssText = 'align-self:center;background:rgba(39,174,96,.08);border:1px solid rgba(39,174,96,.2);border-radius:12px;padding:8px 14px;font-size:12px;color:var(--t2);text-align:center;max-width:90%;margin-bottom:12px';
  msg.innerHTML = '💌 ' + text;
  el.appendChild(msg);
  el.scrollTop = el.scrollHeight;
}

function renderListings(){
  var el=document.getElementById('list-body');if(!el)return;
  var filtered=listTab==='exch'?listings.filter(function(l){return l.exchange;}):listings;
  if(curFilter!=='all')filtered=filtered.filter(function(l){return l.type===curFilter;});
  
  if(filtered.length===0){
    el.innerHTML='<div class="empty"><div class="empty-ico">🏠</div><div class="empty-t">Пока здесь тихо...</div><div class="empty-s">Но это значит, что скоро появится что-то особенное 🌱</div></div>';
    return;
  }
  
  el.innerHTML=filtered.map(function(l){
    var ini=(l.realtor||'R').charAt(0);
    var em=l.type==='apartment'?'🏢':l.type==='house'?'🏡':'🏪';
    var photo=l.photos&&l.photos.length>0?l.photos[0]:null;
    
    var media=photo?
      '<div class="lcard-media" style="background:none;padding:0;position:relative"><img src="'+photo+'" style="width:100%;height:185px;object-fit:cover">'+(l.badge?'<div class="lcard-badge">'+l.badge+'</div>':'')+'</div>':
      '<div class="lcard-media"><div class="lcard-em">'+em+'</div>'+(l.badge?'<div class="lcard-badge">'+l.badge+'</div>':'')+'</div>';
    
    return '<div class="lcard" onclick="openDetail('+l.id+')">'+media+'<div class="lcard-body"><div class="lcard-loc">📍 '+l.city+', '+l.district+'</div><div class="lcard-price">'+fmtPrice(l.price)+' ₸</div><div class="lcard-sub">'+l.rooms+'-комнатная · '+l.area+' м²</div>'+(l.desc?'<div style="font-size:13px;color:var(--t2);line-height:1.5;margin:8px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+l.desc+'</div>':'')+'<div class="lcard-footer"><div class="lf-ava">'+ini+'</div><div class="lf-name">'+esc(l.realtorFull)+' · '+esc(l.agency)+'</div></div><div class="lcard-cta"><button class="cta-btn cta-call" onclick="event.stopPropagation();callRealtor(\''+esc(l.phone)+'\')">📞 Позвонить</button><button class="cta-btn cta-msg" onclick="event.stopPropagation();go(\'s-aira\')">💬 Написать</button></div></div></div>';
  }).join('');
}

function openDetail(id){
  var l=listings.find(function(x){return x.id===id;});if(!l)return;
  var b=document.getElementById('m-det-body');if(!b)return;
  var em=l.type==='apartment'?'🏢':l.type==='house'?'🏡':'';
  
  var extraInfo = '';
  if(l.floor_number || l.total_floors) extraInfo += '<div>🏗 Этаж: '+(l.floor_number||'?')+(l.total_floors?' из '+l.total_floors:'')+'</div>';
  if(l.building_name) extraInfo += '<div>🏢 ЖК: '+l.building_name+'</div>';
  if(l.ceiling_height) extraInfo += '<div>📐 Потолки: '+l.ceiling_height+' м</div>';
  
  b.innerHTML='<div class="sh-handle"></div><div class="det-visual"><div class="det-em-bg">'+em+'</div></div><div class="det-price">'+fmtPrice(l.price)+' ₸</div><div style="padding:0 17px 12px"><div style="font-size:13px;color:var(--t3)">📍 '+l.city+', '+l.district+'</div><div style="font-size:16px;font-weight:700;margin:8px 0">'+l.rooms+'-комнатная · '+l.area+' м²</div>'+extraInfo+'</div><div style="padding:0 17px 16px;font-size:14px;line-height:1.7;color:var(--t2);white-space:pre-line">'+l.desc+'</div><div style="margin:0 17px 12px;padding:12px;background:var(--bg3);border-radius:12px"><div style="font-size:12px;color:var(--t3)">Риэлтор</div><div style="font-weight:600">'+l.realtorFull+'</div><div style="font-size:12px;color:var(--t3)">'+l.agency+'</div></div><div class="det-cta"><button class="det-btn det-call" onclick="callRealtor(\''+esc(l.phone)+'\')">📞 Позвонить с заботой</button><button class="det-btn det-chat" onclick="closeM(\'m-det\');go(\'s-aira\')">💬 Написать по душам</button></div>';
  openM('m-det');
}

function renderProf(){
  var el=document.getElementById('prof-body');if(!el)return;
  if(!curUser){el.innerHTML='<div style="text-align:center;padding:40px 20px"><div style="font-size:72px;margin-bottom:16px">👤</div><div style="font-size:15px;margin-bottom:12px;color:var(--t2)">Присоединяйтесь к семье Flapy — здесь вас ждут 🤍</div><button onclick="openM(\'m-auth\')" class="btn-primary">Войти</button></div>';return;}
  var ini=(curUser.name||'R').charAt(0).toUpperCase();
  var cnt=listings.filter(function(l){return l.realtor===curUser.name;}).length;
  el.innerHTML='<div class="prof-hero"><div class="ph-ava">'+ini+'</div><div class="ph-name">'+curUser.name+'</div><div class="ph-tag">🏠 Риэлтор</div><div style="margin-top:12px;font-size:14px;color:rgba(255,255,255,.9)">'+cnt+' объектов</div></div><div class="menu-item" onclick="go(\'s-aira\')"><div class="menu-ico" style="background:rgba(39,174,96,.1)">💬</div><div style="flex:1"><div class="menu-name">Aira чат</div><div class="menu-sub">Чат риэлторов</div></div></div><div class="menu-item" onclick="doLogout()"><div class="menu-ico" style="background:rgba(231,76,60,.1)">🚪</div><div><div class="menu-name" style="color:var(--red)">Выйти</div></div></div>';
}

function doLogin(){
  var e=document.getElementById('l-email')?.value.trim()||'';
  var p=document.getElementById('l-pass')?.value.trim()||'';
  
  // 🔐 Скрытый админ
  if(e === 'admin@flapy.kz' && p === 'FlapyLove2026!') {
    curUser = {id: 'admin_001', name: 'Админ', email: e, role: 'admin', agency: 'Flapy'};
    localStorage.setItem('fp_user', JSON.stringify(curUser));
    document.documentElement.setAttribute('data-admin', 'true');
    toast('🤫 Админ-режим активирован');
    renderAuthSlot(); renderListings();
    return;
  }
  
  if(!e){alert('Введите email');return;}
  curUser={name:e.split('@')[0],email:e,agency:'Моё агентство'};
  localStorage.setItem('fp_user',JSON.stringify(curUser));
  renderAuthSlot();closeM('m-auth');renderProf();updateAiraBadge();updateNavVisibility();
  toast('👋 Добро пожаловать в семью Flapy!');
}

function doReg(){
  var n=document.getElementById('r-name')?.value.trim()||'';
  var e=document.getElementById('r-email')?.value.trim()||'';
  if(!n||!e){alert('Заполните поля с любовью 🤍');return;}
  curUser={name:n,email:e,agency:document.getElementById('r-agency')?.value||'Самозанятый'};
  localStorage.setItem('fp_user',JSON.stringify(curUser));
  renderAuthSlot();closeM('m-auth');renderProf();updateAiraBadge();updateNavVisibility();
  toast('🎉 Добро пожаловать в семью!');
}

function doLogout(){
  curUser=null;localStorage.removeItem('fp_user');
  document.documentElement.removeAttribute('data-admin');
  renderAuthSlot();renderProf();updateAiraBadge();updateNavVisibility();
  toast('👋 До скорой встречи!');
}

function authTab(t){
  document.getElementById('af-in').style.display=t==='in'?'block':'none';
  document.getElementById('af-up').style.display=t==='up'?'block':'none';
  document.querySelectorAll('.tsw').forEach(function(el,i){el.classList.toggle('on',(t==='in'&&i===0)||(t==='up'&&i===1));});
}

function renderAuthSlot(){
  var s=document.getElementById('auth-slot');if(!s)return;
  s.innerHTML=curUser?'<div class="u-chip" onclick="go(\'s-prof\')"><div class="u-ava">'+(curUser.name||'U').charAt(0)+'</div><span class="u-nm">'+curUser.name.split(' ')[0]+'</span></div>':'<button class="login-btn" onclick="openM(\'m-auth\')">Войти</button>';
}

function updateAiraBadge(){
  var b=document.getElementById('aira-status-badge');
  if(b) b.textContent=curUser?'✓ '+curUser.name.split(' ')[0]:'🔒 Гость';
}

function renderAiraChat(){
  var el=document.getElementById('aira-msgs');if(!el)return;
  if(airaMessages.length===0){el.innerHTML='';return;}
  el.innerHTML=airaMessages.map(function(m){
    return '<div class="msg '+(m.mine?'me':'')+'"><div class="bubble">'+m.text+'</div><div class="m-ts">'+m.time+'</div></div>';
  }).join('');
  setTimeout(function(){el.scrollTop=el.scrollHeight;},50);
}

function sendAira(){
  var i=document.getElementById('aira-inp'),t=i?i.value.trim():'';
  if(!t)return;
  var d=new Date();
  airaMessages.push({id:Date.now(),text:t,time:d.getHours()+':'+d.getMinutes(),mine:true});
  i.value='';
  renderAiraChat();
}

function updateNavVisibility(){
  var p=document.getElementById('nav-plus-wrap'),m=document.querySelectorAll('.nav-it')[3];
  if(p)p.style.display=curUser?'block':'none';
  if(m)m.style.display=curUser?'flex':'none';
}

function go(id){
  document.querySelectorAll('.scr').forEach(function(s){s.classList.remove('on');});
  var e=document.getElementById(id);if(e)e.classList.add('on');
  if(id==='s-prof')renderProf();
  if(id==='s-aira')renderAiraChat();
  if(id==='s-search')renderListings();
}

function nav(el){document.querySelectorAll('.nav-it').forEach(function(n){n.classList.remove('on');});if(el)el.classList.add('on');}
function setListTab(t){listTab=t;document.querySelectorAll('.tab-item').forEach(function(el,i){el.classList.toggle('on',(t==='obj'&&i===0)||(t==='exch'&&i===1);});renderListings();}
function setFilt(el,f){document.querySelectorAll('.fchip').forEach(function(c){c.classList.remove('on');});if(el)el.classList.add('on');curFilter=f;renderListings();}
function openAddListing(){if(!curUser){toast('🔐 Войдите сначала');openM('m-auth');return;}openM('m-add');setTimeout(function(){document.getElementById('a-price').value='';document.getElementById('a-desc').value='';document.getElementById('ai-variants-wrap').style.display='none';},100);}
function needAuth(cb){if(!curUser){toast('🔐 Войдите');openM('m-auth');return false;}if(typeof cb==='function')cb();return true;}
function showMore(){openM('m-more');}
function openM(id){var e=document.getElementById(id);if(e)e.classList.add('on');}
function closeM(id){var e=document.getElementById(id);if(e)e.classList.remove('on');}
function closeOvl(e,id){if(e.target.id===id)closeM(id);}
function formatPriceInput(i){if(!i||!i.value)return;var v=i.value.replace(/\D/g,'');if(v){var n=parseInt(v);if(!isNaN(n))i.value=n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');}}
function esc(s){return(s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmtPrice(p){if(p==null||p==='')return'0';var n=Number(p);if(isNaN(n))return String(p);return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
function toast(m){var e=document.getElementById('toast');if(!e){e=document.createElement('div');e.id='toast';e.style.cssText='position:absolute;bottom:78px;left:50%;transform:translateX(-50%);background:rgba(30,45,90,.9);color:#fff;border-radius:10px;padding:9px 16px;font-size:12px;font-weight:600;z-index:600;opacity:0;transition:opacity .2s';document.body.appendChild(e);}e.textContent=m;e.style.opacity='1';setTimeout(function(){e.style.opacity='0';},2400);}
function callRealtor(p){toast('📞 '+p);}
