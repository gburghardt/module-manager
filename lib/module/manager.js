// @requires module.js
// @requires module/factory.js
// @import dom_event_delegator

Module.Manager = function Manager() {};

Module.Manager.prototype = {

	actionPrefix: "moduleFactory",

	_delegator: null,

	_factory: null,

	_registry: null,

	_groups: null,

	constructor: Module.Manager,

	init: function init(element) {
		this._factory = this._factory || new Module.Factory();
		this._registry = this._registry || {};
		this._groups = this._groups || {};
		this._delegator = new dom.events.Delegator(this, element, this.actionPrefix);

		// TODO: How to handle lazy loading modules after domload?

		Module.manager = this;

		this._initModules(element);

		return this;
	},

	_initModules: function _initModules(element) {
		var els = element.getElementsByTagName("*"), i = 0, length = els.length;

		for (i; i < length; i++) {
			if (els[i].getAttribute("data-modules")) {
				this.createModules(els[i]);
			}
		}

		element = els = null;
	},

	create: function create(event, element, params) {
		event.preventDefault();

		this.createModules(element);

		// Prevent later events from re-instantiating the same modules
		element.removeAttribute("data-action");
		element.removeAttribute("data-action-" + event.type);

		event = element = params = null;
	},

	createModules: function createModules(element) {
		var types = element.getAttribute("data-modules");
		var options = element.getAttribute("data-module-options");
		var i = 0, length = 0, type, module, opts;

		if (!types) {
			throw new Error("Missing required attribute data-modules on " + element.nodeName + "." + element.className.split(/\s+/g).join(".") + "#" + element.id + ")");
		}

		types = types.replace(/^\s+|\s+$/g, "").split(/\s+/g);
		length = types.length;
		options = (options) ? JSON.parse(options) : {};

		if (length === 1) {
			module = this._factory.createInstance(element, types[0], options);
			this.registerModule(types[0], module);
		}
		else {
			for (i = 0, length = types.length; i < length; i++) {
				type = types[i];
				opts = options[type];
				module = this._factory.createInstance(element, type, opts);
				this.registerModule(type, module);
			}
		}

		element.setAttribute("data-modules-created", types);
		element.removeAttribute("data-modules");

		element = module = opts = options = null;
	},

	registerModule: function registerModule(type, module) {
		if (this._registry[module.guid]) {
			throw new Error("Module " + module.guid + " has already been registered");
		}

		this._registry[module.guid] = {module: module, type: type};

		if (!this._groups[type]) {
			this._groups[type] = [];
		}

		this._groups[type].push(module);

		module = null;
	},

	unregisterModule: function unregisterModule(module) {
		if (!this._registry[module.guid]) {
			module = null;
			return;
		}

		var guid = module.guid;
		var type = this._registry[guid].type;
		var group = this._groups[type];

		this._registry[guid].module = null;
		this._registry[guid] = null;
		delete this._registry[guid];

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
