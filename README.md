# JavaScript Message Service

<a href="https://www.npmjs.com/package/jsms"><img alt="npm Version" src="https://img.shields.io/npm/v/jsms.svg"></a>
<a href="https://travis-ci.org/rfruesmer/jsms"><img alt="Build Status" src="https://travis-ci.org/rfruesmer/jsms.svg?branch=master"></a>
<a href="https://codecov.io/gh/rfruesmer/jsms"><img alt="Coverage Status" src="https://codecov.io/gh/rfruesmer/jsms/master.svg"></a>

A lightweight implementation of a messaging framework for JavaScript/TypeScript - inspired by the Java™ Message Service API.

## Introduction

The purpose of this module is to act as an extensible platform for adding providers for different protocols into an integrated solution and therefore can be used to build clients, servers and even message brokers using a consistent API - it's not intended to be a complete, full-fledged message service implementation (!). 

The original use case for this project was the need to combine two partly redundant messaging solutions - one being a mediator and the other being an embedded Chromium browser - into one centralized messaging service.

It can be used right out of the box in terms of an in-process mediator/event bus, but for using protocols/transports like STOMP over WebSocket, you have to integrate your own or other (3rd-party) communication implementations by creating a derived connection class - see the HTTP-based sample implementation inside the examples folder for a starting point.

## Major differences compared to JMS

- jsms is built client-first, but can be run on a server as well - e. g. as a Node.js application - it just doesn't come with any concrete server-side messaging implementations built-in, like other *MQ implementations do
  
- jsms is not - and most probably never will be - a fully compliant implementation of the Java Message Service API specs, since jsms targets a simplified and more lightweight approach
  
- There is no Session object - it's concept was flattened into the Connection object where appropriate
  
- jsms doesn't target any threading/worker model (at least not for now), therefore all receive functions are asynchronous by nature using ECMAScript promises
  
- Replying to a message is facilitated by using a simple return statement - no need for temporary queues or similar

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

For help with integrating jsms into your project, please refer the bare-bones examples in the following repos:

- [jsms-web-example](https://github.com/rfruesmer/jsms-web-example)

- [jsms-node-example](https://github.com/rfruesmer/jsms-node-example)

## Getting Started / Basic Usage

### Point-to-Point Messaging

```js
const messageService = new JsmsService();

messageService.send("/some/queue", {abc: "xyz"}) // can be any arbitrary object literal
    .then(response => {
        console.log(response.body); // expected output: {xyz: "abc"}
    });

messageService.receive("/some/queue")
    .then(message => {
        console.log(message.body); // expected output: {abc: "xyz"}
        return {xyz: "abc"}; // can be any arbitrary object literal
    });
```

### Publish/Subscribe

```js
const messageService = new JsmsService();

messageService.subscribe("/some/topic", message => {
    console.log(message.body); // expected output: {xyz: "abc"}
});

messageService.publish("/some/topic", {xyz: "abc"});  // can be any arbitrary object literal

```

### Intercepted Chaining of Deferreds

JsmsService intercepts chained thens for sends/receives to provide a more logical flow. This shouldn't encourage anybody to create fine-grained chatty interfaces, but might be useful sometimes and definitely is something notable since it differs from the expected default promise behavior:

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

For further information, please refer to the JSDoc comments, annotated tests and the examples folder.

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