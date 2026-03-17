// 电压等级对应的颜色映射 (KV -> Color)
export const CONFIG = {
  colors: {
    220: 'rgb(192, 0, 192)', // 紫色
    110: 'rgb(0, 128, 0)', // 绿色
    35: 'rgb(255, 204, 0)', // 黄色
    10: 'rgb(185, 72, 66)', // 红色
    virtual: '#9e9e9e', // 虚拟节点灰色
    default: '#b0bec5',
  },
  // 各类设备的默认尺寸
  nodeSize: {
    topBus: { width: 300, height: 4 }, // 顶部母线
    leafBus: { width: 20, height: 3 }, // 叶子母线 (开关下面那个小横杠)
    trafo: { width: 60, height: 60 }, // 变压器
    switch: { width: 14, height: 42 }, // 开关 (标准高度42)
  },
}
