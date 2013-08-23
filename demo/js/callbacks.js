function Callbacks(context) {
	if (context) {
		this._context = context;
		this._types = {};
	}
}

Callbacks.prototype = {

	_context: null,

	_types: null,

	add: function add(name, method) {
		if (!this._types[name]) {
			this._types[name] = [];
		}

		this._types[name].push(method);
	},

	execute: function execute(name) {
		if (!this._types[name]) {
			return true;
		}

		var args = Array.prototype.splice.call(arguments, 1, arguments.length);
		var method, i = 0, length = this._types[name].length;
		var success = true;

		for (i; i < length; i++) {
			method = this._types[name][i];

			if (!this._context[method]) {
				throw new Error("No callback method found: " + method);
			}

			if (this._context[method].apply(this._context, args) === false) {
				success = false;
				break;
			}
		}

		return success;
	},

	remove: function remove(name, method) {
		if (!this._types[name]) {
			return;
		}

		var i = 0, length = this._types[name].length, m;

		for (i; i < length; i++) {
			if (method === this._types[name][i]) {
				this._types[name].splice(i, 1);
				break;
			}
		}
	}

};
