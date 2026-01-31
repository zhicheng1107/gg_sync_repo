<template>
  <div id="app">
    <el-card style="width: 400px; margin: 100px auto;">
      <h3 slot="header">Vue2 + Element-UI 小测试</h3>

      <el-form ref="form" :model="form" label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="请输入姓名"></el-input>
        </el-form-item>

        <el-form-item label="城市">
          <el-select v-model="form.city" placeholder="请选择">
            <el-option label="北京" value="北京"></el-option>
            <el-option label="上海" value="上海"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submit">提交</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <InputTest01 :form="form" />
      <p>当前输入：{{ form }}</p>

      <el-input v-model="text" :title="text" style="width: 200px" />

      <el-tooltip :content="text" placement="top" :disabled="!text">
        <el-input v-model="text" style="width: 200px" />
      </el-tooltip>

      <div class="float-label">
        <el-input v-model="value" />
        <label :class="{ active: value }">标签名</label>
      </div>

      <div>
        <el-input v-model="inputValue" :title="inputValue" placeholder="请输入内容"
          style="width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"></el-input>
      </div>

      <div>
        <el-select v-model="value" placeholder="请选择" :title="ABHHHHHHHHHHHHHHHHHHHHHHHHHH">
          <el-option v-for="item in list" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

    </el-card>
  </div>




</template>


<script>
import InputTest01 from './InputTest01.vue'

export default {
  name: 'App',
  data() {
    return {
      form: {
        name: '',
        city: ''
      },
      text: 'hello',
      inputValue: '这是一个很长的输入内容，当宽度不够时会显示省略号，鼠标悬停时会显示全部内容',
      list: [
        { value: 'A', label: '超长单行字符串AAAAAAAAAAAAAAAAAAAAAAAA' },
        { value: 'B', label: '超长单行字符串BBBBBBBBBBBBBBBBBBBBBBBB' }
      ]
    }
  },
  methods: {
    submit() {
      console.log(this)
      this.$message.success(`提交成功！姓名：${this.form.name}，城市：${this.form.city}`)
    },
    reset() {
      this.$refs.form.resetFields()
    }
  }, components: {
    InputTest01
  },
}
</script>

<style>
#app {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  background-color: #f5f5f5;
}

.float-label {
  position: relative;
  width: 200px;
}

.float-label label {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  transition: all 0.2s ease;
  color: #999;
}

.float-label input:focus+label,
.float-label label.active {
  top: -10px;
  font-size: 12px;
  color: #409EFF;
}
</style>
