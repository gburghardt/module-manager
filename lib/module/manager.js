// @requires module/factory.js

window.Module = window.Module || {};

Module.Manager = function Manager() {};

Module.Manager.prototype = {

	actionPrefix: "moduleFactory",

	element: null,

	factory: null,

	registry: null,

	groups: null,

	constructor: Module.Manager,

	destructor: function destructor(cascadeDestroy) {
		if (Module.manager === this) {
			Module.manager = null;
		}

		if (this.registry) {
			this._destroyRegistry(cascadeDestroy);
		}

		if (this.groups) {
			this._destroyGroups();
		}

		if (this.factory) {
			if (cascadeDestroy) {
				this.factory.destructor();
			}

			this.factory = null;
		}
	},

	_destroyGroups: function _destroyGroups() {
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

	_destroyRegistry: function _destroyRegistry(cascadeDestroy) {
		var key, entry;

		for (key in this.registry) {
			if (this.registry.hasOwnProperty(key)) {
				entry = this.registry[key];

				if (cascadeDestroy) {
					entry.module.destructor(true);
				}

				entry.module = null;
				this.registry[key] = null;
			}
		}

		this.registry = null;
	},

	init: function init(element) {
		this.element = element;
		this.factory = (this.hasOwnProperty("factory")) ? this.factory : new Module.Factory();
		this.registry = (this.hasOwnProperty("registry")) ? this.registry : {};
		this.groups = (this.hasOwnProperty("groups")) ? this.groups : {};

		Module.manager = this;

		return this;
	},

	eagerLoadModules: function eagerLoadModules() {
		var els = this.element.getElementsByTagName("*"), i = 0, length = els.length;

		for (i; i < length; i++) {
			if (els[i].getAttribute("data-modules")) {
				this.createModules(els[i]);
			}
		}

		els = null;

		return this;
	},

	createModules: function createModules(element) {
		if (!element) {
			throw new Error("Missing required argument: element");
		}

		var types = element.getAttribute("data-modules");
		var options = element.getAttribute("data-module-options");
		var i = 0, length = 0, type, module, opts;

		if (!types) {
			throw new Error("Missing required attribute data-modules on " + element.nodeName + "." + element.className.split(/\s+/g).join(".") + "#" + element.id);
		}

		types = types.replace(/^\s+|\s+$/g, "").split(/\s+/g);
		length = types.length;
		options = (options) ? JSON.parse(options) : {};

		if (length === 1) {
			module = this.factory.createInstance(element, types[0], options);
			this.registerModule(types[0], module);
		}
		else {
			for (i = 0, length = types.length; i < length; i++) {
				type = types[i];
				opts = options[type] || {};
				module = this.factory.createInstance(element, type, opts);
				this.registerModule(type, module);
			}
		}

		element.setAttribute("data-modules-created", types.join(" "));
		element.removeAttribute("data-modules");

		element = module = opts = options = null;
	},

	registerModule: function registerModule(type, module) {
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

		module = null;
	},

	unregisterModule: function unregisterModule(module) {
		if (!module.guid || !this.registry[module.guid]) {
			module = null;
			return;
		}

		var guid = module.guid;
		var type = this.registry[guid].type;
		var group = this.groups[type];

		this.registry[guid].module = null;
		this.registry[guid] = null;
		delete this.registry[guid];

		if (group) {
			for (var i = 0, length = group.length; i < length; i++) {
				if (group[i] === module) {
					group.splice(i, 1);
					break;
				}
			}
		}

		module = group = null;
	}

};
