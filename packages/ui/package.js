Package.describe({
  summary: "Deprecated: Use the Blaze package",
  version: '1.0.1'
});

Package.on_use(function (api) {
  api.use('blaze');
  api.imply('blaze');
});
