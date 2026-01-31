    <template>
      <div class="canvas-wrapper" ref="canvasWrapper" @wheel="handleWheel">
        <div class="toolbar">
          <button @click="addComponent">添加组件</button>
          <button @click="zoomIn">放大</button>
          <button @click="zoomOut">缩小</button>
          <button @click="resetZoom">重置缩放</button>
        </div>
        <div class="canvas" @mousedown="startPan"
          :style="{ transform: `scale(${scale}) translate(${panOffsetX / scale}px, ${panOffsetY / scale}px)` }">
          <div v-for="component in components" :key="component.id" class="component"
            :class="{ selected: selectedComponent === component.id }" :style="{
              left: component.x + 'px',
              top: component.y + 'px',
              width: component.width + 'px',
              height: component.height + 'px'
            }" @mousedown.stop="startDrag($event, component)">
            {{ component.type }}
            <div class="resize-handle" @mousedown.stop="startResize($event, component)"></div>
          </div>
        </div>
      </div>
    </template>

<script>
export default {
  name: 'CanvasTest',
  data() {
    return {
      components: [],
      scale: 1,
      isDragging: false,
      isResizing: false,
      isPanning: false,
      selectedComponent: null,
      dragComponent: null,
      resizeComponent: null,
      dragStartX: 0,
      dragStartY: 0,
      componentStartX: 0,
      componentStartY: 0,
      componentStartWidth: 0,
      componentStartHeight: 0,
      panStartX: 0,
      panStartY: 0,
      panOffsetX: 0,
      panOffsetY: 0,
      componentId: 0
    }
  },
  methods: {
    addComponent() {
      this.componentId++
      this.components.push({
        id: this.componentId,
        type: '组件' + this.componentId,
        x: 100,
        y: 100,
        width: 100,
        height: 100
      })
    },

    selectComponent(id) {
      this.selectedComponent = id
    },

    startDrag(event, component) {
      this.isDragging = true
      this.dragComponent = component
      this.dragStartX = event.clientX
      this.dragStartY = event.clientY
      this.componentStartX = component.x
      this.componentStartY = component.y
      this.selectComponent(component.id)
    },

    handleDrag(event) {
      if (!this.isDragging || !this.dragComponent) return

      const deltaX = (event.clientX - this.dragStartX) / this.scale
      const deltaY = (event.clientY - this.dragStartY) / this.scale

      this.dragComponent.x = this.componentStartX + deltaX
      this.dragComponent.y = this.componentStartY + deltaY
    },

    endDrag() {
      this.isDragging = false
      this.dragComponent = null
    },

    startResize(event, component) {
      this.isResizing = true
      this.resizeComponent = component
      this.dragStartX = event.clientX
      this.dragStartY = event.clientY
      this.componentStartWidth = component.width
      this.componentStartHeight = component.height
      this.selectComponent(component.id)
    },

    handleResize(event) {
      if (!this.isResizing || !this.resizeComponent) return

      const deltaX = (event.clientX - this.dragStartX) / this.scale
      const deltaY = (event.clientY - this.dragStartY) / this.scale

      this.resizeComponent.width = Math.max(50, this.componentStartWidth + deltaX)
      this.resizeComponent.height = Math.max(50, this.componentStartHeight + deltaY)
    },

    endResize() {
      this.isResizing = false
      this.resizeComponent = null
    },

    startPan(event) {
      if (this.isDragging || this.isResizing) return
      this.isPanning = true
      this.panStartX = event.clientX - this.panOffsetX
      this.panStartY = event.clientY - this.panOffsetY
      this.$refs.canvasWrapper.style.cursor = 'grabbing'
    },

    handlePan(event) {
      if (this.isDragging) {
        this.handleDrag(event)
        return
      }

      if (this.isResizing) {
        this.handleResize(event)
        return
      }

      if (!this.isPanning) return

      this.panOffsetX = event.clientX - this.panStartX
      this.panOffsetY = event.clientY - this.panStartY
      this.$refs.canvasWrapper.style.transform = `translate(${this.panOffsetX}px, ${this.panOffsetY}px)`
    },

    endPan() {
      this.isPanning = false
      this.$refs.canvasWrapper.style.cursor = 'default'
    },

    zoomIn() {
      this.scale = Math.min(3, this.scale + 0.1)
    },

    zoomOut() {
      this.scale = Math.max(0.5, this.scale - 0.1)
    },

    resetZoom() {
      this.scale = 1
    },

    handleWheel(event) {
      const delta = event.deltaY > 0 ? -0.1 : 0.1
      this.scale = Math.min(3, Math.max(0.5, this.scale + delta))
    }
  },

  mounted() {
    document.addEventListener('mousemove', this.handlePan)
    document.addEventListener('mouseup', this.endDrag)
    document.addEventListener('mouseup', this.endResize)
    document.addEventListener('mouseup', this.endPan)
  },

  beforeDestroy() {
    document.removeEventListener('mousemove', this.handlePan)
    document.removeEventListener('mouseup', this.endDrag)
    document.removeEventListener('mouseup', this.endResize)
    document.removeEventListener('mouseup', this.endPan)
  }
}
</script>

<style scoped>
.canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #f0f0f0;
}

.toolbar {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
}

.canvas {
  position: relative;
  width: 100%;
  height: 100%;
  transform-origin: 0 0;
}

.component {
  position: absolute;
  background-color: #42b983;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  border: 2px solid transparent;
}

.component.selected {
  border-color: #333;
}

.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #333;
  bottom: 0;
  right: 0;
  cursor: se-resize;
}
</style>