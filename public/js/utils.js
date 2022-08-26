// Global vars declaration
let type;
let component;
let checkout;
let merchantAccount;
let version;
const page = window.location.pathname.split("/")[1];

// Default config 
const config = {
    clientKey: 'test_L6YKOUH44RBEXBNLLCE6AIUZIYG46KOC',
    countryCode: "NL",
    shopperLocale: "en_US",
    amount: { currency: "EUR", value: 1000 }
};


////////////////////
// CHECKOUT APIS //
//////////////////


// Get payment methods
const getPaymentMethods = async () => {
    const enteredCountryCode = getCountryCode();
    const shopperReference = getShopperReference();
    const amount = getAmount();

    const paymentMethodsResponse = await postRequest('/getPaymentMethods', {
        countryCode: (enteredCountryCode !== "") ? enteredCountryCode : config.countryCode,
        shopperLocale: config.shopperLocale,
        amount,
        shopperReference: shopperReference
    });

    const response = paymentMethodsResponse.data;
    const request = paymentMethodsResponse.request;

    updateMethodsRequest(request);
    updateMethodsResponse(response);

    return response;

};



/////////////////////////////////
// GET input values from DOM  //
///////////////////////////////

// Get API Version 
const getApiVersion = () => {
    if(version){
        return version;
    } else {
        version = 69;
        return version;
    }
}

const updateApiVersion = (newVersion) => {
    console.log(`Version: ${version}. new version: ${newVersion}`)
    if(version !== newVersion) {
        saveToLS('version',newVersion);
        version = newVersion;
    }

    dropdownOptions = document.getElementById('version').children;
    for(let i of dropdownOptions){
        if (i.id===newVersion){
            i.checked = true
        }
    }
}

const getShopperReference = () => {
    return document.getElementById('shopperReference').value;
};

const getMerchantReference = () => {
    return document.getElementById('reference').value;
};

const getCountryCode = () => {
    return document.getElementById('countryCode').value || "NL";
};

const getShopperLocale = () => {
    return document.getElementById('shopperLocale').value || config.shopperLocale;
};

const getThreeDS = () => {
    return document.getElementById('3DS').checked;
};

const getAllow3DS2 = () => {
    return document.getElementById('allow3DS2').checked;
};

const getCurrency = () => {
    return document.getElementById('currency').value;
}

const getPspReference = () => {
    return document.getElementById('pspReference').value;
}

const getTokenizationSetting = () => {
    return getRadioValue('recurringProcessingModel');
}

const getShopperInteraction = () => {
    return getRadioValue('shopperInteraction');
}

const getAmount = () => {
    const amount = {};
    const amountInput = parseInt(document.getElementById('amount').value);
    const currencyInput = getCurrency();

    (amountInput !== "") ? amount['value'] = amountInput : amount['value'] = config.amount.value;
    (currencyInput !== "") ? amount['currency'] = currencyInput : amount['currency'] = config.amount.currency;
    return amount;
}

const getModificationAmount = () => {
    return document.getElementById('modification-amount').value;
};

const getModificationCurrency = () => {
    return document.getElementById('modification-currency').value || 'EUR';
};

const updatePayloadWithSelectedOptions = (data = {}) => {
    data['threeDS'] = getThreeDS();
    data['allow3DS2'] = getAllow3DS2();
    data['recurringProcessingModel'] = getTokenizationSetting();
    data['shopperInteraction'] = getShopperInteraction();
    data['shopperReference'] = getShopperReference();
    data['amount'] = getAmount();
    data['countryCode'] = getCountryCode();
    data['merchantReference'] = getMerchantReference();
    return data;
};

///////////////////////////
// UPDATE DOM FUNCTIONS //
/////////////////////////

const updateStatus = resultCode => {
    const paymentStatus = document.getElementById('payment-status');
    const container = document.getElementById('result-container');
    let oldPaymentStatus;

    try{
        oldPaymentStatus = paymentStatus.value;
    } catch(e){
        console.log(e);
    }
    try{
        paymentStatus.value = resultCode;
    } catch(e){
        console.log(e);
    }

    try {
        container.classList.remove(oldPaymentStatus.toLowerCase());
    } catch (e) {
        console.log(e);
    }
    try {
        container.classList.add(resultCode.toLowerCase());
    } catch (e) {
        console.log(e);
    }
}

const updatePspReference = pspReference => {
    try {
        document.getElementById('pspReference').value = pspReference;
    } catch (e) {
        console.log(e);
    }
}

const updatePaymentResponse = response => {
    // Update API response on UI 
    const paymentResponse = document.getElementById('payment-response');
    paymentResponse.innerText = formatJSON(response);
}

const updatePaymentRequest = (request) => {
    json = formatJSON(request);
    document.getElementById('payment-request').innerText = json;
}

const updateSessionsRequest = (request) => {
    json = formatJSON(request);
    document.getElementById('sessions-request').innerText = json;
}

