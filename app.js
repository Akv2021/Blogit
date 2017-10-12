var app = angular.module('myApp',['ui.router','ngToast','textAngular']);

app.run(function($rootScope, AuthService,$state,$transitions){
 /*$rootScope.$on('$stateChangeStart',function(event, toState, toParams, fromState,fromParams){
     if(toState.authenticate == true){
         AuthService.isAuthenticated()
         .then(function(res){
             console.log(res);
             if(res == false)
                {
                    $state.go('login');
                }
         });
     }
 })
});
*/

$transitions.onStart({}, function(transition){
    if(transition.$to().self.authenticate == true){
        AuthService.isAuthenticated()
        .then(function(res){
            console.log(res);
            if (res == false) {
                $state.go('login');
            }
        });
    }
})

});



app.config(function($stateProvider,$urlRouterProvider,$locationProvider){
    Stamplay.init('premiumblogs');                                     // c9 change
  // localStorage.removeItem("https://blogit-revo96.c9users.io-jwt");        //c9 change
  localStorage.clear();
    $locationProvider.hashPrefix('');
     $stateProvider
    .state('home', {
        url: '/',
        templateUrl: 'template/home.html',
        controller: "HomeCtrl"
    })  
    .state('login', {
        url: '/login',
        templateUrl: 'template/login.html',
        controller: "LoginCtrl"
    })
    .state('signup', {
        url: '/signup',
        templateUrl: 'template/signup.html',
        controller: "SignUpCtrl"
    })
    .state('MyBlogs',{
        url: '/myBlogs',
        templateUrl: 'template/myBlogs.html',
        controller: 'MyBlogsCtrl',
        authenticate: true
    })
    .state('Create',{
        url: '/create',
        templateUrl: 'template/create.html',
        controller: 'CreateCtrl',
        authenticate: true
    })
    .state('Edit',{
        url: '/edit/:id',
        templateUrl: 'template/edit.html',
        controller: 'EditCtrl',
        authenticate: true
    })
     .state('delete', {
      //  url: '/login',
      //  templateUrl: 'template/login.html',
        controller: "DeleteCtrl"
    })
    .state('View', {
        url: '/view/:id',
        templateUrl: 'template/view.html',
        controller: 'ViewCtrl'
    });
    
    $urlRouterProvider.otherwise("/");
});

app.filter('htmlToPlainText', function(){
    return function(text){
        return text ? String(text).replace(/<[^>]+>/gm, '') : '';
    }
});

app.factory('AuthService', function($q, $rootScope){ 
    return { 
        isAuthenticated : function(){ 
            var defer = $q.defer();

        Stamplay.User.currentUser(function(err, res){ 
            if(err){ 
                defer.resolve(false); 
                $rootScope.loggedIn = false; 
            }
        else                        //my change
        if(res.user){ 
            defer.resolve(true); 
            $rootScope.loggedIn = true;
        }
        else{ 
            defer.resolve(false); 
            $rootScope.loggedIn = false; 
        }
    });
    
    return defer.promise;

        }
    }
});


app.controller('HomeCtrl',function($scope,$http){ 
Stamplay.Object("blogs").get({sort : "-dt_create"})
.then(function(res){
    console.log(res); 
    $scope.latestBlogs = res.data; 
    $scope.$apply(); 
    console.log($scope.latestBlogs); 
}, function(err){ 
    console.log(err); 
}); 
}) ; 



app.controller('MyBlogsCtrl',function($scope,$state){
Stamplay.User.currentUser().then(function(res){
    if(res.user){                                               //JSON object as parameters. Two properties are owner & sort
        Stamplay.Object("blogs").get({owner: res.user._id, sort : "-dt_create"})    //get posts of user.
        .then(function(response){
            console.log(response);
            $scope.userBlogs = response.data;
            $scope.$apply();                // shall I not inject $appply.
            console.log($scope.userBlogs);
            }, function(err){
             console.log(err); 
         });
    }
        else{                               // Go to login if not logged in.
            $state.go('login');
        }
}, function(err){
    console.log(err);
});

});

