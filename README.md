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
   - `await db.getSchema(): Promise<Object>`
   - `await db.setSchema(schema:Object): Promise`
   - `await db.renameTable(table:String, newName:String): Promise<Boolean>`
   - `await db.renameColumn(table:String, column:String, newName:String): Promise<Boolean>`
   - `await db.addTable(table:String): Promise<Boolean>`
   - `await db.addColumn(table:String, column:String, metadata:Object): Promise<Boolean>`
   - `await db.dropTable(table:String): Promise<Boolean>`
   - `await db.dropColumn(table:String, column:String): Promise<Boolean>`
- Soporta métodos de persistencia:
   - `db.hydrate`
   - `db.dehydrate`
- Soporta métodos de CRUD:
 - `await db.selectMany(table:String, filter:Function|Array = SELECT_ALL_FILTER, withTableType:Boolean|String = false): Promise<Array>`
   - `await db.selectOne(table:String, id:Number, withTableType:Boolean = false): Promise<Object>`
   - `await db.insertOne(table:String, value:Object): Promise<Integer>`
   - `await db.insertMany(table:String, values:Array<Object>): Promise<Array<Integer>>`
   - `await db.updateOne(table:String, id:Integer, properties:Object): Promise<Boolean>`
   - `await db.updateMany(table:String, filter:Function|Array, properties:Object): Promise<Array<Integer>>`
   - `await db.deleteOne(table:String, id:Integer): Promise<Boolean>`
   - `await db.deleteMany(table:String, filter:Function|Array): Promise<Array<Integer>>`
   - `await db.modifyAll(table:String, modifier:Function, errorHandler:Function = console.log): Promise<Array>`
   - `await db.expandRecords(sourceTable:String, dataset:Array, expandSpec:Object): Promise<Array>`
   - `await db.attachRecords(sourceTable:String, newColumn:String, referredTable:String, referredColumn:String, dataset:Array): Promise<Array>`
- Soporta una API para proxificar datasets con:
   - `proxy = FlexibleDB.DatasetProxy.from(dataset:Array, table:String, database:FlexibleDB)`
   - `proxy.$dataset:Array`
   - `proxy.$database:FlexibleDB`
   - `proxy.$table:String`
   - `proxy.findBySelector(selectorList:Array = []):DatasetProxy`
   - `proxy.setDataset(dataset:Array):DatasetProxy`
   - `proxy.setTable(table:String):DatasetProxy`
   - `proxy.setDatabase(database:Object):DatasetProxy`
   - `proxy.getDataset():any`
   - `proxy.copy():DatasetProxy`
   - `proxy.clone():DatasetProxy`
   - `proxy.deduplicate():DatasetProxy`
   - `await proxy.filter(callback:Function):Promise<DatasetProxy>`
   - `await proxy.map(callback:Function):Promise<DatasetProxy>`
   - `await proxy.reduce(callback:Function, original:any = []):Promise<DatasetProxy>`
   - `await proxy.each(callback:Function):Promise<DatasetProxy>`
   - `await proxy.expandRecords(sourceTable:String, expandSpec:Object = {}):Promise<DatasetProxy>`
   - `await proxy.attachRecords(sourceTable:String, newColumn:String, referredTable:String, referredColumn:String):Promise<DatasetProxy>`
- Soporta una API para desplegar servidores HTTP:
   - `server = db.createServer(port:Integer):BasicServer`
   - `await server.start(port:Integer = this.$port):Promise`
   - `await server.setFirewall(firewallCode:String):BasicServer`
   - `await server.stop():Promise`
   - `server.clone():BasicServer`
   - `await server.operation(opcode:String, args:Array):any`


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

#### `db.getRelationsSchema(): Object`

Devuelve el esquema de relaciones de datos, en *runtime*, se construye al vuelo.

Se espera un objeto con:
  
 - `<table>.<column>.(actives|passives)[*].quantity`: puede ser `1` o `N`.
 - `<table>.<column>.(actives|passives)[*].referredTable`: puede ser una tabla del `db.$schema`.

