function roundGap() {
  return 20;
}
function createTeamElement(round, name, score) {
  var tEl = $('<div class="team"><b>'+name+'</b><span>'+score[0]+'</span></div>');

  if (score) {
    if (score[0] > score[1])
      tEl.addClass('win')
    else if (score[0] < score[1])
      tEl.addClass('lose')
    else
      tEl.addClass('tie')
  }

  if (round == 0)
    return tEl;

  /*
  var elCon = $('<div class="connectorTo"></div>').appendTo(tEl);
  elCon.css('width', roundGap()+'px');
  elCon.css('left', -roundGap()+'px');
  elCon.css('top', '-10px');
  */

  return tEl;
}

function connector(width, height, shift, teamContainer) {
  var drop = true;
  // drop:
  //  �\
  //    \_
  // !drop:
  //    /�
  //  _/
  if (height < 0) {
    drop = false;
    height = -height;
  }
  var elCon = $('<div class="connectorFrom"></div>').appendTo(teamContainer);
  elCon.css('height', height);
  elCon.css('width', width+'px');
  elCon.css('right', (-width-2)+'px');

  if (shift >= 0)
    elCon.css('top', shift+'px');
  else
    elCon.css('bottom', (-shift)+'px');
  
  if (drop)
    elCon.css('border-bottom', 'none');
  else
    elCon.css('border-top', 'none');

  elCon.css('border-color', 'red');

  var elTo = $('<div class="connectorTo"></div>').appendTo(elCon);
  elTo.css('width', width+'px');
  elTo.css('right', -width+'px');
  if (drop)
    elTo.css('bottom', '0px');
  else
    elTo.css('top', '0px');
}

/* refactor with loser bracket */
function getTeamNames(results, round, match)
{
  var getTeamName = function(results, round, match, n) {
      var score = results[0][round-1][match*2+n];
      var mod = ':first';

      if (score[0] < score[1])
        mod = ':last';

      return $('#match-'+(round-1)+'-'+(match*2+n)+' .team'+mod+' b').text();
    }

  return [getTeamName(results, round, match, 0), getTeamName(results, round, match, 1)];
}

function render(data)
{
  renderWinners('#bracket', data);
  renderLosers($('#loserBracket'), $('#bracket'), data);
}

function renderWinners(container, data)
{
  var teams = data['teams'];
  var results = data['results'];
  var rounds = Math.log(teams.length*2) / Math.log(2);
  var matches = teams.length;
  var graphHeight = $(container).height();

  for (var r = 0; r < rounds; r++) {
    var roundId = 'round-'+r;
    $('<div class="round" id="'+roundId+'"></div>').appendTo(container);

    for (var m = 0; m < matches; m++) {
      var matchId = "match-"+r+"-"+m;
      elClassMatch = $('<div class="match" id="'+matchId+'"></div>').appendTo('#'+roundId);
      var score = results[0][r][m];
      var elClassTeamContainer = '<div class="teamContainer">'+
                       '</div>';

      var team;
      if (r == 0)
        team = teams[m];
      else
        team = getTeamNames(results, r, m);
    
      elClassTeamContainer = $(elClassTeamContainer).append(createTeamElement(r, team[0], score));
      elClassTeamContainer = $(elClassTeamContainer).append(createTeamElement(r, team[1], [score[1],score[0]]));

      elClassMatch.css('height', (graphHeight/matches)+'px');
      elClassTeamContainer = $(elClassTeamContainer).appendTo(elClassMatch);
      elClassTeamContainer.css('top', (elClassMatch.height()/2-elClassTeamContainer.height()/2)+'px');

      if (r < (rounds-1)) {
        var width = roundGap();
        var height, shift

        var connectorOffset = elClassTeamContainer.height()/4
        var matchupOffset = elClassMatch.height()/2

        if (m%2 == 0) { // dir == down
          if (score[0] > score[1]) {
            height = matchupOffset
            shift = connectorOffset
          }
          else {
            height = matchupOffset - connectorOffset*2
            shift = connectorOffset*3
          }
        }
        else { // dir == up
          if (score[0] > score[1]) {
            height = -matchupOffset + connectorOffset*2
            shift = -connectorOffset*3
          }
          else {
            height = -matchupOffset
            shift = -connectorOffset
          }
        }

        elClassTeamContainer.append(connector(width, height, shift, elClassTeamContainer));
      }
    }
    matches /= 2;
  }
}

