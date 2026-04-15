'use strict';

var FLAPY_SUPABASE_URL = https://qjmfudpqfyanigizwvze.supabase.co
var FLAPY_SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqbWZ1ZHBxZnlhbmlnaXp3dnplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzUxODEsImV4cCI6MjA5MDYxMTE4MX0.XWBc3DAjOVMZ80VIlf4zZ1TgqtaxLDczdrPWwdpkkII

var flapyDB = null;
var curUser = null;
var listings = [];
var uploadedMedia = {photos: []};

window.addEventListener('load', function() {
  var loader = document.getElementById('loader');
  if (loader) {
    setTimeout(function() {
      loader.style.display = 'none';
    }, 1000);
  }
  
  if (window.supabase) {
    flapyDB = window.supabase.createClient(FLAPY_SUPABASE_URL, FLAPY_SUPABASE_KEY);
    console.log('Supabase connected');
  }
  
  loadListings();
});

function loadListings() {
  if (!flapyDB) {
    console.log('No Supabase');
    return;
  }
  
  flapyDB.from('listings').select('*').then(function(result) {
    if (result.error) {
      console.error('Error:', result.error);
      return;
    }
    
    listings = result.data || [];
    console.log('Loaded', listings.length, 'listings');
    
    var feed = document.getElementById('s-feed');
    if (feed && listings.length > 0) {
      var html = '';
      for (var i = 0; i < listings.length; i++) {
        var l = listings[i];
        html += '<div style="padding:20px;background:white;margin:10px;border-radius:12px">';
        html += '<div style="font-size:20px;font-weight:700">' + (l.price || 0) + ' ₸</div>';
        html += '<div>' + (l.rooms || 0) + '-комнатная, ' + (l.area || 0) + ' м²</div>';
        html += '<div style="margin-top:10px">' + (l.description || l.desc || 'Нет описания') + '</div>';
        html += '</div>';
      }
      feed.innerHTML = html;
    }
  });
}

function fmtPrice(p) {
  if (!p) return '0';
  return p.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function toast(msg) {
  console.log(msg);
  alert(msg);
}
