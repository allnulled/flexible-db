require(__dirname + "/flexible-db.js");

const main = async function () {

  const flexdb = FlexibleDB.create({});

  await flexdb.setSchema({
    Usuario: {
      nombre: { type: "string", unique: true, nullable: false },
    },
    Grupo: {
      nombre: { type: "string", unique: true, nullable: false },
      usuarios: { type: "array-reference", referredTable: "Usuario" },
    }
  });

  const relations = await flexdb.getRelationsSchema();

  console.log(JSON.stringify(relations, null, 2));
  FlexibleDB.assertion(typeof relations, "relations debería ser tipo object");

  console.log("Completado test-of-relations.js");

};

module.exports = main();