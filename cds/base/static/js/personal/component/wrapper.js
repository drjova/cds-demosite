define(function (require) {

  var boxStorage = require('js/personal/helpers/boxStorage');
  var defineComponent = require('flight/lib/component');

  return defineComponent(Wrapper);

  function Wrapper() {
    this.defaultAttrs({
      addBoxSelector: '.personal-boxes-add-more',
      maxBoxesOnGrid: 9,
      gridLoader: '.personal-grid-loader',
      errorMessage: '.personal-grid-error-message',
    });

    this.checkLimits = function (ev, args) {
      var overLimit = _.size(boxStorage.getItems('boxes').split(',')) >= this.attr.maxBoxesOnGrid;
      if ( overLimit ) {
        this.trigger(document, 'personal.wrapper.hideAddButton');
      } else {
        this.trigger(document, 'personal.wrapper.showAddButton');
      }
    };

    this.showAddButton = function (ev, args) {
      $(this.attr.addBoxSelector).show();
    };

    this.hideAddButton = function (ev, args){
      $(this.attr.addBoxSelector).hide();
    };

    this.showLoader = function (ev, args){
      $(this.attr.gridLoader).css('visibility', 'visible');
    };

    this.hideLoader = function (ev, args){
      consol.log('hey')
      $(this.attr.gridLoader).css('visibility', 'hidden');
    };

    this.errorMessage = function (ev, args) {
      $(this.attr.errorMessage).html(args.message);
    };

    this.after('initialize', function () {
      // Bind events
      this.on(document, 'personal.wrapper.checkLimits', this.checkLimits);
      this.on(document, 'personal.wrapper.hideAddButton', this.hideAddButton);
      this.on(document, 'personal.wrapper.hideLoader', this.hideLoader);
      this.on(document, 'personal.wrapper.showAddButton', this.showAddButton);
      this.on(document, 'personal.wrapper.showLoader', this.showLoader);
      this.on(document, 'personal.wrapper.errorMessage', this.errorMessage);
      // Click events
      this.on(document, 'click', {
        'addBoxSelector': this.addBox
      });
    });
  }
});
