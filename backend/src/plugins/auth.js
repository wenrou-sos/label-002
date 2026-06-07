export async function authenticate(request, reply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    return reply.status(401).send({ code: 401, message: '未授权，请先登录', data: null })
  }
}

export function requireRole(roles) {
  return async function (request, reply) {
    try {
      await request.jwtVerify()
      if (!roles.includes(request.user.role)) {
        return reply.status(403).send({ code: 403, message: '权限不足', data: null })
      }
    } catch (err) {
      return reply.status(401).send({ code: 401, message: '未授权，请先登录', data: null })
    }
  }
}

export async function requireOwner(request, reply) {
  try {
    await request.jwtVerify()
    if (request.user.role !== 'owner') {
      return reply.status(403).send({ code: 403, message: '仅限寄养人访问', data: null })
    }
  } catch (err) {
    return reply.status(401).send({ code: 401, message: '未授权，请先登录', data: null })
  }
}

export async function requireCaregiver(request, reply) {
  try {
    await request.jwtVerify()
    if (request.user.role !== 'caregiver') {
      return reply.status(403).send({ code: 403, message: '仅限照看人访问', data: null })
    }
  } catch (err) {
    return reply.status(401).send({ code: 401, message: '未授权，请先登录', data: null })
  }
}

export default async function authPlugin(fastify, options) {
  fastify.decorate('authenticate', authenticate)
  fastify.decorate('requireRole', requireRole)
  fastify.decorate('requireOwner', requireOwner)
  fastify.decorate('requireCaregiver', requireCaregiver)
}
