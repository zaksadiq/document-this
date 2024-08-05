const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');

console.log('Running Document-This');

const AUTH_TOKEN = process.env.SLACK_TOKEN;
const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET;
// Create a new instance of the webClient class with the token read from your environment variable
const web = new WebClient(process.env.SLACK_TOKEN);
// Init events api
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
// Read port from environment variables ; fallback to 3000 default
const port = process.env.PORT || 3000;

// Event Listeners
//
// handle errors from any of the event listeners
slackEvents.on('error', error => {
  console.log(error.name);
});
slackEvents.on('message', event => {
  console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
});
slackEvents.on('reaction_added', event => {
  console.log(`Rection added: ${event.reaction}. Message ${event.item.ts} in ${event.item.channel}`);
  if (event.reaction == 'document-this') {
    console.log('request to document');
    getThreadURL(event.item.channel, event.item.ts)
    .then( url => {
      postMessage(`got thread url!  ${url}`);
    });
    
    // getMessage(event.item.channel, event.item.ts);
  }
});

async function getThreadURL(channelID, timestamp) {
  try {
    console.log("! getting thread to document");
    const response = await web.chat.getPermalink({
      channel: channelID,
      message_ts: timestamp,
    })
    .then( res => {
      console.log('success:');
      console.log(res.permalink);
      return res.permalink; 
    })
    .catch( err => {
      console.log('fail:');
      console.error(err);
    });
    return response;
  } catch (error) {
    console.log(error);
  }
}


async function getThread(channelID, timestamp) {
  try {
    console.log("! getting thread to document");
    const response = await web.conversations.history({
      channel: channelID,
      ts: timestamp,
    })
    .then( res => {
      console.log('success:');
      console.log(res.messages[0].text);
      return res.messages[0].text; 
    })
    .catch( err => {
      console.log('fail:');
      console.error(JSON.parse(err));
    });

  } catch (error) {
    console.log(error);
  }
}

async function getMessage(channelID, timestamp) {
  try {
    console.log("! getting message to document");
    const response = await web.conversations.history({
      channel: channelID,
      latest: timestamp,
      limit: 1,
      inclusive: 1
    })
    .then( res => {
      console.log('success:');
      console.log(res.messages[0].text);
    })
    .catch( err => {
      console.log('fail:');
      console.error(JSON.parse(err));
    });

  } catch (error) {
    console.log(error);
  }
}

async function postMessage(messageText) {
  try {
    // Use the `chat.postMessage` method to send a message from this app
    console.log('attempting to post message..');
    await web.chat.postMessage({
      channel: '#document-this',
      text: messageText,
    });
  } catch (error) {
    console.log(error);
  }
}

// Asynchronous IIFE
(async () => {
  // Start the event listener server
  const server = await slackEvents.start(port);
  console.log(`Listening for events on ${server.address().port}`);

  try {
    // Use the `chat.postMessage` method to send a message from this app
    console.log('attempting to post message..');
    await web.chat.postMessage({
      channel: '#document-this',
      text: `Document This service started running.`,
    });
  } catch (error) {
    console.log(error);
  }

  console.log('Message posted');
})();
//  