Slider = function(config){
  this.printname = 'Slider';
};
Slider.prototype = (function() {
  var clickable = true;
  var num;
  // var md; // moving distance
  // var speed;
  var pos = 0;
  var range = {
    min: 0,
    max: null
  };
  var slides;
  function has_prev () {
    return pos > range.min;
  }
  function has_next () {
    return pos < range.max;
  }
  
  return {
    init: function() {
      // init
      slides = this.get('slide').find('li');
      num = this.config.num_of_displays;
      range.max = slides.length - num;
      // md = this.config.moving_distance;
      // speed = this.config.speed;
      
      var self = this;
      this.get('next').click(function() {
        try {
          clickable && has_next() && self.next();
        }
        catch(e) {
          log(self +" ERR:"+ e);
        }
        return false;
      });
      this.get('prev').click(function() {
        try {
          clickable && has_prev() && self.prev();
        }
        catch(e) {
          log(self +" ERR:"+ e);
        }
        return false;
      });
      this.update();
    },
    next: function() {
      pos++;
      clickable = false;
      slides.eq(pos -1).fadeOut('slow', function() {
        slides.eq(pos -1 + num).show();
        clickable = true;
      });
      this.update();
    },
    prev: function() {
      pos--;
      clickable = false;
      slides.eq(pos + num).fadeOut('slow', function() {
        slides.eq(pos).show();
        clickable = true;
      });
      this.update();
    },
    update: function() {
      this.get('prev')[ has_prev() ? 'show':'hide' ]();
      this.get('next')[ has_next() ? 'show':'hide' ]();
    }
    // IE6 has bug
    // next: function() {
    //   pos++;
    //   // var dist = (this.get_current_mergin() + (-1 * md)) + 'px';
    //   var dist = (-1 * pos * md) + 'px';
    //   log("------------d", dist);
    // 
    //   var self = this;
    //      this.get('slide').animate(
    //        { marginLeft: dist }, 
    //        { 
    //          queue:false, 
    //          duration:'fast', 
    //          complete:function(){
    //            clickable = true;
    //         // self.get('slide').css('margin-left', dist);
    //         log("---m", self.get('slide').css('margin-left'));
    //          }
    //        }
    //      );        
    // },
    // get_current_mergin: function() {
    //   var m = parseInt(this.get('slide').css('margin-left'), 10);
    //   log("----------------", m);
    //   return m > 0 ? m : 0;
    // }
  };
})();


