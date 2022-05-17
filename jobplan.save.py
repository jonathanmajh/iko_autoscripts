from java.util import Calendar
from java.text import SimpleDateFormat

if interactive == True:
    timeStamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss").format(Calendar.getInstance().getTime())
    if mboname == 'JOBPLAN':
        mbo.setValue('PLUSCCHANGEBY', user)
        mbo.setValue('PLUSCCHANGEDATE', timeStamp)
    else:
        jpnum = mbo.getString('jpnum')
        jobplan = mbo.getMboSet("$JOBPLAN", "JOBPLAN", "JPNUM='" + jpnum + "'")
        if jobplan.count() == 1:
            jobplan = jobplan.getMbo(0)
            jobplan.setValue('PLUSCCHANGEBY', user)
            jobplan.setValue('PLUSCCHANGEDATE', timeStamp)