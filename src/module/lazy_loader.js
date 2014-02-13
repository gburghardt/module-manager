(function() {

function LazyLoader() {

	// Public Methods

	this.init = init;
	this.destructor = destructor;
	this.setElement = setElement;
	this.setManager = setManager;
	this.setOptions = setOptions;

	// Private Properties

	var self = this,
	    _initialized = false,
	    _options = {
	    	resizeTimeout: 250,
	    	scrollTimeout: 250
	    },
	    _scrollElement =
	    _scrollTimer =
	    _manager =
	    _element =
	    _document =
	    _window =
	    _resizeTimer = null,
	    _scrollLeft =
	    _scrollTop =
	    _viewportHeight =
	    _viewportWidth = 0;

	// Private Methods

	function init() {
		if (_initialized) {
			throw new Error("Cannot re-initialize Module.LazyLoader.");
		}
		else if (!_manager) {
			throw new Error("Missing required property: manager. lazyLoader.setManager(...) to fix this error");
		}
		else if (!_element) {
			throw new Error("Missing required property: element. lazyLoader.setElement(...) to fix this error");
		}

		addEvents();

		initModulesInsideViewport();

		if (!_scrollElement.scrollTop && !_scrollElement.scrollLeft) {
			// Not all browsers agree on the _scrollElement. We are at the
			// top of the page so we don't know whether the browser is
			// scrolling the <html> or <body> tag. Defer judgement until
			// the user has scrolled.
			_scrollElement = null;
		}

		_initialized = true;

		return self;
	}

	function initModulesInsideViewport() {
		var elements = _element.getElementsByTagName("*"), i, element;
		var viewport = Viewport.create(getScrollElement());

		for (i = 0; i < elements.length; i++) {
			element = elements[i];

			if (element.getAttribute("data-module-lazyload") && viewport.isVisible(element)) {
				lazyLoadModules(element, "scrollto");
			}
		}
	}

	function lazyLoadModules(element, value) {
		var attr = element.getAttribute("data-module-lazyload");

		if (attr === "any" || new RegExp(value).test(attr)) {

			if (_manager.createModules(element).length) {
				element.removeAttribute("data-module-lazyload");
				element.setAttribute("data-module-lazyloaded", attr);
			}
		}

		element = null;
	}

	function destructor() {
		if (_element) {
			removeEvents();
			_element = _document = _scrollElement = _window = null;
		}

		if (_scrollTimer) {
			clearTimeout(_scrollTimer);
			_scrollTimer = null;
		}

		if (_resizeTimer) {
			clearTimeout(_resizeTimer);
			_resizeTimer = null;
		}

		_manager = _options.scrollElement = _options = self = null;
	}

	function addEvent(element, name, listener) {
		if (name === "resize") {
			listener.oldresize = element.onresize || null;
			element.onresize = listener;
		}
		else if (element.addEventListener) {
			element.addEventListener(name, listener, true);
		}
		else if (name === "scroll") {
			element.onscroll = listener;
		}
		else {
			element.attachEvent("on" + name, listener);
		}
	}

	function addEvents() {
		addEvent(_element, "mouseover", handleMouseOverEvent);
		addEvent(_document, "scroll", handleScrollEvent);
		addEvent(_window, "resize", handleResizeEvent);
	}

	function getScrollElement() {
		if (_scrollElement === null) {
			if (_document.body.scrollTop || _document.body.scrollLeft) {
				_scrollElement = _document.body;
			}
			else {
				_scrollElement = _document.documentElement;
			}
		}

		return _scrollElement;
	}

	function handleMouseOverEvent(event) {
		event = event || window.event;
		event.target = event.target || event.srcElement;

		if (event.target.getAttribute("data-module-lazyload")) {
			lazyLoadModules(event.target, event.type);
		}
	}

	function handleScrollEvent(event) {
		removeEvent(_document, "scroll", handleScrollEvent);

		if (_scrollTimer) {
			clearInterval(_scrollTimer);
		}

		_scrollTimer = setInterval(checkScrollPosition, _options.scrollTimeout);
	}

	function checkScrollPosition() {
		var scrollElement = getScrollElement(),
		    newScrollLeft = scrollElement.scrollLeft,
		    newScrollTop = scrollElement.scrollTop;

		if (newScrollLeft != _scrollLeft || newScrollTop != _scrollTop) {
			clearInterval(_scrollTimer);
			addEvent(_document, "scroll", handleScrollEvent);
			_scrollLeft = newScrollLeft;
			_scrollTop = newScrollTop;
			initModulesInsideViewport();
		}
	}

	function handleResizeEvent(event) {
		removeEvent(_window, "resize", handleResizeEvent);

		if (_resizeTimer) {
			clearInterval(_resizeTimer);
		}

		_resizeTimer = setInterval(checkViewportSize, _options.resizeTimeout);
	}

	function checkViewportSize() {
		var newHeight = _document.documentElement.clientHeight,
		    newWidth = _document.documentElement.clientWidth;

		if (newWidth !== _viewportWidth || newHeight !== _viewportHeight) {
			clearInterval(_resizeTimer);
			addEvent(_window, "resize", handleResizeEvent);
			_viewportHeight = newHeight;
			_viewportWidth = newWidth;
			initModulesInsideViewport();
		}
	}

	function removeEvent(element, name, listener) {
		if (name === "resize") {
			element.onresize = listener.oldresize || null;
			listener.oldresize = null;
		}
		else if (element.removeEventListener) {
			element.removeEventListener(name, listener, true);
		}
		else if (name === "scroll") {
			element.onscroll = null;
		}
		else {
			element.detachEvent("on" + name, listener);
		}
	}

	function removeEvents() {
		removeEvent(_element, "mouseover", handleMouseOverEvent);
		removeEvent(_document, "scroll", handleScrollEvent);
		removeEvent(_window, "resize", handleResizeEvent);
	}

	function setElement(element) {
		_element = element;
		_document = _element.ownerDocument;
	    _window = _document.defaultView;

		element = null;

		return self;
	}

	function setManager(manager) {
		_manager = manager;
		manager = null;
		return self;
	}

	function setOptions(overrides) {
		if (overrides) {
			for (var key in overrides) {
				if (overrides.hasOwnProperty(key)) {
					_options[key] = overrides[key];
				}
			}
		}

		overrides = null;

		return self;
	}

}

// Internal class for viewport calculations
function Viewport() {}

Viewport.prototype = {
	bottom: 0,
	height: 0,
	left: 0,
	right: 0,
	top: 0,
	width: 0,

	constructor: Viewport,

	isBottomInBounds: function isBottomInBounds(position) {
		return (position.top + position.height <= this.top + this.height && position.top + position.height > this.top) ? true : false;
	},

	isLeftInBounds: function isLeftInBounds(position) {
		return (position.left >= this.left && position.left < this.left + this.width) ? true : false;
	},

	isRightInBounds: function isRightInBounds(position) {
		return (position.left + position.width <= this.left + this.width && position.left + position.width > this.left) ? true : false;
	},

	isTopInBounds: function isTopInBounds(position) {
		return (position.top >= this.top && position.top < this.top + this.height) ? true : false;
	},

	isVisible: function isVisible(element) {
		var visible = false;
		var position = this._getPosition(element);

		if ((this.isRightInBounds(position) || this.isLeftInBounds(position)) && (this.isTopInBounds(position) || this.isBottomInBounds(position))) {
			visible = true;
		}

		return visible;
	},

	_getPosition: function _getPosition(element) {
		var parent = element.offsetParent;
		var position = {
			top: element.offsetTop,
			left: element.offsetLeft,
			width: element.offsetWidth,
			height: element.offsetHeight
		};

		while(parent = parent.offsetParent) {
			position.top += parent.offsetTop;
			position.left += parent.offsetLeft;
		}

		return position;
	}
};

Viewport.create = function create(element) {
	var viewport = new this();

	viewport.top = element.scrollTop;
	viewport.left = element.scrollLeft;
	viewport.width = element.clientWidth;
	viewport.height = element.clientHeight;
	viewport.right = element.offsetWidth - (viewport.left + viewport.width);
	viewport.bottom = element.offsetHeight - viewport.top - viewport.height;

	return viewport;
};

Module.LazyLoader = LazyLoader;

})();
