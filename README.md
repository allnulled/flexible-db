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
   - `await db.selectByUid(uid:String): Promise<Object|null>`
   - `await db.selectByLabel(table:String, label:String): Promise<Array>`
   - `await db.selectByLabels(table:String, labels:Array<String>): Promise<Array>`
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
   - `proxy = FlexibleDB.BasicDataset.from(dataset:Array, table:String, database:FlexibleDB)`
   - `proxy = db.createDataset(dataset:Array, table:String)`
   - `proxy.$dataset:Array`
   - `proxy.$database:FlexibleDB`
   - `proxy.$table:String`
   - `proxy.findBySelector(selectorList:Array = []):BasicDataset`
   - `proxy.setDataset(dataset:Array):BasicDataset`
   - `proxy.setTable(table:String):BasicDataset`
   - `proxy.setDatabase(database:Object):BasicDataset`
   - `proxy.getDataset():any`
   - `proxy.copy():BasicDataset`
   - `proxy.clone():BasicDataset`
   - `proxy.deduplicate():BasicDataset`
   - `proxy.filterById(id:String):BasicDataset`
   - `proxy.mapById(id:String):BasicDataset`
   - `proxy.flat():BasicDataset`
   - `proxy.hasAnyOf(list:Array):BasicDataset`
   - `await proxy.filter(callback:Function):Promise<BasicDataset>`
   - `await proxy.map(callback:Function):Promise<BasicDataset>`
   - `await proxy.reduce(callback:Function, original:any = []):Promise<BasicDataset>`
   - `await proxy.each(callback:Function):Promise<BasicDataset>`
   - `await proxy.expandRecords(sourceTable:String, expandSpec:Object = {}):Promise<BasicDataset>`
   - `await proxy.attachRecords(sourceTable:String, newColumn:String, referredTable:String, referredColumn:String):Promise<BasicDataset>`
- Soporta una API para desplegar servidores HTTP:
   - `server = db.createServer(port:Integer):BasicServer`
   - `server.clone():BasicServer`
   - `await server.start(port:Integer = this.$port):Promise`
   - `await server.login(alias:String, email:String, password:String):String`
   - `await server.logout(token:String):String`
   - `await server.getFirewall():AsyncFunction`
   - `await server.setFirewall(firewallCode:String):BasicServer`
   - `await server.triggerFirewall(operation:String, args:Array, authenticationToken:String, request:ExpressRequest, response:ExpressResponse):BasicServer`
   - `server.stop():BasicServer`
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

#### `db.selectByUid(uid:String): Promise<Object>`

Devuelve un `Object` con el registro que tiene el `uid` especificado o lanza error.

El flag `withTableType` se sobreentiende como `true`.

No es necesario especificar la `table` porque `uid` es universal.

#### `db.selectByLabel(table:String, label:String): Promise<Array>`

Devuelve un `Array` con los registros en los que aparezca `label` en las columnas con `label:true`.

Buscará en todas las columnas donde `label:true` aparezca.

Si la columna es tipo `string`, buscará con `===`.

Si la columna es tipo `array`, buscará con `.indexOf`.

#### `db.selectByLabels(table:String, labels:Array<String>): Promise<Array>`

Variante del método anterior donde se le pasa una lista de `labels` para buscar.

Si la columna es tipo `string`, buscará con `labels.indexOf`.

Si la columna es tipo `array`, buscará con `BasicDataset.hasAnyOf`.

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

#### `server.login(alias:String|null, email:String|null, password:String):Promise<String>`

Permite iniciar o recuperar una sesión del sistema. Utiliza o `Usuario.alias` o `Usuario.email`, y luego `Usuario.password`.

#### `server.logout(token:String):Promise<Boolean>`

Permite finalizar una sesión del sistema. Utiliza un `Sesion.token`.

#### `server.getFirewall():AsyncFunction`

Permite acceder a la función compilada del firewall.

#### `server.setFirewall(firewallCode:String):BasicServer`

Permite establecer la lógica del firewall que se aplicará en las operaciones `server.operation`.

Este método está pensado para `node.js` y usa `require` para importar el parser del lenguaje del firewall.

Es necesario dominar un pequeño lenguaje intermedio para poder establecer reglas del firewall bien.

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
  - los `event on` son `if` en realidad
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

#### `server.triggerFirewall(operation:String, args:Array, authenticationToken:String, request:ExpressRequest, response:ExpressResponse)`

