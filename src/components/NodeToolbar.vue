<template>
  <div v-if="visible" id="nodeToolbar">
    <h4>设备图元</h4>
    <div class="node-tools-container">
      <!-- 变压器类 -->
      <div class="category-group">
        <div class="category-label">变压器</div>
        <div class="tools-row">
          <!-- 双绕组变压器 -->
          <div
            class="node-tool"
            data-type="trafo-dual-winding"
            draggable="true"
            @dragstart="handleDragStart($event, 'trafo-dual-winding', 220)"
            @dragend="handleDragEnd"
            title="双绕组变压器"
          >
            <svg viewBox="0 0 50 40" class="node-icon">
              <circle
                cx="20"
                cy="20"
                r="10"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
              <circle
                cx="35"
                cy="20"
                r="10"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
            </svg>
            <span class="node-label">双绕组</span>
          </div>

          <!-- 三绕组变压器 -->
          <div
            class="node-tool"
            data-type="trafo-three-winding"
            draggable="true"
            @dragstart="handleDragStart($event, 'trafo-three-winding', 220)"
            @dragend="handleDragEnd"
            title="三绕组变压器"
          >
            <svg viewBox="0 0 50 45" class="node-icon">
              <circle
                cx="25"
                cy="15"
                r="12"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
              <circle
                cx="16"
                cy="33"
                r="12"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
              <circle
                cx="34"
                cy="33"
                r="12"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
            </svg>
            <span class="node-label">三绕组</span>
          </div>
        </div>
      </div>

      <!-- 线路类 -->
      <div class="category-group">
        <div class="category-label">线路</div>
        <div class="tools-row">
          <!-- 母线 -->
          <div
            class="node-tool"
            data-type="bus"
            draggable="true"
            @dragstart="handleDragStart($event, 'bus', 220)"
            @dragend="handleDragEnd"
            title="母线"
          >
            <svg viewBox="0 0 50 30" class="node-icon">
              <rect
                x="3"
                y="10"
                width="44"
                height="10"
                rx="1"
                fill="currentColor"
              />
            </svg>
            <span class="node-label">母线</span>
          </div>

          <!-- 线路 -->
          <div
            class="node-tool"
            data-type="line"
            draggable="true"
            @dragstart="handleDragStart($event, 'line', 220)"
            @dragend="handleDragEnd"
            title="线路"
          >
            <svg viewBox="0 0 50 30" class="node-icon">
              <line
                x1="5"
                y1="15"
                x2="45"
                y2="15"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
              />
            </svg>
            <span class="node-label">线路</span>
          </div>
        </div>
      </div>

      <!-- 开关类 -->
      <div class="category-group">
        <div class="category-label">开关</div>
        <div class="tools-row">
          <!-- 联络开关 -->
          <div
            class="node-tool"
            data-type="switch-liaison"
            draggable="true"
            @dragstart="handleDragStart($event, 'switch-liaison', 220)"
            @dragend="handleDragEnd"
            title="联络开关"
          >
            <svg viewBox="0 0 14 42" class="node-icon">
              <rect
                x="0"
                y="0"
                width="14"
                height="42"
                rx="1"
                fill="currentColor"
              />
            </svg>
            <span class="node-label">联络</span>
          </div>

          <!-- 分段开关 -->
          <div
            class="node-tool"
            data-type="switch-section"
            draggable="true"
            @dragstart="handleDragStart($event, 'switch-section', 220)"
            @dragend="handleDragEnd"
            title="分段开关"
          >
            <svg viewBox="0 0 14 42" class="node-icon">
              <rect
                x="0"
                y="0"
                width="14"
                height="42"
                rx="1"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
            </svg>
            <span class="node-label">分段</span>
          </div>
        </div>
      </div>

      <!-- 电源类 -->
      <div class="category-group">
        <div class="category-label">电源</div>
        <div class="tools-row">
          <!-- 新能源电源 -->
          <div
            class="node-tool"
            data-type="new-energy"
            draggable="true"
            @dragstart="handleDragStart($event, 'new-energy', 220)"
            @dragend="handleDragEnd"
            title="新能源电源"
          >
            <svg viewBox="0 0 35 35" class="node-icon">
              <path d="M17.5 5 L30 30 L5 30 Z" fill="none" stroke-width="2" />
            </svg>
            <span class="node-label">新能源</span>
          </div>
        </div>
      </div>

      <!-- 其他设备 -->
      <div class="category-group">
        <div class="category-label">其他</div>
        <div class="tools-row">
          <!-- 负荷 -->
          <div
            class="node-tool"
            data-type="load"
            draggable="true"
            @dragstart="handleDragStart($event, 'load', 10)"
            @dragend="handleDragEnd"
            title="负荷"
          >
            <svg viewBox="0 0 35 35" class="node-icon">
              <!-- 空心正方形主体 -->
              <rect
                x="7"
                y="7"
                width="21"
                height="21"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              />
            </svg>
            <span class="node-label">负荷</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  visible: Boolean,
});

