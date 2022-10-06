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
"	,coalesce(totalissued, 0) AS totalissued " + 
"	,coalesce(issuedtolowestlevel, 0) AS issuedtolowestlevel " + 
"	,coalesce(invadj, 0) AS invadj " + 
"	,coalesce(Percentage, 0) AS Percentage " + 
"FROM ( " + 
"	SELECT * " + 
"	FROM yearmonth " + 
"	) tt1 " + 
"LEFT JOIN ( " + 
"	SELECT main.mmonth " + 
"		,main.yyear " + 
"		,main.totalsnoofsparepartsissued_count totalissued " + 
"		,isnull(sparepartsissuedtolowestlevel.itemcount, 0) issuedtolowestlevel " + 
"		,isnull(main.totalinvadj_count, 0) invadj " + 
"		,cast((isnull(sparepartsissuedtolowestlevel.itemcount, 0)) AS FLOAT) / (cast((isnull(main.totalsnoofsparepartsissued_count, 0)) AS FLOAT) + cast((isnull(main.totalinvadj_count, 0)) AS FLOAT)) Percentage " + 
"	FROM ( " + 
"		SELECT isnull(totalsnoofsparepartsissued.mmonth, totalinvadj.mmonth) mmonth " + 
"			,ISNULL(totalsnoofsparepartsissued.yyear, totalinvadj.yyear) yyear " + 
"			,isnull(totalsnoofsparepartsissued.itemcount, 0) totalsnoofsparepartsissued_count " + 
"			,isnull(totalinvadj.itemcount, 0) totalinvadj_count " + 
"		FROM ( " + 
"			SELECT DATEPART(month, matusetrans.transdate) mmonth " + 
"				,DATEPART(year, matusetrans.transdate) yyear " + 
"				,count(DISTINCT matusetrans.itemnum) itemcount " + 
"			FROM matusetrans " + 
"			JOIN item ON matusetrans.itemnum = item.itemnum " + 
"			WHERE matusetrans.itemnum NOT LIKE '99%' " + 
"				AND siteid = '" + site + "' " + 
"				AND ( " + 
"					matusetrans.transdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
"					AND matusetrans.transdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
"					) " + 
"				AND item.commoditygroup IN ('401', '408', '409', '425', '500', '510', '511') " + 
"			GROUP BY DATEPART(month, matusetrans.transdate) " + 
"				,DATEPART(year, matusetrans.transdate) " + 
"			) totalsnoofsparepartsissued " + 
"		FULL OUTER JOIN ( " + 
"			SELECT DATEPART(month, invtrans.transdate) mmonth " + 
"				,DATEPART(year, invtrans.transdate) yyear " + 
"				,count(DISTINCT invtrans.invtransid) itemcount " + 
"			FROM invtrans " + 
"			JOIN item ON invtrans.itemnum = item.itemnum " + 
"			WHERE transtype IN ('CURBALADJ', 'RECBALADJ') " + 
"				AND quantity < 0 " + 
"				AND siteid = '" + site + "' " + 
"				AND ( " + 
"					invtrans.transdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
"					AND invtrans.transdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
"					) " + 
"				AND item.commoditygroup IN ('401', '408', '409', '425', '500', '510', '511') " + 
"			GROUP BY DATEPART(month, invtrans.transdate) " + 
"				,DATEPART(year, invtrans.transdate) " + 
"			) totalinvadj ON totalsnoofsparepartsissued.Mmonth = totalinvadj.Mmonth " + 
"			AND totalsnoofsparepartsissued.yyear = totalinvadj.yyear " + 
"		) main " + 
"	LEFT JOIN ( " + 
"		SELECT DATEPART(month, matusetrans.transdate) mmonth " + 
"			,DATEPART(year, matusetrans.transdate) yyear " + 
"			,count(DISTINCT matusetrans.itemnum) itemcount " + 
"		FROM matusetrans " + 
"		JOIN item ON matusetrans.itemnum = item.itemnum " + 
"		LEFT JOIN ( " + 
"			SELECT parent " + 
"				,siteid " + 
"			FROM asset " + 
"			WHERE parent IS NOT NULL " + 
"			GROUP BY parent " + 
"				,siteid " + 
"			) parentassets ON matusetrans.assetnum = parentassets.parent " + 
"			AND matusetrans.siteid = parentassets.siteid " + 
"		WHERE matusetrans.itemnum NOT LIKE '99%' " + 
"			AND matusetrans.siteid = '" + site + "' " + 
"			AND ( " + 
"				matusetrans.transdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy, - 1, getdate()))), 0) AS DATE) " + 
"				AND matusetrans.transdate <= DATEADD(ss, - 1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " + 
"				) " + 
"			AND parentassets.parent IS NULL " + 
"			AND item.commoditygroup IN ('401', '408', '409', '425', '500', '510', '511') " + 
"		GROUP BY DATEPART(month, matusetrans.transdate) " + 
"			,DATEPART(year, matusetrans.transdate) " + 
"		) sparepartsissuedtolowestlevel ON main.mmonth = sparepartsissuedtolowestlevel.mmonth " + 
"		AND main.yyear = sparepartsissuedtolowestlevel.yyear " + 
"	) tt2 ON tt1.month = tt2.mmonth " + 
"	AND tt1.year = tt2.yyear ";

    result = s.executeQuery(sql);
    temp = [];
    while (result.next()) {
        temp.push({
            'year': result.getInt('yyear'),
            'month': result.getInt('mmonth'),
            'issuedtolowestlevel': result.getInt('issuedtolowestlevel'),
            'invadj': result.getInt('invadj'),
            'totalissued': result.getInt('totalissued'),
            'percentage': result.getDouble('Percentage'),
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