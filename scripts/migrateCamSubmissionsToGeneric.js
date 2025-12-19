#!/usr/bin/env node
/**
 * Migrates cam rows that were seeded into cse_cam_submissions_table into the
 * cse_generic_cams catalog, normalizing the required schema fields. The script
 * defaults to dry-run mode; pass --commit to perform inserts and --delete-source
 * to remove migrated rows from cse_cam_submissions_table after a successful
 * insert.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SOURCE_NOTE = process.env.MIGRATE_SOURCE_NOTE || 'Seed import: Summit Ford SBF Windsor page 1';
const DEFAULT_PEAK_HP_RPM = Number(process.env.MIGRATE_DEFAULT_PEAK_HP_RPM || 6200);
const DEFAULT_BOOST_OK = process.env.MIGRATE_DEFAULT_BOOST_OK || 'either';
const SHOULD_COMMIT = process.argv.includes('--commit');
const SHOULD_DELETE_SOURCE = process.argv.includes('--delete-source');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fetchSourceRows() {
  const { data, error } = await supabase
    .from('cse_cam_submissions_table')
    .select('*')
    .eq('notes', SOURCE_NOTE)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

function toFixedNumber(value, digits) {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Number(numeric.toFixed(digits));
}

function buildFamilyTags(make, family) {
  const tags = [];
  if (family) {
    tags.push(family);
  }
  if (make) {
    tags.push(`${make} ${family || ''}`.trim());
  }
  return tags.length ? tags : [];
}

function normalizeRow(row) {
  const durationInt = row.duration_int_050 ?? row.advertised_int;
  const durationExh = row.duration_exh_050 ?? row.advertised_exh;
  const liftInt = row.lift_int;
  const liftExh = row.lift_exh;
  const lsa = row.lsa;

  const missingFields = [];
  if (!durationInt) missingFields.push('duration_int_050');
  if (!durationExh) missingFields.push('duration_exh_050');
  if (!liftInt) missingFields.push('lift_int');
  if (!liftExh) missingFields.push('lift_exh');
  if (!lsa) missingFields.push('lsa');

  if (missingFields.length) {
    return { skipped: true, reason: `Missing ${missingFields.join(', ')}` };
  }

  const peakHpRpm = row.rpm_end || DEFAULT_PEAK_HP_RPM;
  const notes = row.notes || row.spec?.payload?.description || null;

  return {
    skipped: false,
    record: {
      make: row.engine_make,
      family: row.engine_family,
      brand: row.brand,
      pn: row.part_number,
      cam_name: row.cam_name,
      dur_int_050: toFixedNumber(durationInt, 2),
      dur_exh_050: toFixedNumber(durationExh, 2),
      lsa: toFixedNumber(lsa, 2),
      lift_int: toFixedNumber(liftInt, 3),
      lift_exh: toFixedNumber(liftExh, 3),
      peak_hp_rpm: peakHpRpm,
      boost_ok: DEFAULT_BOOST_OK,
      notes,
      source_url: row.spec?.payload?.product_url || null,
      family_tags: buildFamilyTags(row.engine_make, row.engine_family),
    },
  };
}

async function insertGenericRows(rows) {
  const chunkSize = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('cse_generic_cams')
      .upsert(chunk, { onConflict: 'make,family,pn' });

    if (error) {
      throw error;
    }

    inserted += chunk.length;
  }
  return inserted;
}

async function deleteSourceRows(ids) {
  if (!ids.length) {
    return 0;
  }

  const { error } = await supabase
    .from('cse_cam_submissions_table')
    .delete()
    .in('id', ids);

  if (error) {
    throw error;
  }

  return ids.length;
}

async function main() {
  const sourceRows = await fetchSourceRows();
  if (!sourceRows.length) {
    console.log('No seed rows found in cse_cam_submissions_table.');
    return;
  }

  const ready = [];
  const skipped = [];

  sourceRows.forEach((row) => {
    const normalized = normalizeRow(row);
    if (normalized.skipped) {
      skipped.push({ pn: row.part_number, reason: normalized.reason });
      return;
    }
    ready.push({ ...normalized.record, created_at: row.created_at, updated_at: new Date().toISOString() });
  });

  console.table({
    totalSeedRows: sourceRows.length,
    readyForInsert: ready.length,
    skipped: skipped.length,
  });

  if (skipped.length) {
    console.log('Skipped rows:');
    skipped.forEach((entry) => {
      console.log(` - ${entry.pn}: ${entry.reason}`);
    });
  }

  if (!ready.length) {
    console.log('Nothing to insert into cse_generic_cams.');
    return;
  }

  if (!SHOULD_COMMIT) {
    console.log('Dry run complete. Re-run with --commit to write to cse_generic_cams.');
    return;
  }

  const insertedCount = await insertGenericRows(ready);
  console.log(`Inserted/updated ${insertedCount} rows in cse_generic_cams.`);

  if (SHOULD_DELETE_SOURCE) {
    const deleted = await deleteSourceRows(sourceRows.map((row) => row.id));
    console.log(`Deleted ${deleted} rows from cse_cam_submissions_table.`);
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
