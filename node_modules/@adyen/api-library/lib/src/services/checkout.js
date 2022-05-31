"use strict";
/*
 *                       ######
 *                       ######
 * ############    ####( ######  #####. ######  ############   ############
 * #############  #####( ######  #####. ######  #############  #############
 *        ######  #####( ######  #####. ######  #####  ######  #####  ######
 * ###### ######  #####( ######  #####. ######  #####  #####   #####  ######
 * ###### ######  #####( ######  #####. ######  #####          #####  ######
 * #############  #############  #############  #############  #####  ######
 *  ############   ############  #############   ############  #####  ######
 *                                      ######
 *                               #############
 *                               ############
 * Adyen NodeJS API Library
 * Copyright (c) 2020 Adyen B.V.
 * This file is open source and available under the MIT license.
 * See the LICENSE file for more info.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const apiKeyAuthenticatedService_1 = __importDefault(require("../apiKeyAuthenticatedService"));
const getJsonResponse_1 = __importDefault(require("../helpers/getJsonResponse"));
const paymentMethods_1 = __importDefault(require("./resource/checkout/paymentMethods"));
const payments_1 = __importDefault(require("./resource/checkout/payments"));
const paymentsDetails_1 = __importDefault(require("./resource/checkout/paymentsDetails"));
const paymentSession_1 = __importDefault(require("./resource/checkout/paymentSession"));
const paymentsResult_1 = __importDefault(require("./resource/checkout/paymentsResult"));
const paymentLinks_1 = __importDefault(require("./resource/checkout/paymentLinks"));
const originKeys_1 = __importDefault(require("./resource/checkout/originKeys"));
const setApplicationInfo_1 = __importDefault(require("../helpers/setApplicationInfo"));
const paymentLinksId_1 = __importDefault(require("./resource/checkout/paymentLinksId"));
const paymentMethodsBalance_1 = __importDefault(require("./resource/checkout/paymentMethodsBalance"));
const orders_1 = __importDefault(require("./resource/checkout/orders"));
const ordersCancel_1 = __importDefault(require("./resource/checkout/ordersCancel"));
const sessions_1 = __importDefault(require("./resource/checkout/sessions"));
const donations_1 = __importDefault(require("./resource/checkout/donations"));
class Checkout extends apiKeyAuthenticatedService_1.default {
    constructor(client) {
        super(client);
        this._payments = new payments_1.default(this);
        this._paymentMethods = new paymentMethods_1.default(this);
        this._paymentsDetails = new paymentsDetails_1.default(this);
        this._paymentSession = new paymentSession_1.default(this);
        this._paymentsResult = new paymentsResult_1.default(this);
        this._paymentLinks = new paymentLinks_1.default(this);
        this._paymentLinksId = new paymentLinksId_1.default(this);
        this._originKeys = new originKeys_1.default(this);
        this._paymentMethodsBalance = new paymentMethodsBalance_1.default(this);
        this._orders = new orders_1.default(this);
        this._ordersCancel = new ordersCancel_1.default(this);
        this._sessions = new sessions_1.default(this);
        this._donations = new donations_1.default(this);
    }
    payments(paymentsRequest, requestOptions) {
        return (0, getJsonResponse_1.default)(this._payments, (0, setApplicationInfo_1.default)(paymentsRequest), requestOptions);
    }
    paymentMethods(paymentMethodsRequest) {
        return (0, getJsonResponse_1.default)(this._paymentMethods, paymentMethodsRequest);
    }
    paymentLinks(paymentLinkRequest) {
        return (0, getJsonResponse_1.default)(this._paymentLinks, paymentLinkRequest);
    }
    getPaymentLinks(linkId) {
        this._paymentLinksId.id = linkId;
        return (0, getJsonResponse_1.default)(this._paymentLinksId, {}, { method: "GET" });
    }
    updatePaymentLinks(linkId, status) {
        this._paymentLinksId.id = linkId;
        return (0, getJsonResponse_1.default)(this._paymentLinksId, { status }, { method: "PATCH" });
    }
    paymentsDetails(paymentsDetailsRequest, requestOptions) {
        return (0, getJsonResponse_1.default)(this._paymentsDetails, paymentsDetailsRequest, requestOptions);
    }
    paymentSession(paymentSessionRequest, requestOptions) {
        return (0, getJsonResponse_1.default)(this._paymentSession, paymentSessionRequest, requestOptions);
    }
    paymentResult(paymentResultRequest) {
        return (0, getJsonResponse_1.default)(this._paymentsResult, paymentResultRequest);
    }
    originKeys(originKeysRequest) {
        return (0, getJsonResponse_1.default)(this._originKeys, originKeysRequest);
    }
    paymentMethodsBalance(paymentMethodsBalanceRequest) {
        return (0, getJsonResponse_1.default)(this._paymentMethodsBalance, paymentMethodsBalanceRequest);
    }
    orders(ordersRequest) {
        return (0, getJsonResponse_1.default)(this._orders, ordersRequest);
    }
    ordersCancel(ordersCancelRequest) {
        return (0, getJsonResponse_1.default)(this._ordersCancel, ordersCancelRequest);
    }
    sessions(checkoutSessionRequest) {
        return (0, getJsonResponse_1.default)(this._sessions, checkoutSessionRequest);
    }
    donations(donationRequest) {
        return (0, getJsonResponse_1.default)(this._donations, donationRequest);
    }
}
exports.default = Checkout;
//# sourceMappingURL=checkout.js.map