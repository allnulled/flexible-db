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
      nombre: { type: "string" },
      edad: { type: "integer" },
      pais: { type: "object-reference", referredTable: "Pais" }
    },
    Usuario: {
      persona: { type: "object-reference", referredTable: "Persona"  },
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
      descripcion: { type: "string" },
    },
    Legislacion: {
      titulo: { type: "string" },
      contenido: { type: "string" },
      creador: { type: "object-reference", referredTable: "Persona" }
    },
  });

  await flexdb.insertOne("Persona", { nombre: "Carlos", pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user2", pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user3", pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user4", pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user5", pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user6", pais: 1 });
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
  await flexdb.insertOne("Usuario", { persona: 1, alias: "usuario1", email: "usuario1@gmail.org", password: "123456" });
  await flexdb.insertOne("Usuario", { persona: 2, alias: "usuario2", email: "usuario2@gmail.org", password: "123456" });
  await flexdb.insertOne("Usuario", { persona: 3, alias: "usuario3", email: "usuario3@gmail.org", password: "123456" });
  await flexdb.insertOne("Permiso", { nombre: "administrar" });
  await flexdb.insertOne("Permiso", { nombre: "movimiento de mercancías" });
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
    usuarios: [1],
    permisos: [
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
    usuarios: [2,3],
    permisos: [2],
    legislaciones: [legislacion1, legislacion2, legislacion3]
  });

  const dataset1 = await flexdb.selectMany("Legislacion", row => true);
  
  await flexdb.expandRecords("Legislacion", dataset1, {
    creador: {
      pais: {
        presidentes: true
      }
    },
  });

  await flexdb.attachRecords("Legislacion", "gruposAdoptivos", "Grupo", "legislaciones", dataset1);

  Test_of_dataset_proxy: {
    const server = flexdb.createServer(9090, {
      authentication: true
    });
    // console.log(1);
    await server.start();
    // console.log(2);
    const response1 = await fetch("http://127.0.0.1:9090", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        opcode: "selectMany",
        parameters: ["Grupo"],
      })
    });
    // console.log(3);
    const data1 = await response1.json();
    // console.log(4);
    FlexibleDB.assertion(Array.isArray(data1.result), `Parameter «data1.result» must be an array here`);
    FlexibleDB.assertion(data1.result.length === 2, `Parameter «data1.result.length» must be 2 here`);
    FlexibleDB.assertion(data1.result[0].id === 1, `Parameter «data1.result[0].id» must be 1 here`);
    FlexibleDB.assertion(data1.result[0].nombre === "administración", `Parameter «data1.result[0].nombre» must be 'administración' here`);
    FlexibleDB.assertion(data1.result[1].id === 2, `Parameter «data1.result[1].id» must be 2 here`);
    FlexibleDB.assertion(data1.result[1].nombre === "logística", `Parameter «data1.result[1].nombre» must be 'logística' here`);

    const response2 = await fetch("http://127.0.0.1:9090", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        opcode: "selectMany",
        parameters: [
          "Grupo",
          [["id", "=", 1]]
      ],
      })
    });

    const data2 = await response2.json();

    FlexibleDB.assertion(data2.result.length === 1, `Parameter «data2.result.length» must be 1`);
    FlexibleDB.assertion(data2.result[0].id === 1, `Parameter «data2.result[0].id» must be 1`);

    const responseLogin1 = await fetch("http://127.0.0.1:9090", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        opcode: "login",
        parameters: [
          "usuario1",
          null,
          "123456",
        ],
      })
    });

    const login1 = await responseLogin1.json();

    const sessionToken1 = login1.result;

    const response3 = await fetch("http://127.0.0.1:9090", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        opcode: "updateOne",
        authentication: sessionToken1,
        parameters: [
          "Grupo",
          1,
          { nombre: "Otro nombre inventado" }
        ],
      })
    });

    const data3 = await response3.json();

    FlexibleDB.assertion(data3.opcode === "updateOne", `Parameter «data3.opcode» must be 'updateOne'`);

    const responseLogin2 = await fetch("http://127.0.0.1:9090", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        opcode: "login",
        parameters: [
          "usuario2",
          null,
          "123456",
        ],
      })
    });

    const login2 = await responseLogin2.json();

    const sessionToken2 = login2.result;

    const update1 = await fetch("http://127.0.0.1:9090", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        opcode: "updateOne",
        authentication: sessionToken2,
        parameters: [
          "Grupo",
          1,
          { nombre: "Otro nombre inventado" }
        ],
      })
    });

    const data4 = await update1.json();

    FlexibleDB.assertion(data4.error.name === "AssertionError", "Parameter «data4.error.name» must be 'AssertionError'");
    FlexibleDB.assertion(data4.error.message === "No permission found for «server.updateOne» on «onAuthenticate»", "Parameter «data4.error.message» must be '...'");

    server.stop();
    // console.log(5);
  }

  console.log("Completado test-of-server.js");

};

module.exports = main();