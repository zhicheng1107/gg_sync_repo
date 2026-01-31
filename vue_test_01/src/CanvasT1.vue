<template>
  <div class="canvas-wrapper" ref="canvasWrapper" @wheel="handleWheel" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
    
    <!-- 工具栏 -->
    <div class="toolbar">
      <button @click="addComponent">添加组件</button>
      <button @click="zoomIn">放大</button>
      <button @click="zoomOut">缩小</button>
      <button @click="resetZoom">重置缩放</button>
      <button @click="fitToScreen">适应屏幕</button>
      <button @click="centerComponents">组件居中</button>
      <button @click="toggleWheelMode" :class="{ active: wheelMode === 'zoom' }">{{ wheelMode === 'zoom' ? '缩放模式' : '滚动模式' }}</button>
    </div>
    
    <div class="canvas-container" ref="canvasContainer">
      <div class="canvas" 
        :style="{ 
          width: canvasWidth + 'px', 
          height: canvasHeight + 'px',
          transform: `scale(${scale}) translate(${boundedPanOffsetX}px, ${boundedPanOffsetY}px)` 
        }">
        <div v-for="component in components" :key="component.id" class="component"
          :class="{ selected: selectedComponent === component.id }" :style="{
            left: component.x + 'px',
            top: component.y + 'px',
            width: component.width + 'px',
            height: component.height + 'px'
          }" @mousedown.stop="startDrag($event, component)">
          {{ component.type }} - {{ component.name }}
          <div class="resize-handle" @mousedown.stop="startResize($event, component)"></div>
        </div>
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
      componentId: 0,
      canvasWidth: 2000, // 可调整的画布宽度
      canvasHeight: 2000, // 可调整的画布高度
      autoScale: false, // 是否自动缩放
      // 查询表单数据
      searchForm: {
        id: '',
        name: '',
        type: '',
        status: ''
      },
      // 控制滚轮行为模式
      wheelMode: 'scroll', // 'scroll' 或 'zoom'
      // 控制是否在画布上使用滚轮缩放
      isCanvasFocused: false
    }
  },
  computed: {
    // 计算带边界的平移偏移量
    boundedPanOffsetX() {
      const containerWidth = this.$refs.canvasContainer ? this.$refs.canvasContainer.clientWidth : 0;
      const scaledCanvasWidth = this.canvasWidth * this.scale;
      
      // 计算允许的最大偏移量（负值）
      let maxXOffset = 0; // 不允许向右移动超过画布右边缘
      let minXOffset = containerWidth - scaledCanvasWidth; // 不允许向左移动超过画布左边缘
      
      // 如果画布比容器小，则不允许移动
      if (scaledCanvasWidth < containerWidth) {
        minXOffset = 0;
      }
      
      // 根据当前缩放和平移计算实际偏移
      const actualOffset = this.panOffsetX / this.scale;
      return Math.min(Math.max(actualOffset, minXOffset), maxXOffset);
    },
    
    boundedPanOffsetY() {
      const containerHeight = this.$refs.canvasContainer ? this.$refs.canvasContainer.clientHeight : 0;
      const scaledCanvasHeight = this.canvasHeight * this.scale;
      
      // 计算允许的最大偏移量（负值）
      let maxYOffset = 0; // 不允许向下移动超过画布底边缘
      let minYOffset = containerHeight - scaledCanvasHeight; // 不允许向上移动超过画布顶边缘
      
      // 如果画布比容器小，则不允许移动
      if (scaledCanvasHeight < containerHeight) {
        minYOffset = 0;
      }
      
      // 根据当前缩放和平移计算实际偏移
      const actualOffset = this.panOffsetY / this.scale;
      return Math.min(Math.max(actualOffset, minYOffset), maxYOffset);
    }
  },
  methods: {
    // 切换滚轮模式
    toggleWheelMode() {
      this.wheelMode = this.wheelMode === 'scroll' ? 'zoom' : 'scroll';
    },
    
    // 查询数据
    searchData() {
      // 清空现有组件
      this.components = [];
      
      // 模拟从数据库查询 - 这里只是简单演示
      // 实际应用中这里应该是 API 调用
      const filteredData = this.components.filter(item => {
        return (
          (!this.searchForm.id || item.id.toString().includes(this.searchForm.id)) &&
          (!this.searchForm.name || item.name.toLowerCase().includes(this.searchForm.name.toLowerCase())) &&
          (!this.searchForm.type || item.type === this.searchForm.type) &&
          (!this.searchForm.status || item.status === this.searchForm.status)
        );
      });
      
      console.log(`查询完成，找到 ${filteredData.length} 条记录`);
    },
    
    // 加载示例数据
    loadSampleData() {
      this.components = [
        { id: 1, name: '组件A', type: 'rect', status: 'active', x: 100, y: 100, width: 100, height: 100 },
        { id: 2, name: '组件B', type: 'circle', status: 'active', x: 300, y: 150, width: 120, height: 120 },
        { id: 3, name: '组件C', type: 'triangle', status: 'inactive', x: 500, y: 200, width: 150, height: 150 },
        { id: 4, name: '组件D', type: 'text', status: 'active', x: 200, y: 400, width: 200, height: 80 },
        { id: 5, name: '组件E', type: 'rect', status: 'inactive', x: 600, y: 300, width: 100, height: 100 }
      ];
      this.componentId = Math.max(...this.components.map(item => item.id));
      console.log('已加载示例数据');
    },
    
    // 清空表单
    clearForm() {
      this.searchForm = {
        id: '',
        name: '',
        type: '',
        status: ''
      };
      this.components = [];
    },
    
    addComponent() {
      this.componentId++
      // 确保新组件在画布范围内
      const x = Math.min(100, this.canvasWidth - 150)
      const y = Math.min(100, this.canvasHeight - 150)
      const newComponent = {
        id: this.componentId,
        type: '组件',
        name: '新组件' + this.componentId,
        x: x,
        y: y,
        width: 100,
        height: 100
      };
      this.components.push(newComponent);
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

      // 确保组件不会拖出画布边界
      const newX = this.componentStartX + deltaX
      const newY = this.componentStartY + deltaY
      
      this.dragComponent.x = Math.max(0, Math.min(newX, this.canvasWidth - this.dragComponent.width))
      this.dragComponent.y = Math.max(0, Math.min(newY, this.canvasHeight - this.dragComponent.height))
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
      
      // 防止组件超出画布边界
      if(this.resizeComponent.x + this.resizeComponent.width > this.canvasWidth) {
        this.resizeComponent.width = this.canvasWidth - this.resizeComponent.x
      }
      if(this.resizeComponent.y + this.resizeComponent.height > this.canvasHeight) {
        this.resizeComponent.height = this.canvasHeight - this.resizeComponent.y
      }
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
    },

    endPan() {
      this.isPanning = false
      this.$refs.canvasWrapper.style.cursor = 'default'
    },

    zoomIn() {
      this.scale = Math.min(3, this.scale + 0.1)
      this.autoScale = false // 手动缩放后禁用自动缩放
    },

    zoomOut() {
      this.scale = Math.max(0.5, this.scale - 0.1)
      this.autoScale = false // 手动缩放后禁用自动缩放
    },

    resetZoom() {
      this.scale = 1
      this.panOffsetX = 0
      this.panOffsetY = 0
      this.autoScale = false // 重置缩放后禁用自动缩放
    },

    fitToScreen() {
      // 计算适应屏幕的缩放比例
      const containerWidth = this.$refs.canvasContainer.clientWidth;
      const containerHeight = this.$refs.canvasContainer.clientHeight;
      
      // 计算适应宽高的缩放比
      const scaleX = containerWidth / this.canvasWidth;
      const scaleY = containerHeight / this.canvasHeight;
      
      // 使用较小的比例来确保整个画布都可见
      this.scale = Math.min(scaleX, scaleY) * 0.95; // 保留一些边距
      
      // 重置平移位置
      this.panOffsetX = 0;
      this.panOffsetY = 0;
      
      this.autoScale = false; // 适应屏幕后禁用自动缩放
    },

    // 居中所有组件，保持相对位置
    centerComponents() {
      if (this.components.length === 0) return;

      // 计算所有组件的边界框
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;

      this.components.forEach(component => {
        minX = Math.min(minX, component.x);
        minY = Math.min(minY, component.y);
        maxX = Math.max(maxX, component.x + component.width);
        maxY = Math.max(maxY, component.y + component.height);
      });

      // 计算组件组的中心点
      const groupCenterX = (minX + maxX) / 2;
      const groupCenterY = (minY + maxY) / 2;

      // 计算画布中心点
      const canvasCenterX = this.canvasWidth / 2;
      const canvasCenterY = this.canvasHeight / 2;

      // 计算需要偏移的距离
      const offsetX = canvasCenterX - groupCenterX;
      const offsetY = canvasCenterY - groupCenterY;

      // 移动所有组件，保持相对位置
      this.components.forEach(component => {
        component.x += offsetX;
        component.y += offsetY;
      });

      // 将画布平移至组件居中位置
      this.panOffsetX = 0;
      this.panOffsetY = 0;
    },

    // 自动计算缩放比例以适应容器
    calculateAutoScale() {
      if (!this.autoScale) return;

      const containerWidth = this.$refs.canvasContainer.clientWidth;
      const containerHeight = this.$refs.canvasContainer.clientHeight;

      // 计算适应宽高的缩放比
      const scaleX = containerWidth / this.canvasWidth;
      const scaleY = containerHeight / this.canvasHeight;

      // 使用较小的比例来确保整个画布都可见
      this.scale = Math.min(scaleX, scaleY) * 0.95; // 保留一些边距
    },

    handleWindowResize() {
      if (this.autoScale) {
        this.calculateAutoScale();
      }
    },
    
    // 处理滚轮事件，根据模式决定是缩放还是滚动
    handleWheel(event) {
      if (this.wheelMode === 'zoom') {
        // 阻止默认的滚动行为，执行缩放
        event.preventDefault();
        
        // 计算缩放增量
        const delta = event.deltaY > 0 ? -0.1 : 0.1;
        this.scale = Math.min(3, Math.max(0.5, this.scale + delta));
        this.autoScale = false; // 滚轮缩放后禁用自动缩放
      }
      // 如果是滚动模式，不阻止默认行为，允许正常滚动
    },
    
    // 鼠标进入画布区域
    onMouseEnter() {
      this.isCanvasFocused = true;
    },
    
    // 鼠标离开画布区域
    onMouseLeave() {
      this.isCanvasFocused = false;
    }
  },

  mounted() {
    document.addEventListener('mousemove', this.handlePan)
    document.addEventListener('mouseup', this.endDrag)
    document.addEventListener('mouseup', this.endResize)
    document.addEventListener('mouseup', this.endPan)
    
    // 监听窗口大小变化事件
    window.addEventListener('resize', this.handleWindowResize);
    
    // 初始时计算一次自动缩放
    this.$nextTick(() => {
      if (this.autoScale) {
        this.calculateAutoScale();
      }
    });
  },

  beforeDestroy() {
    document.removeEventListener('mousemove', this.handlePan)
    document.removeEventListener('mouseup', this.endDrag)
    document.removeEventListener('mouseup', this.endResize)
    document.removeEventListener('mouseup', this.endPan)
    window.removeEventListener('resize', this.handleWindowResize);
  }
}
</script>

