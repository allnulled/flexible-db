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
    },
    Permiso: {
      nombre: { type: "string", unique: true },
    }
  });

  await flexdb.insertOne("Pais", { nombre: "España" });
  await flexdb.insertOne("Persona", { nombre: "Carlos", pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user2", pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user3", pais: 1 });;
  await flexdb.insertOne("Usuario", { persona: 1 });;
  await flexdb.insertOne("Usuario", { persona: 2 });;
  await flexdb.insertOne("Usuario", { persona: 3 });;
  await flexdb.insertOne("Permiso", { nombre: "administrar" });
  await flexdb.insertOne("Permiso", { nombre: "movimiento de mercancías" });
  await flexdb.insertOne("Grupo", {
    nombre: "administración",
    usuarios: [1],
    permisos: [1]
  });
  await flexdb.insertOne("Grupo", {
    nombre: "logística",
    usuarios: [2,3],
    permisos: [2]
  });

  const dataset1 = await flexdb.selectMany("Grupo", () => true, {
    usuarios: {
      persona: {
        pais: true
      }
    },
    permisos: true,
  });
  
  // console.log(JSON.stringify(dataset1, null, 2));

  FlexibleDB.assertion(dataset1[0].usuarios[0].persona.pais.nombre === "España", "El 'dataset1[0].usuarios[0].persona.pais.nombre' debería ser 'España'");

  console.log("Completado test-of-complex-query.js");

};

module.exports = main();