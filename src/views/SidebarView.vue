<script setup>
const props = defineProps({
  sessions: {
    type: Array,
    default: () => []
  },
  activeSessionId: Number
})

const emit = defineEmits(['set-active-session', 'add-new-session', 'delete-session'])

const selectSession = (sessionId) => {
  emit('set-active-session', sessionId)
}
const addSession = () => {
  emit('add-new-session')
}
const deleteSession = (sessionId) => {
  if (window.confirm('确定要删除这个会话吗？')) {
    emit('delete-session', sessionId)
  }
}
</script>

<template>
  <div class="sidebar-container">
    <el-tooltip content="添加新会话" placement="top">
      <el-button
        icon="CirclePlusFilled"
        style="font-size: 24px"
        class="add-session"
        @click="addSession"
      />
    </el-tooltip>
    <el-menu
      class="el-menu"
      :default-active="activeSessionId.toString()"
      background-color="#3b4a5a"
      text-color="#fff"
      active-text-color="#4caf50"
    >
      <el-menu-item
        v-for="session in sessions"
        :key="session.id"
        :index="session.id.toString()"
        @click="selectSession(session.id)"
        class="session-item"
      >
        {{ session.name }}
        <el-button
          v-if="session.id > 6"
          icon="Delete"
          class="delete-icon"
          @click.stop="deleteSession(session.id)"
          v-show="activeSessionId === session.id"
        />
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style scoped>
.sidebar-container {
  position: relative;
  background-color: #3b4a5a;
}
.sidebar-container:hover .toggle-icon {
  opacity: 1;
}

.active {
  outline: 2px solid #2c3e50;
}

.el-menu {
  width: 300px;
  background-color: #3b4a5a;
  color: white;
  transition: width 0.3s;
  overflow-x: hidden;
  border-right: none;
}
.session-list {
  background-color: #2c3e50;
  list-style: none;
  padding: 0;
}
.session-list li {
  cursor: pointer;
  padding: 10px 20px;
  border-bottom: 1px solid #34495e;
  transition:
    background-color 0.3s,
    box-shadow 0.3s;
}
.session-list li:hover {
  background-color: #34495e;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.session-list li.active {
  background-color: #34495e;
  color: white;
  border-left: 4px solid #4caf50;
  padding-left: 16px;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: none;
}

.session-item:hover .delete-icon,
.session-item.active .delete-icon {
  display: block;
}

.el-menu-item.is-active {
  border-left: 4px solid #409eff;
  background-color: #334455;
  color: white;
}

.el-menu-item:hover {
  background-color: #2c3e50;
}

.add-session {
  padding: 10px;
  margin-left: 43%;
  background-color: transparent;
  border: none;
  cursor: pointer;
  color: #fff;
}

.add-session:hover {
  color: #3ce767;
}

.delete-icon {
  display: none;
  cursor: pointer;
  margin-left: auto;
  transition: opacity 0.3s ease;
  background-color: transparent;
  border: none;
  color: #fff;
}

.delete-icon:hover {
  color: brown;
}

.session-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.session-list li:hover .delete-icon {
  opacity: 1;
}
</style>
