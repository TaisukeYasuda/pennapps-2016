// expose our config directly to our application using module.exports
module.exports = {

    'lyftAuth' : {
        'clientID'      : process.env.LYFT_CLIENT_ID,
        'clientToken'   : process.env.LYFT_CLIENT_TOKEN, // your App ID
        'clientSecret'  : process.env.LYFT_CLIENT_SECRET, // your App Secret
        'callbackURL'   : 'http://localhost:3000/auth/lyft/callback'
    }

};
