# merge-object-files

Merges a directory containing json or other files exporting objects and merges them into a single object.

Sub directories and files become keys under the merged objects, with file contents becoming values.

Requires Node 6.

### api

`merge-object-files` exposes a single method.

- `merge(dirname, extensions, \*optional*\ callback)` - merges the given `dirname`.

Arguments:

- `dirname` - the directory to merge - defaults to caller's directory.
- `extensions` - an array of extensions to accept - defaults to `['json']`.
- `callback` - if omitted, a promise is returned.

### usage

```js
const Files = require('merge-object-files');
const Path = require('path');

Files.merge(Path.resolve(__dirname, 'objects'), ['json', 'js'])
.then((merged) => {
    //...
})
.catch((error) => {
    console.error(error.stack);
});
```
