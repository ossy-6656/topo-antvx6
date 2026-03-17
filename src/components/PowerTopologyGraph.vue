<template>
  <div class="power-topology-graph">
    <Toolbar
      :is-edit-mode="isEditMode"
      :is-connect-mode="isConnectMode"
      :status="status"
      :connect-status="connectStatus"
      @zoom-to-fit="zoomToFit"
      @export-svg="exportSVG"
      @export-xml="exportXML"
      @toggle-edit-mode="toggleEditMode"
      @toggle-connect-mode="toggleConnectMode"
    />

    <div
      id="container"
      ref="containerRef"
      @dragover="handleDragOver"
      @drop="handleDrop"
    ></div>

    <EditDialog
      v-model:visible="editDialogVisible"
      :title="'编辑节点'"
      :node-data="currentNodeData"
      @save="saveNodeEdit"
    />

    <!-- 删除确认对话框 -->
    <div v-if="deleteDialogVisible" class="delete-confirm-modal">
      <div class="modal-mask"></div>
      <div class="modal-container">
        <div class="modal-header">
          <h3>删除确认</h3>
        </div>
        <div class="modal-body">
          确定要删除节点 "{{ currentDeleteNode?.data?.name || currentDeleteNode?.id }}" 吗？
        </div>
        <div class="modal-footer">
          <button class="cancel-btn" @click="deleteDialogVisible = false">取消</button>
          <button class="confirm-btn" @click="confirmDeleteNode">确认删除</button>
        </div>
      </div>
    </div>

    <NodeToolbar
      :visible="isEditMode"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Toolbar from '@/components/Toolbar.vue'
import EditDialog from '@/components/EditDialog.vue'
import NodeToolbar from '@/components/NodeToolbar.vue'
import { TopologyParser } from '../utils/topologyParser'
import { registerX6Nodes } from '../utils/registerNodes.jsx'
import { CONFIG } from '../utils/config'

// 引入X6和dagre
let X6 = null
let dagre = null

const containerRef = ref(null)
const status = ref('等待上传...')
const connectStatus = ref('连接模式: 点击第一个节点')

// 编辑状态
const isEditMode = ref(false)
const isConnectMode = ref(false)
const selectedNode = ref(null)
const currentEditNodeId = ref(null)
const connectSourceNode = ref(null)

// 对话框状态
const editDialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const currentNodeData = ref({})
const currentDeleteNode = ref(null)

// 图实例
let graph = null
let parser = null

// 拖拽相关
const dragSourceType = ref(null)

// 加载脚本
const loadScripts = () => {
  return Promise.all([
    loadScript('/js/antv-x6.min.js'),
    loadScript('/js/dagre.min.js')
  ])
}

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// 初始化图
const initGraph = () => {
  X6 = window.X6
  dagre = window.dagre

  // 注册自定义节点
  registerX6Nodes(X6)

  // 初始化画布
  graph = new X6.Graph({
    container: containerRef.value,
    background: { color: '#1a1a1a' },
    panning: true,
    mousewheel: { enabled: true, modifiers: ['ctrl', 'meta'], minScale: 0.1, maxScale: 4 },
    interacting: { nodeMovable: false },
  })

  parser = new TopologyParser()

  // 绑定事件
  bindGraphEvents()
}

// 绑定图事件
const bindGraphEvents = () => {
  // 节点点击事件
  graph.on('node:click', evt => {
    if (isConnectMode.value) {
      handleConnectNodeClick(evt.node)
      return
    }

    if (isEditMode.value) {
      selectedNode.value = evt.node
      currentEditNodeId.value = evt.node.id
      currentNodeData.value = evt.node.data
      editDialogVisible.value = true
    } else {
      const currentItem = evt.node.data
      if (currentItem.device_type === 'switch') {
        alert(currentItem.name + ' ' + '被点击了！')
      }
      console.log('Clicked node:', evt.node.data)
    }
  })
  
  // 节点右键点击事件 - 删除节点
  graph.on('node:contextmenu', ({ e, node }) => {
    if (!isEditMode.value) return
    e.preventDefault()
    
    if (node) {
      currentDeleteNode.value = node
      deleteDialogVisible.value = true
    }
  })

  // 节点选中事件
  graph.on('node:selected', evt => {
    if (isEditMode.value) {
      selectedNode.value = evt.node
    }
  })

  // 节点取消选中事件
  graph.on('node:unselected', evt => {
    if (isEditMode.value && selectedNode.value === evt.node) {
      selectedNode.value = null
    }
  })
}

