require(__dirname + "/flexible-db.js");

const main = async function () {

  const flexdb = FlexibleDB.create({
    onPersist: async function (db) {
      const stringifiedDb = await db.dehydrate();
      require("fs").writeFileSync(__dirname + "/test-data/test-of-persistence.json", stringifiedDb, "utf8");
    }
  });

  await flexdb.setSchema({
    Usuario: {
      nombre: { type: "string" },
    }
  });

  console.log("Completado test-of-persistence.js");

};

module.exports = main();