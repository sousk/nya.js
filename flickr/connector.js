function FlickrConnector() {
  this.printname = 'FlickrConnector';
  
  // http://www.flickr.com/services/api/misc.urls.html
  // http://farm{farm-id}.static.flickr.com/{server-id}/{id}_{secret}_[mstb].jpg
  this.image_url_template = 'http://farm%d.static.flickr.com/%d/%d_%s_%s.jpg';
};
FlickrConnector.prototype = {
  init: function() {
    this.response_handler = new ResponseHandler({
      success: {
        when: function(response) {
          return response.stat && response.stat == 'ok';
        }
      }
    });
  },
  echo: function(response) {
    log(this+' echo:', response);
  },
  query: function(option) {
    var q = this.serialize({'with': option});
    log("send query to flickr:", q);
    $.getScript(q);
    return q;
  },
  query_get_location: function(photo_id, callback) {
    var base_param = this.get_values(this.config.parameters.common);
    var q = this.get('form').attr('action') +'?'+ $.param($.extend(base_param, {
      method: 'flickr.photos.geo.getLocation',
      jsoncallback: callback,
      photo_id: photo_id
    }));
    $.getScript(q);
  },
  // returns bbox value
  // The 4 values represent the bottom-left corner of the box and the top-right corner, 
  // minimum_longitude, minimum_latitude, maximum_longitude, maximum_latitude. 
  update_bbox: function() {
    var pos = this.get_values(['swlat', 'swlng', 'nelng', 'nelat']);
    var has_nan = false;
    $.each(pos, function(k,v) {
      var f = parseFloat(v);
      f ? (pos[k] = f) : (has_nan = true);
    });

    // minlng, minlat, maxlng, maxlat
    this.get('bbox').val(
      has_nan ? "" : [
        pos.swlng < pos.nelng ? pos.swlng : pos.nelng,
        pos.swlat < pos.nelat ? pos.swlat : pos.nelat,
        pos.swlng > pos.nelng ? pos.swlng : pos.nelng,
        pos.swlat > pos.nelat ? pos.swlat : pos.nelat
      ].join(","));
    return this;
  },
  update_on_search: function(data) {
    var self = this;
    this.response_handler.process(data, function(data) {
      self.update_thumbnails(data.photos.photo);
    });
  },
  update_thumbnails: function(photos) {
    var self = this;
    var holder = this.get('index').empty();
    $.each(photos, function(i, photo) {
      holder.append(self.render_thumbnail_template(photo));
    });
  },
  // type: 
  // s	small square 75x75
  // t  thumbnail, 100 on longest side
  // m  small, 240 on longest side
  // b  large, 1024 on longest side (only exists for very large original images)
  get_image_url: function(photo, type) {
    return printf(this.image_url_template, 
      photo.farm, photo.server, photo.id, photo.secret, type || t);
  },
  render_thumbnail_template: function(photo) {
    var thumb = this.get('index_template').clone(true).show();
    var img = thumb.find('img');
    img.attr('src', printf(img.attr('src'),
      photo.farm, photo.server, photo.id, photo.secret));
    // thumb.find('a').click(function() {
    //   app.map_mgr.marke
    // });
    return thumb;
  },
  select_associated_callback: function() {
    if (this.get('sync_method_callback').is(':checked')) {
      this.get('jsoncallback').val(this.config.associated_callbacks[
        this.get('method').val()]);
    }
    return this;
  },
  select_associated_method: function() {
    if (this.get('sync_method_callback').is(':checked')) {
      var h = this.invert_hash(this.config.associated_callbacks);
      this.get('method').val(h[this.get('jsoncallback').val()]);
    }
    return this;
  }
};
