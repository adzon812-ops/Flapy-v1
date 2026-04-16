/* FLAPY v18.0 — С ЛЮБОВЬЮ И ЗАЩИТОЙ 💙 */
'use strict';

const SUPABASE_URL = 'https://qjmfudpqfyanigizwvze.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbWZ1ZHBxZnlhbmlnaXp3dnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzUxODEsImV4cCI6MjA5MDYxMTE4MX0.XWBc3DAjOVMZ80VIlf4zZ1TgqtaxLDczdrPWwdpkkII';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

var listings = [], curUser = null, curLang = 'ru', listTab = 'obj',
notifications = [], airaMessages = [], uploadedMedia = {photos:[]},
favorites = JSON.parse(localStorage.getItem('fp_favs') || '[]');

const WARM_WORDS = {
  welcome: 'Добро пожаловать домой 🏡',
  subtitle: 'Здесь вас ждут с любовью 💙',
  login: 'Войти',
  register: 'Присоединиться',
  logout: 'До встречи',
  call: 'Позвонить',
  whatsapp: 'Написать',
  noObjects: 'Пока здесь тихо... Но мы уже готовим что-то особенное 🌿',
  beFirst: 'Будьте первым, кто создаст историю',
  gentle: 'Не спешите. Изучайте. Мы рядом 💙'
};

/* ════════════════════════════════════════════════════
   🔐 ADMIN — Ctrl+Shift+A
═══════════════════════════════════════════════════ */
document.addEventListener('keydown', function(e){
  if(e.ctrlKey && e.shiftKey && e.key === 'A'){
    e.preventDefault();
    activateAdminMode();
  }
});

async function activateAdminMode(){
  const password = prompt('🔐 Админ-доступ:');
  if(password === 'FlapySuperAdmin2026'){
    curUser = {id:'admin-001',email:'admin@flapy.internal',role:'superadmin',user_metadata:{full_name:'Администратор'}};
    localStorage.setItem('fp_admin_session','true');
    alert('💙 Админ-режим активирован');
    await updateAuthUI();
    await loadAdminStats();
  }else{alert('Неверный ключ');}
}

async function loadAdminStats(){
  if(!curUser || curUser.role!=='superadmin') return;
  const {count:totalListings}=await db.from('listings').select('*',{count:'exact',head:true});
  const {count:totalRealtors}=await db.from('realtors').select('*',{count:'exact',head:true});
  showAdminPanel(totalListings,totalRealtors);
}

function showAdminPanel(listingsCount,realtorsCount){
  const existing=document.getElementById('admin-panel');
  if(existing)existing.remove();
  const panel=document.createElement('div');
  panel.id='admin-panel';
  panel.style.cssText='position:fixed;top:70px;right:10px;background:linear-gradient(135deg,#9B59B6,#8E44AD);color:white;padding:16px;border-radius:12px;z-index:1000;min-width:250px;';
  panel.innerHTML='<div style="font-size:14px;font-weight:700;margin-bottom:12px">👑 Панель<button onclick="closeAdminPanel()" style="margin-left:auto;background:none;border:none;color:white;cursor:pointer;font-size:18px">×</button></div><div style="background:rgba(255,255,255,0.1);padding:12px;border-radius:8px;margin-bottom:12px"><div style="font-size:13px;margin-bottom:6px">📊 Объектов: <b>'+listingsCount+'</b></div><div style="font-size:13px">👤 Риэлторов: <b>'+realtorsCount+'</b></div></div><button onclick="adminViewRealtors()" style="width:100%;padding:10px;background:rgba(255,255,255,0.2);color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;margin-bottom:6px">👥 Риэлторы</button><button onclick="adminDeleteAll()" style="width:100%;padding:10px;background:rgba(231,76,60,0.9);color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px">⚠️ Удалить всё</button>';
  document.body.appendChild(panel);
}

function closeAdminPanel(){const p=document.getElementById('admin-panel');if(p)p.remove();}
async function adminViewRealtors(){const{data,error}=await db.from('realtors').select('*');if(error){alert(error.message);return;}let r='👥 РИЭЛТОРЫ:\n\n';data.forEach((x,i)=>{r+=(i+1)+'. '+(x.name||'Без имени')+'\n   '+x.email+'\n\n';});alert(r);}
async function adminDeleteAll(){if(!confirm('Удалить все объекты?'))return;const{error}=await db.from('listings').delete().neq('id','00000000-0000-0000-0000-000000000000');if(error){alert(error.message);}else{alert('Удалено');location.reload();}}