En el `*` se accede a una de dos:
 - o a la `<tableId><columnId>` en *relaciones activas*.
 - o a la `<referredTable>.<columnId>` en *relaciones pasivas*.

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
  - contenga opcionalmente: `<table>.<column>.nullable = true`
     - Provocará error si ese campo se pasa como `null`
  - contenga opcionalmente: `<table>.<column>.unique = true`
     - Provocará error si ese campo está repetido en otra row
     - No provocará error si ese campo se pasa como `null`
  - contenga opcionalmente: `<table>.<column>.defaultType = 'js'`
     - Provocará que el valor `defaut` especificado sirva como código fuente de una función que será:
        - evaluada en runtime
        - para sacar el valor `default`.
  - contenga opcionalmente: `<table>.<column>.default = ?`
     - Provocará que al llegar como `undefined` el valor, aplicará el `defaut` especificado.
     - Si el `typeof` da `function`, evaluará la función y tomará su retorno
     - Si el `<table>.<column>.defaultType === 'js'`, tomará `default` como código de una función en JavaScript.
        - En este caso se espera una sentencia `"return  *";` explícita en el `default`.

#### `db.dehydrate(): String`

Devuelve un `String` representando la base de datos.

#### `db.hydrate(stringifiedDatabase:String): Promise<void>`

Sobreescribe los `$ids`, `$data` y `$schema` de la base de datos con el `stringifiedDatabase` proporcionado.

En `stringifiedDatabase` se espera un `String` como el que devuelve `db.dehydrate()`.

#### `db.selectMany(table:String, filter:Function|Array = SELECT_ALL_FILTER, withTableType:Boolean|String = false): Promise<Array>`

Devuelve un `Array` con los registros donde la función `filter` ha devuelto `true`.

El `filter` también puede ser un array de operaciones booleanas, que aceptan los 3 parámetros típicos:

1. `columna`: nombre de la columna que queremos evaluar.
2. `operador`: operación lógica que queremos hacer, donde cabe poner:
   - `=`: igual a
   - `!=`: diferente de 
   - `<`: menor que
   - `<=`: menor o igual que
   - `>`: mayor que
   - `>=`: mayor o igual que
   - `is null`: es nulo
      - No usa parámetro objeto
   - `is not null`: no es nulo
      - No usa parámetro objeto
   - `has`: cuando la columna es un array, buscará el elemento especificado dentro
      - Debe usarse con columnas de tipo array
   - `has not`: igual pero a la inversa
      - Debe usarse con columnas de tipo array
   - `in`: cuando el parámetro objeto es un array, buscará que la columna no esté dentro
      - Debe usarse con un array
   - `not in`: igual pero a la inversa
      - Debe usarse con un array
3. `objeto`: el parámetro con el que se compara.

El flag `withTableType`, si `true`, adjunta el campo `type = <table>` en las rows.

#### `db.selectOne(table:String, id:Number, withTableType:Boolean = false): Promise<Object>`

Devuelve un `Object` con el registro que tiene el `id` especificado o lanza error.

El flag `withTableType`, si `true`, adjunta el campo `type = <table>` en la row.

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

#### `db.renameTable(table:String, newName:String): Promise<Boolean>`

Renombra una tabla a otro nombre y devuelve `true`.

#### `db.renameColumn(table:String, column:String, newName:String): Promise<Boolean>`

Renombra una columna a otro nombre y devuelve `true`.

#### `db.addTable(table:String): Promise<Boolean>`

Añade una tabla en el `db.$schema` y devuelve `true`.

#### `db.addColumn(table:String, column:String, metadata:Object): Promise<Boolean>`

Añade una columna en el `db.$schema` y devuelve `true`.

#### `db.dropTable(table:String): Promise<Boolean>`

Elimina una tabla en del `db.$schema` y devuelve `true`. Comprueba integridad referencial antes.

#### `db.dropColumn(table:String, column:String): Promise<Boolean>`

Elimina una columna del `db.$schema` y devuelve `true`. No necesita comprobación de integridad referencial.

#### `db.modifyAll(table:String, modifier:Function, errorHandler:Function = console.log): Promise<Array>`

Aplica una función, que debe devolver las propiedades que se cambian con respecto al original, a todas las rows de la tabla especificada. La función recibe:

- `it`: la row que se va a modificar.
   - Es un objeto *copia* del original, para que si se hacen cambios, no repercuta a `db.$data[table][id]`.
- `id`: el `id` de la row en la que se está iterando. Puede usarse para acceder al modelo real (y no solamente la copia anterior).

Devuelve los `id`s donde ha saltado un error y no se ha aplicado el cambio.

En caso de error, se ejecutará el `errorHandler` que por defecto es un `console.log`. Recibe:

