/**
 * interface Module.IFactory
 *
 * This is the interface that all module factories must implement. The Module
 * Factory is responsible for generating a new instance of a module based on the
 * module type.
 **/
Module.IFactory = {


	/**
	 * Module.IFactory#destructor()
	 *
	 * Make this factory ready for natural garbage collection by the browser.
	 **/
	destructor: function() {},

	/**
	 * Module.IFactory#getInstance(type) -> Module.IModule
	 * - type (String): The type of module to create. This is taken from the
	 *                  data-modules HTML attribute on the web page.
	 *
	 * Create a new module instance and return that object.
	 **/
	getInstance: function(type) {}

};

/**
 * interface Module.ILazyLoader
 *
 * This is the interface used by Module.IManager to lazy load modules.
 **/
Module.ILazyLoader = {

	/**
	 * Module.ILazyLoader#init() -> Module.ILazyLoader
	 *
	 * Initialize this lazy loader and load all modules inside the viewport.
	 **/
	init: function() {},

	/**
	 * Module.ILazyLoader#destructor()
	 *
	 * Ready this lazy loader for garbage collection by the browser.
	 **/
	destructor: function() {},

	/**
	 * Module.ILazyLoader#setElement(element) -> Module.ILazyLoader
	 * - element (HtmlElement): The DOM node that contains all the modules you want lazy loaded
	 *
	 * Sets the DOM node in which all the lazy loaded modules live. This method
	 * must be called before calling Module.ILazyLoader#init().
	 **/
	setElement: function(element) {},

	/**
	 * Module.ILazyLoader#setManager(manager) -> Module.ILazyLoader
	 * - manager (Module.IManager): The module manager object
	 *
	 * Sets the module manager that is responsible for creating new modules.
	 **/
	setManager: function(manager) {},

	/**
	 * Module.ILazyLoader#setOptions(overrides) -> Module.ILazyLoader
	 * - overrides (Module.ILazyLoaderOptions): Options overrides for this lazy loader.
	 *
	 * Override default options for this lazy loader.
	 **/
	setOptions: function(overrides) {}

};

/**
 * interface Module.ILazyLoaderOptions
 *
 * Options for Module.ILazyLoader
 **/
Module.ILazyLoaderOptions = {

	/**
	 * Module.ILazyLoaderOptions#resizeTimeout -> Number
	 *
	 * The interval in milliseconds at which the viewport dimensions are checked
	 * in order to detect that the user has stopped resizing the browser window.
	 **/
	resizeTimeout: 250,

	/**
	 * Module.ILazyLoaderOptions#scrollTimeout -> Number
	 *
	 * The interval in milliseconds at which to check the scroll position on the
	 * page in order to detect that the user has stopped scrolling.
	 **/
	scrollTimeout: 250

};

/**
 * interface Module.IManager
 *
 * This is the interface that Module.Manager implements. If you ever want to
 * replace Module.Manager with your own implementation, you must define these
 * methods.
 **/
Module.IManager = {

	/**
	 * Module.IManager#destructor(cascadeDestroy = false)
	 * - cascadeDestroy (Boolean): Destroy the module provider as well
	 *
	 * Ready this module manager for natural garbage collection by the browser.
	 * By default, object pointers are just nullified. If true is passed, call
	 * destructor on the provider as well.
	 **/
	destructor: function(cascadeDestroy) {},

	/**
	 * Module.IManager#init() -> Module.IManager
	 *
	 * Initialize this manager and ready it for use. Returns itself.
	 **/
	init: function() {},

	/**
	 * Module.IManager#createModule(element, type[, options[, register = false]]) -> Module.IModule
	 * - element (HtmlElement): The HTML element in which this module should live
	 * - type (String): The type of module to create, which is passed on to the provider, and then the factory
	 * - options (Object): A key-value pair of settings to configure the new module
	 * - register (Boolean): When true, register the new module instance with the manager
	 *
	 * Create a new module in an element with the provided options.
	 **/
	createModule: function(element, type, options, register) {},

	/**
	 * Module.IManager#createModules(element)
	 * - element (HtmlElement): The HTML element that all new modules should live in
	 *
	 * Creates new modules whose root element is the value passed in.
	 **/
	createModules: function(element) {},

	/**
	 * Module.IManager#eagerLoadModules(element) -> Module.IManager
	 * - element (HtmlElement): An HTML element
	 *
	 * Proactively find, instantiate and initialize all modules found inside the
	 * element. Returns itself.
	 **/
	eagerLoadModules: function(element) {},

	/**
	 * Module.IManager#lazyLoadModules(element, options) -> Module.IManager
	 * - element (HtmlElement): An HTML element
	 * - options (Module.ILazyLoaderOptions): Option overrides for the lazy loader
	 *
	 * Start lazy loading modules.
	 **/
	lazyLoadModules: function (element, options) {},

	/**
	 * Module.IManager#focusDefaultModule(anything = false)
	 * - anything (Boolean): Whether or not to set focus to any focusable element, or just form fields
	 *
	 * Set focus to the "default" module. This is useful for when the page loads
	 * and the user needs a place to start.
	 **/
	focusDefaultModule: function(anything) {},

	/**
	 * Module.IManager#initModuleInContainer(element, container, config, template, type, module)
	 * - element (HtmlElement): The root element for the new module
	 * - container (HtmlElement): The HTML element in which the new module root element should be inserted
	 * - config (Module.InitConfigOptions): A config object used to create the new module element and insert it
	 * - template (HtmlElement): The <script type="text/html" /> element holding the template used to
	 *                           create the initial markup for this new module.
	 * - type (String): The type of module that was just created
	 * - module (Module.IModule): The newly created module
	 *
	 * Initialize a new module in a container element, and insert the module's
	 * root element in the page. Use this if you need to dynamically create a
	 * new module after page load.
	 **/
	initModuleInContainer: function(element, container, config, template, type, module) {},

	/**
	 * Module.IManager#markModulesCreated(element, metaData)
	 * - element (HtmlElement): The root element for a group of modules
	 * - metaData (Module.MetaData): The meta data for the group of modules
	 *
	 * Set special HTML attributes marking the modules on the element as being
	 * created and initialized so duplicate modules are not created later on.
	 **/
	markModulesCreated: function(element, metaData) {},

	/**
	 * Module.IManager#registerModule(type, module)
	 * - type (String): The module type
	 * - module (Module.IModule): The module to register
	 *
	 * Register a module in this manager, which then becomes accessible via:
	 * - module.groups[type][i] (where i is a number)
	 * - module.registery[ module.guid ]
	 **/
	registerModule: function(type, module) {},

	/**
	 * Module.IManager#setDefaultModule(module)
	 * - module (Module.IModule): The default module
	 *
	 * Set the module that should receive focus automatically when the
	 * focusDefaultModule() method is called.
	 **/
	setDefaultModule: function(module) {},

	/**
	 * Module.IManager#unregisterModule(module)
	 * - module (Module.IModule): The module to unregister
	 *
	 * Unregister a module from this manager. Does not call destructor on the
	 * module.
	 **/
	unregisterModule: function(module) {}
};

