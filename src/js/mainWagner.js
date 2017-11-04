// forked from https://github.com/superguigui/Wagner/blob/master/example/index.js

import * as THREE from 'three'
import dat from 'dat-gui'
import WAGNER from '@superguigui/wagner/'
import AbstractApplication from 'views/AbstractApplication'
import FXAAPass from '@superguigui/wagner/src/passes/fxaa/FXAAPass'

class Main extends AbstractApplication {

  constructor() {

    super();

    this.params = {
      usePostProcessing: true,
      useFXAA: false,
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
    this.fxaaPass = new FXAAPass();

  }

  initGui() {

    const gui = new dat.GUI();
    gui.add(this.params, 'usePostProcessing');
    gui.add(this.params, 'useFXAA');
    return gui;

  }

  animate() {

    super.animate();

    if (this.params.usePostProcessing) {
      this.composer.reset();
      this.composer.render(this._scene, this._camera);
      if (this.params.useFXAA) this.composer.pass(this.fxaaPass);
      this.composer.toScreen();
    }
    else {
      this._renderer.render(this._scene, this._camera);
    }

  }

}
export default Main;
