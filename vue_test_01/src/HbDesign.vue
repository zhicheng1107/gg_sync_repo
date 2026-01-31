<template>
    <div class="flow-design">
        <div
            style="padding: 10px; background-color: #f0fff0; border: 2px dashed #ccc; margin: 10px; border-radius: 4px;">
            <button @click="centerAllNodes"
                style="margin-bottom: 10px; padding: 5px 10px; background: #409eff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                居中显示所有节点
            </button>
            <div class="test" ref="test" > 
            </div>
        </div>
        <yu-row>
            <!-- 画布 -->
            <yu-col :span="24">
                <div class="design-right">
                    <div id="cavans" ref="designContainer" class="design-container" @drop="drop($event)"
                        @dragover="allowDrop($event)" @click.self="unActiveNode()">
                        <div class="node" v-for="(item, nodeIndex) in nodeList" :data-name="item.name" :key="item.id"
                            :style="{ left: item.coorX + 'px', top: item.coorY + 'px' }" :class="{
                                active: readyConnectNode.id === item.id,
                                small: item.eName === 'Start' || item.eName === 'End',
                                little: item.eName === 'DiversionRel1' || item.eName === 'DiversionRel2'
                            }" :id="'node-' + item.id" @mouseover.stop="activeNode(item)"
                            @mousedown="startDrag($event, item)" @dblclick="editMoudleName(item)">
                            <div class="node-box little"
                                v-if="item.eName === 'DiversionRel1' || item.eName === 'DiversionRel2'">{{
                                    item.moduleName }}</div>
                            <div class="node-box card jiedian1" :class="{
                                red: item._updateFlag || (equiFlag && item.eName === 'Compliance' && (cancelIndex !== nodeIndex || cancelIndex === '-1')),
                                green: canActive && allowJoinNodeId.includes(item.moduleId)
                            }" v-else>
                                <div class="card-top test jiedian1"
                                    :class="(canActive && allowJoinNodeId.includes(item.moduleId) ? 'green-blink ' : '') + item.classColor">
                                    <div class="icon-box jiedian1"
                                        :class="[item.classIcon, item.eName === 'Start' || item.eName === 'End' ? item.classColor + ' ' + item.classIcon : '']">
                                        <i class="icon jiedian1"
                                            :class="item.eName === 'Start' || item.eName === 'End' ? item.moduleStyle : [item.classColor, item.moduleStyle]"></i>
                                    </div>
                                    <div class="desc" @click="editMoudleName(item)">
                                        <p class="name jiedian1" v-show="!item.changeFlag">{{ item.moduleName }}</p>
                                        <p class="name jiedian1">
                                            <input v-show="item.changeFlag" autofocus :ref="`${item.id}name`"
                                                size="mini" v-model="item.moduleName" @blur="item.changeFlag = false"
                                                maxlength="10" />
                                        </p>
                                        <div :title="'ID：' + item.id">
                                            <p class="id jiedian1">ID：{{ item.id }}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="tools">
                                    <div><i class="el-icon-edit" style="cursor: pointer"
                                            @click.stop.prevent="openDrawer(item, nodeIndex)"></i></div>
                                    <div
                                        v-if="checkCtrl('re-execute') && ['80003002'].includes(straStatus()) && isDetails && !['13', '11'].includes(item.moduleId) && !item._relaFatherId">
                                        <i class="el-icon-refresh" style="cursor: pointer"
                                            @click.stop.prevent="reExecute(item)"></i>
                                    </div>
                                    <div v-if="!isDetails && item.moduleId !== '13' && !item._relaFatherId"><i
                                            class="el-icon-delete" style="cursor: pointer"
                                            @click="deleteNode(item)"></i></div>
                                </div>
                                <div class="card-bottom">
                                    <div class="bottom-box single type" v-if="item.nodeStatus">
                                        <div class="bottom-box-item">
                                            <span class="name">节点状态：</span>
                                            <span class="value">{{ comAsynTypeMap[item.nodeStatus] }}</span>
                                        </div>
                                    </div>
                                    <div class="bottom-box single"
                                        v-if="item.infoArr && item.infoArr[0] && item.infoArr[0].name">
                                        <div class="bottom-box-item" v-for="(element, index) in item.infoArr"
                                            :key="index">
                                            <span class="name">{{ element.name }}{{ element.value ? "：" : "" }}</span>
                                            <span class="value">{{ element.value }}</span>
                                        </div>
                                    </div>
                                    <div v-else-if="item.infoArr && item.infoArr.length > 1"
                                        style="padding-bottom: 12px">
                                        <div class="bottom-box" v-for="(ele, index) in item.infoArr" :key="index"
                                            :class="{ single: item.infoArr.length <= 1 }">
                                            <div class="bottom-box-item" v-for="element in ele" :key="element.name">
                                                <div class="name">{{ element.name }}：</div>
                                                <div class="value">{{ element.value }}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="tips" v-if="statusText != '执行中'">{{ statusText }}</div>
                                <!-- <div class="tips" v-if="statusText != '执行中'">{{ statusText === "执行中" ? "微调" : statusText }}</div> -->
                            </div>
                        </div>
                        <!-- 连接线操作菜单 -->
                        <div class="connection-line-menu" v-show="isMenuShow" :style="{
                            left: connectionMenuStyle.offsetX + 'px',
                            top: connectionMenuStyle.offsetY + 'px'
                        }">
                            <i class="el-icon-close close" @click="isMenuShow = false"></i>
                            <ul>
                                <!-- <li @click="editeLineLabel">{{ editType === 'ADD' ? '添加标签' : '修改标签' }}</li> -->
                                <li @click="deleteLine">删除连线</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </yu-col>
        </yu-row>
        <div class="flow-design-mask" v-show="progressFlag !== '0' && progressFlag !== '4'" @click="clickFlowFn"></div>
    </div>
