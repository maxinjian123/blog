import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'
import App from './App.vue'
import router from './router'
import './styles/tailwind.css'
import './utils/markdownItAttrs'

import Message from 'vue-m-message';
import 'vue-m-message/dist/style.css';


const app = createApp(App)
const head = createHead()

app.use(head)
app.use(Message)
app.use(createPinia())
app.use(router)

app.mount('#app')
