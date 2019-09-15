# JavaScript Message Service

<a href="https://www.npmjs.com/package/jsms-client"><img alt="npm Version" src="https://img.shields.io/npm/v/jsms-client.svg"></a>
<a href="https://travis-ci.org/rfruesmer/jsms-client"><img alt="Build Status" src="https://travis-ci.org/rfruesmer/jsms-client.svg?branch=master"></a>
<a href="https://codecov.io/gh/rfruesmer/jsms-client"><img alt="Coverage Status" src="https://codecov.io/gh/rfruesmer/jsms-client/master.svg"></a>

A lightweight implementation of a messaging framework for JavaScript/TypeScript - inspired by the Java™ Message Service API.

## Introduction

The purpose of this module is to act as an extensible platform for adding providers for different protocols into an integrated solution - it's not intended to be a complete, full-fledged message service implementation (!)

The original use case for this project was the need to combine two partly redundant messaging solutions - one being a mediator and the other being an embedded Chromium browser - into one centralized messaging service.

It can be used right out of the box in terms of an in-process mediator/event bus, but for using protocols/transports like STOMP over WebSocket for example, you have to integrate your own or other (3rd-party) communication implementations by creating a custom JSMS connection class (see below).

## Major differences compared to JMS

- JSMS is built client-first, but can be run on a server as well - e. g. as a Node.js application - it just doesn't come with any concrete server-side messaging implementations built-in, like other *MQ implementations do
  
- JSMS is not - and most probably never will be - a fully compliant implementation of the Java Message Service API specs, since JSMS targets a simplified and more lightweight approach
  
- There is no Session object - it's concept was flattened into the Connection object where appropriate
  
- JSMS doesn't target any threading/worker model (at least not for now), therefore all receive functions are asynchronous by nature using ECMAScript promises
  
- Replying to a message is facilitated by using a simple return statement - no need for temporary queues or similar

## Compatibility

It should be working fine in recent versions of Node.js and ES6-compatible browsers.

## Models

The JSMS API supports both models:

- Point-to-point
- Publish/Subscribe

## Usage

Coming soon ... please refer to the JSDoc comments and the annotated tests for now.

### Logging

JSMS makes use of [log4js-api](https://www.npmjs.com/package/@log4js-node/log4js-api), so you should be able to attach any log4js compliant framework, like [log4js-node](https://www.npmjs.com/package/log4js) for node-base applications or the default [log4js](https://github.com/stritti/log4js) when working in a browser environment.

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