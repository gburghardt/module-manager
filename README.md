# Module Controller

Module Controller is the power behind [Foundry](https://github.com/gburghardt/foundry).
It gives you an easy and centralized way to manage "modules" on the page -- self
contained JavaScript classes that manage all user interaction from one root
element on down. It has four main components:

1. A base class called Module, which bakes in many usefull lifecycle events and
   functionality.

2. A Module Manager, which is responsible for creating new modules either at
   page load, or as the user scrolls.

3. A Module Provider, which does the dirty work of instantiating and configuring
   new modules as the Manager sees fit.

4. A Module Factory responsible for churning out new instances of Modules.

## A Quick Example

First, the JavaScript class for our Module:

    var ExampleModule = Module.extend({
        prototype: {
            actions: {
                click: [
                    "greet"
                ]
            },

            options: {
                backgroundColor: "#f0f0f0"
            },

            _ready: function() {
                Module.prototype._ready.call(this);

                this.element.style.backgroundColor = this.options.backgroundColor;
            },

            greet: function(event, element, params) {
                event.stop();

                var name = prompt("What is your name?", "");

                alert("Hi, " + name + "!");
            }
        }
    });

Now, the HTML and JavaScript to bootstrap everything:

    <body>
        <div data-modules="ExampleModule">
            <p>
                <button data-action="greet">Greet</button>
            </p>
        </div>

        <div data-modules="ExampleModule" data-module-options='{"backgroundColor": "#f0ffff"}'>
            <p>
                <button data-action="greet">Greet</button>
            </p>
        </div>

        <script type="text/javascript" src="/path/to/module.js"></script>
        <script type="text/javascript" src="/path/to/module/factory.js"></script>
        <script type="text/javascript" src="/path/to/module/provider.js"></script>
        <script type="text/javascript" src="/path/to/module/manager.js"></script>
        <script type="text/javascript" src="/path/to/module/example_module.js"></script>
        <script type="text/javascript">
            var moduleManager = new Module.Manager();

            moduleManager
                .init()
                .eagerLoadModules(document.documentElement);
        </script>
    </body>

A special HTML5 attribute called `data-modules` is used to find the root element
of a module and create that new object instance. It becomes very easy to reuse
JavaScript code. In the example above, there are two instances of ExampleModule
on the page, each with its own `div` tag.

## Getting Started

Here's how to get started using Module Controller:

1. Install NodeJS and Bower

2. Next, open a command shell and navigate to the directory containing this
   README.

3. Type `bower install` to suck down all the dependencies. They get installed in
   the `vendor` directory.

4. Open `demo/index.html` in a browser. No need for a web server.

## Base Module Types

There are several base classes for creating your own Modules.

### Module

The base class for most modules. It provides many usefull methods and
properties. This doesn't mean you have to use this base class. As we'll see
later, the Module Manager only cares about the Module Interface, so you can
define your own class hierarchy, or retrofit existing classes.

### Module.FormModule

This provides the base class for modules that want an easy way to Ajaxify forms.

### Module.AutoCompleterModule

A very handy class for creating type-ahead form fields. See
`demo/auto_completer/index.html` for an example.

## The Module Interface

The Module base class has many dependencies. If you want to trim down the
dependencies and roll your own framework, you can still use the Module Manager
to lazy load modules. Your "module" classes only need to implement this
interface:

- An empty constructor. All modules must be instantiable, and the constructor
  must take no arguments.
- An `init` method which takes two optional parameters: `element` and `options`.
  - The `element` argument can either be an HTML tag Id, or any HTML element
  - The `options` argument is just a plain old JavaScript object that is used
    to provide runtime configurable options taken from the `data-module-options`
    attribute of the module's root element.
- A method called `setElement` which takes either an HTML tag Id or HTML element.
- A method called `setOptions` which gets passed the same object as the second
  argument to `init`.
- A method called `destructor` which is used to ready this module for natural
  garbage collection by the browser. It takes an optional boolean argument. When
  `true` is passed, the root element of the module should remain in the
  document, otherwise the module should remove the element from the document.
- A method called `focus` which will set focus to an element inside this module.
  It takes a boolean argument, where if `true` is passed, the first focusable
  element receives focus (even links). If false is passed (the default value)
  then only the first editable field will receive focus.

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

            this.document = this.element.ownerDocument;
            this.window = this.document.defaultView || this.document.parentWindow;
            this.options = this.options || {};

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
                ? this.element.querySelector("a, input, textarea, select")[0]
                : this.element.querySelector("input, textarea, select")[0];

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
        },

        setOptions: function setOptions(options) {
            for (var key in options) {
                if (options.hasOwnProperty(key)) {
                    this.options[key] = options[key];
                }
            }
        }
    };

