/*
 * Module dependencies.
 */

var localBuild = require('../../lib/phonegap/local.build'),
    PhoneGap = require('../../lib/phonegap'),
    cordova = require('cordova'),
    fs = require('fs'),
    phonegap,
    options;

/*
 * Specification: phonegap.local.build
 */

describe('phonegap.local.build(options, [callback])', function() {
    beforeEach(function() {
        phonegap = new PhoneGap();
        options = {
            platforms: ['android']
        };
        spyOn(cordova, 'build');
        spyOn(localBuild, 'addPlatform');
    });

    it('should require options', function() {
        expect(function() {
            options = undefined;
            phonegap.local.build(options, callback);
        }).toThrow();
    });

    it('should require options.platforms', function() {
        expect(function() {
            options.platforms = undefined;
            phonegap.local.build(options, callback);
        }).toThrow();
    });

    it('should not require callback', function() {
        expect(function() {
            phonegap.local.build(options);
        }).not.toThrow();
    });

    it('should return itself', function() {
        expect(phonegap.local.build(options)).toEqual(phonegap);
    });

    it('should require at least one platform', function(done) {
        options.platforms = [];
        phonegap.local.build(options, function(e) {
            expect(e).toEqual(jasmine.any(Error));
            done();
        });
    });

    it('should try to add the platform', function() {
        phonegap.local.build(options);
        expect(localBuild.addPlatform).toHaveBeenCalledWith(
            options,
            jasmine.any(Function)
        );
    });

    describe('successfully added platform', function() {
        beforeEach(function() {
            localBuild.addPlatform.andCallFake(function(options, callback) {
                callback();
            });
        });

        it('should try to build the platform', function() {
            phonegap.local.build(options);
            expect(cordova.build).toHaveBeenCalledWith(
                options.platforms,
                jasmine.any(Function)
            );
        });

        describe('successful build', function() {
            beforeEach(function() {
                cordova.build.andCallFake(function(platforms, callback) {
                    callback();
                });
            });

            it('should trigger called without an error', function(done) {
                phonegap.local.build(options, function(e) {
                    expect(e).toBeNull();
                    done();
                });
            });
        });

        describe('failed build', function() {
            beforeEach(function() {
                cordova.build.andCallFake(function(platforms, callback) {
                    throw new Error('write access denied');
                });
            });

            it('should trigger called with an error', function(done) {
                phonegap.local.build(options, function(e) {
                    expect(e).toEqual(jasmine.any(Error));
                    done();
                });
            });

            it('should trigger "error" event', function(done) {
                phonegap.on('error', function(e) {
                    expect(e).toEqual(jasmine.any(Error));
                    done();
                });
                phonegap.local.build(options);
            });
        });
    });

    describe('failure adding platform', function() {
        beforeEach(function() {
            localBuild.addPlatform.andCallFake(function(options, callback) {
                callback(new Error('write access denied'));
            });
        });

        it('should trigger callback with an error', function(done) {
            phonegap.local.build(options, function(e) {
                expect(e).toEqual(jasmine.any(Error));
                done();
            });
        });

        it('should trigger "error" event', function(done) {
            phonegap.on('error', function(e) {
                expect(e).toEqual(jasmine.any(Error));
                done();
            });
            phonegap.local.build(options);
        });
    });
});

describe('localBuild.addPlatform(options, callback)', function() {
    var emitter;
    beforeEach(function() {
        phonegap = new PhoneGap();
        options = {
            platforms: ['android']
        };
        emitter = {
            phonegap: {
                emit: function() {}
            }
        };
        spyOn(fs, 'existsSync');
        spyOn(cordova, 'platform');
    });

    it('should require options', function() {
        expect(function() {
            options = undefined;
            localBuild.addPlatform.call(emitter, options, function() {});
        }).toThrow();
    });

    it('should require options.platforms', function() {
        expect(function() {
            options.platforms = undefined;
            localBuild.addPlatform.call(emitter, options, function() {});
        }).toThrow();
    });

    it('should require callback', function() {
        expect(function() {
            localBuild.addPlatform.call(emitter, options);
        }).toThrow();
    });

    describe('platform directory exists', function() {
        beforeEach(function() {
            fs.existsSync.andReturn(true);
        });

        it('should trigger callback without an error', function(done) {
            localBuild.addPlatform.call(emitter, options, function(e) {
                expect(e).toBeNull();
                done();
            });
        });
    });

    describe('platform directory missing', function() {
        beforeEach(function() {
            fs.existsSync.andReturn(false);
        });

        it('should try to add the platform', function() {
            localBuild.addPlatform.call(emitter, options, function() {});
            expect(cordova.platform).toHaveBeenCalledWith(
                'add',
                options.platforms,
                jasmine.any(Function)
            );
        });

        describe('successfully added platform', function() {
            beforeEach(function() {
                cordova.platform.andCallFake(function(cmd, platforms, callback) {
                    callback();
                });
            });

            it('should trigger callback without an error', function(done) {
                localBuild.addPlatform.call(emitter, options, function(e) {
                    expect(e).toBeNull();
                    done();
                });
            });
        });

        describe('failure adding platform', function() {
            beforeEach(function() {
                cordova.platform.andCallFake(function(cmd, platforms, callback) {
                    throw new Error('write access denied');
                });
            });

            it('should trigger callback with an error', function(done) {
                localBuild.addPlatform.call(emitter, options, function(e) {
                    expect(e).toEqual(jasmine.any(Error));
                    done();
                });
            });
        });
    });
});