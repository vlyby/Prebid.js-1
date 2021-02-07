import {registerBidder} from '../src/adapters/bidderFactory.js';
import { BANNER } from '../src/mediaTypes.js';

const utils = require('../src/utils.js');
const BIDDER_CODE = 'vlyby';
const ENDPOINT_URL = 'https://vlyby.com/prebid';
const gdprStatus = {
  GDPR_DOESNT_APPLY: 0,
  GDPR_APPLIES_PUBLISHER: 1,
  GDPR_APPLIES_GLOBAL: 2,
  CMP_NOT_FOUND_OR_ERROR: 3
}

export const spec = {
  code: BIDDER_CODE,
  supportedMediaTypes: ['video', 'banner'],

  /**
   * Determines whether or not the given bid request is valid.
   *
   * @param {BidRequest} bid The bid params to validate.
   * @return boolean True if this is a valid bid, and false otherwise.
   */
  isBidRequestValid: function(bid) {
    let isValid = false;
    if (typeof bid.params !== 'undefined') {
      let isValidPlacementId = !!utils.getValue(bid.params, 'pubId');
      let isValidPageId = !!utils.getValue(bid.params, 'placementId');
      isValid = isValidPlacementId && isValidPageId;
    }

    if (!isValid) {
      utils.logError('Vlyby placementId and pubId parameters are required. Bid aborted.');
    }
    return isValid;
  },

  /**
   * Make a server request from the list of BidRequests.
   *
   * @param {validBidRequests[]} an array of bids
   * @return ServerRequest Info describing the request to the server.
   */
  buildRequests: function(validBidRequests, bidderRequest) {
    const bids = validBidRequests.map(buildRequestObject);
    const payload = {
      referrer: getReferrerInfo(bidderRequest),
      pageReferrer: document.referrer,
      host: document.location.host,
      networkBandwidth: getConnectionDownLink(window.navigator),
      data: bids,
      deviceWidth: screen.width,
      hb_version: '$prebid.version$'
    };

    if (validBidRequests[0].schain) {
      payload.schain = validBidRequests[0].schain;
    }

    let gdpr = bidderRequest.gdprConsent;
    if (bidderRequest && gdpr) {
      let isCmp = (typeof gdpr.gdprApplies === 'boolean')
      let isConsentString = (typeof gdpr.consentString === 'string')
      let status = isCmp
        ? findGdprStatus(gdpr.gdprApplies, gdpr.vendorData, gdpr.apiVersion)
        : gdprStatus.CMP_NOT_FOUND_OR_ERROR
      payload.gdpr_iab = {
        consent: isConsentString ? gdpr.consentString : '',
        status: status,
        apiVersion: gdpr.apiVersion
      };
    }

    const payloadString = JSON.stringify(payload);
    return {
      method: 'POST',
      url: ENDPOINT_URL,
      data: payloadString,
    };
  },

  /**
   * Unpack the response from the server into a list of bids.
   *
   * @param {*} serverResponse A successful response from the server.
   * @return {Bid[]} An array of bids which were nested inside the server.
   */
  interpretResponse: function(serverResponse, bidderRequest) {
    const bidResponses = [];
    serverResponse = serverResponse.body;

    if (serverResponse) {
      serverResponse.forEach(function (bid) {
        const bidResponse = {
          requestId: bid.bidId,
          placementId: bid.placementId,
          pubId: bid.pubId,
          cpm: bid.cpm,
          mediaType: BANNER,
          width: bid.width,
          height: bid.height,
          currency: bid.currency,
          netRevenue: true,
          ttl: bid.ttl,
          ad: bid.ad,
          creativeId: bid.creativeId,
          dealId: bid.dealId
        };

        bidResponses.push(bidResponse);
      });
    }
    return bidResponses;
  },
};

function getReferrerInfo(bidderRequest) {
  let ref = '';
  if (bidderRequest && bidderRequest.refererInfo && bidderRequest.refererInfo.referer) {
    ref = bidderRequest.refererInfo.referer;
  }
  return ref;
}

function getConnectionDownLink(nav) {
  return nav && nav.connection && nav.connection.downlink >= 0 ? nav.connection.downlink.toString() : '';
}

function findGdprStatus(gdprApplies, gdprData, apiVersion) {
  let status = gdprStatus.GDPR_APPLIES_PUBLISHER
  if (gdprApplies) {
    if (isGlobalConsent(gdprData, apiVersion)) status = gdprStatus.GDPR_APPLIES_GLOBAL
  } else {
    status = gdprStatus.GDPR_DOESNT_APPLY
  }
  return status;
}

function isGlobalConsent(gdprData, apiVersion) {
  return gdprData && apiVersion === 1
    ? (gdprData.hasGlobalScope || gdprData.hasGlobalConsent)
    : gdprData && apiVersion === 2
      ? !gdprData.isServiceSpecific
      : false
}

function buildRequestObject(bid) {
  const reqObj = {};

  reqObj.sizes = getSizes(bid);
  reqObj.bidId = utils.getBidIdParameter('bidId', bid);
  reqObj.bidderRequestId = utils.getBidIdParameter('bidderRequestId', bid);
  reqObj.pubId = utils.getValue(bid.params, 'pubId');
  reqObj.placementId = utils.getValue(bid.params, 'placementId');
  reqObj.adUnitCode = utils.getBidIdParameter('adUnitCode', bid);
  reqObj.auctionId = utils.getBidIdParameter('auctionId', bid);
  reqObj.transactionId = utils.getBidIdParameter('transactionId', bid);
  return reqObj;
}

function getSizes(bid) {
  return utils.parseSizesInput(concatSizes(bid));
}

function concatSizes(bid) {
  let playerSize = utils.deepAccess(bid, 'mediaTypes.video.playerSize');
  let videoSizes = utils.deepAccess(bid, 'mediaTypes.video.sizes');
  let bannerSizes = utils.deepAccess(bid, 'mediaTypes.banner.sizes');

  if (utils.isArray(bannerSizes) || utils.isArray(playerSize) || utils.isArray(videoSizes)) {
    let mediaTypesSizes = [bannerSizes, videoSizes, playerSize];
    return mediaTypesSizes
      .reduce(function(acc, currSize) {
        if (utils.isArray(currSize)) {
          if (utils.isArray(currSize[0])) {
            currSize.forEach(function (childSize) { acc.push(childSize) })
          } else {
            acc.push(currSize);
          }
        }
        return acc;
      }, [])
  } else {
    return bid.sizes;
  }
}

registerBidder(spec);
