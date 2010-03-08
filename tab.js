Tab = function(config){
  this.printname = 'Tab';
};
Tab.prototype = {
  init: function() {
    var self = this;
    $.map(this.config.tabs, function(tab_group) {
      var anchors = self.get(tab_group).find('.tab a');
      var panes = $.map(anchors, function(a) {
        a = $(a);
        var pane = a.attr('href');
        return pane;
      });
      
      $.each(anchors, function(i, a) {
        a = $(a);
        a.click(function() {
          try {
            self.config.handler.on_deactivate(anchors, panes.join(','));
            self.config.handler.on_activate(a, panes[i]);
          }
          catch(err) {
            log(self +" ERR:"+ err);
          }
          return false;
        });
      });
    });
  }
};
