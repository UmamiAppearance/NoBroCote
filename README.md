# NoBroCote
[![License](https://img.shields.io/github/license/UmamiAppearance/NoBroCote?color=009911&style=for-the-badge)](./LICENSE)
[![npm](https://img.shields.io/npm/v/no-bro-cote?color=009911&style=for-the-badge)](https://www.npmjs.com/package/no-bro-cote)


**No**de **Bro**wser **Co**de **te**sting. _Run unit tests on your JavaScript code for the browser._  
  
**NoBroCote** is designed for the automation of testing JavaScript code which is made for the browser. It provides methods to run the code units inside of a headless browser via [Puppeteer](https://github.com/puppeteer/puppeteer). **NoBroCote** makes it possible to test the code via node, without having to open a browser, and also without writing the test environment from scratch every time. It is as simple as it gets up to this point. More feature may follow.

## Use case
This software is designed to test if an application for the browser is correctly working.
 - Is it loading into the HTML page?
 - is it creating the required dom elements?
 - It is responding?
 - It it serving the correct output?
 - ...

_It is not suitable for UI tests_, reacting to (touch) input and anything like that, or testing if the code is running consistent over different browsers.

# Installation
**NoBroCote** is made for unit tests with node.js, therefore a installation via npm is advisable. As it is most likely is only needed for testing with the ``--save-dev`` flag.

```sh
npm install no-brote-cote --save-dev
```

# Usage
The first step is to create a new ``.js`` file (most likely in your test folder). Inside of this file all that have to be done ist importing the main module ``NoBroCote``.  
    
**(Psst. No 'time' for reading? Jump straight to a basic [sample code](https://github.com/UmamiAppearance/NoBroCote#Basic-Sample-Code).)**

## Importing
```js
import NoBroCote from "no-bro-code";
```

## First Steps

### Initializing
To initialize the test runner, a new instance of the main class is getting created. Here comes a little peculiarity. To tell the main class where the instance is to be found in the filesystem, it is getting initialized with ``import.meta.url``. This is mandatory, as the test file is also imported into the html page for the testing and needs to be located.
```js
const test = new NoBroCode(import.meta.url);
```

### Creating Test Units
After initialization it is time to create a test unit. A test unit takes:  
- ``name`` _\<string\>_ Unit Name
- ``expect`` _\<*\>_ Expected result 
- ``fn`` _\<Function\>_ The actual test. A function for testing.
- ``fnArgs`` _\<...any\>_ Optional parameters for the function. 

The function has access to the html page. It acts like a single function you would execute in a script tag. It has access to all scripts and modules passed via ``addScript`` or ``addImport``. The function can be asynchronous or not. It must return something which can be compared with the expected result.  
**Example:**  

```js
test.makeUnit(
    "myFirstUnit",
    "hello",
    () => {
        document.body.textContent = "hello";
        return document.body.textContent;
    }
);
```

#### Controlling the Test Assertion
The regular assertion compares the expected value and the result for equality without type conversion (===). If this is not the desired behavior, there are some operators available to control the assertion process. Oparators are activated by passing them to the expect parameter of a ``makeUnit`` method.  
  
_Available operators are:_
 -  ``!|`` not
 - ``!=|`` not, with type conversion
 -  ``||`` or, values can be separated with: valueA|valueB|valueC
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


#### Controlling Errors
Sometimes it is necessary to test if an error is thrown. The test should throw the error, but that is the desired behavior not a failure. Similar to the just featured operators there are operators for errors (those keywords are also passed to the expect parameter).
_Those are:_
 - ``e|`` (for allowing all errors)
 - ``e|EvalError``
 - ``e|InternalError``// optional
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



##### Custom Errors
Custom errors can be also be added to error list:
```js
// first create the error, eg:
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

### Importing Scripts and Modules
The _first method_ (``test.addScript``) is a simple global import which is getting passed to **Puppeteer** (cf. [devdocs.io/puppeteer](https://devdocs.io/puppeteer/)). This can be any classic script tag or ES6 module which provides global access (to the entire HTML page).  
  
The _second method_ (``test.addImport``) takes ES6 import statements as an input, which become part of one script tag with the test units. Global availability is therefore not necessary.

#### addScript
The method requires an object which can have the following keys (as defined by Puppeteer):
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

#### addImport
This method provides ES6 imports for the test runner. In contrast to ``addScripts``, this method needs a valid ES6 import statement as a string. These imports are directly accessible by the test units as they are part of one script tag in the browser.
 - Relative imports are resolved relative to the projects root directory (cwd).
 - Multiple imports can be passed as an array. _A possible **example** may be as follows:_

```js
test.addImport('import myModule from "./path/to/module"');
 ```

### Running the Tests
What to do to actually run the tests? _Not much._ After all imports are done and all units are declared all that is left to to is to set at the end of the file the following line:

```js
test.init();
 ```

After this line is added, the tests are ready to go. The js file with the imported main class and test units can now be called with node from the projects root directory.

```sh
node ./path/to/file.js
```

To use this as a test for a node package, simply add the line to ``package.json`` at the script section:
```json
"scripts": {
    "test": "node ./path/to/file.js",
},
```

## Basic Sample Code
```js
import NoBroCote from "no-bro-cote";

const test = new NoBroCode(import.meta.url);

// imports (optional)
test.addScript({
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
    async () => {
        document.body.textContent = "world";
        return document.body.textContent;
    }
);

test.makeUnit(
    "myExpectErrorUnit",
    "e|ReferenceError",
    () => {
        const thisIsPython = False;
    }
);


// last step -> the file is now callable from the projects root directory
test.init();
```

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