const handleDragStart = (e, nodeType, voltage) => {
  const data = JSON.stringify({ type: nodeType, voltage: voltage });
  e.dataTransfer.setData("application/json", data);
  const tool = e.target.closest(".node-tool");
  if (tool) {
    tool.style.opacity = "0.5";
  }
};

const handleDragEnd = (e) => {
  const tool = e.target.closest(".node-tool");
  if (tool) {
    tool.style.opacity = "1";
  }
};
</script>

<style scoped>
/* 节点工具栏样式 */
#nodeToolbar {
  position: fixed;
  left: 10px;
  top: 60px;
  background: linear-gradient(180deg, #2d2d2d 0%, #1a1a1a 100%);
  border-radius: 8px;
  padding: 10px;
  z-index: 99;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  border: 1px solid #444;
  max-height: calc(100vh - 80px);
  overflow-y: auto;
}

#nodeToolbar h4 {
  margin: 0 0 8px 0;
  color: #fff;
  font-size: 13px;
  text-align: center;
  font-weight: normal;
  letter-spacing: 1px;
  border-bottom: 1px solid #444;
  padding-bottom: 8px;
}

.node-tools-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-group {
  padding-bottom: 6px;
  border-bottom: 1px solid #333;
}

.category-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.category-label {
  font-size: 11px;
  font-weight: bold;
  margin-bottom: 4px;
  padding-left: 2px;
  color: #fff;
}

.tools-row {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.node-tool {
  width: 52px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: grab;
  user-select: none;
  background: rgba(45, 45, 45, 0.8);
  border: 1px solid rgba(68, 68, 68, 0.5);
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.node-tool:hover {
  background: rgba(58, 58, 58, 0.9);
  border-color: rgba(102, 102, 102, 0.7);
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.node-tool:active {
  cursor: grabbing;
  transform: scale(0.95);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.node-icon {
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.3));
}

.node-label {
  font-size: 8px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 2px;
  white-space: nowrap;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
}

/* 220kV - 紫色 */
.node-tool[data-type^="bus-220"],
.node-tool[data-type^="trafo-dual-winding-220"],
.node-tool[data-type^="trafo-three-winding-220"],
.node-tool[data-type^="switch-open-220"],
.node-tool[data-type^="switch-close-220"] {
  border-color: rgba(192, 0, 192, 0.3);
}
.node-tool[data-type^="bus-220"]:hover,
.node-tool[data-type^="trafo-dual-winding-220"]:hover,
.node-tool[data-type^="trafo-three-winding-220"]:hover,
.node-tool[data-type^="switch-open-220"]:hover,
.node-tool[data-type^="switch-close-220"]:hover {
  border-color: rgb(192, 0, 192);
  background: rgba(192, 0, 192, 0.1);
}
.node-tool[data-type^="bus-220"] rect,
.node-tool[data-type^="trafo-dual-winding-220"] circle,
.node-tool[data-type^="trafo-three-winding-220"] circle,
.node-tool[data-type^="switch-open-220"] rect,
.node-tool[data-type^="switch-close-220"] rect {
  stroke: rgb(192, 0, 192);
}
.node-tool[data-type^="bus-220"] rect,
.node-tool[data-type^="switch-close-220"] rect {
  fill: rgb(192, 0, 192);
}
.node-tool[data-type^="trafo-dual-winding-220"] circle,
.node-tool[data-type^="trafo-three-winding-220"] circle,
.node-tool[data-type^="switch-open-220"] rect {
  fill: none;
}

/* 110kV - 绿色 */
.node-tool[data-type^="bus-110"],
.node-tool[data-type^="trafo-dual-winding-110"],
.node-tool[data-type^="trafo-three-winding-110"],
.node-tool[data-type^="switch-open-110"],
.node-tool[data-type^="switch-close-110"] {
  border-color: rgba(0, 128, 0, 0.3);
}
.node-tool[data-type^="bus-110"]:hover,
.node-tool[data-type^="trafo-dual-winding-110"]:hover,
.node-tool[data-type^="trafo-three-winding-110"]:hover,
.node-tool[data-type^="switch-open-110"]:hover,
.node-tool[data-type^="switch-close-110"]:hover {
  border-color: rgb(0, 128, 0);
  background: rgba(0, 128, 0, 0.1);
}
.node-tool[data-type^="bus-110"] rect,
.node-tool[data-type^="trafo-dual-winding-110"] circle,
.node-tool[data-type^="trafo-three-winding-110"] circle,
.node-tool[data-type^="switch-open-110"] rect,
.node-tool[data-type^="switch-close-110"] rect {
  stroke: rgb(0, 128, 0);
}
.node-tool[data-type^="bus-110"] rect,
.node-tool[data-type^="switch-close-110"] rect {
  fill: rgb(0, 128, 0);
}
.node-tool[data-type^="trafo-dual-winding-110"] circle,
.node-tool[data-type^="trafo-three-winding-110"] circle,
.node-tool[data-type^="switch-open-110"] rect {
  fill: none;
}

/* 35kV - 黄色 */
.node-tool[data-type^="bus-35"],
.node-tool[data-type^="trafo-dual-winding-35"],
.node-tool[data-type^="trafo-three-winding-35"],
.node-tool[data-type^="switch-open-35"],
.node-tool[data-type^="switch-close-35"] {
  border-color: rgba(255, 204, 0, 0.3);
}
.node-tool[data-type^="bus-35"]:hover,
.node-tool[data-type^="trafo-dual-winding-35"]:hover,
.node-tool[data-type^="trafo-three-winding-35"]:hover,
.node-tool[data-type^="switch-open-35"]:hover,
.node-tool[data-type^="switch-close-35"]:hover {
  border-color: rgb(255, 204, 0);
  background: rgba(255, 204, 0, 0.1);
}
.node-tool[data-type^="bus-35"] rect,
.node-tool[data-type^="trafo-dual-winding-35"] circle,
.node-tool[data-type^="trafo-three-winding-35"] circle,
.node-tool[data-type^="switch-open-35"] rect,
.node-tool[data-type^="switch-close-35"] rect {
  stroke: rgb(255, 204, 0);
}
.node-tool[data-type^="bus-35"] rect,
.node-tool[data-type^="switch-close-35"] rect {
  fill: rgb(255, 204, 0);
}
.node-tool[data-type^="trafo-dual-winding-35"] circle,
.node-tool[data-type^="trafo-three-winding-35"] circle,
.node-tool[data-type^="switch-open-35"] rect {
  fill: none;
}

/* 10kV - 红色 */
.node-tool[data-type^="bus-10"],
.node-tool[data-type^="trafo-dual-winding-10"],
.node-tool[data-type^="trafo-three-winding-10"],
.node-tool[data-type^="switch-open-10"],
.node-tool[data-type^="switch-close-10"],
.node-tool[data-type^="load-10"] {
  border-color: rgba(185, 72, 66, 0.3);
}
.node-tool[data-type^="bus-10"]:hover,
.node-tool[data-type^="trafo-dual-winding-10"]:hover,
.node-tool[data-type^="trafo-three-winding-10"]:hover,
.node-tool[data-type^="switch-open-10"]:hover,
.node-tool[data-type^="switch-close-10"]:hover,
.node-tool[data-type^="load-10"]:hover {
  border-color: rgb(185, 72, 66);
  background: rgba(185, 72, 66, 0.1);
}
.node-tool[data-type^="bus-10"] rect,
.node-tool[data-type^="trafo-dual-winding-10"] circle,
.node-tool[data-type^="trafo-three-winding-10"] circle,
.node-tool[data-type^="switch-open-10"] rect,
.node-tool[data-type^="switch-close-10"] rect,
.node-tool[data-type^="load-10"] rect {
  stroke: rgb(185, 72, 66);
}
.node-tool[data-type^="bus-10"] rect,
.node-tool[data-type^="switch-close-10"] rect {
  fill: rgb(185, 72, 66);
}
.node-tool[data-type^="trafo-dual-winding-10"] circle,
.node-tool[data-type^="trafo-three-winding-10"] circle,
.node-tool[data-type^="switch-open-10"] rect,
.node-tool[data-type^="load-10"] rect {
  fill: none;
}
</style>
