(function() {

	function MetaData(element) {
		this.options = null;
		this.types = [];

		if (element) {
			this.setElement(element);
		}
	}

	MetaData.prototype = {

		element: null,

		options: null,

		types: null,

		constructor: MetaData,

		forEach: function forEach(callback, context) {
			var i = 0, length = this.types.length,
			    result, type, options;

			if (length === 1) {
				callback.call(context, this.element, this.types[0], this.options, 0, this);
			}
			else {
				for (i; i < length; ++i) {
					type = this.types[i];
					options = this.options[type] || {};
					result = callback.call(context, this.element, type, options, i, this);

					if (result === false) {
						break;
					}
				}
			}
		},

		setElement: function setElement(element) {
			this.element = element;

			var types = element.getAttribute("data-modules"),
			    options = element.getAttribute("data-module-options"),
			    length;

			if (!types) {
				throw new Error("Missing required attribute data-modules on " + element.nodeName + "." + element.className.split(/\s+/g).join(".") + "#" + element.id);
			}

			this.types = types
				.replace(/^\s+|\s+$/g, "")
				.split(/\s+/g);

			this.options = options ? JSON.parse(options) : {};
		}

	};

	Module.MetaData = MetaData;

})(window.Module || {});
