importPackage(Packages.psdi.server);

var resp = {};
var site = request.getQueryParam("site");
var conKey = MXServer.getMXServer().getSystemUserInfo().getConnectionKey();
var con = MXServer.getMXServer().getDBManager().getConnection(conKey);
var s = con.createStatement();
// to prevent sql injection, get list of sites and see if parameter is in list
var sites = [];
var sql = "select siteid from site";
var result = s.executeQuery(sql);
while (result.next()) {
    sites.push(result.getString('siteid') + '');
}
if (sites.indexOf(site + '') == -1) {
    resp.error = typeof site + ' Site ID is not valid, Valid Site IDs: ' + sites;
    var responseBody = JSON.stringify(resp);
} else {
    resp.target = 0.8;
    // get KPI data
    sql = "WITH yearmonth ( " + 
"	year " + 
"	,month " + 
"	) " + 
"AS ( " + 
"	SELECT datepart(year, dates) AS year " + 
"		,datepart(month, dates) AS month " + 
"	FROM ( " + 
"		VALUES (dateadd(month, - 1, getdate())) " + 
"			,(dateadd(month, - 2, getdate())) " + 
"			,(dateadd(month, - 3, getdate())) " + 
"			,(dateadd(month, - 4, getdate())) " + 
"			,(dateadd(month, - 5, getdate())) " + 
"			,(dateadd(month, - 6, getdate())) " + 
"			,(dateadd(month, - 7, getdate())) " + 
"			,(dateadd(month, - 8, getdate())) " + 
"			,(dateadd(month, - 9, getdate())) " + 
"			,(dateadd(month, - 10, getdate())) " + 
"			,(dateadd(month, - 11, getdate())) " + 
"			,(dateadd(month, - 12, getdate())) " + 
"		) AS tt(dates) " + 
"	) " + 
"SELECT year AS yyear " + 
"	,month AS mmonth " + 
"	,coalesce(maximoprline, 0) AS maximoprline " + 
"	,coalesce(mapicsprline, 0) AS mapicsprline " + 
"FROM ( " + 
"	SELECT * " + 
"	FROM yearmonth " + 
"	) tt1 " + 
"LEFT JOIN ( " + 
"SELECT year as yyear " + 
    "	,month as mmonth" + 
    "	,sum(CASE WHEN potype = 'MAXIMO' THEN 1 ELSE 0 END) AS maximoprline " + 
    "	,sum(CASE WHEN potype = 'Regular PO' THEN 1 ELSE 0 END) AS mapicsprline " + 
    "FROM [iko_poinquiryv] " + 
    "WHERE siteid = '" + site + "' " + 
    "	AND itemnum <> '9999998' " + 
    "   AND itemnum NOT LIKE '9S%' " + 
    "   AND datecreated >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy,-1,getdate()))), 0) as date) " +
    "GROUP BY year " + 
    "	,month " + 
    "	,siteid " + 
	"	) tt2 ON tt1.month = tt2.mmonth " + 
"	AND tt1.year = tt2.yyear ";

    result = s.executeQuery(sql);
    temp = [];
    while (result.next()) {
        temp.push({
            'year': result.getInt('yyear'),
            'month': result.getInt('mmonth'),
            'maximoprline': result.getInt('maximoprline'),
            'mapicsprline': result.getInt('mapicsprline'),
            'percentage': result.getInt('maximoprline')/(result.getInt('maximoprline')+result.getInt('mapicsprline')) || 0,
        }
        );
    }
    result.close();
    resp.info = temp;
    s.close();
    con.commit();
    MXServer.getMXServer().getDBManager().freeConnection(conKey);

    var responseBody = JSON.stringify(resp);
}