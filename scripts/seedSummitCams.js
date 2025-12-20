#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEFAULT_DATASET_PATH = path.resolve(__dirname, '../tmp/ford_windsor_cams_first100.json');
const DATASET_PATH = path.resolve(process.env.DATASET_PATH || DEFAULT_DATASET_PATH);
const ENGINE_MAKE = process.env.SEED_ENGINE_MAKE || 'Ford';
const ENGINE_FAMILY = process.env.SEED_ENGINE_FAMILY || 'Ford small block Windsor';
const SEED_NOTE = process.env.SEED_NOTE || 'Seed import: Summit Ford SBF Windsor page 1';
const SOURCE_ID = process.env.SEED_SOURCE_ID || 'summit-ford-small-block-windsor-page1';
const SEED_USER_ID = process.env.SEED_USER_ID || 'seed-bot';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

function readDataset() {
  if (!fs.existsSync(DATASET_PATH)) {
    throw new Error(`Dataset file not found at ${DATASET_PATH}`);
  }
  const text = fs.readFileSync(DATASET_PATH, 'utf-8');
  return JSON.parse(text);
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function parseDurationPair(raw) {
  if (!raw) {
    return { intake: null, exhaust: null };
  }
  const [intVal, exhVal] = raw.split('/').map((part) => part?.trim()).filter(Boolean);
  const intake = Number.isFinite(Number(intVal)) ? Math.round(Number(intVal)) : null;
  const exhaust = Number.isFinite(Number(exhVal)) ? Math.round(Number(exhVal)) : null;
  return { intake, exhaust };
}

function parseLiftPair(raw) {
  if (!raw) {
    return { intake: null, exhaust: null };
  }
  const [intVal, exhVal] = raw.split('/').map((part) => part?.trim()).filter(Boolean);
  const intake = Number.isFinite(Number(intVal)) ? Number(Number(intVal).toFixed(3)) : null;
  const exhaust = Number.isFinite(Number(exhVal)) ? Number(Number(exhVal).toFixed(3)) : null;
  return { intake, exhaust };
}

function buildRow(record) {
  const durations = parseDurationPair(record.duration);
  const lifts = parseLiftPair(record.lift);
  const lsa = toNumber(record.lsa);

  const base = {
    id: crypto.randomUUID(),
    user_id: SEED_USER_ID,
    cam_name: `${record.brand} ${record.part_number}`.trim(),
    brand: record.brand,
    part_number: record.part_number,
    engine_make: ENGINE_MAKE,
    engine_family: ENGINE_FAMILY,
    lsa,
    icl: null,
    rocker_ratio: null,
    duration_int_050: null,
    duration_exh_050: null,
    lift_int: lifts.intake,
    lift_exh: lifts.exhaust,
    advertised_int: null,
    advertised_exh: null,
    lash_int: null,
    lash_exh: null,
    notes: SEED_NOTE,
    cam_card_path: `seed-data/${record.part_number}.txt`,
    dyno_paths: [],
    spec: {
      source: SOURCE_ID,
      dataset_index: record.index,
      duration_type: record.duration_type,
      scraped_at: new Date().toISOString(),
      payload: record,
    },
    status: 'approved',
    rpm_start: null,
    rpm_end: null,
  };

  if (record.duration_type === '@.050') {
    base.duration_int_050 = durations.intake;
    base.duration_exh_050 = durations.exhaust;
  } else if (durations.intake || durations.exhaust) {
    base.advertised_int = durations.intake;
    base.advertised_exh = durations.exhaust;
  }

  return base;
}

async function fetchExistingKeys(client) {
  const { data, error } = await client
    .from('cse_cam_submissions_table')
    .select('part_number, brand');
  if (error) {
    throw error;
  }
  const keys = new Set();
  (data || []).forEach((row) => {
    if (row.part_number && row.brand) {
      keys.add(`${row.brand.toLowerCase()}|${row.part_number.toLowerCase()}`);
    }
  });
  return keys;
}

async function insertRows(client, rows) {
  const chunkSize = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await client.from('cse_cam_submissions_table').insert(chunk);
    if (error) {
      throw error;
    }
    inserted += chunk.length;
  }
  return inserted;
}

async function main() {
  const dataset = readDataset();
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const existingKeys = await fetchExistingKeys(supabase);
  const preparedRows = dataset
    .map((record) => ({ record, key: `${record.brand.toLowerCase()}|${record.part_number.toLowerCase()}` }))
    .filter(({ key }) => !existingKeys.has(key))
    .map(({ record }) => buildRow(record));

  if (!preparedRows.length) {
    console.log('No new cam rows to insert.');
    return;
  }

  const insertedCount = await insertRows(supabase, preparedRows);
  console.log(`Inserted ${insertedCount} cam rows into Supabase.`);
}

main().catch((err) => {
  console.error('Failed to seed summit cams:', err);
  process.exit(1);
});
