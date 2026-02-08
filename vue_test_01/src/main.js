import Vue from 'vue'
// import App from './App.vue'
// import SelectTest from './SelectTest.vue'
// import InputTest01 from './InputTest01.vue'
// import DesignTest from './Design2.vue'
// import HbDesign from './HbDesign.vue'
// import CanvasTest from './CanvasTest.vue'
// import JsPlumb from './JsPlumb.vue'
import CanvasT1 from './CanvasT1.vue'
// import TableTest from './TableTest.vue'

import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
Vue.use(ElementUI)

Vue.config.productionTip = false

new Vue({
  // render: h => h(JsPlumb)
  render: h => h(CanvasT1)
}).$mount('#app')
