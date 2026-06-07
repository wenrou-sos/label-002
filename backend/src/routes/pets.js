import { query } from '../config/db.js'
import { authenticate, requireOwner } from '../plugins/auth.js'

export default async function petRoutes(fastify, options) {
  fastify.get('/api/pets', {
    preHandler: [authenticate]
  }, async function (request, reply) {
    const userId = request.user.id
    const role = request.user.role

    let pets
    if (role === 'owner') {
      pets = await query(
        'SELECT p.*, u.name as owner_name FROM pets p LEFT JOIN users u ON p.owner_id = u.id WHERE p.owner_id = ? ORDER BY p.created_at DESC',
        [userId]
      )
    } else {
      pets = await query(
        'SELECT p.*, u.name as owner_name FROM pets p LEFT JOIN users u ON p.owner_id = u.id ORDER BY p.created_at DESC'
      )
    }

    return reply.send({
      code: 200,
      message: '获取成功',
      data: pets
    })
  })

  fastify.get('/api/pets/:id', {
    preHandler: [authenticate]
  }, async function (request, reply) {
    const petId = request.params.id
    const userId = request.user.id
    const role = request.user.role

    const [pet] = await query(
      'SELECT p.*, u.name as owner_name, u.phone as owner_phone, u.email as owner_email FROM pets p LEFT JOIN users u ON p.owner_id = u.id WHERE p.id = ?',
      [petId]
    )

    if (!pet) {
      return reply.status(404).send({ code: 404, message: '宠物不存在', data: null })
    }

    if (role === 'owner' && pet.owner_id !== userId) {
      return reply.status(403).send({ code: 403, message: '无权查看该宠物信息', data: null })
    }

    return reply.send({
      code: 200,
      message: '获取成功',
      data: pet
    })
  })

  fastify.post('/api/pets', {
    preHandler: [requireOwner],
    schema: {
      body: {
        type: 'object',
        required: ['name', 'species'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50 },
          species: { type: 'string', minLength: 1, maxLength: 20 },
          breed: { type: 'string', maxLength: 50 },
          age: { type: 'integer', minimum: 0 },
          gender: { type: 'string', enum: ['male', 'female', 'unknown'] },
          weight: { type: 'number', minimum: 0 },
          description: { type: 'string' },
          avatar: { type: 'string' },
          health_info: { type: 'string' }
        }
      }
    }
  }, async function (request, reply) {
    const ownerId = request.user.id
    const { name, species, breed, age, gender, weight, description, avatar, health_info } = request.body

    const result = await query(
      'INSERT INTO pets (owner_id, name, species, breed, age, gender, weight, description, avatar, health_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [ownerId, name, species, breed, age, gender, weight, description, avatar, health_info]
    )

    const [newPet] = await query('SELECT * FROM pets WHERE id = ?', [result.insertId])

    return reply.status(201).send({
      code: 201,
      message: '创建成功',
      data: newPet
    })
  })

  fastify.put('/api/pets/:id', {
    preHandler: [requireOwner],
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 50 },
          species: { type: 'string', minLength: 1, maxLength: 20 },
          breed: { type: 'string', maxLength: 50 },
          age: { type: 'integer', minimum: 0 },
          gender: { type: 'string', enum: ['male', 'female', 'unknown'] },
          weight: { type: 'number', minimum: 0 },
          description: { type: 'string' },
          avatar: { type: 'string' },
          health_info: { type: 'string' }
        }
      }
    }
  }, async function (request, reply) {
    const petId = request.params.id
    const ownerId = request.user.id
    const { name, species, breed, age, gender, weight, description, avatar, health_info } = request.body

    const [pet] = await query('SELECT * FROM pets WHERE id = ?', [petId])
    if (!pet) {
      return reply.status(404).send({ code: 404, message: '宠物不存在', data: null })
    }

    if (pet.owner_id !== ownerId) {
      return reply.status(403).send({ code: 403, message: '无权修改该宠物信息', data: null })
    }

    const updateFields = []
    const updateValues = []

    if (name) {
      updateFields.push('name = ?')
      updateValues.push(name)
    }
    if (species) {
      updateFields.push('species = ?')
      updateValues.push(species)
    }
    if (breed !== undefined) {
      updateFields.push('breed = ?')
      updateValues.push(breed)
    }
    if (age !== undefined) {
      updateFields.push('age = ?')
      updateValues.push(age)
    }
    if (gender) {
      updateFields.push('gender = ?')
      updateValues.push(gender)
    }
    if (weight !== undefined) {
      updateFields.push('weight = ?')
      updateValues.push(weight)
    }
    if (description !== undefined) {
      updateFields.push('description = ?')
      updateValues.push(description)
    }
    if (avatar !== undefined) {
      updateFields.push('avatar = ?')
      updateValues.push(avatar)
    }
    if (health_info !== undefined) {
      updateFields.push('health_info = ?')
      updateValues.push(health_info)
    }

    if (updateFields.length === 0) {
      return reply.status(400).send({ code: 400, message: '没有需要更新的字段', data: null })
    }

    updateValues.push(petId)

    await query(
      `UPDATE pets SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    const [updatedPet] = await query('SELECT * FROM pets WHERE id = ?', [petId])

    return reply.send({
      code: 200,
      message: '更新成功',
      data: updatedPet
    })
  })

  fastify.delete('/api/pets/:id', {
    preHandler: [requireOwner]
  }, async function (request, reply) {
    const petId = request.params.id
    const ownerId = request.user.id

    const [pet] = await query('SELECT * FROM pets WHERE id = ?', [petId])
    if (!pet) {
      return reply.status(404).send({ code: 404, message: '宠物不存在', data: null })
    }

    if (pet.owner_id !== ownerId) {
      return reply.status(403).send({ code: 403, message: '无权删除该宠物', data: null })
    }

    const [pendingOrders] = await query(
      'SELECT COUNT(*) as count FROM orders WHERE pet_id = ? AND status IN (?, ?, ?)',
      [petId, 'pending', 'accepted', 'in_progress']
    )

    if (pendingOrders.count > 0) {
      return reply.status(400).send({ code: 400, message: '该宠物有关联的进行中订单，无法删除', data: null })
    }

    await query('DELETE FROM pets WHERE id = ?', [petId])

    return reply.send({
      code: 200,
      message: '删除成功',
      data: null
    })
  })
}
