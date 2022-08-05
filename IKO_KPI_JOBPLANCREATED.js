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
    resp.target = 25;
    // get KPI data
    sql = "SELECT isnull(jobplandata.mmonth, iko_calendar.month) mmonth " + 
    "	,isnull(jobplandata.yyear, iko_calendar.year) yyear " + 
    "	,isnull(jobplandata.totaljpcount, 0) totaljpcount " + 
    "FROM iko_Calendar " + 
    "LEFT JOIN ( " + 
    "	SELECT DATEPART(month, jobplan.pluscchangedate) mmonth " + 
    "		,DATEPART(year, jobplan.pluscchangedate) yyear " + 
    "		,count(DISTINCT jpnum) totaljpcount " + 
    "	FROM jobplan " + 
    "	WHERE siteid = 'GI' " + 
    "		AND ( " + 
    "			cast(jobplan.pluscchangedate AS DATE) >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "			AND cast(jobplan.pluscchangedate AS DATE) <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "			) " + 
    "	GROUP BY DATEPART(month, jobplan.pluscchangedate) " + 
    "		,DATEPART(year, jobplan.pluscchangedate) " + 
    "	) jobplandata ON iko_calendar.year = jobplandata.yyear " + 
    "	AND iko_calendar.month = jobplandata.mmonth " + 
    "WHERE ( " + 
    "		cast(iko_calendar.month AS INT) >= cast(datepart(month, cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE)) AS INT) " + 
    "		AND cast(iko_calendar.year AS INT) = cast(datepart(year, cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE)) AS INT) " + 
    "		OR cast(iko_calendar.month AS INT) <= cast(datepart(month, DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0))) AS INT) " + 
    "		AND cast(iko_calendar.year AS INT) = cast(datepart(year, DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0))) AS INT) " + 
    "		) ";

    result = s.executeQuery(sql);
    temp = [];
    while (result.next()) {
        temp.push({
            'year': result.getInt('yyear'),
            'month': result.getInt('mmonth'),
            'total': result.getInt('totaljpcount'),
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