Superseded answer keys, one per (lesson, content version) that older builds still ship. When a
lesson's stages or keys change, its key in `answerKeys/<node>.mjs` takes the new contentVersion and
the old file is kept here as `<node>.v<old>.mjs`, byte for byte. pokerServer's
`scripts/import-academy-keys.mjs` converts these too, so each old version stays registered.
