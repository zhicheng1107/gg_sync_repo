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
      <div class="canvas-content" :style="canvasStyle" @mousedown="startPan" @wheel="handleWheel" ref="canvasContent">
        <!-- 示例内容 -->
        <div class="grid-background"></div>
        <div v-for="(item, index) in contentItems" :key="index" :id="`item-${index}`" class="content-item"
          :style="{ top: item.top + 'px', left: item.left + 'px', background: item.background || '#2196f3' }"
          @mousedown="startDrag($event, index)">
          {{ item.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { jsPlumb } from 'jsplumb';

export default {
  name: 'InteractiveCanvas',
  data() {
    return {
      currentZoom: 1,
      minZoom: 0.1,
      maxZoom: 5,
      zoomStep: 0.1,
      panStartX: 0,
      panStartY: 0,
      isPanning: false,
      offsetX: 0,
      offsetY: 0,
      startX: 0,
      startY: 0,
      containerWidth: window.innerWidth,
      containerHeight: window.innerHeight,
      contentWidth: 0,
      contentHeight: 0,
      draggingIndex: null,
      dragStartX: 0,
      dragStartY: 0,
      contentItems: [
        { text: '示例内容', top: 0, left: 0 },
        { text: '可移动内容', top: 200, left: 300 },
        { text: '更多元素', top: 400, left: 150, background: '#8bc34a' },
        { text: '元素4', top: 100, left: 500, background: '#ff9800' },
        { text: '元素5', top: 500, left: 400, background: '#9c27b0' }
      ],
      jsPlumbInstance: null
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
    this.updateContentSize();
    this.autoCenter();
    this.initJsPlumb();
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('selectstart', this.preventDefault);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('selectstart', this.preventDefault);
    this.jsPlumbInstance.reset();
  },
  methods: {
    preventDefault(e) {
      if (this.isPanning || this.draggingIndex !== null) {
        e.preventDefault();
        return false;
      }
    },

    updateContentSize() {
      const containerRect = this.$refs.canvasContainer.getBoundingClientRect();
      this.contentWidth = containerRect.width;
      this.contentHeight = containerRect.height;
    },

    autoCenter() {
      const containerRect = this.$refs.canvasContainer.getBoundingClientRect();
      const contentWidth = this.contentWidth * this.currentZoom;
      const contentHeight = this.contentHeight * this.currentZoom;

      this.offsetX = (containerRect.width - contentWidth) / 2;
      this.offsetY = (containerRect.height - contentHeight) / 2;

      this.currentZoom = 1;
    },

    zoomIn() {
      const newZoom = Math.min(this.currentZoom + this.zoomStep, this.maxZoom);
      this.setZoomWithCenter(newZoom);
    },

    zoomOut() {
      const newZoom = Math.max(this.currentZoom - this.zoomStep, this.minZoom);
      this.setZoomWithCenter(newZoom);
    },

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

    startPan(e) {
      if (e.button !== 0) return;
      this.isPanning = true;
      this.panStartX = e.clientX - this.offsetX;
      this.panStartY = e.clientY - this.offsetY;
      e.preventDefault();
    },

    pan(e) {
      if (!this.isPanning) return;

      this.offsetX = e.clientX - this.panStartX;
      this.offsetY = e.clientY - this.panStartY;
    },

    endPan() {
      this.isPanning = false;
    },

    handleResize() {
      this.containerWidth = window.innerWidth;
      this.containerHeight = window.innerHeight;
      this.updateContentSize();
      this.$nextTick(() => {
        this.autoCenter();
      });
    },

    startDrag(event, index) {
      event.stopPropagation();
      this.draggingIndex = index;
      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
    },

    onMouseMove(event) {
      if (this.draggingIndex === null) return;

      const deltaX = event.clientX - this.dragStartX;
      const deltaY = event.clientY - this.dragStartY;

      const item = this.contentItems[this.draggingIndex];
      const newLeft = item.left + deltaX / this.currentZoom;
      const newTop = item.top + deltaY / this.currentZoom;

      const canvasRect = this.$refs.canvasContent.getBoundingClientRect();
      const itemWidth = 120;
      const itemHeight = 60;

      item.left = Math.max(0, Math.min(newLeft, canvasRect.width / this.currentZoom - itemWidth));
      item.top = Math.max(0, Math.min(newTop, canvasRect.height / this.currentZoom - itemHeight));

      this.dragStartX = event.clientX;
      this.dragStartY = event.clientY;
    },

    onMouseUp() {
      this.draggingIndex = null;
    },

    initJsPlumb() {
      this.jsPlumbInstance = jsPlumb.getInstance({
        Container: 'canvas-content',
        Connector: ['Bezier', { curviness: 80 }],
        Endpoint: ['Dot', { radius: 6 }],
        PaintStyle: { stroke: '#2196f3', strokeWidth: 2 },
        HoverPaintStyle: { stroke: '#ff5722', strokeWidth: 3 },
        EndpointHoverStyle: { 
          fill: '#e91e63',
          radius: 8
        },
        EndpointStyle: { 
          fill: '#456',
          outlineStroke: '#fff',
          outlineWidth: 2
        },
        ConnectionOverlays: [
          ['Arrow', { 
            width: 12, 
            length: 12, 
            location: 1,
            id: 'arrow',
            foldback: 0.8
          }],
          ['Label', {
            label: '',
            location: 0.5,
            cssClass: 'connection-label',
            id: 'label'
          }]
        ],
        DragOptions: { 
          cursor: 'crosshair',
          zIndex: 2000
        },
        Overlays: [
          ['Arrow', { location: 1, width: 10, length: 10 }]
        ]
      });

      this.contentItems.forEach((_, index) => {
        const elementId = `item-${index}`;
        this.jsPlumbInstance.addEndpoint(elementId, {
          anchors: ['Top', 'Right', 'Bottom', 'Left'],
          isSource: true,
          isTarget: true
        });
      });

      this.jsPlumbInstance.draggable(this.contentItems.map((_, index) => `item-${index}`));
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
  background-color: #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1;
  min-width: 120px;
  text-align: center;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-weight: 500;
  cursor: move;
  user-select: none;
}

.content-item:active {
  opacity: 0.8;
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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
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
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.toolbar button:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
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

.jtk-connector {
  z-index: 10;
}

.jtk-endpoint {
  z-index: 11;
  cursor: crosshair;
}

.jtk-overlay {
  z-index: 12;
}
</style>