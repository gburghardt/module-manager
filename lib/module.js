'import Hash';
'import dom.events.Delegator';

function Module() {
	
}

Module.prototype = {

	actions: null,

	element: null,

	options: null,

	init: function init(elementOrId) {
		this.actions = new Module.Actions();
		this.options = new Hash();
		this.element = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;

		if (!this.element) {
			throw new Error("Could not find element: " + elementOrId);
		}

		this._registerActions(this.actions);
		this._registerOptions(this.options);



		return this;
	},

	_registerActions: function _registerActions(actions) {

	},

	_registerOptions: function _registerOptions(options) {

	},

	setOptions: function setOptions(overrides) {
		this.options.merge(overrides);
	}

}

/*

Notes:

- Can use dependency injection

*/