MI COMPRA ANDROID V1.1
Proyecto Android offline con WebView local.
Package: com.smartsys.micompra
Min SDK 24 / Target SDK 35.

COMPILACION CON ANDROID STUDIO:
1. Abrir esta carpeta como proyecto.
2. Esperar sincronizacion Gradle.
3. Build > Build APK(s).
4. APK: app/build/outputs/apk/debug/app-debug.apk

COMPILACION AUTOMATICA EN GITHUB:
1. Subir esta carpeta a un repositorio GitHub.
2. Actions > Build APK > Run workflow.
3. Descargar artifact MiCompra-APK.

La app carga los HTML/CSS/JS incluidos dentro del APK y funciona sin Internet.
Los datos se guardan localmente en WebView/DOM Storage del telefono.
