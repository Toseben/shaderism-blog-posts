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
				enabled: true,

				autoFocus: true,
				bboxVisible: false,
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
    return gui;

  }

  animate() {

    super.animate();

    if (this.params.usePostProcessing) {
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
