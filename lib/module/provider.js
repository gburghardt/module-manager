(function(Module) {

	function Provider() {}

	Provider.prototype = {

		factory: null,

		manager: null,

		constructor: Provider,

		destructor: function destructor(cascadeDestroy) {
			if (cascadeDestroy && this.factory) {
				this.factory.destructor();
			}

			this.factory = this.manager = null;
		},

		_createModuleClass: function _createModuleClass(type) {
			return "module " + type.charAt(0).toLowerCase() + type.slice(1, type.length)
				.replace(/(\.[A-Z])/g, function(match, $1) {
					return "-" + $1.replace(/\./g, "").toLowerCase();
				})
				.replace(/Module$/, "")
				.replace(/^\s+|\s+$/g, "");
		},

		createModule: function createModule(element, type, options) {
			var module = this.factory.getInstance(type);
			var className = this._createModuleClass(type);

			element.className += element.className ? " " + className : className;

			module.setElement(element);
			module.setOptions(options);

			if (options.defaultModule) {
				this.manager.setDefaultModule(module);
			}

			return module;
		},

		createModules: function createModule(metaData, callback, context) {
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
		}

	};

	Module.Provider = Provider;

})(window.Module || {});
