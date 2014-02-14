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
    var geocoder = new Carmen(mbtiles)
    cb(null, function(formatter) { return new GeocodeStream(geocoder, formatter) })
  })
}

function GeocodeStream(geocoder, formatter) {
  var stream = through2({objectMode: true}, this.write.bind(this))
  this.stream = stream
  this.geocoder = stream.geocoder = geocoder
  this.formatter = formatter
  return stream
}

GeocodeStream.prototype.write = function(obj, enc, next) {
  var self = this
  var address = this.formatter ? this.formatter(obj) : obj.address
  this.geocoder.geocode(address, {}, function(err, results) {
    if (err) self.stream.emit('error', err)
    var best = results.features[0]
    if (best) obj.geojson = best
    self.stream.push(obj)
    next()
  })
}