app.controller('CreateCtrl',function(taOptions,$scope,$state, $timeout,ngToast){

    $scope.newPost = {};

 taOptions.toolbar = [
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
      ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
      ['justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent'],
      ['html', 'insertImage','insertLink', 'insertVideo', 'wordcount', 'charcount']
  ];

  $scope.create = function(){
      Stamplay.User.currentUser()
      .then(function(res){
        if(res.user){
            //proceed with post
            Stamplay.Object("blogs").save($scope.newPost)
            .then(function(res){
             $timeout(function(){
                ngToast.create("Post created successfully");
            });
            $state.go('MyBlogs');
            },function(err){
            $timeout(function(){
            ngToast.create("An error occured while creating the post. Please try again later!");
            })
            console.log(err);
            })
        }
        else{
            $state.go('login');
        }
      },function(err){
            $timeout(function(){
                ngToast.create("An error has occured. Please try again later!");
            })
            console.log(err);
      })
  }

});

app.controller('EditCtrl',function(taOptions,$scope,$state,$stateParams, $timeout,ngToast){

    $scope.Post = {};

         taOptions.toolbar = [
      ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'quote'],
      ['bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol', 'redo', 'undo', 'clear'],
      ['justifyLeft', 'justifyCenter', 'justifyRight', 'indent', 'outdent'],
      ['html', 'insertImage','insertLink', 'insertVideo', 'wordcount', 'charcount']
  ];

    Stamplay.Object("blogs").get({_id: $stateParams.id})    //
        .then(function(res){
            console.log(res);
            $scope.Post = res.data[0];
            $scope.$apply();                // shall I not inject $appply.
            console.log($scope.Post);
            }, function(err){
             console.log(err); 
         });
    $scope.update = function(){
        Stamplay.User.currentUser().then(function(res){ 
            if(res.user){
                if(res.user._id == $scope.Post.owner){ 
                    Stamplay.Object("blogs").update($stateParams.id, $scope.Post) 
                    .then(function(response){ 
                        console.log(response); 
                        $state.go("MyBlogs"); 
                    }, function(error){ 
                        console.log(error); 
                    });
                    } 
                else
                        $state.go("login"); 
                    }
                    else 
                        $state.go("login"); 
                    }, function(err){ 
                    console.log(err);
                });
    }
});

app.controller('ViewCtrl',function($scope,$stateParams,$timeout,$state,ngToast){

//$scope.upVoteCount = 0; 
//$scope.downVoteCount = 5; 

Stamplay.Object("blogs").get({_id: $stateParams.id}) 
.then(function(response){ 
    console.log(response); 
    $scope.blog = response.data[0];
    $scope.upVoteCount = $scope.blog.actions.votes.users_upvote.length;
    $scope.downVoteCount = $scope.blog.actions.votes.users_downvote.length;  
    $scope.$apply(); 
},function(error){
    console.log(error); 
})

$scope.postComment = function(){ 
    Stamplay.Object("blogs").comment($stateParams.id, $scope.comment) 
    .then(function(res){ 
        console.log(res); 
        $scope.blog = res; 
        $scope.comment = ""; 
        $scope.$apply(); 
        },function(err){ 
            console.log(err); 
            if(err.code == 403){ 
                console.log("Login first!"); 
                $timeout(function(){
                    ngToast.create('<a href="#/login" class="">Please login before posting comments!.</a>'); 
                });
            }
        })
}

$scope.upVote = function(){
    Stamplay.Object("blogs").upVote($stateParams.id)
    .then(function(res){
        console.log(res); 
        $scope.blog = res; 
        $scope.comment = ""; 
        $scope.upVoteCount = $scope.blog.actions.votes.users_upvote.length;
        $scope.downVoteCount = $scope.blog.actions.votes.users_downvote.length;
        $scope.$apply(); 
    }, function(err){ 
        console. log(err); 
        if(err.code == 403){ 
            console.log("Login first!"); 
            $timeout(function(){ 
                ngToast.create( '<a href="#/login" class="">Please login before voting.</a>' 
            ); 
        }); 
        }
        if(err.code == 406){
            console.log("Already Voted!"); 
            $timeout(function(){ 
                ngToast.create('You have already voted on this Post.'); 
            }); 
        }
    }) 
}

$scope.downVote = function(){
    Stamplay.Object("blogs").downVote($stateParams.id)
    .then(function(res){
        console.log(res); 
        $scope.blog = res; 
        $scope.comment = ""; 
        $scope.upVoteCount = $scope.blog.actions.votes.users_upvote.length;               //shall this be included as well?
        $scope.downVoteCount = $scope.blog.actions.votes.users_downvote.length; 
        $scope.$apply(); 
    }, function(err){ 
        console. log(err); 
        if(err.code == 403){ 
            console.log("Login first!"); 
            $timeout(function(){ 
                ngToast.create( '<a href="#/login" class="">Please login before voting.</a>' 
            ); 
        }); 
        }
        if(err.code == 406){
            console.log("Already Voted!"); 
            $timeout(function(){ 
                ngToast.create('You have already voted on this Post.'); 
            }); 
        }
    }) 
}

});

