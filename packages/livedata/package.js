Package.describe({
  summary: "Moved to the 'ddp' package",
  version: '1.0.8'
});

Package.on_use(function (api) {
  api.imply("ddp");
});
