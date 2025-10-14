require(__dirname + "/flexible-db.js");

const main = async function () {

  const flexdb = FlexibleDB.create({
    onPersist: async function (db) {
      const stringifiedDb = await db.dehydrate();
      require("fs").writeFileSync(__dirname + "/test-data/test-of-modify-all.json", stringifiedDb, "utf8");
    }
  });

  await flexdb.setSchema({
    Usuario: {
      nombre: { type: "string" },
    }
  });

  await flexdb.insertOne("Usuario", { nombre: "Carlos" });

  await flexdb.modifyAll("Usuario", (it, id) => {
    it.nombre += " con id " + id;
    return it;
  });

  const dataset1 = await flexdb.selectMany("Usuario");

  FlexibleDB.assertion(dataset1.length === 1, "dataset1 debería tener 1 item");
  FlexibleDB.assertion(dataset1[0].nombre === "Carlos con id 1", "dataset1[0].nombre debería ser 'Carlos con id 1'");

  console.log("Completado test-of-modify-all.js");

};

module.exports = main();