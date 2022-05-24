# NoBroCote
**No**de **Bro**wser **Co**de **te**sting. Run unit tests on your JavaScript code for the browser.

# About
**NoBroCote** is designed for the automation of testing JavaScript code which is made for the browser. It provides methods to run the code units inside of a headless browser via [Puppeteer](https://github.com/puppeteer/puppeteer). NoBroCote makes it possible to test the code via node, without having to open a browser, and also without writing the test environment for scratch every time. It is as simple as it gets up to this point. More feature may follow.

# Installation
**NoBroCote** is made for unit tests with node.js, therefore a installation via npm is advisable. As it most likely is only needed for testing with the ``--save-dev`` flag.

# Usage
The first step is to create a new ``.js`` file (most likely in your test folder). Inside of this file 

```shell
npm install no-brote-cote --save-dev
```



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
                      ..,od:,....XWXc..kN'...c0k"*"x0l....':do,..
                    ..,dd;'......X0cXx'kN'..,Wx.....xW;.....';dd;..
                  ..;dd;'........X0.,O0ON'..'X0'...'0X,.......',odc..
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
             ..'ldc'........;dkxx:..;dkxkl..xXXXXXx..MXXXX.........':do,..
               ...cxl,.....:MX,....,WK'.oMx...cMd....MXL,,.......';xo'..
                  ..cdd,'..:MK,....;WK'.lMx...cMd....MXP"".....':do'..
                    ..;dd,'.;xOkk:..;xOkOl....cOd....MXXXX...,cxo'..
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





----
page.addScriptTag(options)

    options <Object>
        url <string> URL of a script to be added.
        
        path <string> Path to the JavaScript file to be injected into frame. If path is a relative path, then it is resolved relative to current working directory.
        
        content <string> Raw JavaScript content to be injected into frame.
        
        type <string> Script type. Use 'module' in order to load a Javascript ES6 module. See script for more details.
    
    returns: <Promise<ElementHandle>> which resolves to the added tag when the script's onload fires or when the script content was injected into frame.

Adds a <script> tag into the page with the desired url or content.