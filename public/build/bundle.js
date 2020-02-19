
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    function forwardEventsBuilder(component, additionalEvents = []) {
      const events = [
        'focus', 'blur',
        'fullscreenchange', 'fullscreenerror', 'scroll',
        'cut', 'copy', 'paste',
        'keydown', 'keypress', 'keyup',
        'auxclick', 'click', 'contextmenu', 'dblclick', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseover', 'mouseout', 'mouseup', 'pointerlockchange', 'pointerlockerror', 'select', 'wheel',
        'drag', 'dragend', 'dragenter', 'dragstart', 'dragleave', 'dragover', 'drop',
        'touchcancel', 'touchend', 'touchmove', 'touchstart',
        'pointerover', 'pointerenter', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerout', 'pointerleave', 'gotpointercapture', 'lostpointercapture',
        ...additionalEvents
      ];

      function forward(e) {
        bubble(component, e);
      }

      return node => {
        const destructors = [];

        for (let i = 0; i < events.length; i++) {
          destructors.push(listen(node, events[i], forward));
        }

        return {
          destroy: () => {
            for (let i = 0; i < destructors.length; i++) {
              destructors[i]();
            }
          }
        }
      };
    }

    function exclude(obj, keys) {
      let names = Object.getOwnPropertyNames(obj);
      const newObj = {};

      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const cashIndex = name.indexOf('$');
        if (cashIndex !== -1 && keys.indexOf(name.substring(0, cashIndex + 1)) !== -1) {
          continue;
        }
        if (keys.indexOf(name) !== -1) {
          continue;
        }
        newObj[name] = obj[name];
      }

      return newObj;
    }

    function useActions(node, actions) {
      let objects = [];

      if (actions) {
        for (let i = 0; i < actions.length; i++) {
          const isArray = Array.isArray(actions[i]);
          const action = isArray ? actions[i][0] : actions[i];
          if (isArray && actions[i].length > 1) {
            objects.push(action(node, actions[i][1]));
          } else {
            objects.push(action(node));
          }
        }
      }

      return {
        update(actions) {
          if ((actions && actions.length || 0) != objects.length) {
            throw new Error('You must not change the length of an actions array.');
          }

          if (actions) {
            for (let i = 0; i < actions.length; i++) {
              if (objects[i] && 'update' in objects[i]) {
                const isArray = Array.isArray(actions[i]);
                if (isArray && actions[i].length > 1) {
                  objects[i].update(actions[i][1]);
                } else {
                  objects[i].update();
                }
              }
            }
          }
        },

        destroy() {
          for (let i = 0; i < objects.length; i++) {
            if (objects[i] && 'destroy' in objects[i]) {
              objects[i].destroy();
            }
          }
        }
      }
    }

    /**
     * Stores result from supportsCssVariables to avoid redundant processing to
     * detect CSS custom variable support.
     */
    var supportsCssVariables_;
    function detectEdgePseudoVarBug(windowObj) {
        // Detect versions of Edge with buggy var() support
        // See: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/11495448/
        var document = windowObj.document;
        var node = document.createElement('div');
        node.className = 'mdc-ripple-surface--test-edge-var-bug';
        // Append to head instead of body because this script might be invoked in the
        // head, in which case the body doesn't exist yet. The probe works either way.
        document.head.appendChild(node);
        // The bug exists if ::before style ends up propagating to the parent element.
        // Additionally, getComputedStyle returns null in iframes with display: "none" in Firefox,
        // but Firefox is known to support CSS custom properties correctly.
        // See: https://bugzilla.mozilla.org/show_bug.cgi?id=548397
        var computedStyle = windowObj.getComputedStyle(node);
        var hasPseudoVarBug = computedStyle !== null && computedStyle.borderTopStyle === 'solid';
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
        return hasPseudoVarBug;
    }
    function supportsCssVariables(windowObj, forceRefresh) {
        if (forceRefresh === void 0) { forceRefresh = false; }
        var CSS = windowObj.CSS;
        var supportsCssVars = supportsCssVariables_;
        if (typeof supportsCssVariables_ === 'boolean' && !forceRefresh) {
            return supportsCssVariables_;
        }
        var supportsFunctionPresent = CSS && typeof CSS.supports === 'function';
        if (!supportsFunctionPresent) {
            return false;
        }
        var explicitlySupportsCssVars = CSS.supports('--css-vars', 'yes');
        // See: https://bugs.webkit.org/show_bug.cgi?id=154669
        // See: README section on Safari
        var weAreFeatureDetectingSafari10plus = (CSS.supports('(--css-vars: yes)') &&
            CSS.supports('color', '#00000000'));
        if (explicitlySupportsCssVars || weAreFeatureDetectingSafari10plus) {
            supportsCssVars = !detectEdgePseudoVarBug(windowObj);
        }
        else {
            supportsCssVars = false;
        }
        if (!forceRefresh) {
            supportsCssVariables_ = supportsCssVars;
        }
        return supportsCssVars;
    }
    function getNormalizedEventCoords(evt, pageOffset, clientRect) {
        if (!evt) {
            return { x: 0, y: 0 };
        }
        var x = pageOffset.x, y = pageOffset.y;
        var documentX = x + clientRect.left;
        var documentY = y + clientRect.top;
        var normalizedX;
        var normalizedY;
        // Determine touch point relative to the ripple container.
        if (evt.type === 'touchstart') {
            var touchEvent = evt;
            normalizedX = touchEvent.changedTouches[0].pageX - documentX;
            normalizedY = touchEvent.changedTouches[0].pageY - documentY;
        }
        else {
            var mouseEvent = evt;
            normalizedX = mouseEvent.pageX - documentX;
            normalizedY = mouseEvent.pageY - documentY;
        }
        return { x: normalizedX, y: normalizedY };
    }
    //# sourceMappingURL=util.js.map

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        }
        catch (error) { e = { error: error }; }
        finally {
            try {
                if (r && !r.done && (m = i["return"])) m.call(i);
            }
            finally { if (e) throw e.error; }
        }
        return ar;
    }

    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCFoundation = /** @class */ (function () {
        function MDCFoundation(adapter) {
            if (adapter === void 0) { adapter = {}; }
            this.adapter_ = adapter;
        }
        Object.defineProperty(MDCFoundation, "cssClasses", {
            get: function () {
                // Classes extending MDCFoundation should implement this method to return an object which exports every
                // CSS class the foundation class needs as a property. e.g. {ACTIVE: 'mdc-component--active'}
                return {};
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFoundation, "strings", {
            get: function () {
                // Classes extending MDCFoundation should implement this method to return an object which exports all
                // semantic strings as constants. e.g. {ARIA_ROLE: 'tablist'}
                return {};
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFoundation, "numbers", {
            get: function () {
                // Classes extending MDCFoundation should implement this method to return an object which exports all
                // of its semantic numbers as constants. e.g. {ANIMATION_DELAY_MS: 350}
                return {};
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCFoundation, "defaultAdapter", {
            get: function () {
                // Classes extending MDCFoundation may choose to implement this getter in order to provide a convenient
                // way of viewing the necessary methods of an adapter. In the future, this could also be used for adapter
                // validation.
                return {};
            },
            enumerable: true,
            configurable: true
        });
        MDCFoundation.prototype.init = function () {
            // Subclasses should override this method to perform initialization routines (registering events, etc.)
        };
        MDCFoundation.prototype.destroy = function () {
            // Subclasses should override this method to perform de-initialization routines (de-registering events, etc.)
        };
        return MDCFoundation;
    }());
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCComponent = /** @class */ (function () {
        function MDCComponent(root, foundation) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            this.root_ = root;
            this.initialize.apply(this, __spread(args));
            // Note that we initialize foundation here and not within the constructor's default param so that
            // this.root_ is defined and can be used within the foundation class.
            this.foundation_ = foundation === undefined ? this.getDefaultFoundation() : foundation;
            this.foundation_.init();
            this.initialSyncWithDOM();
        }
        MDCComponent.attachTo = function (root) {
            // Subclasses which extend MDCBase should provide an attachTo() method that takes a root element and
            // returns an instantiated component with its root set to that element. Also note that in the cases of
            // subclasses, an explicit foundation class will not have to be passed in; it will simply be initialized
            // from getDefaultFoundation().
            return new MDCComponent(root, new MDCFoundation({}));
        };
        /* istanbul ignore next: method param only exists for typing purposes; it does not need to be unit tested */
        MDCComponent.prototype.initialize = function () {
            var _args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                _args[_i] = arguments[_i];
            }
            // Subclasses can override this to do any additional setup work that would be considered part of a
            // "constructor". Essentially, it is a hook into the parent constructor before the foundation is
            // initialized. Any additional arguments besides root and foundation will be passed in here.
        };
        MDCComponent.prototype.getDefaultFoundation = function () {
            // Subclasses must override this method to return a properly configured foundation class for the
            // component.
            throw new Error('Subclasses must override getDefaultFoundation to return a properly configured ' +
                'foundation class');
        };
        MDCComponent.prototype.initialSyncWithDOM = function () {
            // Subclasses should override this method if they need to perform work to synchronize with a host DOM
            // object. An example of this would be a form control wrapper that needs to synchronize its internal state
            // to some property or attribute of the host DOM. Please note: this is *not* the place to perform DOM
            // reads/writes that would cause layout / paint, as this is called synchronously from within the constructor.
        };
        MDCComponent.prototype.destroy = function () {
            // Subclasses may implement this method to release any resources / deregister any listeners they have
            // attached. An example of this might be deregistering a resize event from the window object.
            this.foundation_.destroy();
        };
        MDCComponent.prototype.listen = function (evtType, handler, options) {
            this.root_.addEventListener(evtType, handler, options);
        };
        MDCComponent.prototype.unlisten = function (evtType, handler, options) {
            this.root_.removeEventListener(evtType, handler, options);
        };
        /**
         * Fires a cross-browser-compatible custom event from the component root of the given type, with the given data.
         */
        MDCComponent.prototype.emit = function (evtType, evtData, shouldBubble) {
            if (shouldBubble === void 0) { shouldBubble = false; }
            var evt;
            if (typeof CustomEvent === 'function') {
                evt = new CustomEvent(evtType, {
                    bubbles: shouldBubble,
                    detail: evtData,
                });
            }
            else {
                evt = document.createEvent('CustomEvent');
                evt.initCustomEvent(evtType, shouldBubble, false, evtData);
            }
            this.root_.dispatchEvent(evt);
        };
        return MDCComponent;
    }());
    //# sourceMappingURL=component.js.map

    /**
     * @license
     * Copyright 2019 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    /**
     * Stores result from applyPassive to avoid redundant processing to detect
     * passive event listener support.
     */
    var supportsPassive_;
    /**
     * Determine whether the current browser supports passive event listeners, and
     * if so, use them.
     */
    function applyPassive(globalObj, forceRefresh) {
        if (globalObj === void 0) { globalObj = window; }
        if (forceRefresh === void 0) { forceRefresh = false; }
        if (supportsPassive_ === undefined || forceRefresh) {
            var isSupported_1 = false;
            try {
                globalObj.document.addEventListener('test', function () { return undefined; }, {
                    get passive() {
                        isSupported_1 = true;
                        return isSupported_1;
                    },
                });
            }
            catch (e) {
            } // tslint:disable-line:no-empty cannot throw error due to tests. tslint also disables console.log.
            supportsPassive_ = isSupported_1;
        }
        return supportsPassive_ ? { passive: true } : false;
    }
    //# sourceMappingURL=events.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    function matches(element, selector) {
        var nativeMatches = element.matches
            || element.webkitMatchesSelector
            || element.msMatchesSelector;
        return nativeMatches.call(element, selector);
    }
    //# sourceMappingURL=ponyfill.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses = {
        // Ripple is a special case where the "root" component is really a "mixin" of sorts,
        // given that it's an 'upgrade' to an existing component. That being said it is the root
        // CSS class that all other CSS classes derive from.
        BG_FOCUSED: 'mdc-ripple-upgraded--background-focused',
        FG_ACTIVATION: 'mdc-ripple-upgraded--foreground-activation',
        FG_DEACTIVATION: 'mdc-ripple-upgraded--foreground-deactivation',
        ROOT: 'mdc-ripple-upgraded',
        UNBOUNDED: 'mdc-ripple-upgraded--unbounded',
    };
    var strings = {
        VAR_FG_SCALE: '--mdc-ripple-fg-scale',
        VAR_FG_SIZE: '--mdc-ripple-fg-size',
        VAR_FG_TRANSLATE_END: '--mdc-ripple-fg-translate-end',
        VAR_FG_TRANSLATE_START: '--mdc-ripple-fg-translate-start',
        VAR_LEFT: '--mdc-ripple-left',
        VAR_TOP: '--mdc-ripple-top',
    };
    var numbers = {
        DEACTIVATION_TIMEOUT_MS: 225,
        FG_DEACTIVATION_MS: 150,
        INITIAL_ORIGIN_SCALE: 0.6,
        PADDING: 10,
        TAP_DELAY_MS: 300,
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    // Activation events registered on the root element of each instance for activation
    var ACTIVATION_EVENT_TYPES = [
        'touchstart', 'pointerdown', 'mousedown', 'keydown',
    ];
    // Deactivation events registered on documentElement when a pointer-related down event occurs
    var POINTER_DEACTIVATION_EVENT_TYPES = [
        'touchend', 'pointerup', 'mouseup', 'contextmenu',
    ];
    // simultaneous nested activations
    var activatedTargets = [];
    var MDCRippleFoundation = /** @class */ (function (_super) {
        __extends(MDCRippleFoundation, _super);
        function MDCRippleFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCRippleFoundation.defaultAdapter, adapter)) || this;
            _this.activationAnimationHasEnded_ = false;
            _this.activationTimer_ = 0;
            _this.fgDeactivationRemovalTimer_ = 0;
            _this.fgScale_ = '0';
            _this.frame_ = { width: 0, height: 0 };
            _this.initialSize_ = 0;
            _this.layoutFrame_ = 0;
            _this.maxRadius_ = 0;
            _this.unboundedCoords_ = { left: 0, top: 0 };
            _this.activationState_ = _this.defaultActivationState_();
            _this.activationTimerCallback_ = function () {
                _this.activationAnimationHasEnded_ = true;
                _this.runDeactivationUXLogicIfReady_();
            };
            _this.activateHandler_ = function (e) { return _this.activate_(e); };
            _this.deactivateHandler_ = function () { return _this.deactivate_(); };
            _this.focusHandler_ = function () { return _this.handleFocus(); };
            _this.blurHandler_ = function () { return _this.handleBlur(); };
            _this.resizeHandler_ = function () { return _this.layout(); };
            return _this;
        }
        Object.defineProperty(MDCRippleFoundation, "cssClasses", {
            get: function () {
                return cssClasses;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRippleFoundation, "strings", {
            get: function () {
                return strings;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRippleFoundation, "numbers", {
            get: function () {
                return numbers;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCRippleFoundation, "defaultAdapter", {
            get: function () {
                return {
                    addClass: function () { return undefined; },
                    browserSupportsCssVars: function () { return true; },
                    computeBoundingRect: function () { return ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }); },
                    containsEventTarget: function () { return true; },
                    deregisterDocumentInteractionHandler: function () { return undefined; },
                    deregisterInteractionHandler: function () { return undefined; },
                    deregisterResizeHandler: function () { return undefined; },
                    getWindowPageOffset: function () { return ({ x: 0, y: 0 }); },
                    isSurfaceActive: function () { return true; },
                    isSurfaceDisabled: function () { return true; },
                    isUnbounded: function () { return true; },
                    registerDocumentInteractionHandler: function () { return undefined; },
                    registerInteractionHandler: function () { return undefined; },
                    registerResizeHandler: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    updateCssVariable: function () { return undefined; },
                };
            },
            enumerable: true,
            configurable: true
        });
        MDCRippleFoundation.prototype.init = function () {
            var _this = this;
            var supportsPressRipple = this.supportsPressRipple_();
            this.registerRootHandlers_(supportsPressRipple);
            if (supportsPressRipple) {
                var _a = MDCRippleFoundation.cssClasses, ROOT_1 = _a.ROOT, UNBOUNDED_1 = _a.UNBOUNDED;
                requestAnimationFrame(function () {
                    _this.adapter_.addClass(ROOT_1);
                    if (_this.adapter_.isUnbounded()) {
                        _this.adapter_.addClass(UNBOUNDED_1);
                        // Unbounded ripples need layout logic applied immediately to set coordinates for both shade and ripple
                        _this.layoutInternal_();
                    }
                });
            }
        };
        MDCRippleFoundation.prototype.destroy = function () {
            var _this = this;
            if (this.supportsPressRipple_()) {
                if (this.activationTimer_) {
                    clearTimeout(this.activationTimer_);
                    this.activationTimer_ = 0;
                    this.adapter_.removeClass(MDCRippleFoundation.cssClasses.FG_ACTIVATION);
                }
                if (this.fgDeactivationRemovalTimer_) {
                    clearTimeout(this.fgDeactivationRemovalTimer_);
                    this.fgDeactivationRemovalTimer_ = 0;
                    this.adapter_.removeClass(MDCRippleFoundation.cssClasses.FG_DEACTIVATION);
                }
                var _a = MDCRippleFoundation.cssClasses, ROOT_2 = _a.ROOT, UNBOUNDED_2 = _a.UNBOUNDED;
                requestAnimationFrame(function () {
                    _this.adapter_.removeClass(ROOT_2);
                    _this.adapter_.removeClass(UNBOUNDED_2);
                    _this.removeCssVars_();
                });
            }
            this.deregisterRootHandlers_();
            this.deregisterDeactivationHandlers_();
        };
        /**
         * @param evt Optional event containing position information.
         */
        MDCRippleFoundation.prototype.activate = function (evt) {
            this.activate_(evt);
        };
        MDCRippleFoundation.prototype.deactivate = function () {
            this.deactivate_();
        };
        MDCRippleFoundation.prototype.layout = function () {
            var _this = this;
            if (this.layoutFrame_) {
                cancelAnimationFrame(this.layoutFrame_);
            }
            this.layoutFrame_ = requestAnimationFrame(function () {
                _this.layoutInternal_();
                _this.layoutFrame_ = 0;
            });
        };
        MDCRippleFoundation.prototype.setUnbounded = function (unbounded) {
            var UNBOUNDED = MDCRippleFoundation.cssClasses.UNBOUNDED;
            if (unbounded) {
                this.adapter_.addClass(UNBOUNDED);
            }
            else {
                this.adapter_.removeClass(UNBOUNDED);
            }
        };
        MDCRippleFoundation.prototype.handleFocus = function () {
            var _this = this;
            requestAnimationFrame(function () {
                return _this.adapter_.addClass(MDCRippleFoundation.cssClasses.BG_FOCUSED);
            });
        };
        MDCRippleFoundation.prototype.handleBlur = function () {
            var _this = this;
            requestAnimationFrame(function () {
                return _this.adapter_.removeClass(MDCRippleFoundation.cssClasses.BG_FOCUSED);
            });
        };
        /**
         * We compute this property so that we are not querying information about the client
         * until the point in time where the foundation requests it. This prevents scenarios where
         * client-side feature-detection may happen too early, such as when components are rendered on the server
         * and then initialized at mount time on the client.
         */
        MDCRippleFoundation.prototype.supportsPressRipple_ = function () {
            return this.adapter_.browserSupportsCssVars();
        };
        MDCRippleFoundation.prototype.defaultActivationState_ = function () {
            return {
                activationEvent: undefined,
                hasDeactivationUXRun: false,
                isActivated: false,
                isProgrammatic: false,
                wasActivatedByPointer: false,
                wasElementMadeActive: false,
            };
        };
        /**
         * supportsPressRipple Passed from init to save a redundant function call
         */
        MDCRippleFoundation.prototype.registerRootHandlers_ = function (supportsPressRipple) {
            var _this = this;
            if (supportsPressRipple) {
                ACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                    _this.adapter_.registerInteractionHandler(evtType, _this.activateHandler_);
                });
                if (this.adapter_.isUnbounded()) {
                    this.adapter_.registerResizeHandler(this.resizeHandler_);
                }
            }
            this.adapter_.registerInteractionHandler('focus', this.focusHandler_);
            this.adapter_.registerInteractionHandler('blur', this.blurHandler_);
        };
        MDCRippleFoundation.prototype.registerDeactivationHandlers_ = function (evt) {
            var _this = this;
            if (evt.type === 'keydown') {
                this.adapter_.registerInteractionHandler('keyup', this.deactivateHandler_);
            }
            else {
                POINTER_DEACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                    _this.adapter_.registerDocumentInteractionHandler(evtType, _this.deactivateHandler_);
                });
            }
        };
        MDCRippleFoundation.prototype.deregisterRootHandlers_ = function () {
            var _this = this;
            ACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                _this.adapter_.deregisterInteractionHandler(evtType, _this.activateHandler_);
            });
            this.adapter_.deregisterInteractionHandler('focus', this.focusHandler_);
            this.adapter_.deregisterInteractionHandler('blur', this.blurHandler_);
            if (this.adapter_.isUnbounded()) {
                this.adapter_.deregisterResizeHandler(this.resizeHandler_);
            }
        };
        MDCRippleFoundation.prototype.deregisterDeactivationHandlers_ = function () {
            var _this = this;
            this.adapter_.deregisterInteractionHandler('keyup', this.deactivateHandler_);
            POINTER_DEACTIVATION_EVENT_TYPES.forEach(function (evtType) {
                _this.adapter_.deregisterDocumentInteractionHandler(evtType, _this.deactivateHandler_);
            });
        };
        MDCRippleFoundation.prototype.removeCssVars_ = function () {
            var _this = this;
            var rippleStrings = MDCRippleFoundation.strings;
            var keys = Object.keys(rippleStrings);
            keys.forEach(function (key) {
                if (key.indexOf('VAR_') === 0) {
                    _this.adapter_.updateCssVariable(rippleStrings[key], null);
                }
            });
        };
        MDCRippleFoundation.prototype.activate_ = function (evt) {
            var _this = this;
            if (this.adapter_.isSurfaceDisabled()) {
                return;
            }
            var activationState = this.activationState_;
            if (activationState.isActivated) {
                return;
            }
            // Avoid reacting to follow-on events fired by touch device after an already-processed user interaction
            var previousActivationEvent = this.previousActivationEvent_;
            var isSameInteraction = previousActivationEvent && evt !== undefined && previousActivationEvent.type !== evt.type;
            if (isSameInteraction) {
                return;
            }
            activationState.isActivated = true;
            activationState.isProgrammatic = evt === undefined;
            activationState.activationEvent = evt;
            activationState.wasActivatedByPointer = activationState.isProgrammatic ? false : evt !== undefined && (evt.type === 'mousedown' || evt.type === 'touchstart' || evt.type === 'pointerdown');
            var hasActivatedChild = evt !== undefined && activatedTargets.length > 0 && activatedTargets.some(function (target) { return _this.adapter_.containsEventTarget(target); });
            if (hasActivatedChild) {
                // Immediately reset activation state, while preserving logic that prevents touch follow-on events
                this.resetActivationState_();
                return;
            }
            if (evt !== undefined) {
                activatedTargets.push(evt.target);
                this.registerDeactivationHandlers_(evt);
            }
            activationState.wasElementMadeActive = this.checkElementMadeActive_(evt);
            if (activationState.wasElementMadeActive) {
                this.animateActivation_();
            }
            requestAnimationFrame(function () {
                // Reset array on next frame after the current event has had a chance to bubble to prevent ancestor ripples
                activatedTargets = [];
                if (!activationState.wasElementMadeActive
                    && evt !== undefined
                    && (evt.key === ' ' || evt.keyCode === 32)) {
                    // If space was pressed, try again within an rAF call to detect :active, because different UAs report
                    // active states inconsistently when they're called within event handling code:
                    // - https://bugs.chromium.org/p/chromium/issues/detail?id=635971
                    // - https://bugzilla.mozilla.org/show_bug.cgi?id=1293741
                    // We try first outside rAF to support Edge, which does not exhibit this problem, but will crash if a CSS
                    // variable is set within a rAF callback for a submit button interaction (#2241).
                    activationState.wasElementMadeActive = _this.checkElementMadeActive_(evt);
                    if (activationState.wasElementMadeActive) {
                        _this.animateActivation_();
                    }
                }
                if (!activationState.wasElementMadeActive) {
                    // Reset activation state immediately if element was not made active.
                    _this.activationState_ = _this.defaultActivationState_();
                }
            });
        };
        MDCRippleFoundation.prototype.checkElementMadeActive_ = function (evt) {
            return (evt !== undefined && evt.type === 'keydown') ? this.adapter_.isSurfaceActive() : true;
        };
        MDCRippleFoundation.prototype.animateActivation_ = function () {
            var _this = this;
            var _a = MDCRippleFoundation.strings, VAR_FG_TRANSLATE_START = _a.VAR_FG_TRANSLATE_START, VAR_FG_TRANSLATE_END = _a.VAR_FG_TRANSLATE_END;
            var _b = MDCRippleFoundation.cssClasses, FG_DEACTIVATION = _b.FG_DEACTIVATION, FG_ACTIVATION = _b.FG_ACTIVATION;
            var DEACTIVATION_TIMEOUT_MS = MDCRippleFoundation.numbers.DEACTIVATION_TIMEOUT_MS;
            this.layoutInternal_();
            var translateStart = '';
            var translateEnd = '';
            if (!this.adapter_.isUnbounded()) {
                var _c = this.getFgTranslationCoordinates_(), startPoint = _c.startPoint, endPoint = _c.endPoint;
                translateStart = startPoint.x + "px, " + startPoint.y + "px";
                translateEnd = endPoint.x + "px, " + endPoint.y + "px";
            }
            this.adapter_.updateCssVariable(VAR_FG_TRANSLATE_START, translateStart);
            this.adapter_.updateCssVariable(VAR_FG_TRANSLATE_END, translateEnd);
            // Cancel any ongoing activation/deactivation animations
            clearTimeout(this.activationTimer_);
            clearTimeout(this.fgDeactivationRemovalTimer_);
            this.rmBoundedActivationClasses_();
            this.adapter_.removeClass(FG_DEACTIVATION);
            // Force layout in order to re-trigger the animation.
            this.adapter_.computeBoundingRect();
            this.adapter_.addClass(FG_ACTIVATION);
            this.activationTimer_ = setTimeout(function () { return _this.activationTimerCallback_(); }, DEACTIVATION_TIMEOUT_MS);
        };
        MDCRippleFoundation.prototype.getFgTranslationCoordinates_ = function () {
            var _a = this.activationState_, activationEvent = _a.activationEvent, wasActivatedByPointer = _a.wasActivatedByPointer;
            var startPoint;
            if (wasActivatedByPointer) {
                startPoint = getNormalizedEventCoords(activationEvent, this.adapter_.getWindowPageOffset(), this.adapter_.computeBoundingRect());
            }
            else {
                startPoint = {
                    x: this.frame_.width / 2,
                    y: this.frame_.height / 2,
                };
            }
            // Center the element around the start point.
            startPoint = {
                x: startPoint.x - (this.initialSize_ / 2),
                y: startPoint.y - (this.initialSize_ / 2),
            };
            var endPoint = {
                x: (this.frame_.width / 2) - (this.initialSize_ / 2),
                y: (this.frame_.height / 2) - (this.initialSize_ / 2),
            };
            return { startPoint: startPoint, endPoint: endPoint };
        };
        MDCRippleFoundation.prototype.runDeactivationUXLogicIfReady_ = function () {
            var _this = this;
            // This method is called both when a pointing device is released, and when the activation animation ends.
            // The deactivation animation should only run after both of those occur.
            var FG_DEACTIVATION = MDCRippleFoundation.cssClasses.FG_DEACTIVATION;
            var _a = this.activationState_, hasDeactivationUXRun = _a.hasDeactivationUXRun, isActivated = _a.isActivated;
            var activationHasEnded = hasDeactivationUXRun || !isActivated;
            if (activationHasEnded && this.activationAnimationHasEnded_) {
                this.rmBoundedActivationClasses_();
                this.adapter_.addClass(FG_DEACTIVATION);
                this.fgDeactivationRemovalTimer_ = setTimeout(function () {
                    _this.adapter_.removeClass(FG_DEACTIVATION);
                }, numbers.FG_DEACTIVATION_MS);
            }
        };
        MDCRippleFoundation.prototype.rmBoundedActivationClasses_ = function () {
            var FG_ACTIVATION = MDCRippleFoundation.cssClasses.FG_ACTIVATION;
            this.adapter_.removeClass(FG_ACTIVATION);
            this.activationAnimationHasEnded_ = false;
            this.adapter_.computeBoundingRect();
        };
        MDCRippleFoundation.prototype.resetActivationState_ = function () {
            var _this = this;
            this.previousActivationEvent_ = this.activationState_.activationEvent;
            this.activationState_ = this.defaultActivationState_();
            // Touch devices may fire additional events for the same interaction within a short time.
            // Store the previous event until it's safe to assume that subsequent events are for new interactions.
            setTimeout(function () { return _this.previousActivationEvent_ = undefined; }, MDCRippleFoundation.numbers.TAP_DELAY_MS);
        };
        MDCRippleFoundation.prototype.deactivate_ = function () {
            var _this = this;
            var activationState = this.activationState_;
            // This can happen in scenarios such as when you have a keyup event that blurs the element.
            if (!activationState.isActivated) {
                return;
            }
            var state = __assign({}, activationState);
            if (activationState.isProgrammatic) {
                requestAnimationFrame(function () { return _this.animateDeactivation_(state); });
                this.resetActivationState_();
            }
            else {
                this.deregisterDeactivationHandlers_();
                requestAnimationFrame(function () {
                    _this.activationState_.hasDeactivationUXRun = true;
                    _this.animateDeactivation_(state);
                    _this.resetActivationState_();
                });
            }
        };
        MDCRippleFoundation.prototype.animateDeactivation_ = function (_a) {
            var wasActivatedByPointer = _a.wasActivatedByPointer, wasElementMadeActive = _a.wasElementMadeActive;
            if (wasActivatedByPointer || wasElementMadeActive) {
                this.runDeactivationUXLogicIfReady_();
            }
        };
        MDCRippleFoundation.prototype.layoutInternal_ = function () {
            var _this = this;
            this.frame_ = this.adapter_.computeBoundingRect();
            var maxDim = Math.max(this.frame_.height, this.frame_.width);
            // Surface diameter is treated differently for unbounded vs. bounded ripples.
            // Unbounded ripple diameter is calculated smaller since the surface is expected to already be padded appropriately
            // to extend the hitbox, and the ripple is expected to meet the edges of the padded hitbox (which is typically
            // square). Bounded ripples, on the other hand, are fully expected to expand beyond the surface's longest diameter
            // (calculated based on the diagonal plus a constant padding), and are clipped at the surface's border via
            // `overflow: hidden`.
            var getBoundedRadius = function () {
                var hypotenuse = Math.sqrt(Math.pow(_this.frame_.width, 2) + Math.pow(_this.frame_.height, 2));
                return hypotenuse + MDCRippleFoundation.numbers.PADDING;
            };
            this.maxRadius_ = this.adapter_.isUnbounded() ? maxDim : getBoundedRadius();
            // Ripple is sized as a fraction of the largest dimension of the surface, then scales up using a CSS scale transform
            this.initialSize_ = Math.floor(maxDim * MDCRippleFoundation.numbers.INITIAL_ORIGIN_SCALE);
            this.fgScale_ = "" + this.maxRadius_ / this.initialSize_;
            this.updateLayoutCssVars_();
        };
        MDCRippleFoundation.prototype.updateLayoutCssVars_ = function () {
            var _a = MDCRippleFoundation.strings, VAR_FG_SIZE = _a.VAR_FG_SIZE, VAR_LEFT = _a.VAR_LEFT, VAR_TOP = _a.VAR_TOP, VAR_FG_SCALE = _a.VAR_FG_SCALE;
            this.adapter_.updateCssVariable(VAR_FG_SIZE, this.initialSize_ + "px");
            this.adapter_.updateCssVariable(VAR_FG_SCALE, this.fgScale_);
            if (this.adapter_.isUnbounded()) {
                this.unboundedCoords_ = {
                    left: Math.round((this.frame_.width / 2) - (this.initialSize_ / 2)),
                    top: Math.round((this.frame_.height / 2) - (this.initialSize_ / 2)),
                };
                this.adapter_.updateCssVariable(VAR_LEFT, this.unboundedCoords_.left + "px");
                this.adapter_.updateCssVariable(VAR_TOP, this.unboundedCoords_.top + "px");
            }
        };
        return MDCRippleFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2016 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCRipple = /** @class */ (function (_super) {
        __extends(MDCRipple, _super);
        function MDCRipple() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.disabled = false;
            return _this;
        }
        MDCRipple.attachTo = function (root, opts) {
            if (opts === void 0) { opts = { isUnbounded: undefined }; }
            var ripple = new MDCRipple(root);
            // Only override unbounded behavior if option is explicitly specified
            if (opts.isUnbounded !== undefined) {
                ripple.unbounded = opts.isUnbounded;
            }
            return ripple;
        };
        MDCRipple.createAdapter = function (instance) {
            return {
                addClass: function (className) { return instance.root_.classList.add(className); },
                browserSupportsCssVars: function () { return supportsCssVariables(window); },
                computeBoundingRect: function () { return instance.root_.getBoundingClientRect(); },
                containsEventTarget: function (target) { return instance.root_.contains(target); },
                deregisterDocumentInteractionHandler: function (evtType, handler) {
                    return document.documentElement.removeEventListener(evtType, handler, applyPassive());
                },
                deregisterInteractionHandler: function (evtType, handler) {
                    return instance.root_.removeEventListener(evtType, handler, applyPassive());
                },
                deregisterResizeHandler: function (handler) { return window.removeEventListener('resize', handler); },
                getWindowPageOffset: function () { return ({ x: window.pageXOffset, y: window.pageYOffset }); },
                isSurfaceActive: function () { return matches(instance.root_, ':active'); },
                isSurfaceDisabled: function () { return Boolean(instance.disabled); },
                isUnbounded: function () { return Boolean(instance.unbounded); },
                registerDocumentInteractionHandler: function (evtType, handler) {
                    return document.documentElement.addEventListener(evtType, handler, applyPassive());
                },
                registerInteractionHandler: function (evtType, handler) {
                    return instance.root_.addEventListener(evtType, handler, applyPassive());
                },
                registerResizeHandler: function (handler) { return window.addEventListener('resize', handler); },
                removeClass: function (className) { return instance.root_.classList.remove(className); },
                updateCssVariable: function (varName, value) { return instance.root_.style.setProperty(varName, value); },
            };
        };
        Object.defineProperty(MDCRipple.prototype, "unbounded", {
            get: function () {
                return Boolean(this.unbounded_);
            },
            set: function (unbounded) {
                this.unbounded_ = Boolean(unbounded);
                this.setUnbounded_();
            },
            enumerable: true,
            configurable: true
        });
        MDCRipple.prototype.activate = function () {
            this.foundation_.activate();
        };
        MDCRipple.prototype.deactivate = function () {
            this.foundation_.deactivate();
        };
        MDCRipple.prototype.layout = function () {
            this.foundation_.layout();
        };
        MDCRipple.prototype.getDefaultFoundation = function () {
            return new MDCRippleFoundation(MDCRipple.createAdapter(this));
        };
        MDCRipple.prototype.initialSyncWithDOM = function () {
            var root = this.root_;
            this.unbounded = 'mdcRippleIsUnbounded' in root.dataset;
        };
        /**
         * Closure Compiler throws an access control error when directly accessing a
         * protected or private property inside a getter/setter, like unbounded above.
         * By accessing the protected property inside a method, we solve that problem.
         * That's why this function exists.
         */
        MDCRipple.prototype.setUnbounded_ = function () {
            this.foundation_.setUnbounded(Boolean(this.unbounded_));
        };
        return MDCRipple;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /* node_modules/@smui/common/Label.svelte generated by Svelte v3.18.2 */
    const file = "node_modules/@smui/common/Label.svelte";

    function create_fragment(ctx) {
    	let span;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	let span_levels = [
    		{
    			class: "\n    " + /*className*/ ctx[1] + "\n    " + (/*context*/ ctx[3] === "button"
    			? "mdc-button__label"
    			: "") + "\n    " + (/*context*/ ctx[3] === "fab" ? "mdc-fab__label" : "") + "\n    " + (/*context*/ ctx[3] === "chip" ? "mdc-chip__text" : "") + "\n    " + (/*context*/ ctx[3] === "tab"
    			? "mdc-tab__text-label"
    			: "") + "\n    " + (/*context*/ ctx[3] === "image-list"
    			? "mdc-image-list__label"
    			: "") + "\n    " + (/*context*/ ctx[3] === "snackbar"
    			? "mdc-snackbar__label"
    			: "") + "\n  "
    		},
    		/*context*/ ctx[3] === "snackbar"
    		? { role: "status", "aria-live": "polite" }
    		: {},
    		exclude(/*$$props*/ ctx[4], ["use", "class"])
    	];

    	let span_data = {};

    	for (let i = 0; i < span_levels.length; i += 1) {
    		span_data = assign(span_data, span_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot) default_slot.c();
    			set_attributes(span, span_data);
    			add_location(span, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, span, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[2].call(null, span))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 32) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[5], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null));
    			}

    			set_attributes(span, get_spread_update(span_levels, [
    				dirty & /*className, context*/ 10 && {
    					class: "\n    " + /*className*/ ctx[1] + "\n    " + (/*context*/ ctx[3] === "button"
    					? "mdc-button__label"
    					: "") + "\n    " + (/*context*/ ctx[3] === "fab" ? "mdc-fab__label" : "") + "\n    " + (/*context*/ ctx[3] === "chip" ? "mdc-chip__text" : "") + "\n    " + (/*context*/ ctx[3] === "tab"
    					? "mdc-tab__text-label"
    					: "") + "\n    " + (/*context*/ ctx[3] === "image-list"
    					? "mdc-image-list__label"
    					: "") + "\n    " + (/*context*/ ctx[3] === "snackbar"
    					? "mdc-snackbar__label"
    					: "") + "\n  "
    				},
    				dirty & /*context*/ 8 && (/*context*/ ctx[3] === "snackbar"
    				? { role: "status", "aria-live": "polite" }
    				: {}),
    				dirty & /*exclude, $$props*/ 16 && exclude(/*$$props*/ ctx[4], ["use", "class"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	const context = getContext("SMUI:label:context");
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("$$scope" in $$new_props) $$invalidate(5, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { use, className };
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    	};

    	$$props = exclude_internal_props($$props);
    	return [use, className, forwardEvents, context, $$props, $$scope, $$slots];
    }

    class Label extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { use: 0, class: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Label",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get use() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$1 = {
        FIXED_CLASS: 'mdc-top-app-bar--fixed',
        FIXED_SCROLLED_CLASS: 'mdc-top-app-bar--fixed-scrolled',
        SHORT_CLASS: 'mdc-top-app-bar--short',
        SHORT_COLLAPSED_CLASS: 'mdc-top-app-bar--short-collapsed',
        SHORT_HAS_ACTION_ITEM_CLASS: 'mdc-top-app-bar--short-has-action-item',
    };
    var numbers$1 = {
        DEBOUNCE_THROTTLE_RESIZE_TIME_MS: 100,
        MAX_TOP_APP_BAR_HEIGHT: 128,
    };
    var strings$1 = {
        ACTION_ITEM_SELECTOR: '.mdc-top-app-bar__action-item',
        NAVIGATION_EVENT: 'MDCTopAppBar:nav',
        NAVIGATION_ICON_SELECTOR: '.mdc-top-app-bar__navigation-icon',
        ROOT_SELECTOR: '.mdc-top-app-bar',
        TITLE_SELECTOR: '.mdc-top-app-bar__title',
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTopAppBarBaseFoundation = /** @class */ (function (_super) {
        __extends(MDCTopAppBarBaseFoundation, _super);
        /* istanbul ignore next: optional argument is not a branch statement */
        function MDCTopAppBarBaseFoundation(adapter) {
            return _super.call(this, __assign({}, MDCTopAppBarBaseFoundation.defaultAdapter, adapter)) || this;
        }
        Object.defineProperty(MDCTopAppBarBaseFoundation, "strings", {
            get: function () {
                return strings$1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTopAppBarBaseFoundation, "cssClasses", {
            get: function () {
                return cssClasses$1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTopAppBarBaseFoundation, "numbers", {
            get: function () {
                return numbers$1;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTopAppBarBaseFoundation, "defaultAdapter", {
            /**
             * See {@link MDCTopAppBarAdapter} for typing information on parameters and return types.
             */
            get: function () {
                // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
                return {
                    addClass: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    hasClass: function () { return false; },
                    setStyle: function () { return undefined; },
                    getTopAppBarHeight: function () { return 0; },
                    notifyNavigationIconClicked: function () { return undefined; },
                    getViewportScrollY: function () { return 0; },
                    getTotalActionItems: function () { return 0; },
                };
                // tslint:enable:object-literal-sort-keys
            },
            enumerable: true,
            configurable: true
        });
        /** Other variants of TopAppBar foundation overrides this method */
        MDCTopAppBarBaseFoundation.prototype.handleTargetScroll = function () { }; // tslint:disable-line:no-empty
        /** Other variants of TopAppBar foundation overrides this method */
        MDCTopAppBarBaseFoundation.prototype.handleWindowResize = function () { }; // tslint:disable-line:no-empty
        MDCTopAppBarBaseFoundation.prototype.handleNavigationClick = function () {
            this.adapter_.notifyNavigationIconClicked();
        };
        return MDCTopAppBarBaseFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var INITIAL_VALUE = 0;
    var MDCTopAppBarFoundation = /** @class */ (function (_super) {
        __extends(MDCTopAppBarFoundation, _super);
        /* istanbul ignore next: optional argument is not a branch statement */
        function MDCTopAppBarFoundation(adapter) {
            var _this = _super.call(this, adapter) || this;
            /**
             * Indicates if the top app bar was docked in the previous scroll handler iteration.
             */
            _this.wasDocked_ = true;
            /**
             * Indicates if the top app bar is docked in the fully shown position.
             */
            _this.isDockedShowing_ = true;
            /**
             * Variable for current scroll position of the top app bar
             */
            _this.currentAppBarOffsetTop_ = 0;
            /**
             * Used to prevent the top app bar from being scrolled out of view during resize events
             */
            _this.isCurrentlyBeingResized_ = false;
            /**
             * The timeout that's used to throttle the resize events
             */
            _this.resizeThrottleId_ = INITIAL_VALUE;
            /**
             * The timeout that's used to debounce toggling the isCurrentlyBeingResized_ variable after a resize
             */
            _this.resizeDebounceId_ = INITIAL_VALUE;
            _this.lastScrollPosition_ = _this.adapter_.getViewportScrollY();
            _this.topAppBarHeight_ = _this.adapter_.getTopAppBarHeight();
            return _this;
        }
        MDCTopAppBarFoundation.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            this.adapter_.setStyle('top', '');
        };
        /**
         * Scroll handler for the default scroll behavior of the top app bar.
         * @override
         */
        MDCTopAppBarFoundation.prototype.handleTargetScroll = function () {
            var currentScrollPosition = Math.max(this.adapter_.getViewportScrollY(), 0);
            var diff = currentScrollPosition - this.lastScrollPosition_;
            this.lastScrollPosition_ = currentScrollPosition;
            // If the window is being resized the lastScrollPosition_ needs to be updated but the
            // current scroll of the top app bar should stay in the same position.
            if (!this.isCurrentlyBeingResized_) {
                this.currentAppBarOffsetTop_ -= diff;
                if (this.currentAppBarOffsetTop_ > 0) {
                    this.currentAppBarOffsetTop_ = 0;
                }
                else if (Math.abs(this.currentAppBarOffsetTop_) > this.topAppBarHeight_) {
                    this.currentAppBarOffsetTop_ = -this.topAppBarHeight_;
                }
                this.moveTopAppBar_();
            }
        };
        /**
         * Top app bar resize handler that throttle/debounce functions that execute updates.
         * @override
         */
        MDCTopAppBarFoundation.prototype.handleWindowResize = function () {
            var _this = this;
            // Throttle resize events 10 p/s
            if (!this.resizeThrottleId_) {
                this.resizeThrottleId_ = setTimeout(function () {
                    _this.resizeThrottleId_ = INITIAL_VALUE;
                    _this.throttledResizeHandler_();
                }, numbers$1.DEBOUNCE_THROTTLE_RESIZE_TIME_MS);
            }
            this.isCurrentlyBeingResized_ = true;
            if (this.resizeDebounceId_) {
                clearTimeout(this.resizeDebounceId_);
            }
            this.resizeDebounceId_ = setTimeout(function () {
                _this.handleTargetScroll();
                _this.isCurrentlyBeingResized_ = false;
                _this.resizeDebounceId_ = INITIAL_VALUE;
            }, numbers$1.DEBOUNCE_THROTTLE_RESIZE_TIME_MS);
        };
        /**
         * Function to determine if the DOM needs to update.
         */
        MDCTopAppBarFoundation.prototype.checkForUpdate_ = function () {
            var offscreenBoundaryTop = -this.topAppBarHeight_;
            var hasAnyPixelsOffscreen = this.currentAppBarOffsetTop_ < 0;
            var hasAnyPixelsOnscreen = this.currentAppBarOffsetTop_ > offscreenBoundaryTop;
            var partiallyShowing = hasAnyPixelsOffscreen && hasAnyPixelsOnscreen;
            // If it's partially showing, it can't be docked.
            if (partiallyShowing) {
                this.wasDocked_ = false;
            }
            else {
                // Not previously docked and not partially showing, it's now docked.
                if (!this.wasDocked_) {
                    this.wasDocked_ = true;
                    return true;
                }
                else if (this.isDockedShowing_ !== hasAnyPixelsOnscreen) {
                    this.isDockedShowing_ = hasAnyPixelsOnscreen;
                    return true;
                }
            }
            return partiallyShowing;
        };
        /**
         * Function to move the top app bar if needed.
         */
        MDCTopAppBarFoundation.prototype.moveTopAppBar_ = function () {
            if (this.checkForUpdate_()) {
                // Once the top app bar is fully hidden we use the max potential top app bar height as our offset
                // so the top app bar doesn't show if the window resizes and the new height > the old height.
                var offset = this.currentAppBarOffsetTop_;
                if (Math.abs(offset) >= this.topAppBarHeight_) {
                    offset = -numbers$1.MAX_TOP_APP_BAR_HEIGHT;
                }
                this.adapter_.setStyle('top', offset + 'px');
            }
        };
        /**
         * Throttled function that updates the top app bar scrolled values if the
         * top app bar height changes.
         */
        MDCTopAppBarFoundation.prototype.throttledResizeHandler_ = function () {
            var currentHeight = this.adapter_.getTopAppBarHeight();
            if (this.topAppBarHeight_ !== currentHeight) {
                this.wasDocked_ = false;
                // Since the top app bar has a different height depending on the screen width, this
                // will ensure that the top app bar remains in the correct location if
                // completely hidden and a resize makes the top app bar a different height.
                this.currentAppBarOffsetTop_ -= this.topAppBarHeight_ - currentHeight;
                this.topAppBarHeight_ = currentHeight;
            }
            this.handleTargetScroll();
        };
        return MDCTopAppBarFoundation;
    }(MDCTopAppBarBaseFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCFixedTopAppBarFoundation = /** @class */ (function (_super) {
        __extends(MDCFixedTopAppBarFoundation, _super);
        function MDCFixedTopAppBarFoundation() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            /**
             * State variable for the previous scroll iteration top app bar state
             */
            _this.wasScrolled_ = false;
            return _this;
        }
        /**
         * Scroll handler for applying/removing the modifier class on the fixed top app bar.
         * @override
         */
        MDCFixedTopAppBarFoundation.prototype.handleTargetScroll = function () {
            var currentScroll = this.adapter_.getViewportScrollY();
            if (currentScroll <= 0) {
                if (this.wasScrolled_) {
                    this.adapter_.removeClass(cssClasses$1.FIXED_SCROLLED_CLASS);
                    this.wasScrolled_ = false;
                }
            }
            else {
                if (!this.wasScrolled_) {
                    this.adapter_.addClass(cssClasses$1.FIXED_SCROLLED_CLASS);
                    this.wasScrolled_ = true;
                }
            }
        };
        return MDCFixedTopAppBarFoundation;
    }(MDCTopAppBarFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCShortTopAppBarFoundation = /** @class */ (function (_super) {
        __extends(MDCShortTopAppBarFoundation, _super);
        /* istanbul ignore next: optional argument is not a branch statement */
        function MDCShortTopAppBarFoundation(adapter) {
            var _this = _super.call(this, adapter) || this;
            _this.isCollapsed_ = false;
            _this.isAlwaysCollapsed_ = false;
            return _this;
        }
        Object.defineProperty(MDCShortTopAppBarFoundation.prototype, "isCollapsed", {
            // Public visibility for backward compatibility.
            get: function () {
                return this.isCollapsed_;
            },
            enumerable: true,
            configurable: true
        });
        MDCShortTopAppBarFoundation.prototype.init = function () {
            _super.prototype.init.call(this);
            if (this.adapter_.getTotalActionItems() > 0) {
                this.adapter_.addClass(cssClasses$1.SHORT_HAS_ACTION_ITEM_CLASS);
            }
            // If initialized with SHORT_COLLAPSED_CLASS, the bar should always be collapsed
            this.setAlwaysCollapsed(this.adapter_.hasClass(cssClasses$1.SHORT_COLLAPSED_CLASS));
        };
        /**
         * Set if the short top app bar should always be collapsed.
         *
         * @param value When `true`, bar will always be collapsed. When `false`, bar may collapse or expand based on scroll.
         */
        MDCShortTopAppBarFoundation.prototype.setAlwaysCollapsed = function (value) {
            this.isAlwaysCollapsed_ = !!value;
            if (this.isAlwaysCollapsed_) {
                this.collapse_();
            }
            else {
                // let maybeCollapseBar_ determine if the bar should be collapsed
                this.maybeCollapseBar_();
            }
        };
        MDCShortTopAppBarFoundation.prototype.getAlwaysCollapsed = function () {
            return this.isAlwaysCollapsed_;
        };
        /**
         * Scroll handler for applying/removing the collapsed modifier class on the short top app bar.
         * @override
         */
        MDCShortTopAppBarFoundation.prototype.handleTargetScroll = function () {
            this.maybeCollapseBar_();
        };
        MDCShortTopAppBarFoundation.prototype.maybeCollapseBar_ = function () {
            if (this.isAlwaysCollapsed_) {
                return;
            }
            var currentScroll = this.adapter_.getViewportScrollY();
            if (currentScroll <= 0) {
                if (this.isCollapsed_) {
                    this.uncollapse_();
                }
            }
            else {
                if (!this.isCollapsed_) {
                    this.collapse_();
                }
            }
        };
        MDCShortTopAppBarFoundation.prototype.uncollapse_ = function () {
            this.adapter_.removeClass(cssClasses$1.SHORT_COLLAPSED_CLASS);
            this.isCollapsed_ = false;
        };
        MDCShortTopAppBarFoundation.prototype.collapse_ = function () {
            this.adapter_.addClass(cssClasses$1.SHORT_COLLAPSED_CLASS);
            this.isCollapsed_ = true;
        };
        return MDCShortTopAppBarFoundation;
    }(MDCTopAppBarBaseFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTopAppBar = /** @class */ (function (_super) {
        __extends(MDCTopAppBar, _super);
        function MDCTopAppBar() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCTopAppBar.attachTo = function (root) {
            return new MDCTopAppBar(root);
        };
        MDCTopAppBar.prototype.initialize = function (rippleFactory) {
            if (rippleFactory === void 0) { rippleFactory = function (el) { return MDCRipple.attachTo(el); }; }
            this.navIcon_ = this.root_.querySelector(strings$1.NAVIGATION_ICON_SELECTOR);
            // Get all icons in the toolbar and instantiate the ripples
            var icons = [].slice.call(this.root_.querySelectorAll(strings$1.ACTION_ITEM_SELECTOR));
            if (this.navIcon_) {
                icons.push(this.navIcon_);
            }
            this.iconRipples_ = icons.map(function (icon) {
                var ripple = rippleFactory(icon);
                ripple.unbounded = true;
                return ripple;
            });
            this.scrollTarget_ = window;
        };
        MDCTopAppBar.prototype.initialSyncWithDOM = function () {
            this.handleNavigationClick_ = this.foundation_.handleNavigationClick.bind(this.foundation_);
            this.handleWindowResize_ = this.foundation_.handleWindowResize.bind(this.foundation_);
            this.handleTargetScroll_ = this.foundation_.handleTargetScroll.bind(this.foundation_);
            this.scrollTarget_.addEventListener('scroll', this.handleTargetScroll_);
            if (this.navIcon_) {
                this.navIcon_.addEventListener('click', this.handleNavigationClick_);
            }
            var isFixed = this.root_.classList.contains(cssClasses$1.FIXED_CLASS);
            var isShort = this.root_.classList.contains(cssClasses$1.SHORT_CLASS);
            if (!isShort && !isFixed) {
                window.addEventListener('resize', this.handleWindowResize_);
            }
        };
        MDCTopAppBar.prototype.destroy = function () {
            this.iconRipples_.forEach(function (iconRipple) { return iconRipple.destroy(); });
            this.scrollTarget_.removeEventListener('scroll', this.handleTargetScroll_);
            if (this.navIcon_) {
                this.navIcon_.removeEventListener('click', this.handleNavigationClick_);
            }
            var isFixed = this.root_.classList.contains(cssClasses$1.FIXED_CLASS);
            var isShort = this.root_.classList.contains(cssClasses$1.SHORT_CLASS);
            if (!isShort && !isFixed) {
                window.removeEventListener('resize', this.handleWindowResize_);
            }
            _super.prototype.destroy.call(this);
        };
        MDCTopAppBar.prototype.setScrollTarget = function (target) {
            // Remove scroll handler from the previous scroll target
            this.scrollTarget_.removeEventListener('scroll', this.handleTargetScroll_);
            this.scrollTarget_ = target;
            // Initialize scroll handler on the new scroll target
            this.handleTargetScroll_ =
                this.foundation_.handleTargetScroll.bind(this.foundation_);
            this.scrollTarget_.addEventListener('scroll', this.handleTargetScroll_);
        };
        MDCTopAppBar.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = {
                hasClass: function (className) { return _this.root_.classList.contains(className); },
                addClass: function (className) { return _this.root_.classList.add(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                setStyle: function (property, value) { return _this.root_.style.setProperty(property, value); },
                getTopAppBarHeight: function () { return _this.root_.clientHeight; },
                notifyNavigationIconClicked: function () { return _this.emit(strings$1.NAVIGATION_EVENT, {}); },
                getViewportScrollY: function () {
                    var win = _this.scrollTarget_;
                    var el = _this.scrollTarget_;
                    return win.pageYOffset !== undefined ? win.pageYOffset : el.scrollTop;
                },
                getTotalActionItems: function () { return _this.root_.querySelectorAll(strings$1.ACTION_ITEM_SELECTOR).length; },
            };
            // tslint:enable:object-literal-sort-keys
            var foundation;
            if (this.root_.classList.contains(cssClasses$1.SHORT_CLASS)) {
                foundation = new MDCShortTopAppBarFoundation(adapter);
            }
            else if (this.root_.classList.contains(cssClasses$1.FIXED_CLASS)) {
                foundation = new MDCFixedTopAppBarFoundation(adapter);
            }
            else {
                foundation = new MDCTopAppBarFoundation(adapter);
            }
            return foundation;
        };
        return MDCTopAppBar;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /* node_modules/@smui/top-app-bar/TopAppBar.svelte generated by Svelte v3.18.2 */
    const file$1 = "node_modules/@smui/top-app-bar/TopAppBar.svelte";

    function create_fragment$1(ctx) {
    	let header;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

    	let header_levels = [
    		{
    			class: "\n    mdc-top-app-bar\n    " + /*className*/ ctx[1] + "\n    " + (/*variant*/ ctx[2] === "short"
    			? "mdc-top-app-bar--short"
    			: "") + "\n    " + (/*collapsed*/ ctx[4]
    			? "mdc-top-app-bar--short-collapsed"
    			: "") + "\n    " + (/*variant*/ ctx[2] === "fixed"
    			? "mdc-top-app-bar--fixed"
    			: "") + "\n    " + (/*variant*/ ctx[2] === "static"
    			? "smui-top-app-bar--static"
    			: "") + "\n    " + (/*color*/ ctx[3] === "secondary"
    			? "smui-top-app-bar--color-secondary"
    			: "") + "\n    " + (/*prominent*/ ctx[5] ? "mdc-top-app-bar--prominent" : "") + "\n    " + (/*dense*/ ctx[6] ? "mdc-top-app-bar--dense" : "") + "\n  "
    		},
    		exclude(/*$$props*/ ctx[9], ["use", "class", "variant", "color", "collapsed", "prominent", "dense"])
    	];

    	let header_data = {};

    	for (let i = 0; i < header_levels.length; i += 1) {
    		header_data = assign(header_data, header_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			header = element("header");
    			if (default_slot) default_slot.c();
    			set_attributes(header, header_data);
    			add_location(header, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);

    			if (default_slot) {
    				default_slot.m(header, null);
    			}

    			/*header_binding*/ ctx[13](header);
    			current = true;

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, header, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[8].call(null, header))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 2048) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[11], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null));
    			}

    			set_attributes(header, get_spread_update(header_levels, [
    				dirty & /*className, variant, collapsed, color, prominent, dense*/ 126 && {
    					class: "\n    mdc-top-app-bar\n    " + /*className*/ ctx[1] + "\n    " + (/*variant*/ ctx[2] === "short"
    					? "mdc-top-app-bar--short"
    					: "") + "\n    " + (/*collapsed*/ ctx[4]
    					? "mdc-top-app-bar--short-collapsed"
    					: "") + "\n    " + (/*variant*/ ctx[2] === "fixed"
    					? "mdc-top-app-bar--fixed"
    					: "") + "\n    " + (/*variant*/ ctx[2] === "static"
    					? "smui-top-app-bar--static"
    					: "") + "\n    " + (/*color*/ ctx[3] === "secondary"
    					? "smui-top-app-bar--color-secondary"
    					: "") + "\n    " + (/*prominent*/ ctx[5] ? "mdc-top-app-bar--prominent" : "") + "\n    " + (/*dense*/ ctx[6] ? "mdc-top-app-bar--dense" : "") + "\n  "
    				},
    				dirty & /*exclude, $$props*/ 512 && exclude(/*$$props*/ ctx[9], ["use", "class", "variant", "color", "collapsed", "prominent", "dense"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (default_slot) default_slot.d(detaching);
    			/*header_binding*/ ctx[13](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component, ["MDCList:action"]);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { variant = "standard" } = $$props;
    	let { color = "primary" } = $$props;
    	let { collapsed = false } = $$props;
    	let { prominent = false } = $$props;
    	let { dense = false } = $$props;
    	let element;
    	let topAppBar;

    	onMount(() => {
    		topAppBar = new MDCTopAppBar(element);
    	});

    	onDestroy(() => {
    		topAppBar && topAppBar.destroy();
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function header_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(7, element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(9, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("variant" in $$new_props) $$invalidate(2, variant = $$new_props.variant);
    		if ("color" in $$new_props) $$invalidate(3, color = $$new_props.color);
    		if ("collapsed" in $$new_props) $$invalidate(4, collapsed = $$new_props.collapsed);
    		if ("prominent" in $$new_props) $$invalidate(5, prominent = $$new_props.prominent);
    		if ("dense" in $$new_props) $$invalidate(6, dense = $$new_props.dense);
    		if ("$$scope" in $$new_props) $$invalidate(11, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			use,
    			className,
    			variant,
    			color,
    			collapsed,
    			prominent,
    			dense,
    			element,
    			topAppBar
    		};
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(9, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("variant" in $$props) $$invalidate(2, variant = $$new_props.variant);
    		if ("color" in $$props) $$invalidate(3, color = $$new_props.color);
    		if ("collapsed" in $$props) $$invalidate(4, collapsed = $$new_props.collapsed);
    		if ("prominent" in $$props) $$invalidate(5, prominent = $$new_props.prominent);
    		if ("dense" in $$props) $$invalidate(6, dense = $$new_props.dense);
    		if ("element" in $$props) $$invalidate(7, element = $$new_props.element);
    		if ("topAppBar" in $$props) topAppBar = $$new_props.topAppBar;
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		variant,
    		color,
    		collapsed,
    		prominent,
    		dense,
    		element,
    		forwardEvents,
    		$$props,
    		topAppBar,
    		$$scope,
    		$$slots,
    		header_binding
    	];
    }

    class TopAppBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			use: 0,
    			class: 1,
    			variant: 2,
    			color: 3,
    			collapsed: 4,
    			prominent: 5,
    			dense: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TopAppBar",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get use() {
    		throw new Error("<TopAppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<TopAppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<TopAppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<TopAppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get variant() {
    		throw new Error("<TopAppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set variant(value) {
    		throw new Error("<TopAppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<TopAppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<TopAppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get collapsed() {
    		throw new Error("<TopAppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set collapsed(value) {
    		throw new Error("<TopAppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prominent() {
    		throw new Error("<TopAppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prominent(value) {
    		throw new Error("<TopAppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dense() {
    		throw new Error("<TopAppBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dense(value) {
    		throw new Error("<TopAppBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@smui/common/ClassAdder.svelte generated by Svelte v3.18.2 */

    // (1:0) <svelte:component   this={component}   use={[forwardEvents, ...use]}   class="{smuiClass} {className}"   {...exclude($$props, ['use', 'class', 'component', 'forwardEvents'])} >
    function create_default_slot(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 512) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[9], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(1:0) <svelte:component   this={component}   use={[forwardEvents, ...use]}   class=\\\"{smuiClass} {className}\\\"   {...exclude($$props, ['use', 'class', 'component', 'forwardEvents'])} >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let switch_instance_anchor;
    	let current;

    	const switch_instance_spread_levels = [
    		{
    			use: [/*forwardEvents*/ ctx[4], .../*use*/ ctx[0]]
    		},
    		{
    			class: "" + (/*smuiClass*/ ctx[3] + " " + /*className*/ ctx[1])
    		},
    		exclude(/*$$props*/ ctx[5], ["use", "class", "component", "forwardEvents"])
    	];

    	var switch_value = /*component*/ ctx[2];

    	function switch_props(ctx) {
    		let switch_instance_props = {
    			$$slots: { default: [create_default_slot] },
    			$$scope: { ctx }
    		};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return {
    			props: switch_instance_props,
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = (dirty & /*forwardEvents, use, smuiClass, className, exclude, $$props*/ 59)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*forwardEvents, use*/ 17 && {
    						use: [/*forwardEvents*/ ctx[4], .../*use*/ ctx[0]]
    					},
    					dirty & /*smuiClass, className*/ 10 && {
    						class: "" + (/*smuiClass*/ ctx[3] + " " + /*className*/ ctx[1])
    					},
    					dirty & /*exclude, $$props*/ 32 && get_spread_object(exclude(/*$$props*/ ctx[5], ["use", "class", "component", "forwardEvents"]))
    				])
    			: {};

    			if (dirty & /*$$scope*/ 512) {
    				switch_instance_changes.$$scope = { dirty, ctx };
    			}

    			if (switch_value !== (switch_value = /*component*/ ctx[2])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const internals = {
    	component: null,
    	smuiClass: null,
    	contexts: {}
    };

    function instance$2($$self, $$props, $$invalidate) {
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { component = internals.component } = $$props;
    	let { forwardEvents: smuiForwardEvents = [] } = $$props;
    	const smuiClass = internals.class;
    	const contexts = internals.contexts;
    	const forwardEvents = forwardEventsBuilder(current_component, smuiForwardEvents);

    	for (let context in contexts) {
    		if (contexts.hasOwnProperty(context)) {
    			setContext(context, contexts[context]);
    		}
    	}

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("component" in $$new_props) $$invalidate(2, component = $$new_props.component);
    		if ("forwardEvents" in $$new_props) $$invalidate(6, smuiForwardEvents = $$new_props.forwardEvents);
    		if ("$$scope" in $$new_props) $$invalidate(9, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			use,
    			className,
    			component,
    			smuiForwardEvents
    		};
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("component" in $$props) $$invalidate(2, component = $$new_props.component);
    		if ("smuiForwardEvents" in $$props) $$invalidate(6, smuiForwardEvents = $$new_props.smuiForwardEvents);
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		component,
    		smuiClass,
    		forwardEvents,
    		$$props,
    		smuiForwardEvents,
    		contexts,
    		$$slots,
    		$$scope
    	];
    }

    class ClassAdder extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			use: 0,
    			class: 1,
    			component: 2,
    			forwardEvents: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ClassAdder",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get use() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get component() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set component(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get forwardEvents() {
    		throw new Error("<ClassAdder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set forwardEvents(value) {
    		throw new Error("<ClassAdder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function classAdderBuilder(props) {
      function Component(...args) {
        Object.assign(internals, props);
        return new ClassAdder(...args);
      }

      Component.prototype = ClassAdder;

      // SSR support
      if (ClassAdder.$$render) {
        Component.$$render = (...args) => Object.assign(internals, props) && ClassAdder.$$render(...args);
      }
      if (ClassAdder.render) {
        Component.render = (...args) => Object.assign(internals, props) && ClassAdder.render(...args);
      }

      return Component;
    }

    /* node_modules/@smui/common/Div.svelte generated by Svelte v3.18.2 */
    const file$2 = "node_modules/@smui/common/Div.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let div_levels = [exclude(/*$$props*/ ctx[2], ["use"])];
    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div, div_data);
    			add_location(div, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, div, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[1].call(null, div))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			set_attributes(div, get_spread_update(div_levels, [dirty & /*exclude, $$props*/ 4 && exclude(/*$$props*/ ctx[2], ["use"])]));
    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { use };
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    	};

    	$$props = exclude_internal_props($$props);
    	return [use, forwardEvents, $$props, $$scope, $$slots];
    }

    class Div extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { use: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Div",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get use() {
    		throw new Error("<Div>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Div>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Row = classAdderBuilder({
      class: 'mdc-top-app-bar__row',
      component: Div,
      contexts: {}
    });

    /* node_modules/@smui/top-app-bar/Section.svelte generated by Svelte v3.18.2 */
    const file$3 = "node_modules/@smui/top-app-bar/Section.svelte";

    function create_fragment$4(ctx) {
    	let section;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	let section_levels = [
    		{
    			class: "\n    mdc-top-app-bar__section\n    " + /*className*/ ctx[1] + "\n    " + (/*align*/ ctx[2] === "start"
    			? "mdc-top-app-bar__section--align-start"
    			: "") + "\n    " + (/*align*/ ctx[2] === "end"
    			? "mdc-top-app-bar__section--align-end"
    			: "") + "\n  "
    		},
    		/*toolbar*/ ctx[3] ? { role: "toolbar" } : {},
    		exclude(/*$$props*/ ctx[5], ["use", "class", "align", "toolbar"])
    	];

    	let section_data = {};

    	for (let i = 0; i < section_levels.length; i += 1) {
    		section_data = assign(section_data, section_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			if (default_slot) default_slot.c();
    			set_attributes(section, section_data);
    			add_location(section, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);

    			if (default_slot) {
    				default_slot.m(section, null);
    			}

    			current = true;

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, section, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[4].call(null, section))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 64) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[6], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null));
    			}

    			set_attributes(section, get_spread_update(section_levels, [
    				dirty & /*className, align*/ 6 && {
    					class: "\n    mdc-top-app-bar__section\n    " + /*className*/ ctx[1] + "\n    " + (/*align*/ ctx[2] === "start"
    					? "mdc-top-app-bar__section--align-start"
    					: "") + "\n    " + (/*align*/ ctx[2] === "end"
    					? "mdc-top-app-bar__section--align-end"
    					: "") + "\n  "
    				},
    				dirty & /*toolbar*/ 8 && (/*toolbar*/ ctx[3] ? { role: "toolbar" } : {}),
    				dirty & /*exclude, $$props*/ 32 && exclude(/*$$props*/ ctx[5], ["use", "class", "align", "toolbar"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component, ["MDCList:action"]);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { align = "start" } = $$props;
    	let { toolbar = false } = $$props;

    	setContext("SMUI:icon-button:context", toolbar
    	? "top-app-bar:action"
    	: "top-app-bar:navigation");

    	setContext("SMUI:button:context", toolbar
    	? "top-app-bar:action"
    	: "top-app-bar:navigation");

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("align" in $$new_props) $$invalidate(2, align = $$new_props.align);
    		if ("toolbar" in $$new_props) $$invalidate(3, toolbar = $$new_props.toolbar);
    		if ("$$scope" in $$new_props) $$invalidate(6, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { use, className, align, toolbar };
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(5, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("align" in $$props) $$invalidate(2, align = $$new_props.align);
    		if ("toolbar" in $$props) $$invalidate(3, toolbar = $$new_props.toolbar);
    	};

    	$$props = exclude_internal_props($$props);
    	return [use, className, align, toolbar, forwardEvents, $$props, $$scope, $$slots];
    }

    class Section extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { use: 0, class: 1, align: 2, toolbar: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Section",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get use() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get align() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set align(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get toolbar() {
    		throw new Error("<Section>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set toolbar(value) {
    		throw new Error("<Section>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@smui/common/Span.svelte generated by Svelte v3.18.2 */
    const file$4 = "node_modules/@smui/common/Span.svelte";

    function create_fragment$5(ctx) {
    	let span;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
    	let span_levels = [exclude(/*$$props*/ ctx[2], ["use"])];
    	let span_data = {};

    	for (let i = 0; i < span_levels.length; i += 1) {
    		span_data = assign(span_data, span_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot) default_slot.c();
    			set_attributes(span, span_data);
    			add_location(span, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, span, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[1].call(null, span))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			set_attributes(span, get_spread_update(span_levels, [dirty & /*exclude, $$props*/ 4 && exclude(/*$$props*/ ctx[2], ["use"])]));
    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("$$scope" in $$new_props) $$invalidate(3, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { use };
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(2, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    	};

    	$$props = exclude_internal_props($$props);
    	return [use, forwardEvents, $$props, $$scope, $$slots];
    }

    class Span extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { use: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Span",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get use() {
    		throw new Error("<Span>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<Span>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var Title = classAdderBuilder({
      class: 'mdc-top-app-bar__title',
      component: Span,
      contexts: {}
    });

    function FixedAdjust(node) {
      node.classList.add('mdc-top-app-bar--fixed-adjust');

      return {
        destroy() {
          node.classList.remove('mdc-top-app-bar--fixed-adjust');
        }
      }
    }

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$2 = {
        ACTIVE: 'mdc-tab-indicator--active',
        FADE: 'mdc-tab-indicator--fade',
        NO_TRANSITION: 'mdc-tab-indicator--no-transition',
    };
    var strings$2 = {
        CONTENT_SELECTOR: '.mdc-tab-indicator__content',
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTabIndicatorFoundation = /** @class */ (function (_super) {
        __extends(MDCTabIndicatorFoundation, _super);
        function MDCTabIndicatorFoundation(adapter) {
            return _super.call(this, __assign({}, MDCTabIndicatorFoundation.defaultAdapter, adapter)) || this;
        }
        Object.defineProperty(MDCTabIndicatorFoundation, "cssClasses", {
            get: function () {
                return cssClasses$2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTabIndicatorFoundation, "strings", {
            get: function () {
                return strings$2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTabIndicatorFoundation, "defaultAdapter", {
            get: function () {
                // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
                return {
                    addClass: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    computeContentClientRect: function () { return ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }); },
                    setContentStyleProperty: function () { return undefined; },
                };
                // tslint:enable:object-literal-sort-keys
            },
            enumerable: true,
            configurable: true
        });
        MDCTabIndicatorFoundation.prototype.computeContentClientRect = function () {
            return this.adapter_.computeContentClientRect();
        };
        return MDCTabIndicatorFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    /* istanbul ignore next: subclass is not a branch statement */
    var MDCFadingTabIndicatorFoundation = /** @class */ (function (_super) {
        __extends(MDCFadingTabIndicatorFoundation, _super);
        function MDCFadingTabIndicatorFoundation() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCFadingTabIndicatorFoundation.prototype.activate = function () {
            this.adapter_.addClass(MDCTabIndicatorFoundation.cssClasses.ACTIVE);
        };
        MDCFadingTabIndicatorFoundation.prototype.deactivate = function () {
            this.adapter_.removeClass(MDCTabIndicatorFoundation.cssClasses.ACTIVE);
        };
        return MDCFadingTabIndicatorFoundation;
    }(MDCTabIndicatorFoundation));
    //# sourceMappingURL=fading-foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    /* istanbul ignore next: subclass is not a branch statement */
    var MDCSlidingTabIndicatorFoundation = /** @class */ (function (_super) {
        __extends(MDCSlidingTabIndicatorFoundation, _super);
        function MDCSlidingTabIndicatorFoundation() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCSlidingTabIndicatorFoundation.prototype.activate = function (previousIndicatorClientRect) {
            // Early exit if no indicator is present to handle cases where an indicator
            // may be activated without a prior indicator state
            if (!previousIndicatorClientRect) {
                this.adapter_.addClass(MDCTabIndicatorFoundation.cssClasses.ACTIVE);
                return;
            }
            // This animation uses the FLIP approach. You can read more about it at the link below:
            // https://aerotwist.com/blog/flip-your-animations/
            // Calculate the dimensions based on the dimensions of the previous indicator
            var currentClientRect = this.computeContentClientRect();
            var widthDelta = previousIndicatorClientRect.width / currentClientRect.width;
            var xPosition = previousIndicatorClientRect.left - currentClientRect.left;
            this.adapter_.addClass(MDCTabIndicatorFoundation.cssClasses.NO_TRANSITION);
            this.adapter_.setContentStyleProperty('transform', "translateX(" + xPosition + "px) scaleX(" + widthDelta + ")");
            // Force repaint before updating classes and transform to ensure the transform properly takes effect
            this.computeContentClientRect();
            this.adapter_.removeClass(MDCTabIndicatorFoundation.cssClasses.NO_TRANSITION);
            this.adapter_.addClass(MDCTabIndicatorFoundation.cssClasses.ACTIVE);
            this.adapter_.setContentStyleProperty('transform', '');
        };
        MDCSlidingTabIndicatorFoundation.prototype.deactivate = function () {
            this.adapter_.removeClass(MDCTabIndicatorFoundation.cssClasses.ACTIVE);
        };
        return MDCSlidingTabIndicatorFoundation;
    }(MDCTabIndicatorFoundation));
    //# sourceMappingURL=sliding-foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTabIndicator = /** @class */ (function (_super) {
        __extends(MDCTabIndicator, _super);
        function MDCTabIndicator() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCTabIndicator.attachTo = function (root) {
            return new MDCTabIndicator(root);
        };
        MDCTabIndicator.prototype.initialize = function () {
            this.content_ = this.root_.querySelector(MDCTabIndicatorFoundation.strings.CONTENT_SELECTOR);
        };
        MDCTabIndicator.prototype.computeContentClientRect = function () {
            return this.foundation_.computeContentClientRect();
        };
        MDCTabIndicator.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = {
                addClass: function (className) { return _this.root_.classList.add(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                computeContentClientRect: function () { return _this.content_.getBoundingClientRect(); },
                setContentStyleProperty: function (prop, value) { return _this.content_.style.setProperty(prop, value); },
            };
            // tslint:enable:object-literal-sort-keys
            if (this.root_.classList.contains(MDCTabIndicatorFoundation.cssClasses.FADE)) {
                return new MDCFadingTabIndicatorFoundation(adapter);
            }
            // Default to the sliding indicator
            return new MDCSlidingTabIndicatorFoundation(adapter);
        };
        MDCTabIndicator.prototype.activate = function (previousIndicatorClientRect) {
            this.foundation_.activate(previousIndicatorClientRect);
        };
        MDCTabIndicator.prototype.deactivate = function () {
            this.foundation_.deactivate();
        };
        return MDCTabIndicator;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$3 = {
        ACTIVE: 'mdc-tab--active',
    };
    var strings$3 = {
        ARIA_SELECTED: 'aria-selected',
        CONTENT_SELECTOR: '.mdc-tab__content',
        INTERACTED_EVENT: 'MDCTab:interacted',
        RIPPLE_SELECTOR: '.mdc-tab__ripple',
        TABINDEX: 'tabIndex',
        TAB_INDICATOR_SELECTOR: '.mdc-tab-indicator',
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTabFoundation = /** @class */ (function (_super) {
        __extends(MDCTabFoundation, _super);
        function MDCTabFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCTabFoundation.defaultAdapter, adapter)) || this;
            _this.focusOnActivate_ = true;
            return _this;
        }
        Object.defineProperty(MDCTabFoundation, "cssClasses", {
            get: function () {
                return cssClasses$3;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTabFoundation, "strings", {
            get: function () {
                return strings$3;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTabFoundation, "defaultAdapter", {
            get: function () {
                // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
                return {
                    addClass: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    hasClass: function () { return false; },
                    setAttr: function () { return undefined; },
                    activateIndicator: function () { return undefined; },
                    deactivateIndicator: function () { return undefined; },
                    notifyInteracted: function () { return undefined; },
                    getOffsetLeft: function () { return 0; },
                    getOffsetWidth: function () { return 0; },
                    getContentOffsetLeft: function () { return 0; },
                    getContentOffsetWidth: function () { return 0; },
                    focus: function () { return undefined; },
                };
                // tslint:enable:object-literal-sort-keys
            },
            enumerable: true,
            configurable: true
        });
        MDCTabFoundation.prototype.handleClick = function () {
            // It's up to the parent component to keep track of the active Tab and
            // ensure we don't activate a Tab that's already active.
            this.adapter_.notifyInteracted();
        };
        MDCTabFoundation.prototype.isActive = function () {
            return this.adapter_.hasClass(cssClasses$3.ACTIVE);
        };
        /**
         * Sets whether the tab should focus itself when activated
         */
        MDCTabFoundation.prototype.setFocusOnActivate = function (focusOnActivate) {
            this.focusOnActivate_ = focusOnActivate;
        };
        /**
         * Activates the Tab
         */
        MDCTabFoundation.prototype.activate = function (previousIndicatorClientRect) {
            this.adapter_.addClass(cssClasses$3.ACTIVE);
            this.adapter_.setAttr(strings$3.ARIA_SELECTED, 'true');
            this.adapter_.setAttr(strings$3.TABINDEX, '0');
            this.adapter_.activateIndicator(previousIndicatorClientRect);
            if (this.focusOnActivate_) {
                this.adapter_.focus();
            }
        };
        /**
         * Deactivates the Tab
         */
        MDCTabFoundation.prototype.deactivate = function () {
            // Early exit
            if (!this.isActive()) {
                return;
            }
            this.adapter_.removeClass(cssClasses$3.ACTIVE);
            this.adapter_.setAttr(strings$3.ARIA_SELECTED, 'false');
            this.adapter_.setAttr(strings$3.TABINDEX, '-1');
            this.adapter_.deactivateIndicator();
        };
        /**
         * Returns the dimensions of the Tab
         */
        MDCTabFoundation.prototype.computeDimensions = function () {
            var rootWidth = this.adapter_.getOffsetWidth();
            var rootLeft = this.adapter_.getOffsetLeft();
            var contentWidth = this.adapter_.getContentOffsetWidth();
            var contentLeft = this.adapter_.getContentOffsetLeft();
            return {
                contentLeft: rootLeft + contentLeft,
                contentRight: rootLeft + contentLeft + contentWidth,
                rootLeft: rootLeft,
                rootRight: rootLeft + rootWidth,
            };
        };
        return MDCTabFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTab = /** @class */ (function (_super) {
        __extends(MDCTab, _super);
        function MDCTab() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCTab.attachTo = function (root) {
            return new MDCTab(root);
        };
        MDCTab.prototype.initialize = function (rippleFactory, tabIndicatorFactory) {
            if (rippleFactory === void 0) { rippleFactory = function (el, foundation) { return new MDCRipple(el, foundation); }; }
            if (tabIndicatorFactory === void 0) { tabIndicatorFactory = function (el) { return new MDCTabIndicator(el); }; }
            this.id = this.root_.id;
            var rippleSurface = this.root_.querySelector(MDCTabFoundation.strings.RIPPLE_SELECTOR);
            var rippleAdapter = __assign({}, MDCRipple.createAdapter(this), { addClass: function (className) { return rippleSurface.classList.add(className); }, removeClass: function (className) { return rippleSurface.classList.remove(className); }, updateCssVariable: function (varName, value) { return rippleSurface.style.setProperty(varName, value); } });
            var rippleFoundation = new MDCRippleFoundation(rippleAdapter);
            this.ripple_ = rippleFactory(this.root_, rippleFoundation);
            var tabIndicatorElement = this.root_.querySelector(MDCTabFoundation.strings.TAB_INDICATOR_SELECTOR);
            this.tabIndicator_ = tabIndicatorFactory(tabIndicatorElement);
            this.content_ = this.root_.querySelector(MDCTabFoundation.strings.CONTENT_SELECTOR);
        };
        MDCTab.prototype.initialSyncWithDOM = function () {
            var _this = this;
            this.handleClick_ = function () { return _this.foundation_.handleClick(); };
            this.listen('click', this.handleClick_);
        };
        MDCTab.prototype.destroy = function () {
            this.unlisten('click', this.handleClick_);
            this.ripple_.destroy();
            _super.prototype.destroy.call(this);
        };
        MDCTab.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = {
                setAttr: function (attr, value) { return _this.root_.setAttribute(attr, value); },
                addClass: function (className) { return _this.root_.classList.add(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                hasClass: function (className) { return _this.root_.classList.contains(className); },
                activateIndicator: function (previousIndicatorClientRect) { return _this.tabIndicator_.activate(previousIndicatorClientRect); },
                deactivateIndicator: function () { return _this.tabIndicator_.deactivate(); },
                notifyInteracted: function () { return _this.emit(MDCTabFoundation.strings.INTERACTED_EVENT, { tabId: _this.id }, true /* bubble */); },
                getOffsetLeft: function () { return _this.root_.offsetLeft; },
                getOffsetWidth: function () { return _this.root_.offsetWidth; },
                getContentOffsetLeft: function () { return _this.content_.offsetLeft; },
                getContentOffsetWidth: function () { return _this.content_.offsetWidth; },
                focus: function () { return _this.root_.focus(); },
            };
            // tslint:enable:object-literal-sort-keys
            return new MDCTabFoundation(adapter);
        };
        Object.defineProperty(MDCTab.prototype, "active", {
            /**
             * Getter for the active state of the tab
             */
            get: function () {
                return this.foundation_.isActive();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTab.prototype, "focusOnActivate", {
            set: function (focusOnActivate) {
                this.foundation_.setFocusOnActivate(focusOnActivate);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Activates the tab
         */
        MDCTab.prototype.activate = function (computeIndicatorClientRect) {
            this.foundation_.activate(computeIndicatorClientRect);
        };
        /**
         * Deactivates the tab
         */
        MDCTab.prototype.deactivate = function () {
            this.foundation_.deactivate();
        };
        /**
         * Returns the indicator's client rect
         */
        MDCTab.prototype.computeIndicatorClientRect = function () {
            return this.tabIndicator_.computeContentClientRect();
        };
        MDCTab.prototype.computeDimensions = function () {
            return this.foundation_.computeDimensions();
        };
        /**
         * Focuses the tab
         */
        MDCTab.prototype.focus = function () {
            this.root_.focus();
        };
        return MDCTab;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    function prefixFilter(obj, prefix) {
      let names = Object.getOwnPropertyNames(obj);
      const newObj = {};

      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        if (name.substring(0, prefix.length) === prefix) {
          newObj[name.substring(prefix.length)] = obj[name];
        }
      }

      return newObj;
    }

    /* node_modules/@smui/tab-indicator/TabIndicator.svelte generated by Svelte v3.18.2 */
    const file$5 = "node_modules/@smui/tab-indicator/TabIndicator.svelte";

    function create_fragment$6(ctx) {
    	let span1;
    	let span0;
    	let useActions_action;
    	let useActions_action_1;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[17].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[16], null);

    	let span0_levels = [
    		{
    			class: "\n      mdc-tab-indicator__content\n      " + /*content$class*/ ctx[6] + "\n      " + (/*type*/ ctx[3] === "underline"
    			? "mdc-tab-indicator__content--underline"
    			: "") + "\n      " + (/*type*/ ctx[3] === "icon"
    			? "mdc-tab-indicator__content--icon"
    			: "") + "\n    "
    		},
    		{
    			"aria-hidden": /*type*/ ctx[3] === "icon" ? "true" : "false"
    		},
    		exclude(prefixFilter(/*$$props*/ ctx[9], "content$"), ["use", "class"])
    	];

    	let span0_data = {};

    	for (let i = 0; i < span0_levels.length; i += 1) {
    		span0_data = assign(span0_data, span0_levels[i]);
    	}

    	let span1_levels = [
    		{
    			class: "\n    mdc-tab-indicator\n    " + /*className*/ ctx[1] + "\n    " + (/*active*/ ctx[2] ? "mdc-tab-indicator--active" : "") + "\n    " + (/*transition*/ ctx[4] === "fade"
    			? "mdc-tab-indicator--fade"
    			: "") + "\n  "
    		},
    		exclude(/*$$props*/ ctx[9], ["use", "class", "active", "type", "transition", "content$"])
    	];

    	let span1_data = {};

    	for (let i = 0; i < span1_levels.length; i += 1) {
    		span1_data = assign(span1_data, span1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			span0 = element("span");
    			if (default_slot) default_slot.c();
    			set_attributes(span0, span0_data);
    			add_location(span0, file$5, 12, 2, 322);
    			set_attributes(span1, span1_data);
    			add_location(span1, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			append_dev(span1, span0);

    			if (default_slot) {
    				default_slot.m(span0, null);
    			}

    			/*span1_binding*/ ctx[18](span1);
    			current = true;

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, span0, /*content$use*/ ctx[5])),
    				action_destroyer(useActions_action_1 = useActions.call(null, span1, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[8].call(null, span1))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 65536) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[16], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[16], dirty, null));
    			}

    			set_attributes(span0, get_spread_update(span0_levels, [
    				dirty & /*content$class, type*/ 72 && {
    					class: "\n      mdc-tab-indicator__content\n      " + /*content$class*/ ctx[6] + "\n      " + (/*type*/ ctx[3] === "underline"
    					? "mdc-tab-indicator__content--underline"
    					: "") + "\n      " + (/*type*/ ctx[3] === "icon"
    					? "mdc-tab-indicator__content--icon"
    					: "") + "\n    "
    				},
    				dirty & /*type*/ 8 && {
    					"aria-hidden": /*type*/ ctx[3] === "icon" ? "true" : "false"
    				},
    				dirty & /*exclude, prefixFilter, $$props*/ 512 && exclude(prefixFilter(/*$$props*/ ctx[9], "content$"), ["use", "class"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*content$use*/ 32) useActions_action.update.call(null, /*content$use*/ ctx[5]);

    			set_attributes(span1, get_spread_update(span1_levels, [
    				dirty & /*className, active, transition*/ 22 && {
    					class: "\n    mdc-tab-indicator\n    " + /*className*/ ctx[1] + "\n    " + (/*active*/ ctx[2] ? "mdc-tab-indicator--active" : "") + "\n    " + (/*transition*/ ctx[4] === "fade"
    					? "mdc-tab-indicator--fade"
    					: "") + "\n  "
    				},
    				dirty & /*exclude, $$props*/ 512 && exclude(/*$$props*/ ctx[9], ["use", "class", "active", "type", "transition", "content$"])
    			]));

    			if (useActions_action_1 && is_function(useActions_action_1.update) && dirty & /*use*/ 1) useActions_action_1.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span1);
    			if (default_slot) default_slot.d(detaching);
    			/*span1_binding*/ ctx[18](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { active = false } = $$props;
    	let { type = "underline" } = $$props;
    	let { transition = "slide" } = $$props;
    	let { content$use = [] } = $$props;
    	let { content$class = "" } = $$props;
    	let element;
    	let tabIndicator;
    	let instantiate = getContext("SMUI:tab-indicator:instantiate");
    	let getInstance = getContext("SMUI:tab-indicator:getInstance");

    	onMount(async () => {
    		if (instantiate !== false) {
    			tabIndicator = new MDCTabIndicator(element);
    		} else {
    			tabIndicator = await getInstance();
    		}
    	});

    	onDestroy(() => {
    		tabIndicator && tabIndicator.destroy();
    	});

    	function activate(...args) {
    		return tabIndicator.activate(...args);
    	}

    	function deactivate(...args) {
    		return tabIndicator.deactivate(...args);
    	}

    	function computeContentClientRect(...args) {
    		return tabIndicator.computeContentClientRect(...args);
    	}

    	let { $$slots = {}, $$scope } = $$props;

    	function span1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(7, element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(9, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("active" in $$new_props) $$invalidate(2, active = $$new_props.active);
    		if ("type" in $$new_props) $$invalidate(3, type = $$new_props.type);
    		if ("transition" in $$new_props) $$invalidate(4, transition = $$new_props.transition);
    		if ("content$use" in $$new_props) $$invalidate(5, content$use = $$new_props.content$use);
    		if ("content$class" in $$new_props) $$invalidate(6, content$class = $$new_props.content$class);
    		if ("$$scope" in $$new_props) $$invalidate(16, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			use,
    			className,
    			active,
    			type,
    			transition,
    			content$use,
    			content$class,
    			element,
    			tabIndicator,
    			instantiate,
    			getInstance
    		};
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(9, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("active" in $$props) $$invalidate(2, active = $$new_props.active);
    		if ("type" in $$props) $$invalidate(3, type = $$new_props.type);
    		if ("transition" in $$props) $$invalidate(4, transition = $$new_props.transition);
    		if ("content$use" in $$props) $$invalidate(5, content$use = $$new_props.content$use);
    		if ("content$class" in $$props) $$invalidate(6, content$class = $$new_props.content$class);
    		if ("element" in $$props) $$invalidate(7, element = $$new_props.element);
    		if ("tabIndicator" in $$props) tabIndicator = $$new_props.tabIndicator;
    		if ("instantiate" in $$props) instantiate = $$new_props.instantiate;
    		if ("getInstance" in $$props) getInstance = $$new_props.getInstance;
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		active,
    		type,
    		transition,
    		content$use,
    		content$class,
    		element,
    		forwardEvents,
    		$$props,
    		activate,
    		deactivate,
    		computeContentClientRect,
    		tabIndicator,
    		instantiate,
    		getInstance,
    		$$scope,
    		$$slots,
    		span1_binding
    	];
    }

    class TabIndicator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			use: 0,
    			class: 1,
    			active: 2,
    			type: 3,
    			transition: 4,
    			content$use: 5,
    			content$class: 6,
    			activate: 10,
    			deactivate: 11,
    			computeContentClientRect: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TabIndicator",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get use() {
    		throw new Error("<TabIndicator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<TabIndicator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<TabIndicator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<TabIndicator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<TabIndicator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<TabIndicator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<TabIndicator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<TabIndicator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transition() {
    		throw new Error("<TabIndicator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transition(value) {
    		throw new Error("<TabIndicator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get content$use() {
    		throw new Error("<TabIndicator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content$use(value) {
    		throw new Error("<TabIndicator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get content$class() {
    		throw new Error("<TabIndicator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content$class(value) {
    		throw new Error("<TabIndicator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activate() {
    		return this.$$.ctx[10];
    	}

    	set activate(value) {
    		throw new Error("<TabIndicator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get deactivate() {
    		return this.$$.ctx[11];
    	}

    	set deactivate(value) {
    		throw new Error("<TabIndicator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get computeContentClientRect() {
    		return this.$$.ctx[12];
    	}

    	set computeContentClientRect(value) {
    		throw new Error("<TabIndicator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@smui/tab/Tab.svelte generated by Svelte v3.18.2 */

    const { Error: Error_1 } = globals;
    const file$6 = "node_modules/@smui/tab/Tab.svelte";
    const get_tab_indicator_slot_changes_1 = dirty => ({});
    const get_tab_indicator_slot_context_1 = ctx => ({});
    const get_tab_indicator_slot_changes = dirty => ({});
    const get_tab_indicator_slot_context = ctx => ({});

    // (24:4) {#if indicatorSpanOnlyContent}
    function create_if_block_2(ctx) {
    	let current;

    	const tabindicator_spread_levels = [
    		{ active: /*active*/ ctx[0] },
    		prefixFilter(/*$$props*/ ctx[12], "tabIndicator$")
    	];

    	let tabindicator_props = {
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < tabindicator_spread_levels.length; i += 1) {
    		tabindicator_props = assign(tabindicator_props, tabindicator_spread_levels[i]);
    	}

    	const tabindicator = new TabIndicator({
    			props: tabindicator_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tabindicator.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tabindicator, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tabindicator_changes = (dirty & /*active, prefixFilter, $$props*/ 4097)
    			? get_spread_update(tabindicator_spread_levels, [
    					dirty & /*active*/ 1 && { active: /*active*/ ctx[0] },
    					dirty & /*prefixFilter, $$props*/ 4096 && get_spread_object(prefixFilter(/*$$props*/ ctx[12], "tabIndicator$"))
    				])
    			: {};

    			if (dirty & /*$$scope*/ 536870912) {
    				tabindicator_changes.$$scope = { dirty, ctx };
    			}

    			tabindicator.$set(tabindicator_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabindicator.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabindicator.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tabindicator, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(24:4) {#if indicatorSpanOnlyContent}",
    		ctx
    	});

    	return block;
    }

    // (25:6) <TabIndicator         {active}         {...prefixFilter($$props, 'tabIndicator$')}       >
    function create_default_slot_1(ctx) {
    	let current;
    	const tab_indicator_slot_template = /*$$slots*/ ctx[27]["tab-indicator"];
    	const tab_indicator_slot = create_slot(tab_indicator_slot_template, ctx, /*$$scope*/ ctx[29], get_tab_indicator_slot_context);

    	const block = {
    		c: function create() {
    			if (tab_indicator_slot) tab_indicator_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (tab_indicator_slot) {
    				tab_indicator_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (tab_indicator_slot && tab_indicator_slot.p && dirty & /*$$scope*/ 536870912) {
    				tab_indicator_slot.p(get_slot_context(tab_indicator_slot_template, ctx, /*$$scope*/ ctx[29], get_tab_indicator_slot_context), get_slot_changes(tab_indicator_slot_template, /*$$scope*/ ctx[29], dirty, get_tab_indicator_slot_changes));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab_indicator_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tab_indicator_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (tab_indicator_slot) tab_indicator_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(25:6) <TabIndicator         {active}         {...prefixFilter($$props, 'tabIndicator$')}       >",
    		ctx
    	});

    	return block;
    }

    // (31:2) {#if !indicatorSpanOnlyContent}
    function create_if_block_1(ctx) {
    	let current;

    	const tabindicator_spread_levels = [
    		{ active: /*active*/ ctx[0] },
    		prefixFilter(/*$$props*/ ctx[12], "tabIndicator$")
    	];

    	let tabindicator_props = {
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < tabindicator_spread_levels.length; i += 1) {
    		tabindicator_props = assign(tabindicator_props, tabindicator_spread_levels[i]);
    	}

    	const tabindicator = new TabIndicator({
    			props: tabindicator_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tabindicator.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tabindicator, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tabindicator_changes = (dirty & /*active, prefixFilter, $$props*/ 4097)
    			? get_spread_update(tabindicator_spread_levels, [
    					dirty & /*active*/ 1 && { active: /*active*/ ctx[0] },
    					dirty & /*prefixFilter, $$props*/ 4096 && get_spread_object(prefixFilter(/*$$props*/ ctx[12], "tabIndicator$"))
    				])
    			: {};

    			if (dirty & /*$$scope*/ 536870912) {
    				tabindicator_changes.$$scope = { dirty, ctx };
    			}

    			tabindicator.$set(tabindicator_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabindicator.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabindicator.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tabindicator, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(31:2) {#if !indicatorSpanOnlyContent}",
    		ctx
    	});

    	return block;
    }

    // (32:4) <TabIndicator       {active}       {...prefixFilter($$props, 'tabIndicator$')}     >
    function create_default_slot$1(ctx) {
    	let current;
    	const tab_indicator_slot_template = /*$$slots*/ ctx[27]["tab-indicator"];
    	const tab_indicator_slot = create_slot(tab_indicator_slot_template, ctx, /*$$scope*/ ctx[29], get_tab_indicator_slot_context_1);

    	const block = {
    		c: function create() {
    			if (tab_indicator_slot) tab_indicator_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (tab_indicator_slot) {
    				tab_indicator_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (tab_indicator_slot && tab_indicator_slot.p && dirty & /*$$scope*/ 536870912) {
    				tab_indicator_slot.p(get_slot_context(tab_indicator_slot_template, ctx, /*$$scope*/ ctx[29], get_tab_indicator_slot_context_1), get_slot_changes(tab_indicator_slot_template, /*$$scope*/ ctx[29], dirty, get_tab_indicator_slot_changes_1));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab_indicator_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tab_indicator_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (tab_indicator_slot) tab_indicator_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(32:4) <TabIndicator       {active}       {...prefixFilter($$props, 'tabIndicator$')}     >",
    		ctx
    	});

    	return block;
    }

    // (37:2) {#if ripple}
    function create_if_block(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "mdc-tab__ripple");
    			add_location(span, file$6, 37, 4, 1093);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(37:2) {#if ripple}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let button;
    	let span;
    	let t0;
    	let useActions_action;
    	let t1;
    	let t2;
    	let useActions_action_1;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[27].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[29], null);
    	let if_block0 = /*indicatorSpanOnlyContent*/ ctx[6] && create_if_block_2(ctx);

    	let span_levels = [
    		{
    			class: "mdc-tab__content " + /*content$class*/ ctx[8]
    		},
    		exclude(prefixFilter(/*$$props*/ ctx[12], "content$"), ["use", "class"])
    	];

    	let span_data = {};

    	for (let i = 0; i < span_levels.length; i += 1) {
    		span_data = assign(span_data, span_levels[i]);
    	}

    	let if_block1 = !/*indicatorSpanOnlyContent*/ ctx[6] && create_if_block_1(ctx);
    	let if_block2 = /*ripple*/ ctx[3] && create_if_block(ctx);

    	let button_levels = [
    		{
    			class: "\n    mdc-tab\n    " + /*className*/ ctx[2] + "\n    " + (/*active*/ ctx[0] ? "mdc-tab--active" : "") + "\n    " + (/*stacked*/ ctx[4] ? "mdc-tab--stacked" : "") + "\n    " + (/*minWidth*/ ctx[5] ? "mdc-tab--min-width" : "") + "\n  "
    		},
    		{ role: "tab" },
    		{ "aria-selected": /*active*/ ctx[0] },
    		{ tabindex: /*active*/ ctx[0] ? "0" : "-1" },
    		exclude(/*$$props*/ ctx[12], [
    			"use",
    			"class",
    			"ripple",
    			"active",
    			"stacked",
    			"minWidth",
    			"indicatorSpanOnlyContent",
    			"focusOnActivate",
    			"content$",
    			"tabIndicator$"
    		])
    	];

    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			if (default_slot) default_slot.c();
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			if (if_block2) if_block2.c();
    			set_attributes(span, span_data);
    			add_location(span, file$6, 17, 2, 517);
    			set_attributes(button, button_data);
    			add_location(button, file$6, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			append_dev(span, t0);
    			if (if_block0) if_block0.m(span, null);
    			append_dev(button, t1);
    			if (if_block1) if_block1.m(button, null);
    			append_dev(button, t2);
    			if (if_block2) if_block2.m(button, null);
    			/*button_binding*/ ctx[28](button);
    			current = true;

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, span, /*content$use*/ ctx[7])),
    				action_destroyer(useActions_action_1 = useActions.call(null, button, /*use*/ ctx[1])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[10].call(null, button)),
    				listen_dev(button, "MDCTab:interacted", /*interactedHandler*/ ctx[11], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 536870912) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[29], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[29], dirty, null));
    			}

    			if (/*indicatorSpanOnlyContent*/ ctx[6]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(span, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			set_attributes(span, get_spread_update(span_levels, [
    				dirty & /*content$class*/ 256 && {
    					class: "mdc-tab__content " + /*content$class*/ ctx[8]
    				},
    				dirty & /*exclude, prefixFilter, $$props*/ 4096 && exclude(prefixFilter(/*$$props*/ ctx[12], "content$"), ["use", "class"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*content$use*/ 128) useActions_action.update.call(null, /*content$use*/ ctx[7]);

    			if (!/*indicatorSpanOnlyContent*/ ctx[6]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(button, t2);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*ripple*/ ctx[3]) {
    				if (!if_block2) {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(button, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			set_attributes(button, get_spread_update(button_levels, [
    				dirty & /*className, active, stacked, minWidth*/ 53 && {
    					class: "\n    mdc-tab\n    " + /*className*/ ctx[2] + "\n    " + (/*active*/ ctx[0] ? "mdc-tab--active" : "") + "\n    " + (/*stacked*/ ctx[4] ? "mdc-tab--stacked" : "") + "\n    " + (/*minWidth*/ ctx[5] ? "mdc-tab--min-width" : "") + "\n  "
    				},
    				{ role: "tab" },
    				dirty & /*active*/ 1 && { "aria-selected": /*active*/ ctx[0] },
    				dirty & /*active*/ 1 && { tabindex: /*active*/ ctx[0] ? "0" : "-1" },
    				dirty & /*exclude, $$props*/ 4096 && exclude(/*$$props*/ ctx[12], [
    					"use",
    					"class",
    					"ripple",
    					"active",
    					"stacked",
    					"minWidth",
    					"indicatorSpanOnlyContent",
    					"focusOnActivate",
    					"content$",
    					"tabIndicator$"
    				])
    			]));

    			if (useActions_action_1 && is_function(useActions_action_1.update) && dirty & /*use*/ 2) useActions_action_1.update.call(null, /*use*/ ctx[1]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			/*button_binding*/ ctx[28](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component, ["MDCTab:interacted"]);
    	let activeEntry = getContext("SMUI:tab:active");
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { tab: tabEntry } = $$props;
    	let { ripple = true } = $$props;
    	let { active = tabEntry === activeEntry } = $$props;
    	let { stacked = false } = $$props;
    	let { minWidth = false } = $$props;
    	let { indicatorSpanOnlyContent = false } = $$props;
    	let { focusOnActivate = true } = $$props;
    	let { content$use = [] } = $$props;
    	let { content$class = "" } = $$props;
    	let element;
    	let tab;
    	let instantiate = getContext("SMUI:tab:instantiate");
    	let getInstance = getContext("SMUI:tab:getInstance");
    	let tabIndicatorPromiseResolve;
    	let tabIndicatorPromise = new Promise(resolve => tabIndicatorPromiseResolve = resolve);
    	setContext("SMUI:tab-indicator:instantiate", false);
    	setContext("SMUI:tab-indicator:getInstance", getTabIndicatorInstancePromise);
    	setContext("SMUI:label:context", "tab");
    	setContext("SMUI:icon:context", "tab");

    	if (!tabEntry) {
    		throw new Error("The tab property is required! It should be passed down from the TabBar to the Tab.");
    	}

    	onMount(async () => {
    		if (instantiate !== false) {
    			$$invalidate(20, tab = new MDCTab(element));
    		} else {
    			$$invalidate(20, tab = await getInstance(tabEntry));
    		}

    		tabIndicatorPromiseResolve(tab.tabIndicator_);

    		if (!ripple) {
    			tab.ripple_ && tab.ripple_.destroy();
    		}
    	});

    	onDestroy(() => {
    		tab && tab.destroy();
    	});

    	function getTabIndicatorInstancePromise() {
    		return tabIndicatorPromise;
    	}

    	function interactedHandler() {
    		$$invalidate(0, active = tab.active);
    	}

    	function activate(...args) {
    		$$invalidate(0, active = true);
    		return tab.activate(...args);
    	}

    	function deactivate(...args) {
    		$$invalidate(0, active = false);
    		return tab.deactivate(...args);
    	}

    	function focus(...args) {
    		return tab.focus(...args);
    	}

    	function computeIndicatorClientRect(...args) {
    		return tab.computeIndicatorClientRect(...args);
    	}

    	function computeDimensions(...args) {
    		return tab.computeDimensions(...args);
    	}

    	let { $$slots = {}, $$scope } = $$props;

    	function button_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(9, element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(12, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(1, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(2, className = $$new_props.class);
    		if ("tab" in $$new_props) $$invalidate(13, tabEntry = $$new_props.tab);
    		if ("ripple" in $$new_props) $$invalidate(3, ripple = $$new_props.ripple);
    		if ("active" in $$new_props) $$invalidate(0, active = $$new_props.active);
    		if ("stacked" in $$new_props) $$invalidate(4, stacked = $$new_props.stacked);
    		if ("minWidth" in $$new_props) $$invalidate(5, minWidth = $$new_props.minWidth);
    		if ("indicatorSpanOnlyContent" in $$new_props) $$invalidate(6, indicatorSpanOnlyContent = $$new_props.indicatorSpanOnlyContent);
    		if ("focusOnActivate" in $$new_props) $$invalidate(14, focusOnActivate = $$new_props.focusOnActivate);
    		if ("content$use" in $$new_props) $$invalidate(7, content$use = $$new_props.content$use);
    		if ("content$class" in $$new_props) $$invalidate(8, content$class = $$new_props.content$class);
    		if ("$$scope" in $$new_props) $$invalidate(29, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			activeEntry,
    			use,
    			className,
    			tabEntry,
    			ripple,
    			active,
    			stacked,
    			minWidth,
    			indicatorSpanOnlyContent,
    			focusOnActivate,
    			content$use,
    			content$class,
    			element,
    			tab,
    			instantiate,
    			getInstance,
    			tabIndicatorPromiseResolve,
    			tabIndicatorPromise
    		};
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(12, $$props = assign(assign({}, $$props), $$new_props));
    		if ("activeEntry" in $$props) activeEntry = $$new_props.activeEntry;
    		if ("use" in $$props) $$invalidate(1, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(2, className = $$new_props.className);
    		if ("tabEntry" in $$props) $$invalidate(13, tabEntry = $$new_props.tabEntry);
    		if ("ripple" in $$props) $$invalidate(3, ripple = $$new_props.ripple);
    		if ("active" in $$props) $$invalidate(0, active = $$new_props.active);
    		if ("stacked" in $$props) $$invalidate(4, stacked = $$new_props.stacked);
    		if ("minWidth" in $$props) $$invalidate(5, minWidth = $$new_props.minWidth);
    		if ("indicatorSpanOnlyContent" in $$props) $$invalidate(6, indicatorSpanOnlyContent = $$new_props.indicatorSpanOnlyContent);
    		if ("focusOnActivate" in $$props) $$invalidate(14, focusOnActivate = $$new_props.focusOnActivate);
    		if ("content$use" in $$props) $$invalidate(7, content$use = $$new_props.content$use);
    		if ("content$class" in $$props) $$invalidate(8, content$class = $$new_props.content$class);
    		if ("element" in $$props) $$invalidate(9, element = $$new_props.element);
    		if ("tab" in $$props) $$invalidate(20, tab = $$new_props.tab);
    		if ("instantiate" in $$props) instantiate = $$new_props.instantiate;
    		if ("getInstance" in $$props) getInstance = $$new_props.getInstance;
    		if ("tabIndicatorPromiseResolve" in $$props) tabIndicatorPromiseResolve = $$new_props.tabIndicatorPromiseResolve;
    		if ("tabIndicatorPromise" in $$props) tabIndicatorPromise = $$new_props.tabIndicatorPromise;
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*tab, focusOnActivate*/ 1064960) {
    			 if (tab) {
    				$$invalidate(20, tab.focusOnActivate = focusOnActivate, tab);
    			}
    		}

    		if ($$self.$$.dirty & /*tab, active*/ 1048577) {
    			 if (tab && tab.active !== active) {
    				$$invalidate(0, active = tab.active);
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		active,
    		use,
    		className,
    		ripple,
    		stacked,
    		minWidth,
    		indicatorSpanOnlyContent,
    		content$use,
    		content$class,
    		element,
    		forwardEvents,
    		interactedHandler,
    		$$props,
    		tabEntry,
    		focusOnActivate,
    		activate,
    		deactivate,
    		focus,
    		computeIndicatorClientRect,
    		computeDimensions,
    		tab,
    		tabIndicatorPromiseResolve,
    		activeEntry,
    		instantiate,
    		getInstance,
    		tabIndicatorPromise,
    		getTabIndicatorInstancePromise,
    		$$slots,
    		button_binding,
    		$$scope
    	];
    }

    class Tab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			use: 1,
    			class: 2,
    			tab: 13,
    			ripple: 3,
    			active: 0,
    			stacked: 4,
    			minWidth: 5,
    			indicatorSpanOnlyContent: 6,
    			focusOnActivate: 14,
    			content$use: 7,
    			content$class: 8,
    			activate: 15,
    			deactivate: 16,
    			focus: 17,
    			computeIndicatorClientRect: 18,
    			computeDimensions: 19
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tab",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tabEntry*/ ctx[13] === undefined && !("tab" in props)) {
    			console.warn("<Tab> was created without expected prop 'tab'");
    		}
    	}

    	get use() {
    		throw new Error_1("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error_1("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tab() {
    		throw new Error_1("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tab(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ripple() {
    		throw new Error_1("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ripple(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error_1("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get stacked() {
    		throw new Error_1("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stacked(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minWidth() {
    		throw new Error_1("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minWidth(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get indicatorSpanOnlyContent() {
    		throw new Error_1("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set indicatorSpanOnlyContent(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focusOnActivate() {
    		throw new Error_1("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focusOnActivate(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get content$use() {
    		throw new Error_1("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content$use(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get content$class() {
    		throw new Error_1("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content$class(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activate() {
    		return this.$$.ctx[15];
    	}

    	set activate(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get deactivate() {
    		return this.$$.ctx[16];
    	}

    	set deactivate(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focus() {
    		return this.$$.ctx[17];
    	}

    	set focus(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get computeIndicatorClientRect() {
    		return this.$$.ctx[18];
    	}

    	set computeIndicatorClientRect(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get computeDimensions() {
    		return this.$$.ctx[19];
    	}

    	set computeDimensions(value) {
    		throw new Error_1("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var cssClasses$4 = {
        ANIMATING: 'mdc-tab-scroller--animating',
        SCROLL_AREA_SCROLL: 'mdc-tab-scroller__scroll-area--scroll',
        SCROLL_TEST: 'mdc-tab-scroller__test',
    };
    var strings$4 = {
        AREA_SELECTOR: '.mdc-tab-scroller__scroll-area',
        CONTENT_SELECTOR: '.mdc-tab-scroller__scroll-content',
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTabScrollerRTL = /** @class */ (function () {
        function MDCTabScrollerRTL(adapter) {
            this.adapter_ = adapter;
        }
        return MDCTabScrollerRTL;
    }());
    //# sourceMappingURL=rtl-scroller.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTabScrollerRTLDefault = /** @class */ (function (_super) {
        __extends(MDCTabScrollerRTLDefault, _super);
        function MDCTabScrollerRTLDefault() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCTabScrollerRTLDefault.prototype.getScrollPositionRTL = function () {
            var currentScrollLeft = this.adapter_.getScrollAreaScrollLeft();
            var right = this.calculateScrollEdges_().right;
            // Scroll values on most browsers are ints instead of floats so we round
            return Math.round(right - currentScrollLeft);
        };
        MDCTabScrollerRTLDefault.prototype.scrollToRTL = function (scrollX) {
            var edges = this.calculateScrollEdges_();
            var currentScrollLeft = this.adapter_.getScrollAreaScrollLeft();
            var clampedScrollLeft = this.clampScrollValue_(edges.right - scrollX);
            return {
                finalScrollPosition: clampedScrollLeft,
                scrollDelta: clampedScrollLeft - currentScrollLeft,
            };
        };
        MDCTabScrollerRTLDefault.prototype.incrementScrollRTL = function (scrollX) {
            var currentScrollLeft = this.adapter_.getScrollAreaScrollLeft();
            var clampedScrollLeft = this.clampScrollValue_(currentScrollLeft - scrollX);
            return {
                finalScrollPosition: clampedScrollLeft,
                scrollDelta: clampedScrollLeft - currentScrollLeft,
            };
        };
        MDCTabScrollerRTLDefault.prototype.getAnimatingScrollPosition = function (scrollX) {
            return scrollX;
        };
        MDCTabScrollerRTLDefault.prototype.calculateScrollEdges_ = function () {
            var contentWidth = this.adapter_.getScrollContentOffsetWidth();
            var rootWidth = this.adapter_.getScrollAreaOffsetWidth();
            return {
                left: 0,
                right: contentWidth - rootWidth,
            };
        };
        MDCTabScrollerRTLDefault.prototype.clampScrollValue_ = function (scrollX) {
            var edges = this.calculateScrollEdges_();
            return Math.min(Math.max(edges.left, scrollX), edges.right);
        };
        return MDCTabScrollerRTLDefault;
    }(MDCTabScrollerRTL));
    //# sourceMappingURL=rtl-default-scroller.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTabScrollerRTLNegative = /** @class */ (function (_super) {
        __extends(MDCTabScrollerRTLNegative, _super);
        function MDCTabScrollerRTLNegative() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCTabScrollerRTLNegative.prototype.getScrollPositionRTL = function (translateX) {
            var currentScrollLeft = this.adapter_.getScrollAreaScrollLeft();
            return Math.round(translateX - currentScrollLeft);
        };
        MDCTabScrollerRTLNegative.prototype.scrollToRTL = function (scrollX) {
            var currentScrollLeft = this.adapter_.getScrollAreaScrollLeft();
            var clampedScrollLeft = this.clampScrollValue_(-scrollX);
            return {
                finalScrollPosition: clampedScrollLeft,
                scrollDelta: clampedScrollLeft - currentScrollLeft,
            };
        };
        MDCTabScrollerRTLNegative.prototype.incrementScrollRTL = function (scrollX) {
            var currentScrollLeft = this.adapter_.getScrollAreaScrollLeft();
            var clampedScrollLeft = this.clampScrollValue_(currentScrollLeft - scrollX);
            return {
                finalScrollPosition: clampedScrollLeft,
                scrollDelta: clampedScrollLeft - currentScrollLeft,
            };
        };
        MDCTabScrollerRTLNegative.prototype.getAnimatingScrollPosition = function (scrollX, translateX) {
            return scrollX - translateX;
        };
        MDCTabScrollerRTLNegative.prototype.calculateScrollEdges_ = function () {
            var contentWidth = this.adapter_.getScrollContentOffsetWidth();
            var rootWidth = this.adapter_.getScrollAreaOffsetWidth();
            return {
                left: rootWidth - contentWidth,
                right: 0,
            };
        };
        MDCTabScrollerRTLNegative.prototype.clampScrollValue_ = function (scrollX) {
            var edges = this.calculateScrollEdges_();
            return Math.max(Math.min(edges.right, scrollX), edges.left);
        };
        return MDCTabScrollerRTLNegative;
    }(MDCTabScrollerRTL));
    //# sourceMappingURL=rtl-negative-scroller.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTabScrollerRTLReverse = /** @class */ (function (_super) {
        __extends(MDCTabScrollerRTLReverse, _super);
        function MDCTabScrollerRTLReverse() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCTabScrollerRTLReverse.prototype.getScrollPositionRTL = function (translateX) {
            var currentScrollLeft = this.adapter_.getScrollAreaScrollLeft();
            // Scroll values on most browsers are ints instead of floats so we round
            return Math.round(currentScrollLeft - translateX);
        };
        MDCTabScrollerRTLReverse.prototype.scrollToRTL = function (scrollX) {
            var currentScrollLeft = this.adapter_.getScrollAreaScrollLeft();
            var clampedScrollLeft = this.clampScrollValue_(scrollX);
            return {
                finalScrollPosition: clampedScrollLeft,
                scrollDelta: currentScrollLeft - clampedScrollLeft,
            };
        };
        MDCTabScrollerRTLReverse.prototype.incrementScrollRTL = function (scrollX) {
            var currentScrollLeft = this.adapter_.getScrollAreaScrollLeft();
            var clampedScrollLeft = this.clampScrollValue_(currentScrollLeft + scrollX);
            return {
                finalScrollPosition: clampedScrollLeft,
                scrollDelta: currentScrollLeft - clampedScrollLeft,
            };
        };
        MDCTabScrollerRTLReverse.prototype.getAnimatingScrollPosition = function (scrollX, translateX) {
            return scrollX + translateX;
        };
        MDCTabScrollerRTLReverse.prototype.calculateScrollEdges_ = function () {
            var contentWidth = this.adapter_.getScrollContentOffsetWidth();
            var rootWidth = this.adapter_.getScrollAreaOffsetWidth();
            return {
                left: contentWidth - rootWidth,
                right: 0,
            };
        };
        MDCTabScrollerRTLReverse.prototype.clampScrollValue_ = function (scrollX) {
            var edges = this.calculateScrollEdges_();
            return Math.min(Math.max(edges.right, scrollX), edges.left);
        };
        return MDCTabScrollerRTLReverse;
    }(MDCTabScrollerRTL));
    //# sourceMappingURL=rtl-reverse-scroller.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTabScrollerFoundation = /** @class */ (function (_super) {
        __extends(MDCTabScrollerFoundation, _super);
        function MDCTabScrollerFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCTabScrollerFoundation.defaultAdapter, adapter)) || this;
            /**
             * Controls whether we should handle the transitionend and interaction events during the animation.
             */
            _this.isAnimating_ = false;
            return _this;
        }
        Object.defineProperty(MDCTabScrollerFoundation, "cssClasses", {
            get: function () {
                return cssClasses$4;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTabScrollerFoundation, "strings", {
            get: function () {
                return strings$4;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTabScrollerFoundation, "defaultAdapter", {
            get: function () {
                // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
                return {
                    eventTargetMatchesSelector: function () { return false; },
                    addClass: function () { return undefined; },
                    removeClass: function () { return undefined; },
                    addScrollAreaClass: function () { return undefined; },
                    setScrollAreaStyleProperty: function () { return undefined; },
                    setScrollContentStyleProperty: function () { return undefined; },
                    getScrollContentStyleValue: function () { return ''; },
                    setScrollAreaScrollLeft: function () { return undefined; },
                    getScrollAreaScrollLeft: function () { return 0; },
                    getScrollContentOffsetWidth: function () { return 0; },
                    getScrollAreaOffsetWidth: function () { return 0; },
                    computeScrollAreaClientRect: function () { return ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }); },
                    computeScrollContentClientRect: function () { return ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }); },
                    computeHorizontalScrollbarHeight: function () { return 0; },
                };
                // tslint:enable:object-literal-sort-keys
            },
            enumerable: true,
            configurable: true
        });
        MDCTabScrollerFoundation.prototype.init = function () {
            // Compute horizontal scrollbar height on scroller with overflow initially hidden, then update overflow to scroll
            // and immediately adjust bottom margin to avoid the scrollbar initially appearing before JS runs.
            var horizontalScrollbarHeight = this.adapter_.computeHorizontalScrollbarHeight();
            this.adapter_.setScrollAreaStyleProperty('margin-bottom', -horizontalScrollbarHeight + 'px');
            this.adapter_.addScrollAreaClass(MDCTabScrollerFoundation.cssClasses.SCROLL_AREA_SCROLL);
        };
        /**
         * Computes the current visual scroll position
         */
        MDCTabScrollerFoundation.prototype.getScrollPosition = function () {
            if (this.isRTL_()) {
                return this.computeCurrentScrollPositionRTL_();
            }
            var currentTranslateX = this.calculateCurrentTranslateX_();
            var scrollLeft = this.adapter_.getScrollAreaScrollLeft();
            return scrollLeft - currentTranslateX;
        };
        /**
         * Handles interaction events that occur during transition
         */
        MDCTabScrollerFoundation.prototype.handleInteraction = function () {
            // Early exit if we aren't animating
            if (!this.isAnimating_) {
                return;
            }
            // Prevent other event listeners from handling this event
            this.stopScrollAnimation_();
        };
        /**
         * Handles the transitionend event
         */
        MDCTabScrollerFoundation.prototype.handleTransitionEnd = function (evt) {
            // Early exit if we aren't animating or the event was triggered by a different element.
            var evtTarget = evt.target;
            if (!this.isAnimating_ ||
                !this.adapter_.eventTargetMatchesSelector(evtTarget, MDCTabScrollerFoundation.strings.CONTENT_SELECTOR)) {
                return;
            }
            this.isAnimating_ = false;
            this.adapter_.removeClass(MDCTabScrollerFoundation.cssClasses.ANIMATING);
        };
        /**
         * Increment the scroll value by the scrollXIncrement
         * @param scrollXIncrement The value by which to increment the scroll position
         */
        MDCTabScrollerFoundation.prototype.incrementScroll = function (scrollXIncrement) {
            // Early exit for non-operational increment values
            if (scrollXIncrement === 0) {
                return;
            }
            if (this.isRTL_()) {
                return this.incrementScrollRTL_(scrollXIncrement);
            }
            this.incrementScroll_(scrollXIncrement);
        };
        /**
         * Scrolls to the given scrollX value
         */
        MDCTabScrollerFoundation.prototype.scrollTo = function (scrollX) {
            if (this.isRTL_()) {
                return this.scrollToRTL_(scrollX);
            }
            this.scrollTo_(scrollX);
        };
        /**
         * @return Browser-specific {@link MDCTabScrollerRTL} instance.
         */
        MDCTabScrollerFoundation.prototype.getRTLScroller = function () {
            if (!this.rtlScrollerInstance_) {
                this.rtlScrollerInstance_ = this.rtlScrollerFactory_();
            }
            return this.rtlScrollerInstance_;
        };
        /**
         * @return translateX value from a CSS matrix transform function string.
         */
        MDCTabScrollerFoundation.prototype.calculateCurrentTranslateX_ = function () {
            var transformValue = this.adapter_.getScrollContentStyleValue('transform');
            // Early exit if no transform is present
            if (transformValue === 'none') {
                return 0;
            }
            // The transform value comes back as a matrix transformation in the form
            // of `matrix(a, b, c, d, tx, ty)`. We only care about tx (translateX) so
            // we're going to grab all the parenthesized values, strip out tx, and
            // parse it.
            var match = /\((.+?)\)/.exec(transformValue);
            if (!match) {
                return 0;
            }
            var matrixParams = match[1];
            // tslint:disable-next-line:ban-ts-ignore "Unused vars" should be a linter warning, not a compiler error.
            // @ts-ignore These unused variables should retain their semantic names for clarity.
            var _a = __read(matrixParams.split(','), 6), a = _a[0], b = _a[1], c = _a[2], d = _a[3], tx = _a[4], ty = _a[5];
            return parseFloat(tx); // tslint:disable-line:ban
        };
        /**
         * Calculates a safe scroll value that is > 0 and < the max scroll value
         * @param scrollX The distance to scroll
         */
        MDCTabScrollerFoundation.prototype.clampScrollValue_ = function (scrollX) {
            var edges = this.calculateScrollEdges_();
            return Math.min(Math.max(edges.left, scrollX), edges.right);
        };
        MDCTabScrollerFoundation.prototype.computeCurrentScrollPositionRTL_ = function () {
            var translateX = this.calculateCurrentTranslateX_();
            return this.getRTLScroller().getScrollPositionRTL(translateX);
        };
        MDCTabScrollerFoundation.prototype.calculateScrollEdges_ = function () {
            var contentWidth = this.adapter_.getScrollContentOffsetWidth();
            var rootWidth = this.adapter_.getScrollAreaOffsetWidth();
            return {
                left: 0,
                right: contentWidth - rootWidth,
            };
        };
        /**
         * Internal scroll method
         * @param scrollX The new scroll position
         */
        MDCTabScrollerFoundation.prototype.scrollTo_ = function (scrollX) {
            var currentScrollX = this.getScrollPosition();
            var safeScrollX = this.clampScrollValue_(scrollX);
            var scrollDelta = safeScrollX - currentScrollX;
            this.animate_({
                finalScrollPosition: safeScrollX,
                scrollDelta: scrollDelta,
            });
        };
        /**
         * Internal RTL scroll method
         * @param scrollX The new scroll position
         */
        MDCTabScrollerFoundation.prototype.scrollToRTL_ = function (scrollX) {
            var animation = this.getRTLScroller().scrollToRTL(scrollX);
            this.animate_(animation);
        };
        /**
         * Internal increment scroll method
         * @param scrollX The new scroll position increment
         */
        MDCTabScrollerFoundation.prototype.incrementScroll_ = function (scrollX) {
            var currentScrollX = this.getScrollPosition();
            var targetScrollX = scrollX + currentScrollX;
            var safeScrollX = this.clampScrollValue_(targetScrollX);
            var scrollDelta = safeScrollX - currentScrollX;
            this.animate_({
                finalScrollPosition: safeScrollX,
                scrollDelta: scrollDelta,
            });
        };
        /**
         * Internal increment scroll RTL method
         * @param scrollX The new scroll position RTL increment
         */
        MDCTabScrollerFoundation.prototype.incrementScrollRTL_ = function (scrollX) {
            var animation = this.getRTLScroller().incrementScrollRTL(scrollX);
            this.animate_(animation);
        };
        /**
         * Animates the tab scrolling
         * @param animation The animation to apply
         */
        MDCTabScrollerFoundation.prototype.animate_ = function (animation) {
            var _this = this;
            // Early exit if translateX is 0, which means there's no animation to perform
            if (animation.scrollDelta === 0) {
                return;
            }
            this.stopScrollAnimation_();
            // This animation uses the FLIP approach.
            // Read more here: https://aerotwist.com/blog/flip-your-animations/
            this.adapter_.setScrollAreaScrollLeft(animation.finalScrollPosition);
            this.adapter_.setScrollContentStyleProperty('transform', "translateX(" + animation.scrollDelta + "px)");
            // Force repaint
            this.adapter_.computeScrollAreaClientRect();
            requestAnimationFrame(function () {
                _this.adapter_.addClass(MDCTabScrollerFoundation.cssClasses.ANIMATING);
                _this.adapter_.setScrollContentStyleProperty('transform', 'none');
            });
            this.isAnimating_ = true;
        };
        /**
         * Stops scroll animation
         */
        MDCTabScrollerFoundation.prototype.stopScrollAnimation_ = function () {
            this.isAnimating_ = false;
            var currentScrollPosition = this.getAnimatingScrollPosition_();
            this.adapter_.removeClass(MDCTabScrollerFoundation.cssClasses.ANIMATING);
            this.adapter_.setScrollContentStyleProperty('transform', 'translateX(0px)');
            this.adapter_.setScrollAreaScrollLeft(currentScrollPosition);
        };
        /**
         * Gets the current scroll position during animation
         */
        MDCTabScrollerFoundation.prototype.getAnimatingScrollPosition_ = function () {
            var currentTranslateX = this.calculateCurrentTranslateX_();
            var scrollLeft = this.adapter_.getScrollAreaScrollLeft();
            if (this.isRTL_()) {
                return this.getRTLScroller().getAnimatingScrollPosition(scrollLeft, currentTranslateX);
            }
            return scrollLeft - currentTranslateX;
        };
        /**
         * Determines the RTL Scroller to use
         */
        MDCTabScrollerFoundation.prototype.rtlScrollerFactory_ = function () {
            // Browsers have three different implementations of scrollLeft in RTL mode,
            // dependent on the browser. The behavior is based off the max LTR
            // scrollLeft value and 0.
            //
            // * Default scrolling in RTL *
            //    - Left-most value: 0
            //    - Right-most value: Max LTR scrollLeft value
            //
            // * Negative scrolling in RTL *
            //    - Left-most value: Negated max LTR scrollLeft value
            //    - Right-most value: 0
            //
            // * Reverse scrolling in RTL *
            //    - Left-most value: Max LTR scrollLeft value
            //    - Right-most value: 0
            //
            // We use those principles below to determine which RTL scrollLeft
            // behavior is implemented in the current browser.
            var initialScrollLeft = this.adapter_.getScrollAreaScrollLeft();
            this.adapter_.setScrollAreaScrollLeft(initialScrollLeft - 1);
            var newScrollLeft = this.adapter_.getScrollAreaScrollLeft();
            // If the newScrollLeft value is negative,then we know that the browser has
            // implemented negative RTL scrolling, since all other implementations have
            // only positive values.
            if (newScrollLeft < 0) {
                // Undo the scrollLeft test check
                this.adapter_.setScrollAreaScrollLeft(initialScrollLeft);
                return new MDCTabScrollerRTLNegative(this.adapter_);
            }
            var rootClientRect = this.adapter_.computeScrollAreaClientRect();
            var contentClientRect = this.adapter_.computeScrollContentClientRect();
            var rightEdgeDelta = Math.round(contentClientRect.right - rootClientRect.right);
            // Undo the scrollLeft test check
            this.adapter_.setScrollAreaScrollLeft(initialScrollLeft);
            // By calculating the clientRect of the root element and the clientRect of
            // the content element, we can determine how much the scroll value changed
            // when we performed the scrollLeft subtraction above.
            if (rightEdgeDelta === newScrollLeft) {
                return new MDCTabScrollerRTLReverse(this.adapter_);
            }
            return new MDCTabScrollerRTLDefault(this.adapter_);
        };
        MDCTabScrollerFoundation.prototype.isRTL_ = function () {
            return this.adapter_.getScrollContentStyleValue('direction') === 'rtl';
        };
        return MDCTabScrollerFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    /**
     * Stores result from computeHorizontalScrollbarHeight to avoid redundant processing.
     */
    var horizontalScrollbarHeight_;
    /**
     * Computes the height of browser-rendered horizontal scrollbars using a self-created test element.
     * May return 0 (e.g. on OS X browsers under default configuration).
     */
    function computeHorizontalScrollbarHeight(documentObj, shouldCacheResult) {
        if (shouldCacheResult === void 0) { shouldCacheResult = true; }
        if (shouldCacheResult && typeof horizontalScrollbarHeight_ !== 'undefined') {
            return horizontalScrollbarHeight_;
        }
        var el = documentObj.createElement('div');
        el.classList.add(cssClasses$4.SCROLL_TEST);
        documentObj.body.appendChild(el);
        var horizontalScrollbarHeight = el.offsetHeight - el.clientHeight;
        documentObj.body.removeChild(el);
        if (shouldCacheResult) {
            horizontalScrollbarHeight_ = horizontalScrollbarHeight;
        }
        return horizontalScrollbarHeight;
    }
    //# sourceMappingURL=util.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var MDCTabScroller = /** @class */ (function (_super) {
        __extends(MDCTabScroller, _super);
        function MDCTabScroller() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCTabScroller.attachTo = function (root) {
            return new MDCTabScroller(root);
        };
        MDCTabScroller.prototype.initialize = function () {
            this.area_ = this.root_.querySelector(MDCTabScrollerFoundation.strings.AREA_SELECTOR);
            this.content_ = this.root_.querySelector(MDCTabScrollerFoundation.strings.CONTENT_SELECTOR);
        };
        MDCTabScroller.prototype.initialSyncWithDOM = function () {
            var _this = this;
            this.handleInteraction_ = function () { return _this.foundation_.handleInteraction(); };
            this.handleTransitionEnd_ = function (evt) { return _this.foundation_.handleTransitionEnd(evt); };
            this.area_.addEventListener('wheel', this.handleInteraction_, applyPassive());
            this.area_.addEventListener('touchstart', this.handleInteraction_, applyPassive());
            this.area_.addEventListener('pointerdown', this.handleInteraction_, applyPassive());
            this.area_.addEventListener('mousedown', this.handleInteraction_, applyPassive());
            this.area_.addEventListener('keydown', this.handleInteraction_, applyPassive());
            this.content_.addEventListener('transitionend', this.handleTransitionEnd_);
        };
        MDCTabScroller.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            this.area_.removeEventListener('wheel', this.handleInteraction_, applyPassive());
            this.area_.removeEventListener('touchstart', this.handleInteraction_, applyPassive());
            this.area_.removeEventListener('pointerdown', this.handleInteraction_, applyPassive());
            this.area_.removeEventListener('mousedown', this.handleInteraction_, applyPassive());
            this.area_.removeEventListener('keydown', this.handleInteraction_, applyPassive());
            this.content_.removeEventListener('transitionend', this.handleTransitionEnd_);
        };
        MDCTabScroller.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = {
                eventTargetMatchesSelector: function (evtTarget, selector) { return matches(evtTarget, selector); },
                addClass: function (className) { return _this.root_.classList.add(className); },
                removeClass: function (className) { return _this.root_.classList.remove(className); },
                addScrollAreaClass: function (className) { return _this.area_.classList.add(className); },
                setScrollAreaStyleProperty: function (prop, value) { return _this.area_.style.setProperty(prop, value); },
                setScrollContentStyleProperty: function (prop, value) { return _this.content_.style.setProperty(prop, value); },
                getScrollContentStyleValue: function (propName) { return window.getComputedStyle(_this.content_).getPropertyValue(propName); },
                setScrollAreaScrollLeft: function (scrollX) { return _this.area_.scrollLeft = scrollX; },
                getScrollAreaScrollLeft: function () { return _this.area_.scrollLeft; },
                getScrollContentOffsetWidth: function () { return _this.content_.offsetWidth; },
                getScrollAreaOffsetWidth: function () { return _this.area_.offsetWidth; },
                computeScrollAreaClientRect: function () { return _this.area_.getBoundingClientRect(); },
                computeScrollContentClientRect: function () { return _this.content_.getBoundingClientRect(); },
                computeHorizontalScrollbarHeight: function () { return computeHorizontalScrollbarHeight(document); },
            };
            // tslint:enable:object-literal-sort-keys
            return new MDCTabScrollerFoundation(adapter);
        };
        /**
         * Returns the current visual scroll position
         */
        MDCTabScroller.prototype.getScrollPosition = function () {
            return this.foundation_.getScrollPosition();
        };
        /**
         * Returns the width of the scroll content
         */
        MDCTabScroller.prototype.getScrollContentWidth = function () {
            return this.content_.offsetWidth;
        };
        /**
         * Increments the scroll value by the given amount
         * @param scrollXIncrement The pixel value by which to increment the scroll value
         */
        MDCTabScroller.prototype.incrementScroll = function (scrollXIncrement) {
            this.foundation_.incrementScroll(scrollXIncrement);
        };
        /**
         * Scrolls to the given pixel position
         * @param scrollX The pixel value to scroll to
         */
        MDCTabScroller.prototype.scrollTo = function (scrollX) {
            this.foundation_.scrollTo(scrollX);
        };
        return MDCTabScroller;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var strings$5 = {
        ARROW_LEFT_KEY: 'ArrowLeft',
        ARROW_RIGHT_KEY: 'ArrowRight',
        END_KEY: 'End',
        ENTER_KEY: 'Enter',
        HOME_KEY: 'Home',
        SPACE_KEY: 'Space',
        TAB_ACTIVATED_EVENT: 'MDCTabBar:activated',
        TAB_SCROLLER_SELECTOR: '.mdc-tab-scroller',
        TAB_SELECTOR: '.mdc-tab',
    };
    var numbers$2 = {
        ARROW_LEFT_KEYCODE: 37,
        ARROW_RIGHT_KEYCODE: 39,
        END_KEYCODE: 35,
        ENTER_KEYCODE: 13,
        EXTRA_SCROLL_AMOUNT: 20,
        HOME_KEYCODE: 36,
        SPACE_KEYCODE: 32,
    };
    //# sourceMappingURL=constants.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var ACCEPTABLE_KEYS = new Set();
    // IE11 has no support for new Set with iterable so we need to initialize this by hand
    ACCEPTABLE_KEYS.add(strings$5.ARROW_LEFT_KEY);
    ACCEPTABLE_KEYS.add(strings$5.ARROW_RIGHT_KEY);
    ACCEPTABLE_KEYS.add(strings$5.END_KEY);
    ACCEPTABLE_KEYS.add(strings$5.HOME_KEY);
    ACCEPTABLE_KEYS.add(strings$5.ENTER_KEY);
    ACCEPTABLE_KEYS.add(strings$5.SPACE_KEY);
    var KEYCODE_MAP = new Map();
    // IE11 has no support for new Map with iterable so we need to initialize this by hand
    KEYCODE_MAP.set(numbers$2.ARROW_LEFT_KEYCODE, strings$5.ARROW_LEFT_KEY);
    KEYCODE_MAP.set(numbers$2.ARROW_RIGHT_KEYCODE, strings$5.ARROW_RIGHT_KEY);
    KEYCODE_MAP.set(numbers$2.END_KEYCODE, strings$5.END_KEY);
    KEYCODE_MAP.set(numbers$2.HOME_KEYCODE, strings$5.HOME_KEY);
    KEYCODE_MAP.set(numbers$2.ENTER_KEYCODE, strings$5.ENTER_KEY);
    KEYCODE_MAP.set(numbers$2.SPACE_KEYCODE, strings$5.SPACE_KEY);
    var MDCTabBarFoundation = /** @class */ (function (_super) {
        __extends(MDCTabBarFoundation, _super);
        function MDCTabBarFoundation(adapter) {
            var _this = _super.call(this, __assign({}, MDCTabBarFoundation.defaultAdapter, adapter)) || this;
            _this.useAutomaticActivation_ = false;
            return _this;
        }
        Object.defineProperty(MDCTabBarFoundation, "strings", {
            get: function () {
                return strings$5;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTabBarFoundation, "numbers", {
            get: function () {
                return numbers$2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTabBarFoundation, "defaultAdapter", {
            get: function () {
                // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
                return {
                    scrollTo: function () { return undefined; },
                    incrementScroll: function () { return undefined; },
                    getScrollPosition: function () { return 0; },
                    getScrollContentWidth: function () { return 0; },
                    getOffsetWidth: function () { return 0; },
                    isRTL: function () { return false; },
                    setActiveTab: function () { return undefined; },
                    activateTabAtIndex: function () { return undefined; },
                    deactivateTabAtIndex: function () { return undefined; },
                    focusTabAtIndex: function () { return undefined; },
                    getTabIndicatorClientRectAtIndex: function () { return ({ top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 }); },
                    getTabDimensionsAtIndex: function () { return ({ rootLeft: 0, rootRight: 0, contentLeft: 0, contentRight: 0 }); },
                    getPreviousActiveTabIndex: function () { return -1; },
                    getFocusedTabIndex: function () { return -1; },
                    getIndexOfTabById: function () { return -1; },
                    getTabListLength: function () { return 0; },
                    notifyTabActivated: function () { return undefined; },
                };
                // tslint:enable:object-literal-sort-keys
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Switches between automatic and manual activation modes.
         * See https://www.w3.org/TR/wai-aria-practices/#tabpanel for examples.
         */
        MDCTabBarFoundation.prototype.setUseAutomaticActivation = function (useAutomaticActivation) {
            this.useAutomaticActivation_ = useAutomaticActivation;
        };
        MDCTabBarFoundation.prototype.activateTab = function (index) {
            var previousActiveIndex = this.adapter_.getPreviousActiveTabIndex();
            if (!this.indexIsInRange_(index) || index === previousActiveIndex) {
                return;
            }
            var previousClientRect;
            if (previousActiveIndex !== -1) {
                this.adapter_.deactivateTabAtIndex(previousActiveIndex);
                previousClientRect = this.adapter_.getTabIndicatorClientRectAtIndex(previousActiveIndex);
            }
            this.adapter_.activateTabAtIndex(index, previousClientRect);
            this.scrollIntoView(index);
            this.adapter_.notifyTabActivated(index);
        };
        MDCTabBarFoundation.prototype.handleKeyDown = function (evt) {
            // Get the key from the event
            var key = this.getKeyFromEvent_(evt);
            // Early exit if the event key isn't one of the keyboard navigation keys
            if (key === undefined) {
                return;
            }
            // Prevent default behavior for movement keys, but not for activation keys, since :active is used to apply ripple
            if (!this.isActivationKey_(key)) {
                evt.preventDefault();
            }
            if (this.useAutomaticActivation_) {
                if (this.isActivationKey_(key)) {
                    return;
                }
                var index = this.determineTargetFromKey_(this.adapter_.getPreviousActiveTabIndex(), key);
                this.adapter_.setActiveTab(index);
                this.scrollIntoView(index);
            }
            else {
                var focusedTabIndex = this.adapter_.getFocusedTabIndex();
                if (this.isActivationKey_(key)) {
                    this.adapter_.setActiveTab(focusedTabIndex);
                }
                else {
                    var index = this.determineTargetFromKey_(focusedTabIndex, key);
                    this.adapter_.focusTabAtIndex(index);
                    this.scrollIntoView(index);
                }
            }
        };
        /**
         * Handles the MDCTab:interacted event
         */
        MDCTabBarFoundation.prototype.handleTabInteraction = function (evt) {
            this.adapter_.setActiveTab(this.adapter_.getIndexOfTabById(evt.detail.tabId));
        };
        /**
         * Scrolls the tab at the given index into view
         * @param index The tab index to make visible
         */
        MDCTabBarFoundation.prototype.scrollIntoView = function (index) {
            // Early exit if the index is out of range
            if (!this.indexIsInRange_(index)) {
                return;
            }
            // Always scroll to 0 if scrolling to the 0th index
            if (index === 0) {
                return this.adapter_.scrollTo(0);
            }
            // Always scroll to the max value if scrolling to the Nth index
            // MDCTabScroller.scrollTo() will never scroll past the max possible value
            if (index === this.adapter_.getTabListLength() - 1) {
                return this.adapter_.scrollTo(this.adapter_.getScrollContentWidth());
            }
            if (this.isRTL_()) {
                return this.scrollIntoViewRTL_(index);
            }
            this.scrollIntoView_(index);
        };
        /**
         * Private method for determining the index of the destination tab based on what key was pressed
         * @param origin The original index from which to determine the destination
         * @param key The name of the key
         */
        MDCTabBarFoundation.prototype.determineTargetFromKey_ = function (origin, key) {
            var isRTL = this.isRTL_();
            var maxIndex = this.adapter_.getTabListLength() - 1;
            var shouldGoToEnd = key === strings$5.END_KEY;
            var shouldDecrement = key === strings$5.ARROW_LEFT_KEY && !isRTL || key === strings$5.ARROW_RIGHT_KEY && isRTL;
            var shouldIncrement = key === strings$5.ARROW_RIGHT_KEY && !isRTL || key === strings$5.ARROW_LEFT_KEY && isRTL;
            var index = origin;
            if (shouldGoToEnd) {
                index = maxIndex;
            }
            else if (shouldDecrement) {
                index -= 1;
            }
            else if (shouldIncrement) {
                index += 1;
            }
            else {
                index = 0;
            }
            if (index < 0) {
                index = maxIndex;
            }
            else if (index > maxIndex) {
                index = 0;
            }
            return index;
        };
        /**
         * Calculates the scroll increment that will make the tab at the given index visible
         * @param index The index of the tab
         * @param nextIndex The index of the next tab
         * @param scrollPosition The current scroll position
         * @param barWidth The width of the Tab Bar
         */
        MDCTabBarFoundation.prototype.calculateScrollIncrement_ = function (index, nextIndex, scrollPosition, barWidth) {
            var nextTabDimensions = this.adapter_.getTabDimensionsAtIndex(nextIndex);
            var relativeContentLeft = nextTabDimensions.contentLeft - scrollPosition - barWidth;
            var relativeContentRight = nextTabDimensions.contentRight - scrollPosition;
            var leftIncrement = relativeContentRight - numbers$2.EXTRA_SCROLL_AMOUNT;
            var rightIncrement = relativeContentLeft + numbers$2.EXTRA_SCROLL_AMOUNT;
            if (nextIndex < index) {
                return Math.min(leftIncrement, 0);
            }
            return Math.max(rightIncrement, 0);
        };
        /**
         * Calculates the scroll increment that will make the tab at the given index visible in RTL
         * @param index The index of the tab
         * @param nextIndex The index of the next tab
         * @param scrollPosition The current scroll position
         * @param barWidth The width of the Tab Bar
         * @param scrollContentWidth The width of the scroll content
         */
        MDCTabBarFoundation.prototype.calculateScrollIncrementRTL_ = function (index, nextIndex, scrollPosition, barWidth, scrollContentWidth) {
            var nextTabDimensions = this.adapter_.getTabDimensionsAtIndex(nextIndex);
            var relativeContentLeft = scrollContentWidth - nextTabDimensions.contentLeft - scrollPosition;
            var relativeContentRight = scrollContentWidth - nextTabDimensions.contentRight - scrollPosition - barWidth;
            var leftIncrement = relativeContentRight + numbers$2.EXTRA_SCROLL_AMOUNT;
            var rightIncrement = relativeContentLeft - numbers$2.EXTRA_SCROLL_AMOUNT;
            if (nextIndex > index) {
                return Math.max(leftIncrement, 0);
            }
            return Math.min(rightIncrement, 0);
        };
        /**
         * Determines the index of the adjacent tab closest to either edge of the Tab Bar
         * @param index The index of the tab
         * @param tabDimensions The dimensions of the tab
         * @param scrollPosition The current scroll position
         * @param barWidth The width of the tab bar
         */
        MDCTabBarFoundation.prototype.findAdjacentTabIndexClosestToEdge_ = function (index, tabDimensions, scrollPosition, barWidth) {
            /**
             * Tabs are laid out in the Tab Scroller like this:
             *
             *    Scroll Position
             *    +---+
             *    |   |   Bar Width
             *    |   +-----------------------------------+
             *    |   |                                   |
             *    |   V                                   V
             *    |   +-----------------------------------+
             *    V   |             Tab Scroller          |
             *    +------------+--------------+-------------------+
             *    |    Tab     |      Tab     |        Tab        |
             *    +------------+--------------+-------------------+
             *        |                                   |
             *        +-----------------------------------+
             *
             * To determine the next adjacent index, we look at the Tab root left and
             * Tab root right, both relative to the scroll position. If the Tab root
             * left is less than 0, then we know it's out of view to the left. If the
             * Tab root right minus the bar width is greater than 0, we know the Tab is
             * out of view to the right. From there, we either increment or decrement
             * the index.
             */
            var relativeRootLeft = tabDimensions.rootLeft - scrollPosition;
            var relativeRootRight = tabDimensions.rootRight - scrollPosition - barWidth;
            var relativeRootDelta = relativeRootLeft + relativeRootRight;
            var leftEdgeIsCloser = relativeRootLeft < 0 || relativeRootDelta < 0;
            var rightEdgeIsCloser = relativeRootRight > 0 || relativeRootDelta > 0;
            if (leftEdgeIsCloser) {
                return index - 1;
            }
            if (rightEdgeIsCloser) {
                return index + 1;
            }
            return -1;
        };
        /**
         * Determines the index of the adjacent tab closest to either edge of the Tab Bar in RTL
         * @param index The index of the tab
         * @param tabDimensions The dimensions of the tab
         * @param scrollPosition The current scroll position
         * @param barWidth The width of the tab bar
         * @param scrollContentWidth The width of the scroller content
         */
        MDCTabBarFoundation.prototype.findAdjacentTabIndexClosestToEdgeRTL_ = function (index, tabDimensions, scrollPosition, barWidth, scrollContentWidth) {
            var rootLeft = scrollContentWidth - tabDimensions.rootLeft - barWidth - scrollPosition;
            var rootRight = scrollContentWidth - tabDimensions.rootRight - scrollPosition;
            var rootDelta = rootLeft + rootRight;
            var leftEdgeIsCloser = rootLeft > 0 || rootDelta > 0;
            var rightEdgeIsCloser = rootRight < 0 || rootDelta < 0;
            if (leftEdgeIsCloser) {
                return index + 1;
            }
            if (rightEdgeIsCloser) {
                return index - 1;
            }
            return -1;
        };
        /**
         * Returns the key associated with a keydown event
         * @param evt The keydown event
         */
        MDCTabBarFoundation.prototype.getKeyFromEvent_ = function (evt) {
            if (ACCEPTABLE_KEYS.has(evt.key)) {
                return evt.key;
            }
            return KEYCODE_MAP.get(evt.keyCode);
        };
        MDCTabBarFoundation.prototype.isActivationKey_ = function (key) {
            return key === strings$5.SPACE_KEY || key === strings$5.ENTER_KEY;
        };
        /**
         * Returns whether a given index is inclusively between the ends
         * @param index The index to test
         */
        MDCTabBarFoundation.prototype.indexIsInRange_ = function (index) {
            return index >= 0 && index < this.adapter_.getTabListLength();
        };
        /**
         * Returns the view's RTL property
         */
        MDCTabBarFoundation.prototype.isRTL_ = function () {
            return this.adapter_.isRTL();
        };
        /**
         * Scrolls the tab at the given index into view for left-to-right user agents.
         * @param index The index of the tab to scroll into view
         */
        MDCTabBarFoundation.prototype.scrollIntoView_ = function (index) {
            var scrollPosition = this.adapter_.getScrollPosition();
            var barWidth = this.adapter_.getOffsetWidth();
            var tabDimensions = this.adapter_.getTabDimensionsAtIndex(index);
            var nextIndex = this.findAdjacentTabIndexClosestToEdge_(index, tabDimensions, scrollPosition, barWidth);
            if (!this.indexIsInRange_(nextIndex)) {
                return;
            }
            var scrollIncrement = this.calculateScrollIncrement_(index, nextIndex, scrollPosition, barWidth);
            this.adapter_.incrementScroll(scrollIncrement);
        };
        /**
         * Scrolls the tab at the given index into view in RTL
         * @param index The tab index to make visible
         */
        MDCTabBarFoundation.prototype.scrollIntoViewRTL_ = function (index) {
            var scrollPosition = this.adapter_.getScrollPosition();
            var barWidth = this.adapter_.getOffsetWidth();
            var tabDimensions = this.adapter_.getTabDimensionsAtIndex(index);
            var scrollWidth = this.adapter_.getScrollContentWidth();
            var nextIndex = this.findAdjacentTabIndexClosestToEdgeRTL_(index, tabDimensions, scrollPosition, barWidth, scrollWidth);
            if (!this.indexIsInRange_(nextIndex)) {
                return;
            }
            var scrollIncrement = this.calculateScrollIncrementRTL_(index, nextIndex, scrollPosition, barWidth, scrollWidth);
            this.adapter_.incrementScroll(scrollIncrement);
        };
        return MDCTabBarFoundation;
    }(MDCFoundation));
    //# sourceMappingURL=foundation.js.map

    /**
     * @license
     * Copyright 2018 Google Inc.
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in
     * all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     * THE SOFTWARE.
     */
    var strings$6 = MDCTabBarFoundation.strings;
    var tabIdCounter = 0;
    var MDCTabBar = /** @class */ (function (_super) {
        __extends(MDCTabBar, _super);
        function MDCTabBar() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        MDCTabBar.attachTo = function (root) {
            return new MDCTabBar(root);
        };
        Object.defineProperty(MDCTabBar.prototype, "focusOnActivate", {
            set: function (focusOnActivate) {
                this.tabList_.forEach(function (tab) { return tab.focusOnActivate = focusOnActivate; });
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(MDCTabBar.prototype, "useAutomaticActivation", {
            set: function (useAutomaticActivation) {
                this.foundation_.setUseAutomaticActivation(useAutomaticActivation);
            },
            enumerable: true,
            configurable: true
        });
        MDCTabBar.prototype.initialize = function (tabFactory, tabScrollerFactory) {
            if (tabFactory === void 0) { tabFactory = function (el) { return new MDCTab(el); }; }
            if (tabScrollerFactory === void 0) { tabScrollerFactory = function (el) { return new MDCTabScroller(el); }; }
            this.tabList_ = this.instantiateTabs_(tabFactory);
            this.tabScroller_ = this.instantiateTabScroller_(tabScrollerFactory);
        };
        MDCTabBar.prototype.initialSyncWithDOM = function () {
            var _this = this;
            this.handleTabInteraction_ = function (evt) { return _this.foundation_.handleTabInteraction(evt); };
            this.handleKeyDown_ = function (evt) { return _this.foundation_.handleKeyDown(evt); };
            this.listen(MDCTabFoundation.strings.INTERACTED_EVENT, this.handleTabInteraction_);
            this.listen('keydown', this.handleKeyDown_);
            for (var i = 0; i < this.tabList_.length; i++) {
                if (this.tabList_[i].active) {
                    this.scrollIntoView(i);
                    break;
                }
            }
        };
        MDCTabBar.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            this.unlisten(MDCTabFoundation.strings.INTERACTED_EVENT, this.handleTabInteraction_);
            this.unlisten('keydown', this.handleKeyDown_);
            this.tabList_.forEach(function (tab) { return tab.destroy(); });
            if (this.tabScroller_) {
                this.tabScroller_.destroy();
            }
        };
        MDCTabBar.prototype.getDefaultFoundation = function () {
            var _this = this;
            // DO NOT INLINE this variable. For backward compatibility, foundations take a Partial<MDCFooAdapter>.
            // To ensure we don't accidentally omit any methods, we need a separate, strongly typed adapter variable.
            // tslint:disable:object-literal-sort-keys Methods should be in the same order as the adapter interface.
            var adapter = {
                scrollTo: function (scrollX) { return _this.tabScroller_.scrollTo(scrollX); },
                incrementScroll: function (scrollXIncrement) { return _this.tabScroller_.incrementScroll(scrollXIncrement); },
                getScrollPosition: function () { return _this.tabScroller_.getScrollPosition(); },
                getScrollContentWidth: function () { return _this.tabScroller_.getScrollContentWidth(); },
                getOffsetWidth: function () { return _this.root_.offsetWidth; },
                isRTL: function () { return window.getComputedStyle(_this.root_).getPropertyValue('direction') === 'rtl'; },
                setActiveTab: function (index) { return _this.foundation_.activateTab(index); },
                activateTabAtIndex: function (index, clientRect) { return _this.tabList_[index].activate(clientRect); },
                deactivateTabAtIndex: function (index) { return _this.tabList_[index].deactivate(); },
                focusTabAtIndex: function (index) { return _this.tabList_[index].focus(); },
                getTabIndicatorClientRectAtIndex: function (index) { return _this.tabList_[index].computeIndicatorClientRect(); },
                getTabDimensionsAtIndex: function (index) { return _this.tabList_[index].computeDimensions(); },
                getPreviousActiveTabIndex: function () {
                    for (var i = 0; i < _this.tabList_.length; i++) {
                        if (_this.tabList_[i].active) {
                            return i;
                        }
                    }
                    return -1;
                },
                getFocusedTabIndex: function () {
                    var tabElements = _this.getTabElements_();
                    var activeElement = document.activeElement;
                    return tabElements.indexOf(activeElement);
                },
                getIndexOfTabById: function (id) {
                    for (var i = 0; i < _this.tabList_.length; i++) {
                        if (_this.tabList_[i].id === id) {
                            return i;
                        }
                    }
                    return -1;
                },
                getTabListLength: function () { return _this.tabList_.length; },
                notifyTabActivated: function (index) {
                    return _this.emit(strings$6.TAB_ACTIVATED_EVENT, { index: index }, true);
                },
            };
            // tslint:enable:object-literal-sort-keys
            return new MDCTabBarFoundation(adapter);
        };
        /**
         * Activates the tab at the given index
         * @param index The index of the tab
         */
        MDCTabBar.prototype.activateTab = function (index) {
            this.foundation_.activateTab(index);
        };
        /**
         * Scrolls the tab at the given index into view
         * @param index THe index of the tab
         */
        MDCTabBar.prototype.scrollIntoView = function (index) {
            this.foundation_.scrollIntoView(index);
        };
        /**
         * Returns all the tab elements in a nice clean array
         */
        MDCTabBar.prototype.getTabElements_ = function () {
            return [].slice.call(this.root_.querySelectorAll(strings$6.TAB_SELECTOR));
        };
        /**
         * Instantiates tab components on all child tab elements
         */
        MDCTabBar.prototype.instantiateTabs_ = function (tabFactory) {
            return this.getTabElements_().map(function (el) {
                el.id = el.id || "mdc-tab-" + ++tabIdCounter;
                return tabFactory(el);
            });
        };
        /**
         * Instantiates tab scroller component on the child tab scroller element
         */
        MDCTabBar.prototype.instantiateTabScroller_ = function (tabScrollerFactory) {
            var tabScrollerElement = this.root_.querySelector(strings$6.TAB_SCROLLER_SELECTOR);
            if (tabScrollerElement) {
                return tabScrollerFactory(tabScrollerElement);
            }
            return null;
        };
        return MDCTabBar;
    }(MDCComponent));
    //# sourceMappingURL=component.js.map

    /* node_modules/@smui/tab-scroller/TabScroller.svelte generated by Svelte v3.18.2 */
    const file$7 = "node_modules/@smui/tab-scroller/TabScroller.svelte";

    function create_fragment$8(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let useActions_action;
    	let useActions_action_1;
    	let useActions_action_2;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[17].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[16], null);

    	let div0_levels = [
    		{
    			class: "mdc-tab-scroller__scroll-content " + /*scrollContent$class*/ ctx[5]
    		},
    		exclude(prefixFilter(/*$$props*/ ctx[8], "scrollContent$"), ["use", "class"])
    	];

    	let div0_data = {};

    	for (let i = 0; i < div0_levels.length; i += 1) {
    		div0_data = assign(div0_data, div0_levels[i]);
    	}

    	let div1_levels = [
    		{
    			class: "mdc-tab-scroller__scroll-area " + /*scrollArea$class*/ ctx[3]
    		},
    		exclude(prefixFilter(/*$$props*/ ctx[8], "scrollArea$"), ["use", "class"])
    	];

    	let div1_data = {};

    	for (let i = 0; i < div1_levels.length; i += 1) {
    		div1_data = assign(div1_data, div1_levels[i]);
    	}

    	let div2_levels = [
    		{
    			class: "mdc-tab-scroller " + /*className*/ ctx[1]
    		},
    		exclude(/*$$props*/ ctx[8], ["use", "class", "scrollArea$", "scrollContent$"])
    	];

    	let div2_data = {};

    	for (let i = 0; i < div2_levels.length; i += 1) {
    		div2_data = assign(div2_data, div2_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			set_attributes(div0, div0_data);
    			add_location(div0, file$7, 12, 4, 371);
    			set_attributes(div1, div1_data);
    			add_location(div1, file$7, 7, 2, 188);
    			set_attributes(div2, div2_data);
    			add_location(div2, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			/*div2_binding*/ ctx[18](div2);
    			current = true;

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, div0, /*scrollContent$use*/ ctx[4])),
    				action_destroyer(useActions_action_1 = useActions.call(null, div1, /*scrollArea$use*/ ctx[2])),
    				action_destroyer(useActions_action_2 = useActions.call(null, div2, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[7].call(null, div2))
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 65536) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[16], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[16], dirty, null));
    			}

    			set_attributes(div0, get_spread_update(div0_levels, [
    				dirty & /*scrollContent$class*/ 32 && {
    					class: "mdc-tab-scroller__scroll-content " + /*scrollContent$class*/ ctx[5]
    				},
    				dirty & /*exclude, prefixFilter, $$props*/ 256 && exclude(prefixFilter(/*$$props*/ ctx[8], "scrollContent$"), ["use", "class"])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*scrollContent$use*/ 16) useActions_action.update.call(null, /*scrollContent$use*/ ctx[4]);

    			set_attributes(div1, get_spread_update(div1_levels, [
    				dirty & /*scrollArea$class*/ 8 && {
    					class: "mdc-tab-scroller__scroll-area " + /*scrollArea$class*/ ctx[3]
    				},
    				dirty & /*exclude, prefixFilter, $$props*/ 256 && exclude(prefixFilter(/*$$props*/ ctx[8], "scrollArea$"), ["use", "class"])
    			]));

    			if (useActions_action_1 && is_function(useActions_action_1.update) && dirty & /*scrollArea$use*/ 4) useActions_action_1.update.call(null, /*scrollArea$use*/ ctx[2]);

    			set_attributes(div2, get_spread_update(div2_levels, [
    				dirty & /*className*/ 2 && {
    					class: "mdc-tab-scroller " + /*className*/ ctx[1]
    				},
    				dirty & /*exclude, $$props*/ 256 && exclude(/*$$props*/ ctx[8], ["use", "class", "scrollArea$", "scrollContent$"])
    			]));

    			if (useActions_action_2 && is_function(useActions_action_2.update) && dirty & /*use*/ 1) useActions_action_2.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (default_slot) default_slot.d(detaching);
    			/*div2_binding*/ ctx[18](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component);
    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { scrollArea$use = [] } = $$props;
    	let { scrollArea$class = "" } = $$props;
    	let { scrollContent$use = [] } = $$props;
    	let { scrollContent$class = "" } = $$props;
    	let element;
    	let tabScroller;
    	let instantiate = getContext("SMUI:tab-scroller:instantiate");
    	let getInstance = getContext("SMUI:tab-scroller:getInstance");

    	onMount(async () => {
    		if (instantiate !== false) {
    			tabScroller = new MDCTabScroller(element);
    		} else {
    			tabScroller = await getInstance();
    		}
    	});

    	onDestroy(() => {
    		tabScroller && tabScroller.destroy();
    	});

    	function scrollTo(...args) {
    		return tabScroller.scrollTo(...args);
    	}

    	function incrementScroll(...args) {
    		return tabScroller.incrementScroll(...args);
    	}

    	function getScrollPosition(...args) {
    		return tabScroller.getScrollPosition(...args);
    	}

    	function getScrollContentWidth(...args) {
    		return tabScroller.getScrollContentWidth(...args);
    	}

    	let { $$slots = {}, $$scope } = $$props;

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(6, element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(8, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("scrollArea$use" in $$new_props) $$invalidate(2, scrollArea$use = $$new_props.scrollArea$use);
    		if ("scrollArea$class" in $$new_props) $$invalidate(3, scrollArea$class = $$new_props.scrollArea$class);
    		if ("scrollContent$use" in $$new_props) $$invalidate(4, scrollContent$use = $$new_props.scrollContent$use);
    		if ("scrollContent$class" in $$new_props) $$invalidate(5, scrollContent$class = $$new_props.scrollContent$class);
    		if ("$$scope" in $$new_props) $$invalidate(16, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			use,
    			className,
    			scrollArea$use,
    			scrollArea$class,
    			scrollContent$use,
    			scrollContent$class,
    			element,
    			tabScroller,
    			instantiate,
    			getInstance
    		};
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(8, $$props = assign(assign({}, $$props), $$new_props));
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("scrollArea$use" in $$props) $$invalidate(2, scrollArea$use = $$new_props.scrollArea$use);
    		if ("scrollArea$class" in $$props) $$invalidate(3, scrollArea$class = $$new_props.scrollArea$class);
    		if ("scrollContent$use" in $$props) $$invalidate(4, scrollContent$use = $$new_props.scrollContent$use);
    		if ("scrollContent$class" in $$props) $$invalidate(5, scrollContent$class = $$new_props.scrollContent$class);
    		if ("element" in $$props) $$invalidate(6, element = $$new_props.element);
    		if ("tabScroller" in $$props) tabScroller = $$new_props.tabScroller;
    		if ("instantiate" in $$props) instantiate = $$new_props.instantiate;
    		if ("getInstance" in $$props) getInstance = $$new_props.getInstance;
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		scrollArea$use,
    		scrollArea$class,
    		scrollContent$use,
    		scrollContent$class,
    		element,
    		forwardEvents,
    		$$props,
    		scrollTo,
    		incrementScroll,
    		getScrollPosition,
    		getScrollContentWidth,
    		tabScroller,
    		instantiate,
    		getInstance,
    		$$scope,
    		$$slots,
    		div2_binding
    	];
    }

    class TabScroller extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			use: 0,
    			class: 1,
    			scrollArea$use: 2,
    			scrollArea$class: 3,
    			scrollContent$use: 4,
    			scrollContent$class: 5,
    			scrollTo: 9,
    			incrementScroll: 10,
    			getScrollPosition: 11,
    			getScrollContentWidth: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TabScroller",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get use() {
    		throw new Error("<TabScroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<TabScroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<TabScroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<TabScroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrollArea$use() {
    		throw new Error("<TabScroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scrollArea$use(value) {
    		throw new Error("<TabScroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrollArea$class() {
    		throw new Error("<TabScroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scrollArea$class(value) {
    		throw new Error("<TabScroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrollContent$use() {
    		throw new Error("<TabScroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scrollContent$use(value) {
    		throw new Error("<TabScroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrollContent$class() {
    		throw new Error("<TabScroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scrollContent$class(value) {
    		throw new Error("<TabScroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrollTo() {
    		return this.$$.ctx[9];
    	}

    	set scrollTo(value) {
    		throw new Error("<TabScroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get incrementScroll() {
    		return this.$$.ctx[10];
    	}

    	set incrementScroll(value) {
    		throw new Error("<TabScroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getScrollPosition() {
    		return this.$$.ctx[11];
    	}

    	set getScrollPosition(value) {
    		throw new Error("<TabScroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getScrollContentWidth() {
    		return this.$$.ctx[12];
    	}

    	set getScrollContentWidth(value) {
    		throw new Error("<TabScroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/@smui/tab-bar/TabBar.svelte generated by Svelte v3.18.2 */
    const file$8 = "node_modules/@smui/tab-bar/TabBar.svelte";
    const get_default_slot_changes = dirty => ({ tab: dirty & /*tabs*/ 4 });
    const get_default_slot_context = ctx => ({ tab: /*tab*/ ctx[28] });

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	child_ctx[30] = i;
    	return child_ctx;
    }

    // (13:4) {#each tabs as tab, i (key(tab))}
    function create_each_block(key_2, ctx) {
    	let first;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[25].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[27], get_default_slot_context);

    	const block = {
    		key: key_2,
    		first: null,
    		c: function create() {
    			first = empty();
    			if (default_slot) default_slot.c();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope, tabs*/ 134217732) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[27], get_default_slot_context), get_slot_changes(default_slot_template, /*$$scope*/ ctx[27], dirty, get_default_slot_changes));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(13:4) {#each tabs as tab, i (key(tab))}",
    		ctx
    	});

    	return block;
    }

    // (10:2) <TabScroller     {...prefixFilter($$props, 'tabScroller$')}   >
    function create_default_slot$2(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*tabs*/ ctx[2];
    	const get_key = ctx => /*key*/ ctx[3](/*tab*/ ctx[28]);
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const each_value = /*tabs*/ ctx[2];
    			group_outros();
    			validate_each_keys(ctx, each_value, get_each_context, get_key);
    			each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    			check_outros();
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(10:2) <TabScroller     {...prefixFilter($$props, 'tabScroller$')}   >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let useActions_action;
    	let forwardEvents_action;
    	let current;
    	let dispose;
    	const tabscroller_spread_levels = [prefixFilter(/*$$props*/ ctx[7], "tabScroller$")];

    	let tabscroller_props = {
    		$$slots: { default: [create_default_slot$2] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < tabscroller_spread_levels.length; i += 1) {
    		tabscroller_props = assign(tabscroller_props, tabscroller_spread_levels[i]);
    	}

    	const tabscroller = new TabScroller({ props: tabscroller_props, $$inline: true });

    	let div_levels = [
    		{
    			class: "mdc-tab-bar " + /*className*/ ctx[1]
    		},
    		{ role: "tablist" },
    		exclude(/*$$props*/ ctx[7], [
    			"use",
    			"class",
    			"tabs",
    			"key",
    			"focusOnActivate",
    			"useAutomaticActivation",
    			"activeIndex",
    			"tabScroller$"
    		])
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(tabscroller.$$.fragment);
    			set_attributes(div, div_data);
    			add_location(div, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(tabscroller, div, null);
    			/*div_binding*/ ctx[26](div);
    			current = true;

    			dispose = [
    				action_destroyer(useActions_action = useActions.call(null, div, /*use*/ ctx[0])),
    				action_destroyer(forwardEvents_action = /*forwardEvents*/ ctx[5].call(null, div)),
    				listen_dev(div, "MDCTabBar:activated", /*activatedHandler*/ ctx[6], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			const tabscroller_changes = (dirty & /*prefixFilter, $$props*/ 128)
    			? get_spread_update(tabscroller_spread_levels, [get_spread_object(prefixFilter(/*$$props*/ ctx[7], "tabScroller$"))])
    			: {};

    			if (dirty & /*$$scope, tabs*/ 134217732) {
    				tabscroller_changes.$$scope = { dirty, ctx };
    			}

    			tabscroller.$set(tabscroller_changes);

    			set_attributes(div, get_spread_update(div_levels, [
    				dirty & /*className*/ 2 && {
    					class: "mdc-tab-bar " + /*className*/ ctx[1]
    				},
    				{ role: "tablist" },
    				dirty & /*exclude, $$props*/ 128 && exclude(/*$$props*/ ctx[7], [
    					"use",
    					"class",
    					"tabs",
    					"key",
    					"focusOnActivate",
    					"useAutomaticActivation",
    					"activeIndex",
    					"tabScroller$"
    				])
    			]));

    			if (useActions_action && is_function(useActions_action.update) && dirty & /*use*/ 1) useActions_action.update.call(null, /*use*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabscroller.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabscroller.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(tabscroller);
    			/*div_binding*/ ctx[26](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	const forwardEvents = forwardEventsBuilder(current_component, ["MDCTabBar:activated"]);

    	let uninitializedValue = () => {
    		
    	};

    	let { use = [] } = $$props;
    	let { class: className = "" } = $$props;
    	let { tabs = [] } = $$props;
    	let { key = tab => tab } = $$props;
    	let { focusOnActivate = true } = $$props;
    	let { useAutomaticActivation = true } = $$props;
    	let { activeIndex = uninitializedValue } = $$props;
    	let { active = uninitializedValue } = $$props;

    	if (activeIndex === uninitializedValue && active === uninitializedValue) {
    		activeIndex = 0;
    		active = tabs[0];
    	} else if (activeIndex === uninitializedValue) {
    		activeIndex = tabs.indexOf(active);
    	} else if (active === uninitializedValue) {
    		active = tabs[activeIndex];
    	}

    	let element;
    	let tabBar;
    	let tabScrollerPromiseResolve;
    	let tabScrollerPromise = new Promise(resolve => tabScrollerPromiseResolve = resolve);
    	let tabPromiseResolve = [];
    	let tabPromise = tabs.map((tab, i) => new Promise(resolve => tabPromiseResolve[i] = resolve));
    	setContext("SMUI:tab-scroller:instantiate", false);
    	setContext("SMUI:tab-scroller:getInstance", getTabScrollerInstancePromise);
    	setContext("SMUI:tab:instantiate", false);
    	setContext("SMUI:tab:getInstance", getTabInstancePromise);
    	setContext("SMUI:tab:active", active);
    	let previousActiveIndex = activeIndex;
    	let previousActive = active;

    	onMount(() => {
    		$$invalidate(14, tabBar = new MDCTabBar(element));
    		tabScrollerPromiseResolve(tabBar.tabScroller_);

    		for (let i = 0; i < tabs.length; i++) {
    			tabPromiseResolve[i](tabBar.tabList_[i]);
    		}
    	});

    	onDestroy(() => {
    		tabBar && tabBar.destroy();
    	});

    	function getTabScrollerInstancePromise() {
    		return tabScrollerPromise;
    	}

    	function getTabInstancePromise(tabEntry) {
    		return tabPromise[tabs.indexOf(tabEntry)];
    	}

    	function updateIndexAfterActivate(index) {
    		$$invalidate(8, activeIndex = index);
    		$$invalidate(17, previousActiveIndex = index);
    		$$invalidate(9, active = tabs[index]);
    		$$invalidate(18, previousActive = tabs[index]);
    	}

    	function activatedHandler(e) {
    		updateIndexAfterActivate(e.detail.index);
    	}

    	function activateTab(index, ...args) {
    		updateIndexAfterActivate(index);
    		return tabBar.activateTab(index, ...args);
    	}

    	function scrollIntoView(...args) {
    		return tabBar.scrollIntoView(...args);
    	}

    	let { $$slots = {}, $$scope } = $$props;

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(4, element = $$value);
    		});
    	}

    	$$self.$set = $$new_props => {
    		$$invalidate(7, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("use" in $$new_props) $$invalidate(0, use = $$new_props.use);
    		if ("class" in $$new_props) $$invalidate(1, className = $$new_props.class);
    		if ("tabs" in $$new_props) $$invalidate(2, tabs = $$new_props.tabs);
    		if ("key" in $$new_props) $$invalidate(3, key = $$new_props.key);
    		if ("focusOnActivate" in $$new_props) $$invalidate(10, focusOnActivate = $$new_props.focusOnActivate);
    		if ("useAutomaticActivation" in $$new_props) $$invalidate(11, useAutomaticActivation = $$new_props.useAutomaticActivation);
    		if ("activeIndex" in $$new_props) $$invalidate(8, activeIndex = $$new_props.activeIndex);
    		if ("active" in $$new_props) $$invalidate(9, active = $$new_props.active);
    		if ("$$scope" in $$new_props) $$invalidate(27, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			uninitializedValue,
    			use,
    			className,
    			tabs,
    			key,
    			focusOnActivate,
    			useAutomaticActivation,
    			activeIndex,
    			active,
    			element,
    			tabBar,
    			tabScrollerPromiseResolve,
    			tabScrollerPromise,
    			tabPromiseResolve,
    			tabPromise,
    			previousActiveIndex,
    			previousActive
    		};
    	};

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(7, $$props = assign(assign({}, $$props), $$new_props));
    		if ("uninitializedValue" in $$props) uninitializedValue = $$new_props.uninitializedValue;
    		if ("use" in $$props) $$invalidate(0, use = $$new_props.use);
    		if ("className" in $$props) $$invalidate(1, className = $$new_props.className);
    		if ("tabs" in $$props) $$invalidate(2, tabs = $$new_props.tabs);
    		if ("key" in $$props) $$invalidate(3, key = $$new_props.key);
    		if ("focusOnActivate" in $$props) $$invalidate(10, focusOnActivate = $$new_props.focusOnActivate);
    		if ("useAutomaticActivation" in $$props) $$invalidate(11, useAutomaticActivation = $$new_props.useAutomaticActivation);
    		if ("activeIndex" in $$props) $$invalidate(8, activeIndex = $$new_props.activeIndex);
    		if ("active" in $$props) $$invalidate(9, active = $$new_props.active);
    		if ("element" in $$props) $$invalidate(4, element = $$new_props.element);
    		if ("tabBar" in $$props) $$invalidate(14, tabBar = $$new_props.tabBar);
    		if ("tabScrollerPromiseResolve" in $$props) tabScrollerPromiseResolve = $$new_props.tabScrollerPromiseResolve;
    		if ("tabScrollerPromise" in $$props) tabScrollerPromise = $$new_props.tabScrollerPromise;
    		if ("tabPromiseResolve" in $$props) tabPromiseResolve = $$new_props.tabPromiseResolve;
    		if ("tabPromise" in $$props) tabPromise = $$new_props.tabPromise;
    		if ("previousActiveIndex" in $$props) $$invalidate(17, previousActiveIndex = $$new_props.previousActiveIndex);
    		if ("previousActive" in $$props) $$invalidate(18, previousActive = $$new_props.previousActive);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*tabBar, focusOnActivate*/ 17408) {
    			 if (tabBar) {
    				$$invalidate(14, tabBar.focusOnActivate = focusOnActivate, tabBar);
    			}
    		}

    		if ($$self.$$.dirty & /*tabBar, useAutomaticActivation*/ 18432) {
    			 if (tabBar) {
    				$$invalidate(14, tabBar.useAutomaticActivation = useAutomaticActivation, tabBar);
    			}
    		}

    		if ($$self.$$.dirty & /*tabBar, tabs, activeIndex*/ 16644) {
    			 if (tabBar) {
    				$$invalidate(9, active = tabs[activeIndex]);
    			}
    		}

    		if ($$self.$$.dirty & /*tabBar, previousActiveIndex, activeIndex*/ 147712) {
    			 if (tabBar && previousActiveIndex !== activeIndex) {
    				activateTab(activeIndex);
    			}
    		}

    		if ($$self.$$.dirty & /*tabBar, previousActive, active, tabs*/ 279044) {
    			 if (tabBar && previousActive !== active) {
    				activateTab(tabs.indexOf(active));
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		use,
    		className,
    		tabs,
    		key,
    		element,
    		forwardEvents,
    		activatedHandler,
    		$$props,
    		activeIndex,
    		active,
    		focusOnActivate,
    		useAutomaticActivation,
    		activateTab,
    		scrollIntoView,
    		tabBar,
    		tabScrollerPromiseResolve,
    		tabPromiseResolve,
    		previousActiveIndex,
    		previousActive,
    		uninitializedValue,
    		tabScrollerPromise,
    		tabPromise,
    		getTabScrollerInstancePromise,
    		getTabInstancePromise,
    		updateIndexAfterActivate,
    		$$slots,
    		div_binding,
    		$$scope
    	];
    }

    class TabBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			use: 0,
    			class: 1,
    			tabs: 2,
    			key: 3,
    			focusOnActivate: 10,
    			useAutomaticActivation: 11,
    			activeIndex: 8,
    			active: 9,
    			activateTab: 12,
    			scrollIntoView: 13
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TabBar",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get use() {
    		throw new Error("<TabBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set use(value) {
    		throw new Error("<TabBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get class() {
    		throw new Error("<TabBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<TabBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabs() {
    		throw new Error("<TabBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabs(value) {
    		throw new Error("<TabBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get key() {
    		throw new Error("<TabBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<TabBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get focusOnActivate() {
    		throw new Error("<TabBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set focusOnActivate(value) {
    		throw new Error("<TabBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get useAutomaticActivation() {
    		throw new Error("<TabBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set useAutomaticActivation(value) {
    		throw new Error("<TabBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeIndex() {
    		throw new Error("<TabBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeIndex(value) {
    		throw new Error("<TabBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<TabBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<TabBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activateTab() {
    		return this.$$.ctx[12];
    	}

    	set activateTab(value) {
    		throw new Error("<TabBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrollIntoView() {
    		return this.$$.ctx[13];
    	}

    	set scrollIntoView(value) {
    		throw new Error("<TabBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var interact_min = createCommonjsModule(function (module, exports) {
    /* interact.js 1.8.4 | https://raw.github.com/taye/interact.js/master/LICENSE */
    !function(e){module.exports=e();}(function(){function e(t){var n;return function(e){return n||t(n={exports:{},parent:e},n.exports),n.exports}}var O=e(function(e,t){Object.defineProperty(t,"__esModule",{value:!0}),t.Scope=t.ActionName=void 0;var n=f(k),o=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==p(e)&&"function"!=typeof e)return {default:e};var t=c();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(pt),i=f(It),a=f(Ct),u=f(Ut),s=f(fn),l=f(Tn),r=f(E({}));function c(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return c=function(){return e},e}function f(e){return e&&e.__esModule?e:{default:e}}function p(e){return (p="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function d(e,t){return !t||"object"!==p(t)&&"function"!=typeof t?function(e){if(void 0!==e)return e;throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}(e):t}function v(e,t,n){return (v="undefined"!=typeof Reflect&&Reflect.get?Reflect.get:function(e,t,n){var r=function(e,t){for(;!Object.prototype.hasOwnProperty.call(e,t)&&null!==(e=y(e)););return e}(e,t);if(r){var o=Object.getOwnPropertyDescriptor(r,t);return o.get?o.get.call(n):o.value}})(e,t,n||e)}function y(e){return (y=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function m(e,t){return (m=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function g(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function h(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function b(e,t,n){return t&&h(e.prototype,t),n&&h(e,n),e}function O(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var w,P=o.win,_=o.browser,x=o.raf,S=o.events;(t.ActionName=w)||(t.ActionName=w={});var j=function(){function e(){var t=this;g(this,e),O(this,"id","__interact_scope_".concat(Math.floor(100*Math.random()))),O(this,"listenerMaps",[]),O(this,"browser",_),O(this,"events",S),O(this,"utils",o),O(this,"defaults",o.clone(i.default)),O(this,"Eventable",a.default),O(this,"actions",{names:[],methodDict:{},eventTypes:[]}),O(this,"InteractEvent",l.default),O(this,"Interactable",void 0),O(this,"interactables",new s.default(this)),O(this,"_win",void 0),O(this,"document",void 0),O(this,"window",void 0),O(this,"documents",[]),O(this,"_plugins",{list:[],map:{}}),O(this,"onWindowUnload",function(e){return t.removeDocument(e.target)});var r=this;this.Interactable=function(){function n(){return g(this,n),d(this,y(n).apply(this,arguments))}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&m(e,t);}(n,u["default"]),b(n,[{key:"set",value:function(e){return v(y(n.prototype),"set",this).call(this,e),r.fire("interactable:set",{options:e,interactable:this}),this}},{key:"unset",value:function(){v(y(n.prototype),"unset",this).call(this);for(var e=r.interactions.list.length-1;0<=e;e--){var t=r.interactions.list[e];t.interactable===this&&(t.stop(),r.fire("interactions:destroy",{interaction:t}),t.destroy(),2<r.interactions.list.length&&r.interactions.list.splice(e,1));}r.fire("interactable:unset",{interactable:this});}},{key:"_defaults",get:function(){return r.defaults}}]),n}();}return b(e,[{key:"addListeners",value:function(e,t){this.listenerMaps.push({id:t,map:e});}},{key:"fire",value:function(e,t){for(var n=0;n<this.listenerMaps.length;n++){var r=this.listenerMaps[n].map[e];if(r&&!1===r(t,this,e))return !1}}},{key:"init",value:function(e){return M(this,e)}},{key:"pluginIsInstalled",value:function(e){return this._plugins.map[e.id]||-1!==this._plugins.list.indexOf(e)}},{key:"usePlugin",value:function(e,t){if(this.pluginIsInstalled(e))return this;if(e.id&&(this._plugins.map[e.id]=e),this._plugins.list.push(e),e.install&&e.install(this,t),e.listeners&&e.before){for(var n=0,r=this.listenerMaps.length,o=e.before.reduce(function(e,t){return e[t]=!0,e},{});n<r;n++){if(o[this.listenerMaps[n].id])break}this.listenerMaps.splice(n,0,{id:e.id,map:e.listeners});}else e.listeners&&this.listenerMaps.push({id:e.id,map:e.listeners});return this}},{key:"addDocument",value:function(e,t){if(-1!==this.getDocIndex(e))return !1;var n=P.getWindow(e);t=t?o.extend({},t):{},this.documents.push({doc:e,options:t}),S.documents.push(e),e!==this.document&&S.add(n,"unload",this.onWindowUnload),this.fire("scope:add-document",{doc:e,window:n,scope:this,options:t});}},{key:"removeDocument",value:function(e){var t=this.getDocIndex(e),n=P.getWindow(e),r=this.documents[t].options;S.remove(n,"unload",this.onWindowUnload),this.documents.splice(t,1),S.documents.splice(t,1),this.fire("scope:remove-document",{doc:e,window:n,scope:this,options:r});}},{key:"getDocIndex",value:function(e){for(var t=0;t<this.documents.length;t++)if(this.documents[t].doc===e)return t;return -1}},{key:"getDocOptions",value:function(e){var t=this.getDocIndex(e);return -1===t?null:this.documents[t].options}},{key:"now",value:function(){return (this.window.Date||Date).now()}}]),e}();function M(e,t){return P.init(t),n.default.init(t),_.init(t),x.init(t),S.init(t),e.usePlugin(r.default),e.document=t.document,e.window=t,e}t.Scope=j;}),E=e(function(e,t){Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var P=n(j),u=n(k),f=n(De),_=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==l(e)&&"function"!=typeof e)return {default:e};var t=a();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(J),s=n(g({})),o=n(Qn);O({});function a(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return a=function(){return e},e}function n(e){return e&&e.__esModule?e:{default:e}}function l(e){return (l="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function x(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){if(!(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e)))return;var n=[],r=!0,o=!1,i=void 0;try{for(var a,u=e[Symbol.iterator]();!(r=(a=u.next()).done)&&(n.push(a.value),!t||n.length!==t);r=!0);}catch(e){o=!0,i=e;}finally{try{r||null==u.return||u.return();}finally{if(o)throw i}}return n}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}function c(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function p(e,t){return !t||"object"!==l(t)&&"function"!=typeof t?function(e){if(void 0!==e)return e;throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}(e):t}function d(e){return (d=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function v(e,t){return (v=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}var y=["pointerDown","pointerMove","pointerUp","updatePointer","removePointer","windowBlur"];function m(O,w){return function(e){var t=w.interactions.list,n=_.getPointerType(e),r=x(_.getEventTargets(e),2),o=r[0],i=r[1],a=[];if(/^touch/.test(e.type)){w.prevTouchTime=w.now();for(var u=0;u<e.changedTouches.length;u++){var s=e.changedTouches[u],l={pointer:s,pointerId:_.getPointerId(s),pointerType:n,eventType:e.type,eventTarget:o,curEventTarget:i,scope:w},c=S(l);a.push([l.pointer,l.eventTarget,l.curEventTarget,c]);}}else{var f=!1;if(!P.default.supportsPointerEvent&&/mouse/.test(e.type)){for(var p=0;p<t.length&&!f;p++)f="mouse"!==t[p].pointerType&&t[p].pointerIsDown;f=f||w.now()-w.prevTouchTime<500||0===e.timeStamp;}if(!f){var d={pointer:e,pointerId:_.getPointerId(e),pointerType:n,eventType:e.type,curEventTarget:i,eventTarget:o,scope:w},v=S(d);a.push([d.pointer,d.eventTarget,d.curEventTarget,v]);}}for(var y=0;y<a.length;y++){var m=x(a[y],4),g=m[0],h=m[1],b=m[2];m[3][O](g,e,h,b);}}}function S(e){var t=e.pointerType,n=e.scope,r={interaction:o.default.search(e),searchDetails:e};return n.fire("interactions:find",r),r.interaction||n.interactions.new({pointerType:t})}function r(e,t){var n=e.doc,r=e.scope,o=e.options,i=r.interactions.docEvents,a=f.default[t];for(var u in r.browser.isIOS&&!o.events&&(o.events={passive:!1}),f.default.delegatedEvents)a(n,u,f.default.delegateListener),a(n,u,f.default.delegateUseCapture,!0);for(var s=o&&o.events,l=0;l<i.length;l++){var c=i[l];a(n,c.type,c.listener,s);}}var i={id:"core/interactions",install:function(o){for(var e={},t=0;t<y.length;t++){var n=y[t];e[n]=m(n,o);}var r,i=P.default.pEventTypes;function a(){for(var e=0;e<o.interactions.list.length;e++){var t=o.interactions.list[e];if(t.pointerIsDown&&"touch"===t.pointerType&&!t._interacting)for(var n=function(){var n=t.pointers[r];o.documents.some(function(e){var t=e.doc;return (0, C.nodeContains)(t,n.downTarget)})||t.removePointer(n.pointer,n.event);},r=0;r<t.pointers.length;r++){n();}}}(r=u.default.PointerEvent?[{type:i.down,listener:a},{type:i.down,listener:e.pointerDown},{type:i.move,listener:e.pointerMove},{type:i.up,listener:e.pointerUp},{type:i.cancel,listener:e.pointerUp}]:[{type:"mousedown",listener:e.pointerDown},{type:"mousemove",listener:e.pointerMove},{type:"mouseup",listener:e.pointerUp},{type:"touchstart",listener:a},{type:"touchstart",listener:e.pointerDown},{type:"touchmove",listener:e.pointerMove},{type:"touchend",listener:e.pointerUp},{type:"touchcancel",listener:e.pointerUp}]).push({type:"blur",listener:function(e){for(var t=0;t<o.interactions.list.length;t++){o.interactions.list[t].documentBlur(e);}}}),o.prevTouchTime=0,o.Interaction=function(){function e(){return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),p(this,d(e).apply(this,arguments))}var t,n;return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&v(e,t);}(e,s["default"]),t=e,(n=[{key:"_now",value:function(){return o.now()}},{key:"pointerMoveTolerance",get:function(){return o.interactions.pointerMoveTolerance},set:function(e){o.interactions.pointerMoveTolerance=e;}}])&&c(t.prototype,n),e}(),o.interactions={list:[],new:function(e){e.scopeFire=function(e,t){return o.fire(e,t)};var t=new o.Interaction(e);return o.interactions.list.push(t),t},listeners:e,docEvents:r,pointerMoveTolerance:1};},listeners:{"scope:add-document":function(e){return r(e,"add")},"scope:remove-document":function(e){return r(e,"remove")}},onDocSignal:r,doOnInteractions:m,methodNames:y};t.default=i;}),g=e(function(e,t){function a(e){return (a="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"PointerInfo",{enumerable:!0,get:function(){return u.default}}),t.default=t.Interaction=t._ProxyMethods=t._ProxyValues=void 0;var n,c,r,f,o,p=l(pt),d=l(Tn),u=(n=Hn)&&n.__esModule?n:{default:n},i=O({});function s(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return s=function(){return e},e}function l(e){if(e&&e.__esModule)return e;if(null===e||"object"!==a(e)&&"function"!=typeof e)return {default:e};var t=s();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}return n.default=e,t&&t.set(e,n),n}function v(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function y(e,t,n){return t&&v(e.prototype,t),n&&v(e,n),e}function m(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}t._ProxyValues=c,(r=c||(t._ProxyValues=c={})).interactable="",r.element="",r.prepared="",r.pointerIsDown="",r.pointerWasMoved="",r._proxy="",t._ProxyMethods=f,(o=f||(t._ProxyMethods=f={})).start="",o.move="",o.end="",o.stop="",o.interacting="";var g=0,h=function(){function l(e){var t=this,n=e.pointerType,r=e.scopeFire;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,l),m(this,"interactable",null),m(this,"element",null),m(this,"rect",void 0),m(this,"_rects",void 0),m(this,"edges",void 0),m(this,"_scopeFire",void 0),m(this,"prepared",{name:null,axis:null,edges:null}),m(this,"pointerType",void 0),m(this,"pointers",[]),m(this,"downEvent",null),m(this,"downPointer",{}),m(this,"_latestPointer",{pointer:null,event:null,eventTarget:null}),m(this,"prevEvent",null),m(this,"pointerIsDown",!1),m(this,"pointerWasMoved",!1),m(this,"_interacting",!1),m(this,"_ending",!1),m(this,"_stopped",!0),m(this,"_proxy",null),m(this,"simulation",null),m(this,"doMove",p.warnOnce(function(e){this.move(e);},"The interaction.doMove() method has been renamed to interaction.move()")),m(this,"coords",{start:p.pointer.newCoords(),prev:p.pointer.newCoords(),cur:p.pointer.newCoords(),delta:p.pointer.newCoords(),velocity:p.pointer.newCoords()}),m(this,"_id",g++),this._scopeFire=r,this.pointerType=n;var o=this;this._proxy={};function i(e){Object.defineProperty(t._proxy,e,{get:function(){return o[e]}});}for(var a in c)i(a);function u(e){Object.defineProperty(t._proxy,e,{value:function(){return o[e].apply(o,arguments)}});}for(var s in f)u(s);this._scopeFire("interactions:new",{interaction:this});}return y(l,[{key:"pointerMoveTolerance",get:function(){return 1}}]),y(l,[{key:"pointerDown",value:function(e,t,n){var r=this.updatePointer(e,t,n,!0);this._scopeFire("interactions:down",{pointer:e,event:t,eventTarget:n,pointerIndex:r,type:"down",interaction:this});}},{key:"start",value:function(e,t,n){return !(this.interacting()||!this.pointerIsDown||this.pointers.length<(e.name===i.ActionName.Gesture?2:1)||!t.options[e.name].enabled)&&(p.copyAction(this.prepared,e),this.interactable=t,this.element=n,this.rect=t.getRect(n),this.edges=p.extend({},this.prepared.edges),this._stopped=!1,this._interacting=this._doPhase({interaction:this,event:this.downEvent,phase:d.EventPhase.Start})&&!this._stopped,this._interacting)}},{key:"pointerMove",value:function(e,t,n){this.simulation||this.modifiers&&this.modifiers.endResult||(this.updatePointer(e,t,n,!1),p.pointer.setCoords(this.coords.cur,this.pointers.map(function(e){return e.pointer}),this._now()));var r,o,i=this.coords.cur.page.x===this.coords.prev.page.x&&this.coords.cur.page.y===this.coords.prev.page.y&&this.coords.cur.client.x===this.coords.prev.client.x&&this.coords.cur.client.y===this.coords.prev.client.y;this.pointerIsDown&&!this.pointerWasMoved&&(r=this.coords.cur.client.x-this.coords.start.client.x,o=this.coords.cur.client.y-this.coords.start.client.y,this.pointerWasMoved=p.hypot(r,o)>this.pointerMoveTolerance);var a={pointer:e,pointerIndex:this.getPointerIndex(e),event:t,type:"move",eventTarget:n,dx:r,dy:o,duplicate:i,interaction:this};i||(p.pointer.setCoordDeltas(this.coords.delta,this.coords.prev,this.coords.cur),p.pointer.setCoordVelocity(this.coords.velocity,this.coords.delta)),this._scopeFire("interactions:move",a),i||(this.interacting()&&(a.type=null,this.move(a)),this.pointerWasMoved&&p.pointer.copyCoords(this.coords.prev,this.coords.cur));}},{key:"move",value:function(e){e&&e.event||p.pointer.setZeroCoords(this.coords.delta),(e=p.extend({pointer:this._latestPointer.pointer,event:this._latestPointer.event,eventTarget:this._latestPointer.eventTarget,interaction:this},e||{})).phase=d.EventPhase.Move,this._doPhase(e);}},{key:"pointerUp",value:function(e,t,n,r){var o=this.getPointerIndex(e);-1===o&&(o=this.updatePointer(e,t,n,!1));var i=/cancel$/i.test(t.type)?"cancel":"up";this._scopeFire("interactions:".concat(i),{pointer:e,pointerIndex:o,event:t,eventTarget:n,type:i,curEventTarget:r,interaction:this}),this.simulation||this.end(t),this.pointerIsDown=!1,this.removePointer(e,t);}},{key:"documentBlur",value:function(e){this.end(e),this._scopeFire("interactions:blur",{event:e,type:"blur",interaction:this});}},{key:"end",value:function(e){var t;this._ending=!0,e=e||this._latestPointer.event,this.interacting()&&(t=this._doPhase({event:e,interaction:this,phase:d.EventPhase.End})),!(this._ending=!1)===t&&this.stop();}},{key:"currentAction",value:function(){return this._interacting?this.prepared.name:null}},{key:"interacting",value:function(){return this._interacting}},{key:"stop",value:function(){this._scopeFire("interactions:stop",{interaction:this}),this.interactable=this.element=null,this._interacting=!1,this._stopped=!0,this.prepared.name=this.prevEvent=null;}},{key:"getPointerIndex",value:function(e){var t=p.pointer.getPointerId(e);return "mouse"===this.pointerType||"pen"===this.pointerType?this.pointers.length-1:p.arr.findIndex(this.pointers,function(e){return e.id===t})}},{key:"getPointerInfo",value:function(e){return this.pointers[this.getPointerIndex(e)]}},{key:"updatePointer",value:function(e,t,n,r){var o=p.pointer.getPointerId(e),i=this.getPointerIndex(e),a=this.pointers[i];return r=!1!==r&&(r||/(down|start)$/i.test(t.type)),a?a.pointer=e:(a=new u.default(o,e,t,null,null),i=this.pointers.length,this.pointers.push(a)),r&&(this.pointerIsDown=!0,this.interacting()||(p.pointer.setCoords(this.coords.start,this.pointers.map(function(e){return e.pointer}),this._now()),p.pointer.copyCoords(this.coords.cur,this.coords.start),p.pointer.copyCoords(this.coords.prev,this.coords.start),p.pointer.pointerExtend(this.downPointer,e),this.downEvent=t,a.downTime=this.coords.cur.timeStamp,a.downTarget=n,this.pointerWasMoved=!1)),this._updateLatestPointer(e,t,n),this._scopeFire("interactions:update-pointer",{pointer:e,event:t,eventTarget:n,down:r,pointerInfo:a,pointerIndex:i,interaction:this}),i}},{key:"removePointer",value:function(e,t){var n=this.getPointerIndex(e);if(-1!==n){var r=this.pointers[n];this._scopeFire("interactions:remove-pointer",{pointer:e,event:t,eventTarget:null,pointerIndex:n,pointerInfo:r,interaction:this}),this.pointers.splice(n,1);}}},{key:"_updateLatestPointer",value:function(e,t,n){this._latestPointer.pointer=e,this._latestPointer.event=t,this._latestPointer.eventTarget=n;}},{key:"destroy",value:function(){this._latestPointer.pointer=null,this._latestPointer.event=null,this._latestPointer.eventTarget=null;}},{key:"_createPreparedEvent",value:function(e,t,n,r){var o=this.prepared.name;return new d.default(this,e,o,t,this.element,null,n,r)}},{key:"_fireEvent",value:function(e){this.interactable.fire(e),(!this.prevEvent||e.timeStamp>=this.prevEvent.timeStamp)&&(this.prevEvent=e);}},{key:"_doPhase",value:function(e){var t=e.event,n=e.phase,r=e.preEnd,o=e.type,i=this.rect,a=this.coords.delta;if(i&&n===d.EventPhase.Move){var u=this.edges||this.prepared.edges||{left:!0,right:!0,top:!0,bottom:!0};p.rect.addEdges(u,i,a[this.interactable.options.deltaSource]),i.width=i.right-i.left,i.height=i.bottom-i.top;}if(!1===this._scopeFire("interactions:before-action-".concat(n),e))return !1;var s=e.iEvent=this._createPreparedEvent(t,n,r,o);return this._scopeFire("interactions:action-".concat(n),e),"start"===n&&(this.prevEvent=s),this._fireEvent(s),this._scopeFire("interactions:after-action-".concat(n),e),!0}},{key:"_now",value:function(){return Date.now()}}]),l}(),b=t.Interaction=h;t.default=b;}),k={};Object.defineProperty(k,"__esModule",{value:!0}),k.default=void 0;var n={init:function(e){var t=e;n.document=t.document,n.DocumentFragment=t.DocumentFragment||r,n.SVGElement=t.SVGElement||r,n.SVGSVGElement=t.SVGSVGElement||r,n.SVGElementInstance=t.SVGElementInstance||r,n.Element=t.Element||r,n.HTMLElement=t.HTMLElement||n.Element,n.Event=t.Event,n.Touch=t.Touch||r,n.PointerEvent=t.PointerEvent||t.MSPointerEvent;},document:null,DocumentFragment:null,SVGElement:null,SVGSVGElement:null,SVGElementInstance:null,Element:null,HTMLElement:null,Event:null,Touch:null,PointerEvent:null};function r(){}var t=n;k.default=t;var u={};function o(e,t){for(var n=0;n<t.length;n++){var r=t[n];e.push(r);}return e}function i(e,t){for(var n=0;n<e.length;n++)if(t(e[n],n,e))return n;return -1}Object.defineProperty(u,"__esModule",{value:!0}),u.contains=function(e,t){return -1!==e.indexOf(t)},u.remove=function(e,t){return e.splice(e.indexOf(t),1)},u.merge=o,u.from=function(e){return o([],e)},u.findIndex=i,u.find=function(e,t){return e[i(e,t)]};var a={};Object.defineProperty(a,"__esModule",{value:!0}),a.default=void 0;a.default=function(e){return !(!e||!e.Window)&&e instanceof e.Window};var s={};Object.defineProperty(s,"__esModule",{value:!0}),s.init=p,s.getWindow=d,s.default=void 0;var l,c=(l=a)&&l.__esModule?l:{default:l};var f={realWindow:void 0,window:void 0,getWindow:d,init:p};function p(e){var t=(f.realWindow=e).document.createTextNode("");t.ownerDocument!==e.document&&"function"==typeof e.wrap&&e.wrap(t)===t&&(e=e.wrap(e)),f.window=e;}function d(e){return (0, c.default)(e)?e:(e.ownerDocument||e).defaultView||f.window}"undefined"==typeof window?(f.window=void 0,f.realWindow=void 0):p(window),f.init=p;var v=f;s.default=v;var y={};Object.defineProperty(y,"__esModule",{value:!0}),y.array=y.plainObject=y.element=y.string=y.bool=y.number=y.func=y.object=y.docFrag=y.window=void 0;var m=b(a),h=b(s);function b(e){return e&&e.__esModule?e:{default:e}}function w(e){return (w="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}y.window=function(e){return e===h.default.window||(0, m.default)(e)};y.docFrag=function(e){return P(e)&&11===e.nodeType};var P=function(e){return !!e&&"object"===w(e)};y.object=P;function _(e){return "function"==typeof e}y.func=_;y.number=function(e){return "number"==typeof e};y.bool=function(e){return "boolean"==typeof e};y.string=function(e){return "string"==typeof e};y.element=function(e){if(!e||"object"!==w(e))return !1;var t=h.default.getWindow(e)||h.default.window;return /object|function/.test(w(t.Element))?e instanceof t.Element:1===e.nodeType&&"string"==typeof e.nodeName};y.plainObject=function(e){return P(e)&&!!e.constructor&&/function Object\b/.test(e.constructor.toString())};y.array=function(e){return P(e)&&void 0!==e.length&&_(e.splice)};var j={};function x(e){return (x="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(j,"__esModule",{value:!0}),j.default=void 0;var S=I(k),M=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==x(e)&&"function"!=typeof e)return {default:e};var t=T();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(y),D=I(s);function T(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return T=function(){return e},e}function I(e){return e&&e.__esModule?e:{default:e}}var A={init:function(e){var t=S.default.Element,n=D.default.window.navigator;A.supportsTouch="ontouchstart"in e||M.func(e.DocumentTouch)&&S.default.document instanceof e.DocumentTouch,A.supportsPointerEvent=!1!==n.pointerEnabled&&!!S.default.PointerEvent,A.isIOS=/iP(hone|od|ad)/.test(n.platform),A.isIOS7=/iP(hone|od|ad)/.test(n.platform)&&/OS 7[^\d]/.test(n.appVersion),A.isIe9=/MSIE 9/.test(n.userAgent),A.isOperaMobile="Opera"===n.appName&&A.supportsTouch&&/Presto/.test(n.userAgent),A.prefixedMatchesSelector="matches"in t.prototype?"matches":"webkitMatchesSelector"in t.prototype?"webkitMatchesSelector":"mozMatchesSelector"in t.prototype?"mozMatchesSelector":"oMatchesSelector"in t.prototype?"oMatchesSelector":"msMatchesSelector",A.pEventTypes=A.supportsPointerEvent?S.default.PointerEvent===e.MSPointerEvent?{up:"MSPointerUp",down:"MSPointerDown",over:"mouseover",out:"mouseout",move:"MSPointerMove",cancel:"MSPointerCancel"}:{up:"pointerup",down:"pointerdown",over:"pointerover",out:"pointerout",move:"pointermove",cancel:"pointercancel"}:null,A.wheelEvent="onmousewheel"in S.default.document?"mousewheel":"wheel";},supportsTouch:null,supportsPointerEvent:null,isIOS7:null,isIOS:null,isIe9:null,isOperaMobile:null,prefixedMatchesSelector:null,pEventTypes:null,wheelEvent:null};var z=A;j.default=z;var C={};function R(e){return (R="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(C,"__esModule",{value:!0}),C.nodeContains=function(e,t){for(;t;){if(t===e)return !0;t=t.parentNode;}return !1},C.closest=function(e,t){for(;N.element(e);){if(G(e,t))return e;e=V(e);}return null},C.parentNode=V,C.matchesSelector=G,C.indexOfDeepestElement=function(e){var t,n,r=[],o=e[0],i=o?0:-1;for(t=1;t<e.length;t++){var a=e[t];if(a&&a!==o)if(o){if(a.parentNode!==a.ownerDocument)if(o.parentNode!==a.ownerDocument)if(a.parentNode!==o.parentNode){if(!r.length)for(var u=o,s=void 0;(s=U(u))&&s!==u.ownerDocument;)r.unshift(u),u=s;var l=void 0;if(o instanceof X.default.HTMLElement&&a instanceof X.default.SVGElement&&!(a instanceof X.default.SVGSVGElement)){if(a===o.parentNode)continue;l=a.ownerSVGElement;}else l=a;for(var c=[];l.parentNode!==l.ownerDocument;)c.unshift(l),l=U(l);for(n=0;c[n]&&c[n]===r[n];)n++;for(var f=[c[n-1],c[n],r[n]],p=f[0].lastChild;p;){if(p===f[1]){o=a,i=t,r=c;break}if(p===f[2])break;p=p.previousSibling;}}else{var d=parseInt((0, Y.getWindow)(o).getComputedStyle(o).zIndex,10)||0,v=parseInt((0, Y.getWindow)(a).getComputedStyle(a).zIndex,10)||0;d<=v&&(o=a,i=t);}else o=a,i=t;}else o=a,i=t;}return i},C.matchesUpTo=function(e,t,n){for(;N.element(e);){if(G(e,t))return !0;if((e=V(e))===n)return G(e,t)}return !1},C.getActualElement=function(e){return e instanceof X.default.SVGElementInstance?e.correspondingUseElement:e},C.getScrollXY=B,C.getElementClientRect=H,C.getElementRect=function(e){var t=H(e);if(!W.default.isIOS7&&t){var n=B(Y.default.getWindow(e));t.left+=n.x,t.right+=n.x,t.top+=n.y,t.bottom+=n.y;}return t},C.getPath=function(e){var t=[];for(;e;)t.push(e),e=V(e);return t},C.trySelector=function(e){return !!N.string(e)&&(X.default.document.querySelector(e),!0)};var W=q(j),X=q(k),N=L(y),Y=L(s);function F(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return F=function(){return e},e}function L(e){if(e&&e.__esModule)return e;if(null===e||"object"!==R(e)&&"function"!=typeof e)return {default:e};var t=F();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}return n.default=e,t&&t.set(e,n),n}function q(e){return e&&e.__esModule?e:{default:e}}function V(e){var t=e.parentNode;if(N.docFrag(t)){for(;(t=t.host)&&N.docFrag(t););return t}return t}function G(e,t){return Y.default.window!==Y.default.realWindow&&(t=t.replace(/\/deep\//g," ")),e[W.default.prefixedMatchesSelector](t)}var U=function(e){return e.parentNode?e.parentNode:e.host};function B(e){return {x:(e=e||Y.default.window).scrollX||e.document.documentElement.scrollLeft,y:e.scrollY||e.document.documentElement.scrollTop}}function H(e){var t=e instanceof X.default.SVGElement?e.getBoundingClientRect():e.getClientRects()[0];return t&&{left:t.left,right:t.right,top:t.top,bottom:t.bottom,width:t.width||t.right-t.left,height:t.height||t.bottom-t.top}}var K={};Object.defineProperty(K,"__esModule",{value:!0}),K.default=void 0;K.default=function(e,t){return Math.sqrt(e*e+t*t)};var $={};function Q(e,t){for(var n in t){var r=Q.prefixedPropREs,o=!1;for(var i in r)if(0===n.indexOf(i)&&r[i].test(n)){o=!0;break}o||"function"==typeof t[n]||(e[n]=t[n]);}return e}Object.defineProperty($,"__esModule",{value:!0}),$.default=void 0,Q.prefixedPropREs={webkit:/(Movement[XY]|Radius[XY]|RotationAngle|Force)$/,moz:/(Pressure)$/};var Z=Q;$.default=Z;var J={};function ee(e){return (ee="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(J,"__esModule",{value:!0}),J.copyCoords=function(e,t){e.page=e.page||{},e.page.x=t.page.x,e.page.y=t.page.y,e.client=e.client||{},e.client.x=t.client.x,e.client.y=t.client.y,e.timeStamp=t.timeStamp;},J.setCoordDeltas=function(e,t,n){e.page.x=n.page.x-t.page.x,e.page.y=n.page.y-t.page.y,e.client.x=n.client.x-t.client.x,e.client.y=n.client.y-t.client.y,e.timeStamp=n.timeStamp-t.timeStamp;},J.setCoordVelocity=function(e,t){var n=Math.max(t.timeStamp/1e3,.001);e.page.x=t.page.x/n,e.page.y=t.page.y/n,e.client.x=t.client.x/n,e.client.y=t.client.y/n,e.timeStamp=n;},J.setZeroCoords=function(e){e.page.x=0,e.page.y=0,e.client.x=0,e.client.y=0;},J.isNativePointer=ce,J.getXY=fe,J.getPageXY=pe,J.getClientXY=de,J.getPointerId=function(e){return ie.number(e.pointerId)?e.pointerId:e.identifier},J.setCoords=function(e,t,n){var r=1<t.length?ye(t):t[0],o={};pe(r,o),e.page.x=o.x,e.page.y=o.y,de(r,o),e.client.x=o.x,e.client.y=o.y,e.timeStamp=n;},J.getTouchPair=ve,J.pointerAverage=ye,J.touchBBox=function(e){if(!(e.length||e.touches&&1<e.touches.length))return null;var t=ve(e),n=Math.min(t[0].pageX,t[1].pageX),r=Math.min(t[0].pageY,t[1].pageY),o=Math.max(t[0].pageX,t[1].pageX),i=Math.max(t[0].pageY,t[1].pageY);return {x:n,y:r,left:n,top:r,right:o,bottom:i,width:o-n,height:i-r}},J.touchDistance=function(e,t){var n=t+"X",r=t+"Y",o=ve(e),i=o[0][n]-o[1][n],a=o[0][r]-o[1][r];return (0, oe.default)(i,a)},J.touchAngle=function(e,t){var n=t+"X",r=t+"Y",o=ve(e),i=o[1][n]-o[0][n],a=o[1][r]-o[0][r];return 180*Math.atan2(a,i)/Math.PI},J.getPointerType=function(e){return ie.string(e.pointerType)?e.pointerType:ie.number(e.pointerType)?[void 0,void 0,"touch","pen","mouse"][e.pointerType]:/touch/.test(e.type)||e instanceof ne.default.Touch?"touch":"mouse"},J.getEventTargets=function(e){var t=ie.func(e.composedPath)?e.composedPath():e.path;return [re.getActualElement(t?t[0]:e.target),re.getActualElement(e.currentTarget)]},J.newCoords=function(){return {page:{x:0,y:0},client:{x:0,y:0},timeStamp:0}},J.coordsToEvent=function(e){return {coords:e,get page(){return this.coords.page},get client(){return this.coords.client},get timeStamp(){return this.coords.timeStamp},get pageX(){return this.coords.page.x},get pageY(){return this.coords.page.y},get clientX(){return this.coords.client.x},get clientY(){return this.coords.client.y},get pointerId(){return this.coords.pointerId},get target(){return this.coords.target},get type(){return this.coords.type},get pointerType(){return this.coords.pointerType},get buttons(){return this.coords.buttons}}},Object.defineProperty(J,"pointerExtend",{enumerable:!0,get:function(){return ae.default}});var te=le(j),ne=le(k),re=se(C),oe=le(K),ie=se(y),ae=le($);function ue(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return ue=function(){return e},e}function se(e){if(e&&e.__esModule)return e;if(null===e||"object"!==ee(e)&&"function"!=typeof e)return {default:e};var t=ue();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}return n.default=e,t&&t.set(e,n),n}function le(e){return e&&e.__esModule?e:{default:e}}function ce(e){return e instanceof ne.default.Event||e instanceof ne.default.Touch}function fe(e,t,n){return (n=n||{}).x=t[(e=e||"page")+"X"],n.y=t[e+"Y"],n}function pe(e,t){return t=t||{x:0,y:0},te.default.isOperaMobile&&ce(e)?(fe("screen",e,t),t.x+=window.scrollX,t.y+=window.scrollY):fe("page",e,t),t}function de(e,t){return t=t||{},te.default.isOperaMobile&&ce(e)?fe("screen",e,t):fe("client",e,t),t}function ve(e){var t=[];return ie.array(e)?(t[0]=e[0],t[1]=e[1]):"touchend"===e.type?1===e.touches.length?(t[0]=e.touches[0],t[1]=e.changedTouches[0]):0===e.touches.length&&(t[0]=e.changedTouches[0],t[1]=e.changedTouches[1]):(t[0]=e.touches[0],t[1]=e.touches[1]),t}function ye(e){for(var t={pageX:0,pageY:0,clientX:0,clientY:0,screenX:0,screenY:0},n=0;n<e.length;n++){var r=e[n];for(var o in t)t[o]+=r[o];}for(var i in t)t[i]/=e.length;return t}var me={};Object.defineProperty(me,"__esModule",{value:!0}),me.default=function(e,t){for(var n in t)e[n]=t[n];return e};var ge={};function he(e){return (he="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(ge,"__esModule",{value:!0}),ge.getStringOptionResult=_e,ge.resolveRectLike=function(e,t,n,r){var o=e;we.string(o)?o=_e(o,t,n):we.func(o)&&(o=o.apply(void 0,function(e){return function(e){if(Array.isArray(e)){for(var t=0,n=new Array(e.length);t<e.length;t++)n[t]=e[t];return n}}(e)||function(e){if(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e))return Array.from(e)}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance")}()}(r)));we.element(o)&&(o=(0, C.getElementRect)(o));return o},ge.rectToXY=function(e){return e&&{x:"x"in e?e.x:e.left,y:"y"in e?e.y:e.top}},ge.xywhToTlbr=function(e){!e||"left"in e&&"top"in e||((e=(0, Oe.default)({},e)).left=e.x||0,e.top=e.y||0,e.right=e.right||e.left+e.width,e.bottom=e.bottom||e.top+e.height);return e},ge.tlbrToXywh=function(e){!e||"x"in e&&"y"in e||((e=(0, Oe.default)({},e)).x=e.left||0,e.y=e.top||0,e.width=e.width||e.right||0-e.x,e.height=e.height||e.bottom||0-e.y);return e},ge.addEdges=function(e,t,n){e.left&&(t.left+=n.x);e.right&&(t.right+=n.x);e.top&&(t.top+=n.y);e.bottom&&(t.bottom+=n.y);t.width=t.right-t.left,t.height=t.bottom-t.top;};var be,Oe=(be=me)&&be.__esModule?be:{default:be},we=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==he(e)&&"function"!=typeof e)return {default:e};var t=Pe();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(y);function Pe(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return Pe=function(){return e},e}function _e(e,t,n){return "parent"===e?(0, C.parentNode)(n):"self"===e?t.getRect(n):(0, C.closest)(n,e)}var xe={};function Se(e){return (Se="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(xe,"__esModule",{value:!0}),xe.default=function e(t){var n={};for(var r in t){var o=t[r];Me.plainObject(o)?n[r]=e(o):Me.array(o)?n[r]=je.from(o):n[r]=o;}return n};var je=ke(u),Me=ke(y);function Ee(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return Ee=function(){return e},e}function ke(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Se(e)&&"function"!=typeof e)return {default:e};var t=Ee();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}return n.default=e,t&&t.set(e,n),n}var De={};function Te(e){return (Te="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(De,"__esModule",{value:!0}),De.default=De.FakeEvent=void 0;var Ie,Ae=Xe(C),ze=Xe(y),Ce=(Ie=$)&&Ie.__esModule?Ie:{default:Ie},Re=Xe(J);function We(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return We=function(){return e},e}function Xe(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Te(e)&&"function"!=typeof e)return {default:e};var t=We();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}return n.default=e,t&&t.set(e,n),n}function Ne(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function Ye(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){if(!(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e)))return;var n=[],r=!0,o=!1,i=void 0;try{for(var a,u=e[Symbol.iterator]();!(r=(a=u.next()).done)&&(n.push(a.value),!t||n.length!==t);r=!0);}catch(e){o=!0,i=e;}finally{try{r||null==u.return||u.return();}finally{if(o)throw i}}return n}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}var Fe=[],Le=[],qe={},Ve=[];function Ge(e,t,n,r){var o=Ke(r),i=Fe.indexOf(e),a=Le[i];a||(a={events:{},typeCount:0},i=Fe.push(e)-1,Le.push(a)),a.events[t]||(a.events[t]=[],a.typeCount++),e.removeEventListener&&!(0, u.contains)(a.events[t],n)&&(e.addEventListener(t,n,Qe.supportsOptions?o:!!o.capture),a.events[t].push(n));}function Ue(e,t,n,r){var o=Ke(r),i=Fe.indexOf(e),a=Le[i];if(a&&a.events)if("all"!==t){if(a.events[t]){var u=a.events[t].length;if("all"===n){for(var s=0;s<u;s++)Ue(e,t,a.events[t][s],o);return}for(var l=0;l<u;l++)if(e.removeEventListener&&a.events[t][l]===n){e.removeEventListener(t,n,Qe.supportsOptions?o:!!o.capture),a.events[t].splice(l,1);break}a.events[t]&&0===a.events[t].length&&(a.events[t]=null,a.typeCount--);}a.typeCount||(Le.splice(i,1),Fe.splice(i,1));}else for(t in a.events)a.events.hasOwnProperty(t)&&Ue(e,t,"all");}function Be(e,t){for(var n=Ke(t),r=new $e(e),o=qe[e.type],i=Ye(Re.getEventTargets(e),1)[0],a=i;ze.element(a);){for(var u=0;u<o.selectors.length;u++){var s=o.selectors[u],l=o.contexts[u];if(Ae.matchesSelector(a,s)&&Ae.nodeContains(l,i)&&Ae.nodeContains(l,a)){var c=o.listeners[u];r.currentTarget=a;for(var f=0;f<c.length;f++){var p=Ye(c[f],3),d=p[0],v=p[1],y=p[2];v===!!n.capture&&y===n.passive&&d(r);}}}a=Ae.parentNode(a);}}function He(e){return Be.call(this,e,!0)}function Ke(e){return ze.object(e)?e:{capture:e}}var $e=function(){function o(e){var t,n,r;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,o),this.originalEvent=e,r=void 0,(n="currentTarget")in(t=this)?Object.defineProperty(t,n,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[n]=r,(0, Ce.default)(this,e);}var e,t;return e=o,(t=[{key:"preventOriginalDefault",value:function(){this.originalEvent.preventDefault();}},{key:"stopPropagation",value:function(){this.originalEvent.stopPropagation();}},{key:"stopImmediatePropagation",value:function(){this.originalEvent.stopImmediatePropagation();}}])&&Ne(e.prototype,t),o}();De.FakeEvent=$e;var Qe={add:Ge,remove:Ue,addDelegate:function(e,t,n,r,o){var i=Ke(o);if(!qe[n]){qe[n]={contexts:[],listeners:[],selectors:[]};for(var a=0;a<Ve.length;a++){var u=Ve[a];Ge(u,n,Be),Ge(u,n,He,!0);}}var s,l=qe[n];for(s=l.selectors.length-1;0<=s&&(l.selectors[s]!==e||l.contexts[s]!==t);s--);-1===s&&(s=l.selectors.length,l.selectors.push(e),l.contexts.push(t),l.listeners.push([])),l.listeners[s].push([r,!!i.capture,i.passive]);},removeDelegate:function(e,t,n,r,o){var i,a=Ke(o),u=qe[n],s=!1;if(u)for(i=u.selectors.length-1;0<=i;i--)if(u.selectors[i]===e&&u.contexts[i]===t){for(var l=u.listeners[i],c=l.length-1;0<=c;c--){var f=Ye(l[c],3),p=f[0],d=f[1],v=f[2];if(p===r&&d===!!a.capture&&v===a.passive){l.splice(c,1),l.length||(u.selectors.splice(i,1),u.contexts.splice(i,1),u.listeners.splice(i,1),Ue(t,n,Be),Ue(t,n,He,!0),u.selectors.length||(qe[n]=null)),s=!0;break}}if(s)break}},delegateListener:Be,delegateUseCapture:He,delegatedEvents:qe,documents:Ve,supportsOptions:!1,supportsPassive:!1,_elements:Fe,_targets:Le,init:function(e){e.document.createElement("div").addEventListener("test",null,{get capture(){return Qe.supportsOptions=!0},get passive(){return Qe.supportsPassive=!0}});}},Ze=Qe;De.default=Ze;var Je={};Object.defineProperty(Je,"__esModule",{value:!0}),Je.default=function(e,t,n){var r=e.options[n],o=r&&r.origin||e.options.origin,i=(0, ge.resolveRectLike)(o,e,t,[e&&t]);return (0, ge.rectToXY)(i)||{x:0,y:0}};var et={};function tt(e){return (tt="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(et,"__esModule",{value:!0}),et.default=function n(t,r,o){o=o||{};ot.string(t)&&-1!==t.search(" ")&&(t=at(t));if(ot.array(t))return t.reduce(function(e,t){return (0, rt.default)(e,n(t,r,o))},o);ot.object(t)&&(r=t,t="");if(ot.func(r))o[t]=o[t]||[],o[t].push(r);else if(ot.array(r))for(var e=0;e<r.length;e++){var i=r[e];n(t,i,o);}else if(ot.object(r))for(var a in r){var u=at(a).map(function(e){return "".concat(t).concat(e)});n(u,r[a],o);}return o};var nt,rt=(nt=me)&&nt.__esModule?nt:{default:nt},ot=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==tt(e)&&"function"!=typeof e)return {default:e};var t=it();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(y);function it(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return it=function(){return e},e}function at(e){return e.trim().split(/ +/)}var ut={};Object.defineProperty(ut,"__esModule",{value:!0}),ut.default=void 0;var st,lt,ct=0;var ft={request:function(e){return st(e)},cancel:function(e){return lt(e)},init:function(e){if(st=e.requestAnimationFrame,lt=e.cancelAnimationFrame,!st)for(var t=["ms","moz","webkit","o"],n=0;n<t.length;n++){var r=t[n];st=e["".concat(r,"RequestAnimationFrame")],lt=e["".concat(r,"CancelAnimationFrame")]||e["".concat(r,"CancelRequestAnimationFrame")];}st||(st=function(e){var t=Date.now(),n=Math.max(0,16-(t-ct)),r=setTimeout(function(){e(t+n);},n);return ct=t+n,r},lt=function(e){return clearTimeout(e)});}};ut.default=ft;var pt={};function dt(e){return (dt="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(pt,"__esModule",{value:!0}),pt.warnOnce=function(e,t){var n=!1;return function(){return n||(bt.default.window.console.warn(t),n=!0),e.apply(this,arguments)}},pt._getQBezierValue=Tt,pt.getQuadraticCurvePoint=function(e,t,n,r,o,i,a){return {x:Tt(a,e,n,o),y:Tt(a,t,r,i)}},pt.easeOutQuad=function(e,t,n,r){return -n*(e/=r)*(e-2)+t},pt.copyAction=function(e,t){return e.name=t.name,e.axis=t.axis,e.edges=t.edges,e},Object.defineProperty(pt,"win",{enumerable:!0,get:function(){return bt.default}}),Object.defineProperty(pt,"browser",{enumerable:!0,get:function(){return Ot.default}}),Object.defineProperty(pt,"clone",{enumerable:!0,get:function(){return wt.default}}),Object.defineProperty(pt,"events",{enumerable:!0,get:function(){return Pt.default}}),Object.defineProperty(pt,"extend",{enumerable:!0,get:function(){return _t.default}}),Object.defineProperty(pt,"getOriginXY",{enumerable:!0,get:function(){return xt.default}}),Object.defineProperty(pt,"hypot",{enumerable:!0,get:function(){return St.default}}),Object.defineProperty(pt,"normalizeListeners",{enumerable:!0,get:function(){return jt.default}}),Object.defineProperty(pt,"raf",{enumerable:!0,get:function(){return Mt.default}}),pt.rect=pt.pointer=pt.is=pt.dom=pt.arr=void 0;var vt=Dt(u);pt.arr=vt;var yt=Dt(C);pt.dom=yt;var mt=Dt(y);pt.is=mt;var gt=Dt(J);pt.pointer=gt;var ht=Dt(ge);pt.rect=ht;var bt=Et(s),Ot=Et(j),wt=Et(xe),Pt=Et(De),_t=Et(me),xt=Et(Je),St=Et(K),jt=Et(et),Mt=Et(ut);function Et(e){return e&&e.__esModule?e:{default:e}}function kt(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return kt=function(){return e},e}function Dt(e){if(e&&e.__esModule)return e;if(null===e||"object"!==dt(e)&&"function"!=typeof e)return {default:e};var t=kt();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}return n.default=e,t&&t.set(e,n),n}function Tt(e,t,n,r){var o=1-e;return o*o*t+2*o*e*n+e*e*r}var It={};Object.defineProperty(It,"__esModule",{value:!0}),It.default=It.defaults=void 0;var At={base:{preventDefault:"auto",deltaSource:"page"},perAction:{enabled:!1,origin:{x:0,y:0}},actions:{}},zt=It.defaults=At;It.default=zt;var Ct={};function Rt(e){return (Rt="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(Ct,"__esModule",{value:!0}),Ct.default=void 0;var Wt=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Rt(e)&&"function"!=typeof e)return {default:e};var t=Ft();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(u),Xt=Yt(me),Nt=Yt(et);function Yt(e){return e&&e.__esModule?e:{default:e}}function Ft(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return Ft=function(){return e},e}function Lt(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function qt(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function Vt(e,t){for(var n=0;n<t.length;n++){var r=t[n];if(e.immediatePropagationStopped)break;r(e);}}var Gt=function(){function t(e){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t),qt(this,"options",void 0),qt(this,"types",{}),qt(this,"propagationStopped",!1),qt(this,"immediatePropagationStopped",!1),qt(this,"global",void 0),this.options=(0, Xt.default)({},e||{});}var e,n;return e=t,(n=[{key:"fire",value:function(e){var t,n=this.global;(t=this.types[e.type])&&Vt(e,t),!e.propagationStopped&&n&&(t=n[e.type])&&Vt(e,t);}},{key:"on",value:function(e,t){var n=(0, Nt.default)(e,t);for(e in n)this.types[e]=Wt.merge(this.types[e]||[],n[e]);}},{key:"off",value:function(e,t){var n=(0, Nt.default)(e,t);for(e in n){var r=this.types[e];if(r&&r.length)for(var o=0;o<n[e].length;o++){var i=n[e][o],a=r.indexOf(i);-1!==a&&r.splice(a,1);}}}},{key:"getRect",value:function(){return null}}])&&Lt(e.prototype,n),t}();Ct.default=Gt;var Ut={};function Bt(e){return (Bt="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(Ut,"__esModule",{value:!0}),Ut.default=Ut.Interactable=void 0;var Ht=on(u),Kt=nn(j),$t=nn(xe),Qt=nn(De),Zt=nn(me),Jt=on(y),en=nn(et),tn=nn(Ct);function nn(e){return e&&e.__esModule?e:{default:e}}function rn(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return rn=function(){return e},e}function on(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Bt(e)&&"function"!=typeof e)return {default:e};var t=rn();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}return n.default=e,t&&t.set(e,n),n}function an(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function un(e,t,n){return t&&an(e.prototype,t),n&&an(e,n),e}function sn(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var ln=function(){function r(e,t,n){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,r),sn(this,"options",void 0),sn(this,"_actions",void 0),sn(this,"target",void 0),sn(this,"events",new tn.default),sn(this,"_context",void 0),sn(this,"_win",void 0),sn(this,"_doc",void 0),this._actions=t.actions,this.target=e,this._context=t.context||n,this._win=(0, s.getWindow)((0, C.trySelector)(e)?this._context:e),this._doc=this._win.document,this.set(t);}return un(r,[{key:"_defaults",get:function(){return {base:{},perAction:{},actions:{}}}}]),un(r,[{key:"setOnEvents",value:function(e,t){return Jt.func(t.onstart)&&this.on("".concat(e,"start"),t.onstart),Jt.func(t.onmove)&&this.on("".concat(e,"move"),t.onmove),Jt.func(t.onend)&&this.on("".concat(e,"end"),t.onend),Jt.func(t.oninertiastart)&&this.on("".concat(e,"inertiastart"),t.oninertiastart),this}},{key:"updatePerActionListeners",value:function(e,t,n){(Jt.array(t)||Jt.object(t))&&this.off(e,t),(Jt.array(n)||Jt.object(n))&&this.on(e,n);}},{key:"setPerAction",value:function(e,t){var n=this._defaults;for(var r in t){var o=r,i=this.options[e],a=t[o];"listeners"===o&&this.updatePerActionListeners(e,i.listeners,a),Jt.array(a)?i[o]=Ht.from(a):Jt.plainObject(a)?(i[o]=(0, Zt.default)(i[o]||{},(0, $t.default)(a)),Jt.object(n.perAction[o])&&"enabled"in n.perAction[o]&&(i[o].enabled=!1!==a.enabled)):Jt.bool(a)&&Jt.object(n.perAction[o])?i[o].enabled=a:i[o]=a;}}},{key:"getRect",value:function(e){return e=e||(Jt.element(this.target)?this.target:null),Jt.string(this.target)&&(e=e||this._context.querySelector(this.target)),(0, C.getElementRect)(e)}},{key:"rectChecker",value:function(e){return Jt.func(e)?(this.getRect=e,this):null===e?(delete this.getRect,this):this.getRect}},{key:"_backCompatOption",value:function(e,t){if((0, C.trySelector)(t)||Jt.object(t)){this.options[e]=t;for(var n=0;n<this._actions.names.length;n++){var r=this._actions.names[n];this.options[r][e]=t;}return this}return this.options[e]}},{key:"origin",value:function(e){return this._backCompatOption("origin",e)}},{key:"deltaSource",value:function(e){return "page"===e||"client"===e?(this.options.deltaSource=e,this):this.options.deltaSource}},{key:"context",value:function(){return this._context}},{key:"inContext",value:function(e){return this._context===e.ownerDocument||(0, C.nodeContains)(this._context,e)}},{key:"testIgnoreAllow",value:function(e,t,n){return !this.testIgnore(e.ignoreFrom,t,n)&&this.testAllow(e.allowFrom,t,n)}},{key:"testAllow",value:function(e,t,n){return !e||!!Jt.element(n)&&(Jt.string(e)?(0, C.matchesUpTo)(n,e,t):!!Jt.element(e)&&(0, C.nodeContains)(e,n))}},{key:"testIgnore",value:function(e,t,n){return !(!e||!Jt.element(n))&&(Jt.string(e)?(0, C.matchesUpTo)(n,e,t):!!Jt.element(e)&&(0, C.nodeContains)(e,n))}},{key:"fire",value:function(e){return this.events.fire(e),this}},{key:"_onOff",value:function(e,t,n,r){Jt.object(t)&&!Jt.array(t)&&(r=n,n=null);var o="on"===e?"add":"remove",i=(0, en.default)(t,n);for(var a in i){"wheel"===a&&(a=Kt.default.wheelEvent);for(var u=0;u<i[a].length;u++){var s=i[a][u];Ht.contains(this._actions.eventTypes,a)?this.events[e](a,s):Jt.string(this.target)?Qt.default["".concat(o,"Delegate")](this.target,this._context,a,s,r):Qt.default[o](this.target,a,s,r);}}return this}},{key:"on",value:function(e,t,n){return this._onOff("on",e,t,n)}},{key:"off",value:function(e,t,n){return this._onOff("off",e,t,n)}},{key:"set",value:function(e){var t=this._defaults;for(var n in Jt.object(e)||(e={}),this.options=(0, $t.default)(t.base),this._actions.methodDict){var r=n,o=this._actions.methodDict[r];this.options[r]={},this.setPerAction(r,(0, Zt.default)((0, Zt.default)({},t.perAction),t.actions[r])),this[o](e[r]);}for(var i in e)Jt.func(this[i])&&this[i](e[i]);return this}},{key:"unset",value:function(){if(Qt.default.remove(this.target,"all"),Jt.string(this.target))for(var e in Qt.default.delegatedEvents){var t=Qt.default.delegatedEvents[e];t.selectors[0]===this.target&&t.contexts[0]===this._context&&(t.selectors.splice(0,1),t.contexts.splice(0,1),t.listeners.splice(0,1)),Qt.default.remove(this._context,e,Qt.default.delegateListener),Qt.default.remove(this._context,e,Qt.default.delegateUseCapture,!0);}else Qt.default.remove(this.target,"all");}}]),r}(),cn=Ut.Interactable=ln;Ut.default=cn;var fn={};function pn(e){return (pn="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(fn,"__esModule",{value:!0}),fn.default=void 0;var dn,vn=bn(u),yn=bn(C),mn=(dn=me)&&dn.__esModule?dn:{default:dn},gn=bn(y);function hn(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return hn=function(){return e},e}function bn(e){if(e&&e.__esModule)return e;if(null===e||"object"!==pn(e)&&"function"!=typeof e)return {default:e};var t=hn();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}return n.default=e,t&&t.set(e,n),n}function On(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function wn(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var Pn=function(){function t(e){var a=this;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t),this.scope=e,wn(this,"list",[]),wn(this,"selectorMap",{}),e.addListeners({"interactable:unset":function(e){var t=e.interactable,n=t.target,r=t._context,o=gn.string(n)?a.selectorMap[n]:n[a.scope.id],i=o.findIndex(function(e){return e.context===r});o[i]&&(o[i].context=null,o[i].interactable=null),o.splice(i,1);}});}var e,n;return e=t,(n=[{key:"new",value:function(e,t){t=(0, mn.default)(t||{},{actions:this.scope.actions});var n=new this.scope.Interactable(e,t,this.scope.document),r={context:n._context,interactable:n};return this.scope.addDocument(n._doc),this.list.push(n),gn.string(e)?(this.selectorMap[e]||(this.selectorMap[e]=[]),this.selectorMap[e].push(r)):(n.target[this.scope.id]||Object.defineProperty(e,this.scope.id,{value:[],configurable:!0}),e[this.scope.id].push(r)),this.scope.fire("interactable:new",{target:e,options:t,interactable:n,win:this.scope._win}),n}},{key:"get",value:function(t,e){var n=e&&e.context||this.scope.document,r=gn.string(t),o=r?this.selectorMap[t]:t[this.scope.id];if(!o)return null;var i=vn.find(o,function(e){return e.context===n&&(r||e.interactable.inContext(t))});return i&&i.interactable}},{key:"forEachMatch",value:function(e,t){for(var n=0;n<this.list.length;n++){var r=this.list[n],o=void 0;if((gn.string(r.target)?gn.element(e)&&yn.matchesSelector(e,r.target):e===r.target)&&r.inContext(e)&&(o=t(r)),void 0!==o)return o}}}])&&On(e.prototype,n),t}();fn.default=Pn;var _n,xn,Sn={};function jn(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function Mn(e,t,n){return t&&jn(e.prototype,t),n&&jn(e,n),e}function En(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}Object.defineProperty(Sn,"__esModule",{value:!0}),Sn.default=Sn.BaseEvent=Sn.EventPhase=void 0,Sn.EventPhase=_n,(xn=_n||(Sn.EventPhase=_n={})).Start="start",xn.Move="move",xn.End="end",xn._NONE="";var kn=function(){function t(e){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t),En(this,"type",void 0),En(this,"target",void 0),En(this,"currentTarget",void 0),En(this,"interactable",void 0),En(this,"_interaction",void 0),En(this,"timeStamp",void 0),En(this,"immediatePropagationStopped",!1),En(this,"propagationStopped",!1),this._interaction=e;}return Mn(t,[{key:"interaction",get:function(){return this._interaction._proxy}}]),Mn(t,[{key:"preventDefault",value:function(){}},{key:"stopPropagation",value:function(){this.propagationStopped=!0;}},{key:"stopImmediatePropagation",value:function(){this.immediatePropagationStopped=this.propagationStopped=!0;}}]),t}(),Dn=Sn.BaseEvent=kn;Sn.default=Dn;var Tn={};Object.defineProperty(Tn,"__esModule",{value:!0}),Tn.default=Tn.InteractEvent=Tn.EventPhase=void 0;var In,An,zn=Nn(me),Cn=Nn(Je),Rn=Nn(K),Wn=Nn(Sn),Xn=Nn(It);function Nn(e){return e&&e.__esModule?e:{default:e}}function Yn(e){return (Yn="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function Fn(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function Ln(e){return (Ln=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function qn(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function Vn(e,t){return (Vn=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function Gn(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}Tn.EventPhase=In,(An=In||(Tn.EventPhase=In={})).Start="start",An.Move="move",An.End="end",An._NONE="";var Un=function(){function h(e,t,n,r,o,i,a,u){var s,l,c;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,h),l=this,s=!(c=Ln(h).call(this,e))||"object"!==Yn(c)&&"function"!=typeof c?qn(l):c,Gn(qn(s),"target",void 0),Gn(qn(s),"currentTarget",void 0),Gn(qn(s),"relatedTarget",void 0),Gn(qn(s),"screenX",void 0),Gn(qn(s),"screenY",void 0),Gn(qn(s),"button",void 0),Gn(qn(s),"buttons",void 0),Gn(qn(s),"ctrlKey",void 0),Gn(qn(s),"shiftKey",void 0),Gn(qn(s),"altKey",void 0),Gn(qn(s),"metaKey",void 0),Gn(qn(s),"page",void 0),Gn(qn(s),"client",void 0),Gn(qn(s),"delta",void 0),Gn(qn(s),"rect",void 0),Gn(qn(s),"x0",void 0),Gn(qn(s),"y0",void 0),Gn(qn(s),"t0",void 0),Gn(qn(s),"dt",void 0),Gn(qn(s),"duration",void 0),Gn(qn(s),"clientX0",void 0),Gn(qn(s),"clientY0",void 0),Gn(qn(s),"velocity",void 0),Gn(qn(s),"speed",void 0),Gn(qn(s),"swipe",void 0),Gn(qn(s),"timeStamp",void 0),Gn(qn(s),"dragEnter",void 0),Gn(qn(s),"dragLeave",void 0),Gn(qn(s),"axes",void 0),Gn(qn(s),"preEnd",void 0),o=o||e.element;var f=e.interactable,p=(f&&f.options||Xn.default).deltaSource,d=(0, Cn.default)(f,o,n),v="start"===r,y="end"===r,m=v?qn(s):e.prevEvent,g=v?e.coords.start:y?{page:m.page,client:m.client,timeStamp:e.coords.cur.timeStamp}:e.coords.cur;return s.page=(0, zn.default)({},g.page),s.client=(0, zn.default)({},g.client),s.rect=(0, zn.default)({},e.rect),s.timeStamp=g.timeStamp,y||(s.page.x-=d.x,s.page.y-=d.y,s.client.x-=d.x,s.client.y-=d.y),s.ctrlKey=t.ctrlKey,s.altKey=t.altKey,s.shiftKey=t.shiftKey,s.metaKey=t.metaKey,s.button=t.button,s.buttons=t.buttons,s.target=o,s.currentTarget=o,s.relatedTarget=i||null,s.preEnd=a,s.type=u||n+(r||""),s.interactable=f,s.t0=v?e.pointers[e.pointers.length-1].downTime:m.t0,s.x0=e.coords.start.page.x-d.x,s.y0=e.coords.start.page.y-d.y,s.clientX0=e.coords.start.client.x-d.x,s.clientY0=e.coords.start.client.y-d.y,s.delta=v||y?{x:0,y:0}:{x:s[p].x-m[p].x,y:s[p].y-m[p].y},s.dt=e.coords.delta.timeStamp,s.duration=s.timeStamp-s.t0,s.velocity=(0, zn.default)({},e.coords.velocity[p]),s.speed=(0, Rn.default)(s.velocity.x,s.velocity.y),s.swipe=y||"inertiastart"===r?s.getSwipe():null,s}var e,t;return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&Vn(e,t);}(h,Wn["default"]),e=h,(t=[{key:"getSwipe",value:function(){var e=this._interaction;if(e.prevEvent.speed<600||150<this.timeStamp-e.prevEvent.timeStamp)return null;var t=180*Math.atan2(e.prevEvent.velocityY,e.prevEvent.velocityX)/Math.PI;t<0&&(t+=360);var n=112.5<=t&&t<247.5,r=202.5<=t&&t<337.5;return {up:r,down:!r&&22.5<=t&&t<157.5,left:n,right:!n&&(292.5<=t||t<67.5),angle:t,speed:e.prevEvent.speed,velocity:{x:e.prevEvent.velocityX,y:e.prevEvent.velocityY}}}},{key:"preventDefault",value:function(){}},{key:"stopImmediatePropagation",value:function(){this.immediatePropagationStopped=this.propagationStopped=!0;}},{key:"stopPropagation",value:function(){this.propagationStopped=!0;}},{key:"pageX",get:function(){return this.page.x},set:function(e){this.page.x=e;}},{key:"pageY",get:function(){return this.page.y},set:function(e){this.page.y=e;}},{key:"clientX",get:function(){return this.client.x},set:function(e){this.client.x=e;}},{key:"clientY",get:function(){return this.client.y},set:function(e){this.client.y=e;}},{key:"dx",get:function(){return this.delta.x},set:function(e){this.delta.x=e;}},{key:"dy",get:function(){return this.delta.y},set:function(e){this.delta.y=e;}},{key:"velocityX",get:function(){return this.velocity.x},set:function(e){this.velocity.x=e;}},{key:"velocityY",get:function(){return this.velocity.y},set:function(e){this.velocity.y=e;}}])&&Fn(e.prototype,t),h}(),Bn=Tn.InteractEvent=Un;Tn.default=Bn;var Hn={};Object.defineProperty(Hn,"__esModule",{value:!0}),Hn.default=Hn.PointerInfo=void 0;function Kn(e,t,n,r,o){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,Kn),this.id=e,this.pointer=t,this.event=n,this.downTime=r,this.downTarget=o;}var $n=Hn.PointerInfo=Kn;Hn.default=$n;var Qn={};function Zn(e){return (Zn="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(Qn,"__esModule",{value:!0}),Qn.default=void 0;var Jn=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Zn(e)&&"function"!=typeof e)return {default:e};var t=er();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(C);function er(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return er=function(){return e},e}var tr={methodOrder:["simulationResume","mouseOrPen","hasPointer","idle"],search:function(e){for(var t=0;t<tr.methodOrder.length;t++){var n;n=tr.methodOrder[t];var r=tr[n](e);if(r)return r}return null},simulationResume:function(e){var t=e.pointerType,n=e.eventType,r=e.eventTarget,o=e.scope;if(!/down|start/i.test(n))return null;for(var i=0;i<o.interactions.list.length;i++){var a=o.interactions.list[i],u=r;if(a.simulation&&a.simulation.allowResume&&a.pointerType===t)for(;u;){if(u===a.element)return a;u=Jn.parentNode(u);}}return null},mouseOrPen:function(e){var t,n=e.pointerId,r=e.pointerType,o=e.eventType,i=e.scope;if("mouse"!==r&&"pen"!==r)return null;for(var a=0;a<i.interactions.list.length;a++){var u=i.interactions.list[a];if(u.pointerType===r){if(u.simulation&&!nr(u,n))continue;if(u.interacting())return u;t=t||u;}}if(t)return t;for(var s=0;s<i.interactions.list.length;s++){var l=i.interactions.list[s];if(!(l.pointerType!==r||/down/i.test(o)&&l.simulation))return l}return null},hasPointer:function(e){for(var t=e.pointerId,n=e.scope,r=0;r<n.interactions.list.length;r++){var o=n.interactions.list[r];if(nr(o,t))return o}return null},idle:function(e){for(var t=e.pointerType,n=e.scope,r=0;r<n.interactions.list.length;r++){var o=n.interactions.list[r];if(1===o.pointers.length){var i=o.interactable;if(i&&(!i.options.gesture||!i.options.gesture.enabled))continue}else if(2<=o.pointers.length)continue;if(!o.interacting()&&t===o.pointerType)return o}return null}};function nr(e,t){return e.pointers.some(function(e){return e.id===t})}var rr=tr;Qn.default=rr;var or={};function ir(e){return (ir="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(or,"__esModule",{value:!0}),or.default=void 0;var ar=O({}),ur=cr(u),sr=cr(y);function lr(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return lr=function(){return e},e}function cr(e){if(e&&e.__esModule)return e;if(null===e||"object"!==ir(e)&&"function"!=typeof e)return {default:e};var t=lr();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}return n.default=e,t&&t.set(e,n),n}function fr(e){var t=e.interaction;if("drag"===t.prepared.name){var n=t.prepared.axis;"x"===n?(t.coords.cur.page.y=t.coords.start.page.y,t.coords.cur.client.y=t.coords.start.client.y,t.coords.velocity.client.y=0,t.coords.velocity.page.y=0):"y"===n&&(t.coords.cur.page.x=t.coords.start.page.x,t.coords.cur.client.x=t.coords.start.client.x,t.coords.velocity.client.x=0,t.coords.velocity.page.x=0);}}function pr(e){var t=e.iEvent,n=e.interaction;if("drag"===n.prepared.name){var r=n.prepared.axis;if("x"===r||"y"===r){var o="x"===r?"y":"x";t.page[o]=n.coords.start.page[o],t.client[o]=n.coords.start.client[o],t.delta[o]=0;}}}ar.ActionName.Drag="drag";var dr={id:"actions/drag",install:function(e){var t=e.actions,n=e.Interactable,r=e.defaults;n.prototype.draggable=dr.draggable,t[ar.ActionName.Drag]=dr,t.names.push(ar.ActionName.Drag),ur.merge(t.eventTypes,["dragstart","dragmove","draginertiastart","dragresume","dragend"]),t.methodDict.drag="draggable",r.actions.drag=dr.defaults;},listeners:{"interactions:before-action-move":fr,"interactions:action-resume":fr,"interactions:action-move":pr,"auto-start:check":function(e){var t=e.interaction,n=e.interactable,r=e.buttons,o=n.options.drag;if(o&&o.enabled&&(!t.pointerIsDown||!/mouse|pointer/.test(t.pointerType)||0!=(r&n.options.drag.mouseButtons)))return !(e.action={name:ar.ActionName.Drag,axis:"start"===o.lockAxis?o.startAxis:o.lockAxis})}},draggable:function(e){return sr.object(e)?(this.options.drag.enabled=!1!==e.enabled,this.setPerAction(ar.ActionName.Drag,e),this.setOnEvents(ar.ActionName.Drag,e),/^(xy|x|y|start)$/.test(e.lockAxis)&&(this.options.drag.lockAxis=e.lockAxis),/^(xy|x|y)$/.test(e.startAxis)&&(this.options.drag.startAxis=e.startAxis),this):sr.bool(e)?(this.options.drag.enabled=e,this):this.options.drag},beforeMove:fr,move:pr,defaults:{startAxis:"xy",lockAxis:"xy"},getCursor:function(){return "move"}},vr=dr;or.default=vr;var yr={};Object.defineProperty(yr,"__esModule",{value:!0}),yr.default=void 0;var mr,gr=(mr=Sn)&&mr.__esModule?mr:{default:mr},hr=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Or(e)&&"function"!=typeof e)return {default:e};var t=br();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(u);function br(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return br=function(){return e},e}function Or(e){return (Or="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function wr(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function Pr(e){return (Pr=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function _r(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function xr(e,t){return (xr=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function Sr(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var jr=function(){function l(e,t,n){var r,o,i;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,l),o=this,r=!(i=Pr(l).call(this,t._interaction))||"object"!==Or(i)&&"function"!=typeof i?_r(o):i,Sr(_r(r),"target",void 0),Sr(_r(r),"dropzone",void 0),Sr(_r(r),"dragEvent",void 0),Sr(_r(r),"relatedTarget",void 0),Sr(_r(r),"draggable",void 0),Sr(_r(r),"timeStamp",void 0),Sr(_r(r),"propagationStopped",!1),Sr(_r(r),"immediatePropagationStopped",!1);var a="dragleave"===n?e.prev:e.cur,u=a.element,s=a.dropzone;return r.type=n,r.target=u,r.currentTarget=u,r.dropzone=s,r.dragEvent=t,r.relatedTarget=t.target,r.draggable=t.interactable,r.timeStamp=t.timeStamp,r}var e,t;return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&xr(e,t);}(l,gr["default"]),e=l,(t=[{key:"reject",value:function(){var r=this,e=this._interaction.dropState;if("dropactivate"===this.type||this.dropzone&&e.cur.dropzone===this.dropzone&&e.cur.element===this.target)if(e.prev.dropzone=this.dropzone,e.prev.element=this.target,e.rejected=!0,e.events.enter=null,this.stopImmediatePropagation(),"dropactivate"===this.type){var t=e.activeDrops,n=hr.findIndex(t,function(e){var t=e.dropzone,n=e.element;return t===r.dropzone&&n===r.target});e.activeDrops.splice(n,1);var o=new l(e,this.dragEvent,"dropdeactivate");o.dropzone=this.dropzone,o.target=this.target,this.dropzone.fire(o);}else this.dropzone.fire(new l(e,this.dragEvent,"dragleave"));}},{key:"preventDefault",value:function(){}},{key:"stopPropagation",value:function(){this.propagationStopped=!0;}},{key:"stopImmediatePropagation",value:function(){this.immediatePropagationStopped=this.propagationStopped=!0;}}])&&wr(e.prototype,t),l}();yr.default=jr;var Mr={};function Er(e){return (Er="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(Mr,"__esModule",{value:!0}),Mr.default=void 0;zr(Ut);var kr=O({}),Dr=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Er(e)&&"function"!=typeof e)return {default:e};var t=Ar();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(pt),Tr=zr(or),Ir=zr(yr);function Ar(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return Ar=function(){return e},e}function zr(e){return e&&e.__esModule?e:{default:e}}function Cr(e,t){for(var n=0;n<e.slice().length;n++){var r=e.slice()[n],o=r.dropzone,i=r.element;t.dropzone=o,t.target=i,o.fire(t),t.propagationStopped=t.immediatePropagationStopped=!1;}}function Rr(e,t){for(var n=function(e,t){for(var n=e.interactables,r=[],o=0;o<n.list.length;o++){var i=n.list[o];if(i.options.drop.enabled){var a=i.options.drop.accept;if(!(Dr.is.element(a)&&a!==t||Dr.is.string(a)&&!Dr.dom.matchesSelector(t,a)||Dr.is.func(a)&&!a({dropzone:i,draggableElement:t})))for(var u=Dr.is.string(i.target)?i._context.querySelectorAll(i.target):Dr.is.array(i.target)?i.target:[i.target],s=0;s<u.length;s++){var l=u[s];l!==t&&r.push({dropzone:i,element:l});}}}return r}(e,t),r=0;r<n.length;r++){var o=n[r];o.rect=o.dropzone.getRect(o.element);}return n}function Wr(e,t,n){for(var r=e.dropState,o=e.interactable,i=e.element,a=[],u=0;u<r.activeDrops.length;u++){var s=r.activeDrops[u],l=s.dropzone,c=s.element,f=s.rect;a.push(l.dropCheck(t,n,o,i,c,f)?c:null);}var p=Dr.dom.indexOfDeepestElement(a);return r.activeDrops[p]||null}function Xr(e,t,n){var r=e.dropState,o={enter:null,leave:null,activate:null,deactivate:null,move:null,drop:null};return "dragstart"===n.type&&(o.activate=new Ir.default(r,n,"dropactivate"),o.activate.target=null,o.activate.dropzone=null),"dragend"===n.type&&(o.deactivate=new Ir.default(r,n,"dropdeactivate"),o.deactivate.target=null,o.deactivate.dropzone=null),r.rejected||(r.cur.element!==r.prev.element&&(r.prev.dropzone&&(o.leave=new Ir.default(r,n,"dragleave"),n.dragLeave=o.leave.target=r.prev.element,n.prevDropzone=o.leave.dropzone=r.prev.dropzone),r.cur.dropzone&&(o.enter=new Ir.default(r,n,"dragenter"),n.dragEnter=r.cur.element,n.dropzone=r.cur.dropzone)),"dragend"===n.type&&r.cur.dropzone&&(o.drop=new Ir.default(r,n,"drop"),n.dropzone=r.cur.dropzone,n.relatedTarget=r.cur.element),"dragmove"===n.type&&r.cur.dropzone&&(o.move=new Ir.default(r,n,"dropmove"),(o.move.dragmove=n).dropzone=r.cur.dropzone)),o}function Nr(e,t){var n=e.dropState,r=n.activeDrops,o=n.cur,i=n.prev;t.leave&&i.dropzone.fire(t.leave),t.move&&o.dropzone.fire(t.move),t.enter&&o.dropzone.fire(t.enter),t.drop&&o.dropzone.fire(t.drop),t.deactivate&&Cr(r,t.deactivate),n.prev.dropzone=o.dropzone,n.prev.element=o.element;}function Yr(e,t){var n=e.interaction,r=e.iEvent,o=e.event;if("dragmove"===r.type||"dragend"===r.type){var i=n.dropState;t.dynamicDrop&&(i.activeDrops=Rr(t,n.element));var a=r,u=Wr(n,a,o);i.rejected=i.rejected&&!!u&&u.dropzone===i.cur.dropzone&&u.element===i.cur.element,i.cur.dropzone=u&&u.dropzone,i.cur.element=u&&u.element,i.events=Xr(n,0,a);}}var Fr={id:"actions/drop",install:function(t){var e=t.actions,n=t.interact,r=t.Interactable,o=t.defaults;t.usePlugin(Tr.default),r.prototype.dropzone=function(e){return function(e,t){if(Dr.is.object(t)){if(e.options.drop.enabled=!1!==t.enabled,t.listeners){var n=Dr.normalizeListeners(t.listeners),r=Object.keys(n).reduce(function(e,t){return e[/^(enter|leave)/.test(t)?"drag".concat(t):/^(activate|deactivate|move)/.test(t)?"drop".concat(t):t]=n[t],e},{});e.off(e.options.drop.listeners),e.on(r),e.options.drop.listeners=r;}return Dr.is.func(t.ondrop)&&e.on("drop",t.ondrop),Dr.is.func(t.ondropactivate)&&e.on("dropactivate",t.ondropactivate),Dr.is.func(t.ondropdeactivate)&&e.on("dropdeactivate",t.ondropdeactivate),Dr.is.func(t.ondragenter)&&e.on("dragenter",t.ondragenter),Dr.is.func(t.ondragleave)&&e.on("dragleave",t.ondragleave),Dr.is.func(t.ondropmove)&&e.on("dropmove",t.ondropmove),/^(pointer|center)$/.test(t.overlap)?e.options.drop.overlap=t.overlap:Dr.is.number(t.overlap)&&(e.options.drop.overlap=Math.max(Math.min(1,t.overlap),0)),"accept"in t&&(e.options.drop.accept=t.accept),"checker"in t&&(e.options.drop.checker=t.checker),e}if(Dr.is.bool(t))return e.options.drop.enabled=t,e;return e.options.drop}(this,e)},r.prototype.dropCheck=function(e,t,n,r,o,i){return function(e,t,n,r,o,i,a){var u=!1;if(!(a=a||e.getRect(i)))return !!e.options.drop.checker&&e.options.drop.checker(t,n,u,e,i,r,o);var s=e.options.drop.overlap;if("pointer"===s){var l=Dr.getOriginXY(r,o,kr.ActionName.Drag),c=Dr.pointer.getPageXY(t);c.x+=l.x,c.y+=l.y;var f=c.x>a.left&&c.x<a.right,p=c.y>a.top&&c.y<a.bottom;u=f&&p;}var d=r.getRect(o);if(d&&"center"===s){var v=d.left+d.width/2,y=d.top+d.height/2;u=v>=a.left&&v<=a.right&&y>=a.top&&y<=a.bottom;}if(d&&Dr.is.number(s)){var m=Math.max(0,Math.min(a.right,d.right)-Math.max(a.left,d.left))*Math.max(0,Math.min(a.bottom,d.bottom)-Math.max(a.top,d.top))/(d.width*d.height);u=s<=m;}e.options.drop.checker&&(u=e.options.drop.checker(t,n,u,e,i,r,o));return u}(this,e,t,n,r,o,i)},n.dynamicDrop=function(e){return Dr.is.bool(e)?(t.dynamicDrop=e,n):t.dynamicDrop},Dr.arr.merge(e.eventTypes,["dragenter","dragleave","dropactivate","dropdeactivate","dropmove","drop"]),e.methodDict.drop="dropzone",t.dynamicDrop=!1,o.actions.drop=Fr.defaults;},listeners:{"interactions:before-action-start":function(e){var t=e.interaction;"drag"===t.prepared.name&&(t.dropState={cur:{dropzone:null,element:null},prev:{dropzone:null,element:null},rejected:null,events:null,activeDrops:[]});},"interactions:after-action-start":function(e,t){var n=e.interaction,r=(e.event,e.iEvent);if("drag"===n.prepared.name){var o=n.dropState;o.activeDrops=null,o.events=null,o.activeDrops=Rr(t,n.element),o.events=Xr(n,0,r),o.events.activate&&(Cr(o.activeDrops,o.events.activate),t.fire("actions/drop:start",{interaction:n,dragEvent:r}));}},"interactions:action-move":Yr,"interactions:action-end":Yr,"interactions:after-action-move":function(e,t){var n=e.interaction,r=e.iEvent;"drag"===n.prepared.name&&(Nr(n,n.dropState.events),t.fire("actions/drop:move",{interaction:n,dragEvent:r}),n.dropState.events={});},"interactions:after-action-end":function(e,t){var n=e.interaction,r=e.iEvent;"drag"===n.prepared.name&&(Nr(n,n.dropState.events),t.fire("actions/drop:end",{interaction:n,dragEvent:r}));},"interactions:stop":function(e){var t=e.interaction;if("drag"===t.prepared.name){var n=t.dropState;n&&(n.activeDrops=null,n.events=null,n.cur.dropzone=null,n.cur.element=null,n.prev.dropzone=null,n.prev.element=null,n.rejected=!1);}}},getActiveDrops:Rr,getDrop:Wr,getDropEvents:Xr,fireDropEvents:Nr,defaults:{enabled:!1,accept:null,overlap:"pointer"}},Lr=Fr;Mr.default=Lr;var qr={};function Vr(e){return (Vr="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(qr,"__esModule",{value:!0}),qr.default=void 0;var Gr,Ur=(Gr=Tn)&&Gr.__esModule?Gr:{default:Gr},Br=O({}),Hr=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Vr(e)&&"function"!=typeof e)return {default:e};var t=Kr();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(pt);function Kr(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return Kr=function(){return e},e}function $r(e){var t=e.interaction,n=e.iEvent,r=e.event,o=e.phase;if("gesture"===t.prepared.name){var i=t.pointers.map(function(e){return e.pointer}),a="start"===o,u="end"===o,s=t.interactable.options.deltaSource;if(n.touches=[i[0],i[1]],a)n.distance=Hr.pointer.touchDistance(i,s),n.box=Hr.pointer.touchBBox(i),n.scale=1,n.ds=0,n.angle=Hr.pointer.touchAngle(i,s),n.da=0,t.gesture.startDistance=n.distance,t.gesture.startAngle=n.angle;else if(u||r instanceof Ur.default){var l=t.prevEvent;n.distance=l.distance,n.box=l.box,n.scale=l.scale,n.ds=0,n.angle=l.angle,n.da=0;}else n.distance=Hr.pointer.touchDistance(i,s),n.box=Hr.pointer.touchBBox(i),n.scale=n.distance/t.gesture.startDistance,n.angle=Hr.pointer.touchAngle(i,s),n.ds=n.scale-t.gesture.scale,n.da=n.angle-t.gesture.angle;t.gesture.distance=n.distance,t.gesture.angle=n.angle,Hr.is.number(n.scale)&&n.scale!==1/0&&!isNaN(n.scale)&&(t.gesture.scale=n.scale);}}Br.ActionName.Gesture="gesture";var Qr={id:"actions/gesture",before:["actions/drag","actions/resize"],install:function(e){var t=e.actions,n=e.Interactable,r=e.defaults;n.prototype.gesturable=function(e){return Hr.is.object(e)?(this.options.gesture.enabled=!1!==e.enabled,this.setPerAction(Br.ActionName.Gesture,e),this.setOnEvents(Br.ActionName.Gesture,e),this):Hr.is.bool(e)?(this.options.gesture.enabled=e,this):this.options.gesture},t[Br.ActionName.Gesture]=Qr,t.names.push(Br.ActionName.Gesture),Hr.arr.merge(t.eventTypes,["gesturestart","gesturemove","gestureend"]),t.methodDict.gesture="gesturable",r.actions.gesture=Qr.defaults;},listeners:{"interactions:action-start":$r,"interactions:action-move":$r,"interactions:action-end":$r,"interactions:new":function(e){e.interaction.gesture={angle:0,distance:0,scale:1,startAngle:0,startDistance:0};},"auto-start:check":function(e){if(!(e.interaction.pointers.length<2)){var t=e.interactable.options.gesture;if(t&&t.enabled)return !(e.action={name:Br.ActionName.Gesture})}}},defaults:{},getCursor:function(){return ""}},Zr=Qr;qr.default=Zr;var Jr={};function eo(e){return (eo="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(Jr,"__esModule",{value:!0}),Jr.default=void 0;g({});var to,no=O({}),ro=so(u),oo=so(C),io=(to=me)&&to.__esModule?to:{default:to},ao=so(y);function uo(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return uo=function(){return e},e}function so(e){if(e&&e.__esModule)return e;if(null===e||"object"!==eo(e)&&"function"!=typeof e)return {default:e};var t=uo();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}return n.default=e,t&&t.set(e,n),n}function lo(e,t,n,r,o,i,a){if(!t)return !1;if(!0===t){var u=ao.number(i.width)?i.width:i.right-i.left,s=ao.number(i.height)?i.height:i.bottom-i.top;if(a=Math.min(a,("left"===e||"right"===e?u:s)/2),u<0&&("left"===e?e="right":"right"===e&&(e="left")),s<0&&("top"===e?e="bottom":"bottom"===e&&(e="top")),"left"===e)return n.x<(0<=u?i.left:i.right)+a;if("top"===e)return n.y<(0<=s?i.top:i.bottom)+a;if("right"===e)return n.x>(0<=u?i.right:i.left)-a;if("bottom"===e)return n.y>(0<=s?i.bottom:i.top)-a}return !!ao.element(r)&&(ao.element(t)?t===r:oo.matchesUpTo(r,t,o))}function co(e){var t=e.iEvent,n=e.interaction;n.prepared.name===no.ActionName.Resize&&n.resizeAxes&&(n.interactable.options.resize.square?("y"===n.resizeAxes?t.delta.x=t.delta.y:t.delta.y=t.delta.x,t.axes="xy"):(t.axes=n.resizeAxes,"x"===n.resizeAxes?t.delta.y=0:"y"===n.resizeAxes&&(t.delta.x=0)));}var fo={id:"actions/resize",before:["actions/drag"],install:function(t){var e=t.actions,n=t.browser,r=t.Interactable,o=t.defaults;fo.cursors=n.isIe9?{x:"e-resize",y:"s-resize",xy:"se-resize",top:"n-resize",left:"w-resize",bottom:"s-resize",right:"e-resize",topleft:"se-resize",bottomright:"se-resize",topright:"ne-resize",bottomleft:"ne-resize"}:{x:"ew-resize",y:"ns-resize",xy:"nwse-resize",top:"ns-resize",left:"ew-resize",bottom:"ns-resize",right:"ew-resize",topleft:"nwse-resize",bottomright:"nwse-resize",topright:"nesw-resize",bottomleft:"nesw-resize"},fo.defaultMargin=n.supportsTouch||n.supportsPointerEvent?20:10,r.prototype.resizable=function(e){return function(e,t,n){if(ao.object(t))return e.options.resize.enabled=!1!==t.enabled,e.setPerAction(no.ActionName.Resize,t),e.setOnEvents(no.ActionName.Resize,t),ao.string(t.axis)&&/^x$|^y$|^xy$/.test(t.axis)?e.options.resize.axis=t.axis:null===t.axis&&(e.options.resize.axis=n.defaults.actions.resize.axis),ao.bool(t.preserveAspectRatio)?e.options.resize.preserveAspectRatio=t.preserveAspectRatio:ao.bool(t.square)&&(e.options.resize.square=t.square),e;if(ao.bool(t))return e.options.resize.enabled=t,e;return e.options.resize}(this,e,t)},e[no.ActionName.Resize]=fo,e.names.push(no.ActionName.Resize),ro.merge(e.eventTypes,["resizestart","resizemove","resizeinertiastart","resizeresume","resizeend"]),e.methodDict.resize="resizable",o.actions.resize=fo.defaults;},listeners:{"interactions:new":function(e){e.interaction.resizeAxes="xy";},"interactions:action-start":function(e){!function(e){var t=e.iEvent,n=e.interaction;if("resize"===n.prepared.name&&n.prepared.edges){var r=n.rect;n._rects={start:(0, io.default)({},r),corrected:(0, io.default)({},r),previous:(0, io.default)({},r),delta:{left:0,right:0,width:0,top:0,bottom:0,height:0}},t.edges=n.prepared.edges,t.rect=n._rects.corrected,t.deltaRect=n._rects.delta;}}(e),co(e);},"interactions:action-move":function(e){!function(e){var t=e.iEvent,n=e.interaction;if("resize"===n.prepared.name&&n.prepared.edges){var r=n.interactable.options.resize.invert,o="reposition"===r||"negate"===r,i=n.rect,a=n._rects,u=a.start,s=a.corrected,l=a.delta,c=a.previous;if((0, io.default)(c,s),o){if((0, io.default)(s,i),"reposition"===r){if(s.top>s.bottom){var f=s.top;s.top=s.bottom,s.bottom=f;}if(s.left>s.right){var p=s.left;s.left=s.right,s.right=p;}}}else s.top=Math.min(i.top,u.bottom),s.bottom=Math.max(i.bottom,u.top),s.left=Math.min(i.left,u.right),s.right=Math.max(i.right,u.left);for(var d in s.width=s.right-s.left,s.height=s.bottom-s.top,s)l[d]=s[d]-c[d];t.edges=n.prepared.edges,t.rect=s,t.deltaRect=l;}}(e),co(e);},"interactions:action-end":function(e){var t=e.iEvent,n=e.interaction;"resize"===n.prepared.name&&n.prepared.edges&&(t.edges=n.prepared.edges,t.rect=n._rects.corrected,t.deltaRect=n._rects.delta);},"auto-start:check":function(e){var t=e.interaction,n=e.interactable,r=e.element,o=e.rect,i=e.buttons;if(o){var a=(0, io.default)({},t.coords.cur.page),u=n.options.resize;if(u&&u.enabled&&(!t.pointerIsDown||!/mouse|pointer/.test(t.pointerType)||0!=(i&u.mouseButtons))){if(ao.object(u.edges)){var s={left:!1,right:!1,top:!1,bottom:!1};for(var l in s)s[l]=lo(l,u.edges[l],a,t._latestPointer.eventTarget,r,o,u.margin||fo.defaultMargin);s.left=s.left&&!s.right,s.top=s.top&&!s.bottom,(s.left||s.right||s.top||s.bottom)&&(e.action={name:no.ActionName.Resize,edges:s});}else{var c="y"!==u.axis&&a.x>o.right-fo.defaultMargin,f="x"!==u.axis&&a.y>o.bottom-fo.defaultMargin;(c||f)&&(e.action={name:"resize",axes:(c?"x":"")+(f?"y":"")});}return !e.action&&void 0}}}},defaults:{square:!(no.ActionName.Resize="resize"),preserveAspectRatio:!1,axis:"xy",margin:NaN,edges:null,invert:"none"},cursors:null,getCursor:function(e){var t=e.edges,n=e.axis,r=e.name,o=fo.cursors,i=null;if(n)i=o[r+n];else if(t){for(var a="",u=["top","bottom","left","right"],s=0;s<u.length;s++){var l=u[s];t[l]&&(a+=l);}i=o[a];}return i},defaultMargin:null},po=fo;Jr.default=po;var vo={};Object.defineProperty(vo,"__esModule",{value:!0}),vo.install=function(e){e.usePlugin(go.default),e.usePlugin(ho.default),e.usePlugin(yo.default),e.usePlugin(mo.default);},Object.defineProperty(vo,"drag",{enumerable:!0,get:function(){return yo.default}}),Object.defineProperty(vo,"drop",{enumerable:!0,get:function(){return mo.default}}),Object.defineProperty(vo,"gesture",{enumerable:!0,get:function(){return go.default}}),Object.defineProperty(vo,"resize",{enumerable:!0,get:function(){return ho.default}}),vo.id=void 0;var yo=bo(or),mo=bo(Mr),go=bo(qr),ho=bo(Jr);function bo(e){return e&&e.__esModule?e:{default:e}}vo.id="actions";var Oo={};function wo(e){return (wo="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(Oo,"__esModule",{value:!0}),Oo.getContainer=ko,Oo.getScroll=Do,Oo.getScrollSize=function(e){xo.window(e)&&(e=window.document.body);return {x:e.scrollWidth,y:e.scrollHeight}},Oo.getScrollSizeDelta=function(e,t){var n=e.interaction,r=e.element,o=n&&n.interactable.options[n.prepared.name].autoScroll;if(!o||!o.enabled)return t(),{x:0,y:0};var i=ko(o.container,n.interactable,r),a=Do(i);t();var u=Do(i);return {x:u.x-a.x,y:u.y-a.y}},Oo.default=void 0;var Po,_o=Mo(C),xo=Mo(y),So=(Po=ut)&&Po.__esModule?Po:{default:Po};function jo(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return jo=function(){return e},e}function Mo(e){if(e&&e.__esModule)return e;if(null===e||"object"!==wo(e)&&"function"!=typeof e)return {default:e};var t=jo();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}return n.default=e,t&&t.set(e,n),n}var Eo={defaults:{enabled:!1,margin:60,container:null,speed:300},now:Date.now,interaction:null,i:0,x:0,y:0,isScrolling:!1,prevTime:0,margin:0,speed:0,start:function(e){Eo.isScrolling=!0,So.default.cancel(Eo.i),(e.autoScroll=Eo).interaction=e,Eo.prevTime=Eo.now(),Eo.i=So.default.request(Eo.scroll);},stop:function(){Eo.isScrolling=!1,Eo.interaction&&(Eo.interaction.autoScroll=null),So.default.cancel(Eo.i);},scroll:function(){var e=Eo.interaction,t=e.interactable,n=e.element,r=e.prepared.name,o=t.options[r].autoScroll,i=ko(o.container,t,n),a=Eo.now(),u=(a-Eo.prevTime)/1e3,s=o.speed*u;if(1<=s){var l={x:Eo.x*s,y:Eo.y*s};if(l.x||l.y){var c=Do(i);xo.window(i)?i.scrollBy(l.x,l.y):i&&(i.scrollLeft+=l.x,i.scrollTop+=l.y);var f=Do(i),p={x:f.x-c.x,y:f.y-c.y};(p.x||p.y)&&t.fire({type:"autoscroll",target:n,interactable:t,delta:p,interaction:e,container:i});}Eo.prevTime=a;}Eo.isScrolling&&(So.default.cancel(Eo.i),Eo.i=So.default.request(Eo.scroll));},check:function(e,t){var n=e.options;return n[t].autoScroll&&n[t].autoScroll.enabled},onInteractionMove:function(e){var t=e.interaction,n=e.pointer;if(t.interacting()&&Eo.check(t.interactable,t.prepared.name))if(t.simulation)Eo.x=Eo.y=0;else{var r,o,i,a,u=t.interactable,s=t.element,l=t.prepared.name,c=u.options[l].autoScroll,f=ko(c.container,u,s);if(xo.window(f))a=n.clientX<Eo.margin,r=n.clientY<Eo.margin,o=n.clientX>f.innerWidth-Eo.margin,i=n.clientY>f.innerHeight-Eo.margin;else{var p=_o.getElementClientRect(f);a=n.clientX<p.left+Eo.margin,r=n.clientY<p.top+Eo.margin,o=n.clientX>p.right-Eo.margin,i=n.clientY>p.bottom-Eo.margin;}Eo.x=o?1:a?-1:0,Eo.y=i?1:r?-1:0,Eo.isScrolling||(Eo.margin=c.margin,Eo.speed=c.speed,Eo.start(t));}}};function ko(e,t,n){return (xo.string(e)?(0, ge.getStringOptionResult)(e,t,n):e)||(0, s.getWindow)(n)}function Do(e){return xo.window(e)&&(e=window.document.body),{x:e.scrollLeft,y:e.scrollTop}}var To={id:"auto-scroll",install:function(e){var t=e.defaults,n=e.actions;(e.autoScroll=Eo).now=function(){return e.now()},n.eventTypes.push("autoscroll"),t.perAction.autoScroll=Eo.defaults;},listeners:{"interactions:new":function(e){e.interaction.autoScroll=null;},"interactions:destroy":function(e){e.interaction.autoScroll=null,Eo.stop(),Eo.interaction&&(Eo.interaction=null);},"interactions:stop":Eo.stop,"interactions:action-move":function(e){return Eo.onInteractionMove(e)}}};Oo.default=To;var Io={};function Ao(e){return (Ao="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(Io,"__esModule",{value:!0}),Io.default=void 0;var zo=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Ao(e)&&"function"!=typeof e)return {default:e};var t=Co();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(y);function Co(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return Co=function(){return e},e}function Ro(e){return zo.bool(e)?(this.options.styleCursor=e,this):null===e?(delete this.options.styleCursor,this):this.options.styleCursor}function Wo(e){return zo.func(e)?(this.options.actionChecker=e,this):null===e?(delete this.options.actionChecker,this):this.options.actionChecker}var Xo={id:"auto-start/interactableMethods",install:function(d){var e=d.Interactable;e.prototype.getAction=function(e,t,n,r){var o,i,a,u,s,l,c,f,p=(i=t,a=n,u=r,s=d,l=(o=this).getRect(u),c=i.buttons||{0:1,1:4,3:8,4:16}[i.button],f={action:null,interactable:o,interaction:a,element:u,rect:l,buttons:c},s.fire("auto-start:check",f),f.action);return this.options.actionChecker?this.options.actionChecker(e,t,p,this,r,n):p},e.prototype.ignoreFrom=(0, pt.warnOnce)(function(e){return this._backCompatOption("ignoreFrom",e)},"Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue})."),e.prototype.allowFrom=(0, pt.warnOnce)(function(e){return this._backCompatOption("allowFrom",e)},"Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue})."),e.prototype.actionChecker=Wo,e.prototype.styleCursor=Ro;}};Io.default=Xo;var No={};function Yo(e){return (Yo="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(No,"__esModule",{value:!0}),No.default=void 0;var Fo,Lo=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Yo(e)&&"function"!=typeof e)return {default:e};var t=Vo();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(pt),qo=(Fo=Io)&&Fo.__esModule?Fo:{default:Fo};function Vo(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return Vo=function(){return e},e}function Go(e,t,n,r,o){return t.testIgnoreAllow(t.options[e.name],n,r)&&t.options[e.name].enabled&&Ko(t,n,e,o)?e:null}function Uo(e,t,n,r,o,i,a){for(var u=0,s=r.length;u<s;u++){var l=r[u],c=o[u],f=l.getAction(t,n,e,c);if(f){var p=Go(f,l,c,i,a);if(p)return {action:p,interactable:l,element:c}}}return {action:null,interactable:null,element:null}}function Bo(e,t,n,r,o){var i=[],a=[],u=r;function s(e){i.push(e),a.push(u);}for(;Lo.is.element(u);){i=[],a=[],o.interactables.forEachMatch(u,s);var l=Uo(e,t,n,i,a,r,o);if(l.action&&!l.interactable.options[l.action.name].manualStart)return l;u=Lo.dom.parentNode(u);}return {action:null,interactable:null,element:null}}function Ho(e,t,n){var r=t.action,o=t.interactable,i=t.element;r=r||{name:null},e.interactable=o,e.element=i,Lo.copyAction(e.prepared,r),e.rect=o&&r.name?o.getRect(i):null,Zo(e,n),n.fire("autoStart:prepared",{interaction:e});}function Ko(e,t,n,r){var o=e.options,i=o[n.name].max,a=o[n.name].maxPerElement,u=r.autoStart.maxInteractions,s=0,l=0,c=0;if(!(i&&a&&u))return !1;for(var f=0;f<r.interactions.list.length;f++){var p=r.interactions.list[f],d=p.prepared.name;if(p.interacting()){if(u<=++s)return !1;if(p.interactable===e){if(i<=(l+=d===n.name?1:0))return !1;if(p.element===t&&(c++,d===n.name&&a<=c))return !1}}}return 0<u}function $o(e,t){return Lo.is.number(e)?(t.autoStart.maxInteractions=e,this):t.autoStart.maxInteractions}function Qo(e,t,n){var r=n.autoStart.cursorElement;r&&r!==e&&(r.style.cursor=""),e.ownerDocument.documentElement.style.cursor=t,e.style.cursor=t,n.autoStart.cursorElement=t?e:null;}function Zo(e,t){var n=e.interactable,r=e.element,o=e.prepared;if("mouse"===e.pointerType&&n&&n.options.styleCursor){var i="";if(o.name){var a=n.options[o.name].cursorChecker;i=Lo.is.func(a)?a(o,n,r,e._interacting):t.actions[o.name].getCursor(o);}Qo(e.element,i||"",t);}else t.autoStart.cursorElement&&Qo(t.autoStart.cursorElement,"",t);}var Jo={id:"auto-start/base",before:["actions","action/drag","actions/resize","actions/gesture"],install:function(t){var e=t.interact,n=t.defaults;t.usePlugin(qo.default),n.base.actionChecker=null,n.base.styleCursor=!0,Lo.extend(n.perAction,{manualStart:!1,max:1/0,maxPerElement:1,allowFrom:null,ignoreFrom:null,mouseButtons:1}),e.maxInteractions=function(e){return $o(e,t)},t.autoStart={maxInteractions:1/0,withinInteractionLimit:Ko,cursorElement:null};},listeners:{"interactions:down":function(e,t){var n=e.interaction,r=e.pointer,o=e.event,i=e.eventTarget;n.interacting()||Ho(n,Bo(n,r,o,i,t),t);},"interactions:move":function(e,t){var n,r,o,i,a,u;r=t,o=(n=e).interaction,i=n.pointer,a=n.event,u=n.eventTarget,"mouse"!==o.pointerType||o.pointerIsDown||o.interacting()||Ho(o,Bo(o,i,a,u,r),r),function(e,t){var n=e.interaction;if(n.pointerIsDown&&!n.interacting()&&n.pointerWasMoved&&n.prepared.name){t.fire("autoStart:before-start",e);var r=n.interactable,o=n.prepared.name;o&&r&&(r.options[o].manualStart||!Ko(r,n.element,n.prepared,t)?n.stop():(n.start(n.prepared,r,n.element),Zo(n,t)));}}(e,t);},"interactions:stop":function(e,t){var n=e.interaction,r=n.interactable;r&&r.options.styleCursor&&Qo(n.element,"",t);}},maxInteractions:$o,withinInteractionLimit:Ko,validateAction:Go};No.default=Jo;var ei={};function ti(e){return (ti="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(ei,"__esModule",{value:!0}),ei.default=void 0;var ni,ri=O({}),oi=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==ti(e)&&"function"!=typeof e)return {default:e};var t=ai();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(y),ii=(ni=No)&&ni.__esModule?ni:{default:ni};function ai(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return ai=function(){return e},e}var ui={id:"auto-start/dragAxis",listeners:{"autoStart:before-start":function(e,r){var o=e.interaction,i=e.eventTarget,t=e.dx,n=e.dy;if("drag"===o.prepared.name){var a=Math.abs(t),u=Math.abs(n),s=o.interactable.options.drag,l=s.startAxis,c=u<a?"x":a<u?"y":"xy";if(o.prepared.axis="start"===s.lockAxis?c[0]:s.lockAxis,"xy"!=c&&"xy"!==l&&l!==c){o.prepared.name=null;function f(e){if(e!==o.interactable){var t=o.interactable.options.drag;if(!t.manualStart&&e.testIgnoreAllow(t,p,i)){var n=e.getAction(o.downPointer,o.downEvent,o,p);if(n&&n.name===ri.ActionName.Drag&&function(e,t){if(!t)return !1;var n=t.options[ri.ActionName.Drag].startAxis;return "xy"===e||"xy"===n||n===e}(c,e)&&ii.default.validateAction(n,e,p,i,r))return e}}}for(var p=i;oi.element(p);){var d=r.interactables.forEachMatch(p,f);if(d){o.prepared.name=ri.ActionName.Drag,o.interactable=d,o.element=p;break}p=(0, C.parentNode)(p);}}}}}};ei.default=ui;var si={};Object.defineProperty(si,"__esModule",{value:!0}),si.default=void 0;var li,ci=(li=No)&&li.__esModule?li:{default:li};function fi(e){var t=e.prepared&&e.prepared.name;if(!t)return null;var n=e.interactable.options;return n[t].hold||n[t].delay}var pi={id:"auto-start/hold",install:function(e){var t=e.defaults;e.usePlugin(ci.default),t.perAction.hold=0,t.perAction.delay=0;},listeners:{"interactions:new":function(e){e.interaction.autoStartHoldTimer=null;},"autoStart:prepared":function(e){var t=e.interaction,n=fi(t);0<n&&(t.autoStartHoldTimer=setTimeout(function(){t.start(t.prepared,t.interactable,t.element);},n));},"interactions:move":function(e){var t=e.interaction,n=e.duplicate;t.pointerWasMoved&&!n&&clearTimeout(t.autoStartHoldTimer);},"autoStart:before-start":function(e){var t=e.interaction;0<fi(t)&&(t.prepared.name=null);}},getHoldDuration:fi};si.default=pi;var di={};Object.defineProperty(di,"__esModule",{value:!0}),di.install=function(e){e.usePlugin(vi.default),e.usePlugin(mi.default),e.usePlugin(yi.default);},Object.defineProperty(di,"autoStart",{enumerable:!0,get:function(){return vi.default}}),Object.defineProperty(di,"dragAxis",{enumerable:!0,get:function(){return yi.default}}),Object.defineProperty(di,"hold",{enumerable:!0,get:function(){return mi.default}}),di.id=void 0;var vi=gi(No),yi=gi(ei),mi=gi(si);function gi(e){return e&&e.__esModule?e:{default:e}}di.id="auto-start";var hi={};function bi(e){return (bi="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(hi,"__esModule",{value:!0}),hi.install=ji,hi.default=void 0;var Oi,wi=(Oi=De)&&Oi.__esModule?Oi:{default:Oi},Pi=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==bi(e)&&"function"!=typeof e)return {default:e};var t=_i();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(y);function _i(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return _i=function(){return e},e}function xi(e){return /^(always|never|auto)$/.test(e)?(this.options.preventDefault=e,this):Pi.bool(e)?(this.options.preventDefault=e?"always":"never",this):this.options.preventDefault}function Si(e){var t=e.interaction,n=e.event;t.interactable&&t.interactable.checkAndPreventDefault(n);}function ji(r){var e=r.Interactable;e.prototype.preventDefault=xi,e.prototype.checkAndPreventDefault=function(e){return function(e,t,n){var r=e.options.preventDefault;if("never"!==r)if("always"!==r){if(wi.default.supportsPassive&&/^touch(start|move)$/.test(n.type)){var o=(0, s.getWindow)(n.target).document,i=t.getDocOptions(o);if(!i||!i.events||!1!==i.events.passive)return}/^(mouse|pointer|touch)*(down|start)/i.test(n.type)||Pi.element(n.target)&&(0, C.matchesSelector)(n.target,"input,select,textarea,[contenteditable=true],[contenteditable=true] *")||n.preventDefault();}else n.preventDefault();}(this,r,e)},r.interactions.docEvents.push({type:"dragstart",listener:function(e){for(var t=0;t<r.interactions.list.length;t++){var n=r.interactions.list[t];if(n.element&&(n.element===e.target||(0, C.nodeContains)(n.element,e.target)))return void n.interactable.checkAndPreventDefault(e)}}});}var Mi={id:"core/interactablePreventDefault",install:ji,listeners:["down","move","up","cancel"].reduce(function(e,t){return e["interactions:".concat(t)]=Si,e},{})};hi.default=Mi;var Ei={};function ki(e){return (ki="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(Ei,"__esModule",{value:!0}),Ei.default=void 0;var Di,Ti,Ii=Ri(k),Ai=(Ri(me),function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==ki(e)&&"function"!=typeof e)return {default:e};var t=Ci();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(y)),zi=Ri(s);function Ci(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return Ci=function(){return e},e}function Ri(e){return e&&e.__esModule?e:{default:e}}(Ti=Di=Di||{}).touchAction="touchAction",Ti.boxSizing="boxSizing",Ti.noListeners="noListeners";Di.touchAction,Di.boxSizing,Di.noListeners;var Ni="dev-tools",Yi={id:Ni,install:function(){}};Ei.default=Yi;var Fi={};function Li(e){return (Li="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(Fi,"__esModule",{value:!0}),Fi.startAll=Ki,Fi.setAll=$i,Fi.prepareStates=Ji,Fi.setCoords=ea,Fi.restoreCoords=ta,Fi.shouldDo=na,Fi.getRectOffset=ra,Fi.makeModifier=function(e,r){function t(e){var t=e||{};for(var n in t.enabled=!1!==t.enabled,o)n in t||(t[n]=o[n]);return {options:t,methods:i,name:r}}var o=e.defaults,i={start:e.start,set:e.set,beforeEnd:e.beforeEnd,stop:e.stop};r&&"string"==typeof r&&(t._defaults=o,t._methods=i);return t},Fi.default=void 0;var qi,Vi=(qi=me)&&qi.__esModule?qi:{default:qi},Gi=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Li(e)&&"function"!=typeof e)return {default:e};var t=Ui();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(ge);function Ui(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return Ui=function(){return e},e}function Bi(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){if(!(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e)))return;var n=[],r=!0,o=!1,i=void 0;try{for(var a,u=e[Symbol.iterator]();!(r=(a=u.next()).done)&&(n.push(a.value),!t||n.length!==t);r=!0);}catch(e){o=!0,i=e;}finally{try{r||null==u.return||u.return();}finally{if(o)throw i}}return n}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}function Hi(e,t,n,r){var o=e.interaction,i=e.phase,a=o.interactable,u=o.element,s=o.edges,l=Ji(function(e){var n=e.interactable.options[e.prepared.name],t=n.modifiers;if(t&&t.length)return t.filter(function(e){return !e.options||!1!==e.options.enabled});return ["snap","snapSize","snapEdges","restrict","restrictEdges","restrictSize"].map(function(e){var t=n[e];return t&&t.enabled&&{options:t,methods:t._methods}}).filter(function(e){return !!e})}(o)),c=(0, Vi.default)({},o.rect),f=ra(c,t);o.modifiers.startOffset=f,o.modifiers.startDelta={x:0,y:0};var p={interaction:o,interactable:a,element:u,pageCoords:t,phase:i,rect:c,edges:s,startOffset:f,states:l,preEnd:!1,requireEndOnly:!1,prevCoords:n,prevRect:r};return o.modifiers.states=l,o.modifiers.result=null,Ki(p),o.modifiers.result=$i(p)}function Ki(e){for(var t=e.states,n=0;n<t.length;n++){var r=t[n];r.methods.start&&(e.state=r).methods.start(e);}e.interaction.edges=e.edges;}function $i(e){var t=e.prevCoords,n=e.prevRect,r=e.phase,o=e.preEnd,i=e.requireEndOnly,a=e.states,u=e.rect;e.coords=(0, Vi.default)({},e.pageCoords),e.rect=(0, Vi.default)({},u);for(var s={delta:{x:0,y:0},rectDelta:{left:0,right:0,top:0,bottom:0},coords:e.coords,rect:e.rect,eventProps:[],changed:!0},l=e.edges||{left:!0,right:!0,top:!0,bottom:!0},c=0;c<a.length;c++){var f=a[c],p=f.options,d=(0, Vi.default)({},e.coords),v=null;f.methods.set&&na(p,o,i,r)&&(v=(e.state=f).methods.set(e),Gi.addEdges(l,e.rect,{x:e.coords.x-d.x,y:e.coords.y-d.y})),s.eventProps.push(v);}s.delta.x=e.coords.x-e.pageCoords.x,s.delta.y=e.coords.y-e.pageCoords.y,s.rectDelta.left=e.rect.left-u.left,s.rectDelta.right=e.rect.right-u.right,s.rectDelta.top=e.rect.top-u.top,s.rectDelta.bottom=e.rect.bottom-u.bottom;var y=!n||s.rect.left!==n.left||s.rect.right!==n.right||s.rect.top!==n.top||s.rect.bottom!==n.bottom;return s.changed=!t||t.x!==s.coords.x||t.y!==s.coords.y||y,s}function Qi(e){var t=e.interaction,n=e.phase,r=e.preEnd,o=e.skipModifiers,i=t.interactable,a=t.element,u=o?t.modifiers.states.slice(o):t.modifiers.states,s=e.prevCoords||(t.modifiers.result?t.modifiers.result.coords:null),l=e.prevRect||(t.modifiers.result?t.modifiers.result.rect:null),c=$i({interaction:t,interactable:i,element:a,preEnd:r,phase:n,pageCoords:e.modifiedCoords||t.coords.cur.page,prevCoords:s,rect:t.rect,edges:t.edges,prevRect:l,states:u,requireEndOnly:!1});if(!(t.modifiers.result=c).changed&&t.interacting())return !1;if(e.modifiedCoords){var f=t.coords.cur.page,p=e.modifiedCoords.x-f.x,d=e.modifiedCoords.y-f.y;c.coords.x+=p,c.coords.y+=d,c.delta.x+=p,c.delta.y+=d;}ea(e);}function Zi(e){var t=e.interaction,n=t.modifiers.states;if(n&&n.length){for(var r=(0, Vi.default)({states:n,interactable:t.interactable,element:t.element,rect:null},e),o=0;o<n.length;o++){var i=n[o];(r.state=i).methods.stop&&i.methods.stop(r);}e.interaction.modifiers.states=null,e.interaction.modifiers.endResult=null;}}function Ji(e){for(var t=[],n=0;n<e.length;n++){var r=e[n],o=r.options,i=r.methods,a=r.name;o&&!1===o.enabled||t.push({options:o,methods:i,index:n,name:a});}return t}function ea(e){var t=e.interaction,n=e.phase,r=t.coords.cur,o=t.coords.start,i=t.modifiers,a=i.result,u=i.startDelta,s=a.delta;"start"===n&&(0, Vi.default)(t.modifiers.startDelta,a.delta);for(var l=0;l<[[o,u],[r,s]].length;l++){var c=Bi([[o,u],[r,s]][l],2),f=c[0],p=c[1];f.page.x+=p.x,f.page.y+=p.y,f.client.x+=p.x,f.client.y+=p.y;}var d=t.modifiers.result.rectDelta,v=e.rect||t.rect;v.left+=d.left,v.right+=d.right,v.top+=d.top,v.bottom+=d.bottom,v.width=v.right-v.left,v.height=v.bottom-v.top;}function ta(e){var t=e.interaction,n=t.coords,r=t.rect,o=t.modifiers;if(o.result){for(var i=o.startDelta,a=o.result,u=a.delta,s=a.rectDelta,l=[[n.start,i],[n.cur,u]],c=0;c<l.length;c++){var f=Bi(l[c],2),p=f[0],d=f[1];p.page.x-=d.x,p.page.y-=d.y,p.client.x-=d.x,p.client.y-=d.y;}r.left-=s.left,r.right-=s.right,r.top-=s.top,r.bottom-=s.bottom;}}function na(e,t,n,r){return e?!1!==e.enabled&&(t||!e.endOnly)&&(!n||e.endOnly||e.alwaysOnEnd)&&(e.setStart||"start"!==r):!n}function ra(e,t){return e?{left:t.x-e.left,top:t.y-e.top,right:e.right-t.x,bottom:e.bottom-t.y}:{left:0,top:0,right:0,bottom:0}}function oa(e){var t=e.iEvent,n=e.interaction.modifiers.result;n&&(t.modifiers=n.eventProps);}var ia={id:"modifiers/base",install:function(e){e.defaults.perAction.modifiers=[];},listeners:{"interactions:new":function(e){e.interaction.modifiers={startOffset:{left:0,right:0,top:0,bottom:0},states:null,result:null,endResult:null,startDelta:null};},"interactions:before-action-start":function(e){Hi(e,e.interaction.coords.start.page,null,null),ea(e);},"interactions:after-action-start":ta,"interactions:before-action-move":Qi,"interactions:after-action-move":ta,"interactions:action-resume":function(e){var t=e.interaction.modifiers.result,n=t.coords,r=t.rect;Zi(e),Hi(e,e.interaction.coords.cur.page,n,r),Qi(e);},"interactions:before-action-end":function(e){var t=e.interaction,n=e.event,r=e.noPreEnd,o=t.modifiers.states;if(!r&&o&&o.length)for(var i=!1,a=0;a<o.length;a++){var u=o[a],s=(e.state=u).options,l=u.methods,c=l.beforeEnd&&l.beforeEnd(e);if(c)return t.modifiers.endResult=c,!1;!i&&na(s,!0,!0)&&(t.move({event:n,preEnd:!0}),i=!0);}},"interactions:action-start":oa,"interactions:action-move":oa,"interactions:action-end":oa,"interactions:stop":Zi},before:["actions","action/drag","actions/resize","actions/gesture"]};Fi.default=ia;var aa={};function ua(e){return (ua="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(aa,"__esModule",{value:!0}),aa.default=void 0;var sa,la=da(Fi),ca=da(pt),fa=(sa=ut)&&sa.__esModule?sa:{default:sa};function pa(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return pa=function(){return e},e}function da(e){if(e&&e.__esModule)return e;if(null===e||"object"!==ua(e)&&"function"!=typeof e)return {default:e};var t=pa();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}return n.default=e,t&&t.set(e,n),n}function va(e,t){var n=ha(e),r=n.resistance,o=-Math.log(n.endSpeed/t.v0)/r;t.x0=e.prevEvent.page.x,t.y0=e.prevEvent.page.y,t.t0=t.startEvent.timeStamp/1e3,t.sx=t.sy=0,t.modifiedXe=t.xe=(t.vx0-o)/r,t.modifiedYe=t.ye=(t.vy0-o)/r,t.te=o,t.lambda_v0=r/t.v0,t.one_ve_v0=1-n.endSpeed/t.v0;}function ya(e){ga(e),ca.pointer.setCoordDeltas(e.coords.delta,e.coords.prev,e.coords.cur),ca.pointer.setCoordVelocity(e.coords.velocity,e.coords.delta);var t=e.inertia,n=ha(e).resistance,r=e._now()/1e3-t.t0;if(r<t.te){var o=1-(Math.exp(-n*r)-t.lambda_v0)/t.one_ve_v0;if(t.modifiedXe===t.xe&&t.modifiedYe===t.ye)t.sx=t.xe*o,t.sy=t.ye*o;else{var i=ca.getQuadraticCurvePoint(0,0,t.xe,t.ye,t.modifiedXe,t.modifiedYe,o);t.sx=i.x,t.sy=i.y;}e.move({event:t.startEvent}),t.timeout=fa.default.request(function(){return ya(e)});}else t.sx=t.modifiedXe,t.sy=t.modifiedYe,e.move({event:t.startEvent}),e.end(t.startEvent),t.active=!1,e.simulation=null;ca.pointer.copyCoords(e.coords.prev,e.coords.cur);}function ma(e){ga(e);var t=e.inertia,n=e._now()-t.t0,r=ha(e).smoothEndDuration;n<r?(t.sx=ca.easeOutQuad(n,0,t.xe,r),t.sy=ca.easeOutQuad(n,0,t.ye,r),e.move({event:t.startEvent}),t.timeout=fa.default.request(function(){return ma(e)})):(t.sx=t.xe,t.sy=t.ye,e.move({event:t.startEvent}),e.end(t.startEvent),t.smoothEnd=t.active=!1,e.simulation=null);}function ga(e){var t=e.inertia;if(t.active){var n=t.upCoords.page,r=t.upCoords.client;ca.pointer.setCoords(e.coords.cur,[{pageX:n.x+t.sx,pageY:n.y+t.sy,clientX:r.x+t.sx,clientY:r.y+t.sy}],e._now());}}function ha(e){var t=e.interactable,n=e.prepared;return t&&t.options&&n.name&&t.options[n.name].inertia}Tn.EventPhase.Resume="resume",Tn.EventPhase.InertiaStart="inertiastart";var ba={id:"inertia",install:function(e){var t=e.defaults;e.usePlugin(la.default),t.perAction.inertia={enabled:!1,resistance:10,minSpeed:100,endSpeed:10,allowResume:!0,smoothEndDuration:300};},listeners:{"interactions:new":function(e){e.interaction.inertia={active:!1,smoothEnd:!1,allowResume:!1,upCoords:{},timeout:null};},"interactions:before-action-end":function(e,t){var n=e.interaction,r=e.event,o=e.noPreEnd,i=n.inertia;if(!n.interacting()||n.simulation&&n.simulation.active||o)return null;var a,u=ha(n),s=n._now(),l=n.coords.velocity.client,c=ca.hypot(l.x,l.y),f=!1,p=u&&u.enabled&&"gesture"!==n.prepared.name&&r!==i.startEvent,d=p&&s-n.coords.cur.timeStamp<50&&c>u.minSpeed&&c>u.endSpeed,v={interaction:n,interactable:n.interactable,element:n.element,rect:n.rect,edges:n.edges,pageCoords:n.coords.cur.page,states:p&&n.modifiers.states.map(function(e){return ca.extend({},e)}),preEnd:!0,prevCoords:null,prevRect:null,requireEndOnly:null,phase:Tn.EventPhase.InertiaStart};return p&&!d&&(v.prevCoords=n.modifiers.result.coords,v.prevRect=n.modifiers.result.rect,v.requireEndOnly=!1,f=(a=la.setAll(v)).changed),d||f?(ca.pointer.copyCoords(i.upCoords,n.coords.cur),la.setCoords(v),n.pointers[0].pointer=i.startEvent=new t.InteractEvent(n,r,n.prepared.name,Tn.EventPhase.InertiaStart,n.element),la.restoreCoords(v),i.t0=s,i.active=!0,i.allowResume=u.allowResume,n.simulation=i,n.interactable.fire(i.startEvent),d?(i.vx0=n.coords.velocity.client.x,i.vy0=n.coords.velocity.client.y,i.v0=c,va(n,i),ca.extend(v.pageCoords,n.coords.cur.page),v.pageCoords.x+=i.xe,v.pageCoords.y+=i.ye,v.prevCoords=null,v.prevRect=null,v.requireEndOnly=!0,a=la.setAll(v),i.modifiedXe+=a.delta.x,i.modifiedYe+=a.delta.y,i.timeout=fa.default.request(function(){return ya(n)})):(i.smoothEnd=!0,i.xe=a.delta.x,i.ye=a.delta.y,i.sx=i.sy=0,i.timeout=fa.default.request(function(){return ma(n)})),!1):null},"interactions:down":function(e,t){var n=e.interaction,r=e.event,o=e.pointer,i=e.eventTarget,a=n.inertia;if(a.active)for(var u=i;ca.is.element(u);){if(u===n.element){fa.default.cancel(a.timeout),a.active=!1,n.simulation=null,n.updatePointer(o,r,i,!0),ca.pointer.setCoords(n.coords.cur,n.pointers.map(function(e){return e.pointer}),n._now());var s={interaction:n,phase:Tn.EventPhase.Resume};t.fire("interactions:action-resume",s);var l=new t.InteractEvent(n,r,n.prepared.name,Tn.EventPhase.Resume,n.element);n._fireEvent(l),ca.pointer.copyCoords(n.coords.prev,n.coords.cur);break}u=ca.dom.parentNode(u);}},"interactions:stop":function(e){var t=e.interaction,n=t.inertia;n.active&&(fa.default.cancel(n.timeout),n.active=!1,t.simulation=null);}},before:["modifiers/base"],calcInertia:va,inertiaTick:ya,smothEndTick:ma,updateInertiaCoords:ga};aa.default=ba;var Oa={};Object.defineProperty(Oa,"__esModule",{value:!0}),Oa.default=void 0;var wa,Pa=(wa=me)&&wa.__esModule?wa:{default:wa};function _a(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter(function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable})),n.push.apply(n,r);}return n}function xa(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?_a(Object(n),!0).forEach(function(e){Sa(t,e,n[e]);}):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):_a(Object(n)).forEach(function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e));});}return t}function Sa(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function ja(e,t,n){var r=e.startCoords,o=e.edgeSign;t?n.y=r.y+(n.x-r.x)*o:n.x=r.x+(n.y-r.y)*o;}function Ma(e,t,n,r){var o=e.startRect,i=e.startCoords,a=e.ratio,u=e.edgeSign;if(t){var s=r.width/a;n.y=i.y+(s-o.height)*u;}else{var l=r.height*a;n.x=i.x+(l-o.width)*u;}}var Ea={start:function(e){var t=e.state,n=e.rect,r=e.edges,o=e.pageCoords,i=t.options.ratio,a=t.options,u=a.equalDelta,s=a.modifiers;"preserve"===i&&(i=n.width/n.height),t.startCoords=(0, Pa.default)({},o),t.startRect=(0, Pa.default)({},n),t.ratio=i,t.equalDelta=u;var l=t.linkedEdges={top:r.top||r.left&&!r.bottom,left:r.left||r.top&&!r.right,bottom:r.bottom||r.right&&!r.top,right:r.right||r.bottom&&!r.left};if(t.xIsPrimaryAxis=!(!r.left&&!r.right),t.equalDelta)t.edgeSign=(l.left?1:-1)*(l.top?1:-1);else{var c=t.xIsPrimaryAxis?l.top:l.left;t.edgeSign=c?-1:1;}if((0, Pa.default)(e.edges,l),s&&s.length)return t.subStates=(0, Fi.prepareStates)(s).map(function(e){return e.options=xa({},e.options),e}),(0, Fi.startAll)(xa({},e,{states:t.subStates}))},set:function(e){var t=e.state,n=e.rect,r=e.coords,o=(0, Pa.default)({},r),i=t.equalDelta?ja:Ma;if(i(t,t.xIsPrimaryAxis,r,n),!t.subStates)return null;var a=(0, Pa.default)({},n);(0, ge.addEdges)(t.linkedEdges,a,{x:r.x-o.x,y:r.y-o.y});var u=(0, Fi.setAll)(xa({},e,{rect:a,edges:t.linkedEdges,pageCoords:r,states:t.subStates,prevCoords:r,prevRect:a})),s=u.delta;u.changed&&(i(t,Math.abs(s.x)>Math.abs(s.y),u.coords,u.rect),(0, Pa.default)(r,u.coords));return u.eventProps},defaults:{ratio:"preserve",equalDelta:!1,modifiers:[],enabled:!1}};Oa.default=Ea;var ka={};function Da(e){return (Da="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(ka,"__esModule",{value:!0}),ka.getRestrictionRect=Wa,ka.default=void 0;var Ta,Ia=(Ta=me)&&Ta.__esModule?Ta:{default:Ta},Aa=Ra(y),za=Ra(ge);function Ca(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return Ca=function(){return e},e}function Ra(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Da(e)&&"function"!=typeof e)return {default:e};var t=Ca();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}return n.default=e,t&&t.set(e,n),n}function Wa(e,t,n){return Aa.func(e)?za.resolveRectLike(e,t.interactable,t.element,[n.x,n.y,t]):za.resolveRectLike(e,t.interactable,t.element)}var Xa={start:function(e){var t=e.rect,n=e.startOffset,r=e.state,o=e.interaction,i=e.pageCoords,a=r.options,u=a.elementRect,s=(0, Ia.default)({left:0,top:0,right:0,bottom:0},a.offset||{});if(t&&u){var l=Wa(a.restriction,o,i);if(l){var c=l.right-l.left-t.width,f=l.bottom-l.top-t.height;c<0&&(s.left+=c,s.right+=c),f<0&&(s.top+=f,s.bottom+=f);}s.left+=n.left-t.width*u.left,s.top+=n.top-t.height*u.top,s.right+=n.right-t.width*(1-u.right),s.bottom+=n.bottom-t.height*(1-u.bottom);}r.offset=s;},set:function(e){var t=e.coords,n=e.interaction,r=e.state,o=r.options,i=r.offset,a=Wa(o.restriction,n,t);if(a){var u=za.xywhToTlbr(a);t.x=Math.max(Math.min(u.right-i.right,t.x),u.left+i.left),t.y=Math.max(Math.min(u.bottom-i.bottom,t.y),u.top+i.top);}},defaults:{restriction:null,elementRect:null,offset:null,endOnly:!1,enabled:!1}};ka.default=Xa;var Na={};function Ya(e){return (Ya="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(Na,"__esModule",{value:!0}),Na.default=void 0;var Fa,La=(Fa=me)&&Fa.__esModule?Fa:{default:Fa},qa=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Ya(e)&&"function"!=typeof e)return {default:e};var t=Va();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(ge);function Va(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return Va=function(){return e},e}var Ga={top:1/0,left:1/0,bottom:-1/0,right:-1/0},Ua={top:-1/0,left:-1/0,bottom:1/0,right:1/0};function Ba(e,t){for(var n=["top","left","bottom","right"],r=0;r<n.length;r++){var o=n[r];o in e||(e[o]=t[o]);}return e}var Ha={noInner:Ga,noOuter:Ua,start:function(e){var t,n=e.interaction,r=e.startOffset,o=e.state,i=o.options;if(i){var a=(0, ka.getRestrictionRect)(i.offset,n,n.coords.start.page);t=qa.rectToXY(a);}t=t||{x:0,y:0},o.offset={top:t.y+r.top,left:t.x+r.left,bottom:t.y-r.bottom,right:t.x-r.right};},set:function(e){var t=e.coords,n=e.edges,r=e.interaction,o=e.state,i=o.offset,a=o.options;if(n){var u=(0, La.default)({},t),s=(0, ka.getRestrictionRect)(a.inner,r,u)||{},l=(0, ka.getRestrictionRect)(a.outer,r,u)||{};Ba(s,Ga),Ba(l,Ua),n.top?t.y=Math.min(Math.max(l.top+i.top,u.y),s.top+i.top):n.bottom&&(t.y=Math.max(Math.min(l.bottom+i.bottom,u.y),s.bottom+i.bottom)),n.left?t.x=Math.min(Math.max(l.left+i.left,u.x),s.left+i.left):n.right&&(t.x=Math.max(Math.min(l.right+i.right,u.x),s.right+i.right));}},defaults:{inner:null,outer:null,offset:null,endOnly:!1,enabled:!1}};Na.default=Ha;var Ka={};Object.defineProperty(Ka,"__esModule",{value:!0}),Ka.default=void 0;var $a=Za(me),Qa=Za(ka);function Za(e){return e&&e.__esModule?e:{default:e}}var Ja=(0, $a.default)({get elementRect(){return {top:0,left:0,bottom:1,right:1}},set elementRect(e){}},Qa.default.defaults),eu={start:Qa.default.start,set:Qa.default.set,defaults:Ja};Ka.default=eu;var tu={};function nu(e){return (nu="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(tu,"__esModule",{value:!0}),tu.default=void 0;var ru=uu(me),ou=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==nu(e)&&"function"!=typeof e)return {default:e};var t=au();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(ge),iu=uu(Na);function au(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return au=function(){return e},e}function uu(e){return e&&e.__esModule?e:{default:e}}var su={width:-1/0,height:-1/0},lu={width:1/0,height:1/0};var cu={start:function(e){return iu.default.start(e)},set:function(e){var t=e.interaction,n=e.state,r=e.rect,o=e.edges,i=n.options;if(o){var a=ou.tlbrToXywh((0, ka.getRestrictionRect)(i.min,t,e.coords))||su,u=ou.tlbrToXywh((0, ka.getRestrictionRect)(i.max,t,e.coords))||lu;n.options={endOnly:i.endOnly,inner:(0, ru.default)({},iu.default.noInner),outer:(0, ru.default)({},iu.default.noOuter)},o.top?(n.options.inner.top=r.bottom-a.height,n.options.outer.top=r.bottom-u.height):o.bottom&&(n.options.inner.bottom=r.top+a.height,n.options.outer.bottom=r.top+u.height),o.left?(n.options.inner.left=r.right-a.width,n.options.outer.left=r.right-u.width):o.right&&(n.options.inner.right=r.left+a.width,n.options.outer.right=r.left+u.width),iu.default.set(e),n.options=i;}},defaults:{min:null,max:null,endOnly:!1,enabled:!1}};tu.default=cu;var fu={};function pu(e){return (pu="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(fu,"__esModule",{value:!0}),fu.default=void 0;var du=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==pu(e)&&"function"!=typeof e)return {default:e};var t=vu();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(pt);function vu(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return vu=function(){return e},e}var yu={start:function(e){var t,n,r,o=e.interaction,i=e.interactable,a=e.element,u=e.rect,s=e.state,l=e.startOffset,c=s.options,f=c.offsetWithOrigin?(n=(t=e).interaction.element,du.rect.rectToXY(du.rect.resolveRectLike(t.state.options.origin,null,null,[n]))||du.getOriginXY(t.interactable,n,t.interaction.prepared.name)):{x:0,y:0};if("startCoords"===c.offset)r={x:o.coords.start.page.x,y:o.coords.start.page.y};else{var p=du.rect.resolveRectLike(c.offset,i,a,[o]);(r=du.rect.rectToXY(p)||{x:0,y:0}).x+=f.x,r.y+=f.y;}var d=c.relativePoints;s.offsets=u&&d&&d.length?d.map(function(e,t){return {index:t,relativePoint:e,x:l.left-u.width*e.x+r.x,y:l.top-u.height*e.y+r.y}}):[du.extend({index:0,relativePoint:null},r)];},set:function(e){var t=e.interaction,n=e.coords,r=e.state,o=r.options,i=r.offsets,a=du.getOriginXY(t.interactable,t.element,t.prepared.name),u=du.extend({},n),s=[];o.offsetWithOrigin||(u.x-=a.x,u.y-=a.y);for(var l=0;l<i.length;l++)for(var c=i[l],f=u.x-c.x,p=u.y-c.y,d=0,v=o.targets.length;d<v;d++){var y=o.targets[d],m=void 0;(m=du.is.func(y)?y(f,p,t,c,d):y)&&s.push({x:(du.is.number(m.x)?m.x:f)+c.x,y:(du.is.number(m.y)?m.y:p)+c.y,range:du.is.number(m.range)?m.range:o.range,source:y,index:d,offset:c});}for(var g={target:null,inRange:!1,distance:0,range:0,delta:{x:0,y:0}},h=0;h<s.length;h++){var b=s[h],O=b.range,w=b.x-u.x,P=b.y-u.y,_=du.hypot(w,P),x=_<=O;O===1/0&&g.inRange&&g.range!==1/0&&(x=!1),g.target&&!(x?g.inRange&&O!==1/0?_/O<g.distance/g.range:O===1/0&&g.range!==1/0||_<g.distance:!g.inRange&&_<g.distance)||(g.target=b,g.distance=_,g.range=O,g.inRange=x,g.delta.x=w,g.delta.y=P);}return g.inRange&&(n.x=g.target.x,n.y=g.target.y),r.closest=g},defaults:{range:1/0,targets:null,offset:null,offsetWithOrigin:!0,origin:null,relativePoints:null,endOnly:!1,enabled:!1}};fu.default=yu;var mu={};function gu(e){return (gu="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(mu,"__esModule",{value:!0}),mu.default=void 0;var hu=Pu(me),bu=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==gu(e)&&"function"!=typeof e)return {default:e};var t=wu();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(y),Ou=Pu(fu);function wu(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return wu=function(){return e},e}function Pu(e){return e&&e.__esModule?e:{default:e}}function _u(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){if(!(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e)))return;var n=[],r=!0,o=!1,i=void 0;try{for(var a,u=e[Symbol.iterator]();!(r=(a=u.next()).done)&&(n.push(a.value),!t||n.length!==t);r=!0);}catch(e){o=!0,i=e;}finally{try{r||null==u.return||u.return();}finally{if(o)throw i}}return n}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}var xu={start:function(e){var t=e.state,n=e.edges,r=t.options;if(!n)return null;e.state={options:{targets:null,relativePoints:[{x:n.left?0:1,y:n.top?0:1}],offset:r.offset||"self",origin:{x:0,y:0},range:r.range}},t.targetFields=t.targetFields||[["width","height"],["x","y"]],Ou.default.start(e),t.offsets=e.state.offsets,e.state=t;},set:function(e){var t=e.interaction,n=e.state,r=e.coords,o=n.options,i=n.offsets,a={x:r.x-i[0].x,y:r.y-i[0].y};n.options=(0, hu.default)({},o),n.options.targets=[];for(var u=0;u<(o.targets||[]).length;u++){var s=(o.targets||[])[u],l=void 0;if(l=bu.func(s)?s(a.x,a.y,t):s){for(var c=0;c<n.targetFields.length;c++){var f=_u(n.targetFields[c],2),p=f[0],d=f[1];if(p in l||d in l){l.x=l[p],l.y=l[d];break}}n.options.targets.push(l);}}var v=Ou.default.set(e);return n.options=o,v},defaults:{range:1/0,targets:null,offset:null,endOnly:!1,enabled:!1}};mu.default=xu;var Su={};Object.defineProperty(Su,"__esModule",{value:!0}),Su.default=void 0;var ju=ku(xe),Mu=ku(me),Eu=ku(mu);function ku(e){return e&&e.__esModule?e:{default:e}}var Du={start:function(e){var t=e.edges;return t?(e.state.targetFields=e.state.targetFields||[[t.left?"left":"right",t.top?"top":"bottom"]],Eu.default.start(e)):null},set:Eu.default.set,defaults:(0, Mu.default)((0, ju.default)(Eu.default.defaults),{offset:{x:0,y:0}})};Su.default=Du;var Tu={};Object.defineProperty(Tu,"__esModule",{value:!0}),Tu.aspectRatio=Tu.restrictSize=Tu.restrictEdges=Tu.restrictRect=Tu.restrict=Tu.snapEdges=Tu.snapSize=Tu.snap=void 0;var Iu=Yu(Oa),Au=Yu(Na),zu=Yu(ka),Cu=Yu(Ka),Ru=Yu(tu),Wu=Yu(Su),Xu=Yu(fu),Nu=Yu(mu);function Yu(e){return e&&e.__esModule?e:{default:e}}var Fu=(0, Fi.makeModifier)(Xu.default,"snap");Tu.snap=Fu;var Lu=(0, Fi.makeModifier)(Nu.default,"snapSize");Tu.snapSize=Lu;var qu=(0, Fi.makeModifier)(Wu.default,"snapEdges");Tu.snapEdges=qu;var Vu=(0, Fi.makeModifier)(zu.default,"restrict");Tu.restrict=Vu;var Gu=(0, Fi.makeModifier)(Cu.default,"restrictRect");Tu.restrictRect=Gu;var Uu=(0, Fi.makeModifier)(Au.default,"restrictEdges");Tu.restrictEdges=Uu;var Bu=(0, Fi.makeModifier)(Ru.default,"restrictSize");Tu.restrictSize=Bu;var Hu=(0, Fi.makeModifier)(Iu.default,"aspectRatio");Tu.aspectRatio=Hu;var Ku={};Object.defineProperty(Ku,"__esModule",{value:!0}),Ku.PointerEvent=Ku.default=void 0;var $u,Qu=($u=Sn)&&$u.__esModule?$u:{default:$u},Zu=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==es(e)&&"function"!=typeof e)return {default:e};var t=Ju();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(J);function Ju(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return Ju=function(){return e},e}function es(e){return (es="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function ts(e,t){for(var n=0;n<t.length;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}function ns(e){return (ns=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function rs(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function os(e,t){return (os=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function is(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var as=function(){function f(e,t,n,r,o,i){var a,u,s;if(!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,f),u=this,a=!(s=ns(f).call(this,o))||"object"!==es(s)&&"function"!=typeof s?rs(u):s,is(rs(a),"type",void 0),is(rs(a),"originalEvent",void 0),is(rs(a),"pointerId",void 0),is(rs(a),"pointerType",void 0),is(rs(a),"double",void 0),is(rs(a),"pageX",void 0),is(rs(a),"pageY",void 0),is(rs(a),"clientX",void 0),is(rs(a),"clientY",void 0),is(rs(a),"dt",void 0),is(rs(a),"eventable",void 0),Zu.pointerExtend(rs(a),n),n!==t&&Zu.pointerExtend(rs(a),t),a.timeStamp=i,a.originalEvent=n,a.type=e,a.pointerId=Zu.getPointerId(t),a.pointerType=Zu.getPointerType(t),a.target=r,a.currentTarget=null,"tap"===e){var l=o.getPointerIndex(t);a.dt=a.timeStamp-o.pointers[l].downTime;var c=a.timeStamp-o.tapTime;a.double=!!(o.prevTap&&"doubletap"!==o.prevTap.type&&o.prevTap.target===a.target&&c<500);}else"doubletap"===e&&(a.dt=t.timeStamp-o.tapTime);return a}var e,t;return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&os(e,t);}(f,Qu["default"]),e=f,(t=[{key:"_subtractOrigin",value:function(e){var t=e.x,n=e.y;return this.pageX-=t,this.pageY-=n,this.clientX-=t,this.clientY-=n,this}},{key:"_addOrigin",value:function(e){var t=e.x,n=e.y;return this.pageX+=t,this.pageY+=n,this.clientX+=t,this.clientY+=n,this}},{key:"preventDefault",value:function(){this.originalEvent.preventDefault();}}])&&ts(e.prototype,t),f}();Ku.PointerEvent=Ku.default=as;var us={};function ss(e){return (ss="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(us,"__esModule",{value:!0}),us.default=void 0;ps(g({})),O({});var ls=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==ss(e)&&"function"!=typeof e)return {default:e};var t=fs();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(pt),cs=ps(Ku);function fs(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return fs=function(){return e},e}function ps(e){return e&&e.__esModule?e:{default:e}}var ds={id:"pointer-events/base",install:function(e){e.pointerEvents=ds,e.defaults.actions.pointerEvents=ds.defaults;},listeners:{"interactions:new":function(e){var t=e.interaction;t.prevTap=null,t.tapTime=0;},"interactions:update-pointer":function(e){var t=e.down,n=e.pointerInfo;if(!t&&n.hold)return;n.hold={duration:1/0,timeout:null};},"interactions:move":function(e,t){var n=e.interaction,r=e.pointer,o=e.event,i=e.eventTarget,a=e.duplicate,u=n.getPointerIndex(r);a||n.pointerIsDown&&!n.pointerWasMoved||(n.pointerIsDown&&clearTimeout(n.pointers[u].hold.timeout),vs({interaction:n,pointer:r,event:o,eventTarget:i,type:"move"},t));},"interactions:down":function(e,t){!function(e,t){for(var n=e.interaction,r=e.pointer,o=e.event,i=e.eventTarget,a=e.pointerIndex,u=n.pointers[a].hold,s=ls.dom.getPath(i),l={interaction:n,pointer:r,event:o,eventTarget:i,type:"hold",targets:[],path:s,node:null},c=0;c<s.length;c++){var f=s[c];l.node=f,t.fire("pointerEvents:collect-targets",l);}if(!l.targets.length)return;for(var p=1/0,d=0;d<l.targets.length;d++){var v=l.targets[d].eventable.options.holdDuration;v<p&&(p=v);}u.duration=p,u.timeout=setTimeout(function(){vs({interaction:n,eventTarget:i,pointer:r,event:o,type:"hold"},t);},p);}(e,t),vs(e,t);},"interactions:up":function(e,t){var n,r,o,i,a,u;ms(e),vs(e,t),r=t,o=(n=e).interaction,i=n.pointer,a=n.event,u=n.eventTarget,o.pointerWasMoved||vs({interaction:o,eventTarget:u,pointer:i,event:a,type:"tap"},r);},"interactions:cancel":function(e,t){ms(e),vs(e,t);}},PointerEvent:cs.default,fire:vs,collectEventTargets:ys,defaults:{holdDuration:600,ignoreFrom:null,allowFrom:null,origin:{x:0,y:0}},types:["down","move","up","cancel","tap","doubletap","hold"]};function vs(e,t){var n=e.interaction,r=e.pointer,o=e.event,i=e.eventTarget,a=e.type,u=e.targets,s=void 0===u?ys(e,t):u,l=new cs.default(a,r,o,i,n,t.now());t.fire("pointerEvents:new",{pointerEvent:l});for(var c={interaction:n,pointer:r,event:o,eventTarget:i,targets:s,type:a,pointerEvent:l},f=0;f<s.length;f++){var p=s[f];for(var d in p.props||{})l[d]=p.props[d];var v=ls.getOriginXY(p.eventable,p.node);if(l._subtractOrigin(v),l.eventable=p.eventable,l.currentTarget=p.node,p.eventable.fire(l),l._addOrigin(v),l.immediatePropagationStopped||l.propagationStopped&&f+1<s.length&&s[f+1].node!==l.currentTarget)break}if(t.fire("pointerEvents:fired",c),"tap"===a){var y=l.double?vs({interaction:n,pointer:r,event:o,eventTarget:i,type:"doubletap"},t):l;n.prevTap=y,n.tapTime=y.timeStamp;}return l}function ys(e,t){var n=e.interaction,r=e.pointer,o=e.event,i=e.eventTarget,a=e.type,u=n.getPointerIndex(r),s=n.pointers[u];if("tap"===a&&(n.pointerWasMoved||!s||s.downTarget!==i))return [];for(var l=ls.dom.getPath(i),c={interaction:n,pointer:r,event:o,eventTarget:i,type:a,path:l,targets:[],node:null},f=0;f<l.length;f++){var p=l[f];c.node=p,t.fire("pointerEvents:collect-targets",c);}return "hold"===a&&(c.targets=c.targets.filter(function(e){return e.eventable.options.holdDuration===n.pointers[u].hold.duration})),c.targets}function ms(e){var t=e.interaction,n=e.pointerIndex;t.pointers[n].hold&&clearTimeout(t.pointers[n].hold.timeout);}var gs=ds;us.default=gs;var hs={};Object.defineProperty(hs,"__esModule",{value:!0}),hs.default=void 0;var bs=Os(us);Os(Ku);function Os(e){return e&&e.__esModule?e:{default:e}}function ws(e){var t=e.interaction;t.holdIntervalHandle&&(clearInterval(t.holdIntervalHandle),t.holdIntervalHandle=null);}var Ps={id:"pointer-events/holdRepeat",install:function(e){e.usePlugin(bs.default);var t=e.pointerEvents;t.defaults.holdRepeatInterval=0,t.types.push("holdrepeat");},listeners:["move","up","cancel","endall"].reduce(function(e,t){return e["pointerEvents:".concat(t)]=ws,e},{"pointerEvents:new":function(e){var t=e.pointerEvent;"hold"===t.type&&(t.count=(t.count||0)+1);},"pointerEvents:fired":function(e,t){var n=e.interaction,r=e.pointerEvent,o=e.eventTarget,i=e.targets;if("hold"===r.type&&i.length){var a=i[0].eventable.options.holdRepeatInterval;a<=0||(n.holdIntervalHandle=setTimeout(function(){t.pointerEvents.fire({interaction:n,eventTarget:o,type:"hold",pointer:r,event:r},t);},a));}}})};hs.default=Ps;var _s={};Object.defineProperty(_s,"__esModule",{value:!0}),_s.default=void 0;var xs,Ss=(xs=me)&&xs.__esModule?xs:{default:xs};function js(e){return (0, Ss.default)(this.events.options,e),this}var Ms={id:"pointer-events/interactableTargets",install:function(e){var t=e.pointerEvents,n=e.actions,r=e.Interactable;(0, u.merge)(n.eventTypes,t.types),r.prototype.pointerEvents=js;var o=r.prototype._backCompatOption;r.prototype._backCompatOption=function(e,t){var n=o.call(this,e,t);return n===this&&(this.events.options[e]=t),n};},listeners:{"pointerEvents:collect-targets":function(e,t){var r=e.targets,o=e.node,i=e.type,a=e.eventTarget;t.interactables.forEachMatch(o,function(e){var t=e.events,n=t.options;t.types[i]&&t.types[i].length&&e.testIgnoreAllow(n,o,a)&&r.push({node:o,eventable:t,props:{interactable:e}});});},"interactable:new":function(e){var t=e.interactable;t.events.getRect=function(e){return t.getRect(e)};},"interactable:set":function(e,t){var n=e.interactable,r=e.options;(0, Ss.default)(n.events.options,t.pointerEvents.defaults),(0, Ss.default)(n.events.options,r.pointerEvents||{});}}};_s.default=Ms;var Es={};function ks(e){return (ks="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(Es,"__esModule",{value:!0}),Es.install=function(e){e.usePlugin(Ds),e.usePlugin(Ts.default),e.usePlugin(Is.default);},Object.defineProperty(Es,"holdRepeat",{enumerable:!0,get:function(){return Ts.default}}),Object.defineProperty(Es,"interactableTargets",{enumerable:!0,get:function(){return Is.default}}),Es.pointerEvents=Es.id=void 0;var Ds=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==ks(e)&&"function"!=typeof e)return {default:e};var t=zs();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(us);Es.pointerEvents=Ds;var Ts=As(hs),Is=As(_s);function As(e){return e&&e.__esModule?e:{default:e}}function zs(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return zs=function(){return e},e}Es.id="pointer-events";var Cs={};Object.defineProperty(Cs,"__esModule",{value:!0}),Cs.install=Ws,Cs.default=void 0;var Rs;(Rs=Ut)&&Rs.__esModule,g({});function Ws(t){for(var e=t.actions,n=t.Interactable,r=0;r<e.names.length;r++){var o=e.names[r];e.eventTypes.push("".concat(o,"reflow"));}n.prototype.reflow=function(e){return function(u,s,l){function e(){var t=c[d],e=u.getRect(t);if(!e)return "break";var n=pt.arr.find(l.interactions.list,function(e){return e.interacting()&&e.interactable===u&&e.element===t&&e.prepared.name===s.name}),r=void 0;if(n)n.move(),p&&(r=n._reflowPromise||new f(function(e){n._reflowResolve=e;}));else{var o=pt.rect.tlbrToXywh(e),i={page:{x:o.x,y:o.y},client:{x:o.x,y:o.y},timeStamp:l.now()},a=pt.pointer.coordsToEvent(i);r=function(e,t,n,r,o){var i=e.interactions.new({pointerType:"reflow"}),a={interaction:i,event:o,pointer:o,eventTarget:n,phase:Tn.EventPhase.Reflow};i.interactable=t,i.element=n,i.prepared=(0, pt.extend)({},r),i.prevEvent=o,i.updatePointer(o,o,n,!0),i._doPhase(a);var u=pt.win.window.Promise?new pt.win.window.Promise(function(e){i._reflowResolve=e;}):null;i._reflowPromise=u,i.start(r,t,n),i._interacting?(i.move(a),i.end(o)):i.stop();return i.removePointer(o,o),i.pointerIsDown=!1,u}(l,u,t,s,a);}p&&p.push(r);}for(var c=pt.is.string(u.target)?pt.arr.from(u._context.querySelectorAll(u.target)):[u.target],f=pt.win.window.Promise,p=f?[]:null,d=0;d<c.length;d++){if("break"===e())break}return p&&f.all(p).then(function(){return u})}(this,e,t)};}var Xs={id:Tn.EventPhase.Reflow="reflow",install:Ws,listeners:{"interactions:stop":function(e,t){var n=e.interaction;n.pointerType===Tn.EventPhase.Reflow&&(n._reflowResolve&&n._reflowResolve(),pt.arr.remove(t.interactions.list,n));}}};Cs.default=Xs;var Ns={};function Ys(e){return (Ys="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(Ns,"__esModule",{value:!0}),Ns.default=Ns.scope=Ns.interact=void 0;var Fs=O({}),Ls=Us(j),qs=Us(De),Vs=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Ys(e)&&"function"!=typeof e)return {default:e};var t=Gs();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(pt);function Gs(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return Gs=function(){return e},e}function Us(e){return e&&e.__esModule?e:{default:e}}var Bs={},Hs=new Fs.Scope;Ns.scope=Hs;function Ks(e,t){var n=Hs.interactables.get(e,t);return n||((n=Hs.interactables.new(e,t)).events.global=Bs),n}(Ns.interact=Ks).use=function(e,t){return Hs.usePlugin(e,t),Ks},Ks.isSet=function(e,t){return !!Hs.interactables.get(e,t&&t.context)},Ks.on=function(e,t,n){Vs.is.string(e)&&-1!==e.search(" ")&&(e=e.trim().split(/ +/));if(Vs.is.array(e)){for(var r=0;r<e.length;r++){var o;o=e[r],Ks.on(o,t,n);}return Ks}if(Vs.is.object(e)){for(var i in e)Ks.on(i,e[i],t);return Ks}Vs.arr.contains(Hs.actions.eventTypes,e)?Bs[e]?Bs[e].push(t):Bs[e]=[t]:qs.default.add(Hs.document,e,t,{options:n});return Ks},Ks.off=function(e,t,n){Vs.is.string(e)&&-1!==e.search(" ")&&(e=e.trim().split(/ +/));if(Vs.is.array(e)){for(var r=0;r<e.length;r++){var o;o=e[r],Ks.off(o,t,n);}return Ks}if(Vs.is.object(e)){for(var i in e)Ks.off(i,e[i],t);return Ks}var a;Vs.arr.contains(Hs.actions.eventTypes,e)?e in Bs&&-1!==(a=Bs[e].indexOf(t))&&Bs[e].splice(a,1):qs.default.remove(Hs.document,e,t,n);return Ks},Ks.debug=function(){return Hs},Ks.getPointerAverage=Vs.pointer.pointerAverage,Ks.getTouchBBox=Vs.pointer.touchBBox,Ks.getTouchDistance=Vs.pointer.touchDistance,Ks.getTouchAngle=Vs.pointer.touchAngle,Ks.getElementRect=Vs.dom.getElementRect,Ks.getElementClientRect=Vs.dom.getElementClientRect,Ks.matchesSelector=Vs.dom.matchesSelector,Ks.closest=Vs.dom.closest,Ks.supportsTouch=function(){return Ls.default.supportsTouch},Ks.supportsPointerEvent=function(){return Ls.default.supportsPointerEvent},Ks.stop=function(){for(var e=0;e<Hs.interactions.list.length;e++){Hs.interactions.list[e].stop();}return Ks},Ks.pointerMoveTolerance=function(e){if(Vs.is.number(e))return Hs.interactions.pointerMoveTolerance=e,Ks;return Hs.interactions.pointerMoveTolerance},Hs.addListeners({"interactable:unset":function(e){var t=e.interactable;Hs.interactables.list.splice(Hs.interactables.list.indexOf(t),1);for(var n=0;n<Hs.interactions.list.length;n++){var r=Hs.interactions.list[n];r.interactable===t&&r.interacting()&&!r._ending&&r.stop();}}}),Ks.addDocument=function(e,t){return Hs.addDocument(e,t)},Ks.removeDocument=function(e){return Hs.removeDocument(e)};var $s=Hs.interact=Ks;Ns.default=$s;var Qs={};function Zs(e){return (Zs="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}Object.defineProperty(Qs,"__esModule",{value:!0}),Qs.init=function(e){for(var t in sl.scope.init(e),sl.default.use(nl.default),sl.default.use(al),sl.default.use(rl.default),sl.default.use(ol.default),sl.default.use(tl),sl.default.use(Js),il){var n=il[t],r=n._defaults,o=n._methods;r._methods=o,sl.scope.defaults.perAction[t]=r;}sl.default.use(el.default),sl.default.use(ul.default),0;return sl.default},Qs.default=void 0;var Js=fl(vo),el=ll(Oo),tl=fl(di),nl=ll(hi),rl=(ll(Ei),ll(aa)),ol=ll(Fi),il=fl(Tu),al=fl(Es),ul=ll(Cs),sl=fl(Ns);function ll(e){return e&&e.__esModule?e:{default:e}}function cl(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return cl=function(){return e},e}function fl(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Zs(e)&&"function"!=typeof e)return {default:e};var t=cl();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}return n.default=e,t&&t.set(e,n),n}sl.default.version="1.8.4";var pl=sl.default;Qs.default=pl;var dl={};function vl(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){if(!(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e)))return;var n=[],r=!0,o=!1,i=void 0;try{for(var a,u=e[Symbol.iterator]();!(r=(a=u.next()).done)&&(n.push(a.value),!t||n.length!==t);r=!0);}catch(e){o=!0,i=e;}finally{try{r||null==u.return||u.return();}finally{if(o)throw i}}return n}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}Object.defineProperty(dl,"__esModule",{value:!0}),dl.default=void 0;function yl(v){function e(e,t){for(var n=v.range,r=v.limits,o=void 0===r?{left:-1/0,right:1/0,top:-1/0,bottom:1/0}:r,i=v.offset,a=void 0===i?{x:0,y:0}:i,u={range:n,grid:v,x:null,y:null},s=0;s<y.length;s++){var l=vl(y[s],2),c=l[0],f=l[1],p=Math.round((e-a.x)/v[c]),d=Math.round((t-a.y)/v[f]);u[c]=Math.max(o.left,Math.min(o.right,p*v[c]+a.x)),u[f]=Math.max(o.top,Math.min(o.bottom,d*v[f]+a.y));}return u}var y=[["x","y"],["left","top"],["right","bottom"],["width","height"]].filter(function(e){var t=vl(e,2),n=t[0],r=t[1];return n in v||r in v});return e.grid=v,e.coordFields=y,e}dl.default=yl;var ml={};Object.defineProperty(ml,"__esModule",{value:!0}),Object.defineProperty(ml,"grid",{enumerable:!0,get:function(){return hl.default}});var gl,hl=(gl=dl)&&gl.__esModule?gl:{default:gl};var bl={};Object.defineProperty(bl,"__esModule",{value:!0}),bl.init=El,bl.default=void 0;var Ol,wl=jl(Qs),Pl=jl(Tu),_l=(Ol=me)&&Ol.__esModule?Ol:{default:Ol},xl=jl(ml);function Sl(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return Sl=function(){return e},e}function jl(e){if(e&&e.__esModule)return e;if(null===e||"object"!==Ml(e)&&"function"!=typeof e)return {default:e};var t=Sl();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}return n.default=e,t&&t.set(e,n),n}function Ml(e){return (Ml="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function El(e){return (0, wl.init)(e),wl.default.use({id:"interactjs",install:function(){wl.default.modifiers=(0, _l.default)({},Pl),wl.default.snappers=xl,wl.default.createSnapGrid=wl.default.snappers.grid;}})}"object"===("undefined"==typeof window?"undefined":Ml(window))&&window&&El(window);var kl=wl.default;bl.default=kl;var Dl={exports:{}};Object.defineProperty(Dl.exports,"__esModule",{value:!0});var Tl={};Dl.exports.default=void 0;var Il=function(e){if(e&&e.__esModule)return e;if(null===e||"object"!==zl(e)&&"function"!=typeof e)return {default:e};var t=Al();if(t&&t.has(e))return t.get(e);var n={},r=Object.defineProperty&&Object.getOwnPropertyDescriptor;for(var o in e)if(Object.prototype.hasOwnProperty.call(e,o)){var i=r?Object.getOwnPropertyDescriptor(e,o):null;i&&(i.get||i.set)?Object.defineProperty(n,o,i):n[o]=e[o];}n.default=e,t&&t.set(e,n);return n}(bl);function Al(){if("function"!=typeof WeakMap)return null;var e=new WeakMap;return Al=function(){return e},e}function zl(e){return (zl="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}if(Object.keys(Il).forEach(function(e){"default"!==e&&"__esModule"!==e&&(Object.prototype.hasOwnProperty.call(Tl,e)||Object.defineProperty(Dl.exports,e,{enumerable:!0,get:function(){return Il[e]}}));}),"object"===zl(Dl)&&Dl)try{Dl.exports=Il.default;}catch(e){}Il.default.default=Il.default,Il.default.init=Il.init;var Cl=Il.default;return Dl.exports.default=Cl,Dl=Dl.exports});

    //# sourceMappingURL=interact.min.js.map
    });

    var interact = unwrapExports(interact_min);

    /* src/Dictionary.svelte generated by Svelte v3.18.2 */
    const file$9 = "src/Dictionary.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    // (115:6) {#if !preview}
    function create_if_block$1(ctx) {
    	let t;
    	let if_block_anchor;
    	let each_value_1 = /*suffixes*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let if_block = /*suffixes*/ ctx[2].length == 0 && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*suffixes, elsOffset, els*/ 388) {
    				each_value_1 = /*suffixes*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(t.parentNode, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (/*suffixes*/ ctx[2].length == 0) {
    				if (!if_block) {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(115:6) {#if !preview}",
    		ctx
    	});

    	return block;
    }

    // (116:8) {#each suffixes as suffix}
    function create_each_block_1(ctx) {
    	let span;
    	let t_value = /*suffix*/ ctx[20] + "";
    	let t;
    	let span_id_value;
    	let suffix = /*suffix*/ ctx[20];
    	let dispose;
    	const assign_span = () => /*span_binding*/ ctx[14](span, suffix);
    	const unassign_span = () => /*span_binding*/ ctx[14](null, suffix);

    	function dragstart_handler(...args) {
    		return /*dragstart_handler*/ ctx[15](/*suffix*/ ctx[20], ...args);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "id", span_id_value = /*suffix*/ ctx[20]);
    			set_style(span, "transform", "translate(" + /*elsOffset*/ ctx[8][/*suffix*/ ctx[20]].x + "px, " + /*elsOffset*/ ctx[8][/*suffix*/ ctx[20]].y + "px)");
    			attr_dev(span, "class", "suffix draggable svelte-16z88ea");
    			attr_dev(span, "draggable", "true");
    			add_location(span, file$9, 116, 10, 3648);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    			assign_span();
    			dispose = listen_dev(span, "dragstart", dragstart_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*suffixes*/ 4 && t_value !== (t_value = /*suffix*/ ctx[20] + "")) set_data_dev(t, t_value);

    			if (dirty & /*suffixes*/ 4 && span_id_value !== (span_id_value = /*suffix*/ ctx[20])) {
    				attr_dev(span, "id", span_id_value);
    			}

    			if (dirty & /*elsOffset, suffixes*/ 260) {
    				set_style(span, "transform", "translate(" + /*elsOffset*/ ctx[8][/*suffix*/ ctx[20]].x + "px, " + /*elsOffset*/ ctx[8][/*suffix*/ ctx[20]].y + "px)");
    			}

    			if (suffix !== /*suffix*/ ctx[20]) {
    				unassign_span();
    				suffix = /*suffix*/ ctx[20];
    				assign_span();
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			unassign_span();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(116:8) {#each suffixes as suffix}",
    		ctx
    	});

    	return block;
    }

    // (129:8) {#if suffixes.length == 0}
    function create_if_block_1$1(ctx) {
    	let img;
    	let img_src_value;
    	let t0;
    	let h3;

    	const block = {
    		c: function create() {
    			img = element("img");
    			t0 = space();
    			h3 = element("h3");
    			h3.textContent = "All done!";
    			attr_dev(img, "class", "party");
    			if (img.src !== (img_src_value = "/party.svg")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$9, 129, 10, 4080);
    			add_location(h3, file$9, 130, 10, 4129);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h3, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(129:8) {#if suffixes.length == 0}",
    		ctx
    	});

    	return block;
    }

    // (136:6) {#each source as answer}
    function create_each_block$1(ctx) {
    	let div;
    	let h3;
    	let t0_value = /*answer*/ ctx[17][0] + "";
    	let t0;
    	let t1;
    	let p;

    	let t2_value = (/*dropzoneComplete*/ ctx[4][/*answer*/ ctx[17][2]] || /*preview*/ ctx[6]
    	? /*answer*/ ctx[17][1].slice(0, -1) + /*answer*/ ctx[17][2].slice(1)
    	: /*answer*/ ctx[17][1]) + "";

    	let t2;
    	let t3;
    	let div_class_value;
    	let div_id_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			attr_dev(h3, "class", "subtitle");
    			add_location(h3, file$9, 139, 10, 4369);
    			attr_dev(p, "class", "match");
    			add_location(p, file$9, 140, 10, 4417);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(`box dropzone ${/*dropzoneClasses*/ ctx[3][/*answer*/ ctx[17][2]].join(" ")}`) + " svelte-16z88ea"));
    			attr_dev(div, "id", div_id_value = "box" + /*answer*/ ctx[17][2]);
    			add_location(div, file$9, 136, 8, 4250);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			append_dev(div, t1);
    			append_dev(div, p);
    			append_dev(p, t2);
    			append_dev(div, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*dropzoneComplete, preview*/ 80 && t2_value !== (t2_value = (/*dropzoneComplete*/ ctx[4][/*answer*/ ctx[17][2]] || /*preview*/ ctx[6]
    			? /*answer*/ ctx[17][1].slice(0, -1) + /*answer*/ ctx[17][2].slice(1)
    			: /*answer*/ ctx[17][1]) + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*dropzoneClasses*/ 8 && div_class_value !== (div_class_value = "" + (null_to_empty(`box dropzone ${/*dropzoneClasses*/ ctx[3][/*answer*/ ctx[17][2]].join(" ")}`) + " svelte-16z88ea"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(136:6) {#each source as answer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div4;
    	let div3;
    	let textarea;
    	let textarea_style_value;
    	let t0;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let div2;
    	let button0;
    	let t4;
    	let button1;
    	let t5_value = (/*preview*/ ctx[6] ? "Hide answers" : "Show answers") + "";
    	let t5;
    	let dispose;
    	let if_block = !/*preview*/ ctx[6] && create_if_block$1(ctx);
    	let each_value = /*source*/ ctx[9];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			textarea = element("textarea");
    			t0 = space();
    			div0 = element("div");
    			if (if_block) if_block.c();
    			t1 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div2 = element("div");
    			button0 = element("button");
    			button0.textContent = "Reset";
    			t4 = space();
    			button1 = element("button");
    			t5 = text(t5_value);
    			attr_dev(textarea, "rows", "1");
    			attr_dev(textarea, "class", "h2");
    			attr_dev(textarea, "placeholder", "Title...");
    			attr_dev(textarea, "style", textarea_style_value = `height:${/*height*/ ctx[1]}`);
    			add_location(textarea, file$9, 102, 4, 3272);
    			attr_dev(div0, "class", "spacing");
    			add_location(div0, file$9, 113, 4, 3560);
    			attr_dev(div1, "class", "answers");
    			add_location(div1, file$9, 134, 4, 4189);
    			attr_dev(button0, "class", "reset");
    			add_location(button0, file$9, 147, 6, 4634);
    			attr_dev(button1, "class", "show-answers");
    			add_location(button1, file$9, 148, 6, 4694);
    			attr_dev(div2, "class", "controls");
    			add_location(div2, file$9, 146, 4, 4605);
    			attr_dev(div3, "class", "content");
    			add_location(div3, file$9, 101, 2, 3246);
    			attr_dev(div4, "class", "block");
    			add_location(div4, file$9, 100, 0, 3224);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, textarea);
    			/*textarea_binding*/ ctx[11](textarea);
    			set_input_value(textarea, /*content*/ ctx[0]);
    			append_dev(div3, t0);
    			append_dev(div3, div0);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div3, t1);
    			append_dev(div3, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			append_dev(div2, t4);
    			append_dev(div2, button1);
    			append_dev(button1, t5);

    			dispose = [
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[12]),
    				listen_dev(textarea, "input", /*input_handler*/ ctx[13], false, false, false),
    				listen_dev(button0, "click", /*reset*/ ctx[10], false, false, false),
    				listen_dev(button1, "click", /*click_handler*/ ctx[16], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*height*/ 2 && textarea_style_value !== (textarea_style_value = `height:${/*height*/ ctx[1]}`)) {
    				attr_dev(textarea, "style", textarea_style_value);
    			}

    			if (dirty & /*content*/ 1) {
    				set_input_value(textarea, /*content*/ ctx[0]);
    			}

    			if (!/*preview*/ ctx[6]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*dropzoneClasses, source, dropzoneComplete, preview*/ 600) {
    				each_value = /*source*/ ctx[9];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*preview*/ 64 && t5_value !== (t5_value = (/*preview*/ ctx[6] ? "Hide answers" : "Show answers") + "")) set_data_dev(t5, t5_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			/*textarea_binding*/ ctx[11](null);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let content = "Build words relating to the esophagus by dragging an appropriate suffix into a medical term box:";
    	let height = "18";

    	let source = [
    		["Removal of the esophagus", "Esophag-", "-ectomy"],
    		["Inflammation of the esophagus", "Esophag-", "-itis"],
    		["Incision into the esophagus", "Esophago-", "-tomy"],
    		["Instrument to view the esophagus", "Esophago-", "-scope"],
    		["Protrusion/Hernia of the esophagus", "Esophago-", "-cele"],
    		["Disease of the esophagus", "Esophago-", "-pathy"],
    		["Opening into the esophagus", "Esophago-", "-stomy"]
    	];

    	let suffixes = source.map(s => s[2]);
    	let dropzoneClasses = Object.fromEntries(suffixes.map(s => [s, []]));
    	let dropzoneComplete = Object.fromEntries(suffixes.map(s => [s, false]));

    	const reset = () => {
    		$$invalidate(2, suffixes = source.map(s => s[2]));
    		$$invalidate(3, dropzoneClasses = Object.fromEntries(suffixes.map(s => [s, []])));
    		$$invalidate(4, dropzoneComplete = Object.fromEntries(suffixes.map(s => [s, false])));
    	};

    	onMount(() => {
    		interact(".draggable").draggable({
    			//   inertia: true,
    			autoScroll: true,
    			listeners: {
    				start(event) {
    					console.log(event.type, event.target);
    					event.target.style.transition = "";
    				},
    				move(event) {
    					const suffix = event.target.id;
    					$$invalidate(8, elsOffset[suffix].x += event.dx, elsOffset);
    					$$invalidate(8, elsOffset[suffix].y += event.dy, elsOffset);
    				},
    				end(event) {
    					if (event.target) {
    						const suffix = event.target.id;
    						event.target.style.transition = "transform 0.2s";
    						$$invalidate(8, elsOffset[suffix].x = 0, elsOffset);
    						$$invalidate(8, elsOffset[suffix].y = 0, elsOffset);
    					}
    				}
    			}
    		});

    		interact(".dropzone").dropzone({
    			accept: ".draggable",
    			overlap: 0.75,
    			ondragenter(event) {
    				const suffix = "-" + event.target.id.split("-")[1];
    				console.log(suffix);

    				if (!dropzoneComplete[suffix]) {
    					$$invalidate(3, dropzoneClasses[suffix] = ["drop-active"], dropzoneClasses);
    				}

    				console.log(dropzoneClasses);
    			},
    			ondragleave(event) {
    				const suffix = "-" + event.target.id.split("-")[1];

    				if (!dropzoneComplete[suffix]) {
    					$$invalidate(3, dropzoneClasses[suffix] = [], dropzoneClasses);
    				}
    			},
    			ondrop(event) {
    				const suffix = "-" + event.target.id.split("-")[1];

    				if (!dropzoneComplete[suffix]) {
    					if (suffix == event.relatedTarget.id) {
    						$$invalidate(2, suffixes = suffixes.filter(s => s != suffix));
    						$$invalidate(3, dropzoneClasses[suffix] = ["success"], dropzoneClasses);
    						$$invalidate(4, dropzoneComplete[suffix] = true, dropzoneComplete);
    					} else {
    						$$invalidate(3, dropzoneClasses[suffix] = ["wrong"], dropzoneClasses);
    						setTimeout(() => $$invalidate(3, dropzoneClasses[suffix] = [], dropzoneClasses), 1000);
    					}
    				}
    			}
    		});

    		$$invalidate(1, height = "0");
    		setTimeout(() => $$invalidate(1, height = `${title.scrollHeight}px`), 0);
    	});

    	let title;
    	let preview = false;

    	function textarea_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(5, title = $$value);
    		});
    	}

    	function textarea_input_handler() {
    		content = this.value;
    		$$invalidate(0, content);
    	}

    	const input_handler = e => {
    		$$invalidate(1, height = "0px");
    		setTimeout(() => $$invalidate(1, height = `${e.target.scrollHeight}px`), 0);
    	};

    	function span_binding($$value, suffix) {
    		if (els[suffix] === $$value) return;

    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			els[suffix] = $$value;
    			($$invalidate(7, els), $$invalidate(2, suffixes));
    		});
    	}

    	const dragstart_handler = (suffix, e) => {
    		e.dataTransfer.setData("text/plain", suffix);
    	};

    	const click_handler = () => $$invalidate(6, preview = !preview);

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("content" in $$props) $$invalidate(0, content = $$props.content);
    		if ("height" in $$props) $$invalidate(1, height = $$props.height);
    		if ("source" in $$props) $$invalidate(9, source = $$props.source);
    		if ("suffixes" in $$props) $$invalidate(2, suffixes = $$props.suffixes);
    		if ("dropzoneClasses" in $$props) $$invalidate(3, dropzoneClasses = $$props.dropzoneClasses);
    		if ("dropzoneComplete" in $$props) $$invalidate(4, dropzoneComplete = $$props.dropzoneComplete);
    		if ("title" in $$props) $$invalidate(5, title = $$props.title);
    		if ("preview" in $$props) $$invalidate(6, preview = $$props.preview);
    		if ("els" in $$props) $$invalidate(7, els = $$props.els);
    		if ("elsOffset" in $$props) $$invalidate(8, elsOffset = $$props.elsOffset);
    	};

    	let els;
    	let elsOffset;

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*suffixes*/ 4) {
    			 $$invalidate(7, els = Object.fromEntries(suffixes.map(s => [s, null])));
    		}

    		if ($$self.$$.dirty & /*suffixes*/ 4) {
    			 $$invalidate(8, elsOffset = Object.fromEntries(suffixes.map(s => [s, { x: 0, y: 0 }])));
    		}
    	};

    	return [
    		content,
    		height,
    		suffixes,
    		dropzoneClasses,
    		dropzoneComplete,
    		title,
    		preview,
    		els,
    		elsOffset,
    		source,
    		reset,
    		textarea_binding,
    		textarea_input_handler,
    		input_handler,
    		span_binding,
    		dragstart_handler,
    		click_handler
    	];
    }

    class Dictionary extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dictionary",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/WordComponents.svelte generated by Svelte v3.18.2 */

    function create_fragment$b(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class WordComponents extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WordComponents",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.18.2 */
    const file$a = "src/App.svelte";

    // (30:6) <Title>
    function create_default_slot_6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Flash to JS");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(30:6) <Title>",
    		ctx
    	});

    	return block;
    }

    // (29:4) <Section>
    function create_default_slot_5(ctx) {
    	let current;

    	const title = new Title({
    			props: {
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(title.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(title, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const title_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				title_changes.$$scope = { dirty, ctx };
    			}

    			title.$set(title_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(title.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(title.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(title, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(29:4) <Section>",
    		ctx
    	});

    	return block;
    }

    // (28:2) <Row>
    function create_default_slot_4(ctx) {
    	let current;

    	const section = new Section({
    			props: {
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(section.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(section, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const section_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				section_changes.$$scope = { dirty, ctx };
    			}

    			section.$set(section_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(section.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(section.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(section, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(28:2) <Row>",
    		ctx
    	});

    	return block;
    }

    // (27:0) <TopAppBar variant="fixed" color="primary">
    function create_default_slot_3(ctx) {
    	let current;

    	const row = new Row({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(row.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(row, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const row_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				row_changes.$$scope = { dirty, ctx };
    			}

    			row.$set(row_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(row, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(27:0) <TopAppBar variant=\\\"fixed\\\" color=\\\"primary\\\">",
    		ctx
    	});

    	return block;
    }

    // (48:6) <Label>
    function create_default_slot_2(ctx) {
    	let t_value = /*tabs*/ ctx[2][/*tab*/ ctx[4] - 1] + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tab*/ 16 && t_value !== (t_value = /*tabs*/ ctx[2][/*tab*/ ctx[4] - 1] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(48:6) <Label>",
    		ctx
    	});

    	return block;
    }

    // (47:4) <Tab {tab}>
    function create_default_slot_1$1(ctx) {
    	let current;

    	const label = new Label({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(label.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(label, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const label_changes = {};

    			if (dirty & /*$$scope, tab*/ 48) {
    				label_changes.$$scope = { dirty, ctx };
    			}

    			label.$set(label_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(label.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(label.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(label, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(47:4) <Tab {tab}>",
    		ctx
    	});

    	return block;
    }

    // (46:2) <TabBar tabs={[1, 2]} let:tab bind:active>
    function create_default_slot$3(ctx) {
    	let current;

    	const tab = new Tab({
    			props: {
    				tab: /*tab*/ ctx[4],
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tab.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tab, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tab_changes = {};
    			if (dirty & /*tab*/ 16) tab_changes.tab = /*tab*/ ctx[4];

    			if (dirty & /*$$scope, tab*/ 48) {
    				tab_changes.$$scope = { dirty, ctx };
    			}

    			tab.$set(tab_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tab, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(46:2) <TabBar tabs={[1, 2]} let:tab bind:active>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let t0;
    	let div;
    	let updating_active;
    	let t1;
    	let FixedAdjust_action;
    	let current;
    	let dispose;

    	const topappbar = new TopAppBar({
    			props: {
    				variant: "fixed",
    				color: "primary",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	function tabbar_active_binding(value) {
    		/*tabbar_active_binding*/ ctx[3].call(null, value);
    	}

    	let tabbar_props = {
    		tabs: [1, 2],
    		$$slots: {
    			default: [create_default_slot$3, ({ tab }) => ({ 4: tab }), ({ tab }) => tab ? 16 : 0]
    		},
    		$$scope: { ctx }
    	};

    	if (/*active*/ ctx[0] !== void 0) {
    		tabbar_props.active = /*active*/ ctx[0];
    	}

    	const tabbar = new TabBar({ props: tabbar_props, $$inline: true });
    	binding_callbacks.push(() => bind(tabbar, "active", tabbar_active_binding));
    	var switch_value = /*builders*/ ctx[1][/*active*/ ctx[0] - 1];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props());
    	}

    	const block = {
    		c: function create() {
    			create_component(topappbar.$$.fragment);
    			t0 = space();
    			div = element("div");
    			create_component(tabbar.$$.fragment);
    			t1 = space();
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(div, "class", "container");
    			add_location(div, file$a, 44, 0, 1162);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(topappbar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(tabbar, div, null);
    			append_dev(div, t1);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;
    			dispose = action_destroyer(FixedAdjust_action = FixedAdjust.call(null, div));
    		},
    		p: function update(ctx, [dirty]) {
    			const topappbar_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				topappbar_changes.$$scope = { dirty, ctx };
    			}

    			topappbar.$set(topappbar_changes);
    			const tabbar_changes = {};

    			if (dirty & /*$$scope, tab*/ 48) {
    				tabbar_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_active && dirty & /*active*/ 1) {
    				updating_active = true;
    				tabbar_changes.active = /*active*/ ctx[0];
    				add_flush_callback(() => updating_active = false);
    			}

    			tabbar.$set(tabbar_changes);

    			if (switch_value !== (switch_value = /*builders*/ ctx[1][/*active*/ ctx[0] - 1])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(topappbar.$$.fragment, local);
    			transition_in(tabbar.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(topappbar.$$.fragment, local);
    			transition_out(tabbar.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(topappbar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			destroy_component(tabbar);
    			if (switch_instance) destroy_component(switch_instance);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	const builders = [Dictionary, WordComponents];
    	let active = 1;
    	let tabs = [`Dictionary`, `Word Components`];

    	function tabbar_active_binding(value) {
    		active = value;
    		$$invalidate(0, active);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("tabs" in $$props) $$invalidate(2, tabs = $$props.tabs);
    	};

    	return [active, builders, tabs, tabbar_active_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
      props: {
        name: "world"
      }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
