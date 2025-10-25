require(__dirname + "/flexible-db.js");

const main = async function () {
  const flexdb = FlexibleDB.create({
    
  });

  await flexdb.setSchema({
    Ok: {},
    Categoria: {
      nombre: { type: "string" },
      anterior: { type: "object-reference", referredTable: "Categoria", tree: true, nullable: true },
    }
  });

  await flexdb.insertOne("Categoria", {nombre: "Letra A", anterior: null});
  await flexdb.insertOne("Categoria", {nombre: "Letra B", anterior: null});
  await flexdb.insertOne("Categoria", {nombre: "Letra C", anterior: null});

  const tree = flexdb.createTree("Categoria", "anterior");

  const roots = await tree.getBranchesOf(null);
  FlexibleDB.assertion(roots.length === 3, "Debe tener longitud 3");
  FlexibleDB.assertion(roots[0].nombre === "Letra A", "Debe ser Letra A");
  FlexibleDB.assertion(roots[1].nombre === "Letra B", "Debe ser Letra B");
  FlexibleDB.assertion(roots[2].nombre === "Letra C", "Debe ser Letra C");
  
  await tree.dropBranch(2);
  
  const roots2 = await tree.getBranchesOf(null);
  FlexibleDB.assertion(roots2.length === 2, "Debe tener longitud 2");
  FlexibleDB.assertion(roots2[0].nombre === "Letra A", "Debe ser Letra A");
  FlexibleDB.assertion(roots2[1].nombre === "Letra C", "Debe ser Letra C");
  
  await tree.addBranchOf({nombre: "Letra A.A"}, 1);
  await tree.addBranchOf({nombre: "Letra A.B"}, 1);
  await tree.addBranchOf({nombre: "Letra A.C"}, 1);
  await tree.addBranchOf({nombre: "Letra C.A"}, 3);
  await tree.addBranchOf({nombre: "Letra C.B"}, 3);
  await tree.addBranchOf({nombre: "Letra C.C"}, 3);
  
  const branches1 = await tree.getBranchesOf(1);
  FlexibleDB.assertion(branches1.length === 3, "Debe tener longitud 3");
  FlexibleDB.assertion(branches1[0].nombre === "Letra A.A", "Debe ser Letra A.A");
  FlexibleDB.assertion(branches1[1].nombre === "Letra A.B", "Debe ser Letra A.B");
  FlexibleDB.assertion(branches1[2].nombre === "Letra A.C", "Debe ser Letra A.C");

  let passed = false;
  try {
    await tree.dropBranch(1);
    passed = false;
  } catch (error) {
    passed = true;
  }
  FlexibleDB.assertion(passed === true, "Parametro «passed» debería ser true");

  console.log("Completado test-of-basic-tree-01.js");

};

module.exports = main();