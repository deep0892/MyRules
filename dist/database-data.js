'use strict'

require('colors')

/**
 * mock api client for retrieving account information
 */
module.exports = {
  getCurrentData: (accountId, current_response) => {
    return new Promise((resolve, reject) => {
      setImmediate(() => {
        resolve(current_response[accountId]);
      });
    });
  }
};