- `error`: el error.
- `originalValue`: el valor original sin el `id`.
- `id`: el `id` de la row que ha fallado.
- `counter`: un contador de la iteración en la que ha fallado.

#### `db.expandRecords(sourceTable:String, dataset:Array, expandSpec:Object): Promise<Array>`

Sirve para adjuntar datos de esta tabla que se refieren a otras tablas, de forma recursiva.

- El parámetro `sourceTable` se refiere a la `db.$schema[sourceTable]` correspondiente al `dataset`.
- El parámetro `dataset` se refiere al conjunto de datos en sí.
- El parámetro `expandSpec` cumple con la función de *saber qué campos se tienen que expandir* solamente, y lo consigue:
   - Al poner un objeto con la clave `persona` entiendes que en `db.$schema[sourceTable].persona` hay una `array-reference` o `object-reference`.
   - Al poner otro objeto bajo `persona` en lugar de un simple `true`, añades que `persona` tiene otros tipos que queremos expandir.
   - De esta forma puedes recursivamente, por ejemplo:

```js
db.expandRecords("Usuario", dataset, { persona: { pais: true } });
```

Con este simple ejemplo, arrastramos `Usuario.persona` » `Persona.pais` » `Pais.*` automáticamente.

En este ejemplo estamos suponiendo un `schema` al uso.

