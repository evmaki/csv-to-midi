<template>
  <div class="work-pane">
    <div class="csv" v-if="csv.length">
      <div class="csv-row csv-headers">
        <div class="csv-item" v-for="(key, value) in csv[0]">{{ value }}</div>
      </div>
      <div class="csv-row" v-for="entry in preview">
        <div class="csv-item" v-for="(key, value) in entry">
          {{ key }}
        </div>
      </div>
      <div class="csv-row">
        <div class="csv-item" v-for="(key, value) in csv[0]">...</div>
      </div>
    </div>
    <div class="csv-startmessage" v-else>
      open a csv file to get started.
    </div>
    <div class="settings" v-if="csv[0]">
      <div class="settings-section">
        <p>column mappings</p>
        <div class="settings-subsection">
          <label>
            note:
            <select v-model="params.noteColumn">
              <option v-for="(key, value) in csv[0]" v-if="!isValidTime(key)" :value="value">
                {{ value }}
              </option>
            </select>
          </label>
          <label>
            velocity:
            <select v-model="params.veloColumn">
              <option v-for="(key, value) in csv[0]" v-if="!isValidTime(key)" :value="value">
                {{ value }}
              </option>
            </select>
          </label>
        </div>
        <div class="settings-subsection">
          <label>
            time:
            <select v-model="params.timeColumn">
              <option value="sequential">
                sequential (legato sequence in order of rows)
              </option>
              <option disabled>
                ---
              </option>
              <option v-for="option in timeOptions" :value="option">
                {{ option }}
              </option>
            </select>
          </label>
          <label>
            duration:
            <select v-model="params.duraColumn">
              <option disabled>
                fixed durations
              </option>
              <option v-for="item in durations" :value="item">
                {{ item }}
              </option>
              <option disabled>
                ---
              </option>
              <option v-for="(key, value) in csv[0]" v-if="!isValidTime(key)" :value="value">
                {{ value }}
              </option>
            </select>
          </label>
        </div>
      </div>
      <div class="settings-section">
        <p>tonality</p>
        <div class="settings-subsection">
          <label>
            key:
            <select v-model="params.key">
              <option v-for="option in keys" :value="option">
                {{ option }}
              </option>
            </select>
          </label>
          <label>
            scale:
            <select v-model="params.scale">
              <option v-for="option in scales" :value="option">
                {{ option }}
              </option>
            </select>
          </label>
        </div>
      </div>
        <label class="save-button" title="save midi" @click="buildNoteSequence()">
          💾
        </label>
    </div>
  </div>
</template>

<script>
import { Scale } from 'tonal'

var mw = require('midi-writer-js')
var moment = require('moment')

export default {
  name: 'work-pane',
  props: ['csv', 'bounds', 'filename'],
  data () {
    return {
      noteSequence: [],
      params : {
        key: 'C',
        scale: 'major',
        octave: 4,
        range: 2,
        noteColumn: undefined, // determines pitch/note
        veloColumn: undefined, // determines velocity
        timeColumn: 'sequential', // determines time (which tick to sound the note on)
        duraColumn: '4',       // determines note duration
        ppq: 128,
        bars: 128
      },
      durations: ['64', '32', '16t', '16', 'd8', '8t', '8', 'd4', '4t', '4', 'd2', '2', '1']
    }
  },
  methods: {
    buildNoteSequence () {
      console.log('generating note sequence from parameters...')

      this.noteSequence = []

      var notes = this.getNoteRange(this.params.key, this.params.scale, this.params.octave, this.params.range)

      for (var i = 0, len = this.csv.length; i < len; i++) {
        this.noteSequence.push({
          time: this.getTime(this.csv[i][this.params.timeColumn]),
          note: this.getNote(this.csv[i][this.params.noteColumn], notes),
          velocity: this.getVelocity(this.csv[i][this.params.veloColumn]),
          duration: this.getDuration(this.csv[i][this.params.duraColumn]),
        })
      }

      this.generateMidi()
    },
    getNote (value, notes) {
      return notes[Math.floor(this.rescale(value, 0, notes.length-1, this.bounds[this.params.noteColumn]))]
    },
    getVelocity (value) {
      return Math.floor(this.rescale(value, 0, 100, this.bounds[this.params.veloColumn]))
    },
    getDuration (value) { // TODO this will get buggy if a column has the same name as a duration
      if (value == undefined) {
        return this.params.duraColumn
      }
      return this.durations[Math.floor(this.rescale(value, 0, this.durations.length-1, this.bounds[this.params.duraColumn]))]
    },
    getTime (value) {     // TODO this will get buggy if a column is named "sequential"
      if (value == undefined) {
        return undefined
      }

      var ms = new Date(value).getTime()

      return Math.floor(this.rescale(ms, 0, this.params.ppq*this.params.bars, {
        min: new Date(this.bounds[this.params.timeColumn]['min']).getTime(),
        max: new Date(this.bounds[this.params.timeColumn]['max']).getTime()
      }))
    },
    generateMidi () {
      console.log('generating midi...')

      var track = new mw.Track(), wait

      for (var i = 0, len = this.noteSequence.length; i < len; i++) {
        // calculate appropriate wait time between notes
        if (i == 0 || this.noteSequence[i]['time'] == undefined) {
          wait = '0'
        }
        else if (this.noteSequence[i]['time'] != undefined) {
          wait = this.noteSequence[i]['time'] - this.noteSequence[i-1]['time']
        }

        track.addEvent(new mw.NoteEvent({
          pitch: this.noteSequence[i]['note'],
          duration: this.noteSequence[i]['duration'],
          velocity: this.noteSequence[i]['velocity'],
          wait: 'T' + wait
        }))
      }

      this.downloadTrack(track)
    },
    downloadTrack (track) {
      var write = new mw.Writer([track])
      var data = write.buildFile()
      var filename = this.filename + '.mid'

      var blob = new Blob([data], {
          type: 'audio/midi'
      })

      var URL = window.URL || window.webkitURL
      var downloadUrl = URL.createObjectURL(blob)

      if (filename) {
        var a = document.createElement('a')

        if (typeof a.download === 'undefined') {
          window.location = downloadUrl
        }
        else {
          a.href = downloadUrl
          a.download = filename
          document.body.appendChild(a)
          a.click()
        }
      }
    },
    getNoteRange (key, scale, octave, range) {
      var tmp = Scale.notes(key + ' ' + scale), ary = [], keyLength = tmp.length

      for (var i = 0; i < range; i++) {
        ary.push.apply(ary, tmp)
      }

      for (var i = 0, len = ary.length; i < len; i++) {
        if (i % keyLength == 0 && i != 0) {
          octave++
        }
        ary[i] += octave
      }

      return ary
    },
    rescale (x, a, b, bound) {
      //console.log(x + ' ' + a + ' ' + b + ' ' + min + ' ' + max)
      return (((b-a)*(x-bound.min))/(bound.max-bound.min))+a
    },
    isValidTime (str) {
      return moment(str).isValid() && isNaN(str)
    }
  },
  computed: {
    preview: function () {
      return this.csv.slice(0, 10)
    },
    scales: function () {
      return Scale.names()
    },
    keys: function () {
      return Scale.notes('C chromatic')
    },
    timeOptions: function () {
      var ary = []

      for (let key in this.csv[0]) {
        if (this.isValidTime(this.csv[0][key])) {
          ary.push(key)
        }
      }

      return ary
    }
  }
}
</script>
