<template>
  <div class="canvas-container" ref="canvasContainer" @contextmenu.prevent>
    <!-- 工具栏 -->
    <div class="toolbar">
      <button @click="autoCenter" title="自动居中">🎯</button>
      <button @click="zoomIn" title="放大">➕</button>
      <button @click="zoomOut" title="缩小">➖</button>
      <span class="zoom-display">{{ Math.round(currentZoom * 100) }}%</span>
    </div>

    <!-- 画布内容 -->
    <div class="canvas-content-wrapper">
      <div 
        class="canvas-content"
        :style="canvasStyle"
        @mousedown="startPan"
        @wheel="handleWheel"
        ref="canvasContent"
      >
        <!-- 示例内容 -->
        <div class="grid-background"></div>
        <div class="content-item">示例内容</div>
        <div class="content-item" style="top: 200px; left: 300px;">可移动内容</div>
        <div class="content-item" style="top: 400px; left: 150px; background: #8bc34a;">更多元素</div>
        <div class="content-item" style="top: 100px; left: 500px; background: #ff9800;">元素4</div>
        <div class="content-item" style="top: 500px; left: 400px; background: #9c27b0;">元素5</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InteractiveCanvas',
  data() {
    return {
      currentZoom: 1, // 当前缩放比例
      minZoom: 0.1,   // 最小缩放比例
      maxZoom: 5,     // 最大缩放比例
      zoomStep: 0.1,  // 缩放步长
      panStartX: 0,
      panStartY: 0,
      isPanning: false,
      offsetX: 0,     // 平移偏移量
      offsetY: 0,
      startX: 0,
      startY: 0,
      containerWidth: window.innerWidth,
      containerHeight: window.innerHeight,
      contentWidth: 0,  // 画布实际宽度
      contentHeight: 0  // 画布实际高度
    };
  },
  computed: {
    canvasStyle() {
      return {
        transform: `scale(${this.currentZoom})`,
        transformOrigin: '50% 50%',
        transition: this.isPanning ? 'none' : 'transform 0.2s ease-out',
        cursor: this.isPanning ? 'grabbing' : 'grab'
      };
    }
  },
  mounted() {
    this.updateContentSize(); // 初始化画布尺寸
    this.autoCenter();
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('mousemove', this.pan);
    document.addEventListener('mouseup', this.endPan);
    document.addEventListener('selectstart', this.preventDefault);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('mousemove', this.pan);
    document.removeEventListener('mouseup', this.endPan);
    document.removeEventListener('selectstart', this.preventDefault);
  },
  methods: {
    // 阻止默认事件
    preventDefault(e) {
      if (this.isPanning) {
        e.preventDefault();
        return false;
      }
    },

    // 更新画布尺寸
    updateContentSize() {
      const containerRect = this.$refs.canvasContainer.getBoundingClientRect();
      this.contentWidth = containerRect.width;
      this.contentHeight = containerRect.height;
    },

    // 自动居中
    autoCenter() {
      const containerRect = this.$refs.canvasContainer.getBoundingClientRect();
      const contentWidth = this.contentWidth * this.currentZoom;
      const contentHeight = this.contentHeight * this.currentZoom;

      this.offsetX = (containerRect.width - contentWidth) / 2;
      this.offsetY = (containerRect.height - contentHeight) / 2;

      this.currentZoom = 1;
    },

    // 放大
    zoomIn() {
      const newZoom = Math.min(this.currentZoom + this.zoomStep, this.maxZoom);
      this.setZoomWithCenter(newZoom);
    },

    // 缩小
    zoomOut() {
      const newZoom = Math.max(this.currentZoom - this.zoomStep, this.minZoom);
      this.setZoomWithCenter(newZoom);
    },

    // 设置缩放（以画布中心为缩放中心点）
    setZoomWithCenter(zoomLevel) {
      const containerRect = this.$refs.canvasContainer.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;

      const currentCenterX = (centerX - this.offsetX) / this.currentZoom;
      const currentCenterY = (centerY - this.offsetY) / this.currentZoom;

      this.offsetX = centerX - currentCenterX * zoomLevel;
      this.offsetY = centerY - currentCenterY * zoomLevel;

      this.currentZoom = zoomLevel;
    },

    // 处理鼠标滚轮缩放
    handleWheel(e) {
      e.preventDefault();

      const containerRect = this.$refs.canvasContainer.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      const originalMouseX = (mouseX - this.offsetX) / this.currentZoom;
      const originalMouseY = (mouseY - this.offsetY) / this.currentZoom;

      const delta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
      const newZoom = Math.max(this.minZoom, Math.min(this.currentZoom + delta, this.maxZoom));

      this.offsetX = mouseX - originalMouseX * newZoom;
      this.offsetY = mouseY - originalMouseY * newZoom;

      this.currentZoom = newZoom;
    },

    // 开始平移
    startPan(e) {
      if (e.button !== 0) return;
      this.isPanning = true;
      this.panStartX = e.clientX - this.offsetX;
      this.panStartY = e.clientY - this.offsetY;
      e.preventDefault();
    },

    // 平移
    pan(e) {
      if (!this.isPanning) return;

      this.offsetX = e.clientX - this.panStartX;
      this.offsetY = e.clientY - this.panStartY;
    },

    // 结束平移
    endPan() {
      this.isPanning = false;
    },

    // 处理窗口大小变化
    handleResize() {
      this.containerWidth = window.innerWidth;
      this.containerHeight = window.innerHeight;
      this.updateContentSize(); // 更新画布尺寸
      this.$nextTick(() => {
        this.autoCenter();
      });
    }
  }
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  user-select: none;
}

.canvas-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: grab;
}

.canvas-container:active {
  cursor: grabbing;
}

.canvas-content-wrapper {
  width: 100%;
  height: 100%;
}

.canvas-content {
  position: relative;
  width: 100%;
  height: 100%;
  will-change: transform;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}

.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  z-index: 0;
  border-radius: 8px;
}

.content-item {
  position: absolute;
  padding: 20px;
  background: #2196f3;
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 1;
  min-width: 120px;
  text-align: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-weight: 500;
}

.toolbar {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 100;
  background: white;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
}

.toolbar button {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 8px;
  background: #f8f9fa;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.toolbar button:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.zoom-display {
  text-align: center;
  font-size: 14px;
  color: #495057;
  margin-top: 5px;
  font-weight: 500;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 6px;
  min-width: 60px;
}
</style>