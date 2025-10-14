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

#### `db = FlexibleDB.create(options:Object): Object`

Crea una instancia de base de datos.

Dentro contiene:

- `db.$ids`
- `db.$data`
- `db.$schema`

Acepta opciones mediante `options:Object` donde puedes especificar:

- `trace = true` si quieres activar el traceo de los métodos
- `onPersist:Function` si quieres sobreescribir el método automático de persistencia
   - La función recibe el objeto `db` que tiene el método `db.dehydrate()` al uso de persistencia fácil
   - Puedes ver el `test-of-persistence.js` para ver un ejemplo de uso
- `onTrigger:Function` si quieres establecer un método automático de trigger
   - La función recibe los 3 parámetros:
      - `event:String, parameters:Array, db:Object`
   - Puedes ver el `test-of-trigger.js` para ver un ejemplo de uso
- `onLock:AsyncFunction` si quieres sobreescribir el método de bloqueo de persistencia por defecto.
- `onUnlock:AsyncFunction` si quieres sobreescribir el método de desbloqueo de persistencia por defecto.
- `lockingFile:String` si quieres sobreescribir el fichero de bloqueo de persistencia por defecto. Si no, será `process.cwd() + "/db-locker.txt"`
- `lockingCheckInterval` si quieres sobreescribir el intervalo de espera muerta en bloqueo de persistencia. Si no, será `0`.

#### `db.getSchema(): Object`

Devuelve el esquema de datos, en `this.$schema`.

#### `db.setSchema(schema:Object): void`

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

#### `db.dehydrate(): String`

Devuelve un `String` representando la base de datos.

#### `db.hydrate(stringifiedDatabase:String): Promise<void>`

Sobreescribe los `$ids`, `$data` y `$schema` de la base de datos con el `stringifiedDatabase` proporcionado.

En `stringifiedDatabase` se espera un `String` como el que devuelve `db.dehydrate()`.

#### `db.selectMany(table:String, filter:Function): Promise<Array>`

Devuelve un `Array` con los registros donde la función `filter` ha devuelto `true`.

#### `db.insertOne(table:String, value:Object): Promise<Integer>`

Inserta un registro y devuelve su `id`.

#### `db.insertMany(table:String, values:Array<Object>): Promise<Array<Integer>>`

Inserta múltiples registros y devuelve sus `ids`.

#### `db.updateOne(table:String, id:Integer, properties:Object): Promise<Boolean>`

Actualiza un registro concreto y devuelve `true`.

#### `db.updateMany(table:String, filter:Function, properties:Object): Promise<Array<Integer>>`

Actualiza múltiples registros y devuelve sus `id`s en un `Array`.

#### `db.deleteOne(table:String, id:Integer): Promise<Boolean>`

Elimina un registro concreto y devuelve sus `true`.

#### `db.deleteMany(table:String, filter:Function): Promise<Array<Integer>>`

Elimina múltiples registros y devuelve sus `id`s en un `Array`.

## Tests

Estos son los tests actualmente:

- [Test general](https://github.com/allnulled/flexible-db/blob/main/test.js)
- [Test del README](https://github.com/allnulled/flexible-db/blob/main/test-on-readme.js)
- [Test de persistencia](https://github.com/allnulled/flexible-db/blob/main/test-of-persistence.js)
- [Test de trigger](https://github.com/allnulled/flexible-db/blob/main/test-of-trigger.js)
- [Test de performance](https://github.com/allnulled/flexible-db/blob/main/test-of-performance.js)

## Ejemplo



```js
require(__dirname + "/flexible-db.js");

const flexdb = FlexibleDB.create({
  // async onLock(db) {},
  // async onUnlock(db) {},
  // async onTrigger(event, parameters, db) {},
  // async onPersist(db) {},
});

const main = async function () {

  await flexdb.setSchema({
    Cliente: {
      nombre: FlexibleDB.type("string"),
      dni: FlexibleDB.type("string"),
    }
  });

  await flexdb.insertOne("Cliente", {
    nombre: "Carlos",
    dni: "taltaltal",
  });

  await flexdb.insertMany("Cliente", [{
    nombre: "Coolio",
    dni: "tal tal noseqe"
  }, {
    nombre: "Jr. Gong",
    dni: "ok ok ok noseke",
  }, {
    nombre: "Snoop Dog",
    dni: "noseke nose ke",
  }]);

  const dbstate1 = await flexdb.dehydrate();

  const dataset0 = await flexdb.selectMany("Cliente");

  FlexibleDB.assertion(Array.isArray(dataset0), "Constant dataset0 must be an array");
  FlexibleDB.assertion(dataset0.length === 4, "Variable dataset0.length must be 4");

  const dataset1 = await flexdb.selectMany("Cliente", row => row.nombre === "Coolio");

  FlexibleDB.assertion(Array.isArray(dataset1), "Constant dataset1 must be an array");
  FlexibleDB.assertion(dataset1.length === 1, "Variable dataset1.length must be 1");
  FlexibleDB.assertion(dataset1[0].id === 2, "Variable dataset1.id must be 2");
  FlexibleDB.assertion(dataset1[0].nombre === "Coolio", "Variable dataset1.length must be «Coolio»");
  FlexibleDB.assertion(dataset1[0].dni === "tal tal noseqe", "Variable dataset1.length must be «tal tal noseqe»");

  await flexdb.updateOne("Cliente", 2, { nombre: "Coolio modificado" });

  const dataset2 = await flexdb.selectMany("Cliente", row => row.nombre === "Coolio modificado");

  FlexibleDB.assertion(Array.isArray(dataset2), "Constant dataset2 must be an array");
  FlexibleDB.assertion(dataset2.length === 1, "Variable dataset2.length must be 1");
  FlexibleDB.assertion(dataset2[0].id === 2, "Variable dataset2.id must be 2");
  FlexibleDB.assertion(dataset2[0].nombre === "Coolio modificado", "Variable dataset2.length must be «Coolio modificado»");
  FlexibleDB.assertion(dataset2[0].dni === "tal tal noseqe", "Variable dataset2.length must be «tal tal noseqe»");

  await flexdb.updateMany("Cliente", row => row.id === 3, { nombre: "Damian Marley" });

  const dataset3 = await flexdb.selectMany("Cliente", row => row.nombre === "Damian Marley");

  FlexibleDB.assertion(Array.isArray(dataset3), "Constant dataset3 must be an array");
  FlexibleDB.assertion(dataset3.length === 1, "Variable dataset3.length must be 1");
  FlexibleDB.assertion(dataset3[0].id === 3, "Variable dataset3.id must be 3");
  FlexibleDB.assertion(dataset3[0].nombre === "Damian Marley", "Variable dataset3.length must be «Damian Marley»");
  FlexibleDB.assertion(dataset3[0].dni === "ok ok ok noseke", "Variable dataset3.length must be «ok ok ok noseke»");

  await flexdb.deleteOne("Cliente", 1);

  const dataset4 = await flexdb.selectMany("Cliente", row => row.nombre);

  FlexibleDB.assertion(Array.isArray(dataset4), "Constant dataset4 must be an array");
  FlexibleDB.assertion(dataset4.length === 3, "Variable dataset4.length must be 3");

  await flexdb.deleteMany("Cliente", row => true);

  const dataset5 = await flexdb.selectMany("Cliente", row => row.nombre);

  FlexibleDB.assertion(Array.isArray(dataset5), "Constant dataset5 must be an array");
  FlexibleDB.assertion(dataset5.length === 0, "Variable dataset5.length must be 0");

  await flexdb.hydrate(dbstate1);

  const dataset6 = await flexdb.selectMany("Cliente", row => row.nombre);

  FlexibleDB.assertion(Array.isArray(dataset6), "Constant dataset6 must be an array");
  FlexibleDB.assertion(dataset6.length === 4, "Variable dataset6.length must be 4");

  await flexdb.reset();

  await flexdb.setSchema({
    Empleado: {
      nombre: { type: "string" },
      empresa: { type: "object-reference", referredTable: "Empresa" },
    },
    Empresa: {
      nombre: { type: "string" },
    },
    Venta: {
      nombre: { type: "string" },
      empleados_implicados: { type: "array-reference", referredTable: "Empleado" }
    }
  });

  const empresa1 = await flexdb.insertOne("Empresa", { nombre: "Google" });
  const empresa2 = await flexdb.insertOne("Empresa", { nombre: "Alphabet" });
  const empleado1 = await flexdb.insertOne("Empleado", { nombre: "Carlos", empresa: empresa1 });
  const empleado2 = await flexdb.insertOne("Empleado", { nombre: "David", empresa: empresa2 });

  try {
    await flexdb.deleteOne("Empresa", empresa1);
    throw new Error("Should have failed because integrity check (1)");
  } catch (error) { }
  await flexdb.deleteOne("Empleado", empleado1);
  await flexdb.deleteOne("Empresa", empresa1);

  const venta1 = await flexdb.insertOne("Venta", { nombre: "Alphabet", empleados_implicados: [empleado2] });

  try {
    await flexdb.deleteOne("Empleado", empleado2);
    throw new Error("Should have failed because integrity check (2)");
  } catch (error) { }
  await flexdb.deleteOne("Venta", venta1);
  await flexdb.deleteOne("Empleado", empleado2);

  console.log("Completado test.js");

};

module.exports = main();
```