// 渲染数据
const renderData = (jsonContent) => {
  status.value = '正在计算布局...'
  try {
    const data = parser.parse(jsonContent)
    if (data.nodes.length === 0) throw new Error('无数据')

    // Dagre 布局计算
    const g = new dagre.graphlib.Graph()
    g.setGraph({
      type: 'dagre',
      rankdir: 'TB',
      nodesep: 40,
      ranksep: 56,
      edgesep: 30,
    })
    g.setDefaultEdgeLabel(() => ({}))

    data.nodes.forEach(node => {
      let w = node.width || 40
      let h = node.height || 40
      if (node.shape === 'switch-liaison') h = CONFIG.nodeSize.switch.height
      if (node.shape === 'leaf-terminal') h = CONFIG.nodeSize.leafBus.height
      if ((node.shape === 'trafo-three-winding' || node.shape === 'trafo-dual-winding') && node.data.vn_kv === 220) {
        h = CONFIG.nodeSize.trafo.height
        w = node.data.sub_devices && node.data.sub_devices.length > 1 ?
          280 + (node.data.sub_devices.length - 1) * 40 : 280
      }
      g.setNode(node.id, { width: w, height: h })
    })

    data.edges.forEach(edge => {
      if (edge.source && edge.target) {
        const srcNode = data.nodes.find(n => n.id === edge.source)
        const tgtNode = data.nodes.find(n => n.id === edge.target)
        const isSwitchToBus = srcNode &&
          (srcNode.data.device_type === 'switch-liaison' || srcNode.data.device_type === 'switch-section') &&
          tgtNode && tgtNode.data.type === 'bus'
        g.setEdge(edge.source, edge.target, { minlen: isSwitchToBus ? 1 : 2 })
        
        // 为ac_line类型边添加标签
        if (edge.data?.device_type === 'ac_line') {
          edge.attrs = {
            ...edge.attrs,
            label: {
              text: edge.data?.name || '',
              fill: '#fff',
              fontSize: 10,
              textAnchor: 'middle',
              textVerticalAnchor: 'middle'
            }
          }
        }
      }
    })

    dagre.layout(g)

    // 应用坐标
    data.nodes.forEach(node => {
      const coord = g.node(node.id)
      const cx = coord && isFinite(coord.x) ? coord.x : 0
      const cy = coord && isFinite(coord.y) ? coord.y : 0
      node.x = cx - node.width / 2
      node.y = cy - node.height / 2
    })

    // 布局后处理 - 紧凑对齐
    const GAP_SWITCH_TO_BUS = 50  // 开关到叶子母线的紧凑间距
    data.edges.forEach(edge => {
      const sourceNode = data.nodes.find(n => n.id === edge.source)
      const targetNode = data.nodes.find(n => n.id === edge.target)
      const srcIsSwitch = sourceNode && (sourceNode.data.device_type === 'switch-liaison' || sourceNode.data.device_type === 'switch-section')
      const tgtIsBus = targetNode && targetNode.data.type === 'bus'
      if (sourceNode && targetNode && srcIsSwitch && tgtIsBus) {
        const newY = sourceNode.y + sourceNode.height + GAP_SWITCH_TO_BUS
        targetNode.y = newY
        const sourceCenter = sourceNode.x + sourceNode.width / 2
        targetNode.x = sourceCenter - targetNode.width / 2
      }
    })
    // 变压器居中修正
    const trafoNodes = data.nodes.filter(n => n.data.type === 'trafo-three-winding')
    trafoNodes.forEach(trafo => {
      const childEdges = data.edges.filter(e => e.source === trafo.id)
      if (childEdges.length === 1) {
        const childId = childEdges[0].target
        const childNode = data.nodes.find(n => n.id === childId)
        if (childNode && childNode.data.type === 'bus') {
          const childCenterX = childNode.x + childNode.width / 2
          const newTrafoX = childCenterX - trafo.width / 2
          trafo.x = newTrafoX
        }
      }
    })
    // 绘制
    graph.clearCells()
    graph.fromJSON(data)
    graph.zoomToFit({ padding: 0, maxScale: 1 })
    status.value = `加载成功: ${data.nodes.length} 个设备`
  } catch (err) {
    console.error(err)
    alert('渲染错误: ' + err.message)
    status.value = '渲染失败'
  }
}

