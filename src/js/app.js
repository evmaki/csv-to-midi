var csv = require('fast-csv')
var moment = require('moment')
var mw = require('midi-writer-js')
var tonal = require('tonal')
var fs = require('fs')

function importCsv(filename, callback) {
  var data = []
  var ordered = {}
  var bounds = []

  csv
    .fromPath('../../' + filename + '.csv', {headers: true})
    .on('data', function(row){
      data.push(row)

      // update (min, max) bounds for each value in the current row
      // this helps us discretize data later on when choosing appropriate midi values
      var val
      for (let key in row) {
        if (!isNaN(row[key]) && row[key] != '') {
          val = parseFloat(row[key])
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
        else if (moment(row[key]).isValid()) {
          row[key] = new Date(row[key]).getTime()
          val = row[key]
          ordered[val] = row

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
      }
    })
    .on('end', function() {
      console.log('csv import complete.')
      console.log('bounds by column:')
      console.log(bounds)
      console.log('total entries: ' + data.length)
      callback(data, bounds)
    })
}

function generateMidi(data, bounds, params) {
  var params = params || {}
  var filename = params.filename || 'out'
  var velVar = params.velVar || Object.keys(bounds)[0]
  var noteVar = params.noteVar || Object.keys(bounds)[0]
  var timeVar = params.timeVar

  var key = params.key || 'C major'
  var range = params.range || 2
  var oct = params.oct || 4
  var ppq = params.ppw || 256
  var bars = params.bars || 128
  var duration = params.duration || '8'

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

  writeTrack(track, '../../output/' + filename + '.mid')
}

function writeTrack(track, path) {
  var write = new mw.Writer([track])
  fs.writeFile(path, new Buffer(write.buildFile()), function(err) {
    if (err) {
      return console.log(err)
    }
    return console.log('saved successfully!')
  })
}

function getNoteRange(key, oct, mult) {
  var mult = mult || 1
  var tmp = tonal.Scale.notes(key), ary = [], oct = oct || 2, keyLength = tmp.length

  for (var i = 0; i < mult; i++) {
    ary.push.apply(ary, tmp)
  }

  for (var i = 0, len = ary.length; i < len; i++) {
    if (i % keyLength == 0 && i != 0) {
      oct++
    }
    ary[i] += oct
  }

  return ary
}

function rescale(x, a, b, bound) {
  //console.log(x + ' ' + a + ' ' + b + ' ' + min + ' ' + max)
  return (((b-a)*(x-bound.min))/(bound.max-bound.min))+a
}

var filename = process.argv[2]
if (filename == undefined) {
  console.log('filename must be provided as an argument')
}
else {
  importCsv(filename, function(data, bounds) {
    generateMidi(data, bounds, {noteVar: 'level', filename: filename, key: 'C# mixolydian'})
  })
}
