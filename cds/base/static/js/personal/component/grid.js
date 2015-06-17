define(function (require) {

  'use strict';

  /**
   * Module dependencies
   */

  var defineComponent = require('flight/lib/component');
  var Sortable = require('sortable');
  var _ = require('lodash');
  /**
   * Module exports
   */

  return defineComponent(grid);

  /**
   * Module function
   */

  function grid() {
    this.attributes({
      gridID: 'personal-grid-handler',
      dragHandle: '.personal-box',
      max: 7,
      // Selectors
      addBoxSelector: '.personal-boxes-add-more'
    });
    this.initGrid = function(ev, data){
      // remove any previous cache
      localStorage.setItem("sortableOrder", "");
      var that = this;
      var container = document.getElementById(that.attr.gridID);
      var sort = Sortable.create(container, {
        animation: 250,
        dataIdAttr: 'data-id',
        handle: that.attr.dragHandle,
        onStart: function(evt){
          that.trigger(document, 'personal.grid.position.started', {
            index: evt.oldIndex
          });
        },
        onEnd: function(evt){
          that.trigger(document, 'personal.grid.position.finished', {
            old: evt.oldIndex,
            current: evt.newIndex
          });
        },
        onMove: function(evt){
          that.trigger(document, 'personal.grid.position.move', {
            dragged: evt.dragged,
            draggedRect: evt.dragged,
            related: evt.related,
            relatedRect: evt.relatedRect,
          });
        },
        store: {
          get: function (sortable) {
            var order = localStorage.getItem("sortableOrder");
            return order ? order.split('|') : [];
          },
          set: function (sortable) {
            var order = sortable.toArray();
            localStorage.setItem("sortableOrder", order.join('|'));
            that.trigger(document, 'personal.grid.order.changed', {
              order: order
            });
          }
        }
      });
    }
    this.decideForMore = function(ev, data){
      var size = _.size(localStorage.getItem('boxes').split(','));
      console.log('Size', size);
      if (size >= this.attr.max){
        $(this.select('addBoxSelector')).hide();
      }else{
        $(this.select('addBoxSelector')).show();
      }
    }
    this.addMore = function(ev, data){
      this.trigger(document, 'personal.ui.boxes.add');
    }
    this.disableMore = function(ev, data){
      $(this.select('addBoxSelector')).hide();
    }
    this.after('initialize', function () {
      this.on(document, 'personal.ui.boxes.rendered', this.initGrid);
      this.on(document, 'personal.ui.box.add', this.disableMore);
      // Grid
      this.on(document, 'personal.ui.box.added', this.decideForMore);
      this.on(document, 'personal.ui.box.delete', this.decideForMore);
      this.on(document, 'click', {
        'addBoxSelector': this.addMore
      });
    });
  }
});
