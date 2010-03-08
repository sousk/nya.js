//----------------------------------
// TODO:
//
// * do not use id for detecting variables, consider about checkbox (write exception on config ?)
//        categories: this.get("categories").filter(":checked").map(function() { return $(this).val(); })
// * do $(selector).actsAs()
// * add short function to get(name).val if possible
// * do not override methods by framework, rise error and use option to allow override
// * adopted to radio
// * make DRY  has: [ {form: {submit: fn}}, 'text' ] and add_handler in init for alternate
// * add validation on debug mode, for variables or selectors, members
// * find answer multi-variables problem, maybe change 'form' rule
//   * a list that switches content type on user's select needs to handle multiple forms
//----------------------------------

var __DEBUG = true;

var nya = function() {};

(function() {
  //----------------------------------
  // private members
  //----------------------------------
  
  // idea:
  // when you want verbose option, write
  // verbose && log(....);
  var log = (function() {
    if (typeof(window) != "undefined" && window.console
      && window.console.log) {
        // Safari and FireBug 0.4
        // Percent replacement is a workaround for cute Safari crashing bug
        // window.console.log(msg.replace(/%/g, '\uFF05'));
        return function() {
          window.console.log.apply(window.console, arguments);
        };
    }
    else if (typeof(opera) != "undefined" && opera.postError) {
  	  // Opera
      return opera.postError;
    } 
    else {
      return function() {};
    }
  })();
  
  var priv = {
    get_type: function(object) {
      var type = typeof object;
      if (type == 'object' && Array.prototype.isPrototypeOf(object)) {
        type = 'array';
      }
      return type;
    },
    as_type: function(object, branches) {
      var type = this.get_type(object);
      var key = branches[type] ? type : 'default';
      return branches[key](object);
    }
  };
  
  //----------------------------------
  // class methods
  //----------------------------------
  nya.classMethods = {
    hook: function(obj, opts) {
      obj[opts.method] = (function() {
        var original = obj[opts.method];
        return function() {
          typeof(opts.before) == 'function' && opts.before(arguments);
          original.apply(obj, arguments);
          typeof(opts.after) == 'function' && opts.after(arguments);
        };
      })();
    },
    has: function(name, definition) {
      log("initialize >>", name, definition);
      
      // initialize
      var obj = new definition.is(definition.config);
      obj.config = definition.config;
      $.extend(obj, nya.componentMethods);
      
      // init member holders
      obj.members = {};
      obj.selectors = {};
      obj.variable_names = [];
      // aliases = {internal: external}
      obj.name_reference = {
        external: definition.aliases || {},
        internal: nya.componentMethods.invert_hash(definition.aliases || {})
      };
      
      // setup dom members
      obj.define_members(definition.has);
      priv.as_type(definition.has_variables_on, {
        array:     function(defs) { $.each(defs, function(i, def) { obj.define_variables(def); }); },
        'default': function(def) { obj.define_variables(def); }
      });
      
      this.touch(obj);
      this[name] = obj; // make short

      // lib's initialization
      obj.override    && $.extend(obj, obj.override);
      obj.init;
      obj.init        && obj.init();
      definition.init && definition.init(obj);
      
      log("<< end: initialize");
      return obj;
    },
    touch: function(obj) {
      $.extend(obj, nya.classMethods);
      return obj;
      // return obj.init_nya();
    }
  };
  
  //----------------------------------
  // Component methods
  //----------------------------------
  nya.componentMethods = {
    get: function(name, reload) {
      if (! this.members[name] || reload) {
        this.members[name] = this.get_by_selector(name);
      }
      return this.members[name];
    },
    get_by_selector: function(name) {
      var sel = this.selectors[name];
      if (! sel) {
        log("ERR: has no selector associate with: "+name);
        return null;
      }
      return $(sel);
    },
    internal_name: function(name) {
      return this.name_reference.internal[name] || name;
    },
    external_name: function(name) {
      return this.name_reference.external[name] || name;
    },
    serialize: function(option) {
      var form = this.get('form');
      var base = form.attr('action');
      var q = [$.param(this.get_variables())];

      if (option['with']) {
        q.push($.param(option['with']));
      }
      return base +'?'+ q.join('&');
    },
    //
    // set event handlers
    //
    init_handler: function(extend) {
      log('nya: assign_handlers called');
      var self = this;
      var handlers = $.extend({}, this.handlers || {}, extend);
      $.each(handlers, function(name, member_handlers) {
        $.each(member_handlers, function(event, handler) {
          self.get(name).unbind().bind(event, handler);
        });
      });
    },
    init_method_listener: function(defs) {
      var self = this;
      
      // assign listeners
      $.each(defs, function(name, listener) {
        var orig = self[name];
        var listeners = $.makeArray(listener);
        
        // replace method
        self[name] = function() {
          var args = arguments;
          var res = orig.apply(self, args);
          $.each(listeners, function(i, fn) {
            fn(args, res);
          });
          return res;
        };
      });
    },
    define_members: function(defs) {
      if (typeof defs != 'object') return this;
      
      var vars = {};
      var self = this;
      $.each(defs, function(name,sel) {
        self.selectors[self.internal_name(name)] = sel;
      });
      return this;
    },
    define_variables: function(def) {
      if (typeof def != 'string') return this;
      
      var form = $(def);
      var self = this;
      self.selectors['form'] = def;
      
      var cond = 'id^='+ form.attr('id');
      // jquery 1.3.2 has bug on find method.
      // form.find('input['+ cond +'], select['+ cond +']').each(function(i) {
      $('input['+ cond +'], select['+ cond +']').each(function(i) {
        var obj = $(this);
        
        var name = self.internal_name(obj.attr('name'));
        if (name) {
          self.selectors[name] = '#'+ obj.attr('id');
          self.variable_names.push(name);
        }
      });
      
      return this;
    },
    set_variables: function(vars) {
      return this.set_values(vars);
    },
    set_values: function(vars) {
      var self = this;
      $.each(vars, function(name, value) {
        self.get(name).val(value);
      });
      return self;
    },
    set_values_with_query: function(source) {
      var q = $.parsequery(source);
      var self = this;
      $.each(q.keys, function(key, val) {
        var val = q.get(key);
        var type = typeof val;
        self.selectors[key] && self.get(key).val(
          type == 'string' || type == 'number' ? val : ""
        );
      });
      return this;
    },
    get_variables: function() {
      return this.get_values(this.variable_names);
    },
    _get_value_arrays: function(names) {
      var vars = [];
      var self = this;
      $.each(names, function(i, name) {
        vars.push([name, self.get(name).val()]);
      });
      return vars;
    },
    get_values: function(names) {
      var vars = {};
      var self = this;
      $.each(names, function(i, name) {
        vars[name] = self.get(name).val();
      });
      return vars;
    },
    // set function to event handler
    //  and stop default
    replace_event_with: function(f, options) {
      var fn = typeof(f) == 'function' ? f:this.bind(f);
      return function(evt) {
        try {
          fn(evt, options);
        }
        catch(e) {
          log("ERR:"+ e);
        }
        return false;
      };
    },
    bind: function(fname) {
      // var fn = this[fname];
      var self = this;
      return typeof(self[fname]) == 'function' ?
        function() {
          return self[fname].apply(self, arguments);
        }:
        function() {
          log("ERR: failed to execute binded: there's no method named:"+fname);
          return false;
        };
    },
    invert_hash: function(hash) {
      var conv = {};
      $.each(hash, function(k, v) {
        conv[v] = k;
      });
      return conv;
    },
    toString: function() {
      return this.printname;
    }
  };

  $.extend(nya, nya.classMethods);
  if (__DEBUG) window.log = log;
  
})();


//----------------------------------------------------------
// experimental
//----------------------------------------------------------
function ResponseHandler(config){
  this.success = config.success;
  this.error = $.extend({
    handler: function(data) {
      log("got response with error status:", data);
    }
  }, config.error);
  
  this.process = function(response, fn) {
    return this.success.when(response) ? fn(response) 
      : this.error.handler(response);
  };
};


//-------------------------
// debugging console
//-------------------------
function debug_console(open_on_default) {
  var toggle = function() {
    $('#syscon, #sysconsw').toggle();
  };
  
  $(document.body)
  .append(
    // holder
    $('<div id="syscon"></div>')
    .append(
      $('<div id="syscon-innersw">&gt;&gt;</div>').click(toggle)
    )
    .append(
      $('<div id="syscon-content"></div>').append($('.system').show())
    )
    .each(function(i, a) {
      open_on_default || $(a).hide();
    })
  )
  .append(
    $('<div id="sysconsw">&lt;&lt;</div>')
    .click(toggle)
    .each(function(i, a) {
      open_on_default && $(a).hide();
    })
  );
};
