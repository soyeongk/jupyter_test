import Rete from "rete";
import VueRenderPlugin from "rete-vue-render-plugin";
import ConnectionPlugin from "rete-connection-plugin";
import ContextMenuPlugin from "rete-context-menu-plugin";
import AreaPlugin from "rete-area-plugin";
const numSocket = new Rete.Socket("Number value");
import "./flow.css";

var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');

class NumComponent extends Rete.Component {
    constructor() {
        super('Number');
    }

    builder(node) {
        let out = new Rete.Output('num', 'Number', numSocket);

        node.addOutput(out);
    }

    worker(node, inputs, outputs) {
        outputs['num'] = node.data.num;
    }
}


// See example.py for the kernel counterpart to this file.

// Custom Model. Custom widgets models must at least provide default values
// for model attributes, including
//
//  - `_view_name`
//  - `_view_module`
//  - `_view_module_version`
//
//  - `_model_name`
//  - `_model_module`
//  - `_model_module_version`
//
//  when different from the base class.

// When serialiazing the entire widget state for embedding, only values that
// differ from the defaults will be specified.
var ReteModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name: 'ReteTest',
        _view_name: 'ReteView',
        _model_module: 'test_rete',
        _view_module: 'test_rete',
        _model_module_version: '0.0.0',
        _view_module_version: '0.0.0',
        value: 'Hello World! Rete'
    })
});


// Custom View. Renders the widget model.
var ReteView = widgets.DOMWidgetView.extend({
    // remove() {
    //     this.vueApp.$destroy();
    //     return super.remove();
    // },
    // Defines how the widget gets rendered into the DOM
    render: async function() {
        // this.value_changed();

        // // Observe changes in the value traitlet in Python, and define
        // // a custom callback.
        // this.model.on('change:value', this.value_changed, this);

        // super.render();
        // this.displayed.then(() => {
        // const vueEl = document.createElement('div');
        // vueEl.setAttribute('id', 'rete');
        // this.el.appendChild(vueEl);

        // this.create_rete();

        // this.vueApp = new Vue({
        //     el: vueEl,
        //     render: createElement => vueRender(createElement, this.model, this, {}),
        // });
        // });

        this.value_changed();
        this.placeholder = document.createElement('div');
        this.placeholder.id = 'rete';
        this.placeholder.style.height = '1000px';
        this.placeholder.style.width = '1000px';
        await this.create_rete(this.placeholder);
        this.el.appendChild(this.placeholder);
    },

    value_changed: function() {
        this.el.textContent = this.model.get('value');
    },

    create_rete: async function(container) {

        // const container = document.querySelector('#rete');
        const editor = new Rete.NodeEditor('demo@0.1.0', container);

        editor.use(ConnectionPlugin);
        editor.use(VueRenderPlugin);
        editor.use(AreaPlugin);
        editor.use(ContextMenuPlugin, {
            searchBar: false,
            items: {
                "Dump JSON": () => {
                    console.log(editor.toJSON());
                }
            },
            allocate(component) {
                return ["+ New"];
            },
            rename(component) {
                return component.name;
            }
        });

        const numComponent = new NumComponent();
        editor.register(numComponent);

        const engine = new Rete.Engine('demo@0.1.0');
        engine.register(numComponent);

        editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async() => {
            await engine.abort();
            await engine.process(editor.toJSON());
        });

        var n1 = await numComponent.createNode({ num: 2 });
        var n2 = await numComponent.createNode({ num: 0 });

        n1.position = [80, 200];
        n2.position = [80, 400];

        editor.addNode(n1);
        editor.addNode(n2);

        editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async() => {
            console.log('process');
            await engine.abort();
            await engine.process(editor.toJSON());
        });

        //editor.view.resize();
        AreaPlugin.zoomAt(editor);
        editor.trigger('process');
    }

});


// module.exports = {
export {
    ReteModel,
    ReteView
};