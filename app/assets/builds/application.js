var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name3 in all)
    __defProp(target, name3, { get: all[name3], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/adapters.js
var adapters_default;
var init_adapters = __esm({
  "node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/adapters.js"() {
    adapters_default = {
      logger: typeof console !== "undefined" ? console : void 0,
      WebSocket: typeof WebSocket !== "undefined" ? WebSocket : void 0
    };
  }
});

// node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/logger.js
var logger_default;
var init_logger = __esm({
  "node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/logger.js"() {
    init_adapters();
    logger_default = {
      log(...messages) {
        if (this.enabled) {
          messages.push(Date.now());
          adapters_default.logger.log("[ActionCable]", ...messages);
        }
      }
    };
  }
});

// node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/connection_monitor.js
var now, secondsSince, ConnectionMonitor, connection_monitor_default;
var init_connection_monitor = __esm({
  "node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/connection_monitor.js"() {
    init_logger();
    now = () => (/* @__PURE__ */ new Date()).getTime();
    secondsSince = (time) => (now() - time) / 1e3;
    ConnectionMonitor = class {
      constructor(connection) {
        this.visibilityDidChange = this.visibilityDidChange.bind(this);
        this.connection = connection;
        this.reconnectAttempts = 0;
      }
      start() {
        if (!this.isRunning()) {
          this.startedAt = now();
          delete this.stoppedAt;
          this.startPolling();
          addEventListener("visibilitychange", this.visibilityDidChange);
          logger_default.log(`ConnectionMonitor started. stale threshold = ${this.constructor.staleThreshold} s`);
        }
      }
      stop() {
        if (this.isRunning()) {
          this.stoppedAt = now();
          this.stopPolling();
          removeEventListener("visibilitychange", this.visibilityDidChange);
          logger_default.log("ConnectionMonitor stopped");
        }
      }
      isRunning() {
        return this.startedAt && !this.stoppedAt;
      }
      recordMessage() {
        this.pingedAt = now();
      }
      recordConnect() {
        this.reconnectAttempts = 0;
        delete this.disconnectedAt;
        logger_default.log("ConnectionMonitor recorded connect");
      }
      recordDisconnect() {
        this.disconnectedAt = now();
        logger_default.log("ConnectionMonitor recorded disconnect");
      }
      // Private
      startPolling() {
        this.stopPolling();
        this.poll();
      }
      stopPolling() {
        clearTimeout(this.pollTimeout);
      }
      poll() {
        this.pollTimeout = setTimeout(
          () => {
            this.reconnectIfStale();
            this.poll();
          },
          this.getPollInterval()
        );
      }
      getPollInterval() {
        const { staleThreshold, reconnectionBackoffRate } = this.constructor;
        const backoff = Math.pow(1 + reconnectionBackoffRate, Math.min(this.reconnectAttempts, 10));
        const jitterMax = this.reconnectAttempts === 0 ? 1 : reconnectionBackoffRate;
        const jitter = jitterMax * Math.random();
        return staleThreshold * 1e3 * backoff * (1 + jitter);
      }
      reconnectIfStale() {
        if (this.connectionIsStale()) {
          logger_default.log(`ConnectionMonitor detected stale connection. reconnectAttempts = ${this.reconnectAttempts}, time stale = ${secondsSince(this.refreshedAt)} s, stale threshold = ${this.constructor.staleThreshold} s`);
          this.reconnectAttempts++;
          if (this.disconnectedRecently()) {
            logger_default.log(`ConnectionMonitor skipping reopening recent disconnect. time disconnected = ${secondsSince(this.disconnectedAt)} s`);
          } else {
            logger_default.log("ConnectionMonitor reopening");
            this.connection.reopen();
          }
        }
      }
      get refreshedAt() {
        return this.pingedAt ? this.pingedAt : this.startedAt;
      }
      connectionIsStale() {
        return secondsSince(this.refreshedAt) > this.constructor.staleThreshold;
      }
      disconnectedRecently() {
        return this.disconnectedAt && secondsSince(this.disconnectedAt) < this.constructor.staleThreshold;
      }
      visibilityDidChange() {
        if (document.visibilityState === "visible") {
          setTimeout(
            () => {
              if (this.connectionIsStale() || !this.connection.isOpen()) {
                logger_default.log(`ConnectionMonitor reopening stale connection on visibilitychange. visibilityState = ${document.visibilityState}`);
                this.connection.reopen();
              }
            },
            200
          );
        }
      }
    };
    ConnectionMonitor.staleThreshold = 6;
    ConnectionMonitor.reconnectionBackoffRate = 0.15;
    connection_monitor_default = ConnectionMonitor;
  }
});

// node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/internal.js
var internal_default;
var init_internal = __esm({
  "node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/internal.js"() {
    internal_default = {
      "message_types": {
        "welcome": "welcome",
        "disconnect": "disconnect",
        "ping": "ping",
        "confirmation": "confirm_subscription",
        "rejection": "reject_subscription"
      },
      "disconnect_reasons": {
        "unauthorized": "unauthorized",
        "invalid_request": "invalid_request",
        "server_restart": "server_restart",
        "remote": "remote"
      },
      "default_mount_path": "/cable",
      "protocols": [
        "actioncable-v1-json",
        "actioncable-unsupported"
      ]
    };
  }
});

// node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/connection.js
var message_types, protocols, supportedProtocols, indexOf, Connection, connection_default;
var init_connection = __esm({
  "node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/connection.js"() {
    init_adapters();
    init_connection_monitor();
    init_internal();
    init_logger();
    ({ message_types, protocols } = internal_default);
    supportedProtocols = protocols.slice(0, protocols.length - 1);
    indexOf = [].indexOf;
    Connection = class {
      constructor(consumer4) {
        this.open = this.open.bind(this);
        this.consumer = consumer4;
        this.subscriptions = this.consumer.subscriptions;
        this.monitor = new connection_monitor_default(this);
        this.disconnected = true;
      }
      send(data) {
        if (this.isOpen()) {
          this.webSocket.send(JSON.stringify(data));
          return true;
        } else {
          return false;
        }
      }
      open() {
        if (this.isActive()) {
          logger_default.log(`Attempted to open WebSocket, but existing socket is ${this.getState()}`);
          return false;
        } else {
          const socketProtocols = [...protocols, ...this.consumer.subprotocols || []];
          logger_default.log(`Opening WebSocket, current state is ${this.getState()}, subprotocols: ${socketProtocols}`);
          if (this.webSocket) {
            this.uninstallEventHandlers();
          }
          this.webSocket = new adapters_default.WebSocket(this.consumer.url, socketProtocols);
          this.installEventHandlers();
          this.monitor.start();
          return true;
        }
      }
      close({ allowReconnect } = { allowReconnect: true }) {
        if (!allowReconnect) {
          this.monitor.stop();
        }
        if (this.isOpen()) {
          return this.webSocket.close();
        }
      }
      reopen() {
        logger_default.log(`Reopening WebSocket, current state is ${this.getState()}`);
        if (this.isActive()) {
          try {
            return this.close();
          } catch (error3) {
            logger_default.log("Failed to reopen WebSocket", error3);
          } finally {
            logger_default.log(`Reopening WebSocket in ${this.constructor.reopenDelay}ms`);
            setTimeout(this.open, this.constructor.reopenDelay);
          }
        } else {
          return this.open();
        }
      }
      getProtocol() {
        if (this.webSocket) {
          return this.webSocket.protocol;
        }
      }
      isOpen() {
        return this.isState("open");
      }
      isActive() {
        return this.isState("open", "connecting");
      }
      triedToReconnect() {
        return this.monitor.reconnectAttempts > 0;
      }
      // Private
      isProtocolSupported() {
        return indexOf.call(supportedProtocols, this.getProtocol()) >= 0;
      }
      isState(...states) {
        return indexOf.call(states, this.getState()) >= 0;
      }
      getState() {
        if (this.webSocket) {
          for (let state in adapters_default.WebSocket) {
            if (adapters_default.WebSocket[state] === this.webSocket.readyState) {
              return state.toLowerCase();
            }
          }
        }
        return null;
      }
      installEventHandlers() {
        for (let eventName in this.events) {
          const handler = this.events[eventName].bind(this);
          this.webSocket[`on${eventName}`] = handler;
        }
      }
      uninstallEventHandlers() {
        for (let eventName in this.events) {
          this.webSocket[`on${eventName}`] = function() {
          };
        }
      }
    };
    Connection.reopenDelay = 500;
    Connection.prototype.events = {
      message(event) {
        if (!this.isProtocolSupported()) {
          return;
        }
        const { identifier, message, reason, reconnect, type } = JSON.parse(event.data);
        this.monitor.recordMessage();
        switch (type) {
          case message_types.welcome:
            if (this.triedToReconnect()) {
              this.reconnectAttempted = true;
            }
            this.monitor.recordConnect();
            return this.subscriptions.reload();
          case message_types.disconnect:
            logger_default.log(`Disconnecting. Reason: ${reason}`);
            return this.close({ allowReconnect: reconnect });
          case message_types.ping:
            return null;
          case message_types.confirmation:
            this.subscriptions.confirmSubscription(identifier);
            if (this.reconnectAttempted) {
              this.reconnectAttempted = false;
              return this.subscriptions.notify(identifier, "connected", { reconnected: true });
            } else {
              return this.subscriptions.notify(identifier, "connected", { reconnected: false });
            }
          case message_types.rejection:
            return this.subscriptions.reject(identifier);
          default:
            return this.subscriptions.notify(identifier, "received", message);
        }
      },
      open() {
        logger_default.log(`WebSocket onopen event, using '${this.getProtocol()}' subprotocol`);
        this.disconnected = false;
        if (!this.isProtocolSupported()) {
          logger_default.log("Protocol is unsupported. Stopping monitor and disconnecting.");
          return this.close({ allowReconnect: false });
        }
      },
      close(event) {
        logger_default.log("WebSocket onclose event");
        if (this.disconnected) {
          return;
        }
        this.disconnected = true;
        this.monitor.recordDisconnect();
        return this.subscriptions.notifyAll("disconnected", { willAttemptReconnect: this.monitor.isRunning() });
      },
      error() {
        logger_default.log("WebSocket onerror event");
      }
    };
    connection_default = Connection;
  }
});

// node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/subscription.js
var extend, Subscription;
var init_subscription = __esm({
  "node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/subscription.js"() {
    extend = function(object, properties) {
      if (properties != null) {
        for (let key in properties) {
          const value = properties[key];
          object[key] = value;
        }
      }
      return object;
    };
    Subscription = class {
      constructor(consumer4, params2 = {}, mixin) {
        this.consumer = consumer4;
        this.identifier = JSON.stringify(params2);
        extend(this, mixin);
      }
      // Perform a channel action with the optional data passed as an attribute
      perform(action, data = {}) {
        data.action = action;
        return this.send(data);
      }
      send(data) {
        return this.consumer.send({ command: "message", identifier: this.identifier, data: JSON.stringify(data) });
      }
      unsubscribe() {
        return this.consumer.subscriptions.remove(this);
      }
    };
  }
});

// node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/subscription_guarantor.js
var SubscriptionGuarantor, subscription_guarantor_default;
var init_subscription_guarantor = __esm({
  "node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/subscription_guarantor.js"() {
    init_logger();
    SubscriptionGuarantor = class {
      constructor(subscriptions) {
        this.subscriptions = subscriptions;
        this.pendingSubscriptions = [];
      }
      guarantee(subscription2) {
        if (this.pendingSubscriptions.indexOf(subscription2) == -1) {
          logger_default.log(`SubscriptionGuarantor guaranteeing ${subscription2.identifier}`);
          this.pendingSubscriptions.push(subscription2);
        } else {
          logger_default.log(`SubscriptionGuarantor already guaranteeing ${subscription2.identifier}`);
        }
        this.startGuaranteeing();
      }
      forget(subscription2) {
        logger_default.log(`SubscriptionGuarantor forgetting ${subscription2.identifier}`);
        this.pendingSubscriptions = this.pendingSubscriptions.filter((s) => s !== subscription2);
      }
      startGuaranteeing() {
        this.stopGuaranteeing();
        this.retrySubscribing();
      }
      stopGuaranteeing() {
        clearTimeout(this.retryTimeout);
      }
      retrySubscribing() {
        this.retryTimeout = setTimeout(
          () => {
            if (this.subscriptions && typeof this.subscriptions.subscribe === "function") {
              this.pendingSubscriptions.map((subscription2) => {
                logger_default.log(`SubscriptionGuarantor resubscribing ${subscription2.identifier}`);
                this.subscriptions.subscribe(subscription2);
              });
            }
          },
          500
        );
      }
    };
    subscription_guarantor_default = SubscriptionGuarantor;
  }
});

// node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/subscriptions.js
var Subscriptions;
var init_subscriptions = __esm({
  "node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/subscriptions.js"() {
    init_subscription();
    init_subscription_guarantor();
    init_logger();
    Subscriptions = class {
      constructor(consumer4) {
        this.consumer = consumer4;
        this.guarantor = new subscription_guarantor_default(this);
        this.subscriptions = [];
      }
      create(channelName, mixin) {
        const channel = channelName;
        const params2 = typeof channel === "object" ? channel : { channel };
        const subscription2 = new Subscription(this.consumer, params2, mixin);
        return this.add(subscription2);
      }
      // Private
      add(subscription2) {
        this.subscriptions.push(subscription2);
        this.consumer.ensureActiveConnection();
        this.notify(subscription2, "initialized");
        this.subscribe(subscription2);
        return subscription2;
      }
      remove(subscription2) {
        this.forget(subscription2);
        if (!this.findAll(subscription2.identifier).length) {
          this.sendCommand(subscription2, "unsubscribe");
        }
        return subscription2;
      }
      reject(identifier) {
        return this.findAll(identifier).map((subscription2) => {
          this.forget(subscription2);
          this.notify(subscription2, "rejected");
          return subscription2;
        });
      }
      forget(subscription2) {
        this.guarantor.forget(subscription2);
        this.subscriptions = this.subscriptions.filter((s) => s !== subscription2);
        return subscription2;
      }
      findAll(identifier) {
        return this.subscriptions.filter((s) => s.identifier === identifier);
      }
      reload() {
        return this.subscriptions.map((subscription2) => this.subscribe(subscription2));
      }
      notifyAll(callbackName, ...args) {
        return this.subscriptions.map((subscription2) => this.notify(subscription2, callbackName, ...args));
      }
      notify(subscription2, callbackName, ...args) {
        let subscriptions;
        if (typeof subscription2 === "string") {
          subscriptions = this.findAll(subscription2);
        } else {
          subscriptions = [subscription2];
        }
        return subscriptions.map((subscription3) => typeof subscription3[callbackName] === "function" ? subscription3[callbackName](...args) : void 0);
      }
      subscribe(subscription2) {
        if (this.sendCommand(subscription2, "subscribe")) {
          this.guarantor.guarantee(subscription2);
        }
      }
      confirmSubscription(identifier) {
        logger_default.log(`Subscription confirmed ${identifier}`);
        this.findAll(identifier).map((subscription2) => this.guarantor.forget(subscription2));
      }
      sendCommand(subscription2, command) {
        const { identifier } = subscription2;
        return this.consumer.send({ command, identifier });
      }
    };
  }
});

// node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/consumer.js
function createWebSocketURL(url) {
  if (typeof url === "function") {
    url = url();
  }
  if (url && !/^wss?:/i.test(url)) {
    const a = document.createElement("a");
    a.href = url;
    a.href = a.href;
    a.protocol = a.protocol.replace("http", "ws");
    return a.href;
  } else {
    return url;
  }
}
var Consumer;
var init_consumer = __esm({
  "node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/consumer.js"() {
    init_connection();
    init_subscriptions();
    Consumer = class {
      constructor(url) {
        this._url = url;
        this.subscriptions = new Subscriptions(this);
        this.connection = new connection_default(this);
        this.subprotocols = [];
      }
      get url() {
        return createWebSocketURL(this._url);
      }
      send(data) {
        return this.connection.send(data);
      }
      connect() {
        return this.connection.open();
      }
      disconnect() {
        return this.connection.close({ allowReconnect: false });
      }
      ensureActiveConnection() {
        if (!this.connection.isActive()) {
          return this.connection.open();
        }
      }
      addSubProtocol(subprotocol) {
        this.subprotocols = [...this.subprotocols, subprotocol];
      }
    };
  }
});

// node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/index.js
var src_exports = {};
__export(src_exports, {
  Connection: () => connection_default,
  ConnectionMonitor: () => connection_monitor_default,
  Consumer: () => Consumer,
  INTERNAL: () => internal_default,
  Subscription: () => Subscription,
  SubscriptionGuarantor: () => subscription_guarantor_default,
  Subscriptions: () => Subscriptions,
  adapters: () => adapters_default,
  createConsumer: () => createConsumer,
  createWebSocketURL: () => createWebSocketURL,
  getConfig: () => getConfig,
  logger: () => logger_default
});
function createConsumer(url = getConfig("url") || internal_default.default_mount_path) {
  return new Consumer(url);
}
function getConfig(name3) {
  const element = document.head.querySelector(`meta[name='action-cable-${name3}']`);
  if (element) {
    return element.getAttribute("content");
  }
}
var init_src = __esm({
  "node_modules/@hotwired/turbo-rails/node_modules/@rails/actioncable/src/index.js"() {
    init_connection();
    init_connection_monitor();
    init_consumer();
    init_internal();
    init_subscription();
    init_subscriptions();
    init_subscription_guarantor();
    init_adapters();
    init_logger();
  }
});

// node_modules/cropperjs/dist/cropper.js
var require_cropper = __commonJS({
  "node_modules/cropperjs/dist/cropper.js"(exports, module3) {
    (function(global3, factory) {
      typeof exports === "object" && typeof module3 !== "undefined" ? module3.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global3 = typeof globalThis !== "undefined" ? globalThis : global3 || self, global3.Cropper = factory());
    })(exports, (function() {
      "use strict";
      function ownKeys(e, r) {
        var t = Object.keys(e);
        if (Object.getOwnPropertySymbols) {
          var o = Object.getOwnPropertySymbols(e);
          r && (o = o.filter(function(r2) {
            return Object.getOwnPropertyDescriptor(e, r2).enumerable;
          })), t.push.apply(t, o);
        }
        return t;
      }
      function _objectSpread2(e) {
        for (var r = 1; r < arguments.length; r++) {
          var t = null != arguments[r] ? arguments[r] : {};
          r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
            _defineProperty(e, r2, t[r2]);
          }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
            Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
          });
        }
        return e;
      }
      function _toPrimitive(t, r) {
        if ("object" != typeof t || !t) return t;
        var e = t[Symbol.toPrimitive];
        if (void 0 !== e) {
          var i = e.call(t, r || "default");
          if ("object" != typeof i) return i;
          throw new TypeError("@@toPrimitive must return a primitive value.");
        }
        return ("string" === r ? String : Number)(t);
      }
      function _toPropertyKey(t) {
        var i = _toPrimitive(t, "string");
        return "symbol" == typeof i ? i : i + "";
      }
      function _typeof(o) {
        "@babel/helpers - typeof";
        return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
          return typeof o2;
        } : function(o2) {
          return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
        }, _typeof(o);
      }
      function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
        }
      }
      function _defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
          var descriptor = props[i];
          descriptor.enumerable = descriptor.enumerable || false;
          descriptor.configurable = true;
          if ("value" in descriptor) descriptor.writable = true;
          Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
        }
      }
      function _createClass(Constructor, protoProps, staticProps) {
        if (protoProps) _defineProperties(Constructor.prototype, protoProps);
        if (staticProps) _defineProperties(Constructor, staticProps);
        Object.defineProperty(Constructor, "prototype", {
          writable: false
        });
        return Constructor;
      }
      function _defineProperty(obj, key, value) {
        key = _toPropertyKey(key);
        if (key in obj) {
          Object.defineProperty(obj, key, {
            value,
            enumerable: true,
            configurable: true,
            writable: true
          });
        } else {
          obj[key] = value;
        }
        return obj;
      }
      function _toConsumableArray(arr) {
        return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
      }
      function _arrayWithoutHoles(arr) {
        if (Array.isArray(arr)) return _arrayLikeToArray(arr);
      }
      function _iterableToArray(iter) {
        if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
      }
      function _unsupportedIterableToArray(o, minLen) {
        if (!o) return;
        if (typeof o === "string") return _arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor) n = o.constructor.name;
        if (n === "Map" || n === "Set") return Array.from(o);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
      }
      function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;
        for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
        return arr2;
      }
      function _nonIterableSpread() {
        throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      var IS_BROWSER = typeof window !== "undefined" && typeof window.document !== "undefined";
      var WINDOW = IS_BROWSER ? window : {};
      var IS_TOUCH_DEVICE = IS_BROWSER && WINDOW.document.documentElement ? "ontouchstart" in WINDOW.document.documentElement : false;
      var HAS_POINTER_EVENT = IS_BROWSER ? "PointerEvent" in WINDOW : false;
      var NAMESPACE = "cropper";
      var ACTION_ALL = "all";
      var ACTION_CROP = "crop";
      var ACTION_MOVE = "move";
      var ACTION_ZOOM = "zoom";
      var ACTION_EAST = "e";
      var ACTION_WEST = "w";
      var ACTION_SOUTH = "s";
      var ACTION_NORTH = "n";
      var ACTION_NORTH_EAST = "ne";
      var ACTION_NORTH_WEST = "nw";
      var ACTION_SOUTH_EAST = "se";
      var ACTION_SOUTH_WEST = "sw";
      var CLASS_CROP = "".concat(NAMESPACE, "-crop");
      var CLASS_DISABLED = "".concat(NAMESPACE, "-disabled");
      var CLASS_HIDDEN = "".concat(NAMESPACE, "-hidden");
      var CLASS_HIDE = "".concat(NAMESPACE, "-hide");
      var CLASS_INVISIBLE = "".concat(NAMESPACE, "-invisible");
      var CLASS_MODAL = "".concat(NAMESPACE, "-modal");
      var CLASS_MOVE = "".concat(NAMESPACE, "-move");
      var DATA_ACTION = "".concat(NAMESPACE, "Action");
      var DATA_PREVIEW = "".concat(NAMESPACE, "Preview");
      var DRAG_MODE_CROP = "crop";
      var DRAG_MODE_MOVE = "move";
      var DRAG_MODE_NONE = "none";
      var EVENT_CROP = "crop";
      var EVENT_CROP_END = "cropend";
      var EVENT_CROP_MOVE = "cropmove";
      var EVENT_CROP_START = "cropstart";
      var EVENT_DBLCLICK = "dblclick";
      var EVENT_TOUCH_START = IS_TOUCH_DEVICE ? "touchstart" : "mousedown";
      var EVENT_TOUCH_MOVE = IS_TOUCH_DEVICE ? "touchmove" : "mousemove";
      var EVENT_TOUCH_END = IS_TOUCH_DEVICE ? "touchend touchcancel" : "mouseup";
      var EVENT_POINTER_DOWN = HAS_POINTER_EVENT ? "pointerdown" : EVENT_TOUCH_START;
      var EVENT_POINTER_MOVE = HAS_POINTER_EVENT ? "pointermove" : EVENT_TOUCH_MOVE;
      var EVENT_POINTER_UP = HAS_POINTER_EVENT ? "pointerup pointercancel" : EVENT_TOUCH_END;
      var EVENT_READY = "ready";
      var EVENT_RESIZE = "resize";
      var EVENT_WHEEL = "wheel";
      var EVENT_ZOOM = "zoom";
      var MIME_TYPE_JPEG = "image/jpeg";
      var REGEXP_ACTIONS = /^e|w|s|n|se|sw|ne|nw|all|crop|move|zoom$/;
      var REGEXP_DATA_URL = /^data:/;
      var REGEXP_DATA_URL_JPEG = /^data:image\/jpeg;base64,/;
      var REGEXP_TAG_NAME = /^img|canvas$/i;
      var MIN_CONTAINER_WIDTH = 200;
      var MIN_CONTAINER_HEIGHT = 100;
      var DEFAULTS = {
        // Define the view mode of the cropper
        viewMode: 0,
        // 0, 1, 2, 3
        // Define the dragging mode of the cropper
        dragMode: DRAG_MODE_CROP,
        // 'crop', 'move' or 'none'
        // Define the initial aspect ratio of the crop box
        initialAspectRatio: NaN,
        // Define the aspect ratio of the crop box
        aspectRatio: NaN,
        // An object with the previous cropping result data
        data: null,
        // A selector for adding extra containers to preview
        preview: "",
        // Re-render the cropper when resize the window
        responsive: true,
        // Restore the cropped area after resize the window
        restore: true,
        // Check if the current image is a cross-origin image
        checkCrossOrigin: true,
        // Check the current image's Exif Orientation information
        checkOrientation: true,
        // Show the black modal
        modal: true,
        // Show the dashed lines for guiding
        guides: true,
        // Show the center indicator for guiding
        center: true,
        // Show the white modal to highlight the crop box
        highlight: true,
        // Show the grid background
        background: true,
        // Enable to crop the image automatically when initialize
        autoCrop: true,
        // Define the percentage of automatic cropping area when initializes
        autoCropArea: 0.8,
        // Enable to move the image
        movable: true,
        // Enable to rotate the image
        rotatable: true,
        // Enable to scale the image
        scalable: true,
        // Enable to zoom the image
        zoomable: true,
        // Enable to zoom the image by dragging touch
        zoomOnTouch: true,
        // Enable to zoom the image by wheeling mouse
        zoomOnWheel: true,
        // Define zoom ratio when zoom the image by wheeling mouse
        wheelZoomRatio: 0.1,
        // Enable to move the crop box
        cropBoxMovable: true,
        // Enable to resize the crop box
        cropBoxResizable: true,
        // Toggle drag mode between "crop" and "move" when click twice on the cropper
        toggleDragModeOnDblclick: true,
        // Size limitation
        minCanvasWidth: 0,
        minCanvasHeight: 0,
        minCropBoxWidth: 0,
        minCropBoxHeight: 0,
        minContainerWidth: MIN_CONTAINER_WIDTH,
        minContainerHeight: MIN_CONTAINER_HEIGHT,
        // Shortcuts of events
        ready: null,
        cropstart: null,
        cropmove: null,
        cropend: null,
        crop: null,
        zoom: null
      };
      var TEMPLATE = '<div class="cropper-container" touch-action="none"><div class="cropper-wrap-box"><div class="cropper-canvas"></div></div><div class="cropper-drag-box"></div><div class="cropper-crop-box"><span class="cropper-view-box"></span><span class="cropper-dashed dashed-h"></span><span class="cropper-dashed dashed-v"></span><span class="cropper-center"></span><span class="cropper-face"></span><span class="cropper-line line-e" data-cropper-action="e"></span><span class="cropper-line line-n" data-cropper-action="n"></span><span class="cropper-line line-w" data-cropper-action="w"></span><span class="cropper-line line-s" data-cropper-action="s"></span><span class="cropper-point point-e" data-cropper-action="e"></span><span class="cropper-point point-n" data-cropper-action="n"></span><span class="cropper-point point-w" data-cropper-action="w"></span><span class="cropper-point point-s" data-cropper-action="s"></span><span class="cropper-point point-ne" data-cropper-action="ne"></span><span class="cropper-point point-nw" data-cropper-action="nw"></span><span class="cropper-point point-sw" data-cropper-action="sw"></span><span class="cropper-point point-se" data-cropper-action="se"></span></div></div>';
      var isNaN2 = Number.isNaN || WINDOW.isNaN;
      function isNumber(value) {
        return typeof value === "number" && !isNaN2(value);
      }
      var isPositiveNumber = function isPositiveNumber2(value) {
        return value > 0 && value < Infinity;
      };
      function isUndefined(value) {
        return typeof value === "undefined";
      }
      function isObject(value) {
        return _typeof(value) === "object" && value !== null;
      }
      var hasOwnProperty = Object.prototype.hasOwnProperty;
      function isPlainObject(value) {
        if (!isObject(value)) {
          return false;
        }
        try {
          var _constructor = value.constructor;
          var prototype = _constructor.prototype;
          return _constructor && prototype && hasOwnProperty.call(prototype, "isPrototypeOf");
        } catch (error3) {
          return false;
        }
      }
      function isFunction(value) {
        return typeof value === "function";
      }
      var slice = Array.prototype.slice;
      function toArray3(value) {
        return Array.from ? Array.from(value) : slice.call(value);
      }
      function forEach(data, callback) {
        if (data && isFunction(callback)) {
          if (Array.isArray(data) || isNumber(data.length)) {
            toArray3(data).forEach(function(value, key) {
              callback.call(data, value, key, data);
            });
          } else if (isObject(data)) {
            Object.keys(data).forEach(function(key) {
              callback.call(data, data[key], key, data);
            });
          }
        }
        return data;
      }
      var assign = Object.assign || function assign2(target) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }
        if (isObject(target) && args.length > 0) {
          args.forEach(function(arg) {
            if (isObject(arg)) {
              Object.keys(arg).forEach(function(key) {
                target[key] = arg[key];
              });
            }
          });
        }
        return target;
      };
      var REGEXP_DECIMALS = /\.\d*(?:0|9){12}\d*$/;
      function normalizeDecimalNumber(value) {
        var times = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1e11;
        return REGEXP_DECIMALS.test(value) ? Math.round(value * times) / times : value;
      }
      var REGEXP_SUFFIX = /^width|height|left|top|marginLeft|marginTop$/;
      function setStyle(element, styles) {
        var style = element.style;
        forEach(styles, function(value, property) {
          if (REGEXP_SUFFIX.test(property) && isNumber(value)) {
            value = "".concat(value, "px");
          }
          style[property] = value;
        });
      }
      function hasClass(element, value) {
        return element.classList ? element.classList.contains(value) : element.className.indexOf(value) > -1;
      }
      function addClass(element, value) {
        if (!value) {
          return;
        }
        if (isNumber(element.length)) {
          forEach(element, function(elem) {
            addClass(elem, value);
          });
          return;
        }
        if (element.classList) {
          element.classList.add(value);
          return;
        }
        var className = element.className.trim();
        if (!className) {
          element.className = value;
        } else if (className.indexOf(value) < 0) {
          element.className = "".concat(className, " ").concat(value);
        }
      }
      function removeClass(element, value) {
        if (!value) {
          return;
        }
        if (isNumber(element.length)) {
          forEach(element, function(elem) {
            removeClass(elem, value);
          });
          return;
        }
        if (element.classList) {
          element.classList.remove(value);
          return;
        }
        if (element.className.indexOf(value) >= 0) {
          element.className = element.className.replace(value, "");
        }
      }
      function toggleClass(element, value, added) {
        if (!value) {
          return;
        }
        if (isNumber(element.length)) {
          forEach(element, function(elem) {
            toggleClass(elem, value, added);
          });
          return;
        }
        if (added) {
          addClass(element, value);
        } else {
          removeClass(element, value);
        }
      }
      var REGEXP_CAMEL_CASE = /([a-z\d])([A-Z])/g;
      function toParamCase(value) {
        return value.replace(REGEXP_CAMEL_CASE, "$1-$2").toLowerCase();
      }
      function getData(element, name3) {
        if (isObject(element[name3])) {
          return element[name3];
        }
        if (element.dataset) {
          return element.dataset[name3];
        }
        return element.getAttribute("data-".concat(toParamCase(name3)));
      }
      function setData(element, name3, data) {
        if (isObject(data)) {
          element[name3] = data;
        } else if (element.dataset) {
          element.dataset[name3] = data;
        } else {
          element.setAttribute("data-".concat(toParamCase(name3)), data);
        }
      }
      function removeData(element, name3) {
        if (isObject(element[name3])) {
          try {
            delete element[name3];
          } catch (error3) {
            element[name3] = void 0;
          }
        } else if (element.dataset) {
          try {
            delete element.dataset[name3];
          } catch (error3) {
            element.dataset[name3] = void 0;
          }
        } else {
          element.removeAttribute("data-".concat(toParamCase(name3)));
        }
      }
      var REGEXP_SPACES = /\s\s*/;
      var onceSupported = (function() {
        var supported = false;
        if (IS_BROWSER) {
          var once = false;
          var listener = function listener2() {
          };
          var options = Object.defineProperty({}, "once", {
            get: function get() {
              supported = true;
              return once;
            },
            /**
             * This setter can fix a `TypeError` in strict mode
             * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Getter_only}
             * @param {boolean} value - The value to set
             */
            set: function set(value) {
              once = value;
            }
          });
          WINDOW.addEventListener("test", listener, options);
          WINDOW.removeEventListener("test", listener, options);
        }
        return supported;
      })();
      function removeListener(element, type, listener) {
        var options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
        var handler = listener;
        type.trim().split(REGEXP_SPACES).forEach(function(event) {
          if (!onceSupported) {
            var listeners = element.listeners;
            if (listeners && listeners[event] && listeners[event][listener]) {
              handler = listeners[event][listener];
              delete listeners[event][listener];
              if (Object.keys(listeners[event]).length === 0) {
                delete listeners[event];
              }
              if (Object.keys(listeners).length === 0) {
                delete element.listeners;
              }
            }
          }
          element.removeEventListener(event, handler, options);
        });
      }
      function addListener(element, type, listener) {
        var options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
        var _handler = listener;
        type.trim().split(REGEXP_SPACES).forEach(function(event) {
          if (options.once && !onceSupported) {
            var _element$listeners = element.listeners, listeners = _element$listeners === void 0 ? {} : _element$listeners;
            _handler = function handler() {
              delete listeners[event][listener];
              element.removeEventListener(event, _handler, options);
              for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                args[_key2] = arguments[_key2];
              }
              listener.apply(element, args);
            };
            if (!listeners[event]) {
              listeners[event] = {};
            }
            if (listeners[event][listener]) {
              element.removeEventListener(event, listeners[event][listener], options);
            }
            listeners[event][listener] = _handler;
            element.listeners = listeners;
          }
          element.addEventListener(event, _handler, options);
        });
      }
      function dispatchEvent3(element, type, data) {
        var event;
        if (isFunction(Event) && isFunction(CustomEvent)) {
          event = new CustomEvent(type, {
            detail: data,
            bubbles: true,
            cancelable: true
          });
        } else {
          event = document.createEvent("CustomEvent");
          event.initCustomEvent(type, true, true, data);
        }
        return element.dispatchEvent(event);
      }
      function getOffset(element) {
        var box = element.getBoundingClientRect();
        return {
          left: box.left + (window.pageXOffset - document.documentElement.clientLeft),
          top: box.top + (window.pageYOffset - document.documentElement.clientTop)
        };
      }
      var location2 = WINDOW.location;
      var REGEXP_ORIGINS = /^(\w+:)\/\/([^:/?#]*):?(\d*)/i;
      function isCrossOriginURL(url) {
        var parts = url.match(REGEXP_ORIGINS);
        return parts !== null && (parts[1] !== location2.protocol || parts[2] !== location2.hostname || parts[3] !== location2.port);
      }
      function addTimestamp(url) {
        var timestamp = "timestamp=".concat((/* @__PURE__ */ new Date()).getTime());
        return url + (url.indexOf("?") === -1 ? "?" : "&") + timestamp;
      }
      function getTransforms(_ref) {
        var rotate = _ref.rotate, scaleX = _ref.scaleX, scaleY = _ref.scaleY, translateX = _ref.translateX, translateY = _ref.translateY;
        var values = [];
        if (isNumber(translateX) && translateX !== 0) {
          values.push("translateX(".concat(translateX, "px)"));
        }
        if (isNumber(translateY) && translateY !== 0) {
          values.push("translateY(".concat(translateY, "px)"));
        }
        if (isNumber(rotate) && rotate !== 0) {
          values.push("rotate(".concat(rotate, "deg)"));
        }
        if (isNumber(scaleX) && scaleX !== 1) {
          values.push("scaleX(".concat(scaleX, ")"));
        }
        if (isNumber(scaleY) && scaleY !== 1) {
          values.push("scaleY(".concat(scaleY, ")"));
        }
        var transform = values.length ? values.join(" ") : "none";
        return {
          WebkitTransform: transform,
          msTransform: transform,
          transform
        };
      }
      function getMaxZoomRatio(pointers) {
        var pointers2 = _objectSpread2({}, pointers);
        var maxRatio = 0;
        forEach(pointers, function(pointer, pointerId) {
          delete pointers2[pointerId];
          forEach(pointers2, function(pointer2) {
            var x1 = Math.abs(pointer.startX - pointer2.startX);
            var y1 = Math.abs(pointer.startY - pointer2.startY);
            var x2 = Math.abs(pointer.endX - pointer2.endX);
            var y2 = Math.abs(pointer.endY - pointer2.endY);
            var z1 = Math.sqrt(x1 * x1 + y1 * y1);
            var z2 = Math.sqrt(x2 * x2 + y2 * y2);
            var ratio = (z2 - z1) / z1;
            if (Math.abs(ratio) > Math.abs(maxRatio)) {
              maxRatio = ratio;
            }
          });
        });
        return maxRatio;
      }
      function getPointer(_ref2, endOnly) {
        var pageX = _ref2.pageX, pageY = _ref2.pageY;
        var end = {
          endX: pageX,
          endY: pageY
        };
        return endOnly ? end : _objectSpread2({
          startX: pageX,
          startY: pageY
        }, end);
      }
      function getPointersCenter(pointers) {
        var pageX = 0;
        var pageY = 0;
        var count = 0;
        forEach(pointers, function(_ref3) {
          var startX = _ref3.startX, startY = _ref3.startY;
          pageX += startX;
          pageY += startY;
          count += 1;
        });
        pageX /= count;
        pageY /= count;
        return {
          pageX,
          pageY
        };
      }
      function getAdjustedSizes(_ref4) {
        var aspectRatio2 = _ref4.aspectRatio, height2 = _ref4.height, width2 = _ref4.width;
        var type = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "contain";
        var isValidWidth = isPositiveNumber(width2);
        var isValidHeight = isPositiveNumber(height2);
        if (isValidWidth && isValidHeight) {
          var adjustedWidth = height2 * aspectRatio2;
          if (type === "contain" && adjustedWidth > width2 || type === "cover" && adjustedWidth < width2) {
            height2 = width2 / aspectRatio2;
          } else {
            width2 = height2 * aspectRatio2;
          }
        } else if (isValidWidth) {
          height2 = width2 / aspectRatio2;
        } else if (isValidHeight) {
          width2 = height2 * aspectRatio2;
        }
        return {
          width: width2,
          height: height2
        };
      }
      function getRotatedSizes(_ref5) {
        var width2 = _ref5.width, height2 = _ref5.height, degree = _ref5.degree;
        degree = Math.abs(degree) % 180;
        if (degree === 90) {
          return {
            width: height2,
            height: width2
          };
        }
        var arc = degree % 90 * Math.PI / 180;
        var sinArc = Math.sin(arc);
        var cosArc = Math.cos(arc);
        var newWidth = width2 * cosArc + height2 * sinArc;
        var newHeight = width2 * sinArc + height2 * cosArc;
        return degree > 90 ? {
          width: newHeight,
          height: newWidth
        } : {
          width: newWidth,
          height: newHeight
        };
      }
      function getSourceCanvas(image2, _ref6, _ref7, _ref8) {
        var imageAspectRatio = _ref6.aspectRatio, imageNaturalWidth = _ref6.naturalWidth, imageNaturalHeight = _ref6.naturalHeight, _ref6$rotate = _ref6.rotate, rotate = _ref6$rotate === void 0 ? 0 : _ref6$rotate, _ref6$scaleX = _ref6.scaleX, scaleX = _ref6$scaleX === void 0 ? 1 : _ref6$scaleX, _ref6$scaleY = _ref6.scaleY, scaleY = _ref6$scaleY === void 0 ? 1 : _ref6$scaleY;
        var aspectRatio2 = _ref7.aspectRatio, naturalWidth = _ref7.naturalWidth, naturalHeight = _ref7.naturalHeight;
        var _ref8$fillColor = _ref8.fillColor, fillColor = _ref8$fillColor === void 0 ? "transparent" : _ref8$fillColor, _ref8$imageSmoothingE = _ref8.imageSmoothingEnabled, imageSmoothingEnabled = _ref8$imageSmoothingE === void 0 ? true : _ref8$imageSmoothingE, _ref8$imageSmoothingQ = _ref8.imageSmoothingQuality, imageSmoothingQuality = _ref8$imageSmoothingQ === void 0 ? "low" : _ref8$imageSmoothingQ, _ref8$maxWidth = _ref8.maxWidth, maxWidth = _ref8$maxWidth === void 0 ? Infinity : _ref8$maxWidth, _ref8$maxHeight = _ref8.maxHeight, maxHeight = _ref8$maxHeight === void 0 ? Infinity : _ref8$maxHeight, _ref8$minWidth = _ref8.minWidth, minWidth = _ref8$minWidth === void 0 ? 0 : _ref8$minWidth, _ref8$minHeight = _ref8.minHeight, minHeight = _ref8$minHeight === void 0 ? 0 : _ref8$minHeight;
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        var maxSizes = getAdjustedSizes({
          aspectRatio: aspectRatio2,
          width: maxWidth,
          height: maxHeight
        });
        var minSizes = getAdjustedSizes({
          aspectRatio: aspectRatio2,
          width: minWidth,
          height: minHeight
        }, "cover");
        var width2 = Math.min(maxSizes.width, Math.max(minSizes.width, naturalWidth));
        var height2 = Math.min(maxSizes.height, Math.max(minSizes.height, naturalHeight));
        var destMaxSizes = getAdjustedSizes({
          aspectRatio: imageAspectRatio,
          width: maxWidth,
          height: maxHeight
        });
        var destMinSizes = getAdjustedSizes({
          aspectRatio: imageAspectRatio,
          width: minWidth,
          height: minHeight
        }, "cover");
        var destWidth = Math.min(destMaxSizes.width, Math.max(destMinSizes.width, imageNaturalWidth));
        var destHeight = Math.min(destMaxSizes.height, Math.max(destMinSizes.height, imageNaturalHeight));
        var params2 = [-destWidth / 2, -destHeight / 2, destWidth, destHeight];
        canvas.width = normalizeDecimalNumber(width2);
        canvas.height = normalizeDecimalNumber(height2);
        context.fillStyle = fillColor;
        context.fillRect(0, 0, width2, height2);
        context.save();
        context.translate(width2 / 2, height2 / 2);
        context.rotate(rotate * Math.PI / 180);
        context.scale(scaleX, scaleY);
        context.imageSmoothingEnabled = imageSmoothingEnabled;
        context.imageSmoothingQuality = imageSmoothingQuality;
        context.drawImage.apply(context, [image2].concat(_toConsumableArray(params2.map(function(param) {
          return Math.floor(normalizeDecimalNumber(param));
        }))));
        context.restore();
        return canvas;
      }
      var fromCharCode = String.fromCharCode;
      function getStringFromCharCode(dataView, start3, length) {
        var str = "";
        length += start3;
        for (var i = start3; i < length; i += 1) {
          str += fromCharCode(dataView.getUint8(i));
        }
        return str;
      }
      var REGEXP_DATA_URL_HEAD = /^data:.*,/;
      function dataURLToArrayBuffer(dataURL) {
        var base64 = dataURL.replace(REGEXP_DATA_URL_HEAD, "");
        var binary = atob(base64);
        var arrayBuffer = new ArrayBuffer(binary.length);
        var uint8 = new Uint8Array(arrayBuffer);
        forEach(uint8, function(value, i) {
          uint8[i] = binary.charCodeAt(i);
        });
        return arrayBuffer;
      }
      function arrayBufferToDataURL(arrayBuffer, mimeType) {
        var chunks = [];
        var chunkSize = 8192;
        var uint8 = new Uint8Array(arrayBuffer);
        while (uint8.length > 0) {
          chunks.push(fromCharCode.apply(null, toArray3(uint8.subarray(0, chunkSize))));
          uint8 = uint8.subarray(chunkSize);
        }
        return "data:".concat(mimeType, ";base64,").concat(btoa(chunks.join("")));
      }
      function resetAndGetOrientation(arrayBuffer) {
        var dataView = new DataView(arrayBuffer);
        var orientation;
        try {
          var littleEndian;
          var app1Start;
          var ifdStart;
          if (dataView.getUint8(0) === 255 && dataView.getUint8(1) === 216) {
            var length = dataView.byteLength;
            var offset = 2;
            while (offset + 1 < length) {
              if (dataView.getUint8(offset) === 255 && dataView.getUint8(offset + 1) === 225) {
                app1Start = offset;
                break;
              }
              offset += 1;
            }
          }
          if (app1Start) {
            var exifIDCode = app1Start + 4;
            var tiffOffset = app1Start + 10;
            if (getStringFromCharCode(dataView, exifIDCode, 4) === "Exif") {
              var endianness = dataView.getUint16(tiffOffset);
              littleEndian = endianness === 18761;
              if (littleEndian || endianness === 19789) {
                if (dataView.getUint16(tiffOffset + 2, littleEndian) === 42) {
                  var firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);
                  if (firstIFDOffset >= 8) {
                    ifdStart = tiffOffset + firstIFDOffset;
                  }
                }
              }
            }
          }
          if (ifdStart) {
            var _length = dataView.getUint16(ifdStart, littleEndian);
            var _offset;
            var i;
            for (i = 0; i < _length; i += 1) {
              _offset = ifdStart + i * 12 + 2;
              if (dataView.getUint16(_offset, littleEndian) === 274) {
                _offset += 8;
                orientation = dataView.getUint16(_offset, littleEndian);
                dataView.setUint16(_offset, 1, littleEndian);
                break;
              }
            }
          }
        } catch (error3) {
          orientation = 1;
        }
        return orientation;
      }
      function parseOrientation(orientation) {
        var rotate = 0;
        var scaleX = 1;
        var scaleY = 1;
        switch (orientation) {
          // Flip horizontal
          case 2:
            scaleX = -1;
            break;
          // Rotate left 180°
          case 3:
            rotate = -180;
            break;
          // Flip vertical
          case 4:
            scaleY = -1;
            break;
          // Flip vertical and rotate right 90°
          case 5:
            rotate = 90;
            scaleY = -1;
            break;
          // Rotate right 90°
          case 6:
            rotate = 90;
            break;
          // Flip horizontal and rotate right 90°
          case 7:
            rotate = 90;
            scaleX = -1;
            break;
          // Rotate left 90°
          case 8:
            rotate = -90;
            break;
        }
        return {
          rotate,
          scaleX,
          scaleY
        };
      }
      var render = {
        render: function render2() {
          this.initContainer();
          this.initCanvas();
          this.initCropBox();
          this.renderCanvas();
          if (this.cropped) {
            this.renderCropBox();
          }
        },
        initContainer: function initContainer() {
          var element = this.element, options = this.options, container = this.container, cropper2 = this.cropper;
          var minWidth = Number(options.minContainerWidth);
          var minHeight = Number(options.minContainerHeight);
          addClass(cropper2, CLASS_HIDDEN);
          removeClass(element, CLASS_HIDDEN);
          var containerData = {
            width: Math.max(container.offsetWidth, minWidth >= 0 ? minWidth : MIN_CONTAINER_WIDTH),
            height: Math.max(container.offsetHeight, minHeight >= 0 ? minHeight : MIN_CONTAINER_HEIGHT)
          };
          this.containerData = containerData;
          setStyle(cropper2, {
            width: containerData.width,
            height: containerData.height
          });
          addClass(element, CLASS_HIDDEN);
          removeClass(cropper2, CLASS_HIDDEN);
        },
        // Canvas (image wrapper)
        initCanvas: function initCanvas() {
          var containerData = this.containerData, imageData = this.imageData;
          var viewMode = this.options.viewMode;
          var rotated = Math.abs(imageData.rotate) % 180 === 90;
          var naturalWidth = rotated ? imageData.naturalHeight : imageData.naturalWidth;
          var naturalHeight = rotated ? imageData.naturalWidth : imageData.naturalHeight;
          var aspectRatio2 = naturalWidth / naturalHeight;
          var canvasWidth = containerData.width;
          var canvasHeight = containerData.height;
          if (containerData.height * aspectRatio2 > containerData.width) {
            if (viewMode === 3) {
              canvasWidth = containerData.height * aspectRatio2;
            } else {
              canvasHeight = containerData.width / aspectRatio2;
            }
          } else if (viewMode === 3) {
            canvasHeight = containerData.width / aspectRatio2;
          } else {
            canvasWidth = containerData.height * aspectRatio2;
          }
          var canvasData = {
            aspectRatio: aspectRatio2,
            naturalWidth,
            naturalHeight,
            width: canvasWidth,
            height: canvasHeight
          };
          this.canvasData = canvasData;
          this.limited = viewMode === 1 || viewMode === 2;
          this.limitCanvas(true, true);
          canvasData.width = Math.min(Math.max(canvasData.width, canvasData.minWidth), canvasData.maxWidth);
          canvasData.height = Math.min(Math.max(canvasData.height, canvasData.minHeight), canvasData.maxHeight);
          canvasData.left = (containerData.width - canvasData.width) / 2;
          canvasData.top = (containerData.height - canvasData.height) / 2;
          canvasData.oldLeft = canvasData.left;
          canvasData.oldTop = canvasData.top;
          this.initialCanvasData = assign({}, canvasData);
        },
        limitCanvas: function limitCanvas(sizeLimited, positionLimited) {
          var options = this.options, containerData = this.containerData, canvasData = this.canvasData, cropBoxData = this.cropBoxData;
          var viewMode = options.viewMode;
          var aspectRatio2 = canvasData.aspectRatio;
          var cropped = this.cropped && cropBoxData;
          if (sizeLimited) {
            var minCanvasWidth = Number(options.minCanvasWidth) || 0;
            var minCanvasHeight = Number(options.minCanvasHeight) || 0;
            if (viewMode > 1) {
              minCanvasWidth = Math.max(minCanvasWidth, containerData.width);
              minCanvasHeight = Math.max(minCanvasHeight, containerData.height);
              if (viewMode === 3) {
                if (minCanvasHeight * aspectRatio2 > minCanvasWidth) {
                  minCanvasWidth = minCanvasHeight * aspectRatio2;
                } else {
                  minCanvasHeight = minCanvasWidth / aspectRatio2;
                }
              }
            } else if (viewMode > 0) {
              if (minCanvasWidth) {
                minCanvasWidth = Math.max(minCanvasWidth, cropped ? cropBoxData.width : 0);
              } else if (minCanvasHeight) {
                minCanvasHeight = Math.max(minCanvasHeight, cropped ? cropBoxData.height : 0);
              } else if (cropped) {
                minCanvasWidth = cropBoxData.width;
                minCanvasHeight = cropBoxData.height;
                if (minCanvasHeight * aspectRatio2 > minCanvasWidth) {
                  minCanvasWidth = minCanvasHeight * aspectRatio2;
                } else {
                  minCanvasHeight = minCanvasWidth / aspectRatio2;
                }
              }
            }
            var _getAdjustedSizes = getAdjustedSizes({
              aspectRatio: aspectRatio2,
              width: minCanvasWidth,
              height: minCanvasHeight
            });
            minCanvasWidth = _getAdjustedSizes.width;
            minCanvasHeight = _getAdjustedSizes.height;
            canvasData.minWidth = minCanvasWidth;
            canvasData.minHeight = minCanvasHeight;
            canvasData.maxWidth = Infinity;
            canvasData.maxHeight = Infinity;
          }
          if (positionLimited) {
            if (viewMode > (cropped ? 0 : 1)) {
              var newCanvasLeft = containerData.width - canvasData.width;
              var newCanvasTop = containerData.height - canvasData.height;
              canvasData.minLeft = Math.min(0, newCanvasLeft);
              canvasData.minTop = Math.min(0, newCanvasTop);
              canvasData.maxLeft = Math.max(0, newCanvasLeft);
              canvasData.maxTop = Math.max(0, newCanvasTop);
              if (cropped && this.limited) {
                canvasData.minLeft = Math.min(cropBoxData.left, cropBoxData.left + (cropBoxData.width - canvasData.width));
                canvasData.minTop = Math.min(cropBoxData.top, cropBoxData.top + (cropBoxData.height - canvasData.height));
                canvasData.maxLeft = cropBoxData.left;
                canvasData.maxTop = cropBoxData.top;
                if (viewMode === 2) {
                  if (canvasData.width >= containerData.width) {
                    canvasData.minLeft = Math.min(0, newCanvasLeft);
                    canvasData.maxLeft = Math.max(0, newCanvasLeft);
                  }
                  if (canvasData.height >= containerData.height) {
                    canvasData.minTop = Math.min(0, newCanvasTop);
                    canvasData.maxTop = Math.max(0, newCanvasTop);
                  }
                }
              }
            } else {
              canvasData.minLeft = -canvasData.width;
              canvasData.minTop = -canvasData.height;
              canvasData.maxLeft = containerData.width;
              canvasData.maxTop = containerData.height;
            }
          }
        },
        renderCanvas: function renderCanvas(changed, transformed) {
          var canvasData = this.canvasData, imageData = this.imageData;
          if (transformed) {
            var _getRotatedSizes = getRotatedSizes({
              width: imageData.naturalWidth * Math.abs(imageData.scaleX || 1),
              height: imageData.naturalHeight * Math.abs(imageData.scaleY || 1),
              degree: imageData.rotate || 0
            }), naturalWidth = _getRotatedSizes.width, naturalHeight = _getRotatedSizes.height;
            var width2 = canvasData.width * (naturalWidth / canvasData.naturalWidth);
            var height2 = canvasData.height * (naturalHeight / canvasData.naturalHeight);
            canvasData.left -= (width2 - canvasData.width) / 2;
            canvasData.top -= (height2 - canvasData.height) / 2;
            canvasData.width = width2;
            canvasData.height = height2;
            canvasData.aspectRatio = naturalWidth / naturalHeight;
            canvasData.naturalWidth = naturalWidth;
            canvasData.naturalHeight = naturalHeight;
            this.limitCanvas(true, false);
          }
          if (canvasData.width > canvasData.maxWidth || canvasData.width < canvasData.minWidth) {
            canvasData.left = canvasData.oldLeft;
          }
          if (canvasData.height > canvasData.maxHeight || canvasData.height < canvasData.minHeight) {
            canvasData.top = canvasData.oldTop;
          }
          canvasData.width = Math.min(Math.max(canvasData.width, canvasData.minWidth), canvasData.maxWidth);
          canvasData.height = Math.min(Math.max(canvasData.height, canvasData.minHeight), canvasData.maxHeight);
          this.limitCanvas(false, true);
          canvasData.left = Math.min(Math.max(canvasData.left, canvasData.minLeft), canvasData.maxLeft);
          canvasData.top = Math.min(Math.max(canvasData.top, canvasData.minTop), canvasData.maxTop);
          canvasData.oldLeft = canvasData.left;
          canvasData.oldTop = canvasData.top;
          setStyle(this.canvas, assign({
            width: canvasData.width,
            height: canvasData.height
          }, getTransforms({
            translateX: canvasData.left,
            translateY: canvasData.top
          })));
          this.renderImage(changed);
          if (this.cropped && this.limited) {
            this.limitCropBox(true, true);
          }
        },
        renderImage: function renderImage(changed) {
          var canvasData = this.canvasData, imageData = this.imageData;
          var width2 = imageData.naturalWidth * (canvasData.width / canvasData.naturalWidth);
          var height2 = imageData.naturalHeight * (canvasData.height / canvasData.naturalHeight);
          assign(imageData, {
            width: width2,
            height: height2,
            left: (canvasData.width - width2) / 2,
            top: (canvasData.height - height2) / 2
          });
          setStyle(this.image, assign({
            width: imageData.width,
            height: imageData.height
          }, getTransforms(assign({
            translateX: imageData.left,
            translateY: imageData.top
          }, imageData))));
          if (changed) {
            this.output();
          }
        },
        initCropBox: function initCropBox() {
          var options = this.options, canvasData = this.canvasData;
          var aspectRatio2 = options.aspectRatio || options.initialAspectRatio;
          var autoCropArea = Number(options.autoCropArea) || 0.8;
          var cropBoxData = {
            width: canvasData.width,
            height: canvasData.height
          };
          if (aspectRatio2) {
            if (canvasData.height * aspectRatio2 > canvasData.width) {
              cropBoxData.height = cropBoxData.width / aspectRatio2;
            } else {
              cropBoxData.width = cropBoxData.height * aspectRatio2;
            }
          }
          this.cropBoxData = cropBoxData;
          this.limitCropBox(true, true);
          cropBoxData.width = Math.min(Math.max(cropBoxData.width, cropBoxData.minWidth), cropBoxData.maxWidth);
          cropBoxData.height = Math.min(Math.max(cropBoxData.height, cropBoxData.minHeight), cropBoxData.maxHeight);
          cropBoxData.width = Math.max(cropBoxData.minWidth, cropBoxData.width * autoCropArea);
          cropBoxData.height = Math.max(cropBoxData.minHeight, cropBoxData.height * autoCropArea);
          cropBoxData.left = canvasData.left + (canvasData.width - cropBoxData.width) / 2;
          cropBoxData.top = canvasData.top + (canvasData.height - cropBoxData.height) / 2;
          cropBoxData.oldLeft = cropBoxData.left;
          cropBoxData.oldTop = cropBoxData.top;
          this.initialCropBoxData = assign({}, cropBoxData);
        },
        limitCropBox: function limitCropBox(sizeLimited, positionLimited) {
          var options = this.options, containerData = this.containerData, canvasData = this.canvasData, cropBoxData = this.cropBoxData, limited = this.limited;
          var aspectRatio2 = options.aspectRatio;
          if (sizeLimited) {
            var minCropBoxWidth = Number(options.minCropBoxWidth) || 0;
            var minCropBoxHeight = Number(options.minCropBoxHeight) || 0;
            var maxCropBoxWidth = limited ? Math.min(containerData.width, canvasData.width, canvasData.width + canvasData.left, containerData.width - canvasData.left) : containerData.width;
            var maxCropBoxHeight = limited ? Math.min(containerData.height, canvasData.height, canvasData.height + canvasData.top, containerData.height - canvasData.top) : containerData.height;
            minCropBoxWidth = Math.min(minCropBoxWidth, containerData.width);
            minCropBoxHeight = Math.min(minCropBoxHeight, containerData.height);
            if (aspectRatio2) {
              if (minCropBoxWidth && minCropBoxHeight) {
                if (minCropBoxHeight * aspectRatio2 > minCropBoxWidth) {
                  minCropBoxHeight = minCropBoxWidth / aspectRatio2;
                } else {
                  minCropBoxWidth = minCropBoxHeight * aspectRatio2;
                }
              } else if (minCropBoxWidth) {
                minCropBoxHeight = minCropBoxWidth / aspectRatio2;
              } else if (minCropBoxHeight) {
                minCropBoxWidth = minCropBoxHeight * aspectRatio2;
              }
              if (maxCropBoxHeight * aspectRatio2 > maxCropBoxWidth) {
                maxCropBoxHeight = maxCropBoxWidth / aspectRatio2;
              } else {
                maxCropBoxWidth = maxCropBoxHeight * aspectRatio2;
              }
            }
            cropBoxData.minWidth = Math.min(minCropBoxWidth, maxCropBoxWidth);
            cropBoxData.minHeight = Math.min(minCropBoxHeight, maxCropBoxHeight);
            cropBoxData.maxWidth = maxCropBoxWidth;
            cropBoxData.maxHeight = maxCropBoxHeight;
          }
          if (positionLimited) {
            if (limited) {
              cropBoxData.minLeft = Math.max(0, canvasData.left);
              cropBoxData.minTop = Math.max(0, canvasData.top);
              cropBoxData.maxLeft = Math.min(containerData.width, canvasData.left + canvasData.width) - cropBoxData.width;
              cropBoxData.maxTop = Math.min(containerData.height, canvasData.top + canvasData.height) - cropBoxData.height;
            } else {
              cropBoxData.minLeft = 0;
              cropBoxData.minTop = 0;
              cropBoxData.maxLeft = containerData.width - cropBoxData.width;
              cropBoxData.maxTop = containerData.height - cropBoxData.height;
            }
          }
        },
        renderCropBox: function renderCropBox() {
          var options = this.options, containerData = this.containerData, cropBoxData = this.cropBoxData;
          if (cropBoxData.width > cropBoxData.maxWidth || cropBoxData.width < cropBoxData.minWidth) {
            cropBoxData.left = cropBoxData.oldLeft;
          }
          if (cropBoxData.height > cropBoxData.maxHeight || cropBoxData.height < cropBoxData.minHeight) {
            cropBoxData.top = cropBoxData.oldTop;
          }
          cropBoxData.width = Math.min(Math.max(cropBoxData.width, cropBoxData.minWidth), cropBoxData.maxWidth);
          cropBoxData.height = Math.min(Math.max(cropBoxData.height, cropBoxData.minHeight), cropBoxData.maxHeight);
          this.limitCropBox(false, true);
          cropBoxData.left = Math.min(Math.max(cropBoxData.left, cropBoxData.minLeft), cropBoxData.maxLeft);
          cropBoxData.top = Math.min(Math.max(cropBoxData.top, cropBoxData.minTop), cropBoxData.maxTop);
          cropBoxData.oldLeft = cropBoxData.left;
          cropBoxData.oldTop = cropBoxData.top;
          if (options.movable && options.cropBoxMovable) {
            setData(this.face, DATA_ACTION, cropBoxData.width >= containerData.width && cropBoxData.height >= containerData.height ? ACTION_MOVE : ACTION_ALL);
          }
          setStyle(this.cropBox, assign({
            width: cropBoxData.width,
            height: cropBoxData.height
          }, getTransforms({
            translateX: cropBoxData.left,
            translateY: cropBoxData.top
          })));
          if (this.cropped && this.limited) {
            this.limitCanvas(true, true);
          }
          if (!this.disabled) {
            this.output();
          }
        },
        output: function output() {
          this.preview();
          dispatchEvent3(this.element, EVENT_CROP, this.getData());
        }
      };
      var preview = {
        initPreview: function initPreview() {
          var element = this.element, crossOrigin = this.crossOrigin;
          var preview2 = this.options.preview;
          var url = crossOrigin ? this.crossOriginUrl : this.url;
          var alt = element.alt || "The image to preview";
          var image2 = document.createElement("img");
          if (crossOrigin) {
            image2.crossOrigin = crossOrigin;
          }
          image2.src = url;
          image2.alt = alt;
          this.viewBox.appendChild(image2);
          this.viewBoxImage = image2;
          if (!preview2) {
            return;
          }
          var previews = preview2;
          if (typeof preview2 === "string") {
            previews = element.ownerDocument.querySelectorAll(preview2);
          } else if (preview2.querySelector) {
            previews = [preview2];
          }
          this.previews = previews;
          forEach(previews, function(el) {
            var img = document.createElement("img");
            setData(el, DATA_PREVIEW, {
              width: el.offsetWidth,
              height: el.offsetHeight,
              html: el.innerHTML
            });
            if (crossOrigin) {
              img.crossOrigin = crossOrigin;
            }
            img.src = url;
            img.alt = alt;
            img.style.cssText = 'display:block;width:100%;height:auto;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;image-orientation:0deg!important;"';
            el.innerHTML = "";
            el.appendChild(img);
          });
        },
        resetPreview: function resetPreview() {
          forEach(this.previews, function(element) {
            var data = getData(element, DATA_PREVIEW);
            setStyle(element, {
              width: data.width,
              height: data.height
            });
            element.innerHTML = data.html;
            removeData(element, DATA_PREVIEW);
          });
        },
        preview: function preview2() {
          var imageData = this.imageData, canvasData = this.canvasData, cropBoxData = this.cropBoxData;
          var cropBoxWidth = cropBoxData.width, cropBoxHeight = cropBoxData.height;
          var width2 = imageData.width, height2 = imageData.height;
          var left = cropBoxData.left - canvasData.left - imageData.left;
          var top = cropBoxData.top - canvasData.top - imageData.top;
          if (!this.cropped || this.disabled) {
            return;
          }
          setStyle(this.viewBoxImage, assign({
            width: width2,
            height: height2
          }, getTransforms(assign({
            translateX: -left,
            translateY: -top
          }, imageData))));
          forEach(this.previews, function(element) {
            var data = getData(element, DATA_PREVIEW);
            var originalWidth = data.width;
            var originalHeight = data.height;
            var newWidth = originalWidth;
            var newHeight = originalHeight;
            var ratio = 1;
            if (cropBoxWidth) {
              ratio = originalWidth / cropBoxWidth;
              newHeight = cropBoxHeight * ratio;
            }
            if (cropBoxHeight && newHeight > originalHeight) {
              ratio = originalHeight / cropBoxHeight;
              newWidth = cropBoxWidth * ratio;
              newHeight = originalHeight;
            }
            setStyle(element, {
              width: newWidth,
              height: newHeight
            });
            setStyle(element.getElementsByTagName("img")[0], assign({
              width: width2 * ratio,
              height: height2 * ratio
            }, getTransforms(assign({
              translateX: -left * ratio,
              translateY: -top * ratio
            }, imageData))));
          });
        }
      };
      var events = {
        bind: function bind() {
          var element = this.element, options = this.options, cropper2 = this.cropper;
          if (isFunction(options.cropstart)) {
            addListener(element, EVENT_CROP_START, options.cropstart);
          }
          if (isFunction(options.cropmove)) {
            addListener(element, EVENT_CROP_MOVE, options.cropmove);
          }
          if (isFunction(options.cropend)) {
            addListener(element, EVENT_CROP_END, options.cropend);
          }
          if (isFunction(options.crop)) {
            addListener(element, EVENT_CROP, options.crop);
          }
          if (isFunction(options.zoom)) {
            addListener(element, EVENT_ZOOM, options.zoom);
          }
          addListener(cropper2, EVENT_POINTER_DOWN, this.onCropStart = this.cropStart.bind(this));
          if (options.zoomable && options.zoomOnWheel) {
            addListener(cropper2, EVENT_WHEEL, this.onWheel = this.wheel.bind(this), {
              passive: false,
              capture: true
            });
          }
          if (options.toggleDragModeOnDblclick) {
            addListener(cropper2, EVENT_DBLCLICK, this.onDblclick = this.dblclick.bind(this));
          }
          addListener(element.ownerDocument, EVENT_POINTER_MOVE, this.onCropMove = this.cropMove.bind(this));
          addListener(element.ownerDocument, EVENT_POINTER_UP, this.onCropEnd = this.cropEnd.bind(this));
          if (options.responsive) {
            addListener(window, EVENT_RESIZE, this.onResize = this.resize.bind(this));
          }
        },
        unbind: function unbind() {
          var element = this.element, options = this.options, cropper2 = this.cropper;
          if (isFunction(options.cropstart)) {
            removeListener(element, EVENT_CROP_START, options.cropstart);
          }
          if (isFunction(options.cropmove)) {
            removeListener(element, EVENT_CROP_MOVE, options.cropmove);
          }
          if (isFunction(options.cropend)) {
            removeListener(element, EVENT_CROP_END, options.cropend);
          }
          if (isFunction(options.crop)) {
            removeListener(element, EVENT_CROP, options.crop);
          }
          if (isFunction(options.zoom)) {
            removeListener(element, EVENT_ZOOM, options.zoom);
          }
          removeListener(cropper2, EVENT_POINTER_DOWN, this.onCropStart);
          if (options.zoomable && options.zoomOnWheel) {
            removeListener(cropper2, EVENT_WHEEL, this.onWheel, {
              passive: false,
              capture: true
            });
          }
          if (options.toggleDragModeOnDblclick) {
            removeListener(cropper2, EVENT_DBLCLICK, this.onDblclick);
          }
          removeListener(element.ownerDocument, EVENT_POINTER_MOVE, this.onCropMove);
          removeListener(element.ownerDocument, EVENT_POINTER_UP, this.onCropEnd);
          if (options.responsive) {
            removeListener(window, EVENT_RESIZE, this.onResize);
          }
        }
      };
      var handlers = {
        resize: function resize() {
          if (this.disabled) {
            return;
          }
          var options = this.options, container = this.container, containerData = this.containerData;
          var ratioX = container.offsetWidth / containerData.width;
          var ratioY = container.offsetHeight / containerData.height;
          var ratio = Math.abs(ratioX - 1) > Math.abs(ratioY - 1) ? ratioX : ratioY;
          if (ratio !== 1) {
            var canvasData;
            var cropBoxData;
            if (options.restore) {
              canvasData = this.getCanvasData();
              cropBoxData = this.getCropBoxData();
            }
            this.render();
            if (options.restore) {
              this.setCanvasData(forEach(canvasData, function(n, i) {
                canvasData[i] = n * ratio;
              }));
              this.setCropBoxData(forEach(cropBoxData, function(n, i) {
                cropBoxData[i] = n * ratio;
              }));
            }
          }
        },
        dblclick: function dblclick() {
          if (this.disabled || this.options.dragMode === DRAG_MODE_NONE) {
            return;
          }
          this.setDragMode(hasClass(this.dragBox, CLASS_CROP) ? DRAG_MODE_MOVE : DRAG_MODE_CROP);
        },
        wheel: function wheel(event) {
          var _this = this;
          var ratio = Number(this.options.wheelZoomRatio) || 0.1;
          var delta = 1;
          if (this.disabled) {
            return;
          }
          event.preventDefault();
          if (this.wheeling) {
            return;
          }
          this.wheeling = true;
          setTimeout(function() {
            _this.wheeling = false;
          }, 50);
          if (event.deltaY) {
            delta = event.deltaY > 0 ? 1 : -1;
          } else if (event.wheelDelta) {
            delta = -event.wheelDelta / 120;
          } else if (event.detail) {
            delta = event.detail > 0 ? 1 : -1;
          }
          this.zoom(-delta * ratio, event);
        },
        cropStart: function cropStart(event) {
          var buttons = event.buttons, button = event.button;
          if (this.disabled || (event.type === "mousedown" || event.type === "pointerdown" && event.pointerType === "mouse") && // No primary button (Usually the left button)
          (isNumber(buttons) && buttons !== 1 || isNumber(button) && button !== 0 || event.ctrlKey)) {
            return;
          }
          var options = this.options, pointers = this.pointers;
          var action;
          if (event.changedTouches) {
            forEach(event.changedTouches, function(touch) {
              pointers[touch.identifier] = getPointer(touch);
            });
          } else {
            pointers[event.pointerId || 0] = getPointer(event);
          }
          if (Object.keys(pointers).length > 1 && options.zoomable && options.zoomOnTouch) {
            action = ACTION_ZOOM;
          } else {
            action = getData(event.target, DATA_ACTION);
          }
          if (!REGEXP_ACTIONS.test(action)) {
            return;
          }
          if (dispatchEvent3(this.element, EVENT_CROP_START, {
            originalEvent: event,
            action
          }) === false) {
            return;
          }
          event.preventDefault();
          this.action = action;
          this.cropping = false;
          if (action === ACTION_CROP) {
            this.cropping = true;
            addClass(this.dragBox, CLASS_MODAL);
          }
        },
        cropMove: function cropMove(event) {
          var action = this.action;
          if (this.disabled || !action) {
            return;
          }
          var pointers = this.pointers;
          event.preventDefault();
          if (dispatchEvent3(this.element, EVENT_CROP_MOVE, {
            originalEvent: event,
            action
          }) === false) {
            return;
          }
          if (event.changedTouches) {
            forEach(event.changedTouches, function(touch) {
              assign(pointers[touch.identifier] || {}, getPointer(touch, true));
            });
          } else {
            assign(pointers[event.pointerId || 0] || {}, getPointer(event, true));
          }
          this.change(event);
        },
        cropEnd: function cropEnd(event) {
          if (this.disabled) {
            return;
          }
          var action = this.action, pointers = this.pointers;
          if (event.changedTouches) {
            forEach(event.changedTouches, function(touch) {
              delete pointers[touch.identifier];
            });
          } else {
            delete pointers[event.pointerId || 0];
          }
          if (!action) {
            return;
          }
          event.preventDefault();
          if (!Object.keys(pointers).length) {
            this.action = "";
          }
          if (this.cropping) {
            this.cropping = false;
            toggleClass(this.dragBox, CLASS_MODAL, this.cropped && this.options.modal);
          }
          dispatchEvent3(this.element, EVENT_CROP_END, {
            originalEvent: event,
            action
          });
        }
      };
      var change = {
        change: function change2(event) {
          var options = this.options, canvasData = this.canvasData, containerData = this.containerData, cropBoxData = this.cropBoxData, pointers = this.pointers;
          var action = this.action;
          var aspectRatio2 = options.aspectRatio;
          var left = cropBoxData.left, top = cropBoxData.top, width2 = cropBoxData.width, height2 = cropBoxData.height;
          var right = left + width2;
          var bottom = top + height2;
          var minLeft = 0;
          var minTop = 0;
          var maxWidth = containerData.width;
          var maxHeight = containerData.height;
          var renderable = true;
          var offset;
          if (!aspectRatio2 && event.shiftKey) {
            aspectRatio2 = width2 && height2 ? width2 / height2 : 1;
          }
          if (this.limited) {
            minLeft = cropBoxData.minLeft;
            minTop = cropBoxData.minTop;
            maxWidth = minLeft + Math.min(containerData.width, canvasData.width, canvasData.left + canvasData.width);
            maxHeight = minTop + Math.min(containerData.height, canvasData.height, canvasData.top + canvasData.height);
          }
          var pointer = pointers[Object.keys(pointers)[0]];
          var range2 = {
            x: pointer.endX - pointer.startX,
            y: pointer.endY - pointer.startY
          };
          var check = function check2(side) {
            switch (side) {
              case ACTION_EAST:
                if (right + range2.x > maxWidth) {
                  range2.x = maxWidth - right;
                }
                break;
              case ACTION_WEST:
                if (left + range2.x < minLeft) {
                  range2.x = minLeft - left;
                }
                break;
              case ACTION_NORTH:
                if (top + range2.y < minTop) {
                  range2.y = minTop - top;
                }
                break;
              case ACTION_SOUTH:
                if (bottom + range2.y > maxHeight) {
                  range2.y = maxHeight - bottom;
                }
                break;
            }
          };
          switch (action) {
            // Move crop box
            case ACTION_ALL:
              left += range2.x;
              top += range2.y;
              break;
            // Resize crop box
            case ACTION_EAST:
              if (range2.x >= 0 && (right >= maxWidth || aspectRatio2 && (top <= minTop || bottom >= maxHeight))) {
                renderable = false;
                break;
              }
              check(ACTION_EAST);
              width2 += range2.x;
              if (width2 < 0) {
                action = ACTION_WEST;
                width2 = -width2;
                left -= width2;
              }
              if (aspectRatio2) {
                height2 = width2 / aspectRatio2;
                top += (cropBoxData.height - height2) / 2;
              }
              break;
            case ACTION_NORTH:
              if (range2.y <= 0 && (top <= minTop || aspectRatio2 && (left <= minLeft || right >= maxWidth))) {
                renderable = false;
                break;
              }
              check(ACTION_NORTH);
              height2 -= range2.y;
              top += range2.y;
              if (height2 < 0) {
                action = ACTION_SOUTH;
                height2 = -height2;
                top -= height2;
              }
              if (aspectRatio2) {
                width2 = height2 * aspectRatio2;
                left += (cropBoxData.width - width2) / 2;
              }
              break;
            case ACTION_WEST:
              if (range2.x <= 0 && (left <= minLeft || aspectRatio2 && (top <= minTop || bottom >= maxHeight))) {
                renderable = false;
                break;
              }
              check(ACTION_WEST);
              width2 -= range2.x;
              left += range2.x;
              if (width2 < 0) {
                action = ACTION_EAST;
                width2 = -width2;
                left -= width2;
              }
              if (aspectRatio2) {
                height2 = width2 / aspectRatio2;
                top += (cropBoxData.height - height2) / 2;
              }
              break;
            case ACTION_SOUTH:
              if (range2.y >= 0 && (bottom >= maxHeight || aspectRatio2 && (left <= minLeft || right >= maxWidth))) {
                renderable = false;
                break;
              }
              check(ACTION_SOUTH);
              height2 += range2.y;
              if (height2 < 0) {
                action = ACTION_NORTH;
                height2 = -height2;
                top -= height2;
              }
              if (aspectRatio2) {
                width2 = height2 * aspectRatio2;
                left += (cropBoxData.width - width2) / 2;
              }
              break;
            case ACTION_NORTH_EAST:
              if (aspectRatio2) {
                if (range2.y <= 0 && (top <= minTop || right >= maxWidth)) {
                  renderable = false;
                  break;
                }
                check(ACTION_NORTH);
                height2 -= range2.y;
                top += range2.y;
                width2 = height2 * aspectRatio2;
              } else {
                check(ACTION_NORTH);
                check(ACTION_EAST);
                if (range2.x >= 0) {
                  if (right < maxWidth) {
                    width2 += range2.x;
                  } else if (range2.y <= 0 && top <= minTop) {
                    renderable = false;
                  }
                } else {
                  width2 += range2.x;
                }
                if (range2.y <= 0) {
                  if (top > minTop) {
                    height2 -= range2.y;
                    top += range2.y;
                  }
                } else {
                  height2 -= range2.y;
                  top += range2.y;
                }
              }
              if (width2 < 0 && height2 < 0) {
                action = ACTION_SOUTH_WEST;
                height2 = -height2;
                width2 = -width2;
                top -= height2;
                left -= width2;
              } else if (width2 < 0) {
                action = ACTION_NORTH_WEST;
                width2 = -width2;
                left -= width2;
              } else if (height2 < 0) {
                action = ACTION_SOUTH_EAST;
                height2 = -height2;
                top -= height2;
              }
              break;
            case ACTION_NORTH_WEST:
              if (aspectRatio2) {
                if (range2.y <= 0 && (top <= minTop || left <= minLeft)) {
                  renderable = false;
                  break;
                }
                check(ACTION_NORTH);
                height2 -= range2.y;
                top += range2.y;
                width2 = height2 * aspectRatio2;
                left += cropBoxData.width - width2;
              } else {
                check(ACTION_NORTH);
                check(ACTION_WEST);
                if (range2.x <= 0) {
                  if (left > minLeft) {
                    width2 -= range2.x;
                    left += range2.x;
                  } else if (range2.y <= 0 && top <= minTop) {
                    renderable = false;
                  }
                } else {
                  width2 -= range2.x;
                  left += range2.x;
                }
                if (range2.y <= 0) {
                  if (top > minTop) {
                    height2 -= range2.y;
                    top += range2.y;
                  }
                } else {
                  height2 -= range2.y;
                  top += range2.y;
                }
              }
              if (width2 < 0 && height2 < 0) {
                action = ACTION_SOUTH_EAST;
                height2 = -height2;
                width2 = -width2;
                top -= height2;
                left -= width2;
              } else if (width2 < 0) {
                action = ACTION_NORTH_EAST;
                width2 = -width2;
                left -= width2;
              } else if (height2 < 0) {
                action = ACTION_SOUTH_WEST;
                height2 = -height2;
                top -= height2;
              }
              break;
            case ACTION_SOUTH_WEST:
              if (aspectRatio2) {
                if (range2.x <= 0 && (left <= minLeft || bottom >= maxHeight)) {
                  renderable = false;
                  break;
                }
                check(ACTION_WEST);
                width2 -= range2.x;
                left += range2.x;
                height2 = width2 / aspectRatio2;
              } else {
                check(ACTION_SOUTH);
                check(ACTION_WEST);
                if (range2.x <= 0) {
                  if (left > minLeft) {
                    width2 -= range2.x;
                    left += range2.x;
                  } else if (range2.y >= 0 && bottom >= maxHeight) {
                    renderable = false;
                  }
                } else {
                  width2 -= range2.x;
                  left += range2.x;
                }
                if (range2.y >= 0) {
                  if (bottom < maxHeight) {
                    height2 += range2.y;
                  }
                } else {
                  height2 += range2.y;
                }
              }
              if (width2 < 0 && height2 < 0) {
                action = ACTION_NORTH_EAST;
                height2 = -height2;
                width2 = -width2;
                top -= height2;
                left -= width2;
              } else if (width2 < 0) {
                action = ACTION_SOUTH_EAST;
                width2 = -width2;
                left -= width2;
              } else if (height2 < 0) {
                action = ACTION_NORTH_WEST;
                height2 = -height2;
                top -= height2;
              }
              break;
            case ACTION_SOUTH_EAST:
              if (aspectRatio2) {
                if (range2.x >= 0 && (right >= maxWidth || bottom >= maxHeight)) {
                  renderable = false;
                  break;
                }
                check(ACTION_EAST);
                width2 += range2.x;
                height2 = width2 / aspectRatio2;
              } else {
                check(ACTION_SOUTH);
                check(ACTION_EAST);
                if (range2.x >= 0) {
                  if (right < maxWidth) {
                    width2 += range2.x;
                  } else if (range2.y >= 0 && bottom >= maxHeight) {
                    renderable = false;
                  }
                } else {
                  width2 += range2.x;
                }
                if (range2.y >= 0) {
                  if (bottom < maxHeight) {
                    height2 += range2.y;
                  }
                } else {
                  height2 += range2.y;
                }
              }
              if (width2 < 0 && height2 < 0) {
                action = ACTION_NORTH_WEST;
                height2 = -height2;
                width2 = -width2;
                top -= height2;
                left -= width2;
              } else if (width2 < 0) {
                action = ACTION_SOUTH_WEST;
                width2 = -width2;
                left -= width2;
              } else if (height2 < 0) {
                action = ACTION_NORTH_EAST;
                height2 = -height2;
                top -= height2;
              }
              break;
            // Move canvas
            case ACTION_MOVE:
              this.move(range2.x, range2.y);
              renderable = false;
              break;
            // Zoom canvas
            case ACTION_ZOOM:
              this.zoom(getMaxZoomRatio(pointers), event);
              renderable = false;
              break;
            // Create crop box
            case ACTION_CROP:
              if (!range2.x || !range2.y) {
                renderable = false;
                break;
              }
              offset = getOffset(this.cropper);
              left = pointer.startX - offset.left;
              top = pointer.startY - offset.top;
              width2 = cropBoxData.minWidth;
              height2 = cropBoxData.minHeight;
              if (range2.x > 0) {
                action = range2.y > 0 ? ACTION_SOUTH_EAST : ACTION_NORTH_EAST;
              } else if (range2.x < 0) {
                left -= width2;
                action = range2.y > 0 ? ACTION_SOUTH_WEST : ACTION_NORTH_WEST;
              }
              if (range2.y < 0) {
                top -= height2;
              }
              if (!this.cropped) {
                removeClass(this.cropBox, CLASS_HIDDEN);
                this.cropped = true;
                if (this.limited) {
                  this.limitCropBox(true, true);
                }
              }
              break;
          }
          if (renderable) {
            cropBoxData.width = width2;
            cropBoxData.height = height2;
            cropBoxData.left = left;
            cropBoxData.top = top;
            this.action = action;
            this.renderCropBox();
          }
          forEach(pointers, function(p) {
            p.startX = p.endX;
            p.startY = p.endY;
          });
        }
      };
      var methods = {
        // Show the crop box manually
        crop: function crop() {
          if (this.ready && !this.cropped && !this.disabled) {
            this.cropped = true;
            this.limitCropBox(true, true);
            if (this.options.modal) {
              addClass(this.dragBox, CLASS_MODAL);
            }
            removeClass(this.cropBox, CLASS_HIDDEN);
            this.setCropBoxData(this.initialCropBoxData);
          }
          return this;
        },
        // Reset the image and crop box to their initial states
        reset: function reset() {
          if (this.ready && !this.disabled) {
            this.imageData = assign({}, this.initialImageData);
            this.canvasData = assign({}, this.initialCanvasData);
            this.cropBoxData = assign({}, this.initialCropBoxData);
            this.renderCanvas();
            if (this.cropped) {
              this.renderCropBox();
            }
          }
          return this;
        },
        // Clear the crop box
        clear: function clear() {
          if (this.cropped && !this.disabled) {
            assign(this.cropBoxData, {
              left: 0,
              top: 0,
              width: 0,
              height: 0
            });
            this.cropped = false;
            this.renderCropBox();
            this.limitCanvas(true, true);
            this.renderCanvas();
            removeClass(this.dragBox, CLASS_MODAL);
            addClass(this.cropBox, CLASS_HIDDEN);
          }
          return this;
        },
        /**
         * Replace the image's src and rebuild the cropper
         * @param {string} url - The new URL.
         * @param {boolean} [hasSameSize] - Indicate if the new image has the same size as the old one.
         * @returns {Cropper} this
         */
        replace: function replace(url) {
          var hasSameSize = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
          if (!this.disabled && url) {
            if (this.isImg) {
              this.element.src = url;
            }
            if (hasSameSize) {
              this.url = url;
              this.image.src = url;
              if (this.ready) {
                this.viewBoxImage.src = url;
                forEach(this.previews, function(element) {
                  element.getElementsByTagName("img")[0].src = url;
                });
              }
            } else {
              if (this.isImg) {
                this.replaced = true;
              }
              this.options.data = null;
              this.uncreate();
              this.load(url);
            }
          }
          return this;
        },
        // Enable (unfreeze) the cropper
        enable: function enable2() {
          if (this.ready && this.disabled) {
            this.disabled = false;
            removeClass(this.cropper, CLASS_DISABLED);
          }
          return this;
        },
        // Disable (freeze) the cropper
        disable: function disable2() {
          if (this.ready && !this.disabled) {
            this.disabled = true;
            addClass(this.cropper, CLASS_DISABLED);
          }
          return this;
        },
        /**
         * Destroy the cropper and remove the instance from the image
         * @returns {Cropper} this
         */
        destroy: function destroy() {
          var element = this.element;
          if (!element[NAMESPACE]) {
            return this;
          }
          element[NAMESPACE] = void 0;
          if (this.isImg && this.replaced) {
            element.src = this.originalUrl;
          }
          this.uncreate();
          return this;
        },
        /**
         * Move the canvas with relative offsets
         * @param {number} offsetX - The relative offset distance on the x-axis.
         * @param {number} [offsetY=offsetX] - The relative offset distance on the y-axis.
         * @returns {Cropper} this
         */
        move: function move(offsetX) {
          var offsetY = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : offsetX;
          var _this$canvasData = this.canvasData, left = _this$canvasData.left, top = _this$canvasData.top;
          return this.moveTo(isUndefined(offsetX) ? offsetX : left + Number(offsetX), isUndefined(offsetY) ? offsetY : top + Number(offsetY));
        },
        /**
         * Move the canvas to an absolute point
         * @param {number} x - The x-axis coordinate.
         * @param {number} [y=x] - The y-axis coordinate.
         * @returns {Cropper} this
         */
        moveTo: function moveTo(x) {
          var y = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : x;
          var canvasData = this.canvasData;
          var changed = false;
          x = Number(x);
          y = Number(y);
          if (this.ready && !this.disabled && this.options.movable) {
            if (isNumber(x)) {
              canvasData.left = x;
              changed = true;
            }
            if (isNumber(y)) {
              canvasData.top = y;
              changed = true;
            }
            if (changed) {
              this.renderCanvas(true);
            }
          }
          return this;
        },
        /**
         * Zoom the canvas with a relative ratio
         * @param {number} ratio - The target ratio.
         * @param {Event} _originalEvent - The original event if any.
         * @returns {Cropper} this
         */
        zoom: function zoom(ratio, _originalEvent) {
          var canvasData = this.canvasData;
          ratio = Number(ratio);
          if (ratio < 0) {
            ratio = 1 / (1 - ratio);
          } else {
            ratio = 1 + ratio;
          }
          return this.zoomTo(canvasData.width * ratio / canvasData.naturalWidth, null, _originalEvent);
        },
        /**
         * Zoom the canvas to an absolute ratio
         * @param {number} ratio - The target ratio.
         * @param {Object} pivot - The zoom pivot point coordinate.
         * @param {Event} _originalEvent - The original event if any.
         * @returns {Cropper} this
         */
        zoomTo: function zoomTo(ratio, pivot, _originalEvent) {
          var options = this.options, canvasData = this.canvasData;
          var width2 = canvasData.width, height2 = canvasData.height, naturalWidth = canvasData.naturalWidth, naturalHeight = canvasData.naturalHeight;
          ratio = Number(ratio);
          if (ratio >= 0 && this.ready && !this.disabled && options.zoomable) {
            var newWidth = naturalWidth * ratio;
            var newHeight = naturalHeight * ratio;
            if (dispatchEvent3(this.element, EVENT_ZOOM, {
              ratio,
              oldRatio: width2 / naturalWidth,
              originalEvent: _originalEvent
            }) === false) {
              return this;
            }
            if (_originalEvent) {
              var pointers = this.pointers;
              var offset = getOffset(this.cropper);
              var center = pointers && Object.keys(pointers).length ? getPointersCenter(pointers) : {
                pageX: _originalEvent.pageX,
                pageY: _originalEvent.pageY
              };
              canvasData.left -= (newWidth - width2) * ((center.pageX - offset.left - canvasData.left) / width2);
              canvasData.top -= (newHeight - height2) * ((center.pageY - offset.top - canvasData.top) / height2);
            } else if (isPlainObject(pivot) && isNumber(pivot.x) && isNumber(pivot.y)) {
              canvasData.left -= (newWidth - width2) * ((pivot.x - canvasData.left) / width2);
              canvasData.top -= (newHeight - height2) * ((pivot.y - canvasData.top) / height2);
            } else {
              canvasData.left -= (newWidth - width2) / 2;
              canvasData.top -= (newHeight - height2) / 2;
            }
            canvasData.width = newWidth;
            canvasData.height = newHeight;
            this.renderCanvas(true);
          }
          return this;
        },
        /**
         * Rotate the canvas with a relative degree
         * @param {number} degree - The rotate degree.
         * @returns {Cropper} this
         */
        rotate: function rotate(degree) {
          return this.rotateTo((this.imageData.rotate || 0) + Number(degree));
        },
        /**
         * Rotate the canvas to an absolute degree
         * @param {number} degree - The rotate degree.
         * @returns {Cropper} this
         */
        rotateTo: function rotateTo(degree) {
          degree = Number(degree);
          if (isNumber(degree) && this.ready && !this.disabled && this.options.rotatable) {
            this.imageData.rotate = degree % 360;
            this.renderCanvas(true, true);
          }
          return this;
        },
        /**
         * Scale the image on the x-axis.
         * @param {number} scaleX - The scale ratio on the x-axis.
         * @returns {Cropper} this
         */
        scaleX: function scaleX(_scaleX) {
          var scaleY = this.imageData.scaleY;
          return this.scale(_scaleX, isNumber(scaleY) ? scaleY : 1);
        },
        /**
         * Scale the image on the y-axis.
         * @param {number} scaleY - The scale ratio on the y-axis.
         * @returns {Cropper} this
         */
        scaleY: function scaleY(_scaleY) {
          var scaleX = this.imageData.scaleX;
          return this.scale(isNumber(scaleX) ? scaleX : 1, _scaleY);
        },
        /**
         * Scale the image
         * @param {number} scaleX - The scale ratio on the x-axis.
         * @param {number} [scaleY=scaleX] - The scale ratio on the y-axis.
         * @returns {Cropper} this
         */
        scale: function scale(scaleX) {
          var scaleY = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : scaleX;
          var imageData = this.imageData;
          var transformed = false;
          scaleX = Number(scaleX);
          scaleY = Number(scaleY);
          if (this.ready && !this.disabled && this.options.scalable) {
            if (isNumber(scaleX)) {
              imageData.scaleX = scaleX;
              transformed = true;
            }
            if (isNumber(scaleY)) {
              imageData.scaleY = scaleY;
              transformed = true;
            }
            if (transformed) {
              this.renderCanvas(true, true);
            }
          }
          return this;
        },
        /**
         * Get the cropped area position and size data (base on the original image)
         * @param {boolean} [rounded=false] - Indicate if round the data values or not.
         * @returns {Object} The result cropped data.
         */
        getData: function getData2() {
          var rounded = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
          var options = this.options, imageData = this.imageData, canvasData = this.canvasData, cropBoxData = this.cropBoxData;
          var data;
          if (this.ready && this.cropped) {
            data = {
              x: cropBoxData.left - canvasData.left,
              y: cropBoxData.top - canvasData.top,
              width: cropBoxData.width,
              height: cropBoxData.height
            };
            var ratio = imageData.width / imageData.naturalWidth;
            forEach(data, function(n, i) {
              data[i] = n / ratio;
            });
            if (rounded) {
              var bottom = Math.round(data.y + data.height);
              var right = Math.round(data.x + data.width);
              data.x = Math.round(data.x);
              data.y = Math.round(data.y);
              data.width = right - data.x;
              data.height = bottom - data.y;
            }
          } else {
            data = {
              x: 0,
              y: 0,
              width: 0,
              height: 0
            };
          }
          if (options.rotatable) {
            data.rotate = imageData.rotate || 0;
          }
          if (options.scalable) {
            data.scaleX = imageData.scaleX || 1;
            data.scaleY = imageData.scaleY || 1;
          }
          return data;
        },
        /**
         * Set the cropped area position and size with new data
         * @param {Object} data - The new data.
         * @returns {Cropper} this
         */
        setData: function setData2(data) {
          var options = this.options, imageData = this.imageData, canvasData = this.canvasData;
          var cropBoxData = {};
          if (this.ready && !this.disabled && isPlainObject(data)) {
            var transformed = false;
            if (options.rotatable) {
              if (isNumber(data.rotate) && data.rotate !== imageData.rotate) {
                imageData.rotate = data.rotate;
                transformed = true;
              }
            }
            if (options.scalable) {
              if (isNumber(data.scaleX) && data.scaleX !== imageData.scaleX) {
                imageData.scaleX = data.scaleX;
                transformed = true;
              }
              if (isNumber(data.scaleY) && data.scaleY !== imageData.scaleY) {
                imageData.scaleY = data.scaleY;
                transformed = true;
              }
            }
            if (transformed) {
              this.renderCanvas(true, true);
            }
            var ratio = imageData.width / imageData.naturalWidth;
            if (isNumber(data.x)) {
              cropBoxData.left = data.x * ratio + canvasData.left;
            }
            if (isNumber(data.y)) {
              cropBoxData.top = data.y * ratio + canvasData.top;
            }
            if (isNumber(data.width)) {
              cropBoxData.width = data.width * ratio;
            }
            if (isNumber(data.height)) {
              cropBoxData.height = data.height * ratio;
            }
            this.setCropBoxData(cropBoxData);
          }
          return this;
        },
        /**
         * Get the container size data.
         * @returns {Object} The result container data.
         */
        getContainerData: function getContainerData() {
          return this.ready ? assign({}, this.containerData) : {};
        },
        /**
         * Get the image position and size data.
         * @returns {Object} The result image data.
         */
        getImageData: function getImageData() {
          return this.sized ? assign({}, this.imageData) : {};
        },
        /**
         * Get the canvas position and size data.
         * @returns {Object} The result canvas data.
         */
        getCanvasData: function getCanvasData() {
          var canvasData = this.canvasData;
          var data = {};
          if (this.ready) {
            forEach(["left", "top", "width", "height", "naturalWidth", "naturalHeight"], function(n) {
              data[n] = canvasData[n];
            });
          }
          return data;
        },
        /**
         * Set the canvas position and size with new data.
         * @param {Object} data - The new canvas data.
         * @returns {Cropper} this
         */
        setCanvasData: function setCanvasData(data) {
          var canvasData = this.canvasData;
          var aspectRatio2 = canvasData.aspectRatio;
          if (this.ready && !this.disabled && isPlainObject(data)) {
            if (isNumber(data.left)) {
              canvasData.left = data.left;
            }
            if (isNumber(data.top)) {
              canvasData.top = data.top;
            }
            if (isNumber(data.width)) {
              canvasData.width = data.width;
              canvasData.height = data.width / aspectRatio2;
            } else if (isNumber(data.height)) {
              canvasData.height = data.height;
              canvasData.width = data.height * aspectRatio2;
            }
            this.renderCanvas(true);
          }
          return this;
        },
        /**
         * Get the crop box position and size data.
         * @returns {Object} The result crop box data.
         */
        getCropBoxData: function getCropBoxData() {
          var cropBoxData = this.cropBoxData;
          var data;
          if (this.ready && this.cropped) {
            data = {
              left: cropBoxData.left,
              top: cropBoxData.top,
              width: cropBoxData.width,
              height: cropBoxData.height
            };
          }
          return data || {};
        },
        /**
         * Set the crop box position and size with new data.
         * @param {Object} data - The new crop box data.
         * @returns {Cropper} this
         */
        setCropBoxData: function setCropBoxData(data) {
          var cropBoxData = this.cropBoxData;
          var aspectRatio2 = this.options.aspectRatio;
          var widthChanged;
          var heightChanged;
          if (this.ready && this.cropped && !this.disabled && isPlainObject(data)) {
            if (isNumber(data.left)) {
              cropBoxData.left = data.left;
            }
            if (isNumber(data.top)) {
              cropBoxData.top = data.top;
            }
            if (isNumber(data.width) && data.width !== cropBoxData.width) {
              widthChanged = true;
              cropBoxData.width = data.width;
            }
            if (isNumber(data.height) && data.height !== cropBoxData.height) {
              heightChanged = true;
              cropBoxData.height = data.height;
            }
            if (aspectRatio2) {
              if (widthChanged) {
                cropBoxData.height = cropBoxData.width / aspectRatio2;
              } else if (heightChanged) {
                cropBoxData.width = cropBoxData.height * aspectRatio2;
              }
            }
            this.renderCropBox();
          }
          return this;
        },
        /**
         * Get a canvas drawn the cropped image.
         * @param {Object} [options={}] - The config options.
         * @returns {HTMLCanvasElement} - The result canvas.
         */
        getCroppedCanvas: function getCroppedCanvas() {
          var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
          if (!this.ready || !window.HTMLCanvasElement) {
            return null;
          }
          var canvasData = this.canvasData;
          var source = getSourceCanvas(this.image, this.imageData, canvasData, options);
          if (!this.cropped) {
            return source;
          }
          var _this$getData = this.getData(options.rounded), initialX = _this$getData.x, initialY = _this$getData.y, initialWidth = _this$getData.width, initialHeight = _this$getData.height;
          var ratio = source.width / Math.floor(canvasData.naturalWidth);
          if (ratio !== 1) {
            initialX *= ratio;
            initialY *= ratio;
            initialWidth *= ratio;
            initialHeight *= ratio;
          }
          var aspectRatio2 = initialWidth / initialHeight;
          var maxSizes = getAdjustedSizes({
            aspectRatio: aspectRatio2,
            width: options.maxWidth || Infinity,
            height: options.maxHeight || Infinity
          });
          var minSizes = getAdjustedSizes({
            aspectRatio: aspectRatio2,
            width: options.minWidth || 0,
            height: options.minHeight || 0
          }, "cover");
          var _getAdjustedSizes = getAdjustedSizes({
            aspectRatio: aspectRatio2,
            width: options.width || (ratio !== 1 ? source.width : initialWidth),
            height: options.height || (ratio !== 1 ? source.height : initialHeight)
          }), width2 = _getAdjustedSizes.width, height2 = _getAdjustedSizes.height;
          width2 = Math.min(maxSizes.width, Math.max(minSizes.width, width2));
          height2 = Math.min(maxSizes.height, Math.max(minSizes.height, height2));
          var canvas = document.createElement("canvas");
          var context = canvas.getContext("2d");
          canvas.width = normalizeDecimalNumber(width2);
          canvas.height = normalizeDecimalNumber(height2);
          context.fillStyle = options.fillColor || "transparent";
          context.fillRect(0, 0, width2, height2);
          var _options$imageSmoothi = options.imageSmoothingEnabled, imageSmoothingEnabled = _options$imageSmoothi === void 0 ? true : _options$imageSmoothi, imageSmoothingQuality = options.imageSmoothingQuality;
          context.imageSmoothingEnabled = imageSmoothingEnabled;
          if (imageSmoothingQuality) {
            context.imageSmoothingQuality = imageSmoothingQuality;
          }
          var sourceWidth = source.width;
          var sourceHeight = source.height;
          var srcX = initialX;
          var srcY = initialY;
          var srcWidth;
          var srcHeight;
          var dstX;
          var dstY;
          var dstWidth;
          var dstHeight;
          if (srcX <= -initialWidth || srcX > sourceWidth) {
            srcX = 0;
            srcWidth = 0;
            dstX = 0;
            dstWidth = 0;
          } else if (srcX <= 0) {
            dstX = -srcX;
            srcX = 0;
            srcWidth = Math.min(sourceWidth, initialWidth + srcX);
            dstWidth = srcWidth;
          } else if (srcX <= sourceWidth) {
            dstX = 0;
            srcWidth = Math.min(initialWidth, sourceWidth - srcX);
            dstWidth = srcWidth;
          }
          if (srcWidth <= 0 || srcY <= -initialHeight || srcY > sourceHeight) {
            srcY = 0;
            srcHeight = 0;
            dstY = 0;
            dstHeight = 0;
          } else if (srcY <= 0) {
            dstY = -srcY;
            srcY = 0;
            srcHeight = Math.min(sourceHeight, initialHeight + srcY);
            dstHeight = srcHeight;
          } else if (srcY <= sourceHeight) {
            dstY = 0;
            srcHeight = Math.min(initialHeight, sourceHeight - srcY);
            dstHeight = srcHeight;
          }
          var params2 = [srcX, srcY, srcWidth, srcHeight];
          if (dstWidth > 0 && dstHeight > 0) {
            var scale = width2 / initialWidth;
            params2.push(dstX * scale, dstY * scale, dstWidth * scale, dstHeight * scale);
          }
          context.drawImage.apply(context, [source].concat(_toConsumableArray(params2.map(function(param) {
            return Math.floor(normalizeDecimalNumber(param));
          }))));
          return canvas;
        },
        /**
         * Change the aspect ratio of the crop box.
         * @param {number} aspectRatio - The new aspect ratio.
         * @returns {Cropper} this
         */
        setAspectRatio: function setAspectRatio(aspectRatio2) {
          var options = this.options;
          if (!this.disabled && !isUndefined(aspectRatio2)) {
            options.aspectRatio = Math.max(0, aspectRatio2) || NaN;
            if (this.ready) {
              this.initCropBox();
              if (this.cropped) {
                this.renderCropBox();
              }
            }
          }
          return this;
        },
        /**
         * Change the drag mode.
         * @param {string} mode - The new drag mode.
         * @returns {Cropper} this
         */
        setDragMode: function setDragMode(mode) {
          var options = this.options, dragBox = this.dragBox, face = this.face;
          if (this.ready && !this.disabled) {
            var croppable = mode === DRAG_MODE_CROP;
            var movable = options.movable && mode === DRAG_MODE_MOVE;
            mode = croppable || movable ? mode : DRAG_MODE_NONE;
            options.dragMode = mode;
            setData(dragBox, DATA_ACTION, mode);
            toggleClass(dragBox, CLASS_CROP, croppable);
            toggleClass(dragBox, CLASS_MOVE, movable);
            if (!options.cropBoxMovable) {
              setData(face, DATA_ACTION, mode);
              toggleClass(face, CLASS_CROP, croppable);
              toggleClass(face, CLASS_MOVE, movable);
            }
          }
          return this;
        }
      };
      var AnotherCropper = WINDOW.Cropper;
      var Cropper2 = /* @__PURE__ */ (function() {
        function Cropper3(element) {
          var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
          _classCallCheck(this, Cropper3);
          if (!element || !REGEXP_TAG_NAME.test(element.tagName)) {
            throw new Error("The first argument is required and must be an <img> or <canvas> element.");
          }
          this.element = element;
          this.options = assign({}, DEFAULTS, isPlainObject(options) && options);
          this.cropped = false;
          this.disabled = false;
          this.pointers = {};
          this.ready = false;
          this.reloading = false;
          this.replaced = false;
          this.sized = false;
          this.sizing = false;
          this.init();
        }
        return _createClass(Cropper3, [{
          key: "init",
          value: function init() {
            var element = this.element;
            var tagName = element.tagName.toLowerCase();
            var url;
            if (element[NAMESPACE]) {
              return;
            }
            element[NAMESPACE] = this;
            if (tagName === "img") {
              this.isImg = true;
              url = element.getAttribute("src") || "";
              this.originalUrl = url;
              if (!url) {
                return;
              }
              url = element.src;
            } else if (tagName === "canvas" && window.HTMLCanvasElement) {
              url = element.toDataURL();
            }
            this.load(url);
          }
        }, {
          key: "load",
          value: function load(url) {
            var _this = this;
            if (!url) {
              return;
            }
            this.url = url;
            this.imageData = {};
            var element = this.element, options = this.options;
            if (!options.rotatable && !options.scalable) {
              options.checkOrientation = false;
            }
            if (!options.checkOrientation || !window.ArrayBuffer) {
              this.clone();
              return;
            }
            if (REGEXP_DATA_URL.test(url)) {
              if (REGEXP_DATA_URL_JPEG.test(url)) {
                this.read(dataURLToArrayBuffer(url));
              } else {
                this.clone();
              }
              return;
            }
            var xhr = new XMLHttpRequest();
            var clone = this.clone.bind(this);
            this.reloading = true;
            this.xhr = xhr;
            xhr.onabort = clone;
            xhr.onerror = clone;
            xhr.ontimeout = clone;
            xhr.onprogress = function() {
              if (xhr.getResponseHeader("content-type") !== MIME_TYPE_JPEG) {
                xhr.abort();
              }
            };
            xhr.onload = function() {
              _this.read(xhr.response);
            };
            xhr.onloadend = function() {
              _this.reloading = false;
              _this.xhr = null;
            };
            if (options.checkCrossOrigin && isCrossOriginURL(url) && element.crossOrigin) {
              url = addTimestamp(url);
            }
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.withCredentials = element.crossOrigin === "use-credentials";
            xhr.send();
          }
        }, {
          key: "read",
          value: function read(arrayBuffer) {
            var options = this.options, imageData = this.imageData;
            var orientation = resetAndGetOrientation(arrayBuffer);
            var rotate = 0;
            var scaleX = 1;
            var scaleY = 1;
            if (orientation > 1) {
              this.url = arrayBufferToDataURL(arrayBuffer, MIME_TYPE_JPEG);
              var _parseOrientation = parseOrientation(orientation);
              rotate = _parseOrientation.rotate;
              scaleX = _parseOrientation.scaleX;
              scaleY = _parseOrientation.scaleY;
            }
            if (options.rotatable) {
              imageData.rotate = rotate;
            }
            if (options.scalable) {
              imageData.scaleX = scaleX;
              imageData.scaleY = scaleY;
            }
            this.clone();
          }
        }, {
          key: "clone",
          value: function clone() {
            var element = this.element, url = this.url;
            var crossOrigin = element.crossOrigin;
            var crossOriginUrl = url;
            if (this.options.checkCrossOrigin && isCrossOriginURL(url)) {
              if (!crossOrigin) {
                crossOrigin = "anonymous";
              }
              crossOriginUrl = addTimestamp(url);
            }
            this.crossOrigin = crossOrigin;
            this.crossOriginUrl = crossOriginUrl;
            var image2 = document.createElement("img");
            if (crossOrigin) {
              image2.crossOrigin = crossOrigin;
            }
            image2.src = crossOriginUrl || url;
            image2.alt = element.alt || "The image to crop";
            this.image = image2;
            image2.onload = this.start.bind(this);
            image2.onerror = this.stop.bind(this);
            addClass(image2, CLASS_HIDE);
            element.parentNode.insertBefore(image2, element.nextSibling);
          }
        }, {
          key: "start",
          value: function start3() {
            var _this2 = this;
            var image2 = this.image;
            image2.onload = null;
            image2.onerror = null;
            this.sizing = true;
            var isIOSWebKit = WINDOW.navigator && /(?:iPad|iPhone|iPod).*?AppleWebKit/i.test(WINDOW.navigator.userAgent);
            var done = function done2(naturalWidth, naturalHeight) {
              assign(_this2.imageData, {
                naturalWidth,
                naturalHeight,
                aspectRatio: naturalWidth / naturalHeight
              });
              _this2.initialImageData = assign({}, _this2.imageData);
              _this2.sizing = false;
              _this2.sized = true;
              _this2.build();
            };
            if (image2.naturalWidth && !isIOSWebKit) {
              done(image2.naturalWidth, image2.naturalHeight);
              return;
            }
            var sizingImage = document.createElement("img");
            var body = document.body || document.documentElement;
            this.sizingImage = sizingImage;
            sizingImage.onload = function() {
              done(sizingImage.width, sizingImage.height);
              if (!isIOSWebKit) {
                body.removeChild(sizingImage);
              }
            };
            sizingImage.src = image2.src;
            if (!isIOSWebKit) {
              sizingImage.style.cssText = "left:0;max-height:none!important;max-width:none!important;min-height:0!important;min-width:0!important;opacity:0;position:absolute;top:0;z-index:-1;";
              body.appendChild(sizingImage);
            }
          }
        }, {
          key: "stop",
          value: function stop() {
            var image2 = this.image;
            image2.onload = null;
            image2.onerror = null;
            image2.parentNode.removeChild(image2);
            this.image = null;
          }
        }, {
          key: "build",
          value: function build() {
            if (!this.sized || this.ready) {
              return;
            }
            var element = this.element, options = this.options, image2 = this.image;
            var container = element.parentNode;
            var template2 = document.createElement("div");
            template2.innerHTML = TEMPLATE;
            var cropper2 = template2.querySelector(".".concat(NAMESPACE, "-container"));
            var canvas = cropper2.querySelector(".".concat(NAMESPACE, "-canvas"));
            var dragBox = cropper2.querySelector(".".concat(NAMESPACE, "-drag-box"));
            var cropBox = cropper2.querySelector(".".concat(NAMESPACE, "-crop-box"));
            var face = cropBox.querySelector(".".concat(NAMESPACE, "-face"));
            this.container = container;
            this.cropper = cropper2;
            this.canvas = canvas;
            this.dragBox = dragBox;
            this.cropBox = cropBox;
            this.viewBox = cropper2.querySelector(".".concat(NAMESPACE, "-view-box"));
            this.face = face;
            canvas.appendChild(image2);
            addClass(element, CLASS_HIDDEN);
            container.insertBefore(cropper2, element.nextSibling);
            removeClass(image2, CLASS_HIDE);
            this.initPreview();
            this.bind();
            options.initialAspectRatio = Math.max(0, options.initialAspectRatio) || NaN;
            options.aspectRatio = Math.max(0, options.aspectRatio) || NaN;
            options.viewMode = Math.max(0, Math.min(3, Math.round(options.viewMode))) || 0;
            addClass(cropBox, CLASS_HIDDEN);
            if (!options.guides) {
              addClass(cropBox.getElementsByClassName("".concat(NAMESPACE, "-dashed")), CLASS_HIDDEN);
            }
            if (!options.center) {
              addClass(cropBox.getElementsByClassName("".concat(NAMESPACE, "-center")), CLASS_HIDDEN);
            }
            if (options.background) {
              addClass(cropper2, "".concat(NAMESPACE, "-bg"));
            }
            if (!options.highlight) {
              addClass(face, CLASS_INVISIBLE);
            }
            if (options.cropBoxMovable) {
              addClass(face, CLASS_MOVE);
              setData(face, DATA_ACTION, ACTION_ALL);
            }
            if (!options.cropBoxResizable) {
              addClass(cropBox.getElementsByClassName("".concat(NAMESPACE, "-line")), CLASS_HIDDEN);
              addClass(cropBox.getElementsByClassName("".concat(NAMESPACE, "-point")), CLASS_HIDDEN);
            }
            this.render();
            this.ready = true;
            this.setDragMode(options.dragMode);
            if (options.autoCrop) {
              this.crop();
            }
            this.setData(options.data);
            if (isFunction(options.ready)) {
              addListener(element, EVENT_READY, options.ready, {
                once: true
              });
            }
            dispatchEvent3(element, EVENT_READY);
          }
        }, {
          key: "unbuild",
          value: function unbuild() {
            if (!this.ready) {
              return;
            }
            this.ready = false;
            this.unbind();
            this.resetPreview();
            var parentNode = this.cropper.parentNode;
            if (parentNode) {
              parentNode.removeChild(this.cropper);
            }
            removeClass(this.element, CLASS_HIDDEN);
          }
        }, {
          key: "uncreate",
          value: function uncreate() {
            if (this.ready) {
              this.unbuild();
              this.ready = false;
              this.cropped = false;
            } else if (this.sizing) {
              this.sizingImage.onload = null;
              this.sizing = false;
              this.sized = false;
            } else if (this.reloading) {
              this.xhr.onabort = null;
              this.xhr.abort();
            } else if (this.image) {
              this.stop();
            }
          }
          /**
           * Get the no conflict cropper class.
           * @returns {Cropper} The cropper class.
           */
        }], [{
          key: "noConflict",
          value: function noConflict() {
            window.Cropper = AnotherCropper;
            return Cropper3;
          }
          /**
           * Change the default options.
           * @param {Object} options - The new default options.
           */
        }, {
          key: "setDefaults",
          value: function setDefaults(options) {
            assign(DEFAULTS, isPlainObject(options) && options);
          }
        }]);
      })();
      assign(Cropper2.prototype, render, preview, events, handlers, change, methods);
      return Cropper2;
    }));
  }
});

// node_modules/@hotwired/turbo/dist/turbo.es2017-esm.js
var turbo_es2017_esm_exports = {};
__export(turbo_es2017_esm_exports, {
  FetchEnctype: () => FetchEnctype,
  FetchMethod: () => FetchMethod,
  FetchRequest: () => FetchRequest,
  FetchResponse: () => FetchResponse,
  FrameElement: () => FrameElement,
  FrameLoadingStyle: () => FrameLoadingStyle,
  FrameRenderer: () => FrameRenderer,
  PageRenderer: () => PageRenderer,
  PageSnapshot: () => PageSnapshot,
  StreamActions: () => StreamActions,
  StreamElement: () => StreamElement,
  StreamSourceElement: () => StreamSourceElement,
  cache: () => cache,
  clearCache: () => clearCache,
  config: () => config,
  connectStreamSource: () => connectStreamSource,
  disconnectStreamSource: () => disconnectStreamSource,
  fetch: () => fetchWithTurboHeaders,
  fetchEnctypeFromString: () => fetchEnctypeFromString,
  fetchMethodFromString: () => fetchMethodFromString,
  isSafe: () => isSafe,
  morphBodyElements: () => morphBodyElements,
  morphChildren: () => morphChildren,
  morphElements: () => morphElements,
  morphTurboFrameElements: () => morphTurboFrameElements,
  navigator: () => navigator$1,
  registerAdapter: () => registerAdapter,
  renderStreamMessage: () => renderStreamMessage,
  session: () => session,
  setConfirmMethod: () => setConfirmMethod,
  setFormMode: () => setFormMode,
  setProgressBarDelay: () => setProgressBarDelay,
  start: () => start,
  visit: () => visit
});
(function(prototype) {
  if (typeof prototype.requestSubmit == "function") return;
  prototype.requestSubmit = function(submitter2) {
    if (submitter2) {
      validateSubmitter(submitter2, this);
      submitter2.click();
    } else {
      submitter2 = document.createElement("input");
      submitter2.type = "submit";
      submitter2.hidden = true;
      this.appendChild(submitter2);
      submitter2.click();
      this.removeChild(submitter2);
    }
  };
  function validateSubmitter(submitter2, form) {
    submitter2 instanceof HTMLElement || raise(TypeError, "parameter 1 is not of type 'HTMLElement'");
    submitter2.type == "submit" || raise(TypeError, "The specified element is not a submit button");
    submitter2.form == form || raise(DOMException, "The specified element is not owned by this form element", "NotFoundError");
  }
  function raise(errorConstructor, message, name3) {
    throw new errorConstructor("Failed to execute 'requestSubmit' on 'HTMLFormElement': " + message + ".", name3);
  }
})(HTMLFormElement.prototype);
var submittersByForm = /* @__PURE__ */ new WeakMap();
function findSubmitterFromClickTarget(target) {
  const element = target instanceof Element ? target : target instanceof Node ? target.parentElement : null;
  const candidate = element ? element.closest("input, button") : null;
  return candidate?.type == "submit" ? candidate : null;
}
function clickCaptured(event) {
  const submitter2 = findSubmitterFromClickTarget(event.target);
  if (submitter2 && submitter2.form) {
    submittersByForm.set(submitter2.form, submitter2);
  }
}
(function() {
  if ("submitter" in Event.prototype) return;
  let prototype = window.Event.prototype;
  if ("SubmitEvent" in window) {
    const prototypeOfSubmitEvent = window.SubmitEvent.prototype;
    if (/Apple Computer/.test(navigator.vendor) && !("submitter" in prototypeOfSubmitEvent)) {
      prototype = prototypeOfSubmitEvent;
    } else {
      return;
    }
  }
  addEventListener("click", clickCaptured, true);
  Object.defineProperty(prototype, "submitter", {
    get() {
      if (this.type == "submit" && this.target instanceof HTMLFormElement) {
        return submittersByForm.get(this.target);
      }
    }
  });
})();
var FrameLoadingStyle = {
  eager: "eager",
  lazy: "lazy"
};
var FrameElement = class _FrameElement extends HTMLElement {
  static delegateConstructor = void 0;
  loaded = Promise.resolve();
  static get observedAttributes() {
    return ["disabled", "loading", "src"];
  }
  constructor() {
    super();
    this.delegate = new _FrameElement.delegateConstructor(this);
  }
  connectedCallback() {
    this.delegate.connect();
  }
  disconnectedCallback() {
    this.delegate.disconnect();
  }
  reload() {
    return this.delegate.sourceURLReloaded();
  }
  attributeChangedCallback(name3) {
    if (name3 == "loading") {
      this.delegate.loadingStyleChanged();
    } else if (name3 == "src") {
      this.delegate.sourceURLChanged();
    } else if (name3 == "disabled") {
      this.delegate.disabledChanged();
    }
  }
  /**
   * Gets the URL to lazily load source HTML from
   */
  get src() {
    return this.getAttribute("src");
  }
  /**
   * Sets the URL to lazily load source HTML from
   */
  set src(value) {
    if (value) {
      this.setAttribute("src", value);
    } else {
      this.removeAttribute("src");
    }
  }
  /**
   * Gets the refresh mode for the frame.
   */
  get refresh() {
    return this.getAttribute("refresh");
  }
  /**
   * Sets the refresh mode for the frame.
   */
  set refresh(value) {
    if (value) {
      this.setAttribute("refresh", value);
    } else {
      this.removeAttribute("refresh");
    }
  }
  get shouldReloadWithMorph() {
    return this.src && this.refresh === "morph";
  }
  /**
   * Determines if the element is loading
   */
  get loading() {
    return frameLoadingStyleFromString(this.getAttribute("loading") || "");
  }
  /**
   * Sets the value of if the element is loading
   */
  set loading(value) {
    if (value) {
      this.setAttribute("loading", value);
    } else {
      this.removeAttribute("loading");
    }
  }
  /**
   * Gets the disabled state of the frame.
   *
   * If disabled, no requests will be intercepted by the frame.
   */
  get disabled() {
    return this.hasAttribute("disabled");
  }
  /**
   * Sets the disabled state of the frame.
   *
   * If disabled, no requests will be intercepted by the frame.
   */
  set disabled(value) {
    if (value) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }
  /**
   * Gets the autoscroll state of the frame.
   *
   * If true, the frame will be scrolled into view automatically on update.
   */
  get autoscroll() {
    return this.hasAttribute("autoscroll");
  }
  /**
   * Sets the autoscroll state of the frame.
   *
   * If true, the frame will be scrolled into view automatically on update.
   */
  set autoscroll(value) {
    if (value) {
      this.setAttribute("autoscroll", "");
    } else {
      this.removeAttribute("autoscroll");
    }
  }
  /**
   * Determines if the element has finished loading
   */
  get complete() {
    return !this.delegate.isLoading;
  }
  /**
   * Gets the active state of the frame.
   *
   * If inactive, source changes will not be observed.
   */
  get isActive() {
    return this.ownerDocument === document && !this.isPreview;
  }
  /**
   * Sets the active state of the frame.
   *
   * If inactive, source changes will not be observed.
   */
  get isPreview() {
    return this.ownerDocument?.documentElement?.hasAttribute("data-turbo-preview");
  }
};
function frameLoadingStyleFromString(style) {
  switch (style.toLowerCase()) {
    case "lazy":
      return FrameLoadingStyle.lazy;
    default:
      return FrameLoadingStyle.eager;
  }
}
var drive = {
  enabled: true,
  progressBarDelay: 500,
  unvisitableExtensions: /* @__PURE__ */ new Set(
    [
      ".7z",
      ".aac",
      ".apk",
      ".avi",
      ".bmp",
      ".bz2",
      ".css",
      ".csv",
      ".deb",
      ".dmg",
      ".doc",
      ".docx",
      ".exe",
      ".gif",
      ".gz",
      ".heic",
      ".heif",
      ".ico",
      ".iso",
      ".jpeg",
      ".jpg",
      ".js",
      ".json",
      ".m4a",
      ".mkv",
      ".mov",
      ".mp3",
      ".mp4",
      ".mpeg",
      ".mpg",
      ".msi",
      ".ogg",
      ".ogv",
      ".pdf",
      ".pkg",
      ".png",
      ".ppt",
      ".pptx",
      ".rar",
      ".rtf",
      ".svg",
      ".tar",
      ".tif",
      ".tiff",
      ".txt",
      ".wav",
      ".webm",
      ".webp",
      ".wma",
      ".wmv",
      ".xls",
      ".xlsx",
      ".xml",
      ".zip"
    ]
  )
};
function activateScriptElement(element) {
  if (element.getAttribute("data-turbo-eval") == "false") {
    return element;
  } else {
    const createdScriptElement = document.createElement("script");
    const cspNonce = getCspNonce();
    if (cspNonce) {
      createdScriptElement.nonce = cspNonce;
    }
    createdScriptElement.textContent = element.textContent;
    createdScriptElement.async = false;
    copyElementAttributes(createdScriptElement, element);
    return createdScriptElement;
  }
}
function copyElementAttributes(destinationElement, sourceElement) {
  for (const { name: name3, value } of sourceElement.attributes) {
    destinationElement.setAttribute(name3, value);
  }
}
function createDocumentFragment(html) {
  const template2 = document.createElement("template");
  template2.innerHTML = html;
  return template2.content;
}
function dispatch(eventName, { target, cancelable, detail } = {}) {
  const event = new CustomEvent(eventName, {
    cancelable,
    bubbles: true,
    composed: true,
    detail
  });
  if (target && target.isConnected) {
    target.dispatchEvent(event);
  } else {
    document.documentElement.dispatchEvent(event);
  }
  return event;
}
function cancelEvent(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}
function nextRepaint() {
  if (document.visibilityState === "hidden") {
    return nextEventLoopTick();
  } else {
    return nextAnimationFrame();
  }
}
function nextAnimationFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
function nextEventLoopTick() {
  return new Promise((resolve) => setTimeout(() => resolve(), 0));
}
function nextMicrotask() {
  return Promise.resolve();
}
function parseHTMLDocument(html = "") {
  return new DOMParser().parseFromString(html, "text/html");
}
function unindent(strings, ...values) {
  const lines = interpolate(strings, values).replace(/^\n/, "").split("\n");
  const match = lines[0].match(/^\s+/);
  const indent = match ? match[0].length : 0;
  return lines.map((line) => line.slice(indent)).join("\n");
}
function interpolate(strings, values) {
  return strings.reduce((result, string, i) => {
    const value = values[i] == void 0 ? "" : values[i];
    return result + string + value;
  }, "");
}
function uuid() {
  return Array.from({ length: 36 }).map((_, i) => {
    if (i == 8 || i == 13 || i == 18 || i == 23) {
      return "-";
    } else if (i == 14) {
      return "4";
    } else if (i == 19) {
      return (Math.floor(Math.random() * 4) + 8).toString(16);
    } else {
      return Math.floor(Math.random() * 15).toString(16);
    }
  }).join("");
}
function getAttribute(attributeName, ...elements) {
  for (const value of elements.map((element) => element?.getAttribute(attributeName))) {
    if (typeof value == "string") return value;
  }
  return null;
}
function hasAttribute(attributeName, ...elements) {
  return elements.some((element) => element && element.hasAttribute(attributeName));
}
function markAsBusy(...elements) {
  for (const element of elements) {
    if (element.localName == "turbo-frame") {
      element.setAttribute("busy", "");
    }
    element.setAttribute("aria-busy", "true");
  }
}
function clearBusyState(...elements) {
  for (const element of elements) {
    if (element.localName == "turbo-frame") {
      element.removeAttribute("busy");
    }
    element.removeAttribute("aria-busy");
  }
}
function waitForLoad(element, timeoutInMilliseconds = 2e3) {
  return new Promise((resolve) => {
    const onComplete = () => {
      element.removeEventListener("error", onComplete);
      element.removeEventListener("load", onComplete);
      resolve();
    };
    element.addEventListener("load", onComplete, { once: true });
    element.addEventListener("error", onComplete, { once: true });
    setTimeout(resolve, timeoutInMilliseconds);
  });
}
function getHistoryMethodForAction(action) {
  switch (action) {
    case "replace":
      return history.replaceState;
    case "advance":
    case "restore":
      return history.pushState;
  }
}
function isAction(action) {
  return action == "advance" || action == "replace" || action == "restore";
}
function getVisitAction(...elements) {
  const action = getAttribute("data-turbo-action", ...elements);
  return isAction(action) ? action : null;
}
function getMetaElement(name3) {
  return document.querySelector(`meta[name="${name3}"]`);
}
function getMetaContent(name3) {
  const element = getMetaElement(name3);
  return element && element.content;
}
function getCspNonce() {
  const element = getMetaElement("csp-nonce");
  if (element) {
    const { nonce, content } = element;
    return nonce == "" ? content : nonce;
  }
}
function setMetaContent(name3, content) {
  let element = getMetaElement(name3);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name3);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
  return element;
}
function findClosestRecursively(element, selector) {
  if (element instanceof Element) {
    return element.closest(selector) || findClosestRecursively(element.assignedSlot || element.getRootNode()?.host, selector);
  }
}
function elementIsFocusable(element) {
  const inertDisabledOrHidden = "[inert], :disabled, [hidden], details:not([open]), dialog:not([open])";
  return !!element && element.closest(inertDisabledOrHidden) == null && typeof element.focus == "function";
}
function queryAutofocusableElement(elementOrDocumentFragment) {
  return Array.from(elementOrDocumentFragment.querySelectorAll("[autofocus]")).find(elementIsFocusable);
}
async function around(callback, reader) {
  const before2 = reader();
  callback();
  await nextAnimationFrame();
  const after2 = reader();
  return [before2, after2];
}
function doesNotTargetIFrame(name3) {
  if (name3 === "_blank") {
    return false;
  } else if (name3) {
    for (const element of document.getElementsByName(name3)) {
      if (element instanceof HTMLIFrameElement) return false;
    }
    return true;
  } else {
    return true;
  }
}
function findLinkFromClickTarget(target) {
  const link = findClosestRecursively(target, "a[href], a[xlink\\:href]");
  if (!link) return null;
  if (link.hasAttribute("download")) return null;
  if (link.hasAttribute("target") && link.target !== "_self") return null;
  return link;
}
function getLocationForLink(link) {
  return expandURL(link.getAttribute("href") || "");
}
function debounce(fn, delay) {
  let timeoutId = null;
  return (...args) => {
    const callback = () => fn.apply(this, args);
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, delay);
  };
}
var submitter = {
  "aria-disabled": {
    beforeSubmit: (submitter2) => {
      submitter2.setAttribute("aria-disabled", "true");
      submitter2.addEventListener("click", cancelEvent);
    },
    afterSubmit: (submitter2) => {
      submitter2.removeAttribute("aria-disabled");
      submitter2.removeEventListener("click", cancelEvent);
    }
  },
  "disabled": {
    beforeSubmit: (submitter2) => submitter2.disabled = true,
    afterSubmit: (submitter2) => submitter2.disabled = false
  }
};
var Config = class {
  #submitter = null;
  constructor(config2) {
    Object.assign(this, config2);
  }
  get submitter() {
    return this.#submitter;
  }
  set submitter(value) {
    this.#submitter = submitter[value] || value;
  }
};
var forms = new Config({
  mode: "on",
  submitter: "disabled"
});
var config = {
  drive,
  forms
};
function expandURL(locatable) {
  return new URL(locatable.toString(), document.baseURI);
}
function getAnchor(url) {
  let anchorMatch;
  if (url.hash) {
    return url.hash.slice(1);
  } else if (anchorMatch = url.href.match(/#(.*)$/)) {
    return anchorMatch[1];
  }
}
function getAction$1(form, submitter2) {
  const action = submitter2?.getAttribute("formaction") || form.getAttribute("action") || form.action;
  return expandURL(action);
}
function getExtension(url) {
  return (getLastPathComponent(url).match(/\.[^.]*$/) || [])[0] || "";
}
function isPrefixedBy(baseURL, url) {
  const prefix = addTrailingSlash(url.origin + url.pathname);
  return addTrailingSlash(baseURL.href) === prefix || baseURL.href.startsWith(prefix);
}
function locationIsVisitable(location2, rootLocation) {
  return isPrefixedBy(location2, rootLocation) && !config.drive.unvisitableExtensions.has(getExtension(location2));
}
function getRequestURL(url) {
  const anchor = getAnchor(url);
  return anchor != null ? url.href.slice(0, -(anchor.length + 1)) : url.href;
}
function toCacheKey(url) {
  return getRequestURL(url);
}
function urlsAreEqual(left, right) {
  return expandURL(left).href == expandURL(right).href;
}
function getPathComponents(url) {
  return url.pathname.split("/").slice(1);
}
function getLastPathComponent(url) {
  return getPathComponents(url).slice(-1)[0];
}
function addTrailingSlash(value) {
  return value.endsWith("/") ? value : value + "/";
}
var FetchResponse = class {
  constructor(response2) {
    this.response = response2;
  }
  get succeeded() {
    return this.response.ok;
  }
  get failed() {
    return !this.succeeded;
  }
  get clientError() {
    return this.statusCode >= 400 && this.statusCode <= 499;
  }
  get serverError() {
    return this.statusCode >= 500 && this.statusCode <= 599;
  }
  get redirected() {
    return this.response.redirected;
  }
  get location() {
    return expandURL(this.response.url);
  }
  get isHTML() {
    return this.contentType && this.contentType.match(/^(?:text\/([^\s;,]+\b)?html|application\/xhtml\+xml)\b/);
  }
  get statusCode() {
    return this.response.status;
  }
  get contentType() {
    return this.header("Content-Type");
  }
  get responseText() {
    return this.response.clone().text();
  }
  get responseHTML() {
    if (this.isHTML) {
      return this.response.clone().text();
    } else {
      return Promise.resolve(void 0);
    }
  }
  header(name3) {
    return this.response.headers.get(name3);
  }
};
var LimitedSet = class extends Set {
  constructor(maxSize) {
    super();
    this.maxSize = maxSize;
  }
  add(value) {
    if (this.size >= this.maxSize) {
      const iterator = this.values();
      const oldestValue = iterator.next().value;
      this.delete(oldestValue);
    }
    super.add(value);
  }
};
var recentRequests = new LimitedSet(20);
function fetchWithTurboHeaders(url, options = {}) {
  const modifiedHeaders = new Headers(options.headers || {});
  const requestUID = uuid();
  recentRequests.add(requestUID);
  modifiedHeaders.append("X-Turbo-Request-Id", requestUID);
  return window.fetch(url, {
    ...options,
    headers: modifiedHeaders
  });
}
function fetchMethodFromString(method) {
  switch (method.toLowerCase()) {
    case "get":
      return FetchMethod.get;
    case "post":
      return FetchMethod.post;
    case "put":
      return FetchMethod.put;
    case "patch":
      return FetchMethod.patch;
    case "delete":
      return FetchMethod.delete;
  }
}
var FetchMethod = {
  get: "get",
  post: "post",
  put: "put",
  patch: "patch",
  delete: "delete"
};
function fetchEnctypeFromString(encoding) {
  switch (encoding.toLowerCase()) {
    case FetchEnctype.multipart:
      return FetchEnctype.multipart;
    case FetchEnctype.plain:
      return FetchEnctype.plain;
    default:
      return FetchEnctype.urlEncoded;
  }
}
var FetchEnctype = {
  urlEncoded: "application/x-www-form-urlencoded",
  multipart: "multipart/form-data",
  plain: "text/plain"
};
var FetchRequest = class {
  abortController = new AbortController();
  #resolveRequestPromise = (_value) => {
  };
  constructor(delegate, method, location2, requestBody = new URLSearchParams(), target = null, enctype = FetchEnctype.urlEncoded) {
    const [url, body] = buildResourceAndBody(expandURL(location2), method, requestBody, enctype);
    this.delegate = delegate;
    this.url = url;
    this.target = target;
    this.fetchOptions = {
      credentials: "same-origin",
      redirect: "follow",
      method: method.toUpperCase(),
      headers: { ...this.defaultHeaders },
      body,
      signal: this.abortSignal,
      referrer: this.delegate.referrer?.href
    };
    this.enctype = enctype;
  }
  get method() {
    return this.fetchOptions.method;
  }
  set method(value) {
    const fetchBody = this.isSafe ? this.url.searchParams : this.fetchOptions.body || new FormData();
    const fetchMethod = fetchMethodFromString(value) || FetchMethod.get;
    this.url.search = "";
    const [url, body] = buildResourceAndBody(this.url, fetchMethod, fetchBody, this.enctype);
    this.url = url;
    this.fetchOptions.body = body;
    this.fetchOptions.method = fetchMethod.toUpperCase();
  }
  get headers() {
    return this.fetchOptions.headers;
  }
  set headers(value) {
    this.fetchOptions.headers = value;
  }
  get body() {
    if (this.isSafe) {
      return this.url.searchParams;
    } else {
      return this.fetchOptions.body;
    }
  }
  set body(value) {
    this.fetchOptions.body = value;
  }
  get location() {
    return this.url;
  }
  get params() {
    return this.url.searchParams;
  }
  get entries() {
    return this.body ? Array.from(this.body.entries()) : [];
  }
  cancel() {
    this.abortController.abort();
  }
  async perform() {
    const { fetchOptions } = this;
    this.delegate.prepareRequest(this);
    const event = await this.#allowRequestToBeIntercepted(fetchOptions);
    try {
      this.delegate.requestStarted(this);
      if (event.detail.fetchRequest) {
        this.response = event.detail.fetchRequest.response;
      } else {
        this.response = fetchWithTurboHeaders(this.url.href, fetchOptions);
      }
      const response2 = await this.response;
      return await this.receive(response2);
    } catch (error3) {
      if (error3.name !== "AbortError") {
        if (this.#willDelegateErrorHandling(error3)) {
          this.delegate.requestErrored(this, error3);
        }
        throw error3;
      }
    } finally {
      this.delegate.requestFinished(this);
    }
  }
  async receive(response2) {
    const fetchResponse = new FetchResponse(response2);
    const event = dispatch("turbo:before-fetch-response", {
      cancelable: true,
      detail: { fetchResponse },
      target: this.target
    });
    if (event.defaultPrevented) {
      this.delegate.requestPreventedHandlingResponse(this, fetchResponse);
    } else if (fetchResponse.succeeded) {
      this.delegate.requestSucceededWithResponse(this, fetchResponse);
    } else {
      this.delegate.requestFailedWithResponse(this, fetchResponse);
    }
    return fetchResponse;
  }
  get defaultHeaders() {
    return {
      Accept: "text/html, application/xhtml+xml"
    };
  }
  get isSafe() {
    return isSafe(this.method);
  }
  get abortSignal() {
    return this.abortController.signal;
  }
  acceptResponseType(mimeType) {
    this.headers["Accept"] = [mimeType, this.headers["Accept"]].join(", ");
  }
  async #allowRequestToBeIntercepted(fetchOptions) {
    const requestInterception = new Promise((resolve) => this.#resolveRequestPromise = resolve);
    const event = dispatch("turbo:before-fetch-request", {
      cancelable: true,
      detail: {
        fetchOptions,
        url: this.url,
        resume: this.#resolveRequestPromise
      },
      target: this.target
    });
    this.url = event.detail.url;
    if (event.defaultPrevented) await requestInterception;
    return event;
  }
  #willDelegateErrorHandling(error3) {
    const event = dispatch("turbo:fetch-request-error", {
      target: this.target,
      cancelable: true,
      detail: { request: this, error: error3 }
    });
    return !event.defaultPrevented;
  }
};
function isSafe(fetchMethod) {
  return fetchMethodFromString(fetchMethod) == FetchMethod.get;
}
function buildResourceAndBody(resource, method, requestBody, enctype) {
  const searchParams = Array.from(requestBody).length > 0 ? new URLSearchParams(entriesExcludingFiles(requestBody)) : resource.searchParams;
  if (isSafe(method)) {
    return [mergeIntoURLSearchParams(resource, searchParams), null];
  } else if (enctype == FetchEnctype.urlEncoded) {
    return [resource, searchParams];
  } else {
    return [resource, requestBody];
  }
}
function entriesExcludingFiles(requestBody) {
  const entries = [];
  for (const [name3, value] of requestBody) {
    if (value instanceof File) continue;
    else entries.push([name3, value]);
  }
  return entries;
}
function mergeIntoURLSearchParams(url, requestBody) {
  const searchParams = new URLSearchParams(entriesExcludingFiles(requestBody));
  url.search = searchParams.toString();
  return url;
}
var AppearanceObserver = class {
  started = false;
  constructor(delegate, element) {
    this.delegate = delegate;
    this.element = element;
    this.intersectionObserver = new IntersectionObserver(this.intersect);
  }
  start() {
    if (!this.started) {
      this.started = true;
      this.intersectionObserver.observe(this.element);
    }
  }
  stop() {
    if (this.started) {
      this.started = false;
      this.intersectionObserver.unobserve(this.element);
    }
  }
  intersect = (entries) => {
    const lastEntry = entries.slice(-1)[0];
    if (lastEntry?.isIntersecting) {
      this.delegate.elementAppearedInViewport(this.element);
    }
  };
};
var StreamMessage = class {
  static contentType = "text/vnd.turbo-stream.html";
  static wrap(message) {
    if (typeof message == "string") {
      return new this(createDocumentFragment(message));
    } else {
      return message;
    }
  }
  constructor(fragment) {
    this.fragment = importStreamElements(fragment);
  }
};
function importStreamElements(fragment) {
  for (const element of fragment.querySelectorAll("turbo-stream")) {
    const streamElement = document.importNode(element, true);
    for (const inertScriptElement of streamElement.templateElement.content.querySelectorAll("script")) {
      inertScriptElement.replaceWith(activateScriptElement(inertScriptElement));
    }
    element.replaceWith(streamElement);
  }
  return fragment;
}
var PREFETCH_DELAY = 100;
var PrefetchCache = class {
  #prefetchTimeout = null;
  #prefetched = null;
  get(url) {
    if (this.#prefetched && this.#prefetched.url === url && this.#prefetched.expire > Date.now()) {
      return this.#prefetched.request;
    }
  }
  setLater(url, request3, ttl) {
    this.clear();
    this.#prefetchTimeout = setTimeout(() => {
      request3.perform();
      this.set(url, request3, ttl);
      this.#prefetchTimeout = null;
    }, PREFETCH_DELAY);
  }
  set(url, request3, ttl) {
    this.#prefetched = { url, request: request3, expire: new Date((/* @__PURE__ */ new Date()).getTime() + ttl) };
  }
  clear() {
    if (this.#prefetchTimeout) clearTimeout(this.#prefetchTimeout);
    this.#prefetched = null;
  }
};
var cacheTtl = 10 * 1e3;
var prefetchCache = new PrefetchCache();
var FormSubmissionState = {
  initialized: "initialized",
  requesting: "requesting",
  waiting: "waiting",
  receiving: "receiving",
  stopping: "stopping",
  stopped: "stopped"
};
var FormSubmission = class _FormSubmission {
  state = FormSubmissionState.initialized;
  static confirmMethod(message) {
    return Promise.resolve(confirm(message));
  }
  constructor(delegate, formElement, submitter2, mustRedirect = false) {
    const method = getMethod(formElement, submitter2);
    const action = getAction(getFormAction(formElement, submitter2), method);
    const body = buildFormData(formElement, submitter2);
    const enctype = getEnctype(formElement, submitter2);
    this.delegate = delegate;
    this.formElement = formElement;
    this.submitter = submitter2;
    this.fetchRequest = new FetchRequest(this, method, action, body, formElement, enctype);
    this.mustRedirect = mustRedirect;
  }
  get method() {
    return this.fetchRequest.method;
  }
  set method(value) {
    this.fetchRequest.method = value;
  }
  get action() {
    return this.fetchRequest.url.toString();
  }
  set action(value) {
    this.fetchRequest.url = expandURL(value);
  }
  get body() {
    return this.fetchRequest.body;
  }
  get enctype() {
    return this.fetchRequest.enctype;
  }
  get isSafe() {
    return this.fetchRequest.isSafe;
  }
  get location() {
    return this.fetchRequest.url;
  }
  // The submission process
  async start() {
    const { initialized, requesting } = FormSubmissionState;
    const confirmationMessage = getAttribute("data-turbo-confirm", this.submitter, this.formElement);
    if (typeof confirmationMessage === "string") {
      const confirmMethod = typeof config.forms.confirm === "function" ? config.forms.confirm : _FormSubmission.confirmMethod;
      const answer = await confirmMethod(confirmationMessage, this.formElement, this.submitter);
      if (!answer) {
        return;
      }
    }
    if (this.state == initialized) {
      this.state = requesting;
      return this.fetchRequest.perform();
    }
  }
  stop() {
    const { stopping, stopped } = FormSubmissionState;
    if (this.state != stopping && this.state != stopped) {
      this.state = stopping;
      this.fetchRequest.cancel();
      return true;
    }
  }
  // Fetch request delegate
  prepareRequest(request3) {
    if (!request3.isSafe) {
      const token = getCookieValue(getMetaContent("csrf-param")) || getMetaContent("csrf-token");
      if (token) {
        request3.headers["X-CSRF-Token"] = token;
      }
    }
    if (this.requestAcceptsTurboStreamResponse(request3)) {
      request3.acceptResponseType(StreamMessage.contentType);
    }
  }
  requestStarted(_request) {
    this.state = FormSubmissionState.waiting;
    if (this.submitter) config.forms.submitter.beforeSubmit(this.submitter);
    this.setSubmitsWith();
    markAsBusy(this.formElement);
    dispatch("turbo:submit-start", {
      target: this.formElement,
      detail: { formSubmission: this }
    });
    this.delegate.formSubmissionStarted(this);
  }
  requestPreventedHandlingResponse(request3, response2) {
    prefetchCache.clear();
    this.result = { success: response2.succeeded, fetchResponse: response2 };
  }
  requestSucceededWithResponse(request3, response2) {
    if (response2.clientError || response2.serverError) {
      this.delegate.formSubmissionFailedWithResponse(this, response2);
      return;
    }
    prefetchCache.clear();
    if (this.requestMustRedirect(request3) && responseSucceededWithoutRedirect(response2)) {
      const error3 = new Error("Form responses must redirect to another location");
      this.delegate.formSubmissionErrored(this, error3);
    } else {
      this.state = FormSubmissionState.receiving;
      this.result = { success: true, fetchResponse: response2 };
      this.delegate.formSubmissionSucceededWithResponse(this, response2);
    }
  }
  requestFailedWithResponse(request3, response2) {
    this.result = { success: false, fetchResponse: response2 };
    this.delegate.formSubmissionFailedWithResponse(this, response2);
  }
  requestErrored(request3, error3) {
    this.result = { success: false, error: error3 };
    this.delegate.formSubmissionErrored(this, error3);
  }
  requestFinished(_request) {
    this.state = FormSubmissionState.stopped;
    if (this.submitter) config.forms.submitter.afterSubmit(this.submitter);
    this.resetSubmitterText();
    clearBusyState(this.formElement);
    dispatch("turbo:submit-end", {
      target: this.formElement,
      detail: { formSubmission: this, ...this.result }
    });
    this.delegate.formSubmissionFinished(this);
  }
  // Private
  setSubmitsWith() {
    if (!this.submitter || !this.submitsWith) return;
    if (this.submitter.matches("button")) {
      this.originalSubmitText = this.submitter.innerHTML;
      this.submitter.innerHTML = this.submitsWith;
    } else if (this.submitter.matches("input")) {
      const input = this.submitter;
      this.originalSubmitText = input.value;
      input.value = this.submitsWith;
    }
  }
  resetSubmitterText() {
    if (!this.submitter || !this.originalSubmitText) return;
    if (this.submitter.matches("button")) {
      this.submitter.innerHTML = this.originalSubmitText;
    } else if (this.submitter.matches("input")) {
      const input = this.submitter;
      input.value = this.originalSubmitText;
    }
  }
  requestMustRedirect(request3) {
    return !request3.isSafe && this.mustRedirect;
  }
  requestAcceptsTurboStreamResponse(request3) {
    return !request3.isSafe || hasAttribute("data-turbo-stream", this.submitter, this.formElement);
  }
  get submitsWith() {
    return this.submitter?.getAttribute("data-turbo-submits-with");
  }
};
function buildFormData(formElement, submitter2) {
  const formData = new FormData(formElement);
  const name3 = submitter2?.getAttribute("name");
  const value = submitter2?.getAttribute("value");
  if (name3) {
    formData.append(name3, value || "");
  }
  return formData;
}
function getCookieValue(cookieName) {
  if (cookieName != null) {
    const cookies = document.cookie ? document.cookie.split("; ") : [];
    const cookie = cookies.find((cookie2) => cookie2.startsWith(cookieName));
    if (cookie) {
      const value = cookie.split("=").slice(1).join("=");
      return value ? decodeURIComponent(value) : void 0;
    }
  }
}
function responseSucceededWithoutRedirect(response2) {
  return response2.statusCode == 200 && !response2.redirected;
}
function getFormAction(formElement, submitter2) {
  const formElementAction = typeof formElement.action === "string" ? formElement.action : null;
  if (submitter2?.hasAttribute("formaction")) {
    return submitter2.getAttribute("formaction") || "";
  } else {
    return formElement.getAttribute("action") || formElementAction || "";
  }
}
function getAction(formAction, fetchMethod) {
  const action = expandURL(formAction);
  if (isSafe(fetchMethod)) {
    action.search = "";
  }
  return action;
}
function getMethod(formElement, submitter2) {
  const method = submitter2?.getAttribute("formmethod") || formElement.getAttribute("method") || "";
  return fetchMethodFromString(method.toLowerCase()) || FetchMethod.get;
}
function getEnctype(formElement, submitter2) {
  return fetchEnctypeFromString(submitter2?.getAttribute("formenctype") || formElement.enctype);
}
var Snapshot = class {
  constructor(element) {
    this.element = element;
  }
  get activeElement() {
    return this.element.ownerDocument.activeElement;
  }
  get children() {
    return [...this.element.children];
  }
  hasAnchor(anchor) {
    return this.getElementForAnchor(anchor) != null;
  }
  getElementForAnchor(anchor) {
    return anchor ? this.element.querySelector(`[id='${anchor}'], a[name='${anchor}']`) : null;
  }
  get isConnected() {
    return this.element.isConnected;
  }
  get firstAutofocusableElement() {
    return queryAutofocusableElement(this.element);
  }
  get permanentElements() {
    return queryPermanentElementsAll(this.element);
  }
  getPermanentElementById(id2) {
    return getPermanentElementById(this.element, id2);
  }
  getPermanentElementMapForSnapshot(snapshot) {
    const permanentElementMap = {};
    for (const currentPermanentElement of this.permanentElements) {
      const { id: id2 } = currentPermanentElement;
      const newPermanentElement = snapshot.getPermanentElementById(id2);
      if (newPermanentElement) {
        permanentElementMap[id2] = [currentPermanentElement, newPermanentElement];
      }
    }
    return permanentElementMap;
  }
};
function getPermanentElementById(node, id2) {
  return node.querySelector(`#${id2}[data-turbo-permanent]`);
}
function queryPermanentElementsAll(node) {
  return node.querySelectorAll("[id][data-turbo-permanent]");
}
var FormSubmitObserver = class {
  started = false;
  constructor(delegate, eventTarget) {
    this.delegate = delegate;
    this.eventTarget = eventTarget;
  }
  start() {
    if (!this.started) {
      this.eventTarget.addEventListener("submit", this.submitCaptured, true);
      this.started = true;
    }
  }
  stop() {
    if (this.started) {
      this.eventTarget.removeEventListener("submit", this.submitCaptured, true);
      this.started = false;
    }
  }
  submitCaptured = () => {
    this.eventTarget.removeEventListener("submit", this.submitBubbled, false);
    this.eventTarget.addEventListener("submit", this.submitBubbled, false);
  };
  submitBubbled = (event) => {
    if (!event.defaultPrevented) {
      const form = event.target instanceof HTMLFormElement ? event.target : void 0;
      const submitter2 = event.submitter || void 0;
      if (form && submissionDoesNotDismissDialog(form, submitter2) && submissionDoesNotTargetIFrame(form, submitter2) && this.delegate.willSubmitForm(form, submitter2)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.delegate.formSubmitted(form, submitter2);
      }
    }
  };
};
function submissionDoesNotDismissDialog(form, submitter2) {
  const method = submitter2?.getAttribute("formmethod") || form.getAttribute("method");
  return method != "dialog";
}
function submissionDoesNotTargetIFrame(form, submitter2) {
  const target = submitter2?.getAttribute("formtarget") || form.getAttribute("target");
  return doesNotTargetIFrame(target);
}
var View = class {
  #resolveRenderPromise = (_value) => {
  };
  #resolveInterceptionPromise = (_value) => {
  };
  constructor(delegate, element) {
    this.delegate = delegate;
    this.element = element;
  }
  // Scrolling
  scrollToAnchor(anchor) {
    const element = this.snapshot.getElementForAnchor(anchor);
    if (element) {
      this.focusElement(element);
      this.scrollToElement(element);
    } else {
      this.scrollToPosition({ x: 0, y: 0 });
    }
  }
  scrollToAnchorFromLocation(location2) {
    this.scrollToAnchor(getAnchor(location2));
  }
  scrollToElement(element) {
    element.scrollIntoView();
  }
  focusElement(element) {
    if (element instanceof HTMLElement) {
      if (element.hasAttribute("tabindex")) {
        element.focus();
      } else {
        element.setAttribute("tabindex", "-1");
        element.focus();
        element.removeAttribute("tabindex");
      }
    }
  }
  scrollToPosition({ x, y }) {
    this.scrollRoot.scrollTo(x, y);
  }
  scrollToTop() {
    this.scrollToPosition({ x: 0, y: 0 });
  }
  get scrollRoot() {
    return window;
  }
  // Rendering
  async render(renderer) {
    const { isPreview, shouldRender, willRender, newSnapshot: snapshot } = renderer;
    const shouldInvalidate = willRender;
    if (shouldRender) {
      try {
        this.renderPromise = new Promise((resolve) => this.#resolveRenderPromise = resolve);
        this.renderer = renderer;
        await this.prepareToRenderSnapshot(renderer);
        const renderInterception = new Promise((resolve) => this.#resolveInterceptionPromise = resolve);
        const options = { resume: this.#resolveInterceptionPromise, render: this.renderer.renderElement, renderMethod: this.renderer.renderMethod };
        const immediateRender = this.delegate.allowsImmediateRender(snapshot, options);
        if (!immediateRender) await renderInterception;
        await this.renderSnapshot(renderer);
        this.delegate.viewRenderedSnapshot(snapshot, isPreview, this.renderer.renderMethod);
        this.delegate.preloadOnLoadLinksForView(this.element);
        this.finishRenderingSnapshot(renderer);
      } finally {
        delete this.renderer;
        this.#resolveRenderPromise(void 0);
        delete this.renderPromise;
      }
    } else if (shouldInvalidate) {
      this.invalidate(renderer.reloadReason);
    }
  }
  invalidate(reason) {
    this.delegate.viewInvalidated(reason);
  }
  async prepareToRenderSnapshot(renderer) {
    this.markAsPreview(renderer.isPreview);
    await renderer.prepareToRender();
  }
  markAsPreview(isPreview) {
    if (isPreview) {
      this.element.setAttribute("data-turbo-preview", "");
    } else {
      this.element.removeAttribute("data-turbo-preview");
    }
  }
  markVisitDirection(direction) {
    this.element.setAttribute("data-turbo-visit-direction", direction);
  }
  unmarkVisitDirection() {
    this.element.removeAttribute("data-turbo-visit-direction");
  }
  async renderSnapshot(renderer) {
    await renderer.render();
  }
  finishRenderingSnapshot(renderer) {
    renderer.finishRendering();
  }
};
var FrameView = class extends View {
  missing() {
    this.element.innerHTML = `<strong class="turbo-frame-error">Content missing</strong>`;
  }
  get snapshot() {
    return new Snapshot(this.element);
  }
};
var LinkInterceptor = class {
  constructor(delegate, element) {
    this.delegate = delegate;
    this.element = element;
  }
  start() {
    this.element.addEventListener("click", this.clickBubbled);
    document.addEventListener("turbo:click", this.linkClicked);
    document.addEventListener("turbo:before-visit", this.willVisit);
  }
  stop() {
    this.element.removeEventListener("click", this.clickBubbled);
    document.removeEventListener("turbo:click", this.linkClicked);
    document.removeEventListener("turbo:before-visit", this.willVisit);
  }
  clickBubbled = (event) => {
    if (this.clickEventIsSignificant(event)) {
      this.clickEvent = event;
    } else {
      delete this.clickEvent;
    }
  };
  linkClicked = (event) => {
    if (this.clickEvent && this.clickEventIsSignificant(event)) {
      if (this.delegate.shouldInterceptLinkClick(event.target, event.detail.url, event.detail.originalEvent)) {
        this.clickEvent.preventDefault();
        event.preventDefault();
        this.delegate.linkClickIntercepted(event.target, event.detail.url, event.detail.originalEvent);
      }
    }
    delete this.clickEvent;
  };
  willVisit = (_event) => {
    delete this.clickEvent;
  };
  clickEventIsSignificant(event) {
    const target = event.composed ? event.target?.parentElement : event.target;
    const element = findLinkFromClickTarget(target) || target;
    return element instanceof Element && element.closest("turbo-frame, html") == this.element;
  }
};
var LinkClickObserver = class {
  started = false;
  constructor(delegate, eventTarget) {
    this.delegate = delegate;
    this.eventTarget = eventTarget;
  }
  start() {
    if (!this.started) {
      this.eventTarget.addEventListener("click", this.clickCaptured, true);
      this.started = true;
    }
  }
  stop() {
    if (this.started) {
      this.eventTarget.removeEventListener("click", this.clickCaptured, true);
      this.started = false;
    }
  }
  clickCaptured = () => {
    this.eventTarget.removeEventListener("click", this.clickBubbled, false);
    this.eventTarget.addEventListener("click", this.clickBubbled, false);
  };
  clickBubbled = (event) => {
    if (event instanceof MouseEvent && this.clickEventIsSignificant(event)) {
      const target = event.composedPath && event.composedPath()[0] || event.target;
      const link = findLinkFromClickTarget(target);
      if (link && doesNotTargetIFrame(link.target)) {
        const location2 = getLocationForLink(link);
        if (this.delegate.willFollowLinkToLocation(link, location2, event)) {
          event.preventDefault();
          this.delegate.followedLinkToLocation(link, location2);
        }
      }
    }
  };
  clickEventIsSignificant(event) {
    return !(event.target && event.target.isContentEditable || event.defaultPrevented || event.which > 1 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey);
  }
};
var FormLinkClickObserver = class {
  constructor(delegate, element) {
    this.delegate = delegate;
    this.linkInterceptor = new LinkClickObserver(this, element);
  }
  start() {
    this.linkInterceptor.start();
  }
  stop() {
    this.linkInterceptor.stop();
  }
  // Link hover observer delegate
  canPrefetchRequestToLocation(link, location2) {
    return false;
  }
  prefetchAndCacheRequestToLocation(link, location2) {
    return;
  }
  // Link click observer delegate
  willFollowLinkToLocation(link, location2, originalEvent) {
    return this.delegate.willSubmitFormLinkToLocation(link, location2, originalEvent) && (link.hasAttribute("data-turbo-method") || link.hasAttribute("data-turbo-stream"));
  }
  followedLinkToLocation(link, location2) {
    const form = document.createElement("form");
    const type = "hidden";
    for (const [name3, value] of location2.searchParams) {
      form.append(Object.assign(document.createElement("input"), { type, name: name3, value }));
    }
    const action = Object.assign(location2, { search: "" });
    form.setAttribute("data-turbo", "true");
    form.setAttribute("action", action.href);
    form.setAttribute("hidden", "");
    const method = link.getAttribute("data-turbo-method");
    if (method) form.setAttribute("method", method);
    const turboFrame = link.getAttribute("data-turbo-frame");
    if (turboFrame) form.setAttribute("data-turbo-frame", turboFrame);
    const turboAction = getVisitAction(link);
    if (turboAction) form.setAttribute("data-turbo-action", turboAction);
    const turboConfirm = link.getAttribute("data-turbo-confirm");
    if (turboConfirm) form.setAttribute("data-turbo-confirm", turboConfirm);
    const turboStream = link.hasAttribute("data-turbo-stream");
    if (turboStream) form.setAttribute("data-turbo-stream", "");
    this.delegate.submittedFormLinkToLocation(link, location2, form);
    document.body.appendChild(form);
    form.addEventListener("turbo:submit-end", () => form.remove(), { once: true });
    requestAnimationFrame(() => form.requestSubmit());
  }
};
var Bardo = class {
  static async preservingPermanentElements(delegate, permanentElementMap, callback) {
    const bardo = new this(delegate, permanentElementMap);
    bardo.enter();
    await callback();
    bardo.leave();
  }
  constructor(delegate, permanentElementMap) {
    this.delegate = delegate;
    this.permanentElementMap = permanentElementMap;
  }
  enter() {
    for (const id2 in this.permanentElementMap) {
      const [currentPermanentElement, newPermanentElement] = this.permanentElementMap[id2];
      this.delegate.enteringBardo(currentPermanentElement, newPermanentElement);
      this.replaceNewPermanentElementWithPlaceholder(newPermanentElement);
    }
  }
  leave() {
    for (const id2 in this.permanentElementMap) {
      const [currentPermanentElement] = this.permanentElementMap[id2];
      this.replaceCurrentPermanentElementWithClone(currentPermanentElement);
      this.replacePlaceholderWithPermanentElement(currentPermanentElement);
      this.delegate.leavingBardo(currentPermanentElement);
    }
  }
  replaceNewPermanentElementWithPlaceholder(permanentElement) {
    const placeholder = createPlaceholderForPermanentElement(permanentElement);
    permanentElement.replaceWith(placeholder);
  }
  replaceCurrentPermanentElementWithClone(permanentElement) {
    const clone = permanentElement.cloneNode(true);
    permanentElement.replaceWith(clone);
  }
  replacePlaceholderWithPermanentElement(permanentElement) {
    const placeholder = this.getPlaceholderById(permanentElement.id);
    placeholder?.replaceWith(permanentElement);
  }
  getPlaceholderById(id2) {
    return this.placeholders.find((element) => element.content == id2);
  }
  get placeholders() {
    return [...document.querySelectorAll("meta[name=turbo-permanent-placeholder][content]")];
  }
};
function createPlaceholderForPermanentElement(permanentElement) {
  const element = document.createElement("meta");
  element.setAttribute("name", "turbo-permanent-placeholder");
  element.setAttribute("content", permanentElement.id);
  return element;
}
var Renderer = class {
  #activeElement = null;
  static renderElement(currentElement, newElement) {
  }
  constructor(currentSnapshot, newSnapshot, isPreview, willRender = true) {
    this.currentSnapshot = currentSnapshot;
    this.newSnapshot = newSnapshot;
    this.isPreview = isPreview;
    this.willRender = willRender;
    this.renderElement = this.constructor.renderElement;
    this.promise = new Promise((resolve, reject) => this.resolvingFunctions = { resolve, reject });
  }
  get shouldRender() {
    return true;
  }
  get shouldAutofocus() {
    return true;
  }
  get reloadReason() {
    return;
  }
  prepareToRender() {
    return;
  }
  render() {
  }
  finishRendering() {
    if (this.resolvingFunctions) {
      this.resolvingFunctions.resolve();
      delete this.resolvingFunctions;
    }
  }
  async preservingPermanentElements(callback) {
    await Bardo.preservingPermanentElements(this, this.permanentElementMap, callback);
  }
  focusFirstAutofocusableElement() {
    if (this.shouldAutofocus) {
      const element = this.connectedSnapshot.firstAutofocusableElement;
      if (element) {
        element.focus();
      }
    }
  }
  // Bardo delegate
  enteringBardo(currentPermanentElement) {
    if (this.#activeElement) return;
    if (currentPermanentElement.contains(this.currentSnapshot.activeElement)) {
      this.#activeElement = this.currentSnapshot.activeElement;
    }
  }
  leavingBardo(currentPermanentElement) {
    if (currentPermanentElement.contains(this.#activeElement) && this.#activeElement instanceof HTMLElement) {
      this.#activeElement.focus();
      this.#activeElement = null;
    }
  }
  get connectedSnapshot() {
    return this.newSnapshot.isConnected ? this.newSnapshot : this.currentSnapshot;
  }
  get currentElement() {
    return this.currentSnapshot.element;
  }
  get newElement() {
    return this.newSnapshot.element;
  }
  get permanentElementMap() {
    return this.currentSnapshot.getPermanentElementMapForSnapshot(this.newSnapshot);
  }
  get renderMethod() {
    return "replace";
  }
};
var FrameRenderer = class extends Renderer {
  static renderElement(currentElement, newElement) {
    const destinationRange = document.createRange();
    destinationRange.selectNodeContents(currentElement);
    destinationRange.deleteContents();
    const frameElement = newElement;
    const sourceRange = frameElement.ownerDocument?.createRange();
    if (sourceRange) {
      sourceRange.selectNodeContents(frameElement);
      currentElement.appendChild(sourceRange.extractContents());
    }
  }
  constructor(delegate, currentSnapshot, newSnapshot, renderElement, isPreview, willRender = true) {
    super(currentSnapshot, newSnapshot, renderElement, isPreview, willRender);
    this.delegate = delegate;
  }
  get shouldRender() {
    return true;
  }
  async render() {
    await nextRepaint();
    this.preservingPermanentElements(() => {
      this.loadFrameElement();
    });
    this.scrollFrameIntoView();
    await nextRepaint();
    this.focusFirstAutofocusableElement();
    await nextRepaint();
    this.activateScriptElements();
  }
  loadFrameElement() {
    this.delegate.willRenderFrame(this.currentElement, this.newElement);
    this.renderElement(this.currentElement, this.newElement);
  }
  scrollFrameIntoView() {
    if (this.currentElement.autoscroll || this.newElement.autoscroll) {
      const element = this.currentElement.firstElementChild;
      const block = readScrollLogicalPosition(this.currentElement.getAttribute("data-autoscroll-block"), "end");
      const behavior = readScrollBehavior(this.currentElement.getAttribute("data-autoscroll-behavior"), "auto");
      if (element) {
        element.scrollIntoView({ block, behavior });
        return true;
      }
    }
    return false;
  }
  activateScriptElements() {
    for (const inertScriptElement of this.newScriptElements) {
      const activatedScriptElement = activateScriptElement(inertScriptElement);
      inertScriptElement.replaceWith(activatedScriptElement);
    }
  }
  get newScriptElements() {
    return this.currentElement.querySelectorAll("script");
  }
};
function readScrollLogicalPosition(value, defaultValue) {
  if (value == "end" || value == "start" || value == "center" || value == "nearest") {
    return value;
  } else {
    return defaultValue;
  }
}
function readScrollBehavior(value, defaultValue) {
  if (value == "auto" || value == "smooth") {
    return value;
  } else {
    return defaultValue;
  }
}
var Idiomorph = (function() {
  const noOp = () => {
  };
  const defaults = {
    morphStyle: "outerHTML",
    callbacks: {
      beforeNodeAdded: noOp,
      afterNodeAdded: noOp,
      beforeNodeMorphed: noOp,
      afterNodeMorphed: noOp,
      beforeNodeRemoved: noOp,
      afterNodeRemoved: noOp,
      beforeAttributeUpdated: noOp
    },
    head: {
      style: "merge",
      shouldPreserve: (elt) => elt.getAttribute("im-preserve") === "true",
      shouldReAppend: (elt) => elt.getAttribute("im-re-append") === "true",
      shouldRemove: noOp,
      afterHeadMorphed: noOp
    },
    restoreFocus: true
  };
  function morph(oldNode, newContent, config2 = {}) {
    oldNode = normalizeElement(oldNode);
    const newNode = normalizeParent(newContent);
    const ctx = createMorphContext(oldNode, newNode, config2);
    const morphedNodes = saveAndRestoreFocus(ctx, () => {
      return withHeadBlocking(
        ctx,
        oldNode,
        newNode,
        /** @param {MorphContext} ctx */
        (ctx2) => {
          if (ctx2.morphStyle === "innerHTML") {
            morphChildren2(ctx2, oldNode, newNode);
            return Array.from(oldNode.childNodes);
          } else {
            return morphOuterHTML(ctx2, oldNode, newNode);
          }
        }
      );
    });
    ctx.pantry.remove();
    return morphedNodes;
  }
  function morphOuterHTML(ctx, oldNode, newNode) {
    const oldParent = normalizeParent(oldNode);
    let childNodes = Array.from(oldParent.childNodes);
    const index = childNodes.indexOf(oldNode);
    const rightMargin = childNodes.length - (index + 1);
    morphChildren2(
      ctx,
      oldParent,
      newNode,
      // these two optional params are the secret sauce
      oldNode,
      // start point for iteration
      oldNode.nextSibling
      // end point for iteration
    );
    childNodes = Array.from(oldParent.childNodes);
    return childNodes.slice(index, childNodes.length - rightMargin);
  }
  function saveAndRestoreFocus(ctx, fn) {
    if (!ctx.config.restoreFocus) return fn();
    let activeElement2 = (
      /** @type {HTMLInputElement|HTMLTextAreaElement|null} */
      document.activeElement
    );
    if (!(activeElement2 instanceof HTMLInputElement || activeElement2 instanceof HTMLTextAreaElement)) {
      return fn();
    }
    const { id: activeElementId, selectionStart, selectionEnd } = activeElement2;
    const results = fn();
    if (activeElementId && activeElementId !== document.activeElement?.id) {
      activeElement2 = ctx.target.querySelector(`#${activeElementId}`);
      activeElement2?.focus();
    }
    if (activeElement2 && !activeElement2.selectionEnd && selectionEnd) {
      activeElement2.setSelectionRange(selectionStart, selectionEnd);
    }
    return results;
  }
  const morphChildren2 = /* @__PURE__ */ (function() {
    function morphChildren3(ctx, oldParent, newParent, insertionPoint = null, endPoint = null) {
      if (oldParent instanceof HTMLTemplateElement && newParent instanceof HTMLTemplateElement) {
        oldParent = oldParent.content;
        newParent = newParent.content;
      }
      insertionPoint ||= oldParent.firstChild;
      for (const newChild of newParent.childNodes) {
        if (insertionPoint && insertionPoint != endPoint) {
          const bestMatch = findBestMatch(
            ctx,
            newChild,
            insertionPoint,
            endPoint
          );
          if (bestMatch) {
            if (bestMatch !== insertionPoint) {
              removeNodesBetween(ctx, insertionPoint, bestMatch);
            }
            morphNode(bestMatch, newChild, ctx);
            insertionPoint = bestMatch.nextSibling;
            continue;
          }
        }
        if (newChild instanceof Element && ctx.persistentIds.has(newChild.id)) {
          const movedChild = moveBeforeById(
            oldParent,
            newChild.id,
            insertionPoint,
            ctx
          );
          morphNode(movedChild, newChild, ctx);
          insertionPoint = movedChild.nextSibling;
          continue;
        }
        const insertedNode = createNode(
          oldParent,
          newChild,
          insertionPoint,
          ctx
        );
        if (insertedNode) {
          insertionPoint = insertedNode.nextSibling;
        }
      }
      while (insertionPoint && insertionPoint != endPoint) {
        const tempNode = insertionPoint;
        insertionPoint = insertionPoint.nextSibling;
        removeNode(ctx, tempNode);
      }
    }
    function createNode(oldParent, newChild, insertionPoint, ctx) {
      if (ctx.callbacks.beforeNodeAdded(newChild) === false) return null;
      if (ctx.idMap.has(newChild)) {
        const newEmptyChild = document.createElement(
          /** @type {Element} */
          newChild.tagName
        );
        oldParent.insertBefore(newEmptyChild, insertionPoint);
        morphNode(newEmptyChild, newChild, ctx);
        ctx.callbacks.afterNodeAdded(newEmptyChild);
        return newEmptyChild;
      } else {
        const newClonedChild = document.importNode(newChild, true);
        oldParent.insertBefore(newClonedChild, insertionPoint);
        ctx.callbacks.afterNodeAdded(newClonedChild);
        return newClonedChild;
      }
    }
    const findBestMatch = /* @__PURE__ */ (function() {
      function findBestMatch2(ctx, node, startPoint, endPoint) {
        let softMatch = null;
        let nextSibling = node.nextSibling;
        let siblingSoftMatchCount = 0;
        let cursor = startPoint;
        while (cursor && cursor != endPoint) {
          if (isSoftMatch(cursor, node)) {
            if (isIdSetMatch(ctx, cursor, node)) {
              return cursor;
            }
            if (softMatch === null) {
              if (!ctx.idMap.has(cursor)) {
                softMatch = cursor;
              }
            }
          }
          if (softMatch === null && nextSibling && isSoftMatch(cursor, nextSibling)) {
            siblingSoftMatchCount++;
            nextSibling = nextSibling.nextSibling;
            if (siblingSoftMatchCount >= 2) {
              softMatch = void 0;
            }
          }
          if (cursor.contains(document.activeElement)) break;
          cursor = cursor.nextSibling;
        }
        return softMatch || null;
      }
      function isIdSetMatch(ctx, oldNode, newNode) {
        let oldSet = ctx.idMap.get(oldNode);
        let newSet = ctx.idMap.get(newNode);
        if (!newSet || !oldSet) return false;
        for (const id2 of oldSet) {
          if (newSet.has(id2)) {
            return true;
          }
        }
        return false;
      }
      function isSoftMatch(oldNode, newNode) {
        const oldElt = (
          /** @type {Element} */
          oldNode
        );
        const newElt = (
          /** @type {Element} */
          newNode
        );
        return oldElt.nodeType === newElt.nodeType && oldElt.tagName === newElt.tagName && // If oldElt has an `id` with possible state and it doesn't match newElt.id then avoid morphing.
        // We'll still match an anonymous node with an IDed newElt, though, because if it got this far,
        // its not persistent, and new nodes can't have any hidden state.
        (!oldElt.id || oldElt.id === newElt.id);
      }
      return findBestMatch2;
    })();
    function removeNode(ctx, node) {
      if (ctx.idMap.has(node)) {
        moveBefore(ctx.pantry, node, null);
      } else {
        if (ctx.callbacks.beforeNodeRemoved(node) === false) return;
        node.parentNode?.removeChild(node);
        ctx.callbacks.afterNodeRemoved(node);
      }
    }
    function removeNodesBetween(ctx, startInclusive, endExclusive) {
      let cursor = startInclusive;
      while (cursor && cursor !== endExclusive) {
        let tempNode = (
          /** @type {Node} */
          cursor
        );
        cursor = cursor.nextSibling;
        removeNode(ctx, tempNode);
      }
      return cursor;
    }
    function moveBeforeById(parentNode, id2, after2, ctx) {
      const target = (
        /** @type {Element} - will always be found */
        ctx.target.querySelector(`#${id2}`) || ctx.pantry.querySelector(`#${id2}`)
      );
      removeElementFromAncestorsIdMaps(target, ctx);
      moveBefore(parentNode, target, after2);
      return target;
    }
    function removeElementFromAncestorsIdMaps(element, ctx) {
      const id2 = element.id;
      while (element = element.parentNode) {
        let idSet = ctx.idMap.get(element);
        if (idSet) {
          idSet.delete(id2);
          if (!idSet.size) {
            ctx.idMap.delete(element);
          }
        }
      }
    }
    function moveBefore(parentNode, element, after2) {
      if (parentNode.moveBefore) {
        try {
          parentNode.moveBefore(element, after2);
        } catch (e) {
          parentNode.insertBefore(element, after2);
        }
      } else {
        parentNode.insertBefore(element, after2);
      }
    }
    return morphChildren3;
  })();
  const morphNode = /* @__PURE__ */ (function() {
    function morphNode2(oldNode, newContent, ctx) {
      if (ctx.ignoreActive && oldNode === document.activeElement) {
        return null;
      }
      if (ctx.callbacks.beforeNodeMorphed(oldNode, newContent) === false) {
        return oldNode;
      }
      if (oldNode instanceof HTMLHeadElement && ctx.head.ignore) ;
      else if (oldNode instanceof HTMLHeadElement && ctx.head.style !== "morph") {
        handleHeadElement(
          oldNode,
          /** @type {HTMLHeadElement} */
          newContent,
          ctx
        );
      } else {
        morphAttributes(oldNode, newContent, ctx);
        if (!ignoreValueOfActiveElement(oldNode, ctx)) {
          morphChildren2(ctx, oldNode, newContent);
        }
      }
      ctx.callbacks.afterNodeMorphed(oldNode, newContent);
      return oldNode;
    }
    function morphAttributes(oldNode, newNode, ctx) {
      let type = newNode.nodeType;
      if (type === 1) {
        const oldElt = (
          /** @type {Element} */
          oldNode
        );
        const newElt = (
          /** @type {Element} */
          newNode
        );
        const oldAttributes = oldElt.attributes;
        const newAttributes = newElt.attributes;
        for (const newAttribute of newAttributes) {
          if (ignoreAttribute(newAttribute.name, oldElt, "update", ctx)) {
            continue;
          }
          if (oldElt.getAttribute(newAttribute.name) !== newAttribute.value) {
            oldElt.setAttribute(newAttribute.name, newAttribute.value);
          }
        }
        for (let i = oldAttributes.length - 1; 0 <= i; i--) {
          const oldAttribute = oldAttributes[i];
          if (!oldAttribute) continue;
          if (!newElt.hasAttribute(oldAttribute.name)) {
            if (ignoreAttribute(oldAttribute.name, oldElt, "remove", ctx)) {
              continue;
            }
            oldElt.removeAttribute(oldAttribute.name);
          }
        }
        if (!ignoreValueOfActiveElement(oldElt, ctx)) {
          syncInputValue(oldElt, newElt, ctx);
        }
      }
      if (type === 8 || type === 3) {
        if (oldNode.nodeValue !== newNode.nodeValue) {
          oldNode.nodeValue = newNode.nodeValue;
        }
      }
    }
    function syncInputValue(oldElement, newElement, ctx) {
      if (oldElement instanceof HTMLInputElement && newElement instanceof HTMLInputElement && newElement.type !== "file") {
        let newValue = newElement.value;
        let oldValue = oldElement.value;
        syncBooleanAttribute(oldElement, newElement, "checked", ctx);
        syncBooleanAttribute(oldElement, newElement, "disabled", ctx);
        if (!newElement.hasAttribute("value")) {
          if (!ignoreAttribute("value", oldElement, "remove", ctx)) {
            oldElement.value = "";
            oldElement.removeAttribute("value");
          }
        } else if (oldValue !== newValue) {
          if (!ignoreAttribute("value", oldElement, "update", ctx)) {
            oldElement.setAttribute("value", newValue);
            oldElement.value = newValue;
          }
        }
      } else if (oldElement instanceof HTMLOptionElement && newElement instanceof HTMLOptionElement) {
        syncBooleanAttribute(oldElement, newElement, "selected", ctx);
      } else if (oldElement instanceof HTMLTextAreaElement && newElement instanceof HTMLTextAreaElement) {
        let newValue = newElement.value;
        let oldValue = oldElement.value;
        if (ignoreAttribute("value", oldElement, "update", ctx)) {
          return;
        }
        if (newValue !== oldValue) {
          oldElement.value = newValue;
        }
        if (oldElement.firstChild && oldElement.firstChild.nodeValue !== newValue) {
          oldElement.firstChild.nodeValue = newValue;
        }
      }
    }
    function syncBooleanAttribute(oldElement, newElement, attributeName, ctx) {
      const newLiveValue = newElement[attributeName], oldLiveValue = oldElement[attributeName];
      if (newLiveValue !== oldLiveValue) {
        const ignoreUpdate = ignoreAttribute(
          attributeName,
          oldElement,
          "update",
          ctx
        );
        if (!ignoreUpdate) {
          oldElement[attributeName] = newElement[attributeName];
        }
        if (newLiveValue) {
          if (!ignoreUpdate) {
            oldElement.setAttribute(attributeName, "");
          }
        } else {
          if (!ignoreAttribute(attributeName, oldElement, "remove", ctx)) {
            oldElement.removeAttribute(attributeName);
          }
        }
      }
    }
    function ignoreAttribute(attr, element, updateType, ctx) {
      if (attr === "value" && ctx.ignoreActiveValue && element === document.activeElement) {
        return true;
      }
      return ctx.callbacks.beforeAttributeUpdated(attr, element, updateType) === false;
    }
    function ignoreValueOfActiveElement(possibleActiveElement, ctx) {
      return !!ctx.ignoreActiveValue && possibleActiveElement === document.activeElement && possibleActiveElement !== document.body;
    }
    return morphNode2;
  })();
  function withHeadBlocking(ctx, oldNode, newNode, callback) {
    if (ctx.head.block) {
      const oldHead = oldNode.querySelector("head");
      const newHead = newNode.querySelector("head");
      if (oldHead && newHead) {
        const promises = handleHeadElement(oldHead, newHead, ctx);
        return Promise.all(promises).then(() => {
          const newCtx = Object.assign(ctx, {
            head: {
              block: false,
              ignore: true
            }
          });
          return callback(newCtx);
        });
      }
    }
    return callback(ctx);
  }
  function handleHeadElement(oldHead, newHead, ctx) {
    let added = [];
    let removed = [];
    let preserved = [];
    let nodesToAppend = [];
    let srcToNewHeadNodes = /* @__PURE__ */ new Map();
    for (const newHeadChild of newHead.children) {
      srcToNewHeadNodes.set(newHeadChild.outerHTML, newHeadChild);
    }
    for (const currentHeadElt of oldHead.children) {
      let inNewContent = srcToNewHeadNodes.has(currentHeadElt.outerHTML);
      let isReAppended = ctx.head.shouldReAppend(currentHeadElt);
      let isPreserved = ctx.head.shouldPreserve(currentHeadElt);
      if (inNewContent || isPreserved) {
        if (isReAppended) {
          removed.push(currentHeadElt);
        } else {
          srcToNewHeadNodes.delete(currentHeadElt.outerHTML);
          preserved.push(currentHeadElt);
        }
      } else {
        if (ctx.head.style === "append") {
          if (isReAppended) {
            removed.push(currentHeadElt);
            nodesToAppend.push(currentHeadElt);
          }
        } else {
          if (ctx.head.shouldRemove(currentHeadElt) !== false) {
            removed.push(currentHeadElt);
          }
        }
      }
    }
    nodesToAppend.push(...srcToNewHeadNodes.values());
    let promises = [];
    for (const newNode of nodesToAppend) {
      let newElt = (
        /** @type {ChildNode} */
        document.createRange().createContextualFragment(newNode.outerHTML).firstChild
      );
      if (ctx.callbacks.beforeNodeAdded(newElt) !== false) {
        if ("href" in newElt && newElt.href || "src" in newElt && newElt.src) {
          let resolve;
          let promise = new Promise(function(_resolve) {
            resolve = _resolve;
          });
          newElt.addEventListener("load", function() {
            resolve();
          });
          promises.push(promise);
        }
        oldHead.appendChild(newElt);
        ctx.callbacks.afterNodeAdded(newElt);
        added.push(newElt);
      }
    }
    for (const removedElement of removed) {
      if (ctx.callbacks.beforeNodeRemoved(removedElement) !== false) {
        oldHead.removeChild(removedElement);
        ctx.callbacks.afterNodeRemoved(removedElement);
      }
    }
    ctx.head.afterHeadMorphed(oldHead, {
      added,
      kept: preserved,
      removed
    });
    return promises;
  }
  const createMorphContext = /* @__PURE__ */ (function() {
    function createMorphContext2(oldNode, newContent, config2) {
      const { persistentIds, idMap } = createIdMaps(oldNode, newContent);
      const mergedConfig = mergeDefaults(config2);
      const morphStyle = mergedConfig.morphStyle || "outerHTML";
      if (!["innerHTML", "outerHTML"].includes(morphStyle)) {
        throw `Do not understand how to morph style ${morphStyle}`;
      }
      return {
        target: oldNode,
        newContent,
        config: mergedConfig,
        morphStyle,
        ignoreActive: mergedConfig.ignoreActive,
        ignoreActiveValue: mergedConfig.ignoreActiveValue,
        restoreFocus: mergedConfig.restoreFocus,
        idMap,
        persistentIds,
        pantry: createPantry(),
        callbacks: mergedConfig.callbacks,
        head: mergedConfig.head
      };
    }
    function mergeDefaults(config2) {
      let finalConfig = Object.assign({}, defaults);
      Object.assign(finalConfig, config2);
      finalConfig.callbacks = Object.assign(
        {},
        defaults.callbacks,
        config2.callbacks
      );
      finalConfig.head = Object.assign({}, defaults.head, config2.head);
      return finalConfig;
    }
    function createPantry() {
      const pantry = document.createElement("div");
      pantry.hidden = true;
      document.body.insertAdjacentElement("afterend", pantry);
      return pantry;
    }
    function findIdElements(root) {
      let elements = Array.from(root.querySelectorAll("[id]"));
      if (root.id) {
        elements.push(root);
      }
      return elements;
    }
    function populateIdMapWithTree(idMap, persistentIds, root, elements) {
      for (const elt of elements) {
        if (persistentIds.has(elt.id)) {
          let current = elt;
          while (current) {
            let idSet = idMap.get(current);
            if (idSet == null) {
              idSet = /* @__PURE__ */ new Set();
              idMap.set(current, idSet);
            }
            idSet.add(elt.id);
            if (current === root) break;
            current = current.parentElement;
          }
        }
      }
    }
    function createIdMaps(oldContent, newContent) {
      const oldIdElements = findIdElements(oldContent);
      const newIdElements = findIdElements(newContent);
      const persistentIds = createPersistentIds(oldIdElements, newIdElements);
      let idMap = /* @__PURE__ */ new Map();
      populateIdMapWithTree(idMap, persistentIds, oldContent, oldIdElements);
      const newRoot = newContent.__idiomorphRoot || newContent;
      populateIdMapWithTree(idMap, persistentIds, newRoot, newIdElements);
      return { persistentIds, idMap };
    }
    function createPersistentIds(oldIdElements, newIdElements) {
      let duplicateIds = /* @__PURE__ */ new Set();
      let oldIdTagNameMap = /* @__PURE__ */ new Map();
      for (const { id: id2, tagName } of oldIdElements) {
        if (oldIdTagNameMap.has(id2)) {
          duplicateIds.add(id2);
        } else {
          oldIdTagNameMap.set(id2, tagName);
        }
      }
      let persistentIds = /* @__PURE__ */ new Set();
      for (const { id: id2, tagName } of newIdElements) {
        if (persistentIds.has(id2)) {
          duplicateIds.add(id2);
        } else if (oldIdTagNameMap.get(id2) === tagName) {
          persistentIds.add(id2);
        }
      }
      for (const id2 of duplicateIds) {
        persistentIds.delete(id2);
      }
      return persistentIds;
    }
    return createMorphContext2;
  })();
  const { normalizeElement, normalizeParent } = /* @__PURE__ */ (function() {
    const generatedByIdiomorph = /* @__PURE__ */ new WeakSet();
    function normalizeElement2(content) {
      if (content instanceof Document) {
        return content.documentElement;
      } else {
        return content;
      }
    }
    function normalizeParent2(newContent) {
      if (newContent == null) {
        return document.createElement("div");
      } else if (typeof newContent === "string") {
        return normalizeParent2(parseContent(newContent));
      } else if (generatedByIdiomorph.has(
        /** @type {Element} */
        newContent
      )) {
        return (
          /** @type {Element} */
          newContent
        );
      } else if (newContent instanceof Node) {
        if (newContent.parentNode) {
          return createDuckTypedParent(newContent);
        } else {
          const dummyParent = document.createElement("div");
          dummyParent.append(newContent);
          return dummyParent;
        }
      } else {
        const dummyParent = document.createElement("div");
        for (const elt of [...newContent]) {
          dummyParent.append(elt);
        }
        return dummyParent;
      }
    }
    function createDuckTypedParent(newContent) {
      return (
        /** @type {Element} */
        /** @type {unknown} */
        {
          childNodes: [newContent],
          /** @ts-ignore - cover your eyes for a minute, tsc */
          querySelectorAll: (s) => {
            const elements = newContent.querySelectorAll(s);
            return newContent.matches(s) ? [newContent, ...elements] : elements;
          },
          /** @ts-ignore */
          insertBefore: (n, r) => newContent.parentNode.insertBefore(n, r),
          /** @ts-ignore */
          moveBefore: (n, r) => newContent.parentNode.moveBefore(n, r),
          // for later use with populateIdMapWithTree to halt upwards iteration
          get __idiomorphRoot() {
            return newContent;
          }
        }
      );
    }
    function parseContent(newContent) {
      let parser = new DOMParser();
      let contentWithSvgsRemoved = newContent.replace(
        /<svg(\s[^>]*>|>)([\s\S]*?)<\/svg>/gim,
        ""
      );
      if (contentWithSvgsRemoved.match(/<\/html>/) || contentWithSvgsRemoved.match(/<\/head>/) || contentWithSvgsRemoved.match(/<\/body>/)) {
        let content = parser.parseFromString(newContent, "text/html");
        if (contentWithSvgsRemoved.match(/<\/html>/)) {
          generatedByIdiomorph.add(content);
          return content;
        } else {
          let htmlElement = content.firstChild;
          if (htmlElement) {
            generatedByIdiomorph.add(htmlElement);
          }
          return htmlElement;
        }
      } else {
        let responseDoc = parser.parseFromString(
          "<body><template>" + newContent + "</template></body>",
          "text/html"
        );
        let content = (
          /** @type {HTMLTemplateElement} */
          responseDoc.body.querySelector("template").content
        );
        generatedByIdiomorph.add(content);
        return content;
      }
    }
    return { normalizeElement: normalizeElement2, normalizeParent: normalizeParent2 };
  })();
  return {
    morph,
    defaults
  };
})();
function morphElements(currentElement, newElement, { callbacks, ...options } = {}) {
  Idiomorph.morph(currentElement, newElement, {
    ...options,
    callbacks: new DefaultIdiomorphCallbacks(callbacks)
  });
}
function morphChildren(currentElement, newElement, options = {}) {
  morphElements(currentElement, newElement.childNodes, {
    ...options,
    morphStyle: "innerHTML"
  });
}
function shouldRefreshFrameWithMorphing(currentFrame, newFrame) {
  return currentFrame instanceof FrameElement && // newFrame cannot yet be an instance of FrameElement because custom
  // elements don't get initialized until they're attached to the DOM, so
  // test its Element#nodeName instead
  newFrame instanceof Element && newFrame.nodeName === "TURBO-FRAME" && currentFrame.shouldReloadWithMorph && currentFrame.id === newFrame.id && (!newFrame.getAttribute("src") || urlsAreEqual(currentFrame.src, newFrame.getAttribute("src"))) && !currentFrame.closest("[data-turbo-permanent]");
}
function closestFrameReloadableWithMorphing(node) {
  return node.parentElement.closest("turbo-frame[src][refresh=morph]");
}
var DefaultIdiomorphCallbacks = class {
  #beforeNodeMorphed;
  constructor({ beforeNodeMorphed } = {}) {
    this.#beforeNodeMorphed = beforeNodeMorphed || (() => true);
  }
  beforeNodeAdded = (node) => {
    return !(node.id && node.hasAttribute("data-turbo-permanent") && document.getElementById(node.id));
  };
  beforeNodeMorphed = (currentElement, newElement) => {
    if (currentElement instanceof Element) {
      if (!currentElement.hasAttribute("data-turbo-permanent") && this.#beforeNodeMorphed(currentElement, newElement)) {
        const event = dispatch("turbo:before-morph-element", {
          cancelable: true,
          target: currentElement,
          detail: { currentElement, newElement }
        });
        return !event.defaultPrevented;
      } else {
        return false;
      }
    }
  };
  beforeAttributeUpdated = (attributeName, target, mutationType) => {
    const event = dispatch("turbo:before-morph-attribute", {
      cancelable: true,
      target,
      detail: { attributeName, mutationType }
    });
    return !event.defaultPrevented;
  };
  beforeNodeRemoved = (node) => {
    return this.beforeNodeMorphed(node);
  };
  afterNodeMorphed = (currentElement, newElement) => {
    if (currentElement instanceof Element) {
      dispatch("turbo:morph-element", {
        target: currentElement,
        detail: { currentElement, newElement }
      });
    }
  };
};
var MorphingFrameRenderer = class extends FrameRenderer {
  static renderElement(currentElement, newElement) {
    dispatch("turbo:before-frame-morph", {
      target: currentElement,
      detail: { currentElement, newElement }
    });
    morphChildren(currentElement, newElement, {
      callbacks: {
        beforeNodeMorphed: (node, newNode) => {
          if (shouldRefreshFrameWithMorphing(node, newNode) && closestFrameReloadableWithMorphing(node) === currentElement) {
            node.reload();
            return false;
          }
          return true;
        }
      }
    });
  }
  async preservingPermanentElements(callback) {
    return await callback();
  }
};
var ProgressBar = class _ProgressBar {
  static animationDuration = 300;
  /*ms*/
  static get defaultCSS() {
    return unindent`
      .turbo-progress-bar {
        position: fixed;
        display: block;
        top: 0;
        left: 0;
        height: 3px;
        background: #0076ff;
        z-index: 2147483647;
        transition:
          width ${_ProgressBar.animationDuration}ms ease-out,
          opacity ${_ProgressBar.animationDuration / 2}ms ${_ProgressBar.animationDuration / 2}ms ease-in;
        transform: translate3d(0, 0, 0);
      }
    `;
  }
  hiding = false;
  value = 0;
  visible = false;
  constructor() {
    this.stylesheetElement = this.createStylesheetElement();
    this.progressElement = this.createProgressElement();
    this.installStylesheetElement();
    this.setValue(0);
  }
  show() {
    if (!this.visible) {
      this.visible = true;
      this.installProgressElement();
      this.startTrickling();
    }
  }
  hide() {
    if (this.visible && !this.hiding) {
      this.hiding = true;
      this.fadeProgressElement(() => {
        this.uninstallProgressElement();
        this.stopTrickling();
        this.visible = false;
        this.hiding = false;
      });
    }
  }
  setValue(value) {
    this.value = value;
    this.refresh();
  }
  // Private
  installStylesheetElement() {
    document.head.insertBefore(this.stylesheetElement, document.head.firstChild);
  }
  installProgressElement() {
    this.progressElement.style.width = "0";
    this.progressElement.style.opacity = "1";
    document.documentElement.insertBefore(this.progressElement, document.body);
    this.refresh();
  }
  fadeProgressElement(callback) {
    this.progressElement.style.opacity = "0";
    setTimeout(callback, _ProgressBar.animationDuration * 1.5);
  }
  uninstallProgressElement() {
    if (this.progressElement.parentNode) {
      document.documentElement.removeChild(this.progressElement);
    }
  }
  startTrickling() {
    if (!this.trickleInterval) {
      this.trickleInterval = window.setInterval(this.trickle, _ProgressBar.animationDuration);
    }
  }
  stopTrickling() {
    window.clearInterval(this.trickleInterval);
    delete this.trickleInterval;
  }
  trickle = () => {
    this.setValue(this.value + Math.random() / 100);
  };
  refresh() {
    requestAnimationFrame(() => {
      this.progressElement.style.width = `${10 + this.value * 90}%`;
    });
  }
  createStylesheetElement() {
    const element = document.createElement("style");
    element.type = "text/css";
    element.textContent = _ProgressBar.defaultCSS;
    const cspNonce = getCspNonce();
    if (cspNonce) {
      element.nonce = cspNonce;
    }
    return element;
  }
  createProgressElement() {
    const element = document.createElement("div");
    element.className = "turbo-progress-bar";
    return element;
  }
};
var HeadSnapshot = class extends Snapshot {
  detailsByOuterHTML = this.children.filter((element) => !elementIsNoscript(element)).map((element) => elementWithoutNonce(element)).reduce((result, element) => {
    const { outerHTML } = element;
    const details = outerHTML in result ? result[outerHTML] : {
      type: elementType(element),
      tracked: elementIsTracked(element),
      elements: []
    };
    return {
      ...result,
      [outerHTML]: {
        ...details,
        elements: [...details.elements, element]
      }
    };
  }, {});
  get trackedElementSignature() {
    return Object.keys(this.detailsByOuterHTML).filter((outerHTML) => this.detailsByOuterHTML[outerHTML].tracked).join("");
  }
  getScriptElementsNotInSnapshot(snapshot) {
    return this.getElementsMatchingTypeNotInSnapshot("script", snapshot);
  }
  getStylesheetElementsNotInSnapshot(snapshot) {
    return this.getElementsMatchingTypeNotInSnapshot("stylesheet", snapshot);
  }
  getElementsMatchingTypeNotInSnapshot(matchedType, snapshot) {
    return Object.keys(this.detailsByOuterHTML).filter((outerHTML) => !(outerHTML in snapshot.detailsByOuterHTML)).map((outerHTML) => this.detailsByOuterHTML[outerHTML]).filter(({ type }) => type == matchedType).map(({ elements: [element] }) => element);
  }
  get provisionalElements() {
    return Object.keys(this.detailsByOuterHTML).reduce((result, outerHTML) => {
      const { type, tracked, elements } = this.detailsByOuterHTML[outerHTML];
      if (type == null && !tracked) {
        return [...result, ...elements];
      } else if (elements.length > 1) {
        return [...result, ...elements.slice(1)];
      } else {
        return result;
      }
    }, []);
  }
  getMetaValue(name3) {
    const element = this.findMetaElementByName(name3);
    return element ? element.getAttribute("content") : null;
  }
  findMetaElementByName(name3) {
    return Object.keys(this.detailsByOuterHTML).reduce((result, outerHTML) => {
      const {
        elements: [element]
      } = this.detailsByOuterHTML[outerHTML];
      return elementIsMetaElementWithName(element, name3) ? element : result;
    }, void 0 | void 0);
  }
};
function elementType(element) {
  if (elementIsScript(element)) {
    return "script";
  } else if (elementIsStylesheet(element)) {
    return "stylesheet";
  }
}
function elementIsTracked(element) {
  return element.getAttribute("data-turbo-track") == "reload";
}
function elementIsScript(element) {
  const tagName = element.localName;
  return tagName == "script";
}
function elementIsNoscript(element) {
  const tagName = element.localName;
  return tagName == "noscript";
}
function elementIsStylesheet(element) {
  const tagName = element.localName;
  return tagName == "style" || tagName == "link" && element.getAttribute("rel") == "stylesheet";
}
function elementIsMetaElementWithName(element, name3) {
  const tagName = element.localName;
  return tagName == "meta" && element.getAttribute("name") == name3;
}
function elementWithoutNonce(element) {
  if (element.hasAttribute("nonce")) {
    element.setAttribute("nonce", "");
  }
  return element;
}
var PageSnapshot = class _PageSnapshot extends Snapshot {
  static fromHTMLString(html = "") {
    return this.fromDocument(parseHTMLDocument(html));
  }
  static fromElement(element) {
    return this.fromDocument(element.ownerDocument);
  }
  static fromDocument({ documentElement, body, head }) {
    return new this(documentElement, body, new HeadSnapshot(head));
  }
  constructor(documentElement, body, headSnapshot) {
    super(body);
    this.documentElement = documentElement;
    this.headSnapshot = headSnapshot;
  }
  clone() {
    const clonedElement = this.element.cloneNode(true);
    const selectElements = this.element.querySelectorAll("select");
    const clonedSelectElements = clonedElement.querySelectorAll("select");
    for (const [index, source] of selectElements.entries()) {
      const clone = clonedSelectElements[index];
      for (const option of clone.selectedOptions) option.selected = false;
      for (const option of source.selectedOptions) clone.options[option.index].selected = true;
    }
    for (const clonedPasswordInput of clonedElement.querySelectorAll('input[type="password"]')) {
      clonedPasswordInput.value = "";
    }
    return new _PageSnapshot(this.documentElement, clonedElement, this.headSnapshot);
  }
  get lang() {
    return this.documentElement.getAttribute("lang");
  }
  get headElement() {
    return this.headSnapshot.element;
  }
  get rootLocation() {
    const root = this.getSetting("root") ?? "/";
    return expandURL(root);
  }
  get cacheControlValue() {
    return this.getSetting("cache-control");
  }
  get isPreviewable() {
    return this.cacheControlValue != "no-preview";
  }
  get isCacheable() {
    return this.cacheControlValue != "no-cache";
  }
  get isVisitable() {
    return this.getSetting("visit-control") != "reload";
  }
  get prefersViewTransitions() {
    const viewTransitionEnabled = this.getSetting("view-transition") === "true" || this.headSnapshot.getMetaValue("view-transition") === "same-origin";
    return viewTransitionEnabled && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  get shouldMorphPage() {
    return this.getSetting("refresh-method") === "morph";
  }
  get shouldPreserveScrollPosition() {
    return this.getSetting("refresh-scroll") === "preserve";
  }
  // Private
  getSetting(name3) {
    return this.headSnapshot.getMetaValue(`turbo-${name3}`);
  }
};
var ViewTransitioner = class {
  #viewTransitionStarted = false;
  #lastOperation = Promise.resolve();
  renderChange(useViewTransition, render) {
    if (useViewTransition && this.viewTransitionsAvailable && !this.#viewTransitionStarted) {
      this.#viewTransitionStarted = true;
      this.#lastOperation = this.#lastOperation.then(async () => {
        await document.startViewTransition(render).finished;
      });
    } else {
      this.#lastOperation = this.#lastOperation.then(render);
    }
    return this.#lastOperation;
  }
  get viewTransitionsAvailable() {
    return document.startViewTransition;
  }
};
var defaultOptions = {
  action: "advance",
  historyChanged: false,
  visitCachedSnapshot: () => {
  },
  willRender: true,
  updateHistory: true,
  shouldCacheSnapshot: true,
  acceptsStreamResponse: false
};
var TimingMetric = {
  visitStart: "visitStart",
  requestStart: "requestStart",
  requestEnd: "requestEnd",
  visitEnd: "visitEnd"
};
var VisitState = {
  initialized: "initialized",
  started: "started",
  canceled: "canceled",
  failed: "failed",
  completed: "completed"
};
var SystemStatusCode = {
  networkFailure: 0,
  timeoutFailure: -1,
  contentTypeMismatch: -2
};
var Direction = {
  advance: "forward",
  restore: "back",
  replace: "none"
};
var Visit = class {
  identifier = uuid();
  // Required by turbo-ios
  timingMetrics = {};
  followedRedirect = false;
  historyChanged = false;
  scrolled = false;
  shouldCacheSnapshot = true;
  acceptsStreamResponse = false;
  snapshotCached = false;
  state = VisitState.initialized;
  viewTransitioner = new ViewTransitioner();
  constructor(delegate, location2, restorationIdentifier, options = {}) {
    this.delegate = delegate;
    this.location = location2;
    this.restorationIdentifier = restorationIdentifier || uuid();
    const {
      action,
      historyChanged,
      referrer,
      snapshot,
      snapshotHTML,
      response: response2,
      visitCachedSnapshot,
      willRender,
      updateHistory,
      shouldCacheSnapshot,
      acceptsStreamResponse,
      direction
    } = {
      ...defaultOptions,
      ...options
    };
    this.action = action;
    this.historyChanged = historyChanged;
    this.referrer = referrer;
    this.snapshot = snapshot;
    this.snapshotHTML = snapshotHTML;
    this.response = response2;
    this.isSamePage = this.delegate.locationWithActionIsSamePage(this.location, this.action);
    this.isPageRefresh = this.view.isPageRefresh(this);
    this.visitCachedSnapshot = visitCachedSnapshot;
    this.willRender = willRender;
    this.updateHistory = updateHistory;
    this.scrolled = !willRender;
    this.shouldCacheSnapshot = shouldCacheSnapshot;
    this.acceptsStreamResponse = acceptsStreamResponse;
    this.direction = direction || Direction[action];
  }
  get adapter() {
    return this.delegate.adapter;
  }
  get view() {
    return this.delegate.view;
  }
  get history() {
    return this.delegate.history;
  }
  get restorationData() {
    return this.history.getRestorationDataForIdentifier(this.restorationIdentifier);
  }
  get silent() {
    return this.isSamePage;
  }
  start() {
    if (this.state == VisitState.initialized) {
      this.recordTimingMetric(TimingMetric.visitStart);
      this.state = VisitState.started;
      this.adapter.visitStarted(this);
      this.delegate.visitStarted(this);
    }
  }
  cancel() {
    if (this.state == VisitState.started) {
      if (this.request) {
        this.request.cancel();
      }
      this.cancelRender();
      this.state = VisitState.canceled;
    }
  }
  complete() {
    if (this.state == VisitState.started) {
      this.recordTimingMetric(TimingMetric.visitEnd);
      this.adapter.visitCompleted(this);
      this.state = VisitState.completed;
      this.followRedirect();
      if (!this.followedRedirect) {
        this.delegate.visitCompleted(this);
      }
    }
  }
  fail() {
    if (this.state == VisitState.started) {
      this.state = VisitState.failed;
      this.adapter.visitFailed(this);
      this.delegate.visitCompleted(this);
    }
  }
  changeHistory() {
    if (!this.historyChanged && this.updateHistory) {
      const actionForHistory = this.location.href === this.referrer?.href ? "replace" : this.action;
      const method = getHistoryMethodForAction(actionForHistory);
      this.history.update(method, this.location, this.restorationIdentifier);
      this.historyChanged = true;
    }
  }
  issueRequest() {
    if (this.hasPreloadedResponse()) {
      this.simulateRequest();
    } else if (this.shouldIssueRequest() && !this.request) {
      this.request = new FetchRequest(this, FetchMethod.get, this.location);
      this.request.perform();
    }
  }
  simulateRequest() {
    if (this.response) {
      this.startRequest();
      this.recordResponse();
      this.finishRequest();
    }
  }
  startRequest() {
    this.recordTimingMetric(TimingMetric.requestStart);
    this.adapter.visitRequestStarted(this);
  }
  recordResponse(response2 = this.response) {
    this.response = response2;
    if (response2) {
      const { statusCode } = response2;
      if (isSuccessful(statusCode)) {
        this.adapter.visitRequestCompleted(this);
      } else {
        this.adapter.visitRequestFailedWithStatusCode(this, statusCode);
      }
    }
  }
  finishRequest() {
    this.recordTimingMetric(TimingMetric.requestEnd);
    this.adapter.visitRequestFinished(this);
  }
  loadResponse() {
    if (this.response) {
      const { statusCode, responseHTML } = this.response;
      this.render(async () => {
        if (this.shouldCacheSnapshot) this.cacheSnapshot();
        if (this.view.renderPromise) await this.view.renderPromise;
        if (isSuccessful(statusCode) && responseHTML != null) {
          const snapshot = PageSnapshot.fromHTMLString(responseHTML);
          await this.renderPageSnapshot(snapshot, false);
          this.adapter.visitRendered(this);
          this.complete();
        } else {
          await this.view.renderError(PageSnapshot.fromHTMLString(responseHTML), this);
          this.adapter.visitRendered(this);
          this.fail();
        }
      });
    }
  }
  getCachedSnapshot() {
    const snapshot = this.view.getCachedSnapshotForLocation(this.location) || this.getPreloadedSnapshot();
    if (snapshot && (!getAnchor(this.location) || snapshot.hasAnchor(getAnchor(this.location)))) {
      if (this.action == "restore" || snapshot.isPreviewable) {
        return snapshot;
      }
    }
  }
  getPreloadedSnapshot() {
    if (this.snapshotHTML) {
      return PageSnapshot.fromHTMLString(this.snapshotHTML);
    }
  }
  hasCachedSnapshot() {
    return this.getCachedSnapshot() != null;
  }
  loadCachedSnapshot() {
    const snapshot = this.getCachedSnapshot();
    if (snapshot) {
      const isPreview = this.shouldIssueRequest();
      this.render(async () => {
        this.cacheSnapshot();
        if (this.isSamePage || this.isPageRefresh) {
          this.adapter.visitRendered(this);
        } else {
          if (this.view.renderPromise) await this.view.renderPromise;
          await this.renderPageSnapshot(snapshot, isPreview);
          this.adapter.visitRendered(this);
          if (!isPreview) {
            this.complete();
          }
        }
      });
    }
  }
  followRedirect() {
    if (this.redirectedToLocation && !this.followedRedirect && this.response?.redirected) {
      this.adapter.visitProposedToLocation(this.redirectedToLocation, {
        action: "replace",
        response: this.response,
        shouldCacheSnapshot: false,
        willRender: false
      });
      this.followedRedirect = true;
    }
  }
  goToSamePageAnchor() {
    if (this.isSamePage) {
      this.render(async () => {
        this.cacheSnapshot();
        this.performScroll();
        this.changeHistory();
        this.adapter.visitRendered(this);
      });
    }
  }
  // Fetch request delegate
  prepareRequest(request3) {
    if (this.acceptsStreamResponse) {
      request3.acceptResponseType(StreamMessage.contentType);
    }
  }
  requestStarted() {
    this.startRequest();
  }
  requestPreventedHandlingResponse(_request, _response) {
  }
  async requestSucceededWithResponse(request3, response2) {
    const responseHTML = await response2.responseHTML;
    const { redirected, statusCode } = response2;
    if (responseHTML == void 0) {
      this.recordResponse({
        statusCode: SystemStatusCode.contentTypeMismatch,
        redirected
      });
    } else {
      this.redirectedToLocation = response2.redirected ? response2.location : void 0;
      this.recordResponse({ statusCode, responseHTML, redirected });
    }
  }
  async requestFailedWithResponse(request3, response2) {
    const responseHTML = await response2.responseHTML;
    const { redirected, statusCode } = response2;
    if (responseHTML == void 0) {
      this.recordResponse({
        statusCode: SystemStatusCode.contentTypeMismatch,
        redirected
      });
    } else {
      this.recordResponse({ statusCode, responseHTML, redirected });
    }
  }
  requestErrored(_request, _error) {
    this.recordResponse({
      statusCode: SystemStatusCode.networkFailure,
      redirected: false
    });
  }
  requestFinished() {
    this.finishRequest();
  }
  // Scrolling
  performScroll() {
    if (!this.scrolled && !this.view.forceReloaded && !this.view.shouldPreserveScrollPosition(this)) {
      if (this.action == "restore") {
        this.scrollToRestoredPosition() || this.scrollToAnchor() || this.view.scrollToTop();
      } else {
        this.scrollToAnchor() || this.view.scrollToTop();
      }
      if (this.isSamePage) {
        this.delegate.visitScrolledToSamePageLocation(this.view.lastRenderedLocation, this.location);
      }
      this.scrolled = true;
    }
  }
  scrollToRestoredPosition() {
    const { scrollPosition } = this.restorationData;
    if (scrollPosition) {
      this.view.scrollToPosition(scrollPosition);
      return true;
    }
  }
  scrollToAnchor() {
    const anchor = getAnchor(this.location);
    if (anchor != null) {
      this.view.scrollToAnchor(anchor);
      return true;
    }
  }
  // Instrumentation
  recordTimingMetric(metric) {
    this.timingMetrics[metric] = (/* @__PURE__ */ new Date()).getTime();
  }
  getTimingMetrics() {
    return { ...this.timingMetrics };
  }
  // Private
  hasPreloadedResponse() {
    return typeof this.response == "object";
  }
  shouldIssueRequest() {
    if (this.isSamePage) {
      return false;
    } else if (this.action == "restore") {
      return !this.hasCachedSnapshot();
    } else {
      return this.willRender;
    }
  }
  cacheSnapshot() {
    if (!this.snapshotCached) {
      this.view.cacheSnapshot(this.snapshot).then((snapshot) => snapshot && this.visitCachedSnapshot(snapshot));
      this.snapshotCached = true;
    }
  }
  async render(callback) {
    this.cancelRender();
    await new Promise((resolve) => {
      this.frame = document.visibilityState === "hidden" ? setTimeout(() => resolve(), 0) : requestAnimationFrame(() => resolve());
    });
    await callback();
    delete this.frame;
  }
  async renderPageSnapshot(snapshot, isPreview) {
    await this.viewTransitioner.renderChange(this.view.shouldTransitionTo(snapshot), async () => {
      await this.view.renderPage(snapshot, isPreview, this.willRender, this);
      this.performScroll();
    });
  }
  cancelRender() {
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      delete this.frame;
    }
  }
};
function isSuccessful(statusCode) {
  return statusCode >= 200 && statusCode < 300;
}
var BrowserAdapter = class {
  progressBar = new ProgressBar();
  constructor(session2) {
    this.session = session2;
  }
  visitProposedToLocation(location2, options) {
    if (locationIsVisitable(location2, this.navigator.rootLocation)) {
      this.navigator.startVisit(location2, options?.restorationIdentifier || uuid(), options);
    } else {
      window.location.href = location2.toString();
    }
  }
  visitStarted(visit2) {
    this.location = visit2.location;
    this.redirectedToLocation = null;
    visit2.loadCachedSnapshot();
    visit2.issueRequest();
    visit2.goToSamePageAnchor();
  }
  visitRequestStarted(visit2) {
    this.progressBar.setValue(0);
    if (visit2.hasCachedSnapshot() || visit2.action != "restore") {
      this.showVisitProgressBarAfterDelay();
    } else {
      this.showProgressBar();
    }
  }
  visitRequestCompleted(visit2) {
    visit2.loadResponse();
    if (visit2.response.redirected) {
      this.redirectedToLocation = visit2.redirectedToLocation;
    }
  }
  visitRequestFailedWithStatusCode(visit2, statusCode) {
    switch (statusCode) {
      case SystemStatusCode.networkFailure:
      case SystemStatusCode.timeoutFailure:
      case SystemStatusCode.contentTypeMismatch:
        return this.reload({
          reason: "request_failed",
          context: {
            statusCode
          }
        });
      default:
        return visit2.loadResponse();
    }
  }
  visitRequestFinished(_visit) {
  }
  visitCompleted(_visit) {
    this.progressBar.setValue(1);
    this.hideVisitProgressBar();
  }
  pageInvalidated(reason) {
    this.reload(reason);
  }
  visitFailed(_visit) {
    this.progressBar.setValue(1);
    this.hideVisitProgressBar();
  }
  visitRendered(_visit) {
  }
  // Link prefetching
  linkPrefetchingIsEnabledForLocation(location2) {
    return true;
  }
  // Form Submission Delegate
  formSubmissionStarted(_formSubmission) {
    this.progressBar.setValue(0);
    this.showFormProgressBarAfterDelay();
  }
  formSubmissionFinished(_formSubmission) {
    this.progressBar.setValue(1);
    this.hideFormProgressBar();
  }
  // Private
  showVisitProgressBarAfterDelay() {
    this.visitProgressBarTimeout = window.setTimeout(this.showProgressBar, this.session.progressBarDelay);
  }
  hideVisitProgressBar() {
    this.progressBar.hide();
    if (this.visitProgressBarTimeout != null) {
      window.clearTimeout(this.visitProgressBarTimeout);
      delete this.visitProgressBarTimeout;
    }
  }
  showFormProgressBarAfterDelay() {
    if (this.formProgressBarTimeout == null) {
      this.formProgressBarTimeout = window.setTimeout(this.showProgressBar, this.session.progressBarDelay);
    }
  }
  hideFormProgressBar() {
    this.progressBar.hide();
    if (this.formProgressBarTimeout != null) {
      window.clearTimeout(this.formProgressBarTimeout);
      delete this.formProgressBarTimeout;
    }
  }
  showProgressBar = () => {
    this.progressBar.show();
  };
  reload(reason) {
    dispatch("turbo:reload", { detail: reason });
    window.location.href = (this.redirectedToLocation || this.location)?.toString() || window.location.href;
  }
  get navigator() {
    return this.session.navigator;
  }
};
var CacheObserver = class {
  selector = "[data-turbo-temporary]";
  deprecatedSelector = "[data-turbo-cache=false]";
  started = false;
  start() {
    if (!this.started) {
      this.started = true;
      addEventListener("turbo:before-cache", this.removeTemporaryElements, false);
    }
  }
  stop() {
    if (this.started) {
      this.started = false;
      removeEventListener("turbo:before-cache", this.removeTemporaryElements, false);
    }
  }
  removeTemporaryElements = (_event) => {
    for (const element of this.temporaryElements) {
      element.remove();
    }
  };
  get temporaryElements() {
    return [...document.querySelectorAll(this.selector), ...this.temporaryElementsWithDeprecation];
  }
  get temporaryElementsWithDeprecation() {
    const elements = document.querySelectorAll(this.deprecatedSelector);
    if (elements.length) {
      console.warn(
        `The ${this.deprecatedSelector} selector is deprecated and will be removed in a future version. Use ${this.selector} instead.`
      );
    }
    return [...elements];
  }
};
var FrameRedirector = class {
  constructor(session2, element) {
    this.session = session2;
    this.element = element;
    this.linkInterceptor = new LinkInterceptor(this, element);
    this.formSubmitObserver = new FormSubmitObserver(this, element);
  }
  start() {
    this.linkInterceptor.start();
    this.formSubmitObserver.start();
  }
  stop() {
    this.linkInterceptor.stop();
    this.formSubmitObserver.stop();
  }
  // Link interceptor delegate
  shouldInterceptLinkClick(element, _location, _event) {
    return this.#shouldRedirect(element);
  }
  linkClickIntercepted(element, url, event) {
    const frame = this.#findFrameElement(element);
    if (frame) {
      frame.delegate.linkClickIntercepted(element, url, event);
    }
  }
  // Form submit observer delegate
  willSubmitForm(element, submitter2) {
    return element.closest("turbo-frame") == null && this.#shouldSubmit(element, submitter2) && this.#shouldRedirect(element, submitter2);
  }
  formSubmitted(element, submitter2) {
    const frame = this.#findFrameElement(element, submitter2);
    if (frame) {
      frame.delegate.formSubmitted(element, submitter2);
    }
  }
  #shouldSubmit(form, submitter2) {
    const action = getAction$1(form, submitter2);
    const meta = this.element.ownerDocument.querySelector(`meta[name="turbo-root"]`);
    const rootLocation = expandURL(meta?.content ?? "/");
    return this.#shouldRedirect(form, submitter2) && locationIsVisitable(action, rootLocation);
  }
  #shouldRedirect(element, submitter2) {
    const isNavigatable = element instanceof HTMLFormElement ? this.session.submissionIsNavigatable(element, submitter2) : this.session.elementIsNavigatable(element);
    if (isNavigatable) {
      const frame = this.#findFrameElement(element, submitter2);
      return frame ? frame != element.closest("turbo-frame") : false;
    } else {
      return false;
    }
  }
  #findFrameElement(element, submitter2) {
    const id2 = submitter2?.getAttribute("data-turbo-frame") || element.getAttribute("data-turbo-frame");
    if (id2 && id2 != "_top") {
      const frame = this.element.querySelector(`#${id2}:not([disabled])`);
      if (frame instanceof FrameElement) {
        return frame;
      }
    }
  }
};
var History = class {
  location;
  restorationIdentifier = uuid();
  restorationData = {};
  started = false;
  pageLoaded = false;
  currentIndex = 0;
  constructor(delegate) {
    this.delegate = delegate;
  }
  start() {
    if (!this.started) {
      addEventListener("popstate", this.onPopState, false);
      addEventListener("load", this.onPageLoad, false);
      this.currentIndex = history.state?.turbo?.restorationIndex || 0;
      this.started = true;
      this.replace(new URL(window.location.href));
    }
  }
  stop() {
    if (this.started) {
      removeEventListener("popstate", this.onPopState, false);
      removeEventListener("load", this.onPageLoad, false);
      this.started = false;
    }
  }
  push(location2, restorationIdentifier) {
    this.update(history.pushState, location2, restorationIdentifier);
  }
  replace(location2, restorationIdentifier) {
    this.update(history.replaceState, location2, restorationIdentifier);
  }
  update(method, location2, restorationIdentifier = uuid()) {
    if (method === history.pushState) ++this.currentIndex;
    const state = { turbo: { restorationIdentifier, restorationIndex: this.currentIndex } };
    method.call(history, state, "", location2.href);
    this.location = location2;
    this.restorationIdentifier = restorationIdentifier;
  }
  // Restoration data
  getRestorationDataForIdentifier(restorationIdentifier) {
    return this.restorationData[restorationIdentifier] || {};
  }
  updateRestorationData(additionalData) {
    const { restorationIdentifier } = this;
    const restorationData = this.restorationData[restorationIdentifier];
    this.restorationData[restorationIdentifier] = {
      ...restorationData,
      ...additionalData
    };
  }
  // Scroll restoration
  assumeControlOfScrollRestoration() {
    if (!this.previousScrollRestoration) {
      this.previousScrollRestoration = history.scrollRestoration ?? "auto";
      history.scrollRestoration = "manual";
    }
  }
  relinquishControlOfScrollRestoration() {
    if (this.previousScrollRestoration) {
      history.scrollRestoration = this.previousScrollRestoration;
      delete this.previousScrollRestoration;
    }
  }
  // Event handlers
  onPopState = (event) => {
    if (this.shouldHandlePopState()) {
      const { turbo } = event.state || {};
      if (turbo) {
        this.location = new URL(window.location.href);
        const { restorationIdentifier, restorationIndex } = turbo;
        this.restorationIdentifier = restorationIdentifier;
        const direction = restorationIndex > this.currentIndex ? "forward" : "back";
        this.delegate.historyPoppedToLocationWithRestorationIdentifierAndDirection(this.location, restorationIdentifier, direction);
        this.currentIndex = restorationIndex;
      }
    }
  };
  onPageLoad = async (_event) => {
    await nextMicrotask();
    this.pageLoaded = true;
  };
  // Private
  shouldHandlePopState() {
    return this.pageIsLoaded();
  }
  pageIsLoaded() {
    return this.pageLoaded || document.readyState == "complete";
  }
};
var LinkPrefetchObserver = class {
  started = false;
  #prefetchedLink = null;
  constructor(delegate, eventTarget) {
    this.delegate = delegate;
    this.eventTarget = eventTarget;
  }
  start() {
    if (this.started) return;
    if (this.eventTarget.readyState === "loading") {
      this.eventTarget.addEventListener("DOMContentLoaded", this.#enable, { once: true });
    } else {
      this.#enable();
    }
  }
  stop() {
    if (!this.started) return;
    this.eventTarget.removeEventListener("mouseenter", this.#tryToPrefetchRequest, {
      capture: true,
      passive: true
    });
    this.eventTarget.removeEventListener("mouseleave", this.#cancelRequestIfObsolete, {
      capture: true,
      passive: true
    });
    this.eventTarget.removeEventListener("turbo:before-fetch-request", this.#tryToUsePrefetchedRequest, true);
    this.started = false;
  }
  #enable = () => {
    this.eventTarget.addEventListener("mouseenter", this.#tryToPrefetchRequest, {
      capture: true,
      passive: true
    });
    this.eventTarget.addEventListener("mouseleave", this.#cancelRequestIfObsolete, {
      capture: true,
      passive: true
    });
    this.eventTarget.addEventListener("turbo:before-fetch-request", this.#tryToUsePrefetchedRequest, true);
    this.started = true;
  };
  #tryToPrefetchRequest = (event) => {
    if (getMetaContent("turbo-prefetch") === "false") return;
    const target = event.target;
    const isLink = target.matches && target.matches("a[href]:not([target^=_]):not([download])");
    if (isLink && this.#isPrefetchable(target)) {
      const link = target;
      const location2 = getLocationForLink(link);
      if (this.delegate.canPrefetchRequestToLocation(link, location2)) {
        this.#prefetchedLink = link;
        const fetchRequest = new FetchRequest(
          this,
          FetchMethod.get,
          location2,
          new URLSearchParams(),
          target
        );
        fetchRequest.fetchOptions.priority = "low";
        prefetchCache.setLater(location2.toString(), fetchRequest, this.#cacheTtl);
      }
    }
  };
  #cancelRequestIfObsolete = (event) => {
    if (event.target === this.#prefetchedLink) this.#cancelPrefetchRequest();
  };
  #cancelPrefetchRequest = () => {
    prefetchCache.clear();
    this.#prefetchedLink = null;
  };
  #tryToUsePrefetchedRequest = (event) => {
    if (event.target.tagName !== "FORM" && event.detail.fetchOptions.method === "GET") {
      const cached = prefetchCache.get(event.detail.url.toString());
      if (cached) {
        event.detail.fetchRequest = cached;
      }
      prefetchCache.clear();
    }
  };
  prepareRequest(request3) {
    const link = request3.target;
    request3.headers["X-Sec-Purpose"] = "prefetch";
    const turboFrame = link.closest("turbo-frame");
    const turboFrameTarget = link.getAttribute("data-turbo-frame") || turboFrame?.getAttribute("target") || turboFrame?.id;
    if (turboFrameTarget && turboFrameTarget !== "_top") {
      request3.headers["Turbo-Frame"] = turboFrameTarget;
    }
  }
  // Fetch request interface
  requestSucceededWithResponse() {
  }
  requestStarted(fetchRequest) {
  }
  requestErrored(fetchRequest) {
  }
  requestFinished(fetchRequest) {
  }
  requestPreventedHandlingResponse(fetchRequest, fetchResponse) {
  }
  requestFailedWithResponse(fetchRequest, fetchResponse) {
  }
  get #cacheTtl() {
    return Number(getMetaContent("turbo-prefetch-cache-time")) || cacheTtl;
  }
  #isPrefetchable(link) {
    const href = link.getAttribute("href");
    if (!href) return false;
    if (unfetchableLink(link)) return false;
    if (linkToTheSamePage(link)) return false;
    if (linkOptsOut(link)) return false;
    if (nonSafeLink(link)) return false;
    if (eventPrevented(link)) return false;
    return true;
  }
};
var unfetchableLink = (link) => {
  return link.origin !== document.location.origin || !["http:", "https:"].includes(link.protocol) || link.hasAttribute("target");
};
var linkToTheSamePage = (link) => {
  return link.pathname + link.search === document.location.pathname + document.location.search || link.href.startsWith("#");
};
var linkOptsOut = (link) => {
  if (link.getAttribute("data-turbo-prefetch") === "false") return true;
  if (link.getAttribute("data-turbo") === "false") return true;
  const turboPrefetchParent = findClosestRecursively(link, "[data-turbo-prefetch]");
  if (turboPrefetchParent && turboPrefetchParent.getAttribute("data-turbo-prefetch") === "false") return true;
  return false;
};
var nonSafeLink = (link) => {
  const turboMethod = link.getAttribute("data-turbo-method");
  if (turboMethod && turboMethod.toLowerCase() !== "get") return true;
  if (isUJS(link)) return true;
  if (link.hasAttribute("data-turbo-confirm")) return true;
  if (link.hasAttribute("data-turbo-stream")) return true;
  return false;
};
var isUJS = (link) => {
  return link.hasAttribute("data-remote") || link.hasAttribute("data-behavior") || link.hasAttribute("data-confirm") || link.hasAttribute("data-method");
};
var eventPrevented = (link) => {
  const event = dispatch("turbo:before-prefetch", { target: link, cancelable: true });
  return event.defaultPrevented;
};
var Navigator = class {
  constructor(delegate) {
    this.delegate = delegate;
  }
  proposeVisit(location2, options = {}) {
    if (this.delegate.allowsVisitingLocationWithAction(location2, options.action)) {
      this.delegate.visitProposedToLocation(location2, options);
    }
  }
  startVisit(locatable, restorationIdentifier, options = {}) {
    this.stop();
    this.currentVisit = new Visit(this, expandURL(locatable), restorationIdentifier, {
      referrer: this.location,
      ...options
    });
    this.currentVisit.start();
  }
  submitForm(form, submitter2) {
    this.stop();
    this.formSubmission = new FormSubmission(this, form, submitter2, true);
    this.formSubmission.start();
  }
  stop() {
    if (this.formSubmission) {
      this.formSubmission.stop();
      delete this.formSubmission;
    }
    if (this.currentVisit) {
      this.currentVisit.cancel();
      delete this.currentVisit;
    }
  }
  get adapter() {
    return this.delegate.adapter;
  }
  get view() {
    return this.delegate.view;
  }
  get rootLocation() {
    return this.view.snapshot.rootLocation;
  }
  get history() {
    return this.delegate.history;
  }
  // Form submission delegate
  formSubmissionStarted(formSubmission) {
    if (typeof this.adapter.formSubmissionStarted === "function") {
      this.adapter.formSubmissionStarted(formSubmission);
    }
  }
  async formSubmissionSucceededWithResponse(formSubmission, fetchResponse) {
    if (formSubmission == this.formSubmission) {
      const responseHTML = await fetchResponse.responseHTML;
      if (responseHTML) {
        const shouldCacheSnapshot = formSubmission.isSafe;
        if (!shouldCacheSnapshot) {
          this.view.clearSnapshotCache();
        }
        const { statusCode, redirected } = fetchResponse;
        const action = this.#getActionForFormSubmission(formSubmission, fetchResponse);
        const visitOptions = {
          action,
          shouldCacheSnapshot,
          response: { statusCode, responseHTML, redirected }
        };
        this.proposeVisit(fetchResponse.location, visitOptions);
      }
    }
  }
  async formSubmissionFailedWithResponse(formSubmission, fetchResponse) {
    const responseHTML = await fetchResponse.responseHTML;
    if (responseHTML) {
      const snapshot = PageSnapshot.fromHTMLString(responseHTML);
      if (fetchResponse.serverError) {
        await this.view.renderError(snapshot, this.currentVisit);
      } else {
        await this.view.renderPage(snapshot, false, true, this.currentVisit);
      }
      if (!snapshot.shouldPreserveScrollPosition) {
        this.view.scrollToTop();
      }
      this.view.clearSnapshotCache();
    }
  }
  formSubmissionErrored(formSubmission, error3) {
    console.error(error3);
  }
  formSubmissionFinished(formSubmission) {
    if (typeof this.adapter.formSubmissionFinished === "function") {
      this.adapter.formSubmissionFinished(formSubmission);
    }
  }
  // Link prefetching
  linkPrefetchingIsEnabledForLocation(location2) {
    if (typeof this.adapter.linkPrefetchingIsEnabledForLocation === "function") {
      return this.adapter.linkPrefetchingIsEnabledForLocation(location2);
    }
    return true;
  }
  // Visit delegate
  visitStarted(visit2) {
    this.delegate.visitStarted(visit2);
  }
  visitCompleted(visit2) {
    this.delegate.visitCompleted(visit2);
    delete this.currentVisit;
  }
  locationWithActionIsSamePage(location2, action) {
    const anchor = getAnchor(location2);
    const currentAnchor = getAnchor(this.view.lastRenderedLocation);
    const isRestorationToTop = action === "restore" && typeof anchor === "undefined";
    return action !== "replace" && getRequestURL(location2) === getRequestURL(this.view.lastRenderedLocation) && (isRestorationToTop || anchor != null && anchor !== currentAnchor);
  }
  visitScrolledToSamePageLocation(oldURL, newURL) {
    this.delegate.visitScrolledToSamePageLocation(oldURL, newURL);
  }
  // Visits
  get location() {
    return this.history.location;
  }
  get restorationIdentifier() {
    return this.history.restorationIdentifier;
  }
  #getActionForFormSubmission(formSubmission, fetchResponse) {
    const { submitter: submitter2, formElement } = formSubmission;
    return getVisitAction(submitter2, formElement) || this.#getDefaultAction(fetchResponse);
  }
  #getDefaultAction(fetchResponse) {
    const sameLocationRedirect = fetchResponse.redirected && fetchResponse.location.href === this.location?.href;
    return sameLocationRedirect ? "replace" : "advance";
  }
};
var PageStage = {
  initial: 0,
  loading: 1,
  interactive: 2,
  complete: 3
};
var PageObserver = class {
  stage = PageStage.initial;
  started = false;
  constructor(delegate) {
    this.delegate = delegate;
  }
  start() {
    if (!this.started) {
      if (this.stage == PageStage.initial) {
        this.stage = PageStage.loading;
      }
      document.addEventListener("readystatechange", this.interpretReadyState, false);
      addEventListener("pagehide", this.pageWillUnload, false);
      this.started = true;
    }
  }
  stop() {
    if (this.started) {
      document.removeEventListener("readystatechange", this.interpretReadyState, false);
      removeEventListener("pagehide", this.pageWillUnload, false);
      this.started = false;
    }
  }
  interpretReadyState = () => {
    const { readyState } = this;
    if (readyState == "interactive") {
      this.pageIsInteractive();
    } else if (readyState == "complete") {
      this.pageIsComplete();
    }
  };
  pageIsInteractive() {
    if (this.stage == PageStage.loading) {
      this.stage = PageStage.interactive;
      this.delegate.pageBecameInteractive();
    }
  }
  pageIsComplete() {
    this.pageIsInteractive();
    if (this.stage == PageStage.interactive) {
      this.stage = PageStage.complete;
      this.delegate.pageLoaded();
    }
  }
  pageWillUnload = () => {
    this.delegate.pageWillUnload();
  };
  get readyState() {
    return document.readyState;
  }
};
var ScrollObserver = class {
  started = false;
  constructor(delegate) {
    this.delegate = delegate;
  }
  start() {
    if (!this.started) {
      addEventListener("scroll", this.onScroll, false);
      this.onScroll();
      this.started = true;
    }
  }
  stop() {
    if (this.started) {
      removeEventListener("scroll", this.onScroll, false);
      this.started = false;
    }
  }
  onScroll = () => {
    this.updatePosition({ x: window.pageXOffset, y: window.pageYOffset });
  };
  // Private
  updatePosition(position) {
    this.delegate.scrollPositionChanged(position);
  }
};
var StreamMessageRenderer = class {
  render({ fragment }) {
    Bardo.preservingPermanentElements(this, getPermanentElementMapForFragment(fragment), () => {
      withAutofocusFromFragment(fragment, () => {
        withPreservedFocus(() => {
          document.documentElement.appendChild(fragment);
        });
      });
    });
  }
  // Bardo delegate
  enteringBardo(currentPermanentElement, newPermanentElement) {
    newPermanentElement.replaceWith(currentPermanentElement.cloneNode(true));
  }
  leavingBardo() {
  }
};
function getPermanentElementMapForFragment(fragment) {
  const permanentElementsInDocument = queryPermanentElementsAll(document.documentElement);
  const permanentElementMap = {};
  for (const permanentElementInDocument of permanentElementsInDocument) {
    const { id: id2 } = permanentElementInDocument;
    for (const streamElement of fragment.querySelectorAll("turbo-stream")) {
      const elementInStream = getPermanentElementById(streamElement.templateElement.content, id2);
      if (elementInStream) {
        permanentElementMap[id2] = [permanentElementInDocument, elementInStream];
      }
    }
  }
  return permanentElementMap;
}
async function withAutofocusFromFragment(fragment, callback) {
  const generatedID = `turbo-stream-autofocus-${uuid()}`;
  const turboStreams = fragment.querySelectorAll("turbo-stream");
  const elementWithAutofocus = firstAutofocusableElementInStreams(turboStreams);
  let willAutofocusId = null;
  if (elementWithAutofocus) {
    if (elementWithAutofocus.id) {
      willAutofocusId = elementWithAutofocus.id;
    } else {
      willAutofocusId = generatedID;
    }
    elementWithAutofocus.id = willAutofocusId;
  }
  callback();
  await nextRepaint();
  const hasNoActiveElement = document.activeElement == null || document.activeElement == document.body;
  if (hasNoActiveElement && willAutofocusId) {
    const elementToAutofocus = document.getElementById(willAutofocusId);
    if (elementIsFocusable(elementToAutofocus)) {
      elementToAutofocus.focus();
    }
    if (elementToAutofocus && elementToAutofocus.id == generatedID) {
      elementToAutofocus.removeAttribute("id");
    }
  }
}
async function withPreservedFocus(callback) {
  const [activeElementBeforeRender, activeElementAfterRender] = await around(callback, () => document.activeElement);
  const restoreFocusTo = activeElementBeforeRender && activeElementBeforeRender.id;
  if (restoreFocusTo) {
    const elementToFocus = document.getElementById(restoreFocusTo);
    if (elementIsFocusable(elementToFocus) && elementToFocus != activeElementAfterRender) {
      elementToFocus.focus();
    }
  }
}
function firstAutofocusableElementInStreams(nodeListOfStreamElements) {
  for (const streamElement of nodeListOfStreamElements) {
    const elementWithAutofocus = queryAutofocusableElement(streamElement.templateElement.content);
    if (elementWithAutofocus) return elementWithAutofocus;
  }
  return null;
}
var StreamObserver = class {
  sources = /* @__PURE__ */ new Set();
  #started = false;
  constructor(delegate) {
    this.delegate = delegate;
  }
  start() {
    if (!this.#started) {
      this.#started = true;
      addEventListener("turbo:before-fetch-response", this.inspectFetchResponse, false);
    }
  }
  stop() {
    if (this.#started) {
      this.#started = false;
      removeEventListener("turbo:before-fetch-response", this.inspectFetchResponse, false);
    }
  }
  connectStreamSource(source) {
    if (!this.streamSourceIsConnected(source)) {
      this.sources.add(source);
      source.addEventListener("message", this.receiveMessageEvent, false);
    }
  }
  disconnectStreamSource(source) {
    if (this.streamSourceIsConnected(source)) {
      this.sources.delete(source);
      source.removeEventListener("message", this.receiveMessageEvent, false);
    }
  }
  streamSourceIsConnected(source) {
    return this.sources.has(source);
  }
  inspectFetchResponse = (event) => {
    const response2 = fetchResponseFromEvent(event);
    if (response2 && fetchResponseIsStream(response2)) {
      event.preventDefault();
      this.receiveMessageResponse(response2);
    }
  };
  receiveMessageEvent = (event) => {
    if (this.#started && typeof event.data == "string") {
      this.receiveMessageHTML(event.data);
    }
  };
  async receiveMessageResponse(response2) {
    const html = await response2.responseHTML;
    if (html) {
      this.receiveMessageHTML(html);
    }
  }
  receiveMessageHTML(html) {
    this.delegate.receivedMessageFromStream(StreamMessage.wrap(html));
  }
};
function fetchResponseFromEvent(event) {
  const fetchResponse = event.detail?.fetchResponse;
  if (fetchResponse instanceof FetchResponse) {
    return fetchResponse;
  }
}
function fetchResponseIsStream(response2) {
  const contentType = response2.contentType ?? "";
  return contentType.startsWith(StreamMessage.contentType);
}
var ErrorRenderer = class extends Renderer {
  static renderElement(currentElement, newElement) {
    const { documentElement, body } = document;
    documentElement.replaceChild(newElement, body);
  }
  async render() {
    this.replaceHeadAndBody();
    this.activateScriptElements();
  }
  replaceHeadAndBody() {
    const { documentElement, head } = document;
    documentElement.replaceChild(this.newHead, head);
    this.renderElement(this.currentElement, this.newElement);
  }
  activateScriptElements() {
    for (const replaceableElement of this.scriptElements) {
      const parentNode = replaceableElement.parentNode;
      if (parentNode) {
        const element = activateScriptElement(replaceableElement);
        parentNode.replaceChild(element, replaceableElement);
      }
    }
  }
  get newHead() {
    return this.newSnapshot.headSnapshot.element;
  }
  get scriptElements() {
    return document.documentElement.querySelectorAll("script");
  }
};
var PageRenderer = class extends Renderer {
  static renderElement(currentElement, newElement) {
    if (document.body && newElement instanceof HTMLBodyElement) {
      document.body.replaceWith(newElement);
    } else {
      document.documentElement.appendChild(newElement);
    }
  }
  get shouldRender() {
    return this.newSnapshot.isVisitable && this.trackedElementsAreIdentical;
  }
  get reloadReason() {
    if (!this.newSnapshot.isVisitable) {
      return {
        reason: "turbo_visit_control_is_reload"
      };
    }
    if (!this.trackedElementsAreIdentical) {
      return {
        reason: "tracked_element_mismatch"
      };
    }
  }
  async prepareToRender() {
    this.#setLanguage();
    await this.mergeHead();
  }
  async render() {
    if (this.willRender) {
      await this.replaceBody();
    }
  }
  finishRendering() {
    super.finishRendering();
    if (!this.isPreview) {
      this.focusFirstAutofocusableElement();
    }
  }
  get currentHeadSnapshot() {
    return this.currentSnapshot.headSnapshot;
  }
  get newHeadSnapshot() {
    return this.newSnapshot.headSnapshot;
  }
  get newElement() {
    return this.newSnapshot.element;
  }
  #setLanguage() {
    const { documentElement } = this.currentSnapshot;
    const { lang } = this.newSnapshot;
    if (lang) {
      documentElement.setAttribute("lang", lang);
    } else {
      documentElement.removeAttribute("lang");
    }
  }
  async mergeHead() {
    const mergedHeadElements = this.mergeProvisionalElements();
    const newStylesheetElements = this.copyNewHeadStylesheetElements();
    this.copyNewHeadScriptElements();
    await mergedHeadElements;
    await newStylesheetElements;
    if (this.willRender) {
      this.removeUnusedDynamicStylesheetElements();
    }
  }
  async replaceBody() {
    await this.preservingPermanentElements(async () => {
      this.activateNewBody();
      await this.assignNewBody();
    });
  }
  get trackedElementsAreIdentical() {
    return this.currentHeadSnapshot.trackedElementSignature == this.newHeadSnapshot.trackedElementSignature;
  }
  async copyNewHeadStylesheetElements() {
    const loadingElements = [];
    for (const element of this.newHeadStylesheetElements) {
      loadingElements.push(waitForLoad(element));
      document.head.appendChild(element);
    }
    await Promise.all(loadingElements);
  }
  copyNewHeadScriptElements() {
    for (const element of this.newHeadScriptElements) {
      document.head.appendChild(activateScriptElement(element));
    }
  }
  removeUnusedDynamicStylesheetElements() {
    for (const element of this.unusedDynamicStylesheetElements) {
      document.head.removeChild(element);
    }
  }
  async mergeProvisionalElements() {
    const newHeadElements = [...this.newHeadProvisionalElements];
    for (const element of this.currentHeadProvisionalElements) {
      if (!this.isCurrentElementInElementList(element, newHeadElements)) {
        document.head.removeChild(element);
      }
    }
    for (const element of newHeadElements) {
      document.head.appendChild(element);
    }
  }
  isCurrentElementInElementList(element, elementList) {
    for (const [index, newElement] of elementList.entries()) {
      if (element.tagName == "TITLE") {
        if (newElement.tagName != "TITLE") {
          continue;
        }
        if (element.innerHTML == newElement.innerHTML) {
          elementList.splice(index, 1);
          return true;
        }
      }
      if (newElement.isEqualNode(element)) {
        elementList.splice(index, 1);
        return true;
      }
    }
    return false;
  }
  removeCurrentHeadProvisionalElements() {
    for (const element of this.currentHeadProvisionalElements) {
      document.head.removeChild(element);
    }
  }
  copyNewHeadProvisionalElements() {
    for (const element of this.newHeadProvisionalElements) {
      document.head.appendChild(element);
    }
  }
  activateNewBody() {
    document.adoptNode(this.newElement);
    this.activateNewBodyScriptElements();
  }
  activateNewBodyScriptElements() {
    for (const inertScriptElement of this.newBodyScriptElements) {
      const activatedScriptElement = activateScriptElement(inertScriptElement);
      inertScriptElement.replaceWith(activatedScriptElement);
    }
  }
  async assignNewBody() {
    await this.renderElement(this.currentElement, this.newElement);
  }
  get unusedDynamicStylesheetElements() {
    return this.oldHeadStylesheetElements.filter((element) => {
      return element.getAttribute("data-turbo-track") === "dynamic";
    });
  }
  get oldHeadStylesheetElements() {
    return this.currentHeadSnapshot.getStylesheetElementsNotInSnapshot(this.newHeadSnapshot);
  }
  get newHeadStylesheetElements() {
    return this.newHeadSnapshot.getStylesheetElementsNotInSnapshot(this.currentHeadSnapshot);
  }
  get newHeadScriptElements() {
    return this.newHeadSnapshot.getScriptElementsNotInSnapshot(this.currentHeadSnapshot);
  }
  get currentHeadProvisionalElements() {
    return this.currentHeadSnapshot.provisionalElements;
  }
  get newHeadProvisionalElements() {
    return this.newHeadSnapshot.provisionalElements;
  }
  get newBodyScriptElements() {
    return this.newElement.querySelectorAll("script");
  }
};
var MorphingPageRenderer = class extends PageRenderer {
  static renderElement(currentElement, newElement) {
    morphElements(currentElement, newElement, {
      callbacks: {
        beforeNodeMorphed: (node, newNode) => {
          if (shouldRefreshFrameWithMorphing(node, newNode) && !closestFrameReloadableWithMorphing(node)) {
            node.reload();
            return false;
          }
          return true;
        }
      }
    });
    dispatch("turbo:morph", { detail: { currentElement, newElement } });
  }
  async preservingPermanentElements(callback) {
    return await callback();
  }
  get renderMethod() {
    return "morph";
  }
  get shouldAutofocus() {
    return false;
  }
};
var SnapshotCache = class {
  keys = [];
  snapshots = {};
  constructor(size) {
    this.size = size;
  }
  has(location2) {
    return toCacheKey(location2) in this.snapshots;
  }
  get(location2) {
    if (this.has(location2)) {
      const snapshot = this.read(location2);
      this.touch(location2);
      return snapshot;
    }
  }
  put(location2, snapshot) {
    this.write(location2, snapshot);
    this.touch(location2);
    return snapshot;
  }
  clear() {
    this.snapshots = {};
  }
  // Private
  read(location2) {
    return this.snapshots[toCacheKey(location2)];
  }
  write(location2, snapshot) {
    this.snapshots[toCacheKey(location2)] = snapshot;
  }
  touch(location2) {
    const key = toCacheKey(location2);
    const index = this.keys.indexOf(key);
    if (index > -1) this.keys.splice(index, 1);
    this.keys.unshift(key);
    this.trim();
  }
  trim() {
    for (const key of this.keys.splice(this.size)) {
      delete this.snapshots[key];
    }
  }
};
var PageView = class extends View {
  snapshotCache = new SnapshotCache(10);
  lastRenderedLocation = new URL(location.href);
  forceReloaded = false;
  shouldTransitionTo(newSnapshot) {
    return this.snapshot.prefersViewTransitions && newSnapshot.prefersViewTransitions;
  }
  renderPage(snapshot, isPreview = false, willRender = true, visit2) {
    const shouldMorphPage = this.isPageRefresh(visit2) && this.snapshot.shouldMorphPage;
    const rendererClass = shouldMorphPage ? MorphingPageRenderer : PageRenderer;
    const renderer = new rendererClass(this.snapshot, snapshot, isPreview, willRender);
    if (!renderer.shouldRender) {
      this.forceReloaded = true;
    } else {
      visit2?.changeHistory();
    }
    return this.render(renderer);
  }
  renderError(snapshot, visit2) {
    visit2?.changeHistory();
    const renderer = new ErrorRenderer(this.snapshot, snapshot, false);
    return this.render(renderer);
  }
  clearSnapshotCache() {
    this.snapshotCache.clear();
  }
  async cacheSnapshot(snapshot = this.snapshot) {
    if (snapshot.isCacheable) {
      this.delegate.viewWillCacheSnapshot();
      const { lastRenderedLocation: location2 } = this;
      await nextEventLoopTick();
      const cachedSnapshot = snapshot.clone();
      this.snapshotCache.put(location2, cachedSnapshot);
      return cachedSnapshot;
    }
  }
  getCachedSnapshotForLocation(location2) {
    return this.snapshotCache.get(location2);
  }
  isPageRefresh(visit2) {
    return !visit2 || this.lastRenderedLocation.pathname === visit2.location.pathname && visit2.action === "replace";
  }
  shouldPreserveScrollPosition(visit2) {
    return this.isPageRefresh(visit2) && this.snapshot.shouldPreserveScrollPosition;
  }
  get snapshot() {
    return PageSnapshot.fromElement(this.element);
  }
};
var Preloader = class {
  selector = "a[data-turbo-preload]";
  constructor(delegate, snapshotCache) {
    this.delegate = delegate;
    this.snapshotCache = snapshotCache;
  }
  start() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", this.#preloadAll);
    } else {
      this.preloadOnLoadLinksForView(document.body);
    }
  }
  stop() {
    document.removeEventListener("DOMContentLoaded", this.#preloadAll);
  }
  preloadOnLoadLinksForView(element) {
    for (const link of element.querySelectorAll(this.selector)) {
      if (this.delegate.shouldPreloadLink(link)) {
        this.preloadURL(link);
      }
    }
  }
  async preloadURL(link) {
    const location2 = new URL(link.href);
    if (this.snapshotCache.has(location2)) {
      return;
    }
    const fetchRequest = new FetchRequest(this, FetchMethod.get, location2, new URLSearchParams(), link);
    await fetchRequest.perform();
  }
  // Fetch request delegate
  prepareRequest(fetchRequest) {
    fetchRequest.headers["X-Sec-Purpose"] = "prefetch";
  }
  async requestSucceededWithResponse(fetchRequest, fetchResponse) {
    try {
      const responseHTML = await fetchResponse.responseHTML;
      const snapshot = PageSnapshot.fromHTMLString(responseHTML);
      this.snapshotCache.put(fetchRequest.url, snapshot);
    } catch (_) {
    }
  }
  requestStarted(fetchRequest) {
  }
  requestErrored(fetchRequest) {
  }
  requestFinished(fetchRequest) {
  }
  requestPreventedHandlingResponse(fetchRequest, fetchResponse) {
  }
  requestFailedWithResponse(fetchRequest, fetchResponse) {
  }
  #preloadAll = () => {
    this.preloadOnLoadLinksForView(document.body);
  };
};
var Cache = class {
  constructor(session2) {
    this.session = session2;
  }
  clear() {
    this.session.clearCache();
  }
  resetCacheControl() {
    this.#setCacheControl("");
  }
  exemptPageFromCache() {
    this.#setCacheControl("no-cache");
  }
  exemptPageFromPreview() {
    this.#setCacheControl("no-preview");
  }
  #setCacheControl(value) {
    setMetaContent("turbo-cache-control", value);
  }
};
var Session = class {
  navigator = new Navigator(this);
  history = new History(this);
  view = new PageView(this, document.documentElement);
  adapter = new BrowserAdapter(this);
  pageObserver = new PageObserver(this);
  cacheObserver = new CacheObserver();
  linkPrefetchObserver = new LinkPrefetchObserver(this, document);
  linkClickObserver = new LinkClickObserver(this, window);
  formSubmitObserver = new FormSubmitObserver(this, document);
  scrollObserver = new ScrollObserver(this);
  streamObserver = new StreamObserver(this);
  formLinkClickObserver = new FormLinkClickObserver(this, document.documentElement);
  frameRedirector = new FrameRedirector(this, document.documentElement);
  streamMessageRenderer = new StreamMessageRenderer();
  cache = new Cache(this);
  enabled = true;
  started = false;
  #pageRefreshDebouncePeriod = 150;
  constructor(recentRequests2) {
    this.recentRequests = recentRequests2;
    this.preloader = new Preloader(this, this.view.snapshotCache);
    this.debouncedRefresh = this.refresh;
    this.pageRefreshDebouncePeriod = this.pageRefreshDebouncePeriod;
  }
  start() {
    if (!this.started) {
      this.pageObserver.start();
      this.cacheObserver.start();
      this.linkPrefetchObserver.start();
      this.formLinkClickObserver.start();
      this.linkClickObserver.start();
      this.formSubmitObserver.start();
      this.scrollObserver.start();
      this.streamObserver.start();
      this.frameRedirector.start();
      this.history.start();
      this.preloader.start();
      this.started = true;
      this.enabled = true;
    }
  }
  disable() {
    this.enabled = false;
  }
  stop() {
    if (this.started) {
      this.pageObserver.stop();
      this.cacheObserver.stop();
      this.linkPrefetchObserver.stop();
      this.formLinkClickObserver.stop();
      this.linkClickObserver.stop();
      this.formSubmitObserver.stop();
      this.scrollObserver.stop();
      this.streamObserver.stop();
      this.frameRedirector.stop();
      this.history.stop();
      this.preloader.stop();
      this.started = false;
    }
  }
  registerAdapter(adapter) {
    this.adapter = adapter;
  }
  visit(location2, options = {}) {
    const frameElement = options.frame ? document.getElementById(options.frame) : null;
    if (frameElement instanceof FrameElement) {
      const action = options.action || getVisitAction(frameElement);
      frameElement.delegate.proposeVisitIfNavigatedWithAction(frameElement, action);
      frameElement.src = location2.toString();
    } else {
      this.navigator.proposeVisit(expandURL(location2), options);
    }
  }
  refresh(url, requestId) {
    const isRecentRequest = requestId && this.recentRequests.has(requestId);
    const isCurrentUrl = url === document.baseURI;
    if (!isRecentRequest && !this.navigator.currentVisit && isCurrentUrl) {
      this.visit(url, { action: "replace", shouldCacheSnapshot: false });
    }
  }
  connectStreamSource(source) {
    this.streamObserver.connectStreamSource(source);
  }
  disconnectStreamSource(source) {
    this.streamObserver.disconnectStreamSource(source);
  }
  renderStreamMessage(message) {
    this.streamMessageRenderer.render(StreamMessage.wrap(message));
  }
  clearCache() {
    this.view.clearSnapshotCache();
  }
  setProgressBarDelay(delay) {
    console.warn(
      "Please replace `session.setProgressBarDelay(delay)` with `session.progressBarDelay = delay`. The function is deprecated and will be removed in a future version of Turbo.`"
    );
    this.progressBarDelay = delay;
  }
  set progressBarDelay(delay) {
    config.drive.progressBarDelay = delay;
  }
  get progressBarDelay() {
    return config.drive.progressBarDelay;
  }
  set drive(value) {
    config.drive.enabled = value;
  }
  get drive() {
    return config.drive.enabled;
  }
  set formMode(value) {
    config.forms.mode = value;
  }
  get formMode() {
    return config.forms.mode;
  }
  get location() {
    return this.history.location;
  }
  get restorationIdentifier() {
    return this.history.restorationIdentifier;
  }
  get pageRefreshDebouncePeriod() {
    return this.#pageRefreshDebouncePeriod;
  }
  set pageRefreshDebouncePeriod(value) {
    this.refresh = debounce(this.debouncedRefresh.bind(this), value);
    this.#pageRefreshDebouncePeriod = value;
  }
  // Preloader delegate
  shouldPreloadLink(element) {
    const isUnsafe = element.hasAttribute("data-turbo-method");
    const isStream = element.hasAttribute("data-turbo-stream");
    const frameTarget = element.getAttribute("data-turbo-frame");
    const frame = frameTarget == "_top" ? null : document.getElementById(frameTarget) || findClosestRecursively(element, "turbo-frame:not([disabled])");
    if (isUnsafe || isStream || frame instanceof FrameElement) {
      return false;
    } else {
      const location2 = new URL(element.href);
      return this.elementIsNavigatable(element) && locationIsVisitable(location2, this.snapshot.rootLocation);
    }
  }
  // History delegate
  historyPoppedToLocationWithRestorationIdentifierAndDirection(location2, restorationIdentifier, direction) {
    if (this.enabled) {
      this.navigator.startVisit(location2, restorationIdentifier, {
        action: "restore",
        historyChanged: true,
        direction
      });
    } else {
      this.adapter.pageInvalidated({
        reason: "turbo_disabled"
      });
    }
  }
  // Scroll observer delegate
  scrollPositionChanged(position) {
    this.history.updateRestorationData({ scrollPosition: position });
  }
  // Form click observer delegate
  willSubmitFormLinkToLocation(link, location2) {
    return this.elementIsNavigatable(link) && locationIsVisitable(location2, this.snapshot.rootLocation);
  }
  submittedFormLinkToLocation() {
  }
  // Link hover observer delegate
  canPrefetchRequestToLocation(link, location2) {
    return this.elementIsNavigatable(link) && locationIsVisitable(location2, this.snapshot.rootLocation) && this.navigator.linkPrefetchingIsEnabledForLocation(location2);
  }
  // Link click observer delegate
  willFollowLinkToLocation(link, location2, event) {
    return this.elementIsNavigatable(link) && locationIsVisitable(location2, this.snapshot.rootLocation) && this.applicationAllowsFollowingLinkToLocation(link, location2, event);
  }
  followedLinkToLocation(link, location2) {
    const action = this.getActionForLink(link);
    const acceptsStreamResponse = link.hasAttribute("data-turbo-stream");
    this.visit(location2.href, { action, acceptsStreamResponse });
  }
  // Navigator delegate
  allowsVisitingLocationWithAction(location2, action) {
    return this.locationWithActionIsSamePage(location2, action) || this.applicationAllowsVisitingLocation(location2);
  }
  visitProposedToLocation(location2, options) {
    extendURLWithDeprecatedProperties(location2);
    this.adapter.visitProposedToLocation(location2, options);
  }
  // Visit delegate
  visitStarted(visit2) {
    if (!visit2.acceptsStreamResponse) {
      markAsBusy(document.documentElement);
      this.view.markVisitDirection(visit2.direction);
    }
    extendURLWithDeprecatedProperties(visit2.location);
    if (!visit2.silent) {
      this.notifyApplicationAfterVisitingLocation(visit2.location, visit2.action);
    }
  }
  visitCompleted(visit2) {
    this.view.unmarkVisitDirection();
    clearBusyState(document.documentElement);
    this.notifyApplicationAfterPageLoad(visit2.getTimingMetrics());
  }
  locationWithActionIsSamePage(location2, action) {
    return this.navigator.locationWithActionIsSamePage(location2, action);
  }
  visitScrolledToSamePageLocation(oldURL, newURL) {
    this.notifyApplicationAfterVisitingSamePageLocation(oldURL, newURL);
  }
  // Form submit observer delegate
  willSubmitForm(form, submitter2) {
    const action = getAction$1(form, submitter2);
    return this.submissionIsNavigatable(form, submitter2) && locationIsVisitable(expandURL(action), this.snapshot.rootLocation);
  }
  formSubmitted(form, submitter2) {
    this.navigator.submitForm(form, submitter2);
  }
  // Page observer delegate
  pageBecameInteractive() {
    this.view.lastRenderedLocation = this.location;
    this.notifyApplicationAfterPageLoad();
  }
  pageLoaded() {
    this.history.assumeControlOfScrollRestoration();
  }
  pageWillUnload() {
    this.history.relinquishControlOfScrollRestoration();
  }
  // Stream observer delegate
  receivedMessageFromStream(message) {
    this.renderStreamMessage(message);
  }
  // Page view delegate
  viewWillCacheSnapshot() {
    if (!this.navigator.currentVisit?.silent) {
      this.notifyApplicationBeforeCachingSnapshot();
    }
  }
  allowsImmediateRender({ element }, options) {
    const event = this.notifyApplicationBeforeRender(element, options);
    const {
      defaultPrevented,
      detail: { render }
    } = event;
    if (this.view.renderer && render) {
      this.view.renderer.renderElement = render;
    }
    return !defaultPrevented;
  }
  viewRenderedSnapshot(_snapshot, _isPreview, renderMethod) {
    this.view.lastRenderedLocation = this.history.location;
    this.notifyApplicationAfterRender(renderMethod);
  }
  preloadOnLoadLinksForView(element) {
    this.preloader.preloadOnLoadLinksForView(element);
  }
  viewInvalidated(reason) {
    this.adapter.pageInvalidated(reason);
  }
  // Frame element
  frameLoaded(frame) {
    this.notifyApplicationAfterFrameLoad(frame);
  }
  frameRendered(fetchResponse, frame) {
    this.notifyApplicationAfterFrameRender(fetchResponse, frame);
  }
  // Application events
  applicationAllowsFollowingLinkToLocation(link, location2, ev) {
    const event = this.notifyApplicationAfterClickingLinkToLocation(link, location2, ev);
    return !event.defaultPrevented;
  }
  applicationAllowsVisitingLocation(location2) {
    const event = this.notifyApplicationBeforeVisitingLocation(location2);
    return !event.defaultPrevented;
  }
  notifyApplicationAfterClickingLinkToLocation(link, location2, event) {
    return dispatch("turbo:click", {
      target: link,
      detail: { url: location2.href, originalEvent: event },
      cancelable: true
    });
  }
  notifyApplicationBeforeVisitingLocation(location2) {
    return dispatch("turbo:before-visit", {
      detail: { url: location2.href },
      cancelable: true
    });
  }
  notifyApplicationAfterVisitingLocation(location2, action) {
    return dispatch("turbo:visit", { detail: { url: location2.href, action } });
  }
  notifyApplicationBeforeCachingSnapshot() {
    return dispatch("turbo:before-cache");
  }
  notifyApplicationBeforeRender(newBody, options) {
    return dispatch("turbo:before-render", {
      detail: { newBody, ...options },
      cancelable: true
    });
  }
  notifyApplicationAfterRender(renderMethod) {
    return dispatch("turbo:render", { detail: { renderMethod } });
  }
  notifyApplicationAfterPageLoad(timing = {}) {
    return dispatch("turbo:load", {
      detail: { url: this.location.href, timing }
    });
  }
  notifyApplicationAfterVisitingSamePageLocation(oldURL, newURL) {
    dispatchEvent(
      new HashChangeEvent("hashchange", {
        oldURL: oldURL.toString(),
        newURL: newURL.toString()
      })
    );
  }
  notifyApplicationAfterFrameLoad(frame) {
    return dispatch("turbo:frame-load", { target: frame });
  }
  notifyApplicationAfterFrameRender(fetchResponse, frame) {
    return dispatch("turbo:frame-render", {
      detail: { fetchResponse },
      target: frame,
      cancelable: true
    });
  }
  // Helpers
  submissionIsNavigatable(form, submitter2) {
    if (config.forms.mode == "off") {
      return false;
    } else {
      const submitterIsNavigatable = submitter2 ? this.elementIsNavigatable(submitter2) : true;
      if (config.forms.mode == "optin") {
        return submitterIsNavigatable && form.closest('[data-turbo="true"]') != null;
      } else {
        return submitterIsNavigatable && this.elementIsNavigatable(form);
      }
    }
  }
  elementIsNavigatable(element) {
    const container = findClosestRecursively(element, "[data-turbo]");
    const withinFrame = findClosestRecursively(element, "turbo-frame");
    if (config.drive.enabled || withinFrame) {
      if (container) {
        return container.getAttribute("data-turbo") != "false";
      } else {
        return true;
      }
    } else {
      if (container) {
        return container.getAttribute("data-turbo") == "true";
      } else {
        return false;
      }
    }
  }
  // Private
  getActionForLink(link) {
    return getVisitAction(link) || "advance";
  }
  get snapshot() {
    return this.view.snapshot;
  }
};
function extendURLWithDeprecatedProperties(url) {
  Object.defineProperties(url, deprecatedLocationPropertyDescriptors);
}
var deprecatedLocationPropertyDescriptors = {
  absoluteURL: {
    get() {
      return this.toString();
    }
  }
};
var session = new Session(recentRequests);
var { cache, navigator: navigator$1 } = session;
function start() {
  session.start();
}
function registerAdapter(adapter) {
  session.registerAdapter(adapter);
}
function visit(location2, options) {
  session.visit(location2, options);
}
function connectStreamSource(source) {
  session.connectStreamSource(source);
}
function disconnectStreamSource(source) {
  session.disconnectStreamSource(source);
}
function renderStreamMessage(message) {
  session.renderStreamMessage(message);
}
function clearCache() {
  console.warn(
    "Please replace `Turbo.clearCache()` with `Turbo.cache.clear()`. The top-level function is deprecated and will be removed in a future version of Turbo.`"
  );
  session.clearCache();
}
function setProgressBarDelay(delay) {
  console.warn(
    "Please replace `Turbo.setProgressBarDelay(delay)` with `Turbo.config.drive.progressBarDelay = delay`. The top-level function is deprecated and will be removed in a future version of Turbo.`"
  );
  config.drive.progressBarDelay = delay;
}
function setConfirmMethod(confirmMethod) {
  console.warn(
    "Please replace `Turbo.setConfirmMethod(confirmMethod)` with `Turbo.config.forms.confirm = confirmMethod`. The top-level function is deprecated and will be removed in a future version of Turbo.`"
  );
  config.forms.confirm = confirmMethod;
}
function setFormMode(mode) {
  console.warn(
    "Please replace `Turbo.setFormMode(mode)` with `Turbo.config.forms.mode = mode`. The top-level function is deprecated and will be removed in a future version of Turbo.`"
  );
  config.forms.mode = mode;
}
function morphBodyElements(currentBody, newBody) {
  MorphingPageRenderer.renderElement(currentBody, newBody);
}
function morphTurboFrameElements(currentFrame, newFrame) {
  MorphingFrameRenderer.renderElement(currentFrame, newFrame);
}
var Turbo = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  navigator: navigator$1,
  session,
  cache,
  PageRenderer,
  PageSnapshot,
  FrameRenderer,
  fetch: fetchWithTurboHeaders,
  config,
  start,
  registerAdapter,
  visit,
  connectStreamSource,
  disconnectStreamSource,
  renderStreamMessage,
  clearCache,
  setProgressBarDelay,
  setConfirmMethod,
  setFormMode,
  morphBodyElements,
  morphTurboFrameElements,
  morphChildren,
  morphElements
});
var TurboFrameMissingError = class extends Error {
};
var FrameController = class {
  fetchResponseLoaded = (_fetchResponse) => Promise.resolve();
  #currentFetchRequest = null;
  #resolveVisitPromise = () => {
  };
  #connected = false;
  #hasBeenLoaded = false;
  #ignoredAttributes = /* @__PURE__ */ new Set();
  #shouldMorphFrame = false;
  action = null;
  constructor(element) {
    this.element = element;
    this.view = new FrameView(this, this.element);
    this.appearanceObserver = new AppearanceObserver(this, this.element);
    this.formLinkClickObserver = new FormLinkClickObserver(this, this.element);
    this.linkInterceptor = new LinkInterceptor(this, this.element);
    this.restorationIdentifier = uuid();
    this.formSubmitObserver = new FormSubmitObserver(this, this.element);
  }
  // Frame delegate
  connect() {
    if (!this.#connected) {
      this.#connected = true;
      if (this.loadingStyle == FrameLoadingStyle.lazy) {
        this.appearanceObserver.start();
      } else {
        this.#loadSourceURL();
      }
      this.formLinkClickObserver.start();
      this.linkInterceptor.start();
      this.formSubmitObserver.start();
    }
  }
  disconnect() {
    if (this.#connected) {
      this.#connected = false;
      this.appearanceObserver.stop();
      this.formLinkClickObserver.stop();
      this.linkInterceptor.stop();
      this.formSubmitObserver.stop();
    }
  }
  disabledChanged() {
    if (this.loadingStyle == FrameLoadingStyle.eager) {
      this.#loadSourceURL();
    }
  }
  sourceURLChanged() {
    if (this.#isIgnoringChangesTo("src")) return;
    if (this.element.isConnected) {
      this.complete = false;
    }
    if (this.loadingStyle == FrameLoadingStyle.eager || this.#hasBeenLoaded) {
      this.#loadSourceURL();
    }
  }
  sourceURLReloaded() {
    const { refresh, src } = this.element;
    this.#shouldMorphFrame = src && refresh === "morph";
    this.element.removeAttribute("complete");
    this.element.src = null;
    this.element.src = src;
    return this.element.loaded;
  }
  loadingStyleChanged() {
    if (this.loadingStyle == FrameLoadingStyle.lazy) {
      this.appearanceObserver.start();
    } else {
      this.appearanceObserver.stop();
      this.#loadSourceURL();
    }
  }
  async #loadSourceURL() {
    if (this.enabled && this.isActive && !this.complete && this.sourceURL) {
      this.element.loaded = this.#visit(expandURL(this.sourceURL));
      this.appearanceObserver.stop();
      await this.element.loaded;
      this.#hasBeenLoaded = true;
    }
  }
  async loadResponse(fetchResponse) {
    if (fetchResponse.redirected || fetchResponse.succeeded && fetchResponse.isHTML) {
      this.sourceURL = fetchResponse.response.url;
    }
    try {
      const html = await fetchResponse.responseHTML;
      if (html) {
        const document2 = parseHTMLDocument(html);
        const pageSnapshot = PageSnapshot.fromDocument(document2);
        if (pageSnapshot.isVisitable) {
          await this.#loadFrameResponse(fetchResponse, document2);
        } else {
          await this.#handleUnvisitableFrameResponse(fetchResponse);
        }
      }
    } finally {
      this.#shouldMorphFrame = false;
      this.fetchResponseLoaded = () => Promise.resolve();
    }
  }
  // Appearance observer delegate
  elementAppearedInViewport(element) {
    this.proposeVisitIfNavigatedWithAction(element, getVisitAction(element));
    this.#loadSourceURL();
  }
  // Form link click observer delegate
  willSubmitFormLinkToLocation(link) {
    return this.#shouldInterceptNavigation(link);
  }
  submittedFormLinkToLocation(link, _location, form) {
    const frame = this.#findFrameElement(link);
    if (frame) form.setAttribute("data-turbo-frame", frame.id);
  }
  // Link interceptor delegate
  shouldInterceptLinkClick(element, _location, _event) {
    return this.#shouldInterceptNavigation(element);
  }
  linkClickIntercepted(element, location2) {
    this.#navigateFrame(element, location2);
  }
  // Form submit observer delegate
  willSubmitForm(element, submitter2) {
    return element.closest("turbo-frame") == this.element && this.#shouldInterceptNavigation(element, submitter2);
  }
  formSubmitted(element, submitter2) {
    if (this.formSubmission) {
      this.formSubmission.stop();
    }
    this.formSubmission = new FormSubmission(this, element, submitter2);
    const { fetchRequest } = this.formSubmission;
    this.prepareRequest(fetchRequest);
    this.formSubmission.start();
  }
  // Fetch request delegate
  prepareRequest(request3) {
    request3.headers["Turbo-Frame"] = this.id;
    if (this.currentNavigationElement?.hasAttribute("data-turbo-stream")) {
      request3.acceptResponseType(StreamMessage.contentType);
    }
  }
  requestStarted(_request) {
    markAsBusy(this.element);
  }
  requestPreventedHandlingResponse(_request, _response) {
    this.#resolveVisitPromise();
  }
  async requestSucceededWithResponse(request3, response2) {
    await this.loadResponse(response2);
    this.#resolveVisitPromise();
  }
  async requestFailedWithResponse(request3, response2) {
    await this.loadResponse(response2);
    this.#resolveVisitPromise();
  }
  requestErrored(request3, error3) {
    console.error(error3);
    this.#resolveVisitPromise();
  }
  requestFinished(_request) {
    clearBusyState(this.element);
  }
  // Form submission delegate
  formSubmissionStarted({ formElement }) {
    markAsBusy(formElement, this.#findFrameElement(formElement));
  }
  formSubmissionSucceededWithResponse(formSubmission, response2) {
    const frame = this.#findFrameElement(formSubmission.formElement, formSubmission.submitter);
    frame.delegate.proposeVisitIfNavigatedWithAction(frame, getVisitAction(formSubmission.submitter, formSubmission.formElement, frame));
    frame.delegate.loadResponse(response2);
    if (!formSubmission.isSafe) {
      session.clearCache();
    }
  }
  formSubmissionFailedWithResponse(formSubmission, fetchResponse) {
    this.element.delegate.loadResponse(fetchResponse);
    session.clearCache();
  }
  formSubmissionErrored(formSubmission, error3) {
    console.error(error3);
  }
  formSubmissionFinished({ formElement }) {
    clearBusyState(formElement, this.#findFrameElement(formElement));
  }
  // View delegate
  allowsImmediateRender({ element: newFrame }, options) {
    const event = dispatch("turbo:before-frame-render", {
      target: this.element,
      detail: { newFrame, ...options },
      cancelable: true
    });
    const {
      defaultPrevented,
      detail: { render }
    } = event;
    if (this.view.renderer && render) {
      this.view.renderer.renderElement = render;
    }
    return !defaultPrevented;
  }
  viewRenderedSnapshot(_snapshot, _isPreview, _renderMethod) {
  }
  preloadOnLoadLinksForView(element) {
    session.preloadOnLoadLinksForView(element);
  }
  viewInvalidated() {
  }
  // Frame renderer delegate
  willRenderFrame(currentElement, _newElement) {
    this.previousFrameElement = currentElement.cloneNode(true);
  }
  visitCachedSnapshot = ({ element }) => {
    const frame = element.querySelector("#" + this.element.id);
    if (frame && this.previousFrameElement) {
      frame.replaceChildren(...this.previousFrameElement.children);
    }
    delete this.previousFrameElement;
  };
  // Private
  async #loadFrameResponse(fetchResponse, document2) {
    const newFrameElement = await this.extractForeignFrameElement(document2.body);
    const rendererClass = this.#shouldMorphFrame ? MorphingFrameRenderer : FrameRenderer;
    if (newFrameElement) {
      const snapshot = new Snapshot(newFrameElement);
      const renderer = new rendererClass(this, this.view.snapshot, snapshot, false, false);
      if (this.view.renderPromise) await this.view.renderPromise;
      this.changeHistory();
      await this.view.render(renderer);
      this.complete = true;
      session.frameRendered(fetchResponse, this.element);
      session.frameLoaded(this.element);
      await this.fetchResponseLoaded(fetchResponse);
    } else if (this.#willHandleFrameMissingFromResponse(fetchResponse)) {
      this.#handleFrameMissingFromResponse(fetchResponse);
    }
  }
  async #visit(url) {
    const request3 = new FetchRequest(this, FetchMethod.get, url, new URLSearchParams(), this.element);
    this.#currentFetchRequest?.cancel();
    this.#currentFetchRequest = request3;
    return new Promise((resolve) => {
      this.#resolveVisitPromise = () => {
        this.#resolveVisitPromise = () => {
        };
        this.#currentFetchRequest = null;
        resolve();
      };
      request3.perform();
    });
  }
  #navigateFrame(element, url, submitter2) {
    const frame = this.#findFrameElement(element, submitter2);
    frame.delegate.proposeVisitIfNavigatedWithAction(frame, getVisitAction(submitter2, element, frame));
    this.#withCurrentNavigationElement(element, () => {
      frame.src = url;
    });
  }
  proposeVisitIfNavigatedWithAction(frame, action = null) {
    this.action = action;
    if (this.action) {
      const pageSnapshot = PageSnapshot.fromElement(frame).clone();
      const { visitCachedSnapshot } = frame.delegate;
      frame.delegate.fetchResponseLoaded = async (fetchResponse) => {
        if (frame.src) {
          const { statusCode, redirected } = fetchResponse;
          const responseHTML = await fetchResponse.responseHTML;
          const response2 = { statusCode, redirected, responseHTML };
          const options = {
            response: response2,
            visitCachedSnapshot,
            willRender: false,
            updateHistory: false,
            restorationIdentifier: this.restorationIdentifier,
            snapshot: pageSnapshot
          };
          if (this.action) options.action = this.action;
          session.visit(frame.src, options);
        }
      };
    }
  }
  changeHistory() {
    if (this.action) {
      const method = getHistoryMethodForAction(this.action);
      session.history.update(method, expandURL(this.element.src || ""), this.restorationIdentifier);
    }
  }
  async #handleUnvisitableFrameResponse(fetchResponse) {
    console.warn(
      `The response (${fetchResponse.statusCode}) from <turbo-frame id="${this.element.id}"> is performing a full page visit due to turbo-visit-control.`
    );
    await this.#visitResponse(fetchResponse.response);
  }
  #willHandleFrameMissingFromResponse(fetchResponse) {
    this.element.setAttribute("complete", "");
    const response2 = fetchResponse.response;
    const visit2 = async (url, options) => {
      if (url instanceof Response) {
        this.#visitResponse(url);
      } else {
        session.visit(url, options);
      }
    };
    const event = dispatch("turbo:frame-missing", {
      target: this.element,
      detail: { response: response2, visit: visit2 },
      cancelable: true
    });
    return !event.defaultPrevented;
  }
  #handleFrameMissingFromResponse(fetchResponse) {
    this.view.missing();
    this.#throwFrameMissingError(fetchResponse);
  }
  #throwFrameMissingError(fetchResponse) {
    const message = `The response (${fetchResponse.statusCode}) did not contain the expected <turbo-frame id="${this.element.id}"> and will be ignored. To perform a full page visit instead, set turbo-visit-control to reload.`;
    throw new TurboFrameMissingError(message);
  }
  async #visitResponse(response2) {
    const wrapped = new FetchResponse(response2);
    const responseHTML = await wrapped.responseHTML;
    const { location: location2, redirected, statusCode } = wrapped;
    return session.visit(location2, { response: { redirected, statusCode, responseHTML } });
  }
  #findFrameElement(element, submitter2) {
    const id2 = getAttribute("data-turbo-frame", submitter2, element) || this.element.getAttribute("target");
    return getFrameElementById(id2) ?? this.element;
  }
  async extractForeignFrameElement(container) {
    let element;
    const id2 = CSS.escape(this.id);
    try {
      element = activateElement(container.querySelector(`turbo-frame#${id2}`), this.sourceURL);
      if (element) {
        return element;
      }
      element = activateElement(container.querySelector(`turbo-frame[src][recurse~=${id2}]`), this.sourceURL);
      if (element) {
        await element.loaded;
        return await this.extractForeignFrameElement(element);
      }
    } catch (error3) {
      console.error(error3);
      return new FrameElement();
    }
    return null;
  }
  #formActionIsVisitable(form, submitter2) {
    const action = getAction$1(form, submitter2);
    return locationIsVisitable(expandURL(action), this.rootLocation);
  }
  #shouldInterceptNavigation(element, submitter2) {
    const id2 = getAttribute("data-turbo-frame", submitter2, element) || this.element.getAttribute("target");
    if (element instanceof HTMLFormElement && !this.#formActionIsVisitable(element, submitter2)) {
      return false;
    }
    if (!this.enabled || id2 == "_top") {
      return false;
    }
    if (id2) {
      const frameElement = getFrameElementById(id2);
      if (frameElement) {
        return !frameElement.disabled;
      }
    }
    if (!session.elementIsNavigatable(element)) {
      return false;
    }
    if (submitter2 && !session.elementIsNavigatable(submitter2)) {
      return false;
    }
    return true;
  }
  // Computed properties
  get id() {
    return this.element.id;
  }
  get enabled() {
    return !this.element.disabled;
  }
  get sourceURL() {
    if (this.element.src) {
      return this.element.src;
    }
  }
  set sourceURL(sourceURL) {
    this.#ignoringChangesToAttribute("src", () => {
      this.element.src = sourceURL ?? null;
    });
  }
  get loadingStyle() {
    return this.element.loading;
  }
  get isLoading() {
    return this.formSubmission !== void 0 || this.#resolveVisitPromise() !== void 0;
  }
  get complete() {
    return this.element.hasAttribute("complete");
  }
  set complete(value) {
    if (value) {
      this.element.setAttribute("complete", "");
    } else {
      this.element.removeAttribute("complete");
    }
  }
  get isActive() {
    return this.element.isActive && this.#connected;
  }
  get rootLocation() {
    const meta = this.element.ownerDocument.querySelector(`meta[name="turbo-root"]`);
    const root = meta?.content ?? "/";
    return expandURL(root);
  }
  #isIgnoringChangesTo(attributeName) {
    return this.#ignoredAttributes.has(attributeName);
  }
  #ignoringChangesToAttribute(attributeName, callback) {
    this.#ignoredAttributes.add(attributeName);
    callback();
    this.#ignoredAttributes.delete(attributeName);
  }
  #withCurrentNavigationElement(element, callback) {
    this.currentNavigationElement = element;
    callback();
    delete this.currentNavigationElement;
  }
};
function getFrameElementById(id2) {
  if (id2 != null) {
    const element = document.getElementById(id2);
    if (element instanceof FrameElement) {
      return element;
    }
  }
}
function activateElement(element, currentURL) {
  if (element) {
    const src = element.getAttribute("src");
    if (src != null && currentURL != null && urlsAreEqual(src, currentURL)) {
      throw new Error(`Matching <turbo-frame id="${element.id}"> element has a source URL which references itself`);
    }
    if (element.ownerDocument !== document) {
      element = document.importNode(element, true);
    }
    if (element instanceof FrameElement) {
      element.connectedCallback();
      element.disconnectedCallback();
      return element;
    }
  }
}
var StreamActions = {
  after() {
    this.targetElements.forEach((e) => e.parentElement?.insertBefore(this.templateContent, e.nextSibling));
  },
  append() {
    this.removeDuplicateTargetChildren();
    this.targetElements.forEach((e) => e.append(this.templateContent));
  },
  before() {
    this.targetElements.forEach((e) => e.parentElement?.insertBefore(this.templateContent, e));
  },
  prepend() {
    this.removeDuplicateTargetChildren();
    this.targetElements.forEach((e) => e.prepend(this.templateContent));
  },
  remove() {
    this.targetElements.forEach((e) => e.remove());
  },
  replace() {
    const method = this.getAttribute("method");
    this.targetElements.forEach((targetElement) => {
      if (method === "morph") {
        morphElements(targetElement, this.templateContent);
      } else {
        targetElement.replaceWith(this.templateContent);
      }
    });
  },
  update() {
    const method = this.getAttribute("method");
    this.targetElements.forEach((targetElement) => {
      if (method === "morph") {
        morphChildren(targetElement, this.templateContent);
      } else {
        targetElement.innerHTML = "";
        targetElement.append(this.templateContent);
      }
    });
  },
  refresh() {
    session.refresh(this.baseURI, this.requestId);
  }
};
var StreamElement = class _StreamElement extends HTMLElement {
  static async renderElement(newElement) {
    await newElement.performAction();
  }
  async connectedCallback() {
    try {
      await this.render();
    } catch (error3) {
      console.error(error3);
    } finally {
      this.disconnect();
    }
  }
  async render() {
    return this.renderPromise ??= (async () => {
      const event = this.beforeRenderEvent;
      if (this.dispatchEvent(event)) {
        await nextRepaint();
        await event.detail.render(this);
      }
    })();
  }
  disconnect() {
    try {
      this.remove();
    } catch {
    }
  }
  /**
   * Removes duplicate children (by ID)
   */
  removeDuplicateTargetChildren() {
    this.duplicateChildren.forEach((c) => c.remove());
  }
  /**
   * Gets the list of duplicate children (i.e. those with the same ID)
   */
  get duplicateChildren() {
    const existingChildren = this.targetElements.flatMap((e) => [...e.children]).filter((c) => !!c.getAttribute("id"));
    const newChildrenIds = [...this.templateContent?.children || []].filter((c) => !!c.getAttribute("id")).map((c) => c.getAttribute("id"));
    return existingChildren.filter((c) => newChildrenIds.includes(c.getAttribute("id")));
  }
  /**
   * Gets the action function to be performed.
   */
  get performAction() {
    if (this.action) {
      const actionFunction = StreamActions[this.action];
      if (actionFunction) {
        return actionFunction;
      }
      this.#raise("unknown action");
    }
    this.#raise("action attribute is missing");
  }
  /**
   * Gets the target elements which the template will be rendered to.
   */
  get targetElements() {
    if (this.target) {
      return this.targetElementsById;
    } else if (this.targets) {
      return this.targetElementsByQuery;
    } else {
      this.#raise("target or targets attribute is missing");
    }
  }
  /**
   * Gets the contents of the main `<template>`.
   */
  get templateContent() {
    return this.templateElement.content.cloneNode(true);
  }
  /**
   * Gets the main `<template>` used for rendering
   */
  get templateElement() {
    if (this.firstElementChild === null) {
      const template2 = this.ownerDocument.createElement("template");
      this.appendChild(template2);
      return template2;
    } else if (this.firstElementChild instanceof HTMLTemplateElement) {
      return this.firstElementChild;
    }
    this.#raise("first child element must be a <template> element");
  }
  /**
   * Gets the current action.
   */
  get action() {
    return this.getAttribute("action");
  }
  /**
   * Gets the current target (an element ID) to which the result will
   * be rendered.
   */
  get target() {
    return this.getAttribute("target");
  }
  /**
   * Gets the current "targets" selector (a CSS selector)
   */
  get targets() {
    return this.getAttribute("targets");
  }
  /**
   * Reads the request-id attribute
   */
  get requestId() {
    return this.getAttribute("request-id");
  }
  #raise(message) {
    throw new Error(`${this.description}: ${message}`);
  }
  get description() {
    return (this.outerHTML.match(/<[^>]+>/) ?? [])[0] ?? "<turbo-stream>";
  }
  get beforeRenderEvent() {
    return new CustomEvent("turbo:before-stream-render", {
      bubbles: true,
      cancelable: true,
      detail: { newStream: this, render: _StreamElement.renderElement }
    });
  }
  get targetElementsById() {
    const element = this.ownerDocument?.getElementById(this.target);
    if (element !== null) {
      return [element];
    } else {
      return [];
    }
  }
  get targetElementsByQuery() {
    const elements = this.ownerDocument?.querySelectorAll(this.targets);
    if (elements.length !== 0) {
      return Array.prototype.slice.call(elements);
    } else {
      return [];
    }
  }
};
var StreamSourceElement = class extends HTMLElement {
  streamSource = null;
  connectedCallback() {
    this.streamSource = this.src.match(/^ws{1,2}:/) ? new WebSocket(this.src) : new EventSource(this.src);
    connectStreamSource(this.streamSource);
  }
  disconnectedCallback() {
    if (this.streamSource) {
      this.streamSource.close();
      disconnectStreamSource(this.streamSource);
    }
  }
  get src() {
    return this.getAttribute("src") || "";
  }
};
FrameElement.delegateConstructor = FrameController;
if (customElements.get("turbo-frame") === void 0) {
  customElements.define("turbo-frame", FrameElement);
}
if (customElements.get("turbo-stream") === void 0) {
  customElements.define("turbo-stream", StreamElement);
}
if (customElements.get("turbo-stream-source") === void 0) {
  customElements.define("turbo-stream-source", StreamSourceElement);
}
(() => {
  let element = document.currentScript;
  if (!element) return;
  if (element.hasAttribute("data-turbo-suppress-warning")) return;
  element = element.parentElement;
  while (element) {
    if (element == document.body) {
      return console.warn(
        unindent`
        You are loading Turbo from a <script> element inside the <body> element. This is probably not what you meant to do!

        Load your application’s JavaScript bundle inside the <head> element instead. <script> elements in <body> are evaluated with each page change.

        For more information, see: https://turbo.hotwired.dev/handbook/building#working-with-script-elements

        ——
        Suppress this warning by adding a "data-turbo-suppress-warning" attribute to: %s
      `,
        element.outerHTML
      );
    }
    element = element.parentElement;
  }
})();
window.Turbo = { ...Turbo, StreamActions };
start();

// node_modules/@hotwired/turbo-rails/app/javascript/turbo/cable.js
var consumer;
async function getConsumer() {
  return consumer || setConsumer(createConsumer2().then(setConsumer));
}
function setConsumer(newConsumer) {
  return consumer = newConsumer;
}
async function createConsumer2() {
  const { createConsumer: createConsumer5 } = await Promise.resolve().then(() => (init_src(), src_exports));
  return createConsumer5();
}
async function subscribeTo(channel, mixin) {
  const { subscriptions } = await getConsumer();
  return subscriptions.create(channel, mixin);
}

// node_modules/@hotwired/turbo-rails/app/javascript/turbo/snakeize.js
function walk(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (obj instanceof Date || obj instanceof RegExp) return obj;
  if (Array.isArray(obj)) return obj.map(walk);
  return Object.keys(obj).reduce(function(acc, key) {
    var camel = key[0].toLowerCase() + key.slice(1).replace(/([A-Z]+)/g, function(m, x) {
      return "_" + x.toLowerCase();
    });
    acc[camel] = walk(obj[key]);
    return acc;
  }, {});
}

// node_modules/@hotwired/turbo-rails/app/javascript/turbo/cable_stream_source_element.js
var TurboCableStreamSourceElement = class extends HTMLElement {
  static observedAttributes = ["channel", "signed-stream-name"];
  async connectedCallback() {
    connectStreamSource(this);
    this.subscription = await subscribeTo(this.channel, {
      received: this.dispatchMessageEvent.bind(this),
      connected: this.subscriptionConnected.bind(this),
      disconnected: this.subscriptionDisconnected.bind(this)
    });
  }
  disconnectedCallback() {
    disconnectStreamSource(this);
    if (this.subscription) this.subscription.unsubscribe();
    this.subscriptionDisconnected();
  }
  attributeChangedCallback() {
    if (this.subscription) {
      this.disconnectedCallback();
      this.connectedCallback();
    }
  }
  dispatchMessageEvent(data) {
    const event = new MessageEvent("message", { data });
    return this.dispatchEvent(event);
  }
  subscriptionConnected() {
    this.setAttribute("connected", "");
  }
  subscriptionDisconnected() {
    this.removeAttribute("connected");
  }
  get channel() {
    const channel = this.getAttribute("channel");
    const signed_stream_name = this.getAttribute("signed-stream-name");
    return { channel, signed_stream_name, ...walk({ ...this.dataset }) };
  }
};
if (customElements.get("turbo-cable-stream-source") === void 0) {
  customElements.define("turbo-cable-stream-source", TurboCableStreamSourceElement);
}

// node_modules/@hotwired/turbo-rails/app/javascript/turbo/fetch_requests.js
function encodeMethodIntoRequestBody(event) {
  if (event.target instanceof HTMLFormElement) {
    const { target: form, detail: { fetchOptions } } = event;
    form.addEventListener("turbo:submit-start", ({ detail: { formSubmission: { submitter: submitter2 } } }) => {
      const body = isBodyInit(fetchOptions.body) ? fetchOptions.body : new URLSearchParams();
      const method = determineFetchMethod(submitter2, body, form);
      if (!/get/i.test(method)) {
        if (/post/i.test(method)) {
          body.delete("_method");
        } else {
          body.set("_method", method);
        }
        fetchOptions.method = "post";
      }
    }, { once: true });
  }
}
function determineFetchMethod(submitter2, body, form) {
  const formMethod = determineFormMethod(submitter2);
  const overrideMethod = body.get("_method");
  const method = form.getAttribute("method") || "get";
  if (typeof formMethod == "string") {
    return formMethod;
  } else if (typeof overrideMethod == "string") {
    return overrideMethod;
  } else {
    return method;
  }
}
function determineFormMethod(submitter2) {
  if (submitter2 instanceof HTMLButtonElement || submitter2 instanceof HTMLInputElement) {
    if (submitter2.name === "_method") {
      return submitter2.value;
    } else if (submitter2.hasAttribute("formmethod")) {
      return submitter2.formMethod;
    } else {
      return null;
    }
  } else {
    return null;
  }
}
function isBodyInit(body) {
  return body instanceof FormData || body instanceof URLSearchParams;
}

// node_modules/@hotwired/turbo-rails/app/javascript/turbo/index.js
window.Turbo = turbo_es2017_esm_exports;
addEventListener("turbo:before-fetch-request", encodeMethodIntoRequestBody);

// node_modules/@hotwired/stimulus/dist/stimulus.js
var EventListener = class {
  constructor(eventTarget, eventName, eventOptions) {
    this.eventTarget = eventTarget;
    this.eventName = eventName;
    this.eventOptions = eventOptions;
    this.unorderedBindings = /* @__PURE__ */ new Set();
  }
  connect() {
    this.eventTarget.addEventListener(this.eventName, this, this.eventOptions);
  }
  disconnect() {
    this.eventTarget.removeEventListener(this.eventName, this, this.eventOptions);
  }
  bindingConnected(binding) {
    this.unorderedBindings.add(binding);
  }
  bindingDisconnected(binding) {
    this.unorderedBindings.delete(binding);
  }
  handleEvent(event) {
    const extendedEvent = extendEvent(event);
    for (const binding of this.bindings) {
      if (extendedEvent.immediatePropagationStopped) {
        break;
      } else {
        binding.handleEvent(extendedEvent);
      }
    }
  }
  hasBindings() {
    return this.unorderedBindings.size > 0;
  }
  get bindings() {
    return Array.from(this.unorderedBindings).sort((left, right) => {
      const leftIndex = left.index, rightIndex = right.index;
      return leftIndex < rightIndex ? -1 : leftIndex > rightIndex ? 1 : 0;
    });
  }
};
function extendEvent(event) {
  if ("immediatePropagationStopped" in event) {
    return event;
  } else {
    const { stopImmediatePropagation } = event;
    return Object.assign(event, {
      immediatePropagationStopped: false,
      stopImmediatePropagation() {
        this.immediatePropagationStopped = true;
        stopImmediatePropagation.call(this);
      }
    });
  }
}
var Dispatcher = class {
  constructor(application2) {
    this.application = application2;
    this.eventListenerMaps = /* @__PURE__ */ new Map();
    this.started = false;
  }
  start() {
    if (!this.started) {
      this.started = true;
      this.eventListeners.forEach((eventListener) => eventListener.connect());
    }
  }
  stop() {
    if (this.started) {
      this.started = false;
      this.eventListeners.forEach((eventListener) => eventListener.disconnect());
    }
  }
  get eventListeners() {
    return Array.from(this.eventListenerMaps.values()).reduce((listeners, map) => listeners.concat(Array.from(map.values())), []);
  }
  bindingConnected(binding) {
    this.fetchEventListenerForBinding(binding).bindingConnected(binding);
  }
  bindingDisconnected(binding, clearEventListeners = false) {
    this.fetchEventListenerForBinding(binding).bindingDisconnected(binding);
    if (clearEventListeners)
      this.clearEventListenersForBinding(binding);
  }
  handleError(error3, message, detail = {}) {
    this.application.handleError(error3, `Error ${message}`, detail);
  }
  clearEventListenersForBinding(binding) {
    const eventListener = this.fetchEventListenerForBinding(binding);
    if (!eventListener.hasBindings()) {
      eventListener.disconnect();
      this.removeMappedEventListenerFor(binding);
    }
  }
  removeMappedEventListenerFor(binding) {
    const { eventTarget, eventName, eventOptions } = binding;
    const eventListenerMap = this.fetchEventListenerMapForEventTarget(eventTarget);
    const cacheKey = this.cacheKey(eventName, eventOptions);
    eventListenerMap.delete(cacheKey);
    if (eventListenerMap.size == 0)
      this.eventListenerMaps.delete(eventTarget);
  }
  fetchEventListenerForBinding(binding) {
    const { eventTarget, eventName, eventOptions } = binding;
    return this.fetchEventListener(eventTarget, eventName, eventOptions);
  }
  fetchEventListener(eventTarget, eventName, eventOptions) {
    const eventListenerMap = this.fetchEventListenerMapForEventTarget(eventTarget);
    const cacheKey = this.cacheKey(eventName, eventOptions);
    let eventListener = eventListenerMap.get(cacheKey);
    if (!eventListener) {
      eventListener = this.createEventListener(eventTarget, eventName, eventOptions);
      eventListenerMap.set(cacheKey, eventListener);
    }
    return eventListener;
  }
  createEventListener(eventTarget, eventName, eventOptions) {
    const eventListener = new EventListener(eventTarget, eventName, eventOptions);
    if (this.started) {
      eventListener.connect();
    }
    return eventListener;
  }
  fetchEventListenerMapForEventTarget(eventTarget) {
    let eventListenerMap = this.eventListenerMaps.get(eventTarget);
    if (!eventListenerMap) {
      eventListenerMap = /* @__PURE__ */ new Map();
      this.eventListenerMaps.set(eventTarget, eventListenerMap);
    }
    return eventListenerMap;
  }
  cacheKey(eventName, eventOptions) {
    const parts = [eventName];
    Object.keys(eventOptions).sort().forEach((key) => {
      parts.push(`${eventOptions[key] ? "" : "!"}${key}`);
    });
    return parts.join(":");
  }
};
var defaultActionDescriptorFilters = {
  stop({ event, value }) {
    if (value)
      event.stopPropagation();
    return true;
  },
  prevent({ event, value }) {
    if (value)
      event.preventDefault();
    return true;
  },
  self({ event, value, element }) {
    if (value) {
      return element === event.target;
    } else {
      return true;
    }
  }
};
var descriptorPattern = /^(?:(?:([^.]+?)\+)?(.+?)(?:\.(.+?))?(?:@(window|document))?->)?(.+?)(?:#([^:]+?))(?::(.+))?$/;
function parseActionDescriptorString(descriptorString) {
  const source = descriptorString.trim();
  const matches = source.match(descriptorPattern) || [];
  let eventName = matches[2];
  let keyFilter = matches[3];
  if (keyFilter && !["keydown", "keyup", "keypress"].includes(eventName)) {
    eventName += `.${keyFilter}`;
    keyFilter = "";
  }
  return {
    eventTarget: parseEventTarget(matches[4]),
    eventName,
    eventOptions: matches[7] ? parseEventOptions(matches[7]) : {},
    identifier: matches[5],
    methodName: matches[6],
    keyFilter: matches[1] || keyFilter
  };
}
function parseEventTarget(eventTargetName) {
  if (eventTargetName == "window") {
    return window;
  } else if (eventTargetName == "document") {
    return document;
  }
}
function parseEventOptions(eventOptions) {
  return eventOptions.split(":").reduce((options, token) => Object.assign(options, { [token.replace(/^!/, "")]: !/^!/.test(token) }), {});
}
function stringifyEventTarget(eventTarget) {
  if (eventTarget == window) {
    return "window";
  } else if (eventTarget == document) {
    return "document";
  }
}
function camelize(value) {
  return value.replace(/(?:[_-])([a-z0-9])/g, (_, char) => char.toUpperCase());
}
function namespaceCamelize(value) {
  return camelize(value.replace(/--/g, "-").replace(/__/g, "_"));
}
function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
function dasherize(value) {
  return value.replace(/([A-Z])/g, (_, char) => `-${char.toLowerCase()}`);
}
function tokenize(value) {
  return value.match(/[^\s]+/g) || [];
}
function isSomething(object) {
  return object !== null && object !== void 0;
}
function hasProperty(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}
var allModifiers = ["meta", "ctrl", "alt", "shift"];
var Action = class {
  constructor(element, index, descriptor, schema2) {
    this.element = element;
    this.index = index;
    this.eventTarget = descriptor.eventTarget || element;
    this.eventName = descriptor.eventName || getDefaultEventNameForElement(element) || error("missing event name");
    this.eventOptions = descriptor.eventOptions || {};
    this.identifier = descriptor.identifier || error("missing identifier");
    this.methodName = descriptor.methodName || error("missing method name");
    this.keyFilter = descriptor.keyFilter || "";
    this.schema = schema2;
  }
  static forToken(token, schema2) {
    return new this(token.element, token.index, parseActionDescriptorString(token.content), schema2);
  }
  toString() {
    const eventFilter = this.keyFilter ? `.${this.keyFilter}` : "";
    const eventTarget = this.eventTargetName ? `@${this.eventTargetName}` : "";
    return `${this.eventName}${eventFilter}${eventTarget}->${this.identifier}#${this.methodName}`;
  }
  shouldIgnoreKeyboardEvent(event) {
    if (!this.keyFilter) {
      return false;
    }
    const filters = this.keyFilter.split("+");
    if (this.keyFilterDissatisfied(event, filters)) {
      return true;
    }
    const standardFilter = filters.filter((key) => !allModifiers.includes(key))[0];
    if (!standardFilter) {
      return false;
    }
    if (!hasProperty(this.keyMappings, standardFilter)) {
      error(`contains unknown key filter: ${this.keyFilter}`);
    }
    return this.keyMappings[standardFilter].toLowerCase() !== event.key.toLowerCase();
  }
  shouldIgnoreMouseEvent(event) {
    if (!this.keyFilter) {
      return false;
    }
    const filters = [this.keyFilter];
    if (this.keyFilterDissatisfied(event, filters)) {
      return true;
    }
    return false;
  }
  get params() {
    const params2 = {};
    const pattern = new RegExp(`^data-${this.identifier}-(.+)-param$`, "i");
    for (const { name: name3, value } of Array.from(this.element.attributes)) {
      const match = name3.match(pattern);
      const key = match && match[1];
      if (key) {
        params2[camelize(key)] = typecast(value);
      }
    }
    return params2;
  }
  get eventTargetName() {
    return stringifyEventTarget(this.eventTarget);
  }
  get keyMappings() {
    return this.schema.keyMappings;
  }
  keyFilterDissatisfied(event, filters) {
    const [meta, ctrl, alt, shift] = allModifiers.map((modifier) => filters.includes(modifier));
    return event.metaKey !== meta || event.ctrlKey !== ctrl || event.altKey !== alt || event.shiftKey !== shift;
  }
};
var defaultEventNames = {
  a: () => "click",
  button: () => "click",
  form: () => "submit",
  details: () => "toggle",
  input: (e) => e.getAttribute("type") == "submit" ? "click" : "input",
  select: () => "change",
  textarea: () => "input"
};
function getDefaultEventNameForElement(element) {
  const tagName = element.tagName.toLowerCase();
  if (tagName in defaultEventNames) {
    return defaultEventNames[tagName](element);
  }
}
function error(message) {
  throw new Error(message);
}
function typecast(value) {
  try {
    return JSON.parse(value);
  } catch (o_O) {
    return value;
  }
}
var Binding = class {
  constructor(context, action) {
    this.context = context;
    this.action = action;
  }
  get index() {
    return this.action.index;
  }
  get eventTarget() {
    return this.action.eventTarget;
  }
  get eventOptions() {
    return this.action.eventOptions;
  }
  get identifier() {
    return this.context.identifier;
  }
  handleEvent(event) {
    const actionEvent = this.prepareActionEvent(event);
    if (this.willBeInvokedByEvent(event) && this.applyEventModifiers(actionEvent)) {
      this.invokeWithEvent(actionEvent);
    }
  }
  get eventName() {
    return this.action.eventName;
  }
  get method() {
    const method = this.controller[this.methodName];
    if (typeof method == "function") {
      return method;
    }
    throw new Error(`Action "${this.action}" references undefined method "${this.methodName}"`);
  }
  applyEventModifiers(event) {
    const { element } = this.action;
    const { actionDescriptorFilters } = this.context.application;
    const { controller } = this.context;
    let passes = true;
    for (const [name3, value] of Object.entries(this.eventOptions)) {
      if (name3 in actionDescriptorFilters) {
        const filter = actionDescriptorFilters[name3];
        passes = passes && filter({ name: name3, value, event, element, controller });
      } else {
        continue;
      }
    }
    return passes;
  }
  prepareActionEvent(event) {
    return Object.assign(event, { params: this.action.params });
  }
  invokeWithEvent(event) {
    const { target, currentTarget } = event;
    try {
      this.method.call(this.controller, event);
      this.context.logDebugActivity(this.methodName, { event, target, currentTarget, action: this.methodName });
    } catch (error3) {
      const { identifier, controller, element, index } = this;
      const detail = { identifier, controller, element, index, event };
      this.context.handleError(error3, `invoking action "${this.action}"`, detail);
    }
  }
  willBeInvokedByEvent(event) {
    const eventTarget = event.target;
    if (event instanceof KeyboardEvent && this.action.shouldIgnoreKeyboardEvent(event)) {
      return false;
    }
    if (event instanceof MouseEvent && this.action.shouldIgnoreMouseEvent(event)) {
      return false;
    }
    if (this.element === eventTarget) {
      return true;
    } else if (eventTarget instanceof Element && this.element.contains(eventTarget)) {
      return this.scope.containsElement(eventTarget);
    } else {
      return this.scope.containsElement(this.action.element);
    }
  }
  get controller() {
    return this.context.controller;
  }
  get methodName() {
    return this.action.methodName;
  }
  get element() {
    return this.scope.element;
  }
  get scope() {
    return this.context.scope;
  }
};
var ElementObserver = class {
  constructor(element, delegate) {
    this.mutationObserverInit = { attributes: true, childList: true, subtree: true };
    this.element = element;
    this.started = false;
    this.delegate = delegate;
    this.elements = /* @__PURE__ */ new Set();
    this.mutationObserver = new MutationObserver((mutations) => this.processMutations(mutations));
  }
  start() {
    if (!this.started) {
      this.started = true;
      this.mutationObserver.observe(this.element, this.mutationObserverInit);
      this.refresh();
    }
  }
  pause(callback) {
    if (this.started) {
      this.mutationObserver.disconnect();
      this.started = false;
    }
    callback();
    if (!this.started) {
      this.mutationObserver.observe(this.element, this.mutationObserverInit);
      this.started = true;
    }
  }
  stop() {
    if (this.started) {
      this.mutationObserver.takeRecords();
      this.mutationObserver.disconnect();
      this.started = false;
    }
  }
  refresh() {
    if (this.started) {
      const matches = new Set(this.matchElementsInTree());
      for (const element of Array.from(this.elements)) {
        if (!matches.has(element)) {
          this.removeElement(element);
        }
      }
      for (const element of Array.from(matches)) {
        this.addElement(element);
      }
    }
  }
  processMutations(mutations) {
    if (this.started) {
      for (const mutation of mutations) {
        this.processMutation(mutation);
      }
    }
  }
  processMutation(mutation) {
    if (mutation.type == "attributes") {
      this.processAttributeChange(mutation.target, mutation.attributeName);
    } else if (mutation.type == "childList") {
      this.processRemovedNodes(mutation.removedNodes);
      this.processAddedNodes(mutation.addedNodes);
    }
  }
  processAttributeChange(element, attributeName) {
    if (this.elements.has(element)) {
      if (this.delegate.elementAttributeChanged && this.matchElement(element)) {
        this.delegate.elementAttributeChanged(element, attributeName);
      } else {
        this.removeElement(element);
      }
    } else if (this.matchElement(element)) {
      this.addElement(element);
    }
  }
  processRemovedNodes(nodes) {
    for (const node of Array.from(nodes)) {
      const element = this.elementFromNode(node);
      if (element) {
        this.processTree(element, this.removeElement);
      }
    }
  }
  processAddedNodes(nodes) {
    for (const node of Array.from(nodes)) {
      const element = this.elementFromNode(node);
      if (element && this.elementIsActive(element)) {
        this.processTree(element, this.addElement);
      }
    }
  }
  matchElement(element) {
    return this.delegate.matchElement(element);
  }
  matchElementsInTree(tree = this.element) {
    return this.delegate.matchElementsInTree(tree);
  }
  processTree(tree, processor) {
    for (const element of this.matchElementsInTree(tree)) {
      processor.call(this, element);
    }
  }
  elementFromNode(node) {
    if (node.nodeType == Node.ELEMENT_NODE) {
      return node;
    }
  }
  elementIsActive(element) {
    if (element.isConnected != this.element.isConnected) {
      return false;
    } else {
      return this.element.contains(element);
    }
  }
  addElement(element) {
    if (!this.elements.has(element)) {
      if (this.elementIsActive(element)) {
        this.elements.add(element);
        if (this.delegate.elementMatched) {
          this.delegate.elementMatched(element);
        }
      }
    }
  }
  removeElement(element) {
    if (this.elements.has(element)) {
      this.elements.delete(element);
      if (this.delegate.elementUnmatched) {
        this.delegate.elementUnmatched(element);
      }
    }
  }
};
var AttributeObserver = class {
  constructor(element, attributeName, delegate) {
    this.attributeName = attributeName;
    this.delegate = delegate;
    this.elementObserver = new ElementObserver(element, this);
  }
  get element() {
    return this.elementObserver.element;
  }
  get selector() {
    return `[${this.attributeName}]`;
  }
  start() {
    this.elementObserver.start();
  }
  pause(callback) {
    this.elementObserver.pause(callback);
  }
  stop() {
    this.elementObserver.stop();
  }
  refresh() {
    this.elementObserver.refresh();
  }
  get started() {
    return this.elementObserver.started;
  }
  matchElement(element) {
    return element.hasAttribute(this.attributeName);
  }
  matchElementsInTree(tree) {
    const match = this.matchElement(tree) ? [tree] : [];
    const matches = Array.from(tree.querySelectorAll(this.selector));
    return match.concat(matches);
  }
  elementMatched(element) {
    if (this.delegate.elementMatchedAttribute) {
      this.delegate.elementMatchedAttribute(element, this.attributeName);
    }
  }
  elementUnmatched(element) {
    if (this.delegate.elementUnmatchedAttribute) {
      this.delegate.elementUnmatchedAttribute(element, this.attributeName);
    }
  }
  elementAttributeChanged(element, attributeName) {
    if (this.delegate.elementAttributeValueChanged && this.attributeName == attributeName) {
      this.delegate.elementAttributeValueChanged(element, attributeName);
    }
  }
};
function add(map, key, value) {
  fetch2(map, key).add(value);
}
function del(map, key, value) {
  fetch2(map, key).delete(value);
  prune(map, key);
}
function fetch2(map, key) {
  let values = map.get(key);
  if (!values) {
    values = /* @__PURE__ */ new Set();
    map.set(key, values);
  }
  return values;
}
function prune(map, key) {
  const values = map.get(key);
  if (values != null && values.size == 0) {
    map.delete(key);
  }
}
var Multimap = class {
  constructor() {
    this.valuesByKey = /* @__PURE__ */ new Map();
  }
  get keys() {
    return Array.from(this.valuesByKey.keys());
  }
  get values() {
    const sets = Array.from(this.valuesByKey.values());
    return sets.reduce((values, set) => values.concat(Array.from(set)), []);
  }
  get size() {
    const sets = Array.from(this.valuesByKey.values());
    return sets.reduce((size, set) => size + set.size, 0);
  }
  add(key, value) {
    add(this.valuesByKey, key, value);
  }
  delete(key, value) {
    del(this.valuesByKey, key, value);
  }
  has(key, value) {
    const values = this.valuesByKey.get(key);
    return values != null && values.has(value);
  }
  hasKey(key) {
    return this.valuesByKey.has(key);
  }
  hasValue(value) {
    const sets = Array.from(this.valuesByKey.values());
    return sets.some((set) => set.has(value));
  }
  getValuesForKey(key) {
    const values = this.valuesByKey.get(key);
    return values ? Array.from(values) : [];
  }
  getKeysForValue(value) {
    return Array.from(this.valuesByKey).filter(([_key, values]) => values.has(value)).map(([key, _values]) => key);
  }
};
var SelectorObserver = class {
  constructor(element, selector, delegate, details) {
    this._selector = selector;
    this.details = details;
    this.elementObserver = new ElementObserver(element, this);
    this.delegate = delegate;
    this.matchesByElement = new Multimap();
  }
  get started() {
    return this.elementObserver.started;
  }
  get selector() {
    return this._selector;
  }
  set selector(selector) {
    this._selector = selector;
    this.refresh();
  }
  start() {
    this.elementObserver.start();
  }
  pause(callback) {
    this.elementObserver.pause(callback);
  }
  stop() {
    this.elementObserver.stop();
  }
  refresh() {
    this.elementObserver.refresh();
  }
  get element() {
    return this.elementObserver.element;
  }
  matchElement(element) {
    const { selector } = this;
    if (selector) {
      const matches = element.matches(selector);
      if (this.delegate.selectorMatchElement) {
        return matches && this.delegate.selectorMatchElement(element, this.details);
      }
      return matches;
    } else {
      return false;
    }
  }
  matchElementsInTree(tree) {
    const { selector } = this;
    if (selector) {
      const match = this.matchElement(tree) ? [tree] : [];
      const matches = Array.from(tree.querySelectorAll(selector)).filter((match2) => this.matchElement(match2));
      return match.concat(matches);
    } else {
      return [];
    }
  }
  elementMatched(element) {
    const { selector } = this;
    if (selector) {
      this.selectorMatched(element, selector);
    }
  }
  elementUnmatched(element) {
    const selectors = this.matchesByElement.getKeysForValue(element);
    for (const selector of selectors) {
      this.selectorUnmatched(element, selector);
    }
  }
  elementAttributeChanged(element, _attributeName) {
    const { selector } = this;
    if (selector) {
      const matches = this.matchElement(element);
      const matchedBefore = this.matchesByElement.has(selector, element);
      if (matches && !matchedBefore) {
        this.selectorMatched(element, selector);
      } else if (!matches && matchedBefore) {
        this.selectorUnmatched(element, selector);
      }
    }
  }
  selectorMatched(element, selector) {
    this.delegate.selectorMatched(element, selector, this.details);
    this.matchesByElement.add(selector, element);
  }
  selectorUnmatched(element, selector) {
    this.delegate.selectorUnmatched(element, selector, this.details);
    this.matchesByElement.delete(selector, element);
  }
};
var StringMapObserver = class {
  constructor(element, delegate) {
    this.element = element;
    this.delegate = delegate;
    this.started = false;
    this.stringMap = /* @__PURE__ */ new Map();
    this.mutationObserver = new MutationObserver((mutations) => this.processMutations(mutations));
  }
  start() {
    if (!this.started) {
      this.started = true;
      this.mutationObserver.observe(this.element, { attributes: true, attributeOldValue: true });
      this.refresh();
    }
  }
  stop() {
    if (this.started) {
      this.mutationObserver.takeRecords();
      this.mutationObserver.disconnect();
      this.started = false;
    }
  }
  refresh() {
    if (this.started) {
      for (const attributeName of this.knownAttributeNames) {
        this.refreshAttribute(attributeName, null);
      }
    }
  }
  processMutations(mutations) {
    if (this.started) {
      for (const mutation of mutations) {
        this.processMutation(mutation);
      }
    }
  }
  processMutation(mutation) {
    const attributeName = mutation.attributeName;
    if (attributeName) {
      this.refreshAttribute(attributeName, mutation.oldValue);
    }
  }
  refreshAttribute(attributeName, oldValue) {
    const key = this.delegate.getStringMapKeyForAttribute(attributeName);
    if (key != null) {
      if (!this.stringMap.has(attributeName)) {
        this.stringMapKeyAdded(key, attributeName);
      }
      const value = this.element.getAttribute(attributeName);
      if (this.stringMap.get(attributeName) != value) {
        this.stringMapValueChanged(value, key, oldValue);
      }
      if (value == null) {
        const oldValue2 = this.stringMap.get(attributeName);
        this.stringMap.delete(attributeName);
        if (oldValue2)
          this.stringMapKeyRemoved(key, attributeName, oldValue2);
      } else {
        this.stringMap.set(attributeName, value);
      }
    }
  }
  stringMapKeyAdded(key, attributeName) {
    if (this.delegate.stringMapKeyAdded) {
      this.delegate.stringMapKeyAdded(key, attributeName);
    }
  }
  stringMapValueChanged(value, key, oldValue) {
    if (this.delegate.stringMapValueChanged) {
      this.delegate.stringMapValueChanged(value, key, oldValue);
    }
  }
  stringMapKeyRemoved(key, attributeName, oldValue) {
    if (this.delegate.stringMapKeyRemoved) {
      this.delegate.stringMapKeyRemoved(key, attributeName, oldValue);
    }
  }
  get knownAttributeNames() {
    return Array.from(new Set(this.currentAttributeNames.concat(this.recordedAttributeNames)));
  }
  get currentAttributeNames() {
    return Array.from(this.element.attributes).map((attribute) => attribute.name);
  }
  get recordedAttributeNames() {
    return Array.from(this.stringMap.keys());
  }
};
var TokenListObserver = class {
  constructor(element, attributeName, delegate) {
    this.attributeObserver = new AttributeObserver(element, attributeName, this);
    this.delegate = delegate;
    this.tokensByElement = new Multimap();
  }
  get started() {
    return this.attributeObserver.started;
  }
  start() {
    this.attributeObserver.start();
  }
  pause(callback) {
    this.attributeObserver.pause(callback);
  }
  stop() {
    this.attributeObserver.stop();
  }
  refresh() {
    this.attributeObserver.refresh();
  }
  get element() {
    return this.attributeObserver.element;
  }
  get attributeName() {
    return this.attributeObserver.attributeName;
  }
  elementMatchedAttribute(element) {
    this.tokensMatched(this.readTokensForElement(element));
  }
  elementAttributeValueChanged(element) {
    const [unmatchedTokens, matchedTokens] = this.refreshTokensForElement(element);
    this.tokensUnmatched(unmatchedTokens);
    this.tokensMatched(matchedTokens);
  }
  elementUnmatchedAttribute(element) {
    this.tokensUnmatched(this.tokensByElement.getValuesForKey(element));
  }
  tokensMatched(tokens) {
    tokens.forEach((token) => this.tokenMatched(token));
  }
  tokensUnmatched(tokens) {
    tokens.forEach((token) => this.tokenUnmatched(token));
  }
  tokenMatched(token) {
    this.delegate.tokenMatched(token);
    this.tokensByElement.add(token.element, token);
  }
  tokenUnmatched(token) {
    this.delegate.tokenUnmatched(token);
    this.tokensByElement.delete(token.element, token);
  }
  refreshTokensForElement(element) {
    const previousTokens = this.tokensByElement.getValuesForKey(element);
    const currentTokens = this.readTokensForElement(element);
    const firstDifferingIndex = zip(previousTokens, currentTokens).findIndex(([previousToken, currentToken]) => !tokensAreEqual(previousToken, currentToken));
    if (firstDifferingIndex == -1) {
      return [[], []];
    } else {
      return [previousTokens.slice(firstDifferingIndex), currentTokens.slice(firstDifferingIndex)];
    }
  }
  readTokensForElement(element) {
    const attributeName = this.attributeName;
    const tokenString = element.getAttribute(attributeName) || "";
    return parseTokenString(tokenString, element, attributeName);
  }
};
function parseTokenString(tokenString, element, attributeName) {
  return tokenString.trim().split(/\s+/).filter((content) => content.length).map((content, index) => ({ element, attributeName, content, index }));
}
function zip(left, right) {
  const length = Math.max(left.length, right.length);
  return Array.from({ length }, (_, index) => [left[index], right[index]]);
}
function tokensAreEqual(left, right) {
  return left && right && left.index == right.index && left.content == right.content;
}
var ValueListObserver = class {
  constructor(element, attributeName, delegate) {
    this.tokenListObserver = new TokenListObserver(element, attributeName, this);
    this.delegate = delegate;
    this.parseResultsByToken = /* @__PURE__ */ new WeakMap();
    this.valuesByTokenByElement = /* @__PURE__ */ new WeakMap();
  }
  get started() {
    return this.tokenListObserver.started;
  }
  start() {
    this.tokenListObserver.start();
  }
  stop() {
    this.tokenListObserver.stop();
  }
  refresh() {
    this.tokenListObserver.refresh();
  }
  get element() {
    return this.tokenListObserver.element;
  }
  get attributeName() {
    return this.tokenListObserver.attributeName;
  }
  tokenMatched(token) {
    const { element } = token;
    const { value } = this.fetchParseResultForToken(token);
    if (value) {
      this.fetchValuesByTokenForElement(element).set(token, value);
      this.delegate.elementMatchedValue(element, value);
    }
  }
  tokenUnmatched(token) {
    const { element } = token;
    const { value } = this.fetchParseResultForToken(token);
    if (value) {
      this.fetchValuesByTokenForElement(element).delete(token);
      this.delegate.elementUnmatchedValue(element, value);
    }
  }
  fetchParseResultForToken(token) {
    let parseResult = this.parseResultsByToken.get(token);
    if (!parseResult) {
      parseResult = this.parseToken(token);
      this.parseResultsByToken.set(token, parseResult);
    }
    return parseResult;
  }
  fetchValuesByTokenForElement(element) {
    let valuesByToken = this.valuesByTokenByElement.get(element);
    if (!valuesByToken) {
      valuesByToken = /* @__PURE__ */ new Map();
      this.valuesByTokenByElement.set(element, valuesByToken);
    }
    return valuesByToken;
  }
  parseToken(token) {
    try {
      const value = this.delegate.parseValueForToken(token);
      return { value };
    } catch (error3) {
      return { error: error3 };
    }
  }
};
var BindingObserver = class {
  constructor(context, delegate) {
    this.context = context;
    this.delegate = delegate;
    this.bindingsByAction = /* @__PURE__ */ new Map();
  }
  start() {
    if (!this.valueListObserver) {
      this.valueListObserver = new ValueListObserver(this.element, this.actionAttribute, this);
      this.valueListObserver.start();
    }
  }
  stop() {
    if (this.valueListObserver) {
      this.valueListObserver.stop();
      delete this.valueListObserver;
      this.disconnectAllActions();
    }
  }
  get element() {
    return this.context.element;
  }
  get identifier() {
    return this.context.identifier;
  }
  get actionAttribute() {
    return this.schema.actionAttribute;
  }
  get schema() {
    return this.context.schema;
  }
  get bindings() {
    return Array.from(this.bindingsByAction.values());
  }
  connectAction(action) {
    const binding = new Binding(this.context, action);
    this.bindingsByAction.set(action, binding);
    this.delegate.bindingConnected(binding);
  }
  disconnectAction(action) {
    const binding = this.bindingsByAction.get(action);
    if (binding) {
      this.bindingsByAction.delete(action);
      this.delegate.bindingDisconnected(binding);
    }
  }
  disconnectAllActions() {
    this.bindings.forEach((binding) => this.delegate.bindingDisconnected(binding, true));
    this.bindingsByAction.clear();
  }
  parseValueForToken(token) {
    const action = Action.forToken(token, this.schema);
    if (action.identifier == this.identifier) {
      return action;
    }
  }
  elementMatchedValue(element, action) {
    this.connectAction(action);
  }
  elementUnmatchedValue(element, action) {
    this.disconnectAction(action);
  }
};
var ValueObserver = class {
  constructor(context, receiver) {
    this.context = context;
    this.receiver = receiver;
    this.stringMapObserver = new StringMapObserver(this.element, this);
    this.valueDescriptorMap = this.controller.valueDescriptorMap;
  }
  start() {
    this.stringMapObserver.start();
    this.invokeChangedCallbacksForDefaultValues();
  }
  stop() {
    this.stringMapObserver.stop();
  }
  get element() {
    return this.context.element;
  }
  get controller() {
    return this.context.controller;
  }
  getStringMapKeyForAttribute(attributeName) {
    if (attributeName in this.valueDescriptorMap) {
      return this.valueDescriptorMap[attributeName].name;
    }
  }
  stringMapKeyAdded(key, attributeName) {
    const descriptor = this.valueDescriptorMap[attributeName];
    if (!this.hasValue(key)) {
      this.invokeChangedCallback(key, descriptor.writer(this.receiver[key]), descriptor.writer(descriptor.defaultValue));
    }
  }
  stringMapValueChanged(value, name3, oldValue) {
    const descriptor = this.valueDescriptorNameMap[name3];
    if (value === null)
      return;
    if (oldValue === null) {
      oldValue = descriptor.writer(descriptor.defaultValue);
    }
    this.invokeChangedCallback(name3, value, oldValue);
  }
  stringMapKeyRemoved(key, attributeName, oldValue) {
    const descriptor = this.valueDescriptorNameMap[key];
    if (this.hasValue(key)) {
      this.invokeChangedCallback(key, descriptor.writer(this.receiver[key]), oldValue);
    } else {
      this.invokeChangedCallback(key, descriptor.writer(descriptor.defaultValue), oldValue);
    }
  }
  invokeChangedCallbacksForDefaultValues() {
    for (const { key, name: name3, defaultValue, writer } of this.valueDescriptors) {
      if (defaultValue != void 0 && !this.controller.data.has(key)) {
        this.invokeChangedCallback(name3, writer(defaultValue), void 0);
      }
    }
  }
  invokeChangedCallback(name3, rawValue, rawOldValue) {
    const changedMethodName = `${name3}Changed`;
    const changedMethod = this.receiver[changedMethodName];
    if (typeof changedMethod == "function") {
      const descriptor = this.valueDescriptorNameMap[name3];
      try {
        const value = descriptor.reader(rawValue);
        let oldValue = rawOldValue;
        if (rawOldValue) {
          oldValue = descriptor.reader(rawOldValue);
        }
        changedMethod.call(this.receiver, value, oldValue);
      } catch (error3) {
        if (error3 instanceof TypeError) {
          error3.message = `Stimulus Value "${this.context.identifier}.${descriptor.name}" - ${error3.message}`;
        }
        throw error3;
      }
    }
  }
  get valueDescriptors() {
    const { valueDescriptorMap } = this;
    return Object.keys(valueDescriptorMap).map((key) => valueDescriptorMap[key]);
  }
  get valueDescriptorNameMap() {
    const descriptors = {};
    Object.keys(this.valueDescriptorMap).forEach((key) => {
      const descriptor = this.valueDescriptorMap[key];
      descriptors[descriptor.name] = descriptor;
    });
    return descriptors;
  }
  hasValue(attributeName) {
    const descriptor = this.valueDescriptorNameMap[attributeName];
    const hasMethodName = `has${capitalize(descriptor.name)}`;
    return this.receiver[hasMethodName];
  }
};
var TargetObserver = class {
  constructor(context, delegate) {
    this.context = context;
    this.delegate = delegate;
    this.targetsByName = new Multimap();
  }
  start() {
    if (!this.tokenListObserver) {
      this.tokenListObserver = new TokenListObserver(this.element, this.attributeName, this);
      this.tokenListObserver.start();
    }
  }
  stop() {
    if (this.tokenListObserver) {
      this.disconnectAllTargets();
      this.tokenListObserver.stop();
      delete this.tokenListObserver;
    }
  }
  tokenMatched({ element, content: name3 }) {
    if (this.scope.containsElement(element)) {
      this.connectTarget(element, name3);
    }
  }
  tokenUnmatched({ element, content: name3 }) {
    this.disconnectTarget(element, name3);
  }
  connectTarget(element, name3) {
    var _a;
    if (!this.targetsByName.has(name3, element)) {
      this.targetsByName.add(name3, element);
      (_a = this.tokenListObserver) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.targetConnected(element, name3));
    }
  }
  disconnectTarget(element, name3) {
    var _a;
    if (this.targetsByName.has(name3, element)) {
      this.targetsByName.delete(name3, element);
      (_a = this.tokenListObserver) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.targetDisconnected(element, name3));
    }
  }
  disconnectAllTargets() {
    for (const name3 of this.targetsByName.keys) {
      for (const element of this.targetsByName.getValuesForKey(name3)) {
        this.disconnectTarget(element, name3);
      }
    }
  }
  get attributeName() {
    return `data-${this.context.identifier}-target`;
  }
  get element() {
    return this.context.element;
  }
  get scope() {
    return this.context.scope;
  }
};
function readInheritableStaticArrayValues(constructor, propertyName) {
  const ancestors = getAncestorsForConstructor(constructor);
  return Array.from(ancestors.reduce((values, constructor2) => {
    getOwnStaticArrayValues(constructor2, propertyName).forEach((name3) => values.add(name3));
    return values;
  }, /* @__PURE__ */ new Set()));
}
function readInheritableStaticObjectPairs(constructor, propertyName) {
  const ancestors = getAncestorsForConstructor(constructor);
  return ancestors.reduce((pairs, constructor2) => {
    pairs.push(...getOwnStaticObjectPairs(constructor2, propertyName));
    return pairs;
  }, []);
}
function getAncestorsForConstructor(constructor) {
  const ancestors = [];
  while (constructor) {
    ancestors.push(constructor);
    constructor = Object.getPrototypeOf(constructor);
  }
  return ancestors.reverse();
}
function getOwnStaticArrayValues(constructor, propertyName) {
  const definition = constructor[propertyName];
  return Array.isArray(definition) ? definition : [];
}
function getOwnStaticObjectPairs(constructor, propertyName) {
  const definition = constructor[propertyName];
  return definition ? Object.keys(definition).map((key) => [key, definition[key]]) : [];
}
var OutletObserver = class {
  constructor(context, delegate) {
    this.started = false;
    this.context = context;
    this.delegate = delegate;
    this.outletsByName = new Multimap();
    this.outletElementsByName = new Multimap();
    this.selectorObserverMap = /* @__PURE__ */ new Map();
    this.attributeObserverMap = /* @__PURE__ */ new Map();
  }
  start() {
    if (!this.started) {
      this.outletDefinitions.forEach((outletName) => {
        this.setupSelectorObserverForOutlet(outletName);
        this.setupAttributeObserverForOutlet(outletName);
      });
      this.started = true;
      this.dependentContexts.forEach((context) => context.refresh());
    }
  }
  refresh() {
    this.selectorObserverMap.forEach((observer) => observer.refresh());
    this.attributeObserverMap.forEach((observer) => observer.refresh());
  }
  stop() {
    if (this.started) {
      this.started = false;
      this.disconnectAllOutlets();
      this.stopSelectorObservers();
      this.stopAttributeObservers();
    }
  }
  stopSelectorObservers() {
    if (this.selectorObserverMap.size > 0) {
      this.selectorObserverMap.forEach((observer) => observer.stop());
      this.selectorObserverMap.clear();
    }
  }
  stopAttributeObservers() {
    if (this.attributeObserverMap.size > 0) {
      this.attributeObserverMap.forEach((observer) => observer.stop());
      this.attributeObserverMap.clear();
    }
  }
  selectorMatched(element, _selector, { outletName }) {
    const outlet = this.getOutlet(element, outletName);
    if (outlet) {
      this.connectOutlet(outlet, element, outletName);
    }
  }
  selectorUnmatched(element, _selector, { outletName }) {
    const outlet = this.getOutletFromMap(element, outletName);
    if (outlet) {
      this.disconnectOutlet(outlet, element, outletName);
    }
  }
  selectorMatchElement(element, { outletName }) {
    const selector = this.selector(outletName);
    const hasOutlet = this.hasOutlet(element, outletName);
    const hasOutletController = element.matches(`[${this.schema.controllerAttribute}~=${outletName}]`);
    if (selector) {
      return hasOutlet && hasOutletController && element.matches(selector);
    } else {
      return false;
    }
  }
  elementMatchedAttribute(_element, attributeName) {
    const outletName = this.getOutletNameFromOutletAttributeName(attributeName);
    if (outletName) {
      this.updateSelectorObserverForOutlet(outletName);
    }
  }
  elementAttributeValueChanged(_element, attributeName) {
    const outletName = this.getOutletNameFromOutletAttributeName(attributeName);
    if (outletName) {
      this.updateSelectorObserverForOutlet(outletName);
    }
  }
  elementUnmatchedAttribute(_element, attributeName) {
    const outletName = this.getOutletNameFromOutletAttributeName(attributeName);
    if (outletName) {
      this.updateSelectorObserverForOutlet(outletName);
    }
  }
  connectOutlet(outlet, element, outletName) {
    var _a;
    if (!this.outletElementsByName.has(outletName, element)) {
      this.outletsByName.add(outletName, outlet);
      this.outletElementsByName.add(outletName, element);
      (_a = this.selectorObserverMap.get(outletName)) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.outletConnected(outlet, element, outletName));
    }
  }
  disconnectOutlet(outlet, element, outletName) {
    var _a;
    if (this.outletElementsByName.has(outletName, element)) {
      this.outletsByName.delete(outletName, outlet);
      this.outletElementsByName.delete(outletName, element);
      (_a = this.selectorObserverMap.get(outletName)) === null || _a === void 0 ? void 0 : _a.pause(() => this.delegate.outletDisconnected(outlet, element, outletName));
    }
  }
  disconnectAllOutlets() {
    for (const outletName of this.outletElementsByName.keys) {
      for (const element of this.outletElementsByName.getValuesForKey(outletName)) {
        for (const outlet of this.outletsByName.getValuesForKey(outletName)) {
          this.disconnectOutlet(outlet, element, outletName);
        }
      }
    }
  }
  updateSelectorObserverForOutlet(outletName) {
    const observer = this.selectorObserverMap.get(outletName);
    if (observer) {
      observer.selector = this.selector(outletName);
    }
  }
  setupSelectorObserverForOutlet(outletName) {
    const selector = this.selector(outletName);
    const selectorObserver = new SelectorObserver(document.body, selector, this, { outletName });
    this.selectorObserverMap.set(outletName, selectorObserver);
    selectorObserver.start();
  }
  setupAttributeObserverForOutlet(outletName) {
    const attributeName = this.attributeNameForOutletName(outletName);
    const attributeObserver = new AttributeObserver(this.scope.element, attributeName, this);
    this.attributeObserverMap.set(outletName, attributeObserver);
    attributeObserver.start();
  }
  selector(outletName) {
    return this.scope.outlets.getSelectorForOutletName(outletName);
  }
  attributeNameForOutletName(outletName) {
    return this.scope.schema.outletAttributeForScope(this.identifier, outletName);
  }
  getOutletNameFromOutletAttributeName(attributeName) {
    return this.outletDefinitions.find((outletName) => this.attributeNameForOutletName(outletName) === attributeName);
  }
  get outletDependencies() {
    const dependencies3 = new Multimap();
    this.router.modules.forEach((module3) => {
      const constructor = module3.definition.controllerConstructor;
      const outlets = readInheritableStaticArrayValues(constructor, "outlets");
      outlets.forEach((outlet) => dependencies3.add(outlet, module3.identifier));
    });
    return dependencies3;
  }
  get outletDefinitions() {
    return this.outletDependencies.getKeysForValue(this.identifier);
  }
  get dependentControllerIdentifiers() {
    return this.outletDependencies.getValuesForKey(this.identifier);
  }
  get dependentContexts() {
    const identifiers = this.dependentControllerIdentifiers;
    return this.router.contexts.filter((context) => identifiers.includes(context.identifier));
  }
  hasOutlet(element, outletName) {
    return !!this.getOutlet(element, outletName) || !!this.getOutletFromMap(element, outletName);
  }
  getOutlet(element, outletName) {
    return this.application.getControllerForElementAndIdentifier(element, outletName);
  }
  getOutletFromMap(element, outletName) {
    return this.outletsByName.getValuesForKey(outletName).find((outlet) => outlet.element === element);
  }
  get scope() {
    return this.context.scope;
  }
  get schema() {
    return this.context.schema;
  }
  get identifier() {
    return this.context.identifier;
  }
  get application() {
    return this.context.application;
  }
  get router() {
    return this.application.router;
  }
};
var Context = class {
  constructor(module3, scope) {
    this.logDebugActivity = (functionName, detail = {}) => {
      const { identifier, controller, element } = this;
      detail = Object.assign({ identifier, controller, element }, detail);
      this.application.logDebugActivity(this.identifier, functionName, detail);
    };
    this.module = module3;
    this.scope = scope;
    this.controller = new module3.controllerConstructor(this);
    this.bindingObserver = new BindingObserver(this, this.dispatcher);
    this.valueObserver = new ValueObserver(this, this.controller);
    this.targetObserver = new TargetObserver(this, this);
    this.outletObserver = new OutletObserver(this, this);
    try {
      this.controller.initialize();
      this.logDebugActivity("initialize");
    } catch (error3) {
      this.handleError(error3, "initializing controller");
    }
  }
  connect() {
    this.bindingObserver.start();
    this.valueObserver.start();
    this.targetObserver.start();
    this.outletObserver.start();
    try {
      this.controller.connect();
      this.logDebugActivity("connect");
    } catch (error3) {
      this.handleError(error3, "connecting controller");
    }
  }
  refresh() {
    this.outletObserver.refresh();
  }
  disconnect() {
    try {
      this.controller.disconnect();
      this.logDebugActivity("disconnect");
    } catch (error3) {
      this.handleError(error3, "disconnecting controller");
    }
    this.outletObserver.stop();
    this.targetObserver.stop();
    this.valueObserver.stop();
    this.bindingObserver.stop();
  }
  get application() {
    return this.module.application;
  }
  get identifier() {
    return this.module.identifier;
  }
  get schema() {
    return this.application.schema;
  }
  get dispatcher() {
    return this.application.dispatcher;
  }
  get element() {
    return this.scope.element;
  }
  get parentElement() {
    return this.element.parentElement;
  }
  handleError(error3, message, detail = {}) {
    const { identifier, controller, element } = this;
    detail = Object.assign({ identifier, controller, element }, detail);
    this.application.handleError(error3, `Error ${message}`, detail);
  }
  targetConnected(element, name3) {
    this.invokeControllerMethod(`${name3}TargetConnected`, element);
  }
  targetDisconnected(element, name3) {
    this.invokeControllerMethod(`${name3}TargetDisconnected`, element);
  }
  outletConnected(outlet, element, name3) {
    this.invokeControllerMethod(`${namespaceCamelize(name3)}OutletConnected`, outlet, element);
  }
  outletDisconnected(outlet, element, name3) {
    this.invokeControllerMethod(`${namespaceCamelize(name3)}OutletDisconnected`, outlet, element);
  }
  invokeControllerMethod(methodName, ...args) {
    const controller = this.controller;
    if (typeof controller[methodName] == "function") {
      controller[methodName](...args);
    }
  }
};
function bless(constructor) {
  return shadow(constructor, getBlessedProperties(constructor));
}
function shadow(constructor, properties) {
  const shadowConstructor = extend2(constructor);
  const shadowProperties = getShadowProperties(constructor.prototype, properties);
  Object.defineProperties(shadowConstructor.prototype, shadowProperties);
  return shadowConstructor;
}
function getBlessedProperties(constructor) {
  const blessings = readInheritableStaticArrayValues(constructor, "blessings");
  return blessings.reduce((blessedProperties, blessing) => {
    const properties = blessing(constructor);
    for (const key in properties) {
      const descriptor = blessedProperties[key] || {};
      blessedProperties[key] = Object.assign(descriptor, properties[key]);
    }
    return blessedProperties;
  }, {});
}
function getShadowProperties(prototype, properties) {
  return getOwnKeys(properties).reduce((shadowProperties, key) => {
    const descriptor = getShadowedDescriptor(prototype, properties, key);
    if (descriptor) {
      Object.assign(shadowProperties, { [key]: descriptor });
    }
    return shadowProperties;
  }, {});
}
function getShadowedDescriptor(prototype, properties, key) {
  const shadowingDescriptor = Object.getOwnPropertyDescriptor(prototype, key);
  const shadowedByValue = shadowingDescriptor && "value" in shadowingDescriptor;
  if (!shadowedByValue) {
    const descriptor = Object.getOwnPropertyDescriptor(properties, key).value;
    if (shadowingDescriptor) {
      descriptor.get = shadowingDescriptor.get || descriptor.get;
      descriptor.set = shadowingDescriptor.set || descriptor.set;
    }
    return descriptor;
  }
}
var getOwnKeys = (() => {
  if (typeof Object.getOwnPropertySymbols == "function") {
    return (object) => [...Object.getOwnPropertyNames(object), ...Object.getOwnPropertySymbols(object)];
  } else {
    return Object.getOwnPropertyNames;
  }
})();
var extend2 = (() => {
  function extendWithReflect(constructor) {
    function extended() {
      return Reflect.construct(constructor, arguments, new.target);
    }
    extended.prototype = Object.create(constructor.prototype, {
      constructor: { value: extended }
    });
    Reflect.setPrototypeOf(extended, constructor);
    return extended;
  }
  function testReflectExtension() {
    const a = function() {
      this.a.call(this);
    };
    const b = extendWithReflect(a);
    b.prototype.a = function() {
    };
    return new b();
  }
  try {
    testReflectExtension();
    return extendWithReflect;
  } catch (error3) {
    return (constructor) => class extended extends constructor {
    };
  }
})();
function blessDefinition(definition) {
  return {
    identifier: definition.identifier,
    controllerConstructor: bless(definition.controllerConstructor)
  };
}
var Module = class {
  constructor(application2, definition) {
    this.application = application2;
    this.definition = blessDefinition(definition);
    this.contextsByScope = /* @__PURE__ */ new WeakMap();
    this.connectedContexts = /* @__PURE__ */ new Set();
  }
  get identifier() {
    return this.definition.identifier;
  }
  get controllerConstructor() {
    return this.definition.controllerConstructor;
  }
  get contexts() {
    return Array.from(this.connectedContexts);
  }
  connectContextForScope(scope) {
    const context = this.fetchContextForScope(scope);
    this.connectedContexts.add(context);
    context.connect();
  }
  disconnectContextForScope(scope) {
    const context = this.contextsByScope.get(scope);
    if (context) {
      this.connectedContexts.delete(context);
      context.disconnect();
    }
  }
  fetchContextForScope(scope) {
    let context = this.contextsByScope.get(scope);
    if (!context) {
      context = new Context(this, scope);
      this.contextsByScope.set(scope, context);
    }
    return context;
  }
};
var ClassMap = class {
  constructor(scope) {
    this.scope = scope;
  }
  has(name3) {
    return this.data.has(this.getDataKey(name3));
  }
  get(name3) {
    return this.getAll(name3)[0];
  }
  getAll(name3) {
    const tokenString = this.data.get(this.getDataKey(name3)) || "";
    return tokenize(tokenString);
  }
  getAttributeName(name3) {
    return this.data.getAttributeNameForKey(this.getDataKey(name3));
  }
  getDataKey(name3) {
    return `${name3}-class`;
  }
  get data() {
    return this.scope.data;
  }
};
var DataMap = class {
  constructor(scope) {
    this.scope = scope;
  }
  get element() {
    return this.scope.element;
  }
  get identifier() {
    return this.scope.identifier;
  }
  get(key) {
    const name3 = this.getAttributeNameForKey(key);
    return this.element.getAttribute(name3);
  }
  set(key, value) {
    const name3 = this.getAttributeNameForKey(key);
    this.element.setAttribute(name3, value);
    return this.get(key);
  }
  has(key) {
    const name3 = this.getAttributeNameForKey(key);
    return this.element.hasAttribute(name3);
  }
  delete(key) {
    if (this.has(key)) {
      const name3 = this.getAttributeNameForKey(key);
      this.element.removeAttribute(name3);
      return true;
    } else {
      return false;
    }
  }
  getAttributeNameForKey(key) {
    return `data-${this.identifier}-${dasherize(key)}`;
  }
};
var Guide = class {
  constructor(logger3) {
    this.warnedKeysByObject = /* @__PURE__ */ new WeakMap();
    this.logger = logger3;
  }
  warn(object, key, message) {
    let warnedKeys = this.warnedKeysByObject.get(object);
    if (!warnedKeys) {
      warnedKeys = /* @__PURE__ */ new Set();
      this.warnedKeysByObject.set(object, warnedKeys);
    }
    if (!warnedKeys.has(key)) {
      warnedKeys.add(key);
      this.logger.warn(message, object);
    }
  }
};
function attributeValueContainsToken(attributeName, token) {
  return `[${attributeName}~="${token}"]`;
}
var TargetSet = class {
  constructor(scope) {
    this.scope = scope;
  }
  get element() {
    return this.scope.element;
  }
  get identifier() {
    return this.scope.identifier;
  }
  get schema() {
    return this.scope.schema;
  }
  has(targetName) {
    return this.find(targetName) != null;
  }
  find(...targetNames) {
    return targetNames.reduce((target, targetName) => target || this.findTarget(targetName) || this.findLegacyTarget(targetName), void 0);
  }
  findAll(...targetNames) {
    return targetNames.reduce((targets, targetName) => [
      ...targets,
      ...this.findAllTargets(targetName),
      ...this.findAllLegacyTargets(targetName)
    ], []);
  }
  findTarget(targetName) {
    const selector = this.getSelectorForTargetName(targetName);
    return this.scope.findElement(selector);
  }
  findAllTargets(targetName) {
    const selector = this.getSelectorForTargetName(targetName);
    return this.scope.findAllElements(selector);
  }
  getSelectorForTargetName(targetName) {
    const attributeName = this.schema.targetAttributeForScope(this.identifier);
    return attributeValueContainsToken(attributeName, targetName);
  }
  findLegacyTarget(targetName) {
    const selector = this.getLegacySelectorForTargetName(targetName);
    return this.deprecate(this.scope.findElement(selector), targetName);
  }
  findAllLegacyTargets(targetName) {
    const selector = this.getLegacySelectorForTargetName(targetName);
    return this.scope.findAllElements(selector).map((element) => this.deprecate(element, targetName));
  }
  getLegacySelectorForTargetName(targetName) {
    const targetDescriptor = `${this.identifier}.${targetName}`;
    return attributeValueContainsToken(this.schema.targetAttribute, targetDescriptor);
  }
  deprecate(element, targetName) {
    if (element) {
      const { identifier } = this;
      const attributeName = this.schema.targetAttribute;
      const revisedAttributeName = this.schema.targetAttributeForScope(identifier);
      this.guide.warn(element, `target:${targetName}`, `Please replace ${attributeName}="${identifier}.${targetName}" with ${revisedAttributeName}="${targetName}". The ${attributeName} attribute is deprecated and will be removed in a future version of Stimulus.`);
    }
    return element;
  }
  get guide() {
    return this.scope.guide;
  }
};
var OutletSet = class {
  constructor(scope, controllerElement) {
    this.scope = scope;
    this.controllerElement = controllerElement;
  }
  get element() {
    return this.scope.element;
  }
  get identifier() {
    return this.scope.identifier;
  }
  get schema() {
    return this.scope.schema;
  }
  has(outletName) {
    return this.find(outletName) != null;
  }
  find(...outletNames) {
    return outletNames.reduce((outlet, outletName) => outlet || this.findOutlet(outletName), void 0);
  }
  findAll(...outletNames) {
    return outletNames.reduce((outlets, outletName) => [...outlets, ...this.findAllOutlets(outletName)], []);
  }
  getSelectorForOutletName(outletName) {
    const attributeName = this.schema.outletAttributeForScope(this.identifier, outletName);
    return this.controllerElement.getAttribute(attributeName);
  }
  findOutlet(outletName) {
    const selector = this.getSelectorForOutletName(outletName);
    if (selector)
      return this.findElement(selector, outletName);
  }
  findAllOutlets(outletName) {
    const selector = this.getSelectorForOutletName(outletName);
    return selector ? this.findAllElements(selector, outletName) : [];
  }
  findElement(selector, outletName) {
    const elements = this.scope.queryElements(selector);
    return elements.filter((element) => this.matchesElement(element, selector, outletName))[0];
  }
  findAllElements(selector, outletName) {
    const elements = this.scope.queryElements(selector);
    return elements.filter((element) => this.matchesElement(element, selector, outletName));
  }
  matchesElement(element, selector, outletName) {
    const controllerAttribute = element.getAttribute(this.scope.schema.controllerAttribute) || "";
    return element.matches(selector) && controllerAttribute.split(" ").includes(outletName);
  }
};
var Scope = class _Scope {
  constructor(schema2, element, identifier, logger3) {
    this.targets = new TargetSet(this);
    this.classes = new ClassMap(this);
    this.data = new DataMap(this);
    this.containsElement = (element2) => {
      return element2.closest(this.controllerSelector) === this.element;
    };
    this.schema = schema2;
    this.element = element;
    this.identifier = identifier;
    this.guide = new Guide(logger3);
    this.outlets = new OutletSet(this.documentScope, element);
  }
  findElement(selector) {
    return this.element.matches(selector) ? this.element : this.queryElements(selector).find(this.containsElement);
  }
  findAllElements(selector) {
    return [
      ...this.element.matches(selector) ? [this.element] : [],
      ...this.queryElements(selector).filter(this.containsElement)
    ];
  }
  queryElements(selector) {
    return Array.from(this.element.querySelectorAll(selector));
  }
  get controllerSelector() {
    return attributeValueContainsToken(this.schema.controllerAttribute, this.identifier);
  }
  get isDocumentScope() {
    return this.element === document.documentElement;
  }
  get documentScope() {
    return this.isDocumentScope ? this : new _Scope(this.schema, document.documentElement, this.identifier, this.guide.logger);
  }
};
var ScopeObserver = class {
  constructor(element, schema2, delegate) {
    this.element = element;
    this.schema = schema2;
    this.delegate = delegate;
    this.valueListObserver = new ValueListObserver(this.element, this.controllerAttribute, this);
    this.scopesByIdentifierByElement = /* @__PURE__ */ new WeakMap();
    this.scopeReferenceCounts = /* @__PURE__ */ new WeakMap();
  }
  start() {
    this.valueListObserver.start();
  }
  stop() {
    this.valueListObserver.stop();
  }
  get controllerAttribute() {
    return this.schema.controllerAttribute;
  }
  parseValueForToken(token) {
    const { element, content: identifier } = token;
    return this.parseValueForElementAndIdentifier(element, identifier);
  }
  parseValueForElementAndIdentifier(element, identifier) {
    const scopesByIdentifier = this.fetchScopesByIdentifierForElement(element);
    let scope = scopesByIdentifier.get(identifier);
    if (!scope) {
      scope = this.delegate.createScopeForElementAndIdentifier(element, identifier);
      scopesByIdentifier.set(identifier, scope);
    }
    return scope;
  }
  elementMatchedValue(element, value) {
    const referenceCount = (this.scopeReferenceCounts.get(value) || 0) + 1;
    this.scopeReferenceCounts.set(value, referenceCount);
    if (referenceCount == 1) {
      this.delegate.scopeConnected(value);
    }
  }
  elementUnmatchedValue(element, value) {
    const referenceCount = this.scopeReferenceCounts.get(value);
    if (referenceCount) {
      this.scopeReferenceCounts.set(value, referenceCount - 1);
      if (referenceCount == 1) {
        this.delegate.scopeDisconnected(value);
      }
    }
  }
  fetchScopesByIdentifierForElement(element) {
    let scopesByIdentifier = this.scopesByIdentifierByElement.get(element);
    if (!scopesByIdentifier) {
      scopesByIdentifier = /* @__PURE__ */ new Map();
      this.scopesByIdentifierByElement.set(element, scopesByIdentifier);
    }
    return scopesByIdentifier;
  }
};
var Router = class {
  constructor(application2) {
    this.application = application2;
    this.scopeObserver = new ScopeObserver(this.element, this.schema, this);
    this.scopesByIdentifier = new Multimap();
    this.modulesByIdentifier = /* @__PURE__ */ new Map();
  }
  get element() {
    return this.application.element;
  }
  get schema() {
    return this.application.schema;
  }
  get logger() {
    return this.application.logger;
  }
  get controllerAttribute() {
    return this.schema.controllerAttribute;
  }
  get modules() {
    return Array.from(this.modulesByIdentifier.values());
  }
  get contexts() {
    return this.modules.reduce((contexts, module3) => contexts.concat(module3.contexts), []);
  }
  start() {
    this.scopeObserver.start();
  }
  stop() {
    this.scopeObserver.stop();
  }
  loadDefinition(definition) {
    this.unloadIdentifier(definition.identifier);
    const module3 = new Module(this.application, definition);
    this.connectModule(module3);
    const afterLoad = definition.controllerConstructor.afterLoad;
    if (afterLoad) {
      afterLoad.call(definition.controllerConstructor, definition.identifier, this.application);
    }
  }
  unloadIdentifier(identifier) {
    const module3 = this.modulesByIdentifier.get(identifier);
    if (module3) {
      this.disconnectModule(module3);
    }
  }
  getContextForElementAndIdentifier(element, identifier) {
    const module3 = this.modulesByIdentifier.get(identifier);
    if (module3) {
      return module3.contexts.find((context) => context.element == element);
    }
  }
  proposeToConnectScopeForElementAndIdentifier(element, identifier) {
    const scope = this.scopeObserver.parseValueForElementAndIdentifier(element, identifier);
    if (scope) {
      this.scopeObserver.elementMatchedValue(scope.element, scope);
    } else {
      console.error(`Couldn't find or create scope for identifier: "${identifier}" and element:`, element);
    }
  }
  handleError(error3, message, detail) {
    this.application.handleError(error3, message, detail);
  }
  createScopeForElementAndIdentifier(element, identifier) {
    return new Scope(this.schema, element, identifier, this.logger);
  }
  scopeConnected(scope) {
    this.scopesByIdentifier.add(scope.identifier, scope);
    const module3 = this.modulesByIdentifier.get(scope.identifier);
    if (module3) {
      module3.connectContextForScope(scope);
    }
  }
  scopeDisconnected(scope) {
    this.scopesByIdentifier.delete(scope.identifier, scope);
    const module3 = this.modulesByIdentifier.get(scope.identifier);
    if (module3) {
      module3.disconnectContextForScope(scope);
    }
  }
  connectModule(module3) {
    this.modulesByIdentifier.set(module3.identifier, module3);
    const scopes = this.scopesByIdentifier.getValuesForKey(module3.identifier);
    scopes.forEach((scope) => module3.connectContextForScope(scope));
  }
  disconnectModule(module3) {
    this.modulesByIdentifier.delete(module3.identifier);
    const scopes = this.scopesByIdentifier.getValuesForKey(module3.identifier);
    scopes.forEach((scope) => module3.disconnectContextForScope(scope));
  }
};
var defaultSchema = {
  controllerAttribute: "data-controller",
  actionAttribute: "data-action",
  targetAttribute: "data-target",
  targetAttributeForScope: (identifier) => `data-${identifier}-target`,
  outletAttributeForScope: (identifier, outlet) => `data-${identifier}-${outlet}-outlet`,
  keyMappings: Object.assign(Object.assign({ enter: "Enter", tab: "Tab", esc: "Escape", space: " ", up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", home: "Home", end: "End", page_up: "PageUp", page_down: "PageDown" }, objectFromEntries("abcdefghijklmnopqrstuvwxyz".split("").map((c) => [c, c]))), objectFromEntries("0123456789".split("").map((n) => [n, n])))
};
function objectFromEntries(array) {
  return array.reduce((memo, [k, v]) => Object.assign(Object.assign({}, memo), { [k]: v }), {});
}
var Application = class {
  constructor(element = document.documentElement, schema2 = defaultSchema) {
    this.logger = console;
    this.debug = false;
    this.logDebugActivity = (identifier, functionName, detail = {}) => {
      if (this.debug) {
        this.logFormattedMessage(identifier, functionName, detail);
      }
    };
    this.element = element;
    this.schema = schema2;
    this.dispatcher = new Dispatcher(this);
    this.router = new Router(this);
    this.actionDescriptorFilters = Object.assign({}, defaultActionDescriptorFilters);
  }
  static start(element, schema2) {
    const application2 = new this(element, schema2);
    application2.start();
    return application2;
  }
  async start() {
    await domReady();
    this.logDebugActivity("application", "starting");
    this.dispatcher.start();
    this.router.start();
    this.logDebugActivity("application", "start");
  }
  stop() {
    this.logDebugActivity("application", "stopping");
    this.dispatcher.stop();
    this.router.stop();
    this.logDebugActivity("application", "stop");
  }
  register(identifier, controllerConstructor) {
    this.load({ identifier, controllerConstructor });
  }
  registerActionOption(name3, filter) {
    this.actionDescriptorFilters[name3] = filter;
  }
  load(head, ...rest) {
    const definitions = Array.isArray(head) ? head : [head, ...rest];
    definitions.forEach((definition) => {
      if (definition.controllerConstructor.shouldLoad) {
        this.router.loadDefinition(definition);
      }
    });
  }
  unload(head, ...rest) {
    const identifiers = Array.isArray(head) ? head : [head, ...rest];
    identifiers.forEach((identifier) => this.router.unloadIdentifier(identifier));
  }
  get controllers() {
    return this.router.contexts.map((context) => context.controller);
  }
  getControllerForElementAndIdentifier(element, identifier) {
    const context = this.router.getContextForElementAndIdentifier(element, identifier);
    return context ? context.controller : null;
  }
  handleError(error3, message, detail) {
    var _a;
    this.logger.error(`%s

%o

%o`, message, error3, detail);
    (_a = window.onerror) === null || _a === void 0 ? void 0 : _a.call(window, message, "", 0, 0, error3);
  }
  logFormattedMessage(identifier, functionName, detail = {}) {
    detail = Object.assign({ application: this }, detail);
    this.logger.groupCollapsed(`${identifier} #${functionName}`);
    this.logger.log("details:", Object.assign({}, detail));
    this.logger.groupEnd();
  }
};
function domReady() {
  return new Promise((resolve) => {
    if (document.readyState == "loading") {
      document.addEventListener("DOMContentLoaded", () => resolve());
    } else {
      resolve();
    }
  });
}
function ClassPropertiesBlessing(constructor) {
  const classes = readInheritableStaticArrayValues(constructor, "classes");
  return classes.reduce((properties, classDefinition) => {
    return Object.assign(properties, propertiesForClassDefinition(classDefinition));
  }, {});
}
function propertiesForClassDefinition(key) {
  return {
    [`${key}Class`]: {
      get() {
        const { classes } = this;
        if (classes.has(key)) {
          return classes.get(key);
        } else {
          const attribute = classes.getAttributeName(key);
          throw new Error(`Missing attribute "${attribute}"`);
        }
      }
    },
    [`${key}Classes`]: {
      get() {
        return this.classes.getAll(key);
      }
    },
    [`has${capitalize(key)}Class`]: {
      get() {
        return this.classes.has(key);
      }
    }
  };
}
function OutletPropertiesBlessing(constructor) {
  const outlets = readInheritableStaticArrayValues(constructor, "outlets");
  return outlets.reduce((properties, outletDefinition) => {
    return Object.assign(properties, propertiesForOutletDefinition(outletDefinition));
  }, {});
}
function getOutletController(controller, element, identifier) {
  return controller.application.getControllerForElementAndIdentifier(element, identifier);
}
function getControllerAndEnsureConnectedScope(controller, element, outletName) {
  let outletController = getOutletController(controller, element, outletName);
  if (outletController)
    return outletController;
  controller.application.router.proposeToConnectScopeForElementAndIdentifier(element, outletName);
  outletController = getOutletController(controller, element, outletName);
  if (outletController)
    return outletController;
}
function propertiesForOutletDefinition(name3) {
  const camelizedName = namespaceCamelize(name3);
  return {
    [`${camelizedName}Outlet`]: {
      get() {
        const outletElement = this.outlets.find(name3);
        const selector = this.outlets.getSelectorForOutletName(name3);
        if (outletElement) {
          const outletController = getControllerAndEnsureConnectedScope(this, outletElement, name3);
          if (outletController)
            return outletController;
          throw new Error(`The provided outlet element is missing an outlet controller "${name3}" instance for host controller "${this.identifier}"`);
        }
        throw new Error(`Missing outlet element "${name3}" for host controller "${this.identifier}". Stimulus couldn't find a matching outlet element using selector "${selector}".`);
      }
    },
    [`${camelizedName}Outlets`]: {
      get() {
        const outlets = this.outlets.findAll(name3);
        if (outlets.length > 0) {
          return outlets.map((outletElement) => {
            const outletController = getControllerAndEnsureConnectedScope(this, outletElement, name3);
            if (outletController)
              return outletController;
            console.warn(`The provided outlet element is missing an outlet controller "${name3}" instance for host controller "${this.identifier}"`, outletElement);
          }).filter((controller) => controller);
        }
        return [];
      }
    },
    [`${camelizedName}OutletElement`]: {
      get() {
        const outletElement = this.outlets.find(name3);
        const selector = this.outlets.getSelectorForOutletName(name3);
        if (outletElement) {
          return outletElement;
        } else {
          throw new Error(`Missing outlet element "${name3}" for host controller "${this.identifier}". Stimulus couldn't find a matching outlet element using selector "${selector}".`);
        }
      }
    },
    [`${camelizedName}OutletElements`]: {
      get() {
        return this.outlets.findAll(name3);
      }
    },
    [`has${capitalize(camelizedName)}Outlet`]: {
      get() {
        return this.outlets.has(name3);
      }
    }
  };
}
function TargetPropertiesBlessing(constructor) {
  const targets = readInheritableStaticArrayValues(constructor, "targets");
  return targets.reduce((properties, targetDefinition) => {
    return Object.assign(properties, propertiesForTargetDefinition(targetDefinition));
  }, {});
}
function propertiesForTargetDefinition(name3) {
  return {
    [`${name3}Target`]: {
      get() {
        const target = this.targets.find(name3);
        if (target) {
          return target;
        } else {
          throw new Error(`Missing target element "${name3}" for "${this.identifier}" controller`);
        }
      }
    },
    [`${name3}Targets`]: {
      get() {
        return this.targets.findAll(name3);
      }
    },
    [`has${capitalize(name3)}Target`]: {
      get() {
        return this.targets.has(name3);
      }
    }
  };
}
function ValuePropertiesBlessing(constructor) {
  const valueDefinitionPairs = readInheritableStaticObjectPairs(constructor, "values");
  const propertyDescriptorMap = {
    valueDescriptorMap: {
      get() {
        return valueDefinitionPairs.reduce((result, valueDefinitionPair) => {
          const valueDescriptor = parseValueDefinitionPair(valueDefinitionPair, this.identifier);
          const attributeName = this.data.getAttributeNameForKey(valueDescriptor.key);
          return Object.assign(result, { [attributeName]: valueDescriptor });
        }, {});
      }
    }
  };
  return valueDefinitionPairs.reduce((properties, valueDefinitionPair) => {
    return Object.assign(properties, propertiesForValueDefinitionPair(valueDefinitionPair));
  }, propertyDescriptorMap);
}
function propertiesForValueDefinitionPair(valueDefinitionPair, controller) {
  const definition = parseValueDefinitionPair(valueDefinitionPair, controller);
  const { key, name: name3, reader: read, writer: write } = definition;
  return {
    [name3]: {
      get() {
        const value = this.data.get(key);
        if (value !== null) {
          return read(value);
        } else {
          return definition.defaultValue;
        }
      },
      set(value) {
        if (value === void 0) {
          this.data.delete(key);
        } else {
          this.data.set(key, write(value));
        }
      }
    },
    [`has${capitalize(name3)}`]: {
      get() {
        return this.data.has(key) || definition.hasCustomDefaultValue;
      }
    }
  };
}
function parseValueDefinitionPair([token, typeDefinition], controller) {
  return valueDescriptorForTokenAndTypeDefinition({
    controller,
    token,
    typeDefinition
  });
}
function parseValueTypeConstant(constant) {
  switch (constant) {
    case Array:
      return "array";
    case Boolean:
      return "boolean";
    case Number:
      return "number";
    case Object:
      return "object";
    case String:
      return "string";
  }
}
function parseValueTypeDefault(defaultValue) {
  switch (typeof defaultValue) {
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "string":
      return "string";
  }
  if (Array.isArray(defaultValue))
    return "array";
  if (Object.prototype.toString.call(defaultValue) === "[object Object]")
    return "object";
}
function parseValueTypeObject(payload) {
  const { controller, token, typeObject } = payload;
  const hasType = isSomething(typeObject.type);
  const hasDefault = isSomething(typeObject.default);
  const fullObject = hasType && hasDefault;
  const onlyType = hasType && !hasDefault;
  const onlyDefault = !hasType && hasDefault;
  const typeFromObject = parseValueTypeConstant(typeObject.type);
  const typeFromDefaultValue = parseValueTypeDefault(payload.typeObject.default);
  if (onlyType)
    return typeFromObject;
  if (onlyDefault)
    return typeFromDefaultValue;
  if (typeFromObject !== typeFromDefaultValue) {
    const propertyPath = controller ? `${controller}.${token}` : token;
    throw new Error(`The specified default value for the Stimulus Value "${propertyPath}" must match the defined type "${typeFromObject}". The provided default value of "${typeObject.default}" is of type "${typeFromDefaultValue}".`);
  }
  if (fullObject)
    return typeFromObject;
}
function parseValueTypeDefinition(payload) {
  const { controller, token, typeDefinition } = payload;
  const typeObject = { controller, token, typeObject: typeDefinition };
  const typeFromObject = parseValueTypeObject(typeObject);
  const typeFromDefaultValue = parseValueTypeDefault(typeDefinition);
  const typeFromConstant = parseValueTypeConstant(typeDefinition);
  const type = typeFromObject || typeFromDefaultValue || typeFromConstant;
  if (type)
    return type;
  const propertyPath = controller ? `${controller}.${typeDefinition}` : token;
  throw new Error(`Unknown value type "${propertyPath}" for "${token}" value`);
}
function defaultValueForDefinition(typeDefinition) {
  const constant = parseValueTypeConstant(typeDefinition);
  if (constant)
    return defaultValuesByType[constant];
  const hasDefault = hasProperty(typeDefinition, "default");
  const hasType = hasProperty(typeDefinition, "type");
  const typeObject = typeDefinition;
  if (hasDefault)
    return typeObject.default;
  if (hasType) {
    const { type } = typeObject;
    const constantFromType = parseValueTypeConstant(type);
    if (constantFromType)
      return defaultValuesByType[constantFromType];
  }
  return typeDefinition;
}
function valueDescriptorForTokenAndTypeDefinition(payload) {
  const { token, typeDefinition } = payload;
  const key = `${dasherize(token)}-value`;
  const type = parseValueTypeDefinition(payload);
  return {
    type,
    key,
    name: camelize(key),
    get defaultValue() {
      return defaultValueForDefinition(typeDefinition);
    },
    get hasCustomDefaultValue() {
      return parseValueTypeDefault(typeDefinition) !== void 0;
    },
    reader: readers[type],
    writer: writers[type] || writers.default
  };
}
var defaultValuesByType = {
  get array() {
    return [];
  },
  boolean: false,
  number: 0,
  get object() {
    return {};
  },
  string: ""
};
var readers = {
  array(value) {
    const array = JSON.parse(value);
    if (!Array.isArray(array)) {
      throw new TypeError(`expected value of type "array" but instead got value "${value}" of type "${parseValueTypeDefault(array)}"`);
    }
    return array;
  },
  boolean(value) {
    return !(value == "0" || String(value).toLowerCase() == "false");
  },
  number(value) {
    return Number(value.replace(/_/g, ""));
  },
  object(value) {
    const object = JSON.parse(value);
    if (object === null || typeof object != "object" || Array.isArray(object)) {
      throw new TypeError(`expected value of type "object" but instead got value "${value}" of type "${parseValueTypeDefault(object)}"`);
    }
    return object;
  },
  string(value) {
    return value;
  }
};
var writers = {
  default: writeString,
  array: writeJSON,
  object: writeJSON
};
function writeJSON(value) {
  return JSON.stringify(value);
}
function writeString(value) {
  return `${value}`;
}
var Controller = class {
  constructor(context) {
    this.context = context;
  }
  static get shouldLoad() {
    return true;
  }
  static afterLoad(_identifier, _application) {
    return;
  }
  get application() {
    return this.context.application;
  }
  get scope() {
    return this.context.scope;
  }
  get element() {
    return this.scope.element;
  }
  get identifier() {
    return this.scope.identifier;
  }
  get targets() {
    return this.scope.targets;
  }
  get outlets() {
    return this.scope.outlets;
  }
  get classes() {
    return this.scope.classes;
  }
  get data() {
    return this.scope.data;
  }
  initialize() {
  }
  connect() {
  }
  disconnect() {
  }
  dispatch(eventName, { target = this.element, detail = {}, prefix = this.identifier, bubbles = true, cancelable = true } = {}) {
    const type = prefix ? `${prefix}:${eventName}` : eventName;
    const event = new CustomEvent(type, { detail, bubbles, cancelable });
    target.dispatchEvent(event);
    return event;
  }
};
Controller.blessings = [
  ClassPropertiesBlessing,
  TargetPropertiesBlessing,
  ValuePropertiesBlessing,
  OutletPropertiesBlessing
];
Controller.targets = [];
Controller.outlets = [];
Controller.values = {};

// node_modules/morphdom/dist/morphdom-esm.js
var DOCUMENT_FRAGMENT_NODE = 11;
function morphAttrs(fromNode, toNode) {
  var toNodeAttrs = toNode.attributes;
  var attr;
  var attrName;
  var attrNamespaceURI;
  var attrValue;
  var fromValue;
  if (toNode.nodeType === DOCUMENT_FRAGMENT_NODE || fromNode.nodeType === DOCUMENT_FRAGMENT_NODE) {
    return;
  }
  for (var i = toNodeAttrs.length - 1; i >= 0; i--) {
    attr = toNodeAttrs[i];
    attrName = attr.name;
    attrNamespaceURI = attr.namespaceURI;
    attrValue = attr.value;
    if (attrNamespaceURI) {
      attrName = attr.localName || attrName;
      fromValue = fromNode.getAttributeNS(attrNamespaceURI, attrName);
      if (fromValue !== attrValue) {
        if (attr.prefix === "xmlns") {
          attrName = attr.name;
        }
        fromNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
      }
    } else {
      fromValue = fromNode.getAttribute(attrName);
      if (fromValue !== attrValue) {
        fromNode.setAttribute(attrName, attrValue);
      }
    }
  }
  var fromNodeAttrs = fromNode.attributes;
  for (var d = fromNodeAttrs.length - 1; d >= 0; d--) {
    attr = fromNodeAttrs[d];
    attrName = attr.name;
    attrNamespaceURI = attr.namespaceURI;
    if (attrNamespaceURI) {
      attrName = attr.localName || attrName;
      if (!toNode.hasAttributeNS(attrNamespaceURI, attrName)) {
        fromNode.removeAttributeNS(attrNamespaceURI, attrName);
      }
    } else {
      if (!toNode.hasAttribute(attrName)) {
        fromNode.removeAttribute(attrName);
      }
    }
  }
}
var range;
var NS_XHTML = "http://www.w3.org/1999/xhtml";
var doc = typeof document === "undefined" ? void 0 : document;
var HAS_TEMPLATE_SUPPORT = !!doc && "content" in doc.createElement("template");
var HAS_RANGE_SUPPORT = !!doc && doc.createRange && "createContextualFragment" in doc.createRange();
function createFragmentFromTemplate(str) {
  var template2 = doc.createElement("template");
  template2.innerHTML = str;
  return template2.content.childNodes[0];
}
function createFragmentFromRange(str) {
  if (!range) {
    range = doc.createRange();
    range.selectNode(doc.body);
  }
  var fragment = range.createContextualFragment(str);
  return fragment.childNodes[0];
}
function createFragmentFromWrap(str) {
  var fragment = doc.createElement("body");
  fragment.innerHTML = str;
  return fragment.childNodes[0];
}
function toElement(str) {
  str = str.trim();
  if (HAS_TEMPLATE_SUPPORT) {
    return createFragmentFromTemplate(str);
  } else if (HAS_RANGE_SUPPORT) {
    return createFragmentFromRange(str);
  }
  return createFragmentFromWrap(str);
}
function compareNodeNames(fromEl, toEl) {
  var fromNodeName = fromEl.nodeName;
  var toNodeName = toEl.nodeName;
  var fromCodeStart, toCodeStart;
  if (fromNodeName === toNodeName) {
    return true;
  }
  fromCodeStart = fromNodeName.charCodeAt(0);
  toCodeStart = toNodeName.charCodeAt(0);
  if (fromCodeStart <= 90 && toCodeStart >= 97) {
    return fromNodeName === toNodeName.toUpperCase();
  } else if (toCodeStart <= 90 && fromCodeStart >= 97) {
    return toNodeName === fromNodeName.toUpperCase();
  } else {
    return false;
  }
}
function createElementNS(name3, namespaceURI) {
  return !namespaceURI || namespaceURI === NS_XHTML ? doc.createElement(name3) : doc.createElementNS(namespaceURI, name3);
}
function moveChildren(fromEl, toEl) {
  var curChild = fromEl.firstChild;
  while (curChild) {
    var nextChild = curChild.nextSibling;
    toEl.appendChild(curChild);
    curChild = nextChild;
  }
  return toEl;
}
function syncBooleanAttrProp(fromEl, toEl, name3) {
  if (fromEl[name3] !== toEl[name3]) {
    fromEl[name3] = toEl[name3];
    if (fromEl[name3]) {
      fromEl.setAttribute(name3, "");
    } else {
      fromEl.removeAttribute(name3);
    }
  }
}
var specialElHandlers = {
  OPTION: function(fromEl, toEl) {
    var parentNode = fromEl.parentNode;
    if (parentNode) {
      var parentName = parentNode.nodeName.toUpperCase();
      if (parentName === "OPTGROUP") {
        parentNode = parentNode.parentNode;
        parentName = parentNode && parentNode.nodeName.toUpperCase();
      }
      if (parentName === "SELECT" && !parentNode.hasAttribute("multiple")) {
        if (fromEl.hasAttribute("selected") && !toEl.selected) {
          fromEl.setAttribute("selected", "selected");
          fromEl.removeAttribute("selected");
        }
        parentNode.selectedIndex = -1;
      }
    }
    syncBooleanAttrProp(fromEl, toEl, "selected");
  },
  /**
   * The "value" attribute is special for the <input> element since it sets
   * the initial value. Changing the "value" attribute without changing the
   * "value" property will have no effect since it is only used to the set the
   * initial value.  Similar for the "checked" attribute, and "disabled".
   */
  INPUT: function(fromEl, toEl) {
    syncBooleanAttrProp(fromEl, toEl, "checked");
    syncBooleanAttrProp(fromEl, toEl, "disabled");
    if (fromEl.value !== toEl.value) {
      fromEl.value = toEl.value;
    }
    if (!toEl.hasAttribute("value")) {
      fromEl.removeAttribute("value");
    }
  },
  TEXTAREA: function(fromEl, toEl) {
    var newValue = toEl.value;
    if (fromEl.value !== newValue) {
      fromEl.value = newValue;
    }
    var firstChild = fromEl.firstChild;
    if (firstChild) {
      var oldValue = firstChild.nodeValue;
      if (oldValue == newValue || !newValue && oldValue == fromEl.placeholder) {
        return;
      }
      firstChild.nodeValue = newValue;
    }
  },
  SELECT: function(fromEl, toEl) {
    if (!toEl.hasAttribute("multiple")) {
      var selectedIndex = -1;
      var i = 0;
      var curChild = fromEl.firstChild;
      var optgroup;
      var nodeName;
      while (curChild) {
        nodeName = curChild.nodeName && curChild.nodeName.toUpperCase();
        if (nodeName === "OPTGROUP") {
          optgroup = curChild;
          curChild = optgroup.firstChild;
        } else {
          if (nodeName === "OPTION") {
            if (curChild.hasAttribute("selected")) {
              selectedIndex = i;
              break;
            }
            i++;
          }
          curChild = curChild.nextSibling;
          if (!curChild && optgroup) {
            curChild = optgroup.nextSibling;
            optgroup = null;
          }
        }
      }
      fromEl.selectedIndex = selectedIndex;
    }
  }
};
var ELEMENT_NODE = 1;
var DOCUMENT_FRAGMENT_NODE$1 = 11;
var TEXT_NODE = 3;
var COMMENT_NODE = 8;
function noop() {
}
function defaultGetNodeKey(node) {
  if (node) {
    return node.getAttribute && node.getAttribute("id") || node.id;
  }
}
function morphdomFactory(morphAttrs2) {
  return function morphdom2(fromNode, toNode, options) {
    if (!options) {
      options = {};
    }
    if (typeof toNode === "string") {
      if (fromNode.nodeName === "#document" || fromNode.nodeName === "HTML" || fromNode.nodeName === "BODY") {
        var toNodeHtml = toNode;
        toNode = doc.createElement("html");
        toNode.innerHTML = toNodeHtml;
      } else {
        toNode = toElement(toNode);
      }
    }
    var getNodeKey = options.getNodeKey || defaultGetNodeKey;
    var onBeforeNodeAdded = options.onBeforeNodeAdded || noop;
    var onNodeAdded = options.onNodeAdded || noop;
    var onBeforeElUpdated = options.onBeforeElUpdated || noop;
    var onElUpdated = options.onElUpdated || noop;
    var onBeforeNodeDiscarded = options.onBeforeNodeDiscarded || noop;
    var onNodeDiscarded = options.onNodeDiscarded || noop;
    var onBeforeElChildrenUpdated = options.onBeforeElChildrenUpdated || noop;
    var childrenOnly = options.childrenOnly === true;
    var fromNodesLookup = /* @__PURE__ */ Object.create(null);
    var keyedRemovalList = [];
    function addKeyedRemoval(key) {
      keyedRemovalList.push(key);
    }
    function walkDiscardedChildNodes(node, skipKeyedNodes) {
      if (node.nodeType === ELEMENT_NODE) {
        var curChild = node.firstChild;
        while (curChild) {
          var key = void 0;
          if (skipKeyedNodes && (key = getNodeKey(curChild))) {
            addKeyedRemoval(key);
          } else {
            onNodeDiscarded(curChild);
            if (curChild.firstChild) {
              walkDiscardedChildNodes(curChild, skipKeyedNodes);
            }
          }
          curChild = curChild.nextSibling;
        }
      }
    }
    function removeNode(node, parentNode, skipKeyedNodes) {
      if (onBeforeNodeDiscarded(node) === false) {
        return;
      }
      if (parentNode) {
        parentNode.removeChild(node);
      }
      onNodeDiscarded(node);
      walkDiscardedChildNodes(node, skipKeyedNodes);
    }
    function indexTree(node) {
      if (node.nodeType === ELEMENT_NODE || node.nodeType === DOCUMENT_FRAGMENT_NODE$1) {
        var curChild = node.firstChild;
        while (curChild) {
          var key = getNodeKey(curChild);
          if (key) {
            fromNodesLookup[key] = curChild;
          }
          indexTree(curChild);
          curChild = curChild.nextSibling;
        }
      }
    }
    indexTree(fromNode);
    function handleNodeAdded(el) {
      onNodeAdded(el);
      var curChild = el.firstChild;
      while (curChild) {
        var nextSibling = curChild.nextSibling;
        var key = getNodeKey(curChild);
        if (key) {
          var unmatchedFromEl = fromNodesLookup[key];
          if (unmatchedFromEl && compareNodeNames(curChild, unmatchedFromEl)) {
            curChild.parentNode.replaceChild(unmatchedFromEl, curChild);
            morphEl(unmatchedFromEl, curChild);
          } else {
            handleNodeAdded(curChild);
          }
        } else {
          handleNodeAdded(curChild);
        }
        curChild = nextSibling;
      }
    }
    function cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey) {
      while (curFromNodeChild) {
        var fromNextSibling = curFromNodeChild.nextSibling;
        if (curFromNodeKey = getNodeKey(curFromNodeChild)) {
          addKeyedRemoval(curFromNodeKey);
        } else {
          removeNode(
            curFromNodeChild,
            fromEl,
            true
            /* skip keyed nodes */
          );
        }
        curFromNodeChild = fromNextSibling;
      }
    }
    function morphEl(fromEl, toEl, childrenOnly2) {
      var toElKey = getNodeKey(toEl);
      if (toElKey) {
        delete fromNodesLookup[toElKey];
      }
      if (!childrenOnly2) {
        if (onBeforeElUpdated(fromEl, toEl) === false) {
          return;
        }
        morphAttrs2(fromEl, toEl);
        onElUpdated(fromEl);
        if (onBeforeElChildrenUpdated(fromEl, toEl) === false) {
          return;
        }
      }
      if (fromEl.nodeName !== "TEXTAREA") {
        morphChildren2(fromEl, toEl);
      } else {
        specialElHandlers.TEXTAREA(fromEl, toEl);
      }
    }
    function morphChildren2(fromEl, toEl) {
      var curToNodeChild = toEl.firstChild;
      var curFromNodeChild = fromEl.firstChild;
      var curToNodeKey;
      var curFromNodeKey;
      var fromNextSibling;
      var toNextSibling;
      var matchingFromEl;
      outer: while (curToNodeChild) {
        toNextSibling = curToNodeChild.nextSibling;
        curToNodeKey = getNodeKey(curToNodeChild);
        while (curFromNodeChild) {
          fromNextSibling = curFromNodeChild.nextSibling;
          if (curToNodeChild.isSameNode && curToNodeChild.isSameNode(curFromNodeChild)) {
            curToNodeChild = toNextSibling;
            curFromNodeChild = fromNextSibling;
            continue outer;
          }
          curFromNodeKey = getNodeKey(curFromNodeChild);
          var curFromNodeType = curFromNodeChild.nodeType;
          var isCompatible = void 0;
          if (curFromNodeType === curToNodeChild.nodeType) {
            if (curFromNodeType === ELEMENT_NODE) {
              if (curToNodeKey) {
                if (curToNodeKey !== curFromNodeKey) {
                  if (matchingFromEl = fromNodesLookup[curToNodeKey]) {
                    if (fromNextSibling === matchingFromEl) {
                      isCompatible = false;
                    } else {
                      fromEl.insertBefore(matchingFromEl, curFromNodeChild);
                      if (curFromNodeKey) {
                        addKeyedRemoval(curFromNodeKey);
                      } else {
                        removeNode(
                          curFromNodeChild,
                          fromEl,
                          true
                          /* skip keyed nodes */
                        );
                      }
                      curFromNodeChild = matchingFromEl;
                    }
                  } else {
                    isCompatible = false;
                  }
                }
              } else if (curFromNodeKey) {
                isCompatible = false;
              }
              isCompatible = isCompatible !== false && compareNodeNames(curFromNodeChild, curToNodeChild);
              if (isCompatible) {
                morphEl(curFromNodeChild, curToNodeChild);
              }
            } else if (curFromNodeType === TEXT_NODE || curFromNodeType == COMMENT_NODE) {
              isCompatible = true;
              if (curFromNodeChild.nodeValue !== curToNodeChild.nodeValue) {
                curFromNodeChild.nodeValue = curToNodeChild.nodeValue;
              }
            }
          }
          if (isCompatible) {
            curToNodeChild = toNextSibling;
            curFromNodeChild = fromNextSibling;
            continue outer;
          }
          if (curFromNodeKey) {
            addKeyedRemoval(curFromNodeKey);
          } else {
            removeNode(
              curFromNodeChild,
              fromEl,
              true
              /* skip keyed nodes */
            );
          }
          curFromNodeChild = fromNextSibling;
        }
        if (curToNodeKey && (matchingFromEl = fromNodesLookup[curToNodeKey]) && compareNodeNames(matchingFromEl, curToNodeChild)) {
          fromEl.appendChild(matchingFromEl);
          morphEl(matchingFromEl, curToNodeChild);
        } else {
          var onBeforeNodeAddedResult = onBeforeNodeAdded(curToNodeChild);
          if (onBeforeNodeAddedResult !== false) {
            if (onBeforeNodeAddedResult) {
              curToNodeChild = onBeforeNodeAddedResult;
            }
            if (curToNodeChild.actualize) {
              curToNodeChild = curToNodeChild.actualize(fromEl.ownerDocument || doc);
            }
            fromEl.appendChild(curToNodeChild);
            handleNodeAdded(curToNodeChild);
          }
        }
        curToNodeChild = toNextSibling;
        curFromNodeChild = fromNextSibling;
      }
      cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey);
      var specialElHandler = specialElHandlers[fromEl.nodeName];
      if (specialElHandler) {
        specialElHandler(fromEl, toEl);
      }
    }
    var morphedNode = fromNode;
    var morphedNodeType = morphedNode.nodeType;
    var toNodeType = toNode.nodeType;
    if (!childrenOnly) {
      if (morphedNodeType === ELEMENT_NODE) {
        if (toNodeType === ELEMENT_NODE) {
          if (!compareNodeNames(fromNode, toNode)) {
            onNodeDiscarded(fromNode);
            morphedNode = moveChildren(fromNode, createElementNS(toNode.nodeName, toNode.namespaceURI));
          }
        } else {
          morphedNode = toNode;
        }
      } else if (morphedNodeType === TEXT_NODE || morphedNodeType === COMMENT_NODE) {
        if (toNodeType === morphedNodeType) {
          if (morphedNode.nodeValue !== toNode.nodeValue) {
            morphedNode.nodeValue = toNode.nodeValue;
          }
          return morphedNode;
        } else {
          morphedNode = toNode;
        }
      }
    }
    if (morphedNode === toNode) {
      onNodeDiscarded(fromNode);
    } else {
      if (toNode.isSameNode && toNode.isSameNode(morphedNode)) {
        return;
      }
      morphEl(morphedNode, toNode, childrenOnly);
      if (keyedRemovalList) {
        for (var i = 0, len = keyedRemovalList.length; i < len; i++) {
          var elToRemove = fromNodesLookup[keyedRemovalList[i]];
          if (elToRemove) {
            removeNode(elToRemove, elToRemove.parentNode, false);
          }
        }
      }
    }
    if (!childrenOnly && morphedNode !== fromNode && fromNode.parentNode) {
      if (morphedNode.actualize) {
        morphedNode = morphedNode.actualize(fromNode.ownerDocument || doc);
      }
      fromNode.parentNode.replaceChild(morphedNode, fromNode);
    }
    return morphedNode;
  };
}
var morphdom = morphdomFactory(morphAttrs);
var morphdom_esm_default = morphdom;

// node_modules/cable_ready/dist/cable_ready.js
var name = "cable_ready";
var version = "5.0.6";
var description = "CableReady helps you create great real-time user experiences by making it simple to trigger client-side DOM changes from server-side Ruby.";
var keywords = ["ruby", "rails", "websockets", "actioncable", "cable", "ssr", "stimulus_reflex", "client-side", "dom"];
var homepage = "https://cableready.stimulusreflex.com";
var bugs = "https://github.com/stimulusreflex/cable_ready/issues";
var repository = "https://github.com/stimulusreflex/cable_ready";
var license = "MIT";
var author = "Nathan Hopkins <natehop@gmail.com>";
var contributors = ["Andrew Mason <andrewmcodes@protonmail.com>", "Julian Rubisch <julian@julianrubisch.at>", "Marco Roth <marco.roth@intergga.ch>", "Nathan Hopkins <natehop@gmail.com>"];
var main = "./dist/cable_ready.js";
var module = "./dist/cable_ready.js";
var browser = "./dist/cable_ready.js";
var unpkg = "./dist/cable_ready.umd.js";
var umd = "./dist/cable_ready.umd.js";
var files = ["dist/*", "javascript/*"];
var scripts = {
  lint: "yarn run format --check",
  format: "yarn run prettier-standard ./javascript/**/*.js rollup.config.mjs",
  build: "yarn rollup -c",
  watch: "yarn rollup -wc",
  test: "web-test-runner javascript/test/**/*.test.js",
  "docs:dev": "vitepress dev docs",
  "docs:build": "vitepress build docs && cp ./docs/_redirects ./docs/.vitepress/dist",
  "docs:preview": "vitepress preview docs"
};
var dependencies = {
  morphdom: "2.6.1"
};
var devDependencies = {
  "@open-wc/testing": "^4.0.0",
  "@rollup/plugin-json": "^6.1.0",
  "@rollup/plugin-node-resolve": "^15.3.0",
  "@rollup/plugin-terser": "^0.4.4",
  "@web/dev-server-esbuild": "^1.0.3",
  "@web/dev-server-rollup": "^0.6.4",
  "@web/test-runner": "^0.19.0",
  "prettier-standard": "^16.4.1",
  rollup: "^4.25.0",
  sinon: "^19.0.2",
  vite: "^5.4.10",
  vitepress: "^1.5.0",
  "vitepress-plugin-search": "^1.0.4-alpha.22"
};
var packageInfo = {
  name,
  version,
  description,
  keywords,
  homepage,
  bugs,
  repository,
  license,
  author,
  contributors,
  main,
  module,
  browser,
  import: "./dist/cable_ready.js",
  unpkg,
  umd,
  files,
  scripts,
  dependencies,
  devDependencies
};
var inputTags = {
  INPUT: true,
  TEXTAREA: true,
  SELECT: true
};
var mutableTags = {
  INPUT: true,
  TEXTAREA: true,
  OPTION: true
};
var textInputTypes = {
  "datetime-local": true,
  "select-multiple": true,
  "select-one": true,
  color: true,
  date: true,
  datetime: true,
  email: true,
  month: true,
  number: true,
  password: true,
  range: true,
  search: true,
  tel: true,
  text: true,
  textarea: true,
  time: true,
  url: true,
  week: true
};
var activeElement;
var ActiveElement = {
  get element() {
    return activeElement;
  },
  set(element) {
    activeElement = element;
  }
};
var isTextInput = (element) => inputTags[element.tagName] && textInputTypes[element.type];
var assignFocus = (selector) => {
  const element = selector && selector.nodeType === Node.ELEMENT_NODE ? selector : document.querySelector(selector);
  const focusElement = element || ActiveElement.element;
  if (focusElement && focusElement.focus) focusElement.focus();
};
var dispatch2 = (element, name3, detail = {}) => {
  const init = {
    bubbles: true,
    cancelable: true,
    detail
  };
  const event = new CustomEvent(name3, init);
  element.dispatchEvent(event);
  if (window.jQuery) window.jQuery(element).trigger(name3, detail);
};
var xpathToElement = (xpath) => document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
var xpathToElementArray = (xpath, reverse = false) => {
  const snapshotList = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
  const snapshots = [];
  for (let i = 0; i < snapshotList.snapshotLength; i++) {
    snapshots.push(snapshotList.snapshotItem(i));
  }
  return reverse ? snapshots.reverse() : snapshots;
};
var getClassNames = (names) => Array.from(names).flat();
var processElements = (operation, callback) => {
  Array.from(operation.selectAll ? operation.element : [operation.element]).forEach(callback);
};
var kebabize = createCompounder((function(result, word, index) {
  return result + (index ? "-" : "") + word.toLowerCase();
}));
function createCompounder(callback) {
  return function(str) {
    return words(str).reduce(callback, "");
  };
}
var words = (str) => {
  str = str == null ? "" : str;
  return str.match(/([A-Z]{2,}|[0-9]+|[A-Z]?[a-z]+|[A-Z])/g) || [];
};
var operate = (operation, callback) => {
  if (!operation.cancel) {
    operation.delay ? setTimeout(callback, operation.delay) : callback();
    return true;
  }
  return false;
};
var before = (target, operation) => dispatch2(target, `cable-ready:before-${kebabize(operation.operation)}`, operation);
var after = (target, operation) => dispatch2(target, `cable-ready:after-${kebabize(operation.operation)}`, operation);
function debounce2(fn, delay = 250) {
  let timer;
  return (...args) => {
    const callback = () => fn.apply(this, args);
    if (timer) clearTimeout(timer);
    timer = setTimeout(callback, delay);
  };
}
function handleErrors(response2) {
  if (!response2.ok) throw Error(response2.statusText);
  return response2;
}
function safeScalar(val) {
  if (val !== void 0 && !["string", "number", "boolean"].includes(typeof val)) console.warn(`Operation expects a string, number or boolean, but got ${val} (${typeof val})`);
  return val != null ? val : "";
}
function safeString(str) {
  if (str !== void 0 && typeof str !== "string") console.warn(`Operation expects a string, but got ${str} (${typeof str})`);
  return str != null ? String(str) : "";
}
function safeArray(arr) {
  if (arr !== void 0 && !Array.isArray(arr)) console.warn(`Operation expects an array, but got ${arr} (${typeof arr})`);
  return arr != null ? Array.from(arr) : [];
}
function safeObject(obj) {
  if (obj !== void 0 && typeof obj !== "object") console.warn(`Operation expects an object, but got ${obj} (${typeof obj})`);
  return obj != null ? Object(obj) : {};
}
function safeStringOrArray(elem) {
  if (elem !== void 0 && !Array.isArray(elem) && typeof elem !== "string") console.warn(`Operation expects an Array or a String, but got ${elem} (${typeof elem})`);
  return elem == null ? "" : Array.isArray(elem) ? Array.from(elem) : String(elem);
}
function fragmentToString(fragment) {
  return new XMLSerializer().serializeToString(fragment);
}
async function graciouslyFetch(url, additionalHeaders) {
  try {
    const response2 = await fetch(url, {
      headers: {
        "X-REQUESTED-WITH": "XmlHttpRequest",
        ...additionalHeaders
      }
    });
    if (response2 == void 0) return;
    handleErrors(response2);
    return response2;
  } catch (e) {
    console.error(`Could not fetch ${url}`);
  }
}
var BoundedQueue = class {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.queue = [];
  }
  push(item) {
    if (this.isFull()) {
      this.shift();
    }
    this.queue.push(item);
  }
  shift() {
    return this.queue.shift();
  }
  isFull() {
    return this.queue.length === this.maxSize;
  }
};
var utils = Object.freeze({
  __proto__: null,
  BoundedQueue,
  after,
  assignFocus,
  before,
  debounce: debounce2,
  dispatch: dispatch2,
  fragmentToString,
  getClassNames,
  graciouslyFetch,
  handleErrors,
  isTextInput,
  kebabize,
  operate,
  processElements,
  safeArray,
  safeObject,
  safeScalar,
  safeString,
  safeStringOrArray,
  xpathToElement,
  xpathToElementArray
});
var shouldMorph = (operation) => (fromEl, toEl) => !shouldMorphCallbacks.map(((callback) => typeof callback === "function" ? callback(operation, fromEl, toEl) : true)).includes(false);
var didMorph = (operation) => (el) => {
  didMorphCallbacks.forEach(((callback) => {
    if (typeof callback === "function") callback(operation, el);
  }));
};
var verifyNotMutable = (detail, fromEl, toEl) => {
  if (!mutableTags[fromEl.tagName] && fromEl.isEqualNode(toEl)) return false;
  return true;
};
var verifyNotContentEditable = (detail, fromEl, toEl) => {
  if (fromEl === ActiveElement.element && fromEl.isContentEditable) return false;
  return true;
};
var verifyNotPermanent = (detail, fromEl, toEl) => {
  const { permanentAttributeName } = detail;
  if (!permanentAttributeName) return true;
  const permanent = fromEl.closest(`[${permanentAttributeName}]`);
  if (!permanent && fromEl === ActiveElement.element && isTextInput(fromEl)) {
    const ignore = {
      value: true
    };
    Array.from(toEl.attributes).forEach(((attribute) => {
      if (!ignore[attribute.name]) fromEl.setAttribute(attribute.name, attribute.value);
    }));
    return false;
  }
  return !permanent;
};
var shouldMorphCallbacks = [verifyNotMutable, verifyNotPermanent, verifyNotContentEditable];
var didMorphCallbacks = [];
var morph_callbacks = Object.freeze({
  __proto__: null,
  didMorph,
  didMorphCallbacks,
  shouldMorph,
  shouldMorphCallbacks,
  verifyNotContentEditable,
  verifyNotMutable,
  verifyNotPermanent
});
var Operations = {
  // DOM Mutations
  append: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { html, focusSelector } = operation;
        element.insertAdjacentHTML("beforeend", safeScalar(html));
        assignFocus(focusSelector);
      }));
      after(element, operation);
    }));
  },
  graft: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { parent, focusSelector } = operation;
        const parentElement = document.querySelector(parent);
        if (parentElement) {
          parentElement.appendChild(element);
          assignFocus(focusSelector);
        }
      }));
      after(element, operation);
    }));
  },
  innerHtml: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { html, focusSelector } = operation;
        element.innerHTML = safeScalar(html);
        assignFocus(focusSelector);
      }));
      after(element, operation);
    }));
  },
  insertAdjacentHtml: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { html, position, focusSelector } = operation;
        element.insertAdjacentHTML(position || "beforeend", safeScalar(html));
        assignFocus(focusSelector);
      }));
      after(element, operation);
    }));
  },
  insertAdjacentText: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { text, position, focusSelector } = operation;
        element.insertAdjacentText(position || "beforeend", safeScalar(text));
        assignFocus(focusSelector);
      }));
      after(element, operation);
    }));
  },
  outerHtml: (operation) => {
    processElements(operation, ((element) => {
      const parent = element.parentElement;
      const idx = parent && Array.from(parent.children).indexOf(element);
      before(element, operation);
      operate(operation, (() => {
        const { html, focusSelector } = operation;
        element.outerHTML = safeScalar(html);
        assignFocus(focusSelector);
      }));
      after(parent ? parent.children[idx] : document.documentElement, operation);
    }));
  },
  prepend: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { html, focusSelector } = operation;
        element.insertAdjacentHTML("afterbegin", safeScalar(html));
        assignFocus(focusSelector);
      }));
      after(element, operation);
    }));
  },
  remove: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { focusSelector } = operation;
        element.remove();
        assignFocus(focusSelector);
      }));
      after(document, operation);
    }));
  },
  replace: (operation) => {
    processElements(operation, ((element) => {
      const parent = element.parentElement;
      const idx = parent && Array.from(parent.children).indexOf(element);
      before(element, operation);
      operate(operation, (() => {
        const { html, focusSelector } = operation;
        element.outerHTML = safeScalar(html);
        assignFocus(focusSelector);
      }));
      after(parent ? parent.children[idx] : document.documentElement, operation);
    }));
  },
  textContent: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { text, focusSelector } = operation;
        element.textContent = safeScalar(text);
        assignFocus(focusSelector);
      }));
      after(element, operation);
    }));
  },
  // Element Property Mutations
  addCssClass: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { name: name3 } = operation;
        element.classList.add(...getClassNames([safeStringOrArray(name3)]));
      }));
      after(element, operation);
    }));
  },
  removeAttribute: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { name: name3 } = operation;
        element.removeAttribute(safeString(name3));
      }));
      after(element, operation);
    }));
  },
  removeCssClass: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { name: name3 } = operation;
        element.classList.remove(...getClassNames([safeStringOrArray(name3)]));
        if (element.classList.length === 0) element.removeAttribute("class");
      }));
      after(element, operation);
    }));
  },
  setAttribute: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { name: name3, value } = operation;
        element.setAttribute(safeString(name3), safeScalar(value));
      }));
      after(element, operation);
    }));
  },
  setDatasetProperty: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { name: name3, value } = operation;
        element.dataset[safeString(name3)] = safeScalar(value);
      }));
      after(element, operation);
    }));
  },
  setProperty: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { name: name3, value } = operation;
        if (name3 in element) element[safeString(name3)] = safeScalar(value);
      }));
      after(element, operation);
    }));
  },
  setStyle: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { name: name3, value } = operation;
        element.style[safeString(name3)] = safeScalar(value);
      }));
      after(element, operation);
    }));
  },
  setStyles: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { styles } = operation;
        for (let [name3, value] of Object.entries(styles)) element.style[safeString(name3)] = safeScalar(value);
      }));
      after(element, operation);
    }));
  },
  setValue: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { value } = operation;
        element.value = safeScalar(value);
      }));
      after(element, operation);
    }));
  },
  // DOM Events and Meta-Operations
  dispatchEvent: (operation) => {
    processElements(operation, ((element) => {
      before(element, operation);
      operate(operation, (() => {
        const { name: name3, detail } = operation;
        dispatch2(element, safeString(name3), safeObject(detail));
      }));
      after(element, operation);
    }));
  },
  setMeta: (operation) => {
    before(document, operation);
    operate(operation, (() => {
      const { name: name3, content } = operation;
      let meta = document.head.querySelector(`meta[name='${name3}']`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = safeString(name3);
        document.head.appendChild(meta);
      }
      meta.content = safeScalar(content);
    }));
    after(document, operation);
  },
  setTitle: (operation) => {
    before(document, operation);
    operate(operation, (() => {
      const { title } = operation;
      document.title = safeScalar(title);
    }));
    after(document, operation);
  },
  // Browser Manipulations
  clearStorage: (operation) => {
    before(document, operation);
    operate(operation, (() => {
      const { type } = operation;
      const storage = type === "session" ? sessionStorage : localStorage;
      storage.clear();
    }));
    after(document, operation);
  },
  go: (operation) => {
    before(window, operation);
    operate(operation, (() => {
      const { delta } = operation;
      history.go(delta);
    }));
    after(window, operation);
  },
  pushState: (operation) => {
    before(window, operation);
    operate(operation, (() => {
      const { state, title, url } = operation;
      history.pushState(safeObject(state), safeString(title), safeString(url));
    }));
    after(window, operation);
  },
  redirectTo: (operation) => {
    before(window, operation);
    operate(operation, (() => {
      let { url, action, turbo } = operation;
      action = action || "advance";
      url = safeString(url);
      if (turbo === void 0) turbo = true;
      if (turbo) {
        if (window.Turbo) window.Turbo.visit(url, {
          action
        });
        if (window.Turbolinks) window.Turbolinks.visit(url, {
          action
        });
        if (!window.Turbo && !window.Turbolinks) window.location.href = url;
      } else {
        window.location.href = url;
      }
    }));
    after(window, operation);
  },
  reload: (operation) => {
    before(window, operation);
    operate(operation, (() => {
      window.location.reload();
    }));
    after(window, operation);
  },
  removeStorageItem: (operation) => {
    before(document, operation);
    operate(operation, (() => {
      const { key, type } = operation;
      const storage = type === "session" ? sessionStorage : localStorage;
      storage.removeItem(safeString(key));
    }));
    after(document, operation);
  },
  replaceState: (operation) => {
    before(window, operation);
    operate(operation, (() => {
      const { state, title, url } = operation;
      history.replaceState(safeObject(state), safeString(title), safeString(url));
    }));
    after(window, operation);
  },
  scrollIntoView: (operation) => {
    const { element } = operation;
    before(element, operation);
    operate(operation, (() => {
      element.scrollIntoView(operation);
    }));
    after(element, operation);
  },
  setCookie: (operation) => {
    before(document, operation);
    operate(operation, (() => {
      const { cookie } = operation;
      document.cookie = safeScalar(cookie);
    }));
    after(document, operation);
  },
  setFocus: (operation) => {
    const { element } = operation;
    before(element, operation);
    operate(operation, (() => {
      assignFocus(element);
    }));
    after(element, operation);
  },
  setStorageItem: (operation) => {
    before(document, operation);
    operate(operation, (() => {
      const { key, value, type } = operation;
      const storage = type === "session" ? sessionStorage : localStorage;
      storage.setItem(safeString(key), safeScalar(value));
    }));
    after(document, operation);
  },
  // Notifications
  consoleLog: (operation) => {
    before(document, operation);
    operate(operation, (() => {
      const { message, level } = operation;
      level && ["warn", "info", "error"].includes(level) ? console[level](message) : console.log(message);
    }));
    after(document, operation);
  },
  consoleTable: (operation) => {
    before(document, operation);
    operate(operation, (() => {
      const { data, columns } = operation;
      console.table(data, safeArray(columns));
    }));
    after(document, operation);
  },
  notification: (operation) => {
    before(document, operation);
    operate(operation, (() => {
      const { title, options } = operation;
      Notification.requestPermission().then(((result) => {
        operation.permission = result;
        if (result === "granted") new Notification(safeString(title), safeObject(options));
      }));
    }));
    after(document, operation);
  },
  // Morph operations
  morph: (operation) => {
    processElements(operation, ((element) => {
      const { html } = operation;
      const template2 = document.createElement("template");
      template2.innerHTML = String(safeScalar(html)).trim();
      operation.content = template2.content;
      const parent = element.parentElement;
      const idx = parent && Array.from(parent.children).indexOf(element);
      before(element, operation);
      operate(operation, (() => {
        const { childrenOnly, focusSelector } = operation;
        morphdom_esm_default(element, childrenOnly ? template2.content : template2.innerHTML, {
          childrenOnly: !!childrenOnly,
          onBeforeElUpdated: shouldMorph(operation),
          onElUpdated: didMorph(operation)
        });
        assignFocus(focusSelector);
      }));
      after(parent ? parent.children[idx] : document.documentElement, operation);
    }));
  }
};
var operations = Operations;
var add2 = (newOperations) => {
  operations = {
    ...operations,
    ...newOperations
  };
};
var addOperations = (operations2) => {
  add2(operations2);
};
var addOperation = (name3, operation) => {
  const operations2 = {};
  operations2[name3] = operation;
  add2(operations2);
};
var OperationStore = {
  get all() {
    return operations;
  }
};
var missingElement = "warn";
var MissingElement = {
  get behavior() {
    return missingElement;
  },
  set(value) {
    if (["warn", "ignore", "event", "exception"].includes(value)) missingElement = value;
    else console.warn("Invalid 'onMissingElement' option. Defaulting to 'warn'.");
  }
};
var perform = (operations2, options = {
  onMissingElement: MissingElement.behavior
}) => {
  const batches = {};
  operations2.forEach(((operation) => {
    if (!!operation.batch) batches[operation.batch] = batches[operation.batch] ? ++batches[operation.batch] : 1;
  }));
  operations2.forEach(((operation) => {
    const name3 = operation.operation;
    try {
      if (operation.selector) {
        if (operation.xpath) {
          operation.element = operation.selectAll ? xpathToElementArray(operation.selector) : xpathToElement(operation.selector);
        } else {
          operation.element = operation.selectAll ? document.querySelectorAll(operation.selector) : document.querySelector(operation.selector);
        }
      } else {
        operation.element = document;
      }
      if (operation.element || options.onMissingElement !== "ignore") {
        ActiveElement.set(document.activeElement);
        const cableReadyOperation = OperationStore.all[name3];
        if (cableReadyOperation) {
          cableReadyOperation(operation);
          if (!!operation.batch && --batches[operation.batch] === 0) dispatch2(document, "cable-ready:batch-complete", {
            batch: operation.batch
          });
        } else {
          console.error(`CableReady couldn't find the "${name3}" operation. Make sure you use the camelized form when calling an operation method.`);
        }
      }
    } catch (e) {
      if (operation.element) {
        console.error(`CableReady detected an error in ${name3 || "operation"}: ${e.message}. If you need to support older browsers make sure you've included the corresponding polyfills. https://docs.stimulusreflex.com/setup#polyfills-for-ie11.`);
        console.error(e);
      } else {
        const warning = `CableReady ${name3 || ""} operation failed due to missing DOM element for selector: '${operation.selector}'`;
        switch (options.onMissingElement) {
          case "ignore":
            break;
          case "event":
            dispatch2(document, "cable-ready:missing-element", {
              warning,
              operation
            });
            break;
          case "exception":
            throw warning;
          default:
            console.warn(warning);
        }
      }
    }
  }));
};
var performAsync = (operations2, options = {
  onMissingElement: MissingElement.behavior
}) => new Promise(((resolve, reject) => {
  try {
    resolve(perform(operations2, options));
  } catch (err) {
    reject(err);
  }
}));
var SubscribingElement = class extends HTMLElement {
  static get tagName() {
    throw new Error("Implement the tagName() getter in the inheriting class");
  }
  static define() {
    if (!customElements.get(this.tagName)) {
      customElements.define(this.tagName, this);
    }
  }
  disconnectedCallback() {
    if (this.channel) this.channel.unsubscribe();
  }
  createSubscription(consumer4, channel, receivedCallback) {
    this.channel = consumer4.subscriptions.create({
      channel,
      identifier: this.identifier
    }, {
      received: receivedCallback
    });
  }
  get preview() {
    return document.documentElement.hasAttribute("data-turbolinks-preview") || document.documentElement.hasAttribute("data-turbo-preview");
  }
  get identifier() {
    return this.getAttribute("identifier");
  }
};
var consumer2;
var BACKOFF = [25, 50, 75, 100, 200, 250, 500, 800, 1e3, 2e3];
var wait = (ms) => new Promise(((resolve) => setTimeout(resolve, ms)));
var getConsumerWithRetry = async (retry = 0) => {
  if (consumer2) return consumer2;
  if (retry >= BACKOFF.length) {
    throw new Error("Couldn't obtain a Action Cable consumer within 5s");
  }
  await wait(BACKOFF[retry]);
  return await getConsumerWithRetry(retry + 1);
};
var CableConsumer = {
  setConsumer(value) {
    consumer2 = value;
  },
  get consumer() {
    return consumer2;
  },
  async getConsumer() {
    return await getConsumerWithRetry();
  }
};
var StreamFromElement = class extends SubscribingElement {
  static get tagName() {
    return "cable-ready-stream-from";
  }
  async connectedCallback() {
    if (this.preview) return;
    const consumer4 = await CableConsumer.getConsumer();
    if (consumer4) {
      this.createSubscription(consumer4, "CableReady::Stream", this.performOperations.bind(this));
    } else {
      console.error("The `cable_ready_stream_from` helper cannot connect. You must initialize CableReady with an Action Cable consumer.");
    }
  }
  performOperations(data) {
    if (data.cableReady) perform(data.operations, {
      onMissingElement: this.onMissingElement
    });
  }
  get onMissingElement() {
    const value = this.getAttribute("missing") || MissingElement.behavior;
    if (["warn", "ignore", "event"].includes(value)) return value;
    else {
      console.warn("Invalid 'missing' attribute. Defaulting to 'warn'.");
      return "warn";
    }
  }
};
var debugging = false;
var Debug2 = {
  get enabled() {
    return debugging;
  },
  get disabled() {
    return !debugging;
  },
  get value() {
    return debugging;
  },
  set(value) {
    debugging = !!value;
  },
  set debug(value) {
    debugging = !!value;
  }
};
var request = (data, blocks) => {
  if (Debug2.disabled) return;
  const message = `\u2191 Updatable request affecting ${blocks.length} element(s): `;
  console.log(message, {
    elements: blocks.map(((b) => b.element)),
    identifiers: blocks.map(((b) => b.element.getAttribute("identifier"))),
    data
  });
  return message;
};
var cancel = (timestamp, reason) => {
  if (Debug2.disabled) return;
  const duration2 = /* @__PURE__ */ new Date() - timestamp;
  const message = `\u274C Updatable request canceled after ${duration2}ms: ${reason}`;
  console.log(message);
  return message;
};
var response = (timestamp, element, urls) => {
  if (Debug2.disabled) return;
  const duration2 = /* @__PURE__ */ new Date() - timestamp;
  const message = `\u2193 Updatable response: All URLs fetched in ${duration2}ms`;
  console.log(message, {
    element,
    urls
  });
  return message;
};
var morphStart = (timestamp, element) => {
  if (Debug2.disabled) return;
  const duration2 = /* @__PURE__ */ new Date() - timestamp;
  const message = `\u21BB Updatable morph: starting after ${duration2}ms`;
  console.log(message, {
    element
  });
  return message;
};
var morphEnd = (timestamp, element) => {
  if (Debug2.disabled) return;
  const duration2 = /* @__PURE__ */ new Date() - timestamp;
  const message = `\u21BA Updatable morph: completed after ${duration2}ms`;
  console.log(message, {
    element
  });
  return message;
};
var Log = {
  request,
  cancel,
  response,
  morphStart,
  morphEnd
};
var AppearanceObserver2 = class {
  constructor(delegate, element = null) {
    this.delegate = delegate;
    this.element = element || delegate;
    this.started = false;
    this.intersecting = false;
    this.intersectionObserver = new IntersectionObserver(this.intersect);
  }
  start() {
    if (!this.started) {
      this.started = true;
      this.intersectionObserver.observe(this.element);
      this.observeVisibility();
    }
  }
  stop() {
    if (this.started) {
      this.started = false;
      this.intersectionObserver.unobserve(this.element);
      this.unobserveVisibility();
    }
  }
  observeVisibility = () => {
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  };
  unobserveVisibility = () => {
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
  };
  intersect = (entries) => {
    entries.forEach(((entry) => {
      if (entry.target === this.element) {
        if (entry.isIntersecting && document.visibilityState === "visible") {
          this.intersecting = true;
          this.delegate.appearedInViewport();
        } else {
          this.intersecting = false;
          this.delegate.disappearedFromViewport();
        }
      }
    }));
  };
  handleVisibilityChange = (event) => {
    if (document.visibilityState === "visible" && this.intersecting) {
      this.delegate.appearedInViewport();
    } else {
      this.delegate.disappearedFromViewport();
    }
  };
};
var template = `
<style>
  :host {
    display: block;
  }
</style>
<slot></slot>
`;
var UpdatesForElement = class extends SubscribingElement {
  static get tagName() {
    return "cable-ready-updates-for";
  }
  constructor() {
    super();
    const shadowRoot = this.attachShadow({
      mode: "open"
    });
    shadowRoot.innerHTML = template;
    this.triggerElementLog = new BoundedQueue(10);
    this.targetElementLog = new BoundedQueue(10);
    this.appearanceObserver = new AppearanceObserver2(this);
    this.visible = false;
    this.didTransitionToVisible = false;
  }
  async connectedCallback() {
    if (this.preview) return;
    this.update = debounce2(this.update.bind(this), this.debounce);
    const consumer4 = await CableConsumer.getConsumer();
    if (consumer4) {
      this.createSubscription(consumer4, "CableReady::Stream", this.update);
    } else {
      console.error("The `cable_ready_updates_for` helper cannot connect. You must initialize CableReady with an Action Cable consumer.");
    }
    if (this.observeAppearance) {
      this.appearanceObserver.start();
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.observeAppearance) {
      this.appearanceObserver.stop();
    }
  }
  async update(data) {
    this.lastUpdateTimestamp = /* @__PURE__ */ new Date();
    const blocks = Array.from(document.querySelectorAll(this.query), ((element) => new Block(element))).filter(((block) => block.shouldUpdate(data)));
    this.triggerElementLog.push(`${(/* @__PURE__ */ new Date()).toLocaleString()}: ${Log.request(data, blocks)}`);
    if (blocks.length === 0) {
      this.triggerElementLog.push(`${(/* @__PURE__ */ new Date()).toLocaleString()}: ${Log.cancel(this.lastUpdateTimestamp, "All elements filtered out")}`);
      return;
    }
    if (blocks[0].element !== this && !this.didTransitionToVisible) {
      this.triggerElementLog.push(`${(/* @__PURE__ */ new Date()).toLocaleString()}: ${Log.cancel(this.lastUpdateTimestamp, "Update already requested")}`);
      return;
    }
    ActiveElement.set(document.activeElement);
    this.html = {};
    const uniqueUrls = [...new Set(blocks.map(((block) => block.url)))];
    await Promise.all(uniqueUrls.map((async (url) => {
      if (!this.html.hasOwnProperty(url)) {
        const response2 = await graciouslyFetch(url, {
          "X-Cable-Ready": "update"
        });
        this.html[url] = await response2.text();
      }
    })));
    this.triggerElementLog.push(`${(/* @__PURE__ */ new Date()).toLocaleString()}: ${Log.response(this.lastUpdateTimestamp, this, uniqueUrls)}`);
    this.index = {};
    blocks.forEach(((block) => {
      this.index.hasOwnProperty(block.url) ? this.index[block.url]++ : this.index[block.url] = 0;
      block.process(data, this.html, this.index, this.lastUpdateTimestamp);
    }));
  }
  appearedInViewport() {
    if (!this.visible) {
      this.didTransitionToVisible = true;
      this.update({});
    }
    this.visible = true;
  }
  disappearedFromViewport() {
    this.visible = false;
  }
  get query() {
    return `${this.tagName}[identifier="${this.identifier}"]`;
  }
  get identifier() {
    return this.getAttribute("identifier");
  }
  get debounce() {
    return this.hasAttribute("debounce") ? parseInt(this.getAttribute("debounce")) : 20;
  }
  get observeAppearance() {
    return this.hasAttribute("observe-appearance");
  }
};
var Block = class {
  constructor(element) {
    this.element = element;
  }
  async process(data, html, fragmentsIndex, startTimestamp) {
    const blockIndex = fragmentsIndex[this.url];
    const template2 = document.createElement("template");
    this.element.setAttribute("updating", "updating");
    template2.innerHTML = String(html[this.url]).trim();
    await this.resolveTurboFrames(template2.content);
    const fragments = template2.content.querySelectorAll(this.query);
    if (fragments.length <= blockIndex) {
      console.warn(`Update aborted due to insufficient number of elements. The offending url is ${this.url}, the offending element is:`, this.element);
      return;
    }
    const operation = {
      element: this.element,
      html: fragments[blockIndex],
      permanentAttributeName: "data-ignore-updates"
    };
    dispatch2(this.element, "cable-ready:before-update", operation);
    this.element.targetElementLog.push(`${(/* @__PURE__ */ new Date()).toLocaleString()}: ${Log.morphStart(startTimestamp, this.element)}`);
    morphdom_esm_default(this.element, fragments[blockIndex], {
      childrenOnly: true,
      onBeforeElUpdated: shouldMorph(operation),
      onElUpdated: (_) => {
        this.element.removeAttribute("updating");
        this.element.didTransitionToVisible = false;
        dispatch2(this.element, "cable-ready:after-update", operation);
        assignFocus(operation.focusSelector);
      }
    });
    this.element.targetElementLog.push(`${(/* @__PURE__ */ new Date()).toLocaleString()}: ${Log.morphEnd(startTimestamp, this.element)}`);
  }
  async resolveTurboFrames(documentFragment) {
    const reloadingTurboFrames = [...documentFragment.querySelectorAll('turbo-frame[src]:not([loading="lazy"])')];
    return Promise.all(reloadingTurboFrames.map(((frame) => new Promise((async (resolve) => {
      const frameResponse = await graciouslyFetch(frame.getAttribute("src"), {
        "Turbo-Frame": frame.id,
        "X-Cable-Ready": "update"
      });
      const frameTemplate = document.createElement("template");
      frameTemplate.innerHTML = await frameResponse.text();
      await this.resolveTurboFrames(frameTemplate.content);
      const selector = `turbo-frame#${frame.id}`;
      const frameContent = frameTemplate.content.querySelector(selector);
      const content = frameContent ? frameContent.innerHTML.trim() : "";
      documentFragment.querySelector(selector).innerHTML = content;
      resolve();
    })))));
  }
  shouldUpdate(data) {
    return !this.ignoresInnerUpdates && this.hasChangesSelectedForUpdate(data) && (!this.observeAppearance || this.visible);
  }
  hasChangesSelectedForUpdate(data) {
    const only = this.element.getAttribute("only");
    return !(only && data.changed && !only.split(" ").some(((attribute) => data.changed.includes(attribute))));
  }
  get ignoresInnerUpdates() {
    return this.element.hasAttribute("ignore-inner-updates") && this.element.hasAttribute("performing-inner-update");
  }
  get url() {
    return this.element.hasAttribute("url") ? this.element.getAttribute("url") : location.href;
  }
  get identifier() {
    return this.element.identifier;
  }
  get query() {
    return this.element.query;
  }
  get visible() {
    return this.element.visible;
  }
  get observeAppearance() {
    return this.element.observeAppearance;
  }
};
var registerInnerUpdates = () => {
  document.addEventListener("stimulus-reflex:before", ((event) => {
    recursiveMarkUpdatesForElements(event.detail.element);
  }));
  document.addEventListener("stimulus-reflex:after", ((event) => {
    setTimeout((() => {
      recursiveUnmarkUpdatesForElements(event.detail.element);
    }));
  }));
  document.addEventListener("turbo:submit-start", ((event) => {
    recursiveMarkUpdatesForElements(event.target);
  }));
  document.addEventListener("turbo:submit-end", ((event) => {
    setTimeout((() => {
      recursiveUnmarkUpdatesForElements(event.target);
    }));
  }));
  document.addEventListener("turbo-boost:command:start", ((event) => {
    recursiveMarkUpdatesForElements(event.target);
  }));
  document.addEventListener("turbo-boost:command:finish", ((event) => {
    setTimeout((() => {
      recursiveUnmarkUpdatesForElements(event.target);
    }));
  }));
  document.addEventListener("turbo-boost:command:error", ((event) => {
    setTimeout((() => {
      recursiveUnmarkUpdatesForElements(event.target);
    }));
  }));
};
var recursiveMarkUpdatesForElements = (leaf) => {
  const closestUpdatesFor = leaf && leaf.parentElement && leaf.parentElement.closest("cable-ready-updates-for");
  if (closestUpdatesFor) {
    closestUpdatesFor.setAttribute("performing-inner-update", "");
    recursiveMarkUpdatesForElements(closestUpdatesFor);
  }
};
var recursiveUnmarkUpdatesForElements = (leaf) => {
  const closestUpdatesFor = leaf && leaf.parentElement && leaf.parentElement.closest("cable-ready-updates-for");
  if (closestUpdatesFor) {
    closestUpdatesFor.removeAttribute("performing-inner-update");
    recursiveUnmarkUpdatesForElements(closestUpdatesFor);
  }
};
var defineElements = () => {
  registerInnerUpdates();
  StreamFromElement.define();
  UpdatesForElement.define();
};
var initialize = (initializeOptions = {}) => {
  const { consumer: consumer4, onMissingElement, debug } = initializeOptions;
  Debug2.set(!!debug);
  if (consumer4) {
    CableConsumer.setConsumer(consumer4);
  } else {
    console.error("CableReady requires a reference to your Action Cable `consumer` for its helpers to function.\nEnsure that you have imported the `CableReady` package as well as `consumer` from your `channels` folder, then call `CableReady.initialize({ consumer })`.");
  }
  if (onMissingElement) {
    MissingElement.set(onMissingElement);
  }
  defineElements();
};
var global = {
  perform,
  performAsync,
  shouldMorphCallbacks,
  didMorphCallbacks,
  initialize,
  addOperation,
  addOperations,
  version: packageInfo.version,
  cable: CableConsumer,
  get DOMOperations() {
    console.warn("DEPRECATED: Please use `CableReady.operations` instead of `CableReady.DOMOperations`");
    return OperationStore.all;
  },
  get operations() {
    return OperationStore.all;
  },
  get consumer() {
    return CableConsumer.consumer;
  }
};
window.CableReady = global;

// node_modules/stimulus_reflex/node_modules/@rails/actioncable/app/assets/javascripts/actioncable.esm.js
var adapters = {
  logger: typeof console !== "undefined" ? console : void 0,
  WebSocket: typeof WebSocket !== "undefined" ? WebSocket : void 0
};
var logger = {
  log(...messages) {
    if (this.enabled) {
      messages.push(Date.now());
      adapters.logger.log("[ActionCable]", ...messages);
    }
  }
};
var now2 = () => (/* @__PURE__ */ new Date()).getTime();
var secondsSince2 = (time) => (now2() - time) / 1e3;
var ConnectionMonitor2 = class {
  constructor(connection) {
    this.visibilityDidChange = this.visibilityDidChange.bind(this);
    this.connection = connection;
    this.reconnectAttempts = 0;
  }
  start() {
    if (!this.isRunning()) {
      this.startedAt = now2();
      delete this.stoppedAt;
      this.startPolling();
      addEventListener("visibilitychange", this.visibilityDidChange);
      logger.log(`ConnectionMonitor started. stale threshold = ${this.constructor.staleThreshold} s`);
    }
  }
  stop() {
    if (this.isRunning()) {
      this.stoppedAt = now2();
      this.stopPolling();
      removeEventListener("visibilitychange", this.visibilityDidChange);
      logger.log("ConnectionMonitor stopped");
    }
  }
  isRunning() {
    return this.startedAt && !this.stoppedAt;
  }
  recordMessage() {
    this.pingedAt = now2();
  }
  recordConnect() {
    this.reconnectAttempts = 0;
    delete this.disconnectedAt;
    logger.log("ConnectionMonitor recorded connect");
  }
  recordDisconnect() {
    this.disconnectedAt = now2();
    logger.log("ConnectionMonitor recorded disconnect");
  }
  startPolling() {
    this.stopPolling();
    this.poll();
  }
  stopPolling() {
    clearTimeout(this.pollTimeout);
  }
  poll() {
    this.pollTimeout = setTimeout((() => {
      this.reconnectIfStale();
      this.poll();
    }), this.getPollInterval());
  }
  getPollInterval() {
    const { staleThreshold, reconnectionBackoffRate } = this.constructor;
    const backoff = Math.pow(1 + reconnectionBackoffRate, Math.min(this.reconnectAttempts, 10));
    const jitterMax = this.reconnectAttempts === 0 ? 1 : reconnectionBackoffRate;
    const jitter = jitterMax * Math.random();
    return staleThreshold * 1e3 * backoff * (1 + jitter);
  }
  reconnectIfStale() {
    if (this.connectionIsStale()) {
      logger.log(`ConnectionMonitor detected stale connection. reconnectAttempts = ${this.reconnectAttempts}, time stale = ${secondsSince2(this.refreshedAt)} s, stale threshold = ${this.constructor.staleThreshold} s`);
      this.reconnectAttempts++;
      if (this.disconnectedRecently()) {
        logger.log(`ConnectionMonitor skipping reopening recent disconnect. time disconnected = ${secondsSince2(this.disconnectedAt)} s`);
      } else {
        logger.log("ConnectionMonitor reopening");
        this.connection.reopen();
      }
    }
  }
  get refreshedAt() {
    return this.pingedAt ? this.pingedAt : this.startedAt;
  }
  connectionIsStale() {
    return secondsSince2(this.refreshedAt) > this.constructor.staleThreshold;
  }
  disconnectedRecently() {
    return this.disconnectedAt && secondsSince2(this.disconnectedAt) < this.constructor.staleThreshold;
  }
  visibilityDidChange() {
    if (document.visibilityState === "visible") {
      setTimeout((() => {
        if (this.connectionIsStale() || !this.connection.isOpen()) {
          logger.log(`ConnectionMonitor reopening stale connection on visibilitychange. visibilityState = ${document.visibilityState}`);
          this.connection.reopen();
        }
      }), 200);
    }
  }
};
ConnectionMonitor2.staleThreshold = 6;
ConnectionMonitor2.reconnectionBackoffRate = 0.15;
var INTERNAL = {
  message_types: {
    welcome: "welcome",
    disconnect: "disconnect",
    ping: "ping",
    confirmation: "confirm_subscription",
    rejection: "reject_subscription"
  },
  disconnect_reasons: {
    unauthorized: "unauthorized",
    invalid_request: "invalid_request",
    server_restart: "server_restart",
    remote: "remote"
  },
  default_mount_path: "/cable",
  protocols: ["actioncable-v1-json", "actioncable-unsupported"]
};
var { message_types: message_types2, protocols: protocols2 } = INTERNAL;
var supportedProtocols2 = protocols2.slice(0, protocols2.length - 1);
var indexOf2 = [].indexOf;
var Connection2 = class {
  constructor(consumer4) {
    this.open = this.open.bind(this);
    this.consumer = consumer4;
    this.subscriptions = this.consumer.subscriptions;
    this.monitor = new ConnectionMonitor2(this);
    this.disconnected = true;
  }
  send(data) {
    if (this.isOpen()) {
      this.webSocket.send(JSON.stringify(data));
      return true;
    } else {
      return false;
    }
  }
  open() {
    if (this.isActive()) {
      logger.log(`Attempted to open WebSocket, but existing socket is ${this.getState()}`);
      return false;
    } else {
      const socketProtocols = [...protocols2, ...this.consumer.subprotocols || []];
      logger.log(`Opening WebSocket, current state is ${this.getState()}, subprotocols: ${socketProtocols}`);
      if (this.webSocket) {
        this.uninstallEventHandlers();
      }
      this.webSocket = new adapters.WebSocket(this.consumer.url, socketProtocols);
      this.installEventHandlers();
      this.monitor.start();
      return true;
    }
  }
  close({ allowReconnect } = {
    allowReconnect: true
  }) {
    if (!allowReconnect) {
      this.monitor.stop();
    }
    if (this.isOpen()) {
      return this.webSocket.close();
    }
  }
  reopen() {
    logger.log(`Reopening WebSocket, current state is ${this.getState()}`);
    if (this.isActive()) {
      try {
        return this.close();
      } catch (error3) {
        logger.log("Failed to reopen WebSocket", error3);
      } finally {
        logger.log(`Reopening WebSocket in ${this.constructor.reopenDelay}ms`);
        setTimeout(this.open, this.constructor.reopenDelay);
      }
    } else {
      return this.open();
    }
  }
  getProtocol() {
    if (this.webSocket) {
      return this.webSocket.protocol;
    }
  }
  isOpen() {
    return this.isState("open");
  }
  isActive() {
    return this.isState("open", "connecting");
  }
  triedToReconnect() {
    return this.monitor.reconnectAttempts > 0;
  }
  isProtocolSupported() {
    return indexOf2.call(supportedProtocols2, this.getProtocol()) >= 0;
  }
  isState(...states) {
    return indexOf2.call(states, this.getState()) >= 0;
  }
  getState() {
    if (this.webSocket) {
      for (let state in adapters.WebSocket) {
        if (adapters.WebSocket[state] === this.webSocket.readyState) {
          return state.toLowerCase();
        }
      }
    }
    return null;
  }
  installEventHandlers() {
    for (let eventName in this.events) {
      const handler = this.events[eventName].bind(this);
      this.webSocket[`on${eventName}`] = handler;
    }
  }
  uninstallEventHandlers() {
    for (let eventName in this.events) {
      this.webSocket[`on${eventName}`] = function() {
      };
    }
  }
};
Connection2.reopenDelay = 500;
Connection2.prototype.events = {
  message(event) {
    if (!this.isProtocolSupported()) {
      return;
    }
    const { identifier, message, reason, reconnect, type } = JSON.parse(event.data);
    this.monitor.recordMessage();
    switch (type) {
      case message_types2.welcome:
        if (this.triedToReconnect()) {
          this.reconnectAttempted = true;
        }
        this.monitor.recordConnect();
        return this.subscriptions.reload();
      case message_types2.disconnect:
        logger.log(`Disconnecting. Reason: ${reason}`);
        return this.close({
          allowReconnect: reconnect
        });
      case message_types2.ping:
        return null;
      case message_types2.confirmation:
        this.subscriptions.confirmSubscription(identifier);
        if (this.reconnectAttempted) {
          this.reconnectAttempted = false;
          return this.subscriptions.notify(identifier, "connected", {
            reconnected: true
          });
        } else {
          return this.subscriptions.notify(identifier, "connected", {
            reconnected: false
          });
        }
      case message_types2.rejection:
        return this.subscriptions.reject(identifier);
      default:
        return this.subscriptions.notify(identifier, "received", message);
    }
  },
  open() {
    logger.log(`WebSocket onopen event, using '${this.getProtocol()}' subprotocol`);
    this.disconnected = false;
    if (!this.isProtocolSupported()) {
      logger.log("Protocol is unsupported. Stopping monitor and disconnecting.");
      return this.close({
        allowReconnect: false
      });
    }
  },
  close(event) {
    logger.log("WebSocket onclose event");
    if (this.disconnected) {
      return;
    }
    this.disconnected = true;
    this.monitor.recordDisconnect();
    return this.subscriptions.notifyAll("disconnected", {
      willAttemptReconnect: this.monitor.isRunning()
    });
  },
  error() {
    logger.log("WebSocket onerror event");
  }
};
var extend3 = function(object, properties) {
  if (properties != null) {
    for (let key in properties) {
      const value = properties[key];
      object[key] = value;
    }
  }
  return object;
};
var Subscription2 = class {
  constructor(consumer4, params2 = {}, mixin) {
    this.consumer = consumer4;
    this.identifier = JSON.stringify(params2);
    extend3(this, mixin);
  }
  perform(action, data = {}) {
    data.action = action;
    return this.send(data);
  }
  send(data) {
    return this.consumer.send({
      command: "message",
      identifier: this.identifier,
      data: JSON.stringify(data)
    });
  }
  unsubscribe() {
    return this.consumer.subscriptions.remove(this);
  }
};
var SubscriptionGuarantor2 = class {
  constructor(subscriptions) {
    this.subscriptions = subscriptions;
    this.pendingSubscriptions = [];
  }
  guarantee(subscription2) {
    if (this.pendingSubscriptions.indexOf(subscription2) == -1) {
      logger.log(`SubscriptionGuarantor guaranteeing ${subscription2.identifier}`);
      this.pendingSubscriptions.push(subscription2);
    } else {
      logger.log(`SubscriptionGuarantor already guaranteeing ${subscription2.identifier}`);
    }
    this.startGuaranteeing();
  }
  forget(subscription2) {
    logger.log(`SubscriptionGuarantor forgetting ${subscription2.identifier}`);
    this.pendingSubscriptions = this.pendingSubscriptions.filter(((s) => s !== subscription2));
  }
  startGuaranteeing() {
    this.stopGuaranteeing();
    this.retrySubscribing();
  }
  stopGuaranteeing() {
    clearTimeout(this.retryTimeout);
  }
  retrySubscribing() {
    this.retryTimeout = setTimeout((() => {
      if (this.subscriptions && typeof this.subscriptions.subscribe === "function") {
        this.pendingSubscriptions.map(((subscription2) => {
          logger.log(`SubscriptionGuarantor resubscribing ${subscription2.identifier}`);
          this.subscriptions.subscribe(subscription2);
        }));
      }
    }), 500);
  }
};
var Subscriptions2 = class {
  constructor(consumer4) {
    this.consumer = consumer4;
    this.guarantor = new SubscriptionGuarantor2(this);
    this.subscriptions = [];
  }
  create(channelName, mixin) {
    const channel = channelName;
    const params2 = typeof channel === "object" ? channel : {
      channel
    };
    const subscription2 = new Subscription2(this.consumer, params2, mixin);
    return this.add(subscription2);
  }
  add(subscription2) {
    this.subscriptions.push(subscription2);
    this.consumer.ensureActiveConnection();
    this.notify(subscription2, "initialized");
    this.subscribe(subscription2);
    return subscription2;
  }
  remove(subscription2) {
    this.forget(subscription2);
    if (!this.findAll(subscription2.identifier).length) {
      this.sendCommand(subscription2, "unsubscribe");
    }
    return subscription2;
  }
  reject(identifier) {
    return this.findAll(identifier).map(((subscription2) => {
      this.forget(subscription2);
      this.notify(subscription2, "rejected");
      return subscription2;
    }));
  }
  forget(subscription2) {
    this.guarantor.forget(subscription2);
    this.subscriptions = this.subscriptions.filter(((s) => s !== subscription2));
    return subscription2;
  }
  findAll(identifier) {
    return this.subscriptions.filter(((s) => s.identifier === identifier));
  }
  reload() {
    return this.subscriptions.map(((subscription2) => this.subscribe(subscription2)));
  }
  notifyAll(callbackName, ...args) {
    return this.subscriptions.map(((subscription2) => this.notify(subscription2, callbackName, ...args)));
  }
  notify(subscription2, callbackName, ...args) {
    let subscriptions;
    if (typeof subscription2 === "string") {
      subscriptions = this.findAll(subscription2);
    } else {
      subscriptions = [subscription2];
    }
    return subscriptions.map(((subscription3) => typeof subscription3[callbackName] === "function" ? subscription3[callbackName](...args) : void 0));
  }
  subscribe(subscription2) {
    if (this.sendCommand(subscription2, "subscribe")) {
      this.guarantor.guarantee(subscription2);
    }
  }
  confirmSubscription(identifier) {
    logger.log(`Subscription confirmed ${identifier}`);
    this.findAll(identifier).map(((subscription2) => this.guarantor.forget(subscription2)));
  }
  sendCommand(subscription2, command) {
    const { identifier } = subscription2;
    return this.consumer.send({
      command,
      identifier
    });
  }
};
var Consumer2 = class {
  constructor(url) {
    this._url = url;
    this.subscriptions = new Subscriptions2(this);
    this.connection = new Connection2(this);
    this.subprotocols = [];
  }
  get url() {
    return createWebSocketURL2(this._url);
  }
  send(data) {
    return this.connection.send(data);
  }
  connect() {
    return this.connection.open();
  }
  disconnect() {
    return this.connection.close({
      allowReconnect: false
    });
  }
  ensureActiveConnection() {
    if (!this.connection.isActive()) {
      return this.connection.open();
    }
  }
  addSubProtocol(subprotocol) {
    this.subprotocols = [...this.subprotocols, subprotocol];
  }
};
function createWebSocketURL2(url) {
  if (typeof url === "function") {
    url = url();
  }
  if (url && !/^wss?:/i.test(url)) {
    const a = document.createElement("a");
    a.href = url;
    a.href = a.href;
    a.protocol = a.protocol.replace("http", "ws");
    return a.href;
  } else {
    return url;
  }
}
function createConsumer3(url = getConfig2("url") || INTERNAL.default_mount_path) {
  return new Consumer2(url);
}
function getConfig2(name3) {
  const element = document.head.querySelector(`meta[name='action-cable-${name3}']`);
  if (element) {
    return element.getAttribute("content");
  }
}

// node_modules/stimulus_reflex/dist/stimulus_reflex.js
var Toastify = class {
  defaults = {
    oldestFirst: true,
    text: "Toastify is awesome!",
    node: void 0,
    duration: 3e3,
    selector: void 0,
    callback: function() {
    },
    destination: void 0,
    newWindow: false,
    close: false,
    gravity: "toastify-top",
    positionLeft: false,
    position: "",
    backgroundColor: "",
    avatar: "",
    className: "",
    stopOnFocus: true,
    onClick: function() {
    },
    offset: {
      x: 0,
      y: 0
    },
    escapeMarkup: true,
    ariaLive: "polite",
    style: {
      background: ""
    }
  };
  constructor(options) {
    this.version = "1.12.0";
    this.options = {};
    this.toastElement = null;
    this._rootElement = document.body;
    this._init(options);
  }
  showToast() {
    this.toastElement = this._buildToast();
    if (typeof this.options.selector === "string") {
      this._rootElement = document.getElementById(this.options.selector);
    } else if (this.options.selector instanceof HTMLElement || this.options.selector instanceof ShadowRoot) {
      this._rootElement = this.options.selector;
    } else {
      this._rootElement = document.body;
    }
    if (!this._rootElement) {
      throw "Root element is not defined";
    }
    this._rootElement.insertBefore(this.toastElement, this._rootElement.firstChild);
    this._reposition();
    if (this.options.duration > 0) {
      this.toastElement.timeOutValue = window.setTimeout((() => {
        this._removeElement(this.toastElement);
      }), this.options.duration);
    }
    return this;
  }
  hideToast() {
    if (this.toastElement.timeOutValue) {
      clearTimeout(this.toastElement.timeOutValue);
    }
    this._removeElement(this.toastElement);
  }
  _init(options) {
    this.options = Object.assign(this.defaults, options);
    if (this.options.backgroundColor) {
      console.warn('DEPRECATION NOTICE: "backgroundColor" is being deprecated. Please use the "style.background" property.');
    }
    this.toastElement = null;
    this.options.gravity = options.gravity === "bottom" ? "toastify-bottom" : "toastify-top";
    this.options.stopOnFocus = options.stopOnFocus === void 0 ? true : options.stopOnFocus;
    if (options.backgroundColor) {
      this.options.style.background = options.backgroundColor;
    }
  }
  _buildToast() {
    if (!this.options) {
      throw "Toastify is not initialized";
    }
    let divElement = document.createElement("div");
    divElement.className = `toastify on ${this.options.className}`;
    divElement.className += ` toastify-${this.options.position}`;
    divElement.className += ` ${this.options.gravity}`;
    for (const property in this.options.style) {
      divElement.style[property] = this.options.style[property];
    }
    if (this.options.ariaLive) {
      divElement.setAttribute("aria-live", this.options.ariaLive);
    }
    if (this.options.node && this.options.node.nodeType === Node.ELEMENT_NODE) {
      divElement.appendChild(this.options.node);
    } else {
      if (this.options.escapeMarkup) {
        divElement.innerText = this.options.text;
      } else {
        divElement.innerHTML = this.options.text;
      }
      if (this.options.avatar !== "") {
        let avatarElement = document.createElement("img");
        avatarElement.src = this.options.avatar;
        avatarElement.className = "toastify-avatar";
        if (this.options.position == "left") {
          divElement.appendChild(avatarElement);
        } else {
          divElement.insertAdjacentElement("afterbegin", avatarElement);
        }
      }
    }
    if (this.options.close === true) {
      let closeElement = document.createElement("button");
      closeElement.type = "button";
      closeElement.setAttribute("aria-label", "Close");
      closeElement.className = "toast-close";
      closeElement.innerHTML = "&#10006;";
      closeElement.addEventListener("click", ((event) => {
        event.stopPropagation();
        this._removeElement(this.toastElement);
        window.clearTimeout(this.toastElement.timeOutValue);
      }));
      const width2 = window.innerWidth > 0 ? window.innerWidth : screen.width;
      if (this.options.position == "left" && width2 > 360) {
        divElement.insertAdjacentElement("afterbegin", closeElement);
      } else {
        divElement.appendChild(closeElement);
      }
    }
    if (this.options.stopOnFocus && this.options.duration > 0) {
      divElement.addEventListener("mouseover", ((event) => {
        window.clearTimeout(divElement.timeOutValue);
      }));
      divElement.addEventListener("mouseleave", (() => {
        divElement.timeOutValue = window.setTimeout((() => {
          this._removeElement(divElement);
        }), this.options.duration);
      }));
    }
    if (typeof this.options.destination !== "undefined") {
      divElement.addEventListener("click", ((event) => {
        event.stopPropagation();
        if (this.options.newWindow === true) {
          window.open(this.options.destination, "_blank");
        } else {
          window.location = this.options.destination;
        }
      }));
    }
    if (typeof this.options.onClick === "function" && typeof this.options.destination === "undefined") {
      divElement.addEventListener("click", ((event) => {
        event.stopPropagation();
        this.options.onClick();
      }));
    }
    if (typeof this.options.offset === "object") {
      const x = this._getAxisOffsetAValue("x", this.options);
      const y = this._getAxisOffsetAValue("y", this.options);
      const xOffset = this.options.position == "left" ? x : `-${x}`;
      const yOffset = this.options.gravity == "toastify-top" ? y : `-${y}`;
      divElement.style.transform = `translate(${xOffset},${yOffset})`;
    }
    return divElement;
  }
  _removeElement(toastElement) {
    toastElement.className = toastElement.className.replace(" on", "");
    window.setTimeout((() => {
      if (this.options.node && this.options.node.parentNode) {
        this.options.node.parentNode.removeChild(this.options.node);
      }
      if (toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }
      this.options.callback.call(toastElement);
      this._reposition();
    }), 400);
  }
  _reposition() {
    let topLeftOffsetSize = {
      top: 15,
      bottom: 15
    };
    let topRightOffsetSize = {
      top: 15,
      bottom: 15
    };
    let offsetSize = {
      top: 15,
      bottom: 15
    };
    let allToasts = this._rootElement.querySelectorAll(".toastify");
    let classUsed;
    for (let i = 0; i < allToasts.length; i++) {
      if (allToasts[i].classList.contains("toastify-top") === true) {
        classUsed = "toastify-top";
      } else {
        classUsed = "toastify-bottom";
      }
      let height2 = allToasts[i].offsetHeight;
      classUsed = classUsed.substr(9, classUsed.length - 1);
      let offset = 15;
      let width2 = window.innerWidth > 0 ? window.innerWidth : screen.width;
      if (width2 <= 360) {
        allToasts[i].style[classUsed] = `${offsetSize[classUsed]}px`;
        offsetSize[classUsed] += height2 + offset;
      } else {
        if (allToasts[i].classList.contains("toastify-left") === true) {
          allToasts[i].style[classUsed] = `${topLeftOffsetSize[classUsed]}px`;
          topLeftOffsetSize[classUsed] += height2 + offset;
        } else {
          allToasts[i].style[classUsed] = `${topRightOffsetSize[classUsed]}px`;
          topRightOffsetSize[classUsed] += height2 + offset;
        }
      }
    }
  }
  _getAxisOffsetAValue(axis, options) {
    if (options.offset[axis]) {
      if (isNaN(options.offset[axis])) {
        return options.offset[axis];
      } else {
        return `${options.offset[axis]}px`;
      }
    }
    return "0px";
  }
};
function StartToastifyInstance(options) {
  return new Toastify(options);
}
global.operations.stimulusReflexVersionMismatch = (operation) => {
  const levels = {
    info: {},
    success: {
      background: "#198754",
      color: "white"
    },
    warn: {
      background: "#ffc107",
      color: "black"
    },
    error: {
      background: "#dc3545",
      color: "white"
    }
  };
  const defaults = {
    selector: setupToastify(),
    close: true,
    duration: 30 * 1e3,
    gravity: "bottom",
    position: "right",
    newWindow: true,
    style: levels[operation.level || "info"]
  };
  StartToastifyInstance({
    ...defaults,
    ...operation
  }).showToast();
};
function setupToastify() {
  const id2 = "stimulus-reflex-toast-element";
  let element = document.querySelector(`#${id2}`);
  if (!element) {
    element = document.createElement("div");
    element.id = id2;
    document.documentElement.appendChild(element);
    const styles = document.createElement("style");
    styles.innerHTML = `
      #${id2} .toastify {
         padding: 12px 20px;
         color: #ffffff;
         display: inline-block;
         background: -webkit-linear-gradient(315deg, #73a5ff, #5477f5);
         background: linear-gradient(135deg, #73a5ff, #5477f5);
         position: fixed;
         opacity: 0;
         transition: all 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
         border-radius: 2px;
         cursor: pointer;
         text-decoration: none;
         max-width: calc(50% - 20px);
         z-index: 2147483647;
         bottom: -150px;
         right: 15px;
      }

      #${id2} .toastify.on {
        opacity: 1;
      }

      #${id2} .toast-close {
        background: transparent;
        border: 0;
        color: white;
        cursor: pointer;
        font-family: inherit;
        font-size: 1em;
        opacity: 0.4;
        padding: 0 5px;
      }
    `;
    document.head.appendChild(styles);
  }
  return element;
}
var deprecationWarnings = true;
var Deprecate = {
  get enabled() {
    return deprecationWarnings;
  },
  get disabled() {
    return !deprecationWarnings;
  },
  get value() {
    return deprecationWarnings;
  },
  set(value) {
    deprecationWarnings = !!value;
  },
  set deprecate(value) {
    deprecationWarnings = !!value;
  }
};
var debugging2 = false;
var Debug$1 = {
  get enabled() {
    return debugging2;
  },
  get disabled() {
    return !debugging2;
  },
  get value() {
    return debugging2;
  },
  set(value) {
    debugging2 = !!value;
  },
  set debug(value) {
    debugging2 = !!value;
  }
};
var defaultSchema2 = {
  reflexAttribute: "data-reflex",
  reflexPermanentAttribute: "data-reflex-permanent",
  reflexRootAttribute: "data-reflex-root",
  reflexSuppressLoggingAttribute: "data-reflex-suppress-logging",
  reflexDatasetAttribute: "data-reflex-dataset",
  reflexDatasetAllAttribute: "data-reflex-dataset-all",
  reflexSerializeFormAttribute: "data-reflex-serialize-form",
  reflexFormSelectorAttribute: "data-reflex-form-selector",
  reflexIncludeInnerHtmlAttribute: "data-reflex-include-inner-html",
  reflexIncludeTextContentAttribute: "data-reflex-include-text-content"
};
var schema = {};
var Schema = {
  set(application2) {
    schema = {
      ...defaultSchema2,
      ...application2.schema
    };
    for (const attribute in schema) {
      const attributeName = attribute.slice(0, -9);
      Object.defineProperty(this, attributeName, {
        get: () => schema[attribute],
        configurable: true
      });
    }
  }
};
var { debounce: debounce3, dispatch: dispatch3, xpathToElement: xpathToElement2, xpathToElementArray: xpathToElementArray2 } = utils;
var uuidv4 = () => {
  const crypto = window.crypto || window.msCrypto;
  return ("10000000-1000-4000-8000" + -1e11).replace(/[018]/g, ((c) => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
};
var serializeForm = (form, options = {}) => {
  if (!form) return "";
  const w = options.w || window;
  const { element } = options;
  const formData = new w.FormData(form);
  const data = Array.from(formData, ((e) => e.map(encodeURIComponent).join("=")));
  const submitButton = form.querySelector("input[type=submit]");
  if (element && element.name && element.nodeName === "INPUT" && element.type === "submit") {
    data.push(`${encodeURIComponent(element.name)}=${encodeURIComponent(element.value)}`);
  } else if (submitButton && submitButton.name) {
    data.push(`${encodeURIComponent(submitButton.name)}=${encodeURIComponent(submitButton.value)}`);
  }
  return Array.from(data).join("&");
};
var camelize2 = (value, uppercaseFirstLetter = true) => {
  if (typeof value !== "string") return "";
  value = value.replace(/[\s_](.)/g, (($1) => $1.toUpperCase())).replace(/[\s_]/g, "").replace(/^(.)/, (($1) => $1.toLowerCase()));
  if (uppercaseFirstLetter) value = value.substr(0, 1).toUpperCase() + value.substr(1);
  return value;
};
var XPathToElement = xpathToElement2;
var XPathToArray = xpathToElementArray2;
var emitEvent = (name3, detail = {}) => dispatch3(document, name3, detail);
var extractReflexName = (reflexString) => {
  const match = reflexString.match(/(?:.*->)?(.*?)(?:Reflex)?#/);
  return match ? match[1] : "";
};
var elementToXPath = (element) => {
  if (element.id !== "") return "//*[@id='" + element.id + "']";
  if (element === document.body) return "/html/body";
  if (element.nodeName === "HTML") return "/html";
  let ix = 0;
  const siblings = element && element.parentNode ? element.parentNode.childNodes : [];
  for (var i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      const computedPath = elementToXPath(element.parentNode);
      const tagName = element.tagName.toLowerCase();
      const ixInc = ix + 1;
      return `${computedPath}/${tagName}[${ixInc}]`;
    }
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
    }
  }
};
var elementInvalid = (element) => element.type === "number" && element.validity && element.validity.badInput;
var getReflexElement = (args, element) => args[0] && args[0].nodeType === Node.ELEMENT_NODE ? args.shift() : element;
var getReflexOptions = (args) => {
  const options = {};
  if (args[0] && typeof args[0] === "object" && Object.keys(args[0]).filter(((key) => ["id", "attrs", "selectors", "reflexId", "resolveLate", "serializeForm", "suppressLogging", "includeInnerHTML", "includeTextContent"].includes(key))).length) {
    const opts = args.shift();
    Object.keys(opts).forEach(((o) => {
      if (o === "reflexId") {
        if (Deprecate.enabled) console.warn("reflexId option will be removed in v4. Use id instead.");
        options["id"] = opts["reflexId"];
      } else options[o] = opts[o];
    }));
  }
  return options;
};
var getReflexRoots = (element) => {
  let list = [];
  while (list.length === 0 && element) {
    let reflexRoot = element.getAttribute(Schema.reflexRoot);
    if (reflexRoot) {
      if (reflexRoot.length === 0 && element.id) reflexRoot = `#${element.id}`;
      const selectors = reflexRoot.split(",").filter(((s) => s.trim().length));
      if (Debug$1.enabled && selectors.length === 0) {
        console.error(`No value found for ${Schema.reflexRoot}. Add an #id to the element or provide a value for ${Schema.reflexRoot}.`, element);
      }
      list = list.concat(selectors.filter(((s) => document.querySelector(s))));
    }
    element = element.parentElement ? element.parentElement.closest(`[${Schema.reflexRoot}]`) : null;
  }
  return list;
};
var reflexNameToControllerIdentifier = (reflexName) => reflexName.replace(/([a-z0–9])([A-Z])/g, "$1-$2").replace(/(::)/g, "--").replace(/-reflex$/gi, "").toLowerCase();
var stages = ["created", "before", "delivered", "queued", "after", "finalized", "success", "error", "halted", "forbidden"];
var lastReflex;
var reflexes = new Proxy({}, {
  get: function(target, prop) {
    if (stages.includes(prop)) return Object.fromEntries(Object.entries(target).filter((([_, reflex]) => reflex.stage === prop)));
    else if (prop === "last") return lastReflex;
    else if (prop === "all") return target;
    return Reflect.get(...arguments);
  },
  set: function(target, prop, value) {
    target[prop] = value;
    lastReflex = value;
    return true;
  }
});
var invokeLifecycleMethod = (reflex, stage) => {
  const specificLifecycleMethod = reflex.controller[["before", "after", "finalize"].includes(stage) ? `${stage}${camelize2(reflex.action)}` : `${camelize2(reflex.action, false)}${camelize2(stage)}`];
  const genericLifecycleMethod = reflex.controller[["before", "after", "finalize"].includes(stage) ? `${stage}Reflex` : `reflex${camelize2(stage)}`];
  if (typeof specificLifecycleMethod === "function") {
    specificLifecycleMethod.call(reflex.controller, reflex.element, reflex.target, reflex.error, reflex.id, reflex.payload);
  }
  if (typeof genericLifecycleMethod === "function") {
    genericLifecycleMethod.call(reflex.controller, reflex.element, reflex.target, reflex.error, reflex.id, reflex.payload);
  }
};
var dispatchLifecycleEvent = (reflex, stage) => {
  if (!reflex.controller.element.parentElement) {
    if (Debug$1.enabled && !reflex.warned) {
      console.warn(`StimulusReflex was not able execute callbacks or emit events for "${stage}" or later life-cycle stages for this Reflex. The StimulusReflex Controller Element is no longer present in the DOM. Could you move the StimulusReflex Controller to an element higher in your DOM?`);
      reflex.warned = true;
    }
    return;
  }
  reflex.stage = stage;
  reflex.lifecycle.push(stage);
  const event = `stimulus-reflex:${stage}`;
  const action = `${event}:${reflex.action}`;
  const detail = {
    reflex: reflex.target,
    controller: reflex.controller,
    id: reflex.id,
    element: reflex.element,
    payload: reflex.payload
  };
  const options = {
    bubbles: true,
    cancelable: false,
    detail
  };
  reflex.controller.element.dispatchEvent(new CustomEvent(event, options));
  reflex.controller.element.dispatchEvent(new CustomEvent(action, options));
  if (window.jQuery) {
    window.jQuery(reflex.controller.element).trigger(event, detail);
    window.jQuery(reflex.controller.element).trigger(action, detail);
  }
};
document.addEventListener("stimulus-reflex:before", ((event) => invokeLifecycleMethod(reflexes[event.detail.id], "before")), true);
document.addEventListener("stimulus-reflex:queued", ((event) => invokeLifecycleMethod(reflexes[event.detail.id], "queued")), true);
document.addEventListener("stimulus-reflex:delivered", ((event) => invokeLifecycleMethod(reflexes[event.detail.id], "delivered")), true);
document.addEventListener("stimulus-reflex:success", ((event) => {
  const reflex = reflexes[event.detail.id];
  invokeLifecycleMethod(reflex, "success");
  dispatchLifecycleEvent(reflex, "after");
}), true);
document.addEventListener("stimulus-reflex:nothing", ((event) => dispatchLifecycleEvent(reflexes[event.detail.id], "success")), true);
document.addEventListener("stimulus-reflex:error", ((event) => {
  const reflex = reflexes[event.detail.id];
  invokeLifecycleMethod(reflex, "error");
  dispatchLifecycleEvent(reflex, "after");
}), true);
document.addEventListener("stimulus-reflex:halted", ((event) => invokeLifecycleMethod(reflexes[event.detail.id], "halted")), true);
document.addEventListener("stimulus-reflex:forbidden", ((event) => invokeLifecycleMethod(reflexes[event.detail.id], "forbidden")), true);
document.addEventListener("stimulus-reflex:after", ((event) => invokeLifecycleMethod(reflexes[event.detail.id], "after")), true);
document.addEventListener("stimulus-reflex:finalize", ((event) => invokeLifecycleMethod(reflexes[event.detail.id], "finalize")), true);
var app = {};
var App = {
  get app() {
    return app;
  },
  set(application2) {
    app = application2;
  }
};
var isolationMode = false;
var IsolationMode = {
  get disabled() {
    return !isolationMode;
  },
  set(value) {
    isolationMode = value;
    if (Deprecate.enabled && !isolationMode) {
      document.addEventListener("DOMContentLoaded", (() => console.warn("Deprecation warning: the next version of StimulusReflex will standardize isolation mode, and the isolate option will be removed.\nPlease update your applications to assume that every tab will be isolated. Use CableReady operations to broadcast updates to other tabs and users.")), {
        once: true
      });
    }
  }
};
var Reflex = class {
  constructor(data, controller) {
    this.data = data.valueOf();
    this.controller = controller;
    this.element = data.reflexElement;
    this.id = data.id;
    this.error = null;
    this.payload = null;
    this.stage = "created";
    this.lifecycle = ["created"];
    this.warned = false;
    this.target = data.target;
    this.action = data.target.split("#")[1];
    this.selector = null;
    this.morph = null;
    this.operation = null;
    this.timestamp = /* @__PURE__ */ new Date();
    this.cloned = false;
  }
  get getPromise() {
    const promise = new Promise(((resolve, reject) => {
      this.promise = {
        resolve,
        reject,
        data: this.data
      };
    }));
    promise.id = this.id;
    Object.defineProperty(promise, "reflexId", {
      get() {
        if (Deprecate.enabled) console.warn("reflexId is deprecated and will be removed from v4. Use id instead.");
        return this.id;
      }
    });
    promise.reflex = this;
    if (Debug$1.enabled) promise.catch((() => {
    }));
    return promise;
  }
};
var received = (data) => {
  if (!data.cableReady) return;
  if (data.version.replace(".pre", "-pre").replace(".rc", "-rc") !== global.version) {
    const mismatch = `CableReady failed to execute your reflex action due to a version mismatch between your gem and JavaScript version. Package versions must match exactly.

cable_ready gem: ${data.version}
cable_ready npm: ${global.version}`;
    console.error(mismatch);
    if (Debug$1.enabled) {
      global.operations.stimulusReflexVersionMismatch({
        text: mismatch,
        level: "error"
      });
    }
    return;
  }
  let reflexOperations = [];
  for (let i = data.operations.length - 1; i >= 0; i--) {
    if (data.operations[i].stimulusReflex) {
      reflexOperations.push(data.operations[i]);
      data.operations.splice(i, 1);
    }
  }
  if (reflexOperations.some(((operation) => operation.stimulusReflex.url !== location.href))) {
    if (Debug$1.enabled) {
      console.error("Reflex failed due to mismatched URL.");
      return;
    }
  }
  let reflexData;
  if (reflexOperations.length) {
    reflexData = reflexOperations[0].stimulusReflex;
    reflexData.payload = reflexOperations[0].payload;
  }
  if (reflexData) {
    const { id: id2, payload } = reflexData;
    let reflex;
    if (!reflexes[id2] && IsolationMode.disabled) {
      const controllerElement = XPathToElement(reflexData.xpathController);
      const reflexElement = XPathToElement(reflexData.xpathElement);
      controllerElement.reflexController = controllerElement.reflexController || {};
      controllerElement.reflexData = controllerElement.reflexData || {};
      controllerElement.reflexError = controllerElement.reflexError || {};
      const controller = App.app.getControllerForElementAndIdentifier(controllerElement, reflexData.reflexController);
      controllerElement.reflexController[id2] = controller;
      controllerElement.reflexData[id2] = reflexData;
      reflex = new Reflex(reflexData, controller);
      reflexes[id2] = reflex;
      reflex.cloned = true;
      reflex.element = reflexElement;
      controller.lastReflex = reflex;
      dispatchLifecycleEvent(reflex, "before");
      reflex.getPromise;
    } else {
      reflex = reflexes[id2];
    }
    if (reflex) {
      reflex.payload = payload;
      reflex.totalOperations = reflexOperations.length;
      reflex.pendingOperations = reflexOperations.length;
      reflex.completedOperations = 0;
      reflex.piggybackOperations = data.operations;
      global.perform(reflexOperations);
    }
  } else {
    if (data.operations.length && reflexes[data.operations[0].reflexId]) {
      global.perform(data.operations);
    }
  }
};
var consumer3;
var params;
var subscription;
var active;
var initialize$1 = (consumerValue, paramsValue) => {
  consumer3 = consumerValue;
  params = paramsValue;
  document.addEventListener("DOMContentLoaded", (() => {
    active = false;
    connectionStatusClass();
    if (Deprecate.enabled && consumerValue) console.warn("Deprecation warning: the next version of StimulusReflex will obtain a reference to consumer via the Stimulus application object.\nPlease add 'application.consumer = consumer' to your index.js after your Stimulus application has been established, and remove the consumer key from your StimulusReflex initialize() options object.");
  }));
  document.addEventListener("turbolinks:load", connectionStatusClass);
  document.addEventListener("turbo:load", connectionStatusClass);
};
var subscribe = (controller) => {
  if (subscription) return;
  consumer3 = consumer3 || controller.application.consumer || createConsumer3();
  const { channel } = controller.StimulusReflex;
  const request3 = {
    channel,
    ...params
  };
  const identifier = JSON.stringify(request3);
  subscription = consumer3.subscriptions.findAll(identifier)[0] || consumer3.subscriptions.create(request3, {
    received,
    connected,
    rejected,
    disconnected
  });
};
var connected = () => {
  active = true;
  connectionStatusClass();
  emitEvent("stimulus-reflex:connected");
  Object.values(reflexes.queued).forEach(((reflex) => {
    subscription.send(reflex.data);
    dispatchLifecycleEvent(reflex, "delivered");
  }));
};
var rejected = () => {
  active = false;
  connectionStatusClass();
  emitEvent("stimulus-reflex:rejected");
  if (Debug.enabled) console.warn("Channel subscription was rejected.");
};
var disconnected = (willAttemptReconnect) => {
  active = false;
  connectionStatusClass();
  emitEvent("stimulus-reflex:disconnected", willAttemptReconnect);
};
var deliver = (reflex) => {
  if (active) {
    subscription.send(reflex.data);
    dispatchLifecycleEvent(reflex, "delivered");
  } else dispatchLifecycleEvent(reflex, "queued");
};
var connectionStatusClass = () => {
  const list = document.body.classList;
  if (!(list.contains("stimulus-reflex-connected") || list.contains("stimulus-reflex-disconnected"))) {
    list.add(active ? "stimulus-reflex-connected" : "stimulus-reflex-disconnected");
    return;
  }
  if (active) {
    list.replace("stimulus-reflex-disconnected", "stimulus-reflex-connected");
  } else {
    list.replace("stimulus-reflex-connected", "stimulus-reflex-disconnected");
  }
};
var ActionCableTransport = {
  subscribe,
  deliver,
  initialize: initialize$1
};
var request2 = (reflex) => {
  if (Debug$1.disabled || reflex.data.suppressLogging) return;
  console.log(`\u2191 stimulus \u2191 ${reflex.target}`, {
    id: reflex.id,
    args: reflex.data.args,
    controller: reflex.controller.identifier,
    element: reflex.element,
    controllerElement: reflex.controller.element
  });
};
var success = (reflex) => {
  if (Debug$1.disabled || reflex.data.suppressLogging) return;
  const output = {
    id: reflex.id,
    morph: reflex.morph,
    payload: reflex.payload
  };
  if (reflex.operation !== "dispatch_event") output.operation = reflex.operation;
  console.log(`\u2193 reflex \u2193 ${reflex.target} \u2192 ${reflex.selector || "\u221E"}${progress(reflex)} ${duration(reflex)}`, output);
};
var halted$1 = (reflex) => {
  if (Debug$1.disabled || reflex.data.suppressLogging) return;
  console.log(`\u2193 reflex \u2193 ${reflex.target} ${duration(reflex)} %cHALTED`, "color: #ffa500;", {
    id: reflex.id,
    payload: reflex.payload
  });
};
var forbidden$1 = (reflex) => {
  if (Debug$1.disabled || reflex.data.suppressLogging) return;
  console.log(`\u2193 reflex \u2193 ${reflex.target} ${duration(reflex)} %cFORBIDDEN`, "color: #BF40BF;", {
    id: reflex.id,
    payload: reflex.payload
  });
};
var error$1 = (reflex) => {
  if (Debug$1.disabled || reflex.data.suppressLogging) return;
  console.log(`\u2193 reflex \u2193 ${reflex.target} ${duration(reflex)} %cERROR: ${reflex.error}`, "color: #f00;", {
    id: reflex.id,
    payload: reflex.payload
  });
};
var duration = (reflex) => !reflex.cloned ? `in ${/* @__PURE__ */ new Date() - reflex.timestamp}ms` : "CLONED";
var progress = (reflex) => reflex.totalOperations > 1 ? ` ${reflex.completedOperations}/${reflex.totalOperations}` : "";
var Log2 = {
  request: request2,
  success,
  halted: halted$1,
  forbidden: forbidden$1,
  error: error$1
};
var multipleInstances = (element) => {
  if (["checkbox", "radio"].includes(element.type)) {
    return document.querySelectorAll(`input[type="${element.type}"][name="${element.name}"]`).length > 1;
  }
  return false;
};
var collectCheckedOptions = (element) => Array.from(element.querySelectorAll("option:checked")).concat(Array.from(document.querySelectorAll(`input[type="${element.type}"][name="${element.name}"]`)).filter(((elem) => elem.checked))).map(((o) => o.value));
var attributeValue = (values = []) => {
  const value = Array.from(new Set(values.filter(((v) => v && String(v).length)).map(((v) => v.trim())))).join(" ").trim();
  return value.length > 0 ? value : null;
};
var attributeValues = (value) => {
  if (!value) return [];
  if (!value.length) return [];
  return value.split(" ").filter(((v) => v.trim().length));
};
var extractElementAttributes = (element) => {
  let attrs = Array.from(element.attributes).reduce(((memo, attr) => {
    memo[attr.name] = attr.value;
    return memo;
  }), {});
  attrs.checked = !!element.checked;
  attrs.selected = !!element.selected;
  attrs.tag_name = element.tagName;
  if (element.tagName.match(/select/i) || multipleInstances(element)) {
    const collectedOptions = collectCheckedOptions(element);
    attrs.values = collectedOptions;
    attrs.value = collectedOptions.join(",");
  } else {
    attrs.value = element.value;
  }
  return attrs;
};
var getElementsFromTokens = (element, tokens) => {
  if (!tokens || tokens.length === 0) return [];
  let elements = [element];
  const xPath = elementToXPath(element);
  tokens.forEach(((token) => {
    try {
      switch (token) {
        case "combined":
          if (Deprecate.enabled) console.warn("In the next version of StimulusReflex, the 'combined' option to data-reflex-dataset will become 'ancestors'.");
          elements = [...elements, ...XPathToArray(`${xPath}/ancestor::*`, true)];
          break;
        case "ancestors":
          elements = [...elements, ...XPathToArray(`${xPath}/ancestor::*`, true)];
          break;
        case "parent":
          elements = [...elements, ...XPathToArray(`${xPath}/parent::*`)];
          break;
        case "siblings":
          elements = [...elements, ...XPathToArray(`${xPath}/preceding-sibling::*|${xPath}/following-sibling::*`)];
          break;
        case "children":
          elements = [...elements, ...XPathToArray(`${xPath}/child::*`)];
          break;
        case "descendants":
          elements = [...elements, ...XPathToArray(`${xPath}/descendant::*`)];
          break;
        default:
          elements = [...elements, ...document.querySelectorAll(token)];
      }
    } catch (error3) {
      if (Debug$1.enabled) console.error(error3);
    }
  }));
  return elements;
};
var extractElementDataset = (element) => {
  const dataset = element.attributes[Schema.reflexDataset];
  const allDataset = element.attributes[Schema.reflexDatasetAll];
  const tokens = dataset && dataset.value.split(" ") || [];
  const allTokens = allDataset && allDataset.value.split(" ") || [];
  const datasetElements = getElementsFromTokens(element, tokens);
  const datasetAllElements = getElementsFromTokens(element, allTokens);
  const datasetAttributes = datasetElements.reduce(((acc, ele) => ({
    ...extractDataAttributes(ele),
    ...acc
  })), {});
  const reflexElementAttributes = extractDataAttributes(element);
  const elementDataset = {
    dataset: {
      ...reflexElementAttributes,
      ...datasetAttributes
    },
    datasetAll: {}
  };
  datasetAllElements.forEach(((element2) => {
    const elementAttributes = extractDataAttributes(element2);
    Object.keys(elementAttributes).forEach(((key) => {
      const value = elementAttributes[key];
      if (elementDataset.datasetAll[key] && Array.isArray(elementDataset.datasetAll[key])) {
        elementDataset.datasetAll[key].push(value);
      } else {
        elementDataset.datasetAll[key] = [value];
      }
    }));
  }));
  return elementDataset;
};
var extractDataAttributes = (element) => {
  let attrs = {};
  if (element && element.attributes) {
    Array.from(element.attributes).forEach(((attr) => {
      if (attr.name.startsWith("data-")) {
        attrs[attr.name] = attr.value;
      }
    }));
  }
  return attrs;
};
var name2 = "stimulus_reflex";
var version2 = "3.5.5";
var description2 = "Build reactive applications with the Rails tooling you already know and love.";
var keywords2 = ["ruby", "rails", "websockets", "actioncable", "turbolinks", "reactive", "cable", "ujs", "ssr", "stimulus", "reflex", "stimulus_reflex", "dom", "morphdom"];
var homepage2 = "https://docs.stimulusreflex.com";
var bugs2 = "https://github.com/stimulusreflex/stimulus_reflex/issues";
var repository2 = "https://github.com/stimulusreflex/stimulus_reflex";
var license2 = "MIT";
var author2 = "Nathan Hopkins <natehop@gmail.com>";
var contributors2 = ["Andrew Mason <andrewmcodes@protonmail.com>", "Julian Rubisch <julian@julianrubisch.at>", "Marco Roth <marco.roth@intergga.ch>", "Nathan Hopkins <natehop@gmail.com>"];
var main2 = "./dist/stimulus_reflex.js";
var module2 = "./dist/stimulus_reflex.js";
var browser2 = "./dist/stimulus_reflex.js";
var unpkg2 = "./dist/stimulus_reflex.umd.js";
var umd2 = "./dist/stimulus_reflex.umd.js";
var files2 = ["dist/*", "javascript/*"];
var scripts2 = {
  lint: "yarn run format --check",
  format: "yarn run prettier-standard ./javascript/**/*.js rollup.config.mjs",
  build: "yarn rollup -c",
  "build:watch": "yarn rollup -wc",
  watch: "yarn build:watch",
  test: "web-test-runner javascript/test/**/*.test.js",
  "test:watch": "yarn test --watch",
  "docs:dev": "vitepress dev docs",
  "docs:build": "vitepress build docs && cp docs/_redirects docs/.vitepress/dist",
  "docs:preview": "vitepress preview docs"
};
var peerDependencies = {
  "@hotwired/stimulus": ">= 3.0"
};
var dependencies2 = {
  "@hotwired/stimulus": "^3",
  "@rails/actioncable": "^6 || ^7 || ^8",
  cable_ready: "^5.0.6"
};
var devDependencies2 = {
  "@open-wc/testing": "^4.0.0",
  "@rollup/plugin-json": "^6.1.0",
  "@rollup/plugin-node-resolve": "^15.3.0",
  "@rollup/plugin-terser": "^0.4.4",
  "@web/dev-server-esbuild": "^1.0.2",
  "@web/dev-server-rollup": "^0.6.4",
  "@web/test-runner": "^0.19.0",
  "prettier-standard": "^16.4.1",
  rollup: "^4.22.4",
  "toastify-js": "^1.12.0",
  vitepress: "^1.0.0-beta.1"
};
var packageInfo2 = {
  name: name2,
  version: version2,
  description: description2,
  keywords: keywords2,
  homepage: homepage2,
  bugs: bugs2,
  repository: repository2,
  license: license2,
  author: author2,
  contributors: contributors2,
  main: main2,
  module: module2,
  browser: browser2,
  import: "./dist/stimulus_reflex.js",
  unpkg: unpkg2,
  umd: umd2,
  files: files2,
  scripts: scripts2,
  peerDependencies,
  dependencies: dependencies2,
  devDependencies: devDependencies2
};
var ReflexData = class {
  constructor(options, reflexElement, controllerElement, reflexController, permanentAttributeName, target, args, url, tabId2) {
    this.options = options;
    this.reflexElement = reflexElement;
    this.controllerElement = controllerElement;
    this.reflexController = reflexController;
    this.permanentAttributeName = permanentAttributeName;
    this.target = target;
    this.args = args;
    this.url = url;
    this.tabId = tabId2;
  }
  get attrs() {
    this._attrs = this._attrs || this.options["attrs"] || extractElementAttributes(this.reflexElement);
    return this._attrs;
  }
  get id() {
    this._id = this._id || this.options["id"] || uuidv4();
    return this._id;
  }
  get selectors() {
    this._selectors = this._selectors || this.options["selectors"] || getReflexRoots(this.reflexElement);
    return typeof this._selectors === "string" ? [this._selectors] : this._selectors;
  }
  get resolveLate() {
    return this.options["resolveLate"] || false;
  }
  get dataset() {
    this._dataset = this._dataset || extractElementDataset(this.reflexElement);
    return this._dataset;
  }
  get innerHTML() {
    return this.includeInnerHtml ? this.reflexElement.innerHTML : "";
  }
  get textContent() {
    return this.includeTextContent ? this.reflexElement.textContent : "";
  }
  get xpathController() {
    return elementToXPath(this.controllerElement);
  }
  get xpathElement() {
    return elementToXPath(this.reflexElement);
  }
  get formSelector() {
    const attr = this.reflexElement.attributes[Schema.reflexFormSelector] ? this.reflexElement.attributes[Schema.reflexFormSelector].value : void 0;
    return this.options["formSelector"] || attr;
  }
  get includeInnerHtml() {
    const attr = this.reflexElement.attributes[Schema.reflexIncludeInnerHtml] || false;
    return this.options["includeInnerHTML"] || attr ? attr.value !== "false" : false;
  }
  get includeTextContent() {
    const attr = this.reflexElement.attributes[Schema.reflexIncludeTextContent] || false;
    return this.options["includeTextContent"] || attr ? attr.value !== "false" : false;
  }
  get suppressLogging() {
    return this.options["suppressLogging"] || this.reflexElement.attributes[Schema.reflexSuppressLogging] || false;
  }
  valueOf() {
    return {
      attrs: this.attrs,
      dataset: this.dataset,
      selectors: this.selectors,
      id: this.id,
      resolveLate: this.resolveLate,
      suppressLogging: this.suppressLogging,
      xpathController: this.xpathController,
      xpathElement: this.xpathElement,
      inner_html: this.innerHTML,
      text_content: this.textContent,
      formSelector: this.formSelector,
      reflexController: this.reflexController,
      permanentAttributeName: this.permanentAttributeName,
      target: this.target,
      args: this.args,
      url: this.url,
      tabId: this.tabId,
      version: packageInfo2.version
    };
  }
};
var transport = {};
var Transport = {
  get plugin() {
    return transport;
  },
  set(newTransport) {
    transport = newTransport;
  }
};
var beforeDOMUpdate = (event) => {
  const { stimulusReflex } = event.detail || {};
  if (!stimulusReflex) return;
  const reflex = reflexes[stimulusReflex.id];
  reflex.pendingOperations--;
  if (reflex.pendingOperations > 0) return;
  if (!stimulusReflex.resolveLate) setTimeout((() => reflex.promise.resolve({
    element: reflex.element,
    event,
    data: reflex.data,
    payload: reflex.payload,
    id: reflex.id,
    toString: () => ""
  })));
  setTimeout((() => dispatchLifecycleEvent(reflex, "success")));
};
var afterDOMUpdate = (event) => {
  const { stimulusReflex } = event.detail || {};
  if (!stimulusReflex) return;
  const reflex = reflexes[stimulusReflex.id];
  reflex.completedOperations++;
  reflex.selector = event.detail.selector;
  reflex.morph = event.detail.stimulusReflex.morph;
  reflex.operation = event.type.split(":")[1].split("-").slice(1).join("_");
  Log2.success(reflex);
  if (reflex.completedOperations < reflex.totalOperations) return;
  if (stimulusReflex.resolveLate) setTimeout((() => reflex.promise.resolve({
    element: reflex.element,
    event,
    data: reflex.data,
    payload: reflex.payload,
    id: reflex.id,
    toString: () => ""
  })));
  setTimeout((() => dispatchLifecycleEvent(reflex, "finalize")));
  if (reflex.piggybackOperations.length) global.perform(reflex.piggybackOperations);
};
var routeReflexEvent = (event) => {
  const { stimulusReflex, name: name3 } = event.detail || {};
  const eventType = name3.split("-")[2];
  const eventTypes = {
    nothing,
    halted,
    forbidden,
    error: error2
  };
  if (!stimulusReflex || !Object.keys(eventTypes).includes(eventType)) return;
  const reflex = reflexes[stimulusReflex.id];
  reflex.completedOperations++;
  reflex.pendingOperations--;
  reflex.selector = event.detail.selector;
  reflex.morph = event.detail.stimulusReflex.morph;
  reflex.operation = event.type.split(":")[1].split("-").slice(1).join("_");
  if (eventType === "error") reflex.error = event.detail.error;
  eventTypes[eventType](reflex, event);
  setTimeout((() => dispatchLifecycleEvent(reflex, eventType)));
  if (reflex.piggybackOperations.length) global.perform(reflex.piggybackOperations);
};
var nothing = (reflex, event) => {
  Log2.success(reflex);
  setTimeout((() => reflex.promise.resolve({
    data: reflex.data,
    element: reflex.element,
    event,
    payload: reflex.payload,
    id: reflex.id,
    toString: () => ""
  })));
};
var halted = (reflex, event) => {
  Log2.halted(reflex, event);
  setTimeout((() => reflex.promise.resolve({
    data: reflex.data,
    element: reflex.element,
    event,
    payload: reflex.payload,
    id: reflex.id,
    toString: () => ""
  })));
};
var forbidden = (reflex, event) => {
  Log2.forbidden(reflex, event);
  setTimeout((() => reflex.promise.resolve({
    data: reflex.data,
    element: reflex.element,
    event,
    payload: reflex.payload,
    id: reflex.id,
    toString: () => ""
  })));
};
var error2 = (reflex, event) => {
  Log2.error(reflex, event);
  setTimeout((() => reflex.promise.reject({
    data: reflex.data,
    element: reflex.element,
    event,
    payload: reflex.payload,
    id: reflex.id,
    error: reflex.error,
    toString: () => reflex.error
  })));
};
var localReflexControllers = (element) => {
  const potentialIdentifiers = attributeValues(element.getAttribute(Schema.controller));
  const potentialControllers = potentialIdentifiers.map(((identifier) => App.app.getControllerForElementAndIdentifier(element, identifier)));
  return potentialControllers.filter(((controller) => controller && controller.StimulusReflex));
};
var allReflexControllers = (element) => {
  let controllers = [];
  while (element) {
    controllers = controllers.concat(localReflexControllers(element));
    element = element.parentElement;
  }
  return controllers;
};
var findControllerByReflexName = (reflexName, controllers) => {
  const controller = controllers.find(((controller2) => {
    if (!controller2 || !controller2.identifier) return;
    const identifier = reflexNameToControllerIdentifier(extractReflexName(reflexName));
    return identifier === controller2.identifier;
  }));
  return controller;
};
var scanForReflexes = debounce3((() => {
  const reflexElements = document.querySelectorAll(`[${Schema.reflex}]`);
  reflexElements.forEach(((element) => scanForReflexesOnElement(element)));
}), 20);
var scanForReflexesOnElement = (element, controller = null) => {
  const controllerAttribute = element.getAttribute(Schema.controller);
  const controllers = attributeValues(controllerAttribute).filter(((controller2) => controller2 !== "stimulus-reflex"));
  const reflexAttribute = element.getAttribute(Schema.reflex);
  const reflexAttributeNames = attributeValues(reflexAttribute);
  const actionAttribute = element.getAttribute(Schema.action);
  const actions = attributeValues(actionAttribute).filter(((action) => !action.includes("#__perform")));
  reflexAttributeNames.forEach(((reflexName) => {
    const potentialControllers = [controller].concat(allReflexControllers(element));
    controller = findControllerByReflexName(reflexName, potentialControllers);
    const controllerName = controller ? controller.identifier : "stimulus-reflex";
    actions.push(`${reflexName.split("->")[0]}->${controllerName}#__perform`);
    const parentControllerElement = element.closest(`[data-controller~=${controllerName}]`);
    const elementPreviouslyHadStimulusReflexController = element === parentControllerElement && controllerName === "stimulus-reflex";
    if (!parentControllerElement || elementPreviouslyHadStimulusReflexController) {
      controllers.push(controllerName);
    }
  }));
  const controllerValue = attributeValue(controllers);
  const actionValue = attributeValue(actions);
  let emitReadyEvent = false;
  if (controllerValue && element.getAttribute(Schema.controller) != controllerValue) {
    element.setAttribute(Schema.controller, controllerValue);
    emitReadyEvent = true;
  }
  if (actionValue && element.getAttribute(Schema.action) != actionValue) {
    element.setAttribute(Schema.action, actionValue);
    emitReadyEvent = true;
  }
  if (emitReadyEvent) {
    dispatch3(element, "stimulus-reflex:ready", {
      reflex: reflexAttribute,
      controller: controllerValue,
      action: actionValue,
      element
    });
  }
};
var StimulusReflexController = class extends Controller {
  constructor(...args) {
    super(...args);
    register(this);
  }
};
var tabId = uuidv4();
var initialize2 = (application2, { controller, consumer: consumer4, debug, params: params2, isolate, deprecate, transport: transport2 } = {}) => {
  Transport.set(transport2 || ActionCableTransport);
  Transport.plugin.initialize(consumer4, params2);
  IsolationMode.set(!!isolate);
  App.set(application2);
  Schema.set(application2);
  App.app.register("stimulus-reflex", controller || StimulusReflexController);
  Debug$1.set(!!debug);
  if (typeof deprecate !== "undefined") Deprecate.set(deprecate);
  const observer = new MutationObserver(scanForReflexes);
  observer.observe(document.documentElement, {
    attributeFilter: [Schema.reflex, Schema.action],
    childList: true,
    subtree: true
  });
  emitEvent("stimulus-reflex:initialized");
};
var register = (controller, options = {}) => {
  const channel = "StimulusReflex::Channel";
  controller.StimulusReflex = {
    ...options,
    channel
  };
  Transport.plugin.subscribe(controller);
  Object.assign(controller, {
    stimulate() {
      const url = location.href;
      const controllerElement = this.element;
      const args = Array.from(arguments);
      const target = args.shift() || "StimulusReflex::Reflex#default_reflex";
      const reflexElement = getReflexElement(args, controllerElement);
      if (elementInvalid(reflexElement)) {
        if (Debug$1.enabled) console.warn("Reflex aborted: invalid numeric input");
        return;
      }
      const options2 = getReflexOptions(args);
      const reflexData = new ReflexData(options2, reflexElement, controllerElement, this.identifier, Schema.reflexPermanent, target, args, url, tabId);
      const id2 = reflexData.id;
      controllerElement.reflexController = controllerElement.reflexController || {};
      controllerElement.reflexData = controllerElement.reflexData || {};
      controllerElement.reflexError = controllerElement.reflexError || {};
      controllerElement.reflexController[id2] = this;
      controllerElement.reflexData[id2] = reflexData.valueOf();
      const reflex = new Reflex(reflexData, this);
      reflexes[id2] = reflex;
      this.lastReflex = reflex;
      dispatchLifecycleEvent(reflex, "before");
      setTimeout((() => {
        const { params: params2 } = controllerElement.reflexData[id2] || {};
        const check = reflexElement.attributes[Schema.reflexSerializeForm];
        if (check) {
          options2["serializeForm"] = check.value !== "false";
        }
        const form = reflexElement.closest(reflexData.formSelector) || document.querySelector(reflexData.formSelector) || reflexElement.closest("form");
        if (Deprecate.enabled && options2["serializeForm"] === void 0 && form) console.warn(`Deprecation warning: the next version of StimulusReflex will not serialize forms by default.
Please set ${Schema.reflexSerializeForm}="true" on your Reflex Controller Element or pass { serializeForm: true } as an option to stimulate.`);
        const formData = options2["serializeForm"] === false ? "" : serializeForm(form, {
          element: reflexElement
        });
        reflex.data = {
          ...reflexData.valueOf(),
          params: params2,
          formData
        };
        controllerElement.reflexData[id2] = reflex.data;
        Transport.plugin.deliver(reflex);
      }));
      Log2.request(reflex);
      return reflex.getPromise;
    },
    __perform(event) {
      let element = event.target;
      let reflex;
      while (element && !reflex) {
        reflex = element.getAttribute(Schema.reflex);
        if (!reflex || !reflex.trim().length) element = element.parentElement;
      }
      const match = attributeValues(reflex).find(((reflex2) => reflex2.split("->")[0] === event.type));
      if (match) {
        event.preventDefault();
        event.stopPropagation();
        this.stimulate(match.split("->")[1], element);
      }
    }
  });
  if (!controller.reflexes) Object.defineProperty(controller, "reflexes", {
    get() {
      return new Proxy(reflexes, {
        get: function(target, prop) {
          if (prop === "last") return this.lastReflex;
          return Object.fromEntries(Object.entries(target[prop]).filter((([_, reflex]) => reflex.controller === this)));
        }.bind(this)
      });
    }
  });
  scanForReflexesOnElement(controller.element, controller);
  emitEvent("stimulus-reflex:controller-registered", {
    detail: {
      controller
    }
  });
};
var useReflex = (controller, options = {}) => {
  register(controller, options);
};
document.addEventListener("cable-ready:after-dispatch-event", routeReflexEvent);
document.addEventListener("cable-ready:before-inner-html", beforeDOMUpdate);
document.addEventListener("cable-ready:before-morph", beforeDOMUpdate);
document.addEventListener("cable-ready:after-inner-html", afterDOMUpdate);
document.addEventListener("cable-ready:after-morph", afterDOMUpdate);
document.addEventListener("readystatechange", (() => {
  if (document.readyState === "complete") {
    scanForReflexes();
  }
}));
var StimulusReflex = Object.freeze({
  __proto__: null,
  StimulusReflexController,
  initialize: initialize2,
  reflexes,
  register,
  scanForReflexes,
  scanForReflexesOnElement,
  useReflex
});
var global2 = {
  version: packageInfo2.version,
  ...StimulusReflex,
  get debug() {
    return Debug$1.value;
  },
  set debug(value) {
    Debug$1.set(!!value);
  },
  get deprecate() {
    return Deprecate.value;
  },
  set deprecate(value) {
    Deprecate.set(!!value);
  }
};
window.StimulusReflex = global2;

// node_modules/@rails/actioncable/app/assets/javascripts/actioncable.esm.js
var adapters2 = {
  logger: typeof console !== "undefined" ? console : void 0,
  WebSocket: typeof WebSocket !== "undefined" ? WebSocket : void 0
};
var logger2 = {
  log(...messages) {
    if (this.enabled) {
      messages.push(Date.now());
      adapters2.logger.log("[ActionCable]", ...messages);
    }
  }
};
var now3 = () => (/* @__PURE__ */ new Date()).getTime();
var secondsSince3 = (time) => (now3() - time) / 1e3;
var ConnectionMonitor3 = class {
  constructor(connection) {
    this.visibilityDidChange = this.visibilityDidChange.bind(this);
    this.connection = connection;
    this.reconnectAttempts = 0;
  }
  start() {
    if (!this.isRunning()) {
      this.startedAt = now3();
      delete this.stoppedAt;
      this.startPolling();
      addEventListener("visibilitychange", this.visibilityDidChange);
      logger2.log(`ConnectionMonitor started. stale threshold = ${this.constructor.staleThreshold} s`);
    }
  }
  stop() {
    if (this.isRunning()) {
      this.stoppedAt = now3();
      this.stopPolling();
      removeEventListener("visibilitychange", this.visibilityDidChange);
      logger2.log("ConnectionMonitor stopped");
    }
  }
  isRunning() {
    return this.startedAt && !this.stoppedAt;
  }
  recordMessage() {
    this.pingedAt = now3();
  }
  recordConnect() {
    this.reconnectAttempts = 0;
    delete this.disconnectedAt;
    logger2.log("ConnectionMonitor recorded connect");
  }
  recordDisconnect() {
    this.disconnectedAt = now3();
    logger2.log("ConnectionMonitor recorded disconnect");
  }
  startPolling() {
    this.stopPolling();
    this.poll();
  }
  stopPolling() {
    clearTimeout(this.pollTimeout);
  }
  poll() {
    this.pollTimeout = setTimeout((() => {
      this.reconnectIfStale();
      this.poll();
    }), this.getPollInterval());
  }
  getPollInterval() {
    const { staleThreshold, reconnectionBackoffRate } = this.constructor;
    const backoff = Math.pow(1 + reconnectionBackoffRate, Math.min(this.reconnectAttempts, 10));
    const jitterMax = this.reconnectAttempts === 0 ? 1 : reconnectionBackoffRate;
    const jitter = jitterMax * Math.random();
    return staleThreshold * 1e3 * backoff * (1 + jitter);
  }
  reconnectIfStale() {
    if (this.connectionIsStale()) {
      logger2.log(`ConnectionMonitor detected stale connection. reconnectAttempts = ${this.reconnectAttempts}, time stale = ${secondsSince3(this.refreshedAt)} s, stale threshold = ${this.constructor.staleThreshold} s`);
      this.reconnectAttempts++;
      if (this.disconnectedRecently()) {
        logger2.log(`ConnectionMonitor skipping reopening recent disconnect. time disconnected = ${secondsSince3(this.disconnectedAt)} s`);
      } else {
        logger2.log("ConnectionMonitor reopening");
        this.connection.reopen();
      }
    }
  }
  get refreshedAt() {
    return this.pingedAt ? this.pingedAt : this.startedAt;
  }
  connectionIsStale() {
    return secondsSince3(this.refreshedAt) > this.constructor.staleThreshold;
  }
  disconnectedRecently() {
    return this.disconnectedAt && secondsSince3(this.disconnectedAt) < this.constructor.staleThreshold;
  }
  visibilityDidChange() {
    if (document.visibilityState === "visible") {
      setTimeout((() => {
        if (this.connectionIsStale() || !this.connection.isOpen()) {
          logger2.log(`ConnectionMonitor reopening stale connection on visibilitychange. visibilityState = ${document.visibilityState}`);
          this.connection.reopen();
        }
      }), 200);
    }
  }
};
ConnectionMonitor3.staleThreshold = 6;
ConnectionMonitor3.reconnectionBackoffRate = 0.15;
var INTERNAL2 = {
  message_types: {
    welcome: "welcome",
    disconnect: "disconnect",
    ping: "ping",
    confirmation: "confirm_subscription",
    rejection: "reject_subscription"
  },
  disconnect_reasons: {
    unauthorized: "unauthorized",
    invalid_request: "invalid_request",
    server_restart: "server_restart",
    remote: "remote"
  },
  default_mount_path: "/cable",
  protocols: ["actioncable-v1-json", "actioncable-unsupported"]
};
var { message_types: message_types3, protocols: protocols3 } = INTERNAL2;
var supportedProtocols3 = protocols3.slice(0, protocols3.length - 1);
var indexOf3 = [].indexOf;
var Connection3 = class {
  constructor(consumer4) {
    this.open = this.open.bind(this);
    this.consumer = consumer4;
    this.subscriptions = this.consumer.subscriptions;
    this.monitor = new ConnectionMonitor3(this);
    this.disconnected = true;
  }
  send(data) {
    if (this.isOpen()) {
      this.webSocket.send(JSON.stringify(data));
      return true;
    } else {
      return false;
    }
  }
  open() {
    if (this.isActive()) {
      logger2.log(`Attempted to open WebSocket, but existing socket is ${this.getState()}`);
      return false;
    } else {
      const socketProtocols = [...protocols3, ...this.consumer.subprotocols || []];
      logger2.log(`Opening WebSocket, current state is ${this.getState()}, subprotocols: ${socketProtocols}`);
      if (this.webSocket) {
        this.uninstallEventHandlers();
      }
      this.webSocket = new adapters2.WebSocket(this.consumer.url, socketProtocols);
      this.installEventHandlers();
      this.monitor.start();
      return true;
    }
  }
  close({ allowReconnect } = {
    allowReconnect: true
  }) {
    if (!allowReconnect) {
      this.monitor.stop();
    }
    if (this.isOpen()) {
      return this.webSocket.close();
    }
  }
  reopen() {
    logger2.log(`Reopening WebSocket, current state is ${this.getState()}`);
    if (this.isActive()) {
      try {
        return this.close();
      } catch (error3) {
        logger2.log("Failed to reopen WebSocket", error3);
      } finally {
        logger2.log(`Reopening WebSocket in ${this.constructor.reopenDelay}ms`);
        setTimeout(this.open, this.constructor.reopenDelay);
      }
    } else {
      return this.open();
    }
  }
  getProtocol() {
    if (this.webSocket) {
      return this.webSocket.protocol;
    }
  }
  isOpen() {
    return this.isState("open");
  }
  isActive() {
    return this.isState("open", "connecting");
  }
  triedToReconnect() {
    return this.monitor.reconnectAttempts > 0;
  }
  isProtocolSupported() {
    return indexOf3.call(supportedProtocols3, this.getProtocol()) >= 0;
  }
  isState(...states) {
    return indexOf3.call(states, this.getState()) >= 0;
  }
  getState() {
    if (this.webSocket) {
      for (let state in adapters2.WebSocket) {
        if (adapters2.WebSocket[state] === this.webSocket.readyState) {
          return state.toLowerCase();
        }
      }
    }
    return null;
  }
  installEventHandlers() {
    for (let eventName in this.events) {
      const handler = this.events[eventName].bind(this);
      this.webSocket[`on${eventName}`] = handler;
    }
  }
  uninstallEventHandlers() {
    for (let eventName in this.events) {
      this.webSocket[`on${eventName}`] = function() {
      };
    }
  }
};
Connection3.reopenDelay = 500;
Connection3.prototype.events = {
  message(event) {
    if (!this.isProtocolSupported()) {
      return;
    }
    const { identifier, message, reason, reconnect, type } = JSON.parse(event.data);
    this.monitor.recordMessage();
    switch (type) {
      case message_types3.welcome:
        if (this.triedToReconnect()) {
          this.reconnectAttempted = true;
        }
        this.monitor.recordConnect();
        return this.subscriptions.reload();
      case message_types3.disconnect:
        logger2.log(`Disconnecting. Reason: ${reason}`);
        return this.close({
          allowReconnect: reconnect
        });
      case message_types3.ping:
        return null;
      case message_types3.confirmation:
        this.subscriptions.confirmSubscription(identifier);
        if (this.reconnectAttempted) {
          this.reconnectAttempted = false;
          return this.subscriptions.notify(identifier, "connected", {
            reconnected: true
          });
        } else {
          return this.subscriptions.notify(identifier, "connected", {
            reconnected: false
          });
        }
      case message_types3.rejection:
        return this.subscriptions.reject(identifier);
      default:
        return this.subscriptions.notify(identifier, "received", message);
    }
  },
  open() {
    logger2.log(`WebSocket onopen event, using '${this.getProtocol()}' subprotocol`);
    this.disconnected = false;
    if (!this.isProtocolSupported()) {
      logger2.log("Protocol is unsupported. Stopping monitor and disconnecting.");
      return this.close({
        allowReconnect: false
      });
    }
  },
  close(event) {
    logger2.log("WebSocket onclose event");
    if (this.disconnected) {
      return;
    }
    this.disconnected = true;
    this.monitor.recordDisconnect();
    return this.subscriptions.notifyAll("disconnected", {
      willAttemptReconnect: this.monitor.isRunning()
    });
  },
  error() {
    logger2.log("WebSocket onerror event");
  }
};
var extend4 = function(object, properties) {
  if (properties != null) {
    for (let key in properties) {
      const value = properties[key];
      object[key] = value;
    }
  }
  return object;
};
var Subscription3 = class {
  constructor(consumer4, params2 = {}, mixin) {
    this.consumer = consumer4;
    this.identifier = JSON.stringify(params2);
    extend4(this, mixin);
  }
  perform(action, data = {}) {
    data.action = action;
    return this.send(data);
  }
  send(data) {
    return this.consumer.send({
      command: "message",
      identifier: this.identifier,
      data: JSON.stringify(data)
    });
  }
  unsubscribe() {
    return this.consumer.subscriptions.remove(this);
  }
};
var SubscriptionGuarantor3 = class {
  constructor(subscriptions) {
    this.subscriptions = subscriptions;
    this.pendingSubscriptions = [];
  }
  guarantee(subscription2) {
    if (this.pendingSubscriptions.indexOf(subscription2) == -1) {
      logger2.log(`SubscriptionGuarantor guaranteeing ${subscription2.identifier}`);
      this.pendingSubscriptions.push(subscription2);
    } else {
      logger2.log(`SubscriptionGuarantor already guaranteeing ${subscription2.identifier}`);
    }
    this.startGuaranteeing();
  }
  forget(subscription2) {
    logger2.log(`SubscriptionGuarantor forgetting ${subscription2.identifier}`);
    this.pendingSubscriptions = this.pendingSubscriptions.filter(((s) => s !== subscription2));
  }
  startGuaranteeing() {
    this.stopGuaranteeing();
    this.retrySubscribing();
  }
  stopGuaranteeing() {
    clearTimeout(this.retryTimeout);
  }
  retrySubscribing() {
    this.retryTimeout = setTimeout((() => {
      if (this.subscriptions && typeof this.subscriptions.subscribe === "function") {
        this.pendingSubscriptions.map(((subscription2) => {
          logger2.log(`SubscriptionGuarantor resubscribing ${subscription2.identifier}`);
          this.subscriptions.subscribe(subscription2);
        }));
      }
    }), 500);
  }
};
var Subscriptions3 = class {
  constructor(consumer4) {
    this.consumer = consumer4;
    this.guarantor = new SubscriptionGuarantor3(this);
    this.subscriptions = [];
  }
  create(channelName, mixin) {
    const channel = channelName;
    const params2 = typeof channel === "object" ? channel : {
      channel
    };
    const subscription2 = new Subscription3(this.consumer, params2, mixin);
    return this.add(subscription2);
  }
  add(subscription2) {
    this.subscriptions.push(subscription2);
    this.consumer.ensureActiveConnection();
    this.notify(subscription2, "initialized");
    this.subscribe(subscription2);
    return subscription2;
  }
  remove(subscription2) {
    this.forget(subscription2);
    if (!this.findAll(subscription2.identifier).length) {
      this.sendCommand(subscription2, "unsubscribe");
    }
    return subscription2;
  }
  reject(identifier) {
    return this.findAll(identifier).map(((subscription2) => {
      this.forget(subscription2);
      this.notify(subscription2, "rejected");
      return subscription2;
    }));
  }
  forget(subscription2) {
    this.guarantor.forget(subscription2);
    this.subscriptions = this.subscriptions.filter(((s) => s !== subscription2));
    return subscription2;
  }
  findAll(identifier) {
    return this.subscriptions.filter(((s) => s.identifier === identifier));
  }
  reload() {
    return this.subscriptions.map(((subscription2) => this.subscribe(subscription2)));
  }
  notifyAll(callbackName, ...args) {
    return this.subscriptions.map(((subscription2) => this.notify(subscription2, callbackName, ...args)));
  }
  notify(subscription2, callbackName, ...args) {
    let subscriptions;
    if (typeof subscription2 === "string") {
      subscriptions = this.findAll(subscription2);
    } else {
      subscriptions = [subscription2];
    }
    return subscriptions.map(((subscription3) => typeof subscription3[callbackName] === "function" ? subscription3[callbackName](...args) : void 0));
  }
  subscribe(subscription2) {
    if (this.sendCommand(subscription2, "subscribe")) {
      this.guarantor.guarantee(subscription2);
    }
  }
  confirmSubscription(identifier) {
    logger2.log(`Subscription confirmed ${identifier}`);
    this.findAll(identifier).map(((subscription2) => this.guarantor.forget(subscription2)));
  }
  sendCommand(subscription2, command) {
    const { identifier } = subscription2;
    return this.consumer.send({
      command,
      identifier
    });
  }
};
var Consumer3 = class {
  constructor(url) {
    this._url = url;
    this.subscriptions = new Subscriptions3(this);
    this.connection = new Connection3(this);
    this.subprotocols = [];
  }
  get url() {
    return createWebSocketURL3(this._url);
  }
  send(data) {
    return this.connection.send(data);
  }
  connect() {
    return this.connection.open();
  }
  disconnect() {
    return this.connection.close({
      allowReconnect: false
    });
  }
  ensureActiveConnection() {
    if (!this.connection.isActive()) {
      return this.connection.open();
    }
  }
  addSubProtocol(subprotocol) {
    this.subprotocols = [...this.subprotocols, subprotocol];
  }
};
function createWebSocketURL3(url) {
  if (typeof url === "function") {
    url = url();
  }
  if (url && !/^wss?:/i.test(url)) {
    const a = document.createElement("a");
    a.href = url;
    a.href = a.href;
    a.protocol = a.protocol.replace("http", "ws");
    return a.href;
  } else {
    return url;
  }
}
function createConsumer4(url = getConfig3("url") || INTERNAL2.default_mount_path) {
  return new Consumer3(url);
}
function getConfig3(name3) {
  const element = document.head.querySelector(`meta[name='action-cable-${name3}']`);
  if (element) {
    return element.getAttribute("content");
  }
}

// app/javascript/channels/consumer.js
var consumer_default = createConsumer4();

// app/javascript/controllers/application.js
var application = Application.start();
application.debug = false;
window.Stimulus = application;
global2.initialize(application, { consumer: consumer_default, debug: false });

// app/javascript/controllers/hello_controller.js
var hello_controller_default = class extends Controller {
  connect() {
    this.element.textContent = "Hello World!";
  }
};

// app/javascript/controllers/squad_controller.js
var squad_controller_default = class extends Controller {
  static targets = ["pool", "squad"];
  connect() {
    global2.register(this);
  }
  add(event) {
    const memberId = event.currentTarget.dataset.squadMemberId;
    const teamId = this.element.dataset.teamId;
    this.stimulate("SquadReflex#add_member", { member_id: memberId, team_id: teamId });
  }
  remove(event) {
    const teamMembershipId = event.currentTarget.dataset.squadTeamMembershipId;
    this.stimulate("SquadReflex#remove_member", { team_membership_id: teamMembershipId });
  }
};

// app/javascript/lib/google_maps_loader.js
var googleMapsPromise;
var DEFAULT_CENTER = { lat: -26.2041, lng: 28.0473 };
function loadGoogleMaps(apiKey) {
  if (!apiKey) {
    return Promise.reject(new Error("Missing Google Places API key"));
  }
  if (window.google && window.google.maps && window.google.maps.places) {
    return Promise.resolve(window.google);
  }
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      window.__easyClubGoogleInit = () => resolve(window.google);
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=__easyClubGoogleInit&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onerror = () => reject(new Error("Failed to load Google Maps script"));
      document.head.appendChild(script);
    });
  }
  return googleMapsPromise;
}

// app/javascript/controllers/location_picker_controller.js
var location_picker_controller_default = class extends Controller {
  static targets = [
    "searchInput",
    "map",
    "locationName",
    "addressLine1",
    "addressLine2",
    "city",
    "region",
    "postalCode",
    "country",
    "latitudeDisplay",
    "longitudeDisplay",
    "locationNameField",
    "addressLine1Field",
    "addressLine2Field",
    "cityField",
    "regionField",
    "postalCodeField",
    "countryField",
    "latitudeField",
    "longitudeField",
    "placeIdField",
    "useCurrentLocationButton",
    "statusMessage"
  ];
  static values = {
    apiKey: String,
    latitude: Number,
    longitude: Number,
    locationName: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    region: String,
    postalCode: String,
    country: String,
    placeId: String
  };
  connect() {
    if (!this.hasMapTarget) return;
    loadGoogleMaps(this.apiKeyValue).then((google) => {
      this.google = google;
      this.initializeMap();
      this.initializeAutocomplete();
      this.populateFieldsFromValues();
      this.setStatus("Search for a place or drag the marker to fine-tune.", "info");
      this.enableCurrentLocation();
    }).catch((error3) => {
      console.error("Location picker failed to initialise:", error3);
      this.setStatus("Map failed to load. Check your API key or reload the page.", "error");
    });
  }
  initializeMap() {
    const center = this.hasLatitudeValue && this.hasLongitudeValue ? { lat: this.latitudeValue, lng: this.longitudeValue } : DEFAULT_CENTER;
    this.map = new this.google.maps.Map(this.mapTarget, {
      center,
      zoom: this.hasLatitudeValue ? 14 : 5,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true
    });
    this.marker = new this.google.maps.Marker({
      position: center,
      map: this.map,
      draggable: true
    });
    this.google.maps.event.addListener(this.marker, "dragend", (event) => {
      this.updateLatLngFields(event.latLng.lat(), event.latLng.lng());
      this.setStatus("Marker moved. Coordinates updated.", "success");
    });
  }
  initializeAutocomplete() {
    if (!this.hasSearchInputTarget) return;
    const autocomplete = new this.google.maps.places.Autocomplete(this.searchInputTarget, {
      fields: ["place_id", "geometry", "name", "formatted_address", "address_components"],
      types: ["establishment", "geocode"]
    });
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        this.setStatus("Selected place has no map data. Try another search.", "error");
        return;
      }
      const location2 = place.geometry.location;
      this.map.panTo(location2);
      this.map.setZoom(17);
      this.marker.setPosition(location2);
      const addressComponents = this.extractAddressComponents(place.address_components || []);
      this.updateLocationFields({
        locationName: place.name || place.formatted_address || "",
        addressLine1: addressComponents.streetNumber && addressComponents.route ? `${addressComponents.streetNumber} ${addressComponents.route}` : addressComponents.route || place.formatted_address || "",
        addressLine2: addressComponents.sublocality || "",
        city: addressComponents.locality || addressComponents.administrativeAreaLevel2 || "",
        region: addressComponents.administrativeAreaLevel1 || "",
        postalCode: addressComponents.postalCode || "",
        country: addressComponents.country || "",
        placeId: place.place_id || ""
      });
      this.updateLatLngFields(location2.lat(), location2.lng());
      this.setStatus(`Location set to ${place.formatted_address || place.name}.`, "success");
    });
  }
  extractAddressComponents(components) {
    const result = {};
    components.forEach((component) => {
      if (component.types.includes("street_number")) {
        result.streetNumber = component.long_name;
      }
      if (component.types.includes("route")) {
        result.route = component.long_name;
      }
      if (component.types.includes("sublocality") || component.types.includes("sublocality_level_1")) {
        result.sublocality = component.long_name;
      }
      if (component.types.includes("locality")) {
        result.locality = component.long_name;
      }
      if (component.types.includes("administrative_area_level_2")) {
        result.administrativeAreaLevel2 = component.long_name;
      }
      if (component.types.includes("administrative_area_level_1")) {
        result.administrativeAreaLevel1 = component.long_name;
      }
      if (component.types.includes("postal_code")) {
        result.postalCode = component.long_name;
      }
      if (component.types.includes("country")) {
        result.country = component.long_name;
      }
    });
    return result;
  }
  populateFieldsFromValues() {
    this.updateDisplayValue(this.locationNameTarget, this.locationNameValue);
    this.updateDisplayValue(this.addressLine1Target, this.addressLine1Value);
    this.updateDisplayValue(this.addressLine2Target, this.addressLine2Value);
    this.updateDisplayValue(this.cityTarget, this.cityValue);
    this.updateDisplayValue(this.regionTarget, this.regionValue);
    this.updateDisplayValue(this.postalCodeTarget, this.postalCodeValue);
    this.updateDisplayValue(this.countryTarget, this.countryValue);
    this.updateHiddenValue(this.locationNameFieldTarget, this.locationNameValue);
    this.updateHiddenValue(this.addressLine1FieldTarget, this.addressLine1Value);
    this.updateHiddenValue(this.addressLine2FieldTarget, this.addressLine2Value);
    this.updateHiddenValue(this.cityFieldTarget, this.cityValue);
    this.updateHiddenValue(this.regionFieldTarget, this.regionValue);
    this.updateHiddenValue(this.postalCodeFieldTarget, this.postalCodeValue);
    this.updateHiddenValue(this.countryFieldTarget, this.countryValue);
    this.updateHiddenValue(this.placeIdFieldTarget, this.placeIdValue);
    if (this.hasLatitudeValue && this.hasLongitudeValue) {
      this.updateLatLngDisplay(this.latitudeValue, this.longitudeValue);
      this.updateHiddenValue(this.latitudeFieldTarget, this.latitudeValue);
      this.updateHiddenValue(this.longitudeFieldTarget, this.longitudeValue);
      this.setStatus(`Loaded saved location: ${this.locationNameValue || "latitude/longitude set"}`, "info");
    } else {
      this.setStatus("Search for a place or click \u201CUse current location\u201D.", "info");
    }
    if (this.hasLocationNameValue && this.hasSearchInputTarget) {
      this.searchInputTarget.value = this.locationNameValue;
    }
  }
  updateLocationFields(data) {
    const {
      locationName,
      addressLine1,
      addressLine2,
      city,
      region,
      postalCode,
      country,
      placeId
    } = data;
    this.updateDisplayValue(this.locationNameTarget, locationName);
    this.updateDisplayValue(this.addressLine1Target, addressLine1);
    this.updateDisplayValue(this.addressLine2Target, addressLine2);
    this.updateDisplayValue(this.cityTarget, city);
    this.updateDisplayValue(this.regionTarget, region);
    this.updateDisplayValue(this.postalCodeTarget, postalCode);
    this.updateDisplayValue(this.countryTarget, country);
    this.updateHiddenValue(this.locationNameFieldTarget, locationName);
    this.updateHiddenValue(this.addressLine1FieldTarget, addressLine1);
    this.updateHiddenValue(this.addressLine2FieldTarget, addressLine2);
    this.updateHiddenValue(this.cityFieldTarget, city);
    this.updateHiddenValue(this.regionFieldTarget, region);
    this.updateHiddenValue(this.postalCodeFieldTarget, postalCode);
    this.updateHiddenValue(this.countryFieldTarget, country);
    this.updateHiddenValue(this.placeIdFieldTarget, placeId);
  }
  updateLatLngFields(lat, lng) {
    this.updateLatLngDisplay(lat, lng);
    this.updateHiddenValue(this.latitudeFieldTarget, lat);
    this.updateHiddenValue(this.longitudeFieldTarget, lng);
  }
  updateLatLngDisplay(lat, lng) {
    this.updateDisplayValue(this.latitudeDisplayTarget, lat.toFixed(6));
    this.updateDisplayValue(this.longitudeDisplayTarget, lng.toFixed(6));
  }
  updateDisplayValue(element, value) {
    if (!element) return;
    element.value = value || "";
  }
  updateHiddenValue(element, value) {
    if (!element) return;
    element.value = value || "";
  }
  enableCurrentLocation() {
    if (!this.hasUseCurrentLocationButtonTarget) return;
    if (!navigator.geolocation) {
      this.useCurrentLocationButtonTarget.disabled = true;
      this.useCurrentLocationButtonTarget.title = "Geolocation not supported in this browser.";
      return;
    }
    this.useCurrentLocationButtonTarget.disabled = false;
  }
  useCurrentLocation() {
    if (!navigator.geolocation) {
      this.setStatus("Geolocation not supported. Try searching instead.", "error");
      return;
    }
    this.useCurrentLocationButtonTarget.disabled = true;
    this.setStatus("Retrieving your current position\u2026", "info");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location2 = { lat: latitude, lng: longitude };
        this.map.panTo(location2);
        this.map.setZoom(17);
        this.marker.setPosition(location2);
        this.updateLatLngFields(latitude, longitude);
        this.reverseGeocode(location2);
        this.setStatus("Location updated from your current position.", "success");
        this.useCurrentLocationButtonTarget.disabled = false;
      },
      (error3) => {
        console.warn("Geolocation error", error3);
        let message = "Could not fetch your current location.";
        if (error3.code === error3.PERMISSION_DENIED) {
          message = "Location permission denied. Please allow access or search manually.";
        } else if (error3.code === error3.TIMEOUT) {
          message = "Timed out getting your location. Try again.";
        }
        this.setStatus(message, "error");
        this.useCurrentLocationButtonTarget.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 1e4 }
    );
  }
  reverseGeocode(location2) {
    if (!this.google) return;
    const geocoder = new this.google.maps.Geocoder();
    geocoder.geocode({ location: location2 }, (results, status) => {
      if (status === "OK" && results && results.length > 0) {
        const place = results[0];
        const addressComponents = this.extractAddressComponents(place.address_components || []);
        this.updateLocationFields({
          locationName: place.formatted_address || "",
          addressLine1: addressComponents.streetNumber && addressComponents.route ? `${addressComponents.streetNumber} ${addressComponents.route}` : addressComponents.route || place.formatted_address || "",
          addressLine2: addressComponents.sublocality || "",
          city: addressComponents.locality || addressComponents.administrativeAreaLevel2 || "",
          region: addressComponents.administrativeAreaLevel1 || "",
          postalCode: addressComponents.postalCode || "",
          country: addressComponents.country || "",
          placeId: place.place_id || ""
        });
        if (this.hasSearchInputTarget) {
          this.searchInputTarget.value = place.formatted_address || "";
        }
      }
    });
  }
  setStatus(message, level = "info") {
    if (!this.hasStatusMessageTarget) return;
    const colourClass = {
      info: "text-slate-500",
      success: "text-emerald-600",
      error: "text-rose-600"
    }[level] || "text-slate-500";
    this.statusMessageTarget.textContent = message;
    this.statusMessageTarget.className = `text-xs ${colourClass}`;
  }
};

// app/javascript/controllers/clubs_map_controller.js
var clubs_map_controller_default = class extends Controller {
  static targets = ["map", "status", "locateButton"];
  static values = {
    apiKey: String,
    clubs: Array
  };
  connect() {
    if (!this.hasMapTarget) return;
    loadGoogleMaps(this.apiKeyValue).then((google) => {
      this.google = google;
      this.renderMap();
      this.enableLocate();
    }).catch((error3) => console.error("Failed to load public clubs map", error3));
  }
  renderMap() {
    const clubs = this.clubsValue || [];
    const hasLocations = clubs.some((club) => club.lat && club.lng);
    const primaryTarget = hasLocations ? { lat: clubs[0].lat, lng: clubs[0].lng } : DEFAULT_CENTER;
    this.map = new this.google.maps.Map(this.mapTarget, {
      center: primaryTarget,
      zoom: hasLocations ? 6 : 4
    });
    if (!hasLocations) return;
    const bounds = new this.google.maps.LatLngBounds();
    const singleClub = clubs.filter((club) => club.lat && club.lng).length === 1;
    let firstPosition = null;
    const infoWindow = new this.google.maps.InfoWindow();
    clubs.forEach((club) => {
      if (!club.lat || !club.lng) return;
      const position = { lat: club.lat, lng: club.lng };
      if (!firstPosition) firstPosition = position;
      const marker = new this.google.maps.Marker({
        position,
        map: this.map,
        title: club.name
      });
      const addressLines = [club.city].filter(Boolean);
      const logoMarkup = club.logo_url ? `<img src="${club.logo_url}" alt="${club.name} logo" class="h-12 w-12 flex-shrink-0 rounded object-cover" loading="lazy">` : "";
      const viewMarkup = club.url ? `<div class="w-full mt-2"><a href="${club.url}" class="w-full inline-flex items-center rounded bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white justify-center hover:bg-slate-800" target="_blank" rel="noopener">View</a></div>` : "";
      const content = `
        <div class="flex items-start gap-3 text-sm">
          ${logoMarkup}
          <div>
            <strong>${club.name}</strong><br>
            ${addressLines.join("<br>")}
          </div>
        </div>
        <div class="flex items-center">
          ${viewMarkup}
        </div>
      `;
      marker.addListener("click", () => {
        infoWindow.setContent(content);
        infoWindow.open(this.map, marker);
      });
      bounds.extend(position);
    });
    if (singleClub && firstPosition) {
      this.map.setCenter(firstPosition);
      this.map.setZoom(14);
    } else if (!bounds.isEmpty()) {
      this.map.fitBounds(bounds);
      const listener = this.google.maps.event.addListenerOnce(this.map, "bounds_changed", () => {
        const currentZoom = this.map.getZoom();
        if (currentZoom > 12) {
          this.map.setZoom(12);
        }
      });
    }
    this.updateStatus(hasLocations ? "Click a marker for details or use your current location." : "No club locations to display yet.", "info");
  }
  enableLocate() {
    if (!this.hasLocateButtonTarget) return;
    if (!navigator.geolocation) {
      this.locateButtonTarget.disabled = true;
      this.locateButtonTarget.title = "Geolocation not supported.";
      return;
    }
    this.locateButtonTarget.disabled = false;
  }
  locateMe() {
    if (!navigator.geolocation) return;
    this.updateStatus("Locating\u2026", "info");
    this.locateButtonTarget.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location2 = { lat: latitude, lng: longitude };
        this.map.panTo(location2);
        this.map.setZoom(14);
        new this.google.maps.Circle({
          strokeColor: "#3b82f6",
          strokeOpacity: 0.6,
          strokeWeight: 1,
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          map: this.map,
          center: location2,
          radius: Math.min(position.coords.accuracy || 1e3, 5e3)
        });
        this.updateStatus("Showing clubs near your current position.", "success");
        this.locateButtonTarget.disabled = false;
      },
      (error3) => {
        console.warn("Geolocation error", error3);
        let message = "Unable to get your location.";
        if (error3.code === error3.PERMISSION_DENIED) {
          message = "Location permission denied. Allow access to centre the map.";
        }
        this.updateStatus(message, "error");
        this.locateButtonTarget.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 1e4 }
    );
  }
  updateStatus(message, level = "info") {
    if (!this.hasStatusTarget) return;
    const colour = {
      info: "text-slate-500",
      success: "text-emerald-600",
      error: "text-rose-600"
    }[level] || "text-slate-500";
    this.statusTarget.textContent = message;
    this.statusTarget.className = `text-xs ${colour}`;
  }
};

// node_modules/just-extend/index.esm.js
var objectExtend = extend5;
function extend5() {
  var args = [].slice.call(arguments);
  var deep = false;
  if (typeof args[0] == "boolean") {
    deep = args.shift();
  }
  var result = args[0];
  if (isUnextendable(result)) {
    throw new Error("extendee must be an object");
  }
  var extenders = args.slice(1);
  var len = extenders.length;
  for (var i = 0; i < len; i++) {
    var extender = extenders[i];
    for (var key in extender) {
      if (Object.prototype.hasOwnProperty.call(extender, key)) {
        var value = extender[key];
        if (deep && isCloneable(value)) {
          var base = Array.isArray(value) ? [] : {};
          result[key] = extend5(
            true,
            Object.prototype.hasOwnProperty.call(result, key) && !isUnextendable(result[key]) ? result[key] : base,
            value
          );
        } else {
          result[key] = value;
        }
      }
    }
  }
  return result;
}
function isCloneable(obj) {
  return Array.isArray(obj) || {}.toString.call(obj) == "[object Object]";
}
function isUnextendable(val) {
  return !val || typeof val != "object" && typeof val != "function";
}

// node_modules/dropzone/dist/dropzone.mjs
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
var $4040acfd8584338d$export$2e2bcd8739ae039 = class {
  // Add an event listener for given event
  on(event, fn) {
    this._callbacks = this._callbacks || {};
    if (!this._callbacks[event]) this._callbacks[event] = [];
    this._callbacks[event].push(fn);
    return this;
  }
  emit(event, ...args) {
    this._callbacks = this._callbacks || {};
    let callbacks = this._callbacks[event];
    if (callbacks) for (let callback of callbacks) callback.apply(this, args);
    if (this.element) this.element.dispatchEvent(this.makeEvent("dropzone:" + event, {
      args
    }));
    return this;
  }
  makeEvent(eventName, detail) {
    let params2 = {
      bubbles: true,
      cancelable: true,
      detail
    };
    if (typeof window.CustomEvent === "function") return new CustomEvent(eventName, params2);
    else {
      var evt = document.createEvent("CustomEvent");
      evt.initCustomEvent(eventName, params2.bubbles, params2.cancelable, params2.detail);
      return evt;
    }
  }
  // Remove event listener for given event. If fn is not provided, all event
  // listeners for that event will be removed. If neither is provided, all
  // event listeners will be removed.
  off(event, fn) {
    if (!this._callbacks || arguments.length === 0) {
      this._callbacks = {};
      return this;
    }
    let callbacks = this._callbacks[event];
    if (!callbacks) return this;
    if (arguments.length === 1) {
      delete this._callbacks[event];
      return this;
    }
    for (let i = 0; i < callbacks.length; i++) {
      let callback = callbacks[i];
      if (callback === fn) {
        callbacks.splice(i, 1);
        break;
      }
    }
    return this;
  }
};
var $fd6031f88dce2e32$exports = {};
$fd6031f88dce2e32$exports = '<div class="dz-preview dz-file-preview">\n  <div class="dz-image"><img data-dz-thumbnail=""></div>\n  <div class="dz-details">\n    <div class="dz-size"><span data-dz-size=""></span></div>\n    <div class="dz-filename"><span data-dz-name=""></span></div>\n  </div>\n  <div class="dz-progress">\n    <span class="dz-upload" data-dz-uploadprogress=""></span>\n  </div>\n  <div class="dz-error-message"><span data-dz-errormessage=""></span></div>\n  <div class="dz-success-mark">\n    <svg width="54" height="54" viewBox="0 0 54 54" fill="white" xmlns="http://www.w3.org/2000/svg">\n      <path d="M10.2071 29.7929L14.2929 25.7071C14.6834 25.3166 15.3166 25.3166 15.7071 25.7071L21.2929 31.2929C21.6834 31.6834 22.3166 31.6834 22.7071 31.2929L38.2929 15.7071C38.6834 15.3166 39.3166 15.3166 39.7071 15.7071L43.7929 19.7929C44.1834 20.1834 44.1834 20.8166 43.7929 21.2071L22.7071 42.2929C22.3166 42.6834 21.6834 42.6834 21.2929 42.2929L10.2071 31.2071C9.81658 30.8166 9.81658 30.1834 10.2071 29.7929Z"></path>\n    </svg>\n  </div>\n  <div class="dz-error-mark">\n    <svg width="54" height="54" viewBox="0 0 54 54" fill="white" xmlns="http://www.w3.org/2000/svg">\n      <path d="M26.2929 20.2929L19.2071 13.2071C18.8166 12.8166 18.1834 12.8166 17.7929 13.2071L13.2071 17.7929C12.8166 18.1834 12.8166 18.8166 13.2071 19.2071L20.2929 26.2929C20.6834 26.6834 20.6834 27.3166 20.2929 27.7071L13.2071 34.7929C12.8166 35.1834 12.8166 35.8166 13.2071 36.2071L17.7929 40.7929C18.1834 41.1834 18.8166 41.1834 19.2071 40.7929L26.2929 33.7071C26.6834 33.3166 27.3166 33.3166 27.7071 33.7071L34.7929 40.7929C35.1834 41.1834 35.8166 41.1834 36.2071 40.7929L40.7929 36.2071C41.1834 35.8166 41.1834 35.1834 40.7929 34.7929L33.7071 27.7071C33.3166 27.3166 33.3166 26.6834 33.7071 26.2929L40.7929 19.2071C41.1834 18.8166 41.1834 18.1834 40.7929 17.7929L36.2071 13.2071C35.8166 12.8166 35.1834 12.8166 34.7929 13.2071L27.7071 20.2929C27.3166 20.6834 26.6834 20.6834 26.2929 20.2929Z"></path>\n    </svg>\n  </div>\n</div>\n';
var $4ca367182776f80b$var$defaultOptions = {
  /**
  * Has to be specified on elements other than form (or when the form doesn't
  * have an `action` attribute).
  *
  * You can also provide a function that will be called with `files` and
  * `dataBlocks`  and must return the url as string.
  */
  url: null,
  /**
  * Can be changed to `"put"` if necessary. You can also provide a function
  * that will be called with `files` and must return the method (since `v3.12.0`).
  */
  method: "post",
  /**
  * Will be set on the XHRequest.
  */
  withCredentials: false,
  /**
  * The timeout for the XHR requests in milliseconds (since `v4.4.0`).
  * If set to null or 0, no timeout is going to be set.
  */
  timeout: null,
  /**
  * How many file uploads to process in parallel (See the
  * Enqueuing file uploads documentation section for more info)
  */
  parallelUploads: 2,
  /**
  * Whether to send multiple files in one request. If
  * this it set to true, then the fallback file input element will
  * have the `multiple` attribute as well. This option will
  * also trigger additional events (like `processingmultiple`). See the events
  * documentation section for more information.
  */
  uploadMultiple: false,
  /**
  * Whether you want files to be uploaded in chunks to your server. This can't be
  * used in combination with `uploadMultiple`.
  *
  * See [chunksUploaded](#config-chunksUploaded) for the callback to finalise an upload.
  */
  chunking: false,
  /**
  * If `chunking` is enabled, this defines whether **every** file should be chunked,
  * even if the file size is below chunkSize. This means, that the additional chunk
  * form data will be submitted and the `chunksUploaded` callback will be invoked.
  */
  forceChunking: false,
  /**
  * If `chunking` is `true`, then this defines the chunk size in bytes.
  */
  chunkSize: 2097152,
  /**
  * If `true`, the individual chunks of a file are being uploaded simultaneously.
  */
  parallelChunkUploads: false,
  /**
  * Whether a chunk should be retried if it fails.
  */
  retryChunks: false,
  /**
  * If `retryChunks` is true, how many times should it be retried.
  */
  retryChunksLimit: 3,
  /**
  * The maximum filesize (in MiB) that is allowed to be uploaded.
  */
  maxFilesize: 256,
  /**
  * The name of the file param that gets transferred.
  * **NOTE**: If you have the option  `uploadMultiple` set to `true`, then
  * Dropzone will append `[]` to the name.
  */
  paramName: "file",
  /**
  * Whether thumbnails for images should be generated
  */
  createImageThumbnails: true,
  /**
  * In MB. When the filename exceeds this limit, the thumbnail will not be generated.
  */
  maxThumbnailFilesize: 10,
  /**
  * If `null`, the ratio of the image will be used to calculate it.
  */
  thumbnailWidth: 120,
  /**
  * The same as `thumbnailWidth`. If both are null, images will not be resized.
  */
  thumbnailHeight: 120,
  /**
  * How the images should be scaled down in case both, `thumbnailWidth` and `thumbnailHeight` are provided.
  * Can be either `contain` or `crop`.
  */
  thumbnailMethod: "crop",
  /**
  * If set, images will be resized to these dimensions before being **uploaded**.
  * If only one, `resizeWidth` **or** `resizeHeight` is provided, the original aspect
  * ratio of the file will be preserved.
  *
  * The `options.transformFile` function uses these options, so if the `transformFile` function
  * is overridden, these options don't do anything.
  */
  resizeWidth: null,
  /**
  * See `resizeWidth`.
  */
  resizeHeight: null,
  /**
  * The mime type of the resized image (before it gets uploaded to the server).
  * If `null` the original mime type will be used. To force jpeg, for example, use `image/jpeg`.
  * See `resizeWidth` for more information.
  */
  resizeMimeType: null,
  /**
  * The quality of the resized images. See `resizeWidth`.
  */
  resizeQuality: 0.8,
  /**
  * How the images should be scaled down in case both, `resizeWidth` and `resizeHeight` are provided.
  * Can be either `contain` or `crop`.
  */
  resizeMethod: "contain",
  /**
  * The base that is used to calculate the **displayed** filesize. You can
  * change this to 1024 if you would rather display kibibytes, mebibytes,
  * etc... 1024 is technically incorrect, because `1024 bytes` are `1 kibibyte`
  * not `1 kilobyte`. You can change this to `1024` if you don't care about
  * validity.
  */
  filesizeBase: 1e3,
  /**
  * If not `null` defines how many files this Dropzone handles. If it exceeds,
  * the event `maxfilesexceeded` will be called. The dropzone element gets the
  * class `dz-max-files-reached` accordingly so you can provide visual
  * feedback.
  */
  maxFiles: null,
  /**
  * An optional object to send additional headers to the server. Eg:
  * `{ "My-Awesome-Header": "header value" }`
  */
  headers: null,
  /**
  * Should the default headers be set or not?
  * Accept: application/json <- for requesting json response
  * Cache-Control: no-cache <- Request shouldnt be cached
  * X-Requested-With: XMLHttpRequest <- We sent the request via XMLHttpRequest
  */
  defaultHeaders: true,
  /**
  * If `true`, the dropzone element itself will be clickable, if `false`
  * nothing will be clickable.
  *
  * You can also pass an HTML element, a CSS selector (for multiple elements)
  * or an array of those. In that case, all of those elements will trigger an
  * upload when clicked.
  */
  clickable: true,
  /**
  * Whether hidden files in directories should be ignored.
  */
  ignoreHiddenFiles: true,
  /**
  * The default implementation of `accept` checks the file's mime type or
  * extension against this list. This is a comma separated list of mime
  * types or file extensions.
  *
  * Eg.: `image/*,application/pdf,.psd`
  *
  * If the Dropzone is `clickable` this option will also be used as
  * [`accept`](https://developer.mozilla.org/en-US/docs/HTML/Element/input#attr-accept)
  * parameter on the hidden file input as well.
  */
  acceptedFiles: null,
  /**
  * **Deprecated!**
  * Use acceptedFiles instead.
  */
  acceptedMimeTypes: null,
  /**
  * If false, files will be added to the queue but the queue will not be
  * processed automatically.
  * This can be useful if you need some additional user input before sending
  * files (or if you want want all files sent at once).
  * If you're ready to send the file simply call `myDropzone.processQueue()`.
  *
  * See the [enqueuing file uploads](#enqueuing-file-uploads) documentation
  * section for more information.
  */
  autoProcessQueue: true,
  /**
  * If false, files added to the dropzone will not be queued by default.
  * You'll have to call `enqueueFile(file)` manually.
  */
  autoQueue: true,
  /**
  * If `true`, this will add a link to every file preview to remove or cancel (if
  * already uploading) the file. The `dictCancelUpload`, `dictCancelUploadConfirmation`
  * and `dictRemoveFile` options are used for the wording.
  */
  addRemoveLinks: false,
  /**
  * Defines where to display the file previews – if `null` the
  * Dropzone element itself is used. Can be a plain `HTMLElement` or a CSS
  * selector. The element should have the `dropzone-previews` class so
  * the previews are displayed properly.
  */
  previewsContainer: null,
  /**
  * Set this to `true` if you don't want previews to be shown.
  */
  disablePreviews: false,
  /**
  * This is the element the hidden input field (which is used when clicking on the
  * dropzone to trigger file selection) will be appended to. This might
  * be important in case you use frameworks to switch the content of your page.
  *
  * Can be a selector string, or an element directly.
  */
  hiddenInputContainer: "body",
  /**
  * If null, no capture type will be specified
  * If camera, mobile devices will skip the file selection and choose camera
  * If microphone, mobile devices will skip the file selection and choose the microphone
  * If camcorder, mobile devices will skip the file selection and choose the camera in video mode
  * On apple devices multiple must be set to false.  AcceptedFiles may need to
  * be set to an appropriate mime type (e.g. "image/*", "audio/*", or "video/*").
  */
  capture: null,
  /**
  * **Deprecated**. Use `renameFile` instead.
  */
  renameFilename: null,
  /**
  * A function that is invoked before the file is uploaded to the server and renames the file.
  * This function gets the `File` as argument and can use the `file.name`. The actual name of the
  * file that gets used during the upload can be accessed through `file.upload.filename`.
  */
  renameFile: null,
  /**
  * If `true` the fallback will be forced. This is very useful to test your server
  * implementations first and make sure that everything works as
  * expected without dropzone if you experience problems, and to test
  * how your fallbacks will look.
  */
  forceFallback: false,
  /**
  * The text used before any files are dropped.
  */
  dictDefaultMessage: "Drop files here to upload",
  /**
  * The text that replaces the default message text it the browser is not supported.
  */
  dictFallbackMessage: "Your browser does not support drag'n'drop file uploads.",
  /**
  * The text that will be added before the fallback form.
  * If you provide a  fallback element yourself, or if this option is `null` this will
  * be ignored.
  */
  dictFallbackText: "Please use the fallback form below to upload your files like in the olden days.",
  /**
  * If the filesize is too big.
  * `{{filesize}}` and `{{maxFilesize}}` will be replaced with the respective configuration values.
  */
  dictFileTooBig: "File is too big ({{filesize}}MiB). Max filesize: {{maxFilesize}}MiB.",
  /**
  * If the file doesn't match the file type.
  */
  dictInvalidFileType: "You can't upload files of this type.",
  /**
  * If the server response was invalid.
  * `{{statusCode}}` will be replaced with the servers status code.
  */
  dictResponseError: "Server responded with {{statusCode}} code.",
  /**
  * If `addRemoveLinks` is true, the text to be used for the cancel upload link.
  */
  dictCancelUpload: "Cancel upload",
  /**
  * The text that is displayed if an upload was manually canceled
  */
  dictUploadCanceled: "Upload canceled.",
  /**
  * If `addRemoveLinks` is true, the text to be used for confirmation when cancelling upload.
  */
  dictCancelUploadConfirmation: "Are you sure you want to cancel this upload?",
  /**
  * If `addRemoveLinks` is true, the text to be used to remove a file.
  */
  dictRemoveFile: "Remove file",
  /**
  * If this is not null, then the user will be prompted before removing a file.
  */
  dictRemoveFileConfirmation: null,
  /**
  * Displayed if `maxFiles` is st and exceeded.
  * The string `{{maxFiles}}` will be replaced by the configuration value.
  */
  dictMaxFilesExceeded: "You can not upload any more files.",
  /**
  * Allows you to translate the different units. Starting with `tb` for terabytes and going down to
  * `b` for bytes.
  */
  dictFileSizeUnits: {
    tb: "TB",
    gb: "GB",
    mb: "MB",
    kb: "KB",
    b: "b"
  },
  /**
  * Called when dropzone initialized
  * You can add event listeners here
  */
  init() {
  },
  /**
  * Can be an **object** of additional parameters to transfer to the server, **or** a `Function`
  * that gets invoked with the `files`, `xhr` and, if it's a chunked upload, `chunk` arguments. In case
  * of a function, this needs to return a map.
  *
  * The default implementation does nothing for normal uploads, but adds relevant information for
  * chunked uploads.
  *
  * This is the same as adding hidden input fields in the form element.
  */
  params(files3, xhr, chunk) {
    if (chunk) return {
      dzuuid: chunk.file.upload.uuid,
      dzchunkindex: chunk.index,
      dztotalfilesize: chunk.file.size,
      dzchunksize: this.options.chunkSize,
      dztotalchunkcount: chunk.file.upload.totalChunkCount,
      dzchunkbyteoffset: chunk.index * this.options.chunkSize
    };
  },
  /**
  * A function that gets a [file](https://developer.mozilla.org/en-US/docs/DOM/File)
  * and a `done` function as parameters.
  *
  * If the done function is invoked without arguments, the file is "accepted" and will
  * be processed. If you pass an error message, the file is rejected, and the error
  * message will be displayed.
  * This function will not be called if the file is too big or doesn't match the mime types.
  */
  accept(file2, done) {
    return done();
  },
  /**
  * The callback that will be invoked when all chunks have been uploaded for a file.
  * It gets the file for which the chunks have been uploaded as the first parameter,
  * and the `done` function as second. `done()` needs to be invoked when everything
  * needed to finish the upload process is done.
  */
  chunksUploaded: function(file2, done) {
    done();
  },
  /**
  * Sends the file as binary blob in body instead of form data.
  * If this is set, the `params` option will be ignored.
  * It's an error to set this to `true` along with `uploadMultiple` since
  * multiple files cannot be in a single binary body.
  */
  binaryBody: false,
  /**
  * Gets called when the browser is not supported.
  * The default implementation shows the fallback input field and adds
  * a text.
  */
  fallback() {
    let messageElement;
    this.element.className = `${this.element.className} dz-browser-not-supported`;
    for (let child of this.element.getElementsByTagName("div")) if (/(^| )dz-message($| )/.test(child.className)) {
      messageElement = child;
      child.className = "dz-message";
      break;
    }
    if (!messageElement) {
      messageElement = $3ed269f2f0fb224b$export$2e2bcd8739ae039.createElement('<div class="dz-message"><span></span></div>');
      this.element.appendChild(messageElement);
    }
    let span = messageElement.getElementsByTagName("span")[0];
    if (span) {
      if (span.textContent != null) span.textContent = this.options.dictFallbackMessage;
      else if (span.innerText != null) span.innerText = this.options.dictFallbackMessage;
    }
    return this.element.appendChild(this.getFallbackForm());
  },
  /**
  * Gets called to calculate the thumbnail dimensions.
  *
  * It gets `file`, `width` and `height` (both may be `null`) as parameters and must return an object containing:
  *
  *  - `srcWidth` & `srcHeight` (required)
  *  - `trgWidth` & `trgHeight` (required)
  *  - `srcX` & `srcY` (optional, default `0`)
  *  - `trgX` & `trgY` (optional, default `0`)
  *
  * Those values are going to be used by `ctx.drawImage()`.
  */
  resize(file2, width2, height2, resizeMethod) {
    let info = {
      srcX: 0,
      srcY: 0,
      srcWidth: file2.width,
      srcHeight: file2.height
    };
    let srcRatio = file2.width / file2.height;
    if (width2 == null && height2 == null) {
      width2 = info.srcWidth;
      height2 = info.srcHeight;
    } else if (width2 == null) width2 = height2 * srcRatio;
    else if (height2 == null) height2 = width2 / srcRatio;
    width2 = Math.min(width2, info.srcWidth);
    height2 = Math.min(height2, info.srcHeight);
    let trgRatio = width2 / height2;
    if (info.srcWidth > width2 || info.srcHeight > height2) {
      if (resizeMethod === "crop") {
        if (srcRatio > trgRatio) {
          info.srcHeight = file2.height;
          info.srcWidth = info.srcHeight * trgRatio;
        } else {
          info.srcWidth = file2.width;
          info.srcHeight = info.srcWidth / trgRatio;
        }
      } else if (resizeMethod === "contain") {
        if (srcRatio > trgRatio) height2 = width2 / srcRatio;
        else width2 = height2 * srcRatio;
      } else throw new Error(`Unknown resizeMethod '${resizeMethod}'`);
    }
    info.srcX = (file2.width - info.srcWidth) / 2;
    info.srcY = (file2.height - info.srcHeight) / 2;
    info.trgWidth = width2;
    info.trgHeight = height2;
    return info;
  },
  /**
  * Can be used to transform the file (for example, resize an image if necessary).
  *
  * The default implementation uses `resizeWidth` and `resizeHeight` (if provided) and resizes
  * images according to those dimensions.
  *
  * Gets the `file` as the first parameter, and a `done()` function as the second, that needs
  * to be invoked with the file when the transformation is done.
  */
  transformFile(file2, done) {
    if ((this.options.resizeWidth || this.options.resizeHeight) && file2.type.match(/image.*/)) return this.resizeImage(file2, this.options.resizeWidth, this.options.resizeHeight, this.options.resizeMethod, done);
    else return done(file2);
  },
  /**
  * A string that contains the template used for each dropped
  * file. Change it to fulfill your needs but make sure to properly
  * provide all elements.
  *
  * If you want to use an actual HTML element instead of providing a String
  * as a config option, you could create a div with the id `tpl`,
  * put the template inside it and provide the element like this:
  *
  *     document
  *       .querySelector('#tpl')
  *       .innerHTML
  *
  */
  previewTemplate: /* @__PURE__ */ $parcel$interopDefault($fd6031f88dce2e32$exports),
  /*
  Those functions register themselves to the events on init and handle all
  the user interface specific stuff. Overwriting them won't break the upload
  but can break the way it's displayed.
  You can overwrite them if you don't like the default behavior. If you just
  want to add an additional event handler, register it on the dropzone object
  and don't overwrite those options.
  */
  // Those are self explanatory and simply concern the DragnDrop.
  drop(e) {
    return this.element.classList.remove("dz-drag-hover");
  },
  dragstart(e) {
  },
  dragend(e) {
    return this.element.classList.remove("dz-drag-hover");
  },
  dragenter(e) {
    return this.element.classList.add("dz-drag-hover");
  },
  dragover(e) {
    return this.element.classList.add("dz-drag-hover");
  },
  dragleave(e) {
    return this.element.classList.remove("dz-drag-hover");
  },
  paste(e) {
  },
  // Called whenever there are no files left in the dropzone anymore, and the
  // dropzone should be displayed as if in the initial state.
  reset() {
    return this.element.classList.remove("dz-started");
  },
  // Called when a file is added to the queue
  // Receives `file`
  addedfile(file2) {
    if (this.element === this.previewsContainer) this.element.classList.add("dz-started");
    if (this.previewsContainer && !this.options.disablePreviews) {
      file2.previewElement = $3ed269f2f0fb224b$export$2e2bcd8739ae039.createElement(this.options.previewTemplate.trim());
      file2.previewTemplate = file2.previewElement;
      this.previewsContainer.appendChild(file2.previewElement);
      for (var node of file2.previewElement.querySelectorAll("[data-dz-name]")) node.textContent = file2.name;
      for (node of file2.previewElement.querySelectorAll("[data-dz-size]")) node.innerHTML = this.filesize(file2.size);
      if (this.options.addRemoveLinks) {
        file2._removeLink = $3ed269f2f0fb224b$export$2e2bcd8739ae039.createElement(`<a class="dz-remove" href="javascript:undefined;" data-dz-remove>${this.options.dictRemoveFile}</a>`);
        file2.previewElement.appendChild(file2._removeLink);
      }
      let removeFileEvent = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (file2.status === $3ed269f2f0fb224b$export$2e2bcd8739ae039.UPLOADING) return $3ed269f2f0fb224b$export$2e2bcd8739ae039.confirm(
          this.options.dictCancelUploadConfirmation,
          () => this.removeFile(file2)
        );
        else {
          if (this.options.dictRemoveFileConfirmation) return $3ed269f2f0fb224b$export$2e2bcd8739ae039.confirm(
            this.options.dictRemoveFileConfirmation,
            () => this.removeFile(file2)
          );
          else return this.removeFile(file2);
        }
      };
      for (let removeLink of file2.previewElement.querySelectorAll("[data-dz-remove]")) removeLink.addEventListener("click", removeFileEvent);
    }
  },
  // Called whenever a file is removed.
  removedfile(file2) {
    if (file2.previewElement != null && file2.previewElement.parentNode != null) file2.previewElement.parentNode.removeChild(file2.previewElement);
    return this._updateMaxFilesReachedClass();
  },
  // Called when a thumbnail has been generated
  // Receives `file` and `dataUrl`
  thumbnail(file2, dataUrl) {
    if (file2.previewElement) {
      file2.previewElement.classList.remove("dz-file-preview");
      for (let thumbnailElement of file2.previewElement.querySelectorAll("[data-dz-thumbnail]")) {
        thumbnailElement.alt = file2.name;
        thumbnailElement.src = dataUrl;
      }
      return setTimeout(
        () => file2.previewElement.classList.add("dz-image-preview"),
        1
      );
    }
  },
  // Called whenever an error occurs
  // Receives `file` and `message`
  error(file2, message) {
    if (file2.previewElement) {
      file2.previewElement.classList.add("dz-error");
      if (typeof message !== "string" && message.error) message = message.error;
      for (let node of file2.previewElement.querySelectorAll("[data-dz-errormessage]")) node.textContent = message;
    }
  },
  errormultiple() {
  },
  // Called when a file gets processed. Since there is a cue, not all added
  // files are processed immediately.
  // Receives `file`
  processing(file2) {
    if (file2.previewElement) {
      file2.previewElement.classList.add("dz-processing");
      if (file2._removeLink) return file2._removeLink.innerHTML = this.options.dictCancelUpload;
    }
  },
  processingmultiple() {
  },
  // Called whenever the upload progress gets updated.
  // Receives `file`, `progress` (percentage 0-100) and `bytesSent`.
  // To get the total number of bytes of the file, use `file.size`
  uploadprogress(file2, progress2, bytesSent) {
    if (file2.previewElement) for (let node of file2.previewElement.querySelectorAll("[data-dz-uploadprogress]")) node.nodeName === "PROGRESS" ? node.value = progress2 : node.style.width = `${progress2}%`;
  },
  // Called whenever the total upload progress gets updated.
  // Called with totalUploadProgress (0-100), totalBytes and totalBytesSent
  totaluploadprogress() {
  },
  // Called just before the file is sent. Gets the `xhr` object as second
  // parameter, so you can modify it (for example to add a CSRF token) and a
  // `formData` object to add additional information.
  sending() {
  },
  sendingmultiple() {
  },
  // When the complete upload is finished and successful
  // Receives `file`
  success(file2) {
    if (file2.previewElement) return file2.previewElement.classList.add("dz-success");
  },
  successmultiple() {
  },
  // When the upload is canceled.
  canceled(file2) {
    return this.emit("error", file2, this.options.dictUploadCanceled);
  },
  canceledmultiple() {
  },
  // When the upload is finished, either with success or an error.
  // Receives `file`
  complete(file2) {
    if (file2._removeLink) file2._removeLink.innerHTML = this.options.dictRemoveFile;
    if (file2.previewElement) return file2.previewElement.classList.add("dz-complete");
  },
  completemultiple() {
  },
  maxfilesexceeded() {
  },
  maxfilesreached() {
  },
  queuecomplete() {
  },
  addedfiles() {
  }
};
var $4ca367182776f80b$export$2e2bcd8739ae039 = $4ca367182776f80b$var$defaultOptions;
var $3ed269f2f0fb224b$export$2e2bcd8739ae039 = class _$3ed269f2f0fb224b$export$2e2bcd8739ae039 extends $4040acfd8584338d$export$2e2bcd8739ae039 {
  static initClass() {
    this.prototype.Emitter = $4040acfd8584338d$export$2e2bcd8739ae039;
    this.prototype.events = [
      "drop",
      "dragstart",
      "dragend",
      "dragenter",
      "dragover",
      "dragleave",
      "addedfile",
      "addedfiles",
      "removedfile",
      "thumbnail",
      "error",
      "errormultiple",
      "processing",
      "processingmultiple",
      "uploadprogress",
      "totaluploadprogress",
      "sending",
      "sendingmultiple",
      "success",
      "successmultiple",
      "canceled",
      "canceledmultiple",
      "complete",
      "completemultiple",
      "reset",
      "maxfilesexceeded",
      "maxfilesreached",
      "queuecomplete"
    ];
    this.prototype._thumbnailQueue = [];
    this.prototype._processingThumbnail = false;
  }
  // Returns all files that have been accepted
  getAcceptedFiles() {
    return this.files.filter(
      (file2) => file2.accepted
    ).map(
      (file2) => file2
    );
  }
  // Returns all files that have been rejected
  // Not sure when that's going to be useful, but added for completeness.
  getRejectedFiles() {
    return this.files.filter(
      (file2) => !file2.accepted
    ).map(
      (file2) => file2
    );
  }
  getFilesWithStatus(status) {
    return this.files.filter(
      (file2) => file2.status === status
    ).map(
      (file2) => file2
    );
  }
  // Returns all files that are in the queue
  getQueuedFiles() {
    return this.getFilesWithStatus(_$3ed269f2f0fb224b$export$2e2bcd8739ae039.QUEUED);
  }
  getUploadingFiles() {
    return this.getFilesWithStatus(_$3ed269f2f0fb224b$export$2e2bcd8739ae039.UPLOADING);
  }
  getAddedFiles() {
    return this.getFilesWithStatus(_$3ed269f2f0fb224b$export$2e2bcd8739ae039.ADDED);
  }
  // Files that are either queued or uploading
  getActiveFiles() {
    return this.files.filter(
      (file2) => file2.status === _$3ed269f2f0fb224b$export$2e2bcd8739ae039.UPLOADING || file2.status === _$3ed269f2f0fb224b$export$2e2bcd8739ae039.QUEUED
    ).map(
      (file2) => file2
    );
  }
  // The function that gets called when Dropzone is initialized. You
  // can (and should) setup event listeners inside this function.
  init() {
    if (this.element.tagName === "form") this.element.setAttribute("enctype", "multipart/form-data");
    if (this.element.classList.contains("dropzone") && !this.element.querySelector(".dz-message")) this.element.appendChild(_$3ed269f2f0fb224b$export$2e2bcd8739ae039.createElement(`<div class="dz-default dz-message"><button class="dz-button" type="button">${this.options.dictDefaultMessage}</button></div>`));
    if (this.clickableElements.length) {
      let setupHiddenFileInput = () => {
        if (this.hiddenFileInput) this.hiddenFileInput.parentNode.removeChild(this.hiddenFileInput);
        this.hiddenFileInput = document.createElement("input");
        this.hiddenFileInput.setAttribute("type", "file");
        if (this.options.maxFiles === null || this.options.maxFiles > 1) this.hiddenFileInput.setAttribute("multiple", "multiple");
        this.hiddenFileInput.className = "dz-hidden-input";
        if (this.options.acceptedFiles !== null) this.hiddenFileInput.setAttribute("accept", this.options.acceptedFiles);
        if (this.options.capture !== null) this.hiddenFileInput.setAttribute("capture", this.options.capture);
        this.hiddenFileInput.setAttribute("tabindex", "-1");
        this.hiddenFileInput.style.visibility = "hidden";
        this.hiddenFileInput.style.position = "absolute";
        this.hiddenFileInput.style.top = "0";
        this.hiddenFileInput.style.left = "0";
        this.hiddenFileInput.style.height = "0";
        this.hiddenFileInput.style.width = "0";
        _$3ed269f2f0fb224b$export$2e2bcd8739ae039.getElement(this.options.hiddenInputContainer, "hiddenInputContainer").appendChild(this.hiddenFileInput);
        this.hiddenFileInput.addEventListener("change", () => {
          let { files: files3 } = this.hiddenFileInput;
          if (files3.length) for (let file2 of files3) this.addFile(file2);
          this.emit("addedfiles", files3);
          setupHiddenFileInput();
        });
      };
      setupHiddenFileInput();
    }
    this.URL = window.URL !== null ? window.URL : window.webkitURL;
    for (let eventName of this.events) this.on(eventName, this.options[eventName]);
    this.on(
      "uploadprogress",
      () => this.updateTotalUploadProgress()
    );
    this.on(
      "removedfile",
      () => this.updateTotalUploadProgress()
    );
    this.on(
      "canceled",
      (file2) => this.emit("complete", file2)
    );
    this.on("complete", (file2) => {
      if (this.getAddedFiles().length === 0 && this.getUploadingFiles().length === 0 && this.getQueuedFiles().length === 0)
        return setTimeout(
          () => this.emit("queuecomplete"),
          0
        );
    });
    const containsFiles = function(e) {
      if (e.dataTransfer.types)
        for (var i = 0; i < e.dataTransfer.types.length; i++) {
          if (e.dataTransfer.types[i] === "Files") return true;
        }
      return false;
    };
    let noPropagation = function(e) {
      if (!containsFiles(e)) return;
      e.stopPropagation();
      if (e.preventDefault) return e.preventDefault();
      else return e.returnValue = false;
    };
    this.listeners = [
      {
        element: this.element,
        events: {
          dragstart: (e) => {
            return this.emit("dragstart", e);
          },
          dragenter: (e) => {
            noPropagation(e);
            return this.emit("dragenter", e);
          },
          dragover: (e) => {
            let efct;
            try {
              efct = e.dataTransfer.effectAllowed;
            } catch (error3) {
            }
            e.dataTransfer.dropEffect = "move" === efct || "linkMove" === efct ? "move" : "copy";
            noPropagation(e);
            return this.emit("dragover", e);
          },
          dragleave: (e) => {
            return this.emit("dragleave", e);
          },
          drop: (e) => {
            noPropagation(e);
            return this.drop(e);
          },
          dragend: (e) => {
            return this.emit("dragend", e);
          }
        }
      }
    ];
    this.clickableElements.forEach((clickableElement) => {
      return this.listeners.push({
        element: clickableElement,
        events: {
          click: (evt) => {
            if (clickableElement !== this.element || evt.target === this.element || _$3ed269f2f0fb224b$export$2e2bcd8739ae039.elementInside(evt.target, this.element.querySelector(".dz-message"))) this.hiddenFileInput.click();
            return true;
          }
        }
      });
    });
    this.enable();
    return this.options.init.call(this);
  }
  // Not fully tested yet
  destroy() {
    this.disable();
    this.removeAllFiles(true);
    if (this.hiddenFileInput != null ? this.hiddenFileInput.parentNode : void 0) {
      this.hiddenFileInput.parentNode.removeChild(this.hiddenFileInput);
      this.hiddenFileInput = null;
    }
    delete this.element.dropzone;
    return _$3ed269f2f0fb224b$export$2e2bcd8739ae039.instances.splice(_$3ed269f2f0fb224b$export$2e2bcd8739ae039.instances.indexOf(this), 1);
  }
  updateTotalUploadProgress() {
    let totalUploadProgress;
    let totalBytesSent = 0;
    let totalBytes = 0;
    let activeFiles = this.getActiveFiles();
    if (activeFiles.length) {
      for (let file2 of this.getActiveFiles()) {
        totalBytesSent += file2.upload.bytesSent;
        totalBytes += file2.upload.total;
      }
      totalUploadProgress = 100 * totalBytesSent / totalBytes;
    } else totalUploadProgress = 100;
    return this.emit("totaluploadprogress", totalUploadProgress, totalBytes, totalBytesSent);
  }
  // @options.paramName can be a function taking one parameter rather than a string.
  // A parameter name for a file is obtained simply by calling this with an index number.
  _getParamName(n) {
    if (typeof this.options.paramName === "function") return this.options.paramName(n);
    else return `${this.options.paramName}${this.options.uploadMultiple ? `[${n}]` : ""}`;
  }
  // If @options.renameFile is a function,
  // the function will be used to rename the file.name before appending it to the formData
  _renameFile(file2) {
    if (typeof this.options.renameFile !== "function") return file2.name;
    return this.options.renameFile(file2);
  }
  // Returns a form that can be used as fallback if the browser does not support DragnDrop
  //
  // If the dropzone is already a form, only the input field and button are returned. Otherwise a complete form element is provided.
  // This code has to pass in IE7 :(
  getFallbackForm() {
    let existingFallback, form;
    if (existingFallback = this.getExistingFallback()) return existingFallback;
    let fieldsString = '<div class="dz-fallback">';
    if (this.options.dictFallbackText) fieldsString += `<p>${this.options.dictFallbackText}</p>`;
    fieldsString += `<input type="file" name="${this._getParamName(0)}" ${this.options.uploadMultiple ? 'multiple="multiple"' : void 0} /><input type="submit" value="Upload!"></div>`;
    let fields = _$3ed269f2f0fb224b$export$2e2bcd8739ae039.createElement(fieldsString);
    if (this.element.tagName !== "FORM") {
      form = _$3ed269f2f0fb224b$export$2e2bcd8739ae039.createElement(`<form action="${this.options.url}" enctype="multipart/form-data" method="${this.options.method}"></form>`);
      form.appendChild(fields);
    } else {
      this.element.setAttribute("enctype", "multipart/form-data");
      this.element.setAttribute("method", this.options.method);
    }
    return form != null ? form : fields;
  }
  // Returns the fallback elements if they exist already
  //
  // This code has to pass in IE7 :(
  getExistingFallback() {
    let getFallback = function(elements) {
      for (let el of elements) {
        if (/(^| )fallback($| )/.test(el.className)) return el;
      }
    };
    for (let tagName of [
      "div",
      "form"
    ]) {
      var fallback;
      if (fallback = getFallback(this.element.getElementsByTagName(tagName))) return fallback;
    }
  }
  // Activates all listeners stored in @listeners
  setupEventListeners() {
    return this.listeners.map(
      (elementListeners) => (() => {
        let result = [];
        for (let event in elementListeners.events) {
          let listener = elementListeners.events[event];
          result.push(elementListeners.element.addEventListener(event, listener, false));
        }
        return result;
      })()
    );
  }
  // Deactivates all listeners stored in @listeners
  removeEventListeners() {
    return this.listeners.map(
      (elementListeners) => (() => {
        let result = [];
        for (let event in elementListeners.events) {
          let listener = elementListeners.events[event];
          result.push(elementListeners.element.removeEventListener(event, listener, false));
        }
        return result;
      })()
    );
  }
  // Removes all event listeners and cancels all files in the queue or being processed.
  disable() {
    this.clickableElements.forEach(
      (element) => element.classList.remove("dz-clickable")
    );
    this.removeEventListeners();
    this.disabled = true;
    return this.files.map(
      (file2) => this.cancelUpload(file2)
    );
  }
  enable() {
    delete this.disabled;
    this.clickableElements.forEach(
      (element) => element.classList.add("dz-clickable")
    );
    return this.setupEventListeners();
  }
  // Returns a nicely formatted filesize
  filesize(size) {
    let selectedSize = 0;
    let selectedUnit = "b";
    if (size > 0) {
      let units = [
        "tb",
        "gb",
        "mb",
        "kb",
        "b"
      ];
      for (let i = 0; i < units.length; i++) {
        let unit = units[i];
        let cutoff = Math.pow(this.options.filesizeBase, 4 - i) / 10;
        if (size >= cutoff) {
          selectedSize = size / Math.pow(this.options.filesizeBase, 4 - i);
          selectedUnit = unit;
          break;
        }
      }
      selectedSize = Math.round(10 * selectedSize) / 10;
    }
    return `<strong>${selectedSize}</strong> ${this.options.dictFileSizeUnits[selectedUnit]}`;
  }
  // Adds or removes the `dz-max-files-reached` class from the form.
  _updateMaxFilesReachedClass() {
    if (this.options.maxFiles != null && this.getAcceptedFiles().length >= this.options.maxFiles) {
      if (this.getAcceptedFiles().length === this.options.maxFiles) this.emit("maxfilesreached", this.files);
      return this.element.classList.add("dz-max-files-reached");
    } else return this.element.classList.remove("dz-max-files-reached");
  }
  drop(e) {
    if (!e.dataTransfer) return;
    this.emit("drop", e);
    let files3 = [];
    for (let i = 0; i < e.dataTransfer.files.length; i++) files3[i] = e.dataTransfer.files[i];
    if (files3.length) {
      let { items } = e.dataTransfer;
      if (items && items.length && items[0].webkitGetAsEntry != null)
        this._addFilesFromItems(items);
      else this.handleFiles(files3);
    }
    this.emit("addedfiles", files3);
  }
  paste(e) {
    if ($3ed269f2f0fb224b$var$__guard__(
      e != null ? e.clipboardData : void 0,
      (x) => x.items
    ) == null) return;
    this.emit("paste", e);
    let { items } = e.clipboardData;
    if (items.length) return this._addFilesFromItems(items);
  }
  handleFiles(files3) {
    for (let file2 of files3) this.addFile(file2);
  }
  // When a folder is dropped (or files are pasted), items must be handled
  // instead of files.
  _addFilesFromItems(items) {
    return (() => {
      let result = [];
      for (let item of items) {
        var entry;
        if (item.webkitGetAsEntry != null && (entry = item.webkitGetAsEntry())) {
          if (entry.isFile) result.push(this.addFile(item.getAsFile()));
          else if (entry.isDirectory)
            result.push(this._addFilesFromDirectory(entry, entry.name));
          else result.push(void 0);
        } else if (item.getAsFile != null) {
          if (item.kind == null || item.kind === "file") result.push(this.addFile(item.getAsFile()));
          else result.push(void 0);
        } else result.push(void 0);
      }
      return result;
    })();
  }
  // Goes through the directory, and adds each file it finds recursively
  _addFilesFromDirectory(directory, path) {
    let dirReader = directory.createReader();
    let errorHandler = (error3) => $3ed269f2f0fb224b$var$__guardMethod__(
      console,
      "log",
      (o) => o.log(error3)
    );
    var readEntries = () => {
      return dirReader.readEntries((entries) => {
        if (entries.length > 0) {
          for (let entry of entries) {
            if (entry.isFile) entry.file((file2) => {
              if (this.options.ignoreHiddenFiles && file2.name.substring(0, 1) === ".") return;
              file2.fullPath = `${path}/${file2.name}`;
              return this.addFile(file2);
            });
            else if (entry.isDirectory) this._addFilesFromDirectory(entry, `${path}/${entry.name}`);
          }
          readEntries();
        }
        return null;
      }, errorHandler);
    };
    return readEntries();
  }
  // If `done()` is called without argument the file is accepted
  // If you call it with an error message, the file is rejected
  // (This allows for asynchronous validation)
  //
  // This function checks the filesize, and if the file.type passes the
  // `acceptedFiles` check.
  accept(file2, done) {
    if (this.options.maxFilesize && file2.size > this.options.maxFilesize * 1048576) done(this.options.dictFileTooBig.replace("{{filesize}}", Math.round(file2.size / 1024 / 10.24) / 100).replace("{{maxFilesize}}", this.options.maxFilesize));
    else if (!_$3ed269f2f0fb224b$export$2e2bcd8739ae039.isValidFile(file2, this.options.acceptedFiles)) done(this.options.dictInvalidFileType);
    else if (this.options.maxFiles != null && this.getAcceptedFiles().length >= this.options.maxFiles) {
      done(this.options.dictMaxFilesExceeded.replace("{{maxFiles}}", this.options.maxFiles));
      this.emit("maxfilesexceeded", file2);
    } else this.options.accept.call(this, file2, done);
  }
  addFile(file2) {
    file2.upload = {
      uuid: _$3ed269f2f0fb224b$export$2e2bcd8739ae039.uuidv4(),
      progress: 0,
      // Setting the total upload size to file.size for the beginning
      // It's actual different than the size to be transmitted.
      total: file2.size,
      bytesSent: 0,
      filename: this._renameFile(file2)
    };
    this.files.push(file2);
    file2.status = _$3ed269f2f0fb224b$export$2e2bcd8739ae039.ADDED;
    this.emit("addedfile", file2);
    this._enqueueThumbnail(file2);
    this.accept(file2, (error3) => {
      if (error3) {
        file2.accepted = false;
        this._errorProcessing([
          file2
        ], error3);
      } else {
        file2.accepted = true;
        if (this.options.autoQueue) this.enqueueFile(file2);
      }
      this._updateMaxFilesReachedClass();
    });
  }
  // Wrapper for enqueueFile
  enqueueFiles(files3) {
    for (let file2 of files3) this.enqueueFile(file2);
    return null;
  }
  enqueueFile(file2) {
    if (file2.status === _$3ed269f2f0fb224b$export$2e2bcd8739ae039.ADDED && file2.accepted === true) {
      file2.status = _$3ed269f2f0fb224b$export$2e2bcd8739ae039.QUEUED;
      if (this.options.autoProcessQueue) return setTimeout(
        () => this.processQueue(),
        0
      );
    } else throw new Error("This file can't be queued because it has already been processed or was rejected.");
  }
  _enqueueThumbnail(file2) {
    if (this.options.createImageThumbnails && file2.type.match(/image.*/) && file2.size <= this.options.maxThumbnailFilesize * 1048576) {
      this._thumbnailQueue.push(file2);
      return setTimeout(
        () => this._processThumbnailQueue(),
        0
      );
    }
  }
  _processThumbnailQueue() {
    if (this._processingThumbnail || this._thumbnailQueue.length === 0) return;
    this._processingThumbnail = true;
    let file2 = this._thumbnailQueue.shift();
    return this.createThumbnail(file2, this.options.thumbnailWidth, this.options.thumbnailHeight, this.options.thumbnailMethod, true, (dataUrl) => {
      this.emit("thumbnail", file2, dataUrl);
      this._processingThumbnail = false;
      return this._processThumbnailQueue();
    });
  }
  // Can be called by the user to remove a file
  removeFile(file2) {
    if (file2.status === _$3ed269f2f0fb224b$export$2e2bcd8739ae039.UPLOADING) this.cancelUpload(file2);
    this.files = $3ed269f2f0fb224b$var$without(this.files, file2);
    this.emit("removedfile", file2);
    if (this.files.length === 0) return this.emit("reset");
  }
  // Removes all files that aren't currently processed from the list
  removeAllFiles(cancelIfNecessary) {
    if (cancelIfNecessary == null) cancelIfNecessary = false;
    for (let file2 of this.files.slice()) if (file2.status !== _$3ed269f2f0fb224b$export$2e2bcd8739ae039.UPLOADING || cancelIfNecessary) this.removeFile(file2);
    return null;
  }
  // Resizes an image before it gets sent to the server. This function is the default behavior of
  // `options.transformFile` if `resizeWidth` or `resizeHeight` are set. The callback is invoked with
  // the resized blob.
  resizeImage(file2, width2, height2, resizeMethod, callback) {
    return this.createThumbnail(file2, width2, height2, resizeMethod, true, (dataUrl, canvas) => {
      if (canvas == null)
        return callback(file2);
      else {
        let { resizeMimeType } = this.options;
        if (resizeMimeType == null) resizeMimeType = file2.type;
        let resizedDataURL = canvas.toDataURL(resizeMimeType, this.options.resizeQuality);
        if (resizeMimeType === "image/jpeg" || resizeMimeType === "image/jpg")
          resizedDataURL = $3ed269f2f0fb224b$var$ExifRestore.restore(file2.dataURL, resizedDataURL);
        return callback(_$3ed269f2f0fb224b$export$2e2bcd8739ae039.dataURItoBlob(resizedDataURL));
      }
    });
  }
  createThumbnail(file2, width2, height2, resizeMethod, fixOrientation, callback) {
    let fileReader2 = new FileReader();
    fileReader2.onload = () => {
      file2.dataURL = fileReader2.result;
      if (file2.type === "image/svg+xml") {
        if (callback != null) callback(fileReader2.result);
        return;
      }
      this.createThumbnailFromUrl(file2, width2, height2, resizeMethod, fixOrientation, callback);
    };
    fileReader2.readAsDataURL(file2);
  }
  // `mockFile` needs to have these attributes:
  //
  //     { name: 'name', size: 12345, imageUrl: '' }
  //
  // `callback` will be invoked when the image has been downloaded and displayed.
  // `crossOrigin` will be added to the `img` tag when accessing the file.
  displayExistingFile(mockFile, imageUrl, callback, crossOrigin, resizeThumbnail = true) {
    this.emit("addedfile", mockFile);
    this.emit("complete", mockFile);
    if (!resizeThumbnail) {
      this.emit("thumbnail", mockFile, imageUrl);
      if (callback) callback();
    } else {
      let onDone = (thumbnail) => {
        this.emit("thumbnail", mockFile, thumbnail);
        if (callback) callback();
      };
      mockFile.dataURL = imageUrl;
      this.createThumbnailFromUrl(mockFile, this.options.thumbnailWidth, this.options.thumbnailHeight, this.options.thumbnailMethod, this.options.fixOrientation, onDone, crossOrigin);
    }
  }
  createThumbnailFromUrl(file2, width2, height2, resizeMethod, fixOrientation, callback, crossOrigin) {
    let img = document.createElement("img");
    if (crossOrigin) img.crossOrigin = crossOrigin;
    fixOrientation = getComputedStyle(document.body)["imageOrientation"] == "from-image" ? false : fixOrientation;
    img.onload = () => {
      let loadExif = (callback2) => callback2(1);
      if (typeof EXIF !== "undefined" && EXIF !== null && fixOrientation) loadExif = (callback2) => EXIF.getData(img, function() {
        return callback2(EXIF.getTag(this, "Orientation"));
      });
      return loadExif((orientation) => {
        file2.width = img.width;
        file2.height = img.height;
        let resizeInfo = this.options.resize.call(this, file2, width2, height2, resizeMethod);
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        canvas.width = resizeInfo.trgWidth;
        canvas.height = resizeInfo.trgHeight;
        if (orientation > 4) {
          canvas.width = resizeInfo.trgHeight;
          canvas.height = resizeInfo.trgWidth;
        }
        switch (orientation) {
          case 2:
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            break;
          case 3:
            ctx.translate(canvas.width, canvas.height);
            ctx.rotate(Math.PI);
            break;
          case 4:
            ctx.translate(0, canvas.height);
            ctx.scale(1, -1);
            break;
          case 5:
            ctx.rotate(0.5 * Math.PI);
            ctx.scale(1, -1);
            break;
          case 6:
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(0, -canvas.width);
            break;
          case 7:
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(canvas.height, -canvas.width);
            ctx.scale(-1, 1);
            break;
          case 8:
            ctx.rotate(-0.5 * Math.PI);
            ctx.translate(-canvas.height, 0);
            break;
        }
        $3ed269f2f0fb224b$var$drawImageIOSFix(ctx, img, resizeInfo.srcX != null ? resizeInfo.srcX : 0, resizeInfo.srcY != null ? resizeInfo.srcY : 0, resizeInfo.srcWidth, resizeInfo.srcHeight, resizeInfo.trgX != null ? resizeInfo.trgX : 0, resizeInfo.trgY != null ? resizeInfo.trgY : 0, resizeInfo.trgWidth, resizeInfo.trgHeight);
        let thumbnail = canvas.toDataURL("image/png");
        if (callback != null) return callback(thumbnail, canvas);
      });
    };
    if (callback != null) img.onerror = callback;
    return img.src = file2.dataURL;
  }
  // Goes through the queue and processes files if there aren't too many already.
  processQueue() {
    let { parallelUploads } = this.options;
    let processingLength = this.getUploadingFiles().length;
    let i = processingLength;
    if (processingLength >= parallelUploads) return;
    let queuedFiles = this.getQueuedFiles();
    if (!(queuedFiles.length > 0)) return;
    if (this.options.uploadMultiple)
      return this.processFiles(queuedFiles.slice(0, parallelUploads - processingLength));
    else while (i < parallelUploads) {
      if (!queuedFiles.length) return;
      this.processFile(queuedFiles.shift());
      i++;
    }
  }
  // Wrapper for `processFiles`
  processFile(file2) {
    return this.processFiles([
      file2
    ]);
  }
  // Loads the file, then calls finishedLoading()
  processFiles(files3) {
    for (let file2 of files3) {
      file2.processing = true;
      file2.status = _$3ed269f2f0fb224b$export$2e2bcd8739ae039.UPLOADING;
      this.emit("processing", file2);
    }
    if (this.options.uploadMultiple) this.emit("processingmultiple", files3);
    return this.uploadFiles(files3);
  }
  _getFilesWithXhr(xhr) {
    let files3;
    return files3 = this.files.filter(
      (file2) => file2.xhr === xhr
    ).map(
      (file2) => file2
    );
  }
  // Cancels the file upload and sets the status to CANCELED
  // **if** the file is actually being uploaded.
  // If it's still in the queue, the file is being removed from it and the status
  // set to CANCELED.
  cancelUpload(file2) {
    if (file2.status === _$3ed269f2f0fb224b$export$2e2bcd8739ae039.UPLOADING) {
      let groupedFiles = this._getFilesWithXhr(file2.xhr);
      for (let groupedFile of groupedFiles) groupedFile.status = _$3ed269f2f0fb224b$export$2e2bcd8739ae039.CANCELED;
      if (typeof file2.xhr !== "undefined") file2.xhr.abort();
      for (let groupedFile1 of groupedFiles) this.emit("canceled", groupedFile1);
      if (this.options.uploadMultiple) this.emit("canceledmultiple", groupedFiles);
    } else if (file2.status === _$3ed269f2f0fb224b$export$2e2bcd8739ae039.ADDED || file2.status === _$3ed269f2f0fb224b$export$2e2bcd8739ae039.QUEUED) {
      file2.status = _$3ed269f2f0fb224b$export$2e2bcd8739ae039.CANCELED;
      this.emit("canceled", file2);
      if (this.options.uploadMultiple) this.emit("canceledmultiple", [
        file2
      ]);
    }
    if (this.options.autoProcessQueue) return this.processQueue();
  }
  resolveOption(option, ...args) {
    if (typeof option === "function") return option.apply(this, args);
    return option;
  }
  uploadFile(file2) {
    return this.uploadFiles([
      file2
    ]);
  }
  uploadFiles(files3) {
    this._transformFiles(files3, (transformedFiles) => {
      if (this.options.chunking) {
        let transformedFile = transformedFiles[0];
        files3[0].upload.chunked = this.options.chunking && (this.options.forceChunking || transformedFile.size > this.options.chunkSize);
        files3[0].upload.totalChunkCount = Math.ceil(transformedFile.size / this.options.chunkSize);
      }
      if (files3[0].upload.chunked) {
        let file2 = files3[0];
        let transformedFile = transformedFiles[0];
        let startedChunkCount = 0;
        file2.upload.chunks = [];
        let handleNextChunk = () => {
          let chunkIndex = 0;
          while (file2.upload.chunks[chunkIndex] !== void 0) chunkIndex++;
          if (chunkIndex >= file2.upload.totalChunkCount) return;
          startedChunkCount++;
          let start3 = chunkIndex * this.options.chunkSize;
          let end = Math.min(start3 + this.options.chunkSize, transformedFile.size);
          let dataBlock = {
            name: this._getParamName(0),
            data: transformedFile.webkitSlice ? transformedFile.webkitSlice(start3, end) : transformedFile.slice(start3, end),
            filename: file2.upload.filename,
            chunkIndex
          };
          file2.upload.chunks[chunkIndex] = {
            file: file2,
            index: chunkIndex,
            dataBlock,
            status: _$3ed269f2f0fb224b$export$2e2bcd8739ae039.UPLOADING,
            progress: 0,
            retries: 0
          };
          this._uploadData(files3, [
            dataBlock
          ]);
        };
        file2.upload.finishedChunkUpload = (chunk, response2) => {
          let allFinished = true;
          chunk.status = _$3ed269f2f0fb224b$export$2e2bcd8739ae039.SUCCESS;
          chunk.dataBlock = null;
          chunk.response = chunk.xhr.responseText;
          chunk.responseHeaders = chunk.xhr.getAllResponseHeaders();
          chunk.xhr = null;
          for (let i = 0; i < file2.upload.totalChunkCount; i++) {
            if (file2.upload.chunks[i] === void 0) return handleNextChunk();
            if (file2.upload.chunks[i].status !== _$3ed269f2f0fb224b$export$2e2bcd8739ae039.SUCCESS) allFinished = false;
          }
          if (allFinished) this.options.chunksUploaded(file2, () => {
            this._finished(files3, response2, null);
          });
        };
        if (this.options.parallelChunkUploads) for (let i = 0; i < file2.upload.totalChunkCount; i++) handleNextChunk();
        else handleNextChunk();
      } else {
        let dataBlocks = [];
        for (let i = 0; i < files3.length; i++) dataBlocks[i] = {
          name: this._getParamName(i),
          data: transformedFiles[i],
          filename: files3[i].upload.filename
        };
        this._uploadData(files3, dataBlocks);
      }
    });
  }
  /// Returns the right chunk for given file and xhr
  _getChunk(file2, xhr) {
    for (let i = 0; i < file2.upload.totalChunkCount; i++) {
      if (file2.upload.chunks[i] !== void 0 && file2.upload.chunks[i].xhr === xhr) return file2.upload.chunks[i];
    }
  }
  // This function actually uploads the file(s) to the server.
  //
  //  If dataBlocks contains the actual data to upload (meaning, that this could
  // either be transformed files, or individual chunks for chunked upload) then
  // they will be used for the actual data to upload.
  _uploadData(files3, dataBlocks) {
    let xhr = new XMLHttpRequest();
    for (let file2 of files3) file2.xhr = xhr;
    if (files3[0].upload.chunked)
      files3[0].upload.chunks[dataBlocks[0].chunkIndex].xhr = xhr;
    let method = this.resolveOption(this.options.method, files3, dataBlocks);
    let url = this.resolveOption(this.options.url, files3, dataBlocks);
    xhr.open(method, url, true);
    let timeout = this.resolveOption(this.options.timeout, files3);
    if (timeout) xhr.timeout = this.resolveOption(this.options.timeout, files3);
    xhr.withCredentials = !!this.options.withCredentials;
    xhr.onload = (e) => {
      this._finishedUploading(files3, xhr, e);
    };
    xhr.ontimeout = () => {
      this._handleUploadError(files3, xhr, `Request timedout after ${this.options.timeout / 1e3} seconds`);
    };
    xhr.onerror = () => {
      this._handleUploadError(files3, xhr);
    };
    let progressObj = xhr.upload != null ? xhr.upload : xhr;
    progressObj.onprogress = (e) => this._updateFilesUploadProgress(files3, xhr, e);
    let headers = this.options.defaultHeaders ? {
      Accept: "application/json",
      "Cache-Control": "no-cache",
      "X-Requested-With": "XMLHttpRequest"
    } : {};
    if (this.options.binaryBody) headers["Content-Type"] = files3[0].type;
    if (this.options.headers) objectExtend(headers, this.options.headers);
    for (let headerName in headers) {
      let headerValue = headers[headerName];
      if (headerValue) xhr.setRequestHeader(headerName, headerValue);
    }
    if (this.options.binaryBody) {
      for (let file2 of files3) this.emit("sending", file2, xhr);
      if (this.options.uploadMultiple) this.emit("sendingmultiple", files3, xhr);
      this.submitRequest(xhr, null, files3);
    } else {
      let formData = new FormData();
      if (this.options.params) {
        let additionalParams = this.options.params;
        if (typeof additionalParams === "function") additionalParams = additionalParams.call(this, files3, xhr, files3[0].upload.chunked ? this._getChunk(files3[0], xhr) : null);
        for (let key in additionalParams) {
          let value = additionalParams[key];
          if (Array.isArray(value))
            for (let i = 0; i < value.length; i++) formData.append(key, value[i]);
          else formData.append(key, value);
        }
      }
      for (let file2 of files3) this.emit("sending", file2, xhr, formData);
      if (this.options.uploadMultiple) this.emit("sendingmultiple", files3, xhr, formData);
      this._addFormElementData(formData);
      for (let i = 0; i < dataBlocks.length; i++) {
        let dataBlock = dataBlocks[i];
        formData.append(dataBlock.name, dataBlock.data, dataBlock.filename);
      }
      this.submitRequest(xhr, formData, files3);
    }
  }
  // Transforms all files with this.options.transformFile and invokes done with the transformed files when done.
  _transformFiles(files3, done) {
    let transformedFiles = [];
    let doneCounter = 0;
    for (let i = 0; i < files3.length; i++) this.options.transformFile.call(this, files3[i], (transformedFile) => {
      transformedFiles[i] = transformedFile;
      if (++doneCounter === files3.length) done(transformedFiles);
    });
  }
  // Takes care of adding other input elements of the form to the AJAX request
  _addFormElementData(formData) {
    if (this.element.tagName === "FORM") for (let input of this.element.querySelectorAll("input, textarea, select, button")) {
      let inputName = input.getAttribute("name");
      let inputType = input.getAttribute("type");
      if (inputType) inputType = inputType.toLowerCase();
      if (typeof inputName === "undefined" || inputName === null) continue;
      if (input.tagName === "SELECT" && input.hasAttribute("multiple")) {
        for (let option of input.options) if (option.selected) formData.append(inputName, option.value);
      } else if (!inputType || inputType !== "checkbox" && inputType !== "radio" || input.checked) formData.append(inputName, input.value);
    }
  }
  // Invoked when there is new progress information about given files.
  // If e is not provided, it is assumed that the upload is finished.
  _updateFilesUploadProgress(files3, xhr, e) {
    if (!files3[0].upload.chunked)
      for (let file2 of files3) {
        if (file2.upload.total && file2.upload.bytesSent && file2.upload.bytesSent == file2.upload.total) continue;
        if (e) {
          file2.upload.progress = 100 * e.loaded / e.total;
          file2.upload.total = e.total;
          file2.upload.bytesSent = e.loaded;
        } else {
          file2.upload.progress = 100;
          file2.upload.bytesSent = file2.upload.total;
        }
        this.emit("uploadprogress", file2, file2.upload.progress, file2.upload.bytesSent);
      }
    else {
      let file2 = files3[0];
      let chunk = this._getChunk(file2, xhr);
      if (e) {
        chunk.progress = 100 * e.loaded / e.total;
        chunk.total = e.total;
        chunk.bytesSent = e.loaded;
      } else {
        chunk.progress = 100;
        chunk.bytesSent = chunk.total;
      }
      file2.upload.progress = 0;
      file2.upload.total = 0;
      file2.upload.bytesSent = 0;
      for (let i = 0; i < file2.upload.totalChunkCount; i++) if (file2.upload.chunks[i] && typeof file2.upload.chunks[i].progress !== "undefined") {
        file2.upload.progress += file2.upload.chunks[i].progress;
        file2.upload.total += file2.upload.chunks[i].total;
        file2.upload.bytesSent += file2.upload.chunks[i].bytesSent;
      }
      file2.upload.progress = file2.upload.progress / file2.upload.totalChunkCount;
      this.emit("uploadprogress", file2, file2.upload.progress, file2.upload.bytesSent);
    }
  }
  _finishedUploading(files3, xhr, e) {
    let response2;
    if (files3[0].status === _$3ed269f2f0fb224b$export$2e2bcd8739ae039.CANCELED) return;
    if (xhr.readyState !== 4) return;
    if (xhr.responseType !== "arraybuffer" && xhr.responseType !== "blob") {
      response2 = xhr.responseText;
      if (xhr.getResponseHeader("content-type") && ~xhr.getResponseHeader("content-type").indexOf("application/json")) try {
        response2 = JSON.parse(response2);
      } catch (error3) {
        e = error3;
        response2 = "Invalid JSON response from server.";
      }
    }
    this._updateFilesUploadProgress(files3, xhr);
    if (!(200 <= xhr.status && xhr.status < 300)) this._handleUploadError(files3, xhr, response2);
    else if (files3[0].upload.chunked) files3[0].upload.finishedChunkUpload(this._getChunk(files3[0], xhr), response2);
    else this._finished(files3, response2, e);
  }
  _handleUploadError(files3, xhr, response2) {
    if (files3[0].status === _$3ed269f2f0fb224b$export$2e2bcd8739ae039.CANCELED) return;
    if (files3[0].upload.chunked && this.options.retryChunks) {
      let chunk = this._getChunk(files3[0], xhr);
      if (chunk.retries++ < this.options.retryChunksLimit) {
        this._uploadData(files3, [
          chunk.dataBlock
        ]);
        return;
      } else console.warn("Retried this chunk too often. Giving up.");
    }
    this._errorProcessing(files3, response2 || this.options.dictResponseError.replace("{{statusCode}}", xhr.status), xhr);
  }
  submitRequest(xhr, formData, files3) {
    if (xhr.readyState != 1) {
      console.warn("Cannot send this request because the XMLHttpRequest.readyState is not OPENED.");
      return;
    }
    if (this.options.binaryBody) {
      if (files3[0].upload.chunked) {
        const chunk = this._getChunk(files3[0], xhr);
        xhr.send(chunk.dataBlock.data);
      } else xhr.send(files3[0]);
    } else xhr.send(formData);
  }
  // Called internally when processing is finished.
  // Individual callbacks have to be called in the appropriate sections.
  _finished(files3, responseText, e) {
    for (let file2 of files3) {
      file2.status = _$3ed269f2f0fb224b$export$2e2bcd8739ae039.SUCCESS;
      this.emit("success", file2, responseText, e);
      this.emit("complete", file2);
    }
    if (this.options.uploadMultiple) {
      this.emit("successmultiple", files3, responseText, e);
      this.emit("completemultiple", files3);
    }
    if (this.options.autoProcessQueue) return this.processQueue();
  }
  // Called internally when processing is finished.
  // Individual callbacks have to be called in the appropriate sections.
  _errorProcessing(files3, message, xhr) {
    for (let file2 of files3) {
      file2.status = _$3ed269f2f0fb224b$export$2e2bcd8739ae039.ERROR;
      this.emit("error", file2, message, xhr);
      this.emit("complete", file2);
    }
    if (this.options.uploadMultiple) {
      this.emit("errormultiple", files3, message, xhr);
      this.emit("completemultiple", files3);
    }
    if (this.options.autoProcessQueue) return this.processQueue();
  }
  static uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      let r = Math.random() * 16 | 0, v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  constructor(el, options) {
    super();
    let fallback, left;
    this.element = el;
    this.clickableElements = [];
    this.listeners = [];
    this.files = [];
    if (typeof this.element === "string") this.element = document.querySelector(this.element);
    if (!this.element || this.element.nodeType == null) throw new Error("Invalid dropzone element.");
    if (this.element.dropzone) throw new Error("Dropzone already attached.");
    _$3ed269f2f0fb224b$export$2e2bcd8739ae039.instances.push(this);
    this.element.dropzone = this;
    let elementOptions = (left = _$3ed269f2f0fb224b$export$2e2bcd8739ae039.optionsForElement(this.element)) != null ? left : {};
    this.options = objectExtend(true, {}, $4ca367182776f80b$export$2e2bcd8739ae039, elementOptions, options != null ? options : {});
    this.options.previewTemplate = this.options.previewTemplate.replace(/\n*/g, "");
    if (this.options.forceFallback || !_$3ed269f2f0fb224b$export$2e2bcd8739ae039.isBrowserSupported()) return this.options.fallback.call(this);
    if (this.options.url == null) this.options.url = this.element.getAttribute("action");
    if (!this.options.url) throw new Error("No URL provided.");
    if (this.options.acceptedFiles && this.options.acceptedMimeTypes) throw new Error("You can't provide both 'acceptedFiles' and 'acceptedMimeTypes'. 'acceptedMimeTypes' is deprecated.");
    if (this.options.uploadMultiple && this.options.chunking) throw new Error("You cannot set both: uploadMultiple and chunking.");
    if (this.options.binaryBody && this.options.uploadMultiple) throw new Error("You cannot set both: binaryBody and uploadMultiple.");
    if (this.options.acceptedMimeTypes) {
      this.options.acceptedFiles = this.options.acceptedMimeTypes;
      delete this.options.acceptedMimeTypes;
    }
    if (this.options.renameFilename != null) this.options.renameFile = (file2) => this.options.renameFilename.call(this, file2.name, file2);
    if (typeof this.options.method === "string") this.options.method = this.options.method.toUpperCase();
    if ((fallback = this.getExistingFallback()) && fallback.parentNode)
      fallback.parentNode.removeChild(fallback);
    if (this.options.previewsContainer !== false) {
      if (this.options.previewsContainer) this.previewsContainer = _$3ed269f2f0fb224b$export$2e2bcd8739ae039.getElement(this.options.previewsContainer, "previewsContainer");
      else this.previewsContainer = this.element;
    }
    if (this.options.clickable) {
      if (this.options.clickable === true) this.clickableElements = [
        this.element
      ];
      else this.clickableElements = _$3ed269f2f0fb224b$export$2e2bcd8739ae039.getElements(this.options.clickable, "clickable");
    }
    this.init();
  }
};
$3ed269f2f0fb224b$export$2e2bcd8739ae039.initClass();
$3ed269f2f0fb224b$export$2e2bcd8739ae039.options = {};
$3ed269f2f0fb224b$export$2e2bcd8739ae039.optionsForElement = function(element) {
  if (element.getAttribute("id")) return $3ed269f2f0fb224b$export$2e2bcd8739ae039.options[$3ed269f2f0fb224b$var$camelize(element.getAttribute("id"))];
  else return void 0;
};
$3ed269f2f0fb224b$export$2e2bcd8739ae039.instances = [];
$3ed269f2f0fb224b$export$2e2bcd8739ae039.forElement = function(element) {
  if (typeof element === "string") element = document.querySelector(element);
  if ((element != null ? element.dropzone : void 0) == null) throw new Error("No Dropzone found for given element. This is probably because you're trying to access it before Dropzone had the time to initialize. Use the `init` option to setup any additional observers on your Dropzone.");
  return element.dropzone;
};
$3ed269f2f0fb224b$export$2e2bcd8739ae039.discover = function() {
  let dropzones;
  if (document.querySelectorAll) dropzones = document.querySelectorAll(".dropzone");
  else {
    dropzones = [];
    let checkElements = (elements) => (() => {
      let result = [];
      for (let el of elements) if (/(^| )dropzone($| )/.test(el.className)) result.push(dropzones.push(el));
      else result.push(void 0);
      return result;
    })();
    checkElements(document.getElementsByTagName("div"));
    checkElements(document.getElementsByTagName("form"));
  }
  return (() => {
    let result = [];
    for (let dropzone of dropzones)
      if ($3ed269f2f0fb224b$export$2e2bcd8739ae039.optionsForElement(dropzone) !== false) result.push(new $3ed269f2f0fb224b$export$2e2bcd8739ae039(dropzone));
      else result.push(void 0);
    return result;
  })();
};
$3ed269f2f0fb224b$export$2e2bcd8739ae039.blockedBrowsers = [
  // The mac os and windows phone version of opera 12 seems to have a problem with the File drag'n'drop API.
  /opera.*(Macintosh|Windows Phone).*version\/12/i
];
$3ed269f2f0fb224b$export$2e2bcd8739ae039.isBrowserSupported = function() {
  let capableBrowser = true;
  if (window.File && window.FileReader && window.FileList && window.Blob && window.FormData && document.querySelector) {
    if (!("classList" in document.createElement("a"))) capableBrowser = false;
    else {
      if ($3ed269f2f0fb224b$export$2e2bcd8739ae039.blacklistedBrowsers !== void 0)
        $3ed269f2f0fb224b$export$2e2bcd8739ae039.blockedBrowsers = $3ed269f2f0fb224b$export$2e2bcd8739ae039.blacklistedBrowsers;
      for (let regex of $3ed269f2f0fb224b$export$2e2bcd8739ae039.blockedBrowsers) if (regex.test(navigator.userAgent)) {
        capableBrowser = false;
        continue;
      }
    }
  } else capableBrowser = false;
  return capableBrowser;
};
$3ed269f2f0fb224b$export$2e2bcd8739ae039.dataURItoBlob = function(dataURI) {
  let byteString = atob(dataURI.split(",")[1]);
  let mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  let ab = new ArrayBuffer(byteString.length);
  let ia = new Uint8Array(ab);
  for (let i = 0, end = byteString.length, asc = 0 <= end; asc ? i <= end : i >= end; asc ? i++ : i--) ia[i] = byteString.charCodeAt(i);
  return new Blob([
    ab
  ], {
    type: mimeString
  });
};
var $3ed269f2f0fb224b$var$without = (list, rejectedItem) => list.filter(
  (item) => item !== rejectedItem
).map(
  (item) => item
);
var $3ed269f2f0fb224b$var$camelize = (str) => str.replace(
  /[\-_](\w)/g,
  (match) => match.charAt(1).toUpperCase()
);
$3ed269f2f0fb224b$export$2e2bcd8739ae039.createElement = function(string) {
  let div = document.createElement("div");
  div.innerHTML = string;
  return div.childNodes[0];
};
$3ed269f2f0fb224b$export$2e2bcd8739ae039.elementInside = function(element, container) {
  if (element === container) return true;
  while (element = element.parentNode) {
    if (element === container) return true;
  }
  return false;
};
$3ed269f2f0fb224b$export$2e2bcd8739ae039.getElement = function(el, name3) {
  let element;
  if (typeof el === "string") element = document.querySelector(el);
  else if (el.nodeType != null) element = el;
  if (element == null) throw new Error(`Invalid \`${name3}\` option provided. Please provide a CSS selector or a plain HTML element.`);
  return element;
};
$3ed269f2f0fb224b$export$2e2bcd8739ae039.getElements = function(els, name3) {
  let el, elements;
  if (els instanceof Array) {
    elements = [];
    try {
      for (el of els) elements.push(this.getElement(el, name3));
    } catch (e) {
      elements = null;
    }
  } else if (typeof els === "string") {
    elements = [];
    for (el of document.querySelectorAll(els)) elements.push(el);
  } else if (els.nodeType != null) elements = [
    els
  ];
  if (elements == null || !elements.length) throw new Error(`Invalid \`${name3}\` option provided. Please provide a CSS selector, a plain HTML element or a list of those.`);
  return elements;
};
$3ed269f2f0fb224b$export$2e2bcd8739ae039.confirm = function(question, accepted, rejected2) {
  if (window.confirm(question)) return accepted();
  else if (rejected2 != null) return rejected2();
};
$3ed269f2f0fb224b$export$2e2bcd8739ae039.isValidFile = function(file2, acceptedFiles) {
  if (!acceptedFiles) return true;
  acceptedFiles = acceptedFiles.split(",");
  let mimeType = file2.type;
  let baseMimeType = mimeType.replace(/\/.*$/, "");
  for (let validType of acceptedFiles) {
    validType = validType.trim();
    if (validType.charAt(0) === ".") {
      if (file2.name.toLowerCase().indexOf(validType.toLowerCase(), file2.name.length - validType.length) !== -1) return true;
    } else if (/\/\*$/.test(validType)) {
      if (baseMimeType === validType.replace(/\/.*$/, "")) return true;
    } else {
      if (mimeType === validType) return true;
    }
  }
  return false;
};
if (typeof jQuery !== "undefined" && jQuery !== null) jQuery.fn.dropzone = function(options) {
  return this.each(function() {
    return new $3ed269f2f0fb224b$export$2e2bcd8739ae039(this, options);
  });
};
$3ed269f2f0fb224b$export$2e2bcd8739ae039.ADDED = "added";
$3ed269f2f0fb224b$export$2e2bcd8739ae039.QUEUED = "queued";
$3ed269f2f0fb224b$export$2e2bcd8739ae039.ACCEPTED = $3ed269f2f0fb224b$export$2e2bcd8739ae039.QUEUED;
$3ed269f2f0fb224b$export$2e2bcd8739ae039.UPLOADING = "uploading";
$3ed269f2f0fb224b$export$2e2bcd8739ae039.PROCESSING = $3ed269f2f0fb224b$export$2e2bcd8739ae039.UPLOADING;
$3ed269f2f0fb224b$export$2e2bcd8739ae039.CANCELED = "canceled";
$3ed269f2f0fb224b$export$2e2bcd8739ae039.ERROR = "error";
$3ed269f2f0fb224b$export$2e2bcd8739ae039.SUCCESS = "success";
var $3ed269f2f0fb224b$var$detectVerticalSquash = function(img) {
  let iw = img.naturalWidth;
  let ih = img.naturalHeight;
  let canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = ih;
  let ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  let { data } = ctx.getImageData(1, 0, 1, ih);
  let sy = 0;
  let ey = ih;
  let py = ih;
  while (py > sy) {
    let alpha = data[(py - 1) * 4 + 3];
    if (alpha === 0) ey = py;
    else sy = py;
    py = ey + sy >> 1;
  }
  let ratio = py / ih;
  if (ratio === 0) return 1;
  else return ratio;
};
var $3ed269f2f0fb224b$var$drawImageIOSFix = function(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
  let vertSquashRatio = $3ed269f2f0fb224b$var$detectVerticalSquash(img);
  return ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh / vertSquashRatio);
};
var $3ed269f2f0fb224b$var$ExifRestore = class {
  static initClass() {
    this.KEY_STR = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  }
  static encode64(input) {
    let output = "";
    let chr1 = void 0;
    let chr2 = void 0;
    let chr3 = "";
    let enc1 = void 0;
    let enc2 = void 0;
    let enc3 = void 0;
    let enc4 = "";
    let i = 0;
    while (true) {
      chr1 = input[i++];
      chr2 = input[i++];
      chr3 = input[i++];
      enc1 = chr1 >> 2;
      enc2 = (chr1 & 3) << 4 | chr2 >> 4;
      enc3 = (chr2 & 15) << 2 | chr3 >> 6;
      enc4 = chr3 & 63;
      if (isNaN(chr2)) enc3 = enc4 = 64;
      else if (isNaN(chr3)) enc4 = 64;
      output = output + this.KEY_STR.charAt(enc1) + this.KEY_STR.charAt(enc2) + this.KEY_STR.charAt(enc3) + this.KEY_STR.charAt(enc4);
      chr1 = chr2 = chr3 = "";
      enc1 = enc2 = enc3 = enc4 = "";
      if (!(i < input.length)) break;
    }
    return output;
  }
  static restore(origFileBase64, resizedFileBase64) {
    if (!origFileBase64.match("data:image/jpeg;base64,")) return resizedFileBase64;
    let rawImage = this.decode64(origFileBase64.replace("data:image/jpeg;base64,", ""));
    let segments = this.slice2Segments(rawImage);
    let image2 = this.exifManipulation(resizedFileBase64, segments);
    return `data:image/jpeg;base64,${this.encode64(image2)}`;
  }
  static exifManipulation(resizedFileBase64, segments) {
    let exifArray = this.getExifArray(segments);
    let newImageArray = this.insertExif(resizedFileBase64, exifArray);
    let aBuffer = new Uint8Array(newImageArray);
    return aBuffer;
  }
  static getExifArray(segments) {
    let seg = void 0;
    let x = 0;
    while (x < segments.length) {
      seg = segments[x];
      if (seg[0] === 255 & seg[1] === 225) return seg;
      x++;
    }
    return [];
  }
  static insertExif(resizedFileBase64, exifArray) {
    let imageData = resizedFileBase64.replace("data:image/jpeg;base64,", "");
    let buf = this.decode64(imageData);
    let separatePoint = buf.indexOf(255, 3);
    let mae = buf.slice(0, separatePoint);
    let ato = buf.slice(separatePoint);
    let array = mae;
    array = array.concat(exifArray);
    array = array.concat(ato);
    return array;
  }
  static slice2Segments(rawImageArray) {
    let head = 0;
    let segments = [];
    while (true) {
      var length;
      if (rawImageArray[head] === 255 & rawImageArray[head + 1] === 218) break;
      if (rawImageArray[head] === 255 & rawImageArray[head + 1] === 216) head += 2;
      else {
        length = rawImageArray[head + 2] * 256 + rawImageArray[head + 3];
        let endPoint = head + length + 2;
        let seg = rawImageArray.slice(head, endPoint);
        segments.push(seg);
        head = endPoint;
      }
      if (head > rawImageArray.length) break;
    }
    return segments;
  }
  static decode64(input) {
    let output = "";
    let chr1 = void 0;
    let chr2 = void 0;
    let chr3 = "";
    let enc1 = void 0;
    let enc2 = void 0;
    let enc3 = void 0;
    let enc4 = "";
    let i = 0;
    let buf = [];
    let base64test = /[^A-Za-z0-9\+\/\=]/g;
    if (base64test.exec(input)) console.warn("There were invalid base64 characters in the input text.\nValid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\nExpect errors in decoding.");
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (true) {
      enc1 = this.KEY_STR.indexOf(input.charAt(i++));
      enc2 = this.KEY_STR.indexOf(input.charAt(i++));
      enc3 = this.KEY_STR.indexOf(input.charAt(i++));
      enc4 = this.KEY_STR.indexOf(input.charAt(i++));
      chr1 = enc1 << 2 | enc2 >> 4;
      chr2 = (enc2 & 15) << 4 | enc3 >> 2;
      chr3 = (enc3 & 3) << 6 | enc4;
      buf.push(chr1);
      if (enc3 !== 64) buf.push(chr2);
      if (enc4 !== 64) buf.push(chr3);
      chr1 = chr2 = chr3 = "";
      enc1 = enc2 = enc3 = enc4 = "";
      if (!(i < input.length)) break;
    }
    return buf;
  }
};
$3ed269f2f0fb224b$var$ExifRestore.initClass();
function $3ed269f2f0fb224b$var$__guard__(value, transform) {
  return typeof value !== "undefined" && value !== null ? transform(value) : void 0;
}
function $3ed269f2f0fb224b$var$__guardMethod__(obj, methodName, transform) {
  if (typeof obj !== "undefined" && obj !== null && typeof obj[methodName] === "function") return transform(obj, methodName);
  else return void 0;
}

// app/javascript/controllers/dropzone_controller.js
var import_cropperjs = __toESM(require_cropper());

// node_modules/stimulus/dist/stimulus.js
function camelize3(value) {
  return value.replace(/(?:[_-])([a-z0-9])/g, (_, char) => char.toUpperCase());
}
function namespaceCamelize2(value) {
  return camelize3(value.replace(/--/g, "-").replace(/__/g, "_"));
}
function capitalize2(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
function dasherize2(value) {
  return value.replace(/([A-Z])/g, (_, char) => `-${char.toLowerCase()}`);
}
function isSomething2(object) {
  return object !== null && object !== void 0;
}
function hasProperty2(object, property) {
  return Object.prototype.hasOwnProperty.call(object, property);
}
function readInheritableStaticArrayValues2(constructor, propertyName) {
  const ancestors = getAncestorsForConstructor2(constructor);
  return Array.from(ancestors.reduce((values, constructor2) => {
    getOwnStaticArrayValues2(constructor2, propertyName).forEach((name3) => values.add(name3));
    return values;
  }, /* @__PURE__ */ new Set()));
}
function readInheritableStaticObjectPairs2(constructor, propertyName) {
  const ancestors = getAncestorsForConstructor2(constructor);
  return ancestors.reduce((pairs, constructor2) => {
    pairs.push(...getOwnStaticObjectPairs2(constructor2, propertyName));
    return pairs;
  }, []);
}
function getAncestorsForConstructor2(constructor) {
  const ancestors = [];
  while (constructor) {
    ancestors.push(constructor);
    constructor = Object.getPrototypeOf(constructor);
  }
  return ancestors.reverse();
}
function getOwnStaticArrayValues2(constructor, propertyName) {
  const definition = constructor[propertyName];
  return Array.isArray(definition) ? definition : [];
}
function getOwnStaticObjectPairs2(constructor, propertyName) {
  const definition = constructor[propertyName];
  return definition ? Object.keys(definition).map((key) => [key, definition[key]]) : [];
}
var getOwnKeys2 = (() => {
  if (typeof Object.getOwnPropertySymbols == "function") {
    return (object) => [...Object.getOwnPropertyNames(object), ...Object.getOwnPropertySymbols(object)];
  } else {
    return Object.getOwnPropertyNames;
  }
})();
var extend6 = (() => {
  function extendWithReflect(constructor) {
    function extended() {
      return Reflect.construct(constructor, arguments, new.target);
    }
    extended.prototype = Object.create(constructor.prototype, {
      constructor: { value: extended }
    });
    Reflect.setPrototypeOf(extended, constructor);
    return extended;
  }
  function testReflectExtension() {
    const a = function() {
      this.a.call(this);
    };
    const b = extendWithReflect(a);
    b.prototype.a = function() {
    };
    return new b();
  }
  try {
    testReflectExtension();
    return extendWithReflect;
  } catch (error3) {
    return (constructor) => class extended extends constructor {
    };
  }
})();
var defaultSchema3 = {
  controllerAttribute: "data-controller",
  actionAttribute: "data-action",
  targetAttribute: "data-target",
  targetAttributeForScope: (identifier) => `data-${identifier}-target`,
  outletAttributeForScope: (identifier, outlet) => `data-${identifier}-${outlet}-outlet`,
  keyMappings: Object.assign(Object.assign({ enter: "Enter", tab: "Tab", esc: "Escape", space: " ", up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight", home: "Home", end: "End", page_up: "PageUp", page_down: "PageDown" }, objectFromEntries2("abcdefghijklmnopqrstuvwxyz".split("").map((c) => [c, c]))), objectFromEntries2("0123456789".split("").map((n) => [n, n])))
};
function objectFromEntries2(array) {
  return array.reduce((memo, [k, v]) => Object.assign(Object.assign({}, memo), { [k]: v }), {});
}
function ClassPropertiesBlessing2(constructor) {
  const classes = readInheritableStaticArrayValues2(constructor, "classes");
  return classes.reduce((properties, classDefinition) => {
    return Object.assign(properties, propertiesForClassDefinition2(classDefinition));
  }, {});
}
function propertiesForClassDefinition2(key) {
  return {
    [`${key}Class`]: {
      get() {
        const { classes } = this;
        if (classes.has(key)) {
          return classes.get(key);
        } else {
          const attribute = classes.getAttributeName(key);
          throw new Error(`Missing attribute "${attribute}"`);
        }
      }
    },
    [`${key}Classes`]: {
      get() {
        return this.classes.getAll(key);
      }
    },
    [`has${capitalize2(key)}Class`]: {
      get() {
        return this.classes.has(key);
      }
    }
  };
}
function OutletPropertiesBlessing2(constructor) {
  const outlets = readInheritableStaticArrayValues2(constructor, "outlets");
  return outlets.reduce((properties, outletDefinition) => {
    return Object.assign(properties, propertiesForOutletDefinition2(outletDefinition));
  }, {});
}
function getOutletController2(controller, element, identifier) {
  return controller.application.getControllerForElementAndIdentifier(element, identifier);
}
function getControllerAndEnsureConnectedScope2(controller, element, outletName) {
  let outletController = getOutletController2(controller, element, outletName);
  if (outletController)
    return outletController;
  controller.application.router.proposeToConnectScopeForElementAndIdentifier(element, outletName);
  outletController = getOutletController2(controller, element, outletName);
  if (outletController)
    return outletController;
}
function propertiesForOutletDefinition2(name3) {
  const camelizedName = namespaceCamelize2(name3);
  return {
    [`${camelizedName}Outlet`]: {
      get() {
        const outletElement = this.outlets.find(name3);
        const selector = this.outlets.getSelectorForOutletName(name3);
        if (outletElement) {
          const outletController = getControllerAndEnsureConnectedScope2(this, outletElement, name3);
          if (outletController)
            return outletController;
          throw new Error(`The provided outlet element is missing an outlet controller "${name3}" instance for host controller "${this.identifier}"`);
        }
        throw new Error(`Missing outlet element "${name3}" for host controller "${this.identifier}". Stimulus couldn't find a matching outlet element using selector "${selector}".`);
      }
    },
    [`${camelizedName}Outlets`]: {
      get() {
        const outlets = this.outlets.findAll(name3);
        if (outlets.length > 0) {
          return outlets.map((outletElement) => {
            const outletController = getControllerAndEnsureConnectedScope2(this, outletElement, name3);
            if (outletController)
              return outletController;
            console.warn(`The provided outlet element is missing an outlet controller "${name3}" instance for host controller "${this.identifier}"`, outletElement);
          }).filter((controller) => controller);
        }
        return [];
      }
    },
    [`${camelizedName}OutletElement`]: {
      get() {
        const outletElement = this.outlets.find(name3);
        const selector = this.outlets.getSelectorForOutletName(name3);
        if (outletElement) {
          return outletElement;
        } else {
          throw new Error(`Missing outlet element "${name3}" for host controller "${this.identifier}". Stimulus couldn't find a matching outlet element using selector "${selector}".`);
        }
      }
    },
    [`${camelizedName}OutletElements`]: {
      get() {
        return this.outlets.findAll(name3);
      }
    },
    [`has${capitalize2(camelizedName)}Outlet`]: {
      get() {
        return this.outlets.has(name3);
      }
    }
  };
}
function TargetPropertiesBlessing2(constructor) {
  const targets = readInheritableStaticArrayValues2(constructor, "targets");
  return targets.reduce((properties, targetDefinition) => {
    return Object.assign(properties, propertiesForTargetDefinition2(targetDefinition));
  }, {});
}
function propertiesForTargetDefinition2(name3) {
  return {
    [`${name3}Target`]: {
      get() {
        const target = this.targets.find(name3);
        if (target) {
          return target;
        } else {
          throw new Error(`Missing target element "${name3}" for "${this.identifier}" controller`);
        }
      }
    },
    [`${name3}Targets`]: {
      get() {
        return this.targets.findAll(name3);
      }
    },
    [`has${capitalize2(name3)}Target`]: {
      get() {
        return this.targets.has(name3);
      }
    }
  };
}
function ValuePropertiesBlessing2(constructor) {
  const valueDefinitionPairs = readInheritableStaticObjectPairs2(constructor, "values");
  const propertyDescriptorMap = {
    valueDescriptorMap: {
      get() {
        return valueDefinitionPairs.reduce((result, valueDefinitionPair) => {
          const valueDescriptor = parseValueDefinitionPair2(valueDefinitionPair, this.identifier);
          const attributeName = this.data.getAttributeNameForKey(valueDescriptor.key);
          return Object.assign(result, { [attributeName]: valueDescriptor });
        }, {});
      }
    }
  };
  return valueDefinitionPairs.reduce((properties, valueDefinitionPair) => {
    return Object.assign(properties, propertiesForValueDefinitionPair2(valueDefinitionPair));
  }, propertyDescriptorMap);
}
function propertiesForValueDefinitionPair2(valueDefinitionPair, controller) {
  const definition = parseValueDefinitionPair2(valueDefinitionPair, controller);
  const { key, name: name3, reader: read, writer: write } = definition;
  return {
    [name3]: {
      get() {
        const value = this.data.get(key);
        if (value !== null) {
          return read(value);
        } else {
          return definition.defaultValue;
        }
      },
      set(value) {
        if (value === void 0) {
          this.data.delete(key);
        } else {
          this.data.set(key, write(value));
        }
      }
    },
    [`has${capitalize2(name3)}`]: {
      get() {
        return this.data.has(key) || definition.hasCustomDefaultValue;
      }
    }
  };
}
function parseValueDefinitionPair2([token, typeDefinition], controller) {
  return valueDescriptorForTokenAndTypeDefinition2({
    controller,
    token,
    typeDefinition
  });
}
function parseValueTypeConstant2(constant) {
  switch (constant) {
    case Array:
      return "array";
    case Boolean:
      return "boolean";
    case Number:
      return "number";
    case Object:
      return "object";
    case String:
      return "string";
  }
}
function parseValueTypeDefault2(defaultValue) {
  switch (typeof defaultValue) {
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "string":
      return "string";
  }
  if (Array.isArray(defaultValue))
    return "array";
  if (Object.prototype.toString.call(defaultValue) === "[object Object]")
    return "object";
}
function parseValueTypeObject2(payload) {
  const { controller, token, typeObject } = payload;
  const hasType = isSomething2(typeObject.type);
  const hasDefault = isSomething2(typeObject.default);
  const fullObject = hasType && hasDefault;
  const onlyType = hasType && !hasDefault;
  const onlyDefault = !hasType && hasDefault;
  const typeFromObject = parseValueTypeConstant2(typeObject.type);
  const typeFromDefaultValue = parseValueTypeDefault2(payload.typeObject.default);
  if (onlyType)
    return typeFromObject;
  if (onlyDefault)
    return typeFromDefaultValue;
  if (typeFromObject !== typeFromDefaultValue) {
    const propertyPath = controller ? `${controller}.${token}` : token;
    throw new Error(`The specified default value for the Stimulus Value "${propertyPath}" must match the defined type "${typeFromObject}". The provided default value of "${typeObject.default}" is of type "${typeFromDefaultValue}".`);
  }
  if (fullObject)
    return typeFromObject;
}
function parseValueTypeDefinition2(payload) {
  const { controller, token, typeDefinition } = payload;
  const typeObject = { controller, token, typeObject: typeDefinition };
  const typeFromObject = parseValueTypeObject2(typeObject);
  const typeFromDefaultValue = parseValueTypeDefault2(typeDefinition);
  const typeFromConstant = parseValueTypeConstant2(typeDefinition);
  const type = typeFromObject || typeFromDefaultValue || typeFromConstant;
  if (type)
    return type;
  const propertyPath = controller ? `${controller}.${typeDefinition}` : token;
  throw new Error(`Unknown value type "${propertyPath}" for "${token}" value`);
}
function defaultValueForDefinition2(typeDefinition) {
  const constant = parseValueTypeConstant2(typeDefinition);
  if (constant)
    return defaultValuesByType2[constant];
  const hasDefault = hasProperty2(typeDefinition, "default");
  const hasType = hasProperty2(typeDefinition, "type");
  const typeObject = typeDefinition;
  if (hasDefault)
    return typeObject.default;
  if (hasType) {
    const { type } = typeObject;
    const constantFromType = parseValueTypeConstant2(type);
    if (constantFromType)
      return defaultValuesByType2[constantFromType];
  }
  return typeDefinition;
}
function valueDescriptorForTokenAndTypeDefinition2(payload) {
  const { token, typeDefinition } = payload;
  const key = `${dasherize2(token)}-value`;
  const type = parseValueTypeDefinition2(payload);
  return {
    type,
    key,
    name: camelize3(key),
    get defaultValue() {
      return defaultValueForDefinition2(typeDefinition);
    },
    get hasCustomDefaultValue() {
      return parseValueTypeDefault2(typeDefinition) !== void 0;
    },
    reader: readers2[type],
    writer: writers2[type] || writers2.default
  };
}
var defaultValuesByType2 = {
  get array() {
    return [];
  },
  boolean: false,
  number: 0,
  get object() {
    return {};
  },
  string: ""
};
var readers2 = {
  array(value) {
    const array = JSON.parse(value);
    if (!Array.isArray(array)) {
      throw new TypeError(`expected value of type "array" but instead got value "${value}" of type "${parseValueTypeDefault2(array)}"`);
    }
    return array;
  },
  boolean(value) {
    return !(value == "0" || String(value).toLowerCase() == "false");
  },
  number(value) {
    return Number(value.replace(/_/g, ""));
  },
  object(value) {
    const object = JSON.parse(value);
    if (object === null || typeof object != "object" || Array.isArray(object)) {
      throw new TypeError(`expected value of type "object" but instead got value "${value}" of type "${parseValueTypeDefault2(object)}"`);
    }
    return object;
  },
  string(value) {
    return value;
  }
};
var writers2 = {
  default: writeString2,
  array: writeJSON2,
  object: writeJSON2
};
function writeJSON2(value) {
  return JSON.stringify(value);
}
function writeString2(value) {
  return `${value}`;
}
var Controller2 = class {
  constructor(context) {
    this.context = context;
  }
  static get shouldLoad() {
    return true;
  }
  static afterLoad(_identifier, _application) {
    return;
  }
  get application() {
    return this.context.application;
  }
  get scope() {
    return this.context.scope;
  }
  get element() {
    return this.scope.element;
  }
  get identifier() {
    return this.scope.identifier;
  }
  get targets() {
    return this.scope.targets;
  }
  get outlets() {
    return this.scope.outlets;
  }
  get classes() {
    return this.scope.classes;
  }
  get data() {
    return this.scope.data;
  }
  initialize() {
  }
  connect() {
  }
  disconnect() {
  }
  dispatch(eventName, { target = this.element, detail = {}, prefix = this.identifier, bubbles = true, cancelable = true } = {}) {
    const type = prefix ? `${prefix}:${eventName}` : eventName;
    const event = new CustomEvent(type, { detail, bubbles, cancelable });
    target.dispatchEvent(event);
    return event;
  }
};
Controller2.blessings = [
  ClassPropertiesBlessing2,
  TargetPropertiesBlessing2,
  ValuePropertiesBlessing2,
  OutletPropertiesBlessing2
];
Controller2.targets = [];
Controller2.outlets = [];
Controller2.values = {};

// node_modules/@rails/activestorage/app/assets/javascripts/activestorage.esm.js
var sparkMd5 = {
  exports: {}
};
(function(module3, exports) {
  (function(factory) {
    {
      module3.exports = factory();
    }
  })((function(undefined$1) {
    var hex_chr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
    function md5cycle(x, k) {
      var a = x[0], b = x[1], c = x[2], d = x[3];
      a += (b & c | ~b & d) + k[0] - 680876936 | 0;
      a = (a << 7 | a >>> 25) + b | 0;
      d += (a & b | ~a & c) + k[1] - 389564586 | 0;
      d = (d << 12 | d >>> 20) + a | 0;
      c += (d & a | ~d & b) + k[2] + 606105819 | 0;
      c = (c << 17 | c >>> 15) + d | 0;
      b += (c & d | ~c & a) + k[3] - 1044525330 | 0;
      b = (b << 22 | b >>> 10) + c | 0;
      a += (b & c | ~b & d) + k[4] - 176418897 | 0;
      a = (a << 7 | a >>> 25) + b | 0;
      d += (a & b | ~a & c) + k[5] + 1200080426 | 0;
      d = (d << 12 | d >>> 20) + a | 0;
      c += (d & a | ~d & b) + k[6] - 1473231341 | 0;
      c = (c << 17 | c >>> 15) + d | 0;
      b += (c & d | ~c & a) + k[7] - 45705983 | 0;
      b = (b << 22 | b >>> 10) + c | 0;
      a += (b & c | ~b & d) + k[8] + 1770035416 | 0;
      a = (a << 7 | a >>> 25) + b | 0;
      d += (a & b | ~a & c) + k[9] - 1958414417 | 0;
      d = (d << 12 | d >>> 20) + a | 0;
      c += (d & a | ~d & b) + k[10] - 42063 | 0;
      c = (c << 17 | c >>> 15) + d | 0;
      b += (c & d | ~c & a) + k[11] - 1990404162 | 0;
      b = (b << 22 | b >>> 10) + c | 0;
      a += (b & c | ~b & d) + k[12] + 1804603682 | 0;
      a = (a << 7 | a >>> 25) + b | 0;
      d += (a & b | ~a & c) + k[13] - 40341101 | 0;
      d = (d << 12 | d >>> 20) + a | 0;
      c += (d & a | ~d & b) + k[14] - 1502002290 | 0;
      c = (c << 17 | c >>> 15) + d | 0;
      b += (c & d | ~c & a) + k[15] + 1236535329 | 0;
      b = (b << 22 | b >>> 10) + c | 0;
      a += (b & d | c & ~d) + k[1] - 165796510 | 0;
      a = (a << 5 | a >>> 27) + b | 0;
      d += (a & c | b & ~c) + k[6] - 1069501632 | 0;
      d = (d << 9 | d >>> 23) + a | 0;
      c += (d & b | a & ~b) + k[11] + 643717713 | 0;
      c = (c << 14 | c >>> 18) + d | 0;
      b += (c & a | d & ~a) + k[0] - 373897302 | 0;
      b = (b << 20 | b >>> 12) + c | 0;
      a += (b & d | c & ~d) + k[5] - 701558691 | 0;
      a = (a << 5 | a >>> 27) + b | 0;
      d += (a & c | b & ~c) + k[10] + 38016083 | 0;
      d = (d << 9 | d >>> 23) + a | 0;
      c += (d & b | a & ~b) + k[15] - 660478335 | 0;
      c = (c << 14 | c >>> 18) + d | 0;
      b += (c & a | d & ~a) + k[4] - 405537848 | 0;
      b = (b << 20 | b >>> 12) + c | 0;
      a += (b & d | c & ~d) + k[9] + 568446438 | 0;
      a = (a << 5 | a >>> 27) + b | 0;
      d += (a & c | b & ~c) + k[14] - 1019803690 | 0;
      d = (d << 9 | d >>> 23) + a | 0;
      c += (d & b | a & ~b) + k[3] - 187363961 | 0;
      c = (c << 14 | c >>> 18) + d | 0;
      b += (c & a | d & ~a) + k[8] + 1163531501 | 0;
      b = (b << 20 | b >>> 12) + c | 0;
      a += (b & d | c & ~d) + k[13] - 1444681467 | 0;
      a = (a << 5 | a >>> 27) + b | 0;
      d += (a & c | b & ~c) + k[2] - 51403784 | 0;
      d = (d << 9 | d >>> 23) + a | 0;
      c += (d & b | a & ~b) + k[7] + 1735328473 | 0;
      c = (c << 14 | c >>> 18) + d | 0;
      b += (c & a | d & ~a) + k[12] - 1926607734 | 0;
      b = (b << 20 | b >>> 12) + c | 0;
      a += (b ^ c ^ d) + k[5] - 378558 | 0;
      a = (a << 4 | a >>> 28) + b | 0;
      d += (a ^ b ^ c) + k[8] - 2022574463 | 0;
      d = (d << 11 | d >>> 21) + a | 0;
      c += (d ^ a ^ b) + k[11] + 1839030562 | 0;
      c = (c << 16 | c >>> 16) + d | 0;
      b += (c ^ d ^ a) + k[14] - 35309556 | 0;
      b = (b << 23 | b >>> 9) + c | 0;
      a += (b ^ c ^ d) + k[1] - 1530992060 | 0;
      a = (a << 4 | a >>> 28) + b | 0;
      d += (a ^ b ^ c) + k[4] + 1272893353 | 0;
      d = (d << 11 | d >>> 21) + a | 0;
      c += (d ^ a ^ b) + k[7] - 155497632 | 0;
      c = (c << 16 | c >>> 16) + d | 0;
      b += (c ^ d ^ a) + k[10] - 1094730640 | 0;
      b = (b << 23 | b >>> 9) + c | 0;
      a += (b ^ c ^ d) + k[13] + 681279174 | 0;
      a = (a << 4 | a >>> 28) + b | 0;
      d += (a ^ b ^ c) + k[0] - 358537222 | 0;
      d = (d << 11 | d >>> 21) + a | 0;
      c += (d ^ a ^ b) + k[3] - 722521979 | 0;
      c = (c << 16 | c >>> 16) + d | 0;
      b += (c ^ d ^ a) + k[6] + 76029189 | 0;
      b = (b << 23 | b >>> 9) + c | 0;
      a += (b ^ c ^ d) + k[9] - 640364487 | 0;
      a = (a << 4 | a >>> 28) + b | 0;
      d += (a ^ b ^ c) + k[12] - 421815835 | 0;
      d = (d << 11 | d >>> 21) + a | 0;
      c += (d ^ a ^ b) + k[15] + 530742520 | 0;
      c = (c << 16 | c >>> 16) + d | 0;
      b += (c ^ d ^ a) + k[2] - 995338651 | 0;
      b = (b << 23 | b >>> 9) + c | 0;
      a += (c ^ (b | ~d)) + k[0] - 198630844 | 0;
      a = (a << 6 | a >>> 26) + b | 0;
      d += (b ^ (a | ~c)) + k[7] + 1126891415 | 0;
      d = (d << 10 | d >>> 22) + a | 0;
      c += (a ^ (d | ~b)) + k[14] - 1416354905 | 0;
      c = (c << 15 | c >>> 17) + d | 0;
      b += (d ^ (c | ~a)) + k[5] - 57434055 | 0;
      b = (b << 21 | b >>> 11) + c | 0;
      a += (c ^ (b | ~d)) + k[12] + 1700485571 | 0;
      a = (a << 6 | a >>> 26) + b | 0;
      d += (b ^ (a | ~c)) + k[3] - 1894986606 | 0;
      d = (d << 10 | d >>> 22) + a | 0;
      c += (a ^ (d | ~b)) + k[10] - 1051523 | 0;
      c = (c << 15 | c >>> 17) + d | 0;
      b += (d ^ (c | ~a)) + k[1] - 2054922799 | 0;
      b = (b << 21 | b >>> 11) + c | 0;
      a += (c ^ (b | ~d)) + k[8] + 1873313359 | 0;
      a = (a << 6 | a >>> 26) + b | 0;
      d += (b ^ (a | ~c)) + k[15] - 30611744 | 0;
      d = (d << 10 | d >>> 22) + a | 0;
      c += (a ^ (d | ~b)) + k[6] - 1560198380 | 0;
      c = (c << 15 | c >>> 17) + d | 0;
      b += (d ^ (c | ~a)) + k[13] + 1309151649 | 0;
      b = (b << 21 | b >>> 11) + c | 0;
      a += (c ^ (b | ~d)) + k[4] - 145523070 | 0;
      a = (a << 6 | a >>> 26) + b | 0;
      d += (b ^ (a | ~c)) + k[11] - 1120210379 | 0;
      d = (d << 10 | d >>> 22) + a | 0;
      c += (a ^ (d | ~b)) + k[2] + 718787259 | 0;
      c = (c << 15 | c >>> 17) + d | 0;
      b += (d ^ (c | ~a)) + k[9] - 343485551 | 0;
      b = (b << 21 | b >>> 11) + c | 0;
      x[0] = a + x[0] | 0;
      x[1] = b + x[1] | 0;
      x[2] = c + x[2] | 0;
      x[3] = d + x[3] | 0;
    }
    function md5blk(s) {
      var md5blks = [], i;
      for (i = 0; i < 64; i += 4) {
        md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
      }
      return md5blks;
    }
    function md5blk_array(a) {
      var md5blks = [], i;
      for (i = 0; i < 64; i += 4) {
        md5blks[i >> 2] = a[i] + (a[i + 1] << 8) + (a[i + 2] << 16) + (a[i + 3] << 24);
      }
      return md5blks;
    }
    function md51(s) {
      var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i, length, tail, tmp, lo, hi;
      for (i = 64; i <= n; i += 64) {
        md5cycle(state, md5blk(s.substring(i - 64, i)));
      }
      s = s.substring(i - 64);
      length = s.length;
      tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (i = 0; i < length; i += 1) {
        tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
      }
      tail[i >> 2] |= 128 << (i % 4 << 3);
      if (i > 55) {
        md5cycle(state, tail);
        for (i = 0; i < 16; i += 1) {
          tail[i] = 0;
        }
      }
      tmp = n * 8;
      tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
      lo = parseInt(tmp[2], 16);
      hi = parseInt(tmp[1], 16) || 0;
      tail[14] = lo;
      tail[15] = hi;
      md5cycle(state, tail);
      return state;
    }
    function md51_array(a) {
      var n = a.length, state = [1732584193, -271733879, -1732584194, 271733878], i, length, tail, tmp, lo, hi;
      for (i = 64; i <= n; i += 64) {
        md5cycle(state, md5blk_array(a.subarray(i - 64, i)));
      }
      a = i - 64 < n ? a.subarray(i - 64) : new Uint8Array(0);
      length = a.length;
      tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (i = 0; i < length; i += 1) {
        tail[i >> 2] |= a[i] << (i % 4 << 3);
      }
      tail[i >> 2] |= 128 << (i % 4 << 3);
      if (i > 55) {
        md5cycle(state, tail);
        for (i = 0; i < 16; i += 1) {
          tail[i] = 0;
        }
      }
      tmp = n * 8;
      tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
      lo = parseInt(tmp[2], 16);
      hi = parseInt(tmp[1], 16) || 0;
      tail[14] = lo;
      tail[15] = hi;
      md5cycle(state, tail);
      return state;
    }
    function rhex(n) {
      var s = "", j;
      for (j = 0; j < 4; j += 1) {
        s += hex_chr[n >> j * 8 + 4 & 15] + hex_chr[n >> j * 8 & 15];
      }
      return s;
    }
    function hex(x) {
      var i;
      for (i = 0; i < x.length; i += 1) {
        x[i] = rhex(x[i]);
      }
      return x.join("");
    }
    if (hex(md51("hello")) !== "5d41402abc4b2a76b9719d911017c592") ;
    if (typeof ArrayBuffer !== "undefined" && !ArrayBuffer.prototype.slice) {
      (function() {
        function clamp(val, length) {
          val = val | 0 || 0;
          if (val < 0) {
            return Math.max(val + length, 0);
          }
          return Math.min(val, length);
        }
        ArrayBuffer.prototype.slice = function(from, to) {
          var length = this.byteLength, begin = clamp(from, length), end = length, num, target, targetArray, sourceArray;
          if (to !== undefined$1) {
            end = clamp(to, length);
          }
          if (begin > end) {
            return new ArrayBuffer(0);
          }
          num = end - begin;
          target = new ArrayBuffer(num);
          targetArray = new Uint8Array(target);
          sourceArray = new Uint8Array(this, begin, num);
          targetArray.set(sourceArray);
          return target;
        };
      })();
    }
    function toUtf8(str) {
      if (/[\u0080-\uFFFF]/.test(str)) {
        str = unescape(encodeURIComponent(str));
      }
      return str;
    }
    function utf8Str2ArrayBuffer(str, returnUInt8Array) {
      var length = str.length, buff = new ArrayBuffer(length), arr = new Uint8Array(buff), i;
      for (i = 0; i < length; i += 1) {
        arr[i] = str.charCodeAt(i);
      }
      return returnUInt8Array ? arr : buff;
    }
    function arrayBuffer2Utf8Str(buff) {
      return String.fromCharCode.apply(null, new Uint8Array(buff));
    }
    function concatenateArrayBuffers(first, second, returnUInt8Array) {
      var result = new Uint8Array(first.byteLength + second.byteLength);
      result.set(new Uint8Array(first));
      result.set(new Uint8Array(second), first.byteLength);
      return returnUInt8Array ? result : result.buffer;
    }
    function hexToBinaryString(hex2) {
      var bytes = [], length = hex2.length, x;
      for (x = 0; x < length - 1; x += 2) {
        bytes.push(parseInt(hex2.substr(x, 2), 16));
      }
      return String.fromCharCode.apply(String, bytes);
    }
    function SparkMD52() {
      this.reset();
    }
    SparkMD52.prototype.append = function(str) {
      this.appendBinary(toUtf8(str));
      return this;
    };
    SparkMD52.prototype.appendBinary = function(contents) {
      this._buff += contents;
      this._length += contents.length;
      var length = this._buff.length, i;
      for (i = 64; i <= length; i += 64) {
        md5cycle(this._hash, md5blk(this._buff.substring(i - 64, i)));
      }
      this._buff = this._buff.substring(i - 64);
      return this;
    };
    SparkMD52.prototype.end = function(raw) {
      var buff = this._buff, length = buff.length, i, tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ret;
      for (i = 0; i < length; i += 1) {
        tail[i >> 2] |= buff.charCodeAt(i) << (i % 4 << 3);
      }
      this._finish(tail, length);
      ret = hex(this._hash);
      if (raw) {
        ret = hexToBinaryString(ret);
      }
      this.reset();
      return ret;
    };
    SparkMD52.prototype.reset = function() {
      this._buff = "";
      this._length = 0;
      this._hash = [1732584193, -271733879, -1732584194, 271733878];
      return this;
    };
    SparkMD52.prototype.getState = function() {
      return {
        buff: this._buff,
        length: this._length,
        hash: this._hash.slice()
      };
    };
    SparkMD52.prototype.setState = function(state) {
      this._buff = state.buff;
      this._length = state.length;
      this._hash = state.hash;
      return this;
    };
    SparkMD52.prototype.destroy = function() {
      delete this._hash;
      delete this._buff;
      delete this._length;
    };
    SparkMD52.prototype._finish = function(tail, length) {
      var i = length, tmp, lo, hi;
      tail[i >> 2] |= 128 << (i % 4 << 3);
      if (i > 55) {
        md5cycle(this._hash, tail);
        for (i = 0; i < 16; i += 1) {
          tail[i] = 0;
        }
      }
      tmp = this._length * 8;
      tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
      lo = parseInt(tmp[2], 16);
      hi = parseInt(tmp[1], 16) || 0;
      tail[14] = lo;
      tail[15] = hi;
      md5cycle(this._hash, tail);
    };
    SparkMD52.hash = function(str, raw) {
      return SparkMD52.hashBinary(toUtf8(str), raw);
    };
    SparkMD52.hashBinary = function(content, raw) {
      var hash = md51(content), ret = hex(hash);
      return raw ? hexToBinaryString(ret) : ret;
    };
    SparkMD52.ArrayBuffer = function() {
      this.reset();
    };
    SparkMD52.ArrayBuffer.prototype.append = function(arr) {
      var buff = concatenateArrayBuffers(this._buff.buffer, arr, true), length = buff.length, i;
      this._length += arr.byteLength;
      for (i = 64; i <= length; i += 64) {
        md5cycle(this._hash, md5blk_array(buff.subarray(i - 64, i)));
      }
      this._buff = i - 64 < length ? new Uint8Array(buff.buffer.slice(i - 64)) : new Uint8Array(0);
      return this;
    };
    SparkMD52.ArrayBuffer.prototype.end = function(raw) {
      var buff = this._buff, length = buff.length, tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], i, ret;
      for (i = 0; i < length; i += 1) {
        tail[i >> 2] |= buff[i] << (i % 4 << 3);
      }
      this._finish(tail, length);
      ret = hex(this._hash);
      if (raw) {
        ret = hexToBinaryString(ret);
      }
      this.reset();
      return ret;
    };
    SparkMD52.ArrayBuffer.prototype.reset = function() {
      this._buff = new Uint8Array(0);
      this._length = 0;
      this._hash = [1732584193, -271733879, -1732584194, 271733878];
      return this;
    };
    SparkMD52.ArrayBuffer.prototype.getState = function() {
      var state = SparkMD52.prototype.getState.call(this);
      state.buff = arrayBuffer2Utf8Str(state.buff);
      return state;
    };
    SparkMD52.ArrayBuffer.prototype.setState = function(state) {
      state.buff = utf8Str2ArrayBuffer(state.buff, true);
      return SparkMD52.prototype.setState.call(this, state);
    };
    SparkMD52.ArrayBuffer.prototype.destroy = SparkMD52.prototype.destroy;
    SparkMD52.ArrayBuffer.prototype._finish = SparkMD52.prototype._finish;
    SparkMD52.ArrayBuffer.hash = function(arr, raw) {
      var hash = md51_array(new Uint8Array(arr)), ret = hex(hash);
      return raw ? hexToBinaryString(ret) : ret;
    };
    return SparkMD52;
  }));
})(sparkMd5);
var SparkMD5 = sparkMd5.exports;
var fileSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
var FileChecksum = class _FileChecksum {
  static create(file2, callback) {
    const instance = new _FileChecksum(file2);
    instance.create(callback);
  }
  constructor(file2) {
    this.file = file2;
    this.chunkSize = 2097152;
    this.chunkCount = Math.ceil(this.file.size / this.chunkSize);
    this.chunkIndex = 0;
  }
  create(callback) {
    this.callback = callback;
    this.md5Buffer = new SparkMD5.ArrayBuffer();
    this.fileReader = new FileReader();
    this.fileReader.addEventListener("load", ((event) => this.fileReaderDidLoad(event)));
    this.fileReader.addEventListener("error", ((event) => this.fileReaderDidError(event)));
    this.readNextChunk();
  }
  fileReaderDidLoad(event) {
    this.md5Buffer.append(event.target.result);
    if (!this.readNextChunk()) {
      const binaryDigest = this.md5Buffer.end(true);
      const base64digest = btoa(binaryDigest);
      this.callback(null, base64digest);
    }
  }
  fileReaderDidError(event) {
    this.callback(`Error reading ${this.file.name}`);
  }
  readNextChunk() {
    if (this.chunkIndex < this.chunkCount || this.chunkIndex == 0 && this.chunkCount == 0) {
      const start3 = this.chunkIndex * this.chunkSize;
      const end = Math.min(start3 + this.chunkSize, this.file.size);
      const bytes = fileSlice.call(this.file, start3, end);
      this.fileReader.readAsArrayBuffer(bytes);
      this.chunkIndex++;
      return true;
    } else {
      return false;
    }
  }
};
function getMetaValue(name3) {
  const element = findElement(document.head, `meta[name="${name3}"]`);
  if (element) {
    return element.getAttribute("content");
  }
}
function findElements(root, selector) {
  if (typeof root == "string") {
    selector = root;
    root = document;
  }
  const elements = root.querySelectorAll(selector);
  return toArray(elements);
}
function findElement(root, selector) {
  if (typeof root == "string") {
    selector = root;
    root = document;
  }
  return root.querySelector(selector);
}
function dispatchEvent2(element, type, eventInit = {}) {
  const { disabled } = element;
  const { bubbles, cancelable, detail } = eventInit;
  const event = document.createEvent("Event");
  event.initEvent(type, bubbles || true, cancelable || true);
  event.detail = detail || {};
  try {
    element.disabled = false;
    element.dispatchEvent(event);
  } finally {
    element.disabled = disabled;
  }
  return event;
}
function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  } else if (Array.from) {
    return Array.from(value);
  } else {
    return [].slice.call(value);
  }
}
var BlobRecord = class {
  constructor(file2, checksum, url, customHeaders = {}) {
    this.file = file2;
    this.attributes = {
      filename: file2.name,
      content_type: file2.type || "application/octet-stream",
      byte_size: file2.size,
      checksum
    };
    this.xhr = new XMLHttpRequest();
    this.xhr.open("POST", url, true);
    this.xhr.responseType = "json";
    this.xhr.setRequestHeader("Content-Type", "application/json");
    this.xhr.setRequestHeader("Accept", "application/json");
    this.xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    Object.keys(customHeaders).forEach(((headerKey) => {
      this.xhr.setRequestHeader(headerKey, customHeaders[headerKey]);
    }));
    const csrfToken = getMetaValue("csrf-token");
    if (csrfToken != void 0) {
      this.xhr.setRequestHeader("X-CSRF-Token", csrfToken);
    }
    this.xhr.addEventListener("load", ((event) => this.requestDidLoad(event)));
    this.xhr.addEventListener("error", ((event) => this.requestDidError(event)));
  }
  get status() {
    return this.xhr.status;
  }
  get response() {
    const { responseType, response: response2 } = this.xhr;
    if (responseType == "json") {
      return response2;
    } else {
      return JSON.parse(response2);
    }
  }
  create(callback) {
    this.callback = callback;
    this.xhr.send(JSON.stringify({
      blob: this.attributes
    }));
  }
  requestDidLoad(event) {
    if (this.status >= 200 && this.status < 300) {
      const { response: response2 } = this;
      const { direct_upload } = response2;
      delete response2.direct_upload;
      this.attributes = response2;
      this.directUploadData = direct_upload;
      this.callback(null, this.toJSON());
    } else {
      this.requestDidError(event);
    }
  }
  requestDidError(event) {
    this.callback(`Error creating Blob for "${this.file.name}". Status: ${this.status}`);
  }
  toJSON() {
    const result = {};
    for (const key in this.attributes) {
      result[key] = this.attributes[key];
    }
    return result;
  }
};
var BlobUpload = class {
  constructor(blob) {
    this.blob = blob;
    this.file = blob.file;
    const { url, headers } = blob.directUploadData;
    this.xhr = new XMLHttpRequest();
    this.xhr.open("PUT", url, true);
    this.xhr.responseType = "text";
    for (const key in headers) {
      this.xhr.setRequestHeader(key, headers[key]);
    }
    this.xhr.addEventListener("load", ((event) => this.requestDidLoad(event)));
    this.xhr.addEventListener("error", ((event) => this.requestDidError(event)));
  }
  create(callback) {
    this.callback = callback;
    this.xhr.send(this.file.slice());
  }
  requestDidLoad(event) {
    const { status, response: response2 } = this.xhr;
    if (status >= 200 && status < 300) {
      this.callback(null, response2);
    } else {
      this.requestDidError(event);
    }
  }
  requestDidError(event) {
    this.callback(`Error storing "${this.file.name}". Status: ${this.xhr.status}`);
  }
};
var id = 0;
var DirectUpload = class {
  constructor(file2, url, delegate, customHeaders = {}) {
    this.id = ++id;
    this.file = file2;
    this.url = url;
    this.delegate = delegate;
    this.customHeaders = customHeaders;
  }
  create(callback) {
    FileChecksum.create(this.file, ((error3, checksum) => {
      if (error3) {
        callback(error3);
        return;
      }
      const blob = new BlobRecord(this.file, checksum, this.url, this.customHeaders);
      notify(this.delegate, "directUploadWillCreateBlobWithXHR", blob.xhr);
      blob.create(((error4) => {
        if (error4) {
          callback(error4);
        } else {
          const upload = new BlobUpload(blob);
          notify(this.delegate, "directUploadWillStoreFileWithXHR", upload.xhr);
          upload.create(((error5) => {
            if (error5) {
              callback(error5);
            } else {
              callback(null, blob.toJSON());
            }
          }));
        }
      }));
    }));
  }
};
function notify(object, methodName, ...messages) {
  if (object && typeof object[methodName] == "function") {
    return object[methodName](...messages);
  }
}
var DirectUploadController = class {
  constructor(input, file2) {
    this.input = input;
    this.file = file2;
    this.directUpload = new DirectUpload(this.file, this.url, this);
    this.dispatch("initialize");
  }
  start(callback) {
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.name = this.input.name;
    this.input.insertAdjacentElement("beforebegin", hiddenInput);
    this.dispatch("start");
    this.directUpload.create(((error3, attributes) => {
      if (error3) {
        hiddenInput.parentNode.removeChild(hiddenInput);
        this.dispatchError(error3);
      } else {
        hiddenInput.value = attributes.signed_id;
      }
      this.dispatch("end");
      callback(error3);
    }));
  }
  uploadRequestDidProgress(event) {
    const progress2 = event.loaded / event.total * 100;
    if (progress2) {
      this.dispatch("progress", {
        progress: progress2
      });
    }
  }
  get url() {
    return this.input.getAttribute("data-direct-upload-url");
  }
  dispatch(name3, detail = {}) {
    detail.file = this.file;
    detail.id = this.directUpload.id;
    return dispatchEvent2(this.input, `direct-upload:${name3}`, {
      detail
    });
  }
  dispatchError(error3) {
    const event = this.dispatch("error", {
      error: error3
    });
    if (!event.defaultPrevented) {
      alert(error3);
    }
  }
  directUploadWillCreateBlobWithXHR(xhr) {
    this.dispatch("before-blob-request", {
      xhr
    });
  }
  directUploadWillStoreFileWithXHR(xhr) {
    this.dispatch("before-storage-request", {
      xhr
    });
    xhr.upload.addEventListener("progress", ((event) => this.uploadRequestDidProgress(event)));
  }
};
var inputSelector = "input[type=file][data-direct-upload-url]:not([disabled])";
var DirectUploadsController = class {
  constructor(form) {
    this.form = form;
    this.inputs = findElements(form, inputSelector).filter(((input) => input.files.length));
  }
  start(callback) {
    const controllers = this.createDirectUploadControllers();
    const startNextController = () => {
      const controller = controllers.shift();
      if (controller) {
        controller.start(((error3) => {
          if (error3) {
            callback(error3);
            this.dispatch("end");
          } else {
            startNextController();
          }
        }));
      } else {
        callback();
        this.dispatch("end");
      }
    };
    this.dispatch("start");
    startNextController();
  }
  createDirectUploadControllers() {
    const controllers = [];
    this.inputs.forEach(((input) => {
      toArray(input.files).forEach(((file2) => {
        const controller = new DirectUploadController(input, file2);
        controllers.push(controller);
      }));
    }));
    return controllers;
  }
  dispatch(name3, detail = {}) {
    return dispatchEvent2(this.form, `direct-uploads:${name3}`, {
      detail
    });
  }
};
var processingAttribute = "data-direct-uploads-processing";
var submitButtonsByForm = /* @__PURE__ */ new WeakMap();
var started = false;
function start2() {
  if (!started) {
    started = true;
    document.addEventListener("click", didClick, true);
    document.addEventListener("submit", didSubmitForm, true);
    document.addEventListener("ajax:before", didSubmitRemoteElement);
  }
}
function didClick(event) {
  const button = event.target.closest("button, input");
  if (button && button.type === "submit" && button.form) {
    submitButtonsByForm.set(button.form, button);
  }
}
function didSubmitForm(event) {
  handleFormSubmissionEvent(event);
}
function didSubmitRemoteElement(event) {
  if (event.target.tagName == "FORM") {
    handleFormSubmissionEvent(event);
  }
}
function handleFormSubmissionEvent(event) {
  const form = event.target;
  if (form.hasAttribute(processingAttribute)) {
    event.preventDefault();
    return;
  }
  const controller = new DirectUploadsController(form);
  const { inputs } = controller;
  if (inputs.length) {
    event.preventDefault();
    form.setAttribute(processingAttribute, "");
    inputs.forEach(disable);
    controller.start(((error3) => {
      form.removeAttribute(processingAttribute);
      if (error3) {
        inputs.forEach(enable);
      } else {
        submitForm(form);
      }
    }));
  }
}
function submitForm(form) {
  let button = submitButtonsByForm.get(form) || findElement(form, "input[type=submit], button[type=submit]");
  if (button) {
    const { disabled } = button;
    button.disabled = false;
    button.focus();
    button.click();
    button.disabled = disabled;
  } else {
    button = document.createElement("input");
    button.type = "submit";
    button.style.display = "none";
    form.appendChild(button);
    button.click();
    form.removeChild(button);
  }
  submitButtonsByForm.delete(form);
}
function disable(input) {
  input.disabled = true;
}
function enable(input) {
  input.disabled = false;
}
function autostart() {
  if (window.ActiveStorage) {
    start2();
  }
}
setTimeout(autostart, 1);

// app/javascript/helpers/index.js
function getMetaValue2(name3) {
  const element = findElement2(document.head, `meta[name="${name3}"]`);
  if (element) {
    return element.getAttribute("content");
  }
}
function findElement2(root, selector) {
  if (typeof root == "string") {
    selector = root;
    root = document;
  }
  return root.querySelector(selector);
}
function removeElement(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}
function insertAfter(el, referenceNode) {
  return referenceNode.parentNode.insertBefore(el, referenceNode.nextSibling);
}

// app/javascript/controllers/dropzone_controller.js
var dropzone_controller_default = class extends Controller2 {
  static targets = ["input"];
  cropped = false;
  connect() {
    console.log("ocnnected dropzone");
    this.dropZone = createDropZone(this);
    this.hideFileInput();
    this.bindEvents();
    $3ed269f2f0fb224b$export$2e2bcd8739ae039.autoDiscover = false;
  }
  // Private
  hideFileInput() {
    this.inputTarget.disabled = true;
    this.inputTarget.style.display = "none";
  }
  bindEvents() {
    this.dropZone.on("processing", (file2) => {
      this.toggleSubmitButton(false);
    });
    this.dropZone.on("addedfile", (file2) => {
      this.toggleSubmitButton(false);
      setTimeout(() => {
        if (this.element.hasAttribute("data-crop-image") && !this.cropped) {
          this.initializeCropper(file2, this.element.getAttribute("data-crop-image-aspect-ratio"), this.element.getAttribute("data-crop-image-width"), this.element.getAttribute("data-crop-image-height"));
        } else {
          this.startUpload(file2);
        }
      }, 400);
    });
    this.dropZone.on("removedfile", (file2) => {
      if (this.cropped == true) {
        this.cropped = false;
      }
      file2.controller && removeElement(file2.controller.hiddenInput);
    });
    this.dropZone.on("canceled", (file2) => {
      file2.controller && file2.controller.xhr.abort();
    });
    this.dropZone.on("complete", (file2) => {
      this.toggleSubmitButton(true);
    });
    this.dropZone.uploadFiles = this.fakeUploadProgress.bind(this.dropZone);
  }
  initializeCropper(file, aspectRatio = "1 / 1", width = 500, height = 500) {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const image = new Image();
      image.src = fileReader.result;
      const cropModal = document.createElement("div");
      cropModal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/60";
      cropModal.innerHTML = `
        <div class="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl">
          <div id="cropperImageContainer" class="max-h-[70vh] overflow-hidden bg-slate-100">
            <img id="cropperImage" class="block h-full w-full object-contain" src="${image.src}" alt="Cropper preview" />
          </div>
          <div class="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4">
            <button id="crop-cancel-button" type="button" class="inline-flex items-center justify-center rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Cancel</button>
            <button id="crop-save-button" type="button" class="inline-flex items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Crop</button>
          </div>
        </div>
      `;
      document.body.style.overflow = "hidden";
      document.body.appendChild(cropModal);
      const cropperImage = document.getElementById("cropperImage");
      let cropper;
      const aspect = aspectRatio ? aspectRatio.includes("/") ? eval(aspectRatio) : parseFloat(aspectRatio) : 1;
      setTimeout(() => {
        const containerRect = document.getElementById("cropperImageContainer").getBoundingClientRect();
        cropper = new import_cropperjs.default(cropperImage, {
          aspectRatio: aspect,
          viewMode: 1,
          rotatable: false,
          cropBoxMovable: false,
          cropBoxResizable: false,
          dragMode: "move",
          guides: false,
          responsive: true,
          minContainerWidth: containerRect.width,
          minContainerHeight: containerRect.height
        });
      }, 200);
      const closeModal = () => {
        cropper && cropper.destroy();
        if (cropModal.parentNode) {
          cropModal.parentNode.removeChild(cropModal);
        }
        document.body.style.overflow = "";
      };
      cropModal.querySelector("#crop-cancel-button").addEventListener("click", () => {
        this.cropped = false;
        closeModal();
      });
      cropModal.querySelector("#crop-save-button").addEventListener("click", () => {
        cropper.getCroppedCanvas({ width, height }).toBlob((blob) => {
          const croppedFile = new File([blob], file.name, { type: "image/jpeg" });
          this.dropZone.removeFile(file);
          const addedFile = this.dropZone.addFile(croppedFile);
          if (addedFile && addedFile[0]) {
            this.dropZone.emit("thumbnail", addedFile[0], URL.createObjectURL(croppedFile));
          }
          this.cropped = true;
          closeModal();
        }, "image/jpeg");
      });
    };
    fileReader.readAsDataURL(file);
  }
  startUpload(file2) {
    file2.accepted && createDirectUploadController(this, file2).start();
  }
  toggleSubmitButton(enable2) {
    const submitButton = this.element.closest("form")?.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = !enable2;
    }
  }
  fakeUploadProgress(files3) {
    files3.forEach((file2) => {
      const minSteps = 6;
      const maxSteps = 60;
      const timeBetweenSteps = 100;
      const bytesPerStep = 1e5;
      const totalSteps = Math.round(Math.min(maxSteps, Math.max(minSteps, file2.size / bytesPerStep)));
      for (let step = 0; step < totalSteps; step++) {
        const duration2 = timeBetweenSteps * (step + 1);
        setTimeout(() => {
          file2.upload = {
            progress: 100 * (step + 1) / totalSteps,
            total: file2.size,
            bytesSent: (step + 1) * file2.size / totalSteps
          };
          this.emit("uploadprogress", file2, file2.upload.progress, file2.upload.bytesSent);
          if (file2.upload.progress === 100) {
            file2.status = $3ed269f2f0fb224b$export$2e2bcd8739ae039.SUCCESS;
            this.emit("success", file2, "success", null);
            this.emit("complete", file2);
            this.processQueue();
          }
        }, duration2);
      }
    });
  }
  get headers() {
    return { "X-CSRF-Token": getMetaValue2("csrf-token") };
  }
  get url() {
    return this.inputTarget.getAttribute("data-direct-upload-url");
  }
  get maxFiles() {
    return this.data.get("maxFiles") || 1;
  }
  get maxFileSize() {
    return this.data.get("maxFileSize") || 256;
  }
  get acceptedFiles() {
    return this.data.get("acceptedFiles");
  }
  get addRemoveLinks() {
    return this.data.get("addRemoveLinks") || true;
  }
};
var DirectUploadController2 = class {
  constructor(source, file2) {
    this.directUpload = createDirectUpload(file2, source.url, this);
    this.source = source;
    this.file = file2;
  }
  start() {
    this.file.controller = this;
    this.hiddenInput = this.createHiddenInput();
    this.directUpload.create((error3, attributes) => {
      if (error3) {
        removeElement(this.hiddenInput);
        this.emitDropzoneError(error3);
      } else {
        this.hiddenInput.value = attributes.signed_id;
        this.emitDropzoneSuccess();
      }
    });
  }
  createHiddenInput() {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = this.source.inputTarget.name;
    insertAfter(input, this.source.inputTarget);
    return input;
  }
  directUploadWillStoreFileWithXHR(xhr) {
    this.bindProgressEvent(xhr);
    this.emitDropzoneUploading();
  }
  bindProgressEvent(xhr) {
    this.xhr = xhr;
    this.xhr.upload.addEventListener(
      "progress",
      (event) => this.uploadRequestDidProgress(event)
    );
  }
  uploadRequestDidProgress(event) {
    const element = this.source.element;
    const progress2 = event.loaded / event.total * 100;
    findElement2(
      this.file.previewTemplate,
      ".dz-upload"
    ).style.width = `${progress2}%`;
  }
  emitDropzoneUploading() {
    this.file.status = $3ed269f2f0fb224b$export$2e2bcd8739ae039.UPLOADING;
    this.source.dropZone.emit("processing", this.file);
  }
  emitDropzoneError(error3) {
    this.file.status = $3ed269f2f0fb224b$export$2e2bcd8739ae039.ERROR;
    this.source.dropZone.emit("error", this.file, error3);
    this.source.dropZone.emit("complete", this.file);
  }
  emitDropzoneSuccess() {
    this.file.status = $3ed269f2f0fb224b$export$2e2bcd8739ae039.SUCCESS;
    this.source.dropZone.emit("success", this.file);
    this.source.dropZone.emit("complete", this.file);
  }
};
function createDirectUploadController(source, file2) {
  return new DirectUploadController2(source, file2);
}
function createDirectUpload(file2, url, controller) {
  return new DirectUpload(file2, url, controller);
}
function createDropZone(controller) {
  return new $3ed269f2f0fb224b$export$2e2bcd8739ae039(controller.element, {
    url: controller.url,
    headers: controller.headers,
    maxFiles: controller.maxFiles,
    maxFilesize: controller.maxFileSize,
    acceptedFiles: controller.acceptedFiles,
    addRemoveLinks: controller.addRemoveLinks,
    autoQueue: false
  });
}

// app/javascript/controllers/club_questions_controller.js
var club_questions_controller_default = class extends Controller {
  static targets = ["list", "template", "emptyState", "options"];
  connect() {
    this.updateEmptyState();
    this.refreshOptionVisibility();
  }
  add(event) {
    event.preventDefault();
    const uniqueId = this.generateUniqueId();
    const templateContent = this.templateTarget.innerHTML.replace(/NEW_RECORD/g, uniqueId);
    this.listTarget.insertAdjacentHTML("beforeend", templateContent);
    this.updateEmptyState();
    this.refreshOptionVisibility();
  }
  remove(event) {
    event.preventDefault();
    const wrapper = event.target.closest("[data-club-questions-item]");
    if (!wrapper) return;
    const destroyInput = wrapper.querySelector("input[name$='[_destroy]']");
    const isNewRecord = wrapper.dataset.newRecord === "true";
    if (destroyInput && !isNewRecord) {
      destroyInput.value = "1";
      wrapper.classList.add("hidden");
    } else {
      wrapper.remove();
    }
    this.updateEmptyState();
    this.refreshOptionVisibility();
  }
  updateEmptyState() {
    if (!this.hasEmptyStateTarget) return;
    const visibleItems = this.listTarget.querySelectorAll("[data-club-questions-item]:not(.hidden)");
    this.emptyStateTarget.classList.toggle("hidden", visibleItems.length > 0);
  }
  handleTypeChange(event) {
    const wrapper = event.target.closest("[data-club-questions-item]");
    if (!wrapper) return;
    this.toggleOptionsVisibility(wrapper, event.target.value);
  }
  refreshOptionVisibility() {
    const items = this.listTarget.querySelectorAll("[data-club-questions-item]");
    items.forEach((item) => {
      const select = item.querySelector("select[name$='[answer_type]']");
      if (select) {
        this.toggleOptionsVisibility(item, select.value);
      }
    });
  }
  toggleOptionsVisibility(wrapper, answerType) {
    const optionsContainer = wrapper.querySelector("[data-club-questions-target='options']");
    if (!optionsContainer) return;
    const choiceTypes = (optionsContainer.dataset.choiceTypes || "").split(/\s+/).map((type) => type.trim()).filter(Boolean);
    const shouldShow = choiceTypes.includes(answerType);
    optionsContainer.classList.toggle("hidden", !shouldShow);
  }
  generateUniqueId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}${Math.floor(Math.random() * 1e3)}`;
  }
};

// app/javascript/controllers/membership_question_form_controller.js
var membership_question_form_controller_default = class extends Controller {
  static targets = ["answerType", "choiceFields"];
  static values = { choiceTypes: Array };
  connect() {
    this.toggle();
  }
  toggle() {
    if (!this.hasAnswerTypeTarget || !this.hasChoiceFieldsTarget) return;
    const selectedType = this.answerTypeTarget.value;
    const shouldShow = this.choiceTypesValue.includes(selectedType);
    this.choiceFieldsTarget.classList.toggle("hidden", !shouldShow);
  }
};

// app/javascript/controllers/modal_controller.js
var modal_controller_default = class extends Controller {
  static targets = ["wrapper", "frame", "title"];
  connect() {
    if (this.hasTitleTarget) {
      this.defaultTitle = this.titleTarget.textContent;
    }
  }
  open(event) {
    event.preventDefault();
    this.previousFocus = document.activeElement;
    const url = event.currentTarget?.dataset.modalUrl;
    const title = event.currentTarget?.dataset.modalTitle;
    if (title && this.hasTitleTarget) {
      this.titleTarget.textContent = title;
    } else {
      this.resetTitle();
    }
    this.show();
    if (url) {
      this.loadFrame(url);
    }
  }
  close(event) {
    if (event) event.preventDefault();
    if (!this.hasWrapperTarget) return;
    this.wrapperTarget.classList.add("hidden");
    this.wrapperTarget.setAttribute("aria-hidden", "true");
    document.body.classList.remove("overflow-hidden");
    this.clearFrame();
    if (this.previousFocus && typeof this.previousFocus.focus === "function") {
      this.previousFocus.focus();
    }
    this.previousFocus = null;
    this.resetTitle();
  }
  handleSubmitEnd(event) {
    if (!event.detail.success) return;
    if (!this.hasWrapperTarget || this.wrapperTarget.classList.contains("hidden")) return;
    if (this.shouldIgnoreSubmit(event)) return;
    this.close();
  }
  show() {
    if (!this.hasWrapperTarget) return;
    this.wrapperTarget.classList.remove("hidden");
    this.wrapperTarget.setAttribute("aria-hidden", "false");
    document.body.classList.add("overflow-hidden");
    this.wrapperTarget.focus();
    const initialFocus = this.wrapperTarget.querySelector("[data-modal-initial-focus]");
    if (initialFocus) {
      initialFocus.focus();
    }
  }
  loadFrame(url) {
    if (!this.hasFrameTarget) return;
    const current = this.frameTarget.getAttribute("src");
    const frameId = this.frameTarget.id;
    const finalUrl = this.buildUrlWithFrame(url, frameId);
    if (current === finalUrl) {
      this.frameTarget.removeAttribute("src");
      this.frameTarget.innerHTML = "";
    }
    this.frameTarget.src = finalUrl;
  }
  clearFrame() {
    if (!this.hasFrameTarget) return;
    this.frameTarget.innerHTML = "";
    this.frameTarget.removeAttribute("src");
  }
  disconnect() {
    document.body.classList.remove("overflow-hidden");
  }
  buildUrlWithFrame(url, frameId) {
    try {
      const fullUrl = new URL(url, window.location.href);
      if (frameId) {
        fullUrl.searchParams.set("frame_id", frameId);
      }
      return fullUrl.toString();
    } catch (_error) {
      if (!frameId) return url;
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}frame_id=${encodeURIComponent(frameId)}`;
    }
  }
  resetTitle() {
    if (!this.hasTitleTarget) return;
    if (!this.defaultTitle) {
      this.defaultTitle = this.titleTarget.textContent;
    }
    this.titleTarget.textContent = this.defaultTitle;
  }
  shouldIgnoreSubmit(event) {
    const form = event.target;
    if (!form) return false;
    if (form.dataset.modalStay === "true") return true;
    if (form.closest("[data-modal-stay]")) return true;
    return false;
  }
};

// app/javascript/controllers/memberships_selection_controller.js
var memberships_selection_controller_default = class extends Controller {
  static targets = ["club", "continue", "list"];
  static values = {
    selectedClass: String,
    selectedId: String,
    selectedName: String
  };
  connect() {
    this.restoreSelection();
    this.updateState();
  }
  choose(event) {
    event.preventDefault();
    const button = event.currentTarget;
    this.selectedIdValue = button.dataset.clubId;
    this.selectedNameValue = button.dataset.clubName;
    this.highlightSelection(button);
    this.updateState();
  }
  continue(event) {
    if (!this.hasSelectedIdValue) {
      event.preventDefault();
      return;
    }
    this.dispatch("club-selected", {
      detail: {
        clubId: this.selectedIdValue,
        clubName: this.selectedNameValue
      }
    });
  }
  highlightSelection(selectedButton) {
    if (!this.hasClubTarget) return;
    const classes = this.selectedClasses();
    this.clubTargets.forEach((button) => {
      button.classList.remove(...classes);
    });
    selectedButton.classList.add(...classes);
  }
  updateState() {
    if (this.hasContinueTarget) {
      this.continueTarget.disabled = !this.hasSelectedIdValue;
    }
  }
  selectedClasses() {
    return (this.selectedClassValue || "border-slate-900 ring-2 ring-slate-200 shadow-md").split(/\s+/).filter(Boolean);
  }
  restoreSelection() {
    if (!this.hasSelectedIdValue || !this.hasClubTarget) return;
    const selectedButton = this.clubTargets.find((button) => button.dataset.clubId === this.selectedIdValue);
    if (!selectedButton) return;
    if (!this.hasSelectedNameValue || !this.selectedNameValue) {
      this.selectedNameValue = selectedButton.dataset.clubName;
    }
    this.highlightSelection(selectedButton);
  }
};

// app/javascript/controllers/membership_start_controller.js
var membership_start_controller_default = class extends Controller {
  static values = { url: String };
  begin(event) {
    const { clubId } = event.detail || {};
    if (!clubId) return;
    const basePath = this.urlValue || "/members/membership_registration";
    const url = new URL(basePath, window.location.origin);
    url.searchParams.set("club_id", clubId);
    url.searchParams.set("step", "personal");
    url.searchParams.set("restart", "true");
    window.location = url.toString();
  }
};

// app/javascript/controllers/sa_id_controller.js
var sa_id_controller_default = class extends Controller {
  static targets = ["input", "gender", "nationality", "dateOfBirth"];
  connect() {
    this.update();
  }
  inputTargetConnected() {
    this.inputTarget.addEventListener("input", () => this.update());
  }
  update() {
    if (!this.hasInputTarget) return;
    const cleaned = this.inputTarget.value.replace(/\D/g, "");
    if (cleaned.length !== 13) {
      this.clearDerivedFields();
      return;
    }
    const yy = parseInt(cleaned.slice(0, 2), 10);
    const mm = parseInt(cleaned.slice(2, 4), 10);
    const dd = parseInt(cleaned.slice(4, 6), 10);
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear() % 100;
    const century = yy > currentYear ? 1900 : 2e3;
    const birthDate = new Date(century + yy, mm - 1, dd);
    if (Number.isNaN(birthDate.getTime())) {
      this.clearDerivedFields();
      return;
    }
    const genderCode = parseInt(cleaned.slice(6, 10), 10);
    const nationalityCode = parseInt(cleaned.slice(10, 11), 10);
    if (this.hasGenderTarget) {
      const genderValue = genderCode >= 5e3 ? "Male" : "Female";
      this.genderTarget.value = genderValue;
    }
    if (this.hasNationalityTarget) {
      this.nationalityTarget.value = nationalityCode === 0 ? "South African" : "Non-South African";
    }
    if (this.hasDateOfBirthTarget) {
      const formatted = birthDate.toISOString().split("T")[0];
      this.dateOfBirthTarget.value = formatted;
    }
  }
  clearDerivedFields() {
    if (this.hasGenderTarget) this.genderTarget.value = "";
    if (this.hasNationalityTarget) this.nationalityTarget.value = "";
    if (this.hasDateOfBirthTarget) this.dateOfBirthTarget.value = "";
  }
};

// app/javascript/controllers/payment_method_controller.js
var payment_method_controller_default = class extends Controller {
  static targets = ["newCardSection", "tokenizeToggle", "sourceInput", "methodInput", "option", "cvvSection", "cvvInput"];
  static values = { selection: String };
  connect() {
    if (!this.selectionValue) {
      this.selectionValue = this.hasSourceInputTarget ? this.sourceInputTarget.value : "new";
    }
    this.toggle();
    const initialMethodId = this.hasMethodInputTarget ? this.methodInputTarget.value : "";
    this.highlightSelection(this.selectionValue, initialMethodId);
    this.updateCvvSections(this.selectionValue === "saved" ? initialMethodId : null);
  }
  choose(event) {
    const selection = event.params.selection;
    const methodId = event.params.id || "";
    this.selectionValue = selection;
    if (this.hasSourceInputTarget) {
      this.sourceInputTarget.value = selection;
    }
    if (this.hasMethodInputTarget) {
      this.methodInputTarget.value = selection === "saved" ? methodId : "";
    }
    this.toggle();
    this.highlightSelection(selection, selection === "saved" ? methodId : "");
    this.updateCvvSections(selection === "saved" ? methodId : null);
  }
  refresh() {
    let selection = "new";
    let methodId = "";
    let checked = this.element.querySelector("input[name='checkout[payment_option]']:checked");
    if (!checked) {
      const fallbackSaved = this.element.querySelector("input[name='checkout[payment_option]'][data-payment-method-selection-param='saved']");
      if (fallbackSaved) {
        fallbackSaved.checked = true;
        checked = fallbackSaved;
      }
    }
    if (checked) {
      selection = checked.dataset.paymentMethodSelectionParam || (checked.value === "new" ? "new" : "saved");
      methodId = checked.dataset.paymentMethodIdParam || (selection === "saved" ? checked.value : "");
    } else {
      const newCardRadio = this.element.querySelector("input[name='checkout[payment_option]'][value='new']");
      if (newCardRadio) {
        newCardRadio.checked = true;
      }
    }
    this.selectionValue = selection;
    if (this.hasSourceInputTarget) {
      this.sourceInputTarget.value = selection;
    }
    if (this.hasMethodInputTarget) {
      this.methodInputTarget.value = selection === "saved" ? methodId : "";
    }
    this.toggle();
    this.highlightSelection(selection, selection === "saved" ? methodId : "");
    this.updateCvvSections(selection === "saved" ? methodId : null);
  }
  toggle() {
    if (this.hasNewCardSectionTarget) {
      this.newCardSectionTarget.classList.toggle("hidden", this.selectionValue !== "new");
    }
    if (this.hasTokenizeToggleTarget) {
      const disabled = this.selectionValue !== "new";
      this.tokenizeToggleTarget.disabled = disabled;
      if (disabled) {
        this.tokenizeToggleTarget.checked = false;
      }
    }
  }
  highlightSelection(selection, methodId) {
    if (!this.hasOptionTarget) return;
    this.optionTargets.forEach((label) => {
      const labelSelection = label.dataset.selection;
      const labelMethodId = label.dataset.methodId;
      const isActive = selection === "new" ? labelSelection === "new" : labelSelection === "saved" && labelMethodId === methodId;
      label.classList.toggle("border-slate-900", isActive);
      label.classList.toggle("border-slate-300", !isActive);
      label.classList.toggle("shadow-sm", isActive);
    });
  }
  updateCvvSections(selectedMethodId) {
    if (!this.hasCvvSectionTarget) return;
    this.cvvSectionTargets.forEach((section) => {
      const sectionMethodId = section.dataset.methodId;
      const isActive = selectedMethodId && sectionMethodId === selectedMethodId;
      section.classList.toggle("hidden", !isActive);
      const inputs = this.hasCvvInputTarget ? this.cvvInputTargets : [];
      const input = inputs.find((target) => target.dataset.methodId === sectionMethodId);
      if (input) {
        input.disabled = !isActive;
        if (!isActive) {
          input.value = "";
        }
        if (isActive) {
          requestAnimationFrame(() => {
            input.focus();
            input.select();
          });
        }
      }
    });
  }
};

// app/javascript/controllers/staggered_payment_plan_controller.js
var staggered_payment_plan_controller_default = class extends Controller {
  static targets = [
    "list",
    "template",
    "installment",
    "installmentLabel",
    "percentage",
    "position",
    "destroy",
    "totalDisplay",
    "submit"
  ];
  connect() {
    this.ensureAtLeastOneInstallment();
    this.renumber();
    this.recalculate();
  }
  addInstallment(event) {
    event.preventDefault();
    const templateContent = this.templateTarget?.innerHTML;
    if (!templateContent) return;
    const timestamp = Date.now().toString();
    const html = templateContent.replace(/NEW_RECORD/g, timestamp);
    this.listTarget.insertAdjacentHTML("beforeend", html);
    this.ensureAtLeastOneInstallment();
    requestAnimationFrame(() => {
      const newest = this.installmentTargets[this.installmentTargets.length - 1];
      this.prefillDueDate(newest);
      this.renumber();
      this.recalculate();
    });
  }
  removeInstallment(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const container = button.closest("[data-staggered-payment-plan-target='installment']");
    if (!container) return;
    if (this.activeInstallmentCount() <= 1) return;
    const destroyInput = container.querySelector("input[data-staggered-payment-plan-target='destroy']");
    const idInput = container.querySelector("input[name$='[id]']");
    if (idInput && idInput.value) {
      if (destroyInput) destroyInput.value = "1";
      container.classList.add("hidden");
      container.dataset.removed = "true";
    } else {
      container.remove();
    }
    requestAnimationFrame(() => {
      this.renumber();
      this.recalculate();
    });
  }
  recalculate() {
    let total = 0;
    this.percentageTargets.forEach((input) => {
      if (this.isActiveInput(input)) {
        const value = parseFloat(input.value);
        if (!Number.isNaN(value)) {
          total += value;
        }
      }
    });
    const totalRounded = Math.round((total + Number.EPSILON) * 100) / 100;
    if (this.hasTotalDisplayTarget) {
      this.totalDisplayTarget.textContent = `${totalRounded.toFixed(2)}%`;
      this.totalDisplayTarget.classList.toggle("bg-emerald-100", this.isValidTotal(totalRounded));
      this.totalDisplayTarget.classList.toggle("text-emerald-700", this.isValidTotal(totalRounded));
      this.totalDisplayTarget.classList.toggle("bg-rose-100", !this.isValidTotal(totalRounded));
      this.totalDisplayTarget.classList.toggle("text-rose-700", !this.isValidTotal(totalRounded));
    }
    if (this.hasSubmitTarget) {
      this.submitTarget.disabled = !this.isValidTotal(totalRounded);
      this.submitTarget.classList.toggle("opacity-60", !this.isValidTotal(totalRounded));
      this.submitTarget.classList.toggle("cursor-not-allowed", !this.isValidTotal(totalRounded));
    }
  }
  renumber() {
    let index = 1;
    this.installmentTargets.forEach((container) => {
      const destroyInput = container.querySelector("input[data-staggered-payment-plan-target='destroy']");
      const isHidden = container.classList.contains("hidden") || container.dataset.removed === "true";
      if (destroyInput && destroyInput.value === "1") return;
      if (isHidden) return;
      const label = container.querySelector("[data-staggered-payment-plan-target='installmentLabel']");
      if (label) {
        label.textContent = `Installment ${index}`;
      }
      const positionInput = container.querySelector("input[data-staggered-payment-plan-target='position']");
      if (positionInput) {
        positionInput.value = index - 1;
      }
      index += 1;
    });
  }
  handleSubmitEnd(event) {
    if (event?.detail?.success === false) {
      this.recalculate();
    }
  }
  // Private helpers
  ensureAtLeastOneInstallment() {
    if (this.installmentTargets.length === 0 && this.templateTarget) {
      const templateContent = this.templateTarget.innerHTML;
      const timestamp = Date.now().toString();
      const html = templateContent.replace(/NEW_RECORD/g, `${timestamp}-seed`);
      this.listTarget.insertAdjacentHTML("beforeend", html);
      requestAnimationFrame(() => {
        const newest = this.installmentTargets[this.installmentTargets.length - 1];
        this.prefillDueDate(newest);
      });
    }
  }
  activeInstallmentCount() {
    let count = 0;
    this.installmentTargets.forEach((container) => {
      const destroyInput = container.querySelector("input[data-staggered-payment-plan-target='destroy']");
      const hidden = container.classList.contains("hidden") || container.dataset.removed === "true";
      if (destroyInput && destroyInput.value === "1") {
        return;
      }
      if (!hidden) {
        count += 1;
      }
    });
    return count;
  }
  isActiveInput(input) {
    const container = input.closest("[data-staggered-payment-plan-target='installment']");
    if (!container) return false;
    const destroyInput = container.querySelector("input[data-staggered-payment-plan-target='destroy']");
    if (destroyInput && destroyInput.value === "1") return false;
    if (container.classList.contains("hidden") || container.dataset.removed === "true") return false;
    return true;
  }
  isValidTotal(total) {
    if (this.activeInstallmentCount() === 0) return false;
    return total > 0 && Math.abs(total - 100) <= 0.01;
  }
  prefillDueDate(container) {
    if (!container) return;
    const dueInput = container.querySelector("input[name$='[due_on]']");
    if (!dueInput || dueInput.value) return;
    const otherDueInputs = Array.from(this.element.querySelectorAll("input[name$='[due_on]']")).filter((input) => {
      if (input === dueInput || !input.value) return false;
      const container2 = input.closest("[data-staggered-payment-plan-target='installment']");
      if (!container2) return false;
      const destroyInput = container2.querySelector("input[data-staggered-payment-plan-target='destroy']");
      if (destroyInput && destroyInput.value === "1") return false;
      if (container2.classList.contains("hidden") || container2.dataset.removed === "true") return false;
      return true;
    });
    let baseDate;
    if (otherDueInputs.length > 0) {
      const latest = otherDueInputs.map((input) => new Date(input.value)).filter((date) => !Number.isNaN(date.getTime())).sort((a, b) => a - b).pop();
      baseDate = latest || /* @__PURE__ */ new Date();
      baseDate = this.addDays(baseDate, 28);
    } else {
      const startsOnField = this.element.querySelector("input[name='staggered_payment_plan[starts_on]']");
      if (startsOnField && startsOnField.value) {
        const startDate = new Date(startsOnField.value);
        baseDate = Number.isNaN(startDate.getTime()) ? /* @__PURE__ */ new Date() : startDate;
      } else {
        baseDate = /* @__PURE__ */ new Date();
      }
    }
    dueInput.value = this.formatDate(baseDate);
  }
  addDays(date, days) {
    const result = new Date(date.getTime());
    result.setDate(result.getDate() + days);
    return result;
  }
  formatDate(date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
};

// app/javascript/controllers/payment_plan_selector_controller.js
var payment_plan_selector_controller_default = class extends Controller {
  static targets = [
    "input",
    "modeField",
    "planField",
    "summary",
    "toggle"
  ];
  static values = {
    mode: String,
    planId: String,
    previewUrl: String
  };
  connect() {
    this.syncInitialSelection();
    this.updateSummary();
    this.lastPreviewSignature = this.signature();
  }
  select(event) {
    const input = event.currentTarget;
    const value = input.value;
    if (value === "full") {
      this.modeValue = "full";
      this.planIdValue = "";
    } else {
      this.modeValue = "staggered";
      this.planIdValue = input.dataset.planId || "";
    }
    this.applySelectionStyles();
    this.updateHiddenFields();
    this.updateSummary();
    this.requestPreview();
  }
  syncInitialSelection() {
    const mode = this.modeValue || this.modeFieldTarget?.value || "full";
    const planId = this.planIdValue || this.planFieldTarget?.value || "";
    this.inputs.forEach((input) => {
      const isFull = input.value === "full";
      const matches = mode === "full" && isFull || mode === "staggered" && !isFull && input.dataset.planId === planId;
      if (matches) {
        input.checked = true;
        this.modeValue = mode;
        this.planIdValue = planId;
      }
    });
    if (!this.modeValue) {
      this.modeValue = "full";
    }
    this.applySelectionStyles();
    this.updateHiddenFields();
    this.updateSummary();
    this.lastPreviewSignature = this.signature();
  }
  updateHiddenFields() {
    if (this.hasModeFieldTarget) {
      this.modeFieldTarget.value = this.modeValue || "full";
    }
    if (this.hasPlanFieldTarget) {
      this.planFieldTarget.value = this.modeValue === "staggered" ? this.planIdValue || "" : "";
    }
  }
  applySelectionStyles() {
    this.inputs.forEach((input) => {
      const container = input.closest("[data-payment-plan-selector-target='toggle']");
      if (!container) return;
      const isFull = input.value === "full";
      const isActive = this.modeValue === "full" && isFull || this.modeValue === "staggered" && !isFull && input.dataset.planId === this.planIdValue;
      container.classList.toggle("border-slate-900", isActive);
      container.classList.toggle("shadow-sm", isActive);
      container.classList.toggle("border-slate-300", !isActive);
    });
  }
  updateSummary() {
    if (!this.hasSummaryTarget) return;
    const activeInput = this.inputs.find((input) => input.checked);
    if (!activeInput) {
      this.summaryTarget.textContent = this.modeValue === "staggered" ? "Staggered payments selected" : "Pay in full";
      return;
    }
    const label = activeInput.dataset.summaryLabel || activeInput.dataset.label || activeInput.nextElementSibling?.textContent || "";
    this.summaryTarget.textContent = label.trim();
  }
  requestPreview() {
    if (!this.hasPreviewUrlValue) return;
    const signature = this.signature();
    if (signature === this.lastPreviewSignature) return;
    const url = new URL(this.previewUrlValue, window.location.origin);
    url.searchParams.set("preview_payment_mode", this.modeValue || "full");
    if ((this.modeValue || "full") === "staggered") {
      url.searchParams.set("preview_staggered_payment_plan_id", this.planIdValue || "");
    } else {
      url.searchParams.delete("preview_staggered_payment_plan_id");
    }
    this.lastPreviewSignature = signature;
    fetch(url.toString(), {
      headers: { Accept: "text/vnd.turbo-stream.html" },
      credentials: "include"
    }).then((response2) => {
      if (!response2.ok) throw new Error(`Preview request failed with status ${response2.status}`);
      return response2.text();
    }).then((html) => {
      if (window.Turbo && typeof window.Turbo.renderStreamMessage === "function") {
        window.Turbo.renderStreamMessage(html);
      }
    }).catch((error3) => {
      console.error(error3);
      this.lastPreviewSignature = null;
    });
  }
  signature() {
    const mode = this.modeValue || "full";
    const planId = mode === "staggered" ? this.planIdValue || "" : "";
    return `${mode}:${planId}`;
  }
  get inputs() {
    return this.inputTargets || [];
  }
};

// app/javascript/controllers/club_theme_color_controller.js
var club_theme_color_controller_default = class extends Controller {
  static targets = [
    "colorInput",
    "hexField",
    "oklchField",
    "oklchDisplay"
  ];
  connect() {
    const defaultHex = this.element.dataset.clubThemeColorDefaultHexValue || "";
    const storedOklch = this.oklchFieldTarget.value || this.element.dataset.clubThemeColorInitialOklchValue || "";
    if (storedOklch && !this.oklchFieldTarget.value) {
      this.oklchFieldTarget.value = storedOklch;
    }
    let hexCandidate = (this.hexFieldTarget.value || this.element.dataset.clubThemeColorInitialHexValue || "").trim();
    if (!hexCandidate && storedOklch) {
      const convertedHex = this.oklchToHex(storedOklch);
      if (convertedHex) {
        hexCandidate = convertedHex;
      }
    }
    if (!hexCandidate && defaultHex) {
      hexCandidate = defaultHex;
    }
    if (hexCandidate) {
      this.updateFromHex(hexCandidate);
    } else {
      this.renderDisplay();
    }
  }
  pick(event) {
    const hex = event.target.value;
    this.updateFromHex(hex);
  }
  oklchInput(event) {
    const value = event.target.value;
    this.oklchFieldTarget.value = value;
    const hex = this.oklchToHex(value);
    if (hex) {
      this.updateFromHex(hex);
    } else {
      this.renderDisplay();
    }
  }
  hexInput(event) {
    let value = event.target.value.trim();
    if (value && !value.startsWith("#")) {
      value = `#${value}`;
    }
    this.hexFieldTarget.value = value;
    if (value.length === 7) {
      this.updateFromHex(value);
    } else {
      this.renderDisplay();
    }
  }
  renderDisplay() {
    if (this.hasOklchDisplayTarget) {
      this.oklchDisplayTarget.textContent = this.oklchFieldTarget.value || "\u2014";
    }
  }
  hexToOklch(hex) {
    if (!hex || typeof hex !== "string") return null;
    const normalized = hex.trim().replace("#", "");
    if (normalized.length !== 6) return null;
    const r = parseInt(normalized.slice(0, 2), 16) / 255;
    const g = parseInt(normalized.slice(2, 4), 16) / 255;
    const b = parseInt(normalized.slice(4, 6), 16) / 255;
    const [lr, lg, lb] = [r, g, b].map(
      (v) => v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    );
    const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
    const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
    const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);
    const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
    const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
    const bVal = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
    const C = Math.sqrt(a * a + bVal * bVal);
    let H = Math.atan2(bVal, a) * 180 / Math.PI;
    if (H < 0) H += 360;
    return `oklch(${this.formatNumber(L)} ${this.formatNumber(C)} ${this.formatNumber(H, 2)})`;
  }
  oklchToHex(oklchString) {
    if (!oklchString || typeof oklchString !== "string") return null;
    const parsed = this.parseOklch(oklchString);
    if (!parsed) return null;
    const { l, c, h } = parsed;
    const hr = h * Math.PI / 180;
    const a = Math.cos(hr) * c;
    const b = Math.sin(hr) * c;
    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.291485548 * b;
    const l3 = l_ * l_ * l_;
    const m3 = m_ * m_ * m_;
    const s3 = s_ * s_ * s_;
    let r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    let bVal = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;
    r = this.linearToSrgb(r);
    g = this.linearToSrgb(g);
    bVal = this.linearToSrgb(bVal);
    return `#${this.toHex(r)}${this.toHex(g)}${this.toHex(bVal)}`;
  }
  updateFromHex(hex) {
    if (!hex) return;
    let formatted = hex.trim();
    if (!formatted) return;
    if (!formatted.startsWith("#")) {
      formatted = `#${formatted}`;
    }
    if (formatted.length === 7) {
      formatted = formatted.toUpperCase();
    }
    this.hexFieldTarget.value = formatted;
    if (this.colorInputTarget) {
      this.colorInputTarget.value = formatted;
    }
    const oklch = this.hexToOklch(formatted);
    if (oklch) {
      this.oklchFieldTarget.value = oklch;
    }
    this.renderDisplay();
  }
  parseOklch(value) {
    const cleaned = value.replace(/\s+/g, " ").trim();
    const match = cleaned.match(/^oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+)?\)$/i);
    if (!match) return null;
    const l = parseFloat(match[1]);
    const c = parseFloat(match[2]);
    const h = parseFloat(match[3]);
    if ([l, c, h].some((v) => Number.isNaN(v))) return null;
    return {
      l: this.clamp(l, 0, 1),
      c: Math.max(0, c),
      h: (h % 360 + 360) % 360
    };
  }
  linearToSrgb(value) {
    const v = this.clamp(value, 0, 1);
    if (v <= 31308e-7) {
      return 12.92 * v;
    }
    return 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  }
  formatNumber(number, precision = 4) {
    if (!Number.isFinite(number)) return "0";
    return Number(number.toFixed(precision)).toString();
  }
  toHex(component) {
    const value = Math.round(this.clamp(component, 0, 1) * 255);
    return value.toString(16).padStart(2, "0").toUpperCase();
  }
  clamp(value, min, max) {
    if (Number.isNaN(value)) return min;
    return Math.min(Math.max(value, min), max);
  }
};

// app/javascript/lib/country_codes.js
var countryCodes = [
  { name: "Afghanistan", dial_code: "+93", code: "AF", flag: "\u{1F1E6}\u{1F1EB}" },
  { name: "Albania", dial_code: "+355", code: "AL", flag: "\u{1F1E6}\u{1F1F1}" },
  { name: "Algeria", dial_code: "+213", code: "DZ", flag: "\u{1F1E9}\u{1F1FF}" },
  { name: "American Samoa", dial_code: "+1684", code: "AS", flag: "\u{1F1E6}\u{1F1F8}" },
  { name: "Andorra", dial_code: "+376", code: "AD", flag: "\u{1F1E6}\u{1F1E9}" },
  { name: "Angola", dial_code: "+244", code: "AO", flag: "\u{1F1E6}\u{1F1F4}" },
  { name: "Anguilla", dial_code: "+1264", code: "AI", flag: "\u{1F1E6}\u{1F1EE}" },
  { name: "Antigua and Barbuda", dial_code: "+1268", code: "AG", flag: "\u{1F1E6}\u{1F1EC}" },
  { name: "Argentina", dial_code: "+54", code: "AR", flag: "\u{1F1E6}\u{1F1F7}" },
  { name: "Armenia", dial_code: "+374", code: "AM", flag: "\u{1F1E6}\u{1F1F2}" },
  { name: "Aruba", dial_code: "+297", code: "AW", flag: "\u{1F1E6}\u{1F1FC}" },
  { name: "Australia", dial_code: "+61", code: "AU", flag: "\u{1F1E6}\u{1F1FA}" },
  { name: "Austria", dial_code: "+43", code: "AT", flag: "\u{1F1E6}\u{1F1F9}" },
  { name: "Azerbaijan", dial_code: "+994", code: "AZ", flag: "\u{1F1E6}\u{1F1FF}" },
  { name: "Bahamas", dial_code: "+1242", code: "BS", flag: "\u{1F1E7}\u{1F1F8}" },
  { name: "Bahrain", dial_code: "+973", code: "BH", flag: "\u{1F1E7}\u{1F1ED}" },
  { name: "Bangladesh", dial_code: "+880", code: "BD", flag: "\u{1F1E7}\u{1F1E9}" },
  { name: "Barbados", dial_code: "+1246", code: "BB", flag: "\u{1F1E7}\u{1F1E7}" },
  { name: "Belarus", dial_code: "+375", code: "BY", flag: "\u{1F1E7}\u{1F1FE}" },
  { name: "Belgium", dial_code: "+32", code: "BE", flag: "\u{1F1E7}\u{1F1EA}" },
  { name: "Belize", dial_code: "+501", code: "BZ", flag: "\u{1F1E7}\u{1F1FF}" },
  { name: "Benin", dial_code: "+229", code: "BJ", flag: "\u{1F1E7}\u{1F1EF}" },
  { name: "Bermuda", dial_code: "+1441", code: "BM", flag: "\u{1F1E7}\u{1F1F2}" },
  { name: "Bhutan", dial_code: "+975", code: "BT", flag: "\u{1F1E7}\u{1F1F9}" },
  { name: "Bolivia", dial_code: "+591", code: "BO", flag: "\u{1F1E7}\u{1F1F4}" },
  { name: "Bosnia and Herzegovina", dial_code: "+387", code: "BA", flag: "\u{1F1E7}\u{1F1E6}" },
  { name: "Botswana", dial_code: "+267", code: "BW", flag: "\u{1F1E7}\u{1F1FC}" },
  { name: "Brazil", dial_code: "+55", code: "BR", flag: "\u{1F1E7}\u{1F1F7}" },
  { name: "British Indian Ocean Territory", dial_code: "+246", code: "IO", flag: "\u{1F1EE}\u{1F1F4}" },
  { name: "British Virgin Islands", dial_code: "+1284", code: "VG", flag: "\u{1F1FB}\u{1F1EC}" },
  { name: "Brunei", dial_code: "+673", code: "BN", flag: "\u{1F1E7}\u{1F1F3}" },
  { name: "Bulgaria", dial_code: "+359", code: "BG", flag: "\u{1F1E7}\u{1F1EC}" },
  { name: "Burkina Faso", dial_code: "+226", code: "BF", flag: "\u{1F1E7}\u{1F1EB}" },
  { name: "Burundi", dial_code: "+257", code: "BI", flag: "\u{1F1E7}\u{1F1EE}" },
  { name: "Cambodia", dial_code: "+855", code: "KH", flag: "\u{1F1F0}\u{1F1ED}" },
  { name: "Cameroon", dial_code: "+237", code: "CM", flag: "\u{1F1E8}\u{1F1F2}" },
  { name: "Canada", dial_code: "+1", code: "CA", flag: "\u{1F1E8}\u{1F1E6}" },
  { name: "Cape Verde", dial_code: "+238", code: "CV", flag: "\u{1F1E8}\u{1F1FB}" },
  { name: "Cayman Islands", dial_code: "+1345", code: "KY", flag: "\u{1F1F0}\u{1F1FE}" },
  { name: "Central African Republic", dial_code: "+236", code: "CF", flag: "\u{1F1E8}\u{1F1EB}" },
  { name: "Chad", dial_code: "+235", code: "TD", flag: "\u{1F1F9}\u{1F1E9}" },
  { name: "Chile", dial_code: "+56", code: "CL", flag: "\u{1F1E8}\u{1F1F1}" },
  { name: "China", dial_code: "+86", code: "CN", flag: "\u{1F1E8}\u{1F1F3}" },
  { name: "Colombia", dial_code: "+57", code: "CO", flag: "\u{1F1E8}\u{1F1F4}" },
  { name: "Comoros", dial_code: "+269", code: "KM", flag: "\u{1F1F0}\u{1F1F2}" },
  { name: "Cook Islands", dial_code: "+682", code: "CK", flag: "\u{1F1E8}\u{1F1F0}" },
  { name: "Costa Rica", dial_code: "+506", code: "CR", flag: "\u{1F1E8}\u{1F1F7}" },
  { name: "C\xF4te d'Ivoire", dial_code: "+225", code: "CI", flag: "\u{1F1E8}\u{1F1EE}" },
  { name: "Croatia", dial_code: "+385", code: "HR", flag: "\u{1F1ED}\u{1F1F7}" },
  { name: "Cuba", dial_code: "+53", code: "CU", flag: "\u{1F1E8}\u{1F1FA}" },
  { name: "Cyprus", dial_code: "+357", code: "CY", flag: "\u{1F1E8}\u{1F1FE}" },
  { name: "Czechia", dial_code: "+420", code: "CZ", flag: "\u{1F1E8}\u{1F1FF}" },
  { name: "Democratic Republic of the Congo", dial_code: "+243", code: "CD", flag: "\u{1F1E8}\u{1F1E9}" },
  { name: "Denmark", dial_code: "+45", code: "DK", flag: "\u{1F1E9}\u{1F1F0}" },
  { name: "Djibouti", dial_code: "+253", code: "DJ", flag: "\u{1F1E9}\u{1F1EF}" },
  { name: "Dominica", dial_code: "+1767", code: "DM", flag: "\u{1F1E9}\u{1F1F2}" },
  { name: "Dominican Republic", dial_code: "+1", code: "DO", flag: "\u{1F1E9}\u{1F1F4}" },
  { name: "Ecuador", dial_code: "+593", code: "EC", flag: "\u{1F1EA}\u{1F1E8}" },
  { name: "Egypt", dial_code: "+20", code: "EG", flag: "\u{1F1EA}\u{1F1EC}" },
  { name: "El Salvador", dial_code: "+503", code: "SV", flag: "\u{1F1F8}\u{1F1FB}" },
  { name: "Equatorial Guinea", dial_code: "+240", code: "GQ", flag: "\u{1F1EC}\u{1F1F6}" },
  { name: "Eritrea", dial_code: "+291", code: "ER", flag: "\u{1F1EA}\u{1F1F7}" },
  { name: "Estonia", dial_code: "+372", code: "EE", flag: "\u{1F1EA}\u{1F1EA}" },
  { name: "Eswatini", dial_code: "+268", code: "SZ", flag: "\u{1F1F8}\u{1F1FF}" },
  { name: "Ethiopia", dial_code: "+251", code: "ET", flag: "\u{1F1EA}\u{1F1F9}" },
  { name: "Fiji", dial_code: "+679", code: "FJ", flag: "\u{1F1EB}\u{1F1EF}" },
  { name: "Finland", dial_code: "+358", code: "FI", flag: "\u{1F1EB}\u{1F1EE}" },
  { name: "France", dial_code: "+33", code: "FR", flag: "\u{1F1EB}\u{1F1F7}" },
  { name: "French Guiana", dial_code: "+594", code: "GF", flag: "\u{1F1EC}\u{1F1EB}" },
  { name: "French Polynesia", dial_code: "+689", code: "PF", flag: "\u{1F1F5}\u{1F1EB}" },
  { name: "Gabon", dial_code: "+241", code: "GA", flag: "\u{1F1EC}\u{1F1E6}" },
  { name: "Gambia", dial_code: "+220", code: "GM", flag: "\u{1F1EC}\u{1F1F2}" },
  { name: "Georgia", dial_code: "+995", code: "GE", flag: "\u{1F1EC}\u{1F1EA}" },
  { name: "Germany", dial_code: "+49", code: "DE", flag: "\u{1F1E9}\u{1F1EA}" },
  { name: "Ghana", dial_code: "+233", code: "GH", flag: "\u{1F1EC}\u{1F1ED}" },
  { name: "Gibraltar", dial_code: "+350", code: "GI", flag: "\u{1F1EC}\u{1F1EE}" },
  { name: "Greece", dial_code: "+30", code: "GR", flag: "\u{1F1EC}\u{1F1F7}" },
  { name: "Greenland", dial_code: "+299", code: "GL", flag: "\u{1F1EC}\u{1F1F1}" },
  { name: "Grenada", dial_code: "+1473", code: "GD", flag: "\u{1F1EC}\u{1F1E9}" },
  { name: "Guadeloupe", dial_code: "+590", code: "GP", flag: "\u{1F1EC}\u{1F1F5}" },
  { name: "Guam", dial_code: "+1671", code: "GU", flag: "\u{1F1EC}\u{1F1FA}" },
  { name: "Guatemala", dial_code: "+502", code: "GT", flag: "\u{1F1EC}\u{1F1F9}" },
  { name: "Guernsey", dial_code: "+44", code: "GG", flag: "\u{1F1EC}\u{1F1EC}" },
  { name: "Guinea", dial_code: "+224", code: "GN", flag: "\u{1F1EC}\u{1F1F3}" },
  { name: "Guinea-Bissau", dial_code: "+245", code: "GW", flag: "\u{1F1EC}\u{1F1FC}" },
  { name: "Guyana", dial_code: "+592", code: "GY", flag: "\u{1F1EC}\u{1F1FE}" },
  { name: "Haiti", dial_code: "+509", code: "HT", flag: "\u{1F1ED}\u{1F1F9}" },
  { name: "Honduras", dial_code: "+504", code: "HN", flag: "\u{1F1ED}\u{1F1F3}" },
  { name: "Hong Kong", dial_code: "+852", code: "HK", flag: "\u{1F1ED}\u{1F1F0}" },
  { name: "Hungary", dial_code: "+36", code: "HU", flag: "\u{1F1ED}\u{1F1FA}" },
  { name: "Iceland", dial_code: "+354", code: "IS", flag: "\u{1F1EE}\u{1F1F8}" },
  { name: "India", dial_code: "+91", code: "IN", flag: "\u{1F1EE}\u{1F1F3}" },
  { name: "Indonesia", dial_code: "+62", code: "ID", flag: "\u{1F1EE}\u{1F1E9}" },
  { name: "Iran", dial_code: "+98", code: "IR", flag: "\u{1F1EE}\u{1F1F7}" },
  { name: "Iraq", dial_code: "+964", code: "IQ", flag: "\u{1F1EE}\u{1F1F6}" },
  { name: "Ireland", dial_code: "+353", code: "IE", flag: "\u{1F1EE}\u{1F1EA}" },
  { name: "Isle of Man", dial_code: "+44", code: "IM", flag: "\u{1F1EE}\u{1F1F2}" },
  { name: "Israel", dial_code: "+972", code: "IL", flag: "\u{1F1EE}\u{1F1F1}" },
  { name: "Italy", dial_code: "+39", code: "IT", flag: "\u{1F1EE}\u{1F1F9}" },
  { name: "Jamaica", dial_code: "+1876", code: "JM", flag: "\u{1F1EF}\u{1F1F2}" },
  { name: "Japan", dial_code: "+81", code: "JP", flag: "\u{1F1EF}\u{1F1F5}" },
  { name: "Jersey", dial_code: "+44", code: "JE", flag: "\u{1F1EF}\u{1F1EA}" },
  { name: "Jordan", dial_code: "+962", code: "JO", flag: "\u{1F1EF}\u{1F1F4}" },
  { name: "Kazakhstan", dial_code: "+7", code: "KZ", flag: "\u{1F1F0}\u{1F1FF}" },
  { name: "Kenya", dial_code: "+254", code: "KE", flag: "\u{1F1F0}\u{1F1EA}" },
  { name: "Kiribati", dial_code: "+686", code: "KI", flag: "\u{1F1F0}\u{1F1EE}" },
  { name: "Kuwait", dial_code: "+965", code: "KW", flag: "\u{1F1F0}\u{1F1FC}" },
  { name: "Kyrgyzstan", dial_code: "+996", code: "KG", flag: "\u{1F1F0}\u{1F1EC}" },
  { name: "Laos", dial_code: "+856", code: "LA", flag: "\u{1F1F1}\u{1F1E6}" },
  { name: "Latvia", dial_code: "+371", code: "LV", flag: "\u{1F1F1}\u{1F1FB}" },
  { name: "Lebanon", dial_code: "+961", code: "LB", flag: "\u{1F1F1}\u{1F1E7}" },
  { name: "Lesotho", dial_code: "+266", code: "LS", flag: "\u{1F1F1}\u{1F1F8}" },
  { name: "Liberia", dial_code: "+231", code: "LR", flag: "\u{1F1F1}\u{1F1F7}" },
  { name: "Libya", dial_code: "+218", code: "LY", flag: "\u{1F1F1}\u{1F1FE}" },
  { name: "Liechtenstein", dial_code: "+423", code: "LI", flag: "\u{1F1F1}\u{1F1EE}" },
  { name: "Lithuania", dial_code: "+370", code: "LT", flag: "\u{1F1F1}\u{1F1F9}" },
  { name: "Luxembourg", dial_code: "+352", code: "LU", flag: "\u{1F1F1}\u{1F1FA}" },
  { name: "Macao", dial_code: "+853", code: "MO", flag: "\u{1F1F2}\u{1F1F4}" },
  { name: "Madagascar", dial_code: "+261", code: "MG", flag: "\u{1F1F2}\u{1F1EC}" },
  { name: "Malawi", dial_code: "+265", code: "MW", flag: "\u{1F1F2}\u{1F1FC}" },
  { name: "Malaysia", dial_code: "+60", code: "MY", flag: "\u{1F1F2}\u{1F1FE}" },
  { name: "Maldives", dial_code: "+960", code: "MV", flag: "\u{1F1F2}\u{1F1FB}" },
  { name: "Mali", dial_code: "+223", code: "ML", flag: "\u{1F1F2}\u{1F1F1}" },
  { name: "Malta", dial_code: "+356", code: "MT", flag: "\u{1F1F2}\u{1F1F9}" },
  { name: "Marshall Islands", dial_code: "+692", code: "MH", flag: "\u{1F1F2}\u{1F1ED}" },
  { name: "Martinique", dial_code: "+596", code: "MQ", flag: "\u{1F1F2}\u{1F1F6}" },
  { name: "Mauritania", dial_code: "+222", code: "MR", flag: "\u{1F1F2}\u{1F1F7}" },
  { name: "Mauritius", dial_code: "+230", code: "MU", flag: "\u{1F1F2}\u{1F1FA}" },
  { name: "Mayotte", dial_code: "+262", code: "YT", flag: "\u{1F1FE}\u{1F1F9}" },
  { name: "Mexico", dial_code: "+52", code: "MX", flag: "\u{1F1F2}\u{1F1FD}" },
  { name: "Micronesia", dial_code: "+691", code: "FM", flag: "\u{1F1EB}\u{1F1F2}" },
  { name: "Moldova", dial_code: "+373", code: "MD", flag: "\u{1F1F2}\u{1F1E9}" },
  { name: "Monaco", dial_code: "+377", code: "MC", flag: "\u{1F1F2}\u{1F1E8}" },
  { name: "Mongolia", dial_code: "+976", code: "MN", flag: "\u{1F1F2}\u{1F1F3}" },
  { name: "Montenegro", dial_code: "+382", code: "ME", flag: "\u{1F1F2}\u{1F1EA}" },
  { name: "Montserrat", dial_code: "+1664", code: "MS", flag: "\u{1F1F2}\u{1F1F8}" },
  { name: "Morocco", dial_code: "+212", code: "MA", flag: "\u{1F1F2}\u{1F1E6}" },
  { name: "Mozambique", dial_code: "+258", code: "MZ", flag: "\u{1F1F2}\u{1F1FF}" },
  { name: "Myanmar", dial_code: "+95", code: "MM", flag: "\u{1F1F2}\u{1F1F2}" },
  { name: "Namibia", dial_code: "+264", code: "NA", flag: "\u{1F1F3}\u{1F1E6}" },
  { name: "Nauru", dial_code: "+674", code: "NR", flag: "\u{1F1F3}\u{1F1F7}" },
  { name: "Nepal", dial_code: "+977", code: "NP", flag: "\u{1F1F3}\u{1F1F5}" },
  { name: "Netherlands", dial_code: "+31", code: "NL", flag: "\u{1F1F3}\u{1F1F1}" },
  { name: "New Caledonia", dial_code: "+687", code: "NC", flag: "\u{1F1F3}\u{1F1E8}" },
  { name: "New Zealand", dial_code: "+64", code: "NZ", flag: "\u{1F1F3}\u{1F1FF}" },
  { name: "Nicaragua", dial_code: "+505", code: "NI", flag: "\u{1F1F3}\u{1F1EE}" },
  { name: "Niger", dial_code: "+227", code: "NE", flag: "\u{1F1F3}\u{1F1EA}" },
  { name: "Nigeria", dial_code: "+234", code: "NG", flag: "\u{1F1F3}\u{1F1EC}" },
  { name: "Niue", dial_code: "+683", code: "NU", flag: "\u{1F1F3}\u{1F1FA}" },
  { name: "Norfolk Island", dial_code: "+672", code: "NF", flag: "\u{1F1F3}\u{1F1EB}" },
  { name: "North Macedonia", dial_code: "+389", code: "MK", flag: "\u{1F1F2}\u{1F1F0}" },
  { name: "Northern Mariana Islands", dial_code: "+1670", code: "MP", flag: "\u{1F1F2}\u{1F1F5}" },
  { name: "Norway", dial_code: "+47", code: "NO", flag: "\u{1F1F3}\u{1F1F4}" },
  { name: "Oman", dial_code: "+968", code: "OM", flag: "\u{1F1F4}\u{1F1F2}" },
  { name: "Pakistan", dial_code: "+92", code: "PK", flag: "\u{1F1F5}\u{1F1F0}" },
  { name: "Palau", dial_code: "+680", code: "PW", flag: "\u{1F1F5}\u{1F1FC}" },
  { name: "Palestine", dial_code: "+970", code: "PS", flag: "\u{1F1F5}\u{1F1F8}" },
  { name: "Panama", dial_code: "+507", code: "PA", flag: "\u{1F1F5}\u{1F1E6}" },
  { name: "Papua New Guinea", dial_code: "+675", code: "PG", flag: "\u{1F1F5}\u{1F1EC}" },
  { name: "Paraguay", dial_code: "+595", code: "PY", flag: "\u{1F1F5}\u{1F1FE}" },
  { name: "Peru", dial_code: "+51", code: "PE", flag: "\u{1F1F5}\u{1F1EA}" },
  { name: "Philippines", dial_code: "+63", code: "PH", flag: "\u{1F1F5}\u{1F1ED}" },
  { name: "Poland", dial_code: "+48", code: "PL", flag: "\u{1F1F5}\u{1F1F1}" },
  { name: "Portugal", dial_code: "+351", code: "PT", flag: "\u{1F1F5}\u{1F1F9}" },
  { name: "Puerto Rico", dial_code: "+1", code: "PR", flag: "\u{1F1F5}\u{1F1F7}" },
  { name: "Qatar", dial_code: "+974", code: "QA", flag: "\u{1F1F6}\u{1F1E6}" },
  { name: "R\xE9union", dial_code: "+262", code: "RE", flag: "\u{1F1F7}\u{1F1EA}" },
  { name: "Romania", dial_code: "+40", code: "RO", flag: "\u{1F1F7}\u{1F1F4}" },
  { name: "Russia", dial_code: "+7", code: "RU", flag: "\u{1F1F7}\u{1F1FA}" },
  { name: "Rwanda", dial_code: "+250", code: "RW", flag: "\u{1F1F7}\u{1F1FC}" },
  { name: "Saint Barth\xE9lemy", dial_code: "+590", code: "BL", flag: "\u{1F1E7}\u{1F1F1}" },
  { name: "Saint Helena", dial_code: "+290", code: "SH", flag: "\u{1F1F8}\u{1F1ED}" },
  { name: "Saint Kitts and Nevis", dial_code: "+1869", code: "KN", flag: "\u{1F1F0}\u{1F1F3}" },
  { name: "Saint Lucia", dial_code: "+1758", code: "LC", flag: "\u{1F1F1}\u{1F1E8}" },
  { name: "Saint Martin", dial_code: "+590", code: "MF", flag: "\u{1F1F2}\u{1F1EB}" },
  { name: "Saint Pierre and Miquelon", dial_code: "+508", code: "PM", flag: "\u{1F1F5}\u{1F1F2}" },
  { name: "Saint Vincent and the Grenadines", dial_code: "+1784", code: "VC", flag: "\u{1F1FB}\u{1F1E8}" },
  { name: "Samoa", dial_code: "+685", code: "WS", flag: "\u{1F1FC}\u{1F1F8}" },
  { name: "San Marino", dial_code: "+378", code: "SM", flag: "\u{1F1F8}\u{1F1F2}" },
  { name: "S\xE3o Tom\xE9 and Pr\xEDncipe", dial_code: "+239", code: "ST", flag: "\u{1F1F8}\u{1F1F9}" },
  { name: "Saudi Arabia", dial_code: "+966", code: "SA", flag: "\u{1F1F8}\u{1F1E6}" },
  { name: "Senegal", dial_code: "+221", code: "SN", flag: "\u{1F1F8}\u{1F1F3}" },
  { name: "Serbia", dial_code: "+381", code: "RS", flag: "\u{1F1F7}\u{1F1F8}" },
  { name: "Seychelles", dial_code: "+248", code: "SC", flag: "\u{1F1F8}\u{1F1E8}" },
  { name: "Sierra Leone", dial_code: "+232", code: "SL", flag: "\u{1F1F8}\u{1F1F1}" },
  { name: "Singapore", dial_code: "+65", code: "SG", flag: "\u{1F1F8}\u{1F1EC}" },
  { name: "Sint Maarten", dial_code: "+1721", code: "SX", flag: "\u{1F1F8}\u{1F1FD}" },
  { name: "Slovakia", dial_code: "+421", code: "SK", flag: "\u{1F1F8}\u{1F1F0}" },
  { name: "Slovenia", dial_code: "+386", code: "SI", flag: "\u{1F1F8}\u{1F1EE}" },
  { name: "Solomon Islands", dial_code: "+677", code: "SB", flag: "\u{1F1F8}\u{1F1E7}" },
  { name: "Somalia", dial_code: "+252", code: "SO", flag: "\u{1F1F8}\u{1F1F4}" },
  { name: "South Africa", dial_code: "+27", code: "ZA", flag: "\u{1F1FF}\u{1F1E6}" },
  { name: "South Korea", dial_code: "+82", code: "KR", flag: "\u{1F1F0}\u{1F1F7}" },
  { name: "South Sudan", dial_code: "+211", code: "SS", flag: "\u{1F1F8}\u{1F1F8}" },
  { name: "Spain", dial_code: "+34", code: "ES", flag: "\u{1F1EA}\u{1F1F8}" },
  { name: "Sri Lanka", dial_code: "+94", code: "LK", flag: "\u{1F1F1}\u{1F1F0}" },
  { name: "Sudan", dial_code: "+249", code: "SD", flag: "\u{1F1F8}\u{1F1E9}" },
  { name: "Suriname", dial_code: "+597", code: "SR", flag: "\u{1F1F8}\u{1F1F7}" },
  { name: "Sweden", dial_code: "+46", code: "SE", flag: "\u{1F1F8}\u{1F1EA}" },
  { name: "Switzerland", dial_code: "+41", code: "CH", flag: "\u{1F1E8}\u{1F1ED}" },
  { name: "Syria", dial_code: "+963", code: "SY", flag: "\u{1F1F8}\u{1F1FE}" },
  { name: "Taiwan", dial_code: "+886", code: "TW", flag: "\u{1F1F9}\u{1F1FC}" },
  { name: "Tajikistan", dial_code: "+992", code: "TJ", flag: "\u{1F1F9}\u{1F1EF}" },
  { name: "Tanzania", dial_code: "+255", code: "TZ", flag: "\u{1F1F9}\u{1F1FF}" },
  { name: "Thailand", dial_code: "+66", code: "TH", flag: "\u{1F1F9}\u{1F1ED}" },
  { name: "Timor-Leste", dial_code: "+670", code: "TL", flag: "\u{1F1F9}\u{1F1F1}" },
  { name: "Togo", dial_code: "+228", code: "TG", flag: "\u{1F1F9}\u{1F1EC}" },
  { name: "Tokelau", dial_code: "+690", code: "TK", flag: "\u{1F1F9}\u{1F1F0}" },
  { name: "Tonga", dial_code: "+676", code: "TO", flag: "\u{1F1F9}\u{1F1F4}" },
  { name: "Trinidad and Tobago", dial_code: "+1868", code: "TT", flag: "\u{1F1F9}\u{1F1F9}" },
  { name: "Tunisia", dial_code: "+216", code: "TN", flag: "\u{1F1F9}\u{1F1F3}" },
  { name: "Turkey", dial_code: "+90", code: "TR", flag: "\u{1F1F9}\u{1F1F7}" },
  { name: "Turkmenistan", dial_code: "+993", code: "TM", flag: "\u{1F1F9}\u{1F1F2}" },
  { name: "Turks and Caicos Islands", dial_code: "+1649", code: "TC", flag: "\u{1F1F9}\u{1F1E8}" },
  { name: "Tuvalu", dial_code: "+688", code: "TV", flag: "\u{1F1F9}\u{1F1FB}" },
  { name: "Uganda", dial_code: "+256", code: "UG", flag: "\u{1F1FA}\u{1F1EC}" },
  { name: "Ukraine", dial_code: "+380", code: "UA", flag: "\u{1F1FA}\u{1F1E6}" },
  { name: "United Arab Emirates", dial_code: "+971", code: "AE", flag: "\u{1F1E6}\u{1F1EA}" },
  { name: "United Kingdom", dial_code: "+44", code: "GB", flag: "\u{1F1EC}\u{1F1E7}" },
  { name: "United States", dial_code: "+1", code: "US", flag: "\u{1F1FA}\u{1F1F8}" },
  { name: "Uruguay", dial_code: "+598", code: "UY", flag: "\u{1F1FA}\u{1F1FE}" },
  { name: "Uzbekistan", dial_code: "+998", code: "UZ", flag: "\u{1F1FA}\u{1F1FF}" },
  { name: "Vanuatu", dial_code: "+678", code: "VU", flag: "\u{1F1FB}\u{1F1FA}" },
  { name: "Vatican City", dial_code: "+379", code: "VA", flag: "\u{1F1FB}\u{1F1E6}" },
  { name: "Venezuela", dial_code: "+58", code: "VE", flag: "\u{1F1FB}\u{1F1EA}" },
  { name: "Vietnam", dial_code: "+84", code: "VN", flag: "\u{1F1FB}\u{1F1F3}" },
  { name: "Wallis and Futuna", dial_code: "+681", code: "WF", flag: "\u{1F1FC}\u{1F1EB}" },
  { name: "Yemen", dial_code: "+967", code: "YE", flag: "\u{1F1FE}\u{1F1EA}" },
  { name: "Zambia", dial_code: "+260", code: "ZM", flag: "\u{1F1FF}\u{1F1F2}" },
  { name: "Zimbabwe", dial_code: "+263", code: "ZW", flag: "\u{1F1FF}\u{1F1FC}" }
];
var country_codes_default = countryCodes;

// app/javascript/controllers/country_code_selector_controller.js
var country_code_selector_controller_default = class extends Controller {
  static targets = ["input", "button", "buttonLabel", "overlay", "list", "search"];
  static values = {
    initial: String
  };
  connect() {
    this.codes = country_codes_default;
    this.selectedCode = this.inputTarget.value || this.initialValue || "+27";
    if (!this.inputTarget.value) {
      this.inputTarget.value = this.selectedCode;
    }
    this.updateButtonLabel();
    this.renderList(this.codes);
    this.dispatchChange();
  }
  open(event) {
    event.preventDefault();
    this.overlayTarget.classList.remove("hidden");
    this.overlayTarget.classList.add("flex");
    document.addEventListener("keydown", this.handleKeydown);
    if (this.hasSearchTarget) {
      this.searchTarget.value = "";
    }
    this.renderList(this.codes);
    if (this.hasSearchTarget) {
      requestAnimationFrame(() => {
        this.searchTarget.focus();
      });
    }
  }
  close(event) {
    if (event) event.preventDefault();
    this.overlayTarget.classList.add("hidden");
    this.overlayTarget.classList.remove("flex");
    document.removeEventListener("keydown", this.handleKeydown);
    this.buttonTarget.focus();
  }
  filter(event) {
    const term = event.target.value.trim().toLowerCase();
    if (term === "") {
      this.renderList(this.codes);
      return;
    }
    const filtered = this.codes.filter((code) => {
      return code.name.toLowerCase().includes(term) || code.dial_code.replace("+", "").includes(term.replace("+", "")) || code.code.toLowerCase().includes(term);
    });
    this.renderList(filtered);
  }
  choose(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const code = button.dataset.code;
    const flag = button.dataset.flag;
    this.selectedCode = code;
    this.inputTarget.value = code;
    this.updateButtonLabel(flag, code);
    this.dispatchChange();
    this.close();
  }
  overlayClick(event) {
    if (event.target === this.overlayTarget) {
      this.close();
    }
  }
  disconnect() {
    document.removeEventListener("keydown", this.handleKeydown);
  }
  handleKeydown = (event) => {
    if (event.key === "Escape") {
      this.close();
    }
  };
  updateButtonLabel(flag, code) {
    const current = this.codes.find((item) => item.dial_code === this.selectedCode) || {};
    const displayFlag = flag || current.flag || "\u{1F30D}";
    const displayCode = code || current.dial_code || this.selectedCode;
    this.buttonLabelTarget.innerHTML = `
      <span class="text-xl leading-none">${displayFlag}</span>
      <span class="ml-2 text-sm font-semibold text-slate-900">${displayCode}</span>
    `;
  }
  renderList(codes) {
    this.listTarget.innerHTML = "";
    if (codes.length === 0) {
      const empty = document.createElement("p");
      empty.className = "px-3 py-6 text-center text-sm text-slate-500";
      empty.textContent = "No matches found.";
      this.listTarget.appendChild(empty);
      return;
    }
    codes.forEach((code) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = [
        "flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm transition",
        "hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-200",
        code.dial_code === this.selectedCode ? "bg-sky-50 text-sky-600" : "text-slate-700"
      ].join(" ");
      button.dataset.action = "country-code-selector#choose";
      button.dataset.code = code.dial_code;
      button.dataset.name = code.name;
      button.dataset.flag = code.flag;
      button.innerHTML = `
        <span class="flex items-center gap-3">
          <span class="text-xl">${code.flag}</span>
          <span>
            <span class="block text-sm font-medium">${code.name}</span>
            <span class="block text-xs text-slate-400 uppercase tracking-wide">${code.code}</span>
          </span>
        </span>
        <span class="text-sm font-semibold">${code.dial_code}</span>
      `;
      this.listTarget.appendChild(button);
    });
  }
  dispatchChange() {
    const detail = {
      code: this.selectedCode,
      inputId: this.inputTarget.id
    };
    const dispatchTarget = typeof window !== "undefined" ? window : this.element;
    dispatchTarget.dispatchEvent(
      new CustomEvent("country-code:changed", {
        detail,
        bubbles: true
      })
    );
  }
};

// app/javascript/controllers/mobile_number_controller.js
var DEFAULT_CODE = "+27";
var MAX_DIGITS = 9;
var GROUP_SIZES = [2, 3, 4];
var mobile_number_controller_default = class extends Controller {
  static targets = ["input"];
  static values = {
    code: String,
    countryInput: String
  };
  connect() {
    this.currentCode = this.codeValue || DEFAULT_CODE;
    this.digits = this.extractDigits(this.inputTarget.value || "");
    this.digits = this.digits.slice(0, MAX_DIGITS);
    this.applyMask();
    this.inputTarget.addEventListener("input", this.handleInput);
    this.inputTarget.addEventListener("blur", this.handleBlur);
    window.addEventListener("country-code:changed", this.updateMask);
  }
  disconnect() {
    this.inputTarget.removeEventListener("input", this.handleInput);
    this.inputTarget.removeEventListener("blur", this.handleBlur);
    window.removeEventListener("country-code:changed", this.updateMask);
  }
  updateMask = (event) => {
    const { code, inputId } = event.detail || {};
    if (this.hasCountryInputValue && inputId && inputId !== this.countryInputValue) {
      return;
    }
    if (code) {
      this.currentCode = code;
      this.applyMask();
    }
  };
  handleInput = (event) => {
    this.digits = this.extractDigits(event.target.value);
    this.digits = this.digits.slice(0, MAX_DIGITS);
    this.applyMask();
  };
  handleBlur = () => {
    this.applyMask();
  };
  applyMask() {
    if (this.digits.length === 0) {
      this.inputTarget.value = "";
      return;
    }
    const formattedDigits = this.groupDigits(this.digits);
    this.inputTarget.value = `${this.currentCode} ${formattedDigits}`.trim();
  }
  extractDigits(value) {
    let numeric = (value || "").replace(/\D+/g, "");
    const codeDigits = (this.currentCode || "").replace(/\D+/g, "");
    if (numeric.startsWith(codeDigits)) {
      numeric = numeric.slice(codeDigits.length);
    }
    return numeric;
  }
  groupDigits(digits) {
    const parts = [];
    let position = 0;
    GROUP_SIZES.forEach((size) => {
      if (position >= digits.length) return;
      const chunk = digits.slice(position, position + size);
      parts.push(chunk);
      position += size;
    });
    if (position < digits.length) {
      parts.push(digits.slice(position));
    }
    return parts.join(" ");
  }
};

// app/javascript/controllers/payment_processing_controller.js
var payment_processing_controller_default = class extends Controller {
  static targets = ["overlay", "submit"];
  show() {
    this.displayOverlay();
    this.disableSubmitButton();
  }
  toggleTestOverlay(event) {
    event.preventDefault();
    if (this.hasOverlayTarget) {
      this.overlayTarget.classList.toggle("hidden");
    }
  }
  displayOverlay() {
    if (!this.hasOverlayTarget) return;
    this.overlayTarget.classList.remove("hidden");
  }
  disableSubmitButton() {
    if (!this.hasSubmitTarget) return;
    const button = this.submitTarget;
    button.disabled = true;
    button.classList.add("opacity-60", "cursor-not-allowed");
    button.setAttribute("aria-busy", "true");
  }
};

// app/javascript/controllers/tabs_controller.js
var tabs_controller_default = class extends Controller {
  static targets = ["trigger", "panel"];
  static classes = ["active", "inactive"];
  static values = {
    defaultTab: String,
    activeTab: String
  };
  connect() {
    if (!this.hasActiveTabValue) {
      const firstTrigger = this.triggerTargets[0];
      const fallback = this.defaultTabValue || firstTrigger && firstTrigger.dataset[this.tabDatasetKey];
      if (fallback) {
        this.activeTabValue = fallback;
      }
    }
    this.update();
  }
  show(event) {
    event.preventDefault();
    const params2 = event.params || {};
    const tabParam = typeof params2.tab === "string" ? params2.tab : null;
    const currentTarget = event.currentTarget;
    const datasetTab = currentTarget && currentTarget.dataset ? currentTarget.dataset[this.tabDatasetKey] : null;
    const tab = tabParam || datasetTab;
    if (tab && tab !== this.activeTabValue) {
      this.activeTabValue = tab;
      this.update();
    }
  }
  update() {
    const active2 = this.activeTabValue;
    this.triggerTargets.forEach((trigger) => {
      const isActive = trigger.dataset[this.tabDatasetKey] === active2;
      trigger.setAttribute("aria-selected", isActive);
      trigger.setAttribute("tabindex", isActive ? "0" : "-1");
      this.activeClasses.forEach((className) => trigger.classList.toggle(className, isActive));
      this.inactiveClasses.forEach((className) => trigger.classList.toggle(className, !isActive));
    });
    this.panelTargets.forEach((panel) => {
      const isActive = panel.dataset[this.panelDatasetKey] === active2;
      panel.hidden = !isActive;
      panel.setAttribute("aria-hidden", (!isActive).toString());
    });
  }
  get activeClasses() {
    if (!this.hasActiveClass) return [];
    return this.activeClass.split(/\s+/).filter(Boolean);
  }
  get inactiveClasses() {
    if (!this.hasInactiveClass) return [];
    return this.inactiveClass.split(/\s+/).filter(Boolean);
  }
  get identifierPrefix() {
    return this.identifier.replace(/-(\w)/g, (_match, char) => char.toUpperCase());
  }
  get tabDatasetKey() {
    return `${this.identifierPrefix}Tab`;
  }
  get panelDatasetKey() {
    return `${this.identifierPrefix}Panel`;
  }
};

// app/javascript/controllers/index.js
application.register("hello", hello_controller_default);
application.register("squad", squad_controller_default);
application.register("location-picker", location_picker_controller_default);
application.register("clubs-map", clubs_map_controller_default);
application.register("dropzone", dropzone_controller_default);
application.register("club-questions", club_questions_controller_default);
application.register("membership-question-form", membership_question_form_controller_default);
application.register("modal", modal_controller_default);
application.register("memberships-selection", memberships_selection_controller_default);
application.register("membership-start", membership_start_controller_default);
application.register("sa-id", sa_id_controller_default);
application.register("payment-method", payment_method_controller_default);
application.register("staggered-payment-plan", staggered_payment_plan_controller_default);
application.register("payment-plan-selector", payment_plan_selector_controller_default);
application.register("club-theme-color", club_theme_color_controller_default);
application.register("country-code-selector", country_code_selector_controller_default);
application.register("mobile-number", mobile_number_controller_default);
application.register("payment-processing", payment_processing_controller_default);
application.register("tabs", tabs_controller_default);
application.register("club-settings-tabs", tabs_controller_default);

// app/javascript/application.js
var import_cropper = __toESM(require_cropper());
/*! Bundled license information:

cropperjs/dist/cropper.js:
  (*!
   * Cropper.js v1.6.2
   * https://fengyuanchen.github.io/cropperjs
   *
   * Copyright 2015-present Chen Fengyuan
   * Released under the MIT license
   *
   * Date: 2024-04-21T07:43:05.335Z
   *)

@hotwired/turbo/dist/turbo.es2017-esm.js:
  (*!
  Turbo 8.0.17
  Copyright © 2025 37signals LLC
   *)

stimulus_reflex/dist/stimulus_reflex.js:
  (*!
   * Toastify js 1.12.0
   * https://github.com/apvarun/toastify-js
   * @license MIT licensed
   *
   * Copyright (C) 2018 Varun A P
   *)
*/
//# sourceMappingURL=/assets/application.js.map
