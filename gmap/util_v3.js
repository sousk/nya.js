
// we have to wait till v3 make conversion-method to public
// http://groups.google.com/group/google-maps-js-api-v3/browse_thread/thread/8fb3bf312ef73182/9040eebdec369c6d?show_docid=9040eebdec369c6d
//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
//:::                                                                         :::
//:::  This routine calculates the distance between two points (given the     :::
//:::  latitude/longitude of those points). It is being used to calculate     :::
//:::  the distance between two ZIP Codes or Postal Codes using our           :::
//:::  ZIPCodeWorld(TM) and PostalCodeWorld(TM) products.                     :::
//:::                                                                         :::
//:::  Definitions:                                                           :::
//:::    South latitudes are negative, east longitudes are positive           :::
//:::                                                                         :::
//:::  Passed to function:                                                    :::
//:::    lat1, lon1 = Latitude and Longitude of point 1 (in decimal degrees)  :::
//:::    lat2, lon2 = Latitude and Longitude of point 2 (in decimal degrees)  :::
//:::    unit = the unit you desire for results                               :::
//:::           where: 'M' is statute miles                                   :::
//:::                  'K' is kilometers (default)                            :::
//:::                  'N' is nautical miles                                  :::
//:::                                                                         :::
//:::  United States ZIP Code/ Canadian Postal Code databases with latitude   :::
//:::  & longitude are available at http://www.zipcodeworld.com               :::
//:::                                                                         :::
//:::  For enquiries, please contact sales@zipcodeworld.com                   :::
//:::                                                                         :::
//:::  Official Web site: http://www.zipcodeworld.com                         :::
//:::                                                                         :::
//:::  Hexa Software Development Center © All Rights Reserved 2004            :::
//:::                                                                         :::
//:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

function distance(lat1, lon1, lat2, lon2, unit) {
	var radlat1 = Math.PI * lat1/180;
	var radlat2 = Math.PI * lat2/180;
	var radlon1 = Math.PI * lon1/180;
	var radlon2 = Math.PI * lon2/180;
	var theta = lon1-lon2;
	var radtheta = Math.PI * theta/180;
	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
	dist = Math.acos(dist);
	dist = dist * 180/Math.PI;
	dist = dist * 60 * 1.1515;
	if (unit=="K") { dist = dist * 1.609344; }
	if (unit=="N") { dist = dist * 0.8684; }
	return dist;
};


function GooglemapManager(config) {
  this.printname = 'GooglemapManager';
};
function GooglemapMarkerManager(config) {
  this.printname = 'GooglemapMarkerManager';
};
function GooglemapHandler(config) {
  this.printname = 'GooglemapHandler';
};
function GooglemapInspector(config) {
  this.printname = 'GooglemapInspector';
};

GooglemapMarkerManager.prototype = {
  init: function() {
    this.handler = this.config.handler;
  }
};

GooglemapHandler.prototype = {
  init: function() {
    $.extend(this, this.override);
    this.init_gmap();
    return this;
  },
  init_gmap: function() {
    var opts = $.extend({
      zoom:   this.get_zoom(),
      center: this.latlng(),
      mapTypeId: this.get_map_type()
    }, this.config.gmap);
    
    this.core = new google.maps.Map(this.get('display')[0], opts);
    return this;
  },
  override: {
    init_handler: function(defs) {
      var self = this;
      $.each(defs, function(event, callback) {
        google.maps.event.addListener(self.core, event, callback);
      });
      return this;
    },
    get_variables: function() {
      var bounds = this.get_bounds();
      var center = this.core.getCenter();
      return $.extend(bounds, {
        lat: center.lat(),
        lng: center.lng(),
        zoom: this.core.getZoom(),
        map_type: this.core.getCurrentMapType().getName()
      });
    }
  },
  latlng: function(lat, lng) {
    return new google.maps.LatLng(
      lat || this.get('lat').val(), 
      lng || this.get('lng').val());
  },
  adjust: function(data) {
    this.core.setCenter(this.latlng(data.lat, data.lng), parseInt(data.zoom, 10));
    return this;
  },
  get_zoom: function() {
    return parseInt(this.get('zoom').val(), 10);
  },
  get_map_type: function() {
    return google.maps.MapTypeId[this.get('map_type_id').val()];
  },
  get_bounds: function() {
    var self = this;
    var bounds = this.core.get_bounds();
    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();

// f.result.value = LatLon.distHaversine(
  // f.lat1.value.parseDeg(), 
  // f.long1.value.parseDeg(), 
  // f.lat2.value.parseDeg(), 
  //f.long2.value.parseDeg()
//).toPrecision(4) + ' km'"
// Number.prototype.toRad = function() {  // convert degrees to radians
  // return this * Math.PI / 180;
// }



var get_meter = function(lat, lng) {
  var R = 6371; // km
  var dLat = (lat2-lat1).toRad();
  var dLon = (lon2-lon1).toRad(); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
          Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
};

log("============", bounds.toSpan());
var size = new google.maps.Size(
  10.1, //width:number, 
  5.5, //height:number, 
  'meter', //widthUnit?:string, 
  'meter' //heightUnit?:string)
);
log("_---------------", size, size.toString());
log("---------------", self.latlng().distanceFrom(self.latlng(sw.lat(),sw.lng())));

    return {
      swlng: sw.lng(),
      swlat: sw.lat(),
      nelng: ne.lng(),
      nelat: ne.lat(),
      radius: (function() { // in meter
        var center = self.core.get_center();
        var vertical   = self.latlng(ne.lat(), center.lng()).distanceFrom(center);
        var horizontal = self.latlng(center.lat(), ne.lng()).distanceFrom(center);
        return vertical > horizontal ? vertical : horizontal;
      })()
    };
  }
};

GooglemapInspector.prototype = {
  init: function() {
    this.handler = this.map = this.config.handler;
  },
  inspect: function() {
    this.set_variables(this.map.get_variables());
  }
};

GooglemapManager.prototype = {
  init: function() {
    this.handler = this.config.handler;
    this.inspector = this.config.inspector;
  },
  add_marker: function(data) {
    log(data, this.handler.latlng(data.lat, data.lng), this.handler.core);
    var m = new google.maps.Marker({
      position: this.handler.latlng(data.lat, data.lng),
      map: this.handler.core
      // shadow: shadow
      // icon: image,
      // shape: shape
    });
  },
  adjust_handler: function() {
    this.handler.adjust(
      $.extend({}, this.config['default'], this.inspector.get_variables()));
    this.inspector.inspect();
  }
};
