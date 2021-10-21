if interactive == True:
    exclude = ['CORPORATE','DATAENTRY','DIRECTOR','ENGINEER','MAINTSUPER','MAINTSUPER-MOBILE','MAXADMINXX','MAXTECH','PLANNER','PRODSUPER','REGIONMGR','SCHEDULER','SITEMGR','STOREROOM','SUPER/PLANNER','SUPERINT','SUPERINT-MOBILE','SUPERUSER']
    groups = []
    user_groups = mbo.getMboSet("$GROUPUSER", "GROUPUSER", "USERID='" + user + "'")
    group = user_groups.moveFirst()
    autofill = True
    while (group):
        groups.append(group.getString("groupname"))
        group = user_groups.moveNext()
    for group in groups:
        if group in exclude:
            autofill = False
            break
    if autofill:
        laborcode = user


    # else:
        # errorgroup = 'custom'
        # errorkey = 'debug'
        # params = [user,",".join(groups)]
    
# debug show error message if not autofilling
# autofill if user in mech + mech mobile
# not in planner, sched,.... loop for this