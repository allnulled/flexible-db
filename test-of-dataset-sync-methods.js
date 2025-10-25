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
  const grupos = await flexdb.selectMany("Grupo", []);
  const proxy1 = flexdb.createDataset(grupos, "Grupo");
  const proxy2 = proxy1.clone().mapSync(row => row.permisos);
  const proxy3 = proxy1.clone().findBySelector(["permisos"]).filterSync(permiso => permiso < 10);
  const proxy4 = proxy3.clone().reduceSync((out,row) => {
    if(row > 5) {
      out.push(row);
    }
    return out;
  }, []);
  const output1 = proxy4.getDataset();
  FlexibleDB.assertion(proxy2.getDataset().length === 2, "Parameter «proxy2.getDataset().length» must be 2 here");
  FlexibleDB.assertion(output1[0] === 6, "Parameter «output1[0]» must be 6 here");
  FlexibleDB.assertion(output1[1] === 7, "Parameter «output1[0]» must be 7 here");
  FlexibleDB.assertion(output1[2] === 8, "Parameter «output1[0]» must be 8 here");
  FlexibleDB.assertion(output1[3] === 9, "Parameter «output1[0]» must be 9 here");
  FlexibleDB.assertion(output1.length === 4, "Parameter «output1.length» must be 4 here");

  console.log("Completado test-of-dataset-sync-methods.js");

};

module.exports = main();