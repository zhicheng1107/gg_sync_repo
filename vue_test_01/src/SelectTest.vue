<template>
    <!-- 添加 popper-class 属性来应用自定义样式 -->
    <el-tooltip 
        v-model="visible" 
        effect="dark" 
        placement="top" 
        :content="selectedLabel" 
        popper-class="gray-tooltip" 
        manual>
        <el-select 
            ref="select" 
            v-model="value" 
            placeholder="请选择" 
            @mouseenter.native="onEnter"
            @mouseleave.native="onLeave">
            <el-option 
                v-for="item in options" 
                :key="item.value" 
                :label="item.label" 
                :value="item.value" />
        </el-select>
    </el-tooltip>
</template>

<script>
export default {
    data() {
        return {
            value: '',
            visible: false,
            options: [
                { value: 1, label: '黄金糕' },
                { value: 2, label: '双皮奶' },
                { value: 3, label: '蚵仔煎' }
            ]
        }
    },
    computed: {
        /**
         * 计算选中项的标签文本
         * @returns {string} 选中项的标签，未选中时返回空字符串
         */
        selectedLabel() {
            const hit = this.options.find(o => o.value === this.value)
            return hit ? hit.label : ''
        }
    },
    methods: {
        /**
         * 鼠标进入选择框时显示提示
         * 仅当有选中值时才显示提示
         */
        onEnter() {
            if (this.selectedLabel) this.visible = true
        },
        /**
         * 鼠标离开选择框时隐藏提示
         */
        onLeave() {
            this.visible = false
        }
    }
}
</script>

<style>
/* 
 * 优化后的灰色 tooltip 样式
 * 采用现代化设计，具有更好的视觉层次和美观性
 */
.gray-tooltip {
    /* 使用优雅的浅灰色背景 */
    background-color: #f8f9fa !important;
    /* 深灰色文字，确保良好对比度 */
    color: #2d3748 !important;
    /* 添加圆角，使外观更现代 */
    border-radius: 8px !important;
    /* 细边框增强层次感 */
    border: 1px solid #e2e8f0 !important;
    /* 增强阴影效果，提升立体感 */
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
    /* 增加内边距，提高可读性 */
    padding: 8px 12px !important;
    /* 设置字体大小和行高 */
    font-size: 14px !important;
    line-height: 1.5 !important;
}

/* 
 * 优化的 tooltip 箭头样式
 * 采用柔和的阴影效果，与整体设计保持一致
 */
.gray-tooltip .popper__arrow {
    /* 隐藏默认箭头边框 */
    border: none !important;
}

.gray-tooltip .popper__arrow::after {
    /* 箭头使用与背景相同的颜色 */
    border-top-color: #f8f9fa !important;
    /* 添加阴影使箭头更自然 */
    box-shadow: -1px -1px 1px rgba(0, 0, 0, 0.05) !important;
}

/* 
 * 针对不同方向的箭头进行优化
 */
.gray-tooltip[x-placement^="top"] .popper__arrow::after {
    border-top-color: #f8f9fa !important;
    border-bottom-width: 0 !important;
}

.gray-tooltip[x-placement^="bottom"] .popper__arrow::after {
    border-bottom-color: #f8f9fa !important;
    border-top-width: 0 !important;
}

.gray-tooltip[x-placement^="left"] .popper__arrow::after {
    border-left-color: #f8f9fa !important;
    border-right-width: 0 !important;
}

.gray-tooltip[x-placement^="right"] .popper__arrow::after {
    border-right-color: #f8f9fa !important;
    border-left-width: 0 !important;
}

/* 
 * 响应式字体大小优化
 */
@media (max-width: 768px) {
    .gray-tooltip {
        font-size: 13px !important;
        padding: 6px 10px !important;
    }
}
</style>