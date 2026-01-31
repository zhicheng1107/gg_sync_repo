<template>
  <div>
    <el-row>
      <el-col :span="6">
        <div class="grid-content bg-purple">
          <div>这是第一个col中的div</div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="grid-content bg-purple-light">
          <el-button @click="centerAllDivs" style="margin-bottom: 10px;">居中显示</el-button>
          <!-- //实现一个矩形输入框，并且可以拖拽 拖拽结束之后，保存位置 -->
          <div class="grid-content bg-purple-light" :style="divStyle">
            <!-- //实现拖拽功能 -->
            <div v-for="(item, index) in draggableItems" :key="index"
              class="grid-content bg-purple-light resizable-draggable-item" :style="{
                position: 'absolute',
                left: item.position.x + 'px',
                top: item.position.y + 'px',
                width: item.size.width + 'px',
                height: item.size.height + 'px',
                zIndex: item.isDragging ? 1000 : 1
              }" @mousedown="startDrag(index, $event)">
              <div class="resize-handle resize-handle-right-bottom"
                @mousedown.stop="startResize(index, 'right-bottom', $event)"></div>
              <div class="resize-handle resize-handle-right" @mousedown.stop="startResize(index, 'right', $event)">
              </div>
              <div class="resize-handle resize-handle-bottom" @mousedown.stop="startResize(index, 'bottom', $event)">
              </div>
              <el-input v-model="item.value" placeholder="请输入内容"></el-input>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'DesignTest',
  data() {
    return {
      draggableItems: [
        {
          value: '',
          position: { x: 50, y: 50 },
          size: { width: 200, height: 100 },
          isDragging: false,
          isResizing: false
        },
        {
          value: '',
          position: { x: 100, y: 200 },
          size: { width: 250, height: 120 },
          isDragging: false,
          isResizing: false
        },
        {
          value: '',
          position: { x: 150, y: 350 },
          size: { width: 180, height: 80 },
          isDragging: false,
          isResizing: false
        }
      ],
      activeItemIndex: null,
      dragStart: { x: 0, y: 0 },
      resizeStart: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        type: ''
      },
      divStyle: {
        border: '1px dashed gray',
        padding: '10px',
        backgroundColor: '#ffffe0',
        width: '600px',
        height: '800px',
        position: 'relative'
      }
    }
  },
  mounted() {
    document.addEventListener('mousemove', this.onMouseMove)
    document.addEventListener('mouseup', this.stopInteraction)
  },
  beforeDestroy() {
    document.removeEventListener('mousemove', this.onMouseMove)
    document.removeEventListener('mouseup', this.stopInteraction)
  },
  methods: {
    centerAllDivs() {
      // 如果没有组件，直接返回
      if (this.draggableItems.length === 0) return;
      
      // 计算所有组件的边界框
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      this.draggableItems.forEach(item => {
        minX = Math.min(minX, item.position.x);
        minY = Math.min(minY, item.position.y);
        maxX = Math.max(maxX, item.position.x + item.size.width);
        maxY = Math.max(maxY, item.position.y + item.size.height);
      });
      
      // 计算边界框的中心点
      const bboxCenterX = (minX + maxX) / 2;
      const bboxCenterY = (minY + maxY) / 2;
      
      // 计算容器的中心点
      const containerWidth = 600;
      const containerHeight = 800;
      const containerCenterX = containerWidth / 2;
      const containerCenterY = containerHeight / 2;
      
      // 计算偏移量
      const offsetX = containerCenterX - bboxCenterX;
      const offsetY = containerCenterY - bboxCenterY;
      
      // 移动所有组件以保持相对位置
      this.draggableItems.forEach(item => {
        item.position.x += offsetX;
        item.position.y += offsetY;
      });
    },

    startDrag(index, event) {
      // 确保不是点击调整大小手柄
      if (event.target.classList.contains('resize-handle')) {
        return
      }

      this.activeItemIndex = index;
      const item = this.draggableItems[index];
      item.isDragging = true;
      this.dragStart.x = event.clientX - item.position.x;
      this.dragStart.y = event.clientY - item.position.y;
    },

    startResize(index, type, event) {
      this.activeItemIndex = index;
      const item = this.draggableItems[index];
      item.isResizing = true;
      this.resizeStart.type = type;
      this.resizeStart.x = event.clientX;
      this.resizeStart.y = event.clientY;
      this.resizeStart.width = item.size.width;
      this.resizeStart.height = item.size.height;
    },

    onMouseMove(event) {
      if (this.activeItemIndex !== null) {
        const item = this.draggableItems[this.activeItemIndex];
        if (item.isDragging) {
          item.position.x = event.clientX - this.dragStart.x;
          item.position.y = event.clientY - this.dragStart.y;
        } else if (item.isResizing) {
          this.handleResize(event);
        }
      }
    },

    handleResize(event) {
      const deltaX = event.clientX - this.resizeStart.x
      const deltaY = event.clientY - this.resizeStart.y

      let newWidth = this.resizeStart.width
      let newHeight = this.resizeStart.height

      switch (this.resizeStart.type) {
        case 'right':
          newWidth = Math.max(150, this.resizeStart.width + deltaX)
          break
        case 'bottom':
          newHeight = Math.max(60, this.resizeStart.height + deltaY)
          break
        case 'right-bottom':
          newWidth = Math.max(150, this.resizeStart.width + deltaX)
          newHeight = Math.max(60, this.resizeStart.height + deltaY)
          break
      }

      if (this.activeItemIndex !== null) {
        const item = this.draggableItems[this.activeItemIndex];
        item.size.width = newWidth;
        item.size.height = newHeight;
      }
    },

    stopInteraction() {
      if (this.activeItemIndex !== null) {
        const item = this.draggableItems[this.activeItemIndex];
        item.isDragging = false;
        item.isResizing = false;
        this.activeItemIndex = null;
      }
    }
  }
}
</script>

<style scoped>
.resizable-draggable-item {
  cursor: move;
  user-select: none;
  border: 1px solid #ccc;
  box-sizing: border-box;
  min-width: 150px;
  min-height: 60px;
  padding: 10px;
}

.resize-handle {
  position: absolute;
  z-index: 10;
}

.resize-handle-right-bottom {
  width: 10px;
  height: 10px;
  background-color: #409eff;
  bottom: 0;
  right: 0;
  cursor: nwse-resize;
}

.resize-handle-right {
  width: 6px;
  height: 100%;
  background-color: transparent;
  top: 0;
  right: 0;
  cursor: ew-resize;
}

.resize-handle-bottom {
  width: 100%;
  height: 6px;
  background-color: transparent;
  bottom: 0;
  left: 0;
  cursor: ns-resize;
}

.bg-purple {
  background: #d3dce6;
}

.bg-purple-light {
  background: #e5e9f2;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
  padding: 10px;
}
</style>