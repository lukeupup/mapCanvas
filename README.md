mapCanvas
=========

SVG China map based on Raphaël and jQuery (also support other countries)

基于jQuery和Raphaël的中国地图（亦可支持其他国家）

# Usage

Example Code:

示例代码：
	
	<!-- include js files -->
	<script src="libs/jquery/jquery.min.js"></script>
	<script src="libs/raphael.js"></script>
	<script src="src/jquery.mapCanvas.js"></script>
	
	<!-- init and run -->
	<script>
	var option = {
	  zoom: 1.5,
	  fontFamily: '"Microsoft YaHei"'
	};
	$.getJSON('src/chinamap.json', function(data){ // load map data
	  $('#map').mapCanvas(data, option); // pass data and option to mapCanvas method.
	});
	</script>
	
## 地图数据
	
首先，需要加载地图数据。地图数据记录了每个区域的名称和形状。目前只有中国分省地图数据，
保存在src/chinamap.json中。理论上，如果有其他地区的地图数据的话，这个插件也可以适用于其他国家。
数据文件较大，建议异步加载，压缩传输。如果你需要将这个插件应用于别的国家/地区，
请参见[自定义地图数据](#customize-map-data)。

加载好的地图数据通过`mapCanvas`的第一个参数传入。


## 选项

选项是可选的参数。它作为`mapCanvas`的第二个参数传入。可用的选项有：

`width`           默认为`undefined`，规定了画布的宽度。

`height`          默认为`undefined`，规定了画布的宽度。

`zoom`            默认为`1`，        规定了画布相对于原始的dimension的缩放比例。

`strokeColor`     默认为`'#AAA'`，   规定了区块边界的颜色。

`strokeWidth`     默认为`1`，        规定了区块边界的粗细。

`strokeLinejoin`  默认为`'round'`，  规定了区块边界拐角的形状。

`fillColor`       默认为`'#EEE'`，   规定了区块的背景色。

`textColor`       默认为`'#555'`，   规定了区块名称的颜色。

`hoverFillColor`  默认为`'#FAA'`，   规定了鼠标指向区块时区块的背景色。

`hoverTextColor`  默认为`'#555'`，   规定了鼠标指向区块时区块名称的颜色。

`fontSize`        默认为`'12px'`，   规定了区块名称的字体大小。

`fontFamily`      默认为`'arial, sans-serif'`，规定了区块名称的字体。

`cursor`          默认为`'pointer'`，规定了鼠标指向区块时的样式。

`bubble`          默认为`function(area){return area.name;}`，规定了鼠标指向一个区块时出现的气泡中显示的内容。
									这是一个函数，接受一个[Area对象](#area-object)，并返回一段字符串或者html。

`bubbleOffset`    默认为`{x: 10, y: 10 }`，规定了气泡相对于鼠标位置的偏移。

`bubbleStyle`      默认为

	{
		background:   '#333',
		color:        '#FFF',
		borderRadius: '3px',
		padding:      '5px 10px'
	}

规定了气泡的样式。

`onMapInit'`        默认为`$.noop`，规定了地图加载完成时的事件回调函数。

`onAreaClick'`      默认为`$.noop`，规定了点击区块时的事件回调函数。

`onAreaMouseenter'` 默认为`$.noop`，规定了鼠标进入区块时的事件回调函数。

`onAreaMouseleave'` 默认为`$.noop`，规定了鼠标移出区块时的事件回调函数。

`onAreaMousemove'`  默认为`$.noop`，规定了鼠标在区块内移动时的事件回调函数。

### 关于选项的几点注意事项

1. 目前，地图的缩放仅限于宽高等比例缩放。因而width / height / zoom 三个属性中只有一个可以起作用。
	 具体来说，按优先级：width > height > zoom。你只需按需要指定一个参数。

2. `onAreaXxxx`的几个时间处理函数中，都可以通过`this`来调用触发时间的[Area对象](#area-object)，
   并通过接受一个参数`e`来访问事件对应的jQuery Event对象。

3. 按照设计，鼠标点击、进入、移出区块的名字时，会触发整个区块的相应事件，看起来就像名字和图是一个整体一样。
   但是这导致了一个问题：当区块名称的元素位于区块内部时，鼠标移入/移出名字也会触发区块的mouseenter/mouseleave事件。
   而理想的情况应该是仅当名称位于区块外部时才触发相应的事件。究其原因是我无法判断是否名称元素位于区块内还是区块外。
   Raphael提供了一个判断的方法，不幸的是这个方法有bug。

	 因而，目前的情况下，请小心（或者尽量避免）使用`onAreaMouseenter`和`onAreaMouseleave`。
	 它们可能会被重复触发！


## <a name="area-object"></a>Area对象

一个区块被封装成了一个Area对象。通过`bubble`，`onAreaXxx`等函数，可以访问Area对象。

另外，在已加载地图的jQuery对象上调用`mapCanvas('areas')`，可以获取地图中所有Area的列表：

	$.getJSON('src/chinamap.json', function(data){
	  var $map = $('#map').mapCanvas(data);
	  console.log($map.mapCanvas('areas'));
	});

直接操作Area对象中的`path`，`text`属性，提供了更强的控制图像的能力。
也可以通过`on`/`off`/`data`等方法，更精细地操作单个区块。

### Area对象的属性

`name` 是一个字符串，代表区块的名称。

`path` 是一个[Raphael Element](http://raphaeljs.com/reference.html#Element)对象，代表区块的形状路径元素。

`text` 是一个[Raphael Element](http://raphaeljs.com/reference.html#Element)对象，代表区块的名称元素。

### Area对象的方法

`on(eventType, handler)`，  为区块绑定事件处理函数，注意handler中的`this`指向这个Area对象。

`off(eventType, handler)`， 为区块解绑事件处理函数，注意handler中的`this`指向这个Area对象。

`data(key [, data])`，      在Area上绑定一个数据（不传入data，则返回key对应的数据）。

`removeData(key)`，         删除在Area上绑定的数据。

`setColor([color])`，       给区块加背景色（不传入color，则恢复默认的背景色）。通过这个方法设置的背景色不会被鼠标hover事件干掉。


## <a name="customize-map-data"></a>如果你想自定义地图数据:

地图数据是json格式的。基本结构为：

	{
		"dimension": {},
		"paths":[]
	}

`dimension`的结构很简单，它保存了地图的原始尺寸：

	"dimension":  {
	  "width": 650,
	  "height": 500
	}

`paths`是一个数组，数组的每项元素记录了地图中一个区块（在这里也就是一个省）的**名称**和**形状**。`path`中一个元素的结构为：

	{
	  "name": "江苏",
	  "cmd": [{
	    "method": "M",
	    "param": [...]
	  },
	  ...
	  ],
	  offset: {
	    "x": 10,
	    "y": -10
	  }
	}

`name`显然就是区块的名称，是一个字符串。`cmd`即为形状信息。它是一个数组。`offset`定义了显示区块名称时的偏移量，它是可选的。

`cmd`实际上是把[SVG路径字符串(SVG path string format)](http://www.w3.org/TR/SVG/paths.html#PathData)拆分成数组了。这样做的原因是为了便于计算缩放。比如原来写作`M0,0l1,0l0,1z`的path string转换成cmd即为：

	[{
	  "method": "M",
	  "param": [0, 0]
	},{
	  "method": "l",
	  "param": [1, 0]
	},{
	  "method": "l",
	  "param": [0, 1]
	},{
	  "method": "z",
	  "param": []
	}]

必须承认这样显得比较啰嗦，所以今后这个数据结构可能会有所调整。

因此，如果你具有另外国家/地区的SVG路径字符串，你可以将它们转为这个特定的格式，这样就可以把mapCanvas应用于别的国家/地区了。

一般来说区块的名称显示在区块的中心位置，但是有时候区块的中心位置在区块的外面（比如内蒙古），或者区块太小需要把名称显示在旁边。这时候就需要定义`offset`使区块名称相对中心有所偏移。


## 感谢

林飞
[http://www.cnblogs.com/linfei721/](http://www.cnblogs.com/linfei721/)

本项目衍生自他的一篇博文：
[用 Raphaël 绘制中国地图 + 显示数据](http://www.cnblogs.com/linfei721/archive/2013/06/02/3114174.html)