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
var ignoresites = ['GX', 'GP','GM','COM','GR'];
while (result.next()) {
    sites.push(result.getString('siteid') + '');
}
if (sites.indexOf(site + '') == -1) {
    resp.error = typeof site + ' Site ID is not valid, Valid Site IDs: ' + sites;
} else if (ignoresites.indexOf(site + '') != -1) {
    resp.target = '-';
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
"	,coalesce(actualnonscheduledhours, 0) AS actualnonscheduledhours " + 
"	,coalesce(actualscheduledhours, 0) AS actualscheduledhours " + 
"	,coalesce(percentage, 0) AS percentage " + 
"FROM ( " + 
"	SELECT * " + 
"	FROM yearmonth " + 
"	) tt1 " + 
"LEFT JOIN ( " + 
"SELECT DATEPART(month, main.startdate) mmonth " + 
    "	,DATEPART(year, main.startdate) yyear " + 
    "	,sum(isnull(actualnonscheduled.laborhrs, 0)) AS actualnonscheduledhours " + 
    "	,sum(isnull(actualscheduled.laborhrs, 0)) AS actualscheduledhours " + 
    "	,percentage = CASE WHEN (sum(isnull(actualscheduled.laborhrs, 0)) + sum(isnull(actualnonscheduled.laborhrs, 0)) = 0) THEN 0 ELSE sum(isnull(actualscheduled.laborhrs, 0)) / (sum(isnull(actualscheduled.laborhrs, 0)) + sum(isnull(actualnonscheduled.laborhrs, 0))) END " + 
    "FROM ( " + 
    "	SELECT workorder.siteid " + 
    "		,workorder.wonum " + 
    "		,workorder.description " + 
    "		,workorder.persongroup " + 
    "		,labtrans.startdate " + 
    "	FROM workorder " + 
    "	JOIN labtrans ON workorder.siteid = labtrans.siteid " + 
    "		AND workorder.wonum = labtrans.refwo " + 
    "	WHERE parent IS NULL " + 
    "		AND istask = '0' " + 
    "		AND ( " + 
    "			labtrans.startdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "			AND labtrans.startdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "			) " + 
    "	GROUP BY workorder.siteid " + 
    "		,workorder.wonum " + 
    "		,workorder.description " + 
    "		,workorder.persongroup " + 
    "		,labtrans.startdate " + 
    "	) main " + 
    "LEFT JOIN ( " + 
    "	SELECT labtrans.siteid " + 
    "		,labtrans.refwo AS wonum " + 
    "		,labtrans.startdate " + 
    "		,SUM(isnull(labtrans.regularhrs, 0) + isnull(labtrans.premiumpayhours, 0)) laborhrs " + 
    "	FROM ( " + 
    "		SELECT siteid " + 
    "			,refwo " + 
    "			,startdate " + 
    "			,regularhrs " + 
    "			,premiumpayhours " + 
    "		FROM labtrans " + 
    "		WHERE ( " + 
    "				labtrans.startdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "				AND labtrans.startdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "				) " + 
    "		) labtrans " + 
    "	LEFT JOIN ( " + 
    "		SELECT wsched.siteid " + 
    "			,wsched.wonum " + 
    "			,released.releasedchangedate " + 
    "			,wsched.startdate " + 
    "		FROM ( " + 
    "			SELECT wostatus.siteid " + 
    "				,wostatus.wonum " + 
    "				,labtrans.startdate " + 
    "				,SUM(isnull(labtrans.regularhrs, 0) + isnull(labtrans.premiumpayhours, 0)) laborhrs " + 
    "			FROM wostatus " + 
    "			JOIN labtrans ON wostatus.siteid = labtrans.siteid " + 
    "				AND wostatus.wonum = labtrans.refwo " + 
    "			WHERE STATUS = 'WSCHED' " + 
    "				AND ( " + 
    "					labtrans.startdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "					AND labtrans.startdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "					) " + 
    "			GROUP BY wostatus.siteid " + 
    "				,wostatus.wonum " + 
    "				,labtrans.startdate " + 
    "			) wsched " + 
    "		JOIN ( " + 
    "			SELECT wostatus.siteid " + 
    "				,wostatus.wonum " + 
    "				,min(changedate) releasedchangedate " + 
    "			FROM wostatus " + 
    "			JOIN labtrans ON wostatus.siteid = labtrans.siteid " + 
    "				AND wostatus.wonum = labtrans.refwo " + 
    "			WHERE STATUS = 'RELEASED' " + 
    "				AND ( " + 
    "					labtrans.startdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "					AND labtrans.startdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "					) " + 
    "			GROUP BY wostatus.siteid " + 
    "				,wostatus.wonum " + 
    "			) released ON wsched.siteid = released.siteid " + 
    "			AND wsched.wonum = released.wonum " + 
    "			AND DATEDIFF(day, releasedchangedate, cast(wsched.startdate AS DATE)) > 0 " + 
    "		) excludescheduled ON labtrans.siteid = excludescheduled.siteid " + 
    "		AND labtrans.refwo = excludescheduled.wonum " + 
    "		AND labtrans.startdate = excludescheduled.startdate " + 
    "	WHERE excludescheduled.siteid IS NULL " + 
    "	GROUP BY labtrans.siteid " + 
    "		,labtrans.refwo " + 
    "		,labtrans.startdate " + 
    "	) actualnonscheduled ON main.startdate = actualnonscheduled.startdate " + 
    "	AND main.siteid = actualnonscheduled.siteid " + 
    "	AND main.wonum = actualnonscheduled.wonum " + 
    "LEFT JOIN ( " + 
    "	SELECT wsched.siteid " + 
    "		,wsched.wonum " + 
    "		,released.releasedchangedate " + 
    "		,wsched.startdate " + 
    "		,wsched.laborhrs " + 
    "	FROM ( " + 
    "		SELECT wostatus.siteid " + 
    "			,wostatus.wonum " + 
    "			,labtrans.startdate " + 
    "			,SUM(isnull(labtrans.regularhrs, 0) + isnull(labtrans.premiumpayhours, 0)) laborhrs " + 
    "		FROM wostatus " + 
    "		JOIN labtrans ON wostatus.siteid = labtrans.siteid " + 
    "			AND wostatus.wonum = labtrans.refwo " + 
    "		WHERE STATUS = 'WSCHED' " + 
    "			AND ( " + 
    "				labtrans.startdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "				AND labtrans.startdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "				) " + 
    "		GROUP BY wostatus.siteid " + 
    "			,wostatus.wonum " + 
    "			,labtrans.startdate " + 
    "		) wsched " + 
    "	JOIN ( " + 
    "		SELECT wostatus.siteid " + 
    "			,wostatus.wonum " + 
    "			,min(changedate) releasedchangedate " + 
    "		FROM wostatus " + 
    "		JOIN labtrans ON wostatus.siteid = labtrans.siteid " + 
    "			AND wostatus.wonum = labtrans.refwo " + 
    "		WHERE STATUS = 'RELEASED' " + 
    "			AND ( " + 
    "				labtrans.startdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "				AND labtrans.startdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
    "				) " + 
    "		GROUP BY wostatus.siteid " + 
    "			,wostatus.wonum " + 
    "		) released ON wsched.siteid = released.siteid " + 
    "		AND wsched.wonum = released.wonum " + 
    "		AND DATEDIFF(day, releasedchangedate, cast(wsched.startdate AS DATE)) > 0 " + 
    "	) actualscheduled ON main.startdate = actualscheduled.startdate " + 
    "	AND main.siteid = actualscheduled.siteid " + 
    "	AND main.wonum = actualscheduled.wonum " + 
    "WHERE main.siteid = '" + site + "' " + 
    "GROUP BY DATENAME(month, main.startdate) + '-' + DATENAME(year, main.startdate) " + 
    "	,DATEPART(month, main.startdate) " + 
    "	,DATEPART(year, main.startdate) " +
	"	) tt2 ON tt1.month = tt2.mmonth " + 
"	AND tt1.year = tt2.yyear ";

    result = s.executeQuery(sql);
    temp = [];
    while (result.next()) {
        temp.push({
            'year': result.getInt('yyear'),
            'month': result.getInt('mmonth'),
            'actualnonscheduledhours': result.getDouble('actualnonscheduledhours'),
            'actualscheduledhours': result.getDouble('actualscheduledhours'),
            'percentage': result.getDouble('percentage'),
        }
        );
    }
    result.close();
    resp.info = temp;
    s.close();
    con.commit();
    MXServer.getMXServer().getDBManager().freeConnection(conKey);
}
var responseBody = JSON.stringify(resp);