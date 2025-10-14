require(__dirname + "/flexible-db.js");

const main = async function () {

  const flexdb = FlexibleDB.create({
    onPersist: async function (db) {
      const stringifiedDb = await db.dehydrate();
      require("fs").writeFileSync(__dirname + "/test-data/test-of-renaming.json", stringifiedDb, "utf8");
    }
  });

  await flexdb.setSchema({
    Usuario: {
      nombre: { type: "string" },
    }
  });

  await flexdb.insertOne("Usuario", { nombre: "Carlos" });

  await flexdb.renameTable("Usuario", "User");

  const dataset1 = await flexdb.selectMany("User");

  FlexibleDB.assertion(dataset1.length === 1, "dataset1 debería tener 1 item");

  await flexdb.renameColumn("User", "nombre", "name");

  const dataset2 = await flexdb.selectMany("User");
  
  FlexibleDB.assertion(dataset2.length === 1, "dataset2 debería tener 1 item");
  FlexibleDB.assertion(dataset2[0].name === "Carlos", "dataset2[0].name debería ser 'Carlos'");

  console.log("Completado test-of-renaming.js");

};

module.exports = main();