const updateSessionsResponse = (response) => {
    json = formatJSON(response);
    document.getElementById('sessions-response').innerText = json;
}

const showPaymentResponse = () => {
    const myCollapse = document.getElementById('collapseResponse');
    const paymentResponseField = new bootstrap.Collapse(myCollapse, {
        toggle: false
    });
    paymentResponseField.show();
}

const updateDetailsRequest = (request) => {
    try {
        document.getElementById('details-request').innerText = formatJSON(request);
    } catch (e) {
        console.log(e);
    }
}

const updateDetailsResponse = (response) => {
    try {
        document.getElementById('details-response').innerText = formatJSON(response);
    } catch (e) {
        console.log(e);
    }
}

const showAdditionalDetails = () => {
    try {
        document.getElementById('accordionDetailsRequest').classList.remove('display-none');
    } catch (e) {
        console.log(e);
    }
}

const hideAdditionalDetails = () => {
    try {
        document.getElementById('accordionDetailsRequest').classList.add('display-none');
    } catch (e) {
        console.log(e);
    }
}

const updateMethodsRequest = (request) => {
    try{
        const paymentMethodsRequest = document.getElementById('methods-request');
        paymentMethodsRequest.innerText = formatJSON(request);
    } catch(e) {
        console.log(e);
    }

}

const updateMethodsResponse = (response) => {
    try {
        const paymentMethodsResponse = document.getElementById('methods-response');
        paymentMethodsResponse.innerText = formatJSON(response);
    } catch(e) {
        console.log(e);
    }
}

// Clears the request and response from the DOM and local storage for additional details
const clearAdditionalDetails = () => {
    document.getElementById('details-request').innerText = "";
    document.getElementById('details-response').innerText = "";
    localStorage.removeItem('checkout-details-request');
    localStorage.removeItem('checkout-details-response');
}

// Updates the request time in the response section 
// Accepts a value for restoring a time or none for setting a new time 
const updateRequestTime = (date = "false") => {
    const el = document.getElementById('requestTime');

    if (date === "false") {
        date = getCurrentTime();
    }

    try {
        el.innerText = date;
    } catch (e) {
        console.log(e);
    }

    return date;
}

const showToast = (header, message, type) => {
    const template = `<div id="liveToast" class="toast toast-${type}" role="alert" aria-live="assertive" aria-atomic="true"  data-bs-delay="3000">
        <div class="toast-header">
            <strong class="me-auto">${header}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    </div>`
    document.getElementById('toast-container').innerHTML = template;

    $(`#liveToast`).toast('show')
};

const clearQueryParams = () => {
    // clears the redirect result from the url to avoid sending again on refresh
    const newURL = window.location.href.split("?")[0].split("/")[3];
    window.history.pushState({}, document.title, "/" + newURL);
}

///////////////////
// PAYMENT DATA //
/////////////////

const generateLineItems = () => {
    const amount = getAmount();

    const taxAmount = 300;

    const lineItems = [
        {
            quantity: "1",
            amountExcludingTax: amount.value - taxAmount,
            taxPercentage: Math.round((taxAmount / (amount.value - taxAmount)) * 10000, 4) + "",
            description: "Jacket",
            id: "Item #1",
            taxAmount: taxAmount,
            amountIncludingTax: amount.value,
            productUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=872&q=80",
            imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=872&q=80"
        }
    ]
    return lineItems;
}

const generateAddress = () => {
    const address =
    {
        city: "New York",
        country: "US",
        houseNumberOrName: "71",
        postalCode: "10003",
        street: "5th Avenue",
        stateOrProvince: "New York"
    }
    return address;
}

const generateShopperName = () => {
    const name =
    {
        firstName: "Test",
        gender: "UNKNOWN",
        lastName: "Person"
    }
    return name;
}

const getTranslations = () => {
    return {

    }
}

//////////////////////
// OTHER FUNCTIONS //
////////////////////

// saves an item to local storage 
const saveToLS = (param, value) => {
    localStorage.setItem(param, value);
}

const getFromLS = (param) => {
    return localStorage.getItem(param);
}

// Makes a post reqest to the server
const postRequest = async (url, payload) => {
    const response = await fetch(url, {
        url,
        method: 'POST',
        headers: {
            'Content-type': 'application/json',
            'Checkout': getApiVersion()
        },
        body: JSON.stringify(payload),
        json: true
    });

    const result = await response.json();
    if (response.ok) {
        return result ? result : true;
    } else {
        showToast("Error", result.message, "error");
        if (url === '/makePayment') {
            updatePaymentRequest(result.request);
            saveToLS('checkout-request', formatJSON(result.request));
        }
        throw Error(result.message);
    }
};

