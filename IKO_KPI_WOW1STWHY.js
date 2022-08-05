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
    sql = "SELECT allwocount.mmonth " + 
    "	,allwocount.yyear " + 
    "	,allwocount.wocount allwocount " + 
    "	,isnull(whyonecount.wocount, 0) whyonecount " + 
    "	,cast((isnull(whyonecount.wocount, 0)) AS FLOAT) / cast((isnull(allwocount.wocount, 0)) AS FLOAT) percentage " + 
    "FROM ( " + 
    "	SELECT DATEPART(month, workorder.reportdate) mmonth " + 
    "		,DATEPART(year, workorder.reportdate) yyear " + 
    "		,count(DISTINCT workorder.wonum) wocount " + 
    "	FROM workorder " + 
    "	WHERE pmnum IS NULL " + 
    "		AND parent IS NULL " + 
    "		AND istask = '0' " + 
    "		AND ( " + 
    "			workorder.reportdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "			AND workorder.reportdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "			) " + 
    "		AND workorder.siteid = '" + site + "' " + 
    "		AND workorder.worktype <> 'CBM' " + 
    "		AND workorder.origrecordid NOT LIKE 'W%' " + 
    "	GROUP BY DATEPART(month, workorder.reportdate) " + 
    "		,DATEPART(year, workorder.reportdate) " + 
    "	) allwocount " + 
    "LEFT JOIN ( " + 
    "	SELECT DATEPART(month, workorder.reportdate) mmonth " + 
    "		,DATEPART(year, workorder.reportdate) yyear " + 
    "		,count(DISTINCT workorder.wonum) wocount " + 
    "	FROM workorder " + 
    "	WHERE pmnum IS NULL " + 
    "		AND parent IS NULL " + 
    "		AND workorder.IKO_DESC1 <> '' " + 
    "		AND istask = '0' " + 
    "		AND ( " + 
    "			workorder.reportdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "			AND workorder.reportdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "			) " + 
    "		AND workorder.siteid = '" + site + "' " + 
    "		AND workorder.worktype <> 'CBM' " + 
    "		AND workorder.origrecordid NOT LIKE 'W%' " + 
    "	GROUP BY DATEPART(month, workorder.reportdate) " + 
    "		,DATEPART(year, workorder.reportdate) " + 
    "	) whyonecount ON allwocount.mmonth = whyonecount.mmonth " + 
    "	AND allwocount.yyear = whyonecount.yyear";

    result = s.executeQuery(sql);
    temp = [];
    while (result.next()) {
        temp.push({
            'year': result.getInt('yyear'),
            'month': result.getInt('mmonth'),
            'percentage': result.getDouble('percentage'),
            'allwocount': result.getInt('allwocount'),
            'whyonecount': result.getInt('whyonecount'),
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