require('dotenv').config();
const path = require('path');
const express = require('express');
const axios = require('axios');
const ejs = require('ejs');
var bodyParser = require('body-parser');

// require fs to write to pspRef file
const fs = require('fs');

const { Client, Config, CheckoutAPI } = require('@adyen/api-library');
const { PORT, API_KEY, MERCHANT_ACCOUNT, ENVIRONMENT } = require('./config');
const { AccountInfo } = require('@adyen/api-library/lib/src/typings/checkout/accountInfo');
const { Agent } = require('http');
const { version } = require('os');

// This is the server-side configuration.  It pulls the information supplied in the .env file to create an instance of the checkout API
const config = new Config();
// Set your X-API-KEY with the API key from the Customer Area.
config.apiKey = API_KEY;
config.merchantAccount = MERCHANT_ACCOUNT;
const client = new Client({ config });
client.setEnvironment(ENVIRONMENT);
const checkout = new CheckoutAPI(client);

// URLs for API calls 
const checkoutUrl = 'https://checkout-test.adyen.com';

const app = express();
app.use(express.json());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// in latest body-parser use like below.
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static(__dirname + '/public'));

////////////
// Routes //
////////////

app.get('/', (req, res) => {
  res.render('checkout.ejs', { currentPage: 'checkout' });
});

app.get('/checkout', (req, res) => {
  res.render('checkout.ejs', { currentPage: 'checkout' });
});

app.get('/sessions', (req, res) => {
  res.render('sessions.ejs', { currentPage: 'sessions' });
});

app.get('/customcard', (req, res) => {
  res.render('customcard.ejs', { currentPage: 'customcard' });
});

app.get('/authentication', (req, res) => {
  res.render('authonly.ejs', { currentPage: 'authonly' });
});

app.get('/3DS', (req, res) => {
  res.render('3DS.ejs', { currentPage: '3DS' });
});

app.get('/ipp', (req, res) => {
  res.render('ipp.ejs', { currentPage: 'ipp' });
});

app.get('/platforms', (req, res) => {
  res.render('platforms.ejs', { currentPage: 'platforms' })
});

app.get('/notifications', (req, res) => {
  res.render('notifications.ejs', { currentPage: 'notifications' });
});

app.get('/hpp', (req, res) => {
  res.render('hpp.ejs', { currentPage: 'hpp' });
});

/////////////////
// MIDDLEWARE //
///////////////


/////////////////
// POST CALLS // 
///////////////

// Initiates a payment session 
app.post('/sessions', (req, res) => {
  const { countryCode, shopperLocale, amount, shopperReference, threeDS, merchantReference, allow3DS2, lineItems,
    shopperInteraction, recurringProcessingModel } = req.body;
  const additionalData = createAdditionalData(threeDS, allow3DS2);

  const payload = {
    merchantAccount: MERCHANT_ACCOUNT,
    countryCode,
    shopperLocale,
    amount,
    shopperReference,
    additionalData,
    recurringProcessingModel,
    storePaymentMethod: recurringProcessingModel ? true : false,
    shopperInteraction,
    lineItems,
    reference: merchantReference ? merchantReference : createReferenceNumber('sessions'),
    returnUrl: req.headers.referer
  };

  checkout.sessions(payload)
    .then(sessionsResponse => {
      const response = {};
      response['data'] = sessionsResponse;
      response['request'] = payload;
      res.json(response);
    })
    .catch(err => {
      res.status(err.statusCode);
      res.json({ message: err.message });
    })
});

// Get payment methods to initialize dropin or components 
app.post('/getPaymentMethods', (req, res) => {
  const { countryCode, shopperLocale, amount, shopperReference, threeDS } = req.body;

  const payload = {
    merchantAccount: MERCHANT_ACCOUNT,
    countryCode,
    shopperLocale,
    shopperReference,
    amount,
    channel: "Web"
  }

  checkout.paymentMethods(payload)
    .then(paymentMethodsResponse => {
      const response = {};
      response['data'] = paymentMethodsResponse;
      response['request'] = payload;
      res.json(response);
    })
    .catch((err) => {
      res.status(err.statusCode);
      res.json({ message: err.message });
    });
});

