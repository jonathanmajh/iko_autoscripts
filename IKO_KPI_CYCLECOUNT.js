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
    sql = "select floor(count(itemnum)*0.1) as target from inventory where siteid = '" + site + "' and minlevel > -1 and reorder = 1";
    result = s.executeQuery(sql);
    temp = [];
    while (result.next()) {
        temp.push(result.getInt('target'));
    }
    result.close();
    resp.target = temp;
    // get KPI data
    sql = "select " +
        "invtrans.mmonth " +
        ",invtrans.yyear " +
        ",isnull(invtrans.totalphyscount,0) as totalphyscount " +
        ",(isnull(invtrans.totalphyscount,0)/target) as percentoftarget " +
        "from  " +
        "( " +
        "select  " +
        "DATEPART(month,invtrans.transdate) mmonth " +
        ",DATEPART(year,invtrans.transdate) yyear " +
        ",count(distinct invtrans.itemnum) totalphyscount " +
        "from invtrans  " +
        "where siteid  = '" + site + "' " +
        "and transtype = 'PCOUNTADJ' " +
        "and (invtrans.transdate >= cast(DATEADD(month, DATEDIFF(month, 0, (dateadd(yy,-1,getdate()))), 0) as date)  " +
        "and invtrans.transdate <= DATEADD(ss, -1, DATEADD(month, DATEDIFF(month, 0, getdate()), 0)) " +
        ") " +
        "group by  " +
        "DATEPART(month,invtrans.transdate) " +
        ",DATEPART(year,invtrans.transdate) " +
        ") invtrans " +
        "left join  " +
        "(select floor(count(itemnum)*1.0) as target from inventory where minlevel > -1 and reorder = 1 and siteid = '" + site + "' group by siteid) t1 on 1=1";
    result = s.executeQuery(sql);
    temp = [];
    while (result.next()) {
        temp.push({
            'year': result.getInt('yyear'),
            'month': result.getInt('mmonth'),
            'totalphyscount': result.getInt('totalphyscount'),
            'percentoftarget': result.getDouble('percentoftarget'),
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