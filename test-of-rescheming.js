require(__dirname + "/flexible-db.js");

const main = async function () {

  const flexdb = FlexibleDB.create({
    onPersist: async function (db) {
      const stringifiedDb = await db.dehydrate();
      require("fs").writeFileSync(__dirname + "/test-data/test-of-rescheming.json", stringifiedDb, "utf8");
    }
  });

  await flexdb.setSchema({
    Usuario: {
      nombre: { type: "string" },
    }
  });

  const usuario1 = await flexdb.insertOne("Usuario", { nombre: "Carlos" });

  await flexdb.addTable("Grupo");
  await flexdb.addColumn("Grupo", "nombre", { type: "string" });
  await flexdb.addColumn("Grupo", "presidente", { type: "object-reference", referredTable: "Usuario" });

  await flexdb.insertOne("Grupo", {
    nombre: "vikingos",
    presidente: usuario1,
  });

  const dataset1 = await flexdb.selectMany("Grupo");

  FlexibleDB.assertion(dataset1.length === 1, "dataset1.length debería ser 1");
  FlexibleDB.assertion(dataset1[0].nombre === "vikingos", "dataset1[0].nombre debería ser 'vikingos'");
  FlexibleDB.assertion(dataset1[0].presidente === 1, "dataset1[0].presidente debería ser 1");

  let passes1 = false;
  try {
    await flexdb.dropTable("Usuario");
  } catch (error) {
    passes1 = true;
  }
  if(!passes1) {
    throw new Error("Should throw integrity error (1)");
  }

  await flexdb.dropTable("Grupo");
  await flexdb.dropTable("Usuario");

  console.log("Completado test-of-rescheming.js");

};

module.exports = main();