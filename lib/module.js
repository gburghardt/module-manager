// @import Injerit.js
// @import ElementStore
// @import ElementStore.Utils
// @import callbacks
// @import hash
// @import dom_event_delegator
// @import events

(function(g) {

var _guid = 0;

var Module = Object.extend({

	includes: [
		Callbacks.Utils,
		Events.Notifications,
		ElementStore.Utils
	],

	self: {
		manager: null,

		getManager: function getManager() {
			return Module.manager;
		},

		unregister: function unregister(module) {
			if (Module.manager) {
				Module.manager.unregisterModule(module);
			}
		}
	},

	prototype: {

		actions: {
			click: [
				"cancel"
			]
		},

		delegator: null,

		element: null,

		elementStore: {},

		guid: null,

		options: {
			actionPrefix: null
		},

		init: function init(elementOrId, options) {
			this.guid = _guid++;
			this.element = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;

			if (!this.element) {
				throw new Error("Could not find element: " + elementOrId);
			}

			if (!this.hasOwnProperty("options")) {
				this.options = new Hash();
			}

			this._initOptions(this.options);

			if (options) {
				this.options.merge(options);
			}

			if (!this.delegator) {
				this.delegator = new dom.events.Delegator();
			}

			this.delegator.delegate = this;
			this.delegator.node = this.element;

			if (this.options.actionPrefix) {
				this.delegator.setActionPrefix(this.options.actionPrefix);
			}

			this.delegator.init();

			this._initActions();
			this._initCallbacks();
			this._initNotifications();
			this.callbacks.execute("beforeElementStoreInit");
			this.initElementStore(this.element);
			this.callbacks.execute("beforeReady");
			this._ready();
			this.callbacks.execute("afterReady");

			return this;
		},

		destructor: function destructor(keepElement) {
			this.callbacks.execute("beforeDestroy");

			this.constructor.unregister(this);
			this.destroyElementStore();
			this.destroyCallbacks();

			if (this.delegator) {
				this.delegator.destructor();
			}

			if (!keepElement && this.element) {
				this.element.parentNode.removeChild(this.element);
			}

			if (this.options) {
				this.options.destructor();
			}

			this.actions = this.element = this.delegator = this.options = null;
		},

		cancel: function cancel(event, element, params) {
			event.stop();
			this.destructor();
			event = element = params = null;
		},

		focus: function focus(anything) {
			var els = this.element.getElementsByTagName("*");
			var i = 0, length = els.length, el;

			if (anything) {
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
			}
			else {
				for (i; i < length; i++) {
					el = els[i];

					if (el.tagName === "TEXTAREA" || el.tagName === "SELECT" || (el.tagName === "INPUT" && el.type !== "hidden")) {
						if (el.focus) {
							el.focus();
						}

						if (el.select) {
							el.select();
						}

						break;
					}
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
			if (!this.hasOwnProperty("options")) {
				this.options = overrides;
			}
			else {
				this.options.merge(overrides);
			}
		}

	}

});

// Make globally available
g.Module = Module;

})(window);