const parseQueryParameter = (qParameterKey) => {
    let query = window.location.search.substring(1);
    

    if(qParameterKey === 'response' || qParameterKey === 'request'){
        let vars = query.split('&&&');
        console.log(vars);
        for (let i = 0; i < vars.length; i++) {
            let pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == qParameterKey) {
                const newArr = pair.slice(1);
                const result = newArr.join("");
                return decodeURIComponent(result);
            }
        }
    } else {
        let vars = query.split('&');
        for (let i = 0; i < vars.length; i++) {
            let pair = vars[i].split('=');
            if (decodeURIComponent(pair[0]) == qParameterKey) {
                return decodeURIComponent(pair[1])
            }
        }
        console.warn('Query variable %s not found', qParameterKey);
    }
};

const getCurrentTime = () => {
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var d = new Date();
    var day = days[d.getDay()];
    var hr = d.getHours();
    var min = d.getMinutes();
    if (min < 10) {
        min = "0" + min;
    }
    var ampm = "am";
    if (hr > 12) {
        hr -= 12;
        ampm = "pm";
    }
    var date = d.getDate();
    var month = months[d.getMonth()];
    var year = d.getFullYear();
    var x = document.getElementById("time");
    return month + " " + date + ", " + year + " " + hr + ":" + min + " " + ampm;
}

const filterArray = (array, property, value) => {
    const result = array.filter(row => row[property] === value);
    return result;
}

const getRadioValue = name => {
    const radios = document.getElementsByName(name);
    for (let radio of radios) {
        if (radio.checked) return radio.value;
    }
}

const formatJSON = json => {
    return JSON.stringify(json, null, 4);
};

// Updates the type of integration (e.g. dropin, card, etc.)
const updateType = (newType, reset = true) => {
    // Update global var 
    type = newType;

    // Save to local storage
    saveToLS('type', newType);

    // Get tabs and make the new type active 
    const tabs = document.getElementsByClassName('nav-link type');
    for (let tab of tabs) {
        if (tab.name == newType) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    }

    // If reset = true, call resetPage(). Defaults to true. Remounts the component.
    reset ? resetPage() : false;
}

/////////////////////
// EVENT LISTENERS //
////////////////////

window.addEventListener('load', async e => {
    if (page === 'authentication' || page === 'checkout' || page === 'customcard') {

        updateApiVersion(getFromLS('version'));
        
        // Active version dropdown
        $('#versionDropdown').dropdown()

        // Version dropdown event listener 
        document.getElementById('version').addEventListener('click', (event) => {
            for (let i of event.target.attributes) {
                if (i.nodeName === "for") {
                    console.log(`updating version to ${i.value}`)
                    updateApiVersion(i.value);
                }
            }
        });
    }

    // Submits the payment options and gets payment methods again
    try{
        document.getElementById("options").addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                component.unmount();
            } catch (e) {
                console.log(e);
            }
            resetPage();
        });
    } catch(e){
        console.log(e);
    }
    
    try {
        document.getElementById("3DS").addEventListener('click', (event) => {
            const allow3DS2 = document.getElementById("allow3DS2");
            if (event.target.checked === true) {
                allow3DS2.disabled = false;
            } else {
                allow3DS2.checked = false;
                allow3DS2.disabled = true;
            }
        });
    } catch (e) {
        console.log(e);
    }
    // Copies the psp reference to the clipboard
    try {
        document.getElementById("copyPsp").addEventListener('click', (event) => {
            const text = getPspReference();
            navigator.clipboard.writeText(text).then(function () {
                showToast("PSP Reference", "Copied to clipboard", "info")
            }, function (err) {
                console.error('Async: Could not copy text: ', err);
            });
        });
    } catch (e) {
        console.log(e)
    }

    try {
        document.getElementById('new-merchant-account').addEventListener('click', (event) => {
            console.log("Add new merchant account");
        }); 
    } catch(e){
        console.log(e);
    }

    const merchantDropdown = document.getElementById('merchant-dropdown');

    // Loads the merchant account 
    const merchantAccounts = JSON.parse(getFromLS('merchantAccounts')) || [];
    merchantAccount = getFromLS('selectedMerchantAccount');
    if (merchantAccounts.length > 0 ){
        const dropdown = document.getElementById('merchant-dropdown');

        for (let i of merchantAccounts){
            const newLI = document.createElement('LI');
            const newLink = document.createElement('a');
            newLink.classList.add('dropdown-item');
            newLink.id=`merchant-${i}`;
            newLink.innerText=i;
            newLink.classList.add('active');
            const newMenuItem = newLI.appendChild(newLink);

            dropdown.insertBefore(newMenuItem, dropdown.firstChild);
        }

        document.getElementById('navbarDropdown').innerText = merchantAccount;
        
    } else {
        // showAddMerchantModal();
    }
    document.getElementById('navbarDropdown').style= 'opacity:100%';

    try{
        $('.dropdown-el').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).toggleClass('expanded');
            $('#'+$(e.target).attr('for')).prop('checked',true);
          });
          $(document).click(function() {
            $('.dropdown-el').removeClass('expanded');
          });
    } catch(e){
        console.log(e);
    }
})