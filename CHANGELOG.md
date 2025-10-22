# CHANGELOG

# Sobre la versión 4.

## Versión 4.0.1

- Retirada de API del `selectMany` con capacidad de expandir datos:
   - Rompe la separación por tablas necesaria para el auth
- Soporte para `server.onAuthenticate` en todas las `server.operation`

## Versión 4.0.2

- soporte para `setFirewall`
- soporte para `ControllerLanguage.parse`


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

- Soporte para `db.proxifyDatabaset(dataset, table)`
- Soporte para interfaz de `FlexibleDB.DatasetProxy`

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

