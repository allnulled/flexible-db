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