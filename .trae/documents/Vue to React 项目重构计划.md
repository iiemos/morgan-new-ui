# Vue to React 项目重构计划

## 1. 项目现状分析

### 当前技术栈
- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **包管理**: pnpm
- **路由**: Vue Router
- **状态管理**: Pinia
- **国际化**: vue-i18n
- **Web3**: ethers.js, @wagmi/vue
- **图标**: @iconify/vue
- **样式**: Tailwind CSS

### 主要组件和页面
- `Sidebar.vue` / `AsideMenu.vue` - 侧边导航栏
- `HomeView.vue` - 首页
- `StakeView.vue` - 质押页面
- `SwapView.vue` - 兑换页面
- `TeamView.vue` - 团队页面
- `MineView.vue` - 挖矿页面

## 2. 重构目标

### 技术栈转换
- **框架**: Vue 3 → React 18 (Hooks)
- **路由**: Vue Router → React Router v6
- **状态管理**: Pinia → Redux Toolkit (或 Zustand 用于轻量级状态)
- **国际化**: vue-i18n → react-i18next
- **Web3**: @wagmi/vue → @wagmi/react
- **图标**: @iconify/vue → @iconify/react
- **构建工具**: 保留 Vite
- **包管理**: 保留 pnpm
- **样式**: 保留 Tailwind CSS

## 3. 重构步骤

### 3.1 初始化 React 项目
1. 使用 Vite 初始化 React 项目
2. 配置 pnpm
3. 安装核心依赖
4. 配置 Tailwind CSS

### 3.2 项目结构迁移
1. 保留 `public/` 目录
2. 重构 `src/` 目录结构：
   ```
   src/
   ├── components/      # React 组件
   ├── views/          # React 页面组件
   ├── hooks/          # 自定义 React Hooks
   ├── store/          # Redux/Zustand 状态管理
   ├── i18n/           # 国际化配置
   ├── utils/          # 工具函数
   ├── assets/         # 静态资源
   ├── App.jsx         # 根组件
   └── main.jsx        # 入口文件
   ```

### 3.3 核心配置文件迁移
1. 重构 `vite.config.js`
2. 保留 `tailwind.config.js`
3. 重构 `postcss.config.js`
4. 更新 `package.json`

### 3.4 组件重构
1. **Sidebar/AsideMenu** - 侧边导航栏
2. **App** - 根组件
3. **页面组件**:
   - HomeView
   - StakeView
   - SwapView
   - TeamView
   - MineView

### 3.5 功能重构
1. **路由系统** - React Router v6
2. **状态管理** - Redux Toolkit/Zustand
3. **国际化** - react-i18next
4. **Web3 集成** - @wagmi/react
5. **图标系统** - @iconify/react

### 3.6 样式和动画
1. 保留 Tailwind CSS 类名
2. 重构 Vue 过渡动画为 React 过渡效果
3. 确保响应式设计

### 3.7 构建和测试
1. 配置构建脚本
2. 运行构建命令验证
3. 测试基本功能

## 4. 重构注意事项

### 4.1 组件生命周期转换
- Vue `mounted` → React `useEffect` (空依赖数组)
- Vue `watch` → React `useEffect` (带依赖)
- Vue `computed` → React `useMemo` 或 `useCallback`

### 4.2 模板语法转换
- Vue 模板 → JSX
- Vue 指令 → React 属性和 Hooks
- Vue `v-if`/`v-else` → React 条件渲染
- Vue `v-for` → React `map()`
- Vue `v-bind` → React 属性绑定
- Vue `v-on` → React 事件绑定

### 4.3 状态管理转换
- Pinia store → Redux slice 或 Zustand store
- Vue `ref`/`reactive` → React `useState`/`useReducer`

### 4.4 路由转换
- Vue Router `router-link` → React Router `Link`
- Vue Router `useRoute` → React Router `useLocation`
- Vue Router `useRouter` → React Router `useNavigate`

## 5. 重构时间预估

| 阶段 | 时间 |
|------|------|
| 初始化和配置 | 1 天 |
| 组件重构 | 3-4 天 |
| 功能集成 | 2-3 天 |
| 测试和调试 | 1-2 天 |

## 6. 预期结果

- 功能完整的 React 项目
- 与原 Vue 项目视觉和功能一致
- 代码结构清晰，便于维护
- 性能优化
- 支持原有的所有功能

## 7. 风险评估

- **技术风险**: React 和 Vue 生态差异
- **时间风险**: 重构可能比预期耗时
- **测试风险**: 需要全面测试所有功能
- **依赖风险**: 某些 Vue 特定依赖可能没有直接的 React 替代品

## 8. 后续优化建议

- 引入 React Server Components (如果使用 Next.js)
- 优化性能，使用 React.memo, useMemo, useCallback
- 引入 TypeScript 支持
- 完善测试覆盖
- 优化构建配置

---

### 重构准备工作

1. 备份当前项目
2. 安装必要的工具链
3. 熟悉 React 18 和相关生态
4. 制定详细的迁移计划

### 重构执行流程

1. 先搭建基础框架和配置
2. 重构核心组件
3. 重构页面组件
4. 集成功能模块
5. 测试和调试
6. 优化和完善

---

这个重构计划将确保项目从 Vue 平滑过渡到 React，同时保留所有原有功能和视觉效果。