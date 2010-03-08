function GooglemapManager() {
  this.printname = 'GooglemapManager';
};
function GooglemapMarkerManager() {
  this.printname = 'GooglemapMarkerManager';
};
function GooglemapInfowindow() {
  this.printname = 'GooglemapInfowindow';
};
function GooglemapHandler() {
  this.printname = 'GooglemapHandler';
};
function GooglemapInspector() {
  this.printname = 'GooglemapInspector';
};
function GooglemapGeocoder() {
  this.printname = 'GooglemapGeocoder';
};

GooglemapGeocoder.prototype = (function() {
  var zoomlevels = [17,17,17,17,17,18,18,18,18];
  var accuracy_to_zoomlevel = function(ac) {
    var z = zoomlevels[ac];
    log("geocoding: calc zoom-level from accuracy z/ac is ",z, ac);
    return z || 17;
  };
  
  return {
    init: function() {
      this.gmap = this.config.gmap;
      this.core = new google.maps.ClientGeocoder;
      this.limits = this.config.enable_limitation ? 
        new google.maps.LatLngBounds(
          new google.maps.LatLng(this.get('swlat').val(), this.get('swlng').val()),
          new google.maps.LatLng(this.get('nelat').val(), this.get('nelng').val())
        ) : null;
    },
    search: function(name, cb) {
      var self = this;
      // keys: name, Status, Placemark
      this.core.getLocations(name, function(r) {
        // keys: AddressDetails, ExtendedData, Point, address, id
        log("got geocoding response", r);
        var adopted = null;
        r.Status.code == 200 && $.each(r.Placemark, function(i, p) {
          if (! adopted) {
            var cor = p.Point.coordinates;
            if (self.is_valid(cor)) {
              adopted = {
                name: r.name,
                zoom: accuracy_to_zoomlevel([p.AddressDetails.Accuracy]),
                lat: cor[1],
                lng: cor[0]
              };
            }
          }
        });
        return cb(adopted);
      });
    },
    is_valid: function(cor) {
      var valid = cor[0] && cor[1] ? true:false;
      if (this.limits && ! this.limits.containsLatLng(new google.maps.LatLng(cor[1], cor[0]))) valid = false;
      return valid;
    },
    update: function() {
      geocoder.setViewport(this.gmap.core.getBounds());
    }
  };
})();

