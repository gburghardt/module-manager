describe("Module.Factory", function() {

	var factory, module, objectFactory;

	beforeEach(function() {
		factory = new Module.Factory();
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
			module = factory.getInstance("SpecFixtures.Modules.TestModule");

			expect(module instanceof SpecFixtures.Modules.TestModule).toBe(true);
		});

		all("invalid class names throw an error",
			[
				"9Lives",
				"$Test",
				"window.alert('Hacked!')"
			],
			function(className) {
				expect(function() {
					factory.getInstance(className);
				}).toThrowError("Cannot instantiate invalid type: " + className);
			}
		);

		it("throws an error if a valid class name does not resolve to a class", function() {
			expect(function() {
				factory.getInstance("SpecFixtures.Modules");
			}).toThrowError("Class name SpecFixtures.Modules is not a constructor function");
		});

		it("throws an error if the class does not exist", function() {
			expect(function() {
				factory.getInstance("I.Do.Not.Exist");
			}).toThrowError("Class name I.Do.Not.Exist does not exist");
		});

		it("throws an error if the class does not exist in the namespace", function() {
			expect(function() {
				factory.getInstance("SpecFixtures.Modules.BadModule");
			}).toThrowError("Class name SpecFixtures.Modules.BadModule does not exist");
		});

		describe("in order to support Dependency Injection and Inversion of Control", function() {

			beforeEach(function() {
				module = {};
				objectFactory = {
					getInstance: function() {}
				};
				factory.objectFactory = objectFactory;
			});

			it("returns a new module instance from an object factory", function() {
				spyOn(objectFactory, "getInstance").and.returnValue(module);
				var instance = factory.getInstance("test");

				expect(objectFactory.getInstance).toHaveBeenCalledWith("test");
				expect(instance).toBe(module);
			});

			it("falls back to the normal class lookup if it fails to get a module instance from the object factory", function() {
				spyOn(objectFactory, "getInstance").and.returnValue(null);
				module = factory.getInstance("SpecFixtures.Modules.TestModule");

				expect(objectFactory.getInstance).toHaveBeenCalledWith("SpecFixtures.Modules.TestModule");
				expect(module instanceof SpecFixtures.Modules.TestModule).toBe(true);
			});

		});

	});

});