<style scoped>
.canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: auto; /* 允许滚动 */
  background-color: #f0f0f0;
}

.query-form {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 20;
  background: white;
  padding: 15px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: 300px;
}

.query-form h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 10px;
}

.form-group label {
  display: inline-block;
  width: 60px;
  font-weight: bold;
}

.form-group input,
.form-group select {
  width: calc(100% - 70px);
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.form-buttons {
  margin-top: 15px;
  text-align: center;
}

.form-buttons button {
  margin-right: 10px;
  padding: 6px 12px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.form-buttons button:last-child {
  margin-right: 0;
}

.form-buttons button:hover {
  background-color: #359c6d;
}

.toolbar {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  background: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.toolbar button.active {
  background-color: #ff6b6b;
}

.canvas-container {
  width: 100%;
  height: calc(100vh - 60px); /* 减去工具栏的高度 */
  overflow: hidden; /* 内部溢出隐藏，由外层处理滚动 */
  margin-top: 150px; /* 为查询表单留出空间 */
}


.canvas {
  position: relative;
  background-color: #ffffe0; /* 浅黄色背景 */
  background-image: radial-gradient(#d0d0d0 1px, transparent 1px); /* 添加网格效果 */
  background-size: 20px 20px; /* 网格大小 */
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
  font-size: 12px;
  text-align: center;
  word-break: break-word;
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