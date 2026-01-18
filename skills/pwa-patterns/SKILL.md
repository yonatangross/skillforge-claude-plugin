---
name: pwa-patterns
description: Progressive Web App patterns with Workbox 7.x, service worker lifecycle, offline-first strategies, and installability
tags: [pwa, service-worker, workbox, offline-first, cache-api, push-notifications, manifest, installable]
context: fork
agent: frontend-ui-developer
version: 1.0.0
author: SkillForge
user-invocable: false
---

# PWA Patterns

Progressive Web App patterns using Workbox 7.x for service worker management, offline-first strategies, and app-like experiences.

## When to Use

- Building offline-capable web applications
- Implementing caching strategies for performance
- Creating installable web apps
- Adding push notifications
- Background sync for offline form submissions
- Precaching critical assets

## Service Worker Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Installing │ -> │   Waiting   │ -> │   Active    │
└─────────────┘    └─────────────┘    └─────────────┘
      │                   │                   │
      │ install event     │ activated         │ fetch events
      │ (precache)        │ when old SW       │ (runtime cache)
      │                   │ is gone           │
```

## Workbox Patterns

### 1. Generate Service Worker (Build Tool)

```javascript
// build-sw.js (Node.js)
const { generateSW } = require('workbox-build');

async function buildServiceWorker() {
  const { count, size } = await generateSW({
    globDirectory: 'dist/',
    globPatterns: ['**/*.{html,js,css,png,jpg,json,woff2}'],
    globIgnores: ['**/node_modules/**', '**/*.map'],
    swDest: 'dist/sw.js',

    // Take control immediately
    clientsClaim: true,
    skipWaiting: true,

    // Offline navigation fallback
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api\//],

    // Runtime caching strategies
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.example\.com\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 300, // 5 minutes
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  });

  console.log(`Generated SW: ${count} files, ${size} bytes`);
}

buildServiceWorker();
```

### 2. Workbox Recipes (Simplified)

**Note:** For production, use the build tool approach (Section 1) or `workbox-webpack-plugin`/`vite-plugin-pwa`. The CDN approach below is for prototyping only.

```javascript
// sw.js (prototyping only - use build tool for production)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Google Fonts caching
workbox.recipes.googleFontsCache();

// Image caching with expiration
workbox.recipes.imageCache({
  cacheName: 'images',
  maxEntries: 60,
  maxAgeSeconds: 30 * 24 * 60 * 60,
});

// HTML pages (network-first)
workbox.recipes.pageCache({
  cacheName: 'pages',
  networkTimeoutSeconds: 3,
});

// Static resources (cache-first)
workbox.recipes.staticResourceCache({
  cacheName: 'static',
});

// Offline fallback page
workbox.recipes.offlineFallback({
  pageFallback: '/offline.html',
  imageFallback: '/images/offline.svg',
});

// Warm cache on install
workbox.recipes.warmStrategyCache({
  urls: ['/index.html', '/styles.css', '/app.js'],
  strategy: new workbox.strategies.CacheFirst(),
});

workbox.core.skipWaiting();
workbox.core.clientsClaim();
```

### 3. Caching Strategies

```javascript
// sw.js - Custom strategies (prototyping only - use build tool for production)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const { registerRoute } = workbox.routing;
const { CacheFirst, NetworkFirst, StaleWhileRevalidate, NetworkOnly } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;

// CacheFirst: Static assets that rarely change
registerRoute(
  /\.(?:js|css|woff2)$/,
  new CacheFirst({
    cacheName: 'static-v1',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// NetworkFirst: API calls (fresh data preferred)
registerRoute(
  /\/api\//,
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// StaleWhileRevalidate: User avatars, non-critical images
registerRoute(
  /\/avatars\//,
  new StaleWhileRevalidate({
    cacheName: 'avatars',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
      }),
    ],
  })
);

// NetworkOnly: Auth endpoints
registerRoute(
  /\/auth\//,
  new NetworkOnly()
);
```

### 4. Precaching with Manifest

```javascript
// sw.js with inject manifest
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';

// Injected by build tool
precacheAndRoute(self.__WB_MANIFEST);

// Clean old caches
cleanupOutdatedCaches();
```

```javascript
// vite.config.ts with VitePWA
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
            },
          },
        ],
      },
      manifest: {
        name: 'My PWA App',
        short_name: 'MyPWA',
        theme_color: '#4f46e5',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

## Web App Manifest

```json
// manifest.json
{
  "name": "My Progressive Web App",
  "short_name": "MyPWA",
  "description": "An example PWA with offline support",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4f46e5",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

## React Integration

### Service Worker Registration

```tsx
// src/registerSW.ts
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available
              showUpdateNotification();
            }
          });
        });

        console.log('SW registered:', registration.scope);
      } catch (error) {
        console.error('SW registration failed:', error);
      }
    });
  }
}
```

### Install Prompt Hook

```tsx
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);

    if (outcome === 'accepted') {
      setIsInstalled(true);
      return true;
    }
    return false;
  };

  return { canInstall: !!installPrompt, isInstalled, promptInstall };
}

