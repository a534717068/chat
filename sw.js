const CACHE_NAME = 'm-assistant-v2';
const urlsToCache = [
  '.',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png'
];

// 安装阶段：缓存新资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  // 强制跳过等待，立即激活新版本
  self.skipWaiting();
});

// 激活阶段：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 让新的 Service Worker 立即接管所有页面
  self.clients.claim();
});

// 拦截请求：优先使用网络，网络失败时回退到缓存
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 网络请求成功，更新缓存
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // 网络请求失败，使用缓存
        return caches.match(event.request);
      })
  );
});
