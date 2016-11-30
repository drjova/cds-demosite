function cdsDepositCtrl(
  $scope, $q, $timeout, depositStates, depositStatuses, cdsAPI
) {
  var that = this;
  // The Upload Queue
  this.filesQueue = [];
  // The deposit progress
  this.progress = 0;
  // The deposit loading
  this.loading = false;
  // Is ready to publish?
  this.isReadyForPublish = false;

  // Auto data update timeout
  this.autoUpdateTimeout = null;
  // Checkout
  this.lastUpdated = new Date();

  // Event Listener (only for destroy)
  this.sseEventListener = null;

  this.$onDestroy = function() {
    try {
      // Destroy listener
      that.sseEventListener();
      $timout.cancel(that.autoUpdateTimeout);
    } catch(error) {
      // Ok probably already done
    }
  }

  // The deposit can have the follwoing depositStates
  this.$onInit = function() {
    // Resolve the record schema
    this.cdsDepositsCtrl.JSONResolver(this.schema)
    .then(function(response) {
      that.schema = response.data;
    });

    this.autoRefresh = function() {
        that.autoUpdateTimeout = $timeout(angular.noop, 20000);
          that.autoUpdateTimeout
            .then(function() {
              cdsAPI.action(
                that.links.self,
                'GET',
                {}
              ).then(
                function successUpdate(response) {
                    that.record._files = angular.merge(
                      [],
                      that.record._files,
                      response.data.metadata._files
                    );
                    that.record._deposit.state = angular.merge(
                      {},
                      that.record._deposit.state,
                      response.data.metadata._deposit.state || {}
                    );
                    that.lastUpdated = new Date();
                  // Re re run
                  that.autoRefresh();
                },
                function errorUpdate(response) {
                  // Something wrong happend don't run again
                }
              ).finally(function afterUpdate() {
                // Just set loading to false
              });
            });
    };
    // Here we go
    that.autoRefresh();

    this.stateOrder = depositStates;
    this.stateCurrent = {};
    this.stateReporter = {};

    depositStates.map(function(state) {
      that.stateReporter[state] = {
        status: state,
        message: 'Please wait, waiting instructions from the server.',
        payload: {
          percentage: 0
        }
      };
    });

    // Set the deposit State as PENDING
    this.depositStatusCurrent = depositStatuses.PENDING;

    this.stateQueue = {
      PENDING: [],
      STARTED: [],
      FAILURE: [],
      SUCCESS: [],
    };

    if (this.record._deposit.state) {
      angular.forEach(this.record._deposit.state, function(value, key) {
        that.stateQueue[value].push(key);
      });
    } else {
      that.stateQueue.PENDING = depositStates;
    }

    // Register related events from sse
    var depositListenerName = 'sse.event.' + this.record._deposit.id;
    this.sseEventListener = $scope.$on(
      depositListenerName,
      function(evt, type, data) {
      $scope.$apply(function() {
        // Handle my state
        if (that.stateQueue[data.state].indexOf(type) === -1) {
          console.log('CHANGE', data.state, type);
          var index = that.stateQueue.PENDING.indexOf(type);
          if (index > -1) {
            that.stateQueue.PENDING.splice(index, 1);
          }
          switch(data.state) {
            case 'STARTED':
              that.stateQueue.STARTED.push(type);
              break;
            case 'FAILURE':
              that.stateQueue.STARTED = _.without(that.stateQueue.STARTED, type);
              that.stateQueue.FAILURE.push(type);
              // On error remove it from the status order
              that.stateOrder = _.without(that.stateOrder, type);
              break;
            case 'SUCCESS':
              that.stateQueue.STARTED = _.without(that.stateQueue.STARTED, type);
              that.stateQueue.SUCCESS.push(type);
              // On success remove it from the status order
              that.stateOrder = _.without(that.stateOrder, type);
              break;
          }
          // The state has been changed update the current
          that.stateCurrent = that.stateOrder[0];
        }
        // Update the metadata
        that.stateReporter[type] = data.meta;
      });

      if (data.meta.payload.key && type === 'file_download') {
        $scope.$broadcast(
          depositListenerName + '.' + data.meta.payload.key,
          type,
          data
        );
      }
    });

    this.postSuccessProcess = function(responses) {
      // Get only the latest response (in case of multiple actions)
      var response = (responses[responses.length - 1] || responses).data;
      // Update record
      if (this.updateRecordAfterSuccess) {
        this.record = angular.merge({}, this.record, response.metadata);
      }
      // Update links
      if (this.updateLinksAfterSuccess) {
        this.links = response.links;
      }
    };

    this.postErrorProcess = function(response) {
      // Process validation errors if any
      if (response.data.status === 400 && response.data.errors) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        promise.then(function displayValidationErrors() {
          angular.forEach(response.data.errors, function(value) {
            $scope.$broadcast('cds.deposit.validation.error', value);
          });
        });
        deferred.resolve();
      }
    }
  }

  this.guessEndpoint = function(endpoint) {
    if (Object.keys(that.links).indexOf(endpoint) > -1) {
      return that.links[endpoint];
    }
    return endpoint;
  };

  // Do a single action at once
  this.makeSingleAction = function(endpoint, method, redirect) {
    // Guess the endpoint
    var url = this.guessEndpoint(endpoint);
    return this.cdsDepositsCtrl
      .makeAction(url, method, cdsAPI.cleanData(that.record));
  }

  // Do multiple actions at once
  this.makeMultipleActions = function(actions, redirect) {
    var promises = [];
    var cleanRecord = cdsAPI.cleanData(that.record);
    angular.forEach(actions, function(action, index) {
      var url = that.guessEndpoint(action[0]);
      this.push(function() {
        return that.cdsDepositsCtrl.makeAction(url, action[1], cleanRecord);
      });
    }, promises);
    return that.cdsDepositsCtrl.chainedActions(promises);
  }

  this.onSuccessAction = function(response) {
    // Post success process
    that.postSuccessProcess(response);
    // Inform the parents
    $scope.$emit('cds.deposit.success', response);
    // Make the form pristine again
    that.depositFormModel.$setPristine();
  }

  this.onErrorAction = function(response) {
    // Post error process
    that.postErrorProcess(response);
    // Inform the parents
    $scope.$emit('cds.deposit.error', response);
  }
}

cdsDepositCtrl.$inject = [
  '$scope', '$q', '$timeout', 'depositStates', 'depositStatuses', 'cdsAPI'
];

function cdsDeposit() {
  return {
    transclude: true,
    bindings: {
      index: '=',
      master: '@',
      // Interface related
      updateRecordAfterSuccess: '@',
      // Deposit related
      schema: '@',
      record: '=',
      links: '=',
      // The form model
      depositFormModel: '=?',
    },
    require: {
      cdsDepositsCtrl: '^cdsDeposits'
    },
    controller: cdsDepositCtrl,
    template: "<div ng-transclude></div>"
  };
}

angular.module('cdsDeposit.components')
  .component('cdsDeposit', cdsDeposit());
