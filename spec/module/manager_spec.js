describe("Module.Manager", function() {

	beforeEach(function() {
		this.factory = {
			getInstance: function() {}
		};
		spyOn(this.factory, "getInstance");
		this.manager = new Module.Manager();
		this.manager.provider = new Module.Provider();
		this.manager.provider.factory = this.factory;
		spyOn(this.manager.provider, "destructor");
		this.managerElement = document.createElement("div");
	});

	describe("init", function() {

		describe("to support Dependency Injection and Inversion of Control", function() {

			it("does not instantiate a module factory if one already exists", function() {
				this.manager.init();
				expect(this.manager.provider.factory).toBe(this.factory);
			});

			it("does not instantiate a registry if one already exists", function() {
				var registry = {};
				this.manager.registry = registry;
				this.manager.init();
				expect(this.manager.registry).toBe(registry);
			});

			it("does not instantiate a module groups object if one already exists", function() {
				var groups = {};
				this.manager.groups = groups;
				this.manager.init();
				expect(this.manager.groups).toBe(groups);
			});

			it("sets Module.manager", function() {
				this.manager.init();
				expect(Module.manager).toBe(this.manager);
			});

		});

	});

	describe("destructor", function() {

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
			this.managerElement = document.createElement("div");
			this.module1 = new TestModule(0);
			this.module2 = new TestModule(1);
			this.manager.init();
			this.manager.registerModule("a", this.module1);
			this.manager.registerModule("b", this.module2);
		})

		it("nullifies references to Module.manager, groups, provider and registry", function() {
			expect(Module.manager).toBe(this.manager);

			this.manager.destructor();

			expect(Module.manager).toBe(null);
			expect(this.manager.groups).toBe(null);
			expect(this.manager.registry).toBe(null);
			expect(this.manager.provider).toBe(null);

			expect(this.module1.destructor).not.toHaveBeenCalled();
			expect(this.module2.destructor).not.toHaveBeenCalled();
		});

		it("destroys the module provider and all registered modules", function() {
			expect(Module.manager).toBe(this.manager);

			this.manager.destructor(true);

			expect(Module.manager).toBe(null);
			expect(this.manager.groups).toBe(null);
			expect(this.manager.registry).toBe(null);
			expect(this.manager.provider).toBe(null);

			expect(this.module1.destructor).toHaveBeenCalledWith(true);
			expect(this.module2.destructor).toHaveBeenCalledWith(true);
		});

	});

	describe("eagerLoadModules", function() {

		it("calls createModules() for each child element with a data-modules attribute", function() {
			spyOn(this.manager, "createModules");
			var element = this.managerElement;

			element.innerHTML = [
				'<ol>',
					'<li data-modules="Foo Bar"></li>',
					'<li data-modules="Baz"></li>',
				'</ol>',
				'<div data-modules="Bazzing"></div>'
			].join("");

			this.manager.init();

			var returnValue = this.manager.eagerLoadModules(this.managerElement);

			expect(returnValue).toBe(this.manager);
			expect(this.manager.createModules).toHaveBeenCalledWith(element.firstChild.childNodes[0]);
			expect(this.manager.createModules).toHaveBeenCalledWith(element.firstChild.childNodes[1]);
			expect(this.manager.createModules).toHaveBeenCalledWith(element.childNodes[1]);
			expect(this.manager.createModules).not.toHaveBeenCalledWith(element.firstChild);
		});

		it("does not call createModules() on elements with a data-module-lazyload attribute", function() {
			spyOn(this.manager, "createModules");
			var element = this.managerElement;

			element.innerHTML = [
				'<ol>',
					'<li></li>',
					'<li></li>',
				'</ol>',
				'<div data-modules="Bazzing" data-module-lazyload="mouseover"></div>'
			].join("");

			this.manager.init();
			this.manager.eagerLoadModules(element);

			expect(this.manager.createModules).not.toHaveBeenCalled();
		});

	});

	describe("registerModule", function() {

		var _guid = 0;

		beforeEach(function() {
			this.managerElement = document.createElement("div");
			this.module = {
				guid: _guid++
			};
			this.manager.init();
		});

		it("registers a new module and adds it to a module group", function() {
			this.manager.registerModule("testing", this.module);
			expect(this.manager.registry[this.module.guid]).toEqual({module: this.module, type: "testing"});
			expect(this.manager.groups.testing instanceof Array).toEqual(true);
			expect(this.manager.groups.testing.length).toEqual(1);
			expect(this.manager.groups.testing[0]).toBe(this.module);
		});

		it("throws an error if the module has a null guid", function() {
			var manager = this.manager;
			var module = this.module;
			this.module.guid = null;

			expect(function() {
				manager.registerModule("testing", module);
			}).toThrow(new Error("Cannot register module testing without a guid property"));
		});

		it("throws an error if the module has an undefined guid", function() {
			var manager = this.manager;
			var module = this.module;
			this.module.guid = undefined;

			expect(function() {
				manager.registerModule("testing", module);
			}).toThrow(new Error("Cannot register module testing without a guid property"));
		});

		it("throws an error if the module has already been registered", function() {
			var manager = this.manager;
			var module = this.module;

			manager.registerModule("testing", module);

			expect(function() {
				manager.registerModule("testing", module);
			}).toThrow(new Error("Module " + module.guid + " has already been registered"));
		});

	});

	describe("unregisterModule", function() {

		var _guid = 0;

		beforeEach(function() {
			this.managerElement = document.createElement("div");
			this.module = {
				guid: _guid++
			};
			this.manager.init();
		});

		it("does nothing for modules without a guid", function() {
			this.module.guid = null;
			this.manager.unregisterModule(this.module);
			this.module.guid = undefined;
			this.manager.unregisterModule(this.module);
		});

		it("does nothing if the module has already been unregistered", function() {
			this.manager.registerModule("testing", this.module);
			this.manager.unregisterModule(this.module);
			this.manager.unregisterModule(this.module);
		});

		it("removes a module from the registry and its associated group", function() {
			this.manager.registerModule("testing", this.module);
			this.manager.unregisterModule(this.module);

			expect(this.manager.registry[this.module.guid]).toBe(undefined);
			expect(this.manager.groups.testing.length).toEqual(0);
		});

	});

	describe("createModules", function() {

		beforeEach(function() {
			this.managerElement = document.createElement("div");
			this.manager.init();
		});

		it("throws an error if an element is not passed", function() {
			var manager = this.manager;

			expect(function() {
				manager.createModules();
			}).toThrow(new Error("Missing required argument: element"));

			expect(function() {
				manager.createModules(null);
			}).toThrow(new Error("Missing required argument: element"));
		});

		it("throws an error if the data-modules attribute is missing", function() {
			var manager = this.manager;
			var element = document.createElement("div");
			element.id = "testing";
			element.className = "module";

			expect(function() {
				manager.createModules(element);
			}).toThrow(new Error("Missing required attribute data-modules on DIV.module#testing"));
		});

		describe("when data-modules contains one module type", function() {

			var _guid = 0;

			beforeEach(function() {
				this.module = {
					guid: _guid++,
					init: function() {},
					setElement: function() {},
					setOptions: function() {}
				};
				this.element = document.createElement("div");
				this.element.setAttribute("data-modules", "SpecFixtures.Modules.TestModule");
				this.factory = {
					getInstance: function() {}
				};
				this.manager.provider.factory = this.factory;
				spyOn(this.factory, "getInstance").and.returnValue(this.module);
				spyOn(this.manager, "registerModule");
				spyOn(this.manager.provider, "createModule").and.callThrough();
				spyOn(this.element, "getAttribute").and.callThrough();
				spyOn(this.element, "setAttribute").and.callThrough();
				spyOn(this.element, "removeAttribute").and.callThrough();
			});

			it("creates and registers a module", function() {
				this.manager.createModules(this.element);

				expect(this.element.getAttribute("data-module-options")).toBe(null);

				expect(this.manager.provider.createModule)
					.toHaveBeenCalledWith(this.element, "SpecFixtures.Modules.TestModule", {});

				expect(this.factory.getInstance)
					.toHaveBeenCalledWith("SpecFixtures.Modules.TestModule");

				expect(this.manager.registerModule)
					.toHaveBeenCalledWith("SpecFixtures.Modules.TestModule", this.module);

				expect(this.element.getAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(this.element.getAttribute)
					.toHaveBeenCalledWith("data-module-options");

				expect(this.element.removeAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(this.element.setAttribute)
					.toHaveBeenCalledWith("data-modules-created", "SpecFixtures.Modules.TestModule");

				expect(this.element.getAttribute("data-modules")).toBe(null);
				expect(this.element.getAttribute("data-modules-created")).toEqual("SpecFixtures.Modules.TestModule");
			});

			it("creates and registers a module with options", function() {
				this.element.setAttribute("data-module-options", '{"foo":"bar"}');

				this.manager.createModules(this.element);

				expect(this.factory.getInstance)
					.toHaveBeenCalledWith("SpecFixtures.Modules.TestModule");

				expect(this.manager.provider.createModule)
					.toHaveBeenCalledWith(this.element, "SpecFixtures.Modules.TestModule", { foo: "bar" });

				expect(this.manager.registerModule)
					.toHaveBeenCalledWith("SpecFixtures.Modules.TestModule", this.module);

				expect(this.element.getAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(this.element.getAttribute)
					.toHaveBeenCalledWith("data-module-options");

				expect(this.element.removeAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(this.element.setAttribute)
					.toHaveBeenCalledWith("data-modules-created", "SpecFixtures.Modules.TestModule");

				expect(this.element.getAttribute("data-modules")).toBe(null);
				expect(this.element.getAttribute("data-modules-created")).toEqual("SpecFixtures.Modules.TestModule");
			});

		});

		describe("when data-modules contains a space separated list of module types", function() {

			var _guid = 0;

			beforeEach(function() {
				this.module = {
					guid: _guid++,
					init: function() {},
					setElement: function() {},
					setOptions: function() {}
				};
				this.element = document.createElement("div");
				this.element.setAttribute("data-modules", "SpecFixtures.Modules.FooModule SpecFixtures.Modules.BarModule");
				this.factory = {
					getInstance: function() {}
				};
				this.manager.provider.factory = this.factory;
				spyOn(this.factory, "getInstance").and.returnValue(this.module);
				spyOn(this.manager, "registerModule");
				spyOn(this.manager.provider, "createModule").and.callThrough();
				spyOn(this.element, "getAttribute").and.callThrough();
				spyOn(this.element, "setAttribute").and.callThrough();
				spyOn(this.element, "removeAttribute").and.callThrough();
			});

			it("creates and registers multiple modules", function() {
				this.manager.createModules(this.element);

				expect(this.element.getAttribute("data-module-options")).toBe(null);

				expect(this.manager.provider.createModule)
					.toHaveBeenCalledWith(this.element, "SpecFixtures.Modules.FooModule", {});
				expect(this.manager.provider.createModule)
					.toHaveBeenCalledWith(this.element, "SpecFixtures.Modules.BarModule", {});

				expect(this.manager.registerModule)
					.toHaveBeenCalledWith("SpecFixtures.Modules.FooModule", this.module);
				expect(this.manager.registerModule)
					.toHaveBeenCalledWith("SpecFixtures.Modules.BarModule", this.module);

				expect(this.element.getAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(this.element.getAttribute)
					.toHaveBeenCalledWith("data-module-options");

				expect(this.element.removeAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(this.element.setAttribute)
					.toHaveBeenCalledWith("data-modules-created", "SpecFixtures.Modules.FooModule SpecFixtures.Modules.BarModule");

				expect(this.element.getAttribute("data-modules")).toBe(null);

				expect(this.element.getAttribute("data-modules-created"))
					.toEqual("SpecFixtures.Modules.FooModule SpecFixtures.Modules.BarModule");
			});

			it("creates and registers multiple modules with options namespaced to the module type", function() {
				var options = {
					"SpecFixtures.Modules.FooModule": {
						foo: "foo"
					}
				};

				var json = JSON.stringify(options);

				this.element.setAttribute("data-module-options", json);

				this.manager.createModules(this.element);

				expect(this.element.getAttribute("data-module-options")).toBe(json);

				expect(this.manager.provider.createModule)
					.toHaveBeenCalledWith(this.element, "SpecFixtures.Modules.FooModule", options["SpecFixtures.Modules.FooModule"]);
				expect(this.manager.provider.createModule)
					.toHaveBeenCalledWith(this.element, "SpecFixtures.Modules.BarModule", {});

				expect(this.manager.registerModule)
					.toHaveBeenCalledWith("SpecFixtures.Modules.FooModule", this.module);
				expect(this.manager.registerModule)
					.toHaveBeenCalledWith("SpecFixtures.Modules.BarModule", this.module);

				expect(this.element.getAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(this.element.getAttribute)
					.toHaveBeenCalledWith("data-module-options");

				expect(this.element.removeAttribute)
					.toHaveBeenCalledWith("data-modules");

				expect(this.element.setAttribute)
					.toHaveBeenCalledWith("data-modules-created", "SpecFixtures.Modules.FooModule SpecFixtures.Modules.BarModule");

				expect(this.element.getAttribute("data-modules")).toBe(null);

				expect(this.element.getAttribute("data-modules-created"))
					.toEqual("SpecFixtures.Modules.FooModule SpecFixtures.Modules.BarModule");
			});

		});

	});

});
