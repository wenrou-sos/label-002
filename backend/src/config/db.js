import mysql from 'mysql2/promise'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '../../..')

function loadEnv() {
  try {
    const envPath = join(rootDir, 'backend', '.env')
    const envContent = readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')
    const env = {}
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        env[key.trim()] = valueParts.join('=').trim()
      }
    }
    return env
  } catch (e) {
    console.warn('Warning: No .env file found, using environment variables')
    return process.env
  }
}

const env = loadEnv()

const dbConfig = {
  host: env.DB_HOST || 'localhost',
  port: parseInt(env.DB_PORT || '3306'),
  user: env.DB_USER || 'root',
  password: env.DB_PASSWORD || 'password',
  database: env.DB_NAME || 'pet_sitting',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

let pool = null

export function createPool(withoutDatabase = false) {
  const config = withoutDatabase 
    ? { ...dbConfig, database: undefined }
    : dbConfig
  pool = mysql.createPool(config)
  return pool
}

export function createTempPool(withoutDatabase = false) {
  const config = withoutDatabase 
    ? { ...dbConfig, database: undefined }
    : dbConfig
  return mysql.createPool(config)
}

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig)
  }
  return pool
}

export async function query(sql, params = []) {
  const pool = getPool()
  const [results] = await pool.query(sql, params)
  return results
}

export async function getConnection() {
  return await getPool().getConnection()
}

export { dbConfig, env }
