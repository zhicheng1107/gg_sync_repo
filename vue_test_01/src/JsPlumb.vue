<template>
  <div id="app">
    <h3>Vue2 + jsPlumb 拖拽式连线</h3>
    <p style="color: #666; font-size: 14px">
      操作：拖拽节点边缘的小圆点（端点）到另一个节点，即可建立连线
      <button @click="addNode" style="margin-left: 10px">新增节点</button>
      <button @click="clearAllConnections" style="margin-left: 10px">清除所有连线</button>
      <button @click="exportData" style="margin-left: 10px">导出数据</button>
    </p>

    <!-- 画布 -->
    <div id="canvas"
    :style="{ width: '100%', height: '500px', border: '1px solid #ccc', position: 'relative' }">
      <div
        v-for="node in nodes"
        :key="node.id"
        :id="node.id"
        class="node"
        :style="{ left: node.x + 'px', top: node.y + 'px' }"
      >
        <div class="node-header">{{ node.label }}</div>
        <div class="node-content">{{ node.content || '双击编辑内容' }}</div>
        <!-- 四个方向的连接点 -->
        <div class="endpoint endpoint-top" data-anchor="Top"></div>
        <div class="endpoint endpoint-right" data-anchor="Right"></div>
        <div class="endpoint endpoint-bottom" data-anchor="Bottom"></div>
        <div class="endpoint endpoint-left" data-anchor="Left"></div>
      </div>
    </div>

    <!-- 连线列表 -->
    <div style="margin-top: 20px; font-size: 14px">
      <strong>当前连线（{{ connections.length }}条）：</strong>
      <div v-if="connections.length === 0" style="color: #999">暂无连线，拖拽节点边缘的圆点进行连接</div>
      <div v-for="(conn, idx) in connections" :key="idx" class="connection-item">
        <span class="connection-text">{{ conn.source }} ({{ conn.sourceAnchor }}) → {{ conn.target }} ({{ conn.targetAnchor }})</span>
        <button @click="deleteConnection(conn)" class="delete-btn">删除</button>
      </div>
    </div>

    <!-- 导出的JSON数据 -->
    <div v-if="exportedData" class="export-panel">
      <strong>导出的数据：</strong>
      <pre>{{ exportedData }}</pre>
    </div>
  </div>
</template>

<script>
import { jsPlumb } from 'jsplumb'

export default {
  name: 'DragConnect',
  data () {
    return {
      nodes: [
        { id: 'node1', label: '开始', content: '流程起点', x: 50, y: 150 },
        { id: 'node2', label: '处理', content: '数据处理', x: 250, y: 80 },
        { id: 'node3', label: '判断', content: '条件判断', x: 250, y: 220 },
        { id: 'node4', label: '结束', content: '流程结束', x: 450, y: 150 }
      ],
      connections: [],
      
      jsPlumbInstance: null,
      exportedData: null,
      nodeCounter: 4
    }
  },
  mounted () {
    this.$nextTick(() => {
      this.initJsPlumb()
    })
  },
  beforeDestroy () {
    if (this.jsPlumbInstance) {
      this.jsPlumbInstance.reset()
    }
  },
  methods: {
    /* ========== 初始化 jsPlumb ========== */
    initJsPlumb () {
      this.jsPlumbInstance = jsPlumb.getInstance()
      
      this.jsPlumbInstance.importDefaults({
        // 使用贝塞尔曲线，更美观
        Connector: ['Bezier', { 
          curviness: 80  // 曲率
        }],
        
        // 端点样式
        Endpoint: ['Dot', { 
          radius: 6,
          cssClass: 'jsplumb-endpoint'
        }],
        
        // 端点悬停样式
        EndpointHoverStyle: { 
          fill: '#e91e63',
          radius: 8
        },
        
        // 连线样式
        PaintStyle: { 
          stroke: '#456', 
          strokeWidth: 2 
        },
        
        // 悬停样式
        HoverPaintStyle: {
          stroke: '#e91e63',
          strokeWidth: 3
        },
        
        // 端点默认样式
        EndpointStyle: { 
          fill: '#456',
          outlineStroke: '#fff',
          outlineWidth: 2
        },
        
        // 连线上的装饰
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
        
        // 拖拽创建连接时的样式
        DragOptions: { 
          cursor: 'crosshair',
          zIndex: 2000
        },
        
        // 容器
        Container: 'canvas'
      })

      // 绑定事件
      this.bindEvents()
      
      // 初始化所有节点
      this.initNodes()
    },

    /* ========== 初始化节点（可拖拽 + 可连接） ========== */
    initNodes () {
      this.nodes.forEach(node => {
        this.initNode(node.id)
      })
    },

    initNode (nodeId) {
      // 1. 让节点可拖动
      this.jsPlumbInstance.draggable(nodeId, {
        containment: 'parent',
        grid: [10, 10], // 网格对齐
        stop: (params) => {
          // 更新节点位置数据
          const node = this.nodes.find(n => n.id === nodeId)
          if (node) {
            node.x = params.pos[0]
            node.y = params.pos[1]
          }
        }
      })

      // 2. 添加源端点（可拖出连线）- 四个方向
      const anchors = ['Top', 'Right', 'Bottom', 'Left']
      anchors.forEach(anchor => {
        this.jsPlumbInstance.addEndpoint(nodeId, {
          anchor: anchor,
          isSource: true,  // 可作为源
          isTarget: true,  // 可作为目标
          maxConnections: -1, // 不限制连接数
          uuid: `${nodeId}-${anchor}-source`
        }, {
          // 覆盖默认配置
          paintStyle: { fill: '#4a90e2' }
        })
      })
    },

    /* ========== 绑定 jsPlumb 事件 ========== */
    bindEvents () {
      // 连接建立时
      this.jsPlumbInstance.bind('connection', (info) => {
        console.log('连接建立:', info.sourceId, '→', info.targetId)
        this.syncConnections()
      })

      // 连接断开时
      this.jsPlumbInstance.bind('connectionDetached', (info) => {
        console.log('连接断开:', info.sourceId, '→', info.targetId)
        this.syncConnections()
      })

      // 点击连线时（可选：删除连线）
      this.jsPlumbInstance.bind('click', (conn, originalEvent) => {
        if (originalEvent) {
          // 点击连线删除
          this.jsPlumbInstance.deleteConnection(conn)
        }
      })

      // 连接移动时（先断开再连接）
      this.jsPlumbInstance.bind('connectionMoved', () => {
        console.log('连接移动')
        this.syncConnections()
      })

      // 双击连线编辑标签
      this.jsPlumbInstance.bind('dblclick', (conn) => {
        const label = prompt('输入连线标签:', conn.getLabel() || '')
        if (label !== null) {
          conn.setLabel(label)
        }
      })
    },

    /* ========== 同步连接到本地数据 ========== */
    syncConnections () {
      const conns = this.jsPlumbInstance.getConnections()
      this.connections = conns.map(c => ({
        id: c.id,
        source: c.sourceId,
        target: c.targetId,
        sourceAnchor: c.endpoints[0].anchor.type,
        targetAnchor: c.endpoints[1].anchor.type,
        label: c.getLabel() || ''
      }))
    },

    /* ========== 删除指定连线 ========== */
    deleteConnection (connData) {
      const conns = this.jsPlumbInstance.getConnections({
        source: connData.source,
        target: connData.target
      })
      conns.forEach(c => this.jsPlumbInstance.deleteConnection(c))
      this.syncConnections()
    },

    /* ========== 清除所有连线 ========== */
    clearAllConnections () {
      this.jsPlumbInstance.deleteEveryConnection()
      this.connections = []
    },

    /* ========== 新增节点 ========== */
    addNode () {
      this.nodeCounter++
      const id = `node${Date.now()}`
      const label = `节点${this.nodeCounter}`
      
      // 随机位置（在画布范围内）
      const x = 50 + Math.random() * 400
      const y = 50 + Math.random() * 200
      
      const newNode = {
        id,
        label,
        content: '新节点',
        x,
        y
      }
      
      this.nodes.push(newNode)
      
      // 等待 DOM 更新后初始化
      this.$nextTick(() => {
        this.initNode(id)
      })
    },

    /* ========== 导出数据 ========== */
    exportData () {
      const data = {
        nodes: this.nodes.map(n => ({
          id: n.id,
          label: n.label,
          content: n.content,
          x: n.x,
          y: n.y
        })),
        connections: this.connections
      }
      this.exportedData = JSON.stringify(data, null, 2)
      console.log('导出数据:', data)
    }
  }
}
</script>

<style>
#app {
  padding: 20px;
  font-family: 'Microsoft YaHei', sans-serif;
}

#canvas {
  position: relative;
  width: 700px;
  height: 400px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
  margin-top: 15px;
  overflow: hidden;
}

/* 节点样式 */
.node {
  position: absolute;
  width: 120px;
  min-height: 80px;
  background: #fff;
  border: 2px solid #456;
  border-radius: 8px;
  cursor: move;
  user-select: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: box-shadow 0.2s, transform 0.1s;
  z-index: 10;
}

.node:hover {
  box-shadow: 0 4px 16px rgba(74, 144, 226, 0.3);
  border-color: #4a90e2;
}

.node-header {
  background: #4a90e2;
  color: #fff;
  padding: 6px 10px;
  border-radius: 6px 6px 0 0;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
}

.node-content {
  padding: 10px;
  font-size: 12px;
  color: #666;
  text-align: center;
  min-height: 30px;
}

/* 四个方向的连接点（视觉提示） */
.endpoint {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #4a90e2;
  border: 2px solid #fff;
  border-radius: 50%;
  z-index: 20;
  opacity: 0; /* 默认隐藏，hover显示 */
  transition: opacity 0.2s;
}

.node:hover .endpoint {
  opacity: 1;
}

.endpoint-top {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.endpoint-right {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
}

.endpoint-bottom {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.endpoint-left {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
}

/* jsPlumb 生成的端点样式 */
.jsplumb-endpoint {
  z-index: 30 !important;
}

.jsplumb-endpoint:hover {
  cursor: crosshair;
}

/* 连线样式 */
.jtk-connector {
  z-index: 5;
}

.jtk-connector:hover {
  cursor: pointer;
}

/* 连线标签 */
.connection-label {
  background: #fff;
  padding: 2px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  color: #333;
}

/* 按钮样式 */
button {
  padding: 6px 14px;
  border: 1px solid #4a90e2;
  background: #fff;
  color: #4a90e2;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

button:hover {
  background: #4a90e2;
  color: #fff;
}

/* 连线列表 */
.connection-item {
  display: flex;
  align-items: center;
  margin: 5px 0;
  padding: 5px;
  background: #f5f5f5;
  border-radius: 4px;
}

.connection-text {
  flex: 1;
  font-family: monospace;
  font-size: 13px;
}

.delete-btn {
  padding: 2px 8px;
  font-size: 12px;
  border-color: #f44336;
  color: #f44336;
}

.delete-btn:hover {
  background: #f44336;
  color: #fff;
}

/* 导出面板 */
.export-panel {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.export-panel pre {
  background: #fff;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
}
</style>