define(function (require) {

  'use strict';

  /**
   * Module dependencies
   */
  var defineComponent = require('flight/lib/component');
  var boxStorage = require('js/personal/helpers/localStorage');
  var async = require('async');
  var _ = require('lodash');
  var Storage = require('json!./../data.json');
  /**
   * Module exports
   */

  return defineComponent(Boxes);

  /**
   * Module function
   */

  function Boxes() {
    this.attributes({
      api: function(){
        return {
          'GET': '/api/personal_collection/home',
          'POST': '/api/personal_collection/home'
        }
      },
    });

    /**
     * _request() make a request to the server
     *
     * @param {Object} data.items
     * @param {String} data.method
     *
     * Triggers:
     * - `personal.data.request.started`
     * - `personal.data.request.finished`
     * - `personal.data.request.error.500`
     * - `personal.data.request.error.403`
     * - `personal.data.request.fail`
     * - `personal.data.request.success`
     *
     * Listeners
     * - `personal.data.request.load`
     */
    this.pullFromServer = function(ev, data){
      var that = this;
      console.log('Data to be sent', data.items);
      that.trigger(
        document,
        'personal.data.request.started'
      );
      $.ajax({
        url: that.attr.api[data.method],
        dataType: 'json',
        method: data.method,
        data: data.items,
        statusCode: {
          500: function(){
            that.trigger(
              document,
              'personal.data.request.500'
            );
          },
          403: function(){
            that.trigger(
              document,
              'personal.data.request.403'
            );
          },
          412: function(){
            that.trigger(
              document,
              'personal.data.request.412'
            );
          },
          200: function(){
            that.trigger(
              document,
              'personal.data.request.200'
            );
          }
        }
      })
      .done(function(data, textStatus, jqXHR){
        console.log('Success', data);
        that.trigger(
          document,
          'personal.data.request.success',
          data
        );
      })
      .fail(function(jqXHR, textStatus, errorThrown){
        console.log('FAIL', jqXHR, textStatus, errorThrown);
        that.trigger(
          document,
          'personal.data.request.fail'
        );
      })
      .always(function(data_or_object, textStatus, error_or_object){
        that.trigger(
          document,
          'personal.data.request.finished'
        );
      });
    }

    /**
     * pull() pull data from server
     *
     * Triggers:
     *
     * Listeners:
     */
    this.pull = function(ev, data) {
      this.trigger(
        document,
        'personal.data.request.load',
        {
          method: 'GET',
          items: []
        }
      );
    }

    /**
     * init() gets the initial data
     *
     * Triggers:
     *
     * Listeners:
     */
    this.init = function(ev, data) {
      var that = this;
      boxStorage.destroyAll();
      var items = data.data;
      async.forEachOf(items, function(item, index, callback) {
        item.id = index+1;
        item.order = index;
        boxStorage.save(item);
        callback();
      }, function(err){
        that.trigger(
          document,
          'personal.data.boxes.load'
        );
      });
    }

    /**
     * load() gets the initial data
     *
     * Triggers:
     * - `personal.data.boxes.loaded`
     * - `personal.ui.boxes.clear`
     *
     * Listeners:
     * - `personal.data.boxes.load`
     */
    this.load = function(ev, data) {
      this.trigger(document, 'personal.ui.boxes.clear');
      this.trigger(document, 'personal.data.boxes.loaded', {
        items: boxStorage.all(),
        initWithView: 'normal'
      });
    }

    /**
     * remove() Remove the specified box
     *
     * @param {Int} data.id
     *
     * Triggers:
     * - `personal.data.boxes.load`
     *
     * Listeners:
     * - `personal.ui.box.delete`
     */
    this.remove = function(ev, data) {
      // delete the box
      boxStorage.destroy(data.id);
      this.trigger(
        document,
        'personal.data.boxes.load'
      );
      // FIXME: SEND TO SERVER
    }

    /**
     * save() Save the box
     *
     * @param {Int} data.id
     *
     * Triggers:
     * - `personal.data.boxes.init`
     *
     * Listeners:
     * - `personal.ui.box.edt.save`
     * - `personal.grid.order.changed`
     *
     * NOTE:
     * On save we send everything to server, if we want
     * to return us back the box we should pass the index
    *  as well.
     */
    this.save = function(ev, data) {
      var that = this;
      var justOrder = true;
      // We are saving or updating a box
      if (data.data !== undefined) {
        var box = boxStorage.get(data.id);
        var settings = this._prepare_data(data.data);
        if (box) {
          // Update the box settings
          box._settings = settings;
          boxStorage.update(box);
        } else {
          // It's a new box save it and get the content
          var newBox = {
            id: data.id,
            _settings: settings
          }
          boxStorage.save(newBox);
        }
        justOrder = false;
      }
      var orderedBoxes = localStorage.getItem('sortableOrder').split('|');
      // Is just the order send the settings
      var order = _.map(orderedBoxes, function(index){
        return index - 1;
      });
      // The settings to be sent
      var orderedSettings = _.at(this._prepare_settings(), order);
      var items = {
        data: orderedSettings
      }
      this.trigger(
        document,
        'personal.data.request.load',
        {
          method: 'POST',
          items: items
        }
      );
      this.trigger(
        document,
        'personal.ui.box.added'
      );
    }

    /**
     * _prepare_settings() prepare settings
     *
     * @return {Object} settings
     *
     */
    this._prepare_settings = function() {
      var items = boxStorage.all();
      var settings = _.pluck(items, '_settings');
      return settings;
    }

    /**
     * _prepare_data() prepare data
     *
     * @param {Object} settings
     * @return {Object} data
     *
     */
    this._prepare_data = function(settings) {
      var data = {};
      _.forEach(settings, function(item, index) {
        this[item.name] = item.value;
      }, data);
      return data;
    }

    this.after('initialize', function () {
      // Subscribe
      // UI
      this.on(document, 'personal.ui.box.delete', this.remove);
      // Data
      this.on(document, 'personal.data.boxes.init', this.init);
      this.on(document, 'personal.data.boxes.load', this.load);
      this.on(document, 'personal.data.box.edit.save', this.save);
      // REQUESTS
      this.on(document, 'personal.data.request.success', this.init);
      this.on(document, 'personal.data.request.load', this.pullFromServer);

      // GRID
      //this.on(document, 'personal.grid.order.changed', this.save);
      // Pull from server
      this.pull();
    });
  }
});
