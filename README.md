# flexible-db

Base de datos basada en JavaScript.

## Instalación

```
npm i -s @allnulled/flexible-db
```

## Features

- Soporta esquema estricto (obligatorio, no es tan flexible)
- Soporta referencias de objetos y de listas externas
- Soporta integridad de estas referencias
- Soporta los tipos:
   - "boolean"
   - "integer"
   - "float"
   - "string"
   - "object"
   - "array"
   - "object-reference" (integridad referencial)
   - "array-reference" (integridad referencial)
- Soporta métodos de esquema:
   - getSchema
   - setSchema
- Soporta métodos de persistencia:
   - hydrate
   - dehydrate
- Soporta métodos de CRUD:
   - selectMany
   - insertOne
   - insertMany
   - updateOne
   - updateMany
   - deleteOne
   - deleteMany

## API

### `db = FlexibleDB.create(): Object`

Crea una instancia de base de datos.

Tiene:

- `db.$ids`
- `db.$data`
- `db.$schema`

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
        - con `referredTable = <una tabla conocida por schema>`
     - `"array-reference"`
        - con `referredTable = <una tabla conocida por schema>`

### `db.dehydrate(): String`

Devuelve un `String` representando la base de datos.

### `db.hydrate(stringifiedDatabase:String): void`

Sobreescribe los `$ids`, `$data` y `$schema` de la base de datos con el `stringifiedDatabase` proporcionado.

En `stringifiedDatabase` se espera un `String` como el que devuelve `db.dehydrate()`.

### `db.selectMany(table:String, filter:Function): Array`

Devuelve un `Array` con los registros donde la función `filter` ha devuelto `true`.

### `db.insertOne(table:String, value:Object): Integer`

Inserta un registro y devuelve su `id`.

### `db.insertMany(table:String, values:Array<Object>): Array<Integer>`

Inserta múltiples registros y devuelve sus `ids`.

### `db.updateOne(table:String, id:Integer, properties:Object): Boolean`

Actualiza un registro concreto y devuelve `true`.

### `db.updateMany(table:String, filter:Function, properties:Object): Array<Integer>`

Actualiza múltiples registros y devuelve sus `id`s en un `Array`.

### `db.deleteOne(table:String, id:Integer): Boolean`

Elimina un registro concreto y devuelve sus `true`.

### `db.deleteMany(table:String, filter:Function): Array<Integer>`

Elimina múltiples registros y devuelve sus `id`s en un `Array`.

## Uso

```js
require(__dirname + "/flexible-db.js");

const flexdb = FlexibleDB.create();

flexdb.setSchema({
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

const persona1 = flexdb.insertOne("Persona", {
  nombre: "Carlos",
  dni: "777K",
  nacimiento: "05/01/1991"
});

const empresa1 = flexdb.insertOne("Empresa", { nombre: "ASML" });
const empresa2 = flexdb.insertOne("Empresa", { nombre: "Al Jazeera" });
const empresa3 = flexdb.insertOne("Empresa", { nombre: "KGB" });

const cliente1 = flexdb.insertOne("Cliente", {
  persona: persona1,
  empresas: [empresa1, empresa2],
});

try {
  flexdb.deleteOne("Empresa", empresa1);
  throw new Error("Should throw integrity error (1)");
} catch (error) {}
try {
  flexdb.deleteOne("Empresa", empresa2);
  throw new Error("Should throw integrity error (2)");
} catch (error) {}
try {
  flexdb.deleteOne("Persona", persona1);
  throw new Error("Should throw integrity error (3)");
} catch (error) {}
```

## Test

Este es el ejemplo del test genérico:

```js
require(__dirname + "/flexible-db.js");

const flexdb = FlexibleDB.create();

flexdb.setSchema({
  Cliente: {
    nombre: FlexibleDB.type("string"),
    dni: FlexibleDB.type("string"),
  }
});

flexdb.insertOne("Cliente", {
  nombre: "Carlos",
  dni: "taltaltal",
});

flexdb.insertMany("Cliente", [{
  nombre: "Coolio",
  dni: "tal tal noseqe"
}, {
  nombre: "Jr. Gong",
  dni: "ok ok ok noseke",
}, {
  nombre: "Snoop Dog",
  dni: "noseke nose ke",
}]);

const dbstate1 = flexdb.dehydrate();

const dataset0 = flexdb.selectMany("Cliente");

FlexibleDB.assertion(Array.isArray(dataset0), "Constant dataset0 must be an array");
FlexibleDB.assertion(dataset0.length === 4, "Variable dataset0.length must be 4");

const dataset1 = flexdb.selectMany("Cliente", row => row.nombre === "Coolio");

FlexibleDB.assertion(Array.isArray(dataset1), "Constant dataset1 must be an array");
FlexibleDB.assertion(dataset1.length === 1, "Variable dataset1.length must be 1");
FlexibleDB.assertion(dataset1[0].id === 2, "Variable dataset1.id must be 2");
FlexibleDB.assertion(dataset1[0].nombre === "Coolio", "Variable dataset1.length must be «Coolio»");
FlexibleDB.assertion(dataset1[0].dni === "tal tal noseqe", "Variable dataset1.length must be «tal tal noseqe»");

flexdb.updateOne("Cliente", 2, { nombre: "Coolio modificado" });

const dataset2 = flexdb.selectMany("Cliente", row => row.nombre === "Coolio modificado");

FlexibleDB.assertion(Array.isArray(dataset2), "Constant dataset2 must be an array");
FlexibleDB.assertion(dataset2.length === 1, "Variable dataset2.length must be 1");
FlexibleDB.assertion(dataset2[0].id === 2, "Variable dataset2.id must be 2");
FlexibleDB.assertion(dataset2[0].nombre === "Coolio modificado", "Variable dataset2.length must be «Coolio modificado»");
FlexibleDB.assertion(dataset2[0].dni === "tal tal noseqe", "Variable dataset2.length must be «tal tal noseqe»");

flexdb.updateMany("Cliente", row => row.id === 3, { nombre: "Damian Marley" });

const dataset3 = flexdb.selectMany("Cliente", row => row.nombre === "Damian Marley");

FlexibleDB.assertion(Array.isArray(dataset3), "Constant dataset3 must be an array");
FlexibleDB.assertion(dataset3.length === 1, "Variable dataset3.length must be 1");
FlexibleDB.assertion(dataset3[0].id === 3, "Variable dataset3.id must be 3");
FlexibleDB.assertion(dataset3[0].nombre === "Damian Marley", "Variable dataset3.length must be «Damian Marley»");
FlexibleDB.assertion(dataset3[0].dni === "ok ok ok noseke", "Variable dataset3.length must be «ok ok ok noseke»");

flexdb.deleteOne("Cliente", 1);

const dataset4 = flexdb.selectMany("Cliente", row => row.nombre);

FlexibleDB.assertion(Array.isArray(dataset4), "Constant dataset4 must be an array");
FlexibleDB.assertion(dataset4.length === 3, "Variable dataset4.length must be 3");

flexdb.deleteMany("Cliente", row => true);

const dataset5 = flexdb.selectMany("Cliente", row => row.nombre);

FlexibleDB.assertion(Array.isArray(dataset5), "Constant dataset5 must be an array");
FlexibleDB.assertion(dataset5.length === 0, "Variable dataset5.length must be 0");

flexdb.hydrate(dbstate1);

const dataset6 = flexdb.selectMany("Cliente", row => row.nombre);

FlexibleDB.assertion(Array.isArray(dataset6), "Constant dataset6 must be an array");
FlexibleDB.assertion(dataset6.length === 4, "Variable dataset6.length must be 4");

flexdb.reset();

flexdb.setSchema({
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

const empresa1 = flexdb.insertOne("Empresa", { nombre: "Google" });
const empresa2 = flexdb.insertOne("Empresa", { nombre: "Alphabet" });
const empleado1 = flexdb.insertOne("Empleado", { nombre: "Carlos", empresa: empresa1 });
const empleado2 = flexdb.insertOne("Empleado", { nombre: "David", empresa: empresa2 });

try {
  flexdb.deleteOne("Empresa", empresa1);
  throw new Error("Should have failed because integrity check (1)");
} catch (error) {}
flexdb.deleteOne("Empleado", empleado1);
flexdb.deleteOne("Empresa", empresa1);

const venta1 = flexdb.insertOne("Venta", { nombre: "Alphabet", empleados_implicados: [empleado2] });

try {
  flexdb.deleteOne("Empleado", empleado2);
  throw new Error("Should have failed because integrity check (2)");
} catch (error) {}
flexdb.deleteOne("Venta", venta1);
flexdb.deleteOne("Empleado", empleado2);
```