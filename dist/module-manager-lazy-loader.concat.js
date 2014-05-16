/*! module-manager 2014-05-16 */
/*! browser-viewport 2014-05-16 */
function Viewport(_window) {
	if (!_window) {
		throw new Error("Missing required argument: window");
	}

	// Private Properties

	var self = this,
	    _events = {
	    	"resize:complete": {
	    		type: "resize",
	    		handle: null,
	    		useCapture: false,
	    		bound: false,
	    		listeners: [],
	    		element: _window
	    	},
	    	"scroll:complete": {
	    		type: "scroll",
	    		handle: null,
	    		useCapture: false,
	    		bound: false,
	    		listeners: [],
	    		element: _window.document
	    	}
	    },
	    _eventListenerDelay = 20,
	    _orientation = _window.orientation || this.height > this.width ? 0 : 90;
	    _orientationEvent = {
	    	mql: _window.matchMedia ? _window.matchMedia("(orientation: portrait)") : null,
	    	regex: /^orientation:\w+$/i,
	    	listeners: {
	    		count: 0,
		    	"orientation:change": [],
		    	"orientation:portrait": [],
		    	"orientation:landscape": []
		    },
	    	test: function(type) {
	    		return this.regex.test(type)
	    		    && !!this.listeners[type];
	    	}
	    },
	    _resizeTimer = null,
	    _resizeTimeout = 300,
	    _scrollTimer = null,
	    _scrollTimeout = 300,
	    createAccessor = function(name, get, set) {
	    	Object.defineProperty(self, name, {
	    		enumerable: true,
	    		get: get,
	    		set: set
	    	});
	    },
	    createGetter = function(name, get) {
	    	Object.defineProperty(self, name, {
	    		enumerable: true,
	    		get: get
	    	});
	    };

	// Public Properties

	createGetter("bottom", function() {
		return _window.pageYOffset + _window.innerHeight;
	});

	createGetter("document", function() {
		return _window.document;
	});

	createAccessor("eventListenerDelay",
		function() {
			return _eventListenerDelay;
		},
		function(value) {
			_eventListenerDelay = value;
		}
	);

	createGetter("height", function() {
		return _window.innerHeight;
	});

	createGetter("left", function() {
		return _window.pageXOffset;
	});

	createGetter("location", function() {
		return _window.location;
	});

	createGetter("orientation", function() {
		return _orientation;
	});

	createAccessor("resizeTimeout",
		function() {
			return _resizeTimeout;
		},
		function(value) {
			_resizeTimeout = value;
		}
	);

	createGetter("right", function() {
		return _window.pageXOffset + _window.innerWidth;
	});

	createGetter("screen", function() {
		return _window.screen;
	});

	createAccessor("scrollTimeout",
		function() {
			return _scrollTimeout;
		},
		function(value) {
			_scrollTimeout = value;
		}
	);

	createGetter("top", function() {
		return _window.pageYOffset;
	});

	createGetter("width", function() {
		return _window.innerWidth;
	});

	createGetter("window", function() {
		return _window;
	});

	// Public Methods

	this.destructor = function() {
		if (_resizeTimer) {
			_window.clearTimeout(_resizeTimer);
			_resizeTimer = null;
		}

		if (_scrollTimer) {
			_window.clearTimeout(_scrollTimer);
			_scrollTimer = null;
		}

		removeSpecialEvent(_events["resize:complete"]);
		removeSpecialEvent(_events["scroll:complete"]);

		self = _events = _window = null;
	};

	this.addEventListener = function(type, listener) {
		type = type.toLowerCase();

		var event, listeners;

		if (_orientationEvent.test(type)) {
			listeners = _orientationEvent.listeners;

			if (!listeners.count && _orientationEvent.mql) {
				_orientationEvent.mql.addListener(handleOrientationChangeEvent);
			}

			listeners[type].push(listener);
			listeners.count++;
		}
		else if (event = _events[type]) {
			addSpecialEvent(event);
			event.listeners.push(listener);
		}
	};

	this.removeEventListener = function(type, listener) {
		type = type.toLowerCase();

		var event, index, listeners;

		if (_orientationEvent.test(type)) {
			listeners = _orientationEvent.listeners[type];
			index = listeners.indexOf(listener);

			if (index > -1) {
				listeners.splice(index, 1);

				if (--listeners.count === 0 && _orientationEvent.mql) {
					_orientationEvent.mql.removeListener(handleOrientationChangeEvent);
				}
			}
		}
		else if (_events[type]) {
			event = _events[type];
			index = event.listeners.indexOf(listener);

			if (index > -1) {
				event.listeners.splice(index, 1);

				if (!event.listeners.length) {
					removeSpecialEvent(event);
				}
			}
		}
	};

	// Private Methods

	var addSpecialEvent = function(event) {
		if (event.bound) {
			return;
		}

		event.element.addEventListener(event.type, event.handle, event.useCapture);
		event.bound = true;
	},
	fireResizedEvent = function() {
		fireEvent(_events["resize:complete"].listeners);
	},
	fireScrollCompleteEvent = function() {
		fireEvent(_events["scroll:complete"].listeners);
	},
	fireEvent = function(listeners) {
		if (!listeners.length) {
			return;
		}

		var callback = function() {
			if (++i === listeners.length || listeners[i](self) === false) {
				return;
			}

			_window.setTimeout(callback, _eventListenerDelay);
		}, i = -1;

		callback();
	},
	handleOrientationChangeEvent = function(m) {
		_orientation = m.matches ? 0 : _window.orientation || 90;

		fireEvent(_orientationEvent.listeners["orientation:change"]);

		if (m.matches) {
			fireEvent(_orientationEvent.listeners["orientation:portrait"]);
		}
		else {
			fireEvent(_orientationEvent.listeners["orientation:landscape"]);
		}
	},
	handleResizeEvent = function(event) {
		if (_resizeTimer) {
			_window.clearTimeout(_resizeTimer);
			_resizeTimer = null;
		}

		_resizeTimer = _window.setTimeout(fireResizedEvent, _resizeTimeout);
	},
	handleScrollEvent = function(event) {
		if (_scrollTimer) {
			_window.clearTimeout(_scrollTimer);
			_scrollTimer = null;
		}

		_scrollTimer = _window.setTimeout(fireScrollCompleteEvent, _scrollTimeout);
	},
	removeSpecialEvent = function(event) {
		if (!event.bound) {
			return;
		}

		event.element.removeEventListener(event.type, event.handle, event.useCapture);
		event.bound = false;
	};

	_events["resize:complete"].handle = handleResizeEvent;
	_events["scroll:complete"].handle = handleScrollEvent;
}

