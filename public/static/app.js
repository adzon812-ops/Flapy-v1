// STATE
var listings = [];
var curUser = null;

// BOOT
window.addEventListener('load', function() {
  console.log('App loaded');
  
  // Hide splash after 2.5 seconds
  setTimeout(function() {
    var splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('hidden');
      setTimeout(function() {
        splash.style.display = 'none';
      }, 800);
    }
  }, 2500);
  
  // Load data
  fetchListings();
  
  // Set active nav
  var ns = document.getElementById('n-search');
  if (ns) ns.classList.add('on');
});

// DATA
function fetchListings() {
  console.log('Fetching listings...');
  listings = getFallbackListings();
  renderListings();
  console.log('Listings loaded:', listings.length);
}

function getFallbackListings() {
  return [
    {
      id: 1,
      type: 'apartment',
      rooms: 3,
      area: 85,
      district: 'Есильский',
      city: 'Астана',
      price: 62000000,
      desc: 'Отличная 3-комнатная в новом ЖК',
      photos: ['🛋️', '🚿', '🌇']
    },
    {
      id: 2,
      type: 'apartment',
      rooms: 2,
      area: 65,
      district: 'Сарыарка',
      city: 'Астана',
      price: 38000000,
      desc: 'Уютная 2-комнатная в тихом дворе',
      photos: ['🛋️', '🚿']
    }
  ];
}

// RENDER
function renderListings() {
  var el = document.getElementById('list-body');
  if (!el) {
    console.error('list-body not found');
    return;
  }
  
  if (!listings.length) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:#999">Загрузка...</div>';
    return;
  }
  
  el.innerHTML = listings.map(buildListCard).join('');
  console.log('Rendered', listings.length, 'cards');
}

function buildListCard(l) {
  var pr = fmtPrice(l.price);
  var rm = l.rooms ? l.rooms + '-комнатная, ' : '';
  
  return (
    '<div class="lcard" onclick="openDetail(' + l.id + ')">' +
      '<div class="lcard-media">' +
        '<div class="lcard-em">🏢</div>' +
      '</div>' +
      '<div class="lcard-body">' +
        '<div class="lcard-price">' + pr + ' ₸</div>' +
        '<div class="lcard-sub">' + rm + l.area + ' м² · ' + l.district + '</div>' +
        '<div style="font-size:12px;color:#999">' + l.desc + '</div>' +
      '</div>' +
    '</div>'
  );
}

function fmtPrice(p) {
  return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function openDetail(id) {
  var l = listings.find(function(x) { return x.id === id; });
  if (!l) return;
  toast('Открыт объект: ' + l.district);
}

// NAV
function go(id) {
  document.querySelectorAll('.scr').forEach(function(s) {
    s.classList.remove('on');
  });
  var s = document.getElementById(id);
  if (s) s.classList.add('on');
}

function nav(el) {
  document.querySelectorAll('.nav-it').forEach(function(n) {
    n.classList.remove('on');
  });
  if (el) el.classList.add('on');
}

// UTILS
function toast(msg) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(function() {
    el.classList.remove('show');
  }, 2400);
}

console.log('app.js loaded successfully');
