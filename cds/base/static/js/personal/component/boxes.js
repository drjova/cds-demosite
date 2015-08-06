define(function (require) {

  var _ = require('vendors/lodash/lodash');
  var async = require('vendors/async/lib/async');
  var boxStorage = require('js/personal/helpers/boxStorage');
  var settingsStorage = require('js/personal/helpers/settingsStorage');
  var defineComponent = require('flight/lib/component');

  function Box() {
    this.defaultAttrs({
      boxStorage: boxStorage,
      settingsStorage: settingsStorage,
      collection: null,
      api: {
        boxes: null,
        settings: null
      }
    });

    this._requestOptions = function(args) {
      return {
          url: args.url,
          type: args.method || 'GET',
          cache: false,
          data: JSON.stringify(args.data || {}),
          contentType: "application/json; charset=utf-8",
          dataType: 'json'
      };
    };

    this._request = function(args){
      var deferred = $.Deferred();
      $.ajax(
        this._requestOptions(args)
      ).done(function(data) {
        deferred.resolve(data);
      }).fail(function(error){
        deferred.reject(error);
      });
      return deferred.promise();
    };

    this.init = function(ev, args) {
      var that = this;
      that.trigger(document, 'personal.wrapper.loader.show');
      that.attr.boxStorage.destroyAll();
      that.attr.settingsStorage.destroyAll();
      $.when(
        that._request({
          url: that.attr.api.settings,
        }),
        that._request({
          url: that.attr.api.boxes,
        })
      ).done(function(settings, data) {
        that._saveBoxes(data);
        that._saveSettings(settings);
        that.trigger(document, 'personal.boxes.data.initialized');
      }).fail(function (error){
        that._error(error);
      }).always(function() {
        that.trigger(document, 'personal.wrapper.loader.hide');
      });
    };

    this.update = function(ev, args) {
      var that = this;
      that.trigger(document, 'personal.wrapper.loader.show');
      var id = args.id;
      var box = that.attr.boxStorage.get(id);
      var isNew = _.isUndefined(box.dummy) ? false : true;
      var data = args.data;
      box._settings = data;
      that.attr.boxStorage.save(box);
      var sendingData = {}
      if (!isNew) {
        sendingData.index = id - 1;
        sendingData.data = [data];
      } else {
        sendingData.data = _.pluck(that.attr.boxStorage.all(), '_settings');
      }
      $.when(
        that._request({
          url: that.attr.api.boxes,
          data: sendingData,
          method: 'POST'
        })
      ).done(function(data){
        var box = (isNew) ? data.data[id-1] : data.data;
        box.id = id;
        that.attr.boxStorage.update(box);
        that.trigger(document, 'personal.boxes.ui.normal', {
          ids: [id]
        });
      }).fail(function(error) {
        that._error(error);
      }).always(function() {
        that.trigger(document, 'personal.wrapper.loader.hide');
      });
    };

    this.order = function(ev, args) {
      var that = this;
      that.trigger(document, 'personal.wrapper.loader.show');
      var sendingData = {
        data:  that._getOrderedBoxes()
      };
      $.when(
        that._request({
          url: that.attr.api.boxes,
          data: sendingData,
          method: 'POST'
        })
      ).done(function(data){
        that.trigger(document, 'personal.boxes.data.order');
      }).fail(function(error) {
        that._error(error);
      }).always(function() {
        that.trigger(document, 'personal.wrapper.loader.hide');
      });
    };

    this.remove = function(ev, args) {
      var that = this;
      that.trigger(document, 'personal.wrapper.loader.show');
      var id = args.id;
      $.when(
        that._request({
          url: that.attr.api.boxes,
          data: {
            index: id -1
          },
          method: 'DELETE'
        })
      ).done(function() {
        that.trigger(document, 'personal.boxes.data.deleted');
      }).always(function() {
        that.trigger(document, 'personal.wrapper.loader.hide');
      });
    };

    this._saveBoxes = function(items) {
      var that = this;
      async.forEachOf(items.data, function(item, index, callback) {
        item.id = index + 1;
        that.attr.boxStorage.save(item);
        callback();
      }, function(error){
        if (error) {
          this._error(error);
        }
      });
    };

    this._saveSettings = function(data) {
      this.attr.settingsStorage.save(data);
    };

    this._error = function(error) {
      this.trigger(document, 'personal.boxes.error', {
        message: (error.status == 401) ? 'You must be logged in' : 'Sorry an error occured'
      });
    };

    this._prepareOrder = function() {
      var namespace = 'grid-'+this.attr.collection;
      var initNamespace = 'init-' + namespace;
      var newOrder = localStorage.getItem(namespace).split(',');
      localStorage.setItem(initNamespace, newOrder.join(','));
      var order = _.map(newOrder, function(index){
        return index - 1;
      });
      return order;
    }

    this._prepareSettings = function() {
      var items = this.attr.boxStorage.all();
      var settings = _.pluck(items, '_settings');
      return settings;
    }

    this._getOrderedBoxes = function() {
      return _.at(this._prepareSettings(), this._prepareOrder());
    };

    this.after('initialize', function() {
      this.on(document, 'personal.boxes.data.delete', this.remove);
      this.on(document, 'personal.boxes.data.order', this.order);
      this.on(document, 'personal.boxes.data.update', this.update);
      this.init();
    });
  }
  return defineComponent(Box);
});
