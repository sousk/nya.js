/**
 * URL
 * 
 * @author sou
 *
 * parse / build URL strings
 *
 * <code>
 *  var u = new UrlStrings(a.attr('href'));
 *  for (var k in params) {
 *    u.set(k, params[k]);
 *  }
 *  a.attr('href', u.toString());
 * </code>
 * 
 */

function UrlStrings(url) {
  this.url = url;
  this.base = url.split('?')[0];
  this.query = $.query.load(url); // quejry-object plugin
  // dirty :(
  this.set = function(k, v) {
    this.query = this.query.set(k, v||"");
    return this;
  };
  this.get = function(k) {
    return this.query.get(k);
  };
  this.toString = function() {
    return this.base + this.query.toString();
  };
  this.to_hash = function() {
    var q = this.query;
    var h = {};
    $.each(this.query.keys, function(key, _v) {
      var val = q.get(key);
      
      // jquery.query 2.1.5 has bug
      if (val == "undefined") val = "";
      
      switch(typeof val) {
        case 'boolean': val = ""; break;
      }
      h[key] = val;
    });
    return h;
  };
}
