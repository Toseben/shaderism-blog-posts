// forked from https://github.com/superguigui/Wagner/blob/master/example/index.js

import * as THREE from 'three'
import dat from 'dat-gui'
import WAGNER from '@superguigui/wagner/'
import AbstractApplication from 'views/AbstractApplication'
import BokehShader from 'three/examples/js/shaders/BokehShader2'

class Main extends AbstractApplication {

  constructor() {

    super();

    // All the default settings
    this.params = {
      usePostProcessing: false,
      useDoF: true,
      dofController: {
				autoFocus: false,
				bboxHelper: true,
				focusHelpers: false,

        jsDepthCalculation: false,
				shaderFocus: false,

				fstop: 2.2,
				maxblur: 1.0,

				showFocus: false,
				focalDepth: 2.8,
				manualdof: false,
				vignetting: false,
				depthblur: false,

				threshold: 0.5,
				gain: 2.0,
				bias: 0.5,
				fringe: 0.7,

				focalLength: 35,
				noise: true,
				pentagon: false,

				dithering: 0.001,

				rings: 3,
				samples: 4
			},
    };

    // Build up a basic example scene
    const light = new THREE.AmbientLight(0xFFFFFF, 1);
    this._scene.add(light);

    this.sceneObjects = new THREE.Group;
    this._scene.add(this.sceneObjects);

    let texture = new THREE.TextureLoader().load( 'assets/textures/crate.gif' );
    this.material = new THREE.MeshPhongMaterial({ map: texture });
    let c = this.addCube();
    this.sceneObjects.add(c);

    this.initPostprocessing();
    this.initGui();
    this.findClosestPoint();

    this.animate();

  }

  // Not really needed now because of the simple geometry
  addCube() {

    let cube = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), this.material);
    return cube;

  }

  initPostprocessing() {

    let width = window.innerWidth;
    let height = window.innerHeight;

    this._renderer.autoClearColor = true;
    this.composer = new WAGNER.Composer(this._renderer);

    // Rendering BokehShader2 requires a different scene and camera
    this.dof = {};
    this.dof.material_depth = new THREE.MeshDepthMaterial();
    this.dof.scene = new THREE.Scene();
    this.dof.camera = new THREE.OrthographicCamera( width / - 2, width / 2,  height / 2, height / - 2, -10000, 10000 );
    this.dof.camera.position.z = 100;
    this.dof.scene.add( this.dof.camera );

    // Creating render targets for RGB and Z-depth channels
    let pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
    this.dof.rtTextureDepth = new THREE.WebGLRenderTarget( width, height, pars );
    this.dof.rtTextureColor = new THREE.WebGLRenderTarget( width, height, pars );

    // I guess these could be passes to the materialBokeh straight-away without storing
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

    // The actual quad that is rendered which has the shader doing the blurring of texture
    this.dof.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( width, height ), this.dof.materialBokeh );
    this.dof.quad.position.z = - 500;
    this.dof.scene.add( this.dof.quad );

  }

  initGui() {

    const gui = new dat.GUI();
    gui.add(this.params, 'usePostProcessing').name(' Post-Processing');
    const dofFolder = gui.addFolder('DoF Controls');

    // Run whenever GUI controls are updated
    const _this = this;
    let dofChanger = function() {
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

    dofChanger();

    // All the parameters for DOF2 to GUI
    dofFolder.add( this.params.dofController, "autoFocus" ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "bboxHelper" ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "focusHelpers" ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "fstop", 0.1, 22, 0.001 ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "maxblur", 0.0, 8.0, 0.025 ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "showFocus" ).onChange( dofChanger );
    // Listen for Focal Depth is on
    dofFolder.add( this.params.dofController, "focalDepth", 0.0, 200.0 ).listen().onChange( dofChanger );
    dofFolder.add( this.params.dofController, "manualdof" ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "vignetting" ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "depthblur" ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "threshold", 0, 1, 0.001 ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "gain", 0, 100, 0.001 ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "bias", 0,3, 0.001 ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "fringe", 0, 5, 0.001 ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "focalLength", 16, 80, 0.001 ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "noise" ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "dithering", 0, 0.001, 0.0001 ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "pentagon" ).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "rings", 1, 8).step(1).onChange( dofChanger );
    dofFolder.add( this.params.dofController, "samples", 1, 13).step(1).onChange( dofChanger );

    return gui;

  }

  findClosestPoint() {
    let focusObject = this.sceneObjects;

    // Create Box3 object (aka bounding box) around our focusObject
    let bbox = new THREE.Box3();
    bbox.setFromObject( focusObject );

    // Create the actual bounding box geometry for sampling and visualising
    let bboxSize = bbox.getSize();
    let bboxGeo = this.dof.bboxGeo = new THREE.BoxGeometry( bboxSize.x, bboxSize.y, bboxSize.z );

    let bboxMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    let bboxMesh = new THREE.Mesh( bboxGeo, bboxMat );
    bboxMesh.visible = this.params.dofController.bboxHelper;
    bboxMesh.position.copy( focusObject.position );
    this._scene.add( bboxMesh );

    // Focus Helpers
    let dofHelperGroup = this.dof.dofHelperGroup = new THREE.Group;
    this._scene.add( dofHelperGroup );

    let colors = [
      0xff0000,
      0x00ff00,
      0x0000ff,
    ];

    let helperGeo = new THREE.BoxGeometry( 0.1, 0.1, 0.1 );

    // Run for every other face (two triangles per quad)
    for ( let id = 0; id < bboxGeo.faces.length / 2; id += 1 ) {
      let colorIdx = Math.floor(id / 2);
      let helperMat = new THREE.MeshBasicMaterial({ color: colors[colorIdx] });
      let helperCube = new THREE.Mesh( helperGeo, helperMat );
      dofHelperGroup.add( helperCube );
    }

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
