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
    sql = "SELECT year " + 
    "	,month " + 
    "	,sum(CASE WHEN potype = 'MAXIMO' THEN 1 ELSE 0 END) AS maximoprline " + 
    "	,sum(CASE WHEN potype = 'Regular PO' THEN 1 ELSE 0 END) AS mapicsprline " + 
    "FROM [iko_poinquiryv] " + 
    "WHERE siteid = '" + site + "' " + 
    "	AND itemnum <> '9999998' " + 
    "	AND itemnum NOT LIKE '9S%' " + 
    "GROUP BY year " + 
    "	,month " + 
    "	,siteid " + 
    " " + 
    "UNION " + 
    " " + 
    "SELECT year " + 
    "	,month " + 
    "	,maximoprline " + 
    "	,mapicsprline " + 
    "FROM [iko_poinquiryv_historical] " + 
    "WHERE siteid = '" + site + "'";

    result = s.executeQuery(sql);
    temp = [];
    while (result.next()) {
        temp.push({
            'year': result.getInt('year'),
            'month': result.getInt('month'),
            'maximoprline': result.getInt('maximoprline'),
            'mapicsprline': result.getInt('mapicsprline'),
            'percentage': result.getInt('maximoprline')/(result.getInt('maximoprline')+result.getInt('mapicsprline')),
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