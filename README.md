# JavaScript Messaging Client

<a href="https://www.npmjs.com/package/jsms"><img alt="npm Version" src="https://img.shields.io/npm/v/jsms.svg"></a>
<a href="https://travis-ci.org/rfruesmer/jsms"><img alt="Build Status" src="https://travis-ci.org/rfruesmer/jsms.svg?branch=master"></a>
<a href="https://codecov.io/gh/rfruesmer/jsms"><img alt="Coverage Status" src="https://codecov.io/gh/rfruesmer/jsms/master.svg"></a>

A lightweight implementation of a messaging client framework (inspired by the Java™ Message Service API).

**DISCLAIMER / IMPORTANT NOTICE**:

The purpose of this module is to act as an extensible platform for adding providers for different protocols into an integrated solution - it's not intended to be a complete, full-fledged message service implementation (!)

It can be used right out of the box in terms of an in-process mediator/event bus, but for using protocols/transports like for example STOMP over WebSocket, you usually will have to integrate other (3rd party) communication implementations by creating a custom connection class.




