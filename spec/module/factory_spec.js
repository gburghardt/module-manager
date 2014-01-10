describe("Module", function() {

	describe("Factory", function() {

		beforeEach(function() {
			this.factory = new Module.Factory();
		});

		describe("getInstance", function() {

			beforeEach(function() {
				window.SpecFixtures = {
					Modules: {
						TestModule: function() {
							this.element = document.createElement("div");
						}
					}
				};
			});

			afterEach(function() {
				window.SpecFixtures = null;
				delete window.SpecFixtures;
			});

			it("instantiates a new instance of a module given a valid class name", function() {

				var instance = this.factory.getInstance("SpecFixtures.Modules.TestModule");

				expect(instance instanceof SpecFixtures.Modules.TestModule).toEqual(true);
			});

			it("throws an error if an invalid class name is specified", function() {
				var factory = this.factory;

				expect(function() {
					factory.getInstance("9Lives");
				}).toThrow(new Error("Cannot instantiate invalid type: 9Lives"));

				expect(function() {
					factory.getInstance("$Test");
				}).toThrow(new Error("Cannot instantiate invalid type: $Test"));

				expect(function() {
					factory.getInstance("window.alert('Hacked!')");
				}).toThrow(new Error("Cannot instantiate invalid type: window.alert('Hacked!')"));
			});

			it("throws an error if a valid class name does not resolve to a class", function() {
				var factory = this.factory;

				expect(function() {
					factory.getInstance("SpecFixtures.Modules");
				}).toThrow(new Error("Class name SpecFixtures.Modules is not a constructor function"));
			});

			it("throws an error if the class does not exist", function() {
				var factory = this.factory;

				expect(function() {
					factory.getInstance("I.Do.Not.Exist");
				}).toThrow(new Error("Class name I.Do.Not.Exist does not exist"));
			});

			it("throws an error if the class does not exist in the namespace", function() {
				var factory = this.factory;

				expect(function() {
					factory.getInstance("SpecFixtures.Modules.BadModule");
				}).toThrow(new Error("Class name SpecFixtures.Modules.BadModule does not exist"));
			});

			describe("in order to support Dependency Injection and Inversion of Control", function() {

				beforeEach(function() {
					this.module = {};
					this.objectFactory = {
						getInstance: function() {}
					};
					this.factory.objectFactory = this.objectFactory;
				});

				it("returns a new module instance from an object factory", function() {
					spyOn(this.objectFactory, "getInstance").and.returnValue(this.module);
					var instance = this.factory.getInstance("test");

					expect(this.objectFactory.getInstance).toHaveBeenCalledWith("test");
					expect(instance).toBe(this.module);
				});

				it("throws an error if it fails to get a module instance from the object factory", function() {
					spyOn(this.objectFactory, "getInstance").and.returnValue(null);
					var factory = this.factory;

					expect(function() {
						factory.getInstance("test");
					}).toThrow(new Error("The object factory failed to get a new instance for type: test"));

					expect(this.objectFactory.getInstance).toHaveBeenCalledWith("test");
				});

			});

		});

		describe("createInstance", function() {

			beforeEach(function() {
				this.element = document.createElement("div");
				this.options =  {};
				this.module = {
					init: function() {elementOrId, options}
				};
			});

			it("creates a new module instance and initializes it with the given element", function() {
				spyOn(this.factory, "getInstance").and.returnValue(this.module);
				spyOn(this.module, "init");

				var instance = this.factory.createInstance(this.element, "test");

				expect(this.factory.getInstance).toHaveBeenCalledWith("test");
				expect(this.module.init).toHaveBeenCalledWith(this.element, undefined);
				expect(instance).toBe(this.module);
			});

			it("creates a new module instance and initializes it with the given element and options", function() {
				spyOn(this.factory, "getInstance").and.returnValue(this.module);
				spyOn(this.module, "init");

				var instance = this.factory.createInstance(this.element, "test", this.options);

				expect(this.factory.getInstance).toHaveBeenCalledWith("test");
				expect(this.module.init).toHaveBeenCalledWith(this.element, this.options);
				expect(instance).toBe(this.module);
			});

		});

	});

});
