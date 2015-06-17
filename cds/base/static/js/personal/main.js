define(function (require) {

  'use strict';

  /**
   * Module dependencies
   */

  var Grid = require('js/personal/component/grid');
  var Boxes = require('js/personal/component/boxes');
  var Box = require('js/personal/ui/box');
  /**
   * Module exports
   */

  return initialize;

  /**
   * Module function
   */

  function initialize() {
    Grid.attachTo('#grid');
    Boxes.attachTo(document);
    Box.attachTo('.personal-boxes');
  }

});
