define( [
  'backbone',
  'mustache',
  'routes',
  'text!templates/appTemplate.html',
  'views/mainVideo',
  'underscore',
//  'views/analytics'
], function ( Backbone, Mustache, routes, template, mainVideo, _, ga ) {
  'use strict';

  return Backbone.View.extend( {

    className: 'guInteractive',


//    animateScroll: function ( elem, style, unit, from, to, time, prop, callback ) {
//      if ( !elem ) return;
//      var start = new Date().getTime();
//      elem.style[style] = from + unit;
//
//      function animate() {
//        var step = Math.min( 1, (new Date().getTime() - start) / time );
//        if ( prop ) {
//          elem[style] = (from + step * (to - from)) + unit;
//        } else {
//          elem.style[style] = (from + step * (to - from)) + unit;
//        }
//        if ( step != 1 ) {
//          requestAnimationFrame( animate );
//        } else {
//          if ( callback )
//            callback();
//        }
//      }
//
//      requestAnimationFrame( animate );
//    },

    switchVideo: function ( e ) {
      var self = this;
      var videoId = _.isString( e ) ? e : $( e.currentTarget ).closest( '.inactiveVideo' ).attr( 'data-video-id' );
      var foundValue = _.findWhere( this.allEpisodes, {
        'id': videoId
      } );
      var currentScrolltop = $( 'body' ).scrollTop();
      var videoOffset = $( '#mainEpisode' ).offset().top - 40;
      var diff = currentScrolltop - videoOffset;

      this.mainEpisode = foundValue;

//      window.ga( 'send', {
//        'hitType': 'event',          // Required.
//        'eventCategory': 'switch video',   // Required.
//        'eventAction': 'click',      // Required.
//        'eventLabel': videoId
//      } );



      setTimeout( function () {

        $( 'html,body' ).animate( {
          scrollTop: videoOffset
        }, diff, function () {

          // Re-render main video part
          self.mainVideo.render( self.mainEpisode );

//          if ( !self.isTouch ) {
            // immediately render and play video
            self.mainVideo.renderVideo();
//          }

        } );

      }, 0 );


//      setTimeout(function() {
//        self.mainEpisode = foundValue;
//        self.mainVideo.render( self.mainEpisode );
//        if ( !self.isTouch ) {
//          self.mainVideo.renderVideo();
//        }
//      }, diff);

//      var target = document.getElementById( "mainEpisode" );
//      this.animateScroll( document.body, "scrollTop", "", document.body.scrollTop, target.offsetTop - 40, 600, true, function () {
//        if ( !self.isTouch ) {
//          self.mainVideo.renderVideo();
//        }
//      } );

      this.changeQuerystring();
      this.updateActiveVideo();
    },

    changeQuerystring: function () {
      if ( history.pushState ) {
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?video=' + this.mainEpisode.id;
        window.history.pushState( {path: newurl}, '', newurl );
      }
    },

    updateActiveVideo: function () {
      var currentVideoId = this.mainEpisode.id;
      var $episodeBlock = $( '.episodeBlock' );

      $episodeBlock.removeClass( 'activeVideo inactiveVideo' );
      $episodeBlock.addClass( 'inactiveVideo' );

      $( '.episodeBlock.' + currentVideoId ).removeClass( 'inactiveVideo' );
      $( '.episodeBlock.' + currentVideoId ).addClass( 'activeVideo' );
    },

    selectInitialVideo: function () {
      this.queryValue = "";
      var queryString = document.location.search;
      if ( queryString ) {
        var queryDate = queryString.split( '=' )[1];
        if ( queryDate ) {
          this.queryValue = queryDate;
        }
      }

      if ( this.queryValue ) {
        var foundValue = _.findWhere( this.allEpisodes, {
          'id': this.queryValue
        } );
        if ( foundValue ) {
          this.mainEpisode = foundValue;
        }
      }

      if ( typeof this.mainEpisode === "undefined" ) {
        this.mainEpisode = this.allEpisodes[0];
      }
    },


    initialize: function ( options ) {

      // Touch?
      this.isTouch = (('ontouchstart' in window) || ('ontouchstart' in document.documentElement) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
      if ( this.isTouch ) {
        $( 'body' ).addClass( 'touch' );
      } else {
        $( 'body' ).addClass( 'no-touch' );
      }

      // Get custom data for videos
      this.data = options.json;

      // Get videos data from YouTube playlist
      this.videos = this.getVideos( options.playlistItemsData );

      // Reverse the order of videos to get the last first
      this.videos.reverse();

      this.mainVideo = new mainVideo( {
        youtubeDataApiKey: options.youtubeDataApiKey,
        videos: this.videos,
        isTouch: this.isTouch,
        mainApp: this
      } );

      this.setupEvents();

//      console.log( this.data );
//      console.log( options.playlistItemsData );
//      console.log( this.videos );
    },

    setupEvents: function () {
      var click = this.isTouch ? 'touchstart' : 'click';

      //'click .episodeBlock.inactiveVideo': 'switchVideo'
      this.$el.on( click, '.episodeBlock.inactiveVideo .thumb-wrapper img', this.switchVideo.bind( this ) );

    },

    getVideos: function ( playlistItemsData ) {
      var videos = [];
      var items = playlistItemsData.items;
      var maxDescriptionLength = 80;

      items.forEach( function ( item, i ) {
        var item = item.snippet;

        if ( item.resourceId && item.resourceId.kind == "youtube#video" ) {
          var video = {};
          video.id = item.resourceId.videoId;
          video.youtubeId = video.id;
          video.title = item.title;
          video.description = item.description.replace( /\n/g, "<br>" );

          // Short description for end slate
          video.shortDescription = '';
          if ( video.description.length > 1 ) {
            video.shortDescription = item.description.substring( 0, maxDescriptionLength ) + '...';
            video.shortDescription = video.shortDescription.replace( /\n/g, "<br>" ).trim();
          }

          video.thumbnails = item.thumbnails;
          video.publishedAt = item.publishedAt;
          videos.push( video );
        }

      } );

      return videos;
    },

    formatDate: function ( date ) {
      var day = date.split( '/' )[0];
      var monthNumber = parseInt( date.split( '/' )[1] );
      var month = this.months[monthNumber - 1];
      return day + " " + month;
    },

    getEmbedPath: function ( url ) {
      var embedUrl = 'http://embed.theguardian.com/embed/video';
      var parsedUrl = document.createElement( 'a' );
      parsedUrl.href = url;

      var pathname = parsedUrl.pathname;

      if ( pathname[0] === "/" ) {
        return embedUrl + pathname;
      } else {
        return embedUrl + '/' + pathname;
      }
    },

    render: function () {
      var _this = this;
      this.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      //Format videos
      var videos = this.videos;
      this.allEpisodes = _.map( videos, function ( episode ) {
        if ( episode.date ) {
          episode.date = _this.formatDate( episode.date );
        }
        return episode;
      } );

      //Decide which video to play first
      this.selectInitialVideo();

      // Check if in app or on website
      var isWeb = true;
      if ( typeof window.guardian === "undefined" ) {
        isWeb = false;
      }

      $( '#article-body' ).addClass( 'interactivePadding' );
      $( '#article-header' ).addClass( 'interactiveHide' );

      // Render main template
      this.$el.html( Mustache.render( template, {
        allEpisodes: this.allEpisodes,
        teaser: this.teaser,
        isWeb: isWeb
      } ) );

      // Render main video
      this.$( '#mainVideoContainer' ).html( this.mainVideo.render( this.mainEpisode ).el );

      // Remove the poster and create youtube player
      if ( this.isTouch ) {
        this.mainVideo.renderVideo();
      }

      this.updateActiveVideo();

      return this;
    }
  } );
} );

