# Configuración de Firestore para Gráficos de Usuario

## 📋 Resumen

Este proyecto ahora guarda los gráficos personalizados en **Firebase Firestore** vinculados al usuario autenticado, en lugar de localStorage. Esto permite que los gráficos persistan en la nube y sean accesibles desde cualquier dispositivo.

---

## 🚀 Pasos de Configuración

### 1. Habilitar Firestore en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto: **proyecto-ine-4cd29**
3. En el menú lateral, haz clic en **Firestore Database**
4. Si no está habilitado, haz clic en **Crear base de datos**
5. Selecciona el modo:
   - **Modo de producción** (recomendado) - Las reglas de seguridad protegerán los datos
   - Ubicación: Selecciona la región más cercana a tus usuarios (ej: `us-central1` o `southamerica-east1`)

---

### 2. Configurar Reglas de Seguridad

Las reglas de seguridad son **CRUCIALES** para proteger los datos de los usuarios.

#### Opción A: Copiar desde el archivo `firestore.rules`

1. En Firebase Console → **Firestore Database** → Pestaña **Reglas**
2. Copia el contenido del archivo `firestore.rules` que se encuentra en este proyecto
3. Pega las reglas en el editor
4. Haz clic en **Publicar**

#### Opción B: Configurar manualmente

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /graficos/{graficoId} {
      allow read: if request.auth != null
                  && request.auth.uid == resource.data.userId;

      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;

      allow update: if request.auth != null
                    && request.auth.uid == resource.data.userId
                    && request.auth.uid == request.resource.data.userId;

      allow delete: if request.auth != null
                    && request.auth.uid == resource.data.userId;
    }
  }
}
```

**¿Qué hacen estas reglas?**
- ✅ Solo usuarios autenticados pueden crear, leer, actualizar o eliminar gráficos
- ✅ Cada usuario solo puede acceder a SUS PROPIOS gráficos
- ✅ No se puede cambiar el `userId` de un gráfico al actualizarlo
- ❌ Se niega el acceso a cualquier otra colección

---

### 3. Crear Índices Compuestos (Opcional pero Recomendado)

Firestore puede requerir un índice compuesto para la query de gráficos.

**Cuando ejecutes la aplicación por primera vez**, es posible que veas un error en la consola con un enlace como:

```
https://console.firebase.google.com/project/proyecto-ine-4cd29/firestore/indexes?create_composite=...
```

**Simplemente haz clic en ese enlace** y Firebase creará automáticamente el índice necesario. Espera 1-2 minutos a que se complete la creación del índice.

#### Índice Compuesto Manual

Si prefieres crearlo manualmente:

1. Ve a **Firestore Database** → Pestaña **Índices**
2. Haz clic en **Agregar índice**
3. Configura:
   - **Colección**: `graficos`
   - **Campos**:
     - `userId` - Ascendente
     - `createdAt` - Descendente
   - **Estado de consulta**: Habilitado

---

## 🔍 Estructura de Datos en Firestore

### Colección: `graficos`

Cada documento en la colección `graficos` tiene la siguiente estructura:

```typescript
{
  nombre: string;              // "Comparación de MP2.5 2023"
  lines: LineConfig[];         // Array de configuraciones de líneas
  yearsFilter: number | null;  // 1, 5, 10, null
  temporalView: "mensual" | "anual";
  fechaCreacion: string;       // "2025-10-30T12:00:00.000Z"
  userId: string;              // "uid del usuario de Firebase Auth"
  createdAt: Timestamp;        // Timestamp de Firestore (para ordenar)
}
```

---

## ✨ Funcionalidades Implementadas

### ✅ Guardar Gráficos
- Los gráficos se guardan en Firestore vinculados al `userId` del usuario autenticado
- Mensaje de confirmación: "Gráfico guardado exitosamente en la nube"

### ✅ Cargar Gráficos
- Al cargar la página, se obtienen automáticamente todos los gráficos del usuario desde Firestore
- Indicador de carga mientras se obtienen los datos

### ✅ Eliminar Gráficos
- Se elimina tanto del estado local como de Firestore
- Confirmación antes de eliminar

### ✅ Migración desde localStorage
- Si el usuario tiene gráficos guardados en localStorage (de versiones anteriores), se le preguntará si desea migrarlos a Firestore
- Después de la migración, se limpian los datos de localStorage

---

## 🧪 Cómo Probar

1. **Inicia la aplicación**:
   ```bash
   npm run dev
   ```

2. **Inicia sesión** con tu cuenta de usuario

3. **Crea un gráfico**:
   - Selecciona: Región → Estación → Métrica → Submétrica
   - Agrega líneas al gráfico
   - Haz clic en "Guardar Gráfico"
   - Dale un nombre y confirma

4. **Verifica en Firestore**:
   - Ve a Firebase Console → Firestore Database
   - Deberías ver la colección `graficos` con tu documento
   - Verifica que el campo `userId` coincida con tu UID de Firebase Auth

5. **Prueba la persistencia**:
   - Cierra sesión y vuelve a iniciar sesión
   - Ve a la pestaña "Ver Guardados"
   - Deberías ver tu gráfico guardado

6. **Prueba desde otro navegador**:
   - Inicia sesión con la misma cuenta en otro navegador/dispositivo
   - Deberías ver los mismos gráficos guardados

---

## 🛠️ Solución de Problemas

### Error: "Missing or insufficient permissions"

**Causa**: Las reglas de seguridad no están configuradas correctamente.

**Solución**:
1. Verifica que las reglas de seguridad estén publicadas en Firebase Console
2. Asegúrate de que el usuario esté autenticado (verifica en la consola del navegador)

---

### Error: "The query requires an index"

**Causa**: Falta crear el índice compuesto.

**Solución**:
1. Haz clic en el enlace proporcionado en el error de la consola
2. O crea el índice manualmente siguiendo las instrucciones en la sección "Crear Índices Compuestos"

---

### Los gráficos no se cargan

**Diagnóstico**:
1. Abre la consola del navegador (F12)
2. Busca errores relacionados con Firestore
3. Verifica que el usuario esté autenticado: `console.log(user)`

**Solución**:
1. Asegúrate de que Firestore esté habilitado en Firebase Console
2. Verifica que las reglas de seguridad estén configuradas
3. Verifica que el índice compuesto esté creado

---

### ¿Cómo puedo ver el userId de un usuario?

1. Inicia sesión en la aplicación
2. Abre la consola del navegador (F12)
3. Ejecuta: `firebase.auth().currentUser.uid`
4. O ve a Firebase Console → Authentication → Users

---

## 📦 Archivos Modificados

- ✅ `src/lib/firebase.ts` - Agregado Firestore
- ✅ `src/lib/chartService.ts` - Servicio completo para gráficos
- ✅ `src/components/GraficosPersonalizadosPage.tsx` - Actualizado para usar Firestore
- ✅ `firestore.rules` - Reglas de seguridad de Firestore
- ✅ `FIRESTORE_SETUP.md` - Este archivo

---

## 🎉 Beneficios

- ✨ **Persistencia en la nube**: Los gráficos se guardan en Firestore, no en el navegador
- 🔐 **Seguridad**: Cada usuario solo puede acceder a sus propios gráficos
- 🌐 **Multi-dispositivo**: Accede a tus gráficos desde cualquier dispositivo
- ⚡ **Sincronización en tiempo real**: Los cambios se reflejan inmediatamente
- 📊 **Escalabilidad**: Firestore puede manejar miles de gráficos sin problemas

---

## 🔗 Recursos Adicionales

- [Documentación de Firestore](https://firebase.google.com/docs/firestore)
- [Reglas de Seguridad de Firestore](https://firebase.google.com/docs/firestore/security/get-started)
- [Consultas de Firestore](https://firebase.google.com/docs/firestore/query-data/queries)
- [Índices de Firestore](https://firebase.google.com/docs/firestore/query-data/indexing)
