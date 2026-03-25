// src/data-access/users.js
// All reads and writes for the users collection go through here.
// Controllers never touch fileStore directly for users.

const { readAll, transaction } = require('../utils/fileStore');
const AppError = require('../utils/AppError');

const FILE = 'users';

async function findAll() {
  return readAll(FILE);
}

async function findById(id) {
  const users = await readAll(FILE);
  return users.find((u) => u.id === id) || null;
}

async function findByEmail(email) {
  const users = await readAll(FILE);
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Create a new user. Throws 409 if the email is already taken.
 */
async function create(userData) {
  return transaction(FILE, (users) => {
    const existing = users.find(
      (u) => u.email.toLowerCase() === userData.email.toLowerCase()
    );
    if (existing) {
      throw new AppError('An account with this email already exists.', 409, 'EMAIL_TAKEN');
    }
    users.push(userData);
    return users;
  }).then(() => userData);
}

/**
 * Update fields on a user by id. Returns the updated user or null.
 */
async function updateById(id, fields) {
  let updated = null;
  await transaction(FILE, (users) => {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return users;
    users[idx] = { ...users[idx], ...fields };
    updated = users[idx];
    return users;
  });
  return updated;
}

module.exports = { findAll, findById, findByEmail, create, updateById };