</template>

<script>
export default {
    name: 'HbDesign',
    data() {
        return {
            nodeList: [
                {
                    id: '1',
                    name: '开始节点',
                    eName: 'Start',
                    moduleName: '开始',
                    moduleId: '13',
                    coorX: 100,
                    coorY: 100,
                    classColor: 'green',
                    classIcon: 'start-icon',
                    moduleStyle: 'start-style',
                    changeFlag: false,
                    _updateFlag: false,
                    infoArr: [],
                    nodeStatus: '1'
                },
                {
                    id: '2',
                    name: '处理节点',
                    eName: 'Process',
                    moduleName: '处理',
                    moduleId: '11',
                    coorX: 300,
                    coorY: 100,
                    classColor: 'blue',
                    classIcon: 'process-icon',
                    moduleStyle: 'process-style',
                    changeFlag: false,
                    _updateFlag: false,
                    infoArr: [
                        { name: '处理时间', value: '5分钟' }
                    ],
                    nodeStatus: '2'
                },
                {
                    id: '3',
                    name: '结束节点',
                    eName: 'End',
                    moduleName: '结束',
                    moduleId: '13',
                    coorX: 500,
                    coorY: 100,
                    classColor: 'red',
                    classIcon: 'end-icon',
                    moduleStyle: 'end-style',
                    changeFlag: false,
                    _updateFlag: false,
                    infoArr: [],
                    nodeStatus: '3'
                }
            ],
            readyConnectNode: {},
            equiFlag: false,
            cancelIndex: '-1',
            canActive: false,
            allowJoinNodeId: [],
            isDetails: false,
            comAsynTypeMap: {
                '1': '已完成',
                '2': '执行中',
                '3': '未开始'
            },
            statusText: '未开始',
            isMenuShow: false,
            connectionMenuStyle: {
                offsetX: 0,
                offsetY: 0
            },
            progressFlag: '0',
            editType: 'ADD',
            // 拖拽相关数据
            isDragging: false,
            dragNode: null,
            dragOffset: { x: 0, y: 0 }
        }
    },
    mounted() {
        // 添加全局鼠标事件监听器
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    },
    beforeDestroy() {
        // 移除全局事件监听器
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    },
    methods: {
        drop(event) {
            // 处理拖拽放置事件
            event.preventDefault();
            console.log('节点放置');
        },

        allowDrop(event) {
            // 允许拖拽放置
            event.preventDefault();
        },

        unActiveNode() {
            // 取消激活节点
            this.readyConnectNode = {};
            console.log('取消激活节点');
        },

        activeNode(item) {
            // 激活节点
            this.readyConnectNode = item;
            console.log('激活节点:', item);
        },

        editMoudleName(item) {
            // 编辑模块名称
            item.changeFlag = true;
            this.$nextTick(() => {
                const inputRef = this.$refs[`${item.id}name`];
                if (inputRef && inputRef[0] && inputRef[0].focus) {
                    inputRef[0].focus();
                }
            });
        },

        openDrawer(item, nodeIndex) {
            // 打开抽屉编辑节点
            console.log('打开节点编辑抽屉:', item, nodeIndex);
        },

        reExecute(item) {
            // 重新执行节点
            console.log('重新执行节点:', item);
        },

        deleteNode(item) {
            // 删除节点
            const index = this.nodeList.findIndex(node => node.id === item.id);
            if (index !== -1) {
                this.nodeList.splice(index, 1);
            }
            console.log('删除节点:', item);
        },

        checkCtrl() {
            // 检查权限
            return true;
        },

        straStatus() {
            // 获取策略状态
            return '80003002';
        },

        clickFlowFn() {
            // 点击流程遮罩
            console.log('点击流程遮罩');
        },

        deleteLine() {
            // 删除连线
            this.isMenuShow = false;
            console.log('删除连线');
        },

        // 拖拽相关方法
        startDrag(event, node) {
            // 防止与输入框等元素的事件冲突
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'I') {
                return;
            }

            event.preventDefault();
            this.isDragging = true;
            this.dragNode = node;

            // 计算鼠标相对于节点的偏移量
            const rect = event.currentTarget.getBoundingClientRect();
            this.dragOffset.x = event.clientX - rect.left;
            this.dragOffset.y = event.clientY - rect.top;

            // 设置节点为激活状态
            this.activeNode(node);
        },

        onMouseMove(event) {
            if (!this.isDragging || !this.dragNode) return;

            // 计算节点新位置
            const containerRect = this.$refs.designContainer.getBoundingClientRect();
            const newX = event.clientX - containerRect.left - this.dragOffset.x;
            const newY = event.clientY - containerRect.top - this.dragOffset.y;

            // 更新节点位置
            this.dragNode.coorX = newX;
            this.dragNode.coorY = newY;
        },

        onMouseUp() {
            // 停止拖拽
            this.isDragging = false;
            this.dragNode = null;
            this.dragOffset = { x: 0, y: 0 };
        },

        // 居中显示所有节点，保持相对位置
        centerAllNodes() {
            if (this.nodeList.length === 0) return;

            // 计算所有节点的边界框
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;

            // 计算所有节点的边界
            this.nodeList.forEach(node => {
                minX = Math.min(minX, node.coorX);
                minY = Math.min(minY, node.coorY);
                maxX = Math.max(maxX, node.coorX + 150); // 假设节点宽度为150px
                maxY = Math.max(maxY, node.coorY + 100); // 假设节点高度为100px
            });

            // 计算边界框的中心点
            const bboxCenterX = (minX + maxX) / 2;
            const bboxCenterY = (minY + maxY) / 2;

            // 获取容器尺寸
            const container = this.$refs.designContainer;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            // 计算容器中心点
            const containerCenterX = containerWidth / 2;
            const containerCenterY = containerHeight / 2;

            // 计算偏移量
            const offsetX = containerCenterX - bboxCenterX;
            const offsetY = containerCenterY - bboxCenterY;

            // 移动所有节点以保持相对位置
            this.nodeList.forEach(node => {
                node.coorX += offsetX;
                node.coorY += offsetY;
            });
        }
    }
}
</script>

