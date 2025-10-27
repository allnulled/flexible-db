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
  await flexdb.insertOne("Persona", { nombre: "user2", edad: 30, pais: 1, tags: ["cal"] });
  await flexdb.insertOne("Persona", { nombre: "user3", edad: 40, pais: 1, tags: ["nic"] });
  await flexdb.insertOne("Persona", { nombre: "user4", edad: 50, pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user5", edad: 60, pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user6", edad: 70, pais: 1 });
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

  const dataset1 = await flexdb.selectMany("Grupo");

  const proxy2 = flexdb.createDataset(dataset1).groupByColumn("legislaciones"); 

  const dataset2 = proxy2.getDataset();
  FlexibleDB.assertion(typeof dataset2 === "object", "dataset2 must be an object here");
  FlexibleDB.assertion(typeof dataset2[1] === "object", "dataset2[1] must be an object here");
  FlexibleDB.assertion(typeof dataset2[2] === "object", "dataset2[2] must be an object here");
  FlexibleDB.assertion(typeof dataset2[3] === "object", "dataset2[3] must be an object here");

  const proxy3 = flexdb.createDataset(dataset1).groupByColumns(["legislaciones", "permisos", "nombre"]);

  const dataset3 = proxy3.getDataset();
  FlexibleDB.assertion(typeof dataset3 === "object", "dataset3 must be an object here");
  FlexibleDB.assertion(typeof dataset3[1] === "object", "dataset3[1] must be an object here");
  FlexibleDB.assertion(typeof dataset3[1][1] === "object", "dataset3[1][1] must be an object here");
  FlexibleDB.assertion(typeof dataset3[1][18] === "object", "dataset3[1][18] must be an object here");
  FlexibleDB.assertion(typeof dataset3[2] === "object", "dataset3[2] must be an object here");
  FlexibleDB.assertion(typeof dataset3[3] === "object", "dataset3[3] must be an object here");

  const proxy4 = await flexdb.createDataset([
    { name: "Ana", age: 10, active: true },
    { name: "Luis", age: 10, active: false },
    { name: "Eva", age: 20, active: true },
  ]).groupByCallbacks([
    it => it.active ? "activos" : "inactivos",
    it => it.age < 18 ? "menores" : "adultos",
  ]);

  const dataset4 = proxy4.getDataset();
  FlexibleDB.assertion(typeof dataset4 === "object", "dataset4 must be an object here");
  FlexibleDB.assertion(typeof dataset4.activos === "object", "dataset4.activos must be an object here");
  FlexibleDB.assertion(typeof dataset4.activos.menores === "object", "dataset4.activos.menores must be an object here");
  FlexibleDB.assertion(typeof dataset4.activos.adultos === "object", "dataset4.activos.adultos must be an object here");
  FlexibleDB.assertion(typeof dataset4.inactivos === "object", "dataset4.inactivos must be an object here");
  FlexibleDB.assertion(typeof dataset4.inactivos.menores === "object", "dataset4.inactivos.menores must be an object here");

  const proxy5 = await flexdb.createDataset([
    { name: "Ana", age: 10, active: true },
    { name: "Luis", age: 10, active: false },
    { name: "Eva", age: 20, active: true },
  ]).groupByCallbacks([
    it => it.active ? "activos" : "inactivos",
    it => it.age < 18 ? "menores" : (it.age >= 18) && (it.age < 35) ? ["adultos", "jovenes"] : it.age < 65 ? ["adultos"] : "veteranos",
  ]);

  const dataset5 = proxy5.getDataset();
  FlexibleDB.assertion(typeof dataset5 === "object", "Parameter «dataset5» must be an object here");
  FlexibleDB.assertion(typeof dataset5.activos === "object", "Parameter «dataset5.activos» must be an object here");
  FlexibleDB.assertion(typeof dataset5.activos.menores === "object", "Parameter «dataset5.activos.menores» must be an object here");
  FlexibleDB.assertion(Array.isArray(dataset5.activos.menores), "Parameter «dataset5.activos.menores» must be an array here");
  FlexibleDB.assertion(dataset5.activos.menores.length === 1, "Parameter «dataset5.activos.menores.length» must be 1 here");
  FlexibleDB.assertion(dataset5.activos.menores[0].name === "Ana", "Parameter «dataset5.activos.menores[0].name» must be 'Ana' here");
  FlexibleDB.assertion(dataset5.activos.adultos[0].name === "Eva", "Parameter «dataset5.activos.adultos[0].name» must be 'Eva' here");
  FlexibleDB.assertion(dataset5.activos.jovenes[0].name === "Eva", "Parameter «dataset5.activos.jovenes[0].name» must be 'Eva' here");
  FlexibleDB.assertion(typeof dataset5.activos.adultos === "object", "Parameter «dataset5.activos.adultos» must be an object here");
  FlexibleDB.assertion(typeof dataset5.inactivos === "object", "Parameter «dataset5.inactivos» must be an object here");
  FlexibleDB.assertion(typeof dataset5.inactivos.menores === "object", "Parameter «dataset5.inactivos.menores» must be an object here");

  const proxy6 = await flexdb.createDataset([
    { name: "Ana", age: 10, active: true },
    { name: "Luis", age: 10, active: false },
    { name: "Eva", age: 20, active: true },
  ]).groupByEvals([
    `return it.active ? "activos" : "inactivos";`,
    `return it.age < 18 ? "menores" : (it.age >= 18) && (it.age < 35) ? ["adultos", "jovenes"] : it.age < 65 ? ["adultos"] : "veteranos";`,
  ]);
  
  const dataset6 = proxy6.getDataset();
  FlexibleDB.assertion(typeof dataset6 === "object", "Parameter «dataset6» must be an object here");
  FlexibleDB.assertion(typeof dataset6.activos === "object", "Parameter «dataset6.activos» must be an object here");
  FlexibleDB.assertion(typeof dataset6.activos.menores === "object", "Parameter «dataset6.activos.menores» must be an object here");
  FlexibleDB.assertion(Array.isArray(dataset6.activos.menores), "Parameter «dataset6.activos.menores» must be an array here");
  FlexibleDB.assertion(dataset6.activos.menores.length === 1, "Parameter «dataset6.activos.menores.length» must be 1 here");
  FlexibleDB.assertion(dataset6.activos.menores[0].name === "Ana", "Parameter «dataset6.activos.menores[0].name» must be 'Ana' here");
  FlexibleDB.assertion(dataset6.activos.adultos[0].name === "Eva", "Parameter «dataset6.activos.adultos[0].name» must be 'Eva' here");
  FlexibleDB.assertion(dataset6.activos.jovenes[0].name === "Eva", "Parameter «dataset6.activos.jovenes[0].name» must be 'Eva' here");
  FlexibleDB.assertion(typeof dataset6.activos.adultos === "object", "Parameter «dataset6.activos.adultos» must be an object here");
  FlexibleDB.assertion(typeof dataset6.inactivos === "object", "Parameter «dataset6.inactivos» must be an object here");
  FlexibleDB.assertion(typeof dataset6.inactivos.menores === "object", "Parameter «dataset6.inactivos.menores» must be an object here");

  const proxy7 = await flexdb.createDataset([
    { name: "Ana", age: 10, active: true },
    { name: "Luis", age: 10, active: false },
    { name: "Eva", age: 20, active: true },
  ]).groupByCallbacks([
    it => it.active ? "activos" : "inactivos",
    it => it.age < 18 ? "menores" : (it.age >= 18) && (it.age < 35) ? ["adultos", "jovenes"] : it.age < 65 ? ["adultos"] : "veteranos",
  ]);

  const proxy8 = flexdb.createDataset([
    { name: "Ana", age: 10, active: true },
    { name: "Luis", age: 10, active: false },
    { name: "Eva", age: 20, active: true },
  ]).sortByColumn("name");

  const dataset8 = proxy8.getDataset();

  FlexibleDB.assertion(dataset8.length === 3, "Parameter «dataset8.length» must be 3 here");
  FlexibleDB.assertion(dataset8[0].name === "Ana", "Parameter «dataset8[0].name» must be 'Ana' here");
  FlexibleDB.assertion(dataset8[1].name === "Eva", "Parameter «dataset8[1].name» must be 'Eva' here");
  FlexibleDB.assertion(dataset8[2].name === "Luis", "Parameter «dataset8[2].name» must be 'Luis' here");

  const proxy9 = flexdb.createDataset([
    { name: "Ana", surname: "Bac", active: true },
    { name: "Luis", surname: "Cac", active: false },
    { name: "Eva", surname: "Dac", active: true },
  ]).sortByColumns(["surname", "name"]);

  const dataset9 = proxy9.getDataset();

  FlexibleDB.assertion(dataset9.length === 3, "Parameter «dataset9.length» must be 3 here");
  FlexibleDB.assertion(dataset9[0].name === "Ana", "Parameter «dataset9[0].name» must be 'Ana' here");
  FlexibleDB.assertion(dataset9[1].name === "Luis", "Parameter «dataset9[1].name» must be 'Luis' here");
  FlexibleDB.assertion(dataset9[2].name === "Eva", "Parameter «dataset9[2].name» must be 'Eva' here");

  proxy9.extendBy({ info: "whatever" });

  FlexibleDB.assertion(proxy9.info === "whatever", "Parameter «proxy9.info» must be 'whatever' here");

  const proxy10 = flexdb.createDataset([
    { name: "Ana", surname: "Bac", active: true },
    { name: "Luis", surname: "Cac", active: false },
    { name: "Eva", surname: "Dac", active: true },
  ]).sortByCallback((a, b) => {
    return a.surname > b.surname ? 1 : -1;
  });
  
  const dataset10 = proxy10.getDataset();

  FlexibleDB.assertion(dataset10.length === 3, "Parameter «dataset10.length» must be 3 here");
  FlexibleDB.assertion(dataset10[0].name === "Ana", "Parameter «dataset10[0].name» must be 'Ana' here");
  FlexibleDB.assertion(dataset10[1].name === "Luis", "Parameter «dataset10[1].name» must be 'Luis' here");
  FlexibleDB.assertion(dataset10[2].name === "Eva", "Parameter «dataset10[2].name» must be 'Eva' here");

  const proxy11 = flexdb.createDataset([
    { name: "Ana", surname: "Bac", active: true },
    { name: "Luis", surname: "Cac", active: false },
    { name: "Eva", surname: "Dac", active: true },
  ]).sortByEval("return a.surname > b.surname ? 1 : -1;");
  
  const dataset11 = proxy11.getDataset();

  FlexibleDB.assertion(dataset11.length === 3, "Parameter «dataset11.length» must be 3 here");
  FlexibleDB.assertion(dataset11[0].name === "Ana", "Parameter «dataset11[0].name» must be 'Ana' here");
  FlexibleDB.assertion(dataset11[1].name === "Luis", "Parameter «dataset11[1].name» must be 'Luis' here");
  FlexibleDB.assertion(dataset11[2].name === "Eva", "Parameter «dataset11[2].name» must be 'Eva' here");

  const proxy12 = flexdb.createDataset([
    { name: "Ana", surname: "Cac", active: true },
    { name: "Luis", surname: "Bac", active: false },
    { name: "Eva", surname: "Dac", active: true },
  ]).sortByEval("return a.surname > b.surname ? 1 : -1;");
  
  const dataset12 = proxy12.getDataset();

  FlexibleDB.assertion(dataset12.length === 3, "Parameter «dataset12.length» must be 3 here");
  FlexibleDB.assertion(dataset12[0].name === "Luis", "Parameter «dataset12[0].name» must be 'Luis' here");
  FlexibleDB.assertion(dataset12[1].name === "Ana", "Parameter «dataset12[1].name» must be 'Ana' here");
  FlexibleDB.assertion(dataset12[2].name === "Eva", "Parameter «dataset12[2].name» must be 'Eva' here");

  console.log("Completado test-of-group-by-sort-by.js");

};

module.exports = main();