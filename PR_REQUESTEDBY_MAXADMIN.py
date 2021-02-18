# section for request date
if status == 'ISSUED':
    stat_date = mbo.getString('STATUSDATE')
    new_date = stat_date.replace(stat_date.split(':')[1].split(' ')[0], str(int(stat_date.split(':')[1].split(' ')[0]) + 5))
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