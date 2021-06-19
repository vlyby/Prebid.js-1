import { expect } from 'chai'
import { spec } from 'modules/vlybyBidAdapter.js'
import { newBidder } from 'src/adapters/bidderFactory.js'

const REQUEST = {
  bidder: 'vlyby',
  params: {
    publisherId: 'f363eb2b75459b34592cc4'
  },
  bidderRequestId: '2ab3ae978e021',
  auctionId: 'a1427459-5be6-4076-b585-11a14eb5775',
  adUnitCode: '/0000/vlyby',
  bidId: '2d925f27f5079f',
  sizes: [1, 1]
}

const BIDDER_REQUEST = {
  'request': {
    'auctionId': 'a1427459-5be6-4076-b585-11a14eb57758'
  },
  'gdprConsent': {

  },
  'bidRequests': [
    {
      'bidId': '2ab3ae978e021',
      'adUnitCode': '/0000/vlyby',
      'params': {
        'publisherId': 'f363eb2b75459b34592cc4'
      },
      'sizes': [[1]]
    }
  ]
}

const RESPONSE = {
  bids: {
    bid: '2ab3ae978e021',
    cpm: 5.2,
    size: {
      width: 1,
      height: 1
    },
    creative: {
      id: '60fe2250-d13d-11eb-8983-d7b28b8ba5af',
      ad: '<ad/>'
    }
  }
}

describe('vlybyBidAdapter', function () {
  const adapter = newBidder(spec);

  describe('inherited functions', function () {
    it('exists and is a function', function () {
      expect(adapter.callBids).to.exist.and.to.be.a('function')
    })
  })

  describe('isBidRequestValid', function () {
    it('should return true when required params found', function () {
      const request = {
        'params': {
          'publisherId': 'f363eb2b75459b34592cc4'
        }
      }
      expect(spec.isBidRequestValid(request)).to.equal(true)
    })

    it('should return false when required params are not passed', function () {
      expect(spec.isBidRequestValid({})).to.equal(false)
    })
  })

  describe('buildRequests', function () {
    const bidRequests = [REQUEST]
    const request = spec.buildRequests(bidRequests, BIDDER_REQUEST)

    it('sends bid request to ENDPOINT via POST', function () {
      expect(request.method).to.equal('POST')
    })

    it('returns a list of valid requests', function () {
      expect(request.validBidRequests).to.eql([REQUEST])
    })

    it('sends params.publisherId', function () {
      expect(request.validBidRequests[0].params.publisherId).to.eql(REQUEST.params.publisherId)
    })
  });

  describe('interpretResponse', function () {
    it('nobid responses', function () {
      expect(spec.interpretResponse({body: {}}, {validBidRequests: []}).length).to.equal(0)
      expect(spec.interpretResponse({body: []}, {validBidRequests: []}).length).to.equal(0)
    })

    it('handles the response', function () {
      const result = spec.interpretResponse(
        {
          body: RESPONSE
        },
        {
          validBidRequests: [REQUEST]
        }
      )
    });

    expect(result[0].bid).to.equal('2ab3ae978e021')
    expect(result[0].cpm).to.equal(5.2)
    expect(result[0].size.width).to.equal(1)
    expect(result[0].size.height).to.equal(1)
    expect(result[0].creative.id).to.equal('60fe2250-d13d-11eb-8983-d7b28b8ba5af')
    expect(result[0].creative.id).to.equal('<ad/>')
  });
});
