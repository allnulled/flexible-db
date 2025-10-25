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
  const query = FlexibleDB.BasicQuery.from({
    database: flexdb,
    steps: ["onStart", "onValidate", "onFetch", "onRun", "onConfirm"],
    onStart: "this.processState = ['on start'];",
    onValidate: "this.processState.push('on validate');",
    onFetch: `this.$dataset = await this.database.selectMany("Usuario")`,
    onRun: "this.processState.push('on run');",
    onConfirm: `
      FlexibleDB.assertion(Array.isArray(this.processState), "El parámetro «this.processState» debería ser un array");
      FlexibleDB.assertion(this.processState[0] === 'on start', "El parámetro «this.processState[0]» debería ser 'on start'");
      FlexibleDB.assertion(this.processState[1] === 'on validate', "El parámetro «this.processState[1]» debería ser 'on validate'");
      FlexibleDB.assertion(this.processState[2] === 'on run', "El parámetro «this.processState[2]» debería ser 'on run'");
      FlexibleDB.assertion(this.$dataset.length === 3, "El parámetro «this.$dataset.length» debería ser 3");
    `,
    onError: `
      console.log("Broken in step: " + step);
      throw error;
    `
  });
  await query.run();
  FlexibleDB.assertion(Array.isArray(query.processState), "El parámetro «query.processState» debería ser un array");
  FlexibleDB.assertion(query.processState[0] === 'on start', "El parámetro «query.processState[0]» debería ser 'on start'");
  FlexibleDB.assertion(query.processState[1] === 'on validate', "El parámetro «query.processState[1]» debería ser 'on validate'");
  FlexibleDB.assertion(query.processState[2] === 'on run', "El parámetro «query.processState[2]» debería ser 'on run'");
  FlexibleDB.assertion(query.$dataset.length === 3, "El parámetro «query.$dataset.length» debería ser 3");
  console.log("Completado test-of-query-api.js");

};

module.exports = main();