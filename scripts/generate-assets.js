import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const assetsOgDir = path.resolve('assets/og');
const publicAssetsOgDir = path.resolve('public/assets/og');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(assetsOgDir)) fs.mkdirSync(assetsOgDir, { recursive: true });
if (!fs.existsSync(publicAssetsOgDir)) fs.mkdirSync(publicAssetsOgDir, { recursive: true });

// SVG Favicon with the signature SYNCROZZ Link emerald badge
const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181B" />
      <stop offset="100%" stop-color="#09090B" />
    </linearGradient>
    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <!-- Background squircle -->
  <rect x="4" y="4" width="92" height="92" rx="24" fill="url(#bgGrad)" stroke="#27272A" stroke-width="3"/>
  <!-- Glowing Link Icon -->
  <g transform="translate(25, 25) scale(2.1)" stroke="url(#emeraldGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#glow)">
    <path d="M9 17H7A5 5 0 0 1 7 7h2" />
    <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </g>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgFavicon, 'utf8');

// Find generated images
const imagesDir = path.resolve('src/assets/images');
const files = fs.readdirSync(imagesDir);
const ogSource = files.find(f => f.startsWith('syncrozz_link_og_'));
const iconSource = files.find(f => f.startsWith('syncrozz_icon_'));

async function buildAssets() {
  console.log('Generating PWA and Open Graph assets...');

  // 1. Process Open Graph Images (1200x630)
  if (ogSource) {
    const ogPath = path.join(imagesDir, ogSource);
    const ogBuffer = await sharp(ogPath)
      .resize(1200, 630, { fit: 'cover', position: 'center' })
      .png({ quality: 95, compressionLevel: 8 })
      .toBuffer();

    fs.writeFileSync(path.join(publicDir, 'og-image.png'), ogBuffer);
    fs.writeFileSync(path.join(assetsOgDir, 'syncrozz-link-og.png'), ogBuffer);
    fs.writeFileSync(path.join(publicAssetsOgDir, 'syncrozz-link-og.png'), ogBuffer);
    console.log('✓ Created 1200x630 OG image in public/ and assets/og/');
  }

  // 2. Process App Icons (from iconSource or fallback to high-res SVG render)
  let baseIconBuffer;
  if (iconSource) {
    baseIconBuffer = path.join(imagesDir, iconSource);
  } else {
    baseIconBuffer = Buffer.from(svgFavicon);
  }

  // 192x192
  await sharp(baseIconBuffer)
    .resize(192, 192, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  // 512x512
  await sharp(baseIconBuffer)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // 180x180 Apple Touch Icon
  await sharp(baseIconBuffer)
    .resize(180, 180, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 32x32 Favicon PNG
  await sharp(baseIconBuffer)
    .resize(32, 32, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon-32x32.png'));

  // 16x16 Favicon PNG
  await sharp(baseIconBuffer)
    .resize(16, 16, { fit: 'cover' })
    .png()
    .toFile(path.join(publicDir, 'favicon-16x16.png'));

  // Maskable icons (with 10% padding safe zone on dark background)
  const maskable192 = await sharp({
    create: {
      width: 192,
      height: 192,
      channels: 4,
      background: { r: 10, g: 10, b: 11, alpha: 1 }
    }
  })
    .composite([{
      input: await sharp(baseIconBuffer).resize(150, 150, { fit: 'cover' }).toBuffer(),
      gravity: 'center'
    }])
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-192.png'));

  const maskable512 = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 10, g: 10, b: 11, alpha: 1 }
    }
  })
    .composite([{
      input: await sharp(baseIconBuffer).resize(410, 410, { fit: 'cover' }).toBuffer(),
      gravity: 'center'
    }])
    .png()
    .toFile(path.join(publicDir, 'icon-maskable-512.png'));

  console.log('✓ All PWA & Favicon icons successfully generated in public/ directory.');
}

buildAssets().catch(console.error);
