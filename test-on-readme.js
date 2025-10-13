require(__dirname + "/flexible-db.js");

const flexdb = FlexibleDB.create();

const main = async function () {

  await flexdb.setSchema({
    Persona: {
      nombre: { type: "string" },
      dni: { type: "string" },
      nacimiento: { type: "string" },
    },
    Cliente: {
      persona: { type: "object-reference", referredTable: "Persona" },
      empresas: { type: "array-reference", referredTable: "Empresa" },
    },
    Empresa: {
      nombre: { type: "string" }
    }
  });

  const persona1 = await flexdb.insertOne("Persona", {
    nombre: "Carlos",
    dni: "777K",
    nacimiento: "05/01/1991"
  });

  const empresa1 = await flexdb.insertOne("Empresa", { nombre: "ASML" });
  const empresa2 = await flexdb.insertOne("Empresa", { nombre: "Al Jazeera" });
  const empresa3 = await flexdb.insertOne("Empresa", { nombre: "KGB" });

  const cliente1 = await flexdb.insertOne("Cliente", {
    persona: persona1,
    empresas: [empresa1, empresa2],
  });

  try {
    await flexdb.deleteOne("Empresa", empresa1);
    throw new Error("Should throw integrity error (1)");
  } catch (error) { }
  try {
    await flexdb.deleteOne("Empresa", empresa2);
    throw new Error("Should throw integrity error (2)");
  } catch (error) { }
  try {
    await flexdb.deleteOne("Persona", persona1);
    throw new Error("Should throw integrity error (3)");
  } catch (error) { }

  console.log("Completado test-on-readme.js");

};

module.exports = main();