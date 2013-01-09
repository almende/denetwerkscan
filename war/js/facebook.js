/**
 * Import Facebook friends
 * @param {function} callback  A status callback event which is called multiple
 *                             times, giving status information.
 *                             The method is called with one object as parameter,
 *                             having fields:
 *                                 {'status': 'init'}    facebook client library is initializing
 *                                 {'status': 'login'}   user needs to log in by clicking on a facebook login button
 *                                 {'status': 'import'}  busy importing the friends
 *                                 {'status': 'me', 'me': {...}}  finished successfully, returns the retrieved personal information.
 *                                 {'status': 'friends', 'friends': [...]}  finished successfully, returns the retrieved friends.
 *                                                                          the friends are objects like {'id':123, 'name': 'Friend Name'}
 */
function importFacebookFriends(callback) {
    if (!window.fbAsyncInit) {
        callback({status: 'init'});

        window.fbAsyncInit = function() {
            // init the FB JS SDK
            FB.init({
                appId      : '491454177572909', // App ID from the App Dashboard
                //channelUrl : '//denetwerkscan.appspot.com', // Channel File for x-domain communication
                status     : true, // check the login status upon init?
                cookie     : true, // set sessions cookies to allow your server to access the session?
                xfbml      : true  // parse XFBML tags on this page?
            });

            // Additional initialization code such as adding Event Listeners goes here

            /* All the events registered */
            FB.Event.subscribe('auth.login', function(response) {
                getMe();
            });

            getLoginStatus();
        };

        // Load the SDK's source Asynchronously
        // Note that the debug version is being actively developed and might
        // contain some type checks that are overly strict.
        // Please report such bugs using the bugs tool.
        (function(d, debug){
            var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
            if (d.getElementById(id)) {return;}
            js = d.createElement('script'); js.id = id; js.async = true;
            js.src = "//connect.facebook.net/en_US/all" + (debug ? "/debug" : "") + ".js";
            ref.parentNode.insertBefore(js, ref);
        }(document, /*debug*/ false));
    }
    else {
        getLoginStatus();
    }

    function getLoginStatus() {
        FB.getLoginStatus(function(response) {
            if (response.status == "connected") {
                getMe();
            } else {
                callback({status: 'login'});
            }
        });
    }

    // TODO: use authorize to get the users birthday
    /*
    function authorize() {
        FB.login(function() {
            getMe();
        }, {scope: 'user_birthday'});
    }
    */

    function getMe () {
        callback({status: 'import'});
        var id = 'me';
        FB.api('/' + id, function(result) {
            callback({
                status: 'me',
                me: result
            });
            getFriends();
        });
    }

    function getFriends () {
        callback({status: 'import'});
        var id = 'me';
        FB.api('/' + id + '/friends', function(result) {
            callback({
                status: 'friends',
                friends: result.data
            });
        });
    }
}

/**
 * Filter given array with friends. Friends which have a lower case name
 * starting with parameter name will be returned
 * @param {Object[]} friends
 * @param {String} name
 * @return {Object[]} filteredFriends
 */
function filterFacebookFriends(friends, name) {
    return $.grep(friends, function (friend) {
        return (friend && friend.name &&
            friend.name.toLowerCase().indexOf(name.toLowerCase()) == 0);
    });
}

/**
 * Calculate age based on birthday
 * http://stackoverflow.com/a/7091965/1262753
 * @param {String} dateString
 * @return {Number} age
 */
function getAge(dateString) {
    var today = new Date();
    var birthDate = new Date(dateString);
    var age = today.getFullYear() - birthDate.getFullYear();
    var m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
