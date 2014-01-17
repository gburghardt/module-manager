# Change Log

## Version 1.2.0

- Added a Module Provider (Module.Provider) that is responsible for
  instantiating and configuring new modules. This allows you to provide your own
  implementation if the default Module.Provider doesn't suite your needs.
- Added this CHANGELOG
- Created README

## Version 1.1.0

- Added the auto completer module (Module.AutoCompleterModule). This module
  allows you to easily create type-ahead text boxes.

## Version 1.0.4

- Some performance tuning for lazy loading modules as your scroll around on the
  page. Added some config options to allow you to more finely tune performance.

## Version 1.0.3

- Updated ElementStore to version 1.0.1 so jQuery and Zepto adapters can return
  native DOM nodes. Assists in creating cross library plugins and base classes
  for this library.

## Version 1.0.2

- Added the Form Module (Module.FormModule) allowing you to easily Ajaxify forms
  on the page. Inherit from this class if you want to do any heavy lifting with
  forms and the data inside them.

## Version 1.0.1

- Corrected Bower package name to avoid duplicates: `bower install module`
  becomes `bower install module_controller`

## Version 1.0.0

- Initial version.
