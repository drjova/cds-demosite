define(function (require) {

  var $ = require('jquery');
  // Components
  var _ = require('vendors/lodash/lodash');
  var async = require('vendors/async/lib/async');
  var boxStorage = require('js/personal/helpers/boxStorage');
  var defineComponent = require('flight/lib/component');
  var gridStorage = require('js/personal/helpers/gridStorage');

  // Templates
  var wrapperTemplate = require('hgn!./../templates/layout');
  var navTemplate = require('hgn!./../templates/nav');
  var headerTemplate = require('hgn!./../templates/header');
  var footerTemplate = require('hgn!./../templates/footer');

  // Define flightjs component
  return defineComponent(Box);

  function Box(){
    this.defaultAttrs({
      addNewBox: '.personal-boxes-add-more',
      boxBodySelector: '.personal-box-body',
      boxChangeState: '.personal-box-change-state',
      boxFooterSelector: '.personal-box-footer',
      boxHeaderSelector: '.personal-box-header',
      deleteBox: '.personal-box-delete',
      saveBox: '.personal-box-save',
      editTemplate: '.personal-box-edit-template',
      collection: null,
      templates: {
        record_list: {
          normal: require('hgn!./../templates/normal/record_list'),
          edit: require('hgn!./../templates/edit/record_list'),
        },
        loading: require('hgn!./../templates/loading'),
        newBox: require('hgn!./../templates/new'),
      }
    });

    this.init = function (ev, args) {
      // Get all boxes
      var that = this;
      var boxes = boxStorage.all();
      async.forEach(boxes, function(box, callback){
        var html = wrapperTemplate(box, {
          nav: navTemplate.template,
          header: headerTemplate.template,
          footer: footerTemplate.template,
        });
        that.$node.append(html);
        callback();
      }, function(error){
        if (error) {
          that.trigger(document, 'personal.wrapper.errorMessage');
        } else {
          that.trigger(document, 'personal.boxes.ui.render', {
            boxes: _.pluck(boxes, 'id')
          });
          that.trigger(document, 'personal.boxes.ui.rendered');
        }
      });
    };

    this.render = function (ev, args) {
      var that = this;
      async.forEach(args.boxes, function(id, callback){
        // Get box from storage
        var box = boxStorage.get(id);
        var $box = $('[data-id='+id+']');
        var state = $box.data('state');
        console.log(box, id, state);
        if (state == 'newBox' || state == 'loading'){
          // Get the $element
          $box.find(that.attr.boxBodySelector).html(
            that.attr.templates[state](box)
          );
        } else {
          $box.find(that.attr.boxBodySelector).html(
            that.attr.templates[box._settings.type][state](box)
          );
        }
        callback();
      });
    };

    this.addNewBox = function(ev, args) {
      this._addNewBox();
    }

    this.changeState = function(ev, args) {
      var $target = $(ev.target);
      var state = args.state || $target.data('state');
      var id = args.id || this._findIDFromTarget(ev.target);
      // Change state
      this._changeState(id, state);
    };

    this.deleteBox = function (ev, args) {
      var id = this._findIDFromTarget(ev.target);
      this._deleteBox(id);
    }

    this.saveBox = function (ev, args) {
      var id = this._findIDFromTarget(ev.target);
      this._saveBox(id);
    }

    this.editTemplate = function (ev, args) {
      var id = this._findIDFromTarget(ev.target);
      this._editTemplate(id);
    }

    this.hideOnState = function(ev, args) {
      var $box = this._findBox(args.id);
      var state = args.state;
      $box.find('[data-show]').each(function(index, item){
        var $item = $(item);
        if($item.data('show') != state){
          $item.hide();
        }else{
          $item.show();
        }
      });
    };

    this.after('initialize', function () {
      this.on(document, 'personal.boxes.ui.add', this.addNewBox);
      this.on(document, 'personal.boxes.ui.changeState', this.changeState);
      this.on(document, 'personal.boxes.ui.hideOnState', this.hideOnState);
      this.on(document, 'personal.boxes.ui.init', this.init);
      this.on(document, 'personal.boxes.ui.render', this.render);
      this.on(document, 'click', {
        'addNewBox': this.addNewBox,
        'boxChangeState': this.changeState,
        'deleteBox': this.deleteBox,
        'saveBox': this.saveBox,
        'editTemplate': this.editTemplate,
      });
    });

    this._changeState = function (id, state) {
      var $box = this._findBox(id);
      $box.data('state', state);
      // Fire box state changed
      this.trigger(document, 'personal.boxes.ui.state.changed', {
        id: $box.data('id'),
        state: state
      });
      // Fire box render
      this.trigger(document, 'personal.boxes.ui.render', {
        boxes: [$box.data('id')]
      });
      this.trigger(document, 'personal.boxes.ui.hideOnState', {
        id: $box.data('id'),
        state: state
      });
    }

    this._addNewBox = function() {
      var id = this._tempIDGenerator();
      var box = {
        id: id,
        _settings: {
          type: 'newBox'
        },
        dummy: true
      }
      // Save the dummy box
      boxStorage.save(box);
      var html = wrapperTemplate(box, {
        nav: navTemplate.template,
        header: headerTemplate.template,
        footer: footerTemplate.template,
      });
      this.$node.append(html);
      this._changeState(id, 'newBox');
    }

    this._deleteBox = function(id) {
      var $box = this._findBox(id);
      // Check if is it Dummy
      if (!this._isDummy(id)){
        //FIXME DELETE
      }
      // Remove it from storage
      boxStorage.destroy(id);
      // Destroy it from DOM
      $box.remove();
    }

    this._saveBox = function(id) {
      var settings = this._findFormData(id);
      this.trigger(document, 'personal.boxes.data.update', {
        id: id,
        settings: settings
      });
    }

    this._editTemplate = function (id) {
      var data = this._findFormData(id);
      var box = boxStorage.get(id)
      box._settings.type = data.template;
      boxStorage.update(box);
      this._changeState(id, 'edit');
    }

    this._findFormData = function(id){
      // Get the content
      var $content = this._findBox(id);
      var data = $content.find('form').serializeArray();
      return _.zipObject(_.map(data, _.values));
    }

    this._findBox = function(id){
      var $box = $('[data-id='+id+']').first();
      return $box;
    }

    this._tempIDGenerator = function(){
      var boxes = boxStorage.all();
      return _.size(boxes) + 1;
    }

    this._isDummy = function(id) {
      var box = boxStorage.get(id);
      return _.isUndefined(box.dummy) ? false : true;
    }

    this._findIDFromTarget = function (target){
      var $target = $(target);
      var id = $target
                .closest('[data-id]')
                .first()
                .data('id');
      return id;
    }
  }
});
