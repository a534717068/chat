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

// 拦截请求：
// GET 请求：优先网络，成功后更新缓存，网络失败时回退缓存。
// POST / PUT / DELETE 等非 GET 请求：只走网络，绝不写入 Cache。
// Cache API 不支持用 cache.put() 缓存这些请求。
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') {
    event.respondWith(fetch(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then(response => {
        // 只有 GET 请求才写入 Cache
        if (response && response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone).catch(() => {});
          });
        }
        return response;
      })
      .catch(() => {
        // GET 网络失败时才回退到缓存
        return caches.match(request);
      })
  );
});
