const ccicon = document.getElementById('ccicon');

// Triggered when the payment is completed
const paymentComplete = (response) => {

    if (!response.action) {
        document.getElementById('custom-card-body').classList.add('hidden');
        document.getElementById('success').classList.remove('hidden');
    }

    const { pspReference, resultCode } = response;

    // Update response time on UI 
    const date = updateRequestTime();
    saveToLS('cc-requestTime', date);

    // Update response on UI 
    updatePaymentResponse(response);
    saveToLS('cc-response', formatJSON(response));

    // Update pspReference on UI 
    updatePspReference(pspReference);
    saveToLS("cc-pspReference", pspReference);

    // Update status on UI 

    if (resultCode === undefined) {
        updateStatus('Error');
        saveToLS('cc-resultCode', 'Error');
    } else {
        updateStatus(resultCode);
        saveToLS('cc-resultCode', resultCode);
    }

    // Opens the payment response accordion
    showPaymentResponse();

}

const makePayment = (data) => {
    // Add amount to payment request 
    data['amount'] = getAmount();
    data['threeDS'] = getThreeDS();
    data['allow3DS2'] = getAllow3DS2();

    postRequest('/makePayment', data)
        .then(response => {
            updatePaymentRequest(response.request);
            saveToLS('cc-request', formatJSON(response.request));

            if (response.data.action) {
                paymentComplete(response.data);
                component.unmount();
                document.getElementById('custom-card-fields').classList.add('hidden');
                component = checkout.createFromAction(response.data.action).mount('#customCard-container');
            }
            else {
                paymentComplete(response.data);
            }
        })
        .catch(err => {
            console.log(err.message + "");
        });
}

// Makes a request to additional details 
const postAdditionalDetails = async (payload) => {
    // Updates the additional details response on the DOM and saves to local storage
    updateDetailsRequest(payload);
    saveToLS('checkout-details-request', formatJSON(payload));

    // Show additional details request/response accordions
    showAdditionalDetails();

    // Makes API call to /payments/details
    const paymentDetailsResponse = await postRequest('/additionalDetails', payload);

    // Save response to local storage and render on the DOM 
    saveToLS('checkout-details-response', formatJSON(paymentDetailsResponse));
    updateDetailsResponse(paymentDetailsResponse);

    return paymentDetailsResponse;
}

async function handleOnChange(state, _passedComponent) {
    console.log("state.errors", state.errors);
    if (state.isValid === true) {
        const payButton = document.getElementById('pay-button');
        payButton.addEventListener('click', function () {
            makePayment(state.data);
        });
        payButton.disabled = false;
    } else if (state.isValid === false) {
        const payButton = document.getElementById('pay-button');
        payButton.disabled = true;
        payButton.removeEventListener('click', function () {
            makePayment(state.data);
        });
    }
}

async function handleOnAdditionalDetails(state, _passedComponent) {
    console.log("Additional Details being handled");
    const paymentsDetailsResponse = await postAdditionalDetails(state.data);
    paymentComplete(paymentsDetailsResponse);
    // Open API response accordion 
    const myCollapse = document.getElementById('collapseDetailsResponse');
    const detailsResponseField = new bootstrap.Collapse(myCollapse, {
        toggle: false
    });
    detailsResponseField.show();
}

const createCheckoutConfig = () => {
    return {
        locale: getShopperLocale(),
        environment: "test",
        clientKey: config.clientKey,
        onChange: handleOnChange,
        onAdditionalDetails: handleOnAdditionalDetails
    }
};

const switchBrand = (brand) => {
    switch (brand) {
        case 'amex':
            ccicon.innerHTML = amex;
            ccsingle.innerHTML = amex_single;
            swapColor('green');
            break;
        case 'visa':
            ccicon.innerHTML = visa;
            ccsingle.innerHTML = visa_single;
            swapColor('lime');
            break;
        case 'diners':
            ccicon.innerHTML = diners;
            ccsingle.innerHTML = diners_single;
            swapColor('orange');
            break;
        case 'discover':
            ccicon.innerHTML = discover;
            ccsingle.innerHTML = discover_single;
            swapColor('purple');
            break;
        case ('jcb' || 'jcb15'):
            ccicon.innerHTML = jcb;
            ccsingle.innerHTML = jcb_single;
            swapColor('red');
            break;
        case 'maestro':
            ccicon.innerHTML = maestro;
            ccsingle.innerHTML = maestro_single;
            swapColor('yellow');
            break;
        case 'mc':
            ccicon.innerHTML = mastercard;
            ccsingle.innerHTML = mastercard_single;
            swapColor('lightblue');

            break;
        case 'unionpay':
            ccicon.innerHTML = unionpay;
            ccsingle.innerHTML = unionpay_single;
            swapColor('cyan');
            break;
        default:
            ccicon.innerHTML = '';
            ccsingle.innerHTML = '';
            swapColor('grey');
            console.log(`Brand not found ${brand}`)
            break;
    }
};

