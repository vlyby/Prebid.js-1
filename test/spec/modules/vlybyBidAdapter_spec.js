import { expect } from 'chai'
import { spec } from 'modules/vlybyBidAdapter.js'
import { newBidder } from 'src/adapters/bidderFactory.js'

const ENDPOINT_URL = 'https://vlyby.com/prebid';

const REQUEST = {
  bidder: 'vlyby',
  params: {
    pubId: '123',
    placementId: 'Default'
  },
  bidderRequestId: '22edbae2733bf6',
  auctionId: '1d1a030790a475',
  adUnitCode: 'adunit-code',
  bidId: '30b31c1838de1e',
  sizes: [300, 250]
}

const BIDDER_REQUEST = {
  auctionId: '1d1a030790a475',
  gdprConsent: {
    gdprApplies: true,
    consentString: 'D45maJ4NO5asbJE-RWRENAdFwfagerAYgDpSI'
  }
}

const RESPONSE = [
  {
    bidId: '255d1337d9',
    cpm: 5,
    width: 300,
    height: 250,
    creativeId: 'c-342343',
    dealId: 'd-45543',
    currency: 'EUR',
    pubId: '123',
    placementId: 'default',
    netRevenue: true,
    ttl: 300,
    ad: '<script />'
  }
];

describe('vlybyBidAdapter', function () {
  const adapter = newBidder(spec);

  describe('inherited functions', function () {
    it('exists and is a function', function () {
      expect(adapter.callBids).to.exist.and.to.be.a('function');
    })
  });

  describe('isBidRequestValid', function () {
    it('should return true when required params found', function () {
      const request = {
        'params': {
          'placementId': 'Default',
          'pubId': '123'
        }
      }
      expect(spec.isBidRequestValid(request)).to.equal(true)
    });

    it('should return false when required params are not passed', function () {
      expect(spec.isBidRequestValid({})).to.equal(false)
    });
  });

  describe('buildRequests', function () {
    const bidRequests = [REQUEST];
    let request = spec.buildRequests(bidRequests, BIDDER_REQUEST);
    const payload = JSON.parse(request.data);

    it('sends bid request to ENDPOINT via POST', function () {
      expect(request.url).to.equal(ENDPOINT_URL);
      expect(request.method).to.equal('POST');
    });

    it('sends pubId', function () {
      expect(payload.data[0].pubId).to.eql(REQUEST.params.pubId);
    });

    it('sends placementId', function () {
      expect(payload.data[0].placementId).to.eql(REQUEST.params.placementId);
    });
  });

  describe('interpretResponse', function () {
    it('handles nobid responses', function () {
      let bids = {
        'body': []
      };

      let result = spec.interpretResponse(bids);
      expect(result.length).to.equal(0);
    });

    it('handles the server response', function () {
      const result = spec.interpretResponse(
        {
          body: RESPONSE
        },
        {
          validBidRequests: [REQUEST]
        }
      );

      expect(result[0].requestId).to.equal('255d1337d9');
      expect(result[0].cpm).to.equal(5);
      expect(result[0].width).to.equal(300);
      expect(result[0].height).to.equal(250);
      expect(result[0].creativeId).to.equal('c-342343');
      expect(result[0].dealId).to.equal('d-45543');
      expect(result[0].currency).to.equal('EUR');
      expect(result[0].netRevenue).to.equal(true);
      expect(result[0].ttl).to.equal(300);
      expect(result[0].ad).to.equal('<script />');
    });
  });
});
