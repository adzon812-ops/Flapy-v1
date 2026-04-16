/* FLAPY v18.0 — PRODUCTION READY */
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
var listings = [], curUser = null, curFilter = 'all', curLang = 'ru', listTab = 'obj',
uploadedMedia = {photos:[]},
favorites = JSON.parse(localStorage.getItem('fp_favs') || '[]'); // ✅ Для гостей

/* ════════════════════════════════════════════════════
   🚀 INIT
═══════════════════════════════════════════════════ */
window.addEventListener('load', async function(){
  // Проверяем сессию
  const { data: { session } } = await db.auth.getSession();
  if(session){
    curUser = session.user;
    updateAuthUI();
  }
  
  curLang=localStorage.getItem('fp_lang')||'ru';applyLangUI();
  
  var ld=document.getElementById('loader');if(ld)ld.style.display='none';
  
  // Загружаем объекты
  await loadListings();
  
  console.log('✅ Flapy v18.0 loaded');
});

/* ════════════════════════════════════════════════════
   📥 LOAD LISTINGS
═══════════════════════════════════════════════════ */
async function loadListings(){
  if(!db){
    console.error('No DB connection');
    return;
  }
  
  const { data, error } = await db
    .from('listings')
    .select('*')
    .order('created_at', { ascending: false });
    
  if(error){
    console.error('Load error:', error);
    return;
  }
  
  listings = (data || []).map(item => ({
    ...item,
    desc: item.description,
    realtor_phone: item.phone // ✅ Номер риэлтора
  }));
  
  renderListings();
}

/* ════════════════════════════════════════════════════
   💧 WATERMARK ON PHOTOS
═══════════════════════════════════════════════════ */
async function applyWatermark(imageFile){
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = function(e){
      const img = new Image();
      img.onload = function(){
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Рисуем фото
        ctx.drawImage(img, 0, 0);
        
        // Водяной знак
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#1E2D5A';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('FLAPY', canvas.width/2, canvas.height/2);
        ctx.fillText('© '+new Date().getFullYear(), canvas.width/2, canvas.height/2 + 40);
        
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(imageFile);
  });
}

/* ════════════════════════════════════════════════════
   📤 SUBMIT LISTING
═══════════════════════════════════════════════════ */
async function submitListing(){
  if(!curUser){
    alert('🔐 Сначала войдите как риэлтор');
    openM('m-auth');
    return;
  }
  
  var priceEl=document.getElementById('a-price');
  var descEl=document.getElementById('a-desc');
  var typeEl=document.getElementById('a-type');
  var roomsEl=document.getElementById('a-rooms');
  var areaEl=document.getElementById('a-area');
  var cityEl=document.getElementById('a-city');
  var districtEl=document.getElementById('a-district');
  var tiktokEl=document.getElementById('a-tiktok');
  var exchangeCheck=document.getElementById('a-exchange');
  
  if(!priceEl || !descEl){alert('Ошибка формы');return;}
  
  var priceStr=priceEl.value.replace(/\s/g,'');
  var price=parseInt(priceStr)||0;
  var desc=descEl.value||'';
  var type=typeEl?typeEl.value:'apartment';
  var rooms=roomsEl?parseInt(roomsEl.value):3;
  var area=areaEl?parseInt(areaEl.value):85;
  var city=cityEl?cityEl.value:'Астана';
  var district=districtEl?districtEl.value:'Есиль';
  var tiktok=tiktokEl?tiktokEl.value.trim():'';
  var considerExchange=exchangeCheck?exchangeCheck.checked:false;
  
  if(!desc || desc.trim()===''){alert('Введите описание');return;}
  if(price<=0){alert('Введите цену');return;}
  
  // ✅ Применяем водяные знаки к фото
  var watermarkedPhotos = [];
  for(var i=0; i<uploadedMedia.photos.length; i++){
    var wp = await applyWatermark(uploadedMedia.photos[i]);
    watermarkedPhotos.push(wp);
  }
  
  // В Supabase
  const { error } = await db.from('listings').insert([{
    realtor_id: curUser.id,
    price: price,
    description: desc,
    phone: curUser.user_metadata?.phone || '', // ✅ Номер риэлтора из профиля
    consider_exchange: considerExchange,
    tiktok_url: tiktok,
    city: city,
    district: district,
    rooms: rooms,
    area: area,
    type: type,
    photo_urls: watermarkedPhotos, // ✅ С водяными знаками
    created_at: new Date().toISOString()
  }]);
  
  if(error){
    alert('❌ Ошибка: ' + error.message);
    return;
  }
  
  alert('✅ Объект опубликован!');
  closeM('m-add');
  uploadedMedia={photos:[]};
  await loadListings();
  go('s-search');
}