// Usage
function InstallButton() {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt();

  if (isInstalled || !canInstall) return null;

  return (
    <button onClick={promptInstall}>
      Install App
    </button>
  );
}
```

### Offline Status Hook

```tsx
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Usage
function App() {
  const isOnline = useOnlineStatus();

  return (
    <>
      {!isOnline && (
        <div className="bg-yellow-100 p-2 text-center">
          You're offline. Some features may be unavailable.
        </div>
      )}
      {/* App content */}
    </>
  );
}
```

## Background Sync

```javascript
// sw.js
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly } from 'workbox-strategies';

const bgSyncPlugin = new BackgroundSyncPlugin('formQueue', {
  maxRetentionTime: 24 * 60, // 24 hours
});

registerRoute(
  /\/api\/forms/,
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);
```

## Anti-Patterns (FORBIDDEN)

```javascript
// ❌ NEVER: Cache everything with no expiration
registerRoute(
  /.*/,
  new CacheFirst() // Storage bloat!
);

// ❌ NEVER: Skip service worker update checks
self.addEventListener('install', () => {
  self.skipWaiting(); // ✅ OK
});
// Without also using clientsClaim, old tabs stay on old SW

// ❌ NEVER: Cache authentication tokens
registerRoute(
  /\/api\/auth\/token/,
  new CacheFirst() // Security risk!
);

// ❌ NEVER: Precache dynamic content
precacheAndRoute([
  '/api/user/profile', // Changes frequently!
]);

// ❌ NEVER: Forget offline fallback for navigation
// Users see browser error page

// ❌ NEVER: Cache POST responses
registerRoute(
  /\/api\//,
  new CacheFirst(),
  'POST' // POST should be NetworkOnly
);
```

## PWA Checklist

- [ ] Service worker registered
- [ ] Manifest with icons (192px + 512px maskable)
- [ ] HTTPS enabled
- [ ] Offline page works
- [ ] Responsive design
- [ ] Fast First Contentful Paint (< 1.8s)
- [ ] installability criteria met
- [ ] Push notifications permission handling

## Key Decisions

| Decision | Option A | Option B | Recommendation |
|----------|----------|----------|----------------|
| SW generator | generateSW | injectManifest | **generateSW** for simple apps, **injectManifest** for custom logic |
| API caching | NetworkFirst | StaleWhileRevalidate | **NetworkFirst** for critical data |
| Static assets | CacheFirst | StaleWhileRevalidate | **CacheFirst** with versioned filenames |
| Update strategy | Auto update | Prompt user | **Prompt** for major changes |

## Related Skills

- `caching-strategies` - Backend caching patterns
- `core-web-vitals` - Performance metrics
- `edge-computing-patterns` - Edge caching

## Capability Details

### service-worker-lifecycle
**Keywords**: install, activate, fetch, update, skipWaiting
**Solves**: Understanding service worker states and updates

### offline-strategies
**Keywords**: CacheFirst, NetworkFirst, StaleWhileRevalidate
**Solves**: Choosing the right caching strategy

### workbox-patterns
**Keywords**: Workbox, recipes, precache, runtimeCaching
**Solves**: Service worker generation and caching

### push-notifications
**Keywords**: push, notification, subscribe, VAPID
**Solves**: Implementing web push notifications

### installability
**Keywords**: manifest, beforeinstallprompt, add to home
**Solves**: Making the app installable

## References

- `references/service-worker-lifecycle.md` - SW lifecycle details
- `references/workbox-strategies.md` - Caching strategy guide
- `references/offline-data-sync.md` - Background sync patterns
- `templates/sw.ts` - Service worker template