/* refactor with loser bracket */
function getWinnerTeamNames(container, results, round, match, n)
{
  var getTeamName = function(results, round, match, n) {
      var score = results[1][round][match];
      var mod = ':first';

      if (score[0] < score[1])
        mod = ':last';

      return container.find('#match-'+(round)+'-'+(match)+'-1 .team'+mod+' b').text();
    }

  return [getTeamName(results, round-1, match*2, n), 
          getTeamName(results, round-1, match*2+1, n)];
}

function renderLosers(container, winnerBracket, data)
{
  var teams = data['teams'];
  var results = data['results'];
  var rounds = Math.log(teams.length*2) / Math.log(2)-1;
  var matches = teams.length/2;
  var graphHeight = container.height();

  for (var r = 0; r < rounds; r++) {
    for (var n = 0; n < 2; n++) {
      var roundId = 'lround-'+r+'-'+n;
      var elClassRound = $('<div class="round" id="'+roundId+'"></div>').appendTo(container);

      for (var m = 0; m < matches; m++) {
        var score = results[1][r*2+n][m];
        var elClassMatch = $('<div class="match"></div>').appendTo(elClassRound);
        elClassMatch.attr('id', 'match-'+r+'-'+m+'-'+n)

        var elClassTeamContainer = '<div class="teamContainer"></div>';
        var team;
        /* match inside losers bracket */
        if (n%2 == 0) {
          /* first round comes from winner bracket */
          if (r == 0) {
            var getLoser = function(results, r, m) {
              var team;
              if (results[0][r][m][0] < results[0][r][m][1])
                team = teams[m][0];
              else
                team = teams[m][1];
              return team;
            };
            team = [getLoser(results, 0, m*2), getLoser(results, 0, m*2+1)];
          }
          else {
            var getLoser = function(results, r, m) {
              var team;
              if (results[1][r][m][0] > results[1][r][m][1])
                team = teams[m][0];
              else
                team = teams[m][1];
              return team;
            };
            team = getWinnerTeamNames(container, results, r, m, n);
          }
        }
        else { /* match with dropped */
          var getWinner = function(results, r, m) {
            var getTeamName = function(results, round, match) {
              var score = results[1][round*2][match];
              var mod = ':first';

              if (score[0] < score[1])
                mod = ':last';

              return container.find('#match-'+(round)+'-'+(match)+'-0 .team'+mod+' b').text();
            }

            return getTeamName(results, r, m);
          };
          var getLoser = function(results, r, m) {
            var score = results[0][r][m];
            var mod = ':first';

            if (score[0] > score[1])
              mod = ':last';

            return winnerBracket.find('#match-'+(r)+'-'+(m)+' .team'+mod+' b').text();
          };
          team = [getWinner(results, r, m), getLoser(results, r+1, m)];
        }
      
        elClassTeamContainer = $(elClassTeamContainer).append(createTeamElement(r*2+n, team[0], score));
        /* no toConnector every second time as this comes from winners */
        if (n%2 == 1)
          elClassTeamContainer = $(elClassTeamContainer).append(createTeamElement(0, team[1], [score[1],score[0]]));
        else
          elClassTeamContainer = $(elClassTeamContainer).append(createTeamElement(r*2+n, team[1], [score[1],score[0]]));

        elClassMatch.css('height', (graphHeight/matches)+'px');
        elClassTeamContainer = $(elClassTeamContainer).appendTo(elClassMatch);
        elClassTeamContainer.css('top', (elClassMatch.height()/2-elClassTeamContainer.height()/2)+'px');

        var connectorOffset = elClassTeamContainer.height()/4
        var matchupOffset = elClassMatch.height()/2

        if (r < rounds-1 || n < 1) {
          var height = 0;
          var width = roundGap();
          var shift = 0;

          // inside lower bracket 
          if (n%2 == 0) {
            if (score[0] > score[1])
              height = 0;
            else
              height = -connectorOffset*2;

            shift = connectorOffset
          }
          else { // from winner bracket 
            if (m%2 == 0) { // dir == down 
              if (score[0] > score[1]) {
                shift = connectorOffset
                height = matchupOffset
              }
              else {
                shift = connectorOffset*3
                height = matchupOffset - connectorOffset*2
              }
            }
            else { // dir == up
              if (score[0] > score[1]) {
                shift = -connectorOffset*3
                height = -matchupOffset + connectorOffset*2
              }
              else {
                shift = -connectorOffset
                height = -matchupOffset
              }
            }
          }
          elClassTeamContainer.append(connector(width, height, shift, elClassTeamContainer));
        }
      }
    }
    matches /= 2;
  }
}
