import mysql from 'mysql2/promise'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { env } from '../config/db.js'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '../../..')

async function initDatabase() {
  console.log('开始初始化数据库...')

  let connection
  try {
    console.log('连接到 MySQL 服务器...')
    connection = await mysql.createConnection({
      host: env.DB_HOST || 'localhost',
      port: parseInt(env.DB_PORT || '3306'),
      user: env.DB_USER || 'root',
      password: env.DB_PASSWORD || 'password'
    })
    console.log('✓ 成功连接到 MySQL 服务器')

    const dbName = env.DB_NAME || 'pet_sitting'
    console.log(`创建数据库 ${dbName}...`)
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await connection.query(`USE ${dbName}`)
    console.log(`✓ 数据库 ${dbName} 创建成功`)

    console.log('读取 SQL 初始化脚本...')
    const sqlPath = join(rootDir, 'database', 'init.sql')
    const sqlContent = readFileSync(sqlPath, 'utf8')

    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'))

    const dbStatements = statements.filter(s => 
      !s.toUpperCase().startsWith('CREATE DATABASE') && 
      !s.toUpperCase().startsWith('USE ')
    )

    console.log(`执行 ${dbStatements.length} 条 SQL 语句...`)
    for (let i = 0; i < dbStatements.length; i++) {
      const stmt = dbStatements[i]
      try {
        await connection.query(stmt)
        if (stmt.toUpperCase().startsWith('CREATE TABLE')) {
          const match = stmt.match(/CREATE TABLE.*?`(\w+)`/)
          if (match) {
            console.log(`  ✓ 表 ${match[1]} 创建成功`)
          }
        } else if (stmt.toUpperCase().startsWith('INSERT INTO')) {
          const match = stmt.match(/INSERT INTO.*?`(\w+)`/)
          if (match) {
            console.log(`  ✓ 初始数据插入到 ${match[1]}`)
          }
        }
      } catch (e) {
        if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.code === 'ER_DUP_ENTRY') {
          continue
        }
        console.error(`SQL 执行失败 (语句 ${i + 1}):`, stmt.substring(0, 100) + '...')
        throw e
      }
    }

    console.log('更新用户密码为加密格式...')
    const [users] = await connection.query('SELECT id, password FROM users')
    for (const user of users) {
      if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
        continue
      }
      const hashedPassword = await bcrypt.hash(user.password, 10)
      await connection.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id])
      console.log(`  ✓ 用户 ${user.id} 密码已加密`)
    }

    console.log('\n✓✓✓ 数据库初始化完成！✓✓✓')
    console.log('\n默认测试账号：')
    console.log('  寄养人： owner1 / 123456')
    console.log('  寄养人： owner2 / 123456')
    console.log('  照看人： caregiver1 / 123456')
    console.log('  照看人： caregiver2 / 123456')

  } catch (error) {
    console.error('✗ 数据库初始化失败:', error.message)
    console.error('错误详情:', error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

initDatabase()
