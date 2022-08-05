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
    resp.target = 0.95;
    // get KPI data
    sql = "SELECT allpm.mmonth " + 
    "	,allpm.yyear " + 
    "	,allpm.priority " + 
    "	,sum(isnull(allassetcount, 0)) allcount " + 
    "	,sum(isnull(ontimeassetcount, 0)) ontimecount " + 
    "FROM ( " + 
    "	SELECT t3.siteid " + 
    "		,t4.priority " + 
    "		,count(t3.assetnum) AS allassetcount " + 
    "		,DATEPART(month, targcompdate) mmonth " + 
    "		,DATEPART(year, targcompdate) yyear " + 
    "	FROM ( " + 
    "		SELECT DISTINCT COALESCE(t2.assetnum, t1.assetnum) AS assetnum " + 
    "			,t1.siteid " + 
    "			,pmnum " + 
    "			,wonum " + 
    "			,description " + 
    "			,targcompdate " + 
    "			,iko_overduedays " + 
    "			,STATUS " + 
    "			,t1.route " + 
    "		FROM ( " + 
    "			SELECT assetnum " + 
    "				,pmnum " + 
    "				,wonum " + 
    "				,description " + 
    "				,targcompdate " + 
    "				,iko_overduedays " + 
    "				,STATUS " + 
    "				,siteid " + 
    "				,route " + 
    "			FROM workorder " + 
    "			WHERE parent IS NULL " + 
    "				AND istask = 0 " + 
    "				AND ( " + 
    "					targcompdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "					AND targcompdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "					) " + 
    "				AND STATUS <> 'REJECTED' " + 
    "			) AS t1 " + 
    "		LEFT JOIN ( " + 
    "			SELECT route " + 
    "				,assetnum " + 
    "				,siteid " + 
    "			FROM route_stop " + 
    "			) AS t2 ON t1.route = t2.route " + 
    "			AND t1.siteid = t2.siteid " + 
    "		) AS t3 " + 
    "	LEFT JOIN ( " + 
    "		SELECT assetnum " + 
    "			,siteid " + 
    "			,priority " + 
    "		FROM asset " + 
    "		) AS t4 ON t3.assetnum = t4.assetnum " + 
    "		AND t3.siteid = t4.siteid " + 
    "	WHERE priority IN (7, 9) " + 
    "		AND t3.siteid = '" + site + "' " + 
    "	GROUP BY t3.siteid " + 
    "		,priority " + 
    "		,DATEPART(month, targcompdate) " + 
    "		,DATEPART(year, targcompdate) " + 
    "	) allpm " + 
    "LEFT JOIN ( " + 
    "	SELECT t3.siteid " + 
    "		,t4.priority " + 
    "		,count(t3.assetnum) AS ontimeassetcount " + 
    "		,DATEPART(month, targcompdate) mmonth " + 
    "		,DATEPART(year, targcompdate) yyear " + 
    "	FROM ( " + 
    "		SELECT DISTINCT COALESCE(t2.assetnum, t1.assetnum) AS assetnum " + 
    "			,t1.siteid " + 
    "			,pmnum " + 
    "			,wonum " + 
    "			,description " + 
    "			,targcompdate " + 
    "			,iko_overduedays " + 
    "			,STATUS " + 
    "			,t1.route " + 
    "		FROM ( " + 
    "			SELECT assetnum " + 
    "				,pmnum " + 
    "				,wonum " + 
    "				,description " + 
    "				,targcompdate " + 
    "				,iko_overduedays " + 
    "				,STATUS " + 
    "				,siteid " + 
    "				,route " + 
    "			FROM workorder " + 
    "			WHERE ( " + 
    "					iko_overduedays IS NULL " + 
    "					OR iko_overduedays = 0 " + 
    "					) " + 
    "				AND parent IS NULL " + 
    "				AND istask = 0 " + 
    "				AND ( " + 
    "					targcompdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "					AND targcompdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "					) " + 
    "				AND STATUS <> 'REJECTED' " + 
    "				AND STATUS IN ('CLOSE', 'FINISHED', 'COMP', 'WAITCLOSE') " + 
    "			) AS t1 " + 
    "		LEFT JOIN ( " + 
    "			SELECT route " + 
    "				,assetnum " + 
    "				,siteid " + 
    "			FROM route_stop " + 
    "			) AS t2 ON t1.route = t2.route " + 
    "			AND t1.siteid = t2.siteid " + 
    "		) AS t3 " + 
    "	LEFT JOIN ( " + 
    "		SELECT assetnum " + 
    "			,siteid " + 
    "			,priority " + 
    "		FROM asset " + 
    "		) AS t4 ON t3.assetnum = t4.assetnum " + 
    "		AND t3.siteid = t4.siteid " + 
    "	WHERE priority IN (7, 9) " + 
    "		AND t3.siteid = '" + site + "' " + 
    "	GROUP BY t3.siteid " + 
    "		,priority " + 
    "		,DATEPART(month, targcompdate) " + 
    "		,DATEPART(year, targcompdate) " + 
    "	) ontime ON allpm.siteid = ontime.siteid " + 
    "	AND allpm.yyear = ontime.yyear " + 
    "	AND allpm.mmonth = ontime.mmonth " + 
    "	AND allpm.priority = ontime.priority " + 
    "GROUP BY allpm.mmonth " + 
    "	,allpm.yyear " + 
    "	,allpm.priority";

    result = s.executeQuery(sql);
    temp = [];
    while (result.next()) {
        temp.push({
            'year': result.getInt('yyear'),
            'month': result.getInt('mmonth'),
            'priority': result.getInt('priority'),
            'allcount': result.getInt('allcount'),
            'ontimecount': result.getInt('ontimecount'),
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