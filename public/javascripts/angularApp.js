(function() {
    var app = angular.module('mainApp', ['ui.router']);

    app.config([
        '$stateProvider',
        '$urlRouterProvider',
        function($stateProvider, $urlRouterProvider) {
            $stateProvider
                .state('home', {
                    url: '/home',
                    templateUrl: '/home.html',
                    controller: 'MainCtrl',
                    onEnter: ['$state', 'auth', function($state, auth) {
                      if (auth.isLoggedIn()) {
                        $state.go('profile')
                      }
                    }]
                })
                .state('profile', {
                    url: '/profile',
                    templateUrl: '/profile.html',
                    controller: 'ProfileCtrl',
                    onEnter: ['$state', 'auth', function($state, auth) {
                      if (!auth.isLoggedIn()) {
                        $state.go('home')
                      }
                    }]
                })
                .state('posts', {
                    url: '/posts/{id}',
                    templateUrl: '/posts.html',
                    controller: 'PostsCtrl',
                    resolve: {
                        post: ['$stateParams', 'posts', function($stateParams, posts) {
                            return posts.get($stateParams.id);
                        }],
                    },
                });
            $urlRouterProvider.otherwise('home');
        }
    ]);

    app.controller('MainCtrl', [
        '$scope',
        '$state',
        'auth',
        'posts',
      function($scope, $state, auth, posts) {
        $scope.user = {};

        $scope.register = function(){
          auth.register($scope.user).error(function(error){
            $scope.error = error;
          }).then(function(){
            $state.go('profile');
          });
        };

        $scope.logIn = function(){
          auth.logIn($scope.user).error(function(error){
            $scope.error = error;
          }).then(function(){
            $state.go('profile');
          });
        };

        $scope.posts = posts.posts;

        $scope.addPost = function() {
            if (!$scope.title || $scope.title === '')
                return;

            posts.create({
                title: $scope.title,
                link: $scope.link,
            });

            $scope.title = '';
            $scope.link = '';
        };

        $scope.incrementUpvotes = function(post) {
            posts.upvote(post);
        }

    }]);

    app.controller('ProfileCtrl', [
        '$scope',
        '$state',
        'auth',
      function($scope, $state, auth) {
        $scope.ride = {};

    }]);

    app.factory('posts', ['$http', function($http) {
        var o = {
            posts: [],
        };

        o.getAll = function() {
            return $http.get('/posts').success(function(data) {
                angular.copy(data, o.posts);
            });
        };

        o.create = function(post) {
            console.log(post);
            return $http.post('/posts', post).success(function(data) {
                o.posts.push(data);
            });
        };

        o.upvote = function(post) {
            return $http.put('/posts/' + post._id + '/upvote')
              .success(function(data) {
                post.upvotes ++;
              });
        };

        o.get = function(id) {
            return $http.get('/posts/' + id).then(function(res) {
                console.log(res);
                return res.data;
            });
        };

        o.addComment = function(id, comment) {
            return $http.post('/posts/' + id + '/comments', comment);
        };

        o.upvoteComment = function(post, comment) {
            return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote')
              .success(function(data) {
                comment.upvotes ++;
              });
        }

        return o;
    }]);

    app.factory('auth', ['$http', '$window', function($http, $window){
      var auth = {};

      auth.saveToken = function (token){
        $window.localStorage['token'] = token;
      };

      auth.getToken = function (){
        return $window.localStorage['token'];
      };

      auth.isLoggedIn = function(){
        var token = auth.getToken();

        if(token){
          var payload = JSON.parse($window.atob(token.split('.')[1]));

          return payload.exp > Date.now() / 1000;
        } else {
          return false;
        }
      };

      auth.currentUser = function(){
        if(auth.isLoggedIn()){
          var token = auth.getToken();
          var payload = JSON.parse($window.atob(token.split('.')[1]));

          return payload.username;
        }
      };

      auth.register = function(user){
        return $http.post('/signup', user).success(function(data){
          auth.saveToken(data.token);
        });
      };

      auth.logIn = function(user){
        return $http.post('/login', user).success(function(data){
          auth.saveToken(data.token);
        });
      };

      auth.logOut = function(){
        $window.localStorage.removeItem('token');
      };

      return auth;
    }]);

})();
