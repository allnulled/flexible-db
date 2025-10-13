require(__dirname + "/flexible-db.js");

const flexdb = FlexibleDB.create();

const main = async function () {

  await flexdb.setSchema({
    Cliente: {
      nombre: FlexibleDB.type("string"),
      dni: FlexibleDB.type("string"),
    }
  });

  await flexdb.insertOne("Cliente", {
    nombre: "Carlos",
    dni: "taltaltal",
  });

  await flexdb.insertMany("Cliente", [{
    nombre: "Coolio",
    dni: "tal tal noseqe"
  }, {
    nombre: "Jr. Gong",
    dni: "ok ok ok noseke",
  }, {
    nombre: "Snoop Dog",
    dni: "noseke nose ke",
  }]);

  const dbstate1 = await flexdb.dehydrate();

  const dataset0 = await flexdb.selectMany("Cliente");

  FlexibleDB.assertion(Array.isArray(dataset0), "Constant dataset0 must be an array");
  FlexibleDB.assertion(dataset0.length === 4, "Variable dataset0.length must be 4");

  const dataset1 = await flexdb.selectMany("Cliente", row => row.nombre === "Coolio");

  FlexibleDB.assertion(Array.isArray(dataset1), "Constant dataset1 must be an array");
  FlexibleDB.assertion(dataset1.length === 1, "Variable dataset1.length must be 1");
  FlexibleDB.assertion(dataset1[0].id === 2, "Variable dataset1.id must be 2");
  FlexibleDB.assertion(dataset1[0].nombre === "Coolio", "Variable dataset1.length must be «Coolio»");
  FlexibleDB.assertion(dataset1[0].dni === "tal tal noseqe", "Variable dataset1.length must be «tal tal noseqe»");

  await flexdb.updateOne("Cliente", 2, { nombre: "Coolio modificado" });

  const dataset2 = await flexdb.selectMany("Cliente", row => row.nombre === "Coolio modificado");

  FlexibleDB.assertion(Array.isArray(dataset2), "Constant dataset2 must be an array");
  FlexibleDB.assertion(dataset2.length === 1, "Variable dataset2.length must be 1");
  FlexibleDB.assertion(dataset2[0].id === 2, "Variable dataset2.id must be 2");
  FlexibleDB.assertion(dataset2[0].nombre === "Coolio modificado", "Variable dataset2.length must be «Coolio modificado»");
  FlexibleDB.assertion(dataset2[0].dni === "tal tal noseqe", "Variable dataset2.length must be «tal tal noseqe»");

  await flexdb.updateMany("Cliente", row => row.id === 3, { nombre: "Damian Marley" });

  const dataset3 = await flexdb.selectMany("Cliente", row => row.nombre === "Damian Marley");

  FlexibleDB.assertion(Array.isArray(dataset3), "Constant dataset3 must be an array");
  FlexibleDB.assertion(dataset3.length === 1, "Variable dataset3.length must be 1");
  FlexibleDB.assertion(dataset3[0].id === 3, "Variable dataset3.id must be 3");
  FlexibleDB.assertion(dataset3[0].nombre === "Damian Marley", "Variable dataset3.length must be «Damian Marley»");
  FlexibleDB.assertion(dataset3[0].dni === "ok ok ok noseke", "Variable dataset3.length must be «ok ok ok noseke»");

  await flexdb.deleteOne("Cliente", 1);

  const dataset4 = await flexdb.selectMany("Cliente", row => row.nombre);

  FlexibleDB.assertion(Array.isArray(dataset4), "Constant dataset4 must be an array");
  FlexibleDB.assertion(dataset4.length === 3, "Variable dataset4.length must be 3");

  await flexdb.deleteMany("Cliente", row => true);

  const dataset5 = await flexdb.selectMany("Cliente", row => row.nombre);

  FlexibleDB.assertion(Array.isArray(dataset5), "Constant dataset5 must be an array");
  FlexibleDB.assertion(dataset5.length === 0, "Variable dataset5.length must be 0");

  await flexdb.hydrate(dbstate1);

  const dataset6 = await flexdb.selectMany("Cliente", row => row.nombre);

  FlexibleDB.assertion(Array.isArray(dataset6), "Constant dataset6 must be an array");
  FlexibleDB.assertion(dataset6.length === 4, "Variable dataset6.length must be 4");

  await flexdb.reset();

  await flexdb.setSchema({
    Empleado: {
      nombre: { type: "string" },
      empresa: { type: "object-reference", referredTable: "Empresa" },
    },
    Empresa: {
      nombre: { type: "string" },
    },
    Venta: {
      nombre: { type: "string" },
      empleados_implicados: { type: "array-reference", referredTable: "Empleado" }
    }
  });

  const empresa1 = await flexdb.insertOne("Empresa", { nombre: "Google" });
  const empresa2 = await flexdb.insertOne("Empresa", { nombre: "Alphabet" });
  const empleado1 = await flexdb.insertOne("Empleado", { nombre: "Carlos", empresa: empresa1 });
  const empleado2 = await flexdb.insertOne("Empleado", { nombre: "David", empresa: empresa2 });

  try {
    await flexdb.deleteOne("Empresa", empresa1);
    throw new Error("Should have failed because integrity check (1)");
  } catch (error) { }
  await flexdb.deleteOne("Empleado", empleado1);
  await flexdb.deleteOne("Empresa", empresa1);

  const venta1 = await flexdb.insertOne("Venta", { nombre: "Alphabet", empleados_implicados: [empleado2] });

  try {
    await flexdb.deleteOne("Empleado", empleado2);
    throw new Error("Should have failed because integrity check (2)");
  } catch (error) { }
  await flexdb.deleteOne("Venta", venta1);
  await flexdb.deleteOne("Empleado", empleado2);

  console.log("Completado test.js");

};

module.exports = main();