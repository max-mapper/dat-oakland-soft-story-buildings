var port = process.env.PORT || 8080

var request = require('request')
var Dat = require('dat')
var spawn = require('child_process').spawn
var bcsv = require('binary-csv')
var dataURL = "https://raw.github.com/openoakland/soft-story-buildings/master/data.csv"

var dat = new Dat('./data', { port: port }, function ready(err) {
  if (err) throw err
  setInterval(fetch, 60000 * 60 * 24) // fetch every 24 hours
  fetch()
})

function fetch() {
  console.log(JSON.stringify({"starting": new Date()}))
  
    var writeStream = dat.createWriteStream({ json: true })
    
    var csv2json = bcsv({json: true})
    request(dataURL).pipe(csv2json)
    csv2json.on('data', function(obj) {
      // geocode here
      console.log(obj)
    })
}
