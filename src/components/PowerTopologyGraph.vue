<template>
  <div class="power-topology-graph">
    <Toolbar
      :status="status"
      @zoom-to-fit="zoomToFit"
      @export-svg="exportSVG"
      @export-xml="exportXML"
    />

    <div
      id="container"
      ref="containerRef"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Toolbar from '@/components/Toolbar.vue'
import { TopologyParser } from '../utils/topologyParser'
import { registerX6Nodes } from '../utils/registerNodes.jsx'
import { CONFIG } from '../utils/config'

// 引入X6和dagre
let X6 = null
let dagre = null

const containerRef = ref(null)
const status = ref('等待上传...')

// 图实例
let graph = null
let parser = null

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
    const currentItem = evt.node.data
    if (currentItem.device_type === 'switch') {
      alert(currentItem.name + ' ' + '被点击了！')
    }
    console.log('Clicked node:', evt.node.data)
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
    // 母线有子节点时，在母线正中间加一个圆点
    const DOT_R = 4
    data.nodes.forEach(busNode => {
      if (busNode.shape !== 'rect' || busNode.data?.device_type !== 'bus') return
      const hasChild = data.edges.some(e => e.source === busNode.id)
      if (!hasChild) return
      const dotCX = busNode.x + busNode.width / 2
      const dotCY = busNode.y + busNode.height / 2
      data.nodes.push({
        id: `dot_center_${busNode.id}`,
        shape: 'circle',
        x: dotCX - DOT_R,
        y: dotCY - DOT_R,
        width: DOT_R * 2,
        height: DOT_R * 2,
        attrs: { body: { fill: busNode.data.color, stroke: 'none' } },
        zIndex: 10,
      })
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
})

onBeforeUnmount(() => {
  document.removeEventListener('file-loaded', onFileLoaded)
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
</style>