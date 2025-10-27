# CHANGELOG

# Sobre la versión 5.

## Versión 5.0.13

- [x] Mejorado README.

## Versión 5.0.12

- [x] sortByColumn
- [x] sortByColumns
- [x] sortByCallback
- [x] sortByEval
- [x] extendBy

## Versión 5.0.10

- [x] groupByCallbacks
- [x] groupByEvals

## Versión 5.0.7

- [x] En cuanto a los métodos de array típicos:
   - [x] que serían:
      - [x] `filter`: `filterSync`, `filterByEval`
      - [x] `map`: `mapSync`, `mapByEval`
      - [x] `reduce`: `reduceSync`, `reduceByEval`
      - [x] `modify`: `modifySync`, `modifyByEval`
      - [x] `each`: `eachSync`, `eachByEval`
   - [x] API de versión síncrona: con `BasicDataset.<operation>Sync`
      - [x] para poder usar la versión síncrona de los métodos `<operation>`
   - [x] API de versión evaluativa: con `BasicDataset.<operation>ByEval`
      - [x] para poder usar texto en lugar de funciones
   - [x] mejorado el `test-of-dataset-sync-eval-methods.js`
- [x] método `dataset.debug(mensaje:String)` para debugging

# Sobre la versión 4.

## Versión 4.0.4

- [x] Homogeneizar las 2 APIs:
   - [x] `BasicServer` - `createServer`
   - [x] `BasicDataset` - `createDataset` en lugar de `proxifyDataset`
- [x] `selectByUid`
   - [x] el método de buscar en todas las tablas, todos los recursos
   - [x] el selector en el árbol JSON de `$ids.uid` queda reservado como nombre de tabla genérica.
   - [x] el método de `database.consumeUid()`
- [x] `selectByLabel(label)` - de la propiedad de columna `{label: true}`
   - [x] donde `label` puede ser un `string`
      - [x] y luego la columna puede ser un tipo `string` y la comprobación sería `columna === label`
      - [x] y luego la columna puede ser un tipo `array` y la comprobación sería `columna.indexOf(label) !== -1`
- [x] `selectByLabels(labels)`
   - [x] donde `labels` puede ser un `array<string>`:
      - [x] y luego la columna puede ser un tipo `string` y la comprobación sería `label.indexOf(columna) !== -1`
      - [x] y luego la columna puede ser un tipo `array` y la comprobación sería `database.createDataset(label).hasAnyOf(columna)`

## Versión 4.0.2

- soporte para `setFirewall`
- soporte para `ControllerLanguage.parse`

## Versión 4.0.1

- Retirada de API del `selectMany` con capacidad de expandir datos:
   - Rompe la separación por tablas necesaria para el auth
- Soporte para `server.onAuthenticate` en todas las `server.operation`

----

Anterior notación:

----

# Sobre la versión 3.

## Versión 3.0.1

- Actualizado README con las últimas opciones de:
   - `db.$schema[*][*].unique`.
   - `db.$schema[*][*].nullable`.
   - `db.$schema[*][*].default`.

## Versión 3.0.2

- Soporte para `db.getRelationsSchema()`

## Versión 3.0.3

- Actualizado README.

## Versión 3.0.4

- Soporte para `db.$schema[table][column].default:Function`
- Para devolver valores de código en runtime.

## Versión 3.0.5

- Soporte para `db.$schema[table][column].defaultType = 'js'`
- Para devolver valores de código en runtime.
- Pero especificando en `db.$schema[table][column].default` un código js en string.

## Versión 3.0.11

- Soporte para `db.selectOne(table, id)`
- Soporte para `db.selectMany(table, filter, expandSpec)`

## Versión 3.0.12

- Soporte para `db.expandRecords(table, dataset, expandSpec)`
- Soporte para `db.attachRecords(table, column, referredTable, referredColumn, dataset)`

## Versión 3.0.14

- Soporte para `db.proxifyDataset(dataset, table)`
- Soporte para interfaz de `FlexibleDB.BasicDataset`

## Versión 3.0.15

- Soporte para `db.createServer(port)`
- Soporte para interfaz de `FlexibleDB.BasicServer`

----

# Sobre la versión 2.

## Versión 2.0.0

- API asíncrona para todo
- Soporte de semáforos con `db.$options.onLock` y `db.$options.onUnlock` de serie en node.js

## Versión 2.0.4

- Método `db.renameTable(table, newName)`
- Método `db.renameColumn(table, column, newName)`

## Versión 2.0.5

- Método `db.addTable(table)`
- Método `db.addColumn(table, column, metadata)`
- Método `db.dropTable(table)`
- Método `db.dropColumn(table, column)`

## Versión 2.0.6

- Actualizado README con los últimos métodos.

## Versión 2.0.7

- Método `modifyAll(table, modifier)`

## Versión 2.0.8

- Actualizado README con los últimos métodos.

## Versión 2.0.9

- Ahora `selectMany` trabaja con una copia de los datos y no con ellos, por si se modifica alguno.

## Versión 2.0.10

- Soporte para `db.$schema[table][column].notNull = true`
- Soporte para `db.$schema[table][column].unique = true`

## Versión 2.0.11

- Actualizado README con las últimas opciones de `db.$schema[*][*]`.


----

## Versión 1.0.4

- Soporte para triggers:
   - Método `db.trigger(event, parameters)`
   - Opción de `db.$options.onTrigger` para soportar trigger genérico automático
   - Test de persistencia en `test-of-trigger.js`