/* ════════════════════════════════════════════════════
   📞 CONTACT REALTOR (WHATSAPP / CALL)
═══════════════════════════════════════════════════ */
function contactRealtor(listingId, type){
  var listing = listings.find(l => l.id === listingId);
  if(!listing){alert('Объект не найден');return;}
  
  var phone = listing.phone || listing.realtor_phone;
  if(!phone){alert('Номер телефона не указан');return;}
  
  // Очищаем номер
  var cleanPhone = phone.replace(/\D/g, '');
  
  if(type === 'whatsapp'){
    // ✅ WhatsApp с сообщением
    var text = encodeURIComponent('Здравствуйте! Интересует ваше объявление на Flapy:\n' + 
      listing.rooms + '-комнатная, ' + listing.area + ' м²\n' +
      fmtPrice(listing.price) + ' ₸\n' +
      (listing.tiktok ? '\n🎵 Видео: ' + listing.tiktok : ''));
    
    window.open('https://wa.me/' + cleanPhone + '?text=' + text, '_blank');
  }else if(type === 'call'){
    // ✅ Звонок
    window.location.href = 'tel:' + cleanPhone;
  }
}

/* ════════════════════════════════════════════════════
   ❤️ FAVORITES (ДЛЯ ГОСТЕЙ И ПОЛЬЗОВАТЕЛЕЙ)
═══════════════════════════════════════════════════ */
function toggleFavorite(listingId){
  var idx = favorites.indexOf(listingId);
  if(idx > -1){
    favorites.splice(idx, 1);
    alert('❤️ Удалено из избранного');
  }else{
    favorites.push(listingId);
    alert('❤️ Добавлено в избранное');
  }
  localStorage.setItem('fp_favs', JSON.stringify(favorites)); // ✅ Сохраняем для гостей
  renderListings();
}

