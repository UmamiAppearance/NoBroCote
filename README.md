# NoBroCote
**No**de **Bro**wser **Co**de **te**sting. Run tests on your JavaScript code for the browser.




```                                                                                            
                                                                                            
                                            ....                                            
                                          ..;ddc...                                         
                                        ..:do,,cdl'..                                       
                                      ..:do,'...':do'..                                     
                                   ...cdo,'.......':do;..                                   
                                 ..'ldl,............';od:..                                 
                               ..'ldc,................',odc...                              
                             ..'ld:'.....................,ldl'..                            
                           ..'oxc'..,,'...',......';;;'....':do'..                          
                         ..,od:,....XWXc..kN'...c0kolox0l....':do,..                        
                       ..,dd;'......X0cXx'kN'..,Wx.....xW;.....';dd;..                      
                     ..;dd;'........X0.,O0ON'..'X0'...'0X,.......',odc..                    
                   ..;dd;'..........kx...o0O'...'okdddko'...........,ldc...                 
                 ..:do,'..............................................,ldl'..               
               ..:xo,'..................................................':xo,..             
             ..cdo,'.k00000000Oxo,.....:00000000Oko;........:dOKXNNXKOd:..';dd;..           
          ...cdl,....KMMMNOOOXMMMW:....cMMMM000XMMMMl.....;KMMMW0kkONMMMK;..',dd;..         
        ..'ldc'......KMMM0...'MMMMd....cMMMM'...0MMM0....;WMMMO'....'kMMMW;...',odc...      
      ..'lxc'........KMMMNOOOXMMWO'....cMMMM::coNMMWc....OMMMM'.......NMMMO......'cdl'..    
    ..'odc,..........KMMMW00KXMMW0c....cMMMMMMMMMM0,.....0MMMW........XMMMK........'cdo'..  
   ...lxc'...........KMMM0....oMMMM,...cMMMM::lOMMMX:....oMMMMl......:MMMMl........,ldc...  
     ..'lxl,.........KMMMK:::lKMMMW'...cMMMM'...dMMMWc....xMMMMkc;;cxWMMMd.......,lx:..     
       ..'cdo,.......KMMMMMMMMMWXk;....cMMMM'....oMMMMo....:kXMMMMMMMMXk;.....',odc..       
          ..;dd;'....,;;;;;;;;,'.......';;;;......,;;;;.......';cccc:,.......,dd;..         
            ..;od;'.......................................................',dd;..           
              ..,dx:'...................................................';dd;..             
                ..'ldc'........;dkxx:..;dkxkl..:xxkxxd..kxxxo.........':do,..               
                  ...cxl,.....:MX,.',.,WK'.oMx...cMd....MXcc;.......';xo'..                 
                     ..cdd,'..:MK,.''.;WK'.lMx...cMd....MXcc;.....':do'..                   
                       ..;dd,'.;xOkkc..;xOkOl....;Oc....kkxxx...,cxo'..                     
                         ..,od;'..............................'cdl'..                       
                           ..'oxc,..........................'cxc...                         
                             ..'ldl'......................,odl...                           
                               ...cxl,..................,od:...                             
                                  ..:do;'.............,od:..                                
                                    ..,od:'........';dd;..                                  
                                      ..'ox:'....';dd,..                                    
                                        ..'ldc'';do,..                                      
                                          ...ldxo'..                                        
                                            ...'..                                          
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