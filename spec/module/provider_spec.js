describe("Module.Provider", function() {

	var provider,
	    factory,
	    module,
	    element,
	    metadata;

	function TestFactory() {};
	TestFactory.prototype.getInstance = function() {};

	function TestModule() {};
	TestModule.prototype.setElement = function() {};
	TestModule.prototype.setOptions = function() {};

	beforeEach(function() {
		provider = new Module.Provider();
	});

	it("does not require arguments to instantiate", function() {
		expect(provider.factory).toBe(null);
	});

	describe("_createModuleClass", function() {

		it("creates an HTML tag class name based on the module type", function() {
			var types = [
				"foo",
				"FooModule",
				"A.B.C.SomethingModule",
				"BigFatName"
			];
			var classNames = [
				"module foo",
				"module foo",
				"module a-b-c-something",
				"module bigFatName"
			];

			for (var i = 0, length = types.length; i < length; i++) {
				expect(provider._createModuleClass(types[i])).toBe(classNames[i]);
			}
		});

	});

	describe("createModule", function() {

		beforeEach(function() {
			module = new TestModule();
			spyOn(module, "setElement");
			spyOn(module, "setOptions");
			factory = new TestFactory();
			spyOn(factory, "getInstance").and.returnValue(module);
			provider.factory = factory;
			element = document.createElement("div");
		});

		it("gets the module instance from the factory", function() {
			var x = provider.createModule(element, "test", {});

			expect(factory.getInstance).toHaveBeenCalledWith("test");
			expect(x).toBe(module);
		});

		it("sets the element and options", function() {
			var options = {};
			var x = provider.createModule(element, "test", options);

			expect(module.setElement).toHaveBeenCalledWith(element);
			expect(module.setOptions).toHaveBeenCalledWith(options);
		});

		it("sets the class name on the element", function() {
			var x = provider.createModule(element, "test", {});

			expect(element.className).toBe("module test");
		});

	});

	describe("createModules", function() {

		beforeEach(function() {
			module = new TestModule();
			spyOn(provider, "createModule").and.returnValue(module);
			element = document.createElement("div");
		});

		it("does not require a callback", function() {
			element.setAttribute("data-modules", "TestModule");
			metadata = new Module.MetaData(element);
			var modules = provider.createModules(metadata);

			expect(modules).toEqual([module]);
			expect(provider.createModule).toHaveBeenCalledWith(element, "TestModule", {});
		});

		it("allows a callback", function() {
			element.setAttribute("data-modules", "TestModule");
			metadata = new Module.MetaData(element);
			var context = {};
			var callback = jasmine.createSpy("forEach", function() {
				expect(this).toBe(context);
			});

			provider.createModules(metadata, callback, context);

			expect(callback).toHaveBeenCalledWith(module, element, "TestModule", {});
		});

		it("returns the list of modules created", function() {
			var a = new TestModule(), b = new TestModule();

			provider.factory = {
				getInstance: function(type) {
					return (type === "a") ? a : b;
				}
			};

			element.setAttribute("data-modules", "a b");
			metadata = new Module.MetaData(element);

			var modules = provider.createModules(metadata);

			expect(modules).toEqual([a, b]);
		});

	});

});
