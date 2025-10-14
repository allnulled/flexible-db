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

  let passes1 = false;
  try {
    await flexdb.deleteOne("Empresa", empresa1);
  } catch (error) {
    passes1 = true;
  }
  if(!passes1) {
    throw new Error("Should throw integrity error (1)");
  }
  let passes2 = false;
  try {
    await flexdb.deleteOne("Empresa", empresa2);
  } catch (error) {
    passes2 = true;
  }
  if(!passes2) {
    throw new Error("Should throw integrity error (2)");
  }
  let passes3 = false;
  try {
    await flexdb.deleteOne("Persona", persona1);
  } catch (error) {
    passes3 = true;
  }
  if(!passes3) {
    throw new Error("Should throw integrity error (3)");
  }
  console.log("Completado test-on-readme.js");

};

module.exports = main();