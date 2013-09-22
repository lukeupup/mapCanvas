(function(window, $, Raphael, undefined){

  var District = function(){

  };

  var paintMap = function(data, canvas, option){
    var areaAttr = {
          'fill'            : option.fillColor,
          'stroke'          : option.strokeColor,
          'stroke-width'    : option.strokeWidth,
          'stroke-linejoin' : option.strokeLinejoin
        },
        textAttr = {
          'fill'            : option.textColor,
          'font-size'       : option.fontSize,
          'font-family'     : option.fontFamily
        },
        areas = [];

    $.each(data.paths, function(i, path){
      var cmdStr = '',
          area,
          box,
          text;
      $.each(path.cmd, function(i, cmd){
        var paramStr = '';
        paramStr += $.map(cmd.param, function(p, i){
          return p * option.zoom;
        }).join(',');

        paramStr = paramStr.replace(',-', '-');
        cmdStr += cmd.method;
        cmdStr += paramStr;
      });

      area = canvas.path(cmdStr).attr(areaAttr);
      box = area.getBBox();

      text = canvas.text(
        box.x + (box.width / 2) + (path.offset ? path.offset.x * option.zoom : 0),
        box.y + (box.height / 2) + (path.offset ? path.offset.y * option.zoom : 0),
        path.name
      ).attr(textAttr);

      areas.push({
        name: path.name,
        area: area,
        text: text
      });

    });

    $.each(areas, function(i, area){
      area.text.toFront();
    });

    return areas;

  };


  $.fn.mapCanvas = function(data, option){
    var $this = $(this);
    if (!data) {
      return this;
    }
    option = $.extend(true, {
      zoom: 1,
      strokeColor:    '#AAA',
      strokeWidth:    1,
      strokeLinejoin: 'round',
      fillColor:      '#EEE',
      textColor:      '#555',
      hoverFillColor: '#FAA',
      hoverTextColor: '#555',
      fontSize:       '12px',
      fontFamily:     'arial, sans-serif',
      bubble: function(name){
        return name;
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

      onClickArea: $.noop,
      onMapInit: $.noop
    }, option);

    if (option.width) { // if width is defined, ignore zoom
      option.zoom = option.width / data.dimension.width;
      option.height = data.dimension.height * option.zoom;
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
          map = paintMap(data, canvas, option),
          $bubble;

      if (option.bubble) {
        $bubble = $('<div class="J_MapBubble"></div>').appendTo('body')
          .hide().css(option.bubbleStyle);
      }

      $.each(map, function(i, area){
        var $node = $(area.area.node),
            $text = $(area.text.node);

        $node.mouseenter(function(e, x, y){
          if (option.bubble) {
            $bubble.html(option.bubble(area.name)).css({
              top:  (y || e.pageY) + option.bubbleOffset.y,
              left: (x || e.pageX) + option.bubbleOffset.x
            }).show();
          }
          area.area.animate({fill: option.hoverFillColor}, 100);
          area.text.animate({fill: option.hoverTextColor}, 100);
        }).mousemove(function(e, x, y){
          if (option.bubble) {
            $bubble.css({
              top:  (y || e.pageY) + option.bubbleOffset.y,
              left: (x || e.pageX) + option.bubbleOffset.x
            });
          }

        }).mouseleave(function(e){
          if (option.bubble) {
            $bubble.hide().empty();
            area.area.animate({fill: option.fillColor}, 100);
            area.text.animate({fill: option.textColor}, 100);
          }
        }).click(function(e){
          if (option.onClickArea) {
            option.onClickArea(area);
          }
        });

        $text.mouseenter(function(e){
          $node.trigger('mouseenter', [e.pageX, e.pageY]);
        }).mousemove(function(e){
          $node.trigger('mousemove', [e.pageX, e.pageY]);
        }).mouseleave(function(e){
          $node.trigger('mouseleave');
        }).click(function(){
          $node.trigger('click');
        });
      });
      

      if (option.onMapInit) {
        option.onMapInit();
      }

    });
    return this;
  };
})(window, jQuery, Raphael);