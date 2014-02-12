var Carmen = require('carmen')
var MBTiles = require('mbtiles')
var glob = require('glob')
var path = require('path')
var through2 = require('through2')

function noop() {}

module.exports = function(cb) {
  glob('mbtiles/*.mbtiles', function(err, files) {
    if (err) return cb(err)
    var mbtiles = {}
    files.map(function(file) {
      var name = path.basename(file, path.extname(file))
      mbtiles[name] = new MBTiles(file, noop)
    })
    console.log(mbtiles)
    var geocoder = new Carmen(mbtiles)
    cb(null, function(formatter) { return new GeocodeStream(geocoder, formatter) })
  })
}

function GeocodeStream(geocoder, formatter) {
  var stream = through2({objectMode: true}, this.write.bind(this))
  this.geocoder = stream.geocoder = geocoder
  this.formatter = formatter
  return stream
}

GeocodeStream.prototype.write = function(obj, enc, next) {
  var self = this
  if (this.formatter) obj = this.formatter(obj)
  console.log('geocode', obj)
  this.geocoder.geocode(obj, {}, function(err, results) {
    console.log('results', err, results)
    if (err) self.emit('error', err)
    self.push(results[0])
    next()
  })
}