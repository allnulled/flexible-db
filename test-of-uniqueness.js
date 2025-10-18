require(__dirname + "/flexible-db.js");

const main = async function () {

  const flexdb = FlexibleDB.create({});

  await flexdb.setSchema({
    Usuario: {
      nombre: { type: "string", unique: true, nullable: true },
      prop2: { type: "string", unique: false, nullable: false },
      prop3: { type: "string", default: "un texto" },
    }
  });

  await flexdb.insertOne("Usuario", { nombre: "Carlos" });
  let passes1 = false;
  try {
    await flexdb.insertOne("Usuario", { nombre: "Carlos" });
  } catch (error) {
    passes1 = true;
  }
  if(!passes1) {
    throw new Error("Should have arised uniqueness error (1)");
  }

  await flexdb.insertOne("Usuario", { nombre: null, prop2: "ok" });
  await flexdb.insertOne("Usuario", { nombre: null, prop2: "ok" });

  const dataset1 = await flexdb.selectMany("Usuario");

  FlexibleDB.assertion(dataset1.length === 3, "databaset1.length debería ser 3");
  FlexibleDB.assertion(dataset1[0].nombre === "Carlos", "databaset1[0].nombre debería ser 'Carlos'");
  FlexibleDB.assertion(dataset1[1].nombre === null, "databaset1[1].nombre debería ser null");
  FlexibleDB.assertion(dataset1[2].nombre === null, "databaset1[2].nombre debería ser null");
  FlexibleDB.assertion(dataset1[0].prop3 === "un texto", "databaset1[0].prop3 debería ser 'un texto'");
  FlexibleDB.assertion(dataset1[1].prop3 === "un texto", "databaset1[1].prop3 debería ser 'un texto'");
  FlexibleDB.assertion(dataset1[2].prop3 === "un texto", "databaset1[2].prop3 debería ser 'un texto'");

  let passes2 = false;
  try {
    await flexdb.insertOne("Usuario", { nombre: "Carlos", prop2: null });
  } catch (error) {
    passes2 = true;
  }
  if(!passes2) {
    throw new Error("Should have arised non-nullable error (2)");
  }
  
  const dataset2 = await flexdb.selectMany("Usuario");
  FlexibleDB.assertion(dataset2.length === 3, "databaset2.length debería ser 3 como antes");


  console.log("Completado test-of-uniqueness.js");

};

module.exports = main();