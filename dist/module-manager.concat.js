/*! module-manager 2014-05-16 */
/*! module-manager 2014-05-16 */
this.Module = this.Module || {};
(function() {

function Factory() {};

Factory.prototype = {

	objectFactory: null,

	constructor: Factory,

	destructor: function() {
		this.objectFactory = null;
	},

	getInstance: function(type) {
		var instance = null, Klass = null;

		if (this.objectFactory) {
			instance = this.objectFactory.getInstance(type);
		}

		if (!instance) {
			if (/^[a-zA-Z][a-zA-Z0-9.]+[a-zA-Z0-9]$/.test(type)) {
				try {
					Klass = eval(type);
				}
				catch (error) {
					throw new Error("Class name " + type + " does not exist");
				}

				if (!Klass) {
					throw new Error("Class name " + type + " does not exist");
				}
				else if (typeof Klass !== "function") {
					throw new Error("Class name " + type + " is not a constructor function");
				}

				instance = new Klass();
			}
			else {
				throw new Error("Cannot instantiate invalid type: " + type);
			}
		}

		return instance;
	}

};

Module.Factory = Factory;

})();

(function() {

function Manager() {};

Manager.prototype = {

	baseClassName: "module",

	defaultModule: null,

	defaultModuleFocused: false,

	moduleObserver: {
		onModuleCreated: function(module, element, type) {},
		onSubModuleCreated: function(module, element, type) {},
		onModuleRegistered: function(module, type) {},
		onModuleUnregistered: function(module) {}
	},

	provider: null,

	registry: null,

	groups: null,

	constructor: Module.Manager,

	destructor: function(cascadeDestroy) {
		if (Module.manager === this) {
			Module.manager = null;
		}

		if (this.registry) {
			this._destroyRegistry(cascadeDestroy);
		}

		if (this.groups) {
			this._destroyGroups();
		}

		if (this.provider) {
			if (cascadeDestroy) {
				this.provider.destructor();
			}

			this.provider = null;
		}

		if (this.lazyLoader) {
			this.lazyLoader.destructor();
			this.lazyLoader = null;
		}
	},

	_destroyGroups: function() {
		var key, group, i, length;

		for (key in this.groups) {
			if (this.groups.hasOwnProperty(key)) {
				group = this.groups[key];

				for (i = 0, length = group.length; i < length; i++) {
					group[i] = null;
				}

				this.groups[key] = null;
			}
		}

		this.groups = null;
	},

	_destroyRegistry: function(cascadeDestroy) {
		var key, entry;

		for (key in this.registry) {
			if (this.registry.hasOwnProperty(key)) {
				entry = this.registry[key];
				this.moduleObserver.onModuleUnregistered(entry.module);

				if (cascadeDestroy) {
					entry.module.destructor(true);
				}

				entry.module = null;
				this.registry[key] = null;
			}
		}

		this.registry = null;
	},

	init: function() {
		this.provider = this.provider || new Module.Provider();
		this.provider.factory = this.provider.factory || new Module.Factory();
		this.provider.manager = this;
		this.provider.moduleObserver = this.moduleObserver;
		this.registry = this.registry || {};
		this.groups = this.groups || {};

		Module.manager = this;

		return this;
	},

	eagerLoadModules: function(element) {
		var els = element.querySelectorAll("[data-modules]"),
			i = 0;

		for (i; i < els.length; i++) {
			this.createModules(els[i]);
		}

		els = null;

		return this;
	},

	lazyLoadModules: function(element, options) {
		this.lazyLoader = (this.lazyLoader || new Module.LazyLoader())
			.setManager(this)
			.setElement(element)
			.setOptions(options)
			.init();

		element = options = null;

		return this;
	},

	createModule: function(element, type, options, register) {
		var module = this.provider.createModule(element, type, options);

		if (register) {
			this.registerModule(type, module);
		}

		element = options = null;

		return module;
	},

	createModules: function(element, lazyLoad) {
		if (!element) {
			throw new Error("Missing required argument: element");
		}
		else if (!lazyLoad && element.getAttribute("data-module-lazyload")) {
			return [];
		}
		else if (element.getAttribute("data-module-property")) {
			return [];
		}

		var metaData = new Module.MetaData(element),
		    modules = [];

		if (metaData.mediaMatches()) {
			this.provider.createModules(metaData, function(module, element, type, options) {
				modules.push(module);
				this.registerModule(type, module);
				module.init();
			}, this);

			this.markModulesCreated(element, metaData);
		}

		metaData = element = null;

		return modules;
	},

	focusDefaultModule: function(anything) {
		if (this.defaultModule && !this.defaultModuleFocused) {
			this.defaultModuleFocused = true;
			this.defaultModule.focus(anything);
		}
	},

	initModuleInContainer: function(element, container, config, template, type, module) {
		var createdAt = new Date();
		var renderData = {
			guid: module.guid,
			createdAt: createdAt,
			timestamp: createdAt.getTime(),
			controllerId: module.controllerId
		}, key;

		if (config.renderData) {
			for (key in config.renderData) {
				if (config.renderData.hasOwnProperty(key)) {
					renderData[key] = config.renderData[key];
				}
			}
		}

		var html = template.innerHTML.replace(/#\{([-.\w]+)\}/g, function(match, key) {
			return renderData[key] || "";
		});

		element.className += (" " + this.baseClassName + " " + config.className).replace(/\s{2,}/g, " ");
		element.innerHTML = html;

		if (config.insert === "top" && container.firstChild) {
			container.insertBefore(element, container.firstChild);
		}
		else {
			container.appendChild(element);
		}

		this.registerModule(type, module);
		module.init();

		if (config.autoFocus) {
			module.focus(!!config.autoFocusAnything);
		}
	},

	markModulesCreated: function(element, metaData) {
		element.setAttribute("data-modules-created", metaData.types.join(" "));
		element.removeAttribute("data-modules");
		element = metaData = null;
	},

	registerModule: function(type, module) {
		if (module.guid === undefined || module.guid === null) {
			throw new Error("Cannot register module " + type + " without a guid property");
		}
		else if (this.registry[module.guid]) {
			throw new Error("Module " + module.guid + " has already been registered");
		}

		this.registry[module.guid] = {module: module, type: type};

		if (!this.groups[type]) {
			this.groups[type] = [];
		}

		this.groups[type].push(module);
		this.moduleObserver.onModuleRegistered(module, type);

		module = null;
	},

	unregisterModule: function(module) {
		if (!module.guid || !this.registry[module.guid]) {
			module = null;
			return false;
		}

		var guid = module.guid,
		    type = this.registry[guid].type,
		    group = this.groups[type],
		    unregistered = false;

		this.registry[guid].module = null;
		this.registry[guid] = null;
		delete this.registry[guid];

		if (group) {
			for (var i = 0, length = group.length; i < length; i++) {
				if (group[i] === module) {
					group.splice(i, 1);
					unregistered = true;
					this.moduleObserver.onModuleUnregistered(module);
					break;
				}
			}
		}

		module = group = null;

		return unregistered;
	},

	setDefaultModule: function(module) {
		if (!this.defaultModule) {
			this.defaultModule = module;
		}

		module = null;
	}

};

Module.Manager = Manager;

})();

