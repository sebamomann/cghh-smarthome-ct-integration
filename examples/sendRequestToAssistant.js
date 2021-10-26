'use strict';

const path = require('path');
const GoogleAssistant = require('../assistant');

const config = {
  auth: {
    keyFilePath: path.resolve(__dirname, '../secrets.json'),
    savedTokensPath: path.resolve(__dirname, '../tokens.json'), // where you want the tokens to be saved
  },
  conversation: {
    lang: 'en-US', // defaults to en-US, but try other ones, it's fun!
    showDebugInfo: false, // default is false, bug good for testing AoG things
  },
};


const sendRequest = (request) => {
  const initializeRequest = () => {
    config.conversation.textQuery = request;
    assistant.start(config.conversation, executeRequest);
  };

  const executeRequest = (conversation) => {
    conversation
      .on('response', text => {
        //
      })
      .on('debug-info', info => {
        //
      })
      .on('volume-percent', percent => {
        //
      })
      .on('device-action', action => {
        //
      })
      .on('ended', (error, continueConversation) => {
        if (error) {
          console.log('Conversation Ended Error:', error);
          conversation.end();
        } else {
          conversation.end();
        }
      })
      .on('error', (error) => {
        console.log('Conversation Error:', error);
        conversation.end();
      });
  };

  const assistant = new GoogleAssistant(config.auth);
  assistant
    .on('ready', initializeRequest)
    .on('error', (error) => {
      console.log('Assistant Error:', error);
    });
};

module.exports = { sendRequest };
