Pager = function() {
  this.printname = 'Pager';  
};

Pager.prototype = {
  default_defs: {
    is: Pager,
    config: {
      request_keys: {
        // local-name: parameter-key
        page:         'page'
      },
      response_keys: {
        // local-name: parameter-key
        per_page:     'per_page',
        cur_pnum:     'current',
        last_pnum:    'last'
      }
    },
    has: {
      box:    '.pager',
      col_anchors: '.pager a',
      cols:  '.pager > li.col',
      col_first: '.pager > li.col_first',
      col_last: '.pager > li.col_last',
      col_next: '.pager > li.col_next',
      col_back: '.pager > li.col_back'
    }
  },
  init: function() {
    var def = this.default_defs.config;
    this.request_keys = $.extend({}, def.request_keys, this.config.request_keys);
    this.response_keys = $.extend({}, def.response_keys, this.config.response_keys);
    
    this.params = {};
    this.pnum = {};
    return this;
  },
  get_link_of: function(name) {
    return this.get(name).find('a').attr('href');
  },
  // set new query
  set_query: function(q) {
    this.query = q;
    return this;
  },
  set_params: function(params) {
    this.params = this.to_local(params);
    this.page = {
      last: parseInt(this.params['last_pnum'], 10),
      current: parseInt(this.params['cur_pnum'], 10)
    };
    
    this.column_numbers = this.gen_column_indexes();
    return this;
  },
  // << < 2 3 [4] 5 6 > >> gets [2,3,4,5,6]
  // << < 1 [2] 3 4> >> gets [1,2,3,4]
  // << < 8 9 10 11 [12] > >> gets [8,9,10,11,12]
  // << < [1] 2 3 4 5 > >> gets [1,2,3,4,5]
  gen_column_indexes: function() {
    var current = this.page.current;
    var last = this.page.current > this.page.last ? this.page.current : this.page.last;
    var num_of_cols = this.get_num_of_columns();
    
    // term:
    //       1  2 3 [4] 5      
    //   [from] 2 3  4 [to] 
    var steps = parseInt(num_of_cols/2, 10);
    if (num_of_cols > current + steps) {
      var from  = 1; //current;
      var to = from + (num_of_cols - 1);
    }
    else if(current + steps > last) {
      var to = last;
    }
    else {
      var to = (function() {
        var n = current + steps;
        return last > n ? n : last;
      })();
    }

    var from = (function() {
      var n = to - (num_of_cols - 1);
      return n > 1 ? n : 1;
    })();
    
    var cols = [];
    for (var i=from; i <= to; i++) {
      if (i > 0) cols.push(i);
    };
    // log("gets ",'f:'+from, 't:'+to, 's:'+steps, 'c:'+current, 'l:'+last, num_of_cols, cols);
    return cols;
  },
  update: function(param) {
    return this.set_params(param)
      .update_page_columns()
      .update_shortcut_columns();
  },  
  update_page_columns: function() {
    var that = this;
    var updator = this.get_column_updator(this.query);
    log("Pager: bulid pagination query from:", this.query);
    
    // update page cols
    this.get('cols').each(function(i, page) {
      var pnum = that.column_numbers[i];
      // col, pnum, text, has_link
      updator($(page), pnum, pnum, pnum != that.page.current);
    });
    
    return that;
  },
  update_shortcut_columns: function() {
    var that = this;
    var updator = this.get_column_updator(this.query);
    var cur = that.page.current;
    
    var link_backward = that.page.current > 1;
    var link_forward  = that.page.last > that.page.current;
    $.each({
      'col_first': [link_backward, 1], 
      'col_back': [link_backward, cur > 2 ? cur - 1 : 1], 
      'col_next': [link_forward, cur + 1],
      'col_last': [link_forward, that.page.last]
    }, function(key, param) {
      var column  = that.get(key);
      var pnum = param[1];
      // log("update-shc: ", key, param, column.find('a').text());
      // col, pnum, text, has_link
      var updated = updator(column, pnum, column.find('a').text(), param[0]);
    });
    return that;
  },
  get_column_updator: function(q) {
    var that = this;
    var query = typeof(q) == 'string' ? $.parsequery(q) : q;
    var pnum_key = this.config.request_keys['page'];
    return function(column, pnum, text, has_link) {
      var link = query.set(pnum_key, pnum ||"").toString();

      // update
      column.find('a')
        .show().text(text || "")
        .attr('href', link);
      
      // adjust link
      var a = column.find('a');
      var span = column.find('span.pager-temp');
      if (has_link) {
        // show
        a.show();
        span.remove();
      }
      else {
        // hide link
        a.hide();
        if (! span.length > 0) {
          a.before('<span class="pager-temp"></span>');
          span = column.find('span.pager-temp');
        }
        span.html(a.html());;
      }
      
      // adjust column
      if (! pnum) { // has no page number, maybe beyond the last
        column.hide();
      }
      else {
        column.show();
      }
      return column;
    };
  },
  to_local: function(params) {
    var conv = {};
    var keymap = this.invert_hash(this.response_keys);
    $.each(params, function(k, v) {
      var local = keymap[k];
      conv[local ? local:k] = v;
    });
    return conv;
  },
  invert_hash: function(hash) {
    var conv = {};
    $.each(hash, function(k, v) {
      conv[v] = k;
    });
    return conv;
  },
  // << < 2 3 [4] 5 6 > >> gets 5
  // << < 10 11 [12] > >> gets 3
  get_num_of_columns: function() {
    var defined = this.get('cols').length;
    
    // if page has 5 cols, and last-page is 0 or 1, then there's only 1 cols
    var last = this.params['last_pnum'];
    var limit =  defined > last ? last : defined;
    return (limit > 1) ? limit : 1;
  }
};
