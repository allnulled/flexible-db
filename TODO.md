- [ ] Homogeneizar las 3 APIs:
   - [x] `BasicServer` - `createServer`
   - [x] `BasicClient` - `createClient`
   - [x] `BasicDataset` - `createDataset`
- [x] `selectByUid`
   - [x] el método de buscar en todas las tablas, todos los recursos
   - [x] el selector en el árbol JSON de `$ids.uid` queda reservado como nombre de tabla genérica.
   - [x] el método de `database.consumeUid()`
- [x] `selectByLabel(label)` - de la propiedad de columna `{label: true}`
   - [x] donde `label` puede ser un `string`
      - [x] y luego la columna puede ser un tipo `string` y la comprobación sería `columna === label`
      - [x] y luego la columna puede ser un tipo `array` y la comprobación sería `columna.indexOf(label) !== -1`
- [x] `selectByLabels(labels)`
   - [x] donde `labels` puede ser un `array<string>`:
      - [x] y luego la columna puede ser un tipo `string` y la comprobación sería `label.indexOf(columna) !== -1`
      - [x] y luego la columna puede ser un tipo `array` y la comprobación sería `database.createDataset(label).hasAnyOf(columna)`

   
   