## The Module Manager

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

## The Module Provider

The Module Provider knows the intimate details of how to initialize a newly
instantiated module. The Module Manager uses the Provider when creating new
modules, so that the messy details of object instantiation and configuration are
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

Next, we'll learn how new modules are instantiated.

## The Module Factory

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

Because the public interface of the Module Factory is so simple, you can easily
use your own implementation, which is especially useful for when you want to
create your own factory, or to utilize more complex setups like Dependency
Injection and Inversion of Control.

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

### Dependency Injection and Inversion of Control

There are a number of DI and IoC libraries available. One such library is called
[Hypodermic](https://github.com/gburghardt/hypodermic). As long as the factory
supports a method called `getInstance` which takes a single string argument and
returns an object that implements the Module Interface, you can use any other
library you find.

#### Using Hypodermic for Dependency Injection

First, grab a copy of [Hypodermic](https://github.com/gburghardt/hypodermic), or
`bower install hypodermic` if you have Node and Bower installed.

Next, create an instance of Hypodermic and provide the initial description of
how all the classes get wired together:

    var objectFactory = new Hypodermic({
        moduleManager: {
            className: "Module.Manager",
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

## Deep Dive into Modules

This section gives you all the details on how to create modules, and the
various options available to you. From this standpoint, you are mostly dealing
with HTML, and the factory and provider that ships with Module Controller.

Earlier we saw how the root element of a module was determined by the
`data-modules` attribute found in HTML. Next, we saw that you can provide some
runtime configurable options in the `data-module-options` attribute.

### Create One Module

This allows you to create a single instance of `ExampleModule` on a `div` tag.

    <div data-modules="ExampleModule">
        ...
    </div>

Now, let's provide some runtime configurable options:

    <div data-modules="ExampleModule" data-module-options='{"backgroundColor: "red" }'>
        ...
    </div>

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

### Sub Modules

A Sub Module is a module within a module, both in HTML and JavaScript. Let's say
you have two JavaScript classes: TodoListModule, which allows you to add, remove
and complete TODO list items; and SelectionModule, which allows you to select
and apply bulk actions to multiple items.

The abbreviated source code of TodoListModule might look something like this:

    var TodoListModule = Module.extend({
        prototype: {
            selection: null,

            _ready: function() {
                this.selection = new SelectionModule();
                this.selection.init(this.element.querySelector("ol"));
                // ... other stuff to do
            }
        }
    });

And your HTML:

    <div data-modules="TodoListModule">
        <ol>...</ol>
    </div>

We have an architectural problem here. The TodoListModule is dependent upon
SelectionModule. There is nothing wrong with needing a "selection module",
rather the problem is that TodoListModule is acquiring its own dependency for
selecting and deselecting items. Additionally, when you look at the HTML
structure it's difficult to know what the root element of the "selection module"
is. Let's have the Module Manager wire these two together for us!

In order to do this, you need to include
`lib/module/manager/sub_module_properties.js` in your site.

First, let's change the JavaScript:

    var TodoListModule = Module.extend({
        prototype: {
            selection: null,

            _ready: function() {
                // ... other stuff to do
            }
        }
    });

We will no longer need code to instantiate and initialize the selection module.
The last piece of the puzzle is the addition of another couple of HTML
attributes defining the root element for our selection module, and the name of
the property this object instance should be assigned to in our TodoListModule:

    <div data-modules="TodoListModule">
        <ol data-module-property="selection" data-modules="SelectionModule">
            ...
        </ol>
    </div>

The Module Manager will create an instance of SelectionModule using the `ol` as
the root element, and it will automatically stash that object reference as the
`selection` property on our TodoListModule.

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
in the class definition for TodoListModule in order for this to work:

    var TodoListModule = Module.extend({
        prototype: {
            selections: [], // <-- This is now an Array

            _ready: function() {
                // ... other stuff to do
            }
        }
    });

Now, the HTML:

    <div data-modules="TodoListModule">
        <ol data-module-property="selections" data-modules="SelectionModule">...</ol>

        Some other HTML...

        <ol data-module-property="selections" data-modules="SelectionModule">...</ol>
    </div>

Since the `selections` property in the class definition is an array, the Module
Manager will push a new instance of SelectionManager onto the
TodoListModule#selections property. Using the HTML snippet above, the instance
of TodoListModule would have a `selections` property that contains two different
instances of SelectionModule. Each SelectionModule can be configured
differently as well by using the `data-module-options` attribute.

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
querying the document for it's module dependencies. If using something like
Hypodermic as the module factory, you get the full benefit of Dependency
Injection for your sub modules as well!

## Writing Module Classes

This section deals with how to write your own Module classes. We'll start by
creating our own "SelectionModule". First, the JavaScript.

    var SelectionModule = Module.extend({
        prototype: {
            actions: {
                click: [
                    "toggle"
                ]
            },

            elementStore: {
                elements: {
                    list: { selector: "ol" },
                    selectedItemCount: { selector: "span" }
                },
                collections: {
                    selectedItems: { selector: "ol > li[data-selected]", nocache: true }
                }
            },

            options: {
                backgroundColor: "#F0F0F0";
            },

            toggle: function(event, element, params) {
                event.preventDefault();

                if (element.getAttribute("data-selected")) {
                    element.removeAttribut("data-selected");
                    element.style.backgroundColor = "";
                }
                else {
                    element.setAttribute("data-selected", "true");
                    element.style.backgroundColor = params.bgcolor || this.options.backgroundColor;
                }

                this.selectedItemsCount().innerHTML = this.selectedItems().length;
            }
        }
    });

There are four main components to this class:

1. The **actions** property describes the DOM events this module subscribes to,
   and which methods on this module will get executed. The element that triggers
   the event is something we'll cover in a little bit.

2. The **elementStore** property defines the common DOM nodes that our module
   will interact with. It caches references to those nodes only when called
   upon, saving valuable startup time.

3. The **options** property contains some runtime configurable options. In this
   case, the background color applied to selected items.

4. The **toggle** method is an event handler, which we will explain more after
   discussing the HTML structure.

Next, let's look at the HTML structure required for this module:

    <div data-modules="SelectionModule">
        Selected Items: <span>0</span>

        <ol>
            <li data-action="toggle">Item #1</li>
            <li data-action="toggle" data-actionparams='{ "bgcolor": "yellow" }'>Item #2</li>
        </ol>
    </div>

First, we see our normal DIV tag with a `data-modules` attribute on it. The
interesting tidbits are the `li` tags with a new attribute we haven't
encountered before: `data-action`.

The `data-action` attribute is where the worlds of HTML and JavaScript collide.
The value of this attribute is the name of a method on SelectionManager. Earlier
in the `actions` property of SelectionManager, we said that the "click" event
will call the "toggle" method. The `data-action` attribute provides that glue.
When the user clicks on an `li` tag or anything inside of it, the
SelectionManager#toggle() method gets called because of the
`data-action="toggle"` attribute. Now, let's explore how DOM events are
processed.

### Event Handlers

To wire up an event handler, three components are required:

1. An entry in a Module's `actions` property defining which type of DOM event
   will call that method

2. The event handler method in the JavaScript class taking three arguments:
   `event`, `element`, and `params`

3. The `data-action` attribute in HTML telling your Module the method that
   should be invoked, and the HTML tag that is the focus of that event.

Below is a snippet of HTML and JavaScript to better illustrate these three
components:

    <script>
        var SelectionModule = Module.extend({
            prototype: {
                actions: {
                    click: [
                        "toggle" // 1) Call the "toggle" method on click
                    ]
                },

                elementStore: { ... },

                options: { ... },

                // 2) This method is an event handler because it takes event, element, and params
                toggle: function(event, element, params) {
                    ...
                }
            }
        });
    </script>

    <div data-modules="SelectionManager">
        <ol>
            <!--
                3) The "action" performed by the user is "toggle"
                and the focus of this event is the <li> tag.
            -->
            <li data-action="toggle"></li>
        </ol>
    </div>

Now, let's look into the "toggle" method more in-depth.

    toggle: function(event, element, params) {
        // 1) Prevent the default action of "click"-ing on something
        event.preventDefault();

        // 2) Select or deselect an item
        if (element.getAttribute("data-selected")) {
            element.removeAttribute("data-selected");
            element.style.backgroundColor = "";
        }
        else {
            element.setAttribute("data-selected", "true");

            // 3) Set the background color of the newly selected item
            element.style.backgroundColor = params.bgcolor || this.options.backgroundColor;
        }

        // 4) Update a visible count of the selected items
        this.selectedItemsCount().innerHTML = this.selectedItems().length;
    }

The three arguments to every event handler are as follows:

- `event`: This is the browser event object
- `element`: This is the HTML element that had the `data-action` attribute on
  it. In our case, the `element` variable will reference the `li` tag the user
  clicked on, regardless of whether or not the `li` tag was the target of the
  event. Note that `event.target` is not always the same as `element`.
- `params`: This is an object that can contain arbitrary parameters to this one
  event handler. In a moment, we'll see how the `data-actionparams` attribute is
  used to create this object. By default, the `params` variable references an
  empty object.

The "toggle" method does four things each time the user clicks on an `li` tag:

1. The default action of the event is prevented, in case the user clicks on a
   link. `event.preventDefault()`

2. Some custom logic to select or deselect an item

3. When selecting an item, we set the background color of `element`. The
   background color defaults to the value in `this.options.backgroundColor`, but
   if the `data-actionparams` attribute on the `li` tag has a property called
   "bgcolor", that color is used instead.

4. We update a count of the number of selected items for the user's benefit.

The interesting parts are actually in numbers 3 and 4. First, let's explorer the
`params` argument to the event handler. We'll start out by reviewing the HTML
for our module:

    <div data-modules="SelectionModule">
        Selected Items: <span>0</span>

        <ol>
            <li data-action="toggle">Item #1</li>
            <li data-action="toggle" data-actionparams='{ "bgcolor": "yellow" }'>Item #2</li>
        </ol>
    </div>

The `li` tags have the `data-action` attributes. When clicking on "Item #1", the
arguments to SelectionModule#toggle will be:

1. `event`: The browser event object
2. `element`: The `li` tag containing the text "Item #1"
3. `params`: An empty object

When the user clicks on "Item #2", the arguments to SelectionModule#toggle will
be:

1. `event`: The browser event object
2. `element`: The `li` tag containing the text "Item #2"
3. `params`: An object with a property called "bgcolor", which is set to
   "yellow". This overrides the backgroundColor defined in the `options`
   property in this module's class definition.

When the user clicks on "Item #1" it will be highlighted in a light gray. When
the user clicks on "Item #2", the item gets highlighted in yellow because of
the `params` object parsed from the `data-actionparams` attribute on that `<li>`
tag.

The last line of the "toggle" method refers to two other methods that were not
defined in our SelectionModule:

    toggle: function(event, element, params) {
        ...

        this.selectedItemsCount().innerHTML = this.selectedItems().length;
    }

Where did they come from? The Element Store. Our class definition has a property
called `elementStore`:

    var SelectionModule = Module.extend({
        prototype: {
            actions: { ... },

            elementStore: {
                elements: {
                    list: { selector: "ol" },
                    selectedItemCount: { selector: "span" }
                },
                collections: {
                    selectedItems: { selector: "ol > li[data-selected]", nocache: true }
                }
            },

            options: { ... },

            toggle: function(event, element, params) { ... }
        }
    });

It defines the HTML elements inside our Module that we will commonly interact
with. The Element Store is broken down into two categories:

- elements: References to a single HTML element inside this module
- collections: References to element collections inside this module

Inside each category, we see the descriptive name, followed by the CSS selector
used to grab a reference to that element.

Before the module's `_ready` method is called, the Element Store is initialized.
It reads all these descriptive names and creates "getter" methods on
SelectionModule so we can easily reference them later on.

That means the Element Store creates three new methods on SelectionManager
without any intervention on our end:

- `list`: Returns the `<ol>` tag that holds all the selectable items
- `selectedItemCount`: The `<span>` tag that shows the user how many items are
  selected
- `selectedItems`: A collection of all `<li>` tags that have a `data-selected`
  attribute. You can use a normal `for` loop to iterate over these selected
  items.

The "selectedItems" have an additional property called `nocache: true`, which
causes the Element Store to always return a fresh, non cached list of the
selected items.

By default, the Element Store:

- Caches references to HTML elements so the CSS selector used to get the
  elements is only run once during the lifetime of a module.
- Defers fetching HTML elements until they are needed, saving on valuable CPU
  cycles during page load.
- Generates "getter" methods on your module classes the first time an instance
  of that class is brought to life so it is easy to use those DOM node
  references.

You may access the Element Store directly in your module using
`this.elementStore`.

You may use `this.clearElementStoreCache()` to purge any cached element
references if the document tree inside the module has changed.

So, back to the last line in SelectionManager#toggle:

    toggle: function(event, element, params) {
        ...

        this.selectedItemsCount().innerHTML = this.selectedItems().length;
    }

The `selectedItemsCount` method is generated for us by the Element Store. It
returns a `<span>` tag.

The `selectedItems` method returns an Array-like collection of `<li>` tags that
the user has clicked on. The `length` property of this collection is set as the
`innerHTML` of the `<span>` returned by `selectedItemsCount()`.