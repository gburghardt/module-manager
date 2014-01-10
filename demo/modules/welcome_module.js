var WelcomeModule = Module.extend({
	prototype: {
		options: {
			backgroundColor: "#f0f0f0"
		},

		_ready: function() {
			Module.prototype._ready.call(this);
			this.element.innerHTML = "Welcome!";
			this.element.style.backgroundColor = this.options.backgroundColor;
		}
	}
});
