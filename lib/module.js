'using Function';
'using Callbacks';
'using Hash';
'using dom.events.Delegator';

var Module = Object.extend({

	includes: [
		Object.Utils,
		Callbacks.Utils
	],

	prototype: {

		actions: {},

		delegator: null,

		element: null,

		options: {
			actionPrefix: null
		},

		init: function init(elementOrId) {
			this.element = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;

			if (!this.element) {
				throw new Error("Could not find element: " + elementOrId);
			}

			if (!this.hasOwnProperty("options")) {
				this.options = new Hash();
			}

			if (!this.delegator) {
				this.delegator = new dom.events.Delegator();
			}

			this._initOptions(this.options);

			this.delegator.delegate = this;
			this.delegator.node = this.element;

			if (this.options.actionPrefix) {
				this.delegator.setActionPrefix(this.options.actionPrefix);
			}

			this.delegator.init();

			this._initActions();
			this._initCallbacks();
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

		_initActions: function _initActions() {
			var actions = new Hash(), proto = this.__proto__;

			while (proto) {
				if (proto.hasOwnProperty("actions")) {
					actions.safeMerge(proto.actions);
				}

				proto = proto.__proto__;
			}

			this.delegator.setEventActionMapping(actions);
		},

		_initCallbacks: function _initCallbacks() {
			var types = new Hash(), proto = this.__proto__;

			while (proto) {
				if (proto.hasOwnProperty("callbacks")) {
					types.safeMerge(proto.callbacks);
				}

				proto = proto.__proto__;
			}

			this.initCallbacks(types);
		},

		_initOptions: function _initOptions() {
			var proto = this.__proto__;

			while (proto) {
				if (proto.hasOwnProperty("options")) {
					this.options.safeMerge(proto.options);
				}

				proto = proto.__proto__;
			}
		},

		setOptions: function setOptions(overrides) {
			this.options.merge(overrides);
		}
	}

});