/* ════════════════════════════════════════════════════
   🎨 RENDER LISTINGS
═══════════════════════════════════════════════════ */
function renderListings(){
  var el=document.getElementById('list-body');
  if(!el)return;
  
  var filtered = listTab === 'exch' 
    ? listings.filter(function(l){return l.consider_exchange;}) 
    : listings;
  
  if(filtered.length===0){
    el.innerHTML='<div style="text-align:center;padding:60px 20px;color:var(--t3)"><div style="font-size:48px;margin-bottom:12px">🏡</div><div style="font-size:16px;font-weight:600">Пока нет объектов</div><div style="font-size:13px;margin-top:8px">Будьте первым, кто добавит!</div></div>';
    return;
  }
  
  el.innerHTML=filtered.map(function(l){
    var isFav = favorites.includes(l.id);
    var exchangeBadge = l.consider_exchange ? '<div style="position:absolute;top:10px;left:10px;padding:4px 10px;background:rgba(39,174,96,0.9);color:#fff;border-radius:6px;font-size:10px;font-weight:700">🔄 Обмен</div>' : '';
    var tiktokIcon = l.tiktok_url ? '<span style="margin-left:6px;color:#fe2c55">🎵</span>' : '';
    var firstPhoto = l.photo_urls && l.photo_urls[0] ? l.photo_urls[0] : null;
    
    return '<div class="lcard su" onclick="openDetail(\''+l.id+'\')" style="position:relative;cursor:pointer">'+
      '<div style="position:relative;height:200px;background:#f0f0f5;border-radius:12px 12px 0 0;overflow:hidden">'+
        (firstPhoto ? '<img src="'+firstPhoto+'" style="width:100%;height:100%;object-fit:cover" loading="lazy">' : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;color:#ccc">🏢</div>') +
        exchangeBadge +
        '<button onclick="event.stopPropagation();toggleFavorite(\''+l.id+'\')" style="position:absolute;top:10px;right:10px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.9);border:none;cursor:pointer;font-size:18px">'+(isFav?'❤️':'🤍')+'</button>'+
      '</div>'+
      '<div style="padding:12px">'+
        '<div style="font-size:20px;font-weight:800;margin-bottom:4px">'+fmtPrice(l.price)+' ₸'+tiktokIcon+'</div>'+
        '<div style="font-size:13px;color:var(--t2);margin-bottom:8px">'+(l.city||'Астана')+', '+(l.district||'')+' · '+(l.rooms||3)+'-комн. · '+(l.area||85)+' м²</div>'+
        '<div style="font-size:13px;line-height:1.5;color:var(--t1);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">'+(l.desc||'')+'</div>'+
        '<div style="display:flex;gap:8px;margin-top:12px">'+
          '<button onclick="event.stopPropagation();contactRealtor(\''+l.id+'\',\'call\')" style="flex:1;padding:10px;background:var(--navy);color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer">📞 Позвонить</button>'+
          '<button onclick="event.stopPropagation();contactRealtor(\''+l.id+'\',\'whatsapp\')" style="flex:1;padding:10px;background:#25D366;color:#fff;border:none;border-radius:8px;font-weight:600;cursor:pointer">💬 WhatsApp</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  }).join('');
}

/* ════════════════════════════════════════════════════
   🔐 AUTH (ТОЛЬКО РЕАЛЬНЫЕ ПОЛЬЗОВАТЕЛИ)
═══════════════════════════════════════════════════ */
async function updateAuthUI(){
  var authBtn = document.getElementById('auth-btn');
  if(!authBtn)return;
  
  if(curUser){
    var email = curUser.email || '';
    var name = email.split('@')[0];
    
    // ✅ Проверяем админа
    if(email.includes('admin') || email.includes('flapy.internal')){
      authBtn.innerHTML = '👑 Admin';
      authBtn.style.background = '#9B59B6';
    }else{
      authBtn.innerHTML = '👤 ' + name;
      authBtn.style.background = 'var(--navy)';
    }
  }else{
    authBtn.innerHTML = 'Войти';
    authBtn.style.background = 'var(--navy)';
  }
}

async function doLogin(){
  var emailEl = document.getElementById('l-email');
  var passEl = document.getElementById('l-pass');
  
  if(!emailEl || !passEl){alert('Заполните поля');return;}
  
  var email = emailEl.value.trim();
  var pass = passEl.value;
  
  if(!email || !pass){alert('Введите email и пароль');return;}
  
  // ✅ Только реальные пользователи из Supabase
  const { data, error } = await db.auth.signInWithPassword({
    email: email,
    password: pass
  });
  
  if(error){
    alert('❌ Ошибка входа: ' + error.message);
    return;
  }
  
  curUser = data.user;
  await updateAuthUI();
  closeM('m-auth');
  alert('👋 Добро пожаловать!');
  location.reload();
}

async function doRegister(){
  var nameEl = document.getElementById('r-name');
  var emailEl = document.getElementById('r-email');
  var phoneEl = document.getElementById('r-phone');
  var passEl = document.getElementById('r-pass');
  
  if(!nameEl || !emailEl || !passEl){alert('Заполните обязательные поля');return;}
  
  var name = nameEl.value.trim();
  var email = emailEl.value.trim();
  var phone = phoneEl ? phoneEl.value.trim() : '';
  var pass = passEl.value;
  
  if(!name || !email || !pass){alert('Заполните все поля');return;}
  
  // ✅ Регистрация нового риэлтора
  const { data, error } = await db.auth.signUp({
    email: email,
    password: pass,
    options: {
      data: {
        full_name: name,
        phone: phone
      }
    }
  });
  
  if(error){
    alert('❌ Ошибка: ' + error.message);
    return;
  }
  
  // Создаём профиль риэлтора
  if(data.user){
    await db.from('realtors').insert([{
      id: data.user.id,
      email: email,
      name: name,
      phone: phone,
      whatsapp: phone,
      agency: 'Не указано'
    }]);
  }
  
  alert('✅ Регистрация успешна! Теперь войдите.');
  authTab('in');
}

async function doLogout(){
  await db.auth.signOut();
  curUser = null;
  await updateAuthUI();
  alert('👋 До встречи!');
  location.reload();
}

function openM(id){document.getElementById(id).classList.add('on');}
function closeM(id){document.getElementById(id).classList.remove('on');}
function closeOvl(e,id){if(e.target.id===id)closeM(id);}

function authTab(tab){
  var inTab=document.getElementById('at-in'),upTab=document.getElementById('at-up');
  var inForm=document.getElementById('af-in'),upForm=document.getElementById('af-up');
  
  if(inTab)inTab.classList.toggle('on',tab==='in');
  if(upTab)upTab.classList.toggle('on',tab==='up');
  if(inForm)inForm.style.display=tab==='in'?'block':'none';
  if(upForm)upForm.style.display=tab==='up'?'block':'none';
}

function setListTab(tab){
  listTab=tab;
  var t1=document.getElementById('tab-obj'),t2=document.getElementById('tab-exch');
  if(t1)t1.classList.toggle('on',tab==='obj');
  if(t2)t2.classList.toggle('on',tab==='exch');
  renderListings();
}

function fmtPrice(p){
  if(!p)return'0';
  return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ');
}

function uploadMedia(){
  var input=document.createElement('input');
  input.type='file';
  input.accept='image/*';
  input.multiple=true;
  
  input.onchange=function(e){
    var files=e.target.files;
    if(!files.length)return;
    
    if(files.length + uploadedMedia.photos.length > 5){
      alert('Максимум 5 фото');
      return;
    }
    
    for(var i=0;i<files.length;i++){
      uploadedMedia.photos.push(files[i]);
    }
    
    alert('✅ Загружено фото: '+uploadedMedia.photos.length+'/5');
  };
  
  input.click();
}

function toggleTheme(){
  var cur=document.documentElement.getAttribute('data-theme');
  var next=cur==='dark'?'light':'dark';
  document.documentElement.setAttribute('data-theme',next);
  localStorage.setItem('theme',next);
}

function setLang(lang){
  curLang=lang;
  localStorage.setItem('fp_lang',lang);
  applyLangUI();
}

function applyLangUI(){
  var ru=document.getElementById('lo-ru'),kz=document.getElementById('lo-kz');
  if(ru)ru.classList.toggle('on',curLang==='ru');
  if(kz)kz.classList.toggle('on',curLang==='kz');
}

function openDetail(id){
  var l=listings.find(function(x){return x.id===id;});
  if(!l){alert('Не найдено');return;}
  
  if(l.tiktok_url){
    window.open(l.tiktok_url,'_blank');
  }else{
    alert('📄 '+(l.rooms||3)+'-комнатная, '+l.area+' м²\n💰 '+fmtPrice(l.price)+' ₸\n📍 '+l.city+', '+l.district);
  }
}

function go(id){
  document.querySelectorAll('.scr').forEach(function(s){s.classList.remove('on');});
  var el=document.getElementById(id);
  if(el)el.classList.add('on');
  if(id==='s-search')renderListings();
}