Viewport.prototype = {

	constructor: Viewport,

	contains: function(element) {
		var their = this.getElementPosition(element),
		    my = this.getPosition();

		if (their.left < my.right
			&& their.right > my.left
			&& their.top < my.bottom
			&& their.bottom > my.top) {
			return true;
		}
		else {
			return false;
		}
	},

	getElementPosition: function(element) {
		var pos = {
			left:   element.offsetLeft,
			top:    element.offsetTop,
			width:  element.offsetWidth,
			height: element.offsetHeight
		};

		while (element = element.offsetParent) {
			pos.left += element.offsetLeft;
			pos.top += element.offsetTop;
		}

		pos.right = pos.left + pos.width;
		pos.bottom = pos.top + pos.height;

		return pos;
	},

	getPosition: function() {
		return {
			left:   this.left,
			top:    this.top,
			width:  this.width,
			height: this.height,
			right:  this.right,
			bottom: this.bottom
		};
	},

	is: function(x) {
		return this === x
		    || this.window === x
		    || this.screen === x
		    || this.document === x;
	},

	matchMedia: function(query) {
		return this.window.matchMedia
		     ? this.window.matchMedia(query)
		     : { matches: false };
	},

	querySelector: function(selector, callback, context) {
		var element = null;

		this.querySelectorAll(selector, function(el) {
			element = el;
			return false;
		});

		return element;
	},

	querySelectorAll: function(selector, callback, context) {
		callback = callback || function() {};
		context = context || this;

		var elements = this.document.body.querySelectorAll(selector),
		    i = 0, result, matches = [], element;

		for (i; i < elements.length; i++) {
			element = elements[i];

			if (this.contains(element)) {
				matches.push(element);

				if (result !== false) {
					result = callback.call(context, element, i, this);
				}
			}
		}

		return matches;
	},

	toString: function() {
		return "[object Viewport: " + this.location + "]";
	}

};

