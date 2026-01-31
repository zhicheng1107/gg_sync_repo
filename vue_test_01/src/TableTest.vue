<template>
  <div>
    <!-- 刷新按钮 -->
    <el-button 
      type="primary" 
      icon="el-icon-refresh" 
      @click="refreshTable"
      :loading="loading"
    >
      刷新数据
    </el-button>

    <!-- 数据表格 -->
    <el-table :data="tableData" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80"></el-table-column>
      <el-table-column prop="name" label="姓名"></el-table-column>
      <el-table-column prop="email" label="邮箱"></el-table-column>
      <el-table-column prop="status" label="状态">
        <template slot-scope="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tableData: [],      // 表格数据
      loading: false      // 加载状态
    };
  },
  
  mounted() {
    // 页面初始化时加载数据
    this.fetchData();
  },
  
  methods: {
    // 刷新按钮点击事件
    refreshTable() {
      this.fetchData();
    },
    
    // 获取数据的统一方法
    async fetchData() {
      this.loading = true;
      try {
        // 模拟 API 请求（替换成你的真实接口）
        const res = await this.mockApiRequest();
        this.tableData = res.data || [];
        
        // 成功提示（可选）
        this.$message.success('数据刷新成功');
      } catch (error) {
        console.error('数据加载失败:', error);
        this.$message.error('数据加载失败，请重试');
      } finally {
        this.loading = false;
      }
    },
    
    // 模拟异步接口请求
    mockApiRequest() {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: [
              { id: 1, name: '张三', email: 'zhangsan@test.com', status: 1 },
              { id: 2, name: '李四', email: 'lisi@test.com', status: 0 },
              { id: 3, name: '王五', email: 'wangwu@test.com', status: 1 }
            ]
          });
        }, 1000);
      });
    }
  }
};
</script>