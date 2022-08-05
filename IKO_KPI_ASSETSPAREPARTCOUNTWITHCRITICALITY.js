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
    // get KPI data
    sql = "DECLARE @kpinameHI char(50) " + 
    "DECLARE @kpinameMED char(50) " + 
    "DECLARE @kpinameLOW char(50) " + 
    "DECLARE @kpinameBLANK char(50) " + 
    "SET @kpinameHI =  '" + site + "-SPAREPARTSCOUNT-HI' " + 
    "SET @kpinameMED =  '" + site + "-SPAREPARTSCOUNT-MED' " + 
    "SET @kpinameLOW =  '" + site + "-SPAREPARTSCOUNT-LOW' " + 
    "SET @kpinameBLANK =  '" + site + "-SPAREPARTSCOUNT-BLANK' " + 
    "select  " + 
    "DATEPART(month,kpihistory.recordedon) mmonth , DATEPART(year,kpihistory.recordedon) yyear " + 
    ",'HI' as prioritygroup " + 
    ",AVG(kpihistory.kpivalue) sparepartcount " + 
    "from kpihistory  " + 
    "join kpimain " + 
    "on kpihistory.kpimainid = kpimain.kpimainid " + 
    "where kpimain.kpiname = @kpinameHI  " + 
    "and " + 
    "( " + 
    "DATEPART(month,kpihistory.recordedon) >= cast(datepart(month,cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy,-1,getdate()))), 0) as date)) as int) " + 
    "and DATEPART(year,kpihistory.recordedon) = cast(datepart(year,cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy,-1,getdate()))), 0) as date)) as int) " + 
    "or " + 
    "DATEPART(month,kpihistory.recordedon) <= cast(datepart(month,DATEADD(ss, -1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0))   ) as int) " + 
    "and DATEPART(year,kpihistory.recordedon) = cast(datepart(year, DATEADD(ss, -1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0))  ) as int) " + 
    ") " + 
    "group by  " + 
    "DATEPART(month,kpihistory.recordedon)  , DATEPART(year,kpihistory.recordedon)  " + 
    "union " + 
    "select  " + 
    "DATEPART(month,kpihistory.recordedon) mmonth , DATEPART(year,kpihistory.recordedon) yyear " + 
    ",'MED' as prioritygroup " + 
    ",AVG(kpihistory.kpivalue) sparepartcount " + 
    "from kpihistory  " + 
    "join kpimain " + 
    "on kpihistory.kpimainid = kpimain.kpimainid " + 
    "where kpimain.kpiname = @kpinameMED " + 
    "and " + 
    "( " + 
    "DATEPART(month,kpihistory.recordedon) >= cast(datepart(month,cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy,-1,getdate()))), 0) as date)) as int) " + 
    "and DATEPART(year,kpihistory.recordedon) = cast(datepart(year,cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy,-1,getdate()))), 0) as date)) as int) " + 
    "or " + 
    "DATEPART(month,kpihistory.recordedon) <= cast(datepart(month,DATEADD(ss, -1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0))   ) as int) " + 
    "and DATEPART(year,kpihistory.recordedon) = cast(datepart(year, DATEADD(ss, -1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0))  ) as int) " + 
    ") " + 
    "group by  " + 
    "DATEPART(month,kpihistory.recordedon)  , DATEPART(year,kpihistory.recordedon)  " + 
    "union " + 
    "select  " + 
    "DATEPART(month,kpihistory.recordedon) mmonth , DATEPART(year,kpihistory.recordedon) yyear " + 
    ",'LOW' as prioritygroup " + 
    ",AVG(kpihistory.kpivalue) sparepartcount " + 
    "from kpihistory  " + 
    "join kpimain " + 
    "on kpihistory.kpimainid = kpimain.kpimainid " + 
    "where kpimain.kpiname = @kpinameLOW " + 
    "and " + 
    "( " + 
    "DATEPART(month,kpihistory.recordedon) >= cast(datepart(month,cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy,-1,getdate()))), 0) as date)) as int) " + 
    "and DATEPART(year,kpihistory.recordedon) = cast(datepart(year,cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy,-1,getdate()))), 0) as date)) as int) " + 
    "or " + 
    "DATEPART(month,kpihistory.recordedon) <= cast(datepart(month,DATEADD(ss, -1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0))   ) as int) " + 
    "and DATEPART(year,kpihistory.recordedon) = cast(datepart(year, DATEADD(ss, -1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0))  ) as int) " + 
    ") " + 
    "group by  " + 
    "DATEPART(month,kpihistory.recordedon)  , DATEPART(year,kpihistory.recordedon)  " + 
    "union " + 
    "select  " + 
    "DATEPART(month,kpihistory.recordedon) mmonth , DATEPART(year,kpihistory.recordedon) yyear " + 
    ",'BLANK' as prioritygroup " + 
    ",AVG(kpihistory.kpivalue) sparepartcount " + 
    "from kpihistory  " + 
    "join kpimain " + 
    "on kpihistory.kpimainid = kpimain.kpimainid " + 
    "where kpimain.kpiname = @kpinameBLANK " + 
    "and " + 
    "( " + 
    "DATEPART(month,kpihistory.recordedon) >= cast(datepart(month,cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy,-1,getdate()))), 0) as date)) as int) " + 
    "and DATEPART(year,kpihistory.recordedon) = cast(datepart(year,cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy,-1,getdate()))), 0) as date)) as int) " + 
    "or " + 
    "DATEPART(month,kpihistory.recordedon) <= cast(datepart(month,DATEADD(ss, -1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0))   ) as int) " + 
    "and DATEPART(year,kpihistory.recordedon) = cast(datepart(year, DATEADD(ss, -1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0))  ) as int) " + 
    ") " + 
    "group by  " + 
    "DATEPART(month,kpihistory.recordedon)  , DATEPART(year,kpihistory.recordedon) ";
    result = s.executeQuery(sql);
    temp = [];
    while (result.next()) {
        temp.push({
            'year': result.getInt('yyear'),
            'month': result.getInt('mmonth'),
            'prioritygroup': result.getString('prioritygroup') + '',
            'sparepartcount': result.getInt('sparepartcount'),
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