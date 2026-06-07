# 宠物寄养预约平台

一个功能完整的宠物寄养预约平台，采用前后端分离架构，支持寄养人发布寄养需求、照看人接单服务。

## 技术栈

### 前端
- **框架**: Vue 3 (Composition API)
- **UI 组件库**: Naive UI
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **HTTP 客户端**: Axios
- **构建工具**: Vite
- **图标**: @vicons/ionicons5

### 后端
- **Web 框架**: Fastify
- **认证**: @fastify/jwt (JWT)
- **跨域**: @fastify/cors
- **密码加密**: bcryptjs
- **数据库驱动**: mysql2
- **日志**: pino / pino-pretty

### 数据库
- **MySQL 8.0+**
- 数据库名: `pet_sitting`
- 密码: `password`

## 核心功能

### 用户系统
- 支持两种角色：**寄养人** 和 **照看人**
- 用户注册、登录、JWT 认证
- 个人资料管理（修改姓名、邮箱、手机号、地址、个人简介）
- 修改密码功能
- 基于角色的权限控制 (RBAC)

### 宠物档案管理
- 寄养人可以创建、查看、编辑、删除宠物档案
- 宠物信息包括：名称、物种、品种、年龄、性别、体重、描述、健康信息等
- 照看人可以查看所有宠物档案（用于了解寄养宠物）

### 寄养订单管理
- **寄养人** 可以创建寄养订单，选择宠物、设置寄养时间段、填写特殊需求
- **照看人** 可以浏览所有待接单的订单，并选择接单
- 订单状态流转：待接单 → 已接单 → 进行中 → 已完成 / 已取消
- 支持订单状态更新，根据当前状态和用户角色进行权限验证
- 订单详情查看，包含宠物信息、寄养人信息、照看人信息

### 数据统计
- 仪表盘展示统计数据（订单数、宠物数等）
- 最近订单列表
- 快捷操作入口

## 项目结构

```
label-002/
├── database/
│   └── init.sql              # 数据库初始化脚本（建表+初始数据）
├── backend/                   # Fastify 后端服务
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js          # 数据库连接池配置
│   │   ├── plugins/
│   │   │   └── auth.js        # JWT 认证和权限中间件
│   │   ├── routes/
│   │   │   ├── auth.js        # 用户认证接口（注册/登录/个人信息/修改密码）
│   │   │   ├── pets.js        # 宠物档案 CRUD 接口
│   │   │   └── orders.js      # 寄养订单接口（创建/查询/接单/状态更新）
│   │   ├── scripts/
│   │   │   └── init-db.js     # 数据库初始化脚本
│   │   └── server.js          # 服务入口，支持自动数据库初始化
│   ├── .env                   # 环境配置（DB_PASSWORD=password）
│   └── package.json
├── frontend/                  # Vue3 前端应用
│   ├── src/
│   │   ├── views/             # 页面组件
│   │   │   ├── Login.vue      # 登录页
│   │   │   ├── Register.vue   # 注册页
│   │   │   ├── Dashboard.vue  # 首页仪表盘
│   │   │   ├── Pets.vue       # 宠物档案管理
│   │   │   ├── Orders.vue     # 订单列表
│   │   │   ├── CreateOrder.vue # 创建订单
│   │   │   ├── OrderDetail.vue # 订单详情
│   │   │   ├── Market.vue     # 照看人订单市场
│   │   │   ├── Profile.vue    # 个人中心
│   │   │   └── NotFound.vue   # 404 页面
│   │   ├── stores/            # Pinia 状态管理
│   │   │   ├── user.js        # 用户状态
│   │   │   ├── pet.js         # 宠物状态
│   │   │   └── order.js       # 订单状态
│   │   ├── router/
│   │   │   └── index.js       # 路由配置（含权限守卫）
│   │   ├── layouts/
│   │   │   └── MainLayout.vue # 主布局组件
│   │   ├── utils/
│   │   │   └── request.js     # Axios 请求封装
│   │   ├── styles/
│   │   │   └── global.css     # 全局样式
│   │   ├── App.vue
│   │   └── main.js
│   └── package.json
└── package.json               # 根目录配置（concurrently 同时启动前后端）
```

## 数据库设计

### users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| username | VARCHAR(50) | 用户名，唯一 |
| password | VARCHAR(255) | 密码（bcrypt 加密） |
| email | VARCHAR(100) | 邮箱，唯一 |
| phone | VARCHAR(20) | 手机号 |
| role | ENUM | 角色：owner / caregiver |
| name | VARCHAR(50) | 姓名 |
| address | VARCHAR(255) | 联系地址 |
| bio | TEXT | 个人简介 |
| avatar | VARCHAR(255) | 头像 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### pets 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| owner_id | INT | 外键，关联 users.id |
| name | VARCHAR(50) | 宠物名称 |
| species | VARCHAR(20) | 物种：cat / dog / bird / rabbit / hamster / other |
| breed | VARCHAR(50) | 品种 |
| age | INT | 年龄（岁） |
| gender | ENUM | 性别：male / female / unknown |
| weight | DECIMAL | 体重（kg） |
| description | TEXT | 宠物描述 |
| health_info | TEXT | 健康信息 |
| avatar | VARCHAR(255) | 宠物头像 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### orders 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| owner_id | INT | 外键，寄养人ID |
| caregiver_id | INT | 外键，照看人ID（可空） |
| pet_id | INT | 外键，宠物ID |
| title | VARCHAR(100) | 订单标题 |
| description | TEXT | 订单描述 |
| start_date | DATE | 寄养开始日期 |
| end_date | DATE | 寄养结束日期 |
| special_needs | TEXT | 特殊需求 |
| status | ENUM | 状态：pending / accepted / in_progress / completed / cancelled |
| price | DECIMAL | 价格（元） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