(function() {

function LazyLoader() {
	this.handleScrollComplete = this.handleScrollComplete.bind(this);
	this.handleResizeComplete = this.handleResizeComplete.bind(this);
	this.handleMouseover = this.handleMouseover.bind(this);
	this.options = {
		resizeTimeout: 0,
	    scrollTimeout: 0
	};
}
LazyLoader.prototype = {

	document: null,

	element: null,

	manager: null,

	options: null,

	viewport: null,

	window: null,

	constructor: LazyLoader,

	destructor: function() {
		if (this.viewport) {
			this.viewport.removeEventListener("scroll:complete", this.handleScrollComplete);
			this.viewport.removeEventListener("resize:complete", this.handleResizeComplete);
			this.viewport = null;
		}

		if (this.element) {
			this.element.removeEventListener("mouseover", this.handleMouseover, false);
			this.element = null;
		}

		this.document = this.window = this.options = this.manager = null;
	},

	init: function() {
		if (!this.viewport) {
			this.setViewport(new Viewport(window));
		}

		if (this.options.resizeTimeout > 0) {
			this.viewport.resizeTimeout = this.options.resizeTimeout;
		}

		if (this.options.scrollTimeout > 0) {
			this.viewport.scrollTimeout = this.options.scrollTimeout;
		}

		this.viewport.addEventListener("scroll:complete", this.handleScrollComplete);
		this.viewport.addEventListener("resize:complete", this.handleResizeComplete);
		this.element.addEventListener("mouseover", this.handleMouseover, false);

		this._initModulesInViewport();

		return this;
	},

	handleMouseover: function(event) {
		event = event || window.event;
		event.target = event.target || event.srcElement;

		if (event.target.getAttribute("data-module-lazyload")) {
			this._lazyLoadModules(event.target, event.type);
		}
	},

	handleScrollComplete: function(viewport) {
		this._initModulesInViewport();
	},

	handleResizeComplete: function(viewport) {
		this._initModulesInViewport();
	},

	_initModulesInViewport: function() {
		this.viewport.querySelectorAll("[data-module-lazyload]", function(element) {
			this._lazyLoadModules(element, "scrollto");
		}, this);
	},

	_lazyLoadModules: function(element, value) {
		var attr = element.getAttribute("data-module-lazyload");

		if (attr === "any" || new RegExp(value).test(attr)) {
			if (this.manager.createModules(element, true).length) {
				element.removeAttribute("data-module-lazyload");
				element.setAttribute("data-module-lazyloaded", attr);
			}
		}
	},

	setElement: function(element) {
		this.element = element;
		this.document = element.ownerDocument;
	    this.window = this.document.defaultView;
		return this;
	},

	setManager: function(manager) {
		this.manager = manager;
		return this;
	},

	setOptions: function(overrides) {
		if (overrides) {
			for (var key in overrides) {
				if (overrides.hasOwnProperty(key)) {
					this.options[key] = overrides[key];
				}
			}
		}

		return this;
	},

	setViewport: function(viewport) {
		this.viewport = viewport;
		this.setElement(viewport.document.documentElement);
		return this;
	}

};

Module.LazyLoader = LazyLoader;

})();
