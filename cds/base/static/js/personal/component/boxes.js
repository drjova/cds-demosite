define(function (require) {

  var _ = require('vendors/lodash/lodash');
  var async = require('vendors/async/lib/async');
  var boxStorage = require('js/personal/helpers/boxStorage');
  var gridStorage = require('js/personal/helpers/gridStorage');
  var defineComponent = require('flight/lib/component');


  return defineComponent(Boxes);

  function Boxes()  {
    this.defaultAttrs({
      collection: null,
      api: {
        boxes: null,
        settings: null
      }
    });

    this._request = function(args) {
      var that = this;
      var deferred = $.Deferred();
      that.trigger(document, 'personal.wrapper.showLoader');
      $.ajax({
        contentType: 'application/json',
        dataType: 'json',
        data: JSON.stringify(args.data || {}),
        url: that.attr.api[args.type],
        method: args.method,
      })
        .done(function(response){
          deferred.resolve(response.data);
        })
        .fail(function(jqXHR, textStatus, errorThrown){
          that.trigger(document, 'personal.wrapper.errorMessage', {
            message: textStatus
          });
          // Huston we've got a problem
          deferred.reject(textStatus);
        })
        .always(function(){
          that.trigger(document, 'personal.wrapper.hideLoader');
        });
      return deferred.promise();
    };

    this.init = function (ev, args){
      var that = this;
      $.when(
        that.get()
      )
      .done(function (data) {
        // Delete localstorage
        boxStorage.destroyAll();
        // Update localstorate
        async.forEachOf(data, function(item, index, callback) {
          item.id = index + 1;
          boxStorage.save(item);
          callback();
        }, function(err){
          that.trigger(document, 'personal.boxes.data.init');
          that.trigger(document, 'personal.boxes.ui.init');
        });
      })
      .fail(function () {
        // FIXME: Add fail handling
      });
    };

    this.get = function (ev, args) {
      var deferred = $.Deferred();
      $.when(
        this._request({
          method: 'GET',
          data: {},
          type: 'boxes'
        })
      )
      .done(function (data) {
        return deferred.resolve(data);
      })
      .fail(function (error) {
        return deferred.reject(error);
      })
      .always(function () {
        // FIXME: Do something always
      });
      return deferred.promise();
    };

    this.update = function (ev, args) {
      var that = this;
      var box = boxStorage.get(args.id);
      var index = this._findBoxIndex(args.id);
      box._settings = args.settings;
      boxStorage.update(box);
      if ( !_.isUndefined(box.dummy) ) {
        // It's a new box
        var boxes = _.pluck(boxStorage.all(), '_settings');
        $.when(
          this._request({
            method: 'POST',
            data: {
              data: boxes,
            },
            type: 'boxes'
          })
        )
        .done(function (boxes) {
          // Find the box with the some settings
          var data = boxes[index];
          var id = index + 1;
          console.log('DATA', data, boxes, index);
          data['id'] = id;
          boxStorage.update(data);
          that.trigger(document, 'personal.boxes.ui.changeState', {
            id: id,
            state: 'normal'
          });
        })
        .fail(function (error) {
          // FIXME: Do something nice here
        });
      } else {
        // It's an old box
        $.when(
          this._request({
            method: 'POST',
            data: {
              data: [args.settings],
              index: index,
            },
            type: 'boxes'
          })
        )
        .done(function (data) {
          var id = index + 1;
          data.id = id;
          boxStorage.update(data);
          console.log('Box', data);
          that.trigger(document, 'personal.boxes.ui.changeState', {
            id: id,
            state: 'normal'
          });
        })
        .fail(function (error) {
          // FIXME: Do something nice here
        });
      }
    };

    this.order = function(ev, args) {
      // Get boxes

      var ids = gridStorage.get('current').ids;
      var settings = [];
      async.forEach(ids, function(id, index, callback) {
        settings.push(_.pluck(boxStorage.get(id), '_settings'));
      }, function(error) {
        console.log('Settings', settings);
      });

      var order = _.map(ids, function(id) {
        return id - 1;
      });
      console.log('Settins', ids, order, settings, _.at(settings, order));
    };

    this.remove = function (ev, args) {
      boxStorage.destroy(args.id);
      this._request({
        type: 'boxes',
        method: 'DELETE',
        data: {
          id: args.id
        },
      });
    };

    this.after('initialize', function () {
      this.on(document, 'personal.boxes.data.delete', this.remove);
      this.on(document, 'personal.boxes.data.update', this.update);
      this.on(document, 'personal.boxes.data.order', this.order);
      this.init();
    });

    this._shouldUpdateOrder = function() {
      //var initOrder = gridStorage.get('current');
      //var currentOrder = gridStorage.get('current');
      //var differentSize = _.size(ids) != _.size(currentOrder);
      //var orderChanged = initOrder.toString() != currentOrder.toString();
      //if (_.size(ids) != _.size(currentOrder) || _.(ids).toString() != _.){
        //return true;
      //}
      //return false
    }

    this._findBoxIndex = function(id) {
      // Get all ids ordered an get the index
      var order = this._getCurrentOrder();
      return order.indexOf(id.toString());
    }

    this._getCurrentOrder = function(){
      return gridStorage.get('current').ids;
    }

    //this._getOrder = function(){
      //return _.at(this._prepare_settings(), this._prepare_order());
    //}

    this._getAllActiveBoxes = function(dummy) {
      var includeDummy = _.isUndefined(dummy) ? true : false;
      if (includeDummy){
        return boxStorage.all();
      }
      return boxStorage.find(function(box){
        return _.isUndefined(box.dummy);
      })
    }
  }
});

