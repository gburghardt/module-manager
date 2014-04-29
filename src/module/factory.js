(function() {

function Factory() {};

Factory.prototype = {

	objectFactory: null,

	constructor: Factory,

	destructor: function destructor() {
		this.objectFactory = null;
	},

	getInstance: function getInstance(type) {
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
