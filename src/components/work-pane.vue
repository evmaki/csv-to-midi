<template>
  <div class="work-pane">
    <div class="csv" v-if="Object.keys(csv).length">
      <div class="csv-column" v-for="(values, key) in preview">
        <div class="csv-item csv-header">
          {{ key }}
        </div>
        <div class="csv-item" v-for="value in values">
          {{ value }}
        </div>
      </div>
    </div>
    <div class="csv-startmessage" v-else>
      open a csv file to get started.
    </div>
    <div class="settings" v-if="Object.keys(csv).length">
      <div class="settings-section">
        <p>column mappings</p>
        <div class="settings-subsection">
          <label>
            note:
            <select v-model="params.noteColumn">
              <option v-for="option in numericOptions" :value="option">
                {{ option }}
              </option>
            </select>
          </label>
          <label>
            velocity:
            <select v-model="params.veloColumn">
              <option v-for="option in numericOptions" :value="option">
                {{ option }}
              </option>
            </select>
          </label>
        </div>
        <div class="settings-subsection">
          <label>
            time:
            <select name="time" v-model="params.timeColumn" @change="updateBuiltin">
              <option :value="undefined" data-builtin>
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
            <select name="duration" v-model="params.duraColumn" @change="updateBuiltin">
              <option disabled>
                fixed durations
              </option>
              <option v-for="item in durations" :value="item" data-builtin>
                {{ item }}
              </option>
              <option disabled>
                ---
              </option>
              <option v-for="option in numericOptions" :value="option">
                {{ option }}
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
        <div class="settings-subsection">
          <label>
            octave: ({{ params.octave }})
            <input type="range" v-model="params.octave" min="0" max="10" step="1">
          </label>
          <label>
            range: ({{ params.range }})
            <input type="range" v-model="params.range" min="1" max="5" step="1">
          </label>
        </div>
      </div>
      <div class="save-section">
        <button class="save-button"
          title="save midi"
          @click="buildNoteSequence()"
          :disabled="params.noteColumn == undefined || params.veloColumn == undefined">
          💾
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { Scale } from 'tonal'

import MidiWriter from 'midi-writer-js'
import moment from 'moment'

