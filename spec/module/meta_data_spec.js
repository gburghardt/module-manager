describe("Module.MetaData", function() {

	// test variables
	var metadata,
	    element,
	    callback;

	it("requires no arguments to create a new instance", function() {
		metadata = new Module.MetaData();

		expect(metadata.element).toBe(null);
		expect(metadata.types.length).toBe(0);
		expect(metadata.options).toBe(null);
	});

	it("takes an HTML element as an argument when creating a new instance", function() {
		element = document.createElement("div");
		element.setAttribute("data-modules", "FooModule");
		metadata = new Module.MetaData(element);

		expect(metadata.types).toEqual(["FooModule"]);
		expect(metadata.options).toEqual({});
	});

	describe("setElement", function() {

		beforeEach(function() {
			element = document.createElement("div");
			element.className = "foo";
			element.id = "bar";
			metadata = new Module.MetaData();
		});

		it("throws an error if the data-modules attribute is missing", function() {
			expect(function() {
				metadata.setElement(element);
			}).toThrow(new Error("Missing required attribute data-modules on DIV.foo#bar"));
		});

		it("creates an array of types from the data-modules attribute", function() {
			element.setAttribute("data-modules", "  FooModule Bar.FooModule  ");
			metadata.setElement(element);

			expect(metadata.types).toEqual(["FooModule", "Bar.FooModule"]);
		});

		it("sets the options to an empty object if there is no data-module-options attribute", function() {
			element.setAttribute("data-modules", "FooModule");
			metadata.setElement(element);

			expect(metadata.options).toEqual({});
		});

		it("parses the value of the data-module-options attribute", function() {
			element.setAttribute("data-modules", "FooModule");
			element.setAttribute("data-module-options", '{"foo":"bar"}');
			metadata.setElement(element);

			expect(metadata.options).toEqual({foo: "bar"});
		});

	});

	describe("forEach", function() {

		beforeEach(function() {
			element = document.createElement("div");
			element.setAttribute("data-modules", "FooModule");
			metadata = new Module.MetaData();
		});

		it("just takes a callback function", function() {
			callback = jasmine.createSpy("forEach", function() {
				expect(this).toBe(window);
			});
			metadata.setElement(element);
			metadata.forEach(callback);

			expect(callback).toHaveBeenCalled();
		});

		it("takes a callback and a context", function() {
			var context = {};
			callback = jasmine.createSpy("forEach", function() {
				expect(this).toBe(context);
			});
			metadata.setElement(element);
			metadata.forEach(callback, context);

			expect(callback).toHaveBeenCalled();
		});

		it("callbacks receive the element, current type, current options, index, and the metadata object", function() {
			callback = jasmine.createSpy("forEach", function() {});
			metadata.setElement(element);
			metadata.forEach(callback);

			expect(callback)
				.toHaveBeenCalledWith(element, "FooModule", {}, 0, metadata);
		});

		it("callbacks receive the options for a specific type", function() {
			callback = jasmine.createSpy("forEach", function() {});
			element.setAttribute("data-modules", "FooModule Bar.FooModule");
			element.setAttribute("data-module-options", '{"FooModule":{"id":1}}');
			metadata.setElement(element);
			metadata.forEach(callback);

			expect(callback)
				.toHaveBeenCalledWith(element, "FooModule", {id: 1}, 0, metadata);

			expect(callback)
				.toHaveBeenCalledWith(element, "Bar.FooModule", {}, 1, metadata);
		});

		it("callbacks receive options for only one type", function() {
			element.setAttribute("data-module-options", '{"id":1}');
			metadata.setElement(element);
			metadata.forEach(callback);

			expect(callback)
				.toHaveBeenCalledWith(element, "FooModule", {id: 1}, 0, metadata);
		});

	});

});