(function(g) {

	function MetaData(element) {
		this.options = null;
		this.types = [];

		if (element) {
			this.setElement(element);
		}
	}

	MetaData.prototype = {

		element: null,

		media: null,

		options: null,

		types: null,

		constructor: MetaData,

		forEach: function(callback, context) {
			var i = 0, length = this.types.length,
			    result, type, options;

			if (length === 1) {
				callback.call(context, this.element, this.types[0], this.options, 0, this);
			}
			else {
				for (i; i < length; ++i) {
					type = this.types[i];
					options = this.options[type] || {};
					result = callback.call(context, this.element, type, options, i, this);

					if (result === false) {
						break;
					}
				}
			}
		},

		mediaMatches: function() {
			if (!g.matchMedia) {
				throw new Error("This browser does not support JavaScript media queries. Please include a polyfill (https://github.com/paulirish/matchMedia.js)");
			}

			return this.media === null || g.matchMedia(this.media).matches;
		},

		setElement: function(element) {
			this.element = element;

			var types = element.getAttribute("data-modules"),
			    options = element.getAttribute("data-module-options");

			if (!types) {
				throw new Error("Missing required attribute data-modules on " + element.nodeName + "." + element.className.split(/\s+/g).join(".") + "#" + element.id);
			}

			this.types = types
				.replace(/^\s+|\s+$/g, "")
				.split(/\s+/g);

			this.options = options ? JSON.parse(options) : {};
			this.media = element.getAttribute("data-module-media");
		}

	};

	g.Module.MetaData = MetaData;

})(this);