// 文件上传处理
const handleFileUpload = (jsonData) => {
  renderData(jsonData)
}

// 适配屏幕
const zoomToFit = () => {
  graph.zoomToFit({ padding: 20 })
}

// 导出SVG
const exportXML = () => {
  try {
    const now = new Date()
    const timestamp = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0')
    const filename = `电力拓扑图_${timestamp}.xml`
    
    // 获取所有节点和边数据
    const jsonData = graph.toJSON()
    
    // 转换为XML格式
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xmlContent += '<TopologyGraph>\n'
    
    // 添加节点数据
    xmlContent += '  <Nodes>\n'
    jsonData.cells
      .filter(cell => cell.shape)
      .forEach(node => {
        xmlContent += `    <Node id="${node.id}" type="${node.shape}">\n`
        if (node.data) {
          Object.entries(node.data).forEach(([key, value]) => {
            xmlContent += `      <Property name="${key}">${value}</Property>\n`
          })
        }
        xmlContent += '    </Node>\n'
      })
    xmlContent += '  </Nodes>\n'
    
    // 添加边数据
    xmlContent += '  <Edges>\n'
    jsonData.cells
      .filter(cell => cell.source && cell.target)
      .forEach(edge => {
        xmlContent += `    <Edge source="${edge.source}" target="${edge.target}">\n`
        if (edge.data) {
          Object.entries(edge.data).forEach(([key, value]) => {
            xmlContent += `      <Property name="${key}">${value}</Property>\n`
          })
        }
        xmlContent += '    </Edge>\n'
      })
    xmlContent += '  </Edges>\n'
    
    xmlContent += '</TopologyGraph>'
    
    // 创建下载
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    status.value = `已导出: ${filename}`
  } catch (err) {
    console.error('导出XML失败:', err)
    alert('导出XML失败: ' + err.message)
    status.value = 'XML导出失败'
  }
}

