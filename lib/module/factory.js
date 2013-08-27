// @requires module.js

Module.Factory = function Factory() {};

Module.Factory.prototype = {

	objectFactory: null,

	constructor: Module.Factory,

	createInstance: function createInstance(element, type, options) {
		var module = this.getInstance(type);

		module.init(element, options);

		return module;
	},

	getInstance: function getInstance(type) {
		var instance = null;

		if (this.objectFactory) {
			instance = this.objectFactory.getInstance(type);
		}
		else if (/^[a-zA-Z][a-zA-Z0-9.][a-zA-Z0-9]+$/.test(type)) {
			var Klass = eval(type);
			instance = new Klass();
		}
		else {
			throw new Error("Cannot instantiate invalid type: " + type);
		}

		return instance;
	}

};