Permite hacer la llamada a la función compilada de `server.setFirewall(firewallCode:String)`.

La función inyecta los siguientes parámetros:

- `operation:String`: el método que se va a utilizar en esta llamada
- `args:Array`: los parámetros que se le pasan al método de `operation` en formato `metodo(...parametros)`, por eso siempre es array.
- `authenticationToken:String`: el token de sesión
- `request:ExpressRequest`: la petición de `express`
- `response:ExpressResponse`: la response de `express`
- `model:String`: en principio es `args[0]` que coincide en muchas con el `model` pero dependerá de `operation` si este argumento tiene sentido o es un valor no relevante, porque no siempre `args[0]` es el modelo.

Esto significa que en el script que ponemos en `server.setFirewall(source)` existen por lo menos estos parametros inyectados en el espacio de nombres de la `AsyncFunction`.

#### `server.stop():BasicServer`

Permite parar el servidor que estuviera corriendo y encadenar otros métodos.

#### `server.clone():BasicServer`

Devuelve otra instancia de `BasicServer.from(...server)`.

#### `server.authenticateRequest(request):Promise<Object|Boolean>`

Devuelve un objeto de autentificación. Tiene:

- `usuario:Object`
- `grupos:Array`
- `permisos:Array`
- `sesion:Object`

Si no ha sido posible, devuelve un booleano `false`,

#### `server.generateSessionToken():String`

Método utilitario para generar tokens de sesión.

#### `server.onAuthenticate(opcode:String, args:Array, authenticationToken:String = null, request:ExpressRequest = null, response:ExpressResponse = null):String`

Método usado internamente en `server.operation` para autentificar las peticiones.

Principalmente, lo que este método hace es llamar al firewall con `server.triggerFirewall(...)`.

Este método es llamado nada más iniciar `server.operation` si se han validado los parámetros.

Está aparte para que se pueda sobreescribir con una clase nueva si se quiere.

#### `server.operation(opcode:String, args:Array):Promise<any>`

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

#### `proxy = db.createDataset(dataset:Array, table:String = null)`

Crea una instancia de `new FlexibleDB.BasicDataset(dataset, table, db)` sobreentendiendo la `db` propia.

A continuación se expone la interfaz de `FlexibleDB.BasicDataset` mediante la instancia `proxy`.

#### `proxy.$dataset:Array`

El `dataset` sobre el que se está iterando.

#### `proxy.$database:Object`

La `database` que se está usando para tipos.

#### `proxy.$table:String`

La `table` que se sobreentiende como tipo del `dataset`.

#### `proxy.findBySelector(selectorList:Array = []):BasicDataset`

Permite cambiar el dataset con una subselección interna y encadenar otros métodos.

El juego de selectores permite:

- `["id"]`, donde:
   - si el `$dataset` es un `array` cogerá la propiedad `id` de todos los items, la flateneará y la deduplicará.
   - si el `$dataset` es un `object` cogerá la propiedad `id` del objeto
- `["*", "*", "ids"]`, donde:
   - si el `$dataset` es un `array` cogerá las propiedad `ids` de todos los items, pero no las flateneará ni deduplicará.
   - si el `$dataset` es un `object` pasará el objeto de rows a columnas, y luego seleccionará el `ids`, pero no lo flateneará ni deduplicará.

El doble asterisco `"*", "*"` permite pasar la vista de `rows` a `columnas`, entonces sirve para agrupar los valores por columnas.

