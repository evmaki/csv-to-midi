<template>
  <transition name="modal">
    <div class="modal-mask">
      <div class="modal-wrapper">
        <div class="modal-container">
      <div slot="body">

      </div>
          <div class="modal-header">
            <h3>what is this?</h3>
          </div>

          <div class="modal-body">
            <p>
              <p>csv-to-midi converts csv datasets to midi sequences.</p>
              <p>
                each row in the dataset generates a single note. change <i>column mappings</i>
                to alter the timing and voicing of notes based on the data present in a chosen column.
                change <i>tonality</i> parameters to specify the key and octave
                range of notes in the generated sequence.
              </p>
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

          <div class="modal-footer">
            <slot name="footer">
              <a href="https://github.com/evmaki/csv-to-midi" title="view source on github">
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
              <button class="modal-default-button" @click="$emit('close')">
                OK
              </button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'modal'
}
</script>

<style scoped>
/*
  Based on the VueJS example: https://vuejs.org/v2/examples/modal.html
*/
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .5);
  display: table;
  transition: opacity .3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 600px;
  margin: 0px auto;
  padding: 15px;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
  transition: all .3s ease;
}

.modal-header h3 {
  margin-top: 0;
}

.modal-body {
  margin: 20px 0;
}

.modal-body p {
  margin-bottom: 10px;
}

.modal-default-button {
  float: right;
}

.modal-enter {
  opacity: 0;
}

.modal-leave-active {
  opacity: 0;
}

.modal-enter .modal-container,
.modal-leave-active .modal-container {
  -webkit-transform: scale(1.05);
  transform: scale(1.05);
}
</style>
