import express from 'express'
import puppeteer from 'puppeteer'
import { containsText } from './utils/pupeteer.js'
import { Scraper } from './controllers/Scraper.js'
import { db } from './database/database.js'

const app = express()
const PORT = 3000

db()

app.listen(PORT, () => {
  console.log(`Jobber backend active on port ${PORT}`)
})
