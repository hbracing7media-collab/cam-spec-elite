/**
 * Download product images from Texas Speed
 * Run with: npx tsx scripts/download-tsp-images.ts
 * 
 * As an authorized reseller, you have rights to use these images.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'shop', 'power-adders');

// Product URL mappings from Texas Speed
// Format: { localName: texasSpeedProductUrl }
const PRODUCT_URLS: Record<string, string> = {
  // Precision Turbo
  'precision-74-85-sportsman': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-sportsman-74-85-turbo-rated-1400hp/',
  'precision-56-62': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-56-62-turbo-rated-800hp/',
  'precision-66-70-scp': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-scp-cover-66-70-turbo-rated-1100hp/',
  'precision-74-80-sportsman': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-sportsman-74-80-turbo-rated-1475hp/',
  'precision-62-80-sportsman': 'https://www.texas-speed.com/precision-turbo-and-engine-next-r-sportsman-62-80-turbo-rated-1150hp/',
  'precision-68-80-sportsman': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-sportsman-68-80-turbo-1225hp/',
  'precision-68-70-reverse': 'https://www.texas-speed.com/precision-turbo-and-engine-ss-v-band-reverse-rotation-h-cover-next-gen-68-70-turbo-rated-1200hp/',
  'precision-62-66-reverse': 'https://www.texas-speed.com/precision-turbo-and-engine-t3-ss-v-band-reverse-rotation-next-gen-62-66-turbo-rated-925-hp/',
  'precision-68-70-scp': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-scp-cover-68-70-turbo-rated-1200hp/',
  'precision-71-80-sportsman': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-sportsman-71-80-turbo-rated-1300hp/',
  'precision-56-58-reverse': 'https://www.texas-speed.com/precision-turbo-and-engine-t3-ss-v-band-reverse-rotation-next-gen-56-58-turbo-rated-770hp/',
  'precision-80-80-sportsman': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-sportsman-80-80-turbo-1550hp/',
  'precision-68-75-sportsman': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-sportsman-68-75-turbo-rated-1200hp/',
  'precision-64-66-scp': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-scp-cover-64-66-turbo-rated-1000hp/',
  'precision-71-75-sportsman': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-sportsman-71-75-turbo-rated-1275hp/',
  'precision-74-80-sportsman-1375': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-sportsman-74-80-turbo-rated-1375hp/',
  'precision-83-85-sportsman': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-sportsman-83-85-turbo-rated-1700hp/',
  'precision-75-75': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-75-75-turbo-rated-1380hp/',
  'precision-80-85-sportsman': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-sportsman-80-85-turbo-rated-1600hp/',
  'precision-86-85-sportsman': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-sportsman-86-85-turbo-rated-1800hp/',
  'precision-68-85-sportsman': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-sportsman-68-85-turbo-rated-1250hp/',
  'precision-56-58': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-56-58-turbo-rated-770hp/',
  'precision-68-75-scp': 'https://www.texas-speed.com/precision-turbo-and-engine-scp-cover-next-gen-68-75-turbo-rated-1250hp/',
  'precision-74-75-sportsman': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-sportsman-74-75-turbo-rated-1350hp/',
  'precision-64-66-reverse-h': 'https://www.texas-speed.com/precision-turbo-and-engine-t3-ss-v-band-reverse-rotation-h-cover-next-gen-64-66-turbo-rated-1000hp/',
  'precision-60-62': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-60-62-turbo-rated-840hp/',
  'precision-62-66': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-62-66-turbo-rated-925hp/',
  'precision-68-75-h': 'https://www.texas-speed.com/precision-turbo-and-engine-h-cover-next-gen-68-75-turbo-rated-1250hp/',
  'precision-64-66-reverse-scp': 'https://www.texas-speed.com/precision-turbo-and-engine-t3-ss-v-band-reverse-rotation-scp-cover-next-gen-64-66-turbo-rated-1000hp/',
  'precision-66-70-h': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-h-cover-66-70-turbo-rated-1100hp/',
  'precision-76-85-sportsman': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-sportsman-76-85-turbo-rated-1500hp/',
  'precision-68-70-h': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-h-cover-68-70-turbo-rated-1200hp/',
  'precision-68-70-reverse-scp': 'https://www.texas-speed.com/precision-turbo-and-engine-ss-v-band-reverse-rotation-scp-cover-next-gen-68-70-turbo-rated-1200hp/',
  'precision-64-66-hp': 'https://www.texas-speed.com/precision-turbo-and-engine-next-gen-hp-cover-64-66-turbo-rated-1000hp/',
  'pte-discharge-flange': 'https://www.texas-speed.com/pte-074-3029-5-1-4-turbine-discharge-flange-for-large-frame-turbochargers/',
  'pte-50mm-bov': 'https://www.texas-speed.com/pte-50mm-blow-off-valve/',
  'pte-vband-flange': 'https://www.texas-speed.com/pte-074-1030-v-band-flange-for-turbine-inlet-on-a-pte-v-band-inlet-outlet-turbine-housing/',

  // S&B
  'sb-turbo-screen-green': 'https://www.texas-speed.com/s-b-turbo-screen-guard-with-velocity-stack-green/',
  'sb-turbo-screen-red': 'https://www.texas-speed.com/s-b-turbo-screen-guard-with-velocity-stack-red/',
  'sb-turbo-screen-black': 'https://www.texas-speed.com/s-b-turbo-screen-guard-with-velocity-stack-black/',
  'sb-turbo-screen-blue': 'https://www.texas-speed.com/s-b-turbo-screen-guard-with-velocity-stack-blue/',

  // Turbosmart
  'ts-iwg75-disco-potato': 'https://www.texas-speed.com/turbosmart-iwg75-wastegate-actuator-suit-garrett-gt2860rs-disco-potato-5-psi-black/',
  'ts-bov-controller-kit': 'https://www.texas-speed.com/turbosmart-blow-off-valve-controller-kit-genv-raceport-bov-black/',
  'ts-wg40-14psi-blue': 'https://www.texas-speed.com/turbosmart-gen-v-wg40-comp-gate40-14psi-blue/',
  'ts-wg60cg-5psi-black': 'https://www.texas-speed.com/turbosmart-gen-v-wg60cg-power-gate60-compressed-gas-5psi-black/',
  'ts-bov-raceport-red': 'https://www.texas-speed.com/turbosmart-bov-race-port-gen-v-red/',
  'ts-ts2-7170': 'https://www.texas-speed.com/turbosmart-ts-2-performance-turbocharger-water-cooled-7170-kompact-v-band-0-96ar-externally-wastegated/',
  'ts-raceport-plumback-sleeper-sc': 'https://www.texas-speed.com/turbosmart-genv-raceport-plumback-valve-sleeper-female-suit-supercharger/',
  'ts-ts2-6466-iwg': 'https://www.texas-speed.com/turbosmart-ts-2-performance-turbocharger-water-cooled-6466-v-band-0-82ar-internally-wastegated/',
  'ts-proport-sleeper': 'https://www.texas-speed.com/turbosmart-genv-proport-bov-sleeper/',
  'ts-wg60cg-5psi-blue': 'https://www.texas-speed.com/turbosmart-gen-v-wg60cg-power-gate60-compressed-gas-5psi-blue/',
  'ts-big-bubba': 'https://www.texas-speed.com/turbosmart-big-bubba-bpv-by-pass-valve-bov-sleeper/',
  'ts-bov-raceport-female-purple': 'https://www.texas-speed.com/turbosmart-bov-race-port-female-gen-v-purple-fits-cometitors-flange-no-weld-flange/',
  'ts-iwg75-twin-port': 'https://www.texas-speed.com/turbosmart-iwg75-twin-port-universal-wastegate-actuator-unf-14psi/',
  'ts-raceport-sc-black': 'https://www.texas-speed.com/turbosmart-genv-raceport-bov-suit-supercharger-black/',
  'ts-ts1-7880-vband': 'https://www.texas-speed.com/turbosmart-ts-1-performance-turbocharger-7880-v-band-0-96ar-externally-wastegated/',
  'ts-ts1-6870-kompact': 'https://www.texas-speed.com/turbosmart-ts-1-performance-turbocharger-6870-kompact-v-band-0-96ar-externally-wastegated/',
  'ts-ts1-6262-reverse': 'https://www.texas-speed.com/turbosmart-ts-1-performance-turbocharger-6262-v-band-0-82ar-externally-wastegated-reversed-rotation/',
  'ts-opr-4an-kit': 'https://www.texas-speed.com/turbosmart-opr-4-an-fitting-kit-clear/',
  'ts-wg40-14psi-black': 'https://www.texas-speed.com/turbosmart-gen-v-wg40-comp-gate40-14psi-black/',
  'ts-ts1-7880-t4': 'https://www.texas-speed.com/turbosmart-ts-1-performance-turbocharger-7880-t4-0-96ar-externally-wastegated/',

  // Additional Turbosmart
  'ts-ebg50': 'https://www.texas-speed.com/turbosmart-ebg50-electronic-boostgate-50-charge-air-valve/',
  'ts-fpr800': 'https://www.texas-speed.com/turbosmart-fuel-pressure-regulator-800-1-8-npt-black/',
  'ts-raceport-plumback-sleeper': 'https://www.texas-speed.com/turbosmart-genv-raceport-plumback-valve-sleeper/',
  'ts-ts1-6262': 'https://www.texas-speed.com/turbosmart-ts-1-performance-turbocharger-6262-v-band-0-82ar-externally-wastegated/',
  'ts-bov-raceport-female-sleeper': 'https://www.texas-speed.com/turbosmart-bov-raceport-female-genv-sleeper/',
  'ts-proport-black': 'https://www.texas-speed.com/turbosmart-genv-proport-bov-black/',
  'ts-raceport-em-sleeper': 'https://www.texas-speed.com/turbosmart-genv-raceport-em-valve-sleeper/',
  'ts-ts1-6466': 'https://www.texas-speed.com/turbosmart-ts-1-performance-turbocharger-6466-v-band-0-82ar-externally-wastegated/',
  'ts-ts1-5862': 'https://www.texas-speed.com/turbosmart-ts-1-performance-turbocharger-5862-v-band-0-82ar-externally-wastegated/',
  'ts-ts2-6262-iwg': 'https://www.texas-speed.com/turbosmart-ts-2-performance-turbocharger-water-cooled-6262-v-band-0-82ar-internally-wastegated/',
  'ts-ts1-6870-t4': 'https://www.texas-speed.com/turbosmart-ts-1-performance-turbocharger-6870-kompact-t4-0-96ar-externally-wastegated/',
  'ts-ts1-5862-t3': 'https://www.texas-speed.com/turbosmart-ts-1-performance-turbocharger-5862-t3-0-63ar-externally-wastegated/',
  'ts-opr-t40-black': 'https://www.texas-speed.com/turbosmart-opr-t40-40psi-black/',
  'ts-ts1-7675-t4': 'https://www.texas-speed.com/turbosmart-ts-1-performance-turbocharger-7675-t4-0-96ar-externally-wastegated/',
  'ts-oil-filter': 'https://www.texas-speed.com/turbosmart-billet-turbo-oil-feed-filter-44um-4an-black/',
  'ts-bov-raceport-female-red': 'https://www.texas-speed.com/turbosmart-bov-race-port-female-gen-v-red-fits-cometitors-flange-no-weld-flange/',
  'ts-bov-raceport-purple': 'https://www.texas-speed.com/turbosmart-bov-race-port-gen-v-purple/',
  'ts-wg60-14psi-blue': 'https://www.texas-speed.com/turbosmart-gen-v-wg60-power-gate60-14psi-blue/',
  'ts-ts2-6262-ewg': 'https://www.texas-speed.com/turbosmart-ts-2-performance-turbocharger-water-cooled-6262-v-band-0-82ar-externally-wastegated/',
  'ts-opr-t40-blue': 'https://www.texas-speed.com/turbosmart-opr-t40-40psi-blue/',
  'ts-ts1-7675-vband': 'https://www.texas-speed.com/turbosmart-ts-1-performance-turbocharger-7675-v-band-0-96ar-externally-wastegated/',
  'ts-powerport-black': 'https://www.texas-speed.com/turbosmart-powerport-bov-black/',
  'ts-fpr2000': 'https://www.texas-speed.com/turbosmart-fuel-pressure-regulator-2000-8an-black/',
  'ts-eboost-street': 'https://www.texas-speed.com/turbosmart-e-boost-street-40psi/',
  'ts-ts1-6466-reverse': 'https://www.texas-speed.com/turbosmart-ts-1-performance-turbocharger-6466-v-band-0-82ar-externally-wastegated-reversed-rotation/',
  'ts-wg45-14psi-black': 'https://www.texas-speed.com/turbosmart-gen-v-wg45-hyper-gate45-14psi-black/',
  'ts-ts2-6466-ewg': 'https://www.texas-speed.com/turbosmart-ts-2-performance-turbocharger-water-cooled-6466-v-band-0-82ar-externally-wastegated/',
  'ts-eb2-solenoid': 'https://www.texas-speed.com/turbosmart-eb2-4-port-solenoid/',
  'ts-fpr1200': 'https://www.texas-speed.com/turbosmart-fuel-pressure-regular-1200-6an-black/',
  'ts-wg45-14psi-blue': 'https://www.texas-speed.com/turbosmart-gen-v-wg45-hyper-gate45-14psi-blue/',
  'ts-eboost2': 'https://www.texas-speed.com/turbosmart-eboost2-60mm-black/',
  'ts-opr-v2': 'https://www.texas-speed.com/turbosmart-opr-v2-turbo-oil-pressure-regulator/',
  'ts-bov-raceport-female-black': 'https://www.texas-speed.com/turbosmart-bov-race-port-female-gen-v-black-fits-cometitors-flange-no-weld-flange/',
  'ts-bov-raceport-blue': 'https://www.texas-speed.com/turbosmart-bov-race-port-gen-v-blue/',
  'ts-raceport-sleeper': 'https://www.texas-speed.com/turbosmart-genv-raceport-bov-sleeper/',
  'ts-bov-raceport-female-blue': 'https://www.texas-speed.com/turbosmart-bov-race-port-female-gen-v-blue-fits-cometitors-flange-no-weld-flange/',
  'ts-wg50-14psi-blue': 'https://www.texas-speed.com/turbosmart-gen-v-wg50-pro-gate50-14psi-blue/',
  'ts-wg60-14psi-black': 'https://www.texas-speed.com/turbosmart-gen-v-wg60-power-gate60-14psi-black/',
  'ts-bov-raceport-black': 'https://www.texas-speed.com/turbosmart-bov-race-port-gen-v-black/',

  // VS Racing
  'vs-4-113mm': 'https://www.texas-speed.com/vs-racing-4-113mm-billet-t6-1-24-turbo/',
  'vs-80mm': 'https://www.texas-speed.com/vs-racing-80mm-billet-t6-1-32ar/',
  'vs-7875-next-gen': 'https://www.texas-speed.com/vs-racing-next-gen-7875-billet-96ar-turbo/',
  'vs-85mm': 'https://www.texas-speed.com/vs-racing-85mm-billet-slip-fit-1-32ar-t6/',
  'vs-50mm-bov': 'https://www.texas-speed.com/vs-racing-50mm-bov/',
  'vs-88-103mm': 'https://www.texas-speed.com/vs-racing-88-103-mm-next-gen-billet/',
  'vs-gen3-7875': 'https://www.texas-speed.com/vs-racing-gen3-7875-billet-96ar-t4/',
  'vs-70-70': 'https://www.texas-speed.com/vs-racing-70-70-billet-t4-96ar-t4/',
  'vs-67-66': 'https://www.texas-speed.com/vs-racing-67-66-billet-t4/',
  'vs-7875-t51r': 'https://www.texas-speed.com/vs-racing-7875-billet-t51r-96ar-or-1-25-ar-options-reverse-options/',

  // Dirty Dingo
  'dirty-dingo-oil-feed': 'https://www.texas-speed.com/dirty-dingo-ls-turbo-oil-feed-kit/',

  // Procharger
  'procharger-race-valve-steel': 'https://www.texas-speed.com/procharger-race-valve-open-with-steel-flange/',
  'procharger-race-valve-aluminum': 'https://www.texas-speed.com/procharger-race-valve-open-with-mounting-hardware-aluminum-flange/',

  // ICT Billet
  'ict-oil-adapter': 'https://www.texas-speed.com/ict-billet-ls-turbo-oil-supply-feed-adapter-port-m16-1-5-to-4an-fitting-lsx-ls1-ls3-ls2/',
  'ict-oil-line-48': 'https://www.texas-speed.com/ict-billet-steel-braided-turbo-oil-feed-line-48-length-hose-4an-90-degree-straight/',
  'ict-oil-line-60': 'https://www.texas-speed.com/ict-billet-steel-braided-turbo-oil-feed-line-60-length-hose-4an-90-degree-straight/',
};

async function fetchPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          fetchPage(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function extractImageUrl(html: string): string | null {
  // Look for main product image
  const patterns = [
    /data-magic-slide-id="[^"]*"\s*href="([^"]+\.(?:jpg|png|webp))"/i,
    /<img[^>]+class="[^"]*gallery-placeholder__image[^"]*"[^>]+src="([^"]+)"/i,
    /<meta\s+property="og:image"\s+content="([^"]+)"/i,
    /product-image-photo[^>]+src="([^"]+)"/i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

async function downloadImage(url: string, filename: string): Promise<boolean> {
  return new Promise((resolve) => {
    const filepath = path.join(OUTPUT_DIR, filename);
    
    // Handle relative URLs
    let fullUrl = url;
    if (url.startsWith('//')) {
      fullUrl = 'https:' + url;
    } else if (!url.startsWith('http')) {
      fullUrl = 'https://www.texas-speed.com' + url;
    }

    const protocol = fullUrl.startsWith('https') ? https : require('http');
    
    protocol.get(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res: any) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectUrl = res.headers.location;
        if (redirectUrl) {
          downloadImage(redirectUrl, filename).then(resolve);
          return;
        }
      }
      
      if (res.statusCode !== 200) {
        console.log(`  ✗ Failed to download (${res.statusCode}): ${fullUrl}`);
        resolve(false);
        return;
      }

      const file = fs.createWriteStream(filepath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`  ✓ Downloaded: ${filename}`);
        resolve(true);
      });
      file.on('error', () => {
        fs.unlink(filepath, () => {});
        resolve(false);
      });
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Texas Speed Product Image Downloader');
  console.log('=====================================\n');
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results: { key: string; success: boolean; imagePath?: string }[] = [];
  const entries = Object.entries(PRODUCT_URLS);
  
  for (let i = 0; i < entries.length; i++) {
    const [key, url] = entries[i];
    console.log(`[${i + 1}/${entries.length}] Processing: ${key}`);
    
    try {
      const html = await fetchPage(url);
      const imageUrl = extractImageUrl(html);
      
      if (imageUrl) {
        const ext = imageUrl.match(/\.(jpg|png|webp)/i)?.[1] || 'jpg';
        const filename = `${key}.${ext}`;
        const success = await downloadImage(imageUrl, filename);
        results.push({ key, success, imagePath: success ? `/shop/power-adders/${filename}` : undefined });
      } else {
        console.log(`  ✗ No image found on page`);
        results.push({ key, success: false });
      }
    } catch (err) {
      console.log(`  ✗ Error: ${err}`);
      results.push({ key, success: false });
    }
    
    // Rate limiting - be nice to their server
    await delay(500);
  }

  console.log('\n=====================================');
  console.log('Summary:');
  const successful = results.filter(r => r.success).length;
  console.log(`  Downloaded: ${successful}/${results.length}`);
  
  // Output the image mapping for updating the products
  console.log('\n// Add these to your products:\n');
  console.log('const IMAGE_PATHS: Record<string, string> = {');
  for (const r of results.filter(r => r.success)) {
    console.log(`  '${r.key}': '${r.imagePath}',`);
  }
  console.log('};');
}

main().catch(console.error);
