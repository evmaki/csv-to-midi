<template>
  <div class="wrapper">
    <div class="header">
      <a class="brand" href="/" title="to convert csv datasets to midi. in case you feel like doing that.">
        <h1>csv to midi</h1>
      </a>
      <a href="https://github.com/evmaki/csv-to-midi">
        <span class="icon">
          <svg width="24px" height="24px" viewBox="0 0 24 24">
            <path d="M19,0H5C2.239,0,0,2.239,0,5v14c0,2.761,2.239,5,5,5h3.76c-0.001-0.354-0.012-1.117-0.017-2.129
              C5.107,22.66,4.341,20.12,4.341,20.12c-0.595-1.509-1.452-1.912-1.452-1.912c-1.187-0.811,0.089-0.795,0.089-0.795
              c1.312,0.092,2.002,1.347,2.002,1.347c1.166,1.998,3.059,1.421,3.803,1.087c0.12-0.845,0.457-1.42,0.831-1.748
              c-2.902-0.33-5.952-1.45-5.952-6.459c0-1.426,0.509-2.594,1.346-3.506C4.873,7.801,4.423,6.472,5.137,4.674
              c0,0,1.098-0.352,3.594,1.341C9.772,5.723,10.89,5.578,12,5.574c1.11,0.004,2.228,0.149,3.272,0.439
              c2.497-1.69,3.592-1.34,3.592-1.34c0.712,1.799,0.264,3.127,0.129,3.459c0.837,0.913,1.345,2.079,1.345,3.506
              c0,5.021-3.056,6.126-5.967,6.449c0.47,0.404,0.887,1.201,0.887,2.419c0,1.648-0.015,2.986-0.017,3.494H19c2.762,0,5-2.239,5-5V5
              C24,2.239,21.762,0,19,0z"/>
          </svg>
        </span>
      </a>
    </div>
    <upload-pane :entries="csv.length"></upload-pane>
    <work-pane :csv="csv" :bounds="bounds" :filename="filename"></work-pane>
    <div class="footer">
    </div>
  </div>
</template>

<script>
import UploadPane from './upload-pane.vue'
import WorkPane from './work-pane.vue'

var csv = require('fast-csv')
var moment = require('moment')

export default {
  name: 'app',
  components: {
    [UploadPane.name]: UploadPane,
    [WorkPane.name]: WorkPane
  },
  data () {
    return {
      csv: [],
      bounds: [],
      filename: ''
    }
  },
  created () {
    this.$on('fileLoaded', function (e) {
      this.parseFile(e.result, this.parseCompleteCallback)
      this.filename = e.filename
    })
  },
  methods: {
    parseFile (csvString, callback) {
      var data = []
      var bounds = []

      csv
        .fromString(csvString, {headers: true})
        .on('data', function (row) {
          var parsedRow = {}

          // update (min, max) bounds for each value in the current row
          // this helps us discretize data later on when choosing appropriate midi values
          var val
          for (let key in row) {  // iterate over every element in the current row
            if (!isNaN(row[key]) && row[key] != '') { // is the current element a number?
              val = parseFloat(row[key])
              parsedRow[key] = val

              if (bounds[key] == undefined) {
                bounds[key] = { min: val, max: val }
              }
              else if (val < bounds[key].min) {
                bounds[key].min = val
              }
              else if (val > bounds[key].max) {
                bounds[key].max = val
              }
            }
            else if (moment(row[key]).isValid()) {  // is the current element a UTC time?
              val = new Date(row[key]).getTime()
              parsedRow[key] = row[key]

              if (bounds[key] == undefined) {
                bounds[key] = { min: val, max: val }
              }
              else if (val < bounds[key].min) {
                bounds[key].min = val
              }
              else if (val > bounds[key].max) {
                bounds[key].max = val
              }
            }
            else {
              parsedRow[key] = ''
            }
          }
          data.push(parsedRow)
        })
        .on('end', function () {
          callback(data, bounds)
        })
    },
    parseCompleteCallback (data, bounds) {
      this.csv = data
      this.bounds = bounds
    }
  }
}
</script>
