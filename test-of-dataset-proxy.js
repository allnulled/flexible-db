require(__dirname + "/flexible-db.js");

const main = async function () {

  const flexdb = FlexibleDB.create({
    
  });

  await flexdb.setSchema({
    Pais: {
      nombre: { type: "string" },
      presidentes: { type: "array-reference", referredTable: "Persona" }
    },
    Persona: {
      nombre: { type: "string" },
      edad: { type: "integer" },
      pais: { type: "object-reference", referredTable: "Pais" }
    },
    Usuario: {
      persona: { type: "object-reference", referredTable: "Persona"  },
    },
    Grupo: {
      nombre: { type: "string", unique: true },
      usuarios: { type: "array-reference", referredTable: "Usuario" },
      permisos: { type: "array-reference", referredTable: "Permiso" },
      presidente: { type: "object-reference", referredTable: "Usuario", nullable: true },
      legislaciones: { type: "array-reference", referredTable: "Legislacion", nullable: true },
    },
    Permiso: {
      nombre: { type: "string", unique: true },
    },
    Legislacion: {
      titulo: { type: "string" },
      contenido: { type: "string" },
      creador: { type: "object-reference", referredTable: "Persona" }
    },
  });

  await flexdb.insertOne("Persona", { nombre: "Carlos", pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user2", pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user3", pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user4", pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user5", pais: 1 });
  await flexdb.insertOne("Persona", { nombre: "user6", pais: 1 });
  const legislacion1 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 1", contenido: "tal", creador: 1 });
  const legislacion2 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 2", contenido: "tal", creador: 2 });
  const legislacion3 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 3", contenido: "tal", creador: 1 });
  const legislacion4 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 4", contenido: "tal", creador: 2 });
  const legislacion5 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 5", contenido: "tal", creador: 1 });
  const legislacion6 = await flexdb.insertOne("Legislacion", { titulo: "Carta de derechos 6", contenido: "tal", creador: 4 });
  await flexdb.insertOne("Pais", { nombre: "España", presidentes: [1] });
  await flexdb.insertOne("Pais", { nombre: "Andorra", presidentes: [2] });
  await flexdb.insertOne("Pais", { nombre: "Francia", presidentes: [3] });
  await flexdb.insertOne("Pais", { nombre: "Portugal", presidentes: [4] });
  await flexdb.insertOne("Usuario", { persona: 1 });;
  await flexdb.insertOne("Usuario", { persona: 2 });;
  await flexdb.insertOne("Usuario", { persona: 3 });;
  await flexdb.insertOne("Permiso", { nombre: "administrar" });
  await flexdb.insertOne("Permiso", { nombre: "movimiento de mercancías" });
  await flexdb.insertOne("Grupo", {
    nombre: "administración",
    usuarios: [1],
    permisos: [1],
    legislaciones: [legislacion1, legislacion2]
  });
  await flexdb.insertOne("Grupo", {
    nombre: "logística",
    usuarios: [2,3],
    permisos: [2],
    legislaciones: [legislacion1, legislacion2, legislacion3]
  });

  const dataset1 = await flexdb.selectMany("Legislacion", row => true);
  
  await flexdb.expandRecords("Legislacion", dataset1, {
    creador: {
      pais: {
        presidentes: true
      }
    },
  });

  await flexdb.attachRecords("Legislacion", "gruposAdoptivos", "Grupo", "legislaciones", dataset1);

  Test_of_dataset_proxy: {
    const proxy1 = flexdb.proxifyDataset(dataset1, "Legislacion");
    const creadores = proxy1.clone().findBySelector(["*", "creador"]).deduplicate().getDataset();
    const creadoresPaises = proxy1.clone().findBySelector(["*", "creador", "*", "pais"]).deduplicate().getDataset();
    FlexibleDB.assertion(typeof creadores === "object", `Parameter «creadores» must be object here`);
    FlexibleDB.assertion(creadores.length === 3, `Parameter «creadores.length» must be 3 here`);
    FlexibleDB.assertion(creadores[0].id === 1, `Parameter «creadores[0].id» must be 1 here`);
    FlexibleDB.assertion(creadores[1].id === 2, `Parameter «creadores[1].id» must be 2 here`);
    FlexibleDB.assertion(creadores[2].id === 4, `Parameter «creadores[2].id» must be 3 here`);
    FlexibleDB.assertion(typeof creadoresPaises === "object", `Parameter «creadoresPaises» must be object here`);
    FlexibleDB.assertion(creadoresPaises.length === 1, `Parameter «creadoresPaises.length» must be 1 here`);
    FlexibleDB.assertion(creadoresPaises[0].id === 1, `Parameter «creadoresPaises[0].id» must be 1 here`);
    const proxy2 = proxy1.clone();
    await proxy2.findBySelector(["*", "creador"]).filter(row => {
      return row.nombre !== "Carlos";
    });
    await proxy2.deduplicate().map(line => line.nombre);
    const creadores2 = proxy2.getDataset();
    FlexibleDB.assertion(creadores2.length === 2, `Parameter «creadores2.length» must be 2 here`);
    FlexibleDB.assertion(creadores2[0] === "user2", `Parameter «creadores2[0]» must be 'user2' here`);
    FlexibleDB.assertion(creadores2[1] === "user4", `Parameter «creadores2[1]» must be 'user4' here`);
    const proxy3 = proxy1.clone();
    const presidentes1 = proxy3.copy().findBySelector(["*", "creador", "pais", "presidentes"]).deduplicate().getDataset();
    FlexibleDB.assertion(presidentes1.length === 1, `Parameter «presidentes1.length» must be 1 here`);
    const proxy4 = proxy1.clone();
    await proxy4.copy().findBySelector(["creador", "pais", "presidentes"]).reduce((out, row) => {
      out.push(row);
    }, [])
    await proxy4.reduce((out, row) => {
      out.push(row.nombre);
    }, []);
    const presidentes2 = proxy4.deduplicate().getDataset();
    FlexibleDB.assertion(presidentes2.length === 1, `Parameter «presidentes2.length» must be 1 here`);
    FlexibleDB.assertion(presidentes2[0] === "Carlos", `Parameter «presidentes2[0]» must be 'Carlos' here`);
    const proxy5 = proxy1.clone().findBySelector(["gruposAdoptivos"]).deduplicate();
    const gruposAdoptivos = proxy5.getDataset();
    FlexibleDB.assertion(gruposAdoptivos.length === 2, `Parameter «gruposAdoptivos.length» must be 2 here`);
    FlexibleDB.assertion(gruposAdoptivos[0].nombre === "administración", `Parameter «gruposAdoptivos[0]» must be 'administración' here`);
    FlexibleDB.assertion(gruposAdoptivos[1].nombre === "logística", `Parameter «gruposAdoptivos[0]» must be 'logística' here`);
    await proxy5.expandRecords("Grupo", {
      usuarios: true,
      permisos: true,
      legislaciones: true,
    });
    const gruposAdoptivosExpandidos = proxy5.getDataset();
    FlexibleDB.assertion(gruposAdoptivosExpandidos[0].usuarios.length === 1, `Parameter «gruposAdoptivosExpandidos[0].usuarios.length» must be 1 here`);
    FlexibleDB.assertion(gruposAdoptivosExpandidos[0].permisos.length === 1, `Parameter «gruposAdoptivosExpandidos[0].permisos.length» must be 1 here`);
    FlexibleDB.assertion(gruposAdoptivosExpandidos[0].legislaciones.length === 2, `Parameter «gruposAdoptivosExpandidos[0].legislaciones.length» must be 2 here`);
    FlexibleDB.assertion(typeof gruposAdoptivosExpandidos[0].usuarios[0] === "object", `Parameter «gruposAdoptivosExpandidos[0].usuarios.length» must be 1 here`);
    FlexibleDB.assertion(typeof gruposAdoptivosExpandidos[0].permisos[0] === "object", `Parameter «gruposAdoptivosExpandidos[0].permisos.length» must be 1 here`);
    FlexibleDB.assertion(typeof gruposAdoptivosExpandidos[0].legislaciones[0] === "object", `Parameter «gruposAdoptivosExpandidos[0].legislaciones.length» must be 1 here`);
  }

  console.log("Completado test-of-dataset-proxy.js");

};

module.exports = main();