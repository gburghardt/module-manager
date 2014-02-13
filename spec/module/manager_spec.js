describe("Module.Manager", function() {

	var factory, manager, element;

	beforeEach(function() {
		factory = {
			getInstance: function() {}
		};
		spyOn(factory, "getInstance");
		element = document.createElement("div");
		manager = new Module.Manager();
		manager.provider = new Module.Provider();
		manager.provider.factory = factory;
		spyOn(manager.provider, "destructor");
	});

	describe("init", function() {

		describe("to support Dependency Injection and Inversion of Control", function() {

			it("does not instantiate a module factory if one already exists", function() {
				manager.init();
				expect(manager.provider.factory).toBe(factory);
			});

			it("does not instantiate a registry if one already exists", function() {
				var registry = {};
				manager.registry = registry;
				manager.init();
				expect(manager.registry).toBe(registry);
			});

			it("does not instantiate a module groups object if one already exists", function() {
				var groups = {};
				manager.groups = groups;
				manager.init();
				expect(manager.groups).toBe(groups);
			});

			it("sets Module.manager", function() {
				manager.init();
				expect(Module.manager).toBe(manager);
			});

		});

	});

	describe("destructor", function() {

		var module1, module2;

		function TestModule(guid) {
			this.guid = guid;
			spyOn(this, "destructor");
		}
		TestModule.prototype = {
			guid: null,
			constructor: TestModule,
			destructor: function() {}
		};

		beforeEach(function() {
			module1 = new TestModule(0);
			module2 = new TestModule(1);
			manager.init();
			manager.registerModule("a", module1);
			manager.registerModule("b", module2);
		})

		it("nullifies references to Module.manager, groups, provider and registry", function() {
			expect(Module.manager).toBe(manager);

			manager.destructor();

			expect(Module.manager).toBe(null);
			expect(manager.groups).toBe(null);
			expect(manager.registry).toBe(null);
			expect(manager.provider).toBe(null);

			expect(module1.destructor).not.toHaveBeenCalled();
			expect(module2.destructor).not.toHaveBeenCalled();
		});

		it("destroys the module provider and all registered modules", function() {
			expect(Module.manager).toBe(manager);

			manager.destructor(true);

			expect(Module.manager).toBe(null);
			expect(manager.groups).toBe(null);
			expect(manager.registry).toBe(null);
			expect(manager.provider).toBe(null);

			expect(module1.destructor).toHaveBeenCalledWith(true);
			expect(module2.destructor).toHaveBeenCalledWith(true);
		});

	});

	describe("eagerLoadModules", function() {

		it("calls createModules() for each child element with a data-modules attribute", function() {
			spyOn(manager, "createModules");

			element.innerHTML = [
				'<ol>',
					'<li data-modules="Foo Bar"></li>',
					'<li data-modules="Baz"></li>',
				'</ol>',
				'<div data-modules="Bazzing"></div>'
			].join("");

			manager.init();

			var returnValue = manager.eagerLoadModules(element);

			expect(returnValue).toBe(manager);
			expect(manager.createModules).toHaveBeenCalledWith(element.firstChild.childNodes[0]);
			expect(manager.createModules).toHaveBeenCalledWith(element.firstChild.childNodes[1]);
			expect(manager.createModules).toHaveBeenCalledWith(element.childNodes[1]);
			expect(manager.createModules).not.toHaveBeenCalledWith(element.firstChild);
		});

		it("does not call createModules() on elements with a data-module-lazyload attribute", function() {
			spyOn(manager, "createModules");

			element.innerHTML = [
				'<ol>',
					'<li></li>',
					'<li></li>',
				'</ol>',
				'<div data-modules="Bazzing" data-module-lazyload="mouseover"></div>'
			].join("");

			manager.init();
			manager.eagerLoadModules(element);

			expect(manager.createModules).not.toHaveBeenCalled();
		});

	});

	describe("lazyLoadModules", function() {
		xit("should be tested");
	});

	describe("registerModule", function() {

		var _guid = 0, module;

		beforeEach(function() {
			module = {
				guid: _guid++
			};
			manager.init();
		});

		it("registers a new module and adds it to a module group", function() {
			manager.registerModule("testing", module);
			expect(manager.registry[module.guid]).toEqual({module: module, type: "testing"});
			expect(manager.groups.testing instanceof Array).toEqual(true);
			expect(manager.groups.testing.length).toEqual(1);
			expect(manager.groups.testing[0]).toBe(module);
		});

		it("throws an error if the module has a null guid", function() {
			module.guid = null;

			expect(function() {
				manager.registerModule("testing", module);
			}).toThrow(new Error("Cannot register module testing without a guid property"));
		});

		it("throws an error if the module has an undefined guid", function() {
			module.guid = undefined;

			expect(function() {
				manager.registerModule("testing", module);
			}).toThrow(new Error("Cannot register module testing without a guid property"));
		});

		it("throws an error if the module has already been registered", function() {
			manager.registerModule("testing", module);

			expect(function() {
				manager.registerModule("testing", module);
			}).toThrow(new Error("Module " + module.guid + " has already been registered"));
		});

	});

	describe("unregisterModule", function() {

		var _guid = 0, module;

		beforeEach(function() {
			module = {
				guid: _guid++
			};
			manager.init();
		});

		it("returns false for modules without a guid", function() {
			module.guid = null;
			manager.unregisterModule(module);
			module.guid = undefined;
			expect(manager.unregisterModule(module)).toBe(false);
		});

		it("returns false if the module has already been unregistered", function() {
			manager.registerModule("testing", module);
			manager.unregisterModule(module);
			expect(manager.unregisterModule(module)).toBe(false);
		});

		it("removes a module from the registry and its associated group, and returns true", function() {
			manager.registerModule("testing", module);
			expect(manager.unregisterModule(module)).toBe(true);

			expect(manager.registry[module.guid]).toBe(undefined);
			expect(manager.groups.testing.length).toEqual(0);
		});

	});

	describe("createModules", function() {

		beforeEach(function() {
			element = document.createElement("div");
			manager.init();
		});

		it("throws an error if the data-modules attribute is missing", function() {
			element.id = "testing";
			element.className = "module";

			expect(function() {
				manager.createModules(element);
			}).toThrow(new Error("Missing required attribute data-modules on DIV.module#testing"));
		});

		describe("when data-modules contains one module type", function() {

			var _guid = 0, module;

			beforeEach(function() {
				module = {
					guid: _guid++,
					init: function() {},
					setElement: function(element) { this.element = element; },
					setOptions: function(options) { this.options = options; }
				};
				element = document.createElement("div");
				element.setAttribute("data-modules", "SpecFixtures.Modules.TestModule");
				factory = {
					getInstance: function() {}
				};
				manager.provider.factory = factory;
				spyOn(factory, "getInstance").and.returnValue(module);
				spyOn(manager, "registerModule");
				spyOn(manager.provider, "createModule").and.callThrough();
				spyOn(element, "getAttribute").and.callThrough();
				spyOn(element, "setAttribute").and.callThrough();
				spyOn(element, "removeAttribute").and.callThrough();
			});

			it("creates and registers a module", function() {
				manager.createModules(element);

				expect(element.getAttribute("data-module-options")).toBe(null);

				expect(manager.provider.createModule)
					.toHaveBeenCalledWith(element, "SpecFixtures.Modules.TestModule", {});

				expect(factory.getInstance)
					.toHaveBeenCalledWith("SpecFixtures.Modules.TestModule");

				expect(manager.registerModule)
					.toHaveBeenCalledWith("SpecFixtures.Modules.TestModule", module);

				expect(element.getAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(element.getAttribute)
					.toHaveBeenCalledWith("data-module-options");

				expect(element.removeAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(element.setAttribute)
					.toHaveBeenCalledWith("data-modules-created", "SpecFixtures.Modules.TestModule");

				expect(element.getAttribute("data-modules")).toBe(null);
				expect(element.getAttribute("data-modules-created")).toEqual("SpecFixtures.Modules.TestModule");
			});

			it("creates and registers a module with options", function() {
				element.setAttribute("data-module-options", '{"foo":"bar"}');

				manager.createModules(element);

				expect(factory.getInstance)
					.toHaveBeenCalledWith("SpecFixtures.Modules.TestModule");

				expect(manager.provider.createModule)
					.toHaveBeenCalledWith(element, "SpecFixtures.Modules.TestModule", { foo: "bar" });

				expect(manager.registerModule)
					.toHaveBeenCalledWith("SpecFixtures.Modules.TestModule", module);

				expect(element.getAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(element.getAttribute)
					.toHaveBeenCalledWith("data-module-options");

				expect(element.removeAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(element.setAttribute)
					.toHaveBeenCalledWith("data-modules-created", "SpecFixtures.Modules.TestModule");

				expect(element.getAttribute("data-modules")).toBe(null);
				expect(element.getAttribute("data-modules-created")).toEqual("SpecFixtures.Modules.TestModule");
			});

		});

		describe("when data-modules contains a space separated list of module types", function() {

			var _guid = 0, module;

			beforeEach(function() {
				module = {
					guid: _guid++,
					init: function() {},
					setElement: function(element) { this.element = element; },
					setOptions: function(options) { this.options = options; }
				};
				element = document.createElement("div");
				element.setAttribute("data-modules", "SpecFixtures.Modules.FooModule SpecFixtures.Modules.BarModule");
				factory = {
					getInstance: function() {}
				};
				manager.provider.factory = factory;
				spyOn(factory, "getInstance").and.returnValue(module);
				spyOn(manager, "registerModule");
				spyOn(manager.provider, "createModule").and.callThrough();
				spyOn(element, "getAttribute").and.callThrough();
				spyOn(element, "setAttribute").and.callThrough();
				spyOn(element, "removeAttribute").and.callThrough();
			});

			it("creates and registers multiple modules", function() {
				manager.createModules(element);

				expect(element.getAttribute("data-module-options")).toBe(null);

				expect(manager.provider.createModule)
					.toHaveBeenCalledWith(element, "SpecFixtures.Modules.FooModule", {});
				expect(manager.provider.createModule)
					.toHaveBeenCalledWith(element, "SpecFixtures.Modules.BarModule", {});

				expect(manager.registerModule)
					.toHaveBeenCalledWith("SpecFixtures.Modules.FooModule", module);
				expect(manager.registerModule)
					.toHaveBeenCalledWith("SpecFixtures.Modules.BarModule", module);

				expect(element.getAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(element.getAttribute)
					.toHaveBeenCalledWith("data-module-options");

				expect(element.removeAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(element.setAttribute)
					.toHaveBeenCalledWith("data-modules-created", "SpecFixtures.Modules.FooModule SpecFixtures.Modules.BarModule");

				expect(element.getAttribute("data-modules")).toBe(null);

				expect(element.getAttribute("data-modules-created"))
					.toEqual("SpecFixtures.Modules.FooModule SpecFixtures.Modules.BarModule");
			});

			it("creates and registers multiple modules with options namespaced to the module type", function() {
				var options = {
					"SpecFixtures.Modules.FooModule": {
						foo: "foo"
					}
				};

				var json = JSON.stringify(options);

				element.setAttribute("data-module-options", json);

				manager.createModules(element);

				expect(element.getAttribute("data-module-options")).toBe(json);

				expect(manager.provider.createModule)
					.toHaveBeenCalledWith(element, "SpecFixtures.Modules.FooModule", options["SpecFixtures.Modules.FooModule"]);
				expect(manager.provider.createModule)
					.toHaveBeenCalledWith(element, "SpecFixtures.Modules.BarModule", {});

				expect(manager.registerModule)
					.toHaveBeenCalledWith("SpecFixtures.Modules.FooModule", module);
				expect(manager.registerModule)
					.toHaveBeenCalledWith("SpecFixtures.Modules.BarModule", module);

				expect(element.getAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(element.getAttribute)
					.toHaveBeenCalledWith("data-module-options");

				expect(element.removeAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(element.setAttribute)
					.toHaveBeenCalledWith("data-modules-created", "SpecFixtures.Modules.FooModule SpecFixtures.Modules.BarModule");

				expect(element.getAttribute("data-modules")).toBe(null);

				expect(element.getAttribute("data-modules-created"))
					.toEqual("SpecFixtures.Modules.FooModule SpecFixtures.Modules.BarModule");
			});

		});

	});

});
