<template>
  <div id="app">
    <PowerTopologyGraph />
  </div>
</template>

<script setup>
import PowerTopologyGraph from './components/PowerTopologyGraph.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  width: 100%;
  height: 100vh;
}
</style>
