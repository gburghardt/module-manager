describe("Module", function() {
describe("Manager", function() {
describe("SubModuleProperties", function() {

	describe("_createSubModuleProperty", function() {
		beforeEach(function() {
			this.element = document.createElement("div");
			this.manager = new Module.Manager();
			this.manager.init(this.element);

			window.SpecFixtures = {
				TestModule: function TestModule() {
					this.options = {};
				},
				TestSubModule: function TestSubModule() {
					this.options = {};
				}
			};

			SpecFixtures.TestModule.prototype.init = function() {};
			SpecFixtures.TestModule.prototype.setOptions = function() {};
			SpecFixtures.TestSubModule.prototype.init = function() {};
			SpecFixtures.TestSubModule.prototype.setOptions = function() {};

			SpecFixtures.TestModule.manager = this.manager;

			SpecFixtures.TestModule.getManager = function getManager() {
				return SpecFixtures.TestModule.manager;
			};

			SpecFixtures.TestModule.prototype.test = null;

			SpecFixtures.TestModule.prototype.manySubModules = [];

			SpecFixtures.TestModule.include(Module.Manager.SubModuleProperties);
		});

		afterEach(function() {
			this.manager.destructor();
			window.SpecFixtures = null;
			delete window.SpecFixtures;
		});

		it("requires a name argument", function() {
			var module = new SpecFixtures.TestModule();

			expect(function() {
				module._createSubModuleProperty();
			}).toThrow(new Error("Missing required argument: name"));
		});

		it("requires an element argument", function() {
			var module = new SpecFixtures.TestModule();

			expect(function() {
				module._createSubModuleProperty("testing");
			}).toThrow(new Error("Missing required argument: element"));
		});

		it("requires the element only has one data-module value", function() {
			this.element.setAttribute("data-modules", "Foo Bar");
			var element = this.element;
			var module = new SpecFixtures.TestModule();

			expect(function() {
				module._createSubModuleProperty("testing", element);
			}).toThrow(new Error("Sub module elements cannot have more than one type specified in data-module"));
		});

		it("sets a single instance property", function() {
			var subModuleElement = document.createElement("div");
			var module = new SpecFixtures.TestModule();
			var subModule = new SpecFixtures.TestSubModule();

			subModuleElement.setAttribute("data-modules", "SpecFixtures.TestSubModule");
			this.element.appendChild(subModuleElement);

			spyOn(subModule, "init");
			spyOn(this.manager, "createModule").and.returnValue(subModule);

			module._createSubModuleProperty("test", subModuleElement);

			expect(this.manager.createModule).toHaveBeenCalledWith(subModuleElement, "SpecFixtures.TestSubModule", {});
			expect(module.test).toBe(subModule);
		});

		it("sets an array property", function() {
			var module = new SpecFixtures.TestModule();
			var subModuleElements = [
				document.createElement("div"),
				document.createElement("div")
			];

			subModuleElements[0].setAttribute("data-modules", "SpecFixtures.TestSubModule");
			subModuleElements[1].setAttribute("data-modules", "SpecFixtures.TestSubModule");
			this.element.appendChild(subModuleElements[0]);
			this.element.appendChild(subModuleElements[1]);

			module._createSubModuleProperty("manySubModules", subModuleElements[0]);
			module._createSubModuleProperty("manySubModules", subModuleElements[1]);

			expect(module.manySubModules.length).toBe(2);
			expect(module.manySubModules[0] instanceof SpecFixtures.TestSubModule).toBe(true);
			expect(module.manySubModules[1] instanceof SpecFixtures.TestSubModule).toBe(true);
		});

		it("throws an error when setting a single instance property and that property already exists", function() {
			var subModuleElement = document.createElement("div");
			var module = new SpecFixtures.TestModule();

			module.test = {};

			subModuleElement.setAttribute("data-modules", "SpecFixtures.TestSubModule");
			this.element.appendChild(subModuleElement);

			expect(function() {
				module._createSubModuleProperty("test", subModuleElement);
			}).toThrow(new Error("Error creating sub module. Property test already exists."));
		});

		it("throws an error when no property exists on the class prototype that is null or an Array", function() {
			var subModuleElement = document.createElement("div");
			var module = new SpecFixtures.TestModule();

			SpecFixtures.TestModule.prototype.manySubModules = {};

			subModuleElement.setAttribute("data-modules", "SpecFixtures.TestSubModule");
			this.element.appendChild(subModuleElement);

			expect(function() {
				module._createSubModuleProperty("manySubModules", subModuleElement);
			}).toThrow(new Error("Cannot create module property manySubModules. Property is neither null nor an Array in the class Prototype."));
		});

	});

	describe("initSubModules", function() {

		beforeEach(function() {
			this.element = document.createElement("div");
			this.element.innerHTML = [
				'<div></div>',
				'<div data-module-property="selection" data-modules="SpecFixtures.SelectionModule"></div>',
				'<form data-module-property="autoCompleters" data-modules="SpecFixtures.AutoCompleterModule"></form>',
				'<form data-module-property="autoCompleters" data-modules="SpecFixtures.AutoCompleterModule"></form>'
			].join("");

			this.elementStore = new ElementStore().init(this.element);

			window.SpecFixtures = {
				TestModule: function TestModule(elementStore) {
					this.elementStore = elementStore;
					this.options = {};
				},
				SelectionModule: function SelectionModule() {},
				AutoCompleterModule: function AutoCompleterModule() {}
			};

			SpecFixtures.TestModule.include(Module.Manager.SubModuleProperties);
		});

		afterEach(function() {
			this.elementStore.destructor();

			window.SpecFixtures = null;
			delete window.SpecFixtures;
		});

		it("sets sub module properties", function() {
			var elements = [
				this.element.childNodes[1],
				this.element.childNodes[2],
				this.element.childNodes[3]
			];
			var module = new SpecFixtures.TestModule(this.elementStore);
			spyOn(module, "_createSubModuleProperty");
			spyOn(this.elementStore, "getCollection").and.returnValue(elements);

			module.initSubModules();

			expect(this.elementStore.getCollection).toHaveBeenCalledWith("subModules");
			expect(module._createSubModuleProperty).toHaveBeenCalledWith("selection", elements[0]);
			expect(module._createSubModuleProperty).toHaveBeenCalledWith("autoCompleters", elements[1]);
			expect(module._createSubModuleProperty).toHaveBeenCalledWith("autoCompleters", elements[1]);
		});

	});

});
});
});
