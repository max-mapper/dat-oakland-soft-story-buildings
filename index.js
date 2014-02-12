var port = process.env.PORT || 6461

var Dat = require('dat')
var request = require('request')
var bcsv = require('binary-csv')
var dataURL = "https://raw.github.com/openoakland/soft-story-buildings/master/data.csv"

require('./geocoder')(function(err, geocoderStream) {
  if (err) throw err
  
  var dat = new Dat('./data', { port: port }, function ready(err) {
    if (err) throw err
    setInterval(fetch, 60000 * 60 * 24) // fetch every 24 hours
    fetch()
  })
  
  function fetch() {
    console.log(JSON.stringify({
      "starting": new Date(),
      "message": "Geocoding CSV and loading into Dat"
    }))
    
    var csv2json = bcsv({ json: true })
    
    var geocoder = geocoderStream(function formatter(obj) {
      return [obj['Street #'], obj['Street Name'], obj['Street Type']].join(' ')
    })
    
    var writeStream = dat.createWriteStream({
      objects: true,
      primary: ['Parcel #', 'Record #'],
      hash: true
    })
    
    var httpReq = request(dataURL)
    
    httpReq.pipe(csv2json).pipe(geocoder).pipe(writeStream)
    
    httpReq.on('error', function(e) {
      console.log({'HTTPERR': e})
    })
    
    writeStream.on('end', function() {
      console.log(JSON.stringify({
        "finished": new Date(),
        "message": "will fetch again in 24 hours via setTimeout"
      }))
    })
  }
})
