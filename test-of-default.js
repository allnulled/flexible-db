require(__dirname + "/flexible-db.js");

const main = async function () {

  const flexdb = FlexibleDB.create({});

  await flexdb.setSchema({
    Factura: {
      titulo: { type: "string", default: "Sin título" },
      fecha: { type: "string", default: function() {return (new Date()).toISOString(); } },
      fecha_final: { type: "string", defaultType: "js", default: "return (new Date()).toISOString();" },
    }
  });

  await flexdb.insertOne("Factura", {});

  const dataset1 = await flexdb.selectMany("Factura");

  FlexibleDB.assertion(dataset1.length === 1, "databaset1.length debería ser 1");
  FlexibleDB.assertion(typeof dataset1[0].fecha === "string", "databaset1[0].fecha debería ser tipo 'string'");
  const rehydratedDate = new Date(dataset1[0].fecha);
  const rehydratedDateFinal = new Date(dataset1[0].fecha_final);
  const anotherDate = new Date();
  FlexibleDB.assertion(rehydratedDate.getDate() === anotherDate.getDate(), "rehydrated date final must be the same as current date");
  FlexibleDB.assertion(rehydratedDateFinal.getDate() === anotherDate.getDate(), "rehydrated date final must be the same as current date");

  console.log("Completado test-of-default.js");

};

module.exports = main();