

# JavaScript Message Service

<a href="https://www.npmjs.com/package/jsms"><img alt="npm Version" src="https://img.shields.io/npm/v/jsms.svg"></a>
<a href="https://travis-ci.org/rfruesmer/jsms"><img alt="Build Status" src="https://travis-ci.org/rfruesmer/jsms.svg?branch=master"></a>
<a href="https://codecov.io/gh/rfruesmer/jsms"><img alt="Coverage Status" src="https://codecov.io/gh/rfruesmer/jsms/master.svg"></a>

A lightweight implementation of a messaging framework for JavaScript/TypeScript - inspired by the Java™ Message Service API.


## Contents

- [Introduction](#introduction)
  - [Overview of jsms](#overview-of-jsms)
  - [What jsms does not include](#what-jsms-does-not-include)
- [Messages](#messages)
- [Message header fields](#message-header-fields)
- [Messaging domains](#messaging-domains)
  - [Point-to-point model](#point-to-point-model)
  - [Publish/subscribe model](#publishsubscribe-model)
- [Compatibility](#compatibility)
- [Installation](#installation)
- [Examples (using the simplified API)](#examples-using-the-simplified-api)
  - [Point-to-Point Messaging](#point-to-point-messaging)
    - [Chaining](#chaining)
  - [Publish/Subscribe](#publishsubscribe)
- [Contribution](#contribution)
- [Credits](#credits)
- [License](#license)

## Introduction

### Overview of jsms

jsms provides a common way for JavaScript programs to create, send and receive messages. It defines some messaging semantics and a corresponding set of JavaScript classes to build clients, servers and even message brokers using a single, unified message API. It was initially developed to eliminate boilerplate code by combining two partly redundant messaging solutions into one.

It can be used right out of the box in terms of an in-process mediator/event bus, but for connecting to a JMS broker or for using protocols/transports like for example STOMP over WebSocket, you can do so by supplying a custom connection class that integrates your own or other (3rd-party) communication implementations - see the simple HTTP-based sample implementation inside the examples folder for a starting point.

### What jsms does not include

- Specific communication protocols 

- A complete implementation of the Java™ Message Service API specs, since jsms targets a simplified and more lightweight approach

- A threading/worker model (at least not for now) - therefore all send/receive functions are asynchronous by nature (using promises)

## Messages

jsms messages are composed of the following parts:

- Header - contains values used by both clients and providers to identify and route   
  
- Body - jsms defines only one type being any custom object literal

## Message header fields

<table>
    <tr>
        <td>id</td>
        <td>the id header field contains a value that uniquely identifies each message (uuid)</td>
    </tr>
    <tr>
        <td>destination</td>
        <td>the topic or queue name</td>
    </tr>
    <tr>
        <td>expiration</td>
        <td>the time in milliseconds when this message will expire or zero if the message shouldn't expire</td>
    </tr>
    <tr>
        <td>correlationID</td>
        <td>used for matching replies/responses to original message</td>
    </tr>
</table>

## Messaging domains

jsms supports both major styles of messaging Point-to-point (PTP) and Publish and subscribe (pub/sub).

### Point-to-point model

Use PTP messaging when every message you send must be processed successfully by one consumer:

- Each queue/message has only one consumer.

- A sender and a receiver of a message have no timing dependencies. The receiver can fetch the message whether or not it was running when the client sent the message.

- Queues retain all (up to maxSize) messages sent to them until the messages are consumed, the message expires or the queue is closed - messages aren't persisted.

An application may send messages to a queue by using a connection's QueueSender object. Messages can be consumed from a queue by using a connection's QueueReceiver object.

The JsmsService facade class provides a simplified API for both send and receive operations.

### Publish/subscribe model

Topics take care of distributing the messages arriving from multiple publishers to its multiple subscribers:

- Topics retain messages only as long as it takes to distribute them to current subscribers.

- Each message may have multiple consumers.

- Publishers and subscribers have a timing dependency. A client that subscribes to a topic can consume only messages published after the client has created a subscription.

An application may send messages to a topic by using a connection's TopicPublisher object. Messages can be consumed from a topic by using a connection's TopicSubscriber object.

The JsmsService facade class provides a simplified API for both publish and subscribe operations.

## Compatibility

<table>
    <tr>
        <td>Node.js</td>
        <td>10.x or later (using CommonJS module format)</td>
    </tr>
    <tr>
        <td>Browsers</td>
        <td>any ES6-compatible, tested with Chrome 76 and Firefox 68</td>
    </tr>
</table>

## Installation

In your project root:

```
$ npm install jsms
```

To enable logging, you have to include a log4js compliant framework like [log4js-node](https://www.npmjs.com/package/log4js) - if no version of log4js can be found, then jsms simply does not output anything.

**Important note for webpack users**: if you don't use log4js, it must be excluded via [module.noParse](https://webpack.js.org/configuration/module/#modulenoparse), otherwise you will run into an unresolved module dependency error.

For help with integrating jsms into your project, please refer to the bare-bones examples in the following repos:

- [jsms-web-example](https://github.com/rfruesmer/jsms-web-example)

- [jsms-node-example](https://github.com/rfruesmer/jsms-node-example)


## Examples (using the simplified API)

These are just a few simple examples to give you a quickstart. For further information, please refer to the JSDoc comments, annotated tests and the examples folder.

### Point-to-Point Messaging

```js
const messageService = new JsmsService();

messageService.send("/some/queue", {abc: "xyz"})
    .then(response => {
        console.log(response.body); // expected output: {xyz: "abc"}
    });

messageService.receive("/some/queue")
    .then(message => {
        console.log(message.body); // expected output: {abc: "xyz"}
        return {xyz: "abc"};
    });
```

#### Chaining

JsmsService intercepts chained thens for point-to-point sends/receives to provide a more logical flow. This shouldn't encourage anybody to create fine-grained chatty interfaces, but might be useful sometimes and definitely is something notable since it differs from the expected promise default behavior:

```js
const messageService = new JsmsService();

messageService.send(queueName, {request: "PING1"})
    .then(response => {
        console.log(request); // expected output: {request: "PONG1"}
        return {request: "PING2"};
    })
    .then(response => {
        console.log(request); // expected output: {request: "PONG2"}
    });

messageService.receive(queueName)
    .then(request => {
        console.log(request); // expected output: {request: "PING1"}
        return {response: "PONG1"};
    })
    .then(request => {
        console.log(request); // expected output: {request: "PING2"}
        return {response: "PONG2"};
    });
```

### Publish/Subscribe

```js
const messageService = new JsmsService();

messageService.subscribe("/some/topic", message => {
    console.log(message.body); // expected output: {xyz: "abc"}
});

messageService.publish("/some/topic", {xyz: "abc"});
```

## Contribution

Please keep in mind that this project is still in alpha state, but if you find something important missing or not working right in your use case, don't hesitate and feel free to open an issue or to send me a pull request.

## Credits

<table align="center">
    <tr>
        <td>@log4js-node/log4js-api</td>
        <td align="right">
            <a href="https://www.npmjs.com/package/@log4js-node/log4js-api">homepage</a>
            &nbsp;-&nbsp;  
            <a href="https://github.com/log4js-node/log4js-api/blob/master/LICENSE">show license</a>
        </td>
    </tr>
    <tr>
        <td>uuid </td>
        <td align="right">
            <a href="https://www.npmjs.com/package/uuid">homepage</a>
            &nbsp;-&nbsp;  
            <a href="https://github.com/kelektiv/node-uuid/blob/master/LICENSE.md">show license</a>
        </td>
    </tr>
</table>

## License

MIT
