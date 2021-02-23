from java.util import Calendar
from java.util import Date

# section for request date
if status == 'ISSUED':
    stat_date = mbo.getDate('STATUSDATE')
    cal = Calendar.getInstance()
    cal.setTime(stat_date)
    cal.add(Calendar.MINUTE, +5)
    new_date = cal.getTime()
    request_date = new_date

# section for requestedby
if status == 'CAN' or status == 'CLOSE':
    pass
elif 'MAXADMIN' not in requestedby:
    pass
else:
    planners = mbo.getMboSet("$SITEPLANNER", "PERSONGROUPTEAM", "USEFORSITE='" + siteid + "' AND SITEDEFAULT=1 AND PERSONGROUP='PLANNER'")
    planner = planners.getMbo(0)
    planner = planner.getString("RESPPARTY")
    requestedby = planner
