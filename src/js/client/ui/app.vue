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
      <h3 slot="header">what is this?</h3>
      <div slot="body">
        <p>
          csv-to-midi converts csv datasets to midi sequences.
          <p>
            each row in the dataset generates a single note. change <i>column mappings</i>
            to alter the timing and voicing of notes based on the data present in a chosen column.
            change <i>tonality</i> parameters to specify the key and octave
            range of notes in the generated sequence.
          <p>
        </p>

        <p><h4>step by step:</h4></p>
        <ol>
          <li>load a csv dataset WITH HEADERS (it needs headers!)</li>
          <li>assign columns to each sequence parameter</li>
          <ul>
            <li><b>note:</b> element value determines scale degree (note)</li>
            <li><b>velocity:</b> determines note velocity</li>
            <li><b>time:</b>
              determines when the note will sound. only ordered datasets
              (from earliest to latest) with time in UTC format currently
              work for this mapping. otherwise, notes will be ordered in a
              legato (no gaps) sequence.
            </li>
            <li><b>duration:</b> determines the length of the note, or choose from a
              fixed duration for all notes from the given options.</li>
          </ul>
          <li>tweak tonality parameters to your liking</li>
          <li>save sequence</li>
        </ol>
      </div>
    </modal>
  </div>
</template>

<script>
import UploadPane from './upload-pane.vue'
import WorkPane from './work-pane.vue'
import Modal from './modal.vue'

var fastCsv = require('fast-csv')
var moment = require('moment')

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
  created () {
    this.$on('fileLoaded', function (e) {
      this.parseFile(e.result)
      this.filename = e.filename
    })
  },
  methods: {
    parseFile (csvString) {
      this.csv = {}
      this.stats = {}
      
      fastCsv.fromString(csvString, { headers: true })
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
      // ensure underlying Vue components see the update
      // https://stackoverflow.com/questions/45551588/vue-component-props-not-watching-object-changes-properly
      this.csv = Object.assign({}, this.csv)
      this.stats = Object.assign({}, this.stats)

      console.log(this.csv)
    },
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
