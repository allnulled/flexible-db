require(__dirname + "/flexible-db.js");

const main = async function () {

  const flexdb = FlexibleDB.create({
    
  });

  await flexdb.setSchema({
    Pais: {
      nombre: { type: "string" },
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
  const legislacion1 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 1", contenido: "tal", creador: 1 });
  const legislacion2 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 2", contenido: "tal", creador: 1 });
  const legislacion3 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 3", contenido: "tal", creador: 1 });
  const legislacion4 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 4", contenido: "tal", creador: 1 });
  const legislacion5 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 5", contenido: "tal", creador: 1 });
  const legislacion6 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 6", contenido: "tal", creador: 1 });
  await flexdb.insertOne("Pais", { nombre: "España" });
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

  const dataset1 = await flexdb.selectMany("Grupo", () => true, {
    usuarios: {
      persona: {
        pais: true
      }
    },
    permisos: true,
  });

  FlexibleDB.assertion(dataset1[0].usuarios[0].persona.pais.nombre === "España", "El 'dataset1[0].usuarios[0].persona.pais.nombre' debería ser 'España'");

  const dataset2 = await flexdb.selectMany("Legislacion");

  await flexdb.expandRecords("Legislacion", dataset2, { creador: true });
  await flexdb.attachRecords("Legislacion", "grupos", "Grupo", "legislaciones", dataset2);
  
  // console.log(JSON.stringify(dataset2, null, 2));

  FlexibleDB.assertion(typeof dataset2[0].titulo === "string", "El 'dataset2[0].titulo' debería ser tipo 'string'");
  FlexibleDB.assertion(typeof dataset2[0].contenido === "string", "El 'dataset2[0].contenido' debería ser tipo 'string'");
  FlexibleDB.assertion(typeof dataset2[0].grupos === "object", "El 'dataset2[0].grupos' debería ser tipo 'object'");
  FlexibleDB.assertion(dataset2[0].creador.id === 1, "El 'dataset2[0].creador' debería ser 1");
  FlexibleDB.assertion(dataset2[0].grupos.length === 2, "El 'dataset2[0].grupos.length' debería ser 2");
  FlexibleDB.assertion(dataset2[1].grupos.length === 2, "El 'dataset2[1].grupos.length' debería ser 2");
  FlexibleDB.assertion(dataset2[2].grupos.length === 1, "El 'dataset2[2].grupos.length' debería ser 0");

  console.log("Completado test-of-complex-query.js");

};

module.exports = main();