# JavaScript Messaging Service Client

<a href="https://www.npmjs.com/package/jsms-client"><img alt="npm Version" src="https://img.shields.io/npm/v/jsms-client.svg"></a>
<a href="https://travis-ci.org/rfruesmer/jsms-client"><img alt="Build Status" src="https://travis-ci.org/rfruesmer/jsms-client.svg?branch=master"></a>
<a href="https://codecov.io/gh/rfruesmer/jsms-client"><img alt="Coverage Status" src="https://codecov.io/gh/rfruesmer/jsms-client/master.svg"></a>

A lightweight implementation of a messaging client framework for JavaScript/TypeScript - inspired by the Java™ Message Service API.

## Introduction

The purpose of this module is to act as an extensible platform for adding providers for different protocols into an integrated solution - it's not intended to be a complete, full-fledged message service implementation (!)

The original use case for this project was the need to combine two partly redundant messaging solutions - one being a mediator and the other being an embedded Chromium browser - into one centralized messaging service.

It can be used right out of the box in terms of an in-process mediator/event bus, but for using protocols/transports like for example STOMP over WebSocket, you have to integrate your own or other (3rd party) communication implementations by creating a custom JSMS connection class.

## Major differences compared to JMS

- JSMS is built client-first, therefore the name jsms-*client*. Although it might be run on a server as well e. g. as a Node.js application, it doesn't come with  any concrete server-side messaging implementations
  
- JSMS is not - and most probably never will be - a fully compliant implementation of the Java Message Service API specs, since JSMS targets a simplified and more lightweight approach
  
- There is no Session object - it's concept was flattened into the Connection object where appropriate
  
- JSMS doesn't target any threading/worker model (at least not for now), therefore all receive functions are asynchronous by nature using ECMAScript 2015 promises
  
- Replying to a message is facilitated by using a promise's resolve callback - no need for temporary queues or similar

## Models

The JSMS API supports both models:

- Point-to-point
- Publish/Subscribe

## Usage

Coming soon ... please refer to the JSDoc comments and tests for now.

## Contribution

Please keep in mind that this project is still in alpha state, but if you find something important missing or not working right in your use case, don't hesitate and feel free to open an issue or to send me a pull request.