/* ════════════════════════════════════════════════════
   🚀 INIT
═══════════════════════════════════════════════════ */
window.addEventListener('load',async function(){
  if(localStorage.getItem('fp_admin_session')==='true'){
    curUser={id:'admin-001',email:'admin@flapy.internal',role:'superadmin',user_metadata:{full_name:'Администратор'}};
    await updateAuthUI();
  }else{
    const{{session}}=await db.auth.getSession();
    if(session){curUser=session.user;await updateAuthUI();}
  }
  
  var ld=document.getElementById('loader');
  if(ld){setTimeout(()=>{ld.style.opacity='0';setTimeout(()=>ld.style.display='none',300);},1500);}
  
  await loadListings();
  renderAiraChat();
  console.log('💙 Flapy загружен с любовью');
});

async function loadListings(){
  if(!db)return;
  const{data,error}=await db.from('listings').select('*').order('created_at',{ascending:false});
  if(error)return;
  listings=(data||[]).map(i=>({...i,desc:i.description,phone:i.phone}));
  renderListings();
}

async function applyWatermark(file){
  return new Promise(resolve=>{
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        const ctx=canvas.getContext('2d');
        canvas.width=img.width;canvas.height=img.height;
        ctx.drawImage(img,0,0);
        ctx.globalAlpha=0.25;ctx.fillStyle='#1E2D5A';ctx.font='bold 36px Arial';ctx.textAlign='center';
        ctx.fillText('FLAPY',canvas.width/2,canvas.height/2);
        resolve(canvas.toDataURL('image/jpeg',0.85));
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function submitListing(){
  if(!curUser){showWarmToast('💙 Сначала войдите');openM('m-auth');return;}
  
  const priceEl=document.getElementById('a-price'),descEl=document.getElementById('a-desc'),typeEl=document.getElementById('a-type'),roomsEl=document.getElementById('a-rooms'),areaEl=document.getElementById('a-area'),cityEl=document.getElementById('a-city'),districtEl=document.getElementById('a-district'),tiktokEl=document.getElementById('a-tiktok'),exchangeCheck=document.getElementById('a-exchange');
  
  if(!priceEl||!descEl)return;
  
  const price=parseInt(priceEl.value.replace(/\s/g,''))||0,desc=descEl.value||'',type=typeEl?typeEl.value:'apartment',rooms=roomsEl?parseInt(roomsEl.value):3,area=areaEl?parseInt(areaEl.value):85,city=cityEl?cityEl.value:'Астана',district=districtEl?districtEl.value:'Есиль',tiktok=tiktokEl?tiktokEl.value.trim():'',considerExchange=exchangeCheck?exchangeCheck.checked:false;
  
  if(!desc||desc.trim()===''){showWarmToast('Расскажите о доме с душой');return;}
  if(price<=0){showWarmToast('Укажите цену');return;}
  
  showWarmToast('⏳ Создаю с любовью...');
  
  let watermarkedPhotos=[];
  for(let i=0;i<uploadedMedia.photos.length;i++){watermarkedPhotos.push(await applyWatermark(uploadedMedia.photos[i]));}
  
  const{error}=await db.from('listings').insert([{realtor_id:curUser.id,price,description:desc,phone:curUser.user_metadata?.phone||'',consider_exchange:considerExchange,tiktok_url:tiktok,city,district,rooms,area,type,photo_urls:watermarkedPhotos,created_at:new Date().toISOString()}]);
  
  if(error){showWarmToast('❌ '+error.message);return;}
  
  showWarmToast('✅ Объект создан с любовью!');
  closeM('m-add');uploadedMedia={photos:[]};await loadListings();go('s-search');
}

function contactRealtor(id,type){
  const l=listings.find(x=>x.id===id);
  if(!l)return;
  const phone=(l.phone||'').replace(/\D/g,'');
  if(!phone){showWarmToast('Номер не указан');return;}
  
  if(type==='whatsapp'){
    const text=encodeURIComponent('Здравствуйте! 💙\nИнтересует ваше объявление на Flapy:\n'+l.rooms+'-комн., '+l.area+' м²\n'+fmtPrice(l.price)+' ₸');
    window.open('https://wa.me/'+phone+'?text='+text,'_blank');
  }else{window.location.href='tel:'+phone;}
}

function toggleFavorite(id){
  const idx=favorites.indexOf(id);
  if(idx>-1){favorites.splice(idx,1);showWarmToast('🤍 Убрано из сердца');}
  else{favorites.push(id);showWarmToast('❤️ Сохранено в сердце');}
  localStorage.setItem('fp_favs',JSON.stringify(favorites));renderListings();
}

function renderListings(){
  const el=document.getElementById('list-body');if(!el)return;
  
  const filtered=listTab==='exch'?listings.filter(l=>l.consider_exchange):listings;
  
  if(filtered.length===0){
    el.innerHTML='<div style="text-align:center;padding:80px 20px;color:var(--t3)"><div style="font-size:56px;margin-bottom:16px;animation:pulse 3s ease-in-out infinite">🏡</div><div style="font-size:18px;font-weight:600;color:var(--t1);margin-bottom:8px">'+WARM_WORDS.noObjects+'</div><div style="font-size:14px;margin-top:12px">'+WARM_WORDS.beFirst+'</div><div style="margin-top:20px;font-size:13px;color:var(--t2);font-style:italic">'+WARM_WORDS.gentle+'</div></div><style>@keyframes pulse{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}</style>';
    return;
  }
  
  el.innerHTML=filtered.map(l=>{
    const isFav=favorites.includes(l.id),exchangeBadge=l.consider_exchange?'<div style="position:absolute;top:10px;left:10px;padding:4px 10px;background:rgba(39,174,96,0.9);color:#fff;border-radius:6px;font-size:10px;font-weight:700">🔄 Обмен</div>':'',tiktokIcon=l.tiktok_url?'<span style="margin-left:6px;color:#fe2c55">🎵</span>':'',photo=l.photo_urls&&l.photo_urls[0]?l.photo_urls[0]:null;
    
    return '<div class="lcard su" style="position:relative;cursor:pointer;margin-bottom:20px;background:var(--bg2);border-radius:16px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.08);transition:all 0.3s" onmouseover="this.style.transform=\'translateY(-4px)\';this.style.boxShadow=\'0 8px 25px rgba(0,0,0,0.12)\'" onmouseout="this.style.transform=\'translateY(0)\';this.style.boxShadow=\'0 4px 15px rgba(0,0,0,0.08)\'" onclick="openDetail(\''+l.id+'\')">'+
      '<div style="position:relative;height:220px;background:linear-gradient(135deg,#f0f0f5,#e0e0e8);overflow:hidden">'+
        (photo?'<img src="'+photo+'" style="width:100%;height:100%;object-fit:cover" loading="lazy">':'<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:64px;color:#ccc;opacity:0.5">🏢</div>')+
        exchangeBadge+
        '<button onclick="event.stopPropagation();toggleFavorite(\''+l.id+'\')" style="position:absolute;top:12px;right:12px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);border:none;cursor:pointer;font-size:20px;box-shadow:0 2px 10px rgba(0,0,0,0.1);transition:transform 0.2s" onmouseover="this.style.transform=\'scale(1.1)\'" onmouseout="this.style.transform=\'scale(1)\'">'+(isFav?'❤️':'🤍')+'</button>'+
      '</div>'+
      '<div style="padding:16px">'+
        '<div style="font-size:22px;font-weight:800;margin-bottom:6px;color:var(--t1)">'+fmtPrice(l.price)+' ₸'+tiktokIcon+'</div>'+
        '<div style="font-size:14px;color:var(--t2);margin-bottom:10px">'+(l.city||'Астана')+', '+(l.district||'')+' · '+(l.rooms||3)+'-комн. · '+(l.area||85)+' м²</div>'+
        '<div style="font-size:13px;line-height:1.6;color:var(--t1);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:14px;opacity:0.9">'+(l.desc||'')+'</div>'+
        '<div style="display:flex;gap:10px">'+
          '<button onclick="event.stopPropagation();contactRealtor(\''+l.id+'\',\'call\')" style="flex:1;padding:11px;background:linear-gradient(135deg,#27AE60,#2ECC71);color:#fff;border:none;border-radius:10px;font-weight:600;cursor:pointer;font-size:13px;box-shadow:0 3px 10px rgba(39,174,96,0.3)">📞 '+WARM_WORDS.call+'</button>'+
          '<button onclick="event.stopPropagation();contactRealtor(\''+l.id+'\',\'whatsapp\')" style="flex:1;padding:11px;background:linear-gradient(135deg,#1E2D5A,#2E4A85);color:#fff;border:none;border-radius:10px;font-weight:600;cursor:pointer;font-size:13px;box-shadow:0 3px 10px rgba(30,45,90,0.3)">💬 '+WARM_WORDS.whatsapp+'</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  }).join('');
}

async function updateAuthUI(){
  const btn=document.getElementById('auth-btn');if(!btn)return;
  
  if(curUser){
    const email=curUser.email||'',name=(curUser.user_metadata&&curUser.user_metadata.full_name)?curUser.user_metadata.full_name:email.split('@')[0];
    if(email.includes('admin')||curUser.role==='superadmin'){btn.innerHTML='👑';btn.style.background='#9B59B6';btn.onclick=showAdminPanelFromBtn;}
    else{btn.innerHTML='👤 '+name.split(' ')[0];btn.style.background='var(--navy)';btn.onclick=()=>go('s-prof');}
  }else{btn.innerHTML=WARM_WORDS.login;btn.style.background='var(--navy)';btn.onclick=()=>openM('m-auth');}
}

function showAdminPanelFromBtn(){loadAdminStats();}

async function doLogin(){
  const emailEl=document.getElementById('l-email'),passEl=document.getElementById('l-pass');
  if(!emailEl||!passEl)return;
  
  const email=emailEl.value.trim(),pass=passEl.value;
  if(!email||!pass){showWarmToast('Введите email и пароль');return;}
  
  showWarmToast('⏳ Вход...');
  
  const{data,error}=await db.auth.signInWithPassword({email,password:pass});
  if(error){
    if(error.message.includes('Email')){showWarmToast('❌ Подтвердите email (проверьте почту)');}
    else{showWarmToast('❌ '+error.message);}
    return;
  }
  
  curUser=data.user;localStorage.removeItem('fp_admin_session');await updateAuthUI();closeM('m-auth');
  showWarmToast('👋 С возвращением, '+(curUser.user_metadata?.full_name?.split(' ')[0]||'друг')+'! 💙');
  location.reload();
}

async function doRegister(){
  const nameEl=document.getElementById('r-name'),emailEl=document.getElementById('r-email'),phoneEl=document.getElementById('r-phone'),passEl=document.getElementById('r-pass');
  if(!nameEl||!emailEl||!passEl)return;
  
  const name=nameEl.value.trim(),email=emailEl.value.trim(),phone=phoneEl?phoneEl.value.trim():'',pass=passEl.value;
  if(!name||!email||!pass){showWarmToast('Заполните все поля');return;}
  
  showWarmToast('⏳ Регистрация...');
  
  const{data,error}=await db.auth.signUp({
    email:email,
    password:pass,
    options:{
      {full_name:name,phone:phone}
    }
  });
  
  if(error){
    if(error.message.includes('429')){showWarmToast('⏳ Много попыток. Подождите или используйте другой email');}
    else{showWarmToast('❌ '+error.message);}
    return;
  }
  
  if(data.user){await db.from('realtors').insert([{id:data.user.id,email,name,phone,whatsapp:phone,agency:'Не указано'}]);}
  
  showWarmToast('✅ Проверьте email для подтверждения! 💙');
  authTab('in');
}

async function doLogout(){await db.auth.signOut();curUser=null;localStorage.removeItem('fp_admin_session');await updateAuthUI();showWarmToast(WARM_WORDS.logout+' 💙');location.reload();}

function renderAiraChat(){
  const el=document.getElementById('aira-msgs');if(!el)return;
  if(airaMessages.length===0){el.innerHTML='<div style="padding:60px 20px;text-align:center;color:var(--t3)"><div style="font-size:56px;margin-bottom:16px">💬</div><div style="font-size:16px;font-weight:600;margin-bottom:8px">Чат друзей</div><div style="font-size:13px">Здесь общаются риэлторы</div></div>';return;}
  el.innerHTML=airaMessages.map(m=>{const bg=m.mine?'var(--navy)':'#fff',color=m.mine?'#fff':'var(--t1)';return '<div style="display:flex;gap:8px;max-width:85%;margin-bottom:12px;'+(m.mine?'align-self:flex-end;flex-direction:row-reverse':'align-self:flex-start')+'"><div style="padding:11px 15px;border-radius:16px;font-size:14px;'+(m.mine?'background:var(--navy);color:#fff;border-radius:16px 4px 16px 16px':'background:#fff;color:var(--t1);border-radius:4px 16px 16px 16px')+'">'+m.text+'</div><div style="font-size:10px;color:var(--t3);margin-top:4px">'+m.time+'</div></div>';}).join('');
  setTimeout(()=>el.scrollTop=el.scrollHeight,50);
}

function sendAira(){const inp=document.getElementById('aira-inp'),txt=inp?inp.value.trim():'';if(!txt)return;const now=new Date(),tm=now.getHours().toString().padStart(2,'0')+':'+now.getMinutes().toString().padStart(2,'0');airaMessages.push({id:airaMessages.length+1,author:curUser?curUser.email.split('@')[0]:'Гость',text:txt,time:tm,mine:true});inp.value='';renderAiraChat();}

function showWarmToast(msg){
  let el=document.getElementById('toast');
  if(!el){el=document.createElement('div');el.id='toast';el.style.cssText='position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#1E2D5A,#2E4A85);color:#fff;padding:14px 28px;border-radius:14px;z-index:10000;opacity:0;transition:all 0.3s;font-weight:600;box-shadow:0 8px 30px rgba(30,45,90,0.3);font-size:14px;';document.body.appendChild(el);}
  el.textContent=msg;el.style.opacity='1';
  setTimeout(()=>{el.style.opacity='0';},3500);
}

function openM(id){document.getElementById(id).classList.add('on');}
function closeM(id){document.getElementById(id).classList.remove('on');}
function closeOvl(e,id){if(e.target.id===id)closeM(id);}

function authTab(tab){
  const inTab=document.getElementById('at-in'),upTab=document.getElementById('at-up'),inForm=document.getElementById('af-in'),upForm=document.getElementById('af-up');
  if(inTab)inTab.classList.toggle('on',tab==='in');
  if(upTab)upTab.classList.toggle('on',tab==='up');
  if(inForm)inForm.style.display=tab==='in'?'block':'none';
  if(upForm)upForm.style.display=tab==='up'?'block':'none';
}

function setListTab(tab){listTab=tab;const t1=document.getElementById('tab-obj'),t2=document.getElementById('tab-exch');if(t1)t1.classList.toggle('on',tab==='obj');if(t2)t2.classList.toggle('on',tab==='exch');renderListings();}

function fmtPrice(p){if(!p)return'0';return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');}

function uploadMedia(){
  const input=document.createElement('input');input.type='file';input.accept='image/*';input.multiple=true;
  input.onchange=e=>{const files=e.target.files;if(!files.length)return;if(files.length+uploadedMedia.photos.length>5){showWarmToast('Максимум 5 фото');return;}for(let i=0;i<files.length;i++){uploadedMedia.photos.push(files[i]);}showWarmToast('✅ Добавлено: '+uploadedMedia.photos.length+'/5');};
  input.click();
}

function toggleTheme(){
  const cur=document.documentElement.getAttribute('data-theme'),next=cur==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',next);localStorage.setItem('theme',next);
  showWarmToast(next==='dark'?'🌙 Тёмная тема':'☀️ Светлая');
}

function openDetail(id){
  const l=listings.find(x=>x.id===id);if(!l){showWarmToast('Не найдено');return;}
  if(l.tiktok_url){window.open(l.tiktok_url,'_blank');}
  else{alert('📄 '+(l.rooms||3)+'-комн.\n📐 '+l.area+' м²\n💰 '+fmtPrice(l.price)+' ₸\n\n💙 Нажмите кнопку связи');}
}

function go(id){document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'));const el=document.getElementById(id);if(el)el.classList.add('on');if(id==='s-search')renderListings();if(id==='s-aira')renderAiraChat();}