(function() {

function Provider() {}

Provider.prototype = {

	factory: null,

	manager: null,

	moduleObserver: null,

	subModulesEnabled: true,

	constructor: Provider,

	destructor: function(cascadeDestroy) {
		if (cascadeDestroy && this.factory) {
			this.factory.destructor();
		}

		this.factory = this.manager = null;
	},

	_createModuleClass: function(type) {
		return "module " + type.charAt(0).toLowerCase() + type.slice(1, type.length)
			.replace(/(\.[A-Z])/g, function(match, $1) {
				return "-" + $1.replace(/\./g, "").toLowerCase();
			})
			.replace(/Module$/, "")
			.replace(/^\s+|\s+$/g, "");
	},

	createModule: function(element, type, options) {
		var module = this.factory.getInstance(type);
		var className = this._createModuleClass(type);

		element.className += element.className ? " " + className : className;

		module.setElement(element);
		module.setOptions(options);

		if (options.defaultModule) {
			this.manager.setDefaultModule(module);
		}

		this.moduleObserver.onModuleCreated(module, element, type);

		if (this.subModulesEnabled && !options.subModulesDisabled) {
			this._createSubModules(module);
		}

		return module;
	},

	createModules: function(metaData, callback, context) {
		var modules = [],
		    module,
		    callback = callback || function() {};

		metaData.forEach(function(element, type, options) {
			module = this.createModule(element, type, options);
			modules.push(module);
			callback.call(context, module, element, type, options);
		}, this);

		callback = context = module = null;

		return modules;
	},

	_createSubModules: function(module) {
		var els = module.element.getElementsByTagName("*"),
		    length = els.length,
		    i = 0, element, name;

		for (i; i < length; i++) {
			element = els[i];
			name = element.getAttribute("data-module-property");

			if (name) {
				this._createSubModuleProperty(module, name, element);
			}
		}
	},

	_createSubModuleProperty: function(parentModule, name, element) {
		var metaData = new Module.MetaData(element),
		   subModule;

		if (metaData.types.length > 1) {
			throw new Error("Sub module elements cannot have more than one type specified in data-modules");
		}

		subModule = this.createModule(element, metaData.types[0], metaData.options);
		this.moduleObserver.onSubModuleCreated(subModule, element, metaData.types[0]);
		subModule.init();

		if (parentModule[name] === null) {
			parentModule[name] = subModule;
		}
		else if (parentModule[name] instanceof Array) {
			if (!parentModule.hasOwnProperty(name)) {
				parentModule[name] = [];
			}

			parentModule[name].push(subModule);
		}
		else {
			throw new Error("Cannot create sub module property '" + name + "'. Property is neither null nor an Array on the parent module.");
		}

		this.manager.markModulesCreated(element, metaData);

		subModule = metaData = element = null;
	}

};

Module.Provider = Provider;

})();

/*! module-manager 2014-05-16 */
Module.FrontControllerModuleObserver = function FrontControllerModuleObserver(frontController) {
	this.frontController = frontController || null;
};

Module.FrontControllerModuleObserver.prototype = {

	frontController: null,

	constructor: Module.FrontControllerModuleObserver,

	_ensureControllerId: function(module) {
		module.controllerId = module.controllerId
		                   || module.options.controllerId
		                   || module.guid;
	},

	onModuleCreated: function(module, element, type) {
		this._ensureControllerId(module);
	},

	onSubModuleCreated: function(module, element, type) {
		this.frontController.registerController(module);
	},

	onModuleRegistered: function(module, type) {
		this.frontController.registerController(module);
	},

	onModuleUnregistered: function(module) {
		this.frontController.unregisterController(module);
	}

};
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
