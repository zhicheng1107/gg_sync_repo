<template>
  <div>
    <el-row>
      <el-col :span="12">
        <div class="grid-content bg-purple">
          <div>这是第一个col中的div</div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="grid-content bg-purple-light">
         <!-- //实现一个矩形输入框，并且可以拖拽 拖拽结束之后，保存位置 -->
         <div class="grid-content bg-purple-light">
            <!-- //实现拖拽功能 -->
            <div class="grid-content bg-purple-light">
              <el-input v-model="value" placeholder="请输入内容"></el-input>
            </div>
          <el-input v-model="value" placeholder="请输入内容"></el-input>
        </div> 
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'DesignTest'
}
</script>

<style scoped>
.grid-content {
  min-height: 36px;
  padding: 10px;
  border-radius: 4px;
}
.bg-purple {
  background: #d3dce6;
}
.bg-purple-light {
  background: #e5e9f2;
}
</style>