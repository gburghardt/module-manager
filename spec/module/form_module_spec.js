describe("Module.FormModule", function() {

	function MockEvent() {}

	MockEvent.prototype = {
		target: null,
		constructor: MockEvent,
		stop: function() {}
	};

	describe("submit", function() {

		beforeEach(function() {
			this.element = document.createElement("div");
			this.module = new Module.FormModule();
			this.module.init(this.element);
			this.event = new MockEvent();
			this.event.target = this.element;
			this.params = {};
		});

		it("stops the event", function() {
			spyOn(this.event, "stop");
			spyOn(this.module, "_sendRequest");

			this.module.submit(this.event, this.element, this.params);

			expect(this.event.stop).toHaveBeenCalled();
		});

		it("triggers the _beforeSubmit method and sends the request if _beforeSubmit returns true", function () {
			var data = {};
			spyOn(this.module, "_sendRequest");
			spyOn(this.module, "_beforeSubmit").and.returnValue(true);
			spyOn(this.module, "_getData").and.returnValue(data);

			this.module.submit(this.event, this.element, this.params);

			expect(this.module._beforeSubmit).toHaveBeenCalledWith(data, this.event, this.element, this.params);
			expect(this.module._sendRequest).toHaveBeenCalledWith(data);
		});

		it("does not send the request if _beforeSubmit returns false", function() {
			var data = {};
			spyOn(this.module, "_sendRequest");
			spyOn(this.module, "_beforeSubmit").and.returnValue(false);
			spyOn(this.module, "_getData").and.returnValue(data);

			this.module.submit(this.event, this.element, this.params);

			expect(this.module._beforeSubmit).toHaveBeenCalledWith(data, this.event, this.element, this.params);
			expect(this.module._sendRequest).not.toHaveBeenCalled();
		});

	});

	describe("_sendRequest", function() {

		describe("preparing the request", function() {

			beforeEach(function() {
				this.xhr = new XMLHttpRequest();
				this.module = new Module.FormModule();
				this.event = new MockEvent();
				this.params = {};

				spyOn(this.module, "_getTransport").and.returnValue(this.xhr);
				spyOn(this.xhr, "open");
				spyOn(this.xhr, "setRequestHeader");
				spyOn(this.xhr, "send");
			});

			describe("when the root element is a <form> tag", function() {

				beforeEach(function() {
					this.element = document.createElement("form");
					this.module.init(this.element);
					this.event.target = this.element;
				});

				it("takes the request information from the default <form> tag attributes", function() {
					var data = { id: 123 };

					this.element.setAttribute("action", "/test");
					this.element.setAttribute("method", "post");
					this.element.setAttribute("enctype", "application/x-www-form-urlencoded");

					this.module._sendRequest(data);

					expect(this.xhr.open).toHaveBeenCalledWith("POST", "/test", true);
					expect(this.xhr.setRequestHeader).toHaveBeenCalledWith("X-Requested-With", "XMLHttpRequest");
					expect(this.xhr.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/x-www-form-urlencoded");
					expect(this.xhr.send).toHaveBeenCalledWith("id=123");
				});

				it("takes the request information from the data-form-* attributes", function() {
					var data = { id: 123 };

					this.element.setAttribute("data-form-action", "/test");
					this.element.setAttribute("data-form-method", "post");
					this.element.setAttribute("data-form-enctype", "application/x-www-form-urlencoded");

					this.module._sendRequest(data);

					expect(this.xhr.open).toHaveBeenCalledWith("POST", "/test", true);
					expect(this.xhr.setRequestHeader).toHaveBeenCalledWith("X-Requested-With", "XMLHttpRequest");
					expect(this.xhr.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/x-www-form-urlencoded");
					expect(this.xhr.send).toHaveBeenCalledWith("id=123");
				});

			});

			describe("when a <form> tag exists inside the root element", function() {

				beforeEach(function() {
					this.element = document.createElement("div");
					this.form = document.createElement("form");
					this.element.appendChild(this.form);
					this.module.init(this.element);
					this.event.target = this.element;
				});

				it("takes the request information from the <form> tag", function() {
					var data = { id: 123 };

					this.form.setAttribute("action", "/test");
					this.form.setAttribute("method", "put");
					this.form.setAttribute("enctype", "application/x-www-form-urlencoded");

					this.module._sendRequest(data);

					expect(this.xhr.open).toHaveBeenCalledWith("PUT", "/test", true);
					expect(this.xhr.setRequestHeader).toHaveBeenCalledWith("X-Requested-With", "XMLHttpRequest");
					expect(this.xhr.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/x-www-form-urlencoded");
					expect(this.xhr.send).toHaveBeenCalledWith("id=123");
				});

				it("takes the request information from data-form-* HTML 5 attributes", function() {
					var data = { id: 123 };

					this.form.setAttribute("data-form-action", "/test");
					this.form.setAttribute("data-form-method", "put");
					this.form.setAttribute("data-form-enctype", "application/x-www-form-urlencoded");

					this.module._sendRequest(data);

					expect(this.xhr.open).toHaveBeenCalledWith("PUT", "/test", true);
					expect(this.xhr.setRequestHeader).toHaveBeenCalledWith("X-Requested-With", "XMLHttpRequest");
					expect(this.xhr.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/x-www-form-urlencoded");
					expect(this.xhr.send).toHaveBeenCalledWith("id=123");
				});

			});

			describe("when there is no <form> tag", function() {

				beforeEach(function() {
					this.element = document.createElement("div");
					this.module.init(this.element);
					this.event.target = this.element;
				});

				it("takes the request information from data-form-* HTML 5 attributes", function() {
					var data = { id: 123 };

					this.element.setAttribute("data-form-action", "/test");
					this.element.setAttribute("data-form-method", "post");
					this.element.setAttribute("data-form-enctype", "application/x-www-form-urlencoded");

					this.module._sendRequest(data);

					expect(this.xhr.open).toHaveBeenCalledWith("POST", "/test", true);
					expect(this.xhr.setRequestHeader).toHaveBeenCalledWith("X-Requested-With", "XMLHttpRequest");
					expect(this.xhr.setRequestHeader).toHaveBeenCalledWith("Content-Type", "application/x-www-form-urlencoded");
					expect(this.xhr.send).toHaveBeenCalledWith("id=123");
				});

			});

		});

		describe("replaces the HTML of the rot element", function() {

			beforeEach(function() {
				this.module = new Module.FormModule();
				this.element = document.createElement("div");
				this.element.innerHTML = '<form action="/posts/create" method="post"></form>';
				this.module.init(this.element);
				this.xhr = new MockingBird.XMLHttpRequest();

				spyOn(this.module, "_getTransport").and.returnValue(this.xhr);
				spyOn(this.module, "_afterSubmit");
				spyOn(this.module, "_loading");
				spyOn(this.module, "_loaded");
			});

			it("for successfull requests", function() {
				this.xhr
					.returnsStatus(201)
					.returnsBody('<form action="/posts/123" method="post"></form>');

				this.module._sendRequest({});

				expect(this.module._loading).toHaveBeenCalled();
				expect(this.module._loaded).toHaveBeenCalled();
				expect(this.element.innerHTML).toBe('<form action="/posts/123" method="post"></form>');
				expect(this.module._afterSubmit).toHaveBeenCalledWith(this.xhr);
			});

			it("for 404 requests", function() {
				this.xhr
					.returnsStatus(404)
					.returnsBody('<p>Not found</p>');

				this.module._sendRequest(null);

				expect(this.module._loading).toHaveBeenCalled();
				expect(this.module._loaded).toHaveBeenCalled();
				expect(this.element.innerHTML).toBe('<p>Not found</p>');
				expect(this.module._afterSubmit).toHaveBeenCalledWith(this.xhr);
			});

			it("for 5xx requests", function() {
				this.xhr
					.returnsStatus(500)
					.returnsBody('<p>A server error occurred</p>');

				this.module._sendRequest(null);

				expect(this.module._loading).toHaveBeenCalled();
				expect(this.module._loaded).toHaveBeenCalled();
				expect(this.element.innerHTML).toBe('<p>A server error occurred</p>');
				expect(this.module._afterSubmit).toHaveBeenCalledWith(this.xhr);
			});

		});

	});

});