Pero puedes ver los tests en [`test-of-complex-query.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-complex-query.js).


#### `db.attachRecords(sourceTable:String, newColumn:String, referredTable:String, referredColumn:String, dataset:Array): Promise<Array>`

Sirve para adjuntar datos de otras tablas que se refieren al tipo de esta tabla, sea como `array-reference` o como `object-reference`.

Amplía el `dataset` con una columna `newColumn` con todos los matches referidos en `db.$schema[referredTable][referredColumn]` del `dataset`.

Requiere de relaciones `array-reference` o `object-reference`, concretamente que `db.$schema[sourceTable]` sea la `referredTable` de `db.$schema[referredTable][referredColumn]`.

- El parámetro `sourceTable` indica el tipo de `db.$schema` que se considera a `dataset`.
- El parámetro `newColumn` indica la nueva columna para `dataset` que se va a utilizar para adjuntar los datos.
- El parámetro `referredTable` indica la tabla del `db.$schema` que contiene una columna que apunta con `array-reference` o `object-reference` a la tabla de `sourceTable`.
- El parámetro `referredColumn` indica la columna de `db.$schema[referredTable]` que apunta con `array-reference` o `object-reference` a la tabla de `sourceTable`.


#### `server = db.createServer(port:Integer):BasicServer`

Crea una instancia de `new FlexibleDB.BasicServer` si está encuentra `global`, que sobreentiende entorno `node.js`.

A continuación se expone la interfaz de `FlexibleDB.BasicServer` mediante la instancia `server`.

#### `server.start(port:Integer = this.$port):Promise`

Inicia un servidor en el puerto especificado. Si había alguno corriendo, lo sobreescribirá sin importarle su estado.

El servidor va a esperar 2 parámetros:

```js
request.body.opcode:String = "unknown"
request.body.parameters:Array = []
```

#### `server.setFirewall(firewallCode:String):BasicServer`

Permite establecer la lógica del firewall que se aplicará en las operaciones `server.operation`.

Es necesario dominar un lenguaje intermedio para poder ponerlo bien.

El fuente tiene como core esta sintaxis:

```pegjs
Controller_sentence = Event_sentence
    / Start_process_sentence
    / Break_process_sentence
    / Create_sentence
    / Assign_sentence
    / Always_sentence
    / Define_block_sentence
    / Follow_block_sentence
    / Throw_sentence
    / If_sentence
    / Native_expression
```

Luego para ver ejemplo completo está el fuente de las reglas del firewall básicas para cubrir las operaciones de la base de datos.

```
define block authentication {
    start process authentication {
        always {{ /* }}
        always {{ console.log("url", request.originalUrl); }}
        always {{ console.log("operation", operation); }}
        always {{ console.log("model", model); }}
        always {{ console.log("args", args); }}
        always {{ console.log("authenticationToken", authenticationToken); }}
        always {{ console.log("authentication", authentication); }}
        always {{ */ }}
        if not authentication then throw {{ new Error("The request requires authentication at this sensible point [52684251]") }}
    }
}

define block authorization {
    start process authorization {
        create permissions as {{ authentication.permisos.map(it => it.operacion) }}
        always {{ // console.log("permissions", permissions) }}
        create hasOperationPermission as {{ permissions.indexOf("server." + operation) !== -1 }}
        if hasOperationPermission then break process authorization
        throw {{ new Error("The request requires specific privilege «server." + operation + "» at this sensible point [12324688282]") }}
    }
}

define block basic_auth_steps {
    create authentication as {{ await this.authenticateRequest(request) }}
    follow block authentication
    follow block authorization
}

event on 
  operation
    "addTable"
    "addColumn"
    "renameTable"
    "renameColumn"
    "dropTable"
    "dropColumn"
    "setSchema"
  then follow block basic_auth_steps

event on
  model
    "Usuario"
    "Grupo"
    "Sesion"
  operation
    "insertOne"
    "insertMany"
    "updateOne"
    "updateMany"
    "deleteOne"
    "deleteMany"
  then follow block basic_auth_steps
```

Esto producirá un `javascript` bastante a bajo nivel que permitirá todo el juego de eventos y lógica cruzada.

Pero es muy importante aprender este lenguaje para meterse en la lógica del firewall.

El ejemplo todavía no es muy completo, pero el lenguaje permite:

  - crear variables con `create it as {{ 5000 + 5 }}`
  - asignar variables con `assign it to {{ 2000 }}`
  - llamar a código libre con `always {{ console.log("printing things") }}`
  - condicionales con `if {{ val }} then { ... }`
     - profundos con `else if {{ val }} then { ... }`
     - por defecto con `else then { ... }`
  - lanzar errores con `throw {{ new Error("Whatever") }}
  - iniciar un proceso con `start process Process_id { ... }`
  - romper un proceso con `break process Process_id`
  - definir un bloque con `define block Block_id { ... }`
     - esto sirve para definir macros en memoria
     - no afecta al código de salida
  - imprimir un bloque con `follow block Block_id`
     - esto sirve para imprimir un bloque
     - afecta al código de salida en tanto que se va a imprimir tal cual el bloque
  - agrupar variables para expresiones booleanas
     - tiene parámetros `(~)` para agrupar variables y/o expresiones
     - tiene parámetros `not ~` para negar variables y/o expresiones
     - tiene parámetros `~ and ~`  para emplear conjunción lógica entre variables y/o expresiones
     - tiene parámetros `~ or ~`  para emplear disyunción lógica entre variables y/o expresiones

Este lenguaje busca la **alta legibilidad** en las lógicas del **control de negocio**.

#### `server.stop():Promise`

Para el servidor que estuviera corriendo.

#### `server.clone():BasicServer`

Devuelve otra instancia de `BasicServer.from(...server)`.

#### `server.clone():BasicServer`

Devuelve otra instancia de `BasicServer.from(...server)`.

#### `server.operation(opcode:String, args:Array):any`

Ejecuta una acción contemplada en la API de `operation` pasándole los parámetros especificados.

Los `opcode` válidos actualmente solo son los **nombres finales** de los **métodos** de la API. Aquí el switch cerrado de operaciones del `BasicServer.operation`:

```js
async operation(opcode, args = [], authenticationToken = null, request = null, response = null) {
  assertion(typeof opcode === "string", `Parameter «opcode» must be a string on «operation» specifically «${opcode}»`);
  assertion(Array.isArray(args), `Parameter «args» must be an array on «operation» specifically «${opcode}»`);
  let output = null;
  switch(opcode) {
    case "login": {
      return await this.login(...args);
    }
  }
  assertion(typeof authenticationToken === "string", `Parameter «authenticationToken» must be a string on «operation» specifically «${opcode}»`);
  assertion(typeof request === "object", `Parameter «request» must be an object on «operation» specifically «${opcode}»`);
  assertion(typeof response === "object", `Parameter «response» must be an object on «operation» specifically «${opcode}»`);
  await this.onAuthenticate(opcode, args, authenticationToken, request, response);
  switch (opcode) {
    case "logout": {
      output = await this.logout(...args);
      break;
    }
    case "selectOne": {
      output = await this.$database.selectOne(...args);
      break;
    }
    case "selectOne": {
      output = await this.$database.selectOne(...args);
      break;
    }
    case "selectMany": {
      output = await this.$database.selectMany(...args);
      break;
    }
    case "insertOne": {
      output = await this.$database.insertOne(...args);
      break;
    }
    case "insertMany": {
      output = await this.$database.insertMany(...args);
      break;
    }
    case "updateOne": {
      output = await this.$database.updateOne(...args);
      break;
    }
    case "updateMany": {
      output = await this.$database.updateMany(...args);
      break;
    }
    case "deleteOne": {
      output = await this.$database.deleteOne(...args);
      break;
    }
    case "deleteMany": {
      output = await this.$database.deleteMany(...args);
      break;
    }
    case "addTable": {
      output = await this.$database.addTable(...args);
      break;
    }
    case "addColumn": {
      output = await this.$database.addColumn(...args);
      break;
    }
    case "renameTable": {
      output = await this.$database.renameTable(...args);
      break;
    }
    case "renameColumn": {
      output = await this.$database.renameColumn(...args);
      break;
    }
    case "dropTable": {
      output = await this.$database.dropTable(...args);
      break;
    }
    case "dropColumn": {
      output = await this.$database.dropColumn(...args);
      break;
    }
    case "getSchema": {
      output = await this.$database.getSchema(...args);
      break;
    }
    case "setSchema": {
      output = await this.$database.setSchema(...args);
      break;
    }
    default: {
      throw new Error(`Parameter «opcode» must be a known opcode on «BasicServer.operation»`);
    }
  }
  return output;
}
```

Las que usan `Function` pueden funcionar con una serie de reglas:

```js
await server.operation("selectMany", ["Grupos", [
  ["id", "=", 1]
]]);
```

Este subset para selectores permite operaciones por servidor que sean seguras.

Se permiten los siguientes operadores, formando sentencias encadenadas por ` && ` lógico.

Aquí es donde se transforman en operaciones:

```js
switch(op) {
  case "=": {
    isValid = isValid && row[column] === target;
    break;
  }
  case "!=": {
    isValid = isValid && (row[column] !== target);
    break;
  }
  case "<": {
    isValid = isValid && (row[column] < target);
    break;
  }
  case ">": {
    isValid = isValid && (row[column] > target);
    break;
  }
  case "<=": {
    isValid = isValid && (row[column] <= target);
    break;
  }
  case ">=": {
    isValid = isValid && (row[column] >= target);
    break;
  }
  case "is null": {
    isValid = isValid && (row[column] === null);
    break;
  }
  case "is not null": {
    isValid = isValid && (row[column] !== null);
    break;
  }
  case "is in": {
    isValid = isValid && (target.indexOf(row[column]) !== -1);
    break;
  }
  case "is not in": {
    isValid = isValid && (target.indexOf(row[column]) === -1);
    break;
  }
  case "has": {
    isValid = isValid && (row[column].indexOf(target) !== -1);
    break;
  }
  case "has not": {
    isValid = isValid && (row[column].indexOf(target) === -1);
    break;
  }
}
```

#### `proxy = db.proxifyDataset(dataset:Array, table:String = null)`

Crea una instancia de `new FlexibleDB.DatasetProxy(dataset, table, db)` sobreentendiendo la `db` propia.

A continuación se expone la interfaz de `FlexibleDB.DatasetProxy` mediante la instancia `proxy`.

#### `proxy.$dataset:Array`

El `dataset` sobre el que se está iterando.

#### `proxy.$database:Object`

La `database` que se está usando para tipos.

#### `proxy.$table:String`

La `table` que se sobreentiende como tipo del `dataset`.

#### `proxy.findBySelector(selectorList:Array = []):DatasetProxy`

Permite cambiar el dataset con una subselección interna y encadenar otros métodos.

#### `proxy.setDataset(dataset:Array):DatasetProxy`

Permite cambiar el dataset y encadenar otros métodos.

#### `proxy.setTable(table:String):DatasetProxy`

Permite cambiar la tabla del dataset y encadenar otros métodos.

#### `proxy.setDatabase(database:Object):DatasetProxy`

Permite cambiar la base de datos del dataset y encadenar otros métodos.

#### `proxy.getDataset():any`

Permite obtener el dataset propiamente.

#### `proxy.copy():DatasetProxy`

Permite hacer una copia JSON (con `stringify` y `parse`) del dataset y encadenar otros métodos.

#### `proxy.clone():DatasetProxy`

Permite hacer un clon del `DatasetProxy` y encadenar otros métodos.

Es útil para iterar datos de un subset o al menos una copia diferente de proxy.

#### `proxy.deduplicate():DatasetProxy`

Permite desduplicar un conjunto de datos. Utiliza el `row.id` y si no lo encuentra, el `row` directamente.

#### `async proxy.filter(callback:Function):Promise<DatasetProxy>`

Permite hacer `filter` asíncronamente para operar sobre el dataset.

Conviene usarlo con una línea aparte que iterará sobre el dataset interno, porque es asíncrono.

La firma contractual de la función es la típica de `Array.prototype.filter`.

#### `async proxy.map(callback:Function):Promise<DatasetProxy>`

Permite hacer `map` asíncronamente para operar sobre el dataset.

Conviene usarlo con una línea aparte que iterará sobre el dataset interno, porque es asíncrono.

La firma contractual de la función es la típica de `Array.prototype.map`.

#### `async proxy.reduce(callback:Function, original:any = []):Promise<DatasetProxy>`

Permite hacer `reduce` asíncronamente para operar sobre el dataset.

Conviene usarlo con una línea aparte que iterará sobre el dataset interno, porque es asíncrono.

La firma contractual de la función es la típica de `Array.prototype.reduce`.

#### `async proxy.each(callback:Function):Promise<DatasetProxy>`

Permite hacer `each` asíncronamente para operar sobre el dataset.

Conviene usarlo con una línea aparte que iterará sobre el dataset interno, porque es asíncrono.

La firma contractual de la función es la típica de `Array.prototype.each`.

#### `async proxy.expandRecords(sourceTable:String, expandSpec:Object = {}):Promise<DatasetProxy>`

Permite expandir registros del dataset con la database.

Sigue el mismo contrato de tipos que el homónimo `db.expandRecords(sourceTable, dataset, expandSpec)` dando por sobreentendido el `dataset`.

Conviene usarlo con una línea aparte que iterará sobre el dataset interno, porque es asíncrono.

#### `async proxy.attachRecords(sourceTable:String, newColumn:String, referredTable:String, referredColumn:String):Promise<DatasetProxy>`

Permite adjuntar registros del dataset con la database.

Sigue el mismo contrato de tipos que el homónimo `db.attachRecords(sourceTable, newColumn, referredTable, referredColumn, dataset)` dando por sobreentendido el `dataset`.

Conviene usarlo con una línea aparte que iterará sobre el dataset interno, porque es asíncrono.





## Tests

Estos son los tests actualmente:

- [test-on-readme.js](https://github.com/allnulled/flexible-db/blob/main/test-on-readme.js)
- [test-of-persistence.js](https://github.com/allnulled/flexible-db/blob/main/test-of-persistence.js)
- [test-of-triggers.js](https://github.com/allnulled/flexible-db/blob/main/test-of-triggers.js)
- [test-of-renaming.js](https://github.com/allnulled/flexible-db/blob/main/test-of-renaming.js)
- [test-of-rescheming.js](https://github.com/allnulled/flexible-db/blob/main/test-of-rescheming.js)
- [test-of-modify-all.js](https://github.com/allnulled/flexible-db/blob/main/test-of-modify-all.js)
- [test-of-uniqueness.js](https://github.com/allnulled/flexible-db/blob/main/test-of-uniqueness.js)
- [test-of-relations.js](https://github.com/allnulled/flexible-db/blob/main/test-of-relations.js)
- [test-of-complex-query.js](https://github.com/allnulled/flexible-db/blob/main/test-of-complex-query.js)
- [test-of-dataset-proxy.js](https://github.com/allnulled/flexible-db/blob/main/test-of-dataset-proxy.js)
- [test-of-server.js](https://github.com/allnulled/flexible-db/blob/main/test-of-server.js)
- [test-of-default.js](https://github.com/allnulled/flexible-db/blob/main/test-of-default.js)


## Ejemplo práctico



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

  let passes1 = false;
  try {
    await flexdb.deleteOne("Empresa", empresa1);
  } catch (error) {
    passes1 = true;
  }
  if(!passes1) {
    throw new Error("Should throw integrity error (1)");
  }
  let passes2 = false;
  try {
    await flexdb.deleteOne("Empresa", empresa2);
  } catch (error) {
    passes2 = true;
  }
  if(!passes2) {
    throw new Error("Should throw integrity error (2)");
  }
  let passes3 = false;
  try {
    await flexdb.deleteOne("Persona", persona1);
  } catch (error) {
    passes3 = true;
  }
  if(!passes3) {
    throw new Error("Should throw integrity error (3)");
  }
  console.log("Completado test-on-readme.js");

};

module.exports = main();
```