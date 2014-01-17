describe("Module.Manager.SubModuleProperties", function() {

	// global
	window.Module.Manager.SpecFixtures = {
		TestModule: Object.extend({
			includes: Module.Manager.SubModuleProperties,
			self: {
				getManager: function getManager() {
					return this.manager;
				}
			},
			prototype: {
				test: null,
				manySubModules: [],
				initialize: function() {
					this.options = {};
				},
				init: function() {},
				setElement: function() {},
				setOptions: function() {}
			}
		}),
		TestSubModule: Object.extend({
			prototype: {
				initialize: function() {
					this.options = {};
				},
				init: function() {},
				setElement: function() {},
				setOptions: function() {}
			}
		})
	};

	// local
	var element,
	    manager,
	    module,
	    elementStore;

	describe("_createSubModuleProperty", function() {
		beforeEach(function() {
			element = document.createElement("div");
			manager = new Module.Manager();
			manager.init(element);
			module = new Module.Manager.SpecFixtures.TestModule();

			Module.Manager.SpecFixtures.TestModule.manager = manager;
		});

		afterEach(function() {
			manager.destructor();
		});

		it("requires a name argument", function() {
			expect(function() {
				module._createSubModuleProperty();
			}).toThrow(new Error("Missing required argument: name"));
		});

		it("requires an element argument", function() {
			expect(function() {
				module._createSubModuleProperty("testing");
			}).toThrow(new Error("Missing required argument: element"));
		});

		it("requires the element only has one data-module value", function() {
			element.setAttribute("data-modules", "Foo Bar");

			expect(function() {
				module._createSubModuleProperty("testing", element);
			}).toThrow(new Error("Sub module elements cannot have more than one type specified in data-modules"));
		});

		it("sets a single instance property", function() {
			var subModuleElement = document.createElement("div");
			var subModule = new Module.Manager.SpecFixtures.TestSubModule();

			subModuleElement.setAttribute("data-modules", "Module.Manager.SpecFixtures.TestSubModule");
			element.appendChild(subModuleElement);

			spyOn(subModule, "init");
			spyOn(manager, "createModule").and.returnValue(subModule);

			module._createSubModuleProperty("test", subModuleElement);

			expect(manager.createModule).toHaveBeenCalledWith(subModuleElement, "Module.Manager.SpecFixtures.TestSubModule", {});
			expect(module.test).toBe(subModule);
		});

		it("sets an array property", function() {
			var module = new Module.Manager.SpecFixtures.TestModule();
			var subModuleElements = [
				document.createElement("div"),
				document.createElement("div")
			];

			subModuleElements[0].setAttribute("data-modules", "Module.Manager.SpecFixtures.TestSubModule");
			subModuleElements[1].setAttribute("data-modules", "Module.Manager.SpecFixtures.TestSubModule");
			element.appendChild(subModuleElements[0]);
			element.appendChild(subModuleElements[1]);

			module._createSubModuleProperty("manySubModules", subModuleElements[0]);
			module._createSubModuleProperty("manySubModules", subModuleElements[1]);

			expect(module.manySubModules.length).toBe(2);
			expect(module.manySubModules[0] instanceof Module.Manager.SpecFixtures.TestSubModule).toBe(true);
			expect(module.manySubModules[1] instanceof Module.Manager.SpecFixtures.TestSubModule).toBe(true);
		});

		it("throws an error when setting a single instance property and that property already exists", function() {
			var subModuleElement = document.createElement("div");

			module.test = {};

			subModuleElement.setAttribute("data-modules", "Module.Manager.SpecFixtures.TestSubModule");
			element.appendChild(subModuleElement);

			expect(function() {
				module._createSubModuleProperty("test", subModuleElement);
			}).toThrow(new Error("Error creating sub module. Property test already exists."));
		});

		it("throws an error when no property exists on the class prototype that is null or an Array", function() {
			var subModuleElement = document.createElement("div");

			Module.Manager.SpecFixtures.TestModule.prototype.badManySubModules = {};

			subModuleElement.setAttribute("data-modules", "Module.Manager.SpecFixtures.TestSubModule");
			element.appendChild(subModuleElement);

			expect(function() {
				module._createSubModuleProperty("badManySubModules", subModuleElement);
			}).toThrow(new Error("Cannot create module property badManySubModules. Property is neither null nor an Array in the class Prototype."));
		});

	});

	describe("initSubModules", function() {

		beforeEach(function() {
			element = document.createElement("div");
			element.innerHTML = [
				'<div></div>',
				'<div data-module-property="selection" data-modules="Module.Manager.SpecFixtures.SelectionModule"></div>',
				'<form data-module-property="autoCompleters" data-modules="Module.Manager.SpecFixtures.AutoCompleterModule"></form>',
				'<form data-module-property="autoCompleters" data-modules="Module.Manager.SpecFixtures.AutoCompleterModule"></form>'
			].join("");

			elementStore = new ElementStore().init(element);

			Module.Manager.SpecFixtures = {
				TestModule: function TestModule(elementStore) {
					this.elementStore = elementStore;
					this.options = {};
				},
				SelectionModule: function SelectionModule() {},
				AutoCompleterModule: function AutoCompleterModule() {}
			};

			Module.Manager.SpecFixtures.TestModule.include(Module.Manager.SubModuleProperties);
		});

		afterEach(function() {
			elementStore.destructor();
		});

		it("sets sub module properties", function() {
			var elements = [
				element.childNodes[1],
				element.childNodes[2],
				element.childNodes[3]
			];
			module = new Module.Manager.SpecFixtures.TestModule(elementStore);
			spyOn(module, "_createSubModuleProperty");
			spyOn(elementStore, "getCollection").and.returnValue(elements);

			module.initSubModules();

			expect(elementStore.getCollection).toHaveBeenCalledWith("subModules");
			expect(module._createSubModuleProperty).toHaveBeenCalledWith("selection", elements[0]);
			expect(module._createSubModuleProperty).toHaveBeenCalledWith("autoCompleters", elements[1]);
			expect(module._createSubModuleProperty).toHaveBeenCalledWith("autoCompleters", elements[1]);
		});

	});

});
