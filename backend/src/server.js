import fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { env, createTempPool, query } from './config/db.js'
import authPlugin from './plugins/auth.js'
import authRoutes from './routes/auth.js'
import petRoutes from './routes/pets.js'
import orderRoutes from './routes/orders.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '../../..')

const server = fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
})

async function ensureDatabaseAndTables() {
  try {
    server.log.info('检查数据库连接...')
    const initPool = createPool({ withoutDatabase: true, isGlobal: false })
    await initPool.query('SELECT 1')
    server.log.info('✓ 数据库连接成功')

    try {
      await initPool.query(`USE ${env.DB_NAME || 'pet_sitting'}`)
      server.log.info(`✓ 数据库 ${env.DB_NAME || 'pet_sitting'} 存在`)
    } catch (e) {
      if (e.code === 'ER_BAD_DB_ERROR') {
        server.log.info('数据库不存在，开始自动初始化...')
        const initScriptPath = join(rootDir, 'database', 'init.sql')
        const initSql = readFileSync(initScriptPath, 'utf8')
        const statements = initSql
          .split(';')
          .map(s => s.trim())
          .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'))

        for (const stmt of statements) {
          try {
            await initPool.query(stmt)
          } catch (err) {
            if (err.code !== 'ER_TABLE_EXISTS_ERROR' && err.code !== 'ER_DUP_ENTRY') {
              server.log.warn('SQL warning:', err.message)
            }
          }
        }
        server.log.info('✓ 数据库初始化完成')
      } else {
        throw e
      }
    }

    const [tables] = await initPool.query('SHOW TABLES')
    server.log.info(`✓ 数据库包含 ${tables.length} 个表`)

    const [[userCount]] = await initPool.query('SELECT COUNT(*) as count FROM users')
    server.log.info(`✓ 已有 ${userCount.count} 个用户`)

    const [[petCount]] = await initPool.query('SELECT COUNT(*) as count FROM pets')
    server.log.info(`✓ 已有 ${petCount.count} 只宠物`)

    const [[orderCount]] = await initPool.query('SELECT COUNT(*) as count FROM orders')
    server.log.info(`✓ 已有 ${orderCount.count} 个订单`)

    await initPool.end()

  } catch (error) {
    server.log.error('数据库连接失败:', error.message)
    server.log.error('请确保 MySQL 服务已启动，并且密码设置为 "password"')
    server.log.error('或者运行: cd backend && npm run init:db 手动初始化数据库')
    throw error
  }
}

async function start() {
  try {
    await ensureDatabaseAndTables()

    await server.register(cors, {
      origin: true,
      credentials: true
    })

    await server.register(jwt, {
      secret: env.JWT_SECRET || 'pet-sitting-jwt-secret-key-2026'
    })

    await server.register(authPlugin)

    await server.register(authRoutes)
    await server.register(petRoutes)
    await server.register(orderRoutes)

    server.get('/api/health', async function (request, reply) {
      return { code: 200, message: 'OK', data: { status: 'running', timestamp: new Date().toISOString() } }
    })

    server.setErrorHandler(function (error, request, reply) {
      server.log.error(error)
      if (error.validation) {
        return reply.status(400).send({
          code: 400,
          message: error.validation[0].message || '参数错误',
          data: null
        })
      }
      return reply.status(error.statusCode || 500).send({
        code: error.statusCode || 500,
        message: error.message || '服务器内部错误',
        data: null
      })
    })

    const port = parseInt(env.PORT || '3000')
    await server.listen({ port, host: '0.0.0.0' })
    server.log.info(`\n🚀 后端服务已启动: http://localhost:${port}`)
    server.log.info(`📊 API 健康检查: http://localhost:${port}/api/health`)
    server.log.info(`\n📋 测试账号:`)
    server.log.info(`   寄养人: owner1 / 123456`)
    server.log.info(`   寄养人: owner2 / 123456`)
    server.log.info(`   照看人: caregiver1 / 123456`)
    server.log.info(`   照看人: caregiver2 / 123456`)

  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
