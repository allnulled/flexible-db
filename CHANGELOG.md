# CHANGELOG

## Versión 1.0.3

- Soporte para persistencia:
   - Método `db.persist()`
   - Opción de `db.$options.onPersist` para soportar persistencia automática
   - Test de persistencia en `test-of-persistence.js`

## Versión 1.0.4

- Soporte para triggers:
   - Método `db.trigger(event, parameters)`
   - Opción de `db.$options.onTrigger` para soportar trigger genérico automático
   - Test de persistencia en `test-of-trigger.js`

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