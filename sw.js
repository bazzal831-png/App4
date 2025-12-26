const CACHE_NAME = "smoking-tracker-v29";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json"
];

// 1. التثبيت: محاولة حفظ الملفات الأساسية
self.addEventListener("install", (event) => {
  self.skipWaiting(); // تفعيل التحديث فوراً
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // نحاول حفظ الملفات، حتى لو فشل بعضها لا نوقف العملية
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.error("Failed to cache some assets:", err);
      });
    })
  );
});

// 2. التفعيل: تنظيف الذاكرة القديمة
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // السيطرة على الصفحة فوراً
});

// 3. الجلب: استراتيجية "الذاكرة أولاً، ثم الشبكة" (Cache First)
self.addEventListener("fetch", (event) => {
  // لا تحاول حفظ طلبات غير الـ GET أو طلبات الـ Firebase المباشرة للبيانات
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('firestore.googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // إذا جلبنا شيئاً جديداً من النت، نقوم بحفظه للمرة القادمة
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // إذا فشل النت ولا يوجد في الذاكرة، يمكن إظهار صفحة بديلة (اختياري)
        // return caches.match('./offline.html');
      });
    })
  );

});













