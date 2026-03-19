<template>
  <div id="toolbar">
    <div class="file-input-wrapper">
      <span>导入 JSON</span>
      <input type="file" accept=".json" @change="handleFileUpload" />
    </div>
    <button class="btn" @click="$emit('zoom-to-fit')">适配屏幕</button>
    <button class="btn" @click="$emit('export-svg')">导出 SVG</button>
    <button class="btn" @click="$emit('export-xml')">导出 XML</button>
    <span id="status">{{ status }}</span>
  </div>
</template>

<script setup>
defineProps({
  status: String
})

defineEmits([
  'zoom-to-fit',
  'export-svg',
  'export-xml'
])

const handleFileUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (evt) => {
    try {
      const jsonData = JSON.parse(evt.target.result)
      document.dispatchEvent(new CustomEvent('file-loaded', { detail: jsonData }))
    } catch (err) {
      alert('JSON 格式错误')
    }
  }
  reader.readAsText(file)
}
</script>

<style scoped>
/* 顶部工具栏 */
#toolbar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50px;
  background: #252525;
  border-bottom: 1px solid #333;
  display: flex;
  align-items: center;
  padding: 0 20px;
  z-index: 100;
}

/* 文件上传按钮美化 */
.file-input-wrapper {
  position: relative;
  display: inline-block;
  margin-right: 15px;
  background: #00e676;
  color: #000;
  padding: 6px 15px;
  border-radius: 2px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.2s;
}
.file-input-wrapper:hover {
  background: #69f0ae;
}
.file-input-wrapper input {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

/* 普通按钮样式 */
.btn {
  background: #2979ff;
  color: #fff;
  border: none;
  padding: 6px 15px;
  margin-right: 15px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 13px;
  font-weight: bold;
}
.btn:hover {
  background: #2962ff;
}

/* 状态文字 */
#status {
  color: #888;
  font-size: 12px;
  font-family: monospace;
}
</style>