## 快速开始

### 环境要求
- Node.js >= 18.x
- MySQL >= 8.0
- npm >= 9.x

### 安装依赖

```bash
# 安装所有依赖（推荐）
npm run install:all

# 或者分别安装
cd backend && npm install
cd ../frontend && npm install
```

### 数据库配置

数据库密码统一设置为 `password`。如果需要修改，请编辑 `backend/.env` 文件：

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=pet_sitting
JWT_SECRET=your-secret-key
```

### 数据库初始化

**方式一：自动初始化（推荐）**

后端服务启动时会自动检测数据库是否存在，如不存在则自动创建数据库、所有表结构并插入初始数据。

**方式二：手动初始化**

```bash
cd backend
npm run init:db
```

### 启动服务

**方式一：一键启动（推荐）**

```bash
npm run dev
```

此命令会同时启动前端（http://localhost:5173）和后端（http://localhost:3000）。

**方式二：分别启动**

```bash
# 启动后端服务（端口 3000）
cd backend && npm run dev

# 启动前端服务（端口 5173）
cd frontend && npm run dev
```

### 访问地址
- **前端**: http://localhost:5173/
- **后端 API**: http://localhost:3000/
- **健康检查**: http://localhost:3000/api/health

## 预置测试账号

所有测试账号的密码均为 `123456`。

| 用户名 | 角色 | 说明 |
|--------|------|------|
| owner1 | 寄养人 | 张三，有橘猫「大橘」和英短「豆豆」 |
| owner2 | 寄养人 | 李四，有金毛「大黄」和泰迪「来福」 |
| caregiver1 | 照看人 | 王五，专业宠物保姆，5年经验 |
| caregiver2 | 照看人 | 赵六，爱宠人士，居家环境好 |

## API 接口文档

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/profile` - 获取个人信息
- `PUT /api/auth/profile` - 更新个人信息
- `PUT /api/auth/password` - 修改密码

### 宠物档案接口
- `GET /api/pets` - 获取宠物列表（寄养人看自己的，照看人看全部）
- `GET /api/pets/:id` - 获取宠物详情
- `POST /api/pets` - 创建宠物档案（寄养人）
- `PUT /api/pets/:id` - 更新宠物档案（寄养人）
- `DELETE /api/pets/:id` - 删除宠物档案（寄养人）

### 寄养订单接口
- `GET /api/orders` - 获取订单列表（按角色过滤）
- `GET /api/orders/:id` - 获取订单详情
- `POST /api/orders` - 创建订单（寄养人）
- `POST /api/orders/:id/accept` - 接单（照看人）
- `PUT /api/orders/:id/status` - 更新订单状态
- `PUT /api/orders/:id` - 更新订单信息（寄养人，待接单状态）
- `GET /api/orders/pending/all` - 获取所有待接单订单（照看人）

### 统一响应格式
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

- `code`: 状态码（200/201 成功，400 参数错误，401 未认证，403 无权限，404 不存在，500 服务器错误）
- `message`: 提示信息
- `data`: 返回数据

## 订单状态流转

```
待接单 (pending)
    ↓ 照看人接单
已接单 (accepted)
    ↓ 照看人开始服务
进行中 (in_progress)
    ↓ 寄养人确认完成
已完成 (completed)

【取消规则】
- 待接单状态：寄养人可取消
- 已接单状态：双方协商后均可取消
- 进行中状态：需双方确认后取消
```

## 开发说明

### 权限控制
- 后端使用 JWT 中间件进行认证，路由级别通过 `preHandler` 配置角色权限
- 前端使用路由守卫进行页面级权限控制，未登录用户访问受限页面会跳转到登录页
- 不同角色的用户看到不同的导航菜单和功能模块

### 数据库连接池
- 使用 mysql2 的连接池管理数据库连接
- `createPool()` 函数支持 `withoutDatabase` 和 `isGlobal` 参数
- 临时连接（如数据库初始化）使用 `isGlobal: false` 避免污染全局连接池

### 密码安全
- 使用 bcryptjs 进行密码哈希，加盐 10 轮
- 数据库中不存储明文密码
- 修改密码时需要验证原密码，且新密码不能与原密码相同

## 常见问题

### 1. 数据库连接失败
请确认 MySQL 服务已启动，且 `backend/.env` 中的配置正确。

### 2. 前端请求跨域
Vite 已配置代理，`/api` 开头的请求会自动转发到 `http://localhost:3000`。

### 3. 路由切换时页面白屏
请确保已在 `App.vue` 中正确配置 `n-dialog-provider` 和 `n-message-provider`。

### 4. 登录提示用户名或密码错误
请确认使用的是预置测试账号，密码为 `123456`。如果手动修改过密码，请使用新密码。

## License

MIT
