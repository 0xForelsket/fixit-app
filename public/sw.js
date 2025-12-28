if (!self.define) {
  let a,
    e = {};
  const s = (s, i) => (
    (s = new URL(s + ".js", i).href),
    e[s] ||
      new Promise((e) => {
        if ("document" in self) {
          const a = document.createElement("script");
          (a.src = s), (a.onload = e), document.head.appendChild(a);
        } else (a = s), importScripts(s), e();
      }).then(() => {
        const a = e[s];
        if (!a) throw new Error(`Module ${s} didn’t register its module`);
        return a;
      })
  );
  self.define = (i, c) => {
    const n =
      a ||
      ("document" in self ? document.currentScript.src : "") ||
      location.href;
    if (e[n]) return;
    const t = {};
    const r = (a) => s(a, n),
      d = { module: { uri: n }, exports: t, require: r };
    e[n] = Promise.all(i.map((a) => d[a] || r(a))).then((a) => (c(...a), t));
  };
}
define(["./workbox-1bb06f5e"], (a) => {
  importScripts(),
    self.skipWaiting(),
    a.clientsClaim(),
    a.precacheAndRoute(
      [
        {
          url: "/_next/app-build-manifest.json",
          revision: "f84eb40ba14040aaa1bd8b9626c54d5c",
        },
        {
          url: "/_next/static/chunks/1255-8befde0980f5cba9.js",
          revision: "8befde0980f5cba9",
        },
        {
          url: "/_next/static/chunks/1265-f5d9d2c2bbb3418e.js",
          revision: "f5d9d2c2bbb3418e",
        },
        {
          url: "/_next/static/chunks/1338-05f0421503948baa.js",
          revision: "05f0421503948baa",
        },
        {
          url: "/_next/static/chunks/1401-a06efc84ffb2f0f6.js",
          revision: "a06efc84ffb2f0f6",
        },
        {
          url: "/_next/static/chunks/224-13ca3a4c7402bd68.js",
          revision: "13ca3a4c7402bd68",
        },
        {
          url: "/_next/static/chunks/228-cbff947030463530.js",
          revision: "cbff947030463530",
        },
        {
          url: "/_next/static/chunks/2619-04bc32f026a0d946.js",
          revision: "04bc32f026a0d946",
        },
        {
          url: "/_next/static/chunks/3339-cef16cdada52c0cc.js",
          revision: "cef16cdada52c0cc",
        },
        {
          url: "/_next/static/chunks/426-8faa27dffaf68664.js",
          revision: "8faa27dffaf68664",
        },
        {
          url: "/_next/static/chunks/4648-b78869818bf49bb7.js",
          revision: "b78869818bf49bb7",
        },
        {
          url: "/_next/static/chunks/4799-0fe730ede2ecabb0.js",
          revision: "0fe730ede2ecabb0",
        },
        {
          url: "/_next/static/chunks/4909-50b2c908998a76c5.js",
          revision: "50b2c908998a76c5",
        },
        {
          url: "/_next/static/chunks/4bd1b696-100b9d70ed4e49c1.js",
          revision: "100b9d70ed4e49c1",
        },
        {
          url: "/_next/static/chunks/5506-b80fb543791fc95f.js",
          revision: "b80fb543791fc95f",
        },
        {
          url: "/_next/static/chunks/5567-1c1d31e10127c3b3.js",
          revision: "1c1d31e10127c3b3",
        },
        {
          url: "/_next/static/chunks/6223-425b40e7c7402a32.js",
          revision: "425b40e7c7402a32",
        },
        {
          url: "/_next/static/chunks/626-01a8dd243a5c507e.js",
          revision: "01a8dd243a5c507e",
        },
        {
          url: "/_next/static/chunks/6414-6282b54d9f8a6c47.js",
          revision: "6282b54d9f8a6c47",
        },
        {
          url: "/_next/static/chunks/6581-cb682e68ee444c27.js",
          revision: "cb682e68ee444c27",
        },
        {
          url: "/_next/static/chunks/7360-3a23c7fd878f6225.js",
          revision: "3a23c7fd878f6225",
        },
        {
          url: "/_next/static/chunks/7666-7dcf13c5ed7ed0f6.js",
          revision: "7dcf13c5ed7ed0f6",
        },
        {
          url: "/_next/static/chunks/8276-6e9c8e01b7f99355.js",
          revision: "6e9c8e01b7f99355",
        },
        {
          url: "/_next/static/chunks/8682-c44d1bf04544b4f4.js",
          revision: "c44d1bf04544b4f4",
        },
        {
          url: "/_next/static/chunks/8725-25c51acebd1c125f.js",
          revision: "25c51acebd1c125f",
        },
        {
          url: "/_next/static/chunks/9558-b2e5c31aa5a99de1.js",
          revision: "b2e5c31aa5a99de1",
        },
        {
          url: "/_next/static/chunks/9577-7f01aee51670843e.js",
          revision: "7f01aee51670843e",
        },
        {
          url: "/_next/static/chunks/9733-0657b3af8afcba08.js",
          revision: "0657b3af8afcba08",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/analytics/page-5d0d1024a4b3464e.js",
          revision: "5d0d1024a4b3464e",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/equipment/%5Bid%5D/edit/page-e3d629c031abf67a.js",
          revision: "e3d629c031abf67a",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/equipment/%5Bid%5D/page-e075f3aa5087e56b.js",
          revision: "e075f3aa5087e56b",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/equipment/models/%5Bid%5D/page-a36b63fe4736d833.js",
          revision: "a36b63fe4736d833",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/equipment/models/new/page-d5df119df880089e.js",
          revision: "d5df119df880089e",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/equipment/models/page-6efa94890d6bced3.js",
          revision: "6efa94890d6bced3",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/equipment/new/page-139fc4f05171a26f.js",
          revision: "139fc4f05171a26f",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/equipment/page-6efa94890d6bced3.js",
          revision: "6efa94890d6bced3",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/error-ea8eabae258fb692.js",
          revision: "ea8eabae258fb692",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/inventory/page-6efa94890d6bced3.js",
          revision: "6efa94890d6bced3",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/inventory/parts/%5Bid%5D/page-3aa22e6004f941db.js",
          revision: "3aa22e6004f941db",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/inventory/parts/new/page-004160bcf8fbf830.js",
          revision: "004160bcf8fbf830",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/inventory/parts/page-6efa94890d6bced3.js",
          revision: "6efa94890d6bced3",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/inventory/receive/page-2d3e505fe2bb996a.js",
          revision: "2d3e505fe2bb996a",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/inventory/transactions/page-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/layout-f70a7ba2c9c28ae0.js",
          revision: "f70a7ba2c9c28ae0",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/loading-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/locations/page-6efa94890d6bced3.js",
          revision: "6efa94890d6bced3",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/page-ac0df2ca15511a5e.js",
          revision: "ac0df2ca15511a5e",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/qr-codes/page-5deaad39f1d0e767.js",
          revision: "5deaad39f1d0e767",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/reports/page-ac0df2ca15511a5e.js",
          revision: "ac0df2ca15511a5e",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/roles/%5Bid%5D/page-9e3e2a6a4b420384.js",
          revision: "9e3e2a6a4b420384",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/roles/new/page-f9ecdfa21fb9eed0.js",
          revision: "f9ecdfa21fb9eed0",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/roles/page-12e291de62fe6fe3.js",
          revision: "12e291de62fe6fe3",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/schedules/page-44fb0c803fb23a6d.js",
          revision: "44fb0c803fb23a6d",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/settings/page-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/users/%5Bid%5D/page-0e726e7917796465.js",
          revision: "0e726e7917796465",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/users/new/page-ba2a3b978873cdd0.js",
          revision: "ba2a3b978873cdd0",
        },
        {
          url: "/_next/static/chunks/app/(admin)/admin/users/page-6efa94890d6bced3.js",
          revision: "6efa94890d6bced3",
        },
        {
          url: "/_next/static/chunks/app/(auth)/login/page-548af1dfd54bb5bb.js",
          revision: "548af1dfd54bb5bb",
        },
        {
          url: "/_next/static/chunks/app/(operator)/equipment/%5Bcode%5D/page-e656d9f451dc99da.js",
          revision: "e656d9f451dc99da",
        },
        {
          url: "/_next/static/chunks/app/(operator)/error-69f7a5397e97d5f2.js",
          revision: "69f7a5397e97d5f2",
        },
        {
          url: "/_next/static/chunks/app/(operator)/layout-296194ef630fd28f.js",
          revision: "296194ef630fd28f",
        },
        {
          url: "/_next/static/chunks/app/(operator)/my-tickets/%5Bid%5D/page-1852ed1c62b88c8c.js",
          revision: "1852ed1c62b88c8c",
        },
        {
          url: "/_next/static/chunks/app/(operator)/my-tickets/page-46eb52b070133930.js",
          revision: "46eb52b070133930",
        },
        {
          url: "/_next/static/chunks/app/(operator)/report/%5Bcode%5D/page-7633ab872af367af.js",
          revision: "7633ab872af367af",
        },
        {
          url: "/_next/static/chunks/app/(tech)/dashboard/error-1c12db42fb2658db.js",
          revision: "1c12db42fb2658db",
        },
        {
          url: "/_next/static/chunks/app/(tech)/dashboard/layout-3d0235dd4e448bcd.js",
          revision: "3d0235dd4e448bcd",
        },
        {
          url: "/_next/static/chunks/app/(tech)/dashboard/loading-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/(tech)/dashboard/maintenance/page-6efa94890d6bced3.js",
          revision: "6efa94890d6bced3",
        },
        {
          url: "/_next/static/chunks/app/(tech)/dashboard/maintenance/schedules/%5Bid%5D/page-539b4cd0b3e4ba13.js",
          revision: "539b4cd0b3e4ba13",
        },
        {
          url: "/_next/static/chunks/app/(tech)/dashboard/maintenance/schedules/new/page-81142db60b791bc2.js",
          revision: "81142db60b791bc2",
        },
        {
          url: "/_next/static/chunks/app/(tech)/dashboard/maintenance/schedules/page-8232a5fc6fefbe7f.js",
          revision: "8232a5fc6fefbe7f",
        },
        {
          url: "/_next/static/chunks/app/(tech)/dashboard/page-8be388b821a4421a.js",
          revision: "8be388b821a4421a",
        },
        {
          url: "/_next/static/chunks/app/(tech)/dashboard/work-orders/%5Bid%5D/loading-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/(tech)/dashboard/work-orders/%5Bid%5D/page-6ceca630502b4fc5.js",
          revision: "6ceca630502b4fc5",
        },
        {
          url: "/_next/static/chunks/app/(tech)/dashboard/work-orders/page-a40e824bb62f2752.js",
          revision: "a40e824bb62f2752",
        },
        {
          url: "/_next/static/chunks/app/_not-found/page-974b1db49da0ca13.js",
          revision: "974b1db49da0ca13",
        },
        {
          url: "/_next/static/chunks/app/api/analytics/equipment/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/analytics/kpis/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/analytics/technicians/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/analytics/trends/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/attachments/%5Bid%5D/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/attachments/presigned-url/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/attachments/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/auth/login/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/auth/logout/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/auth/me/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/equipment/models/%5Bid%5D/bom/%5BbomId%5D/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/equipment/models/%5Bid%5D/bom/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/equipment/models/%5Bid%5D/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/equipment/models/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/equipment/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/inventory/parts/%5Bid%5D/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/inventory/parts/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/labor/%5Bid%5D/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/labor/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/notifications/%5Bid%5D/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/notifications/read-all/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/notifications/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/reports/export/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/scheduler/run/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/api/work-orders/route-aa09182c61802a40.js",
          revision: "aa09182c61802a40",
        },
        {
          url: "/_next/static/chunks/app/error-0b49926ab7537d18.js",
          revision: "0b49926ab7537d18",
        },
        {
          url: "/_next/static/chunks/app/layout-dc04c0ffc5084a7c.js",
          revision: "dc04c0ffc5084a7c",
        },
        {
          url: "/_next/static/chunks/app/page-c742fe197c03e6a0.js",
          revision: "c742fe197c03e6a0",
        },
        {
          url: "/_next/static/chunks/app/profile/page-7c1e140163ea8078.js",
          revision: "7c1e140163ea8078",
        },
        {
          url: "/_next/static/chunks/framework-d7945a8ad0653f37.js",
          revision: "d7945a8ad0653f37",
        },
        {
          url: "/_next/static/chunks/main-app-0d703024ba70bbb9.js",
          revision: "0d703024ba70bbb9",
        },
        {
          url: "/_next/static/chunks/main-c2c83b484192026a.js",
          revision: "c2c83b484192026a",
        },
        {
          url: "/_next/static/chunks/pages/_app-4b3fb5e477a0267f.js",
          revision: "4b3fb5e477a0267f",
        },
        {
          url: "/_next/static/chunks/pages/_error-c970d8b55ace1b48.js",
          revision: "c970d8b55ace1b48",
        },
        {
          url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
          revision: "846118c33b2c0e922d7b3a7676f81f6f",
        },
        {
          url: "/_next/static/chunks/webpack-397a359a6fce367c.js",
          revision: "397a359a6fce367c",
        },
        {
          url: "/_next/static/css/0590eb88ab17e938.css",
          revision: "0590eb88ab17e938",
        },
        {
          url: "/_next/static/css/07c6223ccbc6c22a.css",
          revision: "07c6223ccbc6c22a",
        },
        {
          url: "/_next/static/fJRIkVl4y4DAGtpCiBgF4/_buildManifest.js",
          revision: "edae9f41ef76f48e5c125cd35bb073cb",
        },
        {
          url: "/_next/static/fJRIkVl4y4DAGtpCiBgF4/_ssgManifest.js",
          revision: "b6652df95db52feb4daf4eca35380933",
        },
        {
          url: "/_next/static/media/0aa834ed78bf6d07-s.woff2",
          revision: "324703f03c390d2e2a4f387de85fe63d",
        },
        {
          url: "/_next/static/media/67957d42bae0796d-s.woff2",
          revision: "54f02056e07c55023315568c637e3a96",
        },
        {
          url: "/_next/static/media/7b0b24f36b1a6d0b-s.p.woff2",
          revision: "98ccc2b7f18991a5126a91ac56fbb1fc",
        },
        {
          url: "/_next/static/media/886030b0b59bc5a7-s.woff2",
          revision: "c94e6e6c23e789fcb0fc60d790c9d2c1",
        },
        {
          url: "/_next/static/media/939c4f875ee75fbb-s.woff2",
          revision: "4a4e74bed5809194e4bc6538eb1a1e30",
        },
        {
          url: "/_next/static/media/98848575513c9742-s.woff2",
          revision: "e2b64ddcb351dbe7397e0da426a8c8d6",
        },
        {
          url: "/_next/static/media/bb3ef058b751a6ad-s.p.woff2",
          revision: "782150e6836b9b074d1a798807adcb18",
        },
        {
          url: "/_next/static/media/f911b923c6adde36-s.woff2",
          revision: "0f8d347d49960d05c9430d83e49edeb7",
        },
        {
          url: "/apple-icon.png",
          revision: "00b4974ceafece34cc97e83d69fc0e0e",
        },
        { url: "/icon.png", revision: "00b4974ceafece34cc97e83d69fc0e0e" },
        { url: "/manifest.json", revision: "f897571d42fb847dde69c1ffdc7affce" },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    a.cleanupOutdatedCaches(),
    a.registerRoute(
      "/",
      new a.NetworkFirst({
        cacheName: "start-url",
        plugins: [
          {
            cacheWillUpdate: async ({
              request: a,
              response: e,
              event: s,
              state: i,
            }) =>
              e && "opaqueredirect" === e.type
                ? new Response(e.body, {
                    status: 200,
                    statusText: "OK",
                    headers: e.headers,
                  })
                : e,
          },
        ],
      }),
      "GET"
    ),
    a.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new a.CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      "GET"
    ),
    a.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new a.StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET"
    ),
    a.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new a.StaleWhileRevalidate({
        cacheName: "static-font-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      "GET"
    ),
    a.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new a.StaleWhileRevalidate({
        cacheName: "static-image-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    a.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new a.StaleWhileRevalidate({
        cacheName: "next-image",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    a.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new a.CacheFirst({
        cacheName: "static-audio-assets",
        plugins: [
          new a.RangeRequestsPlugin(),
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    a.registerRoute(
      /\.(?:mp4)$/i,
      new a.CacheFirst({
        cacheName: "static-video-assets",
        plugins: [
          new a.RangeRequestsPlugin(),
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    a.registerRoute(
      /\.(?:js)$/i,
      new a.StaleWhileRevalidate({
        cacheName: "static-js-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    a.registerRoute(
      /\.(?:css|less)$/i,
      new a.StaleWhileRevalidate({
        cacheName: "static-style-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    a.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new a.StaleWhileRevalidate({
        cacheName: "next-data",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    a.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new a.NetworkFirst({
        cacheName: "static-data-assets",
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    a.registerRoute(
      ({ url: a }) => {
        if (!(self.origin === a.origin)) return !1;
        const e = a.pathname;
        return !e.startsWith("/api/auth/") && !!e.startsWith("/api/");
      },
      new a.NetworkFirst({
        cacheName: "apis",
        networkTimeoutSeconds: 10,
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    a.registerRoute(
      ({ url: a }) => {
        if (!(self.origin === a.origin)) return !1;
        return !a.pathname.startsWith("/api/");
      },
      new a.NetworkFirst({
        cacheName: "others",
        networkTimeoutSeconds: 10,
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      "GET"
    ),
    a.registerRoute(
      ({ url: a }) => !(self.origin === a.origin),
      new a.NetworkFirst({
        cacheName: "cross-origin",
        networkTimeoutSeconds: 10,
        plugins: [
          new a.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      "GET"
    );
});
