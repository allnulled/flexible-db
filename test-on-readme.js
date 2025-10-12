require(__dirname + "/flexible-db.js");

const flexdb = FlexibleDB.create();

flexdb.setSchema({
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

const persona1 = flexdb.insertOne("Persona", {
  nombre: "Carlos",
  dni: "777K",
  nacimiento: "05/01/1991"
});

const empresa1 = flexdb.insertOne("Empresa", { nombre: "ASML" });
const empresa2 = flexdb.insertOne("Empresa", { nombre: "Al Jazeera" });
const empresa3 = flexdb.insertOne("Empresa", { nombre: "KGB" });

const cliente1 = flexdb.insertOne("Cliente", {
  persona: persona1,
  empresas: [empresa1, empresa2],
});

try {
  flexdb.deleteOne("Empresa", empresa1);
  throw new Error("Should throw integrity error (1)");
} catch (error) {}
try {
  flexdb.deleteOne("Empresa", empresa2);
  throw new Error("Should throw integrity error (2)");
} catch (error) {}
try {
  flexdb.deleteOne("Persona", persona1);
  throw new Error("Should throw integrity error (3)");
} catch (error) {}