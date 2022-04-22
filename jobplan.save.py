from java.util import Calendar
from java.text import SimpleDateFormat

if interactive == True:
    timeStamp = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss").format(Calendar.getInstance().getTime())
    mbo.setValue('PLUSCCHANGEBY', user)
    mbo.setValue('PLUSCCHANGEDATE', timeStamp)