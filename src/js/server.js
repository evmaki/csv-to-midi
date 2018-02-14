var express = require('express')
var app = express()

//var bodyParser = require("body-parser")

var port = process.env.PORT || 4567

var app = express()
//app.use(bodyParser.json())
//app.use(bodyParser.urlencoded({ extended: true }))

var path = __dirname.split('/')
path.splice(path.indexOf('src'), 2)
path = path.join('/')

app.use(express.static(path + '/public'))

app.route('/')
  .get(function(req, res) {
    var options = {
      root: '/',
      dotfiles: 'deny',
      headers: {
          'x-timestamp': Date.now(),
          'x-sent': true
      }
    }

    res.type('html')
    res.sendFile('index.html', options)
  })

console.log('listening on port ' + port)

app.listen(port)
