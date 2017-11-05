import 'three'
import 'three/examples/js/controls/OrbitControls'
import 'three/examples/js/controls/VRControls'

class AbstractApplication {

    constructor(){

        this._camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
        this._camera.position.z = 200;

        this._scene = new THREE.Scene();

        this._renderer = new THREE.WebGLRenderer();
        // For rendering helpers on top in separate scene
        this._renderer.autoClear = false;
        this._renderer.setPixelRatio( window.devicePixelRatio );
        this._renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( this._renderer.domElement );

        this._controls = new THREE.OrbitControls( this._camera, this._renderer.domElement );
        //this._controls.addEventListener( 'change', render ); // add this only if there is no animation loop (requestAnimationFrame)
        this._controls.enableDamping = true;
        this._controls.dampingFactor = 0.25;
        // this._controls.enableZoom = false;

        window.addEventListener( 'resize', this.onWindowResize.bind(this), false );


    }

    get renderer(){

        return this._renderer;

    }

    get camera(){

        return this._camera;

    }

    get scene(){

        return this._scene;

    }


    onWindowResize() {

      let width = window.innerWidth;
      let height = window.innerHeight;

      this._camera.aspect = width / height;
      this._camera.updateProjectionMatrix();

      this._renderer.setSize( width, height );

      // Set sizes
      if (this.params.useDoF) {
        this.dof.rtTextureColor.setSize( width, height );
        this.dof.rtTextureDepth.setSize( width, height );
        this.dof.bokeh_uniforms[ "textureWidth" ].value = width;
        this.dof.bokeh_uniforms[ "textureHeight" ].value = height;
      };

    }

    animate(timestamp) {
        requestAnimationFrame( this.animate.bind(this) );

        this._controls.update();
        this._renderer.render( this._scene, this._camera );

    }


}
export default AbstractApplication;
