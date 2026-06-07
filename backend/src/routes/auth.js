import bcrypt from 'bcryptjs'
import { query } from '../config/db.js'
import { authenticate } from '../plugins/auth.js'

export default async function authRoutes(fastify, options) {
  fastify.post('/api/auth/register', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password', 'email', 'role', 'name'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          password: { type: 'string', minLength: 6, maxLength: 50 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          role: { type: 'string', enum: ['owner', 'caregiver'] },
          name: { type: 'string', minLength: 2, maxLength: 50 },
          address: { type: 'string' },
          bio: { type: 'string' }
        }
      }
    }
  }, async function (request, reply) {
    const { username, password, email, phone, role, name, address, bio } = request.body

    const [existingUser] = await query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email])
    if (existingUser) {
      return reply.status(400).send({ code: 400, message: '用户名或邮箱已存在', data: null })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const result = await query(
      'INSERT INTO users (username, password, email, phone, role, name, address, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, email, phone, role, name, address, bio]
    )

    const userId = result.insertId

    const token = fastify.jwt.sign(
      { id: userId, username, role, name },
      { expiresIn: '7d' }
    )

    return reply.send({
      code: 200,
      message: '注册成功',
      data: {
        token,
        user: { id: userId, username, email, phone, role, name, address, bio }
      }
    })
  })

  fastify.post('/api/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string' },
          password: { type: 'string' }
        }
      }
    }
  }, async function (request, reply) {
    const { username, password } = request.body

    const [user] = await query(
      'SELECT id, username, password, email, phone, role, name, address, bio, avatar, created_at FROM users WHERE username = ?',
      [username]
    )

    if (!user) {
      return reply.status(401).send({ code: 401, message: '用户名或密码错误', data: null })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return reply.status(401).send({ code: 401, message: '用户名或密码错误', data: null })
    }

    const token = fastify.jwt.sign(
      { id: user.id, username: user.username, role: user.role, name: user.name },
      { expiresIn: '7d' }
    )

    const { password: _, ...userWithoutPassword } = user

    return reply.send({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: userWithoutPassword
      }
    })
  })

  fastify.get('/api/auth/profile', {
    preHandler: [authenticate]
  }, async function (request, reply) {
    const userId = request.user.id

    const [user] = await query(
      'SELECT id, username, email, phone, role, name, address, bio, avatar, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    )

    if (!user) {
      return reply.status(404).send({ code: 404, message: '用户不存在', data: null })
    }

    return reply.send({
      code: 200,
      message: '获取成功',
      data: user
    })
  })

  fastify.put('/api/auth/profile', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          name: { type: 'string', minLength: 2, maxLength: 50 },
          address: { type: 'string' },
          bio: { type: 'string' },
          avatar: { type: 'string' }
        }
      }
    }
  }, async function (request, reply) {
    const userId = request.user.id
    const { email, phone, name, address, bio, avatar } = request.body

    const updateFields = []
    const updateValues = []

    if (email) {
      updateFields.push('email = ?')
      updateValues.push(email)
    }
    if (phone) {
      updateFields.push('phone = ?')
      updateValues.push(phone)
    }
    if (name) {
      updateFields.push('name = ?')
      updateValues.push(name)
    }
    if (address !== undefined) {
      updateFields.push('address = ?')
      updateValues.push(address)
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?')
      updateValues.push(bio)
    }
    if (avatar !== undefined) {
      updateFields.push('avatar = ?')
      updateValues.push(avatar)
    }

    if (updateFields.length === 0) {
      return reply.status(400).send({ code: 400, message: '没有需要更新的字段', data: null })
    }

    updateValues.push(userId)

    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    const [updatedUser] = await query(
      'SELECT id, username, email, phone, role, name, address, bio, avatar, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    )

    return reply.send({
      code: 200,
      message: '更新成功',
      data: updatedUser
    })
  })

  fastify.put('/api/auth/password', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['oldPassword', 'newPassword'],
        properties: {
          oldPassword: { type: 'string', minLength: 6, maxLength: 50 },
          newPassword: { type: 'string', minLength: 6, maxLength: 50 }
        }
      }
    }
  }, async function (request, reply) {
    const userId = request.user.id
    const { oldPassword, newPassword } = request.body

    const [user] = await query('SELECT password FROM users WHERE id = ?', [userId])
    if (!user) {
      return reply.status(404).send({ code: 404, message: '用户不存在', data: null })
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password)
    if (!isValidPassword) {
      return reply.status(400).send({ code: 400, message: '原密码错误', data: null })
    }

    if (oldPassword === newPassword) {
      return reply.status(400).send({ code: 400, message: '新密码不能与原密码相同', data: null })
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
    await query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId])

    return reply.send({
      code: 200,
      message: '密码修改成功',
      data: null
    })
  })
}
