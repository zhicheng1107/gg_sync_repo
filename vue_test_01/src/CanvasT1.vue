<template>
  <div class="canvas-container" ref="canvasContainer" @contextmenu.prevent>
    <!-- 工具栏 -->
    <div class="toolbar">
      <!-- <button @click="autoCenter" title="自动居中">🎯</button> -->
      <button @click="centerCanvas" title="画布居中" style="font-size: 14px;">🎯</button> <!-- 新增的居中按钮 -->
      <button @click="zoomIn" title="放大">➕</button>
      <button @click="zoomOut" title="缩小">➖</button>
      <button @click="resetZoom" title="重置">↺</button>
      <span class="zoom-display">{{ Math.round(currentZoom * 100) }}%</span>
    </div>

    <!-- 画布视口 -->
    <div class="canvas-viewport" 
         @mousedown="startPan" 
         @wheel="handleWheel"
         ref="canvasViewport">
      <!-- 变换层 -->
      <div class="canvas-transform-layer" :style="transformStyle">
        <!-- 内容层 -->
        <div class="canvas-content" ref="canvasContent">
          <div class="grid-background"></div>
          
          <div v-for="(item, index) in contentItems" 
               :key="index" 
               :id="`item-${index}`" 
               class="content-item"
               :style="getItemStyle(item)"
               @mousedown.stop="startDrag($event, index)">
            {{ item.text }}
          </div>
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
      
      // 平移状态
      isPanning: false,
      panStartX: 0,
      panStartY: 0,
      offsetX: 0,
      offsetY: 0,
      
      // 元素拖拽
      draggingIndex: null,
      dragStartX: 0,
      dragStartY: 0,
      itemStartX: 0,
      itemStartY: 0,
      
      // 画布尺寸 - 使用百分比铺满
      canvasWidth: 0,  // 动态计算
      canvasHeight: 0, // 动态计算
      
      contentItems: [
        { text: '开始节点', top: 100, left: 100, background: '#4caf50' },
        { text: '处理节点', top: 300, left: 400, background: '#2196f3' },
        { text: '判断节点', top: 300, left: 700, background: '#ff9800' },
        { text: '结束节点', top: 500, left: 400, background: '#f44336' }
      ],
      
      jsPlumbInstance: null
    };
  },
  
  computed: {
    transformStyle() {
      return {
        transform: `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.currentZoom})`,
        transformOrigin: '50% 50%',
        // transformOrigin: '50 left',
        transition: this.isPanning ? 'none' : 'transform 0.1s ease-out',
        width: '100%',
        height: '100%'
      };
    }
  },
  
  mounted() {
    this.updateCanvasSize();
    this.initJsPlumb();
    
    // 初始时自动居中
    this.$nextTick(() => {
      this.centerCanvas();
    });
    
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('selectstart', this.preventSelection);
  },
  
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('selectstart', this.preventSelection);
    
    if (this.jsPlumbInstance) {
      this.jsPlumbInstance.destroy();
    }
  },
  
  methods: {
    updateCanvasSize() {
      const viewport = this.$refs.canvasViewport;
      if (viewport) {
        const rect = viewport.getBoundingClientRect();
        this.canvasWidth = rect.width;
        this.canvasHeight = rect.height;
      }
    },
    
    getItemStyle(item) {
      return {
        top: `${item.top}px`,
        left: `${item.left}px`,
        background: item.background || '#2196f3'
      };
    },
    
    startPan(e) {
      if (e.button !== 0 || e.target.closest('.content-item')) return;
      
      this.isPanning = true;
      this.panStartX = e.clientX - this.offsetX;
      this.panStartY = e.clientY - this.offsetY;
      this.$refs.canvasViewport.style.cursor = 'grabbing';
    },
    
    startDrag(e, index) {
      if (e.target.classList.contains('jtk-endpoint')) return;
      
      e.stopPropagation();
      this.draggingIndex = index;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.itemStartX = this.contentItems[index].left;
      this.itemStartY = this.contentItems[index].top;
    },
    
    onMouseMove(e) {
      if (this.isPanning) {
        this.offsetX = e.clientX - this.panStartX;
        this.offsetY = e.clientY - this.panStartY;
        return;
      }
      
      if (this.draggingIndex !== null) {
        const deltaX = (e.clientX - this.dragStartX) / this.currentZoom;
        const deltaY = (e.clientY - this.dragStartY) / this.currentZoom;
        
        let newLeft = this.itemStartX + deltaX;
        let newTop = this.itemStartY + deltaY;
        
        const itemWidth = 120;
        const itemHeight = 60;
        
        newLeft = Math.max(0, Math.min(newLeft, this.canvasWidth - itemWidth));
        newTop = Math.max(0, Math.min(newTop, this.canvasHeight - itemHeight));
        
        this.contentItems[this.draggingIndex].left = newLeft;
        this.contentItems[this.draggingIndex].top = newTop;
        
        if (this.jsPlumbInstance) {
          this.jsPlumbInstance.revalidate(`item-${this.draggingIndex}`);
        }
      }
    },
    
    onMouseUp() {
      if (this.isPanning) {
        this.isPanning = false;
        this.$refs.canvasViewport.style.cursor = 'grab';
      }
      this.draggingIndex = null;
    },
    
    handleWheel(e) {
      e.preventDefault();
      
      const rect = this.$refs.canvasViewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const worldX = (mouseX - this.offsetX) / this.currentZoom;
      const worldY = (mouseY - this.offsetY) / this.currentZoom;
      
      const delta = e.deltaY > 0 ? -this.zoomStep : this.zoomStep;
      const newZoom = Math.max(this.minZoom, Math.min(this.currentZoom + delta, this.maxZoom));
      
      this.offsetX = mouseX - worldX * newZoom;
      this.offsetY = mouseY - worldY * newZoom;
      this.currentZoom = newZoom;
    },
    
    zoomIn() {
      this.zoomAtCenter(this.zoomStep);
    },
    
    zoomOut() {
      this.zoomAtCenter(-this.zoomStep);
    },
    
    resetZoom() {
      this.currentZoom = 1;
      this.centerCanvas(); // 重置缩放时也居中
    },
    
    zoomAtCenter(delta) {
      const rect = this.$refs.canvasViewport.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const worldX = (centerX - this.offsetX) / this.currentZoom;
      const worldY = (centerY - this.offsetY) / this.currentZoom;
      
      const newZoom = Math.max(this.minZoom, Math.min(this.currentZoom + delta, this.maxZoom));
      
      this.offsetX = centerX - worldX * newZoom;
      this.offsetY = centerY - worldY * newZoom;
      this.currentZoom = newZoom;
    },
    
    // 新增：画布居中方法 - 将画布内容移动到视口中心
    centerCanvas() {
      const viewport = this.$refs.canvasViewport;
      if (!viewport) return;
      
      const viewportRect = viewport.getBoundingClientRect();
      const canvasContent = this.$refs.canvasContent;

      
      if (!canvasContent) return;
      
      // 计算画布内容的实际尺寸
      const contentRect = canvasContent.getBoundingClientRect();
      const contentWidth = contentRect.width;
      const contentHeight = contentRect.height;
      console.log(contentWidth, contentHeight);
      
      // 计算需要平移的距离，使画布内容在视口中居中
      // 公式：偏移量 = (视口尺寸 - 内容尺寸 * 缩放) / 2
      // this.offsetX = (viewportRect.width - contentWidth * this.currentZoom) / 2;
      // this.offsetY = (viewportRect.height - contentHeight * this.currentZoom) / 2;
      // this.offsetX = (viewportRect.width - contentWidth) / 2;
      // this.offsetY = (viewportRect.height - contentHeight) / 2;
      this.offsetX=0;this.offsetY=0;

      // eslint-disable-next-line no-debugger
      debugger
      console.log('viewportRect:', viewportRect, contentRect, this.currentZoom);
      console.log('offsetX:', this.offsetX, 'offsetY:', this.offsetY);
    },
    
    // 原有的自动居中方法（基于内容边界框）
    autoCenter() {
      this.updateCanvasSize();
      const viewport = this.$refs.canvasViewport;
      if (!viewport) return;
      
      const viewportRect = viewport.getBoundingClientRect();
      
      // 计算内容的边界框
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      
      this.contentItems.forEach(item => {
        minX = Math.min(minX, item.left);
        minY = Math.min(minY, item.top);
        maxX = Math.max(maxX, item.left + 120); // item width
        maxY = Math.max(maxY, item.top + 60);   // item height
      });
      
      // 如果没有元素，使用默认尺寸
      if (minX === Infinity) {
        minX = 0; minY = 0;
        maxX = 800; maxY = 600;
      }
      
      const contentWidth = maxX - minX;
      const contentHeight = maxY - minY;
      
      // 计算居中偏移：视口中心 - 内容中心 * 缩放
      this.offsetX = (viewportRect.width - contentWidth * this.currentZoom) / 2 - minX * this.currentZoom;
      this.offsetY = (viewportRect.height - contentHeight * this.currentZoom) / 2 - minY * this.currentZoom;
    },
    
    handleResize() {
      this.updateCanvasSize();
      this.$nextTick(() => {
        this.centerCanvas();
      });
    },
    
    preventSelection(e) {
      if (this.isPanning || this.draggingIndex !== null) {
        e.preventDefault();
      }
    },
    
    initJsPlumb() {
      this.jsPlumbInstance = jsPlumb.getInstance({
        Container: this.$refs.canvasContent,
        
        Connector: ['Bezier', { curviness: 80 }],
        PaintStyle: { 
          stroke: '#5c6bc0', 
          strokeWidth: 2,
          outlineStroke: 'white',
          outlineWidth: 2
        },
        HoverPaintStyle: { 
          stroke: '#e91e63', 
          strokeWidth: 3 
        },
        
        Endpoint: ['Dot', { radius: 6 }],
        EndpointStyle: { 
          fill: '#5c6bc0',
          stroke: 'white',
          strokeWidth: 2
        },
        EndpointHoverStyle: { 
          fill: '#e91e63',
          radius: 8
        },
        
        Anchors: ['Top', 'Right', 'Bottom', 'Left'],
        MaxConnections: -1,
        
        ConnectionOverlays: [
          ['Arrow', { 
            location: 1, 
            width: 12, 
            length: 12,
            foldback: 0.8
          }]
        ],
        
        DragOptions: { disabled: true }
      });
      
      this.$nextTick(() => {
        this.contentItems.forEach((_, index) => {
          const elementId = `item-${index}`;
          
          this.jsPlumbInstance.addEndpoint(elementId, {
            anchor: ['Right', 'Left'],
            isSource: true,
            isTarget: false,
            maxConnections: -1
          });
          
          this.jsPlumbInstance.addEndpoint(elementId, {
            anchor: ['Left', 'Right'],
            isSource: false,
            isTarget: true,
            maxConnections: -1
          });
        });
        
        this.jsPlumbInstance.connect({
          source: 'item-0',
          target: 'item-1',
          anchors: ['Right', 'Left']
        });
      });
    }
  }
};
</script>

