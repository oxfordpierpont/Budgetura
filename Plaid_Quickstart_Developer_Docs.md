### [Introduction](https://plaid.com/docs/quickstart/#introduction)

Let’s test out running Plaid locally by cloning the Quickstart app. You’ll need API keys, which you can receive by signing up in the [Dashboard](https://dashboard.plaid.com/developers/keys).

You'll have two different API keys, and there are three different Plaid environments. Today we'll start in the Sandbox environment. View the API Keys section of the Dashboard to find your Sandbox secret.

###### **API Key**

[View Keys in Dashboard](https://dashboard.plaid.com/developers/keys)  
**client\_id**  
Private identifier for your team  
**secret**  
Private key, one for each of the three environments

###### **Environment**

**Sandbox**  
Get started with test credentials and life-like data  
**Production**  
Test or launch your app with unlimited live credentials  
If you get stuck at any point in the Quickstart, help is just a click away\! Check the Quickstart [troubleshooting guide](https://github.com/plaid/quickstart#troubleshooting) or ask other developers in our [Stack Overflow community](https://stackoverflow.com/questions/tagged/plaid).

### [Quickstart setup](https://plaid.com/docs/quickstart/#quickstart-setup)

Once you have your API keys, it's time to run the Plaid Quickstart locally\! The instructions below will guide you through the process of cloning the [Quickstart repository](https://github.com/plaid/quickstart), customizing the .env file with your own Plaid client ID and Sandbox secret, and finally, building and running the app.

Plaid offers both Docker and non-Docker options for the Quickstart. If you don't have Docker installed, you may wish to use the non-Docker version; this path is especially recommended for Windows users who do not have Docker installations. However, if you already have Docker installed, we recommend the Docker option because it is simpler and easier to run the Quickstart. Below are instructions on setting up the Quickstart with Docker and non-Docker configurations.

Select group for content switcher  
Non-Docker  
Docker

#### [Setting up without Docker](https://plaid.com/docs/quickstart/#setting-up-without-docker)

Make sure you have [npm installed](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) before following along. If you're using Windows, ensure you have a terminal capable of running basic Unix shell commands.  
1\. Clone the Quickstart and run the backend  
Node▼

```javascript

```

Open a new shell and start the frontend app. Your app will be running at `http://localhost:3000`.

2\. Run the Quickstart frontend

```shell

```

Visit localhost and log in with Sandbox credentials (typically `user_good` and `pass_good`, as indicated at the bottom of the page).

Plaid Quickstart guide with 'Launch Link' button to simulate user bank account integration.

#### [Setting up with Docker](https://plaid.com/docs/quickstart/#setting-up-with-docker)

Docker is a software platform that packages software into standardized units called containers that have everything the software needs to run, including libraries, system tools, code, and runtime. If you don't already have Docker, you can [download it from the Docker site](https://docs.docker.com/get-docker/). Note that Windows users may need to take some additional steps, such installing a Linux environment; if you are using Windows and do not already have a Linux environment installed, we recommend selecting the non-Docker instructions instead.

Once Docker is installed, launch the Docker app, then use the following commands at the command line to configure and run the Quickstart. If the `make` commands do not work, ensure that Docker is running. You may also need to prefix the `make` commands with `sudo`, depending on your environment.

1\. Clone and run the Quickstart

```shell

# Note: If on Windows, run

# git clone -c core.symlinks=true https://github.com/plaid/quickstart

# instead to ensure correct symlink behavior



git clone https://github.com/plaid/quickstart.git

cd quickstart



# Copy the .env.example file to .env, then fill

# out PLAID_CLIENT_ID and PLAID_SECRET in .env

cp .env.example .env



# start the container for one of these languages:

# node, python, java, ruby, or go



make up language=node



# Go to http://localhost:3000
```

Visit localhost and log in with Sandbox credentials (typically `user_good` and `pass_good`, as indicated at the bottom of the page).

Plaid Quickstart page with 'Launch Link' button to connect bank accounts via Plaid API integration.  
View the logs

```shell

$ make logs language=node
```

Stop the container

```shell

$ make stop language=node
```

#### [Create your first Item](https://plaid.com/docs/quickstart/#create-your-first-item)

Most API requests interact with an *Item*, which is a Plaid term for a login at a financial institution. A single end-user of your application might have accounts at different financial institutions, which means they would have multiple different Items. An Item is not the same as a financial institution account, although every account will be associated with an Item. For example, if a user has one login at their bank that allows them to access both their checking account and their savings account, a single Item would be associated with both of those accounts.

Now that you have the Quickstart running, you’ll add your first Item in the Sandbox environment. Once you’ve opened the Quickstart app on localhost, click the Launch Link button and select any institution. Use the Sandbox credentials to simulate a successful login.

##### [**Sandbox credentials**](https://plaid.com/docs/quickstart/#sandbox-credentials)

```shell

username: user_good

password: pass_good

If prompted to enter a 2FA code: 1234
```

Once you have entered your credentials and moved to the next screen, you have created your first Item\! You can now make API calls for that Item by using the buttons in the Quickstart. In the next section, we'll explain what actually happened and how the Quickstart works.

### [How it works](https://plaid.com/docs/quickstart/#how-it-works)

As you might have noticed, you use both a server and a client-side component to access the Plaid APIs. The flow looks like this:

The Plaid flow begins when your user wants to connect their bank account to your app.

1Call [`/link/token/create`](https://plaid.com/docs/api/link/#linktokencreate) to create a `link_token` and pass the temporary token to your app's client.

2Use the `link_token` to open Link for your user. In the [`onSuccess` callback](https://plaid.com/docs/link/web/#onsuccess), Link will provide a temporary `public_token`. This token can also be obtained on the backend via \`/link/token/get\`.

3Call [`/item/public_token/exchange`](https://plaid.com/docs/api/items/#itempublic_tokenexchange) to exchange the `public_token` for a permanent `access_token` and `item_id` for the new `Item`.

4Store the `access_token` and use it to make product requests for your user's `Item`.

The first step is to create a new `link_token` by making a [`/link/token/create`](https://plaid.com/docs/api/link/#linktokencreate) request and passing in the required configurations. This `link_token` is a short lived, one-time use token that authenticates your app with [Plaid Link](https://plaid.com/docs/link/), our frontend module. Several of the environment variables you configured when launching the Quickstart, such as `PLAID_PRODUCTS`, are used as parameters for the `link_token`.

Node▼

```javascript

app.post('/api/create_link_token', async function (request, response) {

 // Get the client_user_id by searching for the current user

 const user = await User.find(...);

 const clientUserId = user.id;

 const request = {

   user: {

     // This should correspond to a unique id for the current user.

     client_user_id: clientUserId,

   },

   client_name: 'Plaid Test App',

   products: ['auth'],

   language: 'en',

   webhook: 'https://webhook.example.com',

   redirect_uri: 'https://domainname.com/oauth-page.html',

   country_codes: ['US'],

 };

 try {

   const createTokenResponse = await client.linkTokenCreate(request);

   response.json(createTokenResponse.data);

 } catch (error) {

   // handle error

 }

});

```

Once you have a `link_token`, you can use it to initialize [Link](https://plaid.com/docs/link/). Link is a drop-in client-side module available for web, iOS, and Android that handles the authentication process. The Quickstart uses Plaid's optional React bindings for an integration that you trigger via your own client-side code. This is what your users use to log into their financial institution accounts.

After a user submits their credentials within Link, Link provides you with a `public_token` via the `onSuccess` callback. The code below shows how the Quickstart passes the `public_token` from client-side code to the server. Both React and vanilla JavaScript examples are shown.

Initialize Link  
JavaScript▼  
JavaScript  
React

```javascript

<button id="link-button">Link Account</button>

<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>

<script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>

<script type="text/javascript">

(async function($) {

 var handler = Plaid.create({

   // Create a new link_token to initialize Link

   token: (await $.post('/create_link_token')).link_token,

   onLoad: function() {

     // Optional, called when Link loads

   },

   onSuccess: function(public_token, metadata) {

     // Send the public_token to your app server.

     // The metadata object contains info about the institution the

     // user selected and the account ID or IDs, if the

     // Account Select view is enabled.

     $.post('/exchange_public_token', {

       public_token: public_token,

     });

   },

   onExit: function(err, metadata) {

     // The user exited the Link flow.

     if (err != null) {

       // The user encountered a Plaid API error prior to exiting.

     }

     // metadata contains information about the institution

     // that the user selected and the most recent API request IDs.

     // Storing this information can be helpful for support.

   },

   onEvent: function(eventName, metadata) {

     // Optionally capture Link flow events, streamed through

     // this callback as your users connect an Item to Plaid.

     // For example:

     // eventName = "TRANSITION_VIEW"

     // metadata  = {

     //   link_session_id: "123-abc",

     //   mfa_type:        "questions",

     //   timestamp:       "2017-09-14T14:42:19.350Z",

     //   view_name:       "MFA",

     // }

   }

 });



 $('#link-button').on('click', function(e) {

   handler.open();

 });

})(jQuery);

</script>

```

Next, on the server side, the Quickstart calls [`/item/public_token/exchange`](https://plaid.com/docs/api/items/#itempublic_tokenexchange) to obtain an `access_token`, as illustrated in the code excerpt below. The `access_token` uniquely identifies an Item and is a required argument for most Plaid API endpoints. In your own code, you'll need to securely store your `access_token` in order to make API requests for that Item.

Node▼

```javascript

app.post('/api/exchange_public_token', async function (

 request,

 response,

 next,

) {

 const publicToken = request.body.public_token;

 try {

   const response = await client.itemPublicTokenExchange({

     public_token: publicToken,

   });



   // These values should be saved to a persistent database and

   // associated with the currently signed-in user

   const accessToken = response.data.access_token;

   const itemID = response.data.item_id;



   res.json({ public_token_exchange: 'complete' });

 } catch (error) {

   // handle error

 }

});

```

#### [Making API requests](https://plaid.com/docs/quickstart/#making-api-requests)

Now that we've gone over the Link flow and token exchange process, we can explore what happens when you press a button in the Quickstart to make an API call. As an example, we'll look at the Quickstart's call to [`/accounts/get`](https://plaid.com/docs/api/accounts/#accountsget), which retrieves basic information, such as name and balance, about the accounts associated with an Item. The call is fairly straightforward and uses the `access_token` as a single argument to the Plaid client object.

/accounts/get  
Node▼

```javascript

app.get('/api/accounts', async function (request, response, next) {

 try {

   const accountsResponse = await client.accountsGet({

     access_token: accessToken,

   });

   prettyPrintResponse(accountsResponse);

   response.json(accountsResponse.data);

 } catch (error) {

   prettyPrintResponse(error);

   return response.json(formatError(error.response));

 }

});

```

Example response data:

/accounts/get response

```json

{

 "accounts": [

   {

     "account_id": "A3wenK5EQRfKlnxlBbVXtPw9gyazDWu1EdaZD",

     "balances": {

       "available": 100,

       "current": 110,

       "iso_currency_code": "USD",

       "limit": null,

       "unofficial_currency_code": null

     },

     "mask": "0000",

     "name": "Plaid Checking",

     "official_name": "Plaid Gold Standard 0% Interest Checking",

     "subtype": "checking",

     "type": "depository"

   },

   {

     "account_id": "GPnpQdbD35uKdxndAwmbt6aRXryj4AC1yQqmd",

     "balances": {

       "available": 200,

       "current": 210,

       "iso_currency_code": "USD",

       "limit": null,

       "unofficial_currency_code": null

     },

     "mask": "1111",

     "name": "Plaid Saving",

     "official_name": "Plaid Silver Standard 0.1% Interest Saving",

     "subtype": "savings",

     "type": "depository"

   },

   {

     "account_id": "nVRK5AmnpzFGv6LvpEoRivjk9p7N16F6wnZrX",

     "balances": {

       "available": null,

       "current": 1000,

       "iso_currency_code": "USD",

       "limit": null,

       "unofficial_currency_code": null

     },

     "mask": "2222",

     "name": "Plaid CD",

     "official_name": "Plaid Bronze Standard 0.2% Interest CD",

     "subtype": "cd",

     "type": "depository"

   }

   ...

 ],

 "item": {

   "available_products": [

     "assets",

     "balance",

     "identity",

     "investments",

     "transactions"

   ],

   "billed_products": ["auth"],

   "consent_expiration_time": null,

   "error": null,

   "institution_id": "ins_12",

   "item_id": "gVM8b7wWA5FEVkjVom3ri7oRXGG4mPIgNNrBy",

   "webhook": "https://requestb.in"

 },

 "request_id": "C3IZlexgvNTSukt"

}
```

#### [Next steps](https://plaid.com/docs/quickstart/#next-steps)

Congratulations, you have completed the Plaid Quickstart\! From here, we invite you to modify the Quickstart code in order to get more practice with the Plaid API. There are a few directions you can go in now:
