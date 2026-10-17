// Tables with more than two seats: the multi-seat hand and the single-table sit-and-go.
//   require('poker-core/table')
'use strict';

module.exports = {
  ...require('./multiwayHand'),
  ...require('./sitAndGo'),
};
