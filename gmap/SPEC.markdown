GmapDomtalker
=====================================
 * display gmap's properties as form values
   * caliculate special values if necessary
 * adjust gmap to the form
 * manage event handlers
   * user's operational event (e.g submit form)
   * gmap event (e.g moveend)
 * simple interface to gmap


actors
-------------------------------------
 * gmap:   google-map script/object
   * display: dom element for gmap
 * iw:     infowindow in google's term
 * talker: this one
   * form: html form talker has
 * manager: managing markers and its iws


interaction
-------------------------------------
 * gmap.touch:   assign gmap values to the form
 * talker.touch: adjust gmap as the form, then renew form values


marker/iw update sequence
-------------------------------------
 * (suppose to get new data)
 * make new markers
   * request/update iw
 * clear & update

