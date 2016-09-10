var mongoose = require('mongoose');
var User = mongoose.model('User');
var jwt = require('express-jwt');
var auth = jwt({secret: process.env.JWT_KEY, userProperty: 'payload'});

module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });

    app.get('/auth/lyft',
      passport.authenticate('lyft', { scope: ['public','profile'] }
    ));

    app.get('/auth/lyft/callback', passport.authenticate('lyft', { failureRedirect: '/login' }),
      function(req, res) {
        res.redirect('/profile');
    });

    app.get('/connect/lyft',
      passport.authorize('lyft', { scope: ['public','profile'] }
    ));

    app.get('/connect/lyft/callback',
        passport.authorize('lyft', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }
    ));

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', function(req, res, next) {
        if(!req.body.email || !req.body.password){
          return res.status(400).json({message: 'Please fill out all fields'});
        }
        passport.authenticate('local-login', function(err, user, info) {
          if(err){ return next(err); }

          if(user){
            return res.json({token: user.generateJWT()});
          } else {
            return res.status(401).json(info);
          }
        })(req, res, next);
      }
    );

    // process the login form
    // app.post('/login', do all our passport stuff here);

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', function(req, res, next) {
      if(!req.body.email || !req.body.password){
        return res.status(400).json({message: 'Please fill out all fields'});
      }

      var user = new User();

      user.local = {};
      user.local.email = req.body.email;
      user.local.password = user.generateHash(req.body.password);

      user.save(function (err){
        if(err){ return next(err); }

        return res.json({token: user.generateJWT()})
      });
    });

    // process the signup form
    // app.post('/signup', do all our passport stuff here);

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
