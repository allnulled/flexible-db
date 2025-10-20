require(__dirname + "/flexible-db.js");

const main = async function () {

  const flexdb = FlexibleDB.create({});

  await flexdb.setSchema({
    Objeto: {
      datos: { type: "string", nullable: true, default: null  },
    },
    Usuario: {
      nombre: { type: "string", unique: true, nullable: false },
      referencia: { type: "object-reference", referredTable: "Objeto" },
    },
    Grupo: {
      nombre: { type: "string", unique: true, nullable: false },
      usuarios: { type: "array-reference", referredTable: "Usuario" },
      referencia: { type: "object-reference", referredTable: "Objeto" },
    },
    Permiso: {
      nombre: { type: "string", unique: true },
      referencia: { type: "object-reference", referredTable: "Objeto" },
    },
    Sesion: {
      uid: { type: "string", unique: true },
    }
  });

  const relations = await flexdb.getRelationsSchema();

  // console.log(relations);

  FlexibleDB.assertion(typeof relations === "object", "relations debería ser tipo object");
  FlexibleDB.assertion(typeof relations.Objeto.active === "object", "relations.Objeto.active debería ser tipo object");
  FlexibleDB.assertion(Object.keys(relations.Objeto.active).length === 0, "Object.keys(relations.Objeto.active).length debería ser 0");
  FlexibleDB.assertion(typeof relations.Objeto.passive["Usuario.referencia"] === "object", "relations.Objeto.passive['Usuario.referencia'] debería ser tipo object");
  FlexibleDB.assertion(typeof relations.Objeto.passive["Grupo.referencia"] === "object", "relations.Objeto.passive['Grupo.referencia'] debería ser tipo object");
  FlexibleDB.assertion(typeof relations.Objeto.passive["Permiso.referencia"] === "object", "relations.Objeto.passive['Permiso.referencia'] debería ser tipo object");
  FlexibleDB.assertion(typeof relations.Usuario.active["Usuario.referencia"] === "object", "relations.Usuario.active['referencia'] debería ser tipo object");
  FlexibleDB.assertion(typeof relations.Usuario.passive["Grupo.usuarios"] === "object", "relations.Usuario.passive['Grupo.usuarios'] debería ser tipo object");
  FlexibleDB.assertion(relations.Usuario.passive["Grupo.usuarios"].referredTable === "Usuario", "relations.Usuario.passive['Grupo.usuarios'].referredTable debería ser 'Usuario'");
  FlexibleDB.assertion(relations.Usuario.passive["Grupo.usuarios"].quantity === "N", "relations.Usuario.passive['Grupo.usuarios'].quantity debería ser 'N'");

  console.log("Completado test-of-relations.js");

};

module.exports = main();