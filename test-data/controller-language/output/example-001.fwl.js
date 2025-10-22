await (async (condition) => {
    if (condition) return false;
    let authentication = await server.authenticateRequest(request);
    authentication: {
        if (!(authentication)) {
            throw new Error("The request requires authentication at this sensible point [784392165]");
        }
    }
    authorization: {
        let permissions = authentication.permisos.map(it => it.operacion);
        let hasOperationPermission = permissions.contains("server." + operation);
        if (hasOperationPermission) {
            break authorization;
        }
        throw new Error("The request requires specific privileges at this sensible point");
    }
})(([].indexOf(args[0]) !== -1) && (["addTable", "addColumn", "renameTable", "renameColumn", "dropTable", "dropColumn", "setSchema"]).indexOf(operation) !== -1);

await (async (condition) => {
    if (condition) return false;
    let authentication = await server.authenticateRequest(request);
    authentication: {
        if (!(authentication)) {
            throw new Error("The request requires authentication at this sensible point [784392165]");
        }
    }
    authorization: {
        let permissions = authentication.permisos.map(it => it.operacion);
        let hasOperationPermission = permissions.contains("server." + operation);
        if (hasOperationPermission) {
            break authorization;
        }
        throw new Error("The request requires specific privileges at this sensible point");
    }
})((["Usuario", "Grupo", "Sesion"].indexOf(args[0]) !== -1) && (["insertOne", "insertMany", "updateOne", "updateMany", "deleteOne", "deleteMany"]).indexOf(operation) !== -1);