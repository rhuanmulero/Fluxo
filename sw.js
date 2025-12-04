const CACHE_NAME = 'fluxo-v5-cache';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './js/app.js',
  './js/utils.js',
  './js/ai.js',
  './js/modules/dashboard.js',
  './js/modules/tasks.js',
  './js/modules/kanban.js',
  './js/modules/calendar.js',
  './js/modules/notes.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});