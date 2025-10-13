# flexible-db

Base de datos basada en JavaScript.

## Links

- [Página en Github](https://github.com/allnulled/flexible-db)
- [Página en NPM](https://www.npmjs.com/package/@allnulled/flexible-db)

## Instalación

```
npm i -s @allnulled/flexible-db
```

## Features

- Soporta esquema estricto (obligatorio, no es tan flexible)
- Soporta referencias de objetos y de listas externas
- Soporta integridad de estas referencias
- Soporta semáforos automáticamente en `node.js`
   - Para que se pueda usar en servidores
- Soporta los tipos:
   - `"boolean"`
   - `"integer"`
   - `"float"`
   - `"string"`
   - `"object"`
   - `"array"`
   - `"object-reference"` (con integridad referencial)
   - `"array-reference"` (con integridad referencial)
- Soporta métodos de esquema:
   - `getSchema`
   - `setSchema`
- Soporta métodos de persistencia:
   - `hydrate`
   - `dehydrate`
- Soporta métodos de CRUD:
   - `selectMany`
   - `insertOne`
   - `insertMany`
   - `updateOne`
   - `updateMany`
   - `deleteOne`
   - `deleteMany`

## API

### `db = FlexibleDB.create(options:Object): Object`

Crea una instancia de base de datos.

Dentro contiene:

- `db.$ids`
- `db.$data`
- `db.$schema`

Acepta opciones mediante `options:Object` donde puedes especificar:

- `trace = true` si quieres activar el traceo de los métodos
- `onPersist:Function` si quieres establecer un método automático de persistencia
   - La función recibe el objeto `db` que tiene el método `db.dehydrate()` al uso de persistencia fácil
   - Puedes ver el `test-of-persistence.js` para ver un ejemplo de uso
- `onTrigger:Function` si quieres establecer un método automático de trigger
   - La función recibe los 3 parámetros:
      - `event:String, parameters:Array, db:Object`
   - Puedes ver el `test-of-trigger.js` para ver un ejemplo de uso

### `db.getSchema(): Object`

Devuelve el esquema de datos, en `this.$schema`.

### `db.setSchema(schema:Object): void`

El `schema` debe ser un objeto válido que represente al esquema de datos.

Se pondrá en `this.$schema`.

Se espera un objeto que:
  - contenga: `<table>.<column>.type = `
     - `"boolean"`
     - `"integer"`
     - `"float"`
     - `"string"`
     - `"object"`
     - `"array"`
     - `"object-reference"`
        - con `<table>.<column>.referredTable = <una tabla conocida por schema>`
     - `"array-reference"`
        - con `<table>.<column>.referredTable = <una tabla conocida por schema>`

### `db.dehydrate(): String`

Devuelve un `String` representando la base de datos.

### `db.hydrate(stringifiedDatabase:String): Promise<void>`

Sobreescribe los `$ids`, `$data` y `$schema` de la base de datos con el `stringifiedDatabase` proporcionado.

En `stringifiedDatabase` se espera un `String` como el que devuelve `db.dehydrate()`.

### `db.selectMany(table:String, filter:Function): Promise<Array>`

Devuelve un `Array` con los registros donde la función `filter` ha devuelto `true`.

### `db.insertOne(table:String, value:Object): Promise<Integer>`

Inserta un registro y devuelve su `id`.

### `db.insertMany(table:String, values:Array<Object>): Promise<Array<Integer>>`

Inserta múltiples registros y devuelve sus `ids`.

### `db.updateOne(table:String, id:Integer, properties:Object): Promise<Boolean>`

Actualiza un registro concreto y devuelve `true`.

### `db.updateMany(table:String, filter:Function, properties:Object): Promise<Array<Integer>>`

Actualiza múltiples registros y devuelve sus `id`s en un `Array`.

### `db.deleteOne(table:String, id:Integer): Promise<Boolean>`

Elimina un registro concreto y devuelve sus `true`.

### `db.deleteMany(table:String, filter:Function): Promise<Array<Integer>>`

Elimina múltiples registros y devuelve sus `id`s en un `Array`.

## Tests

Estos son los tests actualmente:

- [Test general](./test.js)
- [Test del README](./test-on-readme.js)
- [Test de persistencia](./test-of-persistence.js)
- [Test de trigger](./test-of-trigger.js)

## Ejemplo



```js
require(__dirname + "/flexible-db.js");

const flexdb = FlexibleDB.create();

const main = async function () {

  await flexdb.setSchema({
    Persona: {
      nombre: { type: "string" },
      dni: { type: "string" },
      nacimiento: { type: "string" },
    },
    Cliente: {
      persona: { type: "object-reference", referredTable: "Persona" },
      empresas: { type: "array-reference", referredTable: "Empresa" },
    },
    Empresa: {
      nombre: { type: "string" }
    }
  });

  const persona1 = await flexdb.insertOne("Persona", {
    nombre: "Carlos",
    dni: "777K",
    nacimiento: "05/01/1991"
  });

  const empresa1 = await flexdb.insertOne("Empresa", { nombre: "ASML" });
  const empresa2 = await flexdb.insertOne("Empresa", { nombre: "Al Jazeera" });
  const empresa3 = await flexdb.insertOne("Empresa", { nombre: "KGB" });

  const cliente1 = await flexdb.insertOne("Cliente", {
    persona: persona1,
    empresas: [empresa1, empresa2],
  });

  try {
    await flexdb.deleteOne("Empresa", empresa1);
    throw new Error("Should throw integrity error (1)");
  } catch (error) { }
  try {
    await flexdb.deleteOne("Empresa", empresa2);
    throw new Error("Should throw integrity error (2)");
  } catch (error) { }
  try {
    await flexdb.deleteOne("Persona", persona1);
    throw new Error("Should throw integrity error (3)");
  } catch (error) { }

  console.log("Completado test-on-readme.js");

};

module.exports = main();
```