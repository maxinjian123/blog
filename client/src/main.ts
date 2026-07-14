import { createApp } from 'vue'
import { createPinia } from 'pinia'
import LayuiVue from '@layui/layui-vue'
import '@layui/layui-vue/lib/index.css'
import App from './App.vue'
import router from './router'
import './styles/global.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(LayuiVue)

app.mount('#app')