export default {
  name: 'work-pane',
  props: ['csv', 'stats', 'filename'],
  data () {
    return {
      noteSequence: [],
      params: {}, // params are set in the reset method when the csv watcher is first triggered
      durations: ['64', '32', '16t', '16', 'd8', '8t', '8', 'd4', '4t', '4', 'd2', '2', '1']
    }
  },
  methods: {
    /*
      built-in values are mixed with user-dependent values (based on the imported dataset)
      in the time and duration <select> dropdowns, so we use flags to specify whether
      the chosen value should be treated as a built-in time or duration, or as a column
      in the user's dataset. this avoids collisions between possible column names and any
      sort of built-in name we might specify for the option in the dropdown
    */
    updateBuiltin (e) {
      if (e.target.selectedOptions[0].attributes['data-builtin'] != undefined) {
        this.params.builtIn[e.target.name] = true
      }
      else {
         this.params.builtIn[e.target.name] = false
      }
    },
    buildNoteSequence () {
      console.log('generating note sequence from parameters...')

      var noteColumn = this.params.noteColumn
      var velocityColumn = this.params.veloColumn
      var durationColumn = this.params.duraColumn
      var timeColumn = this.params.timeColumn

      this.noteSequence = []

      var notes = this.getNoteRange(this.params.key, this.params.scale, this.params.octave, this.params.range)
      var len = this.csv[Object.keys(this.csv)[0]].length

      for (var i = 0; i < len; i++) {
        var note = {}

        //  time
        if (!this.params.builtIn['time']) {     // don't use the built in option
          note['time'] = this.getTime(this.csv[timeColumn][i])
        }

        //  duration
        if (!this.params.builtIn['duration']) { // don't use the built in options
          note['duration'] = this.getDuration(this.csv[durationColumn][i])
        }
        else note['duration'] = durationColumn

        // pitch
        note['pitch'] = this.getNote(this.csv[noteColumn][i], notes)

        //  velocity
        note['velocity'] = this.getVelocity(this.csv[velocityColumn][i])

        this.noteSequence.push(note)
      }

      this.generateMidi()
    },
    getNote (value, notes) {
      return notes[Math.floor(this.rescale(value, 0, notes.length-1, this.stats[this.params.noteColumn]))]
    },
    rescale (x, a, b, bound) {
      // console.log(x + ' ' + a + ' ' + b + ' ' + bound['min'] + ' ' + bound['max'])
      if (bound['min'] == bound['max']) {
        return bound['min']
      }
      else {
        return (((b-a)*(x-bound.min))/(bound.max-bound.min))+a
      }
    },
    getVelocity (value) {
      if (this.stats[this.params.veloColumn]['min'] == this.stats[this.params.veloColumn]['max']) {
        return 100
      }
      return Math.floor(this.rescale(value, 1, 100, this.stats[this.params.veloColumn]))
    },
    getDuration (value) {
      if (value == undefined) {
        return this.params.duraColumn
      }
      return this.durations[Math.floor(this.rescale(value, 0, this.durations.length-1, this.stats[this.params.duraColumn]))]
    },
    getTime (value) {
      if (value == undefined) {
        return undefined
      }
      var ms = new Date(value).getTime()
      return Math.floor(this.rescale(ms, 0, this.params.ppq*this.params.bars, this.stats[this.params.timeColumn]))
    },
    generateMidi () {
      console.log('generating midi...')

      var track = new MidiWriter.Track(), wait

      for (var i = 0, len = this.noteSequence.length; i < len; i++) {
        // calculate appropriate wait time between notes
        if (i == 0 || this.noteSequence[i]['time'] == undefined) {
          wait = '0'
        }
        else if (this.noteSequence[i]['time'] != undefined) {
          wait = this.noteSequence[i]['time'] - this.noteSequence[i-1]['time']
        }

        track.addEvent(new MidiWriter.NoteEvent({
            pitch: this.noteSequence[i]['pitch'],
            duration: this.noteSequence[i]['duration'],
            velocity: this.noteSequence[i]['velocity'],
            wait: 'T' + wait
        }))
      }

      this.downloadTrack(track)
    },
    downloadTrack (track) {
      const write = new MidiWriter.Writer(track);
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
      // get all of the notes in the given key
      var tmp = Scale.notes(key + ' ' + scale), ary = [], keyLength = tmp.length

      // repeat the scale for each octave in the given range
      for (var i = 0; i < range; i++) {
        ary.push.apply(ary, tmp)
      }
      
      // add the tonic to the end (for better resolution in outputs)
      ary.push(ary[0])

      // the notes appear one octave lower in midi – increment the octave value to correct this
      octave++

      // add the correct octave for each note
      for (var i = 0, len = ary.length; i < len; i++) {
        if (i % keyLength == 0 && i != 0) {
          octave++
        }
        ary[i] += octave
      }

      return ary
    },
    isValidTime (str) {
      return moment(str).isValid() && isNaN(str)
    },
    reset () {
      this.noteSequence = []

      return {
        key: 'C',
        scale: 'major',
        octave: 4,
        range: 2,
        noteColumn: undefined, // determines pitch/note
        veloColumn: undefined, // determines velocity
        timeColumn: undefined, // determines time (which tick to sound the note on)
        duraColumn: '4', // determines note duration
        builtIn: {
          time: true,
          duration: true
        },
        standardDeviations: 2,
        ppq: 128,
        bars: 128
      }
    }
  },
  computed: {
    preview: function () {
      var preview = {}
      var numRows = 15

      for (let key in this.csv) {
        preview[key] = this.csv[key].slice(0, numRows)
      }

      for (let key in preview) {
        if (preview[key].length == numRows) {
          preview[key][numRows - 1] = '...'
        }
      }

      return preview
    },
    scales: function () {
      return Scale.names()
    },
    keys: function () {
      return Scale.notes('C chromatic')
    },
    timeOptions: function () {    // TODO only checks if first element is valid
      var ary = []

      for (let key in this.csv) {
        if (this.isValidTime(this.csv[key][0])) {
          ary.push(key)
        }
      }

      return ary
    },
    numericOptions: function () {
      var ary = []

      for (let key in this.csv) {
        if (!this.isValidTime(this.csv[key][0])) {
          ary.push(key)
        }
      }

      return ary
    }
  },
  watch: {
    'csv': function () {
      console.log('csv updated')
      this.params = this.reset()
    }
  }
}
</script>
