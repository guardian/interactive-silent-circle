define( [], function () {

  'use strict';

  function addCSS( url ) {
    var head = document.querySelector( 'head' );
    var link = document.createElement( 'link' );
    link.setAttribute( 'rel', 'stylesheet' );
    link.setAttribute( 'type', 'text/css' );
    link.setAttribute( 'href', url );
    head.appendChild( link );
  }

  return {
    boot: function ( el, context, config, mediator ) {
      // Load CSS
      addCSS( 'assets/css/main.css' );

//      console.log('boot script');

      // Load main application
      require( ['assets/js/main.js'], function ( req ) {
        // Main app returns a almond instance of require to avoid
        // R2 / NGW inconsistencies.
        req( ['main'], function ( main ) {
          main.init( el, context, config, mediator );


        } );
      }, function ( err ) {
        console.error( 'Error loading boot.', err );
      } );
    }
  };
} );
