// forked from https://github.com/superguigui/Wagner/blob/master/example/index.js

import * as THREE from 'three'
import dat from 'dat-gui'
import WAGNER from '@superguigui/wagner/'
import AbstractApplication from 'views/AbstractApplication'
import BokehShader from 'three/examples/js/shaders/BokehShader2'

class Main extends AbstractApplication {

  constructor() {

    super();

    this.params = {
      usePostProcessing: true,
      useDoF: true,
      dofController: {
				autoFocus: false,
				bboxHelper: false,
				focusHelpers: false,

        jsDepthCalculation: false,
				shaderFocus: false,

				fstop: 18,
				maxblur: 2.0,

				showFocus: false,
				focalDepth: 25,
				manualdof: false,
				vignetting: false,
				depthblur: false,

				threshold: 1.0,
				gain: 0.0,
				bias: 0.5,
				fringe: 2.0,

				focalLength: 35,
				noise: true,
				pentagon: false,

				dithering: 0.001,

				rings: 3,
				samples: 4
			},
    };

    const light = new THREE.AmbientLight(0xFFFFFF, 1);
    this._scene.add(light);

    this.material = new THREE.MeshPhongMaterial({color: 0x3a9ceb});
    let c = this.addCube();
    this._scene.add(c);

    this.initPostprocessing();
    this.initGui();

    this.animate();

  }

  addCube() {

    let cube = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), this.material);
    return cube;

  }

  initPostprocessing() {

    this._renderer.autoClearColor = true;
    this.composer = new WAGNER.Composer(this._renderer);

    if (this.params.useDoF) {

      let width = window.innerWidth;
      let height = window.innerHeight;
      this.dof = { enabled : true };
      this.dof.material_depth = new THREE.MeshDepthMaterial();

      this.dof.scene = new THREE.Scene();
      this.dof.camera = new THREE.OrthographicCamera( width / - 2, width / 2,  height / 2, height / - 2, -10000, 10000 );
      this.dof.camera.position.z = 100;
      this.dof.scene.add( this.dof.camera );

      let pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
      this.dof.rtTextureDepth = new THREE.WebGLRenderTarget( width, height, pars );
      this.dof.rtTextureColor = new THREE.WebGLRenderTarget( width, height, pars );

      let bokeh_shader = THREE.BokehShader;
      this.dof.bokeh_uniforms = THREE.UniformsUtils.clone( bokeh_shader.uniforms );
      this.dof.bokeh_uniforms[ "tColor" ].value = this.dof.rtTextureColor.texture;
      this.dof.bokeh_uniforms[ "tDepth" ].value = this.dof.rtTextureDepth.texture;
      this.dof.bokeh_uniforms[ "textureWidth" ].value = width;
      this.dof.bokeh_uniforms[ "textureHeight" ].value = height;

      this.dof.materialBokeh = new THREE.ShaderMaterial({
        uniforms: this.dof.bokeh_uniforms,
        vertexShader: bokeh_shader.vertexShader,
        fragmentShader: bokeh_shader.fragmentShader,
        defines: {
          RINGS: this.params.dofController.rings,
          SAMPLES: this.params.dofController.samples
        }
      });

      this.dof.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( width, height ), this.dof.materialBokeh );
      this.dof.quad.position.z = - 500;
      this.dof.scene.add( this.dof.quad );

    }

  }

  initGui() {

    const gui = new dat.GUI();
    gui.add(this.params, 'usePostProcessing');

    if (this.params.useDoF) {
      const _this = this;
  		let matChanger = function() {
  			for (var e in _this.params.dofController) {
  				if (e in _this.dof.bokeh_uniforms) {
			      _this.dof.bokeh_uniforms[ e ].value = _this.params.dofController[ e ];
          }
				}
  			_this.dof.bokeh_uniforms[ 'znear' ].value = _this._camera.near;
  			_this.dof.bokeh_uniforms[ 'zfar' ].value = _this._camera.far;

        _this.dof.materialBokeh.defines.RINGS = _this.params.dofController.rings;
        _this.dof.materialBokeh.defines.SAMPLES = _this.params.dofController.samples;
        _this.dof.materialBokeh.needsUpdate = true;
  		};

      matChanger();

      gui.add( this.params.dofController, "autoFocus" ).onChange( matChanger );
      gui.add( this.params.dofController, "bboxHelper" ).onChange( matChanger );
      gui.add( this.params.dofController, "focusHelpers" ).onChange( matChanger );
      gui.add( this.params.dofController, "fstop", 0.1, 22, 0.001 ).onChange( matChanger );
      gui.add( this.params.dofController, "maxblur", 0.0, 5.0, 0.025 ).onChange( matChanger );
      gui.add( this.params.dofController, "showFocus" ).onChange( matChanger );
      // Listen on
      gui.add( this.params.dofController, "focalDepth", 0.0, 200.0 ).listen().onChange( matChanger );
      gui.add( this.params.dofController, "manualdof" ).onChange( matChanger );
      gui.add( this.params.dofController, "vignetting" ).onChange( matChanger );
      gui.add( this.params.dofController, "depthblur" ).onChange( matChanger );
      gui.add( this.params.dofController, "threshold", 0, 1, 0.001 ).onChange( matChanger );
      gui.add( this.params.dofController, "gain", 0, 100, 0.001 ).onChange( matChanger );
      gui.add( this.params.dofController, "bias", 0,3, 0.001 ).onChange( matChanger );
      gui.add( this.params.dofController, "fringe", 0, 5, 0.001 ).onChange( matChanger );
      gui.add( this.params.dofController, "focalLength", 16, 80, 0.001 ).onChange( matChanger );
      gui.add( this.params.dofController, "noise" ).onChange( matChanger );
      gui.add( this.params.dofController, "dithering", 0, 0.001, 0.0001 ).onChange( matChanger );
      gui.add( this.params.dofController, "pentagon" ).onChange( matChanger );
      gui.add( this.params.dofController, "rings", 1, 8).step(1).onChange( matChanger );
      gui.add( this.params.dofController, "samples", 1, 13).step(1).onChange( matChanger );
    }

    return gui;

  }

  animate() {

    super.animate();

    if (this.params.usePostProcessing && this.params.useDoF) {
      this._renderer.clear();

      this._renderer.render(this._scene, this._camera, this.dof.rtTextureColor, true);

      this._scene.overrideMaterial = this.dof.material_depth;
      this._renderer.render(this._scene, this._camera, this.dof.rtTextureDepth, true);

      this._renderer.render(this.dof.scene, this.dof.camera);
      this._scene.overrideMaterial = null;
    }
    else {
      this._renderer.render(this._scene, this._camera);
    }

  }

}
export default Main;