const exportSVG = () => {
  try {
    const now = new Date()
    const timestamp = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') + '_' +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0')
    const filename = `电力拓扑图_${timestamp}.svg`

    const container = containerRef.value
    const svgElement = container.querySelector('svg')

    if (!svgElement) {
      throw new Error('未找到SVG元素，请先加载拓扑图')
    }

    const clonedSvg = svgElement.cloneNode(true)
    const rect = svgElement.getBoundingClientRect()
    clonedSvg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`)
    clonedSvg.setAttribute('width', rect.width)
    clonedSvg.setAttribute('height', rect.height)
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

    const style = document.createElement('style')
    style.textContent = `
      .x6-graph-background {
        fill: #1a1a1a !important;
      }
      svg {
        background-color: #1a1a1a;
      }
    `
    clonedSvg.insertBefore(style, clonedSvg.firstChild)

    const svgString = new XMLSerializer().serializeToString(clonedSvg)
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    status.value = `已导出: ${filename}`
  } catch (err) {
    console.error('导出SVG失败:', err)
    alert('导出SVG失败: ' + err.message)
    status.value = '导出失败'
  }
}

// 切换编辑模式
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
  if (isEditMode.value) {
    graph.options.interacting = { nodeMovable: true }
    status.value = '编辑模式已开启'
  } else {
    graph.options.interacting = { nodeMovable: false }
    if (isConnectMode.value) {
      toggleConnectMode()
    }
    closeEditDialog()
    if (selectedNode.value) {
      selectedNode.value.setProp('selected', false)
      selectedNode.value = null
    }
    status.value = '编辑模式已退出'
  }
}

// 编辑节点
const saveNodeEdit = (data) => {
  if (!currentEditNodeId.value) return

  const node = graph.getCellById(currentEditNodeId.value)
  if (!node) {
    alert('未找到节点')
    return
  }

  const color = parser.getColor(data.vn_kv) || CONFIG.colors.default

  node.setData({
    ...node.data,
    device_type: data.device_type,
    name: data.name,
    vn_kv: data.vn_kv,
    station: data.station,
    ini_p_mw: data.ini_p_mw,
    max_p_mw: data.max_p_mw,
    color: color,
  })

  updateNodeStyle(node, data.device_type, color, data.name)
  status.value = '节点已更新'
}

// 更新节点样式
const updateNodeStyle = (node, type, color, label) => {
  if (type === 'bus') {
    node.setAttrs({
      body: { fill: color, stroke: 'none' },
      label: { text: label, fill: '#fff', fontSize: 14, fontWeight: 'bold', refY: 25, textAnchor: 'start' },
    })
    node.resize(CONFIG.nodeSize.topBus.width, CONFIG.nodeSize.topBus.height)

  } else if (type === 'switch-liaison') {
    // 联络开关：实心矩形，fill 为颜色
    node.setAttrs({
      body: { fill: color, stroke: 'none' },
    })
    node.resize(CONFIG.nodeSize.switch.width, CONFIG.nodeSize.switch.height)

  } else if (type === 'switch-section') {
    // 分段开关：空心矩形，stroke 为颜色
    node.setAttrs({
      body: { fill: 'none', stroke: color, strokeWidth: 2 },
    })
    node.resize(CONFIG.nodeSize.switch.width, CONFIG.nodeSize.switch.height)

  } else if (type === 'trafo-dual-winding') {
    // 双绕组变压器：两个圆圈描边颜色
    node.setAttrs({
      c_top:    { stroke: color },
      c_bottom: { stroke: color },
      label:    { text: label },
    })

  } else if (type === 'trafo-three-winding') {
    // 三绕组变压器：三个圆圈描边颜色
    node.setAttrs({
      c_top:   { stroke: color },
      c_left:  { stroke: color },
      c_right: { stroke: color },
      label:   { text: label },
    })

  } else if (type === 'load') {
    node.setAttrs({
      body: { fill: 'none', stroke: color, strokeWidth: 2 },
      label: { text: label },
    })
    node.resize(35, 35)
  }
}



// 连接节点
const toggleConnectMode = () => {
  isConnectMode.value = !isConnectMode.value
  if (isConnectMode.value) {
    connectStatus.value = '连接模式: 点击第一个节点'
    if (selectedNode.value) {
      selectedNode.value = null
    }
    connectSourceNode.value = null
  } else {
    connectStatus.value = '连接模式: 点击第一个节点'
    if (connectSourceNode.value) {
      connectSourceNode.value.setAttr('body/stroke', null)
      connectSourceNode.value = null
    }
  }
}

const handleConnectNodeClick = (node) => {
  if (!connectSourceNode.value) {
    connectSourceNode.value = node
    node.setAttrs({
      'body/stroke': '#ff9800',
      'body/strokeWidth': 3
    })
    connectStatus.value = '连接模式: 点击第二个节点'
  } else if (connectSourceNode.value.id === node.id) {
    node.setAttrs({
      'body/stroke': null,
      'body/strokeWidth': null
    })
    connectSourceNode.value = null
    connectStatus.value = '连接模式: 点击第一个节点'
  } else {
    createEdge(connectSourceNode.value, node)
    connectSourceNode.value.setAttrs({
      'body/stroke': null,
      'body/strokeWidth': null
    })
    connectSourceNode.value = null
    connectStatus.value = '连接模式: 点击第一个节点'
  }
}

const createEdge = (sourceNode, targetNode) => {
  const sourceData = sourceNode.data
  const targetData = targetNode.data
  const color = sourceData.color || targetData.color || CONFIG.colors.default

  const edgeId = 'edge_' + Math.random().toString(36).substr(2, 9)

  const edgeData = {
    id: edgeId,
    source: sourceNode.id,
    target: targetNode.id,
    router: {
      name: 'manhattan',
      args: {
        padding: 50,
        startDirections: ['bottom'],
        endDirections: ['top']
      },
    },
    connector: { name: 'normal' },
    attrs: {
      line: {
        stroke: color,
        strokeWidth: 2,
        targetMarker: { name: 'block', width: 8, height: 10, fill: color, stroke: 'none' },
      },
    },
    zIndex: 0,
  }

  graph.addEdge(edgeData)
  status.value = `已创建连线: ${sourceData.name || sourceNode.id} → ${targetData.name || targetNode.id}`
}

// 拖拽添加节点
const handleDragOver = (e) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'copy'
}

const handleDrop = (e) => {
  e.preventDefault()

  // 尝试获取JSON格式的数据
  let nodeType = 'bus'
  let voltage = 10

  try {
    const jsonData = e.dataTransfer.getData('application/json')
    if (jsonData) {
      const data = JSON.parse(jsonData)
      nodeType = data.type
      voltage = data.voltage
    } else {
      // 兼容旧格式
      nodeType = e.dataTransfer.getData('text/plain')
      voltage = 10
    }
  } catch (err) {
    nodeType = e.dataTransfer.getData('text/plain')
    voltage = 10
  }

  if (!nodeType) return

  const rect = containerRef.value.getBoundingClientRect()
  const localX = e.clientX - rect.left
  const localY = e.clientY - rect.top
  
  // 转换为画布坐标（考虑缩放和平移）
  const graphPoint = graph.clientToLocal({ x: localX, y: localY })

  addNodeByDrag(nodeType, graphPoint.x, graphPoint.y, voltage)
}

// 节点类型 → shape / 尺寸 / attrs 映射表
const NODE_TYPE_CONFIG = {
  'bus': {
    shape: 'rect',
    getSize: () => ({ width: CONFIG.nodeSize.topBus.width, height: CONFIG.nodeSize.topBus.height }),
    getAttrs: (color, name) => ({
      body: { fill: color, stroke: 'none' },
      label: { text: name, fill: '#fff', fontSize: 14, fontWeight: 'bold', refY: 25, textAnchor: 'start' },
    }),
  },
  'trafo-dual-winding': {
    shape: 'trafo-dual-winding',
    getSize: () => ({ width: CONFIG.nodeSize.trafo.width, height: CONFIG.nodeSize.trafo.height }),
    getAttrs: (color, name) => ({
      body: { fill: 'none', stroke: 'none' },
      c_top: { stroke: color },
      c_bottom: { stroke: color },
      label: { text: name },
    }),
  },
  'trafo-three-winding': {
    shape: 'trafo-three-winding',
    getSize: () => ({ width: CONFIG.nodeSize.trafo.width, height: CONFIG.nodeSize.trafo.height }),
    getAttrs: (color, name) => ({
      body: { fill: 'none', stroke: 'none' },
      c_top: { stroke: color },
      c_left: { stroke: color },
      c_right: { stroke: color },
      label: { text: name },
    }),
  },
  'switch-liaison': {
    shape: 'switch-liaison',
    getSize: () => ({ width: CONFIG.nodeSize.switch.width, height: CONFIG.nodeSize.switch.height }),
    getAttrs: (color, name) => ({
      body: { fill: color },
      label: { text: name, fill: '#fff', fontSize: 11, refX: 7, refY: 48, textAnchor: 'middle' },
    }),
  },
  'switch-section': {
    shape: 'switch-section',
    getSize: () => ({ width: CONFIG.nodeSize.switch.width, height: CONFIG.nodeSize.switch.height }),
    getAttrs: (color, name) => ({
      body: { fill: 'none', stroke: color, strokeWidth: 2 },
      label: { text: name, fill: '#fff', fontSize: 11, refX: 7, refY: 48, textAnchor: 'middle' },
    }),
  },
  'load': {
    shape: 'rect',
    getSize: () => ({ width: 35, height: 35 }),
    getAttrs: (color, name) => ({
      body: { fill: 'none', stroke: color, strokeWidth: 2 },
      label: { text: name, fill: '#fff', fontSize: 10, refY: 30, textAnchor: 'middle' },
    }),
  },
  'line': {
    shape: 'rect',
    getSize: () => ({ width: 2, height: 60 }),
    getAttrs: (color, name) => ({
      body: { fill: color, stroke: 'none' },
      label: { text: name, fill: '#fff', fontSize: 10, refX: 10, refY: '50%', textAnchor: 'start' },
    }),
  },
  'new-energy': {
    shape: 'rect',
    getSize: () => ({ width: 40, height: 40 }),
    getAttrs: (color, name) => ({
      body: { fill: 'none', stroke: color, strokeWidth: 2 },
      label: { text: name, fill: '#fff', fontSize: 10, refY: 50, textAnchor: 'middle' },
    }),
  },
}

const addNodeByDrag = (nodeType, x, y, voltage = 10) => {
  const newId = 'drag_' + Math.random().toString(36).substr(2, 9)
  const vnKv = Number(voltage)
  const color = parser.getColor(vnKv) || CONFIG.colors.default
  const defaultName = getDefaultNodeName(nodeType, vnKv)

  const typeCfg = NODE_TYPE_CONFIG[nodeType]
  if (!typeCfg) {
    console.warn(`未知节点类型: ${nodeType}，跳过添加`)
    return
  }

  const { width, height } = typeCfg.getSize()

  const nodeData = {
    id: newId,
    shape: typeCfg.shape,
    x: x - width / 2,
    y: y - height / 2,
    width,
    height,
    attrs: typeCfg.getAttrs(color, defaultName),
    data: {
      device_index: newId,
      device_type: nodeType,
      name: defaultName,
      vn_kv: vnKv,
      station: '',
      ini_p_mw: 0,
      max_p_mw: 1,
      color,
      sub_devices: [],
    },
  }

  graph.addNode(nodeData)
  status.value = `已添加 ${defaultName}`
}

const getDefaultNodeName = (nodeType, voltage = null) => {
  const voltageStr = voltage ? `${voltage}kV` : ''
  const names = {
    'bus': `新母线${voltageStr}`,
    'trafo-dual-winding': `双绕组变压器${voltageStr}`,
    'trafo-three-winding': `三绕组变压器${voltageStr}`,
    'switch-liaison': `联络开关${voltageStr}`,
    'switch-section': `分段开关${voltageStr}`,
    'load': `新负荷${voltageStr}`,
    'line': `新线路${voltageStr}`,
    'new-energy': `新能源${voltageStr}`,
  }
  return names[nodeType] || '新设备'
}

// 确认删除节点
const confirmDeleteNode = () => {
  if (currentDeleteNode.value) {
    const nodeId = currentDeleteNode.value.id
    const nodeName = currentDeleteNode.value.data.name
    currentDeleteNode.value.remove()
    status.value = `已删除节点: ${nodeName || nodeId}`
    
    // 清除选中状态
    if (selectedNode.value === currentDeleteNode.value) {
      selectedNode.value = null
    }
    
    currentDeleteNode.value = null
    deleteDialogVisible.value = false
  }
}

// 关闭对话框
const closeEditDialog = () => {
  editDialogVisible.value = false
  currentEditNodeId.value = null
}

// 键盘快捷键
const handleKeyDown = (e) => {
  if (!isEditMode.value) return
  
  if (e.key === 'Escape') {
    closeEditDialog()
  }
}

// 文件加载事件处理函数（保持引用以便移除）
const onFileLoaded = (e) => {
  handleFileUpload(e.detail)
}

onMounted(() => {
  loadScripts().then(() => {
    initGraph()

    // 监听文件加载事件
    document.addEventListener('file-loaded', onFileLoaded)
  })

  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('file-loaded', onFileLoaded)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.power-topology-graph {
  width: 100%;
  height: 100vh;
  background-color: #1a1a1a;
  color: #fff;
  font-family: 'Arial', sans-serif;
  overflow: hidden;
}

#container {
  width: 100%;
  height: 100vh;
  margin-top: 0;
}

.delete-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
}

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  background-color: #2a2a2a;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  padding: 20px;
}

.modal-header {
  margin-bottom: 20px;
  color: #fff;
}

.modal-body {
  margin-bottom: 20px;
  color: #eee;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn, .confirm-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  border: none;
}

.cancel-btn {
  background-color: #555;
  color: #fff;
}

.confirm-btn {
  background-color: #f56c6c;
  color: #fff;
}
</style>