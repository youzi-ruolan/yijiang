# 艺匠调色管理后台

这是基于 **Vue 3 + Vite + Pinia + Vue Router + TDesign Vue Next** 的正式版后台子工程。

## 目标

- 取代仓库中的静态轻量后台原型
- 对齐 `TDesign Vue Next Starter` 的正式后台方向
- 对接 `NestJS + Prisma + MySQL` 后端，统一后台与小程序数据源

## 技术栈

- Vue 3
- Vite
- Pinia
- Vue Router
- TDesign Vue Next
- TypeScript

## 数据来源

当前后台默认请求本地开发接口：

- `http://localhost:3001/admin/*`

其中：

- 登录页请求 `POST /admin/auth/login`
- 设置、分类、商品、内容、订单页均请求真实管理接口
- 登录态依然保存在浏览器 `localStorage`

## 启动

```bash
cd admin-vue
npm install
npm run dev
```

默认地址：

```text
http://127.0.0.1:4180
```

## 已实现模块

- 登录页
- MainLayout / BlankLayout 分层
- 路由守卫
- 侧边栏折叠
- 面包屑导航
- 404 页面
- 项目总览
- 商品管理
- 分类管理
- 内容运营
- 订单管理
- 系统设置

## 下一步建议

1. 给图片字段补上传能力
2. 给接口补统一鉴权校验
3. 补充图表、操作日志、用户管理等正式后台能力
4. 让小程序首页与详情页也切到真实接口

## 当前登录方式

- 适合个人使用
- 本地登录态保存在浏览器 `localStorage`
- 默认账号：`admin`
- 默认密码：`colorist123`
