const CACHE_NAME = "choi-seoyoon-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./development.json",
  "./play.json",
  "./seoyoon-logo.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // 기상청 등 외부 API 요청은 캐시하지 않아요.
  if (url.origin !== self.location.origin) return;

  // 페이지 이동은 네트워크를 먼저 사용하고,
  // 연결이 안 되면 저장된 페이지를 보여줘요.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        return await caches.match("./index.html") ||
          new Response("인터넷 연결을 확인해 주세요.", {
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
      })
    );
    return;
  }

  // 나머지 앱 파일은 캐시를 활용해요.
  event.respondWith(
    caches.match(request).then(cached => {
      const networkRequest = fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);

      return cached || networkRequest;
    })
  );
});
