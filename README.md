# 电力拓扑图 - Vue 3.0 版本

这是将原始 HTML/JavaScript 项目改造为 Vue 3.0 框架的版本。

## 项目结构

```
电力拓扑图-vue/
├── index.html                    # 入口HTML文件
├── package.json                  # 项目依赖配置
├── vite.config.js               # Vite构建配置
├── src/
│   ├── main.js                   # 应用入口
│   ├── App.vue                   # 根组件
│   ├── components/
│   │   ├── PowerTopologyGraph.vue    # 主拓扑图组件
│   │   ├── Toolbar.vue              # 工具栏组件
│   │   ├── EditDialog.vue           # 编辑节点对话框
│   │   ├── AddNodeDialog.vue        # 添加节点对话框
│   │   └── NodeToolbar.vue          # 节点工具栏
│   ├── utils/
│   │   ├── config.js                # 配置常量
│   │   ├── topologyParser.js        # 拓扑解析器
│   │   └── registerNodes.js         # X6节点注册
│   └── assets/
│       └── js/
│           ├── antv-x6.min.js       # X6图可视化库
│           └── dagre.min.js         # 布局算法库
└── public/
    └── 郑州城区内主网数据/           # 变电站数据文件
```

## 功能特性

- ✅ JSON文件导入电力拓扑数据
- ✅ 自动布局（Dagre算法）
- ✅ 缩放和平移画布
- ✅ 导出SVG
- ✅ 编辑模式：添加/删除/移动/连接节点
- ✅ 拖拽添加节点
- ✅ 键盘快捷键（Delete删除、Escape关闭对话框）

## 安装依赖

```bash
cd 电力拓扑图-vue
npm install
```

## 运行项目

```bash
npm run dev
```

项目将在 http://localhost:3000 启动

## 构建生产版本

```bash
npm run build
```

## 技术栈

- **Vue 3.0**: 使用 Composition API
- **Vite**: 现代化的前端构建工具
- **AntV X6**: 图可视化引擎
- **Dagre**: 自动布局算法

## 主要改动

从原生 JavaScript 改造为 Vue 3.0：

1. **组件化**：将代码拆分为多个可复用的组件
2. **响应式数据**：使用 Vue 的响应式系统管理状态
3. **生命周期钩子**：使用 `onMounted`、`onBeforeUnmount` 管理资源
4. **事件处理**：使用 `emit` 进行父子组件通信
5. **Props/Emits**：组件间数据传递

## 使用说明

1. 点击"导入 JSON"按钮上传电力拓扑数据文件
2. 使用"适配屏幕"按钮调整视图
3. 使用"编辑模式"按钮开启编辑功能
4. 在编辑模式下可以：
   - 点击节点编辑属性
   - 从左侧工具栏拖拽添加新节点
   - 使用"添加节点"按钮创建节点
   - 使用"删除选中"按钮删除节点
   - 使用"连接节点"按钮创建节点连线
5. 使用"导出 SVG"按钮导出当前视图

## 注意事项

- 请确保已正确安装 Node.js 和 npm
- 项目依赖 `antv-x6.min.js` 和 `dagre.min.js` 必须在 `/src/assets/js/` 目录下
- 数据文件放在 `/public/郑州城区内主网数据/` 目录下