<style scoped>
/* 原有样式保持不变 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.canvas-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.canvas-viewport {
  width: 100%;
  height: 100%;
  cursor: grab;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.canvas-viewport:active {
  cursor: grabbing;
}

.canvas-transform-layer {
  position: relative;
  width: 100%;
  height: 100%;
  will-change: transform;
}

.canvas-content {
  position: relative;
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.grid-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.content-item {
  position: absolute;
  padding: 16px 24px;
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 500;
  font-size: 14px;
  cursor: move;
  user-select: none;
  transition: box-shadow 0.2s, transform 0.1s;
  z-index: 10;
  min-width: 120px;
  text-align: center;
}

.content-item:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.content-item:active {
  cursor: grabbing;
}

:deep(.jtk-connector) {
  z-index: 5;
}

:deep(.jtk-endpoint) {
  z-index: 6;
  cursor: crosshair;
}

:deep(.jtk-endpoint:hover) {
  transform: scale(1.2);
}

:deep(.jtk-overlay) {
  z-index: 7;
}

.toolbar {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.toolbar button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #f0f2f5;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toolbar button:hover {
  background: #e4e6e9;
  transform: translateY(-2px);
}

.toolbar button:active {
  transform: translateY(0);
}

.zoom-display {
  text-align: center;
  font-size: 12px;
  color: #65676b;
  font-weight: 600;
  padding: 4px;
  background: #f0f2f5;
  border-radius: 6px;
  margin-top: 4px;
}
</style>