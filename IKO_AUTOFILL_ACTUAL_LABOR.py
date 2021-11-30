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
        try:
            laborcode = user
        except Exception:
            laborcode = ''


# from psdi.mbo import Mbo

# if interactive == True:
    # set = mbo.getMboSet('LABTRANS')
    # lab = set.add()
    # errorgroup = 'custom'
    # errorkey = 'debug'
    # params = ['script working!!']
    # if lab is not None:
        # exclude = ['CORPORATE','DATAENTRY','DIRECTOR','ENGINEER','MAINTSUPER','MAINTSUPER-MOBILE','MAXADMINXX','MAXTECH','PLANNER','PRODSUPER','REGIONMGR','SCHEDULER','SITEMGR','STOREROOM','SUPER/PLANNER','SUPERINT','SUPERINT-MOBILE','SUPERUSER']
        # groups = []
        # user_groups = mbo.getMboSet("$GROUPUSER", "GROUPUSER", "USERID='" + user + "'")
        # group = user_groups.moveFirst()
        # autofill = True
        # while (group):
            # groups.append(group.getString("groupname"))
            # group = user_groups.moveNext()
        # for group in groups:
            # if group in exclude:
                # autofill = False
                # break
        # if autofill:
            # lab.setValue("laborcode", user)


    # else:
        # errorgroup = 'custom'
        # errorkey = 'debug'
        # params = [user,",".join(groups)]
    
# debug show error message if not autofilling
# autofill if user in mech + mech mobile
# not in planner, sched,.... loop for this