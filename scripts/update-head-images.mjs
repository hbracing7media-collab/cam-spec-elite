// Run SQL updates for cylinder head images
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env.local manually
const envFile = readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      // Remove surrounding quotes if present
      let val = trimmed.slice(idx + 1);
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[trimmed.slice(0, idx)] = val;
    }
  }
});

console.log('URL:', env.SUPABASE_URL?.slice(0,30) + '...');
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function updateImages() {
  console.log('Updating SBC heads...');
  const { data: sbc, error: sbcErr } = await supabase
    .from('cse_parts_products')
    .update({ image_url: '/shop/SBC-heads-AFR.webp' })
    .eq('category', 'cylinder_head')
    .eq('engine_family', 'Small Block Chevy')
    .select('part_number');
  
  if (sbcErr) console.error('SBC error:', sbcErr);
  else console.log(`✓ Updated ${sbc.length} SBC heads`);

  console.log('Updating SBF heads...');
  const { data: sbf, error: sbfErr } = await supabase
    .from('cse_parts_products')
    .update({ image_url: '/shop/SBF-Heads-AFR.png' })
    .eq('category', 'cylinder_head')
    .eq('engine_family', 'Small Block Windsor')
    .select('part_number');
  
  if (sbfErr) console.error('SBF error:', sbfErr);
  else console.log(`✓ Updated ${sbf.length} SBF heads`);

  console.log('Done!');
}

updateImages();
