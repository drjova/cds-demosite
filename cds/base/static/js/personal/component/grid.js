define(function (require) {

  var _ = require('vendors/lodash/lodash');
  var boxStorage = require('js/personal/helpers/boxStorage');
  var defineComponent = require('flight/lib/component');
  var errorMessage = require('hgn!./../templates/error');
  var sortable = require('vendors/sortable.js/sortable');

  function Grid() {
    this.defaultAttrs({
      ID: 'personal-grid-handler',
      collection: null,
      maxBoxesOnGrid: 9,
      addBoxSelector: '.personal-boxes-add-more',
      dragHandle: '.personal-box',
      errorMessage: '.personal-grid-error-message',
      gridLoader: '.personal-grid-loader',
    });

    // Init
    this.init = function (ev, args) {
      var that = this;
      var el = document.getElementById(that.attr.ID);
      var namespace = 'grid-'+this.attr.collection
      // delete localStorage
      var sort = sortable.create(el, {
        animation: 250,
        dataIdAttr: 'data-id',
        handle: that.attr.dragHandle,
        onUpdate: function(evt) {
          that.trigger(document, 'personal.boxes.data.order');
        },
        store: {
          get: function(sortable) {
            var order = localStorage.getItem(namespace);
            return order ? order.split(',') : [];
          },
          ser: function(sortable) {
            var order = sortable.toArray();
            localStorage.setItem(namespace, order.join(','));
          }
        }
      });
    };

    this.checkLimits = function(ev, args) {
      var boxes = localStorage.getItem('boxes');
      var overLimit = _.size(boxes.split(',')) >= this.attr.maxBoxesOnGrid;
      if ( overLimit ) {
        this.trigger(document, 'personal.wrapper.button.hide');
      } else {
        this.trigger(document, 'personal.wrapper.button.show');
      }
    };

    this.showAddButton = function(ev, args) {
      $(this.attr.addBoxSelector).show();
    };

    this.hideAddButton = function(ev, args){
      $(this.attr.addBoxSelector).hide();
    };

    this.showLoader = function(ev, args){
      $(this.attr.gridLoader).css('visibility', 'visible');
    };

    this.hideLoader = function(ev, args){
      $(this.attr.gridLoader).css('visibility', 'hidden');
    };

    this.errorMessage = function(ev, args) {
      $(this.attr.errorMessage).html(errorMessage(args));
    };

    this.initOrder = function (ev, args) {
      var boxes = _.pluck(boxStorage.all(), 'id');
      localStorage.setItem(this.attr.namespace + this.attr.collection, boxes.join(','));
      localStorage.setItem(this.attr.namespace, boxes.join(','))
    };

    // After initialization
    this.after('initialize', function () {
      this.on(document, 'personal.boxes.ui.initizalized', this.init);
      this.on(document, 'personal.boxes.data.initialized', this.initOrder);
      this.on(document, 'personal.wrapper.loader.hide', this.hideLoader);
      this.on(document, 'personal.wrapper.loader.show', this.showLoader);
      this.on(document, 'personal.boxes.error', this.errorMessage);
      this.on(document, 'personal.wrapper.check.button.limits', this.checkLimits);
      this.on(document, 'personal.wrapper.button.hide', this.hideAddButton);
      this.on(document, 'personal.wrapper.button.show', this.showAddButton);
      this.on(document, 'personal.boxes.error', this.errorMessage);

      this.trigger(document, 'personal.wrapper.check.button.limits');
    });
  }

  return defineComponent(Grid);
});
