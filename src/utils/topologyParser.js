import { CONFIG } from './config.js'

export class TopologyParser {
  constructor() {
    this.nodes = []
    this.edges = []
    this.idSet = new Set()
  }

  // 根据电压获取颜色
  getColor(vn) {
    if (vn >= 220) return CONFIG.colors[220]
    if (vn >= 110) return CONFIG.colors[110]
    if (vn >= 35) return CONFIG.colors[35]
    if (vn >= 10) return CONFIG.colors[10]
    return null
  }

  // 入口函数
  parse(jsonData) {
    this.nodes = []
    this.edges = []
    this.idSet.clear()
    // 兼容数组或单对象
    const roots = Array.isArray(jsonData.topology) ? jsonData.topology : [jsonData.topology]
    roots.forEach(root => {
      if (root) this.processNode(root, null)
    })
    return { nodes: this.nodes, edges: this.edges }
  }

  // [递归核心] 处理单个节点及其子节点
  processNode(device, parentId) {
    // 1. 生成唯一 ID
    let id = device.device_index
    if (!id || this.idSet.has(id)) id = `auto_${Math.random().toString(36).substr(2, 8)}`
    this.idSet.add(id)

    const type = device.device_type
    let vn = device.vn_kv

    // 2. 确定颜色 (优先用自己的电压，没有则继承父级)
    let color = this.getColor(vn)
    if (!color && parentId) {
      const pNode = this.nodes.find(n => n.id === parentId)
      if (pNode) color = pNode.data.color
    }
    if (!color) color = CONFIG.colors.default

    let label = device.name

    // 4. 构建节点对象基础结构
    let node = { id: id, shape: 'rect', data: { ...device, color, type } }

    // 5. 根据类型分配具体的形状和属性
    if (type === 'bus') {
      const isLeaf = !device.sub_devices || device.sub_devices.length === 0
      if (isLeaf) {
        node.shape = 'leaf-terminal'
        node.width = CONFIG.nodeSize.leafBus.width
        node.height = CONFIG.nodeSize.leafBus.height
        node.attrs = { body: { fill: color }, label: { text: label } }
        if (device.name && device.name.includes('虚拟')) {
          node.attrs = { body: { fill: CONFIG.colors.virtual }, label: { text: label } }
        }
      } else {
        node.shape = 'rect'
        node.width = CONFIG.nodeSize.topBus.width
        node.height = CONFIG.nodeSize.topBus.height
        node.attrs = {
          body: { fill: color, stroke: 'none' },
          label: { text: label, fill: '#fff', fontSize: 14, fontWeight: 'bold', refY: 25, textAnchor: 'start' },
        }
      }
    } else if (type === 'trafo-dual-winding') {
        node.shape = 'trafo-dual-winding'
        node.width = CONFIG.nodeSize.trafo.width
        node.height = CONFIG.nodeSize.trafo.height
        node.attrs = { c_top: { stroke: color }, c_bottom: { stroke: color }, label: { text: label } }
        if (node.data.sub_devices.length == 0) {
          node.attrs.label = {
            text: label,
            fill: '#fff',
            fontSize: 11,
            refX: -12,
            refY: 65,
            textAnchor: 'start',
          }
        }
      } else if (type === 'trafo-three-winding') {
      node.shape = 'trafo-three-winding'
      node.width = CONFIG.nodeSize.trafo.width
      node.height = CONFIG.nodeSize.trafo.height
      node.attrs = { c_top: { stroke: color }, c_left: { stroke: color }, c_right: { stroke: color }, c_bottom: { stroke: color }, label: { text: label } }
      if (node.data.sub_devices.length == 0) {
        node.attrs.label = {
          text: label,
          fill: '#fff',
          fontSize: 11,
          refX: -12,
          refY: 65,
          textAnchor: 'start',
        }
      }
    } else if (type === 'switch-liaison') {
      node.shape = 'switch-liaison'
      node.width = CONFIG.nodeSize.switch.width
      node.height = CONFIG.nodeSize.switch.height
      node.attrs = {
        body: { fill: color },
        label: { text: label, fill: '#fff', fontSize: 11, refX: 22, refY: 0, textAnchor: 'start', transform: 'rotate(90)' },
      }
    } else if (type === 'switch-section') {
        node.shape = 'switch-section'
        node.width = CONFIG.nodeSize.switch.width
        node.height = CONFIG.nodeSize.switch.height
        node.attrs = {
          body: { fill: 'none',stroke: color, strokeWidth: 2 },
          label: { text: label, fill: '#fff', fontSize: 11, refX: 22, refY: 0, textAnchor: 'start', transform: 'rotate(90)' },
        }
      } else if (type === 'load') {
      node.width = 35
      node.height = 35
      node.attrs = {
        body: { fill: 'none', stroke: color, strokeWidth: 2 },
        label: {
          html: this.moreLabel(node),
          fontSize: 11,
          textAnchor: 'left',
          x: -20,
          y: 10,
        },
      }
    } else {
      // 其他线路
      node.width = 2
      node.height = 30
      node.attrs = { body: { fill: color, stroke: 'none' }, label: { text: '' } }
    }

    this.nodes.push(node)

    // 6. 处理连线 (如果有父节点)
    if (parentId) {
      const parentNode = this.nodes.find(n => n.id === parentId)
      const parentIsSwitch = parentNode && (parentNode.data.device_type === 'switch-liaison' || parentNode.data.device_type === 'switch-section')
      const isSwitchToBus = parentIsSwitch && type === 'bus'
      let edgeConfig = {
        source: parentId,
        target: id,
        router: {
          name: 'manhattan',
          args: {
            padding: isSwitchToBus ? 1 : 50,
            startDirections: (parentNode.data.type === 'trafo-three-winding' || parentNode.data.type === 'trafo-dual-winding') && parentNode.data.sub_devices.length > 1 ? ['left', 'right'] : ['bottom'],
            endDirections: ['top']
          },
        },
        connector: { name: 'normal' },
        attrs: {
          line: {
            stroke: color,
            strokeWidth: 1.5,
            targetMarker: null,
          },
        },
        avoidNodes: true,
        zIndex: 0,
      }
      this.edges.push(edgeConfig)
    }

    // 7. 递归处理子设备
    if (device.sub_devices && Array.isArray(device.sub_devices)) {
      device.sub_devices.forEach(sub => this.processNode(sub, id))
    }
  }

  // 多行label设置
  moreLabel(node) {
    const num = 6
    let c = Math.floor(node.data.name.length / num) + 1
    let html = ''
    for (let i = 0; i < c; i++) {
      if (i == 0) {
        html += `<tspan x="-20" dy="25" fill="#fff">${node.data.name.slice(0, num)}</tspan>`
      } else {
        html += `<tspan x="-20" dy="15" fill="#fff">${node.data.name.slice(i * num, i * num + num)}</tspan>`
      }
    }
    html += `<tspan x="-20" dy="15" fill="red">${node.data.ini_p_mw}</tspan>
                <tspan x="-20" dy="15" fill="green">${node.data.max_p_mw}</tspan>`

    return html
  }
}
