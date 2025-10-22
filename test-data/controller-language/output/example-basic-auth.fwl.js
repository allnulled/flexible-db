await (async (condition) => {
    if (condition) return false;
    let authentication = await this.authenticateRequest(request);
    authentication: {
        /* 
 console.log("url", request.originalUrl); 
 console.log("operation", operation); 
 console.log("model", model); 
 console.log("args", args); 
 console.log("authenticationToken", authenticationToken); 
 console.log("authentication", authentication); 
 */
        if (!(authentication)) {
            throw new Error("The request requires authentication at this sensible point [52684251]");
        }
    }
    authorization: {
        let permissions = authentication.permisos.map(it => it.operacion);
        // console.log("permissions", permissions) 
        let hasOperationPermission = permissions.indexOf("server." + operation) !== -1;
        if (hasOperationPermission) {
            break authorization;
        }
        throw new Error("The request requires specific privilege «server." + operation + "» at this sensible point [12324688282]");
    }
})(([].indexOf(args[0]) !== -1) && (["addTable", "addColumn", "renameTable", "renameColumn", "dropTable", "dropColumn", "setSchema"]).indexOf(operation) !== -1);

await (async (condition) => {
    if (condition) return false;
    let authentication = await this.authenticateRequest(request);
    authentication: {
        /* 
 console.log("url", request.originalUrl); 
 console.log("operation", operation); 
 console.log("model", model); 
 console.log("args", args); 
 console.log("authenticationToken", authenticationToken); 
 console.log("authentication", authentication); 
 */
        if (!(authentication)) {
            throw new Error("The request requires authentication at this sensible point [52684251]");
        }
    }
    authorization: {
        let permissions = authentication.permisos.map(it => it.operacion);
        // console.log("permissions", permissions) 
        let hasOperationPermission = permissions.indexOf("server." + operation) !== -1;
        if (hasOperationPermission) {
            break authorization;
        }
        throw new Error("The request requires specific privilege «server." + operation + "» at this sensible point [12324688282]");
    }
})((["Usuario", "Grupo", "Sesion"].indexOf(args[0]) !== -1) && (["insertOne", "insertMany", "updateOne", "updateMany", "deleteOne", "deleteMany"]).indexOf(operation) !== -1);