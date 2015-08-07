1. todolist to distribute to the app.
  1.index.html 
    comment 30 line and 31 line uncomment.
    remove attribute "data-tap-disabled" in the 40 line.
  2.app.js
    comment 9 line and uncomment 10 line.
    

2. after you built on the local enviroment,
   > ionic state restore 
   #http://stackoverflow.com/questions/30042975/manage-cordova-plugins-with-npm-package-json

3. add crosswalk
   > ionic browser add crosswalk   

4. fix problem that "add plugin" not working.
   > npm install -g cordova@5.0.0 && ionic plugin add https://github.com/pushandplay/cordova-plugin-apprate.git && npm install -g cordova
   