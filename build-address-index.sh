#!/bin/bash

set -e -u

DST="$(dirname $0)/mbtiles"
TMP=$(dirname $0)/$(mktemp -d tmp-XXXX)

if [ -f $DST/alameda-county-addr.mbtiles ]; then
    echo "$DST/alameda-county-addr.mbtiles already exists"
    exit 0
fi

if [ ! -d $DST ]; then
    mkdir -p $DST
fi

# Not necessary for operation of geocoding transform,
# only for index generation.
npm install tilelive-bridge@0.0.12

curl -sfo $TMP/SPAD.zip "https://data.acgov.org/api/geospatial/8e4s-7f4v?method=export&format=Shapefile"
unzip -d $TMP $TMP/SPAD.zip
ogr2ogr -f "ESRI Shapefile" -s_srs EPSG:102643 -t_srs EPSG:900913 $TMP/SPAD_webm $TMP/SPAD.shp

echo '<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE Map[]>
<Map srs="+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0.0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over" maximum-extent="-20037508.34,-20037508.34,20037508.34,20037508.34">

<Parameters>
  <Parameter name="center">-122.06335186958313,37.60166074703342,16</Parameter>
  <Parameter name="format">pbf</Parameter>
  <Parameter name="geocoder_layer"><![CDATA[data.ADDRESS]]></Parameter>
  <Parameter name="geocoder_resolution">0</Parameter>
  <Parameter name="json"><![CDATA[{"vector_layers":[{"id":"data","description":"","minzoom":0,"maxzoom":22,"fields":{"X_CORD":"Number","Y_CORD":"Number","ST_NUM":"String","FEANME":"String","FEATYP":"String","DIRPRE":"String","DIRSUF":"String","MUN":"String","UNIT":"String","UNIT_TYP":"String","SRC_AGENCY":"String","SRC_DATE":"String","MULTI":"String","AREA_":"String","UPDATES":"String","SPADID":"Number","ADDRESS":"String","ZIPCODE":"String","FLOOR":"String","CITY":"String","APN":"String","APN_SORT":"String","BOOK":"String","PAGE":"String","PARCEL":"String","SUB_PARCEL":"String","CLCA_CATEG":"String","COMMENTS":"String","DATE_CREAT":"String","DATE_UPDAT":"String","FID_PARCEL":"Number","AddressLoo":"String"}}]}]]></Parameter>
  <Parameter name="maxzoom">15</Parameter>
  <Parameter name="minzoom">15</Parameter>
</Parameters>

<Layer name="data"
  buffer-size="0"
  minzoom="100"
  maxzoom="1000000000"
  srs="+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0.0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs +over">
  <Datasource>
     <Parameter name="file"><![CDATA[SPAD_webm/SPAD.shp]]></Parameter>
     <Parameter name="type"><![CDATA[shape]]></Parameter>
  </Datasource>
</Layer>

</Map>' > $TMP/data.xml

./node_modules/carmen/scripts/carmen-index.js bridge:///$(pwd)/$TMP/data.xml $DST/alameda-county-addr.mbtiles

rm -r $TMP

echo "Index created at $DST/alameda-county-addr.mbtiles"

