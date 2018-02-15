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
              <option v-for="option in timeOptions" :value="option">
                {{ option }}
              </option>
            </select>
          </label>
          <label>
            duration:
            <select v-model="params.duraColumn">
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
  props: ['csv', 'bounds'],
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
        timeColumn: undefined, // determines time (which tick to sound the note on)
        duraColumn: undefined, // determines note duration
        ppq: 128,
        bars: 128
      }
    }
  },
  methods: {
    buildNoteSequence () {
      console.log('generating note sequence from parameters...')
      console.log(this.bounds)
      console.log(this.params)

      var notes = this.getNoteRange(this.params.key, this.params.scale, this.params.octave, this.params.range)

      for (var i = 0, len = this.csv.length; i < len; i++) {
        this.noteSequence.push({
          time: this.getTime(this.csv[i][this.params.timeColumn]),
          note: this.getNote(this.csv[i][this.params.noteColumn], notes),
          velocity: this.getVelocity(this.csv[i][this.params.veloColumn]),
          duration: this.getDuration(this.csv[i][this.params.duraColumn]),
        })
      }

      console.log(this.noteSequence)
    },
    getNote (value, notes) {
      return notes[Math.floor(this.rescale(value, 0, notes.length-1, this.bounds[this.params.noteColumn]))]
    },
    getVelocity (value) {
      return Math.floor(this.rescale(value, 0, 100, this.bounds[this.params.veloColumn]))
    },
    getDuration (value) {
      return '4'
    },
    getTime (value) {
      console.log(value)
      return '1T'
    },
    generateMidi () {
      console.log('generating midi...')
/*
      var veloColumn = this.params.veloColumn || Object.keys(bounds)[0]
      var noteColumn = this.params.noteColumn || Object.keys(bounds)[0]
      var timeColumn = this.params.timeColumn

      var key = this.params.key + ' ' + this.params.scale || 'C major'
      var range = this.params.range || 2
      var oct = this.params.oct || 4
      var ppq = this.params.ppw || 256
      var bars = this.params.bars || 128
      var duration = this.params.duration || '8'

      console.log('key          : ' + key)
      console.log('octave       : ' + oct)
      console.log('range        : ' + range + '\n')

      console.log('velocity var : ' + velVar)
      console.log('note var     : ' + noteVar)
      console.log('time var     : ' + timeVar + '\n')

      var track = new mw.Track(), notes = getNoteRange(key, oct, range)
      var wait, note, vel

      for (var i = 0, len = data.length; i < len; i++) {
        note = Math.floor(rescale(data[i][noteVar], 0, notes.length, bounds[noteVar]))

        // calculate appropriate wait time between notes
        // data needs to be in order for this to be correct
        if (i == 0 || timeVar == undefined) {
          wait = '0'
        }
        else {
          vel = Math.floor(rescale(data[i][velVar], 0, 100, bounds[velVar]))
          wait = Math.floor(rescale(data[i][timeVar], 0, ppq*bars, bounds[timeVar]) - rescale(data[i-1][timeVar], 0, ppq*bars, bounds[timeVar]))
          //console.log(wait)
        }

        track.addEvent(new mw.NoteEvent({pitch: notes[note], duration: duration, velocity: vel, wait: 'T' + wait}))
      }

      //writeTrack(track, '../../output/' + filename + '.mid')
      */
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
