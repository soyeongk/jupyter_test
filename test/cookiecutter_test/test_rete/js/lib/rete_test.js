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
        super("Number");
    }

    builder(node) {
        var out1 = new Rete.Output("num", "Value", numSocket);

        return node
            // .addControl(new NumControl(this.editor, "num"))
            .addOutput(out1);
    }

    worker(node, inputs, outputs) {
        outputs["num"] = node.data.num;
    }
}

class MathComponent extends Rete.Component {
    doOperation(v1, v2) {
        return 0;
    }

    builder(node) {
        var inp1 = new Rete.Input("num1", "Value 1", numSocket);
        var inp2 = new Rete.Input("num2", "Value 2", numSocket);
        var out = new Rete.Output("num", "Result", numSocket);

        // inp1.addControl(new NumControl(this.editor, "num1"));
        // inp2.addControl(new NumControl(this.editor, "num2"));

        return node
            .addInput(inp1)
            .addInput(inp2)
            // .addControl(new NumControl(this.editor, "preview", true))
            .addOutput(out);
    }

    worker(node, inputs, outputs) {
        var n1 = inputs["num1"].length ? inputs["num1"][0] : node.data.num1;
        var n2 = inputs["num2"].length ? inputs["num2"][0] : node.data.num2;
        var sum = this.doOperation(n1, n2);

        this.editor.nodes
            .find(n => n.id == node.id)
            .controls.get("preview")
            .setValue(sum);
        outputs["num"] = sum;
    }
}

class AddComponent extends MathComponent {
    constructor() {
        super("Add");
    }
    doOperation(v1, v2) {
        return v1 + v2;
    }
}
class SubtractComponent extends MathComponent {
    constructor() {
        super("Subtract");
    }
    doOperation(v1, v2) {
        return v1 - v2;
    }
}
class MultiplyComponent extends MathComponent {
    constructor() {
        super("Multiply");
    }
    doOperation(v1, v2) {
        return v1 * v2;
    }
}
class DivideComponent extends MathComponent {
    constructor() {
        super("Divide");
    }
    doOperation(v1, v2) {
        return v2 != 0 ? v1 / v2 : 0;
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
        const engine = new Rete.Engine('demo@0.1.0');
        let components = [
            new NumComponent(),
            new AddComponent(),
            new SubtractComponent(),
            new MultiplyComponent(),
            new DivideComponent()
        ];

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

        components.map(c => {
            editor.register(c);
            engine.register(c);
        });

        let n1 = await components[0].createNode({ num: 2 });
        let n2 = await components[0].createNode({ num: 3 });
        let add = await components[1].createNode();

        n1.position = [80, 200];
        n2.position = [80, 400];
        add.position = [500, 240];

        editor.addNode(n1);
        editor.addNode(n2);
        editor.addNode(add);

        editor.connect(n1.outputs.get("num"), add.inputs.get("num1"));
        editor.connect(n2.outputs.get("num"), add.inputs.get("num2"));

        editor.on(
            "process nodecreated noderemoved connectioncreated connectionremoved",
            async() => {
                console.log("processing...");
                await engine.abort();
                await engine.process(editor.toJSON());
            }
        );

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