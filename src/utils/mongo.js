const mongoose = require("mongoose")

async function connectMongo(uri) {
  if (!uri) return false
  try {
    await mongoose.connect(uri, { dbName: "rideshare" })
    return true
  } catch {
    return false
  }
}

module.exports = { mongoose, connectMongo }
