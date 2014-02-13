# Module Manager

Module Manager is the power behind [Foundry](https://github.com/gburghardt/foundry).
It gives you an easy and centralized way to manage "modules" on the page -- self
contained JavaScript classes that manage all user interaction from one root
element on down.

Features include:

1. A Module Manager, which is responsible for creating new modules either at
   page load, or as the user scrolls.
2. A Module Provider, which does the dirty work of instantiating and configuring
   new modules as the Manager sees fit.
3. A Module Factory responsible for churning out new instances of Modules.
4. A module lazy loader that will create and initialize modules as they become
   visible to the user while they scroll around the page.
5. Support for CSS media queries so modules are created conditionally based on
   browser viewport size.
6. A well defined interface for all classes that interact with Module Manager
7. Support for dependency injection
8. No external dependencies
9. Support for Internet Explorer 9+. Older browsers are supported with Polyfills.

## Getting Started

Here's how to get started using Module Manager:

1. Download the source code from GitHub, or `bower install module-manager` from
   the command line.
2. Open `demo/index.html` in a browser.

That's right, nothing else is required!

## Module Manager Architecture

There are four basic layers in the Module Manager Architecture. At the top of it
all is the Module Manager, which creates new modules and keeps track of the
modules that were previously created. Peeling back that layer reveals two other
components: The Module Provider and the Module Factory. The Module Provider
knows the gritty details of how to initialize a new module in a root element,
and delegates to the Module Factory in order to generate new object instances.
The Module Factory just churns out new module objects. Lastly, under this layer
are the Modules themselves.

### Modules and their Role

"Modules" are self contained JavaScript classes that manage all of the user
interaction from one root element in the DOM and everything inside it. They
represent the "Controller" layer of an MVC application. Module Manager does not
come with a base class for "Modules", but instead relies on the Module Factory
to churn out new module objects, and interacts with them through a well defined
interface called `Module.IModule`. You can find the psuedo code for this
in `src/interfaces.js`.

### The Module Provider

Module Providers create and initialize one or more Modules on a given root
element in the document. They interact with the Module Factory to create the new
Module objects. The Module Manager and Provider interact with one another.

### The Module Factory

The Module Factory does little more than churn out new object instances. The
interface for the Module Factory is very simple, making it very easy to roll
your own Module Factory or introduce Inversion of Control and Dependency
Injection into your code.

### The Module Manager

The Module Manager is the thing the rest of your application interacts with.
There really isn't much to do here. Your application creates a new Module
Manager and tells it to eager load modules on page load, and/or lazy load
modules as the user scrolls around the page.

The primary goal of Module Manager is to remove the need to hand write
initialization code, and utilizes custom HTML5 data attributes in HTML to
bootstrap the process.

## Gluing the Pieces Together: HTMl5 Data Attributes and the Module Manager

Special HTML5 data attributes in your HTML tags are used to instantiate a new
object in JavaScript, configure it with some runtime settings, and kick start
its lifecycle. First, we'll see the HTML required to bring a Module to life.

    <div data-modules="ExampleModule">...</div>

The `data-modules` HTML attribute holds one or more JavaScript class names. The
Module Manager instantiates that class, and sets its root element to the HTML
tag that has the `data-modules` attribute on it. In the code snippet above, the
Module Manager will essentially run this JavaScript code under the hood:

    // element is a reference to <div data-modules="ExampleModule" />
    var module = new ExampleModule();
    module.setElement(element);
    module.init();

The string "ExampleModule" is turned into a reference to the `ExampleModule`
constructor function in JavaScript. A new object is created using the `new`
operator. The `setElement` method is called on the new module object, passing in
a reference to the `div` tag that has the `data-modules` attribute on it. As a
final step, the manager calls the `init` method on the module, which means this
new module object should finish boostrapping itself so it can respond to the
user.

This works for many cases, but there is always a need to configure a module at
runtime.

    <div data-modules="ExampleModule" data-module-options='{ "id": 123 }'>...</div>

The `data-module-options` attribute allows you to embed custom JSON settings in
your HTML, which are then passed on to the new module. With the code snippet
above, the Module Manager will execute these basic steps:

    // element is a reference to <div data-modules="ExampleModule" />
    var module = new ExampleModule();

    module.setElement(element);

    module.setOptions({
        id: 123
    });

    module.init();

**Related Demo: `demo/basic.html`**

You may also create multiple modules on the same root element.

### Multiple Modules on the Same Root Element

Let's say you have two module classes in JavaScript, ExampleModule and
FooModule. You discover that you need both modules on the same `div` tag. With a
few changes to the `data-modules` and `data-module-options` attributes you can
give two separate modules the same root element:

    <div data-modules="ExampleModule FooModule"
        data-module-options='{
            "ExampleModule": { "backgroundColor": "red" },
            "FooModule": { "foo": "bar" }
        }'>
        ...
    </div>