En el [`test-of-select-by-uid-and-others.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-select-by-uid-and-others.js) está incluida una pequeña prueba.

#### `proxy.setDataset(dataset:Array):BasicDataset`

Permite cambiar el dataset y encadenar otros métodos.

#### `proxy.setTable(table:String):BasicDataset`

Permite cambiar la tabla del dataset y encadenar otros métodos.

#### `proxy.setDatabase(database:Object):BasicDataset`

Permite cambiar la base de datos del dataset y encadenar otros métodos.

#### `proxy.getDataset():any`

Permite obtener el dataset propiamente.

#### `proxy.copy():BasicDataset`

Permite hacer una copia JSON (con `stringify` y `parse`) del dataset y encadenar otros métodos.

#### `proxy.clone():BasicDataset`

Permite hacer un clon del `BasicDataset` y encadenar otros métodos.

Es útil para iterar datos de un subset o al menos una copia diferente de proxy.

#### `proxy.deduplicate():BasicDataset`

Permite desduplicar un conjunto de datos. Utiliza el `row.id` y si no lo encuentra, el `row` directamente.


#### `proxy.filterById(id:String):BasicDataset`

Permite cambiar el `this.$dataset` aplicando un `filter` por una columna concreta especificada y encadenar otros métodos.

#### `proxy.mapById(id:String):BasicDataset`

Permite cambiar el `this.$dataset` aplicando un `map` por una columna concreta especificada y encadenar otros métodos.

#### `proxy.flat():BasicDataset`

Permite cambiar el `this.$dataset` aplicando un `flat` que es que si una row es 1 array, la junta como ítems no como array con las otras rows, y encadenar otros métodos.

#### `proxy.hasAnyOf(list:Array):BasicDataset`

Permite saber si `proxy.$dataset:Array` contiene alguno de los ítems de `list:Array`.

#### `BasicDataset.hasAnyOf(list1:Array, list2:Array):BasicDataset`

Lo mismo que la anterior pero sin sobreentender `this.$dataset` como `list1`.

#### `async proxy.filter(callback:Function):Promise<BasicDataset>`

Permite hacer `filter` asíncronamente para operar sobre el dataset.

Conviene usarlo con una línea aparte que iterará sobre el dataset interno, porque es asíncrono.

La firma contractual de la función es la típica de `Array.prototype.filter`.

#### `async proxy.map(callback:Function):Promise<BasicDataset>`

Permite hacer `map` asíncronamente para operar sobre el dataset.

Conviene usarlo con una línea aparte que iterará sobre el dataset interno, porque es asíncrono.

La firma contractual de la función es la típica de `Array.prototype.map`.

#### `async proxy.reduce(callback:Function, original:any = []):Promise<BasicDataset>`

Permite hacer `reduce` asíncronamente para operar sobre el dataset.

Conviene usarlo con una línea aparte que iterará sobre el dataset interno, porque es asíncrono.

La firma contractual de la función es la típica de `Array.prototype.reduce`.

#### `async proxy.each(callback:Function):Promise<BasicDataset>`

Permite hacer `each` asíncronamente para operar sobre el dataset.

Conviene usarlo con una línea aparte que iterará sobre el dataset interno, porque es asíncrono.

La firma contractual de la función es la típica de `Array.prototype.each`.

#### `async proxy.expandRecords(sourceTable:String, expandSpec:Object = {}):Promise<BasicDataset>`

Permite expandir registros del dataset con la database.

Sigue el mismo contrato de tipos que el homónimo `db.expandRecords(sourceTable, dataset, expandSpec)` dando por sobreentendido el `dataset`.

Conviene usarlo con una línea aparte que iterará sobre el dataset interno, porque es asíncrono.

#### `async proxy.attachRecords(sourceTable:String, newColumn:String, referredTable:String, referredColumn:String):Promise<BasicDataset>`

Permite adjuntar registros del dataset con la database.

Sigue el mismo contrato de tipos que el homónimo `db.attachRecords(sourceTable, newColumn, referredTable, referredColumn, dataset)` dando por sobreentendido el `dataset`.

Conviene usarlo con una línea aparte que iterará sobre el dataset interno, porque es asíncrono.





## Tests

Estos son los tests actualmente:

- [`test-of-complex-query.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-complex-query.js)
- [`test-of-controller-language.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-controller-language.js)
- [`test-of-dataset-proxy.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-dataset-proxy.js)
- [`test-of-default.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-default.js)
- [`test-of-modify-all.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-modify-all.js)
- [`test-of-performance.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-performance.js)
- [`test-of-persistence.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-persistence.js)
- [`test-of-relations-schema.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-relations-schema.js)
- [`test-of-renaming.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-renaming.js)
- [`test-of-rescheming.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-rescheming.js)
- [`test-of-select-by-uid-and-others.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-select-by-uid-and-others.js)
- [`test-of-server.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-server.js)
- [`test-of-trigger.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-trigger.js)
- [`test-of-uniqueness.js`](https://github.com/allnulled/flexible-db/blob/main/test-of-uniqueness.js)
- [`test-on-readme.js`](https://github.com/allnulled/flexible-db/blob/main/test-on-readme.js)
- [`test.js`](https://github.com/allnulled/flexible-db/blob/main/test.js)

## Ejemplo práctico



```js
require(__dirname + "/flexible-db.js");

const main = async function () {
  const flexdb = FlexibleDB.create({

  });

  await flexdb.setSchema({
    Sesion: {
      token: { type: "string", nullable: false },
      usuario: { type: "object-reference", referredTable: "Usuario", nullable: false },
    },
    Pais: {
      nombre: { type: "string" },
      presidentes: { type: "array-reference", referredTable: "Persona" }
    },
    Persona: {
      nombre: { type: "string", label: true, },
      edad: { type: "integer", },
      pais: { type: "object-reference", referredTable: "Pais" },
      tags: { type: "array", default: [], label: true }
    },
    Usuario: {
      persona: { type: "object-reference", referredTable: "Persona" },
      alias: { type: "string", unique: true },
      email: { type: "string", unique: true },
      password: { type: "string" }
    },
    Grupo: {
      nombre: { type: "string", unique: true },
      usuarios: { type: "array-reference", referredTable: "Usuario" },
      permisos: { type: "array-reference", referredTable: "Permiso" },
      presidente: { type: "object-reference", referredTable: "Usuario", nullable: true },
      legislaciones: { type: "array-reference", referredTable: "Legislacion", nullable: true },
    },
    Permiso: {
      nombre: { type: "string", unique: true },
      operacion: { type: "string" },
      modelo: { type: "string" },
      descripcion: { type: "string" },
    },
    Legislacion: {
      titulo: { type: "string" },
      contenido: { type: "string" },
      creador: { type: "object-reference", referredTable: "Persona" }
    },
  });

  await flexdb.insertOne("Persona", { nombre: "Carlos", edad: 20, pais: 1, tags: ["uat"] });
  await flexdb.insertOne("Persona", { nombre: "user2", edad:  30, pais: 1, tags: ["cal"] });
  await flexdb.insertOne("Persona", { nombre: "user3", edad:  40, pais: 1, tags: ["nic"] });
  await flexdb.insertOne("Persona", { nombre: "user4", edad:  50, pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user5", edad:  60, pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user6", edad:  70, pais: 1 });
  const legislacion1 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 1", contenido: "tal", creador: 1 });
  const legislacion2 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 2", contenido: "tal", creador: 2 });
  const legislacion3 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 3", contenido: "tal", creador: 1 });
  const legislacion4 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 4", contenido: "tal", creador: 2 });
  const legislacion5 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 5", contenido: "tal", creador: 1 });
  const legislacion6 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 6", contenido: "tal", creador: 4 });
  await flexdb.insertOne("Pais", { nombre: "España", presidentes: [1] });
  await flexdb.insertOne("Pais", { nombre: "Andorra", presidentes: [2] });
  await flexdb.insertOne("Pais", { nombre: "Francia", presidentes: [3] });
  await flexdb.insertOne("Pais", { nombre: "Portugal", presidentes: [4] });
  const usuario1 = await flexdb.insertOne("Usuario", { persona: 1, alias: "usuario1", email: "usuario1@gmail.org", password: "123456.1" });
  const usuario2 = await flexdb.insertOne("Usuario", { persona: 2, alias: "usuario2", email: "usuario2@gmail.org", password: "123456.2" });
  const usuario3 = await flexdb.insertOne("Usuario", { persona: 3, alias: "usuario3", email: "usuario3@gmail.org", password: "123456.3" });
  const permisoAdministrar = await flexdb.insertOne("Permiso", { nombre: "administrar", operacion: "app.administrate" });
  const permisoMoverCosas = await flexdb.insertOne("Permiso", { nombre: "mover cosas", operacion: "app.move things" });
  const permisoSelectOne = await flexdb.insertOne("Permiso", { operacion: "server.selectOne" });
  const permisoSelectMany = await flexdb.insertOne("Permiso", { operacion: "server.selectMany" });
  const permisoInsertOne = await flexdb.insertOne("Permiso", { operacion: "server.insertOne" });
  const permisoInsertMany = await flexdb.insertOne("Permiso", { operacion: "server.insertMany" });
  const permisoUpdateOne = await flexdb.insertOne("Permiso", { operacion: "server.updateOne" });
  const permisoUpdateMany = await flexdb.insertOne("Permiso", { operacion: "server.updateMany" });
  const permisoDeleteOne = await flexdb.insertOne("Permiso", { operacion: "server.deleteOne" });
  const permisoDeleteMany = await flexdb.insertOne("Permiso", { operacion: "server.deleteMany" });
  const permisoAddTable = await flexdb.insertOne("Permiso", { operacion: "server.addTable" });
  const permisoAddColumn = await flexdb.insertOne("Permiso", { operacion: "server.addColumn" });
  const permisoRenameTable = await flexdb.insertOne("Permiso", { operacion: "server.renameTable" });
  const permisoRenameColumn = await flexdb.insertOne("Permiso", { operacion: "server.renameColumn" });
  const permisoDropTable = await flexdb.insertOne("Permiso", { operacion: "server.dropTable" });
  const permisoDropColumn = await flexdb.insertOne("Permiso", { operacion: "server.dropColumn" });
  const permisoSetSchema = await flexdb.insertOne("Permiso", { operacion: "server.setSchema" });
  const permisoGetSchema = await flexdb.insertOne("Permiso", { operacion: "server.getSchema" });
  await flexdb.insertOne("Grupo", {
    nombre: "administración",
    usuarios: [usuario1],
    permisos: [
      permisoAdministrar,
      permisoSelectOne,
      permisoSelectMany,
      permisoInsertOne,
      permisoInsertMany,
      permisoUpdateOne,
      permisoUpdateMany,
      permisoDeleteOne,
      permisoDeleteMany,
      permisoAddTable,
      permisoAddColumn,
      permisoRenameTable,
      permisoRenameColumn,
      permisoDropTable,
      permisoDropColumn,
      permisoSetSchema,
      permisoGetSchema
    ],
    legislaciones: [legislacion1, legislacion2]
  });
  await flexdb.insertOne("Grupo", {
    nombre: "logística",
    usuarios: [usuario2, usuario3],
    permisos: [permisoMoverCosas],
    legislaciones: [legislacion1, legislacion2, legislacion3]
  });
  const persona1 = await flexdb.selectByUid(1)
  const persona2 = await flexdb.selectByUid(2)
  const persona3 = await flexdb.selectByUid(3)
  const objeto4 = await flexdb.selectByUid(flexdb.$ids.uid);
  FlexibleDB.assertion(typeof persona1.uid === "number", `Parameter «persona1.uid» must be an integer here`);
  FlexibleDB.assertion(typeof persona2.uid === "number", `Parameter «persona2.uid» must be an integer here`);
  FlexibleDB.assertion(typeof persona3.uid === "number", `Parameter «persona3.uid» must be an integer here`);
  FlexibleDB.assertion(typeof objeto4.uid === "number", `Parameter «objeto4.uid» must be an integer here`);
  const personasPorLabel1 = await flexdb.selectByLabel("Persona", "Carlos");
  const personasPorLabel2 = await flexdb.selectByLabels("Persona", ["Carlos", "user2"]);
  const personasPorLabel3 = await flexdb.selectByLabels("Persona", ["uat", "cal"]);
  FlexibleDB.assertion(personasPorLabel1.length === 1, `Parameter «personasPorLabel1.length» must be 1 here`);
  FlexibleDB.assertion(personasPorLabel2.length === 2, `Parameter «personasPorLabel2.length» must be 2 here`);
  FlexibleDB.assertion(personasPorLabel3.length === 2, `Parameter «personasPorLabel3.length» must be 2 here`);
  const d1 = await flexdb.createDataset(await flexdb.selectMany("Grupo"), "Grupo");
  FlexibleDB.assertion(d1.getDataset()[0].nombre === "administración", "Parameter «d1.getDataset()[0].nombre» must be «administración»");
  const d2 = d1.clone().findBySelector(["*","*","legislaciones"]);
  FlexibleDB.assertion(d2.getDataset().length === 2, "Parameter «d2.getDataset().length» must be «2»");
  FlexibleDB.assertion(d2.getDataset()[0].length === 2, "Parameter «d2.getDataset()[0].length» must be «2»");
  FlexibleDB.assertion(d2.getDataset()[1].length === 3, "Parameter «d2.getDataset()[1].length» must be «3»");
  const d3 = d1.clone().findBySelector(["*","*"]);
  FlexibleDB.assertion(d3.getDataset().permisos.length === 2, "Parameter «d3.getDataset().permisos.length» must be «2»");
  FlexibleDB.assertion(d3.getDataset().permisos[0].length >= 17, "Parameter «d3.getDataset().permisos[0].length» must be «17»");
  FlexibleDB.assertion(d3.getDataset().permisos[1].length === 1, "Parameter «d3.getDataset().permisos[1].length» must be «1»");
  console.log("Completado test-of-select-by-uid-and-others-language.js");

};

module.exports = main();
```