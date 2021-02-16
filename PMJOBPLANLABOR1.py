jlset = mbo.getMboSet("$JOBLABOR", "JOBLABOR", "LABORCODE='" + userid + "'")
count = jlset.count()
if count > 0:
    jpnums = []
    pms = []
    for i in range(count):
        line = jlset.getMbo(i)
        jpnums.append(line.getString("JPNUM"))
        pmset = mbo.getMboSet("$PM", "PM", "JPNUM='" + line.getString("JPNUM") + "' AND STATUS='ACTIVE'")
        pmcount = pmset.count()
        for i in range(pmcount):
            pmline = pmset.getMbo(i)
            pms.append(pmline.getString("PMNUM"))
    if len(pms) > 0:
        errorgroup = "CUSTOM"
        errorkey = "ActivePMJobPlanLabor"
        params = [userid,",".join(pms)]