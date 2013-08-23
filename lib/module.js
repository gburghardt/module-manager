'import Callbacks';
'import Hash';
'import dom.events.Delegator';
'import dom.events.DelegatorActions';

function Module() {
	
}

Module.prototype = {

	actions: null,

	callbacks: null,

	delegator: null,

	element: null,

	options: null,

	init: function init(elementOrId) {
		this.element = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;

		if (!this.element) {
			throw new Error("Could not find element: " + elementOrId);
		}

		if (!this.actions) {
			this.actions = new dom.events.DelegatorActions();
		}
		
		if (!this.options) {
			this.options = new Hash();
		}

		if (!this.callbacks) {
			this.callbacks = new Callbacks(this);
		}

		if (!this.delegator) {
			this.delegator = new dom.events.Delegator();
		}

		this._registerActions(this.actions);
		this._registerOptions(this.options);

		this.delegator.delegate = this;
		this.delegator.node = this.element;

		if (this.options.actionPrefix) {
			this.delegator.setActionPrefix(this.options.actionPrefix);
		}

		this.delegator.init();
		this.delegator.setEventActionMapping(this.actions.getMap());

		this._registerCallbacks(this.callbacks);

		this.callbacks.execute("beforeReady");
		this._ready();
		this.callbacks.execute("afterReady");

		return this;
	},

	destructor: function destructor() {
		if (this.delegator) {
			this.delegator.destructor();
		}

		if (this.element) {
			this.element.parentNode.removeChild(this.element);
		}

		if (this.options) {
			this.options.destructor();
		}

		this.actions = this.element = this.delegator = this.options = null;
	},

	focus: function focus() {
		var els = this.element.getElementsByTagName("*");
		var i = 0, length = els.length, el;

		for (i; i < length; i++) {
			el = els[i];

			if (el.tagName === "A" || el.tagName === "BUTTON" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || (el.tagName === "INPUT" && el.type !== "hidden")) {
				if (el.focus) {
					el.focus();
				}

				if (el.select) {
					el.select();
				}

				break;
			}
		}
	},

	_ready: function _ready() {

	},

	_registerActions: function _registerActions(actions) {

	},

	_registerCallbacks: function _registerCallbacks() {

	},

	_registerOptions: function _registerOptions(options) {
		options.merge({
			actionPrefix: null
		});
	},

	setOptions: function setOptions(overrides) {
		this.options.merge(overrides);
	}

}
