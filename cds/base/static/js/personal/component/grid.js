define(function (require) {

  var _ = require('vendors/lodash/lodash');
  var defineComponent = require('flight/lib/component');
  var boxStorage = require('js/personal/helpers/boxStorage');
  var gridStorage = require('js/personal/helpers/gridStorage');
  var sortable = require('vendors/sortable.js/sortable');

  return defineComponent(Grid);

  function Grid() {
    this.defaultAttrs({
      ID: 'personal-grid-handler',
      dragHandle: '.personal-box',
      collection: null,
    });

    // Init
    this.init = function (ev, args) {
      var that = this;
      var el = document.getElementById(that.attr.ID);
      // delete localStorage
      var sort = sortable.create(el, {
        animation: 250,
        dataIdAttr: 'data-id',
        handle: that.attr.dragHandle,
        onUpdate: function (evt) {
          that.trigger(document, 'personal.boxes.data.order');
        },
        store: {
            get: function (sortable) {
              var order = gridStorage.get('current');
              return order.ids || [];
            },
            set: function (sortable) {
                var order = sortable.toArray();
                gridStorage.update({'id': 'current', ids: _.map(order, _.parseInt)});
            }
        }
      });
    };

    // After initialization
    this.after('initialize', function () {
      this.on(document, 'personal.boxes.ui.rendered', this.init);
      this.on(document, 'personal.boxes.data.init', this.initOrder);
      this.trigger(document, 'personal.grid.initialized');
    });
  }
});
