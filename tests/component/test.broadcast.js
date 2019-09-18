import lng from "../../src/lightning.mjs";

describe('broadcast', function() {
    this.timeout(0);
    let app;
    let stage;

    before(() => {
        class TestApp extends lng.Application {
            static _template(){
                return {
                    Wrapper:{
                        A:{
                            type: ComponentA
                        },
                        B:{
                            type: ComponentB
                        }
                    }
                }
            }
        }

        class ComponentA extends lng.Component{
            static _template(){
                return {
                    broadcasts:{
                        test:"_onBroadcastTest",
                        sourceTest:"_onSourceTest",
                        paramsTest:"_onParamsTest"
                    }
                }
            }

            _construct(){
                this._received = false;
                this._signalSource = null;
                this._signalParams = null;
            }

            _onBroadcastTest(){
                this._received = true;
            }

            _onSourceTest({_source}){
                this._signalSource = _source;
            }

            _onParamsTest({args}){
                this._signalParams = args;
            }

            get received(){
                return this._received;
            }

            get signalSource(){
                return this._signalSource;
            }

            get signalParams(){
                return this._signalParams;
            }
        }

        class ComponentB extends ComponentA{
            static _template(){
                return {}
            }
        }

        app = new TestApp();
        stage = app.stage;
        document.body.appendChild(stage.getCanvas());
    });

    describe('Component', function() {

        it('should handle the test signal', function(){
            const a = app.tag("A");
            app.broadcast("test");

            chai.assert(a.received === true);
        });

        it('should not handle the test signal', function(){
            const b = app.tag("B");
            app.broadcast("test");

            chai.assert(b.received === false);
        });

        it('should set correct source', function(){
            const a = app.tag("A");
            app.broadcast("sourceTest");

            chai.assert(a.signalSource === app);
        });

        it('should hand over arguments', function(){
            const a = app.tag("A");
            app.broadcast("paramsTest",{a:1, b:2, c:3});

            chai.assert(lng.Utils.equalObjectLiterals(a.signalParams,{a:1, b:2, c:3}));
        });

    });

});