//define(function (require, exports, module) {

  //'use strict';
  //var _ = require('vendors/lodash/lodash');
  //var async = require('vendors/async/lib/async');
  //var boxStorage = require('js/personal/helpers/localStorage');
  //var defineComponent = require('flight/lib/component');

  //return defineComponent(Boxes);


  //function Boxes() {
    //this.defaultAttrs({
      //api: function(){
        //return {
          //'boxes': '/api/personal_collection/home',
          //'settings': '/api/personal_collection/settings',
        //}
      //},
    //});

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
    //this.pullFromServer = function(ev, data){
      //var that = this;
      //that.trigger(
        //document,
        //'personal.data.request.started'
      //);
      //$.ajax({
        //url: that.attr.api[data.type],
        //contentType: 'application/json',
        //dataType: 'json',
        //method: data.method,
        //data: JSON.stringify(data.items),
        //statusCode: {
          //500: function(){
            //that.trigger(
              //document,
              //'personal.data.request.500'
            //);
          //},
          //403: function(){
            //that.trigger(
              //document,
              //'personal.data.request.403'
            //);
          //},
          //412: function(){
            //that.trigger(
              //document,
              //'personal.data.request.412'
            //);
          //},
          //200: function(){
            //that.trigger(
              //document,
              //'personal.data.request.200'
            //);
          //}
        //}
      //})
      //.done(function(response, textStatus, jqXHR){
        //that.trigger(
          //document,
          //'personal.data.request.success',
          //{
            //boxes: response,
            //reload: (data.reload === undefined) ? true : data.reload,
            //type: data.type
          //}
        //);
      //})
      //.fail(function(jqXHR, textStatus, errorThrown){
        //that.trigger(
          //document,
          //'personal.data.request.fail'
        //);
      //})
      //.always(function(data_or_object, textStatus, error_or_object){
        //that.trigger(
          //document,
          //'personal.data.request.finished'
        //);
      //});
    //}

    /**
     * pull() pull data from server
     *
     * Triggers:
     *
     * Listeners:
     */
    //this.pull = function(ev, data) {
      //this.trigger(
        //document,
        //'personal.data.request.load',
        //{
          //method: 'GET',
          //type: 'boxes',
          //items: {},
          //reload: true
        //}
      //)
    //}

    /**
     * init() gets the initial data
     *
     * Triggers:
     *
     * Listeners:
     */
    //this.init = function(ev, data) {
      //var that = this;
      //boxStorage.destroyAll();
      //var items = data.boxes.data;
      //async.forEachOf(items, function(item, index, callback) {
        //item.id = index+1;
        //item.order = index;
        //item.init = true;
        //boxStorage.save(item);
        //callback();
      //}, function(err){
        //// Update the order
        //if(data.reload){
          //that.trigger(
            //document,
            //'personal.data.boxes.load'
          //);
        //}
      //});
    //}

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
    //this.load = function(ev, data) {
      //this.trigger(document, 'personal.ui.boxes.clear');
      //this.trigger(document, 'personal.data.boxes.loaded', {
        //items: boxStorage.all(),
        //initWithView: 'normal'
      //});
    //}

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
    //this.remove = function(ev, data) {
      //// delete the box
      //boxStorage.destroy(data.id);
      //this.trigger(
        //document,
        //'personal.data.boxes.load'
      //);
      //this.trigger(
        //document,
        //'personal.data.request.load',
        //{
          //method: 'DELETE',
          //type: 'boxes',
          //items: {
            //index: data.id - 1
          //},
          //reload: false
        //}
      //);
    //}

    /**
     * save() Save the box
     *
     * @param {Int} data.id
     *
     * Triggers:
     * - `personal.data.data.request.load`
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
    //this.save = function(ev, data) {
      //var that = this;
      //// We are saving or updating a box
      //var box = boxStorage.get(data.id);
      //var settings = this._prepare_data(data.data);
      //if (box) {
        //// Update the box settings
        //box._settings = settings;
        //boxStorage.update(box);
      //} else {
        //// It's a new box save it and get the content
        //var newBox = {
          //id: data.id,
          //_settings: settings
        //}
        //boxStorage.save(newBox);
      //}
      //this.trigger(
        //document,
        //'personal.data.request.load',
        //{
          //method: 'POST',
          //type: 'boxes',
          //items: {
            //data: this._get_ordered_boxes()
          //},
          //reload: true
        //}
      //);
      //this.trigger(
        //document,
        //'personal.ui.box.added'
      //);
    //}

    /**
     * order() Order the box
     *
     * @param {Int} data.id
     *
     * Triggers:
     * - `personal.data.request.load`
     *
     * Listeners:
     * - `personal.grid.order.changed`
     *
     */
    //this.order = function(ev, data) {
      //if (this._should_the_order_been_saved()){
        //this.trigger(
          //document,
          //'personal.data.request.load',
          //{
            //method: 'POST',
            //type: 'boxes',
            //items: {
              //data: this._get_ordered_boxes()
            //},
            //reload: false
          //}
        //);
      //}
    //}

    /**
     * _prepare_settings() prepare settings
     *
     * @return {Object} settings
     *
     */
    //this._prepare_settings = function() {
      //var items = boxStorage.all();
      //var settings = _.pluck(items, '_settings');
      //return settings;
    //}

    /**
     * _prepare_data() prepare data
     *
     * @param {Object} settings
     * @return {Object} data
     *
     */
    //this._prepare_data = function(settings) {
      //var data = {};
      //_.forEach(settings, function(item, index) {
        //this[item.name] = item.value;
      //}, data);
      //return data;
    //}

    /**
     * _prepare_order() prepare order
     *
     * @return {List} the order of box indexes
     *
     */
    //this._prepare_order = function() {
      //var newOrder = localStorage.getItem('sortableOrder').split('|');
      //localStorage.setItem('boxesOrder', newOrder.join(','));
      //var order = _.map(newOrder, function(index){
        //return index - 1;
      //});
      //return order;
    //}

    /**
     * _should_the_order_been_saved() should we change the order
     *
     * @return {Boolean} Should we save the order
     *
     */
    //this._should_the_order_been_saved = function() {
      //var currentOrder = localStorage.getItem('boxesOrder');
      //if(!_.isEmpty(currentOrder)){
        //var newOrder = localStorage.getItem('sortableOrder');
        //var must = (_.size(currentOrder) == _.size(newOrder) && !_.isEqual(currentOrder.split(','), newOrder.split('|'))) ? true : false;
        //return must;
      //}
      //return true;
    //}

    /**
     * _get_ordered_boxes() ordered settings of the boxes, ready to be sent
     * to the server
     *
     * @return {List} boxes settings
     *
     */
    //this._get_ordered_boxes = function() {
      //return _.at(this._prepare_settings(), this._prepare_order());
    //}

    //this.after('initialize', function () {
      //// Subscribe
      //// UI
      //this.on(document, 'personal.ui.box.delete', this.remove);
      //// Data
      //this.on(document, 'personal.data.boxes.init', this.init);
      //this.on(document, 'personal.data.boxes.load', this.load);
      //this.on(document, 'personal.data.box.edit.save', this.save);
      //// REQUESTS
      //this.on(document, 'personal.data.request.success', this.init);
      //this.on(document, 'personal.data.request.load', this.pullFromServer);

      //// GRID
      //this.on(document, 'personal.grid.order.changed', this.order);
      //// Pull from server
      //this.pull();
    //});
  //}
//});
