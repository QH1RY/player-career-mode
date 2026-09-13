(() => {
  const PREMIER_LEAGUE_CLUBS=[
    {name:'AFC Bournemouth',level:76,league:'Premier League',style:'High energy',wage:42000},
    {name:'Arsenal',level:88,league:'Premier League',style:'Possession',wage:95000},
    {name:'Aston Villa',level:83,league:'Premier League',style:'Fast build-up',wage:72000},
    {name:'Brentford',level:78,league:'Premier League',style:'Direct',wage:52000},
    {name:'Brighton & Hove Albion',level:80,league:'Premier League',style:'Possession',wage:60000},
    {name:'Chelsea',level:86,league:'Premier League',style:'High press',wage:90000},
    {name:'Coventry City',level:74,league:'Premier League',style:'Counter',wage:36000},
    {name:'Crystal Palace',level:79,league:'Premier League',style:'Counter',wage:56000},
    {name:'Everton',level:78,league:'Premier League',style:'Direct',wage:54000},
    {name:'Fulham',level:79,league:'Premier League',style:'Balanced',wage:56000},
    {name:'Hull City',level:73,league:'Premier League',style:'Direct',wage:34000},
    {name:'Ipswich Town',level:74,league:'Premier League',style:'High energy',wage:35000},
    {name:'Leeds United',level:78,league:'Premier League',style:'High press',wage:52000},
    {name:'Liverpool',level:89,league:'Premier League',style:'High press',wage:100000},
    {name:'Manchester City',level:90,league:'Premier League',style:'Possession',wage:110000},
    {name:'Manchester United',level:85,league:'Premier League',style:'Fast build-up',wage:90000},
    {name:'Newcastle United',level:84,league:'Premier League',style:'High press',wage:82000},
    {name:'Nottingham Forest',level:78,league:'Premier League',style:'Counter',wage:52000},
    {name:'Sunderland',level:75,league:'Premier League',style:'High energy',wage:39000},
    {name:'Tottenham Hotspur',level:84,league:'Premier League',style:'Attacking',wage:82000}
  ];

  // Replace fictional transfer destinations with current Premier League clubs.
  try{clubs.splice(0,clubs.length,...PREMIER_LEAGUE_CLUBS);}catch(_){ }

  // New careers default to a real Premier League club.
  try{
    base.club='Arsenal';
    base.timeline=['Signed first professional contract at Arsenal.'];
    base.news=['Academy graduate tipped for first-team minutes in the Premier League.'];
  }catch(_){ }

  function addClubSelector(){
    const form=document.querySelector('#creator .form-grid');
    if(!form||document.getElementById('startingClub'))return;
    const label=document.createElement('label');
    label.innerHTML=`Starting club<select id="startingClub">${PREMIER_LEAGUE_CLUBS.map(c=>`<option${c.name==='Arsenal'?' selected':''}>${c.name}</option>`).join('')}</select>`;
    const difficulty=document.getElementById('difficulty')?.closest('label');
    if(difficulty)form.insertBefore(label,difficulty);else form.appendChild(label);
  }

  function wrapCareerStart(){
    const btn=document.getElementById('startBtn');
    if(!btn||btn.dataset.plWrapped)return;
    const original=btn.onclick;
    btn.onclick=()=>{
      const chosen=document.getElementById('startingClub')?.value||'Arsenal';
      original?.();
      if(typeof S!=='undefined'&&S){
        S.club=chosen;
        S.leagueName='Premier League';
        S.leagueTeams=PREMIER_LEAGUE_CLUBS.map(c=>c.name);
        S.leagueTable=S.leagueTeams.map(name=>({name,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}));
        S.leagueRound=1;S.leagueSeasonMatches=0;S.currentOpponent=null;
        S.timeline=[`${S.path}: joined the senior squad at ${chosen}.`];
        S.news=[`${S.first} ${S.last}, ${S.age}, begins a Premier League career at ${chosen}.`];
        try{save();render();}catch(_){ }
      }
    };
    btn.dataset.plWrapped='1';
  }

  addClubSelector();wrapCareerStart();
  setTimeout(()=>{addClubSelector();wrapCareerStart();},250);
  window.RTG_PREMIER_LEAGUE_CLUBS=PREMIER_LEAGUE_CLUBS.map(c=>c.name);
})();