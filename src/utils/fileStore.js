// src/utils/fileStore.js
// Provides atomic read/write helpers for the JSON flat-file "database".
//
// The key safety feature is a per-file async lock (a promise chain).
// Every write operation acquires the lock before reading and writing,
// so concurrent requests cannot interleave their read-modify-write cycles
// and produce lost updates or double-bookings.

const fs = require('fs').promises;
const path = require('path');
const { dataDir } = require('../config');

// Map<filename, Promise> — the tail of each file's lock chain.
const locks = new Map();

/**
 * Acquire an exclusive async lock for a given file.
 * Returns a release function — call it when your critical section is done.
 */
function acquireLock(filename) {
  let release;
  const next = new Promise((resolve) => {
    release = resolve;
  });

  // Chain this operation onto whatever is currently running for this file.
  const previous = locks.get(filename) || Promise.resolve();
  locks.set(filename, previous.then(() => next));

  // Wait for all previous operations to finish, then run ours.
  return previous.then(() => release);
}

function filePath(name) {
  return path.join(dataDir, `${name}.json`);
}

/**
 * Read all records from a JSON file.
 * Returns an empty array if the file doesn't exist yet.
 */
async function readAll(name) {
  try {
    const raw = await fs.readFile(filePath(name), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

/**
 * Overwrite a JSON file with the given array.
 * Uses a temp-file + rename pattern so a crash mid-write never corrupts data.
 */
async function writeAll(name, records) {
  const target = filePath(name);
  const tmp = target + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(records, null, 2), 'utf8');
  await fs.rename(tmp, target);
}

/**
 * Run a callback that receives the current records array and returns a new one.
 * The entire read-modify-write is serialized under the file lock.
 *
 * Example:
 *   const updated = await transaction('rides', (rides) => {
 *     const ride = rides.find(r => r.id === id);
 *     ride.seats -= 1;
 *     return rides;
 *   });
 */
async function transaction(name, fn) {
  const release = await acquireLock(name);
  try {
    const records = await readAll(name);
    const updated = await fn(records);
    if (updated !== undefined) {
      await writeAll(name, updated);
    }
    return updated !== undefined ? updated : records;
  } finally {
    release();
  }
}

module.exports = { readAll, writeAll, transaction };
