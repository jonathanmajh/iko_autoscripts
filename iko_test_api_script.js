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
    sql = "DECLARE @kpiname CHAR(50) " + 
    " " + 
    "SET @kpiname = 'gh' + '-WONOTBYPLANNER' " + 
    " " + 
    "SELECT DATEPART(month, kpihistory.recordedon) mmonth " + 
    "	,DATEPART(year, kpihistory.recordedon) yyear " + 
    "	,max(kpihistory.kpivalue) percentage " + 
    "FROM kpihistory " + 
    "JOIN kpimain ON kpihistory.kpimainid = kpimain.kpimainid " + 
    "JOIN ( " + 
    "	SELECT kpihistory.kpihistoryid " + 
    "		,kpihistory.recordedon " + 
    "		,ROW_NUMBER() OVER ( " + 
    "			PARTITION BY datepart(month, kpihistory.recordedon) " + 
    "			,datepart(year, kpihistory.recordedon) ORDER BY recordedon DESC " + 
    "			) AS rowNum " + 
    "	FROM kpihistory " + 
    "	JOIN kpimain ON kpihistory.kpimainid = kpimain.kpimainid " + 
    "	WHERE kpimain.kpiname = @kpiname " + 
    "	) kpishistmainlatest ON kpihistory.kpihistoryid = kpishistmainlatest.kpihistoryid " + 
    "WHERE kpimain.kpiname = @kpiname " + 
    "	AND kpishistmainlatest.rowNum = 1 " + 
    "	AND ( " + 
    "		DATEPART(month, kpihistory.recordedon) >= cast(datepart(month, cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE)) AS INT) " + 
    "		AND DATEPART(year, kpihistory.recordedon) = cast(datepart(year, cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE)) AS INT) " + 
    "		OR DATEPART(month, kpihistory.recordedon) <= cast(datepart(month, DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0))) AS INT) " + 
    "		AND DATEPART(year, kpihistory.recordedon) = cast(datepart(year, DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0))) AS INT) " + 
    "		) " + 
    "GROUP BY DATENAME(month, kpihistory.recordedon) + '-' + DATENAME(year, kpihistory.recordedon) " + 
    "	,DATEPART(month, kpihistory.recordedon) " + 
    "	,DATEPART(year, kpihistory.recordedon)";

    result = s.executeQuery(sql);
    temp = [];
    while (result.next()) {
        temp.push({
            'year': result.getInt('yyear'),
            'month': result.getInt('mmonth'),
            'maximoprline': result.getInt('maximoprline'),
            'mapicsprline': result.getInt('mapicsprline'),
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