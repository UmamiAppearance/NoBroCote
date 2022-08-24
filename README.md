# NoBroCote
[![License](https://img.shields.io/github/license/UmamiAppearance/NoBroCote?color=009911&style=for-the-badge)](./LICENSE)
[![npm](https://img.shields.io/npm/v/no-bro-cote?color=009911&style=for-the-badge)](https://www.npmjs.com/package/no-bro-cote)


**No**de **Bro**wser **Co**de **te**sting. _Run unit tests on your JavaScript code for the browser._  
  
**NoBroCote** is designed for the automation of testing JavaScript code which is made for the browser. It provides methods to run the code units inside of a headless browser via [Puppeteer](https://github.com/puppeteer/puppeteer). Unlike many of the big players in code testing it is not a swiss army knife for every purpose, but particularly to test the code designed for the browser via node, without having to open a browser, and also without writing the test environment from scratch every time.  
  
No big learning curve involved! A Unit takes a name, an expected result and a function, which is the test, that's all. 

## Use case
This software is designed to test if an application for the browser is correctly working.
 - Is it loading into the HTML page?
 - Is it creating the required DOM elements?
 - Is it responding?
 - Is it serving the correct output?
 - etc.

_It is not suitable for UI tests_, reacting to (touch) input and anything like that, or testing if the code is running consistent over different browsers.

## Installation
**NoBroCote** is made for unit tests with node.js, therefore a installation via npm is advisable. As it is most likely is only needed for testing with the ``--save-dev`` flag.

```sh
npm install no-brote-cote --save-dev
```

## Usage
The first step is to create a new ``.js`` file (most likely in your test folder), [import](#importing) a `test`-instance, create one ore more a [test units](#creating-test-units), finally [initialize](#initializing-the-tests).
    
**(Psst. No 'time' for reading? Jump straight to a basic [sample code](https://github.com/UmamiAppearance/NoBroCote#Basic-Sample-Code).)**  
  
To run the test(s), you can use the [**CLI**](#cli).


### Importing
Inside of your js-file, import a `test`-instance.  
```js
import { test } from "no-bro-code";
```


### Creating Test Units
Now it is time to create a test unit. A unit takes:  
- ``name`` _\<string\>_ Unit Name
- ``expect`` _\<*\>_ Expected result 
- ``fn`` _\<Function\>_ The actual test. A function for testing.
- ``fnArgs`` _\<...any\>_ Optional parameters for the function. 

The function has access to the html page. It acts like a single function you would execute in a script tag. It has access to all scripts and modules passed via ``addScript`` or ``addImport``. The function can be asynchronous or not. It must return something which can be compared with the expected result.  

**Example:**  
```js
test.makeUnit(
    "my first unit",
    "hello",
    (greeting) => {
        document.body.textContent = greeting;
        return document.body.textContent;
    },
    "hello"
);
```

### Controlling the Test Assertion
The regular assertion compares the expected value and the result for equality without type conversion (===). If this is not the desired behavior, there are some operators available to control the assertion process. Operators are activated by passing them to the expect parameter of a ``makeUnit`` method.  
  
_Available operators are:_
 -  ``!|`` not
 - ``!=|`` not, with type conversion
 -  ``||`` or, values can be separated with a '|', like this: ||valueA|valueB|valueC
 - ``==|`` equality, with type conversion

**Examples:**
```js
test.makeUnit(
    "notTest",
    "!|cat",
    () => {
        document.body.textContent = "dog";
        return document.body.textContent;
    }
);

test.makeUnit(
    "orTest",
    "||cat|dog|bird",
    () => {
        const pickPet = () => ["cat", "dog", "bird"].at(Math.floor(Math.random()*3));
        document.body.textContent = pickPet();
        return document.body.textContent;
    }
);
```


### Controlling Errors
Sometimes it is necessary to test if an error is thrown. The test should throw the error, but that is the desired behavior not a failure. Similar to the just featured operators there are operators for errors (those keywords are also passed to the expect parameter).
_Those are:
 - ``e|`` (for allowing all errors)
 - ``e|EvalError``
 - ``e|InternalError``
 - ``e|RangeError``
 - ``e|ReferenceError``
 - ``e|SyntaxError``
 - ``e|TypeError``
 - ``e|URIError``

**Example:**

```js
test.makeUnit(
    "expectErrorTest",
    "e|TypeError",
    () => {
        throw new TypeError("I am glad this error was raised!");
    }
);
```

#### Custom Errors
Custom errors can be also be added to error list:
```js
// first create the error (or import it from somewhere else)
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}

// second append it to the error list
test.errorList.push(ValidationError.name);

// now it can be used with: 'e|ValidationError'
```

### Expecting a Failure
Assuming a situation, where an error should be raised, but the test should not fail. It is possible to anyhow count this as a success. With the setting:
```js
test.expectFailure = true;
```
\- at least one unit has to fail.


### Importing Scripts and Modules

#### addScript
This method appends a script tag to the html page. The method requires an object which can have the following keys (as defined by **Puppeteer**):
 - ``url`` _\<string\>_ URL of a script to be added.
 - ``path`` _\<string\>_ Path to the JavaScript file to be injected into frame. If path is a relative path, then it is resolved relative to projects root directory (cwd).
 - ``content`` _\<string\>_ Raw JavaScript content to be injected into frame.
 - ``type`` _\<string\>_ Script type. Use 'module' in order to load a Javascript ES6 module.
 
_You can also pass an array of objects. An **example** may look like so:_

```js
test.addScript({
    path: "./path/to/script"
});
 ```

Also see: [devdocs.io/puppeteer](https://devdocs.io/puppeteer/).

#### addImport
This method provides ES6 imports for the test runner. In contrast to ``addScripts``, this method needs a valid ES6 import statement as a string. These imports are directly accessible by the test units as they are part of one script tag in the browser.
 - Relative imports are resolved relative to the projects root directory (cwd).
 - Multiple imports can be passed as an array. _A possible **example** may be as follows:_

```js
test.addImport('import myModule from "./path/to/module"');
 ```

### HTML Page
By default a very skeleton of an HTML page is getting opened, on which the tests are getting injected. But also it is possible to load a custom HTML page. The page has to be reachable from the projects root folder and its path has to be declared relative to root. Assuming a HTML page with the path `./test/fixtures/page.html` the declaration inside of the test file may look as follows:

```js
test.htmlPage = "./test/fixtures/page.html";
```

### Server Port
By default the server runs on port ``10000``. If the port is already in use the port number is raised by one if an open port was found. The initial port can be changed, if this is a bad starting point for any reason. Simply declare another port in that case.
```js
test.port = 8080;
```


### Initializing the tests
After all imports are done and all units are declared, all that is left to do is to set the following line at the end of the file:

```js
test.init();
 ```

The js file could now be called with node from the projects root directory:

```sh
node ./path/to/file.js
```

Much more convenient is to use the [CLI](#cli), by adding it to the test section of your ``package.json``

```json
"scripts": {
    "test": "no-bo-cote",
}
```


## Basic Sample Code
```js
import { test } from "no-bro-cote";

// imports (optional)
test.addScript({at the end of the file
    path: "./path/to/script"
});

test.addImport('import myModule from "./path/to/module"');


// units
test.makeUnit(
    "myFirstUnit",
    "hello",
    () => {
        document.body.textContent = "hello";
        return document.body.textContent;
    }
);

test.makeUnit(
    "myNotUnit",
    "!|hello",
    async (argExample) => {
        document.body.textContent = argExample;
        return document.body.textContent;
    },
    "world"
);

test.makeUnit(
    "myExpectErrorUnit",
    "e|ReferenceError",
    () => {
        const thisIsPython = False;
    }
);


// last step -> the file is now callable from the projects root directory and by the CLI
test.init();
```

## CLI
The **CLI** is for the most part inspired/adopted from the great [AVA](https://github.com/avajs/ava/blob/main/docs/05-command-line.md) test runner.

```console
no-bro-cote [<pattern>...]

Positionals:
  pattern  Select which test files to run. Leave empty if you want to run all
           test files as per your configuration. Accepts glob and minimatch
           patterns, directories that (recursively) contain test files, and
           relative or absolute file paths.                             [string]

Options:
      --help              Show help                                    [boolean]
      --version           Show version number                          [boolean]
      --debug             Enable debug mode                            [boolean]
      --fail-fast         Stop after first test failure                [boolean]
      --ignore-coherence  Skip test for a coherent test file           [boolean]
  -s, --serial            Run tests serially                           [boolean]

Examples:
  no-bro-cote
  no-bro-cote test.js
  no-bro-cote ./test/
  no-bro-cote "**/**test.js"
  ```

If no patterns are provided **no-bro-cote** searches for test files using the following patterns:

* `test.js`
* `src/test.js`
* `source/test.js`
* `**/test-*.js`
* `**/*.spec.js`
* `**/*.test.js`
* `**/test/**/*.js`
* `**/tests/**/*.js`
* `**/__tests__/**/*.js`

Files inside `node_modules` and files inside directories starting with `.git` are *always* ignored. So are files starting with `_` or inside of directories that start with a single `_`. Additionally, files matching these patterns are ignored by default, unless different patterns are configured:

* `**/__tests__/**/__helper__/**/*`
* `**/__tests__/**/__helpers__/**/*`
* `**/__tests__/**/__fixture__/**/*`
* `**/__tests__/**/__fixtures__/**/*`
* `**/test/**/helper/**/*`
* `**/test/**/helpers/**/*`
* `**/test/**/fixture/**/*`
* `**/test/**/fixtures/**/*`
* `**/tests/**/helper/**/*`
* `**/tests/**/helpers/**/*`
* `**/tests/**/fixture/**/*`
* `**/tests/**/fixtures/**/*`

When using `npm test`, you can pass positional arguments directly `npm test test2.js`, but flags needs to be passed like `npm test -- --debug`.


### Configuration
All of the **CLI** [options](#options) can be configured in the `no-bro-cote` section of your `package.json` file. This allows you to modify the default behavior of the `no-bro-cote` command, so you don't have to repeatedly type the same options on the command prompt.

To ignore files, prefix the pattern with an `!` (exclamation mark).

**`package.json`:**

```json
{
  "no-bro-cote": {
    "debug": false,
    "extensions": [
      "js",
      "mjs"
    ],
    "failFast": true,
    "files": [
      "test/**/*",
      "!test/exclude-files-in-this-directory",
      "!**/exclude-files-with-this-name.*"
    ],
    "ignoreCoherence": false, 
    "serial": true
  }
}
```

Arguments passed to the CLI will always take precedence over the CLI options configured in `package.json`.

#### Options

- `debug`: enables debug mode if set to true. Let's no-bro-cote run the tests serially and provides verbose console output
- `extensions`: extensions of test files. Setting this overrides the default `["cjs", "js"]` value
- `failFast`: stop running further tests once a test fails
- `files`: an array of glob patterns to select test files. Files with an underscore prefix are ignored. By default only selects files with `mjs` & `js` extensions, even if the pattern matches other files. Specify `extensions` to allow other file extensions
- `ignoreCoherence`: Every test file is getting executed as a subprocess. To prevent the CLI to run every js-file, that is found, the source code is getting analyzed if it is a no-bro-cote test file. Setting this option true true, disables this check (which might be dangerous).
- `serial`: By default the tests are running concurrently. Setting this option to true, only one test file runs at a time. 


_Note that all arguments provided on the CLI overrides the options configured in `package.json`._


## License
This work is licensed under [GPL-3.0](https://opensource.org/licenses/GPL-3.0).



```
                                         ....
                                       ..;ddc...
                                     ..:do,,cdl'..
                                   ..:do,'...':do'..
                                ...cdo,'.......':do;..
                              ..'ldl,............';od:..
                            ..'ldc,................',odc...
                          ..'ld:'.....................,ldl'..
                        ..'oxc'..pq....po.....,ooOoo,...':do'..
                      ..,od:,....XWXc..kN'...c0k'''x0l....':do,..
                    ..,dd;'......X0cXx.kN'..,Wx.....xW;.....';dd;..
                  ..;dd;'........X0..O0ON'..'X0'...'0X,.......',odc..
                ..;dd;'..........X0...o0N'..."okdggko"...........,ldc...
              ..:do,'..............................................,ldl'..
            ..:xo,'..................................................':xo,..
          ..cdo,'.k00000000Oxo,.....c00000000Oko;........:dOKXNNXKOd:..';dd;..
       ...cdl,....KMMMNOOOXMMMW:....cMMMM000XMMMMl.....;KMMMW0kkONMMMK;..',dd;..
     ..'ldc'......KMMM....'MMMMd....cMMMM....0MMM0....;WMMMO'....'kMMMW;...',odc...
   ..'lxc'........KMMMNOOOXMMWO'....cMMMM...oNMMWc....OMMMM'.......NMMMO......'cdl'..
 ..'odc,..........KMMMW00KXMMW0c....cMMMMMMMMMM0,.....0MMMW........XMMMK........'cdo'..
...lxc'...........KMMP.....oMMMM,...cMMMM::lOMMMX:....oMMMMl......;MMMMl........,ldc...
  ..'lxl,.........KMMM....,KMMMW'...cMMMM'...dMMMWc....xMMMMk....xWMMMd.......,lx:..
    ..'cdo,.......KMMMMMMMMMWXk;....cMMMM'....oMMMMo....ikXMMMMMMMMXkj.....',odc..
       ..;dd;'....kooooooooou*'.....cgggg......:uoOX.......*MMMMMM*......,dd;..
         ..;od;'.......................................................',dd;..
           ..,dx:'...................................................';dd;..
             ..'ldc'........;dkXX:..;dkxkl..MXXXXXM..MXXXM.........':do,..
               ...cxl,.....:MX,....,WK'.oMx...cMd....MXL,,.......';xo'..
                  ..cdd,'..:MK,....;WK'.lMx...cMd....MXP"".....':do'..
                    ..;dd,'.;xOXX:..;xOkOl....cOd....MXXXM...,cxo'..
                      ..,od;'..............................'cdl'..
                        ..'oxc,..........................'cxc...
                          ..'ldl'......................,odl...
                            ...cxl,..................,od:...
                               ..:do;'.............,od:..
                                 ..,od:'........';dd;..
                                   ..'ox:'....';dd,..
                                     ..'ldc'';do,..
                                       ...ldxo'..
                                         ...o..
                                            .
```
