<script>
import UploadPane from './components/upload-pane.vue'
import WorkPane from './components/work-pane.vue'
import Modal from './components/modal.vue'

import { parseString } from '@fast-csv/parse'
import moment from 'moment'

// this is a function with spotty browser support used by fast-csv
// it's imported here so that it comes in scope globally
import setImmediate from 'setimmediate'

export default {
  name: 'app',
  components: {
    [UploadPane.name]: UploadPane,
    [WorkPane.name]: WorkPane,
    [Modal.name]: Modal
  },
  data () {
    return {
      csv: {},
      stats: [],
      filename: '',
      showHelp: false
    }
  },
  methods: {
    parseFile (fileUpload) {
      this.csv = {}
      this.stats = {}

      this.filename = fileUpload.filename

      parseString(fileUpload.content, { headers: true })
        .on('data', this.parseRow)
        .on('end', this.parseCompleteCallback)
    },
    parseRow (row) {
      var val

      for (let key in row) {
        if (!isNaN(row[key]) && row[key] != '') { // is the current element a number?
          val = parseFloat(row[key])
          this.stats[key] = this.updateStats(this.stats[key], val)
        }
        else if (moment(row[key]).isValid()) {    // is the current element a UTC time?
          val = row[key]
          this.stats[key] = this.updateStats(this.stats[key], new Date(row[key]).getTime())
        }
        else {
          val = ''
        }

        if (this.csv[key] == undefined) {
          this.csv[key] = []
        }

        this.csv[key].push(val)
      }
    },
    updateStats (stat, val) {
      if (stat == undefined) {
        stat = { min: val, max: val, sum: 0 }
      }
      else if (val < stat['min']) {
        stat['min'] = val
      }
      else if (val > stat['max']) {
        stat['max'] = val
      }

      stat['sum'] += val
      return stat
    },
    parseCompleteCallback () {
      for (let key in this.csv) {
        if (this.stats[key] == undefined) {   // remove non-numeric columns from dataset
          delete this.csv[key]
          console.log('removing non-numeric ' + key + ' vector from dataset')
        }
      }

      for (let key in this.stats) {
        var stdd = this.stddev(this.csv[key], this.stats[key]['sum'])
        this.stats[key]['mean'] = stdd['mean']
        this.stats[key]['standardDeviation'] = stdd['deviation']
      }

      // ensure underlying Vue components see the update
      // https://stackoverflow.com/questions/45551588/vue-component-props-not-watching-object-changes-properly
      this.csv = Object.assign({}, this.csv)
      this.stats = Object.assign({}, this.stats)
    },
    // https://gist.github.com/hanksudo/6028201
    stddev: function(ary, sum) {
      var n = ary.length

      var mean = sum / n

      var stdev
      var variance = 0.0
      var v1 = 0.0
      var v2 = 0.0

      if (n != 1) {
          for (var i = 0; i<n; i++) {
              v1 = v1 + (ary[i] - mean) * (ary[i] - mean)
              v2 = v2 + (ary[i] - mean)
          }

          v2 = v2 * v2 / n
          variance = (v1 - v2) / (n-1)
          if (variance < 0) {
            variance = 0
          }
          stdev = Math.sqrt(variance)
      }

      return {
          mean: Math.round(mean*100)/100,
          variance: variance,
          deviation: Math.round(stdev*100)/100
      }
    }
  },
  computed: {
    entries: function () {
      if (Object.keys(this.csv).length > 0) {
        return this.csv[Object.keys(this.csv)[0]].length  // length of first column
      }
      return 0
    }
  }
}
</script>

<template>
  <div class="wrapper">
    <div class="header">
      <a class="brand" href="/" title="to convert csv datasets to midi. in case you feel like doing that.">
        <h1>csv to midi</h1>
      </a>
      <div class="header-buttons">
        <button class="help-button" title="help" @click="showHelp = true">
          ?
        </button>
      </div>
    </div>
    <upload-pane :entries="entries"></upload-pane>
    <work-pane :csv="csv" :stats="stats" :filename="filename"></work-pane>
    <div class="footer">
    </div>
    <modal v-if="showHelp" @close="showHelp = false">
    </modal>
  </div>
</template>