import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

await mongoose.connect(process.env.MONGO_URI)
console.log('Connected to MongoDB Atlas')

const db = mongoose.connection.db

// 1. Set CRV 695d7fcc02259d04126cfc55 (VOL0017, 100%) to VALIDE
const crvId1 = new mongoose.Types.ObjectId('695d7fcc02259d04126cfc55')
const r1 = await db.collection('crvs').updateOne(
  { _id: crvId1 },
  { $set: { statut: 'VALIDE', responsableVol: new mongoose.Types.ObjectId('69a72cc044579001349b1b01') } }
)
console.log('VOL0017 → VALIDE:', r1.modifiedCount)

// 2. Set CRV 69aa77ef120fe41975d01d52 (VOL0088) to VALIDE
const crvId2 = new mongoose.Types.ObjectId('69aa77ef120fe41975d01d52')
const r2 = await db.collection('crvs').updateOne(
  { _id: crvId2 },
  { $set: { statut: 'VALIDE' } }
)
console.log('VOL0088 → VALIDE:', r2.modifiedCount)

// Verify
const c1 = await db.collection('crvs').findOne({ _id: crvId1 })
const c2 = await db.collection('crvs').findOne({ _id: crvId2 })
console.log('VOL0017:', c1.statut, '| VOL0088:', c2.statut)

await mongoose.disconnect()
