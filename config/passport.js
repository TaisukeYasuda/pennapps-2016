// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var LyftStrategy = require('passport-lyft').Strategy;

// load up the user model
var User            = require('../models/User');

// load the auth variables
var configAuth = require('./auth');

// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

    passport.use(new LyftStrategy({
        clientID: configAuth.lyftAuth.clientID,
        clientSecret: configAuth.lyftAuth.clientSecret,
        callbackURL: configAuth.lyftAuth.callbackURL,
        state: true,
        passReqToCallback: true
      },
      function(req, accessToken, refreshToken, profile, done) {
        process.nextTick(function() {
          if (!req.user) {
                // try to find the user based on their lyft id
                var user = profile;
                user.lyft = {accessToken: accessToken};
                User.findOne({ 'lyft.id' : profile.id }, function(err, user) {
                    if (err)
                        return done(err);
                    if (user) {
                        // if a user is found, log them in
                        return done(null, user);
                    } else {
                        // if the user isnt in our database, create a new user
                        var newUser        = new User();

                        // set all of the relevant information
                        newUser.lyft.id    = profile.id;

                        // save the user
                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            return done(null, newUser);
                        });
                    }
                });
        } else {
          // user already exists and is logged in, we have to link accounts
          var user            = req.user; // pull the user out of the session

          // update the current users facebook credentials
          user.lyft = {accessToken: accessToken};
          user.lyft.id = profile.id;

          // save the user
          user.save(function(err) {
              if (err)
                  throw err;
              return done(null, user);
          });
        }
      });

    }));

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
      },
      function(req, email, password, done) {

          // asynchronous
          // User.findOne wont fire unless data is sent back
          process.nextTick(function() {

            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.findOne({ 'local.email' :  email }, function(err, user) {
                // if there are any errors, return the error
                if (err)
                    return done(err);

                // check to see if theres already a user with that email
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {

                    // if there is no user with that email
                    // create the user
                    var newUser            = new User();

                    // set the user's local credentials
                    newUser.local.email    = email;
                    newUser.local.password = newUser.generateHash(password);

                    // save the user
                    newUser.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }

            });

          });
    }));

    passport.use('local-login', new LocalStrategy({
          // by default, local strategy uses username and password, we will override with email
          usernameField : 'email',
          passwordField : 'password',
          passReqToCallback : true // allows us to pass back the entire request to the callback
      },
      function(req, email, password, done) { // callback with email and password from our form

          // find a user whose email is the same as the forms email
          // we are checking to see if the user trying to login already exists
          User.findOne({ 'local.email' :  email }, function(err, user) {
              // if there are any errors, return the error before anything else
              if (err)
                  return done(err);

              // if no user is found, return the message
              if (!user)
                  return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

              // if the user is found but the password is wrong
              if (!user.validPassword(password))
                  return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

              // all is well, return successful user
              return done(null, user);
          });

      }));

};
