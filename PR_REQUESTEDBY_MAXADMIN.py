if status == 'CAN' or status == 'CLOSE':
    pass
elif 'MAXADMIN' not in requestedby:
    pass
else:
    planners = mbo.getMboSet("$SITEPLANNER", "PERSONGROUPTEAM", "USEFORSITE='" + siteid + "' AND SITEDEFAULT=1 AND PERSONGROUP='PLANNER'")
    planner = planners.getMbo(0)
    planner = planner.getString("RESPPARTY")
    requestedby = planner
    warngroup = 'custom'
    warnkey = 'debug'
    warnparams = [planner]