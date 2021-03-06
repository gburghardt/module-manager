function WelcomeModule() {
	this.guid = new Date().getTime();
}

WelcomeModule.prototype.options = {
	backgroundColor: "#f0f0f0"
};

WelcomeModule.prototype.init = function(element, options) {
	if (element)
		this.setElement(element);

	if (options)
		this.setOptions(options);

	this.element.innerHTML = "Welcome!";
	this.element.style.backgroundColor = this.options.backgroundColor;
};

WelcomeModule.prototype.focus = function(anything) {
	var element = (anything)
	            ? this.element.querySelector("a, button, input, select, textarea")
	            : this.element.querySelector("input, select, textarea");

	if (element) {
		element.focus();

		if (element.select)
			element.select();
	}
};

WelcomeModule.prototype.setElement = function(element) {
	this.element = typeof element === "string"
	             ? document.getElementById(element)
	             : element;
};

WelcomeModule.prototype.setOptions = function(options) {
	for (var key in options)
		if (options.hasOwnProperty(key))
			this.options[key] = options[key];
};
