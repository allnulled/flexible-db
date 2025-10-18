require(__dirname + "/flexible-db.js");

const main = async function () {

  const flexdb = FlexibleDB.create({});

  await flexdb.setSchema({
    Factura: {
      titulo: { type: "string", default: "Sin título" },
      fecha: { type: "string", default: function() {return (new Date()).toISOString(); } },
    }
  });

  await flexdb.insertOne("Factura", {});

  const dataset1 = await flexdb.selectMany("Factura");

  FlexibleDB.assertion(dataset1.length === 1, "databaset1.length debería ser 1");
  FlexibleDB.assertion(typeof dataset1[0].fecha === "string", "databaset1[0].fecha debería ser tipo 'string'");
  const rehydratedDate = new Date(dataset1[0].fecha);
  const anotherDate = new Date();
  FlexibleDB.assertion(rehydratedDate.getDate() === anotherDate.getDate(), "rehydrated date must be the same as current date");

  console.log("Completado test-of-default.js");

};

module.exports = main();