The `data-modules` attribute has a space separated list of module types that
will call this `div` tag home.

The `data-module-options` attribute has a little bit different structure now.
The options for a specific module class are contained in a property named after
the module's class, similar to the structure below:

    var options = {
        "ExampleModule": { "backgroundColor": "red" },
        "FooModule": { "foo": "bar" }
    };

Now `options.ExampleModule` is the options object for the `ExampleModule`
instance on this DIV tag, and the `options.FooModule` object is the options for
the instance of `FooModule` attached to this DIV tag.

Note that you *cannot* do this:

    <div data-modules="ExampleModule ExampleModule">...</div>

Each type in the `data-modules` attribute must be a unique type.

### Module Options

To maximize code reuse, sometimes you want to parameterize some things in your
module. Database Ids, URLs and other pieces of information can all be provided
by a backend application and serialized as JSON in the `data-module-options`
attribute. This provides a handy bridge between server and client when modules
are instantiated.

The `data-module-options` attribute must contain valid JSON, which is parsed
using `JSON.parse()`.

There is one special property in the module options that allows you to set focus
to one module after the page has loaded.

#### Setting Focus to a "Default" Module

When the Module Manager encounters this:

    <div data-modules="FooModule" data-module-options='{ "defaultModule": true }'>

Then the Manager stashes this object instance. Calling
`Module.Manager#focusDefaultModule()` after page load will call the "focus"
method of that module. This is a great way to give the user a place to start in
your application.

**Related Demo: `demo/default_module.html`**

### Responsive Design Meets Responsive JavaScript

CSS3 Media Queries gave us unparalleled flexibility for displaying the same
content in multiple form factors. Unfortunately, JavaScript was left in the
dust. Now with Module Manager, you can use CSS3 Media Queries to tell the
manager which modules on the page you will need. First, consider this:

    <div data-modules="MyBigComplexModule"></div>

We have `MyBigComplexModule`, which for desktop computers works well. You
discover during testing that the user interface for this module is *not* mobile
friendly, and you want an easy way to remove it from smaller devices.

    <div data-modules="MyBigComplexModule" data-module-media="screen and (min-width: 900px)"></div>

That's all it takes!

