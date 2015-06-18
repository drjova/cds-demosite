define(function (require, exports, module) {

  'use strict';

  /**
   * Module dependencies
   */

  require('hgn');
  var _ = require('lodash');
  var async = require('async');
  var defineComponent = require('flight/lib/component');
  var boxStorage = require('js/personal/helpers/localStorage');
  /**
   * Templates dependencies
   */

  var templateLayout = require('hgn!./../templates/layout');
  var defaultNormal = require('hgn!./../templates/base/default');
  var defaultAdmin = require('hgn!./../templates/admin/default');

  /**
   * Module exports
   */

  return defineComponent(Box);

  /**
   * Module function
   */

  function Box() {
    this.attributes({
      // General
      templates: function () {
        return {
          'wrapper': {
            'default': templateLayout,
          },
          'normal': {
            'default': defaultNormal,
            'record_list': defaultNormal,
          },
          'edit': {
            'default': defaultAdmin,
            'record_list': defaultAdmin,
          },
          'new':{
            'default': defaultAdmin,
            'record_list': defaultAdmin,
          }
        }
      },
      defaultBoxType: 'record_list',
      // Selectors
      // BOX
      boxSelector: '.personal-box',
      boxContentSelector: '.personal-box-content',
      // EDIT
      editSelector: '.personal-box-actions-edit',
      editMenuSelector: '.personal-admin-box-type',
      saveEditSelector: '.personal-box-actions-edit-save',
      closeEditSelector: '.personal-box-actions-edit-close',
      // DELETE
      deleteSelector: '.personal-box-actions-delete',
    });

    /**
     * renderBoxes() returns a box wrapper to
     * the DOM
     *
     * @param {Object} data.items
     * @param {String} data.initWithView
     *
     * Triggers:
     * - `personal.ui.box.render`
     * - `personal.ui.boxes.render.finished`
     *
     * Listeners
     * - `personal.data.boxes.loaded`
     */
    this.renderBoxes = function(ev, data){
      var that = this;
      async.eachSeries(data.items, function(item, callback){
        that.trigger(
          document,
          'personal.ui.box.render',
          {
            $el: that.$node,
            item: item,
            template: 'wrapper',
            override: false
          }
        );
        if (data.initWithView !== undefined){
          that.trigger(
            document,
            'personal.ui.box.content.change',
            {
              id: item.id,
              item: item,
              type: data.initWithView
            }
          );
        }
        callback();
      }, function(err){
        if(!err){
          that.trigger(
            document,
            'personal.ui.boxes.rendered'
          );
        }
      });
    }

    /**
     * render() renders and returns the
     * specified element to the DOM
     *
     * @param {Compiled Hogan Template} data.template
     * @param {String} data.type
     * @param {Object} data.item
     * @param {Boolean} data.override
     * @param {jQuery Selector} data.$el
     *
     * Triggers:
     * - `personal.ui.box.rendered`
     * - `personal.ui.box.state.change`
     *
     * Listeners:
     * - `personal.ui.box.render`
     */
    this.render = function(ev, data){
      var html;
      var that = this;
      try{
        html = that.attr.templates[data.template][data.item._settings.type](data.item);
      }catch(error){
        html = that.attr.templates[data.template]['default'](data.item);
      }
      if (data.override){
        data.$el.html(html);
      }else{
        data.$el.append(html);
      }
      this.trigger(
        document,
        'personal.ui.box.rendered',
        {
          item: data.item,
          template: data.template
        }
      );
      if (data.type !== undefined){
        this.trigger(
          document,
          'personal.ui.box.state.change',
          {
            id: data.item.id,
            type: data.type
          }
        );
      }
    }

    /**
     * clear() clears the `this.$node`
     *
     * Triggers:
     * `personal.ui.boxes.cleared`
     *
     * Listeners:
     * - `personal.ui.boxes.clear`
     */
    this.clear = function(ev, data){
      this.$node.empty();
      this.trigger(document, 'personal.ui.boxes.cleared');
    }

    /**
     * change_state() changes the state of the
     * selected `box` and hides/shows based on
     * `type` parameter
     *
     * @param {Int} data.id
     * @param {String} data.type
     *
     * Triggers:
     * - `personal.ui.box.state.changed`
     *
     * Listeners:
     * - `personal.ui.box.state.change`
     */
    this.changeState = function(ev, data){
      var $el = this._find_box(data.id);
      // Get the previous box state
      var previous = $el.data('state');
      // Save it
      $el.data('previous-state', previous);
      // Change the state to the new one
      $el.data('state', data.type);
      // Make a dance and find which element should be shown
      // for this type
      $el.find('[data-show]').each(function(index, item){
        var $item = $(item);
        if($item.data('show') != data.type){
          $item.hide();
        }else{
          $item.show();
        }
      });
      this.trigger(document, 'personal.ui.box.state.changed', {
        id: data.id,
        from: previous,
        to: data.type,
      });
    }

    /**
     * changeContent() changes the box content
     *
     * @param {Int} data.id
     * @param {String} data.type
     *
     * Triggers:
     * - `personal.ui.box.render`
     * - `personal.ui.box.content.changed`
     *
     * Listeners:
     * - `personal.ui.box.content.change`
     */
    this.changeContent = function(ev, data){
      var item = boxStorage.get(data.id) || {
        init: false,
        id: data.id,
        type: data.type,
        _settings: {
          type: this.attr.defaultBoxType
        }
      };
      this.trigger(
        document,
        'personal.ui.box.render',
        {
          $el: this._find_content(data.id),
          item: item,
          template: data.type,
          override: true,
          type: data.type
        }
      );
    }

    /**
     * addBox() adds a new empty box to the DOM
     *
     * Triggers:
     * - `personal.ui.box.add`
     *
     * Listeners:
     * - `personal.ui.boxes.add`
     */
    this.addBox = function(ev, data){
      this.trigger(
        document,
        'personal.data.boxes.loaded',
        {
          initWithView: 'edit',
          items: [
            {
              id: this._temp_id_generator(),
              _settings:{
                type: this.attr.defaultBoxType
              },
            }
          ]
        }
      );
      this.trigger(
        document,
        'personal.ui.box.add'
      );
    }

    /**
     * editBox() Enables edit view of the box
     *
     * Triggers:
     * - `personal.ui.box.content.change`
     *
     * Listeners:
     * - `click: editSelector`
     */
    this.editBox = function(ev, data){
      var id = $(data.el).data('id');
      this.trigger(
        document,
        'personal.ui.box.content.change',
        {
          id: id,
          type: 'edit'
        }
      );
    }

    /**
     * editMenuSelector() Changes the edit menu selector
     *
     * Triggers:
     * - `personal.ui.box.content.change`
     *
     * Listeners:
     * - `change: editMenuSelector`
     */
    this.editMenuSelector = function(ev, data){
      var id = $(data.el).data('id');
      this.trigger(
        document,
        'personal.ui.box.content.change',
        {
          id: id,
          type: 'edit'
        }
      );
    }

    /**
     * closeEditBox() Disables edit view of the box
     *
     * Triggers:
     * - `personal.ui.box.general.content.change`
     * - `personal.ui.box.delete`
     *
     * Listeners:
     * - `click: closeEditSelector`
     */
    this.closeEditBox = function(ev, data){
      var id = $(data.el).data('id');
      var $box = this._find_box(id);
      if (!$box.data('init')){
        // If the box is new just remove it
        $box.parent().remove();
      }else{
        this.trigger(
          document,
          'personal.ui.box.content.change',
          {
            id: id,
            type: 'normal'
          }
        );
      }
      this.trigger(
        document,
        'personal.ui.box.general.content.change'
      );
    }

    /**
     * saveEditBox() Save the box configuration
     *
     * Triggers:
     * - `personal.data.box.edit.save`
     * - `personal.ui.box.content.change`
     *
     * Listeners:
     * - `click: saveEditSelector`
     */
    this.saveEditBox = function(ev, data){
      var id = $(data.el).data('id');
      this.trigger(
        document,
        'personal.data.box.edit.save',
        {
          id: id,
          data: this._find_form_data(id)
        }
      );
      this.trigger(
        document,
        'personal.ui.box.content.change',
        {
          id: id,
          type: 'normal'
        }
      );
    }

    /**
     * deleteBox() Delete the box
     *
     * Triggers:
     * - `personal.ui.box.delete`
     *
     * Listeners:
     * - `click: deleteSelector`
     */
    this.deleteBox = function(ev, data){
      var id = $(data.el).data('id');
      this.trigger(
        document,
        'personal.ui.box.delete',
        {
          id: id
        }
      );
    }


    // AFTER INIT ===========================================================
    this.after('initialize', function () {
      // Subscribe
      // =========
      // DATA
      this.on(document, 'personal.data.boxes.loaded', this.renderBoxes);
      // UI Box
      this.on(document, 'personal.ui.box.render', this.render);
      this.on(document, 'personal.ui.box.state.change', this.changeState);
      this.on(document, 'personal.ui.box.content.change', this.changeContent);
      // UI Boxes
      this.on(document, 'personal.ui.boxes.add', this.addBox);
      this.on(document, 'personal.ui.boxes.clear', this.clear);
      // UI EVENTS
      this.on(document, 'click', {
        'editSelector': this.editBox.bind(this),
        'closeEditSelector': this.closeEditBox.bind(this),
        'saveEditSelector': this.saveEditBox.bind(this),
        'deleteSelector': this.deleteBox.bind(this)
      });
      this.on(document, 'change', {
        'editMenuSelector': this.editMenuSelector.bind(this)
      })
      // Trigger
      this.trigger(document, 'personal.ui.boxes.load');
      this.trigger(document, 'personal.ui.boxes.init');
    });
    // AFTER INIT ============================================================

    // HELPERS ===============================================================
    /**
      * _find_box() finds and returns the `box`
      *
      * @param {Int} id
      * @return {jQuery Selector} $box
      */
    this._find_box = function(id){
      var $box = $('[data-box='+id+']').first();
      return $box;
    }

    /**
      * _find_content() finds and returns the `box`
      * content selector
      *
      * @param {Int} id
      * @return {jQuery Selector} $content
      */
    this._find_content = function(id){
      // Get the BOX
      var $box = this._find_box(id);
      // Get the content
      var $content = $box.find(this.select('boxContentSelector'))
        .first();
      return $content;
    }

    /**
      * _get_form_data() Get form data
      * content selector
      *
      * @param {Int} id
      * @return {Object} data
      */
    this._find_form_data = function(id){
      // Get the content
      var $content = this._find_content(id);
      var data = $content.find('form').serializeArray();
      return data;
    }

    /**
      * _temp_id_generator() creates a temp box id
      *
      * @return {Int} int
      */
    this._temp_id_generator = function(){
      var boxes = boxStorage.all();
      return _.size(boxes) + 1;
    }
    // HELPERS ===============================================================
  }
});
