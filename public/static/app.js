/* FLAPY app.js - MINIMAL WORKING VERSION */
'use strict';

var listings = [], calEvents = [], realtors = [], curUser = null;
var curFilter = 'all', curLang = 'ru', listTab = 'obj';

// Простые переводы
var T = {
  ru: { tab_obj: 'Объекты', tab_exch: 'Обмен', filt_all: 'Все', call: 'Позвонить', msg: 'Написать' },
  kz: { tab_obj: 'Объектілер', tab_exch: 'Айырбас', filt_all: 'Барлығы', call: 'Қоңырау', msg: 'Жазу' }
};

function t(key) { return (T[curLang] && T[curLang][key]) || (T.ru[key] || key); }

// Инициализация
window.addEventListener('load', function() {
  console.log('App loaded');
  
  // Скрываем загрузчик
  setTimeout(function() {
    var ld = document.getElementById('loader');
    if (ld) {
      ld.style.opacity = '0';
      setTimeout(function(){ ld.style.display = 'none'; }, 300);
    }
    
    // Загружаем данные
    fetchListings();
  }, 1000);
});

function fetchListings() {
  // Простые тестовые данные
  listings = [
    { id:1, type:'apartment', rooms:3, area:85, district:'Есиль', city:'Астана', price:78500000, realtor:'Айгерим К.', realtorFull:'Айгерим Касымова', agency:'Century 21', desc:'Просторная квартира', photos:['🏢'] }
  ];
  renderListings();
}

function renderListings() {
  var el = document.getElementById('list-body');
  if (!el) return;
  
  el.innerHTML = listings.map(function(l) {
    return '<div class="lcard">' +
      '<div class="lcard-body">' +
        '<div class="lcard-price">' + fmtPrice(l.price) + ' ₸</div>' +
        '<div class="lcard-sub">' + l.rooms + '-комнатная, ' + l.area + ' м²</div>' +
        '<div class="lcard-loc">' + l.city + ', ' + l.district + '</div>' +
        '<div class="lcard-footer">' +
          '<div class="lf-name">' + l.realtorFull + ' · ' + l.agency + '</div>' +
        '</div>' +
        '<div class="lcard-cta">' +
          '<button class="cta-btn cta-call"><i class="fas fa-phone"></i> ' + t('call') + '</button>' +
          '<button class="cta-btn cta-msg"><i class="fas fa-comment"></i> ' + t('msg') + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function fmtPrice(p) {
  return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function go(id) {
  document.querySelectorAll('.scr').forEach(function(s){ s.classList.remove('on'); });
  var s = document.getElementById(id);
  if (s) s.classList.add('on');
}

function nav(el) {
  document.querySelectorAll('.nav-it').forEach(function(n){ n.classList.remove('on'); });
  if (el) el.classList.add('on');
}

function setListTab(tab) {
  listTab = tab;
  var t1 = document.getElementById('tab-obj');
  var t2 = document.getElementById('tab-exch');
  if (t1) t1.classList.toggle('on', tab==='obj');
  if (t2) t2.classList.toggle('on', tab==='exch');
}

function setFilt(el, f) {
  document.querySelectorAll('.fchip').forEach(function(c){ c.classList.remove('on'); });
  el.classList.add('on');
  curFilter = f;
}

function openM(id) {
  var e = document.getElementById(id);
  if (e) e.classList.add('on');
}

function closeM(id) {
  var e = document.getElementById(id);
  if (e) e.classList.remove('on');
}

function toast(msg) {
  var el = document.getElementById('toast');
  if (el) {
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function(){ el.classList.remove('show'); }, 2000);
  }
}

console.log('App.js loaded successfully');
