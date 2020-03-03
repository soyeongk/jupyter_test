var plugin = require('./index');
var base = require('@jupyter-widgets/base');

module.exports = {
  id: 'test_rete',
  requires: [base.IJupyterWidgetRegistry],
  activate: function(app, widgets) {
      widgets.registerWidget({
          name: 'test_rete',
          version: plugin.version,
          exports: plugin
      });
  },
  autoStart: true
};

