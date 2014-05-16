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
