/*!
 * Singleton JS
 * https://github.com/tropperstyle/singleton-js
 *
 * Copyright, Jonathan Tropper.
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * MIT-LICENSE.txt
 * GPL-LICENSE.txt
 */
 
(function($) {
    function Singleton(constructor) {    
        var instance = this;
        instance.dependencyLoader = {
            run: function(instance) {
                if (instance.dependencies) {
                    this.instance = instance;
                    this.stylesheets = instance.dependencies.stylesheets;
                    this.javascripts = instance.dependencies.javascripts;
                    if (this.stylesheets) { this.loadStyles(); }
                    if (this.javascripts) { this.loadScripts(); }
                }
            },
            loadStyles: function() {
                var self = this;
                $.each(this.stylesheets, function(className, path) {
                    if (!Singleton.dependencies.loaded.stylesheets[className]) {
                        // Current Hack for IE and jQuery 1.4
                        // http://groups.google.com/group/jquery-en/browse_thread/thread/03470c7342567a16/6c7519636768bd18?lnk=raot
                        var link = $('<link/>').appendTo('head');
                        link.attr({
                            type: 'text/css',
                            rel: 'stylesheet',
                            media: 'screen',
                            href: path 
                        });
                    
                        Singleton.dependencies.loaded.stylesheets[className] = true;
                    }
                });
            },
            loadScripts: function() {
                var self = this;
                $.each(this.javascripts, function(className, path) {
                    if (eval('typeof(' + className + ')') == 'undefined') {
                        if (!Singleton.dependencies.loading[className]) {
                            Singleton.dependencies.loading[className] = true;
                            $.getScript(path + '?' + (new Date()).getTime(), function() {
                                Singleton.dependencies.loaded.javascripts[className] = true;
                                Singleton.dependencies.fireCallbacks();
                            });
                        }
                    } else {
                        Singleton.dependencies.loaded.javascripts[className] = true;
                        Singleton.dependencies.fireCallbacks();
                    }
                });
            },
            isLoaded: function() {
                var self = this, loaded = true;
                if (this.javascripts) {
                    $.each(this.javascripts, function(className) {
                        if (!Singleton.dependencies.loaded.javascripts[className]) {
                            loaded = false;
                            return loaded;
                        }
                    });
                    return loaded;
                } else {
                    return true;
                }
            }
        };
        
        constructor.call(instance, $);
        
        // If library dynamically loaded.
        if ($.isReady) {
            instance.constructor.pending.push(instance);
            instance.constructor.dependencies.fireCallbacks();
            if (instance.ready) { instance.ready(); }
        } else {
            instance.constructor.locker.push(instance);
            $(document).bind('ready', function() {
                if (instance.ready) { instance.ready(); }
            });
        }
        
    	return this;
    };
    
    $.extend($, {
        use: function(context, method) {
            var args = Array.prototype.slice.call(arguments, 2);
            return method.apply(context, args);
        }
    });
    
    $.extend(Singleton.prototype, {
        namespace: function(namespace, constructor) {
            var parent = this;
            this[namespace] = new Singleton(function() {
                this.parent = parent;
                if (constructor) { constructor.call(this, $); }
            });
        },

        methods: function(hash) {
            for (method in hash) {
                this[method] = hash[method];
            }
        }
    });
    
    $.extend(Singleton, {
        pending: [],
        locker: [],
        dependencies: {
            ready: false,
            loading: {},
            loaded: {
                stylesheets: {},
                javascripts: {}
            },
            fireCallbacks: function() {
                var allLoaded = true;
                $.each(Singleton.locker, function(i, instance) {
                    if (instance.dependencyLoader.isLoaded()) {
                        if (instance.dependenciesLoaded) {
                            instance.dependenciesLoaded();
                            delete instance.dependenciesLoaded;
                        }
                    } else {
                        allLoaded = false;
                    }
                });
                                
                if (allLoaded) {
                    // If any were added dynamically, load the dependencies
                    var instance = Singleton.pending.splice(0, 1)[0];
                    if (instance) {
                        Singleton.locker.push(instance);
                        instance.dependencyLoader.run(instance);
                    }
                }
            }
        }
    });   
    
    $(document).bind('ready', function() {
        $.each(Singleton.locker, function(i, instance) {
            instance.dependencyLoader.run(instance);
        });
    });
    
    window.Singleton = Singleton;
})(jQuery);

// Example:
// 
// var World = new Singleton(function() {
//     this.dependencies = {
//         stylesheets: {
//             'file_manager': '/stylesheets/file_manager.css'
//         },
//         javascripts: {
//             'Session': '/javascripts/session_data.js'
//         }
//     };
//     this.listings = [];
//     
//     this.methods({
//         test: function() {
//             return this.listings;
//         }
//     });
// });
// 
// World.namespace('Cars', function() {
//     
// });