// Makes the payment with the paymentMethod object passed from the front end 
app.post('/makePayment', (req, res) => {
  const { paymentMethod, allow3DS2, threeDS, browserInfo, recurringProcessingModel, shopperInteraction,
    shopperReference, amount, lineItems, shopperEmail, billingAddress, deliveryAddress,
    shopperName, countryCode, shopperStatement, merchantReference, authOnly } = req.body;

  const additionalData = createAdditionalData(threeDS, allow3DS2);

  // Get checkout version from headers and build url 
  const checkoutVersion = req.headers.checkout;
  const url = `${checkoutUrl}/v${checkoutVersion}/payments`;

  if(paymentMethod.type === 'paywithgoogle'){
    paymentMethod['type'] = 'googlepay'
  }

  const payload = {
    merchantAccount: MERCHANT_ACCOUNT,
    amount,
    reference: merchantReference ? merchantReference : createReferenceNumber(`${authOnly === true ? "authentication" : "checkout"}-v${checkoutVersion}`),
    paymentMethod,
    billingAddress,
    deliveryAddress,
    countryCode,
    shopperEmail,
    shopperName,
    lineItems,
    browserInfo,
    additionalData,
    recurringProcessingModel,
    storePaymentMethod: recurringProcessingModel ? true : false,
    shopperInteraction,
    shopperReference,
    channel: 'Web',
    shopperStatement,
    returnUrl: req.headers.referer,
    origin: req.headers.referer,
    threeDSAuthenticationOnly: authOnly === true ? true : false
    }
  

  postRequest(url, payload)
    // Successful payment 
    .then(paymentResponse => {
      const response = {};
      response['data'] = paymentResponse;
      response['request'] = payload;
      res.json(response);
    })
    // Payment error
    .catch((err) => {
      const response = {};
      console.log(err);
      response['request'] = payload;
      response['message'] = err.message;
      res.status(err.statusCode);
      res.json(response);
    });
});

app.post('/additionalDetails', async (req, res) => {
  const {details, authOnly} = req.body;
  // Stringify request body to pass to /payments/details
  const payload = {
    details
  }

  const checkoutVersion = req.headers.checkout;
  const url = `${checkoutUrl}/v${checkoutVersion}/payments/details`;

  postRequest(url, payload)
    .then(detailsResponse => {
      const response = {};
      response['data'] = detailsResponse;
      response['request'] = payload;
      res.json(response);
    })
    .catch(e => {
      const response = {};
      console.log(e);
      response['request'] = payload;
      response['message'] = e.message;
      res.status(e.statusCode);
      res.json(response);
    })
});

// Disables a payment method 
app.post('/disablePaymentMethod', (req, res) => {
  const { recurringDetailReference, shopperReference } = req.body;
  const url = 'https://pal-test.adyen.com/pal/servlet/Recurring/v68/disable';
  const payload = {
    shopperReference,
    recurringDetailReference,
    merchantAccount: MERCHANT_ACCOUNT
  };

  postRequest(url, payload)
    .then(response => {
      res.json({ response });
    })
    .catch(e => {
      res.status(e['status'].toString()).json(e.data);
    })
});

// Post back for 3DS authentication
app.post('/authentication', (req,res)=> {
  const { MD, PaRes } = req.body;

  const url = `${checkoutUrl}/v67/payments/details`;

  const payload = {
    details:{
      MD,
      PaRes
    },
    threeDSAuthenticationOnly:true
  }
  postRequest(url, payload)
    .then(detailsResponse => {
      const response = {};
      response['data'] = detailsResponse;
      response['request'] = payload;
      res.redirect(302, `/authentication?${JSON.stringify(detailsResponse)}`);
    })
    .catch(e => {
      const response = {};
      console.log(e);
      response['request'] = payload;
      response['message'] = e.message;
      res.redirect(302, '/authentication');
    })
});


////////////////////
// Modifications //
//////////////////

app.post('/capture', async (req, res) => {
  const { pspReference, value, currency } = req.body;
  const url = `${checkoutUrl}/payments/${pspReference}/captures`
  const payload = {
    merchantAccount: MERCHANT_ACCOUNT,
    reference: createReferenceNumber('checkout-capture'),
    amount: {
      value,
      currency
    }
  };

  const captureResponse = await postRequest(url, payload);
  res.json(captureResponse);
});

app.get('*', (req, res) => {
  res.render('404', { currentPage: "" });
});

//////////
// API //
////////

app.post('/api/notifications', (req, res) => {

});


// Start server
app.listen(PORT, () => {
  console.log(`Your app is listening on port ${PORT}.`);
});



//////////////////////////
// Additional Functions //
//////////////////////////

const createAdditionalData = (threeDS, allow3DS2 = false) => {
  const additionalData = {};
  threeDS ? additionalData['executeThreeD'] = true : additionalData['executeThreeD'] = false;
  additionalData['allow3DS2'] = allow3DS2;

  return additionalData;
};

const createReferenceNumber = (prefix) => {
  const date = Date.now();
  return `${prefix}-${date}`;
}

const postRequest = async (url, payload) => {
  const config = {
    headers: { 'X-API-Key': API_KEY }
  };

  const res = await axios.post(url, payload, config);
  return res.data;
}
