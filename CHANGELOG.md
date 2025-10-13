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