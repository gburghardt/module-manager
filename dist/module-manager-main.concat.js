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
