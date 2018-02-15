import Vue from 'vue'
import App from './app.vue'

var app = new Vue({
  el: '#app',
  data: {
    message: 'Hello Vue!'
  },
  render (h) {
    return h(App)
  }
})