app.controller('LoginCtrl',function($scope, $state, $timeout, $rootScope, ngToast){
        $scope.login = function(){                  //UDF
        Stamplay.User.currentUser()
        .then(function(res){
            console.log(res);
            if(res.user){
                $rootScope.loggedIn = true;
                $rootScope.displayName = res.user.firstName+" "+res.user.lastName;
                //user already logged in
               $timeout(function(){ $state.go("MyBlogs");
            });
            }
            else{
                //proceed with login
                Stamplay.User.login($scope.User)            // Stamplay function
                .then(function(res){  
                    console.log("logged In as" + res);
                    $timeout(function(){
                        ngToast.create("Login successful.");
                    })
                    $rootScope.loggedIn = true;
                    $rootScope.displayName = res.firstName+" "+res.lastName;
                    $timeout(function(){ $state.go("MyBlogs");
            });
                }, function(err){
                    console.log(err);
                    $rootScope.loggedIn = false;
                      $timeout(function(){
                        ngToast.create("Login failed!");
                    })
                })
            }
        }, function(error){
            console.log(error);
              $timeout(function(){
                        ngToast.create("An error has occured. Please try again later");
                    })
        })
    }
});

app.controller('SignUpCtrl',function($scope,ngToast,$timeout){
    $scope.newUser = {};
    $scope.signup = function(){
        $scope.newUser.displayName = $scope.newUser.firstName + " " + $scope.newUser.lastName;

      if($scope.newUser.firstName && $scope.newUser.lastName && $scope.newUser.email && $scope.newUser.password && $scope.newUser.confirmPassword)
          {
              console.log("All Fields are valid.")
              if($scope.newUser.password == $scope.newUser.confirmPassword){
                  console.log('Ready to Sign Up');
                //  $scope.newUser.fullName = $scope.newUser.firstName + ' ' + $scope.newUser.lastName;
                //  console.log($scope.newUser.fullName + " signed up !");
                  Stamplay.User.signup($scope.newUser)
                  .then(function(response){
                      $timeout(function(){ngToast.create("Your account has been created. Please login!")});
                      console.log(response);
                  }, function(error){
                      ngToast.create("An error has occured. Please try later.")
                      console.log(error);
                  });
              }
                  else{
                      ngToast.create("Passwords dont match");
                      console.log('Oops! Password doesnt match');}
          }
        else{ 
            ngToast.create("Some fields are invalid");
            console.log('Some fields are invalid');
        }
    };
});
/*
app.controller('DeleteCtrl',function($scope,$stateParams){
    //$scope.newUser = {};
    $scope.delete = function(){
                  console.log('Ready to Delete');
                 Stamplay.Object("blogs").remove($stateParams.id);
          }
    });
    */

app.controller('MainCtrl',function($scope,$rootScope,$timeout){
$scope.logout = function(){
    console.log("logout called");
    //localStorage.removeItem('https://blogit-revo96.c9users.io-jwt');               //c9 change
    Stamplay.User.logout(true, function(){          // remove this
        console.log("Logged Out!");

        $timeout(function(){
            $rootScope.loggedIn = false;
        })
    })                          // and this line.
}
});
