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
    sql = "SELECT allpm.mmonth " + 
    "	,allpm.yyear " + 
    "	,sum(isnull(ontimecount, 0)) ontimecount " + 
    "	,sum(cast((isnull(ontimecount, 0)) AS DECIMAL(10, 2)) / cast(allcount AS DECIMAL(10, 2))) percentage " + 
    "FROM ( " + 
    "	SELECT aa.siteid " + 
    "		,DATENAME(month, aa.targcompdate) + '-' + DATENAME(year, aa.targcompdate) monthyear " + 
    "		,DATEPART(month, aa.targcompdate) mmonth " + 
    "		,DATEPART(year, aa.targcompdate) yyear " + 
    "		,COUNT(*) allcount " + 
    "	FROM ( " + 
    "		SELECT siteid " + 
    "			,targcompdate " + 
    "			,wonum " + 
    "		FROM workorder " + 
    "		WHERE ( " + 
    "				istask = 0 " + 
    "				AND ( " + 
    "					STATUS = 'WKIT' " + 
    "					OR STATUS = 'WPCOND' " + 
    "					OR STATUS = 'WSCHED' " + 
    "					OR STATUS = 'CLOSE' " + 
    "					OR STATUS = 'MISSED' " + 
    "					OR STATUS = 'COMP' " + 
    "					OR STATUS = 'HISTEDIT' " + 
    "					OR STATUS = 'DATAINCOMP' " + 
    "					OR STATUS = 'INCOMP' " + 
    "					OR STATUS = 'INPRG' " + 
    "					OR STATUS = 'RELEASED' " + 
    "					OR STATUS = 'HOLD' " + 
    "					OR STATUS = 'WPLAN' " + 
    "					OR STATUS = 'WINVRES' " + 
    "					OR STATUS = 'WMATL' " + 
    "					OR STATUS = 'WSCH' " + 
    "					) " + 
    "				AND ( " + 
    "					woclass = 'WORKORDER' " + 
    "					OR woclass = 'ACTIVITY' " + 
    "					) " + 
    "				AND parent IS NULL " + 
    "				AND (pmnum IS NOT NULL) " + 
    "				) " + 
    "			AND ( " + 
    "				targcompdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "				AND targcompdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "				) " + 
    "			AND siteid = '" + site + "' " + 
    "		) aa " + 
    "	LEFT JOIN ( " + 
    "		SELECT siteid " + 
    "			,targcompdate " + 
    "			,wonum " + 
    "		FROM workorder " + 
    "		WHERE ( " + 
    "				istask = 0 " + 
    "				AND ( " + 
    "					STATUS = 'WKIT' " + 
    "					OR STATUS = 'WPCOND' " + 
    "					OR STATUS = 'WSCHED' " + 
    "					OR STATUS = 'CLOSE' " + 
    "					OR STATUS = 'MISSED' " + 
    "					OR STATUS = 'COMP' " + 
    "					OR STATUS = 'HISTEDIT' " + 
    "					OR STATUS = 'DATAINCOMP' " + 
    "					OR STATUS = 'INCOMP' " + 
    "					OR STATUS = 'INPRG' " + 
    "					OR STATUS = 'RELEASED' " + 
    "					OR STATUS = 'HOLD' " + 
    "					OR STATUS = 'WPLAN' " + 
    "					OR STATUS = 'WINVRES' " + 
    "					OR STATUS = 'WMATL' " + 
    "					OR STATUS = 'WSCH' " + 
    "					) " + 
    "				AND ( " + 
    "					woclass = 'WORKORDER' " + 
    "					OR woclass = 'ACTIVITY' " + 
    "					) " + 
    "				AND parent IS NULL " + 
    "				AND (pmnum IS NOT NULL) " + 
    "				) " + 
    "			AND workorder.historyflag = '0' " + 
    "			AND workorder.iko_overdue = '0' " + 
    "			AND ( " + 
    "				targcompdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "				AND targcompdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "				) " + 
    "			AND siteid = '" + site + "' " + 
    "		) bb ON aa.siteid = bb.siteid " + 
    "		AND aa.wonum = bb.wonum " + 
    "	WHERE bb.wonum IS NULL " + 
    "	GROUP BY aa.siteid " + 
    "		,DATEPART(month, aa.targcompdate) " + 
    "		,DATEPART(year, aa.targcompdate) " + 
    "		,DATENAME(month, aa.targcompdate) " + 
    "		,DATENAME(year, aa.targcompdate) " + 
    "	) allpm " + 
    "LEFT JOIN ( " + 
    "	SELECT siteid " + 
    "		,DATEPART(month, targcompdate) mmonth " + 
    "		,DATEPART(year, targcompdate) yyear " + 
    "		,COUNT(*) ontimecount " + 
    "	FROM workorder " + 
    "	WHERE ( " + 
    "			istask = 0 " + 
    "			AND STATUS = 'CLOSE' " + 
    "			AND ( " + 
    "				woclass = 'WORKORDER' " + 
    "				OR woclass = 'ACTIVITY' " + 
    "				) " + 
    "			AND parent IS NULL " + 
    "			AND iko_overduedays IS NULL " + 
    "			AND (pmnum IS NOT NULL) " + 
    "			) " + 
    "		AND ( " + 
    "			targcompdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "			AND targcompdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "			) " + 
    "		AND siteid = '" + site + "' " + 
    "	GROUP BY siteid " + 
    "		,DATEPART(month, targcompdate) " + 
    "		,DATEPART(year, targcompdate) " + 
    "	) ontime ON allpm.siteid = ontime.siteid " + 
    "	AND allpm.yyear = ontime.yyear " + 
    "	AND allpm.mmonth = ontime.mmonth " + 
    "GROUP BY allpm.mmonth " + 
    "	,allpm.yyear " + 
    "	,allpm.monthyear";

    result = s.executeQuery(sql);
    temp = [];
    while (result.next()) {
        temp.push({
            'year': result.getInt('yyear'),
            'month': result.getInt('mmonth'),
            'ontimecount': result.getInt('ontimecount'),
            'percentage': result.getDouble('percentage'),
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