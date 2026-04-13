/* FLAPY app.js v7.0 — MINIMAL WORKING VERSION */
'use strict';

/* STATE */
var listings = [], curUser = null, curLang = 'ru', notifications = [
  {id:1,from:'Aira',text:'Данияр М. ответил на объект',time:'10 мин',read:false}
], airaMessages = [
  {id:1,author:'Айгерим К.',text:'3к Есиль — ищу покупателя 🤝',time:'10:30',mine:false},
  {id:2,author:'Данияр М.',text:'Есть покупатель!',time:'10:35',mine:false,highlight:true}
];

/* TRANSLATIONS */
var T = {
  ru: {call:'Позвонить',msg:'Написать',profile:'Профиль',logout:'Выйти'},
  kz: {call:'Қоңырау',msg:'Жазу',profile:'Профиль',logout:'Шығу'}
};
function t(k){return (T[curLang]&&T[curLang][k])||(T.ru[k]||k);}

/* BOOT */
window.addEventListener('load',function(){
  try{var s=localStorage.getItem('fp_user');if(s)curUser=JSON.parse(s);}catch(e){}
  curLang=localStorage.getItem('fp_lang')||'ru';
  if(curUser)renderAuthSlot();
  updateNavVisibility();
  updateNotificationsCount();
  
  // Hide loader FAST
  var ld=document.getElementById('loader');
  if(ld){ld.style.display='none';}
  
  // Load data
  listings=getFallbackListings();
  renderListings();
  renderAiraChat();
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
  if(id==='s-notif'){renderNotifications();updateNotificationsCount();}
  if(id==='s-aira')renderAiraChat();
}
function openM(id){var e=document.getElementById(id);if(e)e.classList.add('on');}
function closeM(id){var e=document.getElementById(id);if(e)e.classList.remove('on');}

/* DATA */
function getFallbackListings(){
  return [
    {id:1,type:'apartment',rooms:3,area:85,district:'Есильский',city:'Астана',price:78500000,hasVideo:true,videoId:'ScMzIvxBSi4',realtor:'Айгерим К.',realtorFull:'Айгерим Касымова',rating:4.9,agency:'Century 21',badge:'Новое',desc:'Просторная 3-комнатная с панорамным видом. Ремонт евро-класса.',phone:'+7 701 234 56 78'},
    {id:2,type:'apartment',rooms:3,area:82,district:'Алматинский',city:'Астана',price:62000000,hasVideo:false,realtor:'Данияр М.',realtorFull:'Данияр Мусин',rating:4.7,agency:'Etagi',badge:'Горящее',desc:'Новый ЖК, полная отделка, никто не жил.',phone:'+7 702 345 67 89'}
  ];
}

/* NOTIFICATIONS - WORKING COUNTER */
function updateNotificationsCount(){
  var unread=notifications.filter(n=>!n.read).length;
  var badge=document.getElementById('notif-badge');
  if(badge){badge.textContent=unread>0?(unread>9?'9+':unread):'';badge.style.display=unread>0?'inline-block':'none';}
  var menuBadge=document.getElementById('menu-notif-badge');
  if(menuBadge)menuBadge.textContent=unread>0?unread+' новых':'Нет новых';
}
function renderNotifications(){
  var el=document.getElementById('notif-body');if(!el)return;
  if(!notifications.length){el.innerHTML='<div style="padding:20px;text-align:center">Нет уведомлений</div>';return;}
  el.innerHTML=notifications.map(n=>'<div style="padding:14px 20px;border-bottom:1px solid #eee;cursor:pointer'+(n.read?'':';background:#f8f9fa')+'" onclick="markNotifRead('+n.id+')"><div style="font-weight:600;color:#1E2D5A">'+n.from+'</div><div style="margin:6px 0">'+n.text+'</div><div style="font-size:11px;color:#999">'+n.time+'</div></div>').join('');
}
function markNotifRead(id){
  var n=notifications.find(x=>x.id===id);if(n&&!n.read){n.read=true;updateNotificationsCount();renderNotifications();}
}

/* AIRA CHAT - WHATSAPP STYLE */
function renderAiraChat(){
  var el=document.getElementById('aira-chat-body');if(!el)return;
  el.innerHTML='<div style="display:flex;flex-direction:column;height:calc(100vh - 200px);background:#e5ddd5;border-radius:12px;overflow:hidden">'+
    '<div style="flex:1;overflow-y:auto;padding:16px" id="aira-msgs">'+
      airaMessages.map(m=>{
        var bg=m.mine?'#dcf8c6':'#fff',align=m.mine?'flex-end':'flex-start',border=m.highlight?'border-left:4px solid #F47B20':'';
        return '<div style="display:flex;justify-content:'+align+';margin-bottom:12px">'+
          '<div style="max-width:70%;background:'+bg+';border-radius:8px;padding:10px 14px;box-shadow:0 1px 3px rgba(0,0,0,.1);'+border+'">'+
            (!m.mine?'<div style="font-weight:700;color:#075e54;font-size:13px;margin-bottom:4px">'+m.author+'</div>':'')+
            '<div style="color:#111;font-size:14.5px;line-height:1.45;white-space:pre-line">'+m.text+'</div>'+
            '<div style="text-align:right;font-size:11px;color:#999;margin-top:6px">'+m.time+'</div>'+
          '</div></div>';
      }).join('')+
    '</div>'+
    '<div style="background:#f0f0f0;padding:10px 16px;display:flex;gap:10px;align-items:center;border-top:1px solid #ddd">'+
      '<input type="text" id="aira-inp" placeholder="Сообщение..." style="flex:1;padding:12px 18px;border:none;border-radius:24px;font-size:15px;outline:none" onkeypress="if(event.key===\'Enter\')sendAira()">'+
      '<button onclick="sendAira()" style="width:48px;height:48px;border-radius:50%;background:#075e54;border:none;color:white;cursor:pointer;font-size:18px">📤</button>'+
    '</div></div>';
  setTimeout(()=>{var m=document.getElementById('aira-msgs');if(m)m.scrollTop=m.scrollHeight;},50);
}
function sendAira(){
  var inp=document.getElementById('aira-inp'),txt=inp?inp.value.trim():'';if(!txt)return;
  var now=new Date(),time=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');
  airaMessages.push({id:airaMessages.length+1,author:curUser?curUser.name:'Гость',text:txt,time:time,mine:true});
  inp.value='';renderAiraChat();
}

/* PROFILE - NO REALTORS, NO CALENDAR */
function renderProf(){
  var el=document.getElementById('prof-body');if(!el)return;
  if(!curUser){el.innerHTML='<div style="text-align:center;padding:40px"><div style="font-size:64px;margin-bottom:16px">👤</div><button onclick="openM(\'m-auth\')" style="padding:14px 32px;background:#1E2D5A;color:white;border:none;border-radius:12px;font-size:16px">Войти</button></div>';return;}
  var ini=(curUser.name||'R').charAt(0).toUpperCase();
  el.innerHTML='<div style="text-align:center;padding:40px 24px;background:linear-gradient(135deg,#1E2D5A,#4A6FA5);color:white;border-radius:16px;margin-bottom:24px"><div style="width:88px;height:88px;border-radius:50%;background:rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:36px">'+ini+'</div><div style="font-size:22px;font-weight:700">'+curUser.name+'</div></div>'+
    '<div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08)">'+
      '<div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;cursor:pointer" onclick="go(\'s-notif\')"><b>🔔 Уведомления</b><div id="menu-notif-badge" style="font-size:12px;color:#999;margin-top:4px">3 новых</div></div>'+
      '<div style="padding:16px 20px;border-bottom:1px solid #f0f0f0;cursor:pointer" onclick="go(\'s-aira\')">💬 Aira чат</div>'+
      '<div style="padding:16px 20px;color:#E74C3C;cursor:pointer" onclick="doLogout()">🚪 Выйти</div>'+
    '</div>';
}

/* AUTH */
function renderAuthSlot(){
  var slot=document.getElementById('auth-slot');if(!slot)return;
  if(curUser){
    var ini=(curUser.name||'R').charAt(0).toUpperCase();
    slot.innerHTML='<div style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 14px;background:rgba(30,45,90,.08);border-radius:20px" onclick="go(\'s-prof\')"><div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1E2D5A,#4A6FA5);display:flex;align-items:center;justify-content:center;color:white;font-size:16px">'+ini+'</div><span style="font-weight:600;color:#1E2D5A">'+curUser.name.split(' ')[0]+'</span></div>';
  }else{
    slot.innerHTML='<button onclick="openM(\'m-auth\')" style="padding:10px 20px;background:#1E2D5A;color:white;border:none;border-radius:10px;font-weight:600">Войти</button>';
  }
}
function doLogin(){
  var email=document.getElementById('l-email')?.value.trim();
  if(!email){toast('⚠️ Введите email');return;}
  curUser={name:email.split('@')[0],email:email};
  localStorage.setItem('fp_user',JSON.stringify(curUser));
  renderAuthSlot();closeM('m-auth');renderProf();updateNavVisibility();
  toast('👋 Добро пожаловать!');
}
function doReg(){
  var name=document.getElementById('r-name')?.value.trim(),email=document.getElementById('r-email')?.value.trim();
  if(!name||!email){toast('⚠️ Заполните все поля');return;}
  curUser={name:name,email:email};
  localStorage.setItem('fp_user',JSON.stringify(curUser));
  renderAuthSlot();closeM('m-auth');renderProf();updateNavVisibility();
  toast('🎉 Добро пожаловать!');
}
function doLogout(){curUser=null;localStorage.removeItem('fp_user');renderAuthSlot();renderProf();updateNavVisibility();toast('👋 До встречи!');}

/* UTILS */
function fmtPrice(p){if(p==null)return'0';var n=Number(p);return isNaN(n)?String(p):n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
function toast(msg,ms){
  var el=document.getElementById('toast');
  if(!el){el=document.createElement('div');el.id='toast';el.style.cssText='position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.85);color:white;padding:14px 28px;border-radius:12px;z-index:10000;opacity:0;transition:opacity .3s';document.body.appendChild(el);}
  el.textContent=msg;el.style.opacity='1';
  setTimeout(()=>el.style.opacity='0',ms||2400);
}
function callRealtor(phone){toast('📞 '+phone);}
function openDetail(id){var l=listings.find(x=>x.id===id);if(l)toast(l.realtorFull+' · '+fmtPrice(l.price)+' ₸');}
function renderListings(){
  var el=document.getElementById('list-body');if(!el)return;
  if(!listings.length){el.innerHTML='<div style="padding:40px;text-align:center">Загрузка...</div>';return;}
  el.innerHTML=listings.map(l=>'<div class="lcard su" onclick="openDetail('+l.id+')"><div style="height:180px;background:linear-gradient(135deg,#1a1a40,#0d1b3e);display:flex;align-items:center;justify-content:center;font-size:48px;color:white;border-radius:12px 12px 0 0">🏢</div><div style="padding:16px"><div style="font-size:13px;color:#666">'+l.city+', '+l.district+'</div><div style="font-size:20px;font-weight:700;color:#1E2D5A;margin:8px 0">'+fmtPrice(l.price)+' ₸</div><div style="color:#555">'+l.rooms+'к · '+l.area+'м²</div><div style="margin:12px 0;font-size:14px;color:#666">'+l.desc+'</div><div style="display:flex;align-items:center;gap:10px"><div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#1E2D5A,#4A6FA5);display:flex;align-items:center;justify-content:center;color:white;font-weight:700">'+(l.realtor||'R').charAt(0)+'</div><div><div style="font-weight:600">'+l.realtorFull+'</div><div style="font-size:12px;color:#999">'+l.agency+'</div></div></div><div style="display:flex;gap:10px;margin-top:16px"><button onclick="event.stopPropagation();callRealtor(\''+l.phone+'\')" style="flex:1;padding:12px;background:#1E2D5A;color:white;border:none;border-radius:10px;font-weight:600">📞 '+t('call')+'</button><button onclick="event.stopPropagation();go(\'s-aira\')" style="flex:1;padding:12px;background:#f0f0f0;color:#333;border:none;border-radius:10px;font-weight:600">💬 '+t('msg')+'</button></div></div></div>').join('');
}

/* PLACEHOLDER FUNCTIONS - NO ERRORS */
function renderRealtors(){}
function openAddListing(){toast('➕ Добавить объект');}
function renderFeed(){}
function renderCal(){}
function fetchListings(){}
function fetchCalendar(){}
function updateAiraBadge(){}
function applyTheme(th){document.documentElement.setAttribute('data-theme',th);}
function setLang(lang){curLang=lang;localStorage.setItem('fp_lang',lang);toast(lang==='kz'?'🇰 Қазақ тілі':'🇷🇺 Русский');}
function needAuth(cb){if(!curUser){toast('🔐 Войдите');openM('m-auth');return false;}if(typeof cb==='function')cb();return true;}
