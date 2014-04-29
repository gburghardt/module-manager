describe("Module.Provider", function() {

	var provider,
	    factory,
	    module,
	    element,
	    metadata,
	    manager;

	function TestFactory() {};
	TestFactory.prototype.getInstance = function() {};

	function TestModule() {};

	TestModule.prototype.init = function(element, options) {
		if (element)
			this.setElement(element);
		if (options)
			this.setOptions(options);

		return this;
	};

	TestModule.prototype.setElement = function(element) {
		this.element = element;
	};

	TestModule.prototype.setOptions = function(options) {
		this.options = options;
	};

	beforeEach(function() {
		provider = new Module.Provider();
		provider.moduleObserver = Module.Manager.prototype.moduleObserver;
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
			spyOn(module, "setElement").and.callThrough();
			spyOn(module, "setOptions").and.callThrough();
			factory = new TestFactory();
			spyOn(factory, "getInstance").and.returnValue(module);
			provider.factory = factory;
			spyOn(provider.moduleObserver, "onModuleCreated");
			element = document.createElement("div");
			provider.manager = {
				setDefaultModule: function() {}
			};
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

		it("sets the default module on the manager", function() {
			var options = { defaultModule: true };

			spyOn(provider.manager, "setDefaultModule");

			var newModule = provider.createModule(element, "test", options);

			expect(newModule).toBe(module);
			expect(provider.manager.setDefaultModule).toHaveBeenCalledWith(newModule);
		});

		it("creates sub modules", function() {
			spyOn(provider, "_createSubModules");
			provider.createModule(element, "test", {});

			expect(provider._createSubModules).toHaveBeenCalledWith(module);
		});

		it("calls onModuleCreated on the moduleObserver", function() {
			provider.createModule(element, "test", {});
			expect(provider.moduleObserver.onModuleCreated).toHaveBeenCalledWith(module, element, "test");
		});

		describe("does not create sub modules if", function() {

			beforeEach(function() {
				spyOn(provider, "_createSubModules");
			})

			it("provider.subModulesEnabled is false", function() {
				provider.subModulesEnabled = false;
				provider.createModule(element, "test", {});

				expect(provider._createSubModules).not.toHaveBeenCalled();
			});

			it("options.subModulesDisabled is true", function() {
				provider.createModule(element, "test", { subModulesDisabled: true });

				expect(provider._createSubModules).not.toHaveBeenCalled();
			});

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

	describe("_createSubModules", function() {

		beforeEach(function() {
			spyOn(provider, "_createSubModuleProperty");
			element = document.createElement("div");
			module = new TestModule().init(element);
		});

		it("does not create sub module properties if no elements with data-module-property exist", function() {
			element.innerHTML = '<div>Something</div>';
			provider._createSubModules(module);

			expect(provider._createSubModuleProperty).not.toHaveBeenCalled();
		});

		it("creates properties for sub modules when data-module-property exists", function() {
			element.innerHTML = [
				'<div data-module-property="foo"></div>',
				'<div data-module-property="bar"></div>'
			].join("");
			provider._createSubModules(module);

			expect(provider._createSubModuleProperty).toHaveBeenCalledWith(module, "foo", element.childNodes[0]);
			expect(provider._createSubModuleProperty).toHaveBeenCalledWith(module, "bar", element.childNodes[1]);
		});

	});

	describe("_createSubModuleProperty", function() {

		var subModule;

		beforeEach(function() {
			provider.manager = {
				markModulesCreated: function() {}
			};
			element = document.createElement("div");
			element.setAttribute("data-modules", "TestModule");
			module = new TestModule();
			subModule = new TestModule();
			spyOn(subModule, "init");
			spyOn(provider, "createModule").and.returnValue(subModule);
		});

		it("throws an error if more than one module type is specified", function() {
			element.setAttribute("data-modules", "Foo Bar");
			module.foo = null;

			expect(function() {
				provider._createSubModuleProperty(module, "foo", element);
			}).toThrow(new Error("Sub module elements cannot have more than one type specified in data-modules"));
		});

		it("sets a single instance property on the parent module", function() {
			module.foo = null;

			provider._createSubModuleProperty(module, "foo", element);

			expect(module.foo).toBe(subModule);
		});

		it("throws an error if the single instance property already exists on the parent module", function() {
			module.foo = {};

			expect(function() {
				provider._createSubModuleProperty(module, "foo", element);
			}).toThrow(new Error("Cannot create sub module property 'foo'. Property is neither null nor an Array on the parent module."));
		});

		it("adds sub module instances to an array property on the parent module", function() {
			TestModule.prototype.tests = [];

			provider._createSubModuleProperty(module, "tests", element);

			expect(module.tests instanceof Array).toBe(true);
			expect(module.tests.length).toBe(1);
			expect(module.tests[0]).toBe(subModule);
			expect(module.tests).not.toBe(TestModule.prototype.tests);
		});

	});

});
