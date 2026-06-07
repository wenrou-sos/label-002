import { query } from '../config/db.js'
import { authenticate, requireOwner, requireCaregiver } from '../plugins/auth.js'

export default async function orderRoutes(fastify, options) {
  fastify.get('/api/orders', {
    preHandler: [authenticate]
  }, async function (request, reply) {
    const userId = request.user.id
    const role = request.user.role
    const { status } = request.query

    let sql = `SELECT 
      o.*,
      p.name as pet_name,
      p.species as pet_species,
      p.breed as pet_breed,
      p.avatar as pet_avatar,
      ou.name as owner_name,
      ou.phone as owner_phone,
      ou.email as owner_email,
      cu.name as caregiver_name,
      cu.phone as caregiver_phone,
      cu.email as caregiver_email
    FROM orders o
    LEFT JOIN pets p ON o.pet_id = p.id
    LEFT JOIN users ou ON o.owner_id = ou.id
    LEFT JOIN users cu ON o.caregiver_id = cu.id`

    const conditions = []
    const params = []

    if (role === 'owner') {
      conditions.push('o.owner_id = ?')
      params.push(userId)
    } else if (role === 'caregiver') {
      conditions.push('(o.caregiver_id = ? OR o.status = "pending")')
      params.push(userId)
    }

    if (status) {
      conditions.push('o.status = ?')
      params.push(status)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    sql += ' ORDER BY o.created_at DESC'

    const orders = await query(sql, params)

    return reply.send({
      code: 200,
      message: '获取成功',
      data: orders
    })
  })

  fastify.get('/api/orders/:id', {
    preHandler: [authenticate]
  }, async function (request, reply) {
    const orderId = request.params.id
    const userId = request.user.id
    const role = request.user.role

    const [order] = await query(
      `SELECT 
        o.*,
        p.name as pet_name,
        p.species as pet_species,
        p.breed as pet_breed,
        p.age as pet_age,
        p.gender as pet_gender,
        p.weight as pet_weight,
        p.description as pet_description,
        p.health_info as pet_health_info,
        p.avatar as pet_avatar,
        ou.name as owner_name,
        ou.phone as owner_phone,
        ou.email as owner_email,
        ou.address as owner_address,
        cu.name as caregiver_name,
        cu.phone as caregiver_phone,
        cu.email as caregiver_email
      FROM orders o
      LEFT JOIN pets p ON o.pet_id = p.id
      LEFT JOIN users ou ON o.owner_id = ou.id
      LEFT JOIN users cu ON o.caregiver_id = cu.id
      WHERE o.id = ?`,
      [orderId]
    )

    if (!order) {
      return reply.status(404).send({ code: 404, message: '订单不存在', data: null })
    }

    if (role === 'owner' && order.owner_id !== userId) {
      return reply.status(403).send({ code: 403, message: '无权查看该订单', data: null })
    }

    if (role === 'caregiver' && order.status === 'pending' && order.caregiver_id !== null && order.caregiver_id !== userId) {
      return reply.status(403).send({ code: 403, message: '无权查看该订单', data: null })
    }

    return reply.send({
      code: 200,
      message: '获取成功',
      data: order
    })
  })

  fastify.post('/api/orders', {
    preHandler: [requireOwner],
    schema: {
      body: {
        type: 'object',
        required: ['pet_id', 'title', 'start_date', 'end_date'],
        properties: {
          pet_id: { type: 'integer', minimum: 1 },
          title: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string' },
          start_date: { type: 'string', format: 'date' },
          end_date: { type: 'string', format: 'date' },
          special_needs: { type: 'string' },
          price: { type: 'number', minimum: 0 }
        }
      }
    }
  }, async function (request, reply) {
    const ownerId = request.user.id
    const { pet_id, title, description, start_date, end_date, special_needs, price } = request.body

    const [pet] = await query('SELECT * FROM pets WHERE id = ?', [pet_id])
    if (!pet) {
      return reply.status(404).send({ code: 404, message: '宠物不存在', data: null })
    }

    if (pet.owner_id !== ownerId) {
      return reply.status(403).send({ code: 403, message: '只能为自己的宠物创建订单', data: null })
    }

    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    if (endDate < startDate) {
      return reply.status(400).send({ code: 400, message: '结束日期不能早于开始日期', data: null })
    }

    const result = await query(
      'INSERT INTO orders (owner_id, pet_id, title, description, start_date, end_date, special_needs, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [ownerId, pet_id, title, description, start_date, end_date, special_needs, price]
    )

    const [newOrder] = await query(
      `SELECT 
        o.*,
        p.name as pet_name,
        p.species as pet_species,
        p.avatar as pet_avatar,
        ou.name as owner_name
      FROM orders o
      LEFT JOIN pets p ON o.pet_id = p.id
      LEFT JOIN users ou ON o.owner_id = ou.id
      WHERE o.id = ?`,
      [result.insertId]
    )

    return reply.status(201).send({
      code: 201,
      message: '创建成功',
      data: newOrder
    })
  })

  fastify.post('/api/orders/:id/accept', {
    preHandler: [requireCaregiver]
  }, async function (request, reply) {
    const orderId = request.params.id
    const caregiverId = request.user.id

    const [order] = await query('SELECT * FROM orders WHERE id = ?', [orderId])
    if (!order) {
      return reply.status(404).send({ code: 404, message: '订单不存在', data: null })
    }

    if (order.status !== 'pending') {
      return reply.status(400).send({ code: 400, message: '该订单已被接单或已取消', data: null })
    }

    if (order.owner_id === caregiverId) {
      return reply.status(400).send({ code: 400, message: '不能接自己发布的订单', data: null })
    }

    await query(
      'UPDATE orders SET caregiver_id = ?, status = ? WHERE id = ?',
      [caregiverId, 'accepted', orderId]
    )

    const [updatedOrder] = await query(
      `SELECT 
        o.*,
        p.name as pet_name,
        p.species as pet_species,
        p.avatar as pet_avatar,
        ou.name as owner_name,
        cu.name as caregiver_name
      FROM orders o
      LEFT JOIN pets p ON o.pet_id = p.id
      LEFT JOIN users ou ON o.owner_id = ou.id
      LEFT JOIN users cu ON o.caregiver_id = cu.id
      WHERE o.id = ?`,
      [orderId]
    )

    return reply.send({
      code: 200,
      message: '接单成功',
      data: updatedOrder
    })
  })

  fastify.put('/api/orders/:id/status', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['in_progress', 'completed', 'cancelled'] }
        }
      }
    }
  }, async function (request, reply) {
    const orderId = request.params.id
    const userId = request.user.id
    const role = request.user.role
    const { status } = request.body

    const [order] = await query('SELECT * FROM orders WHERE id = ?', [orderId])
    if (!order) {
      return reply.status(404).send({ code: 404, message: '订单不存在', data: null })
    }

    if (role === 'owner') {
      if (order.owner_id !== userId) {
        return reply.status(403).send({ code: 403, message: '无权修改该订单状态', data: null })
      }
      if (status === 'in_progress') {
        return reply.status(400).send({ code: 400, message: '寄养人无法将订单标记为进行中', data: null })
      }
      if (status === 'completed' && order.status !== 'in_progress') {
        return reply.status(400).send({ code: 400, message: '只有进行中的订单才能标记为完成', data: null })
      }
    } else if (role === 'caregiver') {
      if (order.caregiver_id !== userId) {
        return reply.status(403).send({ code: 403, message: '无权修改该订单状态', data: null })
      }
      if (status === 'completed') {
        return reply.status(400).send({ code: 400, message: '照看人无法将订单标记为完成', data: null })
      }
      if (status === 'in_progress' && order.status !== 'accepted') {
        return reply.status(400).send({ code: 400, message: '只有已接受的订单才能标记为进行中', data: null })
      }
      if (status === 'cancelled' && order.status === 'in_progress') {
        return reply.status(400).send({ code: 400, message: '进行中的订单无法取消', data: null })
      }
    }

    await query('UPDATE orders SET status = ? WHERE id = ?', [status, orderId])

    const [updatedOrder] = await query(
      `SELECT 
        o.*,
        p.name as pet_name,
        p.species as pet_species,
        p.avatar as pet_avatar,
        ou.name as owner_name,
        cu.name as caregiver_name
      FROM orders o
      LEFT JOIN pets p ON o.pet_id = p.id
      LEFT JOIN users ou ON o.owner_id = ou.id
      LEFT JOIN users cu ON o.caregiver_id = cu.id
      WHERE o.id = ?`,
      [orderId]
    )

    return reply.send({
      code: 200,
      message: '状态更新成功',
      data: updatedOrder
    })
  })

  fastify.get('/api/orders/pending/all', {
    preHandler: [requireCaregiver]
  }, async function (request, reply) {
    const orders = await query(
      `SELECT 
        o.*,
        p.name as pet_name,
        p.species as pet_species,
        p.breed as pet_breed,
        p.age as pet_age,
        p.avatar as pet_avatar,
        ou.name as owner_name,
        ou.address as owner_address
      FROM orders o
      LEFT JOIN pets p ON o.pet_id = p.id
      LEFT JOIN users ou ON o.owner_id = ou.id
      WHERE o.status = 'pending'
      ORDER BY o.created_at DESC`
    )

    return reply.send({
      code: 200,
      message: '获取成功',
      data: orders
    })
  })

  fastify.put('/api/orders/:id', {
    preHandler: [requireOwner],
    schema: {
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string' },
          start_date: { type: 'string', format: 'date' },
          end_date: { type: 'string', format: 'date' },
          special_needs: { type: 'string' },
          price: { type: 'number', minimum: 0 }
        }
      }
    }
  }, async function (request, reply) {
    const orderId = request.params.id
    const ownerId = request.user.id
    const { title, description, start_date, end_date, special_needs, price } = request.body

    const [order] = await query('SELECT * FROM orders WHERE id = ?', [orderId])
    if (!order) {
      return reply.status(404).send({ code: 404, message: '订单不存在', data: null })
    }

    if (order.owner_id !== ownerId) {
      return reply.status(403).send({ code: 403, message: '无权修改该订单', data: null })
    }

    if (order.status !== 'pending') {
      return reply.status(400).send({ code: 400, message: '只能修改待接单状态的订单', data: null })
    }

    const updateFields = []
    const updateValues = []

    if (title) {
      updateFields.push('title = ?')
      updateValues.push(title)
    }
    if (description !== undefined) {
      updateFields.push('description = ?')
      updateValues.push(description)
    }
    if (start_date) {
      updateFields.push('start_date = ?')
      updateValues.push(start_date)
    }
    if (end_date) {
      updateFields.push('end_date = ?')
      updateValues.push(end_date)
    }
    if (special_needs !== undefined) {
      updateFields.push('special_needs = ?')
      updateValues.push(special_needs)
    }
    if (price !== undefined) {
      updateFields.push('price = ?')
      updateValues.push(price)
    }

    if (updateFields.length === 0) {
      return reply.status(400).send({ code: 400, message: '没有需要更新的字段', data: null })
    }

    updateValues.push(orderId)

    await query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    const [updatedOrder] = await query(
      `SELECT 
        o.*,
        p.name as pet_name,
        p.species as pet_species,
        p.avatar as pet_avatar,
        ou.name as owner_name
      FROM orders o
      LEFT JOIN pets p ON o.pet_id = p.id
      LEFT JOIN users ou ON o.owner_id = ou.id
      WHERE o.id = ?`,
      [orderId]
    )

    return reply.send({
      code: 200,
      message: '更新成功',
      data: updatedOrder
    })
  })
}