GooglemapHandler.prototype = {
  init: function() {
    this.init_gmap();
    return this;
  },
  init_gmap: function() {
    var dsp = this.get('display')[0];
    ! dsp && log(this +" ERR: can't find dom element named display");
    this.core = new google.maps.Map(
      dsp, this.config.gmap || {});
    this.core.setUI($.extend(this.core.getDefaultUI(), this.config.ui));
    return this;
  },
  override: {
    init_handler: function(defs) {
      var self = this;
      $.each(defs, function(event, callback) {
        google.maps.Event.addListener(self.core, event, callback);
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
    return new google.maps.LatLng(lat, lng);
  },
  adjust: function(data) {
    this.core.setCenter(this.latlng(data.lat, data.lng), parseInt(data.zoom, 10));
    return this;
  },
  get_bounds: function() {
    var self = this;
    var bounds = this.core.getBounds();
    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();

    return {
      swlng: sw.lng(),
      swlat: sw.lat(),
      nelng: ne.lng(),
      nelat: ne.lat(),
      radius: (function() { // in meter
        var center = self.core.getCenter();
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
  adjust_handler: function() {
    var point = this.inspector.get_variables();
    log("adjust map with", point);
    this.handler.adjust(point);
    this.inspector.inspect();
  },
  init_autosubmit: function(opts) {
    var self = this;
    function pos() {
      // do not use inspector, it takes time and causes problem
      return self.handler.get_variables();
    }
    
    var current_process = null;
    $.each(opts.on, function(i, evt) {
      google.maps.Event.addListener(self.handler.core, evt, function(zoom_level) {
        var on = zoom_level ? "zoom:"+zoom_level : 'drag-event';
        var at = pos();
        
        // create new process for each event firing
        var run = function() {
          var me = arguments.callee;
          // me.sig = gen_signiture();
          var cur = pos();
          
          // conds
          var is_latest = current_process == me;
          var is_moved = at.lat != cur.lat || at.lng != cur.lng || at.zoom != cur.zoom;
          
          if (is_latest && ! is_moved) {
            log("autosubmit start:>>", on);
            opts.run();
            log("<< end: autosubmit");
          }
          else {
            log("autosubmit stopped because"
              + ! is_latest ? " :: found new process running":""
              + is_moved    ? " :: map has been moved":""
              ,on, at, cur);
          }
        };
        current_process = run;
        $(document).oneTime(opts.wait, run);
      }); // end addEvent
    });
  }
};

GooglemapMarkerManager.prototype = {
  init: function() {
    this.core = new MarkerManager(this.config.map_object);
    this.icons = {};
    this.item_ids = [];
    this.markers = [];
    this.marker_event_handlers = {
    };
  },
  clear: function() {
    this.core.clearMarkers();
    this.item_ids = [];
    this.markers = [];
    return this;
  },
  register_marker_handler: function(defs) {
    var self = this;
    $.each(defs, function(event, handler) {
      self.marker_event_handlers[event] = handler;
    });
    return self;
  },
  render: function() {
    this.core.addMarkers(this.markers, 4);
    this.core.refresh();
    return this;
  },
  // keys: image, iconAnchor, infoWindowAnchor, iconSize shadow, shadowSize.. etc
  get_icon: function(name) {
    name = name && this.config.icon.types[name] ? name : 'default';

    var self = this;
    return this.icons[name] || (function() {
      var icon = self.create_icon(name);
      self.icons[name] = icon;
      return icon;
    })();
  },
  create_icon: function(name) {
    var configs = [
      this.config.icon.global,
      this.config.icon.types[name]
    ];
    
    var self = this;
    var opt = {};
    $.each(configs, function(i, config) {
      $.each(config, function(k, v) {
        opt[k] = v;
      });
    });
    return new google.maps.Icon($.extend({}, G_DEFAULT_ICON, opt));
  },
  create_marker: function(item) {
    var options = $.extend({
      icon: this.get_icon(item.icon)
    }, this.config.marker);
    
    var marker = new google.maps.Marker(
      new google.maps.LatLng(item.lat, item.lng),
      options
    );
    return marker;
  },
  get_marker: function(plot_id) {
    var i = $.inArray(parseInt(plot_id, 10), this.item_ids);
    var m = this.markers[i];
    ! m && log(this + ":get_marker: there's no marker associated with " + plot_id +" ids:"+this.item_ids.join(","));
    return m || null;
  },
  activate_marker: function(marker){
    google.maps.Event.trigger(marker,"click");
  },
  update: function(data, updator) {
    log("start update markers >>");
    var self = this;
    
    self.clear();
    self.item_ids = data.ids;
    $.each(data.data, function(i, item) {
      var m = self.create_marker(item);
      $.each(self.marker_event_handlers, function(name, fn) {
        google.maps.Event.addListener(m, name, function(latlng) {
          fn({
            data: item,
            marker: m,
            index: i,
            latlng: latlng
          });
        });
      });
      updator && updator(i, m);
      self.markers.push(m);
    });
    self.render();
    log("<< end update markers");
  }
  // item: {
  //   lat:, lng:, // required
  //   icon: {.. see get_icons ..} // optional
  // }
  // add: function(item) {
  //   var marker = this.create(item);
  //   if (item.infowindow) {
  //     marker.bindInfoWindow(item.infowindow);
  //   }
  //   this.core.addMarker(marker, 1);
  //   return this;
  // }
};

GooglemapInfowindow.prototype = {
  update: function(items) {
    var self = this;
    var holder = this.get('holder').empty();
    $.each(items, function(i, item) {
      holder.append(self.render(item));
    });
  },
  render: function(item) {
    var iw = this.get('template').clone(true).show();
    var img = iw.find('img');
    img.attr('src', printf(img.attr('src'),
      item.farm, item.server, item.id, item.secret));
    return iw;
  }
};

function gen_signiture() {
  var str = "";
  while (str.length < 8) { 
    str += Math.floor(Math.random()*11);
  }
  return str;
}
