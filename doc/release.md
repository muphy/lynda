1. cd ionic project root directory
2. keytool -genkey -v -keystore lynda.keystore -alias lynda -keyalg RSA -keysize 2048 -validity 10000
3. jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore lynda.keystore platforms\android\build\outputs\apk\android-x86-release-unsigned.apk lynda
4. cd D:\install\android\build-tools\21.1.2
5. zipalign -v 4 D:\project\bonsa\lynda\platforms\android\build\outputs\apk\android-x86-release-unsigned.apk D:\project\bonsa\lynda\platforms\android\build\outputs\apk\lynda.apk

#http://ionicframework.com/docs/guide/publishing.html