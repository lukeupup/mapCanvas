(function(window, $, Raphael, undefined){

  var Area = function(pathData, canvas, option){
    var me = this,
        cmdStr = '',
        box,
        pathAttr = {
          'fill'            : option.fillColor,
          'stroke'          : option.strokeColor,
          'stroke-width'    : option.strokeWidth,
          'stroke-linejoin' : option.strokeLinejoin,
          'cursor'          : option.cursor
        },
        textAttr = {
          'fill'            : option.textColor,
          'font-size'       : option.fontSize,
          'font-family'     : option.fontFamily,
          'cursor'          : option.cursor
        },
        zoom = option.zoom,

        // no need to sync mouseenter / mouseleave, because mouseover / mouseout
        // will trigger them automatically
        syncMouseEvents = ['mouseover', 'mouseout', 'mousemove', 'click'],

        $container = $(canvas.canvas).parent();

    me._option = option;
    me._forceColor = '';
    me._forceHoverColor = '';
    me._eventHandlers = {};
    me._rawEventHandlers = {};

    me.name = pathData.name;
    me.path = null;
    me.text = null;

    // Draw path
    $.each(pathData.cmd, function(i, cmd){
      var paramStr = '';
      paramStr += $.map(cmd.param, function(p, i){
        return p * option.zoom;
      }).join(',');
      paramStr = paramStr.replace(',-', '-');
      cmdStr += cmd.method;
      cmdStr += paramStr;
    });

    me.path = canvas.path(cmdStr).attr(pathAttr);

    // Draw text
    box = me.path.getBBox();

    me.text = canvas.text(
      box.x + (box.width / 2) + (pathData.offset ? pathData.offset.x * zoom : 0),
      box.y + (box.height / 2) + (pathData.offset ? pathData.offset.y * zoom : 0),
      me.name
    ).attr(textAttr);

    // Trigger events on path when event is fired on text.
    $.each(syncMouseEvents, function(i, eventName){
      $(me.text.node)[eventName](function(e){
        var canvasOffset = $container.offset(),
            evt = $.Event(eventName, {
              pageX  : e.pageX,
              pageY  : e.pageY,
            }),
            coordinate = {
              x: e.pageX - canvasOffset.left,
              y: e.pageY - canvasOffset.top
            };

        /*
        NOTE: Raphael.isPointInsidePath() have some bugs so that we can't use
        it to determine if we should trigger mouse events of me.path.  
        So before the bug is fixed, mouseenter (as well as mouseleave, etc.)
        will be also triggered when we hover the text, even if the text is inside
        the path.
        If this bug is fixed, we can use the following code to avoid this issue.
        
        See bug detail at:
        https://github.com/DmitryBaranovskiy/raphael/issues/539

        // don't trigger mouseenter / mouseleave / mouseover / mouseout when the text is inside the path.
        if (!Raphael.isPointInsidePath(cmdStr, coordinate.x, coordinate.y) ||
          (eventName === 'click' || eventName === 'mousemove')
        ) {
          $(me.path.node).trigger(evt);
        }
        */
        $(me.path.node).trigger(evt);
        return false;

      });

    });

    // Make the path color changed when mouse hovering.
    me.on('mouseenter', function(){
      if (!me._forceHoverColor) {
        me.path.animate({'fill': option.hoverFillColor}, 100);
        me.text.animate({'fill': option.hoverTextColor}, 100);
      }
      else {
        me.path.animate({'fill': me._forceHoverColor}, 100);
        me.text.animate({'fill': option.hoverTextColor}, 100);
      }
    }).on('mouseleave', function(){
      if (!me._forceColor) {
        me.path.animate({'fill': option.fillColor}, 100);
        me.text.animate({'fill': option.textColor}, 100);
      }
      else {
        me.path.animate({'fill': me._forceColor}, 100);
        me.text.animate({'fill': option.textColor}, 100);
      }
    });

  };

  Area.prototype.on = function(eventType, rawHandler) {
    var me = this,
        handler = function(){
          rawHandler.apply(me, arguments);
        };

    if (me._eventHandlers[eventType]) {
      me._eventHandlers[eventType].push(handler);
      me._rawEventHandlers[eventType].push(rawHandler);
    }
    else {
      me._eventHandlers[eventType] = [handler];
      me._rawEventHandlers[eventType] = [rawHandler];
    }

    $(me.path.node).on(eventType, handler);
    return me;
  };

  Area.prototype.off = function(eventType, rawHandler) {
    var me = this,
        handler,
        i;

    if (!me._rawEventHandlers[eventType]) {
      return me;
    }
    for (i = 0; i < me._rawEventHandlers[eventType].length; i++) {
      if (me._rawEventHandlers[eventType][i] === rawHandler) {
        me._rawEventHandlers[eventType].splice(i, 1);
        handler = me._eventHandlers[eventType].splice(i, 1)[0];
        break;
      }
    }
    if (handler) {
      $(me.path.node).off(eventType, handler);
    }
    return me;
  };

  Area.prototype.data = function(){
    var me = this,
        $path = $(me.path.node);
    return $path.data.apply($path, arguments);
  };
  Area.prototype.removeData = function(){
    var me = this,
        $path = $(me.path.node);
    return $path.removeData.apply($path, arguments);
  };

  Area.prototype.setFillColor = function(color, hoverColor) {
    var me = this;
    if (!color) {
      me.path.animate({'fill': me._option.fillColor},  100);
      me._forceColor = '';
      me._forceHoverColor = '';
    }
    else {
      me.path.animate({'fill': color}, 100);
      me._forceColor = color;
      me._forceHoverColor = hoverColor || color;
    }
    return me;
  };


  var paintMap = function(data, canvas, option){
    var areas = [];

    $.each(data.paths, function(i, path){
      areas.push(new Area(path, canvas, option));
    });
    return areas;
  };

  var bindBubble = function(areas, option){
    var $bubble = $('<div class="J_MapBubble"></div>').appendTo('body')
      .hide().css(option.bubbleStyle);

    $.each(areas, function(i, area){
      area.on('mouseenter', function(e){
        $bubble.html(option.bubble(area)).css({
          top:  (e.pageY) + option.bubbleOffset.y,
          left: (e.pageX) + option.bubbleOffset.x
        }).show();
      }).on('mousemove', function(e){
        $bubble.css({
          top:  (e.pageY) + option.bubbleOffset.y,
          left: (e.pageX) + option.bubbleOffset.x
        });
      }).on('mouseleave', function(e){
        $bubble.hide().empty();
      });
    });

  };


  $.fn.mapCanvas = function(data, option){
    var $this = $(this);
    if (!data) {
      return this;
    }
    if (data === 'areas') {
      return $(this).data('mapCanvas.areas');
    }
    if (typeof data !== 'object') {
      throw 'The first argument should be an object, or exactly "areas".';
    }
    option = $.extend(true, {
      width:          undefined,
      height:         undefined,
      zoom:           1,
      strokeColor:    '#AAA',
      strokeWidth:    1,
      strokeLinejoin: 'round',
      fillColor:      '#EEE',
      textColor:      '#555',
      hoverFillColor: '#FAA',
      hoverTextColor: '#555',
      fontSize:       '12px',
      fontFamily:     'arial, sans-serif',
      cursor:         'pointer',
      bubble: function(area){
        return area.name;
      },
      bubbleOffset: {
        x: 10,
        y: 10
      },
      bubbleStyle: {
        background:   '#333',
        color:        '#FFF',
        borderRadius: '3px',
        padding:      '5px 10px'
      },

      onMapInit:        $.noop,
      onAreaClick:      $.noop,
      onAreaMouseenter: $.noop,
      onAreaMouseleave: $.noop,
      onAreaMousemove:  $.noop
    }, option);

    if (option.width) { // if width is defined, ignore zoom
      option.zoom = option.width / data.dimension.width;
      option.height = data.dimension.height * option.zoom;
    }
    else if (option.height) {
      option.zoom = option.height / data.dimension.height;
      option.width = data.dimension.width * option.zoom;
    }
    else {
      option.width = option.zoom * data.dimension.width;
      option.height = option.zoom * data.dimension.height;
    }

    $.extend(option.bubbleStyle, {
      position: 'absolute',
      zIndex:   '2000',
      wordWrap: 'break-word',
      fontFamily: option.fontFamily,
      fontSize: option.fontSize
    });

    $this.each(function(i, elem){
      var $elem = $(elem).width(option.width).height(option.height).empty(),
          canvas = Raphael(elem, option.width, option.height),
          map = paintMap(data, canvas, option);

      if (option.bubble) {
        bindBubble(map, option);
      }

      $.each(map, function(i, area){
        area.on('click',      option.onAreaClick);
        area.on('mouseenter', option.onAreaMouseenter);
        area.on('mouseleave', option.onAreaMouseleave);
        area.on('mousemove',  option.onAreaMousemove);
      });

      $elem.data('mapCanvas.areas', map);

      if (option.onMapInit) {
        option.onMapInit();
      }

    });
    return this;
  };
})(window, jQuery, Raphael);