const updateBin = (bin = false) => {
    const length = bin.length;
    const number = document.getElementById('svgnumber');
    let newHTML;

    if (bin.length == 0 || bin === false) {
        newHTML = "1234 5678 9012 3456"
    } else if (bin === 'no-encrypted-value') {
        return;
    } else {
        const regex = /\d{4}/g;
        let numX = 16 - length;

        for (let i = 0; i < numX; i++) {
            bin = bin + "X";
        }
        newHTML = bin.match(/.{1,4}/g).join(' ');
    }
    number.innerHTML = newHTML;
}

const createCardConfig = (brands) => {
    return {
        type: 'card',
        brands,
        styles: {
            base: {
                color: 'black',
                fontSize: '16px',
                fontSmoothing: 'antialiased',
                fontFamily: 'Helvetica',
                padding: '0 0 0 10px',
                margin: '0'
            },
            error: {
                color: 'red'
            },
            placeholder: {
                color: '#d8d8d8'
            }
        },
        // Events
        onLoad: function () { },
        onConfigSuccess: function () { },
        onValid: function (field) {console.log(field) },
        onBrand: function (brand) { switchBrand(brand.brand) },
        onError: function () { },
        onFocus: function (arg) { },
        onBinValue: function (bin) { updateBin(bin.binValue) },
        onBinLookup: function () { },
        onFieldValid: function (field) {
            console.log(field);
        }
    }
}

const reverse = (string) => {
    let newstring = "";
    for (let i = 1; i <= string.length; i++) {
        newstring += string[string.length - i];
    }
    return newstring;
}

const getItemsFromLS = () => {

    // Get PSP Reference and render 
    const pspReference = getFromLS('cc-pspReference');
    updatePspReference(pspReference);

    // Get result code and render 
    const resultCode = getFromLS('cc-resultCode');
    updateStatus(resultCode);

    // Get checkout request and render
    try {
        const paymentRequest = JSON.parse(getFromLS('cc-request'));
        updatePaymentRequest(paymentRequest);
    } catch (e) {
        console.log(e);
    }

    // Get checkout response and render
    try {
        const paymentResponse = JSON.parse(getFromLS('cc-response'));
        updatePaymentResponse(paymentResponse);
    } catch (e) {
        console.log(e);
    }

    // Get request time and render 
    let requestTime = getFromLS('cc-requestTime');
    if (!requestTime) requestTime = "";
    updateRequestTime(requestTime);

    // Get additional details call and render 
    const detailsRequest = JSON.parse(getFromLS('cc-details-request'));
    updateDetailsRequest(detailsRequest);

    const detailsResponse = JSON.parse(getFromLS('cc-details-response'));
    updateDetailsResponse(detailsResponse);

    if (detailsRequest && detailsResponse) showAdditionalDetails();

};

const handleRedirect = () => {
    // Redirect logic goes here 
};

const resetPage = async () => {
    const paymentMethods = await getPaymentMethods();
    const brands = filterArray(paymentMethods.paymentMethods, 'name', 'Credit Card')[0].brands;

    checkout = await AdyenCheckout(createCheckoutConfig());

    component = checkout.create('securedfields', createCardConfig(brands)).mount('#customCard-container');
    try {
        document.getElementById('custom-card-fields').classList.remove('hidden');
    } catch (e) {
        console.log(e);
    }
    document.getElementById('custom-card-body').classList.remove('hidden');
    document.getElementById('success').classList.add('hidden');
    updateBin("");
    switchBrand("");

};

// Page load
window.addEventListener('load', async e => {
    // Retrieves fields from Local Storage and sets them on the DOM (status, pspRef, etc.)
    getItemsFromLS();

    // true if redirect result is present
    const isRedirect = /redirectResult/.test(document.location.search);

    // If redirect, handle the redirect (submits the redirect result)
    isRedirect ? await handleRedirect() : false;

    resetPage();
});


//define the color swap function
const swapColor = function (basecolor) {
    document.querySelectorAll('.lightcolor')
        .forEach(function (input) {
            input.setAttribute('class', '');
            input.setAttribute('class', 'lightcolor ' + basecolor);
        });
    document.querySelectorAll('.darkcolor')
        .forEach(function (input) {
            input.setAttribute('class', '');
            input.setAttribute('class', 'darkcolor ' + basecolor + 'dark');
        });
};

window.onload = function () {

    const name = document.getElementById('name');
    const output = document.getElementById('output');
    const ccsingle = document.getElementById('ccsingle');
    const generatecard = document.getElementById('generatecard');

    let cctype = null;

    // CREDIT CARD IMAGE JS
    document.querySelector('.preload').classList.remove('preload');


    //On Input Change Events
    name.addEventListener('input', function () {
        if (name.value.length == 0) {
            document.getElementById('svgname').innerHTML = 'John Doe';
            document.getElementById('svgnameback').innerHTML = 'John Doe';
        } else {
            document.getElementById('svgname').innerHTML = this.value;
            document.getElementById('svgnameback').innerHTML = this.value;
        }
    });

    //On Focus Events
    name.addEventListener('focus', function () {
        document.querySelector('.creditcard').classList.remove('flipped');
    });
};