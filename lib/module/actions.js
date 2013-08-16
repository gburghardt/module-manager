Module.Actions = function Actions() {
	this._actions = {};
};

Module.Actions.prototype = {

	_actions: null,

	add: function add(eventName, actionNames) {
		actionNames = actionNames instanceof Array ? actionNames : [actionNames];

		if (!this._actions[eventName]) {
			this._actions[eventName] = [];
		}

		this._actions[eventName].push.apply(this._actions[eventName], actionNames);
	},

	remove: function remove(eventName, actionNames) {
		if (!this._actions[eventName]) {
			return;
		}

		actionNames = actionNames instanceof Array ? actionNames : [actionNames];
		var i, length, j;
		var actionNames = this._actions[eventName];

		for (i = 0, length = actionNames.length; i < length; i++) {
			j = this._
		}
	}

};
