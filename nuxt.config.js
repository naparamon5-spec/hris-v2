export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  // The app manifest is unused here and its virtual import fails to resolve in dev after a production build.
  experimental: { appManifest: false },
  css: ['~/assets/css/main.css'],
  app: {
    pageTransition: false,
    layoutTransition: false,
    head: {
      title: 'ANI HRIS',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap' }
      ]
    }
  }
})
