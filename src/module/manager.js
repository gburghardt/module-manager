(function(Module) {

	function Manager() {};

	Manager.prototype = {

		baseClassName: "module",

		defaultModule: null,

		defaultModuleFocused: false,

		provider: null,

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

			if (this.provider) {
				if (cascadeDestroy) {
					this.provider.destructor();
				}

				this.provider = null;
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

		init: function init() {
			this.provider = this.provider || new Module.Provider();
			this.provider.factory = this.provider.factory || new Module.Factory();
			this.provider.manager = this;
			this.registry = this.registry || {};
			this.groups = this.groups || {};

			Module.manager = this;

			return this;
		},

		eagerLoadModules: function eagerLoadModules(element) {
			var els = element.getElementsByTagName("*"), i = 0, length = els.length, el;

			for (i; i < length; i++) {
				el = els[i];

				if (el.getAttribute("data-modules") && !el.getAttribute("data-module-lazyload")) {
					this.createModules(el);
				}
			}

			els = null;

			return this;
		},

		createModule: function createModule(element, type, options, register) {
			var module = this.provider.createModule(element, type, options);

			if (register) {
				this.registerModule(type, module);
			}

			element = options = null;

			return module;
		},

		createModules: function createModules(element) {
			if (!element) {
				throw new Error("Missing required argument: element");
			}

			var metaData = new Module.MetaData(element);

			this.provider.createModules(metaData, function(module, element, type, options) {
				this.registerModule(type, module);
				module.init();
			}, this);

			this.markModulesCreated(element, metaData);

			metaData = element = null;
		},

		focusDefaultModule: function focusDefaultModule(anything) {
			if (this.defaultModule && !this.defaultModuleFocused) {
				this.defaultModuleFocused = true;
				this.defaultModule.focus(anything);
			}
		},

		initModuleInContainer: function initModuleInContainer(element, container, config, template, type, module) {
			var createdAt = new Date();
			var renderData = new Hash({
				guid: module.guid,
				createdAt: createdAt,
				timestamp: createdAt.getTime()
			});

			if (config.renderData) {
				renderData.merge(config.renderData);
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
		},

		markModulesCreated: function markModulesCreated(element, metaData) {
			element.setAttribute("data-modules-created", metaData.types.join(" "));
			element.removeAttribute("data-modules");
			element = metaData = null;
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
		},

		setDefaultModule: function setDefaultModule(module) {
			if (!this.defaultModule) {
				this.defaultModule = module;
			}

			module = null;
		}

	};

	Module.Manager = Manager;

})(window.Module || {});
