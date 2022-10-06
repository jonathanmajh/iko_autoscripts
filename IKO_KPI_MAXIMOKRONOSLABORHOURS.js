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
var ignoresites = ['GX'];
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
    sql = "SELECT main.mmonth " + 
    "	,main.yyear " + 
    "	,main.kronoshours " + 
    "	,main.maximohours " + 
    "	,main.percentage " + 
    "	,compwo.compwocount CompletedWOCount " + 
    "FROM ( " + 
    "	SELECT kronos.mmonth " + 
    "		,kronos.yyear " + 
    "		,sum(isnull(kronos.kronoshours, 0)) kronoshours " + 
    "		,sum(isnull(maximo.maximohours, 0)) maximohours " + 
    "		,sum(isnull(maximo.maximohours, 0)) / sum(isnull(kronos.kronoshours, 0)) percentage " + 
    "	FROM ( " + 
    "		SELECT labor.worksite " + 
    "			,DATEPART(month, startdate) mmonth " + 
    "			,DATEPART(year, startdate) yyear " + 
    "			,attendance.laborcode " + 
    "			,sum(laborhours) kronoshours " + 
    "		FROM attendance " + 
    "		LEFT JOIN labor ON attendance.laborcode = labor.laborcode " + 
    "		WHERE lower(labor.worksite) = '" + site + "' " + 
    "			AND ( " + 
    "				startdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "				AND startdate <= cast(getdate() AS DATE) " + 
    "				) " + 
    "			AND labor.iko_kronos = '1' " + 
    "		GROUP BY labor.worksite " + 
    "			,DATEPART(month, startdate) " + 
    "			,DATEPART(year, startdate) " + 
    "			,attendance.laborcode " + 
    "		) kronos " + 
    "	LEFT JOIN ( " + 
    "		SELECT w.siteid " + 
    "			,DATENAME(month, al.startdate) + '-' + DATENAME(year, al.startdate) monthyear " + 
    "			,DATEPART(month, al.startdate) mmonth " + 
    "			,DATEPART(year, al.startdate) yyear " + 
    "			,upper(p.lastname) + ', ' + upper(p.firstname) AS personname " + 
    "			,al.laborcode " + 
    "			,cast(isnull(sum(regularhrs), 0) + isnull(sum(premiumpayhours), 0) AS DECIMAL(12, 2)) maximohours " + 
    "		FROM workorder w " + 
    "		INNER JOIN labtrans al ON w.wonum = al.refwo " + 
    "			AND w.siteid = al.siteid " + 
    "		INNER JOIN person p ON al.laborcode = p.personid " + 
    "		WHERE al.vendor IS NULL " + 
    "			AND w.siteid = '" + site + "' " + 
    "			AND ( " + 
    "				al.startdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "				AND al.startdate <= cast(getdate() AS DATE) " + 
    "				) " + 
    "			AND al.craft <> 'CORP' " + 
    "		GROUP BY w.siteid " + 
    "			,p.lastname " + 
    "			,p.firstname " + 
    "			,al.laborcode " + 
    "			,DATENAME(month, al.startdate) + '-' + DATENAME(year, al.startdate) " + 
    "			,DATEPART(month, al.startdate) " + 
    "			,DATEPART(year, al.startdate) " + 
    "		) maximo ON kronos.worksite = maximo.siteid " + 
    "		AND kronos.laborcode = maximo.laborcode " + 
    "		AND kronos.mmonth = maximo.mmonth " + 
    "		AND kronos.yyear = maximo.yyear " + 
    "	GROUP BY kronos.mmonth " + 
    "		,kronos.yyear " + 
    "	) main " + 
    "LEFT JOIN ( " + 
    "	SELECT w.siteid " + 
    "		,DATEPART(month, al.startdate) mmonth " + 
    "		,DATEPART(year, al.startdate) yyear " + 
    "		,count(DISTINCT w.wonum) AS compwocount " + 
    "	FROM workorder w " + 
    "	INNER JOIN labtrans al ON w.wonum = al.refwo " + 
    "		AND w.siteid = al.siteid " + 
    "	INNER JOIN person p ON al.laborcode = p.personid " + 
    "	WHERE al.vendor IS NULL " + 
    "		AND w.siteid = '" + site + "' " + 
    "		AND ( " + 
    "			al.startdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
    "			AND al.startdate <= cast(getdate() AS DATE) " + 
    "			) " + 
    "		AND al.craft <> 'CORP' " + 
    "	GROUP BY w.siteid " + 
    "		,DATEPART(month, al.startdate) " + 
    "		,DATEPART(year, al.startdate) " + 
    "	) compwo ON main.mmonth = compwo.mmonth " + 
    "	AND main.yyear = compwo.yyear";

    result = s.executeQuery(sql);
    temp = [];
    while (result.next()) {
        temp.push({
            'year': result.getInt('yyear'),
            'month': result.getInt('mmonth'),
            'kronoshours': result.getDouble('kronoshours'),
            'maximohours': result.getDouble('maximohours'),
            'percentage': result.getDouble('percentage'),
            'completedwocount': result.getInt('CompletedWOCount'),
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