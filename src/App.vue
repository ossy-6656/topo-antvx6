<template>
  <div id="app">
    <div class="app-header">
      <h1>电力系统可视化平台</h1>
      <div class="nav-tabs">
        <button 
          :class="{ active: activeTab === 'topology' }" 
          @click="activeTab = 'topology'"
        >
          拓扑图
        </button>
        <button 
          :class="{ active: activeTab === 'flow' }" 
          @click="activeTab = 'flow'"
        >
          潮流图
        </button>
      </div>
    </div>
    <div class="app-content">
      <PowerTopologyGraph v-if="activeTab === 'topology'" />
      <PowerFlowGraph v-if="activeTab === 'flow'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PowerTopologyGraph from './components/PowerTopologyGraph.vue'
import PowerFlowGraph from './components/PowerFlowGraph.vue'

const activeTab = ref('topology')
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background-color: #1a1a1a;
  color: #fff;
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #2a2a2a;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #444;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.app-header h1 {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.nav-tabs {
  display: flex;
  gap: 10px;
}

.nav-tabs button {
  padding: 8px 16px;
  border: 1px solid #555;
  background-color: #333;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  z-index: 101;
  position: relative;
}

.nav-tabs button:hover {
  background-color: #444;
}

.nav-tabs button.active {
  background-color: #1976D2;
  border-color: #1976D2;
}

.app-content {
  flex: 1;
  overflow: hidden;
  margin-top: 60px;
}
</style>