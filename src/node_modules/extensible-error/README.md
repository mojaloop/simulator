# ExtensibleError

> Error base class for Node.js/browsers

Unfortunately, JavaScript's built-in `Error` can't simply be extended like any other class. This module provides a class for Node.js and the browser which is designed to behave like `Error`, but be extensible like any other ES2015 class.

## Installation

``` js
npm install --save extensible-error
```

## Usage

``` js
const ExtensibleError = require('extensible-error')

class CustomError extends ExtensibleError {
  constructor (message, extra) {
    super(message)

    this.extra = extra
  }
}
```
