# NoBroCote
**No**de **Bro**wser **Co**de **te**sting. Run tests on your JavaScript code for the browser.








----
page.addScriptTag(options)

    options <Object>
        url <string> URL of a script to be added.
        
        path <string> Path to the JavaScript file to be injected into frame. If path is a relative path, then it is resolved relative to current working directory.
        
        content <string> Raw JavaScript content to be injected into frame.
        
        type <string> Script type. Use 'module' in order to load a Javascript ES6 module. See script for more details.
    
    returns: <Promise<ElementHandle>> which resolves to the added tag when the script's onload fires or when the script content was injected into frame.

Adds a <script> tag into the page with the desired url or content.