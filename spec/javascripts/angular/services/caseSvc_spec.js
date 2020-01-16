'use strict';

describe('Service: caseSvc', function () {

  // load the service's module
  beforeEach(module('QuepidTest'));

  var mockCases = {
    allCases: [
      {
        'caseNo':   1,
        'case_name': 'test case',
        'lastTry':  4,
        'owned':    true
      },
      {
        'caseNo':   2,
        'case_name': 'test case 2',
        'lastTry':  3,
        'owned':    true
      },
      {
        'caseNo':   3,
        'case_name': 'test case 3',
        'lastTry':  0,
        'owned':    false
      },
      {
        'caseNo':   4,
        'case_name': 'test case 4',
        'lastTry':  0,
        'owned':    false
      }
    ]
  };

  var $httpBackend = null;

  var mockCaseTryNavSvc = {
    notFoundCalled: 0,
    notFound: function() {
      this.notFoundCalled++;
    },
    navigateTo: function() {
    }
  };

  var expectToRefetchCases = function() {
    var returnedCases = {
      allCases: []
    };
    $httpBackend.expectGET('/api/cases').respond(200, returnedCases);
    $httpBackend.expectGET('/api/dropdown/cases').respond(200, returnedCases);
  };

  // instantiate service
  var caseSvc;
  beforeEach(function() {
    module(function($provide) {
      $provide.value('caseTryNavSvc', mockCaseTryNavSvc);
    });
    inject(function (_caseSvc_, $injector) {
      caseSvc = _caseSvc_;
      $httpBackend = $injector.get('$httpBackend');
    });
  });

  it('tests get cases', function () {
    $httpBackend.expectGET('/api/cases').respond(200, mockCases);
    $httpBackend.expectGET('/api/dropdown/cases').respond(200, mockCases);

    caseSvc.uponBeingBootstrapped().
      then(function() {
        expect(caseSvc.allCases.length).toBe(4);
      });

    $httpBackend.flush();
  });


  describe('tests after bootstrap', function() {
    beforeEach(function() {
      $httpBackend.expectGET('/api/cases').respond(200, mockCases);
      $httpBackend.expectGET('/api/dropdown/cases').respond(200, mockCases);

      caseSvc.uponBeingBootstrapped().
        then(function() {
          expect(caseSvc.allCases.length).toBe(4);
        });

      $httpBackend.flush();
    });

    var mockNewTry = {
      lastTry: 1,
      caseNo: 5,
      case_name: 'new case'
    };

    it('filters cases', function() {
      var ownedCase = caseSvc.filterCases(caseSvc.allCases, true);
      expect(ownedCase.length).toBe(2);
      expect(ownedCase[0].caseName).toBe('test case');

      var sharedCase = caseSvc.filterCases(caseSvc.allCases, false);
      expect(sharedCase.length).toBe(2);
      expect(sharedCase[0].caseName).toBe('test case 3');
    });

    it('selects a shared case', function() {
      caseSvc.selectCase(3);
      var selectedCase = caseSvc.getSelectedCase();
      expect(selectedCase.caseName).toBe('test case 3');

      caseSvc.selectCase(4);
      var selectedCase = caseSvc.getSelectedCase();
      expect(selectedCase.caseName).toBe('test case 4');
    });

    it('creates cases with expected name', function() {
      $httpBackend.expectPOST('/api/cases').respond(201, mockNewTry);
      caseSvc.createCase();
      $httpBackend.flush();
      caseSvc.selectCase(mockNewTry.caseNo);
      var newCase = caseSvc.getSelectedCase();
      expect(newCase.caseName).toBe(mockNewTry.case_name);
    });

    it('renames case with expected name', function() {
      $httpBackend.expectPOST('/api/cases').respond(201, mockNewTry);
      caseSvc.createCase();
      $httpBackend.flush();
      caseSvc.selectCase(mockNewTry.caseNo);
      var newCase = caseSvc.getSelectedCase();
      expect(newCase.caseName).toBe(mockNewTry.case_name);

      var newName = 'blah';
      $httpBackend.expectPUT('/api/cases/' + newCase.caseNo).respond(201, {});
      newCase.rename(newName);
      $httpBackend.flush();
      var sameCase = caseSvc.getSelectedCase();
      expect(sameCase.caseName).toBe(newName);
      expect(newCase.caseName).toBe(newName);

      caseSvc.selectCase(newCase.caseNo);
      var sameCaseSelected = caseSvc.getSelectedCase();
      expect(sameCaseSelected.caseName).toBe(newName);

    });

    it('creates cases with specified name', function() {
      var name = 'El Case-o-dilla';
      $httpBackend.expectPOST('/api/cases', function(content) {
        var addCaseParsed = angular.fromJson(content);
        return addCaseParsed.case_name === name;
      }
      ).respond(201, mockNewTry);
      caseSvc.createCase(name);
      $httpBackend.flush();
      caseSvc.selectCase(mockNewTry.caseNo);
      var newCase = caseSvc.getSelectedCase();
      expect(newCase.caseName).toBe(mockNewTry.case_name);

    });

    it('creates cases with passed in queries', function() {
      var queries = {'queries': {'5': {'query_text': 'foo'}}, 'displayOrder': ['5']};
      $httpBackend.expectPOST('/api/cases', function(content) {
        var addCaseParsed = angular.fromJson(content);
        return addCaseParsed.queries.queries['5']['query_text'] === 'foo';
      }
      ).respond(201, mockNewTry);
      caseSvc.createCase(undefined, queries);
      $httpBackend.flush();
      caseSvc.selectCase(mockNewTry.caseNo);
      var newCase = caseSvc.getSelectedCase();
      expect(newCase.caseName).toBe(mockNewTry.case_name);
    });

    it('creates cases with passed in tries', function() {
      var tries = [{searchUrl: 'foo'}];
      $httpBackend.expectPOST('/api/cases', function(content) {
        var addCaseParsed = angular.fromJson(content);
        return addCaseParsed.tries[0].searchUrl === 'foo';
      }
      ).respond(201, mockNewTry);
      caseSvc.createCase(undefined, undefined, tries);
      $httpBackend.flush();
      caseSvc.selectCase(mockNewTry.caseNo);
      var newCase = caseSvc.getSelectedCase();
      expect(newCase.caseName).toBe(mockNewTry.case_name);
    });

    it('gets a case by number', function() {
      var caseNoOne = caseSvc.getCaseByNo(1);
      expect(caseNoOne.caseName).toEqual('test case');
    });

    it('gets null if case number not present', function() {
      var caseNoZero = caseSvc.getCaseByNo(0);
      expect(caseNoZero).toEqual(null);
      var caseNoOneK = caseSvc.getCaseByNo(1000);
      expect(caseNoOneK).toEqual(null);
    });

    it('deletes a case', function() {
      $httpBackend.expectDELETE('/api/cases/1').respond(200, '');
      expectToRefetchCases();

      caseSvc.deleteCase(caseSvc.getCaseByNo(1));

      $httpBackend.flush();

      var caseFound = false;
      angular.forEach(caseSvc.allCases, function(aCase) {
        if(aCase.caseNo === 1){
          caseFound = true;
        }
      });

      expect(caseFound).toEqual(false);
    });

    it('deletes and calls promise', function(){
      $httpBackend.expectDELETE('/api/cases/1').respond(200, '');
      expectToRefetchCases();
      var called = false;
      caseSvc.deleteCase(caseSvc.getCaseByNo(1)).then( function() {
        called = true;
      });
      $httpBackend.flush();
      expect(called).toEqual(true);
    });

    it('deletes currently selected case, calls promise', function(){
      caseSvc.selectCase(1);
      expect(caseSvc.getSelectedCase().caseNo).toEqual(1);
      $httpBackend.expectDELETE('/api/cases/1').respond(200, '');
      expectToRefetchCases();
      caseSvc.deleteCase(caseSvc.getCaseByNo(1));
      $httpBackend.flush();
      expect(caseSvc.getSelectedCase()).toEqual(null);
    });

    it('deletes currently selected case, calls promise', function(){
      caseSvc.selectCase(2);
      expect(caseSvc.getSelectedCase().caseNo).toEqual(2);
      $httpBackend.expectDELETE('/api/cases/1').respond(200, '');
      expectToRefetchCases();
      caseSvc.deleteCase(caseSvc.getCaseByNo(1));
      $httpBackend.flush();
      expect(caseSvc.getSelectedCase().caseNo).toEqual(2);
    });

    var archivedCasesAPIResponse = {
      allCases: [
        {
          'caseNo':   6,
          'case_name': 'archived',
          'last_try_number':  4
        }
      ]
    };

    it('add back archived case', function() {
      $httpBackend.expectGET('/api/cases?archived=true').respond(200, archivedCasesAPIResponse);
      var called = 0;
      caseSvc.fetchArchived()
      .then(function() {
        called++;
        expect(caseSvc.archived.length).toBe(1);
        expect(caseSvc.archived[0].caseNo).toBe(6);
        expect(caseSvc.archived[0].caseName).toBe('archived');
        expect(caseSvc.archived[0].lastTry).toBe(4);
      });

      $httpBackend.flush();
      expect(called).toBe(1);

      var archivedCaseNo = caseSvc.archived[0].caseNo;
      $httpBackend.expectPUT('/api/cases/' + archivedCaseNo).respond(200, archivedCasesAPIResponse.allCases[0]);

      var casesBefore = caseSvc.allCases.length;
      caseSvc.undeleteCase(caseSvc.archived[0]).then(function() {
        called++;
        expect(caseSvc.archived.length).toBe(0);
        expect(caseSvc.allCases.length).toBe(casesBefore + 1);
        caseSvc.selectCase(archivedCaseNo);
        expect(caseSvc.getSelectedCase().caseNo).toEqual(archivedCaseNo);
        expect(caseSvc.getSelectedCase().caseName).toEqual('archived');
      });
      $httpBackend.flush();
      expect(called).toBe(2);
    });

    it('refetch archive', function() {
      $httpBackend.expectGET('/api/cases?archived=true').respond(200, archivedCasesAPIResponse);
      var called = 0;
      caseSvc.fetchArchived()
      .then(function() {
        called++;
        expect(caseSvc.archived.length).toBe(1);
        expect(caseSvc.archived[0].caseNo).toBe(6);
        expect(caseSvc.archived[0].caseName).toBe('archived');
        expect(caseSvc.archived[0].lastTry).toBe(4);
      });

      $httpBackend.flush();
      expect(called).toBe(1);

      $httpBackend.expectGET('/api/cases?archived=true').respond(200, archivedCasesAPIResponse);
      caseSvc.fetchArchived()
      .then(function() {
        called++;
        expect(caseSvc.archived.length).toBe(1);
        expect(caseSvc.archived[0].caseNo).toBe(6);
        expect(caseSvc.archived[0].caseName).toBe('archived');
        expect(caseSvc.archived[0].lastTry).toBe(4);
      });

      $httpBackend.flush();
      expect(called).toBe(2);
    });

    it('larger archive', function() {
      var archiveAPIResponse = angular.copy(archivedCasesAPIResponse);
      var baseNo = archiveAPIResponse.allCases[0].caseNo;
      var baseName = archiveAPIResponse.allCases[0].case_name;
      var numArchived = 10;
      for (var i = 0; i < numArchived - 1; i++) {
        var newCase = {
          'caseNo':   baseNo + (i + 1),
          'case_name': baseName + (i + 1),
          'lastTry':  i
        };
        archiveAPIResponse.allCases.push(newCase);
      }

      $httpBackend.expectGET('/api/cases?archived=true').respond(200, archiveAPIResponse);
      var called = 0;
      caseSvc.fetchArchived()
      .then(function() {
        called++;
        expect(caseSvc.archived.length).toBe(numArchived);
      });
      $httpBackend.flush();
      expect(called).toBe(1);

      // unarchive every odd case
      var undeleted = [];
      angular.forEach(caseSvc.archived, function(aCase) {
        if (aCase.caseNo % 2 === 1) {
          undeleted.push(aCase.caseNo);
          $httpBackend.expectPUT('/api/cases/' + aCase.caseNo).respond(200, archiveAPIResponse.allCases[aCase.caseNo - baseNo]);
          caseSvc.undeleteCase(aCase)
          .then(function() {
            called++;
          });
        }
      });
      $httpBackend.flush();
      expect(called).toBe(undeleted.length + 1);

      // should be no odd cases in archive
      angular.forEach(caseSvc.archived, function(aCase) {
        expect(aCase.caseNo % 2).not.toBe(1);
      });

      // all cases should be readded
      angular.forEach(caseSvc.allCases, function(aCase) {
        if (aCase.caseNo > baseNo) {
          expect(aCase.caseNo % 2).toBe(1);
          expect(undeleted).toContain(aCase.caseNo);
        }
      });
    });

    it('set the last viewed at date', function() {
      $httpBackend.expectPUT('/api/cases/1/metadata').respond(200, '');
      caseSvc.trackLastViewedAt(1);
      $httpBackend.flush();
    });

    it('returns cases sorted by last viewed at', function() {
      $httpBackend.expectPUT('/api/cases/2/metadata').respond(200, '');
      caseSvc.trackLastViewedAt(2);
      $httpBackend.expectPUT('/api/cases/1/metadata').respond(200, '');
      caseSvc.trackLastViewedAt(1);
      $httpBackend.flush();

      var dropdownCases = {
        allCases: [
          {
            'caseNo':   2,
            'case_name': 'test case 2',
            'lastTry':  3
          },
          {
            'caseNo':   1,
            'case_name': 'test case',
            'lastTry':  4,
          }
        ]
      };

      $httpBackend.expectGET('/api/dropdown/cases').respond(200, dropdownCases);

      caseSvc.fetchDropdownCases()
      .then(function() {
        expect(caseSvc.sorted.length).toBe(2);
        expect(caseSvc.sorted[0].caseNo).toBe(2);
        expect(caseSvc.sorted[1].caseNo).toBe(1);
      });
    });

  });

  describe('Track last score', function() {
    var $rootScope, $filter;

    var cases = [
      {
        'caseNo': 1,
        'case_name': 'test case 1',
        'lastTry': 3,
        'owned': true
      },
      {
        'caseNo': 2,
        'case_name': 'test case 2',
        'lastTry': 4,
        'owned': true
      }
    ];

    var scoreData = {
      score:      90,
      all_rated:  false,
      case_id:    1,
      try_id:     3,
      queries:    {
        174: {
          score:  0,
          text:   'canine'
        }
      }
    };

    beforeEach(inject(function(_$rootScope_, _$filter_) {
      $rootScope  = _$rootScope_;
      $filter     = _$filter_;

      caseSvc.allCases    = cases;
    }));

    it('tracks the last score successfully', function() {
      $httpBackend.expectPUT('/api/cases/1/scores').respond(200, '');

      caseSvc.trackLastScore(scoreData);
      $httpBackend.flush();
    });

    it('ignores empty scores', function() {
      var data = angular.copy(scoreData)
      data.score   = 0;
      data.queries = {};

      caseSvc.trackLastScore(data);

      $httpBackend.verifyNoOutstandingExpectation();
    });

    it('does not ignore 0 scores if query object has data', function() {
      var data = angular.copy(scoreData)
      data.score   = 0;

      $httpBackend.expectPUT('/api/cases/1/scores').respond(200, '');

      caseSvc.trackLastScore(data);

      $httpBackend.flush();
      $httpBackend.verifyNoOutstandingExpectation();
    });

    it('updates the last score of the case in the case list', function() {
      var mockResponse = scoreData;
      var dateFormat = 'yyyy-MM-dd HH:mm:ss Z';
      var created_at = $filter('date')(new Date().toUTCString(), dateFormat);
      mockResponse.created_at = created_at;

      $httpBackend.expectPUT('/api/cases/1/scores').respond(200, mockResponse);

      caseSvc.trackLastScore(scoreData);
      $httpBackend.flush();
      $rootScope.$apply();

      var c = caseSvc.allCases[0];
      expect(c.lastScore).toBeDefined();
      expect(c.lastScore.score).toEqual(scoreData.score);
      expect(c.lastScore.created_at).toEqual(created_at);
    });

    it('tracks the scores for queries', function() {
      scoreData['queries'] = {
        '1': 50,
        '2': 0,
        '3': null
      };
      var expectedQueries = {
        '1': 50,
        '2': 0,
        '3': ''
      };
      var mockResponse = scoreData;
      var dateFormat = 'yyyy-MM-dd HH:mm:ss Z';
      var created_at = $filter('date')(new Date().toUTCString(), dateFormat);
      mockResponse.created_at = created_at;

      $httpBackend.expectPUT('/api/cases/1/scores').respond(200, mockResponse);

      caseSvc.trackLastScore(scoreData);
      $httpBackend.flush();
      $rootScope.$apply();

      var c = caseSvc.allCases[0];
      expect(c.lastScore).toBeDefined();
      expect(c.lastScore.score).toEqual(scoreData.score);
      expect(c.lastScore.created_at).toEqual(created_at);
      expect(c.lastScore.queries).toEqual(expectedQueries);
    });
  });

  describe('Fetch last score', function() {
    var caseData = {
      'caseNo':   1,
      'case_name': 'test case 1',
      'lastTry':  3,
      'owned':    true
    };

    var scoreData = {
      'score':      90,
      'all_rated':  false,
      'case_id':    1,
      'try_id':     3
    };

    it('tracks the last score successfully', function() {
      var theCase = caseSvc.constructFromData(caseData);

      $httpBackend.expectGET('/api/cases/1/scores').respond(200, scoreData);

      theCase.fetchCaseScore()
        .then(function(response) { theCase = response; });
      $httpBackend.flush();

      expect(theCase.lastScore).toEqual(scoreData);
    });
  });

  describe('Fetch shared cases', function() {
    it('gets the shared cases and assigns the list to the internal array', function() {
      var url = '/api/cases';
      $httpBackend.expectGET(url).respond(200, mockCases);
      $httpBackend.expectGET('/api/dropdown/cases').respond(200, mockCases);

      caseSvc.uponBeingBootstrapped().
        then(function() {
          var sharedCase = caseSvc.filterCases(caseSvc.allCases, false);
          expect(sharedCase.length).toBe(2);
        });

      $httpBackend.flush();
    });
  });

  describe('clone', function() {
    var $rootScope;

    var cases = [
      {
        'caseNo': 1,
        'case_name': 'test case 1',
        'lastTry': 3,
        'owned': true
      },
      {
        'caseNo': 2,
        'case_name': 'test case 2',
        'lastTry': 4,
        'owned': true
      }
    ];

    var theCase = cases[0];

    var expectedResponse = {
      'caseNo':   3,
      'case_name': 'Clone: test case 1',
      'lastTry':  0,
      'owned':    true
    };

    beforeEach(inject(function(_$rootScope_) {
      $rootScope  = _$rootScope_;

      caseSvc.allCases = cases;
    }));

    it('clones a case successfully', function() {
      var url = '/api/clone/cases';
      $httpBackend.expectPOST(url).respond(200, expectedResponse);

      caseSvc.cloneCase(theCase);
      $httpBackend.flush();
      $rootScope.$apply();

      expect(caseSvc.allCases.length).toBe(3);
    });
  });
});