<style scoped>
/* #canvans {
  background-color: #ffffe0;
  border: 1px solid #ccc;   
}  */

.flow-design {
    position: relative;
}

.design-right {
    position: relative;
    height: calc(100vh - 120px);
    overflow: auto;
    background-color: #ffffe0;
    border: 2px dashed #ccc;
    border-radius: 4px;
}

.design-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: #f5f5f5;
    background-image: linear-gradient(#eee 1px, transparent 1px),
        linear-gradient(90deg, #eee 1px, transparent 1px);
    background-size: 20px 20px;
}

.node {
    position: absolute;
    min-width: 150px;
    cursor: move;
    user-select: none;
}

.node-box {
    background: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 10px;
}

.card {
    border: 1px solid #dcdfe6;
}

.card-top {
    display: flex;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.icon-box {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 10px;
    border-radius: 4px;
}

.desc {
    flex: 1;
}

.name {
    font-size: 14px;
    font-weight: 500;
    margin: 0;
}

.id {
    font-size: 12px;
    color: #999;
    margin: 2px 0 0;
}

.tools {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    gap: 8px;
}

.tools i {
    color: #999;
    font-size: 14px;
}

.tools i:hover {
    color: #409eff;
}

.card-bottom {
    padding-top: 10px;
}

.bottom-box {
    display: flex;
    flex-wrap: wrap;
}

.bottom-box-item {
    display: flex;
    margin-right: 15px;
}

.bottom-box-item .name {
    font-size: 12px;
    color: #666;
    margin: 0;
}

.bottom-box-item .value {
    font-size: 12px;
    color: #333;
    margin: 0 0 0 4px;
}

.tips {
    position: absolute;
    bottom: -20px;
    left: 0;
    font-size: 12px;
    color: #999;
}

.connection-line-menu {
    position: absolute;
    background: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    padding: 5px 0;
}

.connection-line-menu .close {
    position: absolute;
    top: 5px;
    right: 5px;
    cursor: pointer;
    color: #999;
}

.connection-line-menu ul {
    list-style: none;
    margin: 0;
    padding: 0;
    min-width: 100px;
}

.connection-line-menu ul li {
    padding: 5px 15px;
    cursor: pointer;
    font-size: 12px;
}

.connection-line-menu ul li:hover {
    background: #f5f5f5;
}

.flow-design-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    z-index: 999;
    cursor: not-allowed;
}

.red {
    border-color: #f56c6c;
}

.green {
    border-color: #67c23a;
}

.active {
    outline: 2px solid #409eff;
    z-index: 100;
}

.small {
    min-width: 80px;
}

.little {
    min-width: 100px;
}

/* 拖拽时的样式 */
.node.dragging {
    z-index: 999;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.test {
    height: 100px; /* 可以根据需要调整高度值 */
    background-color: #f0f0f0; /* 可选：添加背景色以便更清楚地看到效果 */
    border: 1px solid #ddd; /* 可选：添加边框 */
}
</style>