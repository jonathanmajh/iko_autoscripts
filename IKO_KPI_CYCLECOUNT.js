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
    resp.error = site + ' is not a valid site ID, Valid Site IDs: ' + sites;
    var responseBody = JSON.stringify(resp);
} else {
    // get target
    // sql = "select floor(count(itemnum)*0.1) as target from inventory where siteid = '" + site + "' and minlevel > -1 and reorder = 1";
    //result = s.executeQuery(sql);
   //  temp = [];
   // while (result.next()) {
    //    temp.push(result.getInt('target'));
   // }
    //result.close();
    resp.target = 0.1;
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
"	,coalesce(totalphyscount, 0) AS totalphyscount " + 
"	,coalesce(percentoftarget, 0) AS percentoftarget " + 
"FROM ( " + 
"	SELECT * " + 
"	FROM yearmonth " + 
"	) tt1 " + 
"LEFT JOIN ( " + 
"	SELECT invtrans.mmonth " + 
"		,invtrans.yyear " + 
"		,isnull(invtrans.totalphyscount, 0) AS totalphyscount " + 
"		,(isnull(invtrans.totalphyscount, 0) / target) AS percentoftarget " + 
"	FROM ( " + 
"		SELECT DATEPART(month, invtrans.transdate) mmonth " + 
"			,DATEPART(year, invtrans.transdate) yyear " + 
"			,count(DISTINCT invtrans.itemnum) totalphyscount " + 
"		FROM invtrans " + 
"		WHERE siteid = '" + site + "' " + 
"			AND transtype = 'PCOUNTADJ' " + 
"			AND ( " + 
"				invtrans.transdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
"				AND invtrans.transdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
"				) " + 
"		GROUP BY DATEPART(month, invtrans.transdate) " + 
"			,DATEPART(year, invtrans.transdate) " + 
"		) invtrans " + 
"	LEFT JOIN ( " + 
"		SELECT floor(count(itemnum) * 1.0) AS target " + 
"		FROM inventory " + 
"		WHERE minlevel > - 1 " + 
"			AND reorder = 1 " + 
"			AND siteid = '" + site + "' " + 
"		GROUP BY siteid " + 
"		) t1 ON 1 = 1 " + 
"	) tt2 ON tt1.month = tt2.mmonth " + 
"	AND tt1.year = tt2.yyear";
    result = s.executeQuery(sql);
    temp = [];
    while (result.next()) {
        temp.push({
            'year': result.getInt('yyear'),
            'month': result.getInt('mmonth'),
            'totalphyscount': result.getInt('totalphyscount'),
            'percentage': result.getDouble('percentoftarget'),
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