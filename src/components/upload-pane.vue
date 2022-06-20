<template>
  <div class="upload-pane">
    <label class="upload-button" title="open">
        <input type="file" @change="onFileChange($event)" accept=".csv"/>
        📂
    </label>
    <span class="upload-filename" v-if="filename">{{ filename }}</span>
    <span class="upload-entrycount">total entries: {{ entries }}</span>
  </div>
</template>

<script>
export default {
  name: 'upload-pane',
  props: ['entries'],
  data () {
    return {
      filename: ''
    }
  },
  methods: {
    onFileChange (e) {
      var file = e.target.files[0]
      var reader = new FileReader()

      this.filename = file.name
      document.title = 'csv to midi - ' + this.filename

      // reader.onloadstart = function(e) { }
      // reader.onprogress = function(e) { }

      reader.onload = this.onFileLoaded

      reader.readAsText(file)
    },
    onFileLoaded (e) {
      this.$parent.parseFile({ content: e.target.result, filename: this.filename })
    }
  }
}
</script>