Under the hood, the built in global function `matchMedia` is used to evaluate
the media query. Older browsers will [need a polyfill](https://github.com/paulirish/matchMedia.js)
to support this feature.

    <div data-modules="DesktopFriendlyModule" data-module-media="screen and (min-width: 900px)"></div>
    <div data-modules="MobileFriendlyModule" data-module-media="screen and (max-width: 300px)"></div>

Another piece of HTML5 glue allows you to "lazy load" modules.

### Lazy Loading Modules

Modules can optionally be instantiated and initialized when the user scrolls
their root elements into view. An additional attribute is used in HTML to
enable this behavior:

    <div data-modules="ExampleModule" data-module-lazyload="any">
        ...
    </div>

The `data-module-lazyload` attribute may contain one of three values:

- **mouseover:** The user moves the mouse over the root element
- **scrollto:** The user scrolls the page so that the root element is now inside
  the browser viewport.
- **any:** The user mouses over or scrolls to the root element

The existence of those module instances is deferred until the user can interact
with them.

When modules are lazy loaded, it's often useful to send an AJAX request to fill
the contents of the module. This can help cut down on page load times.

**Related Demo: `demo/lazy_loading.html`**

Since we like the functionality of a module tightly focused, you may want to
nest modules, that is, create Sub Modules.

### Sub Modules

A Sub Module is a module within a module, both in HTML and JavaScript. Let's say
you have two JavaScript classes: TodoListModule, which allows you to add, remove
and complete TODO list items; and SelectionModule, which allows you to select
and apply bulk actions to multiple items.

The abbreviated source code of TodoListModule might look something like this:

    function TodoListModule() {
    }

    TodoListModule.prototype.selection = null;

    TodoListModule.prototype.init = function(element, options) {
        if (element)
            this.setElement(element);

        if (options)
            this.setOptions(options);

        this.selection = new SelectionModule();
        this.selection.init(this.element.querySelector("ol"));
        // ... other stuff to do
    };

And your HTML:

    <div data-modules="TodoListModule">
        <ol>...</ol>
    </div>

The `TodoListModule` needs to manage a list of items that can be selected and
deselected. We create a `SelectionModule` inside the root element of
`TodoListModule` to manage this interaction, however we have an architectural
problem here. The `TodoListModule` is dependent upon `SelectionModule`.

There is nothing wrong with needing a "selection module", rather the problem is
that `TodoListModule` is acquiring its own dependency for selecting and
deselecting items. Additionally, when you look at the HTML structure it's
difficult to know what the root element of the "selection module" is. Let's have
the Module Manager wire these two together for us!

First, let's change the JavaScript:

    function TodoListModule() {
    }

    TodoListModule.prototype.selection = null;

    TodoListModule.prototype.init = function(element, options) {
        if (element)
            this.setElement(element);

        if (options)
            this.setOptions(options);

        // ... other stuff to do
    };

We will no longer need code to instantiate and initialize the `SelectionModule`.
The last piece of the puzzle is the addition of another couple of HTML
attributes defining the root element for our selection module, and the name of
the property this object instance should be assigned to in our `TodoListModule`:

    <div data-modules="TodoListModule">
        <ol data-module-property="selection" data-modules="SelectionModule">
            ...
        </ol>
    </div>

The Module Manager will create an instance of `SelectionModule` using the `ol`
as the root element, and it will automatically stash that object reference as
the `selection` property on our `TodoListModule`. By the time that `init` is
called on the `TodoListModule`, the `SelectionModule` has been created and
initialized. You may access it from `TodoListModule` using `this.selection`.

    TodoListModule.prototype.init = function(element, options) {
        if (element)
            this.setElement(element);

        if (options)
            this.setOptions(options);

        // "this.selection" is a fully initialized instance of SelectionModule
        this.selection.whatever(...);
    };

A limitation of using Sub Modules is that you cannot specify more than one
module type on the sub module HTML tag.

Valid:

    <ol data-module-property="selection" data-modules="SelectionModule">

Invalid:

    <ol data-module-property="selection" data-modules="SelectionModule SomeOtherModule">

The second example will throw an error.

#### Array Sub Modules

Sometimes you *do* want multiple instances of the same module inside another
module. You can do this using the following example:

First, a slight change to the JavaScript. The module property must be an array
in the class definition for `TodoListModule` in order for this to work:

    TodoListModule.prototype.selections = []; // <-- This is now an Array

Now, the HTML:

    <div data-modules="TodoListModule">
        <ol data-module-property="selections" data-modules="SelectionModule">...</ol>

        Some other HTML...

        <ol data-module-property="selections" data-modules="SelectionModule">...</ol>
    </div>

Since the `selections` property in the class definition is an array, the Module
Manager will push a new instance of SelectionManager onto the
`TodoListModule#selections` property. Using the HTML snippet above, the instance
of `TodoListModule` would have a `selections` property that contains two
different instances of `SelectionModule`. Each `SelectionModule` can be
configured differently as well by using the `data-module-options` attribute.

#### Why Use Sub Modules?

Sub modules are usefull for keeping your code decoupled. If you ever need to
refactor the HTML structure of your module, you need only shift around a few
HTML attributes:

    <div data-modules="TodoListModule">
        <div data-module-property="selection" data-modules="SelectionModule">
            <button>Select All</button>
            <ol>...</ol>
        </div>
    </div>

No additional JavaScript changes are necessary. Your module HTML and object
structures are decoupled, and your JavaScript code is not responsible for
querying the document for it's module dependencies.

Now that we've explored how you use the Module Manager, lets dig a little deeper
into each layer and explore the interfaces we have available.

### The Module Interface: `Module.IModule`

We use the term "interface" loosely with JavaScript, since the language does not
support this feature. Instead, think of an interface as a convention that
Module Manager agrees to use, and your JavaScript classes agree to implement.

All module objects created by the Module Manager must implement an interface we
call `Module.IModule`. You can see a psuedo code description of this interface
in `src/interfaces.js`. Here's the basics of the interface:

- Modules must be instantiable classes that do not require constructor
  arguments. Once we dig in to Dependency Injection, we'll see that this rule
  can be bent.

- `String guid` --- The `guid` property must be unique for a single module
  amongst all the modules on the page. This is used to register the module with
  the Module Manager.

- `void destructor(bool keepElement = false)` --- A public method called
  `destructor` that takes no arguments, or one boolean argument. When true is
  passed, the root element of the module will stay attached to the `document`.
  Otherwise, the root element must be removed. This method readies the module
  for natural garbage collection by the browser and should nullify object
  pointers and remove event handlers.

- `Module.IModule init()` --- Initialize this module. Attach event handlers,
  and do the necessary heavy lifting so the module can react to user actions.
  The module should return a reference to itself to allow method call chaining.

- `Module.IModule init(String elementId)` --- Initialize this module and set
  the root element to the DOM node referenced by `elementId`.

- `Module.IModule init(String elementId, Object options)` --- Same as the
  previous overload, but set some runtime configurable options as well.

- `Module.IModule init(HtmlElement element)` --- Initialize this module and
  set its root element to the DOM node being passed in

- `Module.IModule init(HtmlElement element, Object options)` --- Same as the
  previous overload, but set some runtime configurable options as well.

- `void focus()` --- Set focus to this module. The first editable form field
  inside this module will receive focus, and select the text if available.

- `void focus(bool anything)` --- Set focus to this module. The first
  element that is capable of receiving focus will get focused. Text will be
  selected for editable form fields. Anchors and buttons will also be focused if
  they occur before form fields.

- `void setElement(String elementId)` --- Set the root node of this module
  using the provided element Id.

- `void setElement(HtmlElement element)` --- Set the root node of this
  module using the provided element.

- `void setOptions(Object options)` --- Set runtime configurable options.

This illustrates the basic interface for all modules:

    var module = new FooModule();

    module.setElement(elementOrId);
    module.setOptions({ ... });
    module.init();

    // OR
    module.setOptions({ ... });
    module.init(elementOrId);

    // OR
    module.init(elementOrId, { .. });

    // set focus to first editable field
    module.focus();

    // set focus to the first focusable element, including links
    module.focus(true);

    // removes the root element
    module.destructor();

    // leaves the root element;
    module.destructor(true);

### A Template for Custom Module Classes

You can use this as a template to create your own base module class that will
integrate seamlessly with Module.Manager and Module.Provider.

    function MyBaseModule() {
        this.options = {};
    }

    MyBaseModule.prototype = {

        document: null,

        element: null,

        options: null,

        window: null,

        constructor: MyBaseModule,

        init: function init(elementOrId, options) {
            if (elementOrId) {
                this.setElement(elementOrId);
            }

            if (options) {
                this.setOptions(options);
            }

            this._ready();
        },

        _ready: function _ready() {
        },

        destructor: function destructor(keepElement) {
            if (this.element && !keepElement) {
                this.element.parentNode.removeChild(this.element);
            }

            this.element = this.options = this.document = this.window = null;
        },

        focus: function focus(anything) {
            var el = (anything)
                ? this.element.querySelector("a, input, textarea, select")
                : this.element.querySelector("input, textarea, select");

            if (el) {
                el.focus();

                if (el.select) {
                    el.select();
                }
            }
        },

        setElement: function setElement(elementOrId) {
            this.element = typeof elementOrId === "string"
                ? document.getElementById(elementOrId)
                : elementOrId;

            if (!this.element) {
                throw new Error("Could not find element: " + elementOrId);
            }

            this.document = this.element.ownerDocument;
            this.window = this.document.defaultView || this.document.parentWindow;
        },

        setOptions: function setOptions(options) {
            for (var key in options) {
                if (options.hasOwnProperty(key)) {
                    this.options[key] = options[key];
                }
            }
        }
    };

## The Module Manager Interface: `Module.IManager`

The Module Manager is the organizer, and has the following responsibilities:

- Creates and initializes modules
- Keeps track of the modules it creates
- Eager loads all modules on the page using `Module.Manager#eagerLoadModules(element)`
- Lazy loads modules via `Module.Manager#lazyLoadModules(element)` so that
  modules are only instantiated and initialized when they scroll into view or
  your mouse moves over them.
- Initializes new modules in any arbitrary container element
- Keeps track of the "Default Module", which is the one module on the page that
  should receive focus via `Module.Manager#focusDefaultModule`. This is a great
  way to set focus to a form field and give the user a place to start as the
  page has finished loading (more on that later).

The Module Manager implements the `Module.IManager` interface found in
`src/interfaces.js`.

## The Module Provider Interface: `Module.IProvider`

The Module Provider knows the intimate details of how to initialize a newly
created module. The Module Manager uses the Provider when creating new modules,
so that the messy details of object instantiation and configuration are
abstracted away. You can create your own Provider using this basic template:

    function MyProvider() {
    }

    MyProvider.prototype = {
        factory: null,

        manager: null,

        constructor: MyProvider,

        destructor: function destructor(cascadeDestroy) {
            if (cascadeDestroy && this.factory) {
                this.factory.destructor();
            }

            this.factory = this.manager = null;
        },

        createModule: function createModule(element, type, options) {
            var module = this.factory.getInstance(type);

            module.setElement(element);
            module.setOptions(options);

            if (options.defaultModule) {
                this.manager.setDefaultModule(module);
            }

            // do some more setup work

            return module;
        },

        createModules: function createModule(metaData, callback, context) {
            var modules = [];

            metaData.forEach(function(element, type, options) {
                modules.push(this.createModule(element, type, options));
            }, this);

            return modules;
        }
    };

Then simply give this to the manager:

    var manager = new Module.Manager();
    manager.provider = new MyProvider();

    manager
        .init()
        .eagerLoadModules(document.documentElement);

The Module Provider implements the interface called `Module.IProvider` found in
`src/interfaces.js`.

Next, we'll learn how new modules are instantiated.

## The Module Factory Interface: `Module.IFactory`

The Module Factory is responsible for taking a "module type" and returning a new
instance of a Module. To get the big picture, the "module type" is extracted
from the `data-modules` attribute on an HTML tag:

    <div data-modules="ExampleModule">...</div>

The module factory must support a single public method called `getInstance`
which receives `ExampleModule` as an argument. The factory then instantiates a
new object based on this value and returns it.

The Module Factory that comes baked in to this library is called
`Module.Factory`. It takes the value of `data-modules` and turns that string
into a "class" in JavaScript, and instantiates it. In the example above, the
`data-modules` attribute has the value "ExampleModule", so Module.Factory will
essentially run this code:

    return new ExampleModule();

The Module Factory implements the `Module.IFactory` interface found in
`src/interfaces.js`.

### The Module Factory Template

Use this as a starting point for creating your own Module Factory:

    function MyFactory() {
    }

    MyFactory.prototype.destructor = function destructor() {
        // ready this factory for garbage collection
    };

    MyFactory.prototype.getInstance = function getInstance(type) {
        // do something with type, and return a new object
    };

Because the public interface of the Module Factory is so simple, you can easily
use your own implementation, which is especially useful for when you want to
create your own factory, or to utilize more complex setups like Dependency
Injection and Inversion of Control.

### Dependency Injection and Inversion of Control

There are a number of DI and IoC libraries available. One such library is called
[Hypodermic](https://github.com/gburghardt/hypodermic). As long as the factory
supports a method called `getInstance` which takes a single string argument and
returns an object that implements the `Module.IModule` interface, you can use
any other library you find.

#### Using Hypodermic for Dependency Injection

First, grab a copy of [Hypodermic](https://github.com/gburghardt/hypodermic), or
`bower install hypodermic` if you have Node and Bower installed.

Next, create an instance of Hypodermic and provide the initial description of
how all the classes get wired together:

    var objectFactory = new Hypodermic({
        moduleManager: {
            className: "Module.Manager",
            properties: {
                provider: { id: "moduleProvider" }
            }
        },
        moduleProvider: {
            className: "Module.Provider",
            properties: {
                factory: { id: "objectFactory" }
            }
        },

        // modules
        example: {
            className: "ExampleModule",
            properties: { ... }
        },
        foo: {
            className: "FooModule",
            properties: { ... }
        }
    });

Now use Hypodermic to get the Module Manager object and initialize it:

    <body>
        ...

        <script>
            var objectFactory = new Hypodermic({ ... });

            var manager = objectFactory.getInstance("moduleManager");

            manager
                .init()
                .eagerLoadModules(document.documentElement);
        </script>
    </body>

Now instead of referencing the JavaScript class name in the `data-modules`
attribute in HTML, use the name you gave it in your Hypodermic configuration.

So:

    <div data-modules="ExampleModule">...</div>

Becomes simply:

    <div data-modules="example">...</div>

Lastly, multiple modules can be created on the same root element:

    <div data-modules="example foo">...</div>

This also works for Sub Modules:

    <div data-modules="todoList">
        <ol data-module-property="selection" data-modules="selection">
            ...
        </ol>
    </div>

And the Hypodermic config:

    new Hypodermic({
        moduleManager: {
            ...
        },
        moduleProvider: {
            ...
        },

        todoList: {
            className: "TodoListModule"
        },
        selection: {
            className: "SelectionModule"
        }
    });

You get the full benefit of Dependency Injection in each layer of Module Manager.