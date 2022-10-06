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
"	,coalesce(alllaborhours, 0) AS alllaborhours " + 
"	,coalesce(routestoplaborhours, 0) AS routestoplaborhours " + 
"	,coalesce(lowestlevelassetlaborhours, 0) AS lowestlevelassetlaborhours " + 
"	,coalesce(notlowestlevelassetlaborhours, 0) AS notlowestlevelassetlaborhours " + 
"FROM ( " + 
"	SELECT * " + 
"	FROM yearmonth " + 
"	) tt1 " + 
"LEFT JOIN ( " + 
"SELECT totalwocount.yyear " + 
    "	,totalwocount.mmonth " + 
    "	,totalwocount.laborhours alllaborhours " + 
    "	,isnull(workorderwithroutestop.laborhours, 0) routestoplaborhours " + 
    "	,isnull(workorderlowestlevelasset.laborhours, 0) lowestlevelassetlaborhours " + 
    "	,isnull(workordernotlowestlevelasset.laborhours, 0) notlowestlevelassetlaborhours " + 
    "FROM ( " + 
    "	SELECT DATEPART(month, labtrans.startdate) mmonth " + 
    "		,DATEPART(year, labtrans.startdate) yyear " + 
    "		,sum(isnull(regularhrs, 0) + isnull(premiumpayhours, 0)) laborhours " + 
    "	FROM workorder wo " + 
    "	JOIN asset a ON wo.assetnum = a.assetnum " + 
    "		AND wo.siteid = a.siteid " + 
    "	JOIN labtrans ON wo.wonum = labtrans.refwo " + 
    "		AND wo.siteid = labtrans.siteid " + 
    "	WHERE wo.siteid = '" + site + "' " + 
    "		AND ( " + 
    "			labtrans.startdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "			AND labtrans.startdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "			) " + 
    "		AND wo.parent IS NULL " + 
    "	GROUP BY DATEPART(month, labtrans.startdate) " + 
    "		,DATEPART(year, labtrans.startdate) " + 
    "	) totalwocount " + 
    "LEFT JOIN ( " + 
    "	SELECT DATEPART(month, labtrans.startdate) mmonth " + 
    "		,DATEPART(year, labtrans.startdate) yyear " + 
    "		,sum(isnull(regularhrs, 0) + isnull(premiumpayhours, 0)) laborhours " + 
    "	FROM workorder wo " + 
    "	JOIN asset a ON wo.assetnum = a.assetnum " + 
    "		AND wo.siteid = a.siteid " + 
    "	JOIN labtrans ON wo.wonum = labtrans.refwo " + 
    "		AND wo.siteid = labtrans.siteid " + 
    "	JOIN ( " + 
    "		SELECT parent " + 
    "			,siteid " + 
    "		FROM asset " + 
    "		WHERE siteid = '" + site + "' " + 
    "			AND parent IS NOT NULL " + 
    "		GROUP BY parent " + 
    "			,siteid " + 
    "		) parentassets ON a.assetnum = parentassets.parent " + 
    "		AND a.siteid = parentassets.siteid " + 
    "	JOIN pm ON wo.pmnum = pm.pmnum " + 
    "		AND wo.siteid = pm.siteid " + 
    "	JOIN routes ON pm.route = routes.route " + 
    "		AND pm.siteid = routes.siteid " + 
    "	JOIN ( " + 
    "		SELECT route " + 
    "			,siteid " + 
    "			,min(route_stopid) route_stopid " + 
    "		FROM route_stop " + 
    "		WHERE siteid = '" + site + "' " + 
    "		GROUP BY route " + 
    "			,siteid " + 
    "		) hasroutestop ON routes.route = hasroutestop.route " + 
    "		AND routes.siteid = hasroutestop.siteid " + 
    "	WHERE wo.siteid = '" + site + "' " + 
    "		AND wo.parent IS NULL " + 
    "		AND ( " + 
    "			labtrans.startdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "			AND labtrans.startdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "			) " + 
    "	GROUP BY DATEPART(month, labtrans.startdate) " + 
    "		,DATEPART(year, labtrans.startdate) " + 
    "	) workorderwithroutestop ON totalwocount.mmonth = workorderwithroutestop.mmonth " + 
    "	AND totalwocount.yyear = workorderwithroutestop.yyear " + 
    "LEFT JOIN ( " + 
    "	SELECT DATEPART(month, labtrans.startdate) mmonth " + 
    "		,DATEPART(year, labtrans.startdate) yyear " + 
    "		,sum(isnull(regularhrs, 0) + isnull(premiumpayhours, 0)) laborhours " + 
    "	FROM workorder wo " + 
    "	JOIN asset a ON wo.assetnum = a.assetnum " + 
    "		AND wo.siteid = a.siteid " + 
    "	JOIN labtrans ON wo.wonum = labtrans.refwo " + 
    "		AND wo.siteid = labtrans.siteid " + 
    "	LEFT JOIN ( " + 
    "		SELECT parent " + 
    "			,siteid " + 
    "		FROM asset " + 
    "		WHERE siteid = '" + site + "' " + 
    "			AND parent IS NOT NULL " + 
    "		GROUP BY parent " + 
    "			,siteid " + 
    "		) parentassets ON a.assetnum = parentassets.parent " + 
    "		AND a.siteid = parentassets.siteid " + 
    "	WHERE wo.siteid = '" + site + "' " + 
    "		AND ( " + 
    "			labtrans.startdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "			AND labtrans.startdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "			) " + 
    "		AND wo.parent IS NULL " + 
    "		AND parentassets.parent IS NULL " + 
    "	GROUP BY DATEPART(month, labtrans.startdate) " + 
    "		,DATEPART(year, labtrans.startdate) " + 
    "	) workorderlowestlevelasset ON totalwocount.mmonth = workorderlowestlevelasset.mmonth " + 
    "	AND totalwocount.yyear = workorderlowestlevelasset.yyear " + 
    "LEFT JOIN ( " + 
    "	SELECT DATEPART(month, labtrans.startdate) mmonth " + 
    "		,DATEPART(year, labtrans.startdate) yyear " + 
    "		,sum(isnull(regularhrs, 0) + isnull(premiumpayhours, 0)) laborhours " + 
    "	FROM workorder wo " + 
    "	JOIN asset a ON wo.assetnum = a.assetnum " + 
    "		AND wo.siteid = a.siteid " + 
    "	JOIN labtrans ON wo.wonum = labtrans.refwo " + 
    "		AND wo.siteid = labtrans.siteid " + 
    "	INNER JOIN ( " + 
    "		SELECT parent " + 
    "			,siteid " + 
    "		FROM asset " + 
    "		WHERE siteid = '" + site + "' " + 
    "			AND parent IS NOT NULL " + 
    "		GROUP BY parent " + 
    "			,siteid " + 
    "		) parentassets ON a.assetnum = parentassets.parent " + 
    "		AND a.siteid = parentassets.siteid " + 
    "	WHERE wo.siteid = '" + site + "' " + 
    "		AND ( " + 
    "			labtrans.startdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "			AND labtrans.startdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "			) " + 
    "		AND wo.parent IS NULL " + 
    "	GROUP BY DATEPART(month, labtrans.startdate) " + 
    "		,DATEPART(year, labtrans.startdate) " + 
    "	) workordernotlowestlevelasset ON totalwocount.mmonth = workordernotlowestlevelasset.mmonth " + 
    "	AND totalwocount.yyear = workordernotlowestlevelasset.yyear " +
"	) tt2 ON tt1.month = tt2.mmonth " + 
"	AND tt1.year = tt2.yyear ";

    result = s.executeQuery(sql);
    temp = [];
    while (result.next()) {

        temp.push({
            'year': result.getInt('yyear'),
            'month': result.getInt('mmonth'),
            'alllaborhours': result.getInt('alllaborhours'),
            'routestoplaborhours': result.getInt('routestoplaborhours'),
            'lowestlevelassetlaborhours': result.getInt('lowestlevelassetlaborhours'),
            'notlowestlevelassetlaborhours': result.getInt('notlowestlevelassetlaborhours'),
            'percentage': (result.getInt('lowestlevelassetlaborhours')+result.getInt('routestoplaborhours'))/result.getInt('alllaborhours') || 0,
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