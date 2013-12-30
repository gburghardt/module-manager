Module.FormModule = Module.extend({

	prototype: {

		actions: {
			enterpress: [
				"submit"
			],
			submit: [
				"submit"
			]
		},

		callbacks: {
			beforeReady: [
				"initExtractor",
				"initSerializerFactory"
			]
		},

		extractor: null,

		options: {
			"extractor.allowNulls": false,
			"extractor.flat": false
		},

		serializerFactory: null,

		initExtractor: function initExtractor() {
			this.extractor = this.extractor || new Reaper();
			this.extractor.allowNulls = this.options["extractor.allowNulls"];
			this.extractor.flat = this.options["extractor.flat"];
		},

		initSerializerFactory: function initSerializerFactory() {
			this.serializerFactory = this.serializerFactory || Cerealizer;
		},

		_afterSubmit: function _afterSubmit(xhr) {
			xhr = null;
		},

		_beforeSubmit: function _beforeSubmit(data, event, element, params) {
			data = event = element = params = null;
			return true;
		},

		_getData: function _getData() {
			return this.extractor.getData(this.element);
		},

		_getTransport: function _getTransport() {
			return new XMLHttpRequest();
		},

		_sendRequest: function _sendRequest(data) {
			var xhr = this._getTransport(),
			    form = this.element.getElementsByTagName("form")[0] || this.element,
			    method      = (form.getAttribute("method") || form.getAttribute("data-form-method") || "POST").toUpperCase(),
			    url         = form.getAttribute("action")  || form.getAttribute("data-form-action"),
			    contentType = form.getAttribute("enctype") || form.getAttribute("data-form-enctype") || "queryString",
			    module = this,
			    serializer = this.serializerFactory.getInstance(contentType),
			    params = serializer.serialize(data);

			if (!url) {
				throw new Error("Missing required attribute: action or data-form-action");
			}

			var onreadystatechange = function() {
				if (this.readyState !== 4) {
					return;
				}

				if (this.status < 300 || this.status > 399) {
					module.element.innerHTML = this.responseText;
					complete();
				}
			};

			var complete = function() {
				module._loaded();
				module._afterSubmit(xhr);
				module = data = event = element = params = xhr = xhr.onreadystatechange = form = null;
			};

			if (method === "GET") {
				url += /\?/.test(url) ? params : "?" + params;
				params = null;
			}

			xhr.open(method, url, true);
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

			if (contentType) {
				xhr.setRequestHeader("Content-Type", contentType);
			}

			this._loading();
			xhr.onreadystatechange = onreadystatechange;
			xhr.send(params);
		},

		submit: function submit(event, element, params) {
			event.stop();

			var data = this._getData();

			if (this._beforeSubmit(data, event, element, params)) {
				this._sendRequest(data);
			}
		}

	}

});
