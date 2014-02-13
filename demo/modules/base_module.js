function BaseModule() {
	this.guid = BaseModule.getGUID();
	this.options = {};
}

BaseModule.getGUID = (function() {
	var guid = 0;

	return function getGUID() {
		return guid++;
	}
})();

BaseModule.prototype.init = function(element, options) {
	if (element)
		this.setElement(element);

	if (options)
		this.setOptions(options);
};

BaseModule.prototype.focus = function(anything) {
	var element = (anything)
	            ? this.element.querySelector("a, button, input, select, textarea")
	            : this.element.querySelector("input, select, textarea");

	if (element) {
		element.focus();

		if (element.select)
			element.select();
	}
};

BaseModule.prototype.setElement = function(element) {
	this.element = typeof element === "string"
	             ? document.getElementById(element)
	             : element;
};

BaseModule.prototype.setOptions = function(options) {
	for (var key in options)
		if (options.hasOwnProperty(key))
			this.options[key] = options[key];
};
