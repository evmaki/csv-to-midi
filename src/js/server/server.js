var express = require('express')
//var bodyParser = require('body-parser')

var app = express()

var port = process.env.PORT || 4567

//app.use(bodyParser.json())
//app.use(bodyParser.urlencoded({ extended: true }))

setStaticPath()
route()

app.listen(port)
console.log('listening on port ' + port)

// Sets the location of static files (for serving assets on the front end)
function setStaticPath () {
  var path = __dirname.split('/')
  path.splice(path.indexOf('src'), 3)
  path = path.join('/')
  app.use(express.static(path + '/public'))

  console.log('static file directory: ' + path + '/public')
}

// Define routings for incoming HTTP requests
function route() {
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
}