/**
 * class Module.InitConfigOptions
 *
 * This class gives the configs for initModuleInContainer()
 **/
Module.InitConfigOptions = {
	/**
	 * Module.InitConfigOptions#className -> String
	 *
	 * One or more CSS class names to add to the module's root element
	 **/
	className: "",

	/**
	 * Module.InitConfigOptions#insert -> String
	 *
	 * The location in the container element in which to insert the module's
	 * root element. Valid values: "bottom", "top"
	 **/
	insert: "bottom",

	/**
	 * Module.InitConfigOptions#renderData -> Object
	 *
	 * Arbitrary data used to render the initial markup for a new module.
	 *
	 * #{foo} in the template source code gets replaced with renderData.foo
	 *
	 * Every new module template comes with three tags by default:
	 *
	 * - #{guid} --- The Module's GUID
	 * - #{createdAt} --- The current date as a string
	 * - #{timestamp} --- The current date as a timestamp
	 **/
	renderData: null
};

/**
 * interface Module.IModule
 *
 * This is the interface that all module objects must implement in order to be
 * compatible with the Module Manager.
 **/
Module.IModule = {

	/**
	 * Module.IModule#guid -> String
	 *
	 * The Globally Unique Identifier for this module used by the manager when registering.
	 **/
	guid: "...",

	/**
	 * new Module.IModule();
	 *
	 * Class constructor with no arguments.
	 **/
	constructor: function() {},

	/**
	 * Module.IModule#destructor(keepElement = false)
	 * - keepElement (Boolean): Whether or not to keep the element attached to the document tree upon destroying
	 *
	 * Ready this module for garbage collection. When true is passed, the root
	 * element for this module is removed from the document.
	 **/
	destructor: function(keepElement) {},

	/**
	 * Module.IModule#init([elementOrId[, options]]) -> Module.IModule
	 * - elementOrId (String | HtmlElement): This module's root element Id or node reference
	 * - options (Object): Runtime configurable options for this module
	 *
	 * Initialize this module and ready it for use.
	 **/
	init: function(elementOrId, options) {},

	/**
	 * Module.IModule#focus(anything)
	 * - anything (Boolean): Set focus to any focusable element, or just form fields
	 *
	 * Set focus to this module. By default, the first available form field
	 * receives the focus, and selects text. If true is passed, then the first
	 * focusable element found inside the module is set focus to, including
	 * anchor tags and buttons.
	 **/
	focus: function(anything) {},

	/**
	 * Module.IModule#setElement(elementOrId)
	 * - elementOrId (String | HtmlElement): This module's root element Id or node reference
	 *
	 * Set the root element for this node.
	 **/
	setElement: function(elementOrId) {},

	/**
	 * Module.IModule#setOptions(options)
	 * - options (Object): Runtime configurable options for this module
	 *
	 * Set the runtime configurable options for this module.
	 **/
	setOptions: function(options) {}

};

/**
 * interface Module.IProvider
 *
 * This interface must be implemented by all module providers used by the
 * manager to create new module instances.
 **/
Module.IProvider = {

	/**
	 * Module.IProvider#destructor(cascadeDestroy)
	 * - cascadeDestroy (Boolean): When true, call destructor on the module factory
	 *
	 * Ready this provider for garbage collection.
	 **/
	destructor: function(cascadeDestroy) {},

	/**
	 * Module.IProvider#createModule(element, type, options) -> Module.IModule
	 * - element (HtmlElement): The root element for the new module
	 * - type (String): The module type
	 * - options (Object): Runtime configurable options for the new module
	 *
	 * Create a new module.
	 **/
	createModule: function(element, type, options) {},

	/**
	 * Module.IProvider#createModules(metaData, callback[, context]) -> Array<Module.IModule>
	 * - metaData (Module.MetaData): Meta data for the new modules
	 * - callback (Function): A function invoked after each module has been created
	 * - context (Object): The object that "this" refers to in the callback
	 *
	 * Create all the modules for the given meta data and return them.
	 **/
	createModules: function(metaData, callback, context) {}

};

Module.IModuleObserver = {

	onModuleCreated: function(module, element, type) {},

	onSubModuleCreated: function(module, element, type) {},

	onModuleRegistered: function(module, type) {},

	onModuleUnregistered: function(module) {}

};
