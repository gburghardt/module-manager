function BigModule() {
	this.guid = Math.random();
}

BigModule.prototype.options = {};

BigModule.prototype.init = function(element, options) {
	if (element)
		this.setElement(element);

	if (options)
		this.setOptions(options);

	this.element.innerHTML = "Big!";
	this.element.style.width = "600px";
	this.element.style.height = "600px";
	this.element.style.fontSize = "3em";
	this.element.style.backgroundColor = "#e0ffe0";
};

BigModule.prototype.focus = function() {};

BigModule.prototype.setElement = function(element) {
	this.element = typeof element === "string"
	             ? document.getElementById(element)
	             : element;
};

BigModule.prototype.setOptions = function(options) {
	for (var key in options)
		if (options.hasOwnProperty(key))
			this.options[key] = options[key];
};
