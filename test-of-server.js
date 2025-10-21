require(__dirname + "/flexible-db.js");

const main = async function () {

  const flexdb = FlexibleDB.create({
    
  });

  await flexdb.setSchema({
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
  await flexdb.insertOne("Usuario", { persona: 1 });;
  await flexdb.insertOne("Usuario", { persona: 2 });;
  await flexdb.insertOne("Usuario", { persona: 3 });;
  await flexdb.insertOne("Permiso", { nombre: "administrar" });
  await flexdb.insertOne("Permiso", { nombre: "movimiento de mercancías" });
  await flexdb.insertOne("Grupo", {
    nombre: "administración",
    usuarios: [1],
    permisos: [1],
    legislaciones: [legislacion1, legislacion2]
  });
  await flexdb.insertOne("Grupo", {
    nombre: "logística",
    usuarios: [2,3],
    permisos: [2],
    legislaciones: [legislacion1, legislacion2, legislacion3]
  });

  const dataset1 = await flexdb.selectMany("Legislacion", row => true, {
    creador: {
      pais: {
        presidentes: true
      }
    },
  });

  await flexdb.attachRecords("Legislacion", "gruposAdoptivos", "Grupo", "legislaciones", dataset1);

  Test_of_dataset_proxy: {
    const server = flexdb.createServer(9090);
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

    server.stop();
    // console.log(5);
  }

  console.log("Completado test-of-server.js");

};

module.exports = main();