# 🔧 Guía: Cómo Obtener Debug Tokens para App Check

## ⚠️ Problema que Resuelve

Si ves este error en la consola:
```
POST https://content-firebaseappcheck.googleapis.com/v1/projects/.../exchangeRecaptchaV3Token 400 (Bad Request)
AppCheck: 400 error. Attempts allowed again after 00m:32s (appCheck/initial-throttle)
```

**Causa**: Estás intentando usar reCAPTCHA v3 en desarrollo local, pero Firebase App Check requiere debug tokens para desarrollo.

---

## 📋 Solución Rápida

### Paso 1: Acceder a Firebase Console

1. Abre tu navegador (Chrome/Firefox/Edge)
2. Ve a: https://console.firebase.google.com/project/proyecto-ine-4cd29/appcheck/apps
3. Inicia sesión con tu cuenta de Firebase

### Paso 2: Obtener tu Debug Token

1. **En la página de App Check**, verás tu aplicación web listada
2. **Abre las DevTools del navegador** (presiona `F12` o clic derecho > Inspeccionar)
3. Ve a la pestaña **Console**
4. Verás un mensaje como este:

   ```
   Firebase App Check debug token:
   XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX

   To use this token in your application, add it to:
   self.FIREBASE_APPCHECK_DEBUG_TOKEN = "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";
   ```

5. **COPIA ese token** (el formato es: `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`)

### Paso 3: Configurar el Token en tu Proyecto

1. **Abre el archivo `.env`** en la raíz del proyecto
2. **Pega tu debug token** en la variable:

   ```env
   PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN=XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
   ```

   ⚠️ **REEMPLAZA** `XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX` con tu token real

3. **Guarda el archivo**

### Paso 4: Reiniciar el Servidor de Desarrollo

```bash
# Detén el servidor (Ctrl+C)
# Luego reinicia:
npm run dev
```

### Paso 5: Verificar que Funciona

1. Abre http://localhost:4321
2. Abre la consola del navegador (F12)
3. Deberías ver:
   ```
   [Firebase] App Check en modo DEBUG - Token configurado
   [Firebase] ✅ App Check inicializado en modo DESARROLLO
   ```

4. **YA NO deberías ver** el error 400

---

## 🔐 Registrar el Debug Token en Firebase (IMPORTANTE)

Para que el debug token funcione, debe estar registrado en Firebase:

1. Ve a: https://console.firebase.google.com/project/proyecto-ine-4cd29/appcheck/apps
2. Selecciona tu aplicación web
3. En la sección **Debug tokens**, haz clic en **Manage debug tokens**
4. Haz clic en **Add debug token**
5. Pega tu debug token (el mismo que copiaste antes)
6. Dale un nombre descriptivo (ej: "Token de Juan - Laptop")
7. Haz clic en **Save**

---

## 👥 Importante para Equipos

### Cada Desarrollador Necesita su Propio Token

❌ **NO COMPARTAS** tu debug token con otros desarrolladores
✅ **Cada persona** debe obtener su propio token siguiendo los pasos arriba

**¿Por qué?**
- Los debug tokens están vinculados a tu navegador y máquina
- Usar el token de otra persona puede causar problemas
- Es más fácil de rastrear y gestionar

### ¿Cómo Compartir el Proyecto?

1. **Comparte el código** (sin el archivo `.env`)
2. **Cada desarrollador** debe:
   - Copiar `.env.example` a `.env`
   - Obtener su propio debug token
   - Agregarlo a su `.env` local

---

## 🐛 Solución de Problemas

### El error 400 persiste

**Soluciones**:
1. Verifica que copiaste el token completo (sin espacios extras)
2. Asegúrate de que el token esté registrado en Firebase Console
3. Limpia la caché del navegador:
   ```
   Ctrl+Shift+Delete > Borrar caché y cookies
   ```
4. Reinicia el servidor de desarrollo

### No veo el debug token en la consola

**Soluciones**:
1. Asegúrate de estar en la página correcta de Firebase Console
2. Recarga la página con `Ctrl+F5`
3. Verifica que hayas iniciado sesión en Firebase
4. Intenta con otro navegador

### El mensaje sigue diciendo "DEBUG TOKEN NO CONFIGURADO"

**Soluciones**:
1. Verifica que el archivo `.env` tenga:
   ```env
   PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN=tu-token-aqui
   ```
2. NO dejes el valor en blanco o como `true`
3. Reinicia el servidor después de editar `.env`

### Error: "App Check verification failed"

**Solución**:
1. Ve a Firebase Console > App Check > Manage debug tokens
2. Verifica que tu token esté en la lista
3. Si no está, agrégalo siguiendo los pasos de "Registrar el Debug Token"

---

## 📊 Diferencias: Desarrollo vs Producción

| Ambiente | Provider | Requiere Debug Token | Configuración |
|----------|----------|----------------------|---------------|
| **Desarrollo** (`npm run dev`) | reCAPTCHA v3 con Debug Token | ✅ Sí | `PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN` |
| **Producción** (`npm run build`) | reCAPTCHA v3 | ❌ No | `PUBLIC_FIREBASE_APP_CHECK_KEY` |

---

## 🎯 Checklist Final

Antes de continuar, verifica:

- [ ] Obtuve mi debug token de Firebase Console
- [ ] Agregué el token a mi archivo `.env`
- [ ] Registré el debug token en Firebase Console > App Check
- [ ] Reinicié el servidor de desarrollo
- [ ] Veo el mensaje "✅ App Check inicializado en modo DESARROLLO"
- [ ] Ya NO veo el error 400 en la consola

---

## 📚 Recursos Adicionales

- [Firebase App Check Debug Tokens](https://firebase.google.com/docs/app-check/web/debug-provider)
- [App Check Best Practices](https://firebase.google.com/docs/app-check/best-practices)

---

## 🆘 ¿Necesitas Ayuda?

Si después de seguir esta guía sigues teniendo problemas:

1. Revisa que todas las variables de `.env` estén correctas
2. Compara tu `.env` con `.env.example`
3. Verifica que tu cuenta tenga permisos en el proyecto de Firebase
4. Contacta al administrador del proyecto

---

**Última actualización**: 2025-11-27
**Versión del código**: firebase.ts con soporte mejorado para debug tokens
