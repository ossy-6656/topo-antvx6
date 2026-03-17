<template>
  <div v-if="visible" id="dialogMask" @click="close"></div>
  <div v-if="visible" id="editDialog">
    <h3>{{ title }}</h3>
    <div class="form-group">
      <label>设备类型</label>
      <select id="editDeviceType" v-model="formData.deviceType" disabled="true" style="cursor: not-allowed;">
        <option value="bus">母线 (bus)</option>
        <option value="trafo-dual-winding">双绕组主变 (trafo-dual-winding)</option>
        <option value="trafo-three-winding">三绕组主变 (trafo-three-winding)</option>
        <option value="switch-liaison">联络开关 (switch-liaison)</option>
        <option value="switch-section">分段开关 (switch-section)</option>
        <option value="load">负荷 (load)</option>
        <option value="ac_line">线路 (ac_line)</option>
      </select>
    </div>
    <div class="form-group">
      <label>设备名称</label>
      <input
        type="text"
        id="editDeviceName"
        v-model="formData.name"
        placeholder="请输入设备名称"
      />
    </div>
    <div class="form-group">
      <label>电压等级 (kV)</label>
      <select
        id="editVnKv"
        v-model="formData.vnKv"
        style="width: 100%"
      >
        <option value="220">220kV</option>
        <option value="110">110kV</option>
        <option value="35">35kV</option>
        <option value="10">10kV</option>
      </select>
    </div>
    <div class="form-group">
      <label>所属变电站</label>
      <input
        type="text"
        id="editStation"
        v-model="formData.station"
        placeholder="请输入变电站名称"
      />
    </div>
    <div class="form-group" id="loadPowerGroup" v-show="showPowerFields">
      <label>初始功率 (MW)</label>
      <input
        type="number"
        step="0.001"
        id="editIniPower"
        v-model="formData.iniPower"
        placeholder="如: 6.26"
      />
    </div>
    <div class="form-group" id="maxPowerGroup" v-show="showPowerFields">
      <label>最大功率 (MW)</label>
      <input
        type="number"
        step="0.001"
        id="editMaxPower"
        v-model="formData.maxPower"
        placeholder="如: 10.0"
      />
    </div>
    <div class="btn-group">
      <button class="btn-cancel" @click="close">取消</button>
      <button class="btn-save" @click="save">保存</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  title: {
    type: String,
    default: '编辑节点'
  },
  nodeData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible', 'save'])

const formData = ref({
  deviceType: 'bus',
  name: '',
  vnKv: '',
  station: '',
  iniPower: '',
  maxPower: ''
})

const showPowerFields = computed(() => formData.value.deviceType === 'load')

const updatePowerFields = () => {
  // 触发重新计算 showPowerFields
}

watch(() => props.visible, (newVal) => {
  if (newVal && props.nodeData) {
    formData.value = {
      deviceType: props.nodeData.device_type || 'bus',
      name: props.nodeData.name || '',
      vnKv: props.nodeData.vn_kv || '',
      station: props.nodeData.station || '',
      iniPower: props.nodeData.ini_p_mw || '',
      maxPower: props.nodeData.max_p_mw || ''
    }
  }
})

const close = () => {
  emit('update:visible', false)
}

const save = () => {
  const data = {
    device_type: formData.value.deviceType,
    name: formData.value.name,
    vn_kv: formData.value.vnKv ? parseInt(formData.value.vnKv) : null,
    station: formData.value.station,
    ini_p_mw: parseFloat(formData.value.iniPower) || 0,
    max_p_mw: parseFloat(formData.value.maxPower) || 0
  }
  emit('save', data)
  close()
}
</script>

<style scoped>
/* 编辑对话框样式 */
#editDialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #2d2d2d;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  z-index: 1000;
  min-width: 300px;
}
#editDialog h3 {
  margin-top: 0;
  color: #fff;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
}
#editDialog .form-group {
  margin-bottom: 15px;
}
#editDialog label {
  display: block;
  color: #aaa;
  margin-bottom: 5px;
  font-size: 12px;
}
#editDialog input, #editDialog select {
  width: 100%;
  padding: 8px;
  background: #1a1a1a;
  border: 1px solid #444;
  color: #fff;
  border-radius: 4px;
  box-sizing: border-box;
}
#editDialog .btn-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}
#editDialog .btn-group button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
#editDialog .btn-save {
  background: #4caf50;
  color: white;
}
#editDialog .btn-cancel {
  background: #666;
  color: white;
}

/* 遮罩层 */
#dialogMask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  z-index: 999;
}
</style>
