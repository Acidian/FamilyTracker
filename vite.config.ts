import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({base:'./',plugins:[react(),VitePWA({registerType:'prompt',includeAssets:['icon.svg','icon-192.png','icon-512.png'],manifest:{name:'Nightlight Family',short_name:'Nightlight',description:'Family life, together.',theme_color:'#111a2e',background_color:'#111a2e',display:'standalone',start_url:'./',icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png'},{src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]},workbox:{globPatterns:['**/*.{js,css,html,svg,png,woff2}'],navigateFallback:'index